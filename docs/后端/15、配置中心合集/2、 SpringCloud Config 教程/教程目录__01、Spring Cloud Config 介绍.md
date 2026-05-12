# 01、Spring Cloud Config 介绍
- 来源：https://ddkk.com/zhuanlan/config/springcloudconfig/1.html
- 分类：配置中心
- 分组：教程目录
## 为什么需要使用 Spring Cloud Config

在项目中，我们一般会有专门的配置文件去管理所有的配置，有时候还会专门用一个conf项目去维护各种环境下的配置文件。在微服务场景下，当服务数量变得很多时，维护配置文件就成了一件头疼的事情。所以，需要一种方案，可以对配置进行集中管理，不同的环境做不同的配置，这就需要Spring Cloud Config。

## 什么是Spring Cloud Config？

Spring Cloud Config为分布式系统中的外部配置提供服务器和客户端支持，可以方便的对微服务各个环境下的配置进行集中式管理。Spring Cloud Config分为Config Server和Config Client两部分。Config Server负责读取配置文件，并且暴露Http API接口，Config Client通过调用Config Server的接口来读取配置文件。

## 如何使用Spring Cloud Config？

先写一个Config Server：

**1、** 创建一个项目spring-boot-config-server，pom文件添加依赖：

```xml
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-starter-eureka-server</artifactId>
</dependency>
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-config-server</artifactId>
</dependency>
```

**2、** 编写配置文件application.yml：

```sh
server:
  port: 8080
spring:
  application:
    name: microservice-config-server
  profiles:
    active: native
  cloud:
    config:
      server:
        native:
          search-locations: classpath:/conf
```

配置文件中指定模块名为microservice-config-server，启动端口为8080。Config Server可以从本项目读取配置文件，还可以从git，svn等远程地址中读取，默认是从git中读取。spring.profiles.active=native说明了Config Server从本地读取配置，下面配置的search-locations选项，说明读取配置的路径为classpath下的/conf路径。

**3、** 编写启动类ConfigServerApplication：

```java
@SpringBootApplication
@EnableConfigServer
public class ConfigServerApplication {
    public static void main(String[] args) {
        SpringApplication.run(ConfigServerApplication.class, args);
    }
}
```

启动类上添加了注解@EnableConfigServer，声明这是一个config Server。

经过上面这三步，config Server就算是完成了。下面再写config Client：

**1、** 创建一个项目spring-boot-config-client，pom文件添加依赖：

```xml
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-starter-eureka-server</artifactId>
</dependency>
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-starter-config</artifactId>
</dependency>
```

**2、** 创建启动类ConfigClientApplication：

```java
@SpringBootApplication
public class ConfigClientApplication {
    public static void main(String[] args) {
        SpringApplication.run(ConfigClientApplication.class, args);
    }
}
```

下面就到了Config Client的配置文件了，如果此时直接在项目中添加application.yml，指定启动端口为8090，再启动项目，可以发现config Client是正常启动的，所有的配置全部按照application.yml定义的配置。

我们想要的效果是Config Client从Config Server中读取配置并启动，所以，在Config Client的resource目录下新建一个bootstrap.yml，bootstrap.yml和application.yml相比具有优先的执行顺序，bootstrap.yml的内容如下：

```sh
server:
  port: 8090
spring:
  application:
    name: config-client
  cloud:
    config:
      uri: http://localhost:8080
      fail-fast: true
  profiles:
    active: dev
```

bootstrap.yml指定了项目的名称为config-client，启动端口为8090，从[http://localhost:8080](http://localhost:8080) 读取配置，读取profile为dev的配置文件，如果没有读取成功，则执行快速失败。按照这种配置，根据匹配规则，Config Client会读取文件名为{项目名}-{profile}的文件，也就是config-client-dev。所以，需要在Config Server的classpath:/conf目录下，新建config-client-dev.yml文件，并且添加如下配置：

```sh
server:
  port: 8091
foo: foo version 1
```

这里面，指定的启动的端口号为8091。

最后，启动项目Config Server 和Config Client，在Config Client启动的时候，就会发现去Config Server读取配置文件了，项目启动的端口最终是8091，而不是自己项目中配置的8090。

Config Server 和Config Client还可以和Spring Cloud Eureka结合，在启动的时候向Eureka Server注册，从而构建高可用集群。

参考资料：

**1、** 《SpringCloud与Docker微服务架构实战》周立著；

**2、** 《SpringCloud微服务实战》翟永超著；

**3、** 《深入理解SpringCloud与微服务构建》方志朋著；

> 版权声明：「DDKK.COM 弟弟快看，程序员编程资料站」本站文章，版权归原作者所有
