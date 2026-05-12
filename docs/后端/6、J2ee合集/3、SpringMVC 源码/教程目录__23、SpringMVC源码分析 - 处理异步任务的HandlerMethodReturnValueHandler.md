# 23、SpringMVC源码分析 - 处理异步任务的HandlerMethodReturnValueHandler
- 来源：https://ddkk.com/zhuanlan/j2ee/springmvc/7/23.html
- 分类：J2EE框架
- 分组：教程目录
## 前言

springmvc支持异步的方式返回数据，处理异步任务的HandlerMethodReturnValueHandler有AsyncTaskMethodReturnValueHandler、CallableMethodReturnValueHandler、StreamingResponseBodyReturnValueHandler、DeferredResultMethodReturnValueHandler。

## 一、AsyncTaskMethodReturnValueHandler

用于处理返回值是WebAsyncTask类型

```java
	@Override
	public boolean supportsReturnType(MethodParameter returnType) {
		//返回值是WebAsyncTask类型
		return WebAsyncTask.class.isAssignableFrom(returnType.getParameterType());
	}
	@Override
	public void handleReturnValue(@Nullable Object returnValue, MethodParameter returnType,
			ModelAndViewContainer mavContainer, NativeWebRequest webRequest) throws Exception {
		if (returnValue == null) {
			mavContainer.setRequestHandled(true);
			return;
		}
		WebAsyncTask<?> webAsyncTask = (WebAsyncTask<?>) returnValue;
		if (this.beanFactory != null) {
			webAsyncTask.setBeanFactory(this.beanFactory);
		}
		//调用异步管理器执行任务
		WebAsyncUtils.getAsyncManager(webRequest).startCallableProcessing(webAsyncTask, mavContainer);
	}
```

## 二、CallableMethodReturnValueHandler

用于处理Callable类型

```java
	@Override
	public boolean supportsReturnType(MethodParameter returnType) {
		//返回值是Callable类型
		return Callable.class.isAssignableFrom(returnType.getParameterType());
	}
	@Override
	public void handleReturnValue(@Nullable Object returnValue, MethodParameter returnType,
			ModelAndViewContainer mavContainer, NativeWebRequest webRequest) throws Exception {
		if (returnValue == null) {
			mavContainer.setRequestHandled(true);
			return;
		}
		Callable<?> callable = (Callable<?>) returnValue;
		//调用异步管理器执行任务
		WebAsyncUtils.getAsyncManager(webRequest).startCallableProcessing(callable, mavContainer);
	}
```

## 三、StreamingResponseBodyReturnValueHandler

用于处理返回值是StreamingResponseBody类型或者ResponseEntity类型并且body是StreamingResponseBody类型

```java
	@Override
	public boolean supportsReturnType(MethodParameter returnType) {
		//StreamingResponseBody类型
		if (StreamingResponseBody.class.isAssignableFrom(returnType.getParameterType())) {
			return true;
		}
		//ResponseEntity类型，body是StreamingResponseBody类型
		else if (ResponseEntity.class.isAssignableFrom(returnType.getParameterType())) {
			Class<?> bodyType = ResolvableType.forMethodParameter(returnType).getGeneric().resolve();
			return (bodyType != null && StreamingResponseBody.class.isAssignableFrom(bodyType));
		}
		return false;
	}
	@Override
	@SuppressWarnings("resource")
	public void handleReturnValue(@Nullable Object returnValue, MethodParameter returnType,
			ModelAndViewContainer mavContainer, NativeWebRequest webRequest) throws Exception {
		if (returnValue == null) {
			mavContainer.setRequestHandled(true);
			return;
		}
		HttpServletResponse response = webRequest.getNativeResponse(HttpServletResponse.class);
		Assert.state(response != null, "No HttpServletResponse");
		ServerHttpResponse outputMessage = new ServletServerHttpResponse(response);
		if (returnValue instanceof ResponseEntity) {
			ResponseEntity<?> responseEntity = (ResponseEntity<?>) returnValue;
			//状态码
			response.setStatus(responseEntity.getStatusCodeValue());
			//响应头
			outputMessage.getHeaders().putAll(responseEntity.getHeaders());
			//响应数据
			returnValue = responseEntity.getBody();
			if (returnValue == null) {
				mavContainer.setRequestHandled(true);
				outputMessage.flush();
				return;
			}
		}
		ServletRequest request = webRequest.getNativeRequest(ServletRequest.class);
		Assert.state(request != null, "No ServletRequest");
		ShallowEtagHeaderFilter.disableContentCaching(request);
		Assert.isInstanceOf(StreamingResponseBody.class, returnValue, "StreamingResponseBody expected");
		StreamingResponseBody streamingBody = (StreamingResponseBody) returnValue;
		//创建StreamingResponseBodyTask
		Callable<Void> callable = new StreamingResponseBodyTask(outputMessage.getBody(), streamingBody);
		//调用异步管理器执行任务
		WebAsyncUtils.getAsyncManager(webRequest).startCallableProcessing(callable, mavContainer);
	}
```

## 四、DeferredResultMethodReturnValueHandler

用于处理DeferredResult、ListenableFuture、CompletionStage类型

```java
	@Override
	public boolean supportsReturnType(MethodParameter returnType) {
		Class<?> type = returnType.getParameterType();
		//类型校验
		return (DeferredResult.class.isAssignableFrom(type) ||
				ListenableFuture.class.isAssignableFrom(type) ||
				CompletionStage.class.isAssignableFrom(type));
	}
	@Override
	public void handleReturnValue(@Nullable Object returnValue, MethodParameter returnType,
			ModelAndViewContainer mavContainer, NativeWebRequest webRequest) throws Exception {
		if (returnValue == null) {
			mavContainer.setRequestHandled(true);
			return;
		}
		DeferredResult<?> result;
		//DeferredResult类型
		if (returnValue instanceof DeferredResult) {
			result = (DeferredResult<?>) returnValue;
		}
		//ListenableFuture类型，适配成DeferredResult类型
		else if (returnValue instanceof ListenableFuture) {
			result = adaptListenableFuture((ListenableFuture<?>) returnValue);
		}
		CompletionStage类型，适配成DeferredResult类型
		else if (returnValue instanceof CompletionStage) {
			result = adaptCompletionStage((CompletionStage<?>) returnValue);
		}
		else {
			// Should not happen...
			throw new IllegalStateException("Unexpected return value type: " + returnValue);
		}
		//调用异步管理器执行任务
		WebAsyncUtils.getAsyncManager(webRequest).startDeferredResultProcessing(result, mavContainer);
	}
```
