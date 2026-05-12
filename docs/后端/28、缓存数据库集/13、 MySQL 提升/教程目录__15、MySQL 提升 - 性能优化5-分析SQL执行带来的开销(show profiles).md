# 15、MySQL 提升 - 性能优化5-分析SQL执行带来的开销(show profiles)
- 来源：https://ddkk.com/zhuanlan/db/mysql/1/15.html
- 分类：缓存数据库
- 分组：教程目录
### 一 概述

show profile是mysql提供的用来分析当前会话中sql语句执行的资源消耗情况的工具。

例如磁盘I/O，上下文切换，CPU，Memory等资源的使用情况。

默认处于关闭状态，并保存最近15次的运行结果。

### 二 使用show profiles

#### 1.查看是否支持并开启该功能

- 查看

```java
mysql> show variables like '%profiling%';
+------------------------+-------+
| Variable_name          | Value |
+------------------------+-------+
| have_profiling         | YES   |
| profiling              | OFF   |
| profiling_history_size | 15    |
+------------------------+-------+
3 rows in set (0.01 sec)
```

可以从结果中看到状态是OFF关闭状态。

- 开启

使用`set profiling = on;`来开启

```java
mysql> set profiling  = on;
Query OK, 0 rows affected, 1 warning (0.00 sec)
mysql> show variables like '%profiling%';
+------------------------+-------+
| Variable_name          | Value |
+------------------------+-------+
| have_profiling         | YES   |
| profiling              | ON    |
| profiling_history_size | 15    |
+------------------------+-------+
3 rows in set (0.00 sec)
```

#### 2.使用该功能

- 展示出历史sql语句

```java
mysql> show profiles;
+----------+------------+------------------------------------------------------------------------+
| Query_ID | Duration   | Query                                                                  |
+----------+------------+------------------------------------------------------------------------+
|        1 | 0.00270650 | show variables like '%profiling%'                                      |
|        2 | 0.00029800 | select sleep(2), user_name, account_name from consumer_info where id=3 |
|        3 | 0.00057525 | SELECT DATABASE()                                                      |
|        4 | 0.00205325 | show databases                                                         |
|        5 | 0.00065450 | show tables                                                            |
|        6 | 2.00402375 | select sleep(2), user_name, account_name from consumer_info where id=3 |
|        7 | 0.00089800 | select  user_name, account_name from consumer_info where id=2          |
+----------+------------+------------------------------------------------------------------------+
7 rows in set, 1 warning (0.00 sec)
```

列表中的信息有查询id、使用时间和sql语句。

- 根据query_id查询出资源消耗情况(诊断SQL)

语法：`show 资源类型 io for query 查询id;`

资源类型可选值：

可选值
描述（说明）

ALL
显示所有的开销信息

BLOCK IO
显示IO相关的开销

CONTEXT SWITCHES
上下文切换相关开销

CPU
显示处理器开销

IPC
显示发送和接受相关开销

MEMORY
内存开销

PAGE FAULTS
页面错误相关开销

SOURCE
source_function,source_file,source_line相关的开销

SWAPS
交换次数开销

示例：

```java
mysql> show profile cpu,block io for query 6;
+----------------------+----------+----------+------------+--------------+---------------+
| Status               | Duration | CPU_user | CPU_system | Block_ops_in | Block_ops_out |
+----------------------+----------+----------+------------+--------------+---------------+
| starting             | 0.000152 | 0.000152 |   0.000000 |            0 |             0 |
| checking permissions | 0.000021 | 0.000019 |   0.000000 |            0 |             0 |
| Opening tables       | 0.000038 | 0.000038 |   0.000000 |            0 |             0 |
| init                 | 0.000043 | 0.000043 |   0.000000 |            0 |             0 |
| System lock          | 0.000131 | 0.000130 |   0.000000 |            0 |             0 |
| optimizing           | 0.000046 | 0.000045 |   0.000000 |            0 |             0 |
| statistics           | 0.000109 | 0.000109 |   0.000000 |            0 |             0 |
| preparing            | 0.000041 | 0.000040 |   0.000000 |            0 |             0 |
| executing            | 0.000037 | 0.000037 |   0.000000 |            0 |             0 |
| Sending data         | 0.000147 | 0.000148 |   0.000000 |            0 |             0 |
| User sleep           | 2.002863 | 0.000971 |   0.002181 |            0 |             0 |
| end                  | 0.000049 | 0.000022 |   0.000023 |            0 |             0 |
| query end            | 0.000021 | 0.000011 |   0.000011 |            0 |             0 |
| closing tables       | 0.000020 | 0.000010 |   0.000011 |            0 |             0 |
| freeing items        | 0.000129 | 0.000063 |   0.000067 |            0 |             0 |
| logging slow query   | 0.000136 | 0.000068 |   0.000072 |            0 |             8 |
| cleaning up          | 0.000045 | 0.000027 |   0.000029 |            0 |             0 |
+----------------------+----------+----------+------------+--------------+---------------+
17 rows in set, 1 warning (0.00 sec)
```

从上述示例中可以考到Status的值非常多，无从下手，常用的其实就那么几个，如下：

status值
说明

converting HEAP to MyISAM
查询结果集太大，内存已经不够用了，需要使用磁盘了

Creating tmp table
创建临时表

Copying to tmp table on disk
把内存中临时表复制到磁盘（开销大）

locked
锁

### 三 全局查询日志

顾名思义就是记录了所有的sql语句日志。

由于这个功能会记录所有的sql，所以都是在开发环境使用。

#### 1.开启

- 使用修改配置文件永久开启

```java
#开启
general_log=1  
# 使用日志文件方式记录 
# 记录日志文件的路径
#general_log_file=/xxx/xxx/xx.log
#输出方式
#log_output=FILE
# 使用表来记录
#输出方式
log_output=FILE
```

- 使用全局变量开启

```java
# 开启
mysql> set global general_log=1;
Query OK, 0 rows affected (0.00 sec)
# 输出方式
mysql> set global log_output='TABLE';
Query OK, 0 rows affected (0.01 sec)
```

#### 2.查看

```java
# 查看记录表
mysql> select * from mysql.general_log;
+----------------------------+---------------------------+-----------+-----------+--------------+------------------------------------------------------------------------+
| event_time                 | user_host                 | thread_id | server_id | command_type | argument                                                               |
+----------------------------+---------------------------+-----------+-----------+--------------+------------------------------------------------------------------------+
| 2020-07-14 07:28:07.769289 | root[root] @ localhost [] |       102 |         0 | Query        | select * from mysql.general_log                                        |
| 2020-07-14 07:28:27.566406 | root[root] @ localhost [] |       102 |         0 | Query        | select sleep(2), user_name, account_name from consumer_info where id=3 |
| 2020-07-14 07:28:33.217762 | root[root] @ localhost [] |       102 |         0 | Query        | select * from mysql.general_log                                        |
+----------------------------+---------------------------+-----------+-----------+--------------+------------------------------------------------------------------------+
3 rows in set (0.00 sec)
```

表中记录了时间戳，用户，sql类型和sql语句。
