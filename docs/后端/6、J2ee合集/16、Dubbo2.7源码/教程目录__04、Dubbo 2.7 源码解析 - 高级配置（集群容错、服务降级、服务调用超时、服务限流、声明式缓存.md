# 04、Dubbo 2.7 源码解析 - 高级配置（集群容错、服务降级、服务调用超时、服务限流、声明式缓存
- 来源：https://ddkk.com/zhuanlan/j2ee/dubbo/3/4.html
- 分类：J2EE框架
- 分组：教程目录
## 1. 集群容错

集群容错指的是，当消费者调用提供者**集群**时发生异常的处理方案。

### 1.1 Dubbo 内置的容错策略

Dubbo 内置了 6 种集群容错策略。

#### (1) Failover

`故障转移策略`。当消费者调用提供者集群中的某个服务器失败时，其会自动尝试着调用其它服务器。`该策略通常用于读操作`，例如，消费者要通过提供者从 DB 中读取某数据。但重试会带来服务延迟。

#### (2) Failfast

快速失败策略。消费者端只发起一次调用，若失败则立即报错。`通常用于非幂等性的写操作`，比如新增记录。

> 幂等：在编程中一个幂等操作的特点是其任意多次执行所产生的影响均与一次执行的影响相同
>
> GET 请求：幂等
>
> POST 请求：非幂等
>
> PUT 请求：幂等
>
> DELETE 请求：幂等

#### (3) Failsafe

失败安全策略。当消费者调用提供者出现异常时，直接忽略本次消费操作。该策略通常用于执行相对不太重要的服务，例如，写入审计日志等操作。

#### (4) Failback

失败自动恢复策略。消费者调用提供者失败后，Dubbo 会记录下该失败请求，然后定时自动重新发送该请求。该策略通常用于实时性要求不太高的服务，例如消息通知操作。

#### (5) Forking

并行策略。消费者对于同一服务并行调用多个提供者服务器，只要一个成功即调用结束并返回结果。通常用于实时性要求较高的读操作，但其会浪费较多服务器资源。

#### (6) Broadcast

广播策略。广播调用所有提供者，逐个调用，任意一台报错则报错。通常用于通知所有提供者更新缓存或日志等本地资源信息。

### 1.2 配置集群容错策略

容错策略可以设置在消费者端，也可以设置在提供者端。若消费者与提供者均做了设置，则消费者端的优先级更高。

#### (1) 设置重试次数

Dubbo 默认的容错策略是故障转移策略 Failover，即允许失败后重试。可以通过如下方式来设置重试次数，注意设置的是重试次数，不含第一次正常调用。

- A、提供者端设置

服务级别：

方法级别：
- B、 消费者端设置

#### (2) 容错策略设置

`只有重试次数可以是方法级别的，容错策略只能配置服务级别`

- A、提供者端
- B、 消费者端

## 2. 服务降级

> 解决高并发三把利器：缓存、限流、降级

### 2.1 服务降级基础(面试题)

#### (1) 什么是服务降级

服务降级，当服务器压力剧增的情况下，根据当前业务情况及流量对一些服务有策略的降低服务级别，以释放服务器资源，保证核心任务的正常运行。例如，双 11 时 0 点-2 点期间淘宝用户不能修改收货地址，不能查看历史订单，就是典型的服务降级。

#### (2) 服务降级方式

能够实现服务降级方式很多，常见的有如下几种情况：

- 部分服务暂停：页面能够访问，但是部分服务暂停服务，不能访问。
- 全部服务暂停：系统入口页面就不能访问，提示由于服务繁忙此服务暂停。跳转到一个预先设定好的静态页面。
- 随机拒绝服务：服务器会按照预先设定好的比例，随机挑选用户，对其拒绝服务。作为用户，其看到的就是请重试。可能再重试就可获得服务。
- 部分服务延迟：页面可以访问，当用户提交某些请求时系统会提示该操作已成功提交给了服务器，由于当前服务器繁忙，此操作随后会执行。在等待了若干时间后最终用户可以看到正确的执行结果。

#### (3) 整个系统的服务降级埋点

- 路由网关：用户访问可以直接转发到一个静态页面，属于全部服务暂停的情况
- 消费者：dubbo/springCloud的服务降级一般就指消费者端，用户提交请求到消费者端后就不往后走了，直接返回一个响应，这个响应结果不是提供者运算出来的，而是事先设定好的值（Mock、缓存…）
- 数据缓存层：比如做某一个查询，不管请求参数是什么，只要是做这个查询就直接返回这个结果，这个结果就在缓存里放着
- 消息中间件：属于部分服务延迟的情况，请求接受到了，放到mq里面进行排队，一个一个的处理，最终也能给你结果，但是稍慢一些
- 提供者：不到数据库里查了，直接返回一个事先设定好的值(是一个埋点，但是一般不在这做，意义不大)

