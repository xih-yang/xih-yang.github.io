# 05、Spring Security 源码解析 - 建造者详解
- 来源：https://ddkk.com/zhuanlan/security/springsecurity/10/5.html
- 分类：安全框架
- 分组：Spring Security 源码解析 (B)
## 〇、上篇回顾

- 整个框架的核心就是构建一个名字为 springSecurityFilterChain 的过滤器，它的类型是 FilterChainProxy 。
- WebSecurity 和 HttpSecurity 都是 建造者
- WebSecurity 的构建目标是 FilterChainProxy 对象，即核心过滤器 springSecurityFilterChain
- HttpSecurity 的构建目标只是 FilterChainProxy 对象中一组 SecurityFilterChain 的一个

## 一、建造者接口架构

### 建造者整体UML图

> 在介绍 WebSecurity 和 HttpSecurity 之前我们先来看看它们上层的类和接口。AuthenticationManagerBuilder 先放放，后面讲解如何认证授权时详细介绍。

### 上层UML类图

### 1. SecurityBuilder

- 说明：可以看上面UML类图，是建造者顶级接口，含有一个 build() 接口方法
- 源码：

```java
public interface SecurityBuilder<O> {
	O build() throws Exception;
}
```

### 2. AbstractSecurityBuilder

- 说明：SecurityBuilder的抽象子类，确保建造者只被构建一次，对父接口方法 build() 进行了原子判断，保证每次只构建一次，定义了一个抽象方法 doBuild() 供子类扩展
- 源码：

```java
public abstract class AbstractSecurityBuilder<O> implements SecurityBuilder<O> {
	private AtomicBoolean building = new AtomicBoolean();
	private O object;
	public final O build() throws Exception {
		if (this.building.compareAndSet(false, true)) {
			this.object = doBuild();
			return this.object;
		}
		throw new AlreadyBuiltException("This object has already been built");
	}
	public final O getObject() {
		if (!this.building.get()) {
			throw new IllegalStateException("This object has not been built");
		}
		return this.object;
	}
	protected abstract O doBuild() throws Exception;
}
```

### 3. AbstractConfiguredSecurityBuilder

- 说明：主要关注 add()、doBuild()、init()、configure()、performBuild()
- `add()` ：允许配置器应用到建造者中，实际上就是把各种配置添加到该类定义的配置器列表 configurers、configurersAddedInInitializing
- `doBuild()`：实现的父类方法，真正执行构建的方法，方法中调用了 init()、configure()
- `init()`：循环初始化所有的 configurers、configurersAddedInInitializing 配置
- `configure()`：循环配置所有的 configurers
- `performBuild()`：配置完所有之后，进行实际的执行，该方法是抽象方法，`留给下层子类（WebSecurity、HttpSecurity）` 实现
- 源码：

