# 05、分布式事务 Seata 教程 - Seata参数配置详解
- 来源：https://ddkk.com/zhuanlan/transaction/5/5.html
- 分类：分布式事务
- 分组：教程目录
### 启动参数

#### 源码

```java
    @Parameter(names = "--help", help = true)
    private boolean help;
    @Parameter(names = {
     "--host", "-h"}, description = "The ip to register to registry center.", order = 1)
    private String host;
    @Parameter(names = {
     "--port", "-p"}, description = "The port to listen.", order = 2)
    private int port = SERVER_DEFAULT_PORT;
    @Parameter(names = {
     "--storeMode", "-m"}, description = "log store mode : file, db", order = 3)
    private String storeMode;
    @Parameter(names = {
     "--serverNode", "-n"}, description = "server node id, such as 1, 2, 3.it will be generated according to the snowflake by default", order = 4)
    private Long serverNode;
    @Parameter(names = {
     "--seataEnv", "-e"}, description = "The name used for multi-configuration isolation.",
        order = 5)
    private String seataEnv;
```

#### 说明

参数
说明

–help
查看帮助

–host, -h
server端IP，如输入为-h 192.168.8.8时，在nacos中的注册地址为当前地址，可用于多网卡环境

–port, -p
server端启动及监听端口

–storeMode, -m
日志存储方式，支持file, db

–serverNode, -n
serverNode 用于TC集群区分节点的序号，各节点生成的分支事务ID以及各类ID是根据这个node生成的，区间是20亿，比如-n 1 节点大概生成的ID都是2开头的，-n 2 生成的ID是4开头的 ，为了避免xid重复

–seataEnv, -e
registry.conf 文件的多环境配置，例如修改配置文件为registry-dev.conf，添加-e dev启动，则会读取dev环境的配置

### 配置参数

#### 通信部分

参数
描述
说明

transport.type
传输协议类型
默认TCP

transport.server
传输服务类型
默认NIO

transport.heartbeat
client和server通信心跳检测开关
默认true开启

transport.enableClientBatchSendRequest
客户端事务消息请求是否批量合并发送
默认true，false单条发送

transport.threadFactory.bossThreadPrefix
线程工厂Boss线程前缀
默认NettyBoss

transport.threadFactory.workerThreadPrefix
线程工厂Worker线程前缀
默认NettyServerNIOWorker

transport.threadFactory.serverExecutorThreadPrefix
服务器执行线程前缀
默认NettyServerBizHandler

transport.threadFactory.shareBossWorker
是否共享boss/worker
默认false

transport.threadFactory.clientSelectorThreadPrefix
客户端线程选择器前缀
默认NettyClientSelector

transport.threadFactory.clientSelectorThreadSize
客户端线程选择器数量
默认1

transport.threadFactory.clientWorkerThreadPrefix
客户端worker线程前缀
默认NettyClientWorkerThread

transport.threadFactory.bossThreadSize
Boss线程数量
默认1

transport.threadFactory.workerThreadSize
Worker线程数量
默认default

transport.shutdown.wait
server端销毁后客户端的等待时间
默认3秒

transport.serialization
client和server通信编解码方式
seata(ByteBuf)、protobuf、kryo、hession、fst，默认seata

transport.compressor
client和server通信数据压缩方式
none、gzip，默认none

#### 服务端

参数
描述
说明

service.enableDegrade
是否开启降级
默认false

service.disableGlobalTransaction
全局事务开关
默认false。false为开启，true为关闭

server.recovery.committingRetryPeriod
二阶段提交未完成状态全局事务重试提交线程间隔时间
默认1000，单位毫秒

server.recovery.asynCommittingRetryPeriod
二阶段异步提交状态重试提交线程间隔时间
默认1000，单位毫秒

server.recovery.rollbackingRetryPeriod
二阶段回滚状态重试回滚线程间隔时间
默认1000，单位毫秒

