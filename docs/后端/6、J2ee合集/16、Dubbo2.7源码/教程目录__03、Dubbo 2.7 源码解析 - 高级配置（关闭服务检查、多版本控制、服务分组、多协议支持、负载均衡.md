# 03、Dubbo 2.7 源码解析 - 高级配置（关闭服务检查、多版本控制、服务分组、多协议支持、负载均衡
- 来源：https://ddkk.com/zhuanlan/j2ee/dubbo/3/3.html
- 分类：J2EE框架
- 分组：教程目录
## 高级配置

## 1. 关闭服务检查

### 1.1 搭建测试环境

修改工程 02-consumer-zk：

- A、修改 ConsumerRun 类

将对消费者方法的调用语句注释掉，使消费者暂时不调用消费者方法。(同时不启动提供者端)

```java
public class ConsumerRun {
    public static void main(String[] args) {
        ApplicationContext ac =
                new ClassPathXmlApplicationContext("spring-consumer.xml");
        SomeService service = (SomeService) ac.getBean("someService");
		//String hello = service.hello("China");
		//System.out.println(hello);
    }
}
```

- B、 运行测试

没有可用的provider：

运行后会报错。错误原因是检查 SomeService 的状态失败。
- C、 修改配置文件

修改如下：
- D、再运行

没有报错。

### 1.2 分析

`默认情况下，若服务消费者先于服务提供者启动，则消费者端会报错。因为默认情况下消费者会在启动时查检其要消费的服务的提供者是否已经注册，若未注册则抛出异常。`可以在消费者端的 spring 配置文件中添加 check=”false”属性，则可关闭服务检查功能。

只要注意启动顺序，该属性看似可以不使用。`但在循环消费场景下是必须要使用的`。即A 消费 B 服务，B 消费 C 服务，而 C 消费 A 服务。这是典型的循环消费。`在该场景下必须至少有一方要关闭服务检查功能，否则将无法启动任何一方`。

## 2. 多版本控制

当系统进行升级时，一般都是采用“灰度发布（又称为金丝雀发布）”过程。即在低压力时段，让部分消费者先调用新的提供者实现类，其余的仍然调用老的实现类，在新的实现类运行没有问题的情况下，逐步让所有消费者全部调用成新的实现类。多版本控制就是实现灰度发布的。

### 2.1 创建提供者 04-provider-version

#### (1) 创建工程

复制前面的提供者工程 02-provider-zk，并更名为 04-provider-version。

#### (2) 定义两个接口实现类

删除原来的 SomeServiceImpl 类，并新建两个实现类

```java
public class OldServiceImpl implements SomeService {
    @Override
    public String hello(String name) {
        System.out.println("执行【老】的提供者OldServiceImpl的hello() ");
        return "OldServiceImpl";
    }
}
public class NewServiceImpl implements SomeService {
    @Override
    public String hello(String name) {
        System.out.println("执行【新】的提供者NewServiceImpl的hello() ");
        return "NewServiceImpl";
    }
}
```

#### (3) 修改配置文件

指定版本 0.0.1 对应的是 oldService 实例，而版本 0.0.2 对应的是 newService 实例。

```java
<?xml version="1.0" encoding="UTF-8"?>
<beans xmlns="http://www.springframework.org/schema/beans"
       xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:dubbo="http://dubbo.apache.org/schema/dubbo"
       xsi:schemaLocation="http://www.springframework.org/schema/beans http://www.springframework.org/schema/beans/spring-beans.xsd http://dubbo.apache.org/schema/dubbo http://dubbo.apache.org/schema/dubbo/dubbo.xsd">
    <dubbo:application name="04-provider-version"/>
    <dubbo:registry address="zookeeper://zkOS:2181"/>
    <!--注册Service实现类-->
    <bean id="oldService" class="com.abc.provider.OldServiceImpl"/>
    <bean id="newService" class="com.abc.provider.NewServiceImpl"/>
    <!--暴露服务-->
    <dubbo:service interface="com.abc.service.SomeService"
                   ref="oldService" version="0.0.1"/>
    <dubbo:service interface="com.abc.service.SomeService"
                   ref="newService" version="0.0.2"/>
</beans>
```

### 2.2 创建消费者 04-consumer-version

#### (1) 创建工程

复制前面的消费者工程 02-consumer-zk，并更名为 04-consumer-version。

#### (2) 修改配置文件

该工程无需修改消费者类 SomeConsumer。

