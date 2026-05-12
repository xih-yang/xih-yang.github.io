# 08、RabbitMQ 实战 - Java Client 之 Remote procedure call (RPC,远程过程调用)
- 来源：https://ddkk.com/zhuanlan/mq/rabbitmq/4/8.html
- 分类：消息队列
- 分组：RabbitMQ 教程（版本 A）
在[译:2. RabbitMQ 之Work Queues (工作队列)][2. RabbitMQ _Work Queues] 我们学习了如何使用*工作队列*在多个工作人员之间分配耗时的任务。

但是如果我们需要在远程计算机上运行一个函数并等待结果呢？嗯，这是一个不同的故事。此模式通常称为*远程过程调用*或*RPC*。

在本教程中，我们将使用RabbitMQ构建RPC系统：客户端和可伸缩的RPC服务器。由于我们没有任何值得分发的耗时任务，我们将创建一个返回Fibonacci数字的虚拟RPC服务。

### 客户端界面

为了说明如何使用RPC服务，我们将创建一个简单的客户端类。

它将公开一个名为call的方法，该方法发送一个RPC请求并阻塞，直到收到答案为止：

```java
FibonacciRpcClient fibonacciRpc = new FibonacciRpcClient（）;
字符串结果= fibonacciRpc.call（“4”）;
System.out.println（“fib（4）is” + result）;
```

> 关于RPC的说明
>
> 尽管RPC在计算中是一种非常常见的模式，但它经常受到批评。当程序员不知道函数调用是本地的还是慢的RPC时，会出现问题。这样的混淆导致系统不可预测，并增加了调试的不必要的复杂性。错误使用RPC可以导致不可维护的意大利面条代码，而不是简化软件。
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

一般来说，通过RabbitMQ进行RPC很容易。客户端发送请求消息，服务器回复响应消息。为了接收响应，我们需要发送带有请求的“回调”队列地址。我们可以使用默认队列（在Java客户端中是独占的）。我们来试试吧：

```java
callbackQueueName = channel.queueDeclare().getQueue();
BasicProperties props = new BasicProperties
                            .Builder()
                            .replyTo(callbackQueueName)
                            .build();
channel.basicPublish("", "rpc_queue", props, message.getBytes());
// ... then code to read a response message from the callback_queue ...
```

#### Message properties

TheAMQP 0-9-1 protocol predefines a set of 14 properties that go with a message. Most of the properties are rarely used, with the exception of the following:

