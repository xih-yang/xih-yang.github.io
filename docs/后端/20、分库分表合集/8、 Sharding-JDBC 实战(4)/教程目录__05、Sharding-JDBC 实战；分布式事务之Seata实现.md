# 05、Sharding-JDBC 实战；分布式事务之Seata实现
- 来源：https://ddkk.com/zhuanlan/sharding/shardingjdbc/4/5.html
- 分类：分库分表
- 分组：教程目录
## 1、实现机制

Sharing-JDBC结合Seata的AT模式实现分布式事务，实现机制如下：

### 1.1 提交阶段

AT模式是Seata的默认模式，满足两阶段提交协议：

- 一阶段：业务数据和回滚日志记录在同一个本地事务中提交，释放本地锁和连接资源。
- 二阶段：
- 提交异步化，非常快速地完成。
- 回滚通过一阶段的回滚日志进行反向补偿。

### 1.2 实现逻辑

**一阶段：**

**1、** 解析SQL，获取执行的SQL语句的信息；

**2、** 根据解析得到的条件信息，执行查询语句，获取数据，生成前镜像；

**3、** 执行SQL语句，并且根据前镜像中的主键查询数据，生成后镜像；

**4、** 把前后镜像数据以及业务SQL相关的信息组成一条回滚日志记录，插入到UNDO_LOG表中；

**5、** 在提交事务前，向TC注册分支事务,并且根据主键值获取全局锁；

**6、** 提交本地事务，包含业务SQL、UNDO_LOG日志生成SQL；

**7、** 将本地事务提交的结果上报给TC；

说明：前后镜像实质是一个json串，记录了sql语句中的字段信息，比如：

```java
	 "beforeImage": {
			"rows": [{
				"fields": [{
					"name": "id",
					"type": 4,
					"value": 1
				}]
			}],
			"tableName": "product"
		}
```

**二阶-事务提交**

**1、** 分支收到TC的事务提交请求，上报提交成功，并且异步的删除全局锁和UNDOLOG记录；

**二阶-事务回滚**

**1、** 通过XID和BranchID查找到相应的UNDOLOG记录；

**2、** 将UNDOLOG中的后镜与当前数据进行比较，验证数据是否有被第三方篡改；

**3、** 根据UNDOLOG中的前镜像和业务SQL的相关信息生成并执行回滚语句；

**4、** 提交本地事务，将分支事务回滚的结果上报给TC；

### 1.3 优缺点

- 优点：
- 一阶段完成直接提交事务，释放数据库资源，性能比较好。
- 利用全局锁实现读写隔离。
- 没有代码侵入，框架自动完成回滚和提交。
- 缺点：
- 两阶段之间属于软状态，无法保证数据强一致性，只能是数据最终一致性。
- 需要额外维护`undo_log`表。

## 2、代码实现

创建两个SpringBoot工程，分别为`storage-service`与`order-service`，模拟从在`order-service`服务中新增订单，然后调用`storage-service`服务新增库存扣减记录；分别创建两个数据库，不同服务连接不同的数据库，并且实现分表的配置；

### 2.1 建表语句

