# 25、Spring Boot 4 整合 Eureka 完整教程
- 来源：https://ddkk.com/springboot/4-action/25.html
- 分类：Spring Boot 4 整合教程
- 分组：五、微服务与云原生
- 日期：2025-12-08
做微服务项目的时候,最烦的就是服务发现,服务多了管理起来麻烦,服务地址硬编码、服务变更得重启,一堆问题;后来听说Netflix开源的Eureka这玩意儿不错,服务注册与发现、负载均衡、高可用一应俱全,而且还是Spring Cloud官方推荐的服务发现组件;但是直接用Eureka写,那叫一个复杂,服务注册、服务发现、心跳机制、自我保护模式,一堆配置写得人头疼;后来发现Spring Cloud Netflix直接把这些都封装好了,用起来贼简单;现在Spring Boot 4出来了,整合Eureka更是方便得不行,自动配置给你整得明明白白,咱今天就聊聊Spring Boot 4咋整合Eureka的。

其实Eureka在Spring Boot里早就支持了,你只要加个`spring-cloud-starter-netflix-eureka-server`和`spring-cloud-starter-netflix-eureka-client`依赖,基本上就能用;但是很多兄弟不知道里面的门道,也不知道咋用服务注册、服务发现、负载均衡、高可用、自我保护模式这些高级功能,更不知道咋和Spring Cloud LoadBalancer、Spring Cloud OpenFeign无缝集成,所以鹏磊今天就给兄弟们掰扯掰扯。

## Eureka基础概念

### Eureka是啥玩意儿

Eureka是Netflix开源的一个基于REST的服务发现组件,主要用于AWS云中定位服务,以实现中间层服务器的负载均衡和故障转移;Eureka的核心特点包括:

1. **服务注册与发现**: 服务提供者启动时向Eureka Server注册,服务消费者从Eureka Server获取服务列表
2. **心跳机制**: 服务提供者定期向Eureka Server发送心跳,保持服务可用状态
3. **自我保护模式**: 当网络分区故障时,Eureka Server进入自我保护模式,保护服务注册信息
4. **负载均衡**: 配合Ribbon或Spring Cloud LoadBalancer实现客户端负载均衡
5. **高可用**: 支持Eureka Server集群,提高系统可用性
6. **服务监控**: 提供Web界面,可以查看注册的服务实例

### Eureka的核心概念

1. **Eureka Server(服务注册中心)**: 提供服务注册与发现功能,维护服务实例的注册表
2. **Eureka Client(服务客户端)**: 服务提供者和服务消费者都是Eureka Client
3. **服务注册(Service Registration)**: 服务提供者启动时向Eureka Server注册自己的信息
4. **服务续约(Service Renewal)**: 服务提供者定期向Eureka Server发送心跳,续约服务
5. **服务获取(Service Fetch)**: 服务消费者从Eureka Server获取服务列表
6. **服务下线(Service Cancel)**: 服务提供者关闭时向Eureka Server注销服务
7. **自我保护模式(Self Preservation)**: 当网络分区故障时,Eureka Server进入自我保护模式

### Eureka和Nacos的区别

1. **维护状态**: Eureka已经进入维护模式,不再积极开发新功能;Nacos是阿里巴巴维护,活跃度高
2. **功能**: Eureka只支持服务发现;Nacos支持服务发现和配置管理
3. **健康检查**: Eureka只支持客户端心跳;Nacos支持多种健康检查方式
4. **性能**: Nacos性能更好,支持百万级服务注册;Eureka性能相对较低
5. **配置管理**: Eureka不支持配置管理;Nacos支持动态配置管理
6. **适用场景**: Eureka适合简单的服务发现场景;Nacos适合需要配置管理的场景

## Eureka Server搭建

### 创建Eureka Server项目

首先创建一个Eureka Server项目,项目结构大概是这样:

```plaintext
eureka-server/
├── pom.xml                          # Maven配置文件
├── src/
│   ├── main/
│   │   ├── java/
│   │   │   └── com/
│   │   │       └── example/
│   │   │           └── eureka/
│   │   │               └── EurekaServerApplication.java  # 启动类
│   │   └── resources/
│   │       └── application.yml     # 配置文件
│   └── test/
```

