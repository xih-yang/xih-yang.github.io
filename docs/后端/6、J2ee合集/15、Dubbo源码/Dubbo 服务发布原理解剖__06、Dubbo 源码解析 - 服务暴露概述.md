# 06、Dubbo 源码解析 - 服务暴露概述
- 来源：https://ddkk.com/zhuanlan/j2ee/dubbo/1/6.html
- 分类：J2EE框架
- 分组：Dubbo 服务发布原理解剖
dubbo的服务模型是非常简单的，要么是服务提供方(Provider)提供服务，要么是服务消费方(Consumer)消费服务，从[dubbo官网](http://dubbo.io/)的系统架构图就可以看出来。

Provider与Consumer通过Registry来解耦合，这一点和Spring有点相似。在Spring中它的核心领域模型是Bean.我们通过配置bean，然后Spring容器获取到需要的对象。不需要关心对象的创建过程，并且我们可以在Spring的Bean的生命周期过程来来定制化对象。在使用dubbo的时候并不需要服务暴露与服务引用的细节。我们只需要在服务端配置：

> provider-beans.xml

```java
<?xml version="1.0" encoding="UTF-8"?>
<beans xmlns="http://www.springframework.org/schema/beans"
       xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
       xmlns:dubbo="http://code.alibabatech.com/schema/dubbo"
       xsi:schemaLocation="http://www.springframework.org/schema/beans 
       http://www.springframework.org/schema/beans/spring-beans.xsd 
	   http://code.alibabatech.com/schema/dubbo/dubbo.xsd">
    <dubbo:application name="demo-provider"/>
    <dubbo:registry address="multicast://224.5.6.7:1234"/>
    <dubbo:protocol name="dubbo" port="20880"/>
    <dubbo:service interface="com.alibaba.dubbo.demo.DemoService" ref="demoService"/>
    <bean id="demoService" class="com.alibaba.dubbo.demo.provider.DemoServiceImpl"/>
</beans>
```

在服务消费方法配置：

> consumer-beans.xml

```java
<?xml version="1.0" encoding="UTF-8"?>
<beans xmlns="http://www.springframework.org/schema/beans"
       xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
       xmlns:dubbo="http://code.alibabatech.com/schema/dubbo"
       xsi:schemaLocation="http://www.springframework.org/schema/beans 
	   http://code.alibabatech.com/schema/dubbo 
	   http://code.alibabatech.com/schema/dubbo/dubbo.xsd">
    <dubbo:application name="demo-consumer"/>
    <dubbo:registry address="multicast://224.5.6.7:1234"/>
    <dubbo:reference id="demoService" interface="com.alibaba.dubbo.demo.DemoService"/>
</beans>
```

就能够像本地方法调用一样，远程调用远程服务暴露的服务。

#### 一、dubbo的领域对象

在dubbo当中它的核心领域对象就是Invoker，它是 Dubbo 的核心模型，其它模型都向它靠扰，或转换成它。

在dubbo中通过Protocol这个来管理Invoker的生命周期，包括服务的暴露与引用都是通过它来完成的。而在进行服务调用的时候通过Invocation来保存调用过程中的变量：包括方法名，参数等。所以在整个dubbo调用过程当中：

- Invoker 是实体域，它是 Dubbo 的核心模型，其它模型都向它靠扰，或转换成它，它代表一个可执行体，可向它发起 invoke 调用，它有可能是一个本地的实现，也可能是一个远程的实现，也可能一个集群实现。
- Protocol 是服务域，它是 Invoker 暴露和引用的主功能入口，它负责 Invoker 的生命周期管理。
- Invocation 是会话域，它持有调用过程中的变量，比如方法名，参数等。

#### 二、dubbo的服务暴露

在服务提供者暴露的时候，首先从配置文件中获取到对外提供的实际类`ref`(如：HelloWorldImpl)，然后通过`ProxyFactory`类(包括JavassistProxyFactory，JdkProxyFactory)把`ref`生成一个`AbstractProxyInvoker`实例，到这里就完成了具体服务到Invoker的转化 ，转化后的Invoke如下图所示：

在Invoker中主要包括以下几个属性：

**1、** 当前接口的Class实例(DemoService.class)；

**2、** 当前接口的实例类对象(DemoServiceImpl.class)；

**3、** URL，配置信息的统一格式，所有扩展点都通过传递URL携带配置信息；

**4、** 当前接口的代理对象Wrapper实例；

下面就是Invoker转化成Exporter的过程。配置不同的协议dubbo暴露的方式就不一样，我们以默认的dubbo协议来说明。Dubbo协议把Invoke转化成Exporter主要是通过DubboExporter的`export`方法来进行暴露的。它主要是在当前机器通过配置的端口号打开socket监听服务，并收服务调用方发送过来的请求，默认通过netty来实现网络间的数据传输。

上面的服务暴露的对象转换是 dubbo 官方提供的，下面是具体的使用 zookeeper 为注册中心时， dubbo 的对象转换过程：

如果大家看了后面的服务暴露的源码分析对于上面的图会有更加深刻的认识。

#### 三、服务的注册

在服务的暴露过程中其实包括二个过程：一是把服务暴露通过配置相应的协议暴露到本地服务；二是把暴露的服务注册到暴露到配置的注册中心中去。其实dubbo服务暴露与注册主要是通过`RegistryProtocol`这个类来完成的。以dubbo为通信协议，zookeeper为注册中心举例。

#### 四、总结

在dubbo中屏蔽了远程调用的各个细节，抽象出了服务注册方(Provider)、注册中心(Registry)和服务消费方(Consumer),实现了服务发布与服务调用的解耦。并且做为服务调用可以以本地方法的形式来调用远程服务。关于服务发布与服务调用的上面只是说了服务暴露的主要的三个过程。其实在服务暴露的时候发出了以下几个动作：

- 暴露本地服务
- 暴露远程服务
- 启动Netty
- 连接Zookeeper
- 到Zookeeper中注册
- 监听zookeeper

关于服务发布的更多细节会在后面的博客当中慢慢说明。
