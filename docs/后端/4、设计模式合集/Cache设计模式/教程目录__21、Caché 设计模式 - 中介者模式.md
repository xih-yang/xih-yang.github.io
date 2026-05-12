# 21、Caché 设计模式 - 中介者模式
- 来源：https://ddkk.com/zhuanlan/design/cache/21.html
- 分类：设计模式
- 分组：教程目录
## 定义

用一个中介对象来封装一系列的对象交互。中介者使各对象不需要显示的相互引用，从而使其耦合松散，而且可以独立的改变他们之前的交互。

## 优点

中介者模式就是把网状复杂结构优化为一对多结构。起到协调作用。

MVP架构里面P层其实就是一个中介者，负责协调V和M。

## 使用场景

中介者模式很容易在系统中应用，也很容易在系统中误用，当出现了多对多交互复杂的对象群时，不要急于使用中介者模式，而要反思你的系统在设计上是不是合理。

中介者模式一般应用于一组对象以定义良好但是复杂的方式进行通信的场合。以及想定制一个分布在多个类中的行为，而又不想生成太多的子类的场合。

## 结构图

## 描述

安理会做中介，给美国和伊朗传话。

## 完整示例

### 抽象类

```java
Class PHA.YX.Design.Mediator.Country Extends %RegisteredObject
{
Property mediator As UnitedNations;
Method %OnNew(mediator As UnitedNations) As %Status [ Private, ServerOnly = 1 ]
{
	s ..mediator = mediator
	Quit $$$OK
}
}
```

### 具体类

```java
Class PHA.YX.Design.Mediator.USA Extends Country
{
Method %OnNew(mediator As UnitedNations) As %Status [ Private, ServerOnly = 1 ]
{
	dsuper(mediator)
	Quit $$$OK
}
Method Declare(message As %String)
{
	d ..mediator.Declare(message,$this)
}
Method GetMessage(message As %String)
{
	w "美国获得对方信息" _ message,!
}
}
```

```java
Class PHA.YX.Design.Mediator.Iraq Extends Country
{
Method %OnNew(mediator As UnitedNations) As %Status [ Private, ServerOnly = 1 ]
{
	dsuper(mediator)
	Quit $$$OK
}
Method Declare(message As %String)
{
	d ..mediator.Declare(message,$this)
}
Method GetMessage(message As %String)
{
	w "伊拉克获得对方信息" _ message,!
}
}
```

### 抽象中介类

```java
Class PHA.YX.Design.Mediator.UnitedNations Extends %RegisteredObject
{
Method Declare(message As %String, colleague As Country) [ Abstract ]
{
}
}
```

### 具体中介类

```java
Class PHA.YX.Design.Mediator.UnitedNationSecurityCouncil Extends UnitedNations
{
Property iraq As Iraq;
Method iraqGet() As Iraq [ ServerOnly = 1 ]
{
	Quit i%iraq
}
Method iraqSet(Arg As Iraq) As %Status [ ServerOnly = 1 ]
{
	s i%iraq = Arg
	Quit $$$OK
}
Property usa As USA;
Method usaGet() As USA [ ServerOnly = 1 ]
{
	Quit i%usa
}
Method usaSet(Arg As USA) As %Status [ ServerOnly = 1 ]
{
	s i%usa = Arg
	Quit $$$OK
}
Method Declare(message As %String, colleague As Country)
{
	i colleague = ..usa d
	.d ..iraq.GetMessage(message)
	e  d
	.d ..usa.GetMessage(message)
}
}
```

### 调用

```java
/// dclass(PHA.YX.Design.Program).Mediator() 
ClassMethod Mediator()
{
	s UNSC =class(PHA.YX.Design.Mediator.UnitedNationSecurityCouncil).%New()
	s usa =class(PHA.YX.Design.Mediator.USA).%New(UNSC)
	s iraq =class(PHA.YX.Design.Mediator.Iraq).%New(UNSC)
	d UNSC.iraqSet(iraq)
	d UNSC.usaSet(usa)
	d usa.Declare("不准研发核而武器，否则要放战争!")
	d iraq.Declare("我们没有核武器，也不怕侵略.")
}
```

```java
DHC-APP>dclass(PHA.YX.Design.Program).Mediator()
伊拉克获得对方信息不准研发核武器，否则要放战争!
美国获得对方信息我们没有核武器，也不怕侵略.
```

## 思考

尝试画出View，Presenter，Model 三者通过Presenter来通信，View与Model互相不通信。
