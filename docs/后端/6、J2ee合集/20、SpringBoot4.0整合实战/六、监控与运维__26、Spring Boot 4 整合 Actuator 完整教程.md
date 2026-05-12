# 26、Spring Boot 4 整合 Actuator 完整教程
- 来源：https://ddkk.com/springboot/4-action/26.html
- 分类：Spring Boot 4 整合教程
- 分组：六、监控与运维
- 日期：2025-12-08
生产环境部署应用的时候,最头疼的就是监控和运维,应用跑得好不好、内存用多少、接口响应时间咋样,这些信息你咋知道?总不能每次都登录服务器看日志吧;而且出了问题咋排查,总不能每次都重启服务吧;后来听说Spring Boot Actuator这玩意儿不错,提供了生产就绪的监控和管理功能,健康检查、指标收集、环境信息、日志管理一应俱全,而且配置简单、功能强大;现在Spring Boot 4出来了,Actuator更是完善得不行,自动配置给你整得明明白白,咱今天就聊聊Spring Boot 4咋整合Actuator的。

其实Actuator在Spring Boot里早就支持了,你只要加个`spring-boot-starter-actuator`依赖,基本上就能用;但是很多兄弟不知道里面的门道,也不知道咋配置端点暴露、安全控制、自定义健康检查、指标收集这些高级功能,所以鹏磊今天就给兄弟们掰扯掰扯。

## Actuator基础概念

### Actuator是啥玩意儿

Spring Boot Actuator是Spring Boot提供的生产就绪特性,用于监控和管理应用程序;Actuator的核心功能包括:

1. **健康检查(Health)**: 检查应用程序及其组件的健康状态,比如数据库连接、磁盘空间等
2. **指标收集(Metrics)**: 收集应用程序的各种指标,比如JVM内存使用、HTTP请求统计、线程池状态等
3. **环境信息(Environment)**: 查看应用程序的配置属性、系统属性、环境变量等
4. **应用信息(Info)**: 显示应用程序的版本、构建信息、自定义信息等
5. **日志管理(Loggers)**: 动态查看和修改日志级别
6. **HTTP追踪(HTTP Exchanges)**: 记录和查看HTTP请求响应信息
7. **线程转储(Thread Dump)**: 获取线程堆栈信息,用于排查性能问题
8. **堆转储(Heap Dump)**: 生成JVM堆转储文件,用于内存分析

### Actuator的核心概念

1. **端点(Endpoint)**: Actuator提供的监控和管理功能,每个端点对应一个URL路径,比如`/actuator/health`、`/actuator/metrics`等
2. **端点暴露(Exposure)**: 控制哪些端点可以通过HTTP或JMX暴露,默认只暴露`health`和`info`端点
3. **端点安全(Security)**: 控制端点的访问权限,防止敏感信息泄露
4. **健康指示器(Health Indicator)**: 用于检查特定组件健康状态的组件,比如`DataSourceHealthIndicator`检查数据库连接
5. **指标(Metric)**: 应用程序运行时的各种度量数据,比如请求数、响应时间、内存使用等
6. **指标标签(Tag)**: 用于对指标进行分类和过滤,比如按HTTP状态码、URI等分类

### Actuator端点分类

Actuator端点分为两类:

1. **Web端点(Web Endpoints)**: 通过HTTP访问的端点,比如`/actuator/health`、`/actuator/metrics`等
2. **JMX端点(JMX Endpoints)**: 通过JMX访问的端点,用于Java管理扩展

## 项目搭建和依赖配置

### 创建Maven项目

首先你得有个Maven项目,用IDEA或者Eclipse都行,或者直接用Spring Initializr生成;项目结构大概是这样:

```plaintext
spring-boot-actuator-demo/
├── pom.xml                          # Maven配置文件
├── src/
│   ├── main/
│   │   ├── java/
│   │   │   └── com/
│   │   │       └── example/
│   │   │           └── demo/
│   │   │               ├── Application.java          # 启动类
│   │   │               ├── controller/               # 控制器目录
│   │   │               ├── service/                  # 服务层目录
│   │   │               ├── config/                   # 配置类目录
│   │   │               └── health/                   # 自定义健康检查目录
│   │   └── resources/
│   │       ├── application.yml                       # 配置文件
│   │       └── logback-spring.xml                    # 日志配置
│   └── test/
│       └── java/                                     # 测试代码目录
```

