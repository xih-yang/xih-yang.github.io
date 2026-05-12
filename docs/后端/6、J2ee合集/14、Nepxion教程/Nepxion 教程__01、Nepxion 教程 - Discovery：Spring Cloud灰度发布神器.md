# 01、Nepxion 教程 - Discovery：Spring Cloud灰度发布神器
- 来源：https://ddkk.com/zhuanlan/j2ee/nepxion/1/1.html
- 分类：J2EE框架
- 分组：Nepxion 教程
Nepxion Discovery是一款对Spring Cloud服务注册发现和负载均衡的增强中间件，其功能包括灰度发布（包括切换发布和平滑发布），黑/白名单的IP地址过滤，限制注册，限制发现等，支持Eureka、Consul和Zookeeper，支持Spring Cloud Api Gateway（Finchley版）、Zuul网关和微服务的灰度发布，支持用户自定义和编程灰度路由策略，支持多数据源的数据库灰度发布等客户特色化灰度发布，支持Nacos和Redis为远程配置中心，同时兼容Spring Cloud Edgware版和Finchley版。

## 1、现有Spring Cloud微服务痛点

- 如果你是运维负责人，是否会经常发现，你掌管的测试环境中的服务注册中心，被一些不负责的开发人员把他本地开发环境注册上来，造成测试人员测试失败。你希望可以把本地开发环境注册给屏蔽掉，不让注册。
- 如果你是运维负责人，生产环境的某个微服务集群下的某个实例，暂时出了问题，但又不希望它下线。你希望可以把该实例给屏蔽掉，暂时不让它被调用。
- 如果你是业务负责人，鉴于业务服务的快速迭代性，微服务集群下的实例发布不同的版本。你希望根据版本管理策略进行路由，提供给下游微服务区别调用，例如访问控制快速基于版本的不同而切换，例如在不同的版本之间进行流量调拨。
- 如果你是业务负责人，希望灰度发布功能可以基于业务场景特色定制，例如根据用户手机号进行不同服务器的路由。
- 如果你是DBA负责人，希望灰度发布功能可以基于数据库切换上。
- 如果你是测试负责人，希望对微服务做A/B测试，那么通过动态改变版本达到该目的。

## 2、Spring Cloud微服务痛点场景表现

### 2.1 黑/白名单的IP地址注册的过滤

开发环境的本地微服务（例如IP地址为172.16.0.8）不希望被注册到测试环境的服务注册发现中心，那么可以在配置中心维护一个黑/白名单的IP地址过滤（支持全局和局部的过滤）的规则。

我们可以通过提供一份黑/白名单达到该效果。

### 2.2 最大注册数的限制的过滤

当某个微服务注册数目已经达到上限（例如10个），那么后面起来的微服务，将再也不能注册上去。

### 2.3 黑/白名单的IP地址发现的过滤

开发环境的本地微服务（例如IP地址为172.16.0.8）已经注册到测试环境的服务注册发现中心，那么可以在配置中心维护一个黑/白名单的IP地址过滤（支持全局和局部的过滤）的规则，该本地微服务不会被其他测试环境的微服务所调用。

我们可以通过推送一份黑/白名单达到该效果。

### 2.4 多版本访问的灰度控制

A服务调用B服务，而B服务有两个实例（B1、B2），虽然三者有相同的服务名，但功能上有差异，需求是在某个时刻，A服务只能调用B1，禁止调用B2。在此场景下，我们在application.properties里为B1维护一个版本为1.0，为B2维护一个版本为1.1。

我们可以通过推送A服务调用某个版本的B服务对应关系的配置，达到某种意义上的灰度控制，改变版本的时候，我们只需要再次推送即可。

### 2.5 多版本权重的灰度控制

上述场景中，我们也可以通过配对不同版本的权重（流量比例），根据需求，A访问B的流量在B1和B2进行调拨。

### 2.6 多数据源的数据库灰度控制

我们事先为微服务配置多套数据源，通过灰度发布实时切换数据源。

### 2.7 动态改变微服务版本

在A/B测试中，通过动态改变版本，不重启微服务，达到访问版本的路径改变。

用户自定义和编程灰度路由策略，可以通过非常DDKK.COM 弟弟快看，程序员编程资料站达到如下效果：

- 我们可以在网关上根据不同的Token查询到不同的用户，把请求路由到指定的服务器。
- 我们可以在服务上根据不同的业务参数，例如手机号或者身份证号，把请求路由到指定的服务器。

## 3、Nepxion Discovery概念和功能介绍

