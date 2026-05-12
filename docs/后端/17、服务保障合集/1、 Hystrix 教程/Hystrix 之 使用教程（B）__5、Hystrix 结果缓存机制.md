# 5、Hystrix 结果缓存机制
- 来源：https://ddkk.com/zhuanlan/guarantee/hystrix/12.html
- 分类：服务保障
- 分组：Hystrix 之 使用教程（B）
hystrix支持将一个请求结果缓存起来，下一个具有相同key的请求将直接从缓存中取出结果，减少请求开销。要使用hystrix cache功能

第一个要求是重写`getCacheKey()`，用来构造cache key；

第二个要求是构建context，如果请求B要用到请求A的结果缓存，A和B必须同处一个context。

通过`HystrixRequestContext.initializeContext()`和`context.shutdown()`可以构建一个context，这两条语句间的所有请求都处于同一个context。

测试代码如下：

## 1、HystrixCommandCache.java

```java
public class HystrixCommandCache extends HystrixCommand<Boolean>{
	private final int value;
    private final String value1;
    protected HystrixCommandCache(int value, String value1) {
        super(HystrixCommandGroupKey.Factory.asKey("RequestCacheCommandGroup"));
        this.value = value;
        this.value1 = value1;
    }
    // 返回结果是cache的value
    @Override
    protected Boolean run() {
        return value == 0 || value % 2 == 0;
    }
    // 构建cache的key
    @Override
    protected String getCacheKey() {
        return String.valueOf(value) + value1;
	}
}
```

## 2、HystrixCommandCacheTest.java

```java
public class HystrixCommandCacheTest {
  @Test
  public void testWithoutCacheHits() {
      HystrixRequestContext context = HystrixRequestContext.initializeContext();
      try {
          assertTrue(new HystrixCommandCache(2,"HLX").execute());
          assertFalse(new HystrixCommandCache(1,"HLX").execute());
          assertTrue(new HystrixCommandCache(0,"HLX").execute());
          assertTrue(new HystrixCommandCache(58672,"HLX").execute());
      } finally {
          context.shutdown();
      }
  }
  @Test
  public void testWithCacheHits() {
      HystrixRequestContext context = HystrixRequestContext.initializeContext();
      try {
    	  HystrixCommandCache command2a = new HystrixCommandCache(2,"HLX");
    	  HystrixCommandCache command2b = new HystrixCommandCache(2,"HLX");
    	  HystrixCommandCache command2c = new HystrixCommandCache(2,"HLX1");
          assertTrue(command2a.execute());
          // 第一次执行，不应该是从缓存中获取
          assertFalse(command2a.isResponseFromCache());
          assertTrue(command2b.execute());
          // 第二次执行，通过isResponseFromCache()方法判断是否是从缓存中获取的
          assertTrue(command2b.isResponseFromCache());
          //虽然是第三次执行，但是getCacheKey()的缓存key值不一样，依然无法从缓存中获取
          assertTrue(command2c.execute());
          assertFalse(command2c.isResponseFromCache());
      } finally {
          context.shutdown();
      }
      // 开启一个新的context
      context = HystrixRequestContext.initializeContext();
      try {
    	  HystrixCommandCache command3a = new HystrixCommandCache(2,"HLX");
    	  HystrixCommandCache command3b = new HystrixCommandCache(2,"HLX");
          assertTrue(command3a.execute());
          // 第一次请求，不应该从缓存中获取
          assertFalse(command3a.isResponseFromCache());
          //没有执行excute()，isResponseFromCache()永远返回是true
          assertFalse(command3b.isResponseFromCache());
      } finally {
          context.shutdown();
      }
  }
}
```

以测试demo的`testWithCacheHits()`为例，*command2a*、*command2b*、*command2c*同处一个context，前两者的cache key都是`2HLX`（见`getCacheKey()`），所以*command2a*执行完后把结果缓存，*command2b*执行时就不走`run()`而是直接从缓存中取结果了，而*command2c*的cache key是`2HLX1`，无法从缓存中取结果。

注：isResponseFromCache（）方法用于检测是否是从缓存中获取；
