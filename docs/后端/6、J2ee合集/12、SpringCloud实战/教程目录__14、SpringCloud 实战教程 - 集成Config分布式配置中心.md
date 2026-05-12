# 14、SpringCloud 实战教程 - 集成Config分布式配置中心
- 来源：https://ddkk.com/zhuanlan/j2ee/springcloud/2/14.html
- 分类：J2EE框架
- 分组：教程目录
## 为什么会有Spring Cloud Config分布式配置中心？

微服务意味着要将单体应用中的业务拆分成一个个子服务，每个服务的粒度相对较小，因此系统中会出现大量的服务，由于每个服务都需要必要的配置信息才能运行，所以一套集中式、动态的配置管理设施是必不可少的。我们每个服务都有自己的配置文件，如果有上百个微服务的话就有上百个配置文件，如果要改某一个配置的参数，有可能就需要修改好多个微服务的配置文件，那样岂不是又费时又费力，Spring Cloud提供了ConfigServer配置中心来解决这个问题，实现了一处修改，处处运行。

## 什么是Spring Cloud Config分布式配置中心？

Spring Cloud Config为微服务架构中的微服务提供了集中化的外部配置支持，配置服务器为各个不同的微服务应用的所有环境提供了中心的化额外部配置。如下图：

Spring Cloud Config分为服务端和客户端两部分，服务端也成为分布式配置中心，他是一个独立的微服务应用，用来连接配置服务器并未客户端提供获取配置信息，加密、解密信息等访问接口。

客户端则是通过指定的配置中心来管理应用资源，以及与业务相关的配置内容，并在启动的时候从配置中心获取和加载配置信息配置服务器默认采用git来存储配置信息，这样就有助于对环境配置进行版本管理，并且可以通过git客户端工具来方便的管理和访问配置内容。

**Spring Cloud Config都有什么作用？**

**1、** 集中管理配置文件，便于管理；

**2、** 不同的环境不同的配置，动态化的配置更新，分环境比如：dev/test/prod/bata/release；

**3、** 运行期间动态调整配置，不再需要在每个服务部署的机器上编写配置文件，服务会向配置中心统计拉去配置自己的信息；

**4、** 当配置发生改变时，服务不需要重启即可感知到配置的变化并应用新的配置；

**5、** 将配置信息以Rest接口暴露，post/curi访问刷新即可；

**Spring Cloud Config入门示例**

**1、** SpringCloudConfig，默认使用并GitHub作为配置文件存储除了git外，还可以用数据库、svn、本地文件等作为存储而且使用的是http/https访问的形式用我们自己的账号（如果没有去github.com去注册一个账号）在GitHub上新建一个名为springcloud-config的Repostitory；

**2、** 在github上新建一个仓库，如下图：；

**3、** 复制刚刚新建仓库的git地址；

**4、** 在本地新建git仓库；

**5、** 打开git的命令行操作（桌面右键选择GitBaseHere），进入我们刚刚新建的git仓库的地址然后执行gitclone[GitHub-wang-so/springcloud-config][GitHub-wang-so_springcloud-config]命令；

**6、** 新建开发、生产、测试配置文件，并提交到github上，我这里只新建一个测试文件config-dev.yml进行提交，如下图：；

提交成功后我们可以看到github上已经有这个文件了,如下图

**7、** 新建我们的配置中心模块cloud-config-center，端口为3344，跟之前新建的方式一样，新建module（不会的看本系列第一篇文章），下图为当前的项目结构；

如果我们新建成功，在总POM.XML文件中modules标签中自动为我们新增了了cloud-config-center。

**8、** 接下我们就先配置，首先我们先配置POM.XML文件；

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
    <artifactId>cloud-config-center</artifactId>
    <dependencies>
        <dependency>
            <groupId>org.springframework.cloud</groupId>
            <artifactId>spring-cloud-config-server</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.cloud</groupId>
            <artifactId>spring-cloud-starter-netflix-eureka-client</artifactId>
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
    </dependencies>
