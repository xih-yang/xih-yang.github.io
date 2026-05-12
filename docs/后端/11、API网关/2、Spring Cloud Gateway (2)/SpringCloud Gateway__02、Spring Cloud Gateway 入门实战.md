# 02、Spring Cloud Gateway 入门实战
- 来源：https://ddkk.com/zhuanlan/gateway/springcloudgateway/2/2.html
- 分类：API网关
- 分组：SpringCloud Gateway
## 1、什么是微服务网关

SpringCloud Gateway是Spring全家桶中一个比较新的项目，Spring社区是这么介绍它的：

该项目借助Spring WebFlux的能力，打造了一个API网关。旨在提供一种简单而有效的方法来作为API服务的路由，并为它们提供各种增强功能，例如：安全性，监控和可伸缩性。

而在真实的业务领域，我们经常用SpringCloud Gateway来做微服务网关，如果你不理解微服务网关和传统网关的区别，可以阅读此篇文章 Service Mesh和API Gateway关系深度探讨 来了解两者的定位区别。

以我粗浅的理解，传统的API网关，往往是独立于各个后端服务，请求先打到独立的网关层，再打到服务集群。而微服务网关，将流量从南北走向改为东西走向（见下图）， **微服务网关和后端服务是在同一个容器中的** ，所以也有个别名，叫做Gateway Sidecar。

为啥叫Sidecar，这个词应该怎么理解呢，吃鸡里的三蹦子见过没：

摩托车是你的后端服务，而旁边挂着的额外座椅就是微服务网关，它是依附于后端服务的（一般是指两个进程在同一个容器中），是不是生动形象了一些。

由于本人才疏学浅，对于微服务相关概念理解上难免会有偏差。就不在此详细讲述原理性的文字了。

本文只探讨SpringCloud Gateway的入门搭建和实战踩坑。如果小伙伴们对原理感兴趣，可以等后续原理分析文章。

注：本文网关项目在笔者公司已经上线运行，每天承担百万级别的请求，是经过实战验证的项目。

**文章目录**

- 手把手造一个网关
- 引入pom依赖
- 编写yml文件
- 接口转义问题
- 获取请求体（Request Body）
- 踩坑实战
- 获取客户端真实IP
- 尾缀匹配
- 总结

**源代码**

完整项目源代码已经收录到我的Github：

> https://github.com/qqxx6661/springcloud_gateway_demo

## 2、手把手造一个网关

### 2.1、引入pom依赖

我使用了spring-boot 2.2.5.RELEASE作为parent依赖：

```xml
<parent>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-parent</artifactId>
    <version>2.2.5.RELEASE</version>
    <relativePath/> <!-- lookup parent from repository -->
</parent>
```

在dependencyManagement中， **我们需要指定sringcloud的版本** ，以便保证我们能够引入我们想要的SpringCloud Gateway版本，所以需要用到dependencyManagement：

```xml
<dependencyManagement>
    <dependencies>
        <dependency>
            <groupId>org.springframework.cloud</groupId>
            <artifactId>spring-cloud-dependencies</artifactId>
            <version>Hoxton.SR8</version>
            <type>pom</type>
            <scope>import</scope>
        </dependency>
    </dependencies>
</dependencyManagement>
```

最后，是在dependency中引入

spring-cloud-starter-gateway：

```xml
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-starter-gateway</artifactId>
</dependency>
```

如此一来，我们便引入了2.2.5.RELEASE版本的网关：

此外，请检查一下你的依赖中是否含有spring-boot-starter-web，如果有， **请干掉它** 。因为我们的SpringCloud Gateway是一个netty+webflux实现的web服务器，和Springboot Web本身就是冲突的。

```xml
<dependency>
	<groupId>org.springframework.boot</groupId>
	<artifactId>spring-boot-starter-web</artifactId>
</dependency>
```

做到这里，实际上你的项目就已经可以启动了，运行

SpringcloudGatewayApplication，得到结果如图：

### 2.2、编写yml文件

SpringBoot的核心概念是 **约定优先于配置** ，在以前初学Spring时，一直不理解这句话的意思，在使用SpringCloud Gateway时，更加深入的理解了这句话。在默认情况下，你不需要任何的配置，就能够运行起来最基本的网关。针对你之后特定的需求，再去追加配置。

而SpringCloud Gateway更强大的一点就是内置了非常多的默认功能实现， 你需要的大部分功能，比如在请求中添加一个header，添加一个参数，都只需要在yml中引入相应的内置过滤器即可。

可以说，yml是整个SpringCloud Gateway的灵魂。

一个网关最基本的功能，就是配置路由，在这方面，SpringCloud Gateway支持非常多方式。比如：

