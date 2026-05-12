# 10、SpringCloud Gateway 跨域解决
- 来源：https://ddkk.com/zhuanlan/gateway/springcloudgateway/2/10.html
- 分类：API网关
- 分组：SpringCloud Gateway
在前后端分离的项目中，在后端没配置任何的情况下，前端去请求都会报出跨域问题。

**产生跨域的原因：**

浏览器同源策略。协议、ip、端口不一致都会导致跨域。

**跨域解决方案通常有如下几种：**

Nginx层面解决：添加请求头或者反向代理来模拟同源；

**前端层面解决：**

如Vue中的配置文件proxy原理也是通过反向代理、或者通过JSONP来解决；

**后端层面解决:**

**1、** SpringBoot中的Crossorigin注解（缺点：每个类都需要加）；

**2、** SpringBoot通过过滤器设置请求头；

**3、** SpringBoot通过拦截器设置请求头；

**4、** SpringBoot设置Mvc的请求头；

**5、** 微服务网关反向代理的方式；

**6、** 微服务网关设置请求头；

在网关和在子项目设置的区别：在网关设置相对比较统一，专业的人干专业的事，而后期项目多了，每个项目都需要配置比较麻烦，子项目只需要关注业务就行。

代理和请求头设置跨域的区别：代理是模拟同源策略，前提条件是前端打包后在同一个域名下，这样相对安全。

本文主要讲到SpringCloud Gateway 来设置请求头来允许跨域。

### 代码实现

```java
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.http.HttpHeaders;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;
@Component
public class CrossOriginFilter implements GlobalFilter {
    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        ServerHttpResponse response = exchange.getResponse();
        HttpHeaders headers = response.getHeaders();
        headers.add(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN, "*");
        headers.add(HttpHeaders.ACCESS_CONTROL_ALLOW_METHODS, "POST, GET, PUT, OPTIONS, DELETE, PATCH");
        headers.add(HttpHeaders.ACCESS_CONTROL_ALLOW_CREDENTIALS, "true");
        headers.add(HttpHeaders.ACCESS_CONTROL_ALLOW_HEADERS, "*");
        headers.add(HttpHeaders.ACCESS_CONTROL_EXPOSE_HEADERS, "*");
        return chain.filter(exchange);
    }
}
```
