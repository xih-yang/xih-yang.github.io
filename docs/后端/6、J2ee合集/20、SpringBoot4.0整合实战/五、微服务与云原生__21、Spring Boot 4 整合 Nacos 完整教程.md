# 21、Spring Boot 4 整合 Nacos 完整教程
- 来源：https://ddkk.com/springboot/4-action/21.html
- 分类：Spring Boot 4 整合教程
- 分组：五、微服务与云原生
- 日期：2025-12-08
做微服务项目的时候,最烦的就是服务发现和配置管理,用Eureka吧,功能单一还停止维护了;用Consul吧,配置复杂;用Apollo吧,太重了;后来听说Nacos这玩意儿不错,服务发现、配置管理、服务管理一应俱全,而且还是阿里巴巴开源的,社区活跃、文档完善;但是直接用Nacos客户端写,那叫一个复杂,服务注册、配置监听、命名空间管理,一堆代码写得人头疼;后来发现Spring Cloud Alibaba直接把这些都封装好了,用起来贼简单;现在Spring Boot 4出来了,整合Nacos更是方便得不行,自动配置给你整得明明白白,咱今天就聊聊Spring Boot 4咋整合Nacos的。

其实Nacos在Spring Boot里早就支持了,你只要加个`spring-cloud-starter-alibaba-nacos-discovery`和`spring-cloud-starter-alibaba-nacos-config`依赖,基本上就能用;但是很多兄弟不知道里面的门道,也不知道咋用服务发现、配置管理、动态刷新、命名空间这些高级功能,所以鹏磊今天就给兄弟们掰扯掰扯。

## Nacos基础概念

### Nacos是啥玩意儿

Nacos(Naming and Configuration Service)是阿里巴巴开源的一个更易于构建云原生应用的动态服务发现、配置管理和服务管理平台;Nacos的核心功能包括:

1. **服务发现和服务健康监测**: 支持基于DNS和基于RPC的服务发现,提供实时的健康检查
2. **动态配置服务**: 支持配置的动态管理,配置变更实时推送
3. **动态DNS服务**: 支持权重路由,更容易实现中间层负载均衡、流量控制
4. **服务及其元数据管理**: 支持从微服务平台建设的视角管理数据中心的所有服务及元数据

### Nacos的核心概念

1. **命名空间(Namespace)**: 用于进行租户粒度的配置隔离,不同的命名空间下可以存在相同的Group或Data ID的配置
2. **配置分组(Group)**: Nacos配置的一组集合,是组织配置的维度之一
3. **配置ID(Data ID)**: Nacos中某个配置集的ID,配置集是组织配置的维度之一
4. **服务(Service)**: 通过预定义接口网络访问的提供给客户端的软件功能
5. **服务名(Service Name)**: 服务提供的标识,通过该标识可以唯一确定其指代的服务
6. **服务注册中心(Service Registry)**: 存储服务实例和服务负载均衡元数据的数据库
7. **服务发现(Service Discovery)**: 在计算机网络上自动发现设备或服务的能力

### Nacos和Eureka的区别

1. **功能**: Nacos功能更全面,支持服务发现和配置管理;Eureka只支持服务发现
2. **配置管理**: Nacos支持动态配置管理;Eureka不支持
3. **健康检查**: Nacos支持多种健康检查方式;Eureka只支持客户端心跳
4. **性能**: Nacos性能更好,支持百万级服务注册
5. **维护**: Nacos是阿里巴巴维护,活跃度高;Eureka已经进入维护模式

## Nacos服务器安装和启动

### 下载Nacos

从Nacos官网下载最新版本: https://github.com/alibaba/nacos/releases

```bash
# 下载Nacos服务器
wget https://github.com/alibaba/nacos/releases/download/2.3.0/nacos-server-2.3.0.tar.gz
# 解压
tar -xzf nacos-server-2.3.0.tar.gz
cd nacos
```

### 启动Nacos服务器

```bash
# Linux/Mac启动(单机模式,适合开发测试)
sh startup.sh -m standalone
# Windows启动(单机模式)
startup.cmd -m standalone
```

启动成功后,访问 http://localhost:8848/nacos,默认用户名密码都是`nacos`。

