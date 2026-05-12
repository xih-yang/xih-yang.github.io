# 01、Spring Cloud Gateway 教程
- 来源：https://ddkk.com/zhuanlan/gateway/springcloudgateway/2/1.html
- 分类：API网关
- 分组：SpringCloud Gateway
Spring Cloud GateWay是Spring Cloud的⼀个全新项⽬，⽬标是取代Netflix Zuul，基于Spring5.0+SpringBoot2.0+WebFlux（基于⾼性能的Reactor模式响应式通信框架Netty，异步⾮阻塞模型）等技术开发，性能⾼于Zuul，官⽅测试，GateWay是Zuul的1.6倍，旨在为微服务架构提供⼀种简单有效的统⼀的API路由管理⽅式

## 1、网关：

### 1、流量网关

**1、** 全局性流控匹配路由gateway转发前端地址、后端地址、文件服务器、调度器、消息中心OK！；

**2、** 日志统计可以统计到所有到前端后端接口OK；

**3、** 防止SQL注入--未使用；

**4、** 防止web攻击--未使用；

**5、** 屏蔽工具扫描--未使用；

**6、** 黑白IP名单通过filter过滤IP禁止访问；

**7、** 证书/加解密处理--未使用；

### 2、业务网关

**1、** 服务级别流控前端访问后端通过网关OK！；

**2、** 服务降级和熔断统一后端接口熔断降级、POST接口限流1s/1次OK!；

**3、** 路由与负载均衡、灰度的策略负载均衡OK!灰度需要部署集群；

**4、** 服务过滤、聚合与发现通过注册中心，自定义谓词与自定义过滤器OK!；

**5、** 权限验证与用户等级策略--使用app端的权限；

**6、** 业务规则与参数校验--未使用；

**7、** 多级缓存策略--未使用；

## 2、Gateway 断言

依赖：org.springframework.cloud：spring-cloud-starter-gateway

父依赖：

```sh
dependencyManagement {
     imports {
         mavenBom "org.springframework.cloud:spring-cloud-dependencies:${springCloudVersion}"
         mavenBom "com.alibaba.cloud:spring-cloud-alibaba-dependencies:${comAlibabaCloud}"
     }
 }
```

断言：predicates 多断言可以配合使用

### 1、path断言

> predicates:
>
> -Path=/mg

### 2、Query断言

> 参数值可以写正则，也可以只写参数名
>
> predicates:
>
> -Query=foo,ba.

### 3、Method断言

> predicates:
>
> -Method=get

### 4、Host断言

> predicates:
>
> -Host=mashibing.com

### 5、Cookie断言

> predicates:
>
> -Cookie=name,yiming

### 6、Header断言

> predicates:
>
> -Header=reqId,9090\d+ - 正则表达式\d+ 数字

### 7、Weight 权重路由

```sh
- id: weight2
  uri: http://localhost:6601
  predicates:
    - Path=/api/**
    - Weight=group1,2
  filters:
    - StripPrefix=1
- id: weight8
  uri: http://localhost:6602
  predicates:
    - Path=/api/**
    - Weight=group1,8
  filters:
    - StripPrefix=1
```

### 8、After 时间路由

```sh
#After
      - id: after_route
        uri: lb://micore-test1
        predicates:
          - After=2022-02-07T17:05:00.789+08:00[Asia/Shanghai]
```

### 9、Before 时间路由

```sh
- Before=2022-02-07T17:05:00.789+08:00[Asia/Shanghai]
```

### 10、Between时间区间路由

```sh
- Between=2021-02-07T17:05:00.789+08:00[Asia/Shanghai],2022-02-07T17:05:00.789+08:00[Asia/Shanghai]
```

### 11、灰度发布

同一个请求地址，设置多个url也就是多个服务。比如M5,和MD5 两个服务，比重设置95%和5%。先升级一部分的服务，再切换另一个服务进行升级。

## 3、Gateway 过滤器

### 1、增加header 请求头

附加：代码中获取请求头 JSONView插件

```sh
spring.cloud.gateway.routes
-id: add_request_header
uri: lb://test-prod
predicates: 
    -Path= /getheader
filters:
    #增加请求头、请求参数
    -AddRequestHeader= X-Request-id, 99999
    -AddRequestHeader= X-Request-author, kevin
    -AddRequestParameter= param-id,99999
    -AddRequestParameter= param-author, kevin
    -AddResponseHeader=rep-id, 99999
    -AddResponseHeader=req-author,kevin
```

java代码获取header 和请求参数param 和response

