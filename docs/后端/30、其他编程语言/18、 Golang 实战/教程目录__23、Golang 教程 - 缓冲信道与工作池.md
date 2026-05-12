# 23、Golang 教程 - 缓冲信道与工作池
- 来源：https://ddkk.com/zhuanlan/other/golang/4/23.html
- 分类：其他语言
- 分组：教程目录
## 什么是缓冲信道#

我们在[上一个教程](/zhuanlan/other/golang/4/22.html)中讨论的所有信道基本上都是的无缓冲区的信道，正如我们在 [信道教程](/zhuanlan/other/golang/4/22.html)中详细讨论的那样，对一个无缓冲的信道进行发送 和 接受 数据 都是阻塞的。

我们也可以创建一个带缓冲区的信道，往信道中发送数据时，只有当缓冲区满的情况下才会阻塞；类似的，我们从信道中接受数据时，只有读到缓冲区为空才会阻塞。

带缓冲的信道可以通过内置函数`make`来创建，需要额外指定缓冲区大小。

```java
ch := make(chan type, capacity)  
```

对于具有缓冲区的信道，上述语法中的容量应大于`0`。默认情况下，无缓冲信道的容量为`0`，因此在上一个教程中创建信道时，其实是省略了容量参数。

让我们写一些代码来创建一个带有缓冲区的信道。

```java
package main
import (  
    "fmt"
)
func main() {
    ch := make(chan string, 2)
    ch <- "naveen"
    ch <- "paul"
    fmt.Println(<- ch)
    fmt.Println(<- ch)
}
```

在上面的例子中第`9`行，我们创建了一个缓冲区大小为`2`的信道，这样我们就可以往信道中写入`2`个字符串后才被阻塞，上面的例子中第`10`行和 第`11`行分别往通道中写入两个字符串，然后在第`12`行和第`13`行分别读出。程序打印输出：

```java
naveen  
paul  
```

## 另一个例子#

让我们再看一个缓冲信道的例子，其中有一个并发协程往信道中发送数据。主协程中负责接受这些数据，这个例子将帮助我们更好地理解向缓冲信道发送数据时,什么时候阻塞。

```java
package main
import (
	"fmt"
	"time"
)
func write(ch chan int) {
	for i := 0; i < 5; i++ {
		ch <- i
		fmt.Println("successfully wrote", i, "to ch")
	}
	close(ch)
}
func main() {
	ch := make(chan int, 2)
	go write(ch)
	time.Sleep(2 * time.Second)
	for v := range ch {
		fmt.Println("read value", v, "from ch")
		time.Sleep(2 * time.Second)
	}
}
```

在上面的例子第`16`行，首先创建了一个缓冲区大小为`2`的信道，在`main`协程中创建了一个`write`的协程。然后`main`协程休眠了`2`秒，在这个时间内，`write`协程并发的运行起来，`write`协程循环往我们创建的信道中写入`0~4`。因为我们的缓冲区大小是`2`，所以当`write`协程中往信道写入`0`和`1`之后，程序被阻塞，直到最少有一个值被读出。所以我们的程序会先打印出：

```java
successfully wrote 0 to ch
successfully wrote 1 to ch
```

在打印上述两行之后，`write`协程中的`ch`信道将被阻塞，直到有其他协程从该`ch`信道读取数据为止。由于主协程在开始从信道读取数据之前会休眠`2`秒，因此程序在接下来的`2`秒内不会打印任何内容。主协程在`2`秒后醒来并在第 `19` 行使用 `for range`无限循环从`ch`信道中读取数据。然后再次睡眠`2`秒，这个循环一直到 `ch` 关闭才结束。所以该程序在两秒后会打印下面两行：

```java
read value 0 from ch
successfully wrote 2 to ch
```

循环将继续，直到所有值都写入信道，并在`write`协程中关闭`ch`信道。最终的输出是：

