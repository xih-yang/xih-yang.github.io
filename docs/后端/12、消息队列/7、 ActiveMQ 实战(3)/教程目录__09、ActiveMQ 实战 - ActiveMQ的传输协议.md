# 09、ActiveMQ 实战 - ActiveMQ的传输协议
- 来源：https://ddkk.com/zhuanlan/mq/activemq/3/9.html
- 分类：消息队列
- 分组：教程目录
### 前言

如果你只是为了解在项目中如何使用activemq，以便工作中快速上手，那么前面七篇文章足矣

### 体会面试题

上图是Java入门程序写过的代码

### 查看官网

[官网地址](http://activemq.apache.org/configuring-version-5-transports.html)

### 怎么知道activemq默认是tcp协议，如何查看

打开ActiveMQ安装目录所在的/conf/activemq.xml找到transportConnectors标签，内容如下：

```xml
<transportConnectors>
	<!-- DOS protection, limit concurrent connections to 1000 and frame size to 100MB -->
    <transportConnector name="openwire" uri="tcp://0.0.0.0:61616?maximumConnections=1000&wireFormat.maxFrameSize=104857600"/>
    <transportConnector name="amqp" uri="amqp://0.0.0.0:5672?maximumConnections=1000&wireFormat.maxFrameSize=104857600"/>
    <transportConnector name="stomp" uri="stomp://0.0.0.0:61613?maximumConnections=1000&wireFormat.maxFrameSize=104857600"/>
    <transportConnector name="mqtt" uri="mqtt://0.0.0.0:1883?maximumConnections=1000&wireFormat.maxFrameSize=104857600"/>
    <transportConnector name="ws" uri="ws://0.0.0.0:61614?maximumConnections=1000&wireFormat.maxFrameSize=104857600"/>
</transportConnectors>
```

由配置可知MQ的各种协议URL配置格式以及默认端口。

## 脚下留心

在上文给出的配置信息中，
URI描述信息的头部都是采用协议名称：例如
描述amqp协议的监听端口时，采用的URI描述格式为“amqp://······”；
描述Stomp协议的监听端口时，采用URI描述格式为“stomp://······”；
唯独在进行openwire协议描述时，URI头却采用的“tcp://······”。
除了TCP协议外，其他协议的name属性值都和协议本身的名称一致，为何TCP协议的name属性值为openwire？\color{red}除了TCP协议外，其他协议的name属性值都和协议本身的名称一致，为何TCP协议的name属性值为openwire？除了TCP协议外，其他协议的name属性值都和协议本身的名称一致，为何TCP协议的name属性值为openwire？

因为ActiveMQ的默认消息协议引用就是openwire，所以其默认协议TCP和默认端口61616由此而来。\color{red}因为ActiveMQ的默认消息协议引用就是openwire，所以其默认协议TCP和默认端口61616由此而来。因为ActiveMQ的默认消息协议引用就是openwire，所以其默认协议TCP和默认端口61616由此而来。
那么接下来让我们好好学习一下activemq协议\color{red}那么接下来让我们好好学习一下activemq协议那么接下来让我们好好学习一下activemq协议

### 协议种类

### TCP（Transmission Control Protocol）

**1、** TCP是Broker默认配置的协议，默认监听端口是61616在网络传输数据前，必须要先序列化数据，消息是通过一个叫wireprotocol的来序列化成字节流默认情况下，ActiveMQ把wireprotocol叫做OpenWire，它的目的是促使网络上的效率和数据快速交互；

**2、** TCP连接的URI形式如：tcp://HostName:port?key=value&key=value，后面的参数是可选的；

**3、** TCP传输的的优点：；

> TCP协议传输可靠性高，稳定性强 高效率：
>
> 字节流方式传递，效率很高
>
> 有效性、可用性：应用广泛，支持任何平台

### NIO（New I/O API Protocol(NIO)）

**1、** NIO协议和TCP协议类似，但NIO更侧重于底层的访问操作它允许开发人员对同一资源可有更多的client调用和服务器端有更多的负载；

**2、** 适合使用NIO协议的场景：；

**2、** 1可能有大量的Client去连接到Broker上，一般情况下，大量的Client去连接Broker是被操作系统的线程所限制的因此，NIO的实现比TCP需要更少的线程去运行，所以建议使用NIO协议；

**2、** 2可能对于Broker有一个很迟钝的网络传输，NIO比TCP提供更好的性能；

**3、** NIO连接的URI形式：nio://hostname:port?key=value&key=value；

**4、** 关于Transport协议的可选配置参数可以参考官网http://activemq.apache.org/configuring-version-5-transports.html；

### AMQP（Advanced Message Queuing Protocol）

Advanced Message Queuing Protocol，一个提供统一消息服务的应用层标准高级消息队列协议，是应用层协议的一个开放标准，为面向消息的中间件设计。基于此协议的客户端与消息中间件可传递消息，并不受客户端/中间件不同产品，不同开发语言等条件限制。

### STOMP（Streaming Text Orientation Message Protocol）

STOP，Streaming Text Orientation Message Protocol，是流文本定向消息协议，是一种为MOM(Message Oriented Middleware，面向消息中间件)设计的简单文本协议。

### SSL（Secure Sockets Layer Protocol）

**1、** SSL传输允许客户端使用TCP上的SSL连接到远程ActiveMQ代理SSL传输允许客户端使用TCP套接字上的SSL连接到远程ActiveMQ代理；

**2、** 连接的URL形式：ssl://hostname:port?key=value；

### MQTT（Message Queuing Telemetry Transport）

MQTT，即消息队列遥测传输，是IBM开发的一个即时通讯协议，有可能成为物联网的重要组成部分。该协议支持所有平台，几乎可以把所有联网物品和外部连接起来，被用来当作传感器和致动器(比如通过Twitter让房屋联网)的通信协议。
可能会报错\color{red}可能会报错可能会报错
原因是：依赖包和底层改变了\color{red}原因是：依赖包和底层改变了原因是：依赖包和底层改变了

### VM

**1、** VM本身不是协议VM传输允许客户机在VM内部彼此连接，而不需要网络通信的开销所使用的连接不是套接字连接，而是使用直接方法调用来启用高性能嵌入式消息传递系统；

**2、** 第一个使用VM连接的客户机将引导一个嵌入式代理后续的连接将连接到同一代理一旦所有到代理的VM连接都关闭了，嵌入式代理将自动关闭；

## 小总结

除了TCP和NIO，其他在生产用得特别少，可忽略\color{red}除了TCP和NIO，其他在生产用得特别少，可忽略除了TCP和NIO，其他在生产用得特别少，可忽略

### Nio案例演示

打开ActiveMQ安装目录所在的/conf/activemq.xml找到transportConnectors标签，内容如下：

```xml
<transportConnectors>
      <transportConnector name="nio" uri="nio://0.0.0.0:61618?trace=true" />
</transportConnectors>
```

重启activemq

重新测试以前tcp的代码，测试成功

将activemq的连接地址改为

```java
public static final String ACTIVEMQ_URL = "nio://47.98.163.118:61618";
```

重新测试，也是能生产和消费

至此，我们的nio整合完毕\color{red}至此，我们的nio整合完毕至此，我们的nio整合完毕

### nio案例演示增强

## 目的

上面是Openwire协议传输底层使用NIO网络IO模型。 如何让其他协议传输底层也使用NIO网络IO模型呢？

大白话理解就是：在此之间TCP使用61616端口，而nio使用61618端口，每次切换NIO和TCP时需要更换端口，该如何解决\color{red}大白话理解就是：在此之间TCP使用61616端口，而nio使用61618端口，每次切换NIO和TCP时需要更换端口，该如何解决大白话理解就是：在此之间TCP使用61616端口，而nio使用61618端口，每次切换NIO和TCP时需要更换端口，该如何解决

解决方法

### 操作步骤

**1、** 修改配置文件activemq.xml；

```java
 <transportConnector name="auto+nio" uri="auto+nio://0.0.0.0:61608?maximumConnections=1000&wireFormat.maxFrameSize=104857600&org.apache.activemq.transport.nio.SelectorManager.corePoolSize=20&org.apache.activemq.transport.nio.Se1ectorManager.maximumPoo1Size=50"/>
```

**2、** 测试；

```java
public static final String ACTIVEMQ_URL = "nio://47.98.163.118:61608";
public static final String ACTIVEMQ_URL = "tcp://47.98.163.118:61608";
```

现在切换协议，不需要改端口了\color{red}现在切换协议，不需要改端口了现在切换协议，不需要改端口了
