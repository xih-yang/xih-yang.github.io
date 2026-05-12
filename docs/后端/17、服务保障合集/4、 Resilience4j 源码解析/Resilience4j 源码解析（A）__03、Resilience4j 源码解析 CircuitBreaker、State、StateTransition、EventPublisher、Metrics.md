# 03、Resilience4j 源码解析 CircuitBreaker、State、StateTransition、EventPublisher、Metrics
- 来源：https://ddkk.com/zhuanlan/guarantee/resilience4j/3.html
- 分类：服务保障
- 分组：Resilience4j 源码解析（A）
## CircuitBreaker

> CircuitBreaker主要分为以下几个模块：熔断器配置，熔断器注册，熔断事件消费者注册，熔断器状态机，熔断器状态及指标，熔断器事件，熔断器事件处理器，熔断器事件消费者。

## 各模块间关系

- CircuitBreakerRegistry通过其实现类InMemoryCircuitBreakerRegistry根据CircuitBreakerConfig创建CircuitBreaker实例。
- EventConsumerRegistry通过其实现类DefaultEventConsumerRegistry创建EventConsumer事件消费者。
- CircuitBreaker通过其实现类CircuitBreakerStateMachine处理熔断状态，并发布CircuitBreakerEvent从而被注册到EventProcessor事件处理器的EventConsumer事件消费者消费。

## State

> 熔断状态，其数字表示序号，boolean类型表示是否允许发布CircuitBreakerEvent

```java
/** 熔断器不工作，没有状态变化、事件，允许所有请求通过.*/
DISABLED(3, false),
/** 熔断器工作，但不熔断，允许所有请求通过.*/
CLOSED(0, true),
/** 熔断器工作，开启熔断，不允许所有请求通过.*/
OPEN(1, true),
/*强制开启熔断，没有状态变化、事件，不允许任意请求通过. */
FORCED_OPEN(4, false),
/** 熔断器开启之后，超过等待周期，进入半开，运行部分请求通过*/
HALF_OPEN(2, true);
```

## StateTransition

> 熔断器状态转换的所有情况枚举

```java
CLOSED_TO_OPEN(State.CLOSED, State.OPEN),
CLOSED_TO_DISABLED(State.CLOSED, State.DISABLED),
CLOSED_TO_FORCED_OPEN(State.CLOSED, State.FORCED_OPEN),
HALF_OPEN_TO_CLOSED(State.HALF_OPEN, State.CLOSED),
HALF_OPEN_TO_OPEN(State.HALF_OPEN, State.OPEN),
HALF_OPEN_TO_DISABLED(State.HALF_OPEN, State.DISABLED),
HALF_OPEN_TO_FORCED_OPEN(State.HALF_OPEN, State.FORCED_OPEN),
OPEN_TO_CLOSED(State.OPEN, State.CLOSED),
OPEN_TO_HALF_OPEN(State.OPEN, State.HALF_OPEN),
OPEN_TO_DISABLED(State.OPEN, State.DISABLED),
OPEN_TO_FORCED_OPEN(State.OPEN, State.FORCED_OPEN),
FORCED_OPEN_TO_CLOSED(State.FORCED_OPEN, State.CLOSED),
FORCED_OPEN_TO_OPEN(State.FORCED_OPEN, State.OPEN),
FORCED_OPEN_TO_DISABLED(State.FORCED_OPEN, State.DISABLED),
FORCED_OPEN_TO_HALF_OPEN(State.FORCED_OPEN, State.HALF_OPEN),
DISABLED_TO_CLOSED(State.DISABLED, State.CLOSED),
DISABLED_TO_OPEN(State.DISABLED, State.OPEN),
DISABLED_TO_FORCED_OPEN(State.DISABLED, State.FORCED_OPEN),
DISABLED_TO_HALF_OPEN(State.DISABLED, State.HALF_OPEN);
```

## CircuitBreaker.EventPublisher

> 通过CircuitBreaker.EventPublisher可以注册事件消费策略，且可根据不同事件类型注册不同的处理策略，onEvent默认所有事件触发。

```java
//请求成功时触发的事件消费策略
EventPublisher onSuccess(EventConsumer<CircuitBreakerOnSuccessEvent> eventConsumer);
//请求失败时触发的事件消费策略
EventPublisher onError(EventConsumer<CircuitBreakerOnErrorEvent> eventConsumer);
//熔断状态发生变化时触发的事件消费策略
EventPublisher onStateTransition(EventConsumer<CircuitBreakerOnStateTransitionEvent> eventConsumer);
//熔断状态被重置触发的事件消费策略
EventPublisher onReset(EventConsumer<CircuitBreakerOnResetEvent> eventConsumer);
//请求出现异常，但是是可忽略的异常时触发的事件消费策略
EventPublisher onIgnoredError(EventConsumer<CircuitBreakerOnIgnoredErrorEvent> eventConsumer);
//熔断开启请求不运行通过的事件消费策略
EventPublisher onCallNotPermitted(EventConsumer<CircuitBreakerOnCallNotPermittedEvent> eventConsumer);
```

## Metrics

> 熔断器监控指标

```java
/**
 * 失败请求比率，当失败次数未达到压力值，返回-1
 */
float getFailureRate();
/**
 * 当前所有请求总数
 */
int getNumberOfBufferedCalls();
/**
 * 当前所有失败请求总数
 */
int getNumberOfFailedCalls();
/**
 * 当熔断器状态处于OPEN时，返回被禁止调用的请求总数，当处于CLOSED or HALF_OPEN时，返回0
 */
long getNumberOfNotPermittedCalls();
/**
 * 返回环形缓存区最大请求总数
 */
int getMaxNumberOfBufferedCalls();
/**
 * 返回当前成功请求总数
int getNumberOfSuccessfulCalls();
```

从下面截图可以看出熔断器核心接口CircuitBreaker提供的核心功能可分为以下几类：

- 请求鉴权
- 熔断处理
- 状态转换
- 装饰多种请求
- 返回熔断信息（如状态、监控指标、配置等）
