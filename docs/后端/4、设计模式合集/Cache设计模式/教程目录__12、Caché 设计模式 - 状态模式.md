# 12、Caché 设计模式 - 状态模式
- 来源：https://ddkk.com/zhuanlan/design/cache/12.html
- 分类：设计模式
- 分组：教程目录
## 定义

当一个对象的内在状态改变时，允许改变其行为，这个对象看起来像是改变了其类。

## 目的

状态模式主要解决当控制一个对象状态转换的条件表达式过于复杂时的情况。把状态的判断逻辑转移到表示不同状态的一系列类当中。可以把复杂的判断逻辑简单化。

## 优点

将与特定状态相关的行为局部化，并且将不同状态的行为，分割开来。

将特定的状态相关的行为都放入一个对象中，由于所有与状态相关的代码都存在与某个ConcreteState中，所以通过定义新的子类可以很容易地增加新的状态和转换。

状态模式通过把各种状态的转移逻辑分布到State的子类之间，来减少相互间依赖。

## 使用场景

当一个对象的行为取决于它的状态，并且它必须在运行时刻根据状态改变它的行为时，就可以考虑使用状态模式了。

## 与策略模式区别

策略模式的侧重点是提供不同的方法(策略)。

状态模式的行为是由状态来决定，不同状态有不同的行为。

状态模式的行为是平行的、不可替换的，策略模式是属于对象的行为模式，其行为是彼此独立可相互替换的。

## 结构图

## 描述

程序员每个小时(12,13,17,21,是否下班)描述不同的行为。

## 初级写法

硬编码,面向过程示例：

```java
/// dclass(PHA.YX.Design.Program).PrimaryState() 
ClassMethod WriteProgram(hour, finish)
{
	i hour < 12  d
	.w "当前时间：" _ hour _ "点 上午工作，精神百倍",!
	e  i hour < 13 d
	.w "当前时间：" _ hour _ "点 饿了，午饭：犯困，午休",!
	e  i hour < 17 d
	.w "当前时间：" _ hour _ "点 下午状态还不错，继续努力",!
	e  d
	.i finish d
	..w "当前时间：" _ hour _ "点 下班回家了",!
	.e  d
	..i hour < 21 d
	...w "当前时间：" _ hour _ "点 加班哦，疲惫",!
	..e  d
	...w "当前时间：" _ hour _ "点 不行了，睡觉了",!
}
/// dclass(PHA.YX.Design.Program).PrimaryState() 
ClassMethod PrimaryState(hour, finish)
{
	d ..WriteProgram(9, 0)
	d ..WriteProgram(10, 0)
	d ..WriteProgram(12, 0)
	d ..WriteProgram(13, 0)
	d ..WriteProgram(14, 0)
	d ..WriteProgram(17, 0)
	d ..WriteProgram(19, 0)
	d ..WriteProgram(22, 0)
}
```

```java
DHC-APP>dclass(PHA.YX.Design.Program).PrimaryState()
当前时间：9点 上午工作，精神百倍
当前时间：10点 上午工作，精神百倍
当前时间：12点 饿了，午饭：犯困，午休
当前时间：13点 下午状态还不错，继续努力
当前时间：14点 下午状态还不错，继续努力
当前时间：17点 加班哦，疲惫
当前时间：19点 加班哦，疲惫
当前时间：22点 不行了，睡觉了
```

## 完整示例

### 抽象状态类

```java
Class PHA.YX.Design.State.State Extends %RegisteredObject
{
Method WriteProgram(work As Work) [ Abstract ]
{
}
}
```

### 上下文类

```java
Class PHA.YX.Design.State.Work Extends %RegisteredObject
{
Property current As State [ Private ];
Method %OnNew() As %Status [ Private, ServerOnly = 1 ]
{
	s $this.current =class(PHA.YX.Design.State.ForenoonState).%New()
	Quit $$$OK
}
Property hour As %Decimal;
Method hourGet() As %Decimal [ ServerOnly = 1 ]
{
	Quit i%hour
}
Method hourSet(Arg As %Decimal) As %Status [ ServerOnly = 1 ]
{
	s i%hour = Arg
	Quit $$$OK
}
Property finish As %Boolean [ InitialExpression = 0, Private ];
Method finishGet() As %Boolean [ ServerOnly = 1 ]
{
	Quit i%finish
}
Method finishSet(Arg As %Boolean) As %Status [ ServerOnly = 1 ]
{
	s i%finish = Arg
	Quit $$$OK
}
Method SetState(state As State)
{
	s $this.current = state
}
Method WriteProgram()
{
	d ..current.WriteProgram($this)
}
}
```

