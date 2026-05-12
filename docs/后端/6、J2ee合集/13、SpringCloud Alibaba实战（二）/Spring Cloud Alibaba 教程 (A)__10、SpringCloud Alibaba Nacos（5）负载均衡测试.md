# 10、SpringCloud Alibaba Nacos（5）负载均衡测试
- 来源：https://ddkk.com/zhuanlan/j2ee/springcloudalibaba/2/43.html
- 分类：J2EE框架
- 分组：Spring Cloud Alibaba 教程 (A)
当服务压力突然变大时，我们需要通过对服务进行弹性伸缩和动态的扩容，让服务展示更强的并发能力和容错能力

## 1.修改服务提供者的数据接口

修改服务提供者的接口，可以让我们很清晰的看到，我们当前调用的是那一台服务提供者。让我们来修改 provider 里面 EchoController 这个类

代码如下：

```java
@RestController
public class EchoController {
	@Value("${server.port}")
	private Integer port ;
	@GetMapping("/echo/{message}")
	public ResponseEntity<String> echo(@PathVariable("message") String message){
		return ResponseEntity.ok(String.format("hello,%s,我是服务提供者:%s",message,port)) ;
	}
}
```

- 因为我们在同一台机器上启动多个服务提供者，那服务提供者的端口肯定不相同，我们在此使用 port 作为服务提供者的唯一标示。
- @Value : 从 env 里面注入这个值

## 2.启动多个服务的提供者

先停止所有的服务：

在启动一个服务的提 供者：

启动成功后：

启动其他 1 个：

进入编辑页面：

**2 个操作：**

- Name：不能重复，这里我修改为 ProviderApplication-2
- Program arguments：–server.port=8081 这句话的意思是，在启动该服务时，添加一个变量: server.port=8081 ，类似我们使用这样的命令启动：

java -jar xxx.jar --server.port=8081
- –server.port 该值将会被添加到 spring 的 env 里面，并且该方式的优先级高于 application.yml 里面的配置值。所以，系统会使用该 port 来启动服务。
- 修改完毕后，点击 ok
- 现在启动我们的复制的 ProviderApplicaton-2:

观察 Nacos 里面的数据：

服务：provider-service 已经有 2 个实例了，点击详情：

可以手动的下线该服务。

## 3.测试负载均衡

修改 consumer 里面的 ConsumerApplication ，在里面的末尾添加如下的代码：

```java
@Autowired
private LoadBalancerClient loadBalancerClient ;
@GetMapping("/choose/{serviceName}")
public ResponseEntity<String> choose(@PathVariable("serviceName") String serviceName){
	ServiceInstance instance = loadBalancerClient.choose(serviceName);
	System.out.println(String.format("本次选择的实例为：%s:%s",instance.getHost(),instance.getPort()));
	return ResponseEntity.ok(instance.getHost()+":"+instance.getPort()) ;
}
```

**其中：**

- LoadBalancerClient ：Ribbon 提供给我们最外层的接口，使用它我们可以很轻易的实现负载均衡
- LoadBalancerClient.choose(serviceName)：通过给定的服务名称，Ribbon 底层通过负载均衡的算法得到一个可以进行远程的实例。
- 现在，启动 Consumer 进行测试：
- 在浏览器里面输入：

http://localhost:8090/choose/provider-service

得到：

刷新页面：

并且后台输出：

发现负载均衡已经完成

## 4.更简单的远程调用测试

在之前，我们在 consumer 使用 RestTemplate 调用 provider 时，手动实现了负载均衡，url 的拼接：

- 代码相当的冗余。现在，我们使用 Ribbon 的方式来实现：
- 在注入 RestTemplate 的方法上添加注解:

远程调用的代码变为：

```java
@GetMapping("/rpc/ribbon/{message}")
public ResponseEntity<String> rpcByRibbon(@PathVariable("message") String message){
	ResponseEntity<String> responseEntity = restTemplate.getForEntity("http://provider-service/echo/" + message,String.class);
	if(responseEntity.getStatusCode()==HttpStatus.OK){
		return ResponseEntity.ok("调用成功，provider-service 相应给我们的数据为："+responseEntity.getBody()) ;
	}
	return ResponseEntity.badRequest().body("调用失败，provider-service 的相应码为："+responseEntity.getStatusCode()) ;
}
```

- 重启 consumer 测试：
- 在浏览器里面输入：

http://localhost:8090/rpc/ribbon/{message}

刷新测试：

负载均衡已经完成了
