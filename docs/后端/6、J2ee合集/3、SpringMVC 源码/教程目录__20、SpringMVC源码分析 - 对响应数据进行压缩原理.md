# 20、SpringMVC源码分析 - 对响应数据进行压缩原理
- 来源：https://ddkk.com/zhuanlan/j2ee/springmvc/7/20.html
- 分类：J2EE框架
- 分组：教程目录
## 前言

为了节省带宽，在响应数据比较大的情况下，可以对响应数据进行压缩，返回给前端页面压缩数据。

## 一、配置

```java
# 开启压缩
server.compression.enabled=true
server.compression.mime-types=application/javascript,text/css,application/json,application/xml,text/html,text/xml,text/plain
server.compression.min-response-size=2KB
```

## 二、原理

### 1.参数的注入

1、从AbstractApplicationContext的onRefresh()方法开始

```java
@Override
	protected void onRefresh() {
		super.onRefresh();
		try {
			//创建web容器服务
			createWebServer();
		}
		catch (Throwable ex) {
			throw new ApplicationContextException("Unable to start web server", ex);
		}
	}
```

2、createWebServer( )

```java
private void createWebServer() {
		WebServer webServer = this.webServer;
		ServletContext servletContext = getServletContext();
		if (webServer == null && servletContext == null) {
			StartupStep createWebServer = this.getApplicationStartup().start("spring.boot.webserver.create");
			//这里创建ServletWebServerFactory，通过spring容器获取：getBeanFactory().getBean(beanNames[0], ServletWebServerFactory.class)
			ServletWebServerFactory factory = getWebServerFactory();
			createWebServer.tag("factory", factory.getClass().toString());
			//获取WebServer
			this.webServer = factory.getWebServer(getSelfInitializer());
			createWebServer.end();
			getBeanFactory().registerSingleton("webServerGracefulShutdown",
					new WebServerGracefulShutdownLifecycle(this.webServer));
			getBeanFactory().registerSingleton("webServerStartStop",
					new WebServerStartStopLifecycle(this, this.webServer));
		}
		else if (servletContext != null) {
			try {
				getSelfInitializer().onStartup(servletContext);
			}
			catch (ServletException ex) {
				throw new ApplicationContextException("Cannot initialize servlet context", ex);
			}
		}
		initPropertySources();
	}
```

3、WebServerFactoryCustomizerBeanPostProcessor

bean的后置处理器的postProcessBeforeInitialization方法会在bean初始化过程中被调用

```java
@Override
	public Object postProcessBeforeInitialization(Object bean, String beanName) throws BeansException {
		if (bean instanceof WebServerFactory) {
			postProcessBeforeInitialization((WebServerFactory) bean);
		}
		return bean;
	}
```

postProcessBeforeInitialization( )

```java
private void postProcessBeforeInitialization(WebServerFactory webServerFactory) {
		LambdaSafe.callbacks(WebServerFactoryCustomizer.class, getCustomizers(), webServerFactory)
				.withLogger(WebServerFactoryCustomizerBeanPostProcessor.class)
				.invoke((customizer) -> customizer.customize(webServerFactory));
	}
```

获取WebServerFactoryCustomizer

```java
private Collection<WebServerFactoryCustomizer<?>> getCustomizers() {
		if (this.customizers == null) {
			// Look up does not include the parent context
			this.customizers = new ArrayList<>(getWebServerFactoryCustomizerBeans());
			this.customizers.sort(AnnotationAwareOrderComparator.INSTANCE);
			this.customizers = Collections.unmodifiableList(this.customizers);
		}
		return this.customizers;
	}
```

```java
private Collection<WebServerFactoryCustomizer<?>> getWebServerFactoryCustomizerBeans() {
		//根据类型获取WebServerFactoryCustomizer
		return (Collection) this.beanFactory.getBeansOfType(WebServerFactoryCustomizer.class, false, false).values();
	}
```

调用ServletWebServerFactoryCustomizer的customize( )方法

