# 10、Spring Cloud Config Native 模式
- 来源：https://ddkk.com/zhuanlan/config/springcloudconfig/10.html
- 分类：配置中心
- 分组：教程目录
## 背景说明

由于很多时候，生产环境没有git，也没有svn等等，所以需要使用native模式，鉴于网上缺少相关的资料，因此以此为切入点，记录一下native模式下Spring Cloud Config一些常用的功能

## config-server配置

**1、** 首先，老套路引入pom；

```xml
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-config-server</artifactId>
</dependency>
```

**1、** bootstrap.yml配置本地存储[官方文档在此](https://cloud.spring.io/spring-cloud-config/multi/multi__embedding_the_config_server.html)；

- spring.profiles.active=composite，他是一个list，我们这里面因为是本地，添加一条type=native，并配上search-locations，这个属性可以用class-path，也可以用绝对路径，但是正常情况下，建议用绝对路径，因为配置文件会有改动，如果放在项目里面，改动起来比较麻烦。
- 还要设置pring.cloud.config.server.bootstrap=true
- config文件夹下，我放了三个文件config-info-dev.yml，config-info-test.yml，config-info-prod.yml,里面存放了不通内容，主要就为了测试

```sh
server:
    port: 8001
spring:
  application:
    name: config-server-1
  profiles:
    active: composite
  cloud:
    config:
      server:
        composite:
          - type: native
          	# 文件存放的绝对路径，源码里面我用绝对路径的方式放在了resources里面，这里需要改成自己的路径
            search-locations: file:///Users/sunhan/Downloads/config  
        bootstrap: true
```

**1、** 启动类；

```java
@SpringBootApplication
@EnableConfigServer
public class EurekaConfigApp {
    public static void main(String[] args) {
        SpringApplication.run(EurekaConfigApp.class, args);
    }
}
```

至此，config-server暂告一段路

## config-client配置

**1、** 继续，引入pom；

```xml
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-config-client</artifactId>
</dependency>
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-web</artifactId>
</dependency>
```

**1、** client添加了两个配置文件一个bootstrap.yml,官方文档也说了`Ifyouusethebootstrapflag,theconfigserverneedstohaveitsnameandrepositoryURIconfiguredinbootstrap.yml.`config的主要说明如下；

- uri: 就是config-server的请求路径
- profile、name：这里面的profile，如果没有默认值，会从spring.profiles.active里面获取，如果后者也没有那就是默认的了，他的作用是区分引用那个文件，比如配置文件config-info-dev.yml，name就是config-info，profile就是dev，还有一个label属性，官方解释是`The label name to use to pull remote configuration properties`，我的理解就是应该在git等远程仓库中会用的上，至少在文件匹配，profile和name够用了，附加一下name和profile的赋值源码

```java
/**
 * name的默认获取方式
 */
@Value("${spring.application.name:application}")
private String name;
/**
 * profile的默认获取方式
 */
public ConfigClientProperties(Environment environment) {
    String[] profiles = environment.getActiveProfiles();
    if (profiles.length == 0) {
        profiles = environment.getDefaultProfiles();
    }
    this.setProfile(StringUtils.arrayToCommaDelimitedString(profiles));
}
```

这里面展示一下config-client的bootstrap.yml

```sh
spring:
  cloud:
    config:
      uri: http://localhost:8001
      profile: prod
      name: config-info
```

还有一个就是spring-boot的application.yml文件

```sh
server:
  port: 8002
spring:
  application:
    name: config-info
  profiles:
  	# 这里主要是为了掩饰和config.profile的区分
    active: dev
```

最后，贴出来启动类

```java
@SpringBootApplication
public class ConfigClientApp1 implements CommandLineRunner {
    public static void main(String[] args) {
        SpringApplication.run(ConfigClientApp1.class, args);
    }
    @Value("${env}")
    private String env;
    @Value("${hello}")
    private String hello;
    public void run(String... args) {
        System.out.println("================");
        System.out.println(env);
        System.out.println(hello);
        System.out.println("================");
    }
}
```

输入结果

```java
================
prod1
dev
================
```

接下来，就要考虑刷新的问题了。手动刷新，亦或是整合Spring Cloud Bus热刷新，下次侃

## 项目源码

## 结束语

> 通过学习提高工作效率和质量，在学习中留点记录，方便日后回忆，记录之处过于随意，如有错误或不当之处，还请客官指正，相互学习！
>
> 参考书籍：重新定义springcloud实战

> 版权声明：「DDKK.COM 弟弟快看，程序员编程资料站」本站文章，版权归原作者所有
