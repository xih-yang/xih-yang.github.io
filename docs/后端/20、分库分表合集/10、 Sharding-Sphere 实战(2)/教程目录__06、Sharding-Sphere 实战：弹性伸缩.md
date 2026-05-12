# 06、Sharding-Sphere 实战：弹性伸缩
- 来源：https://ddkk.com/zhuanlan/sharding/shardingsphere/2/6.html
- 分类：分库分表
- 分组：教程目录
## 一、功能详解

### 1. 背景

对于使用单数据库运行的系统来说，如何安全简单地将数据迁移至水平分片的数据库上，一直以来都是一个迫切的需求。对于已经使用了ShardingSphere的用户来说，随着业务规模的快速变化，也可能需要对现有的分片集群进行弹性扩容或缩容。

ShardingSphere在分片算法上提供给用户极大的自由度，但却给弹性伸缩造成了极大的挑战。找寻既能支持自定义的分片算法，又能高效地将数据节点进行扩缩容的方式，是弹性伸缩面临的第一个挑战。

同时，在伸缩过程中，不应该对正在运行的业务造成影响。尽可能减少伸缩时数据不可用的时间窗口，甚至做到用户完全无感知，是弹性伸缩的另一个挑战。

最后，弹性伸缩不应该对现有的数据造成影响。如何保证数据的正确性，是弹性伸缩的第三个挑战。

弹性伸缩过程示意如下图。

支持自定义分片算法，减少数据伸缩及迁移时的业务影响，提供一站式的通用弹性伸缩解决方案，是ShardingSphere弹性伸缩的主要设计目标。ShardingSphere-Scaling是一个提供给用户的通用数据接入迁移及弹性伸缩的解决方案。ShardingSphere-Scaling从 4.1.0 版本开始向用户提供，当前处于 alpha 开发阶段。

### 2. 核心概念

- 弹性伸缩作业：指一次将数据由旧规则迁移至新规则的完整流程。
- 存量数据：在弹性伸缩作业开始前，数据节点中已有的数据。
- 增量数据：在弹性伸缩作业执行过程中，业务系统所产生的新数据。

### 3. 使用规范

支持项：

- 将外围数据迁移至ShardingSphere所管理的数据库。
- 将ShardingSphere的数据节点进行扩容或缩容。

不支持项：

- 无主键表扩缩容。
- 复合主键表扩缩容。
- 不支持在当前存储节点之上做迁移，需要准备一个全新的数据库集群作为迁移目标库。

## 二、实现细节

### 1. 原理说明

考虑到ShardingSphere的弹性伸缩模块的几个挑战，目前的弹性伸缩解决方案为：临时地使用两个数据库集群，伸缩完成后切换的方式实现，如下图所示。

这种实现方式有以下优点：

- 伸缩过程中，原始数据没有任何影响。
- 伸缩失败无风险。
- 不受分片策略限制。

同时也存在一定的缺点：

- 在一定时间内存在冗余服务器。
- 所有数据都需要移动。

弹性伸缩模块会通过解析旧分片规则，提取配置中的数据源、数据节点等信息，之后创建伸缩作业工作流，将一次弹性伸缩拆解为 4 个主要阶段：

**1、** 准备阶段；

**2、** 存量数据迁移阶段；

**3、** 增量数据同步阶段；

**4、** 规则切换阶段；

弹性伸缩工作流如下图所示。

### 2. 执行阶段说明

#### （1）准备阶段

在准备阶段，弹性伸缩模块会进行数据源连通性及权限的校验，同时进行存量数据的统计、日志位点的记录，最后根据数据量和用户设置的并行度，对任务进行分片。

#### （2）存量数据迁移阶段

执行在准备阶段拆分好的存量数据迁移作业，存量迁移阶段采用 JDBC 查询的方式，直接从数据节点中读取数据，并使用新规则写入到新集群中。

#### （3）增量数据同步阶段

由于存量数据迁移耗费的时间受到数据量和并行度等因素影响，此时需要对这段时间内业务新增的数据进行同步。不同的数据库使用的技术细节不同，但总体上均为基于复制协议或 WAL 日志实现的变更数据捕获功能。

- MySQL：订阅并解析 binlog；
- PostgreSQL：采用官方逻辑复制 test_decoding。

这些捕获的增量数据，同样会由弹性伸缩模块根据新规则写入到新数据节点中。当增量数据基本同步完成时（由于业务系统未停止，增量数据是不断的），则进入规则切换阶段。

#### （4）规则切换阶段

在此阶段，可能存在一定时间的业务只读窗口期，通过设置数据库只读或ShardingSphere的熔断机制，让旧数据节点中的数据短暂静态，确保增量同步已完全完成。

这个窗口期时间短则数秒，长则数分钟，取决于数据量和用户是否需要对数据进行强校验。确认完成后，ShardingSphere可通过配置中心修改配置，将业务导向新规则的集群，弹性伸缩完成。

