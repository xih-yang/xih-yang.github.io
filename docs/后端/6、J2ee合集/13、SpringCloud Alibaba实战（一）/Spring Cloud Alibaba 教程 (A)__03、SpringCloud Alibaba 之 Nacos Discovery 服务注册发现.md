# 03、SpringCloud Alibaba 之 Nacos Discovery 服务注册发现
- 来源：https://ddkk.com/zhuanlan/j2ee/springcloudalibaba/1/3.html
- 分类：J2EE框架
- 分组：Spring Cloud Alibaba 教程 (A)
## 一、Nacos Discovery服务注册发现

### 1、服务提供者

**1、** 创建一个springboot模块springcloud-alibaba-1-nacos-discovery-provider；

**2、** 添加spring-cloud-starter-alibaba-nacos-discovery等依赖；

1、通过添加一个starter依赖：spring-cloud-starter-alibaba-nacos-discovery它通过自动配置、注解以及Spring Boot 编程模型与Nacos无缝集成，实现服务注册与发现

```xml
<!--spring-cloud-alibaba nacos服务注册/发现的依赖-->
<!--格式： spring-cloud-starter-[开源组织机构名字]-[项目模块名字]-->
<!--spring-cloud-starter-alibaba-sentinel-->
<dependency>
    <groupId>com.alibaba.cloud</groupId>
    <artifactId>spring-cloud-starter-alibaba-nacos-discovery</artifactId>
</dependency>
<!--spring-boot-starter-actuator-->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-actuator</artifactId>
</dependency>
```

2、Spring Cloud Alibaba 和 Spring Cloud，Spring Boot对应版本

在该工程的 pom.xml 中，我们通过 dependencyManagement 对 Spring Cloud Alibaba 的版本信息进行管理，该工程下的各个子模块在引入 Spring Cloud Alibaba 的各个组件时就不要单独指定版本号了

```xml
<properties>
        <java.version>1.8</java.version>
        <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
        <project.reporting.outputEncoding>UTF-8</project.reporting.outputEncoding>
        <spring-boot.version>2.3.12.RELEASE</spring-boot.version>
        <spring-cloud-alibaba.version>2.2.7.RELEASE</spring-cloud-alibaba.version>
</properties>
<!-- dependencyManagement标签 通常适用于多模块环境下定义一个top module来专门管理公共依赖的情况
在子项目中不写该依赖项，那么子项目仍然会从父项目depenManagement中继承该artifactId和groupId依赖项（全部继承）
若子项目 中dependencies中的dependency声明了version，则父项目中dependencyManagement中的声明无效
Spring Cloud、Spring Cloud Alibaba 以及 Spring Boot 之间版本依赖参考官网
https://github.com/alibaba/spring-cloud-alibaba/wiki/%E7%89%88%E6%9C%AC%E8%AF%B4%E6%98%8E
-->
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
```

完整POM文件如下

```xml
<modelVersion>4.0.0</modelVersion>
<groupId>com.company</groupId>
<artifactId>springcloud-alibaba-1-nacos-discovery-provider</artifactId>
<version>1.0.0</version>
<name>springcloud-alibaba-1-nacos-discovery-provider</name>
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
    <!--spring-cloud-alibaba nacos服务注册/发现的依赖-->
    <!--格式： spring-cloud-starter-[开源组织机构名字]-[项目模块名字]-->
    <!--spring-cloud-starter-alibaba-sentinel-->
    <dependency>
        <groupId>com.alibaba.cloud</groupId>
        <artifactId>spring-cloud-starter-alibaba-nacos-discovery</artifactId>
    </dependency>
    <!--spring-boot-starter-actuator-->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-actuator</artifactId>
    </dependency>
    <dependency>
        <groupId>com.company</groupId>
        <artifactId>springcloud-alibaba-1-commons</artifactId>
        <version>1.0.0</version>
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
    <!-- springboot 开发自动热部署 -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-devtools</artifactId>
        <optional>true</optional>
    </dependency>
    <!-- MySQL的jdbc驱动包 -->
    <dependency>
        <groupId>mysql</groupId>
        <artifactId>mysql-connector-java</artifactId>
    </dependency>
    <!--mybatis起步依赖-->
    <dependency>
        <groupId>org.mybatis.spring.boot</groupId>
        <artifactId>mybatis-spring-boot-starter</artifactId>
        <version>2.2.2</version>
    </dependency>
    <dependency>
        <groupId>org.projectlombok</groupId>
        <artifactId>lombok</artifactId>
    </dependency>
</dependencies>
<!-- dependencyManagement标签 通常适用于多模块环境下定义一个top module来专门管理公共依赖的情况
    在子项目中不写该依赖项，那么子项目仍然会从父项目depenManagement中继承该artifactId和groupId依赖项（全部继承）
    若子项目 中dependencies中的dependency声明了version，则父项目中dependencyManagement中的声明无效
    Spring Cloud、Spring Cloud Alibaba 以及 Spring Boot 之间版本依赖参考官网
    https://github.com/alibaba/spring-cloud-alibaba/wiki/%E7%89%88%E6%9C%AC%E8%AF%B4%E6%98%8E
-->
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
        <!--mybatis代码自动生成插件-->
        <plugin>
            <groupId>org.mybatis.generator</groupId>
            <artifactId>mybatis-generator-maven-plugin</artifactId>
            <version>1.4.0</version>
            <configuration>
                <!--配置文件的位置-->
                <configurationFile>src/main/resources/generatorConfig.xml</configurationFile>
                <!--生成代码过程中是否打印日志-->
                <verbose>true</verbose>
                <!--生成时是否覆盖java文件，xml文件总是合并-->
                <overwrite>true</overwrite>
            </configuration>
        </plugin>
    </plugins>
    <resources>
        <resource>
            <directory>src/main/java</directory>
            <includes>
                <include>**/*.xml</include>
            </includes>
        </resource>
        <resource>
            <directory>src/main/resources</directory>
            <includes>
                <include>**/*.*</include>
            </includes>
        </resource>
    </resources>
</build>
```

