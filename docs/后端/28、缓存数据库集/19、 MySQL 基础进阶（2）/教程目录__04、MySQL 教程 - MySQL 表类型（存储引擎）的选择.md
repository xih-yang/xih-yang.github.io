# 04、MySQL 教程 - MySQL 表类型（存储引擎）的选择
- 来源：https://ddkk.com/zhuanlan/db/mysql/7/4.html
- 分类：缓存数据库
- 分组：教程目录
## 一、MySQL存储引擎简介

MySQL支持多种存储引擎，以适用于不同领域的数据库应用需要，用户可以根据需要进行选择甚至是定制自己的引擎以提高应用效率。

使用如下命令查看当前版本mysql支持的存储引擎：

```java
mysql> show engines \G
*************************** 1. row ***************************
      Engine: InnoDB
     Support: DEFAULT
     Comment: Supports transactions, row-level locking, and foreign keys
Transactions: YES
          XA: YES
  Savepoints: YES
*************************** 2. row ***************************
      Engine: MRG_MYISAM
     Support: YES
     Comment: Collection of identical MyISAM tables
Transactions: NO
          XA: NO
  Savepoints: NO
*************************** 3. row ***************************
      Engine: MEMORY
     Support: YES
     Comment: Hash based, stored in memory, useful for temporary tables
Transactions: NO
          XA: NO
  Savepoints: NO
*************************** 4. row ***************************
      Engine: BLACKHOLE
     Support: YES
     Comment: /dev/null storage engine (anything you write to it disappears)
Transactions: NO
          XA: NO
  Savepoints: NO
*************************** 5. row ***************************
      Engine: MyISAM
     Support: YES
     Comment: MyISAM storage engine
Transactions: NO
          XA: NO
  Savepoints: NO
*************************** 6. row ***************************
      Engine: CSV
     Support: YES
     Comment: CSV storage engine
Transactions: NO
          XA: NO
  Savepoints: NO
*************************** 7. row ***************************
      Engine: ARCHIVE
     Support: YES
     Comment: Archive storage engine
Transactions: NO
          XA: NO
  Savepoints: NO
*************************** 8. row ***************************
      Engine: PERFORMANCE_SCHEMA
     Support: YES
     Comment: Performance Schema
Transactions: NO
          XA: NO
  Savepoints: NO
*************************** 9. row ***************************
      Engine: FEDERATED
     Support: NO
     Comment: Federated MySQL storage engine
Transactions: NULL
          XA: NULL
  Savepoints: NULL
9 rows in set (0.00 sec)
```

在使用MySQL创建新表的时候，如果没有指定存储引擎，那么系统会使用默认的存储引擎，MySQL5.5之前的默认存储引擎是MyISAM，之后改成了InnoDB。使用如下命令查看当前默认存储引擎：

```java
mysql> show variables like '%storage_engine%';
+----------------------------------+--------+
| Variable_name                    | Value  |
+----------------------------------+--------+
| default_storage_engine           | InnoDB |
| default_tmp_storage_engine       | InnoDB |
| disabled_storage_engines         |        |
| internal_tmp_disk_storage_engine | InnoDB |
+----------------------------------+--------+
4 rows in set, 1 warning (0.00 sec)
```

在创建新表的时候如果不想用默认的存储引擎，可以使用关键字ENGINE显示的指定存储引擎类型，下面ai表的存储引擎定义为MyISAM，country表的引擎定义为InnoDB：

```java
mysql> create table ai (i bigint(20) not null auto_increment,primary key (i) ) engine=MyISAM default charset=gbk;
Query OK, 0 rows affected (0.01 sec)
mysql> create table country (country_id smallint unsigned not null auto_increment,country varchar(50) not null,
    -> last_update timestamp not null default current_timestamp on update current_timestamp,
    -> primary key (country_id) )
    -> engine=InnoDB default charset=gbk;
Query OK, 0 rows affected (0.02 sec)
```

如果对于一个已经存在的表想要更改它的存储引擎，可以使用alter语句：

