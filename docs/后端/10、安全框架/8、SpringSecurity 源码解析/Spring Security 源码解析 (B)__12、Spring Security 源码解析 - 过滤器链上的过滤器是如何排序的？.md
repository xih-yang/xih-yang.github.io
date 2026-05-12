# 12、Spring Security 源码解析 - 过滤器链上的过滤器是如何排序的？
- 来源：https://ddkk.com/zhuanlan/security/springsecurity/10/12.html
- 分类：安全框架
- 分组：Spring Security 源码解析 (B)
## 一、框架原理

### 概述

> 前面源码篇文章（篇尾附上链接）提到，整个框架的核心就是一个过滤器 FilterChainProxy，这个过滤器维护了一组过滤器链，真正起作用的其实是这个过滤器里的过滤器链。我们知道过滤器链可是有执行顺序的，关于它是如何排序的，本篇来聊聊。

### 过滤器链实战示例

> 先来看看一个请求进来需要走过的过滤器链有哪些，以下为前面实战篇（篇尾附上链接）中过滤器链debug截图，断点打在核心过滤器 FilterChainProxy 的 doFilter() 上，自行走一下代码，会发现请求需要经过如下过滤器：

> 可以看到很多熟悉的过滤器，包括我们自己定义的两个过滤器 UserAuthenticationFilter、JwtAuthenticationFilter

## 二、FilterComparator

> 内部其实是使用这个类来对Filter的实例进行排序，以确保它们的顺序正确。

### 源码

```java
final class FilterComparator implements Comparator<Filter>, Serializable {
	private static final int STEP = 100;
	private Map<String, Integer> filterToOrder = new HashMap<String, Integer>();
	FilterComparator() {
		int order = 100;
		put(ChannelProcessingFilter.class, order);
		order += STEP;
		put(ConcurrentSessionFilter.class, order);
		order += STEP;
		put(WebAsyncManagerIntegrationFilter.class, order);
		order += STEP;
		put(SecurityContextPersistenceFilter.class, order);
		order += STEP;
		put(HeaderWriterFilter.class, order);
		order += STEP;
		put(CorsFilter.class, order);
		order += STEP;
		put(CsrfFilter.class, order);
		order += STEP;
		put(LogoutFilter.class, order);
		order += STEP;
		put(X509AuthenticationFilter.class, order);
		order += STEP;
		put(AbstractPreAuthenticatedProcessingFilter.class, order);
		order += STEP;
		filterToOrder.put("org.springframework.security.cas.web.CasAuthenticationFilter",
				order);
		order += STEP;
		put(UsernamePasswordAuthenticationFilter.class, order);
		order += STEP;
		put(ConcurrentSessionFilter.class, order);
		order += STEP;
		filterToOrder.put(
				"org.springframework.security.openid.OpenIDAuthenticationFilter", order);
		order += STEP;
		put(DefaultLoginPageGeneratingFilter.class, order);
		order += STEP;
		put(ConcurrentSessionFilter.class, order);
		order += STEP;
		put(DigestAuthenticationFilter.class, order);
		order += STEP;
		put(BasicAuthenticationFilter.class, order);
		order += STEP;
		put(RequestCacheAwareFilter.class, order);
		order += STEP;
		put(SecurityContextHolderAwareRequestFilter.class, order);
		order += STEP;
		put(JaasApiIntegrationFilter.class, order);
		order += STEP;
		put(RememberMeAuthenticationFilter.class, order);
		order += STEP;
		put(AnonymousAuthenticationFilter.class, order);
		order += STEP;
		put(SessionManagementFilter.class, order);
		order += STEP;
		put(ExceptionTranslationFilter.class, order);
		order += STEP;
		put(FilterSecurityInterceptor.class, order);
		order += STEP;
		put(SwitchUserFilter.class, order);
	}
	public int compare(Filter lhs, Filter rhs) {
		Integer left = getOrder(lhs.getClass());
		Integer right = getOrder(rhs.getClass());
		return left - right;
	}
	/**
	 * Determines if a particular {@link Filter} is registered to be sorted
	 *
	 * @param filter
	 * @return
	 */
	public boolean isRegistered(Class<? extends Filter> filter) {
		return getOrder(filter) != null;
	}
	/**
	 * Registers a {@link Filter} to exist after a particular {@link Filter} that is
	 * already registered.
	 * @param filter the {@link Filter} to register
	 * @param afterFilter the {@link Filter} that is already registered and that
	 * {@code filter} should be placed after.
	 */
	public void registerAfter(Class<? extends Filter> filter,
			Class<? extends Filter> afterFilter) {
		Integer position = getOrder(afterFilter);
		if (position == null) {
			throw new IllegalArgumentException(
					"Cannot register after unregistered Filter " + afterFilter);
		}
		put(filter, position + 1);
	}
	/**
	 * Registers a {@link Filter} to exist at a particular {@link Filter} position
	 * @param filter the {@link Filter} to register
	 * @param atFilter the {@link Filter} that is already registered and that
	 * {@code filter} should be placed at.
	 */
	public void registerAt(Class<? extends Filter> filter,
			Class<? extends Filter> atFilter) {
		Integer position = getOrder(atFilter);
		if (position == null) {
			throw new IllegalArgumentException(
					"Cannot register after unregistered Filter " + atFilter);
		}
		put(filter, position);
	}
	/**
	 * Registers a {@link Filter} to exist before a particular {@link Filter} that is
	 * already registered.
	 * @param filter the {@link Filter} to register
	 * @param beforeFilter the {@link Filter} that is already registered and that
	 * {@code filter} should be placed before.
	 */
	public void registerBefore(Class<? extends Filter> filter,
			Class<? extends Filter> beforeFilter) {
		Integer position = getOrder(beforeFilter);
		if (position == null) {
			throw new IllegalArgumentException(
					"Cannot register after unregistered Filter " + beforeFilter);
		}
		put(filter, position - 1);
	}
	private void put(Class<? extends Filter> filter, int position) {
		String className = filter.getName();
		filterToOrder.put(className, position);
	}
	/**
	 * Gets the order of a particular {@link Filter} class taking into consideration
	 * superclasses.
	 *
	 * @param clazz the {@link Filter} class to determine the sort order
	 * @return the sort order or null if not defined
	 */
	private Integer getOrder(Class<?> clazz) {
		while (clazz != null) {
			Integer result = filterToOrder.get(clazz.getName());
			if (result != null) {
				return result;
			}
			clazz = clazz.getSuperclass();
		}
		return null;
	}
}
```

