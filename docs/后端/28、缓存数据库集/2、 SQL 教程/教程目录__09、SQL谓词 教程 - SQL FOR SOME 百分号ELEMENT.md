# 09、SQL谓词 教程 - SQL FOR SOME %ELEMENT
- 来源：https://ddkk.com/zhuanlan/db/sqlweici/9.html
- 分类：缓存数据库
- 分组：教程目录
将列表元素值或列表元素的数量与谓词匹配。

## 大纲

```java
FOR SOME %ELEMENT(field) [[AS] e-alias] (predicate)
```

## 参数

- field - 将其元素与谓词进行比较的标量表达式(最常见的是数据列)。
- AS e-alias - 可选-用于限定谓词中的%KEY或%VALUE的元素别名。通常，当谓词包含嵌套的FOR某些%ELEMENT条件时，会使用此别名。别名必须是有效的标识符。
- (predicate) - 用括号括起来的谓词条件。

在这个条件中，使用`%VALUE`和`/`或`%KEY`来确定条件匹配的是什么。

`%VALUE`匹配元素值(`%VALUE= ' Red '`)。

`%KEY`匹配元素的最小数目(`%KEY=2`)。

在此条件下，如果您指定了`e-alias`， `%VALUE`和`%KEY`可能是可选限定的。

这个谓词可以由多个带有`AND`和`OR`逻辑运算符的条件表达式组成。

## 描述

`FOR SOME %ELEMENT`谓词将字段中的列表元素与指定的谓词匹配。

`SOME`关键字指定字段中至少有一个元素必须满足指定的谓词子句。

谓词子句必须包含`%VALUE`或`%KEY`关键字，后跟谓词条件。

这些关键字不区分大小写。

下面的例子解释了`%VALUE`和`%KEY`的用法:

- (%VALUE=’Red’) 匹配所有包含值Red作为其列表元素之一的字段值。

该字段可以只包含单个元素`Red`，也可以包含多个元素，其中一个元素是`Red`。
- (%KEY=2)匹配所有包含至少2个元素的字段值。

字段可以包含两个元素，也可以包含两个以上的元素。

`%KEY`值必须为正整数。

`(%KEY=0)`不匹配任何字段值。

`FOR SOME %ELEMENT` 不能用于匹配为空的字段。

谓词子句可以使用任何谓词条件，而不仅仅是相等条件。以下是谓词子句的一些示例：

```java
(%VALUE='Red')
(%VALUE > 21)
(%VALUE %STARTSWITH 'R')
(%VALUE [ 'e')
(%VALUE IN ('Red','Blue')
(%VALUE IS NOT NULL)
(%KEY=3)
(%KEY > 1)
(%KEY IS NOT NULL)
```

注意:当在运行时提供谓词值时(使用`?`

输入参数或`:var`输入主机变量)，结果谓词`%STARTSWITH 'abc'`提供了比等价的结果谓词`'abc%'`更好的性能。

可以使用`AND`、`OR`和`NOT`逻辑操作符指定多个谓词条件。

IRIS将组合的谓词条件应用于每个元素。

因此，使用`AND`测试应用两个`%VALUE`或两个`%KEY`谓词是没有意义的。

例如，使用`For SOME %ELEMENT`匹配包含值`Red`、`Green`、`Red Green`、`Black Red`、`Green Yellow Red`、`Green Black`、`Yellow`或`Black Yellow`的字段:

- (%VALUE='Red')匹配任何包含元素Red: Red、Red Green、Black Red和Red Yellow Green的字段。
- (%VALUE='Red' OR %VALUE='Green')匹配任何包含其中一个元素(或同时包含两个元素，按任意顺序)的字段:Red, Green, Red Green, Black Red, Green Yellow Red, Green Black。

这在功能上与`(%VALUE IN('Red'，'Green'))`相同。
- (%VALUE='Red' AND %VALUE='Green')不匹配字段值，因为它同时匹配Red和Green的每个元素，并且没有元素可以同时拥有Red和Green的值。

此谓词不匹配双元素值`Red Green`。
- (%VALUE='Red' AND %KEY=2) 匹配 Red Green, Black Red, Green Yellow Red.
- (%value=‘Red’或%key=2)匹配Red, Red Green, Black Red, Green Yellow Red, Green Black, Black Yellow.

