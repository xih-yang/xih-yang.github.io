# 09、SpringCloud Alibaba Nacos（4）使用 Nacos 做注册中心-5100字匠心出品
- 来源：https://ddkk.com/zhuanlan/j2ee/springcloudalibaba/2/42.html
- 分类：J2EE框架
- 分组：Spring Cloud Alibaba 教程 (A)
## 1.provider 项目的完善

Provider 现在还是一个空的项目，里面没有任何的数据接口

### 1.1 添加一个 application.yml 配置文件

我们给 provider 添加一个配置文件：

文件的名称为：

完成创建后，IDEA 能自动的识别该 yml 文件

编辑该配置文件，添加如下的配置：

```sh
server: 
	port: 8080
spring: 
	application: 
		name: provider-service
	cloud: 
		nacos: 
			discovery: 
				server-addr: localhost:8848
```

**配置说明：**

- server.port provider 服务端口为 8001 ;
- spring.application.name 服务名称为 provider-service;
- spring.cloud.nacos.server-addr ，指定 Nacos 注册中心的地址;

### 1.2 添加一个启动类

Provider 还没有启动类，我们需要给他添加一个。

名称为：com.dqcgm.ProviderApplication

com.dqcgm为包名，ProviderApplicaton 为类的名称，创建完成后，自动的出现：

在该类里面添加如下的代码：

```java
@SpringBootApplication // 标记为 SpringBoot 的应用
@EnableDiscoveryClient // 启用服务发现的功能
public class ProviderApplication {
	public static void main(String[] args) {
		SpringApplication.run(ProviderApplication.class,args) ;
	}
}
```

### 1.3 添加一个 API 接口

- 提供者通过提供 API 接口供服务提供者调用。
- 在 provider 里面创建一个类：

名称为 controller.EchoController

成功后，如下图所示：

添加一个接口：

```java
@RestController
public class EchoController {
	@GetMapping("/echo/{message}")
	public ResponseEntity<String> echo(@PathVariable("message") String message){
		return ResponseEntity.ok(String.format("hello,%s",message)) ;
	}
}
```

- 该接口将会对访问的人输入一个 hello,xxx

### 1.4 启动 provider 测试

- 发现 provider 已经启动成功了。
- 打开 Nacos 页面观察 provider 是否上线：

服务的提供者已经成功的上线了。

## 2.consumer 项目的完成

Consumer 现在还是一个空的项目，里面没有任何的数据接口，也没有对服务的提供者进行调用

### 2.1 添加一个 application.yml 配置文件

名称为：application.yml

IDEA 能自动的识别该配置文件的：

编辑该文件，给该文件添加如下的配置信息：

```sh
server: 
	port: 8090
spring: 
	application: 
		name: consumer-service
	cloud: 
		nacos: 
			discovery: 
				server-addr: localhost:8848
```

### 2.2 添加一个启动类

Consumer 现在还没有任何的启动类，我们需要给他添加一个

名称为：com.dqcgm.ConsumerApplication

创建成功后，如下图所示：

在该类里面添加如下代码：

```java
@SpringBootApplication // 标记为 SpringBoot 的应用
@EnableDiscoveryClient // 开启服务的发现功能
public class ConsumerApplication {
	public static void main(String[] args) {
		SpringApplication.run(ConsumerApplication.class,args) ;
	}
}
```

### 2.3 服务发现的测试

继续改造启动类，在里面添加如下代码：

```java
@Autowired
private DiscoveryClient discoveryClient ;// 快速服务的发现
@GetMapping("/discovery/{serviceName}")
public ResponseEntity<List<String>> discovery(@PathVariable("serviceName") String serviceName){
	//通过服务的 ID / 名称得到服务的实例列表
	List<ServiceInstance> instances = discoveryClient.getInstances(serviceName);
	if(instances==null || instances.isEmpty()){
		return ResponseEntity.notFound().build() ;
	}
	List<String> services = new ArrayList<>(instances.size());
	instances.forEach(instance->{
		services.add(instance.getHost()+":"+instance.getPort());
	});
	return ResponseEntity.ok(services) ;
}
```