### Eureka Server的pom.xml配置

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 
         http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    <!-- 继承Spring Boot父POM,统一管理版本 -->
    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>4.0.0</version>  <!-- Spring Boot 4.0版本 -->
        <relativePath/>
    </parent>
    <groupId>com.example</groupId>
    <artifactId>eureka-server</artifactId>
    <version>1.0.0</version>
    <packaging>jar</packaging>
    <name>Eureka Server</name>
    <description>Eureka服务注册中心</description>
    <properties>
        <java.version>17</java.version>  <!-- Java 17以上 -->
        <maven.compiler.source>17</maven.compiler.source>
        <maven.compiler.target>17</maven.compiler.target>
        <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
        <spring-cloud.version>2023.0.0</spring-cloud.version>  <!-- Spring Cloud版本 -->
    </properties>
    <dependencyManagement>
        <dependencies>
            <!-- Spring Cloud依赖管理 -->
            <dependency>
                <groupId>org.springframework.cloud</groupId>
                <artifactId>spring-cloud-dependencies</artifactId>
                <version>${spring-cloud.version}</version>
                <type>pom</type>
                <scope>import</scope>
            </dependency>
        </dependencies>
    </dependencyManagement>
    <dependencies>
        <!-- Spring Boot Web Starter: 包含Spring MVC、Tomcat等 -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
        <!-- Eureka Server Starter: Eureka服务注册中心 -->
        <dependency>
            <groupId>org.springframework.cloud</groupId>
            <artifactId>spring-cloud-starter-netflix-eureka-server</artifactId>
        </dependency>
        <!-- Spring Boot Actuator: 监控和管理支持 -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-actuator</artifactId>
        </dependency>
    </dependencies>
    <build>
        <plugins>
            <!-- Spring Boot Maven插件: 打包成可执行JAR -->
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
            </plugin>
        </plugins>
    </build>
</project>
```

### Eureka Server的application.yml配置

```yaml
server:
  port: 8761  # Eureka Server端口,默认8761
spring:
  application:
    name: eureka-server  # 应用名称
# Eureka配置
eureka:
  instance:
    hostname: localhost  # 主机名
  client:
    # 是否向Eureka Server注册自己,单机模式下设为false
    register-with-eureka: false
    # 是否从Eureka Server获取服务注册信息,单机模式下设为false
    fetch-registry: false
    # Eureka Server地址
    service-url:
      defaultZone: http://${eureka.instance.hostname}:${server.port}/eureka/
  server:
    # 是否启用自我保护模式,开发环境可以设为false
    enable-self-preservation: true
    # 清理间隔(毫秒),默认60秒
    eviction-interval-timer-in-ms: 60000
```

### Eureka Server启动类

```java
package com.example.eureka;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.netflix.eureka.server.EnableEurekaServer;
/**
 * Eureka Server启动类
 * @EnableEurekaServer注解启用Eureka Server功能
 */
@SpringBootApplication
@EnableEurekaServer  // 启用Eureka Server,这是关键注解
public class EurekaServerApplication {
    public static void main(String[] args) {
        SpringApplication.run(EurekaServerApplication.class, args);
        System.out.println("Eureka Server启动成功! 访问地址: http://localhost:8761");
    }
}
```

启动后访问 http://localhost:8761 可以看到Eureka控制台。

## 场景一: 服务提供者注册到Eureka

### 应用场景

你的服务需要注册到Eureka Server,让其他服务可以发现和调用你的服务。

### 创建服务提供者项目

项目结构大概是这样:

```plaintext
service-provider/
├── pom.xml                          # Maven配置文件
├── src/
│   ├── main/
│   │   ├── java/
│   │   │   └── com/
│   │   │       └── example/
│   │   │           └── provider/
│   │   │               ├── ProviderApplication.java  # 启动类
│   │   │               └── controller/
│   │   │                   └── UserController.java  # 用户控制器
│   │   └── resources/
│   │       └── application.yml     # 配置文件
│   └── test/
```

### 服务提供者的pom.xml配置

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 
         http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>4.0.0</version>
        <relativePath/>
    </parent>
    <groupId>com.example</groupId>
    <artifactId>service-provider</artifactId>
    <version>1.0.0</version>
    <packaging>jar</packaging>
    <name>Service Provider</name>
    <description>服务提供者</description>
    <properties>
        <java.version>17</java.version>
        <maven.compiler.source>17</maven.compiler.source>
        <maven.compiler.target>17</maven.compiler.target>
        <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
        <spring-cloud.version>2023.0.0</spring-cloud.version>
    </properties>
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
    <dependencies>
        <!-- Spring Boot Web Starter -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
        <!-- Eureka Client Starter: Eureka客户端 -->
        <dependency>
            <groupId>org.springframework.cloud</groupId>
            <artifactId>spring-cloud-starter-netflix-eureka-client</artifactId>
        </dependency>
        <!-- Spring Boot Actuator: 健康检查支持 -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-actuator</artifactId>
        </dependency>
        <!-- Lombok -->
        <dependency>
            <groupId>org.projectlombok</groupId>
            <artifactId>lombok</artifactId>
            <optional>true</optional>
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

### 服务提供者的application.yml配置

```yaml
server:
  port: 8081  # 服务端口