```java
mysql> alter table ai engine=innodb;
Query OK, 0 rows affected (0.03 sec)
Records: 0  Duplicates: 0  Warnings: 0
```

查看表的详细信息：

```java
mysql> show create table ai \G;
*************************** 1. row ***************************
       Table: ai
Create Table: CREATE TABLE ai (
  i bigint(20) NOT NULL AUTO_INCREMENT,
  PRIMARY KEY (i)
) ENGINE=InnoDB DEFAULT CHARSET=gbk
1 row in set (0.00 sec)
```

定义好表的存储引擎后就可以使用该引擎的相关特性。

## 二、各存储引擎的特性

这里主要介绍最常用的几种引擎：

#### 2.1 MyISAM

MyISAM不支持事务和外键，其优势是访问速度快，所以对事务完整性没有要求或者以SELECT、INSERT为主的应用基本上可以用这个引擎来创建表。

每个MyISAM类型的表在磁盘上都会存储为3个文件，文件名都和表名一样，扩展名分别为：

- .frm （存储表定义）
- .MYD (MYData，存储数据）
- .MYI（MYIndex，存储索引）

数据文件和索引文件可以放置在不同的目录，平均分布IO，获得更快的速度；如果需要指定具体的目录，在创建表的时候可以通过 DATA DIRECTORY 和 INDEX DIRECTORY 语句指定，但是需要注意，路径必须是绝对路径且具有访问权限。

MyISAM类型的表可能会损坏，造成的原因很多，损坏后会造成以下情况：表可能无法访问；提示你需要修复；访问后返回错误的结果；数据库异常重新启动等等。这时候我们就需要对表进行修复，CHECK TABLE 语句来检测MyISAM表的健康状况，REPAIR TABLE 语句来修复。（具体修复过程及查找损坏原因后面再介绍）

MyISAM表的3种不同存储格式，分别是：

- 静态表（固定长度）；
- 动态表；
- 压缩表；

关于这些表的具体介绍就不多说明，这跟数据结构里面的一些存储规则很类似，这里仅仅说一下需要注意的一些点：

**1、** 在静态表中查询数据会在返回之前将后面的空格删除：；

```java
mysql> create table myisam_char(name char(10)) engine=myisam;
Query OK, 0 rows affected (0.01 sec)
mysql> insert into myisam_char values('abcde'),('abcde  '),('  abcde'),('  abcde  ');
Query OK, 4 rows affected (0.00 sec)
Records: 4  Duplicates: 0  Warnings: 0
mysql> select name,length(name) from myisam_char;
+---------+--------------+
| name    | length(name) |
+---------+--------------+
| abcde   |            5 |
| abcde   |            5 |
|   abcde |            7 |
|   abcde |            7 |
+---------+--------------+
4 rows in set (0.00 sec)
```

从上面的例子可以看出MyISAM类型的静态表在存储的时候会按照指定的列的宽度来向后补足空格，但是在应用访问的时候会返回去掉后面空格的数据，因此在存储的数据前后有空格时需要注意，数据后面的空格会被一并抹除掉，前面的空格则会保留。

**2、** 频繁的更新和删除动态表的记录会产生碎片，因此需要定期执行OPTIMIZETABLE语句或myisamchr-r命令来改善性能；

**3、** 压缩表由myisampack工具创建；

#### 2.2 InnoDB

InnoDB是MySQL里面默认的存储引擎，也是使用的最多的存储引擎；它提供了具有提交、回滚和崩溃恢复能力的事务安全性能，但相对于MyISAM存储引擎，InnoDB写的处理效率差一些，而且会占用更多的磁盘空间以保留数据和索引。

**1. 自增长列**

InnoDB表的自增长列可以手动插入，如果忽略或是插入0或空值 ，则实际上该列还是会自动增长，看下面的例子：

```java
mysql> create table autoincre_demo (i smallint not null auto_increment,name varchar(10),primary key(i))engine=innodb;
Query OK, 0 rows affected (0.02 sec)
mysql> insert into autoincre_demo values(1,'1'),(0,'2'),(null,'3');
Query OK, 3 rows affected (0.00 sec)
Records: 3  Duplicates: 0  Warnings: 0
mysql> select * from autoincre_demo;
+---+------+
| i | name |
+---+------+
| 1 | 1    |
| 2 | 2    |
| 3 | 3    |
+---+------+
3 rows in set (0.00 sec)
```

自增长列的起始值默认从1开始，如果想要从别的值开始可以用语句 ALTER TABLE *** AUTO_INCREMENT = n 来指定，但是需要注意，**该语句强制指定的初始值是保存在内存中的，一旦数据库重新启动就需要重新设置**。

可以使用**LAST_INSERT_ID()**来查询当前线程最后插入记录使用的值：

```java
mysql> insert into autoincre_demo values(4,'4');
Query OK, 1 row affected (0.00 sec)
mysql> select LAST_INSERT_ID();   这里需要解释以下为什么这里查出来的记录是2，因为这个查询只会查到上一次的insert或update语句更改的最新记录，但是它需要是自动增长的才算，手动指定的不算，比如这里手动指定的记录4就不算，而上面手动指定的0或null被自动增长代替，所以算作自增，因此此处结果为2.
+------------------+
| LAST_INSERT_ID() |
+------------------+
|                2 |
+------------------+
1 row in set (0.00 sec)
mysql> insert into autoincre_demo(name) values('5'),('6'),('7');  这里没有指定自增长列，它是自己增长的，因而查询结果为当前多条数据的第一条自增长列对应的值，也就是5。
Query OK, 3 rows affected (0.00 sec)
Records: 3  Duplicates: 0  Warnings: 0
mysql> select LAST_INSERT_ID();
+------------------+
| LAST_INSERT_ID() |
+------------------+
|                5 |
+------------------+
1 row in set (0.00 sec)
下面几个例子就很好的证明了上面的结论
mysql> insert into autoincre_demo values(8,'8');
Query OK, 1 row affected (0.01 sec)
mysql> select LAST_INSERT_ID();
+------------------+
| LAST_INSERT_ID() |
+------------------+
|                5 |
+------------------+
1 row in set (0.00 sec)
mysql> insert into autoincre_demo values(9,'9');
Query OK, 1 row affected (0.00 sec)
mysql> select LAST_INSERT_ID();
+------------------+
| LAST_INSERT_ID() |
+------------------+
|                5 |
+------------------+
1 row in set (0.00 sec)
mysql> insert into autoincre_demo(name) values('10');
Query OK, 1 row affected (0.01 sec)
mysql> select LAST_INSERT_ID();
+------------------+
| LAST_INSERT_ID() |
+------------------+
|               10 |
+------------------+
1 row in set (0.00 sec)
```

这里必须提一点，**对于InnoDB表，自增长列必须是索引，且排在第一列，如果是作为组合索引，它也必须组合索引的第一列**。但是对于MyISAM表就不必，它的自增长列可以是组合索引的其他列，此时的自增就会先按照第一索引进行排序后再自增，如下面的例子：

```java
mysql> create table autoincre_demo2(d1 smallint not null auto_increment,d2 smallint not null,name varchar(10),index(d2,d1))engine=myisam;
Query OK, 0 rows affected (0.01 sec)
mysql> insert into autoincre_demo2(d2,name) values(2,'2'),(3,'3'),(4,'4'),(2,'2'),(3,'3'),(4,'4');
Query OK, 6 rows affected (0.00 sec)
Records: 6  Duplicates: 0  Warnings: 0
mysql> select * from autoincre_demo2;
+----+----+------+
| d1 | d2 | name |
+----+----+------+
|  1 |  2 | 2    |
|  1 |  3 | 3    |
|  1 |  4 | 4    |
|  2 |  2 | 2    |
|  2 |  3 | 3    |
|  2 |  4 | 4    |
+----+----+------+
6 rows in set (0.00 sec)
```

**2. 外键约束**

MySQL中只有InnoDB支持外键，在创建外键时要求父表必须要有对应的索引。下面创建一个country表作为父表，city表作为子表，country_id作为外键：

```java
由于country表之前创建过，这里就显示一下它的结构
mysql> show create table country \G;
*************************** 1. row ***************************
       Table: country
Create Table: CREATE TABLE country (
  country_id smallint(5) unsigned NOT NULL AUTO_INCREMENT,
  country varchar(50) NOT NULL,
  last_update timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (country_id)
) ENGINE=InnoDB DEFAULT CHARSET=gbk
1 row in set (0.00 sec)
mysql> create table city (city_id smallint unsigned not null auto_increment,
    -> city varchar(50) not null,country_id smallint unsigned not null,
    -> last_update timestamp not null default current_timestamp on update current_timestamp,
    -> primary key(city_id),key idx_fk_country_id (country_id),
    -> foreign key (country_id) references country (country_id) on delete restrict on update cascade)engine=innodb default charset=utf8;
Query OK, 0 rows affected (0.03 sec)
```

关键字RESTRICT和NO ACTION相同，作用是拒绝父表的的更新删除操作（如果子表有关联记录的情况下）；CASCADE表示父表在更新或删除时，同时对子表对应的记录进行同样操作；SET NULL则表示父表在更新或删除操作时，子表的对应字段被置为空。后两种要谨慎使用，因为会导致数据丢失。

因为外键的存在导致表之间联系比较紧密，在导入表数据或者修改表结构时往往由于这种联系导致速度较慢，此时我们可以暂时关闭外键的检查来加快处理速度，关闭的命令为：SET FOREIGN_KEY_CHECKS = 0；执行完之后通过命令：SET CHECK_FOREIGN_KEY = 1 ；改回原来的状态。

对InnoDB类型的表，通过使用show table status命令来显示包含外键的表的状态信息：

```java
mysql> show table status like 'city' \G;
*************************** 1. row ***************************
           Name: city
         Engine: InnoDB
        Version: 10
     Row_format: Dynamic
           Rows: 0
 Avg_row_length: 0
    Data_length: 16384
Max_data_length: 0
   Index_length: 16384
      Data_free: 0
 Auto_increment: 1
    Create_time: 2018-12-17 16:07:17
    Update_time: NULL
     Check_time: NULL
      Collation: utf8_general_ci
       Checksum: NULL
 Create_options:
        Comment:
1 row in set (0.00 sec)
```

**3. 存储方式**

InnoDB存储表和索引主要有两种方式：

- 使用共享表空间存储，数据和索引保存在innodb_data_home_dir和innodb_data_file_path定义的表空间中，可以是多个文件。
- 使用多表空间存储，每个表的数据和索引单独保存在.ibd中。如果是分区表，则每个分区对应单独的.ibd文件，文件名时“表名+分区名”，可以在创建分区的时候指定每个分区的数据文件的位置，以此将表的IO均匀的分布在多个磁盘上。

一般都使用的共享表存储，如果要使用多表空间存储需要设置参数 innodb_file_per_table，并且需要重启服务后才可以对新建的表生效，但原来的表仍使用共享表空间存储；

多表空间的数据文件没有大小限制，不需要设置初始大小等一些其它限制参数；

使用多表空间特性的表，可以方便的进行单表备份和恢复操作，但不能直接复制.ibd文件，因为还有一些东西在共享表空间里，可以通过以下命令“ ALTER TABLE tb1_name DISCARD TABLESPACE; ALTER TABLE tb1_name IMPORT TABLESPACE;" 进行备份和恢复，但是只能恢复到原来所在的数据库中，如果想要恢复到别的数据库需要通过mysqldump和mysqlimport来实现。

**注意：即使在多表空间的存储方式下，共享表空间仍然是必须的，因为InnoDB把内部数据词典和在线重做日志放在这个文件中。**

#### 2.3 MEMORY

MEMORY存储引擎使用内存中的内容来创建表，每个MEMORY表只实际对应一个磁盘文件，格式是.frm。它的访问速度很快，默认采用hash索引，但一旦服务关闭，表中的数据就会丢失。

下面使用city表的记录来创建memory的表，并且指定索引为hash索引还是btree索引：

```java
mysql> create table tab_memory engine=memory select city_id,city,country_id from city group by city_id;
Query OK, 0 rows affected (0.01 sec)
Records: 0  Duplicates: 0  Warnings: 0
mysql> create index men_hash using hash on tab_memory (city_id);
Query OK, 0 rows affected (0.01 sec)
Records: 0  Duplicates: 0  Warnings: 0
mysql> show index from tab_memory \G;
*************************** 1. row ***************************
        Table: tab_memory
   Non_unique: 1
     Key_name: men_hash
 Seq_in_index: 1
  Column_name: city_id
    Collation: NULL
  Cardinality: 0
     Sub_part: NULL
       Packed: NULL
         Null:
   Index_type: HASH
      Comment:
Index_comment:
1 row in set (0.00 sec)
```

如果想把hash索引更换为btree索引，需这样做：

```java
mysql> drop index men_hash on tab_memory;
Query OK, 0 rows affected (0.01 sec)
Records: 0  Duplicates: 0  Warnings: 0
mysql> create index men_hash using btree on tab_memory(city_id);
Query OK, 0 rows affected (0.01 sec)
Records: 0  Duplicates: 0  Warnings: 0
```

如何将memory类型表的数据保存下来？我们在启动MySQL时需要使用--init-file选项，把把各种表单数据操作语句放入到文件中，这样就可以在在服务启动时从持久稳固的数据源装载表。

memory表存储数据的大小受到max_heap_table_size系统变量的约束，初始值为16MB，当然，我们可以根据需要加大，并且在创建memory表时可以通过MAX_ROWS字句指定表的最大行数来限制表的大小。

当memory表不再用的时候需要释放它的内存，应当执行DELETE FROM 或TRUNCATE TABLE 或 DROP TABLE操作。

memory类型的表主要用于那些内容变化不频繁的代码表，或者作为统计的中间结果表；对这种表进行更新操作需要谨慎，应考虑到数据的持久性问题。

#### 2.4 MERGE

MERGE存储引擎是一组MyISAM表的组合，只不过要求MyISAM表的结构必须完全相同，MERGE表本身在磁盘上只有两个文件，一个.frm文件存储表结构，另一个.MRG文件包含组合表的信息。

对MERGE表一些数据上从操作实际上是对内部的MyISAM表进行的，比如插入操作：用INSERT_METHOD子句，它有三个取值，FIRST或LAST表明是插入内部第一个还是最后一个表，NO或者不定义这个子句表示不能执行插入操作。比如DROP操作：只删除MERGE表的定义，对内部的表没有任何影响。

如果通过.MRG文件来修改MERGE表，那需要 FLUSH TABLES 来刷新后才可生效。

下面举个例子：用两个myisam表创建merge表

```java
mysql> create table payment_2006(country_id smallint,payment_date datetime,amount decimal(15,2), key idx_fk_country_id(country_id))engine=myisam;
Query OK, 0 rows affected (0.01 sec)
mysql> create table payment_2007(country_id smallint,payment_date datetime,amount decimal(15,2), key idx_fk_country_id(country_id))engine=myisam;
Query OK, 0 rows affected (0.01 sec)
mysql> create table payment_all(country_id smallint,payment_date datetime,amount decimal(15,2), index(country_id))engine=merge union=(payment_2006,payment_2007) insert_method=last;
Query OK, 0 rows affected (0.01 sec)
```

向myisam表中插入数据：

```java
mysql> insert into payment_2006 values(1,'2006-05-01',100000),(2,'2006-08-15',150000);
Query OK, 2 rows affected (0.00 sec)
Records: 2  Duplicates: 0  Warnings: 0
mysql> insert into payment_2007 values(1,'2007-05-01',350000),(2,'2007-08-15',220000);
Query OK, 2 rows affected (0.00 sec)
Records: 2  Duplicates: 0  Warnings: 0
```

分别查看merge表和myisam表中数据：

```java
mysql> select * from payment_2006;
+------------+---------------------+-----------+
| country_id | payment_date        | amount    |
+------------+---------------------+-----------+
|          1 | 2006-05-01 00:00:00 | 100000.00 |
|          2 | 2006-08-15 00:00:00 | 150000.00 |
+------------+---------------------+-----------+
2 rows in set (0.00 sec)
mysql> select * from payment_2007;
+------------+---------------------+-----------+
| country_id | payment_date        | amount    |
+------------+---------------------+-----------+
|          1 | 2007-05-01 00:00:00 | 350000.00 |
|          2 | 2007-08-15 00:00:00 | 220000.00 |
+------------+---------------------+-----------+
2 rows in set (0.00 sec)
mysql> select * from payment_all;        可以看出merge表是myisam表的集合。
+------------+---------------------+-----------+
| country_id | payment_date        | amount    |
+------------+---------------------+-----------+
|          1 | 2006-05-01 00:00:00 | 100000.00 |
|          2 | 2006-08-15 00:00:00 | 150000.00 |
|          1 | 2007-05-01 00:00:00 | 350000.00 |
|          2 | 2007-08-15 00:00:00 | 220000.00 |
+------------+---------------------+-----------+
4 rows in set (0.00 sec)
```

下面向merge表插入一条数据：

```java
mysql> insert into payment_all values(3,'2006-3-21',112200);
Query OK, 1 row affected (0.00 sec)
mysql> select * from payment_all;
+------------+---------------------+-----------+
| country_id | payment_date        | amount    |
+------------+---------------------+-----------+
|          1 | 2006-05-01 00:00:00 | 100000.00 |
|          2 | 2006-08-15 00:00:00 | 150000.00 |
|          1 | 2007-05-01 00:00:00 | 350000.00 |
|          2 | 2007-08-15 00:00:00 | 220000.00 |
|          3 | 2006-03-21 00:00:00 | 112200.00 |
+------------+---------------------+-----------+
5 rows in set (0.00 sec)
mysql> select * from payment_2007;
+------------+---------------------+-----------+
| country_id | payment_date        | amount    |
+------------+---------------------+-----------+
|          1 | 2007-05-01 00:00:00 | 350000.00 |
|          2 | 2007-08-15 00:00:00 | 220000.00 |
|          3 | 2006-03-21 00:00:00 | 112200.00 |
+------------+---------------------+-----------+
3 rows in set (0.00 sec)
可以看到数据插在了后一个表中，这是由于之前定义的插入方式为last导致的。
```

#### 2.5 TokuDB（第三方存储引擎）

TokuDB是一个高性能、支持事务处理的MySQL和MariaDB的存储引擎，具有高扩展性、高压缩率、高效的写入性能，支持大多数在线DDL操作，其它相关内容可以在其官网（http://www.tokutek.com）进行查看。

根据其性能，我们发现它特别适合以下几种场景：

- 日志数据，因为日志数据通常插入频繁且存储量大；
- 历史数据，通常不会有写操作，可用其高压缩性进行存储；
- 在线DDL较频繁的场景，该引擎增加系统的可用性。

## 三、如何选择合适的存储引擎

根据合适的情况选择相应的引擎，有时候还可以选用多种引擎进行组合。

- MyISAM：如果应用是以读操作和插入操作为主，只有很少的更新和删除操作，并且对事务的完整性、并发性要求不高，那么该引擎很合适。常用在web、数据仓库等环境下；
- InnoDB：如果事务的完整性要求较高，在并发条件下要求数据的一致性，数据操作增删改查都很多，那么该引擎较合适。常用在计费系统、财务系统等对数据准确性要求比较高的系统中；
- MEMORY：数据保存在RAM中，访问速度快，有大小限制，通常用于更新不太频繁的小表或作为中间表快速得到访问结果；
- MERGE：用于将一系列等同的MyISAM表以逻辑方式组合在一起，并作为一个对象引用他们。可以突破对单个MyISAM表的大小限制，并且通过将不同的表分布在多个磁盘上可以有效改善MERGE表的访问效率。对诸如数据仓库等VLDB环境很适合。
