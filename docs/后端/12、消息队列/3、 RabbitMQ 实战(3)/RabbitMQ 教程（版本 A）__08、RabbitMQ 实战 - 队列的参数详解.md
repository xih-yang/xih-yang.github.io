# 08、RabbitMQ 实战 - 队列的参数详解
- 来源：https://ddkk.com/zhuanlan/mq/rabbitmq/3/8.html
- 分类：消息队列
- 分组：RabbitMQ 教程（版本 A）
代码中,我们通常这样声明一个队列:

```java
//声明队列
channel.QueueDeclare
(
    queue: QueueName, //队列名称
    durable: false, //队列是否持久化.false:队列在内存中,服务器挂掉后,队列就没了;true:服务器重启后,队列将会重新生成.注意:只是队列持久化,不代表队列中的消息持久化!!!!
    exclusive: false, //队列是否专属,专属的范围针对的是连接,也就是说,一个连接下面的多个信道是可见的.对于其他连接是不可见的.连接断开后,该队列会被删除.注意,不是信道断开,是连接断开.并且,就算设置成了持久化,也会删除.
    autoDelete: true, //如果所有消费者都断开连接了,是否自动删除.如果还没有消费者从该队列获取过消息或者监听该队列,那么该队列不会删除.只有在有消费者从该队列获取过消息后,该队列才有可能自动删除(当所有消费者都断开连接,不管消息是否获取完)
    arguments: null //队列的配置
);
```

对于第5个参数: arguments ,

它的类型是一个键值对集合 :

它到底有哪些key呢?

我们可以通过 RabbitMQ 的管理页面看到:

一共10个:

- Message TTL : 消息生存期
- Auto expire : 队列生存期
- Max length : 队列可以容纳的消息的最大条数
- Max length bytes : 队列可以容纳的消息的最大字节数
- Overflow behaviour : 队列中的消息溢出后如何处理
- Dead letter exchange : 溢出的消息需要发送到绑定该死信交换机的队列
- Dead letter routing key : 溢出的消息需要发送到绑定该死信交换机,并且路由键匹配的队列
- Maximum priority : 最大优先级
- Lazy mode : 懒人模式
- Master locator :

## Message TTL

官方: How long a message published to a queue can live before it is discarded (milliseconds). (Sets the "x-message-ttl" argument.)

翻译: 一个队列中的消息,在被丢弃之前能够存活多少毫秒.( key 为 "x-message-ttl").通俗讲就是,队列中的消息的生存周期,单位毫秒.

测试:

```java
    internal class Program
    {
        private static void Main(string[] args)
        {
            Dictionary<string, object> arguments = new Dictionary<string, object> { { "x-message-ttl", 10000 } };
            Producer.Send(arguments);
            Console.ReadKey();
        }
    }
    public class Producer
    {
        private const string QueueName = "test_queue";
        public static void Send(IDictionary<string,object> arguments)
        {
            using (IConnection connection = ConnectionHelper.GetConnection())
            using (IModel channel = connection.CreateModel())
            {
                channel.QueueDeclare(QueueName, false, false, false, arguments);
                string msg = "hello world ";
                channel.BasicPublish("", QueueName, null, Encoding.Default.GetBytes(msg));
                Console.WriteLine($"{DateTime.Now} : send {msg}");
            }
        }
    }
```

我们从管理页面该队列的消息概述中可以看出,这条消息只存活了10秒钟.

为了加以对比,我还另外创建了一个没有声明任何参数的队列:

可以看出,测试的这条队列的特征(Features)一栏中,被打上了"TTL"标签.

**这里有个非常重要的知识点需要注意!**

**队列一旦声明,参数将无法更改,添加,删除,也就是说,对上述"test_queue"队列进行如下操作都会抛出异常:**

- **修改该队列的 "x-message-ttl" 参数为 "20000" 毫秒 :**

```java
Dictionary<string, object> arguments = new Dictionary<string, object> { { "x-message-ttl", 20000 } };
```

- ***试图通过传入 null 来删除该队列的所有已设置的参数 :***

```java
Dictionary<string, object> arguments = null;
```

- **试图添加新的参数 :**

