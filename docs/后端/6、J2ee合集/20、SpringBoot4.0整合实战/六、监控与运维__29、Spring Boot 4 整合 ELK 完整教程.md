# 29、Spring Boot 4 整合 ELK 完整教程
- 来源：https://ddkk.com/springboot/4-action/29.html
- 分类：Spring Boot 4 整合教程
- 分组：六、监控与运维
- 日期：2025-12-08
做微服务日志管理的时候,最头疼的就是日志收集和分析,应用日志分散在各个服务器上,出了问题咋排查?总不能每台服务器都登录上去看日志吧;而且日志格式不统一、查询不方便、分析困难,这些问题都让人头大;后来听说ELK这玩意儿不错,是Elasticsearch、Logstash、Kibana的简称,日志收集、存储、分析、可视化一应俱全,而且性能好、扩展性强;现在Spring Boot 4出来了,通过Logstash Logback Encoder整合ELK更是方便得不行,自动配置给你整得明明白白,咱今天就聊聊Spring Boot 4咋整合ELK的。

其实ELK在Spring Boot里早就支持了,你只要加个`logstash-logback-encoder`依赖,配置一下Logback,基本上就能用;但是很多兄弟不知道里面的门道,也不知道咋配置结构化日志、Logstash管道、Elasticsearch索引、Kibana仪表盘这些高级功能,所以鹏磊今天就给兄弟们掰扯掰扯。

## ELK基础概念

### ELK是啥玩意儿

ELK是Elasticsearch、Logstash、Kibana三个开源工具的简称,用于日志收集、存储、分析和可视化;ELK的核心组件包括:

1. **Elasticsearch**: 分布式搜索和分析引擎,用于存储和检索日志数据
2. **Logstash**: 数据收集和处理管道,用于收集、转换和发送日志数据
3. **Kibana**: 数据可视化平台,用于在Elasticsearch中搜索、查看和交互数据

### ELK的核心概念

1. **索引(Index)**: Elasticsearch中存储数据的逻辑分区,类似于数据库中的表
2. **文档(Document)**: Elasticsearch中存储的基本数据单元,类似于数据库中的行
3. **映射(Mapping)**: 定义文档的结构和字段类型,类似于数据库中的表结构
4. **管道(Pipeline)**: Logstash中处理数据的流程,包括输入、过滤、输出三个阶段
5. **输入(Input)**: Logstash数据来源,比如文件、TCP、Beats等
6. **过滤(Filter)**: Logstash数据处理逻辑,比如解析、转换、丰富数据等
7. **输出(Output)**: Logstash数据目标,比如Elasticsearch、文件、Kafka等

### ELK的工作流程

1. **应用日志**: Spring Boot应用通过Logstash Logback Encoder输出JSON格式的结构化日志
2. **Logstash收集**: Logstash通过TCP或文件输入收集日志数据
3. **Logstash处理**: Logstash对日志进行解析、转换、丰富等处理
4. **Elasticsearch存储**: 处理后的日志数据存储到Elasticsearch中
5. **Kibana可视化**: 通过Kibana查询、分析和可视化日志数据

### Logstash Logback Encoder是啥玩意儿

Logstash Logback Encoder是一个Java库,用于将Logback日志输出为JSON格式,方便与Logstash集成;它的核心特性包括:

1. **结构化日志**: 将日志输出为JSON格式,包含时间戳、级别、消息、MDC等字段
2. **高性能**: 使用异步Appender,不影响应用性能
3. **灵活配置**: 支持自定义字段、字段过滤、字段重命名等
4. **安全支持**: 支持字段脱敏,保护敏感信息

## 项目搭建和依赖配置

### 创建Maven项目

首先你得有个Maven项目,用IDEA或者Eclipse都行,或者直接用Spring Initializr生成;项目结构大概是这样:

```plaintext
spring-boot-elk-demo/
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
│   │       └── logback-spring.xml                    # Logback配置
│   └── test/
│       └── java/                                     # 测试代码目录
```

### pom.xml完整配置

