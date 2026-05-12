# 04、Nepxion 教程 - Discovery 之 Spring Cloud 服务注册抽象
- 来源：https://ddkk.com/zhuanlan/j2ee/nepxion/1/4.html
- 分类：J2EE框架
- 分组：Nepxion 教程
在Spring Cloud 微服务架构体系里面我们的服务如果需要暴露被其它服务发现并调用，只需要在启动类上面添加注解 `@EnableDiscoveryClient` 就可以了。因为 Nepxion Discovery 这个灰服务框架是基于 Spring Cloud 微服务架构体系，所以我们就有必要知道 Spring Cloud 的服务注册发现的原理。所以在这里就分析一下 Spring Cloud 服务是如何自动注册的。首先要讨论的就是启动类上面的 `@EnableDiscoveryClient` 这个注解。

## 1、EnableDiscoveryClient 注解

Spring Cloud 在配置文件里面配置好远程的注册地址：以 nacos 以例，在 application.properties 里面添加 nacos 的地址：

> application.properties

```java
spring.cloud.nacos.discovery.server-addr=localhost:8848
```

然后再启动类添加注解 `@EnableDiscoveryClient` ，这个服务就可以被其它服务发现并使用了。这个注解是如何让这个服务自动注册到注册中心的呢？我们先来看一下这个注解类的声明：

> EnableDiscoveryClient.java

```java
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
@Documented
@Inherited
@Import(EnableDiscoveryClientImportSelector.class)
public @interface EnableDiscoveryClient {
	/**
	 * If true, the ServiceRegistry will automatically register the local server.
	 * @return - {@code true} if you want to automatically register.
	 */
	boolean autoRegister() default true;
}
```

这个注解有一个方法`autoRegister()` ，方法的注释描述是如果这个方法的值是 ture，ServiceRegistry 会自动把这个服务注册到注册中心里面去。这个注解上面还有一个 `@Import`，在 Spring framework 当中 `@Import` 的意思是引入的一配置类型的 Spring Bean。

下面我们分析一下 `EnableDiscoveryClientImportSelector` 这个类：

> EnableDiscoveryClientImportSelector

```java
@Order(Ordered.LOWEST_PRECEDENCE - 100)
public class EnableDiscoveryClientImportSelector
		extends SpringFactoryImportSelector<EnableDiscoveryClient> {
	@Override
	public String[] selectImports(AnnotationMetadata metadata) {
		String[] imports = super.selectImports(metadata);
		AnnotationAttributes attributes = AnnotationAttributes.fromMap(
				metadata.getAnnotationAttributes(getAnnotationClass().getName(), true));
		boolean autoRegister = attributes.getBoolean("autoRegister");
		if (autoRegister) {
			List<String> importsList = new ArrayList<>(Arrays.asList(imports));
			importsList.add(
					"org.springframework.cloud.client.serviceregistry.AutoServiceRegistrationConfiguration");
			imports = importsList.toArray(new String[0]);
		}
		else {
			Environment env = getEnvironment();
			if (ConfigurableEnvironment.class.isInstance(env)) {
				ConfigurableEnvironment configEnv = (ConfigurableEnvironment) env;
				LinkedHashMap<String, Object> map = new LinkedHashMap<>();
				map.put("spring.cloud.service-registry.auto-registration.enabled", false);
				MapPropertySource propertySource = new MapPropertySource(
						"springCloudDiscoveryClient", map);
				configEnv.getPropertySources().addLast(propertySource);
			}
		}
		return imports;
	}
	@Override
	protected boolean isEnabled() {
		return getEnvironment().getProperty("spring.cloud.discovery.enabled",
				Boolean.class, Boolean.TRUE);
	}
	@Override
	protected boolean hasDefaultFactory() {
		return true;
	}
}
```

首先这个类会去获取`@EnableDiscoveryClient` 里面的 `autoRegister` 值(默认为 true)，所以它会引入 `AutoServiceRegistrationConfiguration` 这个配置类：

```java
@Configuration(proxyBeanMethods = false)
@EnableConfigurationProperties(AutoServiceRegistrationProperties.class)
@ConditionalOnProperty(value = "spring.cloud.service-registry.auto-registration.enabled",
		matchIfMissing = true)
public class AutoServiceRegistrationConfiguration {
}
```

这个类其实就一个功能，就是通过 `@EnableConfigurationProperties(AutoServiceRegistrationProperties.class)` 往 Spring 容器里面添加 `AutoServiceRegistrationProperties`，这个可以配置它的属性的 Spring Bean。

