# 22、MySQL 教程 - MySQL 事务的ACID特性、多事务并发问题、隔离级别
- 来源：https://ddkk.com/zhuanlan/db/mysql/6/22.html
- 分类：缓存数据库
- 分组：教程目录
## 1. 存储引擎支持情况

SHOW ENGINES 命令来查看当前 MySQL 支持的存储引擎都有哪些，以及这些存储引擎是否支持事务。

能看出在 MySQL 中，只有InnoDB 是支持事务的。

## 2. 基本概念

事务：一组逻辑操作单元，使数据从一种状态变换到另一种状态。

事务处理的原则：保证所有事务都作为 一个工作单元来执行，即使出现了故障，都不能改变这种执行方 式。当在一个事务中执行多个操作时，要么所有的事务都被提交( commit )，那么这些修改就永久地保 存下来；要么数据库管理系统将 放弃 所作的所有修改 ，整个事务回滚( rollback )到最初状态。

## 3. 事务的ACID特性

**1. 原子性（atomicity）**

原子性是指事务是一个不可分割的工作单位，要么全部提交，要么全部失败回滚。

**2. 一致性（consistency）**

一致性是指事务执行前后，数据从一个 合法性状态 变换到另外一个合法性状态 。这种状态是语义上 的而不是语法上的，跟具体的业务有关。

那什么是合法的数据状态呢？满足 预定的约束 的状态就叫做合法的状态。通俗一点，这状态是由你自己来定义的。满足这个状态，数据就是一致的，不满足这个状态，数据就 是不一致的！如果事务中的某个操作失败了，系统就会自动撤销当前正在执行的事务，返回到事务操作之前的状态。

例如：A账户有200元，转账300元出去，此时A账户就是-100元，此时数据是不一致的，因为余额必须大于等于0。

例如：A账户有200元，转账50元给B账户，A账户的钱扣了，但是B账户因为各种意外，余额并没有增加，此时数据是不一致的，因为A+B的余额必须不变。

**3. 隔离型（isolation）**

事务的隔离性是指一个事务的执行不能被其他事务干扰 ，即一个事务内部的操作及使用的数据对并发的其他事务是隔离的，并发执行的各个事务之间不能互相干扰。

如果无法保证隔离性会怎么样？

假设A账户有200元，B账户0元。A账户往B账户转账两次，每次金额为50 元，分别在两个事务中执行。如果无法保证隔离性，会出现下面的情形：

```java
UPDATE accounts SET money = money - 50 WHERE NAME = 'AA';
UPDATE accounts SET money = money + 50 WHERE NAME = 'BB';
```

**4. 持久性（durability）**

持久性是指一个事务一旦被提交，它对数据库中数据的改变就是 永久性的 ，接下来的其他操作和数据库故障不应该对其有任何影响。

持久性是通过事务日志来保证的。日志包括了重做日志和回滚日志 。当我们通过事务对数据进行修改的时候，首先会将数据库的变化信息记录到重做日志中，然后再对数据库中对应的行进行修改。这样做的好处是，即使数据库系统崩溃，数据库重启后也能找到没有更新到数据库系统中的重做日志，重新执行，从而使事务具有持久性。

## 4. 如何使用事务

使用事务有两种方式，分别为 显式事务 和 隐式事务 。

### 4.1 显式事务

**步骤1**： START TRANSACTION 或者 BEGIN ，作用是显式开启一个事务。

```java
mysql> BEGIN;
#或者
mysql> START TRANSACTION;
```

START TRANSACTION 语句相较于 BEGIN 特别之处在于，后边能跟随几个修饰符 ：

- READ ONLY ：标识当前事务是一个只读事务 ，也就是属于该事务的数据库操作只能读取数据，而不 能修改数据。
- READ WRITE ：标识当前事务是一个读写事务 ，也就是属于该事务的数据库操作既可以读取数据， 也可以修改数据。
- WITH CONSISTENT SNAPSHOT ：启动一致性读。

如果想开启一个只读事务：

```java
start transaction read only;
```

如果想开启一个只读事务和一致性读：

```java
start transaction read only,with consistent snapshot;
```

