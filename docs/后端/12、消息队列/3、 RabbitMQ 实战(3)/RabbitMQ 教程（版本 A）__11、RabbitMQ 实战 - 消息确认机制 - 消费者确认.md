# 11、RabbitMQ 实战 - 消息确认机制 - 消费者确认
- 来源：https://ddkk.com/zhuanlan/mq/rabbitmq/3/11.html
- 分类：消息队列
- 分组：RabbitMQ 教程（版本 A）
由于生产者和消费者不直接通信,生产者只负责把消息发送到队列,消费者只负责从队列获取消息(不管是push还是pull).

消息被"消费"后,是需要从队列中删除的.那怎么确认消息被"成功消费"了呢?

是消费者从队列获取到消息后,broker 就从队列中删除该消息?

那如果消费者收到消息后,还没来得及"消费"它,或者说还没来得及进行业务逻辑处理时,消费者所在的信道或者连接因某种原因断开了,

那这条消息岂不是就被无情的抛弃了...

我们更期望的是,消费者从队列获取到消息后,broker 暂时不删除该条消息,

等到消费者"成功消费"掉该消息后,再删除它.

所以需要一个机制来确认生产者发送的消息被消费者"成功消费".

RabbitMQ 提供了一种叫做"消费者确认"的机制.

## 消费者确认

消费者确认分两种:**自动确认**和**手动确认**.

在自动确认模式中,消息在发送到消费者后即被认为"成功消费".这种模式可以降低吞吐量（只要消费者可以跟上）,以降低交付和消费者处理的安全性.这种模式通常被称为“即发即忘”.与手动确认模型不同,如果消费者的TCP连接或通道在真正的"成功消费"之前关闭,则服务器发送的消息将丢失.因此,自动消息确认**应被视为不安全,**并不适用于所有工作负载.

使用自动确认模式时需要考虑的另一件事是消费者过载.手动确认模式通常与有界信道预取(BasicQos方法)一起使用,该预取限制了信道上未完成（“进行中”）的消息的数量.但是,自动确认没有这种限制.因此,消费者可能会被消息的发送速度所淹没,可能会导致消息积压并耗尽堆或使操作系统终止其进程.某些客户端库将应用TCP反压(停止从套接字读取,直到未处理的交付积压超过某个限制).因此,仅建议能够以稳定的速度有效处理消息的消费者使用自动确认模式.

## 1.自动确认 autoAck : true

下面是消费者的部分代码,我们故意每次只推送一条消息,并且让每条消息的处理都超过10秒.

```java
channel.BasicQos(0, 1, false);//将Qos预取值设置为1,这表示设置broker每次只推送队列里面的一条消息到消费者,只有在确认这条消息"成功消费"后,才会继续推送
consumer.Received += (s, e) =>
{
    string str = Encoding.Default.GetString(e.Body);
    Thread.Sleep(10000);
    Console.WriteLine("consumer1 receive : " + str);
};
channel.BasicConsume(queue: QueueName, autoAck: true, consumer: consumer);
```

下面是生产者的部分代码

```java
for (byte i = 0; i < 5; i++)
{
    string msg = "hello world " + i;
    channel.BasicPublish("", QueueName, null, Encoding.Default.GetBytes(msg));
    Console.WriteLine($"send {msg}");
}
```

运行结果:

从管理后台可以看到,消费者还没打印"receive"那句话,该队列中就已经没有任何消息了.

## 2.手动确认 autoAck : false

手动确认又分两种:**肯定确认**和**否定确认.**

#### 1)肯定确认 BasicAck

消费者部分代码:

```java
channel.BasicQos(0, 1, false);//设置broker每次只推送队列里面的一条消息到消费者,只有在确认这条消息"成功消费"后,才会继续推送
consumer.Received += (s, e) =>
{
    string str = Encoding.Default.GetString(e.Body);
    Console.WriteLine("consumer1 receive : " + str);
    Thread.Sleep(30000);
    //deliveryTag 传递标签,ulong 类型.它的范围隶属于每个信道.因此必须在收到消息的相同信道上确认.不同的信道将导致“未知的传递标签”协议异常并关闭通道.
    //multiple 确认一条消息还是多条.false 表示只确认 e.DelivertTag 这条消息,true表示确认 小于等于 e.DelivertTag 的所有消息 
    channel.BasicAck(deliveryTag: e.DeliveryTag, multiple: false);
    Console.WriteLine("consumer1 Ack : " + str);
};
channel.BasicConsume(queue: QueueName, autoAck: false, consumer: consumer);
```

生产者代码不变.

当消费者收到一条消息,但是还没有肯定确认时,从管理后台可以清晰的看到,队列中一共有5条消息,其中4条尚未推送,1条已经推送但尚未确认.

当消费者确认后(立马又接收了一条),这时候,队列中一共只有4条了,"成功消费"的那条已经被broker从队列中删掉了.剩余3条尚未推送,1条已推送但尚未确认.

#### 2)否定确认 BasicNack , BasicReject

否定确认的场景不多,但有时候某个消费者因为某种原因无法立即处理某条消息时,就需要否定确认了.

