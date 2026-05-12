# 14、SpringMVC源码分析 - RequestResponseBodyMethodProcessor处理请求参数
- 来源：https://ddkk.com/zhuanlan/j2ee/springmvc/7/14.html
- 分类：J2EE框架
- 分组：教程目录
## 前言

RequestResponseBodyMethodProcessor的功能之一是解析@RequestBody注解参数。

## 一、HandlerMethodArgumentResolver

RequestResponseBodyMethodProcessor实现了接口HandlerMethodArgumentResolver，接口中定义了HandlerMethod也就是常用的@Controller的方法参数的解析。

```java
public interface HandlerMethodArgumentResolver {
	/**
	 * 参数解析器支持该参数
	 */
	boolean supportsParameter(MethodParameter parameter);
	/**
	 * 参数解析器对参数进行解析
	 */
	@Nullable
	Object resolveArgument(MethodParameter parameter, @Nullable ModelAndViewContainer mavContainer,
			NativeWebRequest webRequest, @Nullable WebDataBinderFactory binderFactory) throws Exception;
}
```

## 二、参数解析流程

### 1.supportsParameter( )

通过判断参数上是否有@RequestBody注解

```java
public boolean supportsParameter(MethodParameter parameter) {
		return parameter.hasParameterAnnotation(RequestBody.class);
	}
```

### 2.resolveArgument( )

1、resolveArgument( )

```java
RequestResponseBodyMethodProcessor.java
public Object resolveArgument(MethodParameter parameter, @Nullable ModelAndViewContainer mavContainer,
			NativeWebRequest webRequest, @Nullable WebDataBinderFactory binderFactory) throws Exception {
		//参数用Optional包装，则获取嵌套参数
		parameter = parameter.nestedIfOptional();
		//通过消息转换器对参数进行处理
		Object arg = readWithMessageConverters(webRequest, parameter, parameter.getNestedGenericParameterType());
		//获取参数名
		String name = Conventions.getVariableNameForParameter(parameter);
		if (binderFactory != null) {
			//获取数据绑定
			WebDataBinder binder = binderFactory.createBinder(webRequest, arg, name);
			if (arg != null) {
				//通过Validator接口对参数进行校验
				validateIfApplicable(binder, parameter);
				if (binder.getBindingResult().hasErrors() && isBindExceptionRequired(binder, parameter)) {
					throw new MethodArgumentNotValidException(parameter, binder.getBindingResult());
				}
			}
			if (mavContainer != null) {
				mavContainer.addAttribute(BindingResult.MODEL_KEY_PREFIX + name, binder.getBindingResult());
			}
		}
		//对Optional包装的参数进行包装
		return adaptArgumentIfNecessary(arg, parameter);
	}
```

2、readWithMessageConverters( )

```java
protected <T> Object readWithMessageConverters(NativeWebRequest webRequest, MethodParameter parameter,
			Type paramType) throws IOException, HttpMediaTypeNotSupportedException, HttpMessageNotReadableException {
		//获取HttpServletRequest
		HttpServletRequest servletRequest = webRequest.getNativeRequest(HttpServletRequest.class);
		Assert.state(servletRequest != null, "No HttpServletRequest");
		ServletServerHttpRequest inputMessage = new ServletServerHttpRequest(servletRequest);
		//通过消息转换器转换成相应的类型
		Object arg = readWithMessageConverters(inputMessage, parameter, paramType);
		//参数为空时，检查@RequestBody的required属性
		if (arg == null && checkRequired(parameter)) {
			throw new HttpMessageNotReadableException("Required request body is missing: " +
					parameter.getExecutable().toGenericString(), inputMessage);
		}
		return arg;
	}
```

3、readWithMessageConverters( )

