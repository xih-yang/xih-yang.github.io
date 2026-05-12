# 02、 Golang 设计模式：02_工厂方法模式
- 来源：https://ddkk.com/zhuanlan/design/golang/2.html
- 分类：设计模式
- 分组：教程目录
## 1、介绍

#### 1.1 定义

工厂方法模式，又称工厂模式、多态工厂模式和虚拟构造器模式，通过定义工厂父类负责定义创建对象的公共接口，而子类则负责生成具体的对象。

#### 1.2 主要作用

将类的实例化（具体产品的创建）延迟到工厂类的子类（具体工厂）中完成，即由子类来决定应该实例化（创建）哪一个类。

#### 1.3 解决的问题

工厂一旦需要生产新产品就需要修改工厂类的方法逻辑，违背了“开放 - 关闭原则

> 即简单工厂模式的缺点
> 之所以可以解决简单工厂的问题，是因为工厂方法模式把具体产品的创建推迟到工厂类的子类（具体工厂）中，此时工厂类不再负责所有产品的创建，而只是给出具体工厂必须实现的接口，这样工厂方法模式在添加新产品的时候就不修改工厂类逻辑而是添加新的工厂子类，符合开放封闭原则，克服了简单工厂模式中缺点

## 2、模式原理

#### 2.1 UML类图

#### 2.2 模式组成

组成（角色）
关系
作用

抽象产品（Product）
具体产品的父类
描述具体产品的公共接口

具体产品（Concrete Product） -------ProductA、ProductB
抽象产品的子类；工厂类创建的目标类
描述生产的具体产品

抽象工厂（Creator）--------Factory
具体工厂的父类
描述具体工厂的公共接口

具体工厂（Concrete Creator）------FactoryA、FactoryB
抽象工厂的子类；被外界调用
描述具体工厂；实现FactoryMethod工厂方法创建产品的实例

####

#### 2.3 使用步骤

**步骤1：** 创建**抽象工厂类**，定义具体工厂的公共接口；

**步骤2：** 创建**抽象产品类** ，定义具体产品的公共接口；

**步骤3：** 创建**具体产品类**（继承抽象产品类） & 定义生产的具体产品；

**步骤4：创建**具体工厂类（继承抽象工厂类），定义创建对应具体产品实例的方法；

**步骤5：外界通过调用具体工厂类的方法，从而创建不同**具体产品类的实例

## 3、示例

示例代码：

```java
package main
//==============2.工厂模式===================
//Operator 是被封装的实际类接口
type Operator interface {
	SetA(int)
	SetB(int)
	Result() int
}
//OperatorFactory 是工厂接口
type OperatorFactory interface {
	Create() Operator
}
//OperatorBase 是Operator 接口实现的基类，封装公用方法
type OperatorBase struct {
	a, b int
}
//SetA 设置 A
func (o *OperatorBase) SetA(a int) {
	o.a = a
}
//SetB 设置 B
func (o *OperatorBase) SetB(b int) {
	o.b = b
}
//PlusOperatorFactory 是 PlusOperator(加操作) 的工厂类
type PlusOperatorFactory struct{}
func (PlusOperatorFactory) Create() Operator {
	return &PlusOperator{
		OperatorBase: &OperatorBase{},
	}
}
//PlusOperator Operator 的实际加法实现
type PlusOperator struct {
	*OperatorBase
}
//Result 获取结果
func (o PlusOperator) Result() int {
	return o.a + o.b
}
//MinusOperatorFactory 是 MinusOperator 的工厂类
type MinusOperatorFactory struct{}
func (MinusOperatorFactory) Create() Operator {
	return &MinusOperator{
		OperatorBase: &OperatorBase{},
	}
}
//MinusOperator Operator 的实际减法实现
type MinusOperator struct {
	*OperatorBase
}
//Result 获取结果
func (o MinusOperator) Result() int {
	return o.a - o.b
}
//TODO：
```

```java
package main
import "testing"
func compute(factory OperatorFactory, a, b int) int {
	op := factory.Create() //根据不同的工厂接口，创建不同的工厂
	op.SetA(a)
	op.SetB(b)
	return op.Result()
}
func TestOperator(t *testing.T) {
	var (
		factory OperatorFactory
	)
	factory = PlusOperatorFactory{}
	if compute(factory, 1, 2) != 3 {
		t.Fatal("error with factory method pattern")
	}
	factory = MinusOperatorFactory{}
	if compute(factory, 4, 2) != 2 {
		t.Fatal("error with factory method pattern")
	}
}
```

UML图：
