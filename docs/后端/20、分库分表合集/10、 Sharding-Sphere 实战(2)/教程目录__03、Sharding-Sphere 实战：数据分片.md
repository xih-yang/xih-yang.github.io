# 03、Sharding-Sphere 实战：数据分片
- 来源：https://ddkk.com/zhuanlan/sharding/shardingsphere/2/3.html
- 分类：分库分表
- 分组：教程目录
## 一、功能详解

### 1. 背景

传统的将数据集中存储至单一节点的解决方案，在性能、可用性和运维成本这三方面已经难于满足海量数据的场景。

从性能方面来说，由于关系型数据库大多采用B+树类型的索引，在数据量超过阈值的情况下，索引深度的增加也将使得磁盘访问的IO次数增加，进而导致查询性能的下降。同时，高并发访问请求也使得集中式数据库成为系统的最大瓶颈。

从可用性的方面来讲，服务化的无状态性，能够达到较小成本的随意扩容，这必然导致系统的最终压力都落在数据库之上。而单一的数据节点，或者简单的主从架构，已经越来越难以承担。数据库的可用性，已成为整个系统的关键。

从运维成本方面考虑，当一个数据库实例中的数据达到阈值以上，对于DBA的运维压力就会增大。数据备份和恢复的时间成本都将随着数据量的大小而愈发不可控。**一般来讲，单一数据库实例数据量的阈值在1TB之内，是比较合理的范围**。

在传统的关系型数据库无法满足互联网场景需要的情况下，将数据存储至原生支持分布式的NoSQL的尝试越来越多。但NoSQL对SQL的不兼容性以及生态圈的不完善，使得它们在与关系型数据库的博弈中始终无法完成致命一击，而关系型数据库的地位却依然不可撼动。

数据分片指按照某个维度将存放在单一数据库中的数据分散地存放至多个数据库或表中，以达到提升性能以及可用性的效果。数据分片的有效手段是对关系型数据库进行分库和分表。分库和分表均可以有效地避免由数据量超过可承受阈值而产生的查询瓶颈。除此之外，分库还能够用于有效地分散对数据库单点的访问量；分表虽然无法缓解数据库压力，但却能够提供尽量将分布式事务转化为本地事务的可能，一旦涉及到跨库的更新操作，分布式事务往往会使问题变得复杂。使用多主多从的分片方式，可以有效避免数据单点，从而提升数据架构的可用性。

通过分库和分表进行数据拆分，使得各个表的数据量保持在阈值以下，以及对流量进行疏导，是应对高并发访问和海量数据系统的有效手段。

数据分片的拆分方式又分为垂直分片和水平分片。按照业务拆分的方式称为垂直分片，又称为纵向拆分，它的核心理念是专库专用。在拆分之前，一个数据库由多个数据表构成，每个表对应着不同的业务。而拆分之后，则是按照业务将表进行归类，分布到不同的数据库中，从而将压力分散至不同的数据库。下图展示了根据业务需要，将用户表和订单表垂直分片到不同的数据库的方案。

垂直分片往往需要对架构和设计进行调整。通常来讲，是来不及应对互联网业务需求快速变化的。而且，它也并无法真正解决单点瓶颈。垂直拆分可以缓解数据量和访问量带来的问题，但无法根治。如果垂直拆分之后，表中的数据量依然超过单节点所能承载的阈值，则需要水平分片来进一步处理。

水平分片又称为横向拆分。相对于垂直分片，它不再将数据根据业务逻辑分类，而是通过某个字段（或某几个字段），根据某种规则将数据分散至多个库或表中，每个分片仅包含数据的一部分。例如：根据主键分片，偶数主键的记录放入0库（或表），奇数主键的记录放入1库（或表），如下图所示。

水平分片从理论上突破了单机数据量处理的瓶颈，并且扩展相对自由，是数据分片的标准解决方案。

虽然数据分片解决了性能、可用性以及单点备份恢复等问题，但分布式的架构在获得了收益的同时，也引入了新的问题。面对如此散乱的分片之后的数据，应用开发工程师和数据库管理员对数据库的操作变得异常繁重就是其中的重要挑战之一。他们需要知道数据需要从哪个具体的数据库的子表中获取。

另一个挑战则是，能够正确地运行在单节点数据库中的SQL，在分片之后的数据库中并不一定能够正确运行。例如，分表导致表名称的修改，或者分页、排序、聚合分组等操作的不正确处理。

跨库事务也是分布式的数据库集群要面对的棘手事情。合理采用分表，可以在降低单表数据量的情况下，尽量使用本地事务，善于使用同库不同表可有效避免分布式事务带来的麻烦。在不能避免跨库事务的场景，有些业务仍然需要保持事务的一致性。而基于XA的分布式事务由于在并发度高的场景中性能无法满足需要，并未被互联网巨头大规模使用，他们大多采用最终一致性的柔性事务代替强一致事务。

尽量透明化分库分表所带来的影响，让使用方尽量像使用一个数据库一样使用水平分片之后的数据库集群，是ShardingSphere数据分片模块的主要设计目标。

### 2. 核心概念

本节主要介绍ShardingSphere数据分片的核心概念。

#### （1）表

表是透明化数据分片的关键概念。ShardingSphere通过提供多样化的表类型，适配不同场景下的数据分片需求。

- 逻辑表

相同结构的水平拆分数据库（表）的逻辑名称，是SQL中表的逻辑标识。例：订单数据根据主键尾数拆分为10张表，分别是t_order_0到t_order_9，他们的逻辑表名为t_order。

- 真实表

在水平拆分的数据库中真实存在的物理表，如上个示例中的t_order_0 到t_order_9。

- 绑定表

指分片规则一致的一组分片表。使用绑定表进行多表关联查询时，如果不使用分片键进行关联，会导致笛卡尔积关联或跨库关联，从而影响查询效率。例如：t_order表和t_order_item表，均按照order_id分片，并且使用order_id进行关联，则此两张表互为绑定表关系。绑定表之间的多表关联查询不会出现笛卡尔积关联，关联查询效率将大大提升。举例说明，如果SQL为：

```java
SELECT i.* FROM t_order o JOIN t_order_item i ON o.order_id=i.order_id WHERE o.order_id in (10, 11);
```

在不配置绑定表关系时，假设分片键order_id将数值10路由至第0片，将数值11路由至第1片，那么路由后的SQL应该为4条，它们呈现为笛卡尔积：

```java
SELECT i.* FROM t_order_0 o JOIN t_order_item_0 i ON o.order_id=i.order_id WHERE o.order_id in (10, 11);
SELECT i.* FROM t_order_0 o JOIN t_order_item_1 i ON o.order_id=i.order_id WHERE o.order_id in (10, 11);
SELECT i.* FROM t_order_1 o JOIN t_order_item_0 i ON o.order_id=i.order_id WHERE o.order_id in (10, 11);
SELECT i.* FROM t_order_1 o JOIN t_order_item_1 i ON o.order_id=i.order_id WHERE o.order_id in (10, 11);
```

在配置绑定表关系，并且使用order_id进行关联后，路由的SQL应该为2条：

```java
SELECT i.* FROM t_order_0 o JOIN t_order_item_0 i ON o.order_id=i.order_id WHERE o.order_id in (10, 11);
SELECT i.* FROM t_order_1 o JOIN t_order_item_1 i ON o.order_id=i.order_id WHERE o.order_id in (10, 11);
```

其中t_order表由于指定了分片条件，ShardingSphere将会以它作为整个绑定表的主表（关联查询中出现的第一个表）。所有路由计算将会只使用主表的策略，那么t_order_item表的分片计算将会使用t_order的条件。

- 广播表

指所有的分片数据源中都存在的表，表结构及其数据在每个数据库中均完全一致。适用于数据量不大且需要与海量数据的表进行关联查询的场景，例如：字典表。

- 单表

指所有的分片数据源中仅唯一存在的表。适用于数据量不大且无需分片的表。

#### （2）数据节点

数据分片的最小单元，由数据源名称和真实表组成。例：ds_0.t_order_0。逻辑表与真实表的映射关系，可分为均匀分布和自定义分布两种形式。

均匀分布指数据表在每个数据源内呈现均匀分布的态势，例如：

```java
db0
  ├── t_order0
  └── t_order1
db1
  ├── t_order0
  └── t_order1
```

数据节点的配置如下：

```java
db0.t_order0, db0.t_order1, db1.t_order0, db1.t_order1
```

自定义分布指数据表呈现有特定规则的分布，例如：

```java
db0
  ├── t_order0
  └── t_order1
db1
  ├── t_order2
  ├── t_order3
  └── t_order4
```

数据节点的配置如下：

```java
db0.t_order0, db0.t_order1, db1.t_order2, db1.t_order3, db1.t_order4
```

#### （3）分片

- 分片键

用于将数据库（表）水平拆分的数据库字段。例：将订单表中的订单主键取模分片，则订单主键为分片字段。SQL中如果无分片字段，将执行全路由，性能较差。除了对单分片字段的支持，ShardingSphere也支持根据多个字段进行分片。

- 分片算法

用于将数据分片的算法，支持 =、>=、、、=、{ expression } 标识行表达式即可。目前支持数据节点和分片算法这两个部分的配置。行表达式的内容使用的是Groovy的语法，Groovy能够支持的所有操作，行表达式均能够支持。例如：${begin..end} 表示范围区间；${[unit1, unit2, unit_x]} 表示枚举值。

行表达式中如果出现连续多个 ${ expression } 或 $->{ expression } 表达式，整个表达式最终的结果将会根据每个子表达式的结果进行笛卡尔组合。例如，以下行表达式：

```java
${['online', 'offline']}_table${1..3}
```

最终会解析为：

```java
online_table1, online_table2, online_table3, offline_table1, offline_table2, offline_table3
```

对于均匀分布的数据节点，如果数据结构如下：

```java
db0
  ├── t_order0
  └── t_order1
db1
  ├── t_order0
  └── t_order1
```

用行表达式可以简化为：db${0..1}.t_order${0..1} 或者 db$->{0..1}.t_order$->{0..1}

对于自定义的数据节点，如果数据结构如下：

```java
db0
  ├── t_order0
  └── t_order1
db1
  ├── t_order2
  ├── t_order3
  └── t_order4
```

用行表达式可以简化为：db0.t_order${0..1},db1.t_order${2..4} 或者 db0.t_order$->{0..1},db1.t_order$->{2..4}

对于有前缀的数据节点，也可以通过行表达式灵活配置，如果数据结构如下：

```java
db0
  ├── t_order_00
  ├── t_order_01
  ├── t_order_02
  ├── t_order_03
  ├── t_order_04
  ├── t_order_05
  ├── t_order_06
  ├── t_order_07
  ├── t_order_08
  ├── t_order_09
  ├── t_order_10
  ├── t_order_11
  ├── t_order_12
  ├── t_order_13
  ├── t_order_14
  ├── t_order_15
  ├── t_order_16
  ├── t_order_17
  ├── t_order_18
  ├── t_order_19
  └── t_order_20
db1
  ├── t_order_00
  ├── t_order_01
  ├── t_order_02
  ├── t_order_03
  ├── t_order_04
  ├── t_order_05
  ├── t_order_06
  ├── t_order_07
  ├── t_order_08
  ├── t_order_09
  ├── t_order_10
  ├── t_order_11
  ├── t_order_12
  ├── t_order_13
  ├── t_order_14
  ├── t_order_15
  ├── t_order_16
  ├── t_order_17
  ├── t_order_18
  ├── t_order_19
  └── t_order_20
```

可以使用分开配置的方式，先配置包含前缀的数据节点，再配置不含前缀的数据节点，再利用行表达式笛卡尔积的特性，自动组合即可。上面的示例，用行表达式可以简化为：db${0..1}.t_order_0${0..9}, db${0..1}.t_order_${10..20} 或者 db${0..1}.t_order_0${0..9}, db${0..1}.t_order_${10..20}

对于只有一个分片键的使用 = 和 IN 进行分片的SQL，可以使用行表达式代替编码方式配置。行表达式内部的表达式本质上是一段Groovy代码，可以根据分片键进行计算的方式，返回相应的真实数据源或真实表名称。例如：分为 10 个库，尾数为 0 的路由到后缀为 0 的数据源，尾数为 1 的路由到后缀为 1 的数据源，以此类推。用于表示分片算法的行表达式为：ds${id % 10} 或者 ds$->{id % 10}。

#### （5）分布式主键

传统数据库软件开发中，主键自动生成技术是基本需求。而各个数据库对于该需求也提供了相应的支持，比如MySQL的自增键，Oracle的自增序列等。

数据分片后，不同数据节点生成全局唯一主键是非常棘手的问题。同一个逻辑表内的不同实际表之间的自增键由于无法互相感知而产生重复主键。虽然可通过约束自增主键初始值和步长的方式避免碰撞，但需引入额外的运维规则，使解决方案缺乏完整性和可扩展性。

目前有许多第三方解决方案可以完美解决这个问题，如UUID等依靠特定算法自生成不重复键，或者通过引入主键生成服务等。为了方便用户使用、满足不同用户不同使用场景的需求，ShardingSphere不仅提供了内置的分布式主键生成器，例如UUID、SNOWFLAKE，还抽离出分布式主键生成器的接口，方便用户自行实现自定义的自增主键生成器。

内置的主键生成器包括：UUID采用UUID.randomUUID()的方式产生分布式主键；NanoID生成长度为21的字符串分布式主键；SNOWFLAKE使用雪花算法（snowflake）生成64bit的长整型数据。

在分片规则配置模块可配置每个表的主键生成策略，默认使用SNOWFLAKE。雪花算法是由Twitter公布的分布式主键生成算法，它能够保证不同进程主键的不重复性，以及相同进程主键的有序性。

