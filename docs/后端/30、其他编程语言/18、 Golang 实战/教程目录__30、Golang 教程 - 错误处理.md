# 30、Golang 教程 - 错误处理
- 来源：https://ddkk.com/zhuanlan/other/golang/4/30.html
- 分类：其他语言
- 分组：教程目录
## 什么是错误？#

错误表示程序中的异常情况。假设我们正在尝试打开文件，文件系统中却不存在该文件。这是一种异常情况，它用错误来表示。

在Go 中，错误一直是很常见的。错误用内建的 `error` 类型来表示。

就像其他的内建类型（如 `int`、`float64` 等），错误值可以存储在变量里、作为函数的返回值等等。

## 示例#

现在我们开始编写一个程序示例，该程序试图打开一个并不存在的文件：

```java
package main
import (  
    "fmt"
    "os"
)
func main() {
    f, err := os.Open("/test.txt")
    if err != nil {
        fmt.Println(err)
        return
    }
    fmt.Println(f.Name(), "opened successfully")
}
```

在程序的第 `9` 行，我们试图打开路径为 `/test.txt` 的文件。`os` 包里的`Open` 函数有如下签名：

```java
func Open(name string) (file *File, err error)
```

如果成功打开文件，`Open` 函数会返回一个文件句柄和一个值为 `nil` 的错误。如果打开文件时发生了错误，会返回一个不等于 `nil` 的错误。

如果一个函数 或方法 返回了错误，按照惯例，它必须是函数返回的最后一个值。因此`Open` 函数也将 `err` 作为最后一个返回值。

按照Go 的惯例，在处理错误时，通常都是将返回的错误与 `nil` 比较。`nil` 值表示没有错误发生，而非 `nil` 值表示出现了错误。在我们的例子里，第 `10` 行检查了错误值是否为 `nil`。如果不是 `nil`，我们会简单地打印出错误，并在 `main` 函数中返回。

运行该程序会输出：

```java
open /test.txt: No such file or directory
```

完美。我们收到一条错误消息，指出该文件不存在。

## 错误类型的表示#

让我们进一步深入，理解 `error` 类型是如何定义的。`error` 是一个接口类型，定义如下：

```java
type error interface {
    Error() string
}
```

`error` 有了一个签名为 `Error() string` 的方法。所有实现该接口的类型都可以当作一个错误类型。`Error()` 方法给出了错误的描述。

`fmt.Println` 在打印错误时，会在内部调用 `Error() string` 方法来得到该错误的描述。上一节示例中的第 `11` 行，就是这样打印出错误的描述的。

## 从错误中提取更多信息的不同方法#

现在我们知道`error`是一种接口类型，让我们看看如何提取有关错误的更多信息。

在上面我们看到的例子中，我们刚刚打印了错误的描述。如果我们想要导致错误的文件的实际路径，该怎么办？一种可能的方法是解析错误字符串。这是我们程序输出的内容：

```java
open /test.txt: No such file or directory  
```

我们可以解析此错误消息并获取导致错误的文件的文件路径`"/test.txt"`，但这是一种糟糕的方式。随着语言版本的更新，这条错误描述随时都有可能变化，使我们程序出错。

有没有办法可靠地获取文件名？答案是肯定的，这可以做到，Go的标准库给出了不同的方式来提供有关错误的更多信息。让我们逐一看看它们。

## 1.断言底层结构体类型并从结构体中获取更多信息#

如果仔细阅读`Open`函数的文档，可以看到它返回类型错误`*PathError.PathError`是一种结构体类型，它在标准库中的实现如下：

```java
type PathError struct {
    Op   string
    Path string
    Err  error
}
func (e *PathError) Error() string {
      return e.Op + " " + e.Path + ": " + e.Err.Error() }  
```

