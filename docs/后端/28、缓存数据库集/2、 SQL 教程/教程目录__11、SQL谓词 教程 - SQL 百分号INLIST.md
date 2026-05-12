# 11、SQL谓词 教程 - SQL %INLIST
- 来源：https://ddkk.com/zhuanlan/db/sqlweici/11.html
- 分类：缓存数据库
- 分组：教程目录
将一个值匹配到%List结构化列表中的元素。

## 大纲

```java
scalar-expression %INLIST list [SIZE ((nn))]
```

## 参数

- scalar-expression - 将其值与列表元素进行比较的标量表达式(最常见的是数据列)。
- list - 包含一个或多个元素的%List结构。
- SIZE ((nn)) - 可选-指定列表中元素数量估计值的整数。

必须指定为具有下列值之一的字面值:`10`、`100`、`1000`、`10000`，等等。

## 描述

`%INLIST`谓词是 IRIS扩展，用于将字段的值与列表结构的元素匹配。

`%INLIST`和`IN`都允对多个指定值执行这样的相等比较。

`%INLIST`将这些多个值指定为单个列表参数的元素。

因此，`%INLIST`允许改变要匹配的值的数量，而无需创建单独的缓存查询。

可选的`%INLIST SIZE`子句提供整数`nn`，它指定`list`中列表元素数量的数量级估计数。

IRIS使用这个数量级估计来确定最佳查询计划。

因为不管列表中元素的数量是多少，都会使用相同的缓存查询，所以指定`SIZE`允许创建缓存查询，针对列表中预期的元素的大致数量进行优化。

更改`SIZE`字面值将创建一个单独的缓存查询。

指定`nn`为以下文字之一:`10`、`100`、`1000`、`10000`，等等。

因为`nn`必须在编译时作为常量值可用，所以在所有SQL代码中必须将其指定为文字。

注意，必须为所有已编译SQL (`Dynamic SQL`)指定双括号。

双括号不用于嵌入式SQL。

`%INLIST`对`list`中的每个元素执行相等比较。

`%INLIST`比较使用为标量表达式定义的排序规则类型。

因此，列表元素的比较可能区分大小写，也可能不区分大小写，这取决于标量表达式的排序规则。

默认情况下，字符串数据类型字段是用`SQLUPPER`排序规则定义的，它不区分大小写。

指定`NULL`作为比较值是没有意义的。

`NULL`表示没有值，因此无法通过所有相等测试。

指定`%INLIST`谓词(或任何其他谓词)将消除指定字段的任何`NULL`实例。

必须指定`IS NULL`谓词，以便在谓词结果集中包含带有`NULL`的字段。

与大多数谓词一样，`%INLIST`可以使用`NOT`逻辑操作符进行反转。

`%INLIST`和`NOT %INLIST`都不能返回空字段。

返回`NULL`字段使用`IS NULL`。

如果匹配表达式不是`%List`格式，`%INLIST`将生成一个`SQLCODE -400`错误。

例如，如果集合属性的`SqlListType`为`DELIMITED`，则列表字段的逻辑值不是`%list`格式。

要将值匹配到非结构化的项系列，如逗号分隔的值列表，请使用`IN`谓词。

`IN`可以执行相等比较和子查询比较。

## %SelectMode

`%INLIST`谓词不使用当前的`%SelectMode`设置。

列表的元素应该以逻辑格式指定，无论`%SelectMode`设置如何。

试图以ODBC格式或`Display`格式指定列表元素通常会导致没有数据匹配或意外的数据匹配。

可以使用`%EXTERNAL`或`%ODBCOUT`格式转换函数来转换谓词操作的标量表达式字段。

这允许以`Display`格式或`ODBC`格式指定列表元素。

但是，使用格式转换函数会阻止对字段使用索引，因此会对性能产生重大影响。

在下面的`Dynamic SQL`示例中，`%INLIST`谓词指定一个包含`1978`年日期值元素的列表，其格式为逻辑格式，而不是`%SelectMode=1` (ODBC)格式。

与这些`$HOROLOG`格式日期对应的日期被选中:

```java
ClassMethod List()
{
	s bday = $lb(50039)
	for i = 50039 : 1 : 50403 {
		s bday = bday _ $lb(i) 
	}
	s q1 = "SELECT Name,DOB FROM Sample.Person "
	s q2 = "WHERE DOB %INLIST ?"
	s myquery = q1_q2
	s tStatement =class(%SQL.Statement).%New()
	s tStatement.%SelectMode = 1
	s qStatus = tStatement.%Prepare(myquery)
	if qStatus'=1 {
		w "%Prepare failed:" 
		d $System.Status.DisplayError(qStatus) 
		q
	}
	s rset = tStatement.%Execute(bday)
	d rset.%Display()
}
```

```java
DHC-APP> dclass(PHA.TEST.SQLCommand).List()
Name    DOB
姚鑫    1978-01-28
Chadwick,Zelda S.Chadwick,Zelda S.Chadwick,Zelda S.Chadwick,Zelda S.Chadwick,Zelda S.   1978-01-28
Isaacs,Chad N.  1978-09-13
Ximines,Kim S.  1978-04-07
4 Rows(s) Affected
```

下面的动态SQL示例使用`%ODBCOUT`格式转换函数来转换谓词匹配的`DOB`字段。

这允许以`ODBC`格式指定`%INLIST`列表元素。

但是，指定格式转换函数会阻止对`DOB`字段值使用索引:

```java
ClassMethod List1()
{
	s births = $LISTBUILD("1978-01-15", "1978-08-22", "1990-04-25")
	s q1 = "SELECT Name,DOB FROM Sample.Person "
	s q2 = "WHERE %ODBCOUT(DOB) %INLIST ?"
	s myquery = q1 _ q2
	s tStatement =class(%SQL.Statement).%New()
	s tStatement.%SelectMode = 1
	s qStatus = tStatement.%Prepare(myquery)
	if qStatus'=1 {
		w "%Prepare failed:" 
		d $System.Status.DisplayError(qStatus) 
		q
	}
	s rset = tStatement.%Execute(births)
	d rset.%Display()
}
```

```java
DHC-APP>dclass(PHA.TEST.SQLCommand).List1()
Name    DOB
yaoxin  1990-04-25
1 Rows(s) Affected
```

## %INLIST and IN

`%INLIST`和`IN`谓词都可以用于提供多个值来进行相等比较。

下面的动态SQL示例返回相同的结果:

```java
ClassMethod List2()
{
	s states = $lb("VT","NH","ME")
	s myquery = "SELECT Name,Home_State FROM Sample.Person WHERE Home_State %INLIST ?"
	s tStatement =class(%SQL.Statement).%New()
	s qStatus = tStatement.%Prepare(myquery)
	if qStatus'=1 {
		w "%Prepare failed:" 
		d $System.Status.DisplayError(qStatus) 
		q
	}
	s rset = tStatement.%Execute(states)
	d rset.%Display()
}
```

```java
DHC-APP>dclass(PHA.TEST.SQLCommand).List2()
Name    Home_State
Lepon,Jeff Z.   NH
Ingleman,Terry A.       NH
Jung,Keith W.   NH
Xiang,Kirsten U.        ME
Jackson,Ralph V.        VT
Tesla,Geoffrey O.       NH
Tweed,Al O.     NH
Fives,Kristen F.        NH
Ingrahm,Susan N.        ME
Lepon,Janice T. ME
Wilson,Andrew O.        ME
Olsen,Ashley G. NH
12 Rows(s) Affected
```

```java
ClassMethod List3()
{
	s s1="VT"
	s s2="NH"
	s s3="ME"
	s myquery = "SELECT Name,Home_State FROM Sample.Person WHERE Home_State IN(?,?,?)"
	s tStatement =class(%SQL.Statement).%New()
	s qStatus = tStatement.%Prepare(myquery)
	if qStatus'=1 {
		w "%Prepare failed:" 
		d $System.Status.DisplayError(qStatus) 
		q
	}
	s rset = tStatement.%Execute(s1,s2,s3)
	d rset.%Display()
}
```

然而，在动态SQL中，可以提供`%INLIST`谓词值作为单个主机变量;

必须将`IN`谓词值作为单独的主机变量提供。

因此，更改`IN`谓词值的数量将导致创建一个单独的缓存查询。

更改`%INLIST`谓词值的数量不会导致创建单独的缓存查询。

## 示例

下面的示例将`Home_State`列值与新英格兰北部州的结构化列表的元素匹配:

