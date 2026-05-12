# 05、ActiveMQ 实战 - ActiveMQ支持的传输协议
- 来源：https://ddkk.com/zhuanlan/mq/activemq/4/5.html
- 分类：消息队列
- 分组：教程目录
## 1 传输协议介绍

Connector：ActiveMQ提供的，用来实现连接通讯的功能。包括：client-to-broker、broker-to-broker。 ActiveMQ允许客户端使用多种协议来连接

配置Transport Connector的文件在activeMQ安装目录的conf/activemq.xml中的标签之内。

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

ActiveMQ支持的client-broker通讯协议有：TCP、NIO、UDP、SSL、Http(s)、VM。

## 2 常用的传输协议

### 2.1 TCP协议

Transmission Control Protocol (TCP)

1、这是默认的Broker配置，TCP的Client监听端口是61616。

2、在网络传输数据前，必须要序列化数据，消息是通过一个叫wire protocol的来序列化成字节流。默认情况下，ActiveMQ把wire protocol叫做OpenWire，它的目的是促使网络上的效率和数据快速交互。

3、TCP连接的URI形式：tcp://hostname:port?key=value&key=value

4、TCP传输的优点：

(1)TCP协议传输可靠性高，稳定性强

(2)高效性：字节流方式传递，效率很高

(3)有效性、可用性：应用广泛，支持任何平台

### 2.2 NIO协议

1、NIO协议和TCP协议类似，但NIO更侧重于底层的访问操作。它允许开发人员对同一资源可有更多的client调用和服务端有更多的负载。

2、适合使用NIO协议的场景：

(1)可能有大量的Client去链接到Broker上一般情况下，大量的Client去链接Broker是被操作系统的线程数所限制的。因此，NIO的实现比TCP需要更少的线程去运行，所以建议使用NIO协议

(2)可能对于Broker有一个很迟钝的网络传输NIO比TCP提供更好的性能

3、NIO连接的URI形式：nio://hostname:port?key=value

4、Transport Connector配置示例

```java
<transportConnector name="nio" uri="nio://0.0.0.0:61618?trace=true" />
```

### 2.3 UDP协议

1）UDP和TCP的区别

(1)TCP是一个原始流的传递协议，意味着数据包是有保证的，换句话说，数据包是不会被复制和丢失的。UDP，另一方面，它是不会保证数据包的传递的

(2)TCP也是一个稳定可靠的数据包传递协议，意味着数据在传递的过程中不会被丢失。这样确保了在发送和接收之间能够可靠的传递。相反，UDP仅仅是一个链接协议，所以它没有可靠性之说

2）从上面可以得出：TCP是被用在稳定可靠的场景中使用的；UDP通常用在快速数据传递和不怕数据丢失的场景中，还有ActiveMQ通过防火墙时，只能用UDP

3）UDP连接的URI形式：udp://hostname:port?key=value

4）Transport Connector配置示例：

```java
<transportConnector name="udp" uri="udp://localhost:61618?trace=true" />
```

### 2.4 Secure Sockets Layer Protocol (SSL)

1）连接的URI形式：ssl://hostname:port?key=value

2）Transport Connector配置示例：

```java
<transportConnector name="ssl" uri="ssl://localhost:61617?trace=true"/>
```

### 2.5 Hypertext Transfer Protocol (HTTP/HTTPS)

1）像web和email等服务需要通过防火墙来访问的，Http可以使用这种场合

2）连接的URI形式：http://hostname:port?key=value或者https://hostname:port?key=value

3）Transport Connector配置示例：

```java
<transportConnector name="http" uri="http://localhost:8080?trace=true" />
```

### 2.6 VM Protocol（VM）

1、VM transport允许在VM内部通信，从而避免了网络传输的开销。这时候采用的连 接不是socket连接，而是直接的方法调用。

2、第一个创建VM连接的客户会启动一个embed VM broker，接下来所有使用相同的 broker name的VM连接都会使用这个broker。当这个broker上所有的连接都关闭 的时候，这个broker也会自动关闭。

3、连接的URI形式：vm://brokerName?key=value

4、Java中嵌入的方式： vm:broker:(tcp://localhost:6000)?brokerName=embeddedbroker&persistent=fal se ， 定义了一个嵌入的broker名称为embededbroker以及配置了一个 tcptransprotconnector在监听端口6000上

5、使用一个加载一个配置文件来启动broker vm://localhost?brokerConfig=xbean:activemq.xml

所有关于Transport协议的可配置参数，可以参见：http://activemq.apache.org/configuring-version-5-transports.html
