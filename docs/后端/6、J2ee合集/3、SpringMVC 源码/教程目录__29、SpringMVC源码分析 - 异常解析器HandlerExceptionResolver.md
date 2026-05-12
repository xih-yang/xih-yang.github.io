# 29、SpringMVC源码分析 - 异常解析器HandlerExceptionResolver
- 来源：https://ddkk.com/zhuanlan/j2ee/springmvc/7/29.html
- 分类：J2EE框架
- 分组：教程目录
## 前言

HandlerExceptionResolver用于处理在请求处理过程中抛出的异常。

## 一、HandlerExceptionResolver的初始化

**1、** 在WebMvcConfigurationSupport中定义了@BeanHandlerExceptionResolver；

```java
   @Bean
	public HandlerExceptionResolver handlerExceptionResolver(
			@Qualifier("mvcContentNegotiationManager") ContentNegotiationManager contentNegotiationManager) {
		List<HandlerExceptionResolver> exceptionResolvers = new ArrayList<>();
		//自定义异常解析器
		configureHandlerExceptionResolvers(exceptionResolvers);
		if (exceptionResolvers.isEmpty()) {
			//没有自定义，使用默认的异常解析器
			addDefaultHandlerExceptionResolvers(exceptionResolvers, contentNegotiationManager);
		}
		extendHandlerExceptionResolvers(exceptionResolvers);
		HandlerExceptionResolverComposite composite = new HandlerExceptionResolverComposite();
		composite.setOrder(0);
		composite.setExceptionResolvers(exceptionResolvers);
		return composite;
	}
```

**2、** configureHandlerExceptionResolvers()；

获取自定义异常解析器，可以通过自定义实现WebMvcConfigurer接口，重写configureHandlerExceptionResolvers方法

```java
DelegatingWebMvcConfiguration.java
	@Override
	protected void configureHandlerExceptionResolvers(List<HandlerExceptionResolver> exceptionResolvers) {
		this.configurers.configureHandlerExceptionResolvers(exceptionResolvers);
	}
```

```java
WebMvcConfigurerComposite.java
	@Override
	public void configureHandlerExceptionResolvers(List<HandlerExceptionResolver> exceptionResolvers) {
		for (WebMvcConfigurer delegate : this.delegates) {
			delegate.configureHandlerExceptionResolvers(exceptionResolvers);
		}
	}
```

**3、** addDefaultHandlerExceptionResolvers()；

默认的异常解析器，包含 ExceptionHandlerExceptionResolver、ResponseStatusExceptionResolver和DefaultHandlerExceptionResolver

```java
	protected final void addDefaultHandlerExceptionResolvers(List<HandlerExceptionResolver> exceptionResolvers,
			ContentNegotiationManager mvcContentNegotiationManager) {
		//创建 ExceptionHandlerExceptionResolver
		ExceptionHandlerExceptionResolver exceptionHandlerResolver = createExceptionHandlerExceptionResolver();
		//处理请求的media types
		exceptionHandlerResolver.setContentNegotiationManager(mvcContentNegotiationManager);
		//设置消息转换器MessageConverters
		exceptionHandlerResolver.setMessageConverters(getMessageConverters());
		//设置自定义参数解析器ArgumentResolvers()
		exceptionHandlerResolver.setCustomArgumentResolvers(getArgumentResolvers());
		//设置自定义返回值处理器ReturnValueHandlers()
		exceptionHandlerResolver.setCustomReturnValueHandlers(getReturnValueHandlers());
		//@JsonView相关
		if (jackson2Present) {
			exceptionHandlerResolver.setResponseBodyAdvice(
					Collections.singletonList(new JsonViewResponseBodyAdvice()));
		}
		if (this.applicationContext != null) {
			exceptionHandlerResolver.setApplicationContext(this.applicationContext);
		}
		//初始化
		exceptionHandlerResolver.afterPropertiesSet();
		//添加 ExceptionHandlerExceptionResolver
		exceptionResolvers.add(exceptionHandlerResolver);
		ResponseStatusExceptionResolver responseStatusResolver = new ResponseStatusExceptionResolver();
		responseStatusResolver.setMessageSource(this.applicationContext);
		//添加 ResponseStatusExceptionResolver
		exceptionResolvers.add(responseStatusResolver);
		//添加 DefaultHandlerExceptionResolver
		exceptionResolvers.add(new DefaultHandlerExceptionResolver());
	}
```

