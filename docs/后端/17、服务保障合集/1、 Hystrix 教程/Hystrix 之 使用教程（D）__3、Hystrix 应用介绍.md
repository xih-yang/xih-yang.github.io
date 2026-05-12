# 3、Hystrix 应用介绍
- 来源：https://ddkk.com/zhuanlan/guarantee/hystrix/20.html
- 分类：服务保障
- 分组：Hystrix 之 使用教程（D）
hystrix提供了两种隔离策略：线程池隔离和信号量隔离。hystrix默认采用线程池隔离。

## 1、线程池隔离

不同服务通过使用不同线程池，彼此间将不受影响，达到隔离效果。

**例如：**

我们可以通过andThreadPoolKey配置使用命名为 `ThreadPoolTest`的线程池，实现与其他命名的线程池天然隔离，如果不配置andThreadPoolKey则使用withGroupKey配置来命名线程池

```java
public HystrixThreadPoolFallback(String name) {
        super(Setter.withGroupKey(HystrixCommandGroupKey.Factory.asKey("ThreadPoolTestGroup")) 
                .andCommandKey(HystrixCommandKey.Factory.asKey("testCommandKey"))
                .andThreadPoolKey(HystrixThreadPoolKey.Factory.asKey("ThreadPoolTest"))   //设置线程池的名字，进行服务隔离
                .andCommandPropertiesDefaults(
                    HystrixCommandProperties.Setter()
                        .withExecutionTimeoutInMilliseconds(5000)
                )
                .andThreadPoolPropertiesDefaults(
                    HystrixThreadPoolProperties.Setter()
                        .withCoreSize(3)    // 配置线程池里的线程数
                )
        );
        this.name = name;
    }
```

## 2、信号量隔离

线程隔离会带来线程开销，有些场景（比如无网络请求场景）可能会因为用开销换隔离得不偿失，为此hystrix提供了信号量隔离，当服务的并发数大于信号量阈值时将进入fallback。

通过`withExecutionIsolationStrategy(ExecutionIsolationStrategy.SEMAPHORE)`配置为信号量隔离，通过 `withExecutionIsolationSemaphoreMaxConcurrentRequests`配置执行并发数不能大于3，由于信号量隔离下无论调用哪种命令执行方法，hystrix都不会创建新线程执行 `run()/construct()`，所以调用程序需要自己创建多个线程来模拟并发调用 `execute()`，最后看到一旦并发线程>3，后续请求都进入fallback

```java
/**
 * 测试信号量隔离
 * 默认执行run()用的是主线程，为了模拟并行执行command，这里我们自己创建多个线程来执行command
 * 设置ExecutionIsolationSemaphoreMaxConcurrentRequests为3，意味着信号量最多允许执行run的并发数为3，超过则触发降级，即不执行run而执行getFallback
 * 设置FallbackIsolationSemaphoreMaxConcurrentRequests为1，意味着信号量最多允许执行fallback的并发数为1，超过则抛异常fallback execution rejected
 */
public class HystrixSemaphoreIsolation extends HystrixCommand<String> {
    private final String name;
    public HystrixSemaphoreIsolation(String name) {
        super(Setter.withGroupKey(HystrixCommandGroupKey.Factory.asKey("SemaphoreTestGroup")) 
                .andCommandKey(HystrixCommandKey.Factory.asKey("SemaphoreTestKey"))
                .andThreadPoolKey(HystrixThreadPoolKey.Factory.asKey("SemaphoreTestThreadPoolKey"))
                .andCommandPropertiesDefaults(    // 配置信号量隔离
                        HystrixCommandProperties.Setter()
                        .withExecutionIsolationStrategy(ExecutionIsolationStrategy.SEMAPHORE)    // 信号量隔离
                        .withExecutionIsolationSemaphoreMaxConcurrentRequests(3)
                        .withFallbackIsolationSemaphoreMaxConcurrentRequests(1)
                )
             // 设置了信号量隔离后，线程池配置将变无效
//                .andThreadPoolPropertiesDefaults(   
//                        HystrixThreadPoolProperties.Setter()
//                        .withCoreSize(13)    // 配置线程池里的线程数
//                )
        );
        this.name = name;
    }
    @Override
    protected String run() throws Exception {
        Thread.sleep(100);
        return "run(): name="+name+"，线程名是" + Thread.currentThread().getName();
    }
    @Override
    protected String getFallback() {
        try {
            Thread.sleep(100);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
        return "getFallback(): name="+name+"，线程名是" + Thread.currentThread().getName();
    }
}
@Test
public void testSynchronous() throws IOException {
    try {
        Thread.sleep(2000);
        for(int i = 0; i < 5; i++) {
            final int j = i;
            // 自主创建线程来执行command，创造并发场景
            Thread thread = new Thread(new Runnable() {
                public void run() {
                    // 这里执行两类command：HystrixSemaphoreIsolation设置了信号量隔离、HelloWorldHystrixCommand未设置信号量
                    //System.out.println("-----------" + new HelloWorldHystrixCommand("HLX" + j).execute());
                    // 被信号量拒绝的线程从这里抛出异常
                    System.out.println("===========" + new HystrixSemaphoreIsolation("HLX" + j).execute());  
                    // 被信号量拒绝的线程不能执行到这里
                    System.out.println("-----------" + new HelloWorldHystrixCommand("HLX" + j).execute());  
                }
            });
            thread.start();
        }
    } catch(Exception e) {
        e.printStackTrace();
    }
    System.in.read();
}
```