### Nacos集群模式(生产环境)

生产环境建议使用集群模式,提高可用性:

```bash
# 修改conf/cluster.conf,配置集群节点
192.168.1.1:8848
192.168.1.2:8848
192.168.1.3:8848
# 启动集群模式
sh startup.sh
```

## 项目搭建和依赖配置

### 创建Maven项目

首先你得有个Maven项目,用IDEA或者Eclipse都行,或者直接用Spring Initializr生成;项目结构大概是这样:

```plaintext
spring-boot-nacos-demo/
├── pom.xml                          # Maven配置文件
├── src/
│   ├── main/
│   │   ├── java/
│   │   │   └── com/
│   │   │       └── example/
│   │   │           └── demo/
│   │   │               ├── Application.java          # 启动类
│   │   │               ├── controller/               # 控制器目录
│   │   │               ├── service/                  # 服务层目录
│   │   │               ├── config/                    # 配置类目录
│   │   │               └── feign/                    # Feign客户端目录
│   │   └── resources/
│   │       ├── application.yml                       # 本地配置文件
│   │       ├── bootstrap.yml                         # Nacos配置文件(优先级更高)
│   │       └── logback-spring.xml                    # 日志配置
│   └── test/
│       └── java/                                     # 测试代码目录
```

### pom.xml完整配置

这是最关键的,依赖配置不对后面全是坑;Spring Boot 4需要Java 17以上,而且Spring Cloud Alibaba版本要选对。

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 
         http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    <!-- 继承Spring Boot父POM,统一管理版本 -->
    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>4.0.0</version>  <!-- Spring Boot 4.0版本 -->
        <relativePath/>
    </parent>
    <groupId>com.example</groupId>
    <artifactId>spring-boot-nacos-demo</artifactId>
    <version>1.0.0</version>
    <packaging>jar</packaging>
    <name>Spring Boot 4 Nacos Demo</name>
    <description>Spring Boot 4整合Nacos示例项目</description>
    <properties>
        <java.version>17</java.version>  <!-- Java 17以上 -->
        <maven.compiler.source>17</maven.compiler.source>
        <maven.compiler.target>17</maven.compiler.target>
        <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
        <spring-cloud.version>2023.0.0</spring-cloud.version>  <!-- Spring Cloud版本 -->
        <spring-cloud-alibaba.version>2022.0.0.0</spring-cloud-alibaba.version>  <!-- Spring Cloud Alibaba版本 -->
    </properties>
    <dependencyManagement>
        <dependencies>
            <!-- Spring Cloud依赖管理 -->
            <dependency>
                <groupId>org.springframework.cloud</groupId>
                <artifactId>spring-cloud-dependencies</artifactId>
                <version>${spring-cloud.version}</version>
                <type>pom</type>
                <scope>import</scope>
            </dependency>
            <!-- Spring Cloud Alibaba依赖管理 -->
            <dependency>
                <groupId>com.alibaba.cloud</groupId>
                <artifactId>spring-cloud-alibaba-dependencies</artifactId>
                <version>${spring-cloud-alibaba.version}</version>
                <type>pom</type>
                <scope>import</scope>
            </dependency>
        </dependencies>
    </dependencyManagement>
    <dependencies>
        <!-- Spring Boot Web Starter: 包含Spring MVC、Tomcat等 -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
        <!-- Nacos服务发现: 服务注册与发现 -->
        <dependency>
            <groupId>com.alibaba.cloud</groupId>
            <artifactId>spring-cloud-starter-alibaba-nacos-discovery</artifactId>
        </dependency>
        <!-- Nacos配置管理: 动态配置管理 -->
        <dependency>
            <groupId>com.alibaba.cloud</groupId>
            <artifactId>spring-cloud-starter-alibaba-nacos-config</artifactId>
        </dependency>
        <!-- Spring Cloud LoadBalancer: 负载均衡支持 -->
        <dependency>
            <groupId>org.springframework.cloud</groupId>
            <artifactId>spring-cloud-starter-loadbalancer</artifactId>
        </dependency>
        <!-- Spring Cloud OpenFeign: 服务调用(可选) -->
        <dependency>
            <groupId>org.springframework.cloud</groupId>
            <artifactId>spring-cloud-starter-openfeign</artifactId>
        </dependency>
        <!-- Spring Boot Actuator: 监控和管理支持 -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-actuator</artifactId>
        </dependency>
        <!-- Spring Boot Validation: 参数校验 -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-validation</artifactId>
        </dependency>
        <!-- Lombok: 简化Java代码(可选,但强烈推荐) -->
        <dependency>
            <groupId>org.projectlombok</groupId>
            <artifactId>lombok</artifactId>
            <optional>true</optional>
        </dependency>
        <!-- Spring Boot Test: 测试支持 -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-test</artifactId>
            <scope>test</scope>
        </dependency>
    </dependencies>
    <build>
        <plugins>
            <!-- Spring Boot Maven插件: 打包成可执行JAR -->
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
            </plugin>
        </plugins>
    </build>