**3、** 在应用的/src/main/resources/application.properties(也可以是application.yaml)配置文件中配置NacosServer地址，如果不想使用Nacos作为您的服务注册与发现，可以将spring.cloud.nacos.discovery.enabled设置为false；

```bash
#内嵌的web服务器端口
server.port=9001
#服务名称
spring.application.name=springcloud-alibaba-1-nacos-discovery-provider
#设置mysql数据库连接信息
spring.datasource.url=jdbc:mysql://localhost:3306/springcloud?useUnicode=true&characterEncoding=UTF-8&serverTimezone=GMT%2B8
spring.datasource.username=root
spring.datasource.password=admin123456
#将Nacos设置为服务注册发现，默认为true
spring.cloud.nacos.discovery.enabled=true
#nacos注册中心的连接地址
spring.cloud.nacos.discovery.server-addr=192.168.133.129:8848
#nacos的用户名和密码
spring.cloud.nacos.username=nacos
spring.cloud.nacos.password=nacos
#spring boot actuator 监控和健康检查功能
management.endpoints.jmx.exposure.include=*
management.endpoints.web.exposure.include=*
management.endpoint.health.show-details=always
```

**4、** 在SpringBoot启动类加上**@EnableDiscoveryClient**注解；

```java
@EnableDiscoveryClient //开启服务注册与发现功能： classpath: META-INF/spring.factories文件
@SpringBootApplication
public class Alibaba1NacosDiscoveryProviderApplication {
    public static void main(String[] args) {
        SpringApplication.run(Alibaba1NacosDiscoveryProviderApplication.class, args);
    }
}
```

**5、** 编写controller测试类；

```java
@Slf4j
@RestController
public class EchoController {
    @GetMapping("/")
    public ResponseEntity index() {
        log.info("provider /");
        return new ResponseEntity("index", HttpStatus.OK);
    }
    @GetMapping("/divide")
    public String divide(@RequestParam Integer a, @RequestParam Integer b) {
        log.info("provider /divide");
        return String.valueOf(a / b);
    }
    @GetMapping("/notFound")
    public String notFound() {
        System.out.println("provider 1 .........");
        return "notFound";
    }
}
```

**6、** 启动Nacos服务，启动main类，在nacos服务台上查看服务；

点击详情查看

### 2、服务消费者

**1、** 新建服务消费者模块springcloud-alibaba-1-nacos-discovery-consumer；

**2、** 添加spring-cloud-starter-alibaba-nacos-discovery，spring-cloud-loadbalancer等；

依赖

```xml
<!--spring boot web依赖-->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-web</artifactId>
</dependency>
<!-- springboot官方依赖： spring-boot-starter-xxx-->
<!-- springboot非官方依赖：xxx-spring-boot-starter-->
<!--springcloud依赖：spring-cloud-starter-xxx -->
<!--spring-cloud-alibaba 服务注册发现-->
<dependency>
    <groupId>com.alibaba.cloud</groupId>
    <artifactId>spring-cloud-starter-alibaba-nacos-discovery</artifactId>
</dependency>
<!--spring-boot-starter-actuator-->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-actuator</artifactId>
</dependency>
<!--由于 Netflix Ribbon 进入停更维护阶段，因此新版本的 Nacos discovery 都已经移除了 Ribbon ，
    此时我们需要引入 loadbalancer 代替，才能调用服务提供者提供的服务
-->
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-loadbalancer</artifactId>
</dependency>
```

注：

