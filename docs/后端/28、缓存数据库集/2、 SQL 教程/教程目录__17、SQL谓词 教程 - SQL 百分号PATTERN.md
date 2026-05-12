# 17、SQL谓词 教程 - SQL %PATTERN
- 来源：https://ddkk.com/zhuanlan/db/sqlweici/17.html
- 分类：缓存数据库
- 分组：教程目录
用包含字面值、通配符和字符类型代码的模式字符串匹配值。

## 大纲

```java
scalar-expression %PATTERN pattern
```

## 参数

- scalar-expression - 一个标量表达式(最常见的是数据列)，它的值正在与模式进行比较。
- pattern - 一个带引号的字符串，表示要与标量表达式中的每个值匹配的字符模式。

模式字符串可以包含双引号括起来的文字字符、指定字符类型的字母代码以及数字和作为通配符的句点(`.`)字符。

## 描述

`%PATTERN`谓词允许将字符类型代码和字面值的模式匹配到由标量表达式提供的数据值。

如果模式匹配完整的标量表达式值，则返回该值。

如果`pattern`没有完全匹配任何标量表达式值，`%pattern`将返回空字符串。

`%PATTERN`使用与ObjectScript模式匹配操作符相同的模式代码(`?`

操作符)。

模式由一对或多对重复计数和一个值组成。

重复计数可以是整数，句点(`.`)表示“任意数量的字符”，或者使用句点和整数的组合指定的范围。

值可以是字符类型代码字母或字符串字面值(在引号中指定)。

请注意，一个模式通常由多个重复/值对组成，因为该模式必须与整个数据值完全匹配。因此，许多模式都以“.E”对结尾，这意味着数据值的其余部分可以由任意数量的任意类型的字符组成。

模式匹配对的几个简单示例:

- 1L表示一个(而且只有一个)小写字母。
- 1“L”表示一个文字字符“L”。
- 1“617”表示一个文字字符串“617”。
- .U表示任意数量的大写字母。
- .E表示任意数量的任何类型的可打印字符。
- .3A指不超过三个(三个或以下)字母(大写或小写)的任何数字。
- 3.N表示三位或三位以上的数字。
- 3.6N表示三到六位(含)数字。

模式匹配区分大小写。模式匹配基于标量表达式的精确值，而不是其排序规则值。因此，即使标量表达式的排序规则类型不区分大小写，`%Pattern`操作中指定的文字字母也始终区分大小写。

在动态SQL中，SQL查询被指定为ObjectScript字符串，用双引号分隔。

因此，模式字符串中的双引号必须是双引号。

因此，美元金额的模式是:`'1"$"1.N1"."2N'`将在动态SQL中指定为`'1""$""1.N1"".""2N'`。

## %SelectMode

`%PATTERN`谓词不使用当前的``%SelectMode`设置。 应该以逻辑格式指定模式，无论`%SelectMode`设置如何。 尝试以`ODBC`格式或`Display`格式指定模式通常会导致没有数据匹配或意外的数据匹配。

可以使用`%EXTERNAL`或`%ODBCOUT`格式转换函数来转换谓词操作的标量表达式字段。

这允许以`Display`格式或`ODBC`格式指定模式。

但是，使用格式转换函数会阻止对字段使用索引，因此会对性能产生重大影响。

在下面的动态SQL示例中，`%PATTERN`谓词以逻辑格式指定日期模式，而不是`%SelectMode=1` (ODBC)格式。

从`41`开始的逻辑值(日期从1953年4月4日(`$HOROLOG 41000`)到1955年12月28日(`$HOROLOG 41999`))被选中:

```java
/// dclass(PHA.TEST.SQLCommand).Pattern()
ClassMethod Pattern()
{
	s q1 = "SELECT Name,DOB FROM Sample.Person "
	s q2 = "WHERE DOB %PATTERN '1""41""3N' "
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
DHC-APP>dclass(PHA.TEST.SQLCommand).Pattern()
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

这允许以ODBC格式指定`%PATTERN`模式。

它选择`DOB`字段`ODBC`值以`195`开头的行(日期范围从`1950`年到`1959`年)。

但是，指定格式转换函数会阻止对`DOB`字段值使用索引:

```java
ClassMethod Pattern1()
{
	s q1 = "SELECT Name,DOB FROM Sample.Person "
	s q2 = "WHERE %ODBCOUT(DOB) %PATTERN '1""195"".E' "
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

## 示例

下面的示例在`WHERE`子句中使用`%PATTERN`操作符来选择`Home_State`值，其中第一个字符是大写字母，第二个字符是字母`“C”`:

```java
SELECT Name,Home_State FROM Sample.Person
WHERE Home_State %PATTERN '1U1"C"'
```

这个示例选择`Home_State of North Carolina (NC)`或`South Carolina (SC)`的记录。

下面的示例在`WHERE`子句中使用`%PATTERN`操作符来选择以大写字母开头，后跟小写字母的`Name`值。

```java
SELECT Name FROM Sample.Person
WHERE Name %PATTERN '1U1L.E'
```

这里的模式翻译为:`1U`(一个大写字母)，跟着`1L`(一个小写字母)，然后是`. e`(任意数量的任意类型字符)。

注意，此模式将排除`“JONES”`、`“O'Reilly”`和`“deGastyne”`等名称。

下面的示例在`HAVING`子句中使用`%PATTERN`操作符为姓名以字母`“Jo”`开头的人选择记录，并返回搜索记录和返回记录的计数。

```java
SELECT Name,
       COUNT(Name) AS TotRecs,
       COUNT(Name %AFTERHAVING) AS JoRecs
FROM Sample.Person
HAVING Name %PATTERN '1U.L1","1"Jo".E'
```

在本例中，`Name`字段值被格式化为`Lastname`、`Firstname`，并可能包含一个可选的中间名或首字母。

为了反映这种名称格式，这里的模式翻译为:`1U`(一个大写字母)，后跟`. l`(任意数量的小写字母)，后跟1个`"，"`(一个逗号字符)，后跟1个`"Jo"`(一个值为`"Jo"`的字符串)，后跟`. e`(任意数量的任何类型的字符)。
