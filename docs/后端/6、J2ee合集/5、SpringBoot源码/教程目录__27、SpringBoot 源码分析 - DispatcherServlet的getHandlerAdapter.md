# 27、SpringBoot 源码分析 - DispatcherServlet的getHandlerAdapter
- 来源：https://ddkk.com/zhuanlan/j2ee/springboot/6/27.html
- 分类：J2EE框架
- 分组：教程目录
## 处理大致流程图

## 获取处理器适配器

### 适配器模式

为什么要处理器适配器，我们前面不是获取处理器方法了么，直接调用就好啦。对没错，但是那可能只是一种处理器的方式，也就是`HandlerMethod`，以前还有另外的方式哦，比如实现`Controller`接口的：

还有实现`HttpRequestHandler`接口的：

他们的接口都不一样，总得兼容吧，处理接口不一致的办法不就是适配器模式嘛，你接口不同，我用不同的适配器来适配，对外都是统一接口，如果以后有新的实现，我只要添加适配器即可，这里就是适配器模式的应用啦。

### DispatcherServlet的getHandlerAdapter

这里就是遍历所有的处理器适配器，看哪个是适配的就直接返回了。

```java
	protected HandlerAdapter getHandlerAdapter(Object handler) throws ServletException {
		if (this.handlerAdapters != null) {
			for (HandlerAdapter adapter : this.handlerAdapters) {
				if (adapter.supports(handler)) {
					return adapter;
				}
			}
		}
		throw new ServletException("No adapter for handler [" + handler +
				"]: The DispatcherServlet configuration needs to include a HandlerAdapter that supports this handler");
	}
```

#### 如何适配

#### RequestMappingHandlerAdapter的supports

判断是否是HandlerMethod类型的。

```java
	@Override
	public final boolean supports(Object handler) {
		return (handler instanceof HandlerMethod && supportsInternal((HandlerMethod) handler));
	}
	@Override
	protected boolean supportsInternal(HandlerMethod handlerMethod) {
		return true;
	}
```

#### HttpRequestHandlerAdapter的supports

是不是实现了`HttpRequestHandler`接口。

```java
	@Override
	public boolean supports(Object handler) {
		return (handler instanceof HttpRequestHandler);
	}
```

#### SimpleControllerHandlerAdapter的supports

是不是实现了`Controller`接口。

```java
	@Override
	public boolean supports(Object handler) {
		return (handler instanceof Controller);
	}
```

至于这些是什么时候初始化的，我就不说了，前面已经把方法都演示过了，就是一些自动配置类里，自己可以去找啦，剩下的适配器自己可以也去看看。

## 处理器适配器处理

其实前面有拦截器，后面会说，还是说主要的，处理器适配器获得到之后，要进行适配器调用啦，不同的适配器调用方式不一样，但是核心还是调用处理器的方法啦：

```java
mv = ha.handle(processedRequest, response, mappedHandler.getHandler());
```

### HttpRequestHandlerAdapter的handle

转换成接口类型，调用接口。

```java
	@Override
	@Nullable
	public ModelAndView handle(HttpServletRequest request, HttpServletResponse response, Object handler)
			throws Exception {
		((HttpRequestHandler) handler).handleRequest(request, response);
		return null;
	}
```

### SimpleControllerHandlerAdapter的handle

这个也一样。

```java
	@Override
	@Nullable
	public ModelAndView handle(HttpServletRequest request, HttpServletResponse response, Object handler)
			throws Exception {
		return ((Controller) handler).handleRequest(request, response);
	}
```

### AbstractHandlerMethodAdapter的handle

这个是重点，我们要详细说。

```java
	@Override
	@Nullable
	public final ModelAndView handle(HttpServletRequest request, HttpServletResponse response, Object handler)
			throws Exception {
		return handleInternal(request, response, (HandlerMethod) handler);
	}
```

### RequestMappingHandlerAdapter的handleInternal

留出核心代码，就是处理器处理，然后准备`response`。

```java
@Override
	protected ModelAndView handleInternal(HttpServletRequest request,
			HttpServletResponse response, HandlerMethod handlerMethod) throws Exception {
		ModelAndView mav;
		...
		mav = invokeHandlerMethod(request, response, handlerMethod);//		
		...
		prepareResponse(response);
		...
		return mav;
	}
```

#### invokeHandlerMethod

这里面的才是重点，每个都挺复杂的，没关系，我们一个个来看，新不追求太细节的东西，知道大致流程,大致的流程就是创建数据绑定工厂，这个东西就是做参数绑定用的，后面会介绍，然后是模型工厂，最终是要创建模型返回的，所以需要这个，而且数据绑定工厂也会封装在里面。然后初始化模型，会根据方法的参数来找解析器解析，找到的话就可以解析出参数，最后封装到模型里去，最后再调用处理器的方法处理，然后获取模型和视图返回。看起来好像没多少东西，其实里面还是表深的。

```java
@Nullable
	protected ModelAndView invokeHandlerMethod(HttpServletRequest request,
			HttpServletResponse response, HandlerMethod handlerMethod) throws Exception {
		//先封装一个
		ServletWebRequest webRequest = new ServletWebRequest(request, response);
		try {
			WebDataBinderFactory binderFactory = getDataBinderFactory(handlerMethod);//数据绑定工厂
			ModelFactory modelFactory = getModelFactory(handlerMethod, binderFactory);//模型工厂
			//进行handlerMethod封装
			ServletInvocableHandlerMethod invocableMethod = createInvocableHandlerMethod(handlerMethod);
			if (this.argumentResolvers != null) {
     //设置参数解析器
				invocableMethod.setHandlerMethodArgumentResolvers(this.argumentResolvers);
			}
			if (this.returnValueHandlers != null) {
     //设置返回类型解析器
				invocableMethod.setHandlerMethodReturnValueHandlers(this.returnValueHandlers);
			}
			invocableMethod.setDataBinderFactory(binderFactory);//绑定工厂
			invocableMethod.setParameterNameDiscoverer(this.parameterNameDiscoverer);//参数名探测器
			//创建ModelAndView容器
			ModelAndViewContainer mavContainer = new ModelAndViewContainer();
			mavContainer.addAllAttributes(RequestContextUtils.getInputFlashMap(request));//获取前面重定向来的属性
			modelFactory.initModel(webRequest, mavContainer, invocableMethod);//初始化模型
			mavContainer.setIgnoreDefaultModelOnRedirect(this.ignoreDefaultModelOnRedirect);
			...
			//调用处理方法
			invocableMethod.invokeAndHandle(webRequest, mavContainer);
			...
			return getModelAndView(mavContainer, modelFactory, webRequest);
		}
		finally {
			webRequest.requestCompleted();
		}
```

下一篇来一个个讲吧。

好了，今天就到这里了，希望对学习理解有帮助，大神看见勿喷，仅为自己的学习理解，能力有限，请多包涵。
