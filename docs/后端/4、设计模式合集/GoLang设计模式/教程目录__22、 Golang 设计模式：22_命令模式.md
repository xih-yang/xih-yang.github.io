# 22、 Golang 设计模式：22_命令模式
- 来源：https://ddkk.com/zhuanlan/design/golang/22.html
- 分类：设计模式
- 分组：教程目录
## 1、介绍

> 将一个请求封装为一个对象，从而使你可用不同的请求对客户进行参数化，对请求排队或记录请求日志，以及支持可撤销的操作。

命令模式（Command）是指，把请求封装成一个命令，然后执行该命令。

命令模式的结构

顾名思义，命令模式就是对命令的封装，首先来看一下命令模式类图中的基本结构：

**Command类**：是一个抽象类，类中对需要执行的命令进行声明，一般来说要对外公布一个execute方法用来执行命令。

**ConcreteCommand类**：Command类的实现类，对抽象类中声明的方法进行实现。

**Client类**：最终的客户端调用类。

**Invoker类**：调用者，负责调用命令。

**Receiver类**：接收者，负责接收命令并且执行命令。

## 2、示例

示例代码：

```java
package main
import "fmt"
type Command interface {
	Execute()
}
type MotherBoard struct{}
func (*MotherBoard) Start() {
	fmt.Println("系统启动中...")
}
func (*MotherBoard) Reboot() {
	fmt.Println("系统重启中...")
}
//====启动命令=====
type StartCommand struct {
	mb *MotherBoard
}
func (c *StartCommand) Execute() {
	c.mb.Start()
}
func NewStartCommand(mb *MotherBoard) *StartCommand {
	return &StartCommand{
		mb: mb,
	}
}
//====重启命令=====
type RebootCommand struct {
	mb *MotherBoard
}
func (c *RebootCommand) Execute() {
	c.mb.Reboot()
}
func NewRebootCommand(mb *MotherBoard) *RebootCommand {
	return &RebootCommand{
		mb: mb,
	}
}
//====按钮=====
type Box struct {
	button1 Command
	button2 Command
}
func (b *Box) PressButton1() {
	b.button1.Execute()
}
func (b *Box) PressButton2() {
	b.button2.Execute()
}
func NewBox(btn1, btn2 Command) *Box {
	return &Box{
		button1: btn1,
		button2: btn2,
	}
}
func main() {
	mb:=&MotherBoard{}
	btn1:=NewStartCommand(mb)
	btn2:=NewRebootCommand(mb)
	box := NewBox(btn1, btn2)
	box.PressButton1()
	box.PressButton2()
}
```

UML图：
