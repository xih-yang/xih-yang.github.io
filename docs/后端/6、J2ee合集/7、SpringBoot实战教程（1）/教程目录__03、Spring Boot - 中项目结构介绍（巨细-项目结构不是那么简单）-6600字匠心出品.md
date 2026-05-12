# 03、Spring Boot - 中项目结构介绍（巨细-项目结构不是那么简单）-6600字匠心出品
- 来源：https://ddkk.com/zhuanlan/j2ee/springboot/4/3.html
- 分类：J2EE框架
- 分组：教程目录
## 1.POM 文件

### 1.继承

```java
<parent>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-parent</artifactId>
    <version>2.3.1.RELEASE</version>
    <relativePath/> <!-- lookup parent from repository -->
</parent>
```

- Spring Boot 的父级依赖，只有继承它项目才是 Spring Boot 项目。
- spring-boot-starter-parent 是一个特殊的 starter，它用来提供相关的 Maven 默认依赖。使用它之后，常用的包依赖可以省去 version 标签。

### 2.依赖

```java
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-web</artifactId>
</dependency>
```

- 启动器依赖

### 3.插件

```java
<build>
    <plugins>
        <plugin>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-maven-plugin</artifactId>
        </plugin>
    </plugins>
</build>
```

- spring-boot-maven-plugin 插件是将 springboot 的应用程序打包成 jar 包的插件。将所有应用启动运行所需要的 jar 包都包含进来，从逻辑上将具备了独立运行的条件。当运行"mvn package"进行打包后，使用"java -jar"命令就可以直接运行。

## 2.启动类

- Spring Boot 的启动类的作用是启动 Spring Boot 项目，是基于 Main 方法来运行的。 注意：启动类在启动时会做注解扫描(@Controller、@Service、@Repository…)，扫描位置为同包或者子包下的注解，所以启动类的位置应放于包的根下。

### 1.启动类与启动器区别

- 启动类表示项目的启动入口
- 启动器表示 jar 包的坐标

### 2.创建启动类

```java
package com.decgm.springbootdemo;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
@SpringBootApplication
public class SpringBootDemo3Application {
    public static void main(String[] args) {
        SpringApplication.run(SpringBootDemo3Application.class,args);
    }
}
```

### 3.启动器

- Spring Boot 将所有的功能场景都抽取出来，做成一个个的 starter(启动器)，只需要在项目里面引入这些 starter 相关场景的所有依赖都会导入进来，要用什么功能就导入什么场景，在 jar 包管理上非常方便，最终实现一站式开发。

Spring Boot 提供了多达 44 个启动器：

- spring-boot-starter

这是 Spring Boot 的核心启动器，包含了自动配置、日志和 YAML。
- spring-boot-starter-actuator

帮助监控和管理应用。
- spring-boot-starter-web

支持全栈式 Web 开发，包括 Tomcat 和 spring-webmvc。
- spring-boot-starter-amqp

通过 spring-rabbit 来支持 AMQP 协议（Advanced Message Queuing Protocol）。
- spring-boot-starter-aop

支持面向方面的编程即 AOP，包括 spring-aop 和 AspectJ。
- spring-boot-starter-artemis

通过 Apache Artemis 支持 JMS 的 API（Java Message Service API）。
- spring-boot-starter-batch

支持 Spring Batch，包括 HSQLDB 数据库。
- spring-boot-starter-cache

支持 Spring 的 Cache 抽象。
- spring-boot-starter-cloud-connectors

支持 Spring Cloud Connectors，简化了在像 Cloud Foundry 或 Heroku 这样的云平台上连接服务。
- spring-boot-starter-data-elasticsearch

支持 ElasticSearch 搜索和分析引擎，包括 spring-data-elasticsearch。
- spring-boot-starter-data-gemfire

支持 GemFire 分布式数据存储，包括 spring-data-gemfire。
- spring-boot-starter-data-jpa

