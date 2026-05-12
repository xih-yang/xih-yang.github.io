# 02、SpringCloud Gateway 网关工作原理及入门案例
- 来源：https://ddkk.com/zhuanlan/gateway/springcloudgateway/1/18.html
- 分类：API网关
- 分组：SpringCloud Gateway
## 工作原理

### 核心概念

**路由(Route)**:路由是网关最基础的部分，路由信息由ID、目标URl、一组断言和一组过滤器组成。如果断言路由为真，则说明请求的URI和配置匹配。

**断言(Predicate)** : Java8中的断言函数。Spring Cloud Gateway 中的断言函数输入类型是Spring 5.0框架中的ServerWebExchange。Spring Cloud Gateway 中的断言函数允许开发者去定义匹配来自于Http Request中的任何信息，比加如请求头和参数等。

**过滤器(Filter)** :一个标准的Spring Web Filter。Spring Cloud Gateway 中的 Flter分为两种类型，分别是Gateway Filter和Global Filter。过滤器将会对清求和响应进行处理。

### 工作原理

如上图所示，客户端向Spring Cloud Gateway发出请求。再由网关处理程序Gateway Handler Mapping 映射确定与请求相匹配的路由，将其发送到网关Web处理程序Gateway Web Handler。该处理程序通过指定的过滤嚣也将请求发送到我们实际的服务执行业务逻辑，然后返回。

过滤器由虚线分隔的原因是，过滤器可以在发送代理请求之前和之后运行逻辑。所有 pre过滤器逻辑均被执行。然后发出代理清求。发出代理清求后，将运行post过滤器逻辑,

在没有端口的路由中定义的 URI 分别为 HTTP 和 HTTPS URI 获得默认端口值 80 和 443。

## 入门案例

### 1. 创建项目

创建三个Spring Boot项目，gateway是网关服务器，app-service001、app-service002为两个后台应用

### 2. 添加依赖

在gateway-demo的pom中，添加版本控制。spring.boot版本为2.5.2，spring cloud 为2020.0.3。

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    <groupId>org.example</groupId>
    <artifactId>gateway-demo</artifactId>
    <version>1.0-SNAPSHOT</version>
    <modules>
        <module>gateway</module>
        <module>app-service001</module>
        <module>app-service002</module>
    </modules>
    <packaging>pom</packaging>
    <properties>
        <java.version>1.8</java.version>
        <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
        <project.reporting.outputEncoding>UTF-8</project.reporting.outputEncoding>
        <!--Spring-->
        <spring.boot.version>2.5.2</spring.boot.version>
        <spring.cloud.version>2020.0.3</spring.cloud.version>
        <spring.cloud.alibaba.version>2.2.6.RELEASE</spring.cloud.alibaba.version>
    </properties>
    <!--Spring版本-->
    <dependencyManagement>
        <dependencies>
            <dependency>
                <groupId>com.alibaba.cloud</groupId>
                <artifactId>spring-cloud-alibaba-dependencies</artifactId>
                <version>${spring.cloud.alibaba.version}</version>
                <type>pom</type>
                <scope>import</scope>
            </dependency>
            <dependency>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-dependencies</artifactId>
                <version>${spring.boot.version}</version>
                <type>pom</type>
                <scope>import</scope>
            </dependency>
            <dependency>
                <groupId>org.springframework.cloud</groupId>
                <artifactId>spring-cloud-dependencies</artifactId>
                <version>${spring.cloud.version}</version>
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
    <repositories>
        <repository>
            <id>aliyun-repos</id>
            <url>https://maven.aliyun.com/nexus/content/groups/public/</url>
            <snapshots>
                <enabled>false</enabled>
            </snapshots>
        </repository>
    </repositories>
    <pluginRepositories>
        <pluginRepository>
            <id>aliyun-plugin</id>
            <url>https://maven.aliyun.com/nexus/content/groups/public/</url>
            <snapshots>
                <enabled>false</enabled>
            </snapshots>
        </pluginRepository>
    </pluginRepositories>
</project>
```

在gateway模块，添加Spring Cloud Gateway依赖：

```xml
<dependencies>
    <dependency>
        <groupId>org.springframework.cloud</groupId>
        <artifactId>spring-cloud-starter-gateway</artifactId>
    </dependency>
</dependencies>
```

在gateway模块，添加YML配置：

```bash
server:
  port: 80
spring:
  cloud:
    gateway:
      enabled: true
```

可以看到gateway-server使用的是3.0.3版本，webflux为2.5.2。

### 3. 后台服务接口

在App1 应用中，我们添加一个测试访问接口。

```java
@RestController
@RequestMapping("/app1")
public class App1Controller {
    @GetMapping("/test")
    public Object test() {
        return "app1";
    }
}
```

可以通过App1 端口去正常访问。

### 4. 配置网关转发

接着我们将App1 集成到网关中，通过访问网关来转发请求，只需要在gateway中配置路由就可以了。这个配置表示，/app1/ 开头的请求，将会被转发到http://localhost:9000 。

```bash
spring:
  cloud:
    gateway:
      enabled: true
      routes:
      - id: app-service001 路由唯一ID
        uri: http://localhost:9000    目标URI,
        predicates:   断言，为真则匹配成功
        - Path=/app1/** 配置规则Path，如果是app1开头的请求，则会将该请求转发到目标URL
```

### 5. 测试

启动三个项目，正常启动成功

通过网关的端口来访问，发现成功转发。
