# 05、Golang 教程 - 常量
- 来源：https://ddkk.com/zhuanlan/other/golang/4/5.html
- 分类：其他语言
- 分组：教程目录
## 常量定义

常量（`constant`）表示固定的值，比如：`5`，`-89`，`"I love Go"`，`67.89` 等等。

看下面这段程序：

```java
var a int = 50  
var b string = "I love Go"
```

上面的程序中，`a`和 `b` 分别被赋值为常量 `50` 和 `"I love Go"`。关键字 `const` 用于指示常量，如 `50` 和 `"I love Go"`。在上面的代码中，尽管没有使用关键字 `const` 修饰 `50`与 `"I love Go"`，但在Go内部中它们是常量。(就跟java中的字符串一样，`"I love Go"`是在字符串常量池中,是无法被改变的，这样的值被称为：字面值常量(literal))

关键字`const` 修饰的名字为常量，不能被重新赋予任何值。 因此下面的程序会报错：`cannot assign to a`。

```java
package main
func main() {
	const a = 55 //allowed
	a = 89       //reassignment not allowed
}
```

常量的值必须在编译期间确定。因此不能将函数的返回值赋给常量，因为函数调用发生在运行期。

```java
package main
import (
	"fmt"
	"math"
)
func main() {
	fmt.Println("Hello, playground")
	var a = math.Sqrt(4)   //allowed
	const b = math.Sqrt(4) //not allowed
}
```

在上面的程序中，`a` 是一个变量因此可以被赋值为函数 `math.Sqrt(4)` 的调用结果。（我们将在单独的教程中更详细的讨论函数）。而 `b` 是一个常量，它的值必须在编译期间确定，但是函数 `math.Sqrt(4)` 的调用结果只能在运行时被计算出来，因此在编译 `const b = math.Sqrt(4)` 时将会报错：`error main.go:11: const initializer math.Sqrt(4) is not a constant.`

## 字符串常量

在Go中任何用双引号`"`括起来的值都是字符串常量，比如 `"Hello World"`，`"Sam"`都是字符串常量。

字符串常量是什么类型呢？答案是： `无类型（untyped）`。

像`"Hello World"` 这样的字符串没有任何类型。

```java
const hello = "Hello World" 
```

上面的代码将 `"Hello World"` 赋给一个名为 `hello` 的常量。那么现在常量 `hello` 是不是就有了类型？答案是否定的。常量`hello` 仍然没有类型。

Go是一种强类型语言。所有变量都需要指定类型。如果没有指定类型,编译器会自动推断，那么下面这个为非类型化常量`sam`分配变量名的程序是如何工作的呢？

```java
package main
import (
	"fmt"
)
func main() {
	var name = "Sam"
	fmt.Printf("type %T value %v", name, name)
}
```

答案是：非类型常量具有与其关联值的默认类型，并且只有当一行代码需要它时，它们才会提供该类型。在变量`name = "sam"`语句中，`name`需要一个类型，它从字符串常量`"sam"`获得默认类型，它是一个字符串`String`。所以上面的程序运行,输出以下内容：

```java
type string value Sam
```

有没有办法创建一个有类型（typed）的常量？答案是肯定的。下面的代码创建了一个有类型常量：

```java
const typedhello string = "Hello World" 
```

上面的代码中， `typedhello` 是一个字符串类型的常量。

Go是一种强类型语言。不允许在分配期间混合类型。让我们通过一个程序来看看这意味着什么。

```java
package main
func main() {
	var defaultName = "Sam" //allowed
	type myString string
	var customName myString = "Sam" //allowed
	customName = defaultName        //not allowed
}
```

在上面的代码中，我们首先创建了一个变量`defaultName`并且赋值为常量`"Sam"`。常量`"Sam"` 的默认类型为`string`，因此赋值之后，`defaultName` 的类型亦为 `string`。

下一行我们创建了一个新的类型 `myString`，它是 `string` 的别名。(可以使用 `type NewType Type` 的语法来创建一个新的类型)。