**4、** afterPropertiesSet()；

初始化

```java
	@Override
	public void afterPropertiesSet() {
		// Do this first, it may add ResponseBodyAdvice beans
		//初始化 @ControllerAdvice 的 bean
		initExceptionHandlerAdviceCache();
		if (this.argumentResolvers == null) {
			//获取 默认的参数解析器 DefaultArgumentResolvers
			List<HandlerMethodArgumentResolver> resolvers = getDefaultArgumentResolvers();
			this.argumentResolvers = new HandlerMethodArgumentResolverComposite().addResolvers(resolvers);
		}
		if (this.returnValueHandlers == null) {
			//获取 默认的返回值处理器 DefaultReturnValueHandlers
			List<HandlerMethodReturnValueHandler> handlers = getDefaultReturnValueHandlers();
			this.returnValueHandlers = new HandlerMethodReturnValueHandlerComposite().addHandlers(handlers);
		}
	}
```

**5、** initExceptionHandlerAdviceCache()；

初始化@ControllerAdvice

```java
	private void initExceptionHandlerAdviceCache() {
		if (getApplicationContext() == null) {
			return;
		}
		//查找出 @ControllerAdvice
		List<ControllerAdviceBean> adviceBeans = ControllerAdviceBean.findAnnotatedBeans(getApplicationContext());
		for (ControllerAdviceBean adviceBean : adviceBeans) {
			Class<?> beanType = adviceBean.getBeanType();
			if (beanType == null) {
				throw new IllegalStateException("Unresolvable type for ControllerAdviceBean: " + adviceBean);
			}
			//解析 @ExceptionHandler 方法
			ExceptionHandlerMethodResolver resolver = new ExceptionHandlerMethodResolver(beanType);
			if (resolver.hasExceptionMappings()) {
				//存入 exceptionHandlerAdviceCache
				this.exceptionHandlerAdviceCache.put(adviceBean, resolver);
			}
			if (ResponseBodyAdvice.class.isAssignableFrom(beanType)) {
				this.responseBodyAdvice.add(adviceBean);
			}
		}
		if (logger.isDebugEnabled()) {
			int handlerSize = this.exceptionHandlerAdviceCache.size();
			int adviceSize = this.responseBodyAdvice.size();
			if (handlerSize == 0 && adviceSize == 0) {
				logger.debug("ControllerAdvice beans: none");
			}
			else {
				logger.debug("ControllerAdvice beans: " +
						handlerSize + " @ExceptionHandler, " + adviceSize + " ResponseBodyAdvice");
			}
		}
	}
```

**6、** ControllerAdviceBean.findAnnotatedBeans()；

```java
public static List<ControllerAdviceBean> findAnnotatedBeans(ApplicationContext context) {
		ListableBeanFactory beanFactory = context;
		if (context instanceof ConfigurableApplicationContext) {
			// Use internal BeanFactory for potential downcast to ConfigurableBeanFactory above
			beanFactory = ((ConfigurableApplicationContext) context).getBeanFactory();
		}
		List<ControllerAdviceBean> adviceBeans = new ArrayList<>();
		for (String name : BeanFactoryUtils.beanNamesForTypeIncludingAncestors(beanFactory, Object.class)) {
			if (!ScopedProxyUtils.isScopedTarget(name)) {
				//查找 @ControllerAdvice
				ControllerAdvice controllerAdvice = beanFactory.findAnnotationOnBean(name, ControllerAdvice.class);
				if (controllerAdvice != null) {
					// Use the @ControllerAdvice annotation found by findAnnotationOnBean()
					// in order to avoid a subsequent lookup of the same annotation.
					adviceBeans.add(new ControllerAdviceBean(name, beanFactory, controllerAdvice));
				}
			}
		}
		//根据order排序
		OrderComparator.sort(adviceBeans);
		return adviceBeans;
	}
```

