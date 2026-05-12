# 10、Resilience4j源码解析-RateLimiter模块介绍及限流算法
- 来源：https://ddkk.com/zhuanlan/guarantee/resilience4j/23.html
- 分类：服务保障
- 分组：Resilience4j 源码解析（B）
## 1、RateLimiter(限流器)模块总体介绍

Resilience4j的RateLimiter主要由5个部分组成：管理限流器对象的容器、限流器的相关配置、限流器可监控的指标、限流器行为变化产生的事件以及限流器本身。

它们之间的基本调用关系如下图：

RateLimiterRegistry、RateLimiterConfig和RateLimiterEvent的实现逻辑与熔断器对应的类一样，前面的几篇文章分析过，这里就不再研究了。我们重点分析Resilience4j的限流器是如何实现限流的。

## 2、RateLimiter(限流器)模块采用的限流算法

我们一般会根据不同的业务场景采用不同的限流算法，经常使用的限流算法有令牌桶限流算法、漏桶限流算法和固定并发数限流算法。令牌桶限流和漏桶限流都属于平滑限流，而固定并发数限流属于粗暴限流。

Resilience4j的限流器RateLimiter实现了令牌桶限流和固定并发数限流。

**1，令牌桶限流**

****

系统以一个恒定的速度往桶里放入令牌，获取到token的请求执行业务逻辑，同时删除桶里的token。当桶里没有令牌可取时，则请求拒绝、降级或者等待下一个周期。

**2，固定并发数限流**

使用一个计数信号量，当请求超过计数值，则在超时时间内等待。可基于java concurrent并发包里的Semaphore实现。

通过acquire()方法获取许可，该方法会阻塞，直到获取许可为止。

通过release()方法释放许可。

下一篇文章《Resilience4j源码解析-3.1 RateLimiter模块之实现令牌桶限流》主要分析RateLimiter是如何实现令牌桶限流的。

**源码的中文注释地址：**

[https://github.com/Justin02180218/resilience4j](https://github.com/Justin02180218/resilience4j)