在同一个进程中，它首先是通过时间位保证不重复，如果时间相同则是通过序列位保证。同时由于时间位是单调递增的，且各个服务器如果大体做了时间同步，那么生成的主键在分布式环境可以认为是总体有序的，这就保证了对索引字段的插入的高效性。例如MySQL的Innodb存储引擎的主键。

使用雪花算法生成的主键，二进制表示形式包含四部分，从高位到低位分表为：1bit符号位、41bit时间戳位、10bit工作进程位以及12bit序列号位。

- 符号位

预留的符号位，恒为零。

- 时间戳位（41bit）

41bit的时间戳可以容纳的毫秒数是 2 的 41 次幂，约等于 69.73 年（Math.pow(2, 41) / (365 * 24 * 60 * 60 * 1000L)）。ShardingSphere的雪花算法的时间纪元从 2016年11月1日 零点开始，可以使用到 2086 年，相信能满足绝大部分系统的要求。

- 工作进程位（10bit）

该标志在 Java 进程内是唯一的，如果是分布式应用部署应保证每个工作进程的 id 是不同的。该值默认为0，可通过属性设置。

- 序列号位（12bit）

该序列号位用来在同一个毫秒内生成不同的ID。如果在这个毫秒内生成的数量超过4096（2 的 12 次幂），那么生成器会等待到下个毫秒继续生成。

雪花算法主键的详细结构见下图。

服务器**时钟回拨**会导致产生重复序列，因此默认分布式主键生成器提供了一个最大容忍的时钟回拨毫秒数。如果时钟回拨的时间超过最大容忍的毫秒数阈值，则程序报错；如果在可容忍的范围内，默认分布式主键生成器会等待时钟同步到最后一次主键生成的时间后再继续工作。最大容忍的时钟回拨毫秒数的默认值为0，可通过属性设置。

### 3. 使用规范

虽然ShardingSphere希望能够完全兼容所有的SQL以及单机数据库，但分布式为数据库带来了更加复杂的场景。ShardingSphere希望能够优先解决海量数据OLTP的问题，OLAP的相关支持，会一点一点的逐渐完善。

#### （1）SQL

兼容全部常用的路由至单数据节点的SQL； 路由至多数据节点的SQL由于场景复杂，分为稳定支持、实验性支持和不支持这三种情况。

- 稳定支持

全面支持DML、DDL、DCL、TCL和常用DAL。支持分页、去重、排序、分组、聚合、表关联等复杂查询。

常规查询主语句：

```java
SELECT select_expr [, select_expr ...] FROM table_reference [, table_reference ...]
[WHERE predicates]
[GROUP BY {col_name | position} [ASC | DESC], ...]
[ORDER BY {col_name | position} [ASC | DESC], ...]
[LIMIT {[offset,] row_count | row_count OFFSET offset}]
```

select_expr：

```java
* | 
[DISTINCT] COLUMN_NAME [AS] [alias] | 
(MAX | MIN | SUM | AVG)(COLUMN_NAME | alias) [AS] [alias] | 
COUNT(* | COLUMN_NAME | alias) [AS] [alias]
```

table_reference：

```java
tbl_name [AS] alias] [index_hint_list]
| table_reference ([INNER] | {LEFT|RIGHT} [OUTER]) JOIN table_factor [JOIN ON conditional_expr | USING (column_list)]
```

子查询和外层查询同时指定分片键，且分片键的值保持一致时，由内核提供稳定支持。例如：

```java
SELECT * FROM (SELECT * FROM t_order WHERE order_id = 1) o WHERE o.order_id = 1;
```

用于分页的子查询，由内核提供稳定支持。例如：

```java
SELECT * FROM (SELECT row_.*, rownum rownum_ FROM (SELECT * FROM t_order) row_ WHERE rownum <= ?) WHERE rownum > ?;
```

当分片键处于运算表达式中时，无法通过SQL字面提取用于分片的值，将导致全路由。例如，假设create_time为分片键：

```java
SELECT * FROM t_order WHERE to_date(create_time, 'yyyy-mm-dd') = '2019-01-01';
```

SQL示例：

**稳定支持的SQL**

**必要条件**

SELECT * FROM tbl_name

SELECT * FROM tbl_name WHERE (col1 = ? or col2 = ?) and col3 = ?

SELECT * FROM tbl_name WHERE col1 = ? ORDER BY col2 DESC LIMIT ?

SELECT COUNT(*), SUM(col1), MIN(col1), MAX(col1), AVG(col1) FROM tbl_name WHERE col1 = ?

SELECT COUNT(col1) FROM tbl_name WHERE col2 = ? GROUP BY col1 ORDER BY col3 DESC LIMIT ?, ?

SELECT DISTINCT * FROM tbl_name WHERE col1 = ?

SELECT COUNT(DISTINCT col1), SUM(DISTINCT col1) FROM tbl_name

(SELECT * FROM tbl_name)

SELECT * FROM (SELECT * FROM tbl_name WHERE col1 = ?) o WHERE o.col1 = ?

子查询和外层查询在同一分片后的数据节点

INSERT INTO tbl_name (col1, col2,…) VALUES (?, ?, ….)

INSERT INTO tbl_name VALUES (?, ?,….)

INSERT INTO tbl_name (col1, col2, …) VALUES(1 + 2, ?, …)

INSERT INTO tbl_name (col1, col2, …) VALUES (?, ?, ….), (?, ?, ….)

INSERT INTO tbl_name (col1, col2, …) SELECT col1, col2, … FROM tbl_name WHERE col3 = ?

INSERT 表和 SELECT 表相同表或绑定表

REPLACE INTO tbl_name (col1, col2, …) SELECT col1, col2, … FROM tbl_name WHERE col3 = ?

REPLACE 表和 SELECT 表相同表或绑定表

UPDATE tbl_name SET col1 = ? WHERE col2 = ?

DELETE FROM tbl_name WHERE col1 = ?

CREATE TABLE tbl_name (col1 int, …)

ALTER TABLE tbl_name ADD col1 varchar(10)

DROP TABLE tbl_name

TRUNCATE TABLE tbl_name

CREATE INDEX idx_name ON tbl_name

DROP INDEX idx_name ON tbl_name

DROP INDEX idx_name

**慢SQL**

**原因**

SELECT * FROM tbl_name WHERE to_date(create_time, ‘yyyy-mm-dd’) = ?

分片键在运算表达式中，导致全路由

- 实验性支持

实验性支持特指使用Federation执行引擎提供支持。该引擎处于快速开发中，用户虽基本可用，但仍需大量优化，是实验性产品。

子查询和外层查询未同时指定分片键，或分片键的值不一致时，由Federation执行引擎提供支持。例如：

```java
SELECT * FROM (SELECT * FROM t_order) o;
SELECT * FROM (SELECT * FROM t_order) o WHERE o.order_id = 1;
SELECT * FROM (SELECT * FROM t_order WHERE order_id = 1) o;
SELECT * FROM (SELECT * FROM t_order WHERE order_id = 1) o WHERE o.order_id = 2;
```

当关联查询中的多个表分布在不同的数据库实例上时，由Federation执行引擎提供支持。假设t_order和t_order_item是多数据节点的分片表，并且未配置绑定表规则，t_user和t_user_role是分布在不同的数据库实例上的单表，那么Federation执行引擎能够支持如下常用的关联查询：

```java
SELECT * FROM t_order o INNER JOIN t_order_item i ON o.order_id = i.order_id WHERE o.order_id = 1;
SELECT * FROM t_order o INNER JOIN t_user u ON o.user_id = u.user_id WHERE o.user_id = 1;
SELECT * FROM t_order o LEFT JOIN t_user_role r ON o.user_id = r.user_id WHERE o.user_id = 1;
SELECT * FROM t_order_item i LEFT JOIN t_user u ON i.user_id = u.user_id WHERE i.user_id = 1;
SELECT * FROM t_order_item i RIGHT JOIN t_user_role r ON i.user_id = r.user_id WHERE i.user_id = 1;
SELECT * FROM t_user u RIGHT JOIN t_user_role r ON u.user_id = r.user_id WHERE u.user_id = 1;
```

SQL示例：

**实验性支持的SQL**

**必要条件**

SELECT * FROM (SELECT * FROM tbl_name) o

SELECT * FROM (SELECT * FROM tbl_name) o WHERE o.col1 = ?

SELECT * FROM (SELECT * FROM tbl_name WHERE col1 = ?) o

SELECT * FROM (SELECT * FROM tbl_name WHERE col1 = ?) o WHERE o.col1 = ?

子查询和外层查询不在同一分片后的数据节点

SELECT (SELECT MAX(col1) FROM tbl_name) a, col2 from tbl_name

SELECT SUM(DISTINCT col1), SUM(col1) FROM tbl_name

SELECT col1, SUM(col2) FROM tbl_name GROUP BY col1 HAVING SUM(col2) > ?

SELECT col1, col2 FROM tbl_name UNION SELECT col1, col2 FROM tbl_name

SELECT col1, col2 FROM tbl_name UNION ALL SELECT col1, col2 FROM tbl_name

- 不支持

以下CASE WHEN语句不支持：CASE WHEN 中包含子查询；CASE WHEN 中使用逻辑表名（请使用表别名）。

SQL示例：

**不支持的SQL**

**原因**

**解决方案**

INSERT INTO tbl_name (col1, col2, …) SELECT * FROM tbl_name WHERE col3 = ?

SELECT 子句不支持 * 和内置分布式主键生成器

无

REPLACE INTO tbl_name (col1, col2, …) SELECT * FROM tbl_name WHERE col3 = ?

SELECT 子句不支持 * 和内置分布式主键生成器

无

SELECT MAX(tbl_name.col1) FROM tbl_name

查询列是函数表达式时，查询列前不能使用表名

使用表别名

#### （2）分页

完全支持MySQL、PostgreSQL和Oracle的分页查询，SQLServer由于分页查询较为复杂，仅部分支持。

- 性能瓶颈

查询偏移量过大的分页（深度分页）会导致数据库获取数据性能低下，以MySQL为例：

```java
SELECT * FROM t_order ORDER BY id LIMIT 1000000, 10
```

这句SQL会使得MySQL在无法利用索引的情况下跳过1,000,000条记录后，再获取10条记录，其性能可想而知。而在分库分表的情况下（假设分为2个库），为了保证数据的正确性，SQL会改写为：

```java
SELECT * FROM t_order ORDER BY id LIMIT 0, 1000010
```

即将偏移量前的记录全部取出，并仅获取排序后的最后10条记录。这会在数据库本身就执行很慢的情况下，进一步加剧性能瓶颈。因为原SQL仅需要传输10条记录至客户端，而改写之后的SQL则会传输 1,000,010 * 2 的记录至客户端。

- ShardingSphere的优化

ShardingSphere 进行了 2 个方面的优化。

首先，采用流式处理 + 归并排序的方式来避免内存的过量占用。由于SQL改写不可避免的占用了额外的带宽，但并不会导致内存暴涨。与直觉不同，大多数人认为ShardingSphere会将 1,000,010 * 2 记录全部加载至内存，进而占用大量内存而导致内存溢出。但由于每个结果集的记录是有序的，因此ShardingSphere每次比较仅获取各个分片的当前结果集记录，驻留在内存中的记录仅为当前路由到的分片的结果集的当前游标指向而已。按归并思想合并 m 个长度为 n 的已排序数组，时间复杂度为 O(mn(log m))，一般分片数量 m 都较小，可以认为时间复杂度为 O(n)，性能损耗很小。

其次，ShardingSphere对仅落至单分片的查询进行进一步优化。落至单分片查询的请求并不需要改写SQL也可以保证记录的正确性，因此在此种情况下，ShardingSphere并未进行SQL改写，从而达到节省带宽的目的。

- 分页方案优化

由于LIMIT 并不能通过索引查询数据，因此如果可以保证 ID 的连续性，通过 ID 进行分页是比较好的解决方案：

```java
SELECT * FROM t_order WHERE id > 100000 AND id <= 100010 ORDER BY id
```

或通过记录上次查询结果的最后一条记录的 ID 进行下一页的查询：

```java
SELECT * FROM t_order WHERE id > 100000 LIMIT 10
```

- 分页子查询

Oracle和SQLServer的分页都需要通过子查询来处理，ShardingSphere支持分页相关的子查询。

Oracle 支持使用 rownum 进行分页：

```java
SELECT * FROM (SELECT row_.*, rownum rownum_ FROM (SELECT o.order_id as order_id FROM t_order o JOIN t_order_item i ON o.order_id = i.order_id) row_ WHERE rownum <= ?) WHERE rownum > ?
```

目前不支持 rownum + BETWEEN 的分页方式。

SQLServer 支持使用 TOP + ROW_NUMBER() OVER 配合进行分页：

```java
SELECT * FROM (SELECT TOP (?) ROW_NUMBER() OVER (ORDER BY o.order_id DESC) AS rownum, * FROM t_order o) AS temp WHERE temp.rownum > ? ORDER BY temp.order_id
```

支持SQLServer 2012 之后的 OFFSET FETCH 的分页方式：

```java
SELECT * FROM t_order o ORDER BY id OFFSET ? ROW FETCH NEXT ? ROWS ONLY
```

目前不支持使用 WITH xxx AS (SELECT …) 的方式进行分页。由于 Hibernate 自动生成的 SQLServer 分页语句使用了 WITH 语句，因此目前并不支持基于 Hibernate 的 SQLServer 分页。 目前也不支持使用两个 TOP + 子查询的方式实现分页。

MySQL 和 PostgreSQL 都支持 LIMIT 分页，无需子查询：

```java
SELECT * FROM t_order o ORDER BY id LIMIT ? OFFSET ?
```

## 二、实现细节

