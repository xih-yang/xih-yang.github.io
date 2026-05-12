# 01、Caché 设计模式 - 简单工厂模式
- 来源：https://ddkk.com/zhuanlan/design/cache/1.html
- 分类：设计模式
- 分组：教程目录
## 定义

简单工厂模式属于创建型模式，又可称为静态工厂模式，这是由一个工厂对象决定创建出哪一种产品类的实例。

## 使用场景

工厂类负责创建的对象比较少。

客户只需知道传入工厂类的参数，而无须关心创建对象的逻辑。

## 优点

使用户根据参数获得对一个的类实例，避免了直接实例化类型，降低了耦合性。

能把客户类和具体子类的实现解耦，客户类不再需要知道有哪些子类以及应当实例化哪个子类：客户类往往有多个，如果不使用简单工厂，那么所有的客户类都要知道所有子类的细节。而且一旦子类发生改变，所有的客户类都要进行修改。

## 缺点

可实例化的类型在编译期间已经被确定。

如果增加新类型，则需要修改工厂，这违背了开放封闭原则。

子类多过不适合使用。

## 示例

用Caché 实现一个计算器控制台程序，要求输入两个数和运算符号。

可能会写成这样：

```java
/// wclass(PHA.YX.Design.Program).GetResult() 
ClassMethod GetResult()
{
	READ "输入第一个数字：", numberA,!
	READ "输入操作符：", operate,!
	READ "输入第二个数字：", numberB,!
	s result = ""
	i operate = "+" d
	.s result = numberA + numberB
	i operate = "-" d
	.s result = numberA - numberB
	i operate = "*" d
	.s result = numberA * numberB
	i operate = "/" d
	.s result = numberA / numberB
	q result
}
```

缺点：

**1、** if表达式每次都需要判断，等于计算机做了三次无用功；

**2、** 如果除法，输入了0，除法会报错；

```java
DHC-APP> wclass(PHA.YX.Design.Program).GetResult()
输入第一个数字：1
输入操作符：/
输入第二个数字：1.5
.6666666666666666667
DHC-APP> wclass(PHA.YX.Design.Program).GetResult()
输入第一个数字：1
输入操作符：/
输入第二个数字：0
 .s result = numberA / numberB
  ^
<DIVIDE>zGetResult+12^PHA.YX.Design.Program.1
```

如果改成swtich(`$`case)

可能会写成这样：

```java
/// wclass(PHA.YX.Design.Program).GetResultCase() 
ClassMethod GetResultCase()
{
	READ "输入第一个数字：", numberA,!
	READ "输入操作符：", operate,!
	READ "输入第二个数字：", numberB,!
	s result= $case(operate,
				"+" : numberA + numberB,
				"-" : numberA + numberB,
				"*" : numberA + numberB,
				"/" : numberA + numberB)
	q result
}
```

缺点：

**1、** 如果加减乘除方法非常大，每次修改其中一个都会编译其他三个运算方法；

**2、** 增加错误修改，可能日后修改代码修改错；

## 结构图

## 完整示例

利用面相对象的继承和多态。

增加一个幂次运算。

由此例子举一反三。

改修运算，只需要去对应的类去修改就好了。只编译对应的类。

### 注意

Operation类的numberA，numberB为私有字段属性，其他类无法调用。InitialExpression设置初始值。

Operation类的numberA，numberB字段，Get，Set方法中的属性，要用i%property,否则报出递归错误。

Operation类GetResult()为抽象方法，子类需要重新实现。

Program类SimpleFactory()方法,要显示生命oper类型，否则无法用“.”语法。

OperationFactory类返回的是Operation类对象，这里及是多态。

其他操作类均为继承类Operation类的子类，重写Operation类GetResult()方法。

### 调用

```java
Class PHA.YX.Design.Program Extends %RegisteredObject
{
/// wclass(PHA.YX.Design.Program).SimpleFactory() 
ClassMethod SimpleFactory()
{
	READ "输入第一个数字：", numberA,!
	READ "输入操作符：", operate,!
	READ "输入第二个数字：", numberB,!
	# dim oper as PHA.YX.Design.SimpleFactory.Operation 
	s oper =class(PHA.YX.Design.SimpleFactory.OperationFactory).CreateOperate(operate)
	d oper.numberASet(numberA)
	d oper.numberBSet(numberB) 
	s result = oper.GetResult()
	q result
}
}
```

