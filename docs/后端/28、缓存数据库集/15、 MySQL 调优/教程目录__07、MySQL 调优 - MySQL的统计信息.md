# 07、MySQL 调优 - MySQL的统计信息
- 来源：https://ddkk.com/zhuanlan/db/mysql/3/7.html
- 分类：缓存数据库
- 分组：教程目录
## 一.InnoDB的统计信息概述

MySQL统计信息是指 数据库通过采样、统计出来的表、索引的相关信息，例如，表的记录数、聚集索引page个数、字段的Cardinality…。MySQL在生成执行计划时,需要根据索引的统计信息进行估算,计算出最低代价（或者说是最小开销）的执行计划.MySQL支持有限的索引统计信息，因存储引擎不同而统计信息收集的方式也不同. MySQL官方关于统计信息的概念介绍几乎等同于无，不过对于已经接触过其它类型数据库的同学而言，理解这个概念应该不在话下。相对于其它数据库而言，MySQL统计信息无法手工删除。MySQL 8.0之前的版本，MySQL是没有直方图的。

InnoDB的统计信息分为持久化统计信息和非持久化统计信息两类。

持久化统计信息在服务器重启期间持久化，从而实现更大的计划稳定性和更一致的查询性能。持久统计信息还提供了控制和灵活性，还有以下额外好处:

**1、** 可以使用innodb_stats_auto_recalc配置选项来控制表发生重大更改后统计信息是否自动更新；

**2、** 您可以在CREATETABLE和ALTERTABLE语句中使用STATS_PERSISTENT、STATS_AUTO_RECALC和STATS_SAMPLE_PAGES子句来配置各个表的优化统计信息；

**3、** 您可以在mysql中查询优化器统计数据mysql.innodb_table_stats和mysql.innodb_index_stats表；

**4、** 可以查看last_update在mysql.innodb_table_stats和mysql.Innodb_index_stats表，查看上一次更新统计信息的时间；

**5、** 您可以手动修改mysql.innodb_table_stats和mysql.Innodb_index_stats表强制执行一个特定的查询优化计划，或者在不修改数据库的情况下测试替代计划；

默认情况下，持久化优化器统计特性是启用的(innodb_stats_persistent=ON)。

非持久性优化器统计信息将在每次服务器重启和一些其他操作之后清除，并在下一次访问表时重新计算。因此，在重新计算统计信息时可能产生不同的估计，从而导致执行计划的不同选择和查询性能的变化。

## 二. 配置持久化优化统计参数

持久化优化器统计特性通过将统计数据存储到磁盘并使它们在服务器重启时持久化来提高计划的稳定性，以便优化器更有可能每次对给定的查询做出一致的选择。

当innodb_stats_persistent=ON或使用STATS_PERSISTENT=1定义单个表时，优化器统计信息将持久化到磁盘。默认启用Innodb_stats_persistent。

### 2.1 为持久优化器统计配置自动统计计算

innodb_stats_auto_recalc变量是默认启用的，它控制当一个表的行发生更改超过10%时是否自动计算统计信息。您还可以在创建或修改表时指定STATS_AUTO_RECALC子句，从而为单个表配置自动统计重新计算。

由于自动统计数据重新计算的异步特性(它发生在后台)，在运行影响一个表10%以上的DML操作后，统计数据可能不会立即重新计算，即使启用了innodb_stats_auto_recalc。在某些情况下，统计数据的重新计算可能会延迟几秒钟。如果立即需要最新的统计信息，则运行ANALYZE TABLE来启动统计信息的同步(前台)重新计算。

如果innodb_stats_auto_recalc被禁用，您可以通过在对索引列进行重大更改后执行ANALYZE TABLE语句来确保优化器统计数据的准确性。您还可以考虑将ANALYZE TABLE添加到加载数据后运行的设置脚本中，并在低活动时按计划运行ANALYZE TABLE。

当向现有表添加索引或添加或删除列时，索引统计信息将计算并添加到innodb_index_stats表中，而不考虑innodb_stats_auto_recalc的值。

以前，在重新启动服务器和执行其他类型的操作后，会清除优化器统计信息，并在下一次访问表时重新计算。因此，在重新计算统计信息时会产生不同的估计，从而导致查询执行计划的不同选择和查询性能的变化。

### 2.2 为单个表配置优化器统计参数

Innodb_stats_persistent、innodb_stats_auto_recalc和innodb_stats_persistent_sample_pages是全局变量。要覆盖这些系统范围的设置并为单个表配置优化器统计参数，您可以在CREATE TABLE或ALTER TABLE语句中定义STATS_PERSISTENT、STATS_AUTO_RECALC和STATS_SAMPLE_PAGES子句。

**1、** STATS_PERSISTENT指定是否开启InnoDB表的持久化统计默认值导致表的持久化统计信息设置由innodb_stats_persistent设置决定值为1时，启用表的持久统计，值为0时，禁用该特性在为单个表启用持久统计之后，在加载表数据之后，使用ANALYZEtable计算统计数据；

**2、** STATS_AUTO_RECALC指定是否自动重新计算持久统计数据默认值导致表的持久统计信息设置由innodb_stats_auto_recalc设置决定当10%的表数据发生更改时，值为1将重新计算统计信息值0防止对表进行自动重新计算当使用值为0时，在对表进行重大更改后，使用ANALYZETABLE重新计算统计数据；

**3、** 例如，通过ANALYZETABLE操作计算索引列的基数和其他统计信息时，STATS_SAMPLE_PAGES指定要抽样的索引页的数量；

所有这三个子句都在下面的CREATE TABLE示例中指定:

```java
CREATE TABLE t1 (
id int(8) NOT NULL auto_increment,
data varchar(255),
date datetime,
PRIMARY KEY  (id),
INDEX DATE_IX (date)
) ENGINE=InnoDB,
  STATS_PERSISTENT=1,
  STATS_AUTO_RECALC=1,
  STATS_SAMPLE_PAGES=25;
```

### 2.3 配置InnoDB优化器统计抽样页数

优化器使用关于键分布的估计统计信息，根据索引的相对选择性为执行计划选择索引。像ANALYZE TABLE这样的操作会导致InnoDB从表上的每个索引中随机取样页，以估计索引的基数。这种采样技术被称为随机潜水。

innodb_stats_persistent_sample_pages控制取样页面的数量。您可以在运行时调整设置，以管理优化器使用的统计估计值的质量。缺省值是20。当遇到以下问题时，请考虑修改设置:

**1、** 统计信息不够准确，优化器选择了次优计划，如EXPLAIN输出所示您可以通过比较索引的实际基数(通过在索引列上运行SELECTDISTINCT确定)和mysql中的估计值来检查统计数据的准确性innodb_index_stats表；

如果确定统计信息不够准确，就应该增加innodb_stats_persistent_sample_pages的值，直到统计信息估计足够准确为止。然而，过多地增加innodb_stats_persistent_sample_pages可能会导致ANALYZE TABLE运行缓慢。

