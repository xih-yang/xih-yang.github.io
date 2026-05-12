# 09、SpringMVC源码分析 - BeanNameUrlHandlerMapping
- 来源：https://ddkk.com/zhuanlan/j2ee/springmvc/7/9.html
- 分类：J2EE框架
- 分组：教程目录
## 前言

BeanNameUrlHandlerMapping处理容器中以/开头的bean

## 一、初始化

BeanNameUrlHandlerMapping间接继承了ApplicationContextAware，因此创建bean的过程中会回调

initApplicationContext( )

1、initApplicationContext( )

```java
public void initApplicationContext() throws ApplicationContextException {
		super.initApplicationContext();
		//找/开头的handler
		detectHandlers();
	}
```

2、detectHandlers()

```java
protected void detectHandlers() throws BeansException {
		//获取ApplicationContext 
		ApplicationContext applicationContext = obtainApplicationContext();
		//获取容器中所有的beanNames 
		String[] beanNames = (this.detectHandlersInAncestorContexts ?
				BeanFactoryUtils.beanNamesForTypeIncludingAncestors(applicationContext, Object.class) :
				applicationContext.getBeanNamesForType(Object.class));
		// Take any bean name that we can determine URLs for.
		for (String beanName : beanNames) {
			//找/开头的url或alials
			String[] urls = determineUrlsForHandler(beanName);
			if (!ObjectUtils.isEmpty(urls)) {
				// URL paths found: Let's consider it a handler.
				//注册到缓存中
				registerHandler(urls, beanName);
			}
		}
		if (mappingsLogger.isDebugEnabled()) {
			mappingsLogger.debug(formatMappingName() + " " + getHandlerMap());
		}
		else if ((logger.isDebugEnabled() && !getHandlerMap().isEmpty()) || logger.isTraceEnabled()) {
			logger.debug("Detected " + getHandlerMap().size() + " mappings in " + formatMappingName());
		}
	}
```

3、determineUrlsForHandler( )

```java
protected String[] determineUrlsForHandler(String beanName) {
		List<String> urls = new ArrayList<>();
		if (beanName.startsWith("/")) {
			//beanName以/开头
			urls.add(beanName);
		}
		String[] aliases = obtainApplicationContext().getAliases(beanName);
		for (String alias : aliases) {
			if (alias.startsWith("/")) {
				//别名以/开头
				urls.add(alias);
			}
		}
		return StringUtils.toStringArray(urls);
	}
```

4、registerHandler( )

```java
protected void registerHandler(String[] urlPaths, String beanName) throws BeansException, IllegalStateException {
		Assert.notNull(urlPaths, "URL path array must not be null");
		for (String urlPath : urlPaths) {
			registerHandler(urlPath, beanName);
		}
	}
```

```java
protected void registerHandler(String urlPath, Object handler) throws BeansException, IllegalStateException {
		Assert.notNull(urlPath, "URL path must not be null");
		Assert.notNull(handler, "Handler object must not be null");
		Object resolvedHandler = handler;
		// Eagerly resolve handler if referencing singleton via name.
		if (!this.lazyInitHandlers && handler instanceof String) {
			String handlerName = (String) handler;
			ApplicationContext applicationContext = obtainApplicationContext();
			if (applicationContext.isSingleton(handlerName)) {
				//初始化bean
				resolvedHandler = applicationContext.getBean(handlerName);
			}
		}
		Object mappedHandler = this.handlerMap.get(urlPath);
		//校验是否已经存在
		if (mappedHandler != null) {
			if (mappedHandler != resolvedHandler) {
				throw new IllegalStateException(
						"Cannot map " + getHandlerDescription(handler) + " to URL path [" + urlPath +
						"]: There is already " + getHandlerDescription(mappedHandler) + " mapped.");
			}
		}
		else {
			if (urlPath.equals("/")) {
				if (logger.isTraceEnabled()) {
					logger.trace("Root mapping to " + getHandlerDescription(handler));
				}
				//根请求处理器
				setRootHandler(resolvedHandler);
			}
			else if (urlPath.equals("/*")) {
				if (logger.isTraceEnabled()) {
					logger.trace("Default mapping to " + getHandlerDescription(handler));
				}
				//默认请求处理器
				setDefaultHandler(resolvedHandler);
			}
			else {
				//存入缓存
				this.handlerMap.put(urlPath, resolvedHandler);
				if (getPatternParser() != null) {
					this.pathPatternHandlerMap.put(getPatternParser().parse(urlPath), resolvedHandler);
				}
				if (logger.isTraceEnabled()) {
					logger.trace("Mapped [" + urlPath + "] onto " + getHandlerDescription(handler));
				}
			}
		}
	}
```

## 二、使用

创建controller，继承springmvc的AbstractController ，重写handleRequestInternal( )方法，

当请求访问/beanName路径时，会回调handleRequestInternal( )

```java
@Controller("/beanName")
public class BeanNameUrlController extends AbstractController {
    @Override
    protected ModelAndView handleRequestInternal(HttpServletRequest request, HttpServletResponse response) throws Exception {
        System.out.println("BeanNameUrlController");
        return null;
    }
}
```
