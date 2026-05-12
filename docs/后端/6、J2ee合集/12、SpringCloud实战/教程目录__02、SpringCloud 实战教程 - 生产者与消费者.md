# 02、SpringCloud 实战教程 - 生产者与消费者
- 来源：https://ddkk.com/zhuanlan/j2ee/springcloud/2/2.html
- 分类：J2EE框架
- 分组：教程目录
我们继续上一篇的文章，上一篇文章将总项目和实体类微服务搭建完成了，这篇文章我们将继续搭建，搭建生产者和消费者，生产者我们可以这样理解就是我们的服务端，就是我们使用代码写的业务逻辑接口，而消费者就是我们用户，用户通过app或者web调用我们服务端的接口，获取信息。那我们下面就直接搭建，从项目中进行了解学习。

我们首先搭建一个专门放我们支付业务的服务，来让其他服务来调用使用。支付服务就是其中的一个生产者。

## 一、新建生产者

选中我们的父工程点击New，在点击Module，如下图：

点击Next。

继续Next，然后点击Finish。

修改pom.xml文件，添加依赖。具体的版本在总工程中管理，也可以在本工程中使用其他的版本。注意引入实体类的包。

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
    <artifactId>cloudprovidepayment</artifactId>
    <dependencies>
     <-- 引入实体的包-->
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
            <groupId>org.mybatis.spring.boot</groupId>
            <artifactId>mybatis-spring-boot-starter</artifactId>
        </dependency>
        <dependency>
            <groupId>com.alibaba</groupId>
            <artifactId>druid-spring-boot-starter</artifactId>
            <version>1.1.10</version>
        </dependency>
        <!--mysql-connector-java-->
        <dependency>
            <groupId>mysql</groupId>
            <artifactId>mysql-connector-java</artifactId>
        </dependency>
        <!--jdbc-->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-jdbc</artifactId>
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

在resources文件下新建application.yml配置文件

```java
server:
  port: 8001服务端口
#spring相关配置
spring:
  application:
    name: mcroservice-payment 服务名
  datasource:
    type: com.alibaba.druid.pool.DruidDataSource 当前数据源操作类型
    driver-class-name: org.gjt.mm.mysql.Driver 数据库驱动包
    url: jdbc:mysql://localhost:3306/db01?autoReconnect=true&useUnicode=true&characterEncoding=utf8&zeroDateTimeBehavior=convertToNull&useSSL=false
    username: root
    password: roo
#mybatis:配置
mybatis:
  mapperLocations: classpath:dao/*.xml
  type-aliases-package: com.buba.springcloud.pojo    所有pojo别名类所在包
```

写启动类

```java
package com.buba.springclould;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;
import org.springframework.cloud.netflix.eureka.EnableEurekaClient;
@SpringBootApplication
public class PayMentMain {
    public static void main(String[] args) {
        SpringApplication.run(PayMentMain.class,args);
    }
}
```

下面开始写业务，就是三层结构，如下图：

PaymentDao.java代码

```java
package com.buba.springclould.dao;
import com.buba.springcloud.pojo.Payment;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.springframework.stereotype.Repository;
@Mapper
@Repository
public interface PaymentDao {
   int create(Payment payment);
   Payment queryById(@Param("id")long id);
}
```

PaymentService.java代码

```java
package com.buba.springclould.service;
import com.buba.springcloud.pojo.Payment;
import org.apache.ibatis.annotations.Param;
public interface PaymentService {
    int create(Payment payment);
    Payment queryById(@Param("id")long id);
}
```

PaymentImple.java代码

```java
package com.buba.springclould.service;
import com.buba.springcloud.pojo.Payment;
import com.buba.springclould.dao.PaymentDao;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
@Service
public class PaymentImple implements PaymentService {
    @Autowired
    PaymentDao paymentDao;
    @Override
    public int create(Payment payment) {
        return paymentDao.create(payment);
    }
    @Override
    public Payment queryById(long id) {
        return paymentDao.queryById(id);
    }
}
```

PaymentControler.java代码

```java
package com.buba.springclould.controller;
import com.buba.springcloud.pojo.CommonResult;
import com.buba.springcloud.pojo.Payment;
import com.buba.springclould.service.PaymentService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cloud.client.ServiceInstance;
import org.springframework.cloud.client.discovery.DiscoveryClient;
import org.springframework.web.bind.annotation.*;
import java.util.List;
/*
* 提供restful服务  供其他服务调用
*
* */
@RestController
@Slf4j
public class PaymentControler {
    @Autowired
    private PaymentService paymentService;
    @PostMapping("/payment/create")
    public CommonResult create(@RequestBody Payment dept){
        int i = paymentService.create(dept);
        log.info("***************插入成功*******"+i);
        if(i>0){
            return new CommonResult(200,"插入数据库成功"+serverPort,i);
        }else{
            return new CommonResult(444,"插入数据库失败",null);
        }
    }
    @GetMapping("/payment/get/{id}")
    public CommonResult queryById(@PathVariable("id") Long id){
        Payment payment = paymentService.queryById(id);
        log.info("***************查询成功*********"+payment);
        if(payment!=null){
            return new CommonResult(200,"查询成功"+serverPort,payment);
        }else{
            return new CommonResult(444,"查询失败",null);
        }
    }
}
```

