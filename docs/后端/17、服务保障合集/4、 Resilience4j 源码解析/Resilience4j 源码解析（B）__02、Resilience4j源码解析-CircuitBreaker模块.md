# 02、Resilience4j源码解析-CircuitBreaker模块
- 来源：https://ddkk.com/zhuanlan/guarantee/resilience4j/15.html
- 分类：服务保障
- 分组：Resilience4j 源码解析（B）
## 1、CiruitBreaker(熔断器)模块总体介绍

Resilience4j的CircuitBreaker主要由6个部分组成：管理熔断器实例的注册容器、熔断器的相关配置、熔断器的各种状态、触发熔断器状态变化的指标、熔断器行为变化产生的事件以及熔断器本身。

它们之间的基本调用关系如下图：

## 2、CiruitBreaker模块各部分详解

源码位置如下图：

**1，CircuitBreakerRegistry（熔断器容器）**

****

CircuitBreakerRegistry接口的实现类InMemoryCircuitBreakerRegistry在内部使用ConcurrentHashMap容器来存储CircuitBreaker实例，保证了并发安全及原子性。通过CircuitBreakerRegistry可以创建新的CircuitBreaker实例及检索创建的CircuitBreaker实例。

需主要关注的源码如下：

```java
public interface CircuitBreakerRegistry \{
**// 返回所有的CircuitBreaker实例**
Seq<CircuitBreaker> getAllCircuitBreakers();
**// 根据名称返回CircuitBreaker实例，**
**// 如果不存在则根据默认配置，创建CircuitBreaker实例并返回**
CircuitBreaker circuitBreaker(String name);
**// 根据名称返回CircuitBreaker实例，**
**// 如果不存在则 根据传入的配置实例，创建CircuitBreaker实例并返回**
CircuitBreaker circuitBreaker(String name, CircuitBreakerConfig circuitBreakerConfig);
//同上
CircuitBreaker circuitBreaker(String name, Supplier<CircuitBreakerConfig> circuitBreakerConfigSupplier);
**// 根据自定义的配置，创建CircuitBreakerRegistry实例**
**// 线程安全的单例**
static CircuitBreakerRegistry of(CircuitBreakerConfig circuitBreakerConfig)\{
return new InMemoryCircuitBreakerRegistry(circuitBreakerConfig);
\}
//使用默认配置，创建CircuitBreakerRegistry实例
//线程安全的单例
static CircuitBreakerRegistry ofDefaults()\{
return new InMemoryCircuitBreakerRegistry();
\}
\}
**注意：在CircuitBreakerRegistry接口中使用static方法实现了线程安全的单例模式。**
public final class InMemoryCircuitBreakerRegistry implements CircuitBreakerRegistry \{
private final CircuitBreakerConfig defaultCircuitBreakerConfig;
private final ConcurrentMap<String, CircuitBreaker> circuitBreakers;
public InMemoryCircuitBreakerRegistry() \{
**// 创建默认配置实例**
this.defaultCircuitBreakerConfig = CircuitBreakerConfig.ofDefaults();
**// 创建并发安全的容器放置CircuitBreaker实例**
this.circuitBreakers = new ConcurrentHashMap<>();
\}
......
//调用CircuitBreaker.of(...)方法创建CircuitBreaker实例
@Override
public CircuitBreaker circuitBreaker(String name) \{
return circuitBreakers.computeIfAbsent(Objects.requireNonNull(name, "Name must not be null"), (k) -> CircuitBreaker.of(name, defaultCircuitBreakerConfig));
\}
......
\}
```

在InMemoryCircuitBreakerRegistry实现类中，主要做了2件事：创建了ConcurrentHashMap实例及调用CricuitBreaker.of(...)方法创建CircuitBreaker实例。

下一篇文章《Resilience4j源码解析-2.2 CircuitBreaker模块之配置》讲解熔断器配置部分。

**源码的中文注释地址：**

[https://github.com/Justin02180218/resilience4j](https://github.com/Justin02180218/resilience4j)
