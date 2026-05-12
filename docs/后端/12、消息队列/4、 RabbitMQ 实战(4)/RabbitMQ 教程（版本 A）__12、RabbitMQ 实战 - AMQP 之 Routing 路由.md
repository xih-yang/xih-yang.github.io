# 12、RabbitMQ 实战 - AMQP 之 Routing 路由
- 来源：https://ddkk.com/zhuanlan/mq/rabbitmq/4/12.html
- 分类：消息队列
- 分组：RabbitMQ 教程（版本 A）
在上一个教程中，我们构建了一个简单的fanout(扇出)交换。我们能够向许多接收者广播消息。

在本教程中，我们将为其添加一个功能 - 我们将只能订阅一部分消息。例如，我们将只能将消息指向感兴趣的特定颜色（“orange”，“black”，“green”），同时仍然能够在控制台上打印所有消息。

## 绑定

在前面的例子中，我们已经在创建绑定。您可以在我们的Tut3Config文件中调用这样的代码：

```java
@Bean
public Binding binding1(FanoutExchange fanout, 
    Queue autoDeleteQueue1) {
    return BindingBuilder.bind(autoDeleteQueue1).to(fanout);
}
```

绑定是交换和队列之间的关系。这可以简单地理解为：队列对来自此交换的消息感兴趣。

绑定可以采用额外的routingKey参数。Spring-amqp使用流畅的API来使这种关系非常清晰。我们将交换和队列传递到BindingBuilder，并简单地将队列绑定到交换机“与路由密钥”，如下所示：

```java
@Bean
public Binding binding1a(DirectExchange direct, 
    Queue autoDeleteQueue1) {
    return BindingBuilder.bind(autoDeleteQueue1)
        .to(direct)
        .with("orange");
}
```

绑定密钥的含义取决于交换类型。我们之前使用的 fanout 交换只是忽略了它的价值

## Direct exchange 直接交换

我们上一个教程中的消息系统向所有消费者广播所有消息。我们希望扩展它以允许根据颜色类型过滤消息。例如，我们可能需要一个程序将日志消息写入磁盘以仅接收严重错误，而不是在警告或信息日志消息上浪费磁盘空间。

我们使用的是fanout exchange(扇出交换)，它没有给我们太大的灵活性 - 它只能进行无意识的广播。

我们将使用direct exchange (直接交换)。direct change (直接交换) 背后的路由算法很简单 - 消息进入队列，其 绑定密钥与消息的路由密钥完全匹配。

为了说明这一点，请考虑以下设置：

在此设置中，我们可以看到direct exchange(直接交换) X与两个绑定到它的队列。第一个队列绑定orange绑定，第二个绑定有两个绑定，一个绑定密钥为黑色，另一个绑定为绿色。

在这样的设置中，使用路由密钥orange发布到exchange的消息 将被路由到队列Q1。路由键为black 或green 的消息将转到Q2。所有其他消息将被丢弃。

## 多个绑定

使用相同的绑定密钥绑定多个队列是完全合法的。在我们的例子中，我们可以在X和Q1之间添加绑定键black的绑定。

在这种情况下，direct exchange(直接交换)将表现得像fanout (扇出)一样，并将消息广播到所有匹配的队列。路由密钥为black的消息将传送到 Q1和Q2。

## 发布消息

我们将此模型用于我们的路由系统。我们会将消息发送给direct change (直接交换)，而不是fanout(扇出)。

我们将提供颜色作为路由键。这样接收程序将能够选择它想要接收（或订阅）的颜色。让我们首先关注发送消息。

与往常一样，我们在Tut4Config中进行一些Spring Boot 配置：

```java
@Bean
public FanoutExchange fanout() {
    return new FanoutExchange("tut.fanout");
}
```

我们已经准备好发送消息了。颜色，如图中所示，可以是“orange”，“black”或“green”之一。

## 订阅

接收消息将像上一个教程一样工作，但有一个例外 - 我们将为我们感兴趣的每种颜色创建一个新的绑定。这也适用于Tut4Config

```java
@Bean
public DirectExchange direct() {
    return new DirectExchange("tut.direct");
}
...
@Bean
public Binding binding1a(DirectExchange direct, 
    Queue autoDeleteQueue1) {
    return BindingBuilder.bind(autoDeleteQueue1)
        .to(direct)
        .with("orange");
}
```

## 放到一起

**配置类**

Tut4Config.java

```java
import org.springframework.amqp.core.*;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import com.xingyun.springamqp.business.Tut4Receiver;
import com.xingyun.springamqp.business.Tut4Sender;
@Profile({"tut4","routing"})
@Configuration
public class Tut4Config {
    @Bean
    public DirectExchange direct() {
        return new DirectExchange("tut.direct");
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
        public Binding binding1a(DirectExchange direct, 
            Queue autoDeleteQueue1) {
            return BindingBuilder.bind(autoDeleteQueue1)
                .to(direct)
                .with("orange");
        }
        @Bean
        public Binding binding1b(DirectExchange direct, 
            Queue autoDeleteQueue1) {
            return BindingBuilder.bind(autoDeleteQueue1)
                .to(direct)
                .with("black");
        }
        @Bean
        public Binding binding2a(DirectExchange direct,
            Queue autoDeleteQueue2) {
            return BindingBuilder.bind(autoDeleteQueue2)
                .to(direct)
                .with("green");
        }
        @Bean
        public Binding binding2b(DirectExchange direct, 
            Queue autoDeleteQueue2) {
            return BindingBuilder.bind(autoDeleteQueue2)
                .to(direct)
                .with("black");
        }
        @Bean
        public Tut4Receiver receiver() {
            return new Tut4Receiver();
        }
    }
    @Profile("sender")
    @Bean
    public Tut4Sender sender() {
        return new Tut4Sender();
    }
}
```

**生产者**

Tut4Sender.java

```java
import org.springframework.amqp.core.DirectExchange;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
public class Tut4Sender {
    @Autowired
    private RabbitTemplate template;
    @Autowired
    private DirectExchange direct;
    private int index;
    private int count;
    private final String[] keys = {"orange", "black", "green"};
    @Scheduled(fixedDelay = 1000, initialDelay = 500)
    public void send() {
        StringBuilder builder = new StringBuilder("Hello to ");
        if (++this.index == 3) {
            this.index = 0;
        }
        String key = keys[this.index];
        builder.append(key).append(' ');
        builder.append(Integer.toString(++this.count));
        String message = builder.toString();
        template.convertAndSend(direct.getName(), key, message);
        System.out.println(" [x] Sent '" + message + "'");
    }
}
```

**消费者**

Tut4Receiver.java

```java
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.util.StopWatch;
public class Tut4Receiver {
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
        System.out.println("instance " + receiver + " [x] Done in " + 
            watch.getTotalTimeSeconds() + "s");
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

看用法

```java
java -jar RabbitMQ_0x04_SpringAMQP_Routing_Sample-0.0.1-SNAPSHOT.jar
```

启动生产者

```java
java -jar RabbitMQ_0x04_SpringAMQP_Routing_Sample-0.0.1-SNAPSHOT.jar --spring.profiles.active=routing,sender
```

**启动消费者**

```java
java -jar RabbitMQ_0x04_SpringAMQP_Routing_Sample-0.0.1-SNAPSHOT.jar --spring.profiles.active=routing,receiver
```
