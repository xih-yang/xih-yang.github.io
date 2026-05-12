# 07、分布式事务 Seata 教程 - undo_log、global_table、branch_table、lock_table字段及作用详解
- 来源：https://ddkk.com/zhuanlan/transaction/5/7.html
- 分类：分布式事务
- 分组：教程目录
### 客户端

#### undo_log

在`AT模式`中，需要在参与全局事务的数据库中，添加一个`undo_log`表，建表语句如下：

```java
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;
-- ----------------------------
-- Table structure for undo_log
-- ----------------------------
DROP TABLE IF EXISTS undo_log;
CREATE TABLE undo_log  (
  branch_id bigint(20) NOT NULL COMMENT '分支事务ID',
  xid varchar(100) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL COMMENT '全局事务ID',
  context varchar(128) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL COMMENT '上下文',
  rollback_info longblob NOT NULL COMMENT '回滚信息',
  log_status int(11) NOT NULL COMMENT '状态，0正常，1全局已完成',
  log_created datetime(6) NOT NULL COMMENT '创建时间',
  log_modified datetime(6) NOT NULL COMMENT '修改时间',
  UNIQUE INDEX ux_undo_log(xid, branch_id) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8 COLLATE = utf8_general_ci COMMENT = 'AT transaction mode undo table' ROW_FORMAT = Compact;
SET FOREIGN_KEY_CHECKS = 1;
```

在全局事务的一阶段中，分支事务在获取到全局锁提交事务时，会释放本地锁和连接资源，并在`undo_log`表中插入一条数据。

比如在更新时，会插入这样一条数据：

各字段详细说明如下：

字段名
说明

branch_id
分支事务ID，比如：99302990136558270

xid
全局事务ID ，比如：192.168.58.1:8091:99302990136558268（Seata 服务端地址+ ID）

context
回滚信息序列化和压缩格式，serializer=fastjson&compressorType=NONE，表示使用fastjson序列化，没有采用压缩

rollback_info
回滚信息

log_status
日志状态，0正常，1全局已完成

log_created
创建时间

log_modified
修改时间

其中重要的是`rollback_info`，比如在更新一条数据时`set money = 97`，会查询修改之前该条数据的及修改后的数据状态。

在`rollback_info`中，该数据修改之前是`98`:

修改之前，该数据是`97`:

在第二阶段中，如果全局事务成功，会收到 TC 的分支提交请求，把请求放入一个异步任务的队列中，马上返回提交成功的结果给 TC。异步任务阶段的分支提交请求将异步和批量地删除相应 UNDO LOG 记录。

在第二阶段中，如果全局事务失败，会收到 TC 的分支回滚请求，开启一个本地事务，执行如下操作。

- 通过 XID 和 Branch ID 查找到相应的 UNDO LOG 记录。
- 数据校验：拿 UNDO LOG 中的后镜与当前数据进行比较，如果有不同，说明数据被当前全局事务之外的动作做了修改。这种情况，需要根据配置策略来做处理，详细的说明在另外的文档中介绍。
- 根据 UNDO LOG 中的前镜像和业务 SQL 的相关信息生成并执行回滚的语句。
- 提交本地事务。并把本地事务的执行结果（即分支事务回滚的结果）上报给 TC。

### 服务端

#### 事务会话信存储模式

在服务端，需要存储事务会话信息，支持一下几种方式：

- file本地文件(不支持HA)，
- db数据库(支持HA)
- redis(支持HA)

其中本地文件方式，效率最高，但是不支持集群，而且出现问题时，是无法格式化的查看当前数据的，所以推荐使用数据库或者缓存的方式。

使用数据库模式时，需要创建以下三张表：

- global_table：全局事务
- branch_table：分支事务
- lock_table：全局锁

#### global_table

`global_table`记录了全局事务的信息，建表语句如下：

