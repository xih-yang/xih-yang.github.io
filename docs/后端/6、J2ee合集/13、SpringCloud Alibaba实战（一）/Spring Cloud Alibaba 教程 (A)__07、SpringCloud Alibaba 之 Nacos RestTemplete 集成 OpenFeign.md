# 07、SpringCloud Alibaba 之 Nacos RestTemplete 集成 OpenFeign
- 来源：https://ddkk.com/zhuanlan/j2ee/springcloudalibaba/1/7.html
- 分类：J2EE框架
- 分组：Spring Cloud Alibaba 教程 (A)
## 一、RestTemplete

服务消费者去调用服务提供者提供的服务时，使用了一个极其方便的对象叫**RestTemplate**，我们通常使用RestTemplate中最简单的一个功能getForObject 发起了一个get请求去调用服务端的数据，同时，我们还通过配置@LoadBalanced注解开启客户端负载均衡

RestTemplate是基于Rest的请求方式，通常是有四种

GET请求 --查询数据

POST 请求 –添加数据

PUT请求 – 修改数据

DELETE 请求 –删除数据

### 1、RestTemplate 的GET请求

Get请求可以有两种方式：

（1）** getForEntity**

该方法返回一个 ResponseEntity对象，ResponseEntity是 Spring 对 HTTP 请求响应的封装，包括了几个重要的元素，比如响应码、contentType、 contentLength、响应消息体等

```java
//调用SpringCloud服务提供者提供的服务
ResponseEntity<String> responseEntity = restTemplate.getForEntity(serviceName + "/service/hello", String.class);
int statusCodeValue = responseEntity.getStatusCodeValue();
HttpStatus httpStatus = responseEntity.getStatusCode();
HttpHeaders httpHeaders = responseEntity.getHeaders();
String body = responseEntity.getBody();
System.out.println(statusCodeValue);
System.out.println(httpStatus);
System.out.println(httpHeaders);
System.out.println(body);
return responseEntity.getBody();
```

getForEntity 方法第一个参数为要调用的服务的地址，即服务提供者提供的 **/service/hello** 接口地址，注意这里是通过服务名调用而不是服务地址，如果改为服务地址就无法使用 Ribbon 实现客户端负载均衡

getForEntity方法第二个参数String.class表示希望返回的body类型是 String类型，也可以返回一个对象，如User对象；

```java
两个重载方法： 
public <T> ResponseEntity<T> getForEntity(String url, Class<T> responseType, Object... uriVariables) throws RestClientException 
如： 
restTemplate.getForEntity("http://01-SPRINGCLOUD-SERVICE-PROVIDER/service/hello?id= {1}&name={2}", String.class, "{1, '张三'}").getBody(); 
public <T> ResponseEntity<T> getForEntity(String url, Class<T> responseType, Map<String, ?> uriVariables) throws RestClientException 
如： 
Map<String, Object> paramMap =new ConcurrentHashMap<>(); 
paramMap.put("id", 1); 
paramMap.
put("name", "张三"); 
restTemplate.getForEntity("http://01-SPRINGCLOUD-SERVICE-PROVIDER/service/hello?id= {id}&name={name}", String.class, paramMap).getBody(); 
```

（2）** getForObject()**

getForObject()与 getForEntity 使用类似，getForObject是在getForEntity基础上进行了再次封装，可以将http的响应体body信息转化成指定的对象，方便开发

```java
<T> T getForObject(URI url, Class<T> responseType) throws RestClientException; 
<T> T getForObject(String url, Class<T> responseType, Object... uriVariables) throws 
RestClientException; 
<T> T getForObject(String url, Class<T> responseType, Map<String, ?> uriVariables) 
throws RestClientException; 
```

### 2、RestTemplate 的 POS****T请求

```java
restTemplate.postForObject() 
restTemplate.postForEntity() 
restTemplate.postForLocation()
```

### 3、RestTemplate 的 PUT****请求

```java
restTemplate.put(); 
```

### 4、RestTemplate 的 DELETE****请求

```java
restTemplate.delete(); 
```

## 二、OpenFeign

Feign 是 Netflix 公司开发的一个声明式的 REST 调用客户端，是一种声明式服务调用组件，它在 RestTemplate 的基础上做了进一步的封装。通过 Feign，我们只需要声明一个接口并通过注解进行简单的配置（类似于 Dao 接口上面的 Mapper 注解一样）即可实现对 HTTP 接口的绑定

### Github地址：

