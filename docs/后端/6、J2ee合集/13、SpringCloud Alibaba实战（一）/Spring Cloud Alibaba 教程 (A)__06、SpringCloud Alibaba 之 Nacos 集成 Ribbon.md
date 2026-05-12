# 06、SpringCloud Alibaba 之 Nacos 集成 Ribbon
- 来源：https://ddkk.com/zhuanlan/j2ee/springcloudalibaba/1/6.html
- 分类：J2EE框架
- 分组：Spring Cloud Alibaba 教程 (A)
## 负载均衡（Load Balance）

负载均衡（Load Balance） ，简单点说就是将用户的请求平摊分配到多个服务器上运行，以达到扩展服务器带宽、增强数据处理能力、增加吞吐量、提高网络的可用性和灵活性的目的

负载均和分为硬件负载均衡和软件负载均衡：

**硬件负载均衡**：比如 F5、深信服、Array 等；

**软件负载均衡**：比如 Nginx、LVS、HAProxy 等；（是一个服务器实现的）

一般来说，使用硬件成本比较高，因此公司都是使用软件负载均衡，软件负载均衡又分为两种

（1）服务端负载均衡

（2）客户端负载均衡

**1、** 服务端负载均衡；

服务端负载均衡是在客户端和服务端之间建立一个独立的负载均衡服务器，该服务器既可以是硬件设备（例如 F5），也可以是软件（例如 Nginx）。这个负载均衡服务器维护了一份可用服务端清单，然后通过心跳机制来删除故障的服务端节点，以保证清单中的所有服务节点都是可以正常访问的。

当客户端发送请求时，该请求不会直接发送到服务端进行处理，而是全部交给负载均衡服务器，由负载均衡服务器按照某种算法（例如轮询、随机等），从其维护的可用服务清单中选择一个服务端，然后进行转发。

**2、** 客户端负载均衡；

客户端负载均衡是将负载均衡逻辑以代码的形式封装到客户端上，即负载均衡器位于客户端。客户端通过服务注册中心（例如 Eureka Server）获取到一份服务端提供的可用服务清单。有了服务清单后，负载均衡器会在客户端发送请求前通过负载均衡算法选择一个服务端实例再进行访问，以达到负载均衡的目的

**Ribbon 就是一个基于 HTTP 和 TCP 的客户端负载均衡器**

Ribbon是Netflix公司发布的开源项目（组件、框架、jar包），主要功能是提供客户端的软件负载均衡算法，它会从Nacos中获取一个可用的服务端清单，通过心跳检测来剔除故障的服务端节点以保证清单中都是可以正常访问的服务端节点；

当客户端发送请求，则ribbon负载均衡器按某种算法（比如轮询、权重、随机等）从维护的可用服务端清单中取出一台服务端的地址，然后进行请求；

Ribbon非常简单，可以说就是一个jar包，这个jar包实现了负载均衡算法，Spring Cloud Alibaba底层对Ribbon做了二次封装，可以让我们使用 RestTemplate的服务请求，自动转换成客户端负载均衡的服务调用；

Ribbon支持多种负载均衡算法，还支持自定义的负载均衡算法

## 1、使用Ribbon实现负载均衡

**1、** 加入ribbon依赖；

注：spring-cloud-starter-alibaba-nacos-discovery 或者 spring-cloud-starter-netflix-eureka-client 都集成了 ribbon依赖

```xml
<!-- Nacos 服务注册与发现 discovery依赖；集成了 Ribbon依赖 -->
<dependency>
    <groupId>com.alibaba.cloud</groupId>
    <artifactId>spring-cloud-starter-alibaba-nacos-discovery</artifactId>
</dependency>
<!--<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-starter-netflix-eureka-client</artifactId>
</dependency> -->
<!--<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-netflix-ribbon</artifactId>
    <version>2.1.4.RELEASE</version>
</dependency> -->
```

**2、** 在RestTemplate上面加入**@LoadBalanced**注解，这样就可以实现RestTemplate在调用时自动负载均衡；

```java
@Configuration
public class RestConfig {
    //将这个对象放入ioc容器
    @Bean
    @LoadBalanced  //使用这个注解给restTemplate赋予了负载均衡的能力
    public RestTemplate getRestTemplate(){
        return new RestTemplate();
    }
}
```

