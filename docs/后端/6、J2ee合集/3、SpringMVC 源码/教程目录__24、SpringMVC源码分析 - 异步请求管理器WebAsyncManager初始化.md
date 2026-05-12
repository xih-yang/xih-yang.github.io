# 24、SpringMVC源码分析 - 异步请求管理器WebAsyncManager初始化
- 来源：https://ddkk.com/zhuanlan/j2ee/springmvc/7/24.html
- 分类：J2EE框架
- 分组：教程目录
## 前言

Springmvc的异步执行请求是有异步管理器WebAsyncManager来控制的。

## 一、WebAsyncManager初始化

1、在请求到来时，会调用DispatcherServlet的doService方法，在调用该方法之前会进入FrameworkServlet的processRequest方法

```java
protected final void processRequest(HttpServletRequest request, HttpServletResponse response)
			throws ServletException, IOException {
		long startTime = System.currentTimeMillis();
		Throwable failureCause = null;
		LocaleContext previousLocaleContext = LocaleContextHolder.getLocaleContext();
		LocaleContext localeContext = buildLocaleContext(request);
		RequestAttributes previousAttributes = RequestContextHolder.getRequestAttributes();
		ServletRequestAttributes requestAttributes = buildRequestAttributes(request, response, previousAttributes);
		//创建WebAsyncManager 
		WebAsyncManager asyncManager = WebAsyncUtils.getAsyncManager(request);
		//设置拦截器
		asyncManager.registerCallableInterceptor(FrameworkServlet.class.getName(), new RequestBindingInterceptor());
		initContextHolders(request, localeContext, requestAttributes);
		try {
			doService(request, response);
		}
		catch (ServletException | IOException ex) {
			failureCause = ex;
			throw ex;
		}
		catch (Throwable ex) {
			failureCause = ex;
			throw new NestedServletException("Request processing failed", ex);
		}
		finally {
			resetContextHolders(request, previousLocaleContext, previousAttributes);
			if (requestAttributes != null) {
				requestAttributes.requestCompleted();
			}
			logResult(request, response, failureCause, asyncManager);
			publishRequestHandledEvent(request, response, startTime, failureCause);
		}
	}
```

2、getAsyncManager( )方法

```java
public static WebAsyncManager getAsyncManager(ServletRequest servletRequest) {
		WebAsyncManager asyncManager = null;
		//public static final String WEB_ASYNC_MANAGER_ATTRIBUTE = WebAsyncManager.class.getName() + ".WEB_ASYNC_MANAGER";
		Object asyncManagerAttr = servletRequest.getAttribute(WEB_ASYNC_MANAGER_ATTRIBUTE);
		if (asyncManagerAttr instanceof WebAsyncManager) {
			asyncManager = (WebAsyncManager) asyncManagerAttr;
		}
		if (asyncManager == null) {
			//为空时，创建一个新的WebAsyncManager
			asyncManager = new WebAsyncManager();
			//设置到request的Attribute中
			servletRequest.setAttribute(WEB_ASYNC_MANAGER_ATTRIBUTE, asyncManager);
		}
		return asyncManager;
	}
```

## 二、参数的初始化

1、在请求过程中，会经过RequestMappingHandlerAdapter的invokeHandlerMethod( )方法，方法中会适配异步管理器的超时时间、线程池、拦截器等

```java
protected ModelAndView invokeHandlerMethod(HttpServletRequest request,
			HttpServletResponse response, HandlerMethod handlerMethod) throws Exception {
		ServletWebRequest webRequest = new ServletWebRequest(request, response);
		try {
			WebDataBinderFactory binderFactory = getDataBinderFactory(handlerMethod);
			ModelFactory modelFactory = getModelFactory(handlerMethod, binderFactory);
			ServletInvocableHandlerMethod invocableMethod = createInvocableHandlerMethod(handlerMethod);
			if (this.argumentResolvers != null) {
				invocableMethod.setHandlerMethodArgumentResolvers(this.argumentResolvers);
			}
			if (this.returnValueHandlers != null) {
				invocableMethod.setHandlerMethodReturnValueHandlers(this.returnValueHandlers);
			}
			invocableMethod.setDataBinderFactory(binderFactory);
			invocableMethod.setParameterNameDiscoverer(this.parameterNameDiscoverer);
			ModelAndViewContainer mavContainer = new ModelAndViewContainer();
			mavContainer.addAllAttributes(RequestContextUtils.getInputFlashMap(request));
			modelFactory.initModel(webRequest, mavContainer, invocableMethod);
			mavContainer.setIgnoreDefaultModelOnRedirect(this.ignoreDefaultModelOnRedirect);
			//创建异步request StandardServletAsyncWebRequest
			AsyncWebRequest asyncWebRequest = WebAsyncUtils.createAsyncWebRequest(request, response);
			//设置超时时间
			asyncWebRequest.setTimeout(this.asyncRequestTimeout);
			//获取异步管理器
			WebAsyncManager asyncManager = WebAsyncUtils.getAsyncManager(request);
			//设置taskExecutor
			asyncManager.setTaskExecutor(this.taskExecutor);
			asyncManager.setAsyncWebRequest(asyncWebRequest);
			//设置Callable的拦截器
			asyncManager.registerCallableInterceptors(this.callableInterceptors);
			//设置DeferredResult的拦截器
			asyncManager.registerDeferredResultInterceptors(this.deferredResultInterceptors);
			//异步执行，已经解析出结果，发生在该请求接口执行完后的第二次请求结果，获取执行结果
			if (asyncManager.hasConcurrentResult()) {
				Object result = asyncManager.getConcurrentResult();
				mavContainer = (ModelAndViewContainer) asyncManager.getConcurrentResultContext()[0];
				asyncManager.clearConcurrentResult();
				LogFormatUtils.traceDebug(logger, traceOn -> {
					String formatted = LogFormatUtils.formatValue(result, !traceOn);
					return "Resume with async result [" + formatted + "]";
				});
				invocableMethod = invocableMethod.wrapConcurrentResult(result);
			}
			invocableMethod.invokeAndHandle(webRequest, mavContainer);
			//如果是异步执行，返回null
			if (asyncManager.isConcurrentHandlingStarted()) {
				return null;
			}
			return getModelAndView(mavContainer, modelFactory, webRequest);
		}
		finally {
			webRequest.requestCompleted();
		}
	}
```

