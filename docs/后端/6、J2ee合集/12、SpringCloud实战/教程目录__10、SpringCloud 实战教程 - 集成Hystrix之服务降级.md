# 10、SpringCloud 实战教程 - 集成Hystrix之服务降级
- 来源：https://ddkk.com/zhuanlan/j2ee/springcloud/2/10.html
- 分类：J2EE框架
- 分组：教程目录
## 一、分布式系统面临的问题？

复杂的分布式体系结构中的应用程序，有数十个依赖关系，每个依赖关系在某些时候将不可避免地失败。为了让我们更好的了解学习，看下图：

由上图我们可以看到请求需要调用A、H、P、I 四个服务 ，如果一切顺利则没有什么问题，关键是如果服务I服务超时会出现什么情况呢？如下图：

会出现如图雪崩的现象，我们称之为服务雪崩。

什么是服务雪崩？

多个为服务之间调用的时候，假设微服务A调用微服务B和微服务C，微服务B和微服务C又调用其他的微服务，这就是所谓的“扇出”。

如果扇出的链路上某一个微服务的调用响应时间过长或者不可用，对微服务A的调用就会占用越来越多的系统资源，进而引起系统崩溃，所以的“雪崩效应”

对于高流量的应用来说，单一的后端依赖可能会导致所有的服务器上的所有资源都在几秒钟内饱和。比失败更糟糕的是，这些应用程序还可能导致服务之间的延迟增加，备份队列，线程和其他系统资源紧张，导致整个系统发生更多的级联故障。这些都表示需要对故障和延时进行隔离和管理，以便单个依赖关系的失败，不能取消整个应用程序和系统。所以，通常当你发现一个模块下的某一个实例失败后，这时候这个模块依然还会接受流量，然后这个问题的模块该调用了其他的模块，这样就会发生级联故障，或者叫雪崩。

## 二、Hystrix简介