支持 JPA（Java Persistence API），包括 spring-data-jpa、spring-orm、Hibernate。
- spring-boot-starter-data-mongodb

支持 MongoDB 数据，包括 spring-data-mongodb。
- spring-boot-starter-data-rest

通过 spring-data-rest-webmvc，支持通过 REST 暴露 Spring Data 数据仓库。
- spring-boot-starter-data-solr

支持 Apache Solr 搜索平台，包括 spring-data-solr。
- spring-boot-starter-freemarker

支持 FreeMarker 模板引擎。
- spring-boot-starter-groovy-templates

支持 Groovy 模板引擎。
- spring-boot-starter-hateoas

通过 spring-hateoas 支持基于 HATEOAS 的 RESTful Web 服务。
- spring-boot-starter-hornetq

通过 HornetQ 支持 JMS。
- spring-boot-starter-integration

支持通用的 spring-integration 模块。
- spring-boot-starter-jdbc

支持 JDBC 数据库。
- spring-boot-starter-jersey

支持 Jersey RESTful Web 服务框架。
- spring-boot-starter-jta-atomikos

通过 Atomikos 支持 JTA 分布式事务处理。
- spring-boot-starter-jta-bitronix

通过 Bitronix 支持 JTA 分布式事务处理。
- spring-boot-starter-mail

支持 javax.mail 模块。
- spring-boot-starter-mobile

支持 spring-mobile。
- spring-boot-starter-mustache

支持 Mustache 模板引擎。
- spring-boot-starter-redis

支持 Redis 键值存储数据库，包括 spring-redis。
- spring-boot-starter-security

支持 spring-security。
- spring-boot-starter-social-facebook

支持 spring-social-facebook
- spring-boot-starter-social-linkedin

支持 pring-social-linkedin
- spring-boot-starter-social-twitter

支持 pring-social-twitter
- spring-boot-starter-test

支持常规的测试依赖，包括 JUnit、Hamcrest、Mockito 以及 spring-test 模块。
- spring-boot-starter-thymeleaf

支持 Thymeleaf 模板引擎，包括与 Spring 的集成。
- spring-boot-starter-velocity

支持 Velocity 模板引擎。
- spring-boot-starter-websocket

支持 WebSocket 开发。
- spring-boot-starter-ws

支持 Spring Web Services。
- spring-boot-starter-actuator

增加了面向产品上线相关的功能，比如测量和监控。
- spring-boot-starter-remote-shell

增加了远程 ssh shell 的支持。
- spring-boot-starter-jetty

引入了 Jetty HTTP 引擎（用于替换 Tomcat）。
- spring-boot-starter-log4j

支持 Log4J 日志框架。
- spring-boot-starter-logging

引入了 Spring Boot 默认的日志框架 Logback。
- spring-boot-starter-tomcat

引入了 Spring Boot 默认的 HTTP 引擎 Tomcat。
- spring-boot-starter-undertow

引入了 Undertow HTTP 引擎（用于替换 Tomcat）。

4.配置文件

- Spring Boot 提供一个名称为 application 的全局配置文件，支持两种格式 properteis 格式 与 YAML 格式。

### 1.Properties格式

- 配置 Tomcat 监听端口

server.port=8888

### 2.YAML格式

- YAML 格式配置文件的扩展名可以是 yaml 或者 yml。

**基本格式要求：**

- 大小写敏感
- 使用缩进代表层级关系
- 相同的部分只出现一次

**配置 Tomcat 监听端口：**

```java
server: 
    	port: 8888
```

### 3.配置文件存放位置

- 当前项目根目录中
- 当前项目根目录下的一个/config 子目录中
- 项目的 resources 即 classpath 根路径中
- 项目的 resources 即 classpath 根路径下的/config 目录中

### 4.配置文件加载顺序

**不同格式的加载顺序：**

- 如 果 同 一 个 目 录 下 ， 有 application.yml 也 有 application.properties ， 默认先读取 application.properties。
- 如果同一个配置属性，在多个配置文件都配置了，默认使用第 1 个读取到的，后面读取的不覆盖前面读取到的。

