# 12、SQL谓词 教程 - SQL %INSET
- 来源：https://ddkk.com/zhuanlan/db/sqlweici/12.html
- 分类：缓存数据库
- 分组：教程目录
将一个值匹配到一组生成的值。

## 大纲

```java
scalar-expression %INSET valueset [SIZE ((nn))]
```

## 参数

- scalar-expression - 一个标量表达式(最常见的是表的RowId字段)，它的值正在与值集进行比较。
- valueset - 对实现ContainsItem()方法的用户定义对象的对象引用(oref)。

该方法接受一组数据值，并在与标量表达式中的值匹配时返回一个布尔值。
- SIZE ((nn)) - 可选-用于查询优化的数量级整数(10、100、1000等)。

## 描述

`%INSET`谓词允许通过选择与值集中指定的值相匹配的数据值来筛选结果集。

当标量表达式的值与`valueset`中的值匹配时，此匹配将成功。

如果值集值不匹配任何标量表达式值，%INSET返回空字符串。

无论显示模式如何，这个匹配总是在逻辑(内部存储)数据值上执行。

对于`NULL`值，`%INSET`永远不为真。

因此，它不会将标量表达式中的`NULL`与值集中的`NULL`相匹配。

与其他比较条件一样，`%INSET`用于`SELECT`语句的`WHERE`子句或`HAVING`子句中。

`%INSET`启用使用抽象的、编程指定的匹配值集过滤字段值。

具体地说，它使用抽象的、编程指定的临时文件或位图索引来过滤RowId字段值，其中的值集行为类似于位图索引或常规索引的最低下标层。

用户定义的类派生自抽象类`%SQL.AbstractFind`。此抽象类定义`ContainsItem()`方法，该方法是`%inset`唯一支持的方法。`ContainsItem()`方法返回值集。

## 排序类型

`%INSET`使用与它匹配的列相同的排序规则类型。

默认情况下，字符串数据类型字段是用`SQLUPPER`排序规则定义的，它不区分大小写。

如果为列分配不同的排序规则类型，则还必须将此排序规则类型应用于`%INSET`子字符串。

## Size子句

可选的`%INSET SIZE`子句提供整数`nn`，它指定`valueset`中值数量的数量级估计值。

IRIS使用这个数量级估计来确定最佳查询计划。

指定`nn`为以下文字之一:`10、100、1000、10000`，等等。

因为`nn`必须在编译时作为常量值可用，所以在所有SQL代码中必须将其指定为文字。

注意，必须为所有SQL指定嵌套括号，嵌入式SQL除外。

## %INSET和%FIND比较

- INSET是最简单和最通用的接口。

它支持`ContainsItem()`方法。
- %FIND支持使用位图索引对位图块进行迭代。

它模拟了ObjectScript `$ORDER`函数的功能，支持`NextChunk()`、`PreviousChunk()`和`GetChunk()`迭代方法，以及`ContainsItem()`方法。
