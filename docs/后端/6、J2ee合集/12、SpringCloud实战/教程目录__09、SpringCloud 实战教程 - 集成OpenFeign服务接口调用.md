# 09、SpringCloud 实战教程 - 集成OpenFeign服务接口调用
- 来源：https://ddkk.com/zhuanlan/j2ee/springcloud/2/9.html
- 分类：J2EE框架
- 分组：教程目录
## 一、OpenFeign简介

**什么是Feign？**

Feign是一个声明式WebService客户端。使用Feign能让编写Web Service客户端更加简单。它的使用方法是定义一个服务接口然后在上面添加注解。Feign也支持可拔插式的编码器和解码器。Spring Cloud对Feign进行封装，使其支持了Spring MVC标准注解和HttpMessageConverters。Feign可以与Eureka和Ribbon组合使用支持负载均衡。

**Feign是能干什么？**

Feign旨在使编写Java Http客户端变得更容易。前面在使用Ribbon+RestTemplate时，利用RestTemplate对http请求的封装处理，形成了一套模板化的调用方法。但是在实际开发过程中，由于对服务依赖的调用可能不止一处，往往一个接口会被多处调用，所以通常都会针对每个微服务自行封装一些客户端类来包装这些依赖服务的调用。所以,Feign在此基础上做了进一步封装，由他来帮助我们定义和实现依赖服务接口的定义。在Feign的实现下，我们只需要创建一个接口并使用注解的方式来配置它，（以前是Dao接口上面标准Mapper注解，现在是一个微服务接口上面标注一个Feign注解即可）即可完成对服务提供方的接口绑定，简化了Spring Cloud Ribbon时，自动封装服务调用客户端的开发量。

**Feign集成了Ribbon，利用Ribbon维护了Payment的服务列表信息，并且通过轮询实现了客户端的负载均衡**，而与Ribbon不同的是，通过Feign值需要定义服务绑定接口且一声明式的方法，优雅而简单的实现了服务调用。

**Feign和OpenFeign的区别**

## 二、Openfeign实现负载均衡

新建module，名称为cloud-consumer-feign-order，修改pom.xml文件

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
    <artifactId>cloud-consumer-feign-order</artifactId>
    <description>订单消费者之feign</description>
    <dependencies>
        <!--openfeign-->
        <dependency>
            <groupId>org.springframework.cloud</groupId>
            <artifactId>spring-cloud-starter-openfeign</artifactId>
        </dependency>
        <!--hystrix-->
        <!--eureka client-->
        <dependency>
            <groupId>org.springframework.cloud</groupId>
            <artifactId>spring-cloud-starter-netflix-eureka-client</artifactId>
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

新建application.yml配置文件

```java
server:
  port: 80
#eureka集群
eureka:
  client:
    register-with-eureka: false
    fetch-registry: true
    service-url:
      defaultZone: http://eureka7001.com:7001/eureka,http://eureka7002.com:7002/eureka
```

新建主启动类

```java
package com.buba.springcloud;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.openfeign.EnableFeignClients;
@SpringBootApplication
@EnableFeignClients//激活Feign的注解  需要加到主启动类上
public class OrderFeignMain {
    public static void main(String[] args) {
        SpringApplication.run(OrderFeignMain.class,args);
    }
}
```

新建业务类，就是将我们的生产者的服务的业务接口复制过来直接使用

```java
package com.buba.springcloud.service;
import com.buba.springcloud.pojo.CommonResult;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
@ComponentScan
@FeignClient(value ="mcroservice-payment")//使用Feign
public interface PaymentService {
    @GetMapping("/payment/get/{id}")
    public CommonResult queryById(@PathVariable("id") Long id);
}
```

新建控制层Controller

```java
package com.buba.springcloud.controller;
import com.buba.springcloud.pojo.CommonResult;
import com.buba.springcloud.pojo.Payment;
import com.buba.springcloud.service.PaymentService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;
@RestController
@Slf4j
public class OrderFeignController {
    @Autowired
    private PaymentService paymentService;
    @GetMapping("/consumer/payment/get/{id}")
    public CommonResult<Payment> getPaymentById(@PathVariable("id") Long id){
        CommonResult result = paymentService.queryById(id);
        return result;
    }
}
```

