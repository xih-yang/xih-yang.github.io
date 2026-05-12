# 11、RabbitMQ 实战 - AMQP 之 Publish-Subscribe 发布和订阅
- 来源：https://ddkk.com/zhuanlan/mq/rabbitmq/4/11.html
- 分类：消息队列
- 分组：RabbitMQ 教程（版本 A）
在第一篇教程中，我们展示了如何使用start.spring.io来利用Spring Initializr创建一个具有RabbitMQ starter dependency的项目来创建spring-amqp应用程序。

在上一个教程中，我们创建了一个新的包（tut2）来放置我们的配置，发送者和接收者，并创建了一个包含两个使用者的工作队列。工作队列背后的假设是每个任务都交付给一个工作者。

在这部分中，我们将实现扇出模式，以向多个消费者传递消息。此模式称为 Publish/Subscribe “发布/订阅”，并通过在Tut3Config文件中配置多个bean来实现。

基本上，已发布的消息将被广播给所有接收者。

## Exchanges

在本教程的前几部分中，我们向队列发送消息和从队列接收消息。现在是时候在Rabbit中引入完整的消息传递模型了。

让我们快速回顾一下前面教程中介绍的内容：

- 甲*生产者*是发送消息的用户的应用程序。
- 甲*队列*是存储消息的缓冲器。
- 甲*消费者*是接收消息的用户的应用程序。

RabbitMQ中消息传递模型的核心思想是生产者永远不会将任何消息直接发送到队列。实际上，生产者通常甚至不知道消息是否会被传递到任何队列。

相反，生产者只能向*交易所*发送消息。Exchanges交换是一件非常简单的事情。一方面，它接收来自生产者的消息，另一方面将它们推送到队列。交易所必须确切知道如何处理收到的消息。它应该附加到特定队列吗？它应该附加到许多队列吗？或者它应该被丢弃。其规则由*交换类型*定义 。

有几种交换类型可供选择：

- **direct**
- **topic**
- **headers**
- **fanout**

我们将专注于最后一个 - fanout。让我们配置一个bean来描述这种类型的交换，并将其命名为tut.fanout：

Tut3Config.java

```java
import org.springframework.amqp.core.AnonymousQueue;
import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.FanoutExchange;
import org.springframework.amqp.core.Queue;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import com.xingyun.springamqp.business.Tut3Receiver;
import com.xingyun.springamqp.business.Tut3Sender;
@Profile({ "tut3", "pub-sub", "publish-subscribe" })
@Configuration
public class Tut3Config {
    @Bean
    public FanoutExchange fanout() {
        return new FanoutExchange("tut.fanout");
    }
    @Profile("receiver")
    private static class ReceiverConfig {
        @Bean
        public Queue autoDeleteQueue1() {
            return new AnonymousQueue();
        }
        @Bean
        public Queue autoDeleteQueue2() {
            return new AnonymousQueue();
        }
        @Bean
        public Binding binding1(FanoutExchange fanout, Queue autoDeleteQueue1) {
            return BindingBuilder.bind(autoDeleteQueue1).to(fanout);
        }
        @Bean
        public Binding binding2(FanoutExchange fanout, Queue autoDeleteQueue2) {
            return BindingBuilder.bind(autoDeleteQueue2).to(fanout);
        }
        @Bean
        public Tut3Receiver receiver() {
            return new Tut3Receiver();
        }
    }
    @Profile("sender")
    @Bean
    public Tut3Sender sender() {
        return new Tut3Sender();
    }
}
```

我们遵循与前两个教程相同的方法。我们创建了三个配置文件，即教程（“tut3”，“pub-sub”或“publish-subscribe”）。它们都是运行fanout 配置文件教程的同义词。

接下来，我们将FanoutExchange配置为bean。

在“接收器”（Tut3Receiver）文件中，我们定义“四个bean;

- 两个autoDeleteQueues或AnonymousQueues
- 以及两个绑定来将这些队列绑定到交换机。

fanout交换非常简单。正如您可能从名称中猜到的那样，它只是将收到的所有消息广播到它知道的所有队列中。而这正是我们传播信息所需要的。

> 列出交换
>
> 要列出服务器上的交换，您可以运行有用的rabbitmqctl：

```java
sudo rabbitmqctl list_exchanges
```

> 在此列表中将有一些amq。*交换和默认（未命名）交换。这些是默认创建的，但目前您不太可能需要使用它们。
>
> Nameless exchange 无名交换
>
> 在本教程的前几部分中，我们对交换一无所知，但仍能够向队列发送消息。这是可能的，因为我们使用的是默认交换，我们通过空字符串（“”）来识别。
>
> 回想一下我们之前是如何发布消息的：

```java
 template.convertAndSend（fanout.getName（），“”，message）;
```

> 第一个参数是自动装入发件人的交换的名称。空字符串表示默认或无名交换：消息被路由到具有routingKey指定名称的队列（如果存在）。

现在，我们可以发布到我们的命名交换：

```java
@Autowired
private RabbitTemplate template;
@Autowired
private FanoutExchange fanout;   // configured in Tut3Config above
template.convertAndSend(fanout.getName(), "", message);
```

