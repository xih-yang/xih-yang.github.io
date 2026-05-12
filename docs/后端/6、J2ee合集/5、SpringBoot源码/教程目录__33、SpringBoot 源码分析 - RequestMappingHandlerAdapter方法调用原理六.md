# 33、SpringBoot 源码分析 - RequestMappingHandlerAdapter方法调用原理六
- 来源：https://ddkk.com/zhuanlan/j2ee/springboot/6/33.html
- 分类：J2EE框架
- 分组：教程目录
## 处理大致流程图

## ModelFactory的findSessionAttributeArguments寻找session属性参数值

前面花了大篇幅讲模型方法的触发，也就是说在正式调用处理器之前，先调用模型方法，就是有`ModelAttribute`注解的方法，可以给模型添加参数，里面的参数解析和数据绑定也讲了点，但是只是凤毛菱角，后期还是需要再去看的，今天开始继续讲，不然深入细节就没完没了了。

这段代码就是获取方法类上的`SessionAttributes`注解的名字的，只要你的方法参数里有`ModelAttribute`注解，且注解的名字和类上的相同，就返回。如果这个属性值不存在的话，就会去获取，然后放入模型里。

```java
	private List<String> findSessionAttributeArguments(HandlerMethod handlerMethod) {
		List<String> result = new ArrayList<>();
		for (MethodParameter parameter : handlerMethod.getMethodParameters()) {
			if (parameter.hasParameterAnnotation(ModelAttribute.class)) {
     //找出ModelAttribute注解参数
				String name = getNameForParameter(parameter);
				Class<?> paramType = parameter.getParameterType();
				if (this.sessionAttributesHandler.isHandlerSessionAttribute(name, paramType)) {
					result.add(name);//获取参数名对应类上的SessionAttributes注解属性的名字
				}
			}
		}
		return result;
	}
```

比如类上声明了一个直接的属性：

方法里也声明同名的`ModelAttribute`注解的属性名，就会对应上，马上就会去找这个值。

比如现在模型里的属性：

这个`ThymeleafSessionAttribute`肯定不存在：

### SessionAttributesHandler的retrieveAttribute

最终会去请求的`session`域中去找，这个就不深入了，开始肯定找不到的，底层连`session`都没创建呢。

```java
	@Nullable
	Object retrieveAttribute(WebRequest request, String attributeName) {
		return this.sessionAttributeStore.retrieveAttribute(request, attributeName);
	}
	@Override
	@Nullable
	public Object retrieveAttribute(WebRequest request, String attributeName) {
		Assert.notNull(request, "WebRequest must not be null");
		Assert.notNull(attributeName, "Attribute name must not be null");
		String storeAttributeName = getAttributeNameInSession(request, attributeName);
		return request.getAttribute(storeAttributeName, WebRequest.SCOPE_SESSION);
	}
```

然后就会报个异常，我们暂时不管这个，继续往后：

## ServletInvocableHandlerMethod的invokeAndHandle调用处理器方法

前面模型初始化基本完成，要调用处理器方法了，内部和模型方法调用逻辑一样，会获取解析的参数值，然后进行数据绑定，最后调用处理方法，如果没有返回值，根据情况设置处理完成，返回，否则就设置处理还未完成，进行返回值解析后返回。

```java
public void invokeAndHandle(ServletWebRequest webRequest, ModelAndViewContainer mavContainer,
			Object... providedArgs) throws Exception {
		//调用方法后获取返回值
		Object returnValue = invokeForRequest(webRequest, mavContainer, providedArgs);
		setResponseStatus(webRequest);
		if (returnValue == null) {
     //无返回值
			if (isRequestNotModified(webRequest) || getResponseStatus() != null || mavContainer.isRequestHandled()) {
				disableContentCachingIfNecessary(webRequest);
				mavContainer.setRequestHandled(true);
				return;
			}
		}
		else if (StringUtils.hasText(getResponseStatusReason())) {
			mavContainer.setRequestHandled(true);//有返回状态，设置处理完了
			return;
		}
		mavContainer.setRequestHandled(false);//还没全部处理好，因为有返回
		Assert.state(this.returnValueHandlers != null, "No return value handlers");
		try {
     //处理返回值
			this.returnValueHandlers.handleReturnValue(
					returnValue, getReturnValueType(returnValue), mavContainer, webRequest);
		}
		catch (Exception ex) {
			if (logger.isTraceEnabled()) {
				logger.trace(formatErrorForReturnValue(returnValue), ex);
			}
			throw ex;
		}
	}
```

### ServletInvocableHandlerMethod的handleReturnValue处理返回值

需要找到返回值类型处理器，跟参数解析那种类似。

