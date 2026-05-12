# 23、SpringBoot 实战 - 集成 SkyWalking
- 来源：https://ddkk.com/zhuanlan/j2ee/springboot/5/23.html
- 分类：J2EE框架
- 分组：教程目录
**官方网址：**[https://skywalking.apache.org/](https://skywalking.apache.org/)

**官方文档：**[SkyWalking 极简入门 | Apache SkyWalking](https://skywalking.apache.org/zh/2020-04-19-skywalking-quick-start/)

## 一、简介

`SkyWalking` 是一个`开源的分布式跟踪系统`，可以用于监控和诊断分布式系统的性能问题。它可以跟踪应用程序中的请求流，并收集与请求相关的信息，如服务调用、数据库操作、消息队列等。SkyWalking还可以分析和展示这些跟踪数据，以帮助开发人员定位和解决性能问题。

这里我们介绍使用 Docker 方式部署 Skywalking，如果需要本地部署的，请移步：[Skywalking+mysql实战](https://blog.csdn.net/qq_33204709/article/details/121473297)

## 二、拉取镜像并部署

SkyWalking版本：`9.2.0`

**注意：oap版本和agent版本需要适配，版本不适配可能会出现页面无法访问、agent上报不到页面等问题。**

### 1.拉取镜像

```java
docker pull apache/skywalking-oap-server:9.2.0
docker pull apache/skywalking-ui:9.2.0
```

### 2.运行skywalking-oap容器

```java
docker run --name skywalking-oap -e TZ=Asia/Shanghai -p 12800:12800 -p 11800:11800 --restart always -d apache/skywalking-oap-server:9.2.0
```

### 3.运行skywalking-ui容器

```java
docker run -d --name skywalking-ui \
 --restart=always \
 -e TZ=Asia/Shanghai \
 -p 8088:8080 \
 --link skywalking-oap:oap \
 -e SW_OAP_ADDRESS=http://oap:12800 \
 apache/skywalking-ui:9.2.0
```

### 4.访问页面

**访问地址：**[http://localhost:8088](http://localhost:8088)

## 三、下载解压 agent

agent版本：`8.13.0`、`8.16.0`

**注意：agent版本和oap版本需要适配，版本不适配可能会出现页面无法访问、agent上报不到页面等问题。**

### 1.下载

**下载地址：**[https://skywalking.apache.org/downloads/](https://skywalking.apache.org/downloads/)

### 2.解压

解压下载好的 tar 包：

## 四、创建 skywalking-demo 项目

创建一个 SpringBoot 项目，接口地址为：`/demo/test`。

### 1.Maven依赖

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    <parent>
        <groupId>com.example</groupId>
        <artifactId>springboot-skywalking</artifactId>
        <version>0.0.1-SNAPSHOT</version>
    </parent>
    <artifactId>skywalking-demo</artifactId>
    <properties>
        <!-- build env -->
        <java.version>1.8</java.version>
        <maven.compiler.source>1.8</maven.compiler.source>
        <maven.compiler.target>1.8</maven.compiler.target>
        <!-- dependency version -->
        <spring-boot-maven-plugin.version>2.7.5</spring-boot-maven-plugin.version>
    </properties>
    <dependencies>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-test</artifactId>
            <scope>test</scope>
        </dependency>
    </dependencies>
    <build>
        <finalName>${project.artifactId}</finalName>
        <plugins>
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
                <version>${spring-boot-maven-plugin.version}</version>
                <executions>
                    <execution>
                        <goals>
                            <goal>repackage</goal>
                        </goals>
                    </execution>
                </executions>
            </plugin>
        </plugins>
    </build>
</project>
```

### 2.application.yml

```java
server:
  port: 8081
```

### 3.DemoController.java

```java
import com.demo.common.Result;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
@Slf4j
@RestController
@RequestMapping("/demo")
public class DemoController {
    @RequestMapping("/test")
    public Result<Object> test() {
        log.info(">>>>>>>>>>【INFO】DemoController.test()...");
        return Result.succeed();
    }
}
```

## 五、构建启动脚本

### 1.startup.bat

创建txt 文件，输入如下内容，重命名文件为 `startup.bat`。

```java
:: 启动jar包
java -javaagent:D:\IdeaProjects\SpringBootExamples\springboot-skywalking\apache-skywalking-java-agent-8.16.0\skywalking-agent\skywalking-agent.jar=agent.service_name=skywalking-demo,collector.backend_service=127.0.0.1:11800 -jar skywalking-demo\target\skywalking-demo.jar
:: 按键继续
pause
```

如果我们使用 `IDEA` 启动，也可以直接在启动配置里面设置点击 `Modify options`：

选择`VM options`：

输入需要配置的 agent 参数：

```java
-javaagent:C:\Users\lenovo\Downloads\apache-skywalking-java-agent-8.16.0\skywalking-agent\skywalking-agent.jar=agent.service_name=skywalking-demo,collector.backend_service=127.0.0.1:11800
```

点击`Apply` 之后，点击 `Run` 启动即可。

### 2.执行启动脚本

### 3.发送请求

**请求地址：**[http://localhost:8081/demo/test](http://localhost:8081/demo/test)

发送三次请求：

### 4.测试结果

刷新页面，可以看到服务菜单有了 `skywalking-demo` 服务。

点击`服务名`，可以看到详细的请求响应情况：

点击`Trace` 标签，可以看到链路跟踪的内容：

## 六、Skywalking 和 Zipkin 对比

假如我们请求同样的 `/getToken` 接口，这个接口涉及 `PostgreSQL` 用户信息查询，然后创建 token 存储到 `Redis` 里面，再次调用时直接从 Redis 中获取。

**zipkin页面：**

**skywalking页面：**

相比之下，我们可以明显看到 SkyWalking 通过 agent 上报的方式获取到的信息更加全面。
