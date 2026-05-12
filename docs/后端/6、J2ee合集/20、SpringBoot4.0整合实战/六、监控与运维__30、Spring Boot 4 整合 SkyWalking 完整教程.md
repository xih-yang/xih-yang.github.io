# 30、Spring Boot 4 整合 SkyWalking 完整教程
- 来源：https://ddkk.com/springboot/4-action/30.html
- 分类：Spring Boot 4 整合教程
- 分组：六、监控与运维
- 日期：2025-12-08
生产环境搞微服务的时候,最头疼的就是性能监控和问题排查,服务调用链路咋追踪、接口响应时间多长、哪个服务出问题了,这些问题你咋知道?总不能每个服务都写日志看吧,那得看到猴年马月;而且分布式系统调用链复杂,一个请求可能经过好几个服务,出了问题咋定位是哪个环节的问题;后来听说Apache SkyWalking这玩意儿不错,是开源的APM(应用性能监控)系统,分布式追踪、服务拓扑、性能指标、告警通知一应俱全,而且性能好、无侵入、支持多种语言;现在Spring Boot 4出来了,整合SkyWalking更是方便得不行,Java Agent自动插桩,零代码侵入,咱今天就聊聊Spring Boot 4咋整合SkyWalking的。

其实SkyWalking在Java应用里早就支持了,你只要下载个Agent,启动时加上`-javaagent`参数,基本上就能用;但是很多兄弟不知道里面的门道,也不知道咋配置OAP服务、Agent参数、采样率、告警规则这些高级功能,所以鹏磊今天就给兄弟们掰扯掰扯。

## SkyWalking基础概念

### SkyWalking是啥玩意儿

Apache SkyWalking是开源的分布式系统应用性能监控(APM)工具,用于收集、分析、聚合和可视化服务的数据;SkyWalking的核心特性包括:

1. **分布式追踪**: 自动追踪分布式系统中的服务调用链路,生成完整的调用关系图
2. **服务拓扑**: 自动发现和展示服务之间的调用关系,形成可视化的服务拓扑图
3. **性能监控**: 收集服务性能指标,包括响应时间、吞吐量、错误率等
4. **日志关联**: 将日志和追踪数据关联起来,方便问题定位和排查
5. **告警通知**: 支持多种告警规则和通知渠道,及时发现问题
6. **无侵入性**: 通过Java Agent字节码增强技术,无需修改业务代码
7. **多语言支持**: 支持Java、.NET、Go、Node.js、Python等多种语言

### SkyWalking的核心概念

1. **OAP(Observability Analysis Platform)**: SkyWalking的后端服务,负责接收、分析和存储追踪数据
2. **Agent**: Java应用中的探针,负责收集应用的性能数据并发送给OAP
3. **Trace**: 一次完整的请求追踪,包含多个Span
4. **Span**: 追踪的最小单位,代表一个操作,比如一个HTTP请求、一个数据库查询等
5. **Segment**: Agent收集的本地追踪数据,包含多个Span
6. **Service**: 被监控的服务,比如一个Spring Boot应用
7. **Instance**: 服务的实例,一个服务可以有多个实例(集群部署)
8. **Endpoint**: 服务中的操作点,比如一个HTTP接口、一个方法等

### SkyWalking的架构

SkyWalking采用Agent + OAP + Storage的三层架构:

1. **Agent层**: 部署在各个应用中,负责收集数据并发送给OAP
2. **OAP层**: 接收Agent发送的数据,进行分析和存储,提供查询接口
3. **Storage层**: 存储追踪数据,支持Elasticsearch、MySQL、H2、TiDB等多种存储后端

### SkyWalking和其他APM工具的区别

1. **Pinpoint**: SkyWalking性能更好,Agent开销更小;Pinpoint对性能影响较大
2. **Zipkin**: SkyWalking功能更全面,自带UI界面;Zipkin只提供追踪功能,需要配合其他工具
3. **Jaeger**: SkyWalking更适合Java生态,集成更方便;Jaeger更通用但Java集成相对复杂

## SkyWalking服务器安装和启动