注：

> 由于 Netflix Ribbon 进入停更维护阶段，因此 SpringCloud 2020.0.1 版本之后 删除了eureka中的ribbon，替代ribbon的是spring cloud自带的LoadBalancer，默认使用的是轮询的方式 新版本的 Nacos discovery 都已经移除了 Ribbon ，此时我们需要引入 loadbalancer 代替，才能调用服务提供者提供的服务

## loadbalancer实现负载均衡

**1、** 加入依赖（将discovery中的ribbon依赖剔除）；使用SpringCloud2020.0.1之后版本；

```xml
<!-- nacos 服务注册发现  -->
<dependency>
    <groupId>com.alibaba.cloud</groupId>
    <artifactId>spring-cloud-starter-alibaba-nacos-discovery</artifactId>
    <exclusions>
        <!-- 将ribbon排除 -->
        <exclusion>
            <groupId>org.springframework.cloud</groupId>
            <artifactId>spring-cloud-starter-netflix-ribbon</artifactId>
        </exclusion>
    </exclusions>
</dependency>
<!--添加loadbalancer依赖
    由于 Netflix Ribbon 进入停更维护阶段，因此 SpringCloud 2020.0.1 版本之后 删除了eureka中的ribbon，替代ribbon的是spring cloud自带的LoadBalancer，默认使用的是轮询的方式
    新版本的 Nacos discovery 都已经移除了 Ribbon ，此时我们需要引入 loadbalancer 代替，才能调用服务提供者提供的服务
-->
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-starter-loadbalancer</artifactId>
</dependency>
```

```xml
<properties>
<java.version>1.8</java.version>
    <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
    <project.reporting.outputEncoding>UTF-8</project.reporting.outputEncoding>
    <spring-boot.version>2.4.2</spring-boot.version>
    <spring-cloud-alibaba.version>2021.1</spring-cloud-alibaba.version>
</properties>
<dependencyManagement>
<dependencies>
    <dependency>
        <groupId>com.alibaba.cloud</groupId>
        <artifactId>spring-cloud-alibaba-dependencies</artifactId>
        <version>${spring-cloud-alibaba.version}</version>
        <type>pom</type>
        <scope>import</scope>
    </dependency>
    <!-- spring-cloud-dependencies -->
    <dependency>
        <groupId>org.springframework.cloud</groupId>
        <artifactId>spring-cloud-dependencies</artifactId>
        <version>2020.0.1</version>
        <type>pom</type>
        <scope>import</scope>
    </dependency>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-dependencies</artifactId>
        <version>${spring-boot.version}</version>
        <type>pom</type>
        <scope>import</scope>
    </dependency>
</dependencies>
</dependencyManagement>
```

**2、** 自定义RestTemplate的负载均衡工具配置类；

```java
import org.springframework.cloud.client.ServiceInstance;
import org.springframework.cloud.loadbalancer.core.RandomLoadBalancer;
import org.springframework.cloud.loadbalancer.core.ReactorLoadBalancer;
import org.springframework.cloud.loadbalancer.core.ServiceInstanceListSupplier;
import org.springframework.cloud.loadbalancer.support.LoadBalancerClientFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.core.env.Environment;
//这里 不需要 @configuration注解
public class MyLoadBalancerConfig {
    @Bean
    ReactorLoadBalancer<ServiceInstance> randomLoadBalancer(Environment environment,
                                                            LoadBalancerClientFactory loadBalancerClientFactory) {
        String name = environment.getProperty(LoadBalancerClientFactory.PROPERTY_NAME);
        return new RandomLoadBalancer(loadBalancerClientFactory
                .getLazyProvider(name, ServiceInstanceListSupplier.class),
                name);
    }
}
```

**3、** 自定义RestTemplate配置类；

注入restTemplate的地方使用注解**@LoadBalancerClients** 或者**@LoadBalancerClient**注解进行配置