```java
successfully wrote 0 to ch  
successfully wrote 1 to ch  
read value 0 from ch  
successfully wrote 2 to ch  
read value 1 from ch  
successfully wrote 3 to ch  
read value 2 from ch  
successfully wrote 4 to ch  
read value 3 from ch  
read value 4 from ch 
```

## 死锁#

```java
package main
import (
	"fmt"
)
func main() {
	ch := make(chan string, 2)
	ch <- "naveen"
	ch <- "paul"
	ch <- "steve"
	fmt.Println(<-ch)
	fmt.Println(<-ch)
}
```

在上面的例子中，我们向一个缓冲容量为`2`的信道中写入了`3`个字符串，当程序执行到第三个写入语句时(`第11行`)，因为已经达到最大的容量所以协程会阻塞，直到有其他协程从信道中读取数据，但是我们这个例子中没有其他协程进行这个工作，所以就会造成死锁。程序会在运行时出现以下错误消息：

```java
fatal error: all goroutines are asleep - deadlock!
goroutine 1 [chan send]:  
main.main()  
    /tmp/sandbox274756028/main.go:11 +0x100
```

## 长度与容量#

缓冲信道的容量是信道可以容纳的值的数量。这是我们使用`make`函数创建缓冲信道时指定的值。

缓冲信道的长度是当前在其中排队的元素数。

一个程序将使事情变得清晰:

```java
package main
import (
	"fmt"
)
func main() {
	ch := make(chan string, 3)
	ch <- "naveen"
	ch <- "paul"
	fmt.Println("capacity is", cap(ch))
	fmt.Println("length is", len(ch))
	fmt.Println("read value", <-ch)
	fmt.Println("new length is", len(ch))
}
```

在上面的程序中，创建的信道容量为`3`，即它可以容纳`3`个字符串。然后我们在第`9`行和第`10`行中向通道写入`2`个字符串。现在该信道有`2`个排队的字符串，因此其长度为`2`。在第`13`行中，我们从信道中读取一个字符串。现在，信道中只有一个排队的字符串，因此其长度变为`1`。这个程序将打印：

```java
capacity is 3  
length is 2  
read value naveen  
new length is 1
```

## WaitGroup#

本教程的下一部分是关于`工作池`的(`Worker Pools`)。要了解工作池，我们首先需要了解`WaitGroup`,它将在工作池的实现中使用。

`WaitGroup`用于等待一组协程完成执行。在所有的协程完成之前会一直处于阻塞状态，直到所有协程完成执行。比如，我们从主协程 创建三个新的协程。该主协程需要等待这`3`个协程执行完成才终止，这可以使用`WaitGroup`来完成。

理论说完了，让我们立即编写一些代码?

```java
package main
import (
	"fmt"
	"sync"
	"time"
)
func process(i int, wg *sync.WaitGroup) {
	fmt.Println("started Goroutine ", i)
	time.Sleep(2 * time.Second)
	fmt.Printf("Goroutine %d ended\n", i)
	wg.Done()
}
func main() {
	no := 3
	var wg sync.WaitGroup
	for i := 0; i < no; i++ {
		wg.Add(1)
		go process(i, &wg)
	}
	wg.Wait()
	fmt.Println("All go routines finished executing")
}
```

`WaitGroup`是一种结构体类型，我们在第`18`行创建一个`零值`的`WaitGroup`变量。`WaitGroup`工作方式是使用计数器。当我们调用`WaitGroup`的`Add`，并传入一个`int`参数，每次调用`Add`都会将`Waitgroup`的计数器增加相应的`int`值，要减少计数器，可以调用 `WaitGroup`的 `Done()` 方法。`Wait()`方法会阻塞调用它的 Go 协程，直到计数器变为 `0` 后才会停止阻塞。