- deliveryMode: Marks a message as persistent (with a value of 2) or transient (any other value). You may remember this property from [the second tutorial](https://www.rabbitmq.com/tutorials/tutorial-two-java.html).
- contentType: Used to describe the mime-type of the encoding. For example for the often used JSON encoding it is a good practice to set this property to: application/json.
- replyTo: Commonly used to name a callback queue.
- correlationId: Useful to correlate RPC responses with requests.

我们需要一个新的导入：

```java
import com.rabbitmq.client.AMQP.BasicProperties;
```

### 相关ID

在上面介绍的方法中，我们建议为每个RPC请求创建一个回调队列。这是非常低效的，但幸运的是有更好的方法 - 让我们为每个客户端创建一个回调队列。

这引发了一个新问题，在该队列中收到响应后，不清楚响应属于哪个请求。那是在使用correlationId属性的时候 。我们将为每个请求将其设置为唯一值。稍后，当我们在回调队列中收到一条消息时，我们将查看此属性，并根据该属性，我们将能够将响应与请求进行匹配。如果我们看到未知的correlationId值，我们可以安全地丢弃该消息 - 它不属于我们的请求。

您可能会问，为什么我们应该忽略回调队列中的未知消息，而不是失败并出现错误？这是由于服务器端可能存在竞争条件。虽然不太可能，但RPC服务器可能会在向我们发送答案之后，但在发送请求的确认消息之前死亡。如果发生这种情况，重新启动的RPC服务器将再次处理请求。这就是为什么在客户端上我们必须优雅地处理重复的响应，理想情况下RPC应该是幂等的。

### 概要

我们的RPC将这样工作：

- 对于RPC请求，客户端发送带有两个属性的消息： replyTo，设置为仅为请求创建的匿名独占队列;以及correlationId，设置为每个请求的唯一值。
- 请求被发送到rpc_queue队列。
- RPC worker（aka：server）正在等待该队列上的请求。当出现请求时，它会执行该作业，并使用来自replyTo字段的队列将带有结果的消息发送回客户端。
- 客户端等待回复队列上的数据。出现消息时，它会检查correlationId属性。如果它与请求中的值匹配，则返回对应用程序的响应。

## 把它们放在一起

斐波纳契任务：

```java
private static int fib(int n) {
    if (n == 0) return 0;
    if (n == 1) return 1;
    return fib(n-1) + fib(n-2);
}
```

我们宣布我们的斐波那契函数。它假定只有有效的正整数输入。（不要指望这个适用于大数字，它可能是最慢的递归实现）。

服务器代码非常简单：

- 像往常一样，我们首先建立连接，通道和声明队列。
- 我们可能希望运行多个服务器进程。为了在多个服务器上平均分配负载，我们需要在channel.basicQos中设置 prefetchCount设置。
- 我们使用basicConsume来访问队列，我们以对象（DefaultConsumer）的形式提供回调，它将完成工作并发回响应。

我们的RPC客户端的代码可以在这里找到：[RPCClient.java](https://github.com/rabbitmq/rabbitmq-tutorials/blob/master/java/RPCClient.java)。

客户端代码稍微复杂一些：

- 我们建立了一个连接和渠道。
- 我们的调用方法生成实际的RPC请求。
- 在这里，我们首先生成一个唯一的correlationId 数并保存它 - 我们 在RpcConsumer中的handleDelivery实现将使用该值来捕获适当的响应。
- 然后，我们为回复创建一个专用的独占队列并订阅它。
- 接下来，我们发布请求消息，其中包含两个属性： replyTo和correlationId。
- 在这一点上，我们可以坐下来等待正确的响应到来。
- 由于我们的消费者交付处理是在一个单独的线程中进行的，因此我们需要在响应到来之前暂停主线程。使用BlockingQueue是一种可能的解决方案。这里我们创建了ArrayBlockingQueue ，容量设置为1，因为我们只需要等待一个响应。
- 该handleDelivery方法是做一个很简单的工作，对每一位消费响应消息它会检查的correlationID 是我们要找的人。如果是这样，它会将响应置于BlockingQueue。
- 同时主线程正在等待响应从BlockingQueue获取它。
- 最后，我们将响应返回给用户。

发出客户请求：

```java
RPCClient fibonacciRpc = new RPCClient（）; 
System.out.println（“[x] Requesting fib（30）”）; 
字符串响应= fibonacciRpc.call（“30”）; 
System.out.println（“[。] Got'” + response + “'”）; 
fibonacciRpc.close（）;
```

RPCClient.java

```java
import java.io.IOException;
import java.util.UUID;
import java.util.concurrent.ArrayBlockingQueue;
import java.util.concurrent.BlockingQueue;
import java.util.concurrent.TimeoutException;
import com.rabbitmq.client.AMQP;
import com.rabbitmq.client.Channel;
import com.rabbitmq.client.Connection;
import com.rabbitmq.client.ConnectionFactory;
import com.rabbitmq.client.DefaultConsumer;
import com.rabbitmq.client.Envelope;
public class RPCClient {
    private Connection connection;
      private Channel channel;
      private String requestQueueName = "rpc_queue";
      public RPCClient() throws IOException, TimeoutException {
        ConnectionFactory factory = new ConnectionFactory();
        factory.setHost("localhost");
        connection = factory.newConnection();
        channel = connection.createChannel();
      }
      public String call(String message) throws IOException, InterruptedException {
        final String corrId = UUID.randomUUID().toString();
        String replyQueueName = channel.queueDeclare().getQueue();
        AMQP.BasicProperties props = new AMQP.BasicProperties
                .Builder()
                .correlationId(corrId)
                .replyTo(replyQueueName)
                .build();
        channel.basicPublish("", requestQueueName, props, message.getBytes("UTF-8"));
        final BlockingQueue<String> response = new ArrayBlockingQueue<String>(1);
        String ctag = channel.basicConsume(replyQueueName, true, new DefaultConsumer(channel) {
          @Override
          public void handleDelivery(String consumerTag, Envelope envelope, AMQP.BasicProperties properties, byte[] body) throws IOException {
            if (properties.getCorrelationId().equals(corrId)) {
              response.offer(new String(body, "UTF-8"));
            }
          }
        });
        String result = response.take();
        channel.basicCancel(ctag);
        return result;
      }
      public void close() throws IOException {
        connection.close();
      }
      public static void main(String[] argv) {
        RPCClient fibonacciRpc = null;
        String response = null;
        try {
          fibonacciRpc = new RPCClient();
          for (int i = 0; i < 32; i++) {
            String i_str = Integer.toString(i);
            System.out.println(" [x] Requesting fib(" + i_str + ")");
            response = fibonacciRpc.call(i_str);
            System.out.println(" [.] Got '" + response + "'");
          }
        }
        catch  (IOException | TimeoutException | InterruptedException e) {
          e.printStackTrace();
        }
        finally {
          if (fibonacciRpc!= null) {
            try {
              fibonacciRpc.close();
            }
            catch (IOException _ignore) {}
          }
        }
      }
}
```

RPCServer.java

```java
import java.io.IOException;
import java.util.concurrent.TimeoutException;
import com.rabbitmq.client.AMQP;
import com.rabbitmq.client.Channel;
import com.rabbitmq.client.Connection;
import com.rabbitmq.client.ConnectionFactory;
import com.rabbitmq.client.Consumer;
import com.rabbitmq.client.DefaultConsumer;
import com.rabbitmq.client.Envelope;
public class RPCServer {
    private static final String RPC_QUEUE_NAME = "rpc_queue";
      private static int fib(int n) {
        if (n ==0) return 0;
        if (n == 1) return 1;
        return fib(n-1) + fib(n-2);
      }
      public static void main(String[] argv) {
        ConnectionFactory factory = new ConnectionFactory();
        factory.setHost("localhost");
        Connection connection = null;
        try {
          connection      = factory.newConnection();
          final Channel channel = connection.createChannel();
          channel.queueDeclare(RPC_QUEUE_NAME, false, false, false, null);
          channel.queuePurge(RPC_QUEUE_NAME);
          channel.basicQos(1);
          System.out.println(" [x] Awaiting RPC requests");
          Consumer consumer = new DefaultConsumer(channel) {
            @Override
            public void handleDelivery(String consumerTag, Envelope envelope, AMQP.BasicProperties properties, byte[] body) throws IOException {
              AMQP.BasicProperties replyProps = new AMQP.BasicProperties
                      .Builder()
                      .correlationId(properties.getCorrelationId())
                      .build();
              String response = "";
              try {
                String message = new String(body,"UTF-8");
                int n = Integer.parseInt(message);
                System.out.println(" [.] fib(" + message + ")");
                response += fib(n);
              }
              catch (RuntimeException e){
                System.out.println(" [.] " + e.toString());
              }
              finally {
                channel.basicPublish( "", properties.getReplyTo(), replyProps, response.getBytes("UTF-8"));
                channel.basicAck(envelope.getDeliveryTag(), false);
                // RabbitMq consumer worker thread notifies the RPC server owner thread 
                synchronized(this) {
                    this.notify();
                }
              }
            }
          };
          channel.basicConsume(RPC_QUEUE_NAME, false, consumer);
          // Wait and be prepared to consume the message from RPC client.
          while (true) {
              synchronized(consumer) {
                  try {
                      consumer.wait();
                  } catch (InterruptedException e) {
                      e.printStackTrace();            
                  }
              }
          }
        } catch (IOException | TimeoutException e) {
          e.printStackTrace();
        }
        finally {
          if (connection != null)
            try {
              connection.close();
            } catch (IOException _ignore) {}
        }
      }
}
```

此处介绍的设计并不是RPC服务的唯一可能实现，但它具有一些重要优势：

- 如果RPC服务器太慢，您可以通过运行另一个服务器来扩展。尝试在新控制台中运行第二个RPCServer。
- 在客户端，RPC只需要发送和接收一条消息。不需要像queueDeclare这样的同步调用 。因此，对于单个RPC请求，RPC客户端只需要一次网络往返。

我们的代码仍然相当简单，并不试图解决更复杂（但重要）的问题，例如：

- 如果没有运行服务器，客户应该如何反应？
- 客户端是否应该为RPC设置某种超时？
- 如果服务器出现故障并引发异常，是否应将其转发给客户端？
- 在处理之前防止无效的传入消息（例如检查边界，键入）。