ShardingSphere的三个产品的数据分片主要流程是完全一致的，按照是否进行查询优化，可以分为Standard内核流程和Federation执行引擎流程，如下图所示。 Standard内核流程由 SQL解析 => SQL路由 => SQL改写 => SQL执行 => 结果归并 组成，主要用于处理标准分片场景下的SQL执行。 Federation执行引擎流程由 SQL解析 => 逻辑优化 => 物理优化 => 优化执行 => Standard内核流程 组成，Federation执行引擎内部进行逻辑优化和物理优化，在优化执行阶段依赖Standard内核流程，对优化后的逻辑SQL进行路由、改写、执行和归并。

- SQL解析

分为词法解析和语法解析。先通过词法解析器将SQL拆分为一个个不可再分的单词，再使用语法解析器对SQL进行理解，并最终提炼出解析上下文。解析上下文包括表、选择项、排序项、分组项、聚合函数、分页信息、查询条件以及可能需要修改的占位符的标记。

- SQL路由

根据解析上下文匹配用户配置的分片策略，并生成路由路径。目前支持分片路由和广播路由。

- SQL改写

将SQL改写为在真实数据库中可以正确执行的语句。SQL改写分为正确性改写和优化改写。

- SQL执行

通过多线程执行器异步执行。

- 结果归并

将多个执行结果集归并以便于通过统一的JDBC接口输出。结果归并包括流式归并、内存归并和使用装饰者模式的追加归并这几种方式。

- 查询优化

由Federation执行引擎（开发中）提供支持，对关联查询、子查询等复杂查询进行优化，同时支持跨多个数据库实例的分布式查询，内部使用关系代数优化查询计划，通过最优计划查询出结果。

### 1. 解析引擎

相对于其他编程语言，SQL是比较简单的。不过，它依然是一门完善的编程语言，因此对SQL的语法进行解析，与解析其他编程语言（如：Java 语言、C 语言、Go 语言等）并无本质区别。

#### （1）抽象语法树

解析过程分为词法解析和语法解析。词法解析器用于将SQL拆解为不可再分的原子符号，称为Token。并根据不同数据库方言所提供的字典，将其归类为关键字、表达式、字面量和操作符。再使用语法解析器将词法解析器的输出转换为抽象语法树。例如以下SQL：

```java
SELECT id, name FROM t_user WHERE status = 'ACTIVE' AND age > 18
```

解析之后的为抽象语法树见下图。

为了便于理解，抽象语法树中的关键字的Token用绿色表示，变量的Token用红色表示，灰色表示需要进一步拆分。

最后，通过visitor对抽象语法树遍历构造域模型，通过域模型（SQLStatement）去提炼分片所需的上下文，并标记有可能需要改写的位置。供分片使用的解析上下文包含查询选择项（Select Items）、表信息（Table）、分片条件（Sharding Condition）、自增主键信息（Auto increment Primary Key）、排序信息（Order By）、分组信息（Group By）以及分页信息（Limit、Rownum、Top）。 SQL的一次解析过程是不可逆的，一个个Token按SQL原本的顺序依次进行解析，性能很高。考虑到各种数据库SQL方言的异同，在解析模块提供了各类数据库的SQL方言字典。

#### （2）SQL解析引擎

SQL解析作为分库分表类产品的核心，其性能和兼容性是最重要的衡量指标。ShardingSphere的SQL解析器经历了三代产品的更新迭代。

第一代SQL解析器为了追求性能与快速实现，在1.4.x之前的版本使用Druid作为SQL解析器。经实际测试，它的性能远超其它解析器。

第二代SQL解析器从1.5.x版本开始，ShardingSphere采用完全自研的SQL解析引擎。由于目的不同，ShardingSphere并不需要将 SQL转为一颗完全的抽象语法树，也无需通过访问器模式进行二次遍历。它采用对SQL半理解的方式，仅提炼数据分片需要关注的上下文，因此SQL解析的性能和兼容性得到了进一步的提高。

第三代SQL解析器从3.0.x版本开始，尝试使用ANTLR作为SQL解析引擎的生成器，并采用Visit的方式从AST中获取SQL Statement。从5.0.x版本开始，解析引擎的架构已完成重构调整，同时通过将第一次解析得到的AST放入缓存，方便下次直接获取相同SQL的解析结果，来提高解析效率。因此建议用户采用PreparedStatement这种SQL预编译的方式来提升性能。

SQL解析引擎具有以下特性：

- 提供独立的SQL解析功能。
- 可以非常方便地对语法规则进行扩充和修改（使用了ANTLR）。
- 支持多种方言的SQL解析。

下表给出了SQL解析引擎对主要数据库系统SQL的支持状态。

**数据库**

**支持状态**

MySQL

支持，完善

PostgreSQL

支持，完善

SQLServer

支持

Oracle

支持

SQL92

支持

openGauss

支持

### 2. 路由引擎

路由引擎根据解析上下文匹配数据库和表的分片策略生成路由。对于携带分片键的SQL，根据分片键的不同可以划分为单片路由（分片键的操作符是等号）、多片路由（分片键的操作符是IN）和范围路由（分片键的操作符是BETWEEN）。不携带分片键的SQL则采用广播路由。

分片策略通常可以采用由数据库内置或由用户方配置。数据库内置的方案较为简单，内置的分片策略大致可分为尾数取模、哈希、范围、标签、时间等。由用户方配置的分片策略则更加灵活，可以根据使用方需求定制复合分片策略。如果配合数据自动迁移来使用，可以做到无需用户关注分片策略，自动由数据库中间层分片和平衡数据即可，进而做到使分布式数据库具有的弹性伸缩的能力。在ShardingSphere的线路规划中，弹性伸缩将于4.x开启。

#### （1）分片路由

用于根据分片键进行路由的场景。

- 直接路由

满足直接路由的条件相对苛刻，它需要通过Hint（使用HintAPI直接指定路由至库表）方式分片，并且是只分库不分表的前提下，可以避免SQL解析和之后的结果归并。因此它的兼容性最好，可以执行包括子查询、自定义函数等复杂情况的任意SQL。直接路由还可以用于分片键不在SQL中的场景。

- 标准路由

标准路由是ShardingSphere最为推荐使用的分片方式，它的适用范围是不包含关联查询或仅包含绑定表之间关联查询的 SQL。当分片运算符是等于号时，路由结果将落入单库（表），当分片运算符是 BETWEEN 或 IN 时，则路由结果不一定落入唯一的库（表），因此一条逻辑SQL最终可能被拆分为多条用于执行的真实SQL。举例说明，如果按照 order_id 的奇数和偶数进行数据分片，一个单表查询的SQL如下：

```java
SELECT * FROM t_order WHERE order_id IN (1, 2);
```

那么路由的结果应为：

```java
SELECT * FROM t_order_0 WHERE order_id IN (1, 2);
SELECT * FROM t_order_1 WHERE order_id IN (1, 2);
```

绑定表的关联查询与单表查询复杂度和性能相当。举例说明，如果一个包含绑定表的关联查询的SQL如下：

```java
SELECT * FROM t_order o JOIN t_order_item i ON o.order_id=i.order_id  WHERE order_id IN (1, 2);
```

那么路由的结果应为：

```java
SELECT * FROM t_order_0 o JOIN t_order_item_0 i ON o.order_id=i.order_id  WHERE order_id IN (1, 2);
SELECT * FROM t_order_1 o JOIN t_order_item_1 i ON o.order_id=i.order_id  WHERE order_id IN (1, 2);
```

可以看到，SQL拆分的数目与单表是一致的。

- 笛卡尔积路由

笛卡尔路由是最复杂的情况，它无法根据绑定表的关系定位分片规则，因此非绑定表之间的关联查询需要拆解为笛卡尔积组合执行。如果上个示例中的SQL并未配置绑定表关系，那么路由的结果应为：

```java
SELECT * FROM t_order_0 o JOIN t_order_item_0 i ON o.order_id=i.order_id  WHERE order_id IN (1, 2);
SELECT * FROM t_order_0 o JOIN t_order_item_1 i ON o.order_id=i.order_id  WHERE order_id IN (1, 2);
SELECT * FROM t_order_1 o JOIN t_order_item_0 i ON o.order_id=i.order_id  WHERE order_id IN (1, 2);
SELECT * FROM t_order_1 o JOIN t_order_item_1 i ON o.order_id=i.order_id  WHERE order_id IN (1, 2);
```

笛卡尔路由查询性能较低，需谨慎使用。

#### （2）广播路由

对于不携带分片键的SQL，则采取广播路由的方式。根据SQL类型又可以划分为全库表路由、全库路由、全实例路由、单播路由和阻断路由五种类型。

- 全库表路由

全库表路由用于处理对数据库中与其逻辑表相关的所有真实表的操作，主要包括不带分片键的DQL和DML，以及DDL等。例如：

```java
SELECT * FROM t_order WHERE good_prority IN (1, 10);
```

则会遍历所有数据库中的所有表，逐一匹配逻辑表和真实表名，能够匹配得上则执行。路由后成为

```java
SELECT * FROM t_order_0 WHERE good_prority IN (1, 10);
SELECT * FROM t_order_1 WHERE good_prority IN (1, 10);
SELECT * FROM t_order_2 WHERE good_prority IN (1, 10);
SELECT * FROM t_order_3 WHERE good_prority IN (1, 10);
```

- 全库路由

全库路由用于处理对数据库的操作，包括用于库设置的 SET 类型的数据库管理命令，以及 TCL 这样的事务控制语句。在这种情况下，会根据逻辑库的名字遍历所有符合名字匹配的真实库，并在真实库中执行该命令，例如：

```java
SET autocommit=0;
```

在t_order中执行，t_order有两个真实库，则实际会在t_order_0和t_order_1上都执行这个命令。

- 全实例路由

全实例路由用于 DCL 操作，授权语句针对的是数据库的实例。无论一个实例中包含多少个Schema，每个数据库的实例只执行一次。例如：

```java
CREATE USER customer@127.0.0.1 identified BY '123';
```

这个命令将在所有的真实数据库实例中执行，以确保 customer 用户可以访问每一个实例。

- 单播路由

单播路由用于获取某一真实表信息的场景，它仅需要从任意库中的任意真实表中获取数据即可。例如：

```java
DESCRIBE t_order;
```

t_order的两个真实表t_order_0、t_order_1的描述结构相同，所以这个命令在任意真实表上选择执行一次。

- 阻断路由

阻断路由用于屏蔽SQL对数据库的操作，例如：

```java
USE order_db;
```

这个命令不会在真实数据库中执行，因为ShardingSphere采用的是逻辑Schema的方式，无需将切换数据库Schema的命令发送至数据库中。

路由引擎的整体结构划分如下图。

### 3. 改写引擎

工程师面向逻辑库与逻辑表书写的SQL，并不能够直接在真实的数据库中执行，SQL改写用于将逻辑SQL改写为在真实数据库中可以正确执行的SQL。它包括正确性改写和优化改写两部分。

#### （1）正确性改写

在包含分表的场景中，需要将分表配置中的逻辑表名称改写为路由之后所获取的真实表名称。仅分库则不需要表名称的改写。除此之外，还包括补列和分页信息修正等内容。

- 标识符改写

需要改写的标识符包括表名称、索引名称以及 Schema 名称。表名称改写是指将找到逻辑表在原始SQL中的位置，并将其改写为真实表的过程。表名称改写是一个典型的需要对SQL进行解析的场景。从一个最简单的例子开始，若逻辑SQL为：

```java
SELECT order_id FROM t_order WHERE order_id=1;
```

假设该SQL配置分片键 order_id，并且 order_id=1 的情况，将路由至分片表 1。那么改写之后的SQL应该为：

```java
SELECT order_id FROM t_order_1 WHERE order_id=1;
```

在这种最简单的SQL场景中，是否将SQL解析为抽象语法树似乎无关紧要，只要通过字符串查找和替换就可以达到SQL 改写的效果。但是下面的场景，就无法仅仅通过字符串的查找替换来正确的改写SQL了：

```java
SELECT order_id FROM t_order WHERE order_id=1 AND remarks=' t_order xxx';
```

正确改写的SQL应该是：

```java
SELECT order_id FROM t_order_1 WHERE order_id=1 AND remarks=' t_order xxx';
```

而非：

```java
SELECT order_id FROM t_order_1 WHERE order_id=1 AND remarks=' t_order_1 xxx';
```

由于表名之外可能含有表名称的类似字符，因此不能通过简单的字符串替换的方式去改写SQL。

下面再来看一个更加复杂的SQL改写场景：

```java
SELECT t_order.order_id FROM t_order WHERE t_order.order_id=1 AND remarks=' t_order xxx';
```

上面的SQL将表名作为字段的标识符，因此在SQL改写时需要一并修改：

```java
SELECT t_order_1.order_id FROM t_order_1 WHERE t_order_1.order_id=1 AND remarks=' t_order xxx';
```

而如果SQL中定义了表的别名，则无需连同别名一起修改，即使别名与表名相同亦是如此。例如：

```java
SELECT t_order.order_id FROM t_order AS t_order WHERE t_order.order_id=1 AND remarks=' t_order xxx';
```

SQL改写则仅需要改写表名称就可以了：

```java
SELECT t_order.order_id FROM t_order_1 AS t_order WHERE t_order.order_id=1 AND remarks=' t_order xxx';
```

索引名称是另一个有可能改写的标识符。 在某些数据库中（如 MySQL、SQLServer），索引是以表为维度创建的，在不同的表中的索引是可以重名的；而在另外的一些数据库中（如 PostgreSQL、Oracle），索引是以数据库为维度创建的，即使是作用在不同表上的索引，它们也要求其名称的唯一性。

在ShardingSphere中，管理Schema的方式与管理表如出一辙，它采用逻辑Schema去管理一组数据源。 因此，ShardingSphere需要将用户在SQL中书写的逻辑Schema替换为真实的数据库Schema。

ShardingSphere目前还不支持在DQL和DML语句中使用Schema。它目前仅支持在数据库管理语句中使用Schema，例如：

