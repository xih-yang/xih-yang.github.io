# 44、SQL Server 教程 - 使用T-SQL创建DDL触发器
- 来源：https://ddkk.com/zhuanlan/db/sqlserver/2/44.html
- 分类：缓存数据库
- 分组：教程目录
利用DDL类型的触发器可以限制和记录特定的DDL操作。例如通过DDL触发器可以限制对数据库结构的修改，记录数据库中的更改事件，也可以在修改对象的时候根据实际情况做出必需的响应动作

例创建DDL触发器。 要求拒绝创建表，并做出相关提示。

```java
use AdventureWorks
go
IF EXISTS (SELECT * FROM sys.triggers WHERE name='trg_reftable')
DROP TRIGGER trg_reftable
ON DATABASE;
GO
CREATE TRIGGER trg_reftable
ON DATABASE
FOR CREATE_TABLE
AS
  RAISERROR ('AdventureWorks数据库禁止创建表！',10,1)
  ROLLBACK
GO
```

验证触发器

执行创建表的操作，用于验证触发器是否正常激发

```java
CREATE TABLE  treftest(reftest nchar(10) NULL)
ON [PRIMARY]
GO
```
