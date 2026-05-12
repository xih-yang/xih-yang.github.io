# 27、Spring Boot 4 整合 Prometheus 完整教程
- 来源：https://ddkk.com/springboot/4-action/27.html
- 分类：Spring Boot 4 整合教程
- 分组：六、监控与运维
- 日期：2025-12-08
做微服务监控的时候,最头疼的就是指标收集和存储,应用性能咋样、接口响应时间多少、错误率多高,这些数据你咋收集?总不能每次都写代码统计吧;而且数据存哪儿、咋查询、咋告警,这些问题都让人头大;后来听说Prometheus这玩意儿不错,是开源的时序数据库和监控系统,指标收集、存储、查询、告警一应俱全,而且性能好、扩展性强;现在Spring Boot 4出来了,通过Micrometer整合Prometheus更是方便得不行,自动配置给你整得明明白白,咱今天就聊聊Spring Boot 4咋整合Prometheus的。

其实Prometheus在Spring Boot里早就支持了,你只要加个`micrometer-registry-prometheus`依赖,基本上就能用;但是很多兄弟不知道里面的门道,也不知道咋配置指标收集、自定义指标、标签管理、Pushgateway推送这些高级功能,所以鹏磊今天就给兄弟们掰扯掰扯。

## Prometheus基础概念

### Prometheus是啥玩意儿

Prometheus是开源的系统监控和告警工具包,最初由SoundCloud开发,现在是CNCF(云原生计算基金会)的毕业项目;Prometheus的核心特性包括:

1. **时序数据库**: 以时间序列的方式存储指标数据,支持高效查询和分析
2. **拉取模型(Pull Model)**: Prometheus主动从目标应用拉取指标数据,而不是应用推送
3. **多维数据模型**: 指标通过名称和标签(Key-Value对)进行标识,支持灵活的查询
4. **PromQL查询语言**: 强大的查询语言,支持聚合、计算、告警等操作
5. **服务发现**: 自动发现监控目标,支持Kubernetes、Consul等服务发现机制
6. **告警管理**: 集成Alertmanager,支持灵活的告警规则和通知渠道

### Prometheus的核心概念

1. **指标(Metric)**: 被监控系统的某个可测量特性,比如HTTP请求数、响应时间、内存使用等
2. **标签(Label)**: 键值对,用于区分相同指标的不同维度,比如按状态码、URI、方法等分类
3. **时间序列(Time Series)**: 指标在时间维度上的数据点序列,每个时间序列由指标名称和标签唯一标识
4. **抓取(Scrape)**: Prometheus从目标应用拉取指标数据的过程
5. **作业(Job)**: 一组相同配置的抓取目标,比如同一个应用的所有实例
6. **实例(Instance)**: 抓取目标的具体地址,比如`localhost:8080`
7. **导出器(Exporter)**: 将第三方系统的指标转换为Prometheus格式的工具

### Micrometer是啥玩意儿

Micrometer是应用指标的门面库,类似于SLF4J在日志领域的作用;它提供了统一的API来收集指标,同时允许开发者选择监控后端;Micrometer的核心特性包括:

1. **供应商中立**: 不绑定特定的监控系统,可以在运行时切换后端
2. **维度指标**: 支持带标签的多维度指标,便于灵活查询和分析
3. **低开销**: 设计用于高吞吐量应用,性能开销极小
4. **Spring Boot集成**: Spring Boot默认集成Micrometer,自动配置各种指标收集

### Prometheus和Micrometer的关系

- **Micrometer**: 应用层面的指标收集库,提供统一的API
- **Prometheus**: 监控系统,负责指标存储、查询、告警
- **micrometer-registry-prometheus**: Micrometer的Prometheus实现,将指标转换为Prometheus格式

## 项目搭建和依赖配置

### 创建Maven项目

首先你得有个Maven项目,用IDEA或者Eclipse都行,或者直接用Spring Initializr生成;项目结构大概是这样:

```plaintext
spring-boot-prometheus-demo/
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
│   │   │               └── metrics/                  # 自定义指标目录
│   │   └── resources/
│   │       ├── application.yml                       # 配置文件
│   │       └── logback-spring.xml                    # 日志配置
│   └── test/
│       └── java/                                     # 测试代码目录
```

### pom.xml完整配置

