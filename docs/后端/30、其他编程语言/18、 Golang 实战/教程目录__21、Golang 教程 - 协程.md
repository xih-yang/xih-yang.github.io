# 21、Golang 教程 - 协程
- 来源：https://ddkk.com/zhuanlan/other/golang/4/21.html
- 分类：其他语言
- 分组：教程目录
在[上一篇教程](/zhuanlan/other/golang/4/20.html)中，我们讨论了并发，以及并发和并行的区别。在这篇教程中我们将讨论在Go中如何通过Go协程实现并发。

## 什么是协程？#

Go`协程`(`Goroutine`)是与其他函数或方法一起并发运行的函数或方法。协程可以被认为是轻量级线程。与线程相比，创建协程的成本很小。因此在Go中同时运行上千个协程是很常见的。

## Go 协程相比于线程优点#

- 与线程相比，Go协程的开销非常小。它的堆栈大小只有几kb，堆栈可以根据应用程序的需要增长和缩小，而线程必须指定堆栈的大小，并且堆栈的大小是固定的。
- Go协程被多路复用到较少的OS线程。在一个程序中数千个Go协程可能只运行在一个线程中。如果该线程中的某一个Go协程阻塞（比如等待用户输入），那么Go会创建一个新的OS线程并将其余的Go协程移动到这个新的OS线程。所有这些操作都是 运行时 来完成的，而我们程序员不必关心这些复杂的细节，只需要利用 Go 提供的简洁的 API 来处理并发就可以了。
- Go 协程之间使用信道（channel）进行通信。信道可以防止多个协程访问共享内存时发生竞态条件（race condition）。信道可以想象成多个协程之间通信的管道。我们将在下一篇教程中介绍信道。

## 如何创建一个协程？#

调用函数或者方法前面加上关键字 `go`，可以让一个新的 Go 协程并发地运行。

让我们创建一个 Go 协程。

```java
package main
import (
	"fmt"
)
func hello() {
	fmt.Println("Hello world goroutine")
}
func main() {
	go hello()
	fmt.Println("main function")
}
```

第`11`行，`go hello()` 开启了一个新的协程。现在 `hello()` 函数将和 `main()` 函数同时运行。`main` 函数在一个特别的协程中运行，这个协程称为`主协程`。

运行这个程序，你会有一个惊喜！

程序仅输出了一行文本： `main function`。我们创建的协程发生了什么？我们需要了解Go协程的两个主要`特性`，以了解为什么发生这种情况。

- 当一个新的Go协程启动时，协程的调用立即返回。与函数不同，程序流程不会等待Go协程结束再继续执行。程序流程在开启Go协程后立即返回并开始执行下一行代码，并忽略Go协程的任何返回值。
- 在主协程存在时才能运行其他协程，主协程终止则程序终止，其他协程也将终止。

我想现在你将能够理解为什么我们的协程没有运行。在`11`行调用 `go hello()`后，程序的流程直接执行下一条代码，并没有等待 `hello` 协程执行完成，然后打印 `main function`。接着`主协程`结束运行，程序也就结束，因为没有其他代码可以执行，所以 `hello` 协程并没有得到运行的机会。

让我们现在解决这个问题。

```java
package main
import (
	"fmt"
	"time"
)
func hello() {
	fmt.Println("Hello world goroutine")
}
func main() {
	go hello()
	time.Sleep(1 * time.Second)
	fmt.Println("main function")
}
```

在上面程序的第`13`行中，我们调用 `time` 包的 `Sleep` 函数来使调用该函数的协程休眠。在这里是让主协程休眠`1`秒钟。现在调用 `go hello()` 创建一个新的协程，这个协程有了足够的时间 在主协程退出之前执行。该程序首先打印 `Hello world goroutine`，等待`1`秒钟之后打印 `main function`。

这种在`主协程`中使用睡眠等待其他协程完成执行的方式是不正规的 。我们用在这里只是为了说明Go协程是如何工作的。信道可以用于阻塞主协程，直到其他协程执行完毕。我们将在下一篇教程中讨论信道。

## 启动多个协程#

让我们再写一个程序，启动多个协程以便更好地理解协程。

```java
package main
import (
	"fmt"
	"time"
)
func numbers() {
	for i := 1; i <= 5; i++ {
		time.Sleep(250 * time.Millisecond)
		fmt.Printf("%d ", i)
	}
}
func alphabets() {
	for i := 'a'; i <= 'e'; i++ {
		time.Sleep(400 * time.Millisecond)
		fmt.Printf("%c ", i)
	}
}
func main() {
	go numbers()
	go alphabets()
	time.Sleep(3000 * time.Millisecond)
	fmt.Println("main terminated")
}
```

上面的程序在第`21`和`22`行开启了两个协程。现在这两个协程同时执行。`numbers` 协程最初睡眠 `250` 毫秒，然后打印 `1`，接着再次睡眠然后打印`2`，以此类推，直到打印到 `5`。类似地，`alphabets` 协程打印从 `a` 到 `e` 的字母，每个字母之间相隔 `400` 毫秒。主协程开启 `numbers` 和 `alphabets` 协程，等待 `3000` 毫秒，最后终止。

该程序输出：

```java
1 a 2 3 b 4 c 5 d e main terminated  
```

下图描绘了该程序的工作原理。请在新标签页中打开图片以获得更好的效果。

第一部分蓝色线框表示`numbers` 协程，第二部分褐红色线框表示`alphabets` 协程，第三部分绿色线框表示`主协程`，黑色的线框合并了上述`三个协程`，并向我们展示程序的工作原理。每个线框顶部的 `0ms`，`250 ms` 的字符串表示以毫秒为单位的时间，在每个线框底部的 `1`，`2`，`3` 表示输出。

蓝色线框告诉我们，`250 ms`后打印`1`，`500 ms`后打印`2`。以此类推。因此最后一个线框底部的输出：`1 a 2 3 b 4 c 5 d e main terminated` 也是整个程序的输出。以上图片非常直观，你可以用它来理解程序是工作原理。
