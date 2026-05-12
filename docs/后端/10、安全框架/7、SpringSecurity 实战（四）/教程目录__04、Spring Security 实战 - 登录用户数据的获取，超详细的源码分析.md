# 04、Spring Security 实战 - 登录用户数据的获取，超详细的源码分析
- 来源：https://ddkk.com/zhuanlan/security/springsecurity/11/4.html
- 分类：安全框架
- 分组：教程目录
在[【Spring Security 实战（一）】Spring Security的整体架构](/zhuanlan/security/springsecurity/11/1.html?spm=1001.2014.3001.5501) 中叙述过一个SecurityContextHolder 这个类。说在处理请求时，Spring Security 会先从 Session 中取出用户登录数据，保存到 SecurityContextHolder 中，然后在请求处理完毕后，又会拿 SecurityContextHolder 中的数据保存到 Session 中，然后再清空 SecurityContextHolder 中的数据。且说了 SecurityContextHolder 内部数据保存默认是通过 ThreadLocal 来实现的。

下面分析 SecurityContextHolder 的源码，并述说如何在代码中获取登录用户的数据。

**(如果不想看源码分析的可以直接跳过看怎么获取用户数据）**

## 一、SecurityContextHolder 源码分析

在分析源码之前，可以看一下下面这个图，它展示了 SecurityContextHolder 和 用户数据信息 的结构关系。SecurityContextHolder 依赖 SecurityContext，SecurityContext 封装了 Authentication，而Authentication 即是我们所指的认证后的用户数据信息。（从这关系以及上面的分析，大概应该可以猜测到 `SecurityContextHolder` 中用了策略设计模式，命名也都很规范化，~ Context，~ ContextHolder🤣）

> 策略模式（Strategy）：它定义了算法家族，分别封装起来，让它们之间可以互相替换，此模式让算法的变化，不会影响到使用算法的客户。

既然说它用了策略模式，那SecurityContextHolder中定义的算法家族呢？下面来看一下SecurityContextHolder类中的属性。

```java
public class SecurityContextHolder {
	// 指的是算法策略中的ThreadLocalSecurityContextHolderStrategy
	public static final String MODE_THREADLOCAL = "MODE_THREADLOCAL";
	//InheritableThreadLocalSecurityContextHolderStrategy
	public static final String MODE_INHERITABLETHREADLOCAL = "MODE_INHERITABLETHREADLOCAL";
	// GlobalSecurityContextHolderStrategy
	public static final String MODE_GLOBAL = "MODE_GLOBAL";
	// 这个表示不适用任何策略，用原先的HttpSession
	private static final String MODE_PRE_INITIALIZED = "MODE_PRE_INITIALIZED";
	// 配置名称
	public static final String SYSTEM_PROPERTY = "spring.security.strategy";
	// 首先是从系统配置中获取
	// idea中可以在vmoptions中进行配置，
	// 例如：-Dspring.security.strategy=MODE_THREADLOCAL
	private static String strategyName = System.getProperty(SYSTEM_PROPERTY);
	private static SecurityContextHolderStrategy strategy;
}
```

可以看见有一个 `SecurityContextHolderStrategy` 对象 strategy，它就是“算法的封装体”。SecurityContextHolderStrategy 是一个接口，下面是其源代码，比较简单。

```java
public interface SecurityContextHolderStrategy {
	// 清除SecurityContext
	void clearContext();
	// 获取SecurityContext
	SecurityContext getContext();
	// 存取SecurityContext
	void setContext(SecurityContext context);
	// 得到一个空的SecurityContext
	SecurityContext createEmptyContext();
}
```

看下图可以知道算法家族的成员。

- ThreadLocalSecurityContextHolderStrategy：存储数据的载体是一个 ThreadLocal，所以针对 SecurityContext 的清空、获取以及存储，都是在 ThreadLocal 中进行操作。源码过于简单，不分析了，自己看吧。
- InheritableThreadLocalSecurityContextHolderStrategy：和前者实现策略没有区别，只不过用的是ThreadLocal的子类InheritableThreadLocal，这样子线程和父线程都可以获取到用户数据了。源码也没啥，自己看看就OK了。
- GlobalSecurityContextHolderStrategy：它实现起来就更更更简单了，直接用个静态变量保存 SecurityContext，所以多线程环境下它是可以使用了，但一般在web开发中，这肯定是使用的少的。
- ListeningSecurityContextHolderStrategy：SecurityContext 的事件监听策略，它是5.6版本后推出来放到SecurityContextHolderStrategy 策略中的。《深入浅出 Spring Security》书中并没有提到它，但我还是有必要了解的。**使用它可以在不去配置系统配置的情况下更换策略，也可以监听 SecurityContext 的创建和销毁事件**。注意这里没有获取事件。
- 它构造方法进行了重载，可以看一下（有些构造源码上说5.7更新的，不管了，现在都 6点 多了），一些判断是否为空的代码我就去调了，留核心代码。

```java
public final class ListeningSecurityContextHolderStrategy implements SecurityContextHolderStrategy {
	// 监听器集合
	private final Collection<SecurityContextChangedListener> listeners;
	// 委托策略对象，默认的话也是ThreadLocalSecurityContextHolderStrategy
	private final SecurityContextHolderStrategy delegate;
	public ListeningSecurityContextHolderStrategy(Collection<SecurityContextChangedListener> listeners) {
		this(new ThreadLocalSecurityContextHolderStrategy(), listeners);
	}
	public ListeningSecurityContextHolderStrategy(SecurityContextChangedListener... listeners) {
		this(new ThreadLocalSecurityContextHolderStrategy(), listeners);
	}
	public ListeningSecurityContextHolderStrategy(SecurityContextHolderStrategy delegate,
			Collection<SecurityContextChangedListener> listeners) {
		this.delegate = delegate;
		this.listeners = listeners;
	}
// 可变参数重载，可进行配置自己想要的策略对象(delegate)
	public ListeningSecurityContextHolderStrategy(SecurityContextHolderStrategy delegate,
			SecurityContextChangedListener... listeners) {
		this.delegate = delegate;
		this.listeners = Arrays.asList(listeners);
	}
```

在看看它的其他源码，在创建和销毁 SecurityContext 的时候会调用监听器去监听。

```java
@Override
public void clearContext() {
    SecurityContext from = getContext();
    this.delegate.clearContext();
    publish(from, null);
}
@Override
public SecurityContext getContext() {
    return this.delegate.getContext();
}
@Override
public void setContext(SecurityContext context) {
    SecurityContext from = getContext();
    this.delegate.setContext(context);
    publish(from, context);
}
@Override
public SecurityContext createEmptyContext() {
    return this.delegate.createEmptyContext();
}
// 执行监听措施
private void publish(SecurityContext previous, SecurityContext current) {
    if (previous == current) {
        return;
    }
    SecurityContextChangedEvent event = new SecurityContextChangedEvent(previous, current);
    for (SecurityContextChangedListener listener : this.listeners) {
        listener.securityContextChanged(event);
    }
}
```

监听器SecurityContextChangedEvent 是一个函数式接口，咱配置的时候直接使用 lambda 就好了。

讲了半天的策略，回归策略的封装者 SecurityContextHolder。来看看它的初始化操作，它是提供了一个静态代码块，执行初始化。

```java
static {
    initialize();
}
private static void initialize() {
    initializeStrategy();
    initializeCount++;
}
private static void initializeStrategy() {
// 首先判断是否是不使用策略
    if (MODE_PRE_INITIALIZED.equals(strategyName)) {
        Assert.state(strategy != null, "When using " + MODE_PRE_INITIALIZED
                + ", setContextHolderStrategy must be called with the fully constructed strategy");
        return;
    }
    // 然后判断是否为空，为空就默认设置为ThreadLocalSecurity...
    if (!StringUtils.hasText(strategyName)) {
        // Set default
        strategyName = MODE_THREADLOCAL;
    }
    // 这后面就一系列的判断没啥。
    if (strategyName.equals(MODE_THREADLOCAL)) {
        strategy = new ThreadLocalSecurityContextHolderStrategy();
        return;
    }
    if (strategyName.equals(MODE_INHERITABLETHREADLOCAL)) {
        strategy = new InheritableThreadLocalSecurityContextHolderStrategy();
        return;
    }
    if (strategyName.equals(MODE_GLOBAL)) {
        strategy = new GlobalSecurityContextHolderStrategy();
        return;
    }
    // Try to load a custom strategy
    try {
    // 如果以上都没匹配到的话，就默认使用的是类的全路径引出策略
    // 通过反射去构造
        Class<?> clazz = Class.forName(strategyName);
        Constructor<?> customStrategy = clazz.getConstructor();
        strategy = (SecurityContextHolderStrategy) customStrategy.newInstance();
    }
    catch (Exception ex) {
        ReflectionUtils.handleReflectionException(ex);
    }
}
```

了解了其如何进行初始化的后，那就好办了，直接看它内部方法吧。其内部方法都是静态的。

```java
// 清除SecurityContext
public static void clearContext() {
		strategy.clearContext();
	}
// 获取SecurityContext
	public static SecurityContext getContext() {
		return strategy.getContext();
	}
// 初始化次数，emmm，发送请求的次数？
	public static int getInitializeCount() {
		return initializeCount;
	}
// 配置SecurityContext
	public static void setContext(SecurityContext context) {
		strategy.setContext(context);
	}
// 配置StrategyName
	public static void setStrategyName(String strategyName) {
		SecurityContextHolder.strategyName = strategyName;
		initialize();
	}
// 出于5.6版本，估计是让你更好的配置监听策略用的，事实上也就这个方法可以做到了
	public static void setContextHolderStrategy(SecurityContextHolderStrategy strategy) {
		Assert.notNull(strategy, "securityContextHolderStrategy cannot be null");
		SecurityContextHolder.strategyName = MODE_PRE_INITIALIZED;
		SecurityContextHolder.strategy = strategy;
		initialize();
	}
// 获取策略对象
	public static SecurityContextHolderStrategy getContextHolderStrategy() {
		return strategy;
	}
// 创建空的SecurityContext
// 也就是创建SecurityContextImpl
	public static SecurityContext createEmptyContext() {
		return strategy.createEmptyContext();
	}
```

源码分析到这，差不多就很清晰了，再看看SecurityContextImpl的源码吧，其实不用看也知道，就是 `Authentication` 对象的封装，这看一下属性和构造就差不多可以猜到大概了。

**最后还需要注意：ThreadLocalSecurityContextHolderStrategy、InheritableThreadLocalSecurityContextHolderStrategy、GlobalSecurityContextHolderStrategy 访问权限都是default默认的，不是本包下的是不让new的，也就是对外不让实例化，你只能通过它给的进行对内策略更改。**

### ListeningSecurityContextHolderStrategy 使用案例

```java
@Component
@Slf4j
public class InitCommandRun implements CommandLineRunner {
    @Override
    public void run(String... args) throws Exception {
// 配置 InheritableThreadLocalSecurityContextHolderStrategy        
SecurityContextHolder.setStrategyName(SecurityContextHolder.MODE_INHERITABLETHREADLOCAL);
// 去获取这个策略对象
        SecurityContextHolderStrategy initStrategy = SecurityContextHolder.getContextHolderStrategy();
        // 将获取到的策略对象用到监听策略中，当委托策略
        SecurityContextHolderStrategy strategy = new ListeningSecurityContextHolderStrategy(
                initStrategy,
                event -> {
            if(event.getNewContext() != null)
                log.warn("new context->{}",event.getNewContext());
        });
        SecurityContextHolder.setContextHolderStrategy(strategy);
    }
}
```

测试结果

### SecurityContextPersistenceFilter 说明

Persistence（持久性）。

在[【Spring Security 实战（二）】Spring Security的实现原理](/zhuanlan/security/springsecurity/11/2.html?spm=1001.2014.3001.5501) 中概述了Spring Security 中默认加载的过滤器，SecurityContextPersistenceFilter 即是其中的一员。它的作用是为了存储 SecurityContext 而设计的。

它整体来说做了两件事：

- 当一个请求到来时，从 HttpSession 中获取 SecurityContext 并存入 SecurityContextHolder 中，这样在同一个请求的后续处理过程中，开发者始终可以通过 SecurityContextHolder 获取到当前登录用户信息。
- 当一个请求处理完毕时，从 SecurityContextHolder 中获取 SecurityContext 并存入 HttpSession 中（主要针对异步 Servlet，不是异步的相应提交自动就会保存到HttpSession中），方便下一个请求到来时，再从 HttpSession 中拿出来使用，同时擦除 SecurityContextHolder 中的登录用户信息。

下面是SecurityContextPersistenceFilter 过滤器的核心代码（下面出现的 `repo` 是 SecurityContextRepository 对象，默认是`HttpSessionSecurityContextRepository`对象）：

```java
private void doFilter(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
        throws IOException, ServletException {
    // 获取 SecurityContext 对象
    HttpRequestResponseHolder holder = new HttpRequestResponseHolder(request, response);
    SecurityContext contextBeforeChainExecution = this.repo.loadContext(holder);
    try {
    // 存入到 SecurityContextHolder 中
        SecurityContextHolder.setContext(contextBeforeChainExecution);
        // 让下一个过滤器处理请求
        chain.doFilter(holder.getRequest(), holder.getResponse());
    }
    finally {
    // 请求结束后清楚SecurityContextHolder 中的用户信息
    // 并把信息保存在HttpSession中
        SecurityContext contextAfterChainExecution = SecurityContextHolder.getContext();
        // Crucial removal of SecurityContextHolder contents before anything else.
        SecurityContextHolder.clearContext();
        this.repo.saveContext(contextAfterChainExecution, holder.getRequest(), holder.getResponse());
        request.removeAttribute(FILTER_APPLIED);
    }
}
```

注意：`SecurityContextPersistenceFilter`被标记为已过时（Deprecated），但它仍然被包含在Spring Security默认的过滤器链中。这是因为虽然存在一些问题，但它仍然是一个广泛使用的过滤器，并且在某些情况下仍然是有用的。新版本是去拿 PersistentTokenBasedRememberMeServices 去取代它。

## 二、登录用户数据的获取

通过上面的源码分析呢？咱可以知道如何获取用户信息了（Authentication）。

调用SecurityContextHolder 中的 `getContext()` 静态方法获取其对应策略中保存的 SecurityContext 对象，再调用 `getAuthentication()` 方法获取 Authentication 对象。

```java
@RestController
public class TestController {
    @GetMapping("/test")
    public Object test(){
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        User user = (User) authentication.getPrincipal();
        /*return "Spring Security Test Success！";*/
        return user;
    }
}
```

getPrincipal() 是去获取主要的用户信息，它是一个User对象，所以可以进行强转。

测试效果

由于我做了如下配置，所以即使在多线程情况下，也是可以使用的（子线程可以用父线程中的 SecurityContext）。

## 三、总结

- SecurityContextPersistenceFilter 完成了 SecurityContext 的存储和擦除；
- 在 5.6 版本（准确来说是5.7）后引入了 ListeningSecurityContextHolderStrategy 监听SecurityContext策略；
- 可以使用 SecurityContextHolder.getContext.getAuthentication() 的方式获取登录用户数据；
- SecurityContext 的存储和擦除内部用了策略设计模式，SecurityContextHolder 中定义了 SecurityContextHolderStrategy 策略，去获取、擦除、存储SecurityContext。

当使用ListeningSecurityContextHolderStrategy 时，可以向如下这样使用。当然它默认的执行策略是 ThreadLocalSecurity… ，所以当不需要换策略的话直接用监听器对象当构造参数构造即可，如果想切换成多线程，就像如下那样配置吧。

当然也可以去配置idea的vmoptions参数，但小编并不觉得它是个好主意。你觉得呢？
