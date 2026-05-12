# 21、SpringMVC源码分析 - HandlerMethodReturnValueHandler
- 来源：https://ddkk.com/zhuanlan/j2ee/springmvc/7/21.html
- 分类：J2EE框架
- 分组：教程目录
## 前言

HandlerMethodReturnValueHandler用于对接口返回值的处理。

## 一、HandlerMethodReturnValueHandler

```java
public interface HandlerMethodReturnValueHandler {
	//是否支持返回值的类型
	boolean supportsReturnType(MethodParameter returnType);
	//对返回值进行处理
	void handleReturnValue(@Nullable Object returnValue, MethodParameter returnType,
			ModelAndViewContainer mavContainer, NativeWebRequest webRequest) throws Exception;
}
```

## 二、ModelAndViewMethodReturnValueHandler

用于处理ModelAndView类型

```java
	@Override
	public boolean supportsReturnType(MethodParameter returnType) {
		//返回值是ModelAndView类型
		return ModelAndView.class.isAssignableFrom(returnType.getParameterType());
	}
	@Override
	public void handleReturnValue(@Nullable Object returnValue, MethodParameter returnType,
			ModelAndViewContainer mavContainer, NativeWebRequest webRequest) throws Exception {
		//返回值是null
		if (returnValue == null) {
			mavContainer.setRequestHandled(true);
			return;
		}
		ModelAndView mav = (ModelAndView) returnValue;
		//view是否是String类型
		if (mav.isReference()) {
			String viewName = mav.getViewName();
			mavContainer.setViewName(viewName);
			//是否是重定向
			if (viewName != null && isRedirectViewName(viewName)) {
				mavContainer.setRedirectModelScenario(true);
			}
		}
		else {
			//处理View类型
			View view = mav.getView();
			mavContainer.setView(view);
			//重定向
			if (view instanceof SmartView && ((SmartView) view).isRedirectView()) {
				mavContainer.setRedirectModelScenario(true);
			}
		}
		mavContainer.setStatus(mav.getStatus());
		mavContainer.addAllAttributes(mav.getModel());
	}
```

## 三、ModelMethodProcessor

用于处理Model类型

```java
	@Override
	public boolean supportsReturnType(MethodParameter returnType) {
		//返回值是Model类型
		return Model.class.isAssignableFrom(returnType.getParameterType());
	}
	@Override
	public void handleReturnValue(@Nullable Object returnValue, MethodParameter returnType,
			ModelAndViewContainer mavContainer, NativeWebRequest webRequest) throws Exception {
		if (returnValue == null) {
			return;
		}
		else if (returnValue instanceof Model) {
			//Model类型，将model的参数添加到ModelMap中
			mavContainer.addAllAttributes(((Model) returnValue).asMap());
		}
		else {
			// should not happen
			throw new UnsupportedOperationException("Unexpected return type [" +
					returnType.getParameterType().getName() + "] in method: " + returnType.getMethod());
		}
	}
```

## 四、ViewMethodReturnValueHandler

用于处理View类型

```java
	@Override
	public boolean supportsReturnType(MethodParameter returnType) {
		//返回值是View类型
		return View.class.isAssignableFrom(returnType.getParameterType());
	}
	@Override
	public void handleReturnValue(@Nullable Object returnValue, MethodParameter returnType,
			ModelAndViewContainer mavContainer, NativeWebRequest webRequest) throws Exception {
		if (returnValue instanceof View) {
			View view = (View) returnValue;
			//设置view
			mavContainer.setView(view);
			//校验重定向
			if (view instanceof SmartView && ((SmartView) view).isRedirectView()) {
				mavContainer.setRedirectModelScenario(true);
			}
		}
		else if (returnValue != null) {
			// should not happen
			throw new UnsupportedOperationException("Unexpected return type: " +
					returnType.getParameterType().getName() + " in method: " + returnType.getMethod());
		}
	}
```

## 五、HttpEntityMethodProcessor

用于处理HttpEntity、ResponseEntity类型

