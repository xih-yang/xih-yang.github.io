# 6、Hystrix 断路器
- 来源：https://ddkk.com/zhuanlan/guarantee/hystrix/6.html
- 分类：服务保障
- 分组：Hystrix 之 使用教程（A）
## 断路器工作原理

**1、** 如果经过断路器的流量超过了一定的阈值，HystrixCommandProperties.circuitBreakerRequestVolumeThreshold()；

举个例子，比如要求在10s内，经过断路器的流量必须达到20个（需要设置），这个时候Hystrix会开启断路器；如果在10s内，经过断路器的流量才10个，那么根本不会去判断要不要断路。

**2、** 如果断路器统计到的异常调用的占比超过了一定的阈值，HystrixCommandProperties.circuitBreakerErrorThresholdPercentage()；

如果达到了上面的要求，比如说在10s（时间窗口）内，经过断路器的流量（只要执行一个command，这个请求就一定会经过断路器）达到了30个；或者在10秒（时间窗口）内异常的访问数量，占到了一定的比例（需要设置），比如60%的请求都是异常（报错，timeout，reject（比如信号量或线程池已满）），这时候会开启断路。

**3、** 这时候断路器从close状态转换到open状态；

**4、** 断路器打开的时候，所有经过该断路器的请求全部被断路，不调用后端服务，直接走fallback降级；

**5、** 经过了一段时间之后，HystrixCommandProperties.circuitBreakerSleepWindowInMilliseconds()，断路器会进入半开状态（half-open），让一条请求经过断路器，看能不能正常调用如果调用成功了，那么就自动恢复，转到close状态；断路器，会自动恢复的；

**6、** circuitbreaker短路器的配置；

## circuitBreaker.enabled

控制短路器是否允许工作，包括跟踪依赖服务调用的健康状况，以及对异常情况过多时是否允许触发短路，默认是true

```java
HystrixCommandProperties.Setter().withCircuitBreakerEnabled(boolean value)//控制是否开启断路器
```

## circuitBreaker.requestVolumeThreshold

设置一个rolling window，滑动窗口中，最少要有多少个请求时，才触发开启短路

举例来说，如果设置为20（默认值），那么在一个10秒的滑动窗口内，如果只有19个请求，即使这19个请求都是异常的，也是不会触发开启断路器的。

```java
HystrixCommandProperties.Setter().withCircuitBreakerRequestVolumeThreshold(int value)
```

## circuitBreaker.sleepWindowInMilliseconds

设置断路器之后，需要在多长时间内直接reject请求（走降级），然后在这段时间之后，再重新进入到holf-open状态，尝试允许请求通过以及自动恢复，默认值是5000毫秒

```java
HystrixCommandProperties.Setter().withCircuitBreakerSleepWindowInMilliseconds(int value)
```

## circuitBreaker.errorThresholdPercentage

设置异常请求量的百分比，当异常请求达到这个百分比时，就触发打开断路器，默认是50，也就是50%

```java
HystrixCommandProperties.Setter().withCircuitBreakerErrorThresholdPercentage(int value)
```

## circuitBreaker.forceOpen

如果设置为true的话，直接强迫打开断路器，相当于是手动短路了，手动降级，默认false

```java
HystrixCommandProperties.Setter().withCircuitBreakerForceOpen(boolean value)
```

## circuitBreaker.forceClosed

如果设置为true的话，直接强迫关闭断路器，相当于是手动停止短路了，手动升级，默认false

```java
HystrixCommandProperties.Setter().withCircuitBreakerForceClosed(boolean value)
```

代码：

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
        .withCoreSize(15)
        .withQueueSizeRejectionThreshold(10))
        .andCommandPropertiesDefaults(HystrixCommandProperties.Setter()
        .withCircuitBreakerRequestVolumeThreshold(30)//10秒内有30个请求时，触发断路器
        .withCircuitBreakerErrorThresholdPercentage(40)//当异常达到百分之40时，触发断路器
        .withCircuitBreakerSleepWindowInMilliseconds(3000))//在3秒内直接refect请求走降级，3秒过后进入半开状态
        );  
        this.productId = productId;
    }
    @Override
    protected ProductInfo run() throws Exception {
        System.out.println("调用接口，查询商品数据，productId=" + productId); 
        if(productId.equals(-1L)) {
            throw new Exception();
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

## 断路实验：

```java
public class CircuitBreakerTest {
    public static void main(String[] args) throws Exception {
        for(int i = 0; i < 15; i++) {
            String response = HttpClientUtils.sendGetRequest("http://localhost:8081/getProductInfo?productId=1");  
            System.out.println("第" + (i + 1) + "次请求，结果为：" + response);  
        }
        for(int i = 0; i < 25; i++) {
            String response = HttpClientUtils.sendGetRequest("http://localhost:8081/getProductInfo?productId=-1");  
            System.out.println("第" + (i + 1) + "次请求，结果为：" + response);  
        }
        Thread.sleep(5000);
        // 等待了5s后，时间窗口统计了，发现异常比例超过百分之40，就断路了
        for(int i = 0; i < 10; i++) {
            String response = HttpClientUtils.sendGetRequest("http://localhost:8081/getProductInfo?productId=-1");  
            System.out.println("第" + (i + 1) + "次请求，结果为：" + response);  
        }
        // Hystrix的统计单位是时间窗口，我们必须要等到那个时间窗口过了以后，hystrix才会看一下最近的这个时间窗口的异常情况
        // 比如说，最近的10秒内，有多少条数据，其中异常的数据有没有到一定的比例
        // 如果到了一定的比例，那么才会去短路
        System.out.println("尝试等待3秒钟。。。。。。进入半开状态");  
        Thread.sleep(3000); 
        for(int i = 0; i < 10; i++) {
            String response = HttpClientUtils.sendGetRequest("http://localhost:8081/getProductInfo?productId=1");  
            System.out.println("第" + (i + 1) + "次请求，结果为：" + response);  
        }
    }
```
