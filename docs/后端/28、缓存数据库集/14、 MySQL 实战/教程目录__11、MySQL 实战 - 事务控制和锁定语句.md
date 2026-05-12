# 11、MySQL 实战 - 事务控制和锁定语句
- 来源：https://ddkk.com/zhuanlan/db/mysql/2/11.html
- 分类：缓存数据库
- 分组：教程目录
表锁：MyISAM、MEMORY存储引擎；行锁：InnoDB存储引擎；页锁：BDB存储引擎；默认情况下表锁和行锁都是自动获得的，不需要额外的命令；但是有时候用户需要明确的进行行锁或者进行事务的控制，以便确保整个事务的完整性，这样就需要用到事务控制和锁定语句来完成。

## 一、LOCK TABLE 和 UNLOCK TABLE

LOCK TABLE 用于锁定当前线程的表，UNLOCK TABLE 释放当前线程的任何锁定。当当前线程想要使用一个被别的线程锁定的表时会无法得到，只有等待别的线程将表释放并且当前线程获得到该表的锁定之后才能使用；另外还有一个值得注意的地方，当前线程执行另一个 LOCK TABLE 时，或与服务器的连接断开时，所有由当前线程锁定的表被隐式的解锁了。

相关语法如下：

LOCK TABLES tbl_name [AS alias] { READ [LOCAL] | [LOW_PRIORITY] WRITE} [, ...] UNLOCK TABLES

- AS alias：起别名；
- READ [LOCAL]：READ表示对当前表进行只读锁定，当前会话和其它会话都只可读不可写（插入、更新等操作）；当有关键字LOCAL时，表示当前会话只读不可写，其它会话可读可写；另外，如果是InnoDB类型的表，READ 与 READ LOCAL是等效的，作用都是READ。
- [LOW_PRIORITY] WRITE：WRITE锁定表示只有当前会话可读可写，LOW_PRIORITY关键字会影响锁定行为，但是5.6.5版本之后被弃用。

下面举个例子简单说明一下READ：

```java
1. 创建表test1，并插入3条数据
mysql> create table test1(id int,name varchar(15));
Query OK, 0 rows affected (0.01 sec)
mysql> insert into test1 values(1001,'kim'),(1002,'bin'),(1003,'jim');
Query OK, 3 rows affected (0.00 sec)
Records: 3  Duplicates: 0  Warnings: 0
mysql> select * from test1;
+------+------+
| id   | name |
+------+------+
| 1001 | kim  |
| 1002 | bin  |
| 1003 | jim  |
+------+------+
3 rows in set (0.00 sec)
2. 查看当前会话为1046，在当前会话中锁定表test1
mysql> select connecction_id();
ERROR 1305 (42000): FUNCTION test1.connecction_id does not exist
mysql> select connection_id();
+-----------------+
| connection_id() |
+-----------------+
|            1046 |
+-----------------+
1 row in set (0.00 sec)
mysql> show open tables where in_use >= 1;
Empty set (0.00 sec)
mysql> lock tables test1 read;                 只读锁定
Query OK, 0 rows affected (0.00 sec)
mysql> show open tables where in_use >= 1;
+----------+-------+--------+-------------+
| Database | Table | In_use | Name_locked |
+----------+-------+--------+-------------+
| test1    | test1 |      1 |           0 |
+----------+-------+--------+-------------+
1 row in set (0.00 sec)
mysql> select * from test1;                     当前会话下可读
+------+------+
| id   | name |
+------+------+
| 1001 | kim  |
| 1002 | bin  |
| 1003 | jim  |
+------+------+
3 rows in set (0.00 sec)
mysql> insert into test1 values(1004,'pin');        当前会话下不可写
ERROR 1099 (HY000): Table 'test1' was locked with a READ lock and can't be updated
3. 打开另外一个cmd窗口作为一个新的会话，新会话id为1035.
mysql> select connection_id();
+-----------------+
| connection_id() |
+-----------------+
|            1035 |
+-----------------+
1 row in set (0.00 sec)
mysql> select * from test1;        新会话可读
+------+------+
| id   | name |
+------+------+
| 1001 | kim  |
| 1002 | bin  |
| 1003 | jim  |
+------+------+
3 rows in set (0.00 sec)
mysql> insert into test1 values(1004,'pin');     新会话可插入，但此时在堵塞中，等待锁定被解除时方可执行
4. 1046会话锁定解除
mysql> unlock tables;
Query OK, 0 rows affected (0.00 sec)
5. 1035会话立即执行插入语句，在此期间一共等待了7分多钟
mysql> insert into test1 values(1004,'pin');
Query OK, 1 row affected (7 min 44.66 sec)
结论：用READ锁定表时，当前会话只可读不可写，其它会话可读，写操作会阻塞
```

