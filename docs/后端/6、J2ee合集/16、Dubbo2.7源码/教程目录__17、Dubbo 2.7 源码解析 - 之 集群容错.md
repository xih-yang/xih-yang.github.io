# 17、Dubbo 2.7 源码解析 - 之 集群容错
- 来源：https://ddkk.com/zhuanlan/j2ee/dubbo/3/17.html
- 分类：J2EE框架
- 分组：教程目录
## 集群容错

## 1. 如何配置容错策略

## 2. 源码解析

源码读哪些？

- 容错实例在哪加载与创建的
- 容错方案在哪触发的
- 容错的各个策略的解析

### 2.1 容错实例的加载与创建

我们在跟服务订阅的时候其实看到过，从获取消费者开始：

org.apache.dubbo.config.spring.ReferenceBean#getObject

org.apache.dubbo.config.ReferenceConfig#get

org.apache.dubbo.config.ReferenceConfig#init

org.apache.dubbo.config.ReferenceConfig#createProxy

org.apache.dubbo.rpc.Protocol#refer

org.apache.dubbo.registry.integration.RegistryProtocol#refer

org.apache.dubbo.registry.integration.RegistryProtocol#doRefer

```java
//org.apache.dubbo.registry.integration.RegistryProtocol#doRefer
private <T> Invoker<T> doRefer(Cluster cluster, Registry registry, Class<T> type, URL url) {
    // 生成一个动态Directory
    RegistryDirectory<T> directory = new RegistryDirectory<T>(type, url);
    directory.setRegistry(registry);
    directory.setProtocol(protocol);
    // all attributes of REFER_KEY
    Map<String, String> parameters = new HashMap<String, String>(directory.getUrl().getParameters());
    URL subscribeUrl = new URL(CONSUMER_PROTOCOL, parameters.remove(REGISTER_IP_KEY), 0, type.getName(), parameters);
    if (!ANY_VALUE.equals(url.getServiceInterface()) && url.getParameter(REGISTER_KEY, true)) {
        directory.setRegisteredConsumerUrl(getRegisteredConsumerUrl(subscribeUrl, url));
        // 将consumer注册到zk
        registry.register(directory.getRegisteredConsumerUrl());
    }
    // 将所有router添加到directory
    directory.buildRouterChain(subscribeUrl);
    // 订阅服务
    directory.subscribe(subscribeUrl.addParameter(CATEGORY_KEY,
            PROVIDERS_CATEGORY + "," + CONFIGURATORS_CATEGORY + "," + ROUTERS_CATEGORY));
    // 将invoker列表伪装为一个invoker，该invoker就具有降级、容错等功能
    Invoker invoker = cluster.join(directory);
    ProviderConsumerRegTable.registerConsumer(invoker, url, subscribeUrl, directory);
    return invoker;
}
```

核心代码就在`Invoker invoker = cluster.join(directory)`：

> DEBUG，看一下cluster：
>
>
>
> 是一个自适应的Cluster，会根据directory中URL的cluster参数调用对应的Cluster实现
>
>
>
> 看到extName值为failfast，所以extension是org.apache.dubbo.rpc.cluster.support.FailfastCluster
>
> DEBUG看到的是MockClusterWrapper，是被增强了，增强功能就是Mock功能

```java
public class FailfastCluster implements Cluster {
    public final static String NAME = "failfast";
    @Override
    public <T> Invoker<T> join(Directory<T> directory) throws RpcException {
        return new FailfastClusterInvoker<T>(directory);
    }
}
```

> DEBUG

### 2.2 容错方案的调用

容错方法的执行时机就是在消费者执行远程调用的时候：

org.apache.dubbo.rpc.proxy.InvokerInvocationHandler#invoke

org.apache.dubbo.rpc.cluster.support.wrapper.MockClusterInvoker#invoke

org.apache.dubbo.rpc.cluster.support.AbstractClusterInvoker#invoke

```java
//org.apache.dubbo.rpc.cluster.support.AbstractClusterInvoker#invoke
public Result invoke(final Invocation invocation) throws RpcException {
    checkWhetherDestroyed();
    // binding attachments into invocation.
    Map<String, String> contextAttachments = RpcContext.getContext().getAttachments();
    if (contextAttachments != null && contextAttachments.size() != 0) {
        ((RpcInvocation) invocation).addAttachments(contextAttachments);
    }
    // 服务路由
    List<Invoker<T>> invokers = list(invocation);
    // 获取负载均衡策略
    LoadBalance loadbalance = initLoadBalance(invokers, invocation);
    RpcUtils.attachInvocationIdIfAsync(getUrl(), invocation);
    // 这里doInvoker，根据不同的容错策略，实现类会不同
    return doInvoke(invocation, invokers, loadbalance);
}
```

