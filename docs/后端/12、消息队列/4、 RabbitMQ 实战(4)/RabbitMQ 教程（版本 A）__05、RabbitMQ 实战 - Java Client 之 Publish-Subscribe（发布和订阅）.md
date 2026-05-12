# 05、RabbitMQ 实战 - Java Client 之 Publish-Subscribe（发布和订阅）
- 来源：https://ddkk.com/zhuanlan/mq/rabbitmq/4/5.html
- 分类：消息队列
- 分组：RabbitMQ 教程（版本 A）
在上篇[RabbitMQ 之Work Queues (工作队列)](https://www.cnblogs.com/xingyunblog/p/9670218.html)教程中，我们创建了一个工作队列，工作队列背后的假设是每个任务都交付给一个工作者。

在这一部分，我们将做一些完全不同的事情 - 我们将向多个消费者传递信息。此模式称为“发布/订阅”。

为了说明这种模式，我们将构建一个简单的日志记录系统。

它将包含两个程序 - 第一个将发出日志消息，第二个将接收和打印它们。

在我们的日志记录系统中，接收程序的每个运行副本都将获取消息。

这样我们就可以运行一个接收器并将日志定向到磁盘; 同时我们将能够运行另一个接收器并在屏幕上看到日志。

基本上，发布的日志消息将被广播给所有接收者。

## Exchanges 交换

在本教程的前几部分中，我们向队列发送消息和从队列接收消息。现在是时候在Rabbit中引入完整的消息传递模型了。

让我们快速回顾一下前面教程中介绍的内容：

- *生产者*是发送消息的用户的应用程序。
- *队列*是存储消息的缓冲器。
- *消费者*是接收消息的用户的应用程序。

RabbitMQ中消息传递模型的核心思想是生产者永远不会将任何消息直接发送到队列。实际上，生产者通常甚至不知道消息是否会被传递到任何队列。

相反，生产者只能向交换器发送消息。交换是一件非常简单的事情。一方面，它接收来自生产者的消息，另一方面将它们推送到队列。

交换所必须确切知道如何处理收到的消息。它应该附加到特定队列吗？它应该附加到许多队列吗？或者它应该被丢弃。其规则由*交换类型*定义 。

Tips: 可以看出，这节课我们多了一个Exchanges ，生产者产生的消息将不再直接发送给队列，而是由Exchange来处理这件事情。

有几种交换类型可供选择：direct, topic, headers and fanout. 我们将专注于最后这个-- fanout.

让我们创建一个这种类型的交换，并将其称为日志：

```java
channel.exchangeDeclare（“logs”，“fanout”）;
```

fanout (扇出交换)非常简单。 正如您可能从名称中猜到的那样，它只是将收到的所有消息广播到它知道的所有队列中。而这正是我们记录器所需要的。

#### Listing exchanges

要列出服务器上的交换，您可以运行有用的rabbitmqctl：

Linux 执行下列命令

```java
sudo rabbitmqctl list_exchanges
```

Windows 执行下列命令

```java
rabbitmqctl list_exchanges
```

在这个列表中有一些 amq.* exchanges（交换） 和一些默认的 (没有命名的) exchange（交换）

他们是默认创建的，但是你可能不需要使用他们现在。

#### Nameless exchange 无名交换

在本教程的前几部分中，我们对交换一无所知，但仍能够向队列发送消息。 这是可能的，因为我们使用的是默认交换，我们通过空字符串（“”）来识别。

回想一下我们之前是如何发布消息的：

```java
channel.basicPublish("", "hello", null, message.getBytes());
```

第一个参数是交换的名称。 空字符串表示默认或无名交换：消息被路由到具有routingKey指定名称的队列（如果存在）

现在，我们可以发布到我们的命名交换：

```java
channel.basicPublish( "logs", "", null, message.getBytes());
```

**Temporary queues** 临时队列

您可能还记得以前我们使用的是具有指定名称的队列（请记住hello和task_queue？）。

能够命名队列对我们来说至关重要 - 我们需要将工作人员指向同一个队列。当您想要在生产者和消费者之间共享队列时，为队列命名很重要。

但我们的记录器并非如此。我们希望了解所有日志消息，而不仅仅是它们的一部分。我们也只对目前流动的消息感兴趣，而不是旧消息。要解决这个问题，我们需要两件事。

首先，每当我们连接到Rabbit时，我们都需要一个新的空队列。为此，我们可以使用随机名称创建队列，或者更好 - 让服务器为我们选择随机队列名称。

其次，一旦我们断开消费者，就应该自动删除队列。

在Java客户端中，当我们没有向queueDeclare（）提供参数时，我们 使用生成的名称创建一个非持久的，独占的自动删除队列：

```java
String queueName = channel.queueDeclare().getQueue();
```

你也可以学习更多关于 exclusive flag和其他队列属性 在 [guide on queues](http://www.rabbitmq.com/queues.html).

此时，queueName包含一个随机队列名称。例如，它可能看起来像amq.gen-JzTY20BRgKO-HjmUJj0wLg。

## Bindings 绑定

我们已经创建了一个扇出交换和一个队列。

现在我们需要告诉交换机将消息发送到我们的队列。交换和队列之间的关系称为*绑定*。

```java
channel.queueBind(queueName, "logs", "");
```

从现在开始，日志交换会将消息附加到我们的队列中。

#### Listing bindings 列出绑定列表

```java
rabbitmqctl list_bindings
```

## Putting it all together 整体看下

生成日志消息的生产者程序与前一个教程没有太大的不同。

最重要的变化是我们现在想要将消息发布到我们的日志交换而不是无名交换。

> Tips:
>
> 这里简单谈下我的理解：
>
> 假设P是我们平时工作的领导，X是秘书（某任务自动分配系统），C1 是员工张三，C2 是员工李四，
>
> 领导制定（发布）好任务列表后，交给秘书（X, 任务分配系统（Exchange）），秘书（X, 任务分配 系统Exchange）将任务发送到这两个邮箱（消息队列）中即可。
>
> 张三，李四都绑定（订阅）了不同的邮箱（不同的队列名称），那么张三和李四取消息便从自己绑定的邮箱（队列）中取即可。
>
> 上篇博文中的工作队列所谓的无名交换可以理解为没有秘书（exchange）这个角色，而且共用同一个消息队列，如此而已。

我们需要在发送时提供routingKey，但是对于扇出交换，它的值会被忽略。这里是EmitLog.java程序的代码 ：

```java
import com.rabbitmq.client.BuiltinExchangeType;
import com.rabbitmq.client.Channel;
import com.rabbitmq.client.Connection;
import com.rabbitmq.client.ConnectionFactory;
public class EmitLog {
    private static final String EXCHANGE_NAME = "logs";
    public static void main(String[] argv) throws Exception {
        ConnectionFactory factory = new ConnectionFactory();
        factory.setHost("localhost");
        Connection connection = factory.newConnection();
        Channel channel = connection.createChannel();
        channel.exchangeDeclare(EXCHANGE_NAME, BuiltinExchangeType.FANOUT);
        String message = getMessage(argv);
        channel.basicPublish(EXCHANGE_NAME,"", null, message.getBytes("UTF-8"));
        System.out.println(" [x] Sent '" + message + "'");
        channel.close();
        connection.close();
    }
    private static String getMessage(String[] strings) {
        if (strings.length < 1)
            return "info: Hello World!";
        return joinStrings(strings, " ");
    }
    private static String joinStrings(String[] strings, String delimiter) {
        int length = strings.length;
        if (length == 0)
            return "";
        StringBuilder words = new StringBuilder(strings[0]);
        for (int i = 1; i < length; i++) {
            words.append(delimiter).append(strings[i]);
        }
        return words.toString();
    }
}
```

如您所见，在建立连接后我们宣布了交换。此步骤是必要的，因为禁止发布到不存在的交换。

如果没有队列绑定到交换机，消息将会丢失，但这对我们没有问题; 如果没有消费者在听，我们可以安全地丢弃该消息。

ReceiveLogs.java的代码：

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
public class ReceiveLogs {
    private static final String EXCHANGE_NAME = "logs";
    public static void main(String[] argv) throws Exception {
        ConnectionFactory factory = new ConnectionFactory();
        factory.setHost("localhost");
        Connection connection = factory.newConnection();
        Channel channel = connection.createChannel();
        channel.exchangeDeclare(EXCHANGE_NAME, BuiltinExchangeType.FANOUT);
        String queueName = channel.queueDeclare().getQueue();
        channel.queueBind(queueName, EXCHANGE_NAME, "");
        System.out.println(" [*] Waiting for messages. To exit press CTRL+C");
        Consumer consumer = new DefaultConsumer(channel) {
            @Override
            public void handleDelivery(String consumerTag, Envelope envelope, AMQP.BasicProperties properties,
                    byte[] body) throws IOException {
                String message = new String(body, "UTF-8");
                System.out.println(" [x] Received '" + message + "'");
            }
        };
        channel.basicConsume(queueName, true, consumer);
    }
}
```

使用rabbitmqctl list_bindings，您可以验证代码是否实际创建了我们想要的绑定和队列。

```java
rabbitmqctl list_bindings
```

运行两个ReceiveLogs.java程序时，您应该看到如下内容：

Tips: amq.gen-JzTY20BRgKO-HjmUJj0wLg 是随机生成的队列名称。

本篇完~
