# 20、SpringBoot 源码分析 - DispatcherServlet初始化二
- 来源：https://ddkk.com/zhuanlan/j2ee/springboot/6/20.html
- 分类：J2EE框架
- 分组：教程目录
## 基本流程图，方便查看

## initThemeResolver

这个跟前面讲`initLocaleResolver`一样，最后获取默认的。

## initHandlerMappings

这个获取处理器映射器就不一样啦，因为可能有多个，首先去容器里取`HandlerMapping`类型的多个实例，这个是取的到的，因为自动配置中配置了一些，如果没取到才会去找默认的：

```java
public static final String HANDLER_MAPPING_BEAN_NAME = "handlerMapping";
private void initHandlerMappings(ApplicationContext context) {
		this.handlerMappings = null;
		if (this.detectAllHandlerMappings) {
     //可以找多个
			// Find all HandlerMappings in the ApplicationContext, including ancestor contexts.
			Map<String, HandlerMapping> matchingBeans =
					BeanFactoryUtils.beansOfTypeIncludingAncestors(context, HandlerMapping.class, true, false);
			if (!matchingBeans.isEmpty()) {
				this.handlerMappings = new ArrayList<>(matchingBeans.values());
				// We keep HandlerMappings in sorted order.
				AnnotationAwareOrderComparator.sort(this.handlerMappings);
			}
		}
		else {
     //只能找一个
			try {
				HandlerMapping hm = context.getBean(HANDLER_MAPPING_BEAN_NAME, HandlerMapping.class);
				this.handlerMappings = Collections.singletonList(hm);
			}
			catch (NoSuchBeanDefinitionException ex) {
				// Ignore, we'll add a default HandlerMapping later.
			}
		}
		// Ensure we have at least one HandlerMapping, by registering
		// a default HandlerMapping if no other mappings are found.
		if (this.handlerMappings == null) {
			this.handlerMappings = getDefaultStrategies(context, HandlerMapping.class);
			if (logger.isTraceEnabled()) {
				logger.trace("No HandlerMappings declared for servlet '" + getServletName() +
						"': using default strategies from DispatcherServlet.properties");
			}
		}
	}
```

最后拿到了`5`个：

### 都是哪来的

我们看看这些是怎么来的，其实都是自动配置里的`EnableWebMvcConfiguration`中的。

`WebMvcAutoConfiguration`的`EnableWebMvcConfiguration`中`RequestMappingHandlerMapping`：

`WebMvcAutoConfiguration`的`EnableWebMvcConfiguration`中`WelcomePageHandlerMapping`：

`WebMvcAutoConfiguration`的`EnableWebMvcConfiguration`的父类`WebMvcConfigurationSupport`中`BeanNameUrlHandlerMapping`：

`WebMvcAutoConfiguration`的`EnableWebMvcConfiguration`的父类`WebMvcConfigurationSupport`中`RouterFunctionMapping`：

`WebMvcAutoConfiguration`的`EnableWebMvcConfiguration`的父类`WebMvcConfigurationSupport`中`SimpleUrlHandlerMapping`：

好了，今天就到这里了，希望对学习理解有帮助，大神看见勿喷，仅为自己的学习理解，能力有限，请多包涵。
