# 09、Resilience4j源码解析-CircuitBreaker模块之总结
- 来源：https://ddkk.com/zhuanlan/guarantee/resilience4j/22.html
- 分类：服务保障
- 分组：Resilience4j 源码解析（B）
**熔断器模块总结**

通过前面几篇文章分析了熔断器模块的6个主要组成部分，这篇文章我们来分析这6个部分是如何协同工作的。

**1，熔断器初始化时的状态：**

一般创建熔断器的代码：

这2行代码产生了一系列的调用关系，如图：

这时熔断器的状态是关闭状态(ClosedState)，度量指标实例及事件处理器实例都已经准备好。我们这时可以用CircuitBreaker.Metrics metrics = circuitBreaker.getMetrics();这行代码实时的获取度量指标值。

**2，熔断器状态转换**

在这里，我们只分析熔断器从关闭状态转换到打开状态，其他状态之间的转换过程是一样的。

ClosedState ==> OpenState 状态的转换过程，如图：

熔断器通过decorateSupplier方法装饰请求调用的方法，如：

CircuitBreaker.decorateSupplier(circuitBreaker, helloWorldService::returnHelloWorld);

会发生如图所示的调用过程：

1）熔断器判断当前状态是否允许请求调用，关闭状态始终返回true。

2）执行请求调用方法

3）请求调用的结果成功或失败，熔断器最终会调用度量指标CircuitBreakerMetrics的onSuccess或onError方法返回请求调用失败率到ClosedState。ClosedState会在它的onSuccess或onError方法中判断请求失败率是否达到了设置的阈值，如果达到了阈值则调用状态机CircuitBreakerStateMachine的transitionToOpenState方法生成OpenState对象，同时把关闭状态的度量指标对象传给打开状态。然后熔断器把当前持有的状态更改为打开状态，完成了状态转换。

Resilience4j的熔断器模块的源码分析告一段落，接下来的系列文章会分析Resilience4j的限流器模块。

**源码的中文注释地址：**

[https://github.com/Justin02180218/resilience4j](https://github.com/Justin02180218/resilience4j)
