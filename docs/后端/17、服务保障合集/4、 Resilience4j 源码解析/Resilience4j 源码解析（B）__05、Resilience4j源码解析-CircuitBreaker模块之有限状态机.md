# 05、Resilience4j源码解析-CircuitBreaker模块之有限状态机
- 来源：https://ddkk.com/zhuanlan/guarantee/resilience4j/18.html
- 分类：服务保障
- 分组：Resilience4j 源码解析（B）
**有限状态机的实现**

状态建模完成，还需要建模一个状态机来驱动状态的变化，把状态机封装成类CircuitBreakerStateMachine。如图：

CircuitBreakerStateMachine类实现了熔断器CircuitBreaker接口，除了实现状态转换机制，还实现了熔断机制和事件发布机制。

所以CircuitBreakerStateMachine类是整个熔断器模块的核心类，在这篇文章中我们只研究状态转换机制，在后续的文章中我们逐步讲解熔断机制和事件发布机制。

下面我们看一下CircuitBreaker接口和CircuitBreakerStateMachine实现类中与状态相关的属性和方法：

1，在CircuitBreaker接口中声明了状态的枚举类，主要是为了方便进行判等操作，同时也设置了每种状态是否允许发布事件

2，CircuitBreakerStateMachine实现类中，用AtomicReference保证对CircuitBreakerState引用的原子性，在构造方法中初始化状态机为关闭状态。

//用AtomicReference保证对CircuitBreakerState引用的原子性

private final AtomicReference stateReference;

构造方法：

状态转换系列方法：

/**

* 转换到不可用状态

*/

@Override

public void transitionToDisabledState() {

stateTransition(DISABLED, currentState -> new DisabledState(this));

}

/**

* 转换到强制打开状态

*/

@Override

public void transitionToForcedOpenState() {

stateTransition(FORCED_OPEN, currentState -> new ForcedOpenState(this));

}

/**

* 转换到关闭状态

*/

@Override

public void transitionToClosedState() {

stateTransition(CLOSED, currentState -> new ClosedState(this, currentState.getMetrics()));

}

/**

* 转换到打开状态

*/

@Override

public void transitionToOpenState() {

stateTransition(OPEN, currentState -> new OpenState(this, currentState.getMetrics()));

}

/**

* 转换到半开状态

*/

@Override

public void transitionToHalfOpenState() {

stateTransition(HALF_OPEN, currentState -> new HalfOpenState(this));

}

这些状态转换方法是由各状态类实例来调用的，具体可以参考上一篇文章《Resilience4j源码解析-2.3.1 CircuitBreaker模块之有限状态机》

下一篇文章《Resilience4j源码解析-2.4 CircuitBreaker模块之度量指标》讲解熔断器触发状态转换的度量指标。

**源码的中文注释地址：**

[https://github.com/Justin02180218/resilience4j](https://github.com/Justin02180218/resilience4j)
