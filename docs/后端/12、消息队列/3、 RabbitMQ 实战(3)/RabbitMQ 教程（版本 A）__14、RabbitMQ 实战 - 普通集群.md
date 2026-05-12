# 14、RabbitMQ 实战 - 普通集群
- 来源：https://ddkk.com/zhuanlan/mq/rabbitmq/3/14.html
- 分类：消息队列
- 分组：RabbitMQ 教程（版本 A）
上篇文章把单机集群搭建好了,可以开始验证普通集群的相关功能了.

我们首先在管理后台(15672,15673 都可以)添加一个用户,并用新用户登录,添加一个虚拟主机

由于是在一台机器上模拟集群,所以我们把创建连接的工具类小改一下,将端口号作为入参.

```java
public static class ConnectionHelper
{
    public static IConnection GetConnection(int port)
    {
        //定义一个连接工厂
        ConnectionFactory factory = new ConnectionFactory
        {  
            HostName = "127.0.0.1",//设置服务器地址
            Port = port,  //设置端口号
            VirtualHost = "/vhost_wjire",//设置虚拟主机
            UserName = "wjire",//设置用户名
            Password = "******"//设置密码
        };
        //factory.AutomaticRecoveryEnabled  //自动恢复连接,默认就是true
        //factory.NetworkRecoveryInterval //自动恢复连接失败,默认每 5 秒重试一次
        //连接恢复后才会进行拓扑恢复
        //factory.TopologyRecoveryEnabled //默认也是true
        return factory.CreateConnection();
    }
}
```

## 一.非持久化队列验证

## 1.生产者连接到 node1 (5672) 声明队列,发送消息,消费者连接到 node2 (5673) 接收消息.

生产者

```java
public class Producer
{
    private const string QueueName = "test_queue";
    public static void Send()
    {
        using (IConnection connection = ConnectionHelper.GetConnection(5672))
        using (IModel channel = connection.CreateModel())
        {
            var msg = "hello world";
            channel.QueueDeclare(QueueName, false, false, false, null);
            channel.BasicPublish("", QueueName, null, Encoding.Default.GetBytes(msg));
            Console.WriteLine($"send {msg}");
        }
    }
}
```

消费者

```java
public class Consumer
{
    private const string QueueName = "test_queue";
    public static void Receive()
    {
        IConnection connection = ConnectionHelper.GetConnection(5673);
        IModel channel = connection.CreateModel();
        EventingBasicConsumer consumer = new EventingBasicConsumer(channel);
        consumer.Received += (s, e) =>
        {
            string str = Encoding.Default.GetString(e.Body);
            Console.WriteLine("consumer receive : " + str);
        };
        channel.BasicConsume(queue: QueueName, autoAck: true, consumer: consumer);
    }
}
```

运行结果如下,并且在管理后台我们可以看到该队列的节点.

## 2.生产者连接到 node2 ,将消息发送到上面代码在 node1 声明的队列,而消费者则连接到 node2 接收消息.

测试结果一切正常,就不上图了.

## 二.持久化队列及消息验证

生产者部分代码

```java
channel.QueueDeclare(QueueName, true, false, false, null);//队列持久化
var pros = channel.CreateBasicProperties();
pros.Persistent = true;//将消息设置为持久化
channel.BasicPublish("", QueueName, pros, Encoding.Default.GetBytes(msg));
```

消息发送后

现在,我们关闭 node1 的RabbitMQ.然后再看管理后台,当然,15672 肯定访问不了,只能访问 15673

下面,我们尝试让生产者在 node2 也就是连接到 5673 重新声明一个叫 "test_queue"的队列.

结果直接异常了,下面是异常的部分截图:

现在我们重新启动 node1 ,过了几秒后,队列恢复到了 node1 关闭之前的状态.

## 三.集群节点介绍

RabbitMQ集群中的节点分内存节点(RAM)和磁盘节点(disc).

- 内存节点：将所有的队列,交换机,绑定,用户,权限,vhost的元数据都存储在内存中;
- 磁盘节点：将数据存放在磁盘上.磁盘节点需要保存集群的配置信息

如果发送的是持久化消息,那么即使是内存节点,数据还是会放在磁盘中.内存节点的性能只能体现在资源管理上,比如增加或删除队列,虚拟主机,交换机等,但发送和接受消息速度同磁盘节点一样.

一个集群至少有一个节点是磁盘节点,其他节点可以都是内存节点,当节点加入或者离开集群时都要将变更通知到至少一个磁盘节点.实际使用时至少要两个磁盘节点,原因很简单,如果只有一个磁盘节点,恰巧磁盘节点挂了,那么RabbitMQ将不能创建队列,创建交换机,创建绑定,添加用户,更改权限,添加或删除节点等操作,但是可以正常的发布和消费消息. 在实际使用中必须将集群的配置放到磁盘节点上来保存.

一个集群中的节点可以共享user,vhost,exchange等,所有的数据和状态都会在所有节点上复制.在集群模式下只要有任何一个节点可以工作,RabbitMQ集群对外就能提供服务.

单机集群只允许磁盘节点,否则每次重启所有数据将会丢失.
