# 01、SpringCloud Zuul 教程
- 来源：https://ddkk.com/zhuanlan/gateway/springcloudzuul/1.html
- 分类：API网关
- 分组：教程目录
## 1、什么是网关？

> 网关是一个网络整体系统中的前置门户入口，请求首先通过网关，进行路径的路由，定位到具体的服务节点上。

## 2、什么是Zuul?

**1、** Zuul是一个微服务网关，也是会在Eureka注册中心中进行服务的注册和发现，请求应该通过Zull来进行路由。

**2、** Zuul网关不是必要的，是推荐使用的，一般在微服务数量较多（多于10个）的时候推荐使用，对服务的管理有严格要求的时候推荐使用，当微服务权限要求严格的时候推荐使用。

Zuul包含了对请求的路由和过滤两个最主要功能：

**路由功能**：负责将外部请求转发到具体的微服务实例上，是实现外部访问统一入口的基础。

**过滤器功能**：负责对请求的处理过程进行干预，是实现请求校验，服务聚合等功能的基础。

## 3、Zuul 能做什么？

Zuul可以通过加载动态过滤机制，从而实现以下各项功能：

**1、** 验证与安全保障: 识别面向各类资源的验证要求并拒绝那些与要求不符的请求。

**2、** 审查与监控: 在边缘位置追踪有意义数据及统计结果，从而为我们带来准确的生产状态结论。

**3、** 动态路由: 以动态方式根据需要将请求路由至不同后端集群处。

**4、** 压力测试: 逐渐增加指向集群的负载流量，从而计算性能水平。

**5、** 负载分配: 为每一种负载类型分配对应容量，并弃用超出限定值的请求。

**6、** 静态响应处理: 在边缘位置直接建立部分响应，从而避免其流入内部集群。

**7、** 多区域弹性: 跨越AWS区域进行请求路由，旨在实现ELB使用多样化并保证边缘位置与使用者尽可能接近。

除此之外，Netflix公司还利用Zuul的功能通过金丝雀版本实现**精确路由与压力测试**。

## 4、Zuul和Eureka整合

**Zuul和Eureka进行整合，将Zuul自身注册为Eureka服务治理下的应用，同时从Eureka中获得其他服务的消息，也即以后的访问微服务都是通过Zuul跳转后获得。**

## 5、搭建Zuul

### 5.1 建立Maven父工程

**编写pom.xml：**

```xml
<dependencyManagement>
	<dependencies>
		<dependency>
			<groupId>org.springframework.cloud</groupId>
			<artifactId>spring-cloud-alibaba-dependencies</artifactId>
			<version>0.2.0.RELEASE</version>
			<type>pom</type>
			<scope>import</scope>
		</dependency>
		<!--springCloud的依赖-->
		<dependency>
			<groupId>org.springframework.cloud</groupId>
			<artifactId>spring-cloud-dependencies</artifactId>
			<version>Hoxton.SR12</version>
			<type>pom</type>
			<scope>import</scope>
		</dependency>
		<!--SpringBoot-->
		<dependency>
			<groupId>org.springframework.boot</groupId>
			<artifactId>spring-boot-dependencies</artifactId>
			<version>2.3.12.RELEASE</version>
			<type>pom</type>
			<scope>import</scope>
		</dependency>
	</dependencies>
</dependencyManagement>
```

### 5.2 建立子工程

**注意：同样是Maven**

### 5.3 配置服务中心 springcloud-eureka-7001

**1、** 建立以下目录

****

**2、** 导入依赖

```java
<!--导包~-->
<dependencies>
    <!--导入Eureka Server依赖-->
    <dependency>
        <groupId>org.springframework.cloud</groupId>
        <artifactId>spring-cloud-starter-eureka-server</artifactId>
        <version>1.4.6.RELEASE</version>
    </dependency>
    <!--热部署工具-->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-devtools</artifactId>
    </dependency>
</dependencies>
```

**3、** 编写配置文件

**application.yml:**

```sh
server:
  port: 7001
# Eureka配置
eureka:
  instance:
    # Eureka服务端的实例名字
    hostname: localhost
  client:
    # 表示是否向 Eureka 注册中心注册自己(这个模块本身是服务器,所以不需要)
    register-with-eureka: false
    # fetch-registry如果为false,则表示自己为注册中心,客户端的化为 ture
    fetch-registry: false
    # Eureka监控页面~
    service-url:
      defaultZone: http://${eureka.instance.hostname}:${server.port}/eureka/
```

**4、** 编写启动类

```java
package com.yixin.springcloud;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.netflix.eureka.server.EnableEurekaServer;
@SpringBootApplication
@EnableEurekaServer
public class EurekaServer_7001 {
    public static void main(String[] args) {
        SpringApplication.run(EurekaServer_7001.class, args);
    }
}
```

### 5.4 配置服务生产方springcloud-provider-blog-8001

**1、** 建立以下目录

****

**2、** 导入依赖