```java
SHOW COLUMNS FROM t_order FROM order_ds;
```

Schema的改写指的是将逻辑Schema采用单播路由的方式，改写为随机查找到的一个正确的真实Schema。

- 补列

需要在查询语句中补列通常由两种情况导致。第一种情况是ShardingSphere需要在结果归并时获取相应数据，但该数据并未能通过查询的SQL返回。这种情况主要是针对 GROUP BY 和 ORDER BY。结果归并时，需要根据 GROUP BY 和 ORDER BY 的字段项进行分组和排序，但如果原始SQL的选择项中若并未包含分组项或排序项，则需要对原始SQL进行改写。 先看一下原始SQL中带有结果归并所需信息的场景：

```java
SELECT order_id, user_id FROM t_order ORDER BY user_id;
```

由于使用 user_id 进行排序，在结果归并中需要能够获取到 user_id 的数据，而上面的 SQL 是能够获取到 user_id 数据的，因此无需补列。

如果选择项中不包含结果归并时所需的列，则需要进行补列，如以下SQL：

```java
SELECT order_id FROM t_order ORDER BY user_id;
```

由于原始SQL中并不包含需要在结果归并中需要获取的 user_id，因此需要对SQL进行补列改写。补列之后的SQL是：

```java
SELECT order_id, user_id AS ORDER_BY_DERIVED_0 FROM t_order ORDER BY user_id;
```

值得一提的是，补列只会补充缺失的列，不会全部补充，而且，在 SELECT 语句中包含 * 的SQL，也会根据表的元数据信息选择性补列。下面是一个较为复杂的SQL补列场景：

```java
SELECT o.* FROM t_order o, t_order_item i WHERE o.order_id=i.order_id ORDER BY user_id, order_item_id;
```

我们假设只有 t_order_item 表中包含 order_item_id 列，那么根据表的元数据信息可知，在结果归并时，排序项中的 user_id 是存在于 t_order 表中的，无需补列；order_item_id 并不在 t_order 中，因此需要补列。 补列之后的SQL是：

```java
SELECT o.*, order_item_id AS ORDER_BY_DERIVED_0 FROM t_order o, t_order_item i WHERE o.order_id=i.order_id ORDER BY user_id, order_item_id;
```

补列的另一种情况是使用 AVG 聚合函数。在分布式的场景中，使用 avg1 + avg2 + avg3 / 3 计算平均值并不正确，需要改写为 (sum1 + sum2 + sum3) / (count1 + count2 + count3)。 这就需要将包含 AVG 的SQL改写为 SUM 和 COUNT，并在结果归并时重新计算平均值。例如以下SQL：

```java
SELECT AVG(price) FROM t_order WHERE user_id=1;
```

需要改写为：

```java
SELECT COUNT(price) AS AVG_DERIVED_COUNT_0, SUM(price) AS AVG_DERIVED_SUM_0 FROM t_order WHERE user_id=1;
```

然后才能够通过结果归并正确的计算平均值。

最后一种补列是在执行 INSERT 的SQL语句时，如果使用数据库自增主键，是无需写入主键字段的。但数据库的自增主键是无法满足分布式场景下的主键唯一的，因此ShardingSphere提供了分布式自增主键的生成策略，并且可以通过补列，让使用方无需改动现有代码，即可将分布式自增主键透明的替换数据库现有的自增主键。举例说明，假设表 t_order 的主键是 order_id，原始的SQL为：

```java
INSERT INTO t_order (field1, field2) VALUES (10, 1);
```

可以看到，上述SQL中并未包含自增主键，是需要数据库自行填充的。ShardingSphere配置自增主键后，SQL将改写为：

```java
INSERT INTO t_order (field1, field2, order_id) VALUES (10, 1, xxxxx);
```

改写后的SQL将在 INSERT FIELD 和 INSERT VALUE 的最后部分增加主键列名称以及自动生成的自增主键值。上述SQL中的 xxxxx 表示自动生成的自增主键值。

如果INSERT 的SQL中并未包含表的列名称，ShardingSphere也可以根据判断参数个数以及表元信息中的列数量对比，并自动生成自增主键。例如，原始的 SQL 为：

```java
INSERT INTO t_order VALUES (10, 1);
```

改写的SQL将只在主键所在的列顺序处增加自增主键即可：

```java
INSERT INTO t_order VALUES (xxxxx, 10, 1);
```

自增主键补列时，如果使用占位符的方式书写SQL，则只需要改写参数列表即可，无需改写SQL本身。

- 分页修正

从多个数据库获取分页数据与单数据库的场景是不同的。假设每 10 条数据为一页，取第 2 页数据。在分片环境下获取 LIMIT 10, 10，归并之后再根据排序条件取出前 10 条数据是不正确的。举例说明，若SQL为：

```java
SELECT score FROM t_score ORDER BY score DESC LIMIT 1, 2;
```

下图展示了不进行SQL的改写的分页执行结果。

通过图中所示，想要取得两个表中共同的按照分数排序的第 2 条和第 3 条数据，应该是 95 和 90。 由于执行的SQL只能从每个表中获取第 2 条和第 3 条数据，即从 t_score_0 表中获取的是 90 和 80；从 t_score_1 表中获取的是 85 和 75。因此进行结果归并时，只能从获取的 90，80，85 和 75 之中进行归并，那么结果归并无论怎么实现，都不可能获得正确的结果。

正确的做法是将分页条件改写为 LIMIT 0, 3，取出所有前两页数据，再结合排序条件计算出正确的数据。下图展示了进行SQL改写之后的分页执行结果。

越获取偏移量位置靠后数据，使用 LIMIT 分页方式的效率就越低。有很多方法可以避免使用 LIMIT 进行分页。比如构建行记录数量与行偏移量的二级索引，或使用上次分页数据结尾 ID 作为下次查询条件的分页方式等。

分页信息修正时，如果使用占位符的方式书写SQL，则只需要改写参数列表即可，无需改写SQL本身。

- 批量拆分

在使用批量插入的SQL时，如果插入的数据是跨分片的，那么需要对SQL进行改写来防止将多余的数据写入到数据库中。插入操作与查询操作的不同之处在于，查询语句中即使用了不存在于当前分片的分片键，也不会对数据产生影响；而插入操作则必须将多余的分片键删除。举例说明，如下SQL：

```java
INSERT INTO t_order (order_id, xxx) VALUES (1, 'xxx'), (2, 'xxx'), (3, 'xxx');
```

假设数据库仍然是按照 order_id 的奇偶值分为两片的，仅将这条SQL中的表名进行修改，然后发送至数据库完成SQL的执行，则两个分片都会写入相同的记录。虽然只有符合分片查询条件的数据才能够被查询语句取出，但存在冗余数据的实现方案并不合理。因此需要将SQL改写为：

```java
INSERT INTO t_order_0 (order_id, xxx) VALUES (2, 'xxx');
INSERT INTO t_order_1 (order_id, xxx) VALUES (1, 'xxx'), (3, 'xxx');
```

使用IN 的查询与批量插入的情况相似，不过 IN 操作并不会导致数据查询结果错误。通过对 IN 查询的改写，可以进一步的提升查询性能。如以下SQL：

```java
SELECT * FROM t_order WHERE order_id IN (1, 2, 3);
```

改写为：

```java
SELECT * FROM t_order_0 WHERE order_id IN (2);
SELECT * FROM t_order_1 WHERE order_id IN (1, 3);
```

可以进一步的提升查询性能。ShardingSphere暂时还未实现此改写策略，目前的改写结果是：

```java
SELECT * FROM t_order_0 WHERE order_id IN (1, 2, 3);
SELECT * FROM t_order_1 WHERE order_id IN (1, 2, 3);
```

虽然SQL的执行结果是正确的，但并未达到最优的查询效率。

#### （2）优化改写

优化改写是在不影响查询正确性的情况下，对性能进行提升的有效手段。它分为单节点优化和流式归并优化。

- 单节点优化

路由至单节点的SQL，则无需优化改写。当获得一次查询的路由结果后，如果是路由至唯一的数据节点，则无需涉及到结果归并。因此补列和分页信息等改写都没有必要进行。尤其是分页信息的改写，无需将数据从第 1 条开始取，大量降低了对数据库的压力，并且节省了网络带宽的无谓消耗。

- 流式归并优化

它仅为包含 GROUP BY 的SQL增加 ORDER BY 以及和分组项相同的排序项和排序顺序，用于将内存归并转化为流式归并。在后面“归并引擎”部分中，将对流式归并和内存归并进行详细说明。

改写引擎的整体结构划分如下图所示。

### 4. 执行引擎

ShardingSphere采用一套自动化的执行引擎，负责将路由和改写完成之后的真实SQL安全且高效发送到底层数据源执行。它不是简单地将SQL通过 JDBC 直接发送至数据源执行；也并非直接将执行请求放入线程池去并发执行。它更关注平衡数据源连接创建以及内存占用所产生的消耗，以及最大限度地合理利用并发等问题。执行引擎的目标是自动化的平衡资源控制与执行效率。

#### （1）连接模式

从资源控制的角度看，业务方访问数据库的连接数量应当有所限制。它能够有效地防止某一业务操作过多的占用资源，从而将数据库连接的资源耗尽，以致于影响其他业务的正常访问。特别是在一个数据库实例中存在较多分表的情况下，一条不包含分片键的逻辑SQL将产生落在同库不同表的大量真实SQL，如果每条真实SQL都占用一个独立的连接，那么一次查询无疑将会占用过多的资源。

从执行效率的角度看，为每个分片查询维持一个独立的数据库连接，可以更加有效的利用多线程来提升执行效率。为每个数据库连接开启独立的线程，可以将 I/O 所产生的消耗并行处理。为每个分片维持一个独立的数据库连接，还能够避免过早的将查询结果数据加载至内存。独立的数据库连接，能够持有查询结果集游标位置的引用，在需要获取相应数据时移动游标即可。

以结果集游标下移进行结果归并的方式，称之为流式归并，它无需将结果数据全数加载至内存，可以有效的节省内存资源，进而减少垃圾回收的频次。当无法保证每个分片查询持有一个独立数据库连接时，则需要在复用该数据库连接获取下一张分表的查询结果集之前，将当前的查询结果集全数加载至内存。因此，即使可以采用流式归并，在此场景下也将退化为内存归并。

一方面是对数据库连接资源的控制保护，一方面是采用更优的归并模式达到对中间件内存资源的节省，如何处理好两者之间的关系，是ShardingSphere执行引擎需要解决的问题。具体来说，如果一条SQL在经过ShardingSphere的分片后，需要操作某数据库实例下的 200 张表。 那么，是选择创建 200 个连接并行执行，还是选择创建一个连接串行执行呢？效率与资源控制又应该如何抉择呢？

针对上述场景，ShardingSphere提供了一种解决思路。它提出了连接模式（Connection Mode）的概念，将其划分为内存限制模式（MEMORY_STRICTLY）和连接限制模式（CONNECTION_STRICTLY）这两种类型。

- 内存限制模式

使用此模式的前提是，ShardingSphere对一次操作所耗费的数据库连接数量不做限制。如果实际执行的SQL需要对某数据库实例中的 200 张表做操作，则对每张表创建一个新的数据库连接，并通过多线程的方式并发处理，以达成执行效率最大化。并且在SQL满足条件情况下，优先选择流式归并，以防止出现内存溢出或避免频繁垃圾回收情况。

- 连接限制模式

使用此模式的前提是，ShardingSphere严格控制对一次操作所耗费的数据库连接数量。如果实际执行的SQL需要对某数据库实例中的 200 张表做操作，那么只会创建唯一的数据库连接，并对其 200 张表串行处理。如果一次操作中的分片散落在不同的数据库，仍然采用多线程处理对不同库的操作，但每个库的每次操作仍然只创建一个唯一的数据库连接。这样即可以防止对一次请求对数据库连接占用过多所带来的问题。该模式始终选择内存归并。

内存限制模式适用于 OLAP 操作，可以通过放宽对数据库连接的限制提升系统吞吐量；连接限制模式适用于 OLTP 操作，OLTP 通常带有分片键，会路由到单一的分片，因此严格控制数据库连接，以保证在线系统数据库资源能够被更多的应用所使用，是明智的选择。

#### （2）自动化执行引擎

ShardingSphere最初将使用何种模式的决定权交由用户配置，让开发者依据自己业务的实际场景需求选择使用内存限制模式或连接限制模式。

这种解决方案将两难的选择的决定权交由用户，使得用户必须要了解这两种模式的利弊，并依据业务场景需求进行选择。这无疑增加了用户对ShardingSphere的学习和使用的成本，并非最优方案。

这种一分为二的处理方案，将两种模式的切换交由静态的初始化配置，是缺乏灵活应对能力的。在实际的使用场景中，面对不同SQL以及占位符参数，每次的路由结果是不同的。这就意味着某些操作可能需要使用内存归并，而某些操作则可能选择流式归并更优，具体采用哪种方式不应该由用户在ShardingSphere启动之前配置好，而是应该根据SQL和占位符参数的场景，来动态的决定连接模式。

为了降低用户的使用成本以及连接模式动态化这两个问题，ShardingSphere提炼出自动化执行引擎的思路，在其内部消化了连接模式概念。用户无需了解所谓的内存限制模式和连接限制模式是什么，而是交由执行引擎根据当前场景自动选择最优的执行方案。

自动化执行引擎将连接模式的选择粒度细化至每一次SQL的操作。针对每次SQL请求，自动化执行引擎都将根据其路由结果，进行实时的演算和权衡，并自主地采用恰当的连接模式执行，以达到资源控制和效率的最优平衡。针对自动化的执行引擎，用户只需配置 maxConnectionSizePerQuery 即可，该参数表示一次查询时每个数据库所允许使用的最大连接数。