**7、** ExceptionHandlerMethodResolver；

解析@ExceptionHandler

```java
public static final MethodFilter EXCEPTION_HANDLER_METHODS = method ->
			AnnotatedElementUtils.hasAnnotation(method, ExceptionHandler.class);
```

```java
public ExceptionHandlerMethodResolver(Class<?> handlerType) {
		//查找含有@ExceptionHandler注解的方法
		for (Method method : MethodIntrospector.selectMethods(handlerType, EXCEPTION_HANDLER_METHODS)) {
			//获取方法上的异常信息
			for (Class<? extends Throwable> exceptionType : detectExceptionMappings(method)) {
				//将异常和对应方法存入缓存
				addExceptionMapping(exceptionType, method);
			}
		}
	}
```

**8、** 回到第4步；

获取默认参数解析器 getDefaultArgumentResolvers()

```java
protected List<HandlerMethodArgumentResolver> getDefaultArgumentResolvers() {
		List<HandlerMethodArgumentResolver> resolvers = new ArrayList<>();
		// Annotation-based argument resolution
		resolvers.add(new SessionAttributeMethodArgumentResolver());
		resolvers.add(new RequestAttributeMethodArgumentResolver());
		// Type-based argument resolution
		resolvers.add(new ServletRequestMethodArgumentResolver());
		resolvers.add(new ServletResponseMethodArgumentResolver());
		resolvers.add(new RedirectAttributesMethodArgumentResolver());
		resolvers.add(new ModelMethodProcessor());
		// Custom arguments
		//合并了自定义的参数解析器
		if (getCustomArgumentResolvers() != null) {
			resolvers.addAll(getCustomArgumentResolvers());
		}
		// Catch-all
		resolvers.add(new PrincipalMethodArgumentResolver());
		return resolvers;
	}
```

获取默认的返回值处理器 getDefaultReturnValueHandlers()

```java
protected List<HandlerMethodReturnValueHandler> getDefaultReturnValueHandlers() {
		List<HandlerMethodReturnValueHandler> handlers = new ArrayList<>();
		// Single-purpose return value types
		handlers.add(new ModelAndViewMethodReturnValueHandler());
		handlers.add(new ModelMethodProcessor());
		handlers.add(new ViewMethodReturnValueHandler());
		handlers.add(new HttpEntityMethodProcessor(
				getMessageConverters(), this.contentNegotiationManager, this.responseBodyAdvice));
		// Annotation-based return value types
		handlers.add(new ServletModelAttributeMethodProcessor(false));
		handlers.add(new RequestResponseBodyMethodProcessor(
				getMessageConverters(), this.contentNegotiationManager, this.responseBodyAdvice));
		// Multi-purpose return value types
		handlers.add(new ViewNameMethodReturnValueHandler());
		handlers.add(new MapMethodProcessor());
		// Custom return value types
		//合并了自定义的返回值处理器
		if (getCustomReturnValueHandlers() != null) {
			handlers.addAll(getCustomReturnValueHandlers());
		}
		// Catch-all
		handlers.add(new ServletModelAttributeMethodProcessor(true));
		return handlers;
	}
```

**9、** 回到第1步中，afterPropertiesSet()执行结束；

extendHandlerExceptionResolvers( )，扩展异常解析器

```java
		@Override
		protected void extendHandlerExceptionResolvers(List<HandlerExceptionResolver> exceptionResolvers) {
			//调用 WebMvcConfigurer 子类的 extendHandlerExceptionResolvers 方法
			super.extendHandlerExceptionResolvers(exceptionResolvers);
			if (this.mvcProperties.isLogResolvedException()) {
				for (HandlerExceptionResolver resolver : exceptionResolvers) {
					if (resolver instanceof AbstractHandlerExceptionResolver) {
						((AbstractHandlerExceptionResolver) resolver).setWarnLogCategory(resolver.getClass().getName());
					}
				}
			}
		}
```

最终生成 HandlerExceptionResolver 的实现类 HandlerExceptionResolverComposite对象。

## 二、异常的处理流程

