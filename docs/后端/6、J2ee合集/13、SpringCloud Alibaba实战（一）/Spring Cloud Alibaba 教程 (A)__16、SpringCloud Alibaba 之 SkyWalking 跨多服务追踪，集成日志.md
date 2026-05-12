# 16、SpringCloud Alibaba 之 SkyWalking 跨多服务追踪，集成日志
- 来源：https://ddkk.com/zhuanlan/j2ee/springcloudalibaba/1/16.html
- 分类：J2EE框架
- 分组：Spring Cloud Alibaba 教程 (A)
## 一、SkyWalking 跨多服务追踪

**1、** 关闭防火墙，如果nacos使用MySQL持久化规则，则启动MySQL服务；

```java
systemctl stop firewalld
```

**2、** 启动单机版Nacos，浏览器输入[http://192.168.133.129:8848/nacos](http://192.168.133.129:8848/nacos)

```bash
[root@eureka8761 ~]# cd /opt/software/nacos/bin/
[root@eureka8761 bin]# ll
total 24
-rw-r--r--. 1 root root   721 Jul  7 09:44 derby.log
drwxr-xr-x. 2 root root   270 Jul 25 14:56 logs
-rwxr-xr-x. 1  502 games  954 May 14  2020 shutdown.cmd
-rwxr-xr-x. 1  502 games  951 Dec 14  2021 shutdown.sh
-rwxr-xr-x. 1  502 games 3368 Jan 12  2022 startup.cmd
-rwxr-xr-x. 1  502 games 5161 Jul  5 12:19 startup.sh
drwxr-xr-x. 3 root root    20 Jul  5 12:19 work
[root@eureka8761 bin]# sh startup.sh -m standalone
```

**3、** 启动SkyWalking-UI；

```bash
[root@eureka8761 bin]# cd /opt/software/apache-skywalking-apm-bin/bin
[root@eureka8761 bin]# ll
total 40
-rwxr-xr-x. 1 501 games 1352 Sep 29  2021 oapService.bat
-rwxr-xr-x. 1 501 games 1364 Sep 29  2021 oapServiceInit.bat
-rwxr-xr-x. 1 501 games 1624 Sep 29  2021 oapServiceInit.sh
-rwxr-xr-x. 1 501 games 1367 Sep 29  2021 oapServiceNoInit.bat
-rwxr-xr-x. 1 501 games 1643 Sep 29  2021 oapServiceNoInit.sh
-rwxr-xr-x. 1 501 games 1626 Sep 29  2021 oapService.sh
-rwxr-xr-x. 1 501 games  941 Sep 29  2021 startup.bat
-rwxr-xr-x. 1 501 games  934 Sep 29  2021 startup.sh
-rwxr-xr-x. 1 501 games 1430 Sep 29  2021 webappService.bat
-rwxr-xr-x. 1 501 games 1657 Sep 29  2021 webappService.sh
[root@eureka8761 bin]# sh startup.sh
SkyWalking OAP started successfully!
SkyWalking Web Application started successfully!
```

**4、** IDEA中配置使用SkyWalking；

> -javaagent:D:\SoftDevelopMentTools\SkyWalking\apache-skywalking-java-agent-8.8.0\skywalking-agent\skywalking-agent.jar
>
> SW_AGENT_COLLECTOR_BACKEND_SERVICES=192.168.133.129:11800;SW_AGENT_NAME=springboot-1-consumer

**5、** 启动网关、消费者，服务者查看SkyWalking-UI控制台；

拓扑图如下：

代码流程追踪：

（1）springcloud-alibaba-1-nacos-discovery-consumer 服务消费者模块

```java
@Slf4j
@RestController
public class GoodsController {
    @Autowired
    private GoodsFeignService goodsFeignService;
    //@Trace(operationName = "trace_goods")
    @RequestMapping("/nacos/goods")
    public Object getAllGoods() {
        return goodsFeignService.getAllGoods();
    }
}
```

（2）springcloud-alibaba-1-commons 公共模块

```java
@FeignClient(name = "springcloud-alibaba-1-nacos-discovery-provider",
        fallbackFactory = GoodsFeignServiceFallbackFactory.class,
        configuration = FeignConfiguration.class)
public interface GoodsFeignService {
    @RequestMapping("/service/goodList")
    public Object getAllGoods();
}
```

（3）springcloud-alibaba-1-nacos-discovery-provider 服务提供者模块

```java
@RestController
public class GoodsController {
    @Autowired
    private GoodsService goodsService;
    @GetMapping(value = "/service/goodList")
    public List<Goods> goodList(){
        List<Goods> goodsList = goodsService.getAllGoods();
        System.out.println("查询商品列表成功：");
        for (Goods good:goodsList) {
            System.out.println("查询商品："+ good);
        }
        return goodsList;
    }
}
```

## 二、自定义SkyWalking 链路追踪

**1、** 我们在服务消费者模块springcloud-alibaba-1-nacos-discovery-consumer添加依赖；

```xml
<!-- SkyWalking 工具类 -->
<dependency>
    <groupId>org.apache.skywalking</groupId>
    <artifactId>apm-toolkit-trace</artifactId>
    <version>8.1.0</version>
</dependency>
```

**2、** 在controller调用方法中添加如下代码；

```bash
TraceContext.putCorrelation("myKey", "123456");
Optional<String> op = TraceContext.getCorrelation("myKey");
log.info("myValue = {} ", op.get());
String traceId = TraceContext.traceId();
log.info("traceId = {} ", traceId);
```

控制台中也会有如下输出

这样就可以获取跟踪的traceId，便于根据traceId去ui界面搜索整个跟踪链路

**3、** 如果一个业务方法想在ui界面的跟踪链路上显示出来，只需要在业务方法上加上**@Trace**注解即可；

```java
@Slf4j
@RestController
public class GoodsController {
    @Autowired
    private GoodsFeignService goodsFeignService;
    @Trace(operationName = "trace_goods")
    @RequestMapping("/nacos/goods")
    public Object getAllGoods() {
        log.info("/goods --> getAllGoods --> ......" );
        TraceContext.putCorrelation("myKey", "123456");
        Optional<String> op = TraceContext.getCorrelation("myKey");
        log.info("myValue = {} ", op.get());
        String traceId = TraceContext.traceId();
        log.info("traceId = {} ", traceId);
        HttpSuport.getInstance().suport();
        return goodsFeignService.getAllGoods();
    }
}
@Slf4j
public class HttpSuport {
    public static HttpSuport getInstance() {
        return new HttpSuport();
    }
    /**
     * 该方法不能静态
     */
    @Trace(operationName = "http_suport")
    public void suport() {
        TraceContext.putCorrelation("httpKey", "http123456");
        Optional<String> op = TraceContext.getCorrelation("httpKey");
        log.info("HttpSuport myValue = {} ", op.get());
        String traceId = TraceContext.traceId();
        log.info("HttpSuport traceId = {} ", traceId);
    }
}
```

## 三、SkyWalking 集成日志框架

**1、** 服务提供者、消费者、网关模块都添加依赖；

```java
<!-- SkyWalking 对 Logback 的集成 -->
        <!--  apm-toolkit-logback-1.x -->
        <dependency>
            <groupId>org.apache.skywalking</groupId>
            <artifactId>apm-toolkit-logback-1.x</artifactId>
            <version>8.1.0</version>
        </dependency>
```

**2、** resources下添加**logback-spring.xml**文件；

```xml
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
<!-- 引入 Spring Boot 默认的 logback XML 配置文件  -->
<include resource="org/springframework/boot/logging/logback/defaults.xml"/>
<!-- 控制台 Appender -->
<property name="CONSOLE_LOG_PATTERN" value="%clr(%d{${LOG_DATEFORMAT_PATTERN:-yyyy-MM-dd HH:mm:ss.SSS}}){faint} %clr(${LOG_LEVEL_PATTERN:-%5p}) %clr(${PID:- }){magenta} %tid %clr(---){faint} %clr([%15.15t]){faint} %clr(%-40.40logger{39}){cyan} %clr(:){faint} %m%n${LOG_EXCEPTION_CONVERSION_WORD:-%wEx}"/>
<appender name="console" class="ch.qos.logback.core.ConsoleAppender">
    <!-- 日志的格式化 -->
    <encoder class="ch.qos.logback.core.encoder.LayoutWrappingEncoder">
        <layout class="org.apache.skywalking.apm.toolkit.log.logback.v1.x.TraceIdPatternLogbackLayout">
            <Pattern>${CONSOLE_LOG_PATTERN}</Pattern>
        </layout>
    </encoder>
</appender>
<!-- 从 Spring Boot 配置文件中，读取 spring.application.name 应用名 -->
<springProperty name="applicationName" scope="context" source="spring.application.name" />
<property name="FILE_LOG_PATTERN" value="%d{${LOG_DATEFORMAT_PATTERN:-yyyy-MM-dd HH:mm:ss.SSS}} ${LOG_LEVEL_PATTERN:-%5p} ${PID:- } %tid --- [%t] %-40.40logger{39} : %m%n${LOG_EXCEPTION_CONVERSION_WORD:-%wEx}"/>
<!-- 日志文件的路径 -->
<property name="LOG_FILE" value="/logs/${applicationName}.log"/>
<!-- 日志文件 Appender -->
<appender name="file" class="ch.qos.logback.core.rolling.RollingFileAppender">
    <file>${LOG_FILE}</file>
    <!--滚动策略，基于时间 + 大小的分包策略 -->
    <rollingPolicy class="ch.qos.logback.core.rolling.SizeAndTimeBasedRollingPolicy">
        <fileNamePattern>${LOG_FILE}.%d{yyyy-MM-dd}.%i.gz</fileNamePattern>
        <maxHistory>7</maxHistory>
        <maxFileSize>10MB</maxFileSize>
    </rollingPolicy>
    <!-- 日志的格式化 -->
    <encoder class="ch.qos.logback.core.encoder.LayoutWrappingEncoder">
        <layout class="org.apache.skywalking.apm.toolkit.log.logback.v1.x.TraceIdPatternLogbackLayout">
            <Pattern>${FILE_LOG_PATTERN}</Pattern>
        </layout>
    </encoder>
</appender>
<!-- 设置 Appender -->
<root level="INFO">
    <appender-ref ref="console"/>
    <appender-ref ref="file"/>
</root>
</configuration>
```

**3、** controller调用方法中添加日志记录，如；

```java
log.info("/goods --> getAllGoods --> ......" );
```

**4、** 访问controller测试，查看日志输出，就可以在日志中看到跟踪的traceId；

本地也会有日志输出文件
