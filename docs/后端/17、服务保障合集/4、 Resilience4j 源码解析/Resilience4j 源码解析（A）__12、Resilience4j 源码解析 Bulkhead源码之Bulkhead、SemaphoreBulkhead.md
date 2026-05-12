# 12、Resilience4j 源码解析 Bulkhead源码之Bulkhead、SemaphoreBulkhead
- 来源：https://ddkk.com/zhuanlan/guarantee/resilience4j/12.html
- 分类：服务保障
- 分组：Resilience4j 源码解析（A）
## Bulkhead

[resilience4j-SpringBoot2-demo](https://github.com/SayNight/resilience4j-SpringBoot2-demo)

> Bulkhead中文意思：船舶中的隔舱板，将船体分割成多个船舱。把应用系统当成一艘船，那么应用中不同方法，就对应船里面不同船舱，船舱可能是单人间，也可能是四人间、八人间、或者大通铺。船舱容量对应应用中不同方法允许承受的最大并发量。Bulkhead作用是让一个应用中不同方法互不影响，避免某些方法调用异常危及整个应用。

> 主要分为以下几个模块：隔离器配置，隔离器注册，隔离器事件消费者注册，隔离器状态及指标，隔离器事件，隔离器事件处理器，隔离器事件消费者。

## 各模块间关系

- BulkheadRegistry通过其实现类InMemoryBulkheadRegistry根据BulkheadConfig创建Bulkhead实例。
- EventConsumerRegistry通过其实现类DefaultEventConsumerRegistry创建EventConsumer事件消费者。
- Bulkhead通过其实现类SemaphoreBulkhead控制并发，并发布BulkheadEvent从而被注册到EventProcessor事件处理器的EventConsumer事件消费者消费。

## Bulkhead接口介绍

通过下图可看出主要依次分为一下几个部分：

- 动态改变隔离配置
- 隔离请求判断&完成时操作 （隔离器最核心流程）
- 获取对应隔离信息
- 装饰器模式提供多个接口、支持lambda表达式。
- 度量指标
- 事件发布&注册

## 核心配置

- **maxConcurrentCalls** ： Bulkhead允许的最大并行执行量。默认：25
- **maxWaitDuration**：尝试进入饱和舱壁时线程阻塞等待的最长时间。默认：0

## 核心流程图

> Bulkhead核心处理流程如下所示，当请求被拒绝时，抛出BulkheadFullException。并在请求通过、拒绝、完成时，publish 对应 BulkheadEvent。
>
> 本文主要讲述SemaphoreBulkhead信号量隔离机制，最新版本新增支持了ThreadPoolBulkhead。

## BulkheadEvent

> 隔离器事件，有三种类型。

```java
/** 请求被允许通过时，发布.*/
CALL_PERMITTED
/** 请求被允许拒绝时，发布*/
CALL_REJECTED,
/** 处理请求后发布，无论请求是通过还是被拒绝*/
CALL_FINISHED;
```

## SemaphoreBulkhead

> Bulkhead接口实现类，利用JDK的Semaphore实现并发控制。

从图中其构造方法可看出，使用的是Semaphore公平模式，即先到先得。

### isCallPermitted

```java
public boolean isCallPermitted() {
    //尝试获取信号量，并返回结果
    boolean callPermitted = tryEnterBulkhead();
    //根据获取结果发布对应event
    publishBulkheadEvent(
            () -> callPermitted ? new BulkheadOnCallPermittedEvent(name)
                    : new BulkheadOnCallRejectedEvent(name)
    );
    return callPermitted;
}
```

```java
boolean tryEnterBulkhead() {
    boolean callPermitted = false;
    //获取配置的最大等待时长
    long timeout = config.getMaxWaitTime();
    if (timeout == 0) {
        //直接尝试获取许可
        callPermitted = semaphore.tryAcquire();
    } else {
        try {
           //在对应规定时间内尝试获取许可
            callPermitted = semaphore.tryAcquire(timeout, TimeUnit.MILLISECONDS);
        } catch (InterruptedException ex) {
            callPermitted = false;
        }
    }
    return callPermitted;
}
```

semaphore.tryAcquire在[Semaphore介绍](https://blog.csdn.net/a355586533/article/details/78367335)中有介绍，这里不在叙述。

订阅消费事件和前面章节CircuitBreaker事件消费类似，不在叙述。

总结：

- Bulkhead通过JDK中Semaphore（公平模式）实现并发控制。
- 可在运行时修改Bulkhead配置，同时也可订阅对应事件。
- Bulkhead是通过抛出BulkheadFullException方式终止请求调用的。
