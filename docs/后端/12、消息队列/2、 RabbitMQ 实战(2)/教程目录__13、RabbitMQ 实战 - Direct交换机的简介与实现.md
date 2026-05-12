# 13、RabbitMQ 实战 - Direct交换机的简介与实现
- 来源：https://ddkk.com/zhuanlan/mq/rabbitmq/2/13.html
- 分类：消息队列
- 分组：教程目录
**1、** Direct交换机的介绍；

Direct交换机能让消息只发送往绑定了指定routingkey的队列中去，值得注意的是当绑定多个队列的routingkey都相同，则这种情况下的表现与Fanout交换机的类似

**2、** Direct交换机的实现；

(1)新建一个名为fanout的包，用于装发布确认的代码

效果图：

(2)新建一个名为Receive01的类用于编写消费者的代码

代码如下：

注：RabbitMqUtils工具类的实现在我的另一篇文章里，有需要的同学可以查看参考

[RabbitMQ系列（6）--RabbitMQ模式之工作队列(Work queues)的简介及实现_Ken_1115的博客-CSDN博客](/zhuanlan/mq/activemq/2/6.html)

```java
package com.ken.direct;
import com.ken.utils.RabbitMqUtils;
import com.rabbitmq.client.BuiltinExchangeType;
import com.rabbitmq.client.Channel;
import com.rabbitmq.client.DeliverCallback;
/**
 * 消息接收
 */
public class Receive01 {
    //声明交换机的名称
    public static  final String EXCHANGE_NAME = "direct_exchange";
    public static void main(String[] args) throws Exception{
        Channel channel = RabbitMqUtils.getChannel();
        //声明一个交换机
        channel.exchangeDeclare(EXCHANGE_NAME, BuiltinExchangeType.DIRECT);
        /**
         * 创建队列
         * 第一个参数：队列名称
         * 第二个参数：服务器重启后队列是否还存在，即队列是否持久化,true为是，false为否，默认false，即消息存储在内存中而不是硬盘中
         * 第三个参数：该队列是否只供一个消费者进行消费，是否进行消息共享，true为只允许一个消费者进行消费，false为允许多个消费者对队列进行消费，默认false
         * 第四个参数：是否自动删除，最后一个消费者断开连接后该队列是否自动删除，true自动删除，false不自动删除
         * 第五个参数：其他参数
         */
        channel.queueDeclare("console",false,false,false,null);
        //队列与交换机通过routingkey进行捆绑
        channel.queueBind("console",EXCHANGE_NAME,"info");
        //队列与交换机通过routingkey进行捆绑
        channel.queueBind("console",EXCHANGE_NAME,"warning");
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
        channel.basicConsume("console",true,deliverCallback,consumerTag -> {});
    }
}
```

(3)复制Receive01类并粘贴重命名为Receive02

代码如下：

```java
package com.ken.direct;
import com.ken.utils.RabbitMqUtils;
import com.rabbitmq.client.BuiltinExchangeType;
import com.rabbitmq.client.Channel;
import com.rabbitmq.client.DeliverCallback;
/**
 * 消息接收
 */
public class Receive02 {
    //声明交换机的名称
    public static  final String EXCHANGE_NAME = "direct_exchange";
    public static void main(String[] args) throws Exception{
        Channel channel = RabbitMqUtils.getChannel();
        //声明一个交换机
        channel.exchangeDeclare(EXCHANGE_NAME, BuiltinExchangeType.DIRECT);
        /**
         * 创建队列
         * 第一个参数：队列名称
         * 第二个参数：服务器重启后队列是否还存在，即队列是否持久化,true为是，false为否，默认false，即消息存储在内存中而不是硬盘中
         * 第三个参数：该队列是否只供一个消费者进行消费，是否进行消息共享，true为只允许一个消费者进行消费，false为允许多个消费者对队列进行消费，默认false
         * 第四个参数：是否自动删除，最后一个消费者断开连接后该队列是否自动删除，true自动删除，false不自动删除
         * 第五个参数：其他参数
         */
        channel.queueDeclare("disk",false,false,false,null);
        //队列与交换机通过routingkey进行捆绑
        channel.queueBind("disk",EXCHANGE_NAME,"error");
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
        channel.basicConsume("disk",true,deliverCallback,consumerTag -> {});
    }
}
```

(4)新建一个名为Direct的类用于编写生产者的代码

代码如下：

```java
package com.ken.direct;
import com.ken.utils.RabbitMqUtils;
import com.rabbitmq.client.Channel;
import java.util.Scanner;
/**
 * 发消息
 */
public class Direct {
    //声明交换机的名称
    public static  final String EXCHANGE_NAME = "direct_exchange";
    public static void main(String[] args) throws Exception{
        Channel channel = RabbitMqUtils.getChannel();
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
            channel.basicPublish(EXCHANGE_NAME,"info",null,message.getBytes("UTF-8"));
            //channel.basicPublish(EXCHANGE_NAME,"warning",null,message.getBytes("UTF-8"));
            //channel.basicPublish(EXCHANGE_NAME,"error",null,message.getBytes("UTF-8"));
            System.out.println("生产者发送的消息：" + message);
        }
    }
}
```

(5)分别先运行Receive01、Receive02

(6)先把Direct类里的routingkey设置为info，然后启动Direct类

例：

(7)在Direct里输入消息，然后查看Receive01和Receive02接收消息的情况，能看出Receive01接收到消息，而Receive02没有接收到消息

(8)把Direct类里的routingkey设置为warning，然后重新启动Direct类

(9)在Direct里输入消息，然后查看Receive01和Receive02接收消息的情况，能看出Receive01接收到消息，而Receive02没有接收到消息

(10)把Direct类里的routingkey设置为error，然后重新启动Direct类

(11)在Direct里输入消息，然后查看Receive01和Receive02接收消息的情况，能看出Receive01没有接收到消息，而Receive02接收到了消息

从上述众多结果可看出direct交换机实现成功