下面举个例子看一下关键字LOCAL的作用：

```java
1. 创建表test2并插入数据，注意，为了测试关键字LOCAL，表的引擎不能时InnoDB
mysql> create table test2(id int,name varchar(15)) engine=MyISAM;
Query OK, 0 rows affected (0.01 sec)
mysql> insert into test2 values(1001,'test');
Query OK, 1 row affected (0.00 sec)
mysql> select * from test2;
+------+------+
| id   | name |
+------+------+
| 1001 | test |
+------+------+
1 row in set (0.00 sec)
mysql> select connection_id();
+-----------------+
| connection_id() |
+-----------------+
|            1046 |
+-----------------+
1 row in set (0.00 sec)
mysql> lock tables test2 read local;           当前会话可读
Query OK, 0 rows affected (0.00 sec)
mysql> select * from test2;
+------+------+
| id   | name |
+------+------+
| 1001 | test |
+------+------+
1 row in set (0.00 sec)
mysql> insert into test2 values(1002,'kkk');       当前会话不可插入
ERROR 1099 (HY000): Table 'test2' was locked with a READ lock and can't be updated
2. 在会话1035里对表test2可读可写
mysql> select connection_id();
+-----------------+
| connection_id() |
+-----------------+
|            1035 |
+-----------------+
1 row in set (0.00 sec)
mysql> select * from test2;
+------+------+
| id   | name |
+------+------+
| 1001 | test |
+------+------+
1 row in set (0.00 sec)
mysql> insert into test2 values(1002,'kkk');
Query OK, 1 row affected (0.00 sec)
结论：使用READ LOCAL关键字锁定表时，当前会话可读不可写，其它会话可读可写。
```

另外，如果使用关键字READ锁定一个表时，其它的会话仍然可以使用READ锁定相同的表，因为LOCK TABLES READ是一个共享表，但是，其它的会话使用WRITE锁的时候会被阻塞，直到READ锁被释放才可以执行。

如果当前会话用READ锁定了一个表，那么再当前会话中该表可以被查看但是无法查看别的表；比如用read锁定了test1表，此时可以查看test1表但无法查看test2表。

如果一个表被WRITE锁定，那么当前会话中该表可读可写，但是其它会话中的读写操作都会被阻塞，而且其它会话也无法对该表进行READ锁定或WRITE锁定，都被阻塞了。

如果表1被锁定，当它再去锁定表2时那么表1就会自动解锁，断开数据库链接时表1也会自动解锁；如果想要同时锁定多个表怎么办呢？看锁定表的语法，可以用该语法一次锁定多个表。

如果对一个视图表、临时表、触发器进行锁定，那么它会将视图定义时查询的相关表、触发器内的所有表都加上锁。

## 二、事务控制

默认情况下MySQL是自动提交的，比如我们建一个表，当我们执行向表里插入数据的语句时，一旦执行成功，那么此结果就被自动提交了，表里就多了新插入的数据；但有时候我们不想它自动提交该怎么办呢，这时候就需要使用显示的命令来提交，相关命令如下：

START TRANSACTION | BEGIN [WORK]

COMMIT [WORK] [AND [NO] CHAIN] [[NO] RELEASE]

ROLLBACK [WORK] [AND [NO] CHAIN] [[NO] RELEASE]

SETAUTOCOMMIT = {0 | 1}

- START TRANSACTION 或 BEGIN 语句用来开始一项新的事务；
- COMMIT 和 ROLLBACK 用来提交、回滚事务；
- CHAIN 和 RELEASE 字句分别用来定义事务在提交或回滚之后的操作，CHAIN 会立即启动一个新事物，并且和刚才的事务具有相同的隔离级别，RELEASE则会断开和客户端的连接；
- SET AUTOCOMMIT 修改当前连接的提交方式，如果设置为0，那么自此之后所有的事务都需要通过明确的命令进行提交或回滚。

下面用用一个例子说明一下事务控制的过程，表格的两列代表两个不同的会话，同一行代表当前时刻不同会话的操作；下面的例子将会用到actor表，当前情况下actor表的内容如下：

