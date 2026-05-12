# 12、MySQL 调优 - MySQL分区表
- 来源：https://ddkk.com/zhuanlan/db/mysql/3/12.html
- 分类：缓存数据库
- 分组：教程目录
备注:测试数据库版本为MySQL 8.0

## 一.分区表简介

在MySQL 8.0中，分区支持由InnoDB和NDB存储引擎提供。

InnoDB存储引擎不可能禁用分区支持。

SQL标准没有提供太多关于数据存储的物理方面的指导。SQL语言本身的目的是独立于它所使用的模式、表、行或列的任何数据结构或媒体。尽管如此，大多数高级数据库管理系统已经发展出一些方法来确定用于存储特定数据块的物理位置(包括文件系统、硬件甚至两者)。在MySQL中，InnoDB存储引擎长期以来一直支持表空间的概念，甚至在引入分区之前，MySQL服务器可以配置为使用不同的物理目录来存储不同的数据库。

分区使这个概念更进一步，它允许您根据可以根据需要设置的规则在文件系统中分布单个表的各个部分。实际上，一个表的不同部分作为单独的表存储在不同的位置。用户选择的用于完成数据划分的规则被称为分区函数，在MySQL中可以是模数、针对一组范围或值列表的简单匹配、一个内部哈希函数或一个线性哈希函数。该函数根据用户指定的分区类型选择，并将用户提供的表达式的值作为其参数。这个表达式可以是一个列值、作用于一个或多个列值的函数，或者一个或多个列值的集合，具体取决于所使用的分区类型。

**分区的原理**

分区表由多个相关的底层表实现，这些底层表也是由句柄对象（Handler object）表示，所以我们也可以直接访问各个分区。存储引擎管理分区的各个底层表和管理普通表一样（所有的底层表都必须使用相同的存储引擎），分区表的索引只是在各个底层表上各自加上一个完全相同的索引。从存储引擎的角度来看，底层表和一个普通表没有任何不同，存储引擎也无须知道这是一个普通表还是一个分区表的一部分。

分区表上的操作按照下面的操作逻辑进行：

**1、** SELECT查询；

当查询一个分区表的时候，分区层先打开并锁住所有的底层表，优化器先判断是否可以过滤部分分区，然后再调用对应的存储引擎接口访问各个分区的数据。

**2、** INSERT操作；

当写入一条记录时，分区层先打开并锁住所有的底层表，然后确定哪个分区接收这条记录，再将记录写入对应底层表。

**3、** DELETE操作；

当删除一条记录时，分区层先打开并锁住所有的底层表，然后确定数据对应的分区，最后对相应底层表进行删除操作。

**4、** UPDATE操作；

当更新一条记录时，分区层先打开并锁住所有的底层表，MySQL先确定需要更新的记录在哪个分区，然后取出数据并更新，再判断更新后的数据应该放在哪个分区，最后对底层表进行写入操作，并对原数据所在的底层表进行删除操作。

## 二.分区的类型

### 2.1 range分区

按范围进行分区的表的分区方式是，每个分区包含分区表达式值位于给定范围内的行。范围应该是连续的，但不能重叠，并且使用VALUES LESS THAN操作符定义。在接下来的几个示例中，假设您正在创建一个表，如下面所示，用于保存20个视频商店(编号从1到20)的人员记录:

```java
CREATE TABLE employees (
    id INT NOT NULL,
    fname VARCHAR(30),
    lname VARCHAR(30),
    hired DATE NOT NULL DEFAULT '1970-01-01',
    separated DATE NOT NULL DEFAULT '9999-12-31',
    job_code INT NOT NULL,
    store_id INT NOT NULL
);
```

根据您的需要，可以以多种方式按范围对该表进行分区。一种方法是使用store_id列。例如，你可以通过添加一个partition by RANGE子句来对表进行分区，如下所示:

```java
CREATE TABLE employees (
    id INT NOT NULL,
    fname VARCHAR(30),
    lname VARCHAR(30),
    hired DATE NOT NULL DEFAULT '1970-01-01',
    separated DATE NOT NULL DEFAULT '9999-12-31',
    job_code INT NOT NULL,
    store_id INT NOT NULL
)
PARTITION BY RANGE (store_id) (
    PARTITION p0 VALUES LESS THAN (6),
    PARTITION p1 VALUES LESS THAN (11),
    PARTITION p2 VALUES LESS THAN (16),
    PARTITION p3 VALUES LESS THAN (21)
);
```

在这个分区方案中，零售店1到5的员工对应的所有行存储在分区p0中，零售店6到10的员工对应的所有行存储在分区p1中，以此类推。每个分区都按从低到高的顺序定义。这是PARTITION BY RANGE语法的要求;你可以把它想象成一系列if…elseif……在C或Java中。

很容易确定一个包含数据(72，‘Mitchell’， ‘Wilson’， ‘1998-06-25’， NULL, 13)的新行被插入到分区p2中，但是当您的链添加了第21个存储时会发生什么?在这种模式下，没有任何规则涵盖store_id大于20的行，因此会出现错误，因为服务器不知道将它放在哪里。你可以通过在CREATE TABLE语句中使用“catchall”VALUES LESS THAN子句来避免这种情况的发生，该子句提供所有大于显式命名的最大值的值:

```java
CREATE TABLE employees (
    id INT NOT NULL,
    fname VARCHAR(30),
    lname VARCHAR(30),
    hired DATE NOT NULL DEFAULT '1970-01-01',
    separated DATE NOT NULL DEFAULT '9999-12-31',
    job_code INT NOT NULL,
    store_id INT NOT NULL
)
PARTITION BY RANGE (store_id) (
    PARTITION p0 VALUES LESS THAN (6),
    PARTITION p1 VALUES LESS THAN (11),
    PARTITION p2 VALUES LESS THAN (16),
    PARTITION p3 VALUES LESS THAN MAXVALUE
);
```

MAXVALUE表示一个总是大于最大可能整数值的整数值(在数学语言中，它充当最小上界)。现在，任何store_id列值大于或等于16(定义的最高值)的行都存储在分区p3中。在将来的某个时候—当存储的数量增加到25、30或更多时，您可以使用ALTER TABLE语句为存储21-25、26-30等添加新分区。

您可以以非常相似的方式基于员工工作代码(即基于job_code列值的范围)对表进行分区。例如，假设两位数的工作代码用于普通(店内)工人，三位数的工作代码用于办公室和支持人员，四位数的工作代码用于管理岗位，您可以使用以下语句创建分区表:

```java
CREATE TABLE employees (
    id INT NOT NULL,
    fname VARCHAR(30),
    lname VARCHAR(30),
    hired DATE NOT NULL DEFAULT '1970-01-01',
    separated DATE NOT NULL DEFAULT '9999-12-31',
    job_code INT NOT NULL,
    store_id INT NOT NULL
)
PARTITION BY RANGE (job_code) (
    PARTITION p0 VALUES LESS THAN (100),
    PARTITION p1 VALUES LESS THAN (1000),
    PARTITION p2 VALUES LESS THAN (10000)
);
```

在本例中，与店内工人有关的所有行存储在分区p0中，与办公室和后勤人员有关的行存储在分区p1中，与经理有关的行存储在分区p2中。

