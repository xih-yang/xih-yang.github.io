# 07、SQL谓词 教程 - SQL %FIND
- 来源：https://ddkk.com/zhuanlan/db/sqlweici/7.html
- 分类：缓存数据库
- 分组：教程目录
使用位图块迭代将一个值匹配到一组生成的值。

## 大纲

```java
scalar-expression %FIND valueset [SIZE ((nn))]
```

## 参数

- scalar-expression - 一个标量表达式(最常见的是表的RowId字段)，它的值正在与值集进行比较。
- valueset - 对用户定义对象的对象引用(oref)，该对象实现位图块迭代方法和ContainsItem()方法。

该方法接受一组数据值，并在与标量表达式中的值匹配时返回一个布尔值。
- SIZE ((nn)) - 可选-用于查询优化的数量级整数(10、100、1000等)。

## 描述

通过选择与值集中指定的值相匹配的数据值，通过迭代位图块序列中的值，`%FIND`谓词允许筛选结果集。

当标量表达式的值与`valueset`中的值匹配时，此匹配将成功。

如果值集值不匹配任何标量表达式值，`%FIND`返回空字符串。

无论显示模式如何，这个匹配总是在逻辑(内部存储)数据值上执行。

`%FIND`和其他比较条件一样，用于`SELECT`语句的`WHERE`子句或`HAVING`子句中。

`%FIND`使用抽象的、通过编程指定的匹配值集来过滤字段值。

具体来说，它使用抽象的、编程指定的位图来过滤`RowId`字段值，其中的值集行为类似于位图索引的下标层。

用户定义类派生自抽象类`%SQL.AbstractFind`。

这个抽象类定义了`ContainsItem()`布尔方法。

`ContainsItem()`方法将标量表达式值与值集值匹配。

使用以下三种方法对位图块序列中的值进行迭代:

- GetChunk(c)，返回块编号为c的位图块。
- NextChunk(.c)，它返回第一个块编号为>` c的位图块。
- PreviousChunk(.c)，返回第一个块号`< c的位图块。

## 排序类型

`%FIND`使用与它匹配的列相同的排序规则类型。

默认情况下，字符串数据类型字段是用`SQLUPPER`排序规则定义的，它不区分大小写。

## SIZE子句

可选的`%FIND SIZE`子句提供整数`nn`，它指定`valueset`中值数量的数量级估计数。

IRIS使用这个数量级估计来确定最佳查询计划。

指定`nn`为以下文字之一:`10`、`100`、`1000`、`10000`，等等。

因为`nn`必须在编译时作为常量值可用，所以在所有SQL代码中必须将其指定为文字。

注意，必须为所有SQL指定嵌套括号，嵌入式SQL除外。

## %FIND和%INSET比较

- INSET是最简单和最通用的接口。

它支持`ContainsItem()`方法。
- %FIND支持使用位图索引对位图块进行迭代。

它模拟了ObjectScript `$ORDER`函数的功能，支持`NextChunk()`、`PreviousChunk()`和`GetChunk()`迭代方法，以及`ContainsItem()`方法。
