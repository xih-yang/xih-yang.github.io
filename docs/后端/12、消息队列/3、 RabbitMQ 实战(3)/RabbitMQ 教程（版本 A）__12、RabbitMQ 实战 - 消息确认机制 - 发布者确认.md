# 12、RabbitMQ 实战 - 消息确认机制 - 发布者确认
- 来源：https://ddkk.com/zhuanlan/mq/rabbitmq/3/12.html
- 分类：消息队列
- 分组：RabbitMQ 教程（版本 A）
消费者确认解决的问题是确认消息是否被消费者"成功消费".

它有个前提条件,那就是生产者发布的消息已经"成功"发送出去了.

因此还需要一个机制来告诉生产者,你发送的消息真的"成功"发送了.

在标准的AMQP 0-9-1,保证消息不会丢失的唯一方法是使用事务:在通道上开启事务,发布消息,提交事务.但是事务是非常重量级的,它使得RabbitMQ的吞吐量降低250倍.为了解决这个问题,RabbitMQ 引入了 发布者确认(Publisher Confirms) 机制,它是模仿AMQP协议中的消费者消息确认机制.

## 事务机制

生产者部分代码:

```java
 try
    {               
        channel.TxSelect();//开启事务机制               
        channel.BasicPublish("", QueueName, null, Encoding.Default.GetBytes("hello world"));              
        channel.TxCommit();//提交
        Console.WriteLine($"send {msg}");
    }
    catch (Exception e)
    {                
        channel.TxRollback();//回滚
        Console.WriteLine(e);
    }
```

## 发布者确认

一旦在信道上使用 confirm.select 方法，就认为该信道处于Publisher Confirms模式.事务信道不能进入Publisher Confirms模式,一旦信道处于Publisher Confirms模式,不能开启事务.即事务和Publisher Confirms模式只能二选一.

## 发布的消息什么时候会被broker确认?

对于不可路由的消息,broker 将在 exchange 验证消息不会路由到任何队列（发回一个空的队列列表）后发出确认;如果消息被设置为"必需消息"发布,即 BasicPublish() 方法的 "mandatory" 入参为true,那么 BasicReturn 事件将在 BasicAcks 事件之前触发.否定确认 BasicNacks 事件也是如此.

对于可路由消息,当所有队列都接受消息时才触发 BasicAcks 事件,对于路由到持久话队列的持久性消息,这意味着持久化到磁盘后才会触发 BasicAcks 事件;对于消息的镜像队列,这意味着所有镜像都已接受该消息后才会触发 BasicAcks 事件.

发布者确认分为同步和异步两种.

## 一、同步

生产者部分代码

```java
//开启confirm机制
channel.ConfirmSelect();
string msg = "hello world ";           
for (int i = 0; i < 10; i++)
{
    channel.BasicPublish("", QueueName, null, Encoding.Default.GetBytes(msg + i));
}
　　　　　　  //可以发送一批消息后,调用该方法;也可以每发一条调用一次.　　　　　　 
if (channel.WaitForConfirms())
{
    Console.WriteLine("send is success");
}
else
{
    Console.WriteLine("send is failed");
　　　　　　　　  //实际应用中,这里需要添加发送消息失败的处理逻辑.
　　　　　　　　  //如果是发送一批消息,那么只要有一条失败,则所有的消息发送都会失败.
}
```

## 二、异步

生产者部分代码

```java
 channel.ConfirmSelect(); 　
//肯定确认
channel.BasicAcks += (s, e) =>
{
    //多条
    if (e.Multiple)
    {
        Console.WriteLine("最后成功的一条是 : " + e.DeliveryTag);                       
    }
    //单条
    else
    {
        Console.WriteLine(e.DeliveryTag + " 成功发送 ");                        
    }
};
//否定确认
channel.BasicNacks += (s, e) =>
{
    //多条
    if (e.Multiple)
    {
        Console.WriteLine("最后失败的一条是 : " + e.DeliveryTag);
    }
    //单条
    else
    {
        Console.WriteLine(e.DeliveryTag + " 发送失败 ");
    }
};
```

## 发布者的否定确认(BasicNacks)

- 在特殊情况下,当 broker 无法成功处理消息而不是 BasicAck 时,broker 将发送 BasicNack.在这种情况下,BasicNack 的字段与 BasicAck 相对应的字段意义相同,并且 requeue 字段是没有意义的.是否重发消息由发送者自己决定;
- 将channel设置为发布者确认模式后,所有后续发布的消息都只会被 confirm 一次或者 nack 一次;
- 没有机制保证消息需要多久被 confirmed;
- 消息不会同时被confirmed和nack\d;
- BasicNacks 事件只在负责队列的Erlang进程中发生内部错误时才会触发;

## 持久化消息的延迟肯定确认

前面说到,

如果是持久化的消息,要等到消息持久化到磁盘后才会触发 BasicAcks 事件;对于消息的镜像队列,要等到所有镜像都已接受该消息后才会触发 BasicAcks 事件.

而为了保证持久化效率, RabbitMQ不是来一条存一条,而是定时批量地持久化消息到磁盘.RabbitMQ 消息存储一段时间（几百毫秒）之后或者当队列空闲时,才会批量写到磁盘.

这意味着在恒定负载下,BasicAck 的延迟可以达到几百毫秒.如果队列支持镜像队列,则延迟时间更大.

所以,为了提高吞吐量,强烈建议应用程序采用异步确认方式,或者发布批量消息后等待确认.

## 发布者确认的注意事项

在大多数情况下,RabbitMQ将以与发布时相同的顺序向发布者确认消息（这适用于在单个频道上发布的消息）.但是,发布者确认是异步发出的,可以确认单个消息或一组消息.发出确认的确切时刻取决于消息的传递模式（持久性与瞬态）以及消息路由到的队列的属性.也就是说,RabbitMQ可能不以消息发布的顺序向发布者发送确认消息.生产者端尽量不要依赖消息确认的顺序处理业务逻辑.