```java
            Dictionary<string, object> arguments = new Dictionary<string, object> { { "x-message-ttl", 10000 } };
            arguments.Add("x-expires", 12345);
```

**通通不行!!!**

**要改变一个队列的参数,只有两种办法:**

- **删除该队列,重新创建;**
- **换个名字,创建一个新的队列.**

## Auto expire

官方: How long a queue can be unused for before it is automatically deleted (milliseconds).(Sets the "x-expires" argument.)

翻译: 队列多长时间(毫秒)没有被使用(访问)就会被删除.换个说法就是,当队列在指定的时间内没有被使用(访问)就会被删除.

测试:

```java
        private static void Main(string[] args)
        {
            Dictionary<string, object> arguments = new Dictionary<string, object>
            {
                {"x-message-ttl", 10000},//设置队列中的消息存活期为 10 秒
                { "x-expires", 20000}//设置队列的存活期 20 秒
            };
            Producer.Send(arguments);
            Console.ReadKey();
        }
```

可以看到,队列特征一栏中,多了一个"Exp"标签

当然,10秒后,消息会被删除,20秒后,队列被删除

**但是,如果我们同时创建一个消费者,监听该队列,如下:**

```java
    public class Consumer
    {
        private const string QueueName = "test_queue";
        public static void Receive()
        {
            IConnection connection = ConnectionHelper.GetConnection();
            IModel channel = connection.CreateModel();
            EventingBasicConsumer consumer = new EventingBasicConsumer(channel);
            consumer.Received += (s, e) =>
            {
                byte[] bytes = e.Body;
                string str = Encoding.Default.GetString(bytes);
                Console.WriteLine("consumer receive : " + str);
            };
            channel.BasicConsume(QueueName, true, "", false, false, null, consumer);
        }
    }
```

```java
        private static void Main(string[] args)
        {
            Dictionary<string, object> arguments = new Dictionary<string, object>
            {
                {"x-message-ttl", 10000},//设置队列中的消息存活期为 10 秒
                { "x-expires", 20000}//设置队列的存活期 20 秒
            };
            Producer.Send(arguments);
            Consumer.Receive();//创建一个消费者监听该队列
            Console.ReadKey();
        }
```

**那该队列永远不会被删除.因为虽然它里面没有消息,但一直有消费者在使用(访问)它,所以它不会被删除.**

## Max length

官方: How many (ready) messages a queue can contain before it starts to drop them from its head.(Sets the "x-max-length" argument.)

翻译: 队列可以容纳的消息的最大条数,超过这个条数,队列头部的消息将会被丢弃.

测试: 我们设置队列最多只能容纳 1 条消息,然后一次性发送10条,发送完毕后,创建一个消费者去消费,部分代码如下:

### 生产者

```java
for (int i = 0; i < 10; i++)
{
    string msg = "hello world " + i;
    channel.BasicPublish("", QueueName, null, Encoding.Default.GetBytes(msg));
    Console.WriteLine($"{DateTime.Now} : send {msg}");
}
```

```java
private static void Main(string[] args)
{
    Dictionary<string, object> arguments = new Dictionary<string, object>
    {
        {"x-message-ttl", 10000},//设置队列中的消息存活期为 10 秒
        { "x-expires", 20000},//设置队列的存活期 20 秒
        {"x-max-length",1 },//设置队列中的消息的最大条数为 1 条,超过1条,则遵循队列的"先进先出(丢)"原则.
    };
    Producer.Send(arguments);
    Thread.Sleep(1000);
    Consumer.Receive();//创建一个消费者监听该队列
    Console.ReadKey();
}
```

运行结果:

可以看到,消费者消费到的是"hello world 9", "hello world 0" - "hello world 8"都被队列丢弃了.

标签如下:

## Max length bytes

官方: Total body size for ready messages a queue can contain before it starts to drop them from its head.(Sets the "x-max-length-bytes" argument.)

翻译: 队列可以容纳的消息的最大字节数,超过这个字节数,队列头部的消息将会被丢弃.

测试: 我们首先设置队列最多只能容纳12个字节.