```java
<!--导包~-->
<dependencies>
    <!-- https://mvnrepository.com/artifact/org.springframework.cloud/spring-cloud-starter-eureka-server -->
    <!--导入Eureka Server依赖-->
    <dependency>
        <groupId>org.springframework.cloud</groupId>
        <artifactId>spring-cloud-starter-eureka</artifactId>
        <version>1.4.6.RELEASE</version>
    </dependency>
    <!--Spring Boot-->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-test</artifactId>
        <version>2.4.5</version>
    </dependency>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-web</artifactId>
        <version>2.4.5</version>
    </dependency>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-test</artifactId>
        <version>2.4.5</version>
    </dependency>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-jetty</artifactId>
        <version>2.5.2</version>
    </dependency>
    <!--热部署工具-->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-devtools</artifactId>
    </dependency>
</dependencies>
```

**3、** 编写配置类

```sh
server:
  port: 8001
spring:
  application:
    name: springcloud-provider-blog
# Eureka配置：配置服务注册中心地址
eureka:
  client:
    service-url:
      defaultZone: http://localhost:7001/eureka/
  instance:
    instance-id: springcloud-provider-dept-8001 #修改Eureka上的默认描述信息
```

**4、** 编写BlogController

```java
package com.yixin.springcloud.controller;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;
@RestController
public class BlogController {
    //表示db这个数据库
    @Value("dbsource")
    private String dbsource;
    @GetMapping("/blog/info/{id}")
    public String getInfo(@PathVariable("id") Integer id){
        return dbsource+id;
    }
}
```

**5、** 编写启动类

```java
package com.yixin.springcloud;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.netflix.eureka.EnableEurekaClient;
@SpringBootApplication
@EnableEurekaClient
public class BlogProvider_8001 {
    public static void main(String[] args) {
        SpringApplication.run(BlogProvider_8001.class,args);
    }
}
```

### 5.5 配置路由网关springcloud-zuul

**1、** 建立以下目录

****

**2、** 导入依赖

```xml
<dependencies>
    <!--导入zuul依赖-->
    <dependency>
        <groupId>org.springframework.cloud</groupId>
        <artifactId>spring-cloud-starter-zuul</artifactId>
        <version>1.4.6.RELEASE</version>
    </dependency>
    <!--Eureka-->
    <dependency>
        <groupId>org.springframework.cloud</groupId>
        <artifactId>spring-cloud-starter-eureka</artifactId>
        <version>1.4.6.RELEASE</version>
    </dependency>
    <!--web-->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-web</artifactId>
    </dependency>
    <!--热部署-->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-devtools</artifactId>
    </dependency>
</dependencies>
```

**3、** 编写配置类

```sh
server:
  port: 9527
spring:
  application:
    name: springcloud-zuul-yixin
eureka:
  client:
    service-url:
      defaultZone: http://localhost:7001/eureka/
  instance:
    instance-id: zuul9527.com
    prefer-ip-address: true
zuul:
  routes:
    mydept.serviceId: springcloud-provider-blog
    mydept.path: /myblog/**
  ignored-services: springcloud-provider-dept # 不能再使用该路径访问
 # ignored-services: "*" # 隐藏全部的
  prefix: /yixin #公共的访问前缀
```

**注意：经过我们的路由网关规则配置，**

**原来访问**：http://localhost:9527/springcloud-provider-blog/blog/info/5

**配置过后访问**：http://localhost:9527/yixin/myblog/blog/info/5

**4、** 编写启动类

**注意：添加注解@EnableZuulProxy开启Zuul。**

```java
package com.yixin.springcloud;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.netflix.zuul.EnableZuulProxy;
@SpringBootApplication
@EnableZuulProxy  // 开启Zuul
public class ZuulApplication_9527 {
    public static void main(String[] args) {
        SpringApplication.run(ZuulApplication_9527.class,args);
    }
}
```

### 5.6 测试

**依次启动：**

**a、springcloud-eureka-7001:服务注册中心**

**b、springcloud-provider-blog-8001：服务生产方**

**c、springcloud-zuul：路由网关**

**1、** 访问：http://localhost:7001/

出现以下界面，说明成功把我们的两个服务（服务生产方和路由网关）注册进来了。

**2、** 访问：http://localhost:9527/yixin/myblog/blog/info/6

**注意：是9527端口！**

****

**我们看到，微服务名称被替换并隐藏，换成了我们自定义的微服务名称myblog，同时加上了前缀yixin，这样就做到了对路由访问的加密处理！**

**3、** 访问：http://localhost:9527/springcloud-provider-blog/blog/info/5

**由于我们在配置文件中配置了以下语句，所以这样访问是不允许的。**

```java
ignored-services: springcloud-provider-dept # 不能再使用该路径访问
```

**4、** 如果我们不配置zuul规则，那么上面的链接是可以正常访问的

application.yml

```sh
server:
  port: 9527
spring:
  application:
    name: springcloud-zuul-yixin
eureka:
  client:
    service-url:
      defaultZone: http://localhost:7001/eureka/
  instance:
    instance-id: zuul9527.com
    prefer-ip-address: true
```

重启spring-zuul

**重新访问：http://localhost:9527/springcloud-provider-blog/blog/info/5**

**至此，测试成功！**

## 小结

以上就是【一心同学】对基于Spring Cloud对其组件【路由网关Zuul】的讲解，我们要记住其两个最核心的功能【路由】和【过滤】，通过对路由网关的处理，可以做到对我们的访问进行【加密处理】！

> 版权声明：「DDKK.COM 弟弟快看，程序员编程资料站」本站文章，版权归原作者所有