这是最关键的,依赖配置不对后面全是坑;Spring Boot 4需要Java 17以上,而且Micrometer版本会自动管理。

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
    <artifactId>spring-boot-prometheus-demo</artifactId>
    <version>1.0.0</version>
    <packaging>jar</packaging>
    <name>Spring Boot 4 Prometheus Demo</name>
    <description>Spring Boot 4整合Prometheus示例项目</description>
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
        <!-- Micrometer Prometheus Registry: Prometheus指标导出 -->
        <dependency>
            <groupId>io.micrometer</groupId>
            <artifactId>micrometer-registry-prometheus</artifactId>
        </dependency>
        <!-- Spring Boot AOP: AOP支持(用于指标收集) -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-aop</artifactId>
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

Prometheus的配置都在`application.yml`中,这里给出完整的配置示例:

```yaml
# 服务器配置
server:
  port: 8080  # 服务端口
# Spring应用配置
spring:
  application:
    name: spring-boot-prometheus-demo  # 应用名称
# Actuator配置
management:
  # 端点配置
  endpoints:
    # Web端点暴露配置
    web:
      # 暴露的端点列表
      exposure:
        include: health,info,metrics,prometheus  # 暴露Prometheus端点
      # 端点基础路径,默认/actuator
      base-path: /actuator
  # 端点详细配置
  endpoint:
    # Prometheus端点配置
    prometheus:
      enabled: true  # 启用prometheus端点
  # 指标配置
  metrics:
    # 指标导出配置
    export:
      prometheus:
        enabled: true  # 启用Prometheus导出
        step: 10s  # 指标收集间隔,默认1分钟
        descriptions: true  # 是否在抓取负载中包含描述信息
    # 指标标签配置(全局标签,会添加到所有指标)
    tags:
      application: ${spring.application.name}  # 应用名称标签
      environment: dev  # 环境标签
      version: 1.0.0  # 版本标签
    # 指标分发配置
    distribution:
      # 百分位数直方图配置
      percentiles-histogram:
        http.server.requests: true  # 为HTTP请求启用百分位数直方图
      # 百分位数配置
      percentiles:
        http.server.requests: 0.5,0.9,0.95,0.99  # HTTP请求的百分位数
        # 0.5: 中位数,0.9: P90,0.95: P95,0.99: P99
      # 直方图桶配置(用于SLO监控)
      slo:
        http.server.requests: 100ms,200ms,500ms,1s,2s  # HTTP请求的SLO桶
    # 指标过滤配置
    enable:
      # 启用特定指标
      http.server.requests: true  # 启用HTTP请求指标
      jvm: true  # 启用JVM指标
      system: true  # 启用系统指标
      process: true  # 启用进程指标
  # 指标命名配置
  metrics:
    # 指标命名约定
    naming:
      # 使用短名称(默认)
      # 或者使用长名称: management.metrics.naming.long-names=true
```

## 启动类和基础Controller

### 启动类

```java
package com.example.demo;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
/**
 * Spring Boot 4 Prometheus示例应用启动类
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
        result.put("message", "Hello, Spring Boot 4 Prometheus!");
        result.put("timestamp", System.currentTimeMillis());
        return result;
    }
    /**
     * 模拟慢接口,用于测试响应时间指标
     * 
     * @return 包含消息的Map对象
     */
    @GetMapping("/slow")
    public Map<String, Object> slow() throws InterruptedException {
        // 模拟处理时间
        Thread.sleep(500);
        Map<String, Object> result = new HashMap<>();
        result.put("message", "This is a slow endpoint");
        result.put("timestamp", System.currentTimeMillis());
        return result;
    }
}
```

## Prometheus端点访问

### 访问Prometheus端点

启动应用后,可以通过以下方式访问Prometheus端点:

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
http_server_requests_seconds_max{method="GET",status="200",uri="/api/test"} 0.05
```

### Prometheus指标格式说明

Prometheus指标格式包含以下部分:

1. **HELP行**: 指标描述,格式为`# HELP  `
2. **TYPE行**: 指标类型,格式为`# TYPE  `,类型包括:

- `counter`: 计数器,只能增加
- `gauge`: 仪表盘,可以增加或减少
- `histogram`: 直方图,用于统计分布
- `summary`: 摘要,用于统计分位数
3. **指标行**: 实际的指标数据,格式为`{} `

## 自定义指标收集

### 使用MeterRegistry注册自定义指标

