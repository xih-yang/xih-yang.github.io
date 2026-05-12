# 08、Sharding-Sphere 实战：影子库
- 来源：https://ddkk.com/zhuanlan/sharding/shardingsphere/2/8.html
- 分类：分库分表
- 分组：教程目录
## 一、功能详解

### 1. 背景

在基于微服务的分布式应用架构下，业务需要的多个服务是通过一系列的服务、中间件的调用来完成，所以单个服务的压力测试已无法代表真实场景。在测试环境中，如果重新搭建一整套与生产环境类似的压测环境，成本过高，并且往往无法模拟线上环境的复杂度以及流量。因此，业内通常选择全链路压测的方式，即在生产环境进行压测，这样所获得的测试结果能够准确地反应系统真实容量和性能水平。

全链路压测是一项复杂而庞大的工作，需要各个微服务、中间件之间配合与调整，以应对不同流量以及压测标识的透传。通常会搭建一整套压测平台以适用不同测试计划。在数据库层面需要做好数据隔离，为了保证生产数据的可靠性与完整性，需要将压测产生的数据路由到压测环境数据库，防止压测数据对生产数据库中真实数据造成污染。这就要求业务应用在执行 SQL 前，能够根据透传的压测标识，做好数据分类，将相应的 SQL 路由到与之对应的数据源。

ShardingSphere 关注于全链路压测场景下，数据库层面的解决方案。将压测数据自动路由至用户指定的数据库，是 ShardingSphere 影子库模块的主要设计目标。

### 2. 核心概念

- 生产库：生产环境使用的数据库。
- 影子库：压测数据隔离的影子数据库，与生产数据库应当使用相同的配置。
- 影子算法：影子算法和业务实现紧密相关，目前提供两种类型影子算法。基于列的影子算法通过识别 SQL 中的数据，匹配路由至影子库的场景，适用于由压测数据名单驱动的压测场景。基于 Hint 的影子算法通过识别 SQL 中的注释，匹配路由至影子库，适用于由上游系统透传标识驱动的压测场景。

### 3. 使用规范

#### （1）支持项

- 基于 Hint 的影子算法支持全部 SQL。
- 基于列的影子算法仅支持部分 SQL。

#### （2）不支持项

基于列的影子算法不支持 DDL，不支持范围、分组和子查询，如：BETWEEN、GROUP BY … HAVING 等。下面是 SQL 支持列表。

- INSERT

**SQL**

**是否支持**

INSERT INTO table (column,…) VALUES (value,…)

支持

INSERT INTO table (column,…) VALUES (value,…),(value,…),…

支持

INSERT INTO table (column,…) SELECT column1 from table1 where column1 = value1

不支持

- SELECT/UPDATE/DELETE

**条件类型**

**SQL**

**是否支持**

=

SELECT/UPDATE/DELETE … WHERE column = value

支持

LIKE/NOT LIKE

SELECT/UPDATE/DELETE … WHERE column LIKE/NOT LIKE value

支持

IN/NOT IN

SELECT/UPDATE/DELETE … WHERE column IN/NOT IN (value1,value2,…)

支持

BETWEEN

SELECT/UPDATE/DELETE … WHERE column BETWEEN value1 AND value2

不支持

GROUP BY … HAVING…

SELECT/UPDATE/DELETE … WHERE … GROUP BY column HAVING column > value

不支持

子查询

SELECT/UPDATE/DELETE … WHERE column = (SELECT column FROM table WHERE column = value)

不支持

## 二、实现细节

### 1. 整体架构

ShardingSphere 通过解析 SQL，对传入的 SQL 进行影子判定，根据配置文件中用户设置的影子规则，路由到生产库或者影子库，如下图所示。

### 2. 影子规则

影子规则包含影子数据源映射关系，影子表以及影子算法，如下图所示。

- 影子库映射：生产数据源名称和影子数据源名称映射关系。
- 影子表：压测相关的影子表。影子表必须存在于指定的影子库中，并且需要指定影子算法。
- 影子算法：SQL 路由影子算法。
- 默认影子算法：默认影子算法。选配项，对于没有配置影子算法表的默认匹配算法。

### 3. 路由过程