Nepxion Discovery是一款对Spring Cloud服务注册发现和负载均衡的增强中间件，其功能包括灰度发布（包括切换发布和平滑发布），黑/白名单的IP地址过滤，限制注册，限制发现等，支持Eureka、Consul和Zookeeper，支持Spring Cloud Api Gateway（Finchley版）、Zuul网关和微服务的灰度发布，支持用户自定义和编程灰度路由策略，支持Nacos和Redis为远程配置中心，同时兼容Spring Cloud Edgware版和Finchley版。

### 3.1 Nepxion Discovery包含功能：

实现对基于Spring Cloud的微服务和Spring Cloud Api Gateway（F版）和Zuul网关的支持：

**1、** 具有极大的灵活性——支持在任何环节做过滤控制和灰度发布；

**2、** 具有极小的限制性——只要开启了服务注册发现，程序入口加了@EnableDiscoveryClient；

**3、** 具有极强的可用性——当远程配置中心全部挂了，可以通过Rest方式进行灰度发布；

实现服务注册层面的控制：

**1、** 基于黑/白名单的IP地址过滤机制禁止对相应的微服务进行注册；

**2、** 基于最大注册数的限制微服务注册一旦微服务集群下注册的实例数目已经达到上限，将禁止后续的微服务进行注册；

实现服务发现层面的控制：

**1、** 基于黑/白名单的IP地址过滤机制禁止对相应的微服务被发现；

**2、** 基于版本号配对，通过对消费端和提供端可访问版本对应关系的配置，在服务发现和负载均衡层面，进行多版本访问控制；

**3、** 基于版本权重配对，通过对消费端和提供端版本权重（流量）对应关系的配置，在服务发现和负载均衡层面，进行多版本流量调拨访问控制；

实现灰度发布：

**1、** 通过版本的动态改变，实现切换灰度发布；

**2、** 是通过版本访问规则的改变，实现切换灰度发布；

**2、** 通过版本权重规则的改变，实现平滑灰度发布；

实现通过XML或者Json进行上述规则的定义。

实现通过事件总线机制（EventBus）的功能，实现发布/订阅功能：

**1、** 对接远程配置中心，集成Nacos和Redis，异步接受远程配置中心主动推送规则信息，动态改变微服务的规则；

**2、** 结合SpringBootActuator，异步接受Rest主动推送规则信息，动态改变微服务的规则，支持同步和异步推送两种方式；

**3、** 结合SpringBootActuator，动态改变微服务的版本，支持同步和异步推送两种方式；

**4、** 在服务注册层面的控制中，一旦禁止注册的条件触发，主动推送异步事件，以便使用者订阅；

实现通过Listener机制进行扩展：

**1、** 使用者可以对服务注册发现核心事件进行监听，实现通过扩展，用户自定义和编程灰度路由策略；

实现通过扩展，用户自定义和编程灰度路由策略：

**1、** 使用者可以实现跟业务有关的路由策略，根据业务参数的不同，负载均衡到不同的服务器；

**2、** 使用者可以根据内置的版本路由策略+自定义策略，随心所欲的达到需要的路由功能；

实现支持Spring Boot Admin的集成。

实现支持未来扩展更多的服务注册中心。

实现控制平台微服务，支持对规则和版本集中管理、推送、更改和删除。

实现基于控制平台微服务的图形化的灰度发布功能。

上述文中提到切换灰度发布和平滑灰度发布，切换灰度发布即在灰度发布的时候，没有过渡过程，流量直接从旧版本切换到新版本；平滑灰度发布即在灰度发布的时候，有个过渡过程，可以根据实际情况，先给新版本分配低额流量，给旧版本分配高额流量，对新版本进行监测，如果没有问题，就继续把旧版的流量切换到新版本上

## 4、Nepxion Discovery规则和策略介绍

现有Spring Cloud微服务可以方便引入Nepxion Discovery，代码零侵入，使用者只需要做如下简单的事情：

**1、** 引入相关依赖到pom.xml；

**2、** 在application.properties或者application.yml中，必须为微服务定义一个版本号（version），必须为微服务自定义一个组名（group）或者应用名（application）；

**3、** 使用者只需要关注相关规则推送可以采用如下方式之一：；

- 通过远程配置中心推送规则
- 通过控制台界面推送规则
- 通过客户端工具（例如Postman）推送

规则示例解释：

> 基于黑/白名单的IP地址过滤机制禁止对相应的微服务进行注册

