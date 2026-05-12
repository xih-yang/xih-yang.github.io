# 18、MySQL 教程 - MySQL 锁相关问题
- 来源：https://ddkk.com/zhuanlan/db/mysql/7/18.html
- 分类：缓存数据库
- 分组：教程目录
锁是计算机协调多个进程、线程并发访问某一资源的机制。传统的计算机在CPU、RAM、I/O等上采用锁来防止相互争夺的情况，同样，数据库中的数据也是一种共享的资源，如何保证数据并发访问的一致性、有效性是是数据库必须要解决的问题，因此锁的概念就提到数据库上来了。

## 一、MySQL锁概述

相对于其它的数据库而言，MySQL中的锁相对较简单，其显著的特点是不同的存储引擎支持不同的锁；比如MyISAM和MEMORY存储引擎采用的是表级锁，BDB存储引擎采用的是页面锁，但也支持表级锁（BDB用的少，基本快被淘汰），InnoDB存储引擎采用的是行级锁（默认），也支持表级锁。

- 表级锁：开销小，加锁快，不会出现死锁；锁定粒度大，发生锁冲突的概率最高，并发度最低；
- 行级锁：开销大，加锁慢，会出现死锁；锁定粒度最小，发送锁冲突的概率最低，并发度最高；
- 页面锁：开销大小与加锁快慢界于表级锁和行级锁之间，会出现死锁，锁定粒度也是界于上面两者之间，并发度一般；

从上面的介绍也可以看出很难说哪种锁更好，只能说对于具体的情况哪种锁更合适；单独就锁本身而言，表级锁更适合于查询操作为主，只有少量按索引条件进行更新数据的应用，如WEB应用；行级锁更适合于有大量按索引条件并发更新少量数据，同时又有并发查询的应用，如一些在线事务系统。

## 二、MyISAM表锁

#### 2.1 查询表级锁争用情况

使用以下命令查看：

```java
mysql> show status like 'table%';
+----------------------------+-------+
| Variable_name              | Value |
+----------------------------+-------+
| Table_locks_immediate      | 11237 |
| Table_locks_waited         | 0     |
| Table_open_cache_hits      | 0     |
| Table_open_cache_misses    | 0     |
| Table_open_cache_overflows | 0     |
+----------------------------+-------+
5 rows in set (0.00 sec)
```

Table_locks_immediate 指的是能够立即获得表级锁的次数；

Table_locks_waited 指的是不能立即获取表级锁而需要等待的次数，如果数量大，说明锁等待多，有锁争用情况

#### 2.2 表级锁的锁模式

MySQL的表级锁有两种模式：表共享读锁和表独占写锁；对于MyISAM表级锁来说，读操作不会阻塞其它用户对同一表的读请求，但是会阻塞对同一表的写请求；而写操作则会阻塞其它用户对同一表的读、写请求。也就是说写操作与读操作之间、写操作与写操作之间是串行的。

如下面的例子，当一个线程获得对一个表的写锁后，只有持有该锁的线程可以对表进行更新操作，其它线程的读写操作都要等待，直到锁被释放。

线程1
线程2

mysql> lock table film_text write;     写操作锁定表
 Query OK, 0 rows affected (0.00 sec)

当前线程可以增删改

mysql> select film_id,title from film_text where film_id = 1000;
 +---------+-----------+
 | film_id | title     |
 +---------+-----------+
 |    1000 | ZORRO ARK |
 +---------+-----------+
 1 row in set (0.00 sec)

mysql> insert into film_text(film_id,title) values(1001,'insert test');
 Query OK, 1 row affected (0.00 sec)

mysql> update film_text set title = 'Insert Test' where film_id = 1001;
 Query OK, 1 row affected (0.01 sec)
 Rows matched: 1  Changed: 1  Warnings: 0

其它线程等待锁释放

mysql> select film_id,title from film_text where film_id = 1001;