- 通过时间匹配
- 通过 Cookie 匹配
- 通过 Header 属性匹配
- 通过 Host 匹配
- 通过请求方式匹配
- 通过请求路径匹配
- 通过请求参数匹配
- 通过请求 ip 地址进行匹配

这些在官网教程中，都有详细的介绍，就算你百度下，也会有很多民间翻译的入门教程，我就不再赘述了，我只用一个请求路径做一个简单的例子。

在公司的项目中，由于有新老两套后台服务，我们使用不同的uri路径进行区分。

- 老服务路径为：url/api/xxxxxx，服务端口号为8001
- 新服务路径为：url/api/v2/xxxxx，服务端口号为8002

那么可以直接在yml里面配置：

```sh
logging:
  level:
    org.springframework.cloud.gateway: DEBUG
    reactor.netty.http.client: DEBUG
spring:
  cloud:
    gateway:
      default-filters:
        - AddRequestHeader=gateway-env, springcloud-gateway
      routes:
        - id: "server_v2"
          uri: "http://127.0.0.1:8002"
          predicates:
            - Path=/api/v2/**
        - id: "server_v1"
          uri: "http://127.0.0.1:8001"
          predicates:
            - Path=/api/**
```

上面的代码解释如下：

- logging：由于文章需要，我们打开gateway和netty的Debug模式，可以看清楚请求进来后执行的流程，方便后续说明。
- default-filters:我们可以方便的使用default-filters，在请求中加入一个自定义的header，我们加入一个KV为gateway-env：springcloud-gateway，来注明我们这个请求经过了此网关。这样做的好处是后续服务端也能够看到。
- routes：路由是网关的重点，相信读者们看代码也能理解，我配置了两个路由，一个是server_v1的老服务，一个是server_v2的新服务。 请注意，一个请求满足多个路由的谓词条件时，请求只会被首个成功匹配的路由转发。 由于我们老服务的路由是/xx，所以需要将老服务放在后面，优先匹配词缀/v2的新服务，不满足的再匹配到/xx。

来看一下

http://localhost:8080/api/xxxxx的结果：

来看一下

http://localhost:8080/api/v2/xxxxx的结果：

可以看到两个请求被正确的路由了。由于我们真正并没有开启后端服务，所以最后一句error请忽略。

### 2.3、接口转义问题

在公司实际的项目中，我在搭建好网关后，遇到了一个接口转义问题，相信很多读者可能也会碰到，所以在这里我们最好是防患于未然，优先处理下。

问题是这样的，很多老项目在url上并没有进行转义，导致会出现如下接口请求，

http://xxxxxxxxx/api/b3d56a6fa19975ba520189f3f55de7f6/140x140.jpg?t=1 "

这样请求过来，网关会报错：

```sh
java.lang.IllegalArgumentException: Invalid character '=' +
for QUERY\_PARAM in "http://pic1.ajkimg.com/display/anjuke/b3d56a6fa19975ba520189f3f55de7f6/140x140.jpg?t=1"
```

在不修改服务代码逻辑的前提下，网关其实已经可以解决这件事情，解决办法就是升级到2.1.1.RELEASE以上的版本。

```sh
The issue was fixed in version spring-cloud-gateway 2.1.1.RELEASE.
```

所以我们一开始就是用了高版本2.2.5.RELEASE，避免了这个问题，如果小伙伴发现之前使用的版本低于 2.1.1.RELEASE，请升级。

### 2.4、获取请求体（Request Body）

在网关的使用中，有时候会需要拿到请求body里面的数据，比如验证签名，body可能需要参与签名校验。

但是SpringCloud Gateway由于底层采用了webflux，其请求是流式响应的，即 Reactor 编程，要读取 Request Body 中的请求参数就没那么容易了。

网上谷歌了很久，很多解决方案要么是彻底过时，要么是版本不兼容，好在最后参考了这篇文章，终于有了思路：

https://www.jianshu.com/p/db3b15aec646

首先我们需要将body从请求中拿出来，由于是流式处理，Request的Body是只能读取一次的，如果直接通过在Filter中读取，会导致后面的服务无法读取数据。

SpringCloud Gateway 内部提供了一个断言工厂类ReadBodyPredicateFactory，这个类实现了读取Request的Body内容并放入缓存，我们可以通过从缓存中获取body内容来实现我们的目的。

首先新建一个

CustomReadBodyRoutePredicateFactory类，这里只贴出关键代码，完整代码请看可运行的 Github仓库 ：

