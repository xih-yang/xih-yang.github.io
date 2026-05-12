# 15、SpringBoot 源码分析 - web环境初始化一
- 来源：https://ddkk.com/zhuanlan/j2ee/springboot/6/15.html
- 分类：J2EE框架
- 分组：教程目录
## 前言

本篇开始介绍`SpringMVC`的相关源码，主要还是`Servlet`相关的，至于`WebFlux`，以后有机会讲，我们将介绍自动配置的初始化做了点什么，`DispatcherServlet`初始化做了什么，一个请求到响应经过了什么，自定义的处理器为什么就能处理请求，参数是怎么传进来的等等，尽可能的包含所有原理，当然这个是在`springboot`基础上的，基本全是注解配置，好了废话不多说，我们先开始吧。

## web环境初始化

首先当然是我们的`web`环境是怎么初始化的，比如为什么会用`tomcat`服务器，还有一些处理器映射器，处理器适配器，视图解析器是怎么初始化的，`DispatcherServlet`是什么时候创建的等等，有个基本的流程图，可以参考下：

### 为什么默认是tomcat服务器

我们前面将了自动配置的原理，最后会过滤出`20`多个自动配置类，然后递归`import`处理他们，这里有个比较关键的配置类`ServletWebServerFactoryAutoConfiguration`，`tomcat`的关键就在于这里。

#### ServletWebServerFactoryAutoConfiguration导入服务器

首先他是满足注解条件的。`@ConditionalOnClass`表示类要都存在才满足条件，有一个不存在就不满足，具体内部他是会用反射去尝试加载条件类，加载不到就是不存在。`@ConditionalOnMissingBean`表示`bean`不存在才满足条件，有一个存在了就不满足。注解条件后面有机会会详细讲下。这里可以看到他会导入`3`个内嵌服务器类，然后一个处理器，这个处理器很关键，后面会说，先看那`3`个内嵌服务器类。

##### EmbeddedTomcat符合条件

可见这个上面的条件都是符合的，因为没报红，其实你也可以找到这些类。

而反观其他两个，其实没有依赖的`jar`包，所以找不到类，不满足条件：

##### BeanPostProcessorsRegistrar处理器

这个是`ImportBeanDefinitionRegistrar`类型的，这个前面都有讲过，在解析配置类的时候直接会被实例化，然后在`bean`定义加载的时候调用`registerBeanDefinitions`方法，我们来看看这个方法做了什么，其实就是注册了两个处理器WebServerFactoryCustomizerBeanPostProcessor和`ErrorPageRegistrarBeanPostProcessor`，这两个处理器很重要，是web环境的处理器，一个做了web服务器的属性配置，一个实例化了`DispatcherServlet`，后面都会说到。

```java
@Override
		public void registerBeanDefinitions(AnnotationMetadata importingClassMetadata,
				BeanDefinitionRegistry registry) {
			if (this.beanFactory == null) {
				return;
			}
			registerSyntheticBeanIfMissing(registry, "webServerFactoryCustomizerBeanPostProcessor",
					WebServerFactoryCustomizerBeanPostProcessor.class);
			registerSyntheticBeanIfMissing(registry, "errorPageRegistrarBeanPostProcessor",
					ErrorPageRegistrarBeanPostProcessor.class);
		}
		private void registerSyntheticBeanIfMissing(BeanDefinitionRegistry registry, String name, Class<?> beanClass) {
			if (ObjectUtils.isEmpty(this.beanFactory.getBeanNamesForType(beanClass, true, false))) {
				RootBeanDefinition beanDefinition = new RootBeanDefinition(beanClass);
				beanDefinition.setSynthetic(true);
				registry.registerBeanDefinition(name, beanDefinition);
			}
		}
```

#### ServletWebServerApplicationContext的createWebServer创建服务器

前面所有`bean`定义加载完，处理器创建完之后，在`onRefresh`方法中会创建`web`服务器。

我们重点关注`getWebServerFactory`方法：

##### ServletWebServerApplicationContext的getWebServerFactory获取服务器工厂

其实就是获取`ServletWebServerFactory`类型的`bean`，而且有且只有一个，否则他就不知道要用哪个初始化啦。其实`ServletWebServerFactory`的实现类就是上面那`3`个服务器的工厂类，默认值有`tomcat`内嵌服务器满足条件。

```java
	protected ServletWebServerFactory getWebServerFactory() {
		// Use bean names so that we don't consider the hierarchy
		String[] beanNames = getBeanFactory().getBeanNamesForType(ServletWebServerFactory.class);
		if (beanNames.length == 0) {
			throw new ApplicationContextException("Unable to start ServletWebServerApplicationContext due to missing "
					+ "ServletWebServerFactory bean.");
		}
		if (beanNames.length > 1) {
			throw new ApplicationContextException("Unable to start ServletWebServerApplicationContext due to multiple "
					+ "ServletWebServerFactory beans : " + StringUtils.arrayToCommaDelimitedString(beanNames));
		}
		return getBeanFactory().getBean(beanNames[0], ServletWebServerFactory.class);
	}
```

我们可以看到实现类：

前面分析了，只有`tomcat`的满足条件，那接下去就会来调用这个工厂方法获取`TomcatServletWebServerFactory`啦，中间涉及到一些处理器处理，我们后面说：

好了，今天就到这里了，希望对学习理解有帮助，大神看见勿喷，仅为自己的学习理解，能力有限，请多包涵。
