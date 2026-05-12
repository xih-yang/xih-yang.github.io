# 3、Hystrix 服务降级
- 来源：https://ddkk.com/zhuanlan/guarantee/hystrix/10.html
- 分类：服务保障
- 分组：Hystrix 之 使用教程（B）
Hystrix使用fallback机制很简单，继承`HystrixCommand`只需重写`getFallback()`，继承`HystrixObservableCommand`只需重写`resumeWithFallback()`，比如上篇文章的`HelloWorldHystrixCommand`加上下面代码片段：

```java
@Override
protected String getFallback() {
    return "fallback: " + name;
}
```

fallback实际流程是当`run()/construct()`被触发执行时或执行中发生错误时，将转向执行`getFallback()/resumeWithFallback()`。

结合下图，4种情况（出现异常，超时，熔断，线程池已满）将触发fallback：

## run()方法中出现异常

（非HystrixBadRequestException异常）或者出现超时（）触发fallback()

```java
public class HystrixFallbackNomal extends HystrixCommand<String>{
　　private final String name;
 　 public HystrixFallbackNomal(String name) {
	super(HystrixCommandGroupKey.Factory.asKey("ExampleGroup"));
	this.name = name;
　　}
　　@Override
　　public String run() throws Exception {
	/*---------------会触发fallback的case-------------------*/
    	// 无限循环，实际上属于超时
    /*	int j = 0;
    	while (true) {
    		j++;
    	}*/
	Thread.sleep(1000);
    	// 除零异常
    	// int i = 1/0;
    	// 主动抛出异常
//      throw new HystrixTimeoutException();
//      throw new RuntimeException("this command will trigger fallback");
//      throw new Exception("this command will trigger fallback");
//    	throw new HystrixRuntimeException(FailureType.BAD_REQUEST_EXCEPTION, commandClass, message, cause, fallbackException);
    	/*---------------不会触发fallback的case-------------------*/
    	// 被捕获的异常不会触发fallback
//    	try {
//    		throw new RuntimeException("this command never trigger fallback");
//    	} catch(Exception e) {
//    		e.printStackTrace();
//    	}
    	// HystrixBadRequestException异常由非法参数或非系统错误引起，不会触发fallback，也不会被计入熔断器
        //throw new HystrixBadRequestException("HystrixBadRequestException is never trigger fallback");
　　　　 //return name;
	}
	@Override
	protected String getFallback() {
	　　return "fallback: " + name;
	}
　　}
}
```

## 熔断触发fallback（）

```java
/**
 * 熔断机制相当于电路的跳闸功能，例如：我们可以配置熔断策略为当请求错误比例在10s内>50%时，该服务将进入熔断状态，后续请求都会进入fallback
 * CircuitBreakerRequestVolumeThreshold设置为3，意味着10s内请求超过3次就触发熔断器(10s这个时间暂时不可配置)
 * run()中无限循环使命令超时进入fallback，10s内请求超过3次，将被熔断，进入降级，即不进入run()而直接进入fallback
 * 如果未熔断，但是threadpool被打满，仍然会降级，即不进入run()而直接进入fallback
 */
public class HystrixFallbackCircuitBreaker extends HystrixCommand<String>{
	private final String name;
    public HystrixFallbackCircuitBreaker(String name) {
        super(Setter.withGroupKey(HystrixCommandGroupKey.Factory.asKey("CircuitBreakerTestGroup"))  
                .andCommandKey(HystrixCommandKey.Factory.asKey("CircuitBreakerTestKey"))
                .andThreadPoolKey(HystrixThreadPoolKey.Factory.asKey("CircuitBreakerTest"))
                .andThreadPoolPropertiesDefaults(	// 配置线程池
                		HystrixThreadPoolProperties.Setter()
                		.withCoreSize(200)	// 配置线程池里的线程数，设置足够多线程，以防未熔断却打满threadpool
                )
                .andCommandPropertiesDefaults(	// 配置熔断器
                		HystrixCommandProperties.Setter()
                		.withCircuitBreakerEnabled(true)
                		.withCircuitBreakerRequestVolumeThreshold(3)
                		.withCircuitBreakerErrorThresholdPercentage(80)
//	                		.withCircuitBreakerForceOpen(true)	// 置为true时，所有请求都将被拒绝，直接到fallback
//	                		.withCircuitBreakerForceClosed(true)	// 置为true时，将忽略错误
//	                		.withExecutionIsolationStrategy(ExecutionIsolationStrategy.SEMAPHORE)	// 信号量隔离
//	                		.withExecutionTimeoutInMilliseconds(5000)
                )
        );
        this.name = name;
    }
    @Override
    protected String run() throws Exception {
    	System.out.println("running run():" + name);
    	int num = Integer.valueOf(name);
    	if(num < 10) {	// 直接返回
    	　　return name;
    	} else {	// 无限循环模拟超时
    	　　int j = 0;
        　　while (true) {
        　　j++;
        　　}
    	}
//	return name;
    }
    @Override
    protected String getFallback() {
        return "CircuitBreaker fallback: " + name;
    }
}
```

