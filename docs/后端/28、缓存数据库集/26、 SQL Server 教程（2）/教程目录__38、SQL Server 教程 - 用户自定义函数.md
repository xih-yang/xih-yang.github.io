# 38、SQL Server 教程 - 用户自定义函数
- 来源：https://ddkk.com/zhuanlan/db/sqlserver/2/38.html
- 分类：缓存数据库
- 分组：教程目录
## CREATE FUNCTION (Transact-SQL)

[https://docs.microsoft.com/zh-cn/sql/t-sql/statements/create-function-transact-sql?view=sql-server-ver15](https://docs.microsoft.com/zh-cn/sql/t-sql/statements/create-function-transact-sql?view=sql-server-ver15)

```java
-- Transact-SQL Scalar Function Syntax
CREATE [ OR ALTER ] FUNCTION [ schema_name. ] function_name
( [ { @parameter_name [ AS ][ type_schema_name. ] parameter_data_type
 [ = default ] [ READONLY ] }
    [ ,...n ]
  ]
)
RETURNS return_data_type
    [ WITH <function_option> [ ,...n ] ]
    [ AS ]
    BEGIN
        function_body
        RETURN scalar_expression
    END
[ ; ]
```

## 1.创建使用标量函数

```java
例    创建一个用户定义函数funcGetAge，功能为可以根据出生日期和当前日期计算年龄，并将年龄返回给调用语句。
    CREATE FUNCTION funcGetAge
    /*声明了两个变量，分别用于存放出生日期和当前日期*/
    (@birth_date datetime,@now_date datetime)
/*指定返回值类型为int型*/
RETURNS int
AS
BEGIN
    RETURN(DATEDIFF(year，@birth_date，@now_date)）    /*返回计算结果*/
END
  SELECT 姓名,dbo.funcGetAge(出生日期，GETDATE()) AS 年龄
  FROM student
  ORDER BY 年龄 DESC
```

## 2.创建使用表值函数

### (1)．内嵌函数

如果RETURN子句指定的TABLE不附带字段列表，则该函数为内嵌函数。这种类型的函数由单个SELECT语句定义。该函数返回的表的字段（包括数据类型）来自定义该函数的SELECT语句的字段列表。

```java
例    创建一个用户定义函数funcGetStuDepa，功能为根据传递来的院系名称，将指定院系的所有学生的信息，以表的形式返回给调用程序。
    CREATE FUNCTION funcGetStuDepa
       (@depa_name   char(20))
    RETURNS TABLE
    AS
    RETURN (SELECT *
            FROM  student
            WHERE 所属院系=@depa_name
           )
```

### ( 2)．多语句函数

如果RETURNS子句指定的TABLE类型带有字段及其数据类型，则该函数是多语句表值函数。多语句函数的主体中允许使用多种语句。下面列出允许使用的语句，除下面列出的语句以外，不能在函数主体中使用其他语句。

- 赋值语句。
- 控制流语句。
- DECLARE语句，该语句定义函数局部的数据变量和游标。．
- SELECT语句，该语句包含带有表达式的选择列表，其中的表达式将值赋予函数的局 部变量。
- 游标操作，该操作引用在函数中声明、打开、关闭和释放的局部游标。只允许使用以INTO子句向局部变量赋值的FETCH语句：不允许使用将数据返回到客户端的 FETCH语句。
- INSERT、UPDATE、DELETE语句，这些语句修改函数的局部table类型的变量。
- 调用存储过程的EXECUTE语句。

```java
例    ]创建一个用户定义函数funcGetStuScore，功能为根据传递来的学生姓名，将其所有课程的考试成绩返回给调用程序。
CREATE FUNCTION funcGetStuScore
    (@stu_name  char (20 J)
RETURNS @temp TABLE
    (
     姓名     char{20)，
     课名     char (20)．
     平时成绩 int，
     考试成绩 int
    )
AS
BEGIN
  /*下面的语句将SELECT语句的查询结果，插入到临时表变量@temp中*/
  INSERT INTO @temp
  SELECT st．姓名，c．课名，s.平时成绩，s.考试成绩
  FROM  student AS st
  INNER JOIN score AS S
        ON  st.学号=s．学号
  INNER JOIN course AS C
        ON  c．课号=s．课号
  WHERE st．姓名=@stu_name
  ORDER BY s．考试成绩  DESC
RETURN  /*将临时表变@temp的结果返回给调用语句*/
END
```

## 3.查看与修改用户自定义函数

查看用户自定义函数的定义存放在sys.sql_modules视图中，在sys.sql_modules中就可以查看到所有用户自定义的函数了。

修改用户自定义函数使用的是ALTER FUNCTION语句，其他的语法与创建用户自定义函数一样。

## 4.删除用户自定义函数

## DROP FUNCTION (Transact-SQL)

```java
-- SQL Server, Azure SQL Database 
DROP FUNCTION [ IF EXISTS ] { [ schema_name. ] function_name } [ ,...n ]   
[;]
```

例如，删除用户定义函数func1的语句为：

DROP FUNCTION funcl