```java
@Component
public class CustomReadBodyRoutePredicateFactory extends AbstractRoutePredicateFactory<CustomReadBodyRoutePredicateFactory.Config> {
    protected static final Log log = LogFactory.getLog(CustomReadBodyRoutePredicateFactory.class);
    private List<HttpMessageReader<?>> messageReaders;
    @Value("${spring.codec.max-in-memory-size}")
    private DataSize maxInMemory;
    public CustomReadBodyRoutePredicateFactory() {
        super(Config.class);
        this.messageReaders = HandlerStrategies.withDefaults().messageReaders();
    }
    public CustomReadBodyRoutePredicateFactory(List<HttpMessageReader<?>> messageReaders) {
        super(Config.class);
        this.messageReaders = messageReaders;
    }
    @PostConstruct
    private void overrideMsgReaders() {
        this.messageReaders = HandlerStrategies.builder().codecs((c) -> c.defaultCodecs().maxInMemorySize((int) maxInMemory.toBytes())).build().messageReaders();
    }
    @Override
    public AsyncPredicate<ServerWebExchange> applyAsync(Config config) {
        return new AsyncPredicate<ServerWebExchange>() {
            @Override
            public Publisher<Boolean> apply(ServerWebExchange exchange) {
                Class inClass = config.getInClass();
                Object cachedBody = exchange.getAttribute("cachedRequestBodyObject");
                if (cachedBody != null) {
                    try {
                        boolean test = config.predicate.test(cachedBody);
                        exchange.getAttributes().put("read_body_predicate_test_attribute", test);
                        return Mono.just(test);
                    } catch (ClassCastException var6) {
                        if (CustomReadBodyRoutePredicateFactory.log.isDebugEnabled()) {
                            CustomReadBodyRoutePredicateFactory.log.debug("Predicate test failed because class in predicate does not match the cached body object", var6);
                        }
                        return Mono.just(false);
                    }
                } else {
                    return ServerWebExchangeUtils.cacheRequestBodyAndRequest(exchange, (serverHttpRequest) -> {
                        return ServerRequest.create(exchange.mutate().request(serverHttpRequest).build(), CustomReadBodyRoutePredicateFactory.this.messageReaders).bodyToMono(inClass).doOnNext((objectValue) -> {
                            exchange.getAttributes().put("cachedRequestBodyObject", objectValue);
                        }).map((objectValue) -> {
                            return config.getPredicate().test(objectValue);
                        }).thenReturn(true);
                    });
                }
            }
            @Override
            public String toString() {
                return String.format("ReadBody: %s", config.getInClass());
            }
        };
    }
    @Override
    public Predicate<ServerWebExchange> apply(Config config) {
        throw new UnsupportedOperationException("ReadBodyPredicateFactory is only async.");
    }
}
```

代码主要作用：在有body的请求到来时，将body读取出来放到内存缓存中。若没有body，则不作任何操作。

这样我们便可以在拦截器里使用exchange.getAttribute("cachedRequestBodyObject")得到body体。

对了，我们还没有演示一个filter是如何写的，在这里就先写一个完整的demofilter。

让我们新建类DemoGatewayFilterFactory：

```java
@Component
public class DemoGatewayFilterFactory extends AbstractGatewayFilterFactory<DemoGatewayFilterFactory.Config> {
    private static final String CACHE_REQUEST_BODY_OBJECT_KEY = "cachedRequestBodyObject";
    public DemoGatewayFilterFactory() {
        super(Config.class);
        log.info("Loaded GatewayFilterFactory [DemoFilter]");
    }
    @Override
    public List<String> shortcutFieldOrder() {
        return Collections.singletonList("enabled");
    }
    @Override
    public GatewayFilter apply(DemoGatewayFilterFactory.Config config) {
        return (exchange, chain) -> {
            if (!config.isEnabled()) {
                return chain.filter(exchange);
            }
            log.info("-----DemoGatewayFilterFactory start-----");
            ServerHttpRequest request = exchange.getRequest();
            log.info("RemoteAddress: [{}]", request.getRemoteAddress());
            log.info("Path: [{}]", request.getURI().getPath());
            log.info("Method: [{}]", request.getMethod());
            log.info("Body: [{}]", (String) exchange.getAttribute(CACHE_REQUEST_BODY_OBJECT_KEY));
            log.info("-----DemoGatewayFilterFactory end-----");
            return chain.filter(exchange);
        };
    }
    public static class Config {
        private boolean enabled;
        public Config() {}
        public boolean isEnabled() {
            return enabled;
        }
        public void setEnabled(boolean enabled) {
            this.enabled = enabled;
        }
    }
}
```

这个filter里，我们拿到了新鲜的请求，并且打印出了他的path，method，body等。

