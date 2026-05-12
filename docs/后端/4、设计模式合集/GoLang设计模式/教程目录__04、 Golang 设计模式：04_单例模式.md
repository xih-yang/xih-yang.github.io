# 04、 Golang 设计模式：04_单例模式
- 来源：https://ddkk.com/zhuanlan/design/golang/4.html
- 分类：设计模式
- 分组：教程目录
## 1、介绍

> 保证一个类仅有一个实例，并提供一个访问它的全局访问点。

单例模式（Singleton）的目的是为了保证在一个进程中，某个类有且仅有一个实例。

这种模式涉及到一个单一的类，该类负责创建自己的对象，同时确保只有单个对象被创建。这个类提供了一种访问其唯一的对象的方式，可以直接访问，不需要实例化该类的对象。

**注意：**

- 1、单例类只能有一个实例。
- 2、单例类必须自己创建自己的唯一实例。
- 3、单例类必须给所有其他对象提供这一实例。

## 2、示例

示例代码：

```java
package main
import (
	"fmt"
	"sync"
)
type SingleData struct {
	data interface{}
}
var data *SingleData
var once sync.Once //通过该类型可以实现单例模式，虽然是多次赋值，但是只执行一次（一个对象多次实例化，但是只有一个，共享对象地址）
func getInstance(i int) *SingleData {
	once.Do(func() {
		data = &SingleData{i}
	})
	return data
}
func main() {
	i1 := getInstance(1)
	i2 := getInstance(2)
	if i1 == i2 {
		fmt.Println("单例模式")
	} else {
		fmt.Println("不是单例模式")
	}
}
```

UML图：
