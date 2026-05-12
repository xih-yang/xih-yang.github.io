# 05、Dubbo 2.7 源码解析 - 高级配置（多注册中心、单功能注册中心、服务暴露延迟、消费者的异步调用、提供者的异步执行
- 来源：https://ddkk.com/zhuanlan/j2ee/dubbo/3/5.html
- 分类：J2EE框架
- 分组：教程目录
## 1. 多注册中心

### 1.1 创建提供者 08-provider-registers

#### (1) 创建工程

直接复制 05-provider-group 工程，并命名为 08-provider-registers。

#### (2) 修改配置文件

同一个服务注册到不同的中心，使用逗号进行分隔。

```java
<?xml version="1.0" encoding="UTF-8"?>
<beans xmlns="http://www.springframework.org/schema/beans"
       xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:dubbo="http://dubbo.apache.org/schema/dubbo"
       xsi:schemaLocation="http://www.springframework.org/schema/beans http://www.springframework.org/schema/beans/spring-beans.xsd http://dubbo.apache.org/schema/dubbo http://dubbo.apache.org/schema/dubbo/dubbo.xsd">
    <dubbo:application name="08-provider-registers"/>
    <!--声明注册中心-->
    <dubbo:registry id="bjCenter" address="zookeeper://bjZK:2181"/>  <!--北京中心-->
    <dubbo:registry id="shCenter" address="zookeeper://shZK:2181"/>  <!--上海中心-->
    <dubbo:registry id="gzCenter" address="zookeeper://gzZK:2181"/>  <!--广州中心-->
    <dubbo:registry id="cqCenter" address="zookeeper://cqZK:2181"/>  <!--重庆中心-->
    <!--注册Service实现类-->
    <bean id="weixinService" class="com.abc.provider.WeixinServiceImpl"/>
    <bean id="zhifubaoService" class="com.abc.provider.ZhifubaoServiceImpl"/>
    <!--暴露服务：同一个服务注册到不同的中心；不同的服务注册到不同的中心-->
    <dubbo:service interface="com.abc.service.SomeService"
                   ref="weixinService" group="pay.weixin" register="bjCenter, shCenter"/>
    <dubbo:service interface="com.abc.service.SomeService"
                   ref="zhifubaoService" group="pay.zhifubao" register="gzCenter, cqCenter"/>
</beans>
```

### 1.2 创建消费者 08-consumer-registers

#### (1) 创建工程

直接复制 05-consumer-group 工程，并命名为 08- consumer-registers。

#### (2) 修改配置文件

对于消费者工程，用到哪个注册中心了，就声明哪个注册中心，无需将全部注册中心进行声明。

```java
<?xml version="1.0" encoding="UTF-8"?>
<beans xmlns="http://www.springframework.org/schema/beans"
       xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:dubbo="http://dubbo.apache.org/schema/dubbo"
       xsi:schemaLocation="http://www.springframework.org/schema/beans http://www.springframework.org/schema/beans/spring-beans.xsd http://dubbo.apache.org/schema/dubbo http://dubbo.apache.org/schema/dubbo/dubbo.xsd">
    <dubbo:application name="08-consumer-registers"/>
    <!--声明注册中心-->
    <dubbo:registry id="bjCenter" address="zookeeper://bjZK:2181"/>
    <dubbo:registry id="gzCenter" address="zookeeper://gzZK:2181"/>
    <dubbo:registry id="cqCenter" address="zookeeper://cqZK:2181"/>
    <!--指定调用bjCenter注册中心微信服务-->
    <dubbo:reference id="weixin"  group="pay.weixin" registry="bjCenter"
                     interface="com.abc.service.SomeService"/>
    <!--指定调用gzCenter与cqCenter注册中心支付宝服务-->
    <dubbo:reference id="gzZhifubao"  group="pay.zhifubao" registry="gzCenter"
                     interface="com.abc.service.SomeService"/>
    <dubbo:reference id="cqZhifubao"  group="pay.zhifubao" registry="cqCenter"
                     interface="com.abc.service.SomeService"/>
</beans>
```

## 2. 单功能注册中心

这些仅订阅或仅注册，只对当前配置文件中的服务起作用，不会影响注册中心本身的功能。