否定确认时,需要指定是丢弃掉这条消息,还是让这条消息重新排队,过一会再来,又或者是让这条消息重新排队,并尽快让另一个消费者接收并处理它.

**i.丢弃 requeue: false**

消费者部分代码:

```java
channel.BasicQos(0, 1, false);
consumer.Received += (s, e) =>
{
    string str = Encoding.Default.GetString(e.Body);
    Thread.Sleep(10000);
    channel.BasicNack(deliveryTag: e.DeliveryTag, multiple: false, requeue: false);
    Console.WriteLine("consumer1 Nack : " + str);
};
channel.BasicConsume(queue: QueueName, autoAck: false, consumer: consumer);
```

**ii.重新排队 requeue: true**

**消费者部分代码:**

```java
channel.BasicQos(0, 1, false);//设置broker每次只从推送队列里面的一条消息到消费者,只有在确认这条消息"成功消费"后,才会继续推送
consumer.Received += (s, e) =>
{
    string str = Encoding.Default.GetString(e.Body);
    Thread.Sleep(5000);
    channel.BasicNack(deliveryTag: e.DeliveryTag, multiple: false, requeue: true);
    Console.WriteLine("consumer1 Nack : " + str);
};
channel.BasicConsume(queue: QueueName, autoAck: false, consumer: consumer);
```

运行结果:

可以看到,消费者收到的一直是"hello world 0"这条消息,而管理后台一直显示 4,1,5.这是为什么呢?

首先,我们设置的是每次只推送一条消息给消费者,否定确认中我们选择的是重新排队,所以"hello world 0"这条消息被否定确认后,被broker安排去重新排队了.当消息被重新排队时,如果可能的话,它将被放置在其队列中的原始位置.也就是说"hello world 0"这条消息又被放到了队列头,因为它的原始位置就是队列头.所以结果就变成了消费之一直在消费"hello world 0",并且一直在否定确认.

感觉这种方式的代价是不是有点大...消息重新排队,还要回到之前的位置,还要重新发送一次....感觉代价有点小贵啊...而且其他消息貌似永远只有ready...

但,如果多个消费者共享队列时,该消息将被重新排队到更靠近队列头的位置,并且会被聪明的broker从队列中推送到其他队列.

测试:

我们重新创建两个消费者:consumer1 否定确认,3秒一次;consumer2 肯定确认,1秒一次.两个消费共享一个队列(公平分发)

```java
channel.BasicQos(0, 1, false);
consumer.Received += (s, e) =>
{
    string str = Encoding.Default.GetString(e.Body);
    Thread.Sleep(3000);
    channel.BasicNack(e.DeliveryTag, false, true);
    Console.WriteLine($"{DateTime.Now} consumer1 Nack : " + str);
};
channel.BasicConsume(queue: QueueName, autoAck: false, consumer: consumer);
```

```java
channel.BasicQos(0, 1, false);
consumer.Received += (s, e) =>
{
    string str = Encoding.Default.GetString(e.Body);
    Thread.Sleep(1000);
    channel.BasicAck(deliveryTag: e.DeliveryTag, multiple: false);
    Console.WriteLine($"{DateTime.Now} consumer2 Ack : " + str);
};
channel.BasicConsume(queue: QueueName, autoAck: false, consumer: consumer);
```

运行结果:

一切尽在图中.

BasicReject 方法和 BasicNack 方法基本一样,唯一的区别是没有 multiple 这个入参.

### 消费者确认模式,预取和吞吐量

确认模式和QoS预取值对消费者吞吐量具有显着影响。通常，增加预取将提高向消费者传递消息的速率。自动确认模式可以产生最佳的交付率。但是，在这两种情况下，已传送但尚未处理的消息的数量也将增加，从而增加了消费者的RAM消耗。

应谨慎使用具有无限预取功能的自动确认模式或手动确认模式。在没有确认的情况下消耗大量消息的消费者将导致他们所连接的节点上的内存消耗增长。找到合适的预取值需要不断试验，并且会因工作负载而异。100到300范围内的值通常可提供最佳吞吐量，并且不会面临压倒性消费者的重大风险。较高的价值往往会影响收益递减规律。

预取值1是最保守的。它将显着降低吞吐量，特别是在消费者连接延迟较高的环境中。对于许多应用来说，更高的值是合适的和最佳的。

### 当消费者失败或失去连接时：自动重新排队

使用手动确认时，除了我们主动让消息重新排队外,任何未确认的消息都将在关闭发生传递的信道（或连接）时自动重新排队。这包括客户端的TCP连接丢失，消费者应用程序（进程）故障和通道级协议异常.请注意，检测不可用的客户端需要一段时间。

由于这种行为，消费者必须准备好处理重新发送，否则就要考虑到幂等性。BasicDeliverEventArgs 有一个特殊的布尔属性 : Redelivered，如果该消息是第一次交付，它将被设置为false.否则为 true.

测试:

还是借用上一个测试的代码,只是分别加了一句话:

```java
Console.WriteLine($"{str} 是否是重复发送 : " + e.Redelivered);
```

运行结果:

这里要特别注意,consumer2 收到 "hello world 0"的时候, Redelivered 的值依然是 true . 因为 Redelivered 属性的维度是消息,不是消费者.