> 由于Netflix Ribbon 在2020版 进入停更维护阶段，因此新版本的 Nacos discovery 都已经移除了 Ribbon ， 此时我们需要引入 loadbalancer 代替，才能调用服务提供者提供的服务

```xml
<groupId>com.company</groupId>
<artifactId>springcloud-alibaba-1-nacos-discovery-consumer</artifactId>
<version>1.0.0</version>
<name>springcloud-alibaba-1-nacos-discovery-consumer</name>
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
    <!-- springboot官方依赖： spring-boot-starter-xxx-->
    <!-- springboot非官方依赖：xxx-spring-boot-starter-->
    <!--springcloud依赖：spring-cloud-starter-xxx -->
    <!--spring-cloud-alibaba 服务注册发现-->
    <dependency>
        <groupId>com.alibaba.cloud</groupId>
        <artifactId>spring-cloud-starter-alibaba-nacos-discovery</artifactId>
    </dependency>
    <!--spring-boot-starter-actuator-->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-actuator</artifactId>
    </dependency>
    <!--由于 Netflix Ribbon 进入停更维护阶段，因此新版本的 Nacos discovery 都已经移除了 Ribbon ，
        此时我们需要引入 loadbalancer 代替，才能调用服务提供者提供的服务
    -->
    <dependency>
        <groupId>org.springframework.cloud</groupId>
        <artifactId>spring-cloud-loadbalancer</artifactId>
    </dependency>
    <dependency>
        <groupId>com.company</groupId>
        <artifactId>springcloud-alibaba-1-commons</artifactId>
        <version>1.0.0</version>
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
<!-- dependencyManagement标签 通常适用于多模块环境下定义一个top module来专门管理公共依赖的情况
    在子项目中不写该依赖项，那么子项目仍然会从父项目depenManagement中继承该artifactId和groupId依赖项（全部继承）
    若子项目 中dependencies中的dependency声明了version，则父项目中dependencyManagement中的声明无效
    Spring Cloud、Spring Cloud Alibaba 以及 Spring Boot 之间版本依赖参考官网
    https://github.com/alibaba/spring-cloud-alibaba/wiki/%E7%89%88%E6%9C%AC%E8%AF%B4%E6%98%8E
-->
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

**3、** 在应用的/src/main/resources/application.properties(也可以是application.yaml)配置文件中配置NacosServer地址，如果不想使用Nacos作为您的服务注册与发现，可以将spring.cloud.nacos.discovery.enabled设置为false；

```bash
#内嵌的web服务器端口
server.port=8081
#服务名称
spring.application.name=springcloud-alibaba-1-nacos-discovery-consumer
#将Nacos设置为服务注册发现，默认为true
spring.cloud.nacos.discovery.enabled=true
#nacos注册中心的连接地址
spring.cloud.nacos.discovery.server-addr=192.168.133.129:8848
#nacos的用户名和密码
spring.cloud.nacos.username=nacos
spring.cloud.nacos.password=nacos
#spring boot actuator 监控和健康检查功能
management.endpoints.jmx.exposure.include=*
management.endpoints.web.exposure.include=*
management.endpoint.health.show-details=always
#自定义配置，远程服务提供者的服务名
service.name=http://springcloud-alibaba-1-nacos-discovery-provider
#避免The bean 'springcloud-alibaba-1-nacos-discovery-provider.FeignClientSpecification' could not be registered. A bean with that name has already been defined and overriding is disabled.
spring.main.allow-bean-definition-overriding=true
```

注：

springboot bean覆盖注册的问题 **allowBeanDefinitionOverriding** 配置

项目引用三方jar包，需要对@Configuration配置类中的某个bean进行重写。过程中遇到了bean已被注册异常、以及新加的bean不加载

```bash
***************************
APPLICATION FAILED TO START
***************************
Description:
The bean 'springcloud-alibaba-1-nacos-discovery-provider.FeignClientSpecification' could not be registered. A bean with that name has already been defined and overriding is disabled.
Action:
Consider renaming one of the beans or enabling overriding by setting spring.main.allow-bean-definition-overriding=true
Disconnected from the target VM, address: '127.0.0.1:56743', transport: 'socket'
```

在项目中定义了两个 Feign 客户端 ，两个 Feign 客户端中配置的 value 值是一样的 导致在启动时报如上错误

设置spring.main.allow-bean-definition-overriding=true 即可

**4、** 在SpringBoot启动类加上**@EnableDiscoveryClient**注解；

```java
@EnableFeignClients //开启feign
@EnableDiscoveryClient //开启nacos服务注册与发现
@SpringBootApplication
public class Alibaba1NacosDiscoveryConsumerApplication {
    public static void main(String[] args) {
        SpringApplication.run(Alibaba1NacosDiscoveryConsumerApplication.class, args);
    }
}
```

**5、** 编写测试类controller；

```java
@RestController
public class TestController {
	@Autowired
	private LoadBalancerClient loadBalancerClient;
	@Autowired
	private RestTemplate restTemplate;
	//feign 的声明式调用
	@Autowired
	private EchoFeignService echoFeignService;
	@Autowired
	private DiscoveryClient discoveryClient;
	@GetMapping("/echo/{app}")
	public String echoAppName(@PathVariable("app") String app){
		//使用 LoadBalanceClient 和 RestTemplate 结合的方式来访问
		ServiceInstance serviceInstance = loadBalancerClient.choose("springcloud-alibaba-1-nacos-discovery-provider");
		//  http://192.168.0.104:18082/echo/{app}
		String url = String.format("http://%s:%s/echo/%s", serviceInstance.getHost(), serviceInstance.getPort(), app);
		System.out.println("request url:"+url);
		return restTemplate.getForObject(url, String.class);
	}
	@GetMapping("/notFound-feign")
	public String notFound() {
		return echoFeignService.notFound();
	}
	@GetMapping("/divide-feign")
	public String divide(@RequestParam Integer a, @RequestParam Integer b) {
		return echoFeignService.divide(a, b);
	}
	@GetMapping("/divide-feign2")
	public String divide(@RequestParam Integer a) {
		return echoFeignService.divide(a);
	}
	@GetMapping("/echo-feign/{str}")
	public String feign(@PathVariable String str) {
		return echoFeignService.echo(str);
	}
	@GetMapping("/services/{service}")
	public Object client(@PathVariable String service) {
		return discoveryClient.getInstances(service);
	}
	@GetMapping("/services")
	public Object services() {
		System.out.println(discoveryClient.description());
		System.out.println(discoveryClient.getOrder());
		return discoveryClient.getServices();
	}
}
```

```java
@Configuration
public class MyRibbonConfig {
//    @SentinelRestTemplate(/*blockHandler="blockA", blockHandlerClass= MyBlockHandlerClass.class*/ //限流
//            fallback="fallbackA", fallbackClass = MyBlockHandlerClass.class) // 降级
    @Bean
    @LoadBalanced //与 Ribbon 集成，并开启负载均衡功能
    public RestTemplate restTemplate() {
        return new RestTemplate();
    }
}
```

EchoFeignService

```java
@FeignClient(name = "springcloud-alibaba-1-nacos-discovery-provider",
        fallbackFactory = EchoFeignServiceFallbackFactory.class,
        configuration = FeignConfiguration.class)
