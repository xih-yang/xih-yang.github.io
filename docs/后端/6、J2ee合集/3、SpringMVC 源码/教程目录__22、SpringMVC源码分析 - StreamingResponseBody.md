# 22、SpringMVC源码分析 - StreamingResponseBody
- 来源：https://ddkk.com/zhuanlan/j2ee/springmvc/7/22.html
- 分类：J2EE框架
- 分组：教程目录
## 前言

用于处理异步请求时，将返回值直接写入响应流中，而不用一直持有Servlet容器线程。

## 一、StreamingResponseBody

```java
@FunctionalInterface
public interface StreamingResponseBody {
	/**
	 * A callback for writing to the response body.
	 * @param outputStream the stream for the response body
	 * @throws IOException an exception while writing
	 */
	void writeTo(OutputStream outputStream) throws IOException;
}
```

只有一个方法writeTo( )，

## 二、示例

1、返回StreamingResponseBody

```java
  @GetMapping(value = "/test", produces = {
     MediaType.APPLICATION_JSON_VALUE})
    public StreamingResponseBody test() throws ValidDataException {
        Test test = new Test();
        test.setId(1);
        test.setName("test1");
        return out -> {
            try (ObjectOutputStream oos = new ObjectOutputStream(out)) {
                oos.writeBytes(new Gson().toJson(test));
            }
        };
    }
```

2、返回ResponseEntity

```java
	@GetMapping(value = "/test", produces = {
     MediaType.APPLICATION_JSON_VALUE})
    public ResponseEntity<StreamingResponseBody> test() throws ValidDataException {
        Test test = new Test();
        test.setId(1);
        test.setName("test1");
        StreamingResponseBody responseBody = out -> {
            try (ObjectOutputStream oos = new ObjectOutputStream(out)) {
                oos.writeBytes(new Gson().toJson(test));
            }
        };
        return ResponseEntity(responseBody, HttpStatus.OK);
```

## 三、原理

1、StreamingResponseBodyReturnValueHandler

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
		//调用异步线程池执行任务
		WebAsyncUtils.getAsyncManager(webRequest).startCallableProcessing(callable, mavContainer);
	}
```

2、StreamingResponseBodyTask

用于回调StreamingResponseBody 的writeTo( )方法

```java
	private static class StreamingResponseBodyTask implements Callable<Void> {
		private final OutputStream outputStream;
		private final StreamingResponseBody streamingBody;
		public StreamingResponseBodyTask(OutputStream outputStream, StreamingResponseBody streamingBody) {
			this.outputStream = outputStream;
			this.streamingBody = streamingBody;
		}
		@Override
		public Void call() throws Exception {
			this.streamingBody.writeTo(this.outputStream);
			this.outputStream.flush();
			return null;
		}
	}
}
```

3、WebAsyncUtils.getAsyncManager(webRequest)

从request中获取异步执行管理器

```java
public static WebAsyncManager getAsyncManager(WebRequest webRequest) {
		int scope = RequestAttributes.SCOPE_REQUEST;
		WebAsyncManager asyncManager = null;
		//public static final String WEB_ASYNC_MANAGER_ATTRIBUTE = WebAsyncManager.class.getName() + ".WEB_ASYNC_MANAGER";
		Object asyncManagerAttr = webRequest.getAttribute(WEB_ASYNC_MANAGER_ATTRIBUTE, scope);
		if (asyncManagerAttr instanceof WebAsyncManager) {
			asyncManager = (WebAsyncManager) asyncManagerAttr;
		}
		if (asyncManager == null) {
			//不存在时创建一个新的WebAsyncManager
			asyncManager = new WebAsyncManager();
			webRequest.setAttribute(WEB_ASYNC_MANAGER_ATTRIBUTE, asyncManager, scope);
		}
		return asyncManager;
	}
```

4、startCallableProcessing

将callable封装成WebAsyncTask

```java
public void startCallableProcessing(Callable<?> callable, Object... processingContext) throws Exception {
		Assert.notNull(callable, "Callable must not be null");
		startCallableProcessing(new WebAsyncTask(callable), processingContext);
	}
```
