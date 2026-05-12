# 38、Spring源码分析 - 38-RestTemplate详解
- 来源：https://ddkk.com/zhuanlan/j2ee/spring/7/38.html
- 分类：J2EE框架
- 分组：教程目录
同步客户端执行HTTP请求，在底层HTTP客户端库（如JDK HttpURLConnection，Apache HttpComponents等）上公开简单的模板方法API。RestTemplate除了支持频率较低的情况的通用交换和执行方法之外，还通过HTTP方法提供常见方案的模板。

**注意**：从5.0开始，非阻塞，反应式org.springframework.web.reactive.client.WebClient提供了RestTemplate的现代替代方案，同时有效支持同步和异步以及流方案。 RestTemplate将在未来版本中弃用，并且不会在未来添加主要的新功能。

## 1、构造函数

```java
public RestTemplate() {
   this.messageConverters.add(new ByteArrayHttpMessageConverter());
   this.messageConverters.add(new StringHttpMessageConverter());
   this.messageConverters.add(new ResourceHttpMessageConverter(false));
   try {
      this.messageConverters.add(new SourceHttpMessageConverter<>());
   }
   catch (Error err) {
      // Ignore when no TransformerFactory implementation is available
   }
   this.messageConverters.add(new AllEncompassingFormHttpMessageConverter());
   if (romePresent) {
      this.messageConverters.add(new AtomFeedHttpMessageConverter());
      this.messageConverters.add(new RssChannelHttpMessageConverter());
   }
   if (jackson2XmlPresent) {
      this.messageConverters.add(new MappingJackson2XmlHttpMessageConverter());
   }
   else if (jaxb2Present) {
      this.messageConverters.add(new Jaxb2RootElementHttpMessageConverter());
   }
   if (jackson2Present) {
      this.messageConverters.add(new MappingJackson2HttpMessageConverter());
   }
   else if (gsonPresent) {
      this.messageConverters.add(new GsonHttpMessageConverter());
   }
   else if (jsonbPresent) {
      this.messageConverters.add(new JsonbHttpMessageConverter());
   }
   if (jackson2SmilePresent) {
      this.messageConverters.add(new MappingJackson2SmileHttpMessageConverter());
   }
   if (jackson2CborPresent) {
      this.messageConverters.add(new MappingJackson2CborHttpMessageConverter());
   }
   this.uriTemplateHandler = initUriTemplateHandler();
}
```

#### 1.1、初始化HttpMessageConverter

策略接口，代表一个可以转换HTTP请求和响应的转换器。

```java
public interface HttpMessageConverter<T> {
   //指示此转换器是否可以读取给定的类。
   //clazz  - 测试可读性的类
   //mediaType  - 要读取的媒体类型（如果未指定，则可以为null）; 通常是Content-Type标头的值。
   boolean canRead(Class<?> clazz, @Nullable MediaType mediaType);
   //指示此转换器是否可以写入给定的类。
   boolean canWrite(Class<?> clazz, @Nullable MediaType mediaType);
   //返回此转换器支持的MediaType对象列表。
   List<MediaType> getSupportedMediaTypes();
   //从给定的输入消息中读取给定类型的对象，并返回它。
   T read(Class<? extends T> clazz, HttpInputMessage inputMessage)
         throws IOException, HttpMessageNotReadableException;
   //将给定对象写入给定的输出消息。
   void write(T t, @Nullable MediaType contentType, HttpOutputMessage outputMessage)
         throws IOException, HttpMessageNotWritableException;
}
```

在默认构造函数会初始化很多HttpMessageConverter实例，这些实例会在三处地方起到作用：

一是这些实例被封装在AcceptHeaderRequestCallback中，当执行http请求时会根据responseType来选取canRead()方法支持的HttpMessageConverter，通过getSupportedMediaTypes()方法返回的MediaType设置http头Accept。

```java
private class AcceptHeaderRequestCallback implements RequestCallback {
   @Nullable
   private final Type responseType;
   public AcceptHeaderRequestCallback(@Nullable Type responseType) {
      this.responseType = responseType;
   }
   @Override
   public void doWithRequest(ClientHttpRequest request) throws IOException {
      if (this.responseType != null) {
         List<MediaType> allSupportedMediaTypes = getMessageConverters().stream()
               .filter(converter -> canReadResponse(this.responseType, converter))
               .flatMap(this::getSupportedMediaTypes)
               .distinct()
               .sorted(MediaType.SPECIFICITY_COMPARATOR)
               .collect(Collectors.toList());
         if (logger.isDebugEnabled()) {
            logger.debug("Accept=" + allSupportedMediaTypes);
         }
         request.getHeaders().setAccept(allSupportedMediaTypes);
      }
   }
   private boolean canReadResponse(Type responseType, HttpMessageConverter<?> converter) {
      Class<?> responseClass = (responseType instanceof Class ? (Class<?>) responseType : null);
      if (responseClass != null) {
         return converter.canRead(responseClass, null);
      }
      else if (converter instanceof GenericHttpMessageConverter) {
         GenericHttpMessageConverter<?> genericConverter = (GenericHttpMessageConverter<?>) converter;
         return genericConverter.canRead(responseType, null, null);
      }
      return false;
   }
   private Stream<MediaType> getSupportedMediaTypes(HttpMessageConverter<?> messageConverter) {
      return messageConverter.getSupportedMediaTypes()
            .stream()
            .map(mediaType -> {
               if (mediaType.getCharset() != null) {
                  return new MediaType(mediaType.getType(), mediaType.getSubtype());
               }
               return mediaType;
            });
   }
}
```