```java
<register>
	<blacklist>
	    <service service-name="a" filter-value="172.16"/>
	</blacklist>
	<whitelist>
	    <service service-name="a" filter-value="10.10"/>
	</whitelist>
</register>
```

黑名单，表示a服务注册到服务注册发现中心，如果它的IP起始为172.16，那么禁止注册。

白名单，表示a服务注册到服务注册发现中心，如果它的IP起始为10.10，那么允许注册。

> 基于最大注册数的限制微服务注册

```java
<register>
	<count>
	    <service service-name="a" filter-value="500"/>
	</count>
</register>
```

表示a服务注册到服务注册发现中心，当达到500个后，更多的实例将无法注册。

> 基于黑/白名单的IP地址过滤机制禁止对相应的微服务被发现。

```java
<discovery>
	<blacklist>
	    <service service-name="a" filter-value="172.16"/>
	</blacklist>
	<whitelist>
	    <service service-name="a" filter-value="10.10"/>
	</whitelist>
</discovery>
```

黑名单，表示a服务的IP起始为172.16，那么禁止被发现。

白名单，表示a服务的IP起始为10.10，那么允许被发现。

> 服务发现的多版本灰度访问控制。

```java
<discovery>
	<version>
	    <service consumer-service-name="a" provider-service-name="b" consumer-version-value="1.0" provider-version-value="1.0"/>
	    <service consumer-service-name="a" provider-service-name="b" consumer-version-value="1.1" provider-version-value="1.1"/>     
	</version>
</discovery>
```

表示消费端服务a的1.0，允许访问提供端服务b的1.0版本。

表示消费端服务a的1.1，允许访问提供端服务b的1.1版本。

> 服务发现的多版本权重灰度访问控制。

```java
<discovery>
	<weight>
	    <service consumer-service-name="a" provider-service-name="b" provider-weight-value="1.0=90;1.1=10"/>
	</weight>
</discovery>
```

表示消费端服务a访问提供端服务b的时候，提供端服务b的1.0版本提供90%的权重流量，1.1版本提供10%的权重流量。

> 简单的多数据源数据库灰度切换。

```java
<customization>
	<service service-name="discovery-springcloud-example-b" key="database" value="prod"/>
</customization>
```

表示服务b有两个库的配置，分别是临时数据库（database的value为temp）和生产数据库（database的value为prod）。

上线后，一开始数据库指向临时数据库，对应value为temp，然后灰度发布的时候，改对应value为prod，即实现数据库的灰度发布。

**全局架构图:**

**模块结构图：**

## 5、两个基于网关的灰度发布示例

两个基于网关的灰度发布示例，您可以研究更多的灰度发布策略。

### 5.1 基于网关版本权重的灰度发布

**灰度发布前：**

**1、** 网关不需要配置版本；

**2、** 网关->服务A(V1.0)，网关配给服务A(V1.0)的100%权重（流量）；

**灰度发布中：**

**1、** 上线服务A(V1.1)；

**2、** 在网关层调拨10%权重（流量）给A(V1.1)，给A(V1.0)的权重（流量）减少到90%；

**3、** 通过观测确认灰度有效，把A(V1.0)的权重（流量）全部切换到A(V1.1)；

**灰度发布后：**

**1、** 下线服务A(V1.0)，灰度成功；

### 5.2 基于网关版本切换的灰度发布

**灰度发布前：**

**1、** 假设当前生产环境，调用路径为网关(V1.0)->服务A(V1.0)；

**2、** 运维将发布新的生产环境，部署新服务集群，服务A(V1.1)；

**3、** 由于网关(1.0)并未指向服务A(V1.1)，所以它们是不能被调用的；

**灰度发布中：**

**1、** 新增用作灰度发布的网关(V1.1)，指向服务A(V1.1)；

**2、** 灰度网关(V1.1)发布到服务注册发现中心，但禁止被服务发现，网关外的调用进来无法负载均衡到网关(V1.1)上；

**3、** 在灰度网关(V1.1)->服务A(V1.1)这条调用路径做灰度测试；

**4、** 灰度测试成功后，把网关(V1.0)指向服务A(V1.1)；

**灰度发布后：**

**1、** 下线服务A(V1.0)，灰度成功；

**2、** 灰度网关(V1.1)可以不用下线，留作下次版本上线再次灰度发布；

**3、** 如果您对新服务比较自信，可以更简化，可以不用灰度网关和灰度测试，当服务A(V1.1)上线后，原有网关直接指向服务A(V1.1)，然后下线服务A(V1.0)；

## 6、户自定义和编程灰度路由策略

使用者可以实现跟业务有关的路由策略，根据业务参数的不同，负载均衡到不同的服务器。

