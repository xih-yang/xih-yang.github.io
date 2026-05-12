# 04、SpringCloud Gateway 灰度发布
- 来源：https://ddkk.com/zhuanlan/gateway/springcloudgateway/2/4.html
- 分类：API网关
- 分组：SpringCloud Gateway
## 1、什么是灰度发布？

灰度发布（又名金丝雀发布）是指在黑与白之间，能够平滑过渡的一种发布方式。在其上可以进行A/B testing，即让一部分用户继续用产品特性A，一部分用户开始用产品特性B，如果用户对B没有什么反对意见，那么逐步扩大范围，把所有用户都迁移到B上面来。灰度发布可以保证整体系统的稳定，在初始灰度的时候就可以发现、调整问题，以保证其影响度。

**实现的整体思路：**

- 编写灰度路由
- 编写自定义filter
- nacos服务配置需要灰度发布的服务的元数据信息以及权重
- 灰度路由从nacos服务拉取元数据信息以及权重，然后根据权重算法，返回符合要求的服务实例给自定义的filter
- 网关配置文件配置需要灰度路由的服务（因为本文代码没有网关实现动态路由，不然灰度路由可以配置在配置中心，从配置中心拉取）
- filter通过责任链模式，把服务实例透传给其他filter比如NettyRoutingFilter

## 2、SpringCloud Gateway集成

### 1、灰度路由

```java
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.cloud.client.ServiceInstance;
import org.springframework.cloud.client.loadbalancer.reactive.DefaultResponse;
import org.springframework.cloud.client.loadbalancer.reactive.EmptyResponse;
import org.springframework.cloud.client.loadbalancer.reactive.Request;
import org.springframework.cloud.client.loadbalancer.reactive.Response;
import org.springframework.cloud.loadbalancer.core.NoopServiceInstanceListSupplier;
import org.springframework.cloud.loadbalancer.core.ReactorServiceInstanceLoadBalancer;
import org.springframework.cloud.loadbalancer.core.ServiceInstanceListSupplier;
import org.springframework.http.HttpHeaders;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import java.util.List;
import java.util.Random;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.stream.Collectors;
/**
@author DDKK.COM 弟弟快看，程序员编程资料站
 * @date 2022/11/3
 */
public class VersionGrayLoadBalancer implements ReactorServiceInstanceLoadBalancer {
    private ObjectProvider<ServiceInstanceListSupplier> serviceInstanceListSupplierProvider;
    private String serviceId;
    private final AtomicInteger position;
    public VersionGrayLoadBalancer(ObjectProvider<ServiceInstanceListSupplier> serviceInstanceListSupplierProvider, String serviceId) {
        this(serviceInstanceListSupplierProvider, serviceId, new Random().nextInt(1000));
    }
    public VersionGrayLoadBalancer(ObjectProvider<ServiceInstanceListSupplier> serviceInstanceListSupplierProvider, String serviceId, int seedPosition) {
        this.serviceId = serviceId;
        this.serviceInstanceListSupplierProvider = serviceInstanceListSupplierProvider;
        this.position = new AtomicInteger(seedPosition);
    }
    @Override
    public Mono<Response<ServiceInstance>> choose(Request request) {
        HttpHeaders headers = (HttpHeaders) request.getContext();
        ServiceInstanceListSupplier supplier = this.serviceInstanceListSupplierProvider.getIfAvailable(NoopServiceInstanceListSupplier::new);
        return ((Flux) supplier.get()).next().map(list -> processInstanceResponse((List<ServiceInstance>) list, headers));
    }
    private Response<ServiceInstance> processInstanceResponse(List<ServiceInstance> instances, HttpHeaders headers) {
        if (instances.isEmpty()) {
            return new EmptyResponse();
        } else {
            String reqVersion = headers.getFirst("version");
            if (StringUtils.isEmpty(reqVersion)) {
                return processRibbonInstanceResponse(instances);
            }
            List<ServiceInstance> serviceInstances = instances.stream()
                    .filter(instance -> reqVersion.equals(instance.getMetadata().get("version")))
                    .collect(Collectors.toList());
            if (serviceInstances.size() > 0) {
                return processRibbonInstanceResponse(serviceInstances);
            } else {
                return processRibbonInstanceResponse(instances);
            }
        }
    }
    private Response<ServiceInstance> processRibbonInstanceResponse(List<ServiceInstance> instances) {
        int pos = Math.abs(this.position.incrementAndGet());
        ServiceInstance instance = instances.get(pos % instances.size());
        return new DefaultResponse(instance);
    }
}
```

