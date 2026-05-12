# 16、Dubbo 2.7 源码解析 - 之 服务降级
- 来源：https://ddkk.com/zhuanlan/j2ee/dubbo/3/16.html
- 分类：J2EE框架
- 分组：教程目录
## 服务降级

Dubbo 中常见的服务降级设置有四种：

- mock=”force:return null” (return 666也行，不一定非要null)表示消费方对该服务的方法调用直接强制性返回 null 值，不发起远程调用，即使远程的提供者没有出现问题。用来屏蔽不重要服务。
- mock=”fail:return null” 表示消费方对该服务的方法调用在失败后，再返回 null 值，不抛异常。用来容忍不重要服务不稳定时的影响。
- mock=”true”表示消费方对该服务的方法调用在失败后，会调用消费方定义的服务降级Mock 类实例的相应方法。而该 Mock 类的类名需要为“业务接口名+Mock”，且放在与接口相同的包中。
- mock=降级类的全限定性类名 与 mock=”true”功能类似，不同的是，该方式中的降级类名可以是任意名称，在任何包中。

## 1. 修改消费者端代码

为了演示服务降级，在调试之前首先修改消费者工程的代码。

### (1) 定义 Mock 类

在org.apache.dubbo.demo 包中创建如下类(Mock类要和对应接口在同包下)：

```java
public class DemoServiceMock implements DemoService{
    @Override
    public String sayHello(String name) {
        return "this is mock result : " + name;
    }
}
```

### (2) 修改配置文件

### (3) 测试类

```java
public class ConsumerApplication {
    /**
     * In order to make sure multicast registry works, need to specify '-Djava.net.preferIPv4Stack=true' before
     * launch the application
     */
    public static void main(String[] args) {
        ClassPathXmlApplicationContext context = new ClassPathXmlApplicationContext("spring/dubbo-consumer.xml");
        context.start();
        DemoService demoService = context.getBean("demoService", DemoService.class);
        String hello = demoService.sayHello("world");
        System.out.println("result: ========================= " + hello);
    }
}
```

>

## 2. 服务降级的调用

### (1) forbidden 的值

我们前面跟服务订阅时，知道，一但注册中心的注册信息发生变化，会触发org.apache.dubbo.registry.integration.RegistryDirectory#notify方法：

```java
//org.apache.dubbo.registry.integration.RegistryDirectory#notify
public synchronized void notify(List<URL> urls) {
	...
    // providers
    // 处理category为providers的情况
    List<URL> providerURLs = categoryUrls.getOrDefault(PROVIDERS_CATEGORY, Collections.emptyList());
    refreshOverrideAndInvoker(providerURLs);
}
```

这里我们看providers处理：

```java
//org.apache.dubbo.registry.integration.RegistryDirectory#refreshOverrideAndInvoker
private void refreshOverrideAndInvoker(List<URL> urls) {
    // mock zookeeper://xxx?mock=return null
    overrideDirectoryUrl();
    // 更新invoker列表
    refreshInvoker(urls);
}
```

```java
//org.apache.dubbo.registry.integration.RegistryDirectory#refreshInvoker
private void refreshInvoker(List<URL> invokerUrls) {
    Assert.notNull(invokerUrls, "invokerUrls should not be null");
    // 若只有一个提供者url，且其protocol为empty，则说明当前没有提供者
    // 则本次远程调用将被禁止
    if (invokerUrls.size() == 1
            && invokerUrls.get(0) != null
            && EMPTY_PROTOCOL.equals(invokerUrls.get(0).getProtocol())) {
        this.forbidden = true; // Forbid to access
        this.invokers = Collections.emptyList();
        routerChain.setInvokers(this.invokers);
        destroyAllInvokers(); // Close all invokers
    } else {
		...
    }
}
```

可以看到如果注册中心的服务提供者列表为空，`forbidden将被赋值为 true，表示当前禁止进行远程访问`。后面分析会用到这个属性。

### (2) 找到服务降级代码

还是从消费者发起远程调用开始：

org.apache.dubbo.rpc.proxy.InvokerInvocationHandler#invoke

org.apache.dubbo.rpc.cluster.support.wrapper.MockClusterInvoker#invoke

```java
//org.apache.dubbo.rpc.cluster.support.wrapper.MockClusterInvoker#invoke
public Result invoke(Invocation invocation) throws RpcException {
    Result result = null;
    // 获取mock属性值
    String value = directory.getUrl().getMethodParameter(invocation.getMethodName(), MOCK_KEY, Boolean.FALSE.toString()).trim();
    // 若没有指定mock属性，或其值为false，则没有降级功能
    if (value.length() == 0 || value.equalsIgnoreCase("false")) {
        //no mock   远程调用
        result = this.invoker.invoke(invocation);
    } else if (value.startsWith("force")) {
	    // 若mock的值以force开头，则进行强制降级处理
        if (logger.isWarnEnabled()) {
            logger.warn("force-mock: " + invocation.getMethodName() + " force-mock enabled , url : " + directory.getUrl());
        }
        //force:direct mock  降级处理
        result = doMockInvoke(invocation, null);
    } else {
	    // mock的值为其它情况
        //fail-mock
        try {
            // 先进行远程调用
            result = this.invoker.invoke(invocation);
        } catch (RpcException e) {
            if (e.isBiz()) {
                throw e;
            }
            if (logger.isWarnEnabled()) {
                logger.warn("fail-mock: " + invocation.getMethodName() + " fail-mock enabled , url : " + directory.getUrl(), e);
            }
            // 若远程调用过程中出现了问题(Directory不可用，或为空)，则进行降级处理
            result = doMockInvoke(invocation, e);
        }
    }
    return result;
}
```

