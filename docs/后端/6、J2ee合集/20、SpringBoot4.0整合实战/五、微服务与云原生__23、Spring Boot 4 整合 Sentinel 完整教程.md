# 23、Spring Boot 4 整合 Sentinel 完整教程
- 来源：https://ddkk.com/springboot/4-action/23.html
- 分类：Spring Boot 4 整合教程
- 分组：五、微服务与云原生
- 日期：2025-12-08
做微服务项目的时候,最烦的就是服务限流和熔断,高并发场景下服务扛不住,直接崩了;用Hystrix吧,已经停止维护了;用Resilience4j吧,配置复杂;后来听说阿里巴巴开源的Sentinel这玩意儿不错,流量控制、熔断降级、系统保护、热点限流一应俱全,而且还是生产级方案,性能高、功能全;但是直接用Sentinel客户端写,那叫一个复杂,规则配置、资源定义、异常处理、Dashboard集成,一堆代码写得人头疼;后来发现Spring Cloud Alibaba直接把这些都封装好了,用起来贼简单;现在Spring Boot 4出来了,整合Sentinel更是方便得不行,自动配置给你整得明明白白,咱今天就聊聊Spring Boot 4咋整合Sentinel的。

其实Sentinel在Spring Boot里早就支持了,你只要加个`spring-cloud-starter-alibaba-sentinel`依赖,配合Sentinel Dashboard,基本上就能用;但是很多兄弟不知道里面的门道,也不知道咋用流量控制、熔断降级、系统保护、热点限流、授权规则这些高级功能,更不知道咋和OpenFeign、Spring Cloud Gateway无缝集成,所以鹏磊今天就给兄弟们掰扯掰扯。

## Sentinel基础概念

### Sentinel是啥玩意儿

Sentinel是阿里巴巴开源的一个面向分布式服务架构的轻量级流量控制框架,主要以流量为切入点,从流量控制、熔断降级、系统负载保护等多个维度保护服务的稳定性;Sentinel的核心特点包括:

1. **流量控制**: 支持QPS限流、并发线程数限流、关联限流、链路限流等多种限流策略
2. **熔断降级**: 支持慢调用比例、异常比例、异常数等多种熔断策略
3. **系统保护**: 支持系统负载、CPU使用率、平均响应时间、并发线程数等系统指标保护
4. **热点参数限流**: 支持对热点参数进行限流,比如对某个用户ID、商品ID进行限流
5. **授权规则**: 支持黑白名单控制,可以限制某些来源的访问
6. **实时监控**: 提供实时监控和控制台,可以实时查看流量、规则、机器等信息

### Sentinel的核心概念

1. **资源(Resource)**: Sentinel中的资源可以是任何东西,比如一个方法、一个接口、一个URL等,资源是Sentinel进行流量控制的基本单位
2. **规则(Rule)**: 流量控制规则、熔断降级规则、系统保护规则等,规则定义了资源的保护策略
3. **流量控制(Flow Control)**: 通过限制资源的QPS或并发线程数,防止系统被突发流量冲垮
4. **熔断降级(Circuit Breaking)**: 当资源调用失败率或响应时间超过阈值时,自动熔断,避免级联故障
5. **系统保护(System Protection)**: 当系统负载、CPU使用率等指标超过阈值时,自动保护系统
6. **热点参数限流(Hotspot Parameter Flow Control)**: 对热点参数进行限流,比如对某个用户ID进行限流
7. **授权规则(Authority Rule)**: 黑白名单控制,限制某些来源的访问

### Sentinel和Hystrix的区别

1. **维护状态**: Sentinel是阿里巴巴维护,活跃度高;Hystrix已经停止维护
2. **功能**: Sentinel功能更全面,支持流量控制、熔断降级、系统保护、热点限流等;Hystrix主要支持熔断降级
3. **性能**: Sentinel性能更好,基于滑动窗口算法,延迟更低
4. **规则配置**: Sentinel支持动态规则配置,可以通过Dashboard实时配置;Hystrix规则配置相对固定
5. **扩展性**: Sentinel扩展性更好,支持自定义规则、自定义异常处理等

## Sentinel Dashboard安装和启动

### 下载Sentinel Dashboard

从Sentinel官网下载最新版本: https://github.com/alibaba/Sentinel/releases

