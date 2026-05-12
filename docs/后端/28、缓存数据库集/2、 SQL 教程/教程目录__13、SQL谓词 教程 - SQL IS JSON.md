# 13、SQL谓词 教程 - SQL IS JSON
- 来源：https://ddkk.com/zhuanlan/db/sqlweici/13.html
- 分类：缓存数据库
- 分组：教程目录
确定数据值是否为`JSON`格式。

注意：IRIS版本可用。其他不行。

## 大纲

```java
scalar-expression IS [NOT] JSON [keyword]
```

## 参数

- scalar-expression - 正在检查JSON格式的标量表达式。
- keyword - 可选—可选值、标量、数组或对象。

默认为`VALUE`。

## 描述

`ISJSON`谓词确定数据值是否为`JSON`格式。

下面的示例确定谓词是否是格式化正确的`JSON`字符串，是`JSON`对象还是`JSON`数组:

```java
ClassMethod IsJson()
{
	s q1 = "SELECT TOP 5 Name FROM Sample.Person "
	s q2 = "WHERE '{""name"":""Fred"",""spouse"":""Wilma""}' IS JSON"
	s myquery = q1_q2
	s tStatement =class(%SQL.Statement).%New()
	s qStatus = tStatement.%Prepare(myquery)
	if qStatus'=1 {
		w "%Prepare failed:" 
		d $System.Status.DisplayError(qStatus) 
		q
	}
	s rset = tStatement.%Execute()
	d rset.%Display()
}
```

`ISJSON`(带或不带可选关键字`VALUE`)对任何`JSON`数组或`JSON`对象返回`true`。

这包括一个空`JSON`数组`'[]'`或一个空`JSON`对象`'{}'`。

关键字`VALUE`和关键字`SCALAR`是同义词。

对于`JSON`数组`oref`返回`true`。

对于`JSON`对象`oref`, `IS JSON`对象返回`true`。

下面的例子说明了这一点:

```java
ClassMethod IsJson1()
{
	s jarray=[1,2,3,5,8,13,21,34]
	w "JSON array: ",jarray,!
	s myquery = "SELECT TOP 5 Name FROM Sample.Person WHERE ? IS JSON ARRAY"
	s tStatement =class(%SQL.Statement).%New()
	s qStatus = tStatement.%Prepare(myquery)
	if qStatus'=1 {
		w "%Prepare failed:" 
		d $System.Status.DisplayError(qStatus) 
		q
	}
	s rset = tStatement.%Execute(jarray)
	d rset.%Display()
}
```

```java
ClassMethod IsJson2()
{
	s jarray=[1,2,3,5,8,13,21,34]
	w "JSON array: ",jarray,!
	s myquery = "SELECT TOP 5 Name FROM Sample.Person WHERE ? IS JSON OBJECT"
	s tStatement =class(%SQL.Statement).%New()
	s qStatus = tStatement.%Prepare(myquery)
	if qStatus'=1 {
		w "%Prepare failed:" 
		d $System.Status.DisplayError(qStatus) 
		q
	}
	s rset = tStatement.%Execute(jarray)
	d rset.%Display()
}
```

```java
ClassMethod IsJson3()
{
	s jobj={
     "name":"Fred","spouse":"Wilma"}
	w "JSON object: ",jobj,!
	s myquery = "SELECT TOP 5 Name FROM Sample.Person WHERE ? IS JSON OBJECT"
	s tStatement =class(%SQL.Statement).%New()
	s qStatus = tStatement.%Prepare(myquery)
	if qStatus'=1 {
		w "%Prepare failed:" 
		d $System.Status.DisplayError(qStatus) 
		q
	}
	s rset = tStatement.%Execute(jobj)
	d rset.%Display()
}
```

`ISNOT JSON`谓词是少数几个可以在`WHERE`子句中用于流字段的谓词之一。

它的行为与`is NOT NULL`相同。

如下面的例子所示:

```java
ClassMethod IsJson4()
{
	s q1 = "SELECT Title,%OBJECT(Picture) AS PhotoOref FROM Sample.Employee "
	s q2 = "WHERE Picture IS NOT JSON"
	s myquery = q1_q2
	s tStatement =class(%SQL.Statement).%New()
	s qStatus = tStatement.%Prepare(myquery)
	if qStatus'=1 {
		w "%Prepare failed:" 
		d $System.Status.DisplayError(qStatus) 
		q
	}
	s rset = tStatement.%Execute()
	d rset.%Display()
}
```

`ISJSON`可以在任何可以指定谓词条件的地方使用，如本手册的谓词概述页面所述。