**步骤2**：一系列事务中的操作（主要是DML，不含DDL）

**步骤3**：提交事务 或 中止事务（即回滚事务）

```java
// 提交事务。当提交事务后，对数据库的修改是永久性的。 
mysql> COMMIT; 
```

```java
// 回滚事务。即撤销正在进行的所有没有提交的修改 
mysql> ROLLBACK; 
```

```java
// 将事务回滚到某个保存点。 
mysql> ROLLBACK TO [SAVEPOINT]
```

### 4.2 隐式事务

MySQL中有一个系统变量 autocommit ：

即默认情况下，如果不显式的使用start transaction 或者begin语句开启一个事务，那么每一条语句都是一个独立的事务。

当然，如果我们想关闭这种 自动提交 的功能，可以使用下边两种方法之一：

- 显式的的使用 START TRANSACTION 或者 BEGIN 语句开启一个事务。这样在本次事务提交或者回滚前会暂时关闭掉自动提交的功能。
- 把系统变量 autocommit 的值设置为 OFF ，SET autocommit = OFF

### 4.3 隐式提交

当使用start transaction 或者begin语句开启了事务，或者系统变量autocommit的值设置off时，事务就不会进行自动提交。如果我们输入了某些语句，且这些语句会导致之前的事务悄悄的提交掉，那么这些因为某些特殊的语句而导致事务提交的情况称为隐式提交，会导致隐式提交的语句下面这些：

- 定义或修改数据库对象的数据定义语言

所谓的数据库对象指的是数据库，表，视图，存储引擎等这些东西，当使用create、alter、drop等语句修改这些数据库对象时，就会隐式的提交前面语句所属的事务，就像下面这样：

```java
begin；
select ... 事务中的一条语句
update...# 事务中的一条语句
create table...此语句会隐藏提交前面语句所属的事务
```

- 隐式使用或修改MySQL数据库中的表

在使用alert user、create table、drop user、gant、rename user、revoke、set password等语句时，会隐式提交前面语句所属的事务。

- 事务控制或关于锁定的语句

当我们在一个事务还没有提交或者还没回滚是就又使用start transaction 或者 begin语句又开启了一个事务，此时会隐式提交上一个事务，就像下面这样：

```java
begin;
select ... 事务中的一条语句
update...# 事务中的一条语句
begin;
```

使用lock tables、unlock tables等关于锁定的语句也会隐式的提交前面的语句所属的事务。

### 4.4 保存点

如果你已经开启了一个事务，并且输入了很多语句，这时突然发现前面已经执行完成的某个语句的参数写错了，最好使用rollback语句能让数据库状态恢复到事务执行之前的样子，然后一切从头再来。

数据库有一个保存点的概念，就是在事务对应的数据库语句中打几个点，我们在使用rollback语句时可以指定回滚到哪个点，而不是回到最初的原点，定义保存点的语法如下：

```java
savepoint 保存点名称；
```

当项回到某个保存点时，可以使用下面的语句：

```java
rollback to 保存点名称；
```

如果rollback语句后面不跟随保存点名称，则直接回滚到事务执行之前的状态。

## 5. 多事务的并发进行造成的问题

①第一类丢失更新：某一个事务的回滚，导致另一个事务已经更新的数据丢失了

②第二类丢失更新：某一个事务的提交，导致另一个事务已经提交的数据丢失了

③脏读：某一个事务，读取了另一个事务未提交的数据。

④不可重复读：某一个事务，对同一个数据前后读取的结果不一致。

⑤幻读：某一个事务，对同一个表前后查询到的行数不一致。

不可重复读和幻读不要搞混：不可重复读针对一行数据的修改，幻读针对向一张表中插入一条数据或删除一条数据

## 6. 事务的隔离级别

### 6.1 事务的隔离级别

MySQL的默认隔离级别为可重复读，但是互联网项目建议使用读已提交。不同的隔离级别有不同的现象，并有不同的锁和并发机制，隔离级别越高，数据库的并发性能就越差。

