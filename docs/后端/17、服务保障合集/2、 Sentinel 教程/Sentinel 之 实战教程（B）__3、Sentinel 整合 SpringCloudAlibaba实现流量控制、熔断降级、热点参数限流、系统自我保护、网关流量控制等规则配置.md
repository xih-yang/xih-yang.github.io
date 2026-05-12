# 3、Sentinel 整合 SpringCloudAlibaba实现流量控制、熔断降级、热点参数限流、系统自我保护、网关流量控制等规则配置
- 来源：https://ddkk.com/zhuanlan/guarantee/sentinel/31.html
- 分类：服务保障
- 分组：Sentinel 之 实战教程（B）
Sentinel 是阿里开源的一套用于**服务容错**的综合性解决方案。它以流量为切入点, 从**流量控制、熔断降级、系统负载保护**等多个维度来保护服务的稳定性。

> 注意： Sentinel的配置是非必需的,因为就是对系统进行限流的一些规则配置。

**Sentinel 分为两个部分:**

核心库（Java 客户端）不依赖任何框架/库,能够运行于所有 Java 运行时环境，同时对 Dubbo/Spring Cloud 等框架也有较好的支持。

控制台（Dashboard）基于 Spring Boot 开发，打包后可以直接运行，不需要额外的 Tomcat 等应用容器。

## 1、基本使用

### 1.1 环境搭建

在整合`Sentinel`之前需要安装好`Sentinel环境`，参考：[《Docker搭建Sentinel 》](/zhuanlan/guarantee/sentinel/30.html)或者[《Linux搭建Sentinel》](/zhuanlan/guarantee/sentinel/29.html)

### 1.2 引入pom

```xml
<dependency>
    <groupId>com.alibaba.cloud</groupId>
    <artifactId>spring-cloud-starter-alibaba-sentinel</artifactId>
</dependency>
```

### 1.3 配置yaml

```bash
spring:
 cloud:
  sentinel:
   transport:
     port: 9999跟控制台交流的端口,随意指定一个未使用的端口即可
	 dashboard: localhost:8080 指定控制台服务的地址
   log:
     dir: logs/sentinel日志输出地址
```

### 1.4 测试

sentinel属于懒加载，如果当前服务没有出现到控制台中，需要访问下微服务即可成功注册。确保客户端有访问量，Sentinel 会在客户端首次调用的时候进行初始化，开始向控制台发送心跳包。

## 2、规则配置

规则配置分为：流控规则(flow)、降级规则(degrade)、热点规则(param)、系统规则(system)、授权规则(authority)。

### 2.1 流控规则

流量控制，其原理是监控应用流量的**QPS(每秒查询率) 或并发线程数**等指标，当达到指定的阈值时对流量进行控制，以避免被瞬时的流量高峰冲垮，从而保障应用的高可用性。

### 2.1.1 参数说明

一条限流规则主要由下面几个因素组成，我们可以组合这些元素来实现不同的限流效果：

Field
说明
默认值

resource
资源名，资源名是限流规则的作用对象

count
限流阈值

grade
限流阈值类型，QPS 或线程数模式
QPS 模式

limitApp
流控针对的调用来源
default，代表不区分调用来源

strategy
流控模式：直接、链路、关联
根据资源本身（直接）

controlBehavior
流控效果（直接拒绝 / 排队等待 / 慢启动模式），不支持按调用关系限流
直接拒绝

### 2.1.2 并发线程数控制

并发数控制用于保护业务线程池不被慢调用耗尽，Sentinel通过统计当前请求上下文的线程数目（正在执行的调用数目），如果超出阈值，新的请求会被`立即拒绝`，效果类似于信号量隔离。

### 2.1.3 QPS流量控制

当QPS 超过某个阈值的时候，则通过配置的流控效果实现限流，对应 FlowRule 中的 `controlBehavior` 字段，包括以下几种：

