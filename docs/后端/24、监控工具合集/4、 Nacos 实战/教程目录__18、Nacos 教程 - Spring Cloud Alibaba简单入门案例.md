# 18、Nacos 教程 - Spring Cloud Alibaba简单入门案例
- 来源：https://ddkk.com/zhuanlan/registered/nacos/1/18.html
- 分类：注册中心
- 分组：教程目录
## 前言

Spring Cloud Alibaba 综合集成案例，用到了nacos配置中心，注册与发现中心，dubbo协议远程代理，zuul网关。

## 准备环境

需要先启动nacos，并新建一个命名空间为dev，以下配置文件中用到的namespace均为dev的id。

## 1. Spring Cloud Alibaba综合集成架构

> 前面介绍，Spring Cloud是一个较为全面的微服务框架，集成了如服务注册发现、配置中心、消息总线、负载均衡、断路器、API网关等功能实现。而在网上经常会发现Spring Cloud与阿里巴巴的Dubbo进行选择对比，这样做是不妥当的，前者是一套较为完整的架构方案，而Dubbo只是服务治理与RPC实现方案。
>
> Dubbo在国内有着非常大的用户群体，但是其周边设施与组件相对不完善。很多开发者用于又很希望享受Spring Cloud的生态，因此也会有一些Spring Cloud与Dubbo一起使用的案例与方法出现，但是一直依赖大部分的Spring Cloud整合Dubbo的使用方案都不完善。直到Spring Cloud Alibaba的出现，才得以解决这样二点问题。
>
> 在此之前，我们已经学习了如何使用Spring Cloud Alibaba来集成Nacos与Spring Cloud应用，并且在此之下也如传统的Spring Cloud应用一样地使用Ribbon或Feign来微服务之间的协作。由于Feign是基于Http Restful的调用，在高并发的性能下不理想，RPC方案能否切换到Dubbo？Spring Cloud与阿里系的若干组件能否完美集成呢?
>
> 本章将介绍如何集成一个微服务的基础架构，并讨论其合理性。

### 1.1 总体结构

组件说明:

- API网关: 系统统一入口，屏蔽架构内部结构，统一安全拦截，采用Zuul实现。
- application-1 :应用1，模拟应用，提供http接口服务
- service-1:微服务1，模拟微服务，提供dubbo接口服务。
- service-2:微服务2，模拟微服务，提供dubbo接口服务。

调用流程

所有访问系统的请求都要经过网关，网关转发http请求至application-1,application-1使用dubbo调用service-1完成自身业务，而后service-1调用service-2完成自身业务。至此，完成所有组件的贯穿。

架构中application与service的区别是什么？

- service 提供了基础服务功能；application组装完成基本服务功能，提供给用户直接可用的业务。
- service服务粒度小、功能基础，不易发生变化；application提供上游业务功能，紧贴业务需求，容易发生改变。
- 形成service支撑application的整体架构，增加多变的application甚至不需要变动service。

### 1.2 工程结构说明

maven工程结构图

```java
springcloudalibabademo  整个父工程
|-api-gateway           API网关:port 10000
|-application-1         应用1,port:10010
|-service-1             服务1
|-|- service-1-api      服务1  api
|-|- service-1-server   服务1 实现,port:10020
|-service-2             服务2             
|-|- service-2-api      服务2  api
|-|- service-2-server   服务2 实现,port:10030
```

### 1.3 创建工程结构

#### 1.3.1 父工程springcloudalibabademo

**1、** 创建maven父工程；

**2、** 定义包管理；

```java
<packaging>pom</packaging>
```

**1、** 引入依赖；

```java
<!--配置依赖管理-->
<dependencyManagement>
    <dependencies>
        <dependency>
            <groupId>com.alibaba.cloud</groupId>
            <artifactId>spring-cloud-alibaba-dependencies</artifactId>
            <version>2.1.0.RELEASE</version>
            <type>pom</type>
            <scope>import</scope>
        </dependency>
        <!-- https://mvnrepository.com/artifact/org.springframework.cloud/spring-cloud-dependencies -->
        <dependency>
            <groupId>org.springframework.cloud</groupId>
            <artifactId>spring-cloud-dependencies</artifactId>
            <version>Greenwich.RELEASE</version>
            <type>pom</type>
            <scope>import</scope>
        </dependency>
        <!-- https://mvnrepository.com/artifact/org.springframework.boot/spring-boot-dependencies -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-dependencies</artifactId>
            <version>2.1.3.RELEASE</version>
            <type>pom</type>
            <scope>import</scope>
        </dependency>
    </dependencies>
</dependencyManagement>
<build>
    <!--配置插件-->
    <plugins>
        <plugin>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-maven-plugin</artifactId>
        </plugin>
    </plugins>
</build>
```

