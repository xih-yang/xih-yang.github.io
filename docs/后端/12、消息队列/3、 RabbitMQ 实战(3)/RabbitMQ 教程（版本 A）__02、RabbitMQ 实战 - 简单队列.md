# 02、RabbitMQ 实战 - 简单队列
- 来源：https://ddkk.com/zhuanlan/mq/rabbitmq/3/2.html
- 分类：消息队列
- 分组：RabbitMQ 教程（版本 A）
简单队列的模型:

P:生产者,即 Producer

C:消费者,即 Consumer

"hello" : 消息

红色方块即队列

首先新建一个工具类,方便获取连接.

```java
public static class ConnectionHelper
{
    public static IConnection GetConnection()
    {
        //定义一个连接工厂
        ConnectionFactory factory = new ConnectionFactory
        {  
            HostName = "127.0.0.1",//设置服务器地址
            Port = 5672,  //设置端口号
            VirtualHost = "/vhost_refuge",//设置虚拟主机
            UserName = "refuge",//设置用户名
            Password = "******"//设置密码
        };
        return factory.CreateConnection();
    }
}
```

创建一个生产者

```java
/// <summary>
/// 生产者
/// </summary>
public class Producer
{
    //定义队列的名称
    private const string QueueName = "test_simple_queue";
    /// <summary>
    /// 发送消息
    /// </summary>
    public static void Send()
    {
        //获取一个连接
        using (IConnection connection = ConnectionHelper.GetConnection())
        {
            //从连接中获取一个信道
            using (IModel channel = connection.CreateModel())
            {
                //声明队列
                channel.QueueDeclare
                (
                    queue: QueueName, //队列名称
                    durable: false, //是否持久化
                    exclusive: false, //是否专属
                    autoDelete: false, //是否自动删除
                    arguments: null //队列的配置
                );
                //创建一个消息
                string msg = "hello";
                //发送消息
                channel.BasicPublish
                (
                    exchange: "", //交换机名称
                    routingKey: QueueName, //路由键
                    basicProperties: null, //该条消息的配置
                    body: Encoding.Default.GetBytes(msg) //消息字节数组
                );
                Console.WriteLine($"send {msg}");
            }
        }
    }
}
```

创建一个消费者

```java
/// <summary>
/// 消费者
/// </summary>
public class Consumer
{
    /// <summary>
    /// 队列名称
    /// </summary>
    private const string QueueName = "test_simple_queue";
    /// <summary>
    /// 接收消息
    /// </summary>
    public static void Receive()
    {
        //获取一个连接
        using (IConnection connection = ConnectionHelper.GetConnection())
        {
            //从连接中获取一个信道
            using (IModel channel = connection.CreateModel())
            {               
　　　　　　　　　　  //获取消息
                BasicGetResult res = channel.BasicGet
                (
                    queue: QueueName, //队列名称
                    autoAck: true //是否自动确认
                );
                if (res == null)
                {
                    return;
                }
                byte[] bytes = res.Body;
                string msg = Encoding.Default.GetString(bytes);
                Console.WriteLine($"receive {msg}");
            }
        }
    }
}
```

运行结果:

下面对一些方法的部分参数做下解释:

## QueueDeclare

- queue 队列名称
- durable 队列是否持久化.false:队列在内存中,服务器挂掉后,队列就没了;true:服务器重启后,队列将会重新生成.注意:只是队列持久化,不代表队列中的消息持久化!!!!
- exclusive 队列是否专属,专属的范围针对的是连接,也就是说,一个连接下面的多个信道是可见的.对于其他连接是不可见的.连接断开后,该队列会被删除.注意,不是信道断开,是连接断开.并且,就算设置成了持久化,也会删除.
- autoDelete 当所有消费者客户端连接断开时是否自动删除队列.
- arguments 队列的参数配置

## BasicPublish

- basicProperties: null, //该条消息的配置
- body: Encoding.Default.GetBytes(msg) //消息字节数组
- exchange: "", //交换机名称
- routingKey: QueueName, //路由键

文章开头提到的简单队列的模型中,没有交换机,这里的交换机名称我们传入的也是空字符串,

但是,这不代表就没有使用交换机.

实际上,系统会为每个队列都隐式的绑定一个默认的交换机，交换机的名称为“(AMQP default)”,类型为直连接 direct，当你手动创建一个队列时，后台会自动将这个队列绑定到一个名称为空的Direct类型交换机上，绑定路由名称与队列名称相同，所以这里虽然没有显示声明交换机，但路由键和队列名称一样,所以系统就将消息发送到这个默认的交换机里。有了这个默认的交换机和绑定，我们就可以像其他轻量级的队列，如Redis那样，直接操作队列来处理消息。不过理论上是可以的，但实际上在RabbitMQ里直接操作是不可取的。消息始终都是先发送到交换机，由交换级经过路由传送给队列，消费者再从队列中获取消息的。不过由于这个默认交换机和路由的关系，使我们只关心队列这一层即可，这个比较适合做一些简单的应用，毕竟没有发挥RabbitMQ的最大功能(RabbitMQ可以重量级消息队列)，如果都用这种方式去使用的话就真是杀鸡用宰牛刀了。

## BasicGet

- queue: QueueName, //队列名称
- autoAck: true //应答模式，true：自动应答，即消费者获取到消息，该消息就会从队列中删除掉，false：手动应答，当从队列中取出消息后，需要程序员手动调用方法应答，如果没有应答，该消息会一直存在队列中.
