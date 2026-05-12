# 09、Nepxion 教程 - Discovery 之服务灰度发布参数的支持
- 来源：https://ddkk.com/zhuanlan/j2ee/nepxion/1/9.html
- 分类：J2EE框架
- 分组：Nepxion 教程
`Nepxion Discovery` 对于服务灰度发布参数支持：外置`Header`、 `Parameter`、`Cookie`、`域名`规则策略驱动。并且还内置本地和远程、局部和全局规则策略驱动。并且还支持正则表达式以及通配表达式支持。并且`Nepxion Discovery`支持`Spring Cloud Gateway`、`Zuul网关`和`微服务`三大模式的灰度发布和路由等一系列功能。 所以`Nepxion Discovery` 对于灰度发布的支持场景还是很丰富的，基本能够满足生产的大多数场景。关于`Nepxion Discovery`的策略博主准备分解成三篇文章来讲解：

- 配置中心对灰度的配置：包括初始化、对不同配置中心的适配以及配置中心策略变更的通知
- 服务灰度发布参数的支持：包含上面外置、内置规则策略驱动以及远程配置灰度参数的优先级
- 对网关和微服务三大模式的支持：包含不同模式对下游参数的传递以及如何进行负载均衡的

在上一篇博客 [8、Nepxion Discovery 之配置中心支持灰度配置](/zhuanlan/j2ee/nepxion/1/8.html) 中讲解了 `Nepxion Discovery` 对于内置本地和远程、局部和全局规则的策略驱动。在这一篇文章，首先会来分析一下框架对外置参数的支持，然后会来分析一下基于配置中心的策略策略驱动的具体分析。为了框架灵活性，配置中心的策略驱动配置还是蛮复杂的。

> 注意：为了看懂这篇博客建议在电脑上观看，因为需要对照代码与 xml 配置才能更好的理解

## 1、服务发布类型

在分析远程配置策略之前，首先要介绍一下版本发布里面的一些概念。长期以来，业务升级渐渐形成了几个发布策略：蓝绿发布、灰度发布和滚动发布，目的是尽可能避免因发布导致的流量丢失或服务不可用问题。

### 1.1 蓝绿发布

蓝绿发布Blue-Green Deployment：项目逻辑上分为AB组，在项目系统时，首先把 A 组从负载均衡中摘除，进行新版本的部署。B 组仍然继续提供服务。当 A 组升级完毕，负载均衡重新接入A组，再把B组从负载列表中摘除，进行新版本的部署。A组重新提供服务。最后，B组也升级完成，负载均衡重新接入B组，此时，AB组版本都已经升级完成，并且都对外提供服务。

> 优点：流量在新版本升级和老版本回滚迅速。用户可以灵活控制流量走向
>
> 缺点：成本较高，需要部署两套蓝绿环境。新版本如出现问题，切换不及时，会造成大面积故障

### 1.2 灰度发布

灰度发布 Gray Release（又名金丝雀发布Canary Release）：不停机旧版本，部署新版本，低比例流量（例如：5%）切换到新版本，高比例流量（例如：95%）仍走旧版本，通过监控观察，如无问题，逐步扩大范围，最终把所有流量都迁移到新版本上。属无损发布。

> 优点：灵活简单，不需要用户标记驱动。安全性高，新版本如出现问题，只会发生在低比例的流量上
>
> 缺点：流量配比递增的配置修改，带来额外的操作成本。用户覆盖狭窄，低比例流量未必能发现所有问题

### 1.3 滚动发布

滚动发布(Rolling Release)：每次只升级一个或多个服务，升级完成后加入生产环境，不断执行这个过程，直到集群中的全部旧版本升级到新版本。停止旧版本的过程中，无法精确计算旧版本是否已经完成它正在执行的工作，需要靠业务自身去判断。属有损发布

> 优点：出现问题影响范围很小，只会发生在若干台正在滚动发布的服务上
>
> 缺点：发布和回滚需要较长的时间周期。按批次停止旧版本，启动新版本，由于旧版本不保留，一旦全部升级完毕后才发现问题，则无法快速回滚

## 2、StrategyWrapper

`Nepxion Discovery` 要实现灰度发布肯定是需要从外部请求中获取传递过来的参数，它本身支持`Spring Cloud Gateway`、`Zuul网关`和`微服务`三大模式的灰度发布功能。在这里我们就以 `Spring Cloud Gateway` 为例来分析一下对外置规则策略驱动的支持以及远程配置灰度策略的优先级讨论。

我们都知道对于 `Spring Cloud Gateway` 框架如果我们需要对它进行扩展，只需要扩展它的 Filter 就行了。`Nepxion Discovery` 通过 `AbstractGatewayStrategyRouteFilter` 实现 `Spring Cloud Gateway` 的 `GlobalFilter`来进行对请求参数的解析。当然这个类现在涉及到对下游的参数传递，现在我们不讨论这个问题，再下一篇博客会详细讨论它对`Spring Cloud Gateway`、`Zuul网关`和`微服务`三大模式的灰度发布功能的支持。这里提到它主要是它是入口，我在学习东西的时候喜欢从入口找到出口。这样能够把所有的知识点都串联起来，记忆也更加深刻。好了废话就不多说了，进入我们主题。下面我来画一下调用到核心处理类的时序图，如果大家对中间过程想要了解可以自行分析哈。在这里只是给大家把整个框架的核心概念给串起来。

