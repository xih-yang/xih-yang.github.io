# 12、MySQL 教程 - MySQL 性能分析工具：explain执行计划~id列、table列、select_type列
- 来源：https://ddkk.com/zhuanlan/db/mysql/6/12.html
- 分类：缓存数据库
- 分组：教程目录
### 1. 数据准备

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

定位了查询慢的sql之后，我们就可以使用explain工具做针对性的分析查询语句。

mysql查询优化器基于成本和规则对一条查询语句进行优化后，会生成一个执行计划。这个执行计划展示了接下来执行查询的具体方式，比如多表连接的顺序是什么，采用什么访问方法来具体查询每个表等。设计MySQL的大数贴心的提供了explain语句，可以让我们查看每个查询语句的具体执行计划。

可以通过查看explain语句的各个输出项是干嘛的，从来可以有针对性的提升查询语句的性能。MySQL 5.6.3以前只能 explain select；MySQL 5.6.3以后就可以explain select,delete,update;

explain语句的语法形式如下：

```java
explain select select_options
```

如果我们想看看某个查询的执行计划的话，可以在具体的查询语句前边加一个 explain，就像这样：

```java
explain select 1;
```

explain 语句输出的各个列的作用如下：

### 2. table列

无论我们的查询语句有多复杂，里面包含了多少个表，到最后也是对每个表进行单表访问的。所以MySQL规定：explain语句输出的每条记录都对应着某个单表的访问方法，该表记录的table列代表该表的列名。

**示例1：**

```java
explain select * form s1;
```

这条查询语句只涉及对s1表的单表查询，所以explain输出中只有一条记录，其中的table的列的值是s1，表明这条记录是用来说明对s1表的单表访问方法的。

**示例2：**

下面在看一个连接查询的执行计划：

```java
explain select * from s1 join s2;
```

可以看到，这个连接查询的执行计划中有两条记录，这两条记录的table列分别是s1和s2，这两条记录用来分别说明对s1表和s2表的访问方法是什么。

### 3. id列

比较简单的查询语句中只有一个select关键字：

```java
select * from s1 where key1='a';
```

稍微复杂一点的连接查询中也只有一个select关键字：

```java
select * from s1 join s2 on s1.key1 = s2.key1 where s1.common_field='a';
```

但是下面的这两种情况，一条查询语句中会出现多个select关键字：

(1)查询中包含子查询的情况：

```java
select * from s1 where key1 in (select key3 from s2);
```

(2)查询中包含union子句的情况：

```java
select * from s1 union select * from s2;
```

**示例1：**

查询语句中每出现一个select关键字，mysql就会为它分配一个唯一的id值，这个id值就是explain输出的第一列。比如下面这个查询语句中只有一个select关键字，所以explain的结果也就只有一条id列为1的记录：

```java
explain select * from s1 where key1='a';
```

**示例2：**

对于连接查询来说，一个select关键字后面的from子句中可以跟随多个表。在连接查询的执行计划中，每个表都会对应一条记录，但是这些记录的id是相同的，比如：

```java
explain select * from s1 join s2;
```

在上述连接查询中，参与连接的s1和s2表分别对应一条记录，但是这两条记录对应的id值都是1。在连接查询的执行计划中，每个表都会对应一条记录，这些记录的id列的值是相同的，出现在前面的表表示驱动表，出现在后面的表表示被驱动表。所以从explain执行计划中可以看出，查询优化器会让s1表作为驱动表，让s2表作为被驱动表来执行查询。

**示例3：**

对于包含子查询的查询语句来说，可能会涉及多个select关键字，所以在包含子查询的查询语句的执行计划中，每个select关注键值都会对应一个唯一的id，比如下面：

```java
explain select * from s1 where key1 in (select key1 from s2) or key3='a';
```

从结果可以看出，s1表在外层查询中，外层查询有一个独立的select关键字，所以第一条记录的id值为1，s2表在子查询中，子查询有一个独立的select关键字，所以第2条记录的id值为2。

**示例4：**

查询优化器可能会对涉及子查询的查询语句进行重写，从而转换为连接查询。如果想知道查询优化器对某个包含子查询的查询语句是否进行了重写，直接查看执行计划就可以了。

