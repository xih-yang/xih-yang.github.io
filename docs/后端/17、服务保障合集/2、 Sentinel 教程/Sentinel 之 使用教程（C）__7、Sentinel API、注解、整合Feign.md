# 7、Sentinel API、注解、整合Feign
- 来源：https://ddkk.com/zhuanlan/guarantee/sentinel/19.html
- 分类：服务保障
- 分组：Sentinel 之 使用教程（C）
## Sentinel API

这里介绍三个重要的API。

- ContextUtil
- Tracer
- SphU

```java
@GetMapping("/test-sentinel-api")
public String testSentinelApi(@RequestParam(required = false) String a) {
    //定义一个sentinel受保护的资源,名称是test-sentinel-api
    String resourceName = "test-sentinel-api";
    //
    ContextUtil.enter(resourceName, "test-wfw");
    Entry entry = null;
    try {
        entry = SphU.entry(resourceName);
        //被保护的逻辑
        if (StringUtils.isEmpty(a)) {
            throw new IllegalArgumentException("a is not null");
        }
        return a;
    } catch (BlockException be) {
        //如果受保护的资源被限流或者降级了 就会抛BlockException
        log.warn("限流或者降级了", be);
        return "限流或者降级了";
    } catch (IllegalArgumentException ie) {
        //统计 IllegalArgumentException 发生的次数、占比。。。
        Tracer.trace(ie);
        return "a is not null";
    } finally {
        if(entry != null) {
            //退出entry
            entry.exit();
        }
        ContextUtil.exit();
    }
}
```

## Sentinel 注解

属性
作用
是否必须

value
资源名称
是

entryType
entry类型，标记流量的方向，取值IN/OUT，默认是OUT
否

blockHandler
处理BlockException的函数名称。函数要求：1.必须是 public 2.返回类型与原方法一致 3.参数类型需要和原方法相匹配，并在最后加 BlockException 类型的参数。4.默认需和原方法在同一个类中。若希望使用其他类的函数，可配置 blockHandlerClass ，并指定blockHandlerClass里面的方法。
否

blockHandlerClass
存放blockHandler的类。对应的处理函数必须static修饰，否则无法解析，其他要求：同blockHandler。
否

fallback
用于在抛出异常的时候提供fallback处理逻辑。fallback函数可以针对所有类型的异常（除了 exceptionsToIgnore 里面排除掉的异常类型）进行处理。函数要求：1. 返回类型与原方法一致 2. 参数类型需要和原方法相匹配，Sentinel 1.6开始，也可在方法最后加 Throwable 类型的参数。3.默认需和原方法在同一个类中。若希望使用其他类的函数，可配置 fallbackClass ，并指定fallbackClass里面的方法。
否

fallbackClass【1.6】
存放fallback的类。对应的处理函数必须static修饰，否则无法解析，其他要求：同fallback。
否

defaultFallback【1.6】
用于通用的 fallback 逻辑。默认fallback函数可以针对所有类型的异常（除了 exceptionsToIgnore 里面排除掉的异常类型）进行处理。若同时配置了 fallback 和 defaultFallback，以fallback为准。函数要求：1. 返回类型与原方法一致 2. 方法参数列表为空，或者有一个 Throwable 类型的参数。3. 默认需要和原方法在同一个类中。若希望使用其他类的函数，可配置 fallbackClass ，并指定 fallbackClass 里面的方法。
否

exceptionsToIgnore【1.6】
指定排除掉哪些异常。排除的异常不会计入异常统计，也不会进入fallback逻辑，而是原样抛出。
否

exceptionsToTrace
需要trace的异常
Throwable

限流处理的方法。

```java
@GetMapping("/test-sentinel-resource")
@SentinelResource(value = "test-sentinel-resource",
        blockHandlerClass = TestBlock.class,
        blockHandler = "block",
        fallbackClass = TestFallBack.class,
        fallback = "fallBack"
)
public String testSentinelResource(@RequestParam(required = false) String a) {
    if (StringUtils.isEmpty(a)) {
        throw new IllegalArgumentException("a is not null");
    }
    return a;
}
```

