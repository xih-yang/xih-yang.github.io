# 03、Resilience4j源码解析-CircuitBreaker模块之配置
- 来源：https://ddkk.com/zhuanlan/guarantee/resilience4j/16.html
- 分类：服务保障
- 分组：Resilience4j 源码解析（B）
**CircuitBreakerConfig（熔断器配置）**

CircuitBreakerConfig类中封装了与熔断器相关的配置属性，属性包括：请求调用失败的阈值、熔断器在打开状态时的持续时间、熔断器在半开状态下的Ring Buffer大小、熔断器在关闭状态下的Ring Buffer大小、是否记录请求调用失败的断言。Ring Buffer的原理在后面研究CircuitBreakerMetrics部分时再详细讲解，现在只需要了解，它是一个存储每次请求调用成功与否的环形缓存区。

另外CircuitBreakerConfig类通过Builder模式构造CircuitBreakerConfig实例及流式的设置配置属性值。

需主要关注的源码如下：

```java
public class CircuitBreakerConfig \{
//请求调用失败的阈值，百分比。默认是50%
public static final int DEFAULT\_MAX\_FAILURE\_THRESHOLD = 50; // Percentage
//熔断器在打开状态时的持续时间。默认是60秒
public static final int DEFAULT\_WAIT\_DURATION\_IN\_OPEN\_STATE = 60; // Seconds
//熔断器在半开状态下的ring buffer大小。默认10
public static final int DEFAULT\_RING\_BUFFER\_SIZE\_IN\_HALF\_OPEN\_STATE = 10;
//熔断器在关闭状态下的ring buffer大小。默认100
public static final int DEFAULT\_RING\_BUFFER\_SIZE\_IN\_CLOSED\_STATE = 100;
//是否记录请求调用失败的断言，默认所有异常都记录。
public static final Predicate<Throwable> DEFAULT\_RECORD\_FAILURE\_PREDICATE = (throwable) -> true;
......
/\*\* 构造者模式 \*/
public static class Builder \{
private Predicate<Throwable> recordFailurePredicate;
private Predicate<Throwable> errorRecordingPredicate;
//请求调用失败，存储异常记录的集合
private Class<? extends Throwable>\[\] recordExceptions = new Class\[0\];
//请求调用失败，忽略异常记录的集合
private Class<? extends Throwable>\[\] ignoreExceptions = new Class\[0\];
private float failureRateThreshold = DEFAULT\_MAX\_FAILURE\_THRESHOLD;
private int ringBufferSizeInHalfOpenState = DEFAULT\_RING\_BUFFER\_SIZE\_IN\_HALF\_OPEN\_STATE;
private int ringBufferSizeInClosedState = DEFAULT\_RING\_BUFFER\_SIZE\_IN\_CLOSED\_STATE;
private Duration waitDurationInOpenState = Duration.ofSeconds(DEFAULT\_WAIT\_DURATION\_IN\_OPEN\_STATE);
private boolean automaticTransitionFromOpenToHalfOpenEnabled = false;
/\*\* 构造CircuitBreakerConfig实例 \*/
public CircuitBreakerConfig build() \{
buildErrorRecordingPredicate();
CircuitBreakerConfig config = new CircuitBreakerConfig();
config.waitDurationInOpenState = waitDurationInOpenState;
config.failureRateThreshold = failureRateThreshold;
config.ringBufferSizeInClosedState = ringBufferSizeInClosedState;
config.ringBufferSizeInHalfOpenState = ringBufferSizeInHalfOpenState;
config.recordFailurePredicate = errorRecordingPredicate;
config.automaticTransitionFromOpenToHalfOpenEnabled = automaticTransitionFromOpenToHalfOpenEnabled;
return config;
\}
/\*\* 异常记录集合与异常忽略集合取交集，如果有值则为false，否则为true。\*/
private void buildErrorRecordingPredicate() \{
this.errorRecordingPredicate =
getRecordingPredicate()
.and(buildIgnoreExceptionsPredicate()
.orElse(DEFAULT\_RECORD\_FAILURE\_PREDICATE));
\}
......
\}
......
\}
```

下一篇文章《Resilience4j源码解析-2.3 CircuitBreaker模块之有限状态机》讲解熔断器的核心理念-有限状态机，及状态转换部分。

源码的中文注释地址：

[https://github.com/Justin02180218/resilience4j](https://github.com/Justin02180218/resilience4j)
