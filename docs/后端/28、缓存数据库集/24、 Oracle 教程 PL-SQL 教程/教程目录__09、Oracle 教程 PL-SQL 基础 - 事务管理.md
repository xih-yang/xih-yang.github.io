# 09、Oracle 教程 PL/SQL 基础 - 事务管理
- 来源：https://ddkk.com/zhuanlan/db/oracle/4/9.html
- 分类：缓存数据库
- 分组：教程目录
- **commit**：保存上一个commit或者rollback以来发生的所有变化，并且释放锁资源；
- **rollback**：撤销从上一个commit或者rollback以来发生的所有变化，并且释放锁资源；
- **rollback to savepoint**：撤销自从指定保存点以来的所有改变，并且释放这一部分代码使用的资源；
- **savepoint**：创建一个保存点，有了保存点之后就可以进行部分回滚操作；
- **set transaction**：启动一个只读或者读写的会话，创建一个隔离级别，或者为当前的事务分配一个专门的回滚段；
- **lock table**：用指定的模式锁定整个数据库表，这个命令覆盖了表缺省使用的行级锁。

## COMMIT语句

语法：

```java
COMMIT [WORK] [COMMENT text]
```

- **work**是一个可选的关键字，主要用于改善代码的可读性；
- **text**是一个长度不操作50个字符的注释，要用引号包围。

使用commit之后，就不能再使用rollback语句回滚了。

## ROLLBACK语句

语法：

```java
ROLLBACK [WORK] [TO [SAVEPOINT] savepoint_name]
```

- **savepoint_name**是一个保存点的名字，回滚到某个特定的保存点后，在该保存点之后的所有保存点就都清除了。在执行insert、update、merge、delete之前，PL/SQL都会隐含的生成一个保存点，如果这个DML语句失败，会自动发生一个回滚动作。

## SAVEPOINT语句

语法：

```java
SAVEPOINT savepoint_name；
```

如果在当前事务中重用了一个保存点名字，这个保存点就会从原先的位置移到当前事务所在的位置，不管这个SAVEPOINT语句是在过程、函数或者匿名块中执行的。

## SET TRANSACTION命令

启动一个只读的或者可读可写的会话，或者设置隔离级别，或者给当前会话分配一个专门的回滚段。这个语句**必须是事务处理的第一个SQL语句，并且只能用一次**。有四种形式：

**1、****SETTRANSACTIONREADONLY**：这个语句把当前事务定义成只读的在这个只读事务中，后续的查询能看到的只是在事务开始之前已经提交的变化当执行一个运行时间很长的，多个查询组成的报表时，希望确保报表中的数据是一致的，这个语句就非常有用；

**2、****SETTRANSACTIONREADWRITE**：把当前的事务定义为可读写的，并且这也是缺省设置；

**3、****SETTRANSACTIONISOLATIONLEVELSERIALIZABLE|READCOMMITTED**：定义数据的事务是如何处理的如果指定的是serializable，则如果要修改的表已经被另一个尚未提交的事务修改了，这个DML语句就会失败（要想使用这个命令，数据的初始化参数COMPATIBLE必须设置为7.3.0或者更高的值）；如果指定的是readcommitted，则请求的行级锁已经被另一个事务所持有，这个DML语句就要一直等待锁释放，这也是DML语句的缺省行为；

**4、****SETTRANSACTIONUSEROLLBACKSEGMENTrollback_segname**：为当前语句指定一个专门的回滚段，并把事务设置成可读写这个语句不能和SETTRANSACTIONREADONLY一起使用；

## LOCK TABLE语句：（尽量少用这个语句，默认的就好）

通过这个语句，可以用某种模式的锁把数据库中的某个表整个锁定。

语法：

```java
LOCK TABLE table_reference_list [ WITH HOLD ] IN lock_mode MODE [NOWAIT],
```

- **table_reference_list**是由一个或者多个表组成的列表，
- **WITH HOLD**：如果指定该语句，则锁一直保持到链接结束；没有指定，则提交或者回退当前事务的时候释放锁；
- **lock_mode**是锁的模式，可以是：
- ROW SHARE：行共享，允许其他用户同时更新其他行，允许其他用户同时加共享锁，不允许有独占（排他性质）的锁
- ROW EXCLUSIVE：行排他，允许其他用户同时更新其他行，只允许其他用户同时加行共享锁或者行排他锁
- SHARE UPDATE：
- SHARE：共享，不允许其他用户同时更新任何行，只允许其他用户同时加共享锁或者行共享锁
- SHARE ROW EXCLUSIVE：共享行排他，允许其他用户同时更新其他行，只允许其他用户同时加行共享锁
- EXCLUSIVE：排他，其他用户禁止更新任何行，禁止其他用户同时加任何锁
- 如果指定了**NOWAIT**关键字：如果这个表已经被另一个用户锁定，数据库不会等待这个锁资源，而是报告一个错误。如果没有这个关键字，则会一直等到这个表可用位置（等待时间无限制）；

## 自治事务

自治事务就是把这个块中的DML语句和调用程序的事务环境完全个离开。这个块就成为一个由其他事务启动的独立的事务，前一个事务就被叫做主事务。在自治事务中，主事务是挂起的。

语法：

```java
PRAGMA AUTONOMOUS_TRANSACTION；可以放在PL/SQL块声明单元的任何地方。
```

限制：

- 如果自治事务要访问的资源已经被主事务（主事务已经暂停，要等自治过程退出才能继续）持有，这样程序就发生了死锁。
- 不能只用一个PRAGMA声明就把一个包中的所有子程序（或者一个对象类型中的所有方法）全部标志成自治的。我们必须对于包体的每个程序的声明单元都明确的指定自治事务。这个规则的一个后果就是我们无法通过包规范来区分到底哪一个程序是自治事务的。
- 如果想从一个已经执行了至少一个INSERT、UPDATE、MERGE、DELETE语句的自治事务程序没有任何错误的退出，就必须明确的执行一个提交或者回滚。如果该程序（或者被它调用的程序）使得事务挂起，运行引擎就会抛出异常，然后回滚所有未提交的事务；
- COMMIT和ROLLBACK语句只是结束了活动的自治事务，但不会终止自治例程，实际上，可以在一个自治块中使用多个COMMIT和/或者ROLLBACK语句；
- 只能回滚到当前会话内创建的保存点。如果是在一个自治事务中，就不能回滚到主事务创建的保存点。如果视图这样做，运行引擎会抛出异常。
- 数据参数文件中的TRANSACTIONS参数指定的是一个会话内可以并发的最大事务数量。如果我们的应用中大量的用到自治事务例程，遇到maximun number of concurrent transactions exceeded异常，需要扩大这个限制来解决。

自治事务的缺省行为：只要在自治事务中执行了COMMIT或者ROLLBACK，这些改变就立即对主事务可见。如果要想隐藏，就要使用SET TRANSACTION ISOLATION LEVEL SERIALIZABLE，通常是在事务开始之前调用它（即在任何SQL语句之前）。而且，这个设置会影响整个会话，而不是当前程序。
