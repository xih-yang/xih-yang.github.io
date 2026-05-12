# 03、RabbitMQ 实战 - Java Client 之 "Hello World"（集成之基础模型）
- 来源：https://ddkk.com/zhuanlan/mq/rabbitmq/4/3.html
- 分类：消息队列
- 分组：RabbitMQ 教程（版本 A）
这些教程介绍了使用RabbitMQ创建消息传递应用程序的基础知识。您需要安装RabbitMQ服务器才能完成教程

## 1. 打造第一个Hello World 程序

> RabbitMQ是一个消息代理：它接受和转发消息。你可以把它想象成一个邮局：当你把你想要发布的邮件放在邮箱里时，你可以确定先生或女士邮递员最终将邮件发送给你的收件人。
>
> 在这个比喻中，RabbitMQ是邮政信箱，邮局和邮递员。
>
> RabbitMQ和邮局的主要区别在于它不处理纸张，而是接受，存储和转发二进制数据块 - 消息。

## 2 "Hello World"使用 Java 客户端

在本教程的这一部分中，我们将用Java编写两个程序; 一个发送单个消息的生产者，以及接收消息并将其打印出来的消费者。

我们将详细介绍Java API中的一些细节，专注于这个非常简单的事情，以便开始使用。 这是一个消息传递的“Hello World”。

在下图中，“P”是我们的生产者，“C”是我们的消费者。 中间的盒子是一个队列 - RabbitMQ代表消费者保存的消息缓冲区。

RabbitMQ 有许多不同语言的RabbitMQ客户端。 这里我们将使用RabbitMQ提供的Java客户端。

### 2.1 下载相关依赖Jar 包

