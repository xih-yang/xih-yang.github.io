# 09、SpringCloud Alibaba 之 Sentinel DashBoard 规则
- 来源：https://ddkk.com/zhuanlan/j2ee/springcloudalibaba/1/9.html
- 分类：J2EE框架
- 分组：Spring Cloud Alibaba 教程 (A)
下述Sentinel规则都使用自定义的异常类 MyBlockExceptionHandler 实现 **BlockExceptionHandler**

```java
import com.alibaba.csp.sentinel.adapter.spring.webmvc.callback.BlockExceptionHandler;
import com.alibaba.csp.sentinel.slots.block.BlockException;
import com.alibaba.csp.sentinel.slots.block.authority.AuthorityException;
import com.alibaba.csp.sentinel.slots.block.degrade.DegradeException;
import com.alibaba.csp.sentinel.slots.block.flow.FlowException;
import com.alibaba.csp.sentinel.slots.block.flow.param.ParamFlowException;
import com.alibaba.csp.sentinel.slots.system.SystemBlockException;
import com.company.model.RestObject;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
/**
 * 自定义限流降级错误信息
 */
@Slf4j
@Component
public class MyBlockExceptionHandler implements BlockExceptionHandler {
    @Override
    public void handle(HttpServletRequest request, HttpServletResponse response, BlockException e) throws Exception {
        log.info("UrlBlockHandler.....................................");
        RestObject restObject = null;
        // 不同的异常返回不同的提示语
        if (e instanceof FlowException) {
            restObject = RestObject.builder().statusCode(100).statusMessage("接口限流了").build();
        } else if (e instanceof DegradeException) {
            restObject = RestObject.builder().statusCode(101).statusMessage("服务降级了").build();
        } else if (e instanceof ParamFlowException) {
            restObject = RestObject.builder().statusCode(102).statusMessage("热点参数限流了").build();
        } else if (e instanceof SystemBlockException) {
            restObject = RestObject.builder().statusCode(103).statusMessage("触发系统保护规则").build();
        } else if (e instanceof AuthorityException) {
            restObject = RestObject.builder().statusCode(104).statusMessage("授权规则不通过").build();
        }
        //返回json数据
        response.setStatus(500);
        response.setCharacterEncoding("utf-8");
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        //springmvc 的一个json转换类 （jackson）
        new ObjectMapper().writeValue(response.getWriter(), restObject);
        //跳转
        //request.getRequestDispatcher("/index.jsp").forward(request, response);
        //重定向
        //response.sendRedirect("http://www.baidu.com");
    }
}
```

没有自定义就会走默认的实现类 DefaultBlockExceptionHandler

## 一、Sentinel 流控规则

资源名：一般是我们的请求路径

针对来源：来自哪个应用

阈值类型：分为QPS或线程数

单机阈值：单个节点的QPS或线程数阈值

是否集群：被请求的服务是否集群部署

### 流控模式：

（1）直接，就是直接对该资源进行控制

（2）关联，关联某一个资源（/app2），被关联的资源/app2达到阈值2，则限制当前资源/test的访问

（3）链路，记录指定链路上的流量

### 流控效果：

（1）快速失败，直接限制；

（2）Warm Up，根据coldFactor（默认为3）的值，从 阈值/coldFactor，经过预热的时长，才达到设置的QPS阈值，比如设置QPS阈值为100，那么100/3 =33，用33作为最初的阈值，然后在10秒到达100后再开始限流；

（3）排队等待，在QPS阈值到达后，新的请求就等待，直到超时，可以适用于突发流量的请求

如，设置阈值类型 QPS，单机阈值为2，快速刷新浏览器

上述报错提示都可以在 sentinel 项目的源码中找到