### pom.xml完整配置

这是最关键的,依赖配置不对后面全是坑;Spring Boot 4需要Java 17以上,而且Actuator版本会自动管理。

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
    <artifactId>spring-boot-actuator-demo</artifactId>
    <version>1.0.0</version>
    <packaging>jar</packaging>
    <name>Spring Boot 4 Actuator Demo</name>
    <description>Spring Boot 4整合Actuator示例项目</description>
    <properties>
        <java.version>17</java.version>  <!-- Java 17以上 -->
        <maven.compiler.source>17</maven.compiler.source>
        <maven.compiler.target>17</maven.compiler.target>
        <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
    </properties>
    <dependencies>
        <!-- Spring Boot Web Starter: 包含Spring MVC、Tomcat等 -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
        <!-- Actuator Starter: Actuator监控和管理功能 -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-actuator</artifactId>
        </dependency>
        <!-- Spring Boot Security: 安全控制(可选,用于保护端点) -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-security</artifactId>
        </dependency>
        <!-- Micrometer Prometheus: Prometheus指标导出(可选,用于指标收集) -->
        <dependency>
            <groupId>io.micrometer</groupId>
            <artifactId>micrometer-registry-prometheus</artifactId>
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

### application.yml完整配置

Actuator的配置都在`application.yml`中,这里给出完整的配置示例:

```yaml
# 服务器配置
server:
  port: 8080  # 服务端口
# Spring应用配置
spring:
  application:
    name: spring-boot-actuator-demo  # 应用名称
# Actuator配置
management:
  # 端点配置
  endpoints:
    # Web端点暴露配置
    web:
      # 暴露的端点列表,默认只暴露health和info
      exposure:
        include: "*"  # 暴露所有端点,生产环境建议只暴露必要的端点
        # include: health,info,metrics,prometheus  # 只暴露指定端点
        exclude: shutdown,env  # 排除敏感端点
      # 端点基础路径,默认/actuator
      base-path: /actuator
      # 端点路径映射,可以自定义端点路径
      path-mapping:
        health: healthcheck  # 将health端点映射到/actuator/healthcheck
      # CORS配置(跨域资源共享)
      cors:
        allowed-origins: "https://example.com"  # 允许的源
        allowed-methods: "GET,POST"  # 允许的HTTP方法
        allowed-headers: "*"  # 允许的请求头
        max-age: 3600  # 预检请求缓存时间(秒)
    # JMX端点暴露配置
    jmx:
      exposure:
        include: "*"  # 暴露所有JMX端点
        exclude:  # 排除的JMX端点
  # 端点详细配置
  endpoint:
    # Health端点配置
    health:
      enabled: true  # 是否启用health端点
      show-details: when-authorized  # 显示详细信息: always(总是),when-authorized(授权时),never(从不)
      show-components: always  # 显示组件详情
      probes:
        enabled: true  # 启用探针模式,用于Kubernetes等容器编排
    # Info端点配置
    info:
      enabled: true  # 是否启用info端点
    # Metrics端点配置
    metrics:
      enabled: true  # 是否启用metrics端点
    # Prometheus端点配置
    prometheus:
      enabled: true  # 是否启用prometheus端点
    # Loggers端点配置
    loggers:
      enabled: true  # 是否启用loggers端点
    # HTTP Exchanges端点配置
    httpexchanges:
      enabled: true  # 是否启用httpexchanges端点
      recording:
        enabled: true  # 是否启用HTTP交换记录
        max-size: 100  # 最大记录数
    # Shutdown端点配置(谨慎使用)
    shutdown:
      enabled: false  # 是否启用shutdown端点,生产环境建议关闭
  # 指标配置
  metrics:
    # 指标导出配置
    export:
      prometheus:
        enabled: true  # 启用Prometheus导出
        step: 10s  # 指标收集间隔
    # 指标标签配置
    tags:
      application: ${spring.application.name}  # 应用名称标签
      environment: dev  # 环境标签
    # 指标分发配置
    distribution:
      percentiles-histogram:
        http.server.requests: true  # 为HTTP请求启用百分位数直方图
      percentiles:
        http.server.requests: 0.5,0.9,0.95,0.99  # HTTP请求的百分位数
  # 健康检查配置
  health:
    # 默认健康检查配置
    defaults:
      enabled: true
    # 数据库健康检查配置
    db:
      enabled: true  # 启用数据库健康检查
    # 磁盘空间健康检查配置
    diskspace:
      enabled: true  # 启用磁盘空间检查
      threshold: 10GB  # 磁盘空间阈值
    # 慢健康指示器阈值
    logging:
      slow-indicator-threshold: 10s  # 健康指示器响应时间超过10秒会记录警告
  # 服务器配置(管理端口)
  server:
    port: 8081  # 管理端口,默认和主服务端口相同
    # address: 127.0.0.1  # 绑定到本地地址,限制远程访问
    ssl:
      enabled: false  # 是否启用SSL
      # key-store: classpath:management.jks  # SSL密钥库
      # key-password: secret  # SSL密钥库密码
# 应用信息配置(用于info端点)
info:
  app:
    name: ${spring.application.name}  # 应用名称
    version: 1.0.0  # 应用版本
    description: Spring Boot 4 Actuator示例应用  # 应用描述
  java:
    version: ${java.version}  # Java版本
  build:
    artifact: ${project.artifactId}  # 构建产物
    name: ${project.name}  # 构建名称
    version: ${project.version}  # 构建版本
```