```java
@Configuration
//在这里配置我们自定义的LoadBalancer策略 如果想自己扩展算法 需要实现ReactorServiceInstanceLoadBalancer接口
//@LoadBalancerClients(defaultConfiguration = {name = "CLOUD-PAYMENT-SERVICE", configuration = MyLoadBalancerConfig.class})
//注意这里的name属性 需要和eureka页面中的服务提供者名字一致
@LoadBalancerClient(name = "springcloud-alibaba-1-nacos-discovery-provider",configuration = MyLoadBalancerConfig.class)
public class RestConfig {
    //将这个对象放入ioc容器
    @Bean
    @LoadBalanced  //使用这个注解给restTemplate赋予了负载均衡的能力
    public RestTemplate getRestTemplate(){
        return new RestTemplate();
    }
}
```

**4、** 测试类Controller中；

```java
@RestController
public class TestController {
    @Autowired
    RestTemplate restTemplate;
    @GetMapping("/test")
    public String test() {
        return restTemplate.getForObject("http://springcloud-alibaba-1-nacos-discovery-provider/test", String.class);
    }
}
```

或者我们直接注入 **LoadBalancerClient** ，但这里要注意 如果使用注入 LoadBalancerClient 不能和**@LoadBalanced** 注解一起使用，不然报错：[No instances available for xx][]

```java
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cloud.client.ServiceInstance;
import org.springframework.cloud.client.loadbalancer.LoadBalancerClient;
@RestController
public class TestController {
    @Autowired
    private LoadBalancerClient loadBalancerClient;
    @GetMapping("/echo/{app}")
    public String echoAppName(@PathVariable("app") String app){
        //使用 LoadBalanceClient 和 RestTemplate 结合的方式来访问
        //使用LoadBalancerClient方式时，需要去掉@LoadBalanced注解；不然两种方式会导致冲突
        ServiceInstance serviceInstance = loadBalancerClient.choose("springcloud-alibaba-1-nacos-discovery-provider");
        // http://192.168.133.1:9001/echo/{app}
        String url = String.format("http://%s:%s/echo/%s", serviceInstance.getHost(), serviceInstance.getPort(), app);
        System.out.println("request url:"+url);
        return restTemplate.getForObject(url, String.class);
    }
}
```

## 2、Ribbon 实现负载均衡策略 IRule、ILoadBalancer接口

Ribbon 是一个客户端的负载均衡器，它可以与 Eureka 配合使用轻松地实现客户端的负载均衡。Ribbon 会先从 Eureka Server（服务注册中心）去获取服务端列表，然后通过负载均衡策略将请求分摊给多个服务端，从而达到负载均衡的目的

Spring Cloud Ribbon 提供了一个 IRule 接口，该接口主要用来定义负载均衡策略

在jar包：**com.netflix.ribbon:ribbon-loadbalancer** 中

负载均衡的入口：**ILoadBalancer** 接口

通过断点调试，选中 **ILoadBalancer** 查看其实现类，在实现类中分别断点，最终进入

**ZoneAwareLoadBalancer** 类，因此可判断出 默认负载均衡策略是 **ZoneAvoidanceRule**

IRule有 7 个默认实现类，每一个实现类都是一种负载均衡策略

**负载均衡实现**

**策略**

RandomRule

随机

RoundRobinRule

轮询

AvailabilityFilteringRule

先过滤掉由于多次访问故障的服务，以及并

发连接数超过阈值的服务，然后对剩下的服

务按照轮询策略进行访问；

WeightedResponseTimeRule

根据平均响应时间计算所有服务的权重，响

应时间越快服务权重就越大被选中的概率即

越高，如果服务刚启动时统计信息不足，则

使用RoundRobinRule策略，待统计信息足够会切换到该WeightedResponseTimeRule策

略；

RetryRule

先按照RoundRobinRule策略分发，如果分发

到的服务不能访问，则在指定时间内进行重

试，然后分发其他可用的服务；

BestAvailableRule

先过滤掉由于多次访问故障的服务，然后选

择一个并发量最小的服务；

**ZoneAvoidanceRule**（默认）

综合判断服务节点所在区域的性能和服务节

点的可用性，来决定选择哪个服务；

### 自定义负载均衡策略

```java
public class MyNacosRule extends AbstractLoadBalancerRule {
    @Override
    public void initWithNiwsConfig(IClientConfig clientConfig)    
{//基本上不需要实现}
    @Override
    public Server choose(Object key) {//实现该方法}
}
```

如下：