spring:
  application:
    name: user-service  # 服务名称,在Eureka中显示的服务名
# Eureka配置
eureka:
  client:
    # Eureka Server地址
    service-url:
      defaultZone: http://localhost:8761/eureka/
    # 是否注册到Eureka Server,默认true
    register-with-eureka: true
    # 是否从Eureka Server获取服务注册信息,默认true
    fetch-registry: true
    # 注册中心刷新间隔(秒),默认30秒
    registry-fetch-interval-seconds: 30
  instance:
    # 是否优先使用IP地址,而不是主机名
    prefer-ip-address: true
    # 实例ID,默认格式: ${spring.application.name}:${spring.application.instance_id:${server.port}}}
    instance-id: ${spring.application.name}:${server.port}
    # 心跳间隔(秒),默认30秒
    lease-renewal-interval-in-seconds: 30
    # 心跳超时时间(秒),默认90秒,超过这个时间Eureka Server会认为服务不可用
    lease-expiration-duration-in-seconds: 90
    # 健康检查URL路径
    health-check-url-path: /actuator/health
# Actuator配置
management:
  endpoints:
    web:
      exposure:
        include: health,info  # 暴露健康检查端点
  endpoint:
    health:
      show-details: always  # 显示健康检查详情
```

### 服务提供者启动类

```java
package com.example.provider;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
/**
 * 服务提供者启动类
 * 不需要@EnableEurekaClient注解,Spring Cloud会自动启用Eureka Client
 */
@SpringBootApplication
public class ProviderApplication {
    public static void main(String[] args) {
        SpringApplication.run(ProviderApplication.class, args);
        System.out.println("服务提供者启动成功!");
    }
}
```

### 服务提供者Controller

```java
package com.example.provider.controller;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
/**
 * 用户控制器
 * 提供用户服务接口
 */
@Slf4j
@RestController
@RequestMapping("/api/user")
public class UserController {
    // 获取服务端口,用于区分不同实例
    @Value("${server.port}")
    private String port;
    /**
     * 根据用户ID查询用户信息
     */
    @GetMapping("/{userId}")
    public String getUserInfo(@PathVariable Long userId) {
        log.info("查询用户信息,用户ID: {}, 服务端口: {}", userId, port);
        return String.format("用户信息: 用户ID=%d, 用户名=张三, 邮箱=zhangsan@example.com, 服务端口=%s", 
            userId, port);
    }
    /**
     * 健康检查接口
     */
    @GetMapping("/health")
    public String health() {
        return "服务健康,端口: " + port;
    }
}
```

启动服务提供者后,可以在Eureka控制台看到注册的服务。

## 场景二: 服务消费者从Eureka发现服务

### 应用场景

你的服务需要调用其他服务,通过Eureka Server发现服务实例,实现服务调用。

### 创建服务消费者项目

项目结构和服务提供者类似,这里只展示关键配置。

### 服务消费者的application.yml配置

```yaml
server:
  port: 8082  # 服务端口
spring:
  application:
    name: order-service  # 服务名称
# Eureka配置
eureka:
  client:
    # Eureka Server地址
    service-url:
      defaultZone: http://localhost:8761/eureka/
    # 是否注册到Eureka Server
    register-with-eureka: true
    # 是否从Eureka Server获取服务注册信息
    fetch-registry: true
    # 注册中心刷新间隔(秒)
    registry-fetch-interval-seconds: 30
  instance:
    prefer-ip-address: true
    instance-id: ${spring.application.name}:${server.port}
```

### 使用RestTemplate调用服务

```java
package com.example.consumer.controller;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cloud.client.ServiceInstance;
import org.springframework.cloud.client.discovery.DiscoveryClient;
import org.springframework.cloud.client.loadbalancer.LoadBalancerClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestTemplate;
import java.util.List;
/**
 * 订单控制器
 * 演示如何通过Eureka发现和调用服务
 */
