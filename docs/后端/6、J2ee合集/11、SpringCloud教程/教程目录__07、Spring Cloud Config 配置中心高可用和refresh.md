# 07、Spring Cloud Config 配置中心高可用和refresh
- 来源：https://ddkk.com/zhuanlan/j2ee/springcloud/1/7.html
- 分类：J2EE框架
- 分组：教程目录
Springboot: 2.1.6.RELEASE

SpringCloud: Greenwich.SR1

如无特殊说明，本系列教程全采用以上版本

## 1. 引言

上一篇我们聊了Spring Cloud Config 配置中心，并且和Github做了集成，我们的Server端是单机版的，任何单机版的服务都只能使用与测试环境或者自己做Demo测试，**生产环境严禁使用单机服务**，配置中心在整个微服务体系中都是及其重要的一个节点，尤其是在DevOps中自动扩容，如果配置中心宕机，那么所有的自动扩容都会失败。

所以这一篇我们聊聊配置中心的高可用，说到高可用，在springcloud体系中，是有注册中心的，那么，我们的配置中心也是一个服务，可不可以使用Eureka做服务的注册与发现呢？

答案是肯定的。

## 2. Serve端

我们将上一篇的Serve端Copy到新的目录中，增加Eureka-client的依赖，使得Config-Serve可以注册到Eureka上。

### 2.1 pom.xml

```java
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>2.1.6.RELEASE</version>
        <relativePath/> <!-- lookup parent from repository -->
    </parent>
    <groupId>com.springcloud</groupId>
    <artifactId>config-server</artifactId>
    <version>0.0.1-SNAPSHOT</version>
    <name>config-server</name>
    <description>Demo project for Spring Boot</description>
    <properties>
        <java.version>1.8</java.version>
        <spring-cloud.version>Greenwich.SR1</spring-cloud.version>
    </properties>
    <dependencies>
        <dependency>
            <groupId>org.springframework.cloud</groupId>
            <artifactId>spring-cloud-starter-netflix-eureka-client</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.cloud</groupId>
            <artifactId>spring-cloud-config-server</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-test</artifactId>
            <scope>test</scope>
        </dependency>
    </dependencies>
    <dependencyManagement>
        <dependencies>
            <dependency>
                <groupId>org.springframework.cloud</groupId>
                <artifactId>spring-cloud-dependencies</artifactId>
                <version>${spring-cloud.version}</version>
                <type>pom</type>
                <scope>import</scope>
            </dependency>
        </dependencies>
    </dependencyManagement>
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

### 2.2 配置文件application.yml

```sh
server:
  port: 8080
spring:
  application:
    name: spring-cloud-config-server
  cloud:
    config:
      server:
        git:
          uri: https://github.com/meteor1993/SpringCloudLearning
          search-paths: chapter6/springcloud-config
          username: username
          password: password
eureka:
  client:
    service-url:
      defaultZone: http://localhost:8761/eureka/
```

增加eureka的地址配置

### 2.3 启动类

启动类增加@EnableEurekaClient激活对注册中心的支持

```java
package com.springcloud.configserver;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.config.server.EnableConfigServer;
import org.springframework.cloud.netflix.eureka.EnableEurekaClient;
@SpringBootApplication
@EnableConfigServer
@EnableEurekaClient
public class ConfigServerApplication {
    public static void main(String[] args) {
        SpringApplication.run(ConfigServerApplication.class, args);
    }
}
```

这样Server注册端我们就修改完成了。先启动Eureka，再启动Serve，在浏览器中访问http://localhost:8761/，就可以看到我们的Serve端已经注册到注册中心了，接下来我们开始改造Client端。

## 3. Client端

首先还是将上一篇的Client端Copy过来，和Server端一样，增加Eureka-client的依赖，使得Config-Client可以从注册中心上发现服务。

### 3.1 pom.xml

```java
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>2.1.6.RELEASE</version>
        <relativePath/> <!-- lookup parent from repository -->
    </parent>
    <groupId>com.springcloud</groupId>
    <artifactId>config-client</artifactId>
    <version>0.0.1-SNAPSHOT</version>
    <name>config-client</name>
    <description>Demo project for Spring Boot</description>
    <properties>
        <java.version>1.8</java.version>
        <spring-cloud.version>Greenwich.SR1</spring-cloud.version>
    </properties>
    <dependencies>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.cloud</groupId>
            <artifactId>spring-cloud-starter-config</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.cloud</groupId>
            <artifactId>spring-cloud-starter-netflix-eureka-client</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-test</artifactId>
            <scope>test</scope>
        </dependency>
    </dependencies>
    <dependencyManagement>
        <dependencies>
            <dependency>
                <groupId>org.springframework.cloud</groupId>
                <artifactId>spring-cloud-dependencies</artifactId>
                <version>${spring-cloud.version}</version>
                <type>pom</type>
                <scope>import</scope>
            </dependency>
        </dependencies>
    </dependencyManagement>
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