**2、** ANALYZETABLE太慢了在这种情况下，应该减少innodb_stats_persistent_sample_pages，直到ANALYZETABLE的执行时间可以接受为止但是，将值降低太多可能会导致第一个问题:不准确的统计数据和次优的查询执行计划；

如果不能在准确的统计数据和ANALYZE TABLE执行时间之间达到平衡，那么可以考虑减少表中索引列的数量或限制分区的数量，以降低ANALYZE TABLE的复杂性。表的主键中的列的数量也需要考虑，因为主键列被附加到每个非惟一索引。

### 2.4 在持久统计计算中包括删除标记的记录

默认情况下，InnoDB在计算统计时读取未提交的数据。对于从表中删除行的未提交事务，在计算行估计值和索引统计数据时将排除带有删除标记的记录，这可能导致使用READ uncommitted以外的事务隔离级别并发操作表的其他事务的执行计划不优化。为了避免这种情况，可以启用innodb_stats_include_delete_marked，以确保在计算持久化优化器统计信息时包含删除标记的记录。

当innodb_stats_include_delete_marked被启用时，ANALYZE TABLE在重新计算统计数据时会考虑删除标记的记录。

innodb_stats_include_delete_marked是一个全局设置，影响所有InnoDB表，只适用于持久化优化统计。

### 2.5 InnoDB持久化统计表

持久统计特性依赖于mysql数据库中的内部托管表，即innodb_table_stats和innodb_index_stats。这些表在所有安装、升级和从源代码构建过程中都是自动设置的。

innodb_table_stats：

列名
描述

database_name
数据库名

table_name
表名，分区名或子分区名

last_update
一个时间戳，表明InnoDB最后一次更新这一行

n_rows
表的记录数

clustered_index_size
主索引的大小，以页为单位

sum_of_other_index_sizes
页中其他(非主)索引的总大小

innodb_index_stats:

列名
描述

database_name
数据库名

table_name
表名，分区名或子分区名

index_name
索引名

last_update
一个时间戳，表明InnoDB最后一次更新这一行

stat_name
统计项的名称，其值报告在stat_value列中

stat_value
在stat_name列中命名的统计值

sample_size
为stat_value列中提供的估算而采样的页面数

stat_description
在“stat_name”列中命名的统计信息的描述

innodb_table_stats和innodb_index_stats表包括一个last_update列，显示上一次更新索引统计数据的时间:

```java
mysql> SELECT * FROM innodb_table_stats where table_name='fact_sale' \G
*************************** 1. row ***************************
           database_name: test
              table_name: fact_sale
             last_update: 2021-05-27 12:33:52
                  n_rows: 744339359
    clustered_index_size: 2045376
sum_of_other_index_sizes: 0
1 row in set (0.00 sec)
mysql> SELECT * FROM innodb_index_stats where table_name='fact_sale' \G     
*************************** 1. row ***************************
   database_name: test
      table_name: fact_sale
      index_name: PRIMARY
     last_update: 2021-05-27 12:33:52
       stat_name: n_diff_pfx01
      stat_value: 744339359
     sample_size: 20
stat_description: id
*************************** 2. row ***************************
   database_name: test
      table_name: fact_sale
      index_name: PRIMARY
     last_update: 2021-05-27 12:33:52
       stat_name: n_leaf_pages
      stat_value: 2042924
     sample_size: NULL
stat_description: Number of leaf pages in the index
*************************** 3. row ***************************
   database_name: test
      table_name: fact_sale
      index_name: PRIMARY
     last_update: 2021-05-27 12:33:52
       stat_name: size
      stat_value: 2045376
     sample_size: NULL
stat_description: Number of pages in the index
3 rows in set (0.00 sec)
mysql> 
```

可以手动更新innodb_table_stats和innodb_index_stats表，这样就可以强制执行特定的查询优化计划或测试替代计划，而无需修改数据库。如果手动更新统计信息，请使用FLUSH TABLE tbl_name语句加载更新的统计信息。

持久性统计数据被认为是本地信息，因为它们与服务器实例相关。因此，在进行自动统计重新计算时，innodb_table_stats和innodb_index_stats表不会被复制。如果您运行ANALYZE TABLE来启动统计信息的同步重新计算，语句将被复制(除非您禁止为它记录日志)，并在副本上进行重新计算。

### 2.6 InnoDB Persistent Statistics Tables示例

innodb_table_stats表中每个表包含一行。下面的示例演示了收集的数据类型。

表t1包含一个主索引(列a, b)、二级索引(列c, d)和唯一索引(列e, f):

```java
CREATE TABLE t1 (
a INT, b INT, c INT, d INT, e INT, f INT,
PRIMARY KEY (a, b), KEY i1 (c, d), UNIQUE KEY i2uniq (e, f)
) ENGINE=INNODB;
```

在插入5行样本数据后，表t1显示如下:

```java
mysql> select * from t1;
+---+---+------+------+------+------+
| a | b | c    | d    | e    | f    |
+---+---+------+------+------+------+
| 1 | 1 |   10 |   11 |  100 |  101 |
| 1 | 2 |   10 |   11 |  200 |  102 |
| 1 | 3 |   10 |   11 |  100 |  103 |
| 1 | 4 |   10 |   12 |  200 |  104 |
| 1 | 5 |   10 |   12 |  100 |  105 |
+---+---+------+------+------+------+
5 rows in set (0.00 sec)
```

要立即更新统计信息，请运行ANALYZE TABLE(如果innodb_stats_auto_recalc被启用，统计信息将在几秒钟内自动更新，假设已达到更改表行10%的阈值):

```java
mysql> analyze table t1;
+---------+---------+----------+----------+
| Table   | Op      | Msg_type | Msg_text |
+---------+---------+----------+----------+
| test.t1 | analyze | status   | OK       |
+---------+---------+----------+----------+
1 row in set (0.01 sec)
```

表t1的表统计信息显示了InnoDB最近一次更新的表统计信息(2021-06-02 15:47:16)、表中的行数(5)、聚集索引大小(1页)以及其他索引的合并大小(2页)。

```java
mysql> SELECT * FROM mysql.innodb_table_stats WHERE table_name like 't1'\G
*************************** 1. row ***************************
           database_name: test
              table_name: t1
             last_update: 2021-06-02 15:47:16
                  n_rows: 5
    clustered_index_size: 1
sum_of_other_index_sizes: 2
1 row in set (0.00 sec)
```

innodb_index_stats表为每个索引包含多行。innodb_index_stats表中的每一行提供与特定索引统计相关的数据，该数据在stat_name列中命名，并在stat_description列中进行描述。例如:

```java
mysql> SELECT index_name, stat_name, stat_value, stat_description
    -> FROM mysql.innodb_index_stats WHERE table_name like 't1';
+------------+--------------+------------+-----------------------------------+
| index_name | stat_name    | stat_value | stat_description                  |
+------------+--------------+------------+-----------------------------------+
| PRIMARY    | n_diff_pfx01 |          1 | a                                 |
| PRIMARY    | n_diff_pfx02 |          5 | a,b                               |
| PRIMARY    | n_leaf_pages |          1 | Number of leaf pages in the index |
| PRIMARY    | size         |          1 | Number of pages in the index      |
| i1         | n_diff_pfx01 |          1 | c                                 |
| i1         | n_diff_pfx02 |          2 | c,d                               |
| i1         | n_diff_pfx03 |          2 | c,d,a                             |
| i1         | n_diff_pfx04 |          5 | c,d,a,b                           |
| i1         | n_leaf_pages |          1 | Number of leaf pages in the index |
| i1         | size         |          1 | Number of pages in the index      |
| i2uniq     | n_diff_pfx01 |          2 | e                                 |
| i2uniq     | n_diff_pfx02 |          5 | e,f                               |
| i2uniq     | n_leaf_pages |          1 | Number of leaf pages in the index |
| i2uniq     | size         |          1 | Number of pages in the index      |
+------------+--------------+------------+-----------------------------------+
14 rows in set (0.00 sec)
```

stat_name列显示了以下类型的统计信息:

**1、** size:在stat_name=size的地方，stat_value列显示了索引中的总页数；

**2、** n_leaf_pages:其中stat_name=n_leaf_pages,stat_value列显示索引中的叶页数量；

**3、** n_diff_pfxNN:其中stat_name=n_diff_pfx01,stat_value列显示索引第一列中不同值的数量其中stat_name=n_diff_pfx02,stat_value列显示索引的前两列中不同值的数量，以此类推其中stat_name=n_diff_pfxNN,stat_description列显示了一个逗号分隔的索引列列表；

为了进一步说明提供基数数据的n_diff_pfxNN统计量，请再次考虑前面介绍的t1表示例。如下所示，t1表有一个主索引(列a, b)，一个辅助索引(列c, d)和一个唯一索引(列e, f):

```java
CREATE TABLE t1 (
  a INT, b INT, c INT, d INT, e INT, f INT,
  PRIMARY KEY (a, b), KEY i1 (c, d), UNIQUE KEY i2uniq (e, f)
) ENGINE=INNODB;
```

在插入5行样本数据后，表t1显示如下:

```java
mysql> select * from t1;
+---+---+------+------+------+------+
| a | b | c    | d    | e    | f    |
+---+---+------+------+------+------+
| 1 | 1 |   10 |   11 |  100 |  101 |
| 1 | 2 |   10 |   11 |  200 |  102 |
| 1 | 3 |   10 |   11 |  100 |  103 |
| 1 | 4 |   10 |   12 |  200 |  104 |
| 1 | 5 |   10 |   12 |  100 |  105 |
+---+---+------+------+------+------+
5 rows in set (0.00 sec)
```

查询index_name、stat_name、stat_value和stat_description，其中stat_name LIKE ‘n_diff%’，返回结果集如下:

```java
mysql> SELECT index_name, stat_name, stat_value, stat_description
    -> FROM mysql.innodb_index_stats
    -> WHERE table_name like 't1' AND stat_name LIKE 'n_diff%';
+------------+--------------+------------+------------------+
| index_name | stat_name    | stat_value | stat_description |
+------------+--------------+------------+------------------+
| PRIMARY    | n_diff_pfx01 |          1 | a                |
| PRIMARY    | n_diff_pfx02 |          5 | a,b              |
| i1         | n_diff_pfx01 |          1 | c                |
| i1         | n_diff_pfx02 |          2 | c,d              |
| i1         | n_diff_pfx03 |          2 | c,d,a            |
| i1         | n_diff_pfx04 |          5 | c,d,a,b          |
| i2uniq     | n_diff_pfx01 |          2 | e                |
| i2uniq     | n_diff_pfx02 |          5 | e,f              |
+------------+--------------+------------+------------------+
8 rows in set (0.00 sec)
```

对于PRIMARY索引，有两个n_diff%行。行数等于索引中的列数。

**1、** index_name=PRIMARY和stat_name=n_diff_pfx01stat_value是1,这表明有一个独特的价值指数的第一列(列)列中不同值的数量确认通过查看数据列在表t1,其中有一个单独的值(1)计数列(a)显示在结果集的stat_description列中；

**2、** 其中index_name=PRIMARY和stat_name=n_diff_pfx02,stat_value为5，这表示在索引(a,b)的两列中有5个不同的值通过查看表t1中a、b列的数据来确定a、b列中不同值的个数，其中有5个不同值:(1,1)、(1,2)、(1,3)、(1,4)、(1,5)统计的列(a,b)显示在结果集的stat_description列中；

对于次要索引(i1)，有4个n_diff%行。次要索引(c,d)只定义了两列，但是次要索引有4个n_diff%行，因为InnoDB用主键作为所有非惟一索引的后缀。因此，有4个n_diff%行，而不是2个，以同时处理次要索引列(c,d)和主键列(a,b)。

**1、** index_name=i1和stat_name=n_diff_pfx01stat_value是1,这表明有一个独特的价值指数的第一列(列c)不同值的数量列c是证实通过查看数据列c表t1,其中有一个独特的价值:(10)计数列©显示在结果集的stat_description列中；

**2、** 其中index_name=i1和stat_name=n_diff_pfx02,stat_value为2，这表示在索引(c,d)的前两列中有两个不同的值通过查看表t1中c列和d列的数据来确定c列和d列中不同值的个数，其中有两个不同的值:(10,11)和(10,12)统计的列(c,d)显示在结果集的stat_description列中；

**3、** 其中index_name=i1和stat_name=n_diff_pfx03,stat_value是2，这表示在索引(c,d,a)的前三列中有两个不同的值通过查看表t1中c、d、a列的数据来确定c、d、a列中不同值的个数，其中有两个不同的值(10,11,1)和(10,12,1)统计的列(c,d,a)显示在结果集的stat_description列中；

**4、** 其中index_name=i1和stat_name=n_diff_pfx04,stat_value是5，这表示在索引(c,d,a,b)的4列中有5个不同的值通过查看表t1中c、d、a、b列的数据来确定c、d、a、b列中不同值的个数，其中有5个不同值:(10、11、1、1)、(10、11、1、2)、(10、11、1、3)、(10、12、1、4)、(10、12、1、5)统计的列(c,d,a,b)显示在结果集的stat_description列中；

对于惟一索引(i2uniq)，有两个n_diff%行。

**1、** index_name=i2uniqstat_name=n_diff_pfx01,stat_value是2,这表明有两种截然不同的索引的第一列中的值(列e)不同值的数量列e是证实通过查看数据列表t1,e中,有两种截然不同的价值观:(100)和(200)统计的列(e)显示在结果集的stat_description列中；

