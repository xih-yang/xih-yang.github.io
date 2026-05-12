# 12、Golang 教程 - channel
- 来源：https://ddkk.com/zhuanlan/other/golang/3/12.html
- 分类：其他语言
- 分组：教程目录
## channel

- 不要通过共享内存来通信，要通过通信来共享内存
- channel是用来协程通信的
- 错误做法

```java
package main
import "fmt"
func chanDemo() {
	//	var c chan int // chan  通道里面是int类型  c == nil
	c := make(chan int) // 这里定义没有缓存，所以接收到一个他就会阻塞的到这个值被取走
	c <- 1 // 把 1 送到c中
	c <- 2
	c <- 3
	n:= <-c
	//fatal error: all goroutines are asleep - deadlock!
	//这样因为没人其他的协程接这个通道的数据 所以报错 死锁
	fmt.Println(n)
}
func main() {
	chanDemo()
}
```

- 开一个协程接收数据

```java
func chanDemo() {
	c := make(chan int)
	go func() {
		for {
			n := <-c
			fmt.Println(n)
			//1
			//2
			//3
		}
	}()
	c <- 1 // 把 1 送到c中
	c <- 2
	c <- 3
	time.Sleep(time.Millisecond)
}
func main() {
	chanDemo()
}
// chan 作为参数
func worker(c chan int) {
	for {
		//n := <-c
		//fmt.Println(n)
		fmt.Printf("%c",<-c)
	}
}
func chanDemo() {
	var channels [10]chan int // 数组
	for i:=0;i<10;i++{
		channels[i] = make(chan int)
		go worker(channels[i])
	}
	for i:=0;i<10;i++{
		channels[i] <- 'a'+i
	}
	time.Sleep(time.Millisecond)
}
//func createWorker(id int) <-chan int { //这样写表示只用来发送数据 
func createWorker(id int) chan<- int {
      //这样写表示只用来接收数据 用于发送数据会报错
	c := make(chan int)
	go func() {
		for {
			fmt.Printf("worker %d receiver:%c\n", id, <-c)
		}
	}()
	return c
}
func chanDemo() {
	var channels [10]chan<- int // 数组
	for i := 0; i < 10; i++ {
		channels[i] = createWorker(i)
	}
	for i := 0; i < 10; i++ {
		channels[i] <- 'a' + i
	}
	time.Sleep(time.Millisecond)
}
/、
func bufferedChannel() {
	c := make(chan int, 3) //定义缓冲区
	//因为有大小为3的缓冲区 所以就算没有协程来接，传入数据不大于3个是不会报错的
	c <- 1
	c <- 2
	c <- 3
}
func main() {
	bufferedChannel()
	//chanDemo()
}
//
close(c) // 通道也可以关闭 通道关闭之后，另一边还是可以接收到数据，是这个类型的默认0值
	// 可以用两个数来接收 n, ok := <-c ok表示是否有值 然后用if ok 做判断
	// 也可以用for n:= range c 用range接收数据 等到c发完就跳出来
	// 如果c不close 会永远接收下去，等到main退出，他也就退出，chan可以不关闭
```

- channel
- buffered channel
- range
- 发送数据c`<-1
- 接收数据n:=`<-c
- chan`<-int只能发数据给channel`<-chan int只能从channel接收数据
- close(c)：关闭channel，发送方一旦关闭channel，接收方一直能接收到数据，但是收到的是channel中具体类型的零值
- 只有发送方才能close channel，range会自动检查channel是否close
- 如果发送方没有使用close方法，接收方进入循环后会阻塞，也就是说，一个chan如果有close方法，那就是非阻塞的，没有则是阻塞的

## 使用Channel等待任务结束

### 方法一

```java
// done用于接收，这样来替换 	time.Sleep(time.Millisecond)
type workers struct {
	in   chan int
	done chan bool
}
func createWorker(id int, w workers) {
	go func() {
		for {
			fmt.Printf("worker %d receiver:%c\n", id, <-w.in)
			w.done <- true //打印完就送一个true给done
		}
	}()
}
func chanDemo() {
	var work [10]workers // 数组
	for i := 0; i < 10; i++ {
		work[i] = workers{
			in:   make(chan int),
			done: make(chan bool),
		}
		createWorker(i, work[i])
	}
	for i := 0; i < 10; i++ {
		work[i].in <- 'a' + i
		<- work[i].done // 如果done没有数据 这里会阻塞
	}
}
func main() {
	chanDemo()
}
```

缺点：顺序打印，不如不用

```java
worker 0 receiver:a
worker 1 receiver:b
worker 2 receiver:c
worker 3 receiver:d
worker 4 receiver:e
worker 5 receiver:f
worker 6 receiver:g
worker 7 receiver:h
worker 8 receiver:i
worker 9 receiver:j
```

- 解决方式

```java
func chanDemo() {
	var work [10]workers // 数组
	for i := 0; i < 10; i++ {
		work[i] = workers{
			in:   make(chan int),
			done: make(chan bool),
		}
		createWorker(i, work[i])
	}
	for i := 0; i < 10; i++ {
		work[i].in <- 'a' + i
	}
	for _, worker := range work {
		<-worker.done
	}
}
```

### 通过waitGroup等待

