# 01、Spring Boot Admin - 简介+服务端搭建
- 来源：https://ddkk.com/zhuanlan/monitoring/springbootadmin/1.html
- 分类：监控工具
- 分组：教程目录
## 什么是Spring Boot Admin

由团队codecentric开发的一个社区项目，用于管理和监控spring boot应用,可通过服务发现组件或者客户端直接注册监控。

## 功能

- 显示健康状况
- 显示详细信息，例如:
- JVM和内存指标

- micrometer.io指标

- 数据源指标

- 缓存指标

显示内部编号
关注并下载日志文件
查看JVM系统和环境属性
查看Spring Boot配置属性
支持Spring Cloud的可发布/ env-和// refresh-endpoint
轻松的日志级别管理
与JMX-beans交互
查看线程转储
查看http-traces
查看审核事件
查看http端点
查看预定的任务
查看和删除活动会话（使用spring-session）
查看Flyway / Liquibase数据库迁移
下载heapdump
状态更改通知（通过电子邮件，Slack，Hipchat等）
状态更改的事件日志（非持久性）

## 搭建服务端

**1、** 创建parent，指定springboo/cloud等版本；

**2、** 创建子工程；

**3、** pom加入依赖；

```java
    <dependencies>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-actuator</artifactId>
        </dependency>
        <dependency>
            <groupId>de.codecentric</groupId>
            <artifactId>spring-boot-admin-starter-server</artifactId>
            <version>2.3.0</version>
        </dependency>
```

**1、** 添加启动类；

```java
package org.pearl.devops.admin;
import de.codecentric.boot.admin.server.config.EnableAdminServer;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
/**
 * Created by TD on 2020/10/26
 */
@EnableAdminServer
@SpringBootApplication
public class AdminApplication {
    public static void main(String[] args) {
        SpringApplication.run(AdminApplication.class,args);
    }
}
```

**1、** 添加配置文件；

```java
spring:
  application:
    name: pearl-admin
server:
  port: 9099
management:
  endpoints:
    web:
      exposure:
        include: '*'
  endpoint:
    health:
      show-details: always
```

**1、** 启动访问首页http://localhost:9099；
