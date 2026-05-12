# 13、SpringCloud 实战教程 - 集成Gateway新一代服务网关
- 来源：https://ddkk.com/zhuanlan/j2ee/springcloud/2/13.html
- 分类：J2EE框架
- 分组：教程目录
## Gateway简介

## 1、什么是API 网关？

是作为一个 API 架构，用来保护、增强和控制对于 API 服务的访问。API 网关是一个处于应用程序或服务（提供 REST API 接口服务）之前的系统，用来管理授权、访问控制和流量限制等，这样 REST API 接口服务就被 API 网关保护起来，对所有的调用者透明。因此，隐藏在 API 网关后面的业务系统就可以专注于创建和管理服务，而不用去处理这些策略性的基础设施。

**2、API 网关都有哪些职能？**

**3、API 网关的分类与功能？**

**4、Gateway是什么**

Spring Cloud Gateway是Spring官方基于Spring 5.0，Spring Boot 2.0和Project Reactor等技术开发的网关，Spring Cloud Gateway旨在为微服务架构提供一种简单而有效的统一的API路由管理方式。Spring Cloud Gateway作为Spring Cloud生态系中的网关，目标是替代ZUUL，其不仅提供统一的路由方式，并且基于Filter链的方式提供了网关基本的功能，例如：安全，监控/埋点，和限流等。

**5. 为什么用Gateway**

Spring Cloud Gateway 可以看做是一个 Zuul 1.x 的升级版和代替品，比 Zuul 2 更早的使用 Netty 实现异步 IO，从而实现了一个简单、比 Zuul 1.x 更高效的、与 Spring Cloud 紧密配合的 API 网关。

Spring Cloud Gateway 里明确的区分了 Router 和 Filter，并且一个很大的特点是内置了非常多的开箱即用功能，并且都可以通过 SpringBoot 配置或者手工编码链式调用来使用。

比如内置了 10 种 Router，使得我们可以直接配置一下就可以随心所欲的根据 Header、或者 Path、或者 Host、或者 Query 来做路由。

比如区分了一般的 Filter 和全局 Filter，内置了 20 种 Filter 和 9 种全局 Filter，也都可以直接用。当然自定义 Filter 也非常方便。

**6、最重要的几个概念**

Route(路由)：这是网关的基本构建块，它由一个ID，一个URI，一组断言和一组过滤器定义。如果断言为真，则路由匹配。

Predicate（断言）：输入类类是一个ServerWebExchange。我们可以使用它来匹配来自HTTP请求的任何内容，例如headers。如果请求与断言相匹配则进行路由。

Filter（过滤器）：Spring框架中GatewayFilter的实例，使用过滤器，可以在请求被路由前或者后对请求进行修改。

**7、工作流程**

客户端向Spring Cloud Gateway发出请求，然后在Gateway Hander Mapping中找到与请求相匹配的路由，将其发送到Gateway Web Handler。

Handler在通过指定的过滤器链来将请求发送到我们实际的服务业务逻辑，然后返回。过滤器之间用虚线分是因为过滤器可能会在发送代理请求之间（“pre”）或之后(“post”)执行业务逻辑。

Filter在“pre”类型的过滤器可以做参数校验、权限校验、流量监控、协议转换等。在“post”类型的过滤器中可以做响应内容、响应头的修改，日志的输出，流量监控等有着非常重要的作用。

主要核心就是路由转发+执行过滤器链

## 二、入门配置

新建module，服务名称为cloud-gateway-gateway9527，修改pom.xml文件，主要还是新增了gateway的依赖。采坑提示，不要引入web依赖，不然会报错，项目都起不来。如下图：

