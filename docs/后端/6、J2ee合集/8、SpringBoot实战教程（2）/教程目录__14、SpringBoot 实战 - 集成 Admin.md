# 14、SpringBoot 实战 - 集成 Admin
- 来源：https://ddkk.com/zhuanlan/j2ee/springboot/5/14.html
- 分类：J2EE框架
- 分组：教程目录
上一章SpringBoot实战（十二）我们集成了 `Spring Actuator`，我们拿到了应用服务的健康状态指标以及其他参数。这一章，我们就来看一下基于 `Spring Actuator` 数据进行图形化界面展示的 `Spring Boot Admin` 框架。

## 一、简介

> Spring Boot Admin： Spring Boot Admin 是一个开源项目，提供了一个基于 web 的界面来管理和监控 Spring Boot 的应用程序。它可以实时监控您的 Spring Boot 应用程序，包括健康状况、指标和其他有用信息。

**GitHub：**[https://github.com/codecentric/spring-boot-admin](https://github.com/codecentric/spring-boot-admin)

**优点：** 快速集成，方便上手。

**缺点：** 数据无法自动持久化，需要手动设计表字段存储。

**官方文档1：**[http://docs.spring-boot-admin.com/current/getting-started.html](http://docs.spring-boot-admin.com/current/getting-started.html)

**官方文档2：**[https://consolelog.gitee.io/docs-spring-boot-admin-docs-chinese/](https://consolelog.gitee.io/docs-spring-boot-admin-docs-chinese/)

**官方文档3：**[https://codecentric.github.io/spring-boot-admin/2.5.1/#getting-started](https://codecentric.github.io/spring-boot-admin/2.5.1/#getting-started)

**官方示例：**[https://github.com/codecentric/spring-boot-admin/tree/master/spring-boot-admin-samples](https://github.com/codecentric/spring-boot-admin/tree/master/spring-boot-admin-samples)

通过Spring Boot Admin，我们可以轻松地从一个仪表板管理多个 Spring Boot 应用程序。我们可以查看每个应用程序的详细信息，包括内存使用情况、CPU 使用情况、线程等等。您还可以查看每个应用程序的配置属性，并在运行时进行编辑。

Spring Boot Admin 还提供了一个集中查看 Spring Boot 应用程序日志的地方。您可以按日期、日志级别和文本搜索过滤日志。这可以帮助我们快速排查应用程序中的问题。

此外，Spring Boot Admin 还具有发送通知的内置支持，当发生某些事件时，例如应用程序关闭或堆使用超过某个阈值时，您可以接收到通知。

总体而言，Spring Boot Admin 是一个有用的工具，用于管理和监控您的 Spring Boot 应用程序。它可以帮助您快速识别和排查问题，同时为您的应用程序的健康和性能提供有价值的参考。

这里，我们会一起创建一个 Spring Boot Admin 的`管理服务`和`客户端服务`。

## 二、搭建 springboot-admin 管理服务

### 1.Maven 依赖

**依赖地址：**[https://mvnrepository.com/artifact/de.codecentric/spring-boot-admin-starter-server](https://mvnrepository.com/artifact/de.codecentric/spring-boot-admin-starter-server)

**注意：**

**1、**`springboot-admin`的`服务端`（spring-boot-admin-starter-server）和`客户端`（spring-boot-admin-starter-client）要使用相同的版本；

**2、**`springboot-admin`和`springboot`版本需要严格对应，比如springboot的版本是`2.4.x`，那么对应的springboot-admin必须是`2.4.x`，不要一味追求最高版本，和springboot版本不对应的话会出现页面无法访问、启动报错等问题；

**3、** 基于第二点，由于`springboot`的`3.x`需要使用`jdk11`，`springboot-admin`的`3.x`版本也需要使用`jdk17`如果需要使用`jdk8`，可以选择springboot-admin的3.0以下版本；

```xml
<properties>
    <java.version>1.8</java.version>
    <spring.boot.version>2.4.5</spring.boot.version>
    <spring.cloud.version>2020.0.3</spring.cloud.version>
    <admin.starter.server.version>2.4.4</admin.starter.server.version>
</properties>
<dependencies>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-web</artifactId>
    </dependency>
    <!-- Lombok -->
    <dependency>
        <groupId>org.projectlombok</groupId>
        <artifactId>lombok</artifactId>
    </dependency>
    <!-- spring-boot-admin -->
    <dependency>
        <groupId>de.codecentric</groupId>
        <artifactId>spring-boot-admin-starter-server</artifactId>
        <version>${admin.starter.server.version}</version>
    </dependency>
    <!-- Eureka -->
    <dependency>
        <groupId>org.springframework.cloud</groupId>
        <artifactId>spring-cloud-starter-netflix-eureka-client</artifactId>
    </dependency>
</dependencies>
<dependencyManagement>
    <dependencies>
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
```

### 2.application.yml

```java
server:
  port: 8000
spring:
  application:
    name: springboot-admin
management:
  endpoint:
    health:
      show-details: always
```

### 3.添加 @EnableAdminServer

在启动类添加 `@EnableAdminServer` 注解：

```java
import de.codecentric.boot.admin.server.config.EnableAdminServer;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
@EnableAdminServer
@SpringBootApplication
public class SpringbootDemoApplication {
    public static void main(String[] args) {
        SpringApplication.run(SpringbootDemoApplication.class, args);
    }
}
```

### 4.启动服务，查看页面

启动`springboot-admin` 服务，访问地址：http://localhost:8000

## 三、搭建 springboot-admin-client 客户端服务

### 1.Maven 依赖

**依赖地址：**[https://mvnrepository.com/artifact/de.codecentric/spring-boot-admin-starter-client](https://mvnrepository.com/artifact/de.codecentric/spring-boot-admin-starter-client)

```xml
<properties>
    <java.version>1.8</java.version>
    <spring.boot.version>2.4.5</spring.boot.version>
    <spring.cloud.version>2020.0.3</spring.cloud.version>
    <admin.starter.client.version>2.4.4</admin.starter.client.version>
</properties>
<dependencies>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-web</artifactId>
    </dependency>
    <!-- Lombok -->
    <dependency>
        <groupId>org.projectlombok</groupId>
        <artifactId>lombok</artifactId>
    </dependency>
    <!-- spring-boot-actuator -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-actuator</artifactId>
    </dependency>
    <!-- spring-boot-admin-client -->
    <dependency>
        <groupId>de.codecentric</groupId>
        <artifactId>spring-boot-admin-starter-client</artifactId>
        <version>${admin.starter.client.version}</version>
    </dependency>
</dependencies>
<dependencyManagement>
    <dependencies>
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
```

### 2.application.yml

```java
server:
  port: 8001
spring:
  application:
    name: springboot-admin-client
  boot:
    admin:
      client:
        api-path: /instances
        url: http://127.0.0.1:8100
        instance:
          prefer-ip: true 使用ip注册进来
management:
  endpoint:
    health:
      show-details: always
  endpoints:
    enabled-by-default: true
    web:
      base-path: /actuator
      exposure:
        include: "*"
```

### 3.启动服务，查看页面

启动`springboot-admin-client` 服务，再次访问地址：http://localhost:8000

点击`应用墙`，我们可以看到目前是只有一个客户端服务。

点击这个服务，我们可以看到当前服务的元数据、进程和线程的状态等信息。

以上就是 `Spring Boot Admin` 框架的原始集成方式。

## 四、搭配 Eureka 使用

其实`Spring Boot Admin` 可以搭配 `Eureka` 注册中心，实现自动扫描注册到注册中心上的所有服务，只要服务中集成了 `Spring Actuator`。

### 1.搭建 springboot-eureka 服务

#### 1.1）Maven 依赖：

```xml
<properties>
    <java.version>1.8</java.version>
    <spring.boot.version>2.4.5</spring.boot.version>
    <spring.cloud.version>2020.0.3</spring.cloud.version>
</properties>
<dependencies>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-web</artifactId>
    </dependency>
    <!-- eureka -->
    <dependency>
        <groupId>org.springframework.cloud</groupId>
        <artifactId>spring-cloud-starter-netflix-eureka-server</artifactId>
    </dependency>
</dependencies>
<dependencyManagement>
    <dependencies>
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
```

#### 1.2）application.yml：

```java
server:
  port: 1001
spring:
  application:
    name: springboot-eureka
  security:
    user:
      name: demo
      password: Demo2023
eureka:
  instance:
    hostname: localhost
  client:
    eureka.client.registerWithEureka ：表示是否将自己注册到Eureka Server，默认为true。
    由于当前这个应用就是Eureka Server，故而设为false
    register-with-eureka: false
    eureka.client.fetchRegistry ：表示是否从Eureka Server获取注册信息，默认为true。
    因为这是一个单点的Eureka Server，不需要同步其他的Eureka Server节点的数据，故而设为false。
    fetch-registry: false
  server:
    配置属性，但由于 Eureka 自我保护模式以及心跳周期长的原因，经常会遇到 Eureka Server 不剔除已关停的节点的问题
    enable-self-preservation: false
    清理间隔（单位毫秒，默认是60*1000），开发环境设置如下可快速移除不可用的服务
    eviction-interval-timer-in-ms: 5000
```

#### 1.3）添加 @EnableEurekaServer 注解

```java
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.netflix.eureka.server.EnableEurekaServer;
@EnableEurekaServer
@SpringBootApplication
public class SpringbootDemoApplication {
    public static void main(String[] args) {
        SpringApplication.run(SpringbootDemoApplication.class, args);
    }
}
```

#### 1.4）启动服务

启动服务，访问地址：http://localhost:1001

### 2.调整 springboot-admin 管理服务

#### 1.1）Maven依赖：

```xml
<properties>
    <java.version>1.8</java.version>
    <spring.boot.version>2.4.5</spring.boot.version>
    <spring.cloud.version>2020.0.3</spring.cloud.version>
    <admin.starter.server.version>2.3.1</admin.starter.server.version>
</properties>
<dependencies>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-web</artifactId>
    </dependency>
    <!-- Lombok -->
    <dependency>
        <groupId>org.projectlombok</groupId>
        <artifactId>lombok</artifactId>
    </dependency>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-test</artifactId>
        <scope>test</scope>
    </dependency>
    <!-- spring-boot-admin -->
    <dependency>
        <groupId>de.codecentric</groupId>
        <artifactId>spring-boot-admin-starter-server</artifactId>
        <version>${admin.starter.server.version}</version>
    </dependency>
    <!-- Eureka -->
    <dependency>
        <groupId>org.springframework.cloud</groupId>
        <artifactId>spring-cloud-starter-netflix-eureka-client</artifactId>
    </dependency>
</dependencies>
<dependencyManagement>
    <dependencies>
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
```

#### 1.2）application.yml

```java
server:
  port: 8000
spring:
  application:
    name: springboot-admin
management:
  endpoint:
    health:
      show-details: always
#eureka client
eureka:
  client:
    service-url:
      defaultZone: http://demo:Demo2023@localhost:1001/eureka/
  instance:
    hostname: localhost
    prefer-ip-address: true 是否使用 ip 地址注册
    instance-id: ${
     spring.cloud.client.ip-address}:${
     server.port} ip:port
    lease-renewal-interval-in-seconds: 5 实例续期心跳间隔（默认30s），设置之后启动服务不需要等很久就可以访问到服务的内容
    lease-expiration-duration-in-seconds: 15 实例续期持续多久后失效（默认90s）
```

#### 1.3）启动服务

访问Eureka 地址：http://localhost:1001

访问管理页面地址：http://localhost:8000/wallboard

### 3.调整 springboot-admin-client 客户端服务

#### 1.1）Maven依赖：

```xml
<properties>
    <java.version>1.8</java.version>
    <spring.boot.version>2.3.6.RELEASE</spring.boot.version>
    <spring.cloud.version>Hoxton.SR8</spring.cloud.version>
    <admin.starter.client.version>2.3.1</admin.starter.client.version>
</properties>
<dependencies>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-web</artifactId>
    </dependency>
    <!-- Lombok -->
    <dependency>
        <groupId>org.projectlombok</groupId>
        <artifactId>lombok</artifactId>
    </dependency>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-test</artifactId>
        <scope>test</scope>
    </dependency>
    <!-- spring-boot-actuator -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-actuator</artifactId>
    </dependency>
    <!-- spring-boot-admin-client -->
    <dependency>
        <groupId>de.codecentric</groupId>
        <artifactId>spring-boot-admin-starter-client</artifactId>
        <version>${admin.starter.client.version}</version>
    </dependency>
    <!-- Eureka -->
    <dependency>
        <groupId>org.springframework.cloud</groupId>
        <artifactId>spring-cloud-starter-netflix-eureka-client</artifactId>
    </dependency>
</dependencies>
<dependencyManagement>
    <dependencies>
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
```

#### 1.2）application.yml

```java
server:
  port: 8001
spring:
  application:
    name: springboot-admin-client
#  boot:
#    admin:
#      client:
#        api-path: /instances
#        url: http://127.0.0.1:8000
#        instance:
#          prefer-ip: true 使用ip注册进来
management:
  endpoint:
    health:
      show-details: always
  endpoints:
    enabled-by-default: true
    web:
      base-path: /actuator
      exposure:
        include: "*"
#eureka client
eureka:
  client:
    service-url:
      defaultZone: http://demo:Demo2023@localhost:1001/eureka/
  instance:
    hostname: localhost
    prefer-ip-address: true 是否使用 ip 地址注册
    instance-id: ${
     spring.cloud.client.ip-address}:${
     server.port} ip:port
    lease-renewal-interval-in-seconds: 5 实例续期心跳间隔（默认30s），设置之后启动服务不需要等很久就可以访问到服务的内容
    lease-expiration-duration-in-seconds: 15 实例续期持续多久后失效（默认90s）
```

#### 1.3）启动服务

访问Eureka 地址：http://localhost:1001

访问管理页面地址：http://localhost:8000/wallboard

## 五、集成Security

**官方示例：**[https://github.com/codecentric/spring-boot-admin/tree/2.4.x/spring-boot-admin-samples/spring-boot-admin-sample-servlet](https://github.com/codecentric/spring-boot-admin/tree/2.4.x/spring-boot-admin-samples/spring-boot-admin-sample-servlet)

### 1.Maven依赖

```xml
<!-- Security -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-security</artifactId>
</dependency>
```

### 2.服务端修改配置

```java
spring:
  application:
    name: springboot-admin
  security:
    user:
      name: "admin"
      password: "admin"
  如果地址有变更，需要配置此项，否则页面css/js会加载失败
  boot:
    admin:
      ui:
        public-url: http://localhost:8002/
```

### 3.客户端配置

如果是通过注册中心方式注册到 `springboot-admin` 服务端上，则不需要进行修改，如果是直接注册的，则需要配置用户名和密码。

```java
spring:
  application:
    name: springboot-admin-client
#  boot:
#    admin:
#      client:
#        当直接注册到服务端时需要使用账号密码，通过Eureka时不需要
#        username: admin
#        password: admin
#        api-path: /instances
#        url: http://127.0.0.1:8001
#        instance:
#          prefer-ip: true 使用ip注册进来
```

### 4.服务端Security配置类

该配置类主要用于将 `Security` 自带的登录页面改为使用 `Admin` 的登陆界面。

**SecuritySecureConfig.java**

```java
import de.codecentric.boot.admin.server.config.AdminServerProperties;
import org.springframework.boot.autoconfigure.security.SecurityProperties;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.authentication.builders.AuthenticationManagerBuilder;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.WebSecurityConfigurerAdapter;
import org.springframework.security.web.authentication.SavedRequestAwareAuthenticationSuccessHandler;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;
import org.springframework.security.web.util.matcher.AntPathRequestMatcher;
import java.util.UUID;
/**
 * <p> @Title SecuritySecureConfig
 * <p> @Description Security配置类
 *
 * @author DDKK.COM 弟弟快看，程序员编程资料站
 * @date 2023/7/19 11:34
 */
@Configuration(proxyBeanMethods = false)
public class SecuritySecureConfig extends WebSecurityConfigurerAdapter {
    private final AdminServerProperties adminServer;
    private final SecurityProperties security;
    public SecuritySecureConfig(AdminServerProperties adminServer, SecurityProperties security) {
        this.adminServer = adminServer;
        this.security = security;
    }
    @Override
    protected void configure(HttpSecurity http) throws Exception {
        SavedRequestAwareAuthenticationSuccessHandler successHandler = new SavedRequestAwareAuthenticationSuccessHandler();
        successHandler.setTargetUrlParameter("redirectTo");
        successHandler.setDefaultTargetUrl(this.adminServer.path("/"));
        http.authorizeRequests(
                        (authorizeRequests) -> authorizeRequests.antMatchers(this.adminServer.path("/assets/**")).permitAll() // <1>
                                .antMatchers(this.adminServer.path("/actuator/info")).permitAll()
                                .antMatchers(this.adminServer.path("/actuator/health")).permitAll()
                                .antMatchers(this.adminServer.path("/login")).permitAll().anyRequest().authenticated() // <2>
                ).formLogin(
                        (formLogin) -> formLogin.loginPage(this.adminServer.path("/login")).successHandler(successHandler).and() // <3>
                ).logout((logout) -> logout.logoutUrl(this.adminServer.path("/logout"))).httpBasic(Customizer.withDefaults()) // <4>
                .csrf((csrf) -> csrf.csrfTokenRepository(CookieCsrfTokenRepository.withHttpOnlyFalse()) // <5>
                        .ignoringRequestMatchers(
                                new AntPathRequestMatcher(this.adminServer.path("/instances"),
                                        HttpMethod.POST.toString()), // <6>
                                new AntPathRequestMatcher(this.adminServer.path("/instances/*"),
                                        HttpMethod.DELETE.toString()), // <6>
                                new AntPathRequestMatcher(this.adminServer.path("/actuator/**")) // <7>
                        ))
                .rememberMe((rememberMe) -> rememberMe.key(UUID.randomUUID().toString()).tokenValiditySeconds(1209600));
    }
    // Required to provide UserDetailsService for "remember functionality"
    @Override
    protected void configure(AuthenticationManagerBuilder auth) throws Exception {
        auth.inMemoryAuthentication().withUser(security.getUser().getName())
                .password("{noop}" + security.getUser().getPassword()).roles("USER");
    }
}
```

### 5.测试

启动服务，登录界面如下：

## 六、踩坑记录

### 1.页面无法加载

**问题截图：**

**问题分析：**

这是因为 `springboot-admin` 和 `springboot` 版本不适配导致的。

**解决方案：**

降低`springboot-admin` 版本到 `2.4.x` 即可。

### 2.启动报错 类文件具有错误的版本 61.0, 应为 52.0

**问题截图：**

**详细报错：**

```java
java: 无法访问de.codecentric.boot.admin.server.config.EnableAdminServer
  错误的类文件: /D:/maven_repository/de/codecentric/spring-boot-admin-server/3.1.2/spring-boot-admin-server-3.1.2.jar!/de/codecentric/boot/admin/server/config/EnableAdminServer.class
    类文件具有错误的版本 61.0, 应为 52.0
    请删除该文件或确保该文件位于正确的类路径子目录中。
```

**问题分析：**

`spring-boot-admin-starter-server` 依赖使用的是 `3.x` 版本，要求使用 `jdk17`，但是本地使用的是 `jdk8`。

**解决方案：**

降低admin 依赖的版本到 `2.x`，或者升级本地到 `jdk11` 即可。

### 3.启动报错java.lang.NoClassDefFoundError: reactor/core/publisher/Sinks$EmitResult

**问题截图：**

**详细报错：**

```java
Error starting ApplicationContext. To display the conditions report re-run your application with 'debug' enabled.
2023-07-19 10:35:20.422 ERROR 9628 --- [           main] o.s.boot.SpringApplication               : Application run failed
org.springframework.beans.factory.UnsatisfiedDependencyException: Error creating bean with name 'cookieStoreCleanupTrigger' defined in class path resource [de/codecentric/boot/admin/server/config/AdminServerInstanceWebClientConfiguration$CookieStoreConfiguration.class]: Unsatisfied dependency expressed through method 'cookieStoreCleanupTrigger' parameter 0; nested exception is org.springframework.beans.factory.BeanCreationException: Error creating bean with name 'eventStore' defined in class path resource [de/codecentric/boot/admin/server/config/AdminServerAutoConfiguration.class]: Bean instantiation via factory method failed; nested exception is org.springframework.beans.BeanInstantiationException: Failed to instantiate [de.codecentric.boot.admin.server.eventstore.InMemoryEventStore]: Factory method 'eventStore' threw exception; nested exception is java.lang.BootstrapMethodError: java.lang.NoClassDefFoundError: reactor/core/publisher/Sinks$EmitResult
	at org.springframework.beans.factory.support.ConstructorResolver.createArgumentArray(ConstructorResolver.java:799) ~[spring-beans-5.2.12.RELEASE.jar:5.2.12.RELEASE]
	at org.springframework.beans.factory.support.ConstructorResolver.instantiateUsingFactoryMethod(ConstructorResolver.java:540) ~[spring-beans-5.2.12.RELEASE.jar:5.2.12.RELEASE]
	at org.springframework.beans.factory.support.AbstractAutowireCapableBeanFactory.instantiateUsingFactoryMethod(AbstractAutowireCapableBeanFactory.java:1336) ~[spring-beans-5.2.12.RELEASE.jar:5.2.12.RELEASE]
	at org.springframework.beans.factory.support.AbstractAutowireCapableBeanFactory.createBeanInstance(AbstractAutowireCapableBeanFactory.java:1176) ~[spring-beans-5.2.12.RELEASE.jar:5.2.12.RELEASE]
	at org.springframework.beans.factory.support.AbstractAutowireCapableBeanFactory.doCreateBean(AbstractAutowireCapableBeanFactory.java:556) ~[spring-beans-5.2.12.RELEASE.jar:5.2.12.RELEASE]
	at org.springframework.beans.factory.support.AbstractAutowireCapableBeanFactory.createBean(AbstractAutowireCapableBeanFactory.java:516) ~[spring-beans-5.2.12.RELEASE.jar:5.2.12.RELEASE]
	at org.springframework.beans.factory.support.AbstractBeanFactory.lambda$doGetBean$0(AbstractBeanFactory.java:324) ~[spring-beans-5.2.12.RELEASE.jar:5.2.12.RELEASE]
	at org.springframework.beans.factory.support.DefaultSingletonBeanRegistry.getSingleton(DefaultSingletonBeanRegistry.java:234) ~[spring-beans-5.2.12.RELEASE.jar:5.2.12.RELEASE]
	at org.springframework.beans.factory.support.AbstractBeanFactory.doGetBean(AbstractBeanFactory.java:322) ~[spring-beans-5.2.12.RELEASE.jar:5.2.12.RELEASE]
	at org.springframework.beans.factory.support.AbstractBeanFactory.getBean(AbstractBeanFactory.java:202) ~[spring-beans-5.2.12.RELEASE.jar:5.2.12.RELEASE]
	at org.springframework.beans.factory.support.DefaultListableBeanFactory.preInstantiateSingletons(DefaultListableBeanFactory.java:897) ~[spring-beans-5.2.12.RELEASE.jar:5.2.12.RELEASE]
	at org.springframework.context.support.AbstractApplicationContext.finishBeanFactoryInitialization(AbstractApplicationContext.java:879) ~[spring-context-5.2.12.RELEASE.jar:5.2.12.RELEASE]
	at org.springframework.context.support.AbstractApplicationContext.refresh(AbstractApplicationContext.java:551) ~[spring-context-5.2.12.RELEASE.jar:5.2.12.RELEASE]
	at org.springframework.boot.web.servlet.context.ServletWebServerApplicationContext.refresh(ServletWebServerApplicationContext.java:141) ~[spring-boot-2.2.13.RELEASE.jar:2.2.13.RELEASE]
	at org.springframework.boot.SpringApplication.refresh(SpringApplication.java:747) [spring-boot-2.2.13.RELEASE.jar:2.2.13.RELEASE]
	at org.springframework.boot.SpringApplication.refreshContext(SpringApplication.java:405) [spring-boot-2.2.13.RELEASE.jar:2.2.13.RELEASE]
	at org.springframework.boot.SpringApplication.run(SpringApplication.java:315) [spring-boot-2.2.13.RELEASE.jar:2.2.13.RELEASE]
	at org.springframework.boot.SpringApplication.run(SpringApplication.java:1226) [spring-boot-2.2.13.RELEASE.jar:2.2.13.RELEASE]
	at org.springframework.boot.SpringApplication.run(SpringApplication.java:1215) [spring-boot-2.2.13.RELEASE.jar:2.2.13.RELEASE]
	at com.demo.SpringbootDemoApplication.main(SpringbootDemoApplication.java:12) [classes/:na]
Caused by: org.springframework.beans.factory.BeanCreationException: Error creating bean with name 'eventStore' defined in class path resource [de/codecentric/boot/admin/server/config/AdminServerAutoConfiguration.class]: Bean instantiation via factory method failed; nested exception is org.springframework.beans.BeanInstantiationException: Failed to instantiate [de.codecentric.boot.admin.server.eventstore.InMemoryEventStore]: Factory method 'eventStore' threw exception; nested exception is java.lang.BootstrapMethodError: java.lang.NoClassDefFoundError: reactor/core/publisher/Sinks$EmitResult
	at org.springframework.beans.factory.support.ConstructorResolver.instantiate(ConstructorResolver.java:657) ~[spring-beans-5.2.12.RELEASE.jar:5.2.12.RELEASE]
	at org.springframework.beans.factory.support.ConstructorResolver.instantiateUsingFactoryMethod(ConstructorResolver.java:485) ~[spring-beans-5.2.12.RELEASE.jar:5.2.12.RELEASE]
	at org.springframework.beans.factory.support.AbstractAutowireCapableBeanFactory.instantiateUsingFactoryMethod(AbstractAutowireCapableBeanFactory.java:1336) ~[spring-beans-5.2.12.RELEASE.jar:5.2.12.RELEASE]
	at org.springframework.beans.factory.support.AbstractAutowireCapableBeanFactory.createBeanInstance(AbstractAutowireCapableBeanFactory.java:1176) ~[spring-beans-5.2.12.RELEASE.jar:5.2.12.RELEASE]
	at org.springframework.beans.factory.support.AbstractAutowireCapableBeanFactory.doCreateBean(AbstractAutowireCapableBeanFactory.java:556) ~[spring-beans-5.2.12.RELEASE.jar:5.2.12.RELEASE]
	at org.springframework.beans.factory.support.AbstractAutowireCapableBeanFactory.createBean(AbstractAutowireCapableBeanFactory.java:516) ~[spring-beans-5.2.12.RELEASE.jar:5.2.12.RELEASE]
	at org.springframework.beans.factory.support.AbstractBeanFactory.lambda$doGetBean$0(AbstractBeanFactory.java:324) ~[spring-beans-5.2.12.RELEASE.jar:5.2.12.RELEASE]
	at org.springframework.beans.factory.support.DefaultSingletonBeanRegistry.getSingleton(DefaultSingletonBeanRegistry.java:234) ~[spring-beans-5.2.12.RELEASE.jar:5.2.12.RELEASE]
	at org.springframework.beans.factory.support.AbstractBeanFactory.doGetBean(AbstractBeanFactory.java:322) ~[spring-beans-5.2.12.RELEASE.jar:5.2.12.RELEASE]
	at org.springframework.beans.factory.support.AbstractBeanFactory.getBean(AbstractBeanFactory.java:202) ~[spring-beans-5.2.12.RELEASE.jar:5.2.12.RELEASE]
	at org.springframework.beans.factory.config.DependencyDescriptor.resolveCandidate(DependencyDescriptor.java:276) ~[spring-beans-5.2.12.RELEASE.jar:5.2.12.RELEASE]
	at org.springframework.beans.factory.support.DefaultListableBeanFactory.doResolveDependency(DefaultListableBeanFactory.java:1307) ~[spring-beans-5.2.12.RELEASE.jar:5.2.12.RELEASE]
	at org.springframework.beans.factory.support.DefaultListableBeanFactory.resolveDependency(DefaultListableBeanFactory.java:1227) ~[spring-beans-5.2.12.RELEASE.jar:5.2.12.RELEASE]
	at org.springframework.beans.factory.support.ConstructorResolver.resolveAutowiredArgument(ConstructorResolver.java:886) ~[spring-beans-5.2.12.RELEASE.jar:5.2.12.RELEASE]
	at org.springframework.beans.factory.support.ConstructorResolver.createArgumentArray(ConstructorResolver.java:790) ~[spring-beans-5.2.12.RELEASE.jar:5.2.12.RELEASE]
	... 19 common frames omitted
Caused by: org.springframework.beans.BeanInstantiationException: Failed to instantiate [de.codecentric.boot.admin.server.eventstore.InMemoryEventStore]: Factory method 'eventStore' threw exception; nested exception is java.lang.BootstrapMethodError: java.lang.NoClassDefFoundError: reactor/core/publisher/Sinks$EmitResult
	at org.springframework.beans.factory.support.SimpleInstantiationStrategy.instantiate(SimpleInstantiationStrategy.java:185) ~[spring-beans-5.2.12.RELEASE.jar:5.2.12.RELEASE]
	at org.springframework.beans.factory.support.ConstructorResolver.instantiate(ConstructorResolver.java:652) ~[spring-beans-5.2.12.RELEASE.jar:5.2.12.RELEASE]
	... 33 common frames omitted
Caused by: java.lang.BootstrapMethodError: java.lang.NoClassDefFoundError: reactor/core/publisher/Sinks$EmitResult
	at de.codecentric.boot.admin.server.eventstore.InstanceEventPublisher.<init>(InstanceEventPublisher.java:38) ~[spring-boot-admin-server-2.6.11.jar:2.6.11]
	at de.codecentric.boot.admin.server.eventstore.ConcurrentMapEventStore.<init>(ConcurrentMapEventStore.java:54) ~[spring-boot-admin-server-2.6.11.jar:2.6.11]
	at de.codecentric.boot.admin.server.eventstore.InMemoryEventStore.<init>(InMemoryEventStore.java:38) ~[spring-boot-admin-server-2.6.11.jar:2.6.11]
	at de.codecentric.boot.admin.server.eventstore.InMemoryEventStore.<init>(InMemoryEventStore.java:34) ~[spring-boot-admin-server-2.6.11.jar:2.6.11]
	at de.codecentric.boot.admin.server.config.AdminServerAutoConfiguration.eventStore(AdminServerAutoConfiguration.java:139) ~[spring-boot-admin-server-2.6.11.jar:2.6.11]
	at sun.reflect.NativeMethodAccessorImpl.invoke0(Native Method) ~[na:1.8.0_60]
	at sun.reflect.NativeMethodAccessorImpl.invoke(NativeMethodAccessorImpl.java:62) ~[na:1.8.0_60]
	at sun.reflect.DelegatingMethodAccessorImpl.invoke(DelegatingMethodAccessorImpl.java:43) ~[na:1.8.0_60]
	at java.lang.reflect.Method.invoke(Method.java:497) ~[na:1.8.0_60]
	at org.springframework.beans.factory.support.SimpleInstantiationStrategy.instantiate(SimpleInstantiationStrategy.java:154) ~[spring-beans-5.2.12.RELEASE.jar:5.2.12.RELEASE]
	... 34 common frames omitted
Caused by: java.lang.NoClassDefFoundError: reactor/core/publisher/Sinks$EmitResult
	... 44 common frames omitted
Caused by: java.lang.ClassNotFoundException: reactor.core.publisher.Sinks$EmitResult
	at java.net.URLClassLoader.findClass(URLClassLoader.java:381) ~[na:1.8.0_60]
	at java.lang.ClassLoader.loadClass(ClassLoader.java:424) ~[na:1.8.0_60]
	at sun.misc.Launcher$AppClassLoader.loadClass(Launcher.java:331) ~[na:1.8.0_60]
	at java.lang.ClassLoader.loadClass(ClassLoader.java:357) ~[na:1.8.0_60]
	... 44 common frames omitted
```

**问题分析：**

这是因为 `springboot-admin` 和 `springboot` 版本不适配导致的。

**解决方案：**

降低`springboot-admin` 版本到 `2.2.x` 即可。

### 4.页面 css/js 加载失败

**问题截图：**

**问题分析：**

这是因为使用了 `Nginx` 进行了反向代理，或者使用网关进行了转发，导致无法直接访问 jar 包所在机器的 `ip:port/` 下面的静态资源，所以报错了。

**解决方案：**

在`springboot-admin` 中有提供用来解决这个问题的配置，需要在 `服务端` 进行如下配置：

```java
spring:
  boot:
    admin:
      url:
        public-url: http://192.168.1.10:1002/api-admin/
```

加载成功页面如下：