### 2.1 仅订阅

#### (1) 概念

`对于某服务来说`，其可以发现和调用注册中心中的其它服务，但不能被其它服务发现和调用，这种情形称为仅订阅。

仅可去发现，但不能被发现。

即可以从注册中心下载服务注册表，但其不会将当前配置文件中的服务写入到注册中心的服务注册表。

> 使用场景：比如开发的时候，开发和测试用的同一个注册中心，正在开发的服务一旦注册到了注册中心，测试原本该服务没有问题的就可能出现问题，所以这个服务在开发完毕之前是不能注册到注册中心的。而以前只要当前Server一连接到注册中心，就立马把自己的服务注册到服务中心了，另外正在开发的服务是需要调用注册中心的其他服务，所以必须要连接到注册中心，但是又不想把自己的服务注册上去，所以就需要仅订阅。

#### (2) 设置方式

对于“仅订阅”注册中心的实现，只需修改`提供者`配置文件，在[dubbo:registry/](dubbo:registry/)标签中添加 register=”false”属性。即对于当前服务来说，注册中心不再接受其注册，但该服务可以通过注册中心去发现和调用其它服务。

### 2.2 仅注册

#### (1) 概念

对于某服务来说，其可以被注册中心的其它服务发现和调用，但不能发现和调用注册中心中的其它服务，这种情形称为仅注册。

简单来说就是仅可被发现，但不能去发现。

从底层实现来说就是，当前服务可以写入到注册列表，但其不能下载注册列表。

> 使用场景：
>
>
>
> B是A的镜像，注册到A的服务同时也要注册到B
>
> 一共有a,b,c,s四个服务，其中b和c需要调用s，而注册中心b中，由于某种原因s服务暂时还没有提供
>
> 但是注册中心上因为是镜像所有有这个服务，这种情况下，b和c两个服务如果可以调用s，肯定会报错
>
> 这个时候就需要b和c仅能注册，不能下载，就不能发现服务，就不会调用

#### (2) 设置方式

对于“仅注册”注册中心的实现，只需修改`提供者`配置文件，在[dubbo:registry/](dubbo:registry/)标签中添加 subscribe=”false”的属性。即对于当前服务来说，注册中心中的其它服务可以发现和调用当前服务，但其不能发现和调用其它服务。

## 3. 服务暴露延迟

如果我们的服务启动过程需要 warmup 事件(预热事件)，就可以使用 delay 进行服务延迟暴露。只需在服务提供者的[dubbo:service/](dubbo:service/)标签中添加 delay 属性。其值可以有三类：

- 正数：单位为毫秒，表示在提供者对象创建完毕后的指定时间后再发布服务。
- 0：默认值，表示当前提供者创建完毕后马上向注册中心暴露服务。
- -1：表示在 Spring 容器初始化完毕后再向注册中心暴露服务。

> warmup 事件：JVM有个预热过程，在JVM重启成功之后等一段时间以后，性能才能达到最佳状态，这段时间会做一些初始化缓存、等待一些相关的资源就位等等。

## 4. 消费者的异步调用

### 4.1 应用场景

在Dubbo 简介时，我们分析了 Dubbo 的四大组件工作原理图，其中消费者调用提供者采用的是同步调用方式。其实，消费者对于提供者的调用，也可以采用异步方式进行调用。异步调用一般应用于提供者提供的是耗时性 IO 服务。

### 4.2 Future 异步执行原理

异步方法调用执行原理如下图所示，其中实线为同步调用，而虚线为异步调用。

- UserThread：消费者线程
- IOThrea：提供者线程
- Server：对 IO 型操作的真正执行者

### 4.3 Future 异步调用

#### (1) 创建提供者 10-provider-async

- A、创建工程

直接复制 02-provider-zk 工程，并命名为 10-provider-async。
- B、 定义业务接口

```java
public interface OtherService {
    String doFirst();
    String doSecond();
    String doThird();
    String doFourth();
}
```

- C、 定义实现类