### 下载SkyWalking

从SkyWalking官网下载最新版本: https://skywalking.apache.org/downloads/

推荐下载二进制版本,包含OAP服务和UI界面:

```bash
# 下载SkyWalking(以9.x版本为例)
wget https://archive.apache.org/dist/skywalking/9.0.0/apache-skywalking-java-agent-9.0.0.tgz
wget https://archive.apache.org/dist/skywalking/9.0.0/apache-skywalking-java-agent-9.0.0.tgz
# 或者下载完整版本(包含OAP和UI)
wget https://archive.apache.org/dist/skywalking/9.0.0/apache-skywalking-java-agent-9.0.0.tgz
```

### 解压和目录结构

```bash
# 解压
tar -xzf apache-skywalking-java-agent-9.0.0.tgz
cd apache-skywalking-java-agent-9.0.0
# 目录结构
apache-skywalking-java-agent-9.0.0/
├── agent/                    # Agent目录
│   ├── skywalking-agent.jar  # Agent主JAR文件
│   ├── config/               # Agent配置文件
│   │   └── agent.config      # Agent主配置文件
│   ├── plugins/              # 插件目录
│   └── optional-plugins/     # 可选插件目录
├── bin/                      # 启动脚本目录
│   ├── oapService.sh         # OAP服务启动脚本(Linux/Mac)
│   ├── oapService.bat        # OAP服务启动脚本(Windows)
│   ├── webappService.sh      # UI启动脚本(Linux/Mac)
│   └── webappService.bat     # UI启动脚本(Windows)
└── config/                   # OAP配置文件目录
    ├── application.yml        # OAP主配置文件
    └── alarm-settings.yml     # 告警规则配置文件
```

### 配置OAP服务

修改`config/application.yml`文件,配置存储后端和其他参数:

```yaml
# OAP核心配置
core:
  default:
    # 数据刷新间隔(秒)
    downsampling:
      - Hour
      - Day
    # 数据保留时间(天)
    recordDataTTL: 7
    metricsDataTTL: 15
    otherMetricsDataTTL: 5
    monthMetricsDataTTL: 180
# 存储配置(使用H2内存数据库,生产环境建议使用Elasticsearch)
storage:
  selector: ${SW_STORAGE:h2}  # 存储类型:h2、elasticsearch、mysql等
  h2:
    driver: ${SW_STORAGE_H2_DRIVER:org.h2.jdbcx.JdbcDataSource}
    url: ${SW_STORAGE_H2_URL:jdbc:h2:mem:skywalking-oap-db}
    user: ${SW_STORAGE_H2_USER:sa}
    metadataQueryMaxSize: ${SW_STORAGE_H2_QUERY_MAX_SIZE:5000}
    maxSizeOfArrayColumn: ${SW_STORAGE_H2_MAX_SIZE_OF_ARRAY_COLUMN:20}
    numOfSearchableValuesPerTag: ${SW_STORAGE_H2_NUM_OF_SEARCHABLE_VALUES_PER_TAG:2}
# 如果使用Elasticsearch,取消注释以下配置
# storage:
#   selector: ${SW_STORAGE:elasticsearch}
#   elasticsearch:
#     namespace: ${SW_NAMESPACE:""}
#     clusterNodes: ${SW_STORAGE_ES_CLUSTER_NODES:localhost:9200}
#     protocol: ${SW_STORAGE_ES_HTTP_PROTOCOL:"http"}
#     trustStorePath: ${SW_STORAGE_ES_TRUST_STORE_PATH:""}
#     trustStorePass: ${SW_STORAGE_ES_TRUST_STORE_PASS:""}
#     user: ${SW_STORAGE_ES_USER:""}
#     password: ${SW_STORAGE_ES_PASSWORD:""}
#     indexShardsNumber: ${SW_STORAGE_ES_INDEX_SHARDS_NUMBER:1}
#     indexReplicasNumber: ${SW_STORAGE_ES_INDEX_REPLICAS_NUMBER:1}
# 接收器配置(接收Agent发送的数据)
receiver-sharing-server:
  default:
    # gRPC接收器配置
    receivers:
      - gRPC
      - rest
    # gRPC服务器端口
    restHost: ${SW_RECEIVER_REST_HOST:0.0.0.0}
    restPort: ${SW_RECEIVER_REST_PORT:12800}
    restContextPath: ${SW_RECEIVER_REST_CONTEXT_PATH:/}
    restMaxRequestSize: ${SW_RECEIVER_REST_MAX_REQUEST_SIZE:10485760}
    restIdleTimeOut: ${SW_RECEIVER_REST_IDLE_TIMEOUT:60000}
    gRPC:
      host: ${SW_RECEIVER_GRPC_HOST:0.0.0.0}
      port: ${SW_RECEIVER_GRPC_PORT:11800}  # Agent连接的端口
      maxConcurrentCallsPerConnection: ${SW_RECEIVER_GRPC_MAX_CONCURRENT_CALL:2}
      maxInboundMessageSize: ${SW_RECEIVER_GRPC_MAX_INBOUND_MESSAGE_SIZE:10485760}
      authentication: ${SW_RECEIVER_GRPC_AUTHENTICATION:""}
```