执行引擎分为准备和执行两个阶段。

- 准备阶段

顾名思义，此阶段用于准备执行的数据。它分为结果集分组和执行单元创建两个步骤。

结果集分组是实现内化连接模式概念的关键。执行引擎根据 maxConnectionSizePerQuery 配置项，结合当前路由结果，选择恰当的连接模式。具体步骤如下：

**1、** 将SQL的路由结果按照数据源的名称进行分组；

**2、** 通过下图的公式，可以获得每个数据库实例在maxConnectionSizePerQuery的允许范围内，每个连接需要执行的SQL路由结果组，并计算出本次请求的最优连接模式；

在maxConnectionSizePerQuery 允许的范围内，当一个连接需要执行的请求数量大于 1 时，意味着当前的数据库连接无法持有相应的数据结果集，则必须采用内存归并；反之，当一个连接需要执行的请求数量等于 1 时，意味着当前的数据库连接可以持有相应的数据结果集，则可以采用流式归并。

每一次的连接模式的选择，是针对每一个物理数据库的。也就是说，在同一次查询中，如果路由至一个以上的数据库，每个数据库的连接模式不一定一样，它们可能是混合存在的形态。

通过上一步骤获得的路由分组结果创建执行的单元。当数据源使用数据库连接池等控制数据库连接数量的技术时，在获取数据库连接时，如果不妥善处理并发，则有一定几率发生死锁。在多个请求相互等待对方释放数据库连接资源时，将会产生饥饿等待，造成交叉的死锁问题。

举例说明，假设一次查询需要在某一数据源上获取两个数据库连接，并路由至同一个数据库的两个分表查询。则有可能出现查询 A 已获取到该数据源的 1 个数据库连接，并等待获取另一个数据库连接；而查询 B 也已经在该数据源上获取到的一个数据库连接，并同样等待另一个数据库连接的获取。如果数据库连接池的允许最大连接数是 2，那么这 2 个查询请求将永久的等待下去。下图描绘了死锁的情况。

ShardingSphere为了避免死锁的出现，在获取数据库连接时进行了同步处理。它在创建执行单元时，以原子性的方式一次性获取本次SQL请求所需的全部数据库连接，杜绝了每次查询请求获取到部分资源的可能。由于对数据库的操作非常频繁，每次获取数据库连接时都进行锁定，会降低ShardingSphere的并发。因此，ShardingSphere在这里进行了两点优化：

**1、** 避免锁定一次性只需要获取1个数据库连接的操作因为每次仅需要获取1个连接，则不会发生两个请求相互等待的场景，无需锁定对于大部分OLTP的操作，都是使用分片键路由至唯一的数据节点，这会使得系统变为完全无锁的状态，进一步提升了并发效率除了路由至单分片的情况，读写分离也在此范畴之内；

**2、** 仅针对内存限制模式时才进行资源锁定在使用连接限制模式时，所有的查询结果集将在装载至内存之后释放掉数据库连接资源，因此不会产生死锁等待的问题；

- 执行阶段

该阶段用于真正的执行SQL，它分为分组执行和归并结果集生成两个步骤。

分组执行将准备执行阶段生成的执行单元分组下发至底层并发执行引擎，并针对执行过程中的每个关键步骤发送事件。如：执行开始事件、执行成功事件以及执行失败事件。执行引擎仅关注事件的发送，它并不关心事件的订阅者。ShardingSphere的其他模块，如：分布式事务、调用链路追踪等，会订阅感兴趣的事件，并进行相应的处理。

ShardingSphere通过在执行准备阶段的获取的连接模式，生成内存归并结果集或流式归并结果集，并将其传递至结果归并引擎，以进行下一步的工作。

执行引擎的整体结构划分如下图所示。

### 5. 归并引擎

将从各个数据节点获取的多数据结果集，组合成为一个结果集并正确的返回至请求客户端，称为结果归并。

ShardingSphere支持的结果归并从功能上分为遍历、排序、分组、分页和聚合五种类型，它们是组合而非互斥的关系。从结构划分，可分为流式归并、内存归并和装饰者归并。流式归并和内存归并是互斥的，装饰者归并可以在流式归并和内存归并之上做进一步的处理。

由于从数据库中返回的结果集是逐条返回的，并不需要将所有的数据一次性加载至内存中，因此，在进行结果归并时，沿用数据库返回结果集的方式进行归并，能够极大减少内存的消耗，是归并方式的优先选择。

流式归并是指每一次从结果集中获取到的数据，都能够通过逐条获取的方式返回正确的单条数据，它与数据库原生的返回结果集的方式最为契合。遍历、排序以及流式分组都属于流式归并的一种。

内存归并则是需要将结果集的所有数据都遍历并存储在内存中，再通过统一的分组、排序以及聚合等计算之后，再将其封装成为逐条访问的数据结果集返回。

装饰者归并是对所有的结果集归并进行统一的功能增强，目前装饰者归并有分页归并和聚合归并这两种类型。

#### （1）遍历归并

它是最为简单的归并方式。只需将多个数据结果集合并为一个单向链表即可。在遍历完成链表中当前数据结果集之后，将链表元素后移一位，继续遍历下一个数据结果集即可。

#### （2）排序归并

由于在SQL中存在 ORDER BY 语句，因此每个数据结果集自身是有序的，因此只需要将数据结果集当前游标指向的数据值进行排序即可。这相当于对多个有序的数组进行排序，归并排序是最适合此场景的排序算法。

ShardingSphere在对排序的查询进行归并时，将每个结果集的当前数据值进行比较（通过实现 Java 的 Comparable 接口完成），并将其放入优先级队列。每次获取下一条数据时，只需将队列顶端结果集的游标下移，并根据新游标重新进入优先级排序队列找到自己的位置即可。

通过一个例子来说明ShardingSphere的排序归并，下图是一个通过分数进行排序的示例图。 图中展示了 3 张表返回的数据结果集，每个数据结果集已经根据分数排序完毕，但是 3 个数据结果集之间是无序的。 将 3 个数据结果集的当前游标指向的数据值进行排序，并放入优先级队列，t_score_0 的第一个数据值最大，t_score_2 的第一个数据值次之，t_score_1 的第一个数据值最小，因此优先级队列根据 t_score_0，t_score_2 和 t_score_1 的方式排序队列。

下图则展现了进行 next 调用的时候，排序归并是如何进行的。通过图中我们可以看到，当进行第一次 next 调用时，排在队列首位的 t_score_0 将会被弹出队列，并且将当前游标指向的数据值（也就是 100）返回至查询客户端，并且将游标下移一位之后，重新放入优先级队列。而优先级队列也会根据 t_score_0 的当前数据结果集指向游标的数据值（这里是 90）进行排序，根据当前数值，t_score_0 排列在队列的最后一位。之前队列中排名第二的 t_score_2 的数据结果集则自动排在了队列首位。

在进行第二次 next 时，只需要将目前排列在队列首位的 t_score_2 弹出队列，并且将其数据结果集游标指向的值返回至客户端，并下移游标，继续加入队列排队，以此类推。当一个结果集中已经没有数据了，则无需再次加入队列。

可以看到，对于每个数据结果集中的数据有序，而多数据结果集整体无序的情况下，ShardingSphere无需将所有的数据都加载至内存即可排序。它使用的是流式归并的方式，每次 next 仅获取唯一正确的一条数据，极大的节省了内存的消耗。

从另一个角度来说，ShardingSphere的排序归并，是在维护数据结果集的纵轴和横轴这两个维度的有序性。纵轴是指每个数据结果集本身，它是天然有序的，它通过包含 ORDER BY 的 SQL 所获取。横轴是指每个数据结果集当前游标所指向的值，它需要通过优先级队列来维护其正确顺序。每一次数据结果集当前游标的下移，都需要将该数据结果集重新放入优先级队列排序，而只有排列在队列首位的数据结果集才可能发生游标下移的操作。

#### （3）分组归并

分组归并的情况最为复杂，它分为流式分组归并和内存分组归并。流式分组归并要求SQL的排序项与分组项的字段以及排序类型（ASC 或 DESC）必须保持一致，否则只能通过内存归并才能保证其数据的正确性。

举例说明，假设根据科目分片，表结构中包含考生的姓名（为了简单起见，不考虑重名的情况）和分数。通过SQL获取每位考生的总分，可通过如下SQL：

```java
SELECT name, SUM(score) FROM t_score GROUP BY name ORDER BY name;
```

在分组项与排序项完全一致的情况下，取得的数据是连续的，分组所需的数据全数存在于各个数据结果集的当前游标所指向的数据值，因此可以采用流式归并。如下图所示。

进行归并时，逻辑与排序归并类似。下图展现了进行 next 调用的时候，流式分组归并是如何进行的。

通过图中我们可以看到，当进行第一次 next 调用时，排在队列首位的 t_score_java 将会被弹出队列，并且将分组值同为 “Jerry” 的其他结果集中的数据一同弹出队列。在获取了所有的姓名为 “Jerry” 的同学的分数之后，进行累加操作，那么，在第一次 next 调用结束后，取出的结果集是 “Jerry” 的分数总和。与此同时，所有的数据结果集中的游标都将下移至数据值 “Jerry” 的下一个不同的数据值，并且根据数据结果集当前游标指向的值进行重排序。因此，包含名字顺着第二位的 “John” 的相关数据结果集则排在的队列的前列。

流式分组归并与排序归并的区别仅仅在于两点：

**1、** 它会一次性的将多个数据结果集中的分组项相同的数据全数取出；

**2、** 它需要根据聚合函数的类型进行聚合计算；

对于分组项与排序项不一致的情况，由于需要获取分组的相关的数据值并非连续的，因此无法使用流式归并，需要将所有的结果集数据加载至内存中进行分组和聚合。例如，若通过以下SQL获取每位考生的总分并按照分数从高至低排序：

```java
SELECT name, SUM(score) FROM t_score GROUP BY name ORDER BY score DESC;
```

那么各个数据结果集中取出的数据与排序归并那张图的上半部分的表结构的原始数据一致，是无法进行流式归并的。

当SQL中只包含分组语句时，根据不同数据库的实现，其排序的顺序不一定与分组顺序一致。但由于排序语句的缺失，则表示此 SQL 并不在意排序顺序。因此，ShardingSphere通过SQL优化的改写，自动增加与分组项一致的排序项，使其能够从消耗内存的内存分组归并方式转化为流式分组归并方案。

#### （4）聚合归并

无论是流式分组归并还是内存分组归并，对聚合函数的处理都是一致的。除了分组的SQL之外，不进行分组的SQL也可以使用聚合函数。因此，聚合归并是在之前介绍的归并类的之上追加的归并能力，即装饰者模式。聚合函数可以归类为比较、累加和求平均值三种类型。

比较类型的聚合函数是指 MAX 和 MIN。它们需要对每一个同组的结果集数据进行比较，并且直接返回其最大或最小值即可。

累加类型的聚合函数是指 SUM 和 COUNT。它们需要将每一个同组的结果集数据进行累加。

求平均值的聚合函数只有 AVG。它必须通过SQL改写的 SUM 和 COUNT 进行计算，相关内容已在SQL改写的内容中涵盖，不再赘述。

#### （5）分页归并

上文所述的所有归并类型都可能进行分页。分页也是追加在其他归并类型之上的装饰器，ShardingSphere通过装饰者模式来增加对数据结果集进行分页的能力。分页归并负责将无需获取的数据过滤掉。

ShardingSphere的分页功能比较容易让使用者误解，用户通常认为分页归并会占用大量内存。在分布式的场景中，将 LIMIT 10000000, 10 改写为 LIMIT 0, 10000010，才能保证其数据的正确性。用户非常容易产生ShardingSphere会将大量无意义的数据加载至内存中，造成内存溢出风险的错觉。其实，通过流式归并的原理可知，会将数据全部加载到内存中的只有内存分组归并这一种情况。而通常来说，进行 OLAP 的分组SQL，不会产生大量的结果数据，它更多的用于大量的计算，以及少量结果产出的场景。除了内存分组归并这种情况之外，其他情况都通过流式归并获取数据结果集，因此ShardingSphere会通过结果集的 next 方法将无需取出的数据全部跳过，并不会将其存入内存。

但同时需要注意的是，由于排序的需要，大量的数据仍然需要传输到ShardingSphere的内存空间。 因此，采用 LIMIT 这种方式分页，并非最佳实践。由于 LIMIT 并不能通过索引查询数据，因此如果可以保证 ID 的连续性，通过 ID 进行分页是比较好的解决方案，例如：

```java
SELECT * FROM t_order WHERE id > 100000 AND id <= 100010 ORDER BY id;
```

或通过记录上次查询结果的最后一条记录的 ID 进行下一页的查询，例如：

```java
SELECT * FROM t_order WHERE id > 10000000 LIMIT 10;
```

归并引擎的整体结构划分如下图。

## 三、用例测试

本节用一些简单的例子演示ShardingSphere的数据分片功能。先看一下ShardingSphere-Proxy的运行模式。

```java
mysql> show instance mode\G
*************************** 1. row ***************************
instance_id: 210.73.209.102@3307
       type: Cluster
 repository: ZooKeeper
      props: {"operationTimeoutMilliseconds":500,"timeToLiveSeconds":60,"maxRetries":3,"namespace":"governance_ds","server-lists":"172.18.26.198:2181,172.18.10.66:2181,172.18.18.102:2181","retryIntervalMilliseconds":500}
  overwrite: false
1 row in set (0.06 sec)
```

这就是我们在上一篇中描述的环境，使用集群运行模式，元数据持久化存储在Zookeeper中。props中配置Zookeeper属性：operationTimeoutMilliseconds指定客户端操作超时的毫秒数，timeToLiveSeconds指定临时数据失效的秒数，maxRetries指定客户端连接最大重试次数，namespace指定命名空间，即Zookeeper中的根节点名称，server-lists指定Zookeeper服务器列表，retryIntervalMilliseconds指定重试间隔毫秒数。overwrite指定是否使用本地配置覆盖持久化配置。

