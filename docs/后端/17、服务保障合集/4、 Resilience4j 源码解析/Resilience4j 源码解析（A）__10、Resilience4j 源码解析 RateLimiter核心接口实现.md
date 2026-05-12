# 10、Resilience4j 源码解析 RateLimiter核心接口实现
- 来源：https://ddkk.com/zhuanlan/guarantee/resilience4j/10.html
- 分类：服务保障
- 分组：Resilience4j 源码解析（A）
## 核心流程图

通过下列流程图(简化)可看出，限流处理策略即将每次请求根据限流配置判断是否触发限流，当校验时线程中断，则抛出IllegalStateException，当触发限流时，抛出RequestNotPermitted异常，本次请求均会终止调用。否则，本次请求继续正常调用。

## RateLimiterConfig

> 限流器核心配置。 比如timeoutDuration：1s，limitRefreshPeriod：3s，limitForPeriod：1000. 表示从应用启动后，每三秒至多允许1000个请求，获取授权操作最多可等待1s，超过1000请求，会抛出RequestNotPermitted异常，需等待下一个3s周期，重新刷新1000个授权。

```java
private final Duration timeoutDuration;//获取授权操作的超时时间。 默认：5秒
private final Duration limitRefreshPeriod;//限流周期时长。       默认：500纳秒
private final int limitForPeriod;//周期内允许通过的请求数量。      默认：50
```

限流算法：

**令牌桶算法**

生成令牌速度固定，而请求去拿令牌是没有速度限制的。当面对瞬时大流量，令牌可能短时间被消耗而空，而在生成新的令牌前，后续流量会被拒绝。

举个例子：xx车次，12306每个小时放100张票，14点刚放出100张，大家都去抢票，100张抢完了，其余人就买不到票，想买票只能等15点的100张票。如此反复。

**漏桶算法**

水先进到漏桶里，漏桶以一定的速度出水，当入水速度大于出水速度，且速度过大时，桶里的水溢出。

通俗理解就是

**RateLimiter最核心处是：获取permission。RateLimiter::getPermission，支持AtomicRateLimiter（令桶算法）和SemaphoreBasedRateLimiter（信号量机制）。默认使用AtomicRateLimiter（令桶算法）**

## AtomicRateLimiter

> 令桶算法

**成员变量**

```java
// 限流器启动时系统时间(纳秒)
private static final long nanoTimeStart = nanoTime();
// 限流器名称
private final String name;
// 等待线程数
private final AtomicInteger waitingThreads;
// 限流器状态
private final AtomicReference<State> state;
// 事件处理器
private final RateLimiterEventProcessor eventProcessor;
```

**getPermission**

**calculateNextState**

**waitForPermissionIfNecessary**

## SemaphoreBasedRateLimiter

> 信号量机制
>
> 成员变量

```java
//限流器名称
private final String name;
//限流器配置
private final AtomicReference<RateLimiterConfig> rateLimiterConfig;
//定时任务池，通过该scheduler去刷新信号量
private final ScheduledExecutorService scheduler;
//信号量
private final Semaphore semaphore;
//度量指标
private final SemaphoreBasedRateLimiterMetrics metrics;
//事件处理器
private final RateLimiterEventProcessor eventProcessor;
```

通过构造方法可看出，**SemaphoreBasedRateLimiter是通过ScheduledExecutorService去周期性的释放信号量，以刷新每个新周期的token。**

![ ][nbsp 7

**getPermission**

> 通过semaphore在规定时间内去获取信号量。

通过下图可看出，RateLimiter其实是以**limitRefreshPeriod**按纳秒单位切割JVM时间轴，每个周期允许tokean数为：**limitForPeriod**，tokean用完就park thread 等待下一个周期刷新的token。

事件订阅及消费和[CircuitBreaker](https://blog.csdn.net/a355586533/article/details/89238588)大体相同就不再介绍了。