#### 输出

```java
DHC-APP>wclass(PHA.YX.Design.Program).SimpleFactory()
输入第一个数字：1
输入操作符：+
输入第二个数字：1
2
DHC-APP>wclass(PHA.YX.Design.Program).SimpleFactory()
输入第一个数字：2
输入操作符：-
输入第二个数字：3
-1
DHC-APP>wclass(PHA.YX.Design.Program).SimpleFactory()
输入第一个数字：6
输入操作符：*
输入第二个数字：3
18
DHC-APP>wclass(PHA.YX.Design.Program).SimpleFactory()
输入第一个数字：1
输入操作符：/
输入第二个数字：1.5
0.6666666666666666667
DHC-APP>wclass(PHA.YX.Design.Program).SimpleFactory()
输入第一个数字：1
输入操作符：/
输入第二个数字：0
除数不能为0。
DHC-APP>wclass(PHA.YX.Design.Program).SimpleFactory()
输入第一个数字：3
输入操作符：**
输入第二个数字：3
27
```

### 工厂类

```java
Class PHA.YX.Design.SimpleFactory.OperationFactory Extends %RegisteredObject
{
ClassMethod CreateOperate(operate As %String) As Operation
{
	# dim oper as PHA.YX.Design.SimpleFactory.Operation 
	s oper = $case(operate,
				"+" :class(PHA.YX.Design.SimpleFactory.OperationAdd).%New(),
				"-" :class(PHA.YX.Design.SimpleFactory.OperationSub).%New(),
				"*" :class(PHA.YX.Design.SimpleFactory.OperationMul).%New(),
				"/" :class(PHA.YX.Design.SimpleFactory.OperationDiv).%New(),
				"**" :class(PHA.YX.Design.SimpleFactory.OperationIndex).%New())
	q oper
}
}
```

### 运算类

```java
Class PHA.YX.Design.SimpleFactory.Operation Extends %RegisteredObject
{
Property numberA As %Decimal [ InitialExpression = 0, Private ];
Method numberAGet() As %String [ ServerOnly = 1 ]
{
	Quit i%numberA
}
Method numberASet(Arg As %String) As %Status [ ServerOnly = 1 ]
{
	s i%numberA = Arg
	Quit $$$OK
}
Property numberB As %Decimal [ InitialExpression = 0, Private ];
Method numberBGet() As %String [ ServerOnly = 1 ]
{
	Quit i%numberB
}
Method numberBSet(Arg As %String) As %Status [ ServerOnly = 1 ]
{
	s i%numberB = Arg
	Quit $$$OK
}
Method GetResult() [ Abstract ]
{
	s result = 0
	q result
}
}
```

### 加法类

```java
Class PHA.YX.Design.SimpleFactory.OperationAdd Extends PHA.YX.Design.SimpleFactory.Operation
{
Method GetResult()
{
	s reulst = 0
	s reulst = ..numberAGet() + ..numberBGet()
	q reulst
}
}
```

### 减法类

```java
Class PHA.YX.Design.SimpleFactory.OperationSub Extends PHA.YX.Design.SimpleFactory.Operation
{
Method GetResult()
{
	s reulst = 0
	s reulst = ..numberAGet() - ..numberBGet()
	q reulst
}
}
```

### 乘法类

```java
Class PHA.YX.Design.SimpleFactory.OperationMul Extends PHA.YX.Design.SimpleFactory.Operation
{
Method GetResult()
{
	s reulst = 0
	s reulst = ..numberAGet() * ..numberBGet()
	q reulst
}
}
```

### 除法类

```java
Class PHA.YX.Design.SimpleFactory.OperationDiv Extends PHA.YX.Design.SimpleFactory.Operation
{
Method GetResult()
{
	s reulst = 0
	q:..numberBGet()=0 "除数不能为0。"
	s reulst = ..numberAGet() / ..numberBGet()
	q reulst
}
}
```

### 指数类

```java
Class PHA.YX.Design.SimpleFactory.OperationIndex Extends PHA.YX.Design.SimpleFactory.Operation
{
Method GetResult()
{
	s reulst = 0
	s reulst = ..numberAGet() ** ..numberBGet()
	q reulst
}
}
```

## 思考

厂家可以生产各种品牌电脑，例如hp，lenovo，asus等品牌。简单工厂模式如何实现。感兴趣的同学实现后可以发我一起参考下。