mysql> unlock tables;  释放锁
 Query OK, 0 rows affected (0.00 sec)
等待

mysql> select film_id,title from film_text where film_id = 1001;
 +---------+-------------+
 | film_id | title       |
 +---------+-------------+
 |    1001 | Insert Test |
 +---------+-------------+
 1 row in set (2 min 7.34 sec)

#### 2.3 如何加表锁

MyISAM在执行查询（SELECT）操作之前，会自动的给所涉及的表加读锁；在执行更新操作（Insert、Update、Delete）之前，会自动的给所涉及的表加写锁；这个过程并不需要用户来干预，因此不需要使用LOCK TABLE命令来显示加锁。在举例子的时候显示加锁是为了模拟事务方便说明问题。

可能你会觉得既然这样，那在使用时不用LOCK TABLE命令不就好了，反正都会隐式加锁。基于这个疑问，下面的一个例子可能会让你对显示加锁有一个大概的概念。

```java
比如有两个表，一个是每天订单总额的记录表order，一个是每笔订单的详细表detail_order
当你想要从两个表上查询订单总额看看是否一致时你可能会这样操作
select sum(total) from order;
select sum(subtotal) from detail_order;
但这样操作往往会产生一些错误，因为在第一条语句执行完后执行第二条语句之前表detail_order可能已经发生了变化
因此，应该使用下面的操作保证一致性
lock tables order read local,detail_order read local;
select sum(total) from order;
select sum(subtotal) from detail_order;
unlock tables;
```

对于上面的例子有两点需要说明一下：

- 上面加锁的时候用了 local 关键字，它的作用是MyISAM表在满足并发查询的条件下，允许其它用户在表尾并发插入记录；
- 用LOCAL TABLES命令显式加表锁时，需要同时获取所有涉及到表的锁，并且MySQL不支持锁升级；也就是说使用local tables 命令后只能访问显示加锁的这些表（比如上面的表order、detail_order），不能访问其它的表；同时，如果该表是读锁，那么只能查询不能更新。自动加锁的时候也是这样，这也正是MyISAM表不会出现死锁的原因。

还有一点，当使用LOCAL TABLES锁定表时，如果后面使用了表的别名那也会出错，**必须对表的别名也进行加锁**。

```java
local table actor read;
local table actor as a read;
```

#### 2.4 并发插入

上面说到MyISAM表的读写操作是串行的，但这是对整体来说的，在一定条件下，MyISAM表也支持查询和插入操作的并发进行。

MyISAM存储引擎中有一个系统变量concurrent_insert，专门用于控制其并发插入的行为，其值可以是0，1或2 。

- concurrent_insert=0 时，不允许并发插入；
- concurrent_insert=1 时，如果MyISAM表中没有空洞（即表的中间没有被删除的行），MyISAM允许在一个进程读表的同时，另一个进程从表尾插入记录。这也是MySQL的默认设置；
- concurrent_insert=2 时，无论有没有空洞，都允许在表尾并发插入记录。

会话1
会话2

read local 锁定表

mysql> lock table myisam_lock read local;
 Query OK, 0 rows affected (0.00 sec)

当前会话不可执行更新操作

mysql> insert into myisam_lock(film_id,title) values(1000,'test');
 ERROR 1099 (HY000): Table 'myisam_lock' was locked with a READ lock and can't be updated
 mysql> update myisam_lock set title = 'Test' where film_id = 1000;
 ERROR 1099 (HY000): Table 'myisam_lock' was locked with a READ lock and can't be updated

其它会话可以进行插入操作，但更新操作会等待

mysql> insert into myisam_lock(film_id,title) values(1000,'test');
 Query OK, 1 row affected (0.00 sec)

mysql> update myisam_lock set title = 'Update Test' where film_id = 1000;
 等待

当前会话不可访问其它会话插入的内容

mysql> select film_id,title from myisam_lock where film_id = 1000;
 Empty set (0.00 sec)

