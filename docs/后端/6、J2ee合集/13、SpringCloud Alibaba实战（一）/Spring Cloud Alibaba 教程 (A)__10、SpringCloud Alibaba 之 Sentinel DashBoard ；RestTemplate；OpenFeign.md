# 10、SpringCloud Alibaba 之 Sentinel DashBoard ；RestTemplate；OpenFeign
- 来源：https://ddkk.com/zhuanlan/j2ee/springcloudalibaba/1/10.html
- 分类：J2EE框架
- 分组：Spring Cloud Alibaba 教程 (A)
## 一、Sentinel Dashboard通信原理

**1、** sentinel-transport-simple-http会在客户端主机创建新端口8719；

**2、** 当端口占用时端口逐次+1，直到可用；

**3、** 第一次启动sentinel-transport-simple-http会向Dashboard注册；

**4、** 、STSH默认间隔10秒钟向Dashboard发送心跳包通知健康状态；

**5、** http://客户端IP:8719/api对Dashboard暴露API接口供其调用,包括获取监控数据/设置规则/查询配置信息等；

**6、** Dashboard与STSH间采用REST风格通信；

注：

因涉及开辟新端口，所以不要忘记在客户端防火墙放行8719/8720等端口

微服务暴露给Sentinel Dashboard的API接口列表