- **直接拒绝：** 对应常量为0(RuleConstant.CONTROL_BEHAVIOR_DEFAULT)，是默认的流量控制方式，当QPS超过任意规则的阈值后，新的请求就会被立即拒绝。
- **Warm Up：** 对应常量为1(RuleConstant.CONTROL_BEHAVIOR_WARM_UP)，是一种预热/冷启动方式它从开始阈值到最大QPS阈值会有一个缓冲阶段，一开始的阈值是最大QPS阈值的1/3，然后慢慢增长，直到最大阈值，适用于将突然增大的流量转换为缓步增长的场景。
- **匀速排队：** 对应常量为2(RuleConstant.CONTROL_BEHAVIOR_RATE_LIMITER)，让请求以均匀的速度通过，单机阈值为每秒允许通过的数量，其余的排队等待； 它还会设置一个超时时间，当请求超过超时间时间还未处理，则会被丢弃。匀速排队模式暂时不支持 QPS >` 1000 的场景。

### 2.1.4 流控模式

流控模式，对应 FlowRule 中的 `strategy` 字段，包括以下几种：

- **直接：** 对应常量为0(RuleConstant.STRATEGY_DIRECT)，是默认的流控模式，会根据配置的流量控制直接做成响应。
- **关联：** 对应常量为0(RuleConstant.STRATEGY_RELATE)，当关联的资源达到限流条件时，当前资源也被开启限流，这需要先对关联的资源也配置限流。
- **链路：** 对应常量为0(RuleConstant.STRATEGY_CHAIN)，当从某个接口过来的资源达到限流条件时，开启限流。

### 2.1.5 配置演示

## 2.2 降级规则

除了流量控制以外，对调用链路中不稳定的资源进行熔断降级也是保障高可用的重要措施之一。一个服务常常会调用别的模块，可能是另外的一个远程服务、数据库，或者第三方 API 等。。然而，这个被依赖服务的稳定性是不能保证的。如果依赖的服务出现了不稳定的情况，请求的响应时间变长，那么调用服务的方法的响应时间也会变长，线程会产生堆积，最终可能耗尽业务自身的线程池，服务本身也变得不可用。

复杂链路上的某一环不稳定，就可能会层层级联，最终导致整个链路都不可用。因此我们需要对不稳定的`弱依赖服务调用`进行熔断降级，暂时切断不稳定调用，避免局部不稳定因素导致整体的雪崩。熔断降级作为保护自身的手段，通常在客户端（调用端）进行配置。

**Sentinel 提供以下几种熔断策略：**

**熔断降级规则包含下面几个重要的属性：**

Field
说明
默认值

resource
资源名，即规则的作用对象

grade
熔断策略，支持慢调用比例/异常比例/异常数策略
慢调用比例

count
慢调用比例模式下为慢调用临界 RT（超出该值计为慢调用）；异常比例/异常数模式下为对应的阈值

timeWindow
熔断时长，单位为 s

minRequestAmount
熔断触发的最小请求数，请求数小于该值时即使异常比率超出阈值也不会熔断（1.7.0 引入）
5

statIntervalMs
统计时长（单位为 ms），如 60*1000 代表分钟级（1.8.0 引入）
1000 ms

slowRatioThreshold
慢调用比例阈值，仅慢调用比例模式有效（1.8.0 引入）

同一个资源可以同时有多个降级规则。

### 2.2.1 慢调用比例

选择以慢调用比例作为阈值，需要设置允许的慢调用 RT（即最大的响应时间），请求的响应时间大于该值则统计为慢调用。当单位统计时长（`statIntervalMs`）内请求数目大于设置的最小请求数目，并且慢调用的比例大于阈值，则接下来的熔断时长内请求会自动被熔断。经过熔断时长后熔断器会进入探测恢复状态（HALF-OPEN 状态），若接下来的一个请求响应时间小于设置的慢调用 RT 则结束熔断，若大于设置的慢调用 RT 则会再次被熔断。

### 2.2.2 异常比例

当单位统计时长（`statIntervalMs`）内请求数目大于设置的最小请求数目，并且异常的比例大于阈值，则接下来的熔断时长内请求会自动被熔断。经过熔断时长后熔断器会进入探测恢复状态（HALF-OPEN 状态），若接下来的一个请求成功完成（没有错误）则结束熔断，否则会再次被熔断。异常比率的阈值范围是 [0.0, 1.0]，代表 0% - 100%。

### 2.2.3 异常数

当单位统计时长内的异常数目超过阈值之后会自动进行熔断。经过熔断时长后熔断器会进入探测恢复状态（HALF-OPEN 状态），若接下来的一个请求成功完成（没有错误）则结束熔断，否则会再次被熔断。

## 2.3 热点参数规则

热点参数限流会统计传入参数中的热点参数，并根据配置的限流阈值与模式，对包含热点参数的资源调用进行限流。热点参数限流可以看做是一种特殊的流量控制，仅对包含热点参数的资源调用生效。

**热点配置：**

```java
@RequestMapping("/user/list")
//注意这里必须使用这个注解标识,热点规则不生效
@SentinelResource("message3")
 public String message3(String name, Integer age) {
 	return name +""+ age;
}
```

**配置规则如下：**

- 参数索引：0对应第一个参数，1对应第二个参数。
- 窗口时长：服务异常持续的时间周期，周期后恢复正常。

**如下图配置说明：** 当带上`name`字段的请求达到阀值会会出现异常信息，没有带上`name`字段的请求不会出现异常信息。

**参数例外项配置：**

在`热点规则`列表中点击编辑，进入高级选项，对参数值进行额外配置。

目的：当设置了`参数例外项`，如果请求和设置的参数值一致，则将执行不同的QPS限流阀值。

比如：对`age`字段进行限流，当值为100和200时，分别执行不同的QPS限流阀值。

**热点参数规则参数：**

属性
说明
默认值

resource
资源名，必填

count
限流阈值，必填

grade
限流模式
QPS 模式

durationInSec
统计窗口时间长度（单位为秒），1.6.0 版本开始支持
1s

controlBehavior
流控效果（支持快速失败和匀速排队模式），1.6.0 版本开始支持
快速失败

maxQueueingTimeMs
最大排队等待时长（仅在匀速排队模式生效），1.6.0 版本开始支持
0ms

paramIdx
热点参数的索引，必填，对应 SphU.entry(xxx, args) 中的参数索引位置

paramFlowItemList
参数例外项，可以针对指定的参数值单独设置限流阈值，不受前面 count 阈值的限制。仅支持基本类型和字符串类型

clusterMode
是否是集群参数流控规则
false

clusterConfig
集群流控相关配置

## 2.4 系统规则

系统保护规则是从应用级别的入口流量进行控制，从单台机器的 load、CPU 使用率、平均 RT、入口 QPS 和并发线程数等几个维度监控应用指标，让系统尽可能跑在最大吞吐量的同时保证系统整体的稳定性。

系统保护规则是应用整体维度的，而不是资源维度的，并且`仅对入口流量生效`。入口流量指的是进入应用的流量，比如 Web 服务或 Dubbo 服务端接收的请求，都属于入口流量。

**系统规则支持以下的模式：**

- **Load 自适应（仅对 Linux/Unix-like 机器生效）：** 系统的 load1 作为启发指标，进行自适应系统保护。当系统 load1 超过设定的启发值，且系统当前的并发线程数超过估算的系统容量时才会触发系统保护（BBR 阶段）。系统容量由系统的 maxQps * minRt 估算得出。设定参考值一般是 CPU cores * 2.5。
- **CPU usage（1.5.0+ 版本）：** 当系统 CPU 使用率超过阈值即触发系统保护（取值范围 0.0-1.0），比较灵敏。
- **平均 RT：** 当单台机器上所有入口流量的平均 RT 达到阈值即触发系统保护，单位是毫秒。
- **并发线程数：** 当单台机器上所有入口流量的并发线程数达到阈值即触发系统保护。
- **入口 QPS：** 当单台机器上所有入口流量的 QPS 达到阈值即触发系统保护。

## 2.5 授权规则

授权规则也就是：来源访问控制（黑白名单）。

根据调用来源来判断该次请求是否允许放行，这时候可以使用 Sentinel 的来源访问控制（黑白名单控制）的功能。来源访问控制根据资源的请求来源限制资源是否通过，若配置白名单则只有请求来源位于白名单内时才可通过；若配置黑名单则请求来源位于黑名单时不通过，其余的请求通过。

**配置项如下：**

- resource：资源名，即限流规则的作用对象。
- limitApp：对应的黑名单/白名单设置的流控应用。
- strategy：授权类型，AUTHORITY_WHITE 为白名单模式，AUTHORITY_BLACK 为黑名单模式，默认为白名单模式。

## 2.6、集群流程规则

假设我们希望给某个用户限制调用某个 API 的总 QPS 为 50，但机器数可能很多（比如有 100 台）。这时候我们很自然地就想到，找一个 server 来专门来统计总的调用量，其它的实例都与这台 server 通信来判断是否可以调用。这就是最基础的集群流控的方式。

另外集群流控还可以解决流量不均匀导致总体限流效果不佳的问题。假设集群中有 10 台机器，我们给每台机器设置单机限流阈值为 10 QPS，理想情况下整个集群的限流阈值就为 100 QPS。不过实际情况下流量到每台机器可能会不均匀，会导致总量没有到的情况下某些机器就开始限流。因此仅靠单机维度去限制的话会无法精确地限制总体流量。而集群流控可以精确地控制整个集群的调用总量，结合单机限流兜底，可以更好地发挥流量控制的效果。

集群流控中共有两种身份：

- **Token Client：** 集群流控客户端，用于向所属 Token Server 通信请求 token。集群限流服务端会返回给客户端结果，决定是否限流。
- **Token Server：** 即集群流控服务端，处理来自 Token Client 的请求，根据配置的集群规则判断是否应该发放 token（是否允许通过）。

Sentinel 1.4.1 版本的控制台引入了应用维度的集群流控管理页面，可以方便地从应用维度分配 token server、查看相关状态。我们可以在侧边栏点击“集群流控”，进入 Token Server 列表页面，可以查看当前应用下所有的 token server 列表及相关状态：

我们可以点击右上角的“添加 Token Server”按钮来添加新的 token server 并分配 client：

Token Client 列表

## 3、注解埋点支持

`@SentinelResource` 用于定义资源，并提供可选的异常处理和`fallback` 配置项。

`@SentinelResource`注解包含以下属性：

- **value：** 资源名称，必需项（不能为空）
- **entryType：** entry 类型，可选项（默认为 EntryType.OUT）
- **blockHandler / blockHandlerClass:** blockHandler 对应处理 BlockException 的函数名称，可选项。blockHandler 函数访问范围需要是 public，返回类型需要与原方法相匹配，参数类型需要和原方法相匹配并且最后加一个额外的参数，类型为 BlockException。blockHandler 函数默认需要和原方法在同一个类中。若希望使用其他类的函数，则可以指定 blockHandlerClass 为对应的类的 Class 对象，注意对应的函数必需为 static 函数，否则无法解析。
- **fallback / fallbackClass：** fallback 函数名称，可选项，用于在抛出异常的时候提供fallback处理逻辑。fallback 函数可以针对所有类型的异常（除了 exceptionsToIgnore 里面排除掉的异常类型）进行处理。返回值类型必须与原函数返回值类型一致；方法参数列表需要和原函数一致，或者可以额外多一个 Throwable 类型的参数用于接收对应的异常。fallback 函数默认需要和原方法在同一个类中。若希望使用其他类的函数，则可以指定 fallbackClass为对应的类的 Class 对象，注意对应的函数必需为 static 函数，否则无法解析。
- **exceptionsToIgnore（since 1.6.0）：** 用于指定哪些异常被排除掉，不会计入异常统计中，也不会进入 fallback 逻辑中，而是会原样抛出。

**注意：** 若 `blockHandler` 和 `fallback` 都进行了配置，则被限流降级而抛出`BlockException` 时只会进入 `blockHandler` 处理逻辑。若未配置 `blockHandler`、`fallback`和`defaultFallback`，则被限流降级时会将 `BlockException 直接抛出`。

**示例：**

> 方式一(回调方法)

```java
public class TestService {
    // 原函数
    @SentinelResource(value = "hello", blockHandler = "exceptionHandler", fallback = "helloFallback")
    public String hello(long s) {
        return String.format("Hello at %d", s);
    }
    // Fallback 函数，函数签名与原函数一致或加一个 Throwable 类型的参数.返回值必须与原方法一致
    public String helloFallback(long s) {
        return String.format("Halooooo %d", s);
    }
    // Block 异常处理函数，参数最后多一个 BlockException，其余与原函数一致.返回值必须与原方法一致
    public String exceptionHandler(long s, BlockException ex) {
        // Do some log here.
        ex.printStackTrace();
        return "Oops, error occurred at " + s;
    }
}
```

> 方式二(回调类)

以`回调类`的方式进行配置时，可以指向多个不同的`Class类`

```java
// 定义blockHandlerClass
public class BlockExceptionHandler {
    // Block 异常处理函数，参数最后多一个 BlockException，其余与原函数一致.返回值必须与原方法一致
    public String exceptionHandler(long s, BlockException ex) {
        // Do some log here.
        ex.printStackTrace();
        return "Oops, error occurred at " + s;
    }
}
```

```java
// 定义fallbackClass
public class FallbackExceptionHandler {
     // Fallback 函数，函数签名与原函数一致或加一个 Throwable 类型的参数.返回值必须与原方法一致
    public String exceptionFallback(long s, Throwable  e) {
        // Do some log here.
        e.printStackTrace();
        return "Oops, error occurred at " + s;
    }
}
```

```java
public class TestService {
    // 原函数
    @SentinelResource(value = "hello", blockHandlerClass = {
     BlockExceptionHandler.class}, fallbackClass = {
     FallbackExceptionHandler.class})
    public String hello(long s) {
        return String.format("Hello at %d", s);
    }
    // Fallback 函数，函数签名与原函数一致或加一个 Throwable 类型的参数.返回值必须一致
    public String helloFallback(long s) {
        return String.format("Halooooo %d", s);
    }
    // Block 异常处理函数，参数最后多一个 BlockException，其余与原函数一致.返回值必须一致
    public String exceptionHandler(long s, BlockException ex) {
        // Do some log here.
        ex.printStackTrace();
        return "Oops, error occurred at " + s;
    }
}
```

**注解使用配置：**

若是通过 `Spring Cloud Alibaba` 接入的 `Sentinel`，则无需额外进行配置即可使用 @SentinelResource 注解。

若是使用了 `Spring Boot`，需要通过配置的方式将 SentinelResourceAspect 注册为一个 Spring Bean：

```java
@Configuration
public class SentinelAspectConfiguration {
    @Bean
    public SentinelResourceAspect sentinelResourceAspect() {
        return new SentinelResourceAspect();
    }
}
```