```java
type workers struct {
	in   chan int
	wg *sync.WaitGroup //指针才能使用同一个wg
}
func createWorker(id int, wg *sync.WaitGroup) workers{
	w := workers{
		in : make(chan int),
		wg : wg,
	}
	go func() {
		for {
			fmt.Printf("worker %d receiver:%c\n", id, <-w.in)
			wg.Done()
		}
	}()
	return w
}
func chanDemo() {
	var wg sync.WaitGroup
	wg.Add(20) //20个任务
	var work [10]workers // 数组
	for i := 0; i < 10; i++ {
		work[i] = createWorker(i, &wg) //所有的要用同一个wg 所以传指针
	}
	for i := 0; i < 10; i++ {
		work[i].in <- 'a' + i
	}
	for i := 0; i < 10; i++ {
		work[i].in <- 'A' + i
	}
	wg.Wait() //等待20个任务完成再往下执行
}
func main() {
	chanDemo()
}
```

## 使用Select来进行调度

```java
func main() {
	var c1, c2 chan int // nil 
	select {
      //哪一个条件满足就走哪个条件
	case n := <-c1:
		fmt.Println("received from c1:", n)
	case n := <-c2:
		fmt.Println("received from c2:", n)
	default:
		fmt.Println("no value") //这里 
	}
}
/
func generator() chan int {
	c := make(chan int)
	i := 0
	go func() {
		for {
			time.Sleep(time.Millisecond * time.Duration(rand.Intn(1500)))
			c <- i
			i++
		}
	}()
	return c
}
func main() {
	var c1, c2  = generator(), generator()
	for  {
	select {
      //哪一个条件满足就走哪个条件
	case n := <-c1:
		fmt.Println("received from c1:", n)
	case n := <-c2:
		fmt.Println("received from c2:", n)
	}
	}
}
//
func main() {
	var c1, c2 = generator(), generator()
	w := createWorker(0)
	var n int
	for {
		select {
      //哪一个条件满足就走哪个条件
		case n = <-c1:
			fmt.Println("received from c1:", n)
		case n = <-c2:
			fmt.Println("received from c2:", n)
		case w <- n: //也可以发 但是因为w不是nil 如果n没有值他会输出零值 这里就会无限循环走这个逻辑
		}
	}
}
///解决办法利用chan的nil值
func createWorker(id int) chan int {
	w := make(chan int)
	go func() {
		for {
			fmt.Printf("worker %d receiver:%d\n", id, <-w)
		}
	}()
	return w
}
func generator() chan int {
	c := make(chan int)
	i := 0
	go func() {
		for {
			time.Sleep(time.Millisecond * time.Duration(rand.Intn(1500)))
			c <- i
			i++
		}
	}()
	return c
}
func main() {
	var c1, c2 = generator(), generator()
	w := createWorker(0)
	var n int
	hasValue := false
	for {
		var activeWork chan int
		if hasValue {
			activeWork = w
		}
		select {
      //哪一个条件满足就走哪个条件
		case n = <-c1:
			hasValue = true
			fmt.Println("received from c1:", n)
		case n = <-c2:
			hasValue = true
			fmt.Println("received from c2:", n)
		case activeWork <- n: //这样的话如果hasValue为false 这里activeWork为nil这样就会被阻塞住
			hasValue = false // 但是这样数据会丢失因为接收和发送的速度不匹配，可以弄一个队列然后存到队列中去 然后hasValue的判断规则为队列长度是否大于0
		}
	}
}
//
func main() {
	var c1, c2 = generator(), generator()
	w := createWorker(0)
	var n int
	var values []int
	for {
		var activeWork chan int
		if len(values) > 0 {
			activeWork = w
		}
		select {
      //哪一个条件满足就走哪个条件
		case n = <-c1:
			values = append(values, n)
			fmt.Println("received from c1:", n)
		case n = <-c2:
			values = append(values, n)
			fmt.Println("received from c2:", n)
		case activeWork <- n: 
			values = values[1:] //弄一个队列然后存到队列中去 然后hasValue的判断规则为队列长度是否大于0
		}
	}
}
```

### 计时器的使用

```java
func main() {
	var c1, c2 = generator(), generator()
	w := createWorker(0)
	var n int
	var values []int
	tm := time.After(10 * time.Second) //10s过后，会往tm通道发送数据
	for {
		var activeWork chan int
		if len(values) > 0 {
			activeWork = w
		}
		select {
      //哪一个条件满足就走哪个条件
		case n = <-c1:
			values = append(values, n)
			fmt.Println("received from c1:", n)
		case n = <-c2:
			values = append(values, n)
			fmt.Println("received from c2:", n)
		case activeWork <- n:
			values = values[1:] //弄一个队列然后存到队列中去 然后hasValue的判断规则为队列长度是否大于0
		case <-tm:
			fmt.Println("bye") //10s过后bye
			return
		}
	}
}
```

- Select的使用
- 定时器的使用
- 在Select中使用nil channel

## 传统的同步机制(尽量少用)

- waitGroup
- mutex
- Cond

```java
type atomicInt struct {
	value int
	lock sync.Mutex
}
func (a *atomicInt) get() int{
	a.lock.Lock()
	defer a.lock.Unlock()
	return a.value
}
func (a *atomicInt) increment() {
	a.lock.Lock()
	defer a.lock.Unlock() //defer的正确用法
	a.value++
}
func main() {
	var a atomicInt
	a.increment()
	go func() {
		a.increment()
	}()
	time.Sleep(time.Millisecond)
	fmt.Println(a.get())
}
// 如果要在一段代码端同步，那就变成一个匿名函数就好了
func (a *atomicInt) increment() {
	func() {
		a.lock.Lock()
		defer a.lock.Unlock() //defer的正确用法
		//............
		a.value++
		//.........
	}()
}
```