限流处理类。

```java
@Slf4j
@Component
public class TestBlock {
    public static String block(String a, BlockException e) {
        log.warn("限流 或者 降级 block a:{}", a, e);
        return "限流 或者 降级 block";
    }
}
```

降级处理类。

```java
@Slf4j
@Component
public class TestFallBack {
    public static String fallBack(String a, Throwable e) {
        log.warn("限流 或者 降级 fall a:{}", a, e);
        return "限流 或者 降级 fall";
    }
}
```

TIPS

- 1.6.0 之前的版本 fallback 函数只针对降级异常（DegradeException）进行处理，不能针对业务异常进行处理。
- 若 blockHandler 和 fallback 都进行了配置，则被限流降级而抛出 BlockException 时只会进入 blockHandler 处理逻辑。若未配置 blockHandler、fallback 和 defaultFallback，则被限流降级时会将 BlockException 直接抛出。
- 从 1.4.0 版本开始，注解方式定义资源支持自动统计业务异常，无需手动调用 Tracer.trace(ex) 来记录业务异常。Sentinel 1.4.0 以前的版本需要自行调用 Tracer.trace(ex) 来记录业务异常。

## 源码解析

`SentinelResourceAspect` 是对 `@SentinelResource`的处理类

```java
@Aspect
public class SentinelResourceAspect extends AbstractSentinelAspectSupport {
    @Pointcut("@annotation(com.alibaba.csp.sentinel.annotation.SentinelResource)")
    public void sentinelResourceAnnotationPointcut() {
    }
    @Around("sentinelResourceAnnotationPointcut()")
    public Object invokeResourceWithSentinel(ProceedingJoinPoint pjp) throws Throwable {
        // 获取当前访问的方法
        Method originMethod = resolveMethod(pjp);
        // 获取方法上的SentinelResource注解
        SentinelResource annotation = originMethod.getAnnotation(SentinelResource.class);
        if (annotation == null) {
            // Should not go through here.
            throw new IllegalStateException("Wrong state for SentinelResource annotation");
        }
        // 获取资源名
        String resourceName = getResourceName(annotation.value(), originMethod);
        EntryType entryType = annotation.entryType();
        Entry entry = null;
        try {
            entry = SphU.entry(resourceName, entryType, 1, pjp.getArgs());
            Object result = pjp.proceed();
            return result;
        } catch (BlockException ex) {
            // 处理被限制的异常，回调事先配置的异常处理方法
            return handleBlockException(pjp, annotation, ex);
        } catch (Throwable ex) {
            Tracer.trace(ex);
            throw ex;
        } finally {
            if (entry != null) {
                entry.exit();
            }
        }
    }
}
```

- 使用aspect的around拦截，拦截标注有SentinelResource的注解
- 进入方法之前调用SphU.entry(resourceName, entryType)，结束之后调用entry.exit();
- 异常的时候调用handleBlockException方法

**handleBlockException**

通过反射获取到注解上配置的`fallback`方法

```java
    private Object handleBlockException(ProceedingJoinPoint pjp, SentinelResource annotation, BlockException ex)
        throws Exception {
        // Execute fallback for degrading if configured.
        Object[] originArgs = pjp.getArgs();
        if (isDegradeFailure(ex)) {
            Method method = extractFallbackMethod(pjp, annotation.fallback());
            if (method != null) {
                return method.invoke(pjp.getTarget(), originArgs);
            }
        }
        // Execute block handler if configured.
        Method blockHandler = extractBlockHandlerMethod(pjp, annotation.blockHandler(), annotation.blockHandlerClass());
        if (blockHandler != null) {
            // Construct args.
            Object[] args = Arrays.copyOf(originArgs, originArgs.length + 1);
            args[args.length - 1] = ex;
            if (isStatic(blockHandler)) {
                return blockHandler.invoke(null, args);
            }
            return blockHandler.invoke(pjp.getTarget(), args);
        }
        // If no block handler is present, then directly throw the exception.
        throw ex;
    }
```

