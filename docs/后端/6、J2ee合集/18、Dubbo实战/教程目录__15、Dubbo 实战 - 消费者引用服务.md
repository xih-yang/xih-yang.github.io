# 15、Dubbo 实战 - 消费者引用服务
- 来源：https://ddkk.com/zhuanlan/j2ee/dubbo/4/15.html
- 分类：J2EE框架
- 分组：教程目录
### Refer取得invoker的过程

```java
<!-- 指定了哪种的注册中心，是基于zookeeper协议的，指定了注册中心的地址以及端口号 -->
<dubbo:registry protocol="zookeeper" client="zkclient" address="localhost:2181"/>
<!-- 引用远程DemoService服务 -->
<dubbo:reference id="demoService"interface="com.alibaba.d ubbo.demo.DemoService"/>
```

Spring加载每个[dubbo:reference/](dubbo:reference/)标签的时候都会生成一个ReferenceBean。

如上图，ReferenceBean实现了Spring的FactoryBean接口，实现了此接口的Bean通过Spring的BeanFactory.getBean(“beanName”)获取的对象不是配置的Bean本身，而是通过FactoryBean.getObject()方法返回的对象，此接口在Spring内部被广泛使用，用来获取代理对象等等。这里getObject方法用来生成对远程服务调用的代理。

**1、** loadRegistries()获取配置的注册中心的registryUrls；

**2、** 遍历registryUrls集合，给registryUrl加上referkey，该key就是要引用的远程服务；

```java
[registry://localhost:2181/com.alibaba.dubbo.registry.RegistryService?application=demo-consumer&dubbo=2.6.1&pid=2484&refer=application%3ddemo-consumer%26dubbo%3d2.6.1%26interface%3dcom.alibaba.dubbo.demo.DemoService%26methods%3dsayHello%26pid%3d2484%26side%3dconsumer%26timestamp%3d1415879965901&registry=dubbo&timestamp=1415879990670]
```

**3、** 遍历registryUrls集合，使用Protocol.refer(interface,registryUrl)方法refer到可执行对象invoker；

**4、** 如果注册中心有多个的话，通过集群策略Cluser.join()将多个invoker伪装成一个可执行invoker，这里默认使用available策略；

**5、** 利用代理工厂生成代理对象proxyFactory.getProxy(invoker)；

这里实际上跟export过程类似，通过RegistryProtocol.refer获得invoker。

### RegistryProtocol. Refer过程

**1、** 根据传入的registryUrl来选择RegistryProcol，它的协议属性是registry，下面要选择使用哪种注册中心，所以要根据REGISTRY_KEY属性重新设置registrUrl；

```java
dubbo://localhost:2181/com.alibaba.dubbo.registry.RegistryService?application=demo-consumer&dubbo=2.6.1&pid=4524&refer=application%3Ddemo-consumer%26dubbo%3D2.6.1%26interface%3Dcom.alibaba.dubbo.demo.DemoService%26methods%3DsayHello%26pid%3D4524%26side%3Dconsumer%26timestamp%3D1415881461048&timestamp=1415881461113
```

**2、** 根据registrUrl利用RegistryFactory获取注册器（过程跟暴露服务那边一样），这里是zookeeper协议，得到的注册器是ZookeeperRegistry；

**3、** 构建引用服务的subscribeUrl；

```java
consumer://192.168.56.1/com.alibaba.dubbo.demo.DemoService?application=demo-consumer&category=consumers&check=false&dubbo=2.6.1&interface=com.alibaba.dubbo.demo.DemoService&methods=sayHello&pid=8536&side=consumer&timestamp=1415945205031
```

并通过注册器向注册中心注册消费方，这里的category是consumers；

**4、** 构建目录服务RegistryDirectory；

构建消费者订阅url，category=providers表示去注册中心寻找注册的服务提供者。

```java
consumer://192.158.56.1/com.alibaba.dubbo.demo.DemoService?application=demo-consumer&category=providers,configurators,routers&dubbo=2.6.1&interface=com.alibaba.dubbo.demo.DemoService&methods=sayHello&pid=9692&side=consumer&timestamp=1415967547508
```

向注册中心订阅服务提供方，注册中心根据消费者传入的url找到匹配的服务提供者url (注意：这里服务提供者没有设置category，注册中心对于没有设置的默认取providers值)

```java
dubbo://192.168.56.1:20882/com.alibaba.dubbo.demo.DemoService?anyhost=true&application=demo-provider&dubbo=2.6.1&generic=false&interface=com.alibaba.dubbo.demo.DemoService&loadbalance=roundrobin&methods=sayHello&owner=william&pid=9828&side=provider&timestamp=1415968955329
```

然后注册中心回调服务消费者暴露的回调接口来对服务提供者的服务进行引用refer，生成对应的可执行对象invoker。服务提供者与服务的消费建立连接。

**5、** 通过Cluster合并directory中的invokers，返回可执行对象invoker；

**6、** ProxyFactory.getProxy(invoker)创建代理对象返回给业务方使用；

顺便说一下，若注册中心的协议是dubbo协议，注册者调注册中心的服务采用的默认集群调用策略是FailOver，选择一台注册中心，只有当失败的时候才重试其他服务器，注册中心实现也比较简单不具备集群功能， 如果想要初步的集群功能可以选用BroadcastCluster，它至少向每个注册中心遍历调用注册一遍。