### 3. 限流与熔断

面对超负荷的流量下，针对某一节点进行熔断和限流，以保证整个数据库集群得以继续运行，是分布式系统下对单一节点控制能力的挑战。熔断指的是阻断 ShardingSphere 和数据库的连接。当某个 ShardingSphere 节点超过负载后，停止该节点对数据库的访问，使数据库能够保证足够的资源为其他节点提供服务。限流是指面对超负荷的请求开启流量限制，以保护部分请求可以得以高质量的响应。

目前实现的限流是在数据迁移或扩缩容过程中，限制源端或目标端的流量。下表为目前提供的熔断语句。

**语句**

**说明**

**示例**

[ENABLE / DISABLE] READWRITE_SPLITTING (READ)? resourceName [FROM databaseName]

启用/禁用读库

ENABLE READWRITE_SPLITTING READ resource_0

[ENABLE / DISABLE] INSTANCE instanceId

启用/禁用 Proxy 实例

DISABLE INSTANCE instance_1

SHOW INSTANCE LIST

查询 Proxy 实例信息

SHOW INSTANCE LIST

SHOW READWRITE_SPLITTING (READ)? resourceName [FROM databaseName]

查询所有读库的状态

SHOW READWRITE_SPLITTING READ RESOURCES

实例级熔断用于多Proxy实例场景下，启用/禁用某个Porxy实例。库级熔断主要用于读写分离场景下启用/禁用读库。

## 三、用例测试

本节演示两个例子，例1是从MySQL实例迁移到ShardingSphere-Proxy，例2是对现有数据库节点进行扩容。两个例子都用ShardingSphere-Scaling实现，过成类似。

ShardingSphere-Scaling目前不是一个独立的产品，而是以ShardingSphere-Proxy中的一个配置项提供相应功能。如果后端连接以下数据库，需要下载相应 JDBC 驱动 jar 包，并将其放入 ${shardingsphere-proxy}/lib 目录中。

**数据库**

**JDBC****驱动**

**参考**

MySQL