```java
@Override
	public void customize(ConfigurableServletWebServerFactory factory) {
		PropertyMapper map = PropertyMapper.get().alwaysApplyingWhenNonNull();
		map.from(this.serverProperties::getPort).to(factory::setPort);
		map.from(this.serverProperties::getAddress).to(factory::setAddress);
		map.from(this.serverProperties.getServlet()::getContextPath).to(factory::setContextPath);
		map.from(this.serverProperties.getServlet()::getApplicationDisplayName).to(factory::setDisplayName);
		map.from(this.serverProperties.getServlet()::isRegisterDefaultServlet).to(factory::setRegisterDefaultServlet);
		map.from(this.serverProperties.getServlet()::getSession).to(factory::setSession);
		map.from(this.serverProperties::getSsl).to(factory::setSsl);
		map.from(this.serverProperties.getServlet()::getJsp).to(factory::setJsp);
		//从serverProperties中获取Compression，并设置到ServletWebServerFactory中
		map.from(this.serverProperties::getCompression).to(factory::setCompression);
		map.from(this.serverProperties::getHttp2).to(factory::setHttp2);
		map.from(this.serverProperties::getServerHeader).to(factory::setServerHeader);
		map.from(this.serverProperties.getServlet()::getContextParameters).to(factory::setInitParameters);
		map.from(this.serverProperties.getShutdown()).to(factory::setShutdown);
		for (WebListenerRegistrar registrar : this.webListenerRegistrars) {
			registrar.register(factory);
		}
	}
```

4、Compression 类中的几个参数

```java
public class Compression {
	//开关
	private boolean enabled = false;
	private String[] mimeTypes = new String[] {
      "text/html", "text/xml", "text/plain", "text/css", "text/javascript",
			"application/javascript", "application/json", "application/xml" };
	private String[] excludedUserAgents = null;
	//默认最小2KB
	private DataSize minResponseSize = DataSize.ofKilobytes(2);
}
```

此时压缩参数被设置到了ServletWebServerFactory中

### 2.CompressionHttpHandlerFactory的创建

5、获取WebServer

```java
this.webServer = factory.getWebServer(getSelfInitializer());
```

getWebServer( )

```java
@Override
	public WebServer getWebServer(ServletContextInitializer... initializers) {
		Builder builder = this.delegate.createBuilder(this);
		DeploymentManager manager = createManager(initializers);
		return getUndertowWebServer(builder, manager, getPort());
	}
```

getUndertowWebServer( )

```java
protected UndertowServletWebServer getUndertowWebServer(Builder builder, DeploymentManager manager, int port) {
		//创建HttpHandlerFactory
		List<HttpHandlerFactory> httpHandlerFactories = this.delegate.createHttpHandlerFactories(this,
				new DeploymentManagerHttpHandlerFactory(manager));
		return new UndertowServletWebServer(builder, httpHandlerFactories, getContextPath(), port >= 0);
	}
```

6、createHttpHandlerFactories( )

```java
List<HttpHandlerFactory> createHttpHandlerFactories(AbstractConfigurableWebServerFactory webServerFactory,
			HttpHandlerFactory... initialHttpHandlerFactories) {
		//这里从webServerFactory获取Compression
		List<HttpHandlerFactory> factories = createHttpHandlerFactories(webServerFactory.getCompression(),
				this.useForwardHeaders, webServerFactory.getServerHeader(), webServerFactory.getShutdown(),
				initialHttpHandlerFactories);
		if (isAccessLogEnabled()) {
			factories.add(new AccessLogHttpHandlerFactory(this.accessLogDirectory, this.accessLogPattern,
					this.accessLogPrefix, this.accessLogSuffix, this.accessLogRotate));
		}
		return factories;
	}
```

