# 05、Resilience4j 源码解析 CircuitBreakerState
- 来源：https://ddkk.com/zhuanlan/guarantee/resilience4j/5.html
- 分类：服务保障
- 分组：Resilience4j 源码解析（A）
## CircuitBreakerState

> 熔断状态抽象类，内置熔断状态有限机CircuitBreakerStateMachine 来进行熔断状态转换。

```java
//通过stateMachine进行熔断状态转换
CircuitBreakerStateMachine stateMachine;
//判断是否允许请求被通过
abstract boolean isCallPermitted();
//请求出现异常处理策略，更新熔断指标，并判断是否要转换熔断状态
abstract void onError(Throwable throwable);
//请求成功处理策略，更新熔断指标，并判断是否要转换熔断状态
abstract void onSuccess();
//返回当前熔断状态
abstract CircuitBreaker.State getState();
//返回当前熔断度量指标
abstract CircuitBreakerMetrics getMetrics();
//根据熔断状态枚举配置或熔断事件枚举配置判断是否需要发布熔断事件
boolean shouldPublishEvents(CircuitBreakerEvent event){
    return event.getEventType().forcePublish || getState().allowPublish;
}
```

CircuitBreakerState子类有如下几种，每个子类都有不同的接口实现：

## ClosedState

> 熔断关闭状态，其有以下两个成员变量

- CircuitBreakerMetrics circuitBreakerMetrics;（熔断度量指标）
- float failureRateThreshold;（失败率阀值，超过熔断器会转换到开启状态）

以下源码中stateMachine.transitionToXXXXState();前面章节已讲解，这里不在叙述。

**isCallPermitted**

> 熔断器当处于关闭状态时，允许所有请求通过

```java
boolean isCallPermitted() {
    return true;
}
```

**onError**

```java
void onError(Throwable throwable) {
    // CircuitBreakerMetrics is thread-safe
    //失败次数+1，并返回当前失败率，判断是否达到阀值
    checkFailureRate(circuitBreakerMetrics.onError());
}
private void checkFailureRate(float currentFailureRate) {
    if (currentFailureRate >= failureRateThreshold) {
        // Transition the state machine to OPEN state, because the failure rate is above the threshold
        //失败率达到阀值，熔断切换到开启状态
        stateMachine.transitionToOpenState();
    }
}
```

**onSuccess**

```java
// //成功次数+1，并返回当前失败率，判断是否达到阀值
void onSuccess() {
    // CircuitBreakerMetrics is thread-safe
    checkFailureRate(circuitBreakerMetrics.onSuccess());
}
```

**getState**

```java
CircuitBreaker.State getState() {
    //返回熔断器当前状态：关闭状态
    return CircuitBreaker.State.CLOSED;
}
```

**getMetrics**

```java
CircuitBreakerMetrics getMetrics() {
    //返回熔断器度量指标
    return circuitBreakerMetrics;
}
```

## OpenState

> 熔断开启状态，其有以下两个成员变量

- CircuitBreakerMetrics circuitBreakerMetrics;（熔断度量指标）
- Instant retryAfterWaitDuration;（等待该时长后，熔断器会切换到HALF_OPEN状态）

**isCallPermitted**

```java
boolean isCallPermitted() {
    // Thread-safe
    if (Instant.now().isAfter(retryAfterWaitDuration)) {
        //熔断达到重试周期，切换至HALF_OPEN状态，允许请求通过
        stateMachine.transitionToHalfOpenState();
        return true;
    }
    //熔断未达到重试周期，不允许请求通过次数+1，且本次不允许请求通过
    circuitBreakerMetrics.onCallNotPermitted();
    return false;
}
```

**onError**

```java
void onError(Throwable throwable) {
    // Could be called when Thread 1 invokes isCallPermitted when the state is CLOSED, but in the meantime another
    // Thread 2 calls onError and the state changes from CLOSED to OPEN before Thread 1 calls onError.
    // But the onError event should still be recorded, even if it happened after the state transition.
    //失败次数+1，只能在请求被通过情况下执行
    circuitBreakerMetrics.onError();
}
```

**onSuccess**

```java
void onSuccess() {
    // Could be called when Thread 1 invokes isCallPermitted when the state is CLOSED, but in the meantime another
    // Thread 2 calls onError and the state changes from CLOSED to OPEN before Thread 1 calls onSuccess.
    // But the onSuccess event should still be recorded, even if it happened after the state transition.
     //成功次数+1，只能在请求被通过情况下执行
    circuitBreakerMetrics.onSuccess();
}
```