**2、** 其中index_name=i2uniq和stat_name=n_diff_pfx02,stat_value为5，这表示在索引(e,f)的两列中有5个不同的值通过查看表t1中e和f列的数据来确定e和f列中不同值的数量，其中有5个不同的值:(100,101)、(200,102)、(100,103)、(200,104)和(100,105)统计的列(e,f)显示在结果集的stat_description列中；

### 2.7 使用innodb_index_stats表获取索引大小

可以使用innodb_index_stats表检索表、分区或子分区的索引大小。在下面的示例中，检索表t1的索引大小。表t1的定义和相应的索引统计信息。

```java
mysql> SELECT SUM(stat_value) pages, index_name,
    ->        SUM(stat_value)*@@innodb_page_size size
    ->        FROM mysql.innodb_index_stats WHERE table_name='t1'
    ->        AND stat_name = 'size' GROUP BY index_name;
+-------+------------+-------+
| pages | index_name | size  |
+-------+------------+-------+
|     1 | PRIMARY    | 16384 |
|     1 | i1         | 16384 |
|     1 | i2uniq     | 16384 |
+-------+------------+-------+
3 rows in set (0.00 sec)
```

对于分区或子分区，您可以使用相同的查询和修改的WHERE子句来检索索引大小。例如，下面的查询检索表t1的分区索引大小:

```java
mysql> SELECT SUM(stat_value) pages, index_name,
    ->        SUM(stat_value)*@@innodb_page_size size
    ->        FROM mysql.innodb_index_stats WHERE table_name like 't1#P%'
    ->        AND stat_name = 'size' GROUP BY index_name;
Empty set (0.00 sec)
mysql> 
```

## 三.配置非持久性优化器统计参数

本节介绍如何配置非持久优化器统计信息。当innodb_stats_persistent=OFF或使用STATS_PERSISTENT=0创建或修改单个表时，优化器统计信息不会持久化到磁盘上。相反，统计信息存储在内存中，并在服务器关闭时丢失。在某些操作和特定条件下，统计数据也会定期更新。

默认情况下，优化器统计信息被持久化到磁盘，这是通过innodb_stats_persistent配置选项启用的。

### 3.1 优化器数据更新

非持久性优化器统计信息在以下情况下更新:

**1、** 运行ANALYZETABLE.；

**2、** 执行SHOWTABLESTATUS、SHOWINDEX或查询INFORMATION_SCHEMA表或INFORMATION_SCHEMA启用innodb_stats_on_metadata选项的统计表；

**3、** innodb_stats_on_metadata的默认设置是OFF启用innodb_stats_on_metadata可能会降低拥有大量表或索引的模式的访问速度，并且会降低涉及InnoDB表的查询的执行计划的稳定性innodb_stats_on_metadata使用SET语句进行全局配置；

```java
SET GLOBAL innodb_stats_on_metadata=ON
```

**1、** 启用——auto-rehash选项启动mysql客户端，这是默认设置auto-rehash选项会导致所有InnoDB表被打开，而打开表的操作会导致统计重新计算；

为了提高mysql客户端的启动时间和更新统计信息，可以使用——disable-auto-rehash选项关闭自动重新散列。自动重新散列特性允许交互式用户自动完成数据库、表和列名的名称。

**2、** 首次打开表；

**3、** InnoDB检测到自从上次统计数据更新以来，有1/16的表被修改了；

### 3.2 配置采样页面数

MySQL查询优化器使用关于键分布的估计统计信息，根据索引的相对选择性为执行计划选择索引。当InnoDB更新优化器统计信息时，它会从表上的每个索引中随机取样页面，以估计索引的基数。(这种技术被称为随机潜水。)

为了控制统计估计数的质量(从而为查询优化器提供更好的信息)，可以使用参数innodb_stats_transient_sample_pages更改采样页面的数量。采样页面的默认数量是8，这可能不足以产生准确的估计，导致查询优化器的索引选择不佳。对于连接中使用的大型表和表，这种技术尤其重要。对这样的表进行不必要的全表扫描可能是一个重大的性能问题。

当innodb_stats_persistent=0时，innodb_stats_transient_sample_pages的值会影响所有InnoDB表和索引的索引采样。当您更改索引样本大小时，请注意以下潜在的重大影响:

**1、** 像1或2这样的小值会导致对基数的不准确估计；

**2、** 增加innodb_stats_transient_sample_pages值可能需要更多的磁盘读取如果值远远大于8(例如，100)，则可能导致打开表或执行SHOWtableSTATUS所需的时间显著放缓；

**3、** 根据对索引选择性的不同估计，优化器可能选择非常不同的查询计划；

无论innodb_stats_transient_sample_pages的值对系统来说是什么，设置该选项并保持该值不变。选择一个可以对数据库中所有表进行合理准确估计的值，而不需要过多的I/O。因为统计信息是在不同时间自动重新计算的，而不是在执行ANALYZE TABLE时，所以增加索引样本大小，运行ANALYZE TABLE，然后再次减少样本大小是没有意义的。

较小的表通常比较大的表需要更少的索引样本。如果您的数据库有很多大表，那么考虑对innodb_stats_transient_sample_pages使用一个比大多数小表更高的值。

## 四.估计分析InnoDB表的复杂性

InnoDB表的分析表复杂度依赖于:

**1、** 采样的页面数，由innodb_stats_persistent_sample_pages定义；

**2、** 表中索引列的数量；

**3、** 分区数如果一个表没有分区，那么分区的数量就被认为是1；

使用这些参数，估计ANALYZE TABLE复杂度的近似公式是:

innodb_stats_persistent_sample_pages的值*表中索引列的数量*分区的数量

通常，结果值越大，ANALYZE TABLE的执行时间就越长。

对于评估ANALYZE TABLE复杂度的更深入方法，请考虑以下示例。

在大O符号中，ANALYZE TABLE复杂度描述如下:

```java
 O(n_sample
  * (n_cols_in_uniq_i
     + n_cols_in_non_uniq_i
     + n_cols_in_pk * (1 + n_non_uniq_i))
  * n_part)
```

地点:
N_sample是抽样的页面数量(由innodb_stats_persistent_sample_pages定义)

N_cols_in_uniq_i是所有唯一索引中所有列的总数(不包括主键列)

N_cols_in_non_uniq_i是所有非惟一索引中所有列的总数

n_cols_in_pk是主键中的列数(如果没有定义主键，InnoDB会在内部创建单个列主键)

N_non_uniq_i是表中非惟一索引的个数

N_part是分区数。如果没有定义分区，则认为该表是单个分区。

现在，考虑下面的表(表t)，它有一个主键(2列)、一个惟一索引(2列)和两个非惟一索引(各有两列):

```java
CREATE TABLE t (
  a INT,
  b INT,
  c INT,
  d INT,
  e INT,
  f INT,
  g INT,
  h INT,
  PRIMARY KEY (a, b),
  UNIQUE KEY i1uniq (c, d),
  KEY i2nonuniq (e, f),
  KEY i3nonuniq (g, h)
);
```

