# 05、 Golang 设计模式：05_原型模式
- 来源：https://ddkk.com/zhuanlan/design/golang/5.html
- 分类：设计模式
- 分组：教程目录
## 1、介绍

> 用原型实例指定创建对象的种类，并且通过拷贝这些原型创建新的对象。

这种模式是实现了一个原型接口，该接口用于创建当前对象的克隆。当直接创建对象的代价比较大时，则采用这种模式。

使用原型模式创建对象比直接new一个对象在性能上要好的多；使用原型模式的另一个好处是简化对象的创建，使得创建对象就像我们在编辑文档时的复制粘贴一样简单。

Prototype：原型接口，ConcretePrototype：具体实现的原型

## 2、示例

示例代码：

```java
package main
import "fmt"
//1.原型对象需要实现的接口
type Cloneable interface {
	Clone() Cloneable
}
//2.原型对象的类
type PrototypeManager struct {
	prototypes map[string]Cloneable
}
//3.原型对象操作
func NewPrototypeManger() *PrototypeManager {
	return &PrototypeManager{make(map[string]Cloneable)}
}
func (p *PrototypeManager) Set(name string, prototype Cloneable) {
	p.prototypes[name] = prototype
}
func (p *PrototypeManager) Get(name string) Cloneable {
	return p.prototypes[name]
}
//用户对象1
type Type1 struct {
	name string
}
//深拷贝，另开辟一块内存空间
func (t *Type1) Clone() Cloneable {
	//t2 := new(Type1)
	//*t2 = *t
	//return t2
	//另外一种写法：
	t1 := *t   //开辟新地址，存储数据（变量赋值）
	return &t1 //返回变量的地址
}
//用户对象2
type Type2 struct {
	age uint8
}
//浅拷贝，返回源数据地址
func (t *Type2) Clone() Cloneable {
	return t
}
func main() {
	manger := NewPrototypeManger()
	//深复制
	manger.Set("jz", &Type1{name: "江洲"})
	clone1 := manger.Get("jz")
	clone2 := clone1.Clone()
	if clone1 == clone2 {
		fmt.Println("浅复制")
	} else {
		fmt.Println("深复制")
	}
	//浅复制
	manger.Set("ok", &Type2{age: 23})
	c1 := manger.Get("ok")
	c2 := c1.Clone()
	if c1 == c2 {
		fmt.Println("浅拷贝调用：共用同一块地址")
	} else {
		fmt.Println("深拷贝调用：不同的地址单元")
	}
}
```

UML图：