接着我们创建了一个名为 `customName` 的 `myString` 类型的变量，并将常量 `"Sam"` 赋给它。因为常量 `"Sam"` 是无类型的所以可以将它赋值给任何字符串变量。因此这个赋值是合法的，`customName` 的类型是 `myString`。

现在我们有两个变量：`string` 类型的 `defaultName` 和 `myString` 类型的 `customName`。尽管我们知道 `myString` 是`string` 的一个别名，但是Go的强类型机制不允许将一个类型的变量赋值给另一个类型的变量。因此， `customName = defaultName` 这个赋值是不允许的，编译器会报错：`main.go:10: cannot use defaultName (type string) as type myString in assignment`

## 布尔常量

布尔常量与字符串常量没有什么区别。布尔常量只包含两个值：`true` 和 `false`。字符串常量的规则也同样适用于布尔常量，这里不再赘述。看下面这段代码：

```java
package main
func main() {
	const trueConst = true
	type myBool bool
	var defaultBool = trueConst       //allowed
	var customBool myBool = trueConst //allowed
	defaultBool = customBool          //not allowed
}
```

上面这段程序的结果是不言自明的。

## 数字常量#

数字常量包括整数，浮点数和复数常量。数字常量中有一些细微之处。

让我们看一些例子来说清楚：

```java
package main
import (
	"fmt"
)
func main() {
	const a = 5
	var intVar int = a
	var int32Var int32 = a
	var float64Var float64 = a
	var complex64Var complex64 = a
	fmt.Println("intVar", intVar, "\nint32Var", int32Var, "\nfloat64Var", float64Var, "\ncomplex64Var", complex64Var)
}
```

上面的程序中，`const a` 是无类型的，值为 `5`。你可能想知道 `a`的默认类型是什么？如果它有默认类型，那么它是怎么赋值不同类型的变量的？ 答案在于`a` 时语法。以下程序将使事情更加清晰：

```java
package main
import (
	"fmt"
)
func main() {
	var i = 5
	var f = 5.6
	var c = 5 + 6i
	fmt.Printf("i's type %T, f's type %T, c's type %T", i, f, c)
}
```

在上面的程序中，所有变量的类型都是由数字常量决定的。在语法上看，`5` 在是一个整数，`5.6` 是一个浮点数， `5 + 6i` 是一个复数。运行上面的程序，输出为：`i's type int, f's type float64, c's type complex128`

现在应该很清楚下面的程序是如何工作的了：

```java
package main
import (
	"fmt"
)
func main() {
	const a = 5
	var intVar int = a
	var int32Var int32 = a
	var float64Var float64 = a
	var complex64Var complex64 = a
	fmt.Println("intVar", intVar, "\nint32Var", int32Var, "\nfloat64Var", float64Var, "\ncomplex64Var", complex64Var)
}
```

在这个程序中，`a` 的值是 `5` 并且 `a` 在语法上是泛化的（它可以表示浮点数，整数甚至是没有虚部的复数），因此可以将其分配给任何兼容类型。像 `a` 这种数值常量的默认类型可以想象成是通过上下文动态生成的。`var intVar int = a` 要求 `a` 是一个 `int`，那么 `a`就变成一个`int` 常量。`var complex64Var complex64 = a` 要求 a 是一个 `complex64`，那么 `a`就变成一个 `complex64` 常量。这很好理解。

## 数字表达式#

数值常量可以在表达式中自由混合和匹配，仅当将它们赋值给变量或者在代码中明确需要类型的时候，才需要他们的类型。

```java
package main
import (
	"fmt"
)
func main() {
	var a = 5.9 / 8
	fmt.Printf("a's type %T value %v", a, a)
}
```

在上面的程序中，`5.9`是一个浮点数，并且`8`是一个整数。单仍然允许`5.9 / 8`，因为它们都是数字常量。除法的结果是`0.7375`是浮点数，因此变量`a`是`float`类型。该程序的输出是：`a's type float64 value 0.7375`。