对于上述算法所需的列和索引数据，查询mysql.innodb_index_stats表t的持久索引统计表。n_diff_pfx%统计显示每个索引计数的列。例如，列a和b被统计为主键索引。对于非惟一索引，除用户定义的列外，还计算主键列(a,b)。

```java
mysql> SELECT index_name, stat_name, stat_description
    ->        FROM mysql.innodb_index_stats WHERE
    ->        database_name='test' AND
    ->        table_name='t' AND
    ->        stat_name like 'n_diff_pfx%';
+------------+--------------+------------------+
| index_name | stat_name    | stat_description |
+------------+--------------+------------------+
| PRIMARY    | n_diff_pfx01 | a                |
| PRIMARY    | n_diff_pfx02 | a,b              |
| i1uniq     | n_diff_pfx01 | c                |
| i1uniq     | n_diff_pfx02 | c,d              |
| i2nonuniq  | n_diff_pfx01 | e                |
| i2nonuniq  | n_diff_pfx02 | e,f              |
| i2nonuniq  | n_diff_pfx03 | e,f,a            |
| i2nonuniq  | n_diff_pfx04 | e,f,a,b          |
| i3nonuniq  | n_diff_pfx01 | g                |
| i3nonuniq  | n_diff_pfx02 | g,h              |
| i3nonuniq  | n_diff_pfx03 | g,h,a            |
| i3nonuniq  | n_diff_pfx04 | g,h,a,b          |
+------------+--------------+------------------+
12 rows in set (0.00 sec)
```

根据上面所示的索引统计数据和表定义，可以确定以下值:

**1、** N_cols_in_uniq_i，即所有唯一索引(不包括主键列)中的所有列的总数为2(c和d)；

**2、** N_cols_in_non_uniq_i，即所有非惟一索引中的所有列的总数，为4(e,f,g和h)；

**3、** N_cols_in_pk，主键中的列数，是2(a和b)；

**4、** 表中非唯一索引的数目N_non_uniq_i为2(i2nonuniq和i3nonuniq)；

**5、** N_part分区数为1；

现在可以计算innodb_stats_persistent_sample_pages *(2 + 4 + 2 *(1 + 2)) * 1，以确定扫描的叶页数量。将innodb_stats_persistent_sample_pages设置为默认值20，并且默认页面大小为16 KiB (innodb_page_size=16384)，那么可以估计表t读取了20 * 12 * 16384字节，或者大约4个MiB。

## 五.列的统计信息

### 5.1 直方图概述

column_statistics数据字典表存储关于列值的直方图统计信息，优化器在构造查询执行计划时使用。要执行直方图管理，请使用ANALYZE TABLE语句。

column_statistics表有以下特征:

**1、** 该表包含除几何类型(空间数据)和JSON之外的所有数据类型列的统计信息；

**2、** 该表是持久的，因此不必在每次服务器启动时创建列统计信息；

**3、** 服务器对表执行更新;用户不；

用户不能直接访问column_statistics表，因为它是数据字典的一部分。使用INFORMATION_SCHEMA可以获得直方图信息。COLUMN_STATISTICS，它实现为数据字典表的视图。COLUMN_STATISTICS有以下列:

**1、** SCHEMA_NAME、TABLE_NAME、COLUMN_NAME:应用统计信息的模式、表和列的名称；

**2、** 直方图:描述列统计信息的JSON值，以直方图的形式存储；

列直方图包含存储在列中值范围的部分桶。直方图是JSON对象，可以灵活地表示列统计信息。下面是一个样本直方图对象:

```java
{
  "buckets": [
    [
      1,
      0.3333333333333333
    ],
    [
      2,
      0.6666666666666666
    ],
    [
      3,
      1
    ]
  ],
  "null-values": 0,
  "last-updated": "2017-03-24 13:32:40.000000",
  "sampling-rate": 1,
  "histogram-type": "singleton",
  "number-of-buckets-specified": 128,
  "data-type": "int",
  "collation-id": 8
}
```

**直方图对象有以下键:**

**1、** buckets:柱状图桶桶的结构取决于直方图类型；

1)对于单例直方图，桶包含两个值:；

“1”表示桶的值。类型取决于列数据类型。

值2:表示该值的累积频率的双精度值。例如，.25和.75表示列中25%和75%的值小于或等于桶值。

2)对于等高直方图，桶包含四个值:；

值1、2:桶的上下两个值。类型取决于列数据类型。

值3:表示该值的累积频率的双精度值。例如，.25和.75表示列中25%和75%的值小于或等于桶的上限值。

值4:桶的下限值到上限值之间的不同值个数。

**2、** NULL-values:0.0和1.0之间的数字，表示列值中SQLNULL值的比例如果为0，则该列不包含NULL值；

**3、** last-updated:生成直方图时，作为UTC值，格式为YYYY-MM-DDhh:mm:ssuuuuuu格式；

**4、** sampling-rate:0.0到1.0之间的数字，表示为创建直方图而采样的数据的比例值为1表示读取了所有数据(没有采样)；

**5、** histogramtype:直方图类型:；

**5、** 1singleton:一个桶代表列中的一个值当列中不同值的数量小于或等于生成直方图的ANALYZETABLE语句中指定的桶的数量时，就创建了这种直方图类型；

**5、** 2equi-height:一个桶代表一系列的值当列中不同值的数量大于生成直方图的ANALYZETABLE语句中指定的桶的数量时，就会创建这种直方图类型；

**6、** number-of-buckets-specified:生成直方图的ANALYZETABLE语句中指定的桶数；

**7、** data-type:直方图所包含的数据类型当将直方图从持久化存储读取和解析到内存中时，需要这样做该值可以是int、uint(无符号整数)、双精度、十进制、日期时间或字符串(包括字符和二进制字符串)；

**8、** collation-ID:直方图数据的排序规则ID当数据类型值是字符串时，它最有意义值对应于INFORMATION_SCHEMA中的ID列值排序表；

要从直方图对象中提取特定的值，可以使用JSON操作。例如:

```java
mysql> SELECT
    ->          TABLE_NAME, COLUMN_NAME,
    ->          HISTOGRAM->>'$."data-type"' AS 'data-type',
    ->          JSON_LENGTH(HISTOGRAM->>'$."buckets"') AS 'bucket-count'
    ->        FROM INFORMATION_SCHEMA.COLUMN_STATISTICS;
+------------+-------------+-----------+--------------+
| TABLE_NAME | COLUMN_NAME | data-type | bucket-count |
+------------+-------------+-----------+--------------+
| t1         | e           | int       |            2 |
| t1         | f           | int       |            5 |
+------------+-------------+-----------+--------------+
2 rows in set (0.00 sec)
```

优化器将使用直方图统计信息(如果适用)，用于收集统计信息的任何数据类型的列。优化器应用直方图统计信息来根据列值与常量值比较的选择性(过滤效果)确定行估计值。这些形式的谓词可以使用直方图:

```java
col_name = constant
col_name <> constant
col_name != constant
col_name > constant
col_name < constant
col_name >= constant
col_name <= constant
col_name IS NULL
col_name IS NOT NULL
col_name BETWEEN constant AND constant
col_name NOT BETWEEN constant AND constant
col_name IN (constant[, constant] ...)
col_name NOT IN (constant[, constant] ...)
```

例如，这些语句包含符合柱状图使用条件的谓词:

```java
SELECT * FROM orders WHERE amount BETWEEN 100.0 AND 300.0;
SELECT * FROM tbl WHERE col1 = 15 AND col2 > 100;
```

与常量进行比较的要求包括常量函数，如ABS()和FLOOR():

```java
SELECT * FROM tbl WHERE col1 < ABS(-34);
```

直方图统计信息主要用于非索引列。向柱状图统计信息适用的列添加索引还可以帮助优化器进行行估计。权衡:

**1、** 在修改表数据时，必须更新索引；

**2、** 直方图仅根据需要创建或更新，因此在修改表数据时不会增加开销另一方面，当表发生修改时，统计信息会逐渐过时，直到下一次更新它们；

与从直方图统计信息中获得的行估计值相比，优化器更喜欢范围优化器行估计值。如果优化器确定范围优化器应用，则不使用直方图统计信息。

对于已被索引的列，可以使用索引插入来获得行估计数，以便进行相等比较。在这种情况下，直方图统计并不一定有用，因为索引潜水可以产生更好的估计。

在某些情况下，使用直方图统计信息可能无法改善查询执行(例如，如果统计信息过期)。要检查这种情况是否存在，可以使用ANALYZE TABLE重新生成直方图统计信息，然后再次运行查询。

或者，要禁用直方图统计，可以使用ANALYZE TABLE删除它们。禁用直方图统计的另一种方法是关闭optimizer_switch系统变量的condition_fanout_filter标志(尽管这也可能禁用其他优化):

```java
SET optimizer_switch='condition_fanout_filter=off';
```

如果使用直方图统计信息，那么使用EXPLAIN可以看到结果。考虑下面的查询，其中col1列没有索引:

```java
SELECT * FROM t1 WHERE col1 < 24;
```

如果直方图统计信息表明t1中57%的行满足col1 < 24谓词，那么即使在没有索引的情况下也可以进行过滤，而EXPLAIN在过滤后的列中显示57.00。

### 5.2 直方图实例

#### 5.2.1 直方图语法及简介

MySQL8.0实现了统计直方图。利用直方图，用户可以对一张表的一列做数据分布的统计，特别是针对没有索引的字段。这可以帮助查询优化器找到更优的执行计划。统计直方图的主要使用场景是用来计算字段选择性，即过滤效率。

可以通过以下方式来创建或者删除直方图：

```java
ANALYZE TABLE tbl_name UPDATE HISTOGRAM ON col_name [, col_name] WITH N BUCKETS;
ANALYZE TABLE tbl_name DROP HISTOGRAM ON col_name [, col_name];
```

buckets的值必须指定，可以设置为1到1024，默认值是100。。统计直方图的信息存储在数据字典表"column_statistcs"中,可以通过视图information_schema.COLUMN_STATISTICS访问。直方图以灵活的JSON的格式存储。ANALYZE TABLE会基于表大小自动判断是否要进行取样操作。ANALYZE TABLE也会基于表中列的数据分布情况以及bucket的数量来决定是否要建立等宽直方图（singleton）还是等高直方图（equi-height）。

直方图记录了:

**1、** 每一列有多少不同的值；

**2、** 每一列的数据分布情况；

如果没有统计数据，优化器会假设列的每个不同的值是均匀分布的，导致执行计划错误的估算输出的行数，而导致SQL变慢。直方图的引入就是为了解决这一个问题。

#### 5.2.2 开始测试

测试表，可以看到2010-04-11这一天的数据是明显少于其他天的。

```java
mysql> select count(*) from fact_sale_new;
+-----------+
| count(*)  |
+-----------+
| 767830001 |
+-----------+
1 row in set (2 min 23.06 sec)
mysql> select * from fact_sale_new limit 10; 
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
10 rows in set (0.02 sec)
mysql> select sale_date,count(*) from fact_sale_new group by sale_date order by sale_date limit 10;                      
+---------------------+----------+
| sale_date           | count(*) |
+---------------------+----------+
| 2010-04-11 00:00:00 |        1 |
| 2010-04-12 00:00:00 |   855220 |
| 2010-04-13 00:00:00 |   856543 |
| 2010-04-14 00:00:00 |   854319 |
| 2010-04-15 00:00:00 |   851796 |
| 2010-04-16 00:00:00 |   861356 |
| 2010-04-17 00:00:00 |   860417 |
| 2010-04-18 00:00:00 |   850425 |
| 2010-04-19 00:00:00 |   853513 |
| 2010-04-20 00:00:00 |   878592 |
+---------------------+----------+
10 rows in set (34 min 11.19 sec)
```

此时分别查询两天的数据，发现filtered居然都是10

```java
mysql> explain select * from fact_sale_new where sale_date = '2010-04-11 00:00:00' ;
+----+-------------+---------------+------------+------+---------------+------+---------+------+-----------+----------+-------------+
| id | select_type | table         | partitions | type | possible_keys | key  | key_len | ref  | rows      | filtered | Extra       |
+----+-------------+---------------+------------+------+---------------+------+---------+------+-----------+----------+-------------+
|  1 | SIMPLE      | fact_sale_new | NULL       | ALL  | NULL          | NULL | NULL    | NULL | 766296295 |    10.00 | Using where |
+----+-------------+---------------+------------+------+---------------+------+---------+------+-----------+----------+-------------+
1 row in set, 1 warning (0.01 sec)
mysql> explain select * from fact_sale_new where sale_date = '2010-04-12 00:00:00' ; 
+----+-------------+---------------+------------+------+---------------+------+---------+------+-----------+----------+-------------+
| id | select_type | table         | partitions | type | possible_keys | key  | key_len | ref  | rows      | filtered | Extra       |
+----+-------------+---------------+------------+------+---------------+------+---------+------+-----------+----------+-------------+
|  1 | SIMPLE      | fact_sale_new | NULL       | ALL  | NULL          | NULL | NULL    | NULL | 766296295 |    10.00 | Using where |
+----+-------------+---------------+------------+------+---------------+------+---------+------+-----------+----------+-------------+
1 row in set, 1 warning (0.00 sec)
```

开始收集直方图信息:

```java
mysql> analyze table fact_sale_new update histogram on sale_date with 1000 buckets;
+--------------------+-----------+----------+------------------------------------------------------+
| Table              | Op        | Msg_type | Msg_text                                             |
+--------------------+-----------+----------+------------------------------------------------------+
| test.fact_sale_new | histogram | status   | Histogram statistics created for column 'sale_date'. |
+--------------------+-----------+----------+------------------------------------------------------+
1 row in set (3.35 sec)
```