初始安装后，Proxy中有四个逻辑库：

```java
mysql> show databases;
+--------------------+
| schema_name        |
+--------------------+
| mysql              |
| information_schema |
| performance_schema |
| sys                |
+--------------------+
4 rows in set (0.00 sec)
```

跟使用MySQL一样，我们先要创建逻辑数据库，然后在逻辑数据库中创建表。

```java
-- 创建逻辑库
create database sharding_db;
```

### 1. 单表

现在Proxy还没有任何可用资源，也就是说真正执行SQL的数据库实例，此时建表会报错。

```java
mysql> use sharding_db;
Database changed
mysql> create table t_single(id bigint auto_increment primary key, name varchar(50));
ERROR 1102 (C1102): There are no resources in the schema sharding_db.
```

所以在使用Proxy建表前，先要添加资源。

```java
-- 添加资源
add resource 
resource_1 (host=172.18.10.66, port=3306, db=db1, user=wxy, password=mypass),
resource_2 (host=172.18.10.66, port=3306, db=db2, user=wxy, password=mypass),
resource_3 (host=172.18.18.102, port=3306, db=db1, user=wxy, password=mypass),
resource_4 (host=172.18.18.102, port=3306, db=db2, user=wxy, password=mypass);
```

上面这条语句添加四个资源，每个资源为一个MySQL数据源。添加资源前请确认已经创建了相关的数据库实例，并执行 use 命令成功选择了一个逻辑数据库。确认增加的资源是可以正常连接的，否则将不能添加成功。重复的数据源不允许被添加。

可以查看当前逻辑数据库中的资源。

```java
-- 查看资源
show schema resources\G
```

下面创建表：

```java
create table t_single(id bigint auto_increment primary key, name varchar(50));
```

此时我们还没有定义任何规则，对于没有对应规则的表，创建的是单表，即所有的分片数据源中仅唯一存在的表，可用show single tables语句确认。

```java
mysql> show single tables;
+------------+---------------+
| table_name | resource_name |
+------------+---------------+
| t_single   | resource_3    |
+------------+---------------+
1 row in set (0.01 sec)
```

我们的表创建在resource_3数据源中。此时还没有创建缺省单表规则。

```java
mysql> show single table rules;
Empty set (0.00 sec)
```

如果没有缺省单表规则，建表前并不能确定表被建在哪个数据源中，因此较好的方式是先创建单表规则再建表。

```java
-- 定义单表规则
create default single table rule resource = resource_1;
-- 创建单表
create table t_single2(id bigint auto_increment primary key, name varchar(50));
```

再次查看缺省单表规则和单表：

```java
mysql> -- 查看单表规则
mysql> show single table rules;
+---------+---------------+
| name    | resource_name |
+---------+---------------+
| default | resource_1    |
+---------+---------------+
1 row in set (0.00 sec)
mysql> -- 查看单表
mysql> show single tables;
+------------+---------------+
| table_name | resource_name |
+------------+---------------+
| t_single   | resource_3    |
| t_single2  | resource_1    |
+------------+---------------+
2 rows in set (0.00 sec)
```

向表中添加数据：

```java
insert into t_single2 (name) values ('a'),('b'),('c');
```

使用单表时和普通的MySQL表一样没有任何限制，因为不涉及到数据分片。

预览实际查询：

```java
mysql> preview select * from t_single2;
+------------------+-------------------------+
| data_source_name | actual_sql              |
+------------------+-------------------------+
| resource_1       | select * from t_single2 |
+------------------+-------------------------+
1 row in set (0.00 sec)
```

可以看到实际查询在resource_1上执行，并且引擎不需要改写查询语句。

查询数据：

```java
mysql> select * from t_single2;
+----+------+
| id | name |
+----+------+
|  1 | a    |
|  2 | b    |
|  3 | c    |
+----+------+
3 rows in set (0.02 sec)
```

### 2. 广播表

```java
-- 创建广播表规则，括号内参数为表名
create sharding broadcast table rules (t_broadcast);
-- 创建广播表
create table t_broadcast(id bigint auto_increment primary key, name varchar(50));
-- 添加数据
insert into t_broadcast (name) values ('a'),('b'),('c');
-- 查询数据
select * from t_broadcast;
```

t_broadcast表所有数据源中都存在，表结构及其数据在每个数据库中均完全一致。

查看广播表规则：

```java
mysql> show sharding broadcast table rules;
+---------------------------+
| sharding_broadcast_tables |
+---------------------------+
| t_broadcast               |
+---------------------------+
1 row in set (0.02 sec)
```

预览实际查询可以看到实际查询在其中一个数据源上（任一个，不固定）执行，并且引擎不需要改写查询语句。

```java
mysql> preview select * from t_broadcast;
+------------------+---------------------------+
| data_source_name | actual_sql                |
+------------------+---------------------------+
| resource_2       | select * from t_broadcast |
+------------------+---------------------------+
1 row in set (0.00 sec)
mysql> preview select * from t_broadcast;
+------------------+---------------------------+
| data_source_name | actual_sql                |
+------------------+---------------------------+
| resource_4       | select * from t_broadcast |
+------------------+---------------------------+
1 row in set (0.00 sec)
```

DML则在全部数据源上执行：

```java
mysql> preview insert into t_broadcast (name) values ('a'),('b'),('c');
+------------------+-----------------------------------------------------------+
| data_source_name | actual_sql                                                |
+------------------+-----------------------------------------------------------+
| resource_4       | insert into t_broadcast (name) values ('a'), ('b'), ('c') |
| resource_3       | insert into t_broadcast (name) values ('a'), ('b'), ('c') |
| resource_2       | insert into t_broadcast (name) values ('a'), ('b'), ('c') |
| resource_1       | insert into t_broadcast (name) values ('a'), ('b'), ('c') |
+------------------+-----------------------------------------------------------+
4 rows in set (0.01 sec)
```

### 3. 只分库

需求：对t_order表数据按照user_id字段的范围分片存储到四个资源中。假设user_id的范围是1-399，平均分配存储。

创建库分片规则：

```java
create sharding table rule t_order (
datanodes("resource_${1..4}.t_order"),
database_strategy(type=standard,sharding_column=user_id,sharding_algorithm(type(name=boundary_range,properties("sharding-ranges"="0, 100, 200, 300, 400")))));
```

查看规则：

```java
mysql> show sharding table rules t_order\G
*************************** 1. row ***************************
                            table: t_order
                actual_data_nodes: resource_${1..4}.t_order
              actual_data_sources: 
           database_strategy_type: boundary_range
         database_sharding_column: user_id
 database_sharding_algorithm_type: boundary_range
database_sharding_algorithm_props: sharding-ranges=0, 100, 200, 300, 400
              table_strategy_type: 
            table_sharding_column: 
    table_sharding_algorithm_type: 
   table_sharding_algorithm_props: 
              key_generate_column: 
               key_generator_type: 
              key_generator_props: 
1 row in set (0.00 sec)
```

创建表：

```java
drop table if exists t_order;
create table t_order (
    order_id bigint auto_increment primary key, 
    user_id bigint not null, 
    order_quantity int not null default 0, 
    order_amount decimal(10 , 2 ) not null default 0, 
    remark varchar(100),
    key idx_user_id (user_id));
```

此时从四个实际数据源中进行查看，可以确认其中都创建了名为t_order的相同结构的表。

插入数据：

```java
insert into t_order (user_id,order_quantity,order_amount) 
values (1,10,100),(99,10,100),(100,10,100),(199,10,100),(200,10,100),(299,10,100),(300,10,100),(399,10,100);
```

查看数据：

```java
mysql> select * from t_order;
+----------+---------+----------------+--------------+--------+
| order_id | user_id | order_quantity | order_amount | remark |
+----------+---------+----------------+--------------+--------+
|        1 |       1 |             10 |       100.00 | NULL   |
|        2 |      99 |             10 |       100.00 | NULL   |
|        1 |     100 |             10 |       100.00 | NULL   |
|        2 |     199 |             10 |       100.00 | NULL   |
|        1 |     200 |             10 |       100.00 | NULL   |
|        2 |     299 |             10 |       100.00 | NULL   |
|        1 |     300 |             10 |       100.00 | NULL   |
|        2 |     399 |             10 |       100.00 | NULL   |
+----------+---------+----------------+--------------+--------+
8 rows in set (0.04 sec)
```

可以看到，虽然order_id定义为主键，但因为使用的是MySQL的自增列，无法做到全局唯一。对于只分库的情况下，逻辑表的主键虽然有重复但不会报错，可以正常执行insert操作。

查看实际执行的SQL：

```java
mysql> preview insert into t_order (user_id,order_quantity,order_amount) values (1,10,100),(99,10,100),(100,10,100),(199,10,100),(200,10,100),(299,10,100),(300,10,100),(399,10,100);
+------------------+--------------------------------------------------------------------------------------------------+
| data_source_name | actual_sql                                                                                       |
+------------------+--------------------------------------------------------------------------------------------------+
| resource_1       | insert into t_order (user_id,order_quantity,order_amount) values (1, 10, 100), (99, 10, 100)    |
| resource_2       | insert into t_order (user_id,order_quantity,order_amount) values (100, 10, 100), (199, 10, 100) |
| resource_3       | insert into t_order (user_id,order_quantity,order_amount) values (200, 10, 100), (299, 10, 100) |
| resource_4       | insert into t_order (user_id,order_quantity,order_amount) values (300, 10, 100), (399, 10, 100) |
+------------------+--------------------------------------------------------------------------------------------------+
4 rows in set (0.01 sec)
```

可以看到，sharding-ranges属性中定义的字符串是一个左闭右开的区间，这符合range定义的惯例。本例中，user_id在0-99的数据存储到数据源resource_1，100-199的数据存储到数据源resource_2，200-299的数据存储到数据源resource_3，300-399的数据存储到数据源resource_4。

如果user_id超出分片规则定义的范围，插入数据时会因找不到路由信息而报错。

```java
mysql> insert into t_order (user_id,order_quantity,order_amount) values (400,10,100);
ERROR 1997 (C1997): Runtime exception: [No database route info]
mysql> preview insert into t_order (user_id,order_quantity,order_amount) values (400,10,100);
ERROR 1997 (C1997): Runtime exception: [No database route info]
```

查询数据时，如果查询条件中带有有效的user_id，则实际只查询对应的数据节点，达到了分片的目的。

```java
mysql> preview select * from t_order where user_id=1;
+------------------+---------------------------------------+
| data_source_name | actual_sql                            |
+------------------+---------------------------------------+
| resource_1       | select * from t_order where user_id=1 |
+------------------+---------------------------------------+
1 row in set (0.00 sec)
mysql> preview select * from t_order where user_id > 1;
+------------------+-----------------------------------------+
| data_source_name | actual_sql                              |
+------------------+-----------------------------------------+
| resource_1       | select * from t_order where user_id > 1 |
| resource_2       | select * from t_order where user_id > 1 |
| resource_3       | select * from t_order where user_id > 1 |
| resource_4       | select * from t_order where user_id > 1 |
+------------------+-----------------------------------------+
4 rows in set (0.02 sec)
mysql> preview select * from t_order where user_id >= 100;
+------------------+--------------------------------------------+
| data_source_name | actual_sql                                 |
+------------------+--------------------------------------------+
| resource_2       | select * from t_order where user_id >= 100 |
| resource_3       | select * from t_order where user_id >= 100 |
| resource_4       | select * from t_order where user_id >= 100 |
+------------------+--------------------------------------------+
3 rows in set (0.01 sec)
mysql> preview select * from t_order where user_id in (99,100);
+------------------+-------------------------------------------------+
| data_source_name | actual_sql                                      |
+------------------+-------------------------------------------------+
| resource_1       | select * from t_order where user_id in (99,100) |
| resource_2       | select * from t_order where user_id in (99,100) |
+------------------+-------------------------------------------------+
2 rows in set (0.02 sec)
```

如果查询条件中混含符合规则和规则定义外的user_id，则返回有效数据而不报错。

```java
mysql> preview select * from t_order where user_id in (99,100,400);
+------------------+-----------------------------------------------------+
| data_source_name | actual_sql                                          |
+------------------+-----------------------------------------------------+
| resource_1       | select * from t_order where user_id in (99,100,400) |
| resource_2       | select * from t_order where user_id in (99,100,400) |
+------------------+-----------------------------------------------------+
2 rows in set (0.00 sec)
```

如果查询条件中只含规则定义外的user_id，则返回路由错误。

```java
mysql> select * from t_order where user_id in (400);
ERROR 1997 (C1997): Runtime exception: [No database route info]
mysql> select * from t_order where user_id = 400;
ERROR 1997 (C1997): Runtime exception: [No database route info]
```

### 4. 只分表

需求：对t_order表数据按照order_id字段哈希取模16，存储到resource_1中。

创建表分片规则：

```java
-- 删除规则前先删除表，否则需要连接每个资源中定义的实际物理数据库手工删除真实表。
drop table if exists t_order;
-- 删除规则
drop sharding table rule if exists t_order;
-- 创建规则
create sharding table rule t_order (
datanodes("resource_1.t_order_${0..15}"),
table_strategy(type=standard,sharding_column=order_id,sharding_algorithm(type(name=hash_mod,properties("sharding-count"=16)))));
```

查看规则：

```java
mysql> show sharding table rules t_order\G
*************************** 1. row ***************************
                            table: t_order
                actual_data_nodes: resource_1.t_order_${0..15}
              actual_data_sources: 
           database_strategy_type: 
         database_sharding_column: 
 database_sharding_algorithm_type: 
database_sharding_algorithm_props: 
              table_strategy_type: hash_mod
            table_sharding_column: order_id
    table_sharding_algorithm_type: hash_mod
   table_sharding_algorithm_props: sharding-count=16
              key_generate_column: 
               key_generator_type: 
              key_generator_props: 
1 row in set (0.01 sec)
```

