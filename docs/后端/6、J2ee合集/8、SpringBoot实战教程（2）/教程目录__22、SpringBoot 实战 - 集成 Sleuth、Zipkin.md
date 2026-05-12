# 22、SpringBoot 实战 - 集成 Sleuth、Zipkin
- 来源：https://ddkk.com/zhuanlan/j2ee/springboot/5/22.html
- 分类：J2EE框架
- 分组：教程目录
## 一、简介

### 1.Sleuth

**官方文档：**[https://spring.io/projects/spring-cloud-sleuth](https://spring.io/projects/spring-cloud-sleuth)

**GitHub：**[https://github.com/spring-cloud/spring-cloud-sleuth](https://github.com/spring-cloud/spring-cloud-sleuth)

`Sleuth` 是一个分布式跟踪系统，用于跟踪应用程序中的请求和操作。它可以帮助我们了解应用程序的结构和性能，并定位问题的根本原因。`Sleuth` 可以与 `Zipkin` 等分布式跟踪系统配合使用，从而提供更全面的应用程序跟踪和分析功能。

Sleuth 在 Spring Boot 中提供了一个便捷的集成方式。它可以轻松地跟踪应用程序中的请求和操作，并将跟踪信息记录到日志文件中。这使得我们可以更轻松地了解应用程序的结构和性能，并快速定位问题的根本原因。

**Sleuth 核心概念：**

- trace：跟踪，一个 Trace 表示一个请求或操作的完整的调用链，从客户端发起请求开始，到服务端响应请求结束。
- span：跨度，一个 Span 表示一个请求或操作的一部分，它包含了一些有用的信息，如开始时间、结束时间、操作名称等。
- traceId：跟踪ID，一个 Trace ID 是一个唯一的标识符，它用于将一组 Span 关联在一起，形成一个完整的 Trace。
- spanId：跨度ID，一个 Span ID 是一个唯一的标识符，它用于标识一个 Span。

在Sleuth 中，每个请求或操作都会生成一个 Trace，并且每个 Trace 包含多个 Span。每个 Span 包含一个唯一的 Span ID，并与一个 Trace ID 相关联。通过 Trace ID 和 Span ID，我们可以将多个 Span 关联在一起，形成一个完整的 Trace。

### 2.Zipkin

**官方网站：**[https://zipkin.io/](https://zipkin.io/)

**官方文档：**[https://zipkin.io/pages/quickstart](https://zipkin.io/pages/quickstart)

**GitHub：**[https://github.com/openzipkin/zipkin](https://github.com/openzipkin/zipkin)

`Zipkin` 是一个分布式流程跟踪系统。可以用来收集请求时间数据，从而解决服务体系结构中的延迟问题。功能包括数据收集和数据查看。

**Zipkin 核心概念：**

- Annotation：用于定位一个请求的开始和结束，主要包含 cs/cf/ss/sf 四个时间点。当这个 Annotation 被记录了，这个 PRC 也被认为完成了。四个时间点按顺序发生：
- `cs`：Client Start，表示客户端发起请求，一个 Span 的开始。
- `ss`：Service Start，表示服务端收到请求。
- `cf`：Client Finish，表示客户端获取到服务端的返回信息，一个 Span 的结束。
- `sf`：Service Finish，表示服务端完成处理，并将结果发送给客户端。
- ss-cs=网络延迟时间
- sf-ss=逻辑处理时间
- cf-cs=整个流程时间
- Collector：接收或收集各个应用传输的数据，跟踪一个 HTTP 请求的工作流程：

**1、** 把当前调用链的`trace`信息添加到HTTPHeader里面；

**2、** 记录当前调用的时间戳；

**3、** 发送HTTP请求，把`trace`相关的header信息携带上；

**4、** 调用结束之后，记录当前调用花费的时间；

**5、** 然后把上面流程产生的信息汇集成一个`span`，把span信息上传到zipkin的Collector模块；

**6、** 下一个HTTP请求继续从第一步开始；

**Zipkin 使用流程：**

如果日志文件中有 `traceId`，则可以直接跳转到具体位置。或者，我们可以根据服务名称、操作名称、标签和持续时间等属性进行查询。Zipkin 可以帮我们汇总一些有用的数据，例如：在服务中花费的时间百分比，以及操作是否失败等。如下所示：

Zipkin 的 `UI` 还提供了一个`依赖关系图`，显示通过每个应用程序跟踪的请求书。有助于我们识别聚合行为，包括错误路径或对已弃用服务的调用。

使用Zipkin 来查看数据，就需要应用向 Zipkin 发送数据。目前最流行的方法是通过 HTTP 或 Kafka，其他还可以使用例如 Apache ActiveMQ、gRPC 和 RabbitMQ等。提供给 Zipkin UI 的数据会存储在内存中，或者可以使用支持的后端（如 Apache Cassadra 或 Elasticsearch）来永久存储。

## 二、搭建 zipkin-server

`zipkin-server` 是 Zipkin 的服务端，集成了 UI 界面来进行查看。zipkin-server 可以自己去官网下载已有的独立 jar 包，或者 docker 镜像进行使用：

### 1.jar包启动

- **jar包下载地址：**[https://repo1.maven.org/maven2/io/zipkin/zipkin-server/](https://repo1.maven.org/maven2/io/zipkin/zipkin-server/)

或者可以直接执行以下命令来下载最新版本 jar 包：

```java
# 下载zipkin.jar
curl -sSL https://zipkin.io/quickstart.sh | bash -s
# 启动zipkin.jar
java -jar zipkin.jar
```

命令执行截图：

### 2.docker启动

**docker 镜像地址：**[https://hub.docker.com/r/openzipkin/zipkin](https://hub.docker.com/r/openzipkin/zipkin)

执行以下命令来拉取最新镜像：

```java
# 拉取镜像
docker pull openzipkin/zipkin
# 启动镜像
docker run -d -p 9411:9411 openzipkin/zipkin
```

下面主要说下我们自己搭建的过程。

### 3.自己搭建

注意：**SpringBoot 2.2.x 以后的版本，不再支持自己搭建服务**，之前是通过 @EnableZipkinServer 注解，现在这个注解不起作用了。所以 SpringBoot 2.2.x 以后的版本只能使用 jar 包或 docker 来启动。

SpringBoot 2.1.x 及以下的版本可以通过以下方式自己搭建：

#### Maven依赖

```xml
<!-- zipkin-server -->
<dependency>
    <groupId>io.zipkin.java</groupId>
    <artifactId>zipkin-server</artifactId>
    <version>${zipkin.server.version}</version>
</dependency>
<dependency>
    <groupId>io.zipkin.java</groupId>
    <artifactId>zipkin-autoconfigure-ui</artifactId>
    <version>${zipkin.server.version}</version>
</dependency>
```

#### 添加启动类注解

```java
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import zipkin2.server.internal.EnableZipkinServer;
@EnableZipkinServer
@SpringBootApplication
public class ZipkinServerApplication {
    public static void main(String[] args) {
        // 启动应用
        SpringApplication.run(ZipkinServerApplication.class, args);
    }
}
```

`SpringBoot 2.2.x` 以后的版本，启动会报错 `zipkin2.server.internal.ZipkinHealthIndicator.(ZipkinHealthIndicator.java:26)`

完整报错信息如下：

```java
Error starting ApplicationContext. To display the conditions report re-run your application with 'debug' enabled.
2023-07-24 16:13:59.158 ERROR 4976 --- [           main] o.s.b.d.LoggingFailureAnalysisReporter   : 
***************************
APPLICATION FAILED TO START
***************************
Description:
An attempt was made to call a method that does not exist. The attempt was made from the following location:
    zipkin2.server.internal.ZipkinHealthIndicator.<init>(ZipkinHealthIndicator.java:26)
The following method did not exist:
    org.springframework.boot.actuate.health.CompositeHealthIndicator.<init>(Lorg/springframework/boot/actuate/health/HealthAggregator;)V
The method's class, org.springframework.boot.actuate.health.CompositeHealthIndicator, is available from the following locations:
    jar:file:/D:/maven_repository/org/springframework/boot/spring-boot-actuator/2.2.13.RELEASE/spring-boot-actuator-2.2.13.RELEASE.jar!/org/springframework/boot/actuate/health/CompositeHealthIndicator.class
It was loaded from the following location:
    file:/D:/maven_repository/org/springframework/boot/spring-boot-actuator/2.2.13.RELEASE/spring-boot-actuator-2.2.13.RELEASE.jar
Action:
Correct the classpath of your application so that it contains a single, compatible version of org.springframework.boot.actuate.health.CompositeHealthIndicator
Disconnected from the target VM, address: '127.0.0.1:50399', transport: 'socket'
Process finished with exit code 1
```

### 4.页面截图

注意：默认页面上的数据是存放在内存里的，重启就会消失，如果需要持久化，可以放到 `ES` 或者 `数据库` 中。

**启动页面：**

**zipkin-server 页面：** http://localhost:9411

## 三、搭建 sleuth-zipkin

### 1.Maven 依赖

```xml
<!-- Sleuth -->
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-starter-sleuth</artifactId>
</dependency>
<!-- Zipkin -->
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-sleuth-zipkin</artifactId>
</dependency>
```

### 2.yaml配置

```java
server:
  port: 8081
spring:
  application:
    name: sleuth-feign-a
  zipkin:
    zipkin-server地址
    base-url: http://localhost:9411/
  sleuth:
    sampler:
      采样比例，0-1 之间，1 表示全部采集
      probability: 1.0
# 用于打印更多 sleuth 日志
#logging:
#  level:
#    org.springframework.cloud.sleuth: DEBUG
```

### 3.代码实现

这里我们搭建了两个服务：`sleuth-feign-a`、`sleuth-feign-b`。由服务a调用服务b，完成链路调用。

#### DemoController.java

```java
import com.demo.common.Result;
import com.demo.feign.DemoFeignClient;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
@Slf4j
@RestController
@RequestMapping("/demo")
public class DemoController {
    @Value("${server.port:}")
    private String port;
    @Autowired
    private DemoFeignClient demoFeignClient;
    @GetMapping("/test")
    public Result<Object> test() {
        String data = "This is a test! port:" + port;
        log.info(">>>>>>>>>> 【INFO】data:{}", data);
        return Result.succeed().setData(data);
    }
    @GetMapping("/feignTest")
    public Result<Object> feignTest() {
        return demoFeignClient.test();
    }
}
```

#### DemoFeignClient.java

```java
import com.demo.common.Result;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
@FeignClient(value = "sleuth-feign-b")
public interface DemoFeignClient {
    @GetMapping("/demo/test")
    Result<Object> test();
}
```

### 4.测试

服务启动后，请求地址：http://localhost:8081/demo/feignTest

重新访问 zipkin-server 地址：http://localhost:9411

#### sleuth 日志格式

sleuth 默认日志格式为：

```java
[微服务 Id,TraceId,SpanId,isExport]
```

- 微服务ID：说明日志是由哪个微服务产生的。
- Trade ID：每次请求产生的全局唯一ID，同一次请求的服务之间调用使用相同的 traceId。
- Span ID：一个 traceId 中的不同服务之间使用不同的 spanId。
- 导出标识：当前这个日志是否被导出，该值为 true 的时候说明当前请求产生的数据允许被其他链路追踪可视化服务收集展示。

我们利用日志中的 `traceId` 和 `spanId` 均可进行定位到该次请求：

## 四、踩坑记录

### 1.引入 spring-cloud-sleuth-zipkin 后，项目启动卡住

**问题描述：**

引入spring-cloud-sleuth-zipkin 后，SpringBoot项目启动的时候会卡住，卡在 `io.lettuce.core.KqueueProvider Starting without optional kqueue library`。

**新引入的Maven依赖：**

```xml
<!-- Zipkin -->
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-sleuth-zipkin</artifactId>
</dependency>
```

**启动日志截图：**

**日志文本：**

```java
2023-07-27 10:17:42.506 [,] INFO [main] com.baomidou.mybatisplus.extension.spring.MybatisSqlSessionFactoryBean  _ _   |_  _ _|_. ___ _ |    _ 
2023-07-27 10:17:42.506 [,] INFO [main] com.baomidou.mybatisplus.extension.spring.MybatisSqlSessionFactoryBean | | |\/|_)(_| | |_\  |_)||_|_\ 
2023-07-27 10:17:42.506 [,] INFO [main] com.baomidou.mybatisplus.extension.spring.MybatisSqlSessionFactoryBean      /               |         
2023-07-27 10:17:42.507 [,] INFO [main] com.baomidou.mybatisplus.extension.spring.MybatisSqlSessionFactoryBean                         3.4.1 
2023-07-27 10:17:43.406 [,] INFO [main] org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor Initializing ExecutorService
2023-07-27 10:17:43.408 [,] INFO [main] org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor Initializing ExecutorService 'taskExecutor'
2023-07-27 10:17:43.902 [,] INFO [main] org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor Initializing ExecutorService
2023-07-27 10:17:43.903 [,] INFO [main] org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor Initializing ExecutorService 'signExecutor'
2023-07-27 10:17:43.910 [,] INFO [main] org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor Initializing ExecutorService
2023-07-27 10:17:43.911 [,] INFO [main] org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor Initializing ExecutorService 'downloadExecutor'
2023-07-27 10:17:46.163 [,] INFO [main] com.xxl.job.core.log.XxlJobLogger Start cleaning up expired files ..............
2023-07-27 10:17:46.168 [,] INFO [main] xxl-job logger >>>>>>>>>>> 2023-07-27 10:17:46 [com.demo.module.file.task.FileOverdueScheduled#fileOverdue]-[39]-[main] Start cleaning up expired files ..............
2023-07-27 10:17:46.332 [,] INFO [main] io.lettuce.core.EpollProvider Starting without optional epoll library
2023-07-27 10:17:46.339 [,] INFO [main] io.lettuce.core.KqueueProvider Starting without optional kqueue library
```

**解决方案：**

在配置文件中进行如下配置：

```java
spring:
  sleuth:
    sleuth-zipkin 和 redis 初始化时会冲突死锁，导致项目启动卡住，所以这里禁用 redis
    redis.enabled: false
```
