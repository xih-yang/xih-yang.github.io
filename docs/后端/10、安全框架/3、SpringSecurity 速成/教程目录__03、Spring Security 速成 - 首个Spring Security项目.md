# 03、Spring Security 速成 - 首个Spring Security项目
- 来源：https://ddkk.com/zhuanlan/security/springsecurity/6/3.html
- 分类：安全框架
- 分组：教程目录
## 一、前言

我们本次demo均是在Spring boot环境下搭建Spring Security的项目，因为Spring boot让我们不需要编写所有的配置，它自己提供了一些预配置项，因此我们可以只重写与实现不匹配的配置。我们也称这种方法为约定大于配置原则！

**那么本节我们需要了解的有如下内容：**

1、创建一个仅具有Spring Security和Web依赖项的项目，看看如果不添加任何配置的话，该项目会如何运行。通过这种方式，我们将了解从默认的身份验证和授权配置中可以预期得到什么。

2、更改项目以添加用于用户管理的功能，我们通过重写默认值来定义自定义用户和密码而实现的。

3、在研究了应用程序默认情况下对所有端点都进行身份验证之后，需要了解这一点也可以定制。

4、将同一配置做不同样式的应用，以便理解最佳实践

## 二、首个项目的构建

我们将构建一个小型Web应用程序，然后让其公开一个REST端点，我们将看到Spring Security如何使用HTTP基本身份验证在不做太多处理的情况下保护这个端点。

那么首先我学习demo比较喜欢先建一个父项目方便扩展，大家也可以直接建一个Spring boot的demo,那么我将按照父项目的结构去构造这个web应用程序：

首先构造一个spring_security_parent的父项目，将src包删除，其maven结构如下：

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    <groupId>com.mbw</groupId>
    <artifactId>spring_security_parent</artifactId>
    <version>1.0-SNAPSHOT</version>
    <packaging>pom</packaging>
    <properties>
        <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
        <maven.compiler.source>1.8</maven.compiler.source>
        <maven.compiler.target>1.8</maven.compiler.target>
        <lombok.version>1.18.20</lombok.version>
        <hutool.version>5.5.8</hutool.version>
    </properties>
    <dependencyManagement>
        <dependencies>
            <dependency>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-dependencies</artifactId>
                <version>2.3.0.RELEASE</version>
                <type>pom</type>
                <scope>import</scope>
            </dependency>
        </dependencies>
    </dependencyManagement>
    <dependencies>
        <dependency>
            <groupId>org.projectlombok</groupId>
            <artifactId>lombok</artifactId>
            <version>${lombok.version}</version>
        </dependency>
        <dependency>
            <groupId>cn.hutool</groupId>
            <artifactId>hutool-all</artifactId>
            <version>${hutool.version}</version>
        </dependency>
    </dependencies>
</project>
```

然后在父项目下构建一个子项目也就是我们的第一个学习demo：spring_security_simple_web01，其maven结构如下：

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <parent>
        <artifactId>spring_security_parent</artifactId>
        <groupId>com.mbw</groupId>
        <version>1.0-SNAPSHOT</version>
    </parent>
    <modelVersion>4.0.0</modelVersion>
    <artifactId>spring_security_simple_web01</artifactId>
    <properties>
        <maven.compiler.source>8</maven.compiler.source>
        <maven.compiler.target>8</maven.compiler.target>
    </properties>
    <dependencies>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-security</artifactId>
        </dependency>
    </dependencies>
</project>
```

然后我们创建一个conreoller包，往其中添加一个类命名为HelloController,我们在这个类定义一个REST控制器和一个REST端点：

```java
package com.mbw.controller;
import cn.hutool.core.codec.Base64;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
@RestController
public class HelloController {
    @GetMapping("/hello")
    public String hello(){
        return "hello!";
    }
    public static void main(String[] args) {
        String basicAuthorization = "user:460f133f-768a-4b36-b5e9-6b8487cd79d2";
        System.out.println(Base64.encode(basicAuthorization));
    }
}
```

为了防止端口号占用问题，我们在yaml文件中配置一下port

```java
server:
  port: 9090
```

然后启动我们的程序，我们可以注意与以往普通Spring boot的启动控制台信息不同的是，多出了类似下面的信息：

> Using generated security password: ec6048cc-cf23-4a8d-a13a-87ad3dad573b

我们发现，每次运行该应用程序时，他都会给我们生成一个新密码，并在控制台中打印此密码，如前面的代码片段所示。**必须使用此密码调用该应用程序的任何一个具有HTTP Basic身份验证的端点**。首先，让我们尝试在不使用Authorization头信息的情况下调用端点。

你可以使用postman或者cURL,我这边会综合使用，不过主要以postman为主进行展示：

> http://localhost:9090/hello

该调用的响应如下：

```java
{
    "timestamp": "2022-09-21T02:02:47.908+00:00",
    "status": 401,
    "error": "Unauthorized",
    "message": "",
    "path": "/hello"
}
```