```java
mysql> select * from actor;
+----------+------------+-----------+
| actor_id | first_name | last_name |
+----------+------------+-----------+
|        1 | a          | a         |
|        2 | b          | b         |
|        3 | c          | c         |
|        4 | d          | d         |
|        5 | e          | e         |
+----------+------------+-----------+
5 rows in set (0.01 sec)
```

会话1
会话2

mysql> select * from actor where actor_id=6;
 Empty set (0.00 sec)
mysql> select * from actor where actor_id = 6;
 Empty set (0.00 sec)

开启事务并插入一条记录，此时并没有提交

mysql> start transaction;
 Query OK, 0 rows affected (0.00 sec)

mysql> insert into actor values(6,'f','f');
 Query OK, 1 row affected (0.00 sec)

mysql> select * from actor where actor_id=6;
 +----------+------------+-----------+
 | actor_id | first_name | last_name |
 +----------+------------+-----------+
 |        6 | f          | f         |
 +----------+------------+-----------+
 1 row in set (0.00 sec)

查询actor表，此条记录依然为空

mysql> select * from actor where actor_id = 6;
 Empty set (0.00 sec)

执行提交

mysql> commit;
 Query OK, 0 rows affected (0.00 sec)

此时可以查到这条记录

mysql> select * from actor where actor_id = 6;
 +----------+------------+-----------+
 | actor_id | first_name | last_name |
 +----------+------------+-----------+
 |        6 | f          | f         |
 +----------+------------+-----------+

上面的事务提交或回滚后，后面的事务仍然自动提交

mysql> insert into actor values(7,'g','g');
 Query OK, 1 row affected (0.01 sec)

可以查询到插入的数据

mysql> select * from actor where actor_id = 7;
 +----------+------------+-----------+
 | actor_id | first_name | last_name |
 +----------+------------+-----------+
 |        7 | g          | g         |
 +----------+------------+-----------+

重新开启一个事务

mysql> start transaction;
 Query OK, 0 rows affected (0.00 sec)

mysql> insert into actor values(8,'h','h');
 Query OK, 1 row affected (0.00 sec)

提交后再开启一个新事务

mysql> commit and chain;
 Query OK, 0 rows affected (0.00 sec)

此时开启了一个新事务

mysql> insert into actor values(9,'j','i');
 Query OK, 1 row affected (0.00 sec)

可以看到8这条记录能查到，9这条记录就没有

mysql> select * from actor where actor_id = 8;
 +----------+------------+-----------+
 | actor_id | first_name | last_name |
 +----------+------------+-----------+
 |        8 | h          | h         |
 +----------+------------+-----------+
 1 row in set (0.00 sec)

mysql> select * from actor where actor_id = 9;
 Empty set (0.00 sec)

mysql> commit;
 Query OK, 0 rows affected (0.00 sec)

提交过后，此时能够查到

mysql> select * from actor where actor_id = 9;
 +----------+------------+-----------+
 | actor_id | first_name | last_name |
 +----------+------------+-----------+
 |        9 | j          | i         |
 +----------+------------+-----------+
 1 row in set (0.00 sec)

如果在锁表期间用start transaction命令开始一个新事物，此时会造成隐含的unlock tables被执行，看下面的例子：

会话1
会话2

actor表中暂无第10条记录

mysql> select * from actor where actor_id=10;
 Empty set (0.00 sec)

mysql> select * from actor where actor_id = 10;
 Empty set (0.00 sec)

在当前会话对actor表加write锁

mysql> lock table actor write;
 Query OK, 0 rows affected (0.00 sec)

此时，该会话对actor表的读写操作均被阻塞

mysql> select * from actor where actor_id = 10;
 等待

插入一条数据：

mysql> insert into actor values(10,'j','j');
 Query OK, 1 row affected (0.00 sec)

等待

回滚：

mysql> rollback;
 Query OK, 0 rows affected (0.00 sec)

等待

重新开启一个事务：

mysql> start transaction;
 Query OK, 0 rows affected (0.00 sec)

等待

会话1开启一个新事务的同时，表锁被释放，此时可以查询到：

mysql> select * from actor where actor_id = 10;
 +----------+------------+-----------+
 | actor_id | first_name | last_name |
 +----------+------------+-----------+
 |       10 | j          | j         |
 +----------+------------+-----------+
 1 row in set (3 min 32.01 sec)

对lock方式加的表锁不能通过rollback进行回滚

**注意，提交、回滚的操作只能对事务类型的表，所有的DDL语句是不能回滚的，另外，部分DDL语句还会造成隐式的提交。**