## 启动类和基础Controller

### 启动类

```java
package com.example.demo;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
/**
 * Spring Boot 4 Actuator示例应用启动类
 * 
 * @author penglei
 */
@SpringBootApplication
public class Application {
    /**
     * 主方法,启动Spring Boot应用
     * 
     * @param args 命令行参数
     */
    public static void main(String[] args) {
        SpringApplication.run(Application.class, args);
    }
}
```

### 测试Controller

创建一个简单的Controller用于测试:

```java
package com.example.demo.controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.HashMap;
import java.util.Map;
/**
 * 测试Controller,用于验证应用是否正常运行
 * 
 * @author penglei
 */
@RestController
@RequestMapping("/api")
public class TestController {
    /**
     * 测试接口,返回简单的JSON响应
     * 
     * @return 包含消息的Map对象
     */
    @GetMapping("/test")
    public Map<String, Object> test() {
        Map<String, Object> result = new HashMap<>();
        result.put("message", "Hello, Spring Boot 4 Actuator!");
        result.put("timestamp", System.currentTimeMillis());
        return result;
    }
}
```

## Actuator端点详解

### Health端点

Health端点用于检查应用程序的健康状态,是最常用的端点之一。

#### 访问Health端点

```bash
# 访问health端点
curl http://localhost:8080/actuator/health
# 返回示例
{
  "status": "UP",
  "components": {
    "db": {
      "status": "UP",
      "details": {
        "database": "H2",
        "hello": 1
      }
    },
    "diskSpace": {
      "status": "UP",
      "details": {
        "total": 536870912000,
        "free": 200000000000,
        "threshold": 10485760
      }
    },
    "ping": {
      "status": "UP"
    }
  }
}
```

#### Health端点配置

```yaml
management:
  endpoint:
    health:
      enabled: true  # 启用health端点
      show-details: when-authorized  # 显示详细信息: always,when-authorized,never
      show-components: always  # 显示组件详情
      probes:
        enabled: true  # 启用探针模式
```

#### 自定义健康检查

你可以实现自定义的健康指示器来检查特定组件的健康状态:

```java
package com.example.demo.health;
import org.springframework.boot.actuate.health.Health;
import org.springframework.boot.actuate.health.HealthIndicator;
import org.springframework.stereotype.Component;
/**
 * 自定义健康指示器示例
 * 检查外部服务的健康状态
 * 
 * @author penglei
 */
@Component
public class CustomHealthIndicator implements HealthIndicator {
    /**
     * 检查健康状态
     * 
     * @return Health对象,包含健康状态和详细信息
     */
    @Override
    public Health health() {
        // 这里可以检查外部服务、缓存、消息队列等
        boolean isHealthy = checkExternalService();
        if (isHealthy) {
            // 服务健康,返回UP状态
            return Health.up()
                    .withDetail("service", "external-service")
                    .withDetail("status", "available")
                    .build();
        } else {
            // 服务不健康,返回DOWN状态
            return Health.down()
                    .withDetail("service", "external-service")
                    .withDetail("status", "unavailable")
                    .withDetail("error", "Connection timeout")
                    .build();
        }
    }
    /**
     * 检查外部服务是否可用
     * 
     * @return true表示服务可用,false表示服务不可用
     */
    private boolean checkExternalService() {
        // 这里实现实际的服务检查逻辑
        // 比如发送HTTP请求、检查数据库连接等
        try {
            // 模拟检查逻辑
            Thread.sleep(100);
            return true;
        } catch (InterruptedException e) {
            return false;
        }
    }
}
```

### Metrics端点

Metrics端点用于查看应用程序的各种指标数据。

#### 访问Metrics端点

```bash
# 获取所有可用的指标名称
curl http://localhost:8080/actuator/metrics
# 返回示例
{
  "names": [
    "jvm.memory.used",
    "jvm.memory.max",
    "http.server.requests",
    "system.cpu.usage",
    "process.uptime"
  ]
}
# 获取特定指标的详细信息
curl http://localhost:8080/actuator/metrics/jvm.memory.used
# 返回示例
{
  "name": "jvm.memory.used",
  "description": "The amount of used memory",
  "baseUnit": "bytes",
  "measurements": [
    {
      "statistic": "VALUE",
      "value": 123456789
    }
  ],
  "availableTags": [
    {
      "tag": "area",
      "values": ["heap", "nonheap"]
    }
  ]
}
# 按标签过滤指标
curl "http://localhost:8080/actuator/metrics/jvm.memory.used?tag=area:heap"
# 获取HTTP请求指标
curl http://localhost:8080/actuator/metrics/http.server.requests
# 按状态码过滤
curl "http://localhost:8080/actuator/metrics/http.server.requests?tag=status:200"
```

#### 自定义指标

你可以注册自定义指标来收集应用程序特定的度量数据:

```java
package com.example.demo.metrics;
import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import org.springframework.stereotype.Component;
import java.util.concurrent.TimeUnit;
/**
 * 自定义指标收集器示例
 * 用于收集业务相关的指标数据
 * 
 * @author penglei
 */
@Component
public class CustomMetrics {
    private final Counter orderCounter;  // 订单计数器
    private final Timer orderProcessingTimer;  // 订单处理时间计时器
    /**
     * 构造函数,注册自定义指标
     * 
     * @param registry MeterRegistry对象,用于注册指标
     */
    public CustomMetrics(MeterRegistry registry) {
        // 注册订单计数器,带标签分类
        this.orderCounter = Counter.builder("orders.total")
                .description("Total number of orders")
                .tag("type", "custom")
                .register(registry);
        // 注册订单处理时间计时器
        this.orderProcessingTimer = Timer.builder("orders.processing.time")
                .description("Order processing time")
                .tag("type", "custom")
                .register(registry);
    }
    /**
     * 增加订单计数
     */
    public void incrementOrderCount() {
        orderCounter.increment();
    }
    /**
     * 记录订单处理时间
     * 
     * @param duration 处理时间(毫秒)
     */
    public void recordOrderProcessingTime(long duration) {
        orderProcessingTimer.record(duration, TimeUnit.MILLISECONDS);
    }
}
```

在Controller中使用自定义指标:

```java
package com.example.demo.controller;
import com.example.demo.metrics.CustomMetrics;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.HashMap;
import java.util.Map;
/**
 * 订单Controller,演示自定义指标的使用
 * 
 * @author penglei
 */
@RestController
@RequestMapping("/api/orders")
public class OrderController {
    @Autowired
    private CustomMetrics customMetrics;  // 注入自定义指标收集器
    /**
     * 创建订单接口
     * 
     * @return 订单信息
     */
    @GetMapping("/create")
    public Map<String, Object> createOrder() {
        long startTime = System.currentTimeMillis();
        try {
            // 模拟订单处理逻辑
            Thread.sleep(100);
            // 增加订单计数
            customMetrics.incrementOrderCount();
            Map<String, Object> result = new HashMap<>();
            result.put("orderId", System.currentTimeMillis());
            result.put("status", "created");
            return result;
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new RuntimeException("Order creation failed", e);
        } finally {
            // 记录订单处理时间
            long duration = System.currentTimeMillis() - startTime;
            customMetrics.recordOrderProcessingTime(duration);
        }
    }
}
```

### Info端点

Info端点用于显示应用程序的版本、构建信息等。

#### 访问Info端点

```bash
# 访问info端点
curl http://localhost:8080/actuator/info
# 返回示例
{
  "app": {
    "name": "spring-boot-actuator-demo",
    "version": "1.0.0",
    "description": "Spring Boot 4 Actuator示例应用"
  },
  "java": {
    "version": "17.0.8"
  },
  "build": {
    "artifact": "spring-boot-actuator-demo",
    "name": "Spring Boot 4 Actuator Demo",
    "version": "1.0.0"
  }
}
```

#### Info端点配置

```yaml
# 应用信息配置
info:
  app:
    name: ${spring.application.name}
    version: 1.0.0
    description: Spring Boot 4 Actuator示例应用
  java:
    version: ${java.version}
  build:
    artifact: ${project.artifactId}
    name: ${project.name}
    version: ${project.version}
```

### Prometheus端点

Prometheus端点用于导出Prometheus格式的指标数据,方便与Prometheus监控系统集成。

#### 访问Prometheus端点

```bash
# 访问prometheus端点
curl http://localhost:8080/actuator/prometheus
# 返回示例(Prometheus文本格式)
# HELP jvm_memory_used_bytes The amount of used memory
# TYPE jvm_memory_used_bytes gauge
jvm_memory_used_bytes{area="heap",id="PS Survivor Space"} 1.23456789E8
jvm_memory_used_bytes{area="heap",id="PS Old Gen"} 2.34567890E8
# HELP http_server_requests_seconds HTTP server request duration
# TYPE http_server_requests_seconds summary
http_server_requests_seconds_count{method="GET",status="200",uri="/api/test"} 100
http_server_requests_seconds_sum{method="GET",status="200",uri="/api/test"} 1.234
```

#### Prometheus配置

在Prometheus的`prometheus.yml`中配置抓取目标:

```yaml
scrape_configs:
  - job_name: 'spring-boot-actuator'
    metrics_path: '/actuator/prometheus'
    static_configs:
      - targets: ['localhost:8080']
```

### Loggers端点

Loggers端点用于动态查看和修改日志级别。

#### 访问Loggers端点

```bash
# 获取所有日志器的配置
curl http://localhost:8080/actuator/loggers
# 返回示例
{
  "levels": ["TRACE", "DEBUG", "INFO", "WARN", "ERROR", "FATAL", "OFF"],
  "loggers": {
    "ROOT": {
      "configuredLevel": "INFO",
      "effectiveLevel": "INFO"
    },
    "com.example.demo": {
      "configuredLevel": "DEBUG",
      "effectiveLevel": "DEBUG"
    }
  }
}
# 获取特定日志器的配置
curl http://localhost:8080/actuator/loggers/com.example.demo
# 修改日志级别(POST请求)
curl -X POST http://localhost:8080/actuator/loggers/com.example.demo \
  -H "Content-Type: application/json" \
  -d '{"configuredLevel": "DEBUG"}'
```

### HTTP Exchanges端点

HTTP Exchanges端点用于记录和查看HTTP请求响应信息。

#### 访问HTTP Exchanges端点

```bash
# 访问httpexchanges端点
curl http://localhost:8080/actuator/httpexchanges
# 返回示例
{
  "exchanges": [
    {
      "request": {
        "method": "GET",
        "uri": "/api/test",
        "headers": {
          "Accept": ["application/json"]
        }
      },
      "response": {
        "status": 200,
        "headers": {
          "Content-Type": ["application/json"]
        }
      },
      "timeTaken": "15ms",
      "timestamp": "2023-10-27T10:00:00Z"
    }
  ]
}
```

