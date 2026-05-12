# 37、SpringCloud Alibaba Seata（4）集成 Feign 测试 Seata
- 来源：https://ddkk.com/zhuanlan/j2ee/springcloudalibaba/2/70.html
- 分类：J2EE框架
- 分组：Spring Cloud Alibaba 教程 (A)
- 在上面的章节中，我们使用的时 Ribbon + RestTemplate 的形式做的远程调用。下面我们来演示 Feign 的调用方式

## 1.改造 business-service

### 1.1 添加依赖

修改 business-service 项目里面的 pom.xml 文件，在里面添加依赖

```xml
<dependencies> 
	<dependency> 
		<groupId>org.springframework.cloud</groupId> 
		<artifactId>spring-cloud-starter-openfeign</artifactId>
	</dependency> 
</dependencies>
```

### 1.2 添加 OrderServiceFeign

里面的代码如下：

```java
@FeignClient("order-service") 
public interface OrderServiceFeign {
	@GetMapping("/create/{userId}/{commodityCode}/{orderCount}") 
	ResponseEntity<Void> create( @PathVariable("userId") String userId, @PathVariable("commodityCode") String commodityCode, @PathVariable("orderCount") Integer orderCount); 
}
```

### 1.3 添加 StorageServiceFeign

```java
@FeignClient("storage-service")
public interface StorageServiceFeign {
	@GetMapping("/deduct/{commodityCode}/{orderCount}") 
	ResponseEntity<Void> deduct( @PathVariable("commodityCode") String commodityCode, @PathVariable("orderCount") Integer orderCount ) ; 
}
```

### 1.5 改造 OrderService

```java
@Service 
public class OrderService {
	private static Logger logger = LoggerFactory.getLogger(StorageService.class) ;
	//1.采用 Ribbon 的形式
	@Autowired 
	private RestTemplate restTemplate ;
	@Autowired 
	private OrderServiceFeign orderServiceFeign ;
	//2.采用 Feign 的形式
	public void create(String userId, String commodityCode, int orderCount){
		ResponseEntity<Void> entity = orderServiceFeign.create(userId, commodityCode, orderCount);
		if (entity.getStatusCode()== HttpStatus.OK){
			logger.info("订单创建成功，用户为{} ，商品编号为{}，本次扣减的数量为{}",userId , commodityCode,orderCount);
			return;
		}
		throw new RuntimeException("订单创建失败") ;
	}
}
```

### 1.6 在启动类里面开启对 Feign 的支持

### 1.7 改造 StorageService

代码如下：

```java
@Service 
public class StorageService {
	private static Logger logger = LoggerFactory.getLogger(StorageService.class);
	//1.采用 Ribbon 的形式
	@Autowired 
	private RestTemplate restTemplate;
	@Autowired 
	private StorageServiceFeign storageServiceFeign;
	//2.采用 Feign 的形式
	public void deduct(String commodityCode, int orderCount) {
		ResponseEntity<Void> entity = storageServiceFeign.deduct(commodityCode, orderCount);
		if (entity.getStatusCode() == HttpStatus.OK) {
			logger.info("扣减库存成功，商品编号为{}，本次扣减的数量为{}", commodityCode, orderCount);
			return;
		}
		throw new RuntimeException("扣减库存失败");
	}
}
```

## 2.改造 order-service

### 2.1 添加依赖

在 dependencies 添加：

```xml
<dependency> 
	<groupId>org.springframework.cloud</groupId> 
	<artifactId>spring-cloud-starter-openfeign</artifactId> 
</dependency>
```

### 2.2 添加接口

里面的代码如下：

```java
@FeignClient("account-service") 
public interface AccountServiceFeign {
	@GetMapping("/debit/{userId}/{orderMoney}") 
	ResponseEntity<Void> debit( @PathVariable("userId") String userId, @PathVariable("orderMoney") Integer orderMoney ) ; 
}
```

### 2.3 修改 AccoutService

```java
//实现对账号服务的远程调用
@Service 
public class AccountService {
	private static Logger logger = LoggerFactory.getLogger(AccountService.class) ;
	//1.ribbon 的方式
	@Autowired 
	private RestTemplate restTemplate ;
	@Autowired 
	private AccountServiceFeign accountServiceFeign ;
	//2.feign 的方式
	public void debit(String userId, int orderMoney) {
		ResponseEntity<Void> entity = accountServiceFeign.debit(userId, orderMoney);
		if(entity.getStatusCode()== HttpStatus.OK){
			logger.info("扣减用户{}金额成功，本次扣减的数目为{}",userId,orderMoney);
			return ;
		}
		logger.info("扣减用户{}金额失败",userId);
		throw new RuntimeException("扣减金额失败") ;
	}
}
```

### 2.4 在启动类里面添加对 Feign 的支持

## 3.重启测试

- 重启 order-service ，business-service
- 还原数据库数据，开始测试。
- 正常下单测试：

使用 DQCGM_USER_2 下单：

- 出错了，但是数据库的各个表都正常。
- Seata 测试成功了
