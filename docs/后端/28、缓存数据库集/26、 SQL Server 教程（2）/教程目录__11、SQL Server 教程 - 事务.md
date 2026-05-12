# 11、SQL Server 教程 - 事务
- 来源：https://ddkk.com/zhuanlan/db/sqlserver/2/11.html
- 分类：缓存数据库
- 分组：教程目录
## 一.事务

事务在数据库中主要用于保证数据的一致性，防止出现错误数据口在事务内的语句集会被看成一个单元，语句集中一旦有一条失败，那么所有的都会失败。

## 二.事务的特性

事务是构成单一逻辑工作单元的操作集合，具有ACID特性，即ATOMIC（原子性）、CONSISTENT（一致性）、ISOLATED（隔离性）、DURABLE（持久性）o事务的这些特性，不仅适用于SQL Server 2008，也适用于其他的数据库，例如Oraclc、MySQL等，只有具备以上4个特点才能称为一个事务。

(1)原子性：事务的原子性是指，事务中程序是数据库的逻辑工作单位，它对数据的修改要么全部执行，要么完全不执行。原子也意味着不可分割，不管有多少程序，只要在同一个事务中，那么它们就是一个整体，如果都执行成功才意味着该事务成功，而只要有一个操作失败，那么同一个事务中的其他操作即使执行成功也没有用，事务会使其全部撤销。

(2)一致性：事务的一致性是指，事务执行的前后数据库都必须处于一致状态，它是相对脏读而言的。只有在事务完成后才能被所有使用者看见，保证了数据的完整性。例如在银行转账时，从A账户取款但没有放到B账户中的时候是不一致的，数据也是不完整的，其他使用者此时不能看到A中修改后的数据，只有存到B账户中，交易完成并提交事务，这时才算数据一致，所有用户也会看到修改后的数据。

(3)隔离性：分离性是指并发事务之间不能相互干扰，也就是说一个事务操作的数据不会被其他事务看到和操作。

(4)持久性；持久性是指一旦事务提交完成，那么这将是对数据永久的修改，即使被修改后的数据遭到破坏，也不会出现回到修改之前的情况。

## 三.事务的模式

SQLServcr中事务有三种模式，在没有任何设置的情况下，数据库提供自动提交事务的模式，这也是平时增加或修改数据时开发人员感觉不到事务作用的原因。对于这三种模式，事务的开始都有不同的方式，而结束则用COMMIT或ROLLBACK语句来完成。

### 1．显式事务

所谓显式事务就是通过BEGIN TRANSACTION语句来显式启动事务。并由COMMITTRANSACTION语句进行事务提交。

BEGIN { TRAN | TRANSACTION }

[{ transactior_name | @tran_name_variable

[WITH MARK [ 'description' ] ]

]
[; ]

#### 示例1 利用显式事务控制DML操作，控制对表orderinfo进行的DML操作。（需删除前面创建的约束）

useAdventureWorks

go

BEGIN TRANSACTION tr_OrderInfo

INSERT INTO OrderInfo (CustomId,ProductId,OrderQuantity)VALUES(14,11,10)

GO

UPDATE OrderInfo

SETOrderQuantity = 12

WHERE CustomId = 14

GO

COMMIT TRANSACTION tr_orderinfo

### 2．自动提交事务

自动提交事务是SQL Server数据库的默认模式。该类型不需要开发人员手工做任何操作，每个单独的T-SQL语句都在其完成后自动提交，如果出现错误则回滚该SQL语句，由于是自动模式，所以开发人员无法对其进行严格的控制，该模式不适合大规模导入数据，也不适合有业务关联的数据录入，而适合开发人员的日常操作。因为该模式每条语句之间不在一个事务当中，如果完成一项业务需要3条语句，而在第2条语句出错时，该模式不能把第1条语句撤销，这就无法保证数据的一致性。

### 3．隐式事务

隐式事务需要利用T-SQL语句打开才能使用，打开隐式事务的语句是：

SETIMPLICIT TRANSACTIONS ON

一旦隐式模式被打开，数据库实例第一次执行ALTER TABLE、INSERT、CREATE、OPEN、DELETE、REVOKE DROP、SELECT、FETCH、TRUNCATE TABLE. GRANT、UPDATE语句时，会自动开始一个新事务。开始的事务需要利用COMMIT或ROLLBACK结束。当事务结束时，一旦运行以上类型的语句，会再次自动开始一个新的事务，这样就形成了一个事务的链。

#### 示例2 利用隐式事务处理AdventureWorks数据库里表orderinfo中的DML操作。

useAdventureWorks

go
setIMPLICIT_TRANSACTIONS ON

INSERT INTO OrderInfo (CustomId,ProductId,OrderQuantity)VALUES(2,222,22)

GO

UPDATE OrderInfo

SETOrderQuantity = 22

WHERE OrderId = 7

GO

COMMIT

setIMPLICIT_TRANSACTIONS OFF

## 四.事务的保存点

设置事务保存点和事务回滚至保存点的语法：

01SAVE TRANSACTION savepoint_name

02ROLLBACK TRANSACTION savepoint_iame
