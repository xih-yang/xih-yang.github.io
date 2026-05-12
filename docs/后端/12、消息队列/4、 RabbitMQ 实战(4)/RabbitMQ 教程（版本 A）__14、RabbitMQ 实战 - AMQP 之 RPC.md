# 14、RabbitMQ 实战 - AMQP 之 RPC
- 来源：https://ddkk.com/zhuanlan/mq/rabbitmq/4/14.html
- 分类：消息队列
- 分组：RabbitMQ 教程（版本 A）
## Remote procedure call (RPC)

在第二篇教程中，我们学习了如何使用*工作队列*在多个工作人员之间分配耗时的任务。

但是如果我们需要在远程计算机上运行一个函数并等待结果呢？嗯，这是一个不同的故事。此模式通常称为*远程过程调用*或*RPC*。

在本教程中，我们将使用RabbitMQ构建RPC系统：客户端和可伸缩的RPC服务器。

由于我们没有任何值得分发的耗时任务，我们将创建一个返回Fibonacci数字的虚拟RPC服务。

### 客户端界面

为了说明如何使用RPC服务，我们将从“Sender”和“Receiver to”Client“和”Server“更改我们的配置文件的名称。当我们调用服务器时，我们将返回参数的fibonacci我们打电话给。

```java
Integer response = (Integer) template.convertSendAndReceive
    (exchange.getName(), "rpc", start++);
System.out.println(" [.] Got '" + response + "'");
```

> 关于RPC的说明
>
> 尽管RPC在计算中是一种非常常见的模式，但它经常受到批评。当程序员不知道函数调用是本地的还是慢的RPC时，会出现问题。这样的混淆导致系统不可预测，并增加了调试的不必要的复杂性。错误使用RPC可以导致不可维护的代码，而不是简化软件。
>
> 考虑到这一点，请考虑以下建议：
>
>
> 确保明显哪个函数调用是本地的，哪个是远程的。
> 记录您的系统。使组件之间的依赖关系变得清晰。
> 处理错误案例。当RPC服务器长时间停机时，客户端应该如何反应？
>
> 如有疑问，请避免使用RPC。如果可以，您应该使用异步管道 - 而不是类似RPC的阻塞，将结果异步推送到下一个计算阶段。

### 回调队列

一般来说，通过RabbitMQ进行RPC很容易。客户端发送请求消息，服务器回复响应消息。为了接收响应，我们需要发送带有请求的“回调”队列地址。当我们使用上面的'convertSendAndReceive（）'方法时，Spring-amqp的RabbitTemplate为我们处理回调队列。使用RabbitTemplate时无需进行任何其他设置。有关详细说明，请参阅请求/回复消息。

> 消息属性
>
> AMQP 0-9-1协议预定义了一组带有消息的14个属性。大多数属性很少使用，但以下情况除外：
>
>
> deliveryMode：将消息标记为持久性（值为2）或瞬态（任何其他值）。您可能会记住第二个教程中的这个属性。
> contentType：用于描述编码的mime类型。例如，对于经常使用的JSON编码，将此属性设置为：application / json是一种很好的做法。
> replyTo：通常用于命名回调队列。
> correlationId：用于将RPC响应与请求相关联。

### 相关ID

Spring-amqp允许您专注于您正在使用的消息样式，并隐藏支持此样式所需的消息管道的详细信息。例如，通常本机客户端会为每个RPC请求创建一个回调队列。这非常低效，因此另一种方法是为每个客户端创建一个回调队列。

这引发了一个新问题，在该队列中收到响应后，不清楚响应属于哪个请求。那是在使用correlationId属性的时候 。Spring-amqp会自动为每个请求设置一个唯一值。此外，它还处理将响应与正确的correlationID匹配的详细信息。

spring-amqp使rpc样式更容易的一个原因是，有时您可能希望忽略回调队列中的未知消息，而不是失败并出现错误。这是由于服务器端可能存在竞争条件。虽然不太可能，但RPC服务器可能会在向我们发送答案之后，但在发送请求的确认消息之前死亡。如果发生这种情况，重新启动的RPC服务器将再次处理请求。spring-amqp客户端优雅地处理重复的响应，理想情况下RPC应该是幂等的。

### 摘要