我们配的mock属性值是"true"，所以此时会走最后一个else中的this.invoker.invoke(invocation)，先继续跟远程调用，走

org.apache.dubbo.rpc.cluster.support.AbstractClusterInvoker#invoke方法：

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
    return doInvoke(invocation, invokers, loadbalance);
}
```

看list方法：

```java
//org.apache.dubbo.rpc.cluster.support.AbstractClusterInvoker#list
protected List<Invoker<T>> list(Invocation invocation) throws RpcException {
    return directory.list(invocation);
}
```

继续跟
org.apache.dubbo.rpc.cluster.directory.AbstractDirectory#list

org.apache.dubbo.rpc.cluster.directory.AbstractDirectory#doList

```java
//org.apache.dubbo.registry.integration.RegistryDirectory#doList
public List<Invoker<T>> doList(Invocation invocation) {
    if (forbidden) {
        // 1. No service provider 2. Service providers are disabled
        throw new RpcException(RpcException.FORBIDDEN_EXCEPTION, "No provider available from registry " +
                getUrl().getAddress() + " for service " + getConsumerUrl().getServiceKey() + " on consumer " +
                NetUtils.getLocalHost() + " use dubbo version " + Version.getVersion() +
                ", please check status of providers(disabled, not registered or in blacklist).");
    }
	...
    return invokers == null ? Collections.emptyList() : invokers;
}
```

看到这里forbidden为true会抛出异常，然后直接跳回org.apache.dubbo.rpc.cluster.support.wrapper.MockClusterInvoker#invoke的异常处理：

继续跟doMockInvoke方法：

```java
//org.apache.dubbo.rpc.cluster.support.wrapper.MockClusterInvoker#doMockInvoke
private Result doMockInvoke(Invocation invocation, RpcException e) {
    Result result = null;
    Invoker<T> minvoker;
    List<Invoker<T>> mockInvokers = selectMockInvoker(invocation);
    if (CollectionUtils.isEmpty(mockInvokers)) {
        minvoker = (Invoker<T>) new MockInvoker(directory.getUrl(), directory.getInterface());
    } else {
        minvoker = mockInvokers.get(0);
    }
    try {
	    //主要跟这个方法
        result = minvoker.invoke(invocation);
    } catch (RpcException me) {
        if (me.isBiz()) {
            result = AsyncRpcResult.newDefaultAsyncResult(me.getCause(), invocation);
        } else {
            throw new RpcException(me.getCode(), getMockExceptionMessage(e, me), me.getCause());
        }
    } catch (Throwable me) {
        throw new RpcException(getMockExceptionMessage(e, me), me.getCause());
    }
    return result;
}
```

跟org.apache.dubbo.rpc.support.MockInvoker#invoke：

```java
//org.apache.dubbo.rpc.support.MockInvoker#invoke
public Result invoke(Invocation invocation) throws RpcException {
	//获取 "方法名.mock"  的参数（即先处理方法级别的mock配置）
    String mock = getUrl().getParameter(invocation.getMethodName() + "." + MOCK_KEY);
    if (invocation instanceof RpcInvocation) {
        ((RpcInvocation) invocation).setInvoker(this);
    }
    if (StringUtils.isBlank(mock)) {
	    //尝试获取"mock"参数(方法级别配置为空，则获取接口级别）
        mock = getUrl().getParameter(MOCK_KEY);
    }
    if (StringUtils.isBlank(mock)) {
        throw new RpcException(new IllegalAccessException("mock can not be null. url :" + url));
    }
    // 规范化mock的值
    mock = normalizeMock(URL.decode(mock));
	...
}
```

先看normalizeMock方法，规范化mock的值：

```java
//org.apache.dubbo.rpc.support.MockInvoker#normalizeMock
public static String normalizeMock(String mock) {
    if (mock == null) {
        return mock;
    }
    mock = mock.trim();
    if (mock.length() == 0) {
        return mock;
    }
    // 若mock为"return"，则返回returnnull
    if (RETURN_KEY.equalsIgnoreCase(mock)) {
        return RETURN_PREFIX + "null";
    }
    // 若mock的值为true、default、fail、force，则统一返回default
    // (isDefault方法判断是true，或default)
    if (ConfigUtils.isDefault(mock) || "fail".equalsIgnoreCase(mock) || "force".equalsIgnoreCase(mock)) {
        return "default";
    }
    // 若mock以fail:开头，则返回fail:后的内容
    if (mock.startsWith(FAIL_PREFIX)) {
        mock = mock.substring(FAIL_PREFIX.length()).trim();
    }
    // 若mock以force:开头，则返回force:后的内容
    if (mock.startsWith(FORCE_PREFIX)) {
        mock = mock.substring(FORCE_PREFIX.length()).trim();
    }
	// 若mock以return或throw开头
    if (mock.startsWith(RETURN_PREFIX) || mock.startsWith(THROW_PREFIX)) {
	    //把符号替换为"
        mock = mock.replace('', '"');
    }
    return mock;
}
```

继续回到org.apache.dubbo.rpc.support.MockInvoker#invoke：

```java
//org.apache.dubbo.rpc.support.MockInvoker#invoke
public Result invoke(Invocation invocation) throws RpcException {
	//获取 "方法名.mock"  的参数
    String mock = getUrl().getParameter(invocation.getMethodName() + "." + MOCK_KEY);
    if (invocation instanceof RpcInvocation) {
        ((RpcInvocation) invocation).setInvoker(this);
    }
    if (StringUtils.isBlank(mock)) {
	    //尝试获取"mock"参数
        mock = getUrl().getParameter(MOCK_KEY);
    }
    if (StringUtils.isBlank(mock)) {
        throw new RpcException(new IllegalAccessException("mock can not be null. url :" + url));
    }
    // 规范化mock的值
    mock = normalizeMock(URL.decode(mock));
    // 若mock以return开头
    if (mock.startsWith(RETURN_PREFIX)) {
        // mock取return后的内容
        mock = mock.substring(RETURN_PREFIX.length()).trim();
        try {
	        //获取此次远程调用的返回结果的类型
            Type[] returnTypes = RpcUtils.getReturnTypes(invocation);
            //将return后面的值 解析成对应的类型
            Object value = parseMockValue(mock, returnTypes);
            return AsyncRpcResult.newDefaultAsyncResult(value, invocation);
        } catch (Exception ew) {
            throw new RpcException("mock return invoke error. method :" + invocation.getMethodName()
                    + ", mock:" + mock + ", url: " + url, ew);
        }
    } else if (mock.startsWith(THROW_PREFIX)) {
	    //以throw开头，则抛异常
        mock = mock.substring(THROW_PREFIX.length()).trim();
        if (StringUtils.isBlank(mock)) {
            throw new RpcException("mocked exception for service degradation.");
        } else {
      // user customized class
            Throwable t = getThrowable(mock);
            throw new RpcException(RpcException.BIZ_EXCEPTION, t);
        }
    } else {
      //impl mock
	    //重点在这
        try {
            // 使用本地mock类构建成一个invoker
            Invoker<T> invoker = getInvoker(mock);
            return invoker.invoke(invocation);
        } catch (Throwable t) {
            throw new RpcException("Failed to create mock implementation class " + mock, t);
        }
    }
}
```

看到这个方法处理了三种情况：

- 若mock以return开头，则获取return后的内容转换成方法返回值对应的类型，返回
- 若mock以throw开头，则抛异常
- 使用本地mock类构建成invoker进行调用

重点看第三种方式，看getInvoker方法：

```java
//org.apache.dubbo.rpc.support.MockInvoker#getInvoker
private Invoker<T> getInvoker(String mockService) {
    Invoker<T> invoker = (Invoker<T>) MOCK_MAP.get(mockService);
    if (invoker != null) {
        return invoker;
    }
    // 获取业务接口
    Class<T> serviceType = (Class<T>) ReflectUtils.forName(url.getServiceInterface());
    // 获取本地mock类实例
    T mockObject = (T) getMockObject(mockService, serviceType);
    // 将mock类实例构建为invoker
    invoker = PROXY_FACTORY.getInvoker(mockObject, serviceType, url);
    if (MOCK_MAP.size() < 10000) {
        MOCK_MAP.put(mockService, invoker);
    }
    return invoker;
}
```

看getMockObject：

```java
//org.apache.dubbo.rpc.support.MockInvoker#getMockObject
public static Object getMockObject(String mockService, Class serviceType) {
	//如果标签中mock配的是true，此时这里mockService应该是default
    if (ConfigUtils.isDefault(mockService)) {
        // 业务接口的全限定性类名后添加Mock，形成Mock类名
        mockService = serviceType.getName() + "Mock";
    }
    // 加载指定的类
    Class<?> mockClass = ReflectUtils.forName(mockService);
    if (!serviceType.isAssignableFrom(mockClass)) {
        throw new IllegalStateException("The mock class " + mockClass.getName() +
                " not implement interface " + serviceType.getName());
    }
    try {
        // 创建mock类实例
        return mockClass.newInstance();
    } catch (InstantiationException e) {
        throw new IllegalStateException("No default constructor from mock class " + mockClass.getName(), e);
    } catch (IllegalAccessException e) {
        throw new IllegalStateException(e);
    }
}
```