```java
Dictionary<string, object> arguments = new Dictionary<string, object>
{
    {"x-message-ttl", 10000},//设置队列中的消息存活期为 10 秒
    { "x-expires", 20000},//设置队列的存活期 20 秒
    {"x-max-length-bytes",12 },//设置队列中的消息的最大字节数
};
```

接下来要分两种情况了:

### 一.发送一条 15个字节的消息:"新年快乐啊"(我们采用UTF8编码,1个汉字占3个字节),发送完毕后,创建一个消费者去消费.(当然,消费者也要用UTF8来接收)

```java
string msg = "新年快乐啊";
channel.BasicPublish("", QueueName, null, Encoding.UTF8.GetBytes(msg));
Console.WriteLine($"{DateTime.Now} : send {msg}");
```

可以看到,消费者并没有收到消息.说明整条消息都被丢弃了,而不是想象中的只丢弃"新年快乐" ,剩个"啊".

### 二.连续发送2条累计15个字节的消息.

```java
channel.BasicPublish("", QueueName, null, Encoding.UTF8.GetBytes("新年快乐"));
channel.BasicPublish("", QueueName, null, Encoding.UTF8.GetBytes("啊"));
Console.WriteLine($"{DateTime.Now} : 消息发送完毕 ");
```

可以看到, 消费者收到了"啊".

队列标签如下 :

## Overflow behaviour

官方: Sets the queue overflow behaviour. This determines what happens to messages when the maximum length of a queue is reached. Valid values are `drop-head` or `reject-publish`.

翻译: 队列中的消息溢出时,如何处理这些消息.要么丢弃队列头部的消息,要么拒绝接收后面生产者发送过来的所有消息.( 从上面两个参数的测试中可以看出,"drop-head" 应该是默认行为) ,官方只给了 value,没给 key . key 为 "x-overflow".

测试: 沿用 Max length 参数解释中的示例:

```java
private static void Main(string[] args)
{
    Dictionary<string, object> arguments = new Dictionary<string, object>
    {
        {"x-max-length",1 },//设置队列中的消息的最大条数为 1 条,超过1条,则遵循队列的"先进先出(丢)"原则.         
        {"x-overflow","reject-publish" },//设置队列中的消息溢出后,该队列的行为:"拒绝接收"(所有消息)
    };
    Producer.Send(arguments);
    Thread.Sleep(1000);
    Consumer.Receive();//创建一个消费者监听该队列
    Console.ReadKey();
}
```

运行结果:

可以看到,这次消费者消费的是" hello world 0" ,不再是 "hello world 9" 了,因为生产者发送的"hello world 1" - "hello world 9"被队列拒绝了.

标签如下:

## Dead letter exchange

官方: Optional name of an exchange to which messages will be republished if they are rejected or expire.(Sets the "x-dead-letter-exchange" argument.)

翻译: 该参数值为一个(死信)交换机的名称,当队列中的消息的生存期到了,或者因长度限制被丢弃时,消息会被推送到(绑定到)这台交换机(的队列中),而不是直接丢掉.

对于这个参数,有两点需要特别注意:

## 一.前面的文章中提到过:

所以,在测试前,我们需要创建一个队列,并绑定到该交换机.当然,交换机也需要提前创建好.

为了方便,我们在管理页面创建交换机和队列,并完成"绑定"动作.

### 创建交换机

**1、** 先选择"Exchanges"标签；

**2、** 点击"Addanewexchange"标签.；

这里又要注意了,交换机类型我们要选择"fanout"模式.这种模式下,交换机会将生产者发送的消息分发到所有绑定到它的队列.细心的朋友应该能看出来为什么.

因为这个参数只是传入了交换机的名称,没有传入"Routing Key".

### 创建队列

创建一个新队列 : "test_dead_letter_queue" ,图就不上了,开篇就已经提到了.

### 绑定交换机

有两种方式:

**1、** 在交换机详情页面输入要绑定的队列.；

**2、** 在队列详情页面输入要绑定的交换机.；

上述工作都完成后,我们开始正式测试该参数.

我们设置队列可以容纳的消息最多1条,多的拒绝接收.

