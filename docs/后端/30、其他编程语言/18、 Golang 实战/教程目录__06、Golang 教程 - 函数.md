# 06、Golang 教程 - 函数
- 来源：https://ddkk.com/zhuanlan/other/golang/4/6.html
- 分类：其他语言
- 分组：教程目录
## 什么是函数

函数是执行特定任务的代码块。函数接受输入，对输入执行一些计算并生成输出。

## 函数声明

在Go 中声明一个函数的语法为：

```java
func functionname(parametername type) returntype {
 //function body
}
```

函数声明以`func`关键字开头，后面是函数名称。接着在一对`()`中是参数列表，然后是函数的返回类型，指定参数的语法为参数名称后面跟着参数类型。可以指定任意数量的参数，形式为： `(parameter1 type, parameter2 type)`，最后一对`{}`中是函数体。

参数和返回类型在函数中是可选的。因此，以下语法也是有效的函数声明：

```java
func functionname() {
}
```

## 一个函数例子

让我们编写一个函数，它将产品的单价和产品数量作为输入参数，并计算总价格作为输出。

```java
func calculateBill(price int, no int) int {
	var totalPrice = price * no
	return totalPrice
}
```

上面的函数接受两个 `int` 类型的输入参数：`price` 和 `no`，并返回 `totalPrice`（price 与 no 的乘积） 。返回值的类型也是 `int`。

如果连续的参数属于同一类型，我们可以避免每次都写入类型，只需要在结束时写入一次就足够了。即 `price int, no int`可以写成`price, no int`。因此，上述功能可以改写为：

```java
func calculateBill(price, no int) int {
    var totalPrice = price * no
    return totalPrice
}
```

已经定义好了函数，现在让我们在代码中调用它。调用函数的语法为：`functionname(parameters)`。上面定义的函数 `calculateBill` 可以通过下面的代码调用：

```java
calculateBill(10, 5)
```

下面是完整的程序，它调用 `calculateBill`并计算总价格。

```java
package main
import (
	"fmt"
)
func calculateBill(price, no int) int {
	var totalPrice = price * no
	return totalPrice
}
func main() {
	price, no := 90, 6
	totalPrice := calculateBill(price, no)
	fmt.Println("Total price is", totalPrice)
}
```

运行上面的程序,输出如下内容：

```java
Total price is 540
```

## 多个返回值

一个函数也可以返回多个值，让我们编写一个`rectProps`函数，它的输入参数为矩形的长度和宽度，并返回矩形的面积和周长。矩形的面积是长度和宽度的乘积，周长是长度和宽度之和的两倍。

```java
package main
import (
	"fmt"
)
func rectProps(length, width float64) (float64, float64) {
	var area = length * width
	var perimeter = (length + width) * 2
	return area, perimeter
}
func main() {
	area, perimeter := rectProps(10.8, 5.6)
	fmt.Printf("Area %f Perimeter %f", area, perimeter)
}
```

如果一个函数有多个返回值，那么这些返回值应该用小括号`()`括起来，比如：`func rectProps(length, width float64)(float64, float64)`接受两个类型为 `float64`的参数（length 和 width），并且同样返回两个类型为 `float64` 的返回值。上面程序的输出为：`Area 60.480000 Perimeter 32.800000`

## 命名返回值

可以给一个函数的返回值指定具体的名字，如果指定了返回值的具体名字，则可以认为是在函数体的第一行声明了该名字的变量。

上面的`rectProps` 函数可以用命名返回值的形式重写为如下：

```java
func rectProps(length, width float64)(area, perimeter float64) {
    area = length * width
    perimeter = (length + width) * 2
    return //no explicit return value
}
```

`area`和`perimeter`是上述函数中的命名返回值。请注意，函数中的`return`语句不会显式返回任何值。由于`area`和`perimeter`在函数声明中指定为返回值，因此遇到`return`语句时会自动从函数返回它们。

`注意`：虽然在命名返回值的函数中，`return`语句不会显示的返回任何值,但是不可以省略 `return`关键字。

## 空白标识符

`_`被称为Go中的空白标识符。它可以用来代替任何类型的任何值。让我们看看这个空白标识符的用途。

上面的`rectProps`函数返回矩形的面积和周长。如果我们只需要`area`和想要放弃`perimeter`。这个时候可以使用空白标识符。

下面的程序仅接收 `rectProps` 返回的 `area`：

```java
package main
import (
	"fmt"
)
func rectProps(length, width float64) (float64, float64) {
	var area = length * width
	var perimeter = (length + width) * 2
	return area, perimeter
}
func main() {
	area, _ := rectProps(10.8, 5.6) // perimeter is discarded
	fmt.Printf("Area %f ", area)
}
```

在`area, _ := rectProps(10.8, 5.6)` 这一行，我们仅仅获取了 `area`，而使用空指示符`_`来忽略第二个返回值（perimeter）。
