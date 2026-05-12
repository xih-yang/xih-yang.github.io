# 07、RabbitMQ 实战 - RabbitMQ消息应答及消息未应答后重新入队
- 来源：https://ddkk.com/zhuanlan/mq/rabbitmq/2/7.html
- 分类：消息队列
- 分组：教程目录
概念：消费者消费完一条消息可能需要等待一段时间，但如果这段时间内消费者在未完成消费信息的情况下时就挂掉了，这时候会怎么样？RabbitMQ一旦向消费者传递一条消息，该消息就会被标记为删除，这种情况下消费者挂掉了正在处理的消息就会丢失，为了保证消息在发送的过程中不会丢失，RabbitMQ引入了应答机制，即在消费者接收并处理了该条消息后告诉RabbitMQ它已经把该条消息处理了，RabbitMQ可以把这条消息删除了。

**1、** 自动应答；

消息发送后立即被认为已经传送成功，这种模式需要在高吞吐量和数据传输安全性方面做权衡，这种模式下万一消费者的连接或信道关闭，消息就丢失了，不过这种模式对传递的消息数量没有限制，但如果消息太多太大，消费者来不及消费，也可能出现消息的堆积导致内存耗尽，最终消费者程序被操作系统杀死的情况，所以这种模式只能在消费者可以高效的、高速率的处理消息的前提下使用。

**2、** 手动应答；

以下方法用于手动应答

(1)channel.basicAck()（用于肯定确认，即向RabbitMQ表示该消息已经发送并处理成功了，可以将其丢弃）

(2)channel.basicNack()（用于否定确认，即不处理该信息直接丢弃）

(3)channel.basicReject()（用于否定确认，即不处理该信息直接丢弃，比basicNack方法少一个Multiple参数）

**3、** Multiple参数解释；

channel.basicNack(deliveryTag,true)（第二个参数就是Multiple参数）

multiple的true和false的区别：

(1)true表示批量应答channel上未应答的消息，比如channel上有传送tag为5，6，7，8的消息，当前tag是8，那么此时5-8还未应答的消息就会被确认收到消息应答，但如果处理6或7消息失败了，5也会被应答，导致5消息丢失，所以一般情况下multiple为false。

(2)false表示只会应答tag=8的消息，5，6，7这三个消息依然不会被确认收到消息应答

**4、** 消息重新入队；

如果消费者由于某些原因失去连接，导致消费者未成功发送ACK确认应答，RabbitMQ将会对未完全处理完的消息重新入队，如果其他消费者可以处理，则该消息将被分配到另一个消费者，从而保证消息未丢失。

**5、** 在utils包下新建一个名为SleepUtils的类，该类的方法能让线程睡眠指定的时间，用于模拟业务的处理时间，代码如下；

```java
package com.ken.utils;
/**
 * 睡眠工具类，用于模拟执行业务时间的长短
 */
public class SleepUtils {
    public static void sleep(int second) {
        try {
            Thread.sleep(1000 * second);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
    }
}
```

效果图：

**6、** 使用代码实现消息手动应答，为此先新建一个名为ack的包，用于装消息手动应答的代码；

效果图：

**7、** 新建一个名为Task02的类，用作充当生产者，代码如下；

注：RabbitMqUtils工具类的实现在我的另一篇文章里，有需要的同学可以查看参考

