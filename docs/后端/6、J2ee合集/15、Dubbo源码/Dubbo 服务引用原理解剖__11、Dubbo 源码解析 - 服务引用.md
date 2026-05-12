# 11、Dubbo 源码解析 - 服务引用
- 来源：https://ddkk.com/zhuanlan/j2ee/dubbo/1/11.html
- 分类：J2EE框架
- 分组：Dubbo 服务引用原理解剖
在使用dubbo 的时候，我们对于远程服务调用是无感知的。当需要调用远程服务的时候我们只需要进行以下配置，就可以像本地调用的方式调用远程服务：

```java
<?xml version="1.0" encoding="UTF-8"?>
<beans xmlns="http://www.springframework.org/schema/beans"
       xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
       xmlns:dubbo="http://code.alibabatech.com/schema/dubbo"
       xsi:schemaLocation="http://www.springframework.org/schema/beans 
       http://www.springframework.org/schema/beans/spring-beans.xsd 
	   http://code.alibabatech.com/schema/dubbo/dubbo.xsd">
    <dubbo:application name="demo-consumer"/>
    <dubbo:registry address="zookeeper://localhost:2181"/>
    <dubbo:reference id="demoService" interface="com.alibaba.dubbo.demo.DemoService"/>
</beans>
```

下面的图片是 dubbo 官方服务消费者消费一个服务的详细过程的图：

dubbo 的服务引用其实就是把上面的配置解析成 dubbo 框架的 `ReferenceConfig(接口引用配置类)`，然后调用`ReferenceConfig`类的 `init` 方法调用 `Protocol` 的 `refer`方法生成 `Invoker` 实例(如上图中的红色部分)，这是服务消费的关键。接下来把`Invoker`转换为客户端需要的接口(如：HelloService)。

关于每种协议如 RMI/Dubbo/Web service 等它们在调用 refer 方法生成 Invoker 实例。最后调用 ProxyFactory#getProxy(Invoker)生成远程暴露服务接口的代理对象。

**那么 dubbo 在框架内部是如何实现的呢？下面我们来具体分析一下它的源码实现。**

我们在xml 里面配置 dubbo 服务的引用，其实是 dubbo 实现了[自定义命名空间](https://blog.csdn.net/u012410733/article/details/54413704)的方式来集成 Spring 框架。这样通过 Spring 的 IOC 特性可以很方便的创建 dubbo 的配置对象。

对于 `` 标签 Spring 会把它解析成 ReferenceBean 对象，并且这个对象是一个 [FactoryBean](https://blog.csdn.net/u012410733/article/details/52196076)。所以当我们通过 Spring 依赖注入这个对象的时候会调用 ReferenceBean#getObject 获取接口对象的实例。它会把参数解析到一个 Map 中，然后根据其中的参数创建服务引用的代理对象。Map 里面的值大概如下所示：

#### 1、ReferenceConfig#createProxy

**1、**`loadRegistries()`加载注册中心配置，因为dubbo支持多配置中心，所以返回URL的集合；

**2、** 便利注册中心`List`集合：加载监控中心URL，如果配置了监控中心就在注册URL加上`monitor`;把服务引用的配置参数添加到注册URL的`refer`参数上；

3、Protocol#refer引用远程服务，通过注册中心 URL 与 接口 Class 创建 Invoker 调用对象。

**4、**`proxyFactory.getProxy(invoker);`通过代理工厂创建远程服务代理返回给使用者；

#### 2、Procotol#refer

和服务暴露一样，consumer 端进行服务调用的时候，可以对 dubbo 框架进行扩展:`com.alibaba.dubbo.rpc.ExporterListener`与`com.alibaba.dubbo.rpc.Filter`。所以获取到的 Procotol 实例的结构是：

- ProtocolListenerWrapper
- ProtocolFilterWrapper

RegistryProtocol

1、RegistryFactory#getRegistry获取到 zookeeper 注册中心，和[服务暴露获取注册中心](https://blog.csdn.net/u012410733/article/details/79562117)的逻辑一样。

**2、** 创建注册服务目录RegistryDirectory；

**3、** 注册服务消费者URL到zookeeper，其实就是创建zookeeper的节点，和服务端发布类似；

```java
/dubbo/com.alibaba.dubbo.demo.DemoService/consumers
/consumer%3A%2F%2F192.168.20.1%2Fcom.alibaba.dubbo.demo.DemoService%3Fapplication%3Ddemo-consumer%26category%3Dconsumers%26check%3Dfalse%26dubbo%3D2.0.0%26interface%3Dcom.alibaba.dubbo.demo.DemoService%26methods%3DsayHello%26pid%3D3808%26qos.port%3D33333%26side%3Dconsumer%26timestamp%3D1522590290256
```

**4、** 订阅zookeeper以下结点，当服务发生变更时，销毁无效的Invoke.刷新RegistryDirectory中的`Map>>methodInvokerMap`对象；

- /dubbo/com.alibaba.dubbo.demo.DemoService/providers
- /dubbo/com.alibaba.dubbo.demo.DemoService/configurators
- /dubbo/com.alibaba.dubbo.demo.DemoService/routers

5、调用cluster#join(directory) 合并 invoker 创建并提供集群 failover （故障转移）调用策略

- cluster#join(directory)//加入集群路由

ExtensionLoader#getExtensionLoader(Cluster.class).getExtension(“failover”);

MockClusterWrapper#join

this.cluster#join(directory)

FailoverCluster#join
- new FailoverClusterInvoker(directory)

return new MockClusterInvoker(directory, new FailoverClusterInvoker(directory));

#### 3、DubboProtocol#refer

**1、** 通过接口Class对象、服务URL、ExchangeClient和`Set>invokers`创建DubboInvoke对象；

**2、** 获取ExchangeClient数据交换客户端HeaderExchangeClient，并创建心跳连接默认是创建Netty客户端用来调用暴露的远程调用；

**3、** 将创建的invoker(服务调用者)返回给目录服务，用来刷新RegistryDirectory中的`Map>>methodInvokerMap`对象；

#### 4、ProxyFactory#getProxy

通过代理工厂创建服务引用接口的代理对象，用于访问暴露的远程服务。

**1、** 根据dubboSPI机制默认获取到JavassistProxyFactory对象；

2、通过上面获取到的 Invoke对象以及引用的远程服务接口 + dubbo 里面的 EchoService 调用AbstractProxyFactory#getProxy(Invoker``, Class``[])获取到代理对象。

**3、** 使用JDK里面的InvocationHandler接口创建InvokerInvocationHandler对象，用来代理远程暴露服务Invoke调用对象创建远程暴露服务接口代理对象；