从请求进入DispatcherServlet的doDispatch方法之后开始分析

**1、** doDispatch()；

```java
			try {
			...
			}
			catch (Exception ex) {
				dispatchException = ex;
			}
			catch (Throwable err) {
				// As of 4.3, we're processing Errors thrown from handler methods as well,
				// making them available for @ExceptionHandler methods and other scenarios.
				dispatchException = new NestedServletException("Handler dispatch failed", err);
			}
			processDispatchResult(processedRequest, response, mappedHandler, mv, dispatchException);
```

**2、** processDispatchResult()；

```java
	private void processDispatchResult(HttpServletRequest request, HttpServletResponse response,
			@Nullable HandlerExecutionChain mappedHandler, @Nullable ModelAndView mv,
			@Nullable Exception exception) throws Exception {
		boolean errorView = false;
		//存在异常信息
		if (exception != null) {
			if (exception instanceof ModelAndViewDefiningException) {
				logger.debug("ModelAndViewDefiningException encountered", exception);
				mv = ((ModelAndViewDefiningException) exception).getModelAndView();
			}
			else {
				Object handler = (mappedHandler != null ? mappedHandler.getHandler() : null);
				//处理异常
				mv = processHandlerException(request, response, handler, exception);
				errorView = (mv != null);
			}
		}
	...
```

**3、** processHandlerException()；

```java
protected ModelAndView processHandlerException(HttpServletRequest request, HttpServletResponse response,
			@Nullable Object handler, Exception ex) throws Exception {
		// Success and error responses may use different content types
		request.removeAttribute(HandlerMapping.PRODUCIBLE_MEDIA_TYPES_ATTRIBUTE);
		// Check registered HandlerExceptionResolvers...
		ModelAndView exMv = null;
		if (this.handlerExceptionResolvers != null) {
			for (HandlerExceptionResolver resolver : this.handlerExceptionResolvers) {
				//解析异常
				exMv = resolver.resolveException(request, response, handler, ex);
				if (exMv != null) {
					break;
				}
			}
		}
		if (exMv != null) {
			if (exMv.isEmpty()) {
				//如果model、view是空，设置异常属性，返回null
				request.setAttribute(EXCEPTION_ATTRIBUTE, ex);
				return null;
			}
			// We might still need view name translation for a plain error model...
			if (!exMv.hasView()) {
				String defaultViewName = getDefaultViewName(request);
				if (defaultViewName != null) {
					exMv.setViewName(defaultViewName);
				}
			}
			if (logger.isTraceEnabled()) {
				logger.trace("Using resolved error view: " + exMv, ex);
			}
			else if (logger.isDebugEnabled()) {
				logger.debug("Using resolved error view: " + exMv);
			}
			WebUtils.exposeErrorRequestAttributes(request, ex, getServletName());
			return exMv;
		}
```

**4、** resolveException()；

```java
HandlerExceptionResolverComposite.java
public ModelAndView resolveException(
			HttpServletRequest request, HttpServletResponse response, @Nullable Object handler, Exception ex) {
		if (this.resolvers != null) {
			for (HandlerExceptionResolver handlerExceptionResolver : this.resolvers) {
				//解析异常，resolvers 包括 ExceptionHandlerExceptionResolver、ResponseStatusExceptionResolver 和 DefaultHandlerExceptionResolver
				ModelAndView mav = handlerExceptionResolver.resolveException(request, response, handler, ex);
				if (mav != null) {
					return mav;
				}
			}
		}
		return null;
	}
```

**5、** ExceptionHandlerExceptionResolver解析异常的步骤；

核心逻辑 ： 解析出能处理异常的@ControllerAdvice中的方法，并请求该方法

1、resolveException( )

```java
AbstractHandlerExceptionResolver.java
public ModelAndView resolveException(
			HttpServletRequest request, HttpServletResponse response, @Nullable Object handler, Exception ex) {
		if (shouldApplyTo(request, handler)) {
			prepareResponse(ex, response);
			//解析异常，返回 ModelAndView
			ModelAndView result = doResolveException(request, response, handler, ex);
			if (result != null) {
				// Print debug message when warn logger is not enabled.
				if (logger.isDebugEnabled() && (this.warnLogger == null || !this.warnLogger.isWarnEnabled())) {
					logger.debug("Resolved [" + ex + "]" + (result.isEmpty() ? "" : " to " + result));
				}
				// Explicitly configured warn logger in logException method.
				logException(ex, request);
			}
			return result;
		}
		else {
			return null;
		}
	}
```

