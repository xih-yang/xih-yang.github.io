# 02、Spring Boot Admin - Spring Boot Admin集成Nacos
- 来源：https://ddkk.com/zhuanlan/monitoring/springbootadmin/2.html
- 分类：监控工具
- 分组：教程目录
## 前言

在使用Admin时，如果没有注册中心，需要各个客户端填写admin服务端地址，而admin是支持Nacos、Eurake、ZooKeeper等组件，直接从注册中心拉取服务实例

## 集成步骤

**1、** 参照系列(1)搭建服务端；

**2、** parent项目加入alibaba版本依赖控制；

```java
 <dependencyManagement>
        <dependencies>
            <dependency>
                <groupId>com.alibaba.cloud</groupId>
                <artifactId>spring-cloud-alibaba-dependencies</artifactId>
                <version>2.2.2.RELEASE</version>
                <type>pom</type>
                <scope>import</scope>
            </dependency>
</dependencyManagement>
```

**1、** admin项目加入nacos注册依赖；

```java
        <dependency>
            <groupId>com.alibaba.cloud</groupId>
            <artifactId>spring-cloud-starter-alibaba-nacos-discovery</artifactId>
        </dependency>
```

**2、** admin项目yml配置添加nacos地址；

```java
spring:
  application:
    name: pearl-admin
  cloud:
    nacos:
      discovery:
        server-addr: 127.0.0.1:8848     nacos注册地址
```

**2、** parent下创建一个客户端项目，添加pom；

```xml
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
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-test</artifactId>
        <scope>test</scope>
    </dependency>
    <dependency>
        <groupId>org.projectlombok</groupId>
        <artifactId>lombok</artifactId>
    </dependency>
    <!--Alibaba Start-->
    <dependency>
        <groupId>com.alibaba.cloud</groupId>
        <artifactId>spring-cloud-starter-alibaba-nacos-discovery</artifactId>
    </dependency>
    <dependency>
        <groupId>de.codecentric</groupId>
        <artifactId>spring-boot-admin-starter-client</artifactId>
        <version>2.3.0</version>
    </dependency>
</dependencies>
```

**4、** 客户端项目添加yml配置；

```sh
server:
  port: 10002
spring:
  application:
    name: test-01
  cloud:
    nacos:
      discovery:
        server-addr: localhost:8848
management:
  endpoints:
    web:
      exposure:
        include: '*'
  endpoint:
    health:
      show-details: always
```

**5、** 启动nacos及搭建的两个springboot项目访问admin首页；