创建表：

```java
create table t_order (
    order_id bigint auto_increment primary key, 
    user_id bigint not null, 
    order_quantity int not null default 0, 
    order_amount decimal(10 , 2 ) not null default 0, 
    remark varchar(100),
    key idx_user_id (user_id));
```

此时可以确认实际只在数据源resource_1中都创建了t_order的16个分表。

```java
$mysql -uwxy -h172.18.10.66 -pmypass -Ddb1 -e "show tables like '%order%';"
mysql: [Warning] Using a password on the command line interface can be insecure.
+-------------------------+
| Tables_in_db1 (%order%) |
+-------------------------+
| t_order_0               |
| t_order_1               |
| t_order_10              |
| t_order_11              |
| t_order_12              |
| t_order_13              |
| t_order_14              |
| t_order_15              |
| t_order_2               |
| t_order_3               |
| t_order_4               |
| t_order_5               |
| t_order_6               |
| t_order_7               |
| t_order_8               |
| t_order_9               |
+-------------------------+
```

插入数据：

```java
mysql> insert into t_order (user_id,order_quantity,order_amount) values (1,10,100);
ERROR 1997 (C1997): Runtime exception: [Insert statement does not support sharding table routing to multiple data nodes.]
mysql> preview insert into t_order (user_id,order_quantity,order_amount) values (1,10,100);
ERROR 1997 (C1997): Runtime exception: [Insert statement does not support sharding table routing to multiple data nodes.]
```

这次的insert语句报错了。我们没有指定显式自增主键order_id字段及其值，而自增主键的值要到具体表执行insert时才可知。在此之前ShardingSphere无法确定分片键order_id的值，也就不知道该去哪个真实表执行insert，因此报错。

有两种方法可以解决这个问题，一是在insert语句中显式指定order_id的值，让ShardingSphere通过给定的分片键值确定路由。

```java
insert into t_order (order_id, user_id,order_quantity,order_amount) 
values 
(1, 1, 10,100),(2, 1, 10,100),(3, 1, 10,100),(4, 1, 10,100),
(5, 1, 10,100),(6, 1, 10,100),(7, 1, 10,100),(8, 1, 10,100),
(9, 1, 10,100),(10, 1, 10,100),(11, 1, 10,100),(12, 1, 10,100),
(13, 1, 10,100),(14, 1, 10,100),(15, 1, 10,100),(16, 1, 10,100);
```

这种方法的主要缺点是需要修改SQL语句，当然这样做也就失去了自增的意义。第二种方法是使用ShardingSphere提供的分布式自增主键的生成策略，并且可以通过补列，让使用方无需改动现有代码，即可将分布式自增主键透明的替换数据库现有的自增主键。

修改规则，增加全局主键生成策略为snowflake：

```java
alter sharding table rule t_order (
datanodes("resource_1.t_order_${0..15}"),
table_strategy(type=standard,sharding_column=order_id,sharding_algorithm(type(name=hash_mod,properties("sharding-count"=16)))),
key_generate_strategy(column=order_id,type(name=snowflake)));
```

插入数据时可以忽略主键order_id：

```java
insert into t_order (user_id,order_quantity,order_amount) values (100,10,100),(101,10,100),(101,10,100);
```

查询数据：

```java
mysql> select * from t_order;
+--------------------+---------+----------------+--------------+--------+
| order_id           | user_id | order_quantity | order_amount | remark |
+--------------------+---------+----------------+--------------+--------+
|                 16 |       1 |             10 |       100.00 | NULL   |
| 738722623403331584 |     100 |             10 |       100.00 | NULL   |
|                  1 |       1 |             10 |       100.00 | NULL   |
| 738722623457857537 |     101 |             10 |       100.00 | NULL   |
|                  2 |       1 |             10 |       100.00 | NULL   |
| 738722623457857538 |     101 |             10 |       100.00 | NULL   |
|                  3 |       1 |             10 |       100.00 | NULL   |
|                  4 |       1 |             10 |       100.00 | NULL   |
|                  5 |       1 |             10 |       100.00 | NULL   |
|                  6 |       1 |             10 |       100.00 | NULL   |
|                  7 |       1 |             10 |       100.00 | NULL   |
|                  8 |       1 |             10 |       100.00 | NULL   |
|                  9 |       1 |             10 |       100.00 | NULL   |
|                 10 |       1 |             10 |       100.00 | NULL   |
|                 11 |       1 |             10 |       100.00 | NULL   |
|                 12 |       1 |             10 |       100.00 | NULL   |
|                 13 |       1 |             10 |       100.00 | NULL   |
|                 14 |       1 |             10 |       100.00 | NULL   |
|                 15 |       1 |             10 |       100.00 | NULL   |
+--------------------+---------+----------------+--------------+--------+
19 rows in set (0.02 sec)
```

通过分布式自增主键的生成策略，可以做到无需修改既有SQL语句，方便将单实例数据全量迁移到ShardingSphere环境。大体步骤为：

**1、** 通过MySQL主从复制迁移存量数据；

**2、** 正库只读，自动迁移存量数据；

**3、** 确认主从数据一致；

**4、** 创建snowflake分布式主键生成策略；

**5、** 应用程序连接至ShardingSphere；

本专栏后面“数据迁移”一篇中将演示如何使用ShardingSphere-Scaling，联机从现有的单实例MySQL无缝全量迁移到ShardingSphere。

### 5. 分库分表

Sharding Table Rule 同时支持 Auto Table 和 Table 两种类型，两者在语法上有所差异。前面例子创建、修改分片表规则时用的都是 Table 类型。

#### （1）自动取模分片

需求：对t_order表数据按照order_id字段哈希取模16，自动分布到四个资源中。

创建表分片规则：

```java
-- 删除规则前先删除表，否则需要连接每个资源中定义的实际物理数据库手工删除真实表。
drop table if exists t_order;
-- 删除规则
drop sharding table rule if exists t_order;
-- 创建规则，指定只需指定资源和分片策略，对于hash_mod算法只需要指定分片数即可
create sharding table rule t_order (
resources(resource_1,resource_2,resource_3,resource_4),
sharding_column=order_id,type(name=hash_mod,properties("sharding-count"=16)),
key_generate_strategy(column=order_id,type(name=snowflake)));
```

查看规则：

```java
mysql> show sharding table rules t_order\G
*************************** 1. row ***************************
                            table: t_order
                actual_data_nodes: 
              actual_data_sources: resource_1,resource_2,resource_3,resource_4
           database_strategy_type: 
         database_sharding_column: 
 database_sharding_algorithm_type: 
database_sharding_algorithm_props: 
              table_strategy_type: hash_mod
            table_sharding_column: order_id
    table_sharding_algorithm_type: hash_mod
   table_sharding_algorithm_props: sharding-count=16
              key_generate_column: order_id
               key_generator_type: snowflake
              key_generator_props: 
1 row in set (0.00 sec)
```

创建表：

```java
create table t_order (
    order_id bigint auto_increment primary key, 
    user_id bigint not null, 
    order_quantity int not null default 0, 
    order_amount decimal(10 , 2 ) not null default 0, 
    remark varchar(100),
    key idx_user_id (user_id));
```

此时可以确认在所有资源中共创建了16个分表，以16的模数为表名后缀。分配规则是以后缀0-15再对资源数量4取模，结果为0-3的表分别分配到资源1-4。最终每个资源中创建了4个分表。

```java
$mysql -uwxy -h172.18.10.66 -pmypass -Ddb1 -e "show tables like '%order%';"
mysql: [Warning] Using a password on the command line interface can be insecure.
+-------------------------+
| Tables_in_db1 (%order%) |
+-------------------------+
| t_order_0               |
| t_order_12              |
| t_order_4               |
| t_order_8               |
+-------------------------+
$mysql -uwxy -h172.18.10.66 -pmypass -Ddb2 -e "show tables like '%order%';"
mysql: [Warning] Using a password on the command line interface can be insecure.
+-------------------------+
| Tables_in_db2 (%order%) |
+-------------------------+
| t_order_1               |
| t_order_13              |
| t_order_5               |
| t_order_9               |
+-------------------------+
$mysql -uwxy -h172.18.18.102 -pmypass -Ddb1 -e "show tables like '%order%';" 
mysql: [Warning] Using a password on the command line interface can be insecure.
+-------------------------+
| Tables_in_db1 (%order%) |
+-------------------------+
| t_order_10              |
| t_order_14              |
| t_order_2               |
| t_order_6               |
+-------------------------+
$mysql -uwxy -h172.18.18.102 -pmypass -Ddb2 -e "show tables like '%order%';" 
mysql: [Warning] Using a password on the command line interface can be insecure.
+-------------------------+
| Tables_in_db2 (%order%) |
+-------------------------+
| t_order_11              |
| t_order_15              |
| t_order_3               |
| t_order_7               |
+-------------------------+
```

插入数据：

```java
insert into t_order (user_id,order_quantity,order_amount) 
values 
(1, 10,100),(1, 10,100),(1, 10,100),(1, 10,100),
(1, 10,100),(1, 10,100),(1, 10,100),(1, 10,100),
(1, 10,100),(1, 10,100),(1, 10,100),(1, 10,100),
(1, 10,100),(1, 10,100),(1, 10,100),(1, 10,100);
```

查询数据：

```java
mysql> select * from t_order;
+--------------------+---------+----------------+--------------+--------+
| order_id           | user_id | order_quantity | order_amount | remark |
+--------------------+---------+----------------+--------------+--------+
| 738737663300866061 |       1 |             10 |       100.00 | NULL   |
| 738737663300866049 |       1 |             10 |       100.00 | NULL   |
| 738737663300866053 |       1 |             10 |       100.00 | NULL   |
| 738737663300866057 |       1 |             10 |       100.00 | NULL   |
| 738737663300866050 |       1 |             10 |       100.00 | NULL   |
| 738737663300866054 |       1 |             10 |       100.00 | NULL   |
| 738737663300866058 |       1 |             10 |       100.00 | NULL   |
| 738737663300866062 |       1 |             10 |       100.00 | NULL   |
| 738737663300866051 |       1 |             10 |       100.00 | NULL   |
| 738737663300866055 |       1 |             10 |       100.00 | NULL   |
| 738737663300866059 |       1 |             10 |       100.00 | NULL   |
| 738737663300866063 |       1 |             10 |       100.00 | NULL   |
| 738737663300866048 |       1 |             10 |       100.00 | NULL   |
| 738737663300866052 |       1 |             10 |       100.00 | NULL   |
| 738737663300866056 |       1 |             10 |       100.00 | NULL   |
| 738737663300866060 |       1 |             10 |       100.00 | NULL   |
+--------------------+---------+----------------+--------------+--------+
16 rows in set (0.03 sec)
```

预览实际执行的SQL：

```java
mysql> preview select * from t_order;
+------------------+---------------------------------------------------------------------------------------------------------------------------------+
| data_source_name | actual_sql                                                                                                                      |
+------------------+---------------------------------------------------------------------------------------------------------------------------------+
| resource_1       | select * from t_order_0 UNION ALL select * from t_order_4 UNION ALL select * from t_order_8 UNION ALL select * from t_order_12  |
| resource_2       | select * from t_order_1 UNION ALL select * from t_order_5 UNION ALL select * from t_order_9 UNION ALL select * from t_order_13  |
| resource_3       | select * from t_order_2 UNION ALL select * from t_order_6 UNION ALL select * from t_order_10 UNION ALL select * from t_order_14 |
| resource_4       | select * from t_order_3 UNION ALL select * from t_order_7 UNION ALL select * from t_order_11 UNION ALL select * from t_order_15 |
+------------------+---------------------------------------------------------------------------------------------------------------------------------+
4 rows in set (0.01 sec)
```

查询条件中指定分片键值，只到对应分片中执行实际查询，达到了分片效果。

```java
mysql> preview select * from t_order where order_id=738737663300866048;
+------------------+-----------------------------------------------------------+
| data_source_name | actual_sql                                                |
+------------------+-----------------------------------------------------------+
| resource_4       | select * from t_order_3 where order_id=738737663300866048 |
+------------------+-----------------------------------------------------------+
1 row in set (0.00 sec)
```

#### （2）自动时间范围分片

创建分片：

```java
create sharding table rule t_order_dt (
resources(resource_1,resource_2,resource_3,resource_4),
sharding_column=order_datetime,type(name=auto_interval,properties("datetime-lower"= "2022-01-01 00:00:00","datetime-upper"= "2023-01-01 00:00:00","sharding-seconds"=2592000)));
```

datetime-lower和datetime-upper定义所有分片键数据的上下限，sharding-seconds定义一个分片存储的最大秒数。由此三个属性可以计算出分片数。

创建表：

```java
create table t_order_dt
(
    order_id bigint auto_increment primary key,
    order_datetime datetime not null,
    user_id bigint not null, 
    order_quantity int not null default 0, 
    order_amount decimal(10 , 2 ) not null default 0, 
    key idx_dt (order_datetime)
);
```

查看分表：

