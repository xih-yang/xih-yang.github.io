# 6、Sentinel 控制台功能详解之降级规则+热点规则+授权规则+系统规则
- 来源：https://ddkk.com/zhuanlan/guarantee/sentinel/6.html
- 分类：服务保障
- 分组：Sentinel 之 使用教程（A）
除了流量控制以外，对调用链路中不稳定的资源进行熔断降级也是保障高可用的重要措施之一。一个服务常常会调用别的模块，可能是另外的一个远程服务、数据库，或者第三方 API 等。例如，支付的时候，可能需要远程调用银联提供的 API；查询某个商品的价格，可能需要进行数据库查询。然而，这个被依赖服务的稳定性是不能保证的。如果依赖的服务出现了不稳定的情况，请求的响应时间变长，那么调用服务的方法的响应时间也会变长，线程会产生堆积，最终可能耗尽业务自身的线程池，服务本身也变得不可用

现代微服务架构都是分布式的，由非常多的服务组成。不同服务之间相互调用，组成复杂的调用链路。以上的问题在链路调用中会产生放大的效果。复杂链路上的某一环不稳定，就可能会层层级联，最终导致整个链路都不可用。因此我们需要对不稳定的弱依赖服务调用进行熔断降级，暂时切断不稳定调用，避免局部不稳定因素导致整体的雪崩。熔断降级作为保护自身的手段，通常在客户端（调用端）进行配置。

## 降级规则

### 熔断策略之慢调用比例

选择以慢调用比例作为阈值，需要设置允许的慢调用 RT（即最大的响应时间），请求的响应时间大于该值则统计为慢调用。当单位统计时长（statIntervalMs）内请求数目大于设置的最小请求数目，并且慢调用的比例大于阈值，则接下来的熔断时长内请求会自动被熔断。经过熔断时长后熔断器会进入探测恢复状态（HALF-OPEN 状态），若接下来的一个请求响应时间小于设置的慢调用 RT 则结束熔断，若大于设置的慢调用 RT 则会再次被熔断。

**测试案例**：

**1、** 添加一个测试接口，调用接口时休眠5秒，使得此接口的响应时间为5秒以上；

```java
@GetMapping("/test")
public String test() throws InterruptedException {
    System.out.println("====");
    Thread.sleep(7000);
    return "test";
}
```

**1、** 控制台添加测试接口熔断规则；

**最大 RT**：慢调用临界 RT，超出该值计为慢调用。单位毫秒

**比例阈值**：RT模式下慢速请求比率的阈值。默认1.0d

**熔断时长**：断路器打开时的恢复超时（以秒为单位）。超时后，断路器将*转换为半开状态以尝试一些请求。。单位秒，图中表示触发熔断后，接下来的10秒内请求会自动被熔断，经过10S后熔断器会进入探测恢复状态（HALF-OPEN 状态），若接下来的一个请求响应时间小于设置的慢调用 RT 则结束熔断，若大于设置的慢调用 RT 则会再次被熔断。

**最小请求数**：可以触发熔断中断的最小请求数（在有效的统计时间范围内)。默认值为5

**StatIntervalMs**: 统计时长（单位为 ms），如 60*1000 代表分钟级（1.8.0 引入），默认1000，在控制台没有选项，需代码实现。

**1、** 使用压测工具访问测试接口，查看限流效果图，具体限流过程大概为；

**1、** 请求进入后台，sentinel会根据设置的统计时长（默认1S）统计时间段内请求的总数；

**2、** 首先判断统计的请求总数是否小于用户的设置的最小请求数（默认5），小于则不熔断，反之则进入下一步；

**3、** 然后根据用户设置的最大 RT，判断统计中的请求是否为慢调用，大于设置值为是慢调用请求；

**4、** 再次计算慢调用请求/总统计请求比例，是否超过设置的比例阈值；

**5、** 当统计时间内的请求数及慢调用比例阈值都超过设置的阈值后，接下来的熔断时长内请求会自动被熔断；

**6、** 熔断时长结束后，熔断器会进入探测恢复状态（HALF-OPEN 状态），若接下来的一个请求响应时间小于设置的慢调用 RT 则结束熔断，若大于设置的慢调用 RT 则会再次被熔断；

### 熔断策略之异常比例

当单位统计时长（statIntervalMs）内请求数目大于设置的最小请求数目，并且异常的比例大于阈值，则接下来的熔断时长内请求会自动被熔断。经过熔断时长后熔断器会进入探测恢复状态（HALF-OPEN 状态），若接下来的一个请求成功完成（没有错误）则结束熔断，否则会再次被熔断。异常比率的阈值范围是 [0.0, 1.0]，代表 0% - 100%。

### 熔断策略之异常数

当单位统计时长内的异常数目超过阈值之后会自动进行熔断。经过熔断时长后熔断器会进入探测恢复状态（HALF-OPEN 状态），若接下来的一个请求成功完成（没有错误）则结束熔断，否则会再次被熔断。

## 热点规则

### 概述

Sentinel 利用 LRU 策略统计最近最常访问的热点参数，结合令牌桶算法来进行参数级别的流控。热点参数限流支持集群模式。

何为热点？热点即经常访问的数据。很多时候我们希望统计某个热点数据中访问频次最高的 Top K 数据，并对其访问进行限制。比如：

- 商品 ID 为参数，统计一段时间内最常购买的商品 ID 并进行限制
- 用户 ID 为参数，针对一段时间内频繁访问的用户 ID 进行限制