`触发点就是这里的doInvoker方法，根据不同的容错策略，实现类会不同`

此时我们配置的是failfast，所以执行路径如下：

org.apache.dubbo.rpc.cluster.support.AbstractClusterInvoker#doInvoke

org.apache.dubbo.rpc.cluster.support.FailfastClusterInvoker#doInvoke

```java
public class FailfastClusterInvoker<T> extends AbstractClusterInvoker<T> {
    public FailfastClusterInvoker(Directory<T> directory) {
        super(directory);
    }
    @Override
    public Result doInvoke(Invocation invocation, List<Invoker<T>> invokers, LoadBalance loadbalance) throws RpcException {
        // 检测所有可用的提供者，若没有任何可用的，则抛出异常，进行降级处理
        checkInvokers(invokers, invocation);
        // 负载均衡
        Invoker<T> invoker = select(loadbalance, invocation, invokers, null);
        try {
            // 远程调用
            return invoker.invoke(invocation);
        } catch (Throwable e) {
            if (e instanceof RpcException && ((RpcException) e).isBiz()) {
      // biz exception.
                throw (RpcException) e;
            }
            throw new RpcException(e instanceof RpcException ? ((RpcException) e).getCode() : 0,
                    "Failfast invoke providers " + invoker.getUrl() + " " + loadbalance.getClass().getSimpleName()
                            + " select from all providers " + invokers + " for service " + getInterface().getName()
                            + " method " + invocation.getMethodName() + " on consumer " + NetUtils.getLocalHost()
                            + " use dubbo version " + Version.getVersion()
                            + ", but no luck to perform the invocation. Last error is: " + e.getMessage(),
                    e.getCause() != null ? e.getCause() : e);
        }
    }
}
```

## 4. 容错策略的解析

接下来说每个容错策略的解析，分析过程中`重点关注每个容错策略 和 服务降级Mock 的关系`

### (1) Failover

故障转移策略。当消费者调用提供者集群中的某个服务器失败时，其会自动尝试调用其它服务器。而重试的次数是通过 retries 属性指定的(默认是2)。

```java
//org.apache.dubbo.rpc.cluster.support.FailoverClusterInvoker#doInvoke
public Result doInvoke(Invocation invocation, final List<Invoker<T>> invokers, LoadBalance loadbalance) throws RpcException {
    List<Invoker<T>> copyInvokers = invokers;
    // 检测所有可用的提供者，若没有任何可用的，则抛出异常，进行降级处理
    checkInvokers(copyInvokers, invocation);
    // 获取调用的方法名
    String methodName = RpcUtils.getMethodName(invocation);
    // 获取配置的retries的值，并加一(总共可以执行1+失败可重试的次数)
    int len = getUrl().getMethodParameter(methodName, RETRIES_KEY, DEFAULT_RETRIES) + 1;
    if (len <= 0) {
        len = 1;
    }
    // retry loop.
    RpcException le = null; // last exception.
    // 用于存放所有被调用过的invoker(局部变量)
    // 该集合用于重试时，该集合中存放的一定是有问题的invoker
    List<Invoker<T>> invoked = new ArrayList<Invoker<T>>(copyInvokers.size()); // invoked invokers.
    Set<String> providers = new HashSet<String>(len);
    for (int i = 0; i < len; i++) {
        //Reselect before retry to avoid a change of candidate invokers.
        //NOTE: if invokers changed, then invoked also lose accuracy.
        if (i > 0) {
     //第一次执行不会触发该方法，只有失败了以后重试才会执行
            // 检测当前cluster invoker是否被销毁，若是，则抛出异常，进行降级处理
            checkWhetherDestroyed();
            // 重新获取invoker列表(路由规则变动可能会影响列表)
            copyInvokers = list(invocation);
            // check again 检测所有可用的提供者，若没有任何可用的，则抛出异常，进行降级处理
            checkInvokers(copyInvokers, invocation);
        }
        // 负载均衡(先不说)
        Invoker<T> invoker = select(loadbalance, invocation, copyInvokers, invoked);
        // 将选择到的invoker添加到已经使用的列表invoked
        invoked.add(invoker);
        RpcContext.getContext().setInvokers((List) invoked);
        try {
            // 远程调用
            Result result = invoker.invoke(invocation);
            if (le != null && logger.isWarnEnabled()) {
                logger.warn("Although retry the method " + methodName
                        + " in the service " + getInterface().getName()
                        + " was successful by the provider " + invoker.getUrl().getAddress()
                        + ", but there have been failed providers " + providers
                        + " (" + providers.size() + "/" + copyInvokers.size()
                        + ") from the registry " + directory.getUrl().getAddress()
                        + " on the consumer " + NetUtils.getLocalHost()
                        + " using the dubbo version " + Version.getVersion() + ". Last error is: "
                        + le.getMessage(), le);
            }
            return result;
        } catch (RpcException e) {
            if (e.isBiz()) {
      // biz exception.
                throw e;
            }
            le = e;
        } catch (Throwable e) {
            le = new RpcException(e.getMessage(), e);
        } finally {
            providers.add(invoker.getUrl().getAddress());
        }
    }  // end-for
    // 代码运行到这里，说明全部尝试都已经失败，则抛出异常，进行降级处理
    throw new RpcException(le.getCode(), "Failed to invoke the method "
            + methodName + " in the service " + getInterface().getName()
            + ". Tried " + len + " times of the providers " + providers
            + " (" + providers.size() + "/" + copyInvokers.size()
            + ") from the registry " + directory.getUrl().getAddress()
            + " on the consumer " + NetUtils.getLocalHost() + " using the dubbo version "
            + Version.getVersion() + ". Last error is: "
            + le.getMessage(), le.getCause() != null ? le.getCause() : le);
}
```

