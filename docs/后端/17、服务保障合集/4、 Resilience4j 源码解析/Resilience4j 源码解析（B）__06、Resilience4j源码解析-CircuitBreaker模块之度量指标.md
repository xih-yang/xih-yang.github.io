# 06、Resilience4j源码解析-CircuitBreaker模块之度量指标
- 来源：https://ddkk.com/zhuanlan/guarantee/resilience4j/19.html
- 分类：服务保障
- 分组：Resilience4j 源码解析（B）
**4，CircuitBreakerMetrics（熔断器度量指标）**

上一篇文章我们分析了熔断器状态机的状态转换机制，这一篇文章我们分析一下熔断器度量指标，比如：包括触发状态转换的请求调用失败率是如何计算的。

相关联的类，如图：

1)，CircuitBreaker.Metrics是一个度量指标接口，定义了一系列获取度量指标的方法，包括获取失败率的百分比、获取请求调用总数量，获取请求调用失败的数量、获取不允许请求调用通过的数量、获取设置的最大调用总数和获取请求调用成功的数量。

源码如图：

2，RingBitSet

在RingBitSet内部有一个按位存储的Ring Bit Bufffer(环形缓存区)数据结构BitSetMod，原理与java.util.BitSet一样，可以先去研究一下java.util.BitSet的机制。Ring Bit Buffer用于在熔断器关闭状态下，一次成功的调用在其bit位上存储0值，一次失败的调用在其bit位上存储1值。

计算请求失败率之前，Ring Bit Buffer的每一bit位都必须被存储过。例如，如果Ring Bit Buffer的大小设置为10，如果前9次的请求调用都失败也不会计算请求调用失败率。

3，CircuitBreakerMetrics类是CircuitBreaker.Metrics接口的实现类，内部持有RingBitSet类用来存储每次请求调用的结果，以便用于计算请求调用失败率，进而触发熔断器状态机的状态转换。

主要源码如下：

//环形缓冲区大小

private final int ringBufferSize;

//Ring Bit Buffer

private final RingBitSet ringBitSet;

//不允许请求调用通过的数量，采用并发更加高效的LongAdder类型

private final LongAdder numberOfNotPermittedCalls;

onError()和onSuccess()方法是由状态机的状态类中的onError(Throwable throwable)和onSuccess()方法调用的，用来检查是否达到了设定的请求调用失败率，进而调用状态机的状态转换方法。

以初始关闭状态转换到打开状态为例，如图：

状态机如何驱动状态转换的请看上一篇文章《Resilience4j源码解析-2.3.2 CircuitBreaker模块之有限状态机》。

下一篇文章《Resilience4j源码解析-2.5 CircuitBreaker模块之事件发布》讲解Resilience4j中的事件机制。

源码的中文注释地址：

[https://github.com/Justin02180218/resilience4j](https://github.com/Justin02180218/resilience4j)
