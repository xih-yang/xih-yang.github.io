# 15、RabbitMQ 实战 - 消息应答与持久化
- 来源：https://ddkk.com/zhuanlan/mq/rabbitmq/4/15.html
- 分类：消息队列
- 分组：RabbitMQ 教程（版本 A）
## 一：消息应答

**1、** 介绍；

涉及到的程序：

boolean autoAck=false;

channel.basicConsume(QUENE_NAME,autoAck,consumer);

**2、** autoAck=true；

自动确认模式。

一旦rabbitMq将消息发送给消费者，就从内存中删除。

缺点：如果这个时候消费者挂掉，就会丢失正在处理的消息。

**3、** autoAck=false；

手动模式。

如果一个消费者挂掉，就会交给其他的消费者。

rabbitMq支持消息应答，消费者发送一个消息应答，告诉rabbitMq这个消息已经处理结束，然后这时rabbitMq就会删除内存中的消息。

**4、** 默认；

默认是打开的，为false。

## 二：持久化

**1、** 出现的缘由；

如果rabbitMq挂了，消息就会丢失。

rabbitMq支持持久化。

**2、** 涉及的程序；

//创建队列声明

*channel.queueDeclare(QUENE_NAME,false,false,false,null);*

其中，第二个参数是durable，是否持久化。

**3、** 注意点；

将第二个参数改成true，直接运行程序是会报错的。

原因如下：

因为刚才在运行程序的时候已经定义了一个队列，然后又定义了一个相同的队列，并且参数不同。这个是不被rabbitMq所允许的。

做法：

换一个队列的名字，或者去管理平台上删除已经存在的队列。
