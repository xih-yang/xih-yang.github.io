# 10、 Golang 设计模式：10_外观模式
- 来源：https://ddkk.com/zhuanlan/design/golang/10.html
- 分类：设计模式
- 分组：教程目录
## 1、介绍

> 为子系统中的一组接口提供一个一致的界面。Facade模式定义了一个高层接口，这个接口使得这一子系统更加容易使用。外观模式可以让复杂的东西看起来简单。

外观模式，即Facade，是一个比较简单的模式。它的基本思想如下：

如果客户端要跟许多子系统打交道，那么客户端需要了解各个子系统的接口，比较麻烦。如果有一个统一的“中介”，让客户端只跟中介打交道，中介再去跟各个子系统打交道，对客户端来说就比较简单。所以Facade就相当于搞了一个中介。

## 2、示例

示例代码：

```java
package main
import "fmt"
func NewAPI() API {
	return &apiImpl{
		a: NewAModuleAPI(),
		b: NewBModuleAPI(),
	}
}
//API is facade interface of facade package
type API interface {
	Test() string
}
//facade implement
type apiImpl struct {
	a AModuleAPI
	b BModuleAPI
}
func (a *apiImpl) Test() string {
	aRet := a.a.TestA()
	bRet := a.b.TestB()
	return fmt.Sprintf("%s\n%s", aRet, bRet)
}
//NewAModuleAPI return new AModuleAPI
func NewAModuleAPI() AModuleAPI {
	return &aModuleImpl{}
}
//AModuleAPI ...
type AModuleAPI interface {
	TestA() string
}
type aModuleImpl struct{}
func (*aModuleImpl) TestA() string {
	return "A module running"
}
//NewBModuleAPI return new BModuleAPI
func NewBModuleAPI() BModuleAPI {
	return &bModuleImpl{}
}
//BModuleAPI ...
type BModuleAPI interface {
	TestB() string
}
type bModuleImpl struct{}
func (*bModuleImpl) TestB() string {
	return "B module running"
}
func main() {
	api:=NewAPI()
	test := api.Test()
	fmt.Println(test)
}
```

UML图：