该响应状态为HTTP 401 Unauthorized.这是由于没有使用正确的凭据进行身份验证。默认情况下，**Spring Security期望的是默认用户名(user)和所提供的密码（也就是之前控制台的密码）** 。这时候让我们再次尝试：

postman的可以使用接口地址下面的Authorization中的Basic Auth：

然后属于Spring Security默认期望的凭据：

现在再次调用该接口：

ps:HTTP 401 Unauthorized这个状态代码是有点模棱两可的，通常，**它用于表示失败的身份验证，而不是授权**。开发人员在设计应用程序时使用它处理丢失或错误凭据等情况。对于失败的授权，我们可能使用403 Forbidden状态。通常，**HTTP 403意味着服务器识别了请求的调用者，但他们并不具有试图进行的调用所需的权限**，

一旦发送了正确的凭据，就可以在响应体中准确地看到我们早先定义地HelloController方法所返回地内容。

那么postman中basic Auth中地原理是什么样呢，如果我们在form data中输入User和Password怎么就没有用呢？

那么在后台，**postman会以Base64编写字符串:,并将其作为带Basic字符串前缀地Authorization头信息地值来发送**。虽说Basic Auth的方式很简便，但是对于了解真实的请求到底失什么也对我们很重要，因此我们来尝试手动创建Authorization头信息：

考虑到postman缓存，在每次测试安全验证最好重启下应用程序，使用新的password测试验证。

那么回到正题，首先需要使用:字符串并使用Base64编码它，java代码如下，使用Hutool自带的Base64工具类即可：

```java
public static void main(String[] args) {
        String basicAuthorization = "user:3f405ded-2d0d-4748-9f60-4b436929e46e";
        System.out.println(Base64.encode(basicAuthorization));
    }
```

运行和会返回这个Base64编码的字符串：

> dXNlcjozZjQwNWRlZC0yZDBkLTQ3NDgtOWY2MC00YjQzNjkyOWU0NmU=

现在可以使用该Base64编码的值作为调用的Authorization头信息的值，会得到之前使用postman的Basic Auth一样的结果

首先我们将postman中的Authorization改为no Auth,然后在请求头输入Authorization头信息:

注意Basic后面的空格！

## 三、了解Spring Security的默认配置

我们一开始就知道，Springboot帮我们预配置了组件，但是实际开发我们必须重写这些预配置的组件来满足应用程序的需求，所以我们暂时先高度概括地讨论每个组件。

从之前的demo我们了解到一些逻辑：有一个默认用户，每次启动程序时我们都会得到一个随机密码，可以使用这个默认的用户和密码来调用端点，而这些都是Spring boot给我们设置的预配置项。我们可以通过下图先了解下Spring Security架构中主要参与者的总体概况以及它们之间的关系。

上图主要就是参与Spring Security身份验证过程中的主要组件以及它们之间的关系，**这个架构代表了使用SpringSecurity实现身份验证的骨架主干**，在讨论身份验证和授权的不同实现时，该架构将会被经常提起。

在上图中，可以看出：

- **身份验证过滤器将身份验证请求委托给身份验证管理器，并根据响应配置安全上下文**
- **身份验证管理器使用身份验证提供程序处理身份验证**
- **身份验证提供程序实现了身份验证逻辑**
- **用户详情服务实现了用户管理职能，身份验证提供程序将在身份验证逻辑中使用它**
- **密码编码器实现了密码管理，身份验证提供程序将在身份验证逻辑中使用它**
- **安全上下文在身份验证过程结束后保留身份验证数据**

那么这个用户详情服务对应的Bean就是UserDetailsService,密码编码器对应的Bean为PasswordEncoder

身份验证提供程序会使用这两个bean查找用户并检查他们的密码。

使用Spring Security实现UserDetailsService契约的对象会管理用户的详细信息，到目前为止，我们使用的都是Spring Boot默认的实现，这个shi’xian即具有默认密码的"user",这个密码是在加载Spring上下文时随机生成的，是一个UUID，此时，应用程序会将密码写入控制台，我们可以看到它。

这个默认的实现只是作为概念的证明，并允许我们查看依赖项是否到位，。**该实现将凭据存储在内存中，意味着应用程序目前并不能持久化凭据**，所以我们在生产环境应尽量避免这样使用！

然后看看PasswordEncoder.它主要承担着两个任务：

- **将密码进行编码**
- **验证密码是否与现有编码相匹配**。

尽管不像UserDetailsService对象那样明显，但PasswordEncoder对于基本的身份验证流程也是必需的。最简单的实现方式就是以纯文本方式管理密码，即不对这些密码进行编码，后面我们会详细对这个对象进行探讨，目前我们只了解PasswordEncoder和默认的UserDetailsService是同时存在的。在替换UserDetailsServices的默认实现时，还必须指定一个PasswordEncoder.