```java
[mysql@vvgg-z2-music-mysqld~]$mysql -uwxy -h172.18.10.66 -pmypass -Ddb1 -e "show tables like '%dt%';"
mysql: [Warning] Using a password on the command line interface can be insecure.
+----------------------+
| Tables_in_db1 (%dt%) |
+----------------------+
| t_order_dt_0         |
| t_order_dt_12        |
| t_order_dt_4         |
| t_order_dt_8         |
+----------------------+
[mysql@vvgg-z2-music-mysqld~]$mysql -uwxy -h172.18.10.66 -pmypass -Ddb2 -e "show tables like '%dt%';"
mysql: [Warning] Using a password on the command line interface can be insecure.
+----------------------+
| Tables_in_db2 (%dt%) |
+----------------------+
| t_order_dt_1         |
| t_order_dt_13        |
| t_order_dt_5         |
| t_order_dt_9         |
+----------------------+
[mysql@vvgg-z2-music-mysqld~]$mysql -uwxy -h172.18.18.102 -pmypass -Ddb1 -e "show tables like '%dt%';"
mysql: [Warning] Using a password on the command line interface can be insecure.
+----------------------+
| Tables_in_db1 (%dt%) |
+----------------------+
| t_order_dt_10        |
| t_order_dt_2         |
| t_order_dt_6         |
+----------------------+
[mysql@vvgg-z2-music-mysqld~]$mysql -uwxy -h172.18.18.102 -pmypass -Ddb2 -e "show tables like '%dt%';"
mysql: [Warning] Using a password on the command line interface can be insecure.
+----------------------+
| Tables_in_db2 (%dt%) |
+----------------------+
| t_order_dt_11        |
| t_order_dt_3         |
| t_order_dt_7         |
+----------------------+
```

插入数据：

```java
insert into t_order_dt 
values 
(1,'2022-01-01 01:01:01',1,10,100),(2,'2022-02-01 01:01:01',1,10,100),(3,'2022-03-01 01:01:01',1,10,100),
(4,'2022-04-01 01:01:01',1,10,100),(5,'2022-05-01 01:01:01',1,10,100),(6,'2022-06-01 01:01:01',1,10,100),
(8,'2022-07-01 01:01:01',1,10,100),(8,'2022-08-01 01:01:01',1,10,100),(9,'2022-09-01 01:01:01',1,10,100),
(10,'2022-10-01 01:01:01',1,10,100),(11,'2022-11-01 01:01:01',1,10,100),(12,'2022-12-01 01:01:01',1,10,100),
(13,'2021-12-01 01:01:01',1,10,100),(14,'2023-01-01 01:01:01',1,10,100);
```

查看实际执行的SQL：

```java
mysql> preview 
    -> insert into t_order_dt 
    -> values 
    -> (1,'2022-01-01 01:01:01',1,10,100),(2,'2022-02-01 01:01:01',1,10,100),(3,'2022-03-01 01:01:01',1,10,100),
    -> (4,'2022-04-01 01:01:01',1,10,100),(5,'2022-05-01 01:01:01',1,10,100),(6,'2022-06-01 01:01:01',1,10,100),
    -> (8,'2022-07-01 01:01:01',1,10,100),(8,'2022-08-01 01:01:01',1,10,100),(9,'2022-09-01 01:01:01',1,10,100),
    -> (10,'2022-10-01 01:01:01',1,10,100),(11,'2022-11-01 01:01:01',1,10,100),(12,'2022-12-01 01:01:01',1,10,100),
    -> (13,'2021-12-01 01:01:01',1,10,100),(14,'2023-01-01 01:01:01',1,10,100);
+------------------+-----------------------------------------------------------------------------------------------------------------+
| data_source_name | actual_sql                                                                                                      |
+------------------+-----------------------------------------------------------------------------------------------------------------+
| resource_1       | insert into t_order_dt_0 values (1, '2022-01-01 01:01:01', 1, 10, 100), (13, '2021-12-01 01:01:01', 1, 10, 100) |
| resource_1       | insert into t_order_dt_4 values (5, '2022-05-01 01:01:01', 1, 10, 100)                                          |
| resource_1       | insert into t_order_dt_8 values (8, '2022-08-01 01:01:01', 1, 10, 100)                                          |
| resource_1       | insert into t_order_dt_12 values (12, '2022-12-01 01:01:01', 1, 10, 100)                                        |
| resource_3       | insert into t_order_dt_2 values (2, '2022-02-01 01:01:01', 1, 10, 100), (3, '2022-03-01 01:01:01', 1, 10, 100)  |
| resource_3       | insert into t_order_dt_6 values (6, '2022-06-01 01:01:01', 1, 10, 100)                                          |
| resource_3       | insert into t_order_dt_10 values (10, '2022-10-01 01:01:01', 1, 10, 100)                                        |
| resource_4       | insert into t_order_dt_3 values (4, '2022-04-01 01:01:01', 1, 10, 100)                                          |
| resource_4       | insert into t_order_dt_7 values (8, '2022-07-01 01:01:01', 1, 10, 100)                                          |
| resource_4       | insert into t_order_dt_11 values (11, '2022-11-01 01:01:01', 1, 10, 100)                                        |
| resource_2       | insert into t_order_dt_9 values (9, '2022-09-01 01:01:01', 1, 10, 100)                                          |
| resource_2       | insert into t_order_dt_13 values (14, '2023-01-01 01:01:01', 1, 10, 100)                                        |
+------------------+-----------------------------------------------------------------------------------------------------------------+
12 rows in set (0.02 sec)
```

可以看到，小于datetime-lower的数据（2021-12-01 01:01:01）存在第一个分片里（t_order_dt_0），而大于datetime-upper的数据（2023-01-01 01:01:01）存在一个单独的分片里（t_order_dt_13），这也就是为什么本例划分了14个分片而不是13个（timestampdiff(SECOND,'2022-01-01','2023-01-01')/2592000 = 12.1667）的原因，也许是借鉴了分区表中maxvalue的思想吧。二月不足30天，所以还存储了（2022-03-01 01:01:01）一行数据。

#### （3）自定义分片

本专栏第一篇介绍“[水平分库分表策略](https://blog.csdn.net/wzy0623/article/details/124948877#t7)”时讲到，range + hash_mod 混合分片策略，可以在一定程度上解决热点数据和扩容数据迁移问题。本小节就演示这种分片策略的实现。

需求：对t_order表数据按照user_id字段的范围分片存储到四个资源中。假设user_id的范围是1-399，平均分配存储。在每个资源的物理数据库中，对t_order表数据按照order_id字段哈希取模16分表。一共将创建64个t_order分表。

创建表分片规则：

```java
-- 删除规则前先删除表，否则需要连接每个资源中定义的实际物理数据库手工删除真实表。
drop table if exists t_order;
-- 删除规则
drop sharding table rule if exists t_order;
-- 创建规则，按范围分库，库中按取模分表
create sharding table rule t_order (
datanodes("resource_${1..4}.t_order_${0..15}"),
database_strategy(type=standard,sharding_column=user_id,sharding_algorithm(type(name=boundary_range,properties("sharding-ranges"="0, 100, 200, 300, 400")))),
table_strategy(type=standard,sharding_column=order_id,sharding_algorithm(type(name=hash_mod,properties("sharding-count"=16)))),
key_generate_strategy(column=order_id,type(name=snowflake)));
```

查看规则：

```java
mysql> show sharding table rules t_order\G
*************************** 1. row ***************************
                            table: t_order
                actual_data_nodes: resource_${1..4}.t_order_${0..15}
              actual_data_sources: 
           database_strategy_type: boundary_range
         database_sharding_column: user_id
 database_sharding_algorithm_type: boundary_range
database_sharding_algorithm_props: sharding-ranges=0, 100, 200, 300, 400
              table_strategy_type: hash_mod
            table_sharding_column: order_id
    table_sharding_algorithm_type: hash_mod
   table_sharding_algorithm_props: sharding-count=16
              key_generate_column: order_id
               key_generator_type: snowflake
              key_generator_props: 
1 row in set (0.00 sec)
```

创建表：

```java
create table t_order (
    order_id bigint auto_increment primary key, 
    user_id bigint not null, 
    order_quantity int not null default 0, 
    order_amount decimal(10 , 2 ) not null default 0, 
    remark varchar(100),
    key idx_user_id (user_id));
```

插入数据：

```java
insert into t_order (user_id,order_quantity,order_amount) 
values 
(1, 10,100),(1, 10,100),(1, 10,100),(1, 10,100),(1, 10,100),(1, 10,100),(1, 10,100),(1, 10,100),
(99, 10,100),(99, 10,100),(99, 10,100),(99, 10,100),(99, 10,100),(99, 10,100),(99, 10,100),(99, 10,100),
(100, 10,100),(100, 10,100),(100, 10,100),(100, 10,100),(100, 10,100),(100, 10,100),(100, 10,100),(100, 10,100),
(199, 10,100),(199, 10,100),(199, 10,100),(199, 10,100),(199, 10,100),(199, 10,100),(199, 10,100),(199, 10,100),
(200, 10,100),(200, 10,100),(200, 10,100),(200, 10,100),(200, 10,100),(200, 10,100),(200, 10,100),(200, 10,100),
(299, 10,100),(299, 10,100),(299, 10,100),(299, 10,100),(299, 10,100),(299, 10,100),(299, 10,100),(299, 10,100),
(300, 10,100),(300, 10,100),(300, 10,100),(300, 10,100),(300, 10,100),(300, 10,100),(300, 10,100),(300, 10,100),
(399, 10,100),(399, 10,100),(399, 10,100),(399, 10,100),(399, 10,100),(399, 10,100),(399, 10,100),(399, 10,100);
```

查询数据时，对于给定user_id值只查询一个物理库，对于给定order_id条件只查询对应的分表。

```java
mysql> preview select * from t_order where user_id = 1 and order_id = 738766909939388418;
+------------------+-----------------------------------------------------------------------------+
| data_source_name | actual_sql                                                                  |
+------------------+-----------------------------------------------------------------------------+
| resource_1       | select * from t_order_5 where user_id = 1 and order_id = 738766909939388418 |
+------------------+-----------------------------------------------------------------------------+
1 row in set (0.00 sec)
```

### 6. 绑定表

创建表分片规则：

```java
-- 删除规则前先删除表，否则需要连接每个资源中定义的实际物理数据库手工删除真实表。
drop table if exists t_order;
-- 删除规则
drop sharding table rule if exists t_order;
-- 创建规则，指定只需指定资源和分片策略，对于hash_mod算法只需要指定分片数即可
create sharding table rule t_order (
resources(resource_1,resource_2,resource_3,resource_4),
sharding_column=order_id,type(name=hash_mod,properties("sharding-count"=16)),
key_generate_strategy(column=order_id,type(name=snowflake)));
```

新建一个分片规则：

```java
create sharding table rule t_order_item (
resources(resource_1,resource_2,resource_3,resource_4),
sharding_column=order_id,type(name=hash_mod,properties("sharding-count"=16)),
key_generate_strategy(column=order_item_id,type(name=snowflake)));
```

创建表：

```java
create table t_order (
    order_id bigint auto_increment primary key, 
    user_id bigint not null, 
    order_quantity int not null default 0, 
    order_amount decimal(10 , 2 ) not null default 0, 
    remark varchar(100),
    key idx_user_id (user_id));
create table t_order_item (
    order_item_id bigint auto_increment primary key, 
    order_id bigint not null, 
    product_id int null, 
    remark varchar(100),
    key idx_user_id (order_id));
```

在不配置绑定表关系时关联查询，路由后的SQL为8条：

```java
mysql> preview select i.* from t_order o join t_order_item i on o.order_id=i.order_id   where o.order_id in (10, 11);
+------------------+-------------------------------------------------------------------------------------------------------------+
| data_source_name | actual_sql                                                                                                  |
+------------------+-------------------------------------------------------------------------------------------------------------+
| resource_4       | select i.* from t_order_11 o join t_order_item_3 i on o.order_id=i.order_id   where o.order_id in (10, 11)  |
| resource_4       | select i.* from t_order_11 o join t_order_item_7 i on o.order_id=i.order_id   where o.order_id in (10, 11)  |
| resource_4       | select i.* from t_order_11 o join t_order_item_11 i on o.order_id=i.order_id   where o.order_id in (10, 11) |
| resource_4       | select i.* from t_order_11 o join t_order_item_15 i on o.order_id=i.order_id   where o.order_id in (10, 11) |
| resource_3       | select i.* from t_order_10 o join t_order_item_2 i on o.order_id=i.order_id   where o.order_id in (10, 11)  |
| resource_3       | select i.* from t_order_10 o join t_order_item_6 i on o.order_id=i.order_id   where o.order_id in (10, 11)  |
| resource_3       | select i.* from t_order_10 o join t_order_item_10 i on o.order_id=i.order_id   where o.order_id in (10, 11) |
| resource_3       | select i.* from t_order_10 o join t_order_item_14 i on o.order_id=i.order_id   where o.order_id in (10, 11) |
+------------------+-------------------------------------------------------------------------------------------------------------+
8 rows in set (0.00 sec)
```

创建绑定关系：

```java
create sharding binding table rules (t_order,t_order_item);
```

之后同样的关联查询，路由后的SQL为2条：

```java
mysql> preview select i.* from t_order o join t_order_item i on o.order_id=i.order_id   where o.order_id in (10, 11);
+------------------+-------------------------------------------------------------------------------------------------------------+
| data_source_name | actual_sql                                                                                                  |
+------------------+-------------------------------------------------------------------------------------------------------------+
| resource_3       | select i.* from t_order_10 o join t_order_item_10 i on o.order_id=i.order_id   where o.order_id in (10, 11) |
| resource_4       | select i.* from t_order_11 o join t_order_item_11 i on o.order_id=i.order_id   where o.order_id in (10, 11) |
+------------------+-------------------------------------------------------------------------------------------------------------+
2 rows in set (0.01 sec)
```

可见具有相同分片规则的表在进行的按分片键的关联查询时，定义绑定表规则后，由于路由更精确，实际需要执行查询的数据节点更少，查询性能将大幅提升。

数据分片的定义与业务规则密切相关，表结构、主键和索引定义、关联查询的字段、数据范围等都会影响分片规则的制定。要想通过数据分片实现性能提升，需要仔细斟酌定义最适当的分片规则，路由到的分片越少，实际执行的SQL越少，数据读写性能越高。