这是最关键的,依赖配置不对后面全是坑;Spring Boot 4需要Java 17以上,而且Logstash Logback Encoder版本要选对。

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
    <artifactId>spring-boot-elk-demo</artifactId>
    <version>1.0.0</version>
    <packaging>jar</packaging>
    <name>Spring Boot 4 ELK Demo</name>
    <description>Spring Boot 4整合ELK示例项目</description>
    <properties>
        <java.version>17</java.version>  <!-- Java 17以上 -->
        <maven.compiler.source>17</maven.compiler.source>
        <maven.compiler.target>17</maven.compiler.target>
        <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
        <logstash-logback-encoder.version>8.0</logstash-logback-encoder.version>  <!-- Logstash Logback Encoder版本 -->
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
        <!-- Logstash Logback Encoder: 结构化日志编码器 -->
        <dependency>
            <groupId>net.logstash.logback</groupId>
            <artifactId>logstash-logback-encoder</artifactId>
            <version>${logstash-logback-encoder.version}</version>
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

```yaml
# 服务器配置
server:
  port: 8080  # 服务端口
# Spring应用配置
spring:
  application:
    name: spring-boot-elk-demo  # 应用名称
# 日志配置
logging:
  level:
    root: INFO  # 根日志级别
    com.example.demo: DEBUG  # 应用包日志级别
  file:
    name: logs/application.log  # 日志文件路径
  pattern:
    # 控制台日志格式
    console: "%d{yyyy-MM-dd HH:mm:ss.SSS} [%thread] %-5level %logger{36} - %msg%n"
    # 文件日志格式(使用JSON格式)
    file: "%d{yyyy-MM-dd HH:mm:ss.SSS} [%thread] %-5level %logger{36} - %msg%n"
```

## Logback配置

### logback-spring.xml完整配置

