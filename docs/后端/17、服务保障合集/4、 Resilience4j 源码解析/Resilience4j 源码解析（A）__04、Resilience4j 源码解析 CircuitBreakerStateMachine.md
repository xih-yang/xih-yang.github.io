# 04、Resilience4j 源码解析 CircuitBreakerStateMachine
- 来源：https://ddkk.com/zhuanlan/guarantee/resilience4j/4.html
- 分类：服务保障
- 分组：Resilience4j 源码解析（A）
## CircuitBreakerStateMachine

> 熔断器有限状态器，熔断器核心接口CircuitBreaker的实现类。

先看一段CircuitBreaker 默认接口实现代码

```java
static <T> Supplier<T> decorateSupplier(CircuitBreaker circuitBreaker, Supplier<T> supplier){
    return () -> {
        //判断是否允许请求通过，不通过，抛出CircuitBreakerOpenException
        CircuitBreakerUtils.isCallPermitted(circuitBreaker);
        long start = System.nanoTime();
        try {
            //反射执行业务代码，并返回结果
            T returnValue = supplier.get();
            long durationInNanos = System.nanoTime() - start;
            //请求处理成功，触发熔断器成功处理策略
            circuitBreaker.onSuccess(durationInNanos);
            return returnValue;
        } catch (Exception exception) {
            // Do not handle java.lang.Error
            long durationInNanos = System.nanoTime() - start;
            //请求出现异常，触发熔断器error处理策略
            circuitBreaker.onError(durationInNanos, exception);
            throw exception;
        }
    };
}
```

CircuitBreaker装饰请求默认实现大同小异，熔断大体处理流程见下图：

## 状态转换图

有限状态机主要是在CLOSED、OPEN、HALF_OPEN三者之间转换，另外还有两种特殊状态： DISABLED、FORCED_OPEN。

**-CLOSED → OPEN**

熔断器默认初始为CLOSED状态，当请求失败率达到failureRateThreshold阀值后，熔断器处于OPEN状态，不允许所有请求通过。

**-OPEN → HALF_OPEN**

熔断器在处于OPEN状态后，等待waitDurationInOpenState时长后，熔断器转换到HALF_OPEN状态，允许部分请求通过。

**-HALF_OPEN →OPEN**

熔断器处于HALF_OPEN状态时，当请求次数达到ringBufferSizeInHalfOpenState后，判断请求失败率是否依旧超过failureRateThreshold阀值，若超过，熔断器则回到OPEN状态。

**-HALF_OPEN →CLOSED**

熔断器处于HALF_OPEN状态时，当请求次数达到ringBufferSizeInHalfOpenState后，判断请求失败率是否依旧超过failureRateThreshold阀值，若小于阀值，熔断器转换到CLOSED状态。

**状态转换接口源码**

```java
//熔断器切换到不可用状态
public void transitionToDisabledState() {
    stateTransition(DISABLED, currentState -> new DisabledState(this));
}
//熔断器切换到强制开启状态
public void transitionToForcedOpenState() {
    stateTransition(FORCED_OPEN, currentState -> new ForcedOpenState(this));
}
//熔断器切换到关闭状态
public void transitionToClosedState() {
    stateTransition(CLOSED, currentState -> new ClosedState(this, currentState.getMetrics()));
}
//熔断器切换到开启状态
public void transitionToOpenState() {
    stateTransition(OPEN, currentState -> new OpenState(this, currentState.getMetrics()));
}
//熔断器切换到半开状态
public void transitionToHalfOpenState() {
    stateTransition(HALF_OPEN, currentState -> new HalfOpenState(this));
}
//熔断器熔断状态转换
private void stateTransition(State newState, Function<CircuitBreakerState, CircuitBreakerState> newStateGenerator) {
    CircuitBreakerState previousState = stateReference.getAndUpdate(currentState -> {
        //若当前状态与更新状态一样，则返回
        if (currentState.getState() == newState) {
            return currentState;
        }
        //若当前状态与更新状态不一样，切换到新状态
        return newStateGenerator.apply(currentState);
    });
    //状态发生了变化，则发布状态转换事件。evenType为：Type.STATE_TRANSITION
    if (previousState.getState() != newState) {
        publishStateTransitionEvent(StateTransition.transitionBetween(previousState.getState(), newState));
    }
}
```

从源码可以看出状态转换通过AtomicReference来保证原子操作，从而实现thread-safe。

## 核心流程接口介绍

### isCallPermitted（判断请求是否允许通过）

有限状态机是通过 AtomicReference stateReference 保证状态转换实现线程安全。

```java
public boolean isCallPermitted() {
    //判断是否允许请求通过
    boolean callPermitted = stateReference.get().isCallPermitted();
    if (!callPermitted) {
        //不允许，发布请求不允许被调用事件
        publishCallNotPermittedEvent();
    }
    return callPermitted;
} 
```

### onSuccess（请求调用成功处理策略）

```java
public void onSuccess(long durationInNanos) {
    //发布成功事件
    publishSuccessEvent(durationInNanos);
    //更新熔断指标
    stateReference.get().onSuccess();
}
```

### onError（请求调用失败即出现异常处理策略）

```java
public void onError(long durationInNanos, Throwable throwable) {
    // Handle the case if the completable future throw CompletionException wrapping the original exception
    // where original exception is the the one to retry not the CompletionException.
    Predicate<Throwable> recordFailurePredicate = circuitBreakerConfig.getRecordFailurePredicate();
    if (throwable instanceof CompletionException) {
        //如果是异步异常，获取原始异常
        Throwable cause = throwable.getCause();
        handleThrowable(durationInNanos, recordFailurePredicate, cause);
    }else{
        handleThrowable(durationInNanos, recordFailurePredicate, throwable);
    }
}
private void handleThrowable(long durationInNanos, Predicate<Throwable> recordFailurePredicate, Throwable throwable) {
    //根据配置check是忽略该次请求的异常，还是计入失败并增加失败率
    if (recordFailurePredicate.test(throwable)) {
        LOG.debug("CircuitBreaker '{}' recorded a failure:", name, throwable);
        publishCircuitErrorEvent(name, durationInNanos, throwable);
        stateReference.get().onError(throwable);
    } else {
        publishCircuitIgnoredErrorEvent(name, durationInNanos, throwable);
    }
}
```

从源码可知，熔断器是根据业务代码通俗的说是根据业务method是否抛出异常来决定处理逻辑，同时根据异常及熔断配置，来判定是否做熔断处理，还是忽略本次异常请求。

若异常为配置中可忽略异常，则本次请求不做任何失败处理，也不更新熔断指标，只发布CircuitBreakerOnIgnoredErrorEvent。

CircuitBreakerState会在后续章节讲解
