# SpringCloud 分布式链路踪系 ZipKin 链路追踪详解
- 来源：https://ddkk.com/zhuanlan/linktrack/zipkin/18.html
- 分类：链路追踪
- 分组：分布式链路踪 SpringCloud 之 Zipkin
微服务架构是一个分布式架构，它按业务划分服务单元，一个分布式系统往往有很多个服务单元。由于服务单元数量众多，业务的复杂性，如果出现了错误和异常，很难去定位。主要体现在，一个请求可能需要调用很多个服务，而内部服务的调用复杂性，决定了问题难以定位。所以微服务架构中，必须实现分布式链路追踪，去跟进一个请求到底有哪些服务参与，参与的顺序又是怎样的，从而达到每个请求的步骤清晰可见，出了问题，很快定位。

## 举几个例子：

**1、** 在微服务系统中，一个来自用户的请求，请求先达到前端A（如前端界面），然后通过远程调用，达到系统的中间件B、C（如负载均衡、网关等），最后达到后端服务D、E，后端经过一系列的业务逻辑计算最后将数据返回给用户对于这样一个请求，经历了这么多个服务，怎么样将它的请求过程的数据记录下来呢？这就需要用到服务链路追踪；

**2、** 分析微服务系统在大压力下的可用性和性能；

Zipkin可以结合压力测试工具一起使用，分析系统在大压力下的可用性和性能。

设想这么一种情况，如果你的微服务数量逐渐增大，服务间的依赖关系越来越复杂，怎么分析它们之间的调用关系及相互的影响？

spring boot对zipkin的自动配置可以使得所有RequestMapping匹配到的endpoints得到监控，以及强化了RestTemplate，对其加了一层拦截器，使得由它发起的http请求也同样被监控。

Google开源的 Dapper链路追踪组件，并在2010年发表了论文《Dapper, a Large-Scale Distributed Systems Tracing Infrastructure》，这篇文章是业内实现链路追踪的标杆和理论基础，具有非常大的参考价值。

目前，链路追踪组件有Google的Dapper，Twitter 的Zipkin，以及阿里的Eagleeye （鹰眼）等，它们都是非常优秀的链路追踪开源组件。

本文主要讲述如何在Spring Cloud Sleuth中集成Zipkin。在Spring Cloud Sleuth中集成Zipkin非常的简单，只需要引入相应的依赖和做相关的配置即可。

## 1. 简介

Spring Cloud Sleuth 主要功能就是在分布式系统中提供追踪解决方案，并且兼容支持了 zipkin，你只需要在pom文件中引入相应的依赖即可。

## 2. 服务追踪分析

微服务架构上通过业务来划分服务的，通过REST调用，对外暴露的一个接口，可能需要很多个服务协同才能完成这个接口功能，如果链路上任何一个服务出现问题或者网络超时，都会形成导致接口调用失败。随着业务的不断扩张，服务之间互相调用会越来越复杂。

随着服务的越来越多，对调用链的分析会越来越复杂。它们之间的调用关系也许如下：

## 3. 术语

Spring Cloud Sleuth采用的是Google的开源项目Dapper的专业术语。

- Span：基本工作单元，例如，在一个新建的span中发送一个RPC等同于发送一个回应请求给RPC，span通过一个64位ID唯一标识，trace以另一个64位ID表示，span还有其他数据信息，比如摘要、时间戳事件、关键值注释(tags)、span的ID、以及进度ID(通常是IP地址)

span在不断的启动和停止，同时记录了时间信息，当你创建了一个span，你必须在未来的某个时刻停止它。
- Trace：一系列spans组成的一个树状结构，例如，如果你正在跑一个分布式大数据工程，你可能需要创建一个trace。
- Annotation：用来及时记录一个事件的存在，一些核心annotations用来定义一个请求的开始和结束
- cs - Client Sent -客户端发起一个请求，这个annotion描述了这个span的开始
- sr - Server Received -服务端获得请求并准备开始处理它，如果将其sr减去cs时间戳便可得到网络延迟
- ss - Server Sent -注解表明请求处理的完成(当请求返回客户端)，如果ss减去sr时间戳便可得到服务端需要的处理请求时间
- cr - Client Received -表明span的结束，客户端成功接收到服务端的回复，如果cr减去cs时间戳便可得到客户端从服务端获取回复的所有所需时间

将Span和Trace在一个系统中使用Zipkin注解的过程图形化：

## 4. Sleuth与Zipkin关系