```java
public class OtherServiceImpl implements OtherService {
    // 耗时操作
    private void sleep(String method) {
        // 记录开始时间
        long startTime = System.currentTimeMillis();
        try {
            TimeUnit.SECONDS.sleep(5);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
        // 记录结束时间
        long endTime = System.currentTimeMillis();
        long useTime = endTime - startTime;
        System.out.println(method + "方法执行用时：" + useTime);
    }
    @Override
    public String doFirst() {
        sleep("doFirst()");
        return "doFirst()";
    }
    @Override
    public String doSecond() {
        sleep("doSecond()");
        return "doSecond()";
    }
    @Override
    public String doThird() {
        sleep("doThird()");
        return "doThird()";
    }
    @Override
    public String doFourth() {
        sleep("doFourth()");
        return "doFourth()";
    }
}
```

- D、修改配置文件

异步调用是对于消费者来说的，所以提供者配置文件没有任何改动。

```java
<?xml version="1.0" encoding="UTF-8"?>
<beans xmlns="http://www.springframework.org/schema/beans"
       xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:dubbo="http://dubbo.apache.org/schema/dubbo"
       xsi:schemaLocation="http://www.springframework.org/schema/beans http://www.springframework.org/schema/beans/spring-beans.xsd http://dubbo.apache.org/schema/dubbo http://dubbo.apache.org/schema/dubbo/dubbo.xsd">
    <dubbo:application name="10-provider-async"/>
    <dubbo:registry address="zookeeper://zkOS:2181"/>
    <bean id="otherService" class="com.abc.provider.OtherServiceImpl"/>
    <dubbo:service interface="com.abc.service.OtherService"
                   ref="otherService" />
</beans>
```

#### (2) 创建消费者 10-consumer-async

- A、创建工程

直接复制 02-consumer-zk 工程，并命名为 10-consumer-async。
- B、 定义业务接口

```java
public interface OtherService {
    String doFirst();
    String doSecond();
    String doThird();
    String doFourth();
}
```

- C、 修改配置文件

```java
<?xml version="1.0" encoding="UTF-8"?>
<beans xmlns="http://www.springframework.org/schema/beans"
       xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:dubbo="http://dubbo.apache.org/schema/dubbo"
       xsi:schemaLocation="http://www.springframework.org/schema/beans http://www.springframework.org/schema/beans/spring-beans.xsd http://dubbo.apache.org/schema/dubbo http://dubbo.apache.org/schema/dubbo/dubbo.xsd">
    <dubbo:application name="10-consumer-async"/>
    <dubbo:registry address="zookeeper://zkOS:2181" />
		<!-- 指定超时timeout 20000，指定方法doThird和doFourth为异步 -->
    <dubbo:reference id="otherService"  timeout="20000"
                     interface="com.abc.service.OtherService" >
        <dubbo:method name="doThird" async="true"/>
        <dubbo:method name="doFourth" async="true"/>
    </dubbo:reference>
</beans>
```

- D、定义同步消费者类 ConsumerRunSync

```java
public class ConsumerRunSync {
    public static void main(String[] args) throws ExecutionException, InterruptedException {
        ApplicationContext ac = new ClassPathXmlApplicationContext("spring-consumer.xml");
        OtherService service = (OtherService) ac.getBean("otherService");
        // 记录同步调用开始时间
        long syncStart = System.currentTimeMillis();
        // 同步调用
        String first = service.doFirst();
        System.out.println("同步，doFirst()直接获取到返回值：" + first);
        String second = service.doSecond();
        System.out.println("同步，doSecond()直接获取到返回值：" + second);
        System.out.println("两个同步操作共计用时(毫秒)：" + (System.currentTimeMillis() - syncStart));
    }
}
```

- E、 定义异步消费者类 ConsumerRunAsync

```java
public class ConsumerRunAsync {
    public static void main(String[] args)
            throws ExecutionException, InterruptedException {
        ApplicationContext ac =
                new ClassPathXmlApplicationContext("spring-consumer.xml");
        OtherService service = (OtherService) ac.getBean("otherService");
        // 记录异步调用开始时间
        long asyncStart = System.currentTimeMillis();
        // 异步调用
        service.doThird();
        service.doFourth();
        long syncInvokeTime = System.currentTimeMillis() - asyncStart;
        System.out.println("两个异步调用共计用时(毫秒)：" + syncInvokeTime);
    }
}
```