在resources\dao\文件夹下新建PaymentDao.xml文件，与PaymentDao映射，这里注意新建要新建spring的可识别的配置的xml文件，不会报错说找不到方法。如下图:

新建PaymentDao.xml文件,如下图：

```java
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE mapper
        PUBLIC "-//mybatis.org//DTD Config 3.0//EN" "http://mybatis.org/dqueryByidtd/mybatis-3-mapper.dtd">
<mapper namespace="com.buba.springclould.dao.PaymentDao">
    <resultMap id="BaseResultMap" type="com.buba.springcloud.pojo.Payment">
        <id column="id" property="id" jdbcType="BIGINT"/>
        <id column="serial" property="serial" jdbcType="VARCHAR"/>
    </resultMap>
    <insert id="create" parameterType="com.buba.springcloud.pojo.Payment" useGeneratedKeys="true" keyProperty="id">
        insert into payment (serial) values (#{serial});
    </insert>
    <select id="queryById" resultType="com.buba.springcloud.pojo.Payment" parameterType="Long" resultMap="BaseResultMap">
        select * from payment  where id ={id};
    </select>
</mapper>
```

## 二、新建消费者服务

订单的服务端的工程（生产者）我们就搭建完成了，那我们开始搭建订单的客户端工程（消费者）。选中我们的父工程点击New，在点击Module，如下图：

点击Next，填写工程名称。

继续Next，确认工程名称，然后点击Finish完成订单服务工程创建。

开始配置修改pom.xml文件，添加依赖。具体的版本在总工程中管理，也可以在本工程中使用其他的版本。注意引入实体类的包。

```java
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <parent>
        <groupId>com.study.springcloud</groupId>
        <artifactId>mcroservice</artifactId>
        <version>1.0-SNAPSHOT</version>
    </parent>
    <modelVersion>4.0.0</modelVersion>
    <artifactId>cloud-consumer-order</artifactId>
    <dependencies>       
        <dependency>
             <-- 引入实体的包-->
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
            <groupId>com.study.springcloud</groupId>
            <artifactId>cloud-api-commons</artifactId>
            <version>1.0-SNAPSHOT</version>
            <scope>compile</scope>
        </dependency>
    </dependencies>
</project>
```

在resources文件下新建application.yml配置文件

```java
server:
  port: 80
spring:
  application:
    name: mcroservice-order 服务名
```

写启动类

```java
package com.buba.springclould.order;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.netflix.eureka.EnableEurekaClient;
@SpringBootApplication
public class OrderMain {
    public static void main(String[] args) {
        SpringApplication.run(OrderMain.class,args);
    }
}
```

新建RestTemplate配置类注入到Spring中ioc容器中

这里服务间的调用，我们使用了RestTemplate，RestTemplate提供了多种便捷访问远程Http服务的方法，是一种简单便捷的访问restful服务的模板类，是spring提供的用于访问Rest服务的客户端模板工具集。[官网了解更多](https://docs.spring.io/spring-framework/docs/5.2.2.RELEASE/javadoc-api/org/springframework/web/client/RestTemplate.html)

```java
package com.buba.springclould.order.config;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;
@Configuration
public class ApplicationContextConfig {
    @Bean
    public RestTemplate getRestTemplate(){
        return new RestTemplate();
    }
}
```

写消费者的业务调用接口

```java
package com.buba.springclould.order.controller;
import com.buba.springcloud.pojo.CommonResult;
import com.buba.springcloud.pojo.Payment;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestTemplate;
@RestController
@Slf4j
public class OrderController {
    //调用支付订单服务端的ip+端口号
    public static final  String PAYMENT_URL = "http://localhost:8001";
    @Autowired
    private RestTemplate restTemplate;
    //创建支付订单的接口
    @GetMapping("/consumer/payment/create")
    public CommonResult<Payment> create(Payment payment){
        return restTemplate.postForObject(PAYMENT_URL+"/payment/create",payment, CommonResult.class);
    }
    //获取id获取支付订单
    @GetMapping("/consumer/payment/get/{id}")
    public CommonResult<Payment> getPayment(@PathVariable("id") Long id){
        return restTemplate.getForObject(PAYMENT_URL+"/payment/get/"+id,CommonResult.class);
    }
}
```

## 三、服务间调用测试

生产者和消费者就搭建完成啦。那我们现在就测试一下看看，支付消费者能否成功调用支付生产者。分别启动两个工程。首先自测一下生产者的服务是否可以访问，端口为8001，如下图可以访问成功，说明生产者的服务是没有问题的。

我们消费者的端口配置为80，访问就可以省略端口，直接输入：[http://localhost/consumer/payment/get/1](http://localhost/consumer/payment/get/1)访问。成功获取到id为1的支付订单。

到这里我们springcloud的简单的搭建就成功啦。是不是so easy！

那接下来我们会继续学习，我们下一篇文章将搭建支付服务端的集群与集成eureka服务注册与发现。持续关注、点赞。我们持续更新中。
