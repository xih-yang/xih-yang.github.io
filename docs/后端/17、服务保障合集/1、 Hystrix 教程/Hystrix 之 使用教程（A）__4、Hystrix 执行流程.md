# 4、Hystrix 执行流程
- 来源：https://ddkk.com/zhuanlan/guarantee/hystrix/4.html
- 分类：服务保障
- 分组：Hystrix 之 使用教程（A）
## 1、执行流程

**1、** 首先，tomcat接收访问请求，开启调用线程调用依赖服务;

**2、** 在调用依赖服务之前，创建command;

**3、** 在执行command之前，查找hystrix的request cache，如果缓存有数据，直接返回，否则执行command调用依赖服务返回数据;

**4、** 断路器统计成功次数、异常次数，如果打开了断路设置，直接降级;

**5、** 如果没打开断路设置，判断线程池/信号量是否已满，如果满了，直接降级;

**6、** 如果没有满，执行command，如果超时，则降级，如果报错，则也降级处理，如果执行成功，则返回数据，同时向断路器发送事件，供断路起统计;

**7、** 如果打开了断路器设置，直接降级处理;

## 2、代码实现流程

### 1、构建 HystrixCommand

构建一个HystrixCommand或者HystrixObservableCommand，一个HystrixCommand或一个HystrixObservableCommand对象，代表了对某个依赖服务发起的一次请求或者调用，构造的时候可以在构造函数中传入任何需要的参数。

```java
HystrixCommand command = new HystrixCommand(arg1, arg2);
HystrixObservableCommand command = new HystrixObservableCommand(arg1, arg2);
```

### 2、执行command；

execute()：调用后直接block住，属于同步调用，直到依赖服务返回单条结果，或者抛出异常

queue()：返回一个Future，属于异步调用，后面可以通过Future获取单条结果

observe()：订阅一个Observable对象，Observable代表的是依赖服务返回的结果，获取到代表结果的Observable对象的拷贝对象

toObservable()：返回一个Observable对象，如果我们订阅这个对象，就会执行command并且获取返回结果

```java
K value = command.execute();
Future<K> fValue = command.queue();
Observable<K> ohValue = command.observe(); 
Observable<K> ocValue = command.toObservable();
```

execute()实际上会调用queue().get().queue()，接着会调用toObservable().toBlocking().toFuture()，也就是说，无论是哪种执行command的方式，最终都是依赖toObservable()去执行的。

### 3、检查是否开启缓存；

如果这个command开启了请求缓存，request cache，而且这个调用的结果在缓存中存在，那么直接从缓存中返回结果

### 4、检查是否开启了短路器；

检查这个command对应的依赖服务是否开启了断路器；如果断路器被打开了，那么hystrix就不会执行这个command，而是直接去执行fallback降级机制

### 5、检查线程池/队列/semaphore是否已经满了；

如果command对应的线程池/队列/semaphore已经满了，那么也不会执行command，而是直接去调用fallback降级机制

### 6、执行command；

调用HystrixObservableCommand.construct()或HystrixCommand.run()来实际执行这个command

HystrixCommand.run()是返回一个单条结果，或者抛出一个异常

HystrixObservableCommand.construct()是返回一个Observable对象，可以获取多条结果

如果HystrixCommand.run()或HystrixObservableCommand.construct()的执行，超过了timeout时长的话，那么command所在的线程就会抛出一个TimeoutException

如果timeout了，也会去执行fallback降级机制，而且就不会管run()或construct()返回的值了。

这里要注意的一点是，我们是不可能终止掉一个调用严重延迟的依赖服务的线程的，只能说给你抛出来一个TimeoutException，但是还是可能会因为严重延迟的调用线程占满整个线程池的，即使这个时候新来的流量都被限流了。如果没有timeout的话，那么就会拿到一些调用依赖服务获取到的结果，然后hystrix会做一些logging记录和metric统计。

### 7、短路健康检查；

Hystrix会将每一个依赖服务的调用成功，失败，拒绝，超时，等事件，都会发送给circuit breaker断路器，断路器就会对调用成功/失败/拒绝/超时等事件的次数进行统计，断路器会根据这些统计次数来决定，是否要进行断路，如果打开了断路器，那么在一段时间内就会直接断路，然后如果在之后第一次检查发现调用成功了，就关闭断路器。

### 8、调用fallback降级机制；

在以下几种情况中，hystrix会调用fallback降级机制：run()或construct()抛出一个异常，断路器打开，线程池/队列/semaphore满了，command执行超时了；一般在降级机制中，都建议给出一些默认的返回值，比如静态的一些代码逻辑，或者从内存中的缓存中提取一些数据，尽量在这里不要再进行网络请求了

即使在降级中，一定要进行网络调用，也应该将那个调用放在一个HystrixCommand中，进行隔离

在HystrixCommand中，实现getFallback()方法，可以提供降级机制

在HystirxObservableCommand中，实现一个resumeWithFallback()方法，返回一个Observable对象，可以提供降级结果

如果fallback返回了结果，那么hystrix就会返回这个结果

对于HystrixCommand，会返回一个拷贝的Observable对象，其中会返回对应的结果

对于HystrixObservableCommand，会返回一个原始的Observable对象

如果没有实现fallback，或者是fallback抛出了异常，Hystrix会返回一个Observable，但是不会返回任何数据

不同的command执行方式，其未设置fallback或者异常时的返回结果不同

对于execute()，直接抛出异常

对于queue()，返回一个Future，调用get()时抛出异常

对于observe()，返回一个Observable对象，但是调用subscribe()方法订阅它时，执行调用者的onError方法

对于toObservable()，返回一个Observable对象，但是调用subscribe()方法订阅它时，执行调用者的onError方法

### 9、不同的执行方式；

execute()，获取一个Future.get()，然后拿到单个结果

queue()，返回一个Future

observer()，立即订阅Observable，然后启动8大执行步骤，返回一个拷贝的Observable，订阅时直接回调给你结果

toObservable()，返回一个原始的Observable，必须手动订阅才会去执行8大步骤
