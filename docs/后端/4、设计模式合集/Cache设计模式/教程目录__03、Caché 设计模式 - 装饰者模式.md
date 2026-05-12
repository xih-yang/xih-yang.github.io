# 03、Caché 设计模式 - 装饰者模式
- 来源：https://ddkk.com/zhuanlan/design/cache/3.html
- 分类：设计模式
- 分组：教程目录
## 定义

装饰者模式是动态地给一个对象添加一些额外的职责，就增加功能来说，装饰模式比生成子类更为灵活。

## 使用场景

在不影响其他对象的情况下，以动态，透明的方式给单个对象添加职责。

需要动态地给一个对象增加功能，这些功能可以动态地撤销。

当不能采用继承的方式对系统进行扩充或者采用继承不利于系统拓展和维护时。

当系统需要新加功能的时候，是向旧的类中添加新的代码，这些新加的代码装饰了原有类的核心职责或主要行为。而新加的东西仅仅是为了满足一些只在某些特定情况下会执行的特殊行为。

装饰者提供了一个非常好解决方案，它把每个要装饰的功能放在单独的类中，并让这个类包装它所要的对象，因此当需要执行特殊行为时，客户代码就可以在运行时根据需要选择地，按顺序地执行装饰功能。

## 优点

通过组合而非继承的方式，动态地拓展一个对象的功能，在运行时选择不同的装饰器，从而实现不同的行为。

有效避免了使用继承方式拓展对象功能而带来的灵活性差，子类无限制扩张问题。

具体组件类与具体装饰类可以独立变化，用户可以根据需要增加新的具体组件类和具体装饰类，在使用时再对其进行组合，原有代码无须改变，符合“开放封闭原则”。

把类中的装饰功能从类中搬出去，这样可以简化原有的类。

## 缺点

因为所有对象继承Compoent，所以如果Compoent内部结构发生改变，则不可避免的影响所有子类（装饰者和被装饰者）。

如果基类改变，则势必影响对象的内部。

比继承更加灵活激动的特性，也同时意味着装饰者模式比继承更加容易出错，排错也困难。

对于多次装饰的对象，调试时寻找错误可能需要逐级排查，较为繁琐。

装饰层数不能过多，否则影响效率。

## 结构图

## 完整示例

### 描述

一些穿搭搭配，例如T恤，垮裤，球鞋，皮鞋，西装，领带，皮鞋给某个人来装扮。

### 组件具体实现类

```java
Class PHA.YX.Design.Decorator.Person Extends %RegisteredObject
{
Property name As %String [ Private ];
Method nameGet() As %String [ ServerOnly = 1 ]
{
	Quit i%name
}
Method nameSet(Arg As %String) As %Status [ ServerOnly = 1 ]
{
	s i%name = Arg
	Quit $$$OK
}
Method Show()
{
	w "装扮者" _ ..name,!
	q ""
}
Method %OnNew(name As %String = "") As %Status [ Private, ServerOnly = 1 ]
{
	d ..nameSet(name)
	Quit $$$OK
}
}
```

### 抽象装饰者

```java
Class PHA.YX.Design.Decorator.Finery Extends PHA.YX.Design.Decorator.Person
{
Property component As Person [ Private ];
Method Decorate(component As Person)
{
	s $this.component=component
}
Method Show()
{
	i (..component '= "") d	
	.d ..component.Show()
	q ""
}
}
```

### 装饰者具体实现类

```java
Class PHA.YX.Design.Decorator.Tshirts Extends Finery
{
Method Show()
{
	d ..Do()
	w "大T恤",!
	dsuper()
	q ""
}
Method Do()
{
	w "穿"
	q ""
}
}
```

```java
Class PHA.YX.Design.Decorator.BigTrouser Extends Finery
{
Method Show()
{
	w "垮裤",!
	dsuper()
	q ""
}
}
```

```java
Class PHA.YX.Design.Decorator.Sneakers Extends Finery
{
Method Show()
{
	w "破球鞋",!
	dsuper()
	q ""
}
}
```

```java
Class PHA.YX.Design.Decorator.LeatherShoes Extends Finery
{
Method Show()
{
	w "皮鞋",!
	dsuper()
	q ""
}
}
```

```java
Class PHA.YX.Design.Decorator.Tie Extends Finery
{
Method Show()
{
	w "领带",!
	dsuper()
	q ""
}
}
```

```java
Class PHA.YX.Design.Decorator.Suit Extends Finery
{
Method Show()
{
	w "西装",!
	dsuper()
	q ""
}
}
```

### 调用

```java
/// dclass(PHA.YX.Design.Program).Decorator() 
ClassMethod Decorator()
{
	#import PHA.YX.Design.Decorator
	#dim yx as PHA.YX.Design.Decorator.Person
	s yx =class(PHA.YX.Design.Decorator.Person).%New("姚鑫")
	w "第一种装扮",!
	s mSneakers =class(PHA.YX.Design.Decorator.Sneakers).%New()
	s mBigTrouser =class(PHA.YX.Design.Decorator.BigTrouser).%New()
	s mTshirts =class(PHA.YX.Design.Decorator.Tshirts).%New()
	d mSneakers.Decorate(yx)
	d mBigTrouser.Decorate(mSneakers)
	d mTshirts.Decorate(mBigTrouser)
	d mTshirts.Show()
	w !,"第二种装扮",!
	s mLeatherShoes =class(PHA.YX.Design.Decorator.LeatherShoes).%New()
	s mTie =class(PHA.YX.Design.Decorator.Tie).%New()
	s mSuit =class(PHA.YX.Design.Decorator.Suit).%New()
	d mLeatherShoes.Decorate(yx)
	d mTie.Decorate(mLeatherShoes)
	d mSuit.Decorate(mTie)
	d mSuit.Show()
	w !,"第三种装扮",!
	s mLeatherShoes1 =class(PHA.YX.Design.Decorator.LeatherShoes).%New()
	s mTie1 =class(PHA.YX.Design.Decorator.Tie).%New()
	s mSuit1 =class(PHA.YX.Design.Decorator.Suit).%New()
	s mSneakers1 =class(PHA.YX.Design.Decorator.Sneakers).%New()
	s mBigTrouser1 =class(PHA.YX.Design.Decorator.BigTrouser).%New()
	s mTshirts1 =class(PHA.YX.Design.Decorator.Tshirts).%New()
	d mLeatherShoes1.Decorate(yx)
	d mTie1.Decorate(mLeatherShoes1)
	d mSuit1.Decorate(mTie1)
	d mSneakers1.Decorate(mSuit1)
	d mBigTrouser1.Decorate(mSneakers1)
	d mTshirts1.Decorate(mBigTrouser1)
	d mTshirts1.Show()
	q ""
}
```

```java
DHC-APP>dclass(PHA.YX.Design.Program).Decorator()
第一种装扮
大T恤
垮裤
破球鞋
装扮者姚鑫
第二种装扮
西装
领带
皮鞋
装扮者姚鑫
第三种装扮
大T恤
垮裤
破球鞋
西装
领带
皮鞋
装扮者姚鑫
```

## 思考

杨过本身会全真剑法，洪七公教他打狗棒法，欧阳锋教他蛤蟆功,用装饰者模式来实现一下。感兴趣的同学实现后可以发我一起参考下。
