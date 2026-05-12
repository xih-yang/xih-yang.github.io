# 12、Golang 教程 - 变参函数
- 来源：https://ddkk.com/zhuanlan/other/golang/4/12.html
- 分类：其他语言
- 分组：教程目录
## 什么是变参函数？

变参函数是指可以接受可变数量的参数的函数。

## 语法

如果函数的最后一个参数表示为`...T`，则该函数可以接受任意数量`T`类型参数。

`注意`：必须是参数列表的最后一个参数才可以指定为可变参数。

## 通过示例来理解可变函数如何工作

你有没有想过，为什么 `append` 函数可以追加任意数量的值到切片中？这是因为它是一个变参函数：

```java
func append(slice []Type, elems ...Type) []Type  
```

上面是`append`函数的定义，在这个定义中`elems`是一个可变参数。因此`append`可以接受可变数量的参数。

让我们创建自己的变参函数。我们将编写一个简单的程序来查找参数列表中是否存在某个整数，如果存在,就打印其所在的索引位置：

```java
package main
import (
	"fmt"
)
func find(num int, nums ...int) {
	fmt.Printf("type of nums is %T\n", nums)
	found := false
	for i, v := range nums {
		if v == num {
			fmt.Println(num, "found at index", i, "in", nums)
			found = true
		}
	}
	if !found {
		fmt.Println(num, "not found in ", nums)
	}
	fmt.Printf("\n")
}
func main() {
	find(89, 89, 90, 95)
	find(45, 56, 67, 45, 90, 109)
	find(78, 38, 56, 98)
	find(87)
}
```

在上面的程序中，`func find(num int, nums ...int)` 接受任意数量的参数。在`find`函数中参数 `nums` 的类型为整型切片。

变参函数的工作原理是把可变参数转换为可变参数类型的新切片。例如，在上面程序中的第 `22` 行，`find` 函数中的可变参数是 `89`，`90`，`95` 。 `find` 函数接受一个 `int` 类型的可变参数。因此这三个参数被编译器转换为一个 `int` 类型切片 `[]int{89, 90, 95}` 然后被传入`find`函数。

在第`10` 行， `for` 循环遍历切片`nums`,如果 `num` 在切片中，则打印 `num` 的位置。如果不存在,则打印未找到。

上面程序的输出结果为：

```java
type of nums is []int
89 found at index 0 in [89 90 95]
type of nums is []int
45 found at index 2 in [56 67 45 90 109]
type of nums is []int
78 not found in  [38 56 98]
type of nums is []int
87 not found in  []
```

在上面程序的第 `25` 行，`find` 函数只有一个参数。我们没有给可变参数 `nums ...int` 传入任何参数。这是完全合法的，在这种情况下 `nums` 是一个长度和容量为 `0` 的 `nil` 切片。

## 将切片作为可变参数传递给函数

我们已经知道可变参数在函数内部是切片。那么可以传递一个切片给可变参数吗？让我们将一个切片传递给一个可变参数，通过下面的例子看一下发生了什么。

```java
package main
import (
	"fmt"
)
func find(num int, nums ...int) {
	fmt.Printf("type of nums is %T\n", nums)
	found := false
	for i, v := range nums {
		if v == num {
			fmt.Println(num, "found at index", i, "in", nums)
			found = true
		}
	}
	if !found {
		fmt.Println(num, "not found in ", nums)
	}
	fmt.Printf("\n")
}
func main() {
	nums := []int{
     89, 90, 95}
	find(89, nums)
}
```

在程序的第 `23` 行，我们将一个切片传递给一个可变参数。这是非法的，上面的程序将报错：`main.go:23: cannot use nums (type []int) as type int in argument to find`。

为什么这样不行呢？原因很直接,`find` 函数的说明如下：

```java
func find(num int, nums ...int)  
```

根据变参函数的定义，`nums ...int`意味着它将接受可变数量的`int`类型参数。

在上面程序的第`23`行中，将`nums`作为一个可变参数传递给`find`函数。正如我们已经讨论过的那样，这些可变参数将转换为`int`类型的切片。在这种情况下，`nums`已经是一个`int`类型切片，编译器尝试使用`nums`创建一个新的`[]int`切片，像下面这样：

```java
find(89, []int{
     nums})  
```

因为`nums` 是一个 `[]int`类型 而不是 `int`类型。类型根本就不相同，所以会失败。

那么有没有办法将切片传递给变参函数？答案是肯定的。

有一个语法糖可用于将切片传递给变参函数。你必须为切片添加后缀`...`，这样则可以将切片直接传递给函数，而不会创建新切片。

在上面的程序中，如果你将第 `23` 行的 `find(89, nums)`替换为 `find(89, nums...)`，程序将成功编译并有如下输出：

```java
type of nums is []int
89 found at index 0 in [89 90 95]
```

下面是完整的程序供您参考。

```java
package main
import (
	"fmt"
)
func find(num int, nums ...int) {
	fmt.Printf("type of nums is %T\n", nums)
	found := false
	for i, v := range nums {
		if v == num {
			fmt.Println(num, "found at index", i, "in", nums)
			found = true
		}
	}
	if !found {
		fmt.Println(num, "not found in ", nums)
	}
	fmt.Printf("\n")
}
func main() {
	nums := []int{
     89, 90, 95}
	find(89, nums...)
}
```

## 注意事项

在变参函数中修改切片时，请确保知道自己在做什么。

让我们看一个简单的例子。

```java
package main
import (
	"fmt"
)
func change(s ...string) {
	s[0] = "Go"
}
func main() {
	welcome := []string{
     "hello", "world"}
	change(welcome...)
	fmt.Println(welcome)
}
```

你认为这段代码将输出什么呢？如果你认为它输出 `[Go world]` 。恭喜你！你已经理解了可变参数函数和切片。如果你猜错了，没什么大不了，让我来解释下为什么会有这样的输出。

在第`13` 行，我们使用了语法糖 `...` 并且将切片作为可变参数传入 `change` 函数。

正如前面我们所讨论的，如果使用了`...`，`welcome` 切片本身会作为参数直接传入，而不会创建新的切片。因此，`welcome` 将作为参数传入 `change` 函数。

在`change` 函数中，切片的第一个元素被更改为 `Go`，这样程序产生了下面的输出值

```java
[Go world]
```

还有另一个例子来理解变参函数：

```java
package main
import (
	"fmt"
)
func change(s ...string) {
	s[0] = "Go"
	s = append(s, "playground")
	fmt.Println(s)
}
func main() {
	welcome := []string{
     "hello", "world"}
	change(welcome...)
	fmt.Println(welcome)
}
```

上面的程序中,我们将切片`welcome`作为参数传递给`change` 函数,因为切片传递是引用传递,在函数体内容对切片进行修改，在函数外部依然是改变之后的结果,但是当新元素追加到切片时，会创建一个新数组。将现有数组的元素复制到此新数组，并返回此新数组的新切片引用。因此,在函数内部打印的`s`其实新数组的切片,在函数执行之后打印的`welcome` 是之前的切片,所以程序输出如下：

```java
[Go world playground]
[Go world]
```
