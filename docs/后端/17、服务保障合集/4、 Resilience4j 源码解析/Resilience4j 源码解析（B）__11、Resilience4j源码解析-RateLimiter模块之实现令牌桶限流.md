# 11、Resilience4j源码解析-RateLimiter模块之实现令牌桶限流
- 来源：https://ddkk.com/zhuanlan/guarantee/resilience4j/24.html
- 分类：服务保障
- 分组：Resilience4j 源码解析（B）
## 1、Resilience4j的限流器设计理念

当限流器启动时，以当前JVM启动时间为起点，JVM结束时间为终点，每经过一个固定时间段(cycle)，记录为一个周期，每个周期设置固定的可访问的次数(permissions)。当有线程请求访问时，首先计算经历到了那个周期，该周期的可访问次数是否大于零，如果大于零则允许请求调用；如果小于零，则等待、被拒绝或者进行降级处理。如图：

根据这种设计理念，Resilience4j的限流器实现了令牌桶限流和固定周期下的固定并发数限流，供不同的业务场景使用。令牌桶限流的好处是可以应对突发请求的流量。

## 2、限流器接口(RateLimiter)

****

RateLimiter有两个实现类AtomicRateLimiter和SemaphoreBasedRateLimiter，在RateLimiter接口中主要声明了创建具体限流器的一系列方法：

装饰业务方法的一系列函数：

以及获取或修改限流器属性的一系列方法：

我们在分析完AtomicRateLimiter和SemaphoreBasedRateLimiter后，再来详细研究RateLimiter接口。

## 3、令牌桶限流(AtomicRateLimiter)

AtomicRateLimiter类实现了令牌桶限流算法，先来看看它有哪些属性：

我们再来看一个重要的私有静态类：

我们可以把State中的属性对应到令牌桶的属性，activeCycle对应到令牌桶生成token的固定速度，activePermissions对应到令牌桶中的token。如图：

接下来我们来分析图中的相关方法。

**1，阻塞获取token**

当请求线程没有获取到token时，在请求超时的时间内阻塞当前线程，直到下个周期或者当前线程被中断。

同步获取token的方法：getPermission(...)

**第一步，状态计算及转换**

当一个请求线程尝试获取token时，会触发状态计算及转换，

计算获取下一个token所需等待的时间

生成新的状态

状态state声明为原子引用类型，所以状态之间的转换通过CAS进行原子转换。

**第二步，判断当前线程是否需要阻塞等待**

**2，非阻塞获取token**

reservePermission(...)

状态计算及转换的逻辑都是一样的，只是获取等待时间后返回给调用方，不阻塞等待，由调用方来处理是否降级还是拒绝请求。

这篇文章我们分析了Resilience4j的限流器是如何实现令牌桶限流的，下一篇文章《Resilience4j源码解析-3.2 RateLimiter模块之实现固定并发数限流》我们来分析Resilience4j的限流器是如何实现固定并发数限流的。

**源码的中文注释地址：**

[https://github.com/Justin02180218/resilience4j](https://github.com/Justin02180218/resilience4j)
