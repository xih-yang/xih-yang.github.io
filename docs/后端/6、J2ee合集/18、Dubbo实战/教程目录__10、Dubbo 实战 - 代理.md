# 10、Dubbo 实战 - 代理
- 来源：https://ddkk.com/zhuanlan/j2ee/dubbo/4/10.html
- 分类：J2EE框架
- 分组：教程目录
### Invoker调用

代理有几种方式：普通代理、JDK、Javassist库动态代理、Javassist库动态字节码代理。

生成代理的目的是你调用invoker的相关函数后，就等同于是调用DubboInvoker中的相关函数，也就是将本地调用转为网络调用并获得结果。

```java
// create service proxy
return (T) proxyFactory.getProxy(invoker);
```

```java
private static final ProxyFactory proxyFactory = ExtensionLoader.getExtensionLoader(ProxyFactory.class).getAdaptiveExtension();
```

```java
/**
 * ProxyFactory. (API/SPI, Singleton, ThreadSafe)
 */
@SPI("javassist")
public interface ProxyFactory {
    /**
     * create proxy.
     *
     * @param invoker
     * @return proxy
     */
    @Adaptive({Constants.PROXY_KEY})
    <T> T getProxy(Invoker<T> invoker) throws RpcException;
    /**
     * create invoker.
     *
     * @param <T>
     * @param proxy
     * @param type
     * @param url
     * @return invoker
     */
    @Adaptive({Constants.PROXY_KEY})
    <T> Invoker<T> getInvoker(T proxy, Class<T> type, URL url) throws RpcException;
}
```

Dubbo提供了三种代理工厂，默认的代理工厂是JavassistProxyFactory

```java
/**
 * JavaassistRpcProxyFactory
 */
public class JavassistProxyFactory extends AbstractProxyFactory {
    @SuppressWarnings("unchecked")
    public <T> T getProxy(Invoker<T> invoker, Class<?>[] interfaces) {
        return (T) Proxy.getProxy(interfaces).newInstance(new InvokerInvocationHandler(invoker));
    }
    public <T> Invoker<T> getInvoker(T proxy, Class<T> type, URL url) {
        // TODO Wrapper cannot handle this scenario correctly: the classname contains '$'
        final Wrapper wrapper = Wrapper.getWrapper(proxy.getClass().getName().indexOf('$') < 0 ? proxy.getClass() : type);
        return new AbstractProxyInvoker<T>(proxy, type, url) {
            @Override
            protected Object doInvoke(T proxy, String methodName,
                                      Class<?>[] parameterTypes,
                                      Object[] arguments) throws Throwable {
                return wrapper.invokeMethod(proxy, methodName, parameterTypes, arguments);
            }
        };
    }
}
```

getProxy方法中实例化了InvokerInvocationHandler类，该类封装了代理是如何工作的：

```java
/**
 * InvokerHandler
 */
public class InvokerInvocationHandler implements InvocationHandler {
    private final Invoker<?> invoker;
    public InvokerInvocationHandler(Invoker<?> handler) {
        this.invoker = handler;
    }
    public Object invoke(Object proxy, Method method, Object[] args) throws Throwable {
        String methodName = method.getName();
        Class<?>[] parameterTypes = method.getParameterTypes();
        if (method.getDeclaringClass() == Object.class) {
            return method.invoke(invoker, args);
        }
        if ("toString".equals(methodName) && parameterTypes.length == 0) {
            return invoker.toString();
        }
        if ("hashCode".equals(methodName) && parameterTypes.length == 0) {
            return invoker.hashCode();
        }
        if ("equals".equals(methodName) && parameterTypes.length == 1) {
            return invoker.equals(args[0]);
        }
        return invoker.invoke(new RpcInvocation(method, args)).recreate();
    }
}
```

此时我们在DubboInvoker.java类中可以看到invoke函数中最终会调用doInvoke函数，此时转为网络调用。

这里我们通过RpcInvocation对象，可以确认客户端传递给invoker的信息：

```java
public RpcInvocation(Invocation invocation, Invoker<?> invoker) {
        this(invocation.getMethodName(), invocation.getParameterTypes(),
                invocation.getArguments(), new HashMap<String, String>(invocation.getAttachments()),
                invocation.getInvoker());
        if (invoker != null) {
            URL url = invoker.getUrl();
            setAttachment(Constants.PATH_KEY, url.getPath());
            if (url.hasParameter(Constants.INTERFACE_KEY)) {
                setAttachment(Constants.INTERFACE_KEY, url.getParameter(Constants.INTERFACE_KEY));
            }
            if (url.hasParameter(Constants.GROUP_KEY)) {
                setAttachment(Constants.GROUP_KEY, url.getParameter(Constants.GROUP_KEY));
            }
            if (url.hasParameter(Constants.VERSION_KEY)) {
                setAttachment(Constants.VERSION_KEY, url.getParameter(Constants.VERSION_KEY, "0.0.0"));
            }
            if (url.hasParameter(Constants.TIMEOUT_KEY)) {
                setAttachment(Constants.TIMEOUT_KEY, url.getParameter(Constants.TIMEOUT_KEY));
            }
            if (url.hasParameter(Constants.TOKEN_KEY)) {
                setAttachment(Constants.TOKEN_KEY, url.getParameter(Constants.TOKEN_KEY));
            }
            if (url.hasParameter(Constants.APPLICATION_KEY)) {
                setAttachment(Constants.APPLICATION_KEY, url.getParameter(Constants.APPLICATION_KEY));
            }
        }
    }
```

### JDK代理

这里实际上只是根据JDK代理机制来生成相应的代理

```java
/**
 * JavaassistRpcProxyFactory
 */
public class JdkProxyFactory extends AbstractProxyFactory {
    @SuppressWarnings("unchecked")
    public <T> T getProxy(Invoker<T> invoker, Class<?>[] interfaces) {
        return (T) Proxy.newProxyInstance(Thread.currentThread().getContextClassLoader(), interfaces, new InvokerInvocationHandler(invoker));
    }
    public <T> Invoker<T> getInvoker(T proxy, Class<T> type, URL url) {
        return new AbstractProxyInvoker<T>(proxy, type, url) {
            @Override
            protected Object doInvoke(T proxy, String methodName,
                                      Class<?>[] parameterTypes,
                                      Object[] arguments) throws Throwable {
                Method method = proxy.getClass().getMethod(methodName, parameterTypes);
                return method.invoke(proxy, arguments);
            }
        };
    }
}
```