[https://github.com/OpenFeign/feign](https://github.com/OpenFeign/feign)

[https://github.com/OpenFeign/feign/releases](https://github.com/OpenFeign/feign/releases)

调用远程的restful风格的http接口 的组件，如：

HttpURLConnection（JDK） java.net.*

HttpClient（apache）

RestTemplate（Spring）

OkHttp（android）

Feign（Netflix）

### 1、Feign

Feign 是 Netflix 公司发布的一种实现负载均衡和服务调用的开源组件。Spring Cloud 将其与 Netflix 中的其他开源服务组件（例如 Eureka、Ribbon 以及 Hystrix 等）一起整合进 Spring Cloud Netflix 模块中，整合后全称为 Spring Cloud Netflix Feign。

Feign 支持多种注解，但 Feign 本身并不支持 Spring MVC 注解，**2019 年 Netflix 公司宣布 Feign 组件正式进入停更维护状态，于是 Spring 官方便推出了一个名为 OpenFeign 的组件作为 Feign 的替代方案**

### 2、OpenFeign

OpenFeign 全称 Spring Cloud OpenFeign，它是 Spring 官方推出的一种声明式服务调用与负载均衡组件，它的出现就是为了替代进入停更维护状态的 Feign。

**OpenFeign 是 Spring Cloud 对 Feign 的二次封装，它具有 Feign 的所有功能，并在 Feign 的基础上增加了对 Spring MVC 注解的支持，例如 @RequestMapping、@GetMapping 和 @PostMapping 等**

### 3、Feign与OpenFeign的区别

Feign 和 OpenFeign 都是 Spring Cloud 下的远程调用和负载均衡组件。

Feign 和 OpenFeign 作用一样，都可以实现服务的远程调用和负载均衡。

Feign 和 OpenFeign 都对 Ribbon 进行了集成，都利用 Ribbon 维护了可用服务清单，并通过 Ribbon 实现了客户端的负载均衡

Feign是Netflix公司开发的，是 Spring Cloud组件中一个轻量级RESTful的HTTP服务客户端，Feign内置了Ribbon，用来做客户端负载均衡，去调用服务注册中心的服务。Feign的使用方式是：使用Feign的注解定义接口，调用接口，就可以调用服务注册中心的服务

Feign的依赖

```xml
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-starter-feign</artifactId>
</dependency>
```

**2、** OpenFeign；

OpenFeign 是 Spring 官方推出的，是SpringCloud自己研发的。是Spring Cloud在Feign的基础上支持了SpringMVC的注解，如@RequestMapping等等。OpenFeign的@FeignClient可以解析SpringMVC的@RequestMapping注解下的接口，并通过动态代理的方式产生实现类，实现类中

OpenFeign的依赖

```xml
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-starter-openfeign</artifactId>
</dependency>　　
```

注：

**springcloud F 及F版本以上 springboot 2.0 以上基本上使用openfeign，openfeign 如果从框架结构上看就是2019年feign停更后出现版本，也可以说大多数新项目都用openfeign ，2018年以前的项目在使用feign**

### OpenFeign实现

**1、** 添加依赖；

```xml
<!--spring-cloud-starter-openfeign-->
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-starter-openfeign</artifactId>
</dependency>
```

**2、** 声明OpenFeign服务；

定义一个EchoService接口，通过@FeignClient 注解来指定服务名称，进而绑定服务，然后再通过SpringMVC中提供的注解来绑定服务提供者提供的接口

```java
@FeignClient(name = "springcloud-alibaba-1-nacos-discovery-provider")
public interface EchoFeignService {
    @GetMapping("/echo/hello")
    default String hello() {
        return "hello";
    }
}
```

绑定了一个springcloud-alibaba-1-nacos-discovery-provider 的服务提供者提供的/echo/hello接口

**3、** 在项目入口类上添加**@EnableFeignClients**注解表示开启SpringCloudFeign的支持功能；

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

**4、** 测试类Controller测试；

```java
public class EchoController {
    @Autowired
    private EchoFeignService echoService;
    /**
     * 使用feign进行调用
     * @return
     */
    @RequestMapping("/openfeign/test")
    public ResultObject openfeign() {
        //调用远程的一个controller, restful的调用
        return echoService.hello();
    }
}
```

**5、** 启动main方法启动类，输入localhost:8081/openfeign/test；

在Spring Cloud下，使用Feign也是直接可以实现负载均衡调用，定义一个有@FeignClient注解的接口，然后使用@RequestMapping注解到方法上映射远程的REST服务，此方法也是做好负载均衡配置的，底层也是采用Ribbon进行负载均衡；

application.properties/yml 配置文件中可根据需求加入如下配置

```bash
#开启饥饿加载，一启动就从注册中心获取服务进行缓存，默认是懒加载
ribbon.eager-load.enabled=true
#为哪些客户端开启饥饿加载，多个客户端使用逗号分隔（非必须）
ribbon.eager-load.clients=springcloud-alibaba-1-nacos-discovery-consumer
#配置feign的连接、读取超时时间
#feign.client.config.default.read-timeout=2
#feign.client.config.default.connect-timeout=2
#feign.client.config.default.logger-level=full
#配置要调用的某个具体服务提供者的超时时间
feign.client.config.29-nacos-discovery-provider.read-timeout=5000
feign.client.config.29-nacos-discovery-provider.connect-timeout=5000
#配置feign底层使用httpclient进行远程调用，默认feign也是httpclient
#feign的老版本，底层是采用的JDK的httpURLconnection发起远程调用，效率不如RestTemplete，现在新版本效率都差不多
feign.httpclient.enabled=true
feign.httpclient.max-connections=200
feign.httpclient.max-connections-per-route=50
```

### OpenFeign脱离Ribbon使用

浏览器输入，直接跳转百度网址

[http://localhost:8081/noribbon](http://localhost:8081/noribbon)

```java
@FeignClient(name = "baidu",
        url = "http://www.baidu.com")
public interface EchoFeignNoRibbonService {
    @GetMapping
    String baidu();
}
@Autowired
private EchoFeignNoRibbonService feignNoRibbonService;
@GetMapping("/noribbon")
public String noRibbon(){
    return feignNoRibbonService.baidu();
}
```
