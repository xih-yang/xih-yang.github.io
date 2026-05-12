# 09、服务网关Zuul初探
- 来源：https://ddkk.com/zhuanlan/j2ee/springcloud/1/9.html
- 分类：J2EE框架
- 分组：教程目录
Springboot: 2.1.6.RELEASE

SpringCloud: Greenwich.SR1

如无特殊说明，本系列教程全采用以上版本

前面的文章我们介绍了，Eureka用于服务的注册于发现，Feign支持服务的调用以及均衡负载，Hystrix处理服务的熔断防止故障扩散，Spring Cloud Config服务集群配置中心，似乎一个微服务框架已经完成了。

我们还是少考虑了一个问题，外部的应用如何来访问内部各种各样的微服务呢？在微服务架构中，后端服务往往不直接开放给调用端，而是通过一个API网关根据请求的url，路由到相应的服务。当添加API网关后，在第三方调用端和服务提供方之间就创建了一面墙，这面墙直接与调用方通信进行权限控制，后将请求均衡分发给后台服务端。

一个简单的微服务架构已经跃然纸面：

> 在Spring Cloud微服务系统中，一种常见的负载均衡方式是，客户端的请求首先经过负载均衡（zuul、Ngnix、F5），再到达服务网关（zuul集群），然后再到具体的服务，服务统一注册到高可用的服务注册中心集群，服务的所有的配置文件由配置服务管理，配置服务的配置文件放在git仓库，方便开发人员随时改配置。

## 1. 为什么需要API Gateway？

### 1.1 简化客户端调用复杂度

在微服务架构模式下后端服务的实例数一般是动态的，对于客户端而言很难发现动态改变的服务实例的访问地址信息。因此在基于微服务的项目中为了简化前端的调用逻辑，通常会引入API Gateway作为轻量级网关，同时API Gateway中也会实现相关的认证逻辑从而简化内部服务之间相互调用的复杂度。

### 1.2 数据裁剪以及聚合

通常而言不同的客户端对于显示时对于数据的需求是不一致的，比如手机端或者Web端又或者在低延迟的网络环境或者高延迟的网络环境。

因此为了优化客户端的使用体验，API Gateway可以对通用性的响应数据进行裁剪以适应不同客户端的使用需求。同时还可以将多个API调用逻辑进行聚合，从而减少客户端的请求数，优化客户端用户体验

### 1.3 多渠道支持

