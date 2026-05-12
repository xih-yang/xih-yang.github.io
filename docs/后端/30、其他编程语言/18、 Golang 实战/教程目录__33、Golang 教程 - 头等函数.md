# 33、Golang 教程 - 头等函数
- 来源：https://ddkk.com/zhuanlan/other/golang/4/33.html
- 分类：其他语言
- 分组：教程目录
## 什么是头等函数#

支持头等函数的编程语言，可以把函数赋值给变量，也可以把函数作为其它函数的参数或者返回值。Go 语言支持头等函数。

本教程我们会讨论头等函数的语法和用例。

## 匿名函数#

让我们先从一个简单例子开始：将函数赋值给一个变量。

```java
package main
import (  
    "fmt"
)
func main() {
    a := func() {
        fmt.Println("hello world first class function")
    }
    a()
    fmt.Printf("%T", a)
}
```

在上面的程序中，我们将一个函数赋值给变量`a`(`第8行`)。这就是将函数赋值给变量的语法。仔细观察的话可以发现，赋值给变量的函数没有名字。这种没有名字的函数，我们称之为`匿名函数`。

调用此函数的唯一方法是使用变量`a`，我们通过`a()`来调用这个函数，函数打印`hello world first class function`。在第`12`行，我们打印变量`a`的类型。结果打印`func()`

程序执行结果：

```java
hello world first class function  
func()  
```

也可以在不将其分配给变量的情况下调用匿名函数。让我们看看如何在以下示例中完成此操作。

```java
package main
import (  
    "fmt"
)
func main() {
    func() {
        fmt.Println("hello world first class function")
    }()
}
```

在上面的程序中，第 `8` 行定义了一个匿名函数，并在定义之后，我们使用 `()` 立即调用了该函数(`第 10 行`)。该程序会输出：

```java
hello world first class function
```

就像其它函数一样，还可以向匿名函数传递参数。

```java
package main
import (  
    "fmt"
)
func main() {
    func(n string) {
        fmt.Println("Welcome", n)
    }("Gophers")
}
```

在上述代码中，一个字符串作为参数传递给匿名函数(`第10行`)，程序执行结果：

```java
Welcome Gophers  
```

## 用户自定义函数类型#

就像我们定义自己的结构体类型一样，我们也可以定义自己的函数类型。

```java
type add func(a int, b int) int  
```

上面的代码片段新建一个函数类型`add`接收`2`个整型参数并返回一个整型。现在我们可以定义`add`类型变量。

看看下面这个例子：

```java
package main
import (  
    "fmt"
)
type add func(a int, b int) int
func main() {
    var a add = func(a int, b int) int {
        return a + b
    }
    s := a(5, 6)
    fmt.Println("Sum", s)
}
```

在上面代码第`10`行，我们定义了一个自定义类型`add`的变量`a`，并将一个函数签名符合`add`类型的函数赋值给变量`a`。程序在第`13`行调用这个函数，返回值赋值给变量`s`。程序执行结果：

```java
Sum 11 
```

## 高阶函数#

高阶函数必须具备以下条件之一：

- 拥有一个或多个函数作为参数
- 将一个函数作为返回值

针对上述两种情况，我们看看一些简单实例。

## 将函数作为参数传递给其他函数#

```java
package main
import (  
    "fmt"
)
func simple(a func(a, b int) int) {
    fmt.Println(a(60, 7))
}
func main() {
    f := func(a, b int) int {
        return a + b
    }
    simple(f)
}
```

上面程序第`7`行，我们定义了函数`simple`，它接受一个有`2`个整型参数，并且返回一个整型的函数变量。在主函数中第`12`行，我们新建一个匿名函数，该函数的签名符合`simple`的函数签名。接下来给`simple`函数传递这个函数变量`f`并调用执行。程序执行结果是`67`.

## 从其他函数返回函数#

现在让我们重写上面的程序并从`simple`函数中返回一个函数。

```java
package main
import (  
    "fmt"
)
func simple() func(a, b int) int {
    f := func(a, b int) int {
        return a + b
    }
    return f
}
func main() {
    s := simple()
    fmt.Println(s(60, 7))
}
```

上面程序第`7`行中，`simple`函数返回一个函数签名为`2`个整型参数和返回值为整型的函数。

`simple`函数在主函数`15`行调用。函数返回值赋值给变量`s`。现在`s`拥有从`simple`函数返回的函数。给`s`传递两个整型参数并调用，程序执行结果为`67`.

## 闭包#

闭包是匿名函数的一个特例。当一个匿名函数所访问的变量定义在函数体的外部时，就称这样的匿名函数为闭包。

看个示例更好理解：

```java
package main
import (  
    "fmt"
)
func main() {
    a := 5
    func() {
        fmt.Println("a =", a)
    }()
}
```

上面的代码中，匿名函数访问的变量`a`是在函数体外部定义的。因此这个匿名函数是一个闭包。

每一个闭包都会绑定一个它自己的外部变量。我们通过一个简单示例来体会这句话的含义。

