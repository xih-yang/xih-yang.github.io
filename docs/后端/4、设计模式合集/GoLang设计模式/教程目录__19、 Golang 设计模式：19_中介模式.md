# 19、 Golang 设计模式：19_中介模式
- 来源：https://ddkk.com/zhuanlan/design/golang/19.html
- 分类：设计模式
- 分组：教程目录
## 1、介绍

> 用一个中介对象来封装一系列的对象交互。中介者使各个对象不需要显式地相互引用，从而使其耦合松散，而且可以独立地改变它们之间的交互。

中介模式（Mediator）又称调停者模式，它的目的是把多方会谈变成双方会谈，从而实现多方的松耦合。

#### 中介者模式的结构

中介者模式又称为调停者模式，从类图中看，共分为3部分：

**抽象中介者**：定义好同事类对象到中介者对象的接口，用于各个同事类之间的通信。一般包括一个或几个抽象的事件方法，并由子类去实现。

**中介者实现类**：从抽象中介者继承而来，实现抽象中介者中定义的事件方法。从一个同事类接收消息，然后通过消息影响其他同时类。

**同事类**：如果一个对象会影响其他的对象，同时也会被其他对象影响，那么这两个对象称为同事类。在类图中，同事类只有一个，这其实是现实的省略，在实际应用中，同事类一般由多个组成，他们之间相互影响，相互依赖。同事类越多，关系越复杂。并且，同事类也可以表现为继承了同一个抽象类的一组实现组成。在中介者模式中，同事类之间必须通过中介者才能进行消息传递。

Mediator：仲裁者、中介者；ConcreteMediator：具体的仲裁者、中介者；Colleague：同事，定义了与Mediator进行通信的接口；ConcreteColleague：具体的同事。

代理模式PK中介者模式：

**1、** 代理模式是一对一，一个代理只能代表一个对象中介者模式则是多对多，中介者的功能多样，客户也可以多个；

**2、** 只能代理一方如果PB是A的代理，那么C可以通过PB访问A，但是A不能通过PB访问B对于中介者模式而言，A可以通过中介访问B，B也可以通过中介访问A；

## 2、示例

示例代码：

```java
package main
import (
	"fmt"
	"strings"
)
type CDDriver struct {
	Data string
}
func (c *CDDriver) ReadData() {
	//c.Data = "音乐、图片"
	fmt.Println("CD驱动器正在读取：", c.Data)
}
type CPUDriver struct {
	Video string
	Sound string
}
func (c *CPUDriver) Process(data string) {
	sp := strings.Split(data, ",")
	c.Sound = sp[0]
	c.Video = sp[1]
	fmt.Println("CPU播放：", c.Sound, c.Video)
}
type GPUDriver struct {
	Image string
}
func (g *GPUDriver) display(data string) {
	g.Image = data
	fmt.Println("GPU正在显示图片：", g.Image)
}
//中介，对所以对象同一进行处理
type Mediator struct {
	CD  *CDDriver
	CPU *CPUDriver
	GPU *GPUDriver
}
var mediator *Mediator
func GetMediatorInstance() *Mediator {
	if mediator == nil {
		mediator = &Mediator{}
	}
	return mediator
}
func (m *Mediator) change(i interface{}) {
	switch inst := i.(type) { //对断言的数据类型进行判断
	case *CDDriver:
		m.CD.ReadData()
	case *CPUDriver:
		m.CPU.Process(inst.Sound + "," + inst.Video)
	case *GPUDriver:
		m.GPU.display(inst.Image)
	default:
	}
}
func main() {
	mediator = GetMediatorInstance()
	cd := &CDDriver{Data: "成龙电影"}
	cpu := &CPUDriver{
		Video: "视频",
		Sound: "音频",
	}
	gpu := &GPUDriver{Image: "图片"}
	mediator.CD=cd
	mediator.CPU=cpu
	mediator.GPU=gpu
	mediator.change(cd)
	mediator.change(cpu)
	mediator.change(gpu)
}
```

UML图：
