# 04、Golang 教程 - 基本类型
- 来源：https://ddkk.com/zhuanlan/other/golang/4/4.html
- 分类：其他语言
- 分组：教程目录
以下是go中可用的基本类型:

- bool
- Numeric Types
- int8, int16, int32, int64, int
- uint8,uint16,uin32,uint64, uint
- float32, float64
- complex64, complex128
- byte
- rune
- string

## bool(布尔型)

一个布尔类型的值只有两种：`true`和`false`。`if`和`for`语句的条件部分都是布尔类型的值，并且`==`和`<`比较操作也会产生布尔型的值。一元操作符`!`对应逻辑非操作，因此`!true`的值为`false`。

布尔值可以和`&&（AND`）和`||（OR）`操作符结合，并且可能会有短路行为：如果运算符左边值已经可以确 定整个布尔表达式的值，那么运算符右边的值将不在被求值。

如下程序：

```java
package main
import "fmt"
func main() {
	var a bool = true
	b := false
	fmt.Println("a:", a, "b:", b)
	c := a && b
	fmt.Println("c:", c)
	d := a || b
	fmt.Println("d:", d)
}
```

这里`a` 被赋值为 `true`，`b` 被赋值为 `false`。

`c`被赋值为 `a && b`。与操作符（`&&`）仅在 `a` 与 `b` 都为 `true` 时才返回 `true`，因此在这里 `c` 被赋值为 `false`。

或操作符（`||`）在 `a` 与 `b` 中至少有一个为 `true` 时返回 `true`。在这里因为 `a` 为 `true`，因此 `d` 也被赋值为 `true`。运行程序,将输出以下内容：

```java
a: true b: false  
c: false  
d: true
```

`注意`：布尔值并不会隐式转换为数字值0或1，反之亦然。必须使用一个显式的`if`语句辅助转换。

## 有符号整型

**int8**：表示8位有符号整数

**size**：8 bits

**range**：-128 ~ 127

**int16**：表示16位有符号整数

**size**：16 bits

**range**：-32768 ~ 32767

**int32**： 表示32位有符号整数

**size**： 32 bits

**range**： -2147483648 ~ 2147483647

**int64**： 表示64位有符号整数

**size**： 64 bits

**range**： -9223372036854775808 ~ 9223372036854775807

**int**： 根据操作系统不同，表示32或64位整数。在实际编程中，除非对大小有明确的要求，否则一般应该使用 int 表示整数。

**size**： 在32位系统下 32 bits，在64位系统下 64 bits

**range**： 在32位系统下 -2147483648 ~ 2147483647，在64位系统下 -9223372036854775808 ~ 9223372036854775807

```java
package main
import "fmt"
func main() {
	var a int = 89
	b := 95
	fmt.Println("value of a is", a, "and b is", b)
}
```

以上程序将输出:

```java
value of a is 89 and b is 95
```

在上面的程序中，`a` 的类型指定为 `int`，而 `b` 的类型从其初始值（`95`）推导。上面我们提到，`int` 的大小在`32位系统`下是`32位`，而在`64位系统`下是`64位`。下面让我们验证这个描述。