[http://localhost:8719/api](http://localhost:8719/api)

```java
[
    {
    url: "/cnode",
    desc: "get clusterNode metrics by id, request param: id={resourceName}"
    },
    {
    url: "/setParamFlowRules",
    desc: "Set parameter flow rules, while previous rules will be replaced."
    },
    {
    url: "/origin",
    desc: "get origin clusterNode by id, request param: id={resourceName}"
    },
    {
    url: "/cluster/server/flowRules",
    desc: "get cluster flow rules"
    },
    {
    url: "/cluster/server/modifyFlowConfig",
    desc: "modify cluster server flow config"
    },
    {
    url: "/cluster/server/modifyTransportConfig",
    desc: "modify cluster server transport config"
    },
    {
    url: "/basicInfo",
    desc: "get sentinel config info"
    },
    {
    url: "/getClusterMode",
    desc: "get cluster mode status"
    },
    {
    url: "/cluster/client/modifyConfig",
    desc: "modify cluster client config"
    },
    {
    url: "/setClusterMode",
    desc: "set cluster mode, accept param: mode={0|1} 0:client mode 1:server mode"
    },
    {
    url: "/getRules",
    desc: "get all active rules by type, request param: type={ruleType}"
    },
    {
    url: "/api",
    desc: "get all available command handlers"
    },
    {
    url: "/setRules",
    desc: "modify the rules, accept param: type={ruleType}&data={ruleJson}"
    },
    {
    url: "/cluster/server/modifyNamespaceSet",
    desc: "modify server namespace set"
    },
    {
    url: "/cluster/client/fetchConfig",
    desc: "get cluster client config"
    },
    {
    url: "/cluster/server/paramRules",
    desc: "get cluster server param flow rules"
    },
    {
    url: "/tree",
    desc: "get metrics in tree mode, use id to specify detailed tree root"
    },
    {
    url: "/cluster/server/fetchConfig",
    desc: "get cluster server config"
    },
    {
    url: "/version",
    desc: "get sentinel version"
    },
    {
    url: "/clusterNode",
    desc: "get all clusterNode VO, use type=notZero to ignore those nodes with totalRequest <=0"
    },
    {
    url: "/jsonTree",
    desc: "get tree node VO start from root node"
    },
    {
    url: "/getParamFlowRules",
    desc: "Get all parameter flow rules"
    },
    {
    url: "/cluster/server/modifyParamRules",
    desc: "modify cluster param flow rules"
    },
    {
    url: "/metric",
    desc: "get and aggregate metrics, accept param: startTime={startTime}&endTime={endTime}&maxLines={maxLines}&identify={resourceName}"
    },
    {
    url: "/systemStatus",
    desc: "get system status"
    },
    {
    url: "/cluster/server/modifyFlowRules",
    desc: "modify cluster flow rules"
    },
    {
    url: "/cluster/server/metricList",
    desc: "get cluster server metrics"
    },
    {
    url: "/getSwitch",
    desc: "get sentinel switch status"
    },
    {
    url: "/setSwitch",
    desc: "set sentinel switch, accept param: value={true|false}"
    },
    {
    url: "/clusterNodeById",
    desc: "get clusterNode VO by id, request param: id={resourceName}"
    },
    {
    url: "/cluster/server/info",
    desc: "get cluster server info"
    }
]
```

Sentinel Dashboard控制台配置项，可以修改

## 二、Sentinel三种保护应用方式

### 1、拦截所有controller的请求url路径

Sentinel为springboot程序提供了一个starter依赖，由于sentinel starter依赖默认情况下就会为所有的HTTP服务提供限流埋点，所以在springboot 中的Controller都可以受到Sentinel的保护；

只需为应用添加 spring-cloud-starter-alibaba-sentinel依赖，所有的HTTP接口都能获得Sentinel保护，还需要为Sentinel配置保护的规则；

底层通过一个拦截器对请求url进行拦截

com.alibaba.csp.sentinel.adapter.spring.webmvc.SentinelWebInterceptor

通过如下配置关闭对微服务的保护

```bash
#关闭sentinel对controller的url的保护
spring.cloud.sentinel.filter.enabled=false
```

### 2、通过代码方式保护应用

```java
@GetMapping("/test3/{app}")
public String test3(@PathVariable("app") String app) {
    System.out.println("/test3/{app} --> " + app);
    //跟踪
    ContextUtil.enter("test3");
    Entry entry = null;
    try {
        entry = SphU.entry("test3");
        //受sentinel保护的代码 start
        int a = 10 / 0;
        return restTemplate.getForObject("http://springcloud-alibaba-1-nacos-discovery-provider/test", String.class);
        //受sentinel保护的代码 end
    } catch (BlockException e) {
        e.printStackTrace();
         不同的异常返回不同的提示语（手动写上服务降级的代码）
        if (e instanceof FlowException) {
            return "限流了...";
        } else if (e instanceof DegradeException) {
            return "熔断降级了...";
        } else if (e instanceof ParamFlowException) {
            return "热点参数限流了...";
        } else if (e instanceof SystemBlockException) {
            return "触发系统保护规则...";
        } else if (e instanceof AuthorityException) {
            return "授权规则不通过...";
        }
        return "熔断了.....";
    } catch (ArithmeticException e) {
        //对 int a = 10 / 0; 异常的监控（跟踪统计到 BlockException 中）
        Tracer.trace(e);
        return "除数不能为0";
    } finally {
        //退出关闭（类似流关闭）
        if (entry != null) {
            entry.exit();
        }
        ContextUtil.exit();
    }
}
```

### 3、通过@SentinelResource(value = "app")注解保护应用

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

## 三、Sentinel对 RestTemplate 流控熔断

在application.properties配置文件中，开启sentinel对resttemplate的支持

```bash
#true开启sentinel对resttemplate的支持，false则关闭
resttemplate.sentinel.enabled=true
```

```java
@Configuration
public class MyRibbonConfig {
    /*
    在使用springcloud ribbon客户端负载均衡的时候，可以给RestTemplate bean 加一个@LoadBalanced注解，就能让这个RestTemplate在请求时拥有客户端负载均衡的能力
    这个@LoadBalanced注解是来自cloud包下的一个注解
    */
//    @SentinelRestTemplate(blockHandler="blockA", blockHandlerClass= MyBlockHandlerClass.class) //限流
    @SentinelRestTemplate(fallback="fallbackA", fallbackClass = MyBlockHandlerClass.class) // 降级
    @Bean
    @LoadBalanced //与 Ribbon 集成，并开启负载均衡功能
    public RestTemplate restTemplate() {
        return new RestTemplate();
    }
}
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

## 四、Sentinel对 OpenFeign 流控熔断

在application.properties配置文件中，开启sentinel对*feign*的支持

```java
#true开启sentinel对feign的支持，false则关闭
feign.sentinel.enabled=true
```

```java
@FeignClient(name = "springcloud-alibaba-1-nacos-discovery-provider",
        /*fallback = EchoFeignServiceFallback.class,*/
        fallbackFactory = EchoFeignServiceFallbackFactory.class,
        configuration = FeignConfiguration.class)
public interface EchoFeignService {
    @GetMapping("/notFound")
    String notFound();
}
@Component
public class EchoFeignServiceFallback implements EchoFeignService {
    @Override
    public String notFound() {
        return "notFound fallback";
    }
}
public class EchoFeignServiceFallbackFactory implements FallbackFactory<EchoFeignService> {
    @Override
    public EchoFeignService create(Throwable throwable) {
        return new EchoFeignService() {
            @Override
            public String notFound() {
                return "default feign invoke notFound fallbackFactory 999" + throwable.getMessage();
            }
        };
    }
}
public class FeignConfiguration {
    @Bean
    public EchoFeignServiceFallbackFactory echoFeignServiceFallbackFactory() {
        return new EchoFeignServiceFallbackFactory();
    }
}
```