我们的RPC将这样工作：

- Tut6Config将设置一个新的DirectExchange和一个客户端
- 客户端将利用convertSendAndReceive传递交换名称，routingKey和消息。
- 请求被发送到rpc_queue（“tut.rpc”）队列。
- RPC worker（aka：server）正在等待该队列上的请求。当请求出现时，它执行任务并使用来自replyTo字段的队列将带有结果的消息发送回客户端。
- 客户端等待回调队列上的数据。出现消息时，它会检查correlationId属性。如果它与请求中的值匹配，则返回对应用程序的响应。同样，这是通过RabbitTemplate自动完成的。

## 整体来看

启动类RabbitMq0x06SpringAmqpRpcSampleApplication.java

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
public class RabbitMq0x06SpringAmqpRpcSampleApplication {
    public static void main(String[] args) {
        SpringApplication.run(RabbitMq0x06SpringAmqpRpcSampleApplication.class, args);
    }
    @Profile("usage_message")
    @Bean
    public CommandLineRunner usage() {
        return new CommandLineRunner() {
            @Override
            public void run(String... arg0) throws Exception {
                System.out.println("This app uses Spring Profiles to control its behavior.\n");
                System.out.println("Sample usage: java -jar "
                        + "RabbitMQ_0x06_SpringAMQP_RPC_Sample-0.0.1-SNAPSHOT.jar "
                        + "--spring.profiles.active=rpc"
                        + ",server");
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

启动辅助类RabbitAmqpTutorialsRunner.java

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

配置类

```java
import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.DirectExchange;
import org.springframework.amqp.core.Queue;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import com.xingyun.springamqp.business.Tut6Client;
import com.xingyun.springamqp.business.Tut6Server;
@Profile({ "tut6", "rpc" })
@Configuration
public class Tut6Config {
    @Profile("client")
    private static class ClientConfig {
        @Bean
        public DirectExchange exchange() {
            return new DirectExchange("tut.rpc");
        }
        @Bean
        public Tut6Client client() {
            return new Tut6Client();
        }
    }
    @Profile("server")
    private static class ServerConfig {
        @Bean
        public Queue queue() {
            return new Queue("tut.rpc.requests");
        }
        @Bean
        public DirectExchange exchange() {
            return new DirectExchange("tut.rpc");
        }
        @Bean
        public Binding binding(DirectExchange exchange, Queue queue) {
            return BindingBuilder.bind(queue).to(exchange).with("rpc");
        }
        @Bean
        public Tut6Server server() {
            return new Tut6Server();
        }
    }
}
```

Server 端

```java
import org.springframework.amqp.rabbit.annotation.RabbitListener;
public class Tut6Server {
    @RabbitListener(queues = "tut.rpc.requests")
    // @SendTo("tut.rpc.replies") used when the 
    // client doesn't set replyTo.
    public int fibonacci(int n) {
        System.out.println(" [x] Received request for " + n);
        int result = fib(n);
        System.out.println(" [.] Returned " + result);
        return result;
    }
    public int fib(int n) {
        return n == 0 ? 0 : n == 1 ? 1 : (fib(n - 1) + fib(n - 2));
    }
}
```

Client 端

```java
import org.springframework.amqp.core.DirectExchange;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
public class Tut6Client {
    @Autowired
    private RabbitTemplate template;
    @Autowired
    private DirectExchange exchange;
    int start = 0;
    @Scheduled(fixedDelay = 1000, initialDelay = 500)
    public void send() {
        System.out.println(" [x] Requesting fib(" + start + ")");
        Integer response = (Integer) template.convertSendAndReceive
            (exchange.getName(), "rpc", start++);
        System.out.println(" [.] Got '" + response + "'");
    }
}
```

### 查看用法

```java
java -jar RabbitMQ_0x06_SpringAMQP_RPC_Sample-0.0.1-SNAPSHOT.jar
```

Client 端

```java
java -jar RabbitMQ_0x06_SpringAMQP_RPC_Sample-0.0.1-SNAPSHOT.jar --spring.profiles.active=rpc,client
```

Server 端

```java
java -jar RabbitMQ_0x06_SpringAMQP_RPC_Sample-0.0.1-SNAPSHOT.jar --spring.profiles.active=rpc,server
```
