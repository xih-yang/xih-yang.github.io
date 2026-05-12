# 15、MySQL 实战 - SQL语句优化
- 来源：https://ddkk.com/zhuanlan/db/mysql/2/15.html
- 分类：缓存数据库
- 分组：教程目录
通常在数据量较少的时候，我们并没有那么在意SQL语句的性能问题，只要能到达目的即可；但是当你面对浩大的数据量仍然这么做时，面临的往往是耗时良久或者数据崩溃；当然，数据库优化的方式有很多，这里我们着重介绍SQL优化。

#### 准备工作：

既然要研究数据量较大的表，那么首先我们需要一个数据库，该数据库里要有很多表，表中要有很多内容；MySQL官方提供了一个模拟电影出租厅信息管理系统的数据库sakila，它的下载地址为：http://downloads.mysql.com/docs/sakila-db.zip 。压缩包中包含三个文件：

- sakila-schema.sql：数据库及表结构创建文本；
- sakila-data.sql：数据插入文本；
- sakila.mwb：sakila的MySQL Workbench数据模型，可以在MySQL工作台打开查看该数据模型。

打开cmd终端，连上MySQL数据库，执行两个脚本文件 ：

mysql> source C:\\Users\\15330\\Desktop\\sakila-schema.sql;

mysql> source C:\\Users\\15330\\Desktop\\sakila-data.sql;

成功后数据就准备好了。

## 一、优化SQL语句的一般步骤

**一般分为四步：**

**1、** 了解数据库各种SQL语句执行的频率，通过频率初步得出可能存在的问题；

**2、** 定位到执行效率低的SQL语句上；

**3、** 通过多种方法分析导致低效SQL语句的原因；

**4、** 根据找到的原因提出合理的解决办法，达到优化的目的；

下面就根据这些步骤一一进行介绍。

#### 1.1 通过show status命令查看各语句的频率

可以在MySQL连接后使用命令 SHOW [session | global] STATUS命令查看，也可以在操作系统上使用 mysqladmin extended-status 命令来查看。session关键字用来显示session级（当前连接）的统计结果，global关键字用来显示global级（自数据库上次启动至今）的统计结果。省略不写的话默认为session。

例子：

```java
mysql> show status like 'Com_%';
+-----------------------------+-------+
| Variable_name               | Value |
+-----------------------------+-------+
| Com_admin_commands          | 0     |
| Com_assign_to_keycache      | 0     |
| Com_alter_db                | 0     |
| Com_alter_db_upgrade        | 0     |
| Com_alter_event             | 0     |
| Com_alter_function          | 0     |
| Com_alter_instance          | 0     |
| Com_alter_procedure         | 0     |
| Com_alter_server            | 0     |
| Com_alter_table             | 2     |
。。。。。
```

Com_xxx表示xxx语句执行的次数，通常有以下几个比较关心：

- Com_select：执行SELECT操作的次数，一次查询只累加1；
- Com_insert：执行INSERT操作的次数，一次插入只累加1，批量插入也只算一次；
- Com_update：执行UPDATE操作的次数；
- Com_delete：执行DELETE操作的次数；

上面的参数对所有的存储引擎都适用，下面几个参数是单独针对InnoDB的，累加的算法也略有不同：

- Innodb_rows_read：SELECT查询返回的行数；
- Innodb_rows_inserted：INSERT操作插入的行数；
- Innodb_rows_updated：UPDATA操作更新的行数；
- Innodb_rows_deleted：DELETED操作删除的行数；

**注意：** 上面的更新操作计数，是对执行次数的计数，因此不论是提交还是回滚都会进行累加。

通过Com_commit 和 Com_rollback可以看到事务的提交和回滚情况，对于回滚非常频繁的数据库，可能就意味着应用编写的有问题。

通过这些参数我们就可以了解到当前数据库的应用是以插入更新为主还是查询操作为主，以及各种类型的SQL大致执行的比例是多少；这样我们就可以根据这个大方向来判断可能会有问题的SQL语句。

以下几个参数可以便于用户了解数据库的基本情况：

- Connections：试图连接MySQL服务器的次数；
- Uptime：服务器工作时间；
- Slow_queries：慢查询的次数。

#### 1.2 定位执行效率低的SQL语句

可以通过以下两种方式来定位执行效率低的SQL语句：

- 通过慢查询日志定位；通过设定long_query_time的大小来指定SQL语句执行时间超过设定值时就记录到慢查询日志中，然后通过查询日志就可以找到相应执行缓慢的SQL语句了；
- 慢查询日志只是在查询结束后才记录，所以，如果要实时查看，慢查询日志是无法起作用的；这时可以使用show processlist命令查看当前MySQL在进行的线程，包括线程的状态，是否锁表等等，可以看到实时的状态。

#### 1.3 分析原因

**通过EXPLAIN分析**

可以通过 EXPLAIN 或 DESC 命令来获取语句的执行信息，通过这些信息我们可以分析出一些问题，例如看下面的例子：

```java
mysql> explain select sum(amount) from customer a,payment b where 1=1 and a.customer_id = b.customer_id and email = 'JANE.BENNETT@sakilacustomer.org' \G;
*************************** 1. row ***************************
           id: 1
  select_type: SIMPLE
        table: a
   partitions: NULL
         type: ALL
possible_keys: PRIMARY
          key: NULL
      key_len: NULL
          ref: NULL
         rows: 599
     filtered: 10.00
        Extra: Using where
*************************** 2. row ***************************
           id: 1
  select_type: SIMPLE
        table: b
   partitions: NULL
         type: ref
possible_keys: idx_fk_customer_id
          key: idx_fk_customer_id
      key_len: 2
          ref: sakila.a.customer_id
         rows: 26
     filtered: 100.00
        Extra: NULL
2 rows in set, 1 warning (0.01 sec)
```

