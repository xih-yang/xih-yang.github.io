# 02、SpringCloud Zuul 快速入门
- 来源：https://ddkk.com/zhuanlan/gateway/springcloudzuul/2.html
- 分类：API网关
- 分组：教程目录
随着微服务规模越来越大，微服务系统中会出现以下问题

从运维角度看，客户端发送某个业务请求， 请求通过F5,Nginx 等设备的路由通过负载均衡分配后被转发到不同的服务实例上.因此运维人员需要维护这些服务列表， 当实例增减或者IP地址变动发生时，手工修改维护配置出错的概率会随着系统规模不断增大

从开发测试角度看，一般会在微服务的接口上增加权限校验机制，比如登录状态校验或者签名校验，随着微服务规模的扩大，这些校验逻辑的冗余变得越来越多，开发维护的难度越来越大，测试人员的测试负担也会越来越大

## 1、SpringCloud Zuul 简介

为了解决这些常见的架构问题， API网关概念应运而生，它类似面向对象设计的Facade模式， 它就像微服务架构系统的门面一样。所有外部客户端访问都需要经过它来进行调度和过滤，Spring Cloud 提供了基于Netflix Zuul 实现的API网关组件 Spring Cloud Zuul

Zuul 是 Netflix OSS 中的一员，是一个基于 JVM 路由和服务端的负载均衡器。提供路由、监控、弹性、安全等方面的服务框架。Zuul 能够与 Eureka、Ribbon、Hystrix 等组件配合使用。

**Zuul 的核心是过滤器，通过这些过滤器我们可以扩展出很多功能，比如：**

**1、** 动态路由： 动态地将客户端的请求路由到后端不同的服务，做一些逻辑处理，比如聚合多个服务的数据返回

**2、** 请求监控： 可以对整个系统的请求进行监控，记录详细的请求响应日志，可以实时统计出当前系统的访问量以及监控状态。

**3、** 认证鉴权： 对每一个访问的请求做认证，拒绝非法请求，保护好后端的服务。

**4、** 压力测试： 压力测试是一项很重要的工作，像一些电商公司需要模拟更多真实的用户并发量来保证重大活动时系统的稳定。通过 Zuul 可以动态地将请求转发到后端服务的集群中，还可以识别测试流量和真实流量，从而做一些特殊处理。

**5、** 灰度发布： 灰度发布可以保证整体系统的稳定，在初始灰度的时候就可以发现、调整问题，以保证其影响度。

## 2、Spring Cloud Zuul 使用入门