居然这么快就收集完成了，有点不太正常

```java
mysql> show variables like 'histogram_generation_max_mem_size';
+-----------------------------------+----------+
| Variable_name                     | Value    |
+-----------------------------------+----------+
| histogram_generation_max_mem_size | 20000000 |
+-----------------------------------+----------+
1 row in set (0.00 sec)
mysql> 
mysql> set histogram_generation_max_mem_size = 20000000000;
Query OK, 0 rows affected (0.00 sec)
```

删除直方图之后，重新收集

```java
mysql> analyze table fact_sale_new drop histogram on sale_date;
+--------------------+-----------+----------+------------------------------------------------------+
| Table              | Op        | Msg_type | Msg_text                                             |
+--------------------+-----------+----------+------------------------------------------------------+
| test.fact_sale_new | histogram | status   | Histogram statistics removed for column 'sale_date'. |
+--------------------+-----------+----------+------------------------------------------------------+
1 row in set (0.01 sec)
mysql> analyze table fact_sale_new update histogram on sale_date with 1000 buckets;
+--------------------+-----------+----------+------------------------------------------------------+
| Table              | Op        | Msg_type | Msg_text                                             |
+--------------------+-----------+----------+------------------------------------------------------+
| test.fact_sale_new | histogram | status   | Histogram statistics created for column 'sale_date'. |
+--------------------+-----------+----------+------------------------------------------------------+
1 row in set (2.67 sec)
```

**重新查看filtered，发现发生了变化**

```java
mysql> explain select * from fact_sale_new where sale_date = '2010-04-11 00:00:00' ;
+----+-------------+---------------+------------+------+---------------+------+---------+------+-----------+----------+-------------+
| id | select_type | table         | partitions | type | possible_keys | key  | key_len | ref  | rows      | filtered | Extra       |
+----+-------------+---------------+------------+------+---------------+------+---------+------+-----------+----------+-------------+
|  1 | SIMPLE      | fact_sale_new | NULL       | ALL  | NULL          | NULL | NULL    | NULL | 766296295 |     0.00 | Using where |
+----+-------------+---------------+------------+------+---------------+------+---------+------+-----------+----------+-------------+
1 row in set, 1 warning (0.01 sec)
mysql> explain select * from fact_sale_new where sale_date = '2010-04-12 00:00:00' ;
+----+-------------+---------------+------------+------+---------------+------+---------+------+-----------+----------+-------------+
| id | select_type | table         | partitions | type | possible_keys | key  | key_len | ref  | rows      | filtered | Extra       |
+----+-------------+---------------+------------+------+---------------+------+---------+------+-----------+----------+-------------+
|  1 | SIMPLE      | fact_sale_new | NULL       | ALL  | NULL          | NULL | NULL    | NULL | 766296295 |     0.13 | Using where |
+----+-------------+---------------+------------+------+---------------+------+---------+------+-----------+----------+-------------+
1 row in set, 1 warning (0.00 sec)
```

## 六. Analyze命令

语法:

```java
ANALYZE [NO_WRITE_TO_BINLOG | LOCAL]
    TABLE tbl_name [, tbl_name] ...
ANALYZE [NO_WRITE_TO_BINLOG | LOCAL]
    TABLE tbl_name
    UPDATE HISTOGRAM ON col_name [, col_name] ...
        [WITH N BUCKETS]
ANALYZE [NO_WRITE_TO_BINLOG | LOCAL]
    TABLE tbl_name
    DROP HISTOGRAM ON col_name [, col_name] ...
```

ANALYZE TABLE生成表统计信息:

**1、** 不使用HISTOGRAM子句的ANALYZETABLE执行键分布分析，并存储指定表的分布对于MyISAM表，ANALYZETABLE用于键分布分析相当于使用myisamchk—ANALYZE；

**2、** 使用UPDATEHISTOGRAM子句的ANALYZETABLE为命名表的列生成直方图统计信息，并将其存储在数据字典中这种语法只允许使用一个表名；

**3、** 使用DROPHISTOGRAM子句的ANALYZETABLE从数据字典中移除指定表列的直方图统计信息这种语法只允许使用一个表名；

这条语句需要表的SELECT和INSERT权限。

ANALYZE TABLE适用于InnoDB, NDB和MyISAM表。它不适用于视图。

如果开启innodb_read_only系统变量，ANALYZE TABLE可能会失败，因为它不能更新使用InnoDB的数据字典中的统计表。对于更新键分布的ANALYZE TABLE操作，即使操作更新了表本身(例如，如果它是一个MyISAM表)，也可能发生失败。要获得更新的分布统计信息，请设置information_schema_stats_expiry=0。

分区表支持ANALYZE TABLE，可以使用ALTER TABLE…ANALYZE PARTITION分析一个或多个分区;更多信息,

在分析过程中，该表被InnoDB和MyISAM的读锁锁住。

ANALYZE TABLE从表定义缓存中删除表，这需要刷新锁。如果仍有长时间运行的语句或事务在使用表，则后续语句和事务必须等待这些操作完成后才释放刷新锁。由于ANALYZE TABLE本身通常完成得很快，因此可能看不出涉及同一个表的延迟事务或语句是由于剩余的刷新锁造成的。

默认情况下，服务器将ANALYZE TABLE语句写入二进制日志，以便将它们复制到副本中。要抑制日志记录，请指定可选的NO_WRITE_TO_BINLOG关键字或其别名LOCAL。

### 6.1 Analyze table 输出

ANALYZE TABLE返回一个带有下表所示列的结果集:

列
值

Table
The table name

Op
analyze or histogram

Msg_type
status, error, info, note, or warning

Msg_text
Msg_type 对应的输出

### 6.2 主要分布分析

不使用HISTOGRAM子句的ANALYZE TABLE执行键分布分析，并存储一个或多个表的分布。任何现有的直方图统计数据都不受影响。

如果该表自上次键分布分析以来没有更改，则不会再次分析该表。

MySQL使用存储的键分布来决定表应该连接的顺序，而不是连接一个常量。此外，当决定在查询中为特定表使用哪些索引时，可以使用键分布。

要检查存储的键分布基数，请使用SHOW INDEX语句或INFORMATION_SCHEMA STATISTICS表。

对于InnoDB表，ANALYZE TABLE通过对每个索引树执行随机潜水来确定索引基数，并相应地更新索引基数估计值。因为这些只是估计，反复运行ANALYZE TABLE可能产生不同的数字。这使得ANALYZE TABLE在InnoDB表上运行很快，但并不是100%准确，因为它没有考虑到所有的行。

您可以通过启用innodb_stats_persistent使ANALYZE TABLE收集的统计数据更加精确和稳定。当innodb_stats_persistent被启用时，重要的是在索引列数据发生重大变化后运行ANALYZE TABLE，因为统计数据不会定期重新计算(比如在服务器重启后)。

