# 08、Resilience4j源码解析-CircuitBreaker模块之熔断
- 来源：https://ddkk.com/zhuanlan/guarantee/resilience4j/21.html
- 分类：服务保障
- 分组：Resilience4j 源码解析（B）
**6，CircuitBreaker（熔断器）**

通过前面几篇的讲解，现在终于可以来看一看熔断功能是如何实现的了。与熔断器相关的有CircuitBreaker接口和CircuitBreakerStateMachine实现类。

在CircuitBreaker中：

1）声明了与状态相关的枚举类State和与状态转换相关的枚举类StateTransition：

有限状态机的5种状态及状态的转换在文章《Resilience4j源码解析-2.3.1 CircuitBreaker模块之有限状态机》中有讲解。

2）声明了度量指标接口Metrics：

度量指标及存储方式在文章《Resilience4j源码解析-2.4 CircuitBreaker模块之度量指标》中有讲解。

3）声明了事件处理器接口EventPublisher接口：

事件发布及处理机制在文章《Resilience4j源码解析-2.5 CircuitBreaker模块之事件发布》中有讲解。

4）熔断功能

在CircuitBreaker接口中以线程安全的单例模式生成了CircuitBreakerStateMachine的实例，有三种实现方式：

熔断方法

三个default方法：

其他是static方法：

这些装饰方法逻辑基本一样，我们来看看其中常用的decorateSupplier(...)方法。

CircuitBreakerUtils.isCallPermitted(circuitBreaker)最终调用了CircuitBreakerStateMachine实现类中的isCallPermitted()方法，circuitBreaker.onSuccess(...)和circuitBreaker.onError(...)也分别调用了CircuitBreakerStateMachine实现类中的onSuccess(...)和onError(...)方法，

注释如下：

至此，Resilience4j熔断器模块CircuitBreaker的六个组成部分全部分析完了，

下一篇文章《Resilience4j源码解析-2.7 CircuitBreaker模块之总结》主要分析六个组成部分是如何有效的协同工作来达到熔断的目的。

**源码的中文注释地址：**

[https://github.com/Justin02180218/resilience4j](https://github.com/Justin02180218/resilience4j)
