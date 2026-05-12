# 4、Hystrix 应用介绍
- 来源：https://ddkk.com/zhuanlan/guarantee/hystrix/21.html
- 分类：服务保障
- 分组：Hystrix 之 使用教程（D）
前几章已经讲了hystrix的应用场景，以及如何使用，本章我们针对如何进行hystrix参数配置做一些分析

```java
//异步的执行
@HystrixCommand(groupKey = "testKey", commandKey = "testCommon", threadPoolKey = "getLiveVideoCoreThread", fallbackMethod = "getUserNameError",
        commandProperties = {
                @HystrixProperty(name = "execution.isolation.thread.timeoutInMilliseconds", value = "500"),//指定多久超时，单位毫秒。超时进fallback
                @HystrixProperty(name = "circuitBreaker.requestVolumeThreshold", value = "10"),//判断熔断的最少请求数，默认是10；只有在一个统计窗口内处理的请求数量达到这个阈值，才会进行熔断与否的判断
                @HystrixProperty(name = "circuitBreaker.errorThresholdPercentage", value = "10"),//判断熔断的阈值，默认值50，表示在一个统计窗口内有10%的请求处理失败，会触发熔断
                @HystrixProperty(name = "circuitBreaker.sleepWindowInMilliseconds", value = "3000"),//熔断多少秒后去尝试请求
        },
        threadPoolProperties = {
                @HystrixProperty(name = "coreSize", value = "20"),
                @HystrixProperty(name = "maxQueueSize", value = "50"),
                @HystrixProperty(name = "keepAliveTimeMinutes", value = "1"),
                @HystrixProperty(name = "queueSizeRejectionThreshold", value = "15"),
                @HystrixProperty(name = "metrics.rollingStats.numBuckets", value = "10"),
                @HystrixProperty(name = "metrics.rollingStats.timeInMilliseconds", value = "1000")})
public Future<String> getUserName(final Long id, String name) {
    return new AsyncResult<String>() {
        @Override
        public String invoke() {
                int i = 1/0;//此处抛异常,测试服务降级
                return "你好:" + id;
        }
    };
}
```

fallbackMethod : 触发熔断器时执行的方法

GroupKey：该命令属于哪一个组，可以帮助我们更好的组织命令

CommandKey：该命令的名称

threadPoolKey：该命令所属线程池的名称，同样配置的命令会共享同一线程池，若不配置，会默认使用GroupKey作为线程池名称

commandProperties 配置解析

execution.isolation.thread.timeoutInMilliseconds ： 指定多久超时，单位毫秒。超时进fallback

threadPoolProperties 配置解析

coreSize：配置核心线程池大小和线程池最大大小

maxQueueSize ： 配置线程池队列最大大小
