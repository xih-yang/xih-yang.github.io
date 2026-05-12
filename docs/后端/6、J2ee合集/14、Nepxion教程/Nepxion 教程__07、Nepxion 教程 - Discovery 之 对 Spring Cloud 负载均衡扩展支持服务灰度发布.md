# 07、Nepxion 教程 - Discovery 之 对 Spring Cloud 负载均衡扩展支持服务灰度发布
- 来源：https://ddkk.com/zhuanlan/j2ee/nepxion/1/7.html
- 分类：J2EE框架
- 分组：Nepxion 教程
在之前的文章之中我们解析了一下 Spring Cloud 只需要在 `RestTemplate` 类型的 Spring Bean 上面添加一个 `@LoadBalanced` 注解，并且通过 `RestTemplate` 以 `http://serviceId/访问路径` 就可以访问真实服务的地址 `http://lolcahost:端口/访问路径`。同样的 `Nepxion Discovery` 需要实现服务的灰度发布，也对 Spring Cloud 的负载均衡进行了扩展。基于 Nepxion Discovery 版本为：`6.3.5-SNAPSHOT`。

## 1、Nacos 负载均衡实现

Spring Cloud 对于负载均衡默认并没有对 Nacos 的实现，那么我们就来看一下 Nacos 是如何实现负载均衡的。具体实现类是 `NacosRule`，在使用 nacos 作为注册中心时，并没有使用这个策略。

```java
public class NacosRule extends AbstractLoadBalancerRule {
	private static final Logger LOGGER = LoggerFactory.getLogger(NacosRule.class);
	@Autowired
	private NacosDiscoveryProperties nacosDiscoveryProperties;
	@Autowired
	private NacosServiceManager nacosServiceManager;
	@Override
	public Server choose(Object key) {
		try {
			String clusterName = this.nacosDiscoveryProperties.getClusterName();
			String group = this.nacosDiscoveryProperties.getGroup();
			DynamicServerListLoadBalancer loadBalancer = (DynamicServerListLoadBalancer) getLoadBalancer();
			String name = loadBalancer.getName();
			NamingService namingService = nacosServiceManager
					.getNamingService(nacosDiscoveryProperties.getNacosProperties());
			List<Instance> instances = namingService.selectInstances(name, group, true);
			if (CollectionUtils.isEmpty(instances)) {
				LOGGER.warn("no instance in service {}", name);
				return null;
			}
			List<Instance> instancesToChoose = instances;
			if (StringUtils.isNotBlank(clusterName)) {
				List<Instance> sameClusterInstances = instances.stream()
						.filter(instance -> Objects.equals(clusterName,
								instance.getClusterName()))
						.collect(Collectors.toList());
				if (!CollectionUtils.isEmpty(sameClusterInstances)) {
					instancesToChoose = sameClusterInstances;
				}
				else {
					LOGGER.warn(
							"A cross-cluster call occurs，name = {}, clusterName = {}, instance = {}",
							name, clusterName, instances);
				}
			}
			Instance instance = ExtendBalancer.getHostByRandomWeight2(instancesToChoose);
			return new NacosServer(instance);
		}
		catch (Exception e) {
			LOGGER.warn("NacosRule error", e);
			return null;
		}
	}
	@Override
	public void initWithNiwsConfig(IClientConfig iClientConfig) {
	}
}
```

这个对象里面注入了 `NacosDiscoveryProperties` 配置属性以及 `NacosServiceManager` 服务管理器。首先通过服务组(没有配置就是 DEFAULT)，以及服务的名称获取到服务实例的列表。如果服务的配置信息里面包含服务的集群信息(`clusterName`)，就会过滤服务实例列表，如果列表里面有当前群集的信息。如果过滤后的列表不为空就使用同集群的服务，否则还是使用未过滤之前的服务实例列表。最后通过权重随机算法获取到一个服务信息。

在Nacos 的 Spring Cloud 自动配置依赖模块 `spring-cloud-starter-alibaba-nacos-discovery` 里面自定义了 `RibbonClient` 客户端相关的服务配置。

