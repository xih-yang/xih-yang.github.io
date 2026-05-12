# 23、SpringCloud Alibaba - nacos 配置中心的使用
- 来源：https://ddkk.com/zhuanlan/j2ee/springcloudalibaba/3/23.html
- 分类：J2EE框架
- 分组：Spring Cloud Alibaba 教程
## 前言

在系统开发、测试、部署的过程中，在不同的环境会使用不同的配置信息，都会出现一些配置信息的变更，Nacos可以作为配置中心，用来存储和管理配置信息。

## 一、环境

**1、** 引入依赖；

```xml
<dependency>
	<groupId>com.alibaba.cloud</groupId>
	<artifactId>spring-cloud-starter-alibaba-nacos-config</artifactId>
	<version>2021.1</version>
</dependency>
<!-- https://mvnrepository.com/artifact/org.springframework.cloud/spring-cloud-starter-bootstrap -->
<dependency>
	<groupId>org.springframework.cloud</groupId>
	<artifactId>spring-cloud-starter-bootstrap</artifactId>
	<version>3.1.1</version>
</dependency>
```

**2、** 配置文件；

将配置文件内容挪至bootstrap.properties中，

并添加：

spring.cloud.nacos.config.server-addr=172.16.10.159:8848

**3、** nacos服务端配置；

创建与spring.application.name 相同名字的dataId

并填入一些配置项

```java
app.name=app1
app.version=1.0
```

然后点击发布配置。

## 二、测试

添加注解@RefreshScope来实现配置项的动态刷新

### 1、使用 @RefreshScope + @Value

1、NacosController

```java
@RestController
@RequestMapping("/nacos")
@RefreshScope
public class NacosController {
    @Value("${app.name}")
    private String appName;
    @Value("${app.version}")
    private String appVersion;
    @PostConstruct
    public void init() {
        System.out.println("init, appName: " + appName + ",appVersion: " + appVersion);
    }
    @GetMapping("/appInfo")
    public Object getAppInfo() {
        String appInfo = "getAppInfo, appName: " + appName + ",appVersion: " + appVersion;
        System.out.println(appInfo);
        return appInfo;
    }
    @PreDestroy
    public void destroy() {
        System.out.println("destory, appName: " + appName + ",appVersion: " + appVersion);
    }
```

2、系统启动过程中会进入init方法，打印出

```java
init, appName: app1,appVersion: 1.0
```

3、访问 /appInfo 接口，打印出

```java
getAppInfo, appName: app1,appVersion: 1.0
```

4、修改nacos 服务端配置信息

将app.version修改为2.0，并发布，紧接着系统进入了destory方法，打印出

```java
destory, appName: app1,appVersion: 1.0
```

再次访问 /appInfo 接口，打印出

```java
init, appName: app1,appVersion: 2.0
getAppInfo, appName: app1,appVersion: 2.0
```

可以看出，重新初始化了bean NacosController，进入了init方法

### 2、使用 @RefreshScope + @ConfigurationProperties

1、AppConfig

```java
@Data
@ConfigurationProperties(prefix = "app")
public class AppConfig {
    private String name;
    private String version;
}
```

2、AppController

```java
@RestController
@RequestMapping("/app")
@RefreshScope
@EnableConfigurationProperties(AppConfig.class)
public class AppController {
    @Autowired
    private AppConfig appConfig;
    @PostConstruct
    public void init() {
        System.out.println("init, appName: " + appConfig.getName() + ",appVersion: " + appConfig.getVersion());
    }
    @GetMapping("/appInfo")
    public Object getAppInfo() {
        String appInfo = "getAppInfo, appName: " + appConfig.getName() + ",appVersion: " + appConfig.getVersion();
        System.out.println(appInfo);
        return appInfo;
    }
    @PreDestroy
    public void destroy() {
        System.out.println("destory, appName: " + appConfig.getName() + ",appVersion: " + appConfig.getVersion());
    }
}
```

经过测试，测试过程和测试结果跟上面都一样。
