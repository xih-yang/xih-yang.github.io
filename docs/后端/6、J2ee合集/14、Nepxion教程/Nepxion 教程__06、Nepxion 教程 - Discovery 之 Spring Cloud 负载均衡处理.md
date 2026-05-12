# 06、Nepxion 教程 - Discovery 之 Spring Cloud 负载均衡处理
- 来源：https://ddkk.com/zhuanlan/j2ee/nepxion/1/6.html
- 分类：J2EE框架
- 分组：Nepxion 教程
在之前的文章中只是简单的讲解了一下 `Nepxion Discovery` 服务注册添加元数据到注册中心里面以及服务注册与发现 Listener 的扩展。其实在服务发现的时候 `Nepxion Discovery` 进行了自己的扩展才能做到通过 restful header 传入以及配置中心配置的灰度参数再获取到某个服务的列表的时候，才能够选择灰度合适的服务实例。要理解 `Nepxion Discovery` 框架是如何进行灰度服务中进行服务实例选择的，我们先来理解一下 Spring Cloud 是如何对负载均衡进行处理的。`基于 spring-cloud-common-2.2.5.RELEASE.`

### 1、@LoadBalanced

当我们需要使用负载均衡功能的时候只需要在 `RestTemplate` 类型的 Spring Bean 上面添加一个 `@LoadBalanced` 就可以了，那么下面就来分析一下这个注解。

> LoadBalanced.java

```java
/**
 * Annotation to mark a RestTemplate or WebClient bean to be configured to use a
 * LoadBalancerClient.
 * @author Spencer Gibb
 */
@Target({ ElementType.FIELD, ElementType.PARAMETER, ElementType.METHOD })
@Retention(RetentionPolicy.RUNTIME)
@Documented
@Inherited
@Qualifier
public @interface LoadBalanced {
}
```

这个注解上面添加 `@Qualifier` 注解其实就是一个限定注解。比如，一个 Spring 的 ‘ResTemplate 类型的 Bean 上面标注了`@LoadBalanced`，如果需要依赖注入这个这个 Bean，就需要在使用下面的格式：

```java
@LoadBalanced
@Autowired(required = false)
private List<RestTemplate> restTemplates = Collections.emptyList();
```

`@LoadBalanced` 这个注解的类上面的注释说把这个注解标注到 `RestTemplate` 或者 `WebClient` ，以使用`LoadBalancerClient` 来配置它。那么下面我们就来分析一下`LoadBalancerClient` 这个接口吧。

## 2、LoadBalancerClient

`LoadBalancerClient` 看这个类的命名就知道它是为负载均衡调用提供的客户端抽象。它的接口定义如下：

```java
public interface LoadBalancerClient extends ServiceInstanceChooser {
	<T> T execute(String serviceId, LoadBalancerRequest<T> request) throws IOException;
	<T> T execute(String serviceId, ServiceInstance serviceInstance,
			LoadBalancerRequest<T> request) throws IOException;
	URI reconstructURI(ServiceInstance instance, URI original);
}
public interface ServiceInstanceChooser {
	ServiceInstance choose(String serviceId);
}
```

`LoadBalancerClient` 本身有 3 个接口，它还实现了 `ServiceInstanceChooser` 服务实例选择器。我们来看一下`LoadBalancerClient` 这个接口里面的核心功能：

- choose(String serviceId)：根据传入的服务 serviceId，从客户端负载均衡器里面选择一个适合的服务实例信息。
- execute()：发送请求到从负载均衡选择出来的服务信息上面的域名下的服务
- reconstructURI(ServiceInstance instance, URI original)：重新构建 URI，因为我们在使用 RestTemplate 进行远程调用的时候使用的路径是：http://serviceId/访问路径。所以这里需要把 serviceId替换成真实的 服务器 IP(或者域名) + 端口，比如替换成：http://localhost:3001/hello。这样就能够通过 RestTemplate 进行远程调用了。

## 3、LoadBalancerAutoConfiguration

上面我们对 `@LoadBalanced` 与 `LoadBalancerClient` 它们进行了分析，那么这两个东西是怎么关联起来的呢？下面我们来分析一下 `@LoadBalanced` 注解是在哪里被调用的，然后在 `LoadBalancerAutoConfiguration` 里面找到了。