## 安全配置

### Spring Security配置

为了保护Actuator端点,你需要配置Spring Security:

```java
package com.example.demo.config;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.provisioning.InMemoryUserDetailsManager;
import org.springframework.security.web.SecurityFilterChain;
/**
 * Spring Security配置类
 * 用于保护Actuator端点
 * 
 * @author penglei
 */
@Configuration
@EnableWebSecurity
public class SecurityConfig {
    /**
     * 配置安全过滤器链
     * 
     * @param http HttpSecurity对象
     * @return SecurityFilterChain对象
     * @throws Exception 配置异常
     */
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            // 授权配置
            .authorizeHttpRequests(auth -> auth
                // 允许访问健康检查端点
                .requestMatchers("/actuator/health", "/actuator/info").permitAll()
                // Actuator端点需要认证
                .requestMatchers("/actuator/**").hasRole("ADMIN")
                // 其他请求需要认证
                .anyRequest().authenticated()
            )
            // HTTP Basic认证
            .httpBasic(httpBasic -> {})
            // 禁用CSRF保护(仅用于非浏览器客户端)
            .csrf(csrf -> csrf.disable());
        return http.build();
    }
    /**
     * 配置用户详情服务
     * 
     * @param passwordEncoder 密码编码器
     * @return UserDetailsService对象
     */
    @Bean
    public UserDetailsService userDetailsService(PasswordEncoder passwordEncoder) {
        // 创建管理员用户
        UserDetails admin = User.builder()
                .username("admin")
                .password(passwordEncoder.encode("admin123"))
                .roles("ADMIN")
                .build();
        // 创建普通用户
        UserDetails user = User.builder()
                .username("user")
                .password(passwordEncoder.encode("user123"))
                .roles("USER")
                .build();
        // 返回内存用户详情管理器
        return new InMemoryUserDetailsManager(admin, user);
    }
    /**
     * 配置密码编码器
     * 
     * @return PasswordEncoder对象
     */
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
```

### 访问受保护的端点

配置安全后,访问Actuator端点需要认证:

```bash
# 使用HTTP Basic认证访问端点
curl -u admin:admin123 http://localhost:8080/actuator/metrics
# 或者使用用户名密码
curl --user admin:admin123 http://localhost:8080/actuator/metrics
```

## 生产环境最佳实践

### 1. 端点暴露策略

生产环境建议只暴露必要的端点:

```yaml
management:
  endpoints:
    web:
      exposure:
        # 只暴露必要的端点
        include: health,info,metrics,prometheus
        # 排除敏感端点
        exclude: shutdown,env,configprops
```

### 2. 安全配置

- 启用Spring Security保护端点
- 使用HTTPS加密通信
- 限制管理端口只能本地访问
- 使用强密码和角色控制

### 3. 健康检查配置

```yaml
management:
  endpoint:
    health:
      show-details: never  # 生产环境不显示详细信息
      probes:
        enabled: true  # 启用探针模式,用于Kubernetes
```

### 4. 指标收集配置

```yaml
management:
  metrics:
    export:
      prometheus:
        enabled: true
        step: 30s  # 生产环境可以设置更长的收集间隔
    distribution:
      percentiles-histogram:
        http.server.requests: true
```

### 5. 日志配置

生产环境建议关闭HTTP Exchanges记录,避免性能影响:

```yaml
management:
  endpoint:
    httpexchanges:
      enabled: false  # 生产环境可以关闭
```

## 总结

Spring Boot 4整合Actuator非常简单,只需要添加依赖和配置就能使用;Actuator提供了丰富的监控和管理功能,包括健康检查、指标收集、环境信息、日志管理等;通过合理配置端点暴露、安全控制和自定义健康检查,可以构建一个完善的监控体系;在生产环境中,要注意安全配置和性能优化,只暴露必要的端点,使用HTTPS加密,限制访问权限;结合Prometheus、Grafana等监控工具,可以构建一个完整的监控和告警系统。

好了,今天就聊到这里,兄弟们有啥问题可以留言,鹏磊看到会及时回复的。
