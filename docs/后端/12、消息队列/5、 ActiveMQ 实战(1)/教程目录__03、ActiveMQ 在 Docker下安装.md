# 03、ActiveMQ 在 Docker下安装
- 来源：https://ddkk.com/zhuanlan/mq/activemq/1/3.html
- 分类：消息队列
- 分组：教程目录
## ActiveMQ简介

官网地址：https://activemq.apache.org/

简介：

ActiveMQ 是Apache出品，最流行的，能力强劲的开源消息总线。ActiveMQ 是一个完全支持JMS1.1和J2EE 1.4规范的 JMS Provider实现,尽管JMS规范出台已经是很久的事情了,但是JMS在当今的J2EE应用中间仍然扮演着特殊的地位。

特点：

- 支持来自Java，C，C ++，C＃，Ruby，Perl，Python，PHP的各种跨语言客户端和协议
- 完全支持JMS客户端和Message Broker中的企业集成模式
- 支持许多高级功能，如消息组，虚拟目标，通配符和复合目标
- 完全支持JMS 1.1和J2EE 1.4，支持瞬态，持久，事务和XA消息
- Spring支持，以便ActiveMQ可以轻松嵌入到Spring应用程序中，并使用Spring的XML配置机制进行配置
- 专为高性能集群，客户端 - 服务器，基于对等的通信而设计
- CXF和Axis支持，以便ActiveMQ可以轻松地放入这些Web服务堆栈中以提供可靠的消息传递
- 可以用作内存JMS提供程序，非常适合单元测试JMS
- 支持可插拔传输协议，例如in-VM，TCP，SSL，NIO，UDP，多播，JGroups和JXTA传输
- 使用JDBC和高性能日志支持非常快速的持久性

## Docker安装ActiveMQ

### 下载镜像

```sh
docker pull webcenter/activemq
docker run --name my-activemq -d \
-p 8161:8161 \
-p 61616:61616 \
-p 61613:61613 \
webcenter/activemq
webcenter/activemq镜像启动没成功
```

### 使用下面这个镜像成功

```sh
docker pull rmohr/activemq
docker run --name my-activemq -d \
-p 61616:61616 \
-p 8161:8161 rmohr/activemq
```

### ActiveMQ 访问

访问http://192.168.1.5:8161/admin（用户名和密码默认为admin），则启动成功。

> 版权声明：「DDKK.COM 弟弟快看，程序员编程资料站」本站文章，版权归原作者所有