如果启用了innodb_stats_persistent，您可以通过修改innodb_stats_persistent_sample_pages系统变量来更改随机潜水的次数。如果innodb_stats_persistent被禁用，则修改innodb_stats_transient_sample_pages。

关于InnoDB中key distribution analysis的更多信息。

MySQL在连接优化中使用索引基数估计值。如果连接没有以正确的方式优化，请尝试运行ANALYZE TABLE。在少数情况下,分析表不能产生足够好为您的特定值表,您可以使用索引与查询力量的使用一个特定的指数,或设置max_seeks_for_key系统变量,以确保MySQL喜欢索引查找表扫描。

### 6.3 直方图统计分析

使用HISTOGRAM子句的ANALYZE TABLE支持对表列值的直方图统计信息进行管理。

这些直方图操作是可用的:

**1、** 使用UPDATEHISTOGRAM子句的ANALYZETABLE生成指定表列的直方图统计信息，并将其存储在数据字典中这种语法只允许使用一个表名；

**2、** 可选的WITHNBUCKETS子句指定直方图的桶数取值范围为1~1024之间的整数如果省略此子句，则桶的数量为100；

**3、** 使用DROPHISTOGRAM子句的ANALYZETABLE从数据字典中删除指定表列的直方图统计信息这种语法只允许使用一个表名；

存储的直方图管理语句只影响已命名的列。考虑这些语句:

```java
ANALYZE TABLE t UPDATE HISTOGRAM ON c1, c2, c3 WITH 10 BUCKETS;
ANALYZE TABLE t UPDATE HISTOGRAM ON c1, c3 WITH 10 BUCKETS;
ANALYZE TABLE t DROP HISTOGRAM ON c2;
```

第一个语句更新列c1、c2和c3的直方图，替换这些列的任何现有直方图。第二个语句更新c1和c3的直方图，不影响c2的直方图。第三条语句删除了c2的直方图，而不影响c1和c3的直方图。

加密表或临时表不支持直方图生成(以避免在统计数据中暴露数据)。

直方图生成适用于除几何类型(空间数据)和JSON之外的所有数据类型的列。

可以为存储的列和虚拟生成的列生成直方图。

不能为由单列惟一索引覆盖的列生成直方图。

直方图管理语句尝试执行尽可能多的请求操作，并报告其余操作的诊断消息。例如，如果一个UPDATE HISTOGRAM语句命名多个列，但其中一些列不存在或数据类型不受支持，则会为其他列生成直方图，并为无效列生成消息。

直方图受以下DDL语句的影响:

**1、** DROPTABLE删除被删除表中列的直方图；

**2、** DROPDATABASE删除被删除数据库中任何表的直方图，因为该语句删除了数据库中的所有表；

**3、** RENAMETABLE不会删除直方图相反，它将重命名的表的直方图与新表名相关联；

**4、** 删除或修改列的ALTERTABLE语句将删除该列的直方图；

**5、** ALTERTABLE……CONVERTTOCHARACTERSET删除字符列的直方图，因为它们会受到字符集更改的影响非字符列的直方图不受影响；

系统变量histogram_generation_max_mem_size控制了直方图生成可用的最大内存量。全局值和会话值可以在运行时设置。

更改全局的histgram_generation_max_mem_size值需要足够的权限来设置全局系统变量。更改会话的histgram_generation_max_mem_size值需要足够的权限来设置受限的会话系统变量。

如果预估的直方图生成时读入内存的数据量超过了histogram_generation_max_mem_size所定义的限制，MySQL会对数据进行采样，而不是将其全部读入内存。采样均匀地分布在整个表上。MySQL使用系统抽样，这是一种页级抽样方法。

INFORMATION_SCHEMA的直方图列中的采样率值。可以查询COLUMN_STATISTICS表，以确定用于创建直方图的采样数据的比例。采样率在0.0和1.0之间。值为1表示读取了所有数据(没有采样)。

下面的示例演示了采样。为了确保数据量超过本示例的直方图_generation_max_mem_size限制，在为employees表的birth_date列生成直方图统计信息之前，该限制被设置为一个较低的值(2000000字节)。

```java
mysql> SET histogram_generation_max_mem_size = 2000000;
mysql> USE employees;
mysql> ANALYZE TABLE employees UPDATE HISTOGRAM ON birth_date WITH 16 BUCKETS\G
*************************** 1. row ***************************
   Table: employees.employees
      Op: histogram
Msg_type: status
Msg_text: Histogram statistics created for column 'birth_date'.
mysql> SELECT HISTOGRAM->>'$."sampling-rate"'
       FROM INFORMATION_SCHEMA.COLUMN_STATISTICS
       WHERE TABLE_NAME = "employees"
       AND COLUMN_NAME = "birth_date";
+---------------------------------+
| HISTOGRAM->>'$."sampling-rate"' |
+---------------------------------+
| 0.0491431208869665              |
+---------------------------------+
```

采样率值为0.0491431208869665意味着大约4.9%的birth_date列数据被读入内存以生成直方图统计信息。

从MySQL 8.0.19开始，InnoDB存储引擎为InnoDB表中存储的数据提供了自己的采样实现。当存储引擎不提供它们自己的时，MySQL使用的默认采样实现需要全表扫描，这对于大型表来说成本很高。InnoDB采样实现通过避免全表扫描来提高采样性能。

sampled_pages_read和sampled_pages_skip INNODB_METRICS计数器可用于监视InnoDB数据页的抽样。

下面的示例演示了采样计数器的使用，这需要在生成直方图统计信息之前启用计数器。

```java
mysql> SET GLOBAL innodb_monitor_enable = 'sampled%';
mysql> USE employees;
mysql> ANALYZE TABLE employees UPDATE HISTOGRAM ON birth_date WITH 16 BUCKETS\G
*************************** 1. row ***************************
   Table: employees.employees
      Op: histogram
Msg_type: status
Msg_text: Histogram statistics created for column 'birth_date'.
mysql> USE INFORMATION_SCHEMA;
mysql> SELECT NAME, COUNT FROM INNODB_METRICS WHERE NAME LIKE 'sampled%'\G
*************************** 1. row ***************************
 NAME: sampled_pages_read
COUNT: 43
*************************** 2. row ***************************
 NAME: sampled_pages_skipped
COUNT: 843
```

这个公式根据采样计数器的数据近似得出采样率:

```java
sampling rate = sampled_page_read/(sampled_pages_read + sampled_pages_skipped)
```

基于采样计数器数据的采样率与INFORMATION_SCHEMA柱状图中的采样率值大致相同。COLUMN_STATISTICS表。

关于为生成直方图而执行的内存分配的信息，请监视Performance Schema内存/sql/直方图工具。

### 6.4 其他的考虑

ANALYZE TABLE从INFORMATION_SCHEMA.INNODB_TABLESTATS中清除表统计信息。并将STATS_INITIALIZED列设置为Uninitialized。统计信息将在下次访问表时再次收集。
