# 09、Resilience4j 源码解析 RateLimiter内部模块关系
- 来源：https://ddkk.com/zhuanlan/guarantee/resilience4j/9.html
- 分类：服务保障
- 分组：Resilience4j 源码解析（A）
## RateLimiter

[resilience4j-SpringBoot2-demo](https://github.com/SayNight/resilience4j-SpringBoot2-demo)

> RateLimiter主要分为以下几个模块：限流配置，限流注册，限流事件消费者注册，限流监控指标，限流事件，限流事件处理器，限流事件消费者。

## 各模块间关系

- RateLimiterRegistry通过其实现类InMemoryRateLimiterRegistry根据RateLimiterConfig创建RateLimiter实例(AtomicRateLimiter、SemaphoreBasedRateLimiter)。
- EventConsumerRegistry通过其实现类DefaultEventConsumerRegistry创建EventConsumer事件消费者。
- RateLimiter通过其实现类(AtomicRateLimiter、SemaphoreBasedRateLimiter)处理限流，通过EventPublisher发布RateLimiterEvent(RateLimiterOnSuccessEvent、RateLimiterOnFailureEvent)从而被注册到EventProcessor事件处理器的EventConsumer事件消费者消费。

## 接口介绍

从RateLimiter接口截图可以看出主要分为以下几个部分：

- 创建限流策略
- 装饰限流请求
- 运行时修改限流配置
- 返回限流信息（如状态、监控指标、配置等）