二是当请求时POST/PUT操作时，会使用HttpEntityRequestCallback这种AcceptHeaderRequestCallback，他除了可以设置http头Accept(通过继承的方式)外，还会将请求体写入ClientHttpRequest中，写入流程是从构造方法实例化的HttpMessageConverter中选出canWrite()方法支持的实例，然后调用write()方法写入。

```java
private class HttpEntityRequestCallback extends AcceptHeaderRequestCallback {
   private final HttpEntity<?> requestEntity;
   public HttpEntityRequestCallback(@Nullable Object requestBody) {
      this(requestBody, null);
   }
   public HttpEntityRequestCallback(@Nullable Object requestBody, @Nullable Type responseType) {
      super(responseType);
      if (requestBody instanceof HttpEntity) {
         this.requestEntity = (HttpEntity<?>) requestBody;
      }
      else if (requestBody != null) {
         this.requestEntity = new HttpEntity<>(requestBody);
      }
      else {
         this.requestEntity = HttpEntity.EMPTY;
      }
   }
   @Override
   @SuppressWarnings("unchecked")
   public void doWithRequest(ClientHttpRequest httpRequest) throws IOException {
      super.doWithRequest(httpRequest);
      Object requestBody = this.requestEntity.getBody();
      if (requestBody == null) {
         HttpHeaders httpHeaders = httpRequest.getHeaders();
         HttpHeaders requestHeaders = this.requestEntity.getHeaders();
         if (!requestHeaders.isEmpty()) {
            requestHeaders.forEach((key, values) -> httpHeaders.put(key, new LinkedList<>(values)));
         }
         if (httpHeaders.getContentLength() < 0) {
            httpHeaders.setContentLength(0L);
         }
      }
      else {
         Class<?> requestBodyClass = requestBody.getClass();
         Type requestBodyType = (this.requestEntity instanceof RequestEntity ?
               ((RequestEntity<?>)this.requestEntity).getType() : requestBodyClass);
         HttpHeaders httpHeaders = httpRequest.getHeaders();
         HttpHeaders requestHeaders = this.requestEntity.getHeaders();
         MediaType requestContentType = requestHeaders.getContentType();
         for (HttpMessageConverter<?> messageConverter : getMessageConverters()) {
            if (messageConverter instanceof GenericHttpMessageConverter) {
               GenericHttpMessageConverter<Object> genericConverter =
                     (GenericHttpMessageConverter<Object>) messageConverter;
               if (genericConverter.canWrite(requestBodyType, requestBodyClass, requestContentType)) {
                  if (!requestHeaders.isEmpty()) {
                     requestHeaders.forEach((key, values) -> httpHeaders.put(key, new LinkedList<>(values)));
                  }
                  logBody(requestBody, requestContentType, genericConverter);
                  genericConverter.write(requestBody, requestBodyType, requestContentType, httpRequest);
                  return;
               }
            }
            else if (messageConverter.canWrite(requestBodyClass, requestContentType)) {
               if (!requestHeaders.isEmpty()) {
                  requestHeaders.forEach((key, values) -> httpHeaders.put(key, new LinkedList<>(values)));
               }
               logBody(requestBody, requestContentType, messageConverter);
               ((HttpMessageConverter<Object>) messageConverter).write(
                     requestBody, requestContentType, httpRequest);
               return;
            }
         }
         String message = "No HttpMessageConverter for [" + requestBodyClass.getName() + "]";
         if (requestContentType != null) {
            message += " and content type [" + requestContentType + "]";
         }
         throw new RestClientException(message);
      }
   }
   private void logBody(Object body, @Nullable MediaType mediaType, HttpMessageConverter<?> converter) {
      if (logger.isDebugEnabled()) {
         if (mediaType != null) {
            logger.debug("Writing [" + body + "] as \"" + mediaType + "\"");
         }
         else {
            String classname = converter.getClass().getName();
            logger.debug("Writing [" + body + "] with " + classname);
         }
      }
   }
}
```

三是这些实例被封装在HttpMessageConverterExtractor中在发送http请求后用来解析http响应消息为相应的实体类。