```java
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <parent>
        <artifactId>mcroservice</artifactId>
        <groupId>com.study.springcloud</groupId>
        <version>1.0-SNAPSHOT</version>
    </parent>
    <modelVersion>4.0.0</modelVersion>
    <artifactId>cloud-gateway-gateway9527</artifactId>
    <dependencies>
        <!--gateway-->
        <dependency>
            <groupId>org.springframework.cloud</groupId>
            <artifactId>spring-cloud-starter-gateway</artifactId>
        </dependency>
        <!-- eureka-->
        <dependency>
            <groupId>org.springframework.cloud</groupId>
            <artifactId>spring-cloud-starter-netflix-eureka-client</artifactId>
        </dependency>
    <!--  通用包-->
        <dependency>
            <groupId>com.study.springcloud</groupId>
            <artifactId>cloud-api-commons</artifactId>
            <version>${project.version}</version>
        </dependency>
        <!--监控-->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-actuator</artifactId>
        </dependency>
        <dependency>
            <groupId>org.projectlombok</groupId>
            <artifactId>lombok</artifactId>
            <optional>true</optional>
        </dependency>
    </dependencies>
</project>
```

新建yml配置文件，如下图：

```java
server:
  port: 9527
spring:
  application:
    name: cloud-gateway  
eureka:
  instance:
    hostname: cloud-gateway-service
  client:服务提供者provider注册进eureka服务列表内
    service-url:
      register-with-eureka: true
      fetch-registry: true
      defaultZone: http://eureka7001.com:7001/eureka
```

新建主启动类，如下图：

```java
package com.buba.springcloud.gateway;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.netflix.eureka.EnableEurekaClient;
@SpringBootApplication
@EnableEurekaClient
public class GatewayMain {
    public static void main(String[] args) {
        SpringApplication.run(GatewayMain.class,args);
    }
}
```

那接下去启动Eureka7001服务和我们新建的Gateway的网关服务，看看网关服务是否成功注册到Eureka注册中心？

