# 10、ActiveMQ 实战 - ActiveMQ的传输协议
- 来源：https://ddkk.com/zhuanlan/mq/activemq/2/10.html
- 分类：消息队列
- 分组：教程目录
### 协议种类

- TCP（Transmission Control Protocol）
- TCP是Broker默认配置的协议，默认监听端口是61616。
- 在网络传输数据前，必须要先序列化数据，消息是通过一个叫wire protocol的来序列化成字节流。默认情况下，ActiveMQ把wire protocol叫做OpenWire，它的目的是促使网络上的效率和数据快速交互。
- TCP连接的URI形式如：tcp://HostName:port?key=value&key=value，后面的参数是可选的。
- TCP传输的的优点：

TCP协议传输可靠性高，稳定性强
- 高效率：字节流方式传递，效率很高
- 有效性、可用性：应用广泛，支持任何平台

NIO（New I/O API Protocol）

NIO协议和TCP协议类似，但NIO更侧重于底层的访问操作。它允许开发人员对同一资源可有更多的client调用和服务器端有更多的负载。

一般情况下，大量的Client去连接Broker是被操作系统的线程所限制的。因此，NIO的实现比TCP需要更少的线程去运行，所以建议使用NIO协议。

NIO连接的URI形式：nio://hostname:port?key=value&key=value

AMQP（Advanced Message Queuing Protocol）

一个提供统一消息服务的应用层标准高级消息队列协议，是应用层协议的一个开放标准，为面向消息的中间件设计。基于此协议的客户端与消息中间件可传递消息，并不受客户端/中间件不同产品，不同开发语言等条件限制。

STOMP（Streaming Text Orientation Message Protocol）

STOMP是流文本定向消息协议，是一种为MOM(Message Oriented Middleware，面向消息中间件)设计的简单文本协议。

SSL（Secure Sockets Layer Protocol）

SSL传输允许客户端使用TCP上的SSL连接到远程ActiveMQ代理。SSL传输允许客户端使用TCP套接字上的SSL连接到远程ActiveMQ代理。

连接的URL形式： ssl://hostname:port?key=value

MQTT（Message Queuing Telemetry Transport）

MQTT，即消息队列遥测传输，是IBM开发的一个即时通讯协议，有可能成为物联网的重要组成部分。该协议支持所有平台，几乎可以把所有联网物品和外部连接起来，被用来当作传感器和致动器(比如通过Twitter让房屋联网)的通信协议。

VM

VM本身不是协议。VM传输允许客户机在VM内部彼此连接，而不需要网络通信的开销。所使用的连接不是套接字连接，而是使用直接方法调用来启用高性能嵌入式消息传递系统。

第一个使用VM连接的客户机将引导一个嵌入式代理。后续的连接将连接到同一代理。一旦所有到代理的VM连接都关闭了，嵌入式代理将自动关闭。

打开ActiveMQ安装目录所在的`/conf/activemq.xml`找到`transportConnectors`标签，内容如下：

```java
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

除了TCP协议外，其他协议的name属性值都和协议本身的名称一致，为何TCP协议的name属性值为`openwire`？因为ActiveMQ的默认消息协议引用就是openwire，所以其默认协议TCP和默认端口61616由此而来。

ActiveMQ出厂默认配置是BIO网络IO模型，若要NIO网络IO模型，需要在`transportConnectors`标签下加入以下配置，配置如下：

```java
<transportConnector name="nio" uri="nio://0.0.0.0:61618?trace=true" />
```

当然NIO默认端口可以自定义，如果你不特别指定ActiveMQ的网络监听端口，那么这些端口都讲使用BIO网络IO模型（OpenWIre、STOMP、AMQP）。所以为了首先提高单节点的网络吞吐性能，我们需要明确指定ActiveMQ网络IO模型。

下一章重点讲解NIO协议的使用。

更多更详细传输协议参考官网地址：[http://activemq.apache.org/configuring-version-5-transports.html](http://activemq.apache.org/configuring-version-5-transports.html)