[https://github.com/alibaba/Sentinel](https://github.com/alibaba/Sentinel)

## 二、 Sentinel 熔断/降级规则

Sentinel 1.8.0及以上版本对熔断特性进行了全新的改进升级

**1、慢调用比例****(SLOW_REQUEST_RATIO)**：选择以慢调用比例作为阈值，需要设置允许的慢调用 RT（即最大的响应时间），请求的响应时间大于该值则统计为慢调用。当单位统计时长（statIntervalMs）内请求数目大于设置的最小请求数目，并且慢调用的比例大于阈值，则接下来的熔断时长内请求会自动被熔断。经过熔断时长后熔断器会进入探测恢复状态（HALF-OPEN 状态），若接下来的一个请求响应时间小于设置的慢调用 RT 则结束熔断，若大于设置的慢调用 RT 则会再次被熔断

**2、异常比例**：异常比例 (**DEGRADE_GRADE_EXCEPTION_RATIO**)是指当资源的每秒异常总数占通过量的比值超过阈值（DegradeRule 中的 count）之后，资源进入降级状态，即在接下的时间窗口（DegradeRule 中的 timeWindow，以 s 为单位）之内，对这个方法的调用都会自动地返回，异常比率的阈值范围是 [0.0, 1.0]，代表 0% - 100%；

**3、异常数**：异常数 (**DEGRADE_GRADE_EXCEPTION_COUNT**)是指当资源近1分钟的异常数目超过阈值之后会进行熔断，注意由于统计时间窗口是分钟级别的，若timeWindow小于 60s，则结束熔断状态后仍可能再进入熔断状态

> Sentinel 1.8.0之前版本叫 降级规则
>
> 在1.8之前的版本慢调用比例就是RT，慢调用相较于之前的RT加入了比例阈值，相当于多加了一个条件

降级策略：

（1）RT:平均响应时间 (**DEGRADE_GRADE_RT**)，当 1s 内持续进入 N 个请求，对应时刻的平均响应时间（秒级）均超过阈值（count，以 ms 为单位），那么在接下的时间窗口（DegradeRule 中的 timeWindow，以 s 为单位）之内，对这个方法的调用都会自动地熔断（抛出 DegradeException），注意 Sentinel 默认统计的 RT 上限是 4900 ms，超出此阈值的都会算作 4900 ms，若需要变更此上限可以通过启动配置项 -Dcsp.sentinel.statistic.max.rt=xxx 来配置

在浏览器访问`http://localhost:8081/test`，连续快速刷新该请求，可以看到服务被熔断。1s后自动恢复

## 三、Sentinel 热点规则

热点即经常访问的数据，统计某个热点数据中访问频次最高的数据，并对其访问进行限制，如：

商品ID 为参数，统计一段时间内最常购买的商品 ID 并进行限制

热点参数限流会统计传入参数中的热点参数，并根据配置的限流阈值与模式，对包含热点参数的资源调用进行限流，热点参数限流可以看做是一种特殊的流量控制，仅对包含热点参数的资源调用生效

注：

**1、** 热点规则需要使用@SentinelResource("app")注解，否则不生效；

```java
/**
 * blockHandler = "block", blockHandlerClass = MyBlockHandlerClass.class 处理限流和降级
 * fallback = "fallback", fallbackClass = MyFallbackClass.class 处理限流和降级
 */
@GetMapping("/app") // 埋点：加入sentinel的监控
//@SentinelResource(value = "app", fallback = "fallback", fallbackClass = MyFallbackClass.class)
@SentinelResource(value = "app", blockHandler = "block", blockHandlerClass = MyBlockHandlerClass.class)
public String app(@RequestParam(value = "a", required = false) String a,
                  @RequestParam(value = "b", required = false) String b) {
    System.out.println("/app/--> " + a + "--" + b);
    return restTemplate.getForObject("http://springcloud-alibaba-1-nacos-discovery-provider/test", String.class);
}
```

```java
MyFallbackClass
```

```java
public class MyFallbackClass {
    /**
     * 该方法一定要是static方法
     */
    public static String fallback(String a, String b) {
        System.out.println("Fall back--> " + a + "--" + b);
        return "Fall back.";
    }
    public static String fallback2(String a, String b) {
        System.out.println("Fall back 2--> " + a + "--" + b);
        return "Fall back 2.";
    }
}
```

```java
MyBlockHandlerClass
```

```java
public class MyBlockHandlerClass {
    /**
     * 该方法一定要是static方法
     */
    public static String block(String a, String b, BlockException e) {
        System.out.println("Block Handler--> " + a + "--" + b);
        return "Block Handler.";
    }
    /**
     * 限流后处理方法
     */
    public static SentinelClientHttpResponse blockA(HttpRequest request,
                                                   byte[] body, ClientHttpRequestExecution execution, BlockException ex) {
        System.err.println("block: " + ex.getClass().getCanonicalName());
        return new SentinelClientHttpResponse("custom block info");
    }
    /**
     * 熔断后处理的方法
     */
    public static SentinelClientHttpResponse fallbackA(HttpRequest request,
                                                       byte[] body, ClientHttpRequestExecution execution, BlockException ex) {
        System.err.println("fallback: " + ex.getClass().getCanonicalName());
        return new SentinelClientHttpResponse("custom fallback info");
    }
}
```

**2、** 参数必须是7种基本数据类型才会生效；

## @SentinelResource 注解

属性
说明
必填与否
使用要求

value
用于指定资源的名称
必填
-

entryType
entry 类型
可选项（默认为 EntryType.OUT）
-

blockHandler
服务限流后会抛出 BlockException 异常，而 blockHandler 则是用来指定一个函数来处理 BlockException  异常的。

 简单点说，该属性用于指定服务限流后的后续处理逻辑。
可选项

- blockHandler 函数访问范围需要是 public；
- 返回类型需要与原方法相匹配；
- 参数类型需要和原方法相匹配并且最后加一个额外的参数，类型为 BlockException；
- blockHandler 函数默认需要和原方法在同一个类中，若希望使用其他类的函数，则可以指定 blockHandler 为对应的类的 Class 对象，注意对应的函数必需为 static 函数，否则无法解析。

blockHandlerClass
若 blockHandler 函数与原方法不在同一个类中，则需要使用该属性指定 blockHandler 函数所在的类。
可选项

- 不能单独使用，必须与 blockHandler 属性配合使用；
- 该属性指定的类中的 blockHandler 函数必须为 static 函数，否则无法解析。

fallback
用于在抛出异常（包括 BlockException）时，提供 fallback 处理逻辑。

 fallback 函数可以针对所有类型的异常（除了 exceptionsToIgnore 里面排除掉的异常类型）进行处理。
可选项

- 返回值类型必须与原函数返回值类型一致；
- 方法参数列表需要和原函数一致，或者可以额外多一个 Throwable 类型的参数用于接收对应的异常；
- fallback 函数默认需要和原方法在同一个类中，若希望使用其他类的函数，则可以指定 fallbackClass 为对应的类的 Class 对象，注意对应的函数必需为 static 函数，否则无法解析。

fallbackClass
若 fallback 函数与原方法不在同一个类中，则需要使用该属性指定 blockHandler 函数所在的类。
可选项

- 不能单独使用，必须与 fallback 或 defaultFallback  属性配合使用；
- 该属性指定的类中的 fallback 函数必须为 static 函数，否则无法解析。

defaultFallback
默认的 fallback 函数名称，通常用于通用的 fallback 逻辑（即可以用于很多服务或方法）。

 默认 fallback 函数可以针对所以类型的异常（除了 exceptionsToIgnore 里面排除掉的异常类型）进行处理。
可选项

- 返回值类型必须与原函数返回值类型一致；
- 方法参数列表需要为空，或者可以额外多一个 Throwable 类型的参数用于接收对应的异常；
- defaultFallback 函数默认需要和原方法在同一个类中。若希望使用其他类的函数，则可以指定 fallbackClass 为对应的类的 Class 对象，注意对应的函数必需为 static 函数，否则无法解析。

exceptionsToIgnore
用于指定哪些异常被排除掉，不会计入异常统计中，也不会进入 fallback 逻辑中，而是会原样抛出。
可选项

-

## 四、Sentinel 系统规则

**Load：**Load自适应（仅对Linux/Unix-like机器生效）：系统的load1作为启发指标，进行自适应系统保护，当系统load1超过设定的启发值，且系统当前的并发线程数超过估算的系统容量时才会触发系统保护，系统容量由系统的maxQps * minRt估算得出，设定参考值一般是 CPU cores * 2.5

**平均 RT**：当单台机器上所有入口流量的平均RT达到阈值即触发系统保护，单位是毫秒

**并发线程数：**当单台机器上所有入口流量的并发线程数达到阈值即触发系统保护

**入口 QPS：**当单台机器上所有入口流量的 QPS 达到阈值即触发系统保护

**CPU使用率 usage**（1.5.0+ 版本）：当系统 CPU 使用率超过阈值即触发系统保护（取值范围 0.0-1.0），比较灵敏

## 五、Sentinel授权规则

实现 **RequestOriginParser** 接口，在接口方法中实现区分来源

```java
import com.alibaba.cloud.commons.lang.StringUtils;
import com.alibaba.csp.sentinel.adapter.spring.webmvc.callback.RequestOriginParser;
import org.springframework.stereotype.Component;
import javax.servlet.http.HttpServletRequest;
@Component
public class MyRequestOriginParser implements RequestOriginParser {
    @Override
    public String parseOrigin(HttpServletRequest request) {
        String origin = request.getParameter("origin");
//        if (StringUtils.isBlank(origin)) {
//            throw new IllegalArgumentException("origin参数未指定");
//        }
        return origin;
    }
}
```

浏览器输入快速访问 [http://localhost:8081/app?origin=order](http://localhost:8081/app?origin=order)
