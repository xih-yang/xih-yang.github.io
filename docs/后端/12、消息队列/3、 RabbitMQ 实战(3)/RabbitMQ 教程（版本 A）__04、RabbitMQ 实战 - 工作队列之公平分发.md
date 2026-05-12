# 04、RabbitMQ 实战 - 工作队列之公平分发
- 来源：https://ddkk.com/zhuanlan/mq/rabbitmq/3/4.html
- 分类：消息队列
- 分组：RabbitMQ 教程（版本 A）
上篇文章讲的轮询分发 : 1个队列,无论多少个消费者,无论消费者处理消息的耗时长短,大家消费的数量都一样.

而公平分发,又叫 : 能者多劳,顾名思义,处理得越快,消费得越多.

## 生产者

```java
public class Producer
{
    private const string QueueName = "test_work2_queue";
    public static void Send()
    {
        //获取一个连接
        IConnection connection = ConnectionHelper.GetConnection();
        //从连接中获取一个通道
        IModel channel = connection.CreateModel();
        //声明队列
        channel.QueueDeclare(QueueName, false, false, false, null);
        //每次只向消费者发送一条消息,消费者使用后,手动确认后,才会发送另外一条
        channel.BasicQos(0, 1, false);
        for (int i = 0; i < 50; i++)
        {
            string msg = "hello world " + i;
            //发送消息
            channel.BasicPublish("", QueueName, null, Encoding.Default.GetBytes(msg));
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
    private const string QueueName = "test_work2_queue";
    public static void Receive()
    {
        //获取连接
        IConnection connection = ConnectionHelper.GetConnection();
        //创建通道
        IModel channel = connection.CreateModel();
        //声明队列
        channel.QueueDeclare(QueueName, false, false, false, null);
        channel.BasicQos(0, 1, false);
        //添加消费者
        EventingBasicConsumer consumer = new EventingBasicConsumer(channel);
        //注册事件
        consumer.Received += (s, e) =>
        {
            byte[] bytes = e.Body;
            string msg = Encoding.Default.GetString(bytes);
            Console.WriteLine("consumer1 : " + msg);
            Thread.Sleep(2000);//休息2秒
            channel.BasicAck(e.DeliveryTag, false);//手动确认,false表示只确认当前这条消息已收到,ture表示在当前这条消息及之前(小于 DelivertTag )的所有未确认的消息都已收到.
        };
        //监听队列,第2个参数设置为手动确认.true 则为自动确认.           
        channel.BasicConsume(QueueName, false, "", false, false, null, consumer);
    }
}
```

## 消费者2

```java
Console.WriteLine("consumer2 : " + msg);
Thread.Sleep(1000);//休息1秒
```

运行效果:

由于消费者1处理一条消息要2秒,而消费者2只要1秒,所以消费者2处理得多一些.

## 方法解释:

## channel.BasicQos(0, 1, false)

参数1: prefetchSize：0

参数2: prefetchCount：1 ,告诉RabbitMQ,不要同时给一个消费者推送多于1条消息，即一旦有1个消息还没有ack(确认)，则该消费者将block掉，直到有消息确认

global：true\false 是否将上面设置应用于channel，简单点说，就是上面限制是channel级别的还是consumer级别

备注：据说prefetchSize 和global这两项，rabbitmq没有实现，暂且不研究.

## channel.BasicAck(e.DeliveryTag, false)

参数1: deliveryTag : e.DeliveryTag,该消息的标记 ,ulong 类型.

参数2: multiple：是否批量.true:将一次性确认所有小于 deliveryTag 的消息.
