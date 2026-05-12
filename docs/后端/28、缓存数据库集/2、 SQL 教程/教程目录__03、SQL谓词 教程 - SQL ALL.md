# 03、SQL谓词 教程 - SQL ALL
- 来源：https://ddkk.com/zhuanlan/db/sqlweici/3.html
- 分类：缓存数据库
- 分组：教程目录
将值与子查询中的所有对应值匹配。

## 大纲

```java
scalar-expression comparison-operator ALL (subquery)
```

## 参数

- scalar-expression - 将其值与子查询生成的结果集进行比较的标量表达式(最常见的是数据列)。
- comparison-operator - 以下比较操作符之一:=(等于)，`<>`或!=(不等于)，``=(大于或等于)，[(包含)，或](跟随)。
- subquery - 一个用括号括起来的子查询，它从单个列返回一个结果集，用于与标量表达式进行比较。

## 描述

`ALL`关键字与比较操作符一起创建谓词(量化比较条件)，如果标量表达式的值与子查询检索到的所有对应值匹配，则该谓词为真。

`ALL`谓词将单个标量表达式项与单个子查询`SELECT`项进行比较。

具有多个选择项的子查询将生成`SQLCODE -10`错误。

`ALL`可以在任何可以指定谓词条件的地方使用，如本手册的谓词概述页面所述。

在适用的情况下，系统自动对`ALL`子查询应用集值子查询优化(`SVSO`)。

## 示例

下面的示例选择了`Person`数据库中小于`Employee`数据库中所有年龄的年龄:

```java
SELECT DISTINCT Age FROM Sample.Person
WHERE Age < ALL
   (SELECT Age FROM Sample.Employee)
ORDER BY Age
```

下面的示例选择`Person`数据库中比`Employee`数据库中所有名称更长或更短的名称:

```java
SELECT $LENGTH(Name) AS NameLength,Name FROM Sample.Person
WHERE $LENGTH(Name) > ALL
     (SELECT $LENGTH(Name) FROM Sample.Employee)
OR $LENGTH(Name) < ALL
     (SELECT $LENGTH(Name) FROM Sample.Employee)
```

下面的示例返回密西西比河以西的州的列表，所有州都不包含拥有经理或董事头衔的员工:

```java
SELECT DISTINCT State
FROM Sample.USZipCode
WHERE Longitude < -93
  AND State != ALL
   (SELECT Home_State FROM Sample.Employee
    WHERE Title [ 'Manager' OR Title [ 'Director')
ORDER BY State
```
