# 5、Sentinel 控制台功能详解之流控规则
- 来源：https://ddkk.com/zhuanlan/guarantee/sentinel/5.html
- 分类：服务保障
- 分组：Sentinel 之 使用教程（A）
## 实时监控

集成控制台后，当有请求时，实时监控页面会显示当前服务各个接口的访问信息，以图表的形式展示给用户，包含访问时间、通过 QPS、拒绝QPS、响应时间（ms）等信息。

## 簇点链路

**列表**：用于展示服务所有接口，包含通过QPS、拒绝QPS、线程数、平均RT、分钟通过、分钟拒绝等信息。

**192.168.58.1:8720**: IP为当前服务所在的IP地址。端口为服务与Sentinel控制台交互的端口，服务本地会起一个该端口占用的HttpServer，该 Server 会与 Sentinel 控制台做交互。比如 Sentinel 控制台添加了一个限流规则，会把规则数据 push 给这个 Http Server 接收，Http Server 再将规则注册到 Sentinel 中。

**操作**：可以点击，然后对当前资源添加流控、降级、热点、授权等相关操作

## 流控规则

流量控制，其原理是监控应用流量的QPS(每秒查询率) 或并发线程数等指标，当达到指定的阈值时对流量进行控制，以避免被瞬时的流量高峰冲垮，从而保障应用的高可用性。

**资源名**：唯一名称，默认是请求路径，可自定义

**针对来源**：流控针对的调用来源，若为 default 则不区分调用来源

**阈值类型**：

- QPS（每秒请求数量）: 当调用该接口的QPS达到阈值的时候，进行限流
- 线程数：当调用该接口的线程数达到阈值的时候，进行限流

**单机阈值**：QPS或线程数的阈值数，达到阈值则限流

**是否集群**：是否开启集群流控，不选择则默认为单机模式

**流控模式**：

- 直接（默认）：接口达到限流条件时，开启限流
- 关联：当关联的资源达到限流条件时，开启限流 [适合做应用让步]
- 链路：当从某个接口过来的资源达到限流条件时，开启限流

**流控效果**：

- 直接拒绝：该方式是默认的流量控制方式，当QPS超过任意规则的阈值后，新的请求就会被立即拒绝，拒绝方式为抛出FlowException。
- Warm Up（冷启动）：该方式主要用于系统长期处于低水位的情况下，当流量突然增加时，直接把系统拉升到高水位可能瞬间把系统压垮。通过"冷启动"，让通过的流量缓慢增加，在一定时间内逐渐增加到阈值上限，给冷系统一个预热的时间，避免冷系统被压垮的情况。
- 排队等待：这种方式严格控制了请求通过的间隔时间，也即是让请求以均匀的速度通过，对应的是漏桶算法。

## 流控规则案例

### 基于QPS限流

**需求**：对于test接口每秒请求量大于1的时候开始限流。

### 实现方式1：

直接在簇点链路页面针对test接口添加流控规则，设置单机阈值为1即可。

快速刷新test接口，限流生效。

可访问http://localhost:8720/cnode?id=/test/查看实时统计信息。

### 实现方式2：

代码编写限流规则，并添加到规则管理器中。

```java
@GetMapping("/test")
public String test(){
    List<FlowRule> rules = new ArrayList<FlowRule>();
    FlowRule rule1 = new FlowRule();
    rule1.setResource("/test/");
    rule1.setCount(1);
    rule1.setGrade(RuleConstant.FLOW_GRADE_QPS);
    rule1.setLimitApp("default");
    rules.add(rule1);
    FlowRuleManager.loadRules(rules);
    return "test";
}
```

## 基于并发线程数流量控制

线程数限流用于保护业务线程数不被耗尽。

例如，当应用所依赖的下游应用由于某种原因导致服务不稳定、响应延迟增加，对于调用者来说，意味着吞吐量下降和更多的线程数占用，极端情况下甚至导致线程池耗尽。为应对高线程占用的情况，业内有使用隔离的方案，比如通过不同业务逻辑使用不同线程池来隔离业务自身之间的资源争抢（线程池隔离），或者使用信号量来控制同时请求的个数（信号量隔离）。这种隔离方案虽然能够控制线程数量，但无法控制请求排队时间。当请求过多时排队也是无益的，直接拒绝能够迅速降低系统压力。Sentinel线程数限流不负责创建和管理线程池，而是简单统计当前请求上下文的线程个数，如果超出阈值，新的请求会被立即拒绝