### 说明

- 可以看到该类被实例化的时候，就将框架中存在的过滤器都设置了一个顺序值，保存在 filterToOrder。
- 该类还实现了Comparator接口，实现了它的 compare() 方法，里面是根据过滤器的顺序值进行排序的。
- 类中提供了一些给外部添加过滤器的接口，比如：
- `registerBefore(Filter filter, Filter beforeFilter)`：在beforeFilter过滤器之前添加过滤器。
- `registerAfter(Filter filter, Filter afterFilter)`：在afterFilter过滤器之后添加过滤器。
- `registerAt(Filter filter, Filter atFilter)`：加入和atFilter过滤器相同顺序的过滤器。

### 自定义过滤器顺序设置

- 在登录过滤器配置UserLoginConfigurer 中配置 UserAuthenticationFilter 过滤器顺序：

```java
@Override
public void configure(B http) throws Exception {
    UserAuthenticationFilter authFilter = new UserAuthenticationFilter();
    authFilter.setAuthenticationManager(http.getSharedObject(AuthenticationManager.class));
    authFilter.setSessionAuthenticationStrategy(new NullAuthenticatedSessionStrategy());
    // 登录成功处理器
    authFilter.setAuthenticationSuccessHandler(new UserLoginSuccessHandler(securityConfig));
    // 登录失败处理器
    authFilter.setAuthenticationFailureHandler(new HttpStatusLoginFailureHandler());
    // 拦截器位置
    UserAuthenticationFilter filter = postProcess(authFilter);
    http.addFilterAfter(filter, LogoutFilter.class);
}
```

- 点进 addFilterAfter() 方法查看，其实调用的就是 FilterComparator 中的方法：

```java
public HttpSecurity addFilterAfter(Filter filter, Class<? extends Filter> afterFilter) {
    comparator.registerAfter(filter.getClass(), afterFilter);
    return addFilter(filter);
}
```

## 三、如何排序

> 上面小节只是给过滤器加上一个顺序，而对于我们的过滤器链并没有排序，实际上过滤器链还没生成呢，在启动项目的时候才开始创建过滤器，来看看创建过程中是如何对过滤器进行排序的。

### 实际排序

- 还记得实际上过滤器是在哪创建的吗，在[《Spring Security源码（五）：FilterChainProxy是如何创建的？》](/zhuanlan/security/springsecurity/10/8.html)一章中提到过，过滤器是在 HttpSecurity 中的 performBuild()方法中创建的，可以看到在这里会把已经创建好保存到 filters 中的过滤器进行排序，其实就是每创建一个过滤器都对过滤器链进行一个排序。

```java
@Override
protected DefaultSecurityFilterChain performBuild() throws Exception {
    Collections.sort(filters, comparator);
    return new DefaultSecurityFilterChain(requestMatcher, filters);
}
```

### FilterSecurityInterceptor

> 这是一个特殊的过滤器，特殊在每条过滤器链都是以这个过滤器结尾，这个过滤器是Spring Security框架做权限访问控制的核心过滤器，请求最后能否通过是否有权限访问后台资源都是由它决定，关于这个过滤器咱们下一篇详细讲解，链接在篇尾。