```bash
# 下载Sentinel Dashboard JAR包
wget https://github.com/alibaba/Sentinel/releases/download/1.8.6/sentinel-dashboard-1.8.6.jar
# 或者使用Maven下载
mvn dependency:get -Dartifact=com.alibaba.csp:sentinel-dashboard:1.8.6
```

### 启动Sentinel Dashboard

```bash
# 启动Sentinel Dashboard(默认端口8080)
java -Dserver.port=8080 -Dcsp.sentinel.dashboard.server=localhost:8080 -Dproject.name=sentinel-dashboard -jar sentinel-dashboard-1.8.6.jar
# 或者指定其他端口
java -Dserver.port=8848 -Dcsp.sentinel.dashboard.server=localhost:8848 -Dproject.name=sentinel-dashboard -jar sentinel-dashboard-1.8.6.jar
```

启动成功后,访问 http://localhost:8080,默认用户名密码都是`sentinel`。

### Sentinel Dashboard功能

1. **实时监控**: 查看应用的实时QPS、响应时间、异常数等指标
2. **规则管理**: 配置流量控制规则、熔断降级规则、系统保护规则等
3. **机器列表**: 查看注册到Sentinel的应用机器列表
4. **规则推送**: 将规则推送到应用,支持Nacos、Apollo等配置中心

## 项目搭建和依赖配置

### 创建Maven项目

首先你得有个Maven项目,用IDEA或者Eclipse都行,或者直接用Spring Initializr生成;项目结构大概是这样:

```plaintext
spring-boot-sentinel-demo/
├── pom.xml                          # Maven配置文件
├── src/
│   ├── main/
│   │   ├── java/
│   │   │   └── com/
│   │   │       └── example/
│   │   │           └── demo/
│   │   │               ├── Application.java          # 启动类
│   │   │               ├── controller/               # 控制器目录
│   │   │               │   ├── OrderController.java  # 订单控制器
│   │   │               │   └── UserController.java   # 用户控制器
│   │   │               ├── service/                  # 服务层目录
│   │   │               │   ├── OrderService.java    # 订单服务
│   │   │               │   └── UserService.java     # 用户服务
│   │   │               ├── feign/                    # Feign客户端目录
│   │   │               │   └── OrderFeignClient.java # 订单服务Feign客户端
│   │   │               ├── handler/                  # 异常处理目录
│   │   │               │   └── SentinelExceptionHandler.java  # Sentinel异常处理器
│   │   │               └── config/                    # 配置类目录
│   │   │                   └── SentinelConfig.java   # Sentinel配置类
│   │   └── resources/
│   │       ├── application.yml                       # 配置文件
│   └── test/
│       └── java/                                     # 测试代码目录
```

### pom.xml完整配置

这是最关键的,依赖配置不对后面全是坑;Spring Boot 4需要Java 17以上,而且Spring Cloud Alibaba版本要选对。

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
    <artifactId>spring-boot-sentinel-demo</artifactId>
    <version>1.0.0</version>
    <packaging>jar</packaging>
    <name>Spring Boot 4 Sentinel Demo</name>
    <description>Spring Boot 4整合Sentinel示例项目</description>
    <properties>
        <java.version>17</java.version>  <!-- Java 17以上 -->
        <maven.compiler.source>17</maven.compiler.source>
        <maven.compiler.target>17</maven.compiler.target>
        <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
        <spring-cloud.version>2023.0.0</spring-cloud.version>  <!-- Spring Cloud版本 -->
        <spring-cloud-alibaba.version>2022.0.0.0</spring-cloud-alibaba.version>  <!-- Spring Cloud Alibaba版本 -->
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
            <!-- Spring Cloud Alibaba依赖管理 -->
            <dependency>
                <groupId>com.alibaba.cloud</groupId>
                <artifactId>spring-cloud-alibaba-dependencies</artifactId>
                <version>${spring-cloud-alibaba.version}</version>
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
        <!-- Sentinel Starter: Sentinel流量控制框架 -->
        <dependency>
            <groupId>com.alibaba.cloud</groupId>
            <artifactId>spring-cloud-starter-alibaba-sentinel</artifactId>
        </dependency>
        <!-- Sentinel Web适配器: Spring MVC适配器 -->
        <dependency>
            <groupId>com.alibaba.csp</groupId>
            <artifactId>sentinel-spring-webmvc-adapter</artifactId>
        </dependency>
        <!-- Sentinel注解支持: @SentinelResource注解支持 -->
        <dependency>
            <groupId>com.alibaba.csp</groupId>
            <artifactId>sentinel-annotation-aspectj</artifactId>
        </dependency>
        <!-- Spring Cloud OpenFeign: 服务调用(可选,用于演示Feign集成) -->
        <dependency>
            <groupId>org.springframework.cloud</groupId>
            <artifactId>spring-cloud-starter-openfeign</artifactId>
        </dependency>
        <!-- Spring Boot Actuator: 监控和管理支持 -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-actuator</artifactId>
        </dependency>
        <!-- Spring Boot Validation: 参数校验 -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-validation</artifactId>
        </dependency>
        <!-- Lombok: 简化Java代码(可选,但强烈推荐) -->
        <dependency>
            <groupId>org.projectlombok</groupId>
            <artifactId>lombok</artifactId>
            <optional>true</optional>
        </dependency>
        <!-- Spring Boot Test: 测试支持 -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-test</artifactId>
            <scope>test</scope>
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

