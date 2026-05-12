# 3、Hystrix 资源隔离
- 来源：https://ddkk.com/zhuanlan/guarantee/hystrix/3.html
- 分类：服务保障
- 分组：Hystrix 之 使用教程（A）
### 1、Hystrix资源隔离的策略

**线程池隔离**

线程隔离技术不是去控制类似tomcat这种web容器的请求线程，它是控制的是tomcat内部的执行线程，线程池满后，可以保证的是，tomcat的执行线程不会因为依赖服务的延迟或故障被卡死，使tomcat的执行线程最多损失这个线程池的线程数量，tomcat的其他线程不会卡死，会立即返回做其他的事情。

**整个流程就是：**

tomcat接收请求，tomcat线程将对依赖服务的调用路由到Hystrix的线程池，Histrix开启线程执行依赖服务的调用，tomcat线程立即返回，去做处理其他的请求。

**信号量隔离技术**

信号量是直接用tomcat线程调用依赖服务。

### 2、如何在线程池和信号量之间做选择

**线程池，针对涉及网络请求的操作**

信号量，针对纯内存操作，比如比较复杂的耗时的逻辑，还有就是你当前的服务已经支撑不了某个业务的流量洪峰，想进行流量削峰，这时候可以用信号量，限制tomcat本身的线程开销，因为你的目的是限制tomcat自身的线程。

说白了，信号量限制的是tomcat自身的线程，线程池是利用hystrix的线程替代tomcat的线程去做tomcat线程该做的事（自己总结，不保证正确性）。

### 3、配置

```java
// to use thread isolation
HystrixCommandProperties.Setter()
   .withExecutionIsolationStrategy(ExecutionIsolationStrategy.THREAD)
// to use semaphore isolation
HystrixCommandProperties.Setter()
   .withExecutionIsolationStrategy(ExecutionIsolationStrategy.SEMAPHORE)
```

#### 1、 commandgroup：

commandgroup用来定义一个线程池的，而且还会通过commandgroup来聚合一些监控和报警信息，同一个commandgroup中的请求，都会进入同一个线程池中；

#### 2、 threadpoolkey：

代表了一个HystrixThreadPool，用来进行统一监控，统计，缓存默认的threadpoolkey就是commandgroup名称，每个command都会跟它的threadpoolkey对应的threadpool绑定在一起如果不想直接用commandgroup，也可以手动设置threadpoolname；

```java
public CommandHelloWorld(String name) {
    super(Setter.withGroupKey(HystrixCommandGroupKey.Factory.asKey("ExampleGroup"))
            .andCommandKey(HystrixCommandKey.Factory.asKey("HelloWorld"))
            .andThreadPoolKey(HystrixThreadPoolKey.Factory.asKey("HelloWorldPool")));
    this.name = name;
}
```

#### 3、 commandkey：

代表了一类command，一般来说，代表了底层的依赖服务的一个接口；

command group：代表了某一个底层的依赖服务，一个依赖服务可能会暴露出来多个接口，每个接口就是一个command key，command group是用来在逻辑上组合一堆command的，在逻辑上去组织起来一堆command key的调用，统计信息，成功次数，timeout超时次数，失败次数，可以看到某一个服务整体的一些访问情况；一般来说，推荐是根据一个服务去划分出一个线程池，command key默认都是属于同一个线程池的。

举个例子，对于一个服务中的某个功能模块来说，希望将这个功能模块内的所有command放在一个group中，那么在监控和报警的时候可以放一起看。

command group对应了一个服务，但是这个服务暴露出来的几个接口，访问量很不一样，差异非常之大，你可能就希望在这个服务command group内部，包含的对应多个接口的command key，做一些细粒度的资源隔离，那么可以对同一个服务的不同接口，都使用不同的线程池。

#### 4、 coreSize；

设置线程池的大小，默认是10

```java
HystrixThreadPoolProperties.Setter()
   .withCoreSize(int value)
```

**5、** queueSizeRejectionThreshold；

控制queue满后执行reject，因为maxQueueSize不允许热修改，因此提供这个参数可以热修改，控制队列的最大大小，默认值是5.

**6、** ExecutionIsolationSemaphoreMaxConcurrentRequests；

设置使用SEMAPHORE隔离策略的时候，允许访问的最大并发量，超过这个最大并发量，请求直接被reject

这个并发量的设置，跟线程池大小的设置，是类似的，但是基于信号量的话，性能会好很多，而且hystrix框架本身的开销会小很多

默认值是10，设置的小一些，否则因为信号量是基于调用tomcat线程去执行command的（线程池技术是基于hystrix自己的线程去执行command），而且也不能从timeout中抽离，因此一旦设置的太大，而且有延时发生，可能瞬间导致tomcat本身的线程资源本占满。

```java
HystrixCommandProperties.Setter()
   .withExecutionIsolationSemaphoreMaxConcurrentRequests(int value)
```

### 4、代码

#### 1、设置信号量隔离

```java
public class SemaphoreCommand extends HystrixCommand<String> {public SemaphoreCommand() {
        super(Setter.withGroupKey(HystrixCommandGroupKey.Factory.asKey("SemaphoreGroup"))
                .andCommandKey(HystrixCommandKey.Factory.asKey("SemaphoreCommand"))
                .andThreadPoolKey(HystrixThreadPoolKey.Factory.asKey("SemaphorePool"))
                .andCommandPropertiesDefaults(HystrixCommandProperties.Setter()
                        .withExecutionIsolationStrategy(ExecutionIsolationStrategy.SEMAPHORE)
                        .withExecutionIsolationSemaphoreMaxConcurrentRequests(15)));
    }
    @Override
    protected String run() throws Exception {
        return "数据";
    }
}
```

#### 2、设置线程池的队列大小

```java
public class GetProductInfoCommand extends HystrixCommand<ProductInfo> {
    private Long productId;
    public GetProductInfoCommand(Long productId) {
        super(Setter.withGroupKey(HystrixCommandGroupKey.Factory.asKey("ProductInfoService"))
                .andCommandKey(HystrixCommandKey.Factory.asKey("GetProductInfoCommand"))
                .andThreadPoolKey(HystrixThreadPoolKey.Factory.asKey("GetProductInfoPool"))
                .andThreadPoolPropertiesDefaults(HystrixThreadPoolProperties.Setter()
                        .withCoreSize(15)
                        .withQueueSizeRejectionThreshold(10))
                );  
        this.productId = productId;
    }
    @Override
    protected ProductInfo run() throws Exception {return JSONObject.parseObject("数据", ProductInfo.class);  
    }
}
```