下面解释一下各个参数的意义，这样通过参数的值就大概能清楚SQL语句执行过程中的问题：

- id：select查询的序列号，是一组数字，表示的是查询中执行select子句或者是操作表的顺序。id相同表示加载表的顺序是从上到下；id不同id值越大，优先级越高，越先被执行；id有相同，也有不同，同时存在。id相同的可以认为是一组，从上往下顺序执行；在所有的组中，id的值越大，优先级越高，越先执行。
- select_type：表示SELECT的类型，常见的取值有SIMPLE（简单表，即不使用表连接或子查询）、PRIMARY（主查询，即外层的查询）、UNION（UNION中的第二个或者后面的查询语句）、SUBQUERY（子查询中的第一个SELECT）等。
- table：输出结果集的表。
- type：MySQL在表中找到所需行的方式，或者叫访问类型；常见的取值有ALL、index、range、ref、eq_ref、const/system、NULL，性能从前到后依次变好。
- possible_keys：表示查询时可能使用的索引；
- key：表示实际使用的索引；
- key_len：使用到索引字段的长度，在不损失精度的情况下长度越短越好；
- ref：显示索引的哪一列被使用了；
- rows：扫描行的数量；
- filtered：过滤掉的行数；
- Extra：执行情况的说明和描述，通常会包含一些比较重要的额外信息；

下面着重介绍以下type类型，从性能最差到最好一次介绍：

**1、** type=ALL，全表扫描；

```java
mysql> explain select * from film where rating > 9 \G
*************************** 1. row ***************************
           id: 1
  select_type: SIMPLE
        table: film
   partitions: NULL
         type: ALL
possible_keys: NULL
          key: NULL
      key_len: NULL
          ref: NULL
         rows: 1000
     filtered: 33.33
        Extra: Using where
1 row in set, 1 warning (0.01 sec)
```

**2、** type=index，全索引扫描；

```java
mysql> explain select title from film \G
*************************** 1. row ***************************
           id: 1
  select_type: SIMPLE
        table: film
   partitions: NULL
         type: index
possible_keys: NULL
          key: idx_title
      key_len: 767
          ref: NULL
         rows: 1000
     filtered: 100.00
        Extra: Using index
1 row in set, 1 warning (0.00 sec)
```

**3、** type=range，索引范围扫描；常见于<>=between等操作符；

```java
mysql> explain select * from payment where customer_id >=300 and customer_id <= 350\G
*************************** 1. row ***************************
           id: 1
  select_type: SIMPLE
        table: payment
   partitions: NULL
         type: range
possible_keys: idx_fk_customer_id
          key: idx_fk_customer_id
      key_len: 2
          ref: NULL
         rows: 1350
     filtered: 100.00
        Extra: Using index condition
1 row in set, 1 warning (0.00 sec)
```

**4、** type=ref，使用非唯一索引扫描或唯一索引的前缀扫描，返回匹配某个单独值的记录行；

```java
mysql> explain select * from payment where customer_id = 350\G
*************************** 1. row ***************************
           id: 1
  select_type: SIMPLE
        table: payment
   partitions: NULL
         type: ref
possible_keys: idx_fk_customer_id
          key: idx_fk_customer_id
      key_len: 2
          ref: const
         rows: 23
     filtered: 100.00
        Extra: NULL
1 row in set, 1 warning (0.00 sec)
```

**5、** type=eq_ref，类似于ref，区别在于使用的索引是唯一索引，对于索引的键值，表中只有一条记录匹配；简单的来说就是多表连接中使用primarykey或uniqueindex作为关联条件；

```java
mysql> explain select * from film a,film_text b where a.film_id = b.film_id\G
*************************** 1. row ***************************
           id: 1
  select_type: SIMPLE
        table: b
   partitions: NULL
         type: ALL
possible_keys: PRIMARY
          key: NULL
      key_len: NULL
          ref: NULL
         rows: 1000
     filtered: 100.00
        Extra: NULL
*************************** 2. row ***************************
           id: 1
  select_type: SIMPLE
        table: a
   partitions: NULL
         type: eq_ref
possible_keys: PRIMARY
          key: PRIMARY
      key_len: 2
          ref: sakila.b.film_id
         rows: 1
     filtered: 100.00
        Extra: Using where
2 rows in set, 1 warning (0.01 sec)
```

**6、** type=const/system，单表中最多有一个匹配行，查询起来非常迅速；这个匹配行中的其它列的值可以被优化器在当前查询中当做常量来处理，例如根据主键和唯一键进行的查询；

**7、** type=NULL，不用访问表或者索引，直接就可以得到结果；

还有很多取值还没列出，比如ref_or_null等等，后面遇到了再查会好一些。

再提一句，以前老版本中还有EXPLAIN EXTENDED 命令、EXPLAIN PARTITIONS命令，现在MySQL5.1版本之后都统一在EXPLAIN命令中了。

通过EXPLAIN命令分析例子中的SQL语句我们得知影响查询速度的原因是进行了全表扫描，但有时候这个方法也并不能分析出本质的原因，下面再介绍一种profile联合分析方法。

**show profile分析方法：（注意5.6.7版本之后换成了新的命令performance schema）**

profile方法可以清楚的看到SQL语句在各个阶段执行时所需要的时间。查看当前MySQL是否支持profile方法

```java
mysql> select @@have_profiling;
+------------------+
| @@have_profiling |
+------------------+
| YES              |
+------------------+
1 row in set, 1 warning (0.00 sec)
```