**1、** 基于服务的编程灰度路由，实现DiscoveryEnabledExtension，通过RequestContextHolder（获取来自网关的Header参数）和ServiceStrategyContext（获取来自RPC方式的方法参数）获取业务上下文参数，进行路由自定义；

**2、** 基于Zuul的编程灰度路由，实现DiscoveryEnabledExtension，通过Zuul自带的RequestContext（获取来自网关的Header参数）获取业务上下文参数，进行路由自定义；

**3、** 基于SpringCloudApiGateway的编程灰度路由，实现DiscoveryEnabledExtension，通过GatewayStrategyContext（获取来自网关的Header参数）获取业务上下文参数，进行路由自定义；

举例如下：

基于Rest请求Header头部自带版本规则的实时动态路由：

> 场景举例：外部->网关->A服务，A服务有a1, a2两个实例，a1和a2是一模一样的两个服务，但a1和a2的区别是连的数据库是不同的。a1对接外部的民生银行通道，a2对接外部的浦发银行通道。那么外部Rest经过网关时，自动根据版本号路由到正确的服务上。

如图所示，当前从Postman发起的请求，当走到example-a服务的时候，只能走1.0版本，到example-b服务的时候，也是1.0版本，到example-c服务的时候，能路由到1.1和1.2版本，下面的打印出来的结果印证了这个路由方式。

加如下代码即可实现该功能：

```java
@Bean
public MyDiscoveryEnabledExtension myDiscoveryEnabledExtension() {
	return new MyDiscoveryEnabledExtension();
} 
```

表示在网关层（以Zuul为例），编程灰度路由策略，如下代码，表示请求的Header中的token包含’abc’，在负载均衡层面，对应的服务示例不会被负载均衡到。

**代码截图：**

//实现了组合策略，版本路由策略+自定义策略

```java
public class MyDiscoveryEnabledExtension implements DiscoveryEnabledExtension {
private static final Logger LOG = LoggerFactory.getLogger(MyDiscoveryEnabledExtension.class);
@Override
public boolean apply(Server server, Map<String, String> metadata) {
    // 对Rest调用传来的Header参数（例如Token）做策略
    return applyFromHeader(server, metadata);
}
// 根据Rest调用传来的Header参数（例如Token），选取执行调用请求的服务实例
private boolean applyFromHeader(Server server, Map<String, String> metadata) {
    RequestContext context = RequestContext.getCurrentContext();
    String token = context.getRequest().getHeader("token");
    // String value = context.getRequest().getParameter("value");
    String serviceId = server.getMetaInfo().getAppName().toLowerCase();
    LOG.info("Zuul端负载均衡用户定制触发：serviceId={}, host={}, metadata={}, context={}", serviceId, server.toString(), metadata, context);
    String filterToken = "abc";
    if (StringUtils.isNotEmpty(token) && token.contains(filterToken)) {
        LOG.info("过滤条件：当Token含有'{}'的时候，不能被Ribbon负载均衡到", filterToken);
        return false;
    }
    return true;
} 
```

表示在服务层，当服务名为discovery-springcloud-example-c，同时版本为1.0，同时参数value中包含’abc’，三个条件同时满足的情况下，在负载均衡层面，对应的服务示例不会被负载均衡到。

代码截图：

//实现了组合策略，版本路由策略+自定义策略

```java
public class MyDiscoveryEnabledExtension implements DiscoveryEnabledExtension {
private static final Logger LOG = LoggerFactory.getLogger(MyDiscoveryEnabledExtension.class);
@Override
public boolean apply(Server server, Map<String, String> metadata) {
    // 对RPC调用传来的方法参数做策略
    return applyFromMethd(server, metadata);
}
```

//根据RPC调用传来的方法参数（例如接口名、方法名、参数名或参数值等），选取执行调用请求的服务实例