```java
explain select * from s1 where key1 in (select key2 FROM s2 WHERE common_field='a');
```

可以看到，虽然查询语句中包含一个子查询，但是执行计划中s1和s2表对应的记录的id值全部是1，这表明查询优化器将子查询转换为了连接查询。

**示例5：**

对于union子句的查询语句来说，每个select关键字对应一个id值也是没错的，但是有点特别：

```java
explain select * from s1 union select * from s2;
```

这个语句的执行计划的第3条记录的id值为null，而且table列为``，union的作用会把多个查询的结果集合并起来**并对结果集中的记录进行去重**，去重的时候使用的是内部临时表，union子句为了把id为1的查询和id为2的查询的结果集合起来并去重，在内部创建了一个名为``的临时表，id为null表明这个临时表是为了合并两个查询的结果集而创建的。

**示例6：**

与union比起来，union all就不需要对最终的结果进行去重，它只是单纯的把多个查询结果集中的合并成一个并返回给用户，所以也就不需要使用临时表。所以在包含union all子句的查询的执行计划中，就没有哪个id为null的记录，如下所示：

```java
explain select * from s1 union all select * from s2;
```

### 4. select_type列

一条大的查询语句里面可以包含若干个select关键字，每个select关键字代表着一个小的查询语句，而每个select关键字的from子句中都可以包含若干张表，每一张表都对应着执行计划输出中的一条记录，对于在同一个select关键字中的表来说，他们的id值是相同的。

mysql为每一个select关键字代表的小查询都定义了一个称为select_type的属性，意思是只要我们知道了某个小查询的select_type属性，就知道了这个小查询在整个大查询中扮演了一个什么角色。如下表为select_type的取值：

```java
simple、primary、union、union result、subquery、dependent subquery、dependent union、derived、materialized、uncacheable subquery、uncacheable union
```

## 4.1 simple

**simple**：查询语句中不包含union或者子查询的查询都算做simple类型。

```java
explain select * from s1;
```

```java
explain select * from s1 join s2;
```

## 4.2 primary/union/union result

**primary**：对于包含union，union all或者子查询的大查询来说，它是由几个小查询组成的，其中最左边那个查询的select_type的值就是primary。

**union**：对于包含union或者union all的大查询来说，它是由几个小查询组成的，其中除了最左边的那个小查询以外，其余小查询的select_type值就是union。

**union result**：mysql选择使用临时表来完成union查询的去重工作，针对该临时表的查询的select_type就是union result。

```java
explain select * from s1 union select * from s2;
```

## 4.3 subquery

**subquery**：如果包含子查询的查询语句不能转化为连接查询，并且该子查询不是相关子查询，那么查询优化器执行该查询时，该子查询的第一个select关键字代表的那个查询的select_type就是subquery。

```java
explain select * from s1 where key1 in (select key1 from s2) or key3='a';
```

可以看到，外层查询的select_type就是primary，子查询的select_type就是subquery。

注：查询优化器可能对涉及子查询的查询语句进行重写，从而转换为连接查询（半连接）。

注：如果子查询的执行需要依赖外层查询的值，我们就把这个子查询称为相关子查询。如果子查询可以单独运行出结果，而不依赖于外层查询的值，我们就把这个子查询称为不相关子查询。

## 4.4 dependent subquery

**dependent subquery**：如果包含子查询的查询语句不能转化为连接查询形式，并且该子查询被查询优化器转换为相关子查询的形式，则该子查询的第一个select关键字代表的那个查询的select_type就是dependent subquery。

```java
explain select * from s1 where key1 in (select key1 from s2 where s1.key2=s2.key2) or key3='a';
```

## 4.5 dependent union

**dependent union**：在包含union或者union all的大查询中，如果各个小查询都依赖于外层查询，则除了最左边的那个小查询外，其余小查询的select_type的值就是dependent union。

```java
explain select * from s1 where key1 in (select key1 from s2 where key1='a' union select key1 from s1 where key1='b');
```

## 4.6 derived

**derived**：在包含派生表的查询中，如果以物化派生表的方式执行查询，则派生表对应的子查询的select_type就是derived

```java
explain select * from (select key1,count(*) c from s1 group by key1) as derived_s1 where c>1;
```