> LoadBalancerAutoConfiguration.java

```java
@Configuration(proxyBeanMethods = false)
@ConditionalOnClass(RestTemplate.class)
@ConditionalOnBean(LoadBalancerClient.class)
@EnableConfigurationProperties(LoadBalancerRetryProperties.class)
public class LoadBalancerAutoConfiguration {
	@LoadBalanced
	@Autowired(required = false)
	private List<RestTemplate> restTemplates = Collections.emptyList();
	@Autowired(required = false)
	private List<LoadBalancerRequestTransformer> transformers = Collections.emptyList();
	@Bean
	public SmartInitializingSingleton loadBalancedRestTemplateInitializerDeprecated(
			final ObjectProvider<List<RestTemplateCustomizer>> restTemplateCustomizers) {
		return () -> restTemplateCustomizers.ifAvailable(customizers -> {
			for (RestTemplate restTemplate : LoadBalancerAutoConfiguration.this.restTemplates) {
				for (RestTemplateCustomizer customizer : customizers) {
					customizer.customize(restTemplate);
				}
			}
		});
	}
	@Bean
	@ConditionalOnMissingBean
	public LoadBalancerRequestFactory loadBalancerRequestFactory(
			LoadBalancerClient loadBalancerClient) {
		return new LoadBalancerRequestFactory(loadBalancerClient, this.transformers);
	}
	@Configuration(proxyBeanMethods = false)
	@ConditionalOnMissingClass("org.springframework.retry.support.RetryTemplate")
	static class LoadBalancerInterceptorConfig {
		@Bean
		public LoadBalancerInterceptor ribbonInterceptor(
				LoadBalancerClient loadBalancerClient,
				LoadBalancerRequestFactory requestFactory) {
			return new LoadBalancerInterceptor(loadBalancerClient, requestFactory);
		}
		@Bean
		@ConditionalOnMissingBean
		public RestTemplateCustomizer restTemplateCustomizer(
				final LoadBalancerInterceptor loadBalancerInterceptor) {
			return restTemplate -> {
				List<ClientHttpRequestInterceptor> list = new ArrayList<>(
						restTemplate.getInterceptors());
				list.add(loadBalancerInterceptor);
				restTemplate.setInterceptors(list);
			};
		}
	}
	/**
	 * Auto configuration for retry mechanism.
	 */
	@Configuration(proxyBeanMethods = false)
	@ConditionalOnClass(RetryTemplate.class)
	public static class RetryAutoConfiguration {
		@Bean
		@ConditionalOnMissingBean
		public LoadBalancedRetryFactory loadBalancedRetryFactory() {
			return new LoadBalancedRetryFactory() {
			};
		}
	}
	/**
	 * Auto configuration for retry intercepting mechanism.
	 */
	@Configuration(proxyBeanMethods = false)
	@ConditionalOnClass(RetryTemplate.class)
	public static class RetryInterceptorAutoConfiguration {
		@Bean
		@ConditionalOnMissingBean
		public RetryLoadBalancerInterceptor ribbonInterceptor(
				LoadBalancerClient loadBalancerClient,
				LoadBalancerRetryProperties properties,
				LoadBalancerRequestFactory requestFactory,
				LoadBalancedRetryFactory loadBalancedRetryFactory) {
			return new RetryLoadBalancerInterceptor(loadBalancerClient, properties,
					requestFactory, loadBalancedRetryFactory);
		}
		@Bean
		@ConditionalOnMissingBean
		public RestTemplateCustomizer restTemplateCustomizer(
				final RetryLoadBalancerInterceptor loadBalancerInterceptor) {
			return restTemplate -> {
				List<ClientHttpRequestInterceptor> list = new ArrayList<>(
						restTemplate.getInterceptors());
				list.add(loadBalancerInterceptor);
				restTemplate.setInterceptors(list);
			};
		}
	}
}
```

上面的源码看着比较多，它的核心功能如下：

