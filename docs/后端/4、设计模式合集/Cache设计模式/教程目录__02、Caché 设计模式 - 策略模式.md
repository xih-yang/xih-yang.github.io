# 02、Caché 设计模式 - 策略模式
- 来源：https://ddkk.com/zhuanlan/design/cache/2.html
- 分类：设计模式
- 分组：教程目录
## 定义

策略模式是一种定义一系列算法的方法，从概念上来看，所有这些类算法完成的都是相同的工作，只是实现不同，它可以以相同的方式调用所有的算法，减少了各种算法类与使用算法类之间的耦合。

## 使用场景

对客户隐藏具体策略的实现细节，彼此完全独立

针对同意类型问题的多种处理方式，仅仅是具体行为有差别时

在一个类中定义了很多行为，而且这些行为在这个类里的操作以多个条件语句的形式出现

## 优点

简化了单元测试，因为每个算法都有自己的类，可以通过自己的接口单独测试

使用策略模式一避免使用多重条件语句，多重条件语句不易维护而且容易出错。消除过多的if else嵌套

易于拓展。当需要添加一个策略时，只需要实现接口就可以。

## 缺点

每一个策略都是一个类，复用性小，如果策略过多，类的数量会增多

上层模块必须知道有哪些策略，才能够使用这些策略，这与迪米特原则相违背

## 简单工厂模式与策略模式的区别

工厂模式主要是返回的接口实现类的实例化对象，最后返回的结果是接口实现类中的方法。

策略模式是在实例化策略模式的时候已经创建好了，我们可以再策略模式中随意的拼接重写方法。

而工厂模式是不管方法的拼接这些的，他只关注最后的结果，不注重过程，而策略模式注重的是过程。

工厂模式可以做到的事情，策略模式都可以做到。

策略模式可以做到的事情，工厂模式也可以做到，只是会变得麻烦。

工厂模式中只管生产实例，具体怎么使用工厂实例由调用方决定，策略模式是将生成实例的使用策略放在策略类中配置后才提供调用方使用。

工厂模式调用方可以直接调用工厂实例的方法属性等，策略模式不能直接调用实例的方法属性，需要在策略类中封装策略后调用。

示例：
可以随意组合招数，增加三次打击方法ThreeFighting()。 而 工厂方法则需要调用三次。

```java
Class PHA.YX.Design.Strategy.Context Extends %RegisteredObject
{
Property mFightingStrategy As PHA.YX.Design.Strategy.FightingStrategy;
Method %OnNew(fightingStrategy As PHA.YX.Design.Strategy.FightingStrategy) As %Status [ Private, ServerOnly = 1 ]
{
	s ..mFightingStrategy=fightingStrategy
	Quit $$$OK
}
Method Fighting()
{
	d ..mFightingStrategy.Fighting()
}
Method ThreeFighting()
{
	d ..mFightingStrategy.Fighting()
	d ..mFightingStrategy.Fighting()
	d ..mFightingStrategy.Fighting()
}
}
```

```java
/// dclass(PHA.YX.Design.Program).Strategy() 
ClassMethod Strategy()
{
	#dim context as PHA.YX.Design.Strategy.Context
	s context =class(PHA.YX.Design.Strategy.Context).%New(##class(PHA.YX.Design.Strategy.CommonRivalStrategy).%New())
	d context.Fighting()
	s context =class(PHA.YX.Design.Strategy.Context).%New(##class(PHA.YX.Design.Strategy.StrongRivalStrategy).%New())
	d context.Fighting()
	s context =class(PHA.YX.Design.Strategy.Context).%New(##class(PHA.YX.Design.Strategy.WeakRivalStrategy).%New())
	d context.Fighting()
	d context.ThreeFighting()
	q ""
}
```

## 结构图

## 完整示例

### 描述

根据不同的程度的对手，指定不同的方案。

### 定义策略接口

```java
Class PHA.YX.Design.Strategy.FightingStrategy [ Abstract ]
{
Method Fighting() [ Abstract ]
{
}
}
```

### 具体策略实现

```java
Class PHA.YX.Design.Strategy.StrongRivalStrategy Extends (%RegisteredObject, PHA.YX.Design.Strategy.FightingStrategy)
{
Method Fighting()
{
	w "遇到了强大的对象，张无忌使用乾坤大挪移",!
}
}
```

```java
Class PHA.YX.Design.Strategy.CommonRivalStrategy Extends (%RegisteredObject, PHA.YX.Design.Strategy.FightingStrategy)
{
Method Fighting()
{
	w "遇到了普通的对象，张无忌使用圣火令",!
}
}
```

```java
Class PHA.YX.Design.Strategy.WeakRivalStrategy Extends (%RegisteredObject, PHA.YX.Design.Strategy.FightingStrategy)
{
Method Fighting()
{
	w "遇到了较弱的对象，张无忌使用太极剑法",!
}
}
```

### 上下文策略

```java
Class PHA.YX.Design.Strategy.Context Extends %RegisteredObject
{
Property mFightingStrategy As PHA.YX.Design.Strategy.FightingStrategy;
Method %OnNew(fightingStrategy As PHA.YX.Design.Strategy.FightingStrategy) As %Status [ Private, ServerOnly = 1 ]
{
	s ..mFightingStrategy=fightingStrategy
	Quit $$$OK
}
Method Fighting()
{
	d ..mFightingStrategy.Fighting()
}
}
```

### 调用

```java
Class PHA.YX.Design.Program Extends %RegisteredObject
{
/// dclass(PHA.YX.Design.Program).Strategy() 
ClassMethod Strategy()
{
	#dim context as PHA.YX.Design.Strategy.Context
	s context =class(PHA.YX.Design.Strategy.Context).%New(##class(PHA.YX.Design.Strategy.CommonRivalStrategy).%New())
	d context.Fighting()
	s context =class(PHA.YX.Design.Strategy.Context).%New(##class(PHA.YX.Design.Strategy.StrongRivalStrategy).%New())
	d context.Fighting()
	s context =class(PHA.YX.Design.Strategy.Context).%New(##class(PHA.YX.Design.Strategy.WeakRivalStrategy).%New())
	d context.Fighting()
	q ""
}
}
```

#### 输出

```java
DHC-APP>wclass(PHA.YX.Design.Program).Strategy()
遇到了普通的对象，张无忌使用圣火令
遇到了强大的对象，张无忌使用乾坤大挪移
遇到了较弱的对象，张无忌使用太极剑法
```

## 思考

商场打折，满300减100，打8折，正常收费，满200减50，打5折，折9上再打折9。感兴趣的同学实现后可以发我一起参考下。
