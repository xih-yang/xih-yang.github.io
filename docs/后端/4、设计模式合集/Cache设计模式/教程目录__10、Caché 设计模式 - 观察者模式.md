# 10、Caché 设计模式 - 观察者模式
- 来源：https://ddkk.com/zhuanlan/design/cache/10.html
- 分类：设计模式
- 分组：教程目录
## 定义

定义对象间一种一对多的依赖关系，每当一个对象改变状态时，则所有依赖与它的对象都会得到通知并被自动更新。

## 使用目的

将一个系统分割成一系列相互协作的类有一个很不好的副作用，那就是需要维护相关对象间的一致性。我们不希望为了维持一致性而使各类紧密耦合，这样会给维护，扩展和重用都带来不便。

## 使用场景

关联行为场景，需要注意的是，关联行为是可拆分的，而不是组合关系。

事件多级触发场景。

跨系统的消息交换场景，如消息队列，事件总线的处理机制。

当一个对象的改变需要同时改变其他对象时。而且并不知道具有有多少对象有待改变时，应考虑观察者模式。

## 优点

观察者与被观察者之间是抽象耦合，容易扩展。

方便建立一套触发机制。

观察者所做的工作其实就是在解除耦合。让耦合的双方都依赖于抽象，而不是依赖于具体。从而使得各自的变化都不会影响另一边的变化。

## 缺点

应用观察者模式时需要考虑一下开发效率和运行效率的问题。

程序中包括一个被观察者，多个观察者，开发调试等内容会比较复杂，而且Java中消息的 通知一般是顺序执行的，一个卡顿会影响整体效率，这种一般开启异步子线程。

## 结构图

## 描述

老板来公司时，通知玩游戏，看股票，学习的同事赶紧工作！

## 完整实例

### 抽象观察者

```java
Class PHA.YX.Design.Observer.Observer Extends %RegisteredObject [ Abstract ]
{
Property name As %String;
Property sub As Subject;
Method %OnNew(name As %String, sub As Subject) As %Status [ Private, ServerOnly = 1 ]
{
	s $this.name=name
	s $this.sub=sub
	Quit $$$OK
}
Method Update() [ Abstract ]
{
}
}
```

### 具体观察者

```java
Class PHA.YX.Design.Observer.StockObserver Extends Observer
{
Method %OnNew(name As %String, sub As Subject) As %Status [ Private, ServerOnly = 1 ]
{
	s $this.name=name
	s $this.sub=sub
	Quit $$$OK
}
Method Update()
{
	w ..sub.subjectState _""_ ..name _ ",关闭股票行情,继续工作！"
}
}
```

```java
Class PHA.YX.Design.Observer.GameObserver Extends Observer
{
Method %OnNew(name As %String, sub As Subject) As %Status [ Private, ServerOnly = 1 ]
{
	s $this.name=name
	s $this.sub=sub
	Quit $$$OK
}
Method Update()
{
	w ..sub.subjectState _""_ ..name _ ",赶紧关闭玩游戏了,继续工作！"
}
}
```

```java
Class PHA.YX.Design.Observer.StudyObserver Extends Observer
{
Method %OnNew(name As %String, sub As Subject) As %Status [ Private, ServerOnly = 1 ]
{
	s $this.name=name
	s $this.sub=sub
	Quit $$$OK
}
Method Update()
{
	w ..sub.subjectState _""_ ..name _ ",别学习了,继续工作！"
}
}
```

### 抽象被观察者

```java
Class PHA.YX.Design.Observer.Subject Extends %RegisteredObject
{
Method Attach(observer As Observer)
{
}
Method Detach(observer As Observer)
{
}
Method Notify()
{
}
Property subjectState As %String;
Method subjectStateGet() As %String [ ServerOnly = 1 ]
{
	Quit i%subjectState
}
Method subjectStateSet(Arg As %String) As %Status [ ServerOnly = 1 ]
{
	s i%subjectState=Arg
	Quit $$$OK
}
}
```

### 具体被观察者

```java
Class PHA.YX.Design.Observer.Boss Extends Subject
{
Property observers As list Of Observer;
Property action As %String;
Method Attach(observer As Observer)
{
	d ..observers.Insert(observer)
}
///考虑如何用键值对的值来删除对应数组数据
Method Detach(observer As Observer)
{
	d ..observers.RemoveAt(observer)
}
Method Notify()
{
	f i = 1 : 1 : ..observers.Count() d
	.d ..observers.GetAt(i).Update()
	.w !
}
}
```

### 调用

```java
/// dclass(PHA.YX.Design.Program).Observer() 
ClassMethod Observer()
{
	#dim mBoss as PHA.YX.Design.Observer.Boss
	s mBoss =class(PHA.YX.Design.Observer.Boss).%New()
	#dim mStockObserver as PHA.YX.Design.Observer.StockObserver
	s mStockObserver =class(PHA.YX.Design.Observer.StockObserver).%New("马玉强", mBoss)
	#dim mGameObserver as PHA.YX.Design.Observer.GameObserver
	s mGameObserver =class(PHA.YX.Design.Observer.GameObserver).%New("丁竑莹", mBoss)
	#dim mStudyObserver as PHA.YX.Design.Observer.StudyObserver
	s mStudyObserver =class(PHA.YX.Design.Observer.StudyObserver).%New("云海宝", mBoss)
	d mBoss.Attach(mStockObserver)
	d mBoss.Attach(mGameObserver)
	d mBoss.Attach(mStudyObserver)
	s mBoss.subjectState = "老板回来了!"
	d mBoss.Notify()
	w "删除其中一个",!
	d mBoss.Detach(3)
	d mBoss.Notify()
}
```

```java
DHC-APP>dclass(PHA.YX.Design.Program).Observer()
老板回来拉!马玉强,关闭股票行情,继续工作！
老板回来拉!丁竑莹,赶紧关闭玩游戏了,继续工作！
老板回来拉!云海宝,别学习了,继续工作！
删除其中一个
老板回来拉!马玉强,关闭股票行情,继续工作！
老板回来拉!丁竑莹,赶紧关闭玩游戏了,继续工作！
```

思考
模拟微信，微博，QQ用户，通知张无忌结婚了。感兴趣的同学实现后可以发我一起参考下。
