# 06、SpringCloud Alibaba - OpenFeign 初始化流程
- 来源：https://ddkk.com/zhuanlan/j2ee/springcloudalibaba/3/6.html
- 分类：J2EE框架
- 分组：Spring Cloud Alibaba 教程
## 前言

在spring cloud alibaba 中使用OpenFeign，可以用来使用HTTP请求访问远程服务。

## 一、使用示例

**1、** 引入依赖；

```xml
<!-- https://mvnrepository.com/artifact/org.springframework.cloud/spring-cloud-starter-openfeign -->
		<dependency>
			<groupId>org.springframework.cloud</groupId>
			<artifactId>spring-cloud-starter-openfeign</artifactId>
			<version>3.0.0</version>
		</dependency>
```

**2、** 启动类；

加上注解@EnableFeignClients

```java
@SpringBootApplication
@EnableFeignClients
public class CloudApplication {
	public static void main(String[] args) {
		SpringApplication.run(CloudApplication.class, args);
		System.out.println("started...");
	}
}
```

**3、** 创建服务api接口；

用@FeignClient 注解标识，value = “server” 表示要访问的服务提供者的名称是server

```java
@FeignClient(value = "server")
@Component
public interface ServerApi {
    @GetMapping("/server/test/{id}")
    Map test(@PathVariable String id);
}
```

**4、** Controller接口；

```java
@RestController
@RequestMapping("/client")
public class ClientController {
    @Autowired
    private ServerApi serverApi;
    @GetMapping("/test/{id}")
    public Map test(@PathVariable String id){
        return serverApi.test(id);
    }
}
```

## 二、注册FeignClients

**1、** @EnableFeignClients；

在启动类上加上了注解@EnableFeignClients，该注解导入了配置类@Import(FeignClientsRegistrar.class)

**2、** FeignClientsRegistrar；

实现了ImportBeanDefinitionRegistrar 接口，重写了 registerBeanDefinitions( ) 方法，

在配置类加载过程中，会回调该方法

```java
loadBeanDefinitionsFromRegistrars(configClass.getImportBeanDefinitionRegistrars());
```

**3、** 回调方法；

```java
FeignClientsRegistrar.java
@Override
	public void registerBeanDefinitions(AnnotationMetadata metadata, BeanDefinitionRegistry registry) {
		//注册默认的配置类
		registerDefaultConfiguration(metadata, registry);
		//注册feign客户端 FeignClients
		registerFeignClients(metadata, registry);
	}
```

**4、** 注册默认的配置类；

```java
private void registerDefaultConfiguration(AnnotationMetadata metadata, BeanDefinitionRegistry registry) {
		//获取 @EnableFeignClients 注解信息
		Map<String, Object> defaultAttrs = metadata.getAnnotationAttributes(EnableFeignClients.class.getName(), true);
		if (defaultAttrs != null && defaultAttrs.containsKey("defaultConfiguration")) {
			String name;
			if (metadata.hasEnclosingClass()) {
				name = "default." + metadata.getEnclosingClassName();
			}
			else {
				name = "default." + metadata.getClassName();
			}
			//注册客户端配置类
			registerClientConfiguration(registry, name, defaultAttrs.get("defaultConfiguration"));
		}
	}
```

注册FeignClientSpecification 类

```java
private void registerClientConfiguration(BeanDefinitionRegistry registry, Object name, Object configuration) {
		BeanDefinitionBuilder builder = BeanDefinitionBuilder.genericBeanDefinition(FeignClientSpecification.class);
		builder.addConstructorArgValue(name);
		builder.addConstructorArgValue(configuration);
		registry.registerBeanDefinition(name + "." + FeignClientSpecification.class.getSimpleName(),
				builder.getBeanDefinition());
	}
```

**5、** 注册feign客户端；

1、registerFeignClients( )

