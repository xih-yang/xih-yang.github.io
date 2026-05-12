# 07、MySQL 教程 - MySQL 索引的设计和使用
- 来源：https://ddkk.com/zhuanlan/db/mysql/7/7.html
- 分类：缓存数据库
- 分组：教程目录
索引是数据库中用来提高性能的最常用工具，下面简单介绍一下索引的类型和设计原则。

## 一、索引概述

常用引擎的索引方式

特点
MyISAM
InnoDB
MEMORY
MERGE

B树索引
支持（默认）
支持（默认）
支持
支持

哈希索引

支持（默认）

全文索引
支持

前缀索引
支持
支持

索引在创建表的时候可以同时创建，也可以随时增加新的索引，创建新索引的语法为：

**CREATE [UNIQUE|FULLTEXT|SPATIAL] INDEX index_name [USING index_type] ON tbl_name( col_name [(length)] [ASC|DESC])**

使用ALTER TABLE 语法来增加索引，与上面类似。

```java
mysql> create index cityname on city (city(10));
Query OK, 0 rows affected (0.03 sec)
Records: 0  Duplicates: 0  Warnings: 0
mysql> explain select * from city where city = 'FUzhou' \G;
*************************** 1. row ***************************
           id: 1
  select_type: SIMPLE
        table: city
   partitions: NULL
         type: ref
possible_keys: cityname
          key: cityname
      key_len: 32
          ref: const
         rows: 1
     filtered: 100.00
        Extra: Using where
1 row in set, 1 warning (0.00 sec)
```

删除索引的语法为：

**DROP INDEX index_name ON tbl_name**

```java
mysql> drop index cityname on city;
Query OK, 0 rows affected (0.01 sec)
Records: 0  Duplicates: 0  Warnings: 0
```

## 二、索引设计的原则

下面列出的是一些已有的原则，创建索引时尽量遵守以便提升效率。

- 最适合索引的列是出现在WHERE字句中的列，或连接字句中指定的列，而不是出现在SELECT关键字后选择列表中的列。
- 使用唯一索引；主要考虑索引列中值的唯一性，比如用生日列做索引搜索出来的结果往往比用性别做索引搜索出来的要好，因为性别不管搜索哪个值都会出来一半结果。
- 使用短索引；比如对较长字符串列进行索引，一般都是对一定长度的前缀进行索引，或是之前提到过的用散列值进行索引，这样有助于减少磁盘IO，节省空间及内存，加快查询速度。
- 不要过度索引；索引不是越多越好，每个索引都要占用额外的磁盘空间，并降低写操作的性能，而且每当表内容有变化时索引都要进行更新，从而使得花费时间更长；所以只保留所需索引才是最佳的。
- 对于InnoDB类型的表，如果有主键则按主键顺序保存；如果没有主键但有唯一索引，那么就按唯一索引的顺序保存；如果两个都没有，那就会按表中自动生成的内部列的顺序来保存。尽量定义主键，它的访问速度最快，而且一般用最常作为访问条件的列做主键，且需要选择较短的数据类型，这样做都是为了节省空间提高速度。

## 三、BTREE索引与HASH索引

MEMORY类型表同时支持BTREE索引和HASH索引，这两个索引也有一些不同的适应范围。

HASH索引需要注意：

- 只用于使用=或``操作符的等式比较；
- 优化器不能使用HASH索引来加速ORDER BY操作；
- 只能使用整个关键字来搜索一行；
- 不能确定两个值之间大约有多少行；

而BTREE索引就可以使用范围搜索和模糊搜索，并使用相关列上的索引。

看下面的例子：

```java
下列范围查找BTREE索引和HASH索引都适用：
select * from t1 where key_col=1,or key_col in (15,18,20);
下列范围查询只适合BTREE索引：
select * from t1 where key_col > 1 and key_col < 10;
select * from t1 where key_col like 'ab%' or key_col between 'lisa' and 'simon';
```

当我们创建一个MEMORY类型的表时，默认使用的是HASH索引，而此时如果对索引字段进行范围查找，此时的HASH没有起到作用，实际上还是进行的全表扫描；只有将其改为BTREE索引时才可以有效通过索引来提高效率。

因此，如果创建MEMORY表，就需要注意SQL语句的编写确保能使用上索引；如果一定要使用范围查询，那么应该创建成BTREE索引的表。