在上面的时序图里以获取路由版本为例，以 `Spring Cloud Gateway` 它的扩展 `Filter` 开始调用到 `StrategyWrapper` 这个灰度发布策略核心类为终点的时序图。在 `StrategyWrapper` 里面的方法比较多，大家看到这个类可能有点蒙圈。我们由简入繁，先通过 `Nepxion Discovery` 对路由版本为例，然后再逐渐深入分析`Nepxion Discovery`的灰度发布策略。

> StrategyWrapper.java

```java
public class StrategyWrapper {
    // 从远程配置中心或者本地配置文件获取版本路由配置。如果是远程配置中心，则值会动态改变
    public String getRouteVersion(Map<String, String> headerMap) {
        String routeVersion = getConditionBlueGreenRouteVersion(headerMap);
        if (StringUtils.isEmpty(routeVersion)) {
            routeVersion = getConditionGrayRouteVersion(headerMap);
            if (StringUtils.isEmpty(routeVersion)) {
                routeVersion = getGlobalRouteVersion();
            }
        }
        return routeVersion;
    }
	......
}
```

上面的代码逻辑其实就是对上面的发布类型优先级的支持：

- 条件蓝绿部署配置路由版本为第一优先级
- 条件灰度部署配置路由版本为第二优先级
- 基于Http Header传递的策略路由，全局缺省路由为第三优先级

在最下面有 XML 最全的配置，其实里面的配置已经说明情况了，我就把相关的信息截取出来。

```java
<?xml version="1.0" encoding="UTF-8"?>
<rule>
    <!-- 基于Http Header传递的策略路由，全局缺省路由（第三优先级） -->
    <strategy>
        <!-- 版本路由 -->
        <version>{"discovery-springcloud-example-a":"1.0", "discovery-springcloud-example-b":"1.0", "discovery-springcloud-example-c":"1.0;1.2"}</version>
        <!-- <version>1.0</version> -->
        <!-- 区域路由 -->
        <region>{"discovery-springcloud-example-a":"qa;dev", "discovery-springcloud-example-b":"dev", "discovery-springcloud-example-c":"qa"}</region>
        <!-- <region>dev</region> -->
        <!-- IP地址和端口路由 -->
        <address>{"discovery-springcloud-example-a":"192.168.43.101:1100", "discovery-springcloud-example-b":"192.168.43.101:1201", "discovery-springcloud-example-c":"192.168.43.101:1300"}</address>
        <!-- 权重流量配置有如下四种方式，优先级分别是由高到底，即先从第一种方式取权重流量值，取不到则到第二种方式取值，以此类推，最后仍取不到则忽略。使用者按照实际情况，选择一种即可 -->
        <!-- 版本权重路由 -->
        <version-weight>{"discovery-springcloud-example-a":"1.0=90;1.1=10", "discovery-springcloud-example-b":"1.0=90;1.1=10", "discovery-springcloud-example-c":"1.0=90;1.1=10"}</version-weight>
        <!-- <version-weight>1.0=90;1.1=10</version-weight> -->
        <!-- 区域权重路由 -->
        <region-weight>{"discovery-springcloud-example-a":"dev=85;qa=15", "discovery-springcloud-example-b":"dev=85;qa=15", "discovery-springcloud-example-c":"dev=85;qa=15"}</region-weight>
        <!-- <region-weight>dev=85;qa=15</region-weight> -->
    </strategy>
    <!-- 基于Http Header传递的定制化策略路由，支持蓝绿部署和灰度发布两种模式。如果都不命中，则执行上面的全局缺省路由 -->
    <strategy-customization>
        <!-- Spel表达式在XML中的转义符：-->
        <!-- 和符号 & 转义为 & 必须转义 -->
        <!-- 小于号 < 转义为 < 必须转义 -->
        <!-- 双引号 " 转义为 " 必须转义 -->
        <!-- 大于号 > 转义为 > -->
        <!-- 单引号 ' 转义为 ' -->
        <!-- 全链路蓝绿部署：条件命中的匹配方式（第一优先级），支持版本匹配、区域匹配、IP地址和端口匹配、版本权重匹配、区域权重匹配 -->
        <!-- Header节点不允许缺失 -->
        <conditions type="blue-green">
            <condition id="1" header="#H['a'] == '1' &&H['b'] == '2'" version-id="a-1" region-id="b-1" address-id="c-1" version-weight-id="d-1" region-weight-id="e-1"/>
            <condition id="2" header="#H['c'] == '3'" version-id="a-2" region-id="b-2" address-id="c-2" version-weight-id="d-2" region-weight-id="e-2"/>
        </conditions>
        <!-- 全链路灰度发布：条件命中的随机权重（第二优先级），支持版本匹配、区域匹配、IP地址和端口匹配 -->
        <!-- Header节点允许缺失，当含Header和未含Header的配置并存时，以未含Header的配置为优先 -->
        <conditions type="gray">
            <condition id="1" header="#H['a'] == '1' &&H['b'] == '2'" version-id="a-1=10;a-2=90" region-id="b-1=20;b-2=80" address-id="c-1=30;c-2=70"/>
            <condition id="2" header="#H['c'] == '3'" version-id="a-1=90;a-2=10" region-id="b-1=80;b-2=20" address-id="c-1=70;c-2=30"/>
            <condition id="3" version-id="a-1=5;a-2=95" region-id="b-1=5;b-2=95" address-id="c-1=5;c-2=95"/>
        </conditions>
        <routes>
            <route id="a-1" type="version">{"discovery-springcloud-example-a":"1.0", "discovery-springcloud-example-b":"1.0", "discovery-springcloud-example-c":"1.0;1.2"}</route>
            <route id="a-2" type="version">{"discovery-springcloud-example-a":"1.1", "discovery-springcloud-example-b":"1.1", "discovery-springcloud-example-c":"1.2"}</route>
            <route id="b-1" type="region">{"discovery-springcloud-example-a":"qa;dev", "discovery-springcloud-example-b":"dev", "discovery-springcloud-example-c":"qa"}</route>
            <route id="b-2" type="region">{"discovery-springcloud-example-a":"qa", "discovery-springcloud-example-b":"qa", "discovery-springcloud-example-c":"qa"}</route>
            <route id="c-1" type="address">{"discovery-springcloud-example-a":"192.168.43.101:1100", "discovery-springcloud-example-b":"192.168.43.101:1201", "discovery-springcloud-example-c":"192.168.43.101:1300"}</route>
            <route id="c-2" type="address">{"discovery-springcloud-example-a":"192.168.43.101:1101", "discovery-springcloud-example-b":"192.168.43.101:1201", "discovery-springcloud-example-c":"192.168.43.101:1301"}</route>
            <route id="d-1" type="version-weight">{"discovery-springcloud-example-a":"1.0=90;1.1=10", "discovery-springcloud-example-b":"1.0=90;1.1=10", "discovery-springcloud-example-c":"1.0=90;1.1=10"}</route>
            <route id="d-2" type="version-weight">{"discovery-springcloud-example-a":"1.0=10;1.1=90", "discovery-springcloud-example-b":"1.0=10;1.1=90", "discovery-springcloud-example-c":"1.0=10;1.1=90"}</route>
            <route id="e-1" type="region-weight">{"discovery-springcloud-example-a":"dev=85;qa=15", "discovery-springcloud-example-b":"dev=85;qa=15", "discovery-springcloud-example-c":"dev=85;qa=15"}</route>
            <route id="e-2" type="region-weight">{"discovery-springcloud-example-a":"dev=15;qa=85", "discovery-springcloud-example-b":"dev=15;qa=85", "discovery-springcloud-example-c":"dev=15;qa=85"}</route>
        </routes>
        <!-- 策略中配置条件表达式中的Header来决策蓝绿和灰度，可以代替外部传入Header -->
        <headers>
            <header key="a" value="1"/>
        </headers>
    </strategy-customization>
	...
<rule>
```

