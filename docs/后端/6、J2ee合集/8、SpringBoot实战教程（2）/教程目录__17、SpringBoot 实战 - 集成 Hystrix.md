# 17、SpringBoot 实战 - 集成 Hystrix
- 来源：https://ddkk.com/zhuanlan/j2ee/springboot/5/17.html
- 分类：J2EE框架
- 分组：教程目录
## 一、简介

注意：Hystrix 已经停止开发新版本了，仅在进行部分维护工作，最后一版为2018年11月发布。

### 1.Hystrix 的定义？

**Hystrix：** 是由 Netflix 开源的一个服务隔离组件。在分布式环境中，服务与服务之间的依赖错综复杂，一种不可避免的情况就是总会有某些服务会出现故障，导致依赖于它们的其它服务出现远程调度的线程阻塞。Hystrix 提供了 熔断器 功能，能够阻止分布式系统中出现联动故障。Hystrix 是通过隔离服务的访问点阻止联动故障的，并提供了故障的解决方案，从而提高了整个分布式系统的弹性。

**官方文档：**[https://github.com/Netflix/Hystrix/wiki/](https://github.com/Netflix/Hystrix/wiki/)

**GitHub：**[https://github.com/Netflix/Hystrix](https://github.com/Netflix/Hystrix)

### 2.Hystrix 的用处？

- 通过第三方客户端访问（通常是通过网络）依赖服务来保护并控制延迟和故障。
- 停止复杂分布式系统中的级联故障。
- 快速失败并快速恢复。
- 尽可能回退并优雅地降级。
- 实现近乎实时的监控、告警和操作控制。

### 3.Hystrix 的三种状态？

**1）熔断关闭状态（Closed）**

服务没有故障时，熔断器所处的状态，对调用方的调用不做任何限制。

**2）熔断开启状态（Open）**

在固定时间窗口内（Hystrix 默认是 10 秒），接口调用出错比率达到一个阈值（Hystrix 默认为 50%），会进入`熔断开启状态`。进入熔断状态后，后续对该服务接口的调用不再经过网络，直接执行本地的 fallback() 方法。

**3）半熔断状态（Half-Open）**

在进入熔断开启状态一段时间后（Hystrix 默认是 5 秒），熔断器会进入`半熔断状态`。所谓半熔断就是尝试恢复服务调用，允许有限的流量调用该服务，并监控调用成功率。如果成功率达到预期，则说明服务已恢复，进入熔断关闭状态；如果成功率仍旧很低，则重新进入熔断关闭状态。

**三个状态的转化关系如下图所示：**

### 4.Hystrix 解决什么问题？

当一切正常时，请求流程可能如下所示：

当许多后端系统之一有了潜在变慢的危险时，它就可以阻止整个用户请求：

在高流量的情况下，单个后端依赖服务上如果出现潜在变慢的危险可能会导致所有服务器上的所有资源在几秒钟内变得饱和。

通过网络请求和被请求的应用程序中，每个点的潜在故障都是可能导致网络请求服务变慢的故障来源。比故障更糟糕的是，这些应用还可能导致服务之间的延迟增加，这会备份列表、线程和其他系统资源，从而导致整个系统发生更多的级联故障。

当通过第三方客户端执行网络请求时，这些问题会加剧从而变成一个“黑匣子”，其中的实现细节被隐藏，并且每个客户端的网络或资源配置都不相同，通常难以监控和控制。

### 5.Hystrix 的设计原理？

- 防止单个依赖项耗尽所有容器（例如 Tomcat）用户线程。
- 快速卸载负载，让请求失败而不是排队。
- 在可行的情况下提供回退以保护用户后续请求正常。
- 使用隔离技术（例如 bulkhead（隔板），swimlane（泳道），circuit breaker（断路器）模式）来限制任何一个依赖服务的影响。
- 通过近乎实时的指标、监控和告警优化故障发现时间。
- 通过配置更改的低延迟传播和对 Hystrix 大部分方面的动态属性更改的支持来优化恢复时间，让我们可以通过低延迟反馈循环进行实时操作修改。
- 防止整个依赖客户端执行中的故障，而不仅仅是网络流量中的故障。

### 6.Hystrix 的实现原理？

- 将所有对外部系统（或“依赖项”）的调用包装在一个 HystrixCommand 或 HystrixObservableCommand 对象中，该对象通常在单独的线程中执行（这是命令模式的一个示例）。
- 超过您定义的阈值的超时调用。有一个默认值，但对于大多数依赖项，我们可以通过“properties”自定义设置这些超时，以便它们略高于每个依赖项测量的第99.5个百分位性能。
- 为每个依赖项维护一个小线程池（或信号量）；如果它已满，发往该依赖项的请求将立即被拒绝，而不是排队。
- 测量成功、失败（客户端抛出的异常）、超时和线程拒绝。
- 如果服务的错误百分比超过阈值，则手动或自动触发断路器以停止对特定服务的所有请求一段时间。
- 当请求失败、被拒绝、超时或短路时执行回退逻辑。
- 近乎实时地监控指标和配置变化。

当我们使用 Hystrix 来包装每个底层依赖项时，如上图所示的体系结构将更改改为类似于下图。每个依赖性彼此隔离，限制在发生延迟时它可能饱和的资源，并包含在回退逻辑中，该逻辑决定在依赖项中发生任何类型的故障时做出何种响应。

## 二、集成 Hystrix

### 1.Maven 依赖

```xml
<properties>
    <!-- build env -->
    <java.version>1.8</java.version>
    <maven.compiler.source>1.8</maven.compiler.source>
    <maven.compiler.target>1.8</maven.compiler.target>
    <!-- dependency version -->
    <lombok.version>1.18.18</lombok.version>
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
        <version>${lombok.version}</version>
    </dependency>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-test</artifactId>
        <scope>test</scope>
    </dependency>
    <!-- Hystrix -->
    <dependency>
        <groupId>org.springframework.cloud</groupId>
        <artifactId>spring-cloud-starter-netflix-hystrix</artifactId>
    </dependency>
</dependencies>
<dependencyManagement>
    <dependencies>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-dependencies</artifactId>
            <version>2.4.5</version>
            <type>pom</type>
            <scope>import</scope>
        </dependency>
        <dependency>
            <groupId>org.springframework.cloud</groupId>
            <artifactId>spring-cloud-dependencies</artifactId>
            <version>2020.0.0</version>
            <type>pom</type>
            <scope>import</scope>
        </dependency>
        <dependency>
            <groupId>org.springframework.cloud</groupId>
            <artifactId>spring-cloud-netflix-dependencies</artifactId>
            <version>2.2.10.RELEASE</version>
            <type>pom</type>
            <scope>import</scope>
        </dependency>
    </dependencies>
</dependencyManagement>
```

### 2.application.yml

#### 简易版：

```java
spring:
  main:
    allow-bean-definition-overriding: true
feign:
  hystrix:
    enabled: true
# Hystrix settings
hystrix:
  command:
    default:
      execution:
        isolation:
          strategy: THREAD
          thread:
            配置默认的超时时间，线程超时15秒,调用Fallback方法
            timeoutInMilliseconds: 15000
      metrics:
        rollingStats:
          timeInMilliseconds: 15000
      circuitBreaker:
        10秒内出现3个以上请求(已临近阀值),并且出错率在50%以上,开启断路器.断开服务,调用Fallback方法
        requestVolumeThreshold: 3
        sleepWindowInMilliseconds: 10000
```

#### 完整版：

```java
spring:
  main:
    allow-bean-definition-overriding: true
#default可替换
hystrix:
  command:
    default:
      execution:
        isolation:
         线程池隔离还是信号量隔离 默认是THREAD 信号量是SEMAPHORE
          strategy: THREAD
          semaphore:
           使用信号量隔离时，支持的最大并发数 默认10
            maxConcurrentRequests: 10
          thread:
           command的执行的超时时间 默认是1000
            timeoutInMilliseconds: 2000
           HystrixCommand.run()执行超时时是否被打断 默认true
            interruptOnTimeout: true
           HystrixCommand.run()被取消时是否被打断 默认false
            interruptOnCancel: false
        timeout:
         command执行时间超时是否抛异常 默认是true
          enabled: true
        fallback:
         当执行失败或者请求被拒绝，是否会尝试调用hystrixCommand.getFallback()
          enabled: true
          isolation:
            semaphore:
             如果并发数达到该设置值，请求会被拒绝和抛出异常并且fallback不会被调用 默认10
              maxConcurrentRequests: 10
      circuitBreaker:
       用来跟踪熔断器的健康性，如果未达标则让request短路 默认true
        enabled: true
       一个rolling window内最小的请求数。如果设为20，那么当一个rolling window的时间内
       （比如说1个rolling window是10秒）收到19个请求，即使19个请求都失败，也不会触发circuit break。默认20
        requestVolumeThreshold: 5
        触发短路的时间值，当该值设为5000时，则当触发circuit break后的5000毫秒内
       都会拒绝request，也就是5000毫秒后才会关闭circuit，放部分请求过去。默认5000
        sleepWindowInMilliseconds: 5000
       错误比率阀值，如果错误率>=该值，circuit会被打开，并短路所有请求触发fallback。默认50
        errorThresholdPercentage: 50
       强制打开熔断器，如果打开这个开关，那么拒绝所有request，默认false
        forceOpen: false
       强制关闭熔断器 如果这个开关打开，circuit将一直关闭且忽略
        forceClosed: false
      metrics:
        rollingStats:
         设置统计的时间窗口值的，毫秒值，circuit break 的打开会根据1个rolling window的统计来计算。若rolling window被设为10000毫秒，
         则rolling window会被分成n个buckets，每个bucket包含success，failure，timeout，rejection的次数的统计信息。默认10000
          timeInMilliseconds: 10000
         设置一个rolling window被划分的数量，若numBuckets＝10，rolling window＝10000，
         那么一个bucket的时间即1秒。必须符合rolling window % numberBuckets == 0。默认10
          numBuckets: 10
        rollingPercentile:
         执行时是否enable指标的计算和跟踪，默认true
          enabled: true
         设置rolling percentile window的时间，默认60000
          timeInMilliseconds: 60000
         设置rolling percentile window的numberBuckets。逻辑同上。默认6
          numBuckets: 6
         如果bucket size＝100，window＝10s，若这10s里有500次执行，
         只有最后100次执行会被统计到bucket里去。增加该值会增加内存开销以及排序的开销。默认100
          bucketSize: 100
        healthSnapshot:
         记录health 快照（用来统计成功和错误绿）的间隔，默认500ms
          intervalInMilliseconds: 500
      requestCache:
       默认true，需要重载getCacheKey()，返回null时不缓存
        enabled: true
      requestLog:
       记录日志到HystrixRequestLog，默认true
        enabled: true
  collapser:
    default:
     单次批处理的最大请求数，达到该数量触发批处理，默认Integer.MAX_VALUE
      maxRequestsInBatch: 2147483647
     触发批处理的延迟，也可以为创建批处理的时间＋该值，默认10
      timerDelayInMilliseconds: 10
      requestCache:
       是否对HystrixCollapser.execute() and HystrixCollapser.queue()的cache，默认true
        enabled: true
  threadpool:
    default:
     并发执行的最大线程数，默认10
      coreSize: 10
     Since 1.5.9 能正常运行command的最大支付并发数
      maximumSize: 10
     BlockingQueue的最大队列数，当设为－1，会使用SynchronousQueue，值为正时使用LinkedBlcokingQueue。
     该设置只会在初始化时有效，之后不能修改threadpool的queue size，除非reinitialising thread executor。
     默认－1。
      maxQueueSize: -1
     即使maxQueueSize没有达到，达到queueSizeRejectionThreshold该值后，请求也会被拒绝。
     因为maxQueueSize不能被动态修改，这个参数将允许我们动态设置该值。if maxQueueSize == -1，该字段将不起作用
      queueSizeRejectionThreshold: 5
     Since 1.5.9 该属性使maximumSize生效，值须大于等于coreSize，当设置coreSize小于maximumSize
      allowMaximumSizeToDivergeFromCoreSize: false
     如果corePoolSize和maxPoolSize设成一样（默认实现）该设置无效。
     如果通过plugin（https://github.com/Netflix/Hystrix/wiki/Plugins）使用自定义实现，该设置才有用，默认1.
      keepAliveTimeMinutes: 1
      metrics:
        rollingStats:
         线程池统计指标的时间，默认10000
          timeInMilliseconds: 10000
         将rolling window划分为n个buckets，默认10
          numBuckets: 10
```

### 3.添加@EnableHystrix注解

```java
@EnableHystrix
@SpringBootApplication
public class SpringbootDemoApplication {
    public static void main(String[] args) {
        SpringApplication.run(SpringbootDemoApplication.class, args);
    }
}
```

### 4.HystrixConfig.java 配置类

```java
import com.netflix.hystrix.contrib.javanica.aop.aspectj.HystrixCommandAspect;
import com.netflix.hystrix.contrib.metrics.eventstream.HystrixMetricsStreamServlet;
import org.springframework.boot.web.servlet.ServletRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
/**
 * <p> @Title HystrixConfig
 * <p> @Description Hystric配置类
 *
 * @author DDKK.COM 弟弟快看，程序员编程资料站
 * @date 2023/4/8 20:26
 */
@Configuration
public class HystrixConfig {
    // 用来拦截处理HystrixCommand注解的方法
    @Bean
    public HystrixCommandAspect hystrixCommandAspect() {
        return new HystrixCommandAspect();
    }
    // 用来向监控中心Dashboard发送stream信息
    @Bean
    public ServletRegistrationBean getServlet() {
        HystrixMetricsStreamServlet streamServlet = new HystrixMetricsStreamServlet();
        ServletRegistrationBean registrationBean = new ServletRegistrationBean(streamServlet);
        registrationBean.setLoadOnStartup(1);
        registrationBean.addUrlMappings("/hystrix.stream");
        registrationBean.setName("HystrixMetricsStreamServlet");
        return registrationBean;
    }
}
```

### 5.HystrixTestController.java 测试类

#### 5.1）实现代码

```java
import com.demo.common.Result;
import com.netflix.hystrix.contrib.javanica.annotation.DefaultProperties;
import com.netflix.hystrix.contrib.javanica.annotation.HystrixCommand;
import com.netflix.hystrix.contrib.javanica.annotation.HystrixProperty;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
/**
 * <p> @Title HystrixTestController
 * <p> @Description Hystric测试Controller
 *
 * @author DDKK.COM 弟弟快看，程序员编程资料站
 * @date 2023/4/7 21:14
 */
@RestController
@RequestMapping("/hystrix")
// 指定默认熔断方法
@DefaultProperties(defaultFallback = "defaultFallback")
public class HystrixTestController {
    /**
     * 用法1：直接使用@HystrixCommand注解，使用默认熔断方法
     */
    @HystrixCommand
    @GetMapping("/test1")
    public Result<Object> test1() throws InterruptedException {
        throw new RuntimeException("测试异常");
    }
    /**
     * 用法2：使用@HystrixCommand注解，指定熔断方法和超时时间
     */
    @HystrixCommand(
            fallbackMethod = "myFallback", // 降级的回调方法
            commandProperties = {
                    // 设置超时时间
                    @HystrixProperty(name = "execution.isolation.thread.timeoutInMilliseconds", value = "5000")
            })
    @GetMapping("/test2")
    public Result<Object> test2() throws InterruptedException {
//        throw new RuntimeException("测试异常");
        for (int i = 0; i < 10; i++) {
            System.out.println(i + 1);
            Thread.sleep(1000);
        }
        return Result.succeed("测试成功");
    }
    /**
     * 该方法是一个熔断方法，当方法出现异常时，会调用该方法
     */
    public Result<Object> defaultFallback() {
        return Result.failed("@DefaultProperties指定的熔断方法");
    }
    /**
     * 该方法是一个熔断方法，当方法出现异常时，会调用该方法
     */
    public Result<Object> myFallback() {
        return Result.failed("@HystrixCommand指定的熔断方法");
    }
}
```

#### 5.2）执行结果

访问地址：http://localhost:8080/hystrix/test1

访问地址：http://localhost:8080/hystrix/test2

#### 5.3）总结

**主要涉及到了三个注解：**

- @DefaultProperties：修饰类，用于指定默认的熔断方法，优先级低于 @HystrixCommand。
- @HystrixCommand：修饰方法，用于指定熔断方法、熔断时间等。
- @HystrixProperty：用于在Hystrix命令（HystrixCommand）上设置属性（property）。注解的name属性指定了要设置的属性名称，value属性指定了要设置的属性值。可以通过设置多个@HystrixProperty注解来同时配置多个属性。这样可以根据需要灵活地配置Hystrix命令的行为，例如设置超时时间、线程池大小、错误百分比阈值、休眠窗口时间等。

**主要涉及到了三个属性：**

- defaultFallback：默认回退方法，当配置 fallbackMethod 项时忽略此配置，另外，默认回退方法不能有参数，返回值要与 Hystrix方法的返回值相同。
- fallbackMethod：对Hystrix服务降级和熔断的方法，方法执行时熔断、错误、超时时会执行的回退方法，需要保持此方法与 Hystrix 方法的签名和返回值一致。
- commandProperties：用于为注解标注的 Hystrix 命令定义一组默认的属性值，例如设置超时时间、线程池大小、错误百分比阈值、休眠窗口时间等。

### 6.补充：@HystrixProperty 的常见用法

- 设置熔断器在整个统计时间内是否开启的阀值。

```java
@HystrixProperty(name = "circuitBreaker.enabled", value = "true")
```

- 设置在一个滚动窗口中，打开断路器的最少请求数。比如：如果值是20，在一个窗口内（比如10秒），收到19个请求，即使这19个请求都失败了，断路器也不会打开。

```java
@HystrixProperty(name = "circuitBreaker.requestVolumeThreshold", value = "20")
```

- 设置当出错率超过50%后熔断器启动。

```java
@HystrixProperty(name = "circuitBreaker.errorThresholdPercentage", value = "50")
```

- 设置熔断器工作时间，超过这个时间，先放一个请求进去，成功的话就关闭熔断，失败就再等一段时间。

```java
@HystrixProperty(name = "circuitBreaker.sleepWindowInMilliseconds", value = "5000")
```

- 设置 Hystrix 线程池的核心线程数。Hystrix 线程池用于执行 Hystrix 命令（HystrixCommand）的业务逻辑，它是一个线程池，用于处理请求并执行命令。coreSize 属性指定了线程池的核心线程数，即线程池中保持的最大活动线程数。通过调整 coreSize 属性的值，可以控制 Hystrix 线程池的并发度。较大的 coreSize 值可以支持更大的并发请求量，但也会消耗更多的系统资源。

```java
@HystrixProperty(name = "coreSize", value = "30")
```

- 设置 BlockingQueue 的最大队列数，当设为-1，会使用 SynchronousQueue，值为正时使用 LinkedBlcokingQueue。

```java
@HystrixProperty(name = "maxQueueSize", value = "101")
```

- 设置存活时间，单位：分钟。如果coreSize小于maximumSize，那么该属性控制一个线程从实用完成到被释放的时间。

众所周知，如果线程池内核心线程数目都在忙碌，再有新的请求到达时，线程池容量可以被扩充到最大数量。

等到线程池空闲后，多于核心数量的线程还会被回收，此值指定了线程被回收前的存活时间，默认为 2，即两分钟。

```java
@HystrixProperty(name = "keepAliveTimeMinutes", value = "2")
```

- 设置队列拒绝的阈值，即使maxQueueSize还没有达到。

```java
@HystrixProperty(name = "queueSizeRejectionThreshold", value = "15")
```

- 设置滑动统计的桶数量。

设置一个rolling window被划分的数量，若numBuckets＝10，rolling window＝10000，那么一个bucket的时间即1秒。必须符合 rolling window % numberBuckets == 0，默认为1。

```java
@HystrixProperty(name = "metrics.rollingStats.numBuckets", value = "10")
```

- 设置滑动窗口的统计时间，单位：毫秒。

circuit break 的打开会根据1个rolling window的统计来计算。若rolling window被设为10000毫秒，则rolling window会被分成n个buckets，每个bucket包含success，failure，timeout，rejection的次数的统计信息。默认为10000。

```java
@HystrixProperty(name = "metrics.rollingStats.timeInMilliseconds", value = "10000")
```

## 三、Feign中Hystrix的使用

需要注意两点：

1）因为 Feign 中已经依赖了 Hystrix，所以当需要在 Feign 中使用 Hystrix 时，在 Maven 配置上不用做任何改动。

2）Hystrix 的熔断只是作用在服务调用这一端，所以我们只需要改动消费服务的相关代码就可以了。

下面我们就开始在 feign 中使用 Hystrix：

### 1.配置文件

application.yml 中添加如下内容：

```java
# 开启熔断机制，默认false
feign:
  hystrix:
    enabled: true
  circuitbreaker:
    enabled: true
```

### 2.HystrixTestFeignClient.java Feign调用

```java
import com.demo.common.Result;
import com.demo.feign.fallback.HystrixTestFeignClientFallBack;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
/**
 * <p> @Title HystrixTestFeign
 * <p> @Description Hystrix测试Feign
 *
 * @author DDKK.COM 弟弟快看，程序员编程资料站
 * @date 2023/4/23 13:42
 */
@FeignClient(name = "hystrix-demo", fallbackFactory = HystrixTestFeignClientFallBack.class)
public interface HystrixTestFeignClient {
    @GetMapping("/hystrixFeign/test1")
    Result<Object> test1();
    @GetMapping("/hystrixFeign/test")
    Result<Object> test();
}
```

### 3.HystrixTestFeignClientFallBack.java 熔断类

```java
import com.demo.feign.HystrixTestFeignClient;
import com.demo.common.Result;
import org.springframework.cloud.openfeign.FallbackFactory;
import org.springframework.stereotype.Component;
/**
 * <p> @Title HystrixTestFeignClientFallBack
 * <p> @Description Hystrix测试Feign熔断类
 *
 * @author DDKK.COM 弟弟快看，程序员编程资料站
 * @date 2023/4/23 13:55
 */
@Component
public class HystrixTestFeignClientFallBack implements FallbackFactory<HystrixTestFeignClient> {
    @Override
    public HystrixTestFeignClient create(Throwable cause) {
        return new HystrixTestFeignClient() {
            @Override
            public Result<Object> test1() {
                return Result.failed("调用失败，原因：" + cause.getMessage());
            }
            @Override
            public Result<Object> test() {
                return Result.failed("调用失败，原因：" + cause.getMessage());
            }
        };
    }
}
```

### 4.HystrixFeignTestController.java 测试类

#### 4.1）实现代码

```java
import com.demo.feign.HystrixTestFeignClient;
import com.demo.common.Result;
import com.netflix.hystrix.contrib.javanica.annotation.HystrixCommand;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
/**
 * <p> @Title HystrixFeignTestController
 * <p> @Description Hystrix测试Controller
 *
 * @author DDKK.COM 弟弟快看，程序员编程资料站
 * @date 2023/4/23 14:17
 */
@RestController
@RequestMapping("/hystrixFeign")
public class HystrixFeignTestController {
    @Autowired
    private HystrixTestFeignClient hystrixTestFeignClient;
    /**
     * 测试feign调用
     */
    @GetMapping("/testFeign")
    public Result<Object> testFeign() {
        long start = System.currentTimeMillis();
        Result<Object> result = hystrixTestFeignClient.test();
        long end = System.currentTimeMillis();
        return result.setMessage(result.getMessage() + "，调用时间：" + (end - start) / 1000 + "秒");
    }
    /**
     * 测试feign调用
     */
    @GetMapping("/test1Feign")
    public Result<Object> test1Feign() {
        long start = System.currentTimeMillis();
        Result<Object> result = hystrixTestFeignClient.test1();
        long end = System.currentTimeMillis();
        return result.setMessage(result.getMessage() + "，调用时间：" + (end - start) / 1000 + "秒");
    }
    /**
     * 测试正常方法
     */
    @GetMapping("/test")
    public Result<Object> test() throws InterruptedException {
        // 配置中指定了默认15秒超时，这里设置了20秒超时，所以会调用熔断方法
        int i = 0;
        for (; i < 20; i++) {
            System.out.println(i + 1 + "秒");
            Thread.sleep(1000);
        }
        return Result.succeed("测试成功，等待时间：" + i + "秒");
    }
    /**
     * 直接抛出异常
     */
    @HystrixCommand
    @GetMapping("/test1")
    public Result<Object> test1() {
        throw new RuntimeException("测试异常");
    }
}
```

#### 4.2）执行结果

测试1：测试feign超时熔断，访问地址：http://localhost:8081/hystrixFeign/testFeign

测试2：测试抛出异常熔断，访问地址：

#### 4.3）总结

根据执行结果，我们可以看到：

- 第1类超时熔断测试中，配置了15秒的熔断，超过15秒就会快速失败，但是不会影响通过feign调用的服务，已经触发执行的服务会继续执行剩余逻辑（跑完20秒）。
- 第2类异常熔断测试中，在 fallbackFactory 指定的类中可以正常拿到异常的信息，并且封装更友好的提示出来。

hystrix还可以搭配 hystrix dashboard 在页面上实时看到熔断的服务，由于 hystrix 作为一个已经过期的组件，我们这里就不再继续深入了。

整理完毕，完结撒花~ 🌻
