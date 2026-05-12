# 13、MySQL 教程 - MySQL 性能分析工具：explain执行计划~type列
- 来源：https://ddkk.com/zhuanlan/db/mysql/6/13.html
- 分类：缓存数据库
- 分组：教程目录
## 0. 数据准备

```java
// 创建表s1
CREATE TABLE s1 (
id INT AUTO_INCREMENT,
key1 VARCHAR(100),
key2 INT,
key3 VARCHAR(100),
key_part1 VARCHAR(100),
key_part2 VARCHAR(100),
key_part3 VARCHAR(100),
common_field VARCHAR(100),
PRIMARY KEY (id),
INDEX idx_key1 (key1),
UNIQUE INDEX idx_key2 (key2),
INDEX idx_key3 (key3),
INDEX idx_key_part(key_part1, key_part2, key_part3)
) ENGINE=INNODB CHARSET=utf8;
// 创建表s2
CREATE TABLE s2 (
id INT AUTO_INCREMENT,
key1 VARCHAR(100),
key2 INT,
key3 VARCHAR(100),
key_part1 VARCHAR(100),
key_part2 VARCHAR(100),
key_part3 VARCHAR(100),
common_field VARCHAR(100),
PRIMARY KEY (id),
INDEX idx_key1 (key1),
UNIQUE INDEX idx_key2 (key2),
INDEX idx_key3 (key3),
INDEX idx_key_part(key_part1, key_part2, key_part3)
) ENGINE=INNODB CHARSET=utf8;
// 允许创建函数设置
set global log_bin_trust_function_creators=1;
// 创建函数
DELIMITER //
CREATE FUNCTION rand_string1(n INT)
RETURNS VARCHAR(255)该函数会返回一个字符串
BEGIN
DECLARE chars_str VARCHAR(100) DEFAULT
'abcdefghijklmnopqrstuvwxyzABCDEFJHIJKLMNOPQRSTUVWXYZ';
DECLARE return_str VARCHAR(255) DEFAULT '';
DECLARE i INT DEFAULT 0;
WHILE i < n DO
SET return_str =CONCAT(return_str,SUBSTRING(chars_str,FLOOR(1+RAND()*52),1));
SET i = i + 1;
END WHILE;
RETURN return_str;
END //
DELIMITER ;
// 创建往s1表中插入数据的存储过程：
DELIMITER //
CREATE PROCEDURE insert_s1 (IN min_num INT (10),IN max_num INT (10))
BEGIN
DECLARE i INT DEFAULT 0;
SET autocommit = 0;
REPEAT
SET i = i + 1;
INSERT INTO s1 VALUES(
(min_num + i),
rand_string1(6),
(min_num + 30 * i + 5),
rand_string1(6),
rand_string1(10),
rand_string1(5),
rand_string1(10),
rand_string1(10));
UNTIL i = max_num
END REPEAT;
COMMIT;
END //
DELIMITER ;
// 创建往s2表中插入数据的存储过程：
DELIMITER //
CREATE PROCEDURE insert_s2 (IN min_num INT (10),IN max_num INT (10))
BEGIN
DECLARE i INT DEFAULT 0;
SET autocommit = 0;
REPEAT
SET i = i + 1;
INSERT INTO s2 VALUES(
(min_num + i),
rand_string1(6),
(min_num + 30 * i + 5),
rand_string1(6),
rand_string1(10),
rand_string1(5),
rand_string1(10),
rand_string1(10));
UNTIL i = max_num
END REPEAT;
COMMIT;
END //
DELIMITER ;
// s1表数据的添加：加入1万条记录：
CALL insert_s1(10001,10000);
// s2表数据的添加：加入1万条记录：
CALL insert_s2(10001,10000);
```

执行计划的一条记录代表着MySQL对某个表执行查询时的访问方法，其中的type列就表明了这个访问方法是啥。

```java
explain select * from s1 where key1='a';
```

完整的访问方法有:

```java
system、const、eq_ref、ref、fulltext、ref_or_null、index_merge、unique_subquery、index_subquery、range、index、all
```

## 01. system

当表中只有一条记录，并且该表使用的存储引擎是精确的（比如MyISAM、MEMORY）的统计计数是精确的，那么对该表的访问方法就是system。

```java
// 创建表
create table t(i int)Engine=MyISAM;
// 插入一条数据
insert into t values(1);
// 执行计划
explain select * from t;
```

## 02. const

我们根据主键或者唯一二级索引列与常数进行等值匹配时，对单表的访问方法就是const。

```java
explain select * from s1 where id=10002;
```

## 03. eq_ref

执行连接查询时，如果被驱动表示通过主键或者不允许存储null值的唯一二级索引列等值匹配的方式进行访问的，则对该被驱动表的访问方法就是eq_ref。

```java
explain select * from s1 join s2 on s1.id=s2.id;
```

MySQL将s1表作为驱动表，将s2作为被驱动表，可以看到s2的访问方法是eq_ref，表明在访问s2表示，可以通过主键的等值匹配来访问。

## 04. ref

当通过普通的二级索引列与常量进行等值匹配的方式来查询某个表示，对该表的访问方法就可能是ref。另外，如果是执行连接查询，被驱动表中的某个普通的二级索引列与驱动表中的某个列进行等值匹配，那么对呗驱动表也可能使用ref的访问方法。

```java
explain select * from s1 join s2 on s1.key1=s2.key1;
```

## 05. ref_or_null

当对普通二级索引列进行等值匹配且索引列的值也可以是null值时，对该表的访问方法就是ref_no_null值。

```java
explain select * from s1 where key1='a' or key1 is null;
```

## 06. index_merge

MySQL使用索引合并的方式来对某个表执行查询。

执行计划的type列是index_merge，即MySQL打算使用索引合并的方式来执行对s1表的查询。

## 07. unique_subquery

union_subquery针对的是一些包含in子查询的查询语句，如果查询优化器决定将in子查询转换为exist子查询，而且子查询在转换之后可以使用主键或者不允许存储null值的唯一二级索引进行等值匹配，那么该子查询执行计划的type列的值就是unique_subquery。

```java
explain select * from s1 where common_field in
 (select id from s2 where s1.common_field=s2.common_field) or key3='a';
```

执行计划第二条记录的type值就是unique_subquery，这时在执行子查询时会使用到id列的聚簇索引。

## 08. index_subquery

index_subquery和unique_subquery类似，值不符哦在访问子查询中的表时，使用的是普通的索引。

```java
explain select * from s1 where common_field in 
(select key3 from s2 where s1.common_field=s2.common_field) or key3='a';
```

## 09. range

如果使用索引获取某些单点扫描区间的记录，那么就可能使用到range方法。

```java
explain select * from s1 where key1 in ('a','b','c');
```

或者用于获取某个或者某些范围扫描区间的记录的查询：

```java
explain select * from s1 where key1>'a' and key1<'b';
```

## 10. index

当可以使用索引覆盖，但是需要扫描全部的索引记录时，该表的访问方法就是index。

```java
explain select key_part2 from s1 where key_part3='a';
```

上述查询的查询列表中只有key_part2一个列，而且搜索条件页只有key_part3一个列，这两个列有恰好在idx_key_part索引中。但是，搜索条件key_part3='a’不能形成合适的扫描区间从而减少需要扫描的记录数量，而只能扫描整个idx_key_part索引的记录，所以执行计划的type列的值就是index。

另外，对于InnoDB存储引擎来说，当我们使用全表扫描，并且需要对主键进行排序时，此时的type列的值也是index。

## 11. all

全表扫描方式
