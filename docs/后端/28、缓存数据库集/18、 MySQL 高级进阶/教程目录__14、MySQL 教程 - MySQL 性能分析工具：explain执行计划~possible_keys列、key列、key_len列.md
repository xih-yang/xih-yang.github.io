# 14、MySQL 教程 - MySQL 性能分析工具：explain执行计划~possible_keys列、key列、key_len列
- 来源：https://ddkk.com/zhuanlan/db/mysql/6/14.html
- 分类：缓存数据库
- 分组：教程目录
### 数据准备

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
```

### 1. possible_keys列、key列

在explain语句输出的执行计划中，possible_keys列表示在某个查询语句中，对某个表执行单表查询时可能用到的索引又哪些；key列表示实际用到的索引有哪些。

```java
explain select * from s1 where key1>'z' and key3='a';
```

在上述执行计划的possible_keys列的值是idx_key1，idx_key3，表示查询可能使用的值是idx_key1和idx_key3这两个索引，然后key的值是idx_key3，表示经过查询优化器计算不同索引的使用成本后，最后决定使用idx_key3来执行查询（又因为它比较划算）。

possible_keys列中的值并不是越多越好，可以使用的索引越多，查询优化器在计算查询成本时花费的时间越长，如果可以的话，尽量删除那些用不到的索引。

因此可以通过explain执行计划中的key列来判断查询语句是否使用了索引。

### 2. key_len列

**示例1：**

```java
explain select * from s1 where key1>'a' and key1<'b';
```

执行计划的key_len列的值为303，这个303是怎么来的呢?

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

key_len由3部分组成：

(1)该列的实际数据最多占用的存储空间长度。

- 对于使用固定长度的列来说，比如int类型，该列实际数据最多占用的存储空间长度为4字节。
- 对于使用变长类型的列来说，比方说对于使用utf8字符集，类型为varchar(100)的列来说，该列的实际数据最多占用的存储空间长度为**在utf8字符集中表示一个字符最多占用的字节数**乘以**该类型最多可以存储的字符数**的积，即3*100=300。

(2)如果该列可以存储null值，在该列的实际数据最多占用的存储空间长度的基础上再加1字节。

(3)对于使用变长类型的列来说，都会有2字节的空间来存储该列的实际数据占用的存储空间长度，因此key_len还要在原先的基础上再加上2字节。

这样的话，再来分析一下key_len值是怎么来的？

- key1列的类型是varchar(100)，使用的字符集是utf8，所以该列的实际数据最多占用的存储空间长度就是300字节。
- key1列可以存储null值，所以key_len值在300的基础上再加1，也就是301。
- key1列是变长类型的列，key_len值在301的基础上再加2，也就是303。

通过执行计划的key列是idx_key1，所以知道该查询使用idx_key1来执行的，在看执行计划的key_len列，发现是303，说明形成扫描区间的搜索条件只包含key1列这一个列。

**示例2：**

```java
explain select * from s1 where id='10003';
```

由于id列的类型是int，并且不允许存储null值，因此该列对应的key_len值就是4。

**示例3：**

key_len列的作用主要是为了让我们在使用联合索引执行查询时，能知道优化器具体使用了涉及多少个列的搜索条件来充当扫描区间的边界条件。比如下面这个使用联合索引idx_key_part的查询：

```java
explain select * from s1 where  key_part1='a' and key_part3='a';
```

通过执行计划可以看出key_len的值为303，这意味着MySQL在执行上述查询时只使用了联合索引中的key_part1列来充当扫描区间的边界条件。即仅使用key_part1='a’来充当边界条件。

```java
explain select * from s1 where  key_part1='a' and key_part2='a';
```

这个查询的执行计划的key_len列的值是606，这意味着MySQL在执行上述查询时通过涉及key_part1和key_part2这两个列的搜索条件来充当形成扫描区间的边界条件，即使用key_part1=‘a’ and key_part2='a’来充当边界条件。
