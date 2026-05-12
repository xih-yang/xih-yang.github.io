# 06、Spring Cloud Config Github配置中心
- 来源：https://ddkk.com/zhuanlan/j2ee/springcloud/1/6.html
- 分类：J2EE框架
- 分组：教程目录
Springboot: 2.1.6.RELEASE

SpringCloud: Greenwich.SR1

如无特殊说明，本系列教程全采用以上版本

随着分布式项目越来越大，勤劳的程序猿们会开始面临一个挑战，配置文件会越来越繁杂，虽然spring提供了一个鸡肋版的解决方案，spring.profiles.active，在大型的分布式项目体系中，聊胜于无吧，手动维护配置文件的痛苦，生产，UAT，测试，开发环境的隔离，额外的配置文件，如：logback.xml日志的配置文件，bootstrap.properties配置文件，当系统中有几十个服务，相应的会有上百个配置文件，简直就是史诗级的灾难大片，每次发布上线，都要手动去检查配置文件，相应的服务都需要重启，那么，有没有一种方案，可以自动更新配置，并且对版本做出相应的控制，恰好，springcloud为我们提供了这样一种工具，虽然很多方面都还不完善，配置能力比较弱，但是也给我们提供了一种思路。

市面上有很多配置中心，BAT每家都出过，360的QConf、淘宝的diamond、百度的disconf都是解决这类问题。国外也有很多开源的配置中心Apache Commons Configuration、owner、cfg4j等等。这些开源的软件以及解决方案都很优秀，也存在这样或者那样的缺陷。今天我们要了解的Spring Cloud Config，可以无缝的和spring体系相结合，够方便够简单颜值高。

## 1. Spring Cloud Config

在介绍Spring Cloud Config之前，我们可以先凭空想一下一个配置中心需要提供的核心功能有哪些：

- 提供客户端和服务端的支持
- 提供各个环境的配置
- 配置文件修改后可以快速生效
- 可以提供不同版本的管理
- 可以支持不同的语言（java、.Net、Delphi、node等）
- 支持一定数量的并发
- 高可用（防止意外宕机导致配置不可用）

Spring Cloud Config项目是一个解决分布式系统的配置管理方案。它包含了Client和Server两个部分，server提供配置文件的存储、以接口的形式将配置文件的内容提供出去，client通过接口获取数据、并依据此数据初始化自己的应用。Spring cloud使用git或svn存放配置文件，默认情况下使用git，我们先以git为例做一套示例。

首先在github上面创建了一个文件夹springcloud-config用来存放配置文件，为了模拟生产环境，我们创建以下三个配置文件：

```java
// 开发环境
springcloud-config-dev.properties
// 测试环境
springcloud-config-test.properties
// 生产环境
springcloud-config-pro.properties
```

每个配置文件中都写一个属性springcloud.hello,属性值分别是 hello dev/test/pro。下面我们开始配置server端

## 2. Server端

### 1. pom.xml

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
    <artifactId>config-server</artifactId>
    <version>0.0.1-SNAPSHOT</version>
    <name>config-server</name>
    <description>Demo project for Spring Boot</description>
    <properties>
        <java.version>1.8</java.version>
        <spring-cloud.version>Greenwich.SR1</spring-cloud.version>
    </properties>
    <dependencies>
        <dependency>
            <groupId>org.springframework.cloud</groupId>
            <artifactId>spring-cloud-config-server</artifactId>
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

### 2. 配置文件

```sh
server:
  port: 8080
spring:
  application:
    name: spring-cloud-config-server
  cloud:
    config:
      server:
        git:
          uri: https://github.com/meteor1993/SpringCloudLearning # git仓库的地址
          search-paths: chapter6/springcloud-config  # git仓库地址下的相对地址，可以配置多个，用,分割。
          username: #Git仓库用户名
          password: #Git仓库密码
```

Spring Cloud Config也提供本地存储配置的方式。我们只需要设置属性spring.profiles.active=native，Config Server会默认从应用的src/main/resource目录下检索配置文件。也可以通过spring.cloud.config.server.native.searchLocations=file:E:/properties/属性来指定配置文件的位置。虽然Spring Cloud Config提供了这样的功能，但是为了支持更好的管理内容和版本控制的功能，还是推荐使用git的方式。

### 3. 启动类 ConfigServerApplication

```java
package com.springcloud.configserver;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.config.server.EnableConfigServer;
@SpringBootApplication
@EnableConfigServer
public class ConfigServerApplication {
    public static void main(String[] args) {
        SpringApplication.run(ConfigServerApplication.class, args);
    }
}
```

增加@EnableConfigServer注解，激活对配置中心的支持

### 4. 测试