### application.yml配置

Sentinel的配置通过`spring.cloud.sentinel.*`属性控制,配置起来贼简单:

```yaml
spring:
  application:
    name: spring-boot-sentinel-demo  # 应用名称
  cloud:
    sentinel:
      # 是否启用Sentinel,默认true
      enabled: true
      # Sentinel Dashboard地址
      transport:
        dashboard: localhost:8080  # Dashboard地址
        port: 8719  # 客户端与控制台通信的端口,默认8719
        heartbeat-interval-ms: 500  # 心跳间隔(毫秒)
      # Web适配器配置
      web:
        # 是否启用Web适配器,默认true
        enabled: true
        # 是否启用URL清洗,默认false
        url-cleaner-enabled: false
        # 是否启用HTTP方法前缀,默认false
        http-method-specify: false
      # 过滤器配置
      filter:
        # 是否启用过滤器,默认true
        enabled: true
        # URL匹配模式,默认/*
        url-patterns: /**
        # 过滤器顺序,默认-2147483648
        order: -2147483648
      # 流控规则数据源配置(可选,支持Nacos、Apollo等)
      datasource:
        # 流控规则数据源
        flow:
          nacos:
            server-addr: localhost:8848
            dataId: ${spring.application.name}-flow-rules
            groupId: SENTINEL_GROUP
            rule-type: flow
        # 降级规则数据源
        degrade:
          nacos:
            server-addr: localhost:8848
            dataId: ${spring.application.name}-degrade-rules
            groupId: SENTINEL_GROUP
            rule-type: degrade
        # 系统规则数据源
        system:
          nacos:
            server-addr: localhost:8848
            dataId: ${spring.application.name}-system-rules
            groupId: SENTINEL_GROUP
            rule-type: system
        # 授权规则数据源
        authority:
          nacos:
            server-addr: localhost:8848
            dataId: ${spring.application.name}-authority-rules
            groupId: SENTINEL_GROUP
            rule-type: authority
        # 热点参数规则数据源
        param-flow:
          nacos:
            server-addr: localhost:8848
            dataId: ${spring.application.name}-param-flow-rules
            groupId: SENTINEL_GROUP
            rule-type: param-flow
# Feign Sentinel集成配置
feign:
  sentinel:
    enabled: true  # 启用Feign Sentinel集成
# Actuator配置
management:
  endpoints:
    web:
      exposure:
        include: health,info,sentinel  # 暴露Sentinel端点
  endpoint:
    sentinel:
      enabled: true  # 启用Sentinel端点
# 日志配置
logging:
  level:
    com.alibaba.csp.sentinel: DEBUG  # Sentinel日志级别
    com.example.demo: DEBUG
```

### 启动类配置

启动类需要添加`@EnableFeignClients`注解(如果使用Feign):

```java
package com.example.demo;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.openfeign.EnableFeignClients;
/**
 * Spring Boot 4 Sentinel应用启动类
 * @EnableFeignClients注解启用Feign客户端(如果使用Feign)
 */
@SpringBootApplication
@EnableFeignClients  // 启用Feign客户端
public class Application {
    public static void main(String[] args) {
        SpringApplication.run(Application.class, args);
        System.out.println("Spring Boot 4 Sentinel应用启动成功!");
    }
}
```