[mysql-connector-java-5.1.47.jar](https://repo1.maven.org/maven2/mysql/mysql-connector-java/5.1.47/mysql-connector-java-5.1.47.jar)

[Connector/J Versions](https://dev.mysql.com/doc/connector-j/5.1/en/connector-j-versions.html)

PostgreSQL

[opengauss-jdbc-2.0.1-compatibility.jar](https://repo1.maven.org/maven2/org/opengauss/opengauss-jdbc/2.0.1-compatibility/opengauss-jdbc-2.0.1-compatibility.jar)

```java
# 引入 JDBC 驱动
cp ~/mysql-connector-java-5.1.47/mysql-connector-java-5.1.47.jar ~/apache-shardingsphere-5.1.1-shardingsphere-proxy-bin/lib/
# 重启Proxy
/root/apache-shardingsphere-5.1.1-shardingsphere-proxy-bin/bin/stop.sh
/root/apache-shardingsphere-5.1.1-shardingsphere-proxy-bin/bin/start.sh
```

### 1. 数据迁移

需求：现有一个正在使用的MySQL数据库，需要将其中的两个表迁移到Proxy下的数据节点。两个表的数据实时变化，要求尽量缩短业务影响时间。

源：172.18.26.198:3306/migrating_db

目标：172.18.10.66:3306/db1、172.18.10.66:3306/db2、172.18.18.102:3306\db1、172.18.18.102:3306\db2

Proxy：172.18.10.66:3307、172.18.18.102:3307，Cluster运行模式

#### （1）准备测试用例环境

目标66、102执行：

```java
drop database if exists db1;
drop database if exists db2;
create database db1;
create database db2;
```

源198执行：

```java
-- 建库
drop database if exists migrating_db;
create database migrating_db;
use migrating_db;
-- 建表
create table t_order (
    order_id bigint auto_increment primary key, 
    order_datetime datetime not null,
    user_id bigint not null, 
    order_amount decimal(10,2) not null default 0, 
    key idx_order_datetime (order_datetime),
    key idx_user_id (user_id));
create table t_order_item (
    order_item_id bigint auto_increment primary key, 
    order_id bigint not null, 
    item_id int null,
    item_quantity int not null default 0,
    key idx_order_id (order_id));
-- 创建负载模拟存储过程
delimiter //    
create procedure sp_generate_order_data(p_seconds int)  
begin   
    set @start_ts := now();  
    set @start_date := unix_timestamp('2022-03-01');  
    set @end_date := unix_timestamp('2022-06-01');
    while timestampdiff(second,@start_ts,now()) <= p_seconds do  
        start transaction;
        set @order_datetime := from_unixtime(@start_date + rand() * (@end_date - @start_date));
        set @user_id := floor(1 + rand() * 100000000);   
        set @order_amount := round((10 + rand() * 2000),2);
        insert into t_order (order_datetime, user_id, order_amount) 
        values (@order_datetime, @user_id, @order_amount);  
        set @order_id := last_insert_id();
        set @quantity := floor(1 + rand() * 50);
        set @i := 1;
        while @i <= @quantity do 
            set @item_id := floor(1 + rand() * 10000); 
            set @item_quantity := floor(1 + rand() * 20); 
            insert into t_order_item (order_id, item_id, item_quantity) values (@order_id, @item_id, @item_quantity);
            set @i:=@i+1;
        end while;
        commit;
 
    end while;   
end   
//    
delimiter ; 
-- 执行存储过程
call sp_generate_order_data(1800);
```

以下步骤在执行存储过程过程（半小时）进行，模拟线上实际迁移过程。

#### （2）创建数据迁移作业

创建数据迁移作业包含以下步骤：

**1、** 创建逻辑库；

**2、** 添加源资源；

**3、** 将单表规则改为单片规则；

**4、** 创建shardingscaling规则；

**5、** 添加目标资源；

**6、** 修改分片规则，触发迁移；

**7、** 监控迁移作业；

连接Proxy：

```java
mysql -u root -h 172.18.10.66 -P 3307 -p123456
```

创建逻辑库：

```java
drop database if exists migrating_db;
create database migrating_db;
use migrating_db;
```

添加源资源：

```java
add resource 
resource_source (host=172.18.26.198, port=3306, db=migrating_db, user=wxy, password=mypass);
show schema resources\G
```

确认自动创建单表规则：

```java
count schema rules;
```

将单表规则改为单片规则：

```java
create sharding table rule 
t_order (datanodes("resource_source.t_order")),
t_order_item (datanodes("resource_source.t_order_item"));
```

预览当前分片规则：

```java
preview select count(1) from t_order;
preview select count(1) from t_order_item;
```

执行SQL确认可以正确查询到数据：

```java
select count(1) from t_order;
select count(1) from t_order_item;
```

创建手动模式scaling规则：

```java
create sharding scaling rule scaling_manual (
input(
  worker_thread=40,
  batch_size=1000
),
output(
  worker_thread=40,
  batch_size=1000
),
stream_channel(type(name=memory, properties("block-queue-size"=10000))),
data_consistency_checker(type(name=data_match, properties("chunk-size"=1000)))
);
```

查看sharding_scaling规则：

```java
show sharding scaling rules\G
```

参数说明：

- worker_thread：从源端摄取 / 写入到目标端全量数据的线程池大小。
- batch_size：一次查询操作返回的最大记录数。
- stream_channel：数据通道，连接生产者和消费者，用于 input 和 output 环节。type 指定算法类型，可选项 MEMORY；block-queue-size 算法属性指定阻塞队列大小。
- data_consistency_checker：数据一致性校验算法。type 指定算法类型，可选项 DATA_MATCH、CRC32_MATCH；chunk-size 算法属性指定一次查询操作返回的最大记录数。

dataconsistencychecker 的 type 可以通过执行 show scaling check algorithms 查询到：

```java
mysql> show scaling check algorithms;
+-------------+----------------------------+--------------------------------------------------------------+----------------+
| type        | description                | supported_database_types                                     | provider       |
+-------------+----------------------------+--------------------------------------------------------------+----------------+
| CRC32_MATCH | Match CRC32 of records.    | MySQL                                                        | ShardingSphere |
| DATA_MATCH  | Match raw data of records. | SQL92,openGauss,PostgreSQL,MySQL,MariaDB,H2,Oracle,SQLServer | ShardingSphere |
+-------------+----------------------------+--------------------------------------------------------------+----------------+
2 rows in set (0.01 sec)
```

data_match 支持所有数据库，但是性能不是最好的；crc32_match 只支持 MySQL，但是性能更好。

这里还有completion_detector、rateLimiter两个遗留配置问题没有解决。

除手动模式外，官方文档中说明还支持自动模式配置：

```java
create sharding scaling rule scaling_auto (
input(
  worker_thread=40,
  batch_size=1000
),
output(
  worker_thread=40,
  batch_size=1000
),
stream_channel(type(name=memory, properties("block-queue-size"=10000))),
completion_detector(type(name=idle, properties("incremental-task-idle-seconds-threshold"=1800))),
data_consistency_checker(type(name=data_match, properties("chunk-size"=1000)))
);
```

completion_detector 指定作业是否接近完成检测算法。如果不配置则无法自动进行后续步骤，可以通过 DistSQL 手动操作。type 指定算法类型，可选项 IDLE；incremental-task-idle-seconds-threshold 算法属性指定如果增量同步任务不再活动超过一定时间（秒数），那么可以认为增量同步任务接近完成，适用算法类型 IDLE。

但是，我在配置自动模式触发迁移时报错：

```java
[ERROR] 2022-06-06 06:35:21.727 [0130317c30317c3054317c7363616c696e675f6462_Worker-1] o.a.s.e.e.h.g.LogJobErrorHandler - Job '0130317c30317c3054317c7363616c696e675f6462' exception occur in job processing
java.lang.IllegalArgumentException: incremental task idle threshold can not be null.
```

第二个遗留问题是限流配置。Proxy 5.1.1 文档中关于 scaling 配置项中有如下说明：

```java
rateLimiter: 限流算法。如果不配置则不限流。
  type: 算法类型。可选项：
  props: 算法属性
```

可以看到文档中没有给出可选的算法类型和相关算法属性。DistSQL 实例中也没有 rateLimiter 限流配置项。

添加目标资源：

```java
add resource 
resource_1 (host=172.18.10.66, port=3306, db=db1, user=wxy, password=mypass),
resource_2 (host=172.18.10.66, port=3306, db=db2, user=wxy, password=mypass),
resource_3 (host=172.18.18.102, port=3306, db=db1, user=wxy, password=mypass),
resource_4 (host=172.18.18.102, port=3306, db=db2, user=wxy, password=mypass);
show schema resources\G
```

修改分片规则，触发迁移：

```java
alter sharding table rule 
t_order (
resources(resource_1,resource_2,resource_3,resource_4),
sharding_column=order_id,type(name=hash_mod,properties("sharding-count"=8)),
key_generate_strategy(column=order_id,type(name=snowflake))),
t_order_item (
resources(resource_1,resource_2,resource_3,resource_4),
sharding_column=order_id,type(name=hash_mod,properties("sharding-count"=8)),
key_generate_strategy(column=order_item_id,type(name=snowflake)));
```

目前只有通过执行 ALTER SHARDING TABLE RULE DistSQL 来触发迁移。本例中两个迁移表的分片规则从单片datanodes改为四个数据源的8个分片，会触发迁移。

监控迁移作业：

```java
mysql> show scaling list;
+------------------------------------------------+----------------------+----------------------+--------+---------------------+-----------+
| id                                             | tables               | sharding_total_count | active | create_time         | stop_time |
+------------------------------------------------+----------------------+----------------------+--------+---------------------+-----------+
| 0130317c30317c3054317c6d6967726174696e675f6462 | t_order,t_order_item | 1                    | true   | 2022-06-06 18:19:47 | NULL      |
+------------------------------------------------+----------------------+----------------------+--------+---------------------+-----------+
1 row in set (0.01 sec)
mysql> show scaling status 0130317c30317c3054317c6d6967726174696e675f6462;
+------+-----------------+------------------------+--------+-------------------------------+--------------------------+
| item | data_source     | status                 | active | inventory_finished_percentage | incremental_idle_seconds |
+------+-----------------+------------------------+--------+-------------------------------+--------------------------+
| 0    | resource_source | EXECUTE_INVENTORY_TASK | true   | 80                            | 0                        |
+------+-----------------+------------------------+--------+-------------------------------+--------------------------+
1 row in set (0.00 sec)
```

SHOW SCALING LIST 查询所有迁移作业。这是个全局 DistSQL 命令，返回所有状态的Scaling作业，而不是只针对回当前逻辑数据库的。SHOW SCALING STATUS 命令查询某个迁移作业的进度。

#### （3）割接

割接步骤包括：

**1、** 源数据库应用停写，以免丢失数据；

**2、** 查看迁移作业进度；

**3、** Proxy停写，即熔断；

**4、** 数据一致性校验；

**5、** 切换元数据；

**6、** 确认目标分片规则生效；

**7、** 创建绑定表规则（可选）；

**8、** 确认迁移作业已完成；

**9、** 应用连接到Proxy访问数据库；

应用停写：Ctrl + c 或kill 掉正在运行的存储过程。

查询迁移作业进度：

```java
mysql> show scaling status 0130317c30317c3054317c6d6967726174696e675f6462;
+------+-----------------+--------------------------+--------+-------------------------------+--------------------------+
| item | data_source     | status                   | active | inventory_finished_percentage | incremental_idle_seconds |
+------+-----------------+--------------------------+--------+-------------------------------+--------------------------+
| 0    | resource_source | EXECUTE_INCREMENTAL_TASK | true   | 100                           | 5                        |
+------+-----------------+--------------------------+--------+-------------------------------+--------------------------+
1 row in set (0.00 sec)
```

当status 达到 EXECUTE_INCREMENTAL_TASK，全量迁移已完成，在增量迁移阶段。inventory_finished_percentage表示存量数据完成百分比，incremental_idle_seconds表示增量空闲秒数，指示增量是否接近完成。

Proxy停写，选择一个业务低峰期，对源端库或数据操作入口做停写：

```java
stop scaling source writing 0130317c30317c3054317c6d6967726174696e675f6462;
```

数据一致性校验，根据数据量，这步可能执行较长时间：

```java
mysql> check scaling 0130317c30317c3054317c6d6967726174696e675f6462 by type (name=crc32_match);
+--------------+----------------------+----------------------+-----------------------+-------------------------+
| table_name   | source_records_count | target_records_count | records_count_matched | records_content_matched |
+--------------+----------------------+----------------------+-----------------------+-------------------------+
| t_order      | 57599                | 57599                | true                  | true                    |
| t_order_item | 1468140              | 1468140              | true                  | true                    |
+--------------+----------------------+----------------------+-----------------------+-------------------------+
2 rows in set (2.17 sec)
```

切换元数据：

```java
apply scaling 0130317c30317c3054317c6d6967726174696e675f6462;
```

预览目标分片是否已生效：

```java
mysql> preview select count(1) from t_order;
+------------------+-------------------------------------------------------------------------+
| data_source_name | actual_sql                                                              |
+------------------+-------------------------------------------------------------------------+
| resource_1       | select count(1) from t_order_0 UNION ALL select count(1) from t_order_4 |
| resource_2       | select count(1) from t_order_1 UNION ALL select count(1) from t_order_5 |
| resource_3       | select count(1) from t_order_2 UNION ALL select count(1) from t_order_6 |
| resource_4       | select count(1) from t_order_3 UNION ALL select count(1) from t_order_7 |
+------------------+-------------------------------------------------------------------------+
4 rows in set (0.01 sec)
mysql> preview select count(1) from t_order_item;
+------------------+-----------------------------------------------------------------------------------+
| data_source_name | actual_sql                                                                        |
+------------------+-----------------------------------------------------------------------------------+
| resource_1       | select count(1) from t_order_item_0 UNION ALL select count(1) from t_order_item_4 |
| resource_2       | select count(1) from t_order_item_1 UNION ALL select count(1) from t_order_item_5 |
| resource_3       | select count(1) from t_order_item_2 UNION ALL select count(1) from t_order_item_6 |
| resource_4       | select count(1) from t_order_item_3 UNION ALL select count(1) from t_order_item_7 |
+------------------+-----------------------------------------------------------------------------------+
4 rows in set (0.00 sec)
```

可以看到数据已经分片到新的数据库资源。

创建绑定表：

```java
create sharding binding table rules (t_order,t_order_item);
```

确认绑定表规则生效：

```java
mysql> preview select i.* from t_order o join t_order_item i on o.order_id=i.order_id where o.order_id in (10, 11);
+------------------+---------------------------------------------------------------------------------------------------------+
| data_source_name | actual_sql                                                                                              |
+------------------+---------------------------------------------------------------------------------------------------------+
| resource_3       | select i.* from t_order_2 o join t_order_item_2 i on o.order_id=i.order_id where o.order_id in (10, 11) |
| resource_4       | select i.* from t_order_3 o join t_order_item_3 i on o.order_id=i.order_id where o.order_id in (10, 11) |
+------------------+---------------------------------------------------------------------------------------------------------+
2 rows in set (0.06 sec)
```

确认迁移作业已完成：

```java
mysql> show scaling status 0130317c30317c3054317c7363616c696e675f6462;
+------+-----------------+----------+--------+-------------------------------+--------------------------+
| item | data_source     | status   | active | inventory_finished_percentage | incremental_idle_seconds |
+------+-----------------+----------+--------+-------------------------------+--------------------------+
| 0    | resource_source | FINISHED | false  | 100                           | 251                      |
+------+-----------------+----------+--------+-------------------------------+--------------------------+
1 rows in set (0.00 sec)
```

### 2. 数据库节点扩容

需求：现有两个正在使用的8分片表，需要将它们的数据节点扩容到16分片。两个表的数据实时变化，要求尽量缩短业务影响时间。

源：172.18.26.198:3306/db1、172.18.26.198:3306/db2

目标：172.18.10.66:3306/db1、172.18.10.66:3306/db2、172.18.18.102:3306\db1、172.18.18.102:3306\db2

Proxy：172.18.10.66:3307、172.18.18.102:3307，Cluster运行模式

#### （1）准备测试用例环境

源198，目标66、102执行：

```java
drop database if exists db1;
drop database if exists db2;
create database db1;
create database db2;
```

连接Proxy：

```java
mysql -u root -h 172.18.10.66 -P 3307 -p123456
```

创建逻辑库：

```java
drop database if exists scaling_db;
create database scaling_db;
use scaling_db;
```

添加源资源：

```java
add resource 
resource_source1 (host=172.18.26.198, port=3306, db=db1, user=wxy, password=mypass),
resource_source2 (host=172.18.26.198, port=3306, db=db2, user=wxy, password=mypass);
show schema resources\G
```

创建规则：

```java
-- 分片表
create sharding table rule 
t_order (
resources(resource_source1,resource_source2),
sharding_column=order_id,type(name=hash_mod,properties("sharding-count"=8)),
key_generate_strategy(column=order_id,type(name=snowflake))),
t_order_item (
resources(resource_source1,resource_source2),
sharding_column=order_id,type(name=hash_mod,properties("sharding-count"=8)),
key_generate_strategy(column=order_item_id,type(name=snowflake)));
-- 绑定表
create sharding binding table rules (t_order,t_order_item);
```

建表：

```java
create table t_order (
    order_id bigint auto_increment primary key, 
    order_datetime datetime not null,
    user_id bigint not null, 
    order_amount decimal(10,2) not null default 0, 
    key idx_order_datetime (order_datetime),
    key idx_user_id (user_id));
create table t_order_item (
    order_item_id bigint auto_increment primary key, 
    order_id bigint not null, 
    item_id int null,
    item_quantity int not null default 0,
    key idx_order_id (order_id));
```

预览规则是否已生效：

```java
mysql> preview select count(1) from t_order;
+------------------+-----------------------------------------------------------------------------------------------------------------------------------------------------------+
| data_source_name | actual_sql                                                                                                                                                |
+------------------+-----------------------------------------------------------------------------------------------------------------------------------------------------------+
| resource_source1 | select count(1) from t_order_0 UNION ALL select count(1) from t_order_2 UNION ALL select count(1) from t_order_4 UNION ALL select count(1) from t_order_6 |
| resource_source2 | select count(1) from t_order_1 UNION ALL select count(1) from t_order_3 UNION ALL select count(1) from t_order_5 UNION ALL select count(1) from t_order_7 |
+------------------+-----------------------------------------------------------------------------------------------------------------------------------------------------------+
2 rows in set (0.00 sec)
mysql> preview select count(1) from t_order_item;
+------------------+-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| data_source_name | actual_sql                                                                                                                                                                    |
+------------------+-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| resource_source1 | select count(1) from t_order_item_0 UNION ALL select count(1) from t_order_item_2 UNION ALL select count(1) from t_order_item_4 UNION ALL select count(1) from t_order_item_6 |
| resource_source2 | select count(1) from t_order_item_1 UNION ALL select count(1) from t_order_item_3 UNION ALL select count(1) from t_order_item_5 UNION ALL select count(1) from t_order_item_7 |
+------------------+-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
2 rows in set (0.00 sec)
mysql> preview select i.* from t_order o join t_order_item i on o.order_id=i.order_id where o.order_id in (10, 11);
+------------------+---------------------------------------------------------------------------------------------------------+
| data_source_name | actual_sql                                                                                              |
+------------------+---------------------------------------------------------------------------------------------------------+
| resource_source1 | select i.* from t_order_2 o join t_order_item_2 i on o.order_id=i.order_id where o.order_id in (10, 11) |
| resource_source2 | select i.* from t_order_3 o join t_order_item_3 i on o.order_id=i.order_id where o.order_id in (10, 11) |
+------------------+---------------------------------------------------------------------------------------------------------+
2 rows in set (0.00 sec)
```

添加存量数据：

```java
insert into t_order (order_id, order_datetime, user_id, order_amount) 
values 
(1, now(), 1, 100),(2, now(), 2, 200),(3, now(), 3, 300),(4, now(), 4, 400),
(5, now(), 5, 500),(6, now(), 6, 600),(7, now(), 7, 700),(8, now(), 8, 800);
insert into t_order_item (order_item_id, order_id, item_id, item_quantity) 
values 
(1,1,1,10),(2,1,2,20),(3,2,3,30),(4,2,4,40),(5,3,1,10),(6,3,2,20),(7,4,3,30),(8,4,4,40),
(9,5,1,10),(10,5,2,20),(11,6,3,30),(12,6,4,40),(13,7,1,10),(14,7,2,20),(15,8,3,30),(16,8,4,40);
```

ShardingSphere-Proxy只支持对非分片表使用MySQL存储函数、存储过程操作，因此这里只能使用普通的insert语句。

#### （2）创建数据迁移作业

创建数据迁移作业包含以下步骤：

**1、** 创建逻辑库；

**2、** 添加源资源；

**3、** 把现有系统中的表配置到规则里；

**4、** 创建shardingscaling规则；

**5、** 添加目标资源；

**6、** 修改分片规则，触发迁移；

**7、** 监控迁移作业；

本例中因为我们的源和目标使用同一个Proxy集群，第1-3步已经在上一步“准备测试用例环境”中完成了。

创建手动模式scaling规则：

```java
create sharding scaling rule scaling_manual (
input(
  worker_thread=40,
  batch_size=1000
),
output(
  worker_thread=40,
  batch_size=1000
),
stream_channel(type(name=memory, properties("block-queue-size"=10000))),
data_consistency_checker(type(name=data_match, properties("chunk-size"=1000)))
);
```

添加目标资源：

```java
add resource 
resource_1 (host=172.18.10.66, port=3306, db=db1, user=wxy, password=mypass),
resource_2 (host=172.18.10.66, port=3306, db=db2, user=wxy, password=mypass),
resource_3 (host=172.18.18.102, port=3306, db=db1, user=wxy, password=mypass),
resource_4 (host=172.18.18.102, port=3306, db=db2, user=wxy, password=mypass);
show schema resources\G
```

修改分片规则，触发迁移，注意绑定表只能一块迁移：

```java
alter sharding table rule 
t_order (
resources(resource_1,resource_2,resource_3,resource_4),
sharding_column=order_id,type(name=hash_mod,properties("sharding-count"=16)),
key_generate_strategy(column=order_id,type(name=snowflake))),
t_order_item (
resources(resource_1,resource_2,resource_3,resource_4),
sharding_column=order_id,type(name=hash_mod,properties("sharding-count"=16)),
key_generate_strategy(column=order_item_id,type(name=snowflake)));
```

监控迁移作业：

```java
mysql> show scaling list;
+------------------------------------------------+----------------------+----------------------+--------+---------------------+---------------------+
| id                                             | tables               | sharding_total_count | active | create_time         | stop_time           |
+------------------------------------------------+----------------------+----------------------+--------+---------------------+---------------------+
| 0130317c30317c3054317c6d6967726174696e675f6462 | t_order,t_order_item | 1                    | false  | 2022-06-06 18:19:47 | 2022-06-06 18:22:56 |
| 0130317c30317c3054317c7363616c696e675f6462     | t_order,t_order_item | 2                    | true   | 2022-06-07 07:13:30 | NULL                |
+------------------------------------------------+----------------------+----------------------+--------+---------------------+---------------------+
2 rows in set (0.01 sec)
mysql> show scaling status 0130317c30317c3054317c6d6967726174696e675f6462;
+------+-----------------+----------+--------+-------------------------------+--------------------------+
| item | data_source     | status   | active | inventory_finished_percentage | incremental_idle_seconds |
+------+-----------------+----------+--------+-------------------------------+--------------------------+
| 0    | resource_source | FINISHED | false  | 100                           | 46550                    |
+------+-----------------+----------+--------+-------------------------------+--------------------------+
1 row in set (0.01 sec)
mysql> show scaling status 0130317c30317c3054317c7363616c696e675f6462;
+------+------------------+--------------------------+--------+-------------------------------+--------------------------+
| item | data_source      | status                   | active | inventory_finished_percentage | incremental_idle_seconds |
+------+------------------+--------------------------+--------+-------------------------------+--------------------------+
| 0    | resource_source1 | EXECUTE_INCREMENTAL_TASK | true   | 100                           | 215                      |
| 1    | resource_source2 | EXECUTE_INCREMENTAL_TASK | true   | 100                           | 215                      |
+------+------------------+--------------------------+--------+-------------------------------+--------------------------+
2 rows in set (0.01 sec)
```

添加增量数据：

```java
insert into t_order (order_id, order_datetime, user_id, order_amount) 
values (9, now(), 1, 100),(10, now(), 2, 200);
insert into t_order_item (order_item_id, order_id, item_id, item_quantity) 
values 
(17,9,1,10),(18,9,2,20),(19,9,3,30),(20,9,4,40),(21,10,1,10),(22,10,2,20),(23,10,3,30),(24,10,4,40);
```

#### （3）割接

割接步骤包括：

**1、** 源数据库应用停写，以免丢失数据；

**2、** 查看迁移作业进度；

**3、** Proxy停写，即熔断；

**4、** 数据一致性校验；

**5、** 切换元数据；

**6、** 确认目标分片规则生效；

**7、** 确认迁移作业已完成；

**8、** 应用连接到Proxy访问数据库；

查询迁移作业进度：

```java
mysql> show scaling status 0130317c30317c3054317c7363616c696e675f6462;
+------+------------------+--------------------------+--------+-------------------------------+--------------------------+
| item | data_source      | status                   | active | inventory_finished_percentage | incremental_idle_seconds |
+------+------------------+--------------------------+--------+-------------------------------+--------------------------+
| 0    | resource_source1 | EXECUTE_INCREMENTAL_TASK | true   | 100                           | 51                       |
| 1    | resource_source2 | EXECUTE_INCREMENTAL_TASK | true   | 100                           | 51                       |
+------+------------------+--------------------------+--------+-------------------------------+--------------------------+
2 rows in set (0.01 sec)
```

Proxy停写，选择一个业务低峰期，对源端库或数据操作入口做停写：

```java
stop scaling source writing 0130317c30317c3054317c7363616c696e675f6462;
```

数据一致性校验，根据数据量，这步可能执行较长时间：

```java
mysql> check scaling 0130317c30317c3054317c7363616c696e675f6462 by type (name=crc32_match);
+--------------+----------------------+----------------------+-----------------------+-------------------------+
| table_name   | source_records_count | target_records_count | records_count_matched | records_content_matched |
+--------------+----------------------+----------------------+-----------------------+-------------------------+
| t_order      | 10                   | 10                   | true                  | true                    |
| t_order_item | 24                   | 24                   | true                  | true                    |
+--------------+----------------------+----------------------+-----------------------+-------------------------+
2 rows in set (0.46 sec)
```

切换元数据：

```java
apply scaling 0130317c30317c3054317c7363616c696e675f6462;
```

预览分片规则是否已生效：

```java
mysql> preview select count(1) from t_order;
+------------------+-------------------------------------------------------------------------------------------------------------------------------------------------------------+
| data_source_name | actual_sql                                                                                                                                                  |
+------------------+-------------------------------------------------------------------------------------------------------------------------------------------------------------+
| resource_1       | select count(1) from t_order_0 UNION ALL select count(1) from t_order_4 UNION ALL select count(1) from t_order_8 UNION ALL select count(1) from t_order_12  |
| resource_2       | select count(1) from t_order_1 UNION ALL select count(1) from t_order_5 UNION ALL select count(1) from t_order_9 UNION ALL select count(1) from t_order_13  |
| resource_3       | select count(1) from t_order_2 UNION ALL select count(1) from t_order_6 UNION ALL select count(1) from t_order_10 UNION ALL select count(1) from t_order_14 |
| resource_4       | select count(1) from t_order_3 UNION ALL select count(1) from t_order_7 UNION ALL select count(1) from t_order_11 UNION ALL select count(1) from t_order_15 |
+------------------+-------------------------------------------------------------------------------------------------------------------------------------------------------------+
4 rows in set (0.01 sec)
mysql> preview select count(1) from t_order_item;
+------------------+---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| data_source_name | actual_sql                                                                                                                                                                      |
+------------------+---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| resource_1       | select count(1) from t_order_item_0 UNION ALL select count(1) from t_order_item_4 UNION ALL select count(1) from t_order_item_8 UNION ALL select count(1) from t_order_item_12  |
| resource_2       | select count(1) from t_order_item_1 UNION ALL select count(1) from t_order_item_5 UNION ALL select count(1) from t_order_item_9 UNION ALL select count(1) from t_order_item_13  |
| resource_3       | select count(1) from t_order_item_2 UNION ALL select count(1) from t_order_item_6 UNION ALL select count(1) from t_order_item_10 UNION ALL select count(1) from t_order_item_14 |
| resource_4       | select count(1) from t_order_item_3 UNION ALL select count(1) from t_order_item_7 UNION ALL select count(1) from t_order_item_11 UNION ALL select count(1) from t_order_item_15 |
+------------------+---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
4 rows in set (0.01 sec)
mysql> preview select i.* from t_order o join t_order_item i on o.order_id=i.order_id where o.order_id in (10, 11);
+------------------+-----------------------------------------------------------------------------------------------------------+
| data_source_name | actual_sql                                                                                                |
+------------------+-----------------------------------------------------------------------------------------------------------+
| resource_3       | select i.* from t_order_10 o join t_order_item_10 i on o.order_id=i.order_id where o.order_id in (10, 11) |
| resource_4       | select i.* from t_order_11 o join t_order_item_11 i on o.order_id=i.order_id where o.order_id in (10, 11) |
+------------------+-----------------------------------------------------------------------------------------------------------+
2 rows in set (0.00 sec)
```

可以看到数据已经分片到新的数据库资源。 确认迁移作业已完成：

```java
mysql> show scaling status 0130317c30317c3054317c7363616c696e675f6462;
+------+------------------+----------+--------+-------------------------------+--------------------------+
| item | data_source      | status   | active | inventory_finished_percentage | incremental_idle_seconds |
+------+------------------+----------+--------+-------------------------------+--------------------------+
| 0    | resource_source1 | FINISHED | false  | 100                           | 276                      |
| 1    | resource_source2 | FINISHED | false  | 100                           | 276                      |
+------+------------------+----------+--------+-------------------------------+--------------------------+
2 rows in set (0.01 sec)
mysql> preview select i.* from t_order o join t_order_item i on o.order_id=i.order_id where o.order_id in (10, 11);
+------------------+---------------------------------------------------------------------------------------------------------+
| data_source_name | actual_sql                                                                                              |
+------------------+---------------------------------------------------------------------------------------------------------+
| resource_3       | select i.* from t_order_2 o join t_order_item_2 i on o.order_id=i.order_id where o.order_id in (10, 11) |
| resource_4       | select i.* from t_order_3 o join t_order_item_3 i on o.order_id=i.order_id where o.order_id in (10, 11) |
+------------------+---------------------------------------------------------------------------------------------------------+
2 rows in set (0.01 sec)
```
