# 05、MySQL 调优 - Schema与数据类型优化
- 来源：https://ddkk.com/zhuanlan/db/mysql/3/5.html
- 分类：缓存数据库
- 分组：教程目录
备注:测试数据库版本为MySQL 8.0

## 一.Schema与数据类型优化概述

良好的逻辑设计和物理设计是高性能的基石，应该根据系统将要执行的查询语句来设计schema，这往往需要权衡各种因素。

schema设计不佳，后期调整会非常的困难，笔者曾经遇到过一些设计问题:

**1、** 日志表主键设为int类型，数据量达到2147483647的时候，insert数据直接报错，导致生产环境不可用；

**2、** 订单主表反范式设计，多达100多列，导致生产环境锁非常多；

**3、** 建表的时候未指定notnull，存储了过多且不必要的null值；

**4、** 整数类型一律用int，浪费诸多存储空间；

…

## 二.选择优化的数据类型

MySQL数据类型概述可以参考下面笔者的博客:

[MySQL 8.0 数据类型小结](https://blog.csdn.net/u010520724/article/details/107553913)

### 2.1 整数类型

类型
存储(字节)
最小(有符号)
最大(有符号)
最小(无符号)
最大(无符号)
描述

BIT(M)
(m+7)/8
—
—
—
—
位值类型。M表示每个值的位数，从1到64.如果M省略，默认是1。比如bit(8)存储888变为00000111

TINYINT(M)
1
-128
127
0
255

SMALLINT(M)
2
-32768
32767
0
65535

MEDIUMINT(M)
3
-8388608
8388607
0
16777215

INT,INTEGER(M)
4
-2147483648
2147483647
0
4294967295

BIGINT(M)
8
-2^63
2^63 -1
0
2^64

DECIMAL
变长（0-4个字节）
M为总位数(精度)，D为小数点后的位数(刻度)。如果D为0，则值没有小数部分。最大(M)是65。最大(D)为30.如果省略D，D的默认值为0,。如果省略M，M的默认值为10. NUMBERIC的实现是DECIMAL

NUMBERIC
变化
同上

FLOAT(M,D)
4
M是总位数，D是小数点后面的位数。如果M和D省略，则将值存储到硬件允许的限制。单精度浮点精确到7位小数。
正区间- [ –3.402823466E38 , –1.175494351E-38 ]
负区间-[ 1.175494351E-38 , 3.402823466E38]

DOUBLE(M,D)
8
M是总位数，D是小数点后面的位数。如果M和D省略，则将值存储到硬件允许的限制。单精度浮点精确到15位小数。
正区间-[ –1.7976931348623157E308,–2.2250738585072014E-308 ]
负区间-[ 2.2250738585072014E-308 , 1.7976931348623157E308 ]

BOOL,BOOLEAN
1
TINYINT(1)的同义词

有两种类型的数字：整数（whole number）和实数（real number）。如果存储整数，可以使用这几种整数类型：TINYINT，SMALLINT，MEDIUMINT，INT，BIGINT。分别使用1字节、2字节、3字节、4字节、8字节。

整数类型有可选的UNSIGNED属性，表示不允许负值，这大致可以使正数的上限提高一倍。例如TINYINT UNSIGNED可以存储的范围是0～255，而TINYINT的存储范围是−128～127。

**更小的通常更好**

例如枚举类的， 选择 tinyint、smallint即可，节省磁盘空间就是优化。

其它的业务相关表，例如用户表、订单表 可以选择用 int类型。

虽然int类型不支持小数，但是例如金额这个，可以通过调整单位，例如单位为分，这样就可以存小数金额了

对于一些大的日志表、分布式ID之类的，可以选择bigint类型

### 2.2 实数类型

实数是带有小数部分的数字。然而，它们不只是为了存储小数部分；也可以使用DECIMAL存储比BIGINT还大的整数。MySQL既支持精确类型，也支持不精确类型。

FLOAT和DOUBLE类型支持使用标准的浮点运算进行近似计算。如果需要知道浮点运算是怎么计算的，则需要研究所使用的平台的浮点数的具体实现。

DECIMAL类型用于存储精确的小数。

### 2.3 字符类型

**VARCHAR和CHAR类型**

类型
存储(字节)
范围
用途

CHAR(M)
M
0 - 255
存储定长的字符

VARCHAR(M)
VARCHAR(10) 实际存储3个字符，1个字节来存储长度，总共占4字节
 VARCHAR(1000) 实际存储3个字符，2个字节来存储长度，总共占5字节
 不同的存储引擎可能存在一定的差异
0-65536
存储可变长度的字符串

**1、** 类型选择问题；

很多时候，开发同事为了方便，直接用varchar(200) 来存储字符，不考虑实际需求。

这样做，存在诸多弊端。

如果是md5密码这样的定长字段，如果用varchar类型，会浪费一定的存储空间。

如果存储的字符只有5个，而这时都用varchar(200)，感觉存储空间是一样的。但是程序端读取的时候，varchar(200)会消耗更多的内存。

**2、** 变长字符的更新问题；

InnoDB存储引擎

varchar由于是变长，遇到更新的时候，如果比原先的长度长很多，这个时候页的空间不够，会分裂页，此时会比较消耗性能

**BLOB和TEXT类型**

类型
描述

TINYBLOB
最大长度255(2^8-1)，使用1字节前缀存储长度信息

BLOB
最大长度65，535(2^16-1),使用2字节前缀存储长度信息

MEDIUMBLOB
最大长度16，777,215（2^24-1）,使用3字节前缀存储长度信息

LONGBLOB
最大长度（2^32-1）或4GB,使用4字节前缀存储长度信息

TINYTEXT
最大长度255(2^8-1)，使用1字节前缀存储长度信息

TEXT
最大长度65，535(2^16-1),使用2字节前缀存储长度信息

MEDIUMTEXT
最大长度16，777,215（2^24-1）,使用3字节前缀存储长度信息

LONGTEXT
最大长度（2^32-1）或4GB,使用4字节前缀存储长度信息

BLOB是SMALLBLOB的同义词

TEXT是SMALLTEXT的同义词

MySQL把每个BLOB和TEXT当做一个独立的对象处理。

当BLOB和TEXT值太大时，InnoDB会使用专门的外部存储区域来进行存储，此时每个值在行内需要1-4个值存储一个指针，然后在外部存储区域存储实际的值

BLOB和TEXT家族之间仅有的不同是BLOB类型存储的是二进制数据，没有排序规则或字符集，而TEXT类型有字符集和排序规则。

### 2.4 日期和时间类型

类型
存储(字节)
范围
格式
用途

DATE
3
1000-01-01/9999-12-31
YYYY-MM-DD
日期值

TIME
3
‘-838:59:59’/‘838:59:59’
HH:MM:SS
时间值或持续时间

YEAR
1
1901/2155
YYYY
年份值

DATETIME
8
1000-01-01 00:00:00/9999-12-31 23:59:59
YYYY-MM-DD HH:MM:SS
混合日期和时间值

TIMESTAMP
4
1970-01-01 00:00:00/2038
YYYYMMDD HHMMSS
混合日期和时间值，时间戳

关于时间类型的选择:

**1、** 如果只存年，用YEAR类型；

**2、** 如果只存年月日，用DATE；

**3、** 如果需要存年月日时分秒，用TIMESTAMP；

不要被这个2038年给吓到了，而不用TIMESTAMP，其实更节约存储空间，且能容纳时区信息

**4、** 不用将TIMESTAMP转换为数值；

FROM_UNIXTIME() – 把数值转换为时间戳

UNIX_TIMESTAMP() – 把时间戳转换为数值

转换感觉是节省了空间，不过处理起来非常的不方便，不推荐使用

### 2.5 其它类型

一个例子是一个IPv4地址。人们经常使用VARCHAR（15）列来存储IP地址。然而，它们实际上是32位无符号整数，不是字符串。用小数点将地址分成四段的表示方法只是为了让人们阅读容易。所以应该用无符号整数存储IP地址。MySQL提供INET_ATON()和INET_NTOA()函数在这两种表示方法之间转换。

一个例子是枚举ENUM和SET类型，实际生产中使用较少，暂不考虑。

一个例子是位BIT类型，可以使用BIT列在一列中存储一个或多个true/false值。BIT（1）定义一个包含单个位的字段，BIT（2）存储2个位，依此类推。BIT列的最大长度是64个位。

## 三.范式和反范式

MySQL的OLAP会弱于传统的Oracle、Postgresql，所以很多时候设计的时候，需要考虑使用反范式，减少表之间的连接，但是凡事都有个度，过而不及。笔者就见过为了查询方便，开发设计的业务表都是反范式的，不但冗余多，遇到并发上来之后，锁表现象也频繁发生。

**范式的优点和缺点:**

优点:

**1、** 范式化的更新操作通常比反范式化要快；

**2、** 当数据较好地范式化时，就只有很少或者没有重复数据，所以只需要修改更少的数据；

**3、** 范式化的表通常更小，可以更好地放在内存里，所以执行操作会更快；

**4、** 很少有多余的数据意味着检索列表数据时更少需要DISTINCT或者GROUPBY语句；

缺点:
范式化设计的schema的缺点是通常需要关联。稍微复杂一些的查询语句在符合范式的schema上都可能需要至少一次关联，也许更多。这不但代价昂贵，也可能使一些索引策略无效。例如，范式化可能将列存放在不同的表中，而这些列如果在一个表中本可以属于同一个索引。

**反范式的优点和缺点**

优点:
反范式化的schema因为所有数据都在一张表中，可以很好地避免关联。

缺点:

**1、** 数据冗余；

**2、** 更新操作慢；

**混用范式化和反范式化**

范式化和反范式化的schema各有优劣，怎么选择最佳的设计？

事实是，完全的范式化和完全的反范式化schema都是实验室里才有的东西：在真实世界中很少会这么极端地使用。在实际应用中经常需要混用，可能使用部分范式化的schema、缓存表，以及其他技巧。

例如有两张表，一个是申请表，一个是申请的流程日志表，我们需要知道申请单最后一个审批的人，那么每次都需要在申请流程日志表中进行group by然后求最后一个审批记录。这样不但sql复杂，且性能慢。比较好的方法是申请表在满足范式的情况下，新增一列最后审批人字段，通过反范式进行冗余。

## 四.计数器表

这个案例来自《高性能MySQL》 ，真的太厉害了，之前遇到类似的问题，都不知道如何优化。

如果应用在表中保存计数器，则在更新计数器时可能碰到并发问题。计数器表在Web应用中很常见。可以用这种表缓存一个用户的朋友数、文件下载次数等。创建一张独立的表存储计数器通常是个好主意，这样可使计数器表小且快。使用独立的表可以帮助避免查询缓存失效，并且可以使用本节展示的一些更高级的技巧。

应该让事情变得尽可能简单，假设有一个计数器表，只有一行数据，记录网站的点击次数：

```java
mysql> CREATE TABLE hit_counter (
        -> cnt int unsigned not null
        -> ) ENGINE=InnoDB;
```

网站的每次点击都会导致对计数器进行更新：

```java
mysql> UPDATE hit_counter SET cnt = cnt + 1;
```

问题在于，对于任何想要更新这一行的事务来说，这条记录上都有一个全局的互斥锁（mutex）。这会使得这些事务只能串行执行。要获得更高的并发更新性能，也可以将计数器保存在多行中，每次随机选择一行进行更新。这样做需要对计数器表进行如下修改：

```java
mysql> CREATE TABLE hit_counter (
-> slot tinyint unsigned not null primary key,
-> cnt int unsigned not null
-> ) ENGINE=InnoDB;
```

然后预先在这张表增加100行数据。现在选择一个随机的槽（slot）进行更新：

```java
mysql> UPDATE hit_counter SET cnt = cnt + 1 WHERE slot = ceil(RAND() * 100);
```

要获得统计结果，需要使用下面这样的聚合查询：

```java
mysql> SELECT SUM(cnt) FROM hit_counter;
```

一个常见的需求是每隔一段时间开始一个新的计数器（例如，每天一个）。如果需要这么做，则可以再简单地修改一下表设计：

```java
mysql> CREATE TABLE daily_hit_counter (
-> day date not null,
-> slot tinyint unsigned not null,
-> cnt int unsigned not null,
-> primary key(day, slot)
-> ) ENGINE=InnoDB;
```

在这个场景中，可以不用像前面的例子那样预先生成行，而用ON DUPLICATE KEY UPDATE代替：

```java
mysql> INSERT INTO daily_hit_counter(day, slot, cnt)
-> VALUES(CURRENT_DATE, ceil(RAND() * 100), 1)
-> ON DUPLICATE KEY UPDATE cnt = cnt + 1;
```

如果希望减少表的行数，以避免表变得太大，可以写一个周期执行的任务，合并所有结果到0号槽，并且删除所有其他的槽：

```java
mysql> UPDATE daily_hit_counter as c
-> INNER JOIN (
-> SELECT day, SUM(cnt) AS cnt, MIN(slot) AS mslot
-> FROM daily_hit_counter
-> GROUP BY day
-> ) AS x USING(day)
-> SET c.cnt = IF(c.slot = x.mslot, x.cnt, 0),
-> c.slot = IF(c.slot = x.mslot, 0, c.slot);
mysql> DELETE FROM daily_hit_counter WHERE slot <> 0 AND cnt = 0;
```

## 五.加快ALTER TABLE操作的速度

MySQL的ALTER TABLE操作的性能对大表来说是个大问题。MySQL执行大部分修改表结构操作的方法是用新的结构创建一个空表，从旧表中查出所有数据插入新表，然后删除旧表。这样操作可能需要花费很长时间，如果内存不足而表又很大，而且还有很多索引的情况下尤其如此。许多人都有这样的经验，ALTER TABLE操作需要花费数个小时甚至数天才能完成。

虽然从MySQL 5.6开始支持online DDL，不需要停机，但是每次版本发布的时候，一个团队的人员都在等着DDL的完成，然后验证。

那么有没有什么方法能加快ALTER TABLE操作的速度呢?

办法当然是有，一般有如下三种方法:

**1、** 预留列；

**2、** 更改表定义文件；

**3、** MySQL8.0快速加列；

### 5.1 预留列

对于一些主表，例如订单表、客户表等，可以在create table或Online DDL的时候，直接新增2-3个预留列，字段类型最好选择varchar类型，这样无论是存储数值、字符、时间类型，都是可行的。当后面的变更需要新增列的时候，可以将预留列进行改名，直接使用。

代码:

```java
create table t1(id int not null,name varchar(100) not null,reserved1 varchar(200),reserved2 varchar(200));
-- 遇到变更，需要新增列身份证号
alter table t1 change reserved1 idcard varchar(200);
```

测试记录:

```java
mysql> create table t1(id int not null,name varchar(100) not null,reserved1 varchar(200),reserved2 varchar(200));
Query OK, 0 rows affected (0.02 sec)
mysql> 
mysql> desc t1;
+-----------+--------------+------+-----+---------+-------+
| Field     | Type         | Null | Key | Default | Extra |
+-----------+--------------+------+-----+---------+-------+
| id        | int(11)      | NO   |     | NULL    |       |
| name      | varchar(100) | NO   |     | NULL    |       |
| reserved1 | varchar(200) | YES  |     | NULL    |       |
| reserved2 | varchar(200) | YES  |     | NULL    |       |
+-----------+--------------+------+-----+---------+-------+
4 rows in set (0.00 sec)
mysql> alter table t1 change reserved1 idcard varchar(200);
Query OK, 0 rows affected (0.00 sec)
Records: 0  Duplicates: 0  Warnings: 0
mysql> desc t1;
+-----------+--------------+------+-----+---------+-------+
| Field     | Type         | Null | Key | Default | Extra |
+-----------+--------------+------+-----+---------+-------+
| id        | int(11)      | NO   |     | NULL    |       |
| name      | varchar(100) | NO   |     | NULL    |       |
| idcard    | varchar(200) | YES  |     | NULL    |       |
| reserved2 | varchar(200) | YES  |     | NULL    |       |
+-----------+--------------+------+-----+---------+-------+
4 rows in set (0.00 sec)
mysql> 
```

### 5.2 更改表定义文件

对于一些需要修改列的属性，例如 由varchar(100)增加到varchar(200),通过ALTER语句耗时非常久，此时可以修改表定义文件快速完成。

步骤如下:

**1、** 创建一个新的空表，表结构同需要变更的表；

**2、** 对新表进行alter操作；

**3、** flushtableswithreadlock;；

**4、** 替换新表与需要变更的表的表定义文件；

**5、** unlocktables;；

我们先来看看，给一个大表进行DDL需要多长时间。

从下面的测试我们可以看到，给一个7亿多条数据的表进行DDL操作，耗时一个小时4分钟。

```java
mysql> select count(*) from fact_sale;
+-----------+
| count(*)  |
+-----------+
| 767830000 |
+-----------+
1 row in set (2 min 29.23 sec)
mysql> 
mysql> alter table fact_sale modify prod_name varchar(100) not null;
Query OK, 767830000 rows affected (1 hour 4 min 0.83 sec)
Records: 767830000  Duplicates: 0  Warnings: 0
```

下面我们使用修改表定义的方法

代码:

```java
CREATE TABLE  fact_sale_new like fact_sale;
alter table fact_sale_new modify prod_name varchar(200) not null;
flush tables with read lock;
-- os层操作
mv fact_sale.frm fact_sale.frm.bak
mv fact_sale_new.frm fact_sale.frm
mv fact_sale.frm.bak fact_sale_new.frm
unlock tables;
```

测试记录:

```java
mysql> 
mysql>` CREATE TABLE fact_sale_new (
    ->`   id bigint(8) NOT NULL AUTO_INCREMENT,
    ->`   sale_date timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    ->`   prod_name varchar(200) NOT NULL,
    ->`   sale_nums int(11) DEFAULT NULL,
    ->`   PRIMARY KEY (id)
    -> ) ENGINE=InnoDB AUTO_INCREMENT=787621598 DEFAULT CHARSET=utf8;
Query OK, 0 rows affected (0.01 sec)
mysql> 
mysql> flush tables with read lock;
Query OK, 0 rows affected (0.00 sec)
mysql> 
mysql> unlock tables;
Query OK, 0 rows affected (0.00 sec)
mysql> 
mysql> show create table fact_sale\G
*************************** 1. row ***************************
       Table: fact_sale
Create Table: CREATE TABLE fact_sale (
  id bigint(8) NOT NULL AUTO_INCREMENT,
  sale_date timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  prod_name varchar(200) NOT NULL,
  sale_nums int(11) DEFAULT NULL,
  PRIMARY KEY (id)
) ENGINE=InnoDB AUTO_INCREMENT=787621598 DEFAULT CHARSET=utf8
1 row in set (0.00 sec)
mysql> show create table fact_sale_new\G
*************************** 1. row ***************************
       Table: fact_sale_new
Create Table: CREATE TABLE fact_sale_new (
  id bigint(8) NOT NULL AUTO_INCREMENT,
  sale_date timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  prod_name varchar(100) NOT NULL,
  sale_nums int(11) DEFAULT NULL,
  PRIMARY KEY (id)
) ENGINE=InnoDB AUTO_INCREMENT=787621598 DEFAULT CHARSET=utf8
1 row in set (0.00 sec)
mysql> 
```

### 5.3 MySQL 8.0 快速加列

#### 5.3.1 快速加列支持类型

官方文档列出了一些可以快速DDL的操作，大体包括:

```java
修改索引类型
Add column 
  当一条alter语句中同时存在不支持instant的ddl时，则无法使用
  只能顺序加列
  不支持压缩表、不支持包含全文索引的表
  不支持临时表，临时表只能使用copy的方式执行DDL
  不支持那些在数据词典表空间中创建的表
修改/删除列的默认值、修改索引类型
修改ENUM/SET类型的定义
  存储的大小不变时
  向后追加成员
增加或删除类型为virtual的generated column
RENAME TABLE操作
```

#### 5.3.2 立刻加列的限制

虽然立刻加列这一特性十分好用，但也存在着一些限制：

```java
1、当一条alter语句中同时存在不支持instant的ddl时，则无法使用
2、只能顺序加列
3、不支持压缩表、不支持包含全文索引的表，不支持临时表
4、不支持那些在数据词典表空间中创建的表
5、修改ENUM/SET类型的定义时，存储的大小不变，向后追加成员
```

#### 5.3.3 立刻加列的实现

立刻加列时，只会变更数据字典中的内容：在列定义中增加新列的定义，增加新列的默认值。(information_schema.INNODB_TABLES,information_schema.INNODB_COLUMNS)

立刻加列后，当要读取表中的数据时：由于立刻加列没有变更行数据，读取的行数据为原列数对应的数据；MySQL会将新增的列的默认值，追加到读取的数据后面。

当读取数据行时，通过判断数据行的头信息中的instant 标志位，可以知道该行的格式是 “新格式”：该行头信息后有一个新字段 "列数"通过读取数据行的 “列数” 字段，可以知道该行数据中多少列有"真实"的数据，从而按列数读取数据。

快速加列特性，在增加列时，实际上只是修改了元数据，原来存储在文件中的行记录并没有被修改。当行格式为redundent类型时，记录解析是不依赖元数据的，可以自解析，但如果行格式是dynamic或者compact类型，由于行内不存储元数据，尤其是列的个数信息，其记录的解析需要依赖元数据的辅助。因此为了支持动态加列功能，会对行格式做一定的修改。

**大体思路如下：**

如果表上从未发生过instant add column, 则行格式维持不变；如果发生过instant ddl, 那么所有新的记录上都被特殊标记了一个flag, 同时在行内存储了列的个数；由于只支持往后顺序加列，通过列的个数就可以知道这个行记录中包含了哪些列的信息。

**MySQL 5.7**

```java
mysql> select count(*) from fact_sale;
+-----------+
| count(*)  |
+-----------+
| 767830000 |
+-----------+
1 row in set (2 min 28.01 sec)
mysql> 
mysql> show create table fact_sale\G
*************************** 1. row ***************************
       Table: fact_sale
Create Table: CREATE TABLE fact_sale (
  id bigint(8) NOT NULL AUTO_INCREMENT,
  sale_date timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  prod_name varchar(200) NOT NULL,
  sale_nums int(11) DEFAULT NULL,
  PRIMARY KEY (id)
) ENGINE=InnoDB AUTO_INCREMENT=787621598 DEFAULT CHARSET=utf8
1 row in set (0.00 sec)
mysql> alter table fact_sale add column reserverd1 varchar(100);
Query OK, 0 rows affected (15 min 33.13 sec)
Records: 0  Duplicates: 0  Warnings: 0
```

**MySQL 8.0:**

```java
mysql> select count(*) from fact_sale;
+-----------+
| count(*)  |
+-----------+
| 767830000 |
+-----------+
1 row in set (1 min 4.25 sec)
mysql> 
mysql> 
mysql> 
mysql> show create table fact_sale\G
*************************** 1. row ***************************
       Table: fact_sale
Create Table: CREATE TABLE fact_sale (
  id bigint NOT NULL AUTO_INCREMENT,
  sale_date timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  prod_name varchar(200) NOT NULL,
  sale_nums int DEFAULT NULL,
  PRIMARY KEY (id)
) ENGINE=InnoDB AUTO_INCREMENT=787621598 DEFAULT CHARSET=utf8mb3
1 row in set (0.01 sec)
mysql> 
mysql> alter table fact_sale add column reserverd1 varchar(100);
Query OK, 0 rows affected (0.04 sec)
Records: 0  Duplicates: 0  Warnings: 0
```
