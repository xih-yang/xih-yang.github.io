# 03、MySQL 提升 - 事务(使用和原理介绍)
- 来源：https://ddkk.com/zhuanlan/db/mysql/1/3.html
- 分类：缓存数据库
- 分组：教程目录
**目录**

一、概述

1，什么是事务？

2，事务的特点

3，mysql中支持事务的存储引擎

二、事务的创建

1，关闭事务的自动提交功能

2，使用手动提交事务的步骤

三、事务的隔离级别

1，事务的隔离级别

2，查看事务的隔离级别

3，设置事务的隔离级别

4，使用truncate删除表不支持回滚

**4、** 1使用delete删除表；

**4、** 2使用truncate删除表；

5，保存点（savepoint）

四、事务的实现原理

1，原子性的实现原理

2，持久性的实现原理

3，隔离性的实现原理

**3、** 1自增锁：；

**3、** 2死锁；

**3、** 3实现并发控制的其他策略；

4，故障及故障恢复

## 一、概述

### 1，什么是事务？

一个或一组sql语句，要么全部执行成功，要么全部失败。

### 2，事务的特点

- **原子性：** 一个事务（transaction）中的所有操作，要么全部完成，要么全部不完成，不会结束在中间某个环节。事务在执行过程中发生错误，会被回滚（Rollback）到事务开始前的状态，就像这个事务从来没有执行过一样。
- **一致性：** 在事务开始之前和事务结束以后，数据库的完整性没有被破坏。这表示写入的资料必须完全符合所有的预设规则，这包含资料的精确度、串联性以及后续数据库可以自发性地完成预定的工作。
- **隔离性：** 数据库允许多个并发事务同时对其数据进行读写和修改的能力，隔离性可以防止多个事务并发执行时由于交叉执行而导致数据的不一致。事务隔离分为不同级别，包括读未提交（Read uncommitted）、读提交（read committed）、可重复读（repeatable read）和串行化（Serializable）。
- **持久性：** 事务处理结束后，对数据的修改就是永久的，即便系统故障也不会丢失。

### 3，mysql中支持事务的存储引擎

查看mysql中支持的存储引擎：

语句：show engines;

可以看到只有InnoDB是支持事务的，并且这个是mysql5.7.30的默认存储引擎。

## 二、事务的创建

**隐式事务**：事务没有明显的开始和结束标记。

比如insert、update、delete语句。

默认的一条sql语句就是隐式事务。

**显式事务**：事务有明显的开始和结束标记。

### 1，关闭事务的自动提交功能

关闭自动提交功能：set autocommit=0;

注意：修改只是针对当前会话有效，并不是永久生效的。

```java
# 查看事务是否为自动提交（默认是自动提交）
mysql> show variables like 'autocommit';
+---------------+-------+
| Variable_name | Value |
+---------------+-------+
| autocommit    | ON    |
+---------------+-------+
1 row in set (0.01 sec)
# 关闭自动提交
mysql> set autocommit=0;
Query OK, 0 rows affected (0.00 sec)
# 查看事务是否为自动提交（修改为手动提交）
mysql> show variables like 'autocommit';
+---------------+-------+
| Variable_name | Value |
+---------------+-------+
| autocommit    | OFF   |
+---------------+-------+
1 row in set (0.00 sec)
```

### 2，使用手动提交事务的步骤

- 步骤1:开启事务

> set autocommit=0;
>
> start [transaction];(可省略)

- 步骤2:编写一组sql语句

> 语句1;
>
> 语句2...

- 步骤3:结束事务

> 成功：commit;提交事务
>
> 失败：rollback;回滚事务

## 三、事务的隔离级别

### 1，事务的隔离级别

> 未提交读(read uncommitted)
>
> 已提交读(read committed)
>
> 可重复读(repeatable read)
>
> 串行化(serializable)。

### 2，查看事务的隔离级别

select @@tx_isolation;

```java
mysql> select @@tx_isolation;
+-----------------+
| @@tx_isolation  |
+-----------------+
| REPEATABLE-READ |
+-----------------+
1 row in set, 1 warning (0.00 sec)
```

### 3，设置事务的隔离级别

setsession transaction isolation level 隔离级别;

例如：set session transaction isolation level read committed ;

```java
mysql> set session transaction isolation level read committed ;
Query OK, 0 rows affected (0.01 sec)
mysql> select @@tx_isolation;
+----------------+
| @@tx_isolation |
+----------------+
| READ-COMMITTED |
+----------------+
1 row in set, 1 warning (0.00 sec)
```

默认的隔离级别REPEATABLE-READ，可重复读。

### 4，使用truncate删除表不支持回滚

#### 4.1 使用delete删除表

支持数据回滚

```java
查询表数据
mysql>` select * from order;
+--------+------------+---------------------+
| key_id | order_code | op_time             |
+--------+------------+---------------------+
|      1 | 88gl77     | 2020-07-09 18:07:47 |
+--------+------------+---------------------+
1 row in set (0.00 sec)
开启事务
mysql> set autocommit = 0;
Query OK, 0 rows affected (0.00 sec)
mysql> start transaction ;
Query OK, 0 rows affected (0.00 sec)
执行删除
mysql>` delete from order;
Query OK, 1 row affected (0.00 sec)
回滚事务
mysql> rollback ;
Query OK, 0 rows affected (0.01 sec)
查询表数据
mysql>` select * from order;
+--------+------------+---------------------+
| key_id | order_code | op_time             |
+--------+------------+---------------------+
|      1 | 88gl77     | 2020-07-09 18:07:47 |
+--------+------------+---------------------+
1 row in set (0.00 sec)
```

#### 4.2 使用truncate删除表

不支持数据回滚

```java
查询表数据
mysql>` select * from order;
+--------+------------+---------------------+
| key_id | order_code | op_time             |
+--------+------------+---------------------+
|      1 | 88gl77     | 2020-07-09 18:07:47 |
+--------+------------+---------------------+
1 row in set (0.00 sec)
开启事务
mysql> set autocommit = 0;
Query OK, 0 rows affected (0.00 sec)
mysql> start transaction ;
Query OK, 0 rows affected (0.00 sec)
删除表
mysql>` truncate table order;
Query OK, 0 rows affected (0.02 sec)
回滚
mysql> rollback ;
Query OK, 0 rows affected (0.00 sec)
查询表数据，发现表数据为空
mysql>` select * from order;
Empty set (0.00 sec)
```

