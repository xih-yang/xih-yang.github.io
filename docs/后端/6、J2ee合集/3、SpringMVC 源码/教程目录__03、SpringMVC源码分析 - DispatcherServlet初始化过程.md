# 03、SpringMVC源码分析 - DispatcherServlet初始化过程
- 来源：https://ddkk.com/zhuanlan/j2ee/springmvc/7/3.html
- 分类：J2EE框架
- 分组：教程目录
## 前言

在创建容器过程中或当请求来的时候，容器会调用一次DispatcherServlet的init方法，init只会被调用一次。

## 一、执行时机

容器在创建过程中初始化，会执行createServlet( )

```java
public void createServlet() throws ServletException {
        if (permanentlyUnavailable) {
            return;
        }
        try {
        	//这里校验LoadOnStartup参数
            if (!started && servletInfo.getLoadOnStartup() != null && servletInfo.getLoadOnStartup() >= 0) {
            	//这里执行初始化
                instanceStrategy.start();
                started = true;
            }
        } catch (UnavailableException e) {
            if (e.isPermanent()) {
                permanentlyUnavailable = true;
                stop();
            }
        }
    }
```

在WebMvcProperties的内部类Servlet中的定义，默认值是-1，DispatcherServlet会在请求来时执行一次初始化

```java
private int loadOnStartup = -1;
```

因此要想在创建容器的过程中初始化DispatcherServlet，这需要设置该参数的值大于等于0。

```java
spring.mvc.servlet.load-on-startup=1
```

## 二、执行流程

1、首先进入GenericServlet的init( )

```java
 public void init(ServletConfig config) throws ServletException {
	this.config = config;
	this.init();
    }
```

2、进入HttpServletBean的init( )

```java
public final void init() throws ServletException {
		// Set bean properties from init parameters.
		PropertyValues pvs = new ServletConfigPropertyValues(getServletConfig(), this.requiredProperties);
		if (!pvs.isEmpty()) {
			try {
				BeanWrapper bw = PropertyAccessorFactory.forBeanPropertyAccess(this);
				ResourceLoader resourceLoader = new ServletContextResourceLoader(getServletContext());
				bw.registerCustomEditor(Resource.class, new ResourceEditor(resourceLoader, getEnvironment()));
				initBeanWrapper(bw);
				bw.setPropertyValues(pvs, true);
			}
			catch (BeansException ex) {
				if (logger.isErrorEnabled()) {
					logger.error("Failed to set bean properties on servlet '" + getServletName() + "'", ex);
				}
				throw ex;
			}
		}
		// Let subclasses do whatever initialization they like.
		initServletBean();
	}
```

3、进入FrameworkServlet的initServletBean( )

```java
protected final void initServletBean() throws ServletException {
		getServletContext().log("Initializing Spring " + getClass().getSimpleName() + " '" + getServletName() + "'");
		if (logger.isInfoEnabled()) {
			logger.info("Initializing Servlet '" + getServletName() + "'");
		}
		long startTime = System.currentTimeMillis();
		try {
			//初始化WebApplicationContext
			this.webApplicationContext = initWebApplicationContext();
			initFrameworkServlet();
		}
		catch (ServletException | RuntimeException ex) {
			logger.error("Context initialization failed", ex);
			throw ex;
		}
		if (logger.isDebugEnabled()) {
			String value = this.enableLoggingRequestDetails ?
					"shown which may lead to unsafe logging of potentially sensitive data" :
					"masked to prevent unsafe logging of potentially sensitive data";
			logger.debug("enableLoggingRequestDetails='" + this.enableLoggingRequestDetails +
					"': request parameters and headers will be " + value);
		}
		if (logger.isInfoEnabled()) {
			logger.info("Completed initialization in " + (System.currentTimeMillis() - startTime) + " ms");
		}
	}
```

4、initWebApplicationContext( )