在上面的程序中，我们在第`20`行循环调用`3`次`wg.Add(1)`，所以计数器现在变为`3`. `for`循环也创建了`3`个`process`协程，然后在第`23`行调用`wg.Wait()`进行阻塞直到计数器变为`0`，计数器通过在`process` 协程内调用了`wg.Done`让计数器递减。一旦 `3` 个`process`协程都执行完毕，`wg.Done()`被调用三次，计数器将变为`0`，主协程将解除阻塞。

在第`21` 行里，传递 `wg` 的地址很重要。如果没有传递 `wg` 的地址，则每个 Go 协程将会得到一个 `WaitGroup` 的副本，因而当它们执行结束时，`main` 函数并不会得到通知。

运行程序,输出：

```java
started Goroutine  2  
started Goroutine  0  
started Goroutine  1  
Goroutine 0 ended  
Goroutine 2 ended  
Goroutine 1 ended  
All go routines finished executing  
```

每个人的输出结果可能不尽相同，因为协程的执行顺序可能会有所不同。

## 工作池的实现#

缓冲信道的一个重要用途是工作池的实现。

通常，工作池是一组线程，它们正在等待分配给它们的任务。一旦完成分配的任务，他们就会再次为下一个任务提供服务。

我们将使用缓冲信道实现工作池。我们的工作池将实现统计输入数值的数字和。例如输入`234`.输出就是`9(2+3+4)`.向工作池输入的是一列伪随机数。

以下是我们工作池的核心功能

- 创建一个协程池，用来监听输入缓冲信道，等待分配作业
- 往输入缓冲信道中增加任务
- 当任务完成时将结果写入输出缓冲信道
- 从输出缓冲信道中读取和打印结果

我们将逐步编写此程序以使其更易于理解。

第一步是创建表示作业和结果的结构体。

```java
type Job struct {
    id       int
    randomno int
}
type Result struct {
    job         Job
    sumofdigits int
}
```

每一个`job`结构体拥有一个`id`和随机值`randomno`，`result`拥有一个`job`元素和统计各位数的和`sunofdigits`元素值。

下一步我们来创建接收`job`和输出`result`的缓冲信道

```java
var jobs = make(chan Job, 10)  
var results = make(chan Result, 10) 
```

工作协程会监听 缓冲信道 `jobs`里的任务，一旦任务完成就把结果写入到`results`的缓冲信道中。

下面的`digits`函数是找到一个整数的各个数字，然后计算之和并返回它，我们将为此函数添加`2`秒的睡眠，以模拟此函数计算结果需要一些时间的事实。

```java
func digits(number int) int {
    sum := 0
    no := number
    for no != 0 {
        digit := no % 10
        sum += digit
        no /= 10
    }
    time.Sleep(2 * time.Second)
    return sum
}
```

接下来，我们将编写一个创建工作者协程的函数。

```java
func worker(wg *sync.WaitGroup) {
    for job := range jobs {
        output := Result{
     job, digits(job.randomno)}
        results <- output
    }
    wg.Done()
}
```

上面创建了一个函数`worker`, 他负责从`jobs`通道中读取元素，计算结果并往`results`信道中写入结果。这个方法用一个`WaitGroup`作为参数，当所有`jobs`被完成时会调用`wg`的`Done()`方法。

`createWorkerPool`函数将创建一个工作者(`worker`)协程池。

```java
func createWorkerPool(noOfWorkers int) {
    var wg sync.WaitGroup
    for i := 0; i < noOfWorkers; i++ {
        wg.Add(1)
        go worker(&wg)
    }
    wg.Wait()
    close(results)
}
```

上面的函数需要一个`int` 参数，这个参数代表要创建的`worker`数。函数内部,在创建协程之前调用`wg.Add(1)`来递增`WaitGroup`计数器。然后将`WaitGroup`的地址`wg` 传递给`worker`函数来创建`worker`协程 。在创建了所需的工作协程之后，调用`wg.Wait()`阻塞，等待所有协程执行完成。在所有协程完成执行后，它关闭了`results`信道，因为所有协程都已执行完成，没有其他协程会往`results`信道写入程序。