### 3.2 bootstrap.properties

这里我们需要先清空application.yml，所有的配置全都转移到bootstrap.properties中。

```java
spring.application.name=spring-cloud-config-client
server.port=8081
spring.cloud.config.name=springcloud-config
spring.cloud.config.profile=dev
spring.cloud.config.label=master
spring.cloud.config.discovery.enabled=true
spring.cloud.config.discovery.serviceId=spring-cloud-config-server
eureka.client.service-url.defaultZone=http://localhost:8761/eureka/
```

主要是去掉了spring.cloud.config.uri直接指向server端地址的配置，增加了最后的三个配置：

- spring.cloud.config.discovery.enabled ：开启Config服务发现支持
- spring.cloud.config.discovery.serviceId ：指定server端的name,也就是server端spring.application.name的值
- eureka.client.serviceUrl.defaultZone ：指向注册中心的地址

### 3.3 启动类

启动类增加@EnableEurekaClient激活对注册中心的支持

```java
package com.springcloud.configclient;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.netflix.eureka.EnableEurekaClient;
@SpringBootApplication
@EnableEurekaClient
public class ConfigClientApplication {
    public static void main(String[] args) {
        SpringApplication.run(ConfigClientApplication.class, args);
    }
}
```

## 4. 高可用

现在我们来模拟生产环境。

首先，顺次启动Eureka，Server，Client。

在idea启动两个config-serve，我们修改idea配置启动配置，换到8000端口启动config-serve。

先访问http://localhost:8761/，可以看到两个config-serve都正常注册到注册中心。

如上图就可发现会有两个server端同时提供配置中心的服务，防止某一台down掉之后影响整个系统的使用。