> RibbonNacosAutoConfiguration.java

```java
@Configuration(proxyBeanMethods = false)
@EnableConfigurationProperties
@ConditionalOnBean(SpringClientFactory.class)
@ConditionalOnRibbonNacos
@ConditionalOnNacosDiscoveryEnabled
@AutoConfigureAfter(RibbonAutoConfiguration.class)
@RibbonClients(defaultConfiguration = NacosRibbonClientConfiguration.class)
public class RibbonNacosAutoConfiguration {
}
@Configuration(proxyBeanMethods = false)
@ConditionalOnRibbonNacos
public class NacosRibbonClientConfiguration {
	@Autowired
	private PropertiesFactory propertiesFactory;
	@Bean
	@ConditionalOnMissingBean
	public ServerList<?> ribbonServerList(IClientConfig config,
			NacosDiscoveryProperties nacosDiscoveryProperties) {
		if (this.propertiesFactory.isSet(ServerList.class, config.getClientName())) {
			ServerList serverList = this.propertiesFactory.get(ServerList.class, config,
					config.getClientName());
			return serverList;
		}
		NacosServerList serverList = new NacosServerList(nacosDiscoveryProperties);
		serverList.initWithNiwsConfig(config);
		return serverList;
	}
	@Bean
	@ConditionalOnMissingBean
	public NacosServerIntrospector nacosServerIntrospector() {
		return new NacosServerIntrospector();
	}
}
```

在这里它使用了的是基于 Nacos 注册中心，`NacosServerList`实现 `ServerList` 接口对 Nacos 里面服务信息列表的获取。同时在 Spring 容器中添加了 `ServerIntrospector` 的服务自省实现类 `NacosServerIntrospector` 可以获取到这个服务是否安全的(基于 https 协议) 以及服务信息的元数据。

## 2、Nepxion Discovery 的扩展

`Nepxion Discovery` 对负载均衡的扩展其实就是对 `IRule` 接口实现的扩展。这里其实就服务灰度发布的真正实现。`DiscoveryClient` 根据服务 ID 获取到这个服务所有暴露的可用的服务列表，通过负载均衡里面的策略选择一个合适的服务进行调用。最终就调用到`Nepxion Discovery` 对负载均衡的扩展其实就是对 `IRule` 接口实现的扩展

下面就是`Nepxion Discovery` 对 IRule 这个策略接口的实现：

下面我们看一下扩展策略接口的作用：

实现类
策略描述
实现说明

PredicateBasedRuleDecorator
抽象类，继承PredicateBasedRule并且重写了 IRule#choose，支持 version权重和 region 权重
分别从 header 里面和远程配置中心获取version权重和 region 权重。优先级：header > 配置中心

DiscoveryEnabledBaseRule
继承PredicateBasedRuleDecorator，复合判断 server 的可用性选择 server 以及通过灰度参数选择 server
使用 ZoneAvoidancePredicate 和 DiscoveryEnabledBasePredicate 来判断是否选择某个 server，前一个判断判定一个 zone 的运行性能是否可用，剔除不可用的 zone（的所有 server），DiscoveryEnabledBasePredicate用于过滤掉不满足灰度条件的 server

ZoneAvoidanceRuleDecorator
继承 ZoneAvoidanceRule并且重写了 IRule#choose，支持 version权重和 region 权重
分别从 header 里面和远程配置中心获取version权重和 region 权重。优先级：header > 配置中心

DiscoveryEnabledZoneAvoidanceRule
继承ZoneAvoidanceRuleDecorator，复合判断 server 的可用性选择 server以及通过灰度参数选择 server
使用 AvailabilityPredicate 和 DiscoveryEnabledZoneAvoidancePredicate 来判断是否选择某个 server，前一个判断判定一个 Server 是否可用，剔除不可用的 Server，DiscoveryEnabledBasePredicate用于过滤掉不满足灰度条件的 server