创建`logback-spring.xml`文件,配置Logstash Logback Encoder:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
    <!-- 引入Spring Boot默认配置 -->
    <include resource="org/springframework/boot/logging/logback/defaults.xml"/>
    <!-- 应用名称属性 -->
    <springProperty scope="context" name="springAppName" source="spring.application.name"/>
    <!-- 控制台输出Appender -->
    <appender name="CONSOLE" class="ch.qos.logback.core.ConsoleAppender">
        <encoder>
            <pattern>${CONSOLE_LOG_PATTERN}</pattern>
        </encoder>
    </appender>
    <!-- 文件输出Appender(JSON格式) -->
    <appender name="FILE" class="ch.qos.logback.core.rolling.RollingFileAppender">
        <file>logs/application.log</file>
        <!-- 使用LogstashEncoder输出JSON格式 -->
        <encoder class="net.logstash.logback.encoder.LogstashEncoder">
            <!-- 自定义字段,添加到所有日志条目 -->
            <customFields>{"application":"${springAppName}","version":"1.0.0","environment":"dev"}</customFields>
            <!-- 包含MDC字段 -->
            <includeMdc>true</includeMdc>
            <!-- 包含调用者数据(类、方法、行号),影响性能,生产环境建议关闭 -->
            <includeCallerData>false</includeCallerData>
            <!-- 包含上下文名称 -->
            <includeContext>true</includeContext>
            <!-- 包含结构化参数 -->
            <includeStructuredArguments>true</includeStructuredArguments>
            <!-- 时间戳格式 -->
            <timestampPattern>yyyy-MM-dd'T'HH:mm:ss.SSS'Z'</timestampPattern>
            <timezone>UTC</timezone>
            <!-- 缩短Logger名称长度 -->
            <shortenedLoggerNameLength>36</shortenedLoggerNameLength>
        </encoder>
        <!-- 滚动策略 -->
        <rollingPolicy class="ch.qos.logback.core.rolling.SizeAndTimeBasedRollingPolicy">
            <!-- 日志文件命名模式 -->
            <fileNamePattern>logs/application.%d{yyyy-MM-dd}.%i.log</fileNamePattern>
            <!-- 单个文件最大大小 -->
            <maxFileSize>100MB</maxFileSize>
            <!-- 保留历史文件天数 -->
            <maxHistory>30</maxHistory>
            <!-- 总大小限制 -->
            <totalSizeCap>10GB</totalSizeCap>
            <!-- 启动时清理历史文件 -->
            <cleanHistoryOnStart>false</cleanHistoryOnStart>
        </rollingPolicy>
    </appender>
    <!-- TCP Socket Appender(直接发送到Logstash) -->
    <appender name="LOGSTASH_TCP" class="net.logstash.logback.appender.LogstashTcpSocketAppender">
        <!-- Logstash地址和端口 -->
        <destination>localhost:4560</destination>
        <!-- 或者配置多个地址实现高可用 -->
        <!-- 
        <destination>logstash1.example.com:4560</destination>
        <destination>logstash2.example.com:4560</destination>
        -->
        <!-- 连接策略 -->
        <connectionStrategy>
            <!-- 优先使用主连接,失败后使用备用连接 -->
            <preferPrimary>
                <!-- 备用连接TTL,5分钟后尝试重新连接主连接 -->
                <secondaryConnectionTTL>5 minutes</secondaryConnectionTTL>
            </preferPrimary>
        </connectionStrategy>
        <!-- 重连延迟 -->
        <reconnectionDelay>30 seconds</reconnectionDelay>
        <!-- 写入超时 -->
        <writeTimeout>10 seconds</writeTimeout>
        <!-- Keep-alive配置 -->
        <keepAliveDuration>5 minutes</keepAliveDuration>
        <keepAliveMessage>UNIX</keepAliveMessage>
        <!-- 异步处理配置 -->
        <ringBufferSize>8192</ringBufferSize>
        <waitStrategyType>sleeping</waitStrategyType>
        <!-- 编码器配置 -->
        <encoder class="net.logstash.logback.encoder.LogstashEncoder">
            <!-- 自定义字段 -->
            <customFields>{"application":"${springAppName}","version":"1.0.0","environment":"dev"}</customFields>
            <!-- 包含MDC -->
            <includeMdc>true</includeMdc>
            <!-- 包含上下文 -->
            <includeContext>true</includeContext>
            <!-- 包含结构化参数 -->
            <includeStructuredArguments>true</includeStructuredArguments>
            <!-- 时间戳格式 -->
            <timestampPattern>yyyy-MM-dd'T'HH:mm:ss.SSS'Z'</timestampPattern>
            <timezone>UTC</timezone>
        </encoder>
    </appender>
    <!-- 异步Appender包装器(提高性能) -->
    <appender name="ASYNC_LOGSTASH" class="net.logstash.logback.appender.AsyncDisruptorAppender">
        <!-- 引用的Appender -->
        <appender-ref ref="LOGSTASH_TCP"/>
        <!-- 队列大小 -->
        <queueSize>8192</queueSize>
        <!-- 是否包含调用者数据 -->
        <includeCallerData>false</includeCallerData>
        <!-- 丢弃策略: 当队列满时丢弃最旧的日志 -->
        <discardingThreshold>0</discardingThreshold>
    </appender>
    <!-- 根Logger配置 -->
    <root level="INFO">
        <!-- 控制台输出 -->
        <appender-ref ref="CONSOLE"/>
        <!-- 文件输出 -->
        <appender-ref ref="FILE"/>
        <!-- Logstash输出(异步) -->
        <appender-ref ref="ASYNC_LOGSTASH"/>
    </root>
    <!-- 应用包Logger配置 -->
    <logger name="com.example.demo" level="DEBUG"/>
    <!-- Spring框架Logger配置 -->
    <logger name="org.springframework" level="INFO"/>
