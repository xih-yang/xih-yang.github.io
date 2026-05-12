# 17、SpringBoot 源码分析 - web环境初始化三
- 来源：https://ddkk.com/zhuanlan/j2ee/springboot/6/17.html
- 分类：J2EE框架
- 分组：教程目录
## 基本流程图，方法查看

## WebServerFactoryCustomizer定制化

### TomcatWebSocketServletWebServerCustomizer的customize

其实就是给上下文添加了一个`WsContextListener`监听器，这个跟`WebSocket`相关，我们暂时不讲，这样就添加了一个`TomcatContextCustomizer`，虽然是个`lambda`表达式，到时候调用就可以啦。

```java
	@Override
	public void customize(TomcatServletWebServerFactory factory) {
		factory.addContextCustomizers((context) -> context.addApplicationListener(WsContextListener.class.getName()));
	}
```

### ServletWebServerFactoryCustomizer的customize

用`PropertyMapper`把`ServerProperties`一些通用属性传递给`tomcat`工厂。

### TomcatServletWebServerFactoryCustomizer的customize

这个先获取`ServerProperties`中的`tomcat`的`Servlet`相关属性，然后设置到相关`tomcat`工厂属性里。

### TomcatWebServerFactoryCustomizer的customize

用`PropertyMapper`把`ServerProperties`的`tomcat`的属性传递给`tomcat`工厂。

### LocaleCharsetMappingsCustomizer的customize

设置`tomcat`工厂的编码映射。

## ErrorPageRegistrarBeanPostProcessor的处理

这个也得处理`tomcat`工厂：

### getRegistrars获取注册器

从容器里获取`ErrorPageRegistrar`类型的`bean`，其实就是`ErrorPageCustomizer`，是`ErrorMvcAutoConfiguration`配置类提供的：

```java
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
```

### 依赖加载DispatcherServletPath

这个工厂方法是有依赖属性`DispatcherServletPath`，实现类就是`DispatcherServletRegistrationBean`

### DispatcherServletRegistrationBean的依赖

在`DispatcherServletAutoConfiguration`中，也有`DispatcherServletRegistrationBean`工厂方法，关键的是他的依赖是`DispatcherServlet`，所以还会去实例化`DispatcherServlet`：

### 实例化DispatcherServlet

最后就到`DispatcherServletAutoConfiguration`的`DispatcherServletAutoConfiguration`的`dispatcherServlet`方法：

### ErrorPageCustomizer的registerErrorPages注册错误页面

前面为了实例化`ErrorPageCustomizer`，实例化了`DispatcherServlet`，这里会创建一个`ErrorPage` ，放入`tomcat`工厂中。

```java
		@Override
		public void registerErrorPages(ErrorPageRegistry errorPageRegistry) {
			ErrorPage errorPage = new ErrorPage(
					this.dispatcherServletPath.getRelativePath(this.properties.getError().getPath()));
			errorPageRegistry.addErrorPages(errorPage);
		}
```

其实`uri`就是`/error`，就是我们看到报错的时候会显示的那个页面。

至此`ServletWebServerFactory`获取好了，是我们的`TomcatServletWebServerFactory`。接下来看怎么创建`tomcat`。

好了，今天就到这里了，希望对学习理解有帮助，大神看见勿喷，仅为自己的学习理解，能力有限，请多包涵。