```java
	@Override
	public boolean supportsReturnType(MethodParameter returnType) {
		//返回值是HttpEntity类型，并且不能是RequestEntity类型
		return (HttpEntity.class.isAssignableFrom(returnType.getParameterType()) &&
				!RequestEntity.class.isAssignableFrom(returnType.getParameterType()));
	}
	@Override
	public void handleReturnValue(@Nullable Object returnValue, MethodParameter returnType,
			ModelAndViewContainer mavContainer, NativeWebRequest webRequest) throws Exception {
		mavContainer.setRequestHandled(true);
		if (returnValue == null) {
			return;
		}
		//request
		ServletServerHttpRequest inputMessage = createInputMessage(webRequest);
		//response
		ServletServerHttpResponse outputMessage = createOutputMessage(webRequest);
		//returnValue是HttpEntity类型
		Assert.isInstanceOf(HttpEntity.class, returnValue);
		HttpEntity<?> responseEntity = (HttpEntity<?>) returnValue;
		HttpHeaders outputHeaders = outputMessage.getHeaders();
		HttpHeaders entityHeaders = responseEntity.getHeaders();
		//设置响应的headers
		if (!entityHeaders.isEmpty()) {
			entityHeaders.forEach((key, value) -> {
				if (HttpHeaders.VARY.equals(key) && outputHeaders.containsKey(HttpHeaders.VARY)) {
					List<String> values = getVaryRequestHeadersToAdd(outputHeaders, entityHeaders);
					if (!values.isEmpty()) {
						outputHeaders.setVary(values);
					}
				}
				else {
					outputHeaders.put(key, value);
				}
			});
		}
		//ResponseEntity类型
		if (responseEntity instanceof ResponseEntity) {
			int returnStatus = ((ResponseEntity<?>) responseEntity).getStatusCodeValue();
			outputMessage.getServletResponse().setStatus(returnStatus);
			if (returnStatus == 200) {
				HttpMethod method = inputMessage.getMethod();
				//get和head方法，校验资源是否没有修改过，没有修改直接返回
				if ((HttpMethod.GET.equals(method) || HttpMethod.HEAD.equals(method))
						&& isResourceNotModified(inputMessage, outputMessage)) {
					outputMessage.flush();
					return;
				}
			}
			else if (returnStatus / 100 == 3) {
				String location = outputHeaders.getFirst("location");
				if (location != null) {
					//处理重定向
					saveFlashAttributes(mavContainer, webRequest, location);
				}
			}
		}
		// Try even with null body. ResponseBodyAdvice could get involved.
		//通过MessageConverters填充body
		writeWithMessageConverters(responseEntity.getBody(), returnType, inputMessage, outputMessage);
		// Ensure headers are flushed even if no body was written.
		outputMessage.flush();
	}
```

## 六、 MapMethodProcessor

用于处理Map类型

```java
@Override
	public boolean supportsReturnType(MethodParameter returnType) {
		//Map类型
		return Map.class.isAssignableFrom(returnType.getParameterType());
	}
	@Override
	@SuppressWarnings({
     "rawtypes", "unchecked"})
	public void handleReturnValue(@Nullable Object returnValue, MethodParameter returnType,
			ModelAndViewContainer mavContainer, NativeWebRequest webRequest) throws Exception {
		if (returnValue instanceof Map){
			//将Map中参数设置到ModelMap中
			mavContainer.addAllAttributes((Map) returnValue);
		}
		else if (returnValue != null) {
			// should not happen
			throw new UnsupportedOperationException("Unexpected return type [" +
					returnType.getParameterType().getName() + "] in method: " + returnType.getMethod());
		}
	}
```

## 七、 ViewNameMethodReturnValueHandler

用于处理void和CharSequence类型

```java
@Override
	public boolean supportsReturnType(MethodParameter returnType) {
		Class<?> paramType = returnType.getParameterType();
		return (void.class == paramType || CharSequence.class.isAssignableFrom(paramType));
	}
	@Override
	public void handleReturnValue(@Nullable Object returnValue, MethodParameter returnType,
			ModelAndViewContainer mavContainer, NativeWebRequest webRequest) throws Exception {
		if (returnValue instanceof CharSequence) {
			String viewName = returnValue.toString();
			mavContainer.setViewName(viewName);
			if (isRedirectViewName(viewName)) {
				mavContainer.setRedirectModelScenario(true);
			}
		}
		else if (returnValue != null) {
			// should not happen
			throw new UnsupportedOperationException("Unexpected return type: " +
					returnType.getParameterType().getName() + " in method: " + returnType.getMethod());
		}
	}
```
