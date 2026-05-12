# 13、SpringCloud Alibaba - 使用Sentinel实现流量控制
- 来源：https://ddkk.com/zhuanlan/j2ee/springcloudalibaba/3/13.html
- 分类：J2EE框架
- 分组：Spring Cloud Alibaba 教程
## 前言

Sentinel 是面向分布式服务架构的高可用流量防护组件，主要以流量为切入点，从限流、流量整形、熔断降级、系统负载保护、热点防护等多个维度来帮助开发者保障微服务的稳定性。

Sentinel 的主要工作机制如下：

对主流框架提供适配或者显示的 API，来定义需要保护的资源，并提供设施对资源进行实时统计和调用链路分析。

根据预设的规则，结合对资源的实时统计信息，对流量进行控制。同时，Sentinel 提供开放的接口，方便您定义及改变规则。

Sentinel 提供实时的监控系统，方便您快速了解目前系统的状态。

## 一、安装 sentinel-dashboard

**1、** 下载；

[https://github.com/alibaba/Sentinel/releases](https://github.com/alibaba/Sentinel/releases)

**2、** 启动；

```java
java -Dserver.port=8080  -jar sentinel-dashboard.jar
```

**3、** 访问页面；

```java
http://172.16.10.159:8080/
```

用户名密码 默认为 sentinel/sentinel

## 二、接入客户端

**1、** 配置文件新增配置项；

```java
# 本地启动的端口，与dashboard服务端进行数据交互
spring.cloud.sentinel.transport.port=8719
# dashboard服务端地址端口
spring.cloud.sentinel.transport.dashboard=172.16.10.159:8080
# 心跳客户端地址，本机地址
spring.cloud.sentinel.transport.client-ip=192.168.100.73
```

**2、** 接口；

```java
public interface SentinelService {
    public Map test();
}
```

**3、** 实现类；

使用@SentinelResource 注解，指定resource 的名称和 限流时的回调 blockHandler

```java
@Service
public class SentinelServiceImpl implements SentinelService {
    @SentinelResource(value = "sentinel-test", blockHandler = "testHandler")
    @Override
    public Map test(){
        ImmutableMap map = ImmutableMap.of(
                "code", 200,
                "success", true);
        return map;
    }
    public Map testHandler(BlockException e) {
        ImmutableMap map = ImmutableMap.of(
                "code", 500,
                "reason", "服务流量控制",
                "error", e);
        return map;
    }
}
```

**4、** controller；

```java
@RestController
@RequestMapping("/sentinel")
public class SentinelController {
    @Autowired
    private SentinelService sentinelService;
    @GetMapping("/test")
    public Map test(){
        return sentinelService.test();
    }
}
```

**5、** 访问controller中test接口；

访问接口之后，打开sentinel 控制台，能够找到对应的客户端，找到簇点链路，找到指定的 resource 名称

点击右侧流控，添加流量规则

**6、** 增加流量规则之后，连续多次访问controller接口，当请求速率大于规则里的QPS时，返回值会出现以下情况：；

进入了自定义的 testHandler( )

```java
{
    "code": 500,
    "reason": "服务流量控制",
    "error": {
        "cause": null,
        "stackTrace": [],
        "rule": {
            "resource": "sentinel-test",
            "limitApp": "default",
            "grade": 1,
            "count": 1.0,
            "strategy": 0,
            "refResource": null,
            "controlBehavior": 0,
            "warmUpPeriodSec": 10,
            "maxQueueingTimeMs": 500,
            "clusterMode": false,
            "clusterConfig": {
                "flowId": null,
                "thresholdType": 0,
                "fallbackToLocalWhenFail": true,
                "strategy": 0,
                "sampleCount": 10,
                "windowIntervalMs": 1000
            }
        },
        "ruleLimitApp": "default",
        "message": null,
        "suppressed": [],
        "localizedMessage": null
    }
}
```
