# 08、Nepxion 教程 - Discovery 之配置中心支持灰度配置
- 来源：https://ddkk.com/zhuanlan/j2ee/nepxion/1/8.html
- 分类：J2EE框架
- 分组：Nepxion 教程
`Nepxion Discovery` 对于服务灰度发布参数支持：外置`Header`、 `Parameter`、`Cookie`、`域名`规则策略驱动。并且还内置本地和远程、局部和全局规则策略驱动。并且还支持正则表达式以及通配表达式支持。并且`Nepxion Discovery`支持`Spring Cloud Gateway`、`Zuul网关`和`微服务`三大模式的灰度发布和路由等一系列功能。 所以`Nepxion Discovery` 对于灰度发布的支持场景还是很丰富的，基本能够满足生产的大多数场景。关于`Nepxion Discovery`的策略博主准备分解成三篇文章来讲解：

- 配置中心对灰度的配置：包括初始化、对不同配置中心的适配以及配置中心策略变更的通知
- 服务灰度发布参数的支持：包含上面外置、内置规则策略驱动以及参数的优先级
- 对网关和微服务三大模式的支持：包含不同模式对下游参数的传递以及如何进行负载均衡的

## 1、服务初始化加载灰度配置

要分析配置中心对服务灰度发布的参数配置，我们就需要分析 `discovery-plugin-config-center` 这个模块。在这个里面包含以下几个子模块：

```java
+ discovery-plugin-config-center
	└ discovery-plugin-config-center-starter        【配置中心的starter】
	└ discovery-plugin-config-center-starter-apollo 【配置中心的Apollo Starter】
	└ discovery-plugin-config-center-starter-nacos  【配置中心的Nacos Starter】
	└ discovery-plugin-config-center-starter-redis  【配置中心的Redis Starter】
```

在`discovery-plugin-config-center-starter` 项目中有一个自动配置类：`ConfigAutoConfiguration`，下面我们来看一下这个类。

> ConfigAutoConfiguration.java

```java
@Configuration
public class ConfigAutoConfiguration {
    @Autowired
    private PluginContextAware pluginContextAware;
    @Bean
    public PluginConfigParser pluginConfigParser() {
        String configFormat = pluginContextAware.getConfigFormat();
        if (StringUtils.equals(configFormat, DiscoveryConstant.XML_FORMAT)) {
            return new XmlConfigParser();
        } else if (StringUtils.equals(configFormat, DiscoveryConstant.JSON_FORMAT)) {
            return new JsonConfigParser();
        }
        throw new DiscoveryException("Invalid config format for '" + configFormat + "'");
    }
    @Bean
    public LocalConfigLoader localConfigLoader() {
        return new LocalConfigLoader() {
            @Override
            protected String getPath() {
                return pluginContextAware.getConfigPath();
            }
        };
    }
    @Bean
    public ConfigInitializer configInitializer() {
        return new ConfigInitializer();
    }
    @Bean
    public ConfigContextClosedHandler configContextClosedHandler() {
        return new ConfigContextClosedHandler();
    }
    @Bean
    public ConfigLogger configLogger() {
        return new ConfigLogger();
    }
}
```

这个类其实挺简单的，它配置了一下配置中心灰度配置参数相关的组件：

- PluginConfigParser：配置中心规则配置解析器，默认使用 XML 也就是 XmlConfigParser 进行解析，可以使用 spring.application.config.format 参数来对它进行修改。可选择的值有：xml 或者 json，都是小写
- LocalConfigLoader：配置中心不仅支持对远程配置的支持同时也支持本地文件配置。可以使用spring.application.config.path参数来对它进行修改。
- ConfigInitializer：服务初始化的时候进行灰度参数配置的初始化类
- ConfigContextClosedHandler： Spring 容器关闭回调类，释放一些资源
- ConfigLogger：灰度配置日志相关的类，打印灰度参数变量之类的操作日志

其它的组件比较简单，最核心的逻辑其实就是 ConfigInitializer 初始化灰度配置规则。在 ConfigInitializer#initialize 方法上添加了 @PostConstruct，所以容器初始化的时候就会调用该方法。如果 spring.application.register.control.enabled 与 spring.application.discovery.control.enabled 这两个参数都为 false 就不会在初始化灰度配置规则，它两默认值都是 true。

首先这个类会先去获取远程配置中心的路由配置规则。