## 整合 Feign

增加配置

```java
feign:
sentinel:
enabled: true
```

创建限流处理类

```java
@Slf4j
@Component
public class UserFallBackFactoryFeign implements FallbackFactory<UserFeign> {
    @Override
    public UserFeign create(Throwable throwable) {
        return id -> {
            log.warn("限流或降级 id:{}", id, throwable);
            User user = new User();
            user.setName("默认用户");
            return user;
        };
    }
}
@Slf4j
@Component
public class UserFallBackFeign implements UserFeign {
    @Override
    public User getUserById(Long id) {
        User user = new User();
        user.setName("默认用户");
        return user;
    }
}
```

feign 注解修改

> 需要注意的是 fallbackFactory 和 fallback 只能存在一个。

```java
@FeignClient(value = "user",
        //fallbackFactory = UserFallBackFactoryFeign.class,
        fallback = UserFallBackFeign.class
)
public interface UserFeign {
    @GetMapping("/user/{id}")
    User getUserById(@PathVariable Long id);
}
```

## 源码解析

我们先分析下Feign的整个构造流程。

- 从 @EnableFeignClients 注解可以看到，入口在该注解上的 FeignClientsRegistrar 类上。
- FeignClientsRegistrar实现了ImportBeanDefinitionRegistrar接口，用来了动态加载@FeignClient注解的接口并最终会被转换成 FeignClientFactoryBean 这个 FactoryBean，FactoryBean内部的 getObject 方法最终会返回一个 Proxy。
- 在构造 Proxy 的过程中会根据 org.springframework.cloud.openfeign.Targeter 接口的 target方法去构造。如果启动了hystrix开关(feign.hystrix.enabled=true)，会使用 HystrixTargeter，否则使用默认的 DefaultTargeter。
- Targeter 内部构造 Proxy 的过程中会使用 feign.Feign.Builder 去调用它的 build 方法构造 feign.Feign 实例(默认只有一个子类 ReflectiveFeign)。如果启动了 hystrix 开关(feign.hystrix.enabled=true)，会使用 feign.hystrix.HystrixFeign.Builder，否则使用默认的feign.Feign.Builder
- 构造出 feign.Feign 实例之后，调用 newInstance 方法返回一个 Proxy
- 简单看下这个 newInstance 方法内部的逻辑：

```java
    public <T> T newInstance(Target<T> target) {
        Map<String, MethodHandler> nameToHandler = this.targetToHandlersByName.apply(target);
        Map<Method, MethodHandler> methodToHandler = new LinkedHashMap();
        List<DefaultMethodHandler> defaultMethodHandlers = new LinkedList();
        Method[] var5 = target.type().getMethods();
        int var6 = var5.length;
        for(int var7 = 0; var7 < var6; ++var7) {
            Method method = var5[var7];
            if (method.getDeclaringClass() != Object.class) {
                if (Util.isDefault(method)) {
                    DefaultMethodHandler handler = new DefaultMethodHandler(method);
                    defaultMethodHandlers.add(handler);
                    methodToHandler.put(method, handler);
                } else {
                    methodToHandler.put(method, nameToHandler.get(Feign.configKey(target.type(), method)));
                }
            }
        }
		// 使用 InvocationHandlerFactory 根据接口的方法信息和 target 对象构造 InvocationHandler
        InvocationHandler handler = this.factory.create(target, methodToHandler);
        // 构造代理
        T proxy = Proxy.newProxyInstance(target.type().getClassLoader(), new Class[]{
       target.type()}, handler);
        Iterator var12 = defaultMethodHandlers.iterator();
        while(var12.hasNext()) {
            DefaultMethodHandler defaultMethodHandler = (DefaultMethodHandler)var12.next();
            defaultMethodHandler.bindTo(proxy);
        }
        return proxy;
    }
```