```java
-- 数据库名称： sharding-tx-order.sql
-- 订单表
CREATE TABLE tb_order_1
(
    id    int(11) NOT NULL COMMENT '主键',
    count int(11) NULL DEFAULT 0 COMMENT '下单数量',
    money int(11) NULL DEFAULT 0 COMMENT '金额',
    PRIMARY KEY (id) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8 COLLATE = utf8_general_ci ROW_FORMAT = COMPACT;
CREATE TABLE tb_order_2
(
    id    int(11) NOT NULL COMMENT '主键',
    count int(11) NULL DEFAULT 0 COMMENT '下单数量',
    money int(11) NULL DEFAULT 0 COMMENT '金额',
    PRIMARY KEY (id) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8 COLLATE = utf8_general_ci ROW_FORMAT = COMPACT;
CREATE TABLE tb_order_3
(
    id    int(11) NOT NULL COMMENT '主键',
    count int(11) NULL DEFAULT 0 COMMENT '下单数量',
    money int(11) NULL DEFAULT 0 COMMENT '金额',
    PRIMARY KEY (id) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8 COLLATE = utf8_general_ci ROW_FORMAT = COMPACT;
-- undo_log表
CREATE TABLE undo_log
(
    branch_id     bigint(20) NOT NULL COMMENT 'branch transaction id',
    xid           varchar(100) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL COMMENT 'global transaction id',
    context       varchar(128) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL COMMENT 'undo_log context,such as serialization',
    rollback_info longblob                                                NOT NULL COMMENT 'rollback info',
    log_status    int(11) NOT NULL COMMENT '0:normal status,1:defense status',
    log_created   datetime(6) NOT NULL COMMENT 'create datetime',
    log_modified  datetime(6) NOT NULL COMMENT 'modify datetime',
    UNIQUE INDEX ux_undo_log(xid, branch_id) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8 COLLATE = utf8_general_ci COMMENT = 'AT transaction mode undo table' ROW_FORMAT = Compact;
-- 数据库名称： sharding-tx-storage.sql
-- 库存表
CREATE TABLE tb_storage_1
(
    id       int(11) NOT NULL COMMENT '主键',
    order_id int(11) NOT NULL COMMENT '订单ID',
    count    int(11) NOT NULL DEFAULT 0 COMMENT '库存',
    PRIMARY KEY (id) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 2 CHARACTER SET = utf8 COLLATE = utf8_general_ci ROW_FORMAT = COMPACT;
-- 库存表
CREATE TABLE tb_storage_2
(
    id       int(11) NOT NULL COMMENT '主键',
    order_id int(11) NOT NULL COMMENT '订单ID',
    count    int(11) NOT NULL DEFAULT 0 COMMENT '库存',
    PRIMARY KEY (id) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 2 CHARACTER SET = utf8 COLLATE = utf8_general_ci ROW_FORMAT = COMPACT;
-- 库存表
CREATE TABLE tb_storage_3
(
    id       int(11) NOT NULL COMMENT '主键',
    order_id int(11) NOT NULL COMMENT '订单ID',
    count    int(11) NOT NULL DEFAULT 0 COMMENT '库存',
    PRIMARY KEY (id) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 2 CHARACTER SET = utf8 COLLATE = utf8_general_ci ROW_FORMAT = COMPACT;
-- undo_log表
CREATE TABLE undo_log
(
    branch_id     bigint(20) NOT NULL COMMENT 'branch transaction id',
    xid           varchar(100) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL COMMENT 'global transaction id',
    context       varchar(128) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL COMMENT 'undo_log context,such as serialization',
    rollback_info longblob                                                NOT NULL COMMENT 'rollback info',
    log_status    int(11) NOT NULL COMMENT '0:normal status,1:defense status',
    log_created   datetime(6) NOT NULL COMMENT 'create datetime',
    log_modified  datetime(6) NOT NULL COMMENT 'modify datetime',
    UNIQUE INDEX ux_undo_log(xid, branch_id) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8 COLLATE = utf8_general_ci COMMENT = 'AT transaction mode undo table' ROW_FORMAT = Compact;
```

### 2.2 order-service服务

#### 2.2.1 yaml配置