在事务中我们还可以定义SAVEPOINT来对当前点进行标记，然后可以通过回滚操作来退回到指定的点，这样我们可以定义多个不同的SAVEPOINT来实现不同节点的回滚；注意，如果SAVEPOINT定义了相同的名字，那么后面的会覆盖掉前面的定义；对于不再需要的SAVEPOINT可以通过RELEASE SAVEPOINT命令来删除。

举个例子：

会话1
会话2

查询第11条记录，结果为空

mysql> select * from actor where actor_id=11;
 Empty set (0.00 sec)

第11条记录同样为空

mysql> select * from actor where actor_id = 11;
 Empty set (0.00 sec)

启动一个事务，向actor表中插入数据

mysql> start transaction;
 Query OK, 0 rows affected (0.00 sec)

mysql> insert into actor values(11,'k','k');
 Query OK, 1 row affected (0.00 sec)

可以查询到刚刚插入的记录

mysql> select * from actor where actor_id=11;
 +----------+------------+-----------+
 | actor_id | first_name | last_name |
 +----------+------------+-----------+
 |       11 | k          | k         |
 +----------+------------+-----------+
 1 row in set (0.00 sec)

无法查询到会话1刚插入的记录

mysql> select * from actor where actor_id = 11;
 Empty set (0.00 sec)

定义savepoint，名为test

mysql> savepoint test;
 Query OK, 0 rows affected (0.00 sec)

继续插入一条数据

mysql> insert into actor values(12,'l','l');
 Query OK, 1 row affected (0.00 sec)

可以查询到插入的两条记录：

mysql> select * from actor where actor_id=11 or actor_id = 12;
 +----------+------------+-----------+
 | actor_id | first_name | last_name |
 +----------+------------+-----------+
 |       11 | k          | k         |
 |       12 | l          | l         |
 +----------+------------+-----------+
 2 rows in set (0.00 sec)

依然无法查询到结果：

mysql> select * from actor where actor_id = 11 or actor_id = 12;
 Empty set (0.00 sec)

回滚到刚才定义的savepoint点

mysql> rollback to savepoint test;
 Query OK, 0 rows affected (0.00 sec)

此时只能找到第11条记录，第12条已经被回滚了：

mysql> select * from actor where actor_id=11 or actor_id = 12;
 +----------+------------+-----------+
 | actor_id | first_name | last_name |
 +----------+------------+-----------+
 |       11 | k          | k         |
 +----------+------------+-----------+
 1 row in set (0.00 sec)

依然无结果：

mysql> select * from actor where actor_id = 11 or actor_id = 12;
 Empty set (0.00 sec)

提交：

mysql> commit;
 Query OK, 0 rows affected (0.00 sec)

只能查到第11条记录

mysql> select * from actor where actor_id=11 or actor_id = 12;
 +----------+------------+-----------+
 | actor_id | first_name | last_name |
 +----------+------------+-----------+
 |       11 | k          | k         |
 +----------+------------+-----------+
 1 row in set (0.00 sec)

同样只能查到第11条记录

mysql> select * from actor where actor_id = 11 or actor_id = 12;
 +----------+------------+-----------+
 | actor_id | first_name | last_name |
 +----------+------------+-----------+
 |       11 | k          | k         |
 +----------+------------+-----------+
 1 row in set (0.00 sec)

## 三、分布式事务的使用

MySQL从5.0.3开始支持分布式事务，且目前只有InnoDB存储引擎支持。一个分布式事务会涉及多个行动，这些行动本身是事务性的，所有行动必须一起成功完成或者一起被回滚。

#### 3.1 分布式事务原理

MySQL中分布式事务的应用程序涉及一个或多个资源管理器和一个事务管理器：

- **资源管理器（resource manager）** ：用来管理系统资源，是通向事务资源的途径。数据库就是一种资源管理器。资源管理还应该具有管理事务提交或回滚的能力。例如多台MySQL服务器或与其它服务器的组合都可以作为资源管理器。
- **事务管理器（transaction manager）：** 事务管理器是分布式事务的核心管理者。事务管理器与每个资源管理器（resource

manager）进行通信，协调并完成事务的处理。事务的各个分支由唯一命名进行标识。

例如：mysql在执行分布式事务（外部XA）的时候，mysql服务器相当于xa事务资源管理器，与mysql链接的客户端相当于事务管理器。

分布式事务通常采用2PC协议，全称Two Phase Commitment Protocol。该协议主要为了解决在分布式数据库场景下，所有节点间数据一致性的问题。分布式事务通过2PC协议将提交分成两个阶段：

