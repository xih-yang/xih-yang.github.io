# 21、SQL Server 基础 - 四种表表达式的基本使用
- 来源：https://ddkk.com/zhuanlan/db/sqlserver/1/21.html
- 分类：缓存数据库
- 分组：教程目录
表表达式通过模块化的方式简化问题的解决方案，好处体现在逻辑上而不是性能上。

## 派生表

在外部查询的FROM子句中定义，存在范围仅为定义它的外部查询。

```java
USE MyDB;
SELECT *
FROM(
    SELECT num,firstname
    FROM dbo.ok
    WHERE num>72
    ) AS nu_fi;
```

### 分配列别名

因为不能在逻辑处理顺序先于SELECT子句的其它查询子句中(如WHERE和GROUP BY)对SELECT子句分配的列别名引用，故可利用外部查询的任何子句都可以引用在内部查询的SELECT子句中分配的列别名。

```java
USE MyDB;
--orderyear是内部查询SELECT里定义的别名,COUNT(DISTINCT计算不重复结果数目
SELECT orderyear,COUNT(DISTINCT myid) AS numid
FROM(
    SELECT YEAR(mydate) AS orderyear,myid
    FROM dbo.ok
    ) AS nei
GROUP BY orderyear;--外部查询的任何子句即便先于外SELECT也可以用这个别名
```

### 使用参数

定义派生表的查询中可以使用参数。

```java
DECLARE @can AS INT;
SET @can=72;    --2008以后可以直接DECLARE @can AS INT=72
USE MyDB;
SELECT *
FROM(
    SELECT num,firstname
    FROM dbo.ok
    WHERE num>@can  --使用参数
    ) AS nu_fi;
```

### 嵌套

如果要用本身就定义了派生表的查询去定义派生表，得到的就是嵌套派生表。因为派生表在FROM子句中定义，而不是单独定义，所以会产生嵌套，嵌套使代码难读。

### 派生表的多引用

还是因为派生表在外部查询的FROM子句中定义，逻辑优先顺序并不优先于外部查询，所以对外部查询FROM子句进行处理时派生表并不存在，不能使用同一派生表的多个实例。

可以看到LEFT JOIN前后都是一样的派生表，但是要用两个实例呢。

```java
USE MyDB;
SELECT
    Cur.orderyear AS 这年,
    Cur.sume AS 这年总数,
    Prv.sume AS 去年总数,
    Cur.sume-Prv.sume AS 增长数
FROM(
    SELECT YEAR(mydate) AS orderyear,
    SUM(CAST(num AS INT)) AS sume
    FROM dbo.ok
    GROUP BY YEAR(mydate)
    ) AS Cur
    LEFT JOIN
    (
    SELECT YEAR(mydate) AS orderyear,
    SUM(CAST(num AS INT)) AS sume
    FROM dbo.ok
    GROUP BY YEAR(mydate)
    ) AS Prv
    ON Cur.orderyear=Prv.orderyear+1; --相差1年
```

## 公用表表达式(CTE)

CTE先定义，再查询，可以一次定义多个，而且可以使用前面定义好的CTE而不用语法嵌套：

```java
USE MyDB;
WITH C1 AS
(
    SELECT YEAR(mydate) AS orderyear,num
    FROM dbo.ok
),
C2 AS
(
    SELECT orderyear,SUM(CAST(num AS INT)) AS sume
    FROM C1
    GROUP BY orderyear
)
SELECT orderyear,sume
FROM C2
WHERE sume >10;
```

### CTE的多引用

因为先定义再使用，所以可以引用同一个CTE的多个实例。

```java
USE MyDB;
WITH tongyige AS
(
    SELECT YEAR(mydate) AS orderyear,
    SUM(CAST(num AS INT)) AS sume
    FROM dbo.ok
    GROUP BY YEAR(mydate)
)
SELECT
    Cur.orderyear AS 这年,
    Cur.sume AS 这年总数,
    Prv.sume AS 去年总数,
    Cur.sume-Prv.sume AS 增长数
FROM
    tongyige AS Cur
LEFT JOIN 
    tongyige AS Prv
ON Cur.orderyear=Prv.orderyear+1;
```

视图和内联表值函数(inline TVF)都是可重用的表表达式，其定义存储在数据库对象中。

## 视图

```java
USE MyDB;
IF OBJECT_ID('dbo.view1') IS NOT NULL
    DROP VIEW dbo.view1;
--GO前面的如有报错还会执行GO后面的语句
GO
CREATE VIEW dbo.view1
AS
    SELECT
        firstname,lastname
    FROM dbo.ok
    WHERE Pid IS NOT NULL;
```

可以像查询数据库中的其它表一样查询视图。视图可以理解成对现有的表的一种视角，整合到一张表里，方便我们从某些角度去观察和使用。

```java
SELECT *
FROM dbo.view1;
```

用完不妨删除它：

```java
IF OBJECT_ID('dbo.view1') IS NOT NULL
    DROP VIEW dbo.view1;
```

## 内联表值函数(inline TVF)

内联TVF还能支持输入参数，其它方面和视图相似，所以可以看成参数化的视图。

```java
USE MyDB;
IF OBJECT_ID('dbo.fn_GetById') IS NOT NULL
    DROP FUNCTION dbo.fn_GetById;
GO
CREATE FUNCTION dbo.fn_GetById
    (@id AS INT) RETURNS TABLE  --指定接受的参数类型和名称
AS
RETURN  --指定返回的表
    SELECT *
    FROM dbo.ok
    WHERE @id=myid; --在这里用到了参数作相等性比较
```

查询一下TVF，要提供参数：

```java
SELECT *
FROM dbo.fn_GetById(1034) AS CO; --为表表达式指定别名是好习惯
```

用完不妨删除它：

```java
IF OBJECT_ID('dbo.fn_GetById') IS NOT NULL
    DROP FUNCTION dbo.fn_GetById;
```

还有一些高级的用法，递归CTE、视图-ORDER BY等以后再详学。