以INSERT 语句为例，在写入数据时，ShardingSphere 会对 SQL 进行解析，再根据配置文件中的规则，构造一条路由链。在当前版本的功能中，影子功能处于路由链中的最后一个执行单元，即，如果有其他需要路由的规则存在，如分片，ShardingSphere 会首先根据分片规则，路由到某一个数据库，再执行影子路由判定流程。判定执行 SQL 满足影子规则的配置，数据路由到与之对应的影子库，生产数据则维持不变。

### 4. 影子判定流程

影子库功能对执行的 SQL 语句进行影子判定。影子判定支持两种类型算法，用户可根据实际业务需求选择一种或者组合使用。

#### （1）DML 语句

支持两种算法。影子判定会首先判断执行 SQL 相关表与配置的影子表是否有交集。如果有交集，依次判定交集部分影子表关联的影子算法，有任何一个判定成功，SQL 语句路由到影子库。影子表没有交集或者影子算法判定不成功，SQL 语句路由到生产库。

#### （2）DDL 语句

仅支持注解影子算法。在压测场景下，DDL 语句一般不需要测试。主要在初始化或者修改影子库中影子表时使用。影子判定会首先判断执行 SQL 是否包含注解。如果包含注解，影子规则中配置的 HINT 影子算法依次判定。有任何一个判定成功，SQL 语句路由到影子库。 执行 SQL 不包含注解或者 HINT 影子算法判定不成功，SQL 语句路由到生产库。

### 5. 影子算法

#### （1）列影子算法

- 列值匹配影子算法

类型：VALUE_MATCH

可配置属性：

**属性名称**

**数据类型**

**说明**

column

String

影子列

operation

String

SQL 操作类型（INSERT, UPDATE, DELETE, SELECT）

value

String

影子列匹配的值

- 列正则表达式匹配影子算法

类型：REGEX_MATCH

可配置属性：

**属性名称**

**数据类型**

**说明**

column

String

影子列

operation

String

SQL 操作类型（INSERT, UPDATE, DELETE, SELECT）

regex

String

影子列匹配正则表达式

#### （2）Hint 影子算法

- 简单 Hint 匹配影子算法

类型：SIMPLE_HINT

可配置属性：至少配置一组任意的键值对，比如 foo:bar。

**属性名称**

**数据类型**

**说明**

foo

String

bar

### 6. 使用案例

#### （1）场景需求

假设一个电商网站要对下单业务进行压测。压测相关表 t_order 为影子表，生产数据执行到 ds 生产数据库，压测数据执行到数据库 ds_shadow 影子库。

#### （2）影子库配置

建议config-shadow.yaml 配置如下：

```java
databaseName: shadow_db
dataSources:
  ds:
    url: jdbc:mysql://127.0.0.1:3306/ds?serverTimezone=UTC&useSSL=false
    username: root
    password:
    connectionTimeoutMilliseconds: 30000
    idleTimeoutMilliseconds: 60000
    maxLifetimeMilliseconds: 1800000
    maxPoolSize: 50
    minPoolSize: 1
  shadow_ds:
    url: jdbc:mysql://127.0.0.1:3306/shadow_ds?serverTimezone=UTC&useSSL=false
    username: root
    password:
    connectionTimeoutMilliseconds: 30000
    idleTimeoutMilliseconds: 60000
    maxLifetimeMilliseconds: 1800000
    maxPoolSize: 50
    minPoolSize: 1
rules:
- !SHADOW
  dataSources:
    shadowDataSource:
      sourceDataSourceName: ds
      shadowDataSourceName: shadow_ds
  tables:
    t_order:
      dataSourceNames:
        - shadowDataSource
      shadowAlgorithmNames:
        - simple-hint-algorithm
        - user-id-value-match-algorithm
  shadowAlgorithms:
    simple-hint-algorithm:
      type: SIMPLE_HINT
      props:
        foo: bar
    user-id-insert-match-algorithm:
      type: VALUE_MATCH
      props:
        operation: insert
        column: user_id
        regex: 0
      
- !SQL_PARSER
  sqlCommentParseEnabled: true
```

注意：如果使用注解影子算法，需要开启解析 SQL 注释配置项 sqlCommentParseEnabled: true，默认关闭。

#### （3）影子库环境

- 创建影子库 ds_shadow。
- 创建影子表，表结构与生产环境必须一致。假设在影子库创建 t_order 表。创建表语句需要添加 SQL 注释 /*foo:bar,...*/。即：

