# 23、SQL Server 基础 - 部分可编程对象
- 来源：https://ddkk.com/zhuanlan/db/sqlserver/1/23.html
- 分类：缓存数据库
- 分组：教程目录
## 变量

声明一个变量，则它可以在声明它的同一批处理语句中引用，因为SQL Server会将批处理中的语句编译成为单个可执行单元。

```java
DECLARE @i AS INT;
SET @i=10;
```

在SQL Server 2008以后，还可以直接这样写：

```java
DECLARE @i AS INT=10;
```

可以用标量表达式的结果赋值给符合数据类型的变量，这是很自然的。

```java
USE MyDB;
DECLARE @s_name AS NVARCHAR(20);
SET @s_name=(
            SELECT firstname+N' '+lastname
            FROM dbo.ok
            WHERE myid=1182
            );
SELECT @s_name AS '得到的单值';
```

如果满足条件的查询结果有多行，自然就会出错：

```java
USE MyDB;
DECLARE @s_name AS NVARCHAR(20);
SET @s_name=(
            SELECT firstname+N' '+lastname
            FROM dbo.ok
            WHERE Pid=1012  --满足这个条件的可是有多行
            );
SELECT @s_name AS '得到的单值';
```

不过SQL Server支持一种非标准的赋值SELECT语句：

```java
USE MyDB;
DECLARE @s_name AS NVARCHAR(20);
--下面是非标准的赋值SELECT语句
SELECT @s_name=firstname+N' '+lastname
FROM dbo.ok
WHERE Pid=1012; --满足这个条件的可是有多行
SELECT @s_name AS '得到的单值';
```

这个时候虽然有多行，但是每次查到一行满足条件的，都会去刷新那个变量值，所以不会出错，但也不能保证最后赋值进去的那个是自己想要的那个值，这依赖于SQL Server访问数据行的顺序。

从这个角度来看，SET实际上比这种非标准的赋值SELECT更安全。也就是宁可出错也不去用一个不能确保正确的值。

## 批处理

批处理语句将多条T-SQL语句作为一个可执行单元，要经历的阶段有：分析(语法检查)->解析(存在性、权限)->优化(作为执行单元)。

### 作为语法分析的单元

如果批处理单元中存在语法错误，整个批处理都不会提交到SQL Server执行，批处理之间可以用GO隔开。在使用时，不同的批处理不互相影响。

并且，变量只能在声明它的批处理中被使用：

```java
PRINT @i;
GO
DECLARE @i AS INT=10;
PRINT @i+1;
GO
PRINT @i+2;
```

### 不能在同一批处理中编译的语句

有些语句必须单独放到一个批处理中，之前学表表达式时，创建视图的时候就出现了这样的问题。这样的语句有：

```java
CREATE DEFAULT
CREATE FUNCTION
CREATE PROCEDURE
CREATE RULE
CREATE SCHEMA
CREATE TRIGGER
CREATE VIEW
```

必须用GO和旁边的其它语句隔开。

### 作为语句解析的单元

批处理作为语句解析的单元，如果对数据对象的架构进行修改，并在同一批处理中使用这些修改时，SQL Server可能还不知道架构定义发生了变化(因为在解析这条语句时，前面那条修改架构的还没有被执行)。

```java
USE MyDB;
ALTER TABLE dbo.ji1 ADD newcol INT;
SELECT myint,mychar,mychar2,newcol FROM dbo.ji1;--在解析这句时,前面那句还没执行
```

解决方法还是放到两个批处理中去，按顺序解析执行。

```java
USE MyDB;
ALTER TABLE dbo.ji1 ADD newcol INT;
GO
SELECT myint,mychar,mychar2,newcol FROM dbo.ji1;--与前面那句已经是两个批处理块
```

### GO n选项

从SQL Server 2005开始对GO就进行了增强，可以带一个数字表示GO之前的批处理将执行指定的次数。

```java
DECLARE @i AS INT=6;
PRINT @i;
GO 3
```

GO是一个客户端命令，而不是服务器端的T-SQL命令，所以无论连接到的数据库引擎版本是什么，只要客户端工具是SQL Server 2005以上的就可以使用GO n了。

## 流程控制元素

判断条件实际上是不用加括号的，我习惯加上括号，看起来更清楚(改变优先级的时候肯定要加吧)，也是向其它语言看齐。

### IF-ELSE

只要注意下三值逻辑，当为FALSE或者UNKNOWN时都会进入ELSE块里。

```java
DECLARE @i AS INT=5;
IF(@i>5)
SET @i=7;
ELSE
    IF(@i<3)
        SET @i=1;
    ELSE
        SET @i=4;
PRINT @i;
```

如果要一个块里多条语句，就像C++里面加括号那样，这里用BEGIN-END：

```java
DECLARE @i AS INT=5;
IF(@i>5)
    BEGIN
        SET @i=@i+1;
        PRINT @i+1;
    END
ELSE
    BEGIN
        SET @i=@i-1;
        PRINT @i-1;
    END
```

### WHILE

WHILE也是只接受TRUE的，FALSE和UNKNOWN都会让循环终止。

```java
DECLARE @i AS INT=1;
WHILE(@i<=10)
    BEGIN
        PRINT @i;
        SET @i=@i+1;
    END
```

BREAK和CONTINUE在SQL里也是有的。

```java
DECLARE @i AS INT=1;
WHILE(@i<=10)
    BEGIN
        IF(@i=6)
            BREAK;--跳出
        PRINT @i;
        SET @i=@i+1;
    END
```

```java
DECLARE @i AS INT=1;
WHILE(@i<=10)
    BEGIN
        IF(@i=6)
            BEGIN
                SET @i=@i+1;
                CONTINUE;--跳过
            END
        PRINT @i;
        SET @i=@i+1;
    END
```

## 用户自定义函数

例程是为了计算结果或执行任务而对代码进行封装的一种编程对象。本节只学用户自定义函数，除此之外还有存储过程和触发器，后面再学。

```java
USE MyDB;
IF OBJECT_ID('dbo.fn_cat') IS NOT NULL
    DROP FUNCTION dbo.fn_cat;
GO
CREATE FUNCTION dbo.fn_cat
(
    @s1 AS NVARCHAR(10),
    @s2 AS NVARCHAR(20)
)
RETURNS NVARCHAR(21)
AS
    BEGIN
        RETURN @s1+N'-'+@s2;
    END;
```

然后就可以使用了：

```java
SELECT
    dbo.fn_cat(firstname,lastname) AS CAT
FROM dbo.ok;
```