`FOR SOME %ELEMENT`是一个集合谓词。

它可以用于可以指定谓词条件的大多数上下文中，如本手册的谓词概述页面所述。

受以下限制:

- 不能在HAVING子句中使用FOR SOME %ELEMENT。
- 不能使用FOR SOME %ELEMENT作为为JOIN操作选择字段的谓词。
- 如果两个谓词引用不同表中的字段，则不能使用OR逻辑操作符将FOR SOME %ELEMENT与另一个谓词条件关联。

例如:

```java
WHERE FOR SOME %ELEMENT(t1.FavoriteColors) (%VALUE='purple') OR t2.Age < 65
```

因为此限制取决于优化器如何使用索引，所以SQL可能只在将索引添加到表时执行此限制。

强烈建议在所有查询中避免这种类型的逻辑。

- 在查询分片表时，不能使用FOR SOME %ELEMENT。

## Collection Index

`FOR SOME %ELEMENT`的一个重要用途是使用集合索引选择元素。

如果为字段定义了适当的`KEYS`或`ELEMENTS`索引， IRIS将使用该索引，而不是直接引用字段值元素。

如果定义了以下集合索引:

```java
 INDEX fcIDX1 ON FavoriteColors(ELEMENTS);
```

下面的查询使用了这个索引:

```java
SELECT Name,FavoriteColors FROM Sample.Person
WHERE FOR SOME %ELEMENT(FavoriteColors) (%VALUE='Red')
```

如果定义了以下集合索引:

```java
 INDEX fcIDX2 ON FavoriteColors(KEYS) [ Type = bitmap ];
```

下面的查询使用了这个索引:

```java
SELECT Name,FavoriteColors FROM Sample.Person
WHERE FOR SOME %ELEMENT(FavoriteColors) (%KEY=2)
```

## 示例

下面的示例使用`FOR SOME %ELEMENT`返回`FavoriteColors`列表中包含元素`'Red'`的那些行:

```java
SELECT Name,FavoriteColors
FROM Sample.Person
WHERE FOR SOME %ELEMENT(FavoriteColors) (%VALUE='Red')
```

在下面的示例中，`%VALUE`谓词包含一个`In`语句，该语句指定一个用逗号分隔的列表。

这个例子返回`FavoriteColors`列表中包含元素`'Red'`或元素`'Blue'`(或两者都包含)的那些行:

```java
SELECT Name,FavoriteColors
FROM Sample.Person
WHERE FOR SOME %ELEMENT(FavoriteColors) (%VALUE IN ('Red','Blue'))
```

下面的示例使用带有两个`Contains`操作符(`[`)的谓词子句。

它返回那些`FavoriteColors`列表中包含包含小写`'l'`和小写`'e'`的元素的行(`contains`操作符是大小写敏感的)。

在本例中，元素`“Blue”`、`“Yellow”`和`“Purple”`:

```java
SELECT Name,FavoriteColors AS Preferences
FROM Sample.Person
WHERE FOR SOME %ELEMENT(FavoriteColors) AS fc (fc.%VALUE [ 'l' AND fc.%VALUE [ 'e')
```

这个示例还演示了如何使用元素别名。

下面的动态SQL示例使用%KEY根据`FavoriteColors`中的元素数量返回行。

第一个`%Execute()`设置`%KEY=1`，返回所有包含一个或多个`FavoriteColors`元素的行。

第二个`%Execute()`设置`%KEY=2`，返回所有包含两个或更多`favoritecolor`元素的行:

```java
ClassMethod ForSomeElement()
{
	s q1 = "SELECT %ID,Name,FavoriteColors FROM Sample.Person "
	s q2 = "WHERE FOR SOME %ELEMENT(FavoriteColors) (%KEY=?)"
	s myquery = q1_q2
	s tStatement =class(%SQL.Statement).%New()
	s tStatement.%SelectMode=1
	s qStatus = tStatement.%Prepare(myquery)
	if qStatus'=1 {
		w "%Prepare failed:" 
		d $System.Status.DisplayError(qStatus) 
		q
	}
	s rset = tStatement.%Execute(1)
	d rset.%Display()
	w !,"End of data %KEY 1",!!
	s rset = tStatement.%Execute(2)
	d rset.%Display()
	w !,"End of data %KEY 2"
}
```