```java
import com.netflix.client.config.IClientConfig;
import com.netflix.loadbalancer.AbstractLoadBalancerRule;
import com.netflix.loadbalancer.ILoadBalancer;
import com.netflix.loadbalancer.Server;
import java.util.List;
import java.util.Random;
/**
 * 自定义实现ribbon负载均衡
 */
public class MyNacosRule extends AbstractLoadBalancerRule {
    @Override
    public void initWithNiwsConfig(IClientConfig clientConfig) {
        //基本上不需要实现
    }
    @Override
    public Server choose(Object key) {
        System.out.println("我们自己的负载均衡策略 1..........");
        //自己实现服务的选择
        ILoadBalancer lb = getLoadBalancer();
        if (lb == null) {
            return null;
        }
        Server server = null;
        while (server == null) {
            if (Thread.interrupted()) {
                return null;
            }
            List<Server> upList = lb.getReachableServers();
            List<Server> allList = lb.getAllServers();
            int serverCount = allList.size();
            if (serverCount == 0) {
                /*
                 * No servers. End regardless of pass, because subsequent passes
                 * only get more restrictive.
                 */
                return null;
            }
            //随机的负载均衡
            int index =  new Random().nextInt(serverCount);
            server = upList.get(index);
            if (server == null) {
                /*
                 * The only time this should happen is if the server list were
                 * somehow trimmed. This is a transient condition. Retry after
                 * yielding.
                 */
                Thread.yield();
                continue;
            }
            if (server.isAlive()) {
                return (server);
            }
            // Shouldn't actually happen.. but must be transient or a bug.
            server = null;
            Thread.yield();
        }
        return server;
    }
}
```

application.properties/yml配置文件配置负载均衡策略：

```bash
#通过配置文件指定负载均衡策略，springcloud-alibaba-1-nacos-discovery-provider是远程服务提供者的名称，不同服务采用不同负载均衡策略
springcloud-alibaba-1-nacos-discovery-provider.ribbon.NFLoadBalancerRuleClassName=com.company.ribbon.MyNacosRule
```

## 3、Ribbon组件的核心接口

接口

作用

默认值

IclientConfig

读取配置

DefaultClientConfigImpl

IRule

负载均衡规则，选择实例

ZoneAvoidanceRule

IPing

筛选掉ping不通的实例

DumyPing（该类什么不干，认为每个实例都可用，都能ping通）

ServerList

交给Ribbon的实例列表

**Ribbon:**ConfigurationBasedServerList
**Spring Cloud Alibaba:**NacosServerList

ServerListFilter

过滤掉不符合条件的实例

ZonePreferenceServerListFilter

ILoadBalancer

Ribbon的入口

ZoneAwareLoadBalancer

ServerListUpdater

更新交给Ribbon的List的策略

PollingServerListUpdater

每个接口都可以自定义进行扩展，用法类似 IRule接口，配置方式也相同，如自定义 IPing

```java
@Configuration
public class MyRibbonConfig {
    /*
    在使用springcloud ribbon客户端负载均衡的时候，可以给RestTemplate bean 加一个@LoadBalanced注解，就能让这个RestTemplate在请求时拥有客户端负载均衡的能力
    这个@LoadBalanced注解是来自cloud包下的一个注解
    */
    @Bean
    @LoadBalanced //与 Ribbon 集成，并开启负载均衡功能
    public RestTemplate restTemplate() {
        return new RestTemplate();
    }
    /**
     * 更改负载均衡策略，默认是ZoneAvoidanceRule策略
     */
    @Bean
    public IRule iRule() {
        return new NacosRule();
    }
    @Bean
    public IPing iPing () {
        return new PingUrl();
    }
}
```

application.properties/yml配置文件配置：

```java
<serviceName>:
     ribbon:
          NFLoadBalancerClassName:ILoadBalancer该接口实现类
          NFLoadBalancerRuleClassName:IRule该接口实现类
          NFLoadBalancerPingClassName:Iping该接口实现类
          NIWSServerListClassName:ServerList该接口实现类
          NIWSServerListFilterClassName:ServiceListFilter该接口实现类
```

如

```java
#iping的策略，springcloud-alibaba-1-nacos-discovery-provider是远程服务提供者的名称，
springcloud-alibaba-1-nacos-discovery-provider.ribbon.NFLoadBalancerPingClassName=com.netflix.loadbalancer.PingUrl
```

