# 14、MySQL 教程 - MySQL 分区
- 来源：https://ddkk.com/zhuanlan/db/mysql/7/14.html
- 分类：缓存数据库
- 分组：教程目录
分区是根据一定的规则把数据库中的一张表分解成多个更小的、更容易管理的部分，这些部分作为一个独立的对象可以存放在不同的地方。对于用户来说，访问表里的数据跟不分区没什么差别，但是对于数据库本身及其管理维护来说有很多好处：

- 和单个磁盘或者文件系统相比，分区可以存储更多的数据；
- 优化查询。在where字句中包含分区条件时，可以只扫描必要的一个或多个分区来提高查询效率；同时在涉及SUM() 和 COUNT()这类聚合函数的查询时，可以容易的在每个分区上并行处理，最终只需要汇总结果即可；
- 对于已经过期或者不需要保存的数据，可以删除与这些数据有关的分区来快速删除数据；
- 跨多个磁盘来分散数据查询，以获得更大的查询吞吐量。

## 一、分区概述

分区有利于管理非常大的表，将大表分区存储分成小块；查看当前MySQL是否支持分区：

```java
MySQL5.1版本开始支持分区功能，MySQL5.6版本之前使用以下命令查看是否支持分区
mysql> show variables like '%partition%';
+-----------------------+-------------+
| Variable_name         |   Value     |                                                                                
+-----------------------+-------------+
| have_partition_engine |   YES       |         YES表明支持分区
+-----------------------+-------------+
1 row in set (0.00 sec)
MySQL5.6及其之后的版本使用以下命令查看
mysql> show plugins;
+----------------------------+----------+--------------------+---------+---------+
| Name                       | Status   | Type               | Library | License |
+----------------------------+----------+--------------------+---------+---------+
| binlog                     | ACTIVE   | STORAGE ENGINE     | NULL    | GPL     |
| mysql_native_password      | ACTIVE   | AUTHENTICATION     | NULL    | GPL     |
| sha256_password            | ACTIVE   | AUTHENTICATION     | NULL    | GPL     |
| CSV                        | ACTIVE   | STORAGE ENGINE     | NULL    | GPL     |
| MEMORY                     | ACTIVE   | STORAGE ENGINE     | NULL    | GPL     |
| InnoDB                     | ACTIVE   | STORAGE ENGINE     | NULL    | GPL     |
| INNODB_TRX                 | ACTIVE   | INFORMATION SCHEMA | NULL    | GPL     |
| INNODB_LOCKS               | ACTIVE   | INFORMATION SCHEMA | NULL    | GPL     |
| INNODB_LOCK_WAITS          | ACTIVE   | INFORMATION SCHEMA | NULL    | GPL     |
| INNODB_CMP                 | ACTIVE   | INFORMATION SCHEMA | NULL    | GPL     |
| INNODB_CMP_RESET           | ACTIVE   | INFORMATION SCHEMA | NULL    | GPL     |
| INNODB_CMPMEM              | ACTIVE   | INFORMATION SCHEMA | NULL    | GPL     |
| INNODB_CMPMEM_RESET        | ACTIVE   | INFORMATION SCHEMA | NULL    | GPL     |
| INNODB_CMP_PER_INDEX       | ACTIVE   | INFORMATION SCHEMA | NULL    | GPL     |
| INNODB_CMP_PER_INDEX_RESET | ACTIVE   | INFORMATION SCHEMA | NULL    | GPL     |
| INNODB_BUFFER_PAGE         | ACTIVE   | INFORMATION SCHEMA | NULL    | GPL     |
| INNODB_BUFFER_PAGE_LRU     | ACTIVE   | INFORMATION SCHEMA | NULL    | GPL     |
| INNODB_BUFFER_POOL_STATS   | ACTIVE   | INFORMATION SCHEMA | NULL    | GPL     |
| INNODB_TEMP_TABLE_INFO     | ACTIVE   | INFORMATION SCHEMA | NULL    | GPL     |
| INNODB_METRICS             | ACTIVE   | INFORMATION SCHEMA | NULL    | GPL     |
| INNODB_FT_DEFAULT_STOPWORD | ACTIVE   | INFORMATION SCHEMA | NULL    | GPL     |
| INNODB_FT_DELETED          | ACTIVE   | INFORMATION SCHEMA | NULL    | GPL     |
| INNODB_FT_BEING_DELETED    | ACTIVE   | INFORMATION SCHEMA | NULL    | GPL     |
| INNODB_FT_CONFIG           | ACTIVE   | INFORMATION SCHEMA | NULL    | GPL     |
| INNODB_FT_INDEX_CACHE      | ACTIVE   | INFORMATION SCHEMA | NULL    | GPL     |
| INNODB_FT_INDEX_TABLE      | ACTIVE   | INFORMATION SCHEMA | NULL    | GPL     |
| INNODB_SYS_TABLES          | ACTIVE   | INFORMATION SCHEMA | NULL    | GPL     |
| INNODB_SYS_TABLESTATS      | ACTIVE   | INFORMATION SCHEMA | NULL    | GPL     |
| INNODB_SYS_INDEXES         | ACTIVE   | INFORMATION SCHEMA | NULL    | GPL     |
| INNODB_SYS_COLUMNS         | ACTIVE   | INFORMATION SCHEMA | NULL    | GPL     |
| INNODB_SYS_FIELDS          | ACTIVE   | INFORMATION SCHEMA | NULL    | GPL     |
| INNODB_SYS_FOREIGN         | ACTIVE   | INFORMATION SCHEMA | NULL    | GPL     |
| INNODB_SYS_FOREIGN_COLS    | ACTIVE   | INFORMATION SCHEMA | NULL    | GPL     |
| INNODB_SYS_TABLESPACES     | ACTIVE   | INFORMATION SCHEMA | NULL    | GPL     |
| INNODB_SYS_DATAFILES       | ACTIVE   | INFORMATION SCHEMA | NULL    | GPL     |
| INNODB_SYS_VIRTUAL         | ACTIVE   | INFORMATION SCHEMA | NULL    | GPL     |
| MyISAM                     | ACTIVE   | STORAGE ENGINE     | NULL    | GPL     |
| MRG_MYISAM                 | ACTIVE   | STORAGE ENGINE     | NULL    | GPL     |
| PERFORMANCE_SCHEMA         | ACTIVE   | STORAGE ENGINE     | NULL    | GPL     |
| ARCHIVE                    | ACTIVE   | STORAGE ENGINE     | NULL    | GPL     |
| BLACKHOLE                  | ACTIVE   | STORAGE ENGINE     | NULL    | GPL     |
| FEDERATED                  | DISABLED | STORAGE ENGINE     | NULL    | GPL     |
| partition                  | ACTIVE   | STORAGE ENGINE     | NULL    | GPL     |
| ngram                      | ACTIVE   | FTPARSER           | NULL    | GPL     |
+----------------------------+----------+--------------------+---------+---------+
44 rows in set (0.00 sec)
关键字partition的值为ACTIVE表明支持分区
```

