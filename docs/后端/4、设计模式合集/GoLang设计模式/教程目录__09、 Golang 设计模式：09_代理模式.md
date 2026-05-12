# 09、 Golang 设计模式：09_代理模式
- 来源：https://ddkk.com/zhuanlan/design/golang/9.html
- 分类：设计模式
- 分组：教程目录
## 1、介绍

> 为其他对象提供一种代理以控制对这个对象的访问。

Subjec：主体，Proxy：代理人，RealSubject：实际的主体。

## 2、示例

示例代码：

```java
package main
import "fmt"
type Subject interface {
	Do() string
}
type RealSubject struct{}
func (r *RealSubject) Do() string {
	return "执行以太坊智能合约"
}
type ProxySubject struct {
	RealSubject
	money int
}
func (p *ProxySubject) Do() string {
	if p.money > 0 {
		return p.RealSubject.Do()
	} else {
		return "费用不足，请充值"
	}
}
func main()  {
	var sub Subject
	sub=&ProxySubject{
		RealSubject: RealSubject{},
		money:       10,
	}
	fmt.Println(sub.Do())
}
```

UML图：
