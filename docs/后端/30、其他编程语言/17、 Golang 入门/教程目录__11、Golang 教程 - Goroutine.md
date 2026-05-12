# 11、Golang 教程 - Goroutine
- 来源：https://ddkk.com/zhuanlan/other/golang/3/11.html
- 分类：其他语言
- 分组：教程目录
## Goroutine

- 协程，轻量级线程
- 非抢占式多任务处理，由协程主动交出控制权，go1.14版本之后，也支持抢占式切换，
- 在并发系统中，对goroutine的切换时机和运行结果就没有唯一的保证性。
- 在go语言中，我们采用channel来进行goroutine之间的通信，能更容易的保证结果的一致性
- 编译器/解释器/虚拟机/go语言（有自己的调度器）层面的多任务，不是系统的
- 多个协程可以在一个或多个线程上面运行
- go run -race xx.go -race查看是否有数据访问冲突

```java
//
func main() {
	for i := 0; i < 1000; i++ {
      // 开多个协程
		go func(i int) {
      // go 并发执行 //匿名函数的写法
			for {
				fmt.Printf("this is a goroutine %d\n", i)
			}
		}(i)
	}
	time.Sleep(time.Millisecond) // 如果不加这个 因为go开了协程 mian函数本身也是一个协程，如果main退出整个函数就退出了，程序中断
}
///
func main() {
	var a [10]int
	for i := 0; i < 10; i++ {
      // 开多个协程
		go func(i int) {
      // go 并发执行 //匿名函数的写法
			for {
				a[i]++
			}
		}(i)
	}
	time.Sleep(time.Millisecond) // 如果不加这个 因为go开了协程 mian函数本身也是一个协程，如果main退出整个函数就退出了，程序中断
	fmt.Println(a)//[0 0 2999523 0 2467447 1459920 0 0 0 4554991]
}
```

- go run -race ：检测冲突
- 下面的意思是某一个内存被写的时候刚好也被另一个协程读

```java
go run -race goroutine.go
==================
WARNING: DATA RACE
Read at 0x00c000138000 by main goroutine:
  main.main()
      /Users/xiao_xiaoxiao/go/src/learn2/goroutine/goroutine.go:18 +0xfb
Previous write at 0x00c000138000 by goroutine 7:
  main.main.func1()
      /Users/xiao_xiaoxiao/go/src/learn2/goroutine/goroutine.go:13 +0x68
Goroutine 7 (running) created at:
  main.main()
      /Users/xiao_xiaoxiao/go/src/learn2/goroutine/goroutine.go:11 +0xc3
==================
[11755340 5733960 10421739 12104071 7264193 14611763 1966171 6718099 11141482 2270786]
Found 1 data race(s)
exit status 66
```

- 子程序是协程的一个特例
- 调度器
- 普通函数是单向的数据操作，协程则是双向的数据流通，goroutine在进程开启多个协程，每个协程自己干自己的事情，他们之间可以通过管道进行通信，调度器可能会放到一个线程里面去执行
- 协程可能在任意一个线程里面

### goroutine的定义

- 任何函数只需加上go就能送给调度器运行
- 不需要在定义时区分是否是异步函数
- 调度器在合适的点进行切换
- 使用-race来检测数据访问冲突

### goroutine可能的切换点

- I/O,select
- channel
- 等待锁
- 函数调用
- runtime.Gosched()

不能保证一定在这些点切换，也不能保证在其他的点不切换

- go语言调度器开的线程数一般不会超过机器的CPU核数