## 场景一: 基础流量控制 - QPS限流

### 应用场景

你的接口需要限制QPS,防止被突发流量冲垮,比如秒杀接口、支付接口等,这是最常见的场景。

### 使用@SentinelResource注解

在方法上使用`@SentinelResource`注解定义资源:

```java
package com.example.demo.controller;
import com.alibaba.csp.sentinel.annotation.SentinelResource;
import com.alibaba.csp.sentinel.slots.block.BlockException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
/**
 * 订单控制器
 * 演示Sentinel流量控制
 */
@Slf4j
@RestController
@RequestMapping("/api/order")
public class OrderController {
    /**
     * 查询订单
     * @SentinelResource注解定义资源,value是资源名称,blockHandler是限流处理方法
     * @param orderId 订单ID
     * @return 订单信息
     */
    @GetMapping("/{orderId}")
    @SentinelResource(
        value = "getOrder",  // 资源名称,在Dashboard中配置规则时使用
        blockHandler = "getOrderBlockHandler",  // 限流处理方法
        fallback = "getOrderFallback"  // 降级处理方法(可选)
    )
    public String getOrder(@PathVariable Long orderId) {
        log.info("查询订单,订单ID: {}", orderId);
        // 模拟业务逻辑
        return "订单信息: " + orderId;
    }
    /**
     * 限流处理方法
     * 当QPS超过阈值时,会调用这个方法
     * 注意: 方法签名必须和原方法一致,最后一个参数必须是BlockException
     */
    public String getOrderBlockHandler(Long orderId, BlockException ex) {
        log.warn("订单查询被限流,订单ID: {}, 异常: {}", orderId, ex.getMessage());
        return "订单查询被限流,请稍后重试";
    }
    /**
     * 降级处理方法
     * 当方法抛出异常时,会调用这个方法
     * 注意: 方法签名必须和原方法一致,最后一个参数必须是Throwable
     */
    public String getOrderFallback(Long orderId, Throwable ex) {
        log.error("订单查询异常,订单ID: {}, 异常: {}", orderId, ex.getMessage());
        return "订单查询异常,请稍后重试";
    }
}
```

### 在Dashboard中配置流控规则

1. 启动应用后,访问 http://localhost:8080 登录Sentinel Dashboard
2. 在左侧菜单选择"流控规则",点击"新增流控规则"
3. 配置规则:

- **资源名**: `getOrder`(对应@SentinelResource的value)
- **阈值类型**: QPS
- **单机阈值**: 10(每秒最多10个请求)
- **流控模式**: 直接
- **流控效果**: 快速失败
4. 点击"新增"保存规则

### 测试流控

使用JMeter或curl测试:

```bash
# 快速发送请求,测试限流
for i in {1..20}; do
  curl http://localhost:8080/api/order/1
  echo ""
done
```

当QPS超过10时,会返回"订单查询被限流,请稍后重试"。

## 场景二: 并发线程数限流

### 应用场景

你的接口需要限制并发线程数,防止线程池耗尽,比如数据库查询接口、文件上传接口等。

### 实现并发线程数限流

```java
package com.example.demo.controller;
import com.alibaba.csp.sentinel.annotation.SentinelResource;
import com.alibaba.csp.sentinel.slots.block.BlockException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
/**
 * 用户控制器
 * 演示并发线程数限流
 */
@Slf4j
@RestController
@RequestMapping("/api/user")
public class UserController {
    /**
     * 查询用户信息
     * 限制并发线程数为5
     */
    @GetMapping("/info")
    @SentinelResource(
        value = "getUserInfo",
        blockHandler = "getUserInfoBlockHandler"
    )
    public String getUserInfo() {
        log.info("查询用户信息,线程: {}", Thread.currentThread().getName());
        // 模拟耗时操作
        try {
            Thread.sleep(1000);  // 休眠1秒,模拟业务处理
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
        return "用户信息";
    }
    /**
     * 限流处理方法
     */
    public String getUserInfoBlockHandler(BlockException ex) {
        log.warn("用户查询被限流,异常: {}", ex.getMessage());
        return "用户查询被限流,请稍后重试";
    }
}
```

### 在Dashboard中配置并发线程数限流规则

1. 在Dashboard中选择"流控规则",点击"新增流控规则"
2. 配置规则:

- **资源名**: `getUserInfo`
- **阈值类型**: 线程数
- **单机阈值**: 5(最多5个并发线程)
- **流控模式**: 直接
- **流控效果**: 快速失败
3. 点击"新增"保存规则

## 场景三: 关联限流

### 应用场景

你的两个接口有关联关系,比如读接口和写接口,当写接口QPS高时,需要限制读接口的QPS。

### 实现关联限流

```java
package com.example.demo.controller;
import com.alibaba.csp.sentinel.annotation.SentinelResource;
import com.alibaba.csp.sentinel.slots.block.BlockException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
/**
 * 商品控制器
 * 演示关联限流
 */
@Slf4j
@RestController
@RequestMapping("/api/product")
public class ProductController {
    /**
     * 查询商品(读接口)
     * 当写接口QPS高时,限制读接口的QPS
     */
    @GetMapping("/{id}")
    @SentinelResource(
        value = "getProduct",
        blockHandler = "getProductBlockHandler"
    )
    public String getProduct(@PathVariable Long id) {
        log.info("查询商品,商品ID: {}", id);
        return "商品信息: " + id;
    }
    /**
     * 更新商品(写接口)
     * 当这个接口QPS高时,会触发读接口的限流
     */
    @PostMapping("/{id}")
    @SentinelResource(
        value = "updateProduct",
        blockHandler = "updateProductBlockHandler"
    )
    public String updateProduct(@PathVariable Long id) {
        log.info("更新商品,商品ID: {}", id);
        return "更新成功: " + id;
    }
    /**
     * 限流处理方法
     */
    public String getProductBlockHandler(Long id, BlockException ex) {
        log.warn("商品查询被限流,商品ID: {}, 异常: {}", id, ex.getMessage());
        return "商品查询被限流,请稍后重试";
    }
    /**
     * 限流处理方法
     */
    public String updateProductBlockHandler(Long id, BlockException ex) {
        log.warn("商品更新被限流,商品ID: {}, 异常: {}", id, ex.getMessage());
        return "商品更新被限流,请稍后重试";
    }
}
```

### 在Dashboard中配置关联限流规则

1. 在Dashboard中选择"流控规则",点击"新增流控规则"
2. 配置规则:

- **资源名**: `getProduct`(读接口)
- **阈值类型**: QPS
- **单机阈值**: 10
- **流控模式**: 关联
- **关联资源**: `updateProduct`(写接口)
- **流控效果**: 快速失败
3. 点击"新增"保存规则

当`updateProduct`接口的QPS超过10时,`getProduct`接口会被限流。

## 场景四: 熔断降级

### 应用场景

你的接口调用可能失败,需要熔断降级,避免级联故障,比如调用外部服务、数据库查询等。

### 实现熔断降级

```java
package com.example.demo.service;
import com.alibaba.csp.sentinel.annotation.SentinelResource;
import com.alibaba.csp.sentinel.slots.block.BlockException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
/**
 * 订单服务
 * 演示熔断降级
 */
@Slf4j
@Service
public class OrderService {
    /**
     * 创建订单
     * 演示慢调用比例熔断
     */
    @SentinelResource(
        value = "createOrder",
        blockHandler = "createOrderBlockHandler",
        fallback = "createOrderFallback"
    )
    public String createOrder(Long userId, Double amount) {
        log.info("创建订单,用户ID: {}, 金额: {}", userId, amount);
        // 模拟慢调用(响应时间超过500ms)
        try {
            Thread.sleep(600);  // 休眠600ms,模拟慢调用
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
        // 模拟异常(随机抛出异常)
        if (Math.random() > 0.8) {
            throw new RuntimeException("创建订单失败");
        }
        return "订单创建成功,订单ID: " + System.currentTimeMillis();
    }
    /**
     * 限流处理方法
     */
    public String createOrderBlockHandler(Long userId, Double amount, BlockException ex) {
        log.warn("创建订单被限流,用户ID: {}, 金额: {}, 异常: {}", userId, amount, ex.getMessage());
        return "创建订单被限流,请稍后重试";
    }
    /**
     * 降级处理方法
     */
    public String createOrderFallback(Long userId, Double amount, Throwable ex) {
        log.error("创建订单异常,用户ID: {}, 金额: {}, 异常: {}", userId, amount, ex.getMessage());
        return "创建订单异常,请稍后重试";
    }
}
```