**getState**

```java
CircuitBreaker.State getState() {
    //返回熔断器当前状态：开启状态
    return CircuitBreaker.State.OPEN;
}
```

**getMetrics**

```java
CircuitBreakerMetrics getMetrics() {
    //返回熔断器度量指标
    return circuitBreakerMetrics;
}
```

## HalfOpenState

> 熔断半开状态，其有以下两个成员变量

- CircuitBreakerMetrics circuitBreakerMetrics;（熔断度量指标）
- float failureRateThreshold;（失败率阀值，超过熔断器会转换到开启状态，低于会转换到关闭状态）

**isCallPermitted**

```java
//半天状态允许所有请求通过
boolean isCallPermitted() {
    return true;
}
```

**onError**

```java
void onError(Throwable throwable) {
    // CircuitBreakerMetrics is thread-safe
    //失败次数+1，返回当前失败率，并判断是否达到失败率阀值
    checkFailureRate(circuitBreakerMetrics.onError());
}
private void checkFailureRate(float currentFailureRate) {
    if(currentFailureRate != -1){
        if(currentFailureRate >= failureRateThreshold) {
            //失败率超过阀值，熔断器从半开切换到打开状态
            stateMachine.transitionToOpenState();
        }else{
          //失败率超过阀值，熔断器从半开切换到关闭状态
          stateMachine.transitionToClosedState();
        }
    }
}
```

**onSuccess**

```java
void onSuccess() {
    // CircuitBreakerMetrics is thread-safe
   //请求成功次数+1，返回当前失败率，并判断是否达到失败率阀值
    checkFailureRate(circuitBreakerMetrics.onSuccess());
}
```

**getState**

```java
CircuitBreaker.State getState() {
    //返回熔断器当前状态：半开状态
    return CircuitBreaker.State.HALF_OPEN;
}
```

**getMetrics**

```java
CircuitBreakerMetrics getMetrics() {
    //返回熔断器度量指标
    return circuitBreakerMetrics;
}
```

## DisabledState

> 熔断不可用状态，其只有一个成员变量，该状态下，熔断器什么也不做

- CircuitBreakerMetrics circuitBreakerMetrics;（熔断度量指标）

**isCallPermitted**

```java
//不可用状态允许所有请求通过
boolean isCallPermitted() {
    return true;
}
```

**onError**

```java
void onError(Throwable throwable) {
   // noOp
}
```

**onSuccess**

```java
void onSuccess() {
   // noOp
}
```

**getState**

```java
CircuitBreaker.State getState() {
    //返回熔断器当前状态：不可用状态
    return CircuitBreaker.State.DISABLED;
}
```

**getMetrics**

```java
CircuitBreakerMetrics getMetrics() {
    //返回熔断器度量指标
    return circuitBreakerMetrics;
}
```

## ForcedOpenState

> 熔断强制开启状态，其只有一个成员变量，该状态下，熔断器什么也不做

- CircuitBreakerMetrics circuitBreakerMetrics;（熔断度量指标）

**isCallPermitted**

```java
//强制开启状态不允许所有请求通过，不通过请求次数+1
boolean isCallPermitted() {
    circuitBreakerMetrics.onCallNotPermitted();
    return false;
}
```

**onError**

```java
void onError(Throwable throwable) {
   // noOp
}
```

**onSuccess**

```java
void onSuccess() {
   // noOp
}
```

**getState**

```java
CircuitBreaker.State getState() {
    //返回熔断器当前状态：强制开启状态
    return CircuitBreaker.State.FORCED_OPEN;
}
```

**getMetrics**

```java
CircuitBreakerMetrics getMetrics() {
    //返回熔断器度量指标
    return circuitBreakerMetrics;
}
```

其中CLOSED、OPEN、HALF_OPEN由CircuitBreakerStateMachine根据请求情况自动切换。

CircuitBreaker支持另外两种特殊状态DISABLED（始终允许访问）和FORCED_OPEN（始终拒绝访问）。在这两个状态中，不会生成CircuitBreakerEvents（除了状态转换），也不会记录任何指标。退出这些状态的唯一方法是触发状态转换或重置CircuitBreaker（如CircuitBreaker::transitionToXXX、CircuitBreaker::reset）。

不同状态源码中都多次出现CircuitBreakerMetrics，其具体用法和原理会在后续章节讲解。
