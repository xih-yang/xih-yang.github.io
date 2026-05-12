# 06、RabbitMQ 实战 - 订阅者模式之路由模式 ( direct )
- 来源：https://ddkk.com/zhuanlan/mq/rabbitmq/3/6.html
- 分类：消息队列
- 分组：RabbitMQ 教程（版本 A）
路由模式下,生产者发送消息时需要指定一个路由键(routingKey),交换机只会把消息转发给包含该路由键的队列

这里,我们改变一下声明交换机的方式.

我们通过管理后台添加一个交换机.

添加后,生产者和消费者的代码中就不需要再声明交换机了.同样,也可以通过管理后台添加队列,那么代码中也不需要声明队列了.

## 生产者

```java
public class Producer
{
    private const string ExchangeName = "test_exchange_direct";
    public static void Send()
    {
        IConnection connection = ConnectionHelper.GetConnection();
        IModel channel = connection.CreateModel();  
        string msg = "hello world ";
        //把消息发送到交换机,交换机再转发到包含路由键"refuge"的队列.
        channel.BasicPublish(ExchangeName, "refuge", null, Encoding.Default.GetBytes(msg));
        Console.WriteLine($"send {msg}");
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
    private const string ExchangeName = "test_exchange_direct";
    public static void Receive()
    {
        //获取连接
        RabbitMQ.Client.IConnection connection = ConnectionHelper.GetConnection();
        //创建通道
        RabbitMQ.Client.IModel channel = connection.CreateModel();
        //声明队列
        channel.QueueDeclare(QueueName, false, false, false, null);
        //声明交换机
        //channel.ExchangeDeclare(ExchangeName, "direct", false, false, null);
        //将队列绑定到交换机上,路由键为"wjire"
        channel.QueueBind(QueueName, ExchangeName, "wjire", null);
        //添加消费者
        EventingBasicConsumer consumer = new EventingBasicConsumer(channel);
        //注册事件
        consumer.Received += (s, e) =>
        {
            byte[] bytes = e.Body;
            string str = Encoding.Default.GetString(bytes);
            Console.WriteLine("consumer1 : " + str);
        };
        //监听队列
        channel.BasicConsume(QueueName, true, "", false, false, null, consumer);
    }
}
```

## 消费者2

```java
public class Consumer2
{
    private const string QueueName = "test_exchange2_queue";
    private const string ExchangeName = "test_exchange_direct";
    public static void Receive()
    {
        //获取连接
        RabbitMQ.Client.IConnection connection = ConnectionHelper.GetConnection();
        //创建通道
        RabbitMQ.Client.IModel channel = connection.CreateModel();
        //声明队列
        channel.QueueDeclare(QueueName, false, false, false, null);
        //声明交换机
        //channel.ExchangeDeclare(ExchangeName, "direct", false, false, null);
        //将队列绑定到交换机上,该队列匹配两个路由键,"refuge"和"wjire"
        channel.QueueBind(QueueName, ExchangeName, "refuge", null);
        channel.QueueBind(QueueName, ExchangeName, "wjire", null);
        //添加消费者
        EventingBasicConsumer consumer = new EventingBasicConsumer(channel);
        //注册事件
        consumer.Received += (s, e) =>
        {
            byte[] bytes = e.Body;
            string str = Encoding.Default.GetString(bytes);
            Console.WriteLine("         consumer2 : " + str);
        };
        //监听队列
        channel.BasicConsume(QueueName, true, "", false, false, null, consumer);
    }
}
```

运行结果:

可以看到,只有消费者2消费了消息.
