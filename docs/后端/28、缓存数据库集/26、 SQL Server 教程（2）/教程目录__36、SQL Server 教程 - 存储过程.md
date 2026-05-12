# 36、SQL Server 教程 - 存储过程
- 来源：https://ddkk.com/zhuanlan/db/sqlserver/2/36.html
- 分类：缓存数据库
- 分组：教程目录
## 1.CREATE PROCEDURE (Transact-SQL)

[https://docs.microsoft.com/zh-cn/sql/t-sql/statements/create-procedure-transact-sql?view=sql-server-ver15](https://docs.microsoft.com/zh-cn/sql/t-sql/statements/create-procedure-transact-sql?view=sql-server-ver15)

```java
-- Transact-SQL Syntax for Stored Procedures in SQL Server and Azure SQL Database
CREATE [ OR ALTER ] { PROC | PROCEDURE }
    [schema_name.] procedure_name [ ; number ]
    [ { @parameter [ type_schema_name. ] data_type }
        [ VARYING ] [ = default ] [ OUT | OUTPUT | [READONLY]
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

- schema_namc:架构名。
- procedurc_name:存储过程名。
- number:对同名过程进行分组的选项，使用drop procedure语句可以将这些分组过程一起删除．
- @parameter:存储过程的参数。
- [type_schema name.]data_type：参数的架构及类型。
- VARYING：指定作为输出参数支持的结果集，仅适用于cursor参数。
- default：参数的默认值，如果定义了default值，则无须指定此参数的值也可执行存储
- 过程。
- OUTPUT:输出参数，此选项的值可以返回给调用存储过程的语句．
- ENCRYPTION:加密存储过程。
- RECOMPILE:指明该存储过程在运行时才编译，不预编译。
- EXECUTE_AS_ Clause:指定执行存储过程的安全上下文。
- FOR REPLICATION：不能在订阅服务器上执行为复制创建的存储过程。
- (sql_statement>语法块：存储过程执行的T-SQL语句。
- ``语法块：指定.NET Framework程序集的方法，以便CLR存储过程引用。

```java
--创建存储过程
CREATE PROC ProGetAuthors
AS
SELECT *
FROM authors
go
EXEC progetauthors
```

## 2.使用EXECUTE语句调用存储过程

语法格式。

[EXEC[UTE]]

{
[@return_status =]

(procedure_name [ ;number] I @procedure_name_ var

}
[[@parameter=] {value | @variable[OUTPUT] I [DEFAULT]]

[，…n]

[WITH RECOMPILE]

其中，大部分的参数与CREATE PROCEDURE的参数含义相同.

- @return_Btatus:是一个可选的整型变量，保存存储过程的返回状态。这个变量在用于EXECUTE语句前，必须在批处理、存储过程或函数中声明过。
- @procedure_name_ var:是局部定义变量名，代表存储过程名称。

## 3.创建带输入参数的存储过程

例在test数据库中创建—个名为procGetAvgMaxMin的存储过程．用于查询特定课程的考试成绩平均分、最高分和最低分。使用EXECUTE语句调用该存储过程查询“信息基础“的各项分数

```java
CREATE PROC procGetAvgMaxMin
            @course_name char (20)
AS
SELECT   AVG(exam)  AS 平均分,
         MAX(exam)  AS 最高分,
         MIN(exam)  AS 最低分
FROM       score AS s
INNER JOIN course AS c
       ON  s.cno=c.cno
WHERE      c.cname=@course_name
GO
/*调用存储过程procGeCAvgMaxMin．查询“信息基础”的各项分数*/
EXEC procGetAvgMaxMin  '信息基础'
```

## 4.给输入参数设置默认值

```java
CREATE PROC procGetAvgMaxMin
            @course_name char (20)=NULL
AS
IF @course_name IS NULL
    PRINT '请提供课程名称'
ELSE
SELECT   AVG(exam)  AS 平均分,
         MAX(exam)  AS 最高分,
         MIN(exam)  AS 最低分
FROM       score AS s
INNER JOIN course AS c
       ON  s.cno=c.cno
WHERE      c.cname=@course_name
GO
/*调用存储过程procGeCAvgMaxMin．查询“信息基础”的各项分数*/
EXEC procGetAvgMaxMin  '信息基础'
```

## 5.创建带输出参数的存储过程

```java
例   创建一个存储过程proc2，用于求指定数值的阶乘。
    CREATE PROC proc2
           @x int,
           @Y int OUTPUT  /*声明变量y为输出参数*/
    AS
    /*声明两个局部变量i和t，并为其分别赋值为*/
    DECLARE @i int,@t int
    SELECT @i=l,@t=l
    /*使用循环语句，计算x的阶乘t*/
    WHILE @i<@x
       BEGIN
         SELECT @t=@t*t@i
         SELECT @i=@i+l
       END
    /*将t的值，赋值给了输出参数y*/
    SELECT @y=@t
```

## 6.创建有多条SQL语句的存储过程

```java
例   创建一个存储过程proc3，能够查询特定课程的平均分、最高分和最低分，同时还能查询高于平均分的所有学生的信息。
CREATE PROC proc3
       @course_name char(20)
AS
DECLARE @avg_score int
/*下面的语句用于查询显示平均分，最高分和最低分*/
SELECT AVG(exam)  AS 平均分，
       MAX(exam)  AS 最高分．
       MINexam)   AS 最低分
INNER JOIN course AS C
      ON s.cno=c.cno
WHERE  c.cname=@course_name
/*下面的语句用于将考试成绩平均分赋值给变量@avg_score*/
SELECT   @avg_score =AVG(exam)
FROM    score AS S
INNER  JOIN course AS c
       ON  s.cno=c.cno
WHERE  c.cname=@course_name
/*下面的语句用于显示特定课程的分数高于平均分的学生信息*/
SELECT  st.sno, st.sname, st.depart, s.exam, s.usually
FROM    stu_info AS st
INNER JOIN score AS s
      ON   st.sno=s.sno
INNER JOIN course AS c
      ON s.cno=c.cno
WHERE  c.cname=@course_name
AND    s.exam>@avg_score
```
