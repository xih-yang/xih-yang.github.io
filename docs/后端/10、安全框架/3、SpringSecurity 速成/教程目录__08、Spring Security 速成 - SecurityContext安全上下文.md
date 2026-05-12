# 08、Spring Security 速成 - SecurityContext安全上下文
- 来源：https://ddkk.com/zhuanlan/security/springsecurity/6/8.html
- 分类：安全框架
- 分组：教程目录
## 一、前言

本节我们将讨论安全上下文，我们将分析它是如何工作的、如何从其中访问数据，以及应用程序如何在具有不同的与线程有关的场景中管理它。一般来说，我们为了让后续程序能够使用验证通过人员的信息，都会使用到它，比如编写一个SecurityUtils用来获取用户信息是经常用到的，那么学习它后，你就可以使用安全上下文存储关于已验证用户的详细信息了。

## 二、SecurityContext接口

我们上文学习了AuthenticationProvider对身份验证的整个流程，一旦AuthenticationManager成功完成身份验证，它将为请求的其余部分存储Authentication实例，这个实例就被称为安全上下文

Spring Security的安全上下文是由SpringContext接口描述的。接口代码如下：

```java
public interface SecurityContext extends Serializable {
	Authentication getAuthentication();
	void setAuthentication(Authentication authentication);
}
```

从接口定义中观察到，SecurityContext的主要职责是存储身份验证对象。但是SecurityContext本身是如何被管理的呢？**Spring Security提供了3中策略来管理Spring Context，其中都用到了一个对象来扮演管理器的角色。该对象被命名为SecurityContextHolder**.

- **MODE_THREADLOCAL**——**允许每个线程在安全上下文中存储自己的详细信息**。在每个请求一个线程的Web应用程序中，这是一种常见的方法，因为**每个请求都有一个单独的线程**。但若是该接口是需要异步的，那么此种策略便不再适用
- **MODE_INHERITABLETHREADLOCAL**——类似于MODE_THREADLOCAL，**但还会指示Spring Security在异步方法的情况下将安全上下文复制到下一个线程**。这样，**就可以说运行@Async方法的新线程继承了该安全上下文**。
- **MODE_GLOBAL**——**使应用程序的所有线程看到相同的安全上下文实例**

除了Spring Security提供的这3种管理安全上下文策略外，我们还将讨论当Spring不知道我们自己的线程会发生什么的情况时，我们需要显式地将详细信息从安全上下文复制到新线程.Spring Security不能自动管理不在Spring上下文中的对象，但是它为此提供了一些很好用的实用工具类。

## 三、将策略用于安全上下文

首先我们将学习通过MODE_THREADLOCAL策略管理安全上下文，这个策略也是Spring Security用于管理安全上下文的默认策略。使用这种策略，Spring Security就可以使用ThreadLocal管理上下文。我们都知道ThreadLocal确保应用程序每个线程只能看到自己线程中的ThreadLocal中的数据，其他线程是访问不到的。

作为管理安全上下文的默认策略，此过程不需要显式配置。在身份验证过程结束后，只要在需要的地方使用静态getContext()方法从持有者请求安全上下文即可。**从安全上下文中，可以进一步获得Authentication对象，该对象存储着有关已验证实体的详细信息**。例如下面代码我们将通过一个接口获取已认证用户的用户名：

```java
@GetMapping("/hello")
public String hello(){
    SecurityContext context = SecurityContextHolder.getContext();
    Authentication authentication = context.getAuthentication();
    return "Hello," + authentication.getName() + "!";
}
```

当使用正确的用户调用端点时，响应体会包含用户名。例如：

使用管理安全上下文的默认策略很容易，在很多情况下，这种策略也足够使用了。MODE_THREADLOCAL提供了为每个线程隔离安全上下文的能力，它是安全上下文更容易理解和管理。但是有些情况下，这并不适用。

如果必须处理每个请求的多个线程，情况就会变得更加复杂。看看如果让端点异步化会发生什么。即执行该方法的线程将不再是服务该请求的线程：

```java
@GetMapping("/hello")
@Async
public String hello(){
    SecurityContext context = SecurityContextHolder.getContext();
    Authentication authentication = context.getAuthentication();
    return "Hello," + authentication.getName() + "!";
}
```

为了启用@Async注解的功能，我们得在我们的配置类或者启动类上加上@EnableAsync注解它，如下所示：

```java
@Configuration
@RequiredArgsConstructor
@EnableAsync
public class SpringSecurityConfig extends WebSecurityConfigurerAdapter{
}
```

当然我们对于这三种策略，也可以使用Spring自带的线程池，在这里不做过多展示。

对于上面的程序，如果再次运行，我们会出现NPE异常，也就是如下代码出现异常：

```java
String username = context.getAuthentication().getName()
```

这是因为该方法现在在另一个不继承安全上下文的线程上执行。因此，Authorization对象为null，最终导致NPR异常。在这种情况下，我们就可以使用MODE_INHERITABLETHREADLOCAL策略来解决这个问题。我们可以通过调用SecurityContextHolder.setStrategyName()方法或使用系统属性 spring.security.strategy来设置这个策略，框架就会知道要将请求的原始线程的详情复制到异步方法新创建的线程。

