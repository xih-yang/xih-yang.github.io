# 20、 Golang 设计模式：20_策略模式
- 来源：https://ddkk.com/zhuanlan/design/golang/20.html
- 分类：设计模式
- 分组：教程目录
## 1、介绍

> 定义一系列的算法，把它们一个个封装起来，并且使它们可相互替换。本模式使得算法可独立于使用它的客户而变化。

策略模式：Strategy，是指，定义一组算法，并把其封装到一个对象中。然后在运行时，可以灵活的使用其中的一个算法。

### 策略模式的结构

**封装类**：也叫上下文，对策略进行二次封装，目的是避免高层模块对策略的直接调用。

**抽象策略**：通常情况下为一个接口，当各个实现类中存在着重复的逻辑时，则使用抽象类来封装这部分公共的代码，此时，策略模式看上去更像是模版方法模式。

**具体策略**：具体策略角色通常由一组封装了算法的类来担任，这些类之间可以根据需要自由替换。

## 2、示例

示例代码：

```java
package main
import "fmt"
//支付环境
type PaymentContext struct {
	Name ,CardId string
	Money int
}
//支付策略
type PaymentStrategy interface {
	Pay(ctx *PaymentContext)
}
//支付
type Payment struct {
	Context *PaymentContext
	Strategy PaymentStrategy
}
func NewPayment(name,cardId string,money int,strategy PaymentStrategy) *Payment {
  return &Payment{
	  Context:  &PaymentContext{
		  Name:   name,
		  CardId: cardId,
		  Money:  money,
	  },
	  Strategy: strategy,
  }
}
func (p *Payment)Pay() {
	//Strategy是接口类型（PaymentStrategy），那个对象（该对象必须实现该接口）调用，就运行那个对象的方法
	p.Strategy.Pay(p.Context)
}
//付款
type Cash struct{}
func (*Cash)Pay(ctx *PaymentContext)  {
	fmt.Printf("支付 %v￥ 到 %v\n",ctx.Money,ctx.Name)
}
//银行
type Bank struct{}
func (*Bank)Pay(ctx *PaymentContext) {
	fmt.Printf("支付 %v￥ 到 %v（银行账号为：%v）",ctx.Money,ctx.Name,ctx.CardId)
}
func main()  {
	cash :=&Cash{}
	payment := NewPayment("张三","10086",666,cash) //最后一个参数为接口类型，因此可以传递实现接口的对象（结构体）
	payment.Pay()
	bank:=&Bank{}
	payment=NewPayment("张三","10086",666,bank)
	payment.Pay()
}
```

UML图：