</configuration>
```

### 使用CompositeJsonEncoder的高级配置

如果需要更细粒度的控制,可以使用`LoggingEventCompositeJsonEncoder`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
    <include resource="org/springframework/boot/logging/logback/defaults.xml"/>
    <springProperty scope="context" name="springAppName" source="spring.application.name"/>
    <!-- 使用CompositeJsonEncoder进行更细粒度的控制 -->
    <appender name="LOGSTASH_COMPOSITE" class="net.logstash.logback.appender.LogstashTcpSocketAppender">
        <destination>localhost:4560</destination>
        <encoder class="net.logstash.logback.encoder.LoggingEventCompositeJsonEncoder">
            <providers>
                <!-- 时间戳 -->
                <timestamp>
                    <pattern>yyyy-MM-dd'T'HH:mm:ss.SSS'Z'</pattern>
                    <timeZone>UTC</timeZone>
                    <fieldName>@timestamp</fieldName>
                </timestamp>
                <!-- 日志级别 -->
                <logLevel>
                    <fieldName>level</fieldName>
                </logLevel>
                <!-- 日志级别数值 -->
                <logLevelValue>
                    <fieldName>severity_code</fieldName>
                </logLevelValue>
                <!-- Logger名称 -->
                <loggerName>
                    <fieldName>logger</fieldName>
                    <shortenedLoggerNameLength>36</shortenedLoggerNameLength>
                </loggerName>
                <!-- 线程名称 -->
                <threadName>
                    <fieldName>thread</fieldName>
                </threadName>
                <!-- 日志消息 -->
                <message>
                    <fieldName>message</fieldName>
                </message>
                <!-- MDC字段(带过滤) -->
                <mdc>
                    <!-- 只包含指定的MDC键 -->
                    <includeMdcKeyName>userId</includeMdcKeyName>
                    <includeMdcKeyName>requestId</includeMdcKeyName>
                    <includeMdcKeyName>traceId</includeMdcKeyName>
                    <!-- 排除指定的MDC键 -->
                    <excludeMdcKeyName>internalKey</excludeMdcKeyName>
                    <!-- 重命名MDC键 -->
                    <mdcKeyFieldName>requestId=request_id</mdcKeyFieldName>
                </mdc>
                <!-- 调用者数据(影响性能,谨慎使用) -->
                <callerData>
                    <classFieldName>class</classFieldName>
                    <methodFieldName>method</methodFieldName>
                    <lineFieldName>line</lineFieldName>
                    <fileFieldName>file</fileFieldName>
                </callerData>
                <!-- 堆栈跟踪 -->
                <stackTrace>
                    <fieldName>exception</fieldName>
                    <throwableConverter class="net.logstash.logback.stacktrace.ShortenedThrowableConverter">
                        <maxDepthPerThrowable>30</maxDepthPerThrowable>
                        <maxLength>8192</maxLength>
                        <shortenedClassNameLength>20</shortenedClassNameLength>
                        <exclude>sun\..*</exclude>
                        <exclude>java\.lang\.reflect\..*</exclude>
                        <rootCauseFirst>true</rootCauseFirst>
                    </throwableConverter>
                </stackTrace>
                <!-- 堆栈哈希(用于去重) -->
                <stackHash>
                    <fieldName>exception_hash</fieldName>
                    <exclude>^sun\..*</exclude>
                    <exclusions>java.lang.reflect</exclusions>
                </stackHash>
                <!-- 上下文名称 -->
                <contextName>
                    <fieldName>application</fieldName>
                </contextName>
                <!-- 标记数据 -->
                <tags>
                    <fieldName>tags</fieldName>
                </tags>
                <!-- 结构化参数 -->
                <arguments>
                    <includeStructuredArguments>true</includeStructuredArguments>
                    <includeNonStructuredArguments>false</includeNonStructuredArguments>
                </arguments>
                <!-- 序列号 -->
                <sequence>
                    <fieldName>sequence</fieldName>
                </sequence>
                <!-- UUID -->
                <uuid>
                    <fieldName>log_id</fieldName>
                    <strategy>random</strategy>
                </uuid>
                <!-- 自定义静态字段 -->
                <pattern>
                    <pattern>
                        {
                            "service": "${springAppName}",
                            "version": "1.0.0",
                            "environment": "dev"
                        }
                    </pattern>
                </pattern>
            </providers>
        </encoder>
    </appender>
    <root level="INFO">
        <appender-ref ref="LOGSTASH_COMPOSITE"/>
    </root>
</configuration>
```

## 启动类和Controller

### 启动类

