# 01、SpringMVC源码分析 - RequestMappingHandlerMapping
- 来源：https://ddkk.com/zhuanlan/j2ee/springmvc/7/1.html
- 分类：J2EE框架
- 分组：教程目录
## 前言

RequestMappingHandlerMapping用于解析@Controller或@RequestMapping以及@RestController、@GetMapping、@PostMapping，将请求路径与请求方法的映射信息放入springmvc的容器中。

## 一、实例化

1、WebMvcAutoConfiguration

WebMvcAutoConfiguration 中标注了@Bean RequestMappingHandlerMapping ，并且用了@Primary注解，在RequestMappingHandlerMapping 实例化过程中或执行该Bean

```java
@Configuration(proxyBeanMethods = false)
@ConditionalOnWebApplication(type = Type.SERVLET)
@ConditionalOnClass({
      Servlet.class, DispatcherServlet.class, WebMvcConfigurer.class })
@ConditionalOnMissingBean(WebMvcConfigurationSupport.class)
@AutoConfigureOrder(Ordered.HIGHEST_PRECEDENCE + 10)
@AutoConfigureAfter({
      DispatcherServletAutoConfiguration.class, TaskExecutionAutoConfiguration.class,
		ValidationAutoConfiguration.class })
public class WebMvcAutoConfiguration {
		@Bean
		@Primary
		@Override
		public RequestMappingHandlerMapping requestMappingHandlerMapping(
				@Qualifier("mvcContentNegotiationManager") ContentNegotiationManager contentNegotiationManager,
				@Qualifier("mvcConversionService") FormattingConversionService conversionService,
				@Qualifier("mvcResourceUrlProvider") ResourceUrlProvider resourceUrlProvider) {
			// Must be @Primary for MvcUriComponentsBuilder to work
			return super.requestMappingHandlerMapping(contentNegotiationManager, conversionService,
					resourceUrlProvider);
		}
}
```

3、super.requestMappingHandlerMapping

```java
WebMvcConfigurationSupport.java
	//这里也标注了@Bean注解
	@Bean
	@SuppressWarnings("deprecation")
	public RequestMappingHandlerMapping requestMappingHandlerMapping(
			@Qualifier("mvcContentNegotiationManager") ContentNegotiationManager contentNegotiationManager,
			@Qualifier("mvcConversionService") FormattingConversionService conversionService,
			@Qualifier("mvcResourceUrlProvider") ResourceUrlProvider resourceUrlProvider) {
		//创建RequestMappingHandlerMapping 
		RequestMappingHandlerMapping mapping = createRequestMappingHandlerMapping();
		//初始化一些属性
		mapping.setOrder(0);
		mapping.setInterceptors(getInterceptors(conversionService, resourceUrlProvider));
		mapping.setContentNegotiationManager(contentNegotiationManager);
		mapping.setCorsConfigurations(getCorsConfigurations());
		PathMatchConfigurer pathConfig = getPathMatchConfigurer();
		if (pathConfig.getPatternParser() != null) {
			mapping.setPatternParser(pathConfig.getPatternParser());
		}
		else {
			mapping.setUrlPathHelper(pathConfig.getUrlPathHelperOrDefault());
			mapping.setPathMatcher(pathConfig.getPathMatcherOrDefault());
			Boolean useSuffixPatternMatch = pathConfig.isUseSuffixPatternMatch();
			if (useSuffixPatternMatch != null) {
				mapping.setUseSuffixPatternMatch(useSuffixPatternMatch);
			}
			Boolean useRegisteredSuffixPatternMatch = pathConfig.isUseRegisteredSuffixPatternMatch();
			if (useRegisteredSuffixPatternMatch != null) {
				mapping.setUseRegisteredSuffixPatternMatch(useRegisteredSuffixPatternMatch);
			}
		}
		Boolean useTrailingSlashMatch = pathConfig.isUseTrailingSlashMatch();
		if (useTrailingSlashMatch != null) {
			mapping.setUseTrailingSlashMatch(useTrailingSlashMatch);
		}
		if (pathConfig.getPathPrefixes() != null) {
			mapping.setPathPrefixes(pathConfig.getPathPrefixes());
		}
		return mapping;
	}
```

4、createRequestMappingHandlerMapping( )

