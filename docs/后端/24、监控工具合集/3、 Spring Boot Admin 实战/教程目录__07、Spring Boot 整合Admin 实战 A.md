# 07、Spring Boot 整合Admin 实战 A
- 来源：https://ddkk.com/zhuanlan/monitoring/springbootadmin/7.html
- 分类：监控工具
- 分组：教程目录
## 1 SpringBootAdmin 简介

### 1.1 概述

SpringBootAdmin 是一个非常好用的监控和管理的开源组件，该组件能够将 Actuator 中的信息进行界面化的展示，也可以监控所有 Spring Boot 应用的健康状况，提供实时警报功能。

### 1.2 功能特性

- 显示应用程序的监控状态
- 应用程序上下线监控
- 查看 JVM，线程信息
- 可视化的查看日志以及下载日志文件
- 动态切换日志级别
- Http 请求信息跟踪
- …

## 2 Server端整合

### 2.1 添加pom配置

```xml
<!--Admin+Actuator 健康信息健康-->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-actuator</artifactId>
</dependency>
<dependency>
    <groupId>de.codecentric</groupId>
    <artifactId>spring-boot-admin-starter-server</artifactId>
</dependency>
<dependency>
    <groupId>de.codecentric</groupId>
    <artifactId>spring-boot-admin-starter-client</artifactId>
</dependency>
```

### 2.2 配置yaml参数

```sh
# Boot参数配置信息
spring:
  application:
    name: xs-monitor-server
  profiles:
    active: dev
  boot:
    admin:
      monitor:
        default-timeout: 5000
      client:
        url: http://localhost:${
     server.port}${
     spring.boot.admin.context-path}
       注册实例 优先使用IP
        instance:
          prefer-ip: true
      监控访问前缀信息
      context-path: /admin
# Actuator 监控端点的配置项
management:
  health:
    mail:
      enabled: false
  endpoints:
    web:
      base-path: /actuator
      exposure:
        include: '*'
  endpoint:
    health:
      show-details: always
    logfile:
      external-file: ${
     user.dir}/logs/${
     spring.profiles.active}/xs-monitor/xs-monitor-server/sys-console.log
```

### 2.3 编辑config配置信息

```java
package com.xs.monitor.config;
import de.codecentric.boot.admin.server.config.EnableAdminServer;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.boot.autoconfigure.task.TaskExecutionAutoConfiguration;
import org.springframework.boot.task.TaskExecutorBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Lazy;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;
import java.util.concurrent.Executor;
// @EnableAdminServer 添加此注解表示启用Admin监控
@Configuration
@EnableAdminServer
public class AdminServerConfig {
    @Lazy
    @Bean(name = TaskExecutionAutoConfiguration.APPLICATION_TASK_EXECUTOR_BEAN_NAME)
    @ConditionalOnMissingBean(Executor.class)
    public ThreadPoolTaskExecutor applicationTaskExecutor(TaskExecutorBuilder builder) {
        return builder.build();
    }
}
```

### 2.4 启动Server

### 2.5 管理端查看

## 3 Client业务端整合

### 3.1 添加pom配置

- 业务端只需要client组件,不再需要Server端

```xml
<!--Spring Boot Admin 健康模块-->
<dependency>
    <groupId>de.codecentric</groupId>
    <artifactId>spring-boot-admin-starter-client</artifactId>
</dependency>
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-actuator</artifactId>
</dependency>
```

### 3.2 配置yaml参数

```sh
#配置
spring:
  application:
    name: xs-monitor-client
  profiles:
    active: dev
  boot:
    admin:
      client:
        url: http://localhost:1000/admin
       注册实例 优先使用IP
        instance:
          prefer-ip: true
# Actuator 监控端点的配置项
management:
  health:
    mail:
      enabled: false
  endpoints:
    web:
      base-path: /actuator
      exposure:
        include: '*'
  endpoint:
    health:
      show-details: always
    logfile:
      external-file: ${
     user.dir}/logs/${
     spring.profiles.active}/xs-monitor/xs-monitor-client/sys-console.log
```

### 3.3 新增Config配置

```java
package com.xs.monitor.config;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.boot.autoconfigure.task.TaskExecutionAutoConfiguration;
import org.springframework.boot.task.TaskExecutorBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Lazy;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;
import java.util.concurrent.Executor;
@Configuration
public class AdminServerConfig {
    @Lazy
    @Bean(name = TaskExecutionAutoConfiguration.APPLICATION_TASK_EXECUTOR_BEAN_NAME)
    @ConditionalOnMissingBean(Executor.class)
    public ThreadPoolTaskExecutor applicationTaskExecutor(TaskExecutorBuilder builder) {
        return builder.build();
    }
}
```

### 3.4 启动Client业务端

### 3.5 查看管理端【server地址】

## 4 整体演示
