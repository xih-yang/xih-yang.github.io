# 01、Resilience4j 源码解析
- 来源：https://ddkk.com/zhuanlan/guarantee/resilience4j/1.html
- 分类：服务保障
- 分组：Resilience4j 源码解析（A）
[resilience4j-spring-boot2-demo github](https://github.com/SayNight/resilience4j-SpringBoot2-demo.git)

> demo下载后，直接运行WebApplication.java即可

demo演示resilience4j核心组件如何与spring-boot2结合使用，几个核心组件原理原理会在后续章节探讨。

## resilience4j

resilience4j 是一个轻量级的容错组件，其灵感来自于 Hystrix，但主要为 Java 8 和函 数式编程所设计。轻量级体现在其只用 Vavr 库（前身是 Javaslang），没有任何外部依 赖。而 Hystrix 依赖了 Archaius ，Archaius 本身又依赖很多第三方包，例如 Guava、 Apache Commons Configuration 等。

**同类功能对比**

## 核心功能

Core modules:

resilience4j-circuitbreaker: Circuit breaking （熔断器）

resilience4j-ratelimiter: Rate limiting （限流器）

resilience4j-bulkhead: Bulkheading （隔离器）

resilience4j-retry: Automatic retrying (sync and async)（重试、同步&异步）

resilience4j-cache: Response caching （缓存）

resilience4j-timelimiter: Timeout handling （超时处理）

## CircuitBreaker 核心配置

```java
/*CircuitBreakerConfiguration支持以下所有配置*/
Duration waitDurationInOpenState;// CircuitBreaker在切换到半开之前应保持打开的等待时间，通俗可理解成熔断开启后，熔断由开启切换到半开的等待时长，Default value is 60 seconds
Integer failureRateThreshold;//故障率阈值百分比，超过该阈值，CircuitBreaker应该跳闸并开始short-circuiting calls，阈值必须大于0且不大于100, Default value is 50 percentage
Integer ringBufferSizeInClosedState;//当CircuitBreaker关闭时，环形缓冲区的大小， 若设置10，则调用9次失败都不会触发熔断, 最小为1, Default size is 100
Integer ringBufferSizeInHalfOpenState;//当CircuitBreaker半开时，环形缓冲区的大小， 若设置10，则调用9次失败都不会触发熔断, 最小为1, Default size is 10
Class<Predicate<Throwable>> recordFailurePredicate;//通过Predicate判断异常是否应该被记为失败调用且增加失败率，默认all exception
Class<? extends Throwable>[] recordExceptions;//配置异常列表，出现列表中异常被记为失败调用且增加失败率
Class<? extends Throwable>[] ignoreExceptions;//配置可忽略异常列表，出现列表中异常不会被记为失败调用且不增加失败率
Boolean  automaticTransitionFromOpenToHalfOpenEnabled;//当过了waitDurationInOpenState时长，支持熔断器由OPEN换到HALF_OPEN状态
 /*CircuitBreakerConfig支持以上所有配置，下面两个不支持*/
Integer  eventConsumerBufferSize;//CircularEventConsumer 消费CircuitBreakerEvent Default size is 100
Boolean registerHealthIndicator;//开启健康检查
```

## demo url介绍

[http://localhost:8080/actuator](http://localhost:8080/actuator) 查看所有监控url

[http://localhost:8080/actuator/circuitbreakers](http://localhost:8080/actuator/circuitbreakers) 查询所有熔断器

[http://localhost:8080/actuator/circuitbreakerevents](http://localhost:8080/actuator/circuitbreakerevents) 查询最近100（默认）未被消费的熔断事件

[http://localhost:8080/actuator/circuitbreakerevents/{name}](http://localhost:8080/actuator/circuitbreakerevents/%7Bname%7D) 根据熔断器名称查询熔断事件

[http://localhost:8080/actuator/circuitbreakerevents/{name}/{eventType}](http://localhost:8080/actuator/circuitbreakerevents/%7Bname%7D/%7BeventType%7D) 根据熔断器名称及事件类型查询熔断事件