```java
WebMvcAutoConfiguration.java
@Override
		protected RequestMappingHandlerMapping createRequestMappingHandlerMapping() {
			if (this.mvcRegistrations != null) {
				RequestMappingHandlerMapping mapping = this.mvcRegistrations.getRequestMappingHandlerMapping();
				if (mapping != null) {
					return mapping;
				}
			}
			//调用父类方法
			return super.createRequestMappingHandlerMapping();
		}
```

```java
WebMvcConfigurationSupport.java
protected RequestMappingHandlerMapping createRequestMappingHandlerMapping() {
         //直接new了一个
		return new RequestMappingHandlerMapping();
	}
```

## 二、初始化

RequestMappingHandlerMapping实现了InitializingBean接口，在初始化过程中会调用afterPropertiesSet方法

1、afterPropertiesSet( )

```java
RequestMappingHandlerMapping.java
public void afterPropertiesSet() {
		//初始化所有RequestMappingInfo公用的一些属性RequestMappingInfo.BuilderConfiguration
		this.config = new RequestMappingInfo.BuilderConfiguration();
		this.config.setTrailingSlashMatch(useTrailingSlashMatch());
		this.config.setContentNegotiationManager(getContentNegotiationManager());
		if (getPatternParser() != null) {
			this.config.setPatternParser(getPatternParser());
			Assert.isTrue(!this.useSuffixPatternMatch && !this.useRegisteredSuffixPatternMatch,
					"Suffix pattern matching not supported with PathPatternParser.");
		}
		else {
			this.config.setSuffixPatternMatch(useSuffixPatternMatch());
			this.config.setRegisteredSuffixPatternMatch(useRegisteredSuffixPatternMatch());
			this.config.setPathMatcher(getPathMatcher());
		}
		super.afterPropertiesSet();
	}
```

2、super.afterPropertiesSet()

```java
AbstractHandlerMethodMapping.java
public void afterPropertiesSet() {
		//初始化处理器方法
		initHandlerMethods();
	}
```

```java
protected void initHandlerMethods() {
		//遍历beanFactory中注册的BeanNames
		for (String beanName : getCandidateBeanNames()) {
			if (!beanName.startsWith(SCOPED_TARGET_NAME_PREFIX)) {
				//处理bean
				processCandidateBean(beanName);
			}
		}
		handlerMethodsInitialized(getHandlerMethods());
	}
```

3、processCandidateBean( )

```java
protected void processCandidateBean(String beanName) {
		Class<?> beanType = null;
		try {
			beanType = obtainApplicationContext().getType(beanName);
		}
		catch (Throwable ex) {
			// An unresolvable bean type, probably from a lazy bean - let's ignore it.
			if (logger.isTraceEnabled()) {
				logger.trace("Could not resolve type for bean '" + beanName + "'", ex);
			}
		}
		//校验是否是handler
		if (beanType != null && isHandler(beanType)) {
		    //获取处理器的方法
			detectHandlerMethods(beanName);
		}
```

isHandler( )

校验是否含有@Controller或@RequestMapping

```java
protected boolean isHandler(Class<?> beanType) {
		return (AnnotatedElementUtils.hasAnnotation(beanType, Controller.class) ||
				AnnotatedElementUtils.hasAnnotation(beanType, RequestMapping.class));
	}
```

4、detectHandlerMethods( )

```java
protected void detectHandlerMethods(Object handler) {
		Class<?> handlerType = (handler instanceof String ?
				obtainApplicationContext().getType((String) handler) : handler.getClass());
		if (handlerType != null) {
			//类可能被代理，获取用户自定义的类
			Class<?> userType = ClassUtils.getUserClass(handlerType);
			Map<Method, T> methods = MethodIntrospector.selectMethods(userType,
					(MethodIntrospector.MetadataLookup<T>) method -> {
						try {
							return getMappingForMethod(method, userType);
						}
						catch (Throwable ex) {
							throw new IllegalStateException("Invalid mapping on handler class [" +
									userType.getName() + "]: " + method, ex);
						}
					});
			if (logger.isTraceEnabled()) {
				logger.trace(formatMappings(userType, methods));
			}
			else if (mappingsLogger.isDebugEnabled()) {
				mappingsLogger.debug(formatMappings(userType, methods));
			}
			methods.forEach((method, mapping) -> {
				Method invocableMethod = AopUtils.selectInvocableMethod(method, userType);
				//注册处理器方法
				registerHandlerMethod(handler, invocableMethod, mapping);
			});
		}
	}
```

5、selectMethods( )

