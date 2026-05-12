# 02、注册中心Eureka
- 来源：https://ddkk.com/zhuanlan/j2ee/springcloud/1/2.html
- 分类：J2EE框架
- 分组：教程目录
Springboot: 2.1.6.RELEASE

SpringCloud: Greenwich.SR1

如无特殊说明，本系列教程全采用以上版本

Eureka是Netflix开源的一款提供服务注册和发现的产品，它提供了完整的Service Registry和Service Discovery实现。也是springcloud体系中最重要最核心的组件之一。

## 注册中心的意义

#### 注册中心

管理各种服务功能包括服务的注册、发现、熔断、负载、降级等，比如dubbo admin后台的各种功能。

有了注册中心，调用关系的变化，画几个简图来看一下。

服务A调用服务B

有了注册中心之后，任何一个服务都不在是直连的，都需要通过注册中心去调用。

如果是一个连续调用：

服务A调用服务B，服务B调用服务C

这里如果加上注册中心，整个调用流程就会分为两步，服务A先从注册中心请求服务B，服务B再从注册中心请求服务C

上面的示例只是描述了两三个服务之间的互相调用，可能加上注册中心还会稍显繁琐，如果一条调用链上面有几十个服务（这个丝毫不是开玩笑哦，正常的业务流程中很可能出现这种复杂的调用过程），在工作中我就遇到过超过20个服务的互相调用，这种复杂业务场景的互相调用，如果不使用注册中心，画出来的图会连成一个网状结构，单从图上面已经很难找出服务的上下游关系了。其中如果一个服务有改动，就会牵扯到上下游多台机器的重启，整个架构设计完全耦合在一起，每次改动所需要的工作量完全超出想象。通过注册中心去注册服务，完全不在需要关心上下游机器的ip地址，由几台服务器组成，是否重启才会生效，注册中心已经帮我们把服务的注册和发现做好了，我们只需要知道注册中心在哪里，对应的服务名是什么就ok啦~~

由于各种服务都注册到了服务中心，就有了去做很多高级功能条件。比如几台服务提供相同服务来做均衡负载；监控服务器调用成功率来做熔断，移除服务列表中的故障点；监控服务调用时间来对不同的服务器设置不同的权重等等。

## Netflix的前世今生

在说Eureka之前我们先了解一下Netflix这家公司：

以下介绍来自于百度百科：

> Netflix(Nasdaq NFLX) 成立于1997年，是一家在线影片租赁提供商，主要提供Netflix超大数量的DVD并免费递送，总部位于美国加利福尼亚州洛斯盖图。
>
> Netflix已经连续五次被评为顾客最满意的网站。可以通过PC、TV及iPad、iPhone收看电影、电视节目，可通过Wii，Xbox360，PS3等设备连接TV。Netflix大奖赛从2006年10月份开始，Netflix公开了大约1亿个1－5的匿名影片评级，数据集仅包含了影片名称。评价星级和评级日期，没有任何文本评价的内容。比赛要求参赛者预测Netflix的客户分别喜欢什么影片，要把预测的效率提高10%以上。

总而言之，这是一家全球最大的（可能要排除国内的，具体不清楚）流媒体公司，最开始见这个单子是在各种美剧或者电影的开头，顺手百度了一下，Netflix拍摄的代表性的美剧有《纸牌屋》、《毒枭》、《怪奇物语》。springcloud的微服务就是基于Netflix这家公司的开源产品来做的。

Netflix的开源框架组件已经在Netflix的大规模分布式微服务环境中经过多年的生产实战验证，正逐步被社区接受为构造微服务框架的标准组件。Spring Cloud开源产品，主要是基于对Netflix开源组件的进一步封装，方便Spring开发人员构建微服务基础框架。对于一些打算构建微服务框架体系的公司来说，充分利用或参考借鉴Netflix的开源微服务组件(或Spring Cloud)，在此基础上进行必要的企业定制，无疑是通向微服务架构的捷径。

## Eureka

按照官方介绍：

> Eureka is a REST (Representational State Transfer) based service that is primarily used in the AWS cloud for locating services for the purpose of load balancing and failover of middle-tier servers.
>
> Eureka 是一个基于 REST 的服务，主要在 AWS 云中使用, 定位服务来进行中间层服务器的负载均衡和故障转移。

Spring Cloud 封装了 Netflix 公司开发的 Eureka 模块来实现服务注册和发现。Eureka 采用了 C-S 的设计架构。Eureka Server 作为服务注册功能的服务器，它是服务注册中心。而系统中的其他微服务，使用 Eureka 的客户端连接到 Eureka Server，并维持心跳连接。这样系统的维护人员就可以通过 Eureka Server 来监控系统中各个微服务是否正常运行。Spring Cloud 的一些其他模块（比如Zuul）就可以通过 Eureka Server 来发现系统中的其他微服务，并执行相关的逻辑。

Eureka由两个组件组成：Eureka服务器和Eureka客户端。Eureka服务器用作服务注册服务器。Eureka客户端是一个java客户端，用来简化与服务器的交互、作为轮询负载均衡器，并提供服务的故障切换支持。Netflix在其生产环境中使用的是另外的客户端，它提供基于流量、资源利用率以及出错状态的加权负载均衡。

用官方的一张图来认识一下：

上图简要描述了Eureka的基本架构，由3个角色组成：

**1、** EurekaServer；

- 提供服务注册和发现

**2、** ServiceProvider；
- 服务提供方
- 将自身服务注册到Eureka，从而使服务消费方能够找到

**3、** ServiceConsumer；
- 服务消费方
- 从Eureka获取注册服务列表，从而能够消费服务

## 案例实践

终于到了重头戏，开始撸代码~~~

#### Eureka Server

关于创建springcloud项目，目前有两种比较方便的方案，核心都是一样的，大家自行选择自己使用方便的。

