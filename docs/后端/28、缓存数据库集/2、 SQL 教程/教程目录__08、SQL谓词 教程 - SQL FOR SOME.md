# 08、SQL谓词 教程 - SQL FOR SOME
- 来源：https://ddkk.com/zhuanlan/db/sqlweici/8.html
- 分类：缓存数据库
- 分组：教程目录
确定是否根据字段值的条件测试返回记录。

## 大纲

```java
FOR SOME (table [AS t-alias]) (fieldcondition)
```

## 参数

- table - Table可以是单个表，也可以是用逗号分隔的表列表。

括号是必须的。
- AS t-alias - 可选-前一个表名的别名。

别名必须是有效的标识符;

它可以是一个分隔符。
- fieldcondition - fieldcondition 指定一个或多个引用一个或多个字段的条件表达式。

字段条件用括号括起来。

可以使用`AND(&)`和`OR(!)`逻辑操作符在字段条件中指定多个条件表达式。

## 描述

`FOR SOME`谓词允许根据表中一个或多个字段值的布尔条件测试来决定是否返回记录。

如果`fieldcondition`计算结果为`true`，则返回记录。

如果`fieldcondition`计算结果为`false`，则不返回记录。

对于表(及其可选的`t-alias`)参数，必须使用括号分隔。

分隔括号对于字段条件参数也是强制性的。

允许(但不是必需的)在这两组括号之间使用空格。

通常，`FOR SOME`用于确定是否根据另一个表中一条记录的内容从一个表返回一条记录。

`FOR SOME`还可用于确定是否根据同一表中记录的内容从表中返回记录。

在后一种情况下，要么返回所有记录，要么不返回任何记录。

在下面的示例中，`For Some`返回`Sample.Person`表中其`Name`字段值与`Sample.Employee`表中的`Name`字段值匹配的所有记录：

```java
SELECT Name,COUNT(Name) AS NameCount
FROM Sample.Person AS p
WHERE FOR SOME (Sample.Employee AS e)(e.Name=p.Name)
ORDER BY Name
```

在下面的示例中，`FOR`根据同一表的布尔测试返回`Sample.Person`表中的某些记录。如果至少有一条记录的年龄值大于`65`，此程序将返回所有`Sample.Person`记录。否则，它不返回任何记录。由于`Sample.Person`中至少有一条记录的年龄字段值大于65，因此将返回所有`Sample.Person`记录：

```java
SELECT Name,Age,COUNT(Name) AS NameCount
FROM Sample.Person
WHERE FOR SOME (Sample.Person)(Age>65)
ORDER BY Age
```

与大多数谓词一样，可以使用NOT逻辑运算符对某些谓词进行倒置，如下例所示：

```java
SELECT Name,Age,COUNT(Name) AS NameCount
FROM Sample.Person
WHERE NOT FOR SOME (Sample.Person)(Age>65)
ORDER BY Age
```

## 复合条件

一个字段条件可以包含多个条件表达式。这组条件包含在圆括号中。使用逻辑运算符`AND`和`OR`指定多个条件，这些条件也可以使用

```java
SELECT Name,COUNT(Name) AS NameCount
FROM Sample.Person AS p
WHERE FOR SOME (Sample.Employee AS e)(e.Name=p.Name AND p.Name %STARTSWITH 'A')
ORDER BY Name
```

```java
SELECT Name,COUNT(Name) AS NameCount
FROM Sample.Person AS p
WHERE FOR SOME (Sample.Employee AS e)(e.Name=p.Name OR  p.Name %STARTSWITH 'A')
ORDER BY Name
```

在以下示例中，对于某些记录，返回`Sample.Person`表中其`Name`字段值与`Sample.Employee`表中的`Name`字段值匹配，并且其住所(`Home_State`)与其办公室(`Office_State`)处于相同状态的所有记录：

```java
SELECT Name,Home_State,COUNT(Name) AS NameCount
FROM Sample.Person AS p
WHERE FOR SOME (Sample.Employee AS e)(p.Name=e.Name AND p.Home_State=e.Office_State)
ORDER BY Name
```

## 多个表

可以在字段条件之前以逗号分隔的列表形式指定多个表。

确定是否返回记录的条件可以引用从中选择数据的表，也可以引用另一个表中的字段值。

表别名通常需要将每个指定的字段与其表关联起来。

在下面的示例中，如果`Sample.Person`表中至少有一个名称也在`Sample.Employee`表中，则返回所有记录。由于至少有一条记录满足此条件，因此将返回所有`Sample.Person`记录：

```java
SELECT Name AS PersonName,Age,COUNT(Name) AS NameCount
FROM Sample.Person
WHERE FOR SOME (Sample.Employee AS e,Sample.Person AS p) (e.Name=p.Name)
ORDER BY Name
```

在下面的示例中，如果`Sample.Person`表中至少有一个名称也在`Sample.Company`表中找到，则返回所有记录。由于人名和公司名(在此数据集中)从不相同，因此此条件不适用于任何记录。因此，不返回`Sample.Person`记录：

```java
SELECT Name AS PersonName,Age,COUNT(Name) AS NameCount
FROM Sample.Person
WHERE FOR SOME (Sample.Company AS c,Sample.Person AS p) (c.Name=p.Name)
ORDER BY Name
```