## 4、Nacos权重负载均衡

Nacos的负载均衡策略NacosRule已经实现了基于权限的负载均衡，直接使用

```java
@Bean
public IRule iRule(){
    return new NacosRule();
}
```

application.properties/yml配置文件配置：

```bash
#指定集群的名称
#集群名称相同的优先调用，当具有相同名称的集群宕机了，才会调用另一个名称不相同的集群
spring.cloud.nacos.discovery.cluster-name=shanghai
```

## 5、Nacos配置服务元数据 metadata

```java
/**
 * 自定义实现ribbon负载均衡：基于Nacos版本号的负载均衡
 *
 */
public class MyNacosVersionRule extends AbstractLoadBalancerRule {
    private static final Logger log = LoggerFactory.getLogger(MyNacosVersionRule.class);
    @Autowired
    private NacosDiscoveryProperties nacosDiscoveryProperties;
    @Override
    public Server choose(Object key) {
        // 负载均衡规则：优先选择同集群下，符合metadata的实例
        //              没有同集群实例，就选择所有集群下，符合metadata的实例
        try {
            String clusterName = this.nacosDiscoveryProperties.getClusterName();
            String targetVersion = this.nacosDiscoveryProperties.getMetadata().get("version");
            DynamicServerListLoadBalancer loadBalancer = (DynamicServerListLoadBalancer) getLoadBalancer();
            String name = loadBalancer.getName();
            NamingService namingService = this.nacosDiscoveryProperties.namingServiceInstance();
            // 所有实例
            List<Instance> instances = namingService.selectInstances(name, true);
            List<Instance> metadataMatchInstances = instances;
            // 如果配置了版本映射，那么只调用元数据匹配的实例
            if (StringUtils.isNotBlank(targetVersion)) {
                //JDK8
                metadataMatchInstances = instances.stream()
                        .filter(instance -> Objects.equals(targetVersion, instance.getMetadata().get("version")))
                        .collect(Collectors.toList());
                if (CollectionUtils.isEmpty(metadataMatchInstances)) {
                    log.warn("未找到元数据匹配的目标服务实例, 请检查配置: targetVersion = {}, instance = {}", targetVersion, instances);
                    return null;
                }
            }
            List<Instance> clusterMetadataMatchInstances = metadataMatchInstances;
            // 如果配置了集群名称，需筛选同集群下元数据匹配的实例
            if (StringUtils.isNotBlank(clusterName)) {
                clusterMetadataMatchInstances = metadataMatchInstances.stream()
                        .filter(instance -> Objects.equals(clusterName, instance.getClusterName()))
                        .collect(Collectors.toList());
                if (CollectionUtils.isEmpty(clusterMetadataMatchInstances)) {
                    clusterMetadataMatchInstances = metadataMatchInstances;
                    log.warn("发生跨集群调用, clusterName = {}, targetVersion = {}, clusterMetadataMatchInstances = {}", clusterName, targetVersion, clusterMetadataMatchInstances);
                }
            }
            Instance instance = ExtendBalancer.getHostByRandomWeight2(clusterMetadataMatchInstances);
            return new NacosServer(instance);
        } catch (Exception e) {
            log.error("发生异常", e);
            return null;
        }
    }
    @Override
    public void initWithNiwsConfig(IClientConfig iClientConfig) {
    }
}
```

application.properties/yml配置文件配置：

```bash
#配置服务的元数据
spring.cloud.nacos.discovery.metadata.version=v2
spring.cloud.nacos.discovery.metadata.token=123456
spring.cloud.nacos.discovery.metadata.clientId=101
```

## 6、 Nacos不能跨namespace调用

消费者和提供者的命名空间必须相同才能调用，不能跨命名空间进行调用，命名空间可以实现服务的完全隔离

```bash
#服务消费者的dev命名空间
spring.cloud.nacos.discovery.namespace=b91111e4-8a21-4c12-9a3f-cf40d93a8319
#服务提供者1的dev命名空间
spring.cloud.nacos.discovery.namespace=b91111e4-8a21-4c12-9a3f-cf40d93a8319
#服务提供者2的test命名空间
spring.cloud.nacos.discovery.namespace=921723b6-cc51-4f7d-ad2c-ab0be7836774
```