MySQL支持MyISAM、InnoDB、Memory等存储引擎创建分区表，不支持MERGE、CSV存储引擎来创建分区表；另外，同一张表的不同分区存储引擎必须一致。指定引擎的语句（engine=innodb）必须在分区语句（partition by ...）之前。

## 二、分区类型

主要有以下几种：

- RANGE分区：分区的值是连续的，不间断；比如1~10，11~20，...
- LIST分区：分区的值是离散的、无序的；比如（1，3），（2，6），（4，5），......
- HASH分区：给定分区的个数，利用一定的规则将数据分到各个区中；
- KEY分区：类似于HASH分区；
- COLUMNS分区：MySQL5.5版本后新引入的，可细分为RANGE COLUMNS，LIST COLUMNS；主要解决的是RANGE分区和LIST分区只支持整型作为分区键的局限性；

RANGE分区
LIST分区
HASH分区
KEY分区
RANGE COLUMNS分区
LIST COLUMNS分区

分区键的类型
INT类型
INT类型
INT类型

除BLOB、TEXT类型

外的其它类型

整型、日期型、字符串型
整型、日期型、字符串型

分区键的选用
表中有主键或唯一键时必须选该列作为分区字段，如果没有则选择满足条件的即可

分区名
分区名字对大小写不敏感，不能用大小写来区分同一个分区名

有主键但是不用主键分区键时会报错：

```java
mysql> create table emp(id INT not null primary key,
                        ename varchar(30),
                        hired date not null default '1970-01-01',
                        separated date not null default '9999-12-31',
                        job varchar(30) not null,
                        store_id int not null) 
       partition by range (store_id) (
                   partition p0 values less than (10),
                   partition p1 values less than (20),
                   partition p2 values less than (30));
ERROR 1503 (HY000): A PRIMARY KEY must include all columns in the table's partitioning function
当去掉主键后就可成功创建
mysql> create table emp(id INT not null,
                        ename varchar(30),
                        hired date not null default '1970-01-01',
                        separated date not null default '9999-12-31',
                        job varchar(30) not null,
                        store_id int not null) 
       partition by range (store_id) (
                   partition p0 values less than (10),
                   partition p1 values less than (20),
                   partition p2 values less than (30));
Query OK, 0 rows affected (0.03 sec)
```

