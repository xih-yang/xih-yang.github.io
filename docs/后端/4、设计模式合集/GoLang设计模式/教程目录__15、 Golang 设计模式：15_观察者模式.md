# 15、 Golang 设计模式：15_观察者模式
- 来源：https://ddkk.com/zhuanlan/design/golang/15.html
- 分类：设计模式
- 分组：教程目录
## 1、原理

> 定义对象间的一种一对多的依赖关系，当一个对象的状态发生改变时，所有依赖于它的对象都得到通知并被自动更新。

观察者模式（Observer）又称发布-订阅模式（Publish-Subscribe：Pub/Sub）。它是一种通知机制，让发送通知的一方（被观察方）和接收通知的一方（观察者）能彼此分离，互不影响。

**在最基础的观察者模式中，包括以下四个角色：**

**被观察者**：从类图中可以看到，类中有一个用来存放观察者对象的Vector容器（之所以使用Vector而不使用List，是因为多线程操作时，Vector在是安全的，而List则是不安全的），这个Vector容器是被观察者类的核心，另外还有三个方法：attach方法是向这个容器中添加观察者对象；detach方法是从容器中移除观察者对象；notify方法是依次调用观察者对象的对应方法。这个角色可以是接口，也可以是抽象类或者具体的类，因为很多情况下会与其他的模式混用，所以使用抽象类的情况比较多。

**观察者**：观察者角色一般是一个接口，它只有一个update方法，在被观察者状态发生变化时，这个方法就会被触发调用。

**具体的被观察者**：使用这个角色是为了便于扩展，可以在此角色中定义具体的业务逻辑。

**具体的观察者**：观察者接口的具体实现，在这个角色中，将定义被观察者对象状态发生变化时所要处理的逻辑。

## 2、示例

示例代码：

```java
package main
import "fmt"
type Observer interface {
	Update(subject *Subject)
}
type Subject struct {
	observers []Observer
	msg       string
}
//添加观察者
func (s *Subject) Attach(o Observer) {
	s.observers = append(s.observers, o)
}
//通知信息到观察者
func (s *Subject) Notify() {
	for _, o := range s.observers {
		o.Update(s) //调用接口对应的方法
	}
}
//更新信息
func (s *Subject) UpdateMsg(context string) {
	s.msg = context
	s.Notify()
}
func NewSubject()*Subject  {
	return &Subject{
		observers: make([]Observer,0),
		msg:       "",
	}
}
//=======信息接受者======
type Reader struct {
	name string
}
func (r *Reader) Update(s *Subject) {
	fmt.Printf("【%s】收到的信息：%v\n", r.name, s.msg)
}
func NewReader(name string) *Reader {
	return &Reader{name: name}
}
func main() {
	subject := NewSubject()
	r1 := NewReader("张三")
	r2 := NewReader("李四")
	r3 := NewReader("王五")
	subject.Attach(r1)
	subject.Attach(r2)
	subject.Attach(r3)
	subject.UpdateMsg("MM来了")
	//subject.Notify()
	r4:=NewReader("赵六")
	subject.Attach(r4) //添加新的观察者
	subject.UpdateMsg("好漂亮")
}
```

UML图：
