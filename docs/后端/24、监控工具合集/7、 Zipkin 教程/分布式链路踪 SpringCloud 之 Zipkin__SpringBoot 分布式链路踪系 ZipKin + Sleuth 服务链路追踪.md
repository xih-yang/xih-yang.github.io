# SpringBoot 分布式链路踪系 ZipKin + Sleuth 服务链路追踪
- 来源：https://ddkk.com/zhuanlan/linktrack/zipkin/17.html
- 分类：链路追踪
- 分组：分布式链路踪 SpringCloud 之 Zipkin
来到这一篇， 我们已经完成了SpringCloud大部分核心组件的整合，那么我们接下来就整合ZipKin组件，

## 什么是服务链路追踪，作用是什么？

我简单表述下，就是我们可以通过整合这个组件，能看到所有微服务直接的调用关系，所有接口的访问详情，包括节点、耗时等等信息，就是一种对整个分布式微服务架构提供监控分析的功能。

## PS：

在整合zipkin的前提，我必须先告诉大家，自从springboot 2.0后，其实官方提供了在ZipKin Server服务的jar，直接下载运行即可：

**地址：[https://zipkin.io/pages/quickstart](https://zipkin.io/pages/quickstart) ， 找到**[latest release](https://search.maven.org/remote_content?g=io.zipkin.java&a=zipkin-server&v=LATEST&c=exec)**进行下载。**

Windows 环境，打开cmd java -jar zipkin-server-xxx.jar 启动， 访问 [http://localhost:9411/](http://localhost:9411/) ，能出现网页证明已经成功部署运行。

但是在这篇文章了，是从零整合，也就是我们将会自己创建一个Springboot项目，完成整合ZipKin &Sleuth 组件 。

## 接下来开始：

我们创建一个springboot项目，起名zipkin-server：

pom.xml：

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
	xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
	<modelVersion>4.0.0</modelVersion>
	<parent>
		<groupId>org.springframework.boot</groupId>
		<artifactId>spring-boot-starter-parent</artifactId>
		<version>2.1.4.RELEASE</version>
		<relativePath/> <!-- lookup parent from repository -->
	</parent>
	<groupId>com.cloud</groupId>
	<artifactId>zipkin-server</artifactId>
	<version>0.0.1-SNAPSHOT</version>
	<name>zipkin-server</name>
	<description>Demo project for Spring Boot</description>
	<properties>
		<java.version>1.8</java.version>
	</properties>
	<dependencies>
		<dependency>
			<groupId>org.springframework.boot</groupId>
			<artifactId>spring-boot-starter</artifactId>
		</dependency>
		<dependency>
			<groupId>io.zipkin.java</groupId>
			<artifactId>zipkin-server</artifactId>
			<version>2.11.8</version>
		</dependency>
		<dependency>
			<groupId>io.zipkin.java</groupId>
			<artifactId>zipkin-autoconfigure-ui</artifactId>
			<version>2.11.8</version>
		</dependency>
		<dependency>
			<groupId>org.springframework.cloud</groupId>
			<artifactId>spring-cloud-starter-netflix-eureka-server</artifactId>
			<version>2.0.0.RELEASE</version>
		</dependency>
		<dependency>
			<groupId>org.springframework.boot</groupId>
			<artifactId>spring-boot-starter-test</artifactId>
			<scope>test</scope>
		</dependency>
	</dependencies>
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

## 然后是application.yml：

```bash
server:
  port: 9411
spring:
  application:
    name: zipkin-server
management:
  metrics:
    web:
      server:
        auto-time-requests: false
eureka:
  client:
    serviceUrl:
      defaultZone: http://localhost:8761/eureka/
  instance:
      preferIpAddress: true
      instance-id: ${spring.cloud.client.ip-address}:${server.port}
```

到这里，其实ZipKin Server这一段我们已经完成了。

我们可以将项目跑起来（记得前提eureka注册中心是正常运行的，我们有做注册），访问 [http://localhost:9411/](http://localhost:9411/) :

ZipKin服务端是正常部署运行了，那么我们需要在各个微服务上也整合这个组件，这样才能将微服务与ZipKin Server互通。

我们在网关服务，gateway的pom.xml导入依赖：

```xml
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-starter-sleuth</artifactId>
    <version>2.0.0.RELEASE</version>
</dependency>
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-starter-zipkin</artifactId>
    <version>2.0.0.RELEASE</version>
</dependency>
```

## 在application.yml上添加相关的配置项后：

```bash
server:
  port: 8081
spring:
  application:
    name: gateway-service
  zipkin:
    base-url: http://localhost:9411
    sender:
      type: web
  sleuth:
    sampler:
#采样100%
      probability: 1.0
  cloud:
      gateway:
        discovery:
          locator:
            enabled: false
#开启小写验证，默认feign根据服务名查找都是用的全大写
            lowerCaseServiceId: true
        routes:
        - id: client-test
          uri: lb://CLIENT-TEST
          predicates:
            - Path=/testclient/**
          filters:
            - StripPrefix=1
        - id: service-feign
          uri: lb://FEIGN
          predicates:
            - Path=/service-feign/**
          filters:
            - StripPrefix=1
eureka:
  instance:
    preferIpAddress: true
    instance-id: ${spring.cloud.client.ip-address}:${server.port}
  client:
    service-url:
      defaultZone: http://localhost:8761/eureka/
```

## 这样网关服务已经整合Zipkin&Sleuth 完成；

同样，我们在client-test服务实例和feign服务实例都做一样的操作，导入相关依赖&yml配置文件添加对应的配置项；

我们来通过网关访问下client-test服务的接口，[http://localhost:8081/testclient/haveatry?name=1323](http://localhost:8081/testclient/haveatry?name=1323) ；

然后看看[http://localhost:9411/](http://localhost:9411/) ，点击Find Traces：

可以看到有相关接口调用信息，不过这是通过网关访问的client-test服务，我们再来个涉及多一点服务的，

我们通过 网关 调用 Feign服务 然后Feign服务 调用 CLIENT-TEST 服务，我们再来看看相关的跟踪信息：

[http://localhost:8081/service-feign/feignTest?name=JCccc](http://localhost:8081/service-feign/feignTest?name=JCccc)

## 可以点进去查看更加具体的详情：

我们开可以点击Dependencies，可以看到接口调用整个过程涉及到的微服务关系：

OK，整合ZipKin &Sleuth 服务链路追踪就到此完毕。
