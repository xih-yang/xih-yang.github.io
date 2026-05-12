# 18、SpringBoot 源码分析 - web环境初始化四
- 来源：https://ddkk.com/zhuanlan/j2ee/springboot/6/18.html
- 分类：J2EE框架
- 分组：教程目录
## 基本流程图，方便查看

## TomcatServletWebServerFactory的getWebServer

前面我们获取到了`TomcatServletWebServerFactory`，现在就要创建了，创建`TomcatWebServer`，里面会进行初始化，这里的方法就不多讲了，是关于`tomcat`的一些组件的设置和启动，有兴趣可以自己研究下，我们重点关注`springmvc`这边的。

```java
@Override
	public WebServer getWebServer(ServletContextInitializer... initializers) {
		if (this.disableMBeanRegistry) {
			Registry.disableRegistry();
		}
		Tomcat tomcat = new Tomcat();
		File baseDir = (this.baseDirectory != null) ? this.baseDirectory : createTempDir("tomcat");
		tomcat.setBaseDir(baseDir.getAbsolutePath());
		Connector connector = new Connector(this.protocol);
		connector.setThrowOnFailure(true);
		tomcat.getService().addConnector(connector);
		customizeConnector(connector);
		tomcat.setConnector(connector);
		tomcat.getHost().setAutoDeploy(false);
		configureEngine(tomcat.getEngine());
		for (Connector additionalConnector : this.additionalTomcatConnectors) {
			tomcat.getService().addConnector(additionalConnector);
		}
		prepareContext(tomcat.getHost(), initializers);
		return getTomcatWebServer(tomcat);
	}
	protected TomcatWebServer getTomcatWebServer(Tomcat tomcat) {
		return new TomcatWebServer(tomcat, getPort() >= 0);
	}
	public TomcatWebServer(Tomcat tomcat, boolean autoStart) {
		Assert.notNull(tomcat, "Tomcat Server must not be null");
		this.tomcat = tomcat;
		this.autoStart = autoStart;
		initialize();
	}
```

## ServletWebServerApplicationContext的finishRefresh

完成刷新后，就启动了服务器，并发出`ServletWebServerInitializedEvent`事件：

## DispatcherServlet初始化

## 流程图参考

第一次来请求的时候会进行初始化，调用`initStrategies`方法，其实就是把需要的组件都获取到：

```java
protected void initStrategies(ApplicationContext context) {
		initMultipartResolver(context);//上传文件
		initLocaleResolver(context);//本地化
		initThemeResolver(context);//主题
		initHandlerMappings(context);//映射器
		initHandlerAdapters(context);//处理器适配器
		initHandlerExceptionResolvers(context);//异常处理
		initRequestToViewNameTranslator(context);//视图名转换
		initViewResolvers(context);//视图解析
		initFlashMapManager(context);//重定向保存数据
	}
```

内部其实很多都是一样的形式，我拿两个分析下：

### initMultipartResolver

首先会获取名字为`multipartResolver`的实例，如果不存在就为`null`。

```java
public static final String MULTIPART_RESOLVER_BEAN_NAME = "multipartResolver";
private void initMultipartResolver(ApplicationContext context) {
		try {
			this.multipartResolver = context.getBean(MULTIPART_RESOLVER_BEAN_NAME, MultipartResolver.class);
			if (logger.isTraceEnabled()) {
				logger.trace("Detected " + this.multipartResolver);
			}
			else if (logger.isDebugEnabled()) {
				logger.debug("Detected " + this.multipartResolver.getClass().getSimpleName());
			}
		}
		catch (NoSuchBeanDefinitionException ex) {
			// Default is no multipart resolver.
			this.multipartResolver = null;
			if (logger.isTraceEnabled()) {
				logger.trace("No MultipartResolver '" + MULTIPART_RESOLVER_BEAN_NAME + "' declared");
			}
		}
	}
```

这个自动配置的时候有注册，具体在`MultipartAutoConfiguration`中。

其他的我们下次来分析吧，看起来好像没多少东西，其实就是为了搞明白，初始化做了什么，组件是怎么来的。

好了，今天就到这里了，希望对学习理解有帮助，大神看见勿喷，仅为自己的学习理解，能力有限，请多包涵。