释放锁

mysql> unlock tables;
 Query OK, 0 rows affected (0.00 sec)

等待

当前会话释放锁后，可以获得其它会话插入的记录

mysql> select film_id,title from myisam_lock where film_id = 1000;
 +---------+-------------+
 | film_id | title       |
 +---------+-------------+
 |    1000 | Update Test |
 +---------+-------------+
 1 row in set (0.00 sec)

其它会话释放锁后，当前会话获得锁，更新操作完成

mysql> update myisam_lock set title = 'Update Test' where film_id = 1000;
 Query OK, 1 row affected (3 min 37.78 sec)
 Rows matched: 1  Changed: 1  Warnings: 0

可以通过MyISAM类型表的并发插入特性来解决应用中对同一表的查询和插入的锁争用。例如将concurrent_insert设置为2，总是允许插入，并在空闲时间利用OPTIMIZE TABLE命令清理磁盘碎片。

#### 2.5 MyISAM的锁调度

前面提到，MyISAM表中读锁与写锁互斥，是串行的。那么当一个会话请求某一表的读锁同时另一个会话请求该表的写锁时MySQL怎么处理谁先得到该表的锁呢？答案是写锁优先，哪怕是在请求锁的队列中读锁排在写锁的前面也会是写锁先得到，这是因为MyISAM中认为写请求比查请求重要，这也是MyISAM表不适合有大量更新操作的原因。大量的更新操作使得读锁很难被获取到从而造成永久堵塞，但幸好我们也还是可以通过一些设置来调节MyISAM的调度行为。

通过设定启动参数low_priority_updates或设置命令 SET LOW_PRIORITY_UPDATES = 1 降低更新请求的优先级，相应的读操作的优先级就提高了。同样的还可以设定INSERT、UPDATE、DELETE的LOW_PRIORITY属性来降低相应语句的优先级。

这样就可以解决一些查询相对重要的应用（如用户登陆系统）中读锁严重等待的问题。

上面的解决方案是要么查询优先，要么更新优先，也还有折中的办法，给系统参数 MAX_WRITE_LOCK_COUNT设置一个合适的值，当同一个表的写请求达到这个值后，MySQL就自动的将写请求的优先级降低，给读请求获得锁的机会。

## 三、InnoDB锁问题

InnoDB与MyISAM最大的区别就是支持事务和行级锁。行级锁和表级锁有很多不同，而且事务的引进又带来了新的问题，因此，在解释InnoDB的锁问题时先对事务相关知识进行一下介绍。

#### 3.1 背景知识

**1. 事务及其ACID属性**

事务是由一组SQL语句组成的逻辑处理单元，事务具有以下4种属性，简称为事务的ACID属性。

- 原子性（Atomicity）：事务是一个原子操作单元，对其数据的修改要么全执行，要么全不执行；
- 一致性（Consistent）：在事务开始和完成时，数据都必须保持一致的状态。这意味着所有相关的数据规则都必须应用于事务的修改，以保持数据的完整性；事务结束时，所有的内部数据结构（B树索引、双向链表等）都必须是正确的；
- 隔离性（Isolation）：数据库系统提供一定的隔离机制，保证事务在一个不受外部并发执行影响的隔离环境中运行，这意味着事务处理过程中的中间状态对外部是不可见的；
- 持久性（Durable）：事务完成之后，它对于数据的修改是永久性的，即使出现系统故障也能够保持。

银行转账就是一个典型的事务的例子。

**2. 并发事务处理带来的问题**

并发事务处理可以大大提高数据库资源的利用率，提高数据库系统的事务吞吐量，从而支持更多的用户。但并发事务处理也会带来一些问题，主要有以下几种：

