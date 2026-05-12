# 07、RabbitMQ 实战 - 订阅者模式之主题模式 ( topic )
- 来源：https://ddkk.com/zhuanlan/mq/rabbitmq/3/7.html
- 分类：消息队列
- 分组：RabbitMQ 教程（版本 A）
主题模式和路由模式很像

路由模式是精确匹配

主题模式是模糊匹配

依然先通过管理后台添加一个交换机.

## 生产者

```java
public class Producer
{
    private const string ExchangeName = "test_exchange_topic";
    public static void Send()
    {
        //获取一个连接
        IConnection connection = ConnectionHelper.GetConnection();
        //从连接中获取一个通道
        IModel channel = connection.CreateModel();
        //声明交换机
        //channel.ExchangeDeclare(ExchangeName, "topic", false, false, null);
        //每次只向消费者发送一条消息,消费者使用后,手动确认后,才会发送另外一条
        channel.BasicQos(0, 1, false);
        string msg = "hello world ";
        //发送消息,只发送到路由键为"product.delete" 或者 "product.#"的队列.
        //# 匹配一个或多个
        //* 匹配一个
        //上限为 255 个字节
        channel.BasicPublish(ExchangeName, "product.delete", null, Encoding.Default.GetBytes(msg));
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
    private const string ExchangeName = "test_exchange_topic";
    public static void Receive()
    {
        //获取连接
        RabbitMQ.Client.IConnection connection = ConnectionHelper.GetConnection();
        //创建通道
        RabbitMQ.Client.IModel channel = connection.CreateModel();
        //声明队列
        channel.QueueDeclare(QueueName, false, false, false, null);
        //将队列绑定到交换机上
        channel.QueueBind(QueueName, ExchangeName, "product.add", null);
        channel.QueueBind(QueueName, ExchangeName, "product.update", null);
        EventingBasicConsumer consumer = new EventingBasicConsumer(channel);
        //注册事件
        consumer.Received += (s, e) =>
        {
            byte[] bytes = e.Body;
            string str = Encoding.Default.GetString(bytes);
            Console.WriteLine("consumer1 : " + str);
            channel.BasicAck(e.DeliveryTag, false);//手动应答
        };
        //监听队列
        //bool autoAck = true;//自动确认,一旦mq将消息分发给了消费者,就会从内存中删除该消息
        bool autoAck = false;//手动应答.
        channel.BasicConsume(QueueName, autoAck, "", false, false, null, consumer);
    }
}
```

## 消费者2

```java
public class Consumer2
{
    private const string QueueName = "test_exchange2_queue";
    private const string ExchangeName = "test_exchange_topic";
    public static void Receive()
    {
        //获取连接
        RabbitMQ.Client.IConnection connection = ConnectionHelper.GetConnection();
        //创建通道
        RabbitMQ.Client.IModel channel = connection.CreateModel();
        //声明队列
        channel.QueueDeclare(QueueName, false, false, false, null);
        //将队列绑定到交换机上
        channel.QueueBind(QueueName, ExchangeName, "product.#", null);         //添加消费者
        EventingBasicConsumer consumer = new EventingBasicConsumer(channel);
        //注册事件
        consumer.Received += (s, e) =>
        {
            byte[] bytes = e.Body;
            string str = Encoding.Default.GetString(bytes);
            Console.WriteLine("         consumer2 : " + str);
            channel.BasicAck(e.DeliveryTag, false);//手动应答
        };
        //监听队列
        //bool autoAck = true;//自动确认,一旦mq将消息分发给了消费者,就会从内存中删除该消息
        bool autoAck = false;//手动应答.
        channel.BasicConsume(QueueName, autoAck, "", false, false, null, consumer);
    }
}
```

运行结果:

由于消费者1的路由键只有 "product.add" 和 "product.update" ,不包含"product.delete",

而消费者2的路由键是"product.#",可以模糊匹配上"product.delete",

所以交换机只会把消息转发到消费者2声明的队列中.