- LoadBalancerAutoConfiguration 其实是一个自动依赖配置类，只需要满足条件：在 classpath 中包含 RestTemplate 这个类并且在 Spring 容器中包含 LoadBalancerClient 这个接口的实例对象类型的 bean。
- ribbonInterceptor：方法返回了一个拦截器叫做LoadBalancerInterceptor，这个拦截器的作用主要是在客户端发起请求时进行拦截，进而实现客户端负载均衡功能。
- restTemplateCustomizer：方法返回了一个RestTemplateCustomizer，这个方法主要用来给RestTemplate添加LoadBalancerInterceptor拦截器。
- restTemplates 表示依赖注入被 LoadBalanced 标注的 RestTemplate列表，在loadBalancedRestTemplateInitializer方法中通过调用RestTemplateCustomizer中的customize方法来给RestTemplate添加上LoadBalancerInterceptor拦截器。

上面步骤步骤里面最核心的还是给标注 `LoadBalanced` 注解的 `RestTemplate` 对象添加`LoadBalancerInterceptor`拦截器。完成对 `RestTemplate` 的增强，其得使用 `RestTemplate` 调用服务具有负载均衡的作用。

> 这就是为什么在调用的时候需要使用:http://serviceId/访问路径。因为在集群环境下一个服务对应多个服务实例，需要通过 serviceId 获取到集群里面服务列表，然后通过负载均衡器选择一个合适的服务实例(服务 IP 和端口)替换之前的访问路径，访问真实的服务实例暴露的服务完成整个调用。

## 4、LoadBalancerInterceptor

`LoadBalancerInterceptor` 是 spring cloud 集成 Ribbon 进行负载均衡的核心。下面我们就来分析一下这个拦截器。

> LoadBalancerInterceptor.java

```java
public class LoadBalancerInterceptor implements ClientHttpRequestInterceptor {
	private LoadBalancerClient loadBalancer;
	private LoadBalancerRequestFactory requestFactory;
	public LoadBalancerInterceptor(LoadBalancerClient loadBalancer,
			LoadBalancerRequestFactory requestFactory) {
		this.loadBalancer = loadBalancer;
		this.requestFactory = requestFactory;
	}
	public LoadBalancerInterceptor(LoadBalancerClient loadBalancer) {
		// for backwards compatibility
		this(loadBalancer, new LoadBalancerRequestFactory(loadBalancer));
	}
	@Override
	public ClientHttpResponse intercept(final HttpRequest request, final byte[] body,
			final ClientHttpRequestExecution execution) throws IOException {
		final URI originalUri = request.getURI();
		String serviceName = originalUri.getHost();
		Assert.state(serviceName != null,
				"Request URI does not contain a valid hostname: " + originalUri);
		return this.loadBalancer.execute(serviceName,
				this.requestFactory.createRequest(request, body, execution));
	}
}
```

在`LoadBalancerInterceptor`这个拦截器类就持有上面分析 `@LoadBalanced`里面所说到的 `LoadBalancerClient`。如果一个标注 `@LoadBalanced`注解的 `RestTemplate` 进行远程调用的时候，就会经过`LoadBalancerInterceptor`这个拦截器处理。获取原始请求里面的 URI 里面的 host，其实就是 `http://serviceId/访问路径`这个路径里面的 `serviceId`。然后再调用我们第二小节分析的 `LoadBalancerClient`。之前我们分析下这个接口里面暴露的方法。下面我们就来具体的分析一下它的实现。

其实在拦截器`LoadBalancerInterceptor`调用的是接口 `LoadBalancerClient`的实现 `RibbonLoadBalancerClient`，这个对象的是在 `RibbonAutoConfiguration` 里面被注入到 Spring 容器了。

> RibbonAutoConfiguration.java

```java
@Configuration
@Conditional(RibbonAutoConfiguration.RibbonClassesConditions.class)
@RibbonClients
@AutoConfigureAfter(
		name = "org.springframework.cloud.netflix.eureka.EurekaClientAutoConfiguration")
@AutoConfigureBefore({
      LoadBalancerAutoConfiguration.class,
		AsyncLoadBalancerAutoConfiguration.class })
@EnableConfigurationProperties({
      RibbonEagerLoadProperties.class,
		ServerIntrospectorProperties.class })
public class RibbonAutoConfiguration {
	@Bean
	@ConditionalOnMissingBean(LoadBalancerClient.class)
	public LoadBalancerClient loadBalancerClient() {
		return new RibbonLoadBalancerClient(springClientFactory());
	}
}
```

当然这个类里面的代码不止这些，我只是截取了我们关注的点。

