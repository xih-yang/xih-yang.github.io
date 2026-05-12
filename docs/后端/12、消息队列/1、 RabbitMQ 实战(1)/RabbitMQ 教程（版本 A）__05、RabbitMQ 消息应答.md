# 05、RabbitMQ 消息应答
- 来源：https://ddkk.com/zhuanlan/mq/rabbitmq/1/5.html
- 分类：消息队列
- 分组：RabbitMQ 教程（版本 A）
## 1、消息应答简介

消费者完成一个任务可能需要一段时间，如果其中一个消费者处理一个长的任务并仅只完成了部分突然它挂掉了，会发生什么情况。RabbitMQ 一旦向消费者传递了一条消息，便立即将该消息标记为删除。在这种情况下，突然有个消费者挂掉了，我们将丢失正在处理的消息。以及后续发送给该消费这的消息，因为它无法接收到。

为了保证消息在发送过程中不丢失，rabbitmq 引入消息应答机制，消息应答就是:**消费者在接收到消息并且处理该消息之后，告诉 rabbitmq 它已经处理了，rabbitmq 可以把该消息删除了。**

**消息应答分为：自动应答和手动应答**

## 2、自动应答

消息发送后立即被认为已经传送成功，这种模式需要在**高吞吐量和数据传输安全性方面做权衡**,因为这种模式如果消息在接收到之前，消费者那边出现连接或者 channel 关闭，那么消息就丢失了,当然另一方面这种模式消费者那边可以传递过载的消息，**没有对传递的消息数量进行限制**，当然这样有可能使得消费者这边由于接收太多还来不及处理的消息，导致这些消息的积压，最终使得内存耗尽，最终这些消费者线程被操作系统杀死，**所以这种模式仅适用在消费者可以高效并以某种速率能够处理这些消息的情况下使用。**

## 3、手动应答(推荐使用)

### 3.1、手动应答的方法

A.`Channel.basicAck(用于肯定确认)`RabbitMQ 已知道该消息并且成功的处理消息，可以将其丢弃了

B.`Channel.basicNack(用于否定确认)`

C.`Channel.basicReject(用于否定确认)`与 Channel.basicNack 相比少一个(Multiple 批量处理)参数,不处理该消息了直接拒绝，可以将其丢弃了

### 3.2、Multiple 的解释

**手动应答的好处是可以批量应答并且减少网络拥堵**

**multiple 的 true 和 false 代表不同意思**

- **true：**代表批量应答 channel 上未应答的消息比如说 channel 上有传送 tag 的消息 5,6,7,8 当前 tag 是 8 ,那么此时5-8 的这些还未应答的消息都会被确认收到消息应答
- **false**：同上面相比只会应答 tag=8 的消息 5,6,7 这三个消息依然不会被确认收到消息应答

### 3.3、消息自动重新入队

如果消费者由于某些原因失去连接(其通道已关闭，连接已关闭或 TCP 连接丢失)，导致消息未发送 ACK 确认，RabbitMQ 将了解到消息未完全处理，并将对其重新排队。如果此时其他消费者可以处理，它将很快将其重新分发给另一个消费者。这样，即使某个消费者偶尔死亡，也可以确保不会丢失任何消息。

消息手动应答的代码实现

### 3.4、编写一个进程睡眠工具类

```java
package com.zww.spring.rabbitmq.utils;
//睡眠工具类
public class SleepUtils {
    public static void sleep(int second){
        try {
            Thread.sleep(1000*second);
        } catch (InterruptedException _ignored) {
            Thread.currentThread().interrupt();
        }
    }
}
```

### 3.5、编写消息发布者

```java
package com.zww.spring.rabbitmq.Three;
import com.rabbitmq.client.Channel;
import com.study.rabbitmq.utils.RabbitMQUtils;
import java.util.Scanner;
//消息在手动应答时是不丢失的，放回队列中重新消费
public class Task02 {
    //队列名称
    public static final String TASK_QUEUE_NAME = "ack_queue";
    public static void main(String[] args) throws Exception {
        Channel channel = RabbitMQUtils.getChannel();
        //声明队列
         /*
         * 生成一个队列
         * 1.队列名称
         * 2.队列里面的消息是否持久化（存储在磁盘），默认情况消息存储在内存中
         * 3.该队列是否只供一个消费者进行消费，是否进行消息共享。true可以多个消费者消费，false只能一个消费者消费
         * 4.最后一个消费者端开链接以后该队列是否自动删除 true自动删除 false不自动删除
         * */
        channel.queueDeclare(TASK_QUEUE_NAME,false,false,false,null);
        //从控制台中输入信息
        Scanner scanner = new Scanner(System.in);
        while (scanner.hasNext()){
            String message = scanner.next();
            channel.basicPublish("",TASK_QUEUE_NAME,null,message.getBytes("UTF-8"));
            System.out.println("生产者发出消息:"+message);
        }
    }
}
```

