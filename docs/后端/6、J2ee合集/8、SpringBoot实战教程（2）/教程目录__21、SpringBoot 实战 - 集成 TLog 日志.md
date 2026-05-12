# 21、SpringBoot 实战 - 集成 TLog 日志
- 来源：https://ddkk.com/zhuanlan/j2ee/springboot/5/21.html
- 分类：J2EE框架
- 分组：教程目录
**官方网站：**[https://tlog.yomahub.com/](https://tlog.yomahub.com/)

**官方文档：**[https://tlog.yomahub.com/pages/5b7bd2/](https://tlog.yomahub.com/pages/5b7bd2/)

**Gitee：**[https://gitee.com/dromara/TLog](https://gitee.com/dromara/TLog)

**GItHub：**[https://github.com/dromara/TLog](https://github.com/dromara/TLog)

**官方示例：**[https://gitee.com/bryan31/tlog-example](https://gitee.com/bryan31/tlog-example)

## 一、简介

`TLog` 是一款国产的`轻量级分布式日志标记追踪组件`。集成方便，通过对日志打标签的方式实现了微服务的链路追踪。支持 `log4j`、`log4j2`、`logback` 三大日志框架。支持 `dubbo`、`dubbox`、`springcluod` 三大RPC框架。

**特点：** 轻量级、10分钟接入、适配广泛。

## 二、Maven依赖

**spring boot依赖：**

```xml
<dependency>
  <groupId>com.yomahub</groupId>
  <artifactId>tlog-all-spring-boot-starter</artifactId>
  <version>1.5.1</version>
</dependency>
```

**spring native依赖：**

```xml
<dependency>
  <groupId>com.yomahub</groupId>
  <artifactId>tlog-all</artifactId>
  <version>1.5.1</version>
</dependency>
```

以上是集成了 TLog 的全部依赖，如果只想集成 TLog 的部分依赖可以根据需要进行选择：

模块名
适用项目

tlog-dubbo-spring-boot-starter
适用于 apache dubbo 项目。

tlog-dubbox-spring-boot-starter
适用于当当的 dubbox 项目。

tlog-feign-spring-boot-starter
适用于 spring cloud 中 open feign 项目。

tlog-gateweay-spring-boot-starter
适用于 spring cloud 中 gateway 网关服务。

tlog-soul-spring-boot-starter
适用于 soul 网关服务。

tlog-web-spring-boot-starter
适用于 spring web 项目。

tlog-xxljob-spring-boot-starter
适用于 xxl-job 项目。

## 三、启动类集成

在Spring Boot 项目中，集成 TLog 只需在引入相关依赖后，在启动类增加 `static {AspectLogEnhance.enhance();}` 即可生效。

```java
import com.yomahub.tlog.core.enhance.bytes.AspectLogEnhance;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
@SpringBootApplication
public class SpringbootDemoApplication {
    //进行日志增强，自动判断日志框架
    static {
     AspectLogEnhance.enhance();}
    public static void main(String[] args) {
        SpringApplication.run(SpringbootDemoApplication.class, args);
    }
}
```

到这一步就可以启动项目运行测试了，下面是一些测试和定制化的内容说明。

## 四、测试

### 1.服务简介

这里我们搭建三个服务：`tlog-eureka`、`tlog-feign-a`、`tlog-feign-b`。调用关系如下：

### 2.服务A代码

#### DemoController.java

```java
import com.demo.common.Result;
import com.demo.feign.DemoFeignClient;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
@Slf4j
@RestController
@RequestMapping("/demo")
public class DemoController {
    @Autowired
    private DemoFeignClient demoFeignClient;
    @GetMapping("/feignTest")
    public Result<Object> feignTest() {
        log.info("feignTest");
        return demoFeignClient.test();
    }
}
```

#### DemoFeignClient.java

```java
import com.demo.common.Result;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
@FeignClient(value = "tlog-feign-b")
public interface DemoFeignClient {
    @GetMapping("/demo/test")
    Result<Object> test();
}
```

### 3.服务B代码

```java
import com.demo.common.Result;
import lombok.extern.slf4j.Slf4j;
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
    @GetMapping("/test")
    public Result<Object> test() {
        log.info("这是第一条日志。port:" + port);
        log.info("这是第二条日志。port:" + port);
        log.info("这是第三条日志。port:" + port);
        return Result.succeed();
    }
}
```

### 4.测试结果

**请求接口：** http://localhost:8081/demo/feignTest

**请求结果：**

**服务A日志：**

```java
2023-07-22 18:03:50.396  INFO 4464 --- [nio-8081-exec-8] c.y.t.w.i.TLogWebInvokeTimeInterceptor   : <NONE><0><vouM834852011728769024> [TLOG]开始请求URL[/demo/feignTest],参数为:{
     }
2023-07-22 18:03:50.397  INFO 4464 --- [nio-8081-exec-8] com.demo.controller.DemoController       : <NONE><0><vouM834852011728769024> >>>>>>>>>> 【INFO】feignTest
2023-07-22 18:03:50.410  INFO 4464 --- [nio-8081-exec-8] c.y.t.w.i.TLogWebInvokeTimeInterceptor   : <NONE><0><vouM834852011728769024> [TLOG]结束URL[/demo/feignTest]的调用,耗时为:12毫秒
```

**服务B日志：**

```java
2023-07-22 18:03:50.403  INFO 35816 --- [nio-8082-exec-2] c.y.t.w.i.TLogWebInvokeTimeInterceptor   : <tlog-feign-a><0.1><vouM834852011728769024> [TLOG]开始请求URL[/demo/test],参数为:{
     }
2023-07-22 18:03:50.404  INFO 35816 --- [nio-8082-exec-2] com.demo.controller.DemoController       : <tlog-feign-a><0.1><vouM834852011728769024> 这是第一条日志。port:8082
2023-07-22 18:03:50.404  INFO 35816 --- [nio-8082-exec-2] com.demo.controller.DemoController       : <tlog-feign-a><0.1><vouM834852011728769024> 这是第二条日志。port:8082
2023-07-22 18:03:50.404  INFO 35816 --- [nio-8082-exec-2] com.demo.controller.DemoController       : <tlog-feign-a><0.1><vouM834852011728769024> 这是第三条日志。port:8082
2023-07-22 18:03:50.407  INFO 35816 --- [nio-8082-exec-2] c.y.t.w.i.TLogWebInvokeTimeInterceptor   : <tlog-feign-a><0.1><vouM834852011728769024> [TLOG]结束URL[/demo/test]的调用,耗时为:3毫秒
```

## 补充一：自定义日志标签模板

`TLog` 默认只打印 spanId 和 traceId，以 `` 模板打印，我们也可以自定义模板，加入其他的标签头。

只需要在 Spring Boot 项目中进行如下配置：

```java
tlog.pattern=<$preApp><$spanId><$traceId>
```

具体配置项信息如下：

- `$`preApp：上游微服务节点名称。
- `$`preHost：上游微服务的 Host Name。
- `$`preIp：上游微服务的IP地址。
- `$`spanId：链路 spanId。
- `$`traceId：全局唯一跟踪ID。（雪花算法）

配置好后，TLog 就会按照我们定义的模板进行打印日志。

```java
2023-07-22 17:23:37.788  INFO 33604 --- [nio-8082-exec-1] com.demo.controller.DemoController       : <tlog-feign-a><0.1><EDEN834841887140286464> 这是第一条日志。port:8082
2023-07-22 17:23:37.788  INFO 33604 --- [nio-8082-exec-1] com.demo.controller.DemoController       : <tlog-feign-a><0.1><EDEN834841887140286464> 这是第二条日志。port:8082
2023-07-22 17:23:37.788  INFO 33604 --- [nio-8082-exec-1] com.demo.controller.DemoController       : <tlog-feign-a><0.1><EDEN834841887140286464> 这是第三条日志。port:8082
```

## 补充二：SpanId的生成规则

> TLog 中的 SpanId 代表本次调用在整个调用链路数中的位置。

假设一个 Web 系统 A 接受了一次用户请求，那么在这个系统的日志中，记录下的 SpanId 会有如下情况：

- 0，代表在这次请求中， A 系统是整个调用的根节点。
- 0.1、0.2、0.3…，代表 A 系统通过 RPC 依次调用了 B、C、D 等系统。
- 0.2.1、0.2.2…，代表在 A 系统调用 C 系统后，C 系统在处理请求的时候又调用了 E、F 等系统。

根据上面的描述，我们可以把一次调用中所有的 `SpanId` 收集起来，组成一棵完整的链路树：

## 补充三：业务标签

很多系统在打印日志的时候，每打印一条日志都会带入一些业务信息，比如记录ID、会员CODE，方便日志的定位。

`TLog` 除了实现分布式链路标签追加之外，还可以`自定义业务标签`来添加到日志中。TLog 的自定义业务标签是`方法级`的。我们可以在方法上使用 `@TLogAspect` 注解指定需要添加的业务标签字段，TLog 会自动将业务标签统一添加到日志的开头。

业务标签的位置为：``

下面是几种常见的自定义业务标签的使用方法：

### 1.打印入参

`@TLogAspect` 注解会读取 id 和 name 值，从而打印到日志中。

```java
@TLogAspect({
     "id","name"})
public void demo1(String id,String name){
  log.info("这是第一条日志");
  log.info("这是第二条日志");
  log.info("这是第三条日志");
  new Thread(() -> log.info("这是异步日志")).start();
}
```

日志示例：

```java
2023-07-22 17:41:02.190  INFO 33516 --- [nio-8081-exec-1] com.demo.controller.DemoController       : <0><bInv834846270246686720> [id:"1",name:"ACGkaka"] 这是第一条日志
2023-07-22 17:41:02.190  INFO 33516 --- [nio-8081-exec-1] com.demo.controller.DemoController       : <0><bInv834846270246686720> [id:"1",name:"ACGkaka"] 这是第二条日志
2023-07-22 17:41:02.190  INFO 33516 --- [nio-8081-exec-1] com.demo.controller.DemoController       : <0><bInv834846270246686720> [id:"1",name:"ACGkaka"] 这是第三条日志
2023-07-22 17:41:02.192  INFO 33516 --- [      Thread-28] com.demo.controller.DemoController       : <0><bInv834846270246686720> [id:"1",name:"ACGkaka"] 这是异步日志
```

### 2.指定连接符

`@TLogAspect` 注解支持指定 `pattern` 和 参数间的连接符。pattern 指的是业务标签的打印格式，其中 `{}` 表示业务标签的内容。

```java
@TLogAspect(value = {
     "id","name"},pattern = "<-{}->",joint = "_")
public void demo(String id,String name){
  log.info("加了patter和joint的示例");
}
```

日志示例：

```java
2020-02-08 22:09:40.103 [main] INFO  Demo - <0.2><7205781616706048><-NO1234_jenny-> 加了patter和joint的示例
```

### 3.打印常量

`@TLogAspect` 注解也支持常量字符串作为业务标签。

```java
@TLogAspect(str = "demo1()")
public void demo1(String name){
  log.info("这是第一条日志");
  log.info("这是第二条日志");
  log.info("这是第三条日志");
  new Thread(() -> log.info("这是异步日志")).start();
}
```

日志示例：

```java
2020-02-08 20:22:33.945 [main] INFO  Demo - <0.2><7205781616706048>[demo1()] 这是第一条日志
2020-02-08 20:22:33.945 [main] INFO  Demo - <0.2><7205781616706048>[demo1()] 这是第二条日志
2020-02-08 20:22:33.945 [main] INFO  Demo - <0.2><7205781616706048>[demo1()] 这是第三条日志
2020-02-08 20:22:33.948 [Thread-3] INFO  Demo - <0.2><7205781616706048>[demo1()] 这是异步日志
```

### 4.打印JSON某属性

`@TLogAspect` 支持解析JSON入参，通过 `.` 点操作符可以进行对象属性的取值，支持类型：

- Java对象
- JSON格式的字符串

**Java 对象属性的获取：**

```java
@TLogAspect({
     "person.id","person.age","person.company.department.dptId"})
public void demo(Person person){
  log.info("多参数加多层级示例");
}
```

日志示例：

```java
2020-02-08 22:09:40.110 [main] INFO  Demo - <0.2><7205781616706048>[31-25-80013] 多参数加多层级示例
```

**JSON格式字符串属性的获取：**

```java
@TLogAspect({
     "person.id","person.age","person.company.department.dptId"})
public void demo(String person){
  log.info("多参数加多层级示例");
}
```

**JSON格式字符串中数组的获取：**

对于JSON格式字符串中的数组，可以用下标 `[num]` 来获取。

```java
@TLogAspect({
     "person.id","person.age","person.company.title[1]"})
public void demo(String person){
  log.info("多参数加多层级示例");
}
```

## 补充四：打印调用参数和时间

在Spring Boot 项目中，如果我们想在日志的`第一行`打印调用的参数和时间，我们可以在配置文件中进行如下配置：

```java
# 默认为false
tlog.enable-invoke-time-print=true
```

请求地址：http://localhost:8081/demo/tlogTest?id=1&name=ACGkaka

日志示例：

```java
2023-07-22 17:41:02.039  INFO 33516 --- [nio-8081-exec-1] c.y.t.w.i.TLogWebInvokeTimeInterceptor   : <0><bInv834846270246686720> [TLOG]开始请求URL[/demo/tlogTest],参数为:{
     "id":["1"],"name":["ACGkaka"]}
2023-07-22 17:41:02.190  INFO 33516 --- [nio-8081-exec-1] com.demo.controller.DemoController       : <0><bInv834846270246686720> 这是第一条日志
2023-07-22 17:41:02.190  INFO 33516 --- [nio-8081-exec-1] com.demo.controller.DemoController       : <0><bInv834846270246686720> 这是第二条日志
2023-07-22 17:41:02.190  INFO 33516 --- [nio-8081-exec-1] com.demo.controller.DemoController       : <0><bInv834846270246686720> 这是第三条日志
2023-07-22 17:41:02.192  INFO 33516 --- [      Thread-28] com.demo.controller.DemoController       : <0><bInv834846270246686720> 这是异步日志
2023-07-22 17:41:02.221  INFO 33516 --- [nio-8081-exec-1] c.y.t.w.i.TLogWebInvokeTimeInterceptor   : <0><bInv834846270246686720> [TLOG]结束URL[/demo/tlogTest]的调用,耗时为:171毫秒
```

整理完毕，完结撒花~ 🌻