- **更新丢失：** 比如两个不同的事务对同一行数据进行修改时，由于每个事务并不知道对方的存在，因此在一个修改完之后另一个的修改会对其进行覆盖，从而造成数据丢失；只有当一个事物提交之前另一个事务无法获得其权限则可避免此类问题。
- **脏读：** 如果一个事务正在对一条记录进行修改，在未提交之前，原始数据和新数据在这个状态会存在不一致的情况，如果此时另外一个事务刚好读取了这个状态下的数据，并且根据这个数据进行了其它操作，那么就会产生未提交的数据依赖关系，最终得到的是不可靠的、不正确的，这种情况形象的被称为脏读。
- **不可重复读：** 一个事务在读取某个数据后，一段时间内想要再次读取时发现数据已经改变或已经被删除，这种现象叫做不可重复读。
- **幻读：** 一个事物按照相同的查询条件去查询以前查过的数据时会发现其它事务插入了满足其查询条件的新数据，这种情况就叫做幻读。

**3. 事务隔离级别**

上面提到的并发事务处理遇到的问题中，“ 更新丢失 ” 可以通过事务控制器以及必要的锁机制来解决，其余的问题可以由数据库的事务隔离机制来解决。数据库实现事务隔离的方式基本上可以分为以下两种：

- 一种是在数据读取前对其加锁，阻止其它事务对数据进行修改。
- 另一种不用加任何锁，只提供事务一定级别的一致性读取；从用户的角度来看，好像是数据库可以提供同一数据的多个版本，因此，这种技术也叫数据多版本并发控制（MVCC），也常称为多版本数据库。

数据库的事务隔离越严格，并发的副作用越小，但付出的代价也越大；因为这种隔离实质上是将并发改为 “ 串行 ” 的方式执行，这就大大降低了并发的作用。因此，对于不同的情况，并发与隔离的要求程度不同，故而隔离级别设定为以下四个等级：

需要说明的一点是这四种等级是标准化的4个等级，但不是所有的数据库都是这样的四个等级，不同的数据库等级划分之间有所区别，但基本上都是采用MVCC模式来划分，MySQL中采用的就是这四种等级。

#### 3.2 获取InnoDB行锁争用情况

可以通过变量innodb_row_lock变量来分析系统上行锁的争用情况：

```java
mysql> show status like 'innodb_row_lock%';
+-------------------------------+-------+
| Variable_name                 | Value |
+-------------------------------+-------+
| Innodb_row_lock_current_waits | 0     |
| Innodb_row_lock_time          | 0     |
| Innodb_row_lock_time_avg      | 0     |
| Innodb_row_lock_time_max      | 0     |
| Innodb_row_lock_waits         | 0     |
+-------------------------------+-------+
5 rows in set (0.00 sec)
```

可以根据变量 Innodb_row_lock_current_waits 以及 Innodb_row_lock_time_avg 的值判断锁的争用情况，如果值越大，说明争用情况越严重，这时候可以根据下面的方法进一步查看行锁争用的原因。

**1. 查看数据库information_schema中的锁表来查看锁等待情况**

