# 12、 Golang 设计模式：12_装饰器模式
- 来源：https://ddkk.com/zhuanlan/design/golang/12.html
- 分类：设计模式
- 分组：教程目录
## 1、介绍

> 动态地给一个对象添加一些额外的职责。就增加功能来说，相比生成子类更为灵活。

装饰器（Decorator）模式，是一种在运行期动态给某个对象的实例增加功能的方法。

**Component:**

**　**对象的接口类，定义装饰对象和被装饰对象的共同接口；

**ConcreteComponent:**

被装饰对象的类定义；

**Decorator:**

装饰对象的抽象类，持有一个具体的被修饰对象，并实现接口类继承的公共接口；

**ConcreteDecorator:**

具体的装饰器，负责往被装饰对象添加额外的功能；

## 2、示例

示例代码：

```java
package main
import "fmt"
type Component interface {
	Calc() int
}
type ConcreteComponent struct{}
func (*ConcreteComponent) Calc() int {
	return 0
}
//乘法修饰器
type MulDecorator struct {
	Component
	num int
}
func (d *MulDecorator) Calc() int {
	//return (d.Component.Calc()+1)*d.num
	return d.Component.Calc() * d.num
}
func NewMulDecorator(c Component, data int) *MulDecorator {
	return &MulDecorator{
		Component: c,
		num:       data,
	}
}
//加法修饰器
type AddDecorator struct {
	Component
	num int
}
func (d *AddDecorator) Calc() int {
	return d.Component.Calc() + d.num
}
func NewAddDecorator(c Component, data int) *AddDecorator {
	return &AddDecorator{
		Component: c,
		num:       data,
	}
}
func main() {
	var c Component
	//指针要先进行创建（初始化），不然直接赋值会出现空指针异常，即：给指针为nil的对象赋值
	//错误提示：panic: runtime error: invalid memory address or nil pointer dereference
	c = &ConcreteComponent{}
	c = NewAddDecorator(c, 10) //先调用加
	c = NewMulDecorator(c, 8) //在以上基础之上再执行乘法
	fmt.Println("加计算结果：", c.Calc())
}
```

UML图：