> 注意：这个 Bean 对 Spring Cloud 自动注入非常关键，我们后续再来分析它。现在只需要记住 Spring Cloud 通过 @EnableDiscoveryClient 注解使得 Spring 容器里面有一个可配置的 Bean 对象AutoServiceRegistrationProperties 就可以了

## 2、Spring Cloud 服务注册抽象

在`spring-cloud-common`里面中 `org.springframework.cloud.client` 里面下面的几个子包分别是对分步式不同的抽象：

```java
+ org.springframework.cloud.client
  └ actuator                【对指标的抽象】
  └ circuitbreaker          【对断路器的抽象】
  └ discovery               【对服务注册发现的抽象】
  └ hypermedia              【对超媒体的抽象】
  └ loadbalancer            【对负载均衡的抽象】
  └ serviceregistry         【对服务注册的抽象】
```

在服务注册的时候 Spring Cloud 抽象了以下三个接口：

- Registration：它是一个标记接口实现了ServiceInstance，可以获取到服务信息，服务自动注册时使用。
- ServiceRegistry：服务注册接口，需要使用到上面的 Registration 接口
- AutoServiceRegistration ： 服务自动注册接口

### 2.1 Registration

`Registration` 注册信息接口，它实现了这个接口是一个标记接口，接口里面没有方法。它实现了接口 `ServiceInstance`。

> ServiceInstance.java

```java
public interface ServiceInstance {
	default String getInstanceId() {
		return null;
	}
	String getServiceId();
	String getHost();
	int getPort();
	boolean isSecure();
	URI getUri();
	Map<String, String> getMetadata();
	default String getScheme() {
		return null;
	}
}
```

这个接口里面可以拿到服务的基本信息，当进行一个 http 调用的时候，主要是需要拿到服务的域名、端口、服务 ID以及我们在`Nepxion Discovery` 要用到的核心概念就是元数据(metadata)。

### 2.2 ServiceRegistry

如果说`Registration` 是服务注册里面需要关心服务的信息了，那么 ServiceRegistry 就是 Spring Cloud 抽象出的服务注册需要进行哪些动作了。

> ServiceRegistry.java

```java
public interface ServiceRegistry<R extends Registration> {
	void register(R registration);
	void deregister(R registration);
	void close();
	void setStatus(R registration, String status);
	<T> T getStatus(R registration);
}
```

在服务注册里面一定时需要关心服务注册中服务相关的信息的。所以在 `ServiceRegistry` 上面标注泛型需要这个接口的实现类必须是操作 `Registration` 接口的实现类。`ServiceRegistry` 这个服务注册类里面包含了以下 5 个方法：

- register() ：注册方法，其实就是把服务相关的信息注册到注册中心，服务发现功能，提供给其它服务调用
- deregister()：注销方法，其实就是把服务注销，把当前的服务在注册中心进行下线，不提供服务给其实服务进行调用
- close()：关闭 ServiceRegistry ，是一个生命周期方法，关闭服务注册需要使用的一些资源
- setStatus()：设置服务状态，就是设置这个服务是否可用。比如：有些服务没有下线，但是它不想给其它服务消费方进行调用。
- getStatus()：获取服务状态，就是查询这个服务的运行状态，看一下这个服务当前是否可用

### 2.3 AutoServiceRegistration

`AutoServiceRegistration` 这个接口其实是一个标记接口，它没有具体的方法。 Spring Cloud 其实是使用 `AbstractAutoServiceRegistration` 来进行具体实现的。这个类的定义如下：

> AbstractAutoServiceRegistration.java

```java
public abstract class AbstractAutoServiceRegistration<R extends Registration>
		implements AutoServiceRegistration, ApplicationContextAware,
		ApplicationListener<WebServerInitializedEvent> {
	private final ServiceRegistry<R> serviceRegistry;
	...
}
```

可以看到这个抽象类是实现了 `ApplicationListener`，并且它是持有 `ServiceRegistry` 这个服务注册类， `ServiceRegistry` 这个属性是 final 的，所以在 `AbstractAutoServiceRegistration` 初始化的时候一定会设置这个属性。

因为 AbstractAutoServiceRegistration 实现了接口 ApplicationListener``，这个 Spring 事件接口，并且关心的事件是 WebServerInitializedEvent。所以在容器初始化完成之后就会调用AbstractAutoServiceRegistration#onApplicationEvent，最终其实会调用AbstractAutoServiceRegistration#start 在这个里面其实会调用ServiceRegistry#register 完成服务的自动注册。

上面3 个接口就能够完成对服务注册抽象，具体的实现还需要具体注册中心对它不同的时候。下面我就以 Nacos 来举例，它是如何实现自动注册的。

## 3、Alibaba Nacos 实现