下载[RabbitMQ提供的Java客户端](http://repo1.maven.org/maven2/com/rabbitmq/amqp-client/5.3.0/amqp-client-5.3.0.jar)以及它的依赖([SLF4J API](http://central.maven.org/maven2/org/slf4j/slf4j-api/1.7.21/slf4j-api-1.7.21.jar) and [SLF4J Simple](http://central.maven.org/maven2/org/slf4j/slf4j-simple/1.7.22/slf4j-simple-1.7.22.jar))

将这些文件复制到工作目录中，并跟着教程复制Java文件。

Tips:

> RabbitMQ Java客户端也位于中央Maven存储库中，其中包含groupId com.rabbitmq和artifactId amqp-client。
>
> 请注意SLF4J Simple对于教程来说已经足够了，但是您应该在生产环境中使用像Logback 这样的完整日志库。
>
> 关于Maven 等其他下载方式请移步
>
> Java Client
>
>
> On Maven Central: RabbitMQ Java client.
> Quick download: Binary | Source
> Javadoc
> All Java client downloads
> Older versions

### 2.2 编写代码

我们拥有Java客户端及其依赖关系，那么我们接下来开始写代码。

由于是学习使用RabbitMQ,我们这里使用 [STS](https://spring.io/tools/sts) 来写这个项目。

**1. 打开STS,新建一个名字叫做 RabbitMQ_HelloWorld_Sample 的 Java Project。**

**2. 新建一个叫做libs的文件夹，我们将上面三个jar 复制到我们的项目中，然后并添加依赖**

完成后项目结构如图所示

**3. 编写生产者类**

我们会打电话给我们的消息发布者（发送者）发送和我们的消息使用者（接收者）Recv。 发布者将连接到RabbitMQ，发送一条消息，然后退出

创建Send.java 文件，关于代码的讲解在注释里：

```java
import java.util.concurrent.TimeoutException;
import com.rabbitmq.client.Channel;
import com.rabbitmq.client.Connection;
import com.rabbitmq.client.ConnectionFactory;
public class Send {
    //设置消息队列的名称
    private final static String QUEUE_NAME="hello";
    public static void main(String[] args) throws java.io.IOException, TimeoutException{
        /**
         * 创建一个到RabbitMQ Server 的连接
         * 连接抽象出套接字连接，并为我们处理协议版本协商和身份验证等。 
         * 在这里，我们连接到本地机器上的代理 - 因此是本地主机。 
         * 如果我们想连接到另一台机器上的代理，我们只需在此指定其名称或IP地址。
         * */
        ConnectionFactory factory = new ConnectionFactory();
        factory.setHost("localhost");
        Connection connection = factory.newConnection();
        Channel channel = connection.createChannel();
        /**
         * 接下来我们创建一个Channel 对象，这是大部分用于完成任务的API驻留的地方。
         * 要想发送出去，我们必须声明一个队列来执行发送,那么我们可以将消息发布到队列中：
         * */
        channel.queueDeclare(QUEUE_NAME, false, false, false, null);
        String message = "Hello World!";
        //声明一个队列是幂等的 - 只有当它不存在时才会被创建。 
        //消息内容是一个字节数组，所以你可以编码任何你喜欢的地方。
        channel.basicPublish("", QUEUE_NAME, null, message.getBytes());
        System.out.println(" [x] Sent '" + message + "'");
        //最后我们关闭这些连接对象
        channel.close();
        connection.close();
    }
}
```

执行成功后你将看到这样的内容：

> Tips: ，
>
> 如果这是您第一次使用RabbitMQ，并且您没有看到“已发送”消息，那么您可能会抓住您的头脑，想知道会出现什么问题？
>
> 也许代理启动时没有足够的可用磁盘空间（默认情况下它至少需要200 MB空闲空间），因此拒绝接受消息。
>
> 检查代理日志文件以确认并在必要时减少限制。 配置文件文档将告诉你如何设置disk_free_limit。
>
> 还有一种可能是你的RabbitMQ 没有启动，执行下面命令再次尝试即可。

```java
 rabbitmq-service.bat start
```

**4. 编写消费者**

这就是我们的出版商。 我们的消费者推送来自RabbitMQ的消息，因此与发布单个消息的发布者不同，我们将继续运行以收听消息并将其打印出来。

创建一个Recv.java 文件，代码讲解在注释里面

```java
import com.rabbitmq.client.ConnectionFactory;
import com.rabbitmq.client.Connection;
import java.io.IOException;
import java.util.concurrent.TimeoutException;
import com.rabbitmq.client.AMQP;
import com.rabbitmq.client.Channel;
import com.rabbitmq.client.Consumer;
import com.rabbitmq.client.DefaultConsumer;
import com.rabbitmq.client.Envelope;
/**
 * 消费者
 * 额外的DefaultConsumer是一个实现Consumer接口的类，我们将使用它来缓存由服务器推送给我们的消息。
 * */
public class Recv {
     private final static  String QUEUE_NAME="hello";
     public static void main(String[] args) throws IOException, TimeoutException {
          /**
           * 设置与发布者相同; 
           * 我们打开一个连接和一个通道，并声明我们将要使用的队列。 
           * 请注意，这与发送发布到的队列相匹配
           * */
           ConnectionFactory factory = new ConnectionFactory();
            factory.setHost("localhost");
            Connection connection = factory.newConnection();
            Channel channel = connection.createChannel();
            /**
             * 请注意，我们也在这里声明队列。 
             * 因为我们可能会在发布者之前启动消费者，所以我们希望在我们尝试使用消息之前确保队列已存在。   
             * */
            channel.queueDeclare(QUEUE_NAME, false, false, false, null);
            System.out.println(" [*] Waiting for messages. To exit press CTRL+C");
            /**
             *  我们即将告诉服务器将队列中的消息传递给我们。
             *   由于它会异步推送消息，因此我们以对象的形式提供回调，该消息将缓冲消息，直到我们准备好使用它们。 
             *  这是一个DefaultConsumer子类的作用。
             * */
            Consumer consumer = new DefaultConsumer(channel) {
                  @Override
                  public void handleDelivery(String consumerTag, Envelope envelope,
                                             AMQP.BasicProperties properties, byte[] body)
                      throws IOException {
                    String message = new String(body, "UTF-8");
                    System.out.println(" [x] Received '" + message + "'");
                  }
                };
            channel.basicConsume(QUEUE_NAME, true, consumer);
    }
}
```

执行成功后

我们可以看到我们的消费者收到了消息队列生产者刚发布的消息。

本篇完~
