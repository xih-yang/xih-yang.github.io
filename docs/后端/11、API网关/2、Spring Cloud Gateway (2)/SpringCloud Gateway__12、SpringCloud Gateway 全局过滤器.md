# 12、SpringCloud Gateway 全局过滤器
- 来源：https://ddkk.com/zhuanlan/gateway/springcloudgateway/2/12.html
- 分类：API网关
- 分组：SpringCloud Gateway
在[过滤器](https://blog.csdn.net/zhang0114/article/details/123179037)中为大家介绍了一些与路由同时配置的过滤器，并且在配置时可以通过`spring.cloud.gateway.default-filters`实现所配置的过滤器全局生效。

本节为大家介绍几个不需要配置在default-filters中就全局生效的过滤器。

## GlobalFilter

GlobalFilter 是用来定义全局过滤器的接口，通过实现GlobalFilter接口可以实现各种自定义过滤器。

有多个拦截器时通过Ordered接口实现getOrder()方法来指定执行顺序，返回值越小执行顺序越靠前。

## ForwardRoutingFilter

当route的uri中协议为forward（如：forward:///otherendpoint）时，此过滤器将会把请求url重写为forward指定的url。

## ReactiveLoadBalancerClientFilter

此过滤器配合注册中心实现通过注册中心自动发现服务地址，并通过Spring Cloud的ReactorLoadBalancer实现负载均衡。

```sh
spring:
  cloud:
    gateway:
      routes:
      - id: myRoute
        uri: lb://serviceId
        predicates:
        - Path=/service/**
```

## NettyRoutingFilter

当route的uri中协议为http/https时，此过滤器将通过Netty的HttpClient来调用下游服务，调用结束后将response信息放到`ServerWebExchangeUtils.CLIENT_RESPONSE_ATTR`的exchange属性中供后续使用。

## NettyWriteResponseFilter

当exchange的`ServerWebExchangeUtils.CLIENT_RESPONSE_ATTR`属性中包含Netty的HttpClientResponse，此过滤器将在其他所有过滤器执行结束后最后将响应返回给网关的客户端。

## RouteToRequestUrlFilter

当exchange的`ServerWebExchangeUtils.GATEWAY_ROUTE_ATTR`属性中包含Route对象时，将基于请求中的uri创建新的uri。

## WebsocketRoutingFilter

此过滤器用于代理转发Websocket服务。

## GatewayMetricsFilter

此过滤器通过`spring.cloud.gateway.metrics.enabled`配置可以开启网关指标执行器，可以通过/actuator/metrics/spring.cloud.gateway.requests获得routeId、routeUri、outcome、status、httpStatusCode、httpMethod、path等信息。

## ForwardedHeadersFilter

此过滤器将在header中添加Forwarded头。

## RemoveHopByHopHeadersFilter

此过滤器用于配置从请求头中默认删除以下信息：Connection、Keep-Alive、Proxy-Authenticate、Proxy-Authorization、TE、Trailer、Transfer-Encoding、Upgrade，也可以通过配置`spring.cloud.gateway.filter.remove-hop-by-hop.headers`指定需要删除哪些请求头。

## XForwardedHeadersFilter

此过滤器将创建一系类X-Forwarded-*请求头，详细请查看[链接](https://docs.spring.io/spring-cloud-gateway/docs/current/reference/html/#xforwarded-headers-filter)

> 版权声明：「DDKK.COM 弟弟快看，程序员编程资料站」本站文章，版权归原作者所有
