# 01、 Golang 设计模式：01_简单工厂模式
- 来源：https://ddkk.com/zhuanlan/design/golang/1.html
- 分类：设计模式
- 分组：教程目录
> 简单工厂模式（Simple Factory Pattern）属于类的创新型模式，又叫静态工厂方法模式（Static FactoryMethod Pattern）,是通过专门定义一个类来负责创建其他类的实例，被创建的实例通常都具有共同的父类。

示例代码：

```java
package main
import "fmt"
//===============1.定义简单接口=================
type SimpleAPI interface {
	Say(content string) string
}
//===============2.实现对应的接口===============
//对象1
type Chinese struct {}
func (c *Chinese) Say(content string) string {
	fmt.Println("这里是Chinese对应的方法")
	return string("cn")
}
//对象2
type English struct {}
func (e *English) Say(content string) string {
	fmt.Println("这里是English对应的方法")
	return "en"
}
//===================3.调用对应的方法================
func NewAPI(apiName string) SimpleAPI {
	if apiName == "cn" {
		return &Chinese{}
	} else if apiName == "en" {
		return new(English)
	}
	return nil
}
func main() {
	newAPI1 := NewAPI("cn")
	res := newAPI1.Say("你好")
	fmt.Println("调用结果：", res)
	newAPI2 := NewAPI("en")
	res = newAPI2.Say("hello")
	fmt.Println("调用结果：", res)
}
```

UML图：

**简单工厂模式的UML图：**

简单工厂模式中包含的角色及其相应的职责如下：

工厂角色（Creator）：这是简单工厂模式的核心，由它负责创建所有的类的内部逻辑。当然工厂类必须能够被外界调用，创建所需要的产品对象。-------函数

抽象（Product）产品角色：简单工厂模式所创建的所有对象的父类，注意，这里的父类可以是接口也可以是抽象类，它负责描述所有实例所共有的公共接口。---------SimpleAPI

具体产品（Concrete Product）角色：简单工厂所创建的具体实例对象，这些具体的产品往往都拥有共同的父类。----------Chinese、English