```java
CREATE TABLE t_order (order_id INT(11) primary key, user_id int(11) not null, ...) /*foo:bar,...*/
```

执行到影子库。

注意：如果使用 MySQL 客户端进行测试，链接需要使用 -c 参数，例如：

```java
mysql> mysql -u root -h127.0.0.1 -P3306 -proot -c
```

-c参数表示保留注释，发送注释到服务端。

执行包含注解 SQL 例如：

```java
SELECT * FROM table_name /*shadow:true,foo:bar*/;
```

不使用参数 -c 会被 MySQL 客户端截取注释语句变为：

```java
SELECT * FROM table_name;
```

影响测试结果。

#### （4）影子算法使用

- 列影子算法使用

假设t_order 表中包含下单用户ID的 user_id 列。实现的效果，当用户ID为 0 的用户创建订单产生的数据，即：

```java
INSERT INTO t_order (order_id, user_id, ...) VALUES (xxx..., 0, ...)
```

会执行到影子库，其他数据执行到生产库。无需修改任何 SQL 或者代码，只需要对压力测试的数据进行控制就可以实现在线的压力测试。算法配置如下：

```java
shadowAlgorithms:
  user-id-insert-match-algorithm:
    type: VALUE_MATCH
    props:
      operation: insert
      column: user_id
      regex: 0
```

注意：影子表使用列影子算法时，相同类型操作（INSERT, UPDATE, DELETE, SELECT）目前仅支持单个字段。

- 使用 Hint 影子算法

假设t_order 表中不包含可以对值进行匹配的列。添加注解 /*foo:bar,...*/ 到执行 SQL 中，即：

```java
SELECT * FROM t_order WHERE order_id = xxx /*foo:bar,...*/ 
```

会执行到影子库，其他数据执行到生产库。算法配置如下：

```java
shadowAlgorithms:
  simple-hint-algorithm:
    type: SIMPLE_HINT
    props:
      foo: bar
```

- 混合使用影子模式

假设对t_order 表压测需要覆盖以上两种场景，即：

```java
INSERT INTO t_order (order_id, user_id, ...) VALUES (xxx..., 0, ...);
SELECT * FROM t_order WHERE order_id = xxx /*foo:bar,...*/;
```

都会执行到影子库，其他数据执行到生产库。算法配置如下：

```java
shadowAlgorithms:
  user-id-value-match-algorithm:
    type: VALUE_MATCH
    props:
      operation: insert
      column: user_id
      value: 0
  simple-hint-algorithm:
    type: SIMPLE_HINT
    props:
      foo: bar
```

- 使用默认影子算法

假设对t_order 表压测使用列影子算法，其他表都需要使用 Hint 影子算法。即：

```java
INSERT INTO t_order (order_id, user_id, ...) VALUES (xxx..., 0, ...);
INSERT INTO t_xxx_1 (order_item_id, order_id, ...) VALUES (xxx..., xxx..., ...) /*foo:bar,...*/;
SELECT * FROM t_xxx_2 WHERE order_id = xxx /*foo:bar,...*/;
SELECT * FROM t_xxx_3 WHERE order_id = xxx /*foo:bar,...*/;
```

都会执行到影子库，其他数据执行到生产库。配置如下：

```java
rules:
- !SHADOW
dataSources:
  shadowDataSource:
    sourceDataSourceName: ds
    shadowDataSourceName: shadow_ds
tables:
  t_order:
    dataSourceNames:
      - shadowDataSource
    shadowAlgorithmNames:
      - simple-hint-algorithm
      - user-id-value-match-algorithm
shadowAlgorithms:
  simple-hint-algorithm:
    type: SIMPLE_HINT
    props:
      foo: bar
  user-id-insert-match-algorithm:
    type: VALUE_MATCH
    props:
      operation: insert
      column: user_id
      regex: 0
- !SQL_PARSER
  sqlCommentParseEnabled: true
```

注意：默认影子算法仅支持 Hint 影子算法。使用时必须确保配置文件中 props 的配置项小于等于 SQL 注释中的配置项，且配置文件的具体配置要和 SQL 注释中写的配置一样，配置文件中配置项越少，匹配条件越宽松。