变量的类型可以在 `Printf()` 函数中通过 `%T` 格式化指示符（format specifier）来打印。Go的 [unsafe](https://golang.org/pkg/unsafe/) 包中提供了一个名为 [Sizeof](https://golang.org/pkg/unsafe/#Sizeof) 的方法，该方法接收一个变量并返回它的大小（`byte数`）。因为使用 `unsafe` 包可能会带来移植性问题，所以它是一个不安全的软件包，因此我们需要谨慎使用它，但出于本教程的目的，我们可以使用它。

以下程序输出变量`a`和`b`的类型和大小。`%T`是打印类型的格式说明符，`%d`用于打印大小。

```java
package main
import (
	"fmt"
	"unsafe"
)
func main() {
	var a int = 89
	b := 95
	fmt.Println("value of a is", a, "and b is", b)
	fmt.Printf("type of a is %T, size of a is %d", a, unsafe.Sizeof(a))   //type and size of a
	fmt.Printf("\ntype of b is %T, size of b is %d", b, unsafe.Sizeof(b)) //type and size of b
}
```

运行上面的程序，输出如下：

```java
value of a is 89 and b is 95  
type of a is int size of a is 4  
type of b is int size of b is 4 
```

从上面的输出我们可以推断 `a` 和 `b` 是 `int` 类型，它们的大小为 `32 bits` （`4bytes`）。如果在`64位系统`上运行上面的程序那么输出会变得不同。在`64位系统`上，`a` 和 `b` 占 `64 bits`（`8bytes`）。

## 无符号整型

**uint8**： 表示8位无符号整型

**size**： 8 bits

**range**： 0 ~ 255

**uint16**： 表示16位无符号整型

**size**： 16 bits

**range**： 0 ~ 65535

**uint32**： 表示32位无符号整型

**size**： 32 bits

**range**： 0 ~ 4294967295

**uint64**： 表示64位无符号整型

**size**： 64 bits

**range**： 0 ~ 18446744073709551615

**uint** ： 根据底层平台不同表示32或64位无符号整型

**size** ： 32位系统下是32 bits，64位系统下64 bits

**range** ：32位系统下 0 ~ 4294967295，64位系统下 0 ~ 18446744073709551615

## 浮点类型

**float32**：32位浮点型

**float64**：64位浮点型

以下是一个简单的程序来说明整数和浮点类型：

```java
package main
import (
	"fmt"
)
func main() {
	a, b := 5.67, 8.97
	fmt.Printf("type of a %T b %T\n", a, b)
	sum := a + b
	diff := a - b
	fmt.Println("sum", sum, "diff", diff)
	no1, no2 := 56, 89
	fmt.Println("sum", no1+no2, "diff", no1-no2)
}
```

`a`和`b`的类型是从分配给它们的值推断出来的。在这种情况下，`a`和`b`的类型为`float64`。(`float64是浮点值的默认类型`)。我们将 `a` 与 `b` 的和赋值给 `sum`。将 `a` 与 `b` 的差赋值给 `diff`。然后打印 `sum` 和 `diff`。`no1` 和 `no2` 也是同样的操作。运行上面的程序，输出如下：

```java
type of a float64 b float64  
sum 14.64 diff -3.3000000000000007  
sum 145 diff -33
```

## 复数类型

**complex64**：实部和虚部都是 `float32`

**complex128**：实部和虚部都是 `float64`

通过内置函数 [complex](https://golang.org/pkg/builtin/#complex) 来构造一个包含实部和虚部的复数。它的原型为：

```java
func complex(r, i FloatType) ComplexType
```

它将实部和虚部作为参数传递进去并返回一个复数类型，实部和虚部应该为同一类型（`float32` 或 `float64`）。如果实部和虚部都是 `float32`，该函数返回一个类型为 `complex64` 的复数。如果实部和虚部都是 `float64`，该函数返回一个类型为 `complex128` 的复数。

也可以使用简写语法创建复数：

```java
c := 6 + 7i 
```

让我们写一个小程序来理解复数：

```java
package main
import (
	"fmt"
)
func main() {
	c1 := complex(5, 7)
	c2 := 8 + 27i
	cadd := c1 + c2
	fmt.Println("sum:", cadd)
	cmul := c1 * c2
	fmt.Println("product:", cmul)
}
```

在上面的程序中，`c1` 和 `c2` 是两个复数。`c1` 的实部为 `5` 虚部为 `7`。`c2` 的实部为 `8` 虚部为 `27`。`c1` 与 `c2` 的和赋值给 `cadd`。`c1` 与 `c2` 的积赋值给 `cmul`。运行这个程序得到如下输出：

```java
sum: (13+34i)  
product: (-149+191i) 
```

## 其他数字类型

**byte** 是 `uint8` 的别名

**rune** 是 `int32` 的别名

我们将在学习 `string` 类型时详细讨论 `byte` 和 `rune`。

## 字符串类型

在Go中字符串（`String`）是 `byte` 的集合。如果你觉得这个定义没有任何意义也没关系。我们可以假设一个字符串就是一串字符的集合。在后面的教程中我们将单独通过一篇文章来介绍字符串的细节。

让我们写一个程序来理解一下字符串：

```java
package main
import (
	"fmt"
)
func main() {
	first := "Naveen"
	last := "Ramanathan"
	name := first + " " + last
	fmt.Println("My name is", name)
}
```

在上面的程序中，`first` 被赋值为 `"Naveen"`，`last` 被赋值为 `"Ramanathan"`。字符串可以通过 `+` 操作符连接在一起。`name` 被赋值为 `first` 、`空格`与 `last` 三者连接后的结果。运行上面的程序将得到如下输出：

```java
My name is Naveen Ramanathan
```

关于字符串的操作还有很多，我们将在一篇单独的文章中介绍它们。

## 类型转换

Go是强类型的语言，没有隐式的类型提升和转换。让我们看一下这个例子的含义：

```java
package main
import (
	"fmt"
)
func main() {
	i := 55      //int
	j := 67.8    //float64
	sum := i + j //int + float64 not allowed
	fmt.Println(sum)
}
```

上面的代码在C语言中是完全合法的，但是在Go中却不是。`i`的类型是 `int` 而 `j` 的类型是 `float64`，将这两个类型不同的数字相加是非法的。运行这个程序会报错误：`main.go:10: invalid operation: i + j (mismatched types int and float64)`

为了修复这个错误，我们应该将 `i` 和 `j` 转换为同样的类型，在这里让我们将 `j` 转换为 `int`。通过 `T(v)`可以将`v` 的值转换为`T`类型 。

```java
package main
import (
	"fmt"
)
func main() {
	i := 55           //int
	j := 67.8         //float64
	sum := i + int(j) //j is converted to int
	fmt.Println(sum)
}
```

现在，当您运行上述程序时，您可以看到`122`输出。

在赋值时也是如此，将一个变量赋值给另一个类型不同的变量时必须显式转型。下面的程序说明了这一点：

```java
package main
import (
	"fmt"
)
func main() {
	i := 10
	var j float64 = float64(i) //this statement will not work without explicit conversion
	fmt.Println("j", j)
}
```

在`var j float64 = float64(i)`这一行，`i`被转换为 `float64`，然后赋值给`j`。当你尝试将`i`不进行转换直接赋值给`j`时，编译器将报错。