```java
//响应提取器使用给定的实体转换器将响应转换为类型T.
public class HttpMessageConverterExtractor<T> implements ResponseExtractor<T> {
   private final Type responseType;
   @Nullable
   private final Class<T> responseClass;
   private final List<HttpMessageConverter<?>> messageConverters;
   private final Log logger;
   //使用给定的响应类型和消息转换器创建HttpMessageConverterExtractor的新实例。 给定的转换器必须支持响应类型。
   public HttpMessageConverterExtractor(Class<T> responseType, List<HttpMessageConverter<?>> messageConverters) {
      this((Type) responseType, messageConverters);
   }
   public HttpMessageConverterExtractor(Type responseType, List<HttpMessageConverter<?>> messageConverters) {
      this(responseType, messageConverters, LogFactory.getLog(HttpMessageConverterExtractor.class));
   }
   @SuppressWarnings("unchecked")
   HttpMessageConverterExtractor(Type responseType, List<HttpMessageConverter<?>> messageConverters, Log logger) {
      Assert.notNull(responseType, "'responseType' must not be null");
      Assert.notEmpty(messageConverters, "'messageConverters' must not be empty");
      this.responseType = responseType;
      this.responseClass = (responseType instanceof Class ? (Class<T>) responseType : null);
      this.messageConverters = messageConverters;
      this.logger = logger;
   }
   @Override
   @SuppressWarnings({"unchecked", "rawtypes", "resource"})
   public T extractData(ClientHttpResponse response) throws IOException {
      MessageBodyClientHttpResponseWrapper responseWrapper = new MessageBodyClientHttpResponseWrapper(response);
      if (!responseWrapper.hasMessageBody() || responseWrapper.hasEmptyMessageBody()) {
         return null;
      }
      MediaType contentType = getContentType(responseWrapper);
      try {
         for (HttpMessageConverter<?> messageConverter : this.messageConverters) {
            if (messageConverter instanceof GenericHttpMessageConverter) {
               GenericHttpMessageConverter<?> genericMessageConverter =
                     (GenericHttpMessageConverter<?>) messageConverter;
               if (genericMessageConverter.canRead(this.responseType, null, contentType)) {
                  if (logger.isDebugEnabled()) {
                     ResolvableType resolvableType = ResolvableType.forType(this.responseType);
                     logger.debug("Reading to [" + resolvableType + "]");
                  }
                  return (T) genericMessageConverter.read(this.responseType, null, responseWrapper);
               }
            }
            if (this.responseClass != null) {
               if (messageConverter.canRead(this.responseClass, contentType)) {
                  if (logger.isDebugEnabled()) {
                     String className = this.responseClass.getName();
                     logger.debug("Reading to [" + className + "] as \"" + contentType + "\"");
                  }
                  return (T) messageConverter.read((Class) this.responseClass, responseWrapper);
               }
            }
         }
      }
      catch (IOException | HttpMessageNotReadableException ex) {
         throw new RestClientException("Error while extracting response for type [" +
               this.responseType + "] and content type [" + contentType + "]", ex);
      }
      throw new RestClientException("Could not extract response: no suitable HttpMessageConverter found " +
            "for response type [" + this.responseType + "] and content type [" + contentType + "]");
   }
   //根据“Content-Type”标头确定响应的Content-Type，否则默认为MediaType.APPLICATION_OCTET_STREAM。
   @Nullable
   protected MediaType getContentType(ClientHttpResponse response) {
      MediaType contentType = response.getHeaders().getContentType();
      if (contentType == null) {
         if (logger.isTraceEnabled()) {
            logger.trace("No content-type, using 'application/octet-stream'");
         }
         contentType = MediaType.APPLICATION_OCTET_STREAM;
      }
      return contentType;
   }
}
```

## 1.2、初始化UriTemplateHandler

初始化一个URI_COMPONENT编码格式的DefaultUriBuilderFactory。

```java
private static DefaultUriBuilderFactory initUriTemplateHandler() {
   DefaultUriBuilderFactory uriFactory = new DefaultUriBuilderFactory();
   uriFactory.setEncodingMode(EncodingMode.URI_COMPONENT);  // for backwards compatibility..
   return uriFactory;
}
```

```java
//定义使用变量扩展URI模板的方法。
public interface UriTemplateHandler {
   //使用URI变量数组展开给定的URI模板。
   URI expand(String uriTemplate, Map<String, ?> uriVariables);
   URI expand(String uriTemplate, Object... uriVariables);
}
```

```java
public interface UriBuilderFactory extends UriTemplateHandler {
   //使用给定的URI模板初始化构建器。
   UriBuilder uriString(String uriTemplate);
   //使用默认设置创建URI构建器。
   UriBuilder builder();
}
```

在发起一个http请求求会先使用这个UriTemplateHandler将模板url和uri变量解析成一个URI然后交给doExecute()方法发起请求。

```java
@Override
@Nullable
public <T> T execute(String url, HttpMethod method, @Nullable RequestCallback requestCallback,
      @Nullable ResponseExtractor<T> responseExtractor, Object... uriVariables) throws RestClientException {
   URI expanded = getUriTemplateHandler().expand(url, uriVariables);
   return doExecute(expanded, method, requestCallback, responseExtractor);
}
```

下面是DefaultUriBuilderFactory#expand(java.lang.String, java.util.Map``)方法实现：

```java
public URI expand(String uriTemplate, Map<String, ?> uriVars) {
   return uriString(uriTemplate).build(uriVars);
}
public UriBuilder uriString(String uriTemplate) {
   return new DefaultUriBuilder(uriTemplate);
}
```

URI的创建使用DefaultUriBuilder的build()方法。

```java
@Override
public URI build(Map<String, ?> uriVars) {
   if (!defaultUriVariables.isEmpty()) {
      Map<String, Object> map = new HashMap<>();
      map.putAll(defaultUriVariables);
      map.putAll(uriVars);
      uriVars = map;
   }
   if (encodingMode.equals(EncodingMode.VALUES_ONLY)) {
      uriVars = UriUtils.encodeUriVariables(uriVars);
   }
   UriComponents uric = this.uriComponentsBuilder.build().expand(uriVars);
   return createUri(uric);
}
private URI createUri(UriComponents uric) {
   if (encodingMode.equals(EncodingMode.URI_COMPONENT)) {
      uric = uric.encode();
   }
   return URI.create(uric.toString());
}
```

从代码上面代码可以看出，URI的创建又是使用了uriComponentsBuilder.build().expand(uriVars);这个uriComponentsBuilder是在DefaultUriBuilder构造方法完成初始化的，如下：

