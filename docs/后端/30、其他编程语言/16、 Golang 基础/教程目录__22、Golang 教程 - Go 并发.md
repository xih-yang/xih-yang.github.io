# 22、Golang 教程 - Go 并发
- 来源：https://ddkk.com/zhuanlan/other/golang/2/22.html
- 分类：其他语言
- 分组：教程目录
## 1. 基本概念

- **并发**：是指一个时间段中有几个程序都处于已启动运行到运行完毕之间，且这几个程序都是在同一个处理机上运行，但任一个时刻点上只有一个程序在处理机上运行。同—时间段同时在做多个事情。
- **并行**：在操作系统中是指，一组程序按独立异步的速度执行，无论从微观还是宏观，程序都是一起执行的。同一时刻同时在做多个事情。
- **进程**：一个程序启动之后就创建了一个进程。
- **线程**：操作系统调度的最小单元。
- **协程**：用户态的线程（1.15 版本后不需要手动调节核心数，默认多对多，1.15 版本之前默认多对一）。
- **goroutine**：go 关键字为一个函数创建一个 goroutine。一个函数可以被创建多个 goroutine，一个 goroutine 必定对应一个函数。

`示例：启动单个 goroutine，只需在调用的函数（普通函数和匿名函数）前面加上一个 go 关键字。`

```java
package main
import "fmt"
func hello() {
    fmt.Println("hello 函数")
}
func main() {
    // 并发执行，main() 函数本身会运行一个 goroutine
    go hello()
    fmt.Println("main 函数")
}
/* hello() 函数 goroutine 依赖于 main() 的 goroutine，有可能只运行了 main() 没有运行 hello()
main 函数
hello 函数
-----------或者------------
main 函数
*/
```

`示例：等待 goroutine 运行完 main 再结束`

```java
package main
import (
	"fmt"
	"time"
)
func hello() {
	fmt.Println("hello 函数")
}
func main() {
	// 并发执行
	go hello()
	// 等待 1 秒钟
	time.Sleep(time.Second)
	fmt.Println("main 函数")
}
/* main() 函数等待 hello() 一秒钟，不设置等待两个 goroutine 会并发执行，先执行完了 main 函数程序就结束了
hello 函数
main 函数
*/
```

`示例：加入 defer 语句`

```java
package main
import (
    "fmt"
    "time"
)
func hello() {
	fmt.Println("hello 函数")
}
func main() {
    defer fmt.Println("defer 语句")	// main 函数结束前执行
	go hello()
	time.Sleep(time.Second)
	fmt.Println("main 函数")
}
/*
hello 函数
main 函数
defer 语句
*/
```

```java
package main
import (
	"fmt"
	"time"
)
func hello() {
	fmt.Println("HELLO WORLD")
}
func main() {
	defer fmt.Println("defer3")
	go hello()
	time.Sleep(time.Second)
	fmt.Println("main 函数")
	defer fmt.Println("defer2")
	defer fmt.Println("defer1")
}
/*
HELLO WORLD
main 函数
defer1
defer2
defer3
*/
```

## 2. sync.WaitGroup

使用sync.WaitGroup 无需设置等待时间，它会自动等待所有 goroutine 执行完成后再结束 main，效率提升。

```java
package main
import (
    "fmt"
    "sync"
)
// 定义 sync.WaitGroup 结构体，内置计数器
var sw sync.WaitGroup
func hello() {
    fmt.Println("hello 函数")
    // 告知计数器运行完毕，次数 -1
    sw.Done()
}
func test() {
    fmt.Println("test 函数")
    sw.Done()
}
func main() {
    defer fmt.Println("defer 语句")
    // 设置 goroutine 计数器次数
    sw.Add(2)
    go hello()	//创建一个 goroutine，在 goroutine 中执行 hello()
    go test()
    fmt.Println("main 函数")
    // 等待计数器归零，结束 main，否则一直处于等待状态，不关闭 main 函数
    sw.Wait()
}
/*
main 函数
test 函数
hello 函数
defer 语句
*/
```

`示例：启用 10 个 goroutine`

```java
package main
import (
    "fmt"
    "sync"
)
// 定义 sync.WaitGroup 结构体，内置计数器
var sw sync.WaitGroup
func hello(i int) {
    fmt.Println("hello 函数",i)
    // 告知计数器运行完毕，次数 -1
    sw.Done()
}
func main() {
    defer fmt.Println("defer 语句")
    // 计数器 +10
    sw.Add(10)
    for i:=0;i<10;i++ {
        go hello(i)
    }
    fmt.Println("main 函数")
    // 阻塞，一直等到所有 goroutine 结束
    sw.Wait()
}
/*
main 函数
hello 函数 9
hello 函数 5
hello 函数 6
hello 函数 7
hello 函数 8
hello 函数 2
hello 函数 0
hello 函数 1
hello 函数 3
hello 函数 4
defer 语句
*/
```

`示例：panic 宕机前把错误信息发送到控制台上，程序结束，资源全部释放。`