相信大家根据上面的代码已经配置文件里面的说明就可以很清楚的知道，第一优先级是`` 标签下类型 `` 的蓝绿发布配置。第二优先级是`` 标签下类型 `` 的灰度发布配置，`` 标签中的 ``是用来对具体路由的声明。

**在蓝绿发布配置和灰度发布配置都支持条件式：**

- 通过Spring Spel的条件表达式支持等于=、不等于!=、大于>`、小于` HeaderExpressionStrategyCondition.java

```java
public class HeaderExpressionStrategyCondition extends AbstractStrategyCondition {
    private Pattern pattern = Pattern.compile(DiscoveryConstant.EXPRESSION_REGEX);
    @Autowired
    private StrategyWrapper strategyWrapper;
    @Override
    public boolean isTriggered(StrategyConditionEntity strategyConditionEntity) {
        Map<String, String> headerMap = createHeaderMap(strategyConditionEntity);
        return isTriggered(strategyConditionEntity, headerMap);
    }
    private Map<String, String> createHeaderMap(StrategyConditionEntity strategyConditionEntity) {
        String conditionHeader = strategyConditionEntity.getConditionHeader();
        Map<String, String> headerMap = new HashMap<String, String>();
        Matcher matcher = pattern.matcher(conditionHeader);
        while (matcher.find()) {
            String group = matcher.group();
            String headerName = StringUtils.substringBetween(group, DiscoveryConstant.EXPRESSION_SUB_PREFIX, DiscoveryConstant.EXPRESSION_SUB_SUFFIX);
            String headerValue = null;
            // 从外置Header获取
            if (StringUtils.isBlank(headerValue)) {
                headerValue = strategyContextHolder.getHeader(headerName);
            }
            // 从内置Header获取
            if (StringUtils.isBlank(headerValue)) {
                headerValue = strategyWrapper.getHeader(headerName);
            }
            // 从外置Parameter获取
            if (StringUtils.isBlank(headerValue)) {
                headerValue = strategyContextHolder.getParameter(headerName);
            }
            // 从外置Cookie获取
            if (StringUtils.isBlank(headerValue)) {
                headerValue = strategyContextHolder.getCookie(headerName);
            }
            if (StringUtils.isNotBlank(headerValue)) {
                headerMap.put(headerName, headerValue);
            }
        }
        return headerMap;
    }
    @Override
    public boolean isTriggered(StrategyConditionEntity strategyConditionEntity, Map<String, String> headerMap) {
        String conditionHeader = strategyConditionEntity.getConditionHeader();
        return DiscoveryExpressionResolver.eval(conditionHeader, DiscoveryConstant.EXPRESSION_PREFIX, headerMap, strategyTypeComparator);
    }
}
```