</project>
```

### bootstrap.yml配置

Nacos的配置要放在`bootstrap.yml`中,因为它的优先级比`application.yml`高,而且会在应用启动早期加载:

```yaml
spring:
  application:
    name: spring-boot-nacos-demo  # 应用名称,也是Nacos中的服务名
  # Nacos配置
  cloud:
    nacos:
      # 服务发现配置
      discovery:
        server-addr: localhost:8848  # Nacos服务器地址
        namespace: dev  # 命名空间,默认public
        group: DEFAULT_GROUP  # 分组,默认DEFAULT_GROUP
        service: ${spring.application.name}  # 服务名
        weight: 1.0  # 权重,范围0-1
        cluster-name: DEFAULT  # 集群名称
        metadata:
          version: 1.0.0  # 元数据:版本
          env: dev  # 元数据:环境
        enabled: true  # 是否启用服务发现
        register-enabled: true  # 是否注册到Nacos
        ip:  # 注册的IP地址,不配置则自动获取
        port: 8080  # 注册的端口,不配置则使用server.port
        prefer-ip-address: true  # 优先使用IP地址而不是主机名
      # 配置管理配置
      config:
        server-addr: localhost:8848  # Nacos服务器地址
        namespace: dev  # 命名空间,默认public
        group: DEFAULT_GROUP  # 分组,默认DEFAULT_GROUP
        file-extension: yml  # 配置文件扩展名,默认properties
        shared-configs:  # 共享配置列表
          - data-id: common-config.yml  # 共享配置的Data ID
            group: DEFAULT_GROUP  # 分组
            refresh: true  # 是否动态刷新
        extension-configs:  # 扩展配置列表
          - data-id: ext-config.yml
            group: DEFAULT_GROUP
            refresh: true
        enabled: true  # 是否启用配置管理
        refresh-enabled: true  # 是否启用动态刷新
        max-retry: 3  # 最大重试次数
        config-long-poll-timeout: 30000  # 长轮询超时时间(毫秒)
        config-retry-time: 2000  # 重试间隔(毫秒)
        enable-remote-sync-config: true  # 是否启用远程同步配置
# 服务器配置
server:
  port: 8080  # 服务端口
```

### application.yml配置

本地配置放在`application.yml`中:

```yaml
spring:
  profiles:
    active: dev  # 激活的配置文件
# 日志配置
logging:
  level:
    root: INFO
    com.example.demo: DEBUG
    com.alibaba.nacos: DEBUG  # Nacos日志
# Actuator配置
management:
  endpoints:
    web:
      exposure:
        include: health,info,nacos-discovery,nacos-config  # 暴露端点
```

### 启动类配置

启动类需要添加`@EnableDiscoveryClient`注解启用服务发现:

```java
package com.example.demo;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;
import org.springframework.cloud.openfeign.EnableFeignClients;
/**
 * Spring Boot 4 Nacos应用启动类
 */