```java
public abstract class AbstractConfiguredSecurityBuilder<O, B extends SecurityBuilder<O>>
		extends AbstractSecurityBuilder<O> {
	private final LinkedHashMap<Class<? extends SecurityConfigurer<O, B>>, List<SecurityConfigurer<O, B>>> configurers = new LinkedHashMap<Class<? extends SecurityConfigurer<O, B>>, List<SecurityConfigurer<O, B>>>();
	private final List<SecurityConfigurer<O, B>> configurersAddedInInitializing = new ArrayList<SecurityConfigurer<O, B>>();
	@SuppressWarnings("unchecked")
	private <C extends SecurityConfigurer<O, B>> void add(C configurer) throws Exception {
		Assert.notNull(configurer, "configurer cannot be null");
		Class<? extends SecurityConfigurer<O, B>> clazz = (Class<? extends SecurityConfigurer<O, B>>) configurer
				.getClass();
		synchronized (configurers) {
			if (buildState.isConfigured()) {
				throw new IllegalStateException("Cannot apply " + configurer
						+ " to already built object");
			}
			List<SecurityConfigurer<O, B>> configs = allowConfigurersOfSameType ? this.configurers
					.get(clazz) : null;
			if (configs == null) {
				configs = new ArrayList<SecurityConfigurer<O, B>>(1);
			}
			configs.add(configurer);
			this.configurers.put(clazz, configs);
			if (buildState.isInitializing()) {
				this.configurersAddedInInitializing.add(configurer);
			}
		}
	}
	@Override
	protected final O doBuild() throws Exception {
		synchronized (configurers) {
			buildState = BuildState.INITIALIZING;
			beforeInit();
			init();
			buildState = BuildState.CONFIGURING;
			beforeConfigure();
			configure();
			buildState = BuildState.BUILDING;
			O result = performBuild();
			buildState = BuildState.BUILT;
			return result;
		}
	}
	protected abstract O performBuild() throws Exception;
	@SuppressWarnings("unchecked")
	private void init() throws Exception {
		Collection<SecurityConfigurer<O, B>> configurers = getConfigurers();
		for (SecurityConfigurer<O, B> configurer : configurers) {
			configurer.init((B) this);
		}
		for (SecurityConfigurer<O, B> configurer : configurersAddedInInitializing) {
			configurer.init((B) this);
		}
	}
	@SuppressWarnings("unchecked")
	private void configure() throws Exception {
		Collection<SecurityConfigurer<O, B>> configurers = getConfigurers();
		for (SecurityConfigurer<O, B> configurer : configurers) {
			configurer.configure((B) this);
		}
	}
}
```

### 4. HttpSecurityBuilder

- 说明：该接口被 HttpSecurity 所实现，主要声明了一些操作 Filter 的接口方法。
- 源码：

```java
public interface HttpSecurityBuilder<H extends HttpSecurityBuilder<H>> extends
		SecurityBuilder<DefaultSecurityFilterChain> {
	<C extends SecurityConfigurer<DefaultSecurityFilterChain, H>> C getConfigurer(
			Class<C> clazz);
	<C extends SecurityConfigurer<DefaultSecurityFilterChain, H>> C removeConfigurer(
			Class<C> clazz);
	<C> void setSharedObject(Class<C> sharedType, C object);
	<C> C getSharedObject(Class<C> sharedType);
	H authenticationProvider(AuthenticationProvider authenticationProvider);
	H userDetailsService(UserDetailsService userDetailsService) throws Exception;
	H addFilterAfter(Filter filter, Class<? extends Filter> afterFilter);
	H addFilterBefore(Filter filter, Class<? extends Filter> beforeFilter);
	H addFilter(Filter filter);
}
```

## 二、FilterChainProxy

> 在介绍主要建造者之前先看看核心过滤器 springSecurityFilterChain 的类型 FilterChainProxy

### 类介绍

- 继承了 GenericFilterBean 类，这个类实现了 Filter 接口，所以 FilterChainProxy 也是个过滤器。
- 它其实是过滤器链的一个代理，真正起作用的是它内部维护的一组 SecurityFilterChain 过滤器链，SecurityFilterChain 是一个接口，有个默认实现类 DefaultSecurityFilterChain ，实现类里面主要是一组 URL 和一组 过滤器。

### UML类图

### 说明

- 类图中很清晰表示，FilterChainProxy 一对多组合了 SecurityFilterChain，SecurityFilterChain 里面有一组 Filter 和一组 URL。

## 三、WebSecurity

### 类介绍

- WebSecurity 的目标是构建 FilterChainProxy 对象，即构建核心过滤器 springSecurityFilterChain。

### 方法属性

### 说明

- 主要关注由 AbstractConfiguredSecurityBuilder 继承下来的方法实现 performBuild()
- 方法中首先创建了一个 securityFilterChains
- 然后第一个for循环将那些忽略拦截的URL封装成一堆 DefaultSecurityFilterChain 添加进 securityFilterChains
- 第二个for循环调用的是 build() 方法，其实它最终调用的是 HttpSecurity 实现的 performBuild() 方法，返回值也是 DefaultSecurityFilterChain，随后添加进 securityFilterChains
- 最后根据 securityFilterChains 创建出 FilterChainProxy 对象。

