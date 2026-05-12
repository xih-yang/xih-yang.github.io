# 24、Caché 设计模式 - 访问者模式
- 来源：https://ddkk.com/zhuanlan/design/cache/24.html
- 分类：设计模式
- 分组：教程目录
## 定义

表示一个作用域某对象结构中的各元素的操作。它使你可以在不改变各元素的类的前提下定义作用与这些元素的新操作。

## 使用场景

被访问者不变

根据访问者和被访问者的不同，两两对应达到不同的目的。

遍历被访问者实现“访问”。

访问者模式适用于数据结构相对稳定的系统，他把数据结构和作用于结构上的操作之间的耦合解脱开，使得操作集合可以相对自由地演化。

## 目的

访问者模式目的是要把处理从数据结构分离出来。很多系统可以按照算法和数据结构分开，如果这样的系统有比较稳定的数据结构，又易于变化的算法的话使用访问者模式就是比较合适的。因为访问者模式使得算法操作的增加变得容易。

## 优点

各角色职责分离，符合单一原则。

扩展十分方便，灵活。

数据结构和数据结构上的操作解耦。

## 缺点

被访问者对访问者公布了细节，违反迪米特原则。

被访问者要改动的时候，修改十分麻烦。

访问者和被访者为了达到不同的行为目的的时候，为了区分依赖类的不同，没有依赖抽象。

## 结构图

## 描述

用访问者模式来改写。

```java
/// dclass(PHA.YX.Design.Program).VisitorMethod() 
ClassMethod VisitorMethod()
{
	w "男人成功时，背后多半有个伟大的女人",!
	w "女人成功时，背后大多有一个不成功的男人",!
	w "男人失败时，闷头喝酒，谁也不用劝",!
	w "女人失败时，眼泪汪汪，谁也劝不了",!
	w "男人恋爱时，凡事不懂也要装懂",!
	w "女人恋爱时，遇事懂也装作不懂",!
}
```

## 完整示例

### 状态抽象类

```java
Class PHA.YX.Design.Visitor.Action Extends %RegisteredObject [ Abstract ]
{
Method GetManConclusion(concreteElementA As Man) [ Abstract ]
{
}
Method GetWomanConclusion(concreteElementB As Woman) [ Abstract ]
{
}
}
```

### 人抽象类

```java
Class PHA.YX.Design.Visitor.Person Extends %RegisteredObject [ Abstract ]
{
Method Accept(visitor As Action) [ Abstract ]
{
}
}
```

### 具体状态类

```java
Class PHA.YX.Design.Visitor.Success Extends Action
{
Method GetManConclusion(concreteElementA As Man)
{
	w concreteElementA.%ClassName(0) _ " " _$this.%ClassName(0) _ " 背后多半有一个伟大的女人",!
}
Method GetWomanConclusion(concreteElementB As Woman)
{
	w concreteElementB.%ClassName(0) _ " " _$this.%ClassName(0) _ " 背后多半有一个不成功的男人",!
}
}
```

```java
Class PHA.YX.Design.Visitor.Failing Extends Action
{
Method GetManConclusion(concreteElementA As Man)
{
	w concreteElementA.%ClassName(0) _ " " _$this.%ClassName(0) _ " 闷头喝酒，谁也不用劝",!
}
Method GetWomanConclusion(concreteElementB As Woman)
{
	w concreteElementB.%ClassName(0) _ " " _$this.%ClassName(0) _ " 眼泪汪汪，谁也劝不了",!
}
}
```

```java
Class PHA.YX.Design.Visitor.Amativeness Extends Action
{
Method GetManConclusion(concreteElementA As Man)
{
	w concreteElementA.%ClassName(0) _ " " _ $this.%ClassName(0) _ " 凡事不懂也要装懂",!
}
Method GetWomanConclusion(concreteElementB As Woman)
{
	w concreteElementB.%ClassName(0) _ " " _$this.%ClassName(0) _ " 遇事懂也装作不懂",!
}
}
```

```java
Class PHA.YX.Design.Visitor.Marriage Extends Action
{
Method GetManConclusion(concreteElementA As Man)
{
	w concreteElementA.%ClassName(0) _ " " _ $this.%ClassName(0) _ " 感概道：恋爱游戏终结时,进入爱情的坟墓",!
}
Method GetWomanConclusion(concreteElementB As Woman)
{
	w concreteElementB.%ClassName(0) _ " " _$this.%ClassName(0) _ " 爱情长跑路漫漫，婚宴保险保平安",!
}
}
```

### 具体人类

```java
Class PHA.YX.Design.Visitor.Man Extends Person
{
Method Accept(visitor As Action)
{
	d visitor.GetManConclusion($this)
}
}
```

```java
Class PHA.YX.Design.Visitor.Woman Extends Person
{
Method Accept(visitor As Action)
{
	d visitor.GetWomanConclusion($this)
}
}
```

### 对象结构类

```java
Class PHA.YX.Design.Visitor.ObjectStructure Extends %RegisteredObject
{
Property elements As list Of Person;
Method Attach(element As Person)
{
	d ..elements.Insert(element)
}
Method Remove(element As Person)
{
	d ..elements.RemoveAt(element)
}
Method Display(visitor As Action)
{
	f i = 1 : 1 : ..elements.Count() d
	.d ..elements.GetAt(i).Accept(visitor)
}
}
```

### 调用

```java
/// dclass(PHA.YX.Design.Program).Visitor() 
ClassMethod Visitor()
{
	s o =class(PHA.YX.Design.Visitor.ObjectStructure).%New()
	d o.Attach(##class(PHA.YX.Design.Visitor.Man).%New())
	d o.Attach(##class(PHA.YX.Design.Visitor.Woman).%New())
	s v1 = class(PHA.YX.Design.Visitor.Success).%New()
	d o.Display(v1)
	s v2 = class(PHA.YX.Design.Visitor.Failing).%New()
	d o.Display(v2)
	s v3 = class(PHA.YX.Design.Visitor.Amativeness).%New()
	d o.Display(v3)
}
```

```java
DHC-APP>dclass(PHA.YX.Design.Program).Visitor()
Man Success 背后多半有一个伟大的女人
Woman Success 背后多半有一个不成功的男人
Man Failing 闷头喝酒，谁也不用劝
Woman Failing 眼泪汪汪，谁也劝不了
Man Amativeness 凡事不懂也要装懂
Woman Amativeness 遇事懂也装作不懂
```

## 思考

语文老师，数学老师，体育老师，分别访问 艺术生和体育生的成绩。
