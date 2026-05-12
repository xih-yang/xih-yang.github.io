# 19、SpringMVC源码分析 - FilterRegistrationBean的原理
- 来源：https://ddkk.com/zhuanlan/j2ee/springmvc/7/19.html
- 分类：J2EE框架
- 分组：教程目录
## 一、注册

```java
	@Bean
    public FilterRegistrationBean filterTestRegistrationBean(){
        FilterRegistrationBean filterRegistry = new FilterRegistrationBean();
        filterRegistry.setOrder(Ordered.HIGHEST_PRECEDENCE + 3);
        //注册过滤器
        filterRegistry.setFilter(new ShallowEtagHeaderFilter());
        filterRegistry.addUrlPatterns("/*");
        filterRegistry.setName("eTagFilter");
        return filterRegistry;
    }
```

## 二、流程分析

### 1.加载ServletContextInitializer

1、项目中使用的服务是undertow，所以就以服务undertow为例，

服务创建工厂UndertowServletWebServerFactory中的内部类Initializer，实现了ServletContainerInitializer接口，接口中就一个onStartup( )方法，会在服务创建过程中调用

```java
public void onStartup(Set<Class<?>> classes, ServletContext servletContext) throws ServletException {
			for (ServletContextInitializer initializer : this.initializers) {
				initializer.onStartup(servletContext);
			}
		}
```

2、这里的initializers列表，其中之一是ServletWebServerApplicationContext中的lambda表达式，如下

```java
private org.springframework.boot.web.servlet.ServletContextInitializer getSelfInitializer() {
		//lambda表达式
		return this::selfInitialize;
	}
	//具体实现
	private void selfInitialize(ServletContext servletContext) throws ServletException {
		prepareWebApplicationContext(servletContext);
		registerApplicationScope(servletContext);
		WebApplicationContextUtils.registerEnvironmentBeans(getBeanFactory(), servletContext);
		for (ServletContextInitializer beans : getServletContextInitializerBeans()) {
			//调用ServletContextInitializer 的onStartup()
			beans.onStartup(servletContext);
		}
	}
```

3、ServletContextInitializer 的获取

```java
protected Collection<ServletContextInitializer> getServletContextInitializerBeans() {
		return new ServletContextInitializerBeans(getBeanFactory());
	}
```

4、ServletContextInitializerBeans的构造方法

```java
public ServletContextInitializerBeans(ListableBeanFactory beanFactory,
			Class<? extends ServletContextInitializer>... initializerTypes) {
		this.initializers = new LinkedMultiValueMap<>();
		this.initializerTypes = (initializerTypes.length != 0) ? Arrays.asList(initializerTypes)
				: Collections.singletonList(ServletContextInitializer.class);
		//从beanFactory获取ServletContextInitializerBeans
		addServletContextInitializerBeans(beanFactory);
		//从beanFactory获取Servlet、Filter、EventListener，注册为RegistrationBean
		addAdaptableBeans(beanFactory);
		//根据@Order排序
		List<ServletContextInitializer> sortedInitializers = this.initializers.values().stream()
				.flatMap((value) -> value.stream().sorted(AnnotationAwareOrderComparator.INSTANCE))
				.collect(Collectors.toList());
		this.sortedList = Collections.unmodifiableList(sortedInitializers);
		logMappings(this.initializers);
	}
```

5、addServletContextInitializerBeans(beanFactory)，通过ServletContextInitializer类型从beanFactory中获取bean，实现接口ServletContextInitializer的bean如FilterRegistrationBean、ServletListenerRegistrationBean等bean会被获取到，然后调用addServletContextInitializerBean( )方法注册bean

```java
private void addServletContextInitializerBeans(ListableBeanFactory beanFactory) {
		for (Class<? extends ServletContextInitializer> initializerType : this.initializerTypes) {
			for (Entry<String, ? extends ServletContextInitializer> initializerBean : getOrderedBeansOfType(beanFactory,
					initializerType)) {
				addServletContextInitializerBean(initializerBean.getKey(), initializerBean.getValue(), beanFactory);
			}
		}
	}
```

6、addServletContextInitializerBean( )

