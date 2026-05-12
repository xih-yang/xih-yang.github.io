# 04、SpringCloud 实战教程 - Eureka集群版搭建
- 来源：https://ddkk.com/zhuanlan/j2ee/springcloud/2/4.html
- 分类：J2EE框架
- 分组：教程目录
上一篇我们只是简单的搭建了Eureka的单机版，但是在真正的生产环境上，是远远不够的，微服务RPC远程服务调用最核心的就是高可用，如果一台Eureka宕机了，那我们整个服务就不能使用了，所以就需要我们的集群版，实现负载均衡与故障容错。

我们参考cloud-eureka-server，新建module我们命名为cloud-eureka-server02，这样可以防止与cloud-eureka-server区别开来。具体的如何新建module这里就不贴截图了，具体的新建步骤看前两篇文章都有。

这里从修改pom文件开始贴代码。注意：主要就是添加eureka-server依赖。

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
    <artifactId>cloud-eureka-server02</artifactId>
    <dependencies>
        <!--eureka-server-->
        <dependency>
            <groupId>org.springframework.cloud</groupId>
            <artifactId>spring-cloud-starter-netflix-eureka-server</artifactId>
        </dependency>
        <!-- 引入自己定义的api通用包，可以使用Payment支付Entity -->
        <dependency>
            <groupId>com.study.springcloud</groupId>
            <artifactId>cloud-api-commons</artifactId>
            <version>${project.version}</version>
        </dependency>
        <!--boot web actuator-->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-actuator</artifactId>
        </dependency>
        <!--一般通用配置-->
        <dependency>
            <groupId>org.projectlombok</groupId>
            <artifactId>lombok</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-test</artifactId>
            <scope>test</scope>
        </dependency>
        <dependency>
            <groupId>junit</groupId>
            <artifactId>junit</artifactId>
        </dependency>
    </dependencies>
</project>
```

这里需要注意的是，Eureka集群是需要修改映射配置的，我们找到C:\Windows\System32\drivers\etc路径下的hosts文件，在文件的最后加上我们两个Eureka的映射，如下图：

，

配置yml文件，Eureka集群，是需要指向其他的Eureka，比如我现在的7001指向7002,7002指向7001。如果多个就要闭环的指向，比如1指向2,2指向3，3指向1。这简称为互相注册，相互守望。

Eureka端口为7002的的yml文件，如下图：

```java
server:
  port: 7002
eureka:
  instance:
    hostname: eureka7002.comeureka服务端的实例名称
  client:
    register-with-eureka: false    false表示不向注册中心注册自己。
    fetch-registry: false    false表示自己端就是注册中心，我的职责就是维护服务实例，并不需要去检索服务
    service-url:
     设置与eureka  server交互的地址和注册服务都需要依赖这个地址
      defaultZone: http://eureka7001.com:7001/eureka/ 集群就是指向其他的eureka
```

Eureka端口为7001的的yml文件，如下图：

```java
server:
  port: 7001
eureka:
  instance:
    hostname: eureka7001.comeureka服务端的实例名称
  client:
    register-with-eureka: false    false表示不向注册中心注册自己。
    fetch-registry: false    false表示自己端就是注册中心，我的职责就是维护服务实例，并不需要去检索服务
    service-url:
     设置与eureka  server交互的地址和注册服务都需要依赖这个地址
      defaultZone: http://eureka7002.com:7002/eureka/  集群就是指向其他的eureka
```

主启动类：因为是Eureka的服务端，所以要加该注解@EnableEurekaServer

```java
package com.buba.springcloud.eureka;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.netflix.eureka.server.EnableEurekaServer;
@SpringBootApplication
@EnableEurekaServer
public class EurekaMain02 {
    public static void main(String[] args) {
        SpringApplication.run(EurekaMain02.class,args);
    }
}
```

我们现在修改生产者的服务，也就是cloud-provide-payment这个服务，修改yml文件，将该服务分别注入这个Eureka中：换成

defaultZone: http://eureka7001.com:7001/eureka,http://eureka7002.com:7002/eureka

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
    password: root
#mybatis:配置
mybatis:
  mapperLocations: classpath:dao/*.xml
  type-aliases-package: com.buba.springcloud.pojo    所有pojo别名类所在包
#eureka配置
eureka:
  client:
   表示是否将自己注册进eureka  默认为true
    register-with-eureka: true
   是否从EurekaServer中抓取已有的注册信息，默认为true，单点无所谓，集群必须设置true才能和ribbon使用负载均衡
    fetch-registry: true
    service-url:
     集群配置
      defaultZone: http://eureka7001.com:7001/eureka,http://eureka7002.com:7002/eureka
  instance:
   服务名称修改
    instance-id: payment8001
   访问路径可以显示ip地址
    prefer-ip-address: true
```

现在我们要先启动Eureka端口为7001的服务，然后再启动Eureka端口为7002的服务，再启动我们的生产者的服务，最后启动消费者的服务。

先看一下Eureka端口为7001的服务，看到生产者和消费者都已经成功注册到了Eureka服务中心。如下图：

再看看一下Eureka端口为7002的服务，看到生产者和消费者都已经成功注册到了Eureka服务中心。如下图：

下面测试一下消费者服务，是否可以成功访问。输入[http://localhost/consumer/payment/get/1](http://localhost/consumer/payment/get/1)，访问成功，如下图：

集群版的Eureka就搭建完成啦，看起来难，做起来就很容易，你不会之前觉得难，学会之后就觉得很简单。

下一篇文章搭建生产者集群服务实现负载均衡，持续关注、点赞。我们持续更新中。
