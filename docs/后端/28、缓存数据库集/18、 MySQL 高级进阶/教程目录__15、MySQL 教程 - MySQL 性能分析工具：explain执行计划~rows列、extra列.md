# 15、MySQL 教程 - MySQL 性能分析工具：explain执行计划~rows列、extra列
- 来源：https://ddkk.com/zhuanlan/db/mysql/6/15.html
- 分类：缓存数据库
- 分组：教程目录
### 0. 数据准备

```java
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
```

Extra列是用来说明一些额外信息的，我们可以通过这些额外信息来更准确的理解MySQL到底如何执行给定的查询语句。

### 1. rows列

在查询优化器决定使用全表扫描的方式对某个表执行查询时，执行计划的rows列就代表该表的估计行数。如果使用索引来执行查询，执行计划的rows列就代表预计扫描的索引记录行数。

```java
explain select * from s1 where key1>'z';
```

执行计划的rows列的值为343，这意味着查询优化器在分析完使用idx_key1执行查询的成本之后，觉得满足key>'z’条件的记录只有343条。

### 2. extra列

## 1. no tables used

当查询语句中没有from子句时将会提示该额外信息。

```java
explain select 1;
```

## 2. impossible where

查询语句的where子句永远为false时将会提示该额外信息。

```java
explain select * from s1 where 1!=1;
```

## 3. using index

使用覆盖索引执行查询时，extra列将会提示该额外信息。

```java
explain select key1 from s1 where key1='a';
```

## 4. using index condition

有些搜索条件中虽然出现了索引列，但是却不能充当边界条件来形成扫描区间，也就是不能用来减少需要扫描的记录数量，将会提示该额外信息。

```java
explain select * from s1 where key1>'z' and key1 like '%a';
```

其中key1>‘z’ 可以用来形成扫描区间，但是key1 like '%a’却不能。

MySQL服务器程序分为server层和存储引擎层，sever层在生成执行计划后，是按照下面的步骤来执行这个查询的：

- 步骤1：server层首先调用存储引擎的接口定位到满足key1>'z’条件的第一条二级索引记录。
- 步骤2：存储引擎根据B+树索引定位到这条二级索引记录后，不着急执行回表操作，而是先判断一下所有关于idx_key1索引中包含的列的条件是否成立，也就是 key1>‘z’ and key1 like '%a’是否成立（索引下推）。如果这些条件不成立，则直接跳过该二级索引记录，然后去找下一条二级索引记录，如果这些条件成立，则执行回表操作，将完整的用户记录返回给server层。
- 步骤3：server层再判断其他的搜索条件是否成立（本例中没有其他搜索条件了），如果成立则将其发送给客户端，否则跳过该记录，然后项存储引擎层要下一条记录。
- 步骤4：重复步骤3，直到将索引idx_key1的扫描区间 key1>‘z’ 内的所有记录都扫描完为止。

如果在查询语句的执行过程中使用索引下推特性，在extra列中将会显示using index condition。

索引条件下推特性只是为了在扫描某个扫描区间的二级索引记录时，尽可能减少回表操作的次数，从而减少IO操作。而对于聚簇索引而言，它不需要回表，它本身就包含全部的列，也起不到减少IO操作的所用，所以InnoDB规定这个索引下推特性只适用于二级索引。

## 5. using where

当某个搜索条件需要在server层进行判断时，在extra列中会提示using where。

```java
explain select * from s1 where common_field='a';
```

本例中的common_field='a’条件是在server层进行判断的，所以该语句的执行计划的extra列才提示using where。

```java
explain select * from s1 where key1='a' and common_field='a';
```

这个语句在执行时将会用到idx_key1二级索引，但是由于该索引并不包含common_field列，也就是说该条件不能作为索引条件下推的条件在存储引擎层进行判断，存储引擎需要根据二级索引记录执行回表操作，并将完整的用户记录返回给server层之后，再在server层判断这个条件是否成立。

## 6. using filesort

在有些条件下，当对结果集中的记录进行排序时，是可以使用到索引列的。

```java
explain select * from s1 order by key1 limit 10;
```

这个查询语句利用idx_key1索引直接取出key1列的10条记录，然后针对每一条二级索引记录进行回表操作就好了，但是在很多情况下，排序操作无法使用到索引，只能在内存中（记录较少时）或者磁盘中（记录较多时）进行排序。设计MySQL的大数把这种在内存中或者磁盘中进行排序的方式称为文件排序（filesort）。如果某个查询需要使用文件排序的方式执行查询，就会在执行计划的extra列中显示using filesort提示。

```java
explain select * from s1 order by common_field limit 10;
```

注意：如果查询中需要使用文件排序的记录非常多，这个过程还是很耗费性能的。我们可以尝试将文件排序的执行方式改为使用索引进行排序。

## 7. using tempory

在许多查询的执行过程中，MySQL可能会借助临时表来完成一些功能，比如去重，排序之类的。比如我们在执行许多包含distinct、group by、union等子句的查询过程中，如果不能有效利用索引来完整查询，mysql可能通过建立内部的临时表来执行查询。如果查询中使用到了内部的临时表，在执行计划的extra列将会显示using temporary提示。

```java
explain select distinct common_field from s1;
```

```java
explain select common_field,count(*) as amount from s1 group by common_field;
```

注意：在执行计划中出现using temporary 并不是一个好的征兆，因为建立和维护表要付出很大的成本，所以最好能使用索引来替换临时表。比如下面这个group by子句的查询就不需要使用临时表。

```java
explain select key1,count(*) from s1 group by key1;
```

从type列的index值以及extra的using index的提示可以看出，上述查询使用了idx_key1索引就可以搞定了。