```java
public static <T> Map<Method, T> selectMethods(Class<?> targetType, final MetadataLookup<T> metadataLookup) {
		final Map<Method, T> methodMap = new LinkedHashMap<>();
		Set<Class<?>> handlerTypes = new LinkedHashSet<>();
		Class<?> specificHandlerType = null;
		if (!Proxy.isProxyClass(targetType)) {
			specificHandlerType = ClassUtils.getUserClass(targetType);
			handlerTypes.add(specificHandlerType);
		}
		handlerTypes.addAll(ClassUtils.getAllInterfacesForClassAsSet(targetType));
		for (Class<?> currentHandlerType : handlerTypes) {
			final Class<?> targetClass = (specificHandlerType != null ? specificHandlerType : currentHandlerType);
			//处理所有方法以及父类的方法
			ReflectionUtils.doWithMethods(currentHandlerType, method -> {
				Method specificMethod = ClassUtils.getMostSpecificMethod(method, targetClass);
				T result = metadataLookup.inspect(specificMethod);
				if (result != null) {
					Method bridgedMethod = BridgeMethodResolver.findBridgedMethod(specificMethod);
					if (bridgedMethod == specificMethod || metadataLookup.inspect(bridgedMethod) == null) {
						//保存方法和RequestMappingInfo
						methodMap.put(specificMethod, result);
					}
				}
			}, ReflectionUtils.USER_DECLARED_METHODS);
		}
		return methodMap;
	}
```

6、getMappingForMethod( )

```java
protected RequestMappingInfo getMappingForMethod(Method method, Class<?> handlerType) {
		//处理方法上的@RequestMapping
		RequestMappingInfo info = createRequestMappingInfo(method);
		if (info != null) {
			//处理类上的@RequestMapping
			RequestMappingInfo typeInfo = createRequestMappingInfo(handlerType);
			if (typeInfo != null) {
				//合并操作
				info = typeInfo.combine(info);
			}
			String prefix = getPathPrefix(handlerType);
			if (prefix != null) {
				info = RequestMappingInfo.paths(prefix).options(this.config).build().combine(info);
			}
		}
		return info;
	}
```

createRequestMappingInfo( )

```java
private RequestMappingInfo createRequestMappingInfo(AnnotatedElement element) {
		//找@RequestMapping 
		RequestMapping requestMapping = AnnotatedElementUtils.findMergedAnnotation(element, RequestMapping.class);
		RequestCondition<?> condition = (element instanceof Class ?
				getCustomTypeCondition((Class<?>) element) : getCustomMethodCondition((Method) element));
		//创建RequestMappingInfo
		return (requestMapping != null ? createRequestMappingInfo(requestMapping, condition) : null);
	}
```

createRequestMappingInfo( )

```java
protected RequestMappingInfo createRequestMappingInfo(
			RequestMapping requestMapping, @Nullable RequestCondition<?> customCondition) {
		//解析注解RequestMapping中的各种信息
		RequestMappingInfo.Builder builder = RequestMappingInfo
				.paths(resolveEmbeddedValuesInPatterns(requestMapping.path()))
				.methods(requestMapping.method())
				.params(requestMapping.params())
				.headers(requestMapping.headers())
				.consumes(requestMapping.consumes())
				.produces(requestMapping.produces())
				.mappingName(requestMapping.name());
		if (customCondition != null) {
			builder.customCondition(customCondition);
		}
		return builder.options(this.config).build();
	}
```

7、registerHandlerMethod( )

注册Controller、method、RequestMappingInfo

```java
protected void registerHandlerMethod(Object handler, Method method, RequestMappingInfo mapping) {
		super.registerHandlerMethod(handler, method, mapping);
		updateConsumesCondition(mapping, method);
	}
```

super.registerHandlerMethod( )

```java
protected void registerHandlerMethod(Object handler, Method method, T mapping) {
		this.mappingRegistry.register(mapping, handler, method);
	}
```

register( )

