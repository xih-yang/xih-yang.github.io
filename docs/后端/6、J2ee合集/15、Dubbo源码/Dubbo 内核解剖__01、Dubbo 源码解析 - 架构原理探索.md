# 01、Dubbo 源码解析 - 架构原理探索
- 来源：https://ddkk.com/zhuanlan/j2ee/dubbo/1/1.html
- 分类：J2EE框架
- 分组：Dubbo 内核解剖
在之前的文章中介绍了Dubbo的出现背景以及使用方式，下面我们通过源码的方式来分析一下Dubbo的架构。

#### 1、准备

在分析探索Dubbo架构原理之前，我们需要准备一下环境，用于后面我们来分析dubbo的架构。

##### 1.1 Zookeeper

Dubbo使用Zookeeper为注册中心。所以需要在本地启动zookeeper，作为Dubbo的注册中心。

- 启动Zookeeper服务：用于dubbo的注册中心。
- 启动Zookeeper Inspector:它是Zookeeper服务信息查看工具。

可以查看zookeeper上面的节点信息。

##### 1.2 Dubbo源代码

dubbo源代码的下载地址为:[alibaba/dubbo](https://github.com/alibaba/dubbo).通过dubbo里面的**dubbo-demo**项目我们来分析dubbo的项目架构原理。

##### 1.3 Maven

因为dubbo代码是通过maven进行项目管理的，所以需要具有maven的知识。

#### 2、Dubbo角色

从服务模型的角度来看,Dubbo采用的是一种非常简单的模型,要么是提供方提供服务，要么是消费方消费服务，所以基于这一点dubbo里面抽象出了服务提供方(Provider)和服务消费方(Consumer)两个角色。而连接Provider和Consumer的就是注册中心(Registry),Provider把服务暴露在Registry上，而Consumer通过Registry来调用暴露在Registry上面的服务。

节点角色说明：

- Provider: 暴露服务的服务提供方
- Consumer: 调用远程服务的服务消费方。
- Registry: 服务注册与发现的注册中心。
- Monitor: 统计服务的调用次调和调用时间的监控中心。
- Container: 服务运行容器。

#### 3、Dubbo Provider

下面我们就来启动`dubbo-demo`项目中子项目目`dubbo-demo-provider`来监控Dubbo在启动Provider的时候都做了哪些事。首先我们需要把配置文件修改一下。把注册中心替换成Zookeeper.

> dubbo\dubbo-demo\dubbo-demo-provider\src\test\resources\dubbo.properties

```java
dubbo.container=log4j,spring
dubbo.application.name=demo-provider
dubbo.application.owner=william
#dubbo.registry.address=multicast://224.5.6.7:1234
dubbo.registry.address=zookeeper://127.0.0.1:2181
#dubbo.registry.address=redis://127.0.0.1:6379
#dubbo.registry.address=dubbo://127.0.0.1:9090
dubbo.monitor.protocol=registry
dubbo.protocol.name=dubbo
dubbo.protocol.port=20880
dubbo.service.loadbalance=roundrobin
#dubbo.log4j.file=logs/dubbo-demo-consumer.log
#dubbo.log4j.level=WARN
```

然后使用demo里面的项目来启动Provider。启动类为:`com.alibaba.dubbo.demo.provider.DemoProvider`，它是以main方法启动。

```java
public class DemoProvider {
	public static void main(String[] args) {
        com.alibaba.dubbo.container.Main.main(args);
	}
}
```

我们首先来观察一下dubbo Provider的启动目录。

```java
Connected to the target VM, address: '127.0.0.1:55696', transport: 'socket'
[09/09/17 07:53:33:033 CST] main  INFO logger.LoggerFactory: using logger: com.alibaba.dubbo.common.logger.log4j.Log4jLoggerAdapter
[09/09/17 07:53:33:033 CST] main  INFO container.Main:  [DUBBO] Use container type([log4j, spring]) to run dubbo serivce., dubbo version: 2.0.0, current host: 127.0.0.1
[09/09/17 07:53:33:033 CST] main  INFO container.Main:  [DUBBO] Dubbo Log4jContainer started!, dubbo version: 2.0.0, current host: 127.0.0.1
[09/09/17 07:53:33:033 CST] main  INFO support.ClassPathXmlApplicationContext: Refreshing org.springframework.context.support.ClassPathXmlApplicationContext@6483f5ae: startup date [Sat Sep 09 19:53:33 CST 2017]; root of context hierarchy
[09/09/17 07:53:34:034 CST] main  INFO xml.XmlBeanDefinitionReader: Loading XML bean definitions from file [E:\Project\github\dubbo\dubbo-demo\dubbo-demo-provider\target\classes\META-INF\spring\dubbo-demo-provider.xml]
[09/09/17 07:53:34:034 CST] main  INFO support.DefaultListableBeanFactory: Pre-instantiating singletons in org.springframework.beans.factory.support.DefaultListableBeanFactory@683dbc2c: defining beans [demoService,com.alibaba.dubbo.demo.DemoService]; root of factory hierarchy
[09/09/17 07:53:36:036 CST] main  INFO config.AbstractConfig:  [DUBBO] The service ready on spring started. service: com.alibaba.dubbo.demo.DemoService, dubbo version: 2.0.0, current host: 127.0.0.1
[09/09/17 07:53:37:037 CST] main  INFO config.AbstractConfig:  [DUBBO] Export dubbo service com.alibaba.dubbo.demo.DemoService to local registry, dubbo version: 2.0.0, current host: 127.0.0.1
[09/09/17 07:53:37:037 CST] main  INFO config.AbstractConfig:  [DUBBO] Export dubbo service com.alibaba.dubbo.demo.DemoService to url dubbo://169.254.69.197:20880/com.alibaba.dubbo.demo.DemoService?anyhost=true&application=demo-provider&dubbo=2.0.0&generic=false&interface=com.alibaba.dubbo.demo.DemoService&loadbalance=roundrobin&methods=sayHello&owner=william&pid=7372&side=provider&timestamp=1504958016968, dubbo version: 2.0.0, current host: 127.0.0.1
[09/09/17 07:53:37:037 CST] main  INFO config.AbstractConfig:  [DUBBO] Register dubbo service com.alibaba.dubbo.demo.DemoService url dubbo://169.254.69.197:20880/com.alibaba.dubbo.demo.DemoService?anyhost=true&application=demo-provider&dubbo=2.0.0&generic=false&interface=com.alibaba.dubbo.demo.DemoService&loadbalance=roundrobin&methods=sayHello&monitor=dubbo%3A%2F%2F127.0.0.1%3A2181%2Fcom.alibaba.dubbo.registry.RegistryService%3Fapplication%3Ddemo-provider%26dubbo%3D2.0.0%26owner%3Dwilliam%26pid%3D7372%26protocol%3Dregistry%26refer%3Ddubbo%253D2.0.0%2526interface%253Dcom.alibaba.dubbo.monitor.MonitorService%2526pid%253D7372%2526timestamp%253D1504958017518%26registry%3Dzookeeper%26timestamp%3D1504958016859&owner=william&pid=7372&side=provider&timestamp=1504958016968 to registry registry://127.0.0.1:2181/com.alibaba.dubbo.registry.RegistryService?application=demo-provider&dubbo=2.0.0&owner=william&pid=7372&registry=zookeeper&timestamp=1504958016859, dubbo version: 2.0.0, current host: 127.0.0.1
[09/09/17 07:53:39:039 CST] main  INFO transport.AbstractServer:  [DUBBO] Start NettyServer bind /0.0.0.0:20880, export /169.254.69.197:20880, dubbo version: 2.0.0, current host: 127.0.0.1
--------------------------------------start connection zookeeper------------------------------------------
[09/09/17 07:53:39:039 CST] ZkClient-EventThread-17-127.0.0.1:2181  INFO zkclient.ZkEventThread: Starting ZkClient event thread.
[09/09/17 07:53:48:048 CST] main  INFO zookeeper.ZooKeeper: Client environment:zookeeper.version=3.3.3-1073969, built on 02/23/2011 22:27 GMT
[09/09/17 07:53:48:048 CST] main  INFO zookeeper.ZooKeeper: Client environment:host.name=carl
[09/09/17 07:53:48:048 CST] main  INFO zookeeper.ZooKeeper: Client environment:java.version=1.8.0_141
[09/09/17 07:53:48:048 CST] main  INFO zookeeper.ZooKeeper: Client environment:java.vendor=Oracle Corporation
[09/09/17 07:53:48:048 CST] main  INFO zookeeper.ZooKeeper: Client environment:java.home=D:\tool\Java\jdk1.8.0_141\jre
[09/09/17 07:53:48:048 CST] main  INFO zookeeper.ZooKeeper: Client environment:java.io.tmpdir=C:\Users\Carl\AppData\Local\Temp\
[09/09/17 07:53:48:048 CST] main  INFO zookeeper.ZooKeeper: Client environment:java.compiler=<NA>
[09/09/17 07:53:48:048 CST] main  INFO zookeeper.ZooKeeper: Client environment:os.name=Windows 10
[09/09/17 07:53:48:048 CST] main  INFO zookeeper.ZooKeeper: Client environment:os.arch=amd64
[09/09/17 07:53:48:048 CST] main  INFO zookeeper.ZooKeeper: Client environment:os.version=10.0
[09/09/17 07:53:48:048 CST] main  INFO zookeeper.ZooKeeper: Client environment:user.name=Carl
[09/09/17 07:53:48:048 CST] main  INFO zookeeper.ZooKeeper: Client environment:user.home=C:\Users\Carl
[09/09/17 07:53:48:048 CST] main  INFO zookeeper.ZooKeeper: Client environment:user.dir=E:\Project\github\dubbo
[09/09/17 07:53:48:048 CST] main  INFO zookeeper.ZooKeeper: Initiating client connection, connectString=127.0.0.1:2181 sessionTimeout=30000 watcher=org.I0Itec.zkclient.ZkClient@42f8285e
[09/09/17 07:53:48:048 CST] main-SendThread()  INFO zookeeper.ClientCnxn: Opening socket connection to server /127.0.0.1:2181
[09/09/17 07:53:48:048 CST] main-SendThread(127.0.0.1:2181)  INFO zookeeper.ClientCnxn: Socket connection established to 127.0.0.1/127.0.0.1:2181, initiating session
[09/09/17 07:53:48:048 CST] main-SendThread(127.0.0.1:2181)  INFO zookeeper.ClientCnxn: Session establishment complete on server 127.0.0.1/127.0.0.1:2181, sessionid = 0x15e664ff295000c, negotiated timeout = 30000
-------------------------------------------dubbo connectioned-------------------------------------
[09/09/17 07:53:48:048 CST] main-EventThread  INFO zkclient.ZkClient: zookeeper state changed (SyncConnected)
-------------------------------------------dubbo register provider----------------------------------
[09/09/17 07:53:48:048 CST] main  INFO zookeeper.ZookeeperRegistry:  [DUBBO] Register: dubbo://169.254.69.197:20880/com.alibaba.dubbo.demo.DemoService?anyhost=true&application=demo-provider&dubbo=2.0.0&generic=false&interface=com.alibaba.dubbo.demo.DemoService&loadbalance=roundrobin&methods=sayHello&owner=william&pid=7372&side=provider&timestamp=1504958016968, dubbo version: 2.0.0, current host: 127.0.0.1
[09/09/17 07:53:48:048 CST] main  INFO zookeeper.ZookeeperRegistry:  [DUBBO] Subscribe: provider://169.254.69.197:20880/com.alibaba.dubbo.demo.DemoService?anyhost=true&application=demo-provider&category=configurators&check=false&dubbo=2.0.0&generic=false&interface=com.alibaba.dubbo.demo.DemoService&loadbalance=roundrobin&methods=sayHello&owner=william&pid=7372&side=provider&timestamp=1504958016968, dubbo version: 2.0.0, current host: 127.0.0.1
[09/09/17 07:53:48:048 CST] main  INFO zookeeper.ZookeeperRegistry:  [DUBBO] Notify urls for subscribe url provider://169.254.69.197:20880/com.alibaba.dubbo.demo.DemoService?anyhost=true&application=demo-provider&category=configurators&check=false&dubbo=2.0.0&generic=false&interface=com.alibaba.dubbo.demo.DemoService&loadbalance=roundrobin&methods=sayHello&owner=william&pid=7372&side=provider&timestamp=1504958016968, urls: [empty://169.254.69.197:20880/com.alibaba.dubbo.demo.DemoService?anyhost=true&application=demo-provider&category=configurators&check=false&dubbo=2.0.0&generic=false&interface=com.alibaba.dubbo.demo.DemoService&loadbalance=roundrobin&methods=sayHello&owner=william&pid=7372&side=provider&timestamp=1504958016968], dubbo version: 2.0.0, current host: 127.0.0.1
[09/09/17 07:53:48:048 CST] main  INFO container.Main:  [DUBBO] Dubbo SpringContainer started!, dubbo version: 2.0.0, current host: 127.0.0.1
[2017-09-09 19:53:48] Dubbo service server started!
```

在上面的启动日志中，把dubbo主用的功能都标注了出来。然后我们通过zookeeper Inspector再来看一下zookeeper 的变量。

我们可以看到zookeeper里面多一个dubbo节点。在dubbo节点下是我们发布的服务：DemoService的全类名。在服务节点下面有configurations节点与providers节点。而在providers节点如下所示：

```java
/dubbo/com.alibaba.dubbo.demo.DemoService/providers/dubbo%3A%2F%2F169.254.69.197%3A20880%2Fcom.alibaba.dubbo.demo.DemoService%3Fanyhost%3Dtrue%26application%3Ddemo-provider%26dubbo%3D2.0.0%26generic%3Dfalse%26interface%3Dcom.alibaba.dubbo.demo.DemoService%26loadbalance%3Droundrobin%26methods%3DsayHello%26owner%3Dwilliam%26pid%3D15284%26side%3Dprovider%26timestamp%3D1504957132315
```

这正是我们对provider的配置信息。

所以在provider启动的时候做了以下几件事：

- 连接zookeeper注册中心,用于dubbo的注册中心
- 把服务配置信息以url的形式注册到zookeeper上面
- 创建了一个configuration节点，用于监听订阅admin的对provider的修改

#### 4、Dubbo Consumer

下面我们就来启动`dubbo-demo`项目中子项目目`dubbo-demo-consumer`来监控Dubbo在启动Consumer的时候都做了哪些事。首先我们需要把配置文件修改一下。把注册中心替换成Zookeeper.

> dubbo\dubbo-demo\dubbo-demo-consumer\src\test\resources\dubbo.properties

```java
dubbo.container=log4j,spring
dubbo.application.name=demo-consumer
dubbo.application.owner=
#dubbo.registry.address=multicast://224.5.6.7:1234
dubbo.registry.address=zookeeper://127.0.0.1:2181
#dubbo.registry.address=redis://127.0.0.1:6379
#dubbo.registry.address=dubbo://127.0.0.1:9090
dubbo.monitor.protocol=registry
#dubbo.log4j.file=logs/dubbo-demo-consumer.log
#dubbo.log4j.level=WARN
```

然后使用demo里面的项目来启动Consumer。启动类为:`com.alibaba.dubbo.demo.consumer.DemoConsumer`，它是以main方法启动。

```java
public class DemoConsumer {
	public static void main(String[] args) {
	    com.alibaba.dubbo.container.Main.main(args);
	}
}
```

我们首先来观察一下dubbo Consumer的启动目录。

```java
Connected to the target VM, address: '127.0.0.1:56208', transport: 'socket'
[09/09/17 07:58:52:052 CST] main  INFO logger.LoggerFactory: using logger: com.alibaba.dubbo.common.logger.log4j.Log4jLoggerAdapter
[09/09/17 07:58:52:052 CST] main  INFO container.Main:  [DUBBO] Use container type([log4j, spring]) to run dubbo serivce., dubbo version: 2.0.0, current host: 127.0.0.1
[09/09/17 07:58:52:052 CST] main  INFO container.Main:  [DUBBO] Dubbo Log4jContainer started!, dubbo version: 2.0.0, current host: 127.0.0.1
[09/09/17 07:58:52:052 CST] main  INFO support.ClassPathXmlApplicationContext: Refreshing org.springframework.context.support.ClassPathXmlApplicationContext@6483f5ae: startup date [Sat Sep 09 19:58:52 CST 2017]; root of context hierarchy
[09/09/17 07:58:52:052 CST] main  INFO xml.XmlBeanDefinitionReader: Loading XML bean definitions from file [E:\Project\github\dubbo\dubbo-demo\dubbo-demo-consumer\target\classes\META-INF\spring\dubbo-demo-action.xml]
[09/09/17 07:58:53:053 CST] main  INFO xml.XmlBeanDefinitionReader: Loading XML bean definitions from file [E:\Project\github\dubbo\dubbo-demo\dubbo-demo-consumer\target\classes\META-INF\spring\dubbo-demo-consumer.xml]
[09/09/17 07:58:53:053 CST] main  INFO support.DefaultListableBeanFactory: Pre-instantiating singletons in org.springframework.beans.factory.support.DefaultListableBeanFactory@3098cf3b: defining beans [com.alibaba.dubbo.demo.consumer.DemoAction#0,demoService]; root of factory hierarchy
[09/09/17 07:58:55:055 CST] main  INFO zookeeper.ZookeeperRegistry:  [DUBBO] Load registry store file C:\Users\Carl\.dubbo\dubbo-registry-127.0.0.1.cache, data: {com.alibaba.dubbo.demo.DemoService=empty://169.254.69.197:20880/com.alibaba.dubbo.demo.DemoService?anyhost=true&application=demo-provider&category=configurators&check=false&dubbo=2.0.0&generic=false&interface=com.alibaba.dubbo.demo.DemoService&loadbalance=roundrobin&methods=sayHello&owner=william&pid=5264&side=provider&timestamp=1504958323428}, dubbo version: 2.0.0, current host: 127.0.0.1
--------------------------------------start connection zookeeper------------------------------------------
[09/09/17 07:58:55:055 CST] ZkClient-EventThread-15-127.0.0.1:2181  INFO zkclient.ZkEventThread: Starting ZkClient event thread.
[09/09/17 07:59:04:004 CST] main  INFO zookeeper.ZooKeeper: Client environment:zookeeper.version=3.3.3-1073969, built on 02/23/2011 22:27 GMT
[09/09/17 07:59:04:004 CST] main  INFO zookeeper.ZooKeeper: Client environment:host.name=carl
[09/09/17 07:59:04:004 CST] main  INFO zookeeper.ZooKeeper: Client environment:java.version=1.8.0_141
[09/09/17 07:59:04:004 CST] main  INFO zookeeper.ZooKeeper: Client environment:java.vendor=Oracle Corporation
[09/09/17 07:59:04:004 CST] main  INFO zookeeper.ZooKeeper: Client environment:java.home=D:\tool\Java\jdk1.8.0_141\jre
[09/09/17 07:59:04:004 CST] main  INFO zookeeper.ZooKeeper: Client environment:java.io.tmpdir=C:\Users\Carl\AppData\Local\Temp\
[09/09/17 07:59:04:004 CST] main  INFO zookeeper.ZooKeeper: Client environment:java.compiler=<NA>
[09/09/17 07:59:04:004 CST] main  INFO zookeeper.ZooKeeper: Client environment:os.name=Windows 10
[09/09/17 07:59:04:004 CST] main  INFO zookeeper.ZooKeeper: Client environment:os.arch=amd64
[09/09/17 07:59:04:004 CST] main  INFO zookeeper.ZooKeeper: Client environment:os.version=10.0
[09/09/17 07:59:04:004 CST] main  INFO zookeeper.ZooKeeper: Client environment:user.name=Carl
[09/09/17 07:59:04:004 CST] main  INFO zookeeper.ZooKeeper: Client environment:user.home=C:\Users\Carl
[09/09/17 07:59:04:004 CST] main  INFO zookeeper.ZooKeeper: Client environment:user.dir=E:\Project\github\dubbo
[09/09/17 07:59:04:004 CST] main  INFO zookeeper.ZooKeeper: Initiating client connection, connectString=127.0.0.1:2181 sessionTimeout=30000 watcher=org.I0Itec.zkclient.ZkClient@1bd39d3c
[09/09/17 07:59:05:005 CST] main-SendThread()  INFO zookeeper.ClientCnxn: Opening socket connection to server /127.0.0.1:2181
[09/09/17 07:59:05:005 CST] main-SendThread(127.0.0.1:2181)  INFO zookeeper.ClientCnxn: Socket connection established to 127.0.0.1/127.0.0.1:2181, initiating session
[09/09/17 07:59:05:005 CST] main-SendThread(127.0.0.1:2181)  INFO zookeeper.ClientCnxn: Session establishment complete on server 127.0.0.1/127.0.0.1:2181, sessionid = 0x15e664ff295000e, negotiated timeout = 30000
-------------------------------------------dubbo connectioned-------------------------------------
[09/09/17 07:59:05:005 CST] main-EventThread  INFO zkclient.ZkClient: zookeeper state changed (SyncConnected)
-------------------------------------------dubbo Register consumer-------------------------------------
[09/09/17 07:59:05:005 CST] main  INFO zookeeper.ZookeeperRegistry:  [DUBBO] Register: consumer://169.254.69.197/com.alibaba.dubbo.demo.DemoService?application=demo-consumer&category=consumers&check=false&dubbo=2.0.0&interface=com.alibaba.dubbo.demo.DemoService&methods=sayHello&pid=14604&side=consumer&timestamp=1504958335273, dubbo version: 2.0.0, current host: 169.254.69.197
[09/09/17 07:59:05:005 CST] main  INFO zookeeper.ZookeeperRegistry:  [DUBBO] Subscribe: consumer://169.254.69.197/com.alibaba.dubbo.demo.DemoService?application=demo-consumer&category=providers,configurators,routers&dubbo=2.0.0&interface=com.alibaba.dubbo.demo.DemoService&methods=sayHello&pid=14604&side=consumer&timestamp=1504958335273, dubbo version: 2.0.0, current host: 169.254.69.197
[09/09/17 07:59:05:005 CST] main  INFO zookeeper.ZookeeperRegistry:  [DUBBO] Notify urls for subscribe url consumer://169.254.69.197/com.alibaba.dubbo.demo.DemoService?application=demo-consumer&category=providers,configurators,routers&dubbo=2.0.0&interface=com.alibaba.dubbo.demo.DemoService&methods=sayHello&pid=14604&side=consumer&timestamp=1504958335273, urls: [dubbo://169.254.69.197:20880/com.alibaba.dubbo.demo.DemoService?anyhost=true&application=demo-provider&dubbo=2.0.0&generic=false&interface=com.alibaba.dubbo.demo.DemoService&loadbalance=roundrobin&methods=sayHello&owner=william&pid=5264&side=provider&timestamp=1504958323428, empty://169.254.69.197/com.alibaba.dubbo.demo.DemoService?application=demo-consumer&category=configurators&dubbo=2.0.0&interface=com.alibaba.dubbo.demo.DemoService&methods=sayHello&pid=14604&side=consumer&timestamp=1504958335273, empty://169.254.69.197/com.alibaba.dubbo.demo.DemoService?application=demo-consumer&category=routers&dubbo=2.0.0&interface=com.alibaba.dubbo.demo.DemoService&methods=sayHello&pid=14604&side=consumer&timestamp=1504958335273], dubbo version: 2.0.0, current host: 169.254.69.197
[09/09/17 07:59:05:005 CST] main  INFO transport.AbstractClient:  [DUBBO] Successed connect to server /169.254.69.197:20880 from NettyClient 169.254.69.197 using dubbo version 2.0.0, channel is NettyChannel [channel=[id: 0x61ce23ac, /169.254.69.197:56252 => /169.254.69.197:20880]], dubbo version: 2.0.0, current host: 169.254.69.197
[09/09/17 07:59:05:005 CST] main  INFO transport.AbstractClient:  [DUBBO] Start NettyClient carl/169.254.69.197 connect to the server /169.254.69.197:20880, dubbo version: 2.0.0, current host: 169.254.69.197
[09/09/17 07:59:05:005 CST] main  INFO config.AbstractConfig:  [DUBBO] Refer dubbo service com.alibaba.dubbo.demo.DemoService from url zookeeper://127.0.0.1:2181/com.alibaba.dubbo.registry.RegistryService?anyhost=true&application=demo-consumer&check=false&dubbo=2.0.0&generic=false&interface=com.alibaba.dubbo.demo.DemoService&loadbalance=roundrobin&methods=sayHello&monitor=dubbo%3A%2F%2F127.0.0.1%3A2181%2Fcom.alibaba.dubbo.registry.RegistryService%3Fapplication%3Ddemo-consumer%26dubbo%3D2.0.0%26pid%3D14604%26protocol%3Dregistry%26refer%3Ddubbo%253D2.0.0%2526interface%253Dcom.alibaba.dubbo.monitor.MonitorService%2526pid%253D14604%2526timestamp%253D1504958335528%26registry%3Dzookeeper%26timestamp%3D1504958335433&owner=william&pid=14604&side=consumer&timestamp=1504958335273, dubbo version: 2.0.0, current host: 169.254.69.197
-------------------------------------------dubbo Register monitor routers-------------------------------------
[09/09/17 07:59:06:006 CST] main  INFO zookeeper.ZookeeperRegistry:  [DUBBO] Register: consumer://169.254.69.197/com.alibaba.dubbo.monitor.MonitorService?category=consumers&check=false&dubbo=2.0.0&interface=com.alibaba.dubbo.monitor.MonitorService&pid=14604&timestamp=1504958335528, dubbo version: 2.0.0, current host: 169.254.69.197
[09/09/17 07:59:06:006 CST] main  INFO zookeeper.ZookeeperRegistry:  [DUBBO] Subscribe: consumer://169.254.69.197/com.alibaba.dubbo.monitor.MonitorService?category=providers,configurators,routers&dubbo=2.0.0&interface=com.alibaba.dubbo.monitor.MonitorService&pid=14604&timestamp=1504958335528, dubbo version: 2.0.0, current host: 169.254.69.197
[09/09/17 07:59:06:006 CST] main  INFO zookeeper.ZookeeperRegistry:  [DUBBO] Notify urls for subscribe url consumer://169.254.69.197/com.alibaba.dubbo.monitor.MonitorService?category=providers,configurators,routers&dubbo=2.0.0&interface=com.alibaba.dubbo.monitor.MonitorService&pid=14604&timestamp=1504958335528, urls: [empty://169.254.69.197/com.alibaba.dubbo.monitor.MonitorService?category=providers&dubbo=2.0.0&interface=com.alibaba.dubbo.monitor.MonitorService&pid=14604&timestamp=1504958335528, empty://169.254.69.197/com.alibaba.dubbo.monitor.MonitorService?category=configurators&dubbo=2.0.0&interface=com.alibaba.dubbo.monitor.MonitorService&pid=14604&timestamp=1504958335528, empty://169.254.69.197/com.alibaba.dubbo.monitor.MonitorService?category=routers&dubbo=2.0.0&interface=com.alibaba.dubbo.monitor.MonitorService&pid=14604&timestamp=1504958335528], dubbo version: 2.0.0, current host: 169.254.69.197
[19:59:06] Hello world0, response form provider: 169.254.69.197:20880
[09/09/17 07:59:08:008 CST] main  INFO container.Main:  [DUBBO] Dubbo SpringContainer started!, dubbo version: 2.0.0, current host: 169.254.69.197
[2017-09-09 19:59:08] Dubbo service server started!
[09/09/17 08:31:18:018 CST] DubboServerHandler-169.254.69.197:20880-thread-199  INFO dubbo.DubboProtocol:  [DUBBO] disconected from /169.254.69.197:56751,url:dubbo://169.254.69.197:20880/com.alibaba.dubbo.demo.DemoService?anyhost=true&application=demo-provider&channel.readonly.sent=true&codec=dubbo&dubbo=2.0.0&generic=false&heartbeat=60000&interface=com.alibaba.dubbo.demo.DemoService&loadbalance=roundrobin&methods=sayHello&monitor=dubbo%3A%2F%2F127.0.0.1%3A2181%2Fcom.alibaba.dubbo.registry.RegistryService%3Fapplication%3Ddemo-provider%26dubbo%3D2.0.0%26owner%3Dwilliam%26pid%3D16392%26protocol%3Dregistry%26refer%3Ddubbo%253D2.0.0%2526interface%253Dcom.alibaba.dubbo.monitor.MonitorService%2526pid%253D16392%2526timestamp%253D1504958572777%26registry%3Dzookeeper%26timestamp%3D1504958572167&owner=william&pid=16392&side=provider&timestamp=1504958572254, dubbo version: 2.0.0, current host: 169.254.69.197
-------------------------定时发送数据到monitor------------------------
[09/09/17 08:32:00:000 CST] DubboMonitorSendTimer-thread-3  INFO dubbo.DubboMonitor:  [DUBBO] Send statistics to monitor zookeeper://127.0.0.1:2181/com.alibaba.dubbo.monitor.MonitorService?dubbo=2.0.0&interface=com.alibaba.dubbo.monitor.MonitorService&pid=16392&timestamp=1504958572777, dubbo version: 2.0.0, current host: 169.254.69.197
[09/09/17 08:32:00:000 CST] DubboMonitorSendTimer-thread-3 ERROR dubbo.DubboMonitor:  [DUBBO] Unexpected error occur at send statistic, cause: Forbid consumer 169.254.69.197 access service com.alibaba.dubbo.monitor.MonitorService from registry 127.0.0.1:2181 use dubbo version 2.0.0, Please check registry access list (whitelist/blacklist)., dubbo version: 2.0.0, current host: 169.254.69.197
```

在上面的启动日志中，把dubbo主用的功能都标注了出来。然后我们通过zookeeper Inspector再来看一下zookeeper 的变化。

首先针对于我们的服务节点`com.alibaba.dubbo.demo.DemoService`多了一个consumers节点的配置信息。

```java
consumer%3A%2F%2F169.254.69.197%2Fcom.alibaba.dubbo.demo.DemoService%3Fapplication%3Ddemo-consumer%26category%3Dconsumers%26check%3Dfalse%26dubbo%3D2.0.0%26interface%3Dcom.alibaba.dubbo.demo.DemoService%26methods%3DsayHello%26pid%3D16704%26side%3Dconsumer%26timestamp%3D1504958628702
```

这个信息就是我们的对于consumer的配置信息。然后还多了一个routers节点。 这个是我们可以配置demo的路由信息。上面还多了一个`com.alibaba.dubbo.monitor.MonitorService`节点用于监控dubbo。

#### 5、总结

通过上面我们对dubbo Provider/Consumer的启动日志以及通过Zookeeper Inspector对zookeeper服务的观察我们可以得到dubbo下面的架构图。
