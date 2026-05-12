# 09、RabbitMQ 实战 - 消息的参数详解
- 来源：https://ddkk.com/zhuanlan/mq/rabbitmq/3/9.html
- 分类：消息队列
- 分组：RabbitMQ 教程（版本 A）
上篇文章讲了声明一个队列时的参数设置,这篇文章主要说一说发布消息时的参数设置.

发布消息时的完整入参是这样的:

```java
channel.BasicPublish
    (
    exchange: "test_exchange",
    routingKey: "",
    mandatory: false,
    basicProperties: null,
    body: Encoding.Default.GetBytes(msg)
    );
```

## exchange: 交换机名称

## routingKey:路由键

路由键的设置跟交换机的类型有关.

- 如果交换机的类型是"fanout",那么不管这个参数传入的是啥,哪怕是个空字符串(不能是null),也不管与这个交换机绑定的队列到底有没有设置路由键,设置的是什么.通通当它们不存在.所有绑定到该交换机的队列都会收到消息;
- 如果交换机的类型是"direct"或者"topic",那么这个参数才有意义.

## mandatory:

- 当为true时,如果exchange根据自身类型和第2个参数(routeKey)无法找到一个符合条件的queue,那么会将消息返还给生产者;
- 当为false时,出现上述情形broker会直接将消息扔掉.

测试:

**生产者**

```java
public class Producer
{
    private const string QueueName = "test_queue";
    private const string ExchangeName = "test_exchange";
    public static void Send()
    {         
        using (IConnection connection = ConnectionHelper.GetConnection())
        using (IModel channel = connection.CreateModel())
        {
            channel.BasicQos(0, 1, false);
            channel.BasicReturn += (s, e) =>
            {
                byte[] bytes = e.Body;
                string str = Encoding.Default.GetString(bytes);
                Console.WriteLine("return message : " + str);
            };
            string msg = "hello world ";
            channel.BasicPublish
                (
                exchange: ExchangeName,
                routingKey: "找不到匹配的队列",
                mandatory: true,
                basicProperties: null,
                body: Encoding.Default.GetBytes(msg)
                );
            Console.WriteLine($"send {msg}");
        }
    }
}
```

运行结果:

## basicProperties:消息的基本属性

该参数是一个 IBasicProperties 类型的对象,具体有哪些属性,我们可以看源代码,不过我觉得通过管理后台来了解这些参数,更直观一些.

实在是有点多啊!

- content_type 消息内容的类型,如 "application/json"
- content_encoding 消息内容的编码格式
- priority 消息的优先级,上面文章已经讲过了.
- correlation_id 用于将RPC响应与请求相关联.
- reply_to 回调队列
- expiration 消息过期时间,单位毫秒.该参数值优先级>队列参数设置中的消息生存期
- message_id 消息id
- timestamp 消息的时间戳
- type： 类型
- user_id: 用户id
- app_id： 应用程序id
- cluster_id: 集群id

有两个属性,persistent 和 DeliveryMode ,它们的作用是一样的.

Persistent : true 表示消息持久化.当然,前提是队列也必须持久化.

管理后台可以直接设置 DeliveryMode :