一些分支：

- checkInvokers()：检测所有可用的提供者，若没有任何可用的，则抛出异常，进行降级处理：

```java
//org.apache.dubbo.rpc.cluster.support.AbstractClusterInvoker#checkInvokers
protected void checkInvokers(List<Invoker<T>> invokers, Invocation invocation) {
    if (CollectionUtils.isEmpty(invokers)) {
        throw new RpcException(RpcException.NO_INVOKER_AVAILABLE_AFTER_FILTER, "Failed to invoke the method "
                + invocation.getMethodName() + " in the service " + getInterface().getName()
                + ". No provider available for the service " + directory.getUrl().getServiceKey()
                + " from registry " + directory.getUrl().getAddress()
                + " on the consumer " + NetUtils.getLocalHost()
                + " using the dubbo version " + Version.getVersion()
                + ". Please check if the providers have been started and registered.");
    }
}
```

- checkWhetherDestroyed()：检测当前cluster invoker是否被销毁，若是，则抛出异常，进行降级处理

```java
//org.apache.dubbo.rpc.cluster.support.AbstractClusterInvoker#checkWhetherDestroyed
protected void checkWhetherDestroyed() {
    if (destroyed.get()) {
        throw new RpcException("Rpc cluster invoker for " + getInterface() + " on consumer " + NetUtils.getLocalHost()
                + " use dubbo version " + Version.getVersion()
                + " is now destroyed! Can not invoke any more.");
    }
}
```

### (2) Failfast

快速失败策略。消费者端只发起一次调用，若失败则立即报错。通常用于非幂等性的写操作，比如新增记录。

```java
//org.apache.dubbo.rpc.cluster.support.FailfastClusterInvoker#doInvoke
public Result doInvoke(Invocation invocation, List<Invoker<T>> invokers, LoadBalance loadbalance) throws RpcException {
    // 检测所有可用的提供者，若没有任何可用的，则抛出异常，进行降级处理
    checkInvokers(invokers, invocation);
    // 负载均衡
    Invoker<T> invoker = select(loadbalance, invocation, invokers, null);
    try {
        // 远程调用
        return invoker.invoke(invocation);
    } catch (Throwable e) {
        if (e instanceof RpcException && ((RpcException) e).isBiz()) {
      // biz exception.
            throw (RpcException) e;
        }
        throw new RpcException(e instanceof RpcException ? ((RpcException) e).getCode() : 0,
                "Failfast invoke providers " + invoker.getUrl() + " " + loadbalance.getClass().getSimpleName()
                        + " select from all providers " + invokers + " for service " + getInterface().getName()
                        + " method " + invocation.getMethodName() + " on consumer " + NetUtils.getLocalHost()
                        + " use dubbo version " + Version.getVersion()
                        + ", but no luck to perform the invocation. Last error is: " + e.getMessage(),
                e.getCause() != null ? e.getCause() : e);
    }
}
```

只要抛异常就意味着会降级。

### (3) Failsafe

失败安全策略。当消费者调用提供者出现异常时，直接忽略本次消费操作。该策略通常用于执行相对不太重要的服务。