在`Nepxion Discovery` 框架针对 Robbin 的负载均衡配置有 `StrategyLoadBalanceConfiguration` 和 `PluginLoadBalanceConfiguration` 这两个配置类。

> StrategyLoadBalanceConfiguration.java

```java
@Configuration
@AutoConfigureBefore(RibbonClientConfiguration.class)
public class StrategyLoadBalanceConfiguration {
    @Autowired
    private ConfigurableEnvironment environment;
    @RibbonClientName
    private String serviceId = "client";
    @Autowired
    private PropertiesFactory propertiesFactory;
    @Autowired
    private PluginAdapter pluginAdapter;
    @Autowired(required = false)
    private DiscoveryEnabledAdapter discoveryEnabledAdapter;
    @Bean
    public IRule ribbonRule(IClientConfig config) {
        if (this.propertiesFactory.isSet(IRule.class, serviceId)) {
            return this.propertiesFactory.get(IRule.class, config, serviceId);
        }
        boolean zoneAvoidanceRuleEnabled = environment.getProperty(StrategyConstant.SPRING_APPLICATION_STRATEGY_ZONE_AVOIDANCE_RULE_ENABLED, Boolean.class, Boolean.TRUE);
        if (zoneAvoidanceRuleEnabled) {
            DiscoveryEnabledZoneAvoidanceRule discoveryEnabledRule = new DiscoveryEnabledZoneAvoidanceRule();
            discoveryEnabledRule.initWithNiwsConfig(config);
            DiscoveryEnabledZoneAvoidancePredicate discoveryEnabledPredicate = discoveryEnabledRule.getDiscoveryEnabledPredicate();
            discoveryEnabledPredicate.setPluginAdapter(pluginAdapter);
            discoveryEnabledPredicate.setDiscoveryEnabledAdapter(discoveryEnabledAdapter);
            return discoveryEnabledRule;
        } else {
            DiscoveryEnabledBaseRule discoveryEnabledRule = new DiscoveryEnabledBaseRule();
            DiscoveryEnabledBasePredicate discoveryEnabledPredicate = discoveryEnabledRule.getDiscoveryEnabledPredicate();
            discoveryEnabledPredicate.setPluginAdapter(pluginAdapter);
            discoveryEnabledPredicate.setDiscoveryEnabledAdapter(discoveryEnabledAdapter);
            return discoveryEnabledRule;
        }
    }
}
```

下面是`PluginLoadBalanceConfiguration` 配置类：

> PluginLoadBalanceConfiguration

```java
@Configuration
@AutoConfigureAfter(RibbonClientConfiguration.class)
public class PluginLoadBalanceConfiguration {
    @RibbonClientName
    private String serviceId = "client";
    @Autowired
    private PropertiesFactory propertiesFactory;
    @Autowired
    private LoadBalanceListenerExecutor loadBalanceListenerExecutor;
    @Bean
    @ConditionalOnMissingBean
    public IRule ribbonRule(IClientConfig config) {
        if (this.propertiesFactory.isSet(IRule.class, serviceId)) {
            return this.propertiesFactory.get(IRule.class, config, serviceId);
        }
        ZoneAvoidanceRuleDecorator rule = new ZoneAvoidanceRuleDecorator();
        rule.initWithNiwsConfig(config);
        return rule;
    }
    @Bean
    public ILoadBalancer ribbonLoadBalancer(IClientConfig config, ServerList<Server> serverList, ServerListFilter<Server> serverListFilter, IRule rule, IPing ping, ServerListUpdater serverListUpdater) {
        if (this.propertiesFactory.isSet(ILoadBalancer.class, serviceId)) {
            return this.propertiesFactory.get(ILoadBalancer.class, config, serviceId);
        }
        ZoneAwareLoadBalancer<?> loadBalancer = new ZoneAwareLoadBalancer<>(config, rule, ping, serverList, serverListFilter, serverListUpdater);
        loadBalanceListenerExecutor.setLoadBalancer(loadBalancer);
        return loadBalancer;
    }
}
```