```java
private void addServletContextInitializerBean(String beanName, ServletContextInitializer initializer,
			ListableBeanFactory beanFactory) {
		if (initializer instanceof ServletRegistrationBean) {
			Servlet source = ((ServletRegistrationBean<?>) initializer).getServlet();
			//ServletRegistrationBean  Servlet.class
			addServletContextInitializerBean(Servlet.class, beanName, initializer, beanFactory, source);
		}
		else if (initializer instanceof FilterRegistrationBean) {
			Filter source = ((FilterRegistrationBean<?>) initializer).getFilter();
			//过滤器 FilterRegistrationBean Filter.class
			addServletContextInitializerBean(Filter.class, beanName, initializer, beanFactory, source);
		}
		else if (initializer instanceof DelegatingFilterProxyRegistrationBean) {
			String source = ((DelegatingFilterProxyRegistrationBean) initializer).getTargetBeanName();
			//过滤器 DelegatingFilterProxyRegistrationBean  Filter.class
			addServletContextInitializerBean(Filter.class, beanName, initializer, beanFactory, source);
		}
		else if (initializer instanceof ServletListenerRegistrationBean) {
			EventListener source = ((ServletListenerRegistrationBean<?>) initializer).getListener();
			//监听器 ServletListenerRegistrationBean EventListener.class
			addServletContextInitializerBean(EventListener.class, beanName, initializer, beanFactory, source);
		}
		else {
			//ServletContextInitializer.class
			addServletContextInitializerBean(ServletContextInitializer.class, beanName, initializer, beanFactory,
					initializer);
		}
	}
```

```java
private void addServletContextInitializerBean(Class<?> type, String beanName, ServletContextInitializer initializer,
			ListableBeanFactory beanFactory, Object source) {
		//保存到多值的map中 MultiValueMap
		this.initializers.add(type, initializer);
		if (source != null) {
			// Mark the underlying source as seen in case it wraps an existing bean
			this.seen.add(source);
		}
		if (logger.isTraceEnabled()) {
			String resourceDescription = getResourceDescription(beanName, beanFactory);
			int order = getOrder(initializer);
			logger.trace("Added existing " + type.getSimpleName() + " initializer bean '" + beanName + "'; order="
					+ order + ", resource=" + resourceDescription);
		}
	}
```

### 2.注册ServletContextInitializer

7、获取ServletContextInitializer后，回到第2、步中，调用onStartup( )，将Servlet、Filter、EventListener注册到servletContext中，源码不展开分析了

```java
for (ServletContextInitializer beans : getServletContextInitializerBeans()) {
			//调用ServletContextInitializer 的onStartup()
			beans.onStartup(servletContext);
		}
```

8、RegistrationBean.onStartup( )

```java
@Override
	public final void onStartup(ServletContext servletContext) throws ServletException {
		//获取描述信息
		String description = getDescription();
		if (!isEnabled()) {
			logger.info(StringUtils.capitalize(description) + " was not registered (disabled)");
			return;
		}
		//注册，以Filter为例
		register(description, servletContext);
	}
```

9、register( )

```java
DynamicRegistrationBean.java
protected final void register(String description, ServletContext servletContext) {
		//注册
		D registration = addRegistration(description, servletContext);
		if (registration == null) {
			logger.info(StringUtils.capitalize(description) + " was not registered (possibly already registered?)");
			return;
		}
		//配置
		configure(registration);
	}
```

```java
protected Dynamic addRegistration(String description, ServletContext servletContext) {
		//获取到Filter
		Filter filter = getFilter();
		//注册Filter
		return servletContext.addFilter(getOrDeduceName(filter), filter);
	}
```

```java
 public FilterRegistration.Dynamic addFilter(final String filterName, final Filter filter) {
        ensureNotProgramaticListener();
        ensureNotInitialized();
        final DeploymentInfo deploymentInfo = getDeploymentInfo();
        if (deploymentInfo.getFilters().containsKey(filterName)) {
            return null;
        }
        //创建FilterInfo
        FilterInfo f = new FilterInfo(filterName, filter.getClass(), new ImmediateInstanceFactory<>(filter));
        //添加到DeploymentInfo中filters
        deploymentInfo.addFilter(f);
        //添加到DeploymentImpl的filters中
        deployment.getFilters().addFilter(f);
        return new FilterRegistrationImpl(f, deployment, this);
    }
```

## 总结

ServletContextInitializer onStartup 注册Filter、Servlet、EventListener。