- 首先从 RuleCache 里面拿到远程蓝绿发布或者灰度发布配置信息
- 然后 `` 标签中的中的蓝绿灰度配置 `` 或者 ``它们的标签下的标签 `` 中的 header 属性支持条件表达式。就从 `` 中的 header 属性获取到这个表达式
- 从 `` 中的 header 属性表达式中获取到这个属性。格式为：#H['a']，就表式从参数里面获取 a 这个 key 的值
- 然后，首先从外置Header获取获取值；接着从内置Header获取如果有值就覆盖；然后从外置Parameter获取，如果有值就覆盖；最后从外置Cookie获取，如果有值就覆盖。所以它们的优先级是：外置Header >`内置Header(配置中心) >` 外置Parameter >` 外置Cookie
- 最近获取到的值通过 DiscoveryExpressionResolver.eval 进行条件计算，如果满足条件。则该 ``/ ``/`` 下的灰度配置条件就生效。

## 4、规则策略示例

XML最全的示例如下，Json示例见源码 `discovery-springcloud-example-service` 工程下的rule.json

```java
<?xml version="1.0" encoding="UTF-8"?>
<rule>
    <!-- 如果不想开启相关功能，只需要把相关节点删除即可，例如不想要黑名单功能，把blacklist节点删除 -->
    <register>
        <!-- 服务注册的黑/白名单注册过滤，只在服务启动的时候生效。白名单表示只允许指定IP地址前缀注册，黑名单表示不允许指定IP地址前缀注册。每个服务只能同时开启要么白名单，要么黑名单 -->
        <!-- filter-type，可选值blacklist/whitelist，表示白名单或者黑名单 -->
        <!-- service-name，表示服务名 -->
        <!-- filter-value，表示黑/白名单的IP地址列表。IP地址一般用前缀来表示，如果多个用“;”分隔，不允许出现空格 -->
        <!-- 表示下面所有服务，不允许10.10和11.11为前缀的IP地址注册（全局过滤） -->
        <blacklist filter-value="10.10;11.11">
            <!-- 表示下面服务，不允许172.16和10.10和11.11为前缀的IP地址注册 -->
            <service service-name="discovery-springcloud-example-a" filter-value="172.16"/>
        </blacklist>
        <!-- <whitelist filter-value="">
            <service service-name="" filter-value=""/>
        </whitelist>  -->
        <!-- 服务注册的数目限制注册过滤，只在服务启动的时候生效。当某个服务的实例注册达到指定数目时候，更多的实例将无法注册 -->
        <!-- service-name，表示服务名 -->
        <!-- filter-value，表示最大实例注册数 -->
        <!-- 表示下面所有服务，最大实例注册数为10000（全局配置） -->
        <count filter-value="10000">
            <!-- 表示下面服务，最大实例注册数为5000，全局配置值10000将不起作用，以局部配置值为准 -->
            <service service-name="discovery-springcloud-example-a" filter-value="5000"/>
        </count>
    </register>
    <discovery>
        <!-- 服务发现的黑/白名单发现过滤，使用方式跟“服务注册的黑/白名单过滤”一致 -->
        <!-- 表示下面所有服务，不允许10.10和11.11为前缀的IP地址被发现（全局过滤） -->
        <blacklist filter-value="10.10;11.11">
            <!-- 表示下面服务，不允许172.16和10.10和11.11为前缀的IP地址被发现 -->
            <service service-name="discovery-springcloud-example-b" filter-value="172.16"/>
        </blacklist>
        <!-- 服务发现的多版本灰度匹配控制 -->
        <!-- service-name，表示服务名 -->
        <!-- version-value，表示可供访问的版本，如果多个用“;”分隔，不允许出现空格 -->
        <!-- 版本策略介绍 -->
        <!-- 1. 标准配置，举例如下 -->
        <!--    <service consumer-service-name="a" provider-service-name="b" consumer-version-value="1.0" provider-version-value="1.0;1.1"/> 表示消费端1.0版本，允许访问提供端1.0和1.1版本 -->
        <!-- 2. 版本值不配置，举例如下 -->
        <!--    <service consumer-service-name="a" provider-service-name="b" provider-version-value="1.0;1.1"/> 表示消费端任何版本，允许访问提供端1.0和1.1版本 -->
        <!--    <service consumer-service-name="a" provider-service-name="b" consumer-version-value="1.0"/> 表示消费端1.0版本，允许访问提供端任何版本 -->
        <!--    <service consumer-service-name="a" provider-service-name="b"/> 表示消费端任何版本，允许访问提供端任何版本 -->
        <!-- 3. 版本值空字符串，举例如下 -->
        <!--    <service consumer-service-name="a" provider-service-name="b" consumer-version-value="" provider-version-value="1.0;1.1"/> 表示消费端任何版本，允许访问提供端1.0和1.1版本 -->
        <!--    <service consumer-service-name="a" provider-service-name="b" consumer-version-value="1.0" provider-version-value=""/> 表示消费端1.0版本，允许访问提供端任何版本 -->
        <!--    <service consumer-service-name="a" provider-service-name="b" consumer-version-value="" provider-version-value=""/> 表示消费端任何版本，允许访问提供端任何版本 -->
        <!-- 4. 版本对应关系未定义，默认消费端任何版本，允许访问提供端任何版本 -->
        <!-- 特殊情况处理，在使用上需要极力避免该情况发生 -->
        <!-- 1. 消费端的application.properties未定义版本号，则该消费端可以访问提供端任何版本 -->
        <!-- 2. 提供端的application.properties未定义版本号，当消费端在xml里不做任何版本配置，才可以访问该提供端 -->
        <version>
            <!-- 表示网关g的1.0，允许访问提供端服务a的1.0版本 -->
            <service consumer-service-name="discovery-springcloud-example-gateway" provider-service-name="discovery-springcloud-example-a" consumer-version-value="1.0" provider-version-value="1.0"/>
            <!-- 表示网关g的1.1，允许访问提供端服务a的1.1版本 -->
            <service consumer-service-name="discovery-springcloud-example-gateway" provider-service-name="discovery-springcloud-example-a" consumer-version-value="1.1" provider-version-value="1.1"/>
            <!-- 表示网关z的1.0，允许访问提供端服务a的1.0版本 -->
            <service consumer-service-name="discovery-springcloud-example-zuul" provider-service-name="discovery-springcloud-example-a" consumer-version-value="1.0" provider-version-value="1.0"/>
            <!-- 表示网关z的1.1，允许访问提供端服务a的1.1版本 -->
            <service consumer-service-name="discovery-springcloud-example-zuul" provider-service-name="discovery-springcloud-example-a" consumer-version-value="1.1" provider-version-value="1.1"/>
            <!-- 表示消费端服务a的1.0，允许访问提供端服务b的1.0版本 -->
            <service consumer-service-name="discovery-springcloud-example-a" provider-service-name="discovery-springcloud-example-b" consumer-version-value="1.0" provider-version-value="1.0"/>
            <!-- 表示消费端服务a的1.1，允许访问提供端服务b的1.1版本 -->
            <service consumer-service-name="discovery-springcloud-example-a" provider-service-name="discovery-springcloud-example-b" consumer-version-value="1.1" provider-version-value="1.1"/>
            <!-- 表示消费端服务b的1.0，允许访问提供端服务c的1.0和1.1版本 -->
            <service consumer-service-name="discovery-springcloud-example-b" provider-service-name="discovery-springcloud-example-c" consumer-version-value="1.0" provider-version-value="1.0;1.1"/>
            <!-- 表示消费端服务b的1.1，允许访问提供端服务c的1.2版本 -->
            <service consumer-service-name="discovery-springcloud-example-b" provider-service-name="discovery-springcloud-example-c" consumer-version-value="1.1" provider-version-value="1.2"/>
        </version>
        <!-- 服务发现的多区域灰度匹配控制 -->
        <!-- service-name，表示服务名 -->
        <!-- region-value，表示可供访问的区域，如果多个用“;”分隔，不允许出现空格 -->
        <!-- 区域策略介绍 -->
        <!-- 1. 标准配置，举例如下 -->
        <!--    <service consumer-service-name="a" provider-service-name="b" consumer-region-value="dev" provider-region-value="dev"/> 表示dev区域的消费端，允许访问dev区域的提供端 -->
        <!-- 2. 区域值不配置，举例如下 -->
        <!--    <service consumer-service-name="a" provider-service-name="b" provider-region-value="dev;qa"/> 表示任何区域的消费端，允许访问dev区域和qa区域的提供端 -->
        <!--    <service consumer-service-name="a" provider-service-name="b" consumer-region-value="dev"/> 表示dev区域的消费端，允许访问任何区域的提供端 -->
        <!--    <service consumer-service-name="a" provider-service-name="b"/> 表示任何区域的消费端，允许访问任何区域的提供端 -->
        <!-- 3. 区域值空字符串，举例如下 -->
        <!--    <service consumer-service-name="a" provider-service-name="b" consumer-region-value="" provider-region-value="dev;qa"/> 表示任何区域的消费端，允许访问dev区域和qa区域的提供端 -->
        <!--    <service consumer-service-name="a" provider-service-name="b" consumer-region-value="dev" provider-region-value=""/> 表示dev区域的消费端，允许访问任何区域的提供端 -->
        <!--    <service consumer-service-name="a" provider-service-name="b" consumer-region-value="" provider-region-value=""/> 表示任何区域的消费端，允许访问任何区域的提供端 -->
        <!-- 4. 区域对应关系未定义，默认表示任何区域的消费端，允许访问任何区域的提供端 -->
        <!-- 特殊情况处理，在使用上需要极力避免该情况发生 -->
        <!-- 1. 消费端的application.properties未定义区域值，则该消费端可以访问任何区域的提供端 -->
        <!-- 2. 提供端的application.properties未定义区域值，当消费端在xml里不做任何区域配置，才可以访问该提供端 -->
        <region>
            <!-- 表示dev区域的消费端服务a，允许访问dev区域的提供端服务b -->
            <service consumer-service-name="discovery-springcloud-example-a" provider-service-name="discovery-springcloud-example-b" consumer-region-value="dev" provider-region-value="dev"/>
            <!-- 表示qa区域的消费端服务a，允许访问qa区域的提供端服务b -->
            <service consumer-service-name="discovery-springcloud-example-a" provider-service-name="discovery-springcloud-example-b" consumer-region-value="qa" provider-region-value="qa"/>
            <!-- 表示dev区域的消费端服务b，允许访问dev区域的提供端服务c -->
            <service consumer-service-name="discovery-springcloud-example-b" provider-service-name="discovery-springcloud-example-c" consumer-region-value="dev" provider-region-value="dev"/>
            <!-- 表示qa区域的消费端服务b，允许访问qa区域的提供端服务c -->
            <service consumer-service-name="discovery-springcloud-example-b" provider-service-name="discovery-springcloud-example-c" consumer-region-value="qa" provider-region-value="qa"/>
        </region>
        <!-- 服务发现的多版本或者多区域的灰度权重控制 -->
        <!-- service-name，表示服务名 -->
        <!-- weight-value，表示版本对应的权重值，格式为"版本/区域值=权重值"，如果多个用“;”分隔，不允许出现空格 -->
        <!-- 版本权重策略介绍 -->
        <!-- 1. 标准配置，举例如下 -->
        <!--    <service consumer-service-name="a" provider-service-name="b" provider-weight-value="1.0=90;1.1=10"/> 表示消费端访问提供端的时候，提供端的1.0版本提供90%的权重流量，1.1版本提供10%的权重流量 -->
        <!--    <service provider-service-name="b" provider-weight-value="1.0=90;1.1=10"/> 表示所有消费端访问提供端的时候，提供端的1.0版本提供90%的权重流量，1.1版本提供10%的权重流量 -->
        <!-- 2. 局部配置，即指定consumer-service-name，专门为该消费端配置权重。全局配置，即不指定consumer-service-name，为所有消费端配置相同情形的权重。当局部配置和全局配置同时存在的时候，以局部配置优先 -->
        <!-- 3. 尽量为线上所有版本都赋予权重值 -->
        <!-- 全局版本权重策略介绍 -->
        <!-- 1. 标准配置，举例如下 -->
        <!--    <version provider-weight-value="1.0=85;1.1=15"/> 表示版本为1.0的服务提供85%的权重流量，版本为1.1的服务提供15%的权重流量 -->
        <!-- 2. 全局版本权重可以切换整条调用链的权重配比 -->
        <!-- 3. 尽量为线上所有版本都赋予权重值 -->
        <!-- 区域权重策略介绍 -->
        <!-- 1. 标准配置，举例如下 -->
        <!--    <service consumer-service-name="a" provider-service-name="b" provider-weight-value="dev=85;qa=15"/> 表示消费端访问提供端的时候，区域为dev的服务提供85%的权重流量，区域为qa的服务提供15%的权重流量 -->
        <!--    <service provider-service-name="b" provider-weight-value="dev=85;qa=15"/> 表示所有消费端访问提供端的时候，区域为dev的服务提供85%的权重流量，区域为qa的服务提供15%的权重流量 -->
        <!-- 2. 局部配置，即指定consumer-service-name，专门为该消费端配置权重。全局配置，即不指定consumer-service-name，为所有消费端配置相同情形的权重。当局部配置和全局配置同时存在的时候，以局部配置优先 -->
        <!-- 3. 尽量为线上所有版本都赋予权重值 -->
        <!-- 全局区域权重策略介绍 -->
        <!-- 1. 标准配置，举例如下 -->
        <!--    <region provider-weight-value="dev=85;qa=15"/> 表示区域为dev的服务提供85%的权重流量，区域为qa的服务提供15%的权重流量 -->
        <!-- 2. 全局区域权重可以切换整条调用链的权重配比 -->
        <!-- 3. 尽量为线上所有区域都赋予权重值 -->
        <weight>
            <!-- 权重流量配置有如下六种方式，优先级分别是由高到底，即先从第一种方式取权重流量值，取不到则到第二种方式取值，以此类推，最后仍取不到则忽略。使用者按照实际情况，选择一种即可 -->
            <!-- 表示消费端服务b访问提供端服务c的时候，提供端服务c的1.0版本提供90%的权重流量，1.1版本提供10%的权重流量 -->
            <service consumer-service-name="discovery-springcloud-example-b" provider-service-name="discovery-springcloud-example-c" provider-weight-value="1.0=90;1.1=10" type="version"/>
            <!-- 表示所有消费端服务访问提供端服务c的时候，提供端服务c的1.0版本提供90%的权重流量，1.1版本提供10%的权重流量 -->
            <service provider-service-name="discovery-springcloud-example-c" provider-weight-value="1.0=90;1.1=10" type="version"/>
            <!-- 表示所有版本为1.0的服务提供90%的权重流量，版本为1.1的服务提供10%的权重流量 -->
            <version provider-weight-value="1.0=90;1.1=10"/>
            <!-- 表示消费端服务b访问提供端服务c的时候，提供端服务c的dev区域提供85%的权重流量，qa区域提供15%的权重流量 -->
            <service consumer-service-name="discovery-springcloud-example-b" provider-service-name="discovery-springcloud-example-c" provider-weight-value="dev=85;qa=15" type="region"/>
            <!-- 表示所有消费端服务访问提供端服务c的时候，提供端服务c的dev区域提供85%的权重流量，qa区域提供15%的权重流量 -->
            <service provider-service-name="discovery-springcloud-example-c" provider-weight-value="dev=85;qa=15" type="region"/>
            <!-- 表示所有区域为dev的服务提供85%的权重流量，区域为qa的服务提供15%的权重流量 -->
            <region provider-weight-value="dev=85;qa=15"/>
        </weight>
    </discovery>
    <!-- 基于Http Header传递的策略路由，全局缺省路由（第三优先级） -->
    <strategy>
        <!-- 版本路由 -->
        <version>{
     "discovery-springcloud-example-a":"1.0", "discovery-springcloud-example-b":"1.0", "discovery-springcloud-example-c":"1.0;1.2"}</version>
        <!-- <version>1.0</version> -->
        <!-- 区域路由 -->
        <region>{
     "discovery-springcloud-example-a":"qa;dev", "discovery-springcloud-example-b":"dev", "discovery-springcloud-example-c":"qa"}</region>
        <!-- <region>dev</region> -->
        <!-- IP地址和端口路由 -->
        <address>{
     "discovery-springcloud-example-a":"192.168.43.101:1100", "discovery-springcloud-example-b":"192.168.43.101:1201", "discovery-springcloud-example-c":"192.168.43.101:1300"}</address>
        <!-- 权重流量配置有如下四种方式，优先级分别是由高到底，即先从第一种方式取权重流量值，取不到则到第二种方式取值，以此类推，最后仍取不到则忽略。使用者按照实际情况，选择一种即可 -->
        <!-- 版本权重路由 -->
        <version-weight>{
     "discovery-springcloud-example-a":"1.0=90;1.1=10", "discovery-springcloud-example-b":"1.0=90;1.1=10", "discovery-springcloud-example-c":"1.0=90;1.1=10"}</version-weight>
        <!-- <version-weight>1.0=90;1.1=10</version-weight> -->
        <!-- 区域权重路由 -->
        <region-weight>{
     "discovery-springcloud-example-a":"dev=85;qa=15", "discovery-springcloud-example-b":"dev=85;qa=15", "discovery-springcloud-example-c":"dev=85;qa=15"}</region-weight>
        <!-- <region-weight>dev=85;qa=15</region-weight> -->
    </strategy>
    <!-- 基于Http Header传递的定制化策略路由，支持蓝绿部署和灰度发布两种模式。如果都不命中，则执行上面的全局缺省路由 -->
    <strategy-customization>
        <!-- Spel表达式在XML中的转义符：-->
        <!-- 和符号 & 转义为 & 必须转义 -->
        <!-- 小于号 < 转义为 < 必须转义 -->
        <!-- 双引号 " 转义为 " 必须转义 -->
        <!-- 大于号 > 转义为 > -->
        <!-- 单引号 ' 转义为 ' -->
        <!-- 全链路蓝绿部署：条件命中的匹配方式（第一优先级），支持版本匹配、区域匹配、IP地址和端口匹配、版本权重匹配、区域权重匹配 -->
        <!-- Header节点不允许缺失 -->
        <conditions type="blue-green">
            <condition id="1" header="#H['a'] == '1' &&H['b'] == '2'" version-id="a-1" region-id="b-1" address-id="c-1" version-weight-id="d-1" region-weight-id="e-1"/>
            <condition id="2" header="#H['c'] == '3'" version-id="a-2" region-id="b-2" address-id="c-2" version-weight-id="d-2" region-weight-id="e-2"/>
        </conditions>
        <!-- 全链路灰度发布：条件命中的随机权重（第二优先级），支持版本匹配、区域匹配、IP地址和端口匹配 -->
        <!-- Header节点允许缺失，当含Header和未含Header的配置并存时，以未含Header的配置为优先 -->
        <conditions type="gray">
            <condition id="1" header="#H['a'] == '1' &&H['b'] == '2'" version-id="a-1=10;a-2=90" region-id="b-1=20;b-2=80" address-id="c-1=30;c-2=70"/>
            <condition id="2" header="#H['c'] == '3'" version-id="a-1=90;a-2=10" region-id="b-1=80;b-2=20" address-id="c-1=70;c-2=30"/>
            <condition id="3" version-id="a-1=5;a-2=95" region-id="b-1=5;b-2=95" address-id="c-1=5;c-2=95"/>
        </conditions>
        <routes>
            <route id="a-1" type="version">{
     "discovery-springcloud-example-a":"1.0", "discovery-springcloud-example-b":"1.0", "discovery-springcloud-example-c":"1.0;1.2"}</route>
            <route id="a-2" type="version">{
     "discovery-springcloud-example-a":"1.1", "discovery-springcloud-example-b":"1.1", "discovery-springcloud-example-c":"1.2"}</route>
            <route id="b-1" type="region">{
     "discovery-springcloud-example-a":"qa;dev", "discovery-springcloud-example-b":"dev", "discovery-springcloud-example-c":"qa"}</route>
            <route id="b-2" type="region">{
     "discovery-springcloud-example-a":"qa", "discovery-springcloud-example-b":"qa", "discovery-springcloud-example-c":"qa"}</route>
            <route id="c-1" type="address">{
     "discovery-springcloud-example-a":"192.168.43.101:1100", "discovery-springcloud-example-b":"192.168.43.101:1201", "discovery-springcloud-example-c":"192.168.43.101:1300"}</route>
            <route id="c-2" type="address">{
     "discovery-springcloud-example-a":"192.168.43.101:1101", "discovery-springcloud-example-b":"192.168.43.101:1201", "discovery-springcloud-example-c":"192.168.43.101:1301"}</route>
            <route id="d-1" type="version-weight">{
     "discovery-springcloud-example-a":"1.0=90;1.1=10", "discovery-springcloud-example-b":"1.0=90;1.1=10", "discovery-springcloud-example-c":"1.0=90;1.1=10"}</route>
            <route id="d-2" type="version-weight">{
     "discovery-springcloud-example-a":"1.0=10;1.1=90", "discovery-springcloud-example-b":"1.0=10;1.1=90", "discovery-springcloud-example-c":"1.0=10;1.1=90"}</route>
            <route id="e-1" type="region-weight">{
     "discovery-springcloud-example-a":"dev=85;qa=15", "discovery-springcloud-example-b":"dev=85;qa=15", "discovery-springcloud-example-c":"dev=85;qa=15"}</route>
            <route id="e-2" type="region-weight">{
     "discovery-springcloud-example-a":"dev=15;qa=85", "discovery-springcloud-example-b":"dev=15;qa=85", "discovery-springcloud-example-c":"dev=15;qa=85"}</route>
        </routes>
        <!-- 策略中配置条件表达式中的Header来决策蓝绿和灰度，可以代替外部传入Header -->
        <headers>
            <header key="a" value="1"/>
        </headers>
    </strategy-customization>
    <!-- 策略路由上服务屏蔽黑名单。一般适用于服务下线场景，流量实现实时性的绝对无损：下线之前，把服务实例添加到下面屏蔽名单中，负载均衡不会去寻址该服务实例。下线之后，清除该名单。该配置运行在全局订阅模式下 -->
    <strategy-blacklist>
        <!-- 通过全局唯一ID进行屏蔽，ID对应于元数据spring.application.uuid字段，适用于Docker和K8s上IP地址不确定的场景 -->
        <!-- 单个ID形式。如果多个用“;”分隔，不允许出现空格 -->
        <id value="e92edde5-0153-4ec8-9cbb-b4d3f415aa33;af043384-c8a5-451e-88f4-457914e8e3bc"/>
        <!-- 多个ID节点形式 -->
        <!-- <id value="e92edde5-0153-4ec8-9cbb-b4d3f415aa33"/>
        <id value="af043384-c8a5-451e-88f4-457914e8e3bc"/> -->
        <!-- 通过IP地址或者端口或者IP地址+端口进行屏蔽。适用于IP地址确定的场景 -->
        <!-- 单个Address形式。如果多个用“;”分隔，不允许出现空格 -->
        <address value="192.168.43.101:1201;192.168.*.102;1301"/>
        <!-- 多个Address节点形式 -->
        <!-- <address value="192.168.43.101:1201"/>
        <address value="192.168.*.102"/>
        <address value="1301"/> -->
    </strategy-blacklist>
    <!-- 参数控制，由远程推送参数的改变，实现一些特色化的灰度发布，例如，基于数据库和消息队列的灰度发布 -->
    <parameter>
        <!-- 服务a在版本为1.0的时候，数据库的数据源指向db1；服务a在版本为1.1的时候，数据库的数据源指向db2 -->
        <!-- 服务b在区域为dev的时候，消息队列指向queue1；服务b在区域为dev的时候，消息队列指向queue2 -->
        <!-- 服务c在环境为env1的时候，数据库的数据源指向db1；服务c在环境为env2的时候，数据库的数据源指向db2 -->
        <!-- 服务d在可用区为zone1的时候，消息队列指向queue1；服务d在可用区为zone2的时候，消息队列指向queue2 -->
        <!-- 服务c在IP地址和端口为192.168.43.101:1201的时候，数据库的数据源指向db1；服务c在IP地址和端口为192.168.43.102:1201的时候，数据库的数据源指向db2 -->
        <service service-name="discovery-springcloud-example-a" tag-key="version" tag-value="1.0" key="ShardingSphere" value="db1"/>
        <service service-name="discovery-springcloud-example-a" tag-key="version" tag-value="1.1" key="ShardingSphere" value="db2"/>
        <service service-name="discovery-springcloud-example-b" tag-key="region" tag-value="dev" key="RocketMQ" value="queue1"/>
        <service service-name="discovery-springcloud-example-b" tag-key="region" tag-value="qa" key="RocketMQ" value="queue2"/>
        <service service-name="discovery-springcloud-example-c" tag-key="env" tag-value="env1" key="ShardingSphere" value="db1"/>
        <service service-name="discovery-springcloud-example-c" tag-key="env" tag-value="env2" key="ShardingSphere" value="db2"/>
        <service service-name="discovery-springcloud-example-d" tag-key="zone" tag-value="zone1" key="RocketMQ" value="queue1"/>
        <service service-name="discovery-springcloud-example-d" tag-key="zone" tag-value="zone2" key="RocketMQ" value="queue2"/>
        <service service-name="discovery-springcloud-example-e" tag-key="address" tag-value="192.168.43.101:1201" key="ShardingSphere" value="db1"/>
        <service service-name="discovery-springcloud-example-e" tag-key="address" tag-value="192.168.43.102:1201" key="ShardingSphere" value="db2"/>
    </parameter>
</rule>
```
