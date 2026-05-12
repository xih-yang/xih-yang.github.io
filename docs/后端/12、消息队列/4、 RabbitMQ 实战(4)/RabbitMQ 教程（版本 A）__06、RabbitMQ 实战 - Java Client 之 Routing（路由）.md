# 06、RabbitMQ 实战 - Java Client 之 Routing（路由）
- 来源：https://ddkk.com/zhuanlan/mq/rabbitmq/4/6.html
- 分类：消息队列
- 分组：RabbitMQ 教程（版本 A）
在上篇博文 [译:3.RabbitMQ 之Publish/Subscribe（发布和订阅）](https://www.cnblogs.com/xingyunblog/p/9673584.html) 我们构建了一个简单的日志系统 我们能够向许多接收者广播日志消息。

在本篇博文中，我们将为其添加一个功能 - 我们将只能订阅一部分消息。 例如，我们只能将关键错误消息定向到日志文件（以节省磁盘空间），同时仍然能够在控制台上打印所有日志消息。

## Bindings 绑定

在前面的例子中，我们已经在创建绑定。您可能会记得以下代码：

```java
channel.queueBind(queueName, EXCHANGE_NAME, "");
```

绑定是交换和队列之间的关系。这可以简单地理解为：队列对来自此交换的消息感兴趣。

绑定可以采用额外的routingKey参数。为了避免与basic_publish参数混淆，我们将其称为 绑定密钥。这就是我们如何使用键创建绑定：

```java
channel.queueBind（queueName，EXCHANGE_NAME，“black”）;
```

绑定密钥的含义取决于交换类型。我们之前使用的 扇出交换只是忽略了它的价值。

## Direct exchange 直接交换

我们上一个教程中的日志记录系统向所有消费者广播所有消息。我们希望扩展它以允许根据消息的严重性过滤消息。例如，我们可能需要一个程序将日志消息写入磁盘以仅接收严重错误，而不是在警告或信息日志消息上浪费磁盘空间。

我们使用的是扇出交换，它没有给我们太大的灵活性 - 它只能进行无意识的广播。

我们将使用直接交换。直接交换背后的路由算法很简单 - 消息进入队列，其 绑定密钥与消息的路由密钥完全匹配。

为了说明这一点，请考虑以下设置：

在此设置中，我们可以看到直接交换X与两个绑定到它的队列。第一个队列绑定orange 绑定，第二个绑定有两个绑定，一个绑定密钥为black，另一个绑定为green。

在这样的设置中，使用路由密钥orange发布到交换机的消息 将被路由到队列Q1。路由键为black 或green的消息将转到Q2。所有其他消息将被丢弃。

## Multiple bindings 多个绑定

使用相同的绑定密钥绑定多个队列是完全合法的。

在我们的例子中，我们可以在X和Q1之间添加绑定键黑色的绑定。

在这种情况下， direct 直接交换将表现得像 fanout一样，并将消息广播到所有匹配的队列。路由密钥为black的消息将传送到 Q1和Q2。

## Emitting logs 发送日志

我们将此模型用于我们的日志系统。我们会将消息发送给直接交换，而不是扇出。

我们将提供日志严重性作为路由密钥。这样接收程序将能够选择它想要接收的严重性。

让我们首先关注发送日志。一如既往，我们需要先创建一个交换：

```java
channel.exchangeDeclare(EXCHANGE_NAME, "direct");
```

我们已准备好发送消息：

```java
channel.basicPublish(EXCHANGE_NAME, severity, null, message.getBytes());
```

为简化起见，我们假设“严重性”可以是“信息”，“警告”，“错误”之一。

## Subscribing 订阅

接收消息将像上一个教程一样工作，但有一个例外 - 我们将为我们感兴趣的每个严重性创建一个新的绑定。

```java
String queueName = channel.queueDeclare().getQueue();
for(String severity : argv){
  channel.queueBind(queueName, EXCHANGE_NAME, severity);
}
```

## Putting it all together 放到一起来看

EmitLogDirect.java：

```java
import com.rabbitmq.client.BuiltinExchangeType;
import com.rabbitmq.client.Channel;
import com.rabbitmq.client.Connection;
import com.rabbitmq.client.ConnectionFactory;
public class EmitLogDirect {
    private static final String EXCHANGE_NAME = "direct_logs";
    public static void main(String[] argv) throws Exception {
        ConnectionFactory factory = new ConnectionFactory();
        factory.setHost("localhost");
        Connection connection = factory.newConnection();
        Channel channel = connection.createChannel();
        channel.exchangeDeclare(EXCHANGE_NAME, BuiltinExchangeType.DIRECT);
        String severity = getSeverity(argv);
        String message = getMessage(argv);
        channel.basicPublish(EXCHANGE_NAME, severity, null, message.getBytes("UTF-8"));
        System.out.println(" [x] Sent '" + severity + "':'" + message + "'");
        channel.close();
        connection.close();
    }
    private static String getSeverity(String[] strings) {
        if (strings.length < 1)
            return "info";
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

ReceiveLogsDirect.java

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
public class ReceiveLogsDirect {
    private static final String EXCHANGE_NAME = "direct_logs";
    public static void main(String[] argv) throws Exception {
        ConnectionFactory factory = new ConnectionFactory();
        factory.setHost("localhost");
        Connection connection = factory.newConnection();
        Channel channel = connection.createChannel();
        channel.exchangeDeclare(EXCHANGE_NAME, BuiltinExchangeType.DIRECT);
        String queueName = channel.queueDeclare().getQueue();
        if (argv.length < 1) {
            System.err.println("Usage: ReceiveLogsDirect [info] [warning] [error]");
            System.exit(1);
        }
        for (String severity : argv) {
            channel.queueBind(queueName, EXCHANGE_NAME, severity);
        }
        System.out.println(" [*] Waiting for messages. To exit press CTRL+C");
        Consumer consumer = new DefaultConsumer(channel) {
            @Override
            public void handleDelivery(String consumerTag, Envelope envelope, AMQP.BasicProperties properties,
                    byte[] body) throws IOException {
                String message = new String(body, "UTF-8");
                System.out.println(" [x] Received '" + envelope.getRoutingKey() + "':'" + message + "'");
            }
        };
        channel.basicConsume(queueName, true, consumer);
    }
}
```
