# 11、ActiveMQ 实战 - ActiveMQ的NIO协议使用
- 来源：https://ddkk.com/zhuanlan/mq/activemq/2/11.html
- 分类：消息队列
- 分组：教程目录
### NIO协议配置

由ActiveMQ安装目录所在的`/conf/activemq.xml`的配置文件可知，ActiveMQ默认出厂配置并不是NIO网络模型，而是BIO网络模型，若想使用NIO网络模型，需要`transportConnectors`标签加入以下配置，端口可以自定义（如果不指定端口，默认使用BIO网络IO模型端口，比如OpenWire、STOMP、AMQP等）：

```java
<transportConnector name="nio" uri="nio://0.0.0.0:61618?trace=true" />
```

配置完后，使用命令`./activemq restart`重启ActiveMQ，打开控制台的Connections看到Connector NIO一栏则表示配置成功。

更多协议介绍参考：[10.ActiveMQ的传输协议](/zhuanlan/mq/activemq/2/10.html)

NIO配置文件修改后，连接ActiveMQ的url由原来的`tcp://your ip:61616`改成`nio://your ip:61618`即可。

连接ActiveMQ的java代码参考：[Java编码实现ActiveMQ通讯](/zhuanlan/mq/activemq/2/4.html)

### NIO使用增强

在我们没有配置NIO时，端口使用的是以TCP为协议基础的`BIO + TCP`模式，当配置了NIO并且URI格式以“nio”开头后，此时端口使用的是以TCP协议为基础的NIO网络模型，即`NIO + TCP`。

怎么能做到让这个端口既支持NIO网络模型，又让他支持多个协议呢（即不仅仅是TCP协议）？

**1、** 配置auto；

auto关键字：在NIO上启用自动检测功能（来自官方翻译）

在ActiveMQ安装目录所在的`/conf/activemq.xml`的配置文件的`transportConnectors`中加入以下一行配置（端口可自行指定）。

```java
<transportConnector name="auto+nio" uri="auto+nio://0.0.0.0:5678" />
```

配置完后，启动ActiveMQ，并在控制台访问，在Connections菜单出现Connector auto+nio一栏则表示配置成功。

**2、** 修改连接服务的URI；

连接ActiveMQ服务的URI格式：`[协议名称]://[your ip]:5678`

由上一步可知，使用`auto`关键字配置了`5678`端口，当我们在`5678`端口使用指定的协议名称时，ActiveMQ会自动使用该协议的NIO网络不行，不再是原来的BIO网络模型，由此达到NIO网络模型支持多协议的作用。

比如当我们在5678使用TCP协议时，则URI应该配置为：`tcp://your ip://5678`，则此时`5678`使用的是以TCP协议为基础的NIO网络模型。

`注：不同的网络协议使用不同的客户端代码，即jar不同，api也不同。`