## 5、RibbonLoadBalancerClient

它最终会调用到方法 `T execute(String serviceId, LoadBalancerRequest request, Object hint)`，hint 相当于强制路由哪个服务。这里默认为空。

```java
public class RibbonLoadBalancerClient implements LoadBalancerClient {
	public <T> T execute(String serviceId, LoadBalancerRequest<T> request, Object hint)
			throws IOException {
		ILoadBalancer loadBalancer = getLoadBalancer(serviceId);
		Server server = getServer(loadBalancer, hint);
		if (server == null) {
			throw new IllegalStateException("No instances available for " + serviceId);
		}
		RibbonServer ribbonServer = new RibbonServer(serviceId, server,
				isSecure(server, serviceId),
				serverIntrospector(serviceId).getMetadata(server));
		return execute(serviceId, ribbonServer, request);
	}
	protected Server getServer(ILoadBalancer loadBalancer, Object hint) {
		if (loadBalancer == null) {
			return null;
		}
		// Use 'default' on a null hint, or just pass it on?
		return loadBalancer.chooseServer(hint != null ? hint : "default");
	}
	protected ILoadBalancer getLoadBalancer(String serviceId) {
		return this.clientFactory.getLoadBalancer(serviceId);
	}
	...
}
```

上面的代码逻辑分为以下几步：

- 根据 serviceId 获取负载均衡器
- 通过负载均衡器从服务列表中选择一个合适的服务
- 把 RestTemplate 中的 serviceId 替换成这个选取后得到的服务信息然后进行远程调用

### 5.1 获取负载均衡器

在使用`RibbonLoadBalancerClient` 调用远程服务的时候首先是获取一个负载均衡器 `ILoadBalancer`。我们首先来看一个这个接口的定义：

> ILoadBalancer.java

```java
public interface ILoadBalancer {
	public void addServers(List<Server> newServers);
	public Server chooseServer(Object key);
	public void markServerDown(Server server);
    public List<Server> getReachableServers();
	public List<Server> getAllServers();
}
```

这个接口里面的接口都是和 Service 相关，它定义了下面的几个方法：

- addServers：在负载均衡器里面添加服务列表，维护远程服务的信息
- chooseServer：在负载均衡器里面根据 key，获取到一个合适的服务
- markServerDown：标记服务已经下线，由负载平衡器的客户端调用，以通知服务器关闭否则，LB可能会认为在下一个Ping周期之前它还活着(假设LB Impl执行ping)。
- getReachableServers：获取所有可以对外提供服务的服务列表
- getAllServers：获取所有可以获取的服务列表

Service 其实就是代表远程服务的信息，里面包含：服务 ID，域名，端口，zone(区域)以及服务的元数据信息等。在 Spring Cloud 里面使用的 `ILoadBalancer` 接口实例是 `ZoneAwareLoadBalancer`。

```java
@Configuration(proxyBeanMethods = false)
@EnableConfigurationProperties
@Import({
      HttpClientConfiguration.class, OkHttpRibbonConfiguration.class,
		RestClientRibbonConfiguration.class, HttpClientRibbonConfiguration.class })
public class RibbonClientConfiguration {
	@Bean
	@ConditionalOnMissingBean
	public ILoadBalancer ribbonLoadBalancer(IClientConfig config,
			ServerList<Server> serverList, ServerListFilter<Server> serverListFilter,
			IRule rule, IPing ping, ServerListUpdater serverListUpdater) {
		if (this.propertiesFactory.isSet(ILoadBalancer.class, name)) {
			return this.propertiesFactory.get(ILoadBalancer.class, config, name);
		}
		return new ZoneAwareLoadBalancer<>(config, rule, ping, serverList,
				serverListFilter, serverListUpdater);
	}
}
```

至此，通过 `RestTemplate` 进行远程调用就找到了真正的负载均衡器了。

### 5.2 选择合适的服务

在上面的步骤中我们找到了负载均衡器了，下一个我们就需要在某个服务暴露的服务信息列表中选择一个合适的服务器进行调用。ZoneAwareLoadBalancer 这个负载均衡器针对主要是针对的多机房的服务调用。默认情况下服务只是在一个区域进行调用，服务最终会调用到 BaseLoadBalancer#chooseServer。

> BaseLoadBalancer.java