#### 1.3.2 application1

#### 1.3.3 service-1&service-1-api&service-1-server

#### 1.3.4 service-2&service-2-api&service-2-server

#### 1.3.5 api-gateway

#### 1.3.6 项目模块和文件结构

### 1.4 实现application1

**1、** 引入依赖；

```java
<dependencies>
<dependency>
    <groupId>com.alibaba.cloud</groupId>
    <artifactId>spring-cloud-starter-alibaba-nacos-config</artifactId>
</dependency>
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-web</artifactId>
</dependency>
<dependency>
    <groupId>com.alibaba.cloud</groupId>
    <artifactId>spring-cloud-starter-alibaba-nacos-discovery</artifactId>
</dependency>
</dependencies>
```

**1、** 实现controller；

```java
@RestController
public class Application1Controller {
    @GetMapping("/service")
    public String service(){
        return "hello";
    }
}
```

**1、** 编写bootstrap.yml配置文件；

```java
server:
  port: ${
     port:10010} 启动端口
  servlet:
    context-path: /application1 指定访问头
spring:
  application:
    name: application1
  cloud:
    nacos:
      discovery: 注册发现
        server-addr: 127.0.0.1:8848
        namespace: 869a0c6d-267e-4aa1-96cb-552cb1632c72 dev
        cluster-name: DEFAULT集群
      config:    配置中心
        server-addr: 127.0.0.1:8848
        file-extension: yaml
        namespace: 869a0c6d-267e-4aa1-96cb-552cb1632c72 dev
        group: NACOS_MICROSERVICE_GROUP业务组
  main:
    allow-bean-definition-overriding: true spring boot 2.1 需要设定(防止bean重复覆盖问题)
logging:
  level:
    root: info
    org.springframework: info
```

**1、** 编写启动类；

```java
@SpringBootApplication
@EnableDiscoveryClient
public class Application1Bootstrap {
    public static void main(String[] args) {
        SpringApplication.run(Application1Bootstrap.class,args);
    }
}
```