```java
public void registerFeignClients(AnnotationMetadata metadata, BeanDefinitionRegistry registry) {
		LinkedHashSet<BeanDefinition> candidateComponents = new LinkedHashSet<>();
		//1、获取 @EnableFeignClients 注解信息
		Map<String, Object> attrs = metadata.getAnnotationAttributes(EnableFeignClients.class.getName());
		//@FeignClient 注解类型过滤器
		AnnotationTypeFilter annotationTypeFilter = new AnnotationTypeFilter(FeignClient.class);
		final Class<?>[] clients = attrs == null ? null : (Class<?>[]) attrs.get("clients");
		//2、获取包含@FeignClient 注解的接口
		if (clients == null || clients.length == 0) {
			//注解中没有指定要加载的 FeignClient 接口类，则进行扫描指定的包或当前处理的配置类所在的包
			//获取扫描器
			ClassPathScanningCandidateComponentProvider scanner = getScanner();
			scanner.setResourceLoader(this.resourceLoader);
			//设置注解类型过滤器
			scanner.addIncludeFilter(new AnnotationTypeFilter(FeignClient.class));
			//获取@FeignClient注解上的value/basePackages/basePackageClasses 或当前处理的配置类所在的包
			Set<String> basePackages = getBasePackages(metadata);
			for (String basePackage : basePackages) {
				//找出包含@FeignClient 注解的接口
				candidateComponents.addAll(scanner.findCandidateComponents(basePackage));
			}
		}
		else {
			//注解中指定了要加载的 FeignClient 接口类
			for (Class<?> clazz : clients) {
				candidateComponents.add(new AnnotatedGenericBeanDefinition(clazz));
			}
		}
		//3、解析@FeignClient接口
		for (BeanDefinition candidateComponent : candidateComponents) {
			if (candidateComponent instanceof AnnotatedBeanDefinition) {
				// verify annotated class is an interface
				AnnotatedBeanDefinition beanDefinition = (AnnotatedBeanDefinition) candidateComponent;
				AnnotationMetadata annotationMetadata = beanDefinition.getMetadata();
				Assert.isTrue(annotationMetadata.isInterface(), "@FeignClient can only be specified on an interface");
				Map<String, Object> attributes = annotationMetadata
						.getAnnotationAttributes(FeignClient.class.getCanonicalName());
				//@FeignClient制定的服务端的名称
				String name = getClientName(attributes);
				//根据服务端的名称注册FeignClientSpecification类
				registerClientConfiguration(registry, name, attributes.get("configuration"));
				//4、注册FeignClient
				registerFeignClient(registry, annotationMetadata, attributes);
			}
		}
	}
```

**6、** 注册FeignClient；

```java
private void registerFeignClient(BeanDefinitionRegistry registry, AnnotationMetadata annotationMetadata,
			Map<String, Object> attributes) {
		String className = annotationMetadata.getClassName();
		//设置类型为 FeignClientFactoryBean，实现了FactoryBean<Object>, InitializingBean, ApplicationContextAware接口
		BeanDefinitionBuilder definition = BeanDefinitionBuilder.genericBeanDefinition(FeignClientFactoryBean.class);
		validate(attributes);
		//获取注解属性，设置到beanDefinition中
		definition.addPropertyValue("url", getUrl(attributes));
		definition.addPropertyValue("path", getPath(attributes));
		String name = getName(attributes);
		definition.addPropertyValue("name", name);
		String contextId = getContextId(attributes);
		definition.addPropertyValue("contextId", contextId);
		definition.addPropertyValue("type", className);
		definition.addPropertyValue("decode404", attributes.get("decode404"));
		definition.addPropertyValue("fallback", attributes.get("fallback"));
		definition.addPropertyValue("fallbackFactory", attributes.get("fallbackFactory"));
		definition.setAutowireMode(AbstractBeanDefinition.AUTOWIRE_BY_TYPE);
		String alias = contextId + "FeignClient";
		AbstractBeanDefinition beanDefinition = definition.getBeanDefinition();
		beanDefinition.setAttribute(FactoryBean.OBJECT_TYPE_ATTRIBUTE, className);
		// has a default, won't be null
		boolean primary = (Boolean) attributes.get("primary");
		beanDefinition.setPrimary(primary);
		String qualifier = getQualifier(attributes);
		if (StringUtils.hasText(qualifier)) {
			alias = qualifier;
		}
		BeanDefinitionHolder holder = new BeanDefinitionHolder(beanDefinition, className, new String[] {
      alias });
		//注册到spring容器
		BeanDefinitionReaderUtils.registerBeanDefinition(holder, registry);
	}
```

## 三、实例化FeignClients

上一步中注册的 FeignClient 类型为 FeignClientFactoryBean 类型，FeignClientFactoryBean 实现了FactoryBean, InitializingBean, ApplicationContextAware接口，则在实例化过程中会调用 getObject( ) 和 afterPropertiesSet( ) 方法。

**1、** afterPropertiesSet()；

只是做了一些校验

```java
public void afterPropertiesSet() {
		Assert.hasText(contextId, "Context id must be set");
		Assert.hasText(name, "Name must be set");
	}
```

**2、** getObject()；

```java
public Object getObject() {
		return getTarget();
	}
```