```java
@GetMapping("getHeaders")
public Map<String,String> getHeaders(HttpServletRequest request){
    Map<String,String> map =new HashMap<>();
    Enumeration<String> headerNames = request.getHeaderNames();
    while (headerNames.hasMoreElements()) {
        String name = headerNames.nextElement();
        String value = request.getHeader(name);
        map.put(name,value);
    }
    return map;
}
```

```java
@GetMapping("getParameter")
public Map<String,String[]> getparam(HttpServletRequest request){
    Map<String,String[]> paramMap=request.getParameterMap();
    return paramMap;
}
```

```java
@GetMapping("getResponseHeader")
public Map<String,Collection<String>> getheader3(HttpServletResponse response){
    response.addHeader("req-id","123456");
    response.addHeader("req-id","1234567");
    response.addHeader("rep-url","/42?user=ford&paddwd=omg!what&flag=true");
    Map<String,Collection<String>>map=new HashMap<>();
    Collection<String> headerNames=response.getHeaderNames();
    for(String name:headerNames){
        Collection<String> headers=response.getHeaders(name);
        map.put(name,headers);
    }
    return map;
}
```

### 2、新增动态header请求头

```sh
predicates:
    -Path= /getheader/{seq}
filters:
    -AddRequestHeader= X-Request-id, 99999-{seq}
    -AddRequestHeader= X-Request-author, kevin-{seq}
    -AddRequestParameter= param-id,99999-{seq}
    -AddRequestParameter= param-author, kevin-{seq}
    -AddResponseHeader=rep-id, 99999-{seq}
    -AddResponseHeader=req-author,kevin-{seq}
```

方法：@GetMapping("getHeader/{param}")

### 3、设置请求头 过滤器配置，修改移除请求头

```sh
#设置请求头，没有则新增，有则修改
-SetRequestHeader=X-Request-id,9999
#移除请求头、请求参数
-RemoveRequestHeader= X-Request-id
-RemoveRequestParameter=X-Request
-RemoveRequestParameter=X-Request-author
#先从header取from-Header，如果有则赋值给to-Header,如果没from-Header则无效果
-MapRequestHeader=from-Header,to-Header
```

### 4、PreserverHostHeader

默认开启，在gateway转发请求前把原始请求的host头部带上，转发给目的服务

```sh
-PreserverHostHeader
```

### 5、重写response加密密码

例如： req-url=/42?user=ford&passwd=omg!what&flag=true 经过下面配置替换为/42?user=ford&passwd=***&flag=true

```sh
-RewriteResponseHeader=req-url,passwd=[^&]+,passwd=***
```

### 6、response去重

RETAIN_FIRST保留第一个

RETAIN_LAST保留最后一个

RETAIN_FIRST RETAIN_UNIQUE 保留唯一

```sh
-DedupeResponseHeader= req-id,RETAIN_FIRST
```

### 7、路径带前缀 请求/get/app 其实是/prefix/get

```sh
-PrefixPath= /prefix
```

### 8、配置30几 跳转到指定地址

```sh
#300 Multiple多种选择，请求的资源可能包括多个位置，相应可返回一个资源特征与地址的列表用于用户终端选择
#301 Moved Permanently永久移动，请求的资源已被永久移动新位置，返回信息会包含URI，浏览器会自动定向到新地址，以后请求应该用新的URI代替
#302 Found 临时移动，与301类似，资源临时被移动，客户端应该继续使用原URI
#303See Other查看其它地址，与301类似。使用GET和POST请求查看
#304未修改，所请求资源未修改，服务器返回此状态吗时，不会返回任何资源
#305Use proxy 使用代理，所请求资源必须通过代理
#306 Unused 已经废弃的HTTP状态码
#307 Temporary Redirect 临时重定向，与302类似，使用GET请求重定向
```

```sh
-RedirectTo=302,http://www.baidu.com 
-RedirectTo=301,http://www.taobao.com
```

### 9、修改状态码

- 修改状态码，可以org.springframework.http.HttpStatus枚举，也可以直接写状态码

```sh
-SetStatus=NOT_FOUND
-SetStatus=404
```

### 10、转发地址

- 访问/api/getheader 实际访问：/getheader，转发的目的地址必须写 / 否则会出错

```sh
-RewritePath=/api/getheader, /getheader
```

