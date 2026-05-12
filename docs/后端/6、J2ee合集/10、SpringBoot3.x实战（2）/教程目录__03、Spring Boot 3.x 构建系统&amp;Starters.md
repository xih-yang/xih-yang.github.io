# 03、Spring Boot 3.x 构建系统&amp;Starters
- 来源：https://ddkk.com/zhuanlan/j2ee/springboot/9/3.html
- 分类：Spring Boot 3.x 实战
- 分组：教程目录
Spring Boot 建议选择一个支持依赖项管理并能够使用发布到“`Maven Central`”存储库的构件的构建系统。一般可以选择`Maven`或`Gradle`。让Spring Boot与其他构建系统(例如`Ant`)一起工作是可能的，但它们并没有得到很好的支持。本文只介绍常用的`Maven`。

## 一、依赖管理

Spring Boot的每个版本都提供了一个它所支持的依赖项列表。在实践中，你不需要在构建配置中为这些依赖项提供一个版本，因为Spring Boot会为你管理它。当你升级Spring Boot本身时，这些依赖项也会以一致的方式升级。

## 二、Maven

`maven`项目引入Spring Boot框架有两种方式:

**1. 继承spring-boot-starter-parent**

```xml
<!-- Inherit defaults from Spring Boot -->
<parent>
	<groupId>org.springframework.boot</groupId>
	<artifactId>spring-boot-starter-parent</artifactId>
	<version>3.0.0-M2</version>
</parent>
```

这种方式只需要指定Spring Boot parent版本号,如果需要引入其它的starter无需指定版本。

使用这种方式，还可以通过覆盖自己项目中的属性来覆盖各个依赖项。例如，要使用不同版本的`SLF4J`库，你需要将以下内容添加到`pom.xml`中:

```xml
<properties>
    <slf4j.version>1.7.30</slf4j.version>
</properties>
```

**2. dependencyManagement**

可能有一些原因让你不从`spring-boot-starter-parent` POM继承。你可能需要使用自己的公司标准父组件，或者你可能更喜欢显式声明所有`Maven`配置。

如果你不想使用`spring-boot-starter-parent`，你仍然可以通过使用一个`import`作用域的依赖项来保持依赖管理，如下所示:

```xml
<dependencyManagement>
    <dependencies>
        <dependency>
            <!-- Import dependency management from Spring Boot -->
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-dependencies</artifactId>
            <version>3.0.0-M2</version>
            <type>pom</type>
            <scope>import</scope>
        </dependency>
    </dependencies>
</dependencyManagement>
```

正如上述例子所示,如果需要覆盖SLF4J的版本,此方式也可以实现：

```xml
<dependencyManagement>
    <dependencies>
        <dependency>
            <groupId>org.slf4j</groupId>
            <artifactId>slf4j-api</artifactId>
            <version>1.7.30</version>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-dependencies</artifactId>
            <version>3.0.0-M2</version>
            <type>pom</type>
            <scope>import</scope>
        </dependency>
    </dependencies>
</dependencyManagement>
```

## 三、Spring Boot Maven Plugin

Spring Boot Maven Plugin在Apache Maven中提供了Spring Boot支持。它允许你打包可执行`jar`或`war`文件，运行Spring Boot应用程序，生成构建信息，并在运行集成测试之前启动Spring Boot应用程序。

要使用Spring Boot Maven Plugin，需要在`pom.xml`的`plugins`部分包含适当的`XML`，如下所示:

```xml
<project>
    <modelVersion>4.0.0</modelVersion>
    <artifactId>getting-started</artifactId>
    <!-- ... -->
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

该插件提供了许多用户属性，已`spring-boot`开头，让你可以从命令行自定义配置。

```java
$ mvn spring-boot:run -Dspring-boot.run.profiles=dev,local
```

具体参考[Spring Boot Maven Plugin Documentation](https://docs.spring.io/spring-boot/docs/3.0.0-M2/maven-plugin/reference/htmlsingle/#?)

## 四、Starters

`Starter`是在你应用中方便描述依赖关系的描述符。你可以获得所需的所有Spring和相关技术的一站式商店，而不必遍历复制粘贴大量依赖管理。例如，如果你想开始使用Spring和JPA进行数据库访问，只需要在你的项目中包含`spring -boot-starter-data- jpa`依赖项。

> 所有的官方Starter都遵循类似的命名模式;spring-boot-starter -*，其中*是特定类型的应用程序。当你需要找到初学者时，此命名结构将提供帮助。如果你需要自定义Starter，一般命名为thirdpartyproject-spring-boot-starter。

以下应用`Starter`是由Spring Boot在`org.springframework.boot`组下提供的:

Name
Description

spring-boot-starter
auto-configuration , logging and YAML

spring-boot-starter-amqp
Spring AMQP and Rabbit MQ

spring-boot-starter-aop
Spring AOP and AspectJ

spring-boot-starter-artemis
JMS for Apache Artemis

spring-boot-starter-batch
Spring Batch

spring-boot-starter-cache
Spring Framework’s caching support

spring-boot-starter-data-cassandra
Spring Data Cassandra

spring-boot-starter-data-cassandra-reactive
Spring Data Cassandra Reactive

spring-boot-starter-data-couchbase
Spring Data Couchbase

spring-boot-starter-data-couchbase-reactive
Spring Data Couchbase

spring-boot-starter-data-elasticsearch
Spring Data Elasticsearch

spring-boot-starter-data-jdbc
Spring Data JDBC

spring-boot-starter-data-jpa
Spring Data JPA with Hibernate

spring-boot-starter-data-ldap
Spring Data LDAP

spring-boot-starter-data-mongodb
Spring Data MongoDB

spring-boot-starter-data-mongodb-reactive
Spring Data MongoDB Reactive

spring-boot-starter-data-neo4j
Spring Data Neo4j

spring-boot-starter-data-r2dbc
Spring Data R2DBC

spring-boot-starter-data-redis
Spring Data Redis and the Lettuce client

spring-boot-starter-data-redis-reactive
Spring Data Redis reactive and the Lettuce client

spring-boot-starter-data-rest
Spring Data REST

spring-boot-starter-freemarker
FreeMarker

spring-boot-starter-groovy-templates
Groovy Templates

spring-boot-starter-hateoas
Spring HATEOAS

spring-boot-starter-integration
Spring Integration

spring-boot-starter-jdbc
JDBC with the HikariCP connection pool

spring-boot-starter-jooq
jOOQ

spring-boot-starter-json
json

spring-boot-starter-mail
Spring Framework’s email

spring-boot-starter-mustache
Mustache views

spring-boot-starter-oauth2-client
Spring Security’s OAuth2/OpenID Connect client

spring-boot-starter-oauth2-resource-server
Security’s OAuth2 resource server

spring-boot-starter-quartz
Quartz

spring-boot-starter-rsocket
RSocket clients and servers

spring-boot-starter-security
Spring Security

spring-boot-starter-test
JUnit Jupiter, Hamcrest and Mockito

spring-boot-starter-thymeleaf
Thymeleaf views

spring-boot-starter-validation
Hibernate Validator

spring-boot-starter-web
Spring MVC Tomcat

spring-boot-starter-web-services
Spring Web Services

spring-boot-starter-webflux
Spring Framework’s Reactive Web

spring-boot-starter-websocket
Spring Framework’s WebSocket

spring-boot-starter-actuator
监控和管理应用程序