我们访问client端的链接：[http://localhost:8081/hello](http://localhost:8081/hello)， 可以看到页面正常显示：hello dev update1，刷新几次，显示都没问题，现在我们随机停掉一个端口的config-serve服务，再去刷新页面，可以发现，页面依然可以正常显示：hello dev update1。

至此，我们高可用的目的已经达到，但是，不知道各位有没有映像，我们上一篇留了一个坑，服务启动后，我们修改远端github上的配置时，这个配置并不会实时被客户端端所获取到，下面我们来聊一聊有关Spring Cloud Config 刷新的问题。

## 5. refresh

我们的客户端并不能主动去感知Git或者Svn的配置变化，从而主动获取最新的配置。那么，客户端如何去主动获取新的配置信息呢？springcloud已经给我们提供了解决方案，每个客户端通过POST方法触发各自的/refresh。

修改config-client项目已到达可以refresh的功能。

### 5.1 添加依赖pom.xml

在我们原有的config-client项目的pom.xml的基础增加新的依赖

```java
<dependency>
  <groupId>org.springframework.boot</groupId>
  <artifactId>spring-boot-starter-actuator</artifactId>
</dependency>
```

增加了spring-boot-starter-actuator包，spring-boot-starter-actuator是一套监控的功能，可以监控程序在运行时状态，其中就包括/refresh的功能。

### 5.2 开启更新机制

需要给加载变量的类上面加载@RefreshScope，在客户端执行/refresh的时候就会更新此类下面的变量值。

```java
package com.springcloud.configclient.controller;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.context.config.annotation.RefreshScope;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
/**
 * @Author: shiyao.wei
 * @Date: 2021/7/4 16:19
 * @Version: 1.0
 * @Desc:
 */
@RestController
@RefreshScope // 使用该注解的类，会在接到SpringCloud配置中心配置刷新的时候，自动将新的配置更新到该类对应的字段中。
public class HelloController {
    @Value("${springcloud.hello}")
    private String hello;
    @RequestMapping("/hello")
    public String from() {
        return this.hello;
    }
}
```

### 5.3 配置文件bootstrap.properties

```java
spring.application.name=spring-cloud-config-client
server.port=8081
spring.cloud.config.name=springcloud-config
spring.cloud.config.profile=dev
spring.cloud.config.label=master
spring.cloud.config.discovery.enabled=true
spring.cloud.config.discovery.serviceId=spring-cloud-config-server
eureka.client.service-url.defaultZone=http://localhost:8761/eureka/
management.security.enabled=false
management.endpoints.web.exposure.include=*
```

- **management.security.enabled：** springboot 1.5.X 以上默认开通了安全认证，所以需要添加这个配置
- **management.endpoints.web.exposure.include：** springboot 2.x 默认只开启了info、health的访问，*代表开启所有访问

### 5.4 测试

我们先访问客户端的测试连接：[http://localhost:8081/hello](http://localhost:8081/hello)， 这时，页面的显示是：hello dev update1，我们修改github上的信息，修改为：hello dev update，现在访问http://localhost:8081/hello，得到的信息还是：hello dev update1，现在我们刷新一下客户端，通过cmd命令行执行：curl -X POST [http://localhost:8081/actuator/refresh，可以看到命令行上有显示：[“springcloud.hello”,”config.client.version”]，意味着springcloud.hello这个配置已经刷新，这时，我们再去刷新一下页面，可以看到，页面上得到的信息已经变为了：hello](http://localhost:8081/actuator/refresh，可以看到命令行上有显示：["springcloud.hello","config.client.version"]，意味着springcloud.hello这个配置已经刷新，这时，我们再去刷新一下页面，可以看到，页面上得到的信息已经变为了：hello) dev update，这时我们refresh成功。

每次手动刷新客户端还是很麻烦，有没有什么办法只要提交代码就自动调用客户端来更新呢，github的webhook是一个好的办法。

## 6. webhook

WebHook是当某个事件发生时，通过发送http post请求的方式来通知信息接收方。Webhook来监测你在Github.com上的各种事件，最常见的莫过于push事件。如果你设置了一个监测push事件的Webhook，那么每当你的这个项目有了任何提交，这个Webhook都会被触发，这时Github就会发送一个HTTP POST请求到你配置好的地址。

如此一来，你就可以通过这种方式去自动完成一些重复性工作，比如，你可以用Webhook来自动触发一些持续集成（CI）工具的运作，比如Travis CI；又或者是通过 Webhook 去部署你的线上服务器。下图就是github上面的webhook配置。

- **Payload URL：** 触发后回调的URL
- **Content type：** 数据格式，两种一般使用json
- **Secret：** 用作给POST的body加密的字符串。采用HMAC算法
- **events：** 触发的事件列表

events事件类型
描述

push
仓库有push时触发。默认事件

create
当有分支或标签被创建时触发

delete
当有分支或标签被删除时触发

这样我们就可以利用hook的机制去触发客户端的更新，但是当客户端越来越多的时候hook支持的已经不够优雅，另外每次增加客户端都需要改动hook也是不现实的。其实Spring Cloud给了我们更好解决方案，我们在下一篇接着聊。

[示例代码-Github](https://github.com/meteor1993/SpringCloudLearning/tree/master/chapter7)

> 版权声明：「DDKK.COM 弟弟快看，程序员编程资料站」本站文章，版权归原作者所有
