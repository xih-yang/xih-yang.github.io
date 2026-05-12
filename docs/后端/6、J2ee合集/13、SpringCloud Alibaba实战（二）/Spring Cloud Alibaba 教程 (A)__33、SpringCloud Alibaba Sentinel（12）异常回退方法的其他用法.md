# 33、SpringCloud Alibaba Sentinel（12）异常回退方法的其他用法
- 来源：https://ddkk.com/zhuanlan/j2ee/springcloudalibaba/2/66.html
- 分类：J2EE框架
- 分组：Spring Cloud Alibaba 教程 (A)
## 1.说明

在当前类中编写回退方法会使得代码变得冗余耦合度高，我们可以将回退方法抽取出来到一个指定类中

## 2.新增 BuyBlockHandler

代码如下：

```java
public class BuyBlockHandler {
	// sentinel 回退 
	public static String buyBlock(@PathVariable String name, @PathVariable Integer count, BlockException e) {
		return String.format("【进入 blockHandler 方法】购买%d 份%s 失败，当前购买人数过多，请稍后再试", count, name); 
	} 
}
```

## 3.新增 BuyFallBack

代码如下：

```java
public class BuyFallBack {
	// sentinel 回退 
	public static ResponseEntity<String> buyBlock(@PathVariable String name, @PathVariable Integer count, BlockException e) {
		return ResponseEntity.ok(String.format("【进入 BuyFallBack 方法】购买%d份%s 失败，当前购买人数过多，请稍后再试", count, name)); 
	} 
}
```

## 4.改造 BuyController

```java
@RestController 
public class BuyController {
	@Autowired 
	private RestTemplate restTemplate;
	@GetMapping("buy/{name}/{count}")
	@SentinelResource( value = "buy", fallback = "buyFallback", fallbackClass = BuyFallBack.class , blockHandler = "buyBlock", blockHandlerClass = BuyBlockHandler.class , )
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
		return ResponseEntity.ok( this.restTemplate.getForEntity("http://sentinel-provider/goods/buy/{name}/{count}", String.class, params).getBody());
	}
}
```
