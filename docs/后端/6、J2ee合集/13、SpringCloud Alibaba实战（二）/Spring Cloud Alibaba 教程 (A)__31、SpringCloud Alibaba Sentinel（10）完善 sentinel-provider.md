# 31、SpringCloud Alibaba Sentinel（10）完善 sentinel-provider
- 来源：https://ddkk.com/zhuanlan/j2ee/springcloudalibaba/2/64.html
- 分类：J2EE框架
- 分组：Spring Cloud Alibaba 教程 (A)
我们在 provider 里面添加一个模拟数据接口。

## 1.添加一个数据接口

代码如下：

```java
@RestController 
public class GoodsController {
	@GetMapping("/goods/buy/{name}/{count}") 
	public ResponseEntity<String> buy( @PathVariable("name") String name, @PathVariable("count") Integer count) {
		return ResponseEntity.ok(String.format("购买%d份%s", count, name)); 
	} 
}
```

## 2.添加配置文件

```sh
server: 
	port: 8081
spring: 
	application: 
		name: sentinel-provider
	cloud: 
		nacos: 
			discovery: 
				server-addr: localhost:8848
```

仅仅是为了让服务能注册到注册中心而已

## 3.添加一个启动类

代码如下：

```java
@SpringBootApplication 
@EnableDiscoveryClient 
public class SentinelProviderApplication {
	public static void main(String[] args) {
		SpringApplication.run(SentinelProviderApplication.class ,args) ; 
	} 
}
```

## 4.启动测试

在启动之前，我们必须保证 Nacos 已经启动成功

测试接口：

http://localhost:8081/goods/buy/huawei/1