**1、** 启动访问测试一下[http://127.0.0.1:10010/application1/service](http://127.0.0.1:10010/application1/service)；

### 1.5 实现service-1

#### 1.5.1 service-1-api定义接口

service-1-api只是负责定义接口，不负责实现。

所以这里直接在service-1-api下直接新建一个接口

```java
package com.it2.service1.api;
public interface ConsumerService {
    public String service();
}
```

#### 1.5.2 service-1-server实现

**1、** 引入service-1-api和配置管理与注册发现相关的依赖；

```java
<dependencies>
        <!--引入service1api的依赖-->
        <dependency>
            <groupId>com.it2</groupId>
            <artifactId>service-1-api</artifactId>
            <version>1.0-SNAPSHOT</version>
        </dependency>
        <!--用于服务注册和发现-->
        <dependency>
            <groupId>com.alibaba.cloud</groupId>
            <artifactId>spring-cloud-starter-alibaba-nacos-discovery</artifactId>
        </dependency>
        <!--用于配置管理-->
        <dependency>
            <groupId>com.alibaba.cloud</groupId>
            <artifactId>spring-cloud-starter-alibaba-nacos-config</artifactId>
        </dependency>
        <!--引入dubbo-->
        <dependency>
            <groupId>com.alibaba.cloud</groupId>
            <artifactId>spring-cloud-starter-dubbo</artifactId>
        </dependency>
    </dependencies>
```

**1、** 实现service-1-api的接口；

```java
package com.it2.service1.service;
import com.it2.service1.api.ConsumerService;
//注解标记此类表示此方法暴露为dubbo接口
@org.apache.dubbo.config.annotation.Service
public class ConsumerServiceImpl implements ConsumerService {
    //dubbo接口实现
    public String service() {
        return "consumer invoke ";
    }
}
```

**1、** 配置bootstrap.yml文件；

```java
server:
  port: ${
     port:10020} 启动端口
spring:
  application:
    name: service1
  cloud:
    nacos:
      discovery: 注册发现
        server-addr: 127.0.0.1:8848
        namespace: 869a0c6d-267e-4aa1-96cb-552cb1632c72 dev
        cluster-name: DEFAULT集群
      config:    配置中心
        server-addr: 127.0.0.1:8848
        file-extension: yaml
        namespace: 869a0c6d-267e-4aa1-96cb-552cb1632c72 dev
        group: NACOS_MICROSERVICE_GROUP业务组
  main:
    allow-bean-definition-overriding: true spring boot 2.1 需要设定(防止bean重复覆盖问题)
dubbo:
  scan:
    base-packages: com.it2.service1 服务扫描基准包(扫描被dubbo注解的类)
  protocol:
    name: dubbo 协议
    port: ${
     dubbo_port:20881} 协议端口
  registry:
    address: nacos://127.0.0.1:8848
  application:
    qos-enable: falsedubbo运维服务是否开启
  consumer:
    check: false启动时就检查依赖的服务
```

以上yml内容解析

**dubbo开头的dubbo服务的配置**

- dubbo.scan.base-packages:指定Dubbo服务实现类的扫描基准包，将@org.apache.dubbo.config.annotation.Service注解标记的service暴露为dubbo服务
- dubbo.protocol:Dubbo服务暴露的协议配置，其中子属性name为协议的名称，port为dubbo协议端口，可指定多协议。例如dubbo.protocol.rmi.port=1099
- dubbo.registry:Dubbo服务注册中心配置，其中子属性address的值"nacos://127.0.0.1:8848",说明dubbo服务注册到nacos,相当于原生的dubbo的xml配置中的``

**Spring Cloud开头的部分**

+spring.application.name:spring应用名称，用于spring cloud服务注册和发现。该值在Dubbo Spring Cloud 加持下被视为dubbo.application.name,因此，无需再显示的配置dubbo.application.name

- spring.cloud.nacos.discovery:nacos服务发现与注册中心，其中子属性server-addr指定nacos服务器主机与端口
- spring.cloud.nacos.config:nacos配置中心的配置管理，其中子属性server-addr指定nacos服务器主机与端口。

**1、** 编写启动类；

```java
@SpringBootApplication
@EnableDiscoveryClient
public class Service1Bootstrap {
    public static void main(String[] args) {
        SpringApplication.run(Service1Bootstrap.class,args);
    }
}
```

**1、** 启动然后再nacos的服务列表可以看到dubbo暴露的20881；

### 1.6 application1调用service1

**1、** 引入service-1-api的依赖；

```java
<dependency>
    <groupId>com.it2</groupId>
    <artifactId>service-1-api</artifactId>
    <version>1.0-SNAPSHOT</version>
</dependency>
<!--调用接口使用dubbo协议-->
<dependency>
    <groupId>com.alibaba.cloud</groupId>
    <artifactId>spring-cloud-starter-dubbo</artifactId>
</dependency>
```

**1、** 注入service,实现远程调用；

```java
@RestController
public class Application1Controller {
    //注入service(基于dubbo协议)
    @org.apache.dubbo.config.annotation.Reference //生成接口代理对象，通过代理对象进行远程调用
    ConsumerService consumerService;
    @GetMapping("/service")
    public String service(){
        String result=  consumerService.service();//远程调用接口
        return "hello | "+result;
    }
}
```

**1、** 启动application1,访问接口[http://127.0.0.1:10010/application1/service](http://127.0.0.1:10010/application1/service；

这样就实现了application1通过dubbo协议调用service1

### 1.7 实现service2

#### 1.7.1 service-2-api

service-2-api只是负责定义接口，不负责实现。

所以这里直接在service-2-api下直接新建一个接口

```java
package com.it2.service2.api;
public interface ProviderService {
    public String service();
}
```

#### 1.7.2 service-2-server

**1、** 引入service-2-api和配置管理与注册发现相关的依赖；

```java
<dependencies>
    <!--引入service2api的依赖-->
    <dependency>
        <groupId>com.it2</groupId>
        <artifactId>service-2-api</artifactId>
        <version>1.0-SNAPSHOT</version>
    </dependency>
    <!--用于服务注册和发现-->
    <dependency>
        <groupId>com.alibaba.cloud</groupId>
        <artifactId>spring-cloud-starter-alibaba-nacos-discovery</artifactId>
    </dependency>
    <!--用于配置管理-->
    <dependency>
        <groupId>com.alibaba.cloud</groupId>
        <artifactId>spring-cloud-starter-alibaba-nacos-config</artifactId>
    </dependency>
    <!--引入dubbo-->
    <dependency>
        <groupId>com.alibaba.cloud</groupId>
        <artifactId>spring-cloud-starter-dubbo</artifactId>
    </dependency>
</dependencies>
```

**1、** 实现service-2-api的接口；

```java
package com.it2.service2.service;
import com.it2.service2.api.ProviderService;
@org.apache.dubbo.config.annotation.Service
public class ProviderServiceImpl implements ProviderService {
    public String service() {
        return "provider invoke";
    }
}
```

**1、** 配置bootstrap.yml文件；

```java
server:
  port: ${
     port:10030} 启动端口
spring:
  application:
    name: service2
  cloud:
    nacos:
      discovery: 注册发现
        server-addr: 127.0.0.1:8848
        namespace: 869a0c6d-267e-4aa1-96cb-552cb1632c72 dev
        cluster-name: DEFAULT集群
      config:    配置中心
        server-addr: 127.0.0.1:8848
        file-extension: yaml
        namespace: 869a0c6d-267e-4aa1-96cb-552cb1632c72 dev
        group: NACOS_MICROSERVICE_GROUP业务组
  main:
    allow-bean-definition-overriding: true spring boot 2.1 需要设定(防止bean重复覆盖问题)
dubbo:
  scan:
    base-packages: com.it2.service2 服务扫描基准包(扫描被dubbo注解的类)
  protocol:
    name: dubbo 协议
    port: ${
     dubbo_port:20891} 协议端口
  registry:
    address: nacos://127.0.0.1:8848
  application:
    qos-enable: falsedubbo运维服务是否开启
  consumer:
    check: false启动时就检查依赖的服务
```

**1、** 编写启动类；

```java
@SpringBootApplication
@EnableDiscoveryClient
public class Service2Bootstrap {
    public static void main(String[] args) {
        SpringApplication.run(Service2Bootstrap.class,args);
    }
}
```

**1、** 启动然后再nacos的服务列表可以看到dubbo暴露的20891；

### 1.8 实现service1调用service2

**1、** 引入service-2-api；

```java
<dependency>
    <groupId>com.it2</groupId>
    <artifactId>service-2-api</artifactId>
    <version>1.0-SNAPSHOT</version>
</dependency>
```

**1、** 实现远程调用；

```java
//注解标记此类表示此方法暴露为dubbo接口
@org.apache.dubbo.config.annotation.Service
public class ConsumerServiceImpl implements ConsumerService {
    //注入service
    @org.apache.dubbo.config.annotation.Reference  //生成代理对象
    ProviderService providerService;
    //dubbo接口实现
    public String service() {
        String result=providerService.service();//远程调用接口
        return "consumer invoke | "+result;
    }
}
```

**1、** 重启service1,访问application1的接口,就可以看大application1调用service1,而service1调用service2；

### 1.9 实现api-gateway

#### 1.9.1 zuul介绍

什么是网关？

原来的单体架构，所有的服务都是本地的，UI可以直接调用，现在按功能拆分独立的服务，运行独立的一般都在独立的虚拟机上的java进程了。客户端UI如何访问？它的后台有n个服务，前台就需要记住管理n个服务,一般服务下线/更新/升级，前台就需要重新部署，这明显不符合我们拆分的理念，特别当前台是移动应用的时候，通常业务变化的节奏很快。另外,N个小服务的调用也是不小的网络开销。

有了网关作为服务统一入口，就可以避免上述问题，不仅如此，服务网关是在微服务前面设置的一道安全屏障，请求需要先到网关，服务会先对请求进行过滤，校验，路由等处理。有了服务网关可以提高微服务的安全性，网关校验请求的合法性，请求不合法将被拦截。

- 提供统一服务入口，让微服务对前台透明
- 聚合后台的服务，节省流量，提升性能
- 提供安全，过滤，流控等API管理功能

什么是Zuul?

Spring Cloud Zuul是整合Netflix公司的Zuul开源项目实现的微服务网关，它实现了请求路由、负载均衡、校验过滤等功能。

[https://cloud.spring.io/spring-cloud-netflix/multi/multi__router_and_filter_zuul.html](https://cloud.spring.io/spring-cloud-netflix/multi/multi__router_and_filter_zuul.html)

Zuul与Nginx怎么配置使用？

Zuul与Nginx在实际项目中需要配合使用，如下图，Nginx的作用是反向代理、负载均衡，Zuul的作用是保障微服务的安全访问，拦截微服务请求，校验合法性以及负债均衡。

#### 1.9.2 搭建网关工程api-gateway

**1、** 引入依赖；

```java
<!--用于服务注册和发现-->
<dependency>
    <groupId>com.alibaba.cloud</groupId>
    <artifactId>spring-cloud-starter-alibaba-nacos-discovery</artifactId>
</dependency>
<!--用于配置管理-->
<dependency>
    <groupId>com.alibaba.cloud</groupId>
    <artifactId>spring-cloud-starter-alibaba-nacos-config</artifactId>
</dependency>
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-web</artifactId>
</dependency>
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-starter-netflix-zuul</artifactId>
</dependency>
<!--网关调用微服务使用http协议-->
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-starter-openfeign</artifactId>
</dependency>
```

**1、** 配置bootstrap.yml；

```java
server:
  port: ${
     port:10000} 启动端口
spring:
  application:
    name: api-gateway
  cloud:
    nacos:
      discovery: 注册发现
        server-addr: 127.0.0.1:8848
        namespace: 869a0c6d-267e-4aa1-96cb-552cb1632c72 dev
        cluster-name: DEFAULT集群
      config:    配置中心
        server-addr: 127.0.0.1:8848
        file-extension: yaml
        namespace: 869a0c6d-267e-4aa1-96cb-552cb1632c72 dev
        group: NACOS_MICROSERVICE_GROUP业务组
  main:
    allow-bean-definition-overriding: true spring boot 2.1 需要设定(防止bean重复覆盖问题)
```

**1、** 配置路由，直接在nacos配置管理下添加配置（命名空间为dev）(因为网关的代理会经常变动，所以这里在nacos后台配置)；

```java
zuul:
 routes:
   application1: application1表示application1这个微服务
     stripPrefix: false
     path: /application1/**
```

**5、** 编写api-gateway启动类，网关的启动类需要使用@EnableZuulProxy注解标记此工程为Zuul网关；

```java
@SpringBootApplication
@EnableDiscoveryClient
@EnableZuulProxy  //启动类必须使用EnableZuulProxy注解标识此工程为Zuul网关
public class ApiGatewayBootstrap {
    public static void main(String[] args) {
        SpringApplication.run(ApiGatewayBootstrap.class,args);
    }
}
```

**1、** 启动网关,可以看到nacos服务类列表中发现了网关；

**2、** 此时我们就可以通过网关来请求application1的接口，[http://127.0.0.1:10000/application1/service](http://127.0.0.1:10000/application1/service)，因为网关的接口是10000,而application1的端口为10010，所以我们的请求是从网关进行的代理转发；

## 2. 代码建议

使用dubbo注解时，由于Service和Reference存在重名，容易引起冲突，建议使用dubbo注解时，使用全名，而不是直接使用@Service和@Reference。如下为示例：

@org.apache.dubbo.config.annotation.Reference

@org.apache.dubbo.config.annotation.Service

## 3. 遇到的问题

### 3.1 Failed to execute goal on project service-1-server: Could not resolve dependencies for project

解决方案见:[https://blog.csdn.net/u011628753/article/details/124434986](https://blog.csdn.net/u011628753/article/details/124434986)