现在我们已准备好工作池，让我们继续编写将工作分配给工作者的功能。

```java
func allocate(noOfJobs int) {
    for i := 0; i < noOfJobs; i++ {
        randomno := rand.Intn(999)
        job := Job{
     i, randomno}
        jobs <- job
    }
    close(jobs)
}
```

上面的`allocate` 函数需要一个`int`类型的参数`noOfJobs`，它表示要分配给工作者的工作数量，`randomno`为一个最大值为`998`的随机数，`for`循环的计数器`i`作为`id`，通过循环创建`Job`结构体并写入到`jobs`信道中，当写入工作全部结束后就关闭`jobs`信道。

下一步是创建一个读取 `results` 信道和打印输出的函数。

```java
func result(done chan bool) {
    for result := range results {
        fmt.Printf("Job id %d, input random no %d , sum of digits %d\n", result.job.id, result.job.randomno, result.sumofdigits)
    }
    done <- true
}
```

该`result`函数读取`results`信道并打印`job`的`id`，输入随机数 和 随机数每个位数的总和。`result`函数还将一个`done`信道作为参数，一旦打印完所有结果，它就会向该信道写入一个 `true`值。

我们现在已经准备好了。我们继续完成最后一步，在 `main()` 函数中调用上面所有的函数。

```java
func main() {
    startTime := time.Now()
    noOfJobs := 100
    go allocate(noOfJobs)
    done := make(chan bool)
    go result(done)
    noOfWorkers := 10
    createWorkerPool(noOfWorkers)
    <-done
    endTime := time.Now()
    diff := endTime.Sub(startTime)
    fmt.Println("total time taken ", diff.Seconds(), "seconds")
}
```

上面程序的第`2`行中，我们首先将程序的执行开始时间存储在主函数中，在最后一行（`第12行`）中，我们计算`endTime`和`startTime`之间的时间差，并显示程序花费的总时间。因为我们将通过改变协程的数量来做一些基准测试。所以这是必要的。

将`noOfJobs`设置为`100`，然后调用`allocate`函数，向`jobs`信道增加`Job`。

然后创建`done`信道并传递给`result`协程，以便它可以开始打印输出并在打印完所有内容后发出通知。

最后，通过调用`createWorkerPool`函数创建一个有`10`协程的工作池，然后`main`函数会监听 `done` 信道的通知，等待所有结果打印结束。

下面是完整的程序供您参考。我也导入了必要的包。