那现在启动eureka7001和7002，然后启动服务端服务8001与8002，先都自测一下看看是否启动成功。启动配置OpenFeign的生产者服务80，访问路径[http://localhost/consumer/payment/get/1](http://localhost/consumer/payment/get/1)，看看是否有有赋值均衡的功能。

总结一下Openfeign就是微服务调用接口+@FeignClient注解，如下图：

## 三、Openfeign实现超时控制

由于我们的服务分为生产者和消费者，所以我们的消费者服务去调用生产者服务的时候响应的时间较长，会出现连接超时的现象，如果长时间未响应会对用户造成极差的体验，这时候我们就可以设置超时实现，比如，我们消费者服务调用生产者服务的时候，我们可设置如果访问生产者服务的时候超过2秒未响应就会给用户一个提示，连接超时，请稍后访问。生产者服务与消费者服务双方要进行规定设置。

那下面进行代码演示超时设置，更容易直观了解学习。我们将生产者端口为8001的服务，写一个接口，让程序暂停3秒，故意设置超时演示出错情况，如下图：

```java
 //模拟业务接口延时3秒
@GetMapping("/payment/feign/timeout")
public String PaymentFeignTimeOut() throws InterruptedException {
     TimeUnit.SECONDS.sleep(3);
     return serverPort;
}
```

在消费者服务业务层添加超时的接口，如下图：

```java
package com.buba.springcloud.service;
import com.buba.springcloud.pojo.CommonResult;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
@ComponentScan
@FeignClient(value ="mcroservice-payment")//使用Feign，使用哪个微服务
public interface PaymentService {
    //调用生产者微服务名称为mcroservice-payment下边的接口
    @GetMapping("/payment/get/{id}")
    public CommonResult queryById(@PathVariable("id") Long id);
    //调用生产者微服务名称为mcroservice-payment下边的模拟超时的接口
    @GetMapping("/payment/feign/timeout")
    public String PaymentFeignTimeOut() throws InterruptedException;
}
```

在消费者服务控制层添加超时的接口，如下图：

```java
package com.buba.springcloud.controller;
import com.buba.springcloud.pojo.CommonResult;
import com.buba.springcloud.pojo.Payment;
import com.buba.springcloud.service.PaymentService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;
@RestController
@Slf4j
public class OrderFeignController {
    @Autowired
    private PaymentService paymentService;
    @GetMapping("/consumer/payment/get/{id}")
    public CommonResult<Payment> getPaymentById(@PathVariable("id") Long id){
        CommonResult result = paymentService.queryById(id);
        return result;
    }
    @GetMapping("/consumer/feign/timeout")
    public String PaymentFeignTimeOut() throws InterruptedException{
        return paymentService.PaymentFeignTimeOut();
    }
}
```

我们先自测一下端口为8001的生产者的微服务，访问接口[http://localhost:8001/payment/feign/timeout](http://localhost:8001/payment/feign/timeout)，如下图：

自测通过后访问消费者的服务，接口为 [http://localhost/consumer/feign/timeout](http://localhost/consumer/feign/timeout)，会出现如下报错界面，提示我们接口访问超时。

原因就是Openfeign默认等待1秒钟，超过后会报错。但是我们的生产者服务确实需要处理复杂的业务，处理时间会超过1秒，就需要修改Openfeign默认等待的时间。需要在消费者的服务的yml文件进行设置。**因为Feign集成了Ribbon，所以需要设置Ribbon的相关。**如下图：

```java
server:
  port: 80
eureka:
  client:
    register-with-eureka: false
    fetch-registry: true
    service-url:
      defaultZone: http://eureka7001.com:7001/eureka,http://eureka7002.com:7002/eureka
# 设置feign客户端超时时间(OpenFeign默认支持ribbon)
ribbon:
  指的是建立连接所用的时间,适用于网络状态正常的情况下,两端连接所用的时间，设置等待5000为5秒时间
  ReadTimeout: 5000
  指的是建立连接后从服务器读取到可用资源所用的时间
  ConnectTimeout: 5000
```

我们重启消费者服务，再次访问[ttp://localhost/consumer/feign/timeout](http://localhost/consumer/feign/timeout)，会出现如下成功界面：

## 四、Openfeign实现日志打印

Openfeign提供了日志打印功能。比如我们消费者服务调用生产者的服务的时候在接口调用的时候，我们可能需要更详细的信息，如信息头、状态码、时间、接口等等。就可以使用Openfeign日志打印功能，我们可以通过配置来调整日志级别，从而了解Feign中Http请求的细节。也就是对Feign接口的调用情况进行监控和输出。

**Logger有四种类型：**

`NONE：``默认的，不显示任何日志。`

`BASIC：仅记录请求方法、URL、响应状态及执行时间。`

`HEADERS：除了BASIC中定义的信息之外，还有请求和响应的有信息。`

`FULL：``除了BASIC中定义的信息之外，还有请求和响应的正文及元数据。`

通过注册Bean来设置日志记录级别！

开始配置日志Bean，我们新建配置文件FeignConfig，记得加注解@Configuration

```java
package com.buba.springcloud.config;
import feign.Logger;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
@Configuration
public class FeignConfig
{
    /**
     * feignClient配置日志级别
     *
     * @return
     */
    @Bean
    public Logger.Level feignLoggerLevel() {
        // 请求和响应的头信息,请求和响应的正文及元数据
        return Logger.Level.FULL;
    }
}
```

在yml文件中需要开启日志的Feign客户端，要写PaymentService业务类的全限定类名

```java
logging:
  level:
      feign日志以什么级别监控哪个接口
    com.buba.springcloud.service.PaymentService: debug
```

重启的消费者服务，访问接口，看一下控制台打印的日志信息。