```java
private static void Main(string[] args)
{
    Dictionary<string, object> arguments = new Dictionary<string, object>
    {
        {"x-max-length",1 },//设置队列中的消息的最大条数为 1 条,超过1条,则遵循队列的"先进先出(丢)"原则.
        {"x-overflow","reject-publish" },//设置队列中的消息溢出后,队列的行为:"拒绝接收"(任何消息)
        {"x-dead-letter-exchange","test_dead_letter_exchange" },
    };
    Producer.Send(arguments);
    Thread.Sleep(1000);
    Consumer.Receive();
    Console.ReadKey();
}
```

生产者的代码我们沿用 Max length 参数解释中的代码.

运行后,我们去看后台.

咦!?"test_dead_letter_queue"队列怎么一条消息都没有呢?

为什么交换机没有把 "test_queue" 丢弃的9条消息推送到该队列呢?

这是什么情况?

这就是这个参数第2个需要注意的点了.

## 二.我们再读一次官方对该参数的解释:

Optional name of an exchange to which messages will be republished if they are rejected or expire.

个人觉得,官方这里用 rejected 不是太准确,当然,也可能是我理解得还不够深入,再加上英语太差.

为什么这么说呢?

我最开始的理解是 : 被拒绝或到期的消息会被推送到新的交换机,所以我在参数中传入了 {"x-overflow","reject-publish" }

我认为队列拒绝的这9条消息,就应该被交换机推送到绑定到它的队列去!

实际上,官方用词 "rejected" 应该被翻译成 : "丢弃"或者"抛弃",而不是"拒绝",也就是说,这里的 rejected 和 expire 是队列里面的消息的状态.而不是队列的动作.

当我们注释掉 {"x-overflow","reject-publish" } ,改用默认的 "drop-head" 行为时,运行一切正常:

关于到期( expire )的测试,这里就不上图了.

这个参数的标签是 : DLX

## Dead letter routing key

官方: Optional replacement routing key to use when a message is dead-lettered. If this is not set, the message's original routing key will be used.(Sets the "x-dead-letter-routing-key" argument.)

翻译: 略......

测试:

我们先删除上述 "Dead letter exchange" 参数解释中创建的交换机及队列.

然后重新创建交换机 "test_dead_letter_exchange",并将其类型设置为"direct".(很多帖子叫它"直连模式"或者"路由模式",叫"topic"为"主题模式",但我更新喜欢叫"direct"为"精确匹配模式",叫"topic"为"模糊匹配模式",感觉好理解一些)

接着重新创建两个队列 "test_dead_letter_queue1" 和 "test_dead_letter_queue2",并将它们绑定到新的交换机.绑定的时候,将队列"test_dead_letter_queue1"的路由键设置为"test".

```java
private static void Main(string[] args)
{
        Dictionary<string, object> arguments = new Dictionary<string, object>
        {
            {"x-max-length",1 },//设置队列中的消息的最大条数为 1 条,超过1条,则遵循队列的"先进先出(丢)"原则.
            {"x-dead-letter-exchange","test_dead_letter_exchange" },
            {"x-dead-letter-routing-key","test" },
        };
        Producer.Send(arguments);
        Console.ReadKey();
    }
}
```

运行结果及标签:

## Maximum priority

官方: Maximum number of priority levels for the queue to support; if not set, the queue will not support message priorities.(Sets the "x-max-priority" argument.)

翻译: 设置该队列中的消息的优先级最大值.发布消息的时候,可以指定消息的优先级,优先级高的先被消费.如果没有设置该参数,那么该队列不支持消息优先级功能.也就是说,就算发布消息的时候传入了优先级的值,也不会起什么作用.

测试:

### 生产者

```java
public class Producer
{
    private const string QueueName = "test_queue";
    public static void Send(IDictionary<string, object> arguments)
    {        
      using (IConnection connection = ConnectionHelper.GetConnection())
        using (IModel channel = connection.CreateModel())
        {
　　　　　　　　　 var pros = channel.CreateBasicProperties();//构造消息的属性
            channel.QueueDeclare(QueueName, false, false, false, arguments);
            for (byte i = 0; i < 10; i++)
            {
                string msg = "hello world " + i;
                pros.Priority = i;
                channel.BasicPublish("", QueueName, pros, Encoding.Default.GetBytes(msg));
                Console.WriteLine($"{DateTime.Now} : send {msg}");
            }
        }
    }
}
```