```java
shadowAlgorithms:
  simple-note-algorithm:
    type: SIMPLE_HINT
    props:
      foo: bar
      foo1: bar1
```

如当前props 项中配置了如上两条配置，在 SQL 中可以匹配的写法有如下：

```java
SELECT * FROM t_xxx_2 WHERE order_id = xxx /*foo:bar, foo1:bar1, ...*/
SELECT * FROM t_xxx_2 WHERE order_id = xxx /*foo:bar, foo1:bar1, foo2:bar2, ...*/
```

```java
shadowAlgorithms:
  simple-note-algorithm:
    type: SIMPLE_HINT
    props:
      foo: bar
```

如当前props 项中配置了如上一条配置，在 SQL 中可以匹配的写法有如下：

```java
SELECT * FROM t_xxx_2 WHERE order_id = xxx /*foo:bar*/
SELECT * FROM t_xxx_2 WHERE order_id = xxx /*foo:bar, foo1:bar1, ...*/
```

## 三、用例测试

### 1. 准备测试用例环境

在172.18.26.198:3306数据库实例上执行：

```java
drop database if exists product_db;
create database product_db;
drop database if exists shadow_db;
create database shadow_db;
use product_db;
create table t_order (
    order_id bigint auto_increment primary key, 
    user_id bigint not null, 
    order_quantity int not null default 0, 
    order_amount decimal(10 , 2 ) not null default 0, 
    remark varchar(100),
    key idx_user_id (user_id));
create table t1(a int);
use shadow_db;
create table t_order (
    order_id bigint auto_increment primary key, 
    user_id bigint not null, 
    order_quantity int not null default 0, 
    order_amount decimal(10 , 2 ) not null default 0, 
    remark varchar(100),
    key idx_user_id (user_id));
create table t1(a int);
```

### 2. 建立影子库环境

#### （1）开启sqlCommentParseEnabled

在server.yaml配置文件中的rules段添加如下全局配置：

```java
- !SQL_PARSER
  sqlCommentParseEnabled: true
```

然会重启ShardingSphere-Proxy使配置生效：

```java
/root/apache-shardingsphere-5.1.1-shardingsphere-proxy-bin/bin/stop.sh
/root/apache-shardingsphere-5.1.1-shardingsphere-proxy-bin/bin/start.sh
```

连接Proxy：

```java
mysql -u root -h 172.18.10.66 -P 3307 -p123456 -c
```

查看sql_parser全局规则，确认配置生效：

```java
mysql> show sql_parser rule\G
*************************** 1. row ***************************
sql_comment_parse_enable: true
        parse_tree_cache: {"initialCapacity":128,"maximumSize":1024,"concurrencyLevel":4}
     sql_statement_cache: {"initialCapacity":2000,"maximumSize":65535,"concurrencyLevel":4}
1 row in set (0.01 sec)
```

#### （2）创建逻辑库

```java
drop database if exists shadow_db;
create database shadow_db;
use shadow_db;
```

#### （3）添加资源

```java
add resource 
ds_product (host=172.18.26.198, port=3306, db=product_db, user=wxy, password=mypass),
ds_shadow (host=172.18.26.198, port=3306, db=shadow_db, user=wxy, password=mypass);
show schema resources\G
```

#### （4）创建影子库规则

```java
mysql> create shadow rule group_0(
    -> source=ds_product,
    -> shadow=ds_shadow,
    -> t_order(
    -> (simple_hint_algorithm, type(name=simple_hint, properties("foo"="bar"))),
    -> (type(name=value_match, properties("operation"="insert","column"="user_id", "value"='0')))));
Query OK, 0 rows affected (0.04 sec)
mysql> show shadow rules;
+-----------+-------------+-------------+--------------+
| rule_name | source_name | shadow_name | shadow_table |
+-----------+-------------+-------------+--------------+
| group_0   | ds_product  | ds_shadow   | t_order      |
+-----------+-------------+-------------+--------------+
1 row in set (0.00 sec)
mysql> show shadow table rules;
+--------------+---------------------------------------------------+
| shadow_table | shadow_algorithm_name                             |
+--------------+---------------------------------------------------+
| t_order      | simple_hint_algorithm,group_0_t_order_value_match |
+--------------+---------------------------------------------------+
1 row in set (0.00 sec)
mysql> show shadow algorithms;
+-----------------------------+-------------+-----------------------------------------+------------+
| shadow_algorithm_name       | type        | props                                   | is_default |
+-----------------------------+-------------+-----------------------------------------+------------+
| simple_hint_algorithm       | simple_hint | foo=bar                                 | false      |
| group_0_t_order_value_match | value_match | column=user_id,operation=insert,value=0 | false      |
+-----------------------------+-------------+-----------------------------------------+------------+
2 rows in set (0.01 sec)
```

