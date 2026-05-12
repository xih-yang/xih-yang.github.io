# 14、 Golang 设计模式：14_责任链模式
- 来源：https://ddkk.com/zhuanlan/design/golang/14.html
- 分类：设计模式
- 分组：教程目录
## 1、原理

> 使多个对象都有机会处理请求，从而避免请求的发送者和接收者之间的耦合关系。将这些对象连成一条链，并沿着这条链传递该请求，直到有一个对象处理它为止。

责任链模式（Chain of Responsibility）是一种处理请求的模式，它让多个处理器都有机会处理该请求，直到其中某个处理成功为止。责任链模式把多个处理器串成链，然后让请求在链上传递：

```java
     ┌─────────┐
     │ Request │
     └─────────┘
          │
┌ ─ ─ ─ ─ ┼ ─ ─ ─ ─ ┐
          ▼
│  ┌─────────────┐  │
   │ ProcessorA  │
│  └─────────────┘  │
          │
│         ▼         │
   ┌─────────────┐
│  │ ProcessorB  │  │
   └─────────────┘
│         │         │
          ▼
│  ┌─────────────┐  │
   │ ProcessorC  │
│  └─────────────┘  │
          │
└ ─ ─ ─ ─ ┼ ─ ─ ─ ─ ┘
          │
          ▼
```

##

## 2、示例

示例代码：

```java
package main
import "fmt"
type Manager interface {
	HaveRight(money int)bool //有权做
	HandleFeeRequest(name string,money int)bool //处理费用请求
}
type RequestChain struct {
	Manager
	successor *RequestChain //后续者(链式结构，链表)
}
func (rc *RequestChain)HaveRight(money int)bool {
	return true
}
func (rc *RequestChain)HandleFeeRequest(name string,money int)bool {
	//先判断金额在对应的部门是否有权限
	if rc.Manager.HaveRight(money) {
		return rc.Manager.HandleFeeRequest(name,money) //如果有权限，处理请求
	}
	//继任者不为空,传递到继任者处理
	if rc.successor!=nil {
		return rc.successor.HandleFeeRequest(name,money)
	}
	return false
}
//赋值下一个继任者
func (rc *RequestChain)SetSuccessor(m *RequestChain) {
	rc.successor=m
}
type ProjectManage struct {}
func (pm *ProjectManage)HaveRight(money int)bool {
	return  money<500
}
func (pm *ProjectManage)HandleFeeRequest(name string,money int)bool {
	if name=="海淀区" {
		fmt.Printf("工程管理拥有权限，%v：%v\n",name,money)
		return true
	}
	fmt.Printf("工程管理没有权限，%v：%v\n",name,money)
	return false
}
func NewProjectManage() *RequestChain {
	return &RequestChain{
		Manager:   &ProjectManage{},
		successor: nil,
	}
}
type DepManager struct {}
func (dm *DepManager)HaveRight(money int)bool  {
	return money<5000
}
func (dm *DepManager)HandleFeeRequest(name string,money int)bool  {
	if name=="北京市" {
		fmt.Printf("部门管理授权通过，%v:%v\n",name,money)
		return true
	}
	fmt.Printf("部门管理未授权，%v:%v\n",name,money)
	return false
}
func NewDepManager() *RequestChain {
	return &RequestChain{
		Manager:   &DepManager{},
		successor: nil,
	}
}
type GeneralManager struct {}
func (gm *GeneralManager)HaveRight(money int)bool  {
	return true
}
func (gm *GeneralManager)HandleFeeRequest(name string,money int)bool  {
	if name=="中央" {
		fmt.Printf("全体管理授权通过，%v:%v\n",name,money)
		return true
	}
	fmt.Printf("全体管理未授权，%v:%v\n",name,money)
	return false
}
func NewGeneralManager() *RequestChain {
	return &RequestChain{
		Manager:   &GeneralManager{},
		successor: nil,
	}
}
func main() {
	c1:=NewProjectManage()
	c2:=NewDepManager()
	c3:=NewGeneralManager()
	//责任传递方向： c1---->c2----->c3
	c1.SetSuccessor(c2)
	c2.SetSuccessor(c3)
	var c Manager=c1
	c.HandleFeeRequest("海淀区",400)
	c.HandleFeeRequest("北京市",1400)
	c.HandleFeeRequest("中央",10000)
	c.HandleFeeRequest("天津市",400)
}
```

UML图：
