# 12、Resilience4j源码解析-RateLimiter模块之实现固定并发数限流
- 来源：https://ddkk.com/zhuanlan/guarantee/resilience4j/25.html
- 分类：服务保障
- 分组：Resilience4j 源码解析（B）
## 1、固定周期的固定并发数限流

固定并发数限流相对于令牌桶限流就简单多了。Resilience4j的限流器是通过java.util.concurrent.Semaphore 信号量的方式实现的。当请求线程获取到信号量时执行业务逻辑方法，如果获取不到信号量，则在超时时间内阻塞，等待信号量被释放。系统会启动一个线程按固定周期(cycle)，释放已经获取到信号量的线程。如图：

下面我们来看源码：

SemaphoreBasedRateLimiter使用ScheduledExecutorService线程池，在这个线程池中只启动一个线程按固定周期运行。

在周期内只做一件事，就是释放已经被获取的信号量。

获取信号量

## 2、限流器入口方法

以supplier的装饰方法为例，其他的装饰方法逻辑都一样。

## 3、Resilience4j的隔离模块

把隔离模块放在这儿，是因为它的实现原理与固定并发数限流很像，也是通过java.util.concurrent.Semaphore 信号量的方式实现的，只不过是没有一个Daemon线程按固定周期去释放信号量，而是在业务方法执行后释放信号量。代码在：

实现很简单，这里就不去详细研究了。

至此，Resilience4j的限流器模块的源码分析告一段落，接下来的系列文章会分析Resilience4j的重试模块。

**源码的中文注释地址：**

[https://github.com/Justin02180218/resilience4j](https://github.com/Justin02180218/resilience4j)