```java
<?xml version="1.0" encoding="UTF-8"?>
<beans xmlns="http://www.springframework.org/schema/beans"
       xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:dubbo="http://dubbo.apache.org/schema/dubbo"
       xsi:schemaLocation="http://www.springframework.org/schema/beans http://www.springframework.org/schema/beans/spring-beans.xsd http://dubbo.apache.org/schema/dubbo http://dubbo.apache.org/schema/dubbo/dubbo.xsd">
    <dubbo:application name="04-consumer-version"/>
    <dubbo:registry address="zookeeper://zkOS:2181" />
    <!--指定消费0.0.1版本，即oldService提供者-->
    <!--<dubbo:reference id="someService"  version="0.0.1"-->
                     <!--interface="com.abc.service.SomeService"/>-->
    <!--指定消费0.0.2版本，即newService提供者-->
    <dubbo:reference id="someService"  version="0.0.2"
                     interface="com.abc.service.SomeService"/>
</beans>
```

#### (3) 演示

consumer：

provider：

## 3. 服务分组

服务分组与多版本控制的使用方式几乎是相同的，只要将 version 替换为 group 即可。但使用目的不同。`使用版本控制的目的是为了升级，将原有老版本替换掉，将来不再提供老版本的服务，所以不同版本间不能出现相互调用`。`而分组的目的则不同，其也是针对相同接口，给出了多种实现类。但不同的是，这些不同实现并没有谁替换掉谁的意思，是针对不同需求，或针对不同功能模块所给出的不同实现。这些实现所提供的服务是并存的，所以它们间可以出现相互调用关系。`例如，对于支付服务的实现，可以有微信支付实现与支付宝支付实现等。

### 3.1 创建提供者 05-provider-group

#### (1) 创建工程

复制前面的提供者工程 04-provider-version，并更名为 05-provider-group。

#### (2) 定义两个接口实现类

删除原来的两个接口实现类，重新定义两个新的实现类。

```java
public class WeixinServiceImpl implements SomeService {
    @Override
    public String hello(String name) {
        System.out.println("使用【微信】付款");
        return "WeixinServiceImpl";
    }
}
public class ZhifubaoServiceImpl implements SomeService {
    @Override
    public String hello(String name) {
        System.out.println("使用【支付宝】付款");
        return "ZhifubaoServiceImpl";
    }
}
```

#### (3) 修改配置文件

```java
<?xml version="1.0" encoding="UTF-8"?>
<beans xmlns="http://www.springframework.org/schema/beans"
       xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:dubbo="http://dubbo.apache.org/schema/dubbo"
       xsi:schemaLocation="http://www.springframework.org/schema/beans http://www.springframework.org/schema/beans/spring-beans.xsd http://dubbo.apache.org/schema/dubbo http://dubbo.apache.org/schema/dubbo/dubbo.xsd">
    <dubbo:application name="05-provider-group"/>
    <dubbo:registry address="zookeeper://zkOS:2181"/>
    <!--注册Service实现类-->
    <bean id="weixinService" class="com.abc.provider.WeixinServiceImpl"/>
    <bean id="zhifubaoService" class="com.abc.provider.ZhifubaoServiceImpl"/>
    <!--暴露服务-->
    <dubbo:service interface="com.abc.service.SomeService"
                   ref="weixinService" group="pay.weixin"/>
    <dubbo:service interface="com.abc.service.SomeService"
                   ref="zhifubaoService" group="pay.zhifubao"/>
</beans>
```

### 3.2 创建消费者 05-consumer-group

#### (1) 创建工程

复制前面的提供者工程 04-consumer-version，并更名为 05-consumer-group。

#### (2) 修改配置文件

```java
<?xml version="1.0" encoding="UTF-8"?>
<beans xmlns="http://www.springframework.org/schema/beans"
       xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:dubbo="http://dubbo.apache.org/schema/dubbo"
       xsi:schemaLocation="http://www.springframework.org/schema/beans http://www.springframework.org/schema/beans/spring-beans.xsd http://dubbo.apache.org/schema/dubbo http://dubbo.apache.org/schema/dubbo/dubbo.xsd">
    <dubbo:application name="05-consumer-group"/>
    <dubbo:registry address="zookeeper://zkOS:2181" />
    <!--指定调用微信服务-->
    <dubbo:reference id="weixin"  group="pay.weixin"
                     interface="com.abc.service.SomeService"/>
    <!--指定调用支付宝服务-->
    <dubbo:reference id="zhifubao"  group="pay.zhifubao"
                     interface="com.abc.service.SomeService"/>
</beans>
```

#### (3) 修改消费者类

```java
public class ConsumerRun {
    public static void main(String[] args) {
        ApplicationContext ac = new ClassPathXmlApplicationContext("spring-consumer.xml");
        // 使用微信支付
        SomeService weixinService = (SomeService) ac.getBean("weixin");
        String weixin = weixinService.hello("China");
        System.out.println(weixin);
        // 使用支付宝支付
        SomeService zhifubaoService = (SomeService) ac.getBean("zhifubao");
        String zhifubao = zhifubaoService.hello("China");
        System.out.println(zhifubao);
    }
}
```