```java
static List<HttpHandlerFactory> createHttpHandlerFactories(Compression compression, boolean useForwardHeaders,
			String serverHeader, Shutdown shutdown, HttpHandlerFactory... initialHttpHandlerFactories) {
		List<HttpHandlerFactory> factories = new ArrayList<>(Arrays.asList(initialHttpHandlerFactories));
		//compression不为null，并且开启了压缩，创建CompressionHttpHandlerFactory
		if (compression != null && compression.getEnabled()) {
			factories.add(new CompressionHttpHandlerFactory(compression));
		}
		if (useForwardHeaders) {
			factories.add(Handlers::proxyPeerAddress);
		}
		if (StringUtils.hasText(serverHeader)) {
			factories.add((next) -> Handlers.header(next, "Server", serverHeader));
		}
		if (shutdown == Shutdown.GRACEFUL) {
			factories.add(Handlers::gracefulShutdown);
		}
		return factories;
	}
```

7、创建完HttpHandlerFactory，构造UndertowServletWebServer

```java
new UndertowServletWebServer(builder, httpHandlerFactories, getContextPath(), port >= 0)
```

```java
public UndertowServletWebServer(Builder builder, Iterable<HttpHandlerFactory> httpHandlerFactories,
			String contextPath, boolean autoStart) {
		super(builder, httpHandlerFactories, autoStart);
		this.contextPath = contextPath;
		this.manager = findManager(httpHandlerFactories);
	}
```

### 3.压缩的预言

8、UndertowWebServer.start( )

```java
@Override
	public void start() throws WebServerException {
		synchronized (this.monitor) {
			if (this.started) {
				return;
			}
			try {
				if (!this.autoStart) {
					return;
				}
				if (this.undertow == null) {
					//创建Undertow
					this.undertow = createUndertowServer();
				}
				this.undertow.start();
				this.started = true;
				String message = getStartLogMessage();
				logger.info(message);
			}
			catch (Exception ex) {
				try {
					PortInUseException.ifPortBindingException(ex, (bindException) -> {
						List<Port> failedPorts = getConfiguredPorts();
						failedPorts.removeAll(getActualPorts());
						if (failedPorts.size() == 1) {
							throw new PortInUseException(failedPorts.get(0).getNumber());
						}
					});
					throw new WebServerException("Unable to start embedded Undertow", ex);
				}
				finally {
					stopSilently();
				}
			}
		}
	}
```

createUndertowServer( )

```java
private Undertow createUndertowServer() {
		this.closeables = new ArrayList<>();
		this.gracefulShutdown = null;
		HttpHandler handler = createHttpHandler();
		this.builder.setHandler(handler);
		return this.builder.build();
	}
```

createHttpHandler( )

```java
@Override
	protected HttpHandler createHttpHandler() {
		HttpHandler handler = super.createHttpHandler();
		if (StringUtils.hasLength(this.contextPath)) {
			handler = Handlers.path().addPrefixPath(this.contextPath, handler);
		}
		return handler;
	}
```

创建HttpHandler的执行链

```java
protected HttpHandler createHttpHandler() {
		HttpHandler handler = null;
		for (HttpHandlerFactory factory : this.httpHandlerFactories) {
			//获取HttpHandler 
			handler = factory.getHandler(handler);
			if (handler instanceof Closeable) {
				this.closeables.add((Closeable) handler);
			}
			if (handler instanceof GracefulShutdownHandler) {
				Assert.isNull(this.gracefulShutdown, "Only a single GracefulShutdownHandler can be defined");
				this.gracefulShutdown = (GracefulShutdownHandler) handler;
			}
		}
		return handler;
	}
```

getHandler( )

```java
CompressionHttpHandlerFactory.java
@Override
	public HttpHandler getHandler(HttpHandler next) {
		if (!this.compression.getEnabled()) {
			return next;
		}
		ContentEncodingRepository repository = new ContentEncodingRepository();
		repository.addEncodingHandler("gzip", new GzipEncodingProvider(), 50,
				Predicates.and(getCompressionPredicates(this.compression)));
		return new EncodingHandler(repository).setNext(next);
	}
```

getCompressionPredicates( )获取压缩的预言条件

