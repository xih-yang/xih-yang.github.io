# 11、分布式事务 Seata 教程 - Seata1.4.2之AT模式执行流程解析
- 来源：https://ddkk.com/zhuanlan/transaction/5/11.html
- 分类：分布式事务
- 分组：教程目录
### 启动阶段

**1、** 自动加载各种Bean及配置信息；

**2、** 初始化TM(事务管理器)；

**3、** 初始化RM(资源管理器)；

**4、** 初始化分布式事务客户端完成，代理数据源；

**5、** 连接TC（seata服务端），注册RM；

**6、** 连接TC（seata服务端），注册TM；

**7、** 扫描并动态代理开启了分布式事务的Bean；

### 执行阶段

#### 1. 一阶段TM 开启全局事务

使用了`@GlobalTransactional`注解标识的方式执行时，因为进行了动态代理，会进入到拦截器`GlobalTransactionalInterceptor`。

```java
@GlobalTransactional(rollbackFor = Throwable.class, timeoutMills = 300000)
```

拦截器会获取到当前执行的类、方法、`@GlobalTransactional`注解的属性。

接着事务管理器TM 会开启全局事务，和seata 服务端进行通信，获取到全局事务xid并绑定到当前线程`RootContext`中，标记事务状态为开始。

此时在global_table 表中会插入一条全局事务信息。

#### 2. 一阶段 TM 执行本地事务

开启全局事务后，进入到本地执行方法，执行业务逻辑。

因为Seata 对数据源进行了代理，所以在SQL 执行时，会进入到代理的`PreparedStatement（PreparedStatementProxy）`，首先解析得到 SQL 的类型（UPDATE），表（product），条件（where name = ‘TXC’）等相关的信息。

接着进入到`ExecuteTemplate`，如果是`SELECT`操作，则不处理直接执行，其他操作（INSERT、UPDATE、DELETE、SELECT_FOR_UPDATE）会创建不同的SQL执行器。

比如`UPDATE`操作 会创建`UpdateExecutor`执行器，执行器在执行方法时，会构建前后镜像，比如以下SQL语句：

```java
# 修改当前账户的余额
UPDATE account_tbl  SET user_id=?,money=?  WHERE id=?
```

构建前置镜像时，会通过主键，查询当前数据更新前的状态。

```java
SELECT id, user_id, money FROM account_tbl WHERE id = ? FOR UPDATE
```

前置镜像记录了更新前该记录的各个字段及对应的值。

前置镜像构建以后，执行正常业务操作，然后构建后置镜像，记录了更新后该记录的各个字段及对应的值。

接着会创建一个全局锁、undo_log回滚日志，全局锁创建时，以`表名+主键名`为Key（eg:account_tbl:11111111），undo_log对应的实体类为`SQLUndoLog`，都创建成功之后，RM 资源管理器会进行分支事务注册。

依然是远程请求TC进行分支事务注册。

在远程注册分支事务时，TC 会创建分支事务对象`BranchSession`，并尝试获取当前记录的全局锁，在查询`lock_table`时没有数据，这是会插入一条全局锁数据。

注册后，TC 会在branch_table 表中插入一条分支事务信息。

在lock_table表中插入一条全局锁信息。

分支事务和全局锁插入成功后，分支事务调用 UndoLog 管理器，在当前本地数据库的undo_log 表中，插入一条回滚日志记录。

#### 3. 一阶段 执行远程分支事务

因为使用的是`spring-cloud-starter-alibaba-seata`，自带了Feign 远程传递xid 的支持，在发起Feign 远程请求时，可以看到将xid 塞入了消息头中。

在被调用方，`spring-cloud-starter-alibaba-seata`也提供了支持，使用Spring MVC 中的`HandlerInterceptor`将消息头中的`TX_XID`绑定到`RootContext`中。

和之前一样，远程的分支事务，执行时因为远程这个方法是没有`@GlobalTransactional`注解的，所以不会进入到拦截器，但是代理了数据源，所以在执行SQL 时，还是会进入到代理的`Executor`中。

执行SQL 时，发现存在xid ,则表明这是一个分布式事务，则会进行分支事务注册处理，之后和第二步一样。

调用TC 注册分支事务时，TC 会查询数据库表中全局事务信息，创建分支事务，可以看到被调用方也生成了当前操作记录的全局锁。

最后，该远程服务也在TC 数据库中存储了自己的分支事务信息和全局锁信息。

#### 4. 二阶段-提交

TM事务管理器负责开始全局事务、提交或回滚全局事务。所以二阶段提交和回滚都是由发起全局事务的那个服务负责的，也是就使用了`@GlobalTransactional`注解的服务。

二阶段的核心代码在`TransactionalTemplate`类中：

```java
                    try {
                    	// 执行业务逻辑
                        rs = business.execute();
                    } catch (Throwable var17) {
                        ex = var17;
                        // 发生异常，全局回滚
                        this.completeTransactionAfterThrowing(txInfo, tx, var17);
                        throw var17;
                    }
					// 无异常，全局提交
                    this.commitTransaction(tx);
                    ex = rs;
                    return ex;
```

没有异常，会进行全局提交，这里有个配置参数`client.tm.commitRetryCount`，提交重试次数，提交时依然是调用TC 服务端，提交失败，会重试默认5次。

TC收到TM全局提交请求后，会删除分支事务全局锁记录，开启提交事件发送请求到各分支事务，各分支收到 TC 的分支提交请求，把请求放入一个异步任务的队列中，马上返回提交成功的结果给 TC。异步任务阶段的分支提交请求将异步和批量地删除相应 UNDO LOG 记录。

#### 5. 二阶段-回滚

TM所在服务发起远程调用发生异常时，会向TC 发送回滚请求，大致流程和全局提交一致。

各个分支事务收到 TC 的分支回滚请求，开启一个本地事务，执行如下操作。

- 通过 XID 和 Branch ID 查找到相应的 UNDO LOG 记录。
- 数据校验：拿 UNDO LOG 中的后镜与当前数据进行比较，如果有不同，说明数据被当前全局事务之外的动作做了修改。
- 根据 UNDO LOG 中的前镜像和业务 SQL 的相关信息生成并执行回滚的语句：

update product set name = ‘TXC’ where id = 1;
- 提交本地事务。并把本地事务的执行结果（即分支事务回滚的结果）上报给 TC。