server.recovery.timeoutRetryPeriod
超时状态检测重试线程间隔时间
默认1000，单位毫秒，检测出超时将全局事务置入回滚会话管理器

server.maxCommitRetryTimeout
二阶段提交重试超时时长
单位ms,s,m,h,d,对应毫秒,秒,分,小时,天,默认毫秒。默认值-1表示无限重试。公式: timeout>=now-globalTransactionBeginTime,true表示超时则不再重试

server.maxRollbackRetryTimeout
二阶段回滚重试超时时长
同上

server.rollbackRetryTimeoutUnlockEnable
是否开启回滚重试超时后释放锁资源
默认false

server.undo.logSaveDays
undo日志保留天数
默认7天

server.undo.logDeletePeriod
undo清理线程间隔时间
默认86400000（24小时），单位毫秒

#### 客户端

参数
描述
说明

client.rm.asyncCommitBufferLimit
异步提交缓存队列长度
默认10000。 二阶段提交成功，RM异步清理undo队列

client.rm.lock.retryInterval
校验或占用全局锁重试间隔
默认10，单位毫秒

client.rm.lock.retryTimes
校验或占用全局锁重试次数
默认30ms

client.rm.lock.retryPolicyBranchRollbackOnConflict
分支事务与其它全局回滚事务冲突时锁策略
默认true，优先释放本地锁让回滚成功

client.rm.reportRetryCount
一阶段结果上报TC重试次数
默认5次

client.rm.tableMetaCheckEnable
自动刷新缓存中的表结构
默认false

client.rm.sqlParserType
SQL解析器
默认druid

client.rm.reportSuccessEnable
是否上报一阶段成功
true、false，从1.1.0版本开始,默认false.true用于保持分支事务生命周期记录完整，false可提高不少性能

client.rm.sagaBranchRegisterEnable
是否开启saga分支注册
默认false

client.tm.commitRetryCount
一阶段全局提交结果上报TC重试次数
默认1次，建议大于1

client.tm.rollbackRetryCount
一阶段全局回滚结果上报TC重试次数
默认1次，建议大于1

client.tm.defaultGlobalTransactionTimeout
全局事务超时时间
默认60000ms

client.tm.degradeCheck
是否服务自动降级策略
默认false ,为true时,开启自检线程.随后读取degradeCheckAllowTimes和degradeCheckPeriod,确认阈值与自检周期，都为默认值时，那么每2秒钟会进行一个begin,commit的测试,如果失败,则记录连续失败数,如果成功则清空连续失败数.连续错误由用户接口及自检线程进行累计,直到连续失败次数达到用户的阈值,则关闭Seata分布式事务,避免用户自身业务长时间不可用，反之,假如当前分布式事务关闭,那么自检线程继续按照2秒一次的自检,直到连续成功数达到用户设置的阈值,那么Seata分布式事务将恢复使用

client.tm.degradeCheckAllowTimes
升降级达标阈值
默认10

client.tm.degradeCheckPeriod
服务自检周期
默认2000,单位ms.每2秒进行一次服务自检,来决定

client.undo.dataValidation
二阶段回滚镜像校验
默认true开启，false关闭

client.undo.logSerialization
undo序列化方式
默认jackson

client.undo.onlyCareUpdateColumn
update操作回滚时，是否只更新update字段
默认true,默认seata回滚时对于原始update语句只回滚set 的update column ，false就意味着，回滚时会反向update 所有列字段，不管你原始语句是否更新过这个字段值。

client.undo.logTable
自定义undo表名
默认undo_log

client.log.exceptionRate
日志异常输出概率
默认100，目前用于undo回滚失败时异常堆栈输出，百分之一的概率输出，回滚失败基本是脏数据，无需输出堆栈占用硬盘空间