### 启动OAP服务

```bash
# Linux/Mac启动OAP服务
cd /path/to/apache-skywalking-java-agent-9.0.0
sh bin/oapService.sh
# Windows启动OAP服务
cd C:\path\to\apache-skywalking-java-agent-9.0.0
bin\oapService.bat
# 后台启动(生产环境推荐)
nohup sh bin/oapService.sh > logs/oap.log 2>&1 &
```

启动成功后,OAP服务会监听11800端口(gRPC)和12800端口(REST),你可以在日志中看到启动信息。

### 启动UI界面

```bash
# Linux/Mac启动UI服务
cd /path/to/apache-skywalking-java-agent-9.0.0
sh bin/webappService.sh
# Windows启动UI服务
cd C:\path\to\apache-skywalking-java-agent-9.0.0
bin\webappService.bat
# 后台启动
nohup sh bin/webappService.sh > logs/ui.log 2>&1 &
```

启动成功后,访问 http://localhost:8080 可以看到SkyWalking的UI界面。

### SkyWalking集群模式(生产环境)

生产环境建议使用集群模式,提高可用性:

1. **配置存储后端**: 使用Elasticsearch或MySQL作为存储,而不是H2内存数据库
2. **配置OAP集群**: 多个OAP节点共享同一个存储后端
3. **负载均衡**: 在Agent和OAP之间加负载均衡器,分散请求压力

## 项目搭建和依赖配置

### 创建Maven项目

首先你得有个Maven项目,用IDEA或者Eclipse都行,或者直接用Spring Initializr生成;项目结构大概是这样:

```plaintext
spring-boot-skywalking-demo/
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
│   │   │               └── config/                   # 配置类目录
│   │   └── resources/
│   │       ├── application.yml                       # 配置文件
│   │       └── logback-spring.xml                    # 日志配置
│   └── test/
│       └── java/                                     # 测试代码目录
```

### pom.xml完整配置

SkyWalking通过Java Agent工作,不需要在pom.xml中添加依赖;但是为了完整演示,这里还是给出基本的Spring Boot配置:

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
    <artifactId>spring-boot-skywalking-demo</artifactId>
    <version>1.0.0</version>
    <packaging>jar</packaging>
    <name>Spring Boot 4 SkyWalking Demo</name>
    <description>Spring Boot 4整合SkyWalking示例项目</description>
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
        <!-- Spring Boot Actuator: 健康检查等(可选) -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-actuator</artifactId>
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

**注意**: SkyWalking通过Java Agent工作,不需要在pom.xml中添加SkyWalking相关的依赖;Agent会通过字节码增强技术自动插桩,无需修改业务代码。

### application.yml配置

虽然SkyWalking不需要代码配置,但是可以在配置文件中添加一些可选配置:

```yaml
# 服务器配置
server:
  port: 8080  # 服务端口
# Spring应用配置
spring:
  application:
    name: spring-boot-skywalking-demo  # 应用名称,也是SkyWalking中的服务名
# Actuator配置(可选)
management:
  endpoints:
    web:
      exposure:
        include: health,info,metrics
  endpoint:
    health:
      show-details: always
# 日志配置
logging:
  level:
    root: INFO
    com.example.demo: DEBUG
```

## SkyWalking Agent配置

### 下载Agent

从SkyWalking官网下载Agent,或者使用OAP服务包中的agent目录。

### Agent配置文件

Agent的主配置文件是`agent/config/agent.config`,关键配置如下:

```properties
# Agent命名空间,用于隔离不同环境的数据
agent.namespace=${SW_AGENT_NAMESPACE:}
# 服务名称,在SkyWalking UI中显示的服务名
agent.service_name=${SW_AGENT_NAME:Your_ApplicationName}
# 采样率,0-10000,10000表示100%采样,1000表示10%采样
agent.sample_n_per_3_secs=${SW_AGENT_SAMPLE:-1}
# 采样策略,默认RATE_LIMITER
agent.sample=${SW_AGENT_SAMPLE:default}
# 日志级别,可选:TRACE、DEBUG、INFO、WARN、ERROR
logging.level=${SW_LOGGING_LEVEL:INFO}
# OAP服务器地址,Agent会向这个地址发送数据
collector.backend_service=${SW_AGENT_COLLECTOR_BACKEND_SERVICES:127.0.0.1:11800}
# Agent是否收集JVM指标
agent.is_collect_http_params=${SW_AGENT_COLLECT_HTTP_PARAMS:false}
# 是否收集HTTP请求参数
agent.is_open_debugging_class=${SW_IGNORE_SUFFIX:false}
# 忽略的路径后缀,这些路径不会被追踪
agent.ignore_suffix=${SW_IGNORE_SUFFIX:.jpg,.jpeg,.js,.css,.png,.bmp,.gif,.ico,.mp3,.mp4,.html,.svg}
# 是否收集数据库SQL参数
plugin.jdbc.trace_sql_parameters=${SW_JDBC_TRACE_SQL_PARAMETERS:false}
# 最大SQL参数长度
plugin.jdbc.sql_parameters_max_length=${SW_JDBC_SQL_PARAMETERS_MAX_LENGTH:512}
# 是否收集Redis命令参数
plugin.redis.trace_redis_parameters=${SW_REDIS_TRACE_REDIS_PARAMETERS:false}
# Redis参数最大长度
plugin.redis.redis_parameters_max_length=${SW_REDIS_PARAMETERS_MAX_LENGTH:128}
# 最大Span数量,超过这个数量会丢弃多余的Span
agent.span_limit_per_segment=${SW_AGENT_SPAN_LIMIT:300}
# 是否自动命名操作名称
plugin.mount.operator_name_suffixes=${SW_MOUNT:}
# 是否收集Spring Cloud Gateway的指标
plugin.springcloudgateway.collect_http_headers=${SW_PLUGIN_SPRING_CLOUD_GATEWAY_COLLECT_HTTP_HEADERS:false}
# 是否收集HTTP请求体
plugin.http.http_headers_length_threshold=${SW_HTTP_HEADERS_LENGTH_THRESHOLD:2048}
```

### 通过JVM参数配置Agent

启动Spring Boot应用时,通过JVM参数配置Agent:

```bash
# 基本配置
java -javaagent:/path/to/skywalking-agent.jar \
     -Dskywalking.agent.service_name=spring-boot-skywalking-demo \
     -Dskywalking.collector.backend_service=127.0.0.1:11800 \
     -jar spring-boot-skywalking-demo.jar
# 完整配置示例
java -javaagent:/path/to/skywalking-agent.jar \
     -Dskywalking.agent.service_name=spring-boot-skywalking-demo \
     -Dskywalking.collector.backend_service=127.0.0.1:11800 \
     -Dskywalking.agent.sample_n_per_3_secs=100 \
     -Dskywalking.logging.level=INFO \
     -Dskywalking.agent.namespace=production \
     -jar spring-boot-skywalking-demo.jar
```

### 通过环境变量配置Agent