在`Nepxion Discovery` 框架中抽象了 `ConfigLoader` 接口用于灰度配置规则加载，它的类继承结构如下所示：

配置加载分为本地规则以及远程规则。本地规则默认会加载 `classpath:rule.xml`，可以通过 `spring.application.config.path` 进行配置。

远程配置中心同时提供了对配置中心配置修改订阅以及取消订单的监听。

> RemoteConfigLoader.java

```java
public abstract class RemoteConfigLoader implements ConfigLoader {
    public abstract void subscribeConfig();
    public abstract void unsubscribeConfig();
}
```

在这里我们先分析加载配置中 心配置的灰度规则，对于对配置中心对灰度规则配置修改的监听我们后面的章节进行分析。对于远程配置，`Nepxion Discovery` 分为两个概念，一个是局部规则和全局规则。通过 `ConfigAdapter` 的 `getConfigList` 方法进行获取。

> ConfigAdapter.java

```java
public abstract class ConfigAdapter extends RemoteConfigLoader {
    @Override
    public String[] getConfigList() throws Exception {
        String[] configList = new String[2];
        configList[0] = getConfig(false);
        configList[1] = getConfig(true);
        return configList;
    }
    public String getConfig(boolean globalConfig) throws Exception {
        String group = getGroup();
        String dataId = getDataId(globalConfig);
        String config = getConfig(group, dataId);
        if (StringUtils.isNotEmpty(config)) {
            configLogger.logFound(globalConfig);
        } else {
            configLogger.logNotFound(globalConfig);
        }
        return config;
    }
    public String getDataId(boolean globalConfig) {
        String group = getGroup();
        String serviceId = getServiceId();
        return globalConfig ? group : serviceId;
    }
    public abstract String getConfig(String group, String dataId) throws Exception;
	....
}
```

在获取远程配置的时候，`Nepxion Discovery` 通过 `group` 和 `dataId` 从不同的配置中心获取配置。`group` 是就元数据(metadata)中的 `group` 字段。比如 nacos 的配置为：`spring.cloud.nacos.discovery.metadata.group=discovery-guide-group` 它的 `group` 就是`discovery-guide-group`。而 dataId 会根据是局部规则和全局规则区分。如果是全局规则 `dataId` 就和之前的 `group` 值一样，如果是局部规则的话就是服务的 `serviceId` 全体字符小写。在 nacos 中 `serviceId` 默认是 `spring.application.name`，同样的可以通过 `spring.cloud.nacos.discovery.service` 进行配置。

最后在`ConfigAdapter` 通过 `String getConfig(String group, String dataId)` 抽象方法对 Nacos、Apollo 以及 Redis 这 3 个配置中心，通过 `group` 以及 `dataId`获取配置进行了抽象。在这里主要是分析 Nacos 配置中心的实现，对于 Apollo 与 Redis 大家可以自行了解，原理都是类似的。

> NacosConfigAdapter

```java
public class NacosConfigAdapter extends ConfigAdapter {
    @Autowired
    private NacosOperation nacosOperation;
    @Override
    public String getConfig(String group, String dataId) throws Exception {
        return nacosOperation.getConfig(group, dataId);
    }
	...
}
```

上面直接调用 `NacosOperation` 进行 Nacos 注册中心操作，而在 `discovery-commons` 下面分别封装 Nacos、Apollo、 Redis 的通用操作逻辑。

```java
+ discovery-commons
	└ discovery-common        【通用模块】
	└ discovery-common-apollo 【封装Apollo通用操作逻辑】
	└ discovery-common-nacos  【封装Nacos通用操作逻辑】
	└ discovery-common-redis  【封装Redis通用操作逻辑】
```

这个里面直接操作不同的注册中心。 `NacosOperation` 会直接调用 `com.alibaba.nacos.api.config.ConfigService` 这个 Nacos 框架里面的类了。

我们再次回到 `ConfigInitializer` 这个灰度路由策略初始化类，它会分别通过 `PluginConfigParser` 这个策略配置类对远程局部配置、远程全局配置以及本地文件进行解析，分别把值保存到 `PluginAdapter` 对象当中。