service.vgroupMapping.my_test_tx_group
事务群组
my_test_tx_group为分组，配置项值为TC集群名,事务分组是seata的资源逻辑，类似于服务实例。首先程序中配置了事务分组（GlobalTransactionScanner 构造方法的 txServiceGroup 参数），程序会通过用户配置的配置中心去寻找 service.vgroupMapping. 事务分组配置项，取得配置项的值就是 TC 集群的名称。拿到集群名称程序通过一定的前后缀+集群名称去构造服务名，各配置中心的服务名实现不同。拿到服务名去相应的注册中心去拉取相应服务名的服务列表，获得后端真实的 TC 服务列表。分组的含义就是映射到一套集群，所以你可以配一个分组也可以配置多个。

service.default.grouplist
TC服务列表
仅注册中心为file时使用，当registry.type=file时会用到，其他时候不读

#### 存储

参数
描述
说明

store.mode
事务会话信息存储方式
file本地文件(不支持HA)，db数据库

store.file.dir
file模式文件存储文件夹名
默认sessionStore

store.file.maxBranchSessionSize
最大分支会话大小
默认16384（16kb）

store.file.maxGlobalSessionSize
最大全局会话大小
默认512

store.file.fileWriteBufferCacheSize
文件缓冲区大小
默认16384（16kb）

store.file.flushDiskMode
刷新磁盘方式
async、sync，异步、同步

store.file.sessionReloadReadSize
会话重载读取大小
100

store.db.datasource
db模式数据源类型
dbcp、druid、hikari；无默认值，store.mode=db时必须指定。

store.db.dbType
db模式数据库类型
mysql、oracle、db2、sqlserver、sybaee、h2、sqlite、access、postgresql、oceanbase；无默认值，store.mode=db时必须指定。

store.db.driverClassName
db模式数据库驱动
com.mysql.jdbc.Driver

store.db.url
db模式数据库url
store.mode=db时必须指定，在使用mysql作为数据源时，建议在连接参数中加上rewriteBatchedStatements=true,由于seata是通过jdbc的executeBatch来批量插入全局锁的，根据MySQL官网的说明，连接参数中的rewriteBatchedStatements为true时，在执行executeBatch，并且操作类型为insert时，jdbc驱动会把对应的SQL优化成insert into () values (), ()的形式来提升批量插入的性能。

根据实际的测试，该参数设置

store.db.user
db模式数据库账户
store.mode=db时必须指定

store.db.password
db模式数据库账户密码
store.mode=db时必须指定

store.db.minConn
db模式数据库初始连接数
默认1

store.db.maxConn
db模式数据库最大连接数
默认20

store.db.globalTable
db模式全局事务表名
默认global_table

store.db.branchTable
db模式分支事务表名
默认branch_table

store.db.queryLimit
db模式查询全局事务一次的最大条数
默认100

store.db.lockTable
db模式全局锁表名
默认lock_table

store.db.maxWait
db模式获取连接时最大等待时间
默认5000，单位毫秒

store.redis.host
redis模式ip
默认127.0.0.1

store.redis.port
redis模式端口
默认6379

store.redis.maxConn
redis模式最大连接数
默认10

store.redis.minConn
redis模式最小连接数
默认1

store.redis.database
redis模式默认库
默认0

store.redis.password
redis模式密码(无可不填)
默认null

store.redis.queryLimit
redis模式一次查询最大条数
默认100

#### 监控

参数
描述
说明

metrics.enabled
是否启用Metrics
默认false关闭，在False状态下，所有与Metrics相关的组件将不会被初始化，使得性能损耗最低

metrics.registryType
指标注册器类型
Metrics使用的指标注册器类型，默认为内置的compact（简易）实现，这个实现中的Meter仅使用有限内存计数，性能高足够满足大多数场景；目前只能设置一个指标注册器实现

metrics.exporterList
指标结果Measurement数据输出器列表
默认prometheus，多个输出器使用英文逗号分割，例如"prometheus,jmx"，目前仅实现了对接prometheus的输出器

metrics.exporterPrometheusPort
prometheus输出器Client端口号
默认9898
