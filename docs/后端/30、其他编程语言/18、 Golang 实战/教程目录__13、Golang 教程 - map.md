# 13、Golang 教程 - map
- 来源：https://ddkk.com/zhuanlan/other/golang/4/13.html
- 分类：其他语言
- 分组：教程目录
## 什么是 map？

`Map` 是 `Go` 中的内置类型，它将`key`与`value`相关联。可以通过`key`获取相应的`value`。

## 如何创建 map？

可以通过将`key`和`value`的类型传递给`make`函数来创建`map`。创建`map`的语法为：`make(map[type of key]type of value)`，例如：

```java
personSalary := make(map[string]int)
```

上面的代码行创建了一个名为`personSalary`的`map`，`key`为`string`类型,`value`为`int`类型。

`map`的零值为 `nil`。试图给一个 `nil map` 添加元素给会导致运行时错误。因此 `map` 必须通过 `make`函数 来初始化。

```java
package main
import (
	"fmt"
)
func main() {
	var personSalary map[string]int
	if personSalary == nil {
		fmt.Println("map is nil. Going to make one.")
		personSalary = make(map[string]int)
	}
}
```

在上面的程序中，`personSalary`是`nil`，因此它将使用`make`函数初始化。该程序将输出：`map is nil. Going to make one`.

## 向 map 中添加元素

向`map`中添加元素的语法与数组相同。下面的程序向`personSalary` 添加一些新元素。

```java
package main
import (
	"fmt"
)
func main() {
	personSalary := make(map[string]int)
	personSalary["steve"] = 12000
	personSalary["jamie"] = 15000
	personSalary["mike"] = 9000
	fmt.Println("personSalary map contents:", personSalary)
}
```

上面的程序输出：

```java
personSalary map contents: map[steve:12000 jamie:15000 mike:9000]。
```

也可以在声明时初始化一个`map`：

```java
package main
import (
	"fmt"
)
func main() {
	personSalary := map[string]int{
		"steve": 12000,
		"jamie": 15000,
	}
	personSalary["mike"] = 9000
	fmt.Println("personSalary map contents:", personSalary)
}
```

上面的程序在声明 `personSalary` 的同时向其中添加了两个元素。接着有添加了一个以 `"mike"` 为`key`的元素。程序的输出为：

```java
personSalary map contents: map[steve:12000 jamie:15000 mike:9000] 
```

