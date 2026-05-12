# 1、Hystrix 使用介绍
- 来源：https://ddkk.com/zhuanlan/guarantee/hystrix/14.html
- 分类：服务保障
- 分组：Hystrix 之 使用教程（C）
## 1、执行方式

HystrixCommand提供了3种执行方式：

### 1、同步执行

即一旦开始执行该命令，当前线程就得阻塞着直到该命令返回结果，然后才能继续执行下面的逻辑。当**调用命令的execute()方法即为同步执行**， 示例：

```java
public class ThreadEchoCommand extends HystrixCommand<String> {
        private Logger logger = LoggerFactory.getLogger(ThreadEchoCommand.class);
        private String input;
    public ThreadEchoCommand(String input) {
            super(Setter.withGroupKey(HystrixCommandGroupKey.Factory.asKey("Semaphore Echo"))
                    .andCommandKey(HystrixCommandKey.Factory.asKey("Echo"))
                    .andCommandPropertiesDefaults(HystrixCommandProperties.Setter()
                    .withExecutionIsolationStrategy(HystrixCommandProperties.ExecutionIsolationStrategy.SEMAPHORE)
                    .withExecutionIsolationSemaphoreMaxConcurrentRequests(5)));
            this.input = input;
        }
        @Override
        protected String run() throws Exception {
            logger.info("Run command with input: {}", input);
            Thread.sleep(100);
            return "Echo: " + input;
    }
    public static void main(String[] args) throws Exception {
        ThreadEchoCommand command = new ThreadEchoCommand("xianlinbox");
        System.out.println("command.execute()"+ command.execute());
    }
    //[main] INFO com.ThreadEchoCommand - Run command with input: xianlinbox
    //command.execute()Echo: xianlinbox
```

### 2、异步执行

命令开始执行会返回一个Future的对象，不阻塞后面的逻辑，开发者自己根据需要去获取结果。当**调用HystrixCommand的queue()方法即为异步执行** ， 示例：

### 线程数==信号量

### 3、响应式执行

命令开始执行会返回一个Observable`` 对象，开发者可以给给Obeservable对象注册上Observer或者Action1对象，响应式地处理命令执行过程中的不同阶段。当调用HystrixCommand的observe()方法，或使用Observable的工厂方法（just(),from()）即为响应式执行

这个功能的实现是基于Netflix的另一个开源项目RxJava（ [https://github.com/Netflix/RxJava](https://github.com/Netflix/RxJava) ）来的

更细节的用法可以参考： [https://github.com/Netflix/Hystrix/wiki/How-To-Use#wiki-Reactive-Execution](https://github.com/Netflix/Hystrix/wiki/How-To-Use#wiki-Reactive-Execution) 。

## 2、异常总结

### 1、java.lang.UnsupportedOperationException: No fallback available.

```java
@Override
    protected String run() throws Exception {
        logger.info("Run command with input: {}", input);
        Thread.sleep(2000);
        return "Echo: " + input;
}
```

主要原因如下：

**1、** 未设置hystrix超时时间，默认是1000ms上述代码执行了2000ms，执行超时；

### 2、java.lang.UnsupportedOperationException: No fallback available.

### 线程数>信号量

```java
public class ThreadEchoCommand extends HystrixCommand<String> {
        private Logger logger = LoggerFactory.getLogger(ThreadEchoCommand.class);
        private String input;
    public ThreadEchoCommand(String input) {
            super(Setter.withGroupKey(HystrixCommandGroupKey.Factory.asKey("Semaphore Echo"))
                    .andCommandKey(HystrixCommandKey.Factory.asKey("Echo"))
                    .andCommandPropertiesDefaults(HystrixCommandProperties.Setter()
                    .withExecutionIsolationStrategy(HystrixCommandProperties.ExecutionIsolationStrategy.SEMAPHORE)
                    .withExecutionIsolationSemaphoreMaxConcurrentRequests(2)));
            this.input = input;
        }
        @Override
        protected String run() throws Exception {
            logger.info("Run command with input: {}", input);
            Thread.sleep(100);
            return "Echo: " + input;
    }
    public static void main(String[] args) throws Exception {
        ThreadEchoCommand command = new ThreadEchoCommand("xianlinbox");
        System.out.println("command.execute()"+ command.execute());
    }
//[main] INFO com.ThreadEchoCommand - Run command with input: xianlinbox
//command.execute()Echo: xianlinbox
1:11:56.332 [Thread-2] DEBUG com.netflix.hystrix.AbstractCommand - HystrixCommand Execution Rejection by Semaphore.
01:11:56.332 [Thread-1] DEBUG com.netflix.hystrix.AbstractCommand - HystrixCommand Execution Rejection by Semaphore.
01:11:56.332 [Thread-3] DEBUG com.netflix.hystrix.AbstractCommand - HystrixCommand Execution Rejection by Semaphore.
01:11:56.341 [Thread-2] DEBUG com.netflix.hystrix.AbstractCommand - No fallback for HystrixCommand. 
java.lang.UnsupportedOperationException: No fallback available.
```

以下为fallback触发的情况说明：

引用：[SpringCloud Hystrix超时：HystrixRuntimeException: xxx failed and no fallback available_年少青山的博客-CSDN博客](https://blog.csdn.net/m0_37787662/article/details/103709028)

[Hystrix使用介绍_赶路人儿-CSDN博客](https://blog.csdn.net/liuxiao723846/article/details/73499073)