首先测试我们的server端能否从github上获取到我们需要的信息，直接访问：[http://localhost:8080/springcloud-config/pro](http://localhost:8080/springcloud-config/pro)， **注意：** springcloud-config是文件夹的前缀命名，可以看到如下结果：

```java
{
    "name":"springcloud-config",
    "profiles":[
        "pro"
    ],
    "label":null,
    "version":"4e3d1a93e869fb336254c480ed1e5b36d58124aa",
    "state":null,
    "propertySources":[
        {
            "name":"https://github.com/meteor1993/SpringCloudLearning/chapter6/springcloud-config/springcloud-config-pro.properties",
            "source":{
                "springcloud.hello":"hello pro"
            }
        }
    ]
}
```

上述的返回的信息包含了配置文件的位置、版本、配置文件的名称以及配置文件中的具体内容，说明server端已经成功获取了git仓库的配置信息。

如果直接查看配置文件中的配置信息可访问：[http://localhost:8080/springcloud-config-dev.properties](http://localhost:8080/springcloud-config-dev.properties)， 返回：springcloud.hello: hello dev

修改配置文件springcloud-config-dev.properties中配置信息为：springcloud.hello=hello dev update，再次在浏览器访问http://localhost:8080/springcloud-config-dev.properties，返回：springcloud.hello: hello dev update。说明server端会自动读取自动提交功能。

仓库中的配置文件会被转换成web接口，访问可以参照以下的规则：

- /{application}/{profile}[/{label}]
- /{application}-{profile}.yml
- /{label}/{application}-{profile}.yml
- /{application}-{profile}.properties
- /{label}/{application}-{profile}.properties

以springcloud-config-dev.properties为例，它的application是springcloud-config，profile是dev，label是分支的意思，如果只有一个主分支，可以不写，默认会访问master分支，client会根据填写的参数来选择读取对应的配置。

## 3. client端

主要展示如何在业务项目中去获取server端的配置信息。

### 1. pom.xml

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
    <artifactId>config-client</artifactId>
    <version>0.0.1-SNAPSHOT</version>
    <name>config-client</name>
    <description>Demo project for Spring Boot</description>
    <properties>
        <java.version>1.8</java.version>
        <spring-cloud.version>Greenwich.SR1</spring-cloud.version>
    </properties>
    <dependencies>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.cloud</groupId>
            <artifactId>spring-cloud-starter-config</artifactId>
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

### 2. 配置文件

这里配置文件分两个，application.yml和bootstrap.properties

application.yml如下：

```sh
server:
  port: 8081
spring:
  application:
    name: spring-cloud-config-client
```

bootstrap.properties如下：

```java
spring.cloud.config.name=springcloud-config
spring.cloud.config.profile=dev
spring.cloud.config.uri=http://localhost:8080/
spring.cloud.config.label=master
```

- spring.application.name：对应{application}部分
- spring.cloud.config.profile：对应{profile}部分
- spring.cloud.config.label：对应git的分支。如果配置中心使用的是本地存储，则该参数无用
- spring.cloud.config.uri：配置中心的具体地址
- spring.cloud.config.discovery.service-id：指定配置中心的service-id，便于扩展为高可用配置集群。

> 注意：上面这些与spring-cloud相关的属性必须配置在bootstrap.properties中，config部分内容才能被正确加载。因为config的相关配置会先于application.properties，而bootstrap.properties的加载也是先于application.yml。

### 3. 启动类

```java
package com.springcloud.configclient;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
@SpringBootApplication
public class ConfigClientApplication {
    public static void main(String[] args) {
        SpringApplication.run(ConfigClientApplication.class, args);
    }
}
```

启动类只需要@SpringBootApplication注解就可以，常规操作。

### 4. 访问类

```java
package com.springcloud.configclient.controller;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
/**
 * @Author: shiyao.wei
 * @Date: 2021/7/4 16:19
 * @Version: 1.0
 * @Desc:
 */
@RestController
public class HelloController {
    @Value("${springcloud.hello}")
    private String hello;
    @RequestMapping("/hello")
    public String from() {
        return this.hello;
    }
}
```

使用@Value注解来获取server端参数的值

### 5. 测试

启动client端，访问链接：[http://localhost:8081/hello](http://localhost:8081/hello)， 返回：hello dev update，说明已经正确的从server端获取到了参数。到此一个完整的服务端提供配置服务，客户端获取配置参数的例子就完成了。

可以再进行一个小实验，我们再次修改springcloud-config-dev.properties中的内容为：hello dev update1，提交至github后，再次访问http://localhost:8081/hello，可以发现，返回的内容还是hello dev update，这是为什么呢？因为springboot项目只有在启动的时候才会获取配置文件的值，修改github信息后，client端并没有在次去获取，所以导致这个问题。如何去解决这个问题呢？留到下一篇我们在介绍。

[示例代码-Github](https://github.com/meteor1993/SpringCloudLearning/tree/master/chapter6)

参考：[http://www.ityouknow.com/springcloud/2017/05/22/springcloud-config-git.html](http://www.ityouknow.com/springcloud/2017/05/22/springcloud-config-git.html)

> 版权声明：「DDKK.COM 弟弟快看，程序员编程资料站」本站文章，版权归原作者所有