上述代码表明,"hello world 0-9" 的优先级为 9 - 0.

需要注意的是,优先级属性的类型为 byte.

```java
private static void Main(string[] args)
{
    Dictionary<string, object> arguments = new Dictionary<string, object>
    {
        {"x-max-priority",255 },
    };
    Producer.Send(arguments);
    Thread.Sleep(1000);
    Consumer.Receive();//创建一个消费者监听该队列
    Console.ReadKey();
}
```

运行结果:

问题又来了,如果声明队列时,优先级最大值设置的是 5 ,那么这10条消息的消费顺序应该是怎样的呢?我们直接看结果:

这个有点意思......

该参数的标签为 : Pri

## Lazy mode

官方: Set the queue into lazy mode, keeping as many messages as possible on disk to reduce RAM usage; if not set, the queue will keep an in-memory cache to deliver messages as fast as possible.(Sets the "x-queue-mode" argument.)

翻译: 设置队列为懒人模式.该模式下的队列会先将交换机推送过来的消息(尽可能多的)保存在磁盘上,以减少内存的占用.当消费者开始消费的时候才加载到内存中;如果没有设置懒人模式,队列则会直接利用内存缓存,以最快的速度传递消息.

测试: 使用简单队列公平分发测试.

### 生产者

```java
public class Producer
{
    private const string QueueName = "test_queue";
    public static void Send(IDictionary<string, object> arguments)
    {
        using (IConnection connection = ConnectionHelper.GetConnection())
        using (IModel channel = connection.CreateModel())
        {
            channel.QueueDeclare(QueueName, false, false, false, arguments);
            channel.BasicQos(0, 1, false);
            for (byte i = 0; i < 10; i++)
            {
                string msg = "hello world " + i;
                channel.BasicPublish("", QueueName, null, Encoding.Default.GetBytes(msg));
                Console.WriteLine($"{DateTime.Now} : send {msg}");
            }
        }
    }
}
```

### 消费者

```java
public class Consumer
{
    private const string QueueName = "test_queue";
    public static void Receive()
    {
        IConnection connection = ConnectionHelper.GetConnection();
        IModel channel = connection.CreateModel();
        EventingBasicConsumer consumer = new EventingBasicConsumer(channel);
        consumer.Received += (s, e) =>
        {
            byte[] bytes = e.Body;
            string str = Encoding.Default.GetString(bytes);
            Console.WriteLine("consumer receive : " + str);
            channel.BasicAck(e.DeliveryTag, false);
            Thread.Sleep(5000);//5秒确认一条消息
        };
        channel.BasicConsume(QueueName, false, "", false, false, null, consumer);
    }
}
```

### 控制台

```java
private static void Main(string[] args)
{
    Dictionary<string, object> arguments = new Dictionary<string, object>
    {
        {"x-queue-mode","lazy" },
    };
    Producer.Send(arguments);
    Thread.Sleep(10000);
    Consumer.Receive();//生产者消息发送完毕10秒后再创建消费者
    Console.ReadKey();
}
```

运行结果:

当10条消息发送完毕后,我们看管理后台的队列详情:

可以非常清楚看到,内存中是没有任何消息的.总数和已准备都是130B.

130B怎么来的? "hello world 0" 一共13个字节,一共10条,13*10=130.

10秒后,消费者创建,并开始消费.

参数的标签为 : Args (这个标签有点特别...)

其实关于懒人模式和默认模式还有很多细节,各自的优缺点等.比如上面的例子,我故意让生产者一次性发了10条消息到队列,并且队列每次只传递一条到消费者,但是消费者开始消费的时候,队列就一次性把10条消息都读取到了内存.

再比如,持久化的消息与非持久化的消息,结合懒人模式等等.

还有默认模式和懒人模式的效率,性能比较等.

估计需要单独写个帖子了.

终于写到最后一个参数了

## Master locator

官方: Set the queue into master location mode, determining the rule by which the queue master is located when declared on a cluster of nodes.(Sets the "x-queue-master-locator" argument.)

集群相关设置,暂时放一边去!