- 解析远程局部配置，把解析后的值塞到 RuleCache 这个以 Caffeine 为缓存的 key 为 dynamic-partial-rule当中
- 解析远程全局配置，把解析后的值塞到 RuleCache 这个以 Caffeine 为缓存的 key 为 dynamic-global-rule当中
- 解析本地文件配置，把解析后的值塞到 RuleCache 这个以 Caffeine 为缓存的 key 为 rule当中

并且在初始化配置完成的时候，会判断是否触发 `fireParameterChanged` 的 `EventBus` 事件。关于 `EventBus` 事件，会在后面的小节中进行分析。

## 2、PluginAdapter

从上面对于灰度远程配置中心以及本地文件的分析当中我们可以看到 `PluginAdapter` 这个接口对象。这个接口里面定义的方法有点多，里面的方法基本都是获取参数。我们先来看一下它的实现类 `AbstractPluginAdapter`。我们先来看一下这个类的持有对象。

> AbstractPluginAdapter.java

```java
public abstract class AbstractPluginAdapter implements PluginAdapter {
    @Autowired
    protected Registration registration;
    @Autowired
    protected PluginCache pluginCache;
    @Autowired(required = false)
    protected PluginContextHolder pluginContextHolder;
    @Autowired
    protected RuleCache ruleCache;
    @Autowired(required = false)
    protected ApplicationInfoAdapter applicationInfoAdapter;
	...
}
```

通过这个类的持有对象我们就可以分析得出这个接口可以获取哪些参数。

- Registration：Spring Cloud 对服务注册的抽象的注册类，包含服务的信息
- PluginCache：对服务的版本进行动态管理，也就是远程配置中心可以配置服务的版本
- PluginContextHolder：这个对象有点强大，它主要是支持外置Header、 Parameter、Cookie、域名规则策略驱动，以及对 PluginAdapter 配置的路由规则进行优先级处理。而现在这个对象在 AbstractPluginAdapter 里面主要是获取服务的跟踪信息，仅此而已。
- RuleCache：支持内置本地和远程、局部和全局规则策略驱动
- ApplicationInfoAdapter：获取应用的 appId 信息

上面的获取信息操作基本都挺简单的，主要是针对`PluginContextHolder` 的处理有点复杂。这篇文章主要是对配置中心这个主题进行探讨，`PluginContextHolder` 的处理内容准备放在下一篇博客里面进行讲解。

现在大家只需要知道`PluginContextHolder`：这个对象有点强大，它主要是支持外置`Header`、 `Parameter`、`Cookie`、`域名`规则策略驱动，并且这个类还对 `StrategyWrapper` 这个配置中心的的规则策略以及条件策略类进行处理。

针对不同的注册中心获取元数据的方式不是一样的，以下是 Nacos 配置中心获取元数据的方法：

## 3、使用 Guava EventBus 进行配置变更事件监听

当注册中心的灰度路由规则进行了修改操作，那么启动的服务实例里面的路由策略也应该相应的进行修改。

`Nepxion Discovery` 框架在这里使用了 Guava 中的 EventBus 对配置中心规则修改以及服务内部策略的监听修改进行了解耦。

### 3.1 Guava EventBus 简单 Demo

首先需要定义一个事件。

> TestEvent.java

```java
public class TestEvent {
    private final String message;
    public TestEvent(String message) {
        this.message = message;
    }
    public String getMessage() {
        return message;
    }
}
```

接着就需要定义一个监听器，监听上面的定义的事件，并且对获取到的事件进行相应的处理。在需要对事件进行处理的方法上面添加 `@Subscribe` 注解就可以了。

> EventListener.java

```java
public class EventListener {
    private String message;
    @Subscribe
    public void listen(TestEvent event) {
        String message = event.getMessage();
        System.out.println("receipt Message : " + message);
    }
}
```

最后，定义一个 `EventBus` 并指定它的标识符，把上面定义的监听器注册到 `EventBus` 中，最后再 `EventBus` 中发布一个事件。注册在 `EventBus` 上的监听器就可以监听到这个事件了。

```java
public class TestEventBus {
    @Test
    public void testReceiveEvent() throws Exception {
        EventBus eventBus = new EventBus("test");
        EventListener listener = new EventListener();
        eventBus.register(listener);
        eventBus.post(new TestEvent("this is a test message"));
    }
}
```

运行结果如下：

### 3.2 @EventBus

在`Nepxion Discovery` 框架中通过 `@EventBus` 把 guava 的 EventBus 和 Spring Bean 有机的结合了起来。

