# 37、SQL Server 教程 - 修改与删除存储过程
- 来源：https://ddkk.com/zhuanlan/db/sqlserver/2/37.html
- 分类：缓存数据库
- 分组：教程目录
## ALTER PROCEDURE (Transact-SQL)

[https://docs.microsoft.com/zh-cn/sql/t-sql/statements/alter-procedure-transact-sql?view=sql-server-ver15](https://docs.microsoft.com/zh-cn/sql/t-sql/statements/alter-procedure-transact-sql?view=sql-server-ver15)

```java
-- Syntax for SQL Server and Azure SQL Database
ALTER { PROC | PROCEDURE } [schema_name.] procedure_name [ ; number ]   
    [ { @parameter [ type_schema_name. ] data_type }   
        [ VARYING ] [ = default ] [ OUT | OUTPUT ] [READONLY]  
    ] [ ,...n ]   
[ WITH <procedure_option> [ ,...n ] ]  
[ FOR REPLICATION ]   
AS { [ BEGIN ] sql_statement [;] [ ...n ] [ END ] }  
[;]  
<procedure_option> ::=   
    [ ENCRYPTION ]  
    [ RECOMPILE ]  
    [ EXECUTE AS Clause ]
```

## DROP PROCEDURE (Transact-SQL)

[https://docs.microsoft.com/zh-cn/sql/t-sql/statements/drop-procedure-transact-sql?view=sql-server-ver15](https://docs.microsoft.com/zh-cn/sql/t-sql/statements/drop-procedure-transact-sql?view=sql-server-ver15)

```java
-- Syntax for SQL Server and Azure SQL Database  
DROP { PROC | PROCEDURE } [ IF EXISTS ] { [ schema_name. ] procedure } [ ,...n ]
```
