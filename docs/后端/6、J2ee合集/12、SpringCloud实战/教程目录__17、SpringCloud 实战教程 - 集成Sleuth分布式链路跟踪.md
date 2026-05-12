# 17、SpringCloud 实战教程 - 集成Sleuth分布式链路跟踪
- 来源：https://ddkk.com/zhuanlan/j2ee/springcloud/2/17.html
- 分类：J2EE框架
- 分组：教程目录
## 1. 概述

在微服务框架中，一个由客户端发起的请求在后端系统中会经过多个不同的服务节点调用来协同产生最后的请求结果，每一个前端请求都会形成一条复杂的分布式服务调用链路，链路中的任何一环出现高延时或错误都会引起整个请求最后的失败。所以在较复杂的系统中，一个调用链路中会有很多个微服务，无疑我们需要对链路上的微服务进行跟踪。

SpringCloud Sleuth就提供了一套完整的服务跟踪的解决方案，在分布式系统中提供了追踪解决方案并且兼容支持了zipkin，**SpringCloud Sleuth负责对微服务调用链路的收集整理，而zipkin负责对链路的展现**。

## 2. zipkin的搭建安装

SpringCloud从F版之后就不需要自己构建Zipkin Server了，只需要调用相关jar包即可，[zipkin的jar包下载地址](http://dl.bintray.com/openzipkin/maven/io/zipkin/java/zipkin-server/)，下载其jar包到本地，我下的是当前最新的zipkin-server-2.12.9-exec.jar。进入到该jar包的目录，在命令行中输入`java -jar`命令运行该jar文件：

```java
java -jar zipkin-server-2.12.9-exec.jar
```

- 1

访问http://localhost:9411/zipkin/ 进入zipkin监控平台页面：

## 3. Sleuth链路监控展现

在需要被链路监控的微服务中引入如下依赖：

```java
<!--包含了sleuth+zipkin-->
<dependency>
	<groupId>org.springframework.cloud</groupId>
	<artifactId>spring-cloud-starter-zipkin</artifactId>
</dependency>
```

比如在我们最开始学习Eureka服务注册中心时使用的8001微服务（服务提供方）和80微服务（服务消费方），那时候80微服务作为服务消费方访问8001提供的微服务，我们现在在这两个微服务中引入上述依赖，并在配置文件中配置zipkin和sleuth的配置信息：

```java
spring:
  zipkin:
    base-url: http://localhost:9411
  sleuth:
    sampler:
      采样率值介于0到1之间，1表示全部采集
      probability: 1
```

在80和8001微服务都引入了上述依赖并添加了上面的配置后，启动Eureka服务注册中心、8001服务提供方服务、80服务消费方服务，然后我们用80调用8001的服务进行测试，在zipkin面板中即可查看服务调用链路：