> @EventBus

```java
@Target({
      ElementType.TYPE })
@Retention(RetentionPolicy.RUNTIME)
@Inherited
@Documented
public @interface EventBus {
    /**
     * 事件标识
     * @return identifier
     */
    String identifier() default EventConstant.SHARED_CONTROLLER;
    /**
     * 事件是否采用异步执行
     * @return boolean
     */
    boolean async() default true;
}
```

这个注解里面可以定义 EventBus 的事件标识以及事件的执行方式(同步 or 异步)。然后通过 Spring 对 bean 的扩展 `BeanPostProcessor` 对标注 `@EventBus` 的对象进行增强。

> EventBeanPostProcessor.java

```java
public class EventBeanPostProcessor implements BeanPostProcessor {
    @Autowired
    private EventControllerFactory eventControllerFactory;
    @Override
    public Object postProcessBeforeInitialization(Object bean, String beanName) throws BeansException {
        return bean;
    }
    @Override
    public Object postProcessAfterInitialization(Object bean, String beanName) throws BeansException {
        if (bean.getClass().isAnnotationPresent(EventBus.class)) {
            EventBus eventBusAnnotation = bean.getClass().getAnnotation(EventBus.class);
            String identifier = eventBusAnnotation.identifier();
            boolean async = eventBusAnnotation.async();
            eventControllerFactory.getController(identifier, async).register(bean);
        }
        return bean;
    }
}
```

当Spring Bean 标注了 `@EventBus` 实例化之后，通过事件标识以及执行方式获取 `EventController` 把这个 bean 注册到，也就是这个监听器注册到 `EventBus` 中。这样标注 `@EventBus` 注解的 Spring Bean 中标注`@Subscribe` 就对它的方法中的事件具有监听功能了。

在`Nepxion Discovery` 框架中，`PluginSubscriber` 这个对象上面就标注了 `@EventBus` 注解。它里面的所有公有方法也都标注了 `@Subscribe` 注解，所以这些方法都会监听方法中对应参数的事件。

- void onRuleUpdated(RuleUpdatedEvent ruleUpdatedEvent)：处理配置中心策略发生变更事件
- void onRuleCleared(RuleClearedEvent ruleClearedEvent)：处理配置中心策略发生清除事件
- void onVersionUpdated(VersionUpdatedEvent versionUpdatedEvent)：处理配置中心版本发生变更事件
- void onVersionCleared(VersionClearedEvent versionClearedEvent)：处理配置中心版本发生清除事件

当策略或者版本发生变更(删除也是一种变更)，除了更新 `PluginAdapter` 对象里面的值，同时也要修改 `LoadBalancer` 中的服务信息。

在这里进行了事件的监听，那么在哪里进行事件的发布呢？

### 3.3 配置中心变更发布事件

其实在远程配置中心加载的时候，对远程配置中心也添加了监听器。以 Nacos 远程配置中心为例。当 NacosConfigAdapter 在这个 bean 进行初始化的时候，在它里面标注了 @PostConstruct 的方法NacosConfigAdapter#subscribeConfig() 也会被调用。

> NacosConfigAdapter.java

```java
public class NacosConfigAdapter extends ConfigAdapter {
    @PostConstruct
    @Override
    public void subscribeConfig() {
        partialListener = subscribeConfig(false);
        globalListener = subscribeConfig(true);
    }
    private Listener subscribeConfig(boolean globalConfig) {
        String group = getGroup();
        String dataId = getDataId(globalConfig);
        configLogger.logSubscribeStarted(globalConfig);
        try {
            return nacosOperation.subscribeConfig(group, dataId, executorService, new NacosSubscribeCallback() {
                @Override
                public void callback(String config) {
                    callbackConfig(config, globalConfig);
                }
            });
        } catch (Exception e) {
            configLogger.logSubscribeFailed(e, globalConfig);
        }
        return null;
    }
	......
}
```

它会同时初始化对局部规则策略和全局规则策略的监听，向 Nacos 框架的 `ConfigService` 中 `NacosSubscribeCallback` 回调函数。最终整个配置中心策略变更发布事件的时序图如下：

然后上面提到标注`@EventBus` 注解的 `PluginSubscriber` 这个对象监听到配置中心策略配置发生了变更。就会更新到当前的服务的 `PluginAdapter` 对象当中。