### 在Dashboard中配置降级规则

1. 在Dashboard中选择"降级规则",点击"新增降级规则"
2. 配置规则:

- **资源名**: `createOrder`
- **降级策略**: 慢调用比例
- **最大RT(毫秒)**: 500(响应时间超过500ms算慢调用)
- **比例阈值**: 0.5(慢调用比例超过50%触发熔断)
- **熔断时长(秒)**: 10(熔断10秒后尝试恢复)
- **最小请求数**: 5(至少5个请求才统计)
- **统计时长(毫秒)**: 10000(统计窗口10秒)
3. 点击"新增"保存规则

当慢调用比例超过50%时,会触发熔断,10秒内直接返回降级结果。

## 场景五: 热点参数限流

### 应用场景

你的接口需要对热点参数进行限流,比如对某个用户ID、商品ID进行限流,防止某个热点参数导致系统压力过大。

### 实现热点参数限流

```java
package com.example.demo.controller;
import com.alibaba.csp.sentinel.annotation.SentinelResource;
import com.alibaba.csp.sentinel.slots.block.BlockException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
/**
 * 商品控制器
 * 演示热点参数限流
 */
@Slf4j
@RestController
@RequestMapping("/api/product")
public class ProductController {
    /**
     * 查询商品详情
     * 对商品ID进行热点参数限流
     */
    @GetMapping("/detail/{productId}")
    @SentinelResource(
        value = "getProductDetail",
        blockHandler = "getProductDetailBlockHandler"
    )
    public String getProductDetail(
        @PathVariable Long productId,
        @RequestParam(required = false) Long userId
    ) {
        log.info("查询商品详情,商品ID: {}, 用户ID: {}", productId, userId);
        return "商品详情: " + productId;
    }
    /**
     * 限流处理方法
     */
    public String getProductDetailBlockHandler(
        Long productId,
        Long userId,
        BlockException ex
    ) {
        log.warn("商品查询被限流,商品ID: {}, 用户ID: {}, 异常: {}", productId, userId, ex.getMessage());
        return "商品查询被限流,请稍后重试";
    }
}
```

### 在Dashboard中配置热点参数限流规则

1. 在Dashboard中选择"热点规则",点击"新增热点规则"
2. 配置规则:

- **资源名**: `getProductDetail`
- **参数索引**: 0(第一个参数,即productId)
- **单机阈值**: 10(该参数的QPS阈值)
- **统计窗口时长(秒)**: 1
- **参数例外项**: 可以配置特定参数值的限流阈值,比如商品ID=1001时,阈值设为5
3. 点击"新增"保存规则

## 场景六: 系统保护

### 应用场景

你的系统需要保护,当系统负载、CPU使用率等指标超过阈值时,自动限流,保护系统稳定性。

### 在Dashboard中配置系统规则

1. 在Dashboard中选择"系统规则",点击"新增系统规则"
2. 配置规则:

- **系统负载**: 当系统负载超过阈值时触发保护(可选)
- **CPU使用率**: 当CPU使用率超过阈值时触发保护(可选)
- **平均响应时间**: 当平均响应时间超过阈值时触发保护(可选)
- **并发线程数**: 当并发线程数超过阈值时触发保护(可选)
- **入口QPS**: 当入口QPS超过阈值时触发保护(可选)
3. 点击"新增"保存规则

## 场景七: 授权规则

### 应用场景

你的接口需要黑白名单控制,限制某些来源的访问,比如限制某些IP、某些服务的访问。

### 实现授权规则

```java
package com.example.demo.controller;
import com.alibaba.csp.sentinel.annotation.SentinelResource;
import com.alibaba.csp.sentinel.slots.block.BlockException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
/**
 * 管理员控制器
 * 演示授权规则
 */
@Slf4j
@RestController
@RequestMapping("/api/admin")
public class AdminController {
    /**
     * 管理员接口
     * 只允许特定来源访问
     */
    @GetMapping("/info")
    @SentinelResource(
        value = "getAdminInfo",
        blockHandler = "getAdminInfoBlockHandler"
    )
    public String getAdminInfo() {
        log.info("查询管理员信息");
        return "管理员信息";
    }
    /**
     * 限流处理方法
     */
    public String getAdminInfoBlockHandler(BlockException ex) {
        log.warn("管理员查询被限流,异常: {}", ex.getMessage());
        return "管理员查询被限流,请稍后重试";
    }
}
```