@Slf4j
@RestController
@RequestMapping("/api/order")
public class OrderController {
    // 注入DiscoveryClient,用于服务发现
    private final DiscoveryClient discoveryClient;
    // 注入LoadBalancerClient,用于负载均衡
    private final LoadBalancerClient loadBalancerClient;
    // RestTemplate用于HTTP调用
    private final RestTemplate restTemplate;
    public OrderController(
        DiscoveryClient discoveryClient,
        LoadBalancerClient loadBalancerClient,
        RestTemplate restTemplate
    ) {
        this.discoveryClient = discoveryClient;
        this.loadBalancerClient = loadBalancerClient;
        this.restTemplate = restTemplate;
    }
    /**
     * 方式一: 使用DiscoveryClient发现服务
     */
    @GetMapping("/user/{userId}")
    public String getUserInfo(@PathVariable Long userId) {
        // 获取服务实例列表
        List<ServiceInstance> instances = discoveryClient.getInstances("user-service");
        if (instances.isEmpty()) {
            return "未找到user-service服务实例";
        }
        // 选择第一个实例(实际应该使用负载均衡)
        ServiceInstance instance = instances.get(0);
        String url = String.format("http://%s:%d/api/user/%d", 
            instance.getHost(), instance.getPort(), userId);
        log.info("调用服务: {}", url);
        // 调用服务
        return restTemplate.getForObject(url, String.class);
    }
    /**
     * 方式二: 使用LoadBalancerClient进行负载均衡
     */
    @GetMapping("/user2/{userId}")
    public String getUserInfo2(@PathVariable Long userId) {
        // 使用负载均衡选择一个实例
        ServiceInstance instance = loadBalancerClient.choose("user-service");
        if (instance == null) {
            return "未找到user-service服务实例";
        }
        String url = String.format("http://%s:%d/api/user/%d", 
            instance.getHost(), instance.getPort(), userId);
        log.info("调用服务(负载均衡): {}", url);
        // 调用服务
        return restTemplate.getForObject(url, String.class);
    }
}
```

### 配置RestTemplate和LoadBalancer

```java
package com.example.consumer.config;
import org.springframework.cloud.client.loadbalancer.LoadBalanced;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;
/**
 * RestTemplate配置类
 */
@Configuration
public class RestTemplateConfig {
    /**
     * 配置RestTemplate,支持负载均衡
     * @LoadBalanced注解启用负载均衡,可以直接使用服务名调用
     */
    @Bean
    @LoadBalanced
    public RestTemplate restTemplate() {
        return new RestTemplate();
    }
}
```

### 使用@LoadBalanced的RestTemplate

配置了`@LoadBalanced`后,可以直接使用服务名调用:

```java
package com.example.consumer.controller;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestTemplate;
/**
 * 订单控制器
 * 使用@LoadBalanced的RestTemplate
 */
@Slf4j
@RestController
@RequestMapping("/api/order")
public class OrderController {
    private final RestTemplate restTemplate;
    public OrderController(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }
    /**
     * 直接使用服务名调用,Spring Cloud会自动进行负载均衡
     */
    @GetMapping("/user/{userId}")
    public String getUserInfo(@PathVariable Long userId) {
        // 直接使用服务名,不需要知道具体的IP和端口
        String url = "http://user-service/api/user/" + userId;
        log.info("调用服务: {}", url);
        return restTemplate.getForObject(url, String.class);
    }
}
```

## 场景三: 使用OpenFeign调用服务

### 应用场景

使用OpenFeign进行声明式服务调用,代码更简洁。

### 添加OpenFeign依赖

在服务消费者的pom.xml中添加:

```xml
<!-- Spring Cloud OpenFeign: 声明式HTTP客户端 -->
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-starter-openfeign</artifactId>
</dependency>
```

### 启用OpenFeign

在启动类上添加`@EnableFeignClients`注解:

```java
package com.example.consumer;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.openfeign.EnableFeignClients;
/**
 * 服务消费者启动类
 * @EnableFeignClients注解启用Feign客户端
 */
@SpringBootApplication
@EnableFeignClients  // 启用Feign客户端
public class ConsumerApplication {
    public static void main(String[] args) {
        SpringApplication.run(ConsumerApplication.class, args);
        System.out.println("服务消费者启动成功!");
    }
}
```

### 定义Feign客户端

```java
package com.example.consumer.feign;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
/**
 * 用户服务Feign客户端
 * @FeignClient注解定义Feign客户端,name指定服务名
 */
