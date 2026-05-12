# 30、SpringBoot 源码分析 - RequestMappingHandlerAdapter方法调用原理三
- 来源：https://ddkk.com/zhuanlan/j2ee/springboot/6/30.html
- 分类：J2EE框架
- 分组：教程目录
## 处理大致流程图

## ModelFactory的initModel初始化模型

前面数据绑定工厂和模型工厂都创建好了，现在我们要进行模型初始化了。其实就是将`session`里的属性和并到模型，然后调用模型方法，获取注解的参数的值放入模型里，说白了就是先处理模型方法，然后把属性放入模型。

```java
public void initModel(NativeWebRequest request, ModelAndViewContainer container, HandlerMethod handlerMethod)
			throws Exception {
		//获取session属性
		Map<String, ?> sessionAttributes = this.sessionAttributesHandler.retrieveAttributes(request);
		container.mergeAttributes(sessionAttributes);//合并到模型里，内部有个ModelMap
		invokeModelAttributeMethods(request, container);//调用模型方法
		//获取方法ModelAttribute注解属性参数，放入模型里
		for (String name : findSessionAttributeArguments(handlerMethod)) {
			if (!container.containsAttribute(name)) {
				Object value = this.sessionAttributesHandler.retrieveAttribute(request, name);
				if (value == null) {
					throw new HttpSessionRequiredException("Expected session attribute '" + name + "'", name);
				}
				container.addAttribute(name, value);
			}
		}
	}
```

### invokeModelAttributeMethods调用模型方法

遍历所有的模型方法，获取`ModelAttribute`的属性，设置是否要绑定，然后调用模型方法，如果有返回值的话作为属性添加到模型容器。

```java
private void invokeModelAttributeMethods(NativeWebRequest request, ModelAndViewContainer container)
			throws Exception {
		while (!this.modelMethods.isEmpty()) {
			InvocableHandlerMethod modelMethod = getNextModelMethod(container).getHandlerMethod();//获取模型容器的处理方法
			ModelAttribute ann = modelMethod.getMethodAnnotation(ModelAttribute.class);
			Assert.state(ann != null, "No ModelAttribute annotation");//应该有ModelAttribute注解的，不然就报错
			if (container.containsAttribute(ann.name())) {
     //模型容器内有包含ModelAttribute注解的属性
				if (!ann.binding()) {
     //不进行绑定
					container.setBindingDisabled(ann.name());
				}
				continue;
			}
			//调用模型方法
			Object returnValue = modelMethod.invokeForRequest(request, container);
			if (!modelMethod.isVoid()){
     //返回值不为空的话，就作为属性添加到模型容器里
				String returnValueName = getNameForReturnValue(returnValue, modelMethod.getReturnType());
				if (!ann.binding()) {
					container.setBindingDisabled(returnValueName);
				}
				if (!container.containsAttribute(returnValueName)) {
					container.addAttribute(returnValueName, returnValue);
				}
			}
		}
	}
```

#### getNextModelMethod获取下一个模型方法

这里会先进行依赖的判断，如果不满足就跳过，依赖就是上篇说的方法参数有`ModelAttribute`注解的。先按顺序处理没依赖的，最后才是剩下来的。

```java
	//先处理无依赖的，再处理有依赖的，这个时候依赖值属性还没有赋值
	private ModelMethod getNextModelMethod(ModelAndViewContainer container) {
		for (ModelMethod modelMethod : this.modelMethods) {
			if (modelMethod.checkDependencies(container)) {
     //属性依赖检查，看是否有属性值
				this.modelMethods.remove(modelMethod);
				return modelMethod;
			}
		}
		ModelMethod modelMethod = this.modelMethods.get(0);//没有就拿第一个
		this.modelMethods.remove(modelMethod);
		return modelMethod;
	}
```

##### InvocableHandlerMethod的invokeForRequest

根据请求信息，获取相应的方法参数值，然后调用，核心在如何获取方法参数值。

```java
	@Nullable
	public Object invokeForRequest(NativeWebRequest request, @Nullable ModelAndViewContainer mavContainer,
			Object... providedArgs) throws Exception {
		//获取方法参数的值
		Object[] args = getMethodArgumentValues(request, mavContainer, providedArgs);
		if (logger.isTraceEnabled()) {
			logger.trace("Arguments: " + Arrays.toString(args));
		}
		return doInvoke(args);//调用方法
	}
```

##### getMethodArgumentValues获取方法参数值

如果是无参的，就直接返回空的参数数组，否则就开始遍历每个方法参数，遍历所有的参数解析器，找出可用解析的，然后进行解析赋值返回，好像听着很容易，其实内部很复杂，我们稍微来看下吧。

```java
protected Object[] getMethodArgumentValues(NativeWebRequest request, @Nullable ModelAndViewContainer mavContainer,
			Object... providedArgs) throws Exception {
		//获取方法参数
		MethodParameter[] parameters = getMethodParameters();
		if (ObjectUtils.isEmpty(parameters)) {
			return EMPTY_ARGS;//无参
		}
		Object[] args = new Object[parameters.length];
		for (int i = 0; i < parameters.length; i++) {
			MethodParameter parameter = parameters[i];
			parameter.initParameterNameDiscovery(this.parameterNameDiscoverer);//设置参数探索器
			args[i] = findProvidedArgument(parameter, providedArgs);//从给定参数providedArgs中寻找参数
			if (args[i] != null) {
     //有给定参数了就继续一下个
				continue;
			}
			if (!this.resolvers.supportsParameter(parameter)) {
     //遍历所有参数解析器是否支持参数，不支持的就报异常
				throw new IllegalStateException(formatArgumentError(parameter, "No suitable resolver"));
			}
			try {
     //尝试解析
				args[i] = this.resolvers.resolveArgument(parameter, mavContainer, request, this.dataBinderFactory);
			}
			catch (Exception ex) {
				// Leave stack trace for later, exception may actually be resolved and 
				...
				throw ex;
			}
		}
		return args;
	}
```

##### HandlerMethodArgumentResolverComposite的supportsParameter

首先从缓存里获取参数对应的解析器，没有的话遍历所有的参数解析器，能解析的就放入缓存返回。

```java
	@Override
	public boolean supportsParameter(MethodParameter parameter) {
		return getArgumentResolver(parameter) != null;
	}
	@Nullable
	private HandlerMethodArgumentResolver getArgumentResolver(MethodParameter parameter) {
		HandlerMethodArgumentResolver result = this.argumentResolverCache.get(parameter);//缓存取
		if (result == null) {
     //遍历所有解析器，找出支持的
			for (HandlerMethodArgumentResolver resolver : this.argumentResolvers) {
				if (resolver.supportsParameter(parameter)) {
					result = resolver;//找到后放入缓存
					this.argumentResolverCache.put(parameter, result);
					break;
				}
			}
		}
		return result;
	}
```

参数解析器有那么多，其实都是在`RequestMappingHandlerAdapter`初始化的时候添加的，在`afterPropertiesSet`方法里，有兴趣的可以去看看：

这里添加了所有的解析器：

好了，今天就到这里了，希望对学习理解有帮助，大神看见勿喷，仅为自己的学习理解，能力有限，请多包涵。
