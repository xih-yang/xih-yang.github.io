# 10、RabbitMQ 实战 - 远程过程调用（RPC）
- 来源：https://ddkk.com/zhuanlan/mq/rabbitmq/3/10.html
- 分类：消息队列
- 分组：RabbitMQ 教程（版本 A）
在远程计算机上运行一个函数并等待结果,我们通常叫这种模式为远程过程调用或者RPC.

通过RabbitMQ 进行 RPC 很容易,客户端发送请求消息,服务器回复响应消息.为了接收响应,我们需要发送带有“回调”队列地址的请求.

同时,这里面涉及到几个比较重要的消息属性:

## 消息属性

- Durable : 将消息标记为持久或者非持久;
- DeliveryMode：熟悉 AMQP 0-9-1协议的人可以选择使用此属性而不是Persistent,他们控制着同样的事情;
- ContentType：用于描述编码的mime类型.例如,对于经常使用的JSON编码,将此属性设置为：application / json是一种很好的做法;
- ReplyTo：通常用于命名回调队列;
- CorrelationId：用于将RPC响应与请求相关联;

## 相关ID

在上面介绍的参数中，可以看 ReplyTo 属性可以定义该消息的回调队列,也就是说我们可以为每个RPC请求创建一个回调队列。但这是非常低效的，更好的方法是为每个客户端(多个消费者)创建一个回调队列。

这引发了一个新问题，在该队列中收到响应后，不清楚响应属于哪个请求。

这时候, CorrelationId 属性就发挥它的作用了。

我们为每个请求的 CorrelationId 属性设置为唯一值。然后，当我们在回调队列中收到消息时，我们将查看此属性，并根据该属性，我们将能够将响应与请求进行匹配。如果我们看到未知的 CorrelationId 值，我们可以安全地丢弃该消息,因为它不属于我们的请求。

为什么我们应该忽略回调队列中的未知消息，而不是因为错误而失败？

这是由于服务器端存在竞争条件的可能性。尽管不太可能，但是在向我们发送答案之后，发送请求的确认消息之前，RPC服务器可能会死亡。如果发生这种情况，重新启动的RPC服务器将再次处理请求。这就是为什么在客户端上我们必须优雅地处理重复的响应，理想情况下RPC应该是幂等的。

## 摘要

RPC工作流程：

- 当客户端启动时，创建一个匿名的独占回调队列.(匿名最好,当然也可以不是匿名的)
- 对于RPC请求，客户端发送带有两个属性的消息： ReplyTo（设置为回调队列）和 CorrelationId（设置为每个请求的唯一值）。
- 请求被发送到 rpc_queue队列。
- RPC worker（aka：server）正在等待该队列上的请求。当请求出现时，它会执行函数并使用ReplyTo属性中的队列将结果返回给客户端。
- 客户端等待回调队列上的数据。出现消息时，它会检查CorrelationId属性。如果它与请求中的值匹配，则将响应返回给应用程序。

## 思路的转换

在进行RPC通信时,我们不再叫"生产者","消费者"了,而是改叫"客户端","服务器".因为在 RPC 中,

客户端即是一个生产者,因为它要发送请求消息给服务器,同时,它也是一个消费者,因为它还要接收服务器发送过来的响应消息.

而服务器即是一个消费者,因为它要接收客户端发送过来的请求消息,同时,它也是一个生产者,因为它执行完函数后,还需要发送响应消息给客户端.

我们把上面的图一分为二来看:

## 服务器代码

```java
internal class Program
{
    private const string RequestQueueName = "rpc_queue";
    private static void Main(string[] args)
    {
        using (RabbitMQ.Client.IConnection connection = ConnectionHelper.GetConnection())
        using (RabbitMQ.Client.IModel channel = connection.CreateModel())
        {
            channel.QueueDeclare(queue: RequestQueueName, durable: false, exclusive: false, autoDelete: false, arguments: null);
            channel.BasicQos(0, 1, false);
            EventingBasicConsumer consumer = new EventingBasicConsumer(channel);
            channel.BasicConsume(queue: RequestQueueName, autoAck: false, consumerTag: "", noLocal: false, exclusive: false, arguments: null, consumer: consumer);
            Console.WriteLine("server 开始等待 RPC 请求");
            consumer.Received += (s, e) =>
            {
                string response = null;
                byte[] bytes = e.Body;
                RabbitMQ.Client.IBasicProperties pros = e.BasicProperties;//拿到这条请求消息的属性
                RabbitMQ.Client.IBasicProperties replyPros = channel.CreateBasicProperties();//创建响应消息的属性
                replyPros.CorrelationId = pros.CorrelationId;//将请求消息的id赋值给响应消息,这个id就相当于请求消息的身份证
                try
                {
                    string msg = Encoding.UTF8.GetString(bytes);
                    int n = int.Parse(msg);
                    Console.WriteLine($"执行函数 Fib(int n) , 入参为 {msg}");
                    response = Fib(n).ToString();//运行函数,拿到结果
                }
                catch (Exception exception)
                {
                    Console.WriteLine(exception);
                    response = string.Empty;
                }
                finally
                {
                    byte[] responseBytes = Encoding.UTF8.GetBytes(response);//创建响应消息的字节码
                    //将响应消息发送到请求消息的属性中指定的响应队列
                    channel.BasicPublish(exchange: "", routingKey: pros.ReplyTo, mandatory: false, basicProperties: replyPros, body: responseBytes);
                    //发送响应消息后,手动确认已经收到请求消息
                    channel.BasicAck(deliveryTag: e.DeliveryTag, multiple: false);
                }
            };
            Console.WriteLine("按 enter 退出");
            Console.ReadLine();
        }
    }
    /// <summary>
    /// 服务器的函数
    /// </summary>
    /// <param name="n"></param>
    /// <returns></returns>
    private static int Fib(int n)
    {
        if (n == 0 || n == 1)
        {
            return n;
        }
        return Fib(n - 1) + Fib(n - 2);
    }
}
```

