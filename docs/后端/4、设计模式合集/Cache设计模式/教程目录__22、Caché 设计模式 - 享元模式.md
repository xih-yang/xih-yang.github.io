# 22、Caché 设计模式 - 享元模式
- 来源：https://ddkk.com/zhuanlan/design/cache/22.html
- 分类：设计模式
- 分组：教程目录
## 定义

运用共享技术有效地支持大量细粒度的对象。

## 优点

享元模式可以避免大量非常相似类的开销，在程序设计中，有时需要生成大量细粒度的类实例来表示数据。如果能发现这些实例除了几个参数外基本上相同的，有时就能够大幅度地减少需要实例化的类的数量。如果把这些参数移到类实例外面，在方法调用时传递他们进来，就可以通过共享大幅度减少单个实例的数目。

## 使用场景

系统中存在大量的相似对象。

需要缓冲池场景。

如果一个应用程序使用了大量的对象，而大量的这些对象造成了很大的储存开销时就应该考虑使用。

## 结构图

## 描述

做六个网站，三个产品展示，三个博客网站。

## 完整示例

### 实体类

```java
Class PHA.YX.Design.Flyweight.User Extends %RegisteredObject
{
Property name As %String;
Method nameGet() As %String [ ServerOnly = 1 ]
{
	Quit i%name
}
Method nameSet(Arg As %String) As %Status [ ServerOnly = 1 ]
{
	s i%name = Arg
	Quit $$$OK
}
Method %OnNew(name As %String) As %Status [ Private, ServerOnly = 1 ]
{
	s ..name = name
	Quit $$$OK
}
}
```

### 抽象享元角色

```java
Class PHA.YX.Design.Flyweight.WebSite Extends %RegisteredObject
{
Method Use(user As User) [ Abstract ]
{
}
}
```

### 实现享元角色

```java
Class PHA.YX.Design.Flyweight.ConcreteWebSite Extends WebSite
{
Property name As %String;
Method %OnNew(name As %String) As %Status [ Private, ServerOnly = 1 ]
{
	s ..name = name
	Quit $$$OK
}
Method Use(user As User)
{
	w "网站分类" _ ..name _ "用户," _ user.nameGet(),!
}
}
```

### 享元工厂

```java
Class PHA.YX.Design.Flyweight.WebSiteFactory Extends %RegisteredObject
{
Property flyweights As %ArrayOfDataTypes;
Method GetWebSiteCategory(key As %String) As WebSite
{
	i '$d(..flyweights.Data(key)) d
	.d ..flyweights.SetAt(##class(ConcreteWebSite).%New(key),key)
	q ..flyweights.GetAt(key)
}
Method GetWebSiteCount() As %Integer
{
	q ..flyweights.Count()
}
}
```

### 调用

```java
/// dclass(PHA.YX.Design.Program).Flyweight() 
ClassMethod Flyweight()
{
	s factory =class(PHA.YX.Design.Flyweight.WebSiteFactory).%New()
	#dim fx as PHA.YX.Design.Flyweight.ConcreteWebSite
	s fx = factory.GetWebSiteCategory("产品展示")
	d fx.Use(##class(PHA.YX.Design.Flyweight.User).%New("姚鑫"))
	s fy = factory.GetWebSiteCategory("产品展示")
	d fy.Use(##class(PHA.YX.Design.Flyweight.User).%New("小马哥"))
	s fz = factory.GetWebSiteCategory("产品展示")
	d fz.Use(##class(PHA.YX.Design.Flyweight.User).%New("宝哥"))
	s fl = factory.GetWebSiteCategory("博客")
	d fl.Use(##class(PHA.YX.Design.Flyweight.User).%New("杨过"))
	s fm = factory.GetWebSiteCategory("博客")
	d fm.Use(##class(PHA.YX.Design.Flyweight.User).%New("小龙女"))
	s fn = factory.GetWebSiteCategory("博客")
	d fn.Use(##class(PHA.YX.Design.Flyweight.User).%New("殷素素"))
	w "得到网站分类总数为" _ factory.GetWebSiteCount(),!
}
```

```java
DHC-APP>dclass(PHA.YX.Design.Program).Flyweight()
网站分类产品展示用户,姚鑫
网站分类产品展示用户,小马哥
网站分类产品展示用户,宝哥
网站分类博客用户,杨过
网站分类博客用户,小龙女
网站分类博客用户,殷素素
得到网站分类总数为2
```

## 思考

淘宝商品 iphone7，iphone8 32G 64G 128G，利用享元模式如何实现。