如果使用 Nacos 做为 Spring Cloud 微服务架构的注册中心就需要引入以下 jar 包：

```java
<dependency>
    <groupId>com.alibaba.cloud</groupId>
    <artifactId>spring-cloud-starter-alibaba-nacos-discovery</artifactId>
    <version>${your.version}</version>
</dependency>
```

在里面分别有对 Spring Cloud Common 包里面对服务注册 3 个接口的实现。

- NacosRegistration：对 Registration 服务信息也就是服务注册服务描述的实现。
- NacosServiceRegistry：对 ServiceRegistry``服务注册也就是服务注册服务动作的实现。
- NacosAutoServiceRegistration：对 AbstractAutoServiceRegistration 服务注册的实现。

里面最终的逻辑都是调用 nacos-client 实现服务对 nacos 注册中心的注册。这个不是我们主要讨论的问题。我们主要看一下 `spring-cloud-starter-alibaba-nacos-discovery` 这个包里面是如何对这些 Spring Cloud 服务自动注册 Bean 的管理的。在这个 jar 包里面具体的自动依赖配置核心类是 `NacosServiceRegistryAutoConfiguration`。

> NacosServiceRegistryAutoConfiguration.java

```java
@Configuration(proxyBeanMethods = false)
@EnableConfigurationProperties
@ConditionalOnNacosDiscoveryEnabled
@ConditionalOnProperty(value = "spring.cloud.service-registry.auto-registration.enabled",
		matchIfMissing = true)
@AutoConfigureAfter({
      AutoServiceRegistrationConfiguration.class,
		AutoServiceRegistrationAutoConfiguration.class,
		NacosDiscoveryAutoConfiguration.class })
public class NacosServiceRegistryAutoConfiguration {
	@Bean
	public NacosServiceRegistry nacosServiceRegistry(
			NacosDiscoveryProperties nacosDiscoveryProperties) {
		return new NacosServiceRegistry(nacosDiscoveryProperties);
	}
	@Bean
	@ConditionalOnBean(AutoServiceRegistrationProperties.class)
	public NacosRegistration nacosRegistration(
			ObjectProvider<List<NacosRegistrationCustomizer>> registrationCustomizers,
			NacosDiscoveryProperties nacosDiscoveryProperties,
			ApplicationContext context) {
		return new NacosRegistration(registrationCustomizers.getIfAvailable(),
				nacosDiscoveryProperties, context);
	}
	@Bean
	@ConditionalOnBean(AutoServiceRegistrationProperties.class)
	public NacosAutoServiceRegistration nacosAutoServiceRegistration(
			NacosServiceRegistry registry,
			AutoServiceRegistrationProperties autoServiceRegistrationProperties,
			NacosRegistration registration) {
		return new NacosAutoServiceRegistration(registry,
				autoServiceRegistrationProperties, registration);
	}
}
```

在这个对象里面自动依赖注入了我们上面提到的 nacos 对于 Spring Cloud Common 抽象服务自动注册 3 个类的实现。**在这里需要特别注意的是@ConditionalOnBean(AutoServiceRegistrationProperties.class)**，还记得我们第一个小节讲的`@EnableDiscoveryClient`这个注解吗？就是因为有这个注解，才向 Spring 容器里面添加了`AutoServiceRegistrationProperties.class` 这个配置类。所以 nacos 服务自动注册需要依赖 Spring 容器中包含这个 Bean 才能进行服务的自动注册。

当然在这个 jar 包的`META-INF/spring.factories` 的文件中就是 Spring Boot 自动依赖所需要的配置：

```java
org.springframework.boot.autoconfigure.EnableAutoConfiguration=\
  com.alibaba.cloud.nacos.discovery.NacosDiscoveryAutoConfiguration,\
  com.alibaba.cloud.nacos.ribbon.RibbonNacosAutoConfiguration,\
  com.alibaba.cloud.nacos.endpoint.NacosDiscoveryEndpointAutoConfiguration,\
  com.alibaba.cloud.nacos.registry.NacosServiceRegistryAutoConfiguration,\
  com.alibaba.cloud.nacos.discovery.NacosDiscoveryClientConfiguration,\
  com.alibaba.cloud.nacos.discovery.reactive.NacosReactiveDiscoveryClientConfiguration,\
  com.alibaba.cloud.nacos.discovery.configclient.NacosConfigServerAutoConfiguration,\
  com.alibaba.cloud.nacos.NacosServiceAutoConfiguration
org.springframework.cloud.bootstrap.BootstrapConfiguration=\
  com.alibaba.cloud.nacos.discovery.configclient.NacosDiscoveryClientConfigServiceBootstrapConfiguration
```

整个逻辑还是挺清楚的。