2、doResolveException( )

```java
protected final ModelAndView doResolveException(
			HttpServletRequest request, HttpServletResponse response, @Nullable Object handler, Exception ex) {
		HandlerMethod handlerMethod = (handler instanceof HandlerMethod ? (HandlerMethod) handler : null);
		//解析异常
		return doResolveHandlerMethodException(request, response, handlerMethod, ex);
	}
```

3、doResolveHandlerMethodException( )

```java
protected ModelAndView doResolveHandlerMethodException(HttpServletRequest request,
			HttpServletResponse response, @Nullable HandlerMethod handlerMethod, Exception exception) {
		//找到能处理该异常的方法
		ServletInvocableHandlerMethod exceptionHandlerMethod = getExceptionHandlerMethod(handlerMethod, exception);
		if (exceptionHandlerMethod == null) {
			return null;
		}
		if (this.argumentResolvers != null) {
			//设置参数解析器
			exceptionHandlerMethod.setHandlerMethodArgumentResolvers(this.argumentResolvers);
		}
		if (this.returnValueHandlers != null) {
			//设置返回值处理器
			exceptionHandlerMethod.setHandlerMethodReturnValueHandlers(this.returnValueHandlers);
		}
		//创建新的 ServletWebRequest
		ServletWebRequest webRequest = new ServletWebRequest(request, response);
		ModelAndViewContainer mavContainer = new ModelAndViewContainer();
		ArrayList<Throwable> exceptions = new ArrayList<>();
		try {
			if (logger.isDebugEnabled()) {
				logger.debug("Using @ExceptionHandler " + exceptionHandlerMethod);
			}
			// Expose causes as provided arguments as well
			Throwable exToExpose = exception;
			while (exToExpose != null) {
				exceptions.add(exToExpose);
				Throwable cause = exToExpose.getCause();
				exToExpose = (cause != exToExpose ? cause : null);
			}
			//方法参数
			Object[] arguments = new Object[exceptions.size() + 1];
			exceptions.toArray(arguments);  // efficient arraycopy call in ArrayList
			arguments[arguments.length - 1] = handlerMethod;
			//调用异常处理方法，如@ControllerAdvice中的某个处理该异常的方法
			exceptionHandlerMethod.invokeAndHandle(webRequest, mavContainer, arguments);
		}
		catch (Throwable invocationEx) {
			// Any other than the original exception (or a cause) is unintended here,
			// probably an accident (e.g. failed assertion or the like).
			if (!exceptions.contains(invocationEx) && logger.isWarnEnabled()) {
				logger.warn("Failure in @ExceptionHandler " + exceptionHandlerMethod, invocationEx);
			}
			// Continue with default processing of the original exception...
			return null;
		}
		//返回 ModelAndView
		if (mavContainer.isRequestHandled()) {
			return new ModelAndView();
		}
		else {
			ModelMap model = mavContainer.getModel();
			HttpStatus status = mavContainer.getStatus();
			ModelAndView mav = new ModelAndView(mavContainer.getViewName(), model, status);
			mav.setViewName(mavContainer.getViewName());
			if (!mavContainer.isViewReference()) {
				mav.setView((View) mavContainer.getView());
			}
			if (model instanceof RedirectAttributes) {
				Map<String, ?> flashAttributes = ((RedirectAttributes) model).getFlashAttributes();
				RequestContextUtils.getOutputFlashMap(request).putAll(flashAttributes);
			}
			return mav;
		}
	}
```

4、getExceptionHandlerMethod( )

