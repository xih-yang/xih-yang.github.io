# 01、Spring Boot 3.x 快速入门
- 来源：https://ddkk.com/zhuanlan/j2ee/springboot/9/1.html
- 分类：Spring Boot 3.x 实战
- 分组：教程目录
Spring Boot帮助你创建独立的、生产级的基于Spring的应用程序。大多数Spring Boot应用程序只需要很少的Spring配置。

主要目标有：

**1、** 为所有Spring开发者提供一种快速的入门体验；

**2、** 做到开箱即用；

**3、** 提供大量非功能性特性相关项目（例如：内嵌服务器、安全、指标、健康检查、外部配置)；

**4、** 无代码生成、无需编写XML；

### 系统环境要求

Spring Boot 3.0.0 需要 [Java 17](https://www.java.com/). 还需要[Spring Framework 6.0.0-M2](https://docs.spring.io/spring-framework/docs/6.0.0-M2/reference/html/) 及以上版本。

开发工具IntelliJ IDEA 2021.2.1以及更高版本。

**支持以下构建根据的版本**：

构建工具
版本

Maven
3.5+

Gradle
7.x (7.4 or later)

**Spring Boot支持以下嵌入式servlet容器:**

容器名称
Servlet版本

Tomcat 10.0
5.0

Jetty 11.0
5.1

Undertow 2.2 (Jakarta EE 9 variant)
5.1

Spring Boot应用程序部署到任何兼容servlet 5.0+的容器中。

### 安装

Spring Boot 3可以与经典的Java开发工具一起使用，也可以作为命令行工具安装。无论那种方式都需要Java 17及以上版本。

Java17 mac安装：

**1、** 下载地址https://download.oracle.com/java/17/latest/jdk-17_macos-x64_bin.dmg；

**2、** 下载完成后点击安装，命令行查看是否安装成功；

```java
➜ ~ java -version
java version "17.0.2" 2022-01-18 LTS
Java(TM) SE Runtime Environment (build 17.0.2+8-LTS-86)
Java HotSpot(TM) 64-Bit Server VM (build 17.0.2+8-LTS-86, mixed mode, sharing)
```

你可以像使用标准的Java库相同的方式使用Spring Boot。只需要在classpath中包含适当的spring-boot-*.jar文件。Spring Boot不需要任何特殊的工具集成，所以你可以使用任何IDE或文本编辑器。另外，Spring Boot应用程序没有什么特别之处，因此你可以像运行任何其他Java程序一样运行和调试Spring Boot应用程序。虽然可以复制Spring Boot jar，但通常建议使用支持依赖管理的构建工具(如Maven或Gradle)。

#### maven

Spring Boot3与Apache Maven 3.5或更高版本兼容。如果还没有安装Maven，可以按照maven.apache.org上的说明进行操作。

> 大多数操作系统,Maven可以使用包管理器安装,如果你用的OSX Homebrew,可以使用brew install maven。Ubuntu用户可以使用sudo apt-get install maven。使用Chocolatey的Windows用户使用choco install maven。

Spring Boot依赖使用`org.springframework.boot groupId`。通常，你的Maven POM文件继承自`spring-boot-starter-parent`项目，并声明对一个或多个“Starter”的依赖。 Spring Boot还提供了一个可选的Spring Boot Maven Plugin来创建可执行的jar文件。

### 开发第一个Spring Boot程序

此章节快速搭建一个Spring Boot 3应用程序,使用的开发工具IDEA+Maven。

Spring Boot官方提供了非常便捷的工具[Spring Initializr](https://start.spring.io/)帮助开发者快速的搭建Spring Boot应用程序,IDEA也集成了此工具。

**1.创建项目或者模块，选择Spring Initializr，Java版本为17**

**2.选择Spring Boot版本3.0.0,以及Spring Web依赖**

**3.目录结构**

**4. pom.xml文件解析**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    <!--引入Spring Boot3.0 父项目-->
    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>3.0.0-M2</version>
        <relativePath/> <!-- lookup parent from repository -->
    </parent>
    <groupId>me.renpeng</groupId>
    <artifactId>first-springboot3-maven</artifactId>
    <version>0.0.1-SNAPSHOT</version>
    <name>first-springboot3-maven</name>
    <description>first-springboot3-maven</description>
    <properties>
        <!--Jdk版本要求17以上-->
        <java.version>17</java.version>
    </properties>
    <dependencies>
        <!--引入spring-boot-starter-web,支持web开发-->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
        <!--引入单元测试starter-->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-test</artifactId>
            <scope>test</scope>
        </dependency>
    </dependencies>
    <build>
        <plugins>
            <!--spring boot maven插件,支持maven的全流程命令以及程序运行-->
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
            </plugin>
        </plugins>
    </build>
    <repositories>
        <!--由于目前3.0还是处于里程碑版本，等到正式release版本，此配置不需要-->
        <repository>
            <id>spring-milestones</id>
            <name>Spring Milestones</name>
            <url>https://repo.spring.io/milestone</url>
            <snapshots>
                <enabled>false</enabled>
            </snapshots>
        </repository>
    </repositories>
    <pluginRepositories>
        <pluginRepository>
            <id>spring-milestones</id>
            <name>Spring Milestones</name>
            <url>https://repo.spring.io/milestone</url>
            <snapshots>
                <enabled>false</enabled>
            </snapshots>
        </pluginRepository>
    </pluginRepositories>
</project>
```

**5.application.properties**

```java
#应用启动端口
server.port=8080
#应用名称
spring.application.name=first
```

**6、** 接口开发；

新建FirstController类

```java
@RestController
public class FirstController {
    @RequestMapping("/hello")
    String hello() {
        return "First Spring Boot 3 Application!";
    }
}
```

**7、** 启动程序；

**8、** 访问接口；

浏览器或者PostMan访问接口http://localhost:8080/hello,结果:

```java
➜ ~ curl 'http://localhost:8080/hello'
First Spring Boot 3 Application!
```
