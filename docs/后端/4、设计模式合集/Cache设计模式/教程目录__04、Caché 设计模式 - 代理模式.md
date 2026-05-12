# 04、Caché 设计模式 - 代理模式
- 来源：https://ddkk.com/zhuanlan/design/cache/4.html
- 分类：设计模式
- 分组：教程目录
## 定义

为其他对象提供一种代理以控制对这个对象的访问。

## 类型

静态代理

动态代理（实现的同学联系我）

## 使用场景

远程代理 为一个对象在不同的地址空间提供局部代表。这样可以隐藏一个对象存在与不同地址空间的事实。

虚拟代理 根据需要创建开销很大的对象。通过它来存放实例化需要很长时间的真实对象。

安全代理 用来控制真实对象访问时的权限。

智能指引 指当调用真实的对象时，代理处理另外一些事。

## 优点

真实主题类就是实现实际的业务逻辑，不用关心其他非本职的工作。

真实主题类随时都会发生变化；但是因为它实现了公共接口，所以代理类可以不做任何修改就可以使用。

## 缺点

当接口方法中添加新的方法之后，目标对象和代理对象都要进行维护。

## 结构图

## 完整示例

### 抽象主题类

```java
Class PHA.YX.Design.Proxy.Subject
{
Method GiveDolls() [ Abstract ]
{
}
Method GiveFlower() [ Abstract ]
{
}
Method GiveChocolate() [ Abstract ]
{
}
}
```

### 真实主题类

```java
Class PHA.YX.Design.Proxy.RealSubject Extends (%RegisteredObject, PHA.YX.Design.Proxy.Subject)
{
Method GiveDolls()
{
	w "送玩具给" _ ..girl.nameGet(),!
}
Method GiveFlower()
{
	w "送花给" _ ..girl.nameGet(),!
}
Method GiveChocolate()
{
	w "送巧克力给" _ ..girl.nameGet(),!
}
Property girl As SchoolGirl;
Method %OnNew(girl As SchoolGirl) As %Status [ Private, ServerOnly = 1 ]
{
	s $this.girl=girl
	Quit $$$OK
}
}
```

### 代理类

```java
Class PHA.YX.Design.Proxy.Proxy Extends (%RegisteredObject, PHA.YX.Design.Proxy.Subject)
{
Method GiveDolls()
{
	d ..realSubject.GiveDolls()
}
Method GiveFlower()
{
	d ..realSubject.GiveFlower()
}
Method GiveChocolate()
{
	d ..realSubject.GiveChocolate()
}
Property realSubject As RealSubject;
Method %OnNew(girl As SchoolGirl) As %Status [ Private, ServerOnly = 1 ]
{
	s ..realSubject=##class(RealSubject).%New(girl)
	Quit $$$OK
}
}
```

### 对象类

```java
Class PHA.YX.Design.Proxy.SchoolGirl Extends %RegisteredObject
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
}
```

### 调用

```java
/// dclass(PHA.YX.Design.Program).Proxy() 
ClassMethod Proxy()
{
	s girl =class(PHA.YX.Design.Proxy.SchoolGirl).%New()
	d girl.nameSet("姚鑫")
	s proxy =class(PHA.YX.Design.Proxy.Proxy).%New(girl)
	d proxy.GiveChocolate()
	d proxy.GiveDolls()
	d proxy.GiveFlower()
}
```

```java
DHC-APP>dclass(PHA.YX.Design.Program).Proxy()
送巧克力给姚鑫
送玩具给姚鑫
送花给姚鑫
```

## 思考

小红帮小明去商店买东西。如何用代理实现。感兴趣的同学实现后可以发我一起参考下。
