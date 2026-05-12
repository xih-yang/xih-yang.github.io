# 23、Caché 设计模式 - 解释器模式
- 来源：https://ddkk.com/zhuanlan/design/cache/23.html
- 分类：设计模式
- 分组：教程目录
## 定义

给定一个语义，语义它的文法的一种表示，并定义一个解释器，这个解释器使用该表示来解释语言中的句子。

## 使用场景

如果一种特性类型的问题发生的频率足够高，那么可能就值得将该问题的各个实例表述为一个简单语言中的句子。这样就可以构建一个解释器，解释器通过解释这些句子来解决该问题。

有一个简单的语法规则，比如编码转换.翻译。

正则表达式，浏览器。

## 优点

扩展性强，若要新增乘，除，添加相应的非终结表达式，修改计算逻辑即可。

## 缺点

需要建大量的类，因为每一种语法都要建一个非终结符的类。

解释的时候采用递归调用方法，导致有时候函数的深度会很深，影响效率。

## 结构图

## 描述

用abc来代替123数字。

## 完整示例

### 抽象解释器

```java
Class PHA.YX.Design.Interpreter.Expression Extends %RegisteredObject
{
Method Interpreter(context As Context) As %Integer [ Abstract ]
{
	q 0
}
}
```

### 上下文

```java
Class PHA.YX.Design.Interpreter.Context Extends %RegisteredObject
{
Property map As %ArrayOfDataTypes;
Method Add(s As Expression, value As %Integer)
{
	d ..map.SetAt(value, s)
}
Method Lookup(s As Expression)
{
	q ..map.GetAt(s)
}
}
```

### 终结符表达式

```java
Class PHA.YX.Design.Interpreter.TerminalExpression Extends Expression
{
Property variable As %String;
Method %OnNew(variable As %String) As %Status [ Private, ServerOnly = 1 ]
{
	s ..variable = variable
	Quit $$$OK
}
Method Interpreter(context As Context) As %Integer
{
	q context.Lookup($this)
}
}
```

### 非终结符表达式

```java
Class PHA.YX.Design.Interpreter.NonTerminalExpression Extends Expression
{
Property e1 As Expression;
Property e2 As Expression;
Method %OnNew(e1 As Expression, e2 As Expression) As %Status [ Private, ServerOnly = 1 ]
{
	s ..e1 = e1
	s ..e2 = e2
	Quit $$$OK
}
}
```

```java
Class PHA.YX.Design.Interpreter.MinusOperation Extends NonTerminalExpression
{
Method %OnNew(e1 As Expression, e2 As Expression) As %Status [ Private, ServerOnly = 1 ]
{
    dsuper(e1, e2)
	Quit $$$OK
}
Method Interpreter(context As Context) As %Integer
{
	q ..e1.Interpreter(context) - ..e2.Interpreter(context)
}
}
```

```java
Class PHA.YX.Design.Interpreter.PlusOperation Extends NonTerminalExpression
{
Method %OnNew(e1 As Expression, e2 As Expression) As %Status [ Private, ServerOnly = 1 ]
{
    dsuper(e1, e2)
	Quit $$$OK
}
Method Interpreter(context As Context) As %Integer
{
	q ..e1.Interpreter(context) + ..e2.Interpreter(context)
}
}
```

### 调用

```java
/// dclass(PHA.YX.Design.Program).Interpreter() 
ClassMethod Interpreter()
{
	s context =class(PHA.YX.Design.Interpreter.Context).%New()
	s a =class(PHA.YX.Design.Interpreter.TerminalExpression).%New("a")
	s b =class(PHA.YX.Design.Interpreter.TerminalExpression).%New("b")
	s c =class(PHA.YX.Design.Interpreter.TerminalExpression).%New("c")
	d context.Add(a, 4)
	d context.Add(b, 8)
	d context.Add(c, 6)
    s min=class(PHA.YX.Design.Interpreter.MinusOperation).%New(a,b).Interpreter(context)
	w min,!
	wclass(PHA.YX.Design.Interpreter.MinusOperation).%New(##class(PHA.YX.Design.Interpreter.PlusOperation).%New(a, b), c).Interpreter(context),!
}
```

```java
DHC-APP> dclass(PHA.YX.Design.Program).Interpreter()
-4
6
```

## 思考

把数字解释解释成对应英文。
