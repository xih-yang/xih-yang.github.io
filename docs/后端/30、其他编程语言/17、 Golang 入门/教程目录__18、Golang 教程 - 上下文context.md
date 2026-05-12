# 18、Golang 教程 - 上下文context
- 来源：https://ddkk.com/zhuanlan/other/golang/3/18.html
- 分类：其他语言
- 分组：教程目录
## 背景

在`Go http`包的`Server`中，每一个请求在都有一个对应的 `goroutine`去处理。请求处理函数通常会启动额外的`goroutine`用来访问后端服务，比如数据库和RPC服务。一个上游服务通常需要访问多个下游服务，比如终端用户的身份认证信息、验证相关的token、请求的截止时间。 **当一个请求被取消或超时时，所有用来处理该请求的 goroutine 都应该迅速退出，然后系统才能释放这些 goroutine 占用的资源。**

### 传统方案一：使用sync.WaitGroup

问题：只有**所有的goroutine都结束了才算结束**，只要有一个goroutine没有结束， 那么就会一直等，这显然**对资源的释放是缓慢的**

```java
var wg sync.WaitGroup
func run(task string) {
    fmt.Println(task, "start。。。")
    time.Sleep(time.Second * 2)
    // 每个goroutine运行完毕后就释放等待组的计数器
    wg.Done()
}
func main() {
    wg.Add(2)			// 需要开启几个goroutine就给等待组的计数器赋值为多少，这里为2
    for i := 1; i < 3; i++ {
        taskName := "task" + strconv.Itoa(i)
				go run(taskName)
    }
    // 等待，等待所有的任务都释放 等待组计数器值为 0
    wg.Wait()
    fmt.Println("所有任务结束。。。")
}
/*
  -----------------------运行结果----------------------------
				task2 start。。。
				task1 start。。。
				所有任务结束。。。
*/
```

- 上面例子中，**一个任务结束了必须等待另外一个任务也结束了才算全部结束了**，先完成的必须等待其他未完成的，所有的goroutine都要全部完成才OK。
- 等待组比较适用于好多个goroutine协同做一件事情的时候，因为每个goroutine做的都是这件事情的一部分，只有全部的goroutine都完成，这件事情才算完成；
- 缺点：实际生产中，需要我们主动的通知某一个goroutine结束。eg我们可以设置全局变量，在我们需要通知goroutine要停止的时候，我们为全局变量赋值，但是这样我们必须保证线程安全，不可避免的我们要为全局变量加锁，在便利性及性能上稍显不足

### 传统方案二：使用Channel+select

通过在main goroutine中像chan中发送关闭停止指令，并配合select，从而达到关闭goroutine的目的，这种方式显然比等待组优雅的多，但**是在goroutine中在嵌套goroutine的情况就变得异常复杂。**

```java
func main() {
    stop := make(chan bool)
    // 开启goroutine
    go func() {
        for {
            select {
            case <- stop:
                fmt.Println("任务1 结束了。。。")
                return 
            default:
                fmt.Println(" 任务1 正在运行中。")
                time.Sleep(time.Second * 2)
            }
        }
    }()
    // 运行10s后停止
    time.Sleep(time.Second * 10)
    fmt.Println("需要停止任务1。。。")
  	stop <- true
    time.Sleep(time.Second * 1)
}
/*
		------------------执行结果---------------------------------
				任务1 正在运行中...
				任务1 正在运行中...
				任务1 正在运行中...
				任务1 正在运行中...
				任务1 正在运行中...
				任务1 正在运行中...
				需要停止任务1...
				任务1 结束了...
*/
```

- 劣势：如果有很多 goroutine 都需要控制结束和如果这些 goroutine 又衍生了其它更多的goroutine比较麻烦。

## context

- context是GO1.7版本加入的一个标准库，它定义了Context类型，**专门用来简化对于处理单个请求的多个goroutine之间与请求域的数据、取消信号、截止时间等相关操作.**
- 使用方式：对服务器传入的请求应该创建上下文，而对服务器的传出调用应该接收上下文。它们之间的函数调用链必须传递上下文，或者可以使用WithCancel、WithDeadline、WithTimeout或WithValue创建的派生上下文。**当一个上下文被取消时，它派生的所有上下文也被取消。**
- 当一个goroutine在衍生一个goroutine时，context可以跟踪到子goroutine，从而达到控制他们的目的；

