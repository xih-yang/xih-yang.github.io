# 05、RabbitMQ 实战 - 订阅者模式之分发模式 ( fanout )
- 来源：https://ddkk.com/zhuanlan/mq/rabbitmq/3/5.html
- 分类：消息队列
- 分组：RabbitMQ 教程（版本 A）
前面讲到了简单队列和工作队列.

这两种队列有个非常明显的缺点 : 生产者发送的消息,只能进入到一个队列.

消息只能进入到一个队列就意味着消息只能被一个消费者消费.

尽管工作队列模式中,一个队列中的消息可以被多个消费者消费,但是,具体到每一条消息,却只能被一个消费者消费.

如果想要一个消息被多个消费者消费,那么生产者就必须把这条消息发送到多个队列中去.

RabbitMQ 在这个点的设计是 :

在生产者和队列两者之间加入了一个叫做"交换机"的东西.

生产者发送消息时,不直接发送到队列,而是发送到"交换机"(其实简单队列和工作队列也是这样的...前面的文章有提到,它们用的是默认的交换机).

"交换机"再根据声明的类型(fanout,direct,topic,headers),转发给符合要求的队列.

这里有个非常重要的知识点:

**交换机只是一个"中转的机器",它不是一个消息队列,它没有存储消息的能力.这点很重要!**

**这意味着,当生产者把消息发送给某个交换机时,如果这时候,这个交换机没有被任何队列绑定,那么这些消息将会丢失!**

这种利用交换机,将消息"发送"到多个队列的模式叫做 : 订阅者模式.

这篇文章主要介绍订阅者模式中的分发模式,

**这种模式下,消息会被所有消费者消费.也就是说,只要是"绑定"到某个交换机的队列,都会收到生产者发送到该交换机的消息.**

## 生产者

```java
public class Producer
{
    /// <summary>
    /// 交换机名称
    /// </summary>
    private const string ExchangeName = "test_exchange_fanout";
    public static void Send()
    {
        IConnection connection = ConnectionHelper.GetConnection();
        IModel channel = connection.CreateModel();
        //声明交换机,第2个参数为交换机类型
        channel.ExchangeDeclare(ExchangeName, "fanout", false, false, null);
        for (int i = 0; i < 50; i++)
        {
            string msg = "hello world " + i;
            //第2个参数为路由键,这种模式显然不需要路由键了,因为我们是把消息发送到所有绑定到该交换机的队列.
            channel.BasicPublish(ExchangeName, "", null, Encoding.Default.GetBytes(msg));
            Console.WriteLine($"send {msg}");
        }
        channel.Close();
        connection.Close();
    }
}
```

## 消费者1

```java
public class Consumer1
{
    private const string QueueName = "test_exchange1_queue";
    private const string ExchangeName = "test_exchange_fanout";
    public static void Receive()
    {
        IConnection connection = ConnectionHelper.GetConnection();
        IModel channel = connection.CreateModel();
        channel.QueueDeclare(QueueName, false, false, false, null);
        //将队列绑定到交换机上
        channel.QueueBind(QueueName, ExchangeName, "", null);
        //添加消费者
        EventingBasicConsumer consumer = new EventingBasicConsumer(channel);
        //注册事件
        consumer.Received += (s, e) =>
        {
            byte[] bytes = e.Body;
            string str = Encoding.Default.GetString(bytes);
            Console.WriteLine("consumer1 : " + str);
        };
        channel.BasicConsume(QueueName, true, "", false, false, null, consumer);
    }
}
```

## 消费者2

只有这两句不一样

```java
private const string QueueName = "test_exchange2_queue";
Console.WriteLine("consumer2 : " + str);
```

运行结果就不上图.