### 3.6、编写两个消费者,C1进程睡眠1秒，C2进程睡眠30秒

```java
package com.zww.spring.rabbitmq.Three;
import com.rabbitmq.client.*;
import com.study.rabbitmq.utils.RabbitMQUtils;
import com.study.rabbitmq.utils.SleepUtils;
//消息在手动应答时是不允许不丢失的，并且放回队列中重新消费
public class Work03 {
    //队列名称
    public static final String TASK_QUEUE_NAME = "ack_queue";
    //接收消息
    public static void main(String[] args) throws Exception {
        Channel channel = RabbitMQUtils.getChannel();
        System.out.println("C1等待接收消息处理时间1S");
        DeliverCallback deliverCallback = (String consumerTag, Delivery message) -> {
            //睡眠1秒
            SleepUtils.sleep(1);
            System.out.println("接收到的消息："+new String(message.getBody(),"UTF-8"));
            /*手动应答
             * 1.消息的标记 tag
             * 2.是否批量应答
             **/
            channel.basicAck(message.getEnvelope().getDeliveryTag(),false);
        };
        //消息接收被取消时，执行下面的内容
        CancelCallback callback = (consumerTag) -> {
            System.out.println(consumerTag+ "消费者取消消费接口逻辑");
        };
        //消息接收
        /*
         * 消费者消费消息
         * 1.消费哪个队列
         * 2.消费成功之后是否要自动应答 true自动应答 false手动应答
         * 3.消费者未成功消费的回调
         * 4.消费者取消消费的回调
         * */
        channel.basicConsume(TASK_QUEUE_NAME,false,deliverCallback,callback);
    }
}
```

```java
package com.zww.spring.rabbitmq.Three;
import com.rabbitmq.client.*;
import com.study.rabbitmq.utils.RabbitMQUtils;
import com.study.rabbitmq.utils.SleepUtils;
//消息在手动应答时是不允许不丢失的，并且放回队列中重新消费
public class Work04 {
    //队列名称
    public static final String TASK_QUEUE_NAME = "ack_queue";
    //接收消息
    public static void main(String[] args) throws Exception {
        Channel channel = RabbitMQUtils.getChannel();
        System.out.println("C2等待接收消息处理时间30S");
        DeliverCallback deliverCallback = (String consumerTag, Delivery message) -> {
            //睡眠1秒
            SleepUtils.sleep(30);
            System.out.println("接收到的消息："+new String(message.getBody(),"UTF-8"));
            /*手动应答
             * 1.消息的标记 tag
             * 2.是否批量应答
             **/
            channel.basicAck(message.getEnvelope().getDeliveryTag(),false);
        };
        //消息接收被取消时，执行下面的内容
        CancelCallback callback = (consumerTag) -> {
            System.out.println(consumerTag+ "消费者取消消费接口逻辑");
        };
        //消息接收
        /*
         * 消费者消费消息
         * 1.消费哪个队列
         * 2.消费成功之后是否要自动应答 true自动应答 false手动应答
         * 3.消费者未成功消费的回调
         * 4.消费者取消消费的回调
         * */
        channel.basicConsume(TASK_QUEUE_NAME,false,deliverCallback,callback);
    }
}
```

### 3.7、启动Task02创建信道发布队列，在启动两个消费者(注意先启动 Work03再启动Work04)

### 3.8、在消息发送线程控制台输入以下内容

### 3.9、Work03延迟1S接收消息，Work04延迟30S接收消息

### 3.10、Task02 继续发送两条消息，Work03 接收之后，马上停止 Work04 运行（Work04宕机），而原本是 Work04 接收的消息因为宕机而退回到队列重新发布，由正常运行的 Work03 接收

Task02 发布消息

Work04 停止服务，消息退回给队列

由Work03 代替 Work04 接收消息

> 版权声明：「DDKK.COM 弟弟快看，程序员编程资料站」本站文章，版权归原作者所有
