# 2、Hystrix 基本配置项
- 来源：https://ddkk.com/zhuanlan/guarantee/hystrix/9.html
- 分类：服务保障
- 分组：Hystrix 之 使用教程（B）
## 配置HystrixCommand

**HystxixCommand支持如下的配置：**

**GroupKey**：该命令属于哪一个组，可以帮助我们更好的组织命令。

**CommandKey**：该命令的名称

**ThreadPoolKey**：该命令所属线程池的名称，同样配置的命令会共享同一线程池，若不配置，会默认使用GroupKey作为线程池名称。

**CommandProperties**：该命令的一些设置，包括断路器的配置，隔离策略，降级设置，以及一些监控指标等。

**ThreadPoolProerties**：关于线程池的配置，包括线程池大小，排队队列的大小等。

_
_
Command配置源码在HystrixCommandProperties,构造Command时通过Setter进行配置

## 具体配置解释和默认值如下：

```java
//使用命令调用隔离方式,默认:采用线程隔离,ExecutionIsolationStrategy.THREAD  
private final HystrixProperty<ExecutionIsolationStrategy> executionIsolationStrategy;   
//使用线程隔离时，调用超时时间，默认:1秒  
private final HystrixProperty<Integer> executionIsolationThreadTimeoutInMilliseconds;   
//线程池的key,用于决定命令在哪个线程池执行  
private final HystrixProperty<String> executionIsolationThreadPoolKeyOverride;   
//使用信号量隔离时，命令调用最大的并发数,默认:10  
private final HystrixProperty<Integer> executionIsolationSemaphoreMaxConcurrentRequests;  
//使用信号量隔离时，命令fallback(降级)调用最大的并发数,默认:10  
private final HystrixProperty<Integer> fallbackIsolationSemaphoreMaxConcurrentRequests;   
//是否开启fallback降级策略 默认:true   
private final HystrixProperty<Boolean> fallbackEnabled;   
// 使用线程隔离时，是否对命令执行超时的线程调用中断（Thread.interrupt()）操作.默认:true  
private final HystrixProperty<Boolean> executionIsolationThreadInterruptOnTimeout;   
// 统计滚动的时间窗口,默认:5000毫秒circuitBreakerSleepWindowInMilliseconds  
private final HystrixProperty<Integer> metricsRollingStatisticalWindowInMilliseconds;  
// 统计窗口的Buckets的数量,默认:10个,每秒一个Buckets统计  
private final HystrixProperty<Integer> metricsRollingStatisticalWindowBuckets; // number of buckets in the statisticalWindow  
//是否开启监控统计功能,默认:true  
private final HystrixProperty<Boolean> metricsRollingPercentileEnabled;   
// 是否开启请求日志,默认:true  
private final HystrixProperty<Boolean> requestLogEnabled;   
//是否开启请求缓存,默认:true  
private final HystrixProperty<Boolean> requestCacheEnabled; // Whether request caching is enabled.  
```

## 熔断器（Circuit Breaker）配置

Circuit Breaker配置源码在HystrixCommandProperties,构造Command时通过Setter进行配置,每种依赖使用一个Circuit Breaker

```java
// 熔断器在整个统计时间内是否开启的阀值，默认20秒。也就是10秒钟内至少请求20次，熔断器才发挥起作用  
private final HystrixProperty<Integer> circuitBreakerRequestVolumeThreshold;   
//熔断器默认工作时间,默认:5秒.熔断器中断请求5秒后会进入半打开状态,放部分流量过去重试  
private final HystrixProperty<Integer> circuitBreakerSleepWindowInMilliseconds;   
//是否启用熔断器,默认true. 启动  
private final HystrixProperty<Boolean> circuitBreakerEnabled;   
//默认:50%。当出错率超过50%后熔断器启动.  
private final HystrixProperty<Integer> circuitBreakerErrorThresholdPercentage;  
//是否强制开启熔断器阻断所有请求,默认:false,不开启  
private final HystrixProperty<Boolean> circuitBreakerForceOpen;   
//是否允许熔断器忽略错误,默认false, 不开启  
private final HystrixProperty<Boolean> circuitBreakerForceClosed;
```

## 命令合并(Collapser)配置

Command配置源码在HystrixCollapserProperties,构造Collapser时通过Setter进行配置

```java
//请求合并是允许的最大请求数,默认: Integer.MAX_VALUE  
private final HystrixProperty<Integer> maxRequestsInBatch;  
//批处理过程中每个命令延迟的时间,默认:10毫秒  
private final HystrixProperty<Integer> timerDelayInMilliseconds;  
//批处理过程中是否开启请求缓存,默认:开启  
private final HystrixProperty<Boolean> requestCacheEnabled;
```

## 线程池(ThreadPool)配置

```java
/** 
配置线程池大小,默认值10个. 
建议值:请求高峰时99.5%的平均响应时间 + 向上预留一些即可 
*/  
HystrixThreadPoolProperties.Setter().withCoreSize(int value)  
/** 
配置线程值等待队列长度,默认值:-1 
建议值:-1表示不等待直接拒绝,测试表明线程池使用直接决绝策略+ 合适大小的非回缩线程池效率最高.所以不建议修改此值。 
当使用非回缩线程池时，queueSizeRejectionThreshold,keepAliveTimeMinutes 参数无效 
*/  
HystrixThreadPoolProperties.Setter().withMaxQueueSize(int value) 
```

参考文献：http://hot66hot.iteye.com/blog/2155036