@SpringBootApplication
@EnableDiscoveryClient  // 启用服务发现
@EnableFeignClients  // 启用Feign客户端(如果使用Feign)
public class Application {
    public static void main(String[] args) {
        SpringApplication.run(Application.class, args);
        System.out.println("Spring Boot 4 Nacos应用启动成功!");
    }
}
```

## 场景一: 服务发现和服务注册

### 应用场景

微服务架构下,服务需要注册到Nacos,其他服务可以通过服务名发现并调用。

### 服务注册

应用启动后会自动注册到Nacos,你可以在Nacos控制台的"服务管理"->"服务列表"中看到注册的服务。

### 服务发现

使用`DiscoveryClient`或`LoadBalancerClient`进行服务发现:

```java
package com.example.demo.controller;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cloud.client.ServiceInstance;
import org.springframework.cloud.client.discovery.DiscoveryClient;
import org.springframework.cloud.client.loadbalancer.LoadBalancerClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.List;
/**
 * 服务发现控制器
 */
@Slf4j
@RestController
@RequestMapping("/discovery")
public class DiscoveryController {
    private final DiscoveryClient discoveryClient;
    private final LoadBalancerClient loadBalancerClient;
    public DiscoveryController(DiscoveryClient discoveryClient, LoadBalancerClient loadBalancerClient) {
        this.discoveryClient = discoveryClient;
        this.loadBalancerClient = loadBalancerClient;
    }
    /**
     * 获取所有服务列表
     */
    @GetMapping("/services")
    public List<String> getServices() {
        List<String> services = discoveryClient.getServices();  // 获取所有服务名
        log.info("发现的服务: {}", services);
        return services;
    }
    /**
     * 获取指定服务的所有实例
     */
    @GetMapping("/instances")
    public List<ServiceInstance> getInstances(String serviceId) {
        List<ServiceInstance> instances = discoveryClient.getInstances(serviceId);  // 获取服务实例列表
        log.info("服务 {} 的实例: {}", serviceId, instances);
        return instances;
    }
    /**
     * 使用负载均衡选择一个实例
     */
    @GetMapping("/choose")
    public ServiceInstance chooseInstance(String serviceId) {
        ServiceInstance instance = loadBalancerClient.choose(serviceId);  // 负载均衡选择一个实例
        log.info("选择的服务实例: {}", instance);
        return instance;
    }
}
```

### 使用RestTemplate调用服务

```java
package com.example.demo.service;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cloud.client.ServiceInstance;
import org.springframework.cloud.client.loadbalancer.LoadBalancerClient;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
/**
 * 服务调用服务
 */
@Slf4j
@Service
public class UserService {
    private final RestTemplate restTemplate;
    private final LoadBalancerClient loadBalancerClient;
    public UserService(RestTemplate restTemplate, LoadBalancerClient loadBalancerClient) {
        this.restTemplate = restTemplate;
        this.loadBalancerClient = loadBalancerClient;
    }
    /**
     * 调用用户服务
     */
    public String getUserInfo(Long userId) {
        // 使用负载均衡选择一个实例
        ServiceInstance instance = loadBalancerClient.choose("user-service");
        if (instance == null) {
            throw new RuntimeException("找不到user-service实例");
        }
        // 构建服务URL
        String url = String.format("http://%s:%d/api/user/%d", 
            instance.getHost(), instance.getPort(), userId);
        log.info("调用服务: {}", url);
        // 调用服务
        ResponseEntity<String> response = restTemplate.getForEntity(url, String.class);
        return response.getBody();
    }
}
```

### 使用OpenFeign调用服务

OpenFeign更简单,声明式调用:

```java
package com.example.demo.feign;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
/**
 * 用户服务Feign客户端
 */
@FeignClient(name = "user-service")  // 服务名
public interface UserFeignClient {
    /**
     * 获取用户信息
     */
    @GetMapping("/api/user/{id}")
    String getUserInfo(@PathVariable("id") Long id);
}
// 使用Feign客户端
package com.example.demo.controller;
import com.example.demo.feign.UserFeignClient;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
@Slf4j
@RestController
@RequestMapping("/api")
public class UserController {
    private final UserFeignClient userFeignClient;
    public UserController(UserFeignClient userFeignClient) {
        this.userFeignClient = userFeignClient;
    }
    @GetMapping("/user/{id}")
    public String getUserInfo(@PathVariable Long id) {
        return userFeignClient.getUserInfo(id);  // 直接调用,Feign会自动负载均衡
    }
}
```

## 场景二: 配置管理

### 应用场景

配置需要集中管理,而且配置变更后要实时推送到应用,不用重启服务。

### 在Nacos控制台添加配置

1. 登录Nacos控制台: http://localhost:8848/nacos
2. 进入"配置管理"->"配置列表"
3. 点击"+"按钮,添加配置:

- Data ID: `spring-boot-nacos-demo.yml` (格式: `应用名.扩展名`)
- Group: `DEFAULT_GROUP`
- 配置格式: `YAML`
- 配置内容:

```yaml
app:
  name: spring-boot-nacos-demo
  version: 1.0.0