**不同位置的加载顺序：**

- 当前项目根目录下的一个/config 子目录中(最高)

config/application.properties

config/application.yml
- 当前项目根目录中(其次)

application.properties

application.yml
- 项目的 resources 即 classpath 根路径下的/config 目录中(一般)

resources/config/application.properties

resources/config/application.yml
- 项目的 resources 即 classpath 根路径中(最后)

resources/application.properties

resources/application.yml

### 5.配置文件中的占位符

**占位符语法：**

- 语法：${}

**占位符作用：**

- "${}"中可以获取框架提供的方法中的值如：random.int 等。
- 占位符可以获取配置文件中的键的值赋给另一个键作为值。

**生成随机数：**

- ${random.value} - 类似 uuid 的随机数，没有"-"连接
- ${random.int} - 随机取整型范围内的一个值
- ${random.long} - 随机取长整型范围内的一个值
- ${random.long(100,200)} - 随机生成长整型 100-200 范围内的一个值
- ${random.uuid} - 生成一个 uuid，有短杠连接
- ${random.int(10)} - 随机生成一个 10 以内的数
- ${random.int(100,200)} - 随机生成一个 100-200 范围以内的数

### 6.配置文件

**bootstrap 配置文件介绍：**

- Spring Boot 中有两种上下文对象，一种是 bootstrap, 另外一种是 application, bootstrap 是应用程序的父上下文，也就是说 bootstrap 加载优先于 applicaton。
- bootstrap 主要用于从额外的资源来加载配置信息，还可以在本地外部配置文件中解密属性。
- 这两个上下文共用一个环境，它是任何 Spring 应用程序的外部属性的来源。
- bootstrap 里面的属性会优先加载，它们默认也不能被本地相同配置覆盖。

**bootstrap 配置文件特征：**

- boostrap 由父 ApplicationContext 加载，比 applicaton 优先加载
- boostrap 里面的属性不能被覆盖。

**bootstrap 与 application 的应用场景：**

- application 配置文件主要用于 Spring Boot 项目的自动化配置。

bootstrap 配置文件有以下几个应用场景：

- 使用 Spring Cloud Config 配置中心时，这时需要在 bootstrap 配置文件中添加连接到配置中心的配置属性来加载外部配置中心的配置信息。
- 一些固定的不能被覆盖的属性。
- 一些加密/解密的场景。

5.Spring Boot 的核心注解

- @SpringBootApplication

是 SpringBoot 的启动类。

此注解等同于@Configuration+@EnableAutoConfiguration+@ComponentScan 的组合。
- @SpringBootConfiguration

@SpringBootConfiguration 注解是@Configuration 注解的派生注解，跟@Configuration 注解的功能一致，标注这个类是一个配置类，只不过@SpringBootConfiguration 是 springboot 的注解，而@Configuration 是 spring 的注解
- @Configuration

通过对 bean 对象的操作替代 spring 中 xml 文件
- @EnableAutoConfiguration

Spring Boot 自动配置（auto-configuration）：尝试根据你添加的 jar 依赖自动配置你的 Spring 应用。是@AutoConfigurationPackage 和@Import(AutoConfigurationImportSelector.class) 注解的组合。
- @AutoConfigurationPackage

@AutoConfigurationPackage 注解，自动注入主类下所在包下所有的加了注解的类 （@Controller，@Service 等），以及配置类（@Configuration）
- @Import({AutoConfigurationImportSelector.class})

直接导入普通的类

导入实现了 ImportSelector 接口的类

导入实现了 ImportBeanDefinitionRegistrar 接口的类
- @ComponentScan

组件扫描，可自动发现和装配一些 Bean。
- @ConfigurationPropertiesScan

@ConfigurationPropertiesScan 扫描配置属性。@EnableConfigurationProperties 注解的作 用是使用 @ConfigurationProperties 注解的类生效。