```java
public final class WebSecurity extends
		AbstractConfiguredSecurityBuilder<Filter, WebSecurity> implements
		SecurityBuilder<Filter>, ApplicationContextAware {
	private final List<RequestMatcher> ignoredRequests = new ArrayList<RequestMatcher>();
	private final List<SecurityBuilder<? extends SecurityFilterChain>> securityFilterChainBuilders = new ArrayList<SecurityBuilder<? extends SecurityFilterChain>>();
	...
	@Override
	protected Filter performBuild() throws Exception {
		Assert.state(
				!securityFilterChainBuilders.isEmpty(),
				"At least one SecurityBuilder<? extends SecurityFilterChain> needs to be specified. Typically this done by adding a @Configuration that extends WebSecurityConfigurerAdapter. More advanced users can invoke "
						+ WebSecurity.class.getSimpleName()
						+ ".addSecurityFilterChainBuilder directly");
		int chainSize = ignoredRequests.size() + securityFilterChainBuilders.size();
		List<SecurityFilterChain> securityFilterChains = new ArrayList<SecurityFilterChain>(
				chainSize);
		for (RequestMatcher ignoredRequest : ignoredRequests) {
			securityFilterChains.add(new DefaultSecurityFilterChain(ignoredRequest));
		}
		for (SecurityBuilder<? extends SecurityFilterChain> securityFilterChainBuilder : securityFilterChainBuilders) {
			securityFilterChains.add(securityFilterChainBuilder.build());
		}
		FilterChainProxy filterChainProxy = new FilterChainProxy(securityFilterChains);
		if (httpFirewall != null) {
			filterChainProxy.setFirewall(httpFirewall);
		}
		filterChainProxy.afterPropertiesSet();
		Filter result = filterChainProxy;
		if (debugEnabled) {
			logger.warn("\n\n"
					+ "********************************************************************\n"
					+ "**********        Security debugging is enabled.       *************\n"
					+ "**********    This may include sensitive information.  *************\n"
					+ "**********      Do not use in a production system!     *************\n"
					+ "********************************************************************\n\n");
			result = new DebugFilter(filterChainProxy);
		}
		postBuildAction.run();
		return result;
	}
	...
}
```

## 四、HttpSecurity

> 要会用此框架，必须知道 HttpSecurity ！！！

- 它的目标是构建一个 SecurityFilterChain 过滤器链实例，它 掌握着所有Filter的“生杀大权”，想要谁过滤就配置起来，不想要谁过滤就不配置或者禁用掉（因为有些会被默认配置）。
- 大致可以将其内方法分为两大类型，一类是框架默认给开发者提供的认证配置方法，可供开发者选择性调用，比如：

> formLogin()、openidLogin()、headers()、cors()、sessionManagement()、portMapper()、jee()、x509()、rememberMe()、authorizeRequests()、requestCache()、exceptionHandling()、securityContext()、servletApi()、csrf()、logout()、anonymous()、requiresChannel()、httpBasic()、requestMatchers()、addFilterAt()、requestMatcher()、antMatcher()、mvcMatcher()、regexMatcher()、getOrApply()

- 还有一类 可供开发者配置自己的过滤器，比如：

> setSharedObject()、beforeConfigure()、authenticationProvider()、userDetailsService()、getAuthenticationRegistry()、addFilterAfter()、addFilterBefore()、addFilter()

- 还有一个方法 performBuild() ，和 WebSecurity 一样继承自 AbstractConfiguredSecurityBuilder ，目的是创建 SecurityFilterChain 实例。

> 由于该类功能强大、复杂又必须了解，故新开一章专门讲述 HttpSecurity 里面各个方法。