因为我们在启动类里面添加了接口，所以要必须添加@RestController 该注解来标记该类：

最后，我们启动 consumer-service 项目：

观察 consumer-service 是否成功的注册到了 Nacos 上面：

Consumer-service 已经成功了上线了

在浏览器输入：

http://localhost:8090/discovery/provider-service

其中：provider-service 代表服务的名称

服务器给我们响应：

代表服务已经发现成功

输入一个不存在的服务名称：

http://localhost:8090/discovery/provider

服务器给我们响应：

代表，该服务还没有服务的提供者

### 2.4 远程调用的测试

- 在 consumer，我们调用 provider 里面的 echo 接口
- 继续改造我们的启动类，注册一个 RestTemplate 对象：

```java
//在容器里面注入一个 RestTempalte 对象
@Bean
public RestTemplate restTemplate(){
	return new RestTemplate() ;
}
```

- 调用测试：

```java
@Autowired
private RestTemplate restTemplate ;
@GetMapping("/rpcv1/{message}")
public ResponseEntity<String> rpcV1(@PathVariable("message") String message){
	ResponseEntity<String> responseEntity = restTemplate.getForEntity(
		"http://localhost:8081/echo/{message}",
		String.class,
		message
	);
	if(responseEntity.getStatusCode()==HttpStatus.OK){
		return ResponseEntity.ok(String.format("远程调用成功，结果为%s",responseEntity.getBody())) ;
	}
	return ResponseEntity.badRequest().body("远程调用失败") ;
}
//优化服务提供方地址的灵活性
@GetMapping("/rpcv2/{message}")
public ResponseEntity<String> rpcV2(@PathVariable("message") String message){
	List<ServiceInstance> instances = discoveryClient.getInstances("nacos-provider");
	if(instances==null || instances.isEmpty()){
		return ResponseEntity.badRequest().body("当前服务没有服务的提供者") ;
	}
	ServiceInstance serviceInstance = instances.get(0);
	String instance = serviceInstance.getHost()+":"+serviceInstance.getPort() ;
	ResponseEntity<String> responseEntity = restTemplate.getForEntity(
		String.format("http://%s/echo/{message}",instance),
		String.class,
		message
	);
	if(responseEntity.getStatusCode()==HttpStatus.OK){
		return ResponseEntity.ok(String.format("远程调用成功，结果为%s",responseEntity.getBody())) ;
	}
	return ResponseEntity.badRequest().body("远程调用失败") ;
}
//优化服务提供方的负载均衡
@GetMapping("/rpcv3/{message}")
public ResponseEntity<String> rpcV3(@PathVariable("message") String message){
	List<ServiceInstance> instances = discoveryClient.getInstances("nacos-provider");
	if(instances==null || instances.isEmpty()){
		return ResponseEntity.badRequest().body("当前服务没有服务的提供者") ;
	}
	ServiceInstance serviceInstance = loadbalance(instances);
	System.out.println(serviceInstance);
	String instance = serviceInstance.getHost()+":"+serviceInstance.getPort() ;
	ResponseEntity<String> responseEntity = restTemplate.getForEntity(
		String.format("http://%s/echo/{message}",instance),
		String.class,
		message
	);
	if(responseEntity.getStatusCode()==HttpStatus.OK){
		return ResponseEntity.ok(String.format("远程调用成功，结果为%s",responseEntity.getBody())) ;
	}
	return ResponseEntity.badRequest().body("远程调用失败") ;
}
```

其中，loadBalance 的实现逻辑为：

```java
//从一个服务的实例列表里面选择一个服务的实例
private ServiceInstance loadbalance(List<ServiceInstance> instances) {
	Random random = new Random(System.currentTimeMillis());
	return instances.get(random.nextInt(instances.size())) ;
}
```

重启 Consummer-service：

在浏览器里面输入：

http://localhost:8090/rpc/world

服务器给我们相应的数据为：

远程调用已经成功
