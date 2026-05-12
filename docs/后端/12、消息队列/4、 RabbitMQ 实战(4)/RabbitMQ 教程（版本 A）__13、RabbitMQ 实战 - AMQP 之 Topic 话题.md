# 13、RabbitMQ 实战 - AMQP 之 Topic 话题
- 来源：https://ddkk.com/zhuanlan/mq/rabbitmq/4/13.html
- 分类：消息队列
- 分组：RabbitMQ 教程（版本 A）
在上一个教程中，我们提高了消息传递的灵活 我们使用direct交换而不是使用仅能够进行虚拟广播的fanout交换，

并且获得了基于路由key 有选择地接收消息的可能性。

虽然使用direct 交换改进了我们的系统，但它仍然有局限性 - 它不能基于多个标准进行路由。

在我们的消息传递系统中，我们可能不仅要根据路由key订阅队列，还要根据生成消息的源来订阅队列.

为了在我们的日志记录系统中实现这种灵活性，我们需要了解更复杂的topic交换。

**Topic Exchange**

发送到topic 交换的消息不能具有任意 routing_key - 它必须是由点分隔的单词列表。单词可以是任何内容，但通常它们指定与消息相关的一些功能。一些有效的路由密钥示例：“ stock.usd.nyse ”，“ nyse.vmw ”，“ quick.orange.rabbit ”。路由密钥中可以包含任意数量的单词，最多可达255个字节。

绑定密钥也必须采用相同的形式。

topic 交换背后的逻辑 类似于direct 交换- 使用特定路由key发送的消息将被传递到与匹配绑定key绑定的所有队列。但是，绑定键有两个重要的特殊情况：

- *（星号）可以替代一个单词。
- ＃（hash）可以替换零个或多个单词。

在一个例子中解释这个是最容易的：

在这个例子中，我们将发送所有描述动物的消息。

消息将与包含三个单词（两个点）的路由键一起发送。路由键中的第一个单词将描述速度，第二个是颜色，第三个是物种：

..

我们创建了三个绑定

- Q1 .orange.*
- Q2 *.*.rabbit" and "lazy.#

这些绑定可以概括为：

- Q1对所有orange橙色动物感兴趣。
- Q2希望听到关于rabbit兔子的一切，以及关于lazy懒惰动物的一切。

路由密钥设置为“ quick.orange.rabbit ”的消息将传递到两个队列。

消息“lazy.orange.elephant ”也将同时发送给他们。

另一方面，“ quick.orange.fox ”只会进入第一个队列，而“ lazy.brown.fox ”只会进入第二个队列。

“lazy.pink.rabbit ”将仅传递到第二个队列一次，即使它匹配两个绑定。

“quick.brown.fox ”与任何绑定都不匹配，因此它将被丢弃。

如果我们违反约定并发送带有一个或四个单词的消息，例如“ orange ”或“ quick.orange.male.rabbit”，会发生什么？好吧，这些消息将不匹配任何绑定，将丢失。

另一方面，“ lazy.orange.male.rabbit ”，即使它有四个单词，也会匹配最后一个绑定，并将被传递到第二个队列。

> Topic Exchange
>
> topic exchange 功能强大，可以像其他exchange一样。
>
> 当队列与“ ＃ ”（哈希）绑定密钥绑定时 - 它将接收所有消息，而不管路由密钥 - 如扇出交换。
>
> 当特殊字符“ * ”（星号）和“ ＃ ”（哈希）未在绑定中使用时，主题交换的行为就像直接交换一样

## 放在一起

主类

```java
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Profile;
import org.springframework.scheduling.annotation.EnableScheduling;
import com.xingyun.springamqp.config.RabbitAmqpTutorialsRunner;
@SpringBootApplication
@EnableScheduling
public class RabbitMq0x05SpringAmqpTopicSampleApplication {
    public static void main(String[] args) {
        SpringApplication.run(RabbitMq0x05SpringAmqpTopicSampleApplication.class, args);
    }
    @Profile("usage_message")
    @Bean
    public CommandLineRunner usage() {
        return new CommandLineRunner() {
            @Override
            public void run(String... arg0) throws Exception {
                System.out.println("This app uses Spring Profiles to control its behavior.\n");
                System.out.println("Sample usage: java -jar "
                        + "RabbitMQ_0x05_SpringAMQP_Topic_Sample-0.0.1-SNAPSHOT.jar "
                        + "--spring.profiles.active=topics"
                        + ",sender");
            }
        };
    }
    @Profile("!usage_message")
    @Bean
    public CommandLineRunner tutorial() {
        return new RabbitAmqpTutorialsRunner();
    }
}
```