```java
public class BaseLoadBalancer extends AbstractLoadBalancer implements
        PrimeConnections.PrimeConnectionListener, IClientConfigAware {
    public Server chooseServer(Object key) {
        if (counter == null) {
            counter = createCounter();
        }
        counter.increment();
        if (rule == null) {
            return null;
        } else {
            try {
                return rule.choose(key);
            } catch (Exception e) {
                logger.warn("LoadBalancer [{}]:  Error choosing server for key {}", name, key, e);
                return null;
            }
        }
    }
	...
}
```

最后也是通过`IRule` 策略接口进行服务选取。我们来看一下这个接口的定义：

```java
public interface IRule{
    public Server choose(Object key);
    public void setLoadBalancer(ILoadBalancer lb);
    public ILoadBalancer getLoadBalancer();    
}
```

这个接口里面定义了三个接口：

- Server choose(Object key)：选择一个合适的服务实例返回
- setLoadBalancer(ILoadBalancer lb)：设置策略接口的负载均衡器
- ILoadBalancer getLoadBalancer()：获取策略接口的负载均衡器

下面我们看一下策略接口有哪些实现：

实现类
策略描述
实现说明

BestAvailableRule
选择一个最小并发请求的 server
逐个考察 Server，如果 Server 被 tripped 了，则忽略，在选择其中 ActiveRequestsCount 最小的 server

AvailabilityFilteringRule
过滤掉那些因为一直连接失败的被标记为 circuit tripped 的后端 server，并过滤掉那些高并发的的后端 server（active connections 超过配置的阈值）
使用一个 AvailabilityPredicate 来包含过滤 server 的逻辑，其实就就是检查 status 里记录的各个 server 的运行状态

WeightedResponseTimeRule
根据响应时间分配一个 weight，响应时间越长，weight 越小，被选中的可能性越低。
一个后台线程定期的从 status 里面读取评价响应时间，为每个 server 计算一个 weight。Weight 的计算也比较简单 responsetime 减去每个 server 自己平均的 responsetime 是 server 的权重。当刚开始运行，没有形成 status 时，使用 RoundRobinRule 策略选择 server。

RetryRule
对选定的负载均衡策略机上重试机制。
在一个配置时间段内当选择 server 不成功，则一直尝试使用 subRule 的方式选择一个可用的 server

RoundRobinRule
roundRobin 方式轮询选择 server
轮询 index，选择 index 对应位置的 server

RandomRule
随机选择一个 server
在 index 上随机，选择 index 对应位置的 server

ZoneAvoidanceRule
复合判断 server 所在区域的性能和 server 的可用性选择 server
使用 ZoneAvoidancePredicate 和 AvailabilityPredicate 来判断是否选择某个 server，前一个判断判定一个 zone 的运行性能是否可用，剔除不可用的 zone（的所有 server），AvailabilityPredicate 用于过滤掉连接数过多的 Server。

在Spring Cloud 里面使用的是 `ZoneAvoidanceRule`，可以在 `RibbonClientConfiguration` 里面查看。

### 5.3 远程服务调用

通过负载均衡器选择出来一个合适的服务信息，然后创建一个 `RibbonServer`，它其实是接口 `ServiceInstance` 接口的一个实例。在之前的 [4、Nepxion Discovery 之 Spring Cloud 服务注册抽象](/zhuanlan/j2ee/nepxion/1/4.html) 博客中已经分析这个接口了，现在在这里再简单描述一下，这个接口是服务实例的具体信息，包含服务 ID、服务的 IP 地址(或者域名)、端口以及元数据信息。

在这里它其实就可以把远程访问地址 `http://serviceId/访问地址` 修改成真实的访问地址：`http://localhost:1234/访问地址` 完成整个服务的调用。下面我们就来看他是怎么实现的。

在这里进行远程调用其实是通过 LoadBalancerRequest#request，LoadBalancerRequest 这个对象实例是通过方法参数传递进行的，那么我们看一下这个参数是在哪里进行创建并传递进来的呢？最终会找到是在 LoadBalancerInterceptor 这个拦截器里面。LoadBalancerRequest 实例是通过 LoadBalancerRequestFactory 进行创建的。LoadBalancerRequestFactory在进行对象创建的时候它会创建 ServiceRequestWrapper 对象。

