# 19、Caché 设计模式 - 命令模式
- 来源：https://ddkk.com/zhuanlan/design/cache/19.html
- 分类：设计模式
- 分组：教程目录
## 定义

命令模式将每个请求封装成一个对象，从而让用户使用不同的请求把客户端参数化；将请求进行排队或者记录请求日志，以及支持可撤销操作。

## 优点

行为请求和行为实现弱耦合，易扩展，修改，维护。

把请求一个操作的对象与知道怎么执行一个操作的对象分割开。

## 缺点

设计模式通病，大量衍生类的创建。

## 作用

它较容易地设计一个命令队列。

在需要情况下，可以较容易地将命令计入日志。

允许接收请求的一方决定是否要否决请求。

可以容易地实现对请求的撤销和重做。

由于加进新的具体命令类不影响其他的类，因此增加新的具体命令类很容易。

## 结构图

## 描述

去烧烤店吃烧烤，点烤鸡翅和羊肉串给厨房下命令。

## 完整示例

### 烧烤者

```java
Class PHA.YX.Design.Command.Barbecuer Extends %RegisteredObject
{
Method BakeMutton()
{
	w "烤羊肉串!",!
}
Method BakeChickenWing()
{
	w "烤鸡翅!",!
}
}
```

### 抽象命令

```java
Class PHA.YX.Design.Command.Command Extends %RegisteredObject
{
Property receiver As Barbecuer [ Private ];
Method %OnNew(receiver As Barbecuer) As %Status [ Private, ServerOnly = 1 ]
{
	s ..receiver = receiver
	Quit $$$OK
}
Method ExcuteCommand() [ Abstract ]
{
}
}
```

### 具体命令

```java
Class PHA.YX.Design.Command.BakeMuttonCommand Extends Command
{
Method %OnNew(receiver As Barbecuer) As %Status [ Private, ServerOnly = 1 ]
{
	dsuper(receiver)
	Quit $$$OK
}
Method ExcuteCommand()
{
	d ..receiver.BakeMutton()
}
}
```

```java
Class PHA.YX.Design.Command.BakeChickenWingCommand Extends Command
{
Method %OnNew(receiver As Barbecuer) As %Status [ Private, ServerOnly = 1 ]
{
	dsuper(receiver)
	Quit $$$OK
}
Method ExcuteCommand()
{
	d ..receiver.BakeChickenWing()
}
}
```

### 服务员

```java
Class PHA.YX.Design.Command.Waiter Extends %RegisteredObject
{
Property orders As list Of Command [ Private ];
Method SetOrder(command As Command)
{
	d ..orders.Insert(command)
	w "增加订单" _ command.%ClassName() _ "时间" _ $zd($h,3) _ " " _ $zt($p($h, ",", "2"),1),!
}
Method CancelOrder(command As Command)
{
	d ..orders.RemoveAt(command)
	w "取消订单" _ command.%ClassName() _ "时间" _ $zd($h,3) _ " " _ $zt($p($h, ",", "2"),1),!
}
Method Notify()
{
	f i = 1 : 1 : ..orders.Count() d
	.d ..orders.GetAt(i).ExcuteCommand()
}
}
```

### 调用

```java
/// dclass(PHA.YX.Design.Program).Command() 
ClassMethod Command()
{
	#dim boy as PHA.YX.Design.Command.Barbecuer
	s boy =class(PHA.YX.Design.Command.Barbecuer).%New()
	s bakeMuttonCommand1 =class(PHA.YX.Design.Command.BakeMuttonCommand).%New(boy)
	s bakeMuttonCommand2 =class(PHA.YX.Design.Command.BakeMuttonCommand).%New(boy)
	s bakeChickenWingCommand1 =class(PHA.YX.Design.Command.BakeChickenWingCommand).%New(boy)
	#dim girl as PHA.YX.Design.Command.Waiter
	s girl =class(PHA.YX.Design.Command.Waiter).%New()
	d girl.SetOrder(bakeMuttonCommand1)
	d girl.SetOrder(bakeMuttonCommand1)
	d girl.CancelOrder(bakeMuttonCommand1)
	d girl.SetOrder(bakeChickenWingCommand1)
	d girl.Notify()
}
```

```java
DHC-APP>dclass(PHA.YX.Design.Program).Command()
增加订单BakeMuttonCommand时间2020-04-07 09:43:56
增加订单BakeMuttonCommand时间2020-04-07 09:43:56
取消订单BakeMuttonCommand时间2020-04-07 09:43:56
增加订单BakeChickenWingCommand时间2020-04-07 09:43:56
烤羊肉串!
烤羊肉串!
烤鸡翅!
```

## 思考

电视机有 声音增大，减小，节目增加，减少，四个命令。客户端调用这四个命令。感兴趣的同学写完可以发我。
