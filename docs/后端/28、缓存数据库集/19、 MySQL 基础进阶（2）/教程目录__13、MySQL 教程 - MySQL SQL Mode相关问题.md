# 13、MySQL 教程 - MySQL SQL Mode相关问题
- 来源：https://ddkk.com/zhuanlan/db/mysql/7/13.html
- 分类：缓存数据库
- 分组：教程目录
MySQL可以在不同的SQL模式下运行，这样，我们可以通过修改SQL模式来达到数据校验、迁移等功能。

## 一、常用的SQL模式

选中某种模式，其实是一系列模式的组合，这样就可以将多种不同功能的原子模式进行组合得到想要的功能。

## 二、SQL Mode简介

在MySQL中，SQL Mode常用来解决下面几类问题：

- 通过设置SQL Mode，完成不同严格程度的数据校验，有效的保障数据准确性；
- 通过设置SQL Mode为ANSI模式，来保证大多数SQL符合标准SQL语法，这样在不同数据库之间进行迁移时不需要对业务SQL进行较大的修改；
- 在不同数据库之间进行数据迁移之前，可以通过设置SQL Mode使数据更方便的迁移到别的数据库中。

下面举个例子看一下;

```java
当前数据库的模式为严格模式
mysql> select @@sql_mode;
+----------------------------------------------------------------+
| @@sql_mode                                                     |
+----------------------------------------------------------------+
| STRICT_TRANS_TABLES,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION |
+----------------------------------------------------------------+
1 row in set (0.00 sec)
如果此时向数据库表中的name varchar(5)字段插入超过5的值，那么会引发错误；
但如果不是严格模式，那此时它会将超过的部分截断后插入，不会出错但是会有一个警告。
```

**设置SQL Mode模式的方式：**

**1、** 使用”--sql-mode=“modes”“选项在MySQL启动时设置；

**2、** 使用语句SET[SESSION|GLOBAL]sql_mode=”modes“修改，其中SESSION表示只在本次连接中生效，GLOBAL则表示本次连接不生效，对于新的连接则生效；

## 三、SQL Mode常见功能

**1. 检验日期数据的合法性**

```java
SQL Mode模式改为ANSI，向日期字段插入一个有误的数据，发现该模式下可以插入，但数值都变成了0
mysql> set session sql_mode='ANSI';
Query OK, 0 rows affected, 1 warning (0.00 sec)
mysql> create table t (d datetime);
Query OK, 0 rows affected (0.01 sec)
mysql> insert into t values('2018-04-31');
Query OK, 1 row affected, 1 warning (0.01 sec)
mysql> select * from t;
+---------------------+
| d                   |
+---------------------+
| 0000-00-00 00:00:00 |
+---------------------+
1 row in set (0.00 sec)
mysql> select @@sql_mode;
+--------------------------------------------------------------------------------+
| @@sql_mode                                                                     |
+--------------------------------------------------------------------------------+
| REAL_AS_FLOAT,PIPES_AS_CONCAT,ANSI_QUOTES,IGNORE_SPACE,ONLY_FULL_GROUP_BY,ANSI |
+--------------------------------------------------------------------------------+
1 row in set (0.00 sec)
当将SQL Mode改为传统模式（也属于严格模式）时，报错，无法插入
mysql> set session sql_mode='traditional';
Query OK, 0 rows affected, 1 warning (0.00 sec)
mysql> insert into t values('2018-04-31');
ERROR 1292 (22007): Incorrect datetime value: '2018-04-31' for column 'd' at row 1
mysql> select @@sql_mode;
+------------------------------------------------------------------------------------------------------------------------------------------------------+
| @@sql_mode                                                                                                                                           |
+------------------------------------------------------------------------------------------------------------------------------------------------------+
| STRICT_TRANS_TABLES,STRICT_ALL_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,TRADITIONAL,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION |
+------------------------------------------------------------------------------------------------------------------------------------------------------+
1 row in set (0.00 sec)
```

**2. 检验运算的合法性**

比如如果在INSERT 或 UPDATE 过程中，如在严格模式下运行MOD(X, 0)则会报错，但是在非严格模式下MOD(X, 0)的结果为NULL；

```java
下面展示了在不同模式下插入数值的情况：
mysql> set session sql_mode='ANSI';
Query OK, 0 rows affected, 1 warning (0.00 sec)
mysql> create table t (i int);
Query OK, 0 rows affected (0.02 sec)
mysql> insert into t values(9%0);
Query OK, 1 row affected (0.00 sec)
mysql> select * from t;
+------+
| i    |
+------+
| NULL |
+------+
1 row in set (0.00 sec)
mysql> set session sql_mode='traditional';
Query OK, 0 rows affected, 1 warning (0.00 sec)
mysql> insert into t values(9%0);
ERROR 1365 (22012): Division by 0
```

