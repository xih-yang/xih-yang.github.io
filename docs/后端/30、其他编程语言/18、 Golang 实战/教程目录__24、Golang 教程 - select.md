# 24、Golang 教程 - select
- 来源：https://ddkk.com/zhuanlan/other/golang/4/24.html
- 分类：其他语言
- 分组：教程目录
## 什么是select#

`select`语句用于从多个读写通道中进行选择。`select`语句将会阻塞，直到有一个读写通道就绪。如果有多个读写通道就绪，会从中任意选择一个。`select`语法类似`switch`语句，除了每个`case`语句必须是通道操作。

让我们深入代码以便更好的理解。

```java
package main
import (
	"fmt"
	"time"
)
func server1(ch chan string) {
	time.Sleep(6 * time.Second)
	ch <- "from server1"
}
func server2(ch chan string) {
	time.Sleep(3 * time.Second)
	ch <- "from server2"
}
func main() {
	output1 := make(chan string)
	output2 := make(chan string)
	go server1(output1)
	go server2(output2)
	select {
	case s1 := <-output1:
		fmt.Println(s1)
	case s2 := <-output2:
		fmt.Println(s2)
	}
}
```

在上述程序中，`server1`函数(`第8行`)先休眠`6`秒后往信道`output1`写入文本。`server2`函数(`第12行`)休眠`3`秒后往信道`output2`写入文本。

在主函数在第 `20` 行和第 `21` 行中分别调用协程`server1`和`server2`.

程序运行到了第 `22` 行`select`语句，`select`语句阻塞直到其中一个`case`语句就绪。在上述程序中，`server1`协程休眠`6s`后写入信道`output1`，而协程`server2`只休眠`3`秒就往信道`output2`写数据。所以`select`语句将会阻塞`3`秒等待协程`server2`往信道`output2`写数据。`3`秒后程序打印信息：`from server2` 之后程序结束。

## select应用场景#

上述代码之所以命名函数为`server1`和`server2`，是为了解释实际使用`select`的场景。

让我们假设有一个关键业务应用，我们需要尽快给用户返回信息。该应用的数据库是复杂的，而且存储在世界各地不同的服务器上。假设函数`server1`和`server2`实际上与这些不同的服务器中的两个服务器通信。每个服务器的响应时间取决于每个服务器的负载和网络延迟。我们向两个服务器发送请求，用`select`语句在相关信道上等待响应。第一个响应的服务器将被`select`语句所选择，其他响应将被忽略。使用这种方法，我们可以同时向多个服务器发出请求，这样用户就可以得到最快的响应。

## defalut case#

在没有`case` 准备就绪时，可以执行 `select` 语句中的 `default case`。这个通常用来防止`select`语句一直阻塞。

```java
package main
import (
	"fmt"
	"time"
)
func process(ch chan string) {
	time.Sleep(10500 * time.Millisecond)
	ch <- "process successful"
}
func main() {
	ch := make(chan string)
	go process(ch)
	for {
		time.Sleep(1000 * time.Millisecond)
		select {
		case v := <-ch:
			fmt.Println("received value: ", v)
			return
		default:
			fmt.Println("no value received")
		}
	}
}
```

上述程序第 `8` 行的 `process` 函数休眠了 `10500` 毫秒(`10.5 秒`)，然后向 `ch` 信道发送数据 `process successful` 。在主函数的第 `15` 行，并发地调用了这个函数。

在并发地调用了 `process` 协程之后，主协程进入无限`for`循环，每次循环先休眠`1000` 毫秒(`1 秒`)，然后执行`select`语句。在前`10500` 毫秒中，`select`的第一个`case`分支`case v:= <-ch:`信道不会就绪，因为`process`协程休眠`10.5`秒才会向`ch`信道发送数据。因此`default case`分支将被执行，程序打印`"no value received"`10次。

在`10.5` 秒之后，`process` 协程会在第 `10` 行向 `ch` 信道发送数据 `process successful`。现在，将执行 `select` 语句的第一个 `case`，程序会打印 `received value: process successful`，然后程序终止。该程序会输出：

```java
no value received  
no value received  
no value received  
no value received  
no value received  
no value received  
no value received  
no value received  
no value received  
no value received  
received value:  process successful  
```

## 死锁和default case#

```java
package main
func main() {
	ch := make(chan string)
	select {
	case <-ch:
	}
}
```

上面程序的第 `4` 行，我们创建了一个信道 `ch`。我们在 `select` 内部(`第6行`)，试图读取信道 `ch`。由于没有其他的 Go 协程向该信道写入数据，因此 `select` 语句会一直阻塞，导致死锁。该程序运行时会触发 `panic`，报错信息如下：

```java
fatal error: all goroutines are asleep - deadlock!
goroutine 1 [chan receive]:  
main.main()  
    /tmp/sandbox416567824/main.go:6 +0x80
```

如果存在`default case`，就不会发生死锁，因为在没有其他 `case` 准备就绪时，会执行`default case`。我们用`default case`重写程序如下：

```java
package main
import "fmt"
func main() {
	ch := make(chan string)
	select {
	case <-ch:
	default:
		fmt.Println("default case executed")
	}
}
```

运行程序,输出如下：

```java
default case executed
```

同样的,在信道为`nil`的情况下,`select`语句也会执行`default case`

```java
package main
import "fmt"
func main() {
	var ch chan string
	select {
	case v := <-ch:
		fmt.Println("received value", v)
	default:
		fmt.Println("default case executed")
	}
}
```

在上面程序中，`ch` 信道等于 `nil`，而我们试图在 `select` 中读取 `ch`(`第8行`)。如果没有`default case`，`select` 会一直阻塞，导致死锁。由于我们在 `select` 内部加入了`default case`，程序会执行它，并输出：

```java
default case executed
```

## 随机选择#

`select`语句在有多个`case`分支准备就绪的情况下，会随机选择一个分支执行。

```java
package main
import (
	"fmt"
	"time"
)
func server1(ch chan string) {
	ch <- "from server1"
}
func server2(ch chan string) {
	ch <- "from server2"
}
func main() {
	output1 := make(chan string)
	output2 := make(chan string)
	go server1(output1)
	go server2(output2)
	time.Sleep(1 * time.Second)
	select {
	case s1 := <-output1:
		fmt.Println(s1)
	case s2 := <-output2:
		fmt.Println(s2)
	}
}
```

在上面程序第 `18` 行和第 `19` 行分别调用了 `server1` 和 `server2` 两个协程。然后，主程序休眠了 `1` 秒钟（`第20行`）。当程序执行到`select` 语句时，`server1` 已经把 `from server1` 写到了 `output1` 信道上，而 `server2` 也同样把 `from server2` 写到了 `output2` 信道上。因此这个 `select` 语句中的两种情况都准备好执行了。如果你运行这个程序很多次的话，输出会是 `from server1` 或者 `from server2`，变化取决于随机选择。

## 空select#

```java
package main
func main() {
    select {
     }
}
```

你觉的上述程序的会出现什么结果？

我们知道`select`语句将会被阻塞直到其中一个`case`分支可执行。这个例子，`select`语句没有任何`case`分支，因此它将被永久阻塞导致死锁。程序将会触发 `panic`，输出如下：

```java
fatal error: all goroutines are asleep - deadlock!
goroutine 1 [select (no cases)]:  
main.main()  
    /tmp/sandbox299546399/main.go:4 +0x20
```