如果你有兴趣了解上述源代码出现的位置，可以在这里找到：[https://golang.org/src/os/error.go?s=653:716#L11。](https://golang.org/src/os/error.go?s=653:716#L11%E3%80%82)

从上面的代码中，你就知道了 `*PathError` 通过定义 `Error() string` 方法，实现了 `error` 接口。`Error() string` 将文件操作、路径和实际错误拼接，并返回该字符串。于是我们得到该错误信息：

`open /test.txt: No such file or directory`

结构体`PathError` 的 `Path` 字段，就是导致错误的文件路径。我们修改前面写的程序，打印出该路径。

```java
package main
import (  
    "fmt"
    "os"
)
func main() {
    f, err := os.Open("/test.txt")
    if err, ok := err.(*os.PathError); ok {
        fmt.Println("File at path", err.Path, "failed to open")
        return
    }
    fmt.Println(f.Name(), "opened successfully")
}
```

在上面的程序里，我们在第 `10` 行使用了[类型断言](/zhuanlan/other/golang/4/18.html)来获取 `error`接口的具体类型。接下来在第 `11` 行，我们使用 `err.Path` 来打印该路径。该程序会输出：

```java
File at path /test.txt failed to open
```

太棒了。我们已成功使用类型断言从错误中获取文件路径。

## 2.断言底层结构体类型并使用方法获取更多信息#

第二种获取更多错误信息的方法，也是对底层类型进行断言，然后通过调用该结构体类型的方法，来获取更多的信息。

我们通过一个实例来理解这一点。

标准库中的 [DNSError](https://golang.org/src/net/net.go?s=17133:17424#L547) 结构体类型定义如下：

```java
type DNSError struct {
    ...
}
func (e *DNSError) Error() string {
    ...
}
func (e *DNSError) Timeout() bool {
    ... 
}
func (e *DNSError) Temporary() bool {
    ... 
}
```

从上面代码可以看到，`DNSError` 结构体还有 `Timeout() bool` 和 `Temporary() bool` 两个方法，它们返回一个布尔值，指出该错误是由超时引起的，还是临时性错误。

接下来我们编写一个程序，断言 `*DNSError` 类型，并调用这些方法来确定该错误是临时性错误，还是由超时导致的。

```java
package main
import (  
    "fmt"
    "net"
)
func main() {
    addr, err := net.LookupHost("golangbot123.com")
    if err, ok := err.(*net.DNSError); ok {
        if err.Timeout() {
            fmt.Println("operation timed out")
        } else if err.Temporary() {
            fmt.Println("temporary error")
        } else {
            fmt.Println("generic error: ", err)
        }
        return
    }
    fmt.Println(addr)
}
```

上面的程序中，我们在第 `9` 行，试图获取 `golangbot123.com`(`无效的域名`) 的 `ip`。在第 `10` 行，我们通过 `*net.DNSError` 的类型断言，获取到了错误的底层类型。如果是`net.DNSError`类型，结果是`true`，所以执行`if`分支内代码，接下来的第 `11` 行和第 `13` 行，我们分别检查了该错误是由超时引起的，还是一个临时性错误。

在本例中，我们的错误既不是临时性错误，也不是由超时引起的，因此该程序输出：

```java
generic error:  lookup golangbot123.com: no such host
```

如果该错误是临时性错误，或是由超时引发的，那么对应的 `if` 语句会执行，我们可以获取错误后进行相应的处理。

## 3. 直接比较#

第三种获取错误更多信息的方式，是与 `error` 类型的变量直接比较。我们通过一个示例来理解。

filepath 包中的 [Glob函数](https://golang.org/pkg/path/filepath/#Glob)用于返回满足 `glob` 模式的所有文件名。如果模式写的不对，该函数会返回一个错误 `ErrBadPattern`。

`ErrBadPattern`在`filepath` 包中的 定义如下：

```java
var ErrBadPattern = errors.New("syntax error in pattern")  
```

`errors.New()` 用于创建一个新的错误。我们会在下一教程中详细讨论它。

当模式格式错误时，`Glob` 函数会返回 `ErrBadPattern`。

我们来写一个小程序来看看这个错误。

```java
package main
import (  
    "fmt"
    "path/filepath"
)
func main() {
    files, error := filepath.Glob("[")
    if error != nil && error == filepath.ErrBadPattern {
        fmt.Println(error)
        return
    }
    fmt.Println("matched files", files)
}
```

在上述程序里，我们搜索了模式为 `[` 的文件，然而这是一种格式错误的模式。我们检查了该错误是否为 `nil`。为了获取该错误的更多信息，我们在第 `10` 行将 `error` 直接与 `filepath.ErrBadPattern` 相比较。如果该条件满足，那么该错误就是由模式错误导致的。该程序会输出：

```java
syntax error in pattern  
```

标准库在提供错误的详细信息时，使用到了上述提到的三种方法。在下一教程里，我们会通过这些方法来创建我们自己的自定义错误。

## 不要忽略错误#

永远不要忽略错误。忽略错误会引发麻烦。让我重写上面示例，该示例列出了匹配的所有文件的名称 并且 省略了错误处理的代码。

```java
package main
import (  
    "fmt"
    "path/filepath"
)
func main() {
    files, _ := filepath.Glob("[")
    fmt.Println("matched files", files)
}
```

我们已经从前面的示例知道了这个模式是错误的。在第 `9` 行，通过使用 `_` 空白标识符，我忽略了 `Glob`函数返回的错误。我在第 `10` 行直接打印了所有匹配的文件。该程序会输出：

```java
matched files []
```

由于我们忽略了错误，输出的内容，似乎没有文件与匹配模式，但实际上模式本身格式不正确。所以不要忽略错误。

在本教程中，我们讨论了如何处理程序中发生的错误以及如何检查错误以从中获取更多信息。快速回顾一下我们在本教程中讨论过的内容：

- 什么是错误？
- 错误的表示
- 从错误中提取更多信息的各种方法
- 不能忽视错误

在下一个教程中，我们将创建自己的自定义错误，并为错误添加更多上下文。
