# 07、SpringCloud Alibaba - OpenFeign 执行流程
- 来源：https://ddkk.com/zhuanlan/j2ee/springcloudalibaba/3/7.html
- 分类：J2EE框架
- 分组：Spring Cloud Alibaba 教程
## 前言

上一篇中，分析了OpenFeign 的初始化流程，最终会为@FeignClient标识的接口创建jdk动态代理对象。hander是FeignInvocationHandler，访问目标方法时，会进入到它的invoke( )方法。

### 1、进入代理方法

```java
FeignInvocationHandler.java
 @Override
    public Object invoke(Object proxy, Method method, Object[] args) throws Throwable {
      if ("equals".equals(method.getName())) {
        try {
          Object otherHandler =
              args.length > 0 && args[0] != null ? Proxy.getInvocationHandler(args[0]) : null;
          return equals(otherHandler);
        } catch (IllegalArgumentException e) {
          return false;
        }
      } else if ("hashCode".equals(method.getName())) {
        return hashCode();
      } else if ("toString".equals(method.getName())) {
        return toString();
      }
	  //调用MethodHandler的invoke()方法，MethodHandler 有 SynchronousMethodHandler 和 DefaultMethodHandler
      return dispatch.get(method).invoke(args);
    }
```

### 2、SynchronousMethodHandler

```java
@Override
  public Object invoke(Object[] argv) throws Throwable {
  	//创建 RequestTemplate 
    RequestTemplate template = buildTemplateFromArgs.create(argv);
    //从参数中获取Options或者使用默认的Options 
    Options options = findOptions(argv);
    //重试策略
    Retryer retryer = this.retryer.clone();
    while (true) {
      try {
        //执行请求 解析响应
        return executeAndDecode(template, options);
      } catch (RetryableException e) {
        try {
          //异常 重试
          retryer.continueOrPropagate(e);
        } catch (RetryableException th) {
          Throwable cause = th.getCause();
          if (propagationPolicy == UNWRAP && cause != null) {
            throw cause;
          } else {
            throw th;
          }
        }
        if (logLevel != Logger.Level.NONE) {
          logger.logRetry(metadata.configKey(), logLevel);
        }
        continue;
      }
    }
  }
```

### 3、创建 RequestTemplate

```java
  @Override
    public RequestTemplate create(Object[] argv) {
      //根据请求接口方法的元数据信息创建新的 RequestTemplate 对象
      RequestTemplate mutable = RequestTemplate.from(metadata.template());
      mutable.feignTarget(target);
      if (metadata.urlIndex() != null) {
        int urlIndex = metadata.urlIndex();
        checkArgument(argv[urlIndex] != null, "URI parameter %s was null", urlIndex);
        mutable.target(String.valueOf(argv[urlIndex]));
      }
      Map<String, Object> varBuilder = new LinkedHashMap<String, Object>();
      for (Entry<Integer, Collection<String>> entry : metadata.indexToName().entrySet()) {
        int i = entry.getKey();
        Object value = argv[entry.getKey()];
        if (value != null) {
      // Null values are skipped.
          if (indexToExpander.containsKey(i)) {
            value = expandElements(indexToExpander.get(i), value);
          }
          for (String name : entry.getValue()) {
            varBuilder.put(name, value);
          }
        }
      }
	  //占位符变量替换成值
      RequestTemplate template = resolve(argv, mutable, varBuilder);
      if (metadata.queryMapIndex() != null) {
        // add query map parameters after initial resolve so that they take
        // precedence over any predefined values
        Object value = argv[metadata.queryMapIndex()];
        Map<String, Object> queryMap = toQueryMap(value);
        template = addQueryMapQueryParameters(queryMap, template);
      }
      if (metadata.headerMapIndex() != null) {
        template =
            addHeaderMapHeaders((Map<String, Object>) argv[metadata.headerMapIndex()], template);
      }
      return template;
    }
```

RequestTemplate 包含了请求的远程服务端信息、请求的url、请求的参数等信息。

### 4、执行请求

1、executeAndDecode( )

```java
Object executeAndDecode(RequestTemplate template, Options options) throws Throwable {
	//调用 RequestInterceptor，创建 Request
    Request request = targetRequest(template);
    if (logLevel != Logger.Level.NONE) {
      logger.logRequest(metadata.configKey(), logLevel, request);
    }
    Response response;
    long start = System.nanoTime();
    try {
      //执行远程请求
      response = client.execute(request, options);
      // ensure the request is set. TODO: remove in Feign 12
      response = response.toBuilder()
          .request(request)
          .requestTemplate(template)
          .build();
    } catch (IOException e) {
      if (logLevel != Logger.Level.NONE) {
        logger.logIOException(metadata.configKey(), logLevel, e, elapsedTime(start));
      }
      //出现异常时抛出重试异常 RetryableException
      throw errorExecuting(request, e);
    }
    long elapsedTime = TimeUnit.NANOSECONDS.toMillis(System.nanoTime() - start);
	//对响应进行解析
    if (decoder != null)
      return decoder.decode(response, metadata.returnType());
    CompletableFuture<Object> resultFuture = new CompletableFuture<>();
    asyncResponseHandler.handleResponse(resultFuture, metadata.configKey(), response,
        metadata.returnType(),
        elapsedTime);
    try {
      if (!resultFuture.isDone())
        throw new IllegalStateException("Response handling not done");
      return resultFuture.join();
    } catch (CompletionException e) {
      Throwable cause = e.getCause();
      if (cause != null)
        throw cause;
      throw e;
    }
  }
```