```java
private static Predicate[] getCompressionPredicates(Compression compression) {
		List<Predicate> predicates = new ArrayList<>();
		//字节长度的预言
		predicates.add(new MaxSizePredicate((int) compression.getMinResponseSize().toBytes()));
		//MimeType的预言
		predicates.add(new CompressibleMimeTypePredicate(compression.getMimeTypes()));
		if (compression.getExcludedUserAgents() != null) {
			for (String agent : compression.getExcludedUserAgents()) {
				RequestHeaderAttribute agentHeader = new RequestHeaderAttribute(new HttpString(HttpHeaders.USER_AGENT));
				//UserAgent的预言
				predicates.add(Predicates.not(Predicates.regex(agentHeader, agent)));
			}
		}
		return predicates.toArray(new Predicate[0]);
	}
```

9、MaxSizePredicate

```java
private static class MaxSizePredicate implements Predicate {
		private final Predicate maxContentSize;
		MaxSizePredicate(int size) {
			this.maxContentSize = Predicates.requestLargerThan(size);
		}
		@Override
		public boolean resolve(HttpServerExchange value) {
			//响应头包含Content-Length
			if (value.getResponseHeaders().contains(Headers.CONTENT_LENGTH)) {
				return this.maxContentSize.resolve(value);
			}
			return true;
		}
	}
```

maxContentSize.resolve( )

```java
 @Override
    public boolean resolve(final HttpServerExchange exchange) {
    	//获取Content-Length 长度
        final String length = exchange.getResponseHeaders().getFirst(Headers.CONTENT_LENGTH);
        if (length == null) {
            return false;
        }
        //校验是否大于给定的大小
        return Long.parseLong(length) > size;
    }
```

10、CompressibleMimeTypePredicate

```java
private static class CompressibleMimeTypePredicate implements Predicate {
		//保存配置的mimeTypes
		private final List<MimeType> mimeTypes;
		CompressibleMimeTypePredicate(String[] mimeTypes) {
			this.mimeTypes = new ArrayList<>(mimeTypes.length);
			for (String mimeTypeString : mimeTypes) {
				this.mimeTypes.add(MimeTypeUtils.parseMimeType(mimeTypeString));
			}
		}
		@Override
		public boolean resolve(HttpServerExchange value) {
			//获取Content-Type
			String contentType = value.getResponseHeaders().getFirst(HttpHeaders.CONTENT_TYPE);
			if (contentType != null) {
				try {
					MimeType parsed = MimeTypeUtils.parseMimeType(contentType);
					for (MimeType mimeType : this.mimeTypes) {
						//校验响应头中的Content-Type是否能匹配上配置的mimeTypes
						if (mimeType.isCompatibleWith(parsed)) {
							return true;
						}
					}
				}
				catch (InvalidMimeTypeException ex) {
					return false;
				}
			}
			return false;
		}
	}
```

11、RegularExpressionPredicate

```java
@Override
    public boolean resolve(final HttpServerExchange value) {
    	//获取User-Agent
        String input = matchAttribute.readAttribute(value);
        if(input == null) {
            return false;
        }
        Matcher matcher = pattern.matcher(input);
        final boolean matches;
        //正则匹配
        if (requireFullMatch) {
            matches = matcher.matches();
        } else {
            matches = matcher.find();
        }
        if (traceEnabled) {
            UndertowLogger.PREDICATE_LOGGER.tracef("Regex pattern [%s] %s input [%s] for %s.", pattern.toString(), (matches ? "MATCHES" : "DOES NOT MATCH" ), input, value);
        }
        if (matches) {
            Map<String, Object> context = value.getAttachment(PREDICATE_CONTEXT);
            if(context == null) {
                value.putAttachment(PREDICATE_CONTEXT, context = new TreeMap<>());
            }
            int count = matcher.groupCount();
            for (int i = 0; i <= count; ++i) {
                if (traceEnabled) {
                    UndertowLogger.PREDICATE_LOGGER.tracef("Storing regex match group [%s] as [%s] for %s.", i, matcher.group(i), value);
                }
                context.put(Integer.toString(i), matcher.group(i));
            }
        }
        return matches;
    }
```

## 总结

使用压缩功能的条件：

**1、** 开启压缩enabled=true；

**2、** MaxSizePredicate，校验Content-Length；

**3、** CompressibleMimeTypePredicate，校验Content-Type；

**4、** RegularExpressionPredicate，校验User-Agent；
