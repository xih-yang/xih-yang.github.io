# 24、 Golang 设计模式：24_迭代器模式
- 来源：https://ddkk.com/zhuanlan/design/golang/24.html
- 分类：设计模式
- 分组：教程目录
## 1、介绍

> 提供一种方法顺序访问一个聚合对象中的各个元素，而又不需要暴露该对象的内部表示。

##

#### 迭代器模式的结构

**抽象容器**：一般是一个接口，提供一个iterator()方法，例如java中的Collection接口，List接口，Set接口等。

**具体容器**：就是抽象容器的具体实现类，比如List接口的有序列表实现ArrayList，List接口的链表实现LinkList，Set接口的哈希列表的实现HashSet等。

**抽象迭代器**：定义遍历元素所需要的方法，一般来说会有这么三个方法：取得第一个元素的方法first()，取得下一个元素的方法next()，判断是否遍历结束的方法isDone()（或者叫hasNext()），移出当前对象的方法remove(),

**迭代器实现**：实现迭代器接口中定义的方法，完成集合的迭代。

## 2、示例

示例代码：

```java
package main
import (
	"fmt"
)
//迭代器接口
type Iterator interface {
	First()
	IsDone() bool
	Next() interface{}
}
//迭代的数据集
type Aggregate interface {
	Iterator() Iterator
}
type Numbers struct {
	start, end int
}
//实现迭代器接口对应的功能
type NumbersIterator struct {
	numbers *Numbers
	next    int
}
func (i *NumbersIterator) First() {
	i.next = i.numbers.start
}
func (i *NumbersIterator) IsDone() bool {
	return i.next > i.numbers.end
}
func (i *NumbersIterator) Next() interface{} {
	if !i.IsDone() {
		next := i.next
		i.next++
		return next
	}
	return nil
}
func (n *Numbers) Iterator() Iterator {
	return &NumbersIterator{
		numbers: n,
		next:    n.start,
	}
}
func NewNumbers(start,end int)*Numbers  {
	return &Numbers{
		start: start,
		end:   end,
	}
}
func IteratorPrint(i Iterator)  {
	for i.First();!i.IsDone();{
		c:=i.Next()
		fmt.Printf("%v\n",c)
	}
}
func main()  {
	//var aggregate Aggregate
	//aggregate=NewNumbers(1,10)
	//IteratorPrint(aggregate.Iterator())
	//等价于：
	numbers := NewNumbers(1, 10)
	IteratorPrint(numbers.Iterator())
}
```

UML图：
