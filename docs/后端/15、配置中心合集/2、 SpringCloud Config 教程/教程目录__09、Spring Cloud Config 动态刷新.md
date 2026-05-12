# 09、Spring Cloud Config 动态刷新
- 来源：https://ddkk.com/zhuanlan/config/springcloudconfig/9.html
- 分类：配置中心
- 分组：教程目录
## 概述

Spring Cloud 默认实现了配置中心动态刷新的功能，在公共模块 spring-cloud-context 包中。目前比较流行的配置中心 Spring Cloud Config 动态刷新便是依赖此模块，而Nacos动态刷新机制是在此模块上做了扩展，比Spring Cloud Config功能更强大丰富。

首先Spring Cloud Config 动态刷新需要依赖 Spring Cloud Bus，而 Nacos 则是在后台修改后直接推送到各服务。

其次，Spring Cloud Config的刷新机制针对所有修改的变量，只有有改动，后台就会获取。而Nacos则是支持粒度更细的方式，只有 refresh 属性为 true 的配置项，才会在运行的过程中变更为新的值。这时Nacos特有的方式。

相同点：两种配置中心动态刷新的范围都是以下两种：

- @ConfigurationProperties 注解的配置类
- @RefreshScope 注解的bean

大致的核心流程如下：

分别看一下这两点的实现原理。

> 首先 spring cloud config 动态刷新功能通过以下变量来确定是否开启，默认为true。
>
> @ConditionalOnProperty(value = “endpoints.refresh.enabled”, matchIfMissing = true)

## RefreshEndpoint 端点暴露方式：

```java
public class LifecycleMvcEndpointAutoConfiguration {
	@Bean
	@ConditionalOnBean(RefreshEndpoint.class)
	public MvcEndpoint refreshMvcEndpoint(RefreshEndpoint endpoint) {
		return new GenericPostableMvcEndpoint(endpoint);
	}
}	
// Mvc适配器
public class GenericPostableMvcEndpoint extends EndpointMvcAdapter {
	//代理类为RefreshEndpoint 
	public GenericPostableMvcEndpoint(Endpoint<?> delegate) {
		super(delegate);
	}
	@RequestMapping(method = RequestMethod.POST)
	@ResponseBody
	@Override
	public Object invoke() {
		if (!getDelegate().isEnabled()) {
			return new ResponseEntity<>(Collections.singletonMap(
					"message", "This endpoint is disabled"), HttpStatus.NOT_FOUND);
		}
		return super.invoke();
	}
}
```

这里的实现方式同 springboot actuator endpoint原理一样，都是通过 EndpointMvcAdapter 适配器来代理实现。

## RefreshEndpoint 端点：

```java
public class RefreshEndpoint extends AbstractEndpoint<Collection<String>> {
	private ContextRefresher contextRefresher;
	public String[] refresh() {
		Set<String> keys = contextRefresher.refresh();
		return keys.toArray(new String[keys.size()]);
	}
	@Override
	public Collection<String> invoke() {
		return Arrays.asList(refresh());
	}
}
```

具体的刷新逻辑在 ContextRefresher 中。

配置ContextRefresher 刷新类：

```java
public class ContextRefresher {
	//......
	private ConfigurableApplicationContext context;
	private RefreshScope scope;
	public synchronized Set<String> refresh() {
		//提取之前的属性配置
		Map<String, Object> before = extract(
				this.context.getEnvironment().getPropertySources());
		//获取最新的属性配置
		addConfigFilesToEnvironment();
		//获取发生变化的属性
		Set<String> keys = changes(before,
				extract(this.context.getEnvironment().getPropertySources())).keySet();
		//发布EnvironmentChangeEvent事件
		this.context.publishEvent(new EnvironmentChangeEvent(keys));
		//刷新 RefreshScope Bean
		this.scope.refreshAll();
		return keys;
	}
	//......
}
```

`addConfigFilesToEnvironment();`上述代码通过该方法重新获取配置：

```java
private void addConfigFilesToEnvironment() {
    ConfigurableApplicationContext capture = null;
    try {
        StandardEnvironment environment = copyEnvironment(
                this.context.getEnvironment());
        //这里重新创建 springboot启动类，重新启动时，通过配置中心会就会重新获取配置了
        capture = new SpringApplicationBuilder(Empty.class).bannerMode(Mode.OFF)
                .web(false).environment(environment).run();
        if (environment.getPropertySources().contains(REFRESH_ARGS_PROPERTY_SOURCE)) {
            environment.getPropertySources().remove(REFRESH_ARGS_PROPERTY_SOURCE);
        }
        MutablePropertySources target = this.context.getEnvironment()
                .getPropertySources();
        String targetName = null;
    }
}
```

通过`SpringApplicationBuilder`重新创建启动类，启动时就会重新拉取最新配置，然后发布 `EnvironmentChangeEvent`事件，通过对应的监听器重新加载带有@ConfigurationProperties 的配置类和作用域为 `@RefreshScope` 的bean。

## @ConfigurationProperties