> 整个系统中只有静态代理服务器是不能做降级的，在上面所有埋点中只有消息中间件可以返回给用户正确的结果，只不过慢一些，而其他降级方式给用户的结果都是假的。

#### (4) 服务降级与 Mock 机制

Dubbo的服务降级采用的是mock机制。其具有两种降级处理方式：Mock Null降级处理，与 Class Mock 降级处理。

### 2.2 Mock Null 服务降级处理 06-consumer-mocknull

#### (1) 创建消费者工程

直接复制 02-consumer-zk 工程，并命名为 06-consumer-mocknull

#### (2) 定义接口

```java
public interface UserService {
    String getUsernameById(int id);
    void addUser(String username);
}
```

#### (3) 修改 pom 文件

由于这里不再需要 00-api 工程了，所以在 pom 文件中将对 00-api 工程的依赖删除即可。

#### (4) 修改 spring-consumer.xml

```java
<?xml version="1.0" encoding="UTF-8"?>
<beans xmlns="http://www.springframework.org/schema/beans"
       xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:dubbo="http://dubbo.apache.org/schema/dubbo"
       xsi:schemaLocation="http://www.springframework.org/schema/beans http://www.springframework.org/schema/beans/spring-beans.xsd http://dubbo.apache.org/schema/dubbo http://dubbo.apache.org/schema/dubbo/dubbo.xsd">
    <dubbo:application name="06-consumer-mocknull"/>
    <dubbo:registry address="zookeeper://zkOS:2181" />
	<!-- mock="return null",check="false"去掉状态检查 -->
    <dubbo:reference id="userService" mock="return null" check="false"
                     interface="com.abc.service.UserService"/>
</beans>
```

#### (5) 修改消费者启动类

```java
public class ConsumerRun {
    public static void main(String[] args) {
        ApplicationContext ac = new ClassPathXmlApplicationContext("spring-consumer.xml");
        UserService service = (UserService) ac.getBean("userService");
        // 对于有返回值的方法，其返回结果为null
        String username = service.getUsernameById(3);
        System.out.println("username = " + username);
        // 对于没有返回值的方法，其没有任何结果
        service.addUser("China");
    }
}
```

#### (6) 演示

只启动消费者，相当于提供者宕机了：

### 2.3 Class Mock 服务降级处理 06-consumer-mockclass

#### (1) 创建消费者工程

本例直接在前面的例子基础上进行修改。

#### (2) 定义 Mock Class

在`业务接口所在的包`中，本例为 com.abc.service 包，定义一个类，该类的命名需要满足以下规则：`业务接口简单类名 + Mock`。

```java
public class UserServiceMock implements UserService {
    @Override
    public String getUsernameById(int id) {
        return "没有该用户：" + id;
    }
    @Override
    public void addUser(String username) {
        System.out.println("添加该用户失败：" + username);
    }
}
```

#### (3) 修改 spring-consumer.xml

```java
<?xml version="1.0" encoding="UTF-8"?>
<beans xmlns="http://www.springframework.org/schema/beans"
       xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:dubbo="http://dubbo.apache.org/schema/dubbo"
       xsi:schemaLocation="http://www.springframework.org/schema/beans http://www.springframework.org/schema/beans/spring-beans.xsd http://dubbo.apache.org/schema/dubbo http://dubbo.apache.org/schema/dubbo/dubbo.xsd">
    <dubbo:application name="06-consumer-mockclass"/>
    <dubbo:registry address="zookeeper://zkOS:2181" />
	<!-- mock="true" -->
    <dubbo:reference id="userService" mock="true" check="false"
                     interface="com.abc.service.UserService"/>
</beans>
```

#### (4) 演示

## 3. 服务调用超时

`前面的服务降级的发生，其实是由于消费者调用服务超时引起的`，即从发出调用请求到获取到提供者的响应结果这个时间超出了设定的时限。`默认服务调用超时时限为 1 秒。可以在消费者端与提供者端设置超时时限`。

### 3.1 创建提供者工程 06-provider-timeout

#### (1) 创建工程

复制02-provider-zk 工程，并重命名为 06-provider-timeout。

#### (2) 修改依赖