spring cloud提供了spring-cloud-sleuth-zipkin来方便集成zipkin实现（指的是Zipkin Client，而不是Zipkin服务器），该jar包可以通过spring-cloud-starter-zipkin依赖来引入。

## 5. Zipkin

## 5.1 Zipkin是什么

[Zipkin](https://zipkin.io/)分布式跟踪系统；它可以帮助收集时间数据，解决在microservice架构下的延迟问题；它管理这些数据的收集和查找；Zipkin的设计是基于谷歌的Google Dapper论文。

每个应用程序向Zipkin报告定时数据，Zipkin UI呈现了一个依赖图表来展示多少跟踪请求经过了每个应用程序；如果想解决延迟问题，可以过滤或者排序所有的跟踪请求，并且可以查看每个跟踪请求占总跟踪时间的百分比。

## 5.2 为什么使用Zipkin

随着业务越来越复杂，系统也随之进行各种拆分，特别是随着微服务架构和容器技术的兴起，看似简单的一个应用，后台可能有几十个甚至几百个服务在支撑；一个前端的请求可能需要多次的服务调用最后才能完成；当请求变慢或者不可用时，我们无法得知是哪个后台服务引起的，这时就需要解决如何快速定位服务故障点，Zipkin分布式跟踪系统就能很好的解决这样的问题。

## 5.3 Zipkin原理

针对服务化应用全链路追踪的问题，Google发表了Dapper论文，介绍了他们如何进行服务追踪分析。其**基本思路**是在服务调用的请求和响应中加入ID，标明上下游请求的关系。利用这些信息，可以可视化地分析服务调用链路和服务间的依赖关系。

对应Dpper的开源实现是Zipkin，支持多种语言包括JavaScript，Python，Java, Scala, Ruby, C#, Go等。其中Java由多种不同的库来支持

**Spring Cloud Sleuth是对Zipkin的一个封装**，对于Span、Trace等信息的生成、接入HTTP Request，以及向Zipkin Server发送采集信息等全部自动完成。Spring Cloud Sleuth的概念图见上图。

## 5.4 Zipkin架构

跟踪器(Tracer)位于你的应用程序中，并记录发生的操作的时间和元数据,提供了相应的类库，对用户的使用来说是透明的，收集的跟踪数据称为Span;将数据发送到Zipkin的仪器化应用程序中的组件称为Reporter,Reporter通过几种传输方式之一将追踪数据发送到Zipkin收集器(collector)，然后将跟踪数据进行存储(storage),由API查询存储以向UI提供数据。

架构图如下：

### 5.4.1 Trace

Zipkin使用Trace结构表示对一次请求的跟踪，一次请求可能由后台的若干服务负责处理，每个服务的处理是一个Span，Span之间有依赖关系，Trace就是树结构的Span集合；

### 5.4.2 Span

每个服务的处理跟踪是一个Span，可以理解为一个基本的工作单元，包含了一些描述信息：id，parentId，name，timestamp，duration，annotations等，例如：

```json
{
      "traceId": "bd7a977555f6b982",
      "name": "get-traces",
      "id": "ebf33e1a81dc6f71",
      "parentId": "bd7a977555f6b982",
      "timestamp": 1458702548478000,
      "duration": 354374,
      "annotations": [
        {
          "endpoint": {
            "serviceName": "zipkin-query",
            "ipv4": "192.168.1.2",
            "port": 9411
          },
          "timestamp": 1458702548786000,
          "value": "cs"
        }
      ],
      "binaryAnnotations": [
        {
          "key": "lc",
          "value": "JDBCSpanStore",
          "endpoint": {
            "serviceName": "zipkin-query",
            "ipv4": "192.168.1.2",
            "port": 9411
          }
        }
      ]
}
```

- traceId：标记一次请求的跟踪，相关的Spans都有相同的traceId；
- id：span id；
- name：span的名称，一般是接口方法的名称；
- parentId：可选的id，当前Span的父Span id，通过parentId来保证Span之间的依赖关系，如果没有parentId，表示当前Span为根Span；
- timestamp：Span创建时的时间戳，使用的单位是微秒（而不是毫秒），所有时间戳都有错误，包括主机之间的时钟偏差以及时间服务重新设置时钟的可能性，出于这个原因，Span应尽可能记录其duration；
- duration：持续时间使用的单位是微秒（而不是毫秒）；
- annotations：注释用于及时记录事件；有一组核心注释用于定义RPC请求的开始和结束；

> cs:Client Send，客户端发起请求；
>
> sr:Server Receive，服务器接受请求，开始处理；
>
> ss:Server Send，服务器完成处理，给客户端应答；
>
> cr:Client Receive，客户端接受应答从服务器；
>
> binaryAnnotations：二进制注释，旨在提供有关RPC的额外信息。

### 5.4.3 Transport

收集的Spans必须从被追踪的服务运输到Zipkin collector，有三个主要的传输方式：**HTTP, Kafka和Scribe**；

### 5.4.4 Components

有4个组件组成Zipkin：collector，storage，search，web UI

- collector：一旦跟踪数据到达Zipkin collector守护进程，它将被验证，存储和索引，以供Zipkin收集器查找；
- storage：Zipkin最初数据存储在Cassandra上，因为Cassandra是可扩展的，具有灵活的模式，并在Twitter中大量使用；但是这个组件可插入，除了Cassandra之外，还支持ElasticSearch和MySQL； 存储，zipkin默认的存储方式为in-memory，即不会进行持久化操作。如果想进行收集数据的持久化，可以存储数据在Cassandra，因为Cassandra是可扩展的，有一个灵活的模式，并且在Twitter中被大量使用，我们使这个组件可插入。除了Cassandra，我们原生支持ElasticSearch和MySQL。其他后端可能作为第三方扩展提供。
- search：一旦数据被存储和索引，我们需要一种方法来提取它。查询守护进程提供了一个简单的JSON API来查找和检索跟踪，主要给Web UI使用；
- web UI：创建了一个GUI，为查看痕迹提供了一个很好的界面；Web UI提供了一种基于服务，时间和注释查看跟踪的方法。

## 5.5 Zipkin下载和启动

有三种安装方法：

Zipkin的使用比较简单，官网有说明几种方式：

### 5.5.1 容器

`Docker Zipkin`项目能够建立`docker`镜像，提供脚本和`docker-compose.yml`来启动预构建的图像。最快的开始是直接运行最新镜像：

> docker run -d -p 9411:9411 openzipkin/zipkin

### 5.5.2 下载jar

如果你有java 8或更高版本，上手最快的方法是下载一个zipkinserver.xx.jar并运行，**[详情参看](https://blog.csdn.net/fsy9595887/article/details/84936214)**

### 5.5.3 下载源代码运行

**`Zipkin`**可以从源运行，如果你正在开发新的功能。要实现这一点，需要获取Zipkin的源代码并构建它。

> # get the latest source
>
> git clone https://github.com/openzipkin/zipkin
>
> cd zipkin
>
> # Build the server and also make its dependencies
>
> ./mvnw -DskipTests --also-make -pl zipkin-server clean install
>
> # Run the server
>
> java -jar ./zipkin-server/target/zipkin-server-*exec.jar

使用官网自己打包好的Jar运行，Docker方式或下载源代码自己打包Jar运行（因为zipkin使用了springboot，内置了服务器，所以可以直接使用jar运行）。zipkin推荐使用docker方式运行，我后面会专门写一遍关于docker的运行方式，而源码运行方式好处是有机会体验到最新的功能特性，但是可能也会带来一些比较诡异的坑，所以不做讲解，下面我直接是使用官网打包的jar运行过程：

官方提供了三种方式来启动，这里使用第二种方式来启动;

> wget -O zipkin.jar 'https://search.maven.org/remote_content?g=io.zipkin.java&a=zipkin-server&v=LATEST&c=exec'
>
> java -jar zipkin.jar

首先下载zipkin.jar，我下载的是zipkin-server-2.10.2-exec.jar，然后直接使用-jar命令运行，要求jdk8以上版本；

```bash
D:\workspace\zipkin>java -jar zipkin-server-2.10.2-exec.jar
                                    ********
                                  **        **
                                 *            *
                                **            **
                                **            **
                                 **          **
                                  **        **
                                    ********
                                      ****
                                      ****
        ****                          ****
     ******                           ****                                 ***
  ****************************************************************************
    *******                           ****                                 ***
        ****                          ****
                                       **
                                       **
             *****      **     *****     ** **       **     **   **
               **       **     **  *     ***         **     **** **
              **        **     *****     ****        **     **  ***
             ******     **     **        **  **      **     **   **
:: Powered by Spring Boot ::         (v2.0.3.RELEASE)
...
2018-07-20 14:59:08.635  INFO 17284 --- [           main] o.xnio                                   : XNIO version 3.3.8.Final
2018-07-20 14:59:08.650  INFO 17284 --- [           main] o.x.nio                                  : XNIO NIO Implementation Version 3.3.8.Final
2018-07-20 14:59:08.727  INFO 17284 --- [           main] o.s.b.w.e.u.UndertowServletWebServer     : Undertow started on port(s) 9411 (http) with context path ''
2018-07-20 14:59:08.729  INFO 17284 --- [           main] z.s.ZipkinServer                         : Started ZipkinServer in 4.513 seconds (JVM running for 5.756)
2018-07-20 14:59:36.546  INFO 17284 --- [  XNIO-1 task-1] i.u.servlet                              : Initializing Spring FrameworkServlet 'dispatcherServlet'
2018-07-20 14:59:36.547  INFO 17284 --- [  XNIO-1 task-1] o.s.w.s.DispatcherServlet                : FrameworkServlet 'dispatcherServlet': initialization started
2018-07-20 14:59:36.563  INFO 17284 --- [  XNIO-1 task-1] o.s.w.s.DispatcherServlet                : FrameworkServlet 'dispatcherServlet': initialization completed in 15ms
```

查看运行效果，通过上图，我们发现zipkin使用springboot，并且启动的端口为9411，然后我们通过浏览器访问，效果如下：

详细参考：[https://zipkin.io/pages/quick...](https://zipkin.io/pages/quickstart.html)

## 6. 入门示例

追踪服务包含下面几个服务：

**1、** 注册中心EurekaServer（可选的，只用于服务生产者和调用者注册）；

**2、** Zipkin服务器；

**3、** 服务的生产者及服务的调用者：

- 服务的生产者、调用者是相对的，两者之间可以互相调用，即可以同时作为生产者和调用者，两者都是Eureka Client；
- 两者都要注册到注册中心上，这样才可以相互可见，才能通过服务名来调用指定服务，才能使用Feign或RestTemplate+Ribbon来达到负载均衡
- 两者都要注册到Zipkin服务器上，这样Zipkin才能追踪服务的调用链路

## 6.1 构建工程

基本知识讲解完毕，下面我们来实战，本文的案例主要有三个工程组成:一个server-zipkin,它的主要作用使用ZipkinServer 的功能，收集调用数据，并展示；一个service-hi,对外暴露hi接口；一个service-miya,对外暴露miya接口；这两个service可以相互调用；并且只有调用了，server-zipkin才会收集数据的，这就是为什么叫服务追踪了。

### 6.1.1 Zipkin服务器

代码地址（码云）：[https://gitee.com/wudiyong/ZipkinServer.git](https://gitee.com/wudiyong/ZipkinServer.git)

**1、** 新建一个普通的SpringBoot项目，工程取名为server-zipkin，在其pom引入依赖：

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    <groupId>com.dxz.serverzipkin</groupId>
    <artifactId>serverzipkin</artifactId>
    <version>0.0.1-SNAPSHOT</version>
    <packaging>jar</packaging>
    <name>server-zipkin</name>
    <description>Demo project for Spring Boot</description>
    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>1.3.5.RELEASE</version>   <!--配合spring cloud版本 -->
        <relativePath /> <!-- lookup parent from repository -->
    </parent>
    <properties>
        <!--设置字符编码及java版本 -->
        <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
        <java.version>1.8</java.version>
    </properties>
    <dependencies>
        <!--增加zipkin的依赖 -->
        <dependency>
            <groupId>io.zipkin.java</groupId>
            <artifactId>zipkin-server</artifactId>
        </dependency>
        <dependency>
            <groupId>io.zipkin.java</groupId>
            <artifactId>zipkin-autoconfigure-ui</artifactId>
        </dependency>
        <!--用于测试的，本例可省略 -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-test</artifactId>
            <scope>test</scope>
        </dependency>
    </dependencies>
    <!--依赖管理，用于管理spring-cloud的依赖 -->
    <dependencyManagement>
        <dependencies>
            <dependency>
                <groupId>org.springframework.cloud</groupId>
                <artifactId>spring-cloud-starter-parent</artifactId>
                <version>Brixton.SR3</version>   <!--官网为Angel.SR4版本，但是我使用的时候总是报错 -->
                <type>pom</type>
                <scope>import</scope>
            </dependency>
        </dependencies>
    </dependencyManagement>
    <build>
        <plugins>
            <!--使用该插件打包 -->
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
            </plugin>
        </plugins>
    </build>
</project>
```

**2、** 在其程序入口类,加上注解@EnableZipkinServer，开启ZipkinServer的功能：

```java
package com.dxz.serverzipkin;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import zipkin.server.EnableZipkinServer;
@EnableZipkinServer
@SpringBootApplication
public class ServerZipkinApplication {
    public static void main(String[] args) {
        SpringApplication.run(ServerZipkinApplication.class, args);
    }
}
```

**3、** 在配置文件application.yml指定,配置Zipkin服务端口、名称等：

> server.port=9411
>
> spring.application.name=my-zipkin-server

启动后打开http://localhost:9411/可以看到如下图，什么内容都没有，因为还没有任何服务注册到Zipkin，一旦有服务注册到Zipkin便在Service Name下拉列表中可以看到服务名字，当有服务被调用，则可以在Span Name中看到被调用的接口名字.

这里为了测试方便，我们可以将数据保存到内存中，但是生产环境还是需要将数据持久化的，原生支持了很多产品，例如ES、数据库等。

### 6.1.2 服务生成者调用者

这两者配置是一样的此处简化，直接修改compute-server和feign-consumer两个服务，修改有两点：

**1、** pom增加；

```java
        <dependency>
            <groupId>org.springframework.cloud</groupId>
            <artifactId>spring-cloud-starter-zipkin</artifactId>
        </dependency>
```

**2、** 在其配置文件application.yml指定zipkinserver的地址，头通过配置“spring.zipkin.base-url”指定：

> spring.zipkin.base-url=http://localhost:9411

至此，可以开始测试Zipkin追踪服务了

### 6.1.3 启动工程，演示追踪

启动顺序：注册中心（可选）->配置中心（可选）->Zipkin服务器->服务生产者及调用者

我们可以尝试调用生产者或调用者的接口，然后刷新Zipkin服务器页面，可以看到如下结果：

依次启动上面的三个工程，打开浏览器访问：[http://localhost:9411/](http://localhost:9411/)，会出现以下界面：

再打开[http://localhost:9411/](http://localhost:9411/)的界面，点击Dependencies,可以发现服务的依赖关系：

点击find traces,可以看到具体服务相互调用的数据：

可以看到，调用消费者（ribbon-consumer）耗时83ms，其中消费者调用生产者占了5ms，占比6%。

在测试的过程中我们会发现，有时候，程序刚刚启动后，刷新几次，并不能看到任何数据，原因就是我们的spring-cloud-sleuth收集信息是有一定的比率的，默认的采样率是0.1，配置此值的方式在配置文件中增加spring.sleuth.sampler.percentage参数配置（如果不配置默认0.1），如果我们调大此值为1，可以看到信息收集就更及时。但是当这样调整后，我们会发现我们的rest接口调用速度比0.1的情况下慢了很多，即使在0.1的采样率下，我们多次刷新consumer的接口，会发现对同一个请求两次耗时信息相差非常大，如果取消spring-cloud-sleuth后我们再测试，会发现并没有这种情况，可以看到这种方式追踪服务调用链路会给我们业务程序性能带来一定的影响。

#sleuth采样率，默认为0.1，值越大收集越及时，但性能影响也越大

> spring.sleuth.sampler.percentage=1

**其实，我们仔细想想也可以总结出这种方式的几种缺陷：**

缺陷1：zipkin客户端向zipkin-server程序发送数据使用的是http的方式通信，每次发送的时候涉及到连接和发送过程。

缺陷2：当我们的zipkin-server程序关闭或者重启过程中，因为客户端收集信息的发送采用http的方式会被丢失。

**针对以上两个明显的缺陷，改进的办法是：**

**1、** 通信采用socket或者其他效率更高的通信方式；

**2、** 客户端数据的发送尽量减少业务线程的时间消耗，采用异步等方式发送收集信息；

**3、** 客户端与zipkin-server之间增加缓存类的中间件，例如redis、MQ等，在zipkin-server程序挂掉或重启过程中，客户端依旧可以正常的发送自己收集的信息；

相信采用以上三种方式会很大的提高我们的效率和可靠性。其实spring-cloud已经为我们提供采用MQ或redis等其他的采用socket方式通信，利用消息中间件或数据库缓存的实现方式。

spring-cloud-sleuth-zipkin-stream方式的实现请看下面内容！

## 6.2 将HTTP通信改成MQ异步方式通信

springcloud官方按照传输方式分成了三种启动服务端的方式：

**1、** SleuthwithZipkinviaHTTP，；

**2、** SleuthwithZipkinviaSpringCloudStream，；

**3、** SpringCloudSleuthStreamZipkinCollector；

只需要添加相应的依赖，之后配置相应的注解，如`@EnableZipkinStreamServer`即可。具体配置参考官方文档：

（[http://cloud.spring.io/spring-cloud-static/spring-cloud-sleuth/1.2.1.RELEASE/#_adding_to_the_project](http://cloud.spring.io/spring-cloud-static/spring-cloud-sleuth/1.2.1.RELEASE/#_adding_to_the_project)）

### 6.2.1 加入依赖

要将http方式改为通过MQ通信，我们要将依赖的原来依赖的io.zipkin.java:zipkin-server换成spring-cloud-sleuth-zipkin-stream和spring-cloud-starter-stream-rabbit

```xml
<dependency>
<groupId>org.springframework.cloud</groupId>
<artifactId>spring-cloud-sleuth-zipkin-stream</artifactId>
</dependency>
<dependency>
<groupId>org.springframework.cloud</groupId>
<artifactId>spring-cloud-starter-stream-rabbit</artifactId>
</dependency>
```

在启动类中开启Stream通信功能

```java
package com.zipkinServer.ZipkinServer;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.sleuth.zipkin.stream.EnableZipkinStreamServer;
import zipkin.server.EnableZipkinServer;
/*
* @EnableZipkinServer、@EnableZipkinStreamServer两者二选一
* 通过源码可看到，@EnableZipkinStreamServer包含了@EnableZipkinServer，同时
* 还创建了一个rabbit-mq的消息队列监听器，所以也支持原来的HTTP通信方式 
*/
//@EnableZipkinServer//默认采用HTTP通信方式启动ZipkinServer
@EnableZipkinStreamServer//采用Stream通信方式启动ZipkinServer，也支持HTTP通信方式
@SpringBootApplication
public class ZipkinServerApplication {
public static void main(String[] args) {
SpringApplication.run(ZipkinServerApplication.class, args);
}
}
```

配置消息中间件rabbit mq地址等信息

> #连接rabbitmq服务器配置
>
> spring.rabbitmq.host=localhost
>
> spring.rabbitmq.port=5672
>
> spring.rabbitmq.username=guest
>
> spring.rabbitmq.password=guest

至此，ZipkinServer配置完成

### 6.2.2 Zipkin客户端的配置

**1、** 将原来的spring-cloud-starter-zipkin替换为如下依赖即可；

```java
<dependency>
<groupId>org.springframework.cloud</groupId>
<artifactId>spring-cloud-sleuth-zipkin-stream</artifactId>
</dependency>
<dependency>
<groupId>org.springframework.cloud</groupId>
<artifactId>spring-cloud-starter-stream-rabbit</artifactId>
</dependency>
<dependency>
<groupId>org.springframework.cloud</groupId>
<artifactId>spring-cloud-starter-sleuth</artifactId>
</dependency>
```

**2、** 此外，在配置文件中也加上连接MQ的配置；

> #连接rabbitmq服务器配置
>
> spring.rabbitmq.host=localhost
>
> spring.rabbitmq.port=5672
>
> spring.rabbitmq.username=guest
>
> spring.rabbitmq.password=guest

至此全部配置完成，可以开始测试。

另外，由于要连接到rabbitmq服务器，所以，还要安装及启动rabbitmq服务器！

加了MQ之后，通信过程如下图所示：

可以看到如下效果：

**1、** 请求的耗时时间不会出现突然耗时特长的情况；

**2、** 当ZipkinServer不可用时（比如关闭、网络不通等），追踪信息不会丢失，因为这些信息会保存在Rabbitmq服务器上，直到Zipkin服务器可用时，再从Rabbitmq中取出这段时间的信息；

## 6.3 持久化到数据库

Zipkin目前只支持mysql数据库，ZipkinServer服务做如下修改，其它服务不需做任何修改

### 6.3.1 加入数据库依赖

```xml
<dependencies>
    <dependency>
        <groupId>mysql</groupId>
        <artifactId>mysql-connector-java</artifactId>
    </dependency>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-jdbc</artifactId>
    </dependency>
    <dependency> 
        <groupId>io.zipkin.java</groupId> 
        <artifactId>zipkin-storage-mysql</artifactId> 
        <version>1.27.0</version>
    </dependency> 
    <dependency>
        <groupId>io.zipkin.java</groupId>
        <artifactId>zipkin-server</artifactId>
        <version>1.27.0</version>
    </dependency>
    <dependency>
        <groupId>io.zipkin.java</groupId>
        <artifactId>zipkin-autoconfigure-ui</artifactId>
        <version>1.27.0</version>
    </dependency>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter</artifactId>
    </dependency>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-web</artifactId>
    </dependency>
    <dependency>
        <groupId>org.springframework.cloud</groupId>
        <artifactId>spring-cloud-starter-eureka</artifactId>
        <version>1.4.6.RELEASE</version>
    </dependency>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-test</artifactId>
        <scope>test</scope>
    </dependency>
</dependencies>
```

### 6.3.2 在application.properties中配置数据库属性

```plaintext
#zipkin数据保存到数据库中需要进行如下配置  
#表示当前程序不使用sleuth  
spring.sleuth.enabled=false  
#表示zipkin数据存储方式是mysql  
zipkin.storage.type=mysql
#数据库脚本创建地址，当有多个时可使用\[x\]表示集合第几个元素，脚本可到官网下载，需要先手动到数据库执行  
spring.datasource.schema\[0\]=classpath:/zipkin.sql
#spring boot数据源配置  
spring.datasource.url=jdbc:mysql://localhost:3306/zipkin?autoReconnect=true&useUnicode=true&characterEncoding=UTF-8&zeroDateTimeBehavior=convertToNull&useSSL=false  
spring.datasource.username=root  
spring.datasource.password=123456  
spring.datasource.driver-class-name=com.mysql.jdbc.Driver  
spring.datasource.initialize=true  
spring.datasource.continue-on-error=true
```

**zipkin.sql**

数据库脚本文件放到resources目录下，且需要先手动到数据库执行一次，内容如下：

```sql
CREATE TABLE IF NOT EXISTS zipkin_spans (
trace_id_high BIGINT NOT NULL DEFAULT 0 COMMENT 'If non zero, this means the trace uses 128 bit traceIds instead of 64 bit',
trace_id BIGINT NOT NULL,
id BIGINT NOT NULL,
name VARCHAR(255) NOT NULL,
parent_id BIGINT,
debug BIT(1),
start_ts BIGINT COMMENT 'Span.timestamp(): epoch micros used for endTs query and to implement TTL',
duration BIGINT COMMENT 'Span.duration(): micros used for minDuration and maxDuration query'
) ENGINE=InnoDB ROW_FORMAT=COMPRESSED CHARACTER SET=utf8 COLLATE utf8_general_ci;
ALTER TABLE zipkin_spans ADD UNIQUE KEY(trace_id_high, trace_id, id) COMMENT 'ignore insert on duplicate';
ALTER TABLE zipkin_spans ADD INDEX(trace_id_high, trace_id, id) COMMENT 'for joining with zipkin_annotations';
ALTER TABLE zipkin_spans ADD INDEX(trace_id_high, trace_id) COMMENT 'for getTracesByIds';
ALTER TABLE zipkin_spans ADD INDEX(name) COMMENT 'for getTraces and getSpanNames';
ALTER TABLE zipkin_spans ADD INDEX(start_ts) COMMENT 'for getTraces ordering and range';
CREATE TABLE IF NOT EXISTS zipkin_annotations (
trace_id_high BIGINT NOT NULL DEFAULT 0 COMMENT 'If non zero, this means the trace uses 128 bit traceIds instead of 64 bit',
trace_id BIGINT NOT NULL COMMENT 'coincides with zipkin_spans.trace_id',
span_id BIGINT NOT NULL COMMENT 'coincides with zipkin_spans.id',
a_key VARCHAR(255) NOT NULL COMMENT 'BinaryAnnotation.key or Annotation.value if type == -1',
a_value BLOB COMMENT 'BinaryAnnotation.value(), which must be smaller than 64KB',
a_type INT NOT NULL COMMENT 'BinaryAnnotation.type() or -1 if Annotation',
a_timestamp BIGINT COMMENT 'Used to implement TTL; Annotation.timestamp or zipkin_spans.timestamp',
endpoint_ipv4 INT COMMENT 'Null when Binary/Annotation.endpoint is null',
endpoint_ipv6 BINARY(16) COMMENT 'Null when Binary/Annotation.endpoint is null, or no IPv6 address',
endpoint_port SMALLINT COMMENT 'Null when Binary/Annotation.endpoint is null',
endpoint_service_name VARCHAR(255) COMMENT 'Null when Binary/Annotation.endpoint is null'
) ENGINE=InnoDB ROW_FORMAT=COMPRESSED CHARACTER SET=utf8 COLLATE utf8_general_ci;
ALTER TABLE zipkin_annotations ADD UNIQUE KEY(trace_id_high, trace_id, span_id, a_key, a_timestamp) COMMENT 'Ignore insert on duplicate';
ALTER TABLE zipkin_annotations ADD INDEX(trace_id_high, trace_id, span_id) COMMENT 'for joining with zipkin_spans';
ALTER TABLE zipkin_annotations ADD INDEX(trace_id_high, trace_id) COMMENT 'for getTraces/ByIds';
ALTER TABLE zipkin_annotations ADD INDEX(endpoint_service_name) COMMENT 'for getTraces and getServiceNames';
ALTER TABLE zipkin_annotations ADD INDEX(a_type) COMMENT 'for getTraces';
ALTER TABLE zipkin_annotations ADD INDEX(a_key) COMMENT 'for getTraces';
ALTER TABLE zipkin_annotations ADD INDEX(trace_id, span_id, a_key) COMMENT 'for dependencies job';
CREATE TABLE IF NOT EXISTS zipkin_dependencies (
day DATE NOT NULL,
parent VARCHAR(255) NOT NULL,
child VARCHAR(255) NOT NULL,
call_count BIGINT
) ENGINE=InnoDB ROW_FORMAT=COMPRESSED CHARACTER SET=utf8 COLLATE utf8_general_ci;
ALTER TABLE zipkin_dependencies ADD UNIQUE KEY(day, parent, child);
```

**4、** 在zipkinserver的启动类中注入@Bean如下：

```java
import javax.sql.DataSource;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.netflix.eureka.EnableEurekaClient;
import org.springframework.context.annotation.Bean;
import zipkin.server.EnableZipkinServer;
import zipkin.storage.mysql.MySQLStorage;
@EnableEurekaClient
@EnableZipkinServer
@SpringBootApplication
public class ZipkinServerApplication {
	public static void main(String[] args) {
		SpringApplication.run(ZipkinServerApplication.class, args);
	}
	@Bean 
	public MySQLStorage mySQLStorage (DataSource datasource) { 
	return MySQLStorage.builder()
			.datasource(datasource)
			.executor(Runnable :: run)
			.build(); 
	}
}
```

至此，ZipkinServer采用数据库存储配置完成。

（**注意：**各案例工程是在低版本springboot中进行，zipkin客户端（网关工程以及service工程）中用到的引入的pom依赖也尽量用相应的低版本，否则会出现版本不兼容问题）。

## 6.4 elasticsearch存储

前面讲了利用mq的方式发送数据，存储在mysql，实际生产过程中调用数据量非常的大，mysql存储并不是很好的选择，这时我们可以采用elasticsearch进行存储

配置过程也很简单

**1、** mysql依赖改成elasticsearch依赖；

```xml
<!-- 添加 spring-data-elasticsearch的依赖 -->
<dependency>
    <groupId>io.zipkin.java</groupId>
    <artifactId>zipkin-autoconfigure-storage-elasticsearch-http</artifactId>
    <version>1.24.0</version>
    <optional>true</optional>
</dependency>
```

**2、** 数据库配置改成elasticsearch配置；

```bash
#表示当前程序不使用sleuth  
spring.sleuth.enabled=false  
#表示zipkin数据存储方式是elasticsearch  
zipkin.storage.StorageComponent = elasticsearch  
zipkin.storage.type=elasticsearch  
zipkin.storage.elasticsearch.cluster=elasticsearch-zipkin-cluster  
zipkin.storage.elasticsearch.hosts=127.0.0.1:9300  
# zipkin.storage.elasticsearch.pipeline=  
zipkin.storage.elasticsearch.max-requests=64  
zipkin.storage.elasticsearch.index=zipkin  
zipkin.storage.elasticsearch.index-shards=5  
zipkin.storage.elasticsearch.index-replicas=1
```

**3、** 安装elasticsearch；

其它代码完全不变

具体见：

[http://www.cnblogs.com/shunyang/p/7011306.html](http://www.cnblogs.com/shunyang/p/7011306.html)

[http://www.cnblogs.com/shunyang/p/7298005.html](http://www.cnblogs.com/shunyang/p/7298005.html)

https://segmentfault.com/a/1190000012342007

https://blog.csdn.net/meiliangdeng1990/article/details/54131384