基本上使用information_schema库中的三个表 INNODB_TRX、INNODB_LOCKS、INNODB_LOCK_WAITS中的相关信息可以查看到锁争用的情况，进而分析到相关原因。详细可以参考这篇博客[http://blog.itpub.net/12679300/viewspace-1420031/](http://blog.itpub.net/12679300/viewspace-1420031/)，

**2. 通过设置InnoDB Monitors 观察锁冲突情况**

```java
mysql> create table innodb_monitor(a int) engine=innodb;     设置innodb引擎的监视器表
Query OK, 0 rows affected (0.02 sec)
mysql> show engine innodb status \G;                         查看当前状态，可详细查看锁等待情况，便于进一步分析
*************************** 1. row ***************************
  Type: InnoDB
  Name:
Status:
=====================================
2019-01-08 10:02:55 0x10f8 INNODB MONITOR OUTPUT
=====================================
Per second averages calculated from the last 48 seconds
-----------------
BACKGROUND THREAD
-----------------
srv_master_thread loops: 1146 srv_active, 0 srv_shutdown, 384308 srv_idle
srv_master_thread log flush and writes: 385454
----------
SEMAPHORES
----------
OS WAIT ARRAY INFO: reservation count 6992
OS WAIT ARRAY INFO: signal count 4868
RW-shared spins 0, rounds 14145, OS waits 6934
RW-excl spins 0, rounds 2659, OS waits 2
RW-sx spins 991, rounds 3830, OS waits 12
Spin rounds per wait: 14145.00 RW-shared, 2659.00 RW-excl, 3.86 RW-sx
------------
TRANSACTIONS
------------
......
mysql> drop table innodb_monitor;            监视器打开后默认每15秒会写一次记录，找到相关原因后记得要删除掉
Query OK, 0 rows affected (0.02 sec)
```

#### 3.3 InnoDB的行锁模式及加锁办法

innodb实现了以下的两种行锁模式：

- 共享锁（S）：允许一个事务去读一行，阻止其它事务获得相同数据集的排他锁；
- 排他锁（X）：允许获得排他锁的事务更新数据，阻止其它事务取得相同数据集的共享读锁和排他写锁；

另外，为了允许行锁与表锁共存，实现多粒度锁机制，InnoDB还有两种内部使用的意向锁机制：（意向锁都是表锁）

- 意向共享锁（IS）：事务打算给数据行加行共享锁，但给数据行加共享锁之前必须取得该表的IS锁；
- 意向排他锁（IX）：事务打算给数据行加行排他锁，但给数据行加排他锁之前必须取得该表的IX锁；

如果一个事务请求的锁模式与当前的锁兼容，那么InnoDB就将请求的锁授予该事务；反之，如果不兼容，那么该事务就需等待锁释放。

意向锁是InnoDB自动加的，不需要用户干预。对于UPDATA、DELETE、INSERT等语句InnoDB会自动加排他锁（X），对于一般的SELECT语句则不会加任何锁。

当然也可以通过以下命令显式的给记录集加共享锁或排他锁：

- 加共享锁（S）：SELECT * FROM tbl_name WHERE .... LOCK IN SHARE MODE
- 加排他锁（X）：SELECT * FROM tbl_name WHERE .... FOR UPDATE

注意一点，加共享锁的时候可以保证其它事务不会对该记录更新或删除，但如果自身对这条记录进行了更新，那么很有可能会造成死锁，所以，如果直到会有更新操作，最好加排他锁确保安全。

下面看一下共享锁和排他锁的例子：

InnoDB共享锁的例子

会话1
会话2

加锁之前需要将事务设置为手动提交

mysql> set autocommit = 0;
 Query OK, 0 rows affected (0.00 sec)

mysql> select actor_id,first_name,last_name from actor where actor_id = 178;
 +----------+------------+-----------+
 | actor_id | first_name | last_name |
 +----------+------------+-----------+
 |      178 | LISA       | MONROE    |
 +----------+------------+-----------+
 1 row in set (0.00 sec)

mysql> set autocommit = 0;
 Query OK, 0 rows affected (0.00 sec)

mysql> select actor_id,first_name,last_name from actor where actor_id = 178;
 +----------+------------+-----------+
 | actor_id | first_name | last_name |
 +----------+------------+-----------+
 |      178 | LISA       | MONROE    |
 +----------+------------+-----------+
 1 row in set (0.00 sec)

对178的记录加共享锁

mysql> select actor_id,first_name,last_name from actor where actor_id = 178 lock in share mode;
 +----------+------------+-----------+
 | actor_id | first_name | last_name |
 +----------+------------+-----------+
 |      178 | LISA       | MONROE    |
 +----------+------------+-----------+
 1 row in set (0.00 sec)

其它会话仍可以查询该条记录

mysql> select actor_id,first_name,last_name from actor where actor_id = 178;
 +----------+------------+-----------+
 | actor_id | first_name | last_name |
 +----------+------------+-----------+
 |      178 | LISA       | MONROE    |
 +----------+------------+-----------+
 1 row in set (0.00 sec)

但更新操作需等待

mysql> update actor set last_name = 'MONROE T' where actor_id = 178;
 等待

当前会话可查询可更新，更新过后锁被释放

mysql> update actor set last_name = 'MONROE T' where actor_id = 178;
 Query OK, 1 row affected (0.00 sec)
 Rows matched: 1  Changed: 1  Warnings: 0

获得锁后更新操作成功执行

mysql> update actor set last_name = 'MONROE T' where actor_id = 178;

InnoDB中排他锁的例子

会话1
会话2

mysql> set autocommit = 0;
 Query OK, 0 rows affected (0.00 sec)

mysql> select actor_id,first_name,last_name from actor where actor_id = 178;
 +----------+------------+-----------+
 | actor_id | first_name | last_name |
 +----------+------------+-----------+
 |      178 | LISA       | MONROE    |
 +----------+------------+-----------+
 1 row in set (0.00 sec)

mysql> set autocommit = 0 ;
 Query OK, 0 rows affected (0.00 sec)

mysql> select actor_id,first_name,last_name from actor where actor_id = 178;
 +----------+------------+-----------+
 | actor_id | first_name | last_name |
 +----------+------------+-----------+
 |      178 | LISA       | MONROE    |
 +----------+------------+-----------+
 1 row in set (0.00 sec)

mysql> select actor_id,first_name,last_name from actor where actor_id = 178 for update;
 +----------+------------+-----------+
 | actor_id | first_name | last_name |
 +----------+------------+-----------+
 |      178 | LISA       | MONROE    |
 +----------+------------+-----------+
 1 row in set (0.00 sec)

mysql> select actor_id,first_name,last_name from actor where actor_id = 178;
 +----------+------------+-----------+
 | actor_id | first_name | last_name |
 +----------+------------+-----------+
 |      178 | LISA       | MONROE    |
 +----------+------------+-----------+
 1 row in set (0.00 sec)

mysql> select actor_id,first_name,last_name from actor where actor_id = 178 for update;
 等待

mysql> update actor set last_name = 'MONROE M' where actor_id = 178;
 Query OK, 1 row affected (0.00 sec)
 Rows matched: 1  Changed: 1  Warnings: 0

mysql> commit;
 Query OK, 0 rows affected (0.00 sec)

其它会话提交释放锁后 该会话获得锁

mysql> select actor_id,first_name,last_name from actor where actor_id = 178 for update;
 +----------+------------+-----------+
 | actor_id | first_name | last_name |
 +----------+------------+-----------+
 |      178 | LISA       | MONROE M  |
 +----------+------------+-----------+
 1 row in set (7.72 sec)

#### 3.4 InnoDB行锁实现方式

InnoDB行锁是通过给索引上的索引项加锁实现的，如果没有索引，InnoDB将通过隐藏的聚簇索引来对记录加锁；InnoDB行锁分为3种情形：

- Record lock：对索引项加锁；
- Gap lock：对索引项的 “ 间隙 ” 、第一条记录前的间隙或最后一条记录后的间隙加锁；
- Next-key lock：前两种的组合，对记录及其前面的间隙加锁。

InnoDB的这种特点说明，如果不通过索引条件检索数据，那么InnoDB将对表中所有记录加锁，实际效果跟表锁一样。因此在实际使用中要特别注意这一点，以防大量的锁冲突。

**1. 表中各字段无索引，当锁定某一行时会锁定全表**

如下面的例子，首先创建一个没有索引的表，当排他锁锁定某一行记录时，会发现其它行记录也被锁定了。

当通过命令alter table tab_no_index add index id(id) 增加索引后，单行锁定就不会波及到其它行：

**2. 有相同索引但是不同行的数据锁定其中一行时其他行也会被锁定**

比如上面的例子中表有两个字段，id字段有索引，name字段无索引，当有两条记录（1，‘1’）和（1，‘4’）时，如果对记录（1，‘1’）加锁，由于使用的id索引是一样的，因此记录（1，‘4’）也会被锁定。

**3. 当有多个索引时，如果该行被锁定，那么用其它索引也无法访问**

比如上面例子中表字段id、name均有索引，当索引id锁定某一行时，再使用该行的name索引是需要锁等待的，因此，不论有多少个索引，该行被锁定时其它索引的访问均需等待。

**4. 使用索引锁定时需注意是否正确使用到了索引**

在使用条件查询时，虽然显式的指定了使用索引，但有一点需要注意，MySQL的优化器会权衡使用索引是否会更好，如果说MySQL判断不使用索引更快那么它就会不去使用索引，因此，你虽然写了使用索引查询但实际上并没有，此时造成的全表锁定的原因一时间不一定会找得出来，故而在查找锁冲突原因时，别忘了检查SQL的执行计划，确定是否正确的执行了索引。

比如下面这个例子，varchar类型的字段在查找时没加引号而且无法隐式转换导致无法使用索引，进而全表被锁定。

#### 3.5 Next-Key锁

当我们使用范围查询而不是相等查询检索数据，并且此时请求了共享锁或排他锁时，InnoDB给已有数据满足范围条件的索引项加锁；对于键值在条件范围内但并不存在的记录称为 “ 间隙 ”，InnoDB也会对这个间隙加锁，这种锁机制就是所谓的Next-Key锁。

InnoDB使用Next-Key锁的目的：一方面是为了防止幻读，满足隔离级别相关的要求；另一方面是为了满足其恢复和复制的需要。比如一个表中有101条记录，当查询id>100时，除了会给第101条记录加锁外，对于id>100的那些不存在的记录（间隙）会加Next-Key锁，因为如果不给间隙加锁，那么此时插入第102条记录时，两次查询id>100的记录不一样，这就造成了幻读。

很显然，有了这种机制，在满足条件范围内的键值并发插入时会造成严重的锁等待，因此，开发过程中要注意优化，尽量使用相等的条件。

另外说明一点，当使用相等条件给一个不存在的记录加锁时，也会使用Next-Key锁。

#### 3.6 恢复和复制的需要对InnoDB锁机制的影响

MySQL通过BINLOG来记录执行成功的INSERT、UPDATE、DELETE等更新操作语句，并由此实现数据库的恢复和主从复制。它主要支持三种日志格式：基于语句的日志格式SBL，基于行的日志格式RBL和混合日志格式。

正是由于这种BINLOG日志的记录方式使得如果想要恢复和复制的准确性那么日志的记录也必须准确。比如如果一个事务过程中会话1对a表执行插入的操作，但此时会话2对表a执行跟新的操作，如果会话2先执行成功然后会话1再执行成功，那么对于BINLOG记录的日志来说在恢复时就存在问题，因此为了保持事务的完整性，保证BINLOG的恢复和复制的需要，因此会在会话1对a表插入时加共享锁，保证此时其它会话不能对a表有所更改。

系统参数innodb_locks_unsafe_for_binlog默认值为off，表示InnoDB会根据这种要求来加锁，但当我们设置为on时，就不会加这种保护BINLOG的恢复和复制要求的锁，因而当使用这种BINLOG日志恢复数据库时会造成恢复的结果与实际应用逻辑不符，如果是复制的话就会造成主从数据库不一致。

虽然出于保护进行了加锁，但是这种加锁严重影响了并发性能，因此，当我们避免不了遇到这种情况时尽量采用以下三种办法：

- 将参数innodb_locks_unsafe_for_binlog设置为on，强制mysql使用多版本一致性读，但这种代价就是不能使用BINLOG，因此为了安全考虑不建议使用；
- 通过使用 “ select * from tbl_name ... into outfile ” 和 “ load data infile ... ” 的组合来间接实现，使用这种方式MySQL不会对表加锁；
- 使用基于行的BINLOG格式和基于行数据的复制。

#### 3.7 InnoDB不同隔离级别下的一致性读及锁差异

根据前面的介绍，在不同隔离级别及恢复复制的需要，InnoDB在处理SQL语句时采用的一致性读策略和需要的锁是不一样的，下面的表进行了一些概括：

从表中也可以看出，隔离级别与锁严格程度成正比，与并发事务的性能成反比，因此在实际使用中，需要权衡好这两方面。一般尽量使用较低的隔离级别，通常read committed级别就够了，如果需要更高的隔离级别则可以通过set来动态修改。

#### 3.8 InnoDB在什么时候使用表锁

通常来说，InnoDB表使用行锁，这也是我们使用该表的原因，但是偶尔情况下也会使用表锁，比如：

- 当表中的大部分数据或所有数据需要进行更新，表又比较大，这时候如果使用行锁就会造成大量的事务等待和锁冲突，影响执行效率；如果改成表锁则会加快执行效率
- 事务涉及多个表，比较复杂，如果不用表锁锁定涉及的表，则有可能会造成死锁，事务大量回滚，开销非常大。

当然，这样的事务不能太多，否则就需要考虑使用MyISAM表了。

注意，这样加锁的时候需要设置自动提交为0才可，另外手动提交事务时，提交及锁释放的顺序需要注意,

```java
set autocommit = 0;
lock table ... read ..
do something ...
commit;
unlock tables;    (该命令会隐式的提交事务）
```

#### 3.9 关于死锁

MyISAM中不存在死锁，因为它的锁是一次性获得的，而InnoDB中的锁是逐步获得的，因此会出现死锁，比如下面的例子：

会话1
会话2

set autocommit = 0

select * from table1  where .. for update

....

获得table1的排他锁

set autocommit = 0

select * from table2  where .. for update

....

获得table2的排他锁

select * from table2  where .. for update

因为会话2已经获得了table2的排他锁，还未释放，所以这里需要等待

....

select * from table1  where .. for update

因为会话1已经获得了table1的排他锁，还未释放，所以这里需要等待

上面两个会话都在互相等待对方释放锁，因此无限等待，这种循环锁等待就是典型的死锁。

通常InnoDB会自动检测到死锁，然后使其中一个事务释放锁并回滚，另一个事务获得锁继续完成事务；但涉及到外部锁或表锁的情况下，InnoDB无法检测到死锁，因此此时需要设置锁等待时间innodb_lock_wait_timeout来解决这个问题。这个参数的设置不仅能解决死锁的问题还可以解决高并发时锁等待过久拖垮数据库的问题。

避免死锁的常用方法：

- 在应用中，如果不同的程序会并发存取多个表，应尽量约定以相同的顺序来访问表，这样可以大大降低产生死锁的机会。
- 在程序以批量方式处理数据时，如果事先对数据进行排序，保证每个线程按固定的顺序来处理记录，这样也可以降低死锁出现的概率。比如你先找第三条数据我找第一条数据，然后你找第一条数据我找第三条数据，这样就会产生死锁。
- 在需要更新数据时，最好一次性获取足够级别的锁，如排他锁，而不是先获取共享锁，需要更新时再获取排他锁；因为在获得排他锁时其它事务可能获得共享锁，从而造成锁冲突甚至死锁。
- 在隔离级别REPEATABLE-READ 和 READ COMMITTED 两种情况下都有可能会产生死锁，这里暂时不做讨论。

通过上面的一些方法能减少死锁但不能完全避免，因此在编程时多加异常捕获并处理是一个好习惯。另外，产生死锁时还可以通过 SHOW INNODB STATUS 来查看发生死锁的原因。
