# 7、Hystrix Timeout机制
- 来源：https://ddkk.com/zhuanlan/guarantee/hystrix/7.html
- 分类：服务保障
- 分组：Hystrix 之 使用教程（A）
因为在一个复杂的系统里，可能你的依赖接口的性能很不稳定，有时候2ms，200ms，2s，如果你不对各种依赖接口的调用做超时的控制来给你的服务提供安全保护措施，那么很可能你的服务就被依赖服务的性能给拖死了，大量的接口调用很慢，大量线程就卡死了。

## 1、execution.isolation.thread.timeoutInMilliseconds

手动设置timeout时长，一个command运行超出这个时间，就被认为是timeout，然后将hystrix command标识为timeout，同时执行fallback降级逻辑，默认是1000，也就是1000毫秒。

```java
HystrixCommandProperties.Setter().withExecutionTimeoutInMilliseconds(int value)
```

## 2、execution.timeout.enabled

控制是否要打开timeout机制，默认是true

```java
HystrixCommandProperties.Setter().withExecutionTimeoutEnabled(boolean value)
```

```java
/**
 * 获取商品信息
 * @author 张三丰
 *
 */
public class GetProductInfoCommand extends HystrixCommand<ProductInfo> {
    private Long productId;
    public GetProductInfoCommand(Long productId) {
        super(Setter.withGroupKey(HystrixCommandGroupKey.Factory.asKey("ProductInfoService"))
            .andCommandKey(HystrixCommandKey.Factory.asKey("GetProductInfoCommand"))
            .andThreadPoolKey(HystrixThreadPoolKey.Factory.asKey("GetProductInfoPool"))
            .andThreadPoolPropertiesDefaults(HystrixThreadPoolProperties.Setter()
            .withCoreSize(10)
            .withMaxQueueSize(12)
            .withQueueSizeRejectionThreshold(15)) 
            .andCommandPropertiesDefaults(HystrixCommandProperties.Setter()
            .withCircuitBreakerRequestVolumeThreshold(30)
            .withCircuitBreakerErrorThresholdPercentage(40)
            .withCircuitBreakerSleepWindowInMilliseconds(3000)
            .withExecutionTimeoutInMilliseconds(500)//超时时间500毫秒
            .withFallbackIsolationSemaphoreMaxConcurrentRequests(30))  
            );  
        this.productId = productId;
    }
    @Override
    protected ProductInfo run() throws Exception {
        System.out.println("调用接口，查询商品数据，productId=" + productId); 
        if(productId.equals(-2L)) {
            Thread.sleep(3000);  
        }
        return JSONObject.parseObject("数据", ProductInfo.class);  
    }
    @Override
    protected ProductInfo getFallback() {
        ProductInfo productInfo = new ProductInfo();
        productInfo.setName("降级商品");  
        return productInfo;
    }
}
```
