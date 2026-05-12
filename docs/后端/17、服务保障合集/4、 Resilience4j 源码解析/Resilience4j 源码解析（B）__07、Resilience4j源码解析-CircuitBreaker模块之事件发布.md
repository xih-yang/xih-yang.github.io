# 07、Resilience4j源码解析-CircuitBreaker模块之事件发布
- 来源：https://ddkk.com/zhuanlan/guarantee/resilience4j/20.html
- 分类：服务保障
- 分组：Resilience4j 源码解析（B）
**5，CircuitBreakerEvent（熔断器事件）**

**1），事件机制框架**

Resilience4j的事件机制是采用观察者模式设计的。Resilience4j事件的框架代码在：

关系如图：

EventPublisher是事件发布者接口(被观察者)，EventConsumer是事件消费者接口(观察者)。

在EventPublisher中只有一个方法onEvent(EventConsumer onEventConsumer)用于设置处理T事件的消费者。

EventConsumer被注解为@FunctionalInterface，所以它有一个唯一的函数式方法consumeEvent(T event)，用来处理T类型的事件。

EventProcessor是EventPublisher的通用实现类，它主要实现了事件消费者的注册及调用相应的函数式方法进行事件处理。

EventProcessor源码如下：

**2），CircuitBreaker的事件类型**

CircuitBreakerEvent有六种具体的事件类型，如图：

- CircuitBreakerOnErrorEvent: 请求调用失败时发布的事件
- CircuitBreakerOnSuccessEvent：请求调用成功时发布的事件
- CircuitBreakerOnStateTransitionEvent：熔断器状态转换时发布的事件
- CircuitBreakerOnResetEvent：熔断器重置时发布的事件
- CircuitBreakerOnIgnoredErrorEvent：当忽略的调用异常发生时发布的事件
- CircuitBreakerOnCallNotPermittedEvent：当请求不被允许调用时发布的事件

在CircuitBreakerEvent接口中声明了与具体事件相对应的枚举类Type，用来表示事件类型。

**2），CircuitBreaker的事件处理器**

CircuitBreaker的事件处理器CircuitBreakerEventProcessor即是事件的发布者，同时也是事件的处理者。关系如图：

在CircuitBreaker.EventPublisher接口中声明了六个方法，用于向EventProcessor中注册处理六种事件的EventConsumer。

CircuitBreakerStateMachine.CircuitBreakerEventProcessor实现类：

下一篇文章《Resilience4j源码解析-2.6 CircuitBreaker模块之熔断》讲解Resilience4j中的熔断。

**源码的中文注释地址：**

[https://github.com/Justin02180218/resilience4j](https://github.com/Justin02180218/resilience4j)
