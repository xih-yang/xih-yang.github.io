# SpringCloud Zipkin 环境搭建
- 来源：https://ddkk.com/zhuanlan/linktrack/zipkin/13.html
- 分类：链路追踪
- 分组：分布式链路踪 SpringCloud 之 Zipkin
## 一、环境安装

下载一个 Zipkin 的jar包，直接cmd运行即可，浏览器访问9411端口web管理页面。

## 二、模拟链路调用

支付项目下订单需要调用调用订单接口，同时订单接口需要调用会员项目获取会员信息。

## 即调用链如下：

app-itmayiedu-pay ----> app-itmayiedu-order ----> app-itmayiedu-member

这三个都需要注册到eureka注册中心 运行端口8100

## 支付项目pom.xml

```xml
<parent>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-parent</artifactId>
    <version>2.0.1.RELEASE</version>
</parent>
<!-- 管理依赖 -->
<dependencyManagement>
    <dependencies>
        <dependency>
            <groupId>org.springframework.cloud</groupId>
            <artifactId>spring-cloud-dependencies</artifactId>
            <version>Finchley.M7</version>
            <type>pom</type>
            <scope>import</scope>
        </dependency>
    </dependencies>
</dependencyManagement>
<dependencies>
    <!-- SpringBoot整合Web组件 -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-web</artifactId>
    </dependency>
    <!-- SpringBoot整合eureka客户端 -->
    <dependency>
        <groupId>org.springframework.cloud</groupId>
        <artifactId>spring-cloud-starter-netflix-eureka-client</artifactId>
    </dependency>
    <!-- SpringCloud整合zipkin -->
    <dependency>
        <groupId>org.springframework.cloud</groupId>
        <artifactId>spring-cloud-starter-zipkin</artifactId>
    </dependency>
</dependencies>
<!-- 注意： 这里必须要添加， 否者各种依赖有问题 -->
<repositories>
    <repository>
        <id>spring-milestones</id>
        <name>Spring Milestones</name>
        <url>https://repo.spring.io/libs-milestone</url>
        <snapshots>
            <enabled>false</enabled>
        </snapshots>
    </repository>
</repositories>
```

## application.yml

```bash
###会员服务启动端口号
server:
  port: 8060
###服务名称(服务注册到eureka名称)  
spring:
    application:
        name: app-itmayiedu-pay
    zipkin:
        base-url: http://localhost:9411
    sleuth:
      sampler: 
          probability: 1样本采集量，默认为0.1，为了测试这里修改为1，正式环境一般使用默认值
###服务注册到eureka地址
eureka:
  client:
    service-url:
           defaultZone: http://localhost:8100/eureka
```

## 为了简单，启动类和控制器为同一个，项目上更需要分开

```java
@SpringBootApplication
@RestController
@EnableEurekaClient
public class PayController {
	@Autowired
	private RestTemplate restTemplate;
	@RequestMapping("/payOrder")
	public String payOrder() {
		String orderUrl = "http://app-itmayiedu-order/orderToMember";
		String reuslt = restTemplate.getForObject(orderUrl, String.class);
		return reuslt;
	}
	@Bean
	@LoadBalanced
	RestTemplate restTemplate() {
		return new RestTemplate();
	}
	public static void main(String[] args) {
		SpringApplication.run(PayController.class, args);
	}
}
```

订单项目和会员服务pom文件一样，application.yml也几乎一样，端口改下，应用名称改下

## 订单项目启动类

```java
@SpringBootApplication
@EnableEurekaClient
@RestController
public class EurekaOrderController {
	@Autowired
	private RestTemplate restTemplate;
	// springcloud 中使用那些技术实现调用服务接口 feign 或者rest
	@RequestMapping("/orderToMember")
	public String orderToMember() {
		String memberUrl = "http://app-itmayiedu-member/getMember";
		return restTemplate.getForObject(memberUrl, String.class);
	}
	// 默认rest方式开启 负载均衡功能 如果以app-itmayiedu-member名称进行调用服务接口的时候 必须
	@Bean
	@LoadBalanced
	RestTemplate restTemplate() {
		return new RestTemplate();
	}
	public static void main(String[] args) {
		SpringApplication.run(EurekaOrderController.class, args);
	}
}
```

## 会员项目启动类

```java
@SpringBootApplication
@EnableEurekaClient
@RestController
public class EurekaOrderController {
	@Autowired
	private RestTemplate restTemplate;
	// springcloud 中使用那些技术实现调用服务接口 feign 或者rest
	@RequestMapping("/orderToMember")
	public String orderToMember() {
		String memberUrl = "http://app-itmayiedu-member/getMember";
		return restTemplate.getForObject(memberUrl, String.class);
	}
	// 默认rest方式开启 负载均衡功能 如果以app-itmayiedu-member名称进行调用服务接口的时候 必须
	@Bean
	@LoadBalanced
	RestTemplate restTemplate() {
		return new RestTemplate();
	}
	public static void main(String[] args) {
		SpringApplication.run(EurekaOrderController.class, args);
	}
}
```

## 测试截图

## 启动完之后发现了服务名

调用链路和耗时以界面的形式显示出来。