默认profiling是关闭的，可以通过set在session级别开启profiling，开启后只保存最近15次的运行结果：

```java
mysql> select @@profiling;
+-------------+
| @@profiling |
+-------------+
|           0 |
+-------------+
1 row in set, 1 warning (0.00 sec)
mysql> set profiling=1;
Query OK, 0 rows affected, 1 warning (0.00 sec)
```

举个例子，同样是COUNT(*)操作，对于InnoDB类型的表，因为没有元数据缓存因此执行的较慢；但对于MyISAM类型的表，因为有表元数据的缓存，因此执行的较快。下面通过profile来具体分析一下：

```java
mysql> select count(*) from payment;
+----------+
| count(*) |
+----------+
|    16049 |
+----------+
1 row in set (0.01 sec)
mysql> show profiles;
+----------+------------+------------------------------+
| Query_ID | Duration   | Query                        |
+----------+------------+------------------------------+
|        1 | 0.01137100 | select count(*) from payment |
+----------+------------+------------------------------+
1 row in set, 1 warning (0.00 sec)
mysql> show profile for query 1;
+----------------------+----------+
| Status               | Duration |
+----------------------+----------+
| starting             | 0.000058 |
| checking permissions | 0.000006 |
| Opening tables       | 0.000015 |
| init                 | 0.000016 |
| System lock          | 0.000007 |
| optimizing           | 0.011142 |
| executing            | 0.000016 |
| end                  | 0.000002 |
| query end            | 0.000009 |
| closing tables       | 0.000008 |
| freeing items        | 0.000047 |
| cleaning up          | 0.000045 |
+----------------------+----------+
12 rows in set, 1 warning (0.00 sec)
mysql> create table payment_myisam like payment;
Query OK, 0 rows affected (0.04 sec)
mysql> alter table payment_myisam engine=myisam;
Query OK, 0 rows affected (0.04 sec)
Records: 0  Duplicates: 0  Warnings: 0
mysql> insert into payment_myisam select * from payment;
Query OK, 16049 rows affected (0.06 sec)
Records: 16049  Duplicates: 0  Warnings: 0
mysql> select count(*) from payment_myisam;
+----------+
| count(*) |
+----------+
|    16049 |
+----------+
1 row in set (0.00 sec)
mysql> show profiles;
+----------+------------+--------------------------------------------------+
| Query_ID | Duration   | Query                                            |
+----------+------------+--------------------------------------------------+
|        1 | 0.01137100 | select count(*) from payment                     |
|        2 | 0.00022550 | show wainings                                    |
|        3 | 0.00011500 | show warnings                                    |
|        4 | 0.00015000 | show warnings                                    |
|        5 | 0.00012900 | performance schema                               |
|        6 | 0.03744450 | create table payment_myisam like payment         |
|        7 | 0.03600900 | alter table payment_myisam engine=myisam         |
|        8 | 0.06122275 | insert into payment_myisam select * from payment |
|        9 | 0.00016400 | select count(*) from payment_myisam              |
+----------+------------+--------------------------------------------------+
9 rows in set, 1 warning (0.00 sec)
mysql> show profile for query 9;
+----------------------+----------+
| Status               | Duration |
+----------------------+----------+
| starting             | 0.000047 |
| checking permissions | 0.000004 |
| Opening tables       | 0.000013 |
| init                 | 0.000020 |
| System lock          | 0.000005 |
| optimizing           | 0.000006 |
| executing            | 0.000006 |
| end                  | 0.000003 |
| query end            | 0.000004 |
| closing tables       | 0.000008 |
| freeing items        | 0.000032 |
| cleaning up          | 0.000016 |
+----------------------+----------+
12 rows in set, 1 warning (0.00 sec)
```

从例子中可以看到，InnoDB类型的表在optimizing过程中消耗了非常多的时间，而MyISAM类型的表基本没有消耗太多时间。

我们还可以用一个或多个关键字来查看optimizing消耗的那么多时间主要浪费在了什么资源上：

- ALL: 显示所有的开销信息；
- BLOCK IO ： 显示块IO相关开销；
- CONTEXT SWITCHS: 上下文切换相关开销；
- CPU : 显示cpu 相关开销；
- IPC: 显示发送和接收相关开销；
- MEMORY： 显示内存相关开销；
- PAGE FAULTS：显示页面错误相关开销信息；
- SOURCE ： 显示和Source_function ,Source_file,Source_line 相关的开销信息；
- SWAPS：显示交换次数相关的开销信息；

比如要查看在CPU上消耗的时间：可以看到optimizing的时间主要消耗自系统cpu上；

```java
mysql> show profile cpu for query 1;
+----------------------+----------+----------+------------+
| Status               | Duration | CPU_user | CPU_system |
+----------------------+----------+----------+------------+
| starting             | 0.000058 | 0.000000 |   0.000000 |
| checking permissions | 0.000006 | 0.000000 |   0.000000 |
| Opening tables       | 0.000015 | 0.000000 |   0.000000 |
| init                 | 0.000016 | 0.000000 |   0.000000 |
| System lock          | 0.000007 | 0.000000 |   0.000000 |
| optimizing           | 0.011142 | 0.000000 |   0.015625 |
| executing            | 0.000016 | 0.000000 |   0.000000 |
| end                  | 0.000002 | 0.000000 |   0.000000 |
| query end            | 0.000009 | 0.000000 |   0.000000 |
| closing tables       | 0.000008 | 0.000000 |   0.000000 |
| freeing items        | 0.000047 | 0.000000 |   0.000000 |
| cleaning up          | 0.000045 | 0.000000 |   0.000000 |
+----------------------+----------+----------+------------+
12 rows in set, 1 warning (0.00 sec)
```

