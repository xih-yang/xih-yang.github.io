# 14、MySQL 提升 - 性能优化4-慢查询分析
- 来源：https://ddkk.com/zhuanlan/db/mysql/1/14.html
- 分类：缓存数据库
- 分组：教程目录
### 一 概述

mysql的慢查询日志，它用来记录mysql中响应时间超过预知的语句，具体指运行时间超过long_query_time的sql，会被记录到慢查询日志中。

long_query_time默认值为10，单位为秒。

默认情况下，mysql是没有开启慢查询日志的，需要手动来设置这个参数。

一般只会在需要调优的时候开启，因为开启慢查询日志会对性能有一点点的影响。

### 二 查看和开启慢查询日志

#### 1. 查看是否开启

- 查看当前的慢查询日志是否启用

```java
mysql> show variables like '%low_query_log%';
+---------------------+--------------------------------------+
| Variable_name       | Value                                |
+---------------------+--------------------------------------+
| slow_query_log      | OFF                                  |
| slow_query_log_file | /var/lib/mysql/1bf2f7b2e160-slow.log |
+---------------------+--------------------------------------+
2 rows in set (0.01 sec)
```

- 开启慢查询日志功能：

方式一：使用设置全局变量的方式来修改：

```java
set global slow_query_log = 1;
```

仅对当前数据库生效，并且重启mysql后失效。

方式二：修改my.cnf配置文件

如果想要永久生效，则需要修改配置文件：

```java
low_query_log=1
low_query_log_file=/var/lib/mysql/xxxx.log
```

重启mysql后永久生效。

#### 2.查看当前慢sql的阈值

- 使用查询全局变量的方式看阈值

```java
mysql> show variables like '%long_query_time%';
+-----------------+-----------+
| Variable_name   | Value     |
+-----------------+-----------+
| long_query_time | 10.000000 |
+-----------------+-----------+
1 row in set (0.00 sec)
```

- 设置当前慢sql的阈值：

```java
set global long_query_time =1;
```

需要使用一个新的连接（会话）才能查询出变化。

如果想要永久有效，还是一样的需要修改my.cnf配置文件后重启mysql服务。

```java
mysql> show variables like '%long_query_time%';
+-----------------+----------+
| Variable_name   | Value    |
+-----------------+----------+
| long_query_time | 1.000000 |
+-----------------+----------+
1 row in set (0.01 sec)
```

当前慢查询的阈值修改为1秒。

### 三 测试和查看日志

- 写两条sql模拟慢查询：

```java
select sleep(2) from consumer_info;
select sleep(2),id, user_name, age, account_name, email, details_id from consumer_info where id=2;
```

- 查看日志：

```java
root@1bf2f7b2e160:/var/lib/mysql# cat 1bf2f7b2e160-slow.log 
mysqld, Version: 5.7.30 (MySQL Community Server (GPL)). started with:
Tcp port: 3306  Unix socket: /var/run/mysqld/mysqld.sock
Time                 Id Command    Argument
# Time: 2020-07-14T04:26:50.169628Z
# User@Host: root[root] @  [172.17.0.1]  Id:   103
# Query_time: 8.007745  Lock_time: 0.002291 Rows_sent: 4  Rows_examined: 4
use explain_test_lib;
SET timestamp=1594700810;
/* ApplicationName=DataGrip 2019.2.5 */ select sleep(2) from consumer_info;
# Time: 2020-07-14T04:27:42.688870Z
# User@Host: root[root] @  [172.17.0.1]  Id:   103
# Query_time: 2.004713  Lock_time: 0.000212 Rows_sent: 1  Rows_examined: 1
SET timestamp=1594700862;
/* ApplicationName=DataGrip 2019.2.5 */ select sleep(2),id, user_name, age, account_name, email, details_id from consumer_info where id=2;
root@1bf2f7b2e160:/var/lib/mysql#
```

可以从日志中得到的信息：

标题
含义

Time
查询日期

User@Host
所使用的mysql账号

Query_time
sql执行了多长时间（单位为秒）

ApplicationName
应用名，后面跟着的就是慢查询的sql语句。

- 查看当前有多少条慢查询日志：

```java
mysql> show global status like '%Slow_queries%';
+---------------+-------+
| Variable_name | Value |
+---------------+-------+
| Slow_queries  | 2     |
+---------------+-------+
1 row in set (0.00 sec)
```

可以查询出慢sql有多少条。

### 四 使用mysqldumoslow工具来查看日志

#### 1. mysqldumoslow工具的参数介绍：

命令
说明
可用参数

-S
表示按照何种方式排序
c: 访问计数；l: 锁定时间；r: 返回记录；t: 查询时间；al:平均锁定时间；ar:平均返回记录数；at:平均查询时间

-t
是top n的意思，即为返回前面多少条的数据
正整数

-g
正则匹配模式，可用于过滤sql类型
正则字符串

#### 2. 举例说明

得到查询时间最长的前3个sql：`mysqldumpslow -S t -t 3 slow_log.log`

得到访问次数最多的前2个sql：`mysqldumpslow -S c -t 2 slow_log.log`

得到返回记录最多的前2个含有左连接的sql：`mysqldumpslow -S r -t 2 -g "left join" slow_log.log`

#### 3. 解读统计结果

```java
root@1bf2f7b2e160:/var/lib/mysql# mysqldumpslow -S t -t 2 1bf2f7b2e160-slow.log
Reading mysql slow query log from 1bf2f7b2e160-slow.log
Count: 1  Time=2.00s (2s)  Lock=0.00s (0s)  Rows=1.0 (1), root[root]@[172.17.0.1]
  /* ApplicationName=DataGrip N.N.N */ select sleep(N),id, user_name, age, account_name, email, details_id from consumer_info where id=N
Count: 1  Time=0.00s (0s)  Lock=0.00s (0s)  Rows=0.0 (0), 0users@0hosts
  mysqld, Version: N.N.N (MySQL Community Server (GPL)). started with:
  Time: N-N-14T04:N:N.169628Z
  User@Host: root[root] @  [N.N.N.N]  Id:   N
  Query_time: N.N  Lock_time: N.N Rows_sent: N  Rows_examined: N
  use explain_test_lib;
  SET timestamp=N;
  /* ApplicationName=DataGrip N.N.N */ select sleep(N) from consumer_info
Died at /usr/bin/mysqldumpslow line 167, <> chunk 2.
```

列表
说明

Count
出现次数

Time ()
执行最长时间,小括号中的是累积总耗时

Lock ()
等待锁的时间 ,小括号中的是累积总耗时

Rows ()
sql结果集总行数, 小括号中的是扫描的总行数

#### 4. 补充：mysqlsla分析慢查询日志介绍

mysqlsla是一款MySQL的日志分析工具，功能比mysqldumoslow强大，有利于分析慢查询的原因, 包括执行频率, 数据量, 查询消耗等。

这个不是mysql自带的工具，需要自行安装，所以这里不做过多的介绍。