- F、 定义异步消费者类 ConsumerRunAsync2

```java
public class ConsumerRunAsync2 {
    public static void main(String[] args)
            throws ExecutionException, InterruptedException {
        ApplicationContext ac =
                new ClassPathXmlApplicationContext("spring-consumer.xml");
        OtherService service = (OtherService) ac.getBean("otherService");
        // 记录异步调用开始时间
        long asyncStart = System.currentTimeMillis();
        // 异步调用
        String result1 = service.doThird();
        System.out.println("调用结果1 = " + result1);
        Future<String> thirdFuture = RpcContext.getContext().getFuture();
        String result3 = service.doFourth();
        System.out.println("调用结果3 = " + result3);
        Future<String> fourFuture = RpcContext.getContext().getFuture();
        // 阻塞
        String result2 = thirdFuture.get();
        System.out.println("调用结果2 = " + result2);
        String result4 = fourFuture.get();
        System.out.println("调用结果4 = " + result4);
        long useTime = System.currentTimeMillis() - asyncStart;
        System.out.println("获取到异步调用结果共计用时：" + useTime);
    }
}
```

### 4.4 CompletableFuture 异步调用

使用Future 实现异步调用，对于无需获取返回值的操作来说不存在问题，但消费者若需要获取到最终的异步执行结果，则会出现问题：消费者在使用 Future 的 get()方法获取返回值时被阻塞。为了解决这个问题，Dubbo 又引入了 CompletableFuture 来实现对提供者的异步调用。

#### (1) 创建提供者 10-provider-async2

- A、创建工程

直接复制 10-provider-async 工程，并命名为 10-provider-async2。
- B、 修改业务接口

需要异步调用执行的方法返回 CompletableFuture。

```java
public interface OtherService {
    String doFirst();
    String doSecond();
    CompletableFuture<String> doThird();
    CompletableFuture<String> doFourth();
}
```

- C、 修改实现类

```java
public class OtherServiceImpl implements OtherService {
    // 耗时操作
    private void sleep() {
        try {
            TimeUnit.SECONDS.sleep(5);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
    }
    @Override
    public String doFirst() {
        sleep();
        return "doFirst()";
    }
    @Override
    public String doSecond() {
        sleep();
        return "doSecond()";
    }
    @Override
    public CompletableFuture<String> doThird() {
        long startTime = System.currentTimeMillis();
        // 耗时操作仍由业务线程调用
        sleep();
        CompletableFuture<String> future =
                CompletableFuture.completedFuture("doThird()-----");
        long endTime = System.currentTimeMillis();
        long useTime = endTime - startTime;
        System.out.println("doThird()方法执行用时：" + useTime);
        return future;
    }
    @Override
    public CompletableFuture<String> doFourth() {
        long startTime = System.currentTimeMillis();
        sleep();
        CompletableFuture<String> future =
                CompletableFuture.completedFuture("doFourth()-----");
        long endTime = System.currentTimeMillis();
        long useTime = endTime - startTime;
        System.out.println("doFourth()方法执行用时：" + useTime);
        return future;
    }
}
```

#### (2) 创建消费者 10-consumer-async2

- A、创建工程

直接复制 10-consumer-async 工程，并命名为 10-consumer-async2。
- B、 修改业务接口

```java
public interface OtherService {
    String doFirst();
    String doSecond();
    CompletableFuture<String> doThird();
    CompletableFuture<String> doFourth();
}
```

- C、修改配置文件

可以看到这种方式，配置文件不需要设置async属性了，没有特殊的配置。

```java
<?xml version="1.0" encoding="UTF-8"?>
<beans xmlns="http://www.springframework.org/schema/beans"
       xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:dubbo="http://dubbo.apache.org/schema/dubbo"
       xsi:schemaLocation="http://www.springframework.org/schema/beans http://www.springframework.org/schema/beans/spring-beans.xsd http://dubbo.apache.org/schema/dubbo http://dubbo.apache.org/schema/dubbo/dubbo.xsd">
    <dubbo:application name="10-consumer-async2"/>
    <dubbo:registry address="zookeeper://zkOS:2181" />
    <dubbo:reference id="otherService"  timeout="20000"
                     interface="com.abc.service.OtherService" />
</beans>
```