当然我们还可以针对不同的渠道和客户端提供不同的API Gateway,对于该模式的使用由另外一个大家熟知的方式叫Backend for front-end, 在Backend for front-end模式当中，我们可以针对不同的客户端分别创建其BFF，进一步了解BFF可以参考这篇文章：[Pattern: Backends For Frontends](https://samnewman.io/patterns/architectural/bff/)

### 1.4 遗留系统的微服务化改造

对于系统而言进行微服务改造通常是由于原有的系统存在或多或少的问题，比如技术债务，代码质量，可维护性，可扩展性等等。API Gateway的模式同样适用于这一类遗留系统的改造，通过微服务化的改造逐步实现对原有系统中的问题的修复，从而提升对于原有业务响应力的提升。通过引入抽象层，逐步使用新的实现替换旧的实现。

> 在Spring Cloud体系中， Spring Cloud Zuul就是提供负载均衡、反向代理、权限认证的一个API gateway。
>
> 在开始聊Zuul如何使用之前，先讲一个比较有意思的事情，就是在springcloud组件中，服务网关这个组件，springcloud提供了两种选择，一个是netflix公司开源的Zuul，还有一个是springcloud自己开源的Spring Cloud Gateway，具体这两个组件的恩怨情仇，在后面的Spring Cloud Gateway的文章中我们再细聊：）

## 2. Spring Cloud Zuul

### 2.1 简单使用

Spring Cloud Zuul路由是微服务架构的不可或缺的一部分，提供动态路由，监控，弹性，安全等的边缘服务。Zuul是Netflix出品的一个基于JVM路由和服务端的负载均衡器。

下面我们来看一下Zuul最简单的使用方式，创建zuul-simple工程

#### 2.1 pom.xml

```java
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>2.1.6.RELEASE</version>
        <relativePath/> <!-- lookup parent from repository -->
    </parent>
    <groupId>com.springcloud</groupId>
    <artifactId>zuul-simple</artifactId>
    <version>0.0.1-SNAPSHOT</version>
    <name>zuul-simple</name>
    <description>Demo project for Spring Boot</description>
    <properties>
        <java.version>1.8</java.version>
        <spring-cloud.version>Greenwich.SR1</spring-cloud.version>
    </properties>
    <dependencies>
        <dependency>
            <groupId>org.springframework.cloud</groupId>
            <artifactId>spring-cloud-starter-netflix-zuul</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-test</artifactId>
            <scope>test</scope>
        </dependency>
    </dependencies>
    <dependencyManagement>
        <dependencies>
            <dependency>
                <groupId>org.springframework.cloud</groupId>
                <artifactId>spring-cloud-dependencies</artifactId>
                <version>${spring-cloud.version}</version>
                <type>pom</type>
                <scope>import</scope>
            </dependency>
        </dependencies>
    </dependencyManagement>
    <build>
        <plugins>
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
            </plugin>
        </plugins>
    </build>
</project>
```

引入spring-cloud-starter-netflix-zuul包

#### 2.2 配置文件application.yml

```sh
server:
  port: 8080
spring:
  application:
    name: spring-cloud-zuul
zuul:
  routes:
    baidu:
      path: /baidu/**
      url: https://www.baidu.com/
```

这里的配置表示，访问/baidu/ **直接重定向到https://www.baidu.com/**

如果直接访问http://localhost:8080/baidu，则会直接跳转到https://www.baidu.com/。

#### 2.3 启动类

```java
package com.springcloud.zuulsimple;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.netflix.zuul.EnableZuulProxy;
@SpringBootApplication
@EnableZuulProxy
public class ZuulSimpleApplication {
    public static void main(String[] args) {
        SpringApplication.run(ZuulSimpleApplication.class, args);
    }
}
```

启动类添加@EnableZuulProxy，支持网关路由。

史上最简单的zuul案例就配置完了

#### 2.4 测试

启动项目，在浏览器访问http://localhost:8080/baidu/，我们可以看到页面已经跳转到百度首页。

再尝试访问http://localhost:8080/baidu/aa，我们可以看到页面跳转至：[https://www.baidu.com/search/error.html](https://www.baidu.com/search/error.html)， 因为https://www.baidu.com/aa 这个链接不存在， 所以百度帮我们跳转到的error页面。

至此，Zuul简单使用已经介绍完毕，下面我们来聊一下服务化的方式。

### 2.2 服务化

通过url映射的方式来实现Zuul的转发有局限性，比如每增加一个服务就需要配置一条内容，另外后端的服务如果是动态来提供，就不能采用这种方案来配置了。实际上在实现微服务架构时，服务名与服务实例地址的关系在eureka server中已经存在了，所以只需要将Zuul注册到eureka server上去发现其他服务，就可以实现对serviceId的映射。

我们结合示例来说明，在上面示例项目基础上来进行改造

#### 2.2.1 添加依赖

```java
<dependency>
  <groupId>org.springframework.cloud</groupId>
  <artifactId>spring-cloud-starter-netflix-eureka-client</artifactId>
</dependency>
```

增加spring-cloud-starter-netflix-eureka-client包，添加对eureka的支持。

#### 2.2.2 配置文件application.yml

```sh
server:
  port: 8080
spring:
  application:
    name: spring-cloud-zuul
zuul:
  routes:
    api-producer:
      path: /producer/**
      serviceId: spring-cloud-producer
eureka:
  client:
    service-url:
      defaultZone: http://localhost:8761/eureka/
```

在这里我们增加了对服务的支持，这里的Zuul配置的含义为访问/producer/**，转向到eureka上面serviceId为spring-cloud-producer的服务。

#### 2.2.3 测试

先从上一篇的项目中copy Eureka到本篇的文件夹中，再从第五篇的项目中copy一个producer到本篇的文件夹中。

依次启动eureka，producer和Zuul.

我们打开浏览器访问：[http://localhost:8080/producer/hello?name=spring](http://localhost:8080/producer/hello?name=spring)， 可以看到页面正常显示producer的响应：hello spring，producer is ready。说明通过zuul成功调用了producer服务。

这里producer可以启动两个服务，多次刷新http://localhost:8080/producer/hello?name=spring， 可以看到Zuul对服务的调用是负载均衡的。

### 2.3 网关的默认路由

但是如果后端服务多达十几个的时候，每一个都这样配置也挺麻烦的，spring cloud zuul已经帮我们做了默认配置。默认情况下，Zuul会代理所有注册到Eureka Server的微服务，并且Zuul的路由规则如下：[http://ZUUL_HOST:ZUUL_PORT/微服务在Eureka上的serviceId/**会被转发到serviceId对应的微服务](http://ZUUL_HOST:ZUUL_PORT/微服务在Eureka上的serviceId/**会被转发到serviceId对应的微服务)。

我们注销掉zuul-simple配置文件中有关路由的配置。

```java
#zuul:
#  routes:
#    api-producer:
#      path: /producer/**
#      serviceId: spring-cloud-producer
```

再次启动Zuul。

我们在浏览器中访问http://localhost:8080/spring-cloud-producer/hello?name=spring，可以看到和上面一样的返回结果，说明Spring cloud zuul默认已经提供了转发功能。

到此zuul的基本使用我们就聊完了。关于zuul高级使用，我们下篇再来介绍。

[示例代码-Github](https://github.com/meteor1993/SpringCloudLearning/tree/master/chapter9)

参考：

[http://www.ityouknow.com/springcloud/2017/06/01/gateway-service-zuul.html](http://www.ityouknow.com/springcloud/2017/06/01/gateway-service-zuul.html)

[https://www.fangzhipeng.com/springcloud/2018/08/05/sc-f5-zuul.html](https://www.fangzhipeng.com/springcloud/2018/08/05/sc-f5-zuul.html)

> 版权声明：「DDKK.COM 弟弟快看，程序员编程资料站」本站文章，版权归原作者所有
