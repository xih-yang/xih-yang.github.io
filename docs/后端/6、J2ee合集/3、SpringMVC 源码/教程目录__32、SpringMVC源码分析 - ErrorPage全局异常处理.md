# 32、SpringMVC源码分析 - ErrorPage全局异常处理
- 来源：https://ddkk.com/zhuanlan/j2ee/springmvc/7/32.html
- 分类：J2EE框架
- 分组：教程目录
## 前言

@ControllerAdvice 全局异常处理 和 自定义HandlerExceptionResolver 解析异常，这两种方式只能处理在处理请求请求到达了 DispatcherServlet ，并且出现了异常后进入processDispatchResult( ) 方法。

这两种方式不适用的场景：

**1、** 请求没有到达DispatcherServlet的核心流程，如在filter中抛出异常；

**2、** 请求进入processDispatchResult()方法处理异常，但是在处理过程中有抛出了异常，如在@ControllerAdvice方法中抛出了异常；

这个时候请求会进入到 ErrorPage 的处理流程。

## 一、ErrorPage初始化

**1、** ErrorPageCustomizer；

实现了ErrorPageRegistrar 接口，重写了registerErrorPages( ) 方法，用于注册 ErrorPage

1、ErrorPageCustomizer 的定义

```java
static class ErrorPageCustomizer implements ErrorPageRegistrar, Ordered {
		private final ServerProperties properties;
		private final DispatcherServletPath dispatcherServletPath;
		protected ErrorPageCustomizer(ServerProperties properties, DispatcherServletPath dispatcherServletPath) {
			this.properties = properties;
			this.dispatcherServletPath = dispatcherServletPath;
		}
		@Override
		public void registerErrorPages(ErrorPageRegistry errorPageRegistry) {
			//注册错误页面，默认Path 是 /error
			ErrorPage errorPage = new ErrorPage(
					this.dispatcherServletPath.getRelativePath(this.properties.getError().getPath()));
			errorPageRegistry.addErrorPages(errorPage);
		}
		@Override
		public int getOrder() {
			return 0;
		}
	}
```

2、、默认错误路径

```java
public class ErrorProperties {
	/**
	 * Path of the error controller.
	 */
	@Value("${error.path:/error}")
	private String path = "/error";
```

3、、创建 ErrorPageCustomizer

```java
ErrorMvcAutoConfiguration.java
	@Bean
	public ErrorPageCustomizer errorPageCustomizer(DispatcherServletPath dispatcherServletPath) {
		return new ErrorPageCustomizer(this.serverProperties, dispatcherServletPath);
	}
```

**2、** ErrorPageRegistrarBeanPostProcessor；

ErrorPageRegistrar 的后置处理器，注册错误页面到web容器

```java
public class ErrorPageRegistrarBeanPostProcessor implements BeanPostProcessor, BeanFactoryAware {
	private ListableBeanFactory beanFactory;
	private List<ErrorPageRegistrar> registrars;
	@Override
	public void setBeanFactory(BeanFactory beanFactory) {
		Assert.isInstanceOf(ListableBeanFactory.class, beanFactory,
				"ErrorPageRegistrarBeanPostProcessor can only be used with a ListableBeanFactory");
		this.beanFactory = (ListableBeanFactory) beanFactory;
	}
	@Override
	public Object postProcessBeforeInitialization(Object bean, String beanName) throws BeansException {
		if (bean instanceof ErrorPageRegistry) {
			//bean是 ErrorPageRegistry 类型
			postProcessBeforeInitialization((ErrorPageRegistry) bean);
		}
		return bean;
	}
	@Override
	public Object postProcessAfterInitialization(Object bean, String beanName) throws BeansException {
		return bean;
	}
	private void postProcessBeforeInitialization(ErrorPageRegistry registry) {
		//调用 ErrorPageRegistrar 的 registerErrorPages() 注册错误页面
		for (ErrorPageRegistrar registrar : getRegistrars()) {
			registrar.registerErrorPages(registry);
		}
	}
	//从beanFactory中获取 ErrorPageRegistrar.class 类型的类，通过 order 排序
	private Collection<ErrorPageRegistrar> getRegistrars() {
		if (this.registrars == null) {
			// Look up does not include the parent context
			this.registrars = new ArrayList<>(
					this.beanFactory.getBeansOfType(ErrorPageRegistrar.class, false, false).values());
			this.registrars.sort(AnnotationAwareOrderComparator.INSTANCE);
			this.registrars = Collections.unmodifiableList(this.registrars);
		}
		return this.registrars;
	}
}
```

ErrorPage 被添加到了 web容器中

```java
AbstractConfigurableWebServerFactory.java
public void addErrorPages(ErrorPage... errorPages) {
		Assert.notNull(errorPages, "ErrorPages must not be null");
		this.errorPages.addAll(Arrays.asList(errorPages));
	}
```

**3、** 将ErrorPage添加到DeploymentInfo中；

我这里使用的容器是 Undertow 服务，在创建服务的过程中