```java
package com.example.demo;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
/**
 * Spring Boot 4 ELK示例应用启动类
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

创建一个Controller用于测试日志输出:

```java
package com.example.demo.controller;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.HashMap;
import java.util.Map;
import static net.logstash.logback.argument.StructuredArguments.*;
/**
 * 测试Controller,用于验证日志输出
 * 
 * @author penglei
 */
@RestController
@RequestMapping("/api")
public class TestController {
    private static final Logger logger = LoggerFactory.getLogger(TestController.class);
    /**
     * 测试接口,输出各种级别的日志
     * 
     * @return 包含消息的Map对象
     */
    @GetMapping("/test")
    public Map<String, Object> test() {
        // 设置MDC上下文信息
        MDC.put("requestId", java.util.UUID.randomUUID().toString());
        MDC.put("userId", "user123");
        MDC.put("traceId", "trace456");
        try {
            // 输出INFO级别日志,使用结构化参数
            logger.info("处理请求开始", 
                keyValue("endpoint", "/api/test"),
                keyValue("method", "GET"),
                keyValue("ip", "192.168.1.100"));
            // 模拟业务处理
            Thread.sleep(100);
            // 输出DEBUG级别日志
            logger.debug("业务处理完成", 
                keyValue("duration", 100),
                keyValue("status", "success"));
            Map<String, Object> result = new HashMap<>();
            result.put("message", "Hello, Spring Boot 4 ELK!");
            result.put("timestamp", System.currentTimeMillis());
            // 输出INFO级别日志,包含结果
            logger.info("处理请求完成", 
                keyValue("result", result),
                keyValue("status", "success"));
            return result;
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            // 输出ERROR级别日志,包含异常
            logger.error("处理请求失败", e,
                keyValue("endpoint", "/api/test"),
                keyValue("error", e.getMessage()));
            throw new RuntimeException("Request processing failed", e);
        } finally {
            // 清理MDC
            MDC.clear();
        }
    }
    /**
     * 模拟错误接口,用于测试异常日志
     * 
     * @return 响应
     */
    @GetMapping("/error")
    public Map<String, Object> error() {
        MDC.put("requestId", java.util.UUID.randomUUID().toString());
        try {
            logger.warn("模拟错误请求", 
                keyValue("endpoint", "/api/error"));
            // 故意抛出异常
            throw new RuntimeException("模拟业务异常");
        } catch (Exception e) {
            // 输出ERROR级别日志,包含完整堆栈跟踪
            logger.error("处理请求时发生异常", e,
                keyValue("endpoint", "/api/error"),
                keyValue("exception_type", e.getClass().getName()));
            Map<String, Object> result = new HashMap<>();
            result.put("error", e.getMessage());
            result.put("timestamp", System.currentTimeMillis());
            return result;
        } finally {
            MDC.clear();
        }
    }
}
```

## Logstash配置

### Logstash安装

从Elastic官网下载Logstash: https://www.elastic.co/downloads/logstash

```bash
# 下载Logstash
wget https://artifacts.elastic.co/downloads/logstash/logstash-8.19.0-linux-x86_64.tar.gz
# 解压
tar -xzf logstash-8.19.0-linux-x86_64.tar.gz
cd logstash-8.19.0
```

### Logstash配置文件

创建`logstash-spring-boot.conf`配置文件:

```ruby
input {
  # TCP输入,接收来自Spring Boot应用的日志
  tcp {
    port => 4560  # 监听端口
    codec => json_lines  # 使用JSON行格式解码器
    type => "spring-boot"  # 日志类型
  }
  # 文件输入(可选,用于读取日志文件)
  # file {
  #   path => "/path/to/logs/application.log"
  #   start_position => "beginning"
  #   codec => json_lines
  #   type => "spring-boot-file"
  # }
}
filter {
  # 如果日志类型是spring-boot
  if [type] == "spring-boot" {
    # 解析时间戳
    date {
      match => [ "@timestamp", "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'" ]
      target => "@timestamp"
    }
    # 添加主机信息
    mutate {
      add_field => {
        "hostname" => "%{host}"
        "log_type" => "application"
      }
    }
    # 解析MDC字段(如果存在)
    if [mdc] {
      mutate {
        add_field => {
          "request_id" => "%{[mdc][requestId]}"
          "user_id" => "%{[mdc][userId]}"
          "trace_id" => "%{[mdc][traceId]}"
        }
      }
    }
    # 解析自定义字段
    if [application] {
      mutate {
        add_field => {
          "app_name" => "%{application}"
          "app_version" => "%{version}"
          "app_env" => "%{environment}"
        }
      }
    }
    # 解析异常信息(如果存在)
    if [exception] {
      grok {
        match => {
          "exception" => "(?m)^%{JAVACLASS:exception_class}: %{GREEDYDATA:exception_message}"
        }
      }
    }
    # 移除不需要的字段
    mutate {
      remove_field => [ "host" ]
    }
  }
}
output {
  # 输出到Elasticsearch
  elasticsearch {
    hosts => ["localhost:9200"]  # Elasticsearch地址
    index => "spring-boot-logs-%{+YYYY.MM.dd}"  # 索引名称,按日期分割
    # 或者使用动态索引名称
    # index => "%{[app_name]}-logs-%{+YYYY.MM.dd}"
    # 认证配置(如果Elasticsearch启用了安全)
    # user => "elastic"
    # password => "your-password"
    # 模板配置
    template_name => "spring-boot-logs"
    template => "/path/to/logstash/templates/spring-boot-logs-template.json"
    template_overwrite => true
  }
  # 输出到控制台(用于调试)
  stdout {
    codec => rubydebug
  }
}
```

### 启动Logstash

```bash
# 启动Logstash
./bin/logstash -f logstash-spring-boot.conf
# 或者使用配置文件目录
./bin/logstash --path.config=/path/to/config/dir
```

## Elasticsearch配置

### Elasticsearch安装

从Elastic官网下载Elasticsearch: https://www.elastic.co/downloads/elasticsearch

```bash
# 下载Elasticsearch
wget https://artifacts.elastic.co/downloads/elasticsearch/elasticsearch-8.19.0-linux-x86_64.tar.gz
# 解压
tar -xzf elasticsearch-8.19.0-linux-x86_64.tar.gz
cd elasticsearch-8.19.0
```

### Elasticsearch配置文件

编辑`config/elasticsearch.yml`:

```yaml
# 集群名称
cluster.name: spring-boot-elk-cluster
# 节点名称
node.name: node-1
# 数据目录
path.data: /var/lib/elasticsearch
# 日志目录
path.logs: /var/log/elasticsearch
# 网络配置
network.host: 0.0.0.0
http.port: 9200
# 发现配置(单节点)
discovery.type: single-node
# 安全配置(生产环境建议启用)
# xpack.security.enabled: true
# xpack.security.transport.ssl.enabled: true
```

### 启动Elasticsearch

```bash
# 启动Elasticsearch
./bin/elasticsearch
# 或者作为守护进程启动
./bin/elasticsearch -d
```

### 验证Elasticsearch

```bash
# 检查Elasticsearch是否运行
curl http://localhost:9200
# 返回示例
{
  "name" : "node-1",
  "cluster_name" : "spring-boot-elk-cluster",
  "cluster_uuid" : "...",
  "version" : {
    "number" : "8.19.0",
    ...
  }
}
```

## Kibana配置

### Kibana安装

从Elastic官网下载Kibana: https://www.elastic.co/downloads/kibana

```bash
# 下载Kibana
wget https://artifacts.elastic.co/downloads/kibana/kibana-8.19.0-linux-x86_64.tar.gz
# 解压
tar -xzf kibana-8.19.0-linux-x86_64.tar.gz
cd kibana-8.19.0
```

### Kibana配置文件

编辑`config/kibana.yml`:

```yaml
# 服务器配置
server.port: 5601
server.host: "0.0.0.0"
# Elasticsearch配置
elasticsearch.hosts: ["http://localhost:9200"]
# 索引模式
kibana.index: ".kibana"
# 日志配置
logging.appenders:
  file:
    type: file
    fileName: /var/log/kibana/kibana.log
    layout:
      type: json