```java
private class DefaultUriBuilder implements UriBuilder {
   private final UriComponentsBuilder uriComponentsBuilder;
   public DefaultUriBuilder(String uriTemplate) {
      this.uriComponentsBuilder = initUriComponentsBuilder(uriTemplate);
   }
   private UriComponentsBuilder initUriComponentsBuilder(String uriTemplate) {
      UriComponentsBuilder result;
      if (StringUtils.isEmpty(uriTemplate)) {
         result = baseUri != null ? baseUri.cloneBuilder() : UriComponentsBuilder.newInstance();
      }
      else if (baseUri != null) {
         UriComponentsBuilder builder = UriComponentsBuilder.fromUriString(uriTemplate);
         UriComponents uri = builder.build();
         result = uri.getHost() == null ? baseUri.cloneBuilder().uriComponents(uri) : builder;
      }
      else {
         //使用正则分解出uriTemplate各个部分赋给UriComponentsBuilder对应的字段
         result = UriComponentsBuilder.fromUriString(uriTemplate);
      }
      if (encodingMode.equals(EncodingMode.TEMPLATE_AND_VALUES)) {
         result.encode();
      }
      parsePathIfNecessary(result);
      return result;
   }
   private void parsePathIfNecessary(UriComponentsBuilder result) {
      //EncodingMode.URI_COMPONENT在RestTemplate中是默认编码模式
      //如果存在scheme-specific-part 从中分离path
      if (parsePath && encodingMode.equals(EncodingMode.URI_COMPONENT)) {
         UriComponents uric = result.build();
         String path = uric.getPath();
         result.replacePath(null);
         for (String segment : uric.getPathSegments()) {
            result.pathSegment(segment);
         }
         if (path != null && path.endsWith("/")) {
            result.path("/");
         }
      }
   }
   ...
}
```