#### 2.1 Range分区

比如上面的的例子，成功创建了表emp，按照字段store_id进行分区，一共分为三个区，小于10的在p0区，10~19的在p1区，20~29的在p2区；区间要连续而且不能相互重叠。

但如果此时有一条大于30的数据插入，应该放在哪个区呢？，显然，这时候会出错，因为系统也不知道该把这个数据放到哪个区里：

```java
mysql> insert into emp values(1,'tom','1982-01-23','2001-02-03','clerk',50);
ERROR 1526 (HY000): Table has no partition for value 50
```

那这时候应该怎么办呢？增加一个分区，当值超过指定范围时都放入到该分区里面来：

```java
增加p3分区，操过p2分区最大值的数据将全放到该分区中
mysql> alter table emp add partition (partition p3 values less than maxvalue);
Query OK, 0 rows affected (0.03 sec)
Records: 0  Duplicates: 0  Warnings: 0
mysql> insert into emp values(1,'tom','1982-01-23','2001-02-03','clerk',50);
Query OK, 1 row affected (0.00 sec)
```

前面还提到Range分区的分区键必须是整型，比如上面的store_id是int，但并不绝对，你也可以使用表达式或函数来将一个不是整型的字段处理后返回一个整型，这样也可，比如：

```java
创建一个表emp_date，使用年份来分区
mysql> create table emp_date(id INT not null,
                             ename varchar(30),
                             hired date not null default '1970-01-01',
                             separated date not null default '9999-12-31',
                             job varchar(30) not null,
                             store_id int not null) 
       partition by range (YEAR(separated)) ( 
                             partition p0 values less than (1995),
                             partition p1 values less than (2000),
                             partition p2 values less than (2005));
Query OK, 0 rows affected (0.03 sec)
```

使用这样转换的方式可以达到效果，但也有缺陷，比如日期类型的数据只有YEAR()、MONTH()、TO_DAYS()、TO_SECONDS()等转换函数可用，如果在此之外无法转换的该怎么办呢？MySQL5.5版本之后提供了新的解决办法，使用RANGE COLUMNS分区，它支持多种类型作为分区键：

```java
mysql> drop table emp_date;
Query OK, 0 rows affected (0.01 sec)
mysql> create table emp_date(id INT not null,
                             ename varchar(30), 
                             hired date not null default '1970-01-01',
                             separated date not null default '9999-12-31',
                             job varchar(30) not null,
                             store_id int not null) 
       partition by range columns(separated) (
                             partition p0 values less than ('1996-01-01'),
                             partition p1 values less than ('2001-01-01'),
                             partition p2 values less than ('2006-01-01'));
Query OK, 0 rows affected (0.03 sec)
```

RANGE分区功能特别适合以下两种情况：

- 当需要删除过期的数据时，只需要用一个简单的删除分区语句就可以将某个日期前的分区删掉，这对于大表来说比用DELETE删除查询的数据要快很多；
- 经常运行包含分区键的查询，这样MySQL就可以只扫描包含该数据的分区，提高了效率；例如查emp表中store_id大于25的记录，MySQL只需扫描p2、p3分区即可：

```java
mysql> explain partitions select count(1) from emp where store_id >= 25 \G;
*************************** 1. row ***************************
           id: 1
  select_type: SIMPLE
        table: emp
   partitions: p2,p3
         type: ALL
possible_keys: NULL
          key: NULL
      key_len: NULL
          ref: NULL
         rows: 1
     filtered: 100.00
        Extra: Using where
1 row in set, 2 warnings (0.00 sec)
```

#### 2.2 LIST分区

LIST分区跟RANGE分区类似，只不过它用的是离散值，相当于枚举，如果数据不在分区的集合中，那么它就不在该分区，LIST分区不必声明特定的顺序：

```java
mysql> create table expenses(expense_date date not null,
                             category int,
                             amount decimal(10,3)) 
       partition by list(category) (
                             partition p0 values in (3,5),
                             partition p1 values in (1,10),
                             partition p2 values in (4,9),
                             partition p3 values in (2),
                             partition p4 values in (6));
Query OK, 0 rows affected (0.05 sec)
```