```java
@Nullable
	protected ServletInvocableHandlerMethod getExceptionHandlerMethod(
			@Nullable HandlerMethod handlerMethod, Exception exception) {
		Class<?> handlerType = null;
		if (handlerMethod != null) {
			// Local exception handler methods on the controller class itself.
			// To be invoked through the proxy, even in case of an interface-based proxy.
			handlerType = handlerMethod.getBeanType();
			ExceptionHandlerMethodResolver resolver = this.exceptionHandlerCache.get(handlerType);
			if (resolver == null) {
				resolver = new ExceptionHandlerMethodResolver(handlerType);
				this.exceptionHandlerCache.put(handlerType, resolver);
			}
			Method method = resolver.resolveMethod(exception);
			if (method != null) {
				return new ServletInvocableHandlerMethod(handlerMethod.getBean(), method, this.applicationContext);
			}
			// For advice applicability check below (involving base packages, assignable types
			// and annotation presence), use target class instead of interface-based proxy.
			if (Proxy.isProxyClass(handlerType)) {
				handlerType = AopUtils.getTargetClass(handlerMethod.getBean());
			}
		}
		//找到@ControllerAdvice 中能处理该异常的方法，封装成 ServletInvocableHandlerMethod
		for (Map.Entry<ControllerAdviceBean, ExceptionHandlerMethodResolver> entry : this.exceptionHandlerAdviceCache.entrySet()) {
			ControllerAdviceBean advice = entry.getKey();
			if (advice.isApplicableToBeanType(handlerType)) {
				ExceptionHandlerMethodResolver resolver = entry.getValue();
				Method method = resolver.resolveMethod(exception);
				if (method != null) {
					return new ServletInvocableHandlerMethod(advice.resolveBean(), method, this.applicationContext);
				}
			}
		}
		return null;
	}
```

5、resolver.resolveMethod( )

解析出能处理该异常的方法

```java
	public Method resolveMethod(Exception exception) {
		return resolveMethodByThrowable(exception);
	}
```

```java
public Method resolveMethodByThrowable(Throwable exception) {
		//根据 exception.getClass() 查找
		Method method = resolveMethodByExceptionType(exception.getClass());
		if (method == null) {
			Throwable cause = exception.getCause();
			if (cause != null) {
				//找不到时，根据 exception.getCause() 递归查找
				method = resolveMethodByThrowable(cause);
			}
		}
		return method;
	}
```

```java
public Method resolveMethodByExceptionType(Class<? extends Throwable> exceptionType) {
		//先从缓存获取
		Method method = this.exceptionLookupCache.get(exceptionType);
		if (method == null) {
			method = getMappedMethod(exceptionType);
			this.exceptionLookupCache.put(exceptionType, method);
		}
		return (method != NO_MATCHING_EXCEPTION_HANDLER_METHOD ? method : null);
	}
```

```java
private Method getMappedMethod(Class<? extends Throwable> exceptionType) {
		List<Class<? extends Throwable>> matches = new ArrayList<>();
		for (Class<? extends Throwable> mappedException : this.mappedMethods.keySet()) {
			//找到能处理该异常的类型或父类
			if (mappedException.isAssignableFrom(exceptionType)) {
				matches.add(mappedException);
			}
		}
		if (!matches.isEmpty()) {
			if (matches.size() > 1) {
				//多个时进行排序
				matches.sort(new ExceptionDepthComparator(exceptionType));
			}
			//返回第一个
			return this.mappedMethods.get(matches.get(0));
		}
		else {
			return NO_MATCHING_EXCEPTION_HANDLER_METHOD;
		}
	}
```

**6、** ResponseStatusExceptionResolver解析异常的核心步骤；

1、doResolveException( )

```java
ResponseStatusExceptionResolver.java
protected ModelAndView doResolveException(
			HttpServletRequest request, HttpServletResponse response, @Nullable Object handler, Exception ex) {
		try {
			//异常是否是 ResponseStatusException 异常
			if (ex instanceof ResponseStatusException) {
				return resolveResponseStatusException((ResponseStatusException) ex, request, response, handler);
			}
			//异常类上是否有 @ResponseStatus 注解
			ResponseStatus status = AnnotatedElementUtils.findMergedAnnotation(ex.getClass(), ResponseStatus.class);
			if (status != null) {
				return resolveResponseStatus(status, request, response, handler, ex);
			}
			//递归解析异常的 cause
			if (ex.getCause() instanceof Exception) {
				return doResolveException(request, response, handler, (Exception) ex.getCause());
			}
		}
		catch (Exception resolveEx) {
			if (logger.isWarnEnabled()) {
				logger.warn("Failure while trying to resolve exception [" + ex.getClass().getName() + "]", resolveEx);
			}
		}
		return null;
	}
```