```java
//org.apache.dubbo.rpc.cluster.support.FailsafeClusterInvoker#doInvoke
public Result doInvoke(Invocation invocation, List<Invoker<T>> invokers, LoadBalance loadbalance) throws RpcException {
    try {
        // 检测所有可用的提供者，若没有任何可用的，则抛出异常，进行降级处理
        checkInvokers(invokers, invocation);
        Invoker<T> invoker = select(loadbalance, invocation, invokers, null);
        return invoker.invoke(invocation);
    } catch (Throwable e) {
        logger.error("Failsafe ignore exception: " + e.getMessage(), e);
        return AsyncRpcResult.newDefaultAsyncResult(null, null, invocation); // ignore
    }
}
```

代码中可以看出，只要提供者列表不为空就不会降级。

### (4) Failback

失败自动恢复策略。消费者调用提供者失败后，Dubbo 会记录下该失败请求，然后会`定时`发起重试请求，而定时任务执行的次数仍是通过配置文件中的 retries 指定的。该策略通常用于实时性要求不太高的服务。

```java
//org.apache.dubbo.rpc.cluster.support.FailbackClusterInvoker#doInvoke
protected Result doInvoke(Invocation invocation, List<Invoker<T>> invokers, LoadBalance loadbalance) throws RpcException {
    Invoker<T> invoker = null;
    try {
        checkInvokers(invokers, invocation);
        invoker = select(loadbalance, invocation, invokers, null);
        return invoker.invoke(invocation);
    } catch (Throwable e) {
        logger.error("Failback to invoke method " + invocation.getMethodName() + ", wait for retry in background. Ignored exception: "
                + e.getMessage() + ", ", e);
        // 记录异常并定时重试
        addFailed(loadbalance, invocation, invokers, invoker);
        return AsyncRpcResult.newDefaultAsyncResult(null, null, invocation); // ignore
    }
}
```

核心方法addFailed：

```java
//org.apache.dubbo.rpc.cluster.support.FailbackClusterInvoker#addFailed
private void addFailed(LoadBalance loadbalance, Invocation invocation, List<Invoker<T>> invokers, Invoker<T> lastInvoker) {
    // 使用双重检测锁定义一个定时器
    if (failTimer == null) {
        synchronized (this) {
            if (failTimer == null) {
                failTimer = new HashedWheelTimer(
                        new NamedThreadFactory("failback-cluster-timer", true),
                        1,
                        TimeUnit.SECONDS, 32, failbackTasks);
            }
        }
    }
    // 定义定时任务
    // 可以看到传入了retries，代表允许重试几次
    RetryTimerTask retryTimerTask = new RetryTimerTask(loadbalance, invocation, invokers, lastInvoker, retries, RETRY_FAILED_PERIOD);
    try {
        // 执行定时任务，默认5秒以后(RETRY_FAILED_PERIOD=5)
        // 定时任务只会执行一次，之所以说执行多次，原因在RetryTimerTask
        failTimer.newTimeout(retryTimerTask, RETRY_FAILED_PERIOD, TimeUnit.SECONDS);
    } catch (Throwable e) {
        logger.error("Failback background works error,invocation->" + invocation + ", exception: " + e.getMessage());
    }
}
```

我们看RetryTimerTask的run方法：

```java
//org.apache.dubbo.rpc.cluster.support.FailbackClusterInvoker.RetryTimerTask#run
public void run(Timeout timeout) {
    try {
        // 负载均衡
        Invoker<T> retryInvoker = select(loadbalance, invocation, invokers, Collections.singletonList(lastInvoker));
        // 记录下选择的这个invoker
        lastInvoker = retryInvoker;
        // 远程调用
        retryInvoker.invoke(invocation);
    } catch (Throwable e) {
        logger.error("Failed retry to invoke method " + invocation.getMethodName() + ", waiting again.", e);
        if ((++retryTimes) >= retries) {
	        //如果重试次数超过指定的重试次数，记录日志，什么也不做
            logger.error("Failed retry times exceed threshold (" + retries + "), We have to abandon, invocation->" + invocation);
        } else {
            // 再次执行定时任务
            rePut(timeout);
        }
    }
}
```

>

看下rePut方法：

```java
//org.apache.dubbo.rpc.cluster.support.FailbackClusterInvoker.RetryTimerTask#rePut
private void rePut(Timeout timeout) {
    if (timeout == null) {
        return;
    }
    // 获取当前任务处理器的定时器
    Timer timer = timeout.timer();
    if (timer.isStop() || timeout.isCancelled()) {
        return;
    }
    // timeout.task() 获取当前任务处理器的任务
    // 再次执行定时任务
    timer.newTimeout(timeout.task(), tick, TimeUnit.SECONDS);
}
```