database:
  url: jdbc:mysql://localhost:3306/demo
  username: root
  password: 123456
redis:
  host: localhost
  port: 6379
```

### 读取配置

使用`@Value`或`@ConfigurationProperties`读取配置:

```java
package com.example.demo.config;
import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.cloud.context.config.annotation.RefreshScope;
import org.springframework.stereotype.Component;
/**
 * 应用配置类
 * @RefreshScope注解支持动态刷新
 */
@Data
@Component
@RefreshScope  // 支持配置动态刷新
@ConfigurationProperties(prefix = "app")
public class AppConfig {
    private String name;
    private String version;
}
// 使用配置
package com.example.demo.controller;
import com.example.demo.config.AppConfig;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.context.config.annotation.RefreshScope;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
/**
 * 配置测试控制器
 */
@Slf4j
@RestController
@RequestMapping("/config")
@RefreshScope  // 支持配置动态刷新
public class ConfigController {
    private final AppConfig appConfig;
    // 使用@Value读取配置
    @Value("${app.name:默认值}")
    private String appName;
    @Value("${database.url:}")
    private String databaseUrl;
    public ConfigController(AppConfig appConfig) {
        this.appConfig = appConfig;
    }
    /**
     * 获取应用配置
     */
    @GetMapping("/app")
    public AppConfig getAppConfig() {
        log.info("应用配置: {}", appConfig);
        return appConfig;
    }
    /**
     * 获取数据库配置
     */
    @GetMapping("/database")
    public String getDatabaseConfig() {
        log.info("数据库URL: {}", databaseUrl);
        return databaseUrl;
    }
}
```

### 配置动态刷新

配置变更后,应用会自动刷新配置(如果配置了`refresh-enabled: true`),不需要重启服务。

你也可以手动触发刷新:

```java
package com.example.demo.controller;
import org.springframework.cloud.context.refresh.ContextRefresher;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
/**
 * 配置刷新控制器
 */
@RestController
@RequestMapping("/config")
public class ConfigRefreshController {
    private final ContextRefresher contextRefresher;
    public ConfigRefreshController(ContextRefresher contextRefresher) {
        this.contextRefresher = contextRefresher;
    }
    /**
     * 手动刷新配置
     */
    @PostMapping("/refresh")
    public String refresh() {
        contextRefresher.refresh();  // 刷新配置
        return "配置刷新成功";
    }
}
```

## 场景三: 命名空间和分组管理

### 应用场景

多环境部署(开发、测试、生产),不同环境需要隔离配置和服务。

### 命名空间配置

```yaml
spring:
  cloud:
    nacos:
      discovery:
        namespace: dev  # 开发环境命名空间
      config:
        namespace: dev  # 开发环境命名空间
```

### 分组配置

```yaml
spring:
  cloud:
    nacos:
      discovery:
        group: DEFAULT_GROUP  # 分组
      config:
        group: DEFAULT_GROUP  # 分组
```

### 多环境配置示例

```yaml
# bootstrap-dev.yml (开发环境)
spring:
  cloud:
    nacos:
      discovery:
        namespace: dev
        group: DEV_GROUP
      config:
        namespace: dev
        group: DEV_GROUP
# bootstrap-test.yml (测试环境)
spring:
  cloud:
    nacos:
      discovery:
        namespace: test
        group: TEST_GROUP
      config:
        namespace: test
        group: TEST_GROUP