服务器代码非常简单：

- 像往常一样，我们首先建立连接，通道和声明队列。
- 我们可能希望运行多个服务器进程。为了在多个服务器上平均分配负载，我们需要在channel.BasicQos中设置 prefetchCount设置。
- 我们使用BasicConsume来访问队列。然后我们注册一个交付处理程序，我们在其中完成工作并发回响应。

## 客户端代码

```java
public class MyClient
{
    private readonly IConnection connection;
    private readonly IModel channel;
    private readonly IBasicProperties pros;//请求消息属性
    private readonly EventingBasicConsumer consumer;
    private readonly string replyQueueName;//响应队列名称
    private const string requestQueueName = "rpc_queue";//请求队列名称
    private readonly BlockingCollection<string> responseQueue = new BlockingCollection<string>();//存储响应消息
    public MyClient()
    {
        connection = ConnectionHelper.GetConnection();
        channel = connection.CreateModel();
        replyQueueName = channel.QueueDeclare().QueueName;//声明一个随机的,独占的,自动删除的,非持久化的响应队列
        consumer = new EventingBasicConsumer(channel);//创建一个消费者
        pros = channel.CreateBasicProperties();
        string correlationId = Guid.NewGuid().ToString();//创建一个"身份证"
        pros.CorrelationId = correlationId;
        pros.ReplyTo = replyQueueName;//设置回调队列
        consumer.Received += (s, e) =>
        {
            string response = Encoding.UTF8.GetString(e.Body);//拿到响应消息
            if (e.BasicProperties.CorrelationId.Equals(correlationId))//确认身份
            {
                responseQueue.Add(response);
            }
        };
    }
    /// <summary>
    /// 发起请求
    /// </summary>
    /// <param name="msg">请求消息</param>
    /// <returns>请求的结果</returns>
    public string Call(string msg)
    {
        byte[] bytes = Encoding.UTF8.GetBytes(msg);
        channel.BasicPublish(exchange: "", routingKey: requestQueueName, basicProperties: pros, body: bytes);//向请求队列发送请求消息.
        //在发送请求消息(发起请求)后,再定义客户端需要消费的回复队列,并且设置应答模式为 自动应答.因为RPC中,服务器不用关心客户端是否收到了响应
        channel.BasicConsume(queue: replyQueueName, autoAck: true, consumer: consumer);
        return responseQueue.Take();//返回本次请求的结果
    }
    /// <summary>
    /// 关闭客户端
    /// </summary>
    public void Close()
    {
        channel.Close();
        connection.Close();
    }
}
internal class Program
{
    private static void Main(string[] args)
    {
        MyClient client = new MyClient();
        while (true)
        {
            Console.WriteLine("请输入您要发送的请求消息 : ");
            string request = Console.ReadLine();
            if (string.IsNullOrWhiteSpace(request))
            {
                continue;
            }
            if (request.ToLower().Equals("q"))
            {
                break;
            }
            string response = client.Call(request);
            Console.WriteLine("请求的结果 : " + response);
        }
        client.Close();
    }
}
```

客户端代码稍微复杂一些：

- 我们建立一个连接和通道，并为回复声明一个独有的“回调”队列。
- 我们订阅了'回调'队列，以便我们可以接收RPC响应。
- 我们的Call方法生成实际的RPC请求。
- 在这里，我们首先生成一个唯一的CorrelationId 数并保存它 - 客户端将使用该值来捕获适当的响应。
- 接下来，我们发布请求消息，其中包含两个属性： ReplyTo和CorrelationId。
- 在这一点上，我们可以坐下来等待正确的响应到来。
- 客户端正在做一个非常简单的工作，对于每个响应消息，它检查CorrelationId 是否是我们正在寻找的那个。如果是这样，它会保存响应。
- 最后，我们将响应返回给用户。

此处介绍的设计并不是RPC服务的唯一可能实现，但它具有一些重要优势：

- 如果RPC服务器太慢，您可以通过运行另一个服务器来扩展。尝试在新控制台中运行第二个RPCServer。
- 在客户端，RPC只需要发送和接收一条消息。不需要像QueueDeclare这样的同步调用 。因此，对于单个RPC请求，RPC客户端只需要一次网络往返。

我们的代码仍然相当简单，并不试图解决更复杂（但重要）的问题，例如：

- 如果没有运行服务器，客户应该如何反应？
- 客户端是否应该为RPC设置某种超时？
- 如果服务器出现故障并引发异常，是否应将其转发给客户端？
- 在处理之前防止无效的传入消息（例如检查边界，类型）。
