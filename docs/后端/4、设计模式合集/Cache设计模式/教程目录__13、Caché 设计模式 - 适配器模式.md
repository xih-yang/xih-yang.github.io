# 13、Caché 设计模式 - 适配器模式
- 来源：https://ddkk.com/zhuanlan/design/cache/13.html
- 分类：设计模式
- 分组：教程目录
## 定义

将一个类的接口转换成客户希望另外一个接口。Adapter模式使得原本由于接口不兼容而不能一起工作的那些类可以一起工作。

## 使用场景

系统的数据和行为都正确，但接口不符时,我们应该考虑用适配器，目的是使控制范围之外的一个原有对象与某个接口匹配。适配器模式主要应用于希望复用一些现存的类，但是接口又与复用环境要求不一致的情况。

使用一个已经存在的类，但如果它的接口，也就是它的方法和你的要求又不相同时，就应该考虑用适配器模式，也就是说两个类所做的事情相同或相似，但是具体不同的接口时要使用它。

## 优点

把接口和类结合，通过适配器可以让接口定义的功能更好的复用。

扩展性好，不光可调用自己开发的功能，还自然的扩展了接口定义的其它功能。

## 缺点

不适合兼容太多适配器

## 结构图

## 描述

NBA打篮球有中锋，前锋，后卫，有外籍球员来到美国不会说英语，要用翻译来适配。

## 完整实例

### 抽象接口

```java
Class PHA.YX.Design.Adapter.Player Extends %RegisteredObject
{
Property name As %String;
Method Attack()
{
}
Method Defense()
{
}
Method %OnNew(name As %String) As %Status [ Private, ServerOnly = 1 ]
{
	s $this.name = name
	Quit $$$OK
}
}
```

### 具体实现接口

```java
Class PHA.YX.Design.Adapter.Forwards Extends Player
{
Method Attack()
{
	w "前锋" _ ..name _ "进攻",!
}
Method Defense()
{
	w "前锋" _ ..name _ "防守",!
}
}
```

```java
Class PHA.YX.Design.Adapter.Center Extends Player
{
Method Attack()
{
	w "中锋" _ ..name _ "进攻",!
}
Method Defense()
{
	w "中锋" _ ..name _ "防守",!
}
}
```

```java
Class PHA.YX.Design.Adapter.Guards Extends Player
{
Method Attack()
{
	w "后锋" _ ..name _ "进攻",!
}
Method Defense()
{
	w "后锋" _ ..name _ "防守",!
}
}
```

### 被适配类

```java
Class PHA.YX.Design.Adapter.ForeignCenter Extends %RegisteredObject
{
Method ChineseAttack()
{
	w "外籍" _ ..name _ "进攻",!
}
Method ChineseDefense()
{
	w "外籍" _ ..name _ "防守",!
}
Property name As %String;
}
```

### 适配器

```java
Class PHA.YX.Design.Adapter.Translator Extends Player
{
Property mForeignCenter As ForeignCenter [ InitialExpression = {##class(ForeignCenter).%New()} ];
Method Attack()
{
	d ..mForeignCenter.ChineseAttack()
}
Method Defense()
{
	d ..mForeignCenter.ChineseDefense()
}
Method %OnNew(name As %String) As %Status [ Private, ServerOnly = 1 ]
{
	s ..mForeignCenter.name = name
	Quit $$$OK
}
}
```

### 调用

```java
/// dclass(PHA.YX.Design.Program).Adapter() 
ClassMethod Adapter()
{
	#dim b as PHA.YX.Design.Adapter.Forwards
	s b =class(PHA.YX.Design.Adapter.Forwards).%New("巴特尔")
	d b.Attack()
	#dim o as PHA.YX.Design.Adapter.Center
	s o =class(PHA.YX.Design.Adapter.Center).%New("奥尼尔")
	d o.Defense()
	#dim m as PHA.YX.Design.Adapter.Guards
	s m =class(PHA.YX.Design.Adapter.Guards).%New("麦迪")
	d m.Attack()
	#dim ym as PHA.YX.Design.Adapter.Translator
	s ym =class(PHA.YX.Design.Adapter.Translator).%New("姚明")
	d ym.Attack()
	d ym.Defense()
}
```

```java
DHC-APP>dclass(PHA.YX.Design.Program).Adapter()
前锋巴特尔进攻
中锋奥尼尔防守
后锋麦迪进攻
外籍姚明进攻
外籍姚明防守
```

## 思考

有些国家电压110V，我国电压220v，通过适配器模式把110V变成我国能用的电压。感兴趣的同学实现后可以发我一起参考下。