也可以通过环境变量配置Agent:

```bash
# 设置环境变量
export SW_AGENT_NAME=spring-boot-skywalking-demo
export SW_AGENT_COLLECTOR_BACKEND_SERVICES=127.0.0.1:11800
export SW_AGENT_SAMPLE=100
export SW_LOGGING_LEVEL=INFO
# 启动应用
java -javaagent:/path/to/skywalking-agent.jar -jar spring-boot-skywalking-demo.jar
```

### IDEA中配置Agent

在IDEA中运行应用时,可以在Run Configuration中配置VM options:

```plaintext
-javaagent:/path/to/skywalking-agent/skywalking-agent.jar
-Dskywalking.agent.service_name=spring-boot-skywalking-demo
-Dskywalking.collector.backend_service=127.0.0.1:11800
```

## 启动类和Controller

### 启动类

```java
package com.example.demo;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
/**
 * Spring Boot 4 SkyWalking示例应用启动类
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
        System.out.println("Spring Boot 4 SkyWalking应用启动成功!");
    }
}
```

### 测试Controller

创建一个Controller用于测试SkyWalking追踪:

```java
package com.example.demo.controller;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.TimeUnit;
/**
 * 测试Controller,用于验证SkyWalking追踪
 * 
 * @author penglei
 */
@Slf4j
@RestController
@RequestMapping("/api")
public class TestController {
    /**
     * 简单测试接口
     * 
     * @return 包含消息的Map对象
     */
    @GetMapping("/hello")
    public Map<String, Object> hello() {
        log.info("收到hello请求");
        Map<String, Object> result = new HashMap<>();
        result.put("message", "Hello SkyWalking!");
        result.put("timestamp", System.currentTimeMillis());
        return result;
    }
    /**
     * 带参数的测试接口
     * 
     * @param name 名称参数
     * @return 包含消息的Map对象
     */
    @GetMapping("/greet")
    public Map<String, Object> greet(@RequestParam(defaultValue = "World") String name) {
        log.info("收到greet请求, name: {}", name);
        Map<String, Object> result = new HashMap<>();
        result.put("message", "Hello " + name + "!");
        result.put("timestamp", System.currentTimeMillis());
        return result;
    }
    /**
     * 模拟耗时操作
     * 
     * @param delay 延迟时间(毫秒)
     * @return 包含消息的Map对象
     */
    @GetMapping("/slow")
    public Map<String, Object> slow(@RequestParam(defaultValue = "1000") long delay) {
        log.info("收到slow请求, delay: {}ms", delay);
        try {
            // 模拟业务处理耗时
            Thread.sleep(delay);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            log.error("线程被中断", e);
        }
        Map<String, Object> result = new HashMap<>();
        result.put("message", "处理完成");
        result.put("delay", delay);
        result.put("timestamp", System.currentTimeMillis());
        return result;
    }
    /**
     * 模拟异常情况
     * 
     * @return 抛出异常
     */
    @GetMapping("/error")
    public Map<String, Object> error() {
        log.error("收到error请求,准备抛出异常");
        throw new RuntimeException("这是一个测试异常");
    }
    /**
     * 调用Service层的接口
     * 
     * @return 包含消息的Map对象
     */
    @GetMapping("/service")
    public Map<String, Object> service() {
        log.info("收到service请求");
        // 这里可以调用Service层,演示完整的调用链
        Map<String, Object> result = new HashMap<>();
        result.put("message", "Service调用成功");
        result.put("timestamp", System.currentTimeMillis());
        return result;
    }
}
```

### Service层示例

创建一个Service层,演示跨层的调用追踪:

```java
package com.example.demo.service;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import java.util.HashMap;
import java.util.Map;
/**
 * 测试Service,用于验证跨层追踪
 * 
 * @author penglei
 */
@Slf4j
@Service
public class TestService {
    /**
     * 处理业务逻辑
     * 
     * @param input 输入参数
     * @return 处理结果
     */
    public Map<String, Object> process(String input) {
        log.info("Service处理业务逻辑, input: {}", input);
        // 模拟业务处理
        Map<String, Object> result = new HashMap<>();
        result.put("processed", true);
        result.put("input", input);
        result.put("output", "处理后的数据: " + input);
        result.put("timestamp", System.currentTimeMillis());
        // 可以继续调用其他Service或DAO层
        // 这些调用都会被SkyWalking追踪
        return result;
    }
    /**
     * 模拟数据库查询
     * 
     * @param id 记录ID
     * @return 查询结果
     */
    public Map<String, Object> queryData(Long id) {
        log.info("Service查询数据, id: {}", id);
        // 模拟数据库查询
        Map<String, Object> data = new HashMap<>();
        data.put("id", id);
        data.put("name", "测试数据");
        data.put("value", "测试值");
        return data;
    }
}
```

## SkyWalking UI使用

### 查看服务列表

访问 http://localhost:8080 ,在首页可以看到所有注册的服务列表,包括:

- 服务名称
- 服务实例数
- 平均响应时间
- 成功率
- 吞吐量(每分钟请求数)

### 查看服务拓扑

在"Topology"页面可以看到服务之间的调用关系图,包括:

- 服务节点
- 服务之间的调用关系
- 调用方向
- 调用统计信息(请求数、错误数等)

### 查看追踪详情

在"Trace"页面可以查看详细的调用链路,包括:

- 完整的调用链
- 每个Span的详细信息(方法名、耗时、参数等)
- 异常信息
- 标签和日志

### 查看性能指标

在"Performance"页面可以查看服务的性能指标,包括:

- 响应时间分布
- 吞吐量趋势
- 错误率趋势
- SLA指标

### 查看日志

在"Log"页面可以查看应用的日志,日志会自动关联到对应的Trace。

## 高级配置和功能

### 自定义追踪

虽然SkyWalking可以自动追踪,但有时候我们需要手动添加追踪点:

```java
package com.example.demo.service;
import lombok.extern.slf4j.Slf4j;
import org.apache.skywalking.apm.toolkit.trace.ActiveSpan;
import org.apache.skywalking.apm.toolkit.trace.Trace;
import org.apache.skywalking.apm.toolkit.trace.TraceContext;
import org.springframework.stereotype.Service;
/**
 * 自定义追踪示例
 * 
 * @author penglei
 */
@Slf4j
@Service
public class CustomTraceService {
    /**
     * 使用@Trace注解自定义追踪
     * 
     * @param input 输入参数
     * @return 处理结果
     */
    @Trace
    public String customTrace(String input) {
        // 获取当前Trace ID
        String traceId = TraceContext.traceId();
        log.info("当前Trace ID: {}", traceId);
        // 添加自定义标签
        ActiveSpan.tag("custom.key", "custom.value");
        ActiveSpan.tag("input", input);
        // 添加自定义日志
        ActiveSpan.info("自定义日志信息");
        return "处理完成: " + input;
    }
    /**
     * 手动创建Span
     */
    public void manualSpan() {
        // 创建自定义Span
        ActiveSpan span = ActiveSpan.createEntrySpan("custom-operation", null);
        try {
            // 业务逻辑
            log.info("执行自定义操作");
            // 添加标签
            span.tag("operation.type", "manual");
        } finally {
            // 关闭Span
            span.asyncFinish();
        }
    }
}
```

**注意**: 使用自定义追踪功能需要在pom.xml中添加依赖:

```xml
<!-- SkyWalking Toolkit(可选,用于自定义追踪) -->
<dependency>
    <groupId>org.apache.skywalking</groupId>
    <artifactId>apm-toolkit-trace</artifactId>
    <version>9.0.0</version>
</dependency>
<!-- SkyWalking Logback(可选,用于日志关联) -->
<dependency>
    <groupId>org.apache.skywalking</groupId>
    <artifactId>apm-toolkit-logback-1.x</artifactId>
    <version>9.0.0</version>
</dependency>
```

### 日志关联

配置Logback,将日志和Trace关联起来:

