# 12、RabbitMQ 实战 - Fanout交换机的简介与实现
- 来源：https://ddkk.com/zhuanlan/mq/rabbitmq/2/12.html
- 分类：消息队列
- 分组：教程目录
**1、** Fanout交换机的介绍；

接收所有的消息广播到它知道的队列中，类似于发布订阅模式，只要Fanout禁用RoutingKey,绑定同一交换机的队列都可同时收到消息；若Fanout启动了routingkey，则绑定同一交换机且routingkeyKey相同的队列才能收到同一消息

**2、** Fanout交换机的实现；

(1)新建一个名为fanout的包，用于装发布确认的代码

效果图：

(2)新建一个名为Receive01的类用于编写消费者的代码

代码如下：

注：RabbitMqUtils工具类的实现在我的另一篇文章里，有需要的同学可以查看参考

[https://blog.csdn.net/m0_64284147/article/details/129465871](/zhuanlan/mq/activemq/2/6.html)

```java
package com.ken.fanout;
import com.ken.utils.RabbitMqUtils;
import com.rabbitmq.client.Channel;
import com.rabbitmq.client.DeliverCallback;
/**
 * 消息接收
 */
public class Receive01 {
    //声明交换机的名称
    public static  final String EXCHANGE_NAME = "fanout_exchange";
    public static void main(String[] args) throws Exception{
        Channel channel = RabbitMqUtils.getChannel();
        //声明一个交换机
        channel.exchangeDeclare(EXCHANGE_NAME,"fanout");
        //声明一个队列（生成一个临时的队列，队列的名称是随机的，当消费者断开与队列的连接时，队列自动删除，减少我们对队列的管理）
        String queueName = channel.queueDeclare().getQueue();
        //绑定交换机与队列
        channel.queueBind(queueName,EXCHANGE_NAME,"");
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
            System.out.println("Receive01接收到的消息：" + new String(message.getBody(),"UTF-8"));
        };
        /**
         * 用信道对消息进行接收
         * 第一个参数：消费的是哪一个队列的消息
         * 第二个参数：消费成功后是否要自动应答，true代表自动应当，false代表手动应答
         * 第三个参数：消费者接收消息后的回调方法
         * 第四个参数：消费者取消接收消息后的回调方法（正常接收不调用）
         */
        channel.basicConsume(queueName,true,deliverCallback,consumerTag -> {});
    }
}
```

(3)复制Receive01类并粘贴重命名为Receive02

代码如下：

```java
package com.ken.fanout;
import com.ken.utils.RabbitMqUtils;
import com.rabbitmq.client.Channel;
import com.rabbitmq.client.DeliverCallback;
/**
 * 消息接收
 */
public class Receive02 {
    //声明交换机的名称
    public static  final String EXCHANGE_NAME = "fanout_exchange";
    public static void main(String[] args) throws Exception{
        Channel channel = RabbitMqUtils.getChannel();
        //声明一个交换机
        channel.exchangeDeclare(EXCHANGE_NAME,"fanout");
        //声明一个队列（生成一个临时的队列，队列的名称是随机的，当消费者断开与队列的连接时，队列自动删除，减少我们对队列的管理）
        String queueName = channel.queueDeclare().getQueue();
        //绑定交换机与队列
        channel.queueBind(queueName,EXCHANGE_NAME,"");
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
            System.out.println("Receive02接收到的消息：" + new String(message.getBody(),"UTF-8"));
        };
        /**
         * 用信道对消息进行接收
         * 第一个参数：消费的是哪一个队列的消息
         * 第二个参数：消费成功后是否要自动应答，true代表自动应当，false代表手动应答
         * 第三个参数：消费者接收消息后的回调方法
         * 第四个参数：消费者取消接收消息后的回调方法（正常接收不调用）
         */
        channel.basicConsume(queueName,true,deliverCallback,consumerTag -> {});
    }
}
```

(4)新建一个名为Emit的类用于编写生产者的代码

```java
package com.ken.fanout;
import com.ken.utils.RabbitMqUtils;
import com.rabbitmq.client.Channel;
import java.util.Scanner;
/**
 * 发消息
 */
public class Emit {
    //声明交换机的名称
    public static  final String EXCHANGE_NAME = "fanout_exchange";
    public static void main(String[] args) throws Exception{
        Channel channel = RabbitMqUtils.getChannel();
        //从控制台读取要发送的信息
        Scanner scanner = new Scanner(System.in);
        while (scanner.hasNext()) {
            String message = scanner.next();
           /**
            * 用信道对消息进行发布（消息持久化）
            * 第一个参数：发送到哪个交换机
            * 第二个参数：路由的Key值是哪个，本次是队列名
            * 第三个参数：其他参数信息
            * 第四个参数：发送消息的消息体
            */
            channel.basicPublish(EXCHANGE_NAME,"",null,message.getBytes("UTF-8"));
            System.out.println("生产者发送的消息：" + message);
        }
    }
}
```

(5)分别先运行Receive01、Receive02和Emit

(6)在Emit里输入消息，然后查看Receive01和Receive02接收消息的情况，若两个消费者都分别消费了一样的消息，证明我们成功实现了Fanout交换机

例：

Emit

Receive01

Receive02