### (5) Forking

并行策略。消费者对于同一服务并行调用多个提供者服务器，只要一个成功即调用结束并返回结果。通常用于实时性要求较高的读操作，但其会浪费较多服务器资源。可以通过forks属性配置并行数。

```java
//org.apache.dubbo.rpc.cluster.support.ForkingClusterInvoker#doInvoke
public Result doInvoke(final Invocation invocation, List<Invoker<T>> invokers, LoadBalance loadbalance) throws RpcException {
    try {
        checkInvokers(invokers, invocation);
        final List<Invoker<T>> selected;
        // 获取forks属性的值
        final int forks = getUrl().getParameter(FORKS_KEY, DEFAULT_FORKS);
        final int timeout = getUrl().getParameter(TIMEOUT_KEY, DEFAULT_TIMEOUT);
        // 若指定的分叉数量小于等于0，或分叉数量比invoker数量还多，
        // 则我们要将所有invoker都选择出来进行远程调用
        if (forks <= 0 || forks >= invokers.size()) {
            selected = invokers;
        } else {
       // 若forks数量小于invoker数量，则通过负载均衡方式获取到forks数量的invoker，进行远程调用
            selected = new ArrayList<>();
            for (int i = 0; i < forks; i++) {
                Invoker<T> invoker = select(loadbalance, invocation, invokers, selected);
                if (!selected.contains(invoker)) {
                    //Avoid add the same invoker several times.
                    selected.add(invoker);
                }
            }
        }
        RpcContext.getContext().setInvokers((List) selected);
        // 异常计数器
        final AtomicInteger count = new AtomicInteger();
        // 远程调用结果队列，用于存放远程调用的结果
        final BlockingQueue<Object> ref = new LinkedBlockingQueue<>();
        // 遍历所有选择出的invoker
        for (final Invoker<T> invoker : selected) {
            // 从线程池中拿出一个线程进行远程调用
            executor.execute(new Runnable() {
                @Override
                public void run() {
                    try {
                        // 远程调用
                        Result result = invoker.invoke(invocation);
                        // 将调用结果写入队列
                        ref.offer(result);
                    } catch (Throwable e) {
                        // 异常计数器增一
                        int value = count.incrementAndGet();
                        // 只有当所有invoker的远程调用全部失败时，就会将这个异常结果写入到队列
                        if (value >= selected.size()) {
                            ref.offer(e);
                        }
                    }
                }
            });
        }
        try {
            // poll()是可阻塞的，当ref队列中没有元素时，会阻塞指定的时长。
            // 若超时，则抛出异常。若在阻塞期间队列中出现了元素，则阻塞唤醒
            Object ret = ref.poll(timeout, TimeUnit.MILLISECONDS);
            if (ret instanceof Throwable) {
                Throwable e = (Throwable) ret;
                throw new RpcException(e instanceof RpcException ? ((RpcException) e).getCode() : 0, "Failed to forking invoke provider " + selected + ", but no luck to perform the invocation. Last error is: " + e.getMessage(), e.getCause() != null ? e.getCause() : e);
            }
            return (Result) ret;
        } catch (InterruptedException e) {
            throw new RpcException("Failed to forking invoke provider " + selected + ", but no luck to perform the invocation. Last error is: " + e.getMessage(), e);
        }
    } finally {
        // clear attachments which is binding to current thread.
        RpcContext.getContext().clearAttachments();
    }
}
```

### (6) Broadcast

广播策略。广播调用所有提供者，逐个调用，任意一台报错则报错。通常用于通知所有提供者更新缓存或日志等本地资源信息。

```java
//org.apache.dubbo.rpc.cluster.support.BroadcastClusterInvoker#doInvoke
public Result doInvoke(final Invocation invocation, List<Invoker<T>> invokers, LoadBalance loadbalance) throws RpcException {
    checkInvokers(invokers, invocation);
    RpcContext.getContext().setInvokers((List) invokers);
    RpcException exception = null;
    Result result = null;
    // 遍历所有invoker
    for (Invoker<T> invoker : invokers) {
        try {
            result = invoker.invoke(invocation);
        } catch (RpcException e) {
            exception = e;
            logger.warn(e.getMessage(), e);
        } catch (Throwable e) {
            exception = new RpcException(e.getMessage(), e);
            logger.warn(e.getMessage(), e);
        }
    }
    // 只要exception不空，则抛出异常
    if (exception != null) {
        throw exception;
    }
    return result;
}
```