2、创建请求 targetRequest( )

```java
Request targetRequest(RequestTemplate template) {
    for (RequestInterceptor interceptor : requestInterceptors) {
      interceptor.apply(template);
    }
    return target.apply(template);
  }
```

3、执行请求

```java
@Override
	public Response execute(Request request, Request.Options options) throws IOException {
		final URI originalUri = URI.create(request.url());
		String serviceId = originalUri.getHost();
		Assert.state(serviceId != null, "Request URI does not contain a valid hostname: " + originalUri);
		String hint = getHint(serviceId);
		//封装成 DefaultRequest
		DefaultRequest<RequestDataContext> lbRequest = new DefaultRequest<>(
				new RequestDataContext(buildRequestData(request), hint));
		//获取LoadBalancerLifecycle
		Set<LoadBalancerLifecycle> supportedLifecycleProcessors = LoadBalancerLifecycleValidator
				.getSupportedLifecycleProcessors(
						loadBalancerClientFactory.getInstances(serviceId, LoadBalancerLifecycle.class),
						RequestDataContext.class, ResponseData.class, ServiceInstance.class);
		//负载均衡执行前的回调
		supportedLifecycleProcessors.forEach(lifecycle -> lifecycle.onStart(lbRequest));
		//执行负载均衡，默认使用 RoundRobinLoadBalancer
		ServiceInstance instance = loadBalancerClient.choose(serviceId, lbRequest);
		org.springframework.cloud.client.loadbalancer.Response<ServiceInstance> lbResponse = new DefaultResponse(
				instance);
		if (instance == null) {
			//远程没有可用的服务
			String message = "Load balancer does not contain an instance for the service " + serviceId;
			if (LOG.isWarnEnabled()) {
				LOG.warn(message);
			}
			//负载均衡执行后的回调
			supportedLifecycleProcessors.forEach(lifecycle -> lifecycle
					.onComplete(new CompletionContext<ResponseData, ServiceInstance, RequestDataContext>(
							CompletionContext.Status.DISCARD, lbRequest, lbResponse)));
			//直接响应
			return Response.builder().request(request).status(HttpStatus.SERVICE_UNAVAILABLE.value())
					.body(message, StandardCharsets.UTF_8).build();
		}
		//远程有可用的服务时
		//构建真正的请求url，将服务名称替换成 ip 地址
		String reconstructedUrl = loadBalancerClient.reconstructURI(instance, originalUri).toString();
		//创建新的 Request
		Request newRequest = buildRequest(request, reconstructedUrl);
		//执行请求
		return executeWithLoadBalancerLifecycleProcessing(delegate, options, newRequest, lbRequest, lbResponse,
				supportedLifecycleProcessors);
	}
```

4、负载均衡请求 executeWithLoadBalancerLifecycleProcessing( )

```java
static Response executeWithLoadBalancerLifecycleProcessing(Client feignClient, Request.Options options,
			Request feignRequest, org.springframework.cloud.client.loadbalancer.Request lbRequest,
			org.springframework.cloud.client.loadbalancer.Response<ServiceInstance> lbResponse,
			Set<LoadBalancerLifecycle> supportedLifecycleProcessors, boolean loadBalanced) throws IOException {
		//回调 onStartRequest
		supportedLifecycleProcessors.forEach(lifecycle -> lifecycle.onStartRequest(lbRequest, lbResponse));
		try {
			//执行请求
			Response response = feignClient.execute(feignRequest, options);
			if (loadBalanced) {
				//回调onComplete
				supportedLifecycleProcessors.forEach(
						lifecycle -> lifecycle.onComplete(new CompletionContext<>(CompletionContext.Status.SUCCESS,
								lbRequest, lbResponse, buildResponseData(response))));
			}
			return response;
		}
		catch (Exception exception) {
			if (loadBalanced) {
				supportedLifecycleProcessors.forEach(lifecycle -> lifecycle.onComplete(
						new CompletionContext<>(CompletionContext.Status.FAILED, exception, lbRequest, lbResponse)));
			}
			throw exception;
		}
	}
```

5、execute( )

```java
 @Override
    public Response execute(Request request, Options options) throws IOException {
      //发送请求
      HttpURLConnection connection = convertAndSend(request, options);
      //处理响应
      return convertResponse(connection, request);
    }
```

6、发送请求

