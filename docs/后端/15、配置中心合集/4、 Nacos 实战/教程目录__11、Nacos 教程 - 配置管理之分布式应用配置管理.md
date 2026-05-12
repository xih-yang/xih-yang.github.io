# 11、Nacos 教程 - 配置管理之分布式应用配置管理
- 来源：https://ddkk.com/zhuanlan/registered/nacos/1/11.html
- 分类：注册中心
- 分组：教程目录
## 前言

- 用户通过nacos server的控制台集中对多个服务的配置进行管理
- 各服务统一从nacos server中获取各自的配置，并监听配置的变化

代码已传至

Gitee:[https://gitee.com/lengcz/nacosconfig.git](https://gitee.com/lengcz/nacosconfig.git)

Github:[https://github.com/lengcz/nacosconfig.git](https://github.com/lengcz/nacosconfig.git)

## 分布式应用配置管理

### 1. 发布配置

在nacos发布配置，我们规划了两个服务service01，service02,并且想对这两个服务的配置进行集中维护。

在nacos中添加配置

对应的内容

```java
#service01.yaml
person:
    name: xiaowang from service01
```

```java
#service02.yaml
person:
    name: xiaoming from service02
```

### 2. 创建父工程

(1)新建一个maven工程

(2)引入依赖pom.xml，配置依赖管理和插件

```java
<!--配置依赖管理-->
<dependencyManagement>
    <dependencies>
        <dependency>
            <groupId>com.alibaba.cloud</groupId>
            <artifactId>spring-cloud-alibaba-dependencies</artifactId>
            <version>2.1.0.RELEASE</version>
            <type>pom</type>
            <scope>import</scope>
        </dependency>
        <!-- https://mvnrepository.com/artifact/org.springframework.cloud/spring-cloud-dependencies -->
        <dependency>
            <groupId>org.springframework.cloud</groupId>
            <artifactId>spring-cloud-dependencies</artifactId>
            <version>Greenwich.RELEASE</version>
            <type>pom</type>
            <scope>import</scope>
        </dependency>
        <!-- https://mvnrepository.com/artifact/org.springframework.boot/spring-boot-dependencies -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-dependencies</artifactId>
            <version>2.1.3.RELEASE</version>
            <type>pom</type>
            <scope>import</scope>
        </dependency>
    </dependencies>
</dependencyManagement>
<build>
    <!--配置插件-->
    <plugins>
        <plugin>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-maven-plugin</artifactId>
        </plugin>
    </plugins>
</build>
```

### 3. 微服务service01

(1)新建子工程service01

(2)引入依赖

```java
<dependency>
    <groupId>com.alibaba.cloud</groupId>
    <artifactId>spring-cloud-starter-alibaba-nacos-config</artifactId>
</dependency>
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-web</artifactId>
</dependency>
```

(3)在resources文件夹下配置bootstrap.yml文件

```java
server:
  port: 10001 启动端口
spring:
  application:
    name: service01
  cloud:
    nacos:
      config:
        server-addr: 127.0.0.1:8848  配置中心
        file-extension: yaml 文件扩展名,dataid的名称就是application.name+file-extension,即为service01.yaml
        namespace: 869a0c6d-267e-4aa1-96cb-552cb1632c72 开发环境dev的id(nacos命名空间下找dev对应的id)
        group: TEST_GROUP 测试组
```

(4)编写一个controller

```java
@RestController
public class HelloController {
    @Value("${person.name}")
    private String name;
    @GetMapping("/hello")
    public String hello(){
        //读取配置信息
        return name;
    }
}
```

(5)编写启动类

```java
package com.it2;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
@SpringBootApplication
public class Service01Bootstrap {
    public static void main(String[] args) {
        SpringApplication.run(Service01Bootstrap.class,args);
    }
}
```

(6)运行启动类，并访问controller，可以看到能获取到nacos的配置

### 4. 微服务service02

与service01同样，此处省略。

### 5. 支持配置的动态更新

在nacos后台修改了配置的内容

再次访问service01,发现内容并没有变化。

如何如何可以实时的获取配置呢?热更新

使用ConfigurableApplicationContext applicationContext来获取配置

```java
@RestController
public class HelloController {
    @Value("${person.name}")
    private String name;
    @Autowired
    ConfigurableApplicationContext applicationContext;
    @GetMapping("/hello")
    public String hello(){
        //读取配置信息
        return name+"--------"+applicationContext.getEnvironment().getProperty("person.name");
    }
}
```

(1)启动前的配置内容

```java
#service1.yaml
person:
    name: xiaowang from service01 before
```

(2)启动项目,并访问，两种方式获取的内容一致

(3)在nacos上修改配置文件

(4)(不重启服务)访问接口获取nacos里配置的person.name，发现ConfigurableApplicationContext 可以在不重启服务的情况下得到新的配置内容。

总结
@Value注解不能热更新内容

ConfigurableApplicationContext 支持热更新

通过上面的例子说明spring-cloud-starter-clibaba-nacos-config支持配置的动态更新

### 6. 自定义namespace和group配置

#### 支持自定义namespace的配置

在没有明确指定${spring.cloud.nacos.config.namespace}配置的情况下，默认使用nacos上的Public这个namespace。如果需要使用自定义的命名空间，可以通过如下配置实现:

```java
spring:
  cloud:
    nacos:
      config:
        namespace: 869a0c6d-267e-4aa1-96cb-552cb1632c72 namespace的id
```

> 注意:该配置必须放在bootstrap.ym或者bootstrap.propertiesl文件中。此外spring.cloud.nacos.config.namespace的值是namespace对应的id,id值可以在nacos的控制台获取。并且在添加配置时注意不要选择其它的namespace,否则将会导致读取不到正确的配置。

#### 支持自定义Group的配置

在没有明确指定${spring.cloud.nacos.config.group}配置的情况下，默认使用是DEFAULT_GROUP。如果需要自定义自己的group，可以通过一下配置来实现:

```java
spring:
  cloud:
    nacos:
      config:
        group: TEST_GROUP 测试组
```

> 注意:该配置必须放在bootstrap.yml或者bootstrap.properties文件中。并且在添加配置时group的值一定要和spring.cloud.nacos.config.group的配置一致。

### 7. 自定义扩展的Data Id配置

Spring Cloud Alibaba Nacos Config可支持自定义Data Id的配置。一个完整的的配置案例如下:

```java
server:
  port: 10002 启动端口
spring:
  application:
    name: service02
  cloud:
    nacos:
      config:
        server-addr: 127.0.0.1:8848  配置中心
        file-extension: yaml 文件扩展名,dataid的名称就是application.name+file-extension,即为service01.yaml
        namespace: 869a0c6d-267e-4aa1-96cb-552cb1632c72 开发环境dev的id(nacos命名空间下找dev对应的id)
        group: TEST_GROUP 测试组
# 扩展文件
# 1. Data Id在默认的组DEFAULT_GROUP,不支持配置的动态刷新
        ext-config[0]:
          data-id: ext-config01.properties
        ext-config[1]:
# 2. Data Id 不在默认的组,不支持动态刷新
          data-id: ext-config02.properties
          group: TEST2_GROUP
# 3. Data Id不在默认的组，支持动态刷新
        ext-config[2]:
          data-id: ext-config03.properties
          group: TEST3_GROUP
          refresh: true
```

在nacos后台配置了三个配置

三个扩展文件的内容分别如下

```java
config01.name=1
```

```java
config02.name=2
```

```java
config03.name=3
```

稍微修改代码

```java
@RestController
public class HelloController {
    @Value("${person.name}")
    private String name;
    @Autowired
    ConfigurableApplicationContext applicationContext;
    @GetMapping("/hello")
    public String hello(){
        System.out.println("=====================");
        System.out.println(applicationContext.getEnvironment().getProperty("config01.name"));
        System.out.println(applicationContext.getEnvironment().getProperty("config02.name"));
        System.out.println(applicationContext.getEnvironment().getProperty("config03.name"));
        return name;
    }
}
```

在项目启动后，此时分别将值改成11，22，33，打印输出结果，只有第三个显示33，表明了 refresh: true可以热刷新。

总结

- 通过spring.cloud.nacos.config.ext-config[n].data-id的配置方式来支持多个Data Id的配置，同时文件必须指定扩展名，支持properties和yaml,此扩展名与spring.cloiud.nacos.config.file-extension的配置对自定义扩展配置的Data Id文件扩展名没有关系。
- 通过spring.cloud.nacos.config.ext-config[n],group的配置方式自定义Data Id所在的分组，未指定的情况下默认是DEFAULT_GROUP
- 通过spring.cloud.nacos.ext-config[n].refresh的配置方式来控制该Data Id在配置变更时，是否支持应用中可动态刷新，感知到最新的配置值。默认为false,不支持热刷新。
- 通过自定义扩展的Data Id配置，既可以解决多个应用间配置共享的问题，又可以支持一个应用有多个配置。

### 8. 自定义共享的Data Id配置(不推荐)

为了更加清晰的在多个应用间配置共享的Data Id,你可以通过一下的方式来配置:

```java
server:
  port: 10001 启动端口
spring:
  application:
    name: service01
  cloud:
    nacos:
      config:
        server-addr: 127.0.0.1:8848  配置中心
        file-extension: yaml 文件扩展名,dataid的名称就是application.name+file-extension,即为service01.yaml
        namespace: 869a0c6d-267e-4aa1-96cb-552cb1632c72 开发环境dev的id(nacos命名空间下找dev对应的id)
        group: TEST_GROUP 测试组
#共享Data Id只支持DEFAULT_GROUP
        shared-dataids: ext-config01.properties,ext-config02.properties  共享的Data Id
        refreshable-dataids: ext-config01.properties  热刷新的Data Id
```

总结:

- 通过spring.cloud.nacos.config.shared-dataids来支持多个共享Data Id的配置，多个之间以逗号隔开。
- 通过spring.cloud.nacos.config.refreshable-dataids来支持哪些共享配置的Data Id在配置变化时，应用是否动态刷新，获取最新的值，多个Data Id之间以逗号隔开。如果没有生命，默认情况下所有共享配置的Data Id都不支持动态刷新。

> 通过spring.cloud.nacos.config.shared-dataids来支持多个共享配置的Data Id时，多个共享配置间的一个优先级的关系约定:按照配置出现的先后顺序，即后面的优先级高于前面。

### 9. 配置的优先级

Spring Cloud Alibaba Nacos Config 目前提供了三种配置能力从nacos拉取配置

- A 通过spring.cloud.nacos.config.shared-dataids支持多个共享Data Id的配置
- B 通过spring.cloud.nacos.ext-config[n].data-id的方式支持多个扩展Data Id的配置，多个Data Id同时配置时，优先级顺序:后面的配置覆盖前面，即后面优先级更高。
- C 通过内部相关规则(应用，扩展名)自动生成相关的Data Id配置

当三种方式共同存在时，优先级C > B >A

验证B：

分别在ext-config01.properties和ext-config02.properties配置内容name=01和name=02

然后输出name,可以看到ext-config02.properties的优先级高于ext-config01.properties

验证C> B

此时修改service02.yaml,增加name=service.yaml

同时运行输出name,输出的name为service02.yaml的配置内容，说明C>B

### 10. 完全关闭nacos配置

通过配置spring.cloud.nacos.config.enabled=false 来完全关闭Spring Cloud Nacos Config