从现在开始，fanout交换会将消息附加到我们的队列中。

## 临时队列

您可能还记得以前我们使用过具有特定名称的队列（记住你好）。能够命名队列对我们来说至关重要 - 我们需要将工作人员指向同一个队列。

当您想要在生产者和消费者之间共享队列时，为队列命名很重要。但我们的粉丝示例并非如此。

我们希望了解所有消息，而不仅仅是它们的一部分。我们也只对目前流动的消息感兴趣，而不是旧消息。要解决这个问题，我们需要两件事。

首先，每当我们连接到Rabbit时，我们都需要一个新的空队列。为此，我们可以使用随机名称创建队列，或者更好 - 让服务器为我们选择随机队列名称。

其次，一旦我们断开消费者，就应该自动删除队列。为了使用spring-amqp客户端，我们定义了*AnonymousQueue*，它创建了一个带有生成名称的非持久的独占自动删除队列：

```java
@Bean
public Queue autoDeleteQueue1() {
    return new AnonymousQueue();
}
@Bean
public Queue autoDeleteQueue2() {
    return new AnonymousQueue();
}
```

此时，我们的队列名称包含随机队列名称。例如，它可能看起来像amq.gen-JzTY20BRgKO-HjmUJj0wLg

## 绑定

我们已经创建了一个扇出交换和一个队列。现在我们需要告诉交换机将消息发送到我们的队列。交换和队列之间的关系称为*绑定*。

在上面的Tut3Config中，您可以看到我们有两个绑定，每个AnonymousQueue一个。

```java
@Bean
public Binding binding1(FanoutExchange fanout,
        Queue autoDeleteQueue1) {
    return BindingBuilder.bind(autoDeleteQueue1).to(fanout);
}
```

> 列出绑定
>
> 您可以使用，您猜对了，列出现有绑定

```java
rabbitmqctl list_bindings
```

## 把它们放在一起

发出消息的生产者程序与前一个教程没有太大的不同。

最重要的变化是我们现在想要将消息发布到我们的扇出交换而不是无名交换。

我们需要在发送时提供routingKey，但是对于扇出交换，它的值会被忽略。这里是tut3.Sender.java程序的代码 ：

```java
import org.springframework.amqp.core.FanoutExchange;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
public class Tut3Sender {
    @Autowired
    private RabbitTemplate template;
    @Autowired
    private FanoutExchange fanout;
    int dots = 0;
    int count = 0;
    @Scheduled(fixedDelay = 1000, initialDelay = 500)
    public void send() {
        StringBuilder builder = new StringBuilder("Hello");
        if (dots++ == 3) {
            dots = 1;
        }
        for (int i = 0; i < dots; i++) {
            builder.append('.');
        }
        builder.append(Integer.toString(++count));
        String message = builder.toString();
        template.convertAndSend(fanout.getName(), "", message);
        System.out.println(" [x] Sent '" + message + "'");
    }
}
```

如您所见，我们利用Tut3Config文件中的bean以及RabbitTemplate中的自动装配以及我们配置的FanoutExchange这一步是必要的，因为禁止发布到不存在的交换。

如果没有队列绑定到交换机，消息将会丢失，但这对我们没有问题; 如果没有消费者在听，我们可以安全地丢弃该消息。

**消费者**

Tut3Receiver.java

```java
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.util.StopWatch;
public class Tut3Receiver {
    @RabbitListener(queues = "#{autoDeleteQueue1.name}")
    public void receive1(String in) throws InterruptedException {
        receive(in, 1);
    }
    @RabbitListener(queues = "#{autoDeleteQueue2.name}")
    public void receive2(String in) throws InterruptedException {
        receive(in, 2);
    }
    public void receive(String in, int receiver) throws InterruptedException {
        StopWatch watch = new StopWatch();
        watch.start();
        System.out.println("instance " + receiver + " [x] Received '" + in + "'");
        doWork(in);
        watch.stop();
        System.out.println("instance " + receiver + " [x] Done in " + watch.getTotalTimeSeconds() + "s");
    }
    private void doWork(String in) throws InterruptedException {
        for (char ch : in.toCharArray()) {
            if (ch == '.') {
                Thread.sleep(1000);
            }
        }
    }
}
```

**查看用法**

```java
java -jar RabbitMQ_0x03_SpringAMQP_PublishSubscribe_Sample-0.0.1-SNAPSHOT.jar
```

这次和之前有所不同，这次消费者和生产者必须同时运行才得行。

消费者和生产者等待时间都是60秒

启动消费者

```java
java -jar RabbitMQ_0x03_SpringAMQP_PublishSubscribe_Sample-0.0.1-SNAPSHOT.jar --spring.profiles.active=pub-sub,receiver
```

显示效果如下：

启动生产者

```java
java -jar RabbitMQ_0x03_SpringAMQP_PublishSubscribe_Sample-0.0.1-SNAPSHOT.jar --spring.profiles.active=pub-sub,sender
```

显示效果如下：