Tut5Config.java

```java
import org.springframework.amqp.core.*;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import com.xingyun.springamqp.business.Tut5Receiver;
import com.xingyun.springamqp.business.Tut5Sender;
@Profile({"tut5","topics"})
@Configuration
public class Tut5Config {
    @Bean
    public TopicExchange topic() {
        return new TopicExchange("tut.topic");
    }
    @Profile("receiver")
    private static class ReceiverConfig {
        @Bean
        public Tut5Receiver receiver() {
            return new Tut5Receiver();
        }
        @Bean
        public Queue autoDeleteQueue1() {
            return new AnonymousQueue();
        }
        @Bean
        public Queue autoDeleteQueue2() {
            return new AnonymousQueue();
        }
        @Bean
        public Binding binding1a(TopicExchange topic, 
            Queue autoDeleteQueue1) {
            return BindingBuilder.bind(autoDeleteQueue1)
                .to(topic)
                .with("*.orange.*");
        }
        @Bean
        public Binding binding1b(TopicExchange topic, 
            Queue autoDeleteQueue1) {
            return BindingBuilder.bind(autoDeleteQueue1)
                .to(topic)
                .with("*.*.rabbit");
        }
        @Bean
        public Binding binding2a(TopicExchange topic, 
            Queue autoDeleteQueue2) {
            return BindingBuilder.bind(autoDeleteQueue2)
                .to(topic)
                .with("lazy.#");
        }
    }
    @Profile("sender")
    @Bean
    public Tut5Sender sender() {
        return new Tut5Sender();
    }
}
```

RabbitAmqpTutorialsRunner.java

```java
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.ConfigurableApplicationContext;
public class RabbitAmqpTutorialsRunner implements CommandLineRunner {
    /**
     * application.properties文件中配置tutorial.client.duration=10000 需要
     * */
    @Value("${tutorial.client.duration:0}")
    private int duration;
    @Autowired
    private ConfigurableApplicationContext ctx;
    @Override
    public void run(String... args) throws Exception {
        // TODO Auto-generated method stub
        System.out.println("Ready ... running for " + duration + "ms");
        Thread.sleep(duration);
        ctx.close();
    }
}
```

Tut5Sender.java

```java
import org.springframework.amqp.core.TopicExchange;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
public class Tut5Sender {
    @Autowired
    private RabbitTemplate template;
    @Autowired
    private TopicExchange topic;
    private int index;
    private int count;
    private final String[] keys = {"quick.orange.rabbit", 
            "lazy.orange.elephant", "quick.orange.fox",
            "lazy.brown.fox", "lazy.pink.rabbit", "quick.brown.fox"};
    @Scheduled(fixedDelay = 1000, initialDelay = 500)
    public void send() {
        StringBuilder builder = new StringBuilder("Hello to ");
        if (++this.index == keys.length) {
            this.index = 0;
        }
        String key = keys[this.index];
        builder.append(key).append(' ');
        builder.append(Integer.toString(++this.count));
        String message = builder.toString();
        template.convertAndSend(topic.getName(), key, message);
        System.out.println(" [x] Sent '" + message + "'");
    }
}
```

Tut5Receiver.java

```java
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.util.StopWatch;
public class Tut5Receiver {
    @RabbitListener(queues = "#{autoDeleteQueue1.name}")
    public void receive1(String in) throws InterruptedException {
        receive(in, 1);
    }
    @RabbitListener(queues = "#{autoDeleteQueue2.name}")
    public void receive2(String in) throws InterruptedException {
        receive(in, 2);
    }
    public void receive(String in, int receiver) throws 
        InterruptedException {
        StopWatch watch = new StopWatch();
        watch.start();
        System.out.println("instance " + receiver + " [x] Received '" 
            + in + "'");
        doWork(in);
        watch.stop();
        System.out.println("instance " + receiver + " [x] Done in " 
            + watch.getTotalTimeSeconds() + "s");
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

查看用法

```java
java -jar RabbitMQ_0x05_SpringAMQP_Topic_Sample-0.0.1-SNAPSHOT.jar
```

启动生产者

```java
java -jar RabbitMQ_0x05_SpringAMQP_Topic_Sample-0.0.1-SNAPSHOT.jar --spring.profiles.active=topics,sender
```

启动消费者

```java
java -jar RabbitMQ_0x05_SpringAMQP_Topic_Sample-0.0.1-SNAPSHOT.jar --spring.profiles.active=topics,receiver
```