可以看到网关Gateway成功的注册了注册中心，那网关如何做映射呢？那我们以cloud-provide-payment生产者服务为例来映射一下。打开PaymentControler控制层，对get和lb两个方法做进行演示，因为我们之前访问都是[http://localhost:8001/payment/get/1](http://localhost:8001/payment/get/1)的访问，但是我们访问的时候是将我们的端口8001，暴露在了外边，不安全，但是我们不想暴露真的[8001](http://localhost:8001/payment/get/1)端口号，希望在外面8001外边包上一层我们的Gateway的端口9527，这就需要在yml配置新增路由配置。如下图：

```java
server:
  port: 9527
spring:
  application:
    name: cloud-gateway
  cloud:
    gateway:
      routes:
        - id: payment_route 路由的id,没有规定规则但要求唯一,建议配合服务名
        匹配后提供服务的路由地址
          uri: http://localhost:8001
          predicates:
            - Path=/payment/get/** 断言，路径相匹配的进行路由
        - id: payment_route2
          uri: http://localhost:8001
          predicates:
            Path=/payment/lb/**断言,路径相匹配的进行路由
eureka:
  instance:
    hostname: cloud-gateway-service
  client:
    fetch-registry: true
    register-with-eureka: true
    service-url:
      defaultZone: http://eureka7001.com:7001/eureka/
```

然后我们访问[http://localhost:9527/payment/get/1](http://localhost:9527/payment/get/1)，可以成功访问，说明我们的网关的路由和断言就配置成功啦！如下图：

我们现在配置的是YML进行配置的，还有一种配置方案就是通过硬编码的方式。就是代码中注入RouteLocator的Bean，是为了解决YML文件配置太多，文件太大的问题。那就开始撸起来吧！我们只要演示通过9527网关访问到外网的百度新闻网址。

新建一个config配置文件,如下图：

```java
package com.buba.springcloud.gateway.config;
import org.springframework.cloud.gateway.route.RouteLocator;
import org.springframework.cloud.gateway.route.builder.RouteLocatorBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
/**
 * 配置了一个id为routr-name的路由规则
 * 当访问地址http://localhost:9527/guonei时会自动转发到http://news.baidu.com/guonei
 * */
@Configuration
public class GateWayConfig
{
    @Bean
    public RouteLocator customRouteLocator(RouteLocatorBuilder routeLocatorBuilder){
        RouteLocatorBuilder.Builder routes = routeLocatorBuilder.routes();
        routes.route("patn_route_buba",r -> r.path("/guonei").uri("http://news.baidu.com/guonei")).build();
        return routes.build();
    }
}
```

配置完毕，重新启动服务，我们访问[http://localhost:9527/guonei](http://localhost:9527/guonei)，可以成功转发到如下界面，说明我们GateWay通过编码的方式进行路由的映射配置。

## 三、实现动态路由

看我们的YML配置文件，我们配置的是http://localhost:8001是写死的，但是在我们微服务中生产者服务是不可能有一台机器的，所以说必须要进行负载均衡的配置。

默认情况下Gateway会根据注册中心注册的服务列表，以注册中心上微服务名为路径创建动态路由进行转发，从而实现动态路由的功能。那我们就需要修改Gateway的YML配置文件，开启从注册中心动态创建路由的功能，利用微服务名称进行路由，匹配后提供服务的路由地址修改为生产者的服务名称，具体配置如下图：

```java
server:
  port: 9527
spring:
  application:
    name: cloud-gateway
  cloud:
    gateway:
      discovery:
        locator:
          enabled: true 开启从注册中心动态创建路由的功能，利用微服务名称j进行路由
      routes:
        - id: payment_route 路由的id,没有规定规则但要求唯一,建议配合服务名
         匹配后提供服务的路由地址
         uri: http://localhost:8001
          uri: lb://MCROSERVICE-PAYMENT
          predicates:
            - Path=/payment/get/** 断言，路径相匹配的进行路由
        - id: payment_route2
         uri: http://localhost:8001
          uri: lb://MCROSERVICE-PAYMENT
          predicates:
            Path=/payment/lb/**断言,路径相匹配的进行路由
eureka:
  instance:
    hostname: cloud-gateway-service
  client:
    fetch-registry: true
    register-with-eureka: true
    service-url:
      defaultZone: http://eureka7001.com:7001/eureka/
```

为了测试负载均衡，我们需要启动Eureka7001，启动生产者服务8001和8002，启动Gateway服务，要记得在8002服务中也加上返回端口的lb方法。成功的实现了负载均衡。测试如下：

## 四、常用的Predicate断言

我们启动我们的cloud-gateway-gateway9527的服务，可以看到控制台有如下的界面：

Spring Cloud Gateway将路由匹配作为Spring WebFlux HandlerMapping基础框架的一部分，它包含许多内置的RoutePredicateFactory，所有这些Predicate都与HTTP请求的不同属性匹配。多个Route Predicate工厂进行组合。Spring Cloud Gateway 创建Route对象时，使用RoutePredicateFactory创建Predicate对象，Predicate对象可以赋值给Route，Spring Cloud Gateway包含许多内置的Route Predicate Factoriess。所有的这些谓词都匹配HTTP的不同属性。多种谓工厂可以组合，并通过逻辑and。

然后在我们的YML的配置文件也可以看到路由配置，我们使用的是path，就是请求的Path（路径）匹配配置值。如下图：

我们常用的路由配置，就是为了实现一组匹配规则，让请求过来找到对应的Route进行处理。如下图：

我们这里实例一下After，其他的差不多，我们先看一下官网是如何配置的，如下图：

红色区域我们可以看到是一串时间，官网使用的是国外的时间，那我们怎么才能使用到当前的时间呢，就使用如下的一个类，获取到我们当前国内的时间，默认的是上海。如下图：

```java
package com.buba.test;
import java.time.ZonedDateTime;
public class T2 {
    public static void main(String[] args) {
        ZonedDateTime time =  ZonedDateTime.now();//使用默认时间
        System.out.println(time);
    }
}
```

得到时间后，我们进行配置YML文件，我们只配置payment/get的方法，如下图：

```java
server:
  port: 9527
spring:
  application:
    name: cloud-gateway
  cloud:
    gateway:
      discovery:
        locator:
          enabled: true 开启从注册中心动态创建路由的功能，利用微服务名称j进行路由
      routes:
        - id: payment_route 路由的id,没有规定规则但要求唯一,建议配合服务名
         匹配后提供服务的路由地址
         uri: http://localhost:8001
          uri: lb://MCROSERVICE-PAYMENT
          predicates:
            - Path=/payment/get/** 断言，路径相匹配的进行路由
            - After=2020-09-08T21:11:46.662+08:00[Asia/Shanghai]断言在当前时间之后才可以访问
        - id: payment_route2
         uri: http://localhost:8001
          uri: lb://MCROSERVICE-PAYMENT
          predicates:
            Path=/payment/lb/**断言,路径相匹配的进行路由
eureka:
  instance:
    hostname: cloud-gateway-service
  client:
    fetch-registry: true
    register-with-eureka: true
    service-url:
      defaultZone: http://eureka7001.com:7001/eureka/
```

那我们先进行测试一下，现在是否可以访问成功，因为现在的时间肯定比配置的时间之后了，如下图：

我们将时间进行修改一下，将时间推后一天，然后测试一下payment/get的方法，如下图：

可以看到配置之后就不可以访问了，像这个After，我们就可以上线新功能的时候使用，比如你公司上线是在晚上10点上线，你可以提前上线，然后等到设置的时间再生效。那我们测试一下没有配置After断言的payment/lb的方法，看看能否访问成功，如下图：

可以看到成功访问，说明我们的配置是没有问题的，11种断言的配置，大家可以根据自己的需求进行配置。

## 五、Filter的使用

filter是Gateway的三大核心之一，路由过滤器可用于修改进入HTTP请求和返回的HTTP响应，路由过滤器只能指定路由进行使用。Gateway内置了多种路由过滤器，他们都由GatewayFilter工程类来产生。

**Filter的作用**

当我们有很多个服务时，比如下图中的user-service、goods-service、sales-service等服务，客户端请求各个服务的Api时，每个服务都需要做相同的事情，比如鉴权、限流、日志输出等。

对于这样重复的工作，有没有办法做的更好，答案是肯定的。在微服务的上一层加一个全局的权限控制、限流、日志输出的Api Gatewat服务，然后再将请求转发到具体的业务服务层。这个Api Gateway服务就是起到一个服务边界的作用，外接的请求访问系统，必须先通过网关层。

**Filter的生命周期**

Spring Cloud Gateway同zuul类似，生命周期只有pre和post。在路由处理之前，需要经过“pre”类型的过滤器处理，处理返回响应之后，可以由“post”类型的过滤器处理。在“pre”类型的过滤器可以做参数校验、权限校验、流量监控、日志输出、协议转换等，在“post”类型的过滤器中可以做响应内容、响应头的修改，日志的输出，流量监控等。

比如上图中的user-service，收到业务服务的响应之后，再经过“post”类型的filter处理，最后返回响应到客户端。

与zuul不同的是，filter除了分为“pre”和“post”两种方式的filter外，在Spring Cloud Gateway中，filter从作用范围可分为另外两种，一种是针对于单个路由的gateway filter，它在配置文件中的写法同predict类似；另外一种是针对于所有路由的global gateway filer。现在从作用范围划分的维度来讲解这两种filter。

**Spring Cloud Gateway的Filter种类分为GatewayFilter（单一的）和GlobalFilter（全局的）**

Spring Cloud Gateway根据作用范围划分为GatewayFilter和GlobalFilter，二者区别如下：

GatewayFilter : 需要通过spring.cloud.routes.filters 配置在具体路由下，只作用在当前路由上或通过spring.cloud.default-filters配置在全局，作用在所有路由上。

GlobalFilter : 全局过滤器，不需要在配置文件中配置，作用在所有的路由上，最终通过GatewayFilterAdapter包装成GatewayFilterChain可识别的过滤器，它为请求业务以及路由的URI转换为真实业务服务的请求地址的核心过滤器，不需要配置，系统初始化时加载，并作用在每个路由上。

GatewayFilter介绍

GatewayFilter工厂同上一篇介绍的Predicate工厂类似，都是在配置文件application.yml中配置，遵循了约定大于配置的思想，只需要在配置文件配置GatewayFilter Factory的名称，而不需要写全部的类名，比如AddRequestHeaderGatewayFilterFactory只需要在配置文件中写AddRequestHeader，而不是全部类名。在配置文件中配置的GatewayFilter Factory最终都会相应的过滤器工厂类处理。

Spring Cloud Gateway 内置的过滤器工厂一览表如下：

每一个过滤器工厂在官方文档都给出了详细的使用案例，现在的版本有30种，[点击查看官网](https://docs.spring.io/spring-cloud-gateway/docs/3.0.0-SNAPSHOT/reference/html/#gatewayfilter-factories)，如果不清楚的还可以在org.springframework.cloud.gateway.filter.factory看每一个过滤器工厂的源码。在我们实际的开发过程中，一般GatewayFilter是无法满足的，就需要我们自定义过滤器。

那下面我们自己开始自义定过滤器吧！

主要就是实现实现这两个接口GlobalFilter, Ordered,然后实现具体的业务逻辑，如下图：

```java
package com.buba.springcloud.gateway.filter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;
import java.util.Date;
@Component
@Slf4j
public class MyLogGatewatFilter implements GlobalFilter, Ordered {
    //你要访问我时候需要一个指定的用户名才能进行访问，
    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        log.info("************come in MyLogGatewatFilter "+ new Date());
        //判断是否携带uname的key
        String uname = exchange.getRequest().getQueryParams().getFirst("uname");
        //非法用户请离开
        if(uname==null){
            log.info("************用户名为null，非法用户");
            exchange.getResponse().setStatusCode(HttpStatus.NOT_ACCEPTABLE);
            return exchange.getResponse().setComplete();
        }
        //合法用户进行下一个过滤链进行过滤验证
        return chain.filter(exchange);
    }
    //这个0数字代表加载过滤器的顺序，就是越小优先级越高，因为是全局的，所以必须是第一位的。
    @Override
    public int getOrder() {
        return 0;
    }
}
```

该过滤器主要是要访问的路径，需要携带参数uname，如果不携带自己就会校验不合法，会报错，无法访问，只有写单且合法才会访问成功，我们访问[http://localhost:9527/payment/get/1?uname=zs](http://localhost:9527/payment/get/1?uname=zs)进行测试，成功如下图：

然后不带参数进行访问，失败如下图：

**GlobalFilter介绍**

Spring Cloud Gateway框架内置的GlobalFilter如下：

上图中每一个GlobalFilter都作用在每一个router上，能够满足大多数的需求。但是如果遇到业务上的定制，可能需要编写满足自己需求的GlobalFilter。在下面的案例中将讲述如何编写自己GlobalFilter，该GlobalFilter会校验请求中是否包含了请求参数“token”，如何不包含请求参数“token”则不转发路由，否则执行正常的逻辑。代码如下：

```java
public class TokenFilter implements GlobalFilter, Ordered {
    Logger logger=LoggerFactory.getLogger( TokenFilter.class );
    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        String token = exchange.getRequest().getQueryParams().getFirst("token");
        if (token == null || token.isEmpty()) {
            logger.info( "token is empty..." );
            exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
            return exchange.getResponse().setComplete();
        }
        return chain.filter(exchange);
    }
    @Override
    public int getOrder() {
        return -100;
    }
}
```

在上面的TokenFilter需要实现GlobalFilter和Ordered接口，这和实现GatewayFilter很类似。然后根据ServerWebExchange获取ServerHttpRequest，然后根据ServerHttpRequest中是否含有参数token，如果没有则完成请求，终止转发，否则执行正常的逻辑。

然后需要将TokenFilter在工程的启动类中注入到Spring Ioc容器中，代码如下：

```java
@Bean
public TokenFilter tokenFilter(){
        return new TokenFilter();
}
```

启动工程，使用curl命令请求：

```java
 curl localhost:8081/customer/123
```

可以看到请没有被转发，请求被终止，并在控制台打印了如下日志：

```java
2018-11-16 15:30:13.543  INFO 19372 --- [ctor-http-nio-2] gateway.TokenFilter                      : token is empty...
```

上面的日志显示了请求进入了没有传“token”的逻辑。