```java
package main
import (
    "fmt"
    "sync"
)
// 定义 sync.WaitGroup 结构体，内置计数器
var sw sync.WaitGroup
func hello(i int) {
    fmt.Printf("抢购第 %d 个商品\n",i)
    if i == 8 {
        panic("宕机报警")
    }
    sw.Done()	// 遇到 panic 不执行
}
func main() {
    defer fmt.Println("defer 语句")
    // 计数器 +10
    sw.Add(10)
    for i:=0;i<10;i++ {
        go hello(i)
    }
    fmt.Println("main 函数")
    // 阻塞，一直等到所有 goroutine 结束
    sw.Wait()
}
/*
main 函数
抢购第 9 个商品
抢购第 0 个商品
抢购第 1 个商品
抢购第 2 个商品
抢购第 3 个商品
抢购第 4 个商品
抢购第 5 个商品
抢购第 6 个商品
抢购第 7 个商品
抢购第 8 个商品
panic: 宕机报警
goroutine 27 [running]:
main.hello(0x8)
	d:/goproject/src/dev_code/user_login/main/main.go:14 +0xa5
created by main.main
	d:/goproject/src/dev_code/user_login/main/main.go:24 +0xb0
exit status 2
*/
```

## 3. goroutine 和线程

**可增长的栈**

I
OS线程(操作系统线程)一般都有固定的栈内存(2MB)，一个goroutine的栈在生命周期开始时只有很小的栈(2KB)，goroutine的栈是不固定的，可以按需增加或者缩小，goroutine的栈大小限制可以达到1GB，虽然这种情况不多见，所以一次可以创建十万左右的goroutine是没问题的。

**goroutine 调度**

OS线程由OS内核来调度，goroutine则是由Go运行时(runtime)自己的调度器来调度，这个调度器使用一个m:n调度的技术(复用/调度m个goroutine到n个OS线程)，goroutine的调度不需要切换内核语境，所以调用一个goroutine比调用个线程的成本要低很多。

**GOMAXPROCS**

Go运行时的调度使用GOMAXPROCS参数来确定需要使用多少个OS线程来同时执行Go代码，默认值是机器上的CPU核心数。例如:在一个8核心的机器上，调度器会把Go代码同时调度到8个OS线程上(GOMAXPROCS是m:n调度中的n)。

Go可以通过runtime.GOMAXPROCS()函数设置当前程序并发时占用的CPU逻辑核心数。(Go1.5版本前默认是单核心执行，Go1.5版本后默认使用全部逻辑核心数)

`示例：通过将任务分配到不同的 CPU 逻辑核心上实现并行的效果。`

```java
package main
import (
    "fmt"
    "runtime"
    "sync"
    "time"
)
var sw sync.WaitGroup
func a() {
    defer sw.Done()
    for i:=0;i<10;i++ {
        fmt.Println("A:",i)
    }
}
func b() {
    sw.Done()
    for i:=0;i<10;i++ {
        fmt.Println("B:",i)
    }
}
func main() {
    // 使用 1 个逻辑核心数跑 Go 程序
    runtime.GOMAXPROCS(1)
    sw.Add(2)
    go a()
    go b()
    time.Sleep(time.Second)
    sw.Wait()
}
/*
B: 0
B: 1
B: 2
B: 3
B: 4
B: 5
B: 6
B: 7
B: 8
B: 9
A: 0
A: 1
A: 2
A: 3
A: 4
A: 5
A: 6
A: 7
A: 8
A: 9
*/
```

## 4. channel

**1、** 单纯的将函数并发执行没有意义函数与函数间需要交换数据才能体现并发执行函数的意义；

**2、** 虽然可以使用共享内存进行数据交换，但是共享内存在不同的goroutine中容易发生竞态问题为了保证数据交换的正确性，必须使用互斥量对内存进行加锁，这种做法势必造成性能问题；

**3、** go语言的并发模型是SCP，提倡通过通信共享内存而不是通过共享内存而实现通信；

**4、** 如果说goroutine是Go程序并发的执行体，channel就是它们之间连接channel是可以让一个goroutine发送特定值到另一个goroutine的通信机制；

**5、** go语言中的通道(channel)是一种特殊的类型通道像一个传送带或者队列，总是遵循先入先出的规则，保证收发数据的顺序每一个通道都是一个具体类型的导管，在声明channel的时候需要为其指定元素类型；

`声明语法:`

```java
var 变量 chan 元素类型
```

`示例:`

```java
var ch1 chan int	// 传递整形的通道
var ch2 chan bool	// 传递布尔型的通道
var ch3 chan []int	// 传递整形切片的通道
```

`示例：使用 channel 传递数据`

```java
package main
import "fmt"
// channel 是引用类型，默认为 nil
func main() {
    var ch1 chan int	// 通道 ch1 传输 int 元素数据
    var ch2 chan bool	// 通道 ch2 传输 bool 类型数据
    fmt.Println("ch1:",ch1)
    fmt.Println("ch2:",ch2)
    // make 函数初始化（slice,map,channel）
    // 需要指定初始化空间，不然会死锁
    ch3 := make(chan int,2)
    // 通道操作：发送、接收、关闭
    // 发送和接收符号： <-
    ch3 <- 10	// 把 10 发送到 ch3 中
    ch3 <- 20
    // <- ch3	// 从 ch3 中接收值，直至丢弃
    result := <-ch3	// 从 ch3 中接收值，保存至 result 中
    result2 := <-ch3
    fmt.Println(result,result2)
    // 关闭
    close(ch3)
    // 关闭的通道再接收，能取到对应类型的零值
    result3 := <-ch3
    fmt.Println(result3)
    // 已经关闭的通道可以提取数据，但是不能更改数据，会 panic（崩溃）。
    // ch3 <- 30
    // 关闭一个已经关闭的通道会 panic
    // close(ch3)
}
/*
ch1: <nil>
ch2: <nil>
10 20
0
*/
```