- [http://192.168.31.80:8801/www/get/user/12123](http://192.168.31.80:8801/www/get/user/12123) 实际访问：/prefix/get/user/12123
- [http://192.168.31.80:8801/www/get](http://192.168.31.80:8801/www/get/user/12123)header 实际访问：/prefix/getheader

```sh
-RewritePath=/www/(?/?.*), /prefix/$\{segment}
```

转发例子2 例如请求/profix/get/user/12123 实际请求是 /get/user

```sh
predicates:
    -Path=/prefix/{var1}/{var2}/{var3}
filter:
    -SetPath=/{var1}/{var2}
```

### 11、去掉\增加 请求路径中部分层级

- 请求/api/get/123 实际请求/get/123

```sh
-StripPrefix=1 从前往后去掉一些路径
```

- 请求/get/123 实际请求/prefix/get/123

```sh
-PrefixPath=/prefix 增加前缀路径
```

### 12、重试过滤器

```sh
predicates:
    -Path=/testRetry
filters:
    - name:  Retry  #过滤器名称
      args:
        retries: 3 #重试次数
        series: #org.springframework.http.HttpStatus.Series 枚举 什么类型状态码进行重试
            -SERVER_ERROR
            -CLIENT_ERROR
        statuses:#org.springframework.http.HttpStatus枚举值，什么状态码重试
            -BAD_GATEWAY
            -METHOD_NOT_ALLOWED
        methods: #什么类型方法重试
            -GET
            -POST
        exception: #什么异常进行重试
            -java.io.IOException
        backoff:#重试时间间隔
            firstBackoff: 10ms
            maxBackoff: 50ms
            factor: 2
            basedOnPreviousValue: false
```

### 13、过滤器设置请求大小

```sh
filters:
    -name: RequestSize #过滤器名称
     args:   #控制请求的大小，超过则返回413.请求最大默认5000000 约5M
        maxSize:1000  #1KB
```

### 14、spring-session

```sh
filters:
#只有当集成Spring Session才会将session放到Redis，来实现共享Session功能，如果项目继承了Spring Session中的Spring Security框架。如果希望安全验证信息可以转发到远程应用，那么这个配置是必须的
- SaveSession
```

### 15、默认filter

```sh
spring.cloud.gateway.default-filters:
    -AddRequestHeader=X-Request-Default, Gateway
```

## 4、熔断机制

### 1、老熔断

①增加依赖包：org.springframework.cloud:spring-cloud-starter-netflix-hystrix

②默认熔断配置

```sh
spring.cloud.gateway
default-filters:
    -name: Hystrix #设置默认熔断器
     args:
        name: fallback1 #熔断器名字，随便起
        fallbackUrl: forward:/fallbackHysrix  //发生熔断后跳转的地址
#设置hystrix断路器超时时间
hystrix.command.fallbackcmd.execution.isolation.thread.timeoutInMillliseconds:2000  #2秒
```

该地址：需要在gateway项目中新增一个controller com.longze.controller.FallbackController

```sh
@RestController
public class FallbackController {
    @RequestMapping("/fallbackHysrix")
    public String fallbackHysrix(){
        return "fallbackHystrix error";
    }
    @RequestMapping("/fallbackCircuitBreaker")
    public String fallbackCircuitBreaker(){
        return "fallbackCircuitBreaker error";
    }
}
```

③单独配置熔断器

```sh
spring.cloud.gateway.routes
filters:
    -name: Hystrix #设置熔断器
     args:
        name: fallbackcmd #熔断器名字，无所谓
        fallbackUri: forward:/fallbackHysrix #熔断之后跳转，本项目或其他项目配置
#熔断项目在其他项目中
-id: Hystrix-fallback
uri: http://localhost:9100
predicates:
    -Path: /fallbackHysrix
```

### 2、熔断机制-新的

①增加依赖包：org.springframework.cloud:spring-cloud-starter-circuitbreaker-reactor-resilience4j

和org.springframework.cloud:spring-cloud-starter-circuitbreaker-resilience4j

②- 开启resilience4j熔断

```sh
spring.cloud.circuitbreaker.resilience4j.enabled: true
```

③配置熔断 和Hystrix很相似

spring.cloud.gateway.routes

```sh
filters:
    -name: CircuitBreaker #设置熔断器
     args:
        name: testCircuitBreaker #熔断器名字，无所谓
        fallbackUri: forward:/fallbackCircuitBreaker #熔断之后跳转，本项目或其他项目配置
```

## 5、限流配置

### 1、增加依赖

org.springframework.boot:spring-boot-starter-data-redis-reactive

```sh
org.springframework.boot:spring-boot-starter-data-redis   version: '2.5.4'
```

### 2、配置redis：spring.redis.database:XX

```sh
 spring
     redis:
        host: 1.2.3.4
        port: 6379
        password: redispassword
        pool:
          max-active: 8
          max-wait: -1
          max-idle: 8
          min-idle: 0
        timeout: 30000
        database: 5
```

### 3、配置keyResolver，参考类RateLimiteConfig

### 4、ym配置spring.cloud.gateway.routes

```sh
-id: rate-limit-demo
uri: lb://mima-cloud-producer
predicates:
    -Path=/rate/**
filters:
    -name: RequestRateLimiter
     args:
        #令牌桶每秒平均速率，允许用户每秒处理多少个请求
        redis-rate-limiter.replenishRate:1
        #令牌桶的容量，允许在1s内完成的最大请求数
        redis-rate-limiter.burstCapacity:2
        #使用Spel表达式从Spring容器中获取Bean对象，查看RateLimiteConfig实现类中同名方法
        key-resolver: "#{@pathKeyResolver}"
        #key-resolver: "#{@ipKeyResolver}"
        #key-resolver: "#{@userKeyResolver}"
```

### 5、当发生限流，会向redis存储两个数据 .限流返回状态码是429

request_rate_limiter.{key}.timestamp

request_rate_limiter.{key}.tokens

timestamp：存储的是当前时间秒数，也就是System.currentTimeMillis()/1000

tokens：存储的当前这秒钟对应的可用令牌数

### 6、配置文件RateLimiteConfig.java

```java
package com.pig4cloud.pig.demo.controller;
import org.springframework.cloud.gateway.filter.ratelimit.KeyResolver;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;
/**
 * @author DDKK.COM 弟弟快看，程序员编程资料站
 * @Date: 2022/1/2 - 01 -02 - 22:36
 * @Description: 限流配置
 * @Version: 1.0
 */
@Configuration
public class RateLimiteConfig{
    //ip限流  1s 100次
    //userId限流 1s 100次
    //路径限流
    @Bean
    @Primary  #如果不使用 @Primary 注解，项目启动会报错
    public KeyResolver pathKeyResolver(){
        //写法1
//        return exchange-> Mono.just(
//                exchange.getRequest()
//                .getPath()
//                .toString()
//        );
        //写法2
        return new KeyResolver(){
            @Override
            public Mono<String> resolve(ServerWebExchange exchange){
                return Mono.just(exchange.getRequest()
                .getPath()
                .toString());
            }
        };
    }
    //根据请求IP限流
    @Bean
    public KeyResolver ipKeyResolver(){
        return exchange -> Mono.just(
                exchange.getRequest()
                .getRemoteAddress()
                .getHostName()
        );
    }
    //根据userid限流
    @Bean
    public KeyResolver userKeyResolver(){
        return exchange -> Mono.just(
                exchange.getRequest()
                .getQueryParams()
                .getFirst("userId")
        );
    }
}
```

## 6、自定义谓词配置类

可以保存数据库，存储。

### 1、配置类UserNameCheckRoutePredicateFactory.java

```java
package com.pig4cloud.pig.demo.util;
import com.mysql.cj.util.StringUtils;
import org.springframework.cloud.gateway.handler.predicate.AbstractRoutePredicateFactory;
import org.springframework.stereotype.Component;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.server.ServerWebExchange;
import javax.validation.constraints.NotEmpty;
import java.util.function.Predicate;
/**
 * @author DDKK.COM 弟弟快看，程序员编程资料站
 * @Date: 2022/1/2 - 01 -02 - 23:20
 * @Description: 自定义谓词，请求入参包含指定userName
 * @Version: 1.0
 */
@Component
public class UserNameCheckRoutePredicateFactory extends AbstractRoutePredicateFactory<UserNameCheckRoutePredicateFactory.Config> {
    public UserNameCheckRoutePredicateFactory(){
        super(Config.class);
    }
    @Override
    public Predicate<ServerWebExchange> apply(UserNameCheckRoutePredicateFactory.Config config) {
        //写法1
        return new Predicate<ServerWebExchange>() {
            @Override
            public boolean test(ServerWebExchange exchange) {
                String userName = exchange.getRequest().getQueryParams().getFirst("userName");
                if(StringUtils.isNullOrEmpty(userName)){
                    return false;
                }
                //检查请求参数中userName是否与配置的数据相同，如果相同则允许访问，否则不允许访问
                if(userName.equals(config.getName())){
                    return true;
                }
                return false;
            }
        };
    }
    @Validated
    public static class Config{
        @NotEmpty
        private String name;
        public String getName() {
            return name;
        }
        public void setName(String name) {
            this.name = name;
        }
    }
}
```

### 2、配置项

```sh
spring.cloud.gateway
routes：
    -id: Auth_route
     uri: lb://mima-cloud-producer
     order:1
     predicates:
        -Path= /**
        #name配置为UserNameCheckRoutePredicateFactory自定义谓词配置类前缀UserNameCheck， 只有     访问http://192.168.1.10:8081/getheader?userName=Kevin,否则为404
        #必须写在userName请求参数，并且值为kevin
        -name=UserNameCheck
         args:
            name: kevin
```

## 7、自定义过滤器

### 1、配置类

**pre配置类**

```java
package com.pig4cloud.pig.demo.util;
import org.springframework.cloud.gateway.filter.GatewayFilter;
import org.springframework.cloud.gateway.filter.factory.AbstractGatewayFilterFactory;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.validation.annotation.Validated;
import javax.validation.constraints.NotEmpty;
/**
 * @author DDKK.COM 弟弟快看，程序员编程资料站
 * @Date: 2022/1/3 - 01 -03 - 10:48
 * @Description: 自定义过滤器 -Pre过滤器
 * @Version: 1.0
 */
@Component
public class MyAddRequestHeaderGatewayFilterFactory extends AbstractGatewayFilterFactory<MyAddRequestHeaderGatewayFilterFactory.Config> {
    public MyAddRequestHeaderGatewayFilterFactory(){super(Config.class);}
    @Override
    public GatewayFilter apply(Config config){
        //写法一
//        return new GatewayFilter() {
//            @Override
//            public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
//                System.out.println("MyAddRequestHeaderGatewayFilterFactory.apply is run...");
//                //exchange.getRequest().mutate() //目的是转化为装饰类，否则request为只读的，不能操作
//                //header方法用来设置header的值
//                ServerHttpRequest request = exchange.getRequest().mutate().header(config.getName(),config.getValue()).build();
//                //将request包裹继续向下传递
//                return chain.filter(exchange.mutate().request(request).build());
//            }
//        }
        return (exchange, chain) -> {
            System.out.println("MyAddRequestHeaderGatewayFilterFactory.apply is run...");
            //exchange.getRequest().mutate() //目的是转化为装饰类，否则request为只读的，不能操作
            //header方法用来设置header的值
            ServerHttpRequest request=exchange.getRequest().mutate().header(config.getName(),config.getValue()).build();
            return chain.filter(exchange.mutate().request(request).build());
             //response可以直接写
//            exchange.getResponse().getHeaders().set(config.getName(),config.getValue());
//            return chain.filter(exchange);
        };
    }
    @Validated
    public static class Config{
        @NotEmpty
        private String name;
        @NotEmpty
        private String value;
        public String getName() {
            return name;
        }
        public void setName(String name) {
            this.name = name;
        }
        public String getValue() {
            return value;
        }
        public void setValue(String value) {
            this.value = value;
        }
    }
}
```

### 2、post过滤器

```java
@Component
public class PostLogGatewayFilterFactory extends AbstractGatewayFilterFactory {
    @Override
    public GatewayFilter apply(Object config){
        return (exchange, chain) -> {
            return chain.filter(exchange).then(Mono.fromRunnable(()-> {
                System.out.println("PostLogGatewayFilterFactory is run...");
            }));
        };
    }
}
```

### 3、配置文件

```sh
spring.cloud.gateway.routes
-id: MyFilter
uri: lb://mima-cloud
order: 1
predicates:
    -Path=/**
filters:
    -name: MyAddRequestHeader  #Pre过滤器
     args:
        name: req-kevin-header
        value: req-yin.hl
    -name: PostLogGateway  #Post过滤器
效果，所有请求增加一个header
```

## 8、全局过滤器

配置文件不需要配置，只需要增加GlobalFilterConfig 类，即可执行到全局过滤

```java
package com.pig4cloud.pig.demo.util;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import reactor.core.publisher.Mono;
/**
 * @author DDKK.COM 弟弟快看，程序员编程资料站
 * @Date: 2022/1/3 - 01 -03 - 21:23
 * @Description: 全局过滤器
 * @Version: 1.0
 */
@Configuration
public class GlobalFilterConfig {
    //order 越小，越先执行
    @Bean
    @Order(-1)
    public GlobalFilter globalFilter1(){
        return (exchange, chain) -> {
            System.out.println("pro filter globalFilter1...");
            return chain.filter(exchange).then(Mono.fromRunnable(()->{
                System.out.println("post filter globalFilter1...");
            }));
        };
    }
    @Bean
    @Order(1)
    public GlobalFilter globalFilter2(){
        return (exchange, chain) -> {
            System.out.println("pro filter globalFilter2...");
            return chain.filter(exchange).then(Mono.fromRunnable(()->{
                System.out.println("post filter globalFilter2...");
            }));
        };
    }
}
```

应答顺序为：pro filter globalFilter1...

profilter globalFilter2...

post filter globalFilter2...

post filter globalFilter1...

## 9、网关超时配置

> spring.cloud.gateway.httpclient.connect-timeout=1000 - 连接超时 毫秒
>
> spring.cloud.gateway.httpclient.response-timeout=5s - 应答超时 java.time.Duration http状态码504

## 10、元数据 metadata

## 11、gateway内置API与跨域

### 0、依赖

```java
implementation group: 'org.springframework.boot', name: 'spring-boot-starter-actuator'
```

### 1、API说明：

> /actuator/gateway/routes/{id} ,method=[DELETE] 删除单个路由
>
> /actuator/gateway/routes/{id},method=[POST] 新增单个路由
>
> /actuator/gateway/routes/{id},method=[GET] 查看单个路由
>
> /actuator/gateway/routes ，method=[GET] 查看路由列表
>
> /actuator/gateway/refresh,method=[POST] 路由刷新
>
> /actuator/gateway/globalfilters,method=[GET]获取全局过滤器列表
>
> /actuator/gateway/routefilters,method=[GET] 路由过滤器工厂列表

### 2、打开端点配置

```sh
management.endpoint.gateway.enabled=true
management.endpoints.web.exposure.include=gateway
```

### 3、跨域请求：

配置文件-直接引用即可

```java
package com.pig4cloud.pig.demo.util;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.web.cors.reactive.CorsUtils;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.web.server.WebFilter;
import org.springframework.web.server.WebFilterChain;
import reactor.core.publisher.Mono;
/**
 * @author DDKK.COM 弟弟快看，程序员编程资料站
 * @Date: 2022/1/3 - 01 -03 - 22:03
 * @Description: 跨域配置
 * http://vvv.mekebin.com/123  ajax-> http://vvv.mekebin.com/123/test 不跨域
 * http://vvv.mekebin.com/123  ajax-> http://def.mekebin.com/123/test 跨域
 * http://vvv.mekebin.com:8801/123  ajax-> http://vvv.mekebin.com:9901/123/test 跨域
 * http://vvv.mekebin.com/123  ajax-> https://vvv.mekebin.com/123/test 跨域
 * @Version: 1.0
 */
@Configuration
public class CorsConfig {
    private static final String MAX_AGE="18000L";
    @Bean
    public WebFilter corsFilter(){
        return (ServerWebExchange ctx, WebFilterChain chain)->{
            System.out.println("corsFilter...  run");
            ServerHttpRequest request = ctx.getRequest();
            if(!CorsUtils.isCorsRequest(request)){
                return chain.filter(ctx);
            }
            HttpHeaders requestHeaders=request.getHeaders();
            ServerHttpResponse response = ctx.getResponse();
            HttpMethod requestMethod= requestHeaders.getAccessControlRequestMethod();
            HttpHeaders headers=response.getHeaders();
            headers.add(HttpHeaders.ACCESS_CONTROL_ALLOW_METHODS, requestHeaders.getOrigin());
            headers.addAll(HttpHeaders.ACCESS_CONTROL_ALLOW_HEADERS, requestHeaders.getAccessControlAllowHeaders());
            if(requestMethod!=null){
                headers.add(HttpHeaders.ACCESS_CONTROL_ALLOW_METHODS,requestMethod.name());
            }
            //携带cookie
            headers.add(HttpHeaders.ACCESS_CONTROL_ALLOW_CREDENTIALS, "true");
            headers.add(HttpHeaders.ACCESS_CONTROL_EXPOSE_HEADERS,"*");
            headers.add(HttpHeaders.ACCESS_CONTROL_MAX_AGE, MAX_AGE);
            if(request.getMethod() == HttpMethod.OPTIONS){
                response.setStatusCode(HttpStatus.OK);
                return Mono.empty();
            }
            return chain.filter(ctx);
        };
    }
}
```

荆轲刺秦王！

> 版权声明：「DDKK.COM 弟弟快看，程序员编程资料站」本站文章，版权归原作者所有