用LIST分区创建的表在插入数据时比如能在所有分区的集合中找得到，否则它就无法插入；它不存在像RANGE分区中那样定义一个maxvalue来囊括范围外的值。

同样，LIST分区的分区键只能是INT类型，如果想要用别的类型需使用LIST COLUMNS来创建：

```java
mysql> create table expenses(expense_date date not null,
                             category varchar(30),
                             amount decimal(10,3)) 
       partition by list columns (category) (
                             partition p0 values in ('lind','food'),
                             partition p1 values in ('fight','begin'),
                             partition p2 values in ('lisa','mon'),
                             partition p3 values in ('talk'),
                             partition p4 values in ('fees'));
Query OK, 0 rows affected (0.08 sec)
```

#### 2.3 Columns 分区

前面也介绍了一些该分区的相关内容，它主要解决的就是RANGE分区和LIST分区只支持整型作为分区键导致如果需要用别的类型时需要额外的函数计算得到整数或通过额外的转换表来转换为整数再分区的问题。

COLUMNS分区支持的数据类型：

- 所有整型：tinyint, smallint, mediumint, int, bigint；其它数值类型不支持，如Decimal和Float；
- 日期时间类型：date和datetime；
- 字符类型：char, varchar, binary, varbinary；不支持blob和text类型；

对比RANGE和LIST分区，COLUMNS分区除了支持的数据类型增加之外，它还支持多列划分，例如下面的例子：

```java
1. 创建表cr3，使用a，b两列作为分区键：
mysql> create table rc3(a int,b int) 
       partition by range columns (a,b) (
                 partition p01 values less than (0,10),
                 partition p02 values less than (10,10),
                 partition p03 values less than (10,20),
                 partition p04 values less than (10,35),
                 partition p05 values less than (10,maxvalue),
                 partition p06 values less than (maxvalue,maxvalue));
Query OK, 0 rows affected (0.11 sec)
2. 插入数据（1，10），可以看到插入到p02中去了
mysql> insert into rc3 values(1,10);
Query OK, 1 row affected (0.00 sec)
mysql> select partition_name part,partition_expression expr,partition_description descr,table_rows from information_schema.partitions where table_schema = schema() and table_name='rc3';
+------+---------+-------------------+------------+
| part | expr    | descr             | table_rows |
+------+---------+-------------------+------------+
| p01  | a,b | 0,10              |          0 |
| p02  | a,b | 10,10             |          1 |
| p03  | a,b | 10,20             |          0 |
| p04  | a,b | 10,35             |          0 |
| p05  | a,b | 10,MAXVALUE       |          0 |
| p06  | a,b | MAXVALUE,MAXVALUE |          0 |
+------+---------+-------------------+------------+
6 rows in set (0.00 sec)
3. 插入数据（10，9），可以看到也插入p02分区中了
mysql> insert into rc3 values(10,9);
Query OK, 1 row affected (0.00 sec)
mysql> select partition_name part,partition_expression expr,partition_description descr,table_rows from information_schema.partitions where table_schema = schema() and table_name='rc3';
+------+---------+-------------------+------------+
| part | expr    | descr             | table_rows |
+------+---------+-------------------+------------+
| p01  | a,b | 0,10              |          0 |
| p02  | a,b | 10,10             |          2 |
| p03  | a,b | 10,20             |          0 |
| p04  | a,b | 10,35             |          0 |
| p05  | a,b | 10,MAXVALUE       |          0 |
| p06  | a,b | MAXVALUE,MAXVALUE |          0 |
+------+---------+-------------------+------------+
6 rows in set (0.00 sec)
4. 插入数据（10，10），可以看到被插入p03中了
mysql> insert into rc3 values(10,10);
Query OK, 1 row affected (0.00 sec)
mysql> select partition_name part,partition_expression expr,partition_description descr,table_rows from information_schema.partitions where table_schema = schema() and table_name='rc3';
+------+---------+-------------------+------------+
| part | expr    | descr             | table_rows |
+------+---------+-------------------+------------+
| p01  | a,b | 0,10              |          0 |
| p02  | a,b | 10,10             |          2 |
| p03  | a,b | 10,20             |          1 |
| p04  | a,b | 10,35             |          0 |
| p05  | a,b | 10,MAXVALUE       |          0 |
| p06  | a,b | MAXVALUE,MAXVALUE |          0 |
+------+---------+-------------------+------------+
6 rows in set (0.00 sec)
```