- [如果使用 channel 之前没有 make，会出现 deadlock 错误](https://www.cnblogs.com/devhg/p/14009288.html#%E5%A6%82%E6%9E%9C%E4%BD%BF%E7%94%A8channel%E4%B9%8B%E5%89%8D%E6%B2%A1%E6%9C%89make%E4%BC%9A%E5%87%BA%E7%8E%B0dead-lock%E9%94%99%E8%AF%AF)
- [写数据之前，没有其他协程阻塞接收并且没有缓冲可以存，会发生 dealock](https://www.cnblogs.com/devhg/p/14009288.html#%E5%86%99%E6%95%B0%E6%8D%AE%E4%B9%8B%E5%89%8D%E6%B2%A1%E6%9C%89%E5%85%B6%E4%BB%96%E5%8D%8F%E7%A8%8B%E9%98%BB%E5%A1%9E%E6%8E%A5%E6%94%B6%E5%B9%B6%E4%B8%94%E6%B2%A1%E6%9C%89%E7%BC%93%E5%86%B2%E5%8F%AF%E4%BB%A5%E5%AD%98%E4%BC%9A%E5%8F%91%E7%94%9Fdealock)
- channel make 之后没有传入数据，提取数据的时候会 deadlock
- channel 满了继续传入元素会 deadlock

`示例：传递多个值，当未传完时，通道关闭，是否可取值`

```java
package main
import "fmt"
// channel 是引用类型，默认为 nil
func main() {
    // 定义通道
    ch1 := make(chan int,10)
    for i:=0;i<10;i++ {
        // 数据存放入通道
        ch1 <- i
        // 当 i 为 6 时通道关闭
        if i == 6 {
            close(ch1)
            break
        }
    }
    leng := len(ch1)
    fmt.Println("--------ch1 取值-------")
    // 从管道中拿值
    for j:=0;j<leng;j++ {
        result := <- ch1
        fmt.Println(result)
    }
}
/*
--------ch1 取值-------
0
1
2
3
4
5
6
*/
```

```java
package main
import "fmt"
// channel 是引用类型，默认为 nil
func main() {
	// 定义通道
	ch1 := make(chan int, 10)
	for i := 0; i < 10; i++ {
		// 数据存放入通道
		ch1 <- i
		// 当 i 为 6 时通道关闭
		if i == 6 {
			close(ch1)
			break
		}
	}
	fmt.Println("--------ch1 取值-------")
	// 数据量不确定的情况下取数据
	for result := range ch1 {
		fmt.Println(result)
	}
}
/*
--------ch1 取值-------
0
1
2
3
4
5
6
 */
```

## 5. 无缓冲通道和缓冲通道

`示例：无缓冲通道`

```java
package main
import "fmt"
func Result(ch chan bool) {
    ret := <-ch		// 取值，未取到阻塞
    fmt.Println(ret)
}
// 通道是建立在 goroutine 之间的连接
func main() {
    // 无缓冲区通道，可以同步执行
    ch := make(chan bool)	// 不放缓冲区空间，不存值，发了就收
    go Result(ch)	// 不使用 goroutine 会死锁
    // 传递数据，同步执行
    ch <-true
    fmt.Println("main 函数结束")
}
/*
true
main 函数结束
*/
// 两个 goroutine 同步往下执行
```

`示例：缓冲区通道`

```java
package main
import (
    "fmt"
    "time"
)
func Result(ch chan bool) {
    ret := <- ch
    fmt.Println(ret)
}
func main() {
    // 缓冲通道，可以异步执行
    // 10 个缓冲区
    ch := make(chan bool,10)
    ch <- false
    // 获取数据量
    fmt.Println(len(ch),cap(ch))
    go Result(ch)
    ch <- true
    time.Sleep(time.Second)
    result1 := <-ch
    fmt.Println(result1)
    fmt.Println("main 函数结束")
}
/*
1 10
false
true
main 函数结束
*/
```

`示例：取值判断通道是否关闭`

```java
package main
import "fmt"
var ch1 chan int
// 产生数据输入通道，输入完即关闭
// 引用类型
// 在生产环境中为了节省内存资源，一般传递 chan 的指针
func send(ch chan int) {
    for i:=0;i<10;i++ {
        ch <- i
    }
    close(ch)
}
func main() {
    ch1 = make(chan int,100)
    go send(ch1)
    // 从通道中取值
    for {
        // 产生两个值，获取的值给 ret，是否取完的 bool 值给 ok
        ret,ok := <-ch1
        // 判断值是否取完
        if !ok {
     	// !ok 等于 !ok == true
            break
        }
        fmt.Println(ret)
    }
}
/*
0
1
2
3
4
5
6
7
8
9
*/
```

`示例：方式二 for...range 取值更加便捷`

```java
package main
import "fmt"
var ch1 chan int
func send(ch chan int) {
    for i:=0;i<10;i++ {
        ch <- i
    }
    close(ch)
}
func main() {
    ch1 = make(chan int,100)
    go send(ch1)
    // 从通道中取值
    for ret := range ch1 {
        fmt.Println(ret)   
    }
}
/*
0
1
2
3
4
5
6
7
8
9
*/
```

## 6. 案例：生产者和消费者模型

- 生产者：产生随机数
- 消费者：计算每个随机数的每个位的数字的和（123=6）

`示例`

```java
package main
import (
	"fmt"
    "math/rand"
    "time"
)
// 传送随机数通道（使用指针传递）
var itemChan chan *item
// 传送求和值通道
var resultChan chan *result
//随机数字结构体
type item struct{
	id int64
	num int64
}
//求和结构体
type result struct{
	item *item
	sum int64
}
//生产者函数
func producer(ch chan *item) {
    // 1.生成随机数
    var id int64
    for {
        // 序列号自增
        id++
        number := rand.Int63()	// 随机生成正整数
        // 随机数结构体封装
        tmp := &item {
            id: id,
            num: number,
        }
        // 2. 随机数发送到通道中
        ch <- tmp
    }
}
//计算求和函数
func calc(num int64) int64 {
    // 和：值
    var sum int64
    for num > 0 {
        // 得到每一个位数进行累加
        sum = sum + num%10
        num = num / 10
    }
    return sum
}
//消费者函数
func consumer(ch chan *item,resultChan chan *result) {
    // 从 itemChan 通道中取随机数结构体指针
    for {
        tmp := <-ch		// 获取的是指针
        sum := calc(tmp.num)	// tmp.num 就是 (*tmp).num，会自动识别指针
        // 构造 result 结构体
        resObj := &result {
            item: tmp,
            sum: sum,
        }
        // 结果传递通道 resultChan 等待进行输出
        resultChan <- resObj
    }
}
// 打印结果
func printResult(resultChan chan *result) {
    for ret := range resultChan {
        fmt.Printf("id:%v,num:%v,sum:%v\n",ret.item.id,ret.item.num,ret.sum)
    }
    // 输出节奏控制
    time.Sleep(time.Second)
}
// 灵活启用指定数量的 goroutine
// n 为要开启的 goroutine 数量
func startWorker(n int, ch chan *item, resultChan chan *result) {
    for i:=0;i<n;i++ {
        go consumer(ch, resultChan)
    }
}
func main() {
    // 通道初始化，结构体指针类型
    itemChan = make(chan *item, 100)
    resultChan = make(chan *result, 100)
    // 启用生产者 goroutine
    go producer(itemChan)
    // 消费者 goroutine，高并发处理
    startWorker(30, itemChan, resultChan)
    // 打印结果
    printResult(resultChan)
} 
/*
......
id:2269814,num:2288722406314923128,sum:74
id:2269815,num:3523482921360853318,sum:76
id:2269816,num:4335934260772634235,sum:78
id:2269817,num:6899687332089400691,sum:98
id:2269818,num:649138352634796168,sum:91
id:2269819,num:4468816822098197870,sum:98
......
*/
```

`示例：产生固定数量(10000)数据，消费并输出。`

```java
package main
import (
	"fmt"
	"math/rand"
	"sync"
)
var sw sync.WaitGroup
// 传送随机数通道（使用指针传递）
var itemChan chan *item
// 传送求和值通道
var resultChan chan *result
//随机数字结构体
type item struct{
	id int64
	num int64
}
//求和结构体
type result struct{
	item *item
	sum int64
}
//生产者函数
func producer(itemCh chan *item) {
	// 1.生成随机数
	var id int64
	for i:=0;i<10000;i++ {
		// 序列号自增
		id++
		number := rand.Int63()	// 随机生成正整数
		// 随机数结构体封装
		tmp := &item {
			id: id,
			num: number,
		}
		// 2. 随机数发送到通道中
		itemCh <- tmp
	}
	// 生产者就关闭通道
	close(itemCh)
}
//计算求和函数
func calc(num int64) int64 {
	// 和：值
	var sum int64
	for num > 0 {
		// 得到每一个位数进行累加
		sum = sum + num%10
		num = num / 10
	}
	return sum
}
//消费者函数
func consumer(itemCh chan *item,resultChan chan *result) {
	defer sw.Done()
	for tmp := range itemCh {
		sum := calc(tmp.num)
		resObj := &result {
			item: tmp,
			sum: sum,
		}
		// 结果传递通道 resultChan 等待进行输出
		resultChan <- resObj
	}
}
// 输出遍历
func printResult(resultChan chan *result) {
	for ret := range resultChan {
		fmt.Printf("id:%v,num:%v,sum:%v\n",ret.item.id,ret.item.num,ret.sum)
	}
}
// 灵活启用指定数量的 goroutine
func startWorker(n int, ch chan *item, resultChan chan *result) {
	for i:=0;i<n;i++ {
		go consumer(ch, resultChan)
	}
}
func main() {
	// 通道初始化，结构体指针类型
	itemChan = make(chan *item, 10000)
	resultChan = make(chan *result, 10000)
	// 启用生产者 goroutine
	go producer(itemChan)
	sw.Add(30)
	// 消费者 goroutine，高并发处理
	startWorker(30, itemChan, resultChan)
	sw.Wait()
	close(resultChan)
	// 打印结果
	printResult(resultChan)
}
/*
......
id:9994,num:1987117896576534405,sum:96
id:9991,num:5044347164485013963,sum:77
id:9988,num:3629211981645464284,sum:85
id:9993,num:4825564091510870816,sum:80
id:9989,num:3082077175713183942,sum:78
id:9998,num:5665788214883279410,sum:94
......
*/
```

`示例:方式二，通道和 goroutine 配合处理指定数量数据。`

```java
package main
import (
	"fmt"
	"math/rand"
)
// 传送随机数通道
var itemChan chan *item
// 传送求和值通道
var resultChan chan *result
// 空结构体传输通道
var doneChan chan struct{
     }
// 随机数字和id
type item struct {
	id int64
	num int64
}
//求和结构体
type result struct{
	item *item
	sum int64
}
//生产者函数
func producer(ch chan *item) {
	// 1.生成随机数
	var id int64
	for i:=0;i<10000;i++ {
		// 序列号自增
		id++
		number := rand.Int63()	// 随机生成正整数
		// 随机数结构体封装
		tmp := &item {
			id: id,
			num: number,
		}
		// 2. 随机数发送到通道中
		ch <- tmp
	}
	// 生产者就关闭通道
	close(ch)
}
//计算求和函数
func calc(num int64) int64 {
	// 和：值
	var sum int64
	for num > 0 {
		// 得到每一个位数进行累加
		sum = sum + num%10
		num = num / 10
	}
	return sum
}
//消费者函数
func consumer(itemCh chan *item,resultChan chan *result) {
	for tmp := range itemCh {
		sum := calc(tmp.num)
		resObj := &result {
			item: tmp,
			sum: sum,
		}
		// 结果传递通道 resultChan 等待进行输出
		resultChan <- resObj
	}
	// 传递结构体进通道
	doneChan <- struct{
     }{
     }
}
// 消费者 goroutine 数量控制
func closeChan(n int,downChan chan struct{
     },resultChan chan *result) {
	// 取完就阻塞
	for i:=0;i<30;i++ {
		<-downChan
	}
	close(downChan)
	close(resultChan)
}
// 输出遍历
func printResult(resultChan chan *result) {
	for ret := range resultChan {
		fmt.Printf("id:%v,num:%v,sum:%v\n",ret.item.id,ret.item.num,ret.sum)
	}
}
// 灵活启用指定数量的 goroutine
func startWorker(n int, ch chan *item, resultChan chan * result) {
	for i:=0;i<n;i++ {
		go consumer(ch, resultChan)
	}
}
func main() {
	itemChan = make(chan *item, 10000)
	resultChan = make(chan *result, 100)
	doneChan = make(chan struct{
     },30)
	go producer(itemChan)
	startWorker(30, itemChan, resultChan)
	go closeChan(30, doneChan, resultChan)
	printResult(resultChan)
}
/*
......
id:9996,num:2016593329055481975,sum:84
id:9997,num:661484091736918950,sum:87
id:9998,num:5665788214883279410,sum:94
id:9999,num:3873652276866279948,sum:108
id:10000,num:8455728612988973956,sum:112
*/
```

`示例：for 和 for...range 的区别`

```java
package main
var ch chan int
func main() {
    ch = make(chan int,10)
    close(ch)
    // for 遍历
    for {
        result := <-ch
        fmt.Println(result)
    }
}
// ------------------------------ //
package main
var ch chan int
func main() {
    ch = make(chan int,10)
    close(ch)
    // for...range 遍历
    for result := range ch {
        fmt.Println(result)
    }
}
```

## 7. select 多路复用

- 类似于用于通信的 switch 语句。每个 case 必须是一个通信操作，要么是发送要么是接收。
- select 随机执行一个可运行的 case。如果没有 case 可运行，它将**阻塞**，直到有 case 可运行。一个默认的子句应该总是可运行的（有 default 执行）。
- 某些场景下，我们需要同事从多个通道接受数据，没有数据发生接收就会阻塞。
- select 和 switch 不一样，switch 自上而下执行，select 随机公平选举。

`语法示例`

```java
select {
    case communication clause:
    statement(s);
    case communication clause:
    statement(s);
    /* 你可以定义任意数量的 case */
    default:	// 可选
    statement(s);
}
```

- 每个 case 都必须是一个通信
- 所有 channel 表达式都会被求值
- 所有被发送的表达式都会被求值
- 如果任意某个通信可以进行，它就执行，其他被忽略
- 如果有多个 case 都可以运行，Select 会随机公平地选出一个执行。其他不会执行。

否则：

```java
1. 如果有 default 子句，则执行该语句。
2. 如果没有 default 子句，select 将阻塞，直到某个通信可以运行；Go 不会重新对 channel 或值进行求值。
```

`示例`

```java
package main
import (
    "fmt"
    "math"
    "time"
)
// 定义通道
var ch1 = make(chan string,100)
var ch2 = make(chan string,100)
// 产生数据发送给通道
func sendK1(ch chan string) {
    for i:=0;i<math.MaxInt64;i++ {
        ch <- fmt.Sprintf("k1:%d",i)
        time.Sleep(time.Millisecond * 50)
    }
}
func main() {
    go sendK1(ch1)	// 通道 1 发送数据
    go sendK1(ch2)	// 通道 2 发送数据
    // 使用 select 拿取数据，提升效率
    for {
        // 如果通道都可以通信，是随机公平执行其中一条，忽略其他
        // 如果通道都不能通信，且没有 default 语句，处于阻塞状态，直到可以通信为止
        select {
            case ret := <-ch1:
            fmt.Println(ret)
            case ret := <-ch2:
            fmt.Println(ret)
            default:
            fmt.Println("没有取到数据")
            time.Sleep(time.Millisecond * 500)
        }
    }
}
/*
没有取到数据
k1:0
k1:0
k1:1
k1:2
k1:3
k1:1
k1:2
k1:4
k1:3
k1:5
k1:6
k1:7
k1:8
k1:4
k1:5
k1:9
k1:6
k1:7
k1:8
k1:9
没有取到数据
......
*/
```

```java
package main
import (
	"fmt"
	"math"
	"time"
)
var ch1 = make(chan string,100)
var ch2 = make(chan string,100)
func sendK1(ch chan string) {
	for i:=0;i<math.MaxInt64;i++ {
		ch <- fmt.Sprintf("k1:%d",i)
		time.Sleep(50 * time.Millisecond)
	}
}
func sendK2(ch chan string) {
	for i:=0;i<math.MaxInt64;i++ {
		ch <- fmt.Sprintf("k2:%d",i)
		time.Sleep(50 * time.Millisecond)
	}
}
func main() {
	go sendK1(ch1)
	go sendK2(ch2)
	for {
		select {
		case ret :=<- ch2:
			fmt.Println(ret)
		case ret :=<- ch1:
			fmt.Println(ret)
		default:
			fmt.Println("NO DIGITAL")
		time.Sleep(500 * time.Millisecond)
		}
	}
}
/*
NO DIGITAL
k2:0
k2:1
k1:0
k1:1
k1:2
k2:2
......
*/
```

`示例`

```java
package main
import "fmt"
func main() {
    var ch = make(chan int,1)
    for i:=0;i<10;i++ {
        // 解决死锁问题
        select {
            case ch <- i:	//尝试放入值，只能放入一个值，如果有值，则无法再放入
            case ret := <-ch:	//尝试取值，没有值拿就会出现死锁
            	fmt.Println(ret)
        }
    }
}
/*
0
2
4
6
8
*/
```

`示例：使用 select 完善生产者和消费者模型，键盘输入回车终止数据。`

```java
package main
import (
	"fmt"
	"math/rand"
	"os"
	"time"
)
// 传送随机数通道（使用指针传递）
var itemChan chan *item
// 传送求和值通道
var resultChan chan *result
// 空结构体传输通道
var doneChan chan struct{}
//随机数字结构体
type item struct{
	id int64
	num int64
}
//求和结构体
type result struct{
	item *item
	sum int64
}
//生产者函数
func producer(ch chan *item) {
	// 1.生成随机数
	var id int64
	for {
		// 序列号自增
		id++
		number := rand.Int63()	// 随机生成正整数
		// 随机数结构体封装
		tmp := &item {
			id: id,
			num: number,
		}
		// 2. 随机数发送到通道中
		ch <- tmp
	}
}
//计算求和函数
func calc(num int64) int64 {
	// 和：值
	var sum int64
	for num > 0 {
		// 得到每一个位数进行累加
		sum = sum + num%10
		num = num / 10
	}
	return sum
}
//消费者函数
func consumer(ch chan *item,resultChan chan *result) {
	// 从 itemChan 通道中取随机数结构体指针
	for tmp := range ch {
		sum := calc(tmp.num)	// tmp.num 就是 (*tmp).num，会自动识别指针
		// 构造 result 结构体
		resObj := &result {
			item: tmp,
			sum: sum,
		}
		// 结果传递通道 resultChan 等待进行输出
		resultChan <- resObj
	}
}
// 打印结果
func printResult(doneChan chan struct{}, resultChan chan *result) {
	for {
		// 控制台控制数据开关
		select {
         // 消费数据输出通道
		case ret := <-resultChan:
			fmt.Printf("id:%v,num:%v,sum:%v\n",ret.item.id,ret.item.num,ret.sum)
			time.Sleep(time.Second)
         // 控制台数据通道   
		case <-doneChan:
			return
		}
	}
}
// 监听键盘输入字符传递给 doneChan 通道
func inputChan(doneChan chan struct{}) {
	// 一个字符的输入
	tmp := [1]byte{}
	// 从标准输入获取值,未输入一直处于等待状态
	os.Stdin.Read(tmp[:])
	doneChan <- struct{}{}
}
// 灵活启用指定数量的 goroutine
// n 为要开启的 goroutine 数量
func startWorker(n int, ch chan *item, resultChan chan *result) {
	for i:=0;i<n;i++ {
		go consumer(ch, resultChan)
	}
}
func main() {
	// 通道初始化，结构体指针类型
	itemChan = make(chan *item, 100)
	resultChan = make(chan *result, 100)
	doneChan = make(chan struct{},1)
	// 启用生产者 goroutine
	go producer(itemChan)
	// 消费者 goroutine，高并发处理
	startWorker(30, itemChan, resultChan)
	go inputChan(doneChan)
	// 打印结果
	printResult(doneChan,resultChan)
}
/*
id:1,num:5577006791947779410,sum:95
id:2,num:8674665223082153551,sum:79
id:3,num:6129484611666145821,sum:81
id:4,num:4037200794235010051,sum:53
id:5,num:3916589616287113937,sum:95
id:6,num:6334824724549167320,sum:80
id:7,num:605394647632969758,sum:99
......
*/
```

## 8. 单向通道

在函数中只能发送值不能接收值称之为只写通道，只能接收不能发送值称之为只读通道，让代码意向更明确，更清晰。

`示例：只写通道`

```java
package main
import "fmt"
func main() {
    // 只写通道
    var ch chan <- int
    for i:=0;i<10;i++ {
        ch <- i
    }
    // ch 会报错
    result := <-ch
    fmt.Println(result)
}
```

`示例：只读通道`

```java
package main
import "fmt"
func main() {
    // 只读通道
    var ch chan <- int
    for i:=0;i<10;i++ {
        ch <- i
    }
    // ch 会报错
    result := <-ch
    fmt.Println(result)
}
/*
# command-line-arguments
.\main.go:12:12: invalid operation: <-ch (receive from send-only type chan<- int)
*/
```

```java
package main
import "fmt"
var ch chan int
// 只写通道，针对一个函数中实现
func writeCh(ch chan<- int) {
	ch <- 10
}
// 只读通道
func readCh(ch <- chan int) int {
	ret := <-ch
	return ret
}
func main() {
	ch = make(chan int,1)
	writeCh(ch)
	fmt.Println(readCh(ch))
}
/*
10
 */
```

https://www.zhihu.com/question/362547316

https://www.nhooo.com/golang/go-unidirectional-channel.html

## 9. 并发控制和锁

在go 代码中可能会存着多个 goroutine 同时操作一个资源(临界区)，这种情况会发生竞态。例如：商场更衣间、停车位。

### (1) 互斥锁

互斥锁是一种常用的控制共享资源访问的方法，它能够保证只有一个 goroutine 访问共享资源。例如：网上购票。

**互斥锁作用：同一时间有且仅有一个 goroutine 进入临界区，其他 goroutine 则在等待锁，等互斥锁释放后，等待的 goroutine 才可以获取锁进入临界区，多个 goroutine 都在等待一个锁时，唤醒机制是随机的。**

`示例：资源竞争的情况`

```java
package main
import (
	"fmt"
	"sync"
)
// 全局变量
var x int64
// 计时器
var sw sync.WaitGroup
// 累加函数
func add() {
	defer sw.Done()
	for i:=0;i<5000;i++ {
		x++	// 不同 goroutine 竞争 x 资源
	}
}
func main() {
	sw.Add(2)
	go add()
	go add()
	sw.Wait()
	fmt.Println(x)
}
/*
6115/10000/7436......
会有各种情况
 */
```

`示例：加互斥锁`

```java
package main
import (
    "fmt"
    "sync"
)
// 全局变量
var x int64
// 计时器
var sw sync.WaitGroup
// 互斥锁
var lock sync.Mutex
// 累加函数
func add() {
    for i:=0;i<5000;i++ {
        lock.Lock()	// 互斥锁把门锁上
        x++
        lock.Unlock()	// 互斥锁把门解锁
    }
    sw.Done()
}
func main() {
    sw.Add(2)
    go add()
    go add()
    sw.Wait()
    fmt.Println(x)
}
/*
10000
*/
```

### (2) 读写互斥锁

互斥锁是完全互斥的，但是很多的实际场景，读多写少，当并发的去读取一个资源不涉及资源修改的时候是没有必要加锁的，这种场景使用读写锁是更好的一种选择，可以提高性能。

读写锁分两种：读锁和写锁。当一个 goroutine 获取读锁之后，其他的 goroutine 如果是获取读锁会继续获得锁，如果是获取写锁就会等待；当一个 goroutine 获取写锁之后，其他的 goroutine 无论是获取读锁还是写锁都会等待。

`示例`

```java
// 实验不加锁、使用互斥锁、使用读写互斥锁的区别
// 不加锁最快，使用互斥锁最慢
package main
import (
    "fmt"
    "sync"
    "time"
)
var x int64
var sw sync.WaitGroup
// 使用互斥锁
var lock sync.Mutex
// 使用读写互斥锁
var rwlock sync.RWMutex
func read() {
    defer sw.Done()
	rwlock.RLock()	// 读互斥加锁
	// lock.Lock()	// 互斥加锁
	time.Sleep(time.Millisecond * 1)
	// lock.Unlock()	// 互斥解锁
	rwlock.RUnlock()	// 读互斥解锁
}
func write() {
    defer sw.Done()
    rwlock.Lock()	// 写互斥加锁
    // lock.Lock()	// 互斥锁加锁
    x++
    time.Sleep(time.Millisecond * 5)
    // lock.Unlock()	// 互斥锁解锁
    rwlock.Unlock()	// 写锁解锁
}
func main() {
    start := time.Now()
    // 写入 10 次
    for i:=0;i<10;i++ {
        sw.Add(1)
        go write()
    }
    // 读取 1000 次
    for i:=0;i<1000;i++ {
        sw.Add(1)
        go read()
    }
    sw.Wait()
    end := time.Now()
    fmt.Printf("用时:%v.\n",end.Sub(start))
}
/*
用时:58.3229ms.
*/
```

### (3) sync.Once

延迟一个开销很大的初始化操作，到真正用到它的时候再执行，例如：定义了一个 init 初始化函数，程序启动的时候会被自动加载，无论是否用到都会加载，这样程序就会增加程序的启动延时。

`示例`

```java
package main
import (
    "sync"
)
// 龙类
type Dragon struct {
    name string
    property string
}
// 加载龙类
func loadDragon(n,p string) Dragon {
    dragon := Dragon {
        name: n,
        property: p,
    }
    return dragon
}
var cards map[string]Dragon
// 卡牌
func loadCards() {
    cards = map[string]Dragon {
        "red":		loadDragon("红龙","火"),
        "blue":		loadDragon("蓝色","冰"),
        "white":	loadDragon("白色","光"),
        "black":	loadDragon("黑龙","暗"),
    }
}
// 被多个 goroutine 调用时不是并发安全的
func card(name string) Dragon {
    if cards == nil {
        loadCards()
    }
    return cards[name]
}
```

多个goroutine 并发调用 card 函数不是并发安全的，现代的编译器和 CPU 可能会在保证每个 goroutine 都满足串行一致的基础上，自由重排访问内存的顺序。loadCards 函数可能会被重排。

```java
func loadCards() {
    cards = make(map[string]Dragon)
    cards["red"] = loadDragon("红龙","火"),
    cards["blue"] = loadDragon("蓝色","冰"),
    cards["white"] = loadDragon("白色","光"),
    cards["black"] = loadDragon("黑龙","暗"),
}
```

这种情况下会出现即使判断了 cards 不是 nil 也不意味着初始化完成。考虑到这种情况，解决的办法就是添加互斥锁，保证初始化 cards 的时候不会被其他 goroutine 操作，单这样做又会引发性能问题。于是 Go 提供了一种解决方案 **sync.Once**。

sync.Once 只有一个 Do 方法，示例：

```java
// 定义 sync.Once
var onlyOne sync.Once
// 被多个 goroutine 调用时不是并发安全的
func card(name string) Dragon {
    if cards == nil {
        onlyOne.Do(loadCards)
    }
    return cards[name]
}
```

`示例：使用 sync.Once 调用带参函数`

```java
package main
import (
    "fmt"
    "sync"
)
// 定义 sync.Once
var onlyOne sync.Once
func test(x int) {
    fmt.Println(x)
}
// 闭包
func closer(x int) func() {
    return func() {
        test(x)
    }
}
func main() {
    t := closer(10)
    onlyOne.Do(t)
}
/*
10
*/
```

### (4) sync.Map

`示例`

```java
package main
import (
    "fmt"
    "strconv"
    "sync"
)
// sync.Map
// 全局变量，存在数据竞争
var m = make(map[string]int)
// 获取 map 值
func get(key string) int {
    return m[key]
}
func set(key string,value int) {
    m[key] = value
}
func main() {
    // 定义计时器
    sw := sync.WaitGroup{
     }
    for i:=0;i<20;i++ {
     	// i 小点就不会报错
        sw.Add(1)
        // 匿名函数
        go func(n int) {
            key := strconv.Itoa(n)	// 整型转字符串
            set(key,n)				// 设置 map 元素
            fmt.Printf("K:%s;V:%v\n",key,get(key))	// 输出 map 元素
            sw.Done()
        }(i)	// (i) 相当于传入 i 值，调用匿名函数
    }
    sw.Wait()
}
/*
fatal error: concurrent map writes
goroutine 16 [running]:
runtime.throw(0xb0fbe6, 0x15)
......
*/
```

[golang 匿名函数func(){}() 最后括号是干啥的？](https://blog.csdn.net/qq_38374562/article/details/124087021)

针对于这种场景，就需要给 map 加锁保证并发安全，Go 中提供了一种开箱即用的安全map。就是 sync.Map，开箱即用无需像内置 map 需要初始化，直接就可以使用。内部定义了，Store，Load，LoadOrStore，Delete，Range 等操作方法。

```java
package main
import (
	"fmt"
	"strconv"
	"sync"
)
// sync.Map
// 全局变量，存在数据竞争
var m = sync.Map{
     }
func main() {
	// 定义计时器
	sw := sync.WaitGroup{
     }
	for i:=0;i<20;i++ {
		sw.Add(1)
		go func(n int) {
			key := strconv.Itoa(n)
			m.Store(key,n)
			value,_ := m.Load(key)
			fmt.Printf("K:%s;V:%v\n",key,value)
			sw.Done()
		}(i)
	}
	sw.Wait()
}
/*
K:3;V:3
K:19;V:19
K:2;V:2
K:9;V:9
K:5;V:5
K:6;V:6
K:1;V:1
K:7;V:7
K:17;V:17
K:13;V:13
K:14;V:14
K:15;V:15
K:10;V:10
K:11;V:11
K:12;V:12
K:18;V:18
K:4;V:4
K:0;V:0
K:16;V:16
K:8;V:8
 */
```

### (5) 定时器

`指定间隔时间执行任务`

```java
package main
import (
	"fmt"
	"time"
)
// 定时器
func tickDemo() {
    ticker := time.Tick(time.Second)	// 定义 1 秒间隔定时器
    for i := range ticker {
        fmt.Println(i)	// 每秒都会执行任务
    }
}
func main() {
    tickDemo()
}
/*
2022-04-27 17:48:27.6666264 +0800 CST m=+1.004846901
2022-04-27 17:48:28.6741073 +0800 CST m=+2.012327801
2022-04-27 17:48:29.6662648 +0800 CST m=+3.004485301
......
*/
```

/images/