参考代码： [GitHub - PNZBEIJINGL/spring-cloud-lab](https://github.com/PNZBEIJINGL/spring-cloud-lab)

服务
IP
端口

eureka-peer
127.0.0.1
1000
Eureka服务注册中心

ms-customer
127.0.0.1
8001
客户服务

api-gateway
127.0.0.1
8005
网关服务

通过下面简单的例子来学习使用Spring Cloud Zuul 实现API网关服务

## 2.1 面向传统路由

**1、** 创建一个Springboot工程，并在pom.xml中引入spring-cloud-starter-zuul依赖；

```xml
 <dependencies>
    <!--引入 zuul-->
    <dependency>
        <groupId>org.springframework.cloud</groupId>
        <artifactId>spring-cloud-starter-zuul</artifactId>
    </dependency>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-test</artifactId>
        <scope>test</scope>
    </dependency>
    <!-- 注册服务提供 -->
    <dependency>
        <groupId>org.springframework.cloud</groupId>
        <artifactId>spring-cloud-starter-eureka</artifactId>
    </dependency>
</dependencies>
```

**2、** 启动主类增加@EnableZuulProxy注解，启动zuul功能；

```java
@EnableZuulProxy
@SpringCloudApplication
public class ApiGatewayApplication {
    public static void main(String[] args) {
        SpringApplication.run(ApiGatewayApplication.class, args);
    }
}
```

**3、** 在application.properties文件中增加zuul路由设置，路由规则和参考如下；

`zuul.routes..path` 配置路由规则``部分为路由的名字可以任意定义字符串

*路径匹配规则*

- *？ 匹配单个字符*
- ** 匹配任意多个字符，不包含多级路径*
- *** 匹配任意多个字符，包含多级路径*

`zuul.routes..url` 配置url用于配置符合path的请求路径路由到的服务地址,``部分为路由的名字可以任意定义字符串

```sh
server.port=8005
spring.application.name=API-GATEWAY
zuul.routes.api-a-url.path=/api-a-url/**
zuul.routes.api-a-url.url=http://localhost:8001/
```

测试

启动ms-customer服务，api-gateway 服务

访问：http://127.0.0.1:8005/api-a-url/time

可见当访问http://127.0.0.1:8005/api-a-url/time 的时候，API网关服务会将该请求路由到http://localhost:8001/time 提供的微服务接口上

多实例配置参考

```java
#因为zuul.routes.<route>.serviceId是指定的服务名称，默认情况下通过服务发现机制获取
ribbon.eureka.enable=false
zuul.routes.customer-api.path=/customer-api/**
#customer-api手工指定的服务名
zuul.routes.customer-api.service-id=customer-api
#开头的customer-api对应了serviceId
customer-api.ribbon.listOfServers=http://localhost:8001/,http://localhost:8002/
```

## 2.2 面向服务的路由

Spring Cloud Zuul实现了和 Spring Cloud Eureka的无缝整合可以实现路由path儿不是url

```java
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-starter-eureka</artifactId>
</dependency>
```

修改applicaiton.properties

```java
zuul.routes.api-b-url.path=/api-b-url/**
#MS-CUSTOMER为路由的微服务名
zuul.routes.api-b-url.url=MS-CUSTOMER
############ Eureka ################
#服务注册中心IP
eureka.instance.hostname=127.0.0.1
eureka.client.serviceUrl.defaultZone=http://${eureka.instance.hostname}:1000/eureka/
############ Eureka ################
```

测试

启动eureka-peer 服务 ， ms-customer服务，api-gateway 服务

访问：http://127.0.0.1:8005/api-b-url/time

这样就实现了通过面向服务的路由的配置方式

```java
zuul.routes.api-b-url.path=/api-b-url/**
zuul.routes.api-b-url.url=MS-CUSTOMER
#api-b-url 和api-c-url 效果是一样的
zuul.routes.api-c-url.path=/api-c-url/**
zuul.routes.api-c-url.service-id=MS-CUSTOMER
```

对于面向服务的路由有下面的更简洁的配置方式，`zull.routes.=` ,serviceId用来指定服务名

```java
zuul.routes.ms-customer=/ms-customer/**
```

访问：http://127.0.0.1:8005/ms-customer/time

从下图可见结果，从请求信息中可以更加清晰直观的知道，访问外部网关后，请求被转发到ms-customer 中提供的服务中

继续测试，将刚刚设置的简洁方式注释掉， 重启服务后访问 http://127.0.0.1:8005/ms-customer/time

```java
#zuul.routes.ms-customer=/ms-customer/**
```

从测试结果看仍然能访问到结果，这是因为Spring Cloud Zuul构建的API网关服务引入Spring Cloud Eureka 之后，它为Eureka中的每一个服务都自动创建了一个默认的路由规则，这些默认的路由规则的为服务的服务名称

## 2.3 请求过滤

由于加入了网关服务，外部客户端访问我们的系统就有了统一入口， 因此就可以在请求到达的时候完成校验和过滤，避免转发后再用代码实现过滤导致请求延迟，在网关实现校验和过滤，还可以减少冗余代码

Zuul允许开发者在API 网关上通过定义过滤器来实现对请求的拦截与过滤，实现方法比较简单，只需要继承ZuulFilter抽象类并实现抽象方法即可，例如创建过滤器AccessFilter继承ZuulFilter， 创建过滤器需啊哟实现4个抽象方法， 方法说明见下方代码

```java
public class AccessFilter extends ZuulFilter {
    private static Logger log = LoggerFactory.getLogger(AccessFilter.class);
    /**
     * pre - 前置过滤器，在请求被路由前执行，通常用于处理身份认证，日志记录等；
     * route - 在路由执行后，服务调用前被调用；
     * error - 任意一个filter发生异常的时候执行或远程服务调用没有反馈的时候执行（超时），通常用于处理异常；
     * post - 在route或error执行后被调用，一般用于收集服务信息，统计服务性能指标等，也可以对response结果做特殊处理
     *
     * @return
     */
    @Override
    public String filterType() {
        return "pre";
    }
    /**
     * 同类型过滤器自然顺序执行
     * 返回值越小，执行顺序越优先
     * @return
     */
    @Override
    public int filterOrder() {
        return 0;
    }
    @Override
    public boolean shouldFilter() {
        return true;
    }
    @Override
    public Object run() {
        RequestContext requestContext = RequestContext.getCurrentContext();
        HttpServletRequest request = requestContext.getRequest();
        Object accessTocken = request.getParameter("accessTocken");
        if (accessTocken == null) {
            requestContext.setSendZuulResponse(false);
            requestContext.setResponseStatusCode(401);
            return null;
        }
        return null;
    }
}
```

创建过滤器后需要将其创建为具体的Bean才能启动过滤器， 参考

```java
@EnableZuulProxy
@SpringCloudApplication
public class ApiGatewayApplication {
    public static void main(String[] args) {
        SpringApplication.run(ApiGatewayApplication.class, args);
    }
    @Bean
    public AccessFilter accessfilter(){
        return new AccessFilter();
    }
}
```

测试

启动eureka-peer 服务 ， ms-customer服务，api-gateway 服务

访问：http://127.0.0.1:8005/api-b-url/time 的时候会返回401错误

访问：http://127.0.0.1:8005/api-b-url/time?accessToken=123 的时候可以正确访问服务

Fiter Typs信息可以访问链接：[How it Works · Netflix/zuul Wiki · GitHub](https://github.com/Netflix/zuul/wiki/How-it-Works)

从Zull中Request的生命周期中可以看出，当HTTP请求进入API网关的时候，首先会进入pre阶段，这里过滤器的主要目的是前置加工比如校验， 正如上面的例子，pre处理之后进入 routing阶段， 这时请求会被routing类型的过滤器处理，将外部请求赚翻到具体服务实例上去。 最后进入post阶段，此时请求会被post过滤器处理，这里可以对请求的结果进行一些加工或者转换，从虚线上看上面三个阶段发生错误都会进入error阶段，但是他最后还会重新指向post过滤器，并最终将结果返回给客户端。

## 2.4 本地跳转

Zuul实现的API网关路由功能，还支持forward形式的服务跳转，例如定义个本地跳转，实现符合/api-d-url/**规则就跳转到以/local为前缀的请求上

```java
###本地跳转
zuul.routes.api-d-url.path=/api-d-url/**
zuul.routes.api-d-url.url=forward:/local
```

api-gateway服务中中创建一个Controller,

```java
@RestController
public class GateWayTestController {
    @RequestMapping("/local/serverinfo")
    public String serverInfo() {
        return "这里是api0-gateway";
    }
}
```

访问：[http://127.0.0.1:8005/api-d-url/serverinfo](http://127.0.0.1:8005/api-d-url/serverinfo)

> 版权声明：「DDKK.COM 弟弟快看，程序员编程资料站」本站文章，版权归原作者所有