### 2、自定义filter

```java
import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.springframework.cloud.client.ServiceInstance;
import org.springframework.cloud.client.loadbalancer.LoadBalancerUriTools;
import org.springframework.cloud.client.loadbalancer.reactive.DefaultRequest;
import org.springframework.cloud.client.loadbalancer.reactive.Request;
import org.springframework.cloud.client.loadbalancer.reactive.Response;
import org.springframework.cloud.gateway.config.LoadBalancerProperties;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.cloud.gateway.filter.ReactiveLoadBalancerClientFilter;
import org.springframework.cloud.gateway.support.DelegatingServiceInstance;
import org.springframework.cloud.gateway.support.NotFoundException;
import org.springframework.cloud.gateway.support.ServerWebExchangeUtils;
import org.springframework.cloud.loadbalancer.core.ServiceInstanceListSupplier;
import org.springframework.cloud.loadbalancer.support.LoadBalancerClientFactory;
import org.springframework.core.Ordered;
import org.springframework.http.HttpHeaders;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;
import java.net.URI;
/**
@author DDKK.COM 弟弟快看，程序员编程资料站
 * @date 2022/11/3
 */
public class GrayReactiveLoadBalancerClientFilter implements GlobalFilter, Ordered {
    private static final Log log = LogFactory.getLog(ReactiveLoadBalancerClientFilter.class);
    private static final int LOAD_BALANCER_CLIENT_FILTER_ORDER = 10150;
    private final LoadBalancerClientFactory clientFactory;
    private LoadBalancerProperties properties;
    public GrayReactiveLoadBalancerClientFilter(LoadBalancerClientFactory clientFactory, LoadBalancerProperties properties) {
        this.clientFactory = clientFactory;
        this.properties = properties;
    }
    @Override
    public int getOrder() {
        return LOAD_BALANCER_CLIENT_FILTER_ORDER;
    }
    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        URI url = exchange.getAttribute(ServerWebExchangeUtils.GATEWAY_REQUEST_URL_ATTR);
        String schemePrefix = exchange.getAttribute(ServerWebExchangeUtils.GATEWAY_SCHEME_PREFIX_ATTR);
        if (url != null && ("grayLb".equals(url.getScheme()) || "grayLb".equals(schemePrefix))) {
            ServerWebExchangeUtils.addOriginalRequestUrl(exchange, url);
            if (log.isTraceEnabled()) {
                log.trace(ReactiveLoadBalancerClientFilter.class.getSimpleName() + " url before: " + url);
            }
            return this.choose(exchange).doOnNext((response) -> {
                if (!response.hasServer()) {
                    throw NotFoundException.create(this.properties.isUse404(), "Unable to find instance for " + url.getHost());
                } else {
                    URI uri = exchange.getRequest().getURI();
                    String overrideScheme = null;
                    if (schemePrefix != null) {
                        overrideScheme = url.getScheme();
                    }
                    DelegatingServiceInstance serviceInstance = new DelegatingServiceInstance((ServiceInstance)response.getServer(), overrideScheme);
                    URI requestUrl = this.reconstructURI(serviceInstance, uri);
                    if (log.isTraceEnabled()) {
                        log.trace("LoadBalancerClientFilter url chosen: " + requestUrl);
                    }
                    exchange.getAttributes().put(ServerWebExchangeUtils.GATEWAY_REQUEST_URL_ATTR, requestUrl);
                }
            }).then(chain.filter(exchange));
        } else {
            return chain.filter(exchange);
        }
    }
    protected URI reconstructURI(ServiceInstance serviceInstance, URI original) {
        return LoadBalancerUriTools.reconstructURI(serviceInstance, original);
    }
    private Mono<Response<ServiceInstance>> choose(ServerWebExchange exchange) {
        URI uri = (URI)exchange.getAttribute(ServerWebExchangeUtils.GATEWAY_REQUEST_URL_ATTR);
        VersionGrayLoadBalancer loadBalancer = new VersionGrayLoadBalancer(clientFactory.getLazyProvider(uri.getHost(), ServiceInstanceListSupplier.class), uri.getHost());
        if (loadBalancer == null) {
            throw new NotFoundException("No loadbalancer available for " + uri.getHost());
        } else {
            return loadBalancer.choose(this.createRequest(exchange));
        }
    }
    private Request createRequest(ServerWebExchange exchange) {
        HttpHeaders headers = exchange.getRequest().getHeaders();
        Request<HttpHeaders> request = new DefaultRequest<>(headers);
        return request;
    }
}
```