refresh( ) -> onRefresh( ) -> createWebServer( ) -> getWebServer( ) -> createManager( ) -> configureErrorPages( )

```java
	private void configureErrorPages(DeploymentInfo servletBuilder) {
		//获取到刚才注册的 ErrorPage 
		for (ErrorPage errorPage : getErrorPages()) {
			servletBuilder.addErrorPage(getUndertowErrorPage(errorPage));
		}
	}
```

封装成undertow api 的 ErrorPage

```java
private io.undertow.servlet.api.ErrorPage getUndertowErrorPage(ErrorPage errorPage) {
		if (errorPage.getStatus() != null) {
			return new io.undertow.servlet.api.ErrorPage(errorPage.getPath(), errorPage.getStatusCode());
		}
		if (errorPage.getException() != null) {
			return new io.undertow.servlet.api.ErrorPage(errorPage.getPath(), errorPage.getException());
		}
		return new io.undertow.servlet.api.ErrorPage(errorPage.getPath());
	}
```

添加到DeploymentInfo 缓存起来

```java
DeploymentInfo .java
public DeploymentInfo addErrorPage(final ErrorPage errorPage) {
        this.errorPages.add(errorPage);
        return this;
    }
```

**4、** ；

configureErrorPages( )执行后， ->manager.deploy(); -> initializeErrorPages(deployment, deploymentInfo);

1、initializeErrorPages()

```java
private void initializeErrorPages(final DeploymentImpl deployment, final DeploymentInfo deploymentInfo) {
        final Map<Integer, String> codes = new HashMap<>();
        final Map<Class<? extends Throwable>, String> exceptions = new HashMap<>();
        String defaultErrorPage = null;
        for (final ErrorPage page : deploymentInfo.getErrorPages()) {
            if (page.getExceptionType() != null) {
            	//exceptions 保存异常类型和路径的映射
                exceptions.put(page.getExceptionType(), page.getLocation());
            } else if (page.getErrorCode() != null) {
            	//codes 保存异常状态码和路径的映射
                codes.put(page.getErrorCode(), page.getLocation());
            } else {
            	//默认异常路径只能有一个
                if (defaultErrorPage != null) {
                    throw UndertowServletMessages.MESSAGES.moreThanOneDefaultErrorPage(defaultErrorPage, page.getLocation());
                } else {
                    defaultErrorPage = page.getLocation();
                }
            }
        }
        deployment.setErrorPages(new ErrorPages(codes, exceptions, defaultErrorPage));
    }
```

**5、** BasicErrorController；

请求出现错误时，且没有被其他的全局异常处理拦截到，会将请求流转到ErrorController 中的 /error 和 /errorHtml 接口

```java
@Controller
@RequestMapping("${server.error.path:${error.path:/error}}")
public class BasicErrorController extends AbstractErrorController {
public BasicErrorController(ErrorAttributes errorAttributes, ErrorProperties errorProperties,
			List<ErrorViewResolver> errorViewResolvers) {
		super(errorAttributes, errorViewResolvers);
		Assert.notNull(errorProperties, "ErrorProperties must not be null");
		this.errorProperties = errorProperties;
	}
@RequestMapping(produces = MediaType.TEXT_HTML_VALUE)
	public ModelAndView errorHtml(HttpServletRequest request, HttpServletResponse response) {
		HttpStatus status = getStatus(request);
		Map<String, Object> model = Collections
				.unmodifiableMap(getErrorAttributes(request, getErrorAttributeOptions(request, MediaType.TEXT_HTML)));
		response.setStatus(status.value());
		ModelAndView modelAndView = resolveErrorView(request, response, status, model);
		return (modelAndView != null) ? modelAndView : new ModelAndView("error", model);
	}
	@RequestMapping
	public ResponseEntity<Map<String, Object>> error(HttpServletRequest request) {
		HttpStatus status = getStatus(request);
		if (status == HttpStatus.NO_CONTENT) {
			return new ResponseEntity<>(status);
		}
		Map<String, Object> body = getErrorAttributes(request, getErrorAttributeOptions(request, MediaType.ALL));
		return new ResponseEntity<>(body, status);
	}
```

## 二、ErrorPage处理流程

当请求出现错误时，错误被抛给Undertow时，错误会被Undertow拦截到，下面从Undertow拦截到错误开始分析

**1、** handleFirstRequest()；

