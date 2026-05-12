# 2、Hystrix 应用介绍
- 来源：https://ddkk.com/zhuanlan/guarantee/hystrix/19.html
- 分类：服务保障
- 分组：Hystrix 之 使用教程（D）
上篇博客中讲了hystrix在公司中的一些应用场景，由于保密的原因没办法贴出优化的代码，这里专门写一篇hystrix代码的demo，供大家在使用的过程中快速上手

Hystrix有两个请求命令 **HystrixCommand（该方式代码的执行由新创建的线程执行）** 、**HystrixObservableCommand（该方式代码的执行还是在主线程中执行）** 。

**HystrixCommand**用在依赖服务返回单个操作结果的时候。有两种执行方式

- execute():同步执行。从依赖的服务返回一个单一的结果对象，或是在发生错误的时候抛出异常。
- queue();异步执行。直接返回一个Future对象，其中包含了服务执行结束时要返回的单一结果对象。

**HystrixObservableCommand** 用在依赖服务返回多个操作结果的时候。它也实现了两种执行方式

- observe():返回Obervable对象，他代表了操作的多个结果，他是一个HotObservable
- toObservable():同样返回Observable对象，也代表了操作多个结果，但它返回的是一个Cold Observable

**下边以注解和非注解两种形式演示**

## 第一步引入所依赖的pom

```xml
<dependency>
    <groupId>com.netflix.hystrix</groupId>
    <artifactId>hystrix-core</artifactId>
    <version>${hystrix-version}</version>
</dependency>
<dependency>
    <groupId>com.netflix.hystrix</groupId>
    <artifactId>hystrix-metrics-event-stream</artifactId>
    <version>${hystrix-version}</version>
</dependency>
<dependency>
    <groupId>com.netflix.hystrix</groupId>
    <artifactId>hystrix-javanica</artifactId>
    <version>${hystrix-version}</version>
</dependency>
<dependency>
    <groupId>com.netflix.hystrix</groupId>
    <artifactId>hystrix-servo-metrics-publisher</artifactId>
    <version>${hystrix-version}</version>
</dependency>
```

## 第二步：在spring的xml配置中引入相关注解

```xml
<!-- 配置成注解方式寻找要被代理的对象 -->
<aop:aspectj-autoproxy/>
<!-- hystrix -->
<bean id="hystrixAspect" class="com.netflix.hystrix.contrib.javanica.aop.aspectj.HystrixCommandAspect"></bean>
<context:annotation-config/>
```

## HystrixCommand代码演示

## 1、下边先演示 HystrixCommand的注解方式

```java
import javafx.application.Application;
import org.hope.hystrix.example.HystrixApplication;
import org.hope.hystrix.example.model.User;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.junit4.SpringJUnit4ClassRunner;
import org.springframework.test.context.web.WebAppConfiguration;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.Future;
/**
 *
 */
@RunWith(SpringJUnit4ClassRunner.class)
@SpringBootTest(classes = HystrixApplication.class)
public class UserServiceTest {
    @Autowired
    private UserService userService;
    /**
     * 测试同步
     */
    @Test
    public void testGetUserId() {
        System.out.println(Thread.currentThread().getName());
        System.out.println("=================" + userService.getUserId("hystrix"));
    }
    /**
     * 测试异步
     */
    @Test
    public void testGetUserName() throws ExecutionException, InterruptedException {
        Future<String> fuature =  userService.getUserName(30L,"hellow");
        System.out.println("=================" + fuature.get());
    }
}
```