`PluginLoadBalanceConfiguration` 的类上面的配置是`@AutoConfigureAfter(RibbonClientConfiguration.class)`,所以它的初始化顺序在 `RibbonClientConfiguration` 这个Spring Cloud Ribbon 原始配置类之后，而`StrategyLoadBalanceConfiguration` 类上面的配置是 `@AutoConfigureBefore(RibbonClientConfiguration.class)`，所以它初始化顺序在`RibbonClientConfiguration` 这个Spring Cloud Ribbon 原始配置类之前。那么三个配置类的初始化顺序为：

> StrategyLoadBalanceConfiguration ===> RibbonClientConfiguration ===> PluginLoadBalanceConfiguration

并且这三个配置类里面都配置了`IRule` 这个负载均衡策略，所以生效的就是 `StrategyLoadBalanceConfiguration` 里面配置的这个策略。默认采用 `DiscoveryEnabledZoneAvoidanceRule` 这个策略。`PluginLoadBalanceConfiguration` 和 `RibbonClientConfiguration` 都配置了 `ILoadBalancer` 这个类型的 bean。虽然 `RibbonClientConfiguration` 的初始化顺序先于`PluginLoadBalanceConfiguration` ，但是 `RibbonClientConfiguration` 配置的 `ILoadBalancer` 上面标注了 `@ConditionalOnMissingBean` 注解。这样 `PluginLoadBalanceConfiguration`里面的定义`ILoadBalancer` 这个类型的 Spring bean 就会生效，而`RibbonClientConfiguration`里面定义的`ILoadBalancer` 这个类型的 Spring bean 就不会生效。

## 3、负载均衡对灰度发布的支持

从上面的分析中我们可以得出结论，在使用 `Nepxion Discovery` 进行服务灰度发布的时候进行服务选择会使用 `DiscoveryEnabledZoneAvoidanceRule`这个策略。首先这个策略扩展了`Server choose(Object key)` 方法，也就是分别从 `header` 里面和远程配置中心获取`version`权重和 `region` 权重。并且**优先级：header > 配置中心**。如果配置了就会通过 `AbstractMapWeightRandomLoadBalance` 的两个实现类 `StrategyMapWeightRandomLoadBalance` 与 `RuleMapWeightRandomLoadBalance` 这两个负载均衡器进行服务权重选择。

当没有设置version权重和 region 权重时，DiscoveryEnabledZoneAvoidanceRule 就会通过 DiscoveryEnabledZoneAvoidancePredicate#apply 进行服务的选择。其实它最终会调用到 DefaultDiscoveryEnabledAdapter#apply 方法。

> DefaultDiscoveryEnabledAdapter#apply

```java
public class DefaultDiscoveryEnabledAdapter implements DiscoveryEnabledAdapter {
    @Override
    public boolean apply(Server server) {
        boolean enabled = applyEnvironment(server);
        if (!enabled) {
            return false;
        }
        enabled = applyRegion(server);
        if (!enabled) {
            return false;
        }
        enabled = applyAddress(server);
        if (!enabled) {
            return false;
        }
        enabled = applyIdBlacklist(server);
        if (!enabled) {
            return false;
        }
        enabled = applyAddressBlacklist(server);
        if (!enabled) {
            return false;
        }
        enabled = applyVersion(server);
        if (!enabled) {
            return false;
        }
        return applyStrategy(server);
    }
	......
}
```

从上面的参数我们就可以看到灰度发布支持的纬度包含：

- 版本权重
- Region 权重
- 环境
- Region
- 地址
- ID 黑名单
- 地址黑名单
- 版本
- 自定义策略

我们再来对比一下 [Nepxion Discovery 官网](https://github.com/Nepxion/Discovery) 上面支持灰度的定义的参数，是不是和我们上面提到的维度基本相同。

以上就是 `Nepxion Discovery` 对 Spring Cloud 负载均衡扩展实现灰度发布的实现。
