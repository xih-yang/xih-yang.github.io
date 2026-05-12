# 43、SQL Server 教程 - 触发器执行的顺序
- 来源：https://ddkk.com/zhuanlan/db/sqlserver/2/43.html
- 分类：缓存数据库
- 分组：教程目录
在一张表有多个触发器的时候，允许开发人员对AFTER触发器被激发的顺序进行控制。控制顺序需要用到sp_settriggerorder存储过程，并注意以下几个方面：

- 顺序只能控制第一个触发器和最后一个触发器，除此之外的中间触发器顺序无法控制。
- 第一个和最后一个触发器必须是两个不同的DML触发器。
- 控制顺序只针对相同的触发动作而言，也就是说AFTER update触发器，只能为UPDATE操作设置次序。
- INSTEAD OF触发器不能设置顺序。
- 如果ALTER TRIGGER语句更改了第一个或最后一个触发器，则会删除First或Last属性并将顺序值设置为None。必须使用sp_settriggerorder来重置顺序。

## sp_settriggerorder (Transact-SQL)

[https://docs.microsoft.com/zh-cn/sql/relational-databases/system-stored-procedures/sp-settriggerorder-transact-sql?view=sql-server-ver15](https://docs.microsoft.com/zh-cn/sql/relational-databases/system-stored-procedures/sp-settriggerorder-transact-sql?view=sql-server-ver15)

```java
sp_settriggerorder [ @triggername = ] '[ triggerschema. ] triggername'   
    , [ @order = ] 'value'   
    , [ @stmttype = ] 'statement_type'   
    [ , [ @namespace = ] { 'DATABASE' | 'SERVER' | NULL } ]
```

- @triggemame项：要设置或更改其顺序的触发器的名称及其所属的架构。
- @order项：触发器需要设置的顺序，可以是First，表示该触发器被第一个激发；Last，表示该触发器被最后一个激发；None，表示该触发器没有定义激发顺序。
- @stmttype项：表示需要设置顺序的触发器的操作事件，INSERT、UPDATE、DELETE或DDL事件中列出的任何Transact-SQL语句事件，如CREATE TABLE事件等，不能指定事件组．如果触发器为AFTER update触发器，而该参数只能设置成UPDATE，如果设置成INSERT就会出错。
- @namespace项：如果triggernamc表示DML触发器，该项不需要指定值或指定为NULL。如果triggemame是DDL触发器，则代表triggemame的作用域，可以是数据库作用域或服务器作用域。如果triggemame是登录触发器，则只能指定SERVER。

例演示触发器设置顺序。

要求利用sp_settriggerorder设置触发器的顺序。操作步骤如下：

①创建第一个简单测试触发器

```java
CREATE TRIGGER  trg_ATriStudent_i1
ON  ATriStudent
AFTER update
AS
BEGIN
	print '触发器trg_ATriStudent_i1被激发!'
END
```

②创建第二个简单测试触发器

```java
CREATE TRIGGER trg_ATriStudent_i2
ON  ATriStudent
AFTER update
AS
BEGIN
	print '触发器trg_ATriStudent_i2被激发!'
END
```

③测试目前的触发器执行顺序

update ATriStudent set age=12

④利用存储过程sp_settriggerorder改变触发器被激发的顺序

```java
sp_settriggerorder 
@triggername='trg_ATriStudent_i1',@order='First',@stmttype ='UPDATE';
```
