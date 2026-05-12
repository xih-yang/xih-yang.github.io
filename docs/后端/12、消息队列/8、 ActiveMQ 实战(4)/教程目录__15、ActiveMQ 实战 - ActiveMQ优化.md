# 15、ActiveMQ 实战 - ActiveMQ优化
- 来源：https://ddkk.com/zhuanlan/mq/activemq/4/15.html
- 分类：消息队列
- 分组：教程目录
**1、** 非持久化消息比持久化消息快；

非持久化消息是异步的，Procedure不需要等待Consumer的receipt（应答）消息

持久化消息要把消息先存储起来，再传递

**2、** 使用异步投递消息；

cf.setUserAsyncSend(true);

**3、** 事务消息比非事务消息更快；

**4、** 可以考虑应用内嵌brocker，这样通讯协议可以使用VM通讯协议；

**5、** 尽量使用文件的方式存储消息，如kahadb；

**6、** 合理设置prefetchSize；

**7、** 考虑生产者流量控制，可以通过xml配置，代码方式如下；

cf.setProcedureWindowSize(1024);

**8、** 关闭消息复制功能；

cf.setCopyMessageOnSend(false);

**9、** 调整TCP协议；

1）socketBufferSize，默认65535

2）tcpNoDelay，默认false

**10、** 消息投递方式；

建议采用自动确认并且批量确认

cf.setOptimizeAcknowledge(true);

**11、** 设置直接通过session传递给消费者；

消费者这边session会在一个单独的线程里面分发消息给消费者，如果是自动确认模式，为了增加吞吐量，可以直接通过session传递给消费者：cf.setAlwaysSessionAsync(false);
