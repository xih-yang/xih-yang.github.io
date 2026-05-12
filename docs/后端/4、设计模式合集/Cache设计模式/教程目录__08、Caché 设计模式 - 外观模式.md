# 08、Caché 设计模式 - 外观模式
- 来源：https://ddkk.com/zhuanlan/design/cache/8.html
- 分类：设计模式
- 分组：教程目录
## 定义

为子系统的一组接口提供一个一致的界面，此模式定义了一个高层接口，这个接口使得这一子系统更加容易使用。

## 优点

减少系统的相互依赖，所以的依赖都是对外观类的依赖，与子系统无关。

对用户隐藏了子系统的具体实现，减少用户对子系统的耦合，这样即使具体的子系统发生了变化，用户也感知不到。

加强了安全性，子系统中的方法如果不在外观类中开通，就无法访问到子系统中的方法。

## 缺点

不符合开放封闭原则，如果业务出现变更，则可能要直接修改外观类

## 使用场景

构建一个有层次结构的子系统时，使用外观模式定义子系统中每层的入口点。

如果子系统之间是相互依赖的，则可以让其通过外观接口进行通信，减少子系统之间的依赖关系。

子系统往往会因为不断的重构演化而变得越来越复杂，大多数的模式使用也会产生很多很小的类，这给外部调用他们的用户程序带来了使用上的困难。

我们可以使用外观类提供一个简单的接口，对外隐藏子系统的具体实现并隔离变化。

当维护一个遗留的大型系统时，可能这个系统已经非常难以维护和拓展；但因为它含有重要的功能。所以新的需要必须依赖于它，这时可以使用外观类

为设计粗糙或者复杂的遗留代码提供一个简单的接口，让新系统和外观类交互，而外观类负责与遗留的代码进行交互。

## 何时使用外观模式

首先，在设计初期阶段，应该要有意识的将不同的两个层分离，比如经典的三层架构，就需要考虑在数据访问层和业务逻辑层，业务逻辑层和表示层的层与层之间建立外观facade，这样可以为复杂的子系统提供一个简单的接口，使用耦合大大降低。

其次，在开发阶段，子系统往往因为为不断的重构演化而变得越来越复杂，大多数模式使用时也都会产生很多很小的类，这本是好事，但也给外部调用他们的用户程序带来了使用上的困难，增加外观模式Facade可以提供一个简单的接口，减少他们之间的依赖。

第三，在维护一个遗留的大型系统时，可能这个系统已经非常难以维护和扩展了，但因为它包含很多非常重要的功能，新的需求开发必须要依赖它，此时用外观模式也是非常合适的。

可以为新系统开发一个外观Facade类，来提供设计粗糙或高度复杂的遗留代码的比较清晰简单的接口，让新系统与Facade对象交互，Facade与遗留代码交互所有复杂的工作。

## 结构图

## 完整示例

### 子系统类

```java
Class PHA.YX.Design.Facade.SubSystemOne Extends %RegisteredObject
{
Method MethodOne()
{
	w "子系统方法一",!
}
}
```

```java
Class PHA.YX.Design.Facade.SubSystemTwo Extends %RegisteredObject
{
Method MethodTwo()
{
	w "子系统方法二",!
}
}
```

```java
Class PHA.YX.Design.Facade.SubSystemThree Extends %RegisteredObject
{
Method MethodThree()
{
	w "子系统方法三",!
}
}
```

```java
    Class PHA.YX.Design.Facade.SubSystemFour Extends %RegisteredObject
{
Method MethodFour()
{
	w "子系统方法四",!
}
}
```

### 外观类

```java
Class PHA.YX.Design.Facade.Facade Extends %RegisteredObject
{
Property mSubSystemOne As SubSystemOne;
Property mSubSystemTwo As SubSystemTwo;
Property mSubSystemThree As SubSystemThree;
Property mSubSystemFour As SubSystemFour;
Method %OnNew() As %Status [ Private, ServerOnly = 1 ]
{
	s ..mSubSystemOne =class(SubSystemOne).%New()
	s ..mSubSystemTwo =class(SubSystemTwo).%New()
	s ..mSubSystemThree =class(SubSystemThree).%New()
	s ..mSubSystemFour =class(SubSystemFour).%New()
	Quit $$$OK
}
Method MethodA()
{
	w "MethodA()",!
	d ..mSubSystemOne.MethodOne()
	d ..mSubSystemTwo.MethodTwo()
	d ..mSubSystemThree.MethodThree()
}
Method MethodB()
{
	w "MethodB()",!
	d ..mSubSystemTwo.MethodTwo()
	d ..mSubSystemThree.MethodThree()
	d ..mSubSystemFour.MethodFour()
}
}
```

### 调用

```java
/// dclass(PHA.YX.Design.Program).Facade() 
ClassMethod Facade()
{
	#dim mFacade as PHA.YX.Design.Facade.Facade
	s mFacade =class(PHA.YX.Design.Facade.Facade).%New()
	d mFacade.MethodA()
	w !
	d mFacade.MethodB()
}
```

```java
DHC-APP>dclass(PHA.YX.Design.Program).Facade()
MethodA()
子系统方法一
子系统方法二
子系统方法三
MethodB()
子系统方法二
子系统方法三
子系统方法四
```

## 思考

有一些武林绝学，比如经脉，内功（九阳神功，乾坤大挪移），招式（太极拳，七伤拳，圣火令）。外观随意组合这些招数应对不同的敌人。感兴趣的同学实现后可以发我一起参考下。