```java
package main
import (
	"fmt"
)
func appendStr() func(string) string {
	t := "Hello"
	c := func(b string) string {
		t = t + " " + b
		return t
	}
	return c
}
func main() {
	a := appendStr()
	b := appendStr()
	fmt.Println(a("World"))
	fmt.Println(b("Everyone"))
	fmt.Println(a("Gopher"))
	fmt.Println(b("!"))
}
```

在上述程序中，函数`appendStr`返回一个闭包。这个闭包绑定的外部变量是`t`。我们来理解这是什么意思。

在第`17` 行和第 `18` 行声明的变量 `a` 和 `b`都是闭包，它们绑定了各自的 `t`值。

我们首先用参数 `world` 调用了`a`。现在 `a` 中 `t`值变为了 `Hello World`。

在第`20` 行，我们又用参数 `Everyone`调用了 `b`。由于 `b` 绑定了自己的变量 `t`，因此 `b`中的 `t`还是等于初始值 `Hello`。于是该函数调用之后，`b`中的`t`变为了 `Hello Everyone`。程序的其他部分很简单，不再解释。

该程序会输出：

```java
Hello World  
Hello Everyone  
Hello World Gopher  
Hello Everyone !  
```

## 头等函数的应用#

到目前为止，我们已经知道了什么是头等函数，也看了一些专门设计的示例，来学习它们如何工作。现在让我们编写一个实际的程序，它展示了头等函数的实际用法。

我们会创建一个程序，基于一些条件，来过滤一个 `students` 切片。现在我们来逐步实现它。

首先让我们定义学生类型。

```java
type student struct {
    firstName string
    lastName string
    grade string
    country string
}
```

下一步是编写一个 `filter` 函数。该函数接收一个 `students` 切片和一个函数作为参数，这个函数会计算一个学生是否满足筛选条件。写出这个函数后，会更好的理解，我们继续吧。

```java
func filter(s []student, f func(student) bool) []student {
    var r []student
    for _, v := range s {
        if f(v) == true {
            r = append(r, v)
        }
    }
    return r
}
```

在上面的函数中，`filter` 的第二个参数是一个函数。这个函数接收 `student` 参数，返回一个 `bool`值。这个函数计算了某一学生是否符合标准。我们在第 `3` 行遍历了 `student` 切片，将每个学生作为参数传递给了函数 `f`。如果该函数返回 `true`，就表示该学生符合标准，接着将该学生添加到了结果切片`r`中。你可能会很困惑这个函数的实际用途，等我们完成程序你就知道了。我添加了 `main` 函数，整个程序如下所示：

```java
package main
import (
	"fmt"
)
type student struct {
	firstName string
	lastName  string
	grade     string
	country   string
}
func filter(s []student, f func(student) bool) []student {
	var r []student
	for _, v := range s {
		if f(v) == true {
			r = append(r, v)
		}
	}
	return r
}
func main() {
	s1 := student{
		firstName: "Naveen",
		lastName:  "Ramanathan",
		grade:     "A",
		country:   "India",
	}
	s2 := student{
		firstName: "Samuel",
		lastName:  "Johnson",
		grade:     "B",
		country:   "USA",
	}
	s := []student{
     s1, s2}
	f := filter(s, func(s student) bool {
		if s.grade == "B" {
			return true
		}
		return false
	})
	fmt.Println(f)
}
```

在`main` 函数中，我们首先创建了两个学生 `s1` 和 `s2`，并将他们添加到了切片 `s`。现在假设我们想要查询所有成绩为 `B` 的学生。为了实现这样的功能，我们传递了一个检查学生成绩是否为 `B` 的函数，如果是，该函数会返回 `true`。我们把这个函数作为参数传递给了 `filter` 函数(`第 38 行，匿名函数作为参数`)。上述程序会输出：

```java
[{
     Samuel Johnson B USA}]
```

假设我们想要查找所有来自印度的学生。通过修改传递给 `filter` 的函数参数，就很容易地实现了。

实现它的代码如下所示：

```java
c := filter(s, func(s student) bool {
    if s.country == "India" {
        return true
    }
    return false
})
fmt.Println(c)  
```

请将该函数添加到 `main` 函数，并检查它的输出。

我们最后再编写一个程序，来结束这一节的讨论。这个程序会对切片的每个元素执行相同的操作，并返回结果。例如，如果我们希望将切片中的所有整数乘以 `5`，并返回出结果，那么通过头等函数可以很轻松地实现。我们把这种对集合中的每个元素进行操作的函数称为 `map` 函数。相关代码如下所示，它们很容易看懂。

```java
package main
import (  
    "fmt"
)
func iMap(s []int, f func(int) int) []int {
    var r []int
    for _, v := range s {
        r = append(r, f(v))
    }
    return r
}
func main() {
    a := []int{
     5, 6, 7, 8, 9}
    r := iMap(a, func(n int) int {
        return n * 5
    })
    fmt.Println(r)
}
```

以上程序将打印:

```java
[25 30 35 40 45]
```

快速回顾一下本教程讨论的内容：

- 什么是头等函数？
- 匿名函数
- 用户自定义的函数类型
- 高阶函数
- 把函数作为参数，传递给其它函数
- 在其它函数中返回函数
- 闭包
- 头等函数的实际用途