## 三、自定义参数

对异步管理器的超时时间、线程池、拦截器等进行自定义

1、线程池的配置

```java
@Configuration
@EnableAsync
public class ThreadPoolConfig {
    @Bean("taskExecutor")
    public Executor taskExecutor() {
        int processors = Runtime.getRuntime().availableProcessors();
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(processors);
        executor.setMaxPoolSize(processors * 2);
        executor.setQueueCapacity(10000);
        executor.setKeepAliveSeconds(60);
        executor.setThreadNamePrefix("taskExecutor-");
        executor.setRejectedExecutionHandler(new ThreadPoolExecutor.DiscardPolicy());
        return executor;
    }
}
```

2、参数的配置

```java
@Configuration
public class WebMvcConfig implements WebMvcConfigurer {
    @Autowired
    private AsyncTaskExecutor taskExecutor;
    @Override
    public void configureAsyncSupport(AsyncSupportConfigurer configurer) {
        //设置默认超时时间
        configurer.setDefaultTimeout(20000);
        //设置线程池
        configurer.setTaskExecutor(taskExecutor);
        //设置拦截器
//        configurer.registerCallableInterceptors();
//        configurer.registerDeferredResultInterceptors();
    }
}
```

3、参数的解析

参数最终在RequestMappingHandlerAdapter中设置到异步管理器中，那下面就看一下参数是怎么设置到RequestMappingHandlerAdapter中的

**1、** RequestMappingHandlerAdapter的初始化过程；

```java
@Bean
	public RequestMappingHandlerAdapter requestMappingHandlerAdapter(
			@Qualifier("mvcContentNegotiationManager") ContentNegotiationManager contentNegotiationManager,
			@Qualifier("mvcConversionService") FormattingConversionService conversionService,
			@Qualifier("mvcValidator") Validator validator) {
		RequestMappingHandlerAdapter adapter = createRequestMappingHandlerAdapter();
		adapter.setContentNegotiationManager(contentNegotiationManager);
		adapter.setMessageConverters(getMessageConverters());
		adapter.setWebBindingInitializer(getConfigurableWebBindingInitializer(conversionService, validator));
		adapter.setCustomArgumentResolvers(getArgumentResolvers());
		adapter.setCustomReturnValueHandlers(getReturnValueHandlers());
		if (jackson2Present) {
			adapter.setRequestBodyAdvice(Collections.singletonList(new JsonViewRequestBodyAdvice()));
			adapter.setResponseBodyAdvice(Collections.singletonList(new JsonViewResponseBodyAdvice()));
		}
		//获取AsyncSupportConfigurer 
		AsyncSupportConfigurer configurer = getAsyncSupportConfigurer();
		if (configurer.getTaskExecutor() != null) {
			//设置线程池
			adapter.setTaskExecutor(configurer.getTaskExecutor());
		}
		if (configurer.getTimeout() != null) {
			//设置超时时间
			adapter.setAsyncRequestTimeout(configurer.getTimeout());
		}
		//设置拦截器
		adapter.setCallableInterceptors(configurer.getCallableInterceptors());
		adapter.setDeferredResultInterceptors(configurer.getDeferredResultInterceptors());
		return adapter;
	}
```

**2、** getAsyncSupportConfigurer()；

```java
WebMvcConfigurationSupport.java
protected AsyncSupportConfigurer getAsyncSupportConfigurer() {
		if (this.asyncSupportConfigurer == null) {
			this.asyncSupportConfigurer = new AsyncSupportConfigurer();
			//配置
			configureAsyncSupport(this.asyncSupportConfigurer);
		}
		return this.asyncSupportConfigurer;
	}
```

**3、** configureAsyncSupport()；

```java
DelegatingWebMvcConfiguration.java
protected void configureAsyncSupport(AsyncSupportConfigurer configurer) {
		this.configurers.configureAsyncSupport(configurer);
	}
```

```java
WebMvcConfigurerComposite.java
public void configureAsyncSupport(AsyncSupportConfigurer configurer) {
		for (WebMvcConfigurer delegate : this.delegates) {
			delegate.configureAsyncSupport(configurer);
		}
	}
```

这里的delegates是实现WebMvcConfigurer的类

```java
private final List<WebMvcConfigurer> delegates = new ArrayList<>();
```

```java
@Configuration(proxyBeanMethods = false)
public class DelegatingWebMvcConfiguration extends WebMvcConfigurationSupport {
	private final WebMvcConfigurerComposite configurers = new WebMvcConfigurerComposite();
	//这里将WebMvcConfigurer缓存到delegates中
	@Autowired(required = false)
	public void setConfigurers(List<WebMvcConfigurer> configurers) {
		if (!CollectionUtils.isEmpty(configurers)) {
			this.configurers.addWebMvcConfigurers(configurers);
		}
	}
}
```

## 总结

本文主要介绍WebAsyncManager的初始化，以及参数的配置。