# bootstrap-prod.yml (生产环境)
spring:
  cloud:
    nacos:
      discovery:
        namespace: prod
        group: PROD_GROUP
      config:
        namespace: prod
        group: PROD_GROUP
```

## 场景四: 共享配置和扩展配置

### 应用场景

多个服务共享相同的配置(如数据库连接、Redis配置),避免重复配置。

### 共享配置配置

```yaml
spring:
  cloud:
    nacos:
      config:
        shared-configs:  # 共享配置列表
          - data-id: common-datasource.yml  # 共享数据源配置
            group: SHARED_GROUP
            refresh: true  # 是否动态刷新
          - data-id: common-redis.yml  # 共享Redis配置
            group: SHARED_GROUP
            refresh: true
```

### 扩展配置配置

```yaml
spring:
  cloud:
    nacos:
      config:
        extension-configs:  # 扩展配置列表
          - data-id: ext-config.yml
            group: EXT_GROUP
            refresh: true
```

## 场景五: 服务元数据和权重配置

### 应用场景

服务需要携带版本、环境等元数据信息,而且需要根据权重进行负载均衡。

### 元数据配置

```yaml
spring:
  cloud:
    nacos:
      discovery:
        metadata:
          version: 1.0.0  # 版本
          env: dev  # 环境
          region: beijing  # 区域
```

### 权重配置

```yaml
spring:
  cloud:
    nacos:
      discovery:
        weight: 0.8  # 权重,范围0-1,默认1.0
```

权重高的实例会被优先选择,适合灰度发布场景。

## 场景六: 集群配置

### 应用场景

服务需要部署到不同的集群,实现集群隔离。

### 集群配置

```yaml
spring:
  cloud:
    nacos:
      discovery:
        cluster-name: cluster-beijing  # 集群名称
```

### 集群选择

```java
package com.example.demo.config;
import com.alibaba.cloud.nacos.ribbon.NacosRule;
import com.netflix.loadbalancer.IRule;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
/**
 * 负载均衡配置
 */
@Configuration
public class RibbonConfig {
    /**
     * 使用NacosRule实现集群优先
     */
    @Bean
    public IRule nacosRule() {
        return new NacosRule();  // 优先选择同集群的实例
    }
}
```

## 最佳实践和注意事项

### 1. 配置优先级

配置的优先级从高到低:

1. Nacos配置(动态配置)
2. bootstrap.yml
3. application.yml
4. 默认配置

### 2. 配置命名规范

- Data ID格式: `应用名-环境.扩展名`,如`user-service-dev.yml`
- Group: 使用有意义的名称,如`DEV_GROUP`、`PROD_GROUP`
- 命名空间: 按环境划分,如`dev`、`test`、`prod`

### 3. 服务发现最佳实践

- 服务名使用小写字母和连字符,如`user-service`
- 合理设置服务权重,实现灰度发布
- 使用元数据标记服务版本和环境
- 配置合理的健康检查间隔

### 4. 配置管理最佳实践

- 敏感配置(密码、密钥)不要放在Nacos,使用加密配置或密钥管理服务
- 配置变更要有审核流程,避免误操作
- 重要配置变更前先备份
- 使用命名空间隔离不同环境

### 5. 性能优化

- 生产环境使用Nacos集群,提高可用性
- 合理设置配置监听超时时间
- 避免配置过多导致启动慢
- 使用共享配置减少重复配置

### 6. 监控和告警

- 监控Nacos服务器状态
- 监控服务注册和发现情况
- 配置变更要有日志记录
- 服务实例异常要有告警

## 总结

Spring Boot 4整合Nacos其实挺简单的,主要就这几步:

1. 添加Nacos依赖(`nacos-discovery`和`nacos-config`)
2. 配置Nacos服务器地址和命名空间
3. 使用`@EnableDiscoveryClient`启用服务发现
4. 在Nacos控制台添加配置
5. 使用`@RefreshScope`支持配置动态刷新

Nacos最大的优势就是功能全面,服务发现和配置管理一应俱全,而且配置变更实时推送,不用重启服务;相比Eureka,Nacos更现代、更强大,是微服务项目首选的注册中心和配置中心;实际项目中根据需求选择就行,别想太复杂,先用起来再说。