```java
    @Test
       public void testFallbackCricuitBreaker() throws IOException {
       	for(int i = 0; i < 50; i++) {
	     try {
	        System.out.println("===========" + new HystrixFallbackCircuitBreaker(String.valueOf(i)).execute())；
	     } catch(Exception e) {
	           System.out.println("run()抛出HystrixBadRequestException时，被捕获到这里" + e.getCause());
	     }
       	}
       	System.out.println("------开始打印现有线程---------");
       	Map<Thread, StackTraceElement[]> map=Thread.getAllStackTraces();
       	for (Thread thread : map.keySet()) {
	　　System.out.println(thread.getName());
	}
       	System.out.println("thread num: " + map.size());
       	System.in.read();
       }               
```

## 线程池已满，触发fallback()

```java
public class HystrixThreadPoolFallback extends HystrixCommand<String>{
　　private final String name;
    public HystrixThreadPoolFallback(String name) {
        super(Setter.withGroupKey(HystrixCommandGroupKey.Factory.asKey("ThreadPoolTestGroup"))  
                .andCommandKey(HystrixCommandKey.Factory.asKey("testCommandKey"))
                .andThreadPoolKey(HystrixThreadPoolKey.Factory.asKey("ThreadPoolTest"))
                .andCommandPropertiesDefaults(
                	HystrixCommandProperties.Setter()
                		.withExecutionTimeoutInMilliseconds(5000)
                )
                .andThreadPoolPropertiesDefaults(
                	HystrixThreadPoolProperties.Setter()
                		.withCoreSize(3)	// 配置线程池里的线程数
                )
        );
        this.name = name;
    }
　　@Override
    protected String run() throws Exception {
    	System.out.println(name);
	TimeUnit.MILLISECONDS.sleep(2000);
	return name;
    }
    @Override
    protected String getFallback() {
        return "fallback: " + name;
    }
}
```

```java
 @Test
public void testThreadPool() throws IOException {
    for(int i = 0; i < 10; i++) {
    　　try {
        Future<String> future = new HystrixThreadPoolFallback("Hlx"+i).queue();
    　　} catch(Exception e) {
        System.out.println("run()抛出HystrixBadRequestException时，被捕获到这里" + e.getCause());
    　　}
    }
    for(int i = 0; i < 20; i++) {
    　　try {
        System.out.println("===========" + new HystrixThreadPoolFallback("Hlx"+i).execute());
    　　} catch(Exception e) {
        System.out.println("run()抛出HystrixBadRequestException时，被捕获到这里" + e.getCause());
    　　}
    }
    try {
    　　TimeUnit.MILLISECONDS.sleep(2000);
    }catch(Exception e) {}
    System.out.println("------开始打印现有线程---------");
    Map<Thread, StackTraceElement[]> map=Thread.getAllStackTraces();
    for (Thread thread : map.keySet()) {
        System.out.println(thread.getName());
    }
    System.out.println(map);
    System.out.println("thread num: " + map.size());
    System.in.read();
}
```