```java
server:
  port: 8082
spring:
  application:
    name: order-service
  cloud:
    nacos:
      discovery:
        server-addr: 127.0.0.1:8848
        namespace: 64ed9ca7-d705-4655-b4e4-f824e420a12a
        group: test
 sharding-jdbc 水平分表规则配置
  数据源名称，多数据源逗号隔开
  shardingsphere:
    datasource:
      names: m1
      m1:
        type: com.zaxxer.hikari.HikariDataSource
        driver-class-name: com.mysql.cj.jdbc.Driver
        jdbc-url: jdbc:mysql://127.0.0.1:3307/sharding-tx-order?useUnicode=true&useSSL=false&characterEncoding=UTF-8&allowMultiQueries=true&serverTimezone=Asia/Shanghai
        username: root
        password: lhzlx
  水平分表：tb_order_1/2/3，多个表进行分表时，依次在tables标签后写逻辑
  tb_order_1/2/3 为数据库中的事实表
  tb_order为编写SQL中操作的逻辑表，sharding-jdbc会自动根据策略操作事实表
  配置节点分布情况
    sharding:
     tables:
      tb_order:
        actual-data-nodes: m1.tb_order_$->{
     1..3}
        指定tb_order表的主键生成策略为SNOWFLAKE
        key-generator.column: id
        key-generator.type: SNOWFLAKE
        指定tb_order表的分片策略，分片策略包括分片键和分片算法， tb_order_1/2/3 所有对3取余
        table-strategy.inline.sharding-column: id
        table-strategy.inline.algorithm-expression: tb_order_$->{
     id % 3+1}
  打开sql输出日志
    props:
      sql:
        show: true
seata:
  enabled: true
  application-id: ${
     spring.application.name}
  事务组的名称，对应service.vgroupMapping.default_tx_group=xxx中配置的default_tx_group
  tx-service-group: default_tx_group
  配置事务组与集群的对应关系
  service:
    vgroup-mapping:
      default_tx_group为事务组的名称，default为集群名称
      default_tx_group: default
    disable-global-transaction: false
  registry:
    type: nacos
    nacos:
      application: seata-server
      server-addr: 162.14.115.18:8848
      group: SEATA_GROUP
      namespace: 64ed9ca7-d705-4655-b4e4-f824e420a12a
      username: nacos
      password: nacos
      cluster: default
  config:
    type: nacos
    nacos:
      server-addr: 127.0.0.1:8848
      group: SEATA_GROUP
      namespace: 64ed9ca7-d705-4655-b4e4-f824e420a12a
      username: nacos
      password: nacos
      data-id: seataServer.properties
```

#### 2.2.2 Service

上游服务通过`@GlobalTransactional`注解开启全局事务，使用`storageClient`进行feign调用

```java
@Slf4j
@Service
public class OrderServiceImpl implements OrderService {
    @Resource
    private StorageClient storageClient;
    @Resource
    private OrderMapper orderMapper;
    /**
     * 创建订单
     *
     * @param order
     * @return
     */
    @Override
    @GlobalTransactional
    public Long create(Order order) {
        // 创建订单
        long id = new Random().nextInt(999999999);
        order.setId(id);
        orderMapper.insert(order);
        try {
            // 记录库存信息
            storageClient.deduct(order.getId(), order.getCount());
			// 模拟异常
            // int a = 1 / 0;
        } catch (FeignException e) {
            log.error("下单失败，原因:{}", e.contentUTF8(), e);
            throw new RuntimeException(e.contentUTF8(), e);
        }
        return order.getId();
    }
}
```

#### 2.2.3 StorageClient

```java
@FeignClient("storage-service")
public interface StorageClient {
    /**
     * 扣减库存
     *
     * @param orderId
     * @param count
     */
    @PostMapping("/storage")
    void deduct(@RequestParam("orderId") Long orderId, @RequestParam("count") Integer count);
}
```

### 2.3 storage-service服务

#### 2.3.1 yaml配置