```java
HttpURLConnection convertAndSend(Request request, Options options) throws IOException {
		//创建 URL 
      final URL url = new URL(request.url());
      //打开连接 HttpURLConnection 
      final HttpURLConnection connection = this.getConnection(url);
      if (connection instanceof HttpsURLConnection) {
        //https  sslContextFactory  hostnameVerifier
        HttpsURLConnection sslCon = (HttpsURLConnection) connection;
        if (sslContextFactory != null) {
          sslCon.setSSLSocketFactory(sslContextFactory);
        }
        if (hostnameVerifier != null) {
          sslCon.setHostnameVerifier(hostnameVerifier);
        }
      }
      //connection 属性设置
      connection.setConnectTimeout(options.connectTimeoutMillis());
      connection.setReadTimeout(options.readTimeoutMillis());
      connection.setAllowUserInteraction(false);
      connection.setInstanceFollowRedirects(options.isFollowRedirects());
      connection.setRequestMethod(request.httpMethod().name());
      Collection<String> contentEncodingValues = request.headers().get(CONTENT_ENCODING);
      boolean gzipEncodedRequest =
          contentEncodingValues != null && contentEncodingValues.contains(ENCODING_GZIP);
      boolean deflateEncodedRequest =
          contentEncodingValues != null && contentEncodingValues.contains(ENCODING_DEFLATE);
      boolean hasAcceptHeader = false;
      Integer contentLength = null;
      for (String field : request.headers().keySet()) {
        if (field.equalsIgnoreCase("Accept")) {
          hasAcceptHeader = true;
        }
        for (String value : request.headers().get(field)) {
          if (field.equals(CONTENT_LENGTH)) {
            if (!gzipEncodedRequest && !deflateEncodedRequest) {
              contentLength = Integer.valueOf(value);
              connection.addRequestProperty(field, value);
            }
          } else {
            connection.addRequestProperty(field, value);
          }
        }
      }
      // Some servers choke on the default accept string.
      if (!hasAcceptHeader) {
        connection.addRequestProperty("Accept", "*/*");
      }
      if (request.body() != null) {
        if (disableRequestBuffering) {
          if (contentLength != null) {
            connection.setFixedLengthStreamingMode(contentLength);
          } else {
            connection.setChunkedStreamingMode(8196);
          }
        }
        connection.setDoOutput(true);
        OutputStream out = connection.getOutputStream();
        if (gzipEncodedRequest) {
          out = new GZIPOutputStream(out);
        } else if (deflateEncodedRequest) {
          out = new DeflaterOutputStream(out);
        }
        try {
          //发送请求
          out.write(request.body());
        } finally {
          try {
            out.close();
          } catch (IOException suppressed) {
      // NOPMD
          }
        }
      }
      return connection;
    }
  }
```

7、处理响应

```java
Response convertResponse(HttpURLConnection connection, Request request) throws IOException {
	  //响应状态码
      int status = connection.getResponseCode();
      //原因
      String reason = connection.getResponseMessage();
      if (status < 0) {
        throw new IOException(format("Invalid status(%s) executing %s %s", status,
            connection.getRequestMethod(), connection.getURL()));
      }
      Map<String, Collection<String>> headers = new LinkedHashMap<>();
      for (Map.Entry<String, List<String>> field : connection.getHeaderFields().entrySet()) {
        // response message
        if (field.getKey() != null) {
          headers.put(field.getKey(), field.getValue());
        }
      }
      Integer length = connection.getContentLength();
      if (length == -1) {
        length = null;
      }
      InputStream stream;
      if (status >= 400) {
        stream = connection.getErrorStream();
      } else {
        stream = connection.getInputStream();
      }
      //创建Response，封装响应的信息
      return Response.builder()
          .status(status)
          .reason(reason)
          .headers(headers)
          .request(request)
          .body(stream, length)
          .build();
    }
```

### 5、DefaultMethodHandler

和SynchronousMethodHandler 一样继承MethodHandler，SynchronousMethodHandler 用于执行远程服务端方法，DefaultMethodHandler用于处理接口中的默认方法。

```java
//方法句柄
 private final MethodHandle unboundHandle;
 private MethodHandle handle;
```

```java
public DefaultMethodHandler(Method defaultMethod) {
    try {
      Class<?> declaringClass = defaultMethod.getDeclaringClass();
      Field field = Lookup.class.getDeclaredField("IMPL_LOOKUP");
      field.setAccessible(true);
      Lookup lookup = (Lookup) field.get(null);
	  //创建方法句柄
      this.unboundHandle = lookup.unreflectSpecial(defaultMethod, declaringClass);
    } catch (NoSuchFieldException ex) {
      throw new IllegalStateException(ex);
    } catch (IllegalAccessException ex) {
      throw new IllegalStateException(ex);
    }
  }
```

```java
 public void bindTo(Object proxy) {
    if (handle != null) {
      throw new IllegalStateException(
          "Attempted to rebind a default method handler that was already bound");
    }
    //绑定代理对象
    handle = unboundHandle.bindTo(proxy);
  }
```

```java
 @Override
  public Object invoke(Object[] argv) throws Throwable {
    if (handle == null) {
      throw new IllegalStateException(
          "Default method handler invoked before proxy has been bound.");
    }
    //执行接口默认方法
    return handle.invokeWithArguments(argv);
  }
}
```