**测试案例**：

修改流控规则，阈值类型为线程数，单机阈值为2，后台接口设置当前线程睡眠10秒钟。此时，访问快速刷新接口，发现已被限流。

## 流控模式之关联

当指定接口关联的接口达到限流条件时，将对指定接口开启限流。

此方式适合做应用让步，比如对数据库同一个字段的读操作和写操作存在争抢，读的速度过高会影响写得速度，写的速度过高会影响读的速度。如果放任读写操作争抢资源，则争抢本身带来的开销会降低整体的吞吐量。可使用关联限流来避免具有关联关系的资源之间过度的争抢，举例来说，read_db 和 write_db 这两个资源分别代表数据库读写，我们可以给 read_db 设置限流规则来达到写优先的目的

**测试案例**：

当接口test1每秒访问量达到5时，/test接口将被限流无法访问。

## 流控模式之链路

**链路流控模式**: 针对资源链路上的接口进行限流，例如：A、B两个接口都调用某一资源C，A->C、B->C可以看成两个简单的链路，此时可以针对C配置链路限流，比如限制A调用C，而B调用C则不受影响，它的功能有点类似于针对 来源配置项，而链路流控是针对上级接口，它的粒度 更细。

**测试案例**：两个测试接口，调用同一service资源，对其中一个调用链路进行流控

**1、** 测试接口；

```java
import org.pearl.test.sentinel.service.TestService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
/**
 * Created by TD on 2020/12/18
 */
@RestController
public class TestController  {
    @Autowired
    TestService testService;
    @GetMapping("/test")
    public String test() throws InterruptedException {
        testService.test();
        System.out.println("====");
        return "test";
    }
    @GetMapping("/test1")
    public String test1(){
        testService.test();
        System.out.println("====");
        return "test";
    }
}
```

**2、** service层；

```java
import com.alibaba.csp.sentinel.annotation.SentinelResource;
import org.springframework.stereotype.Service;
/**
 * Created by TD on 2020/12/20
 */
@Service
public class TestService {
    @SentinelResource(value = "service")
    public void test() {
        System.out.println("service");
    }
}
```

**3、** 配置文件；

```java
spring:
  application:
    name: pearl-test-sentinel
  cloud:
    sentinel:
      transport:
        port: 8719
        dashboard: localhost:8080
      控制是否收敛context；将其配置为 false 即可根据不同的URL 进行链路限流
      web-context-unify: false
```

**1、** 添加流控规则；

**2、** 测试：访问http://localhost:10001/test发现已被限流，而http://localhost:10001/test1则不受影响；

## 流控效果

### 快速失败

默认配置项， 直接失败，抛出异常，不做任何额外的处理，是最简单的效果。

### Warm Up

**预热/冷启动**：当流量突然增大的时候，我们常常会希望系统从空闲状态到繁忙状态的切换的时间长一些。即如果系统在此之前长期处于空闲的状态，我们希望处理请求的数量是缓步的增多，经过预期的时间以后，到达系统处理请求个数的最大值。Warm Up（冷启动，预热）模式就是为了实现这个目的的。

这个场景主要用于启动需要额外开销的场景，例如建立数据库连接等。

根据codeFactor（冷加载因子，默认为3）的值，即请求 QPS 从 threshold / 3 开始，经预热时长逐渐升至设定的 QPS 阈值 。

**测试案例**：对service资源进行链路线路，设置阈值为10。则刚访问此接口时，实际限流阈值为10/3，即为3，也就是刚开始的时候阈值只有3，当经过10s后，阈值才慢慢提高到10。

### 排队等待

让请求以均匀的速度通过，单机阈值为每秒通过数量，其余的排队等待； 它还会让设置一个超时时间，当请求超过超时间时间还未处理，则会被丢弃。

这种方式主要用于处理间隔性突发的流量，例如消息队列。想象一下这样的场景，在某一秒有大量的请求到来，而接下来的几秒则处于空闲状态，我们希望系统能够在接下来的空闲期间逐渐处理这些请求，而不是在第一秒直接拒绝多余的请求。

**测试案例**：

对service资源进行链路线路，设置阈值为10。设置流控效果为排队等候，每秒10次请求时，再有请求就排队等候，等待超时时间为10000ms, 超时过后，请求将被踢出排队队列，返回限流异常。