```java
import com.netflix.hystrix.contrib.javanica.annotation.HystrixCommand;
import com.netflix.hystrix.contrib.javanica.annotation.ObservableExecutionMode;
import com.netflix.hystrix.contrib.javanica.command.AsyncResult;
import org.springframework.stereotype.Service;
import rx.Observable;
import rx.Subscriber;
import java.util.concurrent.Future;
/**
 * 用@HystrixCommand的方式来实现
 */
@Service
public class UserService {
    /**
     * 同步的方式。
     * fallbackMethod定义降级
     */
    @HystrixCommand(fallbackMethod = "helloFallback")
    public String getUserId(String name) {
        System.out.println(Thread.currentThread().getName());
        int i = 1/0; //此处抛异常，测试服务降级
        return "hellow:" + name;
    }
    public String helloFallback(String name) {
        return "error" + name;
    }
    //异步的执行
    @HystrixCommand(fallbackMethod = "getUserNameError")
    public Future<String> getUserName(final Long id, String name) {
        return new AsyncResult<String>() {
            @Override
            public String invoke() {
                    int i = 1/0;//此处抛异常,测试服务降级
                    return "你好:" + id;
            }
        };
    }
    public String getUserNameError(Long id, String name) {
        return "触发熔断啦！！！！";
    }
}
```

## 2、HystrixCommand的非注解方式

```java
import org.junit.Test;
import rx.Observable;
import rx.Observer;
import rx.Subscription;
import rx.functions.Action1;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.Future;
import static org.junit.Assert.assertEquals;
/**
 *
 */
public class CommandHelloWorldTest {
    /**
     * 测试同步执行
     */
    @Test
    public void testSynchronous() {
        System.out.println(new CommandHelloWorld("World").execute());
    }
    /**
     * 测试异步执行
     */
    @Test
    public void testAsynchronous() throws ExecutionException, InterruptedException {
        Future<String> fWorld = new CommandHelloWorld("World").queue();
        System.out.println(fWorld.get());  //一步执行用get()来获取结果
    }
}
```

```java
import com.netflix.hystrix.HystrixCommand;
import com.netflix.hystrix.HystrixCommandGroupKey;
import com.netflix.hystrix.HystrixCommandKey;
import com.netflix.hystrix.HystrixRequestCache;
import com.netflix.hystrix.strategy.concurrency.HystrixConcurrencyStrategyDefault;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.client.RestTemplate;
/**
 * HystrixCommand用在命令服务返回单个操作结果的时候
 */
public class CommandHelloWorld extends HystrixCommand<String> {
    private final String name;
    public CommandHelloWorld(String name) {
        super(HystrixCommandGroupKey.Factory.asKey("ExampleGroup"));
        this.name = name;
    }
    @Override
    protected String run() throws Exception {
        int i = 1/0;
        return "Hello " + name + "!";
    }
    /**
     * 降级。Hystrix会在run()执行过程中出现错误、超时、线程池拒绝、断路器熔断等情况时，
     * 执行getFallBack()方法内的逻辑
     */
    @Override
    protected String getFallback() {
        return "faild";
    }
}
```

**HystrixObservableCommand代码演示**

```java
import org.junit.Test;
import rx.Observable;
import java.util.Iterator;
/**
 */
public class ObservableCommandHelloWorldTest {
    @Test
    public void testObservable() {
        Observable<String> observable= new ObservableCommandHelloWorld("World").observe();
        Iterator<String> iterator = observable.toBlocking().getIterator();
        while(iterator.hasNext()) {
            System.out.println(iterator.next());
        }
    }
    @Test
    public void testToObservable() {
        Observable<String> observable= new ObservableCommandHelloWorld("World").observe();
        Iterator<String> iterator = observable.toBlocking().getIterator();
        while(iterator.hasNext()) {
            System.out.println(iterator.next());
        }
    }
}
```