由于这里不再需要 00-api 工程了，所以在 pom 文件中将对 00-api 工程的依赖删除即可。

#### (3) 定义接口

在com.abc.service 包中定义如下接口。

```java
public interface UserService {
    String getUsernameById(int id);
    void addUser(String username);
}
```

#### (4) 定义接口实现类

在com.abc.provider 包中定义接口的实现类。该实现类中的业务方法添加一个 2 秒的Sleep，以延长向消费者返回结果的时间。

```java
public class UserServiceImpl implements UserService {
    @Override
    public String getUsernameById(int id) {
        try {
            TimeUnit.SECONDS.sleep(2);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
        // 这里暂且返回一个指定的值
        return "张三";
    }
    @Override
    public void addUser(String username) {
        // 这里暂且返回一个指定的成功提示
        System.out.println("添加用户成功");
    }
}
```

#### (5) 修改配置文件

```java
<?xml version="1.0" encoding="UTF-8"?>
<beans xmlns="http://www.springframework.org/schema/beans"
       xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:dubbo="http://dubbo.apache.org/schema/dubbo"
       xsi:schemaLocation="http://www.springframework.org/schema/beans http://www.springframework.org/schema/beans/spring-beans.xsd http://dubbo.apache.org/schema/dubbo http://dubbo.apache.org/schema/dubbo/dubbo.xsd">
    <dubbo:application name="06-provider-timeout" />
    <!--指定服务注册中心：zk单机-->
    <dubbo:registry address="zookeeper://zkOS:2181"/>
    <bean id="userService" class="com.abc.provider.UserServiceImpl"/>
    <dubbo:service interface="com.abc.service.UserService"
                   ref="userService"  timeout="3000"/>
</beans>
```

### 3.2 创建消费者工程 06-consumer-timeout

#### (1) 创建工程

复制06-consumer-mockclass 工程，，并重命名为 06-consumer-timeout。

#### (2) 添加日志文件

在src/main/resources 下添加 log4j.properties 文件。

```java
log4j.appender.console=org.apache.log4j.ConsoleAppender
log4j.appender.console.Target=System.out
log4j.appender.console.layout=org.apache.log4j.PatternLayout
log4j.appender.console.layout.ConversionPattern=[%-5p] %m%n
log4j.rootLogger=info,console
```

#### (3) 演示

如果服务端不配置超时时限，默认是1秒，此时会超时得到mock的结果

服务端配置超时时限为3秒：

## 4. 服务限流

为了防止某个消费者的 QPS 或是所有消费者的 QPS 总和突然飙升而导致的重要服务的失效，系统可以对访问流量进行控制，这种对集群的保护措施称为服务限流。

Dubbo 中能够实现服务限流的方式较多，可以划分为两类：直接限流与间接限流。

- 直接限流：通过对连接的数量直接限制来达到限流的目的。超过限制则会让再来的请求等待，直到等待超时，或获取到相应服务(官方方案)。
- 间接限流：通过一些非连接数量设置的间接手段来达到限流的目的(个人经验)。

### 4.1 直接限流

#### (1) executes 限流—仅提供者端

该属性`仅能设置在提供者端`。可以设置为接口级别，也可以设置为方法级别。`对指定服务(方法)的连接数量进行限制。`

#### (2) accepts 限流—仅提供者端

该属性`仅可设置在提供者端的与`，`是针对指定协议的连接数进行限制。`

#### (3) actives 限流—两端均可

该限流方式与前两种不同的是，其可以设置在提供者端，也可以设置在消费者端。可以设置为接口级别，也可以设置为方法级别。

- A、提供者端限流
- 根据客户端与服务端建立的连接是长连接还是短连接，其意义不同：

`长连接`：当前这个服务上的一个长连接`最多能够处理的请求个数`。对长连接数量没有限制。
- `短连接`：当前这个服务上可以同时`处理的`短连接数量。

B、 消费者端限流

根据客户端与服务端建立的连接是长连接还是短连接，其意义不同：

- `长连接`：当前这个消费者的一个长连接`最多能够提交的请求个数`。对长连接数量没有限制。
- `短连接`：当前这个消费者可以同时`提交的`短连接数量。

#### (4) connections 限流—两端均可

可以设置在提供者端，也可以设置在消费者端。`限定连接的个数`。

一般情况下，我们使用的都是`默认的服务暴露协议 Dubbo`(其他协议都是短连接，connections和actives效果一样)，所以，一般会让 connections与 actives 联用。`connections 限制长连接的数量，而 actives 限制每个长连接上的请求数量`。

- A、提供者端限流
- B、 消费者端限流