#### （4）创建缺省影子算法

```java
mysql> create shadow algorithm 
    -> (simple_hint_algorithm_default, type(name=simple_hint, properties("shadow"="true", "foo"="bar")));
Query OK, 0 rows affected (0.04 sec)
mysql> create default shadow algorithm name = simple_hint_algorithm_default;
Query OK, 0 rows affected (0.03 sec)
mysql> show shadow algorithms;
+-------------------------------+-------------+-----------------------------------------+------------+
| shadow_algorithm_name         | type        | props                                   | is_default |
+-------------------------------+-------------+-----------------------------------------+------------+
| simple_hint_algorithm         | simple_hint | foo=bar                                 | false      |
| group_0_t_order_value_match   | value_match | column=user_id,operation=insert,value=0 | false      |
| simple_hint_algorithm_default | simple_hint | shadow=true,foo=bar                     | true       |
+-------------------------------+-------------+-----------------------------------------+------------+
3 rows in set (0.00 sec)
```

### 3. 影子库测试

预览：

```java
mysql> preview insert into t_order (user_id,order_quantity,order_amount) values (1,10,100),(0,10,100);
+------------------+----------------------------------------------------------------------------------------+
| data_source_name | actual_sql                                                                             |
+------------------+----------------------------------------------------------------------------------------+
| ds_product       | insert into t_order (user_id,order_quantity,order_amount) values (1,10,100),(0,10,100) |
+------------------+----------------------------------------------------------------------------------------+
1 row in set (0.01 sec)
mysql> preview insert into t_order (user_id,order_quantity,order_amount) values (0,1,100),(0,2,200);
+------------------+--------------------------------------------------------------------------------------+
| data_source_name | actual_sql                                                                           |
+------------------+--------------------------------------------------------------------------------------+
| ds_shadow        | insert into t_order (user_id,order_quantity,order_amount) values (0,1,100),(0,2,200) |
+------------------+--------------------------------------------------------------------------------------+
1 row in set (0.01 sec)
mysql> preview insert into t_order (user_id,order_quantity,order_amount) values (1,10,100),(0,10,100) /*foo:bar*/;
+------------------+----------------------------------------------------------------------------------------------------+
| data_source_name | actual_sql                                                                                         |
+------------------+----------------------------------------------------------------------------------------------------+
| ds_shadow        | insert into t_order (user_id,order_quantity,order_amount) values (1,10,100),(0,10,100) /*foo:bar*/ |
+------------------+----------------------------------------------------------------------------------------------------+
1 row in set (0.01 sec)
mysql> preview insert into t1 values (1),(2);
+------------------+-------------------------------+
| data_source_name | actual_sql                    |
+------------------+-------------------------------+
| ds_product       | insert into t1 values (1),(2) |
+------------------+-------------------------------+
1 row in set (0.01 sec)
mysql> preview insert into t1 values (3),(4) /*foo:bar*/;
+------------------+-------------------------------------------+
| data_source_name | actual_sql                                |
+------------------+-------------------------------------------+
| ds_product       | insert into t1 values (3),(4) /*foo:bar*/ |
+------------------+-------------------------------------------+
1 row in set (0.01 sec)
mysql> preview insert into t1 values (5),(6) /*shadow:true,foo:bar*/;
+------------------+-------------------------------------------------------+
| data_source_name | actual_sql                                            |
+------------------+-------------------------------------------------------+
| ds_shadow        | insert into t1 values (5),(6) /*shadow:true,foo:bar*/ |
+------------------+-------------------------------------------------------+
1 row in set (0.01 sec)
mysql> preview insert into t1 values (7),(8) /*foo:bar,shadow:true*/;
+------------------+-------------------------------------------------------+
| data_source_name | actual_sql                                            |
+------------------+-------------------------------------------------------+
| ds_shadow        | insert into t1 values (7),(8) /*foo:bar,shadow:true*/ |
+------------------+-------------------------------------------------------+
1 row in set (0.01 sec)
```

