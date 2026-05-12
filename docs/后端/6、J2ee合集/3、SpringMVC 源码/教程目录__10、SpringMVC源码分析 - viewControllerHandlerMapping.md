# 10、SpringMVC源码分析 - viewControllerHandlerMapping
- 来源：https://ddkk.com/zhuanlan/j2ee/springmvc/7/10.html
- 分类：J2EE框架
- 分组：教程目录
## 前言

viewControllerHandlerMapping可以提供访问url和实际url的映射。

## 一、viewControllerHandlerMapping

```java
WebMvcConfigurationSupport.java
@Bean
public HandlerMapping viewControllerHandlerMapping(
			@Qualifier("mvcConversionService") FormattingConversionService conversionService,
			@Qualifier("mvcResourceUrlProvider") ResourceUrlProvider resourceUrlProvider) {
		ViewControllerRegistry registry = new ViewControllerRegistry(this.applicationContext);
		//注册ViewController和viewName
		addViewControllers(registry);
		//创建SimpleUrlHandlerMapping
		AbstractHandlerMapping handlerMapping = registry.buildHandlerMapping();
		if (handlerMapping == null) {
			return null;
		}
		PathMatchConfigurer pathConfig = getPathMatchConfigurer();
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

2、addViewControllers( )

从实现WebMvcConfigurer 接口的类中回调addViewControllers( )方法

```java
protected void addViewControllers(ViewControllerRegistry registry) {
		this.configurers.addViewControllers(registry);
	}
```

```java
public void addViewControllers(ViewControllerRegistry registry) {
		for (WebMvcConfigurer delegate : this.delegates) {
			delegate.addViewControllers(registry);
		}
	}
```

3、buildHandlerMapping( )

```java
protected SimpleUrlHandlerMapping buildHandlerMapping() {
		if (this.registrations.isEmpty() && this.redirectRegistrations.isEmpty()) {
			return null;
		}
		//将urlPath和ViewController存入map，其中ViewController是ParameterizableViewController类型
		Map<String, Object> urlMap = new LinkedHashMap<>();
		for (ViewControllerRegistration registration : this.registrations) {
			urlMap.put(registration.getUrlPath(), registration.getViewController());
		}
		for (RedirectViewControllerRegistration registration : this.redirectRegistrations) {
			urlMap.put(registration.getUrlPath(), registration.getViewController());
		}
		//构建SimpleUrlHandlerMapping
		return new SimpleUrlHandlerMapping(urlMap, this.order);
	}
```

## 二、SimpleControllerHandlerAdapter

1、handle( )

```java
SimpleControllerHandlerAdapter.java
public ModelAndView handle(HttpServletRequest request, HttpServletResponse response, Object handler)
			throws Exception {
		return ((Controller) handler).handleRequest(request, response);
	}
```

2、handleRequest( )

```java
AbstractController.java
public ModelAndView handleRequest(HttpServletRequest request, HttpServletResponse response)
			throws Exception {
		if (HttpMethod.OPTIONS.matches(request.getMethod())) {
			response.setHeader("Allow", getAllowHeader());
			return null;
		}
		// Delegate to WebContentGenerator for checking and preparing.
		checkRequest(request);
		prepareResponse(response);
		// Execute handleRequestInternal in synchronized block if required.
		if (this.synchronizeOnSession) {
			HttpSession session = request.getSession(false);
			if (session != null) {
				Object mutex = WebUtils.getSessionMutex(session);
				synchronized (mutex) {
					return handleRequestInternal(request, response);
				}
			}
		}
		//调用子类的handleRequestInternal，handler的实际类型是ParameterizableViewController
		return handleRequestInternal(request, response);
	}
```

3、handleRequestInternal( )

```java
ParameterizableViewController.java
protected ModelAndView handleRequestInternal(HttpServletRequest request, HttpServletResponse response)
			throws Exception {
		//获取viewName
		String viewName = getViewName();
		if (getStatusCode() != null) {
			if (getStatusCode().is3xxRedirection()) {
				request.setAttribute(View.RESPONSE_STATUS_ATTRIBUTE, getStatusCode());
			}
			else {
				response.setStatus(getStatusCode().value());
				if (getStatusCode().equals(HttpStatus.NO_CONTENT) && viewName == null) {
					return null;
				}
			}
		}
		if (isStatusOnly()) {
			return null;
		}
		ModelAndView modelAndView = new ModelAndView();
		modelAndView.addAllObjects(RequestContextUtils.getInputFlashMap(request));
		if (viewName != null) {
			modelAndView.setViewName(viewName);
		}
		else {
			modelAndView.setView(getView());
		}
		return modelAndView;
	}
```

## 三、示例

```java
@Configuration
public class ViewControllerConfig implements WebMvcConfigurer {
    @Override
    public void addViewControllers(ViewControllerRegistry registry) {
        registry.addViewController("/swagger-ui/")
        		.setViewName("forward:/swagger-ui/index.html");
    }
```

在访问/swagger-ui/路径时会跳转到/swagger-ui/index.html的路径。

## 总结

通过addViewControllers注册ViewControllers和ViewName。
