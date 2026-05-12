# 19、SpringBoot 实战 - 集成 Ribbon
- 来源：https://ddkk.com/zhuanlan/j2ee/springboot/5/19.html
- 分类：J2EE框架
- 分组：教程目录
## 一、负载均衡的分类

负载均衡根据所在的位置不同，分为：`服务端负载均衡`、`客户端负载均衡`。

### 1.服务端负载均衡

`服务端负载均衡`：客户端发起的请求首先被转到负载设备上面，应用服务器对客户端不可见。

### 2.客户端负载均衡

`客户端负载均衡`：在客户端维护着服务列表（IP 和端口），按照一定的算法分发请求到不同的服务器节点。通常在应用内部服务与服务之间的调用。

## 二、定义和依赖

### 1.Ribbon

`Ribbon` 是 Netflix 推出的开源框架，其主要功能是实现客户端的负载均衡算法。

```xml
<!-- Ribbon -->
<dependency>
    <groupId>com.netflix.ribbon</groupId>
    <artifactId>ribbon</artifactId>
    <version>2.3.0</version>
</dependency>
<dependency>
    <groupId>com.netflix.ribbon</groupId>
    <artifactId>ribbon-httpclient</artifactId>
    <version>2.3.0</version>
</dependency>
<dependency>
    <groupId>com.netflix.ribbon</groupId>
    <artifactId>ribbon-loadbalancer</artifactId>
    <version>2.3.0</version>
</dependency>
```

### 2.Spring Cloud Ribbon

`Spring Cloud Ribbon` 是基于 Netflix 公司的 `Ribbon` 进一步封装和扩展。

```xml
<!-- Spring Cloud Ribbon -->
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-starter-netflix-ribbon</artifactId>
    <version>2.2.5.RELEASE</version>
</dependency>
```

### 3.Spring Cloud Loadbalancer

`Spring Cloud Loadbalancer` 是 Spring Cloud 官方自己实现的客户端负载均衡器，是 Netflix Ribbon 的替换方案。

```xml
<!-- Spring Cloud Loadbalancer -->
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-loadbalancer</artifactId>
    <version>2.2.5.RELEASE</version>
</dependency>
```

## 三、搭建测试项目

项目名称：springboot-ribbon

SpringBoot版本：**2.4.5**

SpringCloud版本：**2020.0.0**

### 1.Maven依赖

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    <groupId>com.example</groupId>
    <artifactId>springboot-ribbon</artifactId>
    <version>0.0.1-SNAPSHOT</version>
    <name>springboot-ribbon</name>
    <description>Demo project for Spring Boot</description>
    <properties>
        <!-- build env -->
        <java.version>1.8</java.version>
        <maven.compiler.source>1.8</maven.compiler.source>
        <maven.compiler.target>1.8</maven.compiler.target>
        <!-- dependency version -->
        <lombok.version>1.18.18</lombok.version>
    </properties>
    <dependencies>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
        <!-- Lombok -->
        <dependency>
            <groupId>org.projectlombok</groupId>
            <artifactId>lombok</artifactId>
            <version>${lombok.version}</version>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-test</artifactId>
            <scope>test</scope>
        </dependency>
        <!-- Eureka -->
        <dependency>
            <groupId>org.springframework.cloud</groupId>
            <artifactId>spring-cloud-starter-netflix-eureka-client</artifactId>
        </dependency>
    </dependencies>
    <dependencyManagement>
        <dependencies>
            <dependency>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-dependencies</artifactId>
                <version>2.4.5</version>
                <type>pom</type>
                <scope>import</scope>
            </dependency>
            <dependency>
                <groupId>org.springframework.cloud</groupId>
                <artifactId>spring-cloud-dependencies</artifactId>
                <version>2020.0.0</version>
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
                <configuration>
                    <excludes>
                        <exclude>
                            <groupId>org.projectlombok</groupId>
                            <artifactId>lombok</artifactId>
                        </exclude>
                    </excludes>
                </configuration>
            </plugin>
        </plugins>
    </build>
</project>
```

### 2.yaml配置

```java
server:
  port: 8081
spring:
  application:
    name: springboot-ribbon
#eureka client
eureka:
  client:
    service-url:
      defaultZone: http://demo:Demo2023@localhost:1001/eureka/
  instance:
    hostname: localhost
    prefer-ip-address: true 是否使用 ip 地址注册
    instance-id: ${
     spring.cloud.client.ip-address}:${
     server.port} ip:port
    lease-renewal-interval-in-seconds: 5 实例续期心跳间隔（默认30s），设置之后启动服务不需要等很久就可以访问到服务的内容
    lease-expiration-duration-in-seconds: 15 实例续期持续多久后失效（默认90s）