关于URI各部分含义请参考[Uri详解之——Uri结构与代码提取](https://blog.csdn.net/harvic880925/article/details/44679239)，[URI介绍](https://nanapoleon.iteye.com/blog/1474145)。

build()方法返回一个UriComponents实例，表示URI组件的不可变集合，将组件类型映射到String值。

```java
public UriComponents build() {
   return build(false);
}
public UriComponents build(boolean encoded) {
   return buildInternal(encoded ?
         EncodingHint.FULLY_ENCODED :
         this.encodeTemplate ? EncodingHint.ENCODE_TEMPLATE : EncodingHint.NONE);
}
private UriComponents buildInternal(EncodingHint hint) {
   UriComponents result;
   if (this.ssp != null) {
      //带有scheme-specific-part部分的使用OpaqueUriComponents
      result = new OpaqueUriComponents(this.scheme, this.ssp, this.fragment);
   }
   else {
      HierarchicalUriComponents uric = new HierarchicalUriComponents(this.scheme, this.fragment,
            this.userInfo, this.host, this.port, this.pathBuilder.build(), this.queryParams,
            hint == EncodingHint.FULLY_ENCODED);
      result = hint == EncodingHint.ENCODE_TEMPLATE ? uric.encodeTemplate(this.charset) : uric;
   }
   //默认为空
   if (!this.uriVariables.isEmpty()) {
      result = result.expand(name -> this.uriVariables.getOrDefault(name, UriTemplateVariables.SKIP_VALUE));
   }
   return result;
}
```

UriComponents#expand(java.util.Map``)方法使用给定映射中的值替换所有URI模板变量。

```java
public final UriComponents expand(Map<String, ?> uriVariables) {
   Assert.notNull(uriVariables, "'uriVariables' must not be null");
   return expandInternal(new MapTemplateVariables(uriVariables));
}
```

expandInternal()方法是抽象方法由子类实现，它的参数是一个UriTemplateVariables，内部会调用它getValue()方法获取模板参数值。对于Map类型模板参数值会将其封装成MapTemplateVariables，getValue()方法会根据map的key获取参数值，所以map类型模板参数变量的顺序不重要。对于可变参数类型的模板参数值会将其封装成VarArgsTemplateVariables，getValue()方法是根据可变参数值的顺序返回参数值，所以模板参数变量的顺序应该与可变参数一致，并且变量名称不重要。

```java
private static class MapTemplateVariables implements UriTemplateVariables {
   private final Map<String, ?> uriVariables;
   public MapTemplateVariables(Map<String, ?> uriVariables) {
      this.uriVariables = uriVariables;
   }
   @Override
   @Nullable
   public Object getValue(@Nullable String name) {
      if (!this.uriVariables.containsKey(name)) {
         throw new IllegalArgumentException("Map has no value for '" + name + "'");
      }
      return this.uriVariables.get(name);
   }
}
private static class VarArgsTemplateVariables implements UriTemplateVariables {
   private final Iterator<Object> valueIterator;
   public VarArgsTemplateVariables(Object... uriVariableValues) {
      this.valueIterator = Arrays.asList(uriVariableValues).iterator();
   }
   @Override
   @Nullable
   public Object getValue(@Nullable String name) {
      if (!this.valueIterator.hasNext()) {
         throw new IllegalArgumentException("Not enough variable values available to expand '" + name + "'");
      }
      return this.valueIterator.next();
   }
}
```

HierarchicalUriComponents#expandInternal()方法。

```java
@Override
protected HierarchicalUriComponents expandInternal(UriTemplateVariables uriVariables) {
   Assert.state(!this.encodeState.equals(EncodeState.FULLY_ENCODED),
         "URI components already encoded, and could not possibly contain '{' or '}'.");
   String schemeTo = expandUriComponent(getScheme(), uriVariables, this.variableEncoder);
   String fragmentTo = expandUriComponent(getFragment(), uriVariables, this.variableEncoder);
   String userInfoTo = expandUriComponent(this.userInfo, uriVariables, this.variableEncoder);
   String hostTo = expandUriComponent(this.host, uriVariables, this.variableEncoder);
   String portTo = expandUriComponent(this.port, uriVariables, this.variableEncoder);
   PathComponent pathTo = this.path.expand(uriVariables, this.variableEncoder);
   MultiValueMap<String, String> queryParamsTo = expandQueryParams(uriVariables);
   return new HierarchicalUriComponents(schemeTo, fragmentTo, userInfoTo,
         hostTo, portTo, pathTo, queryParamsTo, this.encodeState, this.variableEncoder);
}
private MultiValueMap<String, String> expandQueryParams(UriTemplateVariables variables) {
   int size = this.queryParams.size();
   MultiValueMap<String, String> result = new LinkedMultiValueMap<>(size);
   UriTemplateVariables queryVariables = new QueryUriTemplateVariables(variables);
   this.queryParams.forEach((key, values) -> {
      String name = expandUriComponent(key, queryVariables, this.variableEncoder);
      List<String> expandedValues = new ArrayList<>(values.size());
      for (String value : values) {
         expandedValues.add(expandUriComponent(value, queryVariables, this.variableEncoder));
      }
      result.put(name, expandedValues);
   });
   return CollectionUtils.unmodifiableMultiValueMap(result);
}
```

expandUriComponent()方法用于使用参数值替换模板变量。

```java
@Nullable
static String expandUriComponent(@Nullable String source, UriTemplateVariables uriVariables,
      @Nullable UnaryOperator<String> encoder) {
   if (source == null) {
      return null;
   }
   if (source.indexOf('{') == -1) {
      return source;
   }
   if (source.indexOf(':') != -1) {
      source = sanitizeSource(source);
   }
   Matcher matcher = NAMES_PATTERN.matcher(source);
   StringBuffer sb = new StringBuffer();
   while (matcher.find()) {
      String match = matcher.group(1);
      String varName = getVariableName(match);
      Object varValue = uriVariables.getValue(varName);
      if (UriTemplateVariables.SKIP_VALUE.equals(varValue)) {
         continue;
      }
      String formatted = getVariableValueAsString(varValue);
      formatted = encoder != null ? encoder.apply(formatted) : Matcher.quoteReplacement(formatted);
      matcher.appendReplacement(sb, formatted);
   }
   matcher.appendTail(sb);
   return sb.toString();
}
```

## 2、执行http请求

RestTemplate的execute()方法负责发送http请求并解析响应的结果，这个方法首先使用上面提到的UriTemplateHandler将url模板和模板参数转换成URI，然后传递给doExecute()方法完成整个流程的调用。

```java
@Nullable
protected <T> T doExecute(URI url, @Nullable HttpMethod method, @Nullable RequestCallback requestCallback,
      @Nullable ResponseExtractor<T> responseExtractor) throws RestClientException {
   Assert.notNull(url, "URI is required");
   Assert.notNull(method, "HttpMethod is required");
   ClientHttpResponse response = null;
   try {
      ClientHttpRequest request = createRequest(url, method);
      if (requestCallback != null) {
         requestCallback.doWithRequest(request);
      }
      response = request.execute();
      handleResponse(url, method, response);
      return (responseExtractor != null ? responseExtractor.extractData(response) : null);
   }
   catch (IOException ex) {
      String resource = url.toString();
      String query = url.getRawQuery();
      resource = (query != null ? resource.substring(0, resource.indexOf('?')) : resource);
      throw new ResourceAccessException("I/O error on " + method.name() +
            " request for \"" + resource + "\": " + ex.getMessage(), ex);
   }
   finally {
      if (response != null) {
         response.close();
      }
   }
}
```

#### 2.1、构建ClientHttpRequest

在抽象类HttpAccessor中定义了创建ClientHttpRequest的方法和配置ClientHttpRequestFactory的方法，RestTemplate中有个构造方法可以方便的配置ClientHttpRequestFactory，如果没有配置默认使用SimpleClientHttpRequestFactory。

```java
public RestTemplate(ClientHttpRequestFactory requestFactory) {
   this();
   setRequestFactory(requestFactory);
}
```

下面是创建ClientHttpRequest的方法。

```java
protected ClientHttpRequest createRequest(URI url, HttpMethod method) throws IOException {
   ClientHttpRequest request = getRequestFactory().createRequest(url, method);
   if (logger.isDebugEnabled()) {
      logger.debug("HTTP " + method.name() + " " + url);
   }
   return request;
}
```

创建ClientHttpRequest的任务直接交给了ClientHttpRequestFactory，这个接口只有唯一的方法：

```java
@FunctionalInterface
public interface ClientHttpRequestFactory {
   //为指定的URI和HTTP方法创建新的ClientHttpRequest。
   //可以写入请求信息，然后通过调用ClientHttpRequest.execute()来执行。
   ClientHttpRequest createRequest(URI uri, HttpMethod httpMethod) throws IOException;
}
```

SimpleClientHttpRequestFactory#createRequest()方法的实现：

```java
@Override
public ClientHttpRequest createRequest(URI uri, HttpMethod httpMethod) throws IOException {
   HttpURLConnection connection = openConnection(uri.toURL(), this.proxy);
   prepareConnection(connection, httpMethod.name());
   //默认true
   if (this.bufferRequestBody) {
      return new SimpleBufferingClientHttpRequest(connection, this.outputStreaming);
   }
   else {
      return new SimpleStreamingClientHttpRequest(connection, this.chunkSize, this.outputStreaming);
   }
}
```

SimpleClientHttpRequestFactory底层是使用JDK标准库HttpURLConnection来构建SimpleBufferingClientHttpRequest。

Spring除了提供默认的SimpleClientHttpRequestFactory，还提供OkHttp3ClientHttpRequestFactory底层使用OkHttp3.x框架发送http请求，Netty4ClientHttpRequestFactory底层使用Netty4，HttpComponentsClientHttpRequestFactory底层使用Apache HttpComponents 4.3或更高版本。

#### 2.2、应用RequestCallback

在上一步创建一个ClientHttpRequest后，会调用它的doWithRequest()，AcceptHeaderRequestCallback会设置请求的accept头，HttpEntityRequestCallback写请求体对象到请求流中，前面已给出具体实现不再说了。

#### 2.3、发送http请求

发送http请求是通过调用ClientHttpRequest的execute()方法完成的，下面看一下ClientHttpRequest的体系结构，然后分析一下SimpleBufferingClientHttpRequest的实现原理。

AbstractClientHttpRequest是ClientHttpRequest的抽象基础，确保不会多次写入header和body并且只支持一次http当请求通过assertNotExecuted()方法的限制。此外还实现了HttpOutputMessage接口法，这个接口会在上面提到的HttpEntityRequestCallback中用于完成POST和PUT请求的消息体写入。

```java
public abstract class AbstractClientHttpRequest implements ClientHttpRequest {
   private final HttpHeaders headers = new HttpHeaders();
   private boolean executed = false;
   @Override
   public final HttpHeaders getHeaders() {
      return (this.executed ? HttpHeaders.readOnlyHttpHeaders(this.headers) : this.headers);
   }
   @Override
   public final OutputStream getBody() throws IOException {
      //不可以多次调用写body
      assertNotExecuted();
      return getBodyInternal(this.headers);
   }
   @Override
   public final ClientHttpResponse execute() throws IOException {
      //http请求不能执行多次
      assertNotExecuted();
      ClientHttpResponse result = executeInternal(this.headers);
      this.executed = true;
      return result;
   }
   //断言此请求尚未执行execute()方法
   protected void assertNotExecuted() {
      Assert.state(!this.executed, "ClientHttpRequest already executed");
   }
   //返回主体的抽象模板方法。
   protected abstract OutputStream getBodyInternal(HttpHeaders headers) throws IOException;
   //将给定headers和内容写入HTTP请求的抽象模板方法。
   protected abstract ClientHttpResponse executeInternal(HttpHeaders headers) throws IOException;
}
```

AbstractBufferingClientHttpRequest实现了getBodyInternal()方法返回一个ByteArrayOutputStream用于缓存写入http请求体，这意味着executeInternal()方法在执行请求时就可以设置contentLength通过ByteArrayOutputStream的字节大小，因此使用它小心内存溢出。

```java
abstract class AbstractBufferingClientHttpRequest extends AbstractClientHttpRequest {
   private ByteArrayOutputStream bufferedOutput = new ByteArrayOutputStream(1024);
   @Override
   protected OutputStream getBodyInternal(HttpHeaders headers) throws IOException {
      return this.bufferedOutput;
   }
   @Override
   protected ClientHttpResponse executeInternal(HttpHeaders headers) throws IOException {
      byte[] bytes = this.bufferedOutput.toByteArray();
      if (headers.getContentLength() < 0) {
         headers.setContentLength(bytes.length);
      }
      ClientHttpResponse result = executeInternal(headers, bytes);
      this.bufferedOutput = new ByteArrayOutputStream(0);
      return result;
   }
   //将给定heanders和body写入HTTP请求的抽象模板方法。
   protected abstract ClientHttpResponse executeInternal(HttpHeaders headers, byte[] bufferedOutput)
         throws IOException;
}
```

SimpleBufferingClientHttpRequest会缓存请求体的内容，然后一次性发送。

```java
final class SimpleBufferingClientHttpRequest extends AbstractBufferingClientHttpRequest {
   private final HttpURLConnection connection;
   private final boolean outputStreaming;
   SimpleBufferingClientHttpRequest(HttpURLConnection connection, boolean outputStreaming) {
      this.connection = connection;
      this.outputStreaming = outputStreaming;
   }
   @Override
   public String getMethodValue() {
      return this.connection.getRequestMethod();
   }
   @Override
   public URI getURI() {
      try {
         return this.connection.getURL().toURI();
      }
      catch (URISyntaxException ex) {
         throw new IllegalStateException("Could not get HttpURLConnection URI: " + ex.getMessage(), ex);
      }
   }
   @Override
   protected ClientHttpResponse executeInternal(HttpHeaders headers, byte[] bufferedOutput) throws IOException {
      addHeaders(this.connection, headers);
      // JDK <1.8 doesn't support getOutputStream with HTTP DELETE
      if (getMethod() == HttpMethod.DELETE && bufferedOutput.length == 0) {
         this.connection.setDoOutput(false);
      }
      //bufferedOutput总是代表消息体的大小，显示设置提高flush效率
      if (this.connection.getDoOutput() && this.outputStreaming) {
         this.connection.setFixedLengthStreamingMode(bufferedOutput.length);
      }
      this.connection.connect();
      if (this.connection.getDoOutput()) {
         //一次将请求发送完毕
         FileCopyUtils.copy(bufferedOutput, this.connection.getOutputStream());
      }
      else {
         // 在无output场景中立即触发请求
         this.connection.getResponseCode();
      }
      return new SimpleClientHttpResponse(this.connection);
   }
   //将给定的heanders添加到给定的HTTP连接。
   static void addHeaders(HttpURLConnection connection, HttpHeaders headers) {
      headers.forEach((headerName, headerValues) -> {
         if (HttpHeaders.COOKIE.equalsIgnoreCase(headerName)) {  // RFC 6265
            String headerValue = StringUtils.collectionToDelimitedString(headerValues, "; ");
            connection.setRequestProperty(headerName, headerValue);
         }
         else {
            for (String headerValue : headerValues) {
               String actualHeaderValue = headerValue != null ? headerValue : "";
               connection.addRequestProperty(headerName, actualHeaderValue);
            }
         }
      });
   }
}
```

#### 2.4、异常状态的处理

handleResponse()方法当http相应的状态码是4xx或5xx则会调用ResponseErrorHandler处理这个响应。

```java
protected void handleResponse(URI url, HttpMethod method, ClientHttpResponse response) throws IOException {
   ResponseErrorHandler errorHandler = getErrorHandler();
   boolean hasError = errorHandler.hasError(response);
   if (logger.isDebugEnabled()) {
      try {
         int code = response.getRawStatusCode();
         HttpStatus status = HttpStatus.resolve(code);
         logger.debug("Response " + (status != null ? status : code));
      }
      catch (IOException ex) {
         // ignore
      }
   }
   if (hasError) {
      errorHandler.handleError(url, method, response);
   }
}
```

啊RestTemplate内部默认使用DefaultResponseErrorHandler来处理异常响应。

```java
public class DefaultResponseErrorHandler implements ResponseErrorHandler {
   @Override
   public boolean hasError(ClientHttpResponse response) throws IOException {
      int rawStatusCode = response.getRawStatusCode();
      HttpStatus statusCode = HttpStatus.resolve(rawStatusCode);
      return (statusCode != null ? hasError(statusCode) : hasError(rawStatusCode));
   }
   protected boolean hasError(HttpStatus statusCode) {
      return statusCode.isError();
   }
   protected boolean hasError(int unknownStatusCode) {
      HttpStatus.Series series = HttpStatus.Series.resolve(unknownStatusCode);
      //4xx || 5xx
      return (series == HttpStatus.Series.CLIENT_ERROR || series == HttpStatus.Series.SERVER_ERROR);
   }
   @Override
   public void handleError(ClientHttpResponse response) throws IOException {
      HttpStatus statusCode = HttpStatus.resolve(response.getRawStatusCode());
      if (statusCode == null) {
         throw new UnknownHttpStatusCodeException(response.getRawStatusCode(), response.getStatusText(),
               response.getHeaders(), getResponseBody(response), getCharset(response));
      }
      handleError(response, statusCode);
   }
   protected void handleError(ClientHttpResponse response, HttpStatus statusCode) throws IOException {
      String statusText = response.getStatusText();
      HttpHeaders headers = response.getHeaders();
      byte[] body = getResponseBody(response);
      Charset charset = getCharset(response);
      switch (statusCode.series()) {
         case CLIENT_ERROR:
            throw HttpClientErrorException.create(statusCode, statusText, headers, body, charset);
         case SERVER_ERROR:
            throw HttpServerErrorException.create(statusCode, statusText, headers, body, charset);
         default:
            throw new UnknownHttpStatusCodeException(statusCode.value(), statusText, headers, body, charset);
      }
   }
   @Deprecated
   protected HttpStatus getHttpStatusCode(ClientHttpResponse response) throws IOException {
      HttpStatus statusCode = HttpStatus.resolve(response.getRawStatusCode());
      if (statusCode == null) {
         throw new UnknownHttpStatusCodeException(response.getRawStatusCode(), response.getStatusText(),
               response.getHeaders(), getResponseBody(response), getCharset(response));
      }
      return statusCode;
   }
   protected byte[] getResponseBody(ClientHttpResponse response) {
      try {
         return FileCopyUtils.copyToByteArray(response.getBody());
      }
      catch (IOException ex) {
         // ignore
      }
      return new byte[0];
   }
   @Nullable
   protected Charset getCharset(ClientHttpResponse response) {
      HttpHeaders headers = response.getHeaders();
      MediaType contentType = headers.getContentType();
      return (contentType != null ? contentType.getCharset() : null);
   }
}
```

#### 2.5、提取response数据转换成自定义实体

在调用ClientHttpRequest的execute()方法后返回了一个封装http response的ClientHttpResponse，ResponseExtractor用来从ClientHttpResponse提取数据转换成泛型参数所代表的对象。

```java
public <T> ResponseExtractor<ResponseEntity<T>> responseEntityExtractor(Type responseType) {
   return new ResponseEntityResponseExtractor<>(responseType);
}
```

ResponseEntityResponseExtractor内部委托给HttpMessageConverterExtractor。

```java
private class ResponseEntityResponseExtractor<T> implements ResponseExtractor<ResponseEntity<T>> {
   @Nullable
   private final HttpMessageConverterExtractor<T> delegate;
   public ResponseEntityResponseExtractor(@Nullable Type responseType) {
      if (responseType != null && Void.class != responseType) {
         this.delegate = new HttpMessageConverterExtractor<>(responseType, getMessageConverters(), logger);
      }
      else {
         this.delegate = null;
      }
   }
   @Override
   public ResponseEntity<T> extractData(ClientHttpResponse response) throws IOException {
      if (this.delegate != null) {
         T body = this.delegate.extractData(response);
         return ResponseEntity.status(response.getRawStatusCode()).headers(response.getHeaders()).body(body);
      }
      else {
         return ResponseEntity.status(response.getRawStatusCode()).headers(response.getHeaders()).build();
      }
   }
}
```

HttpMessageConverterExtractor在1.1小节看过了这里不再啰嗦。

## 3、拦截器

拦截器可以在发送http请求之前对请求进行访问或修改，这一切对用户是透明的，只需要编写我们的ClientHttpRequestInterceptor即可。

```java
@FunctionalInterface
public interface ClientHttpRequestInterceptor {
   ClientHttpResponse intercept(HttpRequest request, byte[] body, ClientHttpRequestExecution execution)
         throws IOException;
}
```

#### 3.1、拦截器原理

RestTemplate的父类InterceptingHttpAccessor通过调用setInterceptors()方法提供了添加拦截器的功能。

```java
public void setInterceptors(List<ClientHttpRequestInterceptor> interceptors) {
   // Take getInterceptors() List as-is when passed in here
   if (this.interceptors != interceptors) {
      this.interceptors.clear();
      this.interceptors.addAll(interceptors);
      AnnotationAwareOrderComparator.sort(this.interceptors);
   }
}
```

InterceptingHttpAccessor也重写了getRequestFactory()方法，目的是如果配置了拦截器，则使用InterceptingClientHttpRequestFactory，这个类重写了父类的createRequest()方法返回InterceptingClientHttpRequest，这个类持有拦截器的引用。

InterceptingHttpAccessor#getRequestFactory()方法：

```java
@Override
public ClientHttpRequestFactory getRequestFactory() {
   List<ClientHttpRequestInterceptor> interceptors = getInterceptors();
   if (!CollectionUtils.isEmpty(interceptors)) {
      ClientHttpRequestFactory factory = this.interceptingRequestFactory;
      if (factory == null) {
         factory = new InterceptingClientHttpRequestFactory(super.getRequestFactory(), interceptors);
         this.interceptingRequestFactory = factory;
      }
      return factory;
   }
   else {
      return super.getRequestFactory();
   }
}
```

```java
public class InterceptingClientHttpRequestFactory extends AbstractClientHttpRequestFactoryWrapper {
   private final List<ClientHttpRequestInterceptor> interceptors;
   public InterceptingClientHttpRequestFactory(ClientHttpRequestFactory requestFactory,
         @Nullable List<ClientHttpRequestInterceptor> interceptors) {
      super(requestFactory);
      this.interceptors = (interceptors != null ? interceptors : Collections.emptyList());
   }
   @Override
   protected ClientHttpRequest createRequest(URI uri, HttpMethod httpMethod, ClientHttpRequestFactory requestFactory) {
      return new InterceptingClientHttpRequest(requestFactory, this.interceptors, uri, httpMethod);
   }
}
```

应为拦截器中可以获取到request的body，所以InterceptingClientHttpRequest继承于AbstractBufferingClientHttpRequest，拦截器是在executeInternal()方法中起作用的。

```java
@Override
protected final ClientHttpResponse executeInternal(HttpHeaders headers, byte[] bufferedOutput) throws IOException {
   InterceptingRequestExecution requestExecution = new InterceptingRequestExecution();
   return requestExecution.execute(this, bufferedOutput);
}
private class InterceptingRequestExecution implements ClientHttpRequestExecution {
   private final Iterator<ClientHttpRequestInterceptor> iterator;
   public InterceptingRequestExecution() {
      this.iterator = interceptors.iterator();
   }
   @Override
   public ClientHttpResponse execute(HttpRequest request, byte[] body) throws IOException {
      if (this.iterator.hasNext()) {
         ClientHttpRequestInterceptor nextInterceptor = this.iterator.next();
         //拦截器起作用后内部会调用execution.execute()方法继续调用这个方法使下个拦截器起作用
         return nextInterceptor.intercept(request, body, this);
      }
      else {
         //直到所有拦截器拦截完毕，使用原requestFactory创建的ClientHttpRequest完成请求
         HttpMethod method = request.getMethod();
         Assert.state(method != null, "No standard HTTP method");
         ClientHttpRequest delegate = requestFactory.createRequest(request.getURI(), method);
         request.getHeaders().forEach((key, value) -> delegate.getHeaders().addAll(key, value));
         if (body.length > 0) {
            if (delegate instanceof StreamingHttpOutputMessage) {
               StreamingHttpOutputMessage streamingOutputMessage = (StreamingHttpOutputMessage) delegate;
               streamingOutputMessage.setBody(outputStream -> StreamUtils.copy(body, outputStream));
            }
            else {
               StreamUtils.copy(body, delegate.getBody());
            }
         }
         return delegate.execute();
      }
   }
}
```

#### 3.2、Spring提供的拦截器实现

**BasicAuthenticationInterceptor**可以对http header添加basic-auth提供客户端的Basic认证。

```java
public class BasicAuthenticationInterceptor implements ClientHttpRequestInterceptor {
   private final String username;
   private final String password;
   @Nullable
   private final Charset charset;
   public BasicAuthenticationInterceptor(String username, String password) {
      this(username, password, null);
   }
   public BasicAuthenticationInterceptor(String username, String password, @Nullable Charset charset) {
      Assert.doesNotContain(username, ":", "Username must not contain a colon");
      this.username = username;
      this.password = password;
      this.charset = charset;
   }
   @Override
   public ClientHttpResponse intercept(
         HttpRequest request, byte[] body, ClientHttpRequestExecution execution) throws IOException {
      HttpHeaders headers = request.getHeaders();
      if (!headers.containsKey(HttpHeaders.AUTHORIZATION)) {
         headers.setBasicAuth(this.username, this.password, this.charset);
      }
      return execution.execute(request, body);
   }
}
```