```java
@SuppressWarnings("unchecked")
private boolean applyFromMethd(Server server, Map<String, String> metadata) {
    ServiceStrategyContext context = ServiceStrategyContext.getCurrentContext();
    Map<String, Object> attributes = context.getAttributes();
    String serviceId = server.getMetaInfo().getAppName().toLowerCase();
    String version = metadata.get(DiscoveryConstant.VERSION);
    LOG.info("Serivice端负载均衡用户定制触发：serviceId={}, host={}, metadata={}, context={}", serviceId, server.toString(), metadata, context);
    String filterServiceId = "discovery-springcloud-example-b";
    String filterVersion = "1.0";
    String filterBusinessValue = "abc";
    if (StringUtils.equals(serviceId, filterServiceId) && StringUtils.equals(version, filterVersion)) {
        if (attributes.containsKey(ServiceStrategyConstant.PARAMETER_MAP)) {
            Map<String, Object> parameterMap = (Map<String, Object>) attributes.get(ServiceStrategyConstant.PARAMETER_MAP);
            String value = parameterMap.get("value").toString();
            if (StringUtils.isNotEmpty(value) && value.contains(filterBusinessValue)) {
                LOG.info("过滤条件：当serviceId={} && version={} && 业务参数含有'{}'的时候，不能被Ribbon负载均衡到", filterServiceId, filterVersion, filterBusinessValue);
                return false;
            }
        }
    }
    return true;
} 
```

使用者可以通过订阅业务参数的变化，实现特色化的灰度发布，例如，多数据源的数据库切换的灰度发布。

代码截图：

```java
@EventBus
public class MySubscriber {
@Autowired
private PluginAdapter pluginAdapter;
@Subscribe
public void onCustomization(CustomizationEvent customizationEvent) {
    CustomizationEntity customizationEntity = customizationEvent.getCustomizationEntity();
    String serviceId = pluginAdapter.getServiceId();
    if (customizationEntity != null) {
        Map<String, Map<String, String>> customizationMap = customizationEntity.getCustomizationMap();
        Map<String, String> customizationParameter = customizationMap.get(serviceId);
        // 根据customizationParameter的参数动态切换数据源
    } else {
        // 根据customizationParameter的参数动态切换数据源
    }
}
@Subscribe
public void onRegisterFailure(RegisterFailureEvent registerFailureEvent) {
    System.out.println("========== 注册失败, eventType=" + registerFailureEvent.getEventType() + ", eventDescription=" + registerFailureEvent.getEventDescription() + ", serviceId=" + registerFailureEvent.getServiceId() + ", host=" + registerFailureEvent.getHost() + ", port=" + registerFailureEvent.getPort());
} 
```

## 7、用户自定义灰度发布监听

用户实现服务注册的监听，当负服务注册的时候，用户会收到下面的事件。

代码截图：

```java
public class MyRegisterListener extends AbstractRegisterListener {
	@Override
	public void onRegister(Registration registration) {
	}
	@Override
	public void onDeregister(Registration registration) {
	}
	@Override
	public void onSetStatus(Registration registration, String status) {
	}
	@Override
	public void onClose() {
	}
} 
```

用户实现服务发现的监听，当负服务发现过滤的时候，用户会收到下面的事件。

代码截图：

```java
public class MyDiscoveryListener extends AbstractDiscoveryListener {
	@Override
	public void onGetInstances(String serviceId, List<ServiceInstance> instances) {
	}
	@Override
	public void onGetServices(List<String> services) {
	}
} 
```

用户实现负载均衡的监听，当负载均衡启动过滤的时候，用户会收到下面的事件。

代码截图：

```java
public class MyLoadBalanceListener extends AbstractLoadBalanceListener {
	@Override
	public void onGetServers(String serviceId, List<? extends Server> servers) {
	}
} 
```

用户实现对注册失败的监听，当黑名单激活的时候，会触发注册失败，那么用户会收到一个注册失败的事件。

代码截图：

```java
@EventBus
public class MySubscriber {
	@Subscribe
	public void onRegisterFailure(RegisterFailureEvent registerFailureEvent) {
	}
} 
```

图形化灰度发布桌面程序：

具体操作不详细述说了，请看相关视频：

灰度发布-版本访问策略：

请访问[http://www.iqiyi.com/w_19rzwzovrl.html](http://www.iqiyi.com/w_19rzwzovrl.html)，视频清晰度改成720P，然后最大化播放。

灰度发布-版本权重策略：

请访问[http://www.iqiyi.com/w_19rzs9pll1.html](http://www.iqiyi.com/w_19rzs9pll1.html)，视频清晰度改成720P，然后最大化播放。

灰度发布-全链路策略：

请访问[http://www.iqiyi.com/w_19s1e0zf95.html](http://www.iqiyi.com/w_19s1e0zf95.html)，视频清晰度改成720P，然后最大化播放。

## 8、跟Spring Boot Admin整合

实现相关一系列的监控：

以上内容根据2018年8月14日晚微信群分享内容整理。分享人任浩军。DockOne每周都会组织定向的技术分享，欢迎感兴趣的同学加微信：liyingjiesd，进群参与，您有想听的话题或者想分享的话题都可以给我们留言。