```java
@Bean
public InitializingBean initializingBean(){
    return ()-> SecurityContextHolder.setStrategyName(SecurityContextHolder.MODE_INHERITABLETHREADLOCAL);
}
```

如上代码，我们使用IntializingBean设置了SecurityContextHolder模式，调用端点时，我们将看到安全上下文已被Spring正确地传播到下一线程。此时，Authentication不再为null了。

不过，**只有在框架本身创建线程时（例如我们之前使用的@Async），这种策略才有效**，如果是通过代码直接创建线程，那么即使使用MODE_INHERITABLETHREADLOCAL策略，也会遇到同样的问题。这是因为，**框架并不识别代码所创建的线程**。后面我们会有对应的解决方案。

而第三种策略MODE_GLOBAL则是由应用程序的所有线程共享安全上下文，这种策略并不建议使用，因为它不符合程序的总体情况，它只适用于独立应用程序。

## 四、DelegatingSecurityContext(Runn/Call)able转发安全上下文

**在学习这个之前，记得先把配置类中之前配置的策略给注释，否则会像作者一样陷入自己骗自己的场景，找了2小时bug**。

```java
//    @Bean
//    public InitializingBean initializingBean(){
//        return ()-> SecurityContextHolder.setStrategyName(SecurityContextHolder.MODE_INHERITABLETHREADLOCAL);
//    }
```

之前的学习中我们已经了解了3种管理安全上下文的策略，但是他们有自己的弊端，就是框架只会确保为请求的线程提供安全上下文，并且该安全上下文仅可由该线程访问。但是框架并不关心新创建的线程（例如，异步方法所创建的线程）。所以我们必须为安全上下文的管理显式地设置另一种模式，但是仍然有一个疑问：当代码在框架不知道的情况下启动新线程时会发生什么？有时我们将这些线程称为自管理线程，因为管理它们是我们自己，而不是框架。

SpringContextHolder的无指定策略为我们提供了一个自管理线程的解决方案。在这种情况下，我们需要处理安全上下文转播。**用于此目的的一种解决方案是使用DelegatingSecurityContext(Runn/Call)able装饰想要在单独线程上执行的任务**。**通过类的名字不难猜出它扩展了Runnable/Callable，区别只是一个不存在返回值一个存在返回值**。这两个类都代表异步执行的任务，就像其他任何Runnable和Callable一样，它们会确保为执行任务的线程复制到当前安全上下文。如下图，DelegatingSecurityContextCallable被设计成Callable对象的装饰器。在**构建此类对象时，需要提供应用程序异步执行的可调用任务，并将安全上下文复制到新线程，然后执行任务**。

```java
@GetMapping("/giao")
    public String giao() throws ExecutionException, InterruptedException {
        //创建Callable任务，并将其作为任务在单独线程上执行
        Callable<String> task = () ->{
            SecurityContext context = SecurityContextHolder.getContext();
            return context.getAuthentication().getName();
        };
        ExecutorService e = Executors.newCachedThreadPool();
        try{
            DelegatingSecurityContextCallable<String> contextTask = new DelegatingSecurityContextCallable<>(task);
            return "giao, " + e.submit(contextTask).get() + "!";
        }finally {
            e.shutdown();
        }
    }
```

从代码中可以看到DelegatingSecurityContextCallable装饰了任务，它会将安全上下文提供给新线程。

现在调用端点，可以看到Spring将安全上下文传播到执行任务的线程：

## 五、DelegatingSecurityContextExecuorService转发安全上下文

之前我们已经学习了DelegatingSecurityContext(Runn/Call)able，这**些类可以装饰异步执行的任务，并负责从安全上下文复制详细信息**。不过还有第二个选项处理安全上下文，这就是从线程池而不是任务本身管理传播，这个处理方案就是DelegatingSecurityContextExecuorService，它的实现装饰了ExecutorService。DelegatingSecurityContextExecuorService还负责安全上下文的传播，如下图：

可以看到DelegatingSecurityContextExecuorService装饰了ExecutorService，并在提交任务之前将安全上下文详细信息传播给下一线程。

```java
@GetMapping("/miao")
    public String miao() throws ExecutionException, InterruptedException {
        Callable<String> task = () ->{
            SecurityContext context = SecurityContextHolder.getContext();
            return context.getAuthentication().getName();
        };
        ExecutorService e = Executors.newCachedThreadPool();
        //通过DelegatingSecurityContextExecutorService装饰线程池
        e = new DelegatingSecurityContextExecutorService(e);
        try{
            //在提交任务前DelegatingSecurityContextExecutorService会将安全上下文传播到执行此任务的线程
            return "miao, " + e.submit(task).get() + "!";
        }finally {
            e.shutdown();
        }
    }
```

其实SpringSecurity提供了很多这样的对象管理安全上下文，具体如下表：

类
描述

DelegatingSecurityContextExecutor
实现Executor接口，并被设计用来装饰Executor对象，使其具有将安全上下文转发给由其线程池创建的线程的能力

