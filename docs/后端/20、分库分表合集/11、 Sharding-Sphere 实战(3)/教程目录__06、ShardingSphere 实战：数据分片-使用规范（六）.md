# 06、ShardingSphere 实战：数据分片-使用规范（六）
- 来源：https://ddkk.com/zhuanlan/sharding/shardingsphere/3/6.html
- 分类：分库分表
- 分组：教程目录
## 使用规范

### 背景

虽然ShardingSphere希望能够完全兼容所有的SQL以及单机数据库，但分布式为数据库带来了更加复杂的场景。ShardingSphere希望能够优先解决海量数据OLTP的问题，OLAP的相关支持，会一点一点的逐渐完善。

请进一步阅读ShardingSphere所支持和不支持的[SQL](https://shardingsphere.apache.org/document/current/cn/features/sharding/use-norms/sql)类型以及针对[分页](https://shardingsphere.apache.org/document/current/cn/features/sharding/use-norms/pagination)这类性能相关度很高的问题。

## SQL

由于SQL语法灵活复杂，分布式数据库和单机数据库的查询场景又不完全相同，难免有和单机数据库不兼容的SQL出现。

本文详细罗列出已明确可支持的SQL种类以及已明确不支持的SQL种类，尽量让使用者避免踩坑。

其中必然有未涉及到的SQL欢迎补充，未支持的SQL也尽量会在未来的版本中支持。

### 支持项

#### 路由至单数据节点

- 100%全兼容（目前仅MySQL，其他数据库完善中）。

#### 路由至多数据节点

全面支持DML、DDL、DCL、TCL和部分DAL。支持分页、去重、排序、分组、聚合、关联查询（不支持跨库关联）。以下用最为复杂的DML举例：

- SELECT主语句

```java
SELECT select_expr [, select_expr ...] FROM table_reference [, table_reference ...]
[WHERE predicates]
[GROUP BY {col_name | position} [ASC | DESC], ...]
[ORDER BY {col_name | position} [ASC | DESC], ...]
[LIMIT {[offset,] row_count | row_count OFFSET offset}]
```

- select_expr

```java
* | 
[DISTINCT] COLUMN_NAME [AS] [alias] | 
(MAX | MIN | SUM | AVG)(COLUMN_NAME | alias) [AS] [alias] | 
COUNT(* | COLUMN_NAME | alias) [AS] [alias]
```

- table_reference

```java
tbl_name [AS] alias] [index_hint_list]
| table_reference ([INNER] | {LEFT|RIGHT} [OUTER]) JOIN table_factor [JOIN ON conditional_expr | USING (column_list)]
```

### 不支持项

#### 路由至多数据节点

不支持CASE WHEN、HAVING、UNION (ALL)，有限支持子查询。

除了分页子查询的支持之外(详情请参考[分页](https://shardingsphere.apache.org/document/current/cn/features/sharding/use-norms/pagination))，也支持同等模式的子查询。无论嵌套多少层，ShardingSphere都可以解析至第一个包含数据表的子查询，一旦在下层嵌套中再次找到包含数据表的子查询将直接抛出解析异常。

例如，以下子查询可以支持：

```java
SELECT COUNT(*) FROM (SELECT * FROM t_order o)
```

以下子查询不支持：

```java
SELECT COUNT(*) FROM (SELECT * FROM t_order o WHERE o.id IN (SELECT id FROM t_order WHERE status = ?))
```

简单来说，通过子查询进行非功能需求，在大部分情况下是可以支持的。比如分页、统计总数等；而通过子查询实现业务查询当前并不能支持。

由于归并的限制，子查询中包含聚合函数目前无法支持。

不支持包含schema的SQL。因为ShardingSphere的理念是像使用一个数据源一样使用多数据源，因此对SQL的访问都是在同一个逻辑schema之上。

### 示例

#### 支持的SQL

SQL
必要条件

SELECT * FROM tbl_name

SELECT * FROM tbl_name WHERE (col1 = ? or col2 = ?) and col3 = ?

SELECT * FROM tbl_name WHERE col1 = ? ORDER BY col2 DESC LIMIT ?

SELECT COUNT(*), SUM(col1), MIN(col1), MAX(col1), AVG(col1) FROM tbl_name WHERE col1 = ?

SELECT COUNT(col1) FROM tbl_name WHERE col2 = ? GROUP BY col1 ORDER BY col3 DESC LIMIT ?, ?

INSERT INTO tbl_name (col1, col2,…) VALUES (?, ?, ….)

INSERT INTO tbl_name VALUES (?, ?,….)

INSERT INTO tbl_name (col1, col2, …) VALUES (?, ?, ….), (?, ?, ….)

UPDATE tbl_name SET col1 = ? WHERE col2 = ?

DELETE FROM tbl_name WHERE col1 = ?

CREATE TABLE tbl_name (col1 int, …)

ALTER TABLE tbl_name ADD col1 varchar(10)

DROP TABLE tbl_name

TRUNCATE TABLE tbl_name

CREATE INDEX idx_name ON tbl_name

DROP INDEX idx_name ON tbl_name

DROP INDEX idx_name

SELECT DISTINCT * FROM tbl_name WHERE col1 = ?

SELECT COUNT(DISTINCT col1) FROM tbl_name

#### 不支持的SQL

SQL
不支持原因

INSERT INTO tbl_name (col1, col2, …) VALUES(1+2, ?, …)
VALUES语句不支持运算表达式

INSERT INTO tbl_name (col1, col2, …) SELECT col1, col2, … FROM tbl_name WHERE col3 = ?
INSERT .. SELECT

SELECT COUNT(col1) as count_alias FROM tbl_name GROUP BY col1 HAVING count_alias > ?
HAVING

SELECT * FROM tbl_name1 UNION SELECT * FROM tbl_name2
UNION

SELECT * FROM tbl_name1 UNION ALL SELECT * FROM tbl_name2
UNION ALL

SELECT * FROM ds.tbl_name1
包含schema

SELECT SUM(DISTINCT col1), SUM(col1) FROM tbl_name
详见DISTINCT支持情况详细说明

### DISTINCT支持情况详细说明

#### 支持的SQL

SQL

SELECT DISTINCT * FROM tbl_name WHERE col1 = ?

SELECT DISTINCT col1 FROM tbl_name

SELECT DISTINCT col1, col2, col3 FROM tbl_name

SELECT DISTINCT col1 FROM tbl_name ORDER BY col1

SELECT DISTINCT col1 FROM tbl_name ORDER BY col2

SELECT DISTINCT(col1) FROM tbl_name

SELECT AVG(DISTINCT col1) FROM tbl_name

SELECT SUM(DISTINCT col1) FROM tbl_name

SELECT COUNT(DISTINCT col1) FROM tbl_name

SELECT COUNT(DISTINCT col1) FROM tbl_name GROUP BY col1

SELECT COUNT(DISTINCT col1 + col2) FROM tbl_name

SELECT COUNT(DISTINCT col1), SUM(DISTINCT col1) FROM tbl_name

SELECT COUNT(DISTINCT col1), col1 FROM tbl_name GROUP BY col1

SELECT col1, COUNT(DISTINCT col1) FROM tbl_name GROUP BY col1

#### 不支持的SQL

SQL
不支持原因

SELECT SUM(DISTINCT col1), SUM(col1) FROM tbl_name
同时使用普通聚合函数和DISTINCT聚合函数

## 分页

完全支持MySQL、PostgreSQL和Oracle的分页查询，SQLServer由于分页查询较为复杂，仅部分支持。

### 分页性能

#### 性能瓶颈

查询偏移量过大的分页会导致数据库获取数据性能低下，以MySQL为例：

```java
SELECT * FROM t_order ORDER BY id LIMIT 1000000, 10
```

这句SQL会使得MySQL在无法利用索引的情况下跳过1000000条记录后，再获取10条记录，其性能可想而知。 而在分库分表的情况下（假设分为2个库），为了保证数据的正确性，SQL会改写为：

```java
SELECT * FROM t_order ORDER BY id LIMIT 0, 1000010
```

即将偏移量前的记录全部取出，并仅获取排序后的最后10条记录。这会在数据库本身就执行很慢的情况下，进一步加剧性能瓶颈。 因为原SQL仅需要传输10条记录至客户端，而改写之后的SQL则会传输`1,000,010 * 2`的记录至客户端。

#### ShardingSphere的优化

ShardingSphere进行了2个方面的优化。

首先，采用流式处理 + 归并排序的方式来避免内存的过量占用。由于SQL改写不可避免的占用了额外的带宽，但并不会导致内存暴涨。 与直觉不同，大多数人认为ShardingSphere会将`1,000,010 * 2`记录全部加载至内存，进而占用大量内存而导致内存溢出。 但由于每个结果集的记录是有序的，因此ShardingSphere每次比较仅获取各个分片的当前结果集记录，驻留在内存中的记录仅为当前路由到的分片的结果集的当前游标指向而已。 对于本身即有序的待排序对象，归并排序的时间复杂度仅为`O(n)`，性能损耗很小。

其次，ShardingSphere对仅落至单分片的查询进行进一步优化。 落至单分片查询的请求并不需要改写SQL也可以保证记录的正确性，因此在此种情况下，ShardingSphere并未进行SQL改写，从而达到节省带宽的目的。

### 分页方案优化

由于LIMIT并不能通过索引查询数据，因此如果可以保证ID的连续性，通过ID进行分页是比较好的解决方案：

```java
SELECT * FROM t_order WHERE id > 100000 AND id <= 100010 ORDER BY id
```

或通过记录上次查询结果的最后一条记录的ID进行下一页的查询：

```java
SELECT * FROM t_order WHERE id > 100000 LIMIT 10
```

### 分页子查询

Oracle和SQLServer的分页都需要通过子查询来处理，ShardingSphere支持分页相关的子查询。

- Oracle

支持使用rownum进行分页：

```java
SELECT * FROM (SELECT row_.*, rownum rownum_ FROM (SELECT o.order_id as order_id FROM t_order o JOIN t_order_item i ON o.order_id = i.order_id) row_ WHERE rownum <= ?) WHERE rownum > ?
```

目前不支持rownum + BETWEEN的分页方式。

- SQLServer

支持使用TOP + ROW_NUMBER() OVER配合进行分页：

```java
SELECT * FROM (SELECT TOP (?) ROW_NUMBER() OVER (ORDER BY o.order_id DESC) AS rownum, * FROM t_order o) AS temp WHERE temp.rownum > ? ORDER BY temp.order_id
```

支持SQLServer 2012之后的OFFSET FETCH的分页方式：

```java
SELECT * FROM t_order o ORDER BY id OFFSET ? ROW FETCH NEXT ? ROWS ONLY
```

目前不支持使用WITH xxx AS (SELECT …)的方式进行分页。由于Hibernate自动生成的SQLServer分页语句使用了WITH语句，因此目前并不支持基于Hibernate的SQLServer分页。 目前也不支持使用两个TOP + 子查询的方式实现分页。

- MySQL, PostgreSQL

MySQL和PostgreSQL都支持LIMIT分页，无需子查询：

```java
SELECT * FROM t_order o ORDER BY id LIMIT ? OFFSET ?
```