- Read Uncommitted ：一个事务可以读取另一个事务未提交的数据，安全级别最低，问题都会产生
- Read Committed ：一个事务可以读取另一个事务已提交的数据，可以解决第一类丢失更新和脏读
- Repeatable Read ：事务开启后，其他事务不能对数据再进行修改（行锁），直到事务结束。
- Serializable ：解决所有问题。 需要对数据表加锁，加锁会降低数据处理的性能，效率最低。

### 6.2 设置事务的隔离级别

查看事务默认的隔离级别：

通过下面的语句修改事务的隔离级别：

```java
SET [GLOBAL|SESSION] TRANSACTION ISOLATION LEVEL 隔离级别;
// 其中，隔离级别格式：
> READ UNCOMMITTED
> READ COMMITTED
> REPEATABLE READ
> SERIALIZABLE
```

或者

```java
SET [GLOBAL|SESSION] TRANSACTION_ISOLATION = '隔离级别'
#其中，隔离级别格式：
> READ-UNCOMMITTED
> READ-COMMITTED
> REPEATABLE-READ
> SERIALIZABLE
```

关于设置时使用GLOBAL或SESSION的影响：

使用GLOBAL 关键字（在全局范围影响）：

```java
SET GLOBAL TRANSACTION ISOLATION LEVEL SERIALIZABLE;
// 或
SET GLOBAL TRANSACTION_ISOLATION = 'SERIALIZABLE';
```

(1)当前已经存在的会话无效

(2)只对执行完该语句之后产生的会话起作用

使用SESSION 关键字（在会话范围影响）：

```java
SET SESSION TRANSACTION ISOLATION LEVEL SERIALIZABLE;
// 或
SET SESSION TRANSACTION_ISOLATION = 'SERIALIZABLE';
```

(1)对当前会话的所有后续的事务有效

(2)如果在事务之间执行，则对后续的事务有效

(3)该语句可以在已经开启的事务中间执行，但不会影响当前正在执行的事务

数据库规定了多种事务隔离级别，不同隔离级别对应不同的干扰程度，隔离级别越高，数据一致性 就越好，但并发性越弱。

### 6.3 读未提交演示案例

```java
create table account(
	id int primary key auto_increment,
	name varchar(15),
	balance decimal(10,2)
);
insert into account(name,balance) values('张三',100),('李四',0);
// 关闭自动提交功能
set autocommit = off;
```

脏读：某一个事务，读取了另一个事务未提交的数据。

设置隔离级别为读未提交：事务2读取到了事务1未提交的数据。

### 6.4 读已提交演示案例

不可重复读：某一个事务，对同一个数据前后读取的结果不一致。

### 6.5 可重读演示案例

```java
// 事务1
mysql> set session transaction isolation level repeatable read;
mysql> begin;
mysql> select * from account where id=2;
+----+--------+---------+
| id | name   | balance |
+----+--------+---------+
|  2 | 李四   |    0.00 |
+----+--------+---------+
// 事务2
mysql> set session transaction isolation level repeatable read;
mysql> begin;
mysql> update account set balance = balance+100 where id=2;
mysql> commit;
// 事务1
mysql> select * from account where id=2;
+----+--------+---------+
| id | name   | balance |
+----+--------+---------+
|  2 | 李四   |  100.00 |
+----+--------+---------+
// 事务1    
mysql> select * from account where id=2;
+----+--------+---------+
| id | name   | balance |
+----+--------+---------+
|  2 | 李四   |  100.00 |
+----+--------+---------+
```

### 6.6 幻读演示案例

幻读：某一个事务，对同一个表前后查询到的行数不一致。

```java
// 事务1
mysql> set session transaction isolation level serializable;
mysql> begin;
mysql> select count(*) from account where id=3;
+----------+
| count(*) |
+----------+
|        0 |
+----------+
// 事务2
mysql> set session transaction isolation level serializable;
mysql> begin;
mysql> insert into account(id,name,balance) values(3,"王五",0);
mysql> commit;
// 事务1
// 主键重复，插入失败
mysql> insert into account(id,name,balance) values(3,"王五",0);
// 事务1
// 明明主键重复，但是id=3的记录却为0
mysql> select count(*) from account where id=3;
+----------+
| count(*) |
+----------+
|        0 |
+----------+ 
```
