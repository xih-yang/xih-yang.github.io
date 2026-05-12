# 06、SQL谓词 教程 - SQL EXISTS
- 来源：https://ddkk.com/zhuanlan/db/sqlweici/6.html
- 分类：缓存数据库
- 分组：教程目录
检查表中是否至少存在一个对应行。

## 大纲

```java
EXISTS select-statement
```

## 参数

- select-statement - 一种简单的查询，通常包含一个条件表达式。

## 描述

`EXISTS`谓词测试指定的表，通常至少测试一行是否存在。

因为`EXISTS`后面的`SELECT`语句正在被检查是否包含某些内容，所以子句通常是这样的形式:

```java
EXISTS (SELECT... FROM... WHERE...)
```

```java
SELECT name
     FROM Table_A
     WHERE EXISTS
     (SELECT *
          FROM Table_B
          WHERE Table_B.Number = Table_A.Number)
```

在本例中，谓词测试子查询指定的一行或多行是否存在。

注意，测试必须发生在`SELECT`语句上(而不是在`UNION`上)。

`NOT EXISTS`子句测试表中是否有一行不存在，如下例所示:

```java
SELECT EmployeeName,Age
     FROM Employees
     WHERE NOT EXISTS (SELECT * FROM BonusTable
     WHERE NOT (BonusTable.Result = 'Positive'
     AND Employees.EmployeeNum = BonusTable.EmployeeNum))
```

`EXISTS`可以在任何可以指定谓词条件的地方使用，如本手册的谓词概述页面所述。

在适用的情况下，系统自动对存在或不存在的子查询应用集值子查询优化(`SVSO`)。
