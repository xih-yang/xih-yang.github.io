# 03、RabbitMQ 实战 - 工作队列之轮询分发
- 来源：https://ddkk.com/zhuanlan/mq/rabbitmq/3/3.html
- 分类：消息队列
- 分组：RabbitMQ 教程（版本 A）
上一篇讲了简单队列,实际工作中,这种队列应该很少用到,因为生产者发送消息的耗时一般都很短,但是消费者收到消息后,往往伴随着对高消息的业务逻辑处理,是个耗时的过程,这势必会导致大量的消息积压在一个消费者手中,从而导致业务的积压.

所以我们需要多个消费者一起消费队列中的消息,模型如下:(为了方便讲解,暂时隐藏掉"交换机")

## 生产者

```java
public class Producer
{
    private const string QueueName = "test_work_queue";
    public static void Send()
    {
        //获取一个连接
        using (IConnection connection = ConnectionHelper.GetConnection())
        {
            //从连接中获取一个信道
            using (IModel channel = connection.CreateModel())
            {
                //声明队列
                channel.QueueDeclare(QueueName, false, false, false, null);
                for (int i = 0; i < 50; i++)
                {
                    //创建消息
                    string msg = "hello world " + i;
                    //发送消息
                    channel.BasicPublish("", QueueName, null, Encoding.Default.GetBytes(msg));
                    Console.WriteLine($"{DateTime.Now} : send {msg}");
                }
            }
        }
    }
}
```

## 消费者1

```java
public class Consumer1
{
    private const string QueueName = "test_work_queue";
    public static void Receive()
    {
        //获取一个连接
        IConnection connection = ConnectionHelper.GetConnection();
        //从连接中获取一个信道
        IModel channel = connection.CreateModel();
        //声明队列
        channel.QueueDeclare(QueueName, false, false, false, null);
        //添加消费者
        EventingBasicConsumer consumer = new EventingBasicConsumer(channel);
        //注册消费者收消息事件
        consumer.Received += (s, e) =>
        {
            byte[] bytes = e.Body;
            string str = Encoding.Default.GetString(bytes);
            Console.WriteLine("consumer1 receive : " + str);
            Thread.Sleep(500);//休息0.5秒
        };
        //开启消费者监听
        channel.BasicConsume(QueueName, true, "", false, false, null, consumer);
    }
}
```

## 消费者2

只有一点点区别:

```java
Console.WriteLine("consumer2 receive : " + str);
Thread.Sleep(1000);//休息1秒
```

我们这里故意让两个消费者处理消息的耗时不一样,一个0.5秒,一个1秒.

我们来看看结果:

可以非常清楚的看到,尽管两个消费者处理消息的"耗时"不一样,但是处理的"数量"是一样的.

这里有几个细节要说明一下:

**1、** 在生产者和两个消费者中都声明了同一个队列.其实,如果这个队列之前已经存在了,那么生产者和消费者都可以不用再声明了;；

**2、** 一定要先启动两个消费者,再启动生产者.原因是,我们上面的代码中,消费者的BasicConsume方法的第2个参数传入的是true,；

这个参数就是 autoAck :是否自动确认(上面文章有讲过).

所以如果先开启生产者,那么会瞬间发送完50条消息,这时候启动消费者1,那么会立刻"消费"掉这50条消息.有朋友肯定要问,不是"睡"了0.5秒么?

这里"睡"0.5秒,是对消息的业务逻辑处理耗时,而不是"消费"消息,消息已经在消费者启动的那一刻从队列中"拿"过来了;

同时,由于采用的是"自动确认",所以队列看到50条都被"确认"了,就会将这些消息从队列中移除.

这时候再启动消费者2,则不会收到任何消息.