```java
ClassMethod List4()
{
	s states=$LISTBUILD("VT","NH","ME")
	s myquery="SELECT Name,Home_State FROM Sample.Person "_
	          "WHERE Home_State %INLIST ?"
	s tStatement =class(%SQL.Statement).%New()
	s qStatus = tStatement.%Prepare(myquery)
	if qStatus'=1 {
		w "%Prepare failed:" 
		d $System.Status.DisplayError(qStatus) 
		q
	}
	s rset = tStatement.%Execute(states)
	d rset.%Display()
}
```

下面两个示例说明排序规则匹配是基于标量表达式排序规则的。

`Home_State`字段是用`SQLUPPER`排序规则定义的，它不区分大小写。

这些例子中的列表将新罕布什尔州指定为`“nH”`，而不是`“NH”`。

第一个示例返回`NH Home_State`值，第二个示例不返回`NH Home_State`值:

```java
ClassMethod List5()
{
	s states=$LISTBUILD("VT","nH","ME")
	s myquery="SELECT Name,Home_State FROM Sample.Person "_
	          "WHERE Home_State %INLIST ?"
	s tStatement =class(%SQL.Statement).%New()
	s qStatus = tStatement.%Prepare(myquery)
	if qStatus'=1 {
		w "%Prepare failed:" 
		d $System.Status.DisplayError(qStatus) 
		q
	}
	s rset = tStatement.%Execute(states)
	d rset.%Display()
}
```

```java
ClassMethod List6()
{
	s states=$LISTBUILD("VT","nH","ME")
	s myquery="SELECT Name,Home_State FROM Sample.Person "_
	          "WHERE %EXACT(Home_State) %INLIST ?"
	s tStatement =class(%SQL.Statement).%New()
	s qStatus = tStatement.%Prepare(myquery)
	if qStatus'=1 {
		w "%Prepare failed:" 
		d $System.Status.DisplayError(qStatus) 
		q
	}
	s rset = tStatement.%Execute(states)
	d rset.%Display()
}
```

下面的示例创建了一个`SIZE`为`10`的缓存查询。

对于该查询，指定`SIZE 10`是最优的，因为`10`对应于列表中的实际元素数量。

改变列表中的元素数量并不会创建一个单独的缓存查询。

改变`SIZE`字面值确实会创建一个单独的缓存查询:

```java
ClassMethod List7()
{
	s states=$LISTBUILD("VT","NH","ME")
	s myquery="SELECT Name,Home_State FROM Sample.Person "_
	          "WHERE Home_State %INLIST ? SIZE ((10))"
	s tStatement =class(%SQL.Statement).%New()
	s qStatus = tStatement.%Prepare(myquery)
	if qStatus'=1 {
		w "%Prepare failed:" 
		d $System.Status.DisplayError(qStatus) 
		q
	}
	s rset = tStatement.%Execute(states)
	d rset.%Display()
}
```

```java
ClassMethod List8()
{
	s states=$LISTBUILD("VT","nH","ME")
	s myquery="SELECT Name,Home_State FROM Sample.Person "_
	          "WHERE Home_State %INLIST ?"
	s tStatement =class(%SQL.Statement).%New()
	s qStatus = tStatement.%Prepare(myquery)
	if qStatus'=1 {
		w "%Prepare failed:" 
		d $System.Status.DisplayError(qStatus) 
		q
	}
	s rset = tStatement.%Execute(states)
	d rset.%Display()
}
```

下面的示例创建了一个`SIZE`为`10`的缓存查询。

对于该查询，指定`SIZE 10`是最优的，因为`10`对应于列表中的实际元素数量。

改变列表中的元素数量并不会创建一个单独的缓存查询。

改变`SIZE`字面值确实会创建一个单独的缓存查询:

```java
ClassMethod List9()
{
	s states=$LISTBUILD("VT","NH","ME")
	s myquery="SELECT Name,Home_State FROM Sample.Person "_
	          "WHERE Home_State %INLIST ? SIZE ((10))"
	s tStatement =class(%SQL.Statement).%New()
	s qStatus = tStatement.%Prepare(myquery)
	if qStatus'=1 {
     WRITE "%Prepare failed:" DO $System.Status.DisplayError(qStatus) QUIT}
	s rset = tStatement.%Execute(states)
	d rset.%Display()
}
```