你可以通过注入`MeterRegistry`来注册自定义指标:

```java
package com.example.demo.metrics;
import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.Gauge;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import org.springframework.stereotype.Component;
import javax.annotation.PostConstruct;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;
/**
 * 自定义指标收集器示例
 * 用于收集业务相关的指标数据
 * 
 * @author penglei
 */
@Component
public class CustomMetrics {
    private final MeterRegistry meterRegistry;  // MeterRegistry对象,用于注册指标
    // 自定义计数器
    private Counter orderCounter;  // 订单计数器
    private Counter errorCounter;  // 错误计数器
    // 自定义计时器
    private Timer orderProcessingTimer;  // 订单处理时间计时器
    // 自定义仪表盘
    private final AtomicInteger activeUsers = new AtomicInteger(0);  // 活跃用户数
    /**
     * 构造函数,注入MeterRegistry
     * 
     * @param meterRegistry MeterRegistry对象
     */
    public CustomMetrics(MeterRegistry meterRegistry) {
        this.meterRegistry = meterRegistry;
    }
    /**
     * 初始化方法,注册自定义指标
     */
    @PostConstruct
    public void init() {
        // 注册订单计数器,带标签分类
        this.orderCounter = Counter.builder("orders.total")
                .description("Total number of orders")
                .tag("type", "custom")
                .register(meterRegistry);
        // 注册错误计数器
        this.errorCounter = Counter.builder("errors.total")
                .description("Total number of errors")
                .tag("type", "custom")
                .register(meterRegistry);
        // 注册订单处理时间计时器
        this.orderProcessingTimer = Timer.builder("orders.processing.time")
                .description("Order processing time in seconds")
                .tag("type", "custom")
                .publishPercentiles(0.5, 0.9, 0.95, 0.99)  // 发布百分位数
                .publishPercentileHistogram()  // 发布百分位数直方图
                .register(meterRegistry);
        // 注册活跃用户数仪表盘
        Gauge.builder("users.active", activeUsers, AtomicInteger::get)
                .description("Number of active users")
                .tag("type", "custom")
                .register(meterRegistry);
    }
    /**
     * 增加订单计数
     */
    public void incrementOrderCount() {
        orderCounter.increment();
    }
    /**
     * 增加错误计数
     */
    public void incrementErrorCount() {
        errorCounter.increment();
    }
    /**
     * 记录订单处理时间
     * 
     * @param duration 处理时间(毫秒)
     */
    public void recordOrderProcessingTime(long duration) {
        orderProcessingTimer.record(duration, TimeUnit.MILLISECONDS);
    }
    /**
     * 增加活跃用户数
     */
    public void incrementActiveUsers() {
        activeUsers.incrementAndGet();
    }
    /**
     * 减少活跃用户数
     */
    public void decrementActiveUsers() {
        activeUsers.decrementAndGet();
    }
    /**
     * 获取当前活跃用户数
     * 
     * @return 活跃用户数
     */
    public int getActiveUsers() {
        return activeUsers.get();
    }
}
```

### 在Controller中使用自定义指标

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
            // 增加错误计数
            customMetrics.incrementErrorCount();
            throw new RuntimeException("Order creation failed", e);
        } finally {
            // 记录订单处理时间
            long duration = System.currentTimeMillis() - startTime;
            customMetrics.recordOrderProcessingTime(duration);
        }
    }
    /**
     * 用户登录接口,演示仪表盘指标
     * 
     * @return 登录信息
     */
    @GetMapping("/login")
    public Map<String, Object> login() {
        // 增加活跃用户数
        customMetrics.incrementActiveUsers();
        Map<String, Object> result = new HashMap<>();
        result.put("message", "Login successful");
        result.put("activeUsers", customMetrics.getActiveUsers());
        return result;
    }
    /**
     * 用户登出接口
     * 
     * @return 登出信息
     */
    @GetMapping("/logout")
    public Map<String, Object> logout() {
        // 减少活跃用户数
        customMetrics.decrementActiveUsers();
        Map<String, Object> result = new HashMap<>();
        result.put("message", "Logout successful");
        result.put("activeUsers", customMetrics.getActiveUsers());
        return result;
    }
}
```

### 使用MeterBinder注册指标

对于更复杂的指标集合,可以使用`MeterBinder`接口:

```java
package com.example.demo.metrics;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.binder.MeterBinder;
import org.springframework.stereotype.Component;
import java.util.concurrent.atomic.AtomicLong;
/**
 * 自定义MeterBinder示例
 * 用于批量注册相关指标
 * 
 * @author penglei
 */
