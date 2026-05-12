# 11、 Golang 设计模式：11_桥接模式
- 来源：https://ddkk.com/zhuanlan/design/golang/11.html
- 分类：设计模式
- 分组：教程目录
## 1、介绍

> 将抽象部分与它的实现部分分离，使它们都可以独立地变化。

这种模式涉及到一个作为桥接的接口，使得实体类的功能独立于接口实现类。这两种类型的类可被结构化改变而互不影响。

可以看到在桥接模式的结构图中，存在一条连接两个继承等级结构的桥。

在桥接模式结构图中包含如下几个角色：

- **Abstraction（抽象类）** ：用于定义抽象类的接口，它一般是抽象类而不是接口，其中定义了一个Implementor（实现类接口）类型的对象并可以维护该对象，它与Implementor之间**具有关联关系**，它既可以包含抽象业务方法，也可以包含具体业务方法。
- **RefinedAbstraction**（扩充抽象类）：扩充由Abstraction定义的接口，通常情况下它不再是抽象类而是具体类，它实现了在Abstraction中声明的抽象业务方法，在RefinedAbstraction中可以调用在Implementor中定义的业务方法。
- **Implementor（实现类接口）** ：定义实现类的接口，这个接口不一定要与Abstraction的接口完全一致，事实上这两个接口可以完全不同，一般而言，Implementor接口仅提供基本操作，而Abstraction定义的接口可能会做更多更复杂的操作。Implementor接口对这些基本操作进行了声明，而具体实现交给其子类。通过关联关系，在Abstraction中不仅拥有自己的方法，还可以调用到Implementor中定义的方法，使用关联关系来替代继承关系。
- **ConcreteImplementor（具体实现类）** ：具体实现Implementor接口，在不同的ConcreteImplementor中提供基本操作的不同实现，在程序运行时，ConcreteImplementor对象将替换其父类对象，提供给抽象类具体的业务操作方法。

桥接模式是一个非常有用的模式，在桥接模式中体现了很多面向对象设计原则的思想，包括“单一职责原则”、“开闭原则”、“合成复用原则”、“里氏代换原则”、“依赖倒转原则”等。

在使用桥接模式时，**首先应该识别出一个类所具有的两个独立变化的维度，将它们设计为两个独立的继承等级结构，为两个维度都提供抽象层，并建立抽象耦合**。通常情况下，将具有两个独立变化维度的类的一些普通业务方法和与之关系最密切的维度设计为“抽象类”层次结构（抽象部分），而将另一个维度设计为“实现类”层次结构（实现部分）。

## 2、示例

示例代码：

```java
package main
import "fmt"
//发送信息的具体实现（操作）
type MessageImplementer interface {
	send(test, to string)
}
//发送SMS
type MessageSMS struct{}
func (*MessageSMS) send(test, to string) {
	fmt.Printf("SMS信息：[%v]；发送到：[%v]\n", test, to)
}
func ViaSMS() *MessageSMS { //创建
	return &MessageSMS{}
}
//发送email
type MessageEmail struct{}
func (*MessageEmail) send(test, to string) {
	fmt.Printf("Email信息：[%v]；发送到：[%v]\n", test, to)
}
func ViaEmail()  *MessageEmail{//创建
	return &MessageEmail{}
}
//发送信息的二次封装（发送普通信息、紧急信息）
type AbstractMessage interface {
	SendMessage(text, to string)
}
//普通信息
type CommonMessage struct {
	method MessageImplementer
}
func (c *CommonMessage) SendMessage(text, to string) {
	c.method.send(text, to)
}
func NewCommonMessage(mi MessageImplementer) *CommonMessage {
	return &CommonMessage{method: mi}
}
//紧急信息
type UrgencyMessage struct {
	method MessageImplementer
}
func (u *UrgencyMessage) SendMessage(text, to string) {
	u.method.send(fmt.Sprintf("【紧急信息】%v",text), to)
}
func NewUrgencyMessage(mi MessageImplementer) *UrgencyMessage {
	return &UrgencyMessage{method: mi}
}
func main() {
	var m AbstractMessage
	//返回值为：*CommonMessage类型，而CommonMessage实现了AbstractMessage，因此需要定义的类型为；接口AbstractMessage
	m=NewCommonMessage(ViaSMS())
	m.SendMessage("你需要喝一杯咖啡吗","阿香")
	m=NewCommonMessage(ViaEmail())
	m.SendMessage("好滴","强哥")
	m=NewUrgencyMessage(ViaSMS())
	m.SendMessage("晚上桥头见","阿香")
	m=NewUrgencyMessage(ViaEmail())
	m.SendMessage("不见不散","强哥")
}
```

UML图：
