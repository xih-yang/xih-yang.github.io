# 07、RabbitMQ 实战 - Java Client 之 Topics （主题）
- 来源：https://ddkk.com/zhuanlan/mq/rabbitmq/4/7.html
- 分类：消息队列
- 分组：RabbitMQ 教程（版本 A）
在上篇博文 [译:4.RabbitMQ 之Routing（路由）](https://www.cnblogs.com/xingyunblog/p/9680618.html) 中，我们改进了日志系统。

我们使用的是direct（直接交换），而不是使用只能进行虚拟广播的 fanout（扇出交换） ，并且有可能选择性地接收日志。

虽然使用direct（直接交换）改进了我们的系统，但它仍然有局限性 - 它不能基于多个标准进行路由。

在我们的日志系统中，我们可能不仅要根据严重性订阅日志，还要根据发出日志的源来订阅日志。您可能从[syslog](http://en.wikipedia.org/wiki/Syslog) unix工具中了解这个概念，该 工具根据严重性（info / warn / crit ...）和facility（auth / cron / kern ...）来路由日志。

这会给我们带来很大的灵活性 - 我们可能想听听来自'cron'的关键错误以及来自'kern'的所有日志。

要在我们的日志系统中实现这一点，我们需要了解更复杂的topic （主题交换）。

## Topic exchange 主题交换

发送到主题交换的消息不能具有任意 routing_key - 它必须是由点分隔的单词列表。单词可以是任何内容，但通常它们指定与消息相关的一些功能。一些有效的路由密钥示例：“ stock.usd.nyse ”，“ nyse.vmw ”，“ quick.orange.rabbit ”。路由密钥中可以包含任意数量的单词，最多可达255个字节。

绑定密钥也必须采用相同的形式。主题交换背后的逻辑 类似于直接交换- 使用特定路由密钥发送的消息将被传递到与匹配绑定密钥绑定的所有队列。但是，绑定键有两个重要的特殊情况：

- *（星号）可以替代一个单词。
- ＃（hash）可以替换零个或多个单词。

在一个例子中解释这个是最容易的：

在这个例子中，我们将发送所有描述动物的消息。消息将与包含三个单词（两个点）的路由键一起发送。

路由键中的第一个单词将描述速度，第二个是颜色，第三个是物种：“ 。。 ”。

我们创建了三个绑定：Q1绑定了绑定键“ * .orange。* ”，Q2 绑定了“ *。*。rabbit ”和“ lazy。＃ ”。

这些绑定可以概括为：

- Q1对所有橙色动物感兴趣。
- Q2希望听到关于兔子的一切，以及关于懒惰动物的一切。

路由密钥设置为“ quick.orange.rabbit ”的消息将传递到两个队列。消息“ lazy.orange.elephant ”也将同时发送给他们。另一方面，“ quick.orange.fox ”只会进入第一个队列，而“ lazy.brown.fox ”只会进入第二个队列。“ lazy.pink.rabbit ”将仅传递到第二个队列一次，即使它匹配两个绑定。“ quick.brown.fox ”与任何绑定都不匹配，因此它将被丢弃。

如果我们违反合同并发送带有一个或四个单词的消息，例如“ orange ”或“ quick.orange.male.rabbit”，会发生什么？好吧，这些消息将不匹配任何绑定，将丢失。

另一方面，“ lazy.orange.male.rabbit ”，即使它有四个单词，也会匹配最后一个绑定，并将被传递到第二个队列。

#### 主题交流

主题交换功能强大，可以像其他交易所一样。

当队列与“ ＃ ”（哈希）绑定密钥绑定时 - 它将接收所有消息，而不管路由密钥 - 如扇出交换。

当特殊字符“ * ”（星号）和“ ＃ ”（哈希）未在绑定中使用时，主题交换的行为就像直接交换一样

## 把它们放在一起

我们将在日志记录系统中使用主题交换。我们将首先假设日志的路由键有两个词：“ 。 ”。

EmitLogTopic.java

```java
import com.rabbitmq.client.BuiltinExchangeType;
import com.rabbitmq.client.Channel;
import com.rabbitmq.client.Connection;
import com.rabbitmq.client.ConnectionFactory;
public class EmitLogTopic {
    private static final String EXCHANGE_NAME = "topic_logs";
    public static void main(String[] argv) {
        Connection connection = null;
        Channel channel = null;
        try {
            ConnectionFactory factory = new ConnectionFactory();
            factory.setHost("localhost");
            connection = factory.newConnection();
            channel = connection.createChannel();
            channel.exchangeDeclare(EXCHANGE_NAME, BuiltinExchangeType.TOPIC);
            String routingKey = getRouting(argv);
            String message = getMessage(argv);
            channel.basicPublish(EXCHANGE_NAME, routingKey, null, message.getBytes("UTF-8"));
            System.out.println(" [x] Sent '" + routingKey + "':'" + message + "'");
        } catch (Exception e) {
            e.printStackTrace();
        } finally {
            if (connection != null) {
                try {
                    connection.close();
                } catch (Exception ignore) {
                }
            }
        }
    }
    private static String getRouting(String[] strings) {
        if (strings.length < 1)
            return "anonymous.info";
        return strings[0];
    }
    private static String getMessage(String[] strings) {
        if (strings.length < 2)
            return "Hello World!";
        return joinStrings(strings, " ", 1);
    }
    private static String joinStrings(String[] strings, String delimiter, int startIndex) {
        int length = strings.length;
        if (length == 0)
            return "";
        if (length < startIndex)
            return "";
        StringBuilder words = new StringBuilder(strings[startIndex]);
        for (int i = startIndex + 1; i < length; i++) {
            words.append(delimiter).append(strings[i]);
        }
        return words.toString();
    }
}
```

ReceiveLogsTopic.java

```java
import java.io.IOException;
import com.rabbitmq.client.AMQP;
import com.rabbitmq.client.BuiltinExchangeType;
import com.rabbitmq.client.Channel;
import com.rabbitmq.client.Connection;
import com.rabbitmq.client.ConnectionFactory;
import com.rabbitmq.client.Consumer;
import com.rabbitmq.client.DefaultConsumer;
import com.rabbitmq.client.Envelope;
public class ReceiveLogsTopic {
    private static final String EXCHANGE_NAME = "topic_logs";
      public static void main(String[] argv) throws Exception {
        ConnectionFactory factory = new ConnectionFactory();
        factory.setHost("localhost");
        Connection connection = factory.newConnection();
        Channel channel = connection.createChannel();
        channel.exchangeDeclare(EXCHANGE_NAME, BuiltinExchangeType.TOPIC);
        String queueName = channel.queueDeclare().getQueue();
        if (argv.length < 1) {
          System.err.println("Usage: ReceiveLogsTopic [binding_key]...");
          System.exit(1);
        }
        for (String bindingKey : argv) {
          channel.queueBind(queueName, EXCHANGE_NAME, bindingKey);
        }
        System.out.println(" [*] Waiting for messages. To exit press CTRL+C");
        Consumer consumer = new DefaultConsumer(channel) {
          @Override
          public void handleDelivery(String consumerTag, Envelope envelope,
                                     AMQP.BasicProperties properties, byte[] body) throws IOException {
            String message = new String(body, "UTF-8");
            System.out.println(" [x] Received '" + envelope.getRoutingKey() + "':'" + message + "'");
          }
        };
        channel.basicConsume(queueName, true, consumer);
      }
}
```
