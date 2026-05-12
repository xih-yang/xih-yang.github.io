# 01、RabbitMQ 实战 - RabbitMQ简介
- 来源：https://ddkk.com/zhuanlan/mq/rabbitmq/2/1.html
- 分类：消息队列
- 分组：教程目录
**1、** RabbitMQ概念；

RabbitMQ是一个消息中间件，不对消息进行处理，只对消息做接收、存储和转发。

**2、** RabbitMQ四大核心概念；

(1)生产者

产生数据发送信息的程序

(2)交换机

交换机是RabbitMQ中一个非常重要的部件，接收来着生产者的消息并把消息推送到队列中

(3)队列

队列是RabbitMQ中使用的一种数据结构，生产者将消息发送到队列里，许多消费者尝试从一个队列里接收数据

(4)消费者

接收信息的程序

**3、** RabbitMQ模式；

(1)简单模式(Hello World)

(2)工作模式(Work queues)

(3)发布订阅模式(Publish/Subscribe)

(4)路由模式(Routing)

(5)主题模式(Ropics)

(6)发布确认模式(Publisher Confirms)

**4、** RabbitMQ名词介绍；

Broker:接收和分发消息的应用，RabbitMQ Server就是Message Broker。

Virtual host:出于多租户和安全因素设计的，把 AMQP的基本组件划分到一个虚拟的分组中，类似于网络中的namespace概念。当多个不同的用户使用同一个RabbitMQ server提供的服务时，可以划分出多个vhost，每个用户在自己的vhost创建exchange / queue等

Connection: publisher / consumer和broker之间的TCP连接

Channel:如果每一次访问RabbitMQ都建立一个Connection，在消息量大的时候建立TCPConnection的开销将是巨大的，效率也较低。Channel是在connection 内部建立的逻辑连接，如果应用程序支持多线程，通常每个thread创建单独的channel进行通讯，AMQP method包含了channel id帮助客户端和message broker识别channel，所以channel之间是完全隔离的。Channel作为轻量级Connection极大减少了操作系统建立TCP connection的开销

Exchange: message 到达 broker 的第一站，根据分发规则，匹配查询表中的 routing key，分发消息到queue 中去。常用的类型有: direct (point-to-point), topic(publish-subscribe) and fanout

(multicast)
