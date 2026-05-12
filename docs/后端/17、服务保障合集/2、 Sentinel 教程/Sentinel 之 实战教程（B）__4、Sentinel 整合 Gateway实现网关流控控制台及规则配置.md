# 4、Sentinel 整合 Gateway实现网关流控控制台及规则配置
- 来源：https://ddkk.com/zhuanlan/guarantee/sentinel/32.html
- 分类：服务保障
- 分组：Sentinel 之 实战教程（B）
## 1、简介

网关是所有请求的公共入口，所以可以在网关进行限流，而且限流的方式也很多，通过Sentinel组件来实现网关的限流。Sentinel支持对SpringCloud Gateway、Zuul等主流网关进行限流。

> 实现限流机制主要由GatewayFlowRule与ApiDefinition两个核心类实现配置：

- **GatewayFlowRule：** 网关限流规则，针对 API Gateway 的场景定制的限流规则，可以针对不同 route 或自定义的 API 分组进行限流，支持针对请求中的参数、Header、来源 IP 等进行定制化的限流。
- **ApiDefinition：** 用户自定义的 API 定义分组，可以看做是一些 URL 匹配的组合。比如我们可以定义一个 API 叫 my_api，请求 path 模式为 /foo/** 和 /baz/** 的都归到 my_api 这个 API 分组下面。限流的时候可以针对这个自定义的 API 分组维度进行限流。

> 其中网关限流规则 GatewayFlowRule 的字段解释如下：

- resource：资源名称，可以是网关中的 route 名称或者用户自定义的 API 分组名称。
- resourceMode：规则是针对 API Gateway 的 route（RESOURCE_MODE_ROUTE_ID）还是用户在 Sentinel 中定义的 API 分组（RESOURCE_MODE_CUSTOM_API_NAME），默认是 route。
- grade：限流指标维度，同限流规则的 grade 字段。
- count：限流阈值
- intervalSec：统计时间窗口，单位是秒，默认是 1 秒。
- controlBehavior：流量整形的控制效果，同限流规则的 controlBehavior 字段，目前支持快速失败和匀速排队两种模式，默认是快速失败。
- burst：应对突发请求时额外允许的请求数目。
- maxQueueingTimeoutMs：匀速排队模式下的最长排队时间，单位是毫秒，仅在匀速排队模式下生效。
- paramItem：参数限流配置。若不提供，则代表不针对参数进行限流，该网关规则将会被转换成普通流控规则；否则会转换成热点规则。其中的字段：
- parseStrategy：从请求中提取参数的策略，目前支持提取来源 IP（PARAM_PARSE_STRATEGY_CLIENT_IP）、Host（PARAM_PARSE_STRATEGY_HOST）、任意 Header（PARAM_PARSE_STRATEGY_HEADER）和任意 URL 参数（PARAM_PARSE_STRATEGY_URL_PARAM）四种模式。
- fieldName：若提取策略选择 Header 模式或 URL 参数模式，则需要指定对应的 header 名称或 URL 参数名称。
- pattern：参数值的匹配模式，只有匹配该模式的请求属性值会纳入统计和流控；若为空则统计该请求属性的所有值。（1.6.2 版本开始支持）
- matchStrategy：参数值的匹配策略，目前支持精确匹配（PARAM_MATCH_STRATEGY_EXACT）、子串匹配（PARAM_MATCH_STRATEGY_CONTAINS）和正则匹配（PARAM_MATCH_STRATEGY_REGEX）。（1.6.2 版本开始支持）

**Sentinel提供了两种限流模式**

- **route维度**：即在Spring配置文件中配置的路由条目，资源名为对应的routeId
- **自定义API维度**：用户可以利用Sentinel提供的API来自定义一些API分组

## 2、路由维度限流

**引入POM：**

```xml
<dependency>
    <groupId>com.alibaba.csp</groupId>
    <artifactId>sentinel-spring-cloud-gateway-adapter</artifactId>
</dependency>
```

**yaml配置：**

```java
spring:
  cloud: 
    gateway:
      routes: 
        - id: user-service 路由id
          uri: lb://user-service 跳转服务的uri路径
          predicates:
            - Path=/user/** 
```

**创建GatewayConfiguration 配置文件：**

```java
@Configuration
public class GatewayConfiguration {
    private final List<ViewResolver> viewResolvers;
    private final ServerCodecConfigurer serverCodecConfigurer;
    public GatewayConfiguration(ObjectProvider<List<ViewResolver>> viewResolversProvider, ServerCodecConfigurer serverCodecConfigurer) {
        this.viewResolvers = viewResolversProvider.getIfAvailable(Collections::emptyList);
        this.serverCodecConfigurer = serverCodecConfigurer;
    }
    /**
     * 初始化一个限流的过滤器
     *
     * @return
     */
    @Bean
    @Order(Ordered.HIGHEST_PRECEDENCE)
    public GlobalFilter sentinelGatewayFilter() {
        return new SentinelGatewayFilter();
    }
    /**
     * 配置限流的异常处理器
     *
     * @return
     */
    @Bean
    @Order(Ordered.HIGHEST_PRECEDENCE)
    public SentinelGatewayBlockExceptionHandler
    sentinelGatewayBlockExceptionHandler() {
        return new SentinelGatewayBlockExceptionHandler(viewResolvers,
                serverCodecConfigurer);
    }
    /**
     * 加载规则
     */
    @PostConstruct
    public void doInit() {
        initGatewayRules();
    }
	/**
     * 配置初始化的限流参数
     */
    public void initGatewayRules() {
        Set<GatewayFlowRule> rules = new HashSet<>();
        // yaml中配置的路由id
        rules.add(new GatewayFlowRule("user-service")
 		        // 限流维度
        		.setResourceMode(SentinelGatewayConstants.RESOURCE_MODE_ROUTE_ID)
                // 限流阈值
                .setCount(1)
                // 时间窗口
                .setIntervalSec(1)
                // 正对请求参数进行热点限流
                .setParamItem(new GatewayParamFlowItem()
			            .setParseStrategy(SentinelGatewayConstants.PARAM_PARSE_STRATEGY_URL_PARAM)
                        // 参数名称
                        .setFieldName("pa")
                )
        );
        GatewayRuleManager.loadRules(rules);
    }
}
```

以上配置表示的限流规则为：当进入到路由ID为`user-service`并且请求的URL中拥有一个叫做`pa`的参数，在1秒时间内，最大并发数为1。

我们也可以不配置`setParamItem()`，那么规则就为：当进入到路由ID为`user-service`的所有请求，在1秒时间内，最大并发数为1。

当然`setParamItem()`还有很多的限流规则，比如Header参数.

**测试：**

我们发起请求两个请求，比如：`user/list?pa=123`与`user/list`，通过快速刷新浏览器模拟并发。

结论：存在`pa`参数的请求，连续访问会出现`Sentinel`限流，而不带`pa`参数的请求，则不会触发。

## 3、API维度限流

提供了更细化的限流匹配机制，可以针对某些请求实现限流。

**引入POM：**

```xml
<dependency>
    <groupId>com.alibaba.csp</groupId>
    <artifactId>sentinel-spring-cloud-gateway-adapter</artifactId>
