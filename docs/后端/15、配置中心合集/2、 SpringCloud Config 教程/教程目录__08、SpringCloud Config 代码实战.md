# 08、SpringCloud Config 代码实战
- 来源：https://ddkk.com/zhuanlan/config/springcloudconfig/8.html
- 分类：配置中心
- 分组：教程目录
## 一、SpringCloud Config概述

SpringCloud Config为微服务架构中的微服务提供集中化的外部配置支持，配置服务器为各个不同微服务应用的所有环境提供一个中心化的外部配置。

**需求分析：** 假如我们有十个微服务，这时候我们需要修改数据库地址，我们就需要十个微服务中配置 文件，从而修改一次，十分麻烦。所以我们希望可以吧他们的配置的一些公有的配置同意放入到ConfigServer中，像数据库这种公有的配置，我们只需修改一次ConfigServer中即可完成。

**SpringCloud Config分为服务单和客户端两部分：**

- 服务端也称为分布式配置中心，它是一个独立的微服务应用，用来连接配置服务器并为客户端提供获取配置信息，加密/解密信息等访问接口
- 客户端则是通过指定的配置中心来管理应用资源，以及与业务相关的配置内容，并在启动的时候从配置中心获取和加载配置信息配置服务器默认采用git来存储配置信息，这样就是有助于对环境配置进行版本管理，并且可以通过git客户端工具来方便的管理和访问配置内容。

**SpringCloud Config的作用有哪些呢？**

**1、** 集中管理配置文件；

**2、** 不同的环境不同配置，动态化的配置更新，分环境部署，比如dev，test，prod等；

**3、** 运行期间动态调整配置，不再需要在每个服务部署的机器上编写配置文件，服务会向配置中心统一拉取配置自己的信息；

**4、** 当配置发生变动时，服务不需要重启即可感知到配置的变化并应用新的配置；

**5、** 将配置信息以REST接口的形式暴露；

## 一、SpringCloud Config的使用（服务端）

服务端用来负责连接远程仓库，并读取到配置文件。

pom依赖：

```xml
<!--带了server表示为config服务端-->
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-config-server</artifactId>
</dependency>
```

这里我们的用的是Gitee，也可以选择使用GitHub。

**1、** 用自己的Gitee账号，创建一个名为SpringCloud-Config的新的Repository；

**2、** 将新建的仓库gitclone拉取到本地；

把仓库的地址配置到我们的项目的yml文件中

**3、** 在spring-cloud-config远程仓库中创建三个配置文件；

**4、** 启动项目，通过localhosst:3344/master/config-dev.yml读取远程仓库配置文件，读取到远程仓库数据，表示我们的配置成功；

## 二、SpringCloud Config的使用（客户端）

客户端的Pom依赖：

```xml
<!--没有带server表示为config客户端-->
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-starter-config</artifactId>
</dependency>
```

在Config客户端我们除了要有application.yml配置文件外，还需额外的bootstrap.yml文件。因为bootstrap.yml是系统级的，用作读取服务端公有的配置文件，而application.yml在作为我们私有的配置文件。

> application.yml：是用户级的资源配置项
>
> bootstrap.yml：是系统级的，优先级更加高

SpringCloud会创建一个“Bootstrap Context”，作为Spring应用的‘Application Context’ 的父上下文。初始化的时候，‘Boostrap Context’负责从外部源加载配置属性并解析配置。这俩个上下文共享一个从外部获取的‘Environment’。

‘BootStrap’属性有高优先级。默认情况下，他们不会被本地配置覆盖。‘Bootstrap context’ 和 ‘Application Context’有着不同的约定，所以新增了一个‘bootstrap.yml’文件，保证‘Bootstrap Context’ 和‘Application Context’配置的分离。

**要将Client模块下的application文件改为bootstrap.yml,这很关键。**因为bootstrap.yml是比application.yml先加载的。bootstrap优先级高于application.yml

**1、** 创建bootstrap.yml文件；

```sh
server:
  port: 3355
spring:
  application:
    name: config-client 注册进Eureka服务器的微服务名
  cloud:
    config:
      label: master 分支名称
      name: config  配置文件名称
      profile: dev  读取后缀名称 上述三个综合：master分支上config-dev.yml的配置文件被读取http://localhost:3344/master/config-dev.yml
      uri: http://localhost:3344
# 服务注册到Eureka地址
eureka:
  client:
    service-url:
      defaultZone:  http://localhost:7001/eureka
```

**1、** 创建主启动类；

```java
package com.atguigu.springcloud;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.netflix.eureka.EnableEurekaClient;
/**
 * @author Alienware
 */
@EnableEurekaClient
@SpringBootApplication
public class ConfigClient3355 {
    public static void main(String[] args){
        SpringApplication.run(ConfigClient3355.class,args);
    }
}
```

**1、** 创建controller；

```java
package com.atguigu.springcloud.controller;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
/**
 * @author Alienware
 */
@RestController
public class ConfigClientController {
    @Value("${config.info}")
    private String configInfo;
    @GetMapping("/configInfo")
    private String getConfigInfo(){
        return configInfo;
    }
}
```

**1、** 测试访问http://localhost:3355/configInfo；

读取到了gitee远程仓库config-dev.yml配置内容

**发现问题：** 现在我们在gitee远程仓库中修改配置文件，发现ConfigServer无需重启，即可获取到最新配置，而我们的ConfigClient获取不到，需要重启过后才能获取到最新配置。如何解决呢？

**2、** 首先POM文件引入actuator监控；

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-actuator</artifactId>
</dependency>
```

**1、** 暴露监控端点，在Config客户端3355,bootstrap.yml文件中添加如下代码；

```sh
# 暴露监控端点
management:
  endpoints:
    web:
      exposure:
        include: "*"
```

**1、** 在控制层Controller添加注解@RefreshScore；

这时候测试发现，我们在远程仓库中修改了配置文件值，发现ConfigClient3355没有重启，还是无法获取到最新值。

这时候我们需要最后一步：

**2、** 需要发送POST请求：curl-XPOST"http://localhost:3355/actuator/refresh；

我们再次测试，发现可以获取到最新的值了。

> 版权声明：「DDKK.COM 弟弟快看，程序员编程资料站」本站文章，版权归原作者所有