**3. 启用NO_BACKSLASH_ESCAPES模式使反斜线成为普通字符**

```java
mysql> set session sql_mode='ANSI';
Query OK, 0 rows affected, 1 warning (0.00 sec)
mysql> select @@sql_mode;
+--------------------------------------------------------------------------------+
| @@sql_mode                                                                     |
+--------------------------------------------------------------------------------+
| REAL_AS_FLOAT,PIPES_AS_CONCAT,ANSI_QUOTES,IGNORE_SPACE,ONLY_FULL_GROUP_BY,ANSI |
+--------------------------------------------------------------------------------+
1 row in set (0.00 sec)
mysql> create table t (context varchar(20));
Query OK, 0 rows affected (0.02 sec)
mysql> insert into t values('\beijing');
Query OK, 1 row affected (0.00 sec)
mysql> select * from t;
+---------+
| context |
+---------+
|eijing |
+---------+
1 row in set (0.00 sec)
mysql> insert into t values('\\beijing');
Query OK, 1 row affected (0.00 sec)
mysql> select * from t;
+----------+
| context  |
+----------+
|eijing  |
| \beijing |
+----------+
2 rows in set (0.00 sec)
mysql> set sql_mode=' REAL_AS_FLOAT,PIPES_AS_CONCAT,ANSI_QUOTES,IGNORE_SPACE,ONLY_FULL_GROUP_BY,ANSI,NO_BACKSLASH_ESCAPES';
ERROR 1231 (42000): Variable 'sql_mode' can't be set to the value of ' REAL_AS_FLOAT'
mysql> set sql_mode='REAL_AS_FLOAT,PIPES_AS_CONCAT,ANSI_QUOTES,IGNORE_SPACE,ONLY_FULL_GROUP_BY,ANSI,NO_BACKSLASH_ESCAPES';
Query OK, 0 rows affected (0.00 sec)
mysql> select @@sql_mode;
+-----------------------------------------------------------------------------------------------------+
| @@sql_mode                                                                                          |
+-----------------------------------------------------------------------------------------------------+
| REAL_AS_FLOAT,PIPES_AS_CONCAT,ANSI_QUOTES,IGNORE_SPACE,ONLY_FULL_GROUP_BY,ANSI,NO_BACKSLASH_ESCAPES |
+-----------------------------------------------------------------------------------------------------+
1 row in set (0.00 sec)
mysql> insert into t values('\\beijing');
Query OK, 1 row affected (0.00 sec)
mysql> select * from t;
+-----------+
| context   |
+-----------+
|eijing   |
| \beijing  |
| \\beijing |
+-----------+
3 rows in set (0.00 sec)
```

通过这个例子可以看出当ANSI增加了NO_BACKSLASH_ESCAPES模式后，反斜线变成普通字符，如果导入的数据存在反斜线则需要使用这种模式确保数据的正确性。

**4. 启用PIPES_AS_CONCAT模式**

该模式将 ” || “视为字符串连接操作符，这样就可以将两个用” || “连接起来的字符串合并，因为在Oracle等数据库中是使用” || “作为字符串连接操作符的，因此如果将Oracle数据库数据导入到MySQL的话就需要用这种模式来支持这种操作。

```java
ANSI模式下包含了PIPES_AS_CONCAT模式：
mysql> set session sql_mode='ANSI';
Query OK, 0 rows affected (0.00 sec)
mysql> select @@sql_mode;
+--------------------------------------------------------------------------------+
| @@sql_mode                                                                     |
+--------------------------------------------------------------------------------+
| REAL_AS_FLOAT,PIPES_AS_CONCAT,ANSI_QUOTES,IGNORE_SPACE,ONLY_FULL_GROUP_BY,ANSI |
+--------------------------------------------------------------------------------+
1 row in set (0.00 sec)
mysql> select 'beijing' || '2008';
+---------------------+
| 'beijing' || '2008' |
+---------------------+
| beijing2008         |
+---------------------+
1 row in set (0.00 sec)
```

## 四、如何在数据迁移中选择合适的SQL Mode模式

MySQL在与其它异构数据库之间如果有数据迁移的需求，那么就需要选择好对应的模式组合确保数据能够安全、完整的迁移到目标数据库；MySQL本身已经做了这方面的工作，它与一些常用数据库之间进行迁移时的模式组合已经搭配好，如下表所示：

数据迁移时，NO_TABLE_OPTIONS模式可以去掉建表语句中的” engine “关键字，这样就能获得通用的建表脚本。对于没有列出来的别的数据库，在进行迁移时可以灵活组合模式以满足要求。