```java
public class ServiceRequestWrapper extends HttpRequestWrapper {
	private final ServiceInstance instance;
	private final LoadBalancerClient loadBalancer;
	public ServiceRequestWrapper(HttpRequest request, ServiceInstance instance,
			LoadBalancerClient loadBalancer) {
		super(request);
		this.instance = instance;
		this.loadBalancer = loadBalancer;
	}
	@Override
	public URI getURI() {
		URI uri = this.loadBalancer.reconstructURI(this.instance, getRequest().getURI());
		return uri;
	}
}
```

在进行 HTTP 调用的时候，执行请求的时候就会通过 ServiceRequestWrapper#getURI 获取需要远程调用的 URI 信息进行远程调用，在这里会调用 RibbonLoadBalancerClient#reconstructURI 把远程访问地址 http://serviceId/访问地址 修改成真实的访问地址：http://localhost:1234/访问地址 完成整个服务的调用。

> RibbonLoadBalancerClient#reconstructURI

```java
	@Override
	public URI reconstructURI(ServiceInstance instance, URI original) {
		Assert.notNull(instance, "instance can not be null");
		String serviceId = instance.getServiceId();
		RibbonLoadBalancerContext context = this.clientFactory
				.getLoadBalancerContext(serviceId);
		URI uri;
		Server server;
		if (instance instanceof RibbonServer) {
			RibbonServer ribbonServer = (RibbonServer) instance;
			server = ribbonServer.getServer();
			uri = updateToSecureConnectionIfNeeded(original, ribbonServer);
		}
		else {
			server = new Server(instance.getScheme(), instance.getHost(),
					instance.getPort());
			IClientConfig clientConfig = clientFactory.getClientConfig(serviceId);
			ServerIntrospector serverIntrospector = serverIntrospector(serviceId);
			uri = updateToSecureConnectionIfNeeded(original, clientConfig,
					serverIntrospector, server);
		}
		return context.reconstructURIWithServer(server, uri);
	}
```

从`reconstructURI` 方法中我们可以看到，首先获取到了一个 `serviceId`，然后根据这个 `id` 获取到`RibbonLoadBalancerContext` 对象（`RibbonLoadBalancerContext类用来存储一些被负载均衡器使用的上下文内容和API操作`），然后这里会根据ServiceInstance的信息来构造一个具体的服务实例信息的Server对象，最后再调用`reconstructURIWithServer`方法来构建服务实例的URI。好，我们再来看一看 `reconstructURIWithServer` 方法：

> RibbonLoadBalancerContext#reconstructURIWithServer

```java
public URI reconstructURIWithServer(Server server, URI original) {
    String host = server.getHost();
    int port = server .getPort();
    if (host.equals(original.getHost()) 
            && port == original.getPort()) {
        return original;
    }
    String scheme = original.getScheme();
    if (scheme == null) {
        scheme = deriveSchemeAndPortFromPartialUri(original).first();
    }
    try {
        StringBuilder sb = new StringBuilder();
        sb.append(scheme).append("://");
        if (!Strings.isNullOrEmpty(original.getRawUserInfo())) {
            sb.append(original.getRawUserInfo()).append("@");
        }
        sb.append(host);
        if (port >= 0) {
            sb.append(":").append(port);
        }
        sb.append(original.getRawPath());
        if (!Strings.isNullOrEmpty(original.getRawQuery())) {
            sb.append("?").append(original.getRawQuery());
        }
        if (!Strings.isNullOrEmpty(original.getRawFragment())) {
            sb.append("#").append(original.getRawFragment());
        }
        URI newURI = new URI(sb.toString());
        return newURI;            
    } catch (URISyntaxException e) {
        throw new RuntimeException(e);
    }
}
```

`reconstructURIWithServer` 这个方法的逻辑比较简单。首先它从Server对象中获取host和port信息，然后根据以服务名为host的URI对象original中获取其他请求信息，将这两者的内容进行拼接整合，形成最终要访问的服务实例地址，至此，我们就拿到了一个组装之后的URI。

参考文章：

- [RestTemplate的逆袭之路，从发送请求到负载均衡](https://blog.csdn.net/u012702547/article/details/77940838)
- [深入理解 RPC 之集群篇](https://www.cnkirito.moe/rpc-cluster/)