```java
	@Override
	public void handleReturnValue(@Nullable Object returnValue, MethodParameter returnType,
			ModelAndViewContainer mavContainer, NativeWebRequest webRequest) throws Exception {
		//获取方法返回处理器
		HandlerMethodReturnValueHandler handler = selectHandler(returnValue, returnType);
		if (handler == null) {
			throw new IllegalArgumentException("Unknown return value type: " + returnType.getParameterType().getName());
		}
		handler.handleReturnValue(returnValue, returnType, mavContainer, webRequest);//处理返回值
	}
```

#### HandlerMethodReturnValueHandlerComposite的selectHandler选择处理器

这个逻辑很熟悉吧，就是遍历所有的处理器，看符合哪个条件就用用哪个解析。

```java
	@Nullable
	private HandlerMethodReturnValueHandler selectHandler(@Nullable Object value, MethodParameter returnType) {
		boolean isAsyncValue = isAsyncReturnValue(value, returnType);
		for (HandlerMethodReturnValueHandler handler : this.returnValueHandlers) {
			if (isAsyncValue && !(handler instanceof AsyncHandlerMethodReturnValueHandler)) {
				continue;//异步的
			}
			if (handler.supportsReturnType(returnType)) {
     //匹配返回值类型
				return handler;
			}
		}
		return null;
	}
```

## RequestMappingHandlerAdapter的getModelAndView获取模型和视图

首先会更新`session`属性，然后检查绑定的数据是否有问题，有的话就要处理，然后把处理器处理返回的结果和模型一起封装成`ModelAndView`返回。

```java
	@Nullable
	private ModelAndView getModelAndView(ModelAndViewContainer mavContainer,
			ModelFactory modelFactory, NativeWebRequest webRequest) throws Exception {
		modelFactory.updateModel(webRequest, mavContainer);//更新session属性，处理数据绑定结果
		if (mavContainer.isRequestHandled()) {
     //已经处理完成，就不处理了
			return null;
		}
		ModelMap model = mavContainer.getModel();
		ModelAndView mav = new ModelAndView(mavContainer.getViewName(), model, mavContainer.getStatus());
		if (!mavContainer.isViewReference()) {
     //view非String类型
			mav.setView((View) mavContainer.getView());
		}
		if (model instanceof RedirectAttributes) {
     //保存重定向中传递的数据RedirectAttributes
			Map<String, ?> flashAttributes = ((RedirectAttributes) model).getFlashAttributes();
			HttpServletRequest request = webRequest.getNativeRequest(HttpServletRequest.class);
			if (request != null) {
				RequestContextUtils.getOutputFlashMap(request).putAll(flashAttributes);
			}
		}
		return mav;
	}
```

### ModelFactory的updateModel

如果`SessionStatus`完成状态了，就清除`sessionAttributesHandler`，否则就从模型中获取`sessionAttributesHandler`需要的属性，保存到底层`session`里。还要进行绑定结果的更新。

```java
public void updateModel(NativeWebRequest request, ModelAndViewContainer container) throws Exception {
		ModelMap defaultModel = container.getDefaultModel();
		if (container.getSessionStatus().isComplete()){
			this.sessionAttributesHandler.cleanupAttributes(request);//如果完成了就清除该清除的session属性
		}
		else {
			this.sessionAttributesHandler.storeAttributes(request, defaultModel);//设置session属性
		}
		if (!container.isRequestHandled() && container.getModel() == defaultModel) {
			updateBindingResult(request, defaultModel);//更新绑定结果，如果没绑定好，会有错误信息
		}
	}
```

## updateBindingResult更新绑定结果

遍历所有的模型属性，查看绑定结果，如果没有的话，要创建一个，其实绑定好了之后，都会新添加一个`org.springframework.validation.BindingResult.xx`的模型属性。

```java
private void updateBindingResult(NativeWebRequest request, ModelMap model) throws Exception {
		List<String> keyNames = new ArrayList<>(model.keySet());
		for (String name : keyNames) {
			Object value = model.get(name);
			if (value != null && isBindingCandidate(name, value)) {
     //是绑定的属性
				String bindingResultKey = BindingResult.MODEL_KEY_PREFIX + name;
				if (!model.containsAttribute(bindingResultKey)) {
     //如果没有包含绑定的属性，可能有问题，要有绑定结果BindingResult
					WebDataBinder dataBinder = this.dataBinderFactory.createBinder(request, value, name);
					model.put(bindingResultKey, dataBinder.getBindingResult());
				}
			}
		}
	}
```

细节都先留着，下次慢慢讲吧。

好了，今天就到这里了，希望对学习理解有帮助，大神看见勿喷，仅为自己的学习理解，能力有限，请多包涵。
