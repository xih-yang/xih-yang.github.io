# 03、Golang 教程 - 变量
- 来源：https://ddkk.com/zhuanlan/other/golang/4/3.html
- 分类：其他语言
- 分组：教程目录
## 什么是变量

变量是为存储特定类型的值的内存位置指定的名称。在 Go 中有多种声明变量的语法。

## 声明一个变量

声明一个变量的语法为：`var name type`，例如：

```java
package main
import "fmt"
func main() {
    var age int // variable declaration
    fmt.Println("my age is", age)
}
```

该语句`var age int`声明了一个名为`age`的`int`类型的变量。我们没有为变量分配任何值。如果没有为变量赋值，则使用变量类型的零值自动初始化它。在这种情况下，`age`被赋值为0。如果运行此程序，则可以看到以下输出:

```java
my age is 0 
```

一个变量可以被赋予其类型的任何值。例如，在上例中，age 可以被赋予任何整型值：

```java
package main
import "fmt"
func main() {
    var age int // variable declaration
    fmt.Println("my age is ", age)
    age = 29 //assignment
    fmt.Println("my age is", age)
    age = 54 //assignment
    fmt.Println("my new age is", age)
}
```

运行程序,输出如下内容：

```java
my age is  0  
my age is 29  
my new age is 54 
```

## 声明具有初始值的变量

变量也可以在声明时给出初始值。

声明一个带初值的变量的语法为：`var name type = initialvalue`，例如：

```java
package main
import "fmt"
func main() {
    var age int = 29 // variable declaration with initial value
    fmt.Println("my age is", age)
}
```

在上面的程序中，`age`是`int`类型的变量并且具有初始值`29`.如果运行上述程序，则可以看到以下输出。它显示年龄，值为`29`。

```java
my age is 29  
```

## 类型推断

如果声明一个变量时提供了初始值，Go可以根据该初始值来自动推断出该变量的类型。因此如果声明变量时提供了初始值，就可以不必指定其类型。

也就是说，如果声明变量的形式为：`var name = initialvalue`，Go将根据 `initialvalue` 自动推导变量 `name` 的类型。

在下面的例子中，你可以看到声明变量 `age` 时并没有指定其类型。因为 `age` 的初值为 `29`，Go 自动推断其类型为 `int`。

```java
package main
import "fmt"
func main() {
    var age = 29 // type will be inferred
    fmt.Println("my age is", age)
}
```

## 多变量声明

可以在一条语句中声明多个变量。

声明多个变量的语法为：`var name1, name2 type = initialvalue1, initialvalue2`，例如：

```java
package main
import "fmt"
func main() {
    var width, height int = 100, 50 //declaring multiple variables
    fmt.Println("width is", width, "height is", height)
}
```

如果声明多个变量时,指定了初始值,则可以省略`type`类型，下面的程序使用类型推断声明多个变量。

```java
package main
import "fmt"
func main() {
    var width, height = 100, 50 //"int" is dropped
    fmt.Println("width is", width, "height is", height)
}
```

运行上面的程序,将打印如下内容：

```java
width is 100 height is 50
```

正如你猜想的那样，如果不指定 `width` 和 `height` 的初值，它们将自动被赋值为 `0`，也就是说它们将以 `0` 作为初值：

```java
package main
import "fmt"
func main() {
    var width, height int
    fmt.Println("width is", width, "height is", height)
    width = 100
    height = 50
    fmt.Println("new width is", width, "new height is ", height)
}
```

运行上面的程序,将会输出以下内容：

```java
width is 0 height is 0  
new width is 100 new height is  50  
```

有些时候我们需要在一条语句中声明多个不同类型的变量。我们可以使用下面的语法：

```java
var (  
      name1 = initialvalue1,
      name2 = initialvalue2
)
```

以下程序使用上述语法来声明不同类型的变量。

```java
package main
import "fmt"
func main() {
    var (
        name   = "naveen"
        age    = 29
        height int
    )
    fmt.Println("my name is", name, ", age is", age, "and height is", height)
}
```

这里我们声明了一个字符串类型的变量 `name`，以及两个整型的变量 `age` 和 `height`。（我们将在下一篇教程中讨论 Golang 中可用的类型）。运行上面的程序将输出如下内容：

```java
my name is naveen , age is 29 and height is 0
```

## 简短的声明

Go还提供了另一种简洁的方式来声明变量。这称为简写声明，它使用`:=`操作符来声明变量。

简写声明的语法为：`name := initialvalue`，例如：

```java
package main
import "fmt"
func main() {
    name, age := "naveen", 29 //short hand declaration
    fmt.Println("my name is", name, "age is", age)
}
```

运行上面的程序,输出如下内容：

```java
my name is naveen age is 29
```

简写声明需要给等号左侧的所有变量指定初始值。以下程序将抛出错误`cannot assign 1 values to 2 variables`。这是因为没有为`age`指定初始值。

```java
package main
import "fmt"
func main() {
    name, age := "naveen" //error
    fmt.Println("my name is", name, "age is", age)
}
```

简写声明要求在`:=`的左侧必须至少有一个变量是新声明的,如下：

```java
package main
import "fmt"
func main() {
    a, b := 20, 30 // declare variables a and b
    fmt.Println("a is", a, "b is", b)
    b, c := 40, 50 // b is already declared but c is new
    fmt.Println("b is", b, "c is", c)
    b, c = 80, 90 // assign new values to already declared variables b and c
    fmt.Println("changed b is", b, "c is", c)
}
```

如上程序，在 `b, c := 40, 50` 这一行，虽然变量 `b` 在之前已经被声明了，但是 `c` 却是新声明的变量，因此这是合法的。该程序的输出为：

```java
a is 20 b is 30
b is 40 c is 50
changed b is 80 c is 90
```

如果我们运行以下程序：

```java
package main
import "fmt"
func main() {
	a, b := 20, 30 //a and b declared
	fmt.Println("a is", a, "b is", b)
	a, b := 40, 50 //error, no new variables
}
```

将会报错：`8: no new variables on left side of :=` 。这是因为变量 `a` 和变量 `b` 都是已经声明过的变量，在`:=` 左侧并没有新的变量被声明。

`注意：简写声明只能运行在函数的内部,不能用来声明全局变量`,如下：

```java
package main
import "fmt"
age := 29
func main() {
	fmt.Println("my age is ",age)
}
```

运行上面的程序,将抛出一个语法错误，`syntax error: non-declaration statement outside function body` 。

还可以为变量分配在运行时计算的值。如下：

```java
package main
import (
	"fmt"
	"math"
)
func main() {
	a, b := 145.8, 543.8
	c := math.Min(a, b)
	fmt.Println("minimum value is ", c)
}
```

在上面的程序中， `c` 的值为 `a` 和 `b` 的最小值，该值是在运行时计算出来的。运行输出如下内容：

```java
minimum value is  145.8  
```

由于Go是强类型的，因此声明属于一种类型的变量不能分配另一种类型的值。以下程序将抛出一个错误，`cannot use "naveen" (type string) as type int in assignment`因为`age`被声明为`int`类型，我们正在尝试为它分配一个字符串值。

```java
package main
func main() {
	age := 29      // age is int
	age = "naveen" // error since we are trying to assign a string to a variable of type int
}
```
