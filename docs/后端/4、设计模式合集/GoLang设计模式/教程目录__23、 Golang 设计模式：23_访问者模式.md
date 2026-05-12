# 23、 Golang 设计模式：23_访问者模式
- 来源：https://ddkk.com/zhuanlan/design/golang/23.html
- 分类：设计模式
- 分组：教程目录
## 1、介绍

> 表示一个作用于某对象结构中的各元素的操作。它使你可以在不改变各元素的类的前提下定义作用于这些元素的新操作。

访问者模式（Visitor）是一种操作一组对象的操作，它的目的是不改变对象的定义，但允许新增不同的访问者，来定义新的操作。

访问者模式的设计比较复杂，如果我们查看GoF原始的访问者模式，它是这么设计的：

```java
 ┌─────────┐       ┌───────────────────────┐
   │ Client  │─ ─ ─ >│        Visitor        │
   └─────────┘       ├───────────────────────┤
        │            │visitElementA(ElementA)│
                     │visitElementB(ElementB)│
        │            └───────────────────────┘
                                 ▲
        │                ┌───────┴───────┐
                         │               │
        │         ┌─────────────┐ ┌─────────────┐
                  │  VisitorA   │ │  VisitorB   │
        │         └─────────────┘ └─────────────┘
        ▼
┌───────────────┐        ┌───────────────┐
│ObjectStructure│─ ─ ─ ─>│    Element    │
├───────────────┤        ├───────────────┤
│handle(Visitor)│        │accept(Visitor)│
└───────────────┘        └───────────────┘
                                 ▲
                        ┌────────┴────────┐
                        │                 │
                ┌───────────────┐ ┌───────────────┐
                │   ElementA    │ │   ElementB    │
                ├───────────────┤ ├───────────────┤
                │accept(Visitor)│ │accept(Visitor)│
                │doA()          │ │doB()          │
                └───────────────┘ └───────────────┘
```

##

#### 在访问者模式中，主要包括下面几个角色：

**抽象访问者**：抽象类或者接口，声明访问者可以访问哪些元素，具体到程序中就是visit方法中的参数定义哪些对象是可以被访问的。

**访问者**：实现抽象访问者所声明的方法，它影响到访问者访问到一个类后该干什么，要做什么事情。

**抽象元素类**：接口或者抽象类，声明接受哪一类访问者访问，程序上是通过accept方法中的参数来定义的。抽象元素一般有两类方法，一部分是本身的业务逻辑，另外就是允许接收哪类访问者来访问。

**元素类**：实现抽象元素类所声明的accept方法，通常都是visitor.visit(this)，基本上已经形成一种定式了。

**结构对象**：一个元素的容器，一般包含一个容纳多个不同类、不同接口的容器，如List、Set、Map等，在项目中一般很少抽象出这个角色。

## 2、示例

示例代码：

```java
package main
import "fmt"
type Customer interface {
	Accept(visitor Visitor)
}
type Visitor interface {
	Visit(customer Customer)
}
//客户群
type CustomerCol struct {
	customers []Customer
}
func (c *CustomerCol) Add(customer Customer) {
	c.customers = append(c.customers, customer)
}
func (c *CustomerCol) Accept(visitor Visitor) {
	for _, customer := range c.customers {
		customer.Accept(visitor)
	}
}
//企业级客户
type EnterpriseCustomer struct {
	name string
}
func NewEnterpriseCustomer(name string) *EnterpriseCustomer {
	return &EnterpriseCustomer{
		name: name,
	}
}
func (c *EnterpriseCustomer) Accept(visitor Visitor) {
	visitor.Visit(c)
}
//个人客户
type IndividualCustomer struct {
	name string
}
func NewIndividualCustomer(name string) *IndividualCustomer {
	return &IndividualCustomer{
		name: name,
	}
}
func (c *IndividualCustomer) Accept(visitor Visitor) {
	visitor.Visit(c)
}
//访问器
type ServiceRequestVisitor struct{}
func (*ServiceRequestVisitor) Visit(customer Customer) {
	switch c := customer.(type) {
	case *EnterpriseCustomer:
		fmt.Printf("服务企业级客户：%s\n", c.name)
	case *IndividualCustomer:
		fmt.Printf("服务个人客户：%s\n", c.name)
	}
}
type AnalysisVisitor struct{}
func (*AnalysisVisitor) Visit(customer Customer) {
	switch c := customer.(type) {
	case *EnterpriseCustomer:
		fmt.Printf("分析企业级客户：%s\n", c.name)
	}
}
func main() {
	c:=&CustomerCol{}
	c.Add(NewEnterpriseCustomer("中电科"))
	c.Add(NewEnterpriseCustomer("绿盟"))
	c.Add(NewIndividualCustomer("jiangzhou"))
	c.Accept(&ServiceRequestVisitor{})
    fmt.Println("==========")
	c1:=&CustomerCol{}
	c1.Add(NewEnterpriseCustomer("中电科"))
	c1.Add(NewIndividualCustomer("jiangzhou"))
	c1.Add(NewEnterpriseCustomer("绿盟"))
	c1.Accept(&AnalysisVisitor{})
}
```

UML图：