总结：这种分区键的比较其实就是多列排序，先根据a字段排序，再根据b字段排序；(a, b)插入到哪个分区时它是这么比较的：先判断p01分区 (a  alter table emp_date drop partition p2;
 Query OK, 0 rows affected (0.02 sec)
 Records: 0  Duplicates: 0  Warnings: 0
mysql> alter table expenses drop partition p3;
 Query OK, 0 rows affected (0.02 sec)
 Records: 0  Duplicates: 0  Warnings: 0

检查发现无论是表结构还是数据均被删除了

mysql> show create table emp_date \G
 *************************** 1. row ***************************
        Table: emp_date
 Create Table: CREATE TABLE `emp_date` (
   `id` int(11) NOT NULL,
   `ename` varchar(30) DEFAULT NULL,
   `hired` date NOT NULL DEFAULT '1970-01-01',
   `separated` date NOT NULL DEFAULT '9999-12-31',
   `job` varchar(30) NOT NULL,
   `store_id` int(11) NOT NULL
 ) ENGINE=InnoDB DEFAULT CHARSET=utf8
 /*!50100 PARTITION BY RANGE (YEAR(separated))
 (PARTITION p0 VALUES LESS THAN (1995) ENGINE = InnoDB,
  PARTITION p1 VALUES LESS THAN (2000) ENGINE = InnoDB,
  PARTITION p3 VALUES LESS THAN (2015) ENGINE = InnoDB) */
 1 row in set (0.00 sec)

mysql> select * from emp_date where separated between '2000-01-01'

and '2004-12-31';
 Empty set (0.00 sec)

mysql> show create table expenses \G
 *************************** 1. row ***************************
        Table: expenses
 Create Table: CREATE TABLE `expenses` (
   `expense_date` date NOT NULL,
   `category` int(11) DEFAULT NULL,
   `amount` decimal(10,3) DEFAULT NULL
 ) ENGINE=InnoDB DEFAULT CHARSET=utf8
 /*!50100 PARTITION BY LIST (category)
 (PARTITION p0 VALUES IN (3,5) ENGINE = InnoDB,
  PARTITION p1 VALUES IN (1,10) ENGINE = InnoDB,
  PARTITION p2 VALUES IN (4,9) ENGINE = InnoDB,
  PARTITION p4 VALUES IN (6) ENGINE = InnoDB) */
 1 row in set (0.01 sec)

当删除p2分区后插入一条原本应该放在p2分区的数据，

发现此时存放在p3分区了，这说明了**range分区哪怕删除一个也还要保持分区的连续性**

mysql> select * from emp_date where separated between

'2000-01-01' and '2004-12-31';
 Empty set (0.00 sec)

mysql> select partition_name part,partition_expression expr,

partition_description descr,table_rows from

information_schema.partitions where table_schema = schema()

and table_name='emp_date';
 +------+-----------------+-------+------------+
 | part | expr            | descr | table_rows |
 +------+-----------------+-------+------------+
 | p0   | YEAR(separated) | 1995  |          0 |
 | p1   | YEAR(separated) | 2000  |          0 |
 | p3   | YEAR(separated) | 2015  |          7 |
 +------+-----------------+-------+------------+
 3 rows in set (0.00 sec)

mysql> insert into emp_date values

(7566,'jons','1981-04-02','2000-08-01','manager',20);
 Query OK, 1 row affected (0.00 sec)

mysql> select partition_name part,

partition_expression expr,partition_description descr,

table_rows from information_schema.partitions

where table_schema = schema() and table_name='emp_date';
 +------+-----------------+-------+------------+
 | part | expr            | descr | table_rows |
 +------+-----------------+-------+------------+
 | p0   | YEAR(separated) | 1995  |          0 |
 | p1   | YEAR(separated) | 2000  |          0 |
 | p3   | YEAR(separated) | 2015  |          8 |
 +------+-----------------+-------+------------+
 3 rows in set (0.00 sec)

当list分区的p3区被删除后，原来能插入数值2，现在不可以了

增加分区

ALTER TABLE ADD PARTITION

增加p4分区，注意只能从分区列表的最大端增加，比如

这里增加的2030是大于2015的，所以能够成功

mysql> alter table emp_date add partition (partition p4 values less than (2030));
 Query OK, 0 rows affected (0.02 sec)
 Records: 0  Duplicates: 0  Warnings: 0

增加p5分区，注意增加的值不能在原有分区上出现过；

比如这里的7、8都没有在原有分区上出现过，所以能成功

mysql> alter table expenses add partition (partition p5 values in (7,8));
 Query OK, 0 rows affected (0.02 sec)
 Records: 0  Duplicates: 0  Warnings: 0

拆分分区

ALTER TABLE REORGANIZE

PARTITION INTO

将p3分区(2000~2015)拆分为p2(2000~2005)分区和p3(2005~2015)分区

mysql> alter table emp_date reorganize partition p3 into (

partition p2 values less than (2005),

partition p3 values less than (2015));
 Query OK, 0 rows affected (0.06 sec)
 Records: 0  Duplicates: 0  Warnings: 0

将p2分区(4,9)拆分为p2(4)分区和p3(9)分区

mysql> alter table expenses reorganize partition

p2 into (partition p2 values in (4),

partition p3 values in (9));
 Query OK, 0 rows affected (0.05 sec)
 Records: 0  Duplicates: 0  Warnings: 0

合并分区

ALTER TABLE REORGANIZE

PARTITION INTO

将p1、p2、p3三个分区合并为一个分区p1(1995~2015)

mysql> alter table emp_date reorganize partition p1,p2,p3 into (partition p1 values less than (2015));
 Query OK, 0 rows affected (0.04 sec)
 Records: 0  Duplicates: 0  Warnings: 0

将p3分区(9)和p4分区(6)合并为p3分区(9,6)

mysql> alter table expenses reorganize partition p3,p4 into (partition p3 values in (9,6));
 Query OK, 0 rows affected (0.04 sec)
 Records: 0  Duplicates: 0  Warnings: 0

**注意：**重新定义分区时（拆分、合并），只能够定义

相邻的分区，并且拆分或合并前后分区的覆盖区间应

相同且连续；另外，不能通过重定义分区来更改分

区的类型，例如不可将range分区变为hash分区。

**注意：**重新定义分区时(拆分、合并)，只能够定义

相邻的分区，并且拆分或合并前后分区的覆盖区间应相同；另外，不能通过重定义分区来更改分

区的类型，例如不可将list分区变为hash分区。

无法在原有分区上增加值的范围，比如想在p2分区(2000~2005)上将范围扩大是不可以的，但想在p4分区(2015~2030)上将范围扩大是可行的；连续性要求
单纯的使用add语句将p4 (6)调增为p4 (6,11)是不可行的，但可以通过新增分区然后再合并的方式来达到这样的目的。

#### 3.2 HASH & KEY 分区管理

在改变分区设置方面，HASH分区和KEY分区非常类似。

准备一个HASH分区表，分为4个区：

```java
create table emp(id INT not null,
                        ename varchar(30),
                        hired date not null default '1970-01-01',
                        separated date not null default '9999-12-31',
                        job varchar(30) not null,
                        store_id int not null) 
       partition by hash (store_id) partitions 4;
```

删除两个分区（其实也可以理解为修改、合并），原有的4个分区变为2个：** ALTER TABLE COALESCE PARTITION**

```java
mysql> alter table emp coalesce partition 2;
Query OK, 0 rows affected (0.07 sec)
Records: 0  Duplicates: 0  Warnings: 0
mysql> show create table emp \G
*************************** 1. row ***************************
       Table: emp
Create Table: CREATE TABLE emp (
  id int(11) NOT NULL,
  ename varchar(30) DEFAULT NULL,
  hired date NOT NULL DEFAULT '1970-01-01',
  separated date NOT NULL DEFAULT '9999-12-31',
  job varchar(30) NOT NULL,
  store_id int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8
/*!50100 PARTITION BY HASH (store_id)
PARTITIONS 2 */
1 row in set (0.01 sec)
```

增加分区**ALTER TABLE ADD PARTITION**：

```java
mysql> alter table emp add partition partitions 8;
Query OK, 0 rows affected (0.12 sec)
Records: 0  Duplicates: 0  Warnings: 0
mysql> show create table emp \G
*************************** 1. row ***************************
       Table: emp
Create Table: CREATE TABLE emp (
  id int(11) NOT NULL,
  ename varchar(30) DEFAULT NULL,
  hired date NOT NULL DEFAULT '1970-01-01',
  separated date NOT NULL DEFAULT '9999-12-31',
  job varchar(30) NOT NULL,
  store_id int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8
/*!50100 PARTITION BY HASH (store_id)
PARTITIONS 10 */
1 row in set (0.00 sec)
```

注意：删除分区是在原有的基础上删除n个，比如上面的例子原有4个分区，删除了两个还剩2个分区；增加分区是在原有基础上增加n个，比如上面的例子在原有2个分区的基础上增加8个分区，因此一共有10个分区了。
