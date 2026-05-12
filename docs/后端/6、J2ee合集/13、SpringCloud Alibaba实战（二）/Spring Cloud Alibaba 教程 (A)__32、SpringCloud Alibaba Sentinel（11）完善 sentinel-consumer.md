# 32、SpringCloud Alibaba Sentinel（11）完善 sentinel-consumer
- 来源：https://ddkk.com/zhuanlan/j2ee/springcloudalibaba/2/65.html
- 分类：J2EE框架
- 分组：Spring Cloud Alibaba 教程 (A)
## 1.调用服务提供者

代码如下：

```java
@RestController 
public class BuyController {
	@Autowired 
	private RestTemplate restTemplate;
	@GetMapping("buy/{name}/{count}")
	@SentinelResource(value = "buy", fallback = "buyFallback", blockHandler = "buyBlock")
	public ResponseEntity<String> buy(@PathVariable String name, @PathVariable Integer count) {
		if (count >= 20) {
			throw new IllegalArgumentException("购买数量过多"); 
		}
		if ("miband".equalsIgnoreCase(name)) {
			throw new NullPointerException("已售罄"); 
		}
		Map<String, Object> params = new HashMap<>(2); 
		params.put("name", name); 
		params.put("count", count);
		return ResponseEntity.ok(this.restTemplate.getForEntity("http://sentinel-provider/goods/buy/{name}/{count}", String.class, params).getBody());
	}
	// 异常回退
	public ResponseEntity<String> buyFallback(@PathVariable String name,@PathVariable Integer count, Throwable throwable) {
		return ResponseEntity.ok( String.format("【进入 fallback 方法】购买%d 份%s 失败，%s", count,name, throwable.getMessage())); 
	}
	// sentinel 回退
	public ResponseEntity<String> buyBlock(@PathVariable String name,@PathVariable Integer count, BlockException e) {
		return ResponseEntity.ok(String.format("【进入 blockHandler 方法】购买%d份%s 失败，当前购买人数过多，请稍后再试", count, name));
	}
}
```

## 2.添加配置文件

新建配置文件：

内容如下：

```sh
server: 
	port: 8083
spring: 
	application:
		name: sentinel-consumer
	cloud: 
		nacos: 
			discovery: 
				server-addr: localhost:8848
			sentinel: 
				transport: 
					dashboard: localhost:8080 
					port: 8719
```

## 3.添加启动类

```java
@SpringBootApplication 
@EnableDiscoveryClient 
public class SentinelConsumerApplication {
	public static void main(String[] args) {
		SpringApplication.run(SentinelConsumerApplication.class ,args) ; 
	}
	@LoadBalanced 
	@Bean 
	public RestTemplate restTemplate(){
		return new RestTemplate() ; 
	} 
}
```

## 4.启动测试

### 4.1 启动软件

**在启动之前，必须保证这些软件已经启动：**

- Nacos-Server
- Sentinel-Dashboard
- Sentinel-provider
- 准备就绪后，启动 sentine-consumer：

访问接口测试：

http://192.168.1.11:8083/buy/huawei/1

### 4.2 添加流控的规则

当访问该资源，QPS 超过 2 时，抛出异常

测试：

http://192.168.1.11:8083/buy/huawei/1