### 3、配置自定义filter给spring管理

```java
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.cloud.gateway.config.LoadBalancerProperties;
import org.springframework.cloud.loadbalancer.support.LoadBalancerClientFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
/**
@author DDKK.COM 弟弟快看，程序员编程资料站
 * @date 2022/11/3
 */
@Configuration
public class GrayGatewayReactiveLoadBalancerClientAutoConfiguration {
    @Bean
    @ConditionalOnMissingBean({GrayReactiveLoadBalancerClientFilter.class})
    public GrayReactiveLoadBalancerClientFilter grayReactiveLoadBalancerClientFilter(LoadBalancerClientFactory clientFactory,
                                                                                     LoadBalancerProperties properties) {
        return new GrayReactiveLoadBalancerClientFilter(clientFactory, properties);
    }
}
```

### 4、配置application.yaml

```java
#注意：lb 改成 grayLb
spring:
  main:
    allow-bean-definition-overriding: true
  application:
    name: gateway
  servlet:
    multipart:
      max-file-size: 50MB
      max-request-size: 50MB
  cloud:
    nacos:
      config:
        server-addr: 127.0.0.1:8848
      discovery:
        server-addr: 127.0.0.1:8848
    gateway:
      routes: # http://127.0.0.1:9000/actuator/gateway/routes
        - id: provider  # 路由 ID，保持唯一
          uri: grayLb://provider # uri指目标服务地址，lb代表从注册中心获取服务
          predicates:
            - Path=/provider/**  # http://127.0.0.1:9000/provider/port 会转发到 http://localhost:9001/provider/port, 和预期不符合, 需要StripPrefix来处理
          filters:
            - StripPrefix=1 # StripPrefix=1就代表截取路径的个数为1, 这样请求 http://127.0.0.1:9000/provider/test/port 会转发到 http://localhost:9001/test/port
```

## 3、provider 微服务集成

```sh
# application.yaml 添加eureka配置，关键点metadata-map
eureka:
  instance:
    preferIpAddress: true
    leaseRenewalIntervalInSeconds: 10
    leaseExpirationDurationInSeconds: 30
    metadata-map:
      version: v1
  client:
    serviceUrl:
      defaultZone: http://localhost:8761/eureka/
    registryFetchIntervalSeconds: 10
    disable-delta: true
```

## 4、测试以及源码

[https://gitee.com/xiaxinyu3_admin/ms-gateway.githttps://gitee.com/xiaxinyu3_admin/ms-gateway.git][https_gitee.com_xiaxinyu3_admin_ms-gateway.git_nbsp_nbsp 2_https_gitee.com_xiaxinyu3_admin_ms-gateway.git](https://gitee.com/xiaxinyu3_admin/ms-gateway.git)

> 版权声明：「DDKK.COM 弟弟快看，程序员编程资料站」本站文章，版权归原作者所有