```

### 启动Kibana

```bash
# 启动Kibana
./bin/kibana
# 或者作为守护进程启动
nohup ./bin/kibana > /dev/null 2>&1 &
```

### 访问Kibana

启动后访问 http://localhost:5601 打开Kibana界面。

## Kibana索引模式配置

### 创建索引模式

1. 登录Kibana后,进入"Management" -> "Stack Management" -> "Index Patterns"
2. 点击"Create index pattern"
3. 输入索引模式: `spring-boot-logs-*`
4. 选择时间字段: `@timestamp`
5. 点击"Create index pattern"

### 创建可视化仪表盘

1. 进入"Analytics" -> "Discover"查看日志
2. 进入"Analytics" -> "Visualize Library"创建可视化
3. 常用的可视化类型:

- **Data Table**: 日志列表
- **Line Chart**: 时间序列图表
- **Pie Chart**: 分类统计
- **Metric**: 指标统计

## 字段脱敏配置

### 配置字段脱敏

在Logback配置中添加字段脱敏:

```xml
<encoder class="net.logstash.logback.encoder.LoggingEventCompositeJsonEncoder">
    <!-- 配置字段脱敏装饰器 -->
    <jsonGeneratorDecorator class="net.logstash.logback.mask.MaskingJsonGeneratorDecorator">
        <!-- 按字段路径脱敏 -->
        <path>password</path>
        <path>creditCard</path>
        <path>ssn</path>
        <path>user/token</path>
        <path>config/apiKey</path>
        <!-- 按字段名称脱敏(任何位置) -->
        <fieldName>secret</fieldName>
        <fieldName>apiKey</fieldName>
        <!-- 默认脱敏掩码 -->
        <defaultMask>****</defaultMask>
        <!-- 按正则表达式脱敏值 -->
        <valueMask>
            <!-- 信用卡号: 保留前4位和后4位 -->
            <value>(\d{4})\d{8}(\d{4})</value>
            <mask>$1********$2</mask>
        </valueMask>
        <valueMask>
            <!-- 邮箱: 脱敏用户名部分 -->
            <value>([^@]{2})[^@]+(@.+)</value>
            <mask>$1***$2</mask>
        </valueMask>
        <valueMask>
            <!-- 手机号: 保留区号 -->
            <value>(\d{3})(\d{3})(\d{4})</value>
            <mask>$1-***-****</mask>
        </valueMask>
    </jsonGeneratorDecorator>
    <providers>
        <timestamp/>
        <message/>
        <loggerName/>
        <logLevel/>
        <mdc/>
        <stackTrace/>
    </providers>
