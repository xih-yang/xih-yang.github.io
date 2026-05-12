# 04、Resilience4j源码解析-CircuitBreaker模块之有限状态机
- 来源：https://ddkk.com/zhuanlan/guarantee/resilience4j/17.html
- 分类：服务保障
- 分组：Resilience4j 源码解析（B）
**CircuitBreakerState（熔断器状态）**

从Resilience4j的logo就可以看出有限状态机的设计理念在Resilience4j项目中是多么重要。 图中的实心圆表示关闭状态，半心圆表示半开状态和空心圆表示打开状态。

**1)，熔断器的有限状态机**

CircuitBreaker的状态转换通过一个有限状态机来实现的，有3种常用状态： 关闭(CLOSED)、打开(OPEN)、半开(HALF_OPEN)和2种特定状态：不可用(DISABLED)、强制打开(FORCE_OPEN)。

状态转换关系如图：

**CLOSED ==> OPEN：**单向转换。当请求失败率超过阈值时，熔断器的状态由关闭状态转换到打开状态。失败率的阈值默认50%，可以通过设置CircuitBreakerConfig实例的failureRateThreshold属性值进行改变。

**OPEN  HALF_OPEN：**双向转换。打开状态的持续时间结束，熔断器的状态由打开状态转换到半开状态。这时允许一定数量的请求通过，当这些请求的失败率超过阈值，熔断器的状态由半开状态转换回打开状态。半开时请求的数量是由CircuitBreakerConfig实例的ringBufferSizeInHalfOpenState属性值设置的。

**HALF_OPEN ==> CLOSED：**如果请求失败率小于阈值，则熔断器的状态由半开状态转换到关闭状态。

DISABLED和FORCE_OPEN这2种状态仅仅是表示退出上面3种状态时的临界状态标识，这2种状态不会被记录到统计指标中，也不会发送状态转换事件。关于统计指标和事件会在后面的文章中讲解。

配置属性值都有哪些以及其默认值，请看上一篇文章《Resilience4j源码解析-2.2 CircuitBreaker模块之配置》

**2)，状态的实现**

下面我们看看Resilience4j是如何实现有限状态机的。将状态机的5种状态封装成5个对应的类，把这些状态的公共属性及公共行为抽象出来封装成抽象类CircuitBreakerState。如图：

这些状态类都需要一个状态机属性CircuitBreakerStateMachine，用来驱动状态之间的转换。

CircuitBreakerState的公共属性：

//有限状态机实例，内部实现了状态转换机制

CircuitBreakerStateMachine stateMachine;

CircuitBreakerState的公共方法：

1，关闭状态源码：

//关闭状态的度量指标

private final CircuitBreakerMetrics circuitBreakerMetrics;

//请求调用的失败率阈值

private final float failureRateThreshold;

2，打开状态源码：

//打开状态的持续时间，在配置类CircuitBreakerConfig的实例中已设置

private final Instant retryAfterWaitDuration;

//打开状态的度量指标

private final CircuitBreakerMetrics circuitBreakerMetrics;

3，半开状态源码：

//半开状态的度量指标

private CircuitBreakerMetrics circuitBreakerMetrics;

//请求调用的失败率阈值，在配置类CircuitBreakerConfig的实例中已设置

private final float failureRateThreshold;

半开状态的逻辑与关闭状态的逻辑基本一样，只有checkFailureRate方法有变化

至此，状态相关的类分析完了，下一篇文章我们看看有限状态机是如何驱动状态之间的转换。

下一篇文章《Resilience4j源码解析-2.3.2 CircuitBreaker模块之有限状态机》讲解熔断器的核心理念-有限状态机，及状态转换部分。

**源码的中文注释地址：**

[https://github.com/Justin02180218/resilience4j](https://github.com/Justin02180218/resilience4j)