```java
package main
import (
	"fmt"
	"math/rand"
	"sync"
	"time"
)
type Job struct {
	id       int
	randomno int
}
type Result struct {
	job         Job
	sumofdigits int
}
//任务缓冲信道,存储了 要执行的任务
var jobs = make(chan Job, 10)
//结果缓冲信道,缓存了任务的执行结果
var results = make(chan Result, 10)
/*
* 任务的真正处理逻辑
 */
func digits(number int) int {
	sum := 0
	no := number
	for no != 0 {
		digit := no % 10
		sum += digit
		no /= 10
	}
	time.Sleep(2 * time.Second)
	return sum
}
/*
* worker 函数用来创建 工作者, 它接受一个 WaitGroup 并在任务完成之后 将WaitGroup 计数器减1
* 函数内容，使用 for range 遍历 jobs 缓冲信道 获取其中的 job 并调用 digits 函数处理job
* 你也可以理解上述操作 为 工人 干活
* 每次处理完一个任务 都将 创建一个 Result 结构体 并 写入 results信道 ，以便让 result 函数打印 结果
* 每个工人执行完任务之后 都调用 wg.Done() 将WaitGroup 计数器减1
 */
func worker(wg *sync.WaitGroup) {
	for job := range jobs {
		output := Result{
     job, digits(job.randomno)}
		results <- output
	}
	wg.Done()
}
/*
* createWorkerPool函数需要一个int类型的参数,表示需要创建多少个工作者,也可以理解为工人,就是干活的人
* 函数内部声明了一盒 WaitGroup 并循环创建 对应数量的工作者去执行任务，并将 WaitGroup 的计数器 递增1
* 创建完所有的工作者之后,程序会在wg.Wait() 这一行阻塞, 直到 WaitGroup 的计数器变为0
* 所有的工作处理完成之后， WaitGroup 的技术器变为0 流程继续向下执行,关闭 results 缓冲信道
 */
func createWorkerPool(noOfWorkers int) {
	var wg sync.WaitGroup
	for i := 0; i < noOfWorkers; i++ {
		wg.Add(1)
		go worker(&wg)
	}
	wg.Wait()
	close(results)
}
/*
* allocate函数接受一个int类型的参数,参数表示要创建的job数，也就是任务数量
* randomno 表示一个最大值为998的随机数
* 使用for循环的计数器 i 作为id 以及 randomno随机数构造 job结构体
* 将所有的结构体写入 jobs 缓冲信道之后 关闭jobs信道
 */
func allocate(noOfJobs int) {
	for i := 0; i < noOfJobs; i++ {
		randomno := rand.Intn(999)
		job := Job{
     i, randomno}
		jobs <- job
	}
	close(jobs)
}
/*
* result函数接受一个done信道作为参数
* 使用 for range遍历 results缓冲信道 打印任务的执行信息
* 一旦打印完所有结果，它就会向done信道写入一个 true值
 */
func result(done chan bool) {
	for result := range results {
		fmt.Printf("Job id %d, input random no %d , sum of digits %d\n", result.job.id, result.job.randomno, result.sumofdigits)
	}
	done <- true
}
func main() {
	//程序的开始时间
	startTime := time.Now()
	//需要创建多少个任务,也就是创建多少个job
	noOfJobs := 100
	//将要创建的job数量传递给allocate协程去创建对应数量的job到 jobs信道中
	go allocate(noOfJobs)
	//创建一个双向信道 用来接受任务执行结果
	done := make(chan bool)
	//将done信道传递给result协程 以便它可以开始打印输出并在打印完所有内容后发出通知
	go result(done)
	//工作者的数量
	noOfWorkers := 10
	//调用createWorkerPool函数创建10个工作者 去执行jobs信道中的任务
	createWorkerPool(noOfWorkers)
	//这一行从信道 done 中读取数据，但是没有使用该数据
	<-done
	//程序执行结束的时间
	endTime := time.Now()
	//计算程序耗时
	diff := endTime.Sub(startTime)
	//打印程序耗时
	fmt.Println("total time taken ", diff.Seconds(), "seconds")
}
```

请在本地计算机上运行此程序，以便在计算总时间内更准确。

这个程序将打印：

```java
Job id 1, input random no 636, sum of digits 15  
Job id 0, input random no 878, sum of digits 23  
Job id 9, input random no 150, sum of digits 6  
...
total time taken  20.01081009 seconds  
```

对应于`100`个作业，将打印总共`100`行，然后将在最后一行打印程序运行所花费的总时间。您的输出可能与我的不同，因为协程的执行顺序不一定，总时间也会因硬件而异。在我的环境下，程序完成大约需要`20`秒。

现在我们把 `main` 函数里的 `noOfWorkers` 增加到 `20`。我们把工作者的数量加倍了。由于工作协程增加了（准确说来是两倍），因此程序花费的总时间会减少（准确说来是一半）。在我的环境下，它变成了 `10.004364685` 秒。程序打印如下：

```java
...
total time taken  10.004364685 seconds
```

现在我们可以理解了，随着工作者协程数量增加，完成作业所需的总时间会减少。你们可以练习一下：在 `main` 函数里修改 `noOfJobs` 和 `noOfWorkers` 的值，并试着去分析一下结果。