```java
		try {
            ...
            }
        } catch (Throwable t) {
            servletRequestContext.setRunningInsideHandler(false);
            AsyncContextImpl asyncContextInternal = servletRequestContext.getOriginalRequest().getAsyncContextInternal();
            if(asyncContextInternal != null && asyncContextInternal.isCompletedBeforeInitialRequestDone()) {
                asyncContextInternal.handleCompletedBeforeInitialRequestDone();
            }
            if(asyncContextInternal != null) {
                asyncContextInternal.initialRequestFailed();
            }
            //by default this will just log the exception
            boolean handled = exceptionHandler.handleThrowable(exchange, request, response, t);
            if(handled) {
                exchange.endExchange();
            } else if (request.isAsyncStarted() || request.getDispatcherType() == DispatcherType.ASYNC) {
            	//异步请求
                exchange.unDispatch();
                servletRequestContext.getOriginalRequest().getAsyncContextInternal().handleError(t);
            } else {
                if (!exchange.isResponseStarted()) {
                	//重置 response
                    response.reset();                       //reset the response
                    exchange.setStatusCode(StatusCodes.INTERNAL_SERVER_ERROR);
                    //清理了响应头，这里很重要，缺少了响应头，可能会引起一些其他的错误
                    exchange.getResponseHeaders().clear();
                    //获取新的请求错误路径
                    String location = servletContext.getDeployment().getErrorPages().getErrorLocation(t);
                    if (location == null) {
                        location = servletContext.getDeployment().getErrorPages().getErrorLocation(StatusCodes.INTERNAL_SERVER_ERROR);
                    }
                    if (location != null) {
                        RequestDispatcherImpl dispatcher = new RequestDispatcherImpl(location, servletContext);
                        try {
                        	//将请求分发到错误路径上，也就是访问默认异常控制器 BasicErrorController 
                            dispatcher.error(servletRequestContext, request, response, servletRequestContext.getOriginalServletPathMatch().getServletChain().getManagedServlet().getServletInfo().getName(), t);
                        } catch (Exception e) {
                            UndertowLogger.REQUEST_LOGGER.exceptionGeneratingErrorPage(e, location);
                        }
                    } else {
                        if (servletRequestContext.displayStackTraces()) {
                            ServletDebugPageHandler.handleRequest(exchange, servletRequestContext, t);
                        } else {
                            servletRequestContext.getOriginalResponse().doErrorDispatch(StatusCodes.INTERNAL_SERVER_ERROR, StatusCodes.INTERNAL_SERVER_ERROR_STRING);
                        }
                    }
                }
            }
        } finally {
            ...
        }
```

**2、** getErrorLocation()；

优先根据异常类型查找路径，不存在时再根据状态码查找路径，都不存在时使用默认路径

```java
public String getErrorLocation(final Throwable exception) {
        if (exception == null) {
            return null;
        }
        //todo: this is kinda slow, but there is probably not a great deal that can be done about it
        String location = null;
        for (Class c = exception.getClass(); c != null && location == null; c = c.getSuperclass()) {
            location = exceptionMappings.get(c);
        }
        if (location == null && exception instanceof ServletException) {
            Throwable rootCause = ((ServletException) exception).getRootCause();
            //Iterate through any nested JasperException in case it is in JSP development mode
            while (rootCause != null && rootCause instanceof ServletException && location == null) {
                for (Class c = rootCause.getClass(); c != null && location == null; c = c.getSuperclass()) {
                    location = exceptionMappings.get(c);
                }
                rootCause = ((ServletException) rootCause).getRootCause();
            }
            if (rootCause != null && location == null) {
                for (Class c = rootCause.getClass(); c != null && location == null; c = c.getSuperclass()) {
                    location = exceptionMappings.get(c);
                }
            }
        }
        if (location == null) {
            location = getErrorLocation(StatusCodes.INTERNAL_SERVER_ERROR);
        }
        return location;
    }
```

## 三、自定义ErrorPage

**1、** 自定义GlobalErrorPageRegistrar；

可以通过状态码或者具体的异常类型对应要访问的路径

```java
@Configuration
@Slf4j
public class GlobalErrorPageRegistrar implements ErrorPageRegistrar {
    @Override
    public void registerErrorPages(ErrorPageRegistry registry) {
        //状态码和路径映射
        registry.addErrorPages(
                new ErrorPage(HttpStatus.BAD_REQUEST, "/400"),
                new ErrorPage(HttpStatus.NOT_FOUND, "/404"),
                new ErrorPage(HttpStatus.INTERNAL_SERVER_ERROR, "/500")
        );
        //异常类型和路径映射
        registry.addErrorPages(
                new ErrorPage(IllegalArgumentException.class, "/400"),
                new ErrorPage(HttpTimeoutException.class, "/408")
        );
    }
}
```

**2、** ErrorPageController；

配置错误的请求对应的方法

```java
@RestController
public class ErrorPageController {
    @RequestMapping(value = "/400", produces = {
     MediaType.APPLICATION_JSON_VALUE})
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ResponseEntity to400() {
        return new ResponseEntity(400, "请求有误");
    }
    @RequestMapping(value = "/404", produces = {
     MediaType.APPLICATION_JSON_VALUE})
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public ResponseEntity to404() {
        return new ResponseEntity(404, "找不到资源");
    }
    @RequestMapping(value = "/408", produces = {
     MediaType.APPLICATION_JSON_VALUE})
    @ResponseStatus(HttpStatus.REQUEST_TIMEOUT)
    public ResponseEntity to408() {
        return new ResponseEntity(408, "请求超时");
    }
    @RequestMapping(value = "/500", produces = {
     MediaType.APPLICATION_JSON_VALUE})
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    public ResponseEntity to500() {
        return new ResponseEntity(500, "服务器错误");
    }
}
```
