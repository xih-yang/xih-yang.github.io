# 43、SpringBoot 源码分析 - SpringMVC源码之BeanNameUrlHandlerMapping处理器
- 来源：https://ddkk.com/zhuanlan/j2ee/springboot/6/43.html
- 分类：J2EE框架
- 分组：教程目录
## BeanNameUrlHandlerMapping是什么

其实这个就是在用`bean`注解方法的时候填写的名字作为uri和`bean`处理器映射。先看例子，比如我定义了两种老的写法的处理器：

然后我在配置文件中注入他们，都命名了：

然后访问：

好像也挺方便哦，但是都要实现接口，而且方法参数是死的，无法做到直接获取需要的参数值，而`ResourceHttpRequestHandler`更强大，他可以任意传参数，只要能匹配的上都可以匹配，等于定制化，灵活，你可以实现任何你想要的参数类型，只要你编写解析器。我们来说说原理吧。

## BeanNameUrlHandlerMapping初始化

他也是`EnableWebMvcConfiguration`创建的：

### AbstractDetectingUrlHandlerMapping的detectHandlers

但是在`ApplicationContextAwareProcessor`的初始化之前的方法`postProcessBeforeInitialization`中，最后进行了处理器探测`detectHandlers`：

```java
protected void detectHandlers() throws BeansException {
		ApplicationContext applicationContext = obtainApplicationContext();
		String[] beanNames = (this.detectHandlersInAncestorContexts ?
				BeanFactoryUtils.beanNamesForTypeIncludingAncestors(applicationContext, Object.class) :
				applicationContext.getBeanNamesForType(Object.class));
		// 遍历所有容器里的beanName，找出beanName有uri的注册进去
		for (String beanName : beanNames) {
			String[] urls = determineUrlsForHandler(beanName);
			if (!ObjectUtils.isEmpty(urls)) {
				// URL paths found: Let's consider it a handler.
				registerHandler(urls, beanName);
			}
		}
		if ((logger.isDebugEnabled() && !getHandlerMap().isEmpty()) || logger.isTraceEnabled()) {
			logger.debug("Detected " + getHandlerMap().size() + " mappings in " + formatMappingName());
		}
	}
```

#### BeanNameUrlHandlerMapping的determineUrlsForHandler

名字或者别名以`/`开头的都放入`url`集合里。

```java
@Override
	protected String[] determineUrlsForHandler(String beanName) {
		List<String> urls = new ArrayList<>();
		if (beanName.startsWith("/")) {
			urls.add(beanName);
		}
		String[] aliases = obtainApplicationContext().getAliases(beanName);
		for (String alias : aliases) {
			if (alias.startsWith("/")) {
				urls.add(alias);
			}
		}
		return StringUtils.toStringArray(urls);
	}
```

#### AbstractUrlHandlerMapping的registerHandler注册处理器

```java
	protected void registerHandler(String[] urlPaths, String beanName) throws BeansException, IllegalStateException {
		Assert.notNull(urlPaths, "URL path array must not be null");
		for (String urlPath : urlPaths) {
			registerHandler(urlPath, beanName);
		}
	}
```

首先看不是懒初始化的单例且处理器只是个名字的话就直接实例化，然后判断重复，根据url的不同，设置不同的处理器，一般的就是放入`url`和处理器的映射集合。

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
				resolvedHandler = applicationContext.getBean(handlerName);
			}
		}
		Object mappedHandler = this.handlerMap.get(urlPath);
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
				setRootHandler(resolvedHandler);
			}
			else if (urlPath.equals("/*")) {
				if (logger.isTraceEnabled()) {
					logger.trace("Default mapping to " + getHandlerDescription(handler));
				}
				setDefaultHandler(resolvedHandler);
			}
			else {
				this.handlerMap.put(urlPath, resolvedHandler);
				if (logger.isTraceEnabled()) {
					logger.trace("Mapped [" + urlPath + "] onto " + getHandlerDescription(handler));
				}
			}
		}
	}
```

#### 处理原理

至于他的处理原理，还是获取处理器的方法`lookupHandler`，其实他和`SimpleUrlHandlerMapping`一样，都是`AbstractDetectingUrlHandlerMapping`的子类，所以实现是一样的，都是`AbstractDetectingUrlHandlerMapping`实现的，这个上几篇有讲过了，就不多说了。

好了，今天就到这里了，希望对学习理解有帮助，大神看见勿喷，仅为自己的学习理解，能力有限，请多包涵。