我们发送一个post请求，body就写一个“我是body”，运行网关，得到结果：

是不是非常清晰明了！

你以为这就结束了吗？这里有两个非常大的坑。

### 2.5、body为空时处理

上面贴出的

CustomReadBodyRoutePredicateFactory类其实已经是我修复过的代码，里面有一行 .thenReturn(true) 是需要加上的。这才能保证当body为空时，不会报出异常。至于为啥一开始写的有问题，显然因为我偷懒了，直接copy网上的代码了，哈哈哈哈哈。

### 2.6、body大小超过了buffer的最大限制

这个情况是在公司项目上线后才发现的，我们的请求里body有时候会比较大，但是网关会有默认大小限制。所以上线后发现了频繁的报错：

org.springframework.core.io.buffer.DataBufferLimitException: Exceeded limit on max bytes to buffer : 262144

谷歌后，找到了解决方案，需要在配置中增加了如下配置

```sh
spring: 
  codec:
    max-in-memory-size: 5MB
```

把buffer大小改到了5M。

### 2.7、你以为这就又双叕结束了，太天真了，你会发现可能没有生效。

问题的根源在这里：我们在spring配置了上面的参数，但是我们自定义的拦截器是会初始化ServerRequest， 这个DefaultServerRequest中的HttpMessageReader会使用默认的262144

### 2.8、所以我们在此处需要从Spring中取出CodecConfigurer， 并将里面的Reader传给serverRequest。

详细的debug过程可以看这篇参考文献：

http://theclouds.io/tag/spring-gateway/

OK，找到问题后，就可以修改我们的代码，在

CustomReadBodyRoutePredicateFactory里，增加：

```java
@Value("${spring.codec.max-in-memory-size}")
private DataSize maxInMemory;
@PostConstruct
private void overrideMsgReaders() {
  this.messageReaders = HandlerStrategies.builder().codecs((c) -> c.defaultCodecs().maxInMemorySize((int) maxInMemory.toBytes())).build().messageReaders();
}
```

这样每次就会使用我们的5MB来作为最大缓存限制了。

依然提醒一下，完整的代码可以请看可运行的 Github仓库

讲到这里，入门实战就差不多了，你的网关已经可以上线使用了，你要做的就是加上你需要的业务功能，比如日志，延签，统计等。

## 3、踩坑实战

### 获取客户端真实IP

很多时候，我们的后端服务会去通过host拿到用户的真实IP，但是通过外层反向代理nginx的转发，很可能就需要从header里拿X-Forward-XXX类似这样的参数，才能拿到真实IP。

在我们加入了微服务网关后，这个复杂的链路中又增加了一环。

这不，如果你不做任何设置，由于你的网关和后端服务在同一个容器中，你的后端服务很有可能就会拿到localhost:8080（你的网关端口）这样的IP。

这时候，你需要在yml里配置PreserveHostHeader，这是SpringCloud Gateway自带的实现：

```sh
filters:
  - PreserveHostHeader# 防止host被修改为localhost
```

字面意思， **就是将Host的Header保留起来，透传给后端服务。**

filter里面的源码贴出来给大家：

```java
public GatewayFilter apply(Object config) {
    return new GatewayFilter() {
        public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
            exchange.getAttributes().put(ServerWebExchangeUtils.PRESERVE_HOST_HEADER_ATTRIBUTE, true);
            return chain.filter(exchange);
        }
        public String toString() {
            return GatewayToStringStyler.filterToStringCreator(PreserveHostHeaderGatewayFilterFactory.this).toString();
        }
    };
}
```

### 尾缀匹配

公司的项目中，老的后端仓库api都以.json结尾 （/api/xxxxxx.json） ，这就催生了一个需求，当我们对老接口进行了重构后，希望其打到我们的新服务，我们就要将.json这个尾缀切除。可以在filters里设置：

```sh
filters:
  - RewritePath=(?<segment>/?.*).json, $\{segment}# 重构接口抹去.json尾缀
```

这样就可以实现打到后端的接口去除了.json后缀。

## 项目源码

本文带领读者一步步完成了一个微服务网关的搭建，并且将许多可能隐藏的坑进行了解决。最后的成品项目在笔者公司已经上线运行，并且增加了签名验证，日志记录等业务，每天承担百万级别的请求，是经过实战验证过的项目。

最后再发一次项目源码仓库：

> https://github.com/qqxx6661/springcloud_gateway_demo

感谢大家的支持，如果文章对你起到了一丁点帮助，请点赞转发支持一下！

> 版权声明：「DDKK.COM 弟弟快看，程序员编程资料站」本站文章，版权归原作者所有