### 5，保存点（savepoint）

值sql执行过程中，可以设置一个保存点，在事务回滚的时候，可以把数据回滚到指定的sql执行的位置。

即可以指定数据回滚的位置。

```java
表中此时有3条数据
mysql>` select * from order;
+--------+------------+---------------------+
| key_id | order_code | op_time             |
+--------+------------+---------------------+
|      1 | 1111       | 2020-07-09 18:18:02 |
|      2 | 2222       | 2020-07-09 18:18:10 |
|      3 | 3333       | 2020-07-09 18:18:18 |
+--------+------------+---------------------+
3 rows in set (0.00 sec)
开启事务
mysql> set autocommit = 0;
Query OK, 0 rows affected (0.00 sec)
mysql> start transaction ;
Query OK, 0 rows affected (0.00 sec)
删除主键为1的数据
mysql>` delete from order where key_id =1;
Query OK, 1 row affected (0.00 sec)
设置一个保存点sa
mysql> savepoint sa;
Query OK, 0 rows affected (0.00 sec)
删除主键为2的数据
mysql>` delete from order where key_id =2;
Query OK, 1 row affected (0.00 sec)
回滚到保存的sa
mysql> rollback to sa;
Query OK, 0 rows affected (0.00 sec)
查看数据发现主键为1的数据被删除了（因为删除后才设置的保存点）
主键为2的数据没有删除（因为数据回滚到了主键为2的删除语句的保存点）
mysql>` select * from order;
+--------+------------+---------------------+
| key_id | order_code | op_time             |
+--------+------------+---------------------+
|      2 | 2222       | 2020-07-09 18:18:10 |
|      3 | 3333       | 2020-07-09 18:18:18 |
+--------+------------+---------------------+
2 rows in set (0.00 sec)
```

## 四、事务的实现原理

> 原子性：通过undo log来实现
>
> 持久性：通过redo log来实现
>
> 隔离性：通过读写锁+MVCC来实现
>
> 一致性：通过原子性、持久性、隔离性来实现

### 1，原子性的实现原理

在操作数据之前，先将数据备份到一个地方（undoLog中），然后再对数据进行修改

如果出现错误或者执行了rollback语句，则可以使用undoLog中备份的数据将数据恢复到事务开始之前的状态。

可以理解为：

当执行delete时：undolog中会记录一条对应的insert记录

当执行insert时：undolog中会记录一条对应的delete记录

当执行update时：undolog中会记录一条对应的update记录

但实际不是这样的，里面记录的只是逻辑日志。

### 2，持久性的实现原理

和undoLog相反，redoLog记录的是新数据的备份。在事务提交前，只要将redoLog持久化即可，不需要将数据持久化。当系统崩溃时，虽然数据没有持久化，但是redoLog已经持久化。系统可以根据redoLog的内容将所有数据恢复到最新的状态。

### 3，隔离性的实现原理

使用锁来实现。

mysql中的锁可以分为两类：

- 共享锁：将数据设置为只读，不能进行更新。
- 排他锁：当执行数据修改的时候，其他事务不能读取该数据，只有当前事务可以对这些数据进行读写。

锁的粒度：锁一条记录、锁表、锁库。

#### 3.1 自增锁：

对自增长列的一个特殊的表级别锁

查看：show variables like 'innodb_autoinc_lock_mode';

```java
mysql> show variables like 'innodb_autoinc_lock_mode';
+--------------------------+-------+
| Variable_name            | Value |
+--------------------------+-------+
| innodb_autoinc_lock_mode | 1     |
+--------------------------+-------+
1 row in set (0.01 sec)
```

默认值为1，代表连续，当事务未提交或者提交失败时自增id会永久丢失。

比如说在执行insert语句的时候，先插入2条语句，这两条数据的自增id分为为1和2，但是事务没有提交或者发生了错误事务回滚了，然后又执行了一条insert语句插入了1条数据并且插入成功了，此时插入成功的这条数据的自增id是为3，因为前面插入失败的两条数据已经使用1和2这两个id。

#### 3.2 死锁

多个事务持有锁并且相互等待其他事务的锁，导致所有事务都无法继续执行

#### 3.3 实现并发控制的其他策略

基于时间戳的并发控制

基于有效性检查的并发控制

基于快照隔离的并发控制

### 4，故障及故障恢复

事务的执行流程：

> 系统会为每个事务开辟一个私有工作区
>
> 事务读操作：将从磁盘中拷贝数据到工作区中，在执行写操作前所有的更新都作用于工作区中拷贝的数据。
>
> 事务写操作：将数据输出到内存的缓冲区中，等到合适的时间再由缓冲区管理器将数据写入磁盘。

**故障情况一**：

在事务提交前出现故障，但事务对数据库的部分修改已经写入磁盘数据库中，这会导致事务的原子性被破坏。

**故障情况二**：

在系统崩溃前事务已经提交，但数据还在内存的缓冲区中，没有写入磁盘，系统恢复时将丢失此次已提交的修改，这会导致事务的持久性被破坏。
