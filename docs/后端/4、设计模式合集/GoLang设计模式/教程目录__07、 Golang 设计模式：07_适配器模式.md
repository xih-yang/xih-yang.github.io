# 07、 Golang 设计模式：07_适配器模式
- 来源：https://ddkk.com/zhuanlan/design/golang/7.html
- 分类：设计模式
- 分组：教程目录
## 1、介绍

> 将一个类的接口转换成客户希望的另外一个接口，使得原本由于接口不兼容而不能一起工作的那些类可以一起工作。

适配器模式是Adapter，也称Wrapper，是指如果一个接口需要B接口，但是待传入的对象却是A接口，怎么办？

我们举个例子。如果去美国，我们随身带的电器是无法直接使用的，因为美国的插座标准和中国不同，所以，我们需要一个适配器。

Target：适配的对象，Adapter：适配；Adaptee：被适配。

## 2、示例

示例代码：

```java
package main
import "fmt"
//================1.被适配对象================
//被适配的接口
type Adapter interface {
	SpecRequest(int, int) string
}
//接口载体
type AdapterImpl struct{}
func (ap *AdapterImpl) SpecRequest(int, int) string {
	return "目标对象：SpecRequest"
}
func NewAdapter() Adapter {
	return &AdapterImpl{}
}
//================2.适配的目标对象================
//适配的目标接口
type Target interface {
	Request(int, int) string
}
type AdapterImplDsc struct {
	Adapter //注意：继承的是接口，非对象（结构体）
}
//接口包装
func (ad *AdapterImplDsc) Request(a, b int) string {
	return ad.SpecRequest(a, b) //调用目标方法
}
func NewTarget(ad Adapter) Target {
	return &AdapterImplDsc{ad}
}
func main() {
	ad := NewAdapter()
	target := NewTarget(ad)
	res := target.Request(1, 2)
	fmt.Println(res)
}
```

UML：
