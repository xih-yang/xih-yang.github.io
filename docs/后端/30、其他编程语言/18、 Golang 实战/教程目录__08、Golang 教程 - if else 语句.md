# 08、Golang 教程 - if else 语句
- 来源：https://ddkk.com/zhuanlan/other/golang/4/8.html
- 分类：其他语言
- 分组：教程目录
`if`是条件语句。`if`语句的语法是：

```java
if condition {
}
```

如果`condition` 为 `true`，那么就执行 `{` 和 `}` 之间的代码。

与其它语言（如C语言）不同，即使 `{}` 之间只有一条语句，`{}` 也是必需的。

if语句后面还具有可选`else if`和`else`语句：

```java
if condition {
} else if condition {
} else {
}
```

`if` 后面可以接任意数量的 `else if` 语句。`condition` 的求值由上到下依次进行，如果 `if` 或者某个 `else if` 中的 `condition` 为 `true` 时，执行相应的代码块。如果没有一个 `conditon` 为 `true`，则执行 `else` 中的代码块。

让我们编写一个简单的程序来判断一个数字是奇数还是偶数：

```java
package main
import (
	"fmt"
)
func main() {
	num := 10
	if num%2 == 0 {
      //checks if number is even
		fmt.Println("the number is even")
	} else {
		fmt.Println("the number is odd")
	}
}
```

`ifnum % 2 == 0` 这条语句检测一个数除以 `2` 的余数是否为 `0`，如果是则输出：`"the number is even"`，否则输出：`"the number is odd"`。上面的程序输出：`the number is even`。

if语句还有如下的变体。这种形式的 `if` 语句先执行 `statement`，然后再判断 `conditon` 。

```java
if statement; condition {
}
```

让我们用这种形式的 `if` 改写上面的程序：

```java
package main
import (
	"fmt"
)
func main() {
	if num := 10; num%2 == 0 {
      //checks if number is even
		fmt.Println(num, "is even")
	} else {
		fmt.Println(num, "is odd")
	}
}
```

在上面的程序中， `num` 在 `if` 语句中初始化。需要注意的一点是，`num` 只能在 `if`和 `else` 里面进行访问，即 `num` 的范围仅限于 `if else` 块中。如果我们尝试在`if` 或 `else` 之外访问 `num`，编译器将报错。

让我们用`else if`再写一个程序：

```java
package main
import (
	"fmt"
)
func main() {
	num := 99
	if num >= 0 && num <= 50 {
		fmt.Println("number is greater than 50")
	} else if num >= 51 && num <= 100 {
		fmt.Println("number is between 51 and 100")
	} else {
		fmt.Println("number is greater than 100")
	}
}
```

在上面的程序`else if num >= 51 && num <= 100`是`true`，因此程序将输出：`number is between 51 and 100`

`注意点`:

`else`语句应该在`if`语句结束花括号`}`之后的同一行中开始。否则，编译器就会报错。

让我们通过一个程序来理解这一点。

```java
package main
import (  
    "fmt"
)
func main() {
    num := 10
    if num % 2 == 0 {
      //checks if number is even
        fmt.Println("the number is even") 
    }  
    else {
        fmt.Println("the number is odd")
    }
}
```

在上面的程序中，`else`语句没有在`if`语句结束花括号`}`之后的同一行中开始。相反，它从下一行开始。go中不允许这样做。如果运行此程序，编译器将输出错误：

```java
main.go:12:5: syntax error: unexpected else, expecting }  
```

原因是Go自动插入分号的方式。您可以在这里了解分号插入规则。

[https://golang.org/ref/spec#Semicolons](https://golang.org/ref/spec#Semicolons)

在规则中，如果这是该行的最后一个标记，则指定在 `}` 之后插入分号。因此，在`if`语句的 `}` 后面会自动插入分号。

所以我们的程序实际上变成了：

```java
if num%2 == 0 {
      fmt.Println("the number is even") 
};  //semicolon inserted by Go
else {
      fmt.Println("the number is odd")
}
```

你可以在上面代码片段的第`3`行看到分号插入。因为 `if{...} else {...}` 是单条语句，所以分号不应出现在语句的中间。因此，要求将`else` 放在`}`之后的同一行中。

正确的使用方式如下,要将`else`放在`}` 之后的同一行：

```java
package main
import (
	"fmt"
)
func main() {
	num := 10
	if num%2 == 0 {
      //checks if number is even
		fmt.Println("the number is even")
	} else {
		fmt.Println("the number is odd")
	}
}
```

这个时候,编译器不再报错。