```java
protected WebApplicationContext initWebApplicationContext() {
		//获取WebApplicationContext 
		WebApplicationContext rootContext =
				WebApplicationContextUtils.getWebApplicationContext(getServletContext());
		WebApplicationContext wac = null;
		if (this.webApplicationContext != null) {
			// A context instance was injected at construction time -> use it
			wac = this.webApplicationContext;
			if (wac instanceof ConfigurableWebApplicationContext) {
				ConfigurableWebApplicationContext cwac = (ConfigurableWebApplicationContext) wac;
				if (!cwac.isActive()) {
					// The context has not yet been refreshed -> provide services such as
					// setting the parent context, setting the application context id, etc
					if (cwac.getParent() == null) {
						// The context instance was injected without an explicit parent -> set
						// the root application context (if any; may be null) as the parent
						cwac.setParent(rootContext);
					}
					configureAndRefreshWebApplicationContext(cwac);
				}
			}
		}
		if (wac == null) {
			// No context instance was injected at construction time -> see if one
			// has been registered in the servlet context. If one exists, it is assumed
			// that the parent context (if any) has already been set and that the
			// user has performed any initialization such as setting the context id
			//不存在时查找
			wac = findWebApplicationContext();
		}
		if (wac == null) {
			// No context instance is defined for this servlet -> create a local one
			//不存在时创建
			wac = createWebApplicationContext(rootContext);
		}
		if (!this.refreshEventReceived) {
			// Either the context is not a ConfigurableApplicationContext with refresh
			// support or the context injected at construction time had already been
			// refreshed -> trigger initial onRefresh manually here.
			synchronized (this.onRefreshMonitor) {
				//刷新
				onRefresh(wac);
			}
		}
		if (this.publishContext) {
			// Publish the context as a servlet context attribute.
			String attrName = getServletContextAttributeName();
			getServletContext().setAttribute(attrName, wac);
		}
		return wac;
	}
```

5、进入DispatcherServlet的onRefresh( )

```java
protected void onRefresh(ApplicationContext context) {
		initStrategies(context);
	}
```

6、initStrategies(context)

初始化9种策略

```java
protected void initStrategies(ApplicationContext context) {
		//文件上传相关
		initMultipartResolver(context);
		//本地化语言相关
		initLocaleResolver(context);
		//主题相关
		initThemeResolver(context);
		//处理器映射器相关
		initHandlerMappings(context);
		//处理器适配器相关
		initHandlerAdapters(context);
		//处理器异常处理相关
		initHandlerExceptionResolvers(context);
		//请求到视图名翻译相关
		initRequestToViewNameTranslator(context);
		//视图解析器相关
		initViewResolvers(context);
		//FlashMap相关
		initFlashMapManager(context);
	}
```

## 三、策略初始化

1、initMultipartResolver(context)

```java
private void initMultipartResolver(ApplicationContext context) {
		try {
			//从spring容器中获取
			this.multipartResolver = context.getBean(MULTIPART_RESOLVER_BEAN_NAME, MultipartResolver.class);
			if (logger.isDebugEnabled()) {
				logger.debug("Using MultipartResolver [" + this.multipartResolver + "]");
			}
		}
		catch (NoSuchBeanDefinitionException ex) {
			// Default is no multipart resolver.
			//不存在时设置为null，不支持文件上传请求
			this.multipartResolver = null;
			if (logger.isDebugEnabled()) {
				logger.debug("Unable to locate MultipartResolver with name '" + MULTIPART_RESOLVER_BEAN_NAME +
						"': no multipart request handling provided");
			}
		}
	}
```

2、initLocaleResolver(context)

```java
private void initLocaleResolver(ApplicationContext context) {
		try {
			//从spring容器中获取
			this.localeResolver = context.getBean(LOCALE_RESOLVER_BEAN_NAME, LocaleResolver.class);
			if (logger.isDebugEnabled()) {
				logger.debug("Using LocaleResolver [" + this.localeResolver + "]");
			}
		}
		catch (NoSuchBeanDefinitionException ex) {
			// We need to use the default.
			//获取默认的
			this.localeResolver = getDefaultStrategy(context, LocaleResolver.class);
			if (logger.isDebugEnabled()) {
				logger.debug("Unable to locate LocaleResolver with name '" + LOCALE_RESOLVER_BEAN_NAME +
						"': using default [" + this.localeResolver + "]");
			}
		}
	}
```

```java
protected <T> T getDefaultStrategy(ApplicationContext context, Class<T> strategyInterface) {
		List<T> strategies = getDefaultStrategies(context, strategyInterface);
		//只能有一个
		if (strategies.size() != 1) {
			throw new BeanInitializationException(
					"DispatcherServlet needs exactly 1 strategy for interface [" + strategyInterface.getName() + "]");
		}
		return strategies.get(0);
	}
```

```java
protected <T> List<T> getDefaultStrategies(ApplicationContext context, Class<T> strategyInterface) {
		String key = strategyInterface.getName();
		//从缓存中获取
		String value = defaultStrategies.getProperty(key);
		if (value != null) {
			String[] classNames = StringUtils.commaDelimitedListToStringArray(value);
			List<T> strategies = new ArrayList<>(classNames.length);
			for (String className : classNames) {
				try {
					Class<?> clazz = ClassUtils.forName(className, DispatcherServlet.class.getClassLoader());
					//创建bean
					Object strategy = createDefaultStrategy(context, clazz);
					strategies.add((T) strategy);
				}
				catch (ClassNotFoundException ex) {
					throw new BeanInitializationException(
							"Could not find DispatcherServlet's default strategy class [" + className +
							"] for interface [" + key + "]", ex);
				}
				catch (LinkageError err) {
					throw new BeanInitializationException(
							"Unresolvable class definition for DispatcherServlet's default strategy class [" +
							className + "] for interface [" + key + "]", err);
				}
			}
			return strategies;
		}
		else {
			return new LinkedList<>();
		}
	}
```