```java
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;
-- ----------------------------
-- Table structure for global_table
-- ----------------------------
DROP TABLE IF EXISTS global_table;
CREATE TABLE global_table  (
  xid varchar(128) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL COMMENT '全局事务ID',
  transaction_id bigint(20) NULL DEFAULT NULL COMMENT '事务ID',
  status tinyint(4) NOT NULL COMMENT '状态',
  application_id varchar(32) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL COMMENT '应用ID',
  transaction_service_group varchar(32) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL COMMENT '事务分组名',
  transaction_name varchar(128) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL COMMENT '执行事务的方法',
  timeout int(11) NULL DEFAULT NULL COMMENT '超时时间',
  begin_time bigint(20) NULL DEFAULT NULL COMMENT '开始时间',
  application_data varchar(2000) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL COMMENT '应用数据',
  gmt_create datetime(0) NULL DEFAULT NULL COMMENT '创建时间',
  gmt_modified datetime(0) NULL DEFAULT NULL COMMENT '修改时间',
  PRIMARY KEY (xid) USING BTREE,
  INDEX idx_gmt_modified_status(gmt_modified, status) USING BTREE,
  INDEX idx_transaction_id(transaction_id) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8 COLLATE = utf8_general_ci ROW_FORMAT = Compact;
SET FOREIGN_KEY_CHECKS = 1;
```

比如，当前应用`demo001`发起了一个全局事务，会在这个表中存入以下信息：

#### branch_table

`branch_table`记录了分支事务的信息，建表语句如下：

```java
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;
-- ----------------------------
-- Table structure for branch_table
-- ----------------------------
DROP TABLE IF EXISTS branch_table;
CREATE TABLE branch_table  (
  branch_id bigint(20) NOT NULL COMMENT '分支事务ID',
  xid varchar(128) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL COMMENT '全局事务ID',
  transaction_id bigint(20) NULL DEFAULT NULL COMMENT '全局事务ID，不带TC地址',
  resource_group_id varchar(32) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL COMMENT '资源分组ID',
  resource_id varchar(256) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL COMMENT '资源ID',
  branch_type varchar(8) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL COMMENT '事务模式，AT、XA等',
  status tinyint(4) NULL DEFAULT NULL COMMENT '状态',
  client_id varchar(64) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL COMMENT '客户端ID',
  application_data varchar(2000) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL COMMENT '应用数据',
  gmt_create datetime(6) NULL DEFAULT NULL COMMENT '创建时间',
  gmt_modified datetime(6) NULL DEFAULT NULL COMMENT '修改时间',
  PRIMARY KEY (branch_id) USING BTREE,
  INDEX idx_xid(xid) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8 COLLATE = utf8_general_ci ROW_FORMAT = Compact;
-- ----------------------------
-- Records of branch_table
-- ----------------------------
SET FOREIGN_KEY_CHECKS = 1;
```

当一个服务调用另一个服务进行全局事务时，可以看到，在该表中插入了当前两个服务分支事务的相关信息，其中重要的有ID、事务模式、客户端地址、数据库连接地址等。

```java
INSERT INTO branch_table VALUES (99302990136565280, '192.168.58.1:8091:99302990136565278', 99302990136565278, NULL, 'jdbc:mysql://127.0.0.1:3306/db_account', 'AT', 0, 'demo001:192.168.58.1:2116', NULL, '2022-01-25 16:56:58.092953', '2022-01-25 16:56:58.092953');
INSERT INTO branch_table VALUES (99302990136565283, '192.168.58.1:8091:99302990136565278', 99302990136565278, NULL, 'jdbc:mysql://127.0.0.1:3306/db_order', 'AT', 0, 'demo002:192.168.58.1:2617', NULL, '2022-01-25 16:56:58.551257', '2022-01-25 16:56:58.551257');
```

#### lock_table

`lock_table`记录了锁相关的信息，建表语句如下：

```java
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;
-- ----------------------------
-- Table structure for lock_table
-- ----------------------------
DROP TABLE IF EXISTS lock_table;
CREATE TABLE lock_table  (
  row_key varchar(128) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL COMMENT '行键',
  xid varchar(96) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL COMMENT '全局事务ID',
  transaction_id bigint(20) NULL DEFAULT NULL COMMENT '全局事务ID，不带TC 地址',
  branch_id bigint(20) NOT NULL COMMENT '分支ID',
  resource_id varchar(256) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL COMMENT '资源ID',
  table_name varchar(32) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL COMMENT '表名',
  pk varchar(36) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL COMMENT '主键对应的值',
  gmt_create datetime(0) NULL DEFAULT NULL COMMENT '创建时间',
  gmt_modified datetime(0) NULL DEFAULT NULL COMMENT '修改时间',
  PRIMARY KEY (row_key) USING BTREE,
  INDEX idx_branch_id(branch_id) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8 COLLATE = utf8_general_ci ROW_FORMAT = Compact;
SET FOREIGN_KEY_CHECKS = 1;
```

比如下图：

关于TC 端事务交互的详细流程，后续会分析。