```xml
<!-- logback-spring.xml -->
<configuration>
    <appender name="CONSOLE" class="ch.qos.logback.core.ConsoleAppender">
        <encoder class="ch.qos.logback.core.encoder.LayoutWrappingEncoder">
            <layout class="org.apache.skywalking.apm.toolkit.log.logback.v1.x.TraceIdPatternLogbackLayout">
                <!-- 日志格式,包含Trace ID -->
                <pattern>%d{yyyy-MM-dd HH:mm:ss.SSS} [%tid] [%thread] %-5level %logger{36} - %msg%n</pattern>
            </layout>
        </encoder>
    </appender>
    <root level="INFO">
        <appender-ref ref="CONSOLE"/>
    </root>
</configuration>
```

### 告警配置

在`config/alarm-settings.yml`中配置告警规则:

```yaml
# 告警规则配置
rules:
  # 服务响应时间告警
  service_sla_rule:
    metrics-name: service_sla
    threshold: 8000  # 阈值:8秒
    op: "<"
    period: 10  # 检查周期:10分钟
    count: 3  # 连续3次
    message: "服务 {name} 的平均响应时间在最近10分钟内超过8秒,当前值: {value}"
  # 服务成功率告警
  service_resp_time_rule:
    metrics-name: service_resla
    threshold: 8000
    op: ">"
    period: 10
    count: 2
    message: "服务 {name} 的成功率在最近10分钟内低于阈值"
  # 端点响应时间告警
  endpoint_sla_rule:
    metrics-name: endpoint_sla
    threshold: 1000
    op: "<"
    period: 10
    count: 2
    message: "端点 {name} 的平均响应时间在最近10分钟内超过1秒"
# Webhook通知配置
webhooks:
  - http://your-webhook-url/alarm  # Webhook地址
```

## 最佳实践

### 1. 生产环境配置建议

1. **使用Elasticsearch作为存储**: H2内存数据库不适合生产环境,建议使用Elasticsearch或MySQL
2. **配置采样率**: 生产环境建议设置合理的采样率,比如10%-30%,避免产生过多数据
3. **配置告警规则**: 根据业务需求配置告警规则,及时发现问题
4. **集群部署**: OAP服务建议集群部署,提高可用性
5. **监控Agent性能**: 注意Agent对应用性能的影响,必要时调整配置

### 2. 性能优化建议

1. **合理设置采样率**: 不是所有请求都需要追踪,设置合理的采样率可以降低性能开销
2. **配置忽略路径**: 静态资源、健康检查等路径可以配置为忽略,减少不必要的追踪
3. **限制Span数量**: 配置`agent.span_limit_per_segment`限制每个Segment的最大Span数量
4. **异步发送数据**: Agent会异步发送数据给OAP,减少对业务的影响

### 3. 问题排查建议

1. **查看Trace详情**: 通过Trace详情可以看到完整的调用链,快速定位问题
2. **查看日志关联**: 日志会自动关联到Trace,方便查看上下文信息
3. **查看性能指标**: 通过性能指标可以看到服务的健康状态
4. **配置告警**: 配置合理的告警规则,及时发现问题

### 4. 常见问题

1. **Agent未生效**: 检查`-javaagent`参数是否正确,Agent路径是否正确
2. **数据未显示**: 检查OAP服务是否启动,Agent配置的OAP地址是否正确
3. **性能影响**: 检查采样率配置,必要时降低采样率
4. **内存占用高**: 检查存储配置,考虑使用外部存储而不是H2内存数据库

## 总结

SkyWalking是一个功能强大的APM工具,通过Java Agent实现无侵入的应用性能监控;整合到Spring Boot 4应用非常简单,只需要在启动时加上`-javaagent`参数即可;SkyWalking提供了完整的分布式追踪、服务拓扑、性能监控等功能,可以帮助我们快速定位和解决问题;在生产环境中使用SkyWalking时,要注意配置合理的采样率、使用合适的存储后端、配置告警规则等,确保监控系统稳定运行。

通过本教程,你应该已经掌握了Spring Boot 4整合SkyWalking的基本方法;实际使用时,可以根据业务需求进行更详细的配置和优化,让SkyWalking发挥更大的作用。