2、resolveResponseStatusException( )

```java
protected ModelAndView resolveResponseStatusException(ResponseStatusException ex,
			HttpServletRequest request, HttpServletResponse response, @Nullable Object handler) throws Exception {
		//响应头的设置
		ex.getResponseHeaders().forEach((name, values) ->
				values.forEach(value -> response.addHeader(name, value)));
		//Status 和 Reason 的设置
		return applyStatusAndReason(ex.getRawStatusCode(), ex.getReason(), response);
	}
```

**7、** DefaultHandlerExceptionResolver解析异常的核心步骤；

根据异常的具体类型做出相应的处理

```java
protected ModelAndView doResolveException(
			HttpServletRequest request, HttpServletResponse response, @Nullable Object handler, Exception ex) {
		try {
			if (ex instanceof HttpRequestMethodNotSupportedException) {
				return handleHttpRequestMethodNotSupported(
						(HttpRequestMethodNotSupportedException) ex, request, response, handler);
			}
			else if (ex instanceof HttpMediaTypeNotSupportedException) {
				return handleHttpMediaTypeNotSupported(
						(HttpMediaTypeNotSupportedException) ex, request, response, handler);
			}
			else if (ex instanceof HttpMediaTypeNotAcceptableException) {
				return handleHttpMediaTypeNotAcceptable(
						(HttpMediaTypeNotAcceptableException) ex, request, response, handler);
			}
			else if (ex instanceof MissingPathVariableException) {
				return handleMissingPathVariable(
						(MissingPathVariableException) ex, request, response, handler);
			}
			else if (ex instanceof MissingServletRequestParameterException) {
				return handleMissingServletRequestParameter(
						(MissingServletRequestParameterException) ex, request, response, handler);
			}
			else if (ex instanceof ServletRequestBindingException) {
				return handleServletRequestBindingException(
						(ServletRequestBindingException) ex, request, response, handler);
			}
			else if (ex instanceof ConversionNotSupportedException) {
				return handleConversionNotSupported(
						(ConversionNotSupportedException) ex, request, response, handler);
			}
			else if (ex instanceof TypeMismatchException) {
				return handleTypeMismatch(
						(TypeMismatchException) ex, request, response, handler);
			}
			else if (ex instanceof HttpMessageNotReadableException) {
				return handleHttpMessageNotReadable(
						(HttpMessageNotReadableException) ex, request, response, handler);
			}
			else if (ex instanceof HttpMessageNotWritableException) {
				return handleHttpMessageNotWritable(
						(HttpMessageNotWritableException) ex, request, response, handler);
			}
			else if (ex instanceof MethodArgumentNotValidException) {
				return handleMethodArgumentNotValidException(
						(MethodArgumentNotValidException) ex, request, response, handler);
			}
			else if (ex instanceof MissingServletRequestPartException) {
				return handleMissingServletRequestPartException(
						(MissingServletRequestPartException) ex, request, response, handler);
			}
			else if (ex instanceof BindException) {
				return handleBindException((BindException) ex, request, response, handler);
			}
			else if (ex instanceof NoHandlerFoundException) {
				return handleNoHandlerFoundException(
						(NoHandlerFoundException) ex, request, response, handler);
			}
			else if (ex instanceof AsyncRequestTimeoutException) {
				return handleAsyncRequestTimeoutException(
						(AsyncRequestTimeoutException) ex, request, response, handler);
			}
		}
		catch (Exception handlerEx) {
			if (logger.isWarnEnabled()) {
				logger.warn("Failure while trying to resolve exception [" + ex.getClass().getName() + "]", handlerEx);
			}
		}
		return null;
	}
```