@Component
public class BusinessMetricsBinder implements MeterBinder {
    private final AtomicLong totalRevenue = new AtomicLong(0);  // 总收入
    private final AtomicLong totalOrders = new AtomicLong(0);  // 总订单数
    /**
     * 绑定指标到MeterRegistry
     * 
     * @param registry MeterRegistry对象
     */
    @Override
    public void bindTo(MeterRegistry registry) {
        // 注册总收入仪表盘
        Gauge.builder("business.revenue.total", totalRevenue, AtomicLong::get)
                .description("Total business revenue")
                .tag("type", "business")
                .register(registry);
        // 注册总订单数仪表盘
        Gauge.builder("business.orders.total", totalOrders, AtomicLong::get)
                .description("Total number of orders")
                .tag("type", "business")
                .register(registry);
    }
    /**
     * 增加收入
     * 
     * @param amount 收入金额
     */
    public void addRevenue(long amount) {
        totalRevenue.addAndGet(amount);
    }
    /**
     * 增加订单数
     */
    public void incrementOrders() {
        totalOrders.incrementAndGet();
    }
}
```

## Prometheus服务器配置

### 安装Prometheus

从Prometheus官网下载最新版本: https://prometheus.io/download/

```bash
# 下载Prometheus
wget https://github.com/prometheus/prometheus/releases/download/v2.45.0/prometheus-2.45.0.linux-amd64.tar.gz
# 解压
tar -xzf prometheus-2.45.0.linux-amd64.tar.gz
cd prometheus-2.45.0.linux-amd64
```

### Prometheus配置文件

创建`prometheus.yml`配置文件:

```yaml
# Prometheus全局配置
global:
  scrape_interval: 15s  # 抓取间隔,默认15秒
  evaluation_interval: 15s  # 规则评估间隔,默认15秒
  external_labels:  # 外部标签,会添加到所有时间序列
    cluster: 'dev'
    environment: 'development'
# 告警配置
alerting:
  alertmanagers:
    - static_configs:
        - targets:
          # - alertmanager:9093  # Alertmanager地址
# 规则文件配置
rule_files:
  # - "first_rules.yml"  # 告警规则文件
  # - "second_rules.yml"
# 抓取配置
scrape_configs:
  # Prometheus自身监控
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']
  # Spring Boot应用监控
  - job_name: 'spring-boot-app'
    scrape_interval: 10s  # 抓取间隔
    metrics_path: '/actuator/prometheus'  # 指标路径
    static_configs:
      - targets: ['localhost:8080']  # 应用地址
        labels:
          application: 'spring-boot-prometheus-demo'
          environment: 'dev'
  # 如果有多个实例,可以这样配置
  # - job_name: 'spring-boot-app-cluster'
  #   scrape_interval: 10s
  #   metrics_path: '/actuator/prometheus'
  #   static_configs:
  #     - targets:
  #       - 'localhost:8080'
  #       - 'localhost:8081'
  #       - 'localhost:8082'
