# 23、SpringCloud Alibaba 之 Seata 分布式事务服务；AT事务模式机制，读写隔离
- 来源：https://ddkk.com/zhuanlan/j2ee/springcloudalibaba/1/23.html
- 分类：J2EE框架
- 分组：Spring Cloud Alibaba 教程 (A)
## 以下全部转载自Seata官网

[Seata 是什么](http://seata.io/zh-cn/docs/overview/what-is-seata.html)

## AT 模式

[Seata 是什么](http://seata.io/zh-cn/docs/overview/what-is-seata.html)

### 前提：

**1、** 基于支持本地ACID事务的关系型数据库；

**2、** Java应用，通过JDBC访问数据库；

### 整体机制

### 两阶段提交协议的演变：

### 一阶段：

业务数据和回滚日志记录在同一个本地事务中提交，释放本地锁和连接资源（本地事务，就已经在数据库持久化了）

### 二阶段：

**1、** 没有异常；

提交异步化，非常快速地完成（正常情况，就提交了，同步一下TC Server的状态，删除回滚日志）

**2、** 有异常；

回滚，通过一阶段的回滚日志进行反向补偿（如订单删除，库存加回去，余额加回去）

## 一、AT事务模式分布式事务工作机制

[Seata 是什么](http://seata.io/zh-cn/docs/overview/what-is-seata.html)

以一个示例来说明整个 AT 分支的工作过程

业务表：**product**

Field
Type
Key

id
bigint(20)
PRI

name
varchar(100)

since
varchar(100)

AT分支事务的业务逻辑：

```java
update product set name = 'GTS' where name = 'TXC';
```

## 一阶段

过程：

**1、** 解析SQL：得到SQL的类型（UPDATE），表（product），条件（wherename='TXC'）等相关的信息；

**2、** 查询前镜像：根据解析得到的条件信息，生成查询语句，定位数据；

```java
select id, name, since from product where name = 'TXC';
```

得到前镜像：

id
name
since

1
TXC
2014

**3、** 执行业务SQL：更新这条记录的name为'GTS'；

**4、** 查询后镜像：根据前镜像的结果，通过**主键**定位数据；

```bash
select id, name, since from product where id = 1;
```

得到后镜像：

id
name
since

1
GTS
2014

**5、** 插入回滚日志：把前后镜像数据以及业务SQL相关的信息组成一条回滚日志记录，插入到`UNDO_LOG`表中；

```bash
{
	"branchId": 641789253,
	"undoItems": [{
		"afterImage": {
			"rows": [{
				"fields": [{
					"name": "id",
					"type": 4,
					"value": 1
				}, {
					"name": "name",
					"type": 12,
					"value": "GTS"
				}, {
					"name": "since",
					"type": 12,
					"value": "2014"
				}]
			}],
			"tableName": "product"
		},
		"beforeImage": {
			"rows": [{
				"fields": [{
					"name": "id",
					"type": 4,
					"value": 1
				}, {
					"name": "name",
					"type": 12,
					"value": "TXC"
				}, {
					"name": "since",
					"type": 12,
					"value": "2014"
				}]
			}],
			"tableName": "product"
		},
		"sqlType": "UPDATE"
	}],
	"xid": "xid:xxx"
}
```

**6、** 提交前，向TC注册分支：申请`product`表中，主键值等于1的记录的**全局锁**；

**7、** 本地事务提交：业务数据的更新和前面步骤中生成的UNDOLOG一并提交；

**8、** 将本地事务提交的结果上报给TC；

## 二阶段-回滚

**1、** 收到TC的分支回滚请求，开启一个本地事务，执行如下操作；

**2、** 通过XID和BranchID查找到相应的UNDOLOG记录；

**3、** 数据校验：拿UNDOLOG中的后镜与当前数据进行比较，如果有不同，说明数据被当前全局事务之外的动作做了修改这种情况，需要根据配置策略来做处理，详细的说明在另外的文档中介绍；

**4、** 根据UNDOLOG中的前镜像和业务SQL的相关信息生成并执行回滚的语句：

```bash
update product set name = 'TXC' where id = 1;
```

**5、** 提交本地事务并把本地事务的执行结果（即分支事务回滚的结果）上报给TC；

## 二阶段-提交

**1、** 收到TC的分支提交请求，把请求放入一个异步任务的队列中，马上返回提交成功的结果给TC；

**2、** 异步任务阶段的分支提交请求将异步和批量地删除相应UNDOLOG记录；

## 二、读写隔离

## 写隔离

**1、** 一阶段本地事务提交前，需要确保先拿到全局锁；

**2、** 拿不到全局锁，不能提交本地事务；

**3、** 拿全局锁的尝试被限制在一定范围内，超出范围将放弃，并回滚本地事务，释放本地锁；

以一个示例来说明：

**两个**或者多个全局事务 tx1 和 tx2，分别并发对 a 表的 m 字段进行更新操作，m 的初始值 1000；

假设tx1 先开始，开启本地事务，拿到本地锁，更新操作 m = 1000 - 100 = 900，本地事务提交前，先拿到该记录的 全局锁 ，拿到了全局锁，本地提交并释放本地锁

tx2后开始，开启本地事务，拿到本地锁，更新操作 m = 900 - 100 = 800 ，本地事务提交前，尝试拿该记录的 全局锁 ，tx1全局提交前，该记录的全局锁一直会被 tx1 持有，tx2 需要重试等待 全局锁 ；

tx1二阶段全局提交，释放 全局锁 ，tx2 拿到 全局锁 提交本地事务

如果tx1 的二阶段全局回滚，则 tx1 需要重新获取该数据的本地锁，进行反向补偿的更新操作，实现分支的回滚

此时，如果 tx2 仍在等待该数据的 全局锁，同时持有本地锁，则 tx1 的分支回滚会失败。分支的回滚会一直重试，直到 tx2 的 全局锁 等锁超时，放弃 全局锁 并回滚本地事务释放本地锁，tx1 的分支回滚最终成功；

因为整个过程 全局锁 在 tx1 结束前一直是被 tx1 持有的，所以不会发生 **脏写** 的问题；

## 读隔离

在数据库本地事务隔离级别 读已提交（Read Committed） 或以上的基础上，Seata（AT 模式）的默认全局隔离级别是 **读未提交（Read Uncommitted）** ；

如果应用在特定场景下，必需要求全局的 读已提交 ，目前 Seata 的方式是通过 SELECT FOR UPDATE 语句的代理

SELECT FOR UPDATE 语句的执行会申请 全局锁 ，如果 全局锁 被其他事务持有，则释放本地锁（回滚 SELECT FOR UPDATE 语句的本地执行）并重试，这个过程中，查询是被 block 住的，直到 全局锁 拿到，即读取的相关数据是 已提交 的，才返回

出于总体性能上的考虑，Seata目前的方案并没有对所有SELECT语句都进行代理，仅针对 FOR UPDATE 的 SELECT 语句