### 4.2 间接限流

#### (1) 延迟连接 - 仅消费者端

只要消费者真正调用提供者方法时才创建长连接。

仅可设置在消费者端，且`不能设置为方法级别`。仅作用于 Dubbo 服务暴露协议。用于减少长连接数量。

#### (2) 粘连连接 - 仅消费者端

所谓粘连连接是指，让所有客户端要访问的同一接口的同一方法，尽可能是的由同一Inovker(提供者) 提供服务。`其用于限定流向。`

粘连连接`仅能设置在消费者端`，其可以设置为接口级别，也可以设置为方法级别。方法级别是，仅该方法启用粘连连接。接口级别则是指，接口中每一个方法均启用了粘连连接，不用再逐个方法设置了。

`仅作用于 Dubbo 服务暴露协议`。用于减少长连接数量。`粘连连接的开启将自动开启延迟连接。`

#### (3) 负载均衡

可以设置在消费者端，亦可设置在提供者端；可以设置在接口级别，亦可设置在方法级别。`其可以限定流向，但其没有限制了流量。`

## 5. 声明式缓存

为了进一步提高消费者对用户的响应速度，减轻提供者的压力，Dubbo 提供了基于结果的声明式缓存。`该缓存是基于消费者端的，所以使用很简单，只需修改消费者配置文件，与提供者无关。`该缓存是缓存在消费者端内存中的，一旦缓存创建，即使提供者宕机也不会影响消费者端的缓存。

### 5.1 缓存设置 07-consumer-cache

#### (1) 创建工程

直接复制 02-consumer-zk 工程，并命名为 07-consumer-cache。

#### (2) 修改消费者配置文件

```java
<?xml version="1.0" encoding="UTF-8"?>
<beans xmlns="http://www.springframework.org/schema/beans"
       xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:dubbo="http://dubbo.apache.org/schema/dubbo"
       xsi:schemaLocation="http://www.springframework.org/schema/beans http://www.springframework.org/schema/beans/spring-beans.xsd http://dubbo.apache.org/schema/dubbo http://dubbo.apache.org/schema/dubbo/dubbo.xsd">
    <dubbo:application name="07-consumer-cache"/>
    <dubbo:registry address="zookeeper://zkOS:2181" />
	<!-- cache="true"启动缓存 -->
    <dubbo:reference id="someService"  cache="true"
                     interface="com.abc.service.SomeService"/>
</beans>
```

当然，若一个接口中只有部分方法需要缓存，则可使用方法级别的缓存。

#### (3) 修改 RunConsumer 类

```java
public class ConsumerRun {
    public static void main(String[] args) {
        ApplicationContext ac = new ClassPathXmlApplicationContext("spring-consumer.xml");
        SomeService service = (SomeService) ac.getBean("someService");
        System.out.println(service.hello("Tom"));
        System.out.println(service.hello("Jerry"));
        System.out.println(service.hello("Tom"));
        System.out.println(service.hello("Jerry"));
    }
}
```

#### (4) 演示

consumer：

provider：

### 5.2 默认缓存 1000 个结果

声明式缓存中可以缓存多少个结果呢？默认可以缓存 1000 个结果。若超出 1000，将采用 LRU 策略来删除缓存，以保证最热的数据被缓存。注意，该删除缓存的策略不能修改。

直接在07-consumer-cache 工程中创建 ConsumerRun2 类即可。

```java
public class ConsumerRun2 {
    public static void main(String[] args) {
        ApplicationContext ac =
                new ClassPathXmlApplicationContext("spring-consumer.xml");
        SomeService service = (SomeService) ac.getBean("someService");
		//1000次不同的消费者结果，占满1000个缓存空间
        for (int i=1; i<=1000; i++) {
            service.hello("i==" + i);
        }
        // 调用提供者，并将其执行结果存放到缓存，根据
        // LRU(最近最少使用)策略，其会将i==1的缓存结果挤出去
        System.out.println(service.hello("Tom"));
        // 由于缓存中已经没有了i==1的缓存，所以其会调用提供者，
        // 并将其执行结果存放到缓存，根据LRU(最近最少使用)策略，其会将i==2的缓存结果挤出去
        System.out.println(service.hello("i==1"));
        // 缓存中存在i==3的内容，所以其不会调用提供者
        System.out.println(service.hello("i==3"));
    }
}
```

**演示：**

### 5.3 应用场景

应用于查询结果不会发生改变的情况，例如，查询某产品的序列号、订单、身份证号等。(因为存在缓存一致性问题)