@FeignClient(name = "user-service")  // 服务名,对应Eureka中的服务名
public interface UserFeignClient {
    /**
     * 根据用户ID查询用户信息
     * 方法签名和提供者的接口保持一致
     */
    @GetMapping("/api/user/{userId}")
    String getUserInfo(@PathVariable("userId") Long userId);
}
```

### 使用Feign客户端

```java
package com.example.consumer.controller;
import com.example.consumer.feign.UserFeignClient;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
/**
 * 订单控制器
 * 使用Feign客户端调用服务
 */
@Slf4j
@RestController
@RequestMapping("/api/order")
public class OrderController {
    // 注入Feign客户端
    private final UserFeignClient userFeignClient;
    public OrderController(UserFeignClient userFeignClient) {
        this.userFeignClient = userFeignClient;
    }
    /**
     * 使用Feign客户端调用服务
     */
    @GetMapping("/user/{userId}")
    public String getUserInfo(@PathVariable Long userId) {
        log.info("调用用户服务,用户ID: {}", userId);
        // 直接调用,就像调用本地方法一样
        String userInfo = userFeignClient.getUserInfo(userId);
        log.info("调用结果: {}", userInfo);
        return userInfo;
    }
}
```

## 场景四: Eureka Server高可用

### 应用场景

生产环境需要Eureka Server高可用,避免单点故障。

### Eureka Server集群配置

#### Server 1配置(application-peer1.yml)

```yaml
server:
  port: 8761
spring:
  application:
    name: eureka-server
  profiles:
    active: peer1
eureka:
  instance:
    hostname: peer1  # 主机名
  client:
    register-with-eureka: true  # 集群模式下需要相互注册
    fetch-registry: true
    service-url:
      # 注册到其他Eureka Server节点
      defaultZone: http://peer2:8762/eureka/,http://peer3:8763/eureka/
  server:
    enable-self-preservation: true
```

#### Server 2配置(application-peer2.yml)

```yaml
server:
  port: 8762
spring:
  application:
    name: eureka-server
  profiles:
    active: peer2
eureka:
  instance:
    hostname: peer2
  client:
    register-with-eureka: true
    fetch-registry: true
    service-url:
      defaultZone: http://peer1:8761/eureka/,http://peer3:8763/eureka/
  server:
    enable-self-preservation: true
```

#### Server 3配置(application-peer3.yml)

```yaml
server:
  port: 8763
spring:
  application:
    name: eureka-server
  profiles:
    active: peer3
eureka:
  instance:
    hostname: peer3
  client:
    register-with-eureka: true
    fetch-registry: true
    service-url:
      defaultZone: http://peer1:8761/eureka/,http://peer2:8762/eureka/
  server:
    enable-self-preservation: true
```

### 客户端配置

客户端需要配置所有Eureka Server节点:

```yaml
eureka:
  client:
    service-url:
      # 配置多个Eureka Server节点
      defaultZone: http://peer1:8761/eureka/,http://peer2:8762/eureka/,http://peer3:8763/eureka/
```

## 场景五: Eureka自我保护模式

### 应用场景

当网络分区故障时,Eureka Server进入自我保护模式,保护服务注册信息不被删除。

### 自我保护模式说明

1. **触发条件**: 当Eureka Server在短时间内丢失过多客户端时,会进入自我保护模式
2. **保护机制**: 在自我保护模式下,Eureka Server不会删除服务注册信息,即使服务实例没有发送心跳
3. **退出条件**: 当心跳续约比例恢复到阈值以上时,会自动退出自我保护模式

### 配置自我保护模式

```yaml
eureka:
  server:
    # 是否启用自我保护模式,默认true
    enable-self-preservation: true
    # 自我保护模式阈值,默认0.85,即85%的服务实例心跳正常
    renewal-percent-threshold: 0.85
    # 清理间隔(毫秒),默认60秒
    eviction-interval-timer-in-ms: 60000
```

### 开发环境禁用自我保护模式

开发环境可以禁用自我保护模式,方便测试:

```yaml
eureka:
  server:
    enable-self-preservation: false  # 禁用自我保护模式
    eviction-interval-timer-in-ms: 10000  # 缩短清理间隔
```

## 场景六: 服务实例元数据

### 应用场景

你的服务需要传递额外的元数据信息,比如版本号、环境信息等。

### 配置服务实例元数据

```yaml
eureka:
  instance:
    prefer-ip-address: true
    instance-id: ${spring.application.name}:${server.port}
    # 配置元数据
    metadata-map:
      version: 1.0.0  # 版本号
      environment: dev  # 环境
      zone: zone1  # 区域