```java
server:
  port: 8081
spring:
  application:
    name: storage-service
  cloud:
    nacos:
      discovery:
        server-addr: 127.0.0.1:8848
        namespace: 64ed9ca7-d705-4655-b4e4-f824e420a12a
        group: test
        在dev环境进行debug时，可以将时间设置长一些
       heart-beat-interval: 1000心跳间隔。单位为毫秒,默认5*1000
        heart-beat-timeout: 300000心跳暂停,收不到心跳，会将实例设为不健康。单位为毫秒,默认15*1000
        ip-delete-timeout: 4000000Ip删除超时,收不到心跳，会将实例删除。单位为毫秒,默认30*1000
 sharding-jdbc 水平分表规则配置
  数据源名称，多数据源逗号隔开
  shardingsphere:
    datasource:
      names: m1
      m1:
        type: com.zaxxer.hikari.HikariDataSource
        driver-class-name: com.mysql.cj.jdbc.Driver
        jdbc-url: jdbc:mysql://127.0.0.1:3307/sharding-tx-storage?useUnicode=true&useSSL=false&characterEncoding=UTF-8&allowMultiQueries=true&serverTimezone=Asia/Shanghai
        username: root
        password: lhzlx
    水平分表：tb_storage_1/2/3，多个表进行分表时，依次在tables标签后写逻辑
    tb_storage_1/2/3 为数据库中的事实表
    tb_storage为编写SQL中操作的逻辑表，sharding-jdbc会自动根据策略操作事实表
    配置节点分布情况
    sharding:
      tables:
        tb_storage:
          actual-data-nodes: m1.tb_storage_$->{
     1..3}
          指定tb_storage表的主键生成策略为SNOWFLAKE
          key-generator.column: id
          key-generator.type: SNOWFLAKE
          指定tb_storage表的分片策略，分片策略包括分片键和分片算法， tb_storage_1/2/3 所有对3取余
          table-strategy.inline.sharding-column: id
          table-strategy.inline.algorithm-expression: tb_storage_$->{
     id % 3+1}
    打开sql输出日志
    props:
      sql:
        show: true
seata:
  enabled: true
  application-id: ${
     spring.application.name}
  事务组的名称，对应service.vgroupMapping.default_tx_group=xxx中配置的default_tx_group
  tx-service-group: default_tx_group
  配置事务组与集群的对应关系
  service:
    vgroup-mapping:
      default_tx_group为事务组的名称，default为集群名称
      default_tx_group: default
    disable-global-transaction: false
  registry:
    type: nacos
    nacos:
      application: seata-server
      server-addr: 127.0.0.1:8848
      group: SEATA_GROUP
      namespace: 64ed9ca7-d705-4655-b4e4-f824e420a12a
      username: nacos
      password: nacos
      cluster: default
  config:
    type: nacos
    nacos:
      server-addr: 162.14.115.18:8848
      group: SEATA_GROUP
      namespace: 64ed9ca7-d705-4655-b4e4-f824e420a12a
      username: nacos
      password: nacos
      data-id: seataServer.properties
```

#### 2.3.2 StorageService

```java
@Slf4j
@Service
public class StorageServiceImpl implements StorageService {
    @Resource
    private StorageMapper storageMapper;
    /**
     * 扣除存储数量
     *
     * @param orderId
     * @param count
     */
    @Override
    public void deduct(Long orderId, int count) {
        log.info("开始记录库存信息");
        try {
            long id = new Random().nextInt(999999999);
            Storage storage = new Storage();
            storage.setId(id);
            storage.setOrderId(orderId);
            storage.setCount(count);
            storageMapper.insert(storage);
			// 模拟异常
            // int a = 1 / 0;
        } catch (Exception e) {
            throw new RuntimeException("扣减库存失败，可能是库存不足！", e);
        }
        log.info("库存信息记录成功");
    }
}
```

## 3 测试

`测试时没有做截图进行演示，只说明了结果，可以运行代码设置异常进行验证`

### 3.1 下游服务异常

在`order-service`服务中正常，在`storage-service`服务的service中抛出异常，观察数据是否成功回滚；如果`tb_order`与`tb_storage`都不存在数据，则表示全局事务成功；

### 3.2 上游服务异常

`order-service`服务在执行`storageClient.deduct()`方法后抛出异常，在`storage-service`服务中正常，观察数据是否成功回滚；如果`tb_order`与`tb_storage`都不存在数据，则表示全局事务成功；

### 3.3 数据最终一致性验证

我们可以在上游服务执行完orderMapper.insert(order);``后马上进入断点，测试去观察数据库会发现`tb_order`中存在数据，再放行断点使程序执行异常，再次观察数据库会发现`tb_order`中的数据已经被删除了；

## 4、源码地址

Seata值AT模式代码实现：[《sharding-tx-seata》](https://github.com/lxlhz/sharding-tx/tree/master/sharding-tx-seata)