public interface EchoFeignService {
    @GetMapping("/echo/hello")
    default String hello() {
        return "hello";
    }
    @GetMapping("/echo/{str}")
    String echo(@PathVariable("str") String str);
    @GetMapping("/divide")
    String divide(@RequestParam("a") Integer a, @RequestParam("b") Integer b);
    /**
     * feign声明的接口可以有默认实现， 就是可以不需要远程服务提供者实现，自己实现了
     *
     * @param a
     * @return
     */
    default String divide(Integer a) {
        System.out.println("consumer devide method......");
        return divide(a, 1);
    }
    // restTemplate.getForObject("http://springcloud-alibaba-1-nacos-discovery-provider/sleep", String.class);
    // @FeignClient(name = "springcloud-alibaba-1-nacos-discovery-provider")
    // http://springcloud-alibaba-1-nacos-discovery-provider/notFound
    @GetMapping("/notFound")
    String notFound();
}
```

```bash
EchoFeignServiceFallbackFactory
```

```java
public class EchoFeignServiceFallbackFactory implements FallbackFactory<EchoFeignService> {
    @Override
    public EchoFeignService create(Throwable throwable) {
        return new EchoFeignService() {
            @Override
            public String hello() {
                return "hello fall back" + throwable.getMessage();
            }
            @Override
            public String echo(@PathVariable("str") String str) {
                return "echo fallback" + throwable.getMessage();
            }
            @Override
            public String divide(@RequestParam Integer a, @RequestParam Integer b) {
                return "divide fallback" + throwable.getMessage();
            }
            @Override
            public String divide(Integer a) {
                return "divide fall back" + throwable.getMessage();
            }
            @Override
            public String notFound() {
                return "default feign invoke notFound fallback 999" + throwable.getMessage();
            }
        };
    }
}
```

```bash
FeignConfiguration
```

```java
public class FeignConfiguration {
    @Bean
    public EchoFeignServiceFallbackFactory echoFeignServiceFallbackFactory() {
        return new EchoFeignServiceFallbackFactory();
    }
}
```

**6、** 启动Nacos服务，启动main类，在nacos服务台上查看服务；

[http://localhost:8081/divide-feign?a=10&b=2](http://localhost:8081/divide-feign?a=10&b=2)

注：

**Nacos注册中心宕机，不影响已运行的提供者和消费者，消费者在本地缓存了提供者列表**