```

### 3.配置类

**RestTemplateConfig.java**

```java
import org.springframework.cloud.client.loadbalancer.LoadBalanced;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;
/**
 * <p> @Title RestTemplateConfig
 * <p> @Description RestTemplateConfig
 *
 * @author DDKK.COM 弟弟快看，程序员编程资料站
 * @date 2023/7/3 16:30
 */
@Configuration
public class RestTemplateConfig {
    @Bean
    @LoadBalanced
    public RestTemplate restTemplate() {
        return new RestTemplate();
    }
}
```

### 4.启动类

**SpringbootDemoApplication.java**

```java
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.netflix.eureka.EnableEurekaClient;
@EnableEurekaClient
@SpringBootApplication
public class SpringbootDemoApplication {
    public static void main(String[] args) {
        SpringApplication.run(SpringbootDemoApplication.class, args);
    }
}
```

### 5.接口类

**DemoController.java**

```java
package com.demo.controller;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.client.loadbalancer.LoadBalanced;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestTemplate;
/**
 * <p> @Title DemoController
 * <p> @Description DemoController
 *
 * @author DDKK.COM 弟弟快看，程序员编程资料站
 * @date 2023/7/3 16:34
 */
@RestController
@RequestMapping("/demo")
public class DemoController {
    /**
     * 服务地址
     */
    private static final String INVOKE_URL = "http://springboot-ribbon";
    @Value("${server.port}")
    private String port;
    @Autowired
    @LoadBalanced
    private RestTemplate restTemplate;
    @GetMapping("/test")
    public String test() {
        return "Hello, Ribbon! port:" + port;
    }
    @GetMapping("/ribbonTest")
    public String ribbonTest() {
        return restTemplate.getForObject(INVOKE_URL + "/demo/test", String.class);
    }
}
```

## 四、测试

点击`Edit` 编辑启动配置。

选择`Muldify Options`。

在启动配置中选择允许运行多个实例。

启动端口 `8081` 后，修改 applycation.yml，再端口 `8082`，共两个实例。

第一次请求地址：[http://localhost:8081/demo/ribbonTest](http://localhost:8081/demo/ribbonTest)

第二次请求地址：[http://localhost:8081/demo/ribbonTest](http://localhost:8081/demo/ribbonTest)

测试结果成功轮询访问了 `8081` 和 `8082` 两个端口的实例。

## 五、补充：认识 Ribbon 的组件

**负载均衡到底要解决什么样的问题？**

- 把请求按照一定的算法分配到不同的服务节点上面。

**Ribbon 如何获取和维护服务节点？**

- ServerList：服务列表接口。
- ServerListFilter：服务列表过滤接口。
- ServerListUpdater：服务列表更新接口。

**如何实现负载均衡策略？**

- 自定义 IRule 接口实现类。

**如何获取服务统计数据？**

- ServerStatus
- ZoneSnapshot
- LoadBalanceStats

**如何实现配置体系？**

- IClientConfig：Ribbon 原生配置接口。
- SpringClientFactory：Spring 配置隔离。

**如何实现心跳检测？**

- IPing 接口
- IPingStrategy 接口

**如何进行负载均衡调度管理？**

通过`ILoadBalancer` 接口。

```java
public class BaseLoadBalancer extends AbstractLoadBalancer implements
        PrimeConnections.PrimeConnectionListener, IClientConfigAware {
	protected IRule rule = DEFAULT_RULE; // 负载均衡策略
    protected IPingStrategy pingStrategy = DEFAULT_PING_STRATEGY; // 心跳检测策略
    protected IPing ping = null; // 心跳检测
    protected LoadBalancerStats lbStats; // 负载均衡统计数据
    private IClientConfig config; // 负载均衡策略
}
```

```java
public class DynamicServerListLoadBalancer<T extends Server> extends BaseLoadBalancer {
    volatile ServerList<T> serverListImpl; // 服务列表
    volatile ServerListFilter<T> filter; // 服务列表过滤器
    protected volatile ServerListUpdater serverListUpdater; // 服务列表更新器
}
```

**Ribbon 如何与客户端进行整合？**

- 与 RestTemplate 配合使用。
- 与 openfeign 配合使用。

整理完毕，完结撒花~ 🌻
