# 15、Golang 教程 - 指针
- 来源：https://ddkk.com/zhuanlan/other/golang/4/15.html
- 分类：其他语言
- 分组：教程目录
## 什么是指针

指针是存储另一个变量的内存地址的变量。

在上图中，变量 `b` 的值是 `156`，在内存中的地址为 `0x1040a124` 。变量 `a` 存储了变量 `b` 的地址。现在可以说 `a` 指向 `b`。

## 指针的声明

- T是指针变量的类型，它指向类型T的值。

让我们写一些代码。

```java
package main
import (
	"fmt"
)
func main() {
	b := 255
	var a *int = &b
	fmt.Printf("Type of a is %T\n", a)
	fmt.Println("address of b is", a)
}
```

`&`操作符用来获取一个变量的地址。在上面的程序第 `9` 行我们将 `b` 的地址赋给 `a`，`a` 的类型为 `*int`。现在我们说 `a` 指向了 `b`。让我们打印 `a` 的类型，和`b` 的地址。程序的输出为：

```java
Type of a is *int  
address of b is 0x1040a124  
```

你应该会得到一个不同的地址，因为`b` 可能处于内存的任何位置。

## 指针的零值

指针的零值是`nil`。

```java
package main
import (
	"fmt"
)
func main() {
	a := 25
	var b *int
	if b == nil {
		fmt.Println("b is", b)
		b = &a
		fmt.Println("b after initialization is", b)
	}
}
```

在上面的程序中，`b` 的初始值为 `nil`。然后将 `a` 的地址赋值给 `b`。该程序输出：

```java
b is <nil>  
b after initialisation is 0x1040a124  
```

## 指针的解引用

指针的解引用可以获取指针所指向的变量的值。将 `a` 解引用的语法是 `*a`。

让我们看看它在程序中是如何工作的。

```java
package main
import (
	"fmt"
)
func main() {
	b := 255
	a := &b
	fmt.Println("address of b is", a)
	fmt.Println("value of b is", *a)
}
```

上面程序的第`10`行，我们将 `a` 解引用并打印这个解引用得到的值。正如预期的那样，程序打印的是 `b` 的值。程序的输出为：

```java
address of b is 0x1040a124  
value of b is 255  
```

让我们再写一个程序，我们用指针改变`b`中的值。

```java
package main
import (
	"fmt"
)
func main() {
	b := 255
	a := &b
	fmt.Println("address of b is", a)
	fmt.Println("value of b is", *a)
	*a++
	fmt.Println("new value of b is", b)
}
```

在上面的程序中，我们将 `a` 指针指向的值加 `1`，这样做也改变了 `b` 的值，因为 `a` 指向 `b`。因此 `b` 的值变为 `256`。程序的输出为：

```java
address of b is 0x1040a124  
value of b is 255  
new value of b is 256  
```

## 将指针传递给函数

```java
package main
import (
	"fmt"
)
func change(val *int) {
	*val = 55
}
func main() {
	a := 58
	fmt.Println("value of a before function call is", a)
	b := &a
	change(b)
	fmt.Println("value of a after function call is", a)
}
```

在上面的程序第 `14` 行，我们将指向 `a` 的指针 `b` 传递给函数 `change`。在函数 `change` 内部，第 `8` 行通过解引用修改了 `a` 的值。程序的输出如下：

```java
value of a before function call is 58  
value of a after function call is 55  
```

## 不要将指向数组的指针作为函数的参数传递。请改用切片。

假设我们想在函数内部对一个数组进行一些修改，并且在函数内部对数组所做的更改在函数外部可见。一种方法是将指向数组的指针作为函数的参数传递。

```java
package main
import (
	"fmt"
)
func modify(arr *[3]int) {
	(*arr)[0] = 90
}
func main() {
	a := [3]int{
     89, 90, 91}
	modify(&a)
	fmt.Println(a)
}
```

在上面的程序第`13`行，数组 `a` 的地址传递给了函数 `modify`。在第`8`行的 `modify` 函数中，我们通过解引用的方式将数组的第一个元素赋值为 `90`。该程序输出为：`[90 90 91]`。

`a[x]` 是 `(*a)[x]` 的简写，因此上面的程序中，`(*arr)[0]` 可以替换为 `arr[0]`。让我们用这种简写方式重写上面的程序：

```java
package main
import (
	"fmt"
)
func modify(arr *[3]int) {
	arr[0] = 90
}
func main() {
	a := [3]int{
     89, 90, 91}
	modify(&a)
	fmt.Println(a)
}
```

该程序也输出： `[90 90 91]`。

虽然这种将指向数组的指针作为函数的参数传递并对其进行修改的方式有效，但这并不是在Go中实现此目的的惯用方法。我们有[切片](/zhuanlan/other/golang/4/11.html)。

让我们使用切片重写上面的程序。

```java
package main
import (
	"fmt"
)
func modify(sls []int) {
	sls[0] = 90
}
func main() {
	a := [3]int{
     89, 90, 91}
	modify(a[:])
	fmt.Println(a)
}
```

在上面的程序第`13`行，我们传递了一个切片给 `modify` 函数。在函数内部，切片的第一个元素被修改为 `90`。程序的输出为：`[90 90 91]`。所以请不要以数组指针作为参数传递给函数，而是使用切片。这样的代码更加简洁，在 Go 中更常用的一种方式。

## Go不支持指针运算#

Go不支持像C这样的其他语言中存在的指针算法。

```java
package main
func main() {
	b := [...]int{
     109, 110, 111}
	p := &b
	p++
}
```

上面的程序将报错：`main.go:6: invalid operation: p++ (non-numeric type *[3]int)`。