```

### 获取服务实例元数据

```java
package com.example.consumer.controller;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cloud.client.ServiceInstance;
import org.springframework.cloud.client.discovery.DiscoveryClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.List;
import java.util.Map;
/**
 * 服务发现控制器
 * 演示如何获取服务实例元数据
 */
@Slf4j
@RestController
@RequestMapping("/api/discovery")
public class DiscoveryController {
    private final DiscoveryClient discoveryClient;
    public DiscoveryController(DiscoveryClient discoveryClient) {
        this.discoveryClient = discoveryClient;
    }
    /**
     * 获取服务实例列表和元数据
     */
    @GetMapping("/instances")
    public String getInstances() {
        List<ServiceInstance> instances = discoveryClient.getInstances("user-service");
        StringBuilder result = new StringBuilder();
        for (ServiceInstance instance : instances) {
            result.append("服务实例: ").append(instance.getInstanceId()).append("\n");
            result.append("主机: ").append(instance.getHost()).append("\n");
            result.append("端口: ").append(instance.getPort()).append("\n");
            // 获取元数据
            Map<String, String> metadata = instance.getMetadata();
            result.append("元数据: ").append(metadata).append("\n");
            result.append("---\n");
        }
        return result.toString();
    }
}
```

## 场景七: 健康检查配置

### 应用场景

你的服务需要自定义健康检查逻辑,确保Eureka Server能正确判断服务状态。

### 配置健康检查

```yaml
eureka:
  instance:
    # 健康检查URL路径
    health-check-url-path: /actuator/health
    # 健康检查URL,完整URL
    health-check-url: http://localhost:8081/actuator/health
    # 状态页URL
    status-page-url: http://localhost:8081/actuator/info
```

### 自定义健康检查

```java
package com.example.provider.config;
import org.springframework.boot.actuate.health.Health;
import org.springframework.boot.actuate.health.HealthIndicator;
import org.springframework.stereotype.Component;
/**
 * 自定义健康检查
 * 实现HealthIndicator接口,自定义健康检查逻辑
 */
@Component
public class CustomHealthIndicator implements HealthIndicator {
    @Override
    public Health health() {
        // 自定义健康检查逻辑
        // 比如检查数据库连接、外部服务等
        boolean isHealthy = checkHealth();
        if (isHealthy) {
            return Health.up()
                .withDetail("status", "服务正常")
                .withDetail("timestamp", System.currentTimeMillis())
                .build();
        } else {
            return Health.down()
                .withDetail("status", "服务异常")
                .withDetail("error", "健康检查失败")
                .build();
        }
    }
    /**
     * 检查服务健康状态
     */
    private boolean checkHealth() {
        // 实现健康检查逻辑
        // 比如检查数据库连接、外部服务等
        return true;
    }
}
```

## 最佳实践

### 1. 服务命名规范

- 使用小写字母和连字符,比如`user-service`、`order-service`
- 避免使用下划线和特殊字符
- 服务名要有意义,能清楚表达服务的功能

### 2. 心跳配置建议

- 心跳间隔建议30秒,不要太短也不要太长
- 心跳超时时间建议90秒,是心跳间隔的3倍
- 根据实际网络情况调整心跳参数

### 3. 自我保护模式建议

- 生产环境建议启用自我保护模式
- 开发环境可以禁用自我保护模式,方便测试
- 定期检查自我保护模式状态,确保服务正常

### 4. 高可用建议

- 生产环境建议使用Eureka Server集群,至少3个节点
- 客户端配置所有Eureka Server节点,提高可用性
- 定期检查Eureka Server集群状态

### 5. 监控和运维建议

- 使用Eureka控制台监控服务状态
- 配置告警,及时发现服务异常
- 定期检查服务注册情况,确保服务正常注册

### 6. 迁移建议

虽然Eureka已经进入维护模式,但很多项目还在使用;如果考虑迁移,建议迁移到Nacos,功能更全面、性能更好、维护更活跃。

## 总结

Spring Boot 4整合Eureka确实方便,服务注册与发现、负载均衡、高可用一应俱全,用起来贼简单;但是要真正用好Eureka,还得掌握服务注册、服务发现、负载均衡、高可用、自我保护模式这些高级功能;虽然Eureka已经进入维护模式,但很多项目还在使用,所以掌握Eureka还是很有必要的;鹏磊今天给兄弟们掰扯了Eureka的基础概念、Server搭建、各种场景、最佳实践,希望能帮到兄弟们;如果还有啥不明白的,可以看看Eureka的官方文档,或者给鹏磊留言,咱一起探讨。