</project>
```

**9、** 在resources文件下新建application.yml配置文件，配置如下；

```java
server:
  port: 3344
  ​
spring:
  application:
     name: cloud-config-center注册进Eureka服务器的服务名称
  cloud:
     config:
       server:
         git:
           skipSslValidation: true 跳过ssl认证
           uri: https://github.com/wang-so/springcloud-config.git GitHub上复制的项目地址
           search-paths: 搜索目录
             - springcloud-config
       label: master  读取分支
#服务注册到​eureka地址
eureka:
  client:
     service-url:
       defaultZone: http://eureka7001.com:7001/eureka
```

**10、** 新建启动类；

```java
package com.buba.springcloud;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.config.server.EnableConfigServer;
@SpringBootApplication
@EnableConfigServer
public class ConfigServerApplication {
    public static void main(String[] args) {
        SpringApplication.run(ConfigServerApplication.class,args);
    }
}
```

细心的朋友们应该可以发现，如果我们在Springboot项目中新建多个module子项目后就会出现我们新建的application.yml文件没有变成一个小绿叶，出现这个情况，其实是不影响我们使用的，但是作为一个强迫症，必须让它一致。解决方法如下：

因为我已经添加过了，所以在点击Add出现的列表中没有Spring的选项，平时我们选择Spring。

继续选择，并找到yml文件添加即可。

还有可能出现的坑就是的新建的module子项目和其他的子项目颜色不一样，颜色会稍微有点灰色，造成这个的原因可能是idea忽略了maven模块，可以尝试如下解决方法：菜单file中选择setting，搜索maven，然后选择Ignored Filess,看右边的面板中变灰的maven模块是否处于勾选状态。勾选表示忽略了这个模块的pom文件。取消勾选即可解决。[传送门](https://blog.csdn.net/weixin_44188501/article/details/104717177)

**11、** 修改hosts文件，增加映射，使本机模拟网址服务配置中心网址，host文件地址C:\Windows\System32\drivers\etc，hosts文件开启了三个配置，分别是Eureka服务注册中心集群和现在配置的服务配置中心：；

**12、** 配置中心的server端就已经搭建好了，我们先启动eureka，然后再启动cloud-config-center，先访问[http://eureka7001.com:7001/](http://eureka7001.com:7001/)，可以看到配置中心已经注册进行[/eureka](http://eureka7001.com:7001/)当中，如下图：；

再访问http://config-3344.com:3344/master/config-dev.yml ，我们可以看到3344微服务可以成功的读取到远端的配置文件。如下图：

这里由于git版本升级以后，我们的主分支由master改为了main，所以我们访问要用main，如果使用maste是访问不到的，yml配置文件中读取分支配置 label使用master和main都可以。

**13、** 到现在我们配置中心服务端从远端Git仓库读取配置文件这一部分已经搭建完成了，接下来就搭建上边的client的客户端；

**14、** 新建我们的配置中心模块cloud-config-client，端口为3355，跟之前新建的方式一样，新建module（不会的看本系列第一篇文章），配置pom.xml文件，主要是新增spring-cloud-starter-config的jar包，如下图：；

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
    <artifactId>cloud-config-client</artifactId>
    <dependencies>
    <!--spring-cloud客户端-->
    <dependency>
        <groupId>org.springframework.cloud</groupId>
        <artifactId>spring-cloud-starter-config</artifactId>
    </dependency>
    <dependency>
        <groupId>org.springframework.cloud</groupId>
        <artifactId>spring-cloud-starter-netflix-eureka-client</artifactId>
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
    </dependencies>
</project>
```

**15、** 然后我们新建配置文件**bootstrap.yml，这里为什么不用**application.yml****呢？？？；

**application.yml**是用户级的资源配置项，而**bootstrap.yml**是系统级的资源配置项，**bootstrap.yml的优先级更高**，SpringCloud会创建一个"Bootstrap Context"，作为Spring应用的“Application Context"的**父上下文**。

