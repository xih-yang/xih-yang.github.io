# 07、SpringCloud 实战教程 - 集成Consul服务注册中心
- 来源：https://ddkk.com/zhuanlan/j2ee/springcloud/2/7.html
- 分类：J2EE框架
- 分组：教程目录
## 一、了解Consul

这篇文章学习另外一个服务注册中心Consul，那什么是Consul？

Consul是一个服务网格（微服务间的 TCP/IP，负责服务之间的网络调用、限流、熔断和监控）解决方案，它是一个一个分布式的，高度可用的系统，而且开发使用都很简便。它提供了一个功能齐全的控制平面，主要特点是：服务发现、健康检查、键值存储、安全服务通信、多数据中心。

与其它分布式服务注册与发现的方案相比，Consul 的方案更“一站式”——内置了服务注册与发现框架、分布一致性协议实现、健康检查、Key/Value 存储、多数据中心方案，不再需要依赖其它工具。Consul 本身使用 go 语言开发，具有跨平台、运行高效等特点，也非常方便和 Docker 配合使用。

## 二、Consul安装与运行

[点击访问Consul官网](https://www.consul.io/)，进入官网，我们点击下载，分为三种类型的版本，我们这里安装的Windows版的，下载下来是一个zip的压缩包，我们解压完后会有一个consul.exe应用程序，如下图：

无需安装，我们找到该应用程序在的文件地址，如下图：

然后我们直接在打开的文件夹地址栏当中输入cmd，进入如下界面：

我们输入命令consul agent -dev 进入开发模式，如下图：

通过访问[http://localhost:8500/ui/dc1/services](http://localhost:8500/ui/dc1/services)地址可以访问Consul的首页，如下图：

## 三、搭建生产者服务

新建module，具体步骤看前边的文章，我们这里从配置文件开始贴代码，修改pom,xml文件，主要就是新增consul的依赖包。

```java
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <parent>
        <artifactId>mcroservice</artifactId>
        <groupId>com.study.springcloud</groupId>
        <version>1.0-SNAPSHOT</version>
    </parent>
    <modelVersion>4.0.0</modelVersion>
    <artifactId>cloud-providerconsul-payment04</artifactId>
    <dependencies>
        <!--SpringCloud consul-server-->
        <dependency>
            <groupId>org.springframework.cloud</groupId>
            <artifactId>spring-cloud-starter-consul-discovery</artifactId>
        </dependency>
        <dependency>
            <groupId>com.study.springcloud</groupId>
            <artifactId>cloud-api-commons</artifactId>
            <version>${project.version}</version>
        </dependency>
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
            <artifactId>spring-boot-devtools</artifactId>
            <scope>runtime</scope>
            <optional>true</optional>
        </dependency>
        <dependency>
            <groupId>org.projectlombok</groupId>
            <artifactId>lombok</artifactId>
            <optional>true</optional>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-test</artifactId>
            <scope>test</scope>
        </dependency>
    </dependencies>
</project>
```

新建yml文件配置

```java
server:
  consul服务端口
  port: 8004
spring:
  application:
    name: cloud-provider-payment
  cloud:
    consul:
      consul注册中心地址
      host: localhost
      port: 8500
      discovery:
       hostname: 127.0.0.1
        service-name: ${spring.application.name}
```

新建主启动类

```java
package com.buba.springcloud;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;
@SpringBootApplication
@EnableDiscoveryClient
public class PaymentMain04 {
    public static void main(String[] args) {
        SpringApplication.run(PaymentMain04.class,args);
    }
}
```

新建测试业务类

```java
package com.buba.springcloud.controller;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.UUID;
@RestController
@Slf4j
public class PaymentController {
    @Value("${server.port}")
    private String serverPort;
    @RequestMapping(value = "payment/consul")
    public String paymentConsul() {
        return "SpringCloud with consul:" + serverPort + "\t" + UUID.randomUUID().toString();
    }
}
```

先启动我们在windows上安装的consul，然后在启动我们的module项目，可以看到cloud-provider-payment已经成功注册到consul注册中心。

然后我们访问刚才的业务接口[http://localhost:8004/payment/consul](http://localhost:8004/payment/consul)，看看是否可以获取到信息。可以成功访问，如下图：

## 四、搭建消费者服务

新建module，服务名称为修改pom.xml文件，主要就是新增consul的依赖包。如下图：

```java
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <parent>
        <artifactId>mcroservice</artifactId>
        <groupId>com.study.springcloud</groupId>
        <version>1.0-SNAPSHOT</version>
    </parent>
    <modelVersion>4.0.0</modelVersion>
    <artifactId>cloud-consumerconsul-order</artifactId>
    <description>服务消费者之注册中心consul</description>
    <dependencies>
        <!--SpringCloud consul-server-->
        <dependency>
            <groupId>org.springframework.cloud</groupId>
            <artifactId>spring-cloud-starter-consul-discovery</artifactId>
        </dependency>
        <dependency>
            <groupId>com.study.springcloud</groupId>
            <artifactId>cloud-api-commons</artifactId>
            <version>${project.version}</version>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
        <!--监控-->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-actuator</artifactId>
        </dependency>
        <!--热部署-->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-devtools</artifactId>
            <scope>runtime</scope>
            <optional>true</optional>
        </dependency>
        <dependency>
            <groupId>org.projectlombok</groupId>
            <artifactId>lombok</artifactId>
            <optional>true</optional>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-test</artifactId>
            <scope>test</scope>
        </dependency>
    </dependencies>
</project>
```

新建yml文件，如下图：

```java
server:
  port: 80
spring:
  application:
    name: cloud-consumer-order
  cloud:
    consul:
      consul注册中心地址
      host: localhost
      port: 8500
      discovery:
       hostname: 127.0.0.1
        service-name: ${spring.application.name}
```

新建主启动类，如下图：

```java
package com.buba.springcloud.order;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;
@SpringBootApplication
@EnableDiscoveryClient
public class OrderconsulMain {
    public static void main(String[] args) {
        SpringApplication.run(OrderconsulMain.class,args);
    }
}
```

新建ApplicationContextConfig配置文件，如下图：

```java
package com.buba.springcloud.order.config;
import org.springframework.cloud.client.loadbalancer.LoadBalanced;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;
@Configuration
public class ApplicationContextConfig {
    @Bean
    //RestTemplate 的负载均衡能力
    @LoadBalanced
    public RestTemplate getRestTemplate(){
        return new RestTemplate();
    }
}
```

编写业务类，如下图;

```java
package com.buba.springcloud.order.controller;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestTemplate;
@RestController
@Slf4j
public class OrderConsulController {
    public static final  String PAYMENT_URL = "http://cloud-provider-payment";
    @Autowired
    private RestTemplate restTemplate;
    @GetMapping("/consumer/payment/consul")
    public String getPayment(){
        return restTemplate.getForObject(PAYMENT_URL+"/payment/consul/",String.class);
    }
}
```

现在分别启动Consul服务器、cloud-providerconsul-payment04生产者服务、cloud-consumerconsul-order消费者服务，然后进行访问[http://localhost/consumer/payment/consul](http://localhost/consumer/payment/consul),也可以通过消费者调用生产者的服务，获取信息。成功界面如下图：