（[点击官网学习](https://github.com/Netflix/Hystrix/wiki)）为了解决这一问题，就出现了Hystrix的技术，Hystrix是一个用于处理分布式系统的延迟和容错的开源库，在分布式系统里，许多依赖不可避免的会调用失败，比如超时、异常等，Hystrix能保证在一个依赖出问题的情况下，不会导致整个服务失败，避免出现级联故障，以提高分布式系统的弹性。

“断路器”本身是一种开发装置，当某个服务单元发生故障之后，通过断路器的故障监控（类似熔断保险丝），向调用方返回一个符合预期的、可处理的备选响应（FallBack），而不是长时间的等待或者抛出调用方无法处理的异常，这样就保证了服务调用方的线程不会被长时间、不必要地占用，从而避免了故障在分布式系统中的蔓延，乃至雪崩。

在springcloud中断路器组件就是Hystrix。Hystrix也是Netflix套件的一部分。他的功能是，当对某个服务的调用在一定的时间内（默认10s），有超过一定次数（默认20次）并且失败率超过一定值（默认50%），该服务的断路器会打开。返回一个由开发者设定的fallback。fallback可以是另一个由Hystrix保护的服务调用，也可以是固定的值。fallback也可以设计成链式调用，先执行某些逻辑，再返回fallback。

**Hystrix三大作用：**

服务降级（Fallback）：比如当服务器忙，请稍后再试，不让客户端等待并立刻返回一个友好提示，Fallback，会发生降级的几种情况：程序运行异常、超时、服务熔断触发服务降级。

服务熔断（Break）：类比保险丝达到最大服务访问后，直接拒绝访问，拉闸限电，然后调用服务降级的方法并返回友好提示。三个步骤先进行服务的降级、进而熔断、恢复调用链路。

实时的监控：会持续地记录所有通过Hystrix发起的请求执行信息，并以统计报表和图形的形式展示给用户，包括没秒执行多少成功，多少失败等。

了解服务限流（Flowlimit）：比如秒杀高并发等操作，严禁一窝蜂的过来拥挤、安排大家排队，一秒钟N个请求，有序进行。

## 三、代码实例

新建一个module，生产者服务端口为8001，服务名称为cloud-provider-hystrix-payment8001，新建完毕后，先配置pom.xml文件。主要是引入hystrix的依赖。如下图：

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
    <artifactId>cloud-provider-hystrix-payment8001</artifactId>
    <dependencies>
        <!--hystrix-->
        <dependency>
            <groupId>org.springframework.cloud</groupId>
            <artifactId>spring-cloud-starter-netflix-hystrix</artifactId>
        </dependency>
        <!--eureka client-->
        <dependency>
            <groupId>org.springframework.cloud</groupId>
            <artifactId>spring-cloud-starter-netflix-eureka-server</artifactId>
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
  port: 8001
spring:
  application:
    name: cloud-provider-hystrix-payment
eureka:
  client:
    register-with-eureka: true
    fetch-registry: true
    service-url:   
      defaultZone: http://eureka7001.com:7001/eureka
```

新建主启动类，如下图：

```java
package com.buba.springcloud;
import com.netflix.hystrix.contrib.metrics.eventstream.HystrixMetricsStreamServlet;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.web.servlet.ServletRegistrationBean;
import org.springframework.cloud.client.circuitbreaker.EnableCircuitBreaker;
import org.springframework.cloud.netflix.eureka.EnableEurekaClient;
import org.springframework.context.annotation.Bean;
import javax.swing.*;
@SpringBootApplication
@EnableEurekaClient
public class PaymentHystrixMain8001 {
    public static void main(String[] args) {
        SpringApplication.run(PaymentHystrixMain8001.class, args);
    }
}
```

新建业务类，如下图：

```java
package com.buba.springcloud.service;
import cn.hutool.core.util.IdUtil;
import com.netflix.hystrix.contrib.javanica.annotation.HystrixCommand;
import com.netflix.hystrix.contrib.javanica.annotation.HystrixProperty;
import org.springframework.stereotype.Service;
import java.util.concurrent.TimeUnit;
@Service
public class PaymentService {
    /**
     * 正常访问
     *
     * @param id
     * @return
     */
    public String paymentInfo_OK(Integer id) {
        return "线程池:" + Thread.currentThread().getName() + " paymentInfo_OK,id:" + id + "\t" + "O(∩_∩)O哈哈~";
    }
    /**
     * 超时访问
     *
     * @param id
     * @return
     */
   public String paymentInfo_TimeOut(Integer id) {
        int timeNumber = 3;
        try {
            // 暂停3秒钟
            TimeUnit.SECONDS.sleep(timeNumber);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
        return "线程池:" + Thread.currentThread().getName() + " paymentInfo_TimeOut,id:" + id + "\t" +
                "O(∩_∩)O哈哈~  耗时(秒)" + timeNumber;
    }
  }
```

新建控制层，如下图：

```java
package com.buba.springcloud.controller;
import com.buba.springcloud.service.PaymentService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;
import javax.annotation.Resource;
@RestController
@Slf4j
public class PaymentController {
    @Autowired
    private PaymentService paymentService;
    @Value("${server.port}")
    private String servicePort;
    /**
     * 正常访问
     *
     * @param id
     * @return
     */
    @GetMapping("/payment/hystrix/ok/{id}")
    public String paymentInfo_OK(@PathVariable("id") Integer id) {
        String result = paymentService.paymentInfo_OK(id);
        log.info("*******************result:" + result);
        return result;
    }
    /**
     * 超时访问
     *
     * @param id
     * @return
     */
    @GetMapping("/payment/hystrix/timeout/{id}")
    public String paymentInfo_TimeOut(@PathVariable("id") Integer id) {
        String result = paymentService.paymentInfo_TimeOut(id);
        log.info("*********************result:" + result);
        return result;
    }
}
```

这里为了演示方便，只使用单机版的Eureka，端口为7001，记得要修改Eureka的yml文件，要指向自己。启动Eureka，启动cloud-provider-hystrix-payment8001，访问路径[http://localhost:8001/payment/hystrix/ok/1](http://localhost:8001/payment/hystrix/ok/1)，成功界面如下图：

访问[http://localhost:8001/payment/hystrix/timeout/2](http://localhost:8001/payment/hystrix/timeout/2)，等待5秒，成功返回界面如下图：

在正常的情况下现在项目没有问题，两个接口都可以正常访问，以上述为根基平台，来演示从正确->错误->降级熔断->恢复的情况。下面我们进行高并发测试一下，看看还是是否正常。使用测试工具Jmeter，新建一个线程组，来20000个并发来压死8001,20000个请求都去访问[http://localhost:8001/payment/hystrix/timeout/2](http://localhost:8001/payment/hystrix/timeout/2)这个接口服务，如下图:

配置http请求，注意请求方式、端口号、接口，如下图：

我们启动这个线程组，可以看到线程组可以访问到接口，如下图：

然后我们自己访问这两个接口，看看会出现什么情况，出现了本来可以立马得到响应，但是两个都在转圈圈，然后才得到响应，如下图：

现如下的原因就是Tomcat的默认工作线程被打满了，没有多余的线程来分解压力和处理。上面还在只是生产者服务自己8001的测试，假如此时外部的消费者服务80也来访问，那消费者只能干等，最终导致消费端服务80不满意，服务端8001直接被拖死。

那接下来我们新建Modeule为消费者服务，端口为80，服务名为cloud-consumer-feign-hystrix-order，配置pom.xml文件，如下图：

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
    <artifactId>cloud-consumer-feign-hystrix-order</artifactId>
    <dependencies>
        <!--openfeign-->
        <dependency>
            <groupId>org.springframework.cloud</groupId>
            <artifactId>spring-cloud-starter-openfeign</artifactId>
        </dependency>
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
        <dependency>
            <groupId>com.netflix.hystrix</groupId>
            <artifactId>hystrix-javanica</artifactId>
            <version>1.5.18</version>
            <scope>compile</scope>
        </dependency>
    </dependencies>
</project>
```

新建yml配置文件，如下图：

```java
server:
  port: 80
eureka:
  client:
    register-with-eureka: true
    fetch-registry: true
    service-url:
      defaultZone: http://eureka7001.com:7001/eureka
```

新建主启动类，如下图：

```java
package com.buba.springcloud;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.circuitbreaker.EnableCircuitBreaker;
import org.springframework.cloud.netflix.eureka.EnableEurekaClient;
import org.springframework.cloud.netflix.hystrix.EnableHystrix;
import org.springframework.cloud.openfeign.EnableFeignClients;
@SpringBootApplication
@EnableEurekaClient
@EnableFeignClients
public class OrderHystrixMain {
    public static void main(String[] args) {
        SpringApplication.run(OrderHystrixMain.class, args);
    }
}
```

新建业务类，如下图：

```java
package com.buba.springcloud.service;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.stereotype.Component;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
@Component
@FeignClient(value = "CLOUD-PROVIDER-HYSTRIX-PAYMENT")
public interface PaymentHystrixService {
    /**
     * 正常访问
     *
     * @param id
     * @return
     */
    @GetMapping("/payment/hystrix/ok/{id}")
    String paymentInfo_OK(@PathVariable("id") Integer id);
    /**
     * 超时访问
     *
     * @param id
     * @return
     */
    @GetMapping("/payment/hystrix/timeout/{id}")
    String paymentInfo_TimeOut(@PathVariable("id") Integer id);
}
```

新建控制层，如下图：

```java
package com.buba.springcloud.controller;
import com.buba.springcloud.service.PaymentHystrixService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;
@RestController
@Slf4j
public class OrderHystirxController {
    @Autowired
    private PaymentHystrixService paymentHystrixService;
    @GetMapping("/consumer/hystrix/ok/{id}")
    String paymentInfo_OK(@PathVariable("id") Integer id){
        return  paymentHystrixService.paymentInfo_OK(id);
    }
    @GetMapping("/consumer/payment/hystrix/timeout/{id}")
    public String paymentInfo_TimeOut(@PathVariable("id") Integer id) {
        return paymentHystrixService.paymentInfo_TimeOut(id);
    }
}
```

启动cloud-consumer-feign-hystrix-order消费者服务，在正常情况下，进行接口调用测试，我们访问[http://localhost/consumer/hystrix/ok/1](http://localhost/consumer/hystrix/ok/1),可以看到可以立马得到响应。成功界面如下图：

那我们在高并发的情况下测试一下，看看是什么情况，我们启动线程组，然后再次访问[http://localhost/consumer/hystrix/ok/1](http://localhost/consumer/hystrix/ok/1),

会出现有时需要等待几秒才会得到响应，如下图：

然后我们访问[http://localhost/consumer/hystrix/timeout/1](http://localhost/consumer/hystrix/timeout/1)，直接出现了超时错误，如下图：

出现上述的故障和导致的现象就是因为8001同一层次的其他接口被困死，因为tomcat线程池里面的工作线程已经被挤占完毕，此时80消费端调用生产者8001服务，客户端访问响应缓慢，正因为有上述的故障和不良表现，才有我们的降级、容错、限流等技术的诞生。

**如何解决上述的问题？**

**1、** 出现超时导致服务器变慢（转圈），超时不再等待；

**2、** 出错（宕机活程序运行出错），出错要有兜底；

当我们的生产者服务8001超时了，消费者（80）不能一直卡死等待，必须要服务降级

当我们的生产者服务8001宕机了，消费者（80）不能一直卡死等待，必须要服务降级

当我们的生产者服务8001正常，但是消费者（80）自己有故障或有自有要求（自己的等待时间小于生产者服务本身需要的时间）

## 四、服务降级配置

**1、访问超时异常的服务降级**

我们要先从生产者8001服务自身开始找存在的问题，设置自身的调用超时时间的峰值，峰值内正常可以正常运行，超过了需要有兜底的方法处理，做服务降级Fallback。就比如现在访问超时的方法设置暂停2秒，我们设置该方法的峰值为3秒，如果访问超过3秒，我们就做服务降级Fallback，如果没有超过就正常返回值。如下图：

```java
/**
     * 超时访问
     *
     * @param id
     * @return
     */
   public String paymentInfo_TimeOut(Integer id) {
         try {
            // 暂停2秒钟
            TimeUnit.MILLISECONDS.sleep(2000);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
        return "线程池:" + Thread.currentThread().getName() + " paymentInfo_TimeOut,id:" + id + "\t" +
                "O(∩_∩)O哈哈~  耗时(秒)";
    }
```

服务降级Fallback，我们要在业务类中先写一个兜底的方法，如下图：

```java
    /**
     * 超时访问到这里兜底
     *
     * @param id
     * @return
     */
    public String paymentInfo_TimeOutHabdler(Integer id) {
        return "线程池:" + Thread.currentThread().getName() + " paymentInfo_TimeOutHabdler,id:" + id + "\t" +
                "系统繁忙，请稍后再试****o(╥﹏╥)o" ;
    }
```

然后在业务类中访问超时的paymentInfo_TimeOut方法上添加注解@HystrixCommand进行配置，一旦调用服务方法失败并抛出了错误信息后，会自动调用@HystrixCommand标注好的fallbackMethod调用类中的指定方法。

fallbackMethod属性是写降级的方法名，意思就是该方法出现问题后， 这个方法paymentInfo_TimeOutHabdler进行兜底。

commandProperties属性是数组形式的，可以设置多个属性，添加该注解@HystrixProperty，然后配置里边name和value的属性。name属性就是该线程timeoutInMilliseconds，value就是设置峰值时间。具体配置如下：

```java
@HystrixCommand(fallbackMethod = "paymentInfo_TimeOutHabdler",commandProperties = {
                @HystrixProperty(name = "execution.isolation.thread.timeoutInMilliseconds", value = "3000")
            } )
    public String paymentInfo_TimeOut(Integer id) {
        try {
            // 暂停2秒钟
            TimeUnit.MILLISECONDS.sleep(2000);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
        return "线程池:" + Thread.currentThread().getName() + " paymentInfo_TimeOut,id:" + id + "\t" +
                "O(∩_∩)O哈哈~  耗时(秒)";
  }
```

然后在主启动类上加上注解@EnableCircuitBreaker，表示激活业务类上加的@HystrixCommand注解。如下图：

```java
package com.buba.springcloud;
import com.netflix.hystrix.contrib.metrics.eventstream.HystrixMetricsStreamServlet;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.web.servlet.ServletRegistrationBean;
import org.springframework.cloud.client.circuitbreaker.EnableCircuitBreaker;
import org.springframework.cloud.netflix.eureka.EnableEurekaClient;
import org.springframework.context.annotation.Bean;
import javax.swing.*;
@SpringBootApplication
@EnableEurekaClient
@EnableCircuitBreaker//激活
public class PaymentHystrixMain8001 {
    public static void main(String[] args) {
        SpringApplication.run(PaymentHystrixMain8001.class, args);
    }
}
```

我们重新启动生产者服务8001，进行访问[http://localhost:8001/payment/hystrix/timeout/1](http://localhost:8001/payment/hystrix/timeout/1)，可以正常访问

下面我们将业务类中暂停时间2秒改成5秒，峰值时间是3秒，超过了峰值时间，看一下是否可以返回到设置的Fallback的paymentInfo_TimeOutHabdler兜底的方法，如下图：

```java
@HystrixCommand(fallbackMethod = "paymentInfo_TimeOutHabdler",commandProperties = {
                @HystrixProperty(name = "execution.isolation.thread.timeoutInMilliseconds", value = "3000")
            } )
    public String paymentInfo_TimeOut(Integer id) {
        try {
            // 暂停2秒钟
            TimeUnit.MILLISECONDS.sleep(5000);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
        return "线程池:" + Thread.currentThread().getName() + " paymentInfo_TimeOut,id:" + id + "\t" +
                "O(∩_∩)O哈哈~  耗时(秒)";
  }
```

重新启动后再次访问[http://localhost:8001/payment/hystrix/timeout/1](http://localhost:8001/payment/hystrix/timeout/1)，可以看到当超过峰值3秒后进行了降级服务，直接到了我们写的兜底的paymentInfo_TimeOut方法上。如下图：

**2、** 运行异常的服务降级；

修改业务类中的paymentInfo_TimeOut的方法，如下图：

```java
/**
     * 超时访问
     *
     * @param id
     * @return
     */
    @HystrixCommand(fallbackMethod = "paymentInfo_TimeOutHabdler",commandProperties = {
                @HystrixProperty(name = "execution.isolation.thread.timeoutInMilliseconds", value = "3000")
            } )
    public String paymentInfo_TimeOut(Integer id) {     
       //异常错误的演示代码
       int age = 10/0;
       return "线程池:" + Thread.currentThread().getName() + " paymentInfo_TimeOut,id:" + id + "\t" +"O(∩_∩)O哈哈~  耗时(秒)" ;
  }
```

然后再重启服务，再次访问[http://localhost:8001/payment/hystrix/timeout/1](http://localhost:8001/payment/hystrix/timeout/1)，可以看到直接就进行了降级服务，直接到了我们写的兜底的paymentInfo_TimeOut方法上，如下图：

我们现在已经对生产者服务8001进行了自身的服务降级，下面要对消费者服务80进行服务降级。首先要在pom.xml文件中新增

Hystrix的依赖，如下图：

```java
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-starter-netflix-hystrix</artifactId>
</dependency>
```

在yml配置文件中新增Hystrix的配置，如下图：

```java
feign:
  hystrix:
    enabled: true
```

在主启动类上加上注解@EnableCircuitBreaker，表示激活业务类上加的@HystrixCommand注解。如下图：

```java
package com.buba.springcloud;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.circuitbreaker.EnableCircuitBreaker;
import org.springframework.cloud.netflix.eureka.EnableEurekaClient;
import org.springframework.cloud.netflix.hystrix.EnableHystrix;
import org.springframework.cloud.openfeign.EnableFeignClients;
@SpringBootApplication
@EnableEurekaClient
@EnableFeignClients
@EnableCircuitBreaker//回路
public class OrderHystrixMain {
    public static void main(String[] args) {
        SpringApplication.run(OrderHystrixMain.class, args);
    }
}
```

然后在OrderHystirxController业务类上加上注解与里边的相关配置，然后再加上服务降级兜底的方法，如下图：

```java
     
     @GetMapping("/consumer/hystrix/timeout/{id}")
    @HystrixCommand(fallbackMethod = "paymentTimeOutFallbackMethod", commandProperties = {
           @HystrixProperty(name = "execution.isolation.thread.timeoutInMilliseconds", 
  value = "1000")
  })
    public String paymentInfo_TimeOut(@PathVariable("id") Integer id) {
        //int age = 10/0;
        return paymentHystrixService.paymentInfo_TimeOut(id);
    }
    //服务降级的兜底的方法
    public String paymentTimeOutFallbackMethod(@PathVariable("id") Integer id) {
        return "我是消费者80,对方支付系统繁忙请10秒种后再试或者自己运行出错请检查自己,o(╥﹏╥)o";
    }
```

在访问消费者80服务时，要确保生产者8001服务可以正常运行，不会出现降级服务，将生产者8001服务修改如下：

```java
/**
     * 超时访问
     *
     * @param id
     * @return
     */
    @HystrixCommand(fallbackMethod = "paymentInfo_TimeOutHabdler",commandProperties = {
                @HystrixProperty(name = "execution.isolation.thread.timeoutInMilliseconds", value = "5000")
            } )
    public String paymentInfo_TimeOut(Integer id) {
        try {
            // 暂停2秒钟
            TimeUnit.MILLISECONDS.sleep(2000);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
        return "线程池:" + Thread.currentThread().getName() + " paymentInfo_TimeOut,id:" + id + "\t" +
                "O(∩_∩)O哈哈~  耗时(秒)";
  }
```

访问生产者8001服务，[http://localhost:8001/payment/hystrix/timeout/1](http://localhost:8001/payment/hystrix/timeout/1)，没有进行服务降级，成功界面如下:

生产者8001服务测试没有问题，那消费者80服务，我们做了服务降级，因为生产者服务超时的方法需要等到暂停2秒，而我们消费80服务调用该接口时，只等待 1秒，所有会出现消费者80服务降级，如下图：

**现在生产者8001服务与消费者80服务都做了服务降级，都是没有问题的。但是我们可以发现当前的问题，如果每个业务都对应一个兜底的方法，出现了代码膨胀。解决这个问题就是如果不是特殊的业务，我们就使用全局的服务降级的兜底方法，如果是特殊的业务就要有对应的专属的服务降级的方法。**

## 五、优化代码膨胀问题

开始整合，那就需要在消费者80服务的的业务类OrderHystirxController中一个全局的服务降级的兜底的方法，如下图：

```java
 /**
     * 全局fallback
     *
     * @return
     */
    public String payment_Global_FallbackMethod() {
        return "Global异常处理信息,请稍后重试.o(╥﹏╥)o";
    }
```

然后在类上加上默认使用全局的服务降级兜底的方法，如下图：

然后在需要服务降级的方法上加上注解，如下图：

```java
    @HystrixCommand//默认的fallback注解    
    public String paymentInfo_TimeOut(@PathVariable("id") Integer id)    {
        //int age = 10/0;
        return paymentHystrixService.paymentInfo_TimeOut(id);
    }
```

那现在重启消费者80服务，再次访问[http://localhost/consumer/hystrix/timeout/1](http://localhost/consumer/hystrix/timeout/1)，该方法已经使用了全局默认的服务降级兜底的方法出现如下界面：

## 六、业务逻辑与代码混乱整合

关于服务的降级，是消费者服务去调用生产者服务，如果生产者服务出现宕机或者关闭，那我们就要对消费者服务进行服务降级处理，与生产者服务没有关系，值需要为Feign客户端定义的接口添加一个服务降级处理的实现类即可实现解耦。为了防止与业务逻辑与代码混在一块，看起来特别混乱，所以要新建一个类PaymentFallbackService，实现该业务类PaymentHystrixService接口，统一为接口里面的方法进行异常处理。如下图：

```java
package com.buba.springcloud.service;
import org.springframework.stereotype.Component;
@Component
    public class PaymentFallbackService implements PaymentHystrixService{
    @Override
    public String paymentInfo_OK(Integer id) {
        return "PaymentFallbackService fall  paymentInfo_OK 服务器出现故障,o(╥﹏╥)o";
    }
    @Override
    public String paymentInfo_TimeOut(Integer id) {
        return "PaymentFallbackService fall  paymentInfo_TimeOut 服务器出现故障,o(╥﹏╥)o";
    }
}
```

也要在PaymentHystrixService业务类上加上@FeignClient注解，表示FeignClient注解的作用目标在**接口**上，如下图：

```java
package com.buba.springcloud.service;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.stereotype.Component;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
@Component
@FeignClient(value = "CLOUD-PROVIDER-HYSTRIX-PAYMENT",fallback = PaymentFallbackService.class)
//value属性是从该服务中获取，fallback属性当服务出现故障时，该类进行服务降级处理
public interface PaymentHystrixService {
    /**
     * 正常访问
     *
     * @param id
     * @return
     */
    @GetMapping("/payment/hystrix/ok/{id}")
    String paymentInfo_OK(@PathVariable("id") Integer id);
    /**
     * 超时访问
     *
     * @param id
     * @return
     */
    @GetMapping("/payment/hystrix/timeout/{id}")
    String paymentInfo_TimeOut(@PathVariable("id") Integer id);
}
```

那我们启动服务，访问[http://localhost/consumer/hystrix/ok/1](http://localhost/consumer/hystrix/ok/1)的方法，可以成功访问，如下图：

那我们关闭生产者8001服务，再次访问[http://localhost/consumer/hystrix/ok/1](http://localhost/consumer/hystrix/ok/1)，可以看到开启了服务降级处理，让消费者服务在生产者服务不可用时，也会提示信息而不会挂起耗死服务器。如下图：

可以看到paymentInfo_OK方法上都没有进行配置服务降级，但是当生产者服务关闭后，也进行了服务降级，这里因为我们配置在了PaymentFallbackService类中，这样就解决了业务逻辑与代码混合在一起的问题。

```java
@GetMapping("/consumer/hystrix/ok/{id}")
    String paymentInfo_OK(@PathVariable("id") Integer id){
        return  paymentHystrixService.paymentInfo_OK(id);
    }
```