#### (4) 演示

consumer：

provider：

## 4. 多协议支持

除了`服务暴露协议` Dubbo 协议外，Dubbo 框架还支持另外 8 种服务暴露协议：RMI 协议、Hessian 协议、HTTP 协议、WebService 协议、Thrift 协议、Memcached 协议、Redis协议、Rest 协议。但在实际生产中，使用最多的就是 Dubbo 服务暴露协议。

> 服务暴露协议：
>
> 不管消费者还是提供者，在配置注册中心的时候我们用的都是zookeeper，所以消费者和提供者在和zookeeper之间通信的时候，用的协议就是zookeeper协议
>
>
>
>
>
> 而消费者和提供者之间通信也是需要协议的，这个协议就是服务暴露协议。

### 4.1 各个协议的特点

规律：大数据小并发用短连接协议，小数据大并发用长连接协议。

#### (1) dubbo 协议

- Dubbo 默认传输协议
- 连接个数：单连接
- 连接方式：长连接（只有dubbo协议是长连接）
- 传输协议：TCP
- 传输方式：NIO 异步传输
- 适用范围：传入传出参数数据包较小（建议小于 100K），消费者比提供者个数多，单一消费者无法压满提供者，尽量不要用 dubbo 协议传输大文件或超大字符串。

#### (2) rmi 协议

- 采用 JDK 标准的 java.rmi.* 实现
- 连接个数：多连接
- 连接方式：短连接
- 传输协议：TCP
- 传输方式：BIO 同步传输
- 适用范围：传入传出参数数据包大小混合（大的小的都行），消费者与提供者个数差不多，可传文件。

#### (3) hession 协议

- 连接个数：多连接
- 连接方式：短连接
- 传输协议：HTTP
- 传输方式：BIO 同步传输
- 适用范围：传入传出参数数据包较大，提供者比消费者个数多，提供者抗压能力较大，可传文件

#### (4) http 协议

- 连接个数：多连接
- 连接方式：短连接
- 传输协议：HTTP
- 传输方式：BIO 同步传输
- 适用范围：传入传出参数数据包大小混合，提供者比消费者个数多，可用浏览器查看，可用表单或 URL 传入参数，暂不支持传文件。

#### (5) webService 协议

- 连接个数：多连接
- 连接方式：短连接
- 传输协议：HTTP
- 传输方式：BIO 同步传输
- 适用场景：系统集成，跨语言调用

#### (6) thrift 协议

Thrift 是 Facebook 捐给 Apache 的一个 RPC 框架，其消息传递采用的协议即为 thrift协议。当前 dubbo 支持的 thrift 协议是对 thrift 原生协议的扩展。Thrift 协议不支持 null值的传递。

#### (7) memcached 协议与 redis 协议

它们都是高效的 KV 缓存服务器。它们会对传输的数据使用相应的技术进行缓存。

#### (8) rest 协议

若需要开发具有 RESTful 风格的服务，则需要使用该协议。

### 4.2 同一服务支持多种协议

对于多协议的用法有两种，一种是同一个服务支持多种协议，一种是不同的服务使用不同的协议。首先来看“同一服务支持多种协议”的用法。

#### (1) 修改提供者配置文件

直接在04-provider-version 工程中进行修改。

在提供者中要首先声明新添加的协议，然后在服务[dubbo:service/](dubbo:service/)标签中再增加该新的协议。若不指定，默认为 dubbo 协议。

这里需要理解这个服务暴露协议的意义。其是指出，消费者若要连接当前的服务，就需要通过这里指定的协议及端口号进行访问。这里的端口号可以是任意的，不一定非要使用默认的端口号（Dubbo 默认为 20880，rmi 默认为 1099）。这里指定的协议名称及端口号，在当前服务注册到注册中心时会一并写入到服务映射表中。当消费者根据服务名称查找到相应主机时，其同时会查询出消费此服务的协议、端口号等信息。其底层就是一个 Socket 编程，通过主机名与端口号进行连接。

#### (2) 修改消费者配置文件

直接在04-consumer-version 工程中进行修改。

在消费者引用服务时要指出所要使用的协议。

#### (3) 应用场景

“同一服务支持多种协议”的应用场景是：系统在使用过程中其使用场景逐渐发生了变化，例如，由原来的消费者数量多于提供者数量，变为了消费者数量与提供者数量差不多了，并且原来系统不用传输文件，现在的系统需要传输文件了。此时就将将原来默认的 dubbo协议更换为 rmi 协议。目的是为了兼容老工程，扩展新功能。

### 4.3 不同服务使用不同协议

