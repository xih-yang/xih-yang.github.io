# 09、Golang 教程 - 循环语句
- 来源：https://ddkk.com/zhuanlan/other/golang/4/9.html
- 分类：其他语言
- 分组：教程目录
循环语句用于重复执行代码块。

`for`语句是Go中唯一可用的循环。Go没有`while`或`do while`循环，这些循环存在于其他语言中，如C.java。

## for循环语法

```java
for initialisation; condition; post {
}
```

`initialisation` 为初始化语句，该语句仅执行一次。`initialisation` 语句结束后，将对 `condition` 求值，如果 `condition` 求值结果为 `true`，则执行大括号`{}`里面的循环体，然后执行 `post` 语句，`post` 语句会在每次循环体执行结束后执行。执行完 `post` 语句之后，将重新对`condition` 求值，如果是`true`，则继续执行循环体，否则退出循环。

在go 中 `for`循环 三个组成部分：`initialisation`，`condition`，`post` 都是可选的。让我们看一个例子以更好的理解 `for` 语句。

## 例子

让我们编写一个程序，使用`for`循环打印从`1`到`10`的所有数字。

```java
package main
import (
	"fmt"
)
func main() {
	for i := 1; i <= 10; i++ {
		fmt.Printf(" %d", i)
	}
}
```

在上面的程序中，`i` 被初始化为 `1`。条件语句判断 `i` 是否小于等于 `10`，如果是，则打印 `i`，否则结束循环。`post` 语句在每次迭代结束时将 `i` 递增 `1`。直到 `i` 的值大于 `10` 循环终止。

上面的程序打印：`1 2 3 4 5 6 7 8 9 10`

在`for`循环中声明的变量仅在循环范围内可用。因此 `i` 无法在循环体外进行访问。这和上一篇中 `if` 语句中的声明一样， `if else` 中的声明变量仅限于 `if else` 块中。

## break

`break` 用于终止 `for` 循环，继续执行 `for` 循环后面的语句。

让我们编写一个程序，打印从`1`到`5`的数字来了解一下`break`的用法：

```java
package main
import (
	"fmt"
)
func main() {
	for i := 1; i <= 10; i++ {
		if i > 5 {
			break //loop is terminated if i > 5
		}
		fmt.Printf("%d ", i)
	}
	fmt.Printf("\nline after for loop")
}
```

在上述程序中，在每次迭代期间检查 `i` 的值。如果 `i` 大于 `5` 则执行 `break`终止循环。然后执行`for`循环之后的`print`语句。以上程序将输出：

```java
1 2 3 4 5  
line after for loop  
```

## continue

`continue` 语句用来跳过 `for` 循环的当前迭代。循环体中在 `continue` 之后的所有语句将不再执行。循环将继续执行下一次迭代。

让我们写一个程序利用 `continue` 来打印 `1` 到 `10` 的所有奇数。

```java
package main
import (
	"fmt"
)
func main() {
	for i := 1; i <= 10; i++ {
		if i%2 == 0 {
			continue
		}
		fmt.Printf("%d ", i)
	}
}
```

在上面的程序中，`if i%2 == 0` 检测 `i` 除以 `2` 是否为 `0`，如果为 `0` 则 `i` 是偶数，利用 `continue` 语句跳过当前迭代并继续下一次迭代。因此不会执行 `continue` 语句之后的 `fmt.Printf` 语句，并且循环进入到下一次迭代。上面的程序输出为：`1 3 5 7 9`。

## 更多例子

让我们再写一些代码来演示 `for` 循环的其它变体。

下面的程序 打印 `0` 到 `10` 之间的所有偶数。

```java
package main
import (
	"fmt"
)
func main() {
	i := 0
	for ;i <= 10; {
      // initialisation and post are omitted
		fmt.Printf("%d ", i)
		i += 2
	}
}
```

我们已经知道 `for` 循环的三个组成部分 `initialisation`，`condition`，`post` 都是可选的。上面的程序中，省略了 `initialisation`和 `post` 部分。`i` 在 `for` 循环之外初始化为 `0`，只要 `i <= 10` 循环就一直执行，`i` 在循环体内每次递增 `2`。上面的程序输出为：`0 2 4 6 8 10`。

也可以省略`for`循环中的 `;` 分号。这种格式可以被认为是`while`循环的替代方案。以上程序可以改写为：

```java
package main
import (
	"fmt"
)
func main() {
	i := 0
	for i <= 10 {
      //semicolons are ommitted and only condition is present
		fmt.Printf("%d ", i)
		i += 2
	}
}
```

也可以在`for`循环中声明和操作多个变量。让我们编写一个程序，使用多个变量声明：

```java
package main
import (
	"fmt"
)
func main() {
	for no, i := 10, 1; i <= 10 && no <= 19; i, no = i+1, no+1 {
      //multiple initialisation and increment
		fmt.Printf("%d * %d = %d\n", no, i, no*i)
	}
}
```

在上面的程序中,`no` 和 `i` 被声明并分别初始化为 `10` 和 `1`，它们在每次迭代结束时递增 `1`。 `condition` 表达式 部分使用 `&&` 操作符来 判断 `i`小于或等于 `10` 并且 `no` 小于或等于 `19`。程序的输出如下：

```java
10 * 1 = 10  
11 * 2 = 22  
12 * 3 = 36  
13 * 4 = 52  
14 * 5 = 70  
15 * 6 = 90  
16 * 7 = 112  
17 * 8 = 136  
18 * 9 = 162  
19 * 10 = 190  
```

## 无限循环#

创建无限循环的语法是：

```java
for {
}
```

以下程序将持续打印Hello World而不会终止。

```java
package main
import "fmt"
func main() {
    for {
        fmt.Println("Hello World")
    }
}
```

还有一个 `for range` 可用于遍历数组，我们将在介绍数组时介绍它。