</encoder>
```

## 生产环境最佳实践

### 1. 日志格式规范

- 使用结构化日志(JSON格式)
- 统一字段命名规范
- 包含必要的上下文信息(请求ID、用户ID、追踪ID等)

### 2. 性能优化

- 使用异步Appender避免阻塞
- 合理设置队列大小
- 关闭不必要的字段(如调用者数据)

### 3. 安全配置

- 配置字段脱敏保护敏感信息
- 使用HTTPS/TLS加密传输
- 配置Elasticsearch安全认证

### 4. 索引管理

- 使用日期分割索引,便于管理
- 配置索引生命周期策略,自动删除旧数据
- 设置合理的分片和副本数

### 5. 监控告警

- 配置Kibana告警规则
- 监控日志量、错误率等指标
- 设置异常日志告警

## 总结

Spring Boot 4整合ELK非常简单,只需要添加`logstash-logback-encoder`依赖和配置Logback就能使用;ELK提供了完整的日志收集、存储、分析和可视化解决方案,是微服务日志管理的首选方案;通过Logstash Logback Encoder可以轻松输出结构化JSON日志,通过Logstash进行数据处理和转发,通过Elasticsearch进行存储和检索,通过Kibana进行可视化和分析;在生产环境中,要注意日志格式规范、性能优化、安全配置和索引管理,确保日志系统的稳定性和可靠性。

好了,今天就聊到这里,兄弟们有啥问题可以留言,鹏磊看到会及时回复的。