#### (1) 应用场景

同一个系统中不同的业务具有不同的特点，所以它们的传输协议就应该根据它们的特点选择不同的协议。

例如对于前面使用服务分组实现的“微信支付”与“支付宝支付”，就可以针对不同的支付方式，使用不同的协议。

#### (2) 修改提供者配置文件

直接在05-provider-group 工程中进行修改。

首先要修改服务提供者配置文件：声明所要使用的协议；在使用[dubbo:service/](dubbo:service/)暴露服务时通过 protocal 属性指定所要使用的服务协议。

#### (3) 修改消费者配置文件

直接在05-consumer-group 工程中进行修改。

然后在消费者端通过[dubbo:reference/](dubbo:reference/)引用服务时通过添加 protocol 属性指定要使用的服务协议。

## 5. 负载均衡

### 5.1 搭建负载均衡环境

该负载均衡中同一服务会有三个提供者，它们均复制于原来的 02-provider-zk。消费者不用变。

#### (1) 复制提供者 02-provider-zk01

- A、创建工程

复制前面的 02-provider-zk 工程，并重命名为 02-provider-zk01。
- B、 修改配置文件

```java
<?xml version="1.0" encoding="UTF-8"?>
<beans xmlns="http://www.springframework.org/schema/beans"
       xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:dubbo="http://dubbo.apache.org/schema/dubbo"
       xsi:schemaLocation="http://www.springframework.org/schema/beans http://www.springframework.org/schema/beans/spring-beans.xsd http://dubbo.apache.org/schema/dubbo http://dubbo.apache.org/schema/dubbo/dubbo.xsd">
    <dubbo:application name="02-provider-zk01"/>
    <dubbo:protocol name="dubbo" port="20881"/>
    <dubbo:registry address="zookeeper://zkOS:2181"/>
    <bean id="someService" class="com.abc.provider.SomeServiceImpl"/>
    <dubbo:service interface="com.abc.service.SomeService"
                   ref="someService"/>
</beans>
```

- C、 修改 Service 实现类

```java
public class SomeServiceImpl implements SomeService {
    @Override
    public String hello(String name) {
        System.out.println("执行【第一个】提供者的hello() ");
        return "【第一个】提供者";
    }
}
```

#### (2) 复制提供者 02-provider-zk02

- A、创建工程

复制前面的 02-provider-zk01 工程，并重命名为 02-provider-zk02。
- B、 修改配置文件
- C、 修改 Service 实现类

```java
public class SomeServiceImpl implements SomeService {
    @Override
    public String hello(String name) {
        System.out.println("执行【第二个】提供者的hello() ");
        return "【第二个】提供者";
    }
}
```

#### (3) 复制提供者 02-provider-zk03

- A、创建工程

复制前面的 02-provider-zk01 工程，并重命名为 02-provider-zk03。
- B、 修改配置文件
- C、 修改 Service 实现类

```java
public class SomeServiceImpl implements SomeService {
    @Override
    public String hello(String name) {
        System.out.println("执行【第三个】提供者的hello() ");
        return "【第三个】提供者";
    }
}
```

### 5.2 负载均衡算法

`若消费者与提供者均设置了负载均衡策略，消费者端设置的优先级高。`

若消费者端没有显式的设置，但提供者端显式的设置了，且同一个服务（接口名、版本号、分组都相同）的负载均衡策略相同。消费者调用时会按照提供者设置的策略调用。

`若多个提供者端设置的不相同，则最后一个注册的会将前面注册的信息覆盖。`

#### (1) Dubbo 内置的负载均衡算法

Dubbo 内置了四种负载均衡算法。

- A、random

加权随机算法，是 Dubbo 默认的负载均衡算法。权重越大，获取到负载的机率就越大。权重相同，则会随机分配。

> 权重配置方式：

- B、 roundrobin

双权重轮询算法，是结合主机权重与轮询权重的、方法级别的轮询算法。权重越大，被选到的机率越大。
- C、 leastactive

加权最小活跃度调度算法。活跃度越小，其优选级就越高，被调度到的机率就越高。活跃度相同，则按照加权随机算法进行负载均衡。(服务器`正在`处理的请求越多，活跃度越高)
- D、consistenthash

一致性 hash 算法。对于相同参数的请求，其会被路由到相同的提供者。

> 如果请求参数有多个，默认对第一个参数进行hash，可以通过配置指定：
>
>
>
> 每一个提供者在hash环上会生成多个虚拟节点，通过虚拟节点可以映射到物理主机真正地址，默认可以生成160个虚拟主机，可以配置指定：

#### (2) 指定负载均衡算法

负载均衡算法可以在消费者端指定，也可以在提供者端指定。

- A、消费者端指定
- B、 提供者端指定