也可以在VALUES LESS THAN子句中使用表达式。然而，MySQL必须能够计算表达式的返回值作为LESS THAN(=num:；

SetV = V / 2

SetN = N & (V - 1)

假设使用线性哈希分区的表t1有6个分区，使用下面的语句创建:

```java
CREATE TABLE t1 (col1 INT, col2 CHAR(5), col3 DATE)
    PARTITION BY LINEAR HASH( YEAR(col3) )
    PARTITIONS 6;
```

现在假设您想要在t1中插入两个col3列值’2003-04-14’和’1998-10-19’的记录。其中第一个的分区号如下所示:

```java
V = POWER(2, CEILING( LOG(2,6) )) = 8
N = YEAR('2003-04-14') & (8 - 1)
   = 2003 & 7
   = 3
(3 >= 6 is FALSE: record stored in partition3)
```

存储第二个记录的分区编号如下所示:

```java
V = 8
N = YEAR('1998-10-19') & (8 - 1)
  = 1998 & 7
  = 6
(6 >= 6 is TRUE: additional step required)
N = 6 & ((8 / 2) - 1)
  = 6 & 3
  = 2
(2 >= 6 is FALSE: record stored in partition2)
```

通过线性散列进行分区的优点是，添加、删除、合并和分割分区的速度要快得多，这在处理包含大量(tb)数据的表时是有益的。缺点是，与使用常规哈希分区获得的分布相比，数据不太可能均匀地分布在分区之间。

### 2.5 key 分区

按键分区类似于按哈希分区，除了哈希分区使用用户定义的表达式外，MySQL服务器提供了用于键分区的哈希函数。NDB集群使用MD5()用于此目的;对于使用其他存储引擎的表，服务器使用它自己的内部散列函数。

CREATE TABLE的语法规则…PARTITION BY KEY类似于创建hash分区的表。这里列出了主要的区别:

**1、** 使用KEY而不是HASH；

**2、** KEY只接受一个包含0个或多个列名的列表如果表有主键，用作分区键的任何列必须包含表的部分或全部主键如果没有指定列名作为分区键，则使用表的主键(如果有主键)例如，下面的CREATETABLE语句在MySQL8.0中是有效的:；

```java
CREATE TABLE k1 (
    id INT NOT NULL PRIMARY KEY,
    name VARCHAR(20)
)
PARTITION BY KEY()
PARTITIONS 2;
```

如果没有主键，但是有一个唯一键，那么这个唯一键将用于分区键:

```java
CREATE TABLE k1 (
    id INT NOT NULL,
    name VARCHAR(20),
    UNIQUE KEY (id)
)
PARTITION BY KEY()
PARTITIONS 2;
```

但是，如果唯一键列没有定义为not NULL，那么前面的语句将失败。

在这两种情况下，分区键都是id列，即使它没有显示在SHOW CREATE TABLE的输出中或INFORMATION_SCHEMA的PARTITION_EXPRESSION列中。分区表。

与其他分区类型的情况不同，KEY分区使用的列不限于整数或NULL值。例如，下面的CREATE TABLE语句是有效的:

```java
CREATE TABLE tm1 (
    s1 CHAR(32) PRIMARY KEY
)
PARTITION BY KEY(s1)
PARTITIONS 10;
```

如果要指定的是不同的分区类型，那么前面的语句将无效。(在这种情况下，简单地使用PARTITION BY KEY()也是有效的，并且具有与PARTITION BY KEY(s1)相同的效果，因为s1是表的主键。)

分区键不支持带索引前缀的列。这意味着CHAR、VARCHAR、BINARY和VARBINARY列可以在分区键中使用，只要它们不使用前缀;因为必须在索引定义中为BLOB和TEXT列指定前缀，所以不可能在分区键中使用这两种类型的列。在MySQL 8.0.21之前，在创建、修改或升级分区表时允许使用前缀的列，即使它们不包括在表的分区键中;在MySQL 8.0.21及更高版本中，不赞成这种允许的行为，当使用一个或多个这样的列时，服务器会显示适当的警告或错误。有关更多信息和示例，请参见键分区不支持的列索引前缀。

也可以通过线性键对表进行分区。这里有一个简单的例子:

```java
CREATE TABLE tk (
    col1 INT NOT NULL,
    col2 CHAR(5),
    col3 DATE
)
PARTITION BY LINEAR KEY (col1)
PARTITIONS 3;
```

### 2.6 子分区

分区—也称为复合分区—是对分区表中的每个分区的进一步划分。考虑下面的CREATE TABLE语句:

```java
CREATE TABLE ts (id INT, purchased DATE)
    PARTITION BY RANGE( YEAR(purchased) )
    SUBPARTITION BY HASH( TO_DAYS(purchased) )
    SUBPARTITIONS 2 (
        PARTITION p0 VALUES LESS THAN (1990),
        PARTITION p1 VALUES LESS THAN (2000),
        PARTITION p2 VALUES LESS THAN MAXVALUE
    );
```

表ts有3个RANGE分区。每个分区(p0、p1和p2)被进一步划分为2个子分区。实际上，整个表被划分为3 * 2 = 6个分区。但是，由于PARTITION BY RANGE子句的作用，前2条只在购买的列中存储值小于1990的记录。

可以对由RANGE或LIST分区的表进行子分区。子分区可以使用HASH或KEY分区。这也被称为复合分割。

也可以显式地定义子分区，使用SUBPARTITION子句来指定单个子分区的选项。例如，创建与上一个示例中相同的表ts的更详细方式是:

```java
CREATE TABLE ts (id INT, purchased DATE)
    PARTITION BY RANGE( YEAR(purchased) )
    SUBPARTITION BY HASH( TO_DAYS(purchased) ) (
        PARTITION p0 VALUES LESS THAN (1990) (
            SUBPARTITION s0,
            SUBPARTITION s1
        ),
        PARTITION p1 VALUES LESS THAN (2000) (
            SUBPARTITION s2,
            SUBPARTITION s3
        ),
        PARTITION p2 VALUES LESS THAN MAXVALUE (
            SUBPARTITION s4,
            SUBPARTITION s5
        )
    );
```

这里列出了一些句法上的注意事项:

**1、** 每个分区必须有相同数量的子分区；

**2、** 如果在已分区表的任何分区上使用SUBPARTITION显式定义任何子分区，则必须定义所有子分区换句话说，下面的语句失败了:；

```java
CREATE TABLE ts (id INT, purchased DATE)
    PARTITION BY RANGE( YEAR(purchased) )
    SUBPARTITION BY HASH( TO_DAYS(purchased) ) (
        PARTITION p0 VALUES LESS THAN (1990) (
            SUBPARTITION s0,
            SUBPARTITION s1
        ),
        PARTITION p1 VALUES LESS THAN (2000),
        PARTITION p2 VALUES LESS THAN MAXVALUE (
            SUBPARTITION s2,
            SUBPARTITION s3
        )
    );
```

即使使用SUBPARTITIONS 2，这个语句仍然会失败。

**1、** 每个SUBPARTITION子句必须(至少)包含子分区的名称否则，您可以为子分区设置任何想要的选项，或者允许它为该选项设置默认设置；

**2、** 子分区名在整个表中必须是唯一的例如，下面的CREATETABLE语句是有效的:；

```java
CREATE TABLE ts (id INT, purchased DATE)
    PARTITION BY RANGE( YEAR(purchased) )
    SUBPARTITION BY HASH( TO_DAYS(purchased) ) (
        PARTITION p0 VALUES LESS THAN (1990) (
            SUBPARTITION s0,
            SUBPARTITION s1
        ),
        PARTITION p1 VALUES LESS THAN (2000) (
            SUBPARTITION s2,
            SUBPARTITION s3
        ),
        PARTITION p2 VALUES LESS THAN MAXVALUE (
            SUBPARTITION s4,
            SUBPARTITION s5
        )
    );
```

### 2.7 MySQL分区如何处理null值

MySQL中的分区不允许将NULL作为分区表达式的值，无论是列值还是用户提供的表达式的值。即使允许使用NULL作为表达式的值，否则必须产生一个整数，重要的是要记住NULL不是一个数字。MySQL的分区实现将NULL视为比任何非NULL值都要小，就像ORDER BY那样。

这意味着不同类型的分区之间对NULL的处理是不同的，如果没有准备好，可能会产生意想不到的行为。

使用RANGE分区处理NULL。如果向按RANGE分区的表中插入一行，使用于确定分区的列值为NULL，则将该行插入到最低的分区中。在一个名为p的数据库中考虑这两个表，创建方法如下:

```java
mysql> CREATE TABLE t1 (
    ->     c1 INT,
    ->     c2 VARCHAR(20)
    -> )
    -> PARTITION BY RANGE(c1) (
    ->     PARTITION p0 VALUES LESS THAN (0),
    ->     PARTITION p1 VALUES LESS THAN (10),
    ->     PARTITION p2 VALUES LESS THAN MAXVALUE
    -> );
Query OK, 0 rows affected (0.09 sec)
mysql> CREATE TABLE t2 (
    ->     c1 INT,
    ->     c2 VARCHAR(20)
    -> )
    -> PARTITION BY RANGE(c1) (
    ->     PARTITION p0 VALUES LESS THAN (-5),
    ->     PARTITION p1 VALUES LESS THAN (0),
    ->     PARTITION p2 VALUES LESS THAN (10),
    ->     PARTITION p3 VALUES LESS THAN MAXVALUE
    -> );
Query OK, 0 rows affected (0.09 sec)
```

你可以看到这两个CREATE TABLE语句在INFORMATION_SCHEMA数据库的partitions表中创建的分区:

```java
mysql> SELECT TABLE_NAME, PARTITION_NAME, TABLE_ROWS, AVG_ROW_LENGTH, DATA_LENGTH
     >   FROM INFORMATION_SCHEMA.PARTITIONS
     >   WHERE TABLE_SCHEMA = 'p' AND TABLE_NAME LIKE 't_';
+------------+----------------+------------+----------------+-------------+
| TABLE_NAME | PARTITION_NAME | TABLE_ROWS | AVG_ROW_LENGTH | DATA_LENGTH |
+------------+----------------+------------+----------------+-------------+
| t1         | p0             |          0 |              0 |           0 |
| t1         | p1             |          0 |              0 |           0 |
| t1         | p2             |          0 |              0 |           0 |
| t2         | p0             |          0 |              0 |           0 |
| t2         | p1             |          0 |              0 |           0 |
| t2         | p2             |          0 |              0 |           0 |
| t2         | p3             |          0 |              0 |           0 |
+------------+----------------+------------+----------------+-------------+
7 rows in set (0.00 sec)
```

现在，让我们用一个单独的行填充这些表，其中包含一个空的列作为分区键，并验证行插入使用一对SELECT语句:

```java
mysql> INSERT INTO t1 VALUES (NULL, 'mothra');
Query OK, 1 row affected (0.00 sec)
mysql> INSERT INTO t2 VALUES (NULL, 'mothra');
Query OK, 1 row affected (0.00 sec)
mysql> SELECT * FROM t1;
+------+--------+
| id   | name   |
+------+--------+
| NULL | mothra |
+------+--------+
1 row in set (0.00 sec)
mysql> SELECT * FROM t2;
+------+--------+
| id   | name   |
+------+--------+
| NULL | mothra |
+------+--------+
1 row in set (0.00 sec)
```

通过对INFORMATION_SCHEMA重新运行前面的查询，可以看到使用了哪些分区来存储插入的行。分区和检查输出:

```java
mysql> SELECT TABLE_NAME, PARTITION_NAME, TABLE_ROWS, AVG_ROW_LENGTH, DATA_LENGTH
     >   FROM INFORMATION_SCHEMA.PARTITIONS
     >   WHERE TABLE_SCHEMA = 'p' AND TABLE_NAME LIKE 't_';
+------------+----------------+------------+----------------+-------------+
| TABLE_NAME | PARTITION_NAME | TABLE_ROWS | AVG_ROW_LENGTH | DATA_LENGTH |
+------------+----------------+------------+----------------+-------------+
| t1         | p0             |          1 |             20 |          20 |
| t1         | p1             |          0 |              0 |           0 |
| t1         | p2             |          0 |              0 |           0 |
| t2         | p0             |          1 |             20 |          20 |
| t2         | p1             |          0 |              0 |           0 |
| t2         | p2             |          0 |              0 |           0 |
| t2         | p3             |          0 |              0 |           0 |
+------------+----------------+------------+----------------+-------------+
7 rows in set (0.01 sec)
```

您还可以通过删除这些分区来演示这些行存储在每个表的最低编号分区中，然后重新运行SELECT语句:

```java
mysql> ALTER TABLE t1 DROP PARTITION p0;
Query OK, 0 rows affected (0.16 sec)
mysql> ALTER TABLE t2 DROP PARTITION p0;
Query OK, 0 rows affected (0.16 sec)
mysql> SELECT * FROM t1;
Empty set (0.00 sec)
mysql> SELECT * FROM t2;
Empty set (0.00 sec)
```

对于使用SQL函数的分区表达式，也会以这种方式处理NULL。假设我们使用CREATE table语句定义一个表，如下所示:

```java
CREATE TABLE tndate (
    id INT,
    dt DATE
)
PARTITION BY RANGE( YEAR(dt) ) (
    PARTITION p0 VALUES LESS THAN (1990),
    PARTITION p1 VALUES LESS THAN (2000),
    PARTITION p2 VALUES LESS THAN MAXVALUE
);
```

与其他MySQL函数一样，YEAR(NULL)返回NULL。dt列值为NULL的行被视为分区表达式的值小于任何其他值，因此被插入到分区p0。

使用LIST分区处理NULL。当且仅当一个分区使用包含NULL的值列表定义时，LIST分区的表允许NULL值。与之相反的是，LIST分区的表如果在值列表中没有显式地使用NULL，就会拒绝导致分区表达式的值为NULL的行，如下例所示:

```java
mysql> CREATE TABLE ts1 (
    ->     c1 INT,
    ->     c2 VARCHAR(20)
    -> )
    -> PARTITION BY LIST(c1) (
    ->     PARTITION p0 VALUES IN (0, 3, 6),
    ->     PARTITION p1 VALUES IN (1, 4, 7),
    ->     PARTITION p2 VALUES IN (2, 5, 8)
    -> );
Query OK, 0 rows affected (0.01 sec)
mysql> INSERT INTO ts1 VALUES (9, 'mothra');
ERROR 1504 (HY000): Table has no partition for value 9
mysql> INSERT INTO ts1 VALUES (NULL, 'mothra');
ERROR 1504 (HY000): Table has no partition for value NULL
```

只有c1值在0到8之间的行可以插入到ts1中。NULL不属于这个范围，就像数字9一样。我们可以创建表ts2和ts3，其值列表包含NULL，如下所示:

```java
mysql> CREATE TABLE ts2 (
    ->     c1 INT,
    ->     c2 VARCHAR(20)
    -> )
    -> PARTITION BY LIST(c1) (
    ->     PARTITION p0 VALUES IN (0, 3, 6),
    ->     PARTITION p1 VALUES IN (1, 4, 7),
    ->     PARTITION p2 VALUES IN (2, 5, 8),
    ->     PARTITION p3 VALUES IN (NULL)
    -> );
Query OK, 0 rows affected (0.01 sec)
mysql> CREATE TABLE ts3 (
    ->     c1 INT,
    ->     c2 VARCHAR(20)
    -> )
    -> PARTITION BY LIST(c1) (
    ->     PARTITION p0 VALUES IN (0, 3, 6),
    ->     PARTITION p1 VALUES IN (1, 4, 7, NULL),
    ->     PARTITION p2 VALUES IN (2, 5, 8)
    -> );
Query OK, 0 rows affected (0.01 sec)
```

在为分区定义值列表时，可以(也应该)像对待任何其他值一样对待NULL。例如，VALUES IN (NULL)和VALUES IN (1, 4, 7, NULL)都是有效的，VALUES IN (1, NULL, 4, 7)， VALUES IN (NULL, 1, 4, 7)，等等。你可以在每个表ts2和ts3中插入一个列c1为NULL的行:

```java
mysql> INSERT INTO ts2 VALUES (NULL, 'mothra');
Query OK, 1 row affected (0.00 sec)
mysql> INSERT INTO ts3 VALUES (NULL, 'mothra');
Query OK, 1 row affected (0.00 sec)
```

通过对INFORMATION_SCHEMA发出适当的查询。分区，您可以确定哪些分区用于存储刚刚插入的行(我们假设，如前面的例子，分区表是在p数据库中创建的):

```java
mysql> SELECT TABLE_NAME, PARTITION_NAME, TABLE_ROWS, AVG_ROW_LENGTH, DATA_LENGTH
     >   FROM INFORMATION_SCHEMA.PARTITIONS
     >   WHERE TABLE_SCHEMA = 'p' AND TABLE_NAME LIKE 'ts_';
+------------+----------------+------------+----------------+-------------+
| TABLE_NAME | PARTITION_NAME | TABLE_ROWS | AVG_ROW_LENGTH | DATA_LENGTH |
+------------+----------------+------------+----------------+-------------+
| ts2        | p0             |          0 |              0 |           0 |
| ts2        | p1             |          0 |              0 |           0 |
| ts2        | p2             |          0 |              0 |           0 |
| ts2        | p3             |          1 |             20 |          20 |
| ts3        | p0             |          0 |              0 |           0 |
| ts3        | p1             |          1 |             20 |          20 |
| ts3        | p2             |          0 |              0 |           0 |
+------------+----------------+------------+----------------+-------------+
7 rows in set (0.01 sec)
```

如本节前面所示，还可以通过删除这些分区，然后执行SELECT，来验证使用了哪些分区来存储这些行。

使用HASH和KEY分区处理NULL。对于由HASH或KEY分区的表，NULL的处理稍有不同。在这些情况下，任何产生NULL值的分区表达式都被视为其返回值为零。我们可以通过检查创建一个由HASH分区的表并使用包含适当值的记录填充它对文件系统的影响来验证这种行为。假设你有一个表th(也在p数据库中)使用下面的语句创建:

```java
mysql> CREATE TABLE th (
    ->     c1 INT,
    ->     c2 VARCHAR(20)
    -> )
    -> PARTITION BY HASH(c1)
    -> PARTITIONS 2;
Query OK, 0 rows affected (0.00 sec)
```

属于这个表的分区可以使用以下查询查看:

```java
mysql> SELECT TABLE_NAME,PARTITION_NAME,TABLE_ROWS,AVG_ROW_LENGTH,DATA_LENGTH
     >   FROM INFORMATION_SCHEMA.PARTITIONS
     >   WHERE TABLE_SCHEMA = 'p' AND TABLE_NAME ='th';
+------------+----------------+------------+----------------+-------------+
| TABLE_NAME | PARTITION_NAME | TABLE_ROWS | AVG_ROW_LENGTH | DATA_LENGTH |
+------------+----------------+------------+----------------+-------------+
| th         | p0             |          0 |              0 |           0 |
| th         | p1             |          0 |              0 |           0 |
+------------+----------------+------------+----------------+-------------+
2 rows in set (0.00 sec)
```

每个分区的TABLE_ROWS为0。现在，将c1列值为NULL和0的两行插入到th中，并验证是否插入了这些行，如下所示:

```java
mysql> INSERT INTO th VALUES (NULL, 'mothra'), (0, 'gigan');
Query OK, 1 row affected (0.00 sec)
mysql> SELECT * FROM th;
+------+---------+
| c1   | c2      |
+------+---------+
| NULL | mothra  |
+------+---------+
|    0 | gigan   |
+------+---------+
2 rows in set (0.01 sec)
```

回想一下，对于任何整数N, NULL MOD N的值总是NULL。对于由HASH或KEY分区的表，此结果将用于将正确的分区确定为0。检查INFORMATION_SCHEMA。再次，我们可以看到这两行都被插入到分区p0:

```java
mysql> SELECT TABLE_NAME, PARTITION_NAME, TABLE_ROWS, AVG_ROW_LENGTH, DATA_LENGTH
     >   FROM INFORMATION_SCHEMA.PARTITIONS
     >   WHERE TABLE_SCHEMA = 'p' AND TABLE_NAME ='th';
+------------+----------------+------------+----------------+-------------+
| TABLE_NAME | PARTITION_NAME | TABLE_ROWS | AVG_ROW_LENGTH | DATA_LENGTH |
+------------+----------------+------------+----------------+-------------+
| th         | p0             |          2 |             20 |          20 |
| th         | p1             |          0 |              0 |           0 |
+------------+----------------+------------+----------------+-------------+
2 rows in set (0.00 sec)
```

通过重复上一个示例，在表的定义中使用PARTITION By KEY代替PARTITION By HASH，可以验证对于这种类型的分区，NULL也被视为0。

## 三.分区管理

### 3.1 管理range和list分区

范围和列表分区的添加和删除以类似的方式处理，因此我们将在本节讨论这两种分区的管理。

从按RANGE或LIST分区的表中删除分区可以使用带有DROP partition选项的ALTER table语句来完成。假设您已经创建了一个按范围划分的表，然后使用以下CREATE table和INSERT语句填充了10条记录:

```java
mysql> CREATE TABLE tr (id INT, name VARCHAR(50), purchased DATE)
    ->     PARTITION BY RANGE( YEAR(purchased) ) (
    ->         PARTITION p0 VALUES LESS THAN (1990),
    ->         PARTITION p1 VALUES LESS THAN (1995),
    ->         PARTITION p2 VALUES LESS THAN (2000),
    ->         PARTITION p3 VALUES LESS THAN (2005),
    ->         PARTITION p4 VALUES LESS THAN (2010),
    ->         PARTITION p5 VALUES LESS THAN (2015)
    ->     );
Query OK, 0 rows affected (0.28 sec)
mysql> INSERT INTO tr VALUES
    ->     (1, 'desk organiser', '2003-10-15'),
    ->     (2, 'alarm clock', '1997-11-05'),
    ->     (3, 'chair', '2009-03-10'),
    ->     (4, 'bookcase', '1989-01-10'),
    ->     (5, 'exercise bike', '2014-05-09'),
    ->     (6, 'sofa', '1987-06-05'),
    ->     (7, 'espresso maker', '2011-11-22'),
    ->     (8, 'aquarium', '1992-08-04'),
    ->     (9, 'study desk', '2006-09-16'),
    ->     (10, 'lava lamp', '1998-12-25');
Query OK, 10 rows affected (0.05 sec)
Records: 10  Duplicates: 0  Warnings: 0
```

你可以看到哪些项应该被插入到分区p2中，如下所示:

```java
mysql> SELECT * FROM tr
    ->     WHERE purchased BETWEEN '1995-01-01' AND '1999-12-31';
+------+-------------+------------+
| id   | name        | purchased  |
+------+-------------+------------+
|    2 | alarm clock | 1997-11-05 |
|   10 | lava lamp   | 1998-12-25 |
+------+-------------+------------+
2 rows in set (0.00 sec)
```

你也可以通过分区选择获得这些信息，如下所示:

```java
mysql> SELECT * FROM tr PARTITION (p2);
+------+-------------+------------+
| id   | name        | purchased  |
+------+-------------+------------+
|    2 | alarm clock | 1997-11-05 |
|   10 | lava lamp   | 1998-12-25 |
+------+-------------+------------+
2 rows in set (0.00 sec)
```

你也可以通过分区选择获得这些信息，如下所示:

```java
mysql> SELECT * FROM tr PARTITION (p2);
+------+-------------+------------+
| id   | name        | purchased  |
+------+-------------+------------+
|    2 | alarm clock | 1997-11-05 |
|   10 | lava lamp   | 1998-12-25 |
+------+-------------+------------+
2 rows in set (0.00 sec)
```

要删除名为p2的分区，执行以下命令:

```java
mysql> ALTER TABLE tr DROP PARTITION p2;
Query OK, 0 rows affected (0.03 sec)
```

非常重要的是要记住，当您删除一个分区时，您也将删除存储在该分区中的所有数据。你可以通过重新运行前面的SELECT查询看到这种情况:

```java
mysql> SELECT * FROM tr WHERE purchased
    -> BETWEEN '1995-01-01' AND '1999-12-31';
Empty set (0.00 sec)
```

因此，在执行ALTER table之前，必须对表拥有DROP权限。删除该表上的分区。

如果希望删除所有分区中的所有数据，同时保留表定义及其分区模式，请使用TRUNCATE table语句。

如果你想改变一个表的分区而不丢失数据，使用ALTER table…重组分区。关于REORGANIZE PARTITION的信息。

如果你现在执行一个SHOW CREATE TABLE语句，你可以看到表的分区组成是如何改变的:

```java
mysql> SHOW CREATE TABLE tr\G
*************************** 1. row ***************************
       Table: tr
Create Table: CREATE TABLE tr (
  id int(11) DEFAULT NULL,
  name varchar(50) DEFAULT NULL,
  purchased date DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1
/*!50100 PARTITION BY RANGE ( YEAR(purchased))
(PARTITION p0 VALUES LESS THAN (1990) ENGINE = InnoDB,
 PARTITION p1 VALUES LESS THAN (1995) ENGINE = InnoDB,
 PARTITION p3 VALUES LESS THAN (2005) ENGINE = InnoDB,
 PARTITION p4 VALUES LESS THAN (2010) ENGINE = InnoDB,
 PARTITION p5 VALUES LESS THAN (2015) ENGINE = InnoDB) */
1 row in set (0.00 sec)
```

当您使用购买的列值(包括’1995-01-01’和’2004-12-31’)向已更改的表中插入新行时，这些行存储在分区p3中。你可以如下验证:

```java
mysql> INSERT INTO tr VALUES (11, 'pencil holder', '1995-07-12');
Query OK, 1 row affected (0.00 sec)
mysql> SELECT * FROM tr WHERE purchased
    -> BETWEEN '1995-01-01' AND '2004-12-31';
+------+----------------+------------+
| id   | name           | purchased  |
+------+----------------+------------+
|    1 | desk organiser | 2003-10-15 |
|   11 | pencil holder  | 1995-07-12 |
+------+----------------+------------+
2 rows in set (0.00 sec)
mysql> ALTER TABLE tr DROP PARTITION p3;
Query OK, 0 rows affected (0.03 sec)
mysql> SELECT * FROM tr WHERE purchased
    -> BETWEEN '1995-01-01' AND '2004-12-31';
Empty set (0.00 sec)
```

从表中删除的行数作为ALTER table…DROP PARTITION不像等价的DELETE查询那样由服务器报告。

删除LIST分区使用完全相同的ALTER TABLE…DROP PARTITION语法，用于删除RANGE分区。但是，这对之后使用表的影响有一个重要的区别:您不能再向表中插入包含定义已删除分区的值列表中包含的任何值的任何行。(请参见24.2.2节“LIST Partitioning”中的示例。)

若要向以前分区的表添加新的范围或列表分区，请使用ALTER table…添加分区声明。对于按RANGE进行分区的表，这可以用于将一个新的范围添加到现有分区列表的末尾。假设您有一个包含组织成员数据的分区表，其定义如下:

```java
CREATE TABLE members (
    id INT,
    fname VARCHAR(25),
    lname VARCHAR(25),
    dob DATE
)
PARTITION BY RANGE( YEAR(dob) ) (
    PARTITION p0 VALUES LESS THAN (1980),
    PARTITION p1 VALUES LESS THAN (1990),
    PARTITION p2 VALUES LESS THAN (2000)
);
```

进一步假设成员的最低年龄为16岁。随着2015年的临近，你意识到你必须尽快准备好接纳2000年(及以后)出生的会员。您可以修改成员表来容纳2000年至2010年出生的新成员，如下所示:

```java
ALTER TABLE members ADD PARTITION (PARTITION p3 VALUES LESS THAN (2010));
```

对于按范围分区的表，您可以使用ADD PARTITION将新分区只添加到分区列表的高端。尝试以这种方式在现有分区之间或之前添加一个新分区会导致如下错误:

```java
mysql> ALTER TABLE members
     >     ADD PARTITION (
     >     PARTITION n VALUES LESS THAN (1970));
ERROR 1463 (HY000): VALUES LESS THAN value must be strictly »
   increasing for each partition
```

你可以通过将第一个分区重新组织成两个新的分区来解决这个问题，就像这样:

```java
ALTER TABLE members
    REORGANIZE PARTITION p0 INTO (
        PARTITION n0 VALUES LESS THAN (1970),
        PARTITION n1 VALUES LESS THAN (1980)
);
```

使用SHOW CREATE TABLE你可以看到ALTER TABLE语句已经达到了预期的效果:

```java
mysql> SHOW CREATE TABLE members\G
*************************** 1. row ***************************
       Table: members
Create Table: CREATE TABLE members (
  id int(11) DEFAULT NULL,
  fname varchar(25) DEFAULT NULL,
  lname varchar(25) DEFAULT NULL,
  dob date DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1
/*!50100 PARTITION BY RANGE ( YEAR(dob))
(PARTITION n0 VALUES LESS THAN (1970) ENGINE = InnoDB,
 PARTITION n1 VALUES LESS THAN (1980) ENGINE = InnoDB,
 PARTITION p1 VALUES LESS THAN (1990) ENGINE = InnoDB,
 PARTITION p2 VALUES LESS THAN (2000) ENGINE = InnoDB,
 PARTITION p3 VALUES LESS THAN (2010) ENGINE = InnoDB) */
1 row in set (0.00 sec)
```

你也可以使用ALTER TABLE…ADD PARTITION将新的分区添加到LIST分区的表中。假设一个表tt是用下面的CREATE table语句定义的:

```java
CREATE TABLE tt (
    id INT,
    data INT
)
PARTITION BY LIST(data) (
    PARTITION p0 VALUES IN (5, 10, 15),
    PARTITION p1 VALUES IN (6, 12, 18)
);
```

您可以添加一个新的分区，在其中存储数据列值为7、14和21的行，如图所示:

```java
ALTER TABLE tt ADD PARTITION (PARTITION p2 VALUES IN (7, 14, 21));
```

请记住，您不能添加包含现有分区值列表中已经包含的任何值的新LIST分区。如果你尝试这样做，一个错误结果:

```java
mysql> ALTER TABLE tt ADD PARTITION 
     >     (PARTITION np VALUES IN (4, 8, 12));
ERROR 1465 (HY000): Multiple definition of same constant »
                    in list partitioning
```

因为任何数据列值为12的行都已经分配给了分区p1，所以不能在表tt的值列表中创建包含12的新分区。为了做到这一点，你可以去掉p1，然后加上np，再加上一个新的定义修改过的p1。然而，如前所述，这将导致存储在p1中的所有数据的丢失——通常情况下，这并不是您真正想要做的。另一种解决方案可能是使用新的分区对表进行复制，然后使用CREATE table把数据复制到表中。选择……，然后删除旧表并重命名新表，但在处理大量数据时，这可能非常耗时。在需要高可用性的情况下，这可能也不可行。

你可以在一个ALTER TABLE中添加多个分区…ADD PARTITION语句如下所示:

```java
CREATE TABLE employees (
  id INT NOT NULL,
  fname VARCHAR(50) NOT NULL,
  lname VARCHAR(50) NOT NULL,
  hired DATE NOT NULL
)
PARTITION BY RANGE( YEAR(hired) ) (
  PARTITION p1 VALUES LESS THAN (1991),
  PARTITION p2 VALUES LESS THAN (1996),
  PARTITION p3 VALUES LESS THAN (2001),
  PARTITION p4 VALUES LESS THAN (2005)
);
ALTER TABLE employees ADD PARTITION (
    PARTITION p5 VALUES LESS THAN (2010),
    PARTITION p6 VALUES LESS THAN MAXVALUE
);
```

幸运的是，MySQL的分区实现提供了在不丢失数据的情况下重新定义分区的方法。让我们先看几个涉及RANGE分区的简单示例。回忆一下成员表，现在定义如下:

```java
mysql> SHOW CREATE TABLE members\G
*************************** 1. row ***************************
       Table: members
Create Table: CREATE TABLE members (
  id int(11) DEFAULT NULL,
  fname varchar(25) DEFAULT NULL,
  lname varchar(25) DEFAULT NULL,
  dob date DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1
/*!50100 PARTITION BY RANGE ( YEAR(dob))
(PARTITION n0 VALUES LESS THAN (1970) ENGINE = InnoDB,
 PARTITION n1 VALUES LESS THAN (1980) ENGINE = InnoDB,
 PARTITION p1 VALUES LESS THAN (1990) ENGINE = InnoDB,
 PARTITION p2 VALUES LESS THAN (2000) ENGINE = InnoDB,
 PARTITION p3 VALUES LESS THAN (2010) ENGINE = InnoDB) */
1 row in set (0.00 sec)
```

假设您希望将表示1960年以前出生的成员的所有行移动到一个单独的分区中。正如我们已经看到的，这不能使用ALTER TABLE…添加分区。但是，你可以使用另一个分区相关的扩展ALTER TABLE来实现这一点:

```java
ALTER TABLE members REORGANIZE PARTITION n0 INTO (
    PARTITION s0 VALUES LESS THAN (1960),
    PARTITION s1 VALUES LESS THAN (1970)
);
```

实际上，该命令将分区p0拆分为两个新的分区s0和s1。它还将存储在p0的数据移动到新的分区根据规则体现在两个分区…值……子句，使s0只包含年份(dob)小于1960的记录，s1包含年份(dob)大于或等于1960但小于1970的行。

REORGANIZE PARTITION子句也可以用于合并相邻的分区。你可以将前面语句对成员表的影响颠倒过来，如下所示:

```java
ALTER TABLE members REORGANIZE PARTITION s0,s1 INTO (
    PARTITION p0 VALUES LESS THAN (1970)
);
```

使用REORGANIZE PARTITION分割或合并分区时不会丢失数据。在执行上述语句时，MySQL将所有存储在分区s0和s1中的记录移动到分区p0。

REORGANIZE PARTITION的通用语法如下所示:

```java
ALTER TABLE tbl_name
    REORGANIZE PARTITION partition_list
    INTO (partition_definitions);
```

这里，tbl_name是分区表的名称，partition_list是一个逗号分隔的要更改的一个或多个现有分区的名称列表。partition_definitions是一个逗号分隔的新分区定义列表，它遵循与CREATE TABLE中使用的partition_definitions列表相同的规则。在使用REORGANIZE partition时，您不仅限于将多个分区合并为一个分区，也不限于将一个分区拆分为多个分区。例如，您可以将成员表的所有四个分区重新组织为两个，如下所示:

```java
ALTER TABLE members REORGANIZE PARTITION p0,p1,p2,p3 INTO (
    PARTITION m0 VALUES LESS THAN (1980),
    PARTITION m1 VALUES LESS THAN (2000)
);
```

您还可以对LIST分区的表使用REORGANIZE PARTITION。让我们回到向list-partitioned tt表添加新分区失败的问题，因为新分区的值已经出现在一个现有分区的值列表中。我们可以通过添加一个只包含不冲突值的分区来处理这个问题，然后重新组织新分区和现有分区，以便存储在现有分区中的值现在被移动到新分区中:

```java
ALTER TABLE tt ADD PARTITION (PARTITION np VALUES IN (4, 8));
ALTER TABLE tt REORGANIZE PARTITION p1,np INTO (
    PARTITION p1 VALUES IN (6, 18),
    PARTITION np VALUES in (4, 8, 12)
);
```

以下是使用ALTER TABLE时要记住的一些关键点。REORGANIZE PARTITION将RANGE或LIST分区的表重新分区:

用于确定新分区方案的PARTITION选项遵循与CREATE TABLE语句相同的规则。

一个新的RANGE分区方案不能有任何重叠的范围;一个新的LIST分区方案不能有任何重叠的值集。

partition_definitions列表中的分区组合应该考虑与partition_list中命名的组合分区相同的范围或值集。

例如，分区p1和p2包含成员表中1980年到1999年的年份，作为本节的示例。对这两个分区的任何重组都应该涵盖相同的年份范围。

对于按RANGE分区的表，您只能重新组织相邻的分区;不能跳过范围分区。

例如，您不能使用以ALTER table members reorganize PARTITION p0,p2 INTO…开头的语句来重新组织示例成员表。因为p0覆盖了1970年之前的年份，p2覆盖了1990年到1999年的年份，所以这些不是相邻的分区。(在这种情况下，您不能跳过分区p1。)

您不能使用REORGANIZE PARTITION来更改表所使用的分区类型(例如，您不能将RANGE分区更改为HASH分区或相反)。也不能使用此语句更改分区表达式或列。要在不删除和重新创建表的情况下完成这些任务，可以使用ALTER table…分区的……，如下所示:

```java
ALTER TABLE members
    PARTITION BY HASH( YEAR(dob) )
    PARTITIONS 8;
```

### 3.2 管理hash和key分区

在分区设置中，按散列或按键进行分区的表是非常相似的，两者在许多方面都不同于按范围或列表进行分区的表。因此，本节将处理仅通过散列或键分区的表的修改。关于添加和删除按范围或列表分区的表的分区的讨论。

不能像删除RANGE或LIST分区的表一样删除HASH或KEY分区的表的分区。然而，你可以合并HASH或KEY分区使用ALTER TABLE…合并分区。假设一个包含客户端数据的clients表被划分为12个分区，如下所示:

```java
CREATE TABLE clients (
    id INT,
    fname VARCHAR(30),
    lname VARCHAR(30),
    signed DATE
)
PARTITION BY HASH( MONTH(signed) )
PARTITIONS 12;
```

要将分区数量从12个减少到8个，执行下面的ALTER TABLE语句:

```java
mysql> ALTER TABLE clients COALESCE PARTITION 4;
Query OK, 0 rows affected (0.02 sec)
```

COALESCE同样可以很好地处理按HASH、KEY、LINEAR HASH或LINEAR KEY划分的表。下面是一个与上一个类似的例子，不同之处在于表是通过LINEAR KEY分区的:

```java
mysql> CREATE TABLE clients_lk (
    ->     id INT,
    ->     fname VARCHAR(30),
    ->     lname VARCHAR(30),
    ->     signed DATE
    -> )
    -> PARTITION BY LINEAR KEY(signed)
    -> PARTITIONS 12;
Query OK, 0 rows affected (0.03 sec)
mysql> ALTER TABLE clients_lk COALESCE PARTITION 4;
Query OK, 0 rows affected (0.06 sec)
Records: 0  Duplicates: 0  Warnings: 0
```

COALESCE PARTITION后面的数目是要合并到其余分区的数目——换句话说，是要从表中删除的分区数目。

试图删除比表中更多的分区会导致如下错误:

```java
mysql> ALTER TABLE clients COALESCE PARTITION 18;
ERROR 1478 (HY000): Cannot remove all partitions, use DROP TABLE instead
```

如果要将clients表的分区数量从12个增加到18个，请使用ALTER table…添加分区如下所示:

```java
ALTER TABLE clients ADD PARTITION PARTITIONS 6;
```

### 3.3 交换分区和子分区

在MySQL 8.0中,可以交换一个表分区或subpartition表使用ALTER table pt交换分区p表元,其中pt是分区表和p的分区或subpartition pt与nt分区表,交换提供以下语句是这样:

**1、** 表nt本身没有分区；

**2、** 表nt不是临时表；

**3、** 表pt和表nt的结构在其他方面是相同的；

**4、** 表nt不包含任何外键引用，其他表也没有任何外键引用nt；

**5、** 对于p,nt中没有位于分区定义边界之外的行如果使用了WITHOUTVALIDATION，则此条件不适用；

**6、** 对于InnoDB表，两个表使用相同的行格式要确定InnoDB表的行格式，可以查询INFORMATION_SCHEMA.INNODB_TABLES；

**7、** nt没有任何使用DATADIRECTORY选项的分区这个限制在MySQL8.0.14和更高版本的InnoDB表中被取消；

除了ALTER TABLE语句通常需要的ALTER、INSERT和CREATE权限外，你还必须有DROP权限才能执行ALTER TABLE…交换分区。

你还应该注意ALTER TABLE…交换分区:

**1、** 执行ALTERTABLE…EXCHANGEPARTITION不会在已分区表或要交换的表上调用任何触发器；

**2、** 交换表中的所有AUTO_INCREMENT列都将被重置；

**3、** IGNORE关键字在ALTERTABLE…交换分区；

ALTER TABLE…其中pt是已分区表，p是要交换的分区(或子分区)，nt是要与p交换的非分区表:

```java
ALTER TABLE pt
    EXCHANGE PARTITION p
    WITH TABLE nt;
```

您还可以附加WITH VALIDATION或WITHOUT VALIDATION。ALTER TABLE…当将一个分区交换到一个非分区表时，EXCHANGE PARTITION操作不执行任何逐行验证，这允许数据库管理员负责确保行在分区定义的边界内。WITH VALIDATION是默认值。

在一个ALTER table EXCHANGE partition语句中，只能有一个分区或子分区与一个非分区表交换。如果要交换多个分区或子分区，请使用多个ALTER TABLE exchange PARTITION语句。EXCHANGE PARTITION不能与其他ALTER TABLE选项结合使用。分区表所使用的分区和(如果适用)子分区可以是MySQL 8.0中支持的任何类型。

#### 3.3.1 与非分区表交换分区

假设已经使用以下SQL语句创建并填充了一个分区表e:

```java
CREATE TABLE e (
    id INT NOT NULL,
    fname VARCHAR(30),
    lname VARCHAR(30)
)
    PARTITION BY RANGE (id) (
        PARTITION p0 VALUES LESS THAN (50),
        PARTITION p1 VALUES LESS THAN (100),
        PARTITION p2 VALUES LESS THAN (150),
        PARTITION p3 VALUES LESS THAN (MAXVALUE)
);
INSERT INTO e VALUES
    (1669, "Jim", "Smith"),
    (337, "Mary", "Jones"),
    (16, "Frank", "White"),
    (2005, "Linda", "Black");
```

现在我们创建一个名为e2的e的非分区副本。这可以使用mysql客户端完成，如下所示:

```java
mysql> CREATE TABLE e2 LIKE e;
Query OK, 0 rows affected (0.04 sec)
mysql> ALTER TABLE e2 REMOVE PARTITIONING;
Query OK, 0 rows affected (0.07 sec)
Records: 0  Duplicates: 0  Warnings: 0
```

通过查询INFORMATION_SCHEMA，可以看到表e中哪些分区包含行。分区表，像这样:

```java
mysql> SELECT PARTITION_NAME, TABLE_ROWS
           FROM INFORMATION_SCHEMA.PARTITIONS
           WHERE TABLE_NAME = 'e';
+----------------+------------+
| PARTITION_NAME | TABLE_ROWS |
+----------------+------------+
| p0             |          1 |
| p1             |          0 |
| p2             |          0 |
| p3             |          3 |
+----------------+------------+
2 rows in set (0.00 sec)
```

要将e表中的p0分区和e2表交换，可以使用ALTER table，如下所示:

```java
mysql> ALTER TABLE e EXCHANGE PARTITION p0 WITH TABLE e2;
Query OK, 0 rows affected (0.04 sec)
```

更准确地说，刚刚发出的语句将导致在分区中找到的任何行与在表中找到的行交换。您可以通过查询INFORMATION_SCHEMA来观察这是如何发生的。分区表，和前面一样。之前在分区p0中找到的表行不再存在:

```java
mysql> SELECT PARTITION_NAME, TABLE_ROWS
           FROM INFORMATION_SCHEMA.PARTITIONS
           WHERE TABLE_NAME = 'e';
+----------------+------------+
| PARTITION_NAME | TABLE_ROWS |
+----------------+------------+
| p0             |          0 |
| p1             |          0 |
| p2             |          0 |
| p3             |          3 |
+----------------+------------+
4 rows in set (0.00 sec)
```

如果你查问表e2，你可以看到“缺失的”行现在可以在那里找到:

```java
mysql> SELECT * FROM e2;
+----+-------+-------+
| id | fname | lname |
+----+-------+-------+
| 16 | Frank | White |
+----+-------+-------+
1 row in set (0.00 sec)
```

要与分区交换的表不一定是空的。为了演示这一点，我们首先在表e中插入一个新行，通过选择一个id列值小于50来确保这一行存储在分区p0中，然后通过查询PARTITIONS表来验证这一点:

```java
mysql> INSERT INTO e VALUES (41, "Michael", "Green");
Query OK, 1 row affected (0.05 sec)
mysql> SELECT PARTITION_NAME, TABLE_ROWS
           FROM INFORMATION_SCHEMA.PARTITIONS
           WHERE TABLE_NAME = 'e';            
+----------------+------------+
| PARTITION_NAME | TABLE_ROWS |
+----------------+------------+
| p0             |          1 |
| p1             |          0 |
| p2             |          0 |
| p3             |          3 |
+----------------+------------+
4 rows in set (0.00 sec)
```

现在，我们再次使用ALTER table语句将p0分区与e2分区交换:

```java
mysql> ALTER TABLE e EXCHANGE PARTITION p0 WITH TABLE e2;
Query OK, 0 rows affected (0.28 sec)
```

以下查询的输出显示，在发出ALTER table语句之前，存储在分区p0的表行和存储在表e2的表行现在已经交换了位置:

```java
mysql> SELECT * FROM e;
+------+-------+-------+
| id   | fname | lname |
+------+-------+-------+
|   16 | Frank | White |
| 1669 | Jim   | Smith |
|  337 | Mary  | Jones |
| 2005 | Linda | Black |
+------+-------+-------+
4 rows in set (0.00 sec)
mysql> SELECT PARTITION_NAME, TABLE_ROWS
           FROM INFORMATION_SCHEMA.PARTITIONS
           WHERE TABLE_NAME = 'e';
+----------------+------------+
| PARTITION_NAME | TABLE_ROWS |
+----------------+------------+
| p0             |          1 |
| p1             |          0 |
| p2             |          0 |
| p3             |          3 |
+----------------+------------+
4 rows in set (0.00 sec)
mysql> SELECT * FROM e2;
+----+---------+-------+
| id | fname   | lname |
+----+---------+-------+
| 41 | Michael | Green |
+----+---------+-------+
1 row in set (0.00 sec)
```

#### 3.3.2 未匹配的行

您应该记住，在发出ALTER table…之前在非分区表中找到的任何行。EXCHANGE PARTITION语句必须满足将它们存储到目标分区所需的条件;否则，语句将失败。要了解这是如何发生的，首先在表e的分区p0的分区定义的边界之外插入一行到e2。例如，插入一个id列值太大的行;然后，尝试再次与分区交换表:

```java
mysql> INSERT INTO e2 VALUES (51, "Ellen", "McDonald");
Query OK, 1 row affected (0.08 sec)
mysql> ALTER TABLE e EXCHANGE PARTITION p0 WITH TABLE e2;
ERROR 1707 (HY000): Found row that does not match the partition
```

只有WITHOUT VALIDATION选项允许此操作成功:

```java
mysql> ALTER TABLE e EXCHANGE PARTITION p0 WITH TABLE e2 WITHOUT VALIDATION;
Query OK, 0 rows affected (0.02 sec)
```

当一个分区与包含不匹配分区定义的行的表交换时，数据库管理员有责任修复不匹配的行，可以使用REPAIR table或ALTER table…修复分区。

#### 3.3.3 没有逐行验证就交换分区

当一个分区与一个有很多行的表交换时，为了避免耗时的验证，可以通过将WITHOUT validation附加到ALTER table…交换分区。

下面的示例比较了使用和不使用验证交换分区与非分区表时执行时间的差异。已分区的表(表e)包含两个分区，每个分区有100万行。表e的p0中的行被删除，p0与一个100万行的非分区表交换。WITH验证操作需要0.74秒。相比之下，WITHOUT VALIDATION操作只需要0.01秒。

```java
# Create a partitioned table with 1 million rows in each partition
CREATE TABLE e (
    id INT NOT NULL,
    fname VARCHAR(30),
    lname VARCHAR(30)
)
    PARTITION BY RANGE (id) (
        PARTITION p0 VALUES LESS THAN (1000001),
        PARTITION p1 VALUES LESS THAN (2000001),
);
mysql> SELECT COUNT(*) FROM e;
| COUNT(*) |
+----------+
|  2000000 |
+----------+
1 row in set (0.27 sec)
# View the rows in each partition
SELECT PARTITION_NAME, TABLE_ROWS FROM INFORMATION_SCHEMA.PARTITIONS WHERE TABLE_NAME = 'e';
+----------------+-------------+
| PARTITION_NAME | TABLE_ROWS  |
+----------------+-------------+
| p0             |     1000000 |
| p1             |     1000000 |
+----------------+-------------+
2 rows in set (0.00 sec)
# Create a nonpartitioned table of the same structure and populate it with 1 million rows
CREATE TABLE e2 (
    id INT NOT NULL,
    fname VARCHAR(30),
    lname VARCHAR(30)
);
mysql> SELECT COUNT(*) FROM e2;
+----------+
| COUNT(*) |
+----------+
|  1000000 |
+----------+
1 row in set (0.24 sec)
# Create another nonpartitioned table of the same structure and populate it with 1 million rows
CREATE TABLE e3 (
    id INT NOT NULL,
    fname VARCHAR(30),
    lname VARCHAR(30)
);
mysql> SELECT COUNT(*) FROM e3;
+----------+
| COUNT(*) |
+----------+
|  1000000 |
+----------+
1 row in set (0.25 sec)
# Drop the rows from p0 of table e
mysql> DELETE FROM e WHERE id < 1000001;
Query OK, 1000000 rows affected (5.55 sec)
# Confirm that there are no rows in partition p0
mysql> SELECT PARTITION_NAME, TABLE_ROWS FROM INFORMATION_SCHEMA.PARTITIONS WHERE TABLE_NAME = 'e';
+----------------+------------+
| PARTITION_NAME | TABLE_ROWS |
+----------------+------------+
| p0             |          0 |
| p1             |    1000000 |
+----------------+------------+
2 rows in set (0.00 sec)
# Exchange partition p0 of table e with the table e2 'WITH VALIDATION'
mysql> ALTER TABLE e EXCHANGE PARTITION p0 WITH TABLE e2 WITH VALIDATION;
Query OK, 0 rows affected (0.74 sec)
# Confirm that the partition was exchanged with table e2
mysql> SELECT PARTITION_NAME, TABLE_ROWS FROM INFORMATION_SCHEMA.PARTITIONS WHERE TABLE_NAME = 'e';
+----------------+------------+
| PARTITION_NAME | TABLE_ROWS |
+----------------+------------+
| p0             |    1000000 |
| p1             |    1000000 |
+----------------+------------+
2 rows in set (0.00 sec)
# Once again, drop the rows from p0 of table e
mysql> DELETE FROM e WHERE id < 1000001;
Query OK, 1000000 rows affected (5.55 sec)
# Confirm that there are no rows in partition p0
mysql> SELECT PARTITION_NAME, TABLE_ROWS FROM INFORMATION_SCHEMA.PARTITIONS WHERE TABLE_NAME = 'e';
+----------------+------------+
| PARTITION_NAME | TABLE_ROWS |
+----------------+------------+
| p0             |          0 |
| p1             |    1000000 |
+----------------+------------+
2 rows in set (0.00 sec)
# Exchange partition p0 of table e with the table e3 'WITHOUT VALIDATION'
mysql> ALTER TABLE e EXCHANGE PARTITION p0 WITH TABLE e3 WITHOUT VALIDATION;
Query OK, 0 rows affected (0.01 sec)
# Confirm that the partition was exchanged with table e3
mysql> SELECT PARTITION_NAME, TABLE_ROWS FROM INFORMATION_SCHEMA.PARTITIONS WHERE TABLE_NAME = 'e';
+----------------+------------+
| PARTITION_NAME | TABLE_ROWS |
+----------------+------------+
| p0             |    1000000 |
| p1             |    1000000 |
+----------------+------------+
2 rows in set (0.00 sec)
```

如果一个分区与一个包含不匹配分区定义的行的表交换，则数据库管理员有责任修复不匹配的行，可以使用REPAIR table或ALTER table…修复分区。

#### 3.3.4 与非分区表交换子分区

您也可以使用ALTER table来交换一个分区表的子分区和一个非分区表的子分区。交换分区。在下面的例子中，我们首先创建一个表es，它被RANGE分区了，被KEY分区了，填充这个表，就像我们做表e一样，然后创建一个空的，没有分区的表拷贝es2，如下所示:

```java
mysql> CREATE TABLE es (
    ->     id INT NOT NULL,
    ->     fname VARCHAR(30),
    ->     lname VARCHAR(30)
    -> )
    ->     PARTITION BY RANGE (id)
    ->     SUBPARTITION BY KEY (lname)
    ->     SUBPARTITIONS 2 (
    ->         PARTITION p0 VALUES LESS THAN (50),
    ->         PARTITION p1 VALUES LESS THAN (100),
    ->         PARTITION p2 VALUES LESS THAN (150),
    ->         PARTITION p3 VALUES LESS THAN (MAXVALUE)
    ->     );
Query OK, 0 rows affected (2.76 sec)
mysql> INSERT INTO es VALUES
    ->     (1669, "Jim", "Smith"),
    ->     (337, "Mary", "Jones"),
    ->     (16, "Frank", "White"),
    ->     (2005, "Linda", "Black");
Query OK, 4 rows affected (0.04 sec)
Records: 4  Duplicates: 0  Warnings: 0
mysql> CREATE TABLE es2 LIKE es;
Query OK, 0 rows affected (1.27 sec)
mysql> ALTER TABLE es2 REMOVE PARTITIONING;
Query OK, 0 rows affected (0.70 sec)
Records: 0  Duplicates: 0  Warnings: 0
```

虽然我们在创建表es时没有显式地命名任何子分区，但是我们可以通过从INFORMATION_SCHEMA中选择PARTITIONS表的SUBPARTITION_NAME列来获得生成的名称，如下所示:

```java
mysql> SELECT PARTITION_NAME, SUBPARTITION_NAME, TABLE_ROWS
    ->     FROM INFORMATION_SCHEMA.PARTITIONS
    ->     WHERE TABLE_NAME = 'es';
+----------------+-------------------+------------+
| PARTITION_NAME | SUBPARTITION_NAME | TABLE_ROWS |
+----------------+-------------------+------------+
| p0             | p0sp0             |          1 |
| p0             | p0sp1             |          0 |
| p1             | p1sp0             |          0 |
| p1             | p1sp1             |          0 |
| p2             | p2sp0             |          0 |
| p2             | p2sp1             |          0 |
| p3             | p3sp0             |          3 |
| p3             | p3sp1             |          0 |
+----------------+-------------------+------------+
8 rows in set (0.00 sec)
```

下面的ALTER TABLE语句将表es中的子分区p3sp0与非分区表es2交换:

```java
mysql> ALTER TABLE es EXCHANGE PARTITION p3sp0 WITH TABLE es2;
Query OK, 0 rows affected (0.29 sec)
```

您可以通过发出以下查询来验证交换的行:

```java
mysql> SELECT PARTITION_NAME, SUBPARTITION_NAME, TABLE_ROWS
    ->     FROM INFORMATION_SCHEMA.PARTITIONS
    ->     WHERE TABLE_NAME = 'es';
+----------------+-------------------+------------+
| PARTITION_NAME | SUBPARTITION_NAME | TABLE_ROWS |
+----------------+-------------------+------------+
| p0             | p0sp0             |          1 |
| p0             | p0sp1             |          0 |
| p1             | p1sp0             |          0 |
| p1             | p1sp1             |          0 |
| p2             | p2sp0             |          0 |
| p2             | p2sp1             |          0 |
| p3             | p3sp0             |          0 |
| p3             | p3sp1             |          0 |
+----------------+-------------------+------------+
8 rows in set (0.00 sec)
mysql> SELECT * FROM es2;
+------+-------+-------+
| id   | fname | lname |
+------+-------+-------+
| 1669 | Jim   | Smith |
|  337 | Mary  | Jones |
| 2005 | Linda | Black |
+------+-------+-------+
3 rows in set (0.00 sec)
```

如果一个表被分区了，那么您只能交换这个表的一个子分区-不是整个分区-和一个未分区的表，如下所示:

```java
mysql> ALTER TABLE es EXCHANGE PARTITION p3 WITH TABLE es2;
ERROR 1704 (HY000): Subpartitioned table, use subpartition instead of partition
```

表结构以严格的方式进行比较;已分区表和非分区表的列和索引的数量、顺序、名称和类型必须完全匹配。另外，两个表必须使用相同的存储引擎:

```java
mysql> CREATE TABLE es3 LIKE e;
Query OK, 0 rows affected (1.31 sec)
mysql> ALTER TABLE es3 REMOVE PARTITIONING;
Query OK, 0 rows affected (0.53 sec)
Records: 0  Duplicates: 0  Warnings: 0
mysql> SHOW CREATE TABLE es3\G
*************************** 1. row ***************************
       Table: es3
Create Table: CREATE TABLE es3 (
  id int(11) NOT NULL,
  fname varchar(30) DEFAULT NULL,
  lname varchar(30) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
1 row in set (0.00 sec)
mysql> ALTER TABLE es3 ENGINE = MyISAM;
Query OK, 0 rows affected (0.15 sec)
Records: 0  Duplicates: 0  Warnings: 0
mysql> ALTER TABLE es EXCHANGE PARTITION p3sp0 WITH TABLE es3;
ERROR 1497 (HY000): The mix of handlers in the partitions is not allowed in this version of MySQL
```

### 3.4 维护分区

可以使用用于此类目的的SQL语句在已分区的表上执行许多表和分区维护任务。

分区表的表维护可以使用分区表支持的语句CHECK Table、OPTIMIZE Table、ANALYZE Table、REPAIR Table来完成。

你可以使用许多扩展ALTER TABLE来直接在一个或多个分区上执行这种类型的操作，如下表所示:

**1、** Rebuildingpartitions.；

重建分区;这与删除分区中存储的所有记录，然后重新插入它们的效果相同。这对于碎片整理很有用。

```java
ALTER TABLE t1 REBUILD PARTITION p0, p1;
```

**1、** Optimizingpartitions；

如果您从一个分区中删除了大量的行，或者如果您对一个具有可变长度行(即具有VARCHAR、BLOB或TEXT列)的分区表做了许多更改，那么您可以使用ALTER table…优化分区以回收任何未使用的空间，并整理分区数据文件。

```java
ALTER TABLE t1 OPTIMIZE PARTITION p0, p1;
```

在给定的分区上使用OPTIMIZE PARTITION等价于在该分区上运行CHECK PARTITION、ANALYZE PARTITION和REPAIR PARTITION。

一些MySQL存储引擎，包括InnoDB，不支持分区优化;在这些情况下，ALTER TABLE…OPTIMIZE PARTITION分析并重新构建整个表，并发出适当的警告。(Bug #11751825, Bug #42822)使用ALTER TABLE…重建分区和ALTER TABLE…取而代之的是ANALYZE PARTITION，以避免这个问题。

**1、** Analyzingpartitions；

这将读取和存储分区的密钥分发。

```java
ALTER TABLE t1 ANALYZE PARTITION p3;
```

**1、** Repairingpartitions；

修复坏的分区表。

```java
ALTER TABLE t1 REPAIR PARTITION p0,p1;
```

**1、** Checkingpartitions.；

可以使用与对非分区表使用check TABLE相同的方式检查分区是否有错误。

```java
ALTER TABLE trb3 CHECK PARTITION p1;
```

## 四.分区裁剪

被称为分区剪枝的优化基于一个相对简单的概念，可以描述为“不要扫描没有匹配值的分区”。假设通过下面的语句创建了一个分区表t1:

```java
CREATE TABLE t1 (
    fname VARCHAR(50) NOT NULL,
    lname VARCHAR(50) NOT NULL,
    region_code TINYINT UNSIGNED NOT NULL,
    dob DATE NOT NULL
)
PARTITION BY RANGE( region_code ) (
    PARTITION p0 VALUES LESS THAN (64),
    PARTITION p1 VALUES LESS THAN (128),
    PARTITION p2 VALUES LESS THAN (192),
    PARTITION p3 VALUES LESS THAN MAXVALUE
);
```

假设您希望从一个SELECT语句中获得结果，例如:

```java
SELECT fname, lname, region_code, dob
    FROM t1
    WHERE region_code > 125 AND region_code < 130;
```

很容易看到，应该返回的所有行都不在p0或p3分区中;也就是说，我们只需要在分区p1和p2中搜索匹配的行。通过限制搜索，与扫描表中的所有分区相比，查找匹配行所花费的时间和精力要少得多。这种对不需要的分区的“切割”称为修剪。当优化器可以在执行此查询时使用分区修剪时，查询的执行速度可能比对包含相同列定义和数据的非分区表执行相同查询快一个数量级。

当WHERE条件可以减少到以下两种情况之一时，优化器可以执行修剪:

**1、** partition_column=常数；

**2、** partition_columnIN(常量1，常量2，…constantN)；

在第一种情况下，优化器只计算给定值的分区表达式，确定哪个分区包含该值，并只扫描这个分区。在许多情况下，等号可以用另一种算术比较替换，包括、=和<>。在WHERE子句中使用BETWEEN的一些查询也可以利用分区修剪。请参阅本节后面的示例。

在第二种情况下，优化器为列表中的每个值计算分区表达式，创建一个匹配分区的列表，然后只扫描这个分区列表中的分区。

SELECT、DELETE和UPDATE语句支持分区剪枝。对于插入的行，INSERT语句也只能访问一个分区;即使是用HASH或KEY分区的表也是如此，尽管目前在EXPLAIN的输出中没有显示。

修剪也可以应用于较短的范围，优化器可以将其转换为等价的值列表。例如，在前面的例子中，WHERE子句可以转换为WHERE region_code in(126, 127, 128, 129)。然后，优化器可以确定列表中的前两个值是在分区p1中找到的，其余两个值是在分区p2中找到的，并且其他分区不包含相关值，因此不需要搜索匹配的行。

优化器还可以对WHERE条件进行修剪，这些条件涉及对使用RANGE columns或LIST columns分区的表的多个列进行上述类型的比较。

当分区表达式包含一个等式或一个可以简化为一组等式的范围时，或者当分区表达式表示递增或递减关系时，可以应用这种类型的优化。当分区表达式使用YEAR()或TO_DAYS()函数时，还可以对按DATE或DATETIME列分区的表应用修剪。当分区表达式使用TO_SECONDS()函数时，还可以对这样的表应用修剪。

假设在DATE列上分区的表t2使用如下语句创建:

```java
CREATE TABLE t2 (
    fname VARCHAR(50) NOT NULL,
    lname VARCHAR(50) NOT NULL,
    region_code TINYINT UNSIGNED NOT NULL,
    dob DATE NOT NULL
)
PARTITION BY RANGE( YEAR(dob) ) (
    PARTITION d0 VALUES LESS THAN (1970),
    PARTITION d1 VALUES LESS THAN (1975),
    PARTITION d2 VALUES LESS THAN (1980),
    PARTITION d3 VALUES LESS THAN (1985),
    PARTITION d4 VALUES LESS THAN (1990),
    PARTITION d5 VALUES LESS THAN (2000),
    PARTITION d6 VALUES LESS THAN (2005),
    PARTITION d7 VALUES LESS THAN MAXVALUE
);
```

使用t2可以使用以下语句进行分区剪枝:

```java
SELECT * FROM t2 WHERE dob = '1982-06-23';
UPDATE t2 SET region_code = 8 WHERE dob BETWEEN '1991-02-15' AND '1997-04-25';
DELETE FROM t2 WHERE dob >= '1984-06-21' AND dob <= '1999-06-21'
```

对于最后一条语句，优化器也可以如下所示:

**1、** 找到包含范围低端的分区；

YEAR(‘1984-06-21’)生成值1984，该值位于分区d3中。
**2、** 找到包含范围高端的分区；

YEAR(‘1999-06-21’)的值是1999，它位于分区d5中。
**3、** 只扫描这两个分区以及它们之间的任何分区；

在本例中，这意味着只扫描d3、d4和d5分区。其余的分区可以被安全地忽略(并且被忽略)。

## 五.分区表实例

**环境介绍**

mysql中有这么一张大表，我们需要把这个普通的表变为分区表。

```java
mysql> select count(*) from fact_sale;
+-----------+
| count(*)  |
+-----------+
| 767830001 |
+-----------+
1 row in set (1 min 2.80 sec)
mysql> desc fact_sale;
+-----------+--------------+------+-----+-------------------+-----------------------------------------------+
| Field     | Type         | Null | Key | Default           | Extra                                         |
+-----------+--------------+------+-----+-------------------+-----------------------------------------------+
| id        | bigint       | NO   | PRI | NULL              | auto_increment                                |
| sale_date | timestamp    | NO   | MUL | CURRENT_TIMESTAMP | DEFAULT_GENERATED on update CURRENT_TIMESTAMP |
| prod_name | varchar(200) | NO   |     | NULL              |                                               |
| sale_nums | int          | YES  |     | NULL              |                                               |
+-----------+--------------+------+-----+-------------------+-----------------------------------------------+
4 rows in set (0.03 sec)
mysql> select * from fact_sale limit 10;
+----+---------------------+-----------+-----------+
| id | sale_date           | prod_name | sale_nums |
+----+---------------------+-----------+-----------+
|  1 | 2011-08-16 00:00:00 | PROD4     |        28 |
|  2 | 2011-11-06 00:00:00 | PROD6     |        19 |
|  3 | 2011-04-25 00:00:00 | PROD8     |        29 |
|  4 | 2011-09-12 00:00:00 | PROD2     |        88 |
|  5 | 2011-05-15 00:00:00 | PROD5     |        76 |
|  6 | 2011-02-23 00:00:00 | PROD6     |        64 |
|  7 | 2012-09-26 00:00:00 | PROD2     |        38 |
|  8 | 2012-02-14 00:00:00 | PROD6     |        45 |
|  9 | 2010-04-22 00:00:00 | PROD8     |        57 |
| 10 | 2010-10-31 00:00:00 | PROD5     |        65 |
+----+---------------------+-----------+-----------+
10 rows in set (0.00 sec)
mysql> 
```

### 5.1创建range分区

**刚测试了，id列为主键会报错，分区列sale_date必须在主键(可以是联合主键)内，mysql分区表这个真的有点不太友好**

代码:

```java
CREATE TABLE fact_sale_range (
  id bigint NOT NULL ,
  sale_date timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  prod_name varchar(200) NOT NULL,
  sale_nums int DEFAULT NULL
) 
PARTITION BY RANGE(UNIX_TIMESTAMP(SALE_DATE)) (
   PARTITION P0 VALUES LESS THAN (UNIX_TIMESTAMP('2010-01-01 00:00:00')),
   PARTITION P1 VALUES LESS THAN (UNIX_TIMESTAMP('2011-01-01 00:00:00')),
   PARTITION P2 VALUES LESS THAN (UNIX_TIMESTAMP('2012-01-01 00:00:00')),
   PARTITION P3 VALUES LESS THAN (UNIX_TIMESTAMP('2013-01-01 00:00:00')),
   PARTITION PMAX VALUES LESS THAN MAXVALUE
);
insert into fact_sale_range select * from fact_sale limit 10000000;
```

**测试记录:**

这样看MySQL的OLTP性能还不错，1000w数据1分钟左右，而且服务器配置是4核8G的虚拟机。

```java
mysql> insert into fact_sale_range select * from fact_sale limit 10000000;
Query OK, 10000000 rows affected (1 min 26.13 sec)
Records: 10000000  Duplicates: 0  Warnings: 0
mysql> 
```

#### 5.1.1 查看分区表数据量

**查看各个分区的数量**

```java
mysql> select count(*) from fact_sale_range partition (P0);
+----------+
| count(*) |
+----------+
|        0 |
+----------+
1 row in set (0.01 sec)
mysql> select count(*) from fact_sale_range partition (P1);
+----------+
| count(*) |
+----------+
|  2934777 |
+----------+
1 row in set (0.13 sec)
mysql> select count(*) from fact_sale_range partition (P2);
+----------+
| count(*) |
+----------+
|  4056076 |
+----------+
1 row in set (0.23 sec)
mysql> select count(*) from fact_sale_range partition (P3);
+----------+
| count(*) |
+----------+
|  3009147 |
+----------+
1 row in set (0.17 sec)
mysql> select count(*) from fact_sale_range partition (PMAX);
+----------+
| count(*) |
+----------+
|        0 |
+----------+
1 row in set (0.00 sec)
```

不带分区的查询会慢一些:

```java
mysql> select count(*) from fact_sale_range where sale_date >= '2010-01-01 00:00:00' and sale_date < '2011-01-01 00:00:00';
+----------+
| count(*) |
+----------+
|  2934777 |
+----------+
1 row in set (4.66 sec)
```

#### 5.1.2 添加和删除分区

添加和删除分区:

```java
show create table fact_sale_range\G 
-- MAXVALUE can only be used in last partition definition
alter table fact_sale_range add partition (partition P4 VALUES LESS THAN (UNIX_TIMESTAMP('2014-01-01 00:00:00')));
-- 先删除maxvalue分区，然后再进行添加
alter table fact_sale_range drop partition PMAX;
alter table fact_sale_range add partition (partition P4 VALUES LESS THAN (UNIX_TIMESTAMP('2014-01-01 00:00:00')));
alter table fact_sale_range add partition (partition PMAX VALUES LESS THAN (MAXVALUE));
-- 最后重新查看分区表的表结构
show create table fact_sale_range\G 
```

测试记录:

```java
mysql> show create table fact_sale_range\G
*************************** 1. row ***************************
       Table: fact_sale_range
Create Table: CREATE TABLE fact_sale_range (
  id bigint NOT NULL,
  sale_date timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  prod_name varchar(200) NOT NULL,
  sale_nums int DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3
/*!50100 PARTITION BY RANGE (unix_timestamp(sale_date))
(PARTITION P0 VALUES LESS THAN (1262275200) ENGINE = InnoDB,
 PARTITION P1 VALUES LESS THAN (1293811200) ENGINE = InnoDB,
 PARTITION P2 VALUES LESS THAN (1325347200) ENGINE = InnoDB,
 PARTITION P3 VALUES LESS THAN (1356969600) ENGINE = InnoDB,
 PARTITION PMAX VALUES LESS THAN MAXVALUE ENGINE = InnoDB) */
1 row in set (0.00 sec)
mysql> 
mysql> alter table fact_sale_range add partition (partition P4 VALUES LESS THAN (UNIX_TIMESTAMP('2014-01-01 00:00:00')));
ERROR 1481 (HY000): MAXVALUE can only be used in last partition definition
mysql> alter table fact_sale_range drop partition PMAX;
Query OK, 0 rows affected (0.22 sec)
Records: 0  Duplicates: 0  Warnings: 0
mysql> alter table fact_sale_range add partition (partition P4 VALUES LESS THAN (UNIX_TIMESTAMP('2014-01-01 00:00:00')));
Query OK, 0 rows affected (0.03 sec)
Records: 0  Duplicates: 0  Warnings: 0
mysql> 
mysql> alter table fact_sale_range add partition (partition PMAX VALUES LESS THAN (MAXVALUE));
Query OK, 0 rows affected (0.01 sec)
Records: 0  Duplicates: 0  Warnings: 0
mysql> show create table fact_sale_range\G 
*************************** 1. row ***************************
       Table: fact_sale_range
Create Table: CREATE TABLE fact_sale_range (
  id bigint NOT NULL,
  sale_date timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  prod_name varchar(200) NOT NULL,
  sale_nums int DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3
/*!50100 PARTITION BY RANGE (unix_timestamp(sale_date))
(PARTITION P0 VALUES LESS THAN (1262275200) ENGINE = InnoDB,
 PARTITION P1 VALUES LESS THAN (1293811200) ENGINE = InnoDB,
 PARTITION P2 VALUES LESS THAN (1325347200) ENGINE = InnoDB,
 PARTITION P3 VALUES LESS THAN (1356969600) ENGINE = InnoDB,
 PARTITION P4 VALUES LESS THAN (1388505600) ENGINE = InnoDB,
 PARTITION PMAX VALUES LESS THAN MAXVALUE ENGINE = InnoDB) */
1 row in set (0.00 sec)
mysql> 
```

### 5.2 创建List分区

代码:

```java
CREATE TABLE fact_sale_list (
  id bigint NOT NULL ,
  sale_date timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  prod_name varchar(200) NOT NULL,
  sale_nums int DEFAULT NULL
) 
PARTITION BY list(sale_nums) (
   PARTITION P1 VALUES in (1,2,3,4,5,6,7,8,9),
   PARTITION P2 VALUES in (11,12,13,14,15,16,17,18,19),
   PARTITION P3 VALUES in (21,22,23,24,25,26,27,28,29),
   PARTITION P4 VALUES in (31,32,33,34,35,36,37,38,39),
   PARTITION P5 VALUES in (41,42,43,44,45,46,47,48,49),
   PARTITION P6 VALUES in (51,52,53,54,55,56,57,58,59),
   PARTITION P7 VALUES in (61,62,63,64,65,66,67,68,69),
   PARTITION P8 VALUES in (71,72,73,74,75,76,77,78,79),
   PARTITION P9 VALUES in (81,82,83,84,85,86,87,88,89)
);
insert into fact_sale_list select * from fact_sale limit 10000000;
drop table fact_sale_list;
CREATE TABLE fact_sale_list (
  id bigint NOT NULL ,
  sale_date timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  prod_name varchar(200) NOT NULL,
  sale_nums int DEFAULT NULL
) 
PARTITION BY list(sale_nums) (
   PARTITION P1 VALUES in (1,2,3,4,5,6,7,8,9,10),
   PARTITION P2 VALUES in (11,12,13,14,15,16,17,18,19,20),
   PARTITION P3 VALUES in (21,22,23,24,25,26,27,28,29,30),
   PARTITION P4 VALUES in (31,32,33,34,35,36,37,38,39,40),
   PARTITION P5 VALUES in (41,42,43,44,45,46,47,48,49,50),
   PARTITION P6 VALUES in (51,52,53,54,55,56,57,58,59,60),
   PARTITION P7 VALUES in (61,62,63,64,65,66,67,68,69,70),
   PARTITION P8 VALUES in (71,72,73,74,75,76,77,78,79,80),
   PARTITION P9 VALUES in (81,82,83,84,85,86,87,88,89,90),
   PARTITION P10 VALUES in (91,92,93,94,95,96,97,98,99,100)
);
insert into fact_sale_list select * from fact_sale limit 10000000;
```

测试记录:

```java
mysql>` CREATE TABLE fact_sale_list (
    ->`   id bigint NOT NULL ,
    ->`   sale_date timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    ->`   prod_name varchar(200) NOT NULL,
    ->`   sale_nums int DEFAULT NULL
    -> ) 
    -> PARTITION BY list(sale_nums) (
    ->    PARTITION P1 VALUES in (1,2,3,4,5,6,7,8,9),
    ->    PARTITION P2 VALUES in (11,12,13,14,15,16,17,18,19),
    ->    PARTITION P3 VALUES in (21,22,23,24,25,26,27,28,29),
    ->    PARTITION P4 VALUES in (31,32,33,34,35,36,37,38,39),
    ->    PARTITION P5 VALUES in (41,42,43,44,45,46,47,48,49),
    ->    PARTITION P6 VALUES in (51,52,53,54,55,56,57,58,59),
    ->    PARTITION P7 VALUES in (61,62,63,64,65,66,67,68,69),
    ->    PARTITION P8 VALUES in (71,72,73,74,75,76,77,78,79),
    ->    PARTITION P9 VALUES in (81,82,83,84,85,86,87,88,89)
    -> );
Query OK, 0 rows affected (0.06 sec)
mysql> 
mysql> 
mysql> insert into fact_sale_list select * from fact_sale limit 10000000;
ERROR 1526 (HY000): Table has no partition for value 50
mysql> 
mysql> 
mysql> 
mysql> 
mysql>` CREATE TABLE fact_sale_list (
    ->`   id bigint NOT NULL ,
    ->`   sale_date timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    ->`   prod_name varchar(200) NOT NULL,
    ->`   sale_nums int DEFAULT NULL
    -> ) 
    -> PARTITION BY list(sale_nums) (
    ->    PARTITION P1 VALUES in (1,2,3,4,5,6,7,8,9,10),
    ->    PARTITION P2 VALUES in (11,12,13,14,15,16,17,18,19,20),
    ->    PARTITION P3 VALUES in (21,22,23,24,25,26,27,28,29,30),
    ->    PARTITION P4 VALUES in (31,32,33,34,35,36,37,38,39,40),
    ->    PARTITION P5 VALUES in (41,42,43,44,45,46,47,48,49,50),
    ->    PARTITION P6 VALUES in (51,52,53,54,55,56,57,58,59,60),
    ->    PARTITION P7 VALUES in (61,62,63,64,65,66,67,68,69,70),
    ->    PARTITION P8 VALUES in (71,72,73,74,75,76,77,78,79,80),
    ->    PARTITION P9 VALUES in (81,82,83,84,85,86,87,88,89,90),
    ->    PARTITION P10 VALUES in (91,92,93,94,95,96,97,98,99,100)
    -> );
ERROR 1050 (42S01): Table 'fact_sale_list' already exists
mysql> 
mysql> drop table fact_sale_list;
Query OK, 0 rows affected (0.04 sec)
mysql> 
mysql>` CREATE TABLE fact_sale_list (
    ->`   id bigint NOT NULL ,
    ->`   sale_date timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    ->`   prod_name varchar(200) NOT NULL,
    ->`   sale_nums int DEFAULT NULL
    -> ) 
    -> PARTITION BY list(sale_nums) (
    ->    PARTITION P1 VALUES in (1,2,3,4,5,6,7,8,9,10),
    ->    PARTITION P2 VALUES in (11,12,13,14,15,16,17,18,19,20),
    ->    PARTITION P3 VALUES in (21,22,23,24,25,26,27,28,29,30),
    ->    PARTITION P4 VALUES in (31,32,33,34,35,36,37,38,39,40),
    ->    PARTITION P5 VALUES in (41,42,43,44,45,46,47,48,49,50),
    ->    PARTITION P6 VALUES in (51,52,53,54,55,56,57,58,59,60),
    ->    PARTITION P7 VALUES in (61,62,63,64,65,66,67,68,69,70),
    ->    PARTITION P8 VALUES in (71,72,73,74,75,76,77,78,79,80),
    ->    PARTITION P9 VALUES in (81,82,83,84,85,86,87,88,89,90),
    ->    PARTITION P10 VALUES in (91,92,93,94,95,96,97,98,99,100)
    -> );
Query OK, 0 rows affected (0.04 sec)
mysql>    PARTITION P3 VALUES in (21,22,23,24,25,26,27,28,29,30),^C
mysql> 
mysql> insert into fact_sale_list select * from fact_sale limit 10000000;
Query OK, 10000000 rows affected (1 min 37.28 sec)
Records: 10000000  Duplicates: 0  Warnings: 0
mysql> 
```
