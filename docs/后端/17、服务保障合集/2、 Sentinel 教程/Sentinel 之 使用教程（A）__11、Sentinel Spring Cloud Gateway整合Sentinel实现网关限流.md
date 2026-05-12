# 11、Sentinel Spring Cloud Gateway整合Sentinel实现网关限流
- 来源：https://ddkk.com/zhuanlan/guarantee/sentinel/11.html
- 分类：服务保障
- 分组：Sentinel 之 使用教程（A）
## 网关限流

Sentinel 支持对 Spring Cloud Gateway、Zuul 等主流的 API Gateway 进行限流。

Sentinel 1.6.0 引入了 Sentinel API Gateway Adapter Common 模块，此模块中包含网关限流的规则和自定义 API 的实体和管理逻辑：

- GatewayFlowRule：网关限流规则，针对 API Gateway 的场景定制的限流规则，可以针对不同 route 或自定义的 API 分组进行限流，支持针对请求中的参数、Header、来源 IP 等进行定制化的限流。
- ApiDefinition：用户自定义的 API 定义分组，可以看做是一些 URL 匹配的组合。比如我们可以定义一个 API 叫 my_api，请求 path 模式为 /foo/** 和 /baz/** 的都归到 my_api 这个 API 分组下面。限流的时候可以针对这个自定义的 API 分组维度进行限流。

## 网关流控实现原理

当通过GatewayRuleManager 加载网关流控规则（GatewayFlowRule）时，无论是否针对请求属性进行限流，Sentinel 底层都会将网关流控规则转化为热点参数规则（ParamFlowRule），存储在 GatewayRuleManager 中，与正常的热点参数规则相隔离。转换时 Sentinel 会根据请求属性配置，为网关流控规则设置参数索引（idx），并同步到生成的热点参数规则中。

外部请求进入 API Gateway 时会经过 Sentinel 实现的 filter，其中会依次进行 路由/API 分组匹配、请求属性解析和参数组装。Sentinel 会根据配置的网关流控规则来解析请求属性，并依照参数索引顺序组装参数数组，最终传入 SphU.entry(res, args) 中。Sentinel API Gateway Adapter Common 模块向 Slot Chain 中添加了一个 GatewayFlowSlot，专门用来做网关规则的检查。GatewayFlowSlot 会从 GatewayRuleManager 中提取生成的热点参数规则，根据传入的参数依次进行规则检查。若某条规则不针对请求属性，则会在参数最后一个位置置入预设的常量，达到普通流控的效果。

## 整合Spring Cloud Gateway

从1.6.0 版本开始，Sentinel 提供了 Spring Cloud Gateway 的适配模块，可以提供两种资源维度的限流：

- route 维度：即在 Spring 配置文件中配置的路由条目，资源名为对应的 routeId
- 自定义 API 维度：用户可以利用 Sentinel 提供的 API 来自定义一些 API 分组

### 1. 搭建Gateway网关项目

这里不详细说明，可参照其他文档，框架版本：

- Nacos：1.4.1
- sentinel ：1.8.0
- spring-cloud ：Hoxton.RELEASE
- spring-cloud-alibaba：2.2.0.RELEASE
- spring.boot：2.2.13.RELEASE

### 2. gateway集成sentinel

首先添加cloud sentinel对gateway的相关依赖。

```xml
<dependency>
  <groupId>com.alibaba.cloud</groupId>
  <artifactId>spring-cloud-starter-alibaba-sentinel</artifactId>
</dependency>
<dependency>
  <groupId>com.alibaba.cloud</groupId>
  <artifactId>spring-cloud-alibaba-sentinel-gateway</artifactId>
</dependency>
<dependency>
  <groupId>com.alibaba.csp</groupId>
  <artifactId>sentinel-spring-cloud-gateway-adapter</artifactId>
</dependency>
```

**重点在Gateway的相关配置**

- locator.enabled：gateway开启服务注册和发现的功能，这样就不需要自己配置各种route。
- scg.fallback：配置限流异常时响应的信息。
- route-id-prefix：配置routeId的前缀，采用了自动注册，最终routeId为 route-id-注册服务名

```bash
spring:
  application:
    name: gateway
  cloud:
    nacos:
      discovery:
        server-addr: 127.0.0.1     nacos注册地址
      config:
        server-addr: 127.0.0.1     远程配置地址
    sentinel:
      transport:
        dashboard: localhost:8080       sentinel注册地址
      直接建立心跳
      eager: true
      scg:
        限流后的响应配置
        fallback:
          content-type: application/json
          模式 response、redirect
          mode: response
          响应状态码
          response-status: 429
          响应信息
          response-body: 对不起，已经被限流了！！！
    gateway:
      spring cloud gateway 路由配置方式
      discovery:
        locator:
          enabled: true                   表明gateway开启服务注册和发现的功能
          lower-case-service-id: true     将请求路径上的服务名配置为小写
          route-id-prefix: route-id-   配置routeId的前缀，最终为 route-id-注册服务名
```

### 3. 启动控制台

启动控制台、注册中心、网关、应用后台(sentinel-client-demo)，查看控制台，重点看下会有个API管理的菜单，如果没有

可参照这个文档[Sentinel整合Gateway控制台不显示API管理](https://blog.csdn.net/qq_43437874/article/details/119992770)。

对比普通应用的菜单，我们发现有几个不同点：

- 簇点链路=》请求链路
- 多了个API管理
- 没有热点规则
- 没有授权规则
- 没有集群流控

## 测试案例

### 1. 使用routId限流

点击流控规则菜单，添加规则，发现这里没有资源名称可以填写，只能选择 Route ID或者API分组。

我们添加一个 Route ID， Route ID就是Gateway路由里配置的ID，因为在Gateway中配置了route-id-prefix，所有这里应该写route-id-加上服务在Nacos注册的服务名。

以下配置表示对route-id-sentinel-client-demo这个路由进行访问时，QPS限制为一秒一次请求。

当我们快速访问Gateway配置的路由后端服务接口时，发现返回了我们配置的限流信息。

### 2. 使用API分组限流

在之前的案例中，一个访问接口，可以代表一个资源。

但是在网关中，Sentinel 网关流控默认的粒度是 route 维度以及自定义 API分组维度，默认不支持 URL 粒度。

这种可能是考虑到，网关作为所有后台应用的入口，如果不分组，那么肯定太多了。

比如我们根据限流规则建立一个分组，这个分组表示具体的限流策略。然后可以在这个分组下添加多个匹配模式，下面的规则表示，访问app1和访问app2后台应用时，可以在这个组添加一样的限流规则（这里需要添加通过网关访问时完整路径）。

注意精确是指完整匹配，前缀模式时需要添加**。

添加完分组后，我们在添加流控规则时，选择API分组，然后配置限流规则就可以了。。。

### 3.针对请求属性限流

在添加流控规则时，我们发现，还可以针对请求属性进行限流如 （URL 参数，Client IP，Header 等）。

比如，我们对谷歌浏览器进行限流，当消息头中User-Agent为谷歌浏览器时，触发限流。

测试使用谷歌浏览器，触发限流，而换个浏览器时，则正常访问。

### 4. 请求链路

在通过网关访问时，会自动生成当前访问的路由节点信息，我们也可以直接在这里添加规则。