### 在Dashboard中配置授权规则

1. 在Dashboard中选择"授权规则",点击"新增授权规则"
2. 配置规则:

- **资源名**: `getAdminInfo`
- **流控应用**: 可以配置白名单或黑名单
- **白名单**: 只允许列表中的应用访问
- **黑名单**: 不允许列表中的应用访问
3. 点击"新增"保存规则

## 场景八: 与OpenFeign集成

### 应用场景

你的服务需要调用其他服务,需要集成Sentinel进行流量控制和熔断降级。

### 配置Feign Sentinel集成

在`application.yml`中启用Feign Sentinel集成:

```yaml
feign:
  sentinel:
    enabled: true  # 启用Feign Sentinel集成
```

### 定义Feign客户端

```java
package com.example.demo.feign;
import com.example.demo.feign.fallback.OrderFeignClientFallback;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
/**
 * 订单服务Feign客户端
 * fallback指定降级处理类
 */
@FeignClient(
    name = "order-service",
    url = "http://localhost:8081",
    fallback = OrderFeignClientFallback.class
)
public interface OrderFeignClient {
    /**
     * 查询订单
     */
    @GetMapping("/api/order/{orderId}")
    String getOrder(@PathVariable("orderId") Long orderId);
}
```

### 实现降级处理类

```java
package com.example.demo.feign.fallback;
import com.example.demo.feign.OrderFeignClient;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
/**
 * 订单服务Feign客户端降级处理类
 * 当服务不可用时,返回降级结果
 */
@Slf4j
@Component
public class OrderFeignClientFallback implements OrderFeignClient {
    @Override
    public String getOrder(Long orderId) {
        log.warn("订单服务不可用,返回降级结果,订单ID: {}", orderId);
        return "订单服务不可用,请稍后重试";
    }
}
```

## 场景九: 自定义异常处理

### 应用场景

你的应用需要自定义Sentinel异常处理,返回统一的错误格式。

### 实现自定义异常处理器

```java
package com.example.demo.handler;
import com.alibaba.csp.sentinel.slots.block.BlockException;
import com.alibaba.csp.sentinel.slots.block.authority.AuthorityException;
import com.alibaba.csp.sentinel.slots.block.degrade.DegradeException;
import com.alibaba.csp.sentinel.slots.block.flow.FlowException;
import com.alibaba.csp.sentinel.slots.block.flow.param.ParamFlowException;
import com.alibaba.csp.sentinel.slots.system.SystemBlockException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import java.util.HashMap;
import java.util.Map;
/**
 * Sentinel异常处理器
 * 统一处理Sentinel的各种异常
 */
@Slf4j
@RestControllerAdvice
public class SentinelExceptionHandler {
    /**
     * 处理流量控制异常
     */
    @ExceptionHandler(FlowException.class)
    public Map<String, Object> handleFlowException(FlowException ex) {
        log.warn("流量控制异常: {}", ex.getMessage());
        Map<String, Object> result = new HashMap<>();
        result.put("code", 429);
        result.put("message", "请求过于频繁,请稍后重试");
        result.put("data", null);
        return result;
    }
    /**
     * 处理熔断降级异常
     */
    @ExceptionHandler(DegradeException.class)
    public Map<String, Object> handleDegradeException(DegradeException ex) {
        log.warn("熔断降级异常: {}", ex.getMessage());
        Map<String, Object> result = new HashMap<>();
        result.put("code", 503);
        result.put("message", "服务暂时不可用,请稍后重试");
        result.put("data", null);
        return result;
    }
    /**
     * 处理系统保护异常
     */
    @ExceptionHandler(SystemBlockException.class)
    public Map<String, Object> handleSystemBlockException(SystemBlockException ex) {
        log.warn("系统保护异常: {}", ex.getMessage());
        Map<String, Object> result = new HashMap<>();
        result.put("code", 503);
        result.put("message", "系统负载过高,请稍后重试");
        result.put("data", null);
        return result;
    }
    /**
     * 处理授权异常
     */
    @ExceptionHandler(AuthorityException.class)
    public Map<String, Object> handleAuthorityException(AuthorityException ex) {
        log.warn("授权异常: {}", ex.getMessage());
        Map<String, Object> result = new HashMap<>();
        result.put("code", 403);
        result.put("message", "无权限访问");
        result.put("data", null);
        return result;
    }
    /**
     * 处理热点参数限流异常
     */
    @ExceptionHandler(ParamFlowException.class)
    public Map<String, Object> handleParamFlowException(ParamFlowException ex) {
        log.warn("热点参数限流异常: {}", ex.getMessage());
        Map<String, Object> result = new HashMap<>();
        result.put("code", 429);
        result.put("message", "热点参数请求过于频繁,请稍后重试");
        result.put("data", null);
        return result;
    }
    /**
     * 处理其他BlockException
     */
    @ExceptionHandler(BlockException.class)
    public Map<String, Object> handleBlockException(BlockException ex) {
        log.warn("限流异常: {}", ex.getMessage());
        Map<String, Object> result = new HashMap<>();
        result.put("code", 429);
        result.put("message", "请求被限流,请稍后重试");
        result.put("data", null);
        return result;
    }
}
```

