# 25、SpringCloud Alibaba Sentinel（4）流控规则
- 来源：https://ddkk.com/zhuanlan/j2ee/springcloudalibaba/2/58.html
- 分类：J2EE框架
- 分组：Spring Cloud Alibaba 教程 (A)
- 流量的控制规则。
- 在簇点链路列表中，点击/hello 后面的流控按钮：

出现：

- 资源名：标识资源的唯一名称，默认为请求路径，也可以在客户端中使用 @SentinelResource 配置；
- 针对来源： Sentinel 可以针对服务调用者进行限流，填写微服务名称即 spring.application.name，默认为 default，不区分来源；

**阈值类型、单机阈值**

QPS（Queries-per-second，每秒钟的请求数量）：当调用该 api 的 QPS 达到阈值的时候，进行限流；

线程数：当调用该 api 的线程数达到阈值的时候，进行限流

是否集群：默认不集群；

**流控模式**

直接：当 api 调用达到限流条件的时，直接限流；

关联：当关联的资源请求达到阈值的时候，限流自己；

链路：只记录指定链路上的流量（指定资源从入口资源进来的流量，如果达到阈值，则进行限流）。

**流控效果**

快速失败：直接失败；

Warm Up：根据 codeFactor（冷加载因子，默认值为 3）的值，从阈值/codeFactor，经过预热时长，才达到设置的 QPS 阈值；

排队等待：匀速排队，让请求匀速通过，阈值类型必须设置为 QPS，否则无效。

## 1.QPS 直接失败

演示下 QPS 直接失败设置及效果。点击簇点链路列表中/hello 请求后面的流控按钮：

上面设置的效果是，1 秒钟内请求/hello 资源的次数达到 2 次以上的时候，进行限流。点击新增完成该规则的设置。

现在，在浏览器访问：

http://localhost:8085/hello

当手速快点的时候（1 秒超过 2 次），页面返回 Blocked by Sentinel (flow limiting)。并且响应码为 429

## 2.线程数直接失败

### 2.1 添加接口

在 TestController 里面新建一个接口

```java
//线程直接失败
@GetMapping("/thread")
public ResponseEntity<String> threadMode() throws InterruptedException {
	TimeUnit.SECONDS.sleep(1);
	return ResponseEntity.ok("hello,sentinel!") ;
}
```

- 其中，我们添加了：

TimeUnit.SECONDS.sleep(1);
- 让线程睡 1s ，这样，更容易触发规则
- 重启项目
- 访问我们添加的 thread 的接口：

http://localhost:8085/thread

发现，页面需要等待 1s 左右才会响应，这是线程 sleep 的效果。

### 2.2 新增流控规则

点击新增，完成创建

### 2.3 测试该规则

浏览器快速的访问：

http://localhost:8085/thread

## 3.关联

访问某个接口达到一定的流控规则后，开始限制本接口

### 3.1 在 TestController 里面添加 api 接口

```java
@GetMapping("/test1") 
public ResponseEntity<String> test1(){
	return ResponseEntity.ok("hello,test1") ; 
}
@GetMapping("/test2") 
public ResponseEntity<String> test2(){
	return ResponseEntity.ok("hello,test2") ; 
}
```

重启项目，正常的访问 test1，test2 测试：

### 3.2 添加规则

我们想让 test1 关联 test2，也就是说，访问 test2 接口达到某种规则后，开始限流 test1

上述流控规则表示：当 1 秒内访问/test2 的次数大于 2 的时候，限流/test1

### 3.3 测试规则

我们使用打开 2 个网页，密集访问/test2，然后我们手动浏览器请求/test1，看看效果

访问 test1：

发现已经开始限流了

## 4.链路

程序的调用可以看成为一条链路。当触发链路的某条规则后，该链路被限流

上图从 API 出发，可以发现有 2 条链路，分别为：

Link1–>hello–>other

Link2–>hello–>other

2 条链路在调用上，限流规则互补影响。

### 4.1 添加一个 Service

名称为（service.TestService）

代码为：

```java
@Service 
public class TestService {
	public String hello(){
		return "hello" ; 
	} 
}
```

### 4.2 添加接口

```java
@Autowired 
private TestService testService ;
@GetMapping("/link1") 
public ResponseEntity<String> link1(){
	return ResponseEntity.ok( String.format("link1,调用 test,结果为%s",testService.hello())) ; 
}
@GetMapping("/link2") 
public ResponseEntity<String> lin2(){
	return ResponseEntity.ok(String.format("link2,调用 test,结果为%s",testService.hello())) ; 
}
```

### 4.3 声明资源

我们现在把 TestService 里面的 hello 方法变成一个资源：

- 注意：
- @SentinelResource(“hello”)将该方法标识为一个 sentinel 资源，名称为 hello。然后重启测试：

### 4.4 添加链路规则

点击簇点链路：

此时我们给 hello 该资源限流：

- 在入口资源，我们使用的是 link1，点击新增，完成对规则的添加。
- 上述配置的意思是，当通过/link1 访问 hello 的时候，QPS 大于 2 则进行限流；言外之意就是 /link 访问 hello 请求并不受影响。

### 4.5 测试该规则

打开 link1 ，link2 接口。

快速访问 link1，再访问 link2：

访问测试 n 次，发现还是不能成功。难受！

[具体的错误](https://github.com/alibaba/sentinel/issues/1213)

## 5.预热 Warm Up

- 流控效果除了直接失败外，我们也可以选择预热 Warm Up。
- Warm Up（RuleConstant.CONTROL_BEHAVIOR_WARM_UP）方式，即预热/冷启动方式。当系统长期处于低水位的情况下，当流量突然增加时，直接把系统拉升到高水位可能瞬间把系统压垮。通过”冷启动”，让通过的流量缓慢增加，在一定时间内逐渐增加到阈值上限，给冷系统一个预热的时间，避免冷系统被压垮
- sentinel 客户端的默认冷加载因子 coldFactor 为 3，即请求 QPS 从 threshold / 3 开始，经预热时长逐渐升至设定的 QPS 阈值
- 比如：我们给 hello 资源设置该规则。

- 上面的配置意思是：对于/hello 资源，一开始的 QPS 阈值为 3，经过 10 秒后，QPS 阈值达到 10。
- 新增完成后：

- 快速访问/hello

http://localhost:8085/hello

查看：

过程类似于下图：

前期在预热环境，突然的高 QPS 会导致系统直接拒绝访问，慢慢地，开始大量的介绍新的请求

最快的手速点刷新，一开始会常看到 Blocked by Sentinel (flow limiting)的提示，10 秒后几乎不再出现（因为你的手速很难达到 1 秒 10 下）。

## 6.排队等待

- 排队等待方式不会拒绝请求，而是严格控制请求通过的间隔时间，也即是让请求以均匀的速度通过
- 在 TestController 里面添加接口：

```java
private static Logger logger = LoggerFactory.getLogger(TestController.class) ;
@GetMapping("/queue") 
public ResponseEntity<String> queue(){
	logger.info("开始处理请求"); 
	return ResponseEntity.ok("ok") ; 
}
```

重启项目并且访问 queue 接口：

给 queue 添加一个限流规则：

点击新增完成创建

- 快速访问 queue 接口，观察后台的打印：
- 上述配置的含义是，访问/queue 请求每秒钟最多只能 1 次，超过的请求排队等待，等待超过 2000 毫秒则超时。新增该规则后，多次快速访问 localhost:8081/test1，sentinel 客户端控制台日志打印如下：
