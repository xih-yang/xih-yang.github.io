# 20、Caché 设计模式 - 职责链模式
- 来源：https://ddkk.com/zhuanlan/design/cache/20.html
- 分类：设计模式
- 分组：教程目录
## 定义

使多个对象都有机会处理请求，从而避免请求发送者与接收者之间的耦合关系。将这个对象连成一条链，并沿着这条链传递该请求，知道有一个对象处理它为止。

## 优点

请求者和处理者关系解耦，提高代码灵活性。

当客户提交一个请求时，请求是沿着链传递直至有一个ConcreteHandler对象负责处理它。

随时地增加或修改处理一个请求的结构。增强了对象指派职责的灵活性。

接收者和发送者都没有对象的明确信息，且链中的对象自己也并不知道链的结构，结果是职责链可简化对象的相互连接，它们仅需保持一个指向其后继承者的引用，而不需保持它所有的候选接受者的引用。

## 缺点

对处理者遍历，弱处理者太多，会影响性能，特别在递归处理中尤其需要注意。

## 结构图

## 描述

申请人，申请请假或加薪，随着申请权限不同，扭转不同管理者。

## 完整示例

### 请求类

```java
Class PHA.YX.Design.Chain.Request Extends %RegisteredObject
{
Property requestType As %String;
Method requestTypeGet() As %String [ ServerOnly = 1 ]
{
	Quit i%requestType
}
Method requestTypeSet(Arg As %String) As %Status [ ServerOnly = 1 ]
{
	s i%requestType = Arg
	Quit $$$OK
}
Property requestContent As %String;
Method requestContentGet() As %String [ ServerOnly = 1 ]
{
	Quit i%requestContent
}
Method requestContentSet(Arg As %String) As %Status [ ServerOnly = 1 ]
{
	s i%requestContent = Arg
	Quit $$$OK
}
Property number As %String;
Method numberGet() As %String [ ServerOnly = 1 ]
{
	Quit i%number
}
Method numberSet(Arg As %String) As %Status [ ServerOnly = 1 ]
{
	s i%number = Arg
	Quit $$$OK
}
}
```

### 抽象责任类

```java
Class PHA.YX.Design.Chain.Manager Extends %RegisteredObject
{
Property name As %String;
Property superior As Manager;
Method %OnNew(name As %String) As %Status [ Private, ServerOnly = 1 ]
{
	s ..name = name
	Quit $$$OK
}
Method SetSuperior(superior As Manager)
{
	s ..superior = superior
}
Method RequertApplications(request As Request) [ Abstract ]
{
}
}
```

### 实现责任类

```java
Class PHA.YX.Design.Chain.CommonManager Extends Manager
{
Method %OnNew(name As %String) As %Status [ Private, ServerOnly = 1 ]
{
	dsuper(name)
	Quit $$$OK
}
Method RequertApplications(request As Request)
{
	i (request.requestTypeGet() = "请假") && (request.numberGet() <= 2) d
	.w ..name _ ":" _ request.requestContentGet() _ "数量" _ request.numberGet() _ "被批准",!
	e  d
	.i ..superior '= "" d
	..d ..superior.RequertApplications(request)
}
}
```

```java
Class PHA.YX.Design.Chain.MajorManager Extends Manager
{
Method %OnNew(name As %String) As %Status [ Private, ServerOnly = 1 ]
{
	dsuper(name)
	Quit $$$OK
}
Method RequertApplications(request As Request)
{
	i (request.requestTypeGet() = "请假") && (request.numberGet() <= 5) d
	.w ..name _ ":" _ request.requestContentGet() _ "数量" _ request.numberGet() _ "被批准",!
	e  d
	.i ..superior '= "" d
	..d ..superior.RequertApplications(request)
}
}
```

```java
Class PHA.YX.Design.Chain.GeneralManager Extends Manager
{
Method %OnNew(name As %String) As %Status [ Private, ServerOnly = 1 ]
{
	dsuper(name)
	Quit $$$OK
}
Method RequertApplications(request As Request)
{
	i (request.requestTypeGet() = "请假") d
	.w ..name _ ":" _ request.requestContentGet() _ " 数量" _ request.numberGet() _ "被批准",!
	e  i (request.requestTypeGet() = "加薪") && (request.numberGet() <=500) d
	.w ..name _ ":" _ request.requestContentGet() _ " 数量" _ request.numberGet() _ "被批准",!
	e  i (request.requestTypeGet() = "加薪") && (request.numberGet() >500) d
	.w ..name _ ":" _ request.requestContentGet() _ " 数量" _ request.numberGet() _ "再说吧",!
}
}
```

### 调用

```java
/// dclass(PHA.YX.Design.Program).Chain() 
ClassMethod Chain()
{
	s zz =class(PHA.YX.Design.Chain.CommonManager).%New("周总")
	s sz =class(PHA.YX.Design.Chain.MajorManager).%New("苏总")
	s hz =class(PHA.YX.Design.Chain.GeneralManager).%New("韩总")
	d zz.SetSuperior(sz)
	d sz.SetSuperior(hz)
	s request =class(PHA.YX.Design.Chain.Request).%New()
	d request.numberSet(1)
	d request.requestContentSet("丁竑莹请假")
	d request.requestTypeSet("请假")
	d zz.RequertApplications(request)
	s request1 =class(PHA.YX.Design.Chain.Request).%New()
	d request1.numberSet(4)
	d request1.requestContentSet("小马哥请假")
	d request1.requestTypeSet("请假")
	d zz.RequertApplications(request1)
	s request2 =class(PHA.YX.Design.Chain.Request).%New()
	d request2.numberSet(500)
	d request2.requestContentSet("姚鑫请求加薪")
	d request2.requestTypeSet("加薪")
	d zz.RequertApplications(request2)
	s request3 =class(PHA.YX.Design.Chain.Request).%New()
	d request3.numberSet(1000)
	d request3.requestContentSet("姚鑫请求加薪")
	d request3.requestTypeSet("加薪")
	d zz.RequertApplications(request3)
}
```

```java
DHC-APP>dclass(PHA.YX.Design.Program).Chain()
周总:丁竑莹请假数量1被批准
苏总:小马哥请假数量4被批准
韩总:姚鑫请求加薪 数量500被批准
韩总:姚鑫请求加薪 数量1000再说吧
```

## 思考

英雄联盟，黑铁，青铜，白银，黄金，铂金，钻石，大师，王者。请求者为对应级别才可以匹配，否则扭转。
