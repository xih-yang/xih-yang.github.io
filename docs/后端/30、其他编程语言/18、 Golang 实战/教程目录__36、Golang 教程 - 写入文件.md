# 36、Golang 教程 - 写入文件
- 来源：https://ddkk.com/zhuanlan/other/golang/4/36.html
- 分类：其他语言
- 分组：教程目录
在本教程中，我们将学习如何使用Go将数据写入文件。我们还将学习如何并发写入文件。

本教程包含以下部分

- 将字符串写入文件
- 将字节写入文件
- 逐行将数据写入文件
- 追加到文件
- 并发写入文件

##### 将字符串写入文件

将字符串写入文件是最常见的文件写入操作之一，这很简单。它包括以下步骤。

**1、** 创建文件；

**2、** 将字符串写入文件；

让我们马上看看代码吧。

```java
package main
import (  
    "fmt"
    "os"
)
func main() {
    f, err := os.Create("test.txt")
    if err != nil {
        fmt.Println(err)
        return
    }
    l, err := f.WriteString("Hello World")
    if err != nil {
        fmt.Println(err)
        f.Close()
        return
    }
    fmt.Println(l, "bytes written successfully")
    err = f.Close()
    if err != nil {
        fmt.Println(err)
        return
    }
}
```

上面程序的第`9`行中的`create`函数创建了一个名为`test.txt`的文件。如果存在同名文件，则`create`函数将截断该文件。此函数返回[文件描述](https://golang.org/pkg/os/#File)。

在第`14`行中，我们使用`WriteString`方法将字符串`Hello World`写入文件。此方法返回写入的`字节数`和`错误`(如果有)。

最后，我们在第`21`行关闭文件。

运行程序,输出：

```java
11 bytes written successfully  
```

你可以在执行此程序的目录中找到名为`test.txt`的文件。使用任何文本编辑器打开该文件，你会发现其中包含文本`Hello World`。

##### 将字节写入文件

将字节写入文件与将字符串写入文件非常相似。我们将使用[Write](https://golang.org/pkg/os/#File.Write)方法将字节写入文件。下面的程序将一段字节写入文件。

```java
package main
import (  
    "fmt"
    "os"
)
func main() {
    f, err := os.Create("/home/naveen/bytes")
    if err != nil {
        fmt.Println(err)
        return
    }
    d2 := []byte{
     104, 101, 108, 108, 111, 32, 119, 111, 114, 108, 100}
    n2, err := f.Write(d2)
    if err != nil {
        fmt.Println(err)
        f.Close()
        return
    }
    fmt.Println(n2, "bytes written successfully")
    err = f.Close()
    if err != nil {
        fmt.Println(err)
        return
    }
}
```

在上面的程序中，在第`15`行中，我们使用`Write`方法将一段字节写入目录`/home/naveen`中名为`bytes`文件中。你可以将此目录更改为其他目录。其他代码很简单。此程序将打印`11 bytes written successfully`，并将创建一个名为`bytes`的文件。打开该文件，你可以看到它包含文本`hello bytes`。

##### 逐行将数据写入文件

另一个常见的文件操作是需要逐行将字符串写入文件。在本节中，我们将编写一个程序来创建具有以下内容的文件。

```java
Welcome to the world of Go.  
Go is a compiled language.  
It is easy to learn Go.  
```

让我们马上看看代码吧。

```java
package main
import (  
    "fmt"
    "os"
)
func main() {
    f, err := os.Create("lines")
    if err != nil {
        fmt.Println(err)
                f.Close()
        return
    }
    d := []string{
     "Welcome to the world of Go1.", "Go is a compiled language.", "It is easy to learn Go."}
    for _, v := range d {
        fmt.Fprintln(f, v)
        if err != nil {
            fmt.Println(err)
            return
        }
    }
    err = f.Close()
    if err != nil {
        fmt.Println(err)
        return
    }
    fmt.Println("file written successfully")
}
```

在上面程序的第`9`行中，我们创建了一个名为`lines`的新文件。在第`17`行中，我们使用`for`循环迭代数组，并使用[Fprintln](https://golang.org/pkg/fmt/#Fprintln)函数将这些行写入文件。`Fprintln`函数接受`io.write`作为参数，并附加一个新行，这正是我们想要的。运行此程序将打印`file written successfully`，并在当前目录中创建`lines`文件。下面是`lines`文件中的内容。

```java
Welcome to the world of Go1.  
Go is a compiled language.  
It is easy to learn Go.  
```

##### 追加到文件

在本节中，我们将向在上一节中创建的`lines`文件再附加一行。我们将向`lines`文件中附加一行 `File handling is easy`。

文件必须以`追加`和`只写`模式打开。这些标志将以参数形式传递给[Open](https://golang.org/pkg/os/#OpenFile)函数。在附加模式下打开文件后，我们将新行添加到文件中。

```java
package main
import (  
    "fmt"
    "os"
)
func main() {
    f, err := os.OpenFile("lines", os.O_APPEND|os.O_WRONLY, 0644)
    if err != nil {
        fmt.Println(err)
        return
    }
    newLine := "File handling is easy."
    _, err = fmt.Fprintln(f, newLine)
    if err != nil {
        fmt.Println(err)
                f.Close()
        return
    }
    err = f.Close()
    if err != nil {
        fmt.Println(err)
        return
    }
    fmt.Println("file appended successfully")
}
```

在上面的程序的第`9`行，我们以`追加`和`只写`模式打开文件。成功打开文件后，我们在第`15`行中向文件添加新行。此程序将打印`file appended successfully`。运行此程序后，`lines`文件的内容将变为：

```java
Welcome to the world of Go1.  
Go is a compiled language.  
It is easy to learn Go.  
File handling is easy.  
```

##### 并发写入文件

当多个`goroutine`协程并发写入一个文件时，将会发生[竞争条件](/zhuanlan/other/golang/4/25.html)。因此，对文件的并发写入应该使用[信道](/zhuanlan/other/golang/4/22.html)进行协调。

我们将编写一个程序来创建100个goroutines。每个goroutine将同时生成一个随机数，从而总共生成一百个随机数。这些随机数将写入文件。我们将使用以下方法解决此问题。

**1、** 创建一个用于读取和写入随机数的信道；

**2、** 创建100个生产者goroutines协程每个goroutine协程将生成一个随机数，并将随机数写入信道；

**3、** 创建一个消费者goroutine协程，它将从信道读取随机数并写入文件因此，我们只有一个goroutine同时写入文件，从而避免竞争条件；

**4、** 完成后关闭文件；

让我们首先编写生成随机数的`produce`函数。

```java
func produce(data chan int, wg *sync.WaitGroup) {
    n := rand.Intn(999)
    data <- n
    wg.Done()
}
```

上面的函数生成一个随机数，并将其写入`data`信道，然后调用[waitgroup](/zhuanlan/other/golang/4/23.html) 的 Done，以通知它已完成其任务。

现在让我们转到写入文件的函数。

```java
func consume(data chan int, done chan bool) {
    f, err := os.Create("concurrent")
    if err != nil {
        fmt.Println(err)
        return
    }
    for d := range data {
        _, err = fmt.Fprintln(f, d)
        if err != nil {
            fmt.Println(err)
            f.Close()
            done <- false
            return
        }
    }
    err = f.Close()
    if err != nil {
        fmt.Println(err)
        done <- false
        return
    }
    done <- true
}
```

`consume`函数 创建了一个叫`concurrent` 的文件，然后，它从`data`信道读取随机数并写入文件。一旦读写完所有的随机数，它就会向`done`信道写入`true`，通知它已经完成了任务。

让我们编写`main`函数并完成此程序。下面提供了完整程序。

```java
package main
import (  
    "fmt"
    "math/rand"
    "os"
    "sync"
)
func produce(data chan int, wg *sync.WaitGroup) {
    n := rand.Intn(999)
    data <- n
    wg.Done()
}
func consume(data chan int, done chan bool) {
    f, err := os.Create("concurrent")
    if err != nil {
        fmt.Println(err)
        return
    }
    for d := range data {
        _, err = fmt.Fprintln(f, d)
        if err != nil {
            fmt.Println(err)
            f.Close()
            done <- false
            return
        }
    }
    err = f.Close()
    if err != nil {
        fmt.Println(err)
        done <- false
        return
    }
    done <- true
}
func main() {
    data := make(chan int)
    done := make(chan bool)
    wg := sync.WaitGroup{
     }
    for i := 0; i < 100; i++ {
        wg.Add(1)
        go produce(data, &wg)
    }
    go consume(data, done)
    go func() {
        wg.Wait()
        close(data)
    }()
    d := <-done
    if d == true {
        fmt.Println("File written successfully")
    } else {
        fmt.Println("File writing failed")
    }
}
```

在第`41`行`main`函数中创建了读取和写入随机数的`data`信道。第`42`行创建 `consume协程`用来通知`main`函数它已经完成任务的`done`信道。第`43`行的`wg waitgroup`用来阻塞`100`个协程完成随机数的写入。

第`44`行中的`for`循环创建了`100`个`goroutine`协程。第`49`行的`goroutine`调用`waitgroup`的`wait()`，以等待`100`个`goroutine`完成随机数的创建。之后，它关闭了`data`信道。一旦信道关闭，并且`consume`协程已经完成将所有随机数写入到文件中，在第`37`行，它就会`done`信道写入`true`，然后`main`协程将被解除阻塞，并成功打印 `File written successfully`。

现在，你可以在任何文本编辑器中打开该文件，并查看生成的100个随机数字。
