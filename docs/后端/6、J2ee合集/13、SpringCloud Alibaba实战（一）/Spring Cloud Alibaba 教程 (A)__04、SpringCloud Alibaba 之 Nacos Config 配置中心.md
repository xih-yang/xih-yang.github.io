# 04、SpringCloud Alibaba 之 Nacos Config 配置中心
- 来源：https://ddkk.com/zhuanlan/j2ee/springcloudalibaba/1/4.html
- 分类：J2EE框架
- 分组：Spring Cloud Alibaba 教程 (A)
## Nacos Config配置中心

Nacos 可以被理解为 服务注册中心 和 配置中心的组合体，它可以替换 [Eureka](http://c.biancheng.net/springcloud/eureka.html) 作为服务注册中心，实现服务的注册与发现；还可以替换 [Spring Cloud Config](http://c.biancheng.net/springcloud/config.html) 作为配置中心，实现配置的动态刷新

Spring Cloud Alibaba Nacos config是在启动的bootstrap阶段，将配置加载到Spring环境中；

Spring Cloud Alibaba Nacos Config使用DataId和GROUP确定一个配置

**DataId 是以 .properties为扩展名（默认的文件扩展名方式就是.properties）**

**在运行时必须使用 bootstrap.properties配置文件配置nacos server地址，同时，spring.application.name值必须与Nacos中配置的Data Id匹配（除了.properties或者.yaml后缀）**

**DataId默认使用 `spring.application.name `配置跟文件扩展名结合（配置格式默认使用.properties）**

**GROUP 不配置默认使用 DEFAULT_GROUP**

### 1、Nacos控制台新建配置

**1、** 在nacos控制台，配置列表界面，点击新增配置；

**2、** 新建配置；

DataId默认使用 `spring.application.name `配置跟文件扩展名结合（配置格式默认使用.properties）

GROUP 不配置默认使用 DEFAULT_GROUP

配置内容编写内容，点击发布即可

### 2、新建Config服务模块

**1、** 新建一个模块springcloud-alibaba-1-nacos-config；

**2、** 添加spring-cloud-starter-alibaba-nacos-config等依赖；

```xml
<!--spring-cloud-alibaba 服务注册发现-->
<dependency>
    <groupId>com.alibaba.cloud</groupId>
    <artifactId>spring-cloud-starter-alibaba-nacos-discovery</artifactId>
</dependency>
<!--spring-cloud-alibaba nacos 配置中心-->
<dependency>
    <groupId>com.alibaba.cloud</groupId>
    <artifactId>spring-cloud-starter-alibaba-nacos-config</artifactId>
</dependency>
```

```xml
<groupId>com.company</groupId>
<artifactId>springcloud-alibaba-1-nacos-config</artifactId>
<version>0.0.1-SNAPSHOT</version>
<name>springcloud-alibaba-1-nacos-config</name>
<description>Demo project for Spring Boot</description>
<properties>
    <java.version>1.8</java.version>
    <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
    <project.reporting.outputEncoding>UTF-8</project.reporting.outputEncoding>
    <spring-boot.version>2.3.12.RELEASE</spring-boot.version>
    <spring-cloud-alibaba.version>2.2.7.RELEASE</spring-cloud-alibaba.version>
</properties>
<dependencies>
    <!--spring boot web依赖-->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-web</artifactId>
    </dependency>
    <!--spring-cloud-alibaba 服务注册发现-->
    <dependency>
        <groupId>com.alibaba.cloud</groupId>
        <artifactId>spring-cloud-starter-alibaba-nacos-discovery</artifactId>
    </dependency>
    <!--spring-cloud-alibaba nacos 配置中心-->
    <dependency>
        <groupId>com.alibaba.cloud</groupId>
        <artifactId>spring-cloud-starter-alibaba-nacos-config</artifactId>
    </dependency>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-test</artifactId>
        <scope>test</scope>
        <exclusions>
            <exclusion>
                <groupId>org.junit.vintage</groupId>
                <artifactId>junit-vintage-engine</artifactId>
            </exclusion>
        </exclusions>
    </dependency>
    <dependency>
        <groupId>org.projectlombok</groupId>
        <artifactId>lombok</artifactId>
    </dependency>
</dependencies>
<dependencyManagement>
    <dependencies>
        <dependency>
            <groupId>com.alibaba.cloud</groupId>
            <artifactId>spring-cloud-alibaba-dependencies</artifactId>
            <version>${spring-cloud-alibaba.version}</version>
            <type>pom</type>
            <scope>import</scope>
        </dependency>
        <!-- spring-cloud-dependencies -->
        <dependency>
            <groupId>org.springframework.cloud</groupId>
            <artifactId>spring-cloud-dependencies</artifactId>
            <version>Hoxton.SR12</version>
            <type>pom</type>
            <scope>import</scope>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-dependencies</artifactId>
            <version>${spring-boot.version}</version>
            <type>pom</type>
            <scope>import</scope>
        </dependency>
    </dependencies>
</dependencyManagement>
<build>
    <plugins>
        <plugin>
            <groupId>org.apache.maven.plugins</groupId>
            <artifactId>maven-compiler-plugin</artifactId>
            <configuration>
                <source>1.8</source>
                <target>1.8</target>
                <encoding>UTF-8</encoding>
            </configuration>
        </plugin>
        <plugin>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-maven-plugin</artifactId>
        </plugin>
    </plugins>
</build>
```

**3、** 添加配置文件bootstrap.properties；

```bash
#内嵌的web服务器端口
server.port=7070
#服务名称
spring.application.name=springcloud-alibaba-1-nacos-config
#将Nacos设置为服务注册发现，默认为true
spring.cloud.nacos.discovery.enabled=true
#nacos注册中心的连接地址
spring.cloud.nacos.discovery.server-addr=192.168.133.129:8848
#nacos的用户名和密码
spring.cloud.nacos.username=nacos
spring.cloud.nacos.password=nacos
#nacos配置中心的连接地址
#spring.cloud.nacos.config.server-addr配置的方式为,域名:port，如 Nacos的域名为nacos.com，监听的端口为80
#则spring.cloud.nacos.config.server-addr=nacos.com:80，注 80 端口不能省略
spring.cloud.nacos.config.server-addr=192.168.133.129:8848
```

**4、** 启动类中添加注解；

```java
@EnableDiscoveryClient  //开启nacos服务注册与发现
@SpringBootApplication
public class Alibaba1NacosConfigApplication {
    public static void main(String[] args) throws InterruptedException {
        ConfigurableApplicationContext applicationContext = SpringApplication.run(Alibaba1NacosConfigApplication.class, args);
        while(true) {
            //当动态配置刷新时，会更新到 Enviroment中，因此此处每隔 1000 秒从Enviroment中获取配置
            String userName = applicationContext.getEnvironment().getProperty("user.name");
            String userAge = applicationContext.getEnvironment().getProperty("user.age");
            System.out.println("user name : " + userName + "; age: " + userAge);
            //获取当前部署的环境
            String currentEnv = applicationContext.getEnvironment().getProperty("current.env");
            System.err.println("in [ "+currentEnv+" ] enviroment; "+"user name :" + userName + "; age: " + userAge);
            TimeUnit.SECONDS.sleep(1000);
        }
    }
}
```

**5、** 编写测试类测试；

```java
@RestController
public class ConfigController {
    @Value("${user.name:}")
    private String name;
    @Value("${user.age:}")
    private String age;
    @Autowired
    private MyProperties myProperties;
    @RequestMapping("/config")
    public String config() {
        return name + "--" + age;
    }
    @RequestMapping("/config2")
    public String config2() {
        return myProperties.getName() + "--" + myProperties.getAge();
    }
}
@Data //lombok
@Component
@ConfigurationProperties(prefix = "user")
public class MyProperties {
    private String name;
    private int age;
}
```

**6、** 启动测试，如下结果；

### 3、Nacos Config配置中心动态刷新

Nacos Config Starter 默认为所有获取数据成功的 Nacos 的配置项添加了监听功能，在监听到服务端配置发生变化时会实时触发 org.springframework.cloud.context.refresh.ContextRefresher的refresh 方法；

可以通过配置 **spring.cloud.nacos.config.refresh.enabled**=false 来关闭动态刷新

### 4、DataId为yaml扩展名配置方式

Nacos Config 除了支持.properties格式以外，也支持yaml格式

**1、** 在应用的bootstrap.properties配置文件中显式地声明DataId文件扩展名；bootstrap.properties文件配置如下：

```bash
#nacos配置文件的扩展后缀 .properties 或者 .yaml
spring.cloud.nacos.config.file-extension=yaml
```

**2、** 在Nacos的web管控台新增一个DataId为yaml扩展名的配置；

测试结果如下：

GROUP不配置默认使用DEFAULT_GROUP，可自定义 DEV_GROUP

```bash
#GROUP不配置默认使用DEFAULT_GROUP，可自定义 DEV_GROUP
spring.cloud.nacos.config.group=DEV_GROUP
```

### 5、profile多环境配置

spring-cloud-starter-alibaba-nacos-config 在加载配置的时候，不仅仅加载了以 dataid 为 ${spring.application.name}.${file-extension:properties} 为的基础配置，还加载了dataid为

${spring.application.name}-${profile}.${file-extension:properties} 的基础配置；

在日常开发中如果遇到多套环境下的不同配置，可以通过Spring提供的 ${spring.profiles.active} 配置项来激活使用某个配置文件

```bash
#激活使用哪一份配置，原来在springboot中代表：application-dev.properties
#现在在nacos config中代表： serviceName-test.propertoes
# ${spring.application.name}-${spring.profiles.active}.${file-extension}
spring.profiles.active=dev
```

${spring.profiles.active}当通过配置文件来指定时必须放在 bootstrap.properties文件中；

比如在Nacos上新增一个dataid为：nacos-config-dev.yaml的基础配置

在Nacos Server 中，配置的 dataId（即 Data ID）的完整格式如下：

```bash
${spring.application.name}-${spring.profiles.active}.${file-extension}
```

> dataId 格式中各参数说明如下：
>
> 1、${spring.application.name}：默认取值为微服务的服务名，即配置文件中 spring.application.name 的值，我们可以在配置文件中通过配置 spring.cloud.nacos.config.prefix 来指定
>
> 2、${spring.profiles.active}：表示当前环境对应的 Profile，例如 dev、test、prod 等。当没有指定环境的 Profile 时，其对应的连接符也将不存在， dataId 的格式变成 ${spring.application.name}.${file-extension}
>
> 3、${file-extension}：表示配置内容的数据格式，我们可以在配置文件中通过配置项 spring.cloud.nacos.config.file-extension 来配置，例如 properties 和 yaml

```bash
bootstrap.properties 配置文件
```

```bash
#内嵌的web服务器端口
server.port=7070
#服务名称
spring.application.name=springcloud-alibaba-1-nacos-config
#将Nacos设置为服务注册发现，默认为true
spring.cloud.nacos.discovery.enabled=true
#nacos注册中心的连接地址
spring.cloud.nacos.discovery.server-addr=192.168.133.129:8848
#nacos的用户名和密码
spring.cloud.nacos.username=nacos
spring.cloud.nacos.password=nacos
#是否开启配置的自动刷新，默认是true表示自动刷新
spring.cloud.nacos.config.refresh-enabled=true
#nacos配置中心的连接地址
#spring.cloud.nacos.config.server-addr配置的方式为,域名:port，如 Nacos的域名为nacos.com，监听的端口为80
#则spring.cloud.nacos.config.server-addr=nacos.com:80，注 80 端口不能省略
spring.cloud.nacos.config.server-addr=192.168.133.129:8848
#nacos配置文件的扩展后缀 .properties 或者 .yaml
spring.cloud.nacos.config.file-extension=yaml
#GROUP不配置默认使用DEFAULT_GROUP，可自定义 DEV_GROUP
spring.cloud.nacos.config.group=DEFAULT_GROUP
#激活使用哪一份配置，原来在springboot中代表：application-dev.properties
#现在在nacos config中代表： serviceName-test.propertoes
# ${spring.application.name}-${spring.profiles.active}.${file-extension:properties}
spring.profiles.active=dev
```

注：

**Nacos注册中心宕机，服务还可以读取到配置信息，客户端获取配置中心的配置信息以后，会将配置信息在本地存储一份**
