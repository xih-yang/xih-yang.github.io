# 17、 Golang 设计模式：17_状态模式
- 来源：https://ddkk.com/zhuanlan/design/golang/17.html
- 分类：设计模式
- 分组：教程目录
## 1、介绍

> 允许一个对象在其内部状态改变时改变它的行为。对象看起来似乎修改了它的类。

状态模式（State）经常用在带有状态的对象中。

什么是状态？我们以QQ聊天为例，一个用户的QQ有几种状态：

- 离线状态（尚未登录）；
- 正在登录状态；
- 在线状态；
- 忙状态（暂时离开）。

#### 状态模式包含以下主要角色。

**1、****环境类**（Context）角色：也称为上下文，它定义了客户端需要的接口，内部维护一个当前状态，并负责具体状态的切换；

**2、****抽象状态**（State）角色：定义一个接口，用以封装环境对象中的特定状态所对应的行为，可以有一个或多个行为；

**3、****具体状态**（ConcreteState）角色：实现抽象状态所对应的行为，并且在需要的情况下进行状态切换；

## 2、示例

示例代码：

```java
package main
import "fmt"
//状态模式用于分离状态和行为。
//周一 至  周日  时间之间的切换
type Week interface {
	Today()
	Next(ctx *DayContext)
}
type DayContext struct {
	today Week
}
func (dc *DayContext)Today()  {
	dc.today.Today() //调用父类(接口)的方法，具体实现是在对应的类（结构体）中
}
func (dc *DayContext)Next() {
	dc.today.Next(dc)
}
func NewDayContext() *DayContext {
	return &DayContext{today:&Sunday{}} //初始值为周日
}
//=====周日（Sunday）====
type Sunday struct {}
func ( *Sunday)Today()  {
	fmt.Printf("周日\n")
}
func (*Sunday)Next(ctx *DayContext)  {
	ctx.today=&Monday{}
}
//=====周一（Monday）====
type Monday struct {}
func ( *Monday)Today()  {
	fmt.Printf("周一\n")
}
func (*Monday)Next(ctx *DayContext)  {
	ctx.today=&Tuesday{}
}
//=====周二（Tuesday）====
type Tuesday struct {}
func ( *Tuesday)Today()  {
	fmt.Printf("周二\n")
}
func (*Tuesday)Next(ctx *DayContext)  {
	ctx.today=&Wednesday{}
}
//=====周三（Wednesday）====
type Wednesday struct {}
func ( *Wednesday)Today()  {
	fmt.Printf("周三\n")
}
func (*Wednesday)Next(ctx *DayContext)  {
	ctx.today=&Thursday{}
}
//=====周四（Thursday）====
type Thursday struct {}
func ( *Thursday)Today()  {
	fmt.Printf("周四\n")
}
func (*Thursday)Next(ctx *DayContext)  {
	ctx.today=&Friday{}
}
//=====周五（Friday）====
type Friday struct {}
func ( *Friday)Today()  {
	fmt.Printf("周五\n")
}
func (*Friday)Next(ctx *DayContext)  {
	ctx.today=&Saturday{}
}
//=====周六（Sunday）====
type Saturday struct {}
func ( *Saturday)Today()  {
	fmt.Printf("周六\n")
}
func (*Saturday)Next(ctx *DayContext)  {
	ctx.today=&Sunday{}
}
func main() {
	dayContext := NewDayContext()
	for i:=0;i<14;i++{
		dayContext.Today()
		dayContext.Next()
	}
}
```

UML图：