- **阶段一为准备（prepare）阶段**：即所有的参与者准备执行事务并锁住需要的资源。参与者ready时，向transaction manager报告已准备就绪。
- **阶段二为提交阶段（commit）** ：当transaction manager确认所有参与者都ready后，向所有参与者发送commit命令，否则发送回滚命令rollback。

如下图所示：

#### 3.2 分布式事务语法

分布式事务（XA事务）的语法如下：

XA{ START | BEGIN } xid [JOIN | RESUME] 启动一个XA事务（包含一个唯一事务标识符xid ）

XAEND xid [SUSPEND [FOR MIGRATE]] 结束xid事务

XAPREPARE xid 准备、预提交xid事务

XACOMMIT xid [ONE PHASE] 提交xid事务

XAROLLBACK xid 回滚xid事务

XARECOVER 查看处于PREPARE 阶段的所有事务的详细信息

xid的值唯一，它包含 gtrid [, bqual [, formatID ]] 3个部分：

- gtrid 是一个分布式事务标识符，相同的分布式事务应该使用相同的gtrid，这样可以明确知道XA事务属于哪个分布式任务；
- bqual 是一个分支限定符，默认值是空串；对于一个分布式事务中的每个分支事务，bqual的值必须唯一；
- formatID 是一个数字，用于标识由gtrid和bqual值使用的格式，默认值是1。

举个例子具体说明，在这里没有使用多个不同的数据库，只是使用了MySQL数据库里面的两个库test1和mydb1：

test1库中的会话1
mydb1库中的会话2

在数据库test1中启动一个分布式事务的一个分支事务

mysql> xa start 'test','test1';
 Query OK, 0 rows affected (0.00 sec)

分支事务1在actor表中插入一条记录：

mysql> insert into actor values(13,'l','l');
 Query OK, 1 row affected (0.00 sec)

在数据库mydb1中启动分布式事务‘test’的另外一个分支事务

mysql> xa start 'test','mydb1';
 Query OK, 0 rows affected (0.00 sec)

分支事务2在表mydb_test中插入两条记录

mysql> insert into mydb_test values(1,'test1'),(2,'test2');
 Query OK, 2 rows affected (0.00 sec)
 Records: 2  Duplicates: 0  Warnings: 0

对分支事务1进行第一阶段提交，进入prepare状态：

mysql> xa end 'test','test1';
 Query OK, 0 rows affected (0.00 sec)

mysql> xa prepare 'test','test1';
 Query OK, 0 rows affected (0.00 sec)

对分支事务2进行第一阶段提交，进入prepare状态：

mysql> xa end 'test','mydb1';
 Query OK, 0 rows affected (0.00 sec)

mysql> xa prepare 'test','mydb1';
 Query OK, 0 rows affected (0.00 sec)

查看出于prepare状态的事务

mysql> xa recover \G
 *************************** 1. row ***************************
     formatID: 1
 gtrid_length: 4
 bqual_length: 5
         data: testmydb1
 *************************** 2. row ***************************
     formatID: 1
 gtrid_length: 4
 bqual_length: 5
         data: testtest1
 2 rows in set (0.00 sec)

查看出于prepare状态的事务

mysql> xa recover \G;
 *************************** 1. row ***************************
     formatID: 1
 gtrid_length: 4
 bqual_length: 5
         data: testmydb1
 *************************** 2. row ***************************
     formatID: 1
 gtrid_length: 4
 bqual_length: 5
         data: testtest1
 2 rows in set (0.00 sec)

两个事务都进入准备提交阶段，如果提交遇到错误，应该回滚所有的分支以确保分布式任务的正确

提交分支事务1：

mysql> xa commit 'test','test1';
 Query OK, 0 rows affected (0.00 sec)

提交分支事务2：

mysql> xa commit 'test','mydb1';
 Query OK, 0 rows affected (0.00 sec)

#### 3.3 存在的问题

MySQL5.7.7版本之前，它支持的分布式是有缺陷的，具体表现在：

- 已经prepare的事务，在客户端异常退出或者服务宕机的时候，2PC的事务会被回滚；
- 在服务器故障重启提交后，相应的Binlog被丢失。

但是在5.7.7版本之后，这个bug被修复了，后面使用MySQL的分布式事务就有了较好的支持。

两个版本之间的问题及如何修复解决的可以参见博客[https://blog.csdn.net/hzrandd/article/details/50688437](https://blog.csdn.net/hzrandd/article/details/50688437)，里面有较好的解释。
