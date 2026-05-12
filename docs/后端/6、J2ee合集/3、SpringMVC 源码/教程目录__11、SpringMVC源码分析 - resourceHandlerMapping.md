# 11、SpringMVC源码分析 - resourceHandlerMapping
- 来源：https://ddkk.com/zhuanlan/j2ee/springmvc/7/11.html
- 分类：J2EE框架
- 分组：教程目录
## 前言

resourceHandlerMapping提供了资源的访问。

## 一、resourceHandlerMapping

```java
	@Nullable
	public HandlerMapping resourceHandlerMapping(
			@Qualifier("mvcContentNegotiationManager") ContentNegotiationManager contentNegotiationManager,
			@Qualifier("mvcConversionService") FormattingConversionService conversionService,
			@Qualifier("mvcResourceUrlProvider") ResourceUrlProvider resourceUrlProvider) {
		Assert.state(this.applicationContext != null, "No ApplicationContext set");
		Assert.state(this.servletContext != null, "No ServletContext set");
		PathMatchConfigurer pathConfig = getPathMatchConfigurer();
		ResourceHandlerRegistry registry = new ResourceHandlerRegistry(this.applicationContext,
				this.servletContext, contentNegotiationManager, pathConfig.getUrlPathHelper());
		//注册ResourceHandler
		addResourceHandlers(registry);
		//获取handlerMapping ，这里是SimpleUrlHandlerMapping，handler是ResourceHttpRequestHandler
		AbstractHandlerMapping handlerMapping = registry.getHandlerMapping();
		if (handlerMapping == null) {
			return null;
		}
		if (pathConfig.getPatternParser() != null) {
			handlerMapping.setPatternParser(pathConfig.getPatternParser());
		}
		else {
			handlerMapping.setUrlPathHelper(pathConfig.getUrlPathHelperOrDefault());
			handlerMapping.setPathMatcher(pathConfig.getPathMatcherOrDefault());
		}
		//拦截器
		handlerMapping.setInterceptors(getInterceptors(conversionService, resourceUrlProvider));
		//跨域
		handlerMapping.setCorsConfigurations(getCorsConfigurations());
		return handlerMapping;
	}
```

## 二、ResourceHttpRequestHandler

接着上一步中registry.getHandlerMapping()分析

1、getHandlerMapping( )

```java
protected AbstractHandlerMapping getHandlerMapping() {
		if (this.registrations.isEmpty()) {
			return null;
		}
		Map<String, HttpRequestHandler> urlMap = new LinkedHashMap<>();
		for (ResourceHandlerRegistration registration : this.registrations) {
			for (String pathPattern : registration.getPathPatterns()) {
				//获取ResourceHttpRequestHandler 
				ResourceHttpRequestHandler handler = registration.getRequestHandler();
				if (this.pathHelper != null) {
					handler.setUrlPathHelper(this.pathHelper);
				}
				if (this.contentNegotiationManager != null) {
					handler.setContentNegotiationManager(this.contentNegotiationManager);
				}
				handler.setServletContext(this.servletContext);
				handler.setApplicationContext(this.applicationContext);
				try {
					//调用afterPropertiesSet()
					handler.afterPropertiesSet();
				}
				catch (Throwable ex) {
					throw new BeanInitializationException("Failed to init ResourceHttpRequestHandler", ex);
				}
				urlMap.put(pathPattern, handler);
			}
		}
		//构建SimpleUrlHandlerMapping
		return new SimpleUrlHandlerMapping(urlMap, this.order);
	}
```

2、getRequestHandler( )

```java
protected ResourceHttpRequestHandler getRequestHandler() {
		//创建ResourceHttpRequestHandler 
		ResourceHttpRequestHandler handler = new ResourceHttpRequestHandler();
		if (this.resourceChainRegistration != null) {
		    //填充属性
			handler.setResourceResolvers(this.resourceChainRegistration.getResourceResolvers());
			handler.setResourceTransformers(this.resourceChainRegistration.getResourceTransformers());
		}
		//locationValues保存着资源的路径
		handler.setLocationValues(this.locationValues);
		handler.setLocations(this.locationsResources);
		if (this.cacheControl != null) {
			handler.setCacheControl(this.cacheControl);
		}
		else if (this.cachePeriod != null) {
			handler.setCacheSeconds(this.cachePeriod);
		}
		handler.setUseLastModified(this.useLastModified);
		return handler;
	}
```

## 三、HttpRequestHandlerAdapter

1、handle( )

```java
HttpRequestHandlerAdapter.java
public ModelAndView handle(HttpServletRequest request, HttpServletResponse response, Object handler)
			throws Exception {
		((HttpRequestHandler) handler).handleRequest(request, response);
		return null;
	}
```

2、handleRequest( )