defaultStrategies，是从DispatcherServlet.properties配置文件中读取的

```java
	private static final String DEFAULT_STRATEGIES_PATH = "DispatcherServlet.properties";
	ClassPathResource resource = new ClassPathResource(DEFAULT_STRATEGIES_PATH, DispatcherServlet.class);
	defaultStrategies = PropertiesLoaderUtils.loadProperties(resource);
```

用同样的方式初始化ThemeResolver、RequestToViewNameTranslator、FlashMapManager策略组件。

3、initHandlerMappings(context)

```java
private void initHandlerMappings(ApplicationContext context) {
		this.handlerMappings = null;
		//是否去检测所有的HandlerMapping
		if (this.detectAllHandlerMappings) {
			// Find all HandlerMappings in the ApplicationContext, including ancestor contexts.
			//从spring容器中获取所有的HandlerMapping
			Map<String, HandlerMapping> matchingBeans =
					BeanFactoryUtils.beansOfTypeIncludingAncestors(context, HandlerMapping.class, true, false);
			if (!matchingBeans.isEmpty()) {
				this.handlerMappings = new ArrayList<>(matchingBeans.values());
				// We keep HandlerMappings in sorted order.
				//根据@Order进行排序
				AnnotationAwareOrderComparator.sort(this.handlerMappings);
			}
		}
		else {
			try {
				//只用名称为handlerMapping的bean
				HandlerMapping hm = context.getBean(HANDLER_MAPPING_BEAN_NAME, HandlerMapping.class);
				this.handlerMappings = Collections.singletonList(hm);
			}
			catch (NoSuchBeanDefinitionException ex) {
				// Ignore, we'll add a default HandlerMapping later.
			}
		}
		// Ensure we have at least one HandlerMapping, by registering
		// a default HandlerMapping if no other mappings are found.
		if (this.handlerMappings == null) {
			//没有找到handlerMapping，则使用DispatcherServlet.properties缺省的配置
			this.handlerMappings = getDefaultStrategies(context, HandlerMapping.class);
			if (logger.isDebugEnabled()) {
				logger.debug("No HandlerMappings found in servlet '" + getServletName() + "': using default");
			}
		}
	}
```

用同样的方式初始化 HandlerAdapter、HandlerExceptionResolver、ViewResolver策略组件

## 四、DispatcherServlet.properties

缺省的8个策略组件都是在这个文件中配置的

```java
# Default implementation classes for DispatcherServlet's strategy interfaces.
# Used as fallback when no matching beans are found in the DispatcherServlet context.
# Not meant to be customized by application developers.
org.springframework.web.servlet.LocaleResolver=org.springframework.web.servlet.i18n.AcceptHeaderLocaleResolver
org.springframework.web.servlet.ThemeResolver=org.springframework.web.servlet.theme.FixedThemeResolver
org.springframework.web.servlet.HandlerMapping=org.springframework.web.servlet.handler.BeanNameUrlHandlerMapping,\
	org.springframework.web.servlet.mvc.method.annotation.RequestMappingHandlerMapping
org.springframework.web.servlet.HandlerAdapter=org.springframework.web.servlet.mvc.HttpRequestHandlerAdapter,\
	org.springframework.web.servlet.mvc.SimpleControllerHandlerAdapter,\
	org.springframework.web.servlet.mvc.method.annotation.RequestMappingHandlerAdapter
org.springframework.web.servlet.HandlerExceptionResolver=org.springframework.web.servlet.mvc.method.annotation.ExceptionHandlerExceptionResolver,\
	org.springframework.web.servlet.mvc.annotation.ResponseStatusExceptionResolver,\
	org.springframework.web.servlet.mvc.support.DefaultHandlerExceptionResolver
org.springframework.web.servlet.RequestToViewNameTranslator=org.springframework.web.servlet.view.DefaultRequestToViewNameTranslator
org.springframework.web.servlet.ViewResolver=org.springframework.web.servlet.view.InternalResourceViewResolver
org.springframework.web.servlet.FlashMapManager=org.springframework.web.servlet.support.SessionFlashMapManager
```
