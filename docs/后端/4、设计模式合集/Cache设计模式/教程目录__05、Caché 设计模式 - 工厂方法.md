# 05、Caché 设计模式 - 工厂方法
- 来源：https://ddkk.com/zhuanlan/design/cache/5.html
- 分类：设计模式
- 分组：教程目录
工厂方法模式实现，客户端需要决定实例化哪一个工厂来实现运算类，选择判断的问题还是存在的，也就是说，工厂方法把简单工厂的内部逻辑判断移到了客户端来进行，你想加功能，本来是改工厂类，现在是修改客户端。

## 完整示例

## 结构图

### 抽象对象类

```java
Class PHA.YX.Design.Factory.Computer Extends %RegisteredObject
{
Method Create() [ Abstract ]
{
}
Method Install() [ Abstract ]
{
}
}
```

### 实例对象类

```java
Class PHA.YX.Design.Factory.HPComputer Extends Computer
{
Method Create()
{
	w "创建了HP电脑",!
}
Method Install()
{
	w "安装了HP电脑",!
}
}
```

```java
Class PHA.YX.Design.Factory.LenovoComputer Extends Computer
{
Method Create()
{
	w "创建了Lenovo电脑",!
}
Method Install()
{
	w "安装了Lenovo电脑",!
}
}
```

### 抽象工厂类

```java
Class PHA.YX.Design.Factory.IFactory [ Abstract ]
{
ClassMethod CreateComputer() As Computer [ Abstract ]
{
}
}
```

### 实例工厂类

```java
Class PHA.YX.Design.Factory.HPFactory Extends (%RegisteredObject, IFactory)
{
ClassMethod CreateComputer() As Computer
{
	qclass(HPComputer).%New()
}
}
```

```java
Class PHA.YX.Design.Factory.LenovoFactory Extends (%RegisteredObject, IFactory)
{
ClassMethod CreateComputer() As Computer
{
	qclass(LenovoComputer).%New()
}
}
```

### 调用

```java
/// dclass(PHA.YX.Design.Program).Factory() 
ClassMethod Factory()
{
	#dim factory as PHA.YX.Design.Factory.IFactory
	s factory =class(PHA.YX.Design.Factory.HPFactory).%New()
	#dim hpComputer as PHA.YX.Design.Factory.Computer
	s hpComputer = factory.CreateComputer()
	d hpComputer.Create()
	d hpComputer.Install()
	s factory =class(PHA.YX.Design.Factory.LenovoFactory).%New()
	#dim lenovoComputer as PHA.YX.Design.Factory.Computer
	s lenovoComputer = factory.CreateComputer()
	d lenovoComputer.Create()
	d lenovoComputer.Install()
}
```

```java
DHC-APP> dclass(PHA.YX.Design.Program).Factory()
创建了HP电脑
安装了HP电脑
创建了Lenovo电脑
安装了Lenovo电脑
```

## 思考

用第一章的计算案例，来改写成工厂模式。感兴趣的同学实现后可以发我一起参考下。
