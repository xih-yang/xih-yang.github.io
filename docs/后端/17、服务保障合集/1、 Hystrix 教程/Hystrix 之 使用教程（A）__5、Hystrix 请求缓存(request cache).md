# 5、Hystrix 请求缓存(request cache)
- 来源：https://ddkk.com/zhuanlan/guarantee/hystrix/5.html
- 分类：服务保障
- 分组：Hystrix 之 使用教程（A）
## requestcontext：

**1、** 在一个请求执行之前，都必须先初始化一个requestcontext；

```java
HystrixRequestContext context = HystrixRequestContext.initializeContext();
```

然后在请求结束之后，需要关闭request context

```java
context.shutdown();
```

一般来说，在java web来的应用中，都是通过filter过滤器来实现的

## filter：

```java
/**
 * hystrix请求上下文过滤器
 * @author 张三丰
 *
 */
public class HystrixRequestContextFilter implements Filter {
    public void init(FilterConfig config) throws ServletException {
    }
    public void doFilter(ServletRequest request, ServletResponse response,
            FilterChain chain) throws IOException, ServletException {
        HystrixRequestContext context = HystrixRequestContext.initializeContext();
        try {
            chain.doFilter(request, response); 
        } catch (Exception e) {
            e.printStackTrace();
        } finally {
            context.shutdown();
        }
    }
    public void destroy() {
    }
}
```

## command：

```java
/**
 * 获取商品名称的command
 * @author 张三丰
 *
 */
public class GetProductNameCommand extends HystrixCommand<String> {
private Long productId;
public GetProductNameCommand(Long productId) {
        super(Setter.withGroupKey(HystrixCommandGroupKey.Factory.asKey("BrandInfoService"))
        .andCommandKey(HystrixCommandKey.Factory.asKey("GetproductNameCommand"))
        .andThreadPoolKey(HystrixThreadPoolKey.Factory.asKey("GetproductInfoPool"))
        .andThreadPoolPropertiesDefaults(HystrixThreadPoolProperties.Setter()//配置线程池
        .withCoreSize(15)
        .withQueueSizeRejectionThreshold(10))
        .andCommandPropertiesDefaults(HystrixCommandProperties.Setter()//配置信号量(这个参数设置了HystrixCommand.getFallback()最大允许的tomcat并发请求数量，默认值是10，也是通过semaphore信号量的机制去限流如果超出了这个最大值，那么直接被reject)
        .withFallbackIsolationSemaphoreMaxConcurrentRequests(15))
    );  
this.productId = productId;
}
    @Override
    protected String run() throws Exception {
        // 调用一个商品服务的接口（对于同一个请求，会被缓存，比如productId=100的商品请求两次，那么第二次会直接查缓存，不会进到这里）
        // 如果调用失败了，报错了，那么就会去调用fallback降级机制
        throw new Exception();
    }
　　//抛出异常，走降级接口
    @Override
    protected String getFallback() {
　　
　　 //从缓存拿数据，尽量别走网络，如果非得走网络，需要再次调用command
        System.out.println("从本地缓存获取商品数据，productId=" + productId);  
        return  "商品名称";
    }
    //开启请求缓存
    @Override
    protected String getCacheKey() {
        return "product_info_" + productId;
    }
}
```

## controller中：

```java
@RequestMapping("/getProductInfos")
@ResponseBody
public String getProductInfos(Long productId) {
    GetProductInfoCommand getProductInfoCommand = new GetProductInfoCommand(productId); 
    ProductInfo productInfo = getProductInfoCommand.execute();
    System.out.println(productInfo);
    System.out.println(getProductInfoCommand.isResponseFromCache());
    return "success";
}
```