```xml
<T> T getTarget() {
		//这里获取到feign的上下文信息，下面会对FeignContext做分析
		FeignContext context = applicationContext.getBean(FeignContext.class);
		//创建 Feign.Builder
		Feign.Builder builder = feign(context);
		if (!StringUtils.hasText(url)) {
			//没有指定服务端的url，使用服务端的名称
			if (!name.startsWith("http")) {
				url = "http://" + name;
			}
			else {
				url = name;
			}
			url += cleanPath();
			//获取带有负载均衡的客户端
			return (T) loadBalance(builder, context, new HardCodedTarget<>(type, name, url));
		}
		if (StringUtils.hasText(url) && !url.startsWith("http")) {
			url = "http://" + url;
		}
		String url = this.url + cleanPath();
		Client client = getOptional(context, Client.class);
		if (client != null) {
			if (client instanceof FeignBlockingLoadBalancerClient) {
				// not load balancing because we have a url,
				// but Spring Cloud LoadBalancer is on the classpath, so unwrap
				client = ((FeignBlockingLoadBalancerClient) client).getDelegate();
			}
			builder.client(client);
		}
		Targeter targeter = get(context, Targeter.class);
		return (T) targeter.target(this, builder, context, new HardCodedTarget<>(type, name, url));
	}
```

**3、** 创建Feign.Builder；

1、feign( )

```java
protected Feign.Builder feign(FeignContext context) {
		FeignLoggerFactory loggerFactory = get(context, FeignLoggerFactory.class);
		Logger logger = loggerFactory.create(type);
		// @formatter:off
		//根据FeignContext中的configuration，也就是@FeignClient中指定的configuration属性创建，没有指定configuration属性时，根据默认的一些配置创建，默认的配置定义在FeignClientsConfiguration配置类中
		Feign.Builder builder = get(context, Feign.Builder.class)
				// required values
				.logger(logger)
				.encoder(get(context, Encoder.class))
				.decoder(get(context, Decoder.class))
				.contract(get(context, Contract.class));
		// @formatter:on
		//配置Feign.Builder
		configureFeign(context, builder);
		//自定义的一些配置
		applyBuildCustomizers(context, builder);
		return builder;
	}
```

2、configureFeign( )

```java
protected void configureFeign(FeignContext context, Feign.Builder builder) {
		//获取FeignClientProperties  @ConfigurationProperties("feign.client")
		FeignClientProperties properties = applicationContext.getBean(FeignClientProperties.class);
		FeignClientConfigurer feignClientConfigurer = getOptional(context, FeignClientConfigurer.class);
		setInheritParentContext(feignClientConfigurer.inheritParentConfiguration());
		if (properties != null && inheritParentContext) {
			if (properties.isDefaultToProperties()) {
				//配置@FeignClient中指定的configuration属性：Logger.Level、Retryer、ErrorDecoder、FeignErrorDecoderFactory、Request.Options、RequestInterceptor、QueryMapEncoder、ExceptionPropagationPolicy
				configureUsingConfiguration(context, builder);
				//配置FeignClientProperties 中的默认属性
				configureUsingProperties(properties.getConfig().get(properties.getDefaultConfig()), builder);
				//配置FeignClientProperties 中指定的属性
				configureUsingProperties(properties.getConfig().get(contextId), builder);
			}
			else {
				configureUsingProperties(properties.getConfig().get(properties.getDefaultConfig()), builder);
				configureUsingProperties(properties.getConfig().get(contextId), builder);
				configureUsingConfiguration(context, builder);
			}
		}
		else {
			configureUsingConfiguration(context, builder);
		}
	}
```

3、applyBuildCustomizers( )

自定义配置回调 FeignBuilderCustomizer

```java
private void applyBuildCustomizers(FeignContext context, Feign.Builder builder) {
		Map<String, FeignBuilderCustomizer> customizerMap = context.getInstances(contextId,
				FeignBuilderCustomizer.class);
		if (customizerMap != null) {
			customizerMap.values().stream().sorted(AnnotationAwareOrderComparator.INSTANCE)
					.forEach(feignBuilderCustomizer -> feignBuilderCustomizer.customize(builder));
		}
	}
```

**4、** loadBalance()；

```java
protected <T> T loadBalance(Feign.Builder builder, FeignContext context, HardCodedTarget<T> target) {
		//在DefaultFeignLoadBalancerConfiguration中默认创建FeignBlockingLoadBalancerClient
		Client client = getOptional(context, Client.class);
		if (client != null) {
			//设置client
			builder.client(client);
			//默认是DefaultTargeter
			Targeter targeter = get(context, Targeter.class);
			//调用target()
			return targeter.target(this, builder, context, target);
		}
		throw new IllegalStateException(
				"No Feign Client for loadBalancing defined. Did you forget to include spring-cloud-starter-loadbalancer?");
	}
```

**5、** target()；