> 这里的 InvocationHandlerFactory 是通过构造 Feign 的时候传入的：

使用原生的 `DefaultTargeter`: 那么会使用 `feign.InvocationHandlerFactory.Default` 这个 `factory`，并且构造出来的 `InvocationHandler` 是 `feign.ReflectiveFeign.FeignInvocationHandler`。

使用 hystrix 的 HystrixTargeter: 那么会在feign.hystrix.HystrixFeign.Builder#build(feign.hystrix.FallbackFactory) 方法中调用父类的 invocationHandlerFactory方法传入一个匿名的 InvocationHandlerFactory 实现类，该类内部构造出的 InvocationHandler 为 HystrixInvocationHandler。

> 理解了Feign 的执行过程之后，Sentinel 想要整合 Feign，可以参考 Hystrix 的实现：

- 实现 Targeter 接口 SentinelTargeter。 很不幸，Targeter 这个接口属于包级别的接口，在外部包中无法使用，这个 Targeter 无法使用。没关系，我们可以沿用默认的HystrixTargeter(实际上会用DefaultTargeter)。
- FeignClientFactoryBean 内部构造 Targeter、feign.Feign.Builder 的时候，都会从 FeignContext 中获取。所以我们沿用默认的 DefaultTargeter 的时候，内部使用的 feign.Feign.Builder 可控，而且这个 Builder 不是包级别的类，可在外部使用。
- 创建 `SentinelFeign.Builder` 继承 `feign.Feign.Builder` ，用来构造 `Feign`。
- `SentinelFeign.Builder` 内部需要获取 `FeignClientFactoryBean`中的属性进行处理，比如获取 `fallback`, `name`, `fallbackFactory`。很不幸，`FeignClientFactoryBean` 这个类也是包级别的类。没关系，我们知道它存在在 `ApplicationContext` 中的 beanName， 拿到 bean 之后根据反射获取属性就行(该过程在初始化的时候进行，不会在调用的时候进行，所以不会影响性能)。
- `SentinelFeign.Builder` 调用 `build` 方法构造 `Feign` 的过程中，我们不需要实现一个新的 `Feign`，跟 `hystrix` 一样沿用 `ReflectiveFeign`即可，在沿用的过程中调用父类 `feign.Feign.Builder` 的一些方法进行改造即可，比如 `invocationHandlerFactory` 方法设置 `InvocationHandlerFactory` ，`contract` 的调用。
- 跟 hystrix 一样实现自定义的 `InvocationHandler` 接口 `SentinelInvocationHandler` 用来处理方法的调用。
- `SentinelInvocationHandler` 内部使用 Sentinel 进行保护，这个时候涉及到资源名的获取。`SentinelInvocationHandler` 内部的 `feign.Target` 能获取服务名信息，`feign.InvocationHandlerFactory.MethodHandler` 的实现类 `feign.SynchronousMethodHandler` 能拿到对应的请求路径信息。很不幸，`feign.SynchronousMethodHandler` 这个类也是包级别的类。没关系，我们可以自定义一个 `feign.Contract` 的实现类`SentinelContractHolder` 在处理 `MethodMetadata` 的过程把这些 metadata 保存下来(`feign.Contract` 这个接口在 `Builder` 构造 `Feign` 的过程中会对方法进行解析并验证)。
- 在 `SentinelFeign.Builder` 中调用 `contract` 进行设置，`SentinelContractHolder` 内部保存一个 `Contract` 使用委托方式不影响原先的 `Contract` 过程。

## 总结

**1、** Feign的内部很多类都是package级别的，外部package无法引用某些类，这个时候只能想办法绕过去，比如使用反射；

**2、** 目前这种实现有风险，万一哪天starter内部使用的Feign相关类变成了package级别，那么会改造代码所以把Sentinel的实现放到Feign里并给Feign官方提pr可能更加合适；

**3、** Feign的处理流程还是比较清晰的，只要能够理解其设计原理，我们就能容易地整合进去；
