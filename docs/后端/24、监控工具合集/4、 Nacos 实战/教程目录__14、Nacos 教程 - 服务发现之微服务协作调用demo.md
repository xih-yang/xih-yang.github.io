# 14、Nacos 教程 - 服务发现之微服务协作调用demo
- 来源：https://ddkk.com/zhuanlan/registered/nacos/1/14.html
- 分类：注册中心
- 分组：教程目录
## 前言

微服务调用小案例。

代码已共享至Gitee:[https://gitee.com/lengcz/nacosdiscovery01.git](https://gitee.com/lengcz/nacosdiscovery01.git)

## 微服务调用demo

### 第一步、新建父工程

**1、** 新建父工程；

**2、** 引入依赖(全pom文件)；

```java
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    <groupId>com.it2</groupId>
    <artifactId>nacosdiscovery01</artifactId>
    <version>1.0-SNAPSHOT</version>
    <packaging>pom</packaging>
    <properties>
        <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
        <project.reporting.outputEncoding>UTF-8</project.reporting.outputEncoding>
        <java.version>1.8</java.version>
    </properties>
    <!--配置依赖管理-->
    <dependencyManagement>
        <dependencies>
            <dependency>
                <groupId>com.alibaba.cloud</groupId>
                <artifactId>spring-cloud-alibaba-dependencies</artifactId>
                <version>2.1.0.RELEASE</version>
                <type>pom</type>
                <scope>import</scope>
            </dependency>
            <!-- https://mvnrepository.com/artifact/org.springframework.cloud/spring-cloud-dependencies -->
            <dependency>
                <groupId>org.springframework.cloud</groupId>
                <artifactId>spring-cloud-dependencies</artifactId>
                <version>Greenwich.RELEASE</version>
                <type>pom</type>
                <scope>import</scope>
            </dependency>
            <!-- https://mvnrepository.com/artifact/org.springframework.boot/spring-boot-dependencies -->
            <dependency>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-dependencies</artifactId>
                <version>2.1.3.RELEASE</version>
                <type>pom</type>
                <scope>import</scope>
            </dependency>
        </dependencies>
    </dependencyManagement>
    <build>
        <!--配置插件-->
        <plugins>
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
            </plugin>
        </plugins>
    </build>
</project>
```

### 第二步、服务生产者

**1、** 创建模块；

**2、** 引入依赖；

```java
<dependencies>
    <!--用于服务注册和发现-->
    <dependency>
        <groupId>com.alibaba.cloud</groupId>
        <artifactId>spring-cloud-starter-alibaba-nacos-discovery</artifactId>
    </dependency>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-web</artifactId>
    </dependency>
    <!--用于服务调用和负载均衡-->
    <dependency>
        <groupId>org.springframework.cloud</groupId>
        <artifactId>spring-cloud-starter-openfeign</artifactId>
    </dependency>
</dependencies>
```

**1、** 创建配置文件application.yml；

```java
server:
  port: ${
     port:10001}
spring:
  application:
    name: provider
  cloud:
    nacos:
      discovery:
        server-addr: 127.0.0.1:8848
logging:
  level:
    root: info
    org.springframework: info
```

**1、** 编写一个controller对外提供服务；

```java
@RestController
public class ProviderController {
    private static final Logger LOG= LoggerFactory.getLogger(ProviderController.class);
    @GetMapping("/service")
    public String service(){
        LOG.info("provider invoke");
        return "provider invoke";
    }
}
```

**1、** 编写启动类；

```java
@SpringBootApplication
@EnableDiscoveryClient  //开启服务发现客户端
@EnableFeignClients     //开启Feign客户端
public class ProviderApp {
    public static void main(String[] args) {
        SpringApplication.run(ProviderApp.class,args);
    }
}
```

**1、** 启动应用，查看nacos的服务列表，可以看到我们刚刚注册的provider服务，点击详情，可以看到客户端的列表；

代码结构(供参考)

### 第三步、消费者

**1、** 创建模块；

**2、** 引入依赖；

```java
<dependencies>
    <!--用于服务注册和发现-->
    <dependency>
        <groupId>com.alibaba.cloud</groupId>
        <artifactId>spring-cloud-starter-alibaba-nacos-discovery</artifactId>
    </dependency>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-web</artifactId>
    </dependency>
    <!--用于服务调用和负载均衡-->
    <dependency>
        <groupId>org.springframework.cloud</groupId>
        <artifactId>spring-cloud-starter-openfeign</artifactId>
    </dependency>
</dependencies>
```

**1、** 创建配置文件application.yml；

```java
server:
  port: ${
     port:10002}
spring:
  application:
    name: consumer
  cloud:
    nacos:
      discovery:
        server-addr: 127.0.0.1:8848
logging:
  level:
    root: info
    org.springframework: info
```

**1、** 生产者的远程代理定义(通常我们将其定义在单独的包)；

```java
/**
 * 定义远程调用
 */
@FeignClient(value="provider")   //value值是注册到nacos的服务名
public interface ProviderClient {
    @GetMapping("/service")
    public String service();
}
```

**1、** 消费者的实现；

```java
@RestController
public class ConsumerController {
    private static final Logger LOG= LoggerFactory.getLogger(ConsumerController.class);
    /**
     * 动态代理对象，内部远程调用生产者
     */
    @Autowired
    private ProviderClient providerClient;
    @GetMapping("/service")
    public String service(){
        LOG.info("consumer invoke");
        String result=providerClient.service(); //远程调用
        return "consumer invoke | "+result;
    }
}
```

**1、** 编写启动类；

```java
@SpringBootApplication
@EnableDiscoveryClient  //开启服务发现客户端
@EnableFeignClients     //开启Feign客户端
public class ConsumerApp {
    public static void main(String[] args) {
        SpringApplication.run(ConsumerApp.class,args);
    }
}
```

**1、** 启动并访问接口[http://127.0.0.1:10002/service](http://127.0.0.1:10002/service)；

后台可以查看到消费者也注册到了发现中心。

代码结构(供参考)

### 消费者与生产者

- 一个微服务既可以做为生产者，也可以作为消费者，所以消费者的接口同样可以作为接口为其它微服务。
- 不管是服务的生产者还是服务的消费者，都会把自己注册到服务的发现中心。