DelegatingSecurityContextExecutorService
实现ExecutorService接口，并被设计用来装饰ExecutorService对象，使其具有将安全上下文转发给由其线程池创建的线程的能力

DelegatingSecurityContextScheduledExecutorService
实现ScheduledExecutorService接口，并被设计用来装饰ScheduledExecutorService对象，使其具有将安全上下文转发给由其线程池创建的线程的能力

DelegatingSecurityContextRunnable
实现Runnable接口，表示在另一个线程上执行而不返回响应的任务。除了常规Runnable所承担的职责之外，它还能够传播安全上下文，以便在新线程上使用

DelegatingSecurityContextCallable
实现Callable接口，表示在另一个线程上执行并最终返回响应的任务。除了常规Callable所承担的职责之外，它还能够传播安全上下文，以便在新线程上使用

可是细心的朋友们可能会发现，对于之前3种策略我们能使用Spring自带的线程池，**但是对于DelegatingSecurityContextXXX，可以发现Spring自带的ThreadPoolTaskExecutor很难被“装饰”**，就算是

**最基础的DelegatingSecurityContextExecutor,你会发现没有一个合适的类去承载它**,虽说ThreadPoolTaskExecutor也实现了Executor,也可以使用Executor去接收DelegatingSecurityContextExecutor装饰的ThreadPoolTaskExecutor，但是Executor并没有submit这些更好用的方法

```java
 ? = new DelegatingSecurityContextExecutor(new ThreadPoolTaskExecutor();
```

但是我们平时工作用的做多的反而是Spring自带的线程池，我现在就是想用ThreadPoolTaskExecutor,那么该怎么解决呢？

我们就需要用到spring提供的TaskDecorator来解决

```java
if (this.taskDecorator != null) {
executor = new ThreadPoolExecutor(
        this.corePoolSize, this.maxPoolSize, this.keepAliveSeconds, TimeUnit.SECONDS,
        queue, threadFactory, rejectedExecutionHandler) {
    @Override
    public void execute(Runnable command) {
        Runnable decorated = taskDecorator.decorate(command);
        if (decorated != command) {
            decoratedTaskMap.put(decorated, command);
        }
        super.execute(decorated);
    }
};
}
```

**TaskDecorator使用了装饰器模式,在初始化线程池的时候复写了线程池的execute方法**。

**所以我们可以新建一个TaskDecorator类,复写decorate方法,设置安全上下文,这样就可以通过ThreadPoolTaskExecutor将安全上下文信息共享给其他线程**。代码如下：

我们创建一个配置类，并且配置类中通过内部类形式配置好TaskDecorator，并将安全上下文放进去，记得最后一定要clearContext！

```java
package com.mbw.security.config;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import java.util.concurrent.ThreadPoolExecutor;
@Configuration
public class ThreadPoolTaskConfig {
	/** 核心线程数（默认线程数） */
	private static final int CORE_POOL_SIZE = 20;
	/** 最大线程数 */
	private static final int MAX_POOL_SIZE = 100;
	/** 允许线程空闲时间（单位：默认为秒） */
	private static final int KEEP_ALIVE_TIME = 10;
	/** 缓冲队列大小 */
	private static final int QUEUE_CAPACITY = 200;
	/** 线程池名前缀 */
	private static final String THREAD_NAME_PREFIX = "mbw-Async-";
	@Bean("taskExecutor") // bean的名称，默认为首字母小写的方法名
	public ThreadPoolTaskExecutor taskExecutor(){
		ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
		executor.setCorePoolSize(CORE_POOL_SIZE);
		executor.setMaxPoolSize(MAX_POOL_SIZE);
		executor.setQueueCapacity(QUEUE_CAPACITY);
		executor.setKeepAliveSeconds(KEEP_ALIVE_TIME);
		executor.setThreadNamePrefix(THREAD_NAME_PREFIX);
		executor.setTaskDecorator(runnable -> {
			SecurityContext securityContext = SecurityContextHolder.getContext();
			return () -> {
				try {
					SecurityContextHolder.setContext(securityContext);
					runnable.run();
				} finally {
					SecurityContextHolder.clearContext();
				}
			};
		});
		// 线程池对拒绝任务的处理策略
		// CallerRunsPolicy：由调用线程（提交任务的线程）处理该任务
		executor.setRejectedExecutionHandler(new ThreadPoolExecutor.CallerRunsPolicy());
		// 初始化
		executor.initialize();
		return executor;
	}
}
```

然后我们直接使用即可

```java
@Resource
private ThreadPoolTaskExecutor taskExecutor;
    @GetMapping("/miao")
    public String miao() throws ExecutionException, InterruptedException {
        Callable<String> task = () ->{
            SecurityContext context = SecurityContextHolder.getContext();
            return context.getAuthentication().getName();
        };
        try{
            //在提交任务前DelegatingSecurityContextExecutorService会将安全上下文传播到执行此任务的线程
            return "miao, " + taskExecutor.submit(task).get() + "!";
        }finally {
            taskExecutor.shutdown();
        }
    }
```

发现同样可以拿到信息
