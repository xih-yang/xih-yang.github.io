# 03、Nepxion 教程 - Discovery 项目结构简介
- 来源：https://ddkk.com/zhuanlan/j2ee/nepxion/1/3.html
- 分类：J2EE框架
- 分组：Nepxion 教程
`Nepxion Discovery` 项目的 github 地址为：[https://github.com/Nepxion/Discovery](https://github.com/Nepxion/Discovery)。以下分析基于: `Nepxion Discovery` 版本号：`6.4.0-SNAPSHOT`

Discovery【探索】微服务框架，基于Spring Cloud Discovery服务注册发现、Ribbon负载均衡、Feign和RestTemplate调用等组件全方位增强的企业级微服务开源解决方案，更贴近企业级需求，更具有企业级的插件引入、开箱即用特征。它的功能在官网上面介绍得非常清楚，在这里就不在赘述了。下面我们来分析一下 Nepxion Discovery 框架的包结构。在分析源码之前，我们先对这个框架有一个宏观的认识。

```java
+ Discovery
	└ discovery-commons
	└ discovery-console
	└ discovery-plugin-admin-center
	└ discovery-plugin-config-center
	└ discovery-plugin-framework
	└ discovery-plugin-register-center
	└ discovery-plugin-strategy
	└ discovery-plugin-test
	└ discovery-springcloud-examples
```

这个项目有 9 个子项目，有些子项目是单个的，还有一些子项目下面还有子项目。我们先来分析这 Discovery 框架下的这 9 个子项目。如果下面有下面还有子项目的我们遇到了会具体分析。

## 1、discovery-commons

discovery-commons 是 discovery 框架的公用模块，这个模块下面还包含了以下几个模块：

```java
+ discovery-commons
	└ discovery-common
	└ discovery-common-apollo
	└ discovery-common-nacos
	└ discovery-common-redis
```

discovery-common 是框架里面最最基础的功能。里面包含了框架里面使用到的下面几中类型的值。

- 框架常量：比如支持灰度的一些参数、以及激活一些配置的配置参数常量值。这些值都在 com.nepxion.discovery.common.constant.DiscoveryConstant 这个类里面。
- 框架模型类，这些类都在包：com.nepxion.discovery.common.entity 包。包含灰度发布需要的参数 ：RouterEntity 路由模型等待
- 框架使用的一些工具类：基本在上包com.nepxion.discovery.common.util中，以及框架异常定义等。

之前的文章中我们提到 Nepxion Discovery 的灰度参数可以支持 http header 的形式，同时也支持全局配置。另外的 3 个 module discovery-common-xxx ，就是支持全局配置。当apollo 、 nacos 或者 redis 这三个全局配置发生变更时，会通知给 Nepxion Discovery。把变化的参数通知到 Nepxion Discovery 内存当中。

这三个module 里面都有 4 个类：

- XXXAutoConfiguration：不同配置中心的自动配置
- XXXConstant：不同配置中心通知相关常量
- XXXSubscribeCallback：不同配置的监听回调类
- XXXOperation：配置中心的操作类，当配置中心发生改变时会调用 XXXSubscribeCallback 这个回调类

可以看到对如不同的配置中心 Nepxion Discovery 的抽象方式都是一样的。所以如果上面这三种配置中心不满足于你的情况，你还可以自定义自己需要的配置中心。

## 2、discovery-console

`discovery-console` 是控制平台目录，里面包含 4 个子模块：

```java
+ discovery-console
	└ discovery-console-starter        【控制平台的starter】
	└ discovery-console-starter-apollo 【控制平台的Apollo Starter】
	└ discovery-console-starter-nacos  【控制平台的Nacos Starter】
	└ discovery-console-starter-redis  【控制平台的Redis Starter】
```

主要是通过`discovery-console-starter` 这个基础控制模块里面的`ConsoleEndpoint` 这个控制台接口提供 restful 接口来修改远程注册中心里面的配置。然后在抽象了 `ConfigAdapter` 这个接口。它的定义如下：

```java
public interface ConfigAdapter {
    boolean updateConfig(String group, String serviceId, String config) throws Exception;
    boolean clearConfig(String group, String serviceId) throws Exception;
    String getConfig(String group, String serviceId) throws Exception;
    String getConfigType();
}
```

包含了修改配置，清除配置以及获取配置这3个核心的方法。然后 discovery-console-starter-xxx 分别对应不同注册中心的不同实现。如果大家需要其它的配置中心也样的也可以实现 `ConfigAdapter` 接口来进行扩展

## 3、discovery-plugin-admin-center

`discovery-plugin-admin-center` 是管理中心目录，里面只有一个子 module ：`discovery-plugin-admin-center-starter` 也就是管理中心的Starter。它提供了以下 restful 功能：

- ConfigEndpoint：配置接口，可以推送更新规则配置信息、清除更新的规则配置信息以及查看本地和更新的规则配置信息
- GitEndpoint：Git信息接口，可以获取Git信息的Map格式、获取Git信息的文本格式
- InspectorEndpoint：全链路侦测接口，可以侦测全链路路由
- RouterEndpoint：路由接口,获取服务注册中心的服务列表、获取本地节点信息以及获取全路径的路由信息树
- SentinelCoreEndpoint：哨兵核心接口，可以流控规则、降级规则、授权规则进行修改与查看
- SentinelParamEndpoint：哨兵参数接口，可以对热点参数流控规则列表进行修改与查看
- StrategyEndpoint：策略接口，可以校验策略的条件表达式以及校验策略的全链路路由
- VersionEndpoint：版本接口，可以对服务的版本进行修改与查看

## 4、discovery-plugin-config-center

`discovery-plugin-config-center` 是配置中心目录，里面包含的目录如下：

```java
+ discovery-plugin-config-center
	└ discovery-plugin-config-center-starter        【配置中心的starter】
	└ discovery-plugin-config-center-starter-apollo 【配置中心的Apollo Starter】
	└ discovery-plugin-config-center-starter-nacos  【配置中心的Nacos Starter】
	└ discovery-plugin-config-center-starter-redis  【配置中心的Redis Starter】
```

discovery-plugin-config-center-starter 包含了对本地以及远程的灰度信息配置的管理。在服务启动时会调用 ConfigInitializer#initialize 这个方法加载本地或者远程服务的灰度配置信息。定义了远程服务加载的接口

`RemoteConfigLoader`，另外 3 个模块都是对它进行实现。

```java
public abstract class RemoteConfigLoader implements ConfigLoader {
	...
}
public abstract class ConfigAdapter extends RemoteConfigLoader {
	...
}
```

同时灰度配置中心的配置支持 xml 以及 json 格式，默认远程配置的参数使用 xml 解析。可以在环境变量中设置 `spring.application.config.format` 为 json，配置中心设置灰度参数就可以使用 json 格式。

别外3 个 module 就是通过实现 `ConfigAdapter` 分别实现 Apollo 、Nacos 以及 Redis 这 3 个配置中心的远程配置的解析。

## 5、discovery-plugin-framework

discovery-plugin-framework 是基本框架目录，这个项目下面只有一个 module，如下图所示：

```java
+ discovery-plugin-framework
	└ discovery-plugin-framework-starter        【基本框架的Starter】
```

它支持Eureka、Consul、Nacos、Zookeeper 注册中心。

里面包含了灰度框架的核心功能。`PluginAdapter` 抽象出了灰度发布需要哪些参数，并且在 framework 通过 `AbstractPluginAdapter` 里面通过 `org.springframework.cloud.client.serviceregistry.Registration`获取了服务里面的信息。 Spring Cloud 里面有一个概念那就是元数据，Nepxion Discovery 在服务启动的时候会把灰度发布需要的元数据信息通过扩展注册中心客户端把信息保存到注册中心的元数据里面。

核心框架里面还把提供了一个 Listener 扩展，以及实现灰度发布的核心就是抽象了接口: `WeightRandomLoadBalance` 实现对负载均衡功能的重写，使得灰度发布的功能可以实现。

## 6、discovery-plugin-register-center

`discovery-plugin-register-center` 是注册中心目录，下面包含 5 个子 module：

```java
+ discovery-plugin-register-center
	└ discovery-plugin-register-center-starter           【注册中心的Starter】
	└ discovery-plugin-register-center-starter-eureka    【注册中心的Eureka Starter】
	└ discovery-plugin-register-center-starter-consul    【注册中心的Consul Starter】
	└ discovery-plugin-register-center-starter-zookeeper 【注册中心的Zookeeper Starter】
	└ discovery-plugin-register-center-starter-nacos     【注册中心的Nacos Starter】
```

`discovery-plugin-register-center-starter` 是一个空项目，只是在 pom 里面引用了基本框架的Starter(`discovery-plugin-framework-starter`) 以及 配置中心的Starter(`discovery-plugin-config-center-starter`)。

剩下的模块就是Nepxion Discovery 框架对于不同的注册中心的支持，支持以下 4 种配置中心：

- Eureka
- Consul
- Zookeeper
- Nacos

都是通过 Spring Cloud 对于注册中心的抽象，在配置中心里面都会有元数据，当服务注册的时候会把元数据添加到注册中心里面去。 `PluginApplicationContextInitializer` 实现了`ApplicationContextInitializer` 接口，在 Spring 上下文初始化的时候会添加一个 BeanPostProcessor。

```java
public abstract class PluginApplicationContextInitializer implements ApplicationContextInitializer<ConfigurableApplicationContext>, Ordered {
    @Override
    public void initialize(ConfigurableApplicationContext applicationContext) {
         applicationContext.getBeanFactory().addBeanPostProcessor(new InstantiationAwareBeanPostProcessorAdapter() {
            @Override
            public Object postProcessAfterInitialization(Object bean, String beanName) throws BeansException {
                if (bean instanceof DiscoveryClient) {
                    DiscoveryClient discoveryClient = (DiscoveryClient) bean;
                    return new DiscoveryClientDecorator(discoveryClient, applicationContext);
                } else {
                    return afterInitialization(applicationContext, bean, beanName);
                }
            }
        });
	}
```

它会在匿名内部类 BeanPostProcessor#postProcessAfterInitialization方法中调用抽象方法afterInitialization()，不同的注册中心会实现这个afterInitialization()抽象方法，把元数据添加到注册中心里面去。

## 7、discovery-plugin-strategy

`discovery-plugin-strategy` 是 路由策略目录，下面包含以下几个 module：

```java
+ discovery-plugin-strategy
	└ discovery-plugin-strategy-starter                         【路由策略的Starter】
	└ discovery-plugin-strategy-starter-service                 【路由策略在微服务端的Starter】
	└ discovery-plugin-strategy-starter-service-sentinel        【路由策略在微服务端的Sentinel Starter】
	└ discovery-plugin-strategy-starter-zuul                    【路由策略在Zuul网关端的Starter】
	└ discovery-plugin-strategy-starter-gateway                 【路由策略在Spring Cloud Gateway网关端的Starter】
	└ discovery-plugin-strategy-starter-hystrix                 【路由策略下，Hystrix做线程模式的服务隔离必须引入插件的Starter】
	└ discovery-plugin-strategy-starter-opentelemetry           【路由策略的OpenTelemetry调用链的Starter】
	└ discovery-plugin-strategy-starter-opentracing             【路由策略的OpenTracing调用链的Starter】
	└ discovery-plugin-strategy-starter-skywalking              【路由策略的SkyWalking调用链的Starter】
	└ discovery-plugin-strategy-starter-sentinel                【路由策略的Sentinel Starter】
	└ discovery-plugin-strategy-starter-sentinel-local          【路由策略的Sentinel Local配置订阅的Starter】
	└ discovery-plugin-strategy-starter-sentinel-apollo         【路由策略的Sentinel Apollo配置订阅的Starter】
	└ discovery-plugin-strategy-starter-sentinel-nacos          【路由策略的Sentinel Nacos配置订阅的Starter】
	└ discovery-plugin-strategy-starter-sentinel-monitor        【路由策略的Sentinel监控抽象的Starter】
	└ discovery-plugin-strategy-starter-sentinel-opentelemetry  【路由策略的Sentinel OpenTelemetry调用链的Starter】
	└ discovery-plugin-strategy-starter-sentinel-opentracing    【路由策略的Sentinel OpenTracing调用链的Starter】
	└ discovery-plugin-strategy-starter-sentinel-skywalking     【路由策略的Sentinel SkyWalking调用链的Starter】
```

这个是Nepxion Discovery 灰度发布对各个中间件的支持。具体是如何支持的大家可以看源码实现，这里就不做过多阐述了。

## 8、discovery-plugin-test

`discovery-plugin-test`是测试模块目录，里面只有一个 module 那就是 `discovery-plugin-test-starter(自动化测试的Starter)`。只需要运行 `TestApplication` 这个 Spring Boot 应该就可以进行单元测试了。

## 9、discovery-springcloud-examples

`discovery-springcloud-examples` 是示例目录，它下面有以下几个子 module：

```java
+ discovery-springcloud-examples
	└ discovery-springcloud-example-admin           【Spring Boot Admin服务台示例】
	└ discovery-springcloud-example-console         【控制平台示例】
	└ discovery-springcloud-example-eureka          【Eureka服务器示例】
	└ discovery-springcloud-example-service         【微服务示例】
	└ discovery-springcloud-example-zuul            【Zuul网关示例】
	└ discovery-springcloud-example-gateway         【Spring Cloud Gateway网关示例】
```

这个上面就是不同类型的项目是如何集成 Nepxion Discovery 。
