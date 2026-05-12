# 21、 Golang 设计模式：21_备忘录模式
- 来源：https://ddkk.com/zhuanlan/design/golang/21.html
- 分类：设计模式
- 分组：教程目录
## 1、介绍

备忘录模式（Memento Pattern）保存一个对象的某个状态，以便在适当的时候恢复对象。

我们在编程的时候，经常需要保存对象的中间状态，当需要的时候，可以恢复到这个状态。比如，我们使用Eclipse进行编程时，假如编写失误（例如不小心误删除了几行代码），我们希望返回删除前的状态，便可以使用Ctrl+Z来进行返回。这时我们便可以使用备忘录模式来实现。

#### 备忘录模式的结构

**发起人**：记录当前时刻的内部状态，负责定义哪些属于备份范围的状态，负责创建和恢复备忘录数据。

**备忘录**：负责存储发起人对象的内部状态，在需要的时候提供发起人需要的内部状态。

**管理角色**：对备忘录进行管理，保存和提供备忘录。

## 2、示例

示例代码：

```java
package main
import "fmt"
//备忘录模式用于保存程序内部状态到外部，又不希望暴露内部状态的情形。
type Memento interface{}
type gameMemento struct {
	hp, mp int
}
type Game struct {
	hp, mp int
}
func (g *Game) Play(mpDelta, hpDelta int) {
	g.hp += hpDelta
	g.mp += mpDelta
}
func (g *Game) Save() Memento {
	return &gameMemento{
		hp: g.hp,
		mp: g.mp,
	}
}
func (g *Game) Load(m Memento) {
	gm := m.(*gameMemento)
	g.mp = gm.mp
	g.hp = gm.hp
}
func (g *Game) Status() {
	fmt.Printf("当前HP：%v,MP:%v\n", g.hp, g.mp)
}
func main() {
	game:=&Game{
		hp: 100,
		mp: 10,
	}
	game.Status()
	memento := game.Save() //保存状态
	game.Play(-2,-3)
	game.Status()
	game.Load(memento) //加载已经保存的状态
	game.Status()
}
```

UML图：