```java
public void register(T mapping, Object handler, Method method) {
			this.readWriteLock.writeLock().lock();
			try {
				//创建HandlerMethod
				HandlerMethod handlerMethod = createHandlerMethod(handler, method);
				validateMethodMapping(handlerMethod, mapping);
				Set<String> directPaths = AbstractHandlerMethodMapping.this.getDirectPaths(mapping);
				for (String path : directPaths) {
					//缓存path和mapping
					this.pathLookup.add(path, mapping);
				}
				String name = null;
				if (getNamingStrategy() != null) {
					name = getNamingStrategy().getName(handlerMethod, mapping);
					//缓存name和handlerMethod
					addMappingName(name, handlerMethod);
				}
				CorsConfiguration corsConfig = initCorsConfiguration(handler, method, mapping);
				if (corsConfig != null) {
					corsConfig.validateAllowCredentials();
					//缓存handlerMethod和corsConfig
					this.corsLookup.put(handlerMethod, corsConfig);
				}
				//缓存mapping和MappingRegistration
				this.registry.put(mapping,
						new MappingRegistration<>(mapping, handlerMethod, directPaths, name, corsConfig != null));
			}
			finally {
				this.readWriteLock.writeLock().unlock();
			}
		}
```

HandlerMethod的构造方法

```java
public HandlerMethod(String beanName, BeanFactory beanFactory, Method method) {
		Assert.hasText(beanName, "Bean name is required");
		Assert.notNull(beanFactory, "BeanFactory is required");
		Assert.notNull(method, "Method is required");
		//bean名称
		this.bean = beanName;
		//beanFactory 
		this.beanFactory = beanFactory;
		Class<?> beanType = beanFactory.getType(beanName);
		if (beanType == null) {
			throw new IllegalStateException("Cannot resolve bean type for bean with name '" + beanName + "'");
		}
		//bean类型
		this.beanType = ClassUtils.getUserClass(beanType);
		//方法
		this.method = method;
		this.bridgedMethod = BridgeMethodResolver.findBridgedMethod(method);
		this.parameters = initMethodParameters();
		//解析@ResponseStatus
		evaluateResponseStatus();
		this.description = initDescription(this.beanType, this.method);
	}
```

MappingRegistry 中的一些主要属性

```java
class MappingRegistry {
		//RequestMappingInfo与MappingRegistration
		private final Map<T, MappingRegistration<T>> registry = new HashMap<>();
		//path和RequestMappingInfo
		private final MultiValueMap<String, T> pathLookup = new LinkedMultiValueMap<>();
		//name和List<HandlerMethod>
		private final Map<String, List<HandlerMethod>> nameLookup = new ConcurrentHashMap<>();
		//HandlerMethod和CorsConfiguration
		private final Map<HandlerMethod, CorsConfiguration> corsLookup = new ConcurrentHashMap<>();
		//读写锁
		private final ReentrantReadWriteLock readWriteLock = new ReentrantReadWriteLock();
	}
```

8、updateConsumesCondition(mapping, method)

回到第七步中

```java
private void updateConsumesCondition(RequestMappingInfo info, Method method) {
		ConsumesRequestCondition condition = info.getConsumesCondition();
		if (!condition.isEmpty()) {
			for (Parameter parameter : method.getParameters()) {
				//@RequestBody
				MergedAnnotation<RequestBody> annot = MergedAnnotations.from(parameter).get(RequestBody.class);
				if (annot.isPresent()) {
					condition.setBodyRequired(annot.getBoolean("required"));
					break;
				}
			}
		}
	}
```

## 三、getHandler( )

1、DispatcherServlet.getHandler( )

```java
	@Nullable
	protected HandlerExecutionChain getHandler(HttpServletRequest request) throws Exception {
		if (this.handlerMappings != null) {
			for (HandlerMapping mapping : this.handlerMappings) {
				//遍历所有handlerMappings，这里分析RequestMappingHandlerMapping
				HandlerExecutionChain handler = mapping.getHandler(request);
				if (handler != null) {
					return handler;
				}
			}
		}
		return null;
	}
```

2、AbstractHandlerMapping.getHandler( )

```java
public final HandlerExecutionChain getHandler(HttpServletRequest request) throws Exception {
		//调用子类的getHandlerInternal
		Object handler = getHandlerInternal(request);
		if (handler == null) {
			//没有找到，使用默认的
			handler = getDefaultHandler();
		}
		if (handler == null) {
			return null;
		}
		// Bean name or resolved handler?
		if (handler instanceof String) {
			String handlerName = (String) handler;
			//根据beanName获取Bean
			handler = obtainApplicationContext().getBean(handlerName);
		}
		// Ensure presence of cached lookupPath for interceptors and others
		if (!ServletRequestPathUtils.hasCachedPath(request)) {
			initLookupPath(request);
		}
		//获取执行器链，包含handler和interceptors
		HandlerExecutionChain executionChain = getHandlerExecutionChain(handler, request);
		if (logger.isTraceEnabled()) {
			logger.trace("Mapped to " + handler);
		}
		else if (logger.isDebugEnabled() && !DispatcherType.ASYNC.equals(request.getDispatcherType())) {
			logger.debug("Mapped to " + executionChain.getHandler());
		}
		//处理跨域
		if (hasCorsConfigurationSource(handler) || CorsUtils.isPreFlightRequest(request)) {
			CorsConfiguration config = getCorsConfiguration(handler, request);
			if (getCorsConfigurationSource() != null) {
				CorsConfiguration globalConfig = getCorsConfigurationSource().getCorsConfiguration(request);
				config = (globalConfig != null ? globalConfig.combine(config) : config);
			}
			if (config != null) {
				config.validateAllowCredentials();
			}
			executionChain = getCorsHandlerExecutionChain(request, executionChain, config);
		}
		return executionChain;
	}
```

