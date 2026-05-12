# 09、Caché 设计模式 - 模版方法模式
- 来源：https://ddkk.com/zhuanlan/design/cache/9.html
- 分类：设计模式
- 分组：教程目录
## 定义

定义一个操作中的算法框架，而将一些步骤延迟到子类中，使得子类不改变一个算法的结构即可重定义算法的某些特定步骤。

## 使用场景

多个子类有共有的方法，并且逻辑基本相同时。

面对重要，复杂的算法，可以把核心算法设计为模版方法，周边相关细节功能则由子类实现。

需求通过子类来决定父类算法中的某个步骤是否执行，实现子类对父类的反向控制。

## 优点

模版模式通过把不变的行为搬移到超类，去除了子类中的重复代码。

子类实现算法的某些细节，有助于算法的扩展。

模版方法就是提供了一个很好的代码复用平台。

## 缺点

每个不同的实现都需要定义一个子类，这会导致类的个数增加，设计更加抽象。

## 特点

当不变的和可变的行为在方法的子类实现中混合在一起的时候，不变的行为就会在子类中重复出现。我们通过模版方法把这些行为搬移到单一的地方，这样就帮助子类摆脱重复的不变行为的纠缠。

## 结构图

## 描述

灭绝师太与张三丰对打，分别开启不同的内功，经脉，武功，武器，步伐。

## 完整示例

### 创建抽象类，定义完整框架

```java
Class PHA.YX.Design.TemplateMethod.AbstractSwordsMan Extends %RegisteredObject [ Abstract ]
{
Method Fighting() [ Final ]
{
	d ..NeiGong()
	d ..JingMai()
	i ..HasWeapons() d
	.d ..Weapons()
	d ..Moves()
	d ..Hook()
}
Method Hook()
{
}
Method NeiGong() [ Abstract ]
{
}
Method Weapons() [ Abstract ]
{
}
Method Moves() [ Abstract ]
{
}
Method JingMai()
{
	w "开启七经八脉",!
}
Method HasWeapons() As %Boolean
{
	q $$$YES
}
}
```

### 具体实现类

```java
Class PHA.YX.Design.TemplateMethod.ZhangSanFeng Extends AbstractSwordsMan
{
Method HasWeapons() As %Boolean
{
	q $$$NO
}
Method Moves()
{
	w "凌波微步",!
}
Method NeiGong()
{
	w "运行九阳神功",!
}
Method Weapons()
{
}
}
```

```java
Class PHA.YX.Design.TemplateMethod.MieJueShiTai Extends AbstractSwordsMan
{
Method HasWeapons() As %Boolean
{
	q $$$YES
}
Method Hook()
{
	w "倚天剑被夺走，逃跑",!
}
Method Moves()
{
	w "使用隐身",!
}
Method NeiGong()
{
	w "九阴真经",!
}
Method Weapons()
{
	w "使用倚天剑",!
}
}
```

### 调用

```java
/// dclass(PHA.YX.Design.Program).TemplateMethod() 
ClassMethod TemplateMethod()
{
	#dim zsf as PHA.YX.Design.TemplateMethod.AbstractSwordsMan
	s zsf =class(PHA.YX.Design.TemplateMethod.ZhangSanFeng).%New()
	d zsf.Fighting()
	w !
	#dim mhst as PHA.YX.Design.TemplateMethod.AbstractSwordsMan
	s mhst =class(PHA.YX.Design.TemplateMethod.MieJueShiTai).%New()
	d mhst.Fighting()
}
```

```java
DHC-APP>dclass(PHA.YX.Design.Program).TemplateMethod()
运行九阳神功
开启七经八脉
凌波微步
九阴真经
开启七经八脉
使用倚天剑
使用隐身
倚天剑被夺走，逃跑
```

## 思考

两个同学做试卷，抽取重复的代码,提炼代码，用模版方法如何实现，并给出调用

```java
Class PHA.YX.Design.TemplateMethod.TestPaperA Extends %RegisteredObject
{
Method TestQuestion1()
{
	w "杨过得到，后来给了郭靖，炼成倚天剑，屠龙刀的玄铁可能是[]a.球墨铸铁 b.马口铁 c.高速合金钢 d.碳素纤维"
	w "答案：b"
}
Method TestQuestion2()
{
	w "杨过,程英，陆无双铲除了情花，造成[]a.使这植物不再害人 b. 使一种珍惜物种灭绝 c.破坏了那个生物圈的生态平衡 d.造成该地区沙漠化"
	w "答案：a"
}
Method TestQuestion3()
{
	w "杨过在绝情谷中了[]毒a.阿司匹林 b.牛黄解毒片 c.情花毒 d.以上全不对"
	w "答案：c"
}
}
```

```java
Class PHA.YX.Design.TemplateMethod.TestPaperB Extends %RegisteredObject
{
Method TestQuestion1()
{
	w "杨过得到，后来给了郭靖，炼成倚天剑，屠龙刀的玄铁可能是[]a.球墨铸铁 b.马口铁 c.高速合金钢 d.碳素纤维"
	w "答案：d"
}
Method TestQuestion2()
{
	w "杨过,程英，陆无双铲除了情花，造成[]a.使这植物不再害人 b. 使一种珍惜物种灭绝 c.破坏了那个生物圈的生态平衡 d.造成该地区沙漠化"
	w "答案：c"
}
Method TestQuestion3()
{
	w "杨过在绝情谷中了[]毒a.阿司匹林 b.牛黄解毒片 c.情花毒 d.以上全不对"
	w "答案：a"
}
}
```

感兴趣的同学实现后可以发我一起参考下。
