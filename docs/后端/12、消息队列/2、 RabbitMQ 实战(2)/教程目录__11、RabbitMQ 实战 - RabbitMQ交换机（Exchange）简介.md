# 11、RabbitMQ 实战 - RabbitMQ交换机（Exchange）简介
- 来源：https://ddkk.com/zhuanlan/mq/rabbitmq/2/11.html
- 分类：消息队列
- 分组：教程目录
**1、** 交换机概念；

生产者生产的消息从不会直接发送到队列，生产者只能把消息发送到交换机（Exchange），交换机接收来着生产者的消息，另一方面把消息推入队列，交换机必须知道如何处理收到的消息，是应该把这些消息放进特定的队列里还是放到多个队列里还是把消息丢弃，这些操作都由交换机的类型来决定

例：

交换机能把一个消息分别发送到多个个队列里，从而实现多个消费者对一个消息进行多次消费

**2、** 交换机的类型；

直接（direct）、主题（topic）、标题（headers）、扇出（fanout）、无名

注意：channel.basicPublish方法的第一个参数就是交换机的名称，如果交换机的名称是空字符串，例如channel.basicPublish("",队列名称,null,message.getBytes());则表示默认交换机是无名交换机，消息能路由发送到队列是由routingkey(bindingkey)绑定key实现的

**3、** 临时队列；

临时队列是指创建队列后队列的名称是随机的，一旦断开消费者的连接，队列将被自动删除，这种便是临时队列

创建临时队列的方式：

```java
String queue = channel.queueDeclare().getQueue();
```

**4、** 绑定（bindings）；

下面我们来使用RabbitMQ的页面来进行绑定

(1)新建一个队列

效果图：

(2)新建一个交换机

效果图：

(3)绑定routingkey

效果图：

以上步骤就是用temp_exchange交换机绑定了temp_queue队列，temp_exchange交换机通过a这个routingkey来绑定了temp_queue队列，当我们发消息到temp_exchange交换机，然后temp_exchange交换机会通过路由规则来把消息发送到指定的队列里，往后我们只需要用不同的routingkey绑定不同的队列，然后我们就能根据指定的routingkey来往指定的队列发消息了
