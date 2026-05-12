# 22、分布式事务 Seata 教程 - XA模式入门案例
- 来源：https://ddkk.com/zhuanlan/transaction/5/22.html
- 分类：分布式事务
- 分组：教程目录
### 前言

在之前，我们试过了AT、TCC 模式，Seata 还支持XA 模式。

### XA 协议

XA协议由Tuxedo首先提出的，并交给X/Open组织，作为资源管理器（数据库）与事务管理器的接口标准。Oracle、Informix、DB2和Sybase等各大数据库厂家都提供对XA的支持。XA协议采用两阶段提交方式来管理分布式事务。XA接口提供资源管理器与事务管理器之间进行通信的标准接口。

XA一共分为两阶段：

- 第一阶段（prepare）：即所有的参与者RM准备执行事务并锁住需要的资源。参与者ready时，向TM报告已准备就绪。
- 第二阶段 (commit/rollback)：当事务管理者™确认所有参与者(RM)都ready后，向所有参与者发送commit命令。

目前主流的数据库基本都支持XA事务，包括mysql、oracle、sqlserver、postgre。

XA是数据库的分布式事务，强一致性，在整个过程中，数据一张锁住状态，即从prepare到commit、rollback的整个过程中，TM一直把持折数据库的锁，如果有其他人要修改数据库的该条数据，就必须等待锁的释放，存在长事务风险。

### Seata XA 模式

#### 前提

支持XA 事务的数据库。

Java 应用，通过 JDBC 访问数据库。

#### 整体机制

在Seata 定义的分布式事务框架内，利用事务资源（数据库、消息服务等）对 XA 协议的支持，以 XA 协议的机制来管理分支事务的一种 事务模式。

执行阶段：

- 可回滚：业务 SQL 操作放在 XA 分支中进行，由资源对 XA 协议的支持来保证 可回滚
- 持久化：XA 分支完成后，执行 XA prepare，同样，由资源对 XA 协议的支持来保证 持久化（即，之后任何意外都不会造成无法回滚的情况）

完成阶段：

- 分支提交：执行 XA 分支的 commit

0 分支回滚：执行 XA 分支的 rollback

#### 工作机制

##### 1. 整体运行机制

XA模式 运行在 Seata 定义的事务框架内：

执行阶段（E xecute）：

- XA start/XA end/XA prepare + SQL + 注册分支

完成阶段（F inish）：

- XA commit/XA rollback

##### 2. 数据源代理

XA模式需要 XAConnection。

获取XAConnection 两种方式：

- 方式一：要求开发者配置 XADataSource
- 方式二：根据开发者的普通 DataSource 来创建

第一种方式，给开发者增加了认知负担，需要为 XA 模式专门去学习和使用 XA 数据源，与 透明化 XA 编程模型的设计目标相违背。

第二种方式，对开发者比较友好，和 AT 模式使用一样，开发者完全不必关心 XA 层面的任何问题，保持本地编程模型即可。

我们优先设计实现第二种方式：数据源代理根据普通数据源中获取的普通 JDBC 连接创建出相应的 XAConnection。

类比AT 模式的数据源代理机制，如下：

但是，第二种方法有局限：无法保证兼容的正确性。

实际上，这种方法是在做数据库驱动程序要做的事情。不同的厂商、不同版本的数据库驱动实现机制是厂商私有的，我们只能保证在充分测试过的驱动程序上是正确的，开发者使用的驱动程序版本差异很可能造成机制的失效。

这点在Oracle 上体现非常明显。参见 Druid issue：https://github.com/alibaba/druid/issues/3707

综合考虑，XA 模式的数据源代理设计需要同时支持第一种方式：基于 XA 数据源进行代理。

类比AT 模式的数据源代理机制，如下：

##### 3. 分支注册

XAstart 需要 Xid 参数。

这个Xid 需要和 Seata 全局事务的 XID 和 BranchId 关联起来，以便由 TC 驱动 XA 分支的提交或回滚。

目前Seata 的 BranchId 是在分支注册过程，由 TC 统一生成的，所以 XA 模式分支注册的时机需要在 XA start 之前。

将来一个可能的优化方向：

- 把分支注册尽量延后。类似 AT 模式在本地事务提交之前才注册分支，避免分支执行失败情况下，没有意义的分支注册。
- 这个优化方向需要 BranchId 生成机制的变化来配合。BranchId 不通过分支注册过程生成，而是生成后再带着 BranchId 去注册分支。

### 入门案例

基于之前的AT 模式案例进行改造，这里不需要unxo_log 表，因为提交回滚，都交给了数据库XA 协议去实现：

#### 1. 修改数据源代理模式

首先修改mysql 驱动版本，太高了可能不支持：

```java
        <dependency>
            <groupId>mysql</groupId>
            <artifactId>mysql-connector-java</artifactId>
            <version>5.1.48</version>
        </dependency>
```

修改数据源代理模式为XA

```java
seata:
  是否开启spring-boot自动装配，默认true，包括数据源的自动代理以及GlobalTransactionScanner初始化
  enabled: true
  数据源代理模式 默认AT
  data-source-proxy-mode: XA
```

#### 2. 编写业务逻辑

发起一个全局事务，记得只要有本地事务，就必须加上`@Transactional`注解，xa不支持锁重入，如果你对资源2次重入（rpc或没用本地事务注解）就会出现锁超时。

```java
    @Override
    @Transactional
    @GlobalTransactional(rollbackFor = Throwable.class, timeoutMills = 300000)
    public void test() throws InterruptedException {
        log.info("Assign Service Begin ... xid: " + RootContext.getXID() + "\n");
        //1.创建账户 扣款
        AccountTbl accountTbl = accountTblMapper.selectById(12);
        AccountTbl accountTbl1 = accountTbl.setMoney(accountTbl.getMoney() - 1);
        accountTblMapper.updateById(accountTbl1);
        //2.创建订单
        orderClint.insert(accountTbl.getUserId() + "", "iphone11", 1 + "");
        //3.扣库存
        //storageApi.decrease("iphone11", 1);
        //模拟异常
        int i = 5 / 0;
        TimeUnit.SECONDS.sleep(5);
    }
```

#### 3. 测试

异常时，可以看到全局回滚

正常时，全局提交
