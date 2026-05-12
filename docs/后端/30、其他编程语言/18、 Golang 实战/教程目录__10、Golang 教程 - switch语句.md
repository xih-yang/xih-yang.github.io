# 10、Golang 教程 - switch语句
- 来源：https://ddkk.com/zhuanlan/other/golang/4/10.html
- 分类：其他语言
- 分组：教程目录
`switch`是一个条件语句，用于将一个表达式的结果与可能存在的值列表 进行比较，并根据匹配的结果执行对应的代码块。它可以被认为是编写多个`if else`子句的替代方式。

举例是说明问题的最好方式,让我们从一个简单的示例开始，程序接受一个手指号，并输出该手指号对应的的名称。例如，`1`是拇指，`2`是食指等。

```java
package main
import (
	"fmt"
)
func main() {
	finger := 4
	switch finger {
	case 1:
		fmt.Println("Thumb")
	case 2:
		fmt.Println("Index")
	case 3:
		fmt.Println("Middle")
	case 4:
		fmt.Println("Ring")
	case 5:
		fmt.Println("Pinky")
	}
}
```

在上面的程序中，`switch finger` 语句 将 `finger`的值 依次 与 每一个 `case` 语句值 进行比较 ，直到找到第一个与 `finger` 匹配的 `case`，并执行其中的代码。在这里 `finger` 的值为 `4`，因此打印 `Ring`。

可匹配的列表不允许出现重复项,也就是说 不允许出现多个相同值的`case`，如果您尝试运行下面的程序，编译器会报这样的错误: `main.go:18:2: duplicate case 4 in switch previous case at tmp/sandbox887814166/main.go:16:7`

```java
package main
import (
	"fmt"
)
func main() {
	finger := 4
	switch finger {
	case 1:
		fmt.Println("Thumb")
	case 2:
		fmt.Println("Index")
	case 3:
		fmt.Println("Middle")
	case 4:
		fmt.Println("Ring")
	case 4: //duplicate case
		fmt.Println("Another Ring")
	case 5:
		fmt.Println("Pinky")
	}
}
```

## default case

我们只有`5`个手指。如果输入错误的手指号码会发生什么。这是默认情况。当没有其他情况匹配时，将执行默认情况。

```java
package main
import (
	"fmt"
)
func main() {
	switch finger := 8; finger {
      //finger is declared in switch
	case 1:
		fmt.Println("Thumb")
	case 2:
		fmt.Println("Index")
	case 3:
		fmt.Println("Middle")
	case 4:
		fmt.Println("Ring")
	case 5:
		fmt.Println("Pinky")
	default: //default case
		fmt.Println("incorrect finger number")
	}
}
```

在上面的程序中，`finger` 的值为 `8`，没有 `case`与它匹配，因此打印 `incorrect finger number`。`default` 语句不必放在 `switch`语句的最后，而可以放在 `switch` 语句的任何位置。

你可能还注意到声明中的一些小变化，`finger`声明在了 `switch` 语句中，`switch` 语句可以包含一个可选的`statement`，该`statement`在表达式求值之前执行。在 `switch finger := 8; finger` 这一行中， `finger` 首先被声明，然后作为表达式被求值。这种方式声明的 `finger` 只能在 `switch` 语句中访问。

## case多表达式

可以在一个 `case` 中包含多个表达式，每个表达式用逗号分隔。

```java
package main
import (
	"fmt"
)
func main() {
	letter := "i"
	switch letter {
	case "a", "e", "i", "o", "u": //multiple expressions in case
		fmt.Println("vowel")
	default:
		fmt.Println("not a vowel")
	}
}
```

上面的程序检测 `letter` 是否是元音。`case "a", "e", "i", "o", "u":`这一行匹配所有的元音。程序的输出为：`vowel`。

## 没有表达式的switch

`switch` 中的表达式是可选的，可以省略。如果省略表达式，则相当于 `switch true`，这种情况下会将每一个 `case` 的表达式的求值结果与 `true` 做比较，如果匹配，则执行相应的代码块。

```java
package main
import (
	"fmt"
)
func main() {
	num := 75
	switch {
      // expression is omitted
	case num >= 0 && num <= 50:
		fmt.Println("num is greater than 0 and less than 50")
	case num >= 51 && num <= 100:
		fmt.Println("num is greater than 51 and less than 100")
	case num >= 101:
		fmt.Println("num is greater than 100")
	}
}
```

在上面的程序中，`switch` 后面没有表达式因此被认为是 `switch true` 并对每一个 `case` 表达式的求值结果比较。`case num >= 51 && num <= 100:`的求值结果为 `true`，因此程序输出：`num is greater than 51 and less than 100`。这种类型的 `switch` 语句可以替代多重 `if else` 子句。

## fallthrough

在Go 中执行完一个 `case` 之后会立即退出 `switch` 语句。`fallthrough`用于标明执行完当前 `case` 语句之后按顺序执行下一个`case` 语句。

让我们写一个程序来了解`fallthrough`。我们的程序将检查输入数字是否小于`50`，`100` 或 `200`.例如，如果我们输入`75`，程序将打印`75`小于`100`和`200`.我们将使用`fallthrough`实现此输出。

```java
package main
import (
	"fmt"
)
func number() int {
	num := 15 * 5
	return num
}
func main() {
	switch num := number(); {
      //num is not a constant
	case num < 50:
		fmt.Printf("%d is lesser than 50\n", num)
		fallthrough
	case num < 100:
		fmt.Printf("%d is lesser than 100\n", num)
		fallthrough
	case num < 200:
		fmt.Printf("%d is lesser than 200", num)
	}
}
```

`switch` 与 `case` 中的表达式不必是常量，他们也可以在运行时计算。在上面的程序中 `num` 初始化为函数 `number()` 函数的返回值。首先对 `switch` 中的表达式求值，然后依次与每一个`case` 中的表达式值作匹配。匹配到 `case num < 100:` 时结果是 `true`，因此程序打印：`75 is lesser than 100`，接着程序遇到 `fallthrough` ，因此继续执行下一个 `case` ，打印：`75 is lesser than 200`。最后的输出如下：

```java
75 is lesser than 100  
75 is lesser than 200  
```

`注意`：`fallthrough`**并不会与 下一个**`case`**表达式中的值 作比较,而是直接执行下一个**`case`**的代码块,如果下一个**`case`**中没有**`fallthrough`**则结束**`switch`**，如果有，则继续向下执行下一个**`case`**， 我们重写一下上面的列子来了解一下：**

```java
package main
import (
	"fmt"
)
func number() int {
	num := 15 * 5
	return num
}
func main() {
	switch num := number(); {
      //num is not a constant
	case num < 200:
		fmt.Printf("%d is lesser than 200\n", num)
		fallthrough
	case num < 50:
		fmt.Printf("%d is lesser than 50\n", num)
		fallthrough
	case num < 40:
		fmt.Printf("%d is lesser than 40\n", num)
	case num < 30:
		fmt.Printf("%d is lesser than 30\n", num)
	}
}
```

运行上面的程序,输出结果如下：

```java
75 is lesser than 200
75 is lesser than 50
75 is lesser than 40
```

`fallthrough`**必须是**`case`**代码块的最后一条语句。如果它出现在case代码块的中间，编译器将会报错**：

```java
fallthrough statement out of place。
```

还有一种 `switch` 语句叫做 `type switch`，我们将在学习接口时介绍它。