- D、 修改消费者类

直接删除同步消费者类，修改异步消费者类。

```java
public class ConsumerRunAsync {
    public static void main(String[] args)
            throws ExecutionException, InterruptedException {
        ApplicationContext ac =
                new ClassPathXmlApplicationContext("spring-consumer.xml");
        OtherService service = (OtherService) ac.getBean("otherService");
        // 记录异步调用开始时间
        long asyncStart = System.currentTimeMillis();
        // 异步调用
        CompletableFuture<String> doThirdFuture = service.doThird();
        CompletableFuture<String> doFourthFuture = service.doFourth();
        long syncInvokeTime = System.currentTimeMillis() - asyncStart;
        System.out.println("两个异步调用共计用时(毫秒)：" + syncInvokeTime);
        // 回调方法
        doThirdFuture.whenComplete((result, throwable) -> {
            if(throwable != null) {
                throwable.printStackTrace();
            } else {
                System.out.println("异步调用提供者的doThird()返回值：" + result);
            }
        });
        doFourthFuture.whenComplete((result, throwable) -> {
            if(throwable != null) {
                throwable.printStackTrace();
            } else {
                System.out.println("异步调用提供者的doFourth()返回值：" + result);
            }
        });
        long getResultTime = System.currentTimeMillis() - asyncStart;
        System.out.println("=============(毫秒)：" + getResultTime);
    }
}
```

### 4.5 总结

Futrue 与 CompletableFuture 的区别与联系：

对于消费者不用获取提供者所调用的耗时操作结果的情况，使用 Future 与CompletableFuture 效果是区别不大的。但对于需要获取返回值的情况，它们的区别是很大的。

- Future：源自于 JDK5，Dubbo2.7.0 之前使用 Future 实现消费者对提供者的异步调用。通过 Future 的 get()获取返回结果，get()方法会阻塞，不好。
- CompletableFuture：源自于 JDK8，Dubbo2.7.0 之后使用 Future 实现消费者对提供者的异步调用。通过 CompletableFutrue 的回调获取返回结果，不会发生阻塞，好用。

## 5. 提供者的异步执行

从前面“对提供者的异步调用”例子可以看出，消费者对提供者实现了异步调用，消费者线程的执行过程不再发生阻塞，但提供者对 IO 耗时操作仍采用的是同步调用，即 IO 操作仍会阻塞 Dubbo 的提供者线程。

但需要注意，提供者对 IO 操作的异步调用，并不会提升 RPC 响应速度，因为耗时操作终归是需要消耗那么多时间后才能给出结果的。

### 5.1 创建提供者 10-provider-async3

#### (1) 创建工程

直接复制 10-provider-async2 工程，并命名为 10-provider-async3。

#### (2) 修改实现类

```java
public class OtherServiceImpl implements OtherService {
    // 耗时操作
    private void sleep() {
        try {
            TimeUnit.SECONDS.sleep(5);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
    }
    @Override
    public String doFirst() {
        sleep();
        return "doFirst()";
    }
    @Override
    public String doSecond() {
        sleep();
        return "doSecond()";
    }
    @Override
    public CompletableFuture<String> doThird() {
        long startTime = System.currentTimeMillis();
        // 异步调用耗时操作
        CompletableFuture<String> future = CompletableFuture.supplyAsync(() -> {
            // 耗时操作是由CompletableFuture调用的，而不是由业务线程直接调用
            sleep();
            return "doThird()";
        });
        long endTime = System.currentTimeMillis();
        System.out.println("doThird()方法执行用时：" + (endTime - startTime));
        return future;
    }
    @Override
    public CompletableFuture<String> doFourth() {
        long startTime = System.currentTimeMillis();
        // 异步调用耗时操作
        CompletableFuture<String> future = CompletableFuture.supplyAsync(() -> {
            sleep();
            return "doFourth()";
        });
        long endTime = System.currentTimeMillis();
        System.out.println("doFourth()方法执行用时：" + (endTime - startTime));
        return future;
    }
}
```

#### (3) 演示

consumer：

provider：