[https://blog.csdn.net/m0_64284147/article/details/129465871](/zhuanlan/mq/activemq/2/6.html)

```java
package com.ken.ack;
import com.ken.utils.RabbitMqUtils;
import com.rabbitmq.client.Channel;
import java.util.Scanner;
public class Task02 {
    //队列名称（用于指定往哪个队列接收消息）
    public  static final String QUEUE_NAME = "ack_queue";
    public static void main(String[] args) throws Exception{
        Channel channel = RabbitMqUtils.getChannel();
        /**
         * 创建队列
         * 第一个参数：队列名称
         * 第二个参数：服务器重启后队列是否还存在，即队列是否持久化,true为是，false为否，默认false，即消息存储在内存中而不是硬盘中
         * 第三个参数：该队列是否只供一个消费者进行消费，是否进行消息共享，true为只允许一个消费者进行消费，false为允许多个消费者对队列进行消费，默认false
         * 第四个参数：是否自动删除，最后一个消费者断开连接后该队列是否自动删除，true自动删除，false不自动删除
         * 第五个参数：其他参数
         */
        channel.queueDeclare(QUEUE_NAME,false,false,false,null);
        //从控制台读取要发送的信息
        Scanner scanner = new Scanner(System.in);
        while (scanner.hasNext()) {
            String message = scanner.next();
            /**
             * 用信道对消息进行发布
             * 第一个参数：发送到哪个交换机
             * 第二个参数：路由的Key值是哪个，本次是队列名
             * 第三个参数：其他参数信息
             * 第四个参数：发送消息的消息体
             */
            channel.basicPublish("",QUEUE_NAME,null,message.getBytes());
            System.out.println("消息发送成功:" + message);
        }
    }
}
```

效果图：

**8、** 新建一个名为Worker03的类，用作充当消费者一号,代码如下；

```java
package com.ken.ack;
import com.ken.utils.RabbitMqUtils;
import com.ken.utils.SleepUtils;
import com.rabbitmq.client.CancelCallback;
import com.rabbitmq.client.Channel;
import com.rabbitmq.client.DeliverCallback;
/**
 *  手动应答的第一个消费者
 */
public class Worker03 {
    //队列名称（用于指定往哪个队列接收消息）
    public  static final String QUEUE_NAME = "ack_queue";
    //进行接收操作
    public static void main(String[] args) throws Exception{
        //通过工具类获取信道
        Channel channel = RabbitMqUtils.getChannel();
        /**
         * 声明消费者接收消息后的回调方法(由于回调方法DeliverCallback是函数式接口，所以需要给DeliverCallback赋值一个函数，为了方便我们这里使用Lambda表达式进行赋值)
         * 为什么要这样写呢，是因为basicConsume方法里的参数deliverCallback的类型DeliverCallback用 @FunctionalInterface注解规定DeliverCallback是一个函数式接口，所以要往deliverCallback参数传的值要是一个函数
         *
         * 以下是DeliverCallback接口的源代码
         *  @FunctionalInterface
         *  public interface DeliverCallback {
         *      void handle (String consumerTag, Delivery message) throws IOException;
         *  }
         */
        DeliverCallback deliverCallback = (consumerTag, message) -> {
            //沉睡1S，用于模拟业务处理需要1S的时间
            SleepUtils.sleep(1);
            System.out.println("接收的消息：" + new String(message.getBody()));
            /**
             * 手动应答
             *  第一个参数：表示消息的标记Tag（每个消息都有标记Tag）
             *  第二个参数：是否批量应答,true表示批量，false表示不批量
             */
            channel.basicAck(message.getEnvelope().getDeliveryTag(),false);
        };
        /**
         * 声明消费者取消接收消息后的回调方法(由于回调方法CancelCallback是函数式接口，所以需要给CancelCallback赋值一个函数，为了方便我们这里使用Lambda表达式进行赋值)
         * 为什么要这样写呢，是因为basicConsume方法里的参数cancelCallback的类型CancelCallback用 @FunctionalInterface注解规定CancelCallback是一个函数式接口，所以要往cancelCallback参数传的值要是一个函数
         *
         *  @FunctionalInterface
         *  public interface CancelCallback {
         *      void handle (String consumerTag) throws IOException;
         *  }
         *
         */
        CancelCallback cancelCallback = consumerTag -> {
            System.out.println("取消消费消息：" + consumerTag);
        };
        /**
         * 用信道对消息进行接收(采用手动应答)
         * 第一个参数：消费的是哪一个队列的消息
         * 第二个参数：消费成功后是否要自动应答，true代表自动应当，false代表手动应答
         * 第三个参数：消费者接收消息后的回调方法
         * 第四个参数：消费者取消接收消息后的回调方法（正常接收不调用）
         */
        System.out.println("Work03等待接收消息...");
        channel.basicConsume(QUEUE_NAME,false,deliverCallback,cancelCallback);
    }
}
```

效果图：

**9、** 新建一个名为Worker04的类，用作充当消费者二号,代码如下；

```java
package com.ken.ack;
import com.ken.utils.RabbitMqUtils;
import com.ken.utils.SleepUtils;
import com.rabbitmq.client.CancelCallback;
import com.rabbitmq.client.Channel;
import com.rabbitmq.client.DeliverCallback;
/**
 *  手动应答的第二个消费者
 */
public class Worker04 {
    //队列名称（用于指定往哪个队列接收消息）
    public  static final String QUEUE_NAME = "ack_queue";
    //进行接收操作
    public static void main(String[] args) throws Exception{
        //通过工具类获取信道
        Channel channel = RabbitMqUtils.getChannel();
        /**
         * 声明消费者接收消息后的回调方法(由于回调方法DeliverCallback是函数式接口，所以需要给DeliverCallback赋值一个函数，为了方便我们这里使用Lambda表达式进行赋值)
         * 为什么要这样写呢，是因为basicConsume方法里的参数deliverCallback的类型DeliverCallback用 @FunctionalInterface注解规定DeliverCallback是一个函数式接口，所以要往deliverCallback参数传的值要是一个函数
         *
         * 以下是DeliverCallback接口的源代码
         *  @FunctionalInterface
         *  public interface DeliverCallback {
         *      void handle (String consumerTag, Delivery message) throws IOException;
         *  }
         */
        DeliverCallback deliverCallback = (consumerTag, message) -> {
            //沉睡30S，用于模拟业务处理需要30S的时间
            SleepUtils.sleep(30);
            System.out.println("接收的消息：" + new String(message.getBody()));
            /**
             * 手动应答
             *  第一个参数：表示消息的标记Tag（每个消息都有标记Tag）
             *  第二个参数：是否批量应答,true表示批量，false表示不批量
             */
            channel.basicAck(message.getEnvelope().getDeliveryTag(),false);
        };
        /**
         * 声明消费者取消接收消息后的回调方法(由于回调方法CancelCallback是函数式接口，所以需要给CancelCallback赋值一个函数，为了方便我们这里使用Lambda表达式进行赋值)
         * 为什么要这样写呢，是因为basicConsume方法里的参数cancelCallback的类型CancelCallback用 @FunctionalInterface注解规定CancelCallback是一个函数式接口，所以要往cancelCallback参数传的值要是一个函数
         *
         *  @FunctionalInterface
         *  public interface CancelCallback {
         *      void handle (String consumerTag) throws IOException;
         *  }
         *
         */
        CancelCallback cancelCallback = consumerTag -> {
            System.out.println("取消消费消息：" + consumerTag);
        };
        /**
         * 用信道对消息进行接收(采用手动应答)
         * 第一个参数：消费的是哪一个队列的消息
         * 第二个参数：消费成功后是否要自动应答，true代表自动应当，false代表手动应答
         * 第三个参数：消费者接收消息后的回调方法
         * 第四个参数：消费者取消接收消息后的回调方法（正常接收不调用）
         */
        System.out.println("Work04等待接收消息...");
        channel.basicConsume(QUEUE_NAME,false,deliverCallback,cancelCallback);
    }
}
```

效果图：

**10、** 分别先后启动Task02、Worker03、Worker04；

例：

**11、** 正常的在Task02输入消息，观察消息的被消费情况；

(1)在Task02分别输入第一条和第二条消息

(2)等待1秒后第一条消息被Work03消费

(3)等待30秒后第二条消息被Work04消费

**12、** 再次在Task02输入消息，然后手动暂停Worker04用以模拟Worker04消费者宕机的情况，观察消息的被消费情况；

(1)在Task02分别输入第三条和第四条消息

(2)手动停掉Worker04，模拟Worker04宕机的情况

(3)Worker04宕机后没有成功消费掉第四条消息，然后没有对消息进行应答，导致第四条消息重新入队，然后被Worker03消费掉