```java
func main (){
 // context.Background() 返回一个空的 Context，这个空的 Context 一般用于整个 Context 树的根节点。
 // context.WithCancel(parent): 创建一个可取消的子 Context，然后当作参数传给 goroutine 使用，这样就可以使用这个子 Context 跟踪这个 goroutine。
 ctx,cancel:=context.WithCancel(context.Background())
  // 开始goroutine ,传入ctx
  	go func (ctx context.Context) {
		  for {
			   select {
			   case <- ctx.Done():
				   fmt.Println("任务1 结束了....")
				   return
			   default:
				   fmt.Println("任务1 正在运行中.....")
				   time.Sleep(time.Second *2)
			   }
		  }
	  }(ctx)
	  //运行10s后停止
	  time.Sleep(time.Second*10)
	  fmt.Println("需要停止任务1....")
	  // 使用context 的cancel 函数停止goroutine
	  cancel()
	// 为了检测监控过是否停止，如果没有监控输出，就表示停止了
	   time.Sleep(time.Second*4)
}
```

- 使用select 调用`<-ctx.Done()判断是否要结束，如果接收到值的话，表示结束
- 发送结束指令：cancel 函数（ CancelFunc 类型），它是我们调用context.WithCancel(parent) 函数生成子 Context 的时候返回的。我们调用它就可以发出取消指令，然后我们的监控 goroutine 就会收到信号，就会返回结束。

### 多个goroutine情况

```java
// 使用context控制多个goroutine
func watch(ctx context.Context, name string) {
    for {
        select {
        case <- ctx.Done():
            fmt.Println(name, "退出 ，停止了。。。")
            return
        default:
            fmt.Println(name, "运行中。。。")
            time.Sleep(2 * time.Second)
        }
    }
}
func main() {
    ctx, cancel := context.WithCancel(context.Background())
    go watch(ctx, "【任务1】")
    go watch(ctx, "【任务2】")
    go watch(ctx, "【任务3】")
    time.Sleep(time.Second * 10)
    fmt.Println("通知任务停止。。。。")
    // 当我们使用 cancel 函数通知取消时，这 3 个 goroutine 都会被结束
    cancel() // 结束任务1 2 3 全部
    time.Sleep(time.Second * 5)
    fmt.Println("真的停止了。。。")
}
///
// 使用channel控制多个goroutine
func watch(c chan bool, name string) {
	for {
		select {
		case <-c:
			fmt.Println(name, "退出 ，停止了。。。")
			return
		default:
			fmt.Println(name, "运行中。。。")
			time.Sleep(2 * time.Second)
		}
	}
}
func main() {
	c := make(chan bool)
	go watch(c, "【任务1】")
	go watch(c, "【任务2】")
	go watch(c, "【任务3】")
	time.Sleep(time.Second * 10)
	fmt.Println("通知任务停止。。。。")
	c <- true // 结束任务1 2 3中的某一个
	time.Sleep(time.Second * 5)
	fmt.Println("真的停止了。。。")
}
```

上面例子中，启动了 3 个监控 `goroutine`进行不断的运行任务，每一个都使用了`Context`进行跟踪，**当我们使用cancel函数通知取消时，这 3 个 goroutine 都会被结束**。`canel`之后，所有基于这个`Context`或者衍生的子`Context`都会收到通知，这时就可以进行清理操作了，最终释放 goroutine，这就优雅的解决了 goroutine 启动后不可控的问题。

## context接口

```java
type Context interface {
	// 获取设置的截止时间:
	// 第一个返回值是截止时间，到了这个时间点，Context 会自动发起取消请求；
	//第二个返回值 ok==false 时表示没有设置截止时间，如果需要取消的话，需要调用取消函数进行取消
      Deadline() (deadline time.Time, ok bool)
      // 该方法返回一个只读的 chan，类型为 struct{}，如果该方法返回的 chan 可以读取，则意味着parent context已经发起了取消请求，我们通过 Done 方法收到这个信号后，就应该做清理操作，然后退出 goroutine，释放资源。
      Done() <- chan struct {
     }    
      // 返回取消的错误原因，因为什么 Context 被取消。
      Err() error 
      // 获取该 Context 上绑定的值，是一个键值对，所以要通过一个 Key 才可以获取对应的值，这个值一般是线程安全的。
      Value(key interface{
     }) interface{
     }
}
```

- Done:如果 Context取消的时候，我们就可以得到一个关闭的 chan，关闭的chan是可以读取的，所以只要可以读取的时候，就意味着收到 Context取消的信号了。

```java
    func  Stream (ctx context.Context, out chan <- Value)error {
        for {
            v,err:=DoSomethine(ctx)
            if err !=nil {
                return err
            }
            select {
                case <-ctx.Done():
                return ctx.Err()
                case out <- v:
            }
        }
    }