## 具体状态类

```java
Class PHA.YX.Design.State.ForenoonState Extends State
{
Method WriteProgram(work As Work)
{
	i work.hourGet() < 12 d
	.w "当前时间：" _ work.hourGet() _ "点 上午工作，精神百倍",!
	e  d
	.d work.SetState(##class(PHA.YX.Design.State.NoonState).%New())
	.d work.WriteProgram()
}
}
```

```java
Class PHA.YX.Design.State.NoonState Extends State
{
Method WriteProgram(work As Work)
{
	i work.hourGet() < 13 d
	.w "当前时间：" _ work.hourGet() _ "点 饿了，午饭：犯困，午休",!
	e  d
	.d work.SetState(##class(PHA.YX.Design.State.AfternoonState).%New())
	.d work.WriteProgram()
}
}
```

```java
Class PHA.YX.Design.State.AfternoonState Extends State
{
Method WriteProgram(work As Work)
{
	i work.hourGet() < 17 d
	.w "当前时间：" _ work.hourGet() _ "点 下午状态还不错，继续努力",!
	e  d
	.d work.SetState(##class(PHA.YX.Design.State.EveningState).%New())
	.d work.WriteProgram()
}
}
```

```java
Class PHA.YX.Design.State.EveningState Extends %RegisteredObject
{
Method WriteProgram(work As Work)
{
	i work.finishGet() d
	.d work.SetState(##class(PHA.YX.Design.State.RestState).%New())
	.d work.WriteProgram()
	e  d
	.i work.hourGet() < 21 d
	..w "当前时间：" _ work.hourGet() _ "点 加班哦，疲惫",!
	.e  d
	..d work.SetState(##class(PHA.YX.Design.State.SleepingState).%New())
	..d work.WriteProgram()
}
}
```

```java
Class PHA.YX.Design.State.SleepingState Extends State
{
Method WriteProgram(work As Work)
{
	w "当前时间：" _ work.hourGet() _ "点 不行了，睡觉了",!
}
}
```

```java
Class PHA.YX.Design.State.RestState Extends State
{
Method WriteProgram(work As Work)
{
	w "当前时间：" _ work.hourGet() _ "点 下班回家了",!
}
}
```

### 调用

```java
/// dclass(PHA.YX.Design.Program).State() 
ClassMethod State()
{
	#dim mWork as PHA.YX.Design.State.Work
	s mWork =class(PHA.YX.Design.State.Work).%New()
	d mWork.hourSet(9)
	d mWork.WriteProgram()
	d mWork.hourSet(10)
	d mWork.WriteProgram()
	d mWork.hourSet(12)
	d mWork.WriteProgram()
	d mWork.hourSet(13)
	d mWork.WriteProgram()
	d mWork.hourSet(14)
	d mWork.WriteProgram()
	d mWork.hourSet(17)
	d mWork.WriteProgram()
	d mWork.finishSet(1)
	d mWork.WriteProgram()
	d mWork.hourSet(19)
	d mWork.WriteProgram()
	d mWork.hourSet(22)
	d mWork.WriteProgram()
}
```

```java
DHC-APP>dclass(PHA.YX.Design.Program).State()
当前时间：9点 上午工作，精神百倍
当前时间：10点 上午工作，精神百倍
当前时间：12点 饿了，午饭：犯困，午休
当前时间：13点 下午状态还不错，继续努力
当前时间：14点 下午状态还不错，继续努力
当前时间：17点 加班哦，疲惫
当前时间：19点 加班哦，疲惫
当前时间：22点 不行了，睡觉了
DHC-APP>dclass(PHA.YX.Design.Program).State()
当前时间：9点 上午工作，精神百倍
当前时间：10点 上午工作，精神百倍
当前时间：12点 饿了，午饭：犯困，午休
当前时间：13点 下午状态还不错，继续努力
当前时间：14点 下午状态还不错，继续努力
当前时间：17点 加班哦，疲惫
当前时间：17点 下班回家了
当前时间：19点 下班回家了
当前时间：22点 下班回家了
```

## 思考

电视机开机时可以调频道，调音量，开机关机。关机时调频道，调音量，开机关机这些状态为不能用。如何来实现。感兴趣的同学实现后可以发我一起参考下。