**方式一：**

打开spring的官方链接：

[https://start.spring.io/](https://start.spring.io/)

在Group中填入自己的组织，一般填写公司的域名的到写，例如com.jd或者com

.baidu，这里我直接写com.springcloud。

在Artifact中填写工程的名称，这里我直接写Eureka。

package选择jar，java选择8，至此，基础选择已经全都选完，接下来要开始选择我们使用的springcloud的组件了，也就是重头——Eureka组件。

在Dependencies中找到Spring Cloud Discovery，选择Eureka Serve，结果如下图：

最后点击下方的绿色长条按钮 **Generate the project** 进行下载，等待下载完成后，直接将压缩包解压导入我们的编辑工具idea里即可。

**方式二：**

基于idea创建，打开idea，首先file->new->project，选中spring Initializr，这时可以看到右侧让我们选择一个初始化的服务url，默认的就是上面的官方链接，[https://start.spring.io/](https://start.spring.io/)

点击next下一步，填写和上面一样的Group、Artifact、java版本、package方式等信息，继续next下一步，选择依赖，和前面的方法的一样，在Dependencies中找到Spring Cloud Discovery，选择Eureka Serve，点击next，选择项目名称和存储路径，点击finish，静静等一会，第一个项目Eureka就新鲜出炉了~~~

我一般选择第一种方式创建springcloud项目，这种方式不依赖IDE工具。

#### pom.xml

maven项目，首先看一下pom.xml:

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
    <artifactId>Eureka</artifactId>
    <version>0.0.1-SNAPSHOT</version>
    <name>Eureka</name>
    <description>Demo project for Spring Boot</description>
    <properties>
        <java.version>1.8</java.version>
        <spring-cloud.version>Greenwich.SR1</spring-cloud.version>
    </properties>
    <dependencies>
        <dependency>
            <groupId>org.springframework.cloud</groupId>
            <artifactId>spring-cloud-starter-netflix-eureka-server</artifactId>
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

- **parent：** 父级依赖项目，这里能看到依赖的父级的springboot的版本是2.1.6.RELEASE。
- **properties：** 当前配置文件一些配置，可以看到Java的版本是1.8，springcloud的版本是Greenwich.SR1。
- **dependencies：** 当前项目依赖的组件，这里能看出来依赖两个组件，一个是Eureka，还有一个是test测试框架。
- ***dependencyManagement：** 这里是声明依赖，并不实现引入，如果不在子项目中声明依赖，是不会从父项目中继承下来的；只有在子项目中写了该依赖项，并且没有指定具体版本，才会从父项目中继承该项，并且version和scope都读取自父pom;另外如果子项目中指定了版本号，那么会使用子项目中指定的jar版本。
- **build：** 在build中声明了当前使用的插件，spring-boot-maven-plugin，主要功能：能够将Spring Boot应用打包为可执行的jar或war文件，然后以通常的方式运行Spring Boot应用。

#### 配置

默认的配置文件是在resource下面的application.properties，在springboot的项目中，目前支持两种配置文件的形式，还有一种是yaml，我这里使用的所有配置全为yaml形式。

```sh
server:
  port: 8761
spring:
  application:
    name: eureka-serve
eureka:
  server:
    enable-self-preservation: false
  client:
    register-with-eureka: false
    service-url:
      defaultZone: http://localhost:8761/eureka/
```

- **enable-self-preservation：** 防止由于Eureka的机制导致Client被错误显示在线，仅在开发环境使用，生产环境需缓存此信息，防止因网络波动导致服务频繁上下线。
- **register-with-eureka：** 不像注册中心注册自己
- **register-with-eureka：** 此eureka server的应用注册地址

#### 启动EurekaApplication.java

```java
package com.springcloud.Eureka;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.netflix.eureka.server.EnableEurekaServer;
@SpringBootApplication
@EnableEurekaServer
public class EurekaApplication {
    public static void main(String[] args) {
        SpringApplication.run(EurekaApplication.class, args);
    }
}
```

增加注解@EnableEurekaServer，在这个main函数上，直接右键debug就可以启动了，启动成功如下图所示：

现在单机的注册中心已经成功启动， 引申出来一个问题，注册中心是所有的服务提供者注册服务的地方，如果只有一台机器，一旦因为某些原因，引发宕机，会造成整体服务不可用，所以，这种中心服务在生产环境必须是集群化部署，如果对高可用、容灾和备份有更高的要求，还可以分机房部署，分地区部署。

## 高可用集群

#### 双机部署

增加idea启动配置，点击右上角的Edit Configurations，如下图：

在打开的窗口中新建一个springboot的启动方式，命名为Eureka1，增加启动参数Program arguments：–server.port=8080，点击apply保存，如下图：

使用新创建的启动配置启动服务，现在可以看到正常启动。接下来就是修改配置文件，使两个独立的服务变为集群。

```sh
server:
  port: 8761
spring:
  application:
    name: eureka-serve
eureka:
  server:
    enable-self-preservation: false
  client:
    register-with-eureka: false
    service-url:
      defaultZone: http://localhost:8761/eureka/,http://localhost:8080/eureka/
```

只需要在defaultZone上新增一个地址我们新服务的地址http://localhost:8080/eureka/，即可由单机立马变成双机。

现在分别使用两个启动配置启动Eureka，可以看到如下图所示：

红框中的内容表示我们现在已经有两个eureka服务了。

上面讲了双机的配置方案，同理，多机的配置就是在defaultZone后面增加其他机器的服务地址。

[示例代码-Github](https://github.com/meteor1993/SpringCloudLearning/tree/master/chapter2/Eureka)

> 版权声明：「DDKK.COM 弟弟快看，程序员编程资料站」本站文章，版权归原作者所有