```

Go帮我们实现了2个`Context`接口,我们代码中最开始都是以这两个内置的作为最顶层的`partent context`，衍生出更多的`子Context`。

```java
    var (
        background = new(emptyCtx)
        todo       = new(emptyCtx)
    )
    func Background() Context {
        return background
    }
    func TODO() Context {
        return todo
    }
/
	type emptyCtx int
    func (*emptyCtx) Deadline() (deadline time.Time, ok bool) {
        return
    }
    func (*emptyCtx) Done() <-chan struct{
     } {
        return nil
    }
    func (*emptyCtx) Err() error {
        return nil
    }
    func (*emptyCtx) Value(key interface{
     }) interface{
     } {
        return nil
    }
```

- Background()主要用于main 函数、初始化以及测试代码中，作为 Context这个树结构的最顶层的 Context，也就是根Context。
- TODO()，它目前还不知道具体的使用场景…
- 它们两个本质上都是 emptyCtx结构体类型，**是一个不可取消，没有设置截止时间，没有携带任何值的Context。**

## Context的继承衍生

`context` 包为我们提供的 `With 系列的函数`,可以让我们在原来的`Context`上衍生出`子Context`。

```java
//返回子 Context，以及一个取消函数用来取消 Context。
func WithCancel(parent Context) (ctx Context, cancel CancelFunc) 
//传入截止时间参数，意味着到了这个时间点，会自动取消 Context，也可以不等到这个时候，可以提前通过取消函数进行取消。
func WithDeadline(parent Context, deadline time.Time) (Context, CancelFunc)
//传入一个时间参数，多少时间之后取消Context，当然我们也可以不等到这个时候，可以提前通过取消函数进行取消。 
func WithTimeout(parent Context, timeout time.Duration) (Context, CancelFunc) 
//生成一个绑定了一个键值对数据的 Context，即给context设置值，这个绑定的数据可以通过 Context.Value 方法访问到.
func WithValue(parent Context, key, val interface{
     }) Context
```

- CancelFunc func(),该函数可以取消一个Context，**以及这个节点 Context下所有的所有的 Context，不管有多少层级。**
- context.WithValue方法附加一对 K-V 的键值对，这里 Key 必须是等价性的，也就是具有可比性；Value值要是线程安全的。在使用值的时候，可以通过 Value方法读取: ctx.Value(key)。使用WithValue 传值，**一般是必须的值，不要什么值都传递。**

### Context最佳实战

- 不要把 Context 放在结构体中，要以参数的方式传递
- 以 Context 作为参数的函数方法，应该把 Context 作为第一个参数，放在第一位
- 给一个函数方法传递 Context 的时候，不要传递 nil，如果不知道传递什么，就使用 context.TODO
- Context 的 Value 相关方法应该传递必须的数据，不要什么数据都使用这个传递
- Context 是线程安全的，可以放心的在多个 goroutine 中传递

[参考](https://github.com/webtao520/golang_project/blob/master/%E4%B8%BA%E4%BB%80%E4%B9%88%E9%9C%80%E8%A6%81context%E5%8C%85/context.md)
