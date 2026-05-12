# 08、RabbitMQ 扇形模型 Fanout
- 来源：https://ddkk.com/zhuanlan/mq/rabbitmq/1/8.html
- 分类：消息队列
- 分组：RabbitMQ 教程（版本 A）
## 1、交换机

我们假设的是工作队列背后，每个任务都恰好交付给一个消费者(工作进程)。在这一部分中，我们将做一些完全不同的事情-我们将消息传达给多个消费者。这种模式称为 ”发布/订阅”.

为了说明这种模式，我们将构建一个简单的日志系统。它将由两个程序组成:第一个程序将发出日志消息，第二个程序是消费者。其中我们会启动两个消费者，其中一个消费者接收到消息后把日志存储在磁盘，另外一个消费者接收到消息后把消息打印在屏幕上，事实上第一个程序发出的日志消息将广播给所有消费者

## 2、Exchanges

RabbitMQ 消息传递模型的核心思想是: **生产者生产的消息从不会直接发送到队列**。实际上，通常生产者甚至都不知道这些消息传递传递到了哪些队列中。

相反，**生产者只能将消息发送到交换机(exchange)**，交换机工作的内容非常简单，一方面它接收来自生产者的消息，另一方面将它们推入队列。交换机必须确切知道如何处理收到的消息。是应该把这些消息放到特定队列还是说把他们到许多队列中还是说应该丢弃它们。这就的由交换机的类型来决定。

## 3、Exchanges 的类型

总共有以下类型：

直接(direct), 主题(topic) ,标题(headers) , 扇出(fanout)

### 3.1、无名 exchange

第一个参数是交换机的名称。空字符串表示默认或无名称交换机：消息能路由发送到队列中其实是由 routingKey(bindingkey)绑定 key 指定的，如果它存在的话

### 3.2、临时队列

每当我们连接到 Rabbit 时，我们都需要一个全新的空队列，为此我们可以创建一个具有随机名称的队列，或者能让服务器为我们选择一个随机队列名称那就更好了。其次一旦我们断开了消费者的连接，队列将被自动删除。

**创建临时队列的方式如下:**

```java
String queueName = channel.queueDeclare().getQueue();
```

### 3.3、绑定(bindings)

什么是bingding 呢，binding 其实是 exchange 和 queue 之间的桥梁，它告诉我们 exchange 和那个队列进行了绑定关系。比如说下面这张图告诉我们的就是 X 与 Q1 和 Q2 进行了绑定

fanout发布订阅模式

在广播模式下，消息发送流程是这样的：

- 可以有多个消费者
- 每个**消费者有自己的queue**（队列）
- 每个**队列都要绑定到Exchange**（交换机）
- **生产者发送的消息，只能发送到交换机**，交换机来决定要发给哪个队列，生产者无法决定。
- 交换机把消息发送给绑定过的所有队列
- 队列的消费者都能拿到消息。实现一条消息被多个消费者消费

## 4、代码实现

### 4.1、生产者

```java
package com.zww.spring.rabbitmq.five;
import com.rabbitmq.client.Channel;
import com.zww.spring.rabbitmq.utils.RabbitMQUtils;
import java.util.Scanner;
//生产者 发送消息
public class EmitLog {
    //交换机名称
    public static final String EXCHANGE_NAME = "logs";
    public static void main(String[] args) throws Exception {
        Channel channel = RabbitMQUtils.getChannel();
        //声明交换机
        channel.exchangeDeclare(EXCHANGE_NAME,"fanout");
        Scanner scanner = new Scanner(System.in);
        while (scanner.hasNext()){
            String message = scanner.next();
            channel.basicPublish(EXCHANGE_NAME,"",null,message.getBytes("UTF-8"));
            System.out.println("生产者发出消息" + message);
        }
    }
}
```

### 4.2、消费者一

```java
package com.zww.spring.rabbitmq.five;
import com.rabbitmq.client.Channel;
import com.rabbitmq.client.DeliverCallback;
import com.zww.spring.rabbitmq.utils.RabbitMQUtils;
//消息的接收方
public class ReceiveLogs01 {
    //交换机名称
    public static final String EXCHANGE_NAME = "logs";
    public static void main(String[] args) throws Exception {
        Channel channel = RabbitMQUtils.getChannel();
        //声明一个交换机
        channel.exchangeDeclare(EXCHANGE_NAME,"fanout");
        //声明一个临时队列
        /*
        * 声明一个临时队列，队列名称是随机的
        * 当消费者断开与队列的连接的时候，队列就会自动删除
        * */
        String queueName = channel.queueDeclare().getQueue();
        //绑定交换机与队列
        channel.queueBind(queueName,EXCHANGE_NAME,"");
        System.out.println("等待接收消息，把接收到的消息打印在屏幕上.......");
        //接收消息
        DeliverCallback deliverCallback = (consumerTag,message) ->{
            System.out.println("ReceiveLogs01控制台打印接收到的消息:"+ new String(message.getBody(),"UTF-8"));
        };
        channel.basicConsume(queueName,true,deliverCallback,consumerTag -> {});
    }
}
```

### 4.2、消费者二

```java
package com.zww.spring.rabbitmq.five;
import com.rabbitmq.client.Channel;
import com.rabbitmq.client.DeliverCallback;
import com.zww.spring.rabbitmq.utils.RabbitMQUtils;
//消息的接收方
public class ReceiveLogs02 {
    //交换机名称
    public static final String EXCHANGE_NAME = "logs";
    public static void main(String[] args) throws Exception {
        Channel channel = RabbitMQUtils.getChannel();
        //声明一个交换机
        channel.exchangeDeclare(EXCHANGE_NAME,"fanout");
        //声明一个临时队列
        /*
         * 声明一个临时队列，队列名称是随机的
         * 当消费者断开与队列的连接的时候，队列就会自动删除
         * */
        String queueName = channel.queueDeclare().getQueue();
        //绑定交换机与队列
        channel.queueBind(queueName,EXCHANGE_NAME,"");
        System.out.println("等待接收消息，把接收到的消息打印在屏幕上.......");
        //接收消息
        DeliverCallback deliverCallback = (consumerTag,message) ->{
            System.out.println("ReceiveLogs02控制台打印接收到的消息:"+ new String(message.getBody(),"UTF-8"));
        };
        channel.basicConsume(queueName,true,deliverCallback,consumerTag -> {});
    }
}
```

### 4.3、运行测试

> 版权声明：「DDKK.COM 弟弟快看，程序员编程资料站」本站文章，版权归原作者所有