```java
ResourceHttpRequestHandler.java
public void handleRequest(HttpServletRequest request, HttpServletResponse response)
			throws ServletException, IOException {
		// For very general mappings (e.g. "/") we need to check 404 first
		//获取请求资源
		Resource resource = getResource(request);
		if (resource == null) {
			logger.debug("Resource not found");
			response.sendError(HttpServletResponse.SC_NOT_FOUND);
			return;
		}
		if (HttpMethod.OPTIONS.matches(request.getMethod())) {
			response.setHeader("Allow", getAllowHeader());
			return;
		}
		// Supported methods and required session
		checkRequest(request);
		// Header phase
		//校验资源有没有变化过
		if (isUseLastModified() && new ServletWebRequest(request, response).checkNotModified(resource.lastModified())) {
			logger.trace("Resource not modified");
			return;
		}
		// Apply cache settings, if any
		prepareResponse(response);
		// Check the media type for the resource
		MediaType mediaType = getMediaType(request, resource);
		setHeaders(response, resource, mediaType);
		// Content phase
		ServletServerHttpResponse outputMessage = new ServletServerHttpResponse(response);
		if (request.getHeader(HttpHeaders.RANGE) == null) {
			Assert.state(this.resourceHttpMessageConverter != null, "Not initialized");
			this.resourceHttpMessageConverter.write(resource, mediaType, outputMessage);
		}
		else {
			Assert.state(this.resourceRegionHttpMessageConverter != null, "Not initialized");
			ServletServerHttpRequest inputMessage = new ServletServerHttpRequest(request);
			try {
				List<HttpRange> httpRanges = inputMessage.getHeaders().getRange();
				response.setStatus(HttpServletResponse.SC_PARTIAL_CONTENT);
				this.resourceRegionHttpMessageConverter.write(
						HttpRange.toResourceRegions(httpRanges, resource), mediaType, outputMessage);
			}
			catch (IllegalArgumentException ex) {
				response.setHeader(HttpHeaders.CONTENT_RANGE, "bytes */" + resource.contentLength());
				response.sendError(HttpServletResponse.SC_REQUESTED_RANGE_NOT_SATISFIABLE);
			}
		}
	}
```

3、getResource( )

```java
ResourceHttpRequestHandler.java
@Nullable
	protected Resource getResource(HttpServletRequest request) throws IOException {
		String path = (String) request.getAttribute(HandlerMapping.PATH_WITHIN_HANDLER_MAPPING_ATTRIBUTE);
		if (path == null) {
			throw new IllegalStateException("Required request attribute '" +
					HandlerMapping.PATH_WITHIN_HANDLER_MAPPING_ATTRIBUTE + "' is not set");
		}
		//处理路径
		path = processPath(path);
		if (!StringUtils.hasText(path) || isInvalidPath(path)) {
			return null;
		}
		if (isInvalidEncodedPath(path)) {
			return null;
		}
		Assert.notNull(this.resolverChain, "ResourceResolverChain not initialized.");
		Assert.notNull(this.transformerChain, "ResourceTransformerChain not initialized.");
		//根据设置的路径找到资源
		Resource resource = this.resolverChain.resolveResource(request, path, getLocations());
		if (resource != null) {
			resource = this.transformerChain.transform(request, resource);
		}
		return resource;
	}
```

4、resolveResource( )

```java
DefaultResourceResolverChain.java
public Resource resolveResource(
			@Nullable HttpServletRequest request, String requestPath, List<? extends Resource> locations) {
		return (this.resolver != null && this.nextChain != null ?
				this.resolver.resolveResource(request, requestPath, locations, this.nextChain) : null);
	}
```

5、最终通过PathResourceResolver获取请求资源

```java
private Resource getResource(String resourcePath, @Nullable HttpServletRequest request,
			List<? extends Resource> locations) {
		for (Resource location : locations) {
			try {
				//
				String pathToUse = encodeOrDecodeIfNecessary(resourcePath, request, location);
				Resource resource = getResource(pathToUse, location);
				if (resource != null) {
					return resource;
				}
			}
			catch (IOException ex) {
				if (logger.isDebugEnabled()) {
					String error = "Skip location [" + location + "] due to error";
					if (logger.isTraceEnabled()) {
						logger.trace(error, ex);
					}
					else {
						logger.debug(error + ": " + ex.getMessage());
					}
				}
			}
		}
		return null;
	}
```

6、getResource( )

```java
protected Resource getResource(String resourcePath, Resource location) throws IOException {
		Resource resource = location.createRelative(resourcePath);
		if (resource.isReadable()) {
			if (checkResource(resource, location)) {
				return resource;
			}
			else if (logger.isWarnEnabled()) {
				Resource[] allowedLocations = getAllowedLocations();
				logger.warn("Resource path \"" + resourcePath + "\" was successfully resolved " +
						"but resource \"" +	resource.getURL() + "\" is neither under the " +
						"current location \"" + location.getURL() + "\" nor under any of the " +
						"allowed locations " + (allowedLocations != null ? Arrays.asList(allowedLocations) : "[]"));
			}
		}
		return null;
	}
```

7、createRelative( )

通过ClassPathResource获取资源

```java
public Resource createRelative(String relativePath) {
		String pathToUse = StringUtils.applyRelativePath(this.path, relativePath);
		return (this.clazz != null ? new ClassPathResource(pathToUse, this.clazz) :
				new ClassPathResource(pathToUse, this.classLoader));
	}
```

## 四、示例

```java
@Configuration
public class ResourceHandlerConfig implements WebMvcConfigurer {
    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        registry.
                addResourceHandler("/swagger-ui/**")
                .addResourceLocations("classpath:/META-INF/resources/webjars/springfox-swagger-ui/")
                .resourceChain(false);
    }
}
```

当访问以/swagger-ui/开头的路径下资源时，会在classpath:/META-INF/resources/webjars/springfox-swagger-ui/路径下查找资源。

## 总结

通过addResourceHandlers注册资源，通过ClassPathResource获取资源。