```java
protected <T> Object readWithMessageConverters(HttpInputMessage inputMessage, MethodParameter parameter,
			Type targetType) throws IOException, HttpMediaTypeNotSupportedException, HttpMessageNotReadableException {
		MediaType contentType;
		boolean noContentType = false;
		try {
			//获取contentType 
			contentType = inputMessage.getHeaders().getContentType();
		}
		catch (InvalidMediaTypeException ex) {
			throw new HttpMediaTypeNotSupportedException(ex.getMessage());
		}
		if (contentType == null) {
			noContentType = true;
			contentType = MediaType.APPLICATION_OCTET_STREAM;
		}
		//所在的@Controller类
		Class<?> contextClass = parameter.getContainingClass();
		//参数类型
		Class<T> targetClass = (targetType instanceof Class ? (Class<T>) targetType : null);
		if (targetClass == null) {
			ResolvableType resolvableType = ResolvableType.forMethodParameter(parameter);
			targetClass = (Class<T>) resolvableType.resolve();
		}
		//请求方法
		HttpMethod httpMethod = (inputMessage instanceof HttpRequest ? ((HttpRequest) inputMessage).getMethod() : null);
		Object body = NO_VALUE;
		EmptyBodyCheckingHttpInputMessage message;
		try {
			message = new EmptyBodyCheckingHttpInputMessage(inputMessage);
			//遍历消息转换器
			for (HttpMessageConverter<?> converter : this.messageConverters) {
				Class<HttpMessageConverter<?>> converterType = (Class<HttpMessageConverter<?>>) converter.getClass();
				GenericHttpMessageConverter<?> genericConverter =
						(converter instanceof GenericHttpMessageConverter ? (GenericHttpMessageConverter<?>) converter : null);
				//找到合适的消息转换器
				if (genericConverter != null ? genericConverter.canRead(targetType, contextClass, contentType) :
						(targetClass != null && converter.canRead(targetClass, contentType))) {
					if (message.hasBody()) {
						//消息转换前，先通过@ControllerAdvice切面RequestBodyAdvice的beforeBodyRead()处理消息
						HttpInputMessage msgToUse =
								getAdvice().beforeBodyRead(message, parameter, targetType, converterType);
						//进行消息转换
						body = (genericConverter != null ? genericConverter.read(targetType, contextClass, msgToUse) :
								((HttpMessageConverter<T>) converter).read(targetClass, msgToUse));
						//消息转换后，再通过@ControllerAdvice切面RequestBodyAdvice的afterBodyRead()处理消息
						body = getAdvice().afterBodyRead(body, msgToUse, parameter, targetType, converterType);
					}
					else {
						body = getAdvice().handleEmptyBody(null, message, parameter, targetType, converterType);
					}
					break;
				}
			}
		}
		catch (IOException ex) {
			throw new HttpMessageNotReadableException("I/O error while reading input message", ex, inputMessage);
		}
		if (body == NO_VALUE) {
			if (httpMethod == null || !SUPPORTED_METHODS.contains(httpMethod) ||
					(noContentType && !message.hasBody())) {
				return null;
			}
			throw new HttpMediaTypeNotSupportedException(contentType,
					getSupportedMediaTypes(targetClass != null ? targetClass : Object.class));
		}
		MediaType selectedContentType = contentType;
		Object theBody = body;
		LogFormatUtils.traceDebug(logger, traceOn -> {
			String formatted = LogFormatUtils.formatValue(theBody, !traceOn);
			return "Read \"" + selectedContentType + "\" to [" + formatted + "]";
		});
		return body;
	}
```

## 三、MappingJackson2HttpMessageConverter

Json消息转换器，将Json转换成对应的类型，接着上面的流程分析

1、read( )

```java
public Object read(Type type, @Nullable Class<?> contextClass, HttpInputMessage inputMessage)
			throws IOException, HttpMessageNotReadableException {
		JavaType javaType = getJavaType(type, contextClass);
		return readJavaType(javaType, inputMessage);
	}
```

2、readJavaType( )

通过调用objectMapper.readValue( )反序列化对象

```java
private Object readJavaType(JavaType javaType, HttpInputMessage inputMessage) throws IOException {
		//contentType 
		MediaType contentType = inputMessage.getHeaders().getContentType();
		//charset 
		Charset charset = getCharset(contentType);
		//objectMapper 
		ObjectMapper objectMapper = selectObjectMapper(javaType.getRawClass(), contentType);
		Assert.state(objectMapper != null, "No ObjectMapper for " + javaType);
		boolean isUnicode = ENCODINGS.containsKey(charset.name()) ||
				"UTF-16".equals(charset.name()) ||
				"UTF-32".equals(charset.name());
		try {
			if (inputMessage instanceof MappingJacksonInputMessage) {
				Class<?> deserializationView = ((MappingJacksonInputMessage) inputMessage).getDeserializationView();
				if (deserializationView != null) {
					ObjectReader objectReader = objectMapper.readerWithView(deserializationView).forType(javaType);
					if (isUnicode) {
						return objectReader.readValue(inputMessage.getBody());
					}
					else {
						Reader reader = new InputStreamReader(inputMessage.getBody(), charset);
						return objectReader.readValue(reader);
					}
				}
			}
			if (isUnicode) {
				//反序列化
				return objectMapper.readValue(inputMessage.getBody(), javaType);
			}
			else {
				Reader reader = new InputStreamReader(inputMessage.getBody(), charset);
				//反序列化
				return objectMapper.readValue(reader, javaType);
			}
		}
		catch (InvalidDefinitionException ex) {
			throw new HttpMessageConversionException("Type definition error: " + ex.getType(), ex);
		}
		catch (JsonProcessingException ex) {
			throw new HttpMessageNotReadableException("JSON parse error: " + ex.getOriginalMessage(), ex, inputMessage);
		}
	}
```
