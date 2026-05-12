# 16、SQL谓词 教程 - SQL %MATCHES
- 来源：https://ddkk.com/zhuanlan/db/sqlweici/16.html
- 分类：缓存数据库
- 分组：教程目录
用包含字面值、通配符和范围的模式字符串匹配值。

## 大纲

```java
scalar-expression %MATCHES pattern [ESCAPE char]
```

## 参数

- scalar-expression - 一个标量表达式(最常见的是数据列)，它的值正在与模式进行比较。
- pattern - 一个带引号的字符串，表示要与标量表达式中的每个值匹配的字符模式。

模式字符串可以包含文字字符，问号(`?`)和星号(`*`)通配符，方括号用于指定允许的值，反斜杠(`\`)用于指定紧跟其后的字符被视为文字。

模式也可以是空字符串或`NULL`，尽管它不匹配或返回`NULL`项。
- ESCAPE char - 可选-包含单个字符的字符串。

这个字符字符可以在模式中用于指定紧跟在它后面的字符将被视为文字。

如果未指定，默认转义字符是反斜杠(`\`)。

## 描述

`%MATCHES`谓词是 IRIS扩展，用于将值匹配到模式字符串。

`%MATCHES`返回`True`或`False`用于匹配操作。

模式字符串可以由字面量字符、通配符字符和匹配字面量的列表或范围组成。

模式匹配区分大小写。

模式匹配基于标量表达式的`EXACT`值，而不是它的排序规则值。

因此，`%MATCHES`操作始终是大小写敏感的，即使标量表达式的排序规则类型不区分大小写。

`%MATCHES`支持以下模式通配符:

- ? - 匹配任意类型的任意单个字符。
- - 匹配零个或多个任意类型的字符。

[abc] - 匹配括号中指定的任意一个字符。
[a-z] - 匹配括号中指定的范围内的字符，包括指定的字符。
[^A-Z] [^a-z] [^0–9] - 这些范围匹配括号中指定的字符以外的任何字符。

可以使用此语法不指定大写字母、小写字母或数字。

只支持显示的指定文字范围。
\ - 将后面的字符视为文字字符，而不是通配符。

反斜杠是默认的转义字符;

可以使用可选的escape子句指定另一个字符作为转义字符。

与大多数谓词一样，`%MATCHES`可以使用`NOT`操作符`:item NOT %MATCHES pattern`进行反转。

`%MATCHES`和`NOT %MATCHES`都不能返回空字段。

返回`NULL`字段使用`IS NULL`。

反斜杠(`\`)字符是默认的转义字符。

它可以用来指定在指定的模式位置将通配符用作文本匹配。

例如，要匹配一个问号作为字符串的第一个字符，请指定`'\?*'`。

要匹配问号作为字符串的第四个字符，请指定`'?? \?*'`。

要匹配字符串中的任何地方的问号，请指定`'*\?*'`。

要匹配只包含星号字符的字符串，请指定`'\*'`。

要匹配至少包含一个星号字符的字符串，请指定`'*\**'`。

要匹配字符串中的反斜杠字符，请指定`'*\\*'`。

支持`%MATCHES`是为了与`Informix SQL`兼容。

## %SelectMode

`%MATCHES`谓词不使用当前的`%SelectMode`设置。

应该以逻辑格式指定模式，无论`%SelectMode`设置如何。

尝试以ODBC格式或`Display`格式指定模式通常会导致没有数据匹配或意外的数据匹配。

可以使用`%EXTERNAL`或`%ODBCOUT`格式转换函数来转换谓词操作的标量表达式字段。

这允许以`Display`格式或ODBC格式指定模式。

但是，使用格式转换函数会阻止对字段使用索引，因此会对性能产生重大影响。

在下面的动态SQL示例中，`%MATCHES`谓词以逻辑格式指定日期模式，而不是`%SelectMode=1` (ODBC)格式。

从`41`开始的逻辑值(日期从`1953年4月4日`(`$HOROLOG 41000`)到`1955年12月28日`(`$HOROLOG 41999`))被选中:

```java
ClassMethod Matches()
{
	s q1 = "SELECT Name,DOB FROM Sample.Person "
	s q2 = "WHERE DOB %MATCHES '41*'"
	s myquery = q1_q2
	s tStatement =class(%SQL.Statement).%New()
	s tStatement.%SelectMode=1
	s qStatus = tStatement.%Prepare(myquery)
	if qStatus'=1 {
		w "%Prepare failed:" 
		d $System.Status.DisplayError(qStatus) 
		q
	}
	s rset = tStatement.%Execute()
	d rset.%Display()
	w !,"End of data"
}
```

```java
DHC-APP>dclass(PHA.TEST.SQLCommand).Matches()
Name    DOB
Houseman,Martin D.      1955-09-25
Ingrahm,Yan S.  1954-06-15
Smith,Elvis Y.  1955-06-29
Ng,Liza Z.      1955-10-05
Zweifelhofer,Zelda J.   1954-02-19
Zampitello,Josephine Q. 1953-08-14
Hertz,Uma C.    1954-07-25
Davis,Jane E.   1953-07-28
Vanzetti,Alexandra O.   1953-12-29
9 Rows(s) Affected
End of data
```

下面的动态SQL示例使用`%ODBCOUT`格式转换函数来转换谓词匹配的`DOB`字段。

这允许以ODBC格式指定`%MATCHES`模式。

它选择`DOB`字段`ODBC`值以`195`开头的行(日期范围从`1950`年到`1959`年)。

但是，指定格式转换函数会阻止对`DOB`字段值使用索引:

```java
ClassMethod Matches1()
{
	s q1 = "SELECT Name,DOB FROM Sample.Person "
	s q2 = "WHERE %ODBCOUT(DOB) %MATCHES '195*'"
	s myquery = q1_q2
	s tStatement =class(%SQL.Statement).%New()
	s tStatement.%SelectMode=1
	s qStatus = tStatement.%Prepare(myquery)
	if qStatus'=1 {
		w "%Prepare failed:" 
		d $System.Status.DisplayError(qStatus) 
		q
	}
	s rset = tStatement.%Execute()
	d rset.%Display()
	w !,"End of data"
}
```

```java
DHC-APP>dclass(PHA.TEST.SQLCommand).Matches1()
Name    DOB
Houseman,Martin D.      1955-09-25
Ingrahm,Yan S.  1954-06-15
Smith,Elvis Y.  1955-06-29
Gore,Alfred M.  1958-09-15
Yoders,Liza U.  1959-06-05
Ng,Liza Z.      1955-10-05
Yeats,Debby G.  1951-12-06
Zweifelhofer,Zelda J.   1954-02-19
Solomon,Emily D.        1953-01-28
Isaacs,Elvis V. 1952-04-05
Pantaleo,Robert U.      1950-03-29
```

## 示例

下面的示例返回所有以`“A”`开头的姓氏:

```java
SELECT Name FROM Sample.Person 
WHERE Name %MATCHES 'A*'
```

下面的示例返回所有以`“A”`开头的名字:

```java
SELECT Name FROM Sample.Person 
WHERE Name %MATCHES '*,A*'
```

下面的示例返回包含字母`“A”`的所有名称(姓、名或中间首字母):

```java
SELECT Name FROM Sample.Person 
WHERE Name %MATCHES '*A*'
```

下面的示例返回不包含字母 `“A”`, `“a”`, `“E”` , `“e”`的所有名称:

```java
SELECT Name FROM Sample.Person 
WHERE Name NOT %MATCHES '*[AaEe]*'
```

下面的示例返回所有以`“A”`到`“D”`开头的五个字母的姓氏:

```java
SELECT Name FROM Sample.Person 
WHERE Name %MATCHES '?????,[A-D]*'
```