```java
import com.netflix.hystrix.HystrixCommandGroupKey;
import com.netflix.hystrix.HystrixObservableCommand;
import rx.Observable;
import rx.Subscriber;
import rx.schedulers.Schedulers;
/**
 */
public class ObservableCommandHelloWorld extends HystrixObservableCommand<String> {
    private final String name;
    public ObservableCommandHelloWorld(String name) {
        super(HystrixCommandGroupKey.Factory.asKey("ExampleGroup"));
        this.name = name;
    }
    @Override
    protected Observable<String> construct() {
        return Observable.create(new Observable.OnSubscribe<String>() {
            @Override
            public void call(Subscriber<? super String> subscriber) {
                try {
                    if(!subscriber.isUnsubscribed()) {
                        subscriber.onNext("Hello");
                        int i = 1 / 0; //模拟异常
                        subscriber.onNext(name + "!");
                        subscriber.onCompleted();
                    }
                } catch (Exception e) {
                    subscriber.onError(e);
                }
            }
        }).subscribeOn(Schedulers.io());
    }
    /**
     * 服务降级
     */
    @Override
    protected Observable<String> resumeWithFallback() {
        return Observable.create(new Observable.OnSubscribe<String>() {
            @Override
            public void call(Subscriber<? super String> subscriber) {
                try {
                    if (!subscriber.isUnsubscribed()) {
                        subscriber.onNext("失败了！");
                        subscriber.onNext("触发熔断啦");
                        subscriber.onCompleted();
                    }
                } catch (Exception e) {
                    subscriber.onError(e);
                }
            }
        }).subscribeOn(Schedulers.io());
    }
}
```

基于注解**HystrixObservableCommand**

```java
package org.hope.hystrix.example.service;
import com.netflix.hystrix.contrib.javanica.annotation.HystrixCommand;
import com.netflix.hystrix.contrib.javanica.annotation.ObservableExecutionMode;
import org.springframework.stereotype.Service;
import rx.Observable;
import rx.Subscriber;
@Service
public class ObservableUserService {
    /**
     *  EAGER参数表示使用observe()方式执行
     */
    @HystrixCommand(observableExecutionMode = ObservableExecutionMode.EAGER, fallbackMethod = "observFailed") //使用observe()执行方式
    public Observable<String> getUserById(final Long id) {
       return Observable.create(new Observable.OnSubscribe<String>() {
           @Override
           public void call(Subscriber<? super String> subscriber) {
               try {
                   if(!subscriber.isUnsubscribed()) {
                       subscriber.onNext("张三的ID:");
                       int i = 1 / 0; //抛异常，模拟服务降级
                       subscriber.onNext(String.valueOf(id));
                       subscriber.onCompleted();
                   }
               } catch (Exception e) {
                   subscriber.onError(e);
               }
           }
       });
    }
    private String observFailed(Long id) {
        return "observFailed---->" + id;
    }
    /**
     * LAZY参数表示使用toObservable()方式执行
     */
    @HystrixCommand(observableExecutionMode = ObservableExecutionMode.LAZY, fallbackMethod = "toObserbableError") //表示使用toObservable()执行方式
    public Observable<String> getUserByName(final String name) {
        return Observable.create(new Observable.OnSubscribe<String>() {
            @Override
            public void call(Subscriber<? super String> subscriber) {
                try {
                    if(!subscriber.isUnsubscribed()) {
                        subscriber.onNext("找到");
                        subscriber.onNext(name);
                        int i = 1/0; ////抛异常，模拟服务降级
                        subscriber.onNext("了");
                        subscriber.onCompleted();
                    }
                } catch (Exception e) {
                    subscriber.onError(e);
                }
            }
        });
    }
    private String toObserbableError(String name) {
        return "toObserbableError--->" + name;
    }
}
```

```java
package org.hope.hystrix.example.service;
import org.hope.hystrix.example.HystrixApplication;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.junit4.SpringJUnit4ClassRunner;
import java.util.Iterator;
@RunWith(SpringJUnit4ClassRunner.class)
@SpringBootTest(classes = HystrixApplication.class)
public class ObservableUserServiceTest {
    @Autowired
    private ObservableUserService observableUserService;
    @Test
    public void testObserve() {
        Iterator<String> iterator = observableUserService.getUserById(30L).toBlocking().getIterator();
        while(iterator.hasNext()) {
            System.out.println("===============" + iterator.next());
        }
    }
    @Test
    public void testToObservable() {
        Iterator<String> iterator = observableUserService.getUserByName("王五").toBlocking().getIterator();
        while(iterator.hasNext()) {
            System.out.println("===============" + iterator.next());
        }
    }
}
```

项目中大多情况下都是用使用基于注解 HystrixCommand，上边说了HystrixCommand使用的是异步，代码逻辑的执行是在新的线程中执行的，可是释放掉当前的主线程，可以更大程度的提升代码的并发
