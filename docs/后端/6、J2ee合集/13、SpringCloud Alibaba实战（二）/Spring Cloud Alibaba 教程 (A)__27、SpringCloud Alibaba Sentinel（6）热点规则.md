# 27、SpringCloud Alibaba Sentinel（6）热点规则
- 来源：https://ddkk.com/zhuanlan/j2ee/springcloudalibaba/2/60.html
- 分类：J2EE框架
- 分组：Spring Cloud Alibaba 教程 (A)
热点即经常访问的数据。很多时候我们希望统计某个热点数据中访问频次最高的数据，并对其访问进行限制

## 1.添加一个接口

```java
@GetMapping("/buy") 
@SentinelResource("buy") 
public ResponseEntity<String> buy(String prodName,Integer prodCount){
	return ResponseEntity.ok("买" + prodCount + "份" + prodName ); 
}
```

## 2.添加热点的规则

对这个资源添加热点规则：

上面的配置含义是：对 buy 资源添加热点规则，当第 0 个参数的值为华为的时候 QPS 阈值为 3，否则为 1。此外，如果第 0 个参数不传，那么这笔请求不受该热点规则限制

## 3.测试效果

不是华为：

买 1 次后，里面限流

是华为：同时买 3 次，才限流
