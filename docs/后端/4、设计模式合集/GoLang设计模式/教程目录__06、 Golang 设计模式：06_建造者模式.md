# 06、 Golang 设计模式：06_建造者模式
- 来源：https://ddkk.com/zhuanlan/design/golang/6.html
- 分类：设计模式
- 分组：教程目录
## 1、介绍

> 将一个复杂对象的构建与它的表示分离，使得同样的构建过程可以创建不同的表示。

生成器模式（Builder）是使用多个“小型”工厂来最终创建出一个完整对象。

当我们使用Builder的时候，一般来说，是因为创建这个对象的步骤比较多，每个步骤都需要一个零部件，最终组合成一个完整的对象。

#### 四个要素

**产品类：**一般是一个较为复杂的对象，也就是说创建对象的过程比较复杂，一般会有比较多的代码量。在本类图中，产品类是一个具体的类，而非抽象类。实际编程中，产品类可以是由一个抽象类与它的不同实现组成，也可以是由多个抽象类与他们的实现组成。

**抽象建造者：**引入抽象建造者的目的，是为了将建造的具体过程交与它的子类来实现。这样更容易扩展。一般至少会有两个抽象方法，一个用来建造产品，一个是用来返回产品。

**建造者：**实现抽象类的所有未实现的方法，具体来说一般是两项任务：组建产品；返回组建好的产品。

**导演类（监工）：**负责调用适当的建造者来组建产品，导演类一般不与产品类发生依赖关系，与导演类直接交互的是建造者类。一般来说，导演类被用来封装程序中易变的部分。

## 2、示例

示例代码：

```java
package main
import "fmt"
//================1.建造者接口==============
//Builder 是生成器接口
type Builder interface {
	Part1()
	Part2()
	Part3()
}
//===============2.建造者对象及操作===============
type Director struct {
	builder Builder //建造者的接口
}
//创建接口
func NewDirector(b Builder) *Director {
	return &Director{builder: b}
}
func (d *Director) MakeData() {
	d.builder.Part1()
	d.builder.Part2()
	d.builder.Part3()
}
//===========3.建造者实例==============
//string建造者
type StringBuilder struct {
	result string
}
func (sb *StringBuilder) Part1() {
	sb.result += "1"
}
func (sb *StringBuilder) Part2() {
	sb.result += "2"
}
func (sb *StringBuilder) Part3() {
	sb.result += "3"
}
func (sb *StringBuilder) GetResult() string {
	return sb.result
}
//int建造者
type IntBuilder struct {
	result int64
}
func (ib *IntBuilder) Part1() {
	ib.result = ib.result + 1
}
func (ib *IntBuilder) Part2() {
	ib.result = ib.result + 2
}
func (ib *IntBuilder) Part3() {
	ib.result = ib.result + 3
}
func (ib *IntBuilder) GetResult() int64 {
	return ib.result
}
func main() {
	//b:=StringBuilder{}
	b:=IntBuilder{}
	sb := NewDirector(&b) //对象继承了接口（实现了接口对应的方法）；若参数为接口类型，则传递的是对象的地址
	sb.MakeData()
	fmt.Println("执行效果为：",b.result)
}
/*
todo 建造者模式和工厂模式的区别:
通过前面的学习，我们已经了解了建造者模式，那么它和工厂模式有什么区别呢？
建造者模式更加注重方法的调用顺序，工厂模式注重创建对象。
创建对象的力度不同，建造者模式创建复杂的对象，由各种复杂的部件组成，工厂模式创建出来的对象都一样
关注重点不一样，工厂模式只需要把对象创建出来就可以了，而建造者模式不仅要创建出对象，还要知道对象由哪些部件组成。
建造者模式根据建造过程中的顺序不一样，最终对象部件组成也不一样。
*/
```

UML图：