```java
public <T> T target(FeignClientFactoryBean factory, Feign.Builder feign, FeignContext context,
			Target.HardCodedTarget<T> target) {
		return feign.target(target);
	}
```

```java
 public <T> T target(Target<T> target) {
 	  //创建feign 目标对象
      return build().newInstance(target);
    }
```

**6、** build()；

增强feign里的属性，创建ReflectiveFeign

```java
public Feign build() {
	  //通过自定义的Capability来增强各属性
      Client client = Capability.enrich(this.client, capabilities);
      Retryer retryer = Capability.enrich(this.retryer, capabilities);
      List<RequestInterceptor> requestInterceptors = this.requestInterceptors.stream()
          .map(ri -> Capability.enrich(ri, capabilities))
          .collect(Collectors.toList());
      Logger logger = Capability.enrich(this.logger, capabilities);
      Contract contract = Capability.enrich(this.contract, capabilities);
      Options options = Capability.enrich(this.options, capabilities);
      Encoder encoder = Capability.enrich(this.encoder, capabilities);
      Decoder decoder = Capability.enrich(this.decoder, capabilities);
      InvocationHandlerFactory invocationHandlerFactory =
          Capability.enrich(this.invocationHandlerFactory, capabilities);
      QueryMapEncoder queryMapEncoder = Capability.enrich(this.queryMapEncoder, capabilities);
      SynchronousMethodHandler.Factory synchronousMethodHandlerFactory =
          new SynchronousMethodHandler.Factory(client, retryer, requestInterceptors, logger,
              logLevel, decode404, closeAfterDecode, propagationPolicy, forceDecoding);
      ParseHandlersByName handlersByName =
          new ParseHandlersByName(contract, options, encoder, decoder, queryMapEncoder,
              errorDecoder, synchronousMethodHandlerFactory);
      return new ReflectiveFeign(handlersByName, invocationHandlerFactory, queryMapEncoder);
    }
  }
```

**7、** newInstance()；

```java
public <T> T newInstance(Target<T> target) {
	//方法名称与SynchronousMethodHandler的映射
    Map<String, MethodHandler> nameToHandler = targetToHandlersByName.apply(target);
    //方法与SynchronousMethodHandler的映射
    Map<Method, MethodHandler> methodToHandler = new LinkedHashMap<Method, MethodHandler>();
    List<DefaultMethodHandler> defaultMethodHandlers = new LinkedList<DefaultMethodHandler>();
    for (Method method : target.type().getMethods()) {
      if (method.getDeclaringClass() == Object.class) {
        continue;
      } else if (Util.isDefault(method)) {
        DefaultMethodHandler handler = new DefaultMethodHandler(method);
        defaultMethodHandlers.add(handler);
        methodToHandler.put(method, handler);
      } else {
        methodToHandler.put(method, nameToHandler.get(Feign.configKey(target.type(), method)));
      }
    }
    //创建FeignInvocationHandler
    InvocationHandler handler = factory.create(target, methodToHandler);
    //创建代理对象
    T proxy = (T) Proxy.newProxyInstance(target.type().getClassLoader(),
        new Class<?>[] {
     target.type()}, handler);
    for (DefaultMethodHandler defaultMethodHandler : defaultMethodHandlers) {
      //默认方法，使用句柄方法方式
      defaultMethodHandler.bindTo(proxy);
    }
    return proxy;
  }
```

最终创建出了@FeignClient接口的代理对象

## 四、FeignContext

FeignContext 作为feign的上下文，包含了 FeignClient中指定的一些配置信息

```java
@Configuration(proxyBeanMethods = false)
@ConditionalOnClass(Feign.class)
@EnableConfigurationProperties({
      FeignClientProperties.class, FeignHttpClientProperties.class })
@Import(DefaultGzipDecoderConfiguration.class)
public class FeignAutoConfiguration {
	private static final Log LOG = LogFactory.getLog(FeignAutoConfiguration.class);
	@Autowired(required = false)
	private List<FeignClientSpecification> configurations = new ArrayList<>();
	@Bean
	public HasFeatures feignFeature() {
		return HasFeatures.namedFeature("Feign", Feign.class);
	}
	//创建bean FeignContext 
	@Bean
	public FeignContext feignContext() {
		FeignContext context = new FeignContext();
		//设置 FeignClientSpecification 类
		context.setConfigurations(this.configurations);
		return context;
	}
	...
}
```

FeignClientSpecification 类的注册在第二步中已经分析过。

## 总结

**1、** 给@FeignClient接口创建代理对象；

**2、** 创建增强handlerFeignInvocationHandler；

**3、** 创建SynchronousMethodHandler或DefaultMethodHandler处理真正的方法；
