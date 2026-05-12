# 45、SQL Server 教程 - 管理触发器
- 来源：https://ddkk.com/zhuanlan/db/sqlserver/2/45.html
- 分类：缓存数据库
- 分组：教程目录
## 1.利用T-SQL修改触发器

例创建触发器并对其进行修改。要求创建触发器trg_chk_i，并对其进行修改

```java
use test
go
--创建触发器
CREATE TRIGGER trg_chk_i
ON ATriTest
AFTER insert
AS
BEGIN
	print '创建trg_chk_i完成!';
END
--修改触发器
ALTER TRIGGER trg_chk_i
ON ATriTest
AFTER insert
AS
BEGIN
	print '修改trg_chk_i完成!';
END
```

## 2.删除触发器

## DROP TRIGGER (Transact-SQL)

[https://docs.microsoft.com/zh-cn/sql/t-sql/statements/drop-trigger-transact-sql?view=sql-server-ver15](https://docs.microsoft.com/zh-cn/sql/t-sql/statements/drop-trigger-transact-sql?view=sql-server-ver15)

```java
-- Trigger on an INSERT, UPDATE, or DELETE statement to a table or view (DML Trigger)  
DROP TRIGGER [ IF EXISTS ] [schema_name.]trigger_name [ ,...n ] [ ; ]  
-- Trigger on a CREATE, ALTER, DROP, GRANT, DENY, REVOKE or UPDATE statement (DDL Trigger)  
DROP TRIGGER [ IF EXISTS ] trigger_name [ ,...n ]   
ON { DATABASE | ALL SERVER }   
[ ; ]  
-- Trigger on a LOGON event (Logon Trigger)  
DROP TRIGGER [ IF EXISTS ] trigger_name [ ,...n ]   
ON ALL SERVER
```

例删除触发器。利用脚本删除前面创建的DML触发器trg_ATriStudent_i1

```java
USE test
GO
DROP TRIGGER trg_ATriStudent_i1;
GO
```

## 3.禁用触发器

## DISABLE TRIGGER (Transact-SQL)

[https://docs.microsoft.com/zh-cn/sql/t-sql/statements/disable-trigger-transact-sql?view=sql-server-ver15](https://docs.microsoft.com/zh-cn/sql/t-sql/statements/disable-trigger-transact-sql?view=sql-server-ver15)

```java
DISABLE TRIGGER { [ schema_name . ] trigger_name [ ,...n ] | ALL }  
ON { object_name | DATABASE | ALL SERVER } [ ; ]
```

- DISABLE TRIGGER项：表示禁用触发器的关键词.
- schema_name项：触发器所在的架构.
- trigger_name项；禁用触发器的名称。
- ALL项：表示禁用ON子句中定义的所有触发器.
- object_ame项：表示触发器所在的表或视图.
- DATABASE项：表示整个数据库都是禁用的作用范围，针对DDL触发器.
- ALL SERVER项：表示服务器都是禁用的作用范围，针对DDL触发器和登录触发器。

例利用T-SQL禁用触发器. 禁用ATriTest表下的trg_chk_i触发器。

```java
USE test
GO
DISABLE  TRIGGER trg_chk_i
ON ATriTest
```

## 4.启用触发器

## ENABLE TRIGGER (Transact-SQL)

[https://docs.microsoft.com/zh-cn/sql/t-sql/statements/enable-trigger-transact-sql?view=sql-server-ver15](https://docs.microsoft.com/zh-cn/sql/t-sql/statements/enable-trigger-transact-sql?view=sql-server-ver15)

```java
ENABLE TRIGGER { [ schema_name . ] trigger_name [ ,...n ] | ALL }  
ON { object_name | DATABASE | ALL SERVER } [ ; ]
```

例利用T-SQL启用触发器. 启用ATriTest表下的trg_chk_i触发器。

```java
USE test
GO
ENABLE TRIGGER trg_chk_i
ON ATriTest
```
