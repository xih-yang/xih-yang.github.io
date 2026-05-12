# 8、Sentinel 使用 Nacos 配置规则
- 来源：https://ddkk.com/zhuanlan/guarantee/sentinel/8.html
- 分类：服务保障
- 分组：Sentinel 之 使用教程（A）
## 动态规则

### 规则

Sentinel 的理念是开发者只需要关注资源的定义，当资源定义成功后可以动态增加各种流控降级规则。

在实际使用过程中，设置规则之后，保存在内存中，应用重启后，规则失效，而目前sentinel并没有直接提供持久化保存规则的功能，需要自己实现。

### Sentinel 提供两种方式修改规则：

- 通过 API 直接修改 (loadRules)
- 通过 DataSource 适配不同数据源修改

手动通过 API 修改比较直观，可以通过以下几个 API 修改不同的规则：

```java
FlowRuleManager.loadRules(List<FlowRule> rules); // 修改流控规则
DegradeRuleManager.loadRules(List<DegradeRule> rules); // 修改降级规则
```

手动修改规则（硬编码方式）一般仅用于测试和演示，生产上一般通过动态规则源的方式来动态管理规则。

## DataSource 扩展

上述loadRules() 方法只接受内存态的规则对象，但更多时候规则应该存储在文件、数据库或者配置中心当中。DataSource 接口给我们提供了对接任意配置源的能力。相比直接通过 API 修改规则，实现 DataSource 接口是更加可靠的做法。

推荐通过控制台设置规则后将规则推送到统一的规则中心，客户端实现 ReadableDataSource 接口端监听规则中心实时获取变更，流程如下：

DataSource 扩展常见的实现方式有:

- 拉模式：客户端主动向某个规则管理中心定期轮询拉取规则，这个规则中心可以是 RDBMS、文件，甚至是 VCS 等。这样做的方式是简单，缺点是无法及时获取变更；
- 推模式：规则中心统一推送，客户端通过注册监听器的方式时刻监听变化，比如使用 Nacos、Zookeeper 等配置中心。这种方式有更好的实时性和一致性保证。

Sentinel 目前支持以下数据源扩展：

- Pull-based: 动态文件数据源、Consul, Eureka
- Push-based: ZooKeeper, Redis, Nacos, Apollo, etcd

## 推模式：使用 Nacos 配置规则

Nacos 是阿里中间件团队开源的服务发现和动态配置中心。Sentinel 针对 Nacos 作了适配，底层可以采用 Nacos 作为规则配置数据源。

## 测试案例

### 1. 启动Sentinel控制台

为了后续深入研究，这里直接克隆sentinel源码，[地址](https://github.com/alibaba/Sentinel.git)，切换到1.8分支，导入IDEA，并启动控制台，使用sentinel/sentinel登录。

### 2. 启动nacos

[单机部署Nacos1.3.2](https://blog.csdn.net/qq_43437874/article/details/107850368)

### 3. 创建Spring Cloud项目

参考文档，创建一个spring cloud项目，并初步集成nacos、sentinel控制台。

[集成Nacos注册中心](https://blog.csdn.net/qq_43437874/article/details/107852072)

[集成Nacos配置中心](https://blog.csdn.net/qq_43437874/article/details/108267895)

[集成Sentinel](/zhuanlan/guarantee/sentinel/2.html)

### 4. 使用Nacos持久化规则

#### 1、添加依赖

首先需要添加sentinel对Nacos数据源的支持依赖。

```java
        <dependency>
            <groupId>com.alibaba.csp</groupId>
            <artifactId>sentinel-datasource-nacos</artifactId>
        </dependency>
```

#### 2、nacos中添加流控规则

新建一个配置，配置Data ID为服务名（spring.application.name）加上后缀，Group为DEFAULT_GROUP（默认分组）。

特别注意的是配置内容，需要使用JSON格式。这里是一个数组，数组中每个Json对象表示一条流控规则。

每个规则类型不同，其格式也不同。所以一个配置文件，只能对应一种规则类型，当你想配置所有的规则时，需要创建不同的配置文件。

这里创建两个配置，一个是流控规则，一个是降级规则，配置内容如下：

sentinel-demo-sentinel文件流控规则：

```java
[
    {
        "resource": "/**",
        "limitApp": "default",
        "grade": 1,
        "count": 1,
        "strategy": 0,
        "controlBehavior": 0,
        "clusterMode": false
    }
]
```

sentinel-demo-sentinel-degrade文件降级规则：

```java
[
    {
        "count":500,
        "grade":0,
        "limitApp":"default",
        "minRequestAmount":5,
        "resource":"/test",
        "slowRatioThreshold":1,
        "statIntervalMs":1000,
        "timeWindow":100
    }
]
```

#### 3、服务配置

规则在nacos中配置完成后，需要在yml中配置nacos-datasource，这里配置了两个datasource，一个是流控规则，一个是降级规则。

```bash
spring:
  application:
    name: sentinel-demo
  cloud:
    sentinel:
      transport:
        dashboard: localhost:8080       sentinel注册地址
      datasource:
        r1:
          nacos:
          	# nacos地址
            server-addr: localhost:8848
            nacos中配置文件的data-id
            data-id: ${
     spring.application.name}-sentinel
            nacos 分组
            group-id: DEFAULT_GROUP
            规则类型 流控
            rule-type: flow
        r2:
          nacos:
            server-addr: localhost:8848
            data-id: ${
     spring.application.name}-sentinel-degrade
            group-id: DEFAULT_GROUP
            rule-type: degrade
```

这里需要注意rule-type的配置，需要根据不同的配置规则文件配置，比如${spring.application.name}-sentinel这个配置文件是流控规则，就需要配置为flow。

rule-type的配置项对应RuleType 枚举类。

```java
public enum RuleType {
    FLOW("flow", FlowRule.class),
    DEGRADE("degrade", DegradeRule.class),
    PARAM_FLOW("param-flow", ParamFlowRule.class),
    SYSTEM("system", SystemRule.class),
    AUTHORITY("authority", AuthorityRule.class),
    GW_FLOW("gw-flow", "com.alibaba.csp.sentinel.adapter.gateway.common.rule.GatewayFlowRule"),
    GW_API_GROUP("gw-api-group", "com.alibaba.csp.sentinel.adapter.gateway.common.api.ApiDefinition");
}
```

## 测试

### 1. 启动

我们启动nacos、sentinel、服务后台，查看规则，发现Ncaos中的规则能够在控制台中显示。

### 2. 访问流控接口

访问流控接口，触发限流规则，发现规则生效

### 3. 修改Nacos流控规则

修改Nacos中的流控规则，然后查看sentinel控制台，发现规则会自动更新。

### 4. sentinel添加流控规则

在sentinel控制台添加流控规则，发现新加规则并没有在Nacos配置中更新，那么肯定是保存在内存中了。。。过一会儿就会被清理掉。

## 遗留问题

通过实践发现，基于以上方案，可以实现在Nacos中持久化规则，但是实际开发，我们更需要的是在控制台中直接添加规则，然后持久化到Nacos中，实现双向同步。如何实现呢？后续深入分析。。。

想要的：