执行：

```java
insert into t_order (user_id,order_quantity,order_amount) values (1,10,100),(0,10,100);
insert into t_order (user_id,order_quantity,order_amount) values (0,1,100),(0,2,200);
insert into t_order (user_id,order_quantity,order_amount) values (1,10,100),(0,10,100) /*foo:bar*/;
insert into t1 values (1),(2);
insert into t1 values (3),(4) /*foo:bar*/;
insert into t1 values (5),(6) /*shadow:true,foo:bar*/;
insert into t1 values (7),(8) /*foo:bar,shadow:true*/;
```

在MySQL里查询：

```java
mysql> select * from product_db.t_order;
+----------+---------+----------------+--------------+--------+
| order_id | user_id | order_quantity | order_amount | remark |
+----------+---------+----------------+--------------+--------+
|        1 |       1 |             10 |       100.00 | NULL   |
|        2 |       0 |             10 |       100.00 | NULL   |
+----------+---------+----------------+--------------+--------+
2 rows in set (0.00 sec)
mysql> select * from shadow_db.t_order;
+----------+---------+----------------+--------------+--------+
| order_id | user_id | order_quantity | order_amount | remark |
+----------+---------+----------------+--------------+--------+
|        1 |       0 |              1 |       100.00 | NULL   |
|        2 |       0 |              2 |       200.00 | NULL   |
|        3 |       1 |             10 |       100.00 | NULL   |
|        4 |       0 |             10 |       100.00 | NULL   |
+----------+---------+----------------+--------------+--------+
4 rows in set (0.00 sec)
mysql> select * from product_db.t1;
+------+
| a    |
+------+
|    1 |
|    2 |
|    3 |
|    4 |
+------+
4 rows in set (0.00 sec)
mysql> select * from shadow_db.t1;
+------+
| a    |
+------+
|    5 |
|    6 |
|    7 |
|    8 |
+------+
4 rows in set (0.00 sec)
```

修改t_order 表的影子规则，将 value_match 算法改为 regex_match 算法：

```java
alter shadow rule group_0(
source=ds_product,
shadow=ds_shadow,
t_order(
(simple_hint_algorithm, type(name=simple_hint, properties("foo"="bar"))),
(type(name=regex_match, properties("operation"="insert","column"="user_id", "regex"='[1,2,3]')))));
```

测试正则表达式匹配：

```java
mysql> preview insert into t_order (user_id,order_quantity,order_amount) values (1,10,100),(2,10,100),(3,10,100);
+------------------+---------------------------------------------------------------------------------------------------+
| data_source_name | actual_sql                                                                                        |
+------------------+---------------------------------------------------------------------------------------------------+
| ds_shadow        | insert into t_order (user_id,order_quantity,order_amount) values (1,10,100),(2,10,100),(3,10,100) |
+------------------+---------------------------------------------------------------------------------------------------+
1 row in set (0.01 sec)
mysql> preview insert into t_order (user_id,order_quantity,order_amount) values (1,10,100),(2,10,100),(3,10,100),(4,10,100);           
+------------------+--------------------------------------------------------------------------------------------------------------+
| data_source_name | actual_sql                                                                                                   |
+------------------+--------------------------------------------------------------------------------------------------------------+
| ds_product       | insert into t_order (user_id,order_quantity,order_amount) values (1,10,100),(2,10,100),(3,10,100),(4,10,100) |
+------------------+--------------------------------------------------------------------------------------------------------------+
1 row in set (0.00 sec)
mysql> preview insert into t_order (user_id,order_quantity,order_amount) values (1,10,100),(2,10,100),(3,10,100),(4,10,100) /*foo:bar*/ ;
+------------------+--------------------------------------------------------------------------------------------------------------------------+
| data_source_name | actual_sql                                                                                                               |
+------------------+--------------------------------------------------------------------------------------------------------------------------+
| ds_shadow        | insert into t_order (user_id,order_quantity,order_amount) values (1,10,100),(2,10,100),(3,10,100),(4,10,100) /*foo:bar*/ |
+------------------+--------------------------------------------------------------------------------------------------------------------------+
1 row in set (0.00 sec)
```
