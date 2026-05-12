# 11、SpringCloud Gateway 网关管理API
- 来源：https://ddkk.com/zhuanlan/gateway/springcloudgateway/1/27.html
- 分类：API网关
- 分组：SpringCloud Gateway
## 前言

Spring Cloud Gateway 提供了很多API 用来管理网关，在`org.springframework.cloud.gateway.actuate`包中，可以看到提供了一些访问API。

## 管理API

需要配置`spring-boot-starter-actuator`，公开这些访问端点，首先添加Pom:

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-actuator</artifactId>
</dependency>
```

然后在YML中公开这些端点：

```bash
management:
  endpoint:
    health:
      是否显示health详细信息
      show-details: always
      show-components: always
    gateway:
      enabled: true
  endpoints:
    Web端点的配置属性
    web:
      exposure:
         开放端点的ID集合（eg:['health','info','beans','env']），配置为“*”表示全部
        include: '*'
```

### 1. 查询所有路由

可以通过 `GET /actuator/gateway/routes`查询到所有路由信息：

```bash
https://localhost:8443/actuator/gateway/routes
```

示例如下：

```bash
[
    {
        "predicate": "Paths: [/app-service001/**], match trailing slash: true",
        "metadata": {
            "nacos.instanceId": "192.168.58.1#9000#DEFAULT#DEFAULT_GROUP@@app-service001",
            "nacos.weight": "1.0",
            "nacos.cluster": "DEFAULT",
            "nacos.ephemeral": "true",
            "nacos.healthy": "true",
            "preserved.register.source": "SPRING_CLOUD",
            "secure": "true"
        },
        "route_id": "ReactiveCompositeDiscoveryClient_app-service001",
        "filters": [
            "[[RewritePath /app-service001/?(?<remaining>.*) = '/${remaining}'], order = 1]"
        ],
        "uri": "lb://app-service001",
        "order": 0
    }
]
```

### 2. 查询过滤器

可以通过 `GET /actuator/gateway/globalfilters`查询到已注入的所有全局过滤器：

```bash
https://localhost:8443/actuator/gateway/globalfilters
```

示例如下：

```bash
{
    "org.springframework.cloud.gateway.filter.NettyWriteResponseFilter@1fb2eec": -1,
    "org.springframework.cloud.gateway.filter.RouteToRequestUrlFilter@2a0b901c": 10000,
    "org.springframework.cloud.gateway.filter.AdaptCachedBodyGlobalFilter@4026461d": -2147482648,
    "org.springframework.cloud.gateway.filter.ForwardPathFilter@6544899b": 0,
    "org.springframework.cloud.gateway.filter.WebsocketRoutingFilter@6da54910": 2147483646,
    "org.springframework.cloud.gateway.filter.RemoveCachedBodyFilter@4c18516": -2147483648,
    "org.springframework.cloud.gateway.filter.ReactiveLoadBalancerClientFilter@752b69e3": 10150,
    "org.springframework.cloud.gateway.filter.GatewayMetricsFilter@1bd8afc8": 0,
    "org.springframework.cloud.gateway.filter.NettyRoutingFilter@15605d83": 2147483647,
    "org.springframework.cloud.gateway.filter.ForwardRoutingFilter@3d104c9b": 2147483647
}
```

可以通过 `GET /actuator/gateway/routefilters`查询到已注入的所有网关过滤器：

```bash
https://localhost:8443/actuator/gateway/routefilters
```

示例如下：

```bash
{
    "[RemoveRequestHeaderGatewayFilterFactory@454bcbbf configClass = AbstractGatewayFilterFactory.NameConfig]": null,
    "[RedirectToGatewayFilterFactory@624b3544 configClass = RedirectToGatewayFilterFactory.Config]": null,
    "[RequestHeaderToRequestUriGatewayFilterFactory@4d4c1ba9 configClass = AbstractGatewayFilterFactory.NameConfig]": null,
    "[SetRequestHostHeaderGatewayFilterFactory@ceb7701 configClass = SetRequestHostHeaderGatewayFilterFactory.Config]": null,
    "[RequestSizeGatewayFilterFactory@2017f6e6 configClass = RequestSizeGatewayFilterFactory.RequestSizeConfig]": null,
    "[SetStatusGatewayFilterFactory@76a362a4 configClass = SetStatusGatewayFilterFactory.Config]": null,
    "[RemoveResponseHeaderGatewayFilterFactory@27e199ce configClass = AbstractGatewayFilterFactory.NameConfig]": null,
    "[SetResponseHeaderGatewayFilterFactory@5e193ef5 configClass = AbstractNameValueGatewayFilterFactory.NameValueConfig]": null,
    "[StripPrefixGatewayFilterFactory@5627cb29 configClass = StripPrefixGatewayFilterFactory.Config]": null,
    "[AddRequestParameterGatewayFilterFactory@30b3d899 configClass = AbstractNameValueGatewayFilterFactory.NameValueConfig]": null,
    "[RewriteLocationResponseHeaderGatewayFilterFactory@21274afe configClass = RewriteLocationResponseHeaderGatewayFilterFactory.Config]": null,
    "[PreserveHostHeaderGatewayFilterFactory@20256a0b configClass = Object]": null,
    "[RetryGatewayFilterFactory@7364f68 configClass = RetryGatewayFilterFactory.RetryConfig]": null,
    "[RewritePathGatewayFilterFactory@1c3b6963 configClass = RewritePathGatewayFilterFactory.Config]": null,
    "[RewriteResponseHeaderGatewayFilterFactory@106c988 configClass = RewriteResponseHeaderGatewayFilterFactory.Config]": null,
    "[MapRequestHeaderGatewayFilterFactory@34c76167 configClass = MapRequestHeaderGatewayFilterFactory.Config]": null,
    "[RemoveRequestParameterGatewayFilterFactory@2c9fdb64 configClass = AbstractGatewayFilterFactory.NameConfig]": null,
    "[AddRequestHeaderGatewayFilterFactory@559991f5 configClass = AbstractNameValueGatewayFilterFactory.NameValueConfig]": null,
    "[SetPathGatewayFilterFactory@55a0f011 configClass = SetPathGatewayFilterFactory.Config]": null,
    "[ModifyRequestBodyGatewayFilterFactory@61d60e38 configClass = ModifyRequestBodyGatewayFilterFactory.Config]": null,
    "[SecureHeadersGatewayFilterFactory@7ea42c82 configClass = SecureHeadersGatewayFilterFactory.Config]": null,
    "[SetRequestHeaderGatewayFilterFactory@39133244 configClass = AbstractNameValueGatewayFilterFactory.NameValueConfig]": null,
    "[AddResponseHeaderGatewayFilterFactory@78d92eef configClass = AbstractNameValueGatewayFilterFactory.NameValueConfig]": null,
    "[SaveSessionGatewayFilterFactory@61da0413 configClass = Object]": null,
    "[PrefixPathGatewayFilterFactory@71531dd7 configClass = PrefixPathGatewayFilterFactory.Config]": null,
    "[ModifyResponseBodyGatewayFilterFactory@404ced67 configClass = ModifyResponseBodyGatewayFilterFactory.Config]": null,
    "[DedupeResponseHeaderGatewayFilterFactory@6e95973c configClass = DedupeResponseHeaderGatewayFilterFactory.Config]": null,
    "[RequestHeaderSizeGatewayFilterFactory@115c946b configClass = RequestHeaderSizeGatewayFilterFactory.Config]": null
}
```

### 3. 刷新路由缓存

可以通过 `POST /actuator/gateway/refresh`清除路由缓存。该请求返回200，但没有响应正文。

### 4. 查询单个路由信息

可以通过 `GET /actuator/gateway/routes/{id}` 检索单个路由的信息。

```bash
https://localhost:8443/actuator/gateway/routes/ReactiveCompositeDiscoveryClient_app-service001
```

结果如下：

```bash
{
    "predicate": "Paths: [/app-service001/**], match trailing slash: true",
    "metadata": {
        "nacos.instanceId": "192.168.58.1#9000#DEFAULT#DEFAULT_GROUP@@app-service001",
        "nacos.weight": "1.0",
        "nacos.cluster": "DEFAULT",
        "nacos.ephemeral": "true",
        "nacos.healthy": "true",
        "preserved.register.source": "SPRING_CLOUD",
        "secure": "true"
    },
    "route_id": "ReactiveCompositeDiscoveryClient_app-service001",
    "filters": [
        "[[RewritePath /app-service001/?(?<remaining>.*) = '/${remaining}'], order = 1]"
    ],
    "uri": "lb://app-service001",
    "order": 0
}
```

### 5. 创建和删除路由

要创建路由 ，请创建`POST /gateway/routes/{id_route_to_create}`，带有指定路由字段的JSON格式请求。

要删除路由，请创建一个`DELETE /gateway/routes/{id_route_to_delete}`请求。

一般不这么干，所以不演示了。。。