## 场景十: 配置Sentinel拦截器

### 应用场景

你的应用需要配置Sentinel拦截器,自动拦截所有HTTP请求进行流量控制。

### 配置Sentinel拦截器

```java
package com.example.demo.config;
import com.alibaba.csp.sentinel.adapter.spring.webmvc.SentinelWebInterceptor;
import com.alibaba.csp.sentinel.adapter.spring.webmvc.config.SentinelWebMvcConfig;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
/**
 * Sentinel配置类
 * 配置Sentinel拦截器
 */
@Slf4j
@Configuration
public class SentinelConfig implements WebMvcConfigurer {
    /**
     * 添加Sentinel拦截器
     * 自动拦截所有HTTP请求进行流量控制
     */
    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        // 创建Sentinel配置
        SentinelWebMvcConfig config = new SentinelWebMvcConfig();
        // 启用HTTP方法前缀,资源名会包含HTTP方法,比如GET:/api/order/{orderId}
        config.setHttpMethodSpecify(true);
        // 添加Sentinel拦截器
        registry.addInterceptor(new SentinelWebInterceptor(config))
            .addPathPatterns("/**");  // 拦截所有路径
        log.info("Sentinel拦截器配置完成");
    }
}
```

## 最佳实践

### 1. 规则配置建议

- **QPS限流**: 根据接口的实际QPS设置合理的阈值,一般设置为实际QPS的1.5-2倍
- **并发线程数限流**: 根据接口的响应时间和系统线程池大小设置合理的阈值
- **熔断降级**: 根据接口的响应时间设置合理的RT阈值,一般设置为P99响应时间的1.5倍
- **系统保护**: 根据系统实际负载设置合理的阈值,一般系统负载不超过CPU核心数

### 2. 资源命名规范

- 使用有意义的资源名,比如`getOrder`、`createOrder`等
- 避免使用URL作为资源名,使用业务含义的资源名
- 资源名要唯一,避免冲突

### 3. 异常处理建议

- 实现统一的异常处理器,返回统一的错误格式
- 记录详细的日志,方便排查问题
- 提供友好的错误提示,提升用户体验

### 4. 规则持久化

- 使用Nacos、Apollo等配置中心持久化规则
- 避免规则丢失,提高系统稳定性
- 支持规则动态更新,无需重启应用

### 5. 监控和告警

- 使用Sentinel Dashboard实时监控流量、规则、机器等信息
- 配置告警规则,及时发现问题
- 定期分析监控数据,优化规则配置

### 6. 性能优化

- 合理设置规则阈值,避免过度限流
- 使用热点参数限流,针对热点数据进行限流
- 使用系统保护,保护系统整体稳定性

## 总结

Spring Boot 4整合Sentinel确实方便,流量控制、熔断降级、系统保护、热点限流一应俱全,用起来贼爽;但是要真正用好Sentinel,还得掌握流量控制、熔断降级、系统保护、热点限流、授权规则这些高级功能;鹏磊今天给兄弟们掰扯了Sentinel的基础概念、Dashboard安装、项目搭建、各种场景、最佳实践,希望能帮到兄弟们;如果还有啥不明白的,可以看看Sentinel的官方文档,或者给鹏磊留言,咱一起探讨。