热点参数限流会统计传入参数中的热点参数，并根据配置的限流阈值与模式，对包含热点参数的资源调用进行限流。热点参数限流可以看做是一种特殊的流量控制，仅对包含热点参数的资源调用生效。

**测试案例**：

**1、** 添加热点限流规则，此处使用代码实现，因为控制台可配置内容太少；

```java
@GetMapping("/test2")
@SentinelResource("test2")
public String test2(String userId,String sex) {
    // 基本设置
    List<ParamFlowRule> rules = new ArrayList<>();
    ParamFlowRule rule = new ParamFlowRule();
    // 限流模式-QPS 模式
    rule.setGrade(RuleConstant.FLOW_GRADE_QPS);
    // 限流阈值，必填
    rule.setCount(100);
    // 资源名，必填
    rule.setResource("test2");
    // 热点参数的索引，必填，从0开始
    rule.setParamIdx(0);
    // 统计窗口时间长度（单位为秒）
    rule.setDurationInSec(10);
    // 参数例外项,针对指定的参数值单独设置限流阈值，不受前面 count 阈值的限制。仅支持基本类型和字符串类型
    List<ParamFlowItem> items = new ArrayList<>();
    ParamFlowItem item = new ParamFlowItem();
    // 设置参数类型
    item.setClassType(String.class.getTypeName());
    // 此参数限流阈值
    item.setCount(3);
    // 参数为111111时触发限流规则
    item.setObject("111111");
    items.add(item);
    rule.setParamFlowItemList(items);
    rules.add(rule);
    ParamFlowRuleManager.loadRules(rules);
    System.out.println(userId+sex);
    return "test2";
}
```

**1、** 访问test2,查看控制台；

**2、** 快速访问http://localhost:10002/test2?userId=111111多次发现被限流，访问http://localhost:10002/test2?userId=22222222则正常；

## 授权规则

### 概述

很多时候，我们需要根据调用来源来判断该次请求是否允许放行，这时候可以使用 Sentinel 的来源访问控制（黑白名单控制）的功能。来源访问控制根据资源的请求来源（origin）限制资源是否通过，若配置白名单则只有请求来源位于白名单内时才可通过；若配置黑名单则请求来源位于黑名单时不通过，其余的请求通过。

### 规则配置

- resource：资源名，即限流规则的作用对象。
- limitApp：对应的黑名单/白名单，不同 origin 用 , 分隔，如 appA,appB。
- strategy：限制模式，AUTHORITY_WHITE 为白名单模式，AUTHORITY_BLACK 为黑名单模式，默认为白名单模式

### 测试案例

**1、** 实现requsetOriginParser获取来源，测试接口；

```java
    @Component
public class TestRequestOriginParser implements RequestOriginParser {
    @Override
    public String parseOrigin(HttpServletRequest httpServletRequest) {
    	// 实际应该从请求参数或其他来源获取
        return "app";
    }
}
```

```java
    @GetMapping("/test3/{origin}")
    @SentinelResource("test3")
    public String test3(@PathVariable String origin) {
        return "test3";
    }
```

**1、** 启动后台，刷新接口，在控制台添加规则；

**2、** 访问接口，发现已被限流；

**3、** 修改为白名单，访问正常；

## 系统规则

### 概述

系统自适应限流，Sentinel 系统自适应限流从整体维度对应用入口流量进行控制，结合应用的 Load、CPU 使用率、总体平均 RT、入口 QPS 和并发线程数等几个维度的监控指标，通过自适应的流控策略，让系统的入口流量和系统的负载达到一个平衡，让系统尽可能跑在最大吞吐量的同时保证系统整体的稳定性。

系统保护规则是应用整体维度的，而不是资源维度的，并且仅对入口流量生效。入口流量指的是进入应用的流量（EntryType.IN），比如 Web 服务或 Dubbo 服务端接收的请求，都属于入口流量。

### 支持模式

- Load 自适应（仅对 Linux/Unix-like 机器生效）：系统的 load1 作为启发指标，进行自适应系统保护。当系统 load1 超过设定的启发值，且系统当前的并发线程数超过估算的系统容量时才会触发系统保护（BBR 阶段）。系统容量由系统的 maxQps * minRt 估算得出。设定参考值一般是 CPU cores * 2.5。
- CPU usage（1.5.0+ 版本）：当系统 CPU 使用率超过阈值即触发系统保护（取值范围 0.0-1.0），比较灵敏。
- 平均 RT：当单台机器上所有入口流量的平均 RT 达到阈值即触发系统保护，单位是毫秒。
- 并发线程数：当单台机器上所有入口流量的并发线程数达到阈值即触发系统保护。
- 入口 QPS：当单台机器上所有入口流量的 QPS 达到阈值即触发系统保护。

### 测试案例

**1、** 添加规则；

```java
@GetMapping("/test4")
    @SentinelResource("test4")
    public String initSystemRule() {
        List<SystemRule> rules = new ArrayList<SystemRule>();
        SystemRule rule = new SystemRule();
        rule.setHighestSystemLoad(3.0);
        rule.setHighestCpuUsage(0.6);
        rule.setAvgRt(10);
        rule.setQps(20);
        rule.setMaxThread(10);
        rules.add(rule);
        SystemRuleManager.loadRules(Collections.singletonList(rule));
        return "test4";
    }
```

**1、** 查看控制台；

**2、** 修改参数；

**3、** 发现被限流；