```

### 启动Prometheus

```bash
# 启动Prometheus
./prometheus --config.file=prometheus.yml
# 或者指定其他配置
./prometheus --config.file=prometheus.yml --web.listen-address=0.0.0.0:9090
```

启动后访问 http://localhost:9090 查看Prometheus Web UI。

### 验证指标抓取

在Prometheus Web UI中:

1. 访问 http://localhost:9090/targets 查看抓取目标状态
2. 访问 http://localhost:9090/graph 使用PromQL查询指标
3. 常用查询示例:

- `up`: 检查目标是否在线
- `http_server_requests_seconds_count`: HTTP请求总数
- `http_server_requests_seconds_sum`: HTTP请求总时间
- `jvm_memory_used_bytes`: JVM内存使用量
- `process_cpu_usage`: 进程CPU使用率

## PromQL查询示例

### 基础查询

```txt
# **promql**
# 查询HTTP请求总数
http_server_requests_seconds_count
# 查询特定URI的请求数
http_server_requests_seconds_count{uri="/api/test"}
# 查询特定状态码的请求数
http_server_requests_seconds_count{status="200"}
# 查询多个标签组合
http_server_requests_seconds_count{method="GET",status="200",uri="/api/test"}
```

### 聚合查询

```txt
# **promql**
# 计算所有URI的总请求数
sum(http_server_requests_seconds_count)
# 按URI分组统计请求数
sum(http_server_requests_seconds_count) by (uri)
# 按状态码分组统计请求数
sum(http_server_requests_seconds_count) by (status)
# 计算平均响应时间
rate(http_server_requests_seconds_sum[5m]) / rate(http_server_requests_seconds_count[5m])
# 计算P95响应时间
histogram_quantile(0.95, rate(http_server_requests_seconds_bucket[5m]))
```

### 告警规则示例

创建`alerts.yml`文件:

```yaml
groups:
  - name: spring_boot_alerts
    interval: 30s
    rules:
      # HTTP错误率告警
      - alert: HighErrorRate
        expr: |
          sum(rate(http_server_requests_seconds_count{status=~"5.."}[5m])) 
          / 
          sum(rate(http_server_requests_seconds_count[5m])) 
          > 0.05
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High error rate detected"
          description: "Error rate is above 5% for 5 minutes"
      # 响应时间告警
      - alert: HighResponseTime
        expr: |
          histogram_quantile(0.95, 
            rate(http_server_requests_seconds_bucket[5m])
          ) > 1
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High response time detected"
          description: "P95 response time is above 1 second"
      # JVM内存使用告警
      - alert: HighMemoryUsage
        expr: |
          (sum(jvm_memory_used_bytes{area="heap"}) 
          / 
          sum(jvm_memory_max_bytes{area="heap"})) 
          > 0.9
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High JVM memory usage"
          description: "JVM heap memory usage is above 90%"
```

在`prometheus.yml`中引用:

```yaml
rule_files:
  - "alerts.yml"
```

## Pushgateway配置(可选)

对于短期任务或批处理作业,可以使用Pushgateway推送指标:

### 安装Pushgateway

```bash
# 下载Pushgateway
wget https://github.com/prometheus/pushgateway/releases/download/v1.6.0/pushgateway-1.6.0.linux-amd64.tar.gz
# 解压并启动
tar -xzf pushgateway-1.6.0.linux-amd64.tar.gz
cd pushgateway-1.6.0.linux-amd64
./pushgateway
```

### Spring Boot配置Pushgateway

在`application.yml`中配置:

```yaml
management:
  metrics:
    export:
      prometheus:
        pushgateway:
          enabled: true  # 启用Pushgateway
          base-url: http://localhost:9091  # Pushgateway地址
          job: spring-boot-app  # 作业名称
          push-rate: 10s  # 推送频率
          grouping-key:
            application: ${spring.application.name}
            environment: dev
```

## 生产环境最佳实践

### 1. 指标命名规范

- 使用有意义的指标名称
- 遵循Prometheus命名约定(小写字母、下划线分隔)
- 使用标签而不是在指标名称中包含维度信息

### 2. 标签使用规范

- 标签值应该是有限的、可枚举的
- 避免高基数的标签(比如用户ID、请求ID)
- 使用全局标签标识应用、环境、版本等

### 3. 性能优化

- 合理设置抓取间隔,避免过于频繁
- 使用百分位数直方图而不是百分位数摘要(性能更好)
- 限制指标数量,避免指标爆炸

### 4. 安全配置

- 使用HTTPS保护指标端点
- 配置认证和授权
- 限制Prometheus服务器访问范围

### 5. 监控告警

- 设置合理的告警阈值
- 使用告警分组避免告警风暴
- 配置多种通知渠道(邮件、短信、钉钉等)

## 总结

Spring Boot 4整合Prometheus非常简单,只需要添加`micrometer-registry-prometheus`依赖就能使用;Prometheus提供了强大的指标收集、存储、查询和告警功能,是微服务监控的首选方案;通过Micrometer可以轻松收集应用指标,包括HTTP请求、JVM性能、自定义业务指标等;结合Prometheus的PromQL查询语言和Alertmanager告警系统,可以构建一个完整的监控和告警体系;在生产环境中,要注意指标命名规范、标签使用规范、性能优化和安全配置,确保监控系统的稳定性和可靠性。

好了,今天就聊到这里,兄弟们有啥问题可以留言,鹏磊看到会及时回复的。