默认有两个监听器会监听到 `EnvironmentChangeEvent` 事件：

- ConfigurationPropertiesRebinder
- LoggingRebinder

> LoggingRebinder只是设置日志级别，这里不做展开。

来看一下`ConfigurationPropertiesRebinder`：

```java
public class ConfigurationPropertiesRebinder
		implements ApplicationContextAware, ApplicationListener<EnvironmentChangeEvent> {
	//用来收集所有@ConfigurationProperties 注解的bean
	private ConfigurationPropertiesBeans beans;
	private ConfigurationPropertiesBindingPostProcessor binder;
	public ConfigurationPropertiesRebinder(
			ConfigurationPropertiesBindingPostProcessor binder,
			ConfigurationPropertiesBeans beans) {
		this.binder = binder;
		this.beans = beans;
	}
	@ManagedOperation
	public void rebind() {
		this.errors.clear();
		for (String name : this.beans.getBeanNames()) {
			rebind(name);
		}
	}
	@ManagedOperation
	public boolean rebind(String name) {
		if (!this.beans.getBeanNames().contains(name)) {
			return false;
		}
		if (this.applicationContext != null) {
			try {
				//	获取当前bean
				Object bean = this.applicationContext.getBean(name);
				// 重新绑定对应属性
				this.binder.postProcessBeforeInitialization(bean, name);
				// 重新执行bean初始化流程
				this.applicationContext.getAutowireCapableBeanFactory()
						.initializeBean(bean, name);
				return true;
			}
			catch (RuntimeException e) {
				this.errors.put(name, e);
				throw e;
			}
		}
		return false;
	}
	//触发监听器
	@Override
	public void onApplicationEvent(EnvironmentChangeEvent event) {
		rebind();
	}
}
```

上述代码即为属性配置类重写加载的过程。

另外，`ConfigurationPropertiesBeans`肯定是提前收集好所有`@ConfigurationProperties`注解的bean，来看一下收集方式：

```java
public class ConfigurationPropertiesBeans implements BeanPostProcessor,
ApplicationContextAware {
	private Map<String, Object> beans = new HashMap<String, Object>();
	private String refreshScope;
	@Override
	public Object postProcessBeforeInitialization(Object bean, String beanName)
			throws BeansException {
		if (isRefreshScoped(beanName)) {
			return bean;
		}
		ConfigurationProperties annotation = AnnotationUtils.findAnnotation(
				bean.getClass(), ConfigurationProperties.class);
		if (annotation != null) {
			this.beans.put(beanName, bean);
		}
		else if (this.metaData != null) {
			annotation = this.metaData.findFactoryAnnotation(beanName,
					ConfigurationProperties.class);
			if (annotation != null) {
				this.beans.put(beanName, bean);
			}
		}
		return bean;
	}
}
```

通过`BeanPostProcessor`扩展接口，然后排除掉`refreshScope`类型的bean，然后收集对应的属性配置bean。

## @RefreshScope

该注解是 Spring Cloud 对bean 作用域做的扩展类型，这种类型的bean生命周期和单例不同，从当前使用该，每一次调用调用`/refresh`方法都会清除所有该类型的bean。下次使用时，就会重新创建，然后注入最新属性变量。

具体来看一下代码。

```java
public class RefreshScope extends GenericScope
		implements ApplicationContextAware, BeanDefinitionRegistryPostProcessor, Ordered {
	//......
	@ManagedOperation(description = "Dispose of the current instance of all beans in this scope and force a refresh on next method execution.")
	public void refreshAll() {
		//调用清除缓存方法
		super.destroy();
		this.context.publishEvent(new RefreshScopeRefreshedEvent());
	}
	//......
}
public class GenericScope implements Scope, BeanFactoryPostProcessor, DisposableBean {
	@Override
	public void destroy() {
		List<Throwable> errors = new ArrayList<Throwable>();
		//清除缓存
		Collection<BeanLifecycleWrapper> wrappers = this.cache.clear();
		for (BeanLifecycleWrapper wrapper : wrappers) {
			try {
			//销毁所有 @RefreshScope 类型的bean
				wrapper.destroy();
			}
			catch (RuntimeException e) {
				errors.add(e);
			}
		}
		if (!errors.isEmpty()) {
			throw wrapIfNecessary(errors.get(0));
		}
		this.errors.clear();
	}
}
```

被销毁的bean 再下次使用时，会重新创建，这样已满足配置动态刷新的需求了。但是有些时候，在清除这些bean之后，想执行一些自定义的监听逻辑，怎么做呢？

Spring Cloud同样提供了相应的事件：`RefreshScopeRefreshedEvent`。在`refreshAll`方法在清除缓存之后，会发布该事件：

```java
this.context.publishEvent(new RefreshScopeRefreshedEvent());
```

这里是留的扩展，如果有需要可以做一些扩展。目前在源码中看到 Zuul，Nacos都监听了该事件，具体细节有兴趣的可以去研究。

> 版权声明：「DDKK.COM 弟弟快看，程序员编程资料站」本站文章，版权归原作者所有