如果对源码感兴趣，还可以使用 show profile source for query查看源码文件的相关信息。

**通过trace分析：**

MySQL5.6提供了对SQL的跟踪trace，通过trace文件可以进一步了解为什么优化器为什么选择A执行计划而不选择B执行计划，这样可以帮助我们更好的理解优化器的行为。

使用方式：首先打开trace，设置格式为JSON，并设置最大能够使用的内存大小，避免解析过程中内存太小而不能完整显示；然后执行想要做trace的SQL语句；最后检查INFORMATION_SCHEMA.OPTIMIZER_TRACE 就可以知道MySQL是如何执行SQL语句的。

```java
mysql> set optimizer_trace="enabled=on",end_markers_in_json=on;
Query OK, 0 rows affected (0.00 sec)
mysql> set optimizer_trace_max_mem_size=1000000;
Query OK, 0 rows affected (0.00 sec)
mysql> select rental_id from rental where 1=1 and rental_date >= '2005-05-25 04:00:00' and rental_date <= '2005-05-25 05:00:00' and inventory_id=4466;
+-----------+
| rental_id |
+-----------+
|        39 |
+-----------+
1 row in set (0.01 sec)
mysql> select * from information_schema.optimizer_trace \G
*************************** 1. row ***************************
                            QUERY: select rental_id from rental where 1=1 and rental_date >= '2005-05-25 04:00:00' and rental_date <= '2005-05-25 05:00:00' and inventory_id=4466
                            TRACE: {
  "steps": [
    {
      "join_preparation": {
        "select#": 1,
        "steps": [
          {
            "expanded_query": "/* select#1 */ select rental.rental_id AS rental_id from rental where ((1 = 1) and (rental.rental_date >`= '2005-05-25 04:00:00') and (rental.rental_date `<= '2005-05-25 05:00:00') and (rental.inventory_id = 4466))"
          }
        ] /* steps */
。。。。。完整文件就不贴出来了，太长了
```

#### 1.4 确定问题并采取相应办法

经过以上步骤大致就可以确定出现问题的原因，现在就是对应原因做出优化。比如前面提到过的那个因为是全表扫描导致查询结果缓慢的SQL语句，根据这一点，我们可以对它创建索引来提高查询效率：

```java
mysql> create index idx_email on customer(email);
Query OK, 0 rows affected (0.04 sec)
Records: 0  Duplicates: 0  Warnings: 0
mysql> explain select sum(amount) from customer a,payment b where 1=1 and a.customer_id = b.customer_id and email = 'JANE.BENNETT@sakilacustomer.org' \G
*************************** 1. row ***************************
           id: 1
  select_type: SIMPLE
        table: a
   partitions: NULL
         type: ref
possible_keys: PRIMARY,idx_email
          key: idx_email
      key_len: 153
          ref: const
         rows: 1
     filtered: 100.00
        Extra: Using index
*************************** 2. row ***************************
           id: 1
  select_type: SIMPLE
        table: b
   partitions: NULL
         type: ref
possible_keys: idx_fk_customer_id
          key: idx_fk_customer_id
      key_len: 2
          ref: sakila.a.customer_id
         rows: 26
     filtered: 100.00
        Extra: NULL
2 rows in set, 1 warning (0.00 sec)
```

可以看到对customer表的email建立索引过后，查询耗费的时间明显减少，并且查询的行数从583行减到1行，这说明建立索引可以十分精确的查找到所需内容，但有一点需要注意，它的key_len明显增大了。

## 二、两个简单实用的优化方法

优化的方法有很多，但是对于一般开发人员来说下面介绍的两个最简单实用，一般掌握这两个就很有用处了。

#### 2.1 定期分析表和检查表

分析表的语法如下：

ANALYZE [LOCAL | NO_WRITE_TO_BINLOG] TABLE tbl_name [, tbl_name ] ....

这条语句能够用于分析然后存储表的关键字分布，分析的结果可以使得系统得到准确的统计信息，使得SQL能够生成正确的执行计划。比如当某个执行某个计划时并不是预期的那样而又不知道原因时，执行一次分析表可能会解决问题。

```java
例如对表payment进行分析
mysql> analyze table payment;
+----------------+---------+----------+----------+
| Table          | Op      | Msg_type | Msg_text |
+----------------+---------+----------+----------+
| sakila.payment | analyze | status   | OK       |
+----------------+---------+----------+----------+
1 row in set (0.02 sec)
```

检查表的语法如下：

CHECK TABLE tbl_name [, tbl_name] ...[option] ... option = {QUICK|FAST|MEDIUM|EXTENDED|CHANGED}

检查表的作用是检查一个或多个表是否有错误，check table语句对MyISAM和InnoDB表有作用；并且对MyISAM表来说，关键字统计数据会被更新，例如

```java
mysql> check table payment_myisam;
+-----------------------+-------+----------+----------+
| Table                 | Op    | Msg_type | Msg_text |
+-----------------------+-------+----------+----------+
| sakila.payment_myisam | check | status   | OK       |
+-----------------------+-------+----------+----------+
1 row in set (0.01 sec)
```

检查表语句也可以检查视图是否有错误，比如视图定义中的表已经不存在，举例如下：

```java
1. 首先创建一个视图，依赖表payment_myisam
mysql> create view v_payment_myisam as select * from payment_myisam;
Query OK, 0 rows affected (0.01 sec)
2. 检查一下视图，发现并没有问题
mysql> check table v_payment_myisam;
+-------------------------+-------+----------+----------+
| Table                   | Op    | Msg_type | Msg_text |
+-------------------------+-------+----------+----------+
| sakila.v_payment_myisam | check | status   | OK       |
+-------------------------+-------+----------+----------+
1 row in set (0.00 sec)
3. 删除视图依赖的表payment_myisam
mysql> drop table payment_myisam;
Query OK, 0 rows affected (0.00 sec)
4. 再检查视图发现出错了
mysql> check table v_payment_myisam \G
*************************** 1. row ***************************
   Table: sakila.v_payment_myisam
      Op: check
Msg_type: Error
Msg_text: Table 'sakila.payment_myisam' doesn't exist
*************************** 2. row ***************************
   Table: sakila.v_payment_myisam
      Op: check
Msg_type: Error
Msg_text: View 'sakila.v_payment_myisam' references invalid table(s) or column(s) or function(s) or definer/invoker of view lack rights to use them
*************************** 3. row ***************************
   Table: sakila.v_payment_myisam
      Op: check
Msg_type: error
Msg_text: Corrupt
3 rows in set (0.00 sec)
```

#### 2.2 定期优化表

优化表的语法如下：

OPTIMIZE [LOCAL | NO_WRITE_TO_BINLOG] TABLE tbl_name [, tbl_name] ...

如果已经删除了表的一大部分，或者如果已经对含有可变长度行的表（含有varchar、blob、text列的表）进行了很多更改，那么应该使用OPTIMIZE TABLE语句来进行表优化。（前面第五节讲blob和text字符类型时有提到过）这个命令可以将表中的空间碎片进行合并，并且可以消除由于删除或者更新造成的的空间浪费，但**这个命令只对MyISAM、BDB、InnoDB表起作用。**

比如下面的例子优化表payment_myisam，由于这个表已经被删掉了，所以会出现如下情况：

```java
mysql> optimize table payment_myisam;
+-----------------------+----------+----------+---------------------------------------------+
| Table                 | Op       | Msg_type | Msg_text                                    |
+-----------------------+----------+----------+---------------------------------------------+
| sakila.payment_myisam | optimize | Error    | Table 'sakila.payment_myisam' doesn't exist |
| sakila.payment_myisam | optimize | status   | Operation failed                            |
+-----------------------+----------+----------+---------------------------------------------+
2 rows in set (0.00 sec)
```

对于InnoDB引擎的表来说，通过设置innodb_file_per_table参数，将InnoDB设置为独立表空间模式，这样，每个数据库的每个表都会生成一个独立的ibd文件，用于存储表的数据和索引，这样做在一定程度上可以减轻InnoDB表空间回收的问题。另外，在删除大量数据后，InnoDB表可以通过alter table但是不修改引擎的方式来回收不用的空间：

```java
mysql> alter table payment engine=innodb;
Query OK, 0 rows affected (0.43 sec)
Records: 0  Duplicates: 0  Warnings: 0
```

**注意：ANALYZE、CHECK、OPTIMIZE、ALTER TABLE执行期间将对表进行锁定，因此一定注意要在数据库不繁忙的时候执行相关操作。**

## 三、常用的SQL的优化

最常用的是通过索引来优化查询，这一个会单独拿出来说；其它的语句像插入、分组等待都有各自的优化方法，下面就一一进行介绍。

#### 3.1 大批量插入数据

大批量导入数据的时候一般使用load命令，这时候适当的设置可以提高导入速度。

**对于MyISAM表：**

在导入数据到一个**非空**的表中前关闭表的非唯一索引的更新可以提高导入的效率：（对于一个空表来说默认就是先导入数据再创建索引，所以不需要这样设置）

```java
ALTER TABLE tbl_name DISABLE KEYS;    关闭非唯一索引
loading the data   (load data infile ‘..’ into table tbl_name)
ALTER TABLE tbl_name ENABLE KEYS;     打开非唯一索引
测试效率提高6倍左右
```

**对于InnoDB表：**

上面的方法并不适用于InnoDB表，根据InnoDB表自身的特性有以下几种提高导入效率的方式；

**1. 将导入的数据按照主键的顺序排列**

因为InnoDB表是按照主键的顺序保存的，因此将导入的数据提前按照主键的顺序排列好能提高导入的效率。测试效率提高1.2倍。

**2. 导入数据前关闭唯一性校验，结束后再打开**

```java
SET UNIQUE_CHECKS = 0  关闭唯一性校验
load data infile '...' into table tbl_name
SET UNIQUE_CHECKS = 1  恢复唯一性校验
效率提升约1.1倍
```

**3. 先关闭自动提交，结束后再打开**

```java
SET AUTOCOMMIT = 0    关闭自动提交
load data infile '...' into table tbl_name
SET AUTOCOMMIT = 1    打开自动提交
效率提高约1.15倍
```

#### 3.2 优化INSERT语句

在使用insert语句插入数据时可以考虑以下几种方式进行优化：

- 同一用户插入多行时尽量使用多值表的插入语句（insert into table values (..), (...), (...) ），这样有助于减少客户端与数据库之间的连接、关闭等消耗；
- 不同用户插入很多行可以通过insert delayed 语句得到更高的速度，它其实是在插入时将数据放在内存队列中，并没有真正写入磁盘；
- 将索引文件和数据文件分在不同的磁盘上存放（利用建表中的选项）；
- 如果进行批量插入，可以通过增加bulk_insert_buffer_size变量值的方法来提高速度，但注意这个只能对Myisam表使用；
- 当从一个文本文件装载一个表时，使用LOAD DATA INFILE 通常比使用很多INSERT语句快20倍。

#### 3.3 优化ORDER BY语句

优化该语句前需要清楚MySQL中是怎样排序的，一般MySQL中有两种排序方式：

第一种通过有序索引顺序扫描直接返回有序数据，这种方式在使用explain分析查询时显示为Using Index，不需要额外的排序，操作效率较高；

第二种是通过对返回数据进行排序，也就是常说的Filesort排序（所有不是通过索引直接返回排序结果的排序都是Filesort排序。

了解排序方式过后，优化目标就清晰了：** 尽量减少额外排序，通过索引直接返回有序数据。**

总结，下列SQL可以使用索引：

```java
SELECT * FROM tabname ORDER BY key_part1,key_part2 ...;
SELECT * FROM tabname WHERE key_part1=1 ORDER BY key_part1 DESC, key_part2 DESC;
SELECT * FROM tabname ORDER BY key_part1 DESC,key_part2 DESC...;
```

以下几种情况则不使用索引：

```java
--- order by 的字段混合desc和asc
SELECT * FROM tabname ORDER BY key_part1 desc,key_part2 asc;
--- 用于查询行的关键字与order by中使用的不相同
SELECT * FROM tabname WHERE key2 = constant ORDER BY key1;
--- 对不同的关键字使用order by
SELECT * FROM tabname ORDER BY key1, key2;
```

尽量只使用必要的字段，SELECT必要的字段名称而不是所有，这样可以减少排序区的使用，提高SQL性能。

#### 3.4 优化GROUP BY语句

如果查询包含group by 语句但想要避免排序结果的消耗则可以指定order by null禁止排序，

```java
mysql> explain select payment_date,sum(amount) from payment group by payment_date \G
*************************** 1. row ***************************
           id: 1
  select_type: SIMPLE
        table: payment
   partitions: NULL
         type: ALL
possible_keys: NULL
          key: NULL
      key_len: NULL
          ref: NULL
         rows: 16125
     filtered: 100.00
        Extra: Using temporary; Using filesort
1 row in set, 1 warning (0.00 sec)
mysql> explain select payment_date,sum(amount) from payment group by payment_date order by null \G
*************************** 1. row ***************************
           id: 1
  select_type: SIMPLE
        table: payment
   partitions: NULL
         type: ALL
possible_keys: NULL
          key: NULL
      key_len: NULL
          ref: NULL
         rows: 16125
     filtered: 100.00
        Extra: Using temporary
1 row in set, 1 warning (0.00 sec)
```

可以看到上面例子中order by null 不需要进行filesort 排序，上面也提到filesort排序是比较耗费时间的。

#### 3.5 优化嵌套查询

子查询可以一次完成多个逻辑操作，也可以避免事务或者表锁死，写起来也比较容易，有时候子查询可以被更有效率的连接（JOIN）替代。

```java
mysql> explain select * from customer where customer_id not in (select customer_id from payment ) \G
*************************** 1. row ***************************
           id: 1
  select_type: PRIMARY
        table: customer
   partitions: NULL
         type: ALL
possible_keys: NULL
          key: NULL
      key_len: NULL
          ref: NULL
         rows: 599
     filtered: 100.00
        Extra: Using where
*************************** 2. row ***************************
           id: 2
  select_type: DEPENDENT SUBQUERY
        table: payment
   partitions: NULL
         type: index_subquery
possible_keys: idx_fk_customer_id
          key: idx_fk_customer_id
      key_len: 2
          ref: func
         rows: 26
     filtered: 100.00
        Extra: Using index
2 rows in set, 1 warning (0.01 sec)
mysql> explain select * from customer a left join payment b on a.customer_id = b.customer_id where b.customer_id is null \G
*************************** 1. row ***************************
           id: 1
  select_type: SIMPLE
        table: a
   partitions: NULL
         type: ALL
possible_keys: NULL
          key: NULL
      key_len: NULL
          ref: NULL
         rows: 599
     filtered: 100.00
        Extra: NULL
*************************** 2. row ***************************
           id: 1
  select_type: SIMPLE
        table: b
   partitions: NULL
         type: ref
possible_keys: idx_fk_customer_id
          key: idx_fk_customer_id
      key_len: 2
          ref: sakila.a.customer_id
         rows: 26
     filtered: 100.00
        Extra: Using where; Not exists
2 rows in set, 1 warning (0.00 sec)
```

从中可以看出查询关联的类型从index_subquery调整为了ref，因此JOIN效率更高一些，它使得MySQL不需要再内存中创建临时表来完成这个逻辑上需要两个步骤的查询工作。

#### 3.6 优化OR条件

对含有OR的查询字句，如果要利用索引，则OR之间的每个条件列都必须用到索引，如果没有，则应该考虑增加索引。因为MySQL在处理含有OR字句的查询时，实际是对OR的各个字段分别查询后的结果进行了UNION操作。

#### 3.7 优化分页查询

分页查询一个常见的场景是“ limit 1000，20 ” ，此时MySQL需要排序出前1020条记录后返回1001到1020条记录，前1000条都会被抛弃，查询和排序的代价非常高。

**第一种优化思路：**

在索引上完成排序分页操作，最后根据主键关联回原表查询所需要的其他列内容。例如：

```java
mysql> explain select film_id,description from film order by title limit 50,5 \G
*************************** 1. row ***************************
           id: 1
  select_type: SIMPLE
        table: film
   partitions: NULL
         type: ALL
possible_keys: NULL
          key: NULL
      key_len: NULL
          ref: NULL
         rows: 1000
     filtered: 100.00
        Extra: Using filesort
1 row in set, 1 warning (0.01 sec)
mysql> explain select a.film_id,a.description from film a inner join (select film_id from film order by title limit 50,5)b on a.film_id = b.film_id \G
*************************** 1. row ***************************
           id: 1
  select_type: PRIMARY
        table: <derived2>
   partitions: NULL
         type: ALL
possible_keys: NULL
          key: NULL
      key_len: NULL
          ref: NULL
         rows: 55
     filtered: 100.00
        Extra: NULL
*************************** 2. row ***************************
           id: 1
  select_type: PRIMARY
        table: a
   partitions: NULL
         type: eq_ref
possible_keys: PRIMARY
          key: PRIMARY
      key_len: 2
          ref: b.film_id
         rows: 1
     filtered: 100.00
        Extra: NULL
*************************** 3. row ***************************
           id: 2
  select_type: DERIVED
        table: film
   partitions: NULL
         type: index
possible_keys: NULL
          key: idx_title
      key_len: 767
          ref: NULL
         rows: 55
     filtered: 100.00
        Extra: Using index
3 rows in set, 1 warning (0.00 sec)
```

可以看到这种方式尽可能少的扫描页面来提高了分页效率。

**第二种优化思路：**

将limit m，n 转化为 limit n查询，通过在上一页做个标记来直接跳转到需要的页，比如：

```java
mysql> explain select * from payment order by rental_id desc limit 410,10 \G
*************************** 1. row ***************************
           id: 1
  select_type: SIMPLE
        table: payment
   partitions: NULL
         type: ALL
possible_keys: NULL
          key: NULL
      key_len: NULL
          ref: NULL
         rows: 16125
     filtered: 100.00
        Extra: Using filesort
1 row in set, 1 warning (0.00 sec)
mysql> explain select * from payment where rental_id < 15640 order by rental_id desc limit 10 \G
*************************** 1. row ***************************
           id: 1
  select_type: SIMPLE
        table: payment
   partitions: NULL
         type: range
possible_keys: fk_payment_rental
          key: fk_payment_rental
      key_len: 5
          ref: NULL
         rows: 8062
     filtered: 100.00
        Extra: Using index condition
1 row in set, 1 warning (0.00 sec)
```

上面的15640就是上一页的标记值，可以看到，原来的全表查询变成了排序取值，减少了消耗。但是注意，这种方法只适合在排序字段不会出现重复值的特定环境，如果有重复值还用这种方法就会造成数据的丢失。

#### 3.8 使用SQL提示

SQL提示就是在SQL语句中加入一些人为的提示来达到优化操作的目的。比如 SELECT SQL_BUFFER_RESULTS * FROM ...... 语句，强制MySQL生成一个临时结果集，这样所有表上的锁定均被释放，这在遇到表锁定问题时或要花很长时间将结果传给客户端时有所帮助。

**1. USE INDEX**

在查询语句的表名后面，添加USE INDEX来提供希望MySQL参考的索引列表

```java
explain select count(*) from rental use index (idx_rental_date) \G
```

**2. IGNORE INDEX**

使用ignore index忽略指定的一个或多个索引。

```java
explain select count(*) from rental ignore index (idx_rental_date) \G
```

**3. FORCE INDEX**

强制MySQL使用一个特定的索引，有时候不强制指定MySQL会进行全表扫描。

```java
mysql> explain select * from rental where inventory_id > 1 \G
*************************** 1. row ***************************
           id: 1
  select_type: SIMPLE
        table: rental
   partitions: NULL
         type: ALL
possible_keys: idx_fk_inventory_id
          key: NULL
      key_len: NULL
          ref: NULL
         rows: 16008
     filtered: 50.00
        Extra: Using where
1 row in set, 1 warning (0.01 sec)
mysql> explain select * from rental use index (idx_fk_inventory_id) where inventory_id > 1 \G
*************************** 1. row ***************************
           id: 1
  select_type: SIMPLE
        table: rental
   partitions: NULL
         type: ALL
possible_keys: idx_fk_inventory_id
          key: NULL
      key_len: NULL
          ref: NULL
         rows: 16008
     filtered: 50.00
        Extra: Using where
1 row in set, 1 warning (0.00 sec)
mysql> explain select * from rental force index (idx_fk_inventory_id) where inventory_id > 1 \G
*************************** 1. row ***************************
           id: 1
  select_type: SIMPLE
        table: rental
   partitions: NULL
         type: range
possible_keys: idx_fk_inventory_id
          key: idx_fk_inventory_id
      key_len: 3
          ref: NULL
         rows: 8004
     filtered: 100.00
        Extra: Using index condition
1 row in set, 1 warning (0.00 sec)
```

可以看到，使用force index强制执行了索引，虽然在这个情况下使用索引不是最优的选择，但这使我们有了一定的权力来决定使用哪个索引，在某种情况下会有用处。

## 四、常用SQL技巧

#### 4.1 正则表达式的使用

例如使用正则表达式来查询数据库中使用163邮箱的用户：

```java
select first_name,email from customer where email regexp "@163[,.]com$";
```

如果不使用正则表达式则 WHERE 条件后要这么写：

```java
email like "@163%.com" or email like "@163%,com"
```

#### 4.2 巧用 RAND() 提取随机行

MySQL中使用RAND() 函数来产生随机数，比如按照随机顺序检索数据行：

```java
select * from category order by rand();
```

如果想随机抽取一部分样本的时候，可以通过随机排序然后抽取前n条即可：

```java
select * from category order by rand() limit 5;
```

随机抽取样本对总体的统计具有十分重要的意义。

#### 4.3 利用GROUP BY 的WITH ROLLUP子句

它不仅仅能检索出各组的聚合信息，还能检索出本组类的整体聚合信息，例如：

```java
mysql> select date_format(payment_date,'%Y-%m'),staff_id,sum(amount) from payment group by date_format(payment_date,'%Y-%m'),staff_id;
+-----------------------------------+----------+-------------+
| date_format(payment_date,'%Y-%m') | staff_id | sum(amount) |
+-----------------------------------+----------+-------------+
| 2005-05                           |        1 |     2621.83 |
| 2005-05                           |        2 |     2202.60 |
| 2005-06                           |        1 |     4776.36 |
| 2005-06                           |        2 |     4855.52 |
| 2005-07                           |        1 |    14003.54 |
| 2005-07                           |        2 |    14370.35 |
| 2005-08                           |        1 |    11853.65 |
| 2005-08                           |        2 |    12218.48 |
| 2006-02                           |        1 |      234.09 |
| 2006-02                           |        2 |      280.09 |
+-----------------------------------+----------+-------------+
10 rows in set (0.02 sec)
mysql> select date_format(payment_date,'%Y-%m'),ifnull(staff_id,''),sum(amount) from payment group by date_format(payment_date,'%Y-%m'),staff_id with rollup;
+-----------------------------------+---------------------+-------------+
| date_format(payment_date,'%Y-%m') | ifnull(staff_id,'') | sum(amount) |
+-----------------------------------+---------------------+-------------+
| 2005-05                           | 1                   |     2621.83 |
| 2005-05                           | 2                   |     2202.60 |
| 2005-05                           |                     |     4824.43 |
| 2005-06                           | 1                   |     4776.36 |
| 2005-06                           | 2                   |     4855.52 |
| 2005-06                           |                     |     9631.88 |
| 2005-07                           | 1                   |    14003.54 |
| 2005-07                           | 2                   |    14370.35 |
| 2005-07                           |                     |    28373.89 |
| 2005-08                           | 1                   |    11853.65 |
| 2005-08                           | 2                   |    12218.48 |
| 2005-08                           |                     |    24072.13 |
| 2006-02                           | 1                   |      234.09 |
| 2006-02                           | 2                   |      280.09 |
| 2006-02                           |                     |      514.18 |
| NULL                              |                     |    67416.51 |
+-----------------------------------+---------------------+-------------+
16 rows in set (0.02 sec)
```

可以看到，每个staff_id为空的那一行都是对本组的聚合，最后一行还有一个总的集合。

**注意：使用ROLLUP时不能同时使用ORDER BY子句进行结果排序，另外，LIMIT用在ROLLUP后面。**

#### 4.4 用BIT GROUP FUNCTIONS做统计

主要介绍如何共同使用GROUP BY语句和BIT_AND 、BIT_OR函数完成统计。

比如一个超市有1、2、3、4四种商品，每位顾客购买时可任意挑选，假如一位顾客购买的种类是5，表明该顾客购买的1、3两种商品（5的二进制是0101，从右到左第1位和第3位），这样就可以记录下每位顾客购买的商品。比如现在有这样的表：

```java
mysql> create table order_rab (id int,customer_id int,kind int);
Query OK, 0 rows affected (0.02 sec)
mysql> insert into order_rab values(1,1,5),(2,1,4),(3,2,3),(4,2,4);
Query OK, 4 rows affected (0.01 sec)
Records: 4  Duplicates: 0  Warnings: 0
mysql> select * from order_rab;    有两位顾客分别买了不同物品
+------+-------------+------+
| id   | customer_id | kind |
+------+-------------+------+
|    1 |           1 |    5 |
|    2 |           1 |    4 |
|    3 |           2 |    3 |
|    4 |           2 |    4 |
+------+-------------+------+
4 rows in set (0.00 sec)
统计这两个顾客在超市都购买过什么物品
mysql> select customer_id,bit_or(kind) from order_rab group by customer_id;
+-------------+--------------+
| customer_id | bit_or(kind) |
+-------------+--------------+
|           1 |            5 | 
|           2 |            7 |
+-------------+--------------+
2 rows in set (0.00 sec)
统计这两个顾客每次来超市都必会买什么
mysql> select customer_id,bit_and(kind) from order_rab group by customer_id;
+-------------+---------------+
| customer_id | bit_and(kind) |
+-------------+---------------+
|           1 |             4 |
|           2 |             0 |
+-------------+---------------+
2 rows in set (0.00 sec)
```

这种统计就是利用二进制的与、或运算进行的，它的有点就是用简洁的数据表示丰富的信息，大大节省空间，还能提高部分统计计算速度。它的缺点就是损失了顾客购买的详细信息，因此还要看情况选择。

#### 4.5 数据库名、表名大小写问题

一般MySQL中对大小写不敏感，但UNIX环境中操作系统对大小写敏感，因而有时候在该系统上使用MySQL时如果不注意大小写就会产生错误，因此最好保持一致性，**总是用小写创建数据库名和表名**。

lower_case_tables_name系统变量决定如何在硬盘上保存、使用表名和数据库名，是否对大小写敏感。可以在MySQL启动时设置这个变量，它的取值有三种：0、1、2；

- 0表示使用指定的大写和小写在硬盘上保存表名和数据库名，对大小写敏感；
- 1表示在硬盘上统统用小写保存，但名称对大小写敏感，MySQL会将大写自动转化为小写；
- 2表示在磁盘上保存时使用指定的大小写，但是在MySQL中会将他们转化为小写。

因此，如果在敏感性不同的文件系统的平台之间转移表就会出现错误，此时需要修改该变量的值，比如UNIX取0，Windows中取2 。**一定要养成在同一查询中使用相同大小写来引用给定数据库或表名的习惯**。

#### 4.6 使用外键需要注意的问题

在MySQL中，InnoDB存储引擎支持对外部关键字约束条件的检查，而对其他类型存储引擎，当使用REFERENCES tbl_name(col_name)子句定义列时可以使用外部关键字，但并没有实际效果，只能作为备忘录或者注释来提醒用户目前正定义的列指向另一个表中的一个列。