key不一定只能是 string 类型。所有可比较的类型，如 boolean，interger，float，complex，string 等，都可以作为key。关于可比较的类型，如果你想了解更多，请访问 [http://golang.org/ref/spec#Comparison_operators。](http://golang.org/ref/spec#Comparison_operators%E3%80%82)

## 访问 map 中的元素

现在我们已经向`map`中添加了一些元素,下面让我们学习怎么来获取它们。获取 `map` 元素的语法是 `map[key]`

```java
package main
import (
	"fmt"
)
func main() {
	personSalary := map[string]int{
		"steve": 12000,
		"jamie": 15000,
	}
	personSalary["mike"] = 9000
	employee := "jamie"
	fmt.Println("Salary of", employee, "is", personSalary[employee])
}
```

上面的程序非常简单。员工 `jamie` 的工资被取出并打印。程序的输出为：`Salary of jamie is 15000`。

如果元素不存在会发生什么？`map`将返回该元素类型的`零值`。如果访问了 `personSalary` 中的不存在的`key`，那么将返回 `int` 的`零值`，也就是 `0`。

```java
package main
import (
	"fmt"
)
func main() {
	personSalary := map[string]int{
		"steve": 12000,
		"jamie": 15000,
	}
	personSalary["mike"] = 9000
	employee := "jamie"
	fmt.Println("Salary of", employee, "is", personSalary[employee])
	fmt.Println("Salary of joe is", personSalary["joe"])
}
```

运行上面的程序,输出为：

```java
Salary of jamie is 15000
Salary of joe is 0
```

上面程序返回 `joe` 的工资是 `0`。获取`map`中不存在的元素时并不会报任何运行时错误。

如果我们想知道map中到底是否存在某个`key`时 怎么做？

```java
value, ok := map[key]
```

上面就是获取 `map` 中某个 `key` 是否存在的语法。如果 `ok` 是 `true`，表示`key` 存在，`key` 对应的值就是 `value` ，否则表示 `key` 不存在。

```java
package main
import (
	"fmt"
)
func main() {
	personSalary := map[string]int{
		"steve": 12000,
		"jamie": 15000,
	}
	personSalary["mike"] = 9000
	newEmp := "joe"
	value, ok := personSalary[newEmp]
	if ok == true {
		fmt.Println("Salary of", newEmp, "is", value)
	} else {
		fmt.Println(newEmp, "not found")
	}
}
```

在上面的程序第 `15` 行，`ok` 为 `false` 因为 `joe` 不存在。因此程序的输出为：

```java
joe not found
```

## for range 可用于遍历 map 中所有的元素

```java
package main
import (
	"fmt"
)
func main() {
	personSalary := map[string]int{
		"steve": 12000,
		"jamie": 15000,
	}
	personSalary["mike"] = 9000
	fmt.Println("All items of a map")
	for key, value := range personSalary {
		fmt.Printf("personSalary[%s] = %d\n", key, value)
	}
}
```

上面的程序输出如下：

```java
All items of a map  
personSalary[mike] = 9000  
personSalary[steve] = 12000  
personSalary[jamie] = 15000
```

`注意`：因为`map`是无序的，当使用 `for range` 遍历 `map` 时，不能保证每次执行程序获取的元素顺序相同。

## 删除元素

`delete(map, key)` 用于删除 `map` 中的 `key`。`delete` 函数没有返回值。

```java
package main
import (
	"fmt"
)
func main() {
	personSalary := map[string]int{
		"steve": 12000,
		"jamie": 15000,
	}
	personSalary["mike"] = 9000
	fmt.Println("map before deletion", personSalary)
	delete(personSalary, "steve")
	fmt.Println("map after deletion", personSalary)
}
```

上面的程序删除 `steve` 为`key`的元素。程序输出为：

```java
map before deletion map[steve:12000 jamie:15000 mike:9000]  
map after deletion map[mike:9000 jamie:15000] 
```

## map 的大小

用内置函数 `len` 获取 `map` 的大小：

```java
package main
import (
	"fmt"
)
func main() {
	personSalary := map[string]int{
		"steve": 12000,
		"jamie": 15000,
	}
	personSalary["mike"] = 9000
	fmt.Println("length is", len(personSalary))
}
```

上面程序中，`len(personSalary)` 获取 `personSalary` 的大小。上面的程序输出：`length is 3`。

与[切片](/zhuanlan/other/golang/4/11.html)类似，`map`是引用类型。将`map`分配给新变量时，它们都指向相同的内部数据结构。因此，在一个中做出的改变将反映在另一个中。

```java
package main
import (
	"fmt"
)
func main() {
	personSalary := map[string]int{
		"steve": 12000,
		"jamie": 15000,
	}
	personSalary["mike"] = 9000
	fmt.Println("Original person salary", personSalary)
	newPersonSalary := personSalary
	newPersonSalary["mike"] = 18000
	fmt.Println("Person salary changed", personSalary)
}
```

上面的程序中，第 `14` 行，`personSalary` 赋值给新的变量 `newPersonSalary`。下一行，将 `newPersonSalary` 中 `mike` 的工资改为 `18000`。那么在 `personSalary` 中 `mike` 的工资也将变为 `18000`。程序的输出如下：

```java
Original person salary map[steve:12000 jamie:15000 mike:9000]
Person salary changed map[jamie:15000 mike:18000 steve:12000]
```

类似的，将 `map` 作为参数传递给函数也是一样的。在函数中对 `map` 的任何修改，在函数外部都是可见的。

## map的比较

`map` 不能通过 `==` 操作符比较是否相等。`==` 操作符只能用来检测 `map` 是否为 `nil`。

```java
package main
func main() {
	map1 := map[string]int{
		"one": 1,
		"two": 2,
	}
	map2 := map1
	if map1 == map2 {
	}
}
```

上面的程序将会报编译错误：`invalid operation: map1 == map2 (map can only be compared to nil)`。

判断两个 `map` 是否相等的方法是遍历比较两个 `map` 中的每个元素。我建议你写一段这样的程序实现这个功能