3、RequestMappingHandlerMapping.getHandlerInternal( )

```java
protected HandlerMethod getHandlerInternal(HttpServletRequest request) throws Exception {
		request.removeAttribute(PRODUCIBLE_MEDIA_TYPES_ATTRIBUTE);
		try {
			//又进入父类的getHandlerInternal
			return super.getHandlerInternal(request);
		}
		finally {
			ProducesRequestCondition.clearMediaTypesAttribute(request);
		}
	}
```

4、AbstractHandlerMethodMapping.getHandlerInternal( )

```java
protected HandlerMethod getHandlerInternal(HttpServletRequest request) throws Exception {
		//查找访问的路径，具有全路径匹配、进行URL的decode操作、移除URL中分号的内容等功能
		String lookupPath = initLookupPath(request);
		this.mappingRegistry.acquireReadLock();
		try {
			//根据路径找到访问的方法，从缓存中获取
			HandlerMethod handlerMethod = lookupHandlerMethod(lookupPath, request);
			//根据Bean name创建Controller Bean对象
			return (handlerMethod != null ? handlerMethod.createWithResolvedBean() : null);
		}
		finally {
			this.mappingRegistry.releaseReadLock();
		}
	}
```

5、lookupHandlerMethod( )

从springmvc容器中找出对应的controller和method的信息，当结果大于一个时，通过比较器比较RequestMappingInfo中的各属性，获取最优匹配的方法。

```java
protected HandlerMethod lookupHandlerMethod(String lookupPath, HttpServletRequest request) throws Exception {
		List<Match> matches = new ArrayList<>();
		//从缓存中获取
		List<T> directPathMatches = this.mappingRegistry.getMappingsByDirectPath(lookupPath);
		if (directPathMatches != null) {
			addMatchingMappings(directPathMatches, matches, request);
		}
		if (matches.isEmpty()) {
			addMatchingMappings(this.mappingRegistry.getRegistrations().keySet(), matches, request);
		}
		if (!matches.isEmpty()) {
			Match bestMatch = matches.get(0);
			//找出最优的匹配方法
			if (matches.size() > 1) {
				Comparator<Match> comparator = new MatchComparator(getMappingComparator(request));
				matches.sort(comparator);
				bestMatch = matches.get(0);
				if (logger.isTraceEnabled()) {
					logger.trace(matches.size() + " matching mappings: " + matches);
				}
				if (CorsUtils.isPreFlightRequest(request)) {
					for (Match match : matches) {
						if (match.hasCorsConfig()) {
							return PREFLIGHT_AMBIGUOUS_MATCH;
						}
					}
				}
				else {
					Match secondBestMatch = matches.get(1);
					if (comparator.compare(bestMatch, secondBestMatch) == 0) {
						Method m1 = bestMatch.getHandlerMethod().getMethod();
						Method m2 = secondBestMatch.getHandlerMethod().getMethod();
						String uri = request.getRequestURI();
						throw new IllegalStateException(
								"Ambiguous handler methods mapped for '" + uri + "': {" + m1 + ", " + m2 + "}");
					}
				}
			}
			request.setAttribute(BEST_MATCHING_HANDLER_ATTRIBUTE, bestMatch.getHandlerMethod());
			handleMatch(bestMatch.mapping, lookupPath, request);
			return bestMatch.getHandlerMethod();
		}
		else {
			return handleNoMatch(this.mappingRegistry.getRegistrations().keySet(), lookupPath, request);
		}
	}
```

## 总结

本文简单介绍了RequestMappingHandlerMapping的初始化流程以及解析@Controller或@RequestMapping的流程以及getHandler的过程。