</dependency>
```

**yaml配置：**

```bash
spring:
  cloud: 
    gateway:
      routes: 
        - id: user-service 路由id
          uri: lb://user-service 跳转服务的uri路径
          predicates:
            - Path=/user/** 
		- id: wage-service 路由id
          uri: lb://wage-service 跳转服务的uri路径
          predicates:
            - Path=/wage/** 
```

**创建GatewayConfiguration 配置文件：**

```java
@Configuration
public class GatewayConfiguration {
    private final List<ViewResolver> viewResolvers;
    private final ServerCodecConfigurer serverCodecConfigurer;
    public GatewayConfiguration(ObjectProvider<List<ViewResolver>> viewResolversProvider, ServerCodecConfigurer serverCodecConfigurer) {
        this.viewResolvers = viewResolversProvider.getIfAvailable(Collections::emptyList);
        this.serverCodecConfigurer = serverCodecConfigurer;
    }
    /**
     * 初始化一个限流的过滤器
     *
     * @return
     */
    @Bean
    @Order(Ordered.HIGHEST_PRECEDENCE)
    public GlobalFilter sentinelGatewayFilter() {
        return new SentinelGatewayFilter();
    }
    /**
     * 配置限流的异常处理器
     *
     * @return
     */
    @Bean
    @Order(Ordered.HIGHEST_PRECEDENCE)
    public SentinelGatewayBlockExceptionHandler
    sentinelGatewayBlockExceptionHandler() {
        return new SentinelGatewayBlockExceptionHandler(viewResolvers,
                serverCodecConfigurer);
    }
    /**
     * 加载规则
     */
    @PostConstruct
    public void doInit() {
        initCustomizedApis();
        initGatewayRules();
    }
    /**
     * 自定义API分组
     */
    private void initCustomizedApis() {
        Set<ApiDefinition> definitions = new HashSet<>();
        //设置分组名称,new GatewayFlowRule()中分组名称一致
        ApiDefinition api1 = new ApiDefinition("user-service-api")
                .setPredicateItems(new HashSet<ApiPredicateItem>() {
     {
                    //设置规则
                    //以/user 开头的请求
					add(new ApiPathPredicateItem().setPattern("/user/list/**").     
  		                    setMatchStrategy(SentinelGatewayConstants.URL_MATCH_STRATEGY_PREFIX));
                    //全路径匹配
                    add(new ApiPathPredicateItem().setPattern("/user/role"));
                }});
        ApiDefinition api2 = new ApiDefinition("wage-service-api")
                .setPredicateItems(new HashSet<ApiPredicateItem>() {
     {
                    add(new ApiPathPredicateItem().setPattern("/wage/**").
                            setMatchStrategy(SentinelGatewayConstants.URL_MATCH_STRATEGY_PREFIX));
                }});
        definitions.add(api1);
        definitions.add(api2);
        GatewayApiDefinitionManager.loadApiDefinitions(definitions);
    }
    /**
     * 配置初始化的限流参数
     */
    public void initGatewayRules() {
        Set<GatewayFlowRule> rules = new HashSet<>();
        // 设置api分组名称,名称任意
        rules.add(new GatewayFlowRule("user-service-api")
                .setResourceMode(SentinelGatewayConstants.RESOURCE_MODE_CUSTOM_API_NAME)
                // 限流阈值
                .setCount(1)
                // 时间窗口
                .setIntervalSec(1)
        );
        // 设置api分组名称,名称任意
        rules.add(new GatewayFlowRule("wage-service-api")
                .setResourceMode(SentinelGatewayConstants.RESOURCE_MODE_CUSTOM_API_NAME)
                // 限流阈值
                .setCount(2)
                // 时间窗口
                .setIntervalSec(1)
        );
        GatewayRuleManager.loadRules(rules);
    }
}
```

以上配置表示的限流规则为：

- 当请求为/wage/**开头的请求会触发wage-service-api限流规则，在1秒时间内，最大并发数为2。
- 当请求为/user/list/**开头和/user/role的请求会触发user-service-api限流规则，在1秒时间内，最大并发数为1。

**测试：**

## 4、综合使用

我们可以将，`路由维度`与`API维度`的限流同时进行使用，配置如下：

```java
@Configuration
public class GatewayConfiguration {
    private final List<ViewResolver> viewResolvers;
    private final ServerCodecConfigurer serverCodecConfigurer;
    public GatewayConfiguration(ObjectProvider<List<ViewResolver>> viewResolversProvider, ServerCodecConfigurer serverCodecConfigurer) {
        this.viewResolvers = viewResolversProvider.getIfAvailable(Collections::emptyList);
        this.serverCodecConfigurer = serverCodecConfigurer;
    }
    /**
     * 初始化一个限流的过滤器
     *
     * @return
     */
    @Bean
    @Order(Ordered.HIGHEST_PRECEDENCE)
    public GlobalFilter sentinelGatewayFilter() {
        return new SentinelGatewayFilter();
    }
    /**
     * 配置限流的异常处理器
     *
     * @return
     */
    @Bean
    @Order(Ordered.HIGHEST_PRECEDENCE)
    public SentinelGatewayBlockExceptionHandler
    sentinelGatewayBlockExceptionHandler() {
        return new SentinelGatewayBlockExceptionHandler(viewResolvers,
                serverCodecConfigurer);
    }
    /**
     * 加载规则
     */
    @PostConstruct
    public void doInit() {
        initCustomizedApis();
        initGatewayRules();
    }
    /**
     * 自定义API分组
     */
    private void initCustomizedApis() {
        Set<ApiDefinition> definitions = new HashSet<>();
        //设置分组名称,new GatewayFlowRule()中分组名称一致
        ApiDefinition api1 = new ApiDefinition("user-service-api")
                .setPredicateItems(new HashSet<ApiPredicateItem>() {
     {
                    //设置规则
                    //以/user 开头的请求
                    add(new ApiPathPredicateItem().setPattern("/user/list/**").
                            setMatchStrategy(SentinelGatewayConstants.URL_MATCH_STRATEGY_PREFIX));
                    //全路径匹配
                    add(new ApiPathPredicateItem().setPattern("/user/role"));
                }});
        definitions.add(api1);
        GatewayApiDefinitionManager.loadApiDefinitions(definitions);
    }
    /**
     * 配置初始化的限流参数
     */
    public void initGatewayRules() {
        Set<GatewayFlowRule> rules = new HashSet<>();
        // 设置路由维度的限流
        rules.add(new GatewayFlowRule("user-service")
                .setResourceMode(SentinelGatewayConstants.RESOURCE_MODE_ROUTE_ID)
                // 限流阈值
                .setCount(10)
                // 时间窗口
                .setIntervalSec(1)
        );
        // 设置api分组名称,名称任意
        rules.add(new GatewayFlowRule("user-service-api")
                .setResourceMode(SentinelGatewayConstants.RESOURCE_MODE_CUSTOM_API_NAME)
                // 限流阈值
                .setCount(1)
                // 时间窗口
                .setIntervalSec(1)
        );
        GatewayRuleManager.loadRules(rules);
    }
}
```

以上配置表示的限流规则为：

- 当请求以user/**开头的请求，会进入到路由ID为user-service，并且触发路由维度的限流规则，在1秒时间内，最大并发数为10。
- 当请求为/user/list/**开头和/user/role的请求会触发user-service-api限流规则，在1秒时间内，最大并发数为1。

如果同时配置了`路由维度`和`API维度`的限流规则，那么会优先触发`API维度`的限流规则。

**测试：**

## 5、网关流控实现原理

当通过`GatewayRuleManager` 加载网关流控规则（`GatewayFlowRule`）时，无论是否针对请求属性进行限流，Sentinel 底层都会将网关流控规则转化为热点参数规则（`ParamFlowRule`），存储在 `GatewayRuleManager` 中，与正常的热点参数规则相隔离。转换时 Sentinel 会根据请求属性配置，为网关流控规则设置参数索引（`idx`），并同步到生成的热点参数规则中。

外部请求进入 API Gateway 时会经过 Sentinel 实现的 filter，其中会依次进行 `路由/API 分组匹配`、`请求属性解析`和`参数组装`。Sentinel 会根据配置的网关流控规则来解析请求属性，并依照参数索引顺序组装参数数组，最终传入 `SphU.entry(res, args)`中。Sentinel API Gateway Adapter Common 模块向 Slot Chain 中添加了一个 `GatewayFlowSlot`，专门用来做网关规则的检查。`GatewayFlowSlot` 会从 `GatewayRuleManager` 中提取生成的热点参数规则，根据传入的参数依次进行规则检查。若某条规则不针对请求属性，则会在参数最后一个位置置入预设的常量，达到普通流控的效果。

## 6、网关流控控制台

用户可以直接在 Sentinel 控制台上查看 API Gateway 实时的 route 和自定义 API 分组监控，管理网关规则和 API 分组配置。

其他规则配置可以参考：[《Sentinel控制台各规则配置》](/zhuanlan/guarantee/sentinel/31.html)

### 6.1 如何使用：

我们在启动`Gateway`模块时，需要加上一个JVM参数：`-Dcsp.sentinel.app.type=1`，比如：

```java
java -jar -Dcsp.sentinel.app.type=1 demo-gateway.jar
```

### 6.2 API管理

在`API管理列表`中会展示我们在GateWay代码中通过`ApiDefinition`定义的API分组维度，我们也可以通过控制台新增`API分组`

### 6.3 流控规则

流控规则中会展示我们在GateWay代码中通过`GatewayFlowRule`定义的API限流规则和路由维度限流规则，我们也可以在页面新增路由或者API维度的限流规则。

### 6.4 降级规则

除了流量控制以外，对调用链路中不稳定的资源进行熔断降级也是保障高可用的重要措施之一。一个服务常常会调用别的模块，可能是另外的一个远程服务、数据库，或者第三方 API 等。。然而，这个被依赖服务的稳定性是不能保证的。如果依赖的服务出现了不稳定的情况，请求的响应时间变长，那么调用服务的方法的响应时间也会变长，线程会产生堆积，最终可能耗尽业务自身的线程池，服务本身也变得不可用。

复杂链路上的某一环不稳定，就可能会层层级联，最终导致整个链路都不可用。因此我们需要对不稳定的`弱依赖服务调用`进行熔断降级，暂时切断不稳定调用，避免局部不稳定因素导致整体的雪崩。熔断降级作为保护自身的手段，通常在客户端（调用端）进行配置。

**Sentinel 提供以下几种熔断策略：**

**熔断降级规则包含下面几个重要的属性：**

Field
说明
默认值

resource
资源名，即规则的作用对象

grade
熔断策略，支持慢调用比例/异常比例/异常数策略
慢调用比例

count
慢调用比例模式下为慢调用临界 RT（超出该值计为慢调用）；异常比例/异常数模式下为对应的阈值

timeWindow
熔断时长，单位为 s

minRequestAmount
熔断触发的最小请求数，请求数小于该值时即使异常比率超出阈值也不会熔断（1.7.0 引入）
5

statIntervalMs
统计时长（单位为 ms），如 60*1000 代表分钟级（1.8.0 引入）
1000 ms

slowRatioThreshold
慢调用比例阈值，仅慢调用比例模式有效（1.8.0 引入）

同一个资源可以同时有多个降级规则。

### 6.4.1 慢调用比例

选择以慢调用比例作为阈值，需要设置允许的慢调用 RT（即最大的响应时间），请求的响应时间大于该值则统计为慢调用。当单位统计时长（`statIntervalMs`）内请求数目大于设置的最小请求数目，并且慢调用的比例大于阈值，则接下来的熔断时长内请求会自动被熔断。经过熔断时长后熔断器会进入探测恢复状态（HALF-OPEN 状态），若接下来的一个请求响应时间小于设置的慢调用 RT 则结束熔断，若大于设置的慢调用 RT 则会再次被熔断。

### 6.4.2 异常比例

当单位统计时长（`statIntervalMs`）内请求数目大于设置的最小请求数目，并且异常的比例大于阈值，则接下来的熔断时长内请求会自动被熔断。经过熔断时长后熔断器会进入探测恢复状态（HALF-OPEN 状态），若接下来的一个请求成功完成（没有错误）则结束熔断，否则会再次被熔断。异常比率的阈值范围是 [0.0, 1.0]，代表 0% - 100%。

### 6.4.3 异常数

当单位统计时长内的异常数目超过阈值之后会自动进行熔断。经过熔断时长后熔断器会进入探测恢复状态（HALF-OPEN 状态），若接下来的一个请求成功完成（没有错误）则结束熔断，否则会再次被熔断。

### 6.5 系统规则

系统保护规则是从应用级别的入口流量进行控制，从单台机器的 load、CPU 使用率、平均 RT、入口 QPS 和并发线程数等几个维度监控应用指标，让系统尽可能跑在最大吞吐量的同时保证系统整体的稳定性。

系统保护规则是应用整体维度的，而不是资源维度的，并且`仅对入口流量生效`。入口流量指的是进入应用的流量，比如 Web 服务或 Dubbo 服务端接收的请求，都属于入口流量。

**系统规则支持以下的模式：**

- **Load 自适应（仅对 Linux/Unix-like 机器生效）：** 系统的 load1 作为启发指标，进行自适应系统保护。当系统 load1 超过设定的启发值，且系统当前的并发线程数超过估算的系统容量时才会触发系统保护（BBR 阶段）。系统容量由系统的 maxQps * minRt 估算得出。设定参考值一般是 CPU cores * 2.5。
- **CPU usage（1.5.0+ 版本）：** 当系统 CPU 使用率超过阈值即触发系统保护（取值范围 0.0-1.0），比较灵敏。
- **平均 RT：** 当单台机器上所有入口流量的平均 RT 达到阈值即触发系统保护，单位是毫秒。
- **并发线程数：** 当单台机器上所有入口流量的并发线程数达到阈值即触发系统保护。
- **入口 QPS：** 当单台机器上所有入口流量的 QPS 达到阈值即触发系统保护。