初始化的时候，“Bootstrap Context"负责从外部源加载配置属性并解析配置，这两个上下文共享一个从外部获取的"Environment”。”Bootstrap“属性有高优先级，默认情况系，它们不会被本地配置覆盖。

"Bootstrap Context"和"Application Context"这两个上下文有不同的约定，所以新增一个**bootstrap.yml**文件，保证这两个上下文的配置分离。bootstrap.yml配置文件如下：

```java
server:
  port: 3355
spring:
  application:
    name: config-client
  cloud:
   Config客户端配置
    config:
      label: master分支名称
      name: config配置文件名称
      profile: dev读取后缀名称   上述3个综合：master分支上config-dev.yml的配置文件被读取http://config-3344.com:3344/master/config-dev.yml
      uri: http://localhost:3344配置中心地址
#服务注册到eureka地址
eureka:
  client:
    service-url:
      defaultZone: http://eureka7001.com:7001/eureka
```

**16、** 新建启动类和服务类，如下图：；

```java
package com.buba.springcloud;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.netflix.eureka.EnableEurekaClient;
@EnableEurekaClient
@SpringBootApplication
public class ConfigClientApplication {
    public static void main(String[] args) {
        SpringApplication.run(ConfigClientApplication.class,args);
    }
}
```

```java
package com.buba.springcloud.controller;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
@RestController
public class ConfigClientController {
    @Value("${config.info}")
    private String configInfo;
    @GetMapping("/config")
    public String getConfigInfo() {
        return configInfo;
    }
}
```

**17、** 配置中心的搭建就完成了，接下来我们就测试客户端是否能够通过访问配置中心获取配置信息，先启动Eureka服务注册中心、Config服务配置中心后，再启动服务配置中心客户端3355访问localhost:3355/config；

我们可以获取通过服务端获取到远端的配置文件。如下图：

**18、** 但是现在就有这样的问题，当我们在GitHub上修改配置文件内容，刷新配置中心服务端Server，发现S服务端erver配置中心立刻响应并刷新了配置信息，但是，我们刷新客户端Client，发现没有任何响应，配置信息仍然是原来的配置信息总不能每次远端修改了配置文件后，客户端都需要重启来进行对配置信息的重新加载对吧，针对这个问题，我们需要使用动态刷新只需要在客户端Client，加上actuator监控，我们需要在客户端Client的pom文件中加入这个依赖，如下图：；

```java
<dependency>
	<groupId>org.springframework.boot</groupId>
	<artifactId>spring-boot-starter-actuator</artifactId>
</dependency>
```

**19、** 修改**bootstrap.yml**配置文件**，**加入如下配置暴露监控断点：；

```java
# 暴露监控端点
management:
  endpoints:
    web:
      exposure:
        include: "*"
```

**20、** 在业务类ConfigClientController上添加**`@RefreshScope`**注解使客户端服务具有刷新功能，如下图：；

```java
@RestController
@RefreshScope
public class ConfigClientController {
    @Value("${config.info}")
    private String configInfo;
    @GetMapping("/config")
    public String getConfigInfo() {
        return configInfo;
    }
}
```

**21、** 发送POST请求刷新客户端Client该刷新请求必须发送后，客户端才能获得刷新后的信息，刷新客户端的请求必须是POST请求如下图：；

```java
curl -X POST "http://127.0.0.1:3355/actuator/refresh"
```

当出现以下信息时说明激活刷新客户端Client成功，再次访问，就可以得到刷新后的配置信息。

我们Spring Cloud Config到这里就学习完毕了，so easy！

但是假设如果我们有多个微服务客户端呢？难道每个微服务都需要执行一次POST请求进行手动刷新吗？我们可以通过广播的方式进行一次通知，处处生效，这里就要下一节要学习的知识消息总线——Spring Cloud Bus。
