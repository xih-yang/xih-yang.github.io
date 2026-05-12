# 04、RabbitMQ 工作模式 Work Queues
- 来源：https://ddkk.com/zhuanlan/mq/rabbitmq/1/4.html
- 分类：消息队列
- 分组：RabbitMQ 教程（版本 A）
## 1、work queues工作模式

**Work queues**，也被称为（**Task queues**），任务模型。当消息处理比较耗时的时候，可能生产消息的速度会远远大于消息的消费速度。长此以往，消息就会堆积越来越多，无法及时处理。此时就可以使用work 模型：**让多个消费者绑定到一个队列，共同消费队列中的消息**。队列中的消息一旦消费，就会消失，因此任务是不会被重复执行的。

**轮询分发消息**

一个生产者发送消息，由多个工作线程（消费者）轮询接收

## 2、在这个案例中我们会启动两个工作线程，一个消息发送线程，我们来看看他们两个工作线程是如何工作的。

### 2.1、编写工具类，提取重复代码

```java
package com.zww.spriong.rabbitmq.utils;
import com.rabbitmq.client.Channel;
import com.rabbitmq.client.Connection;
import com.rabbitmq.client.ConnectionFactory;
public class RabbitMQUtils {
    //得到一个连接的 channel
    public static Channel getChannel() throws Exception{
        //创建一个连接工厂
        ConnectionFactory factory = new ConnectionFactory();
        //工厂IP，连接RabbitMQ队列
        factory.setHost("192.168.137.4");
        //连接端口号
        factory.setPort(5672);
        //用户名
        factory.setUsername("admin");
        //密码
        factory.setPassword("123");
        //创建连接
        Connection connection = factory.newConnection();
        //获取信道
        Channel channel = connection.createChannel();
        return channel;
    }
}
```

### 2.2、编写消息发送线程，在控制台输入发送的消息

```java
package com.zww.spring.rabbitmq.two;
import com.rabbitmq.client.Channel;
import com.zww.spring.rabbitmq.utils.RabbitMQUtils;
import java.util.Scanner;
//生产者
public class Task01 {
    //队列名称
    public static final String QUEUE_NAME = "hello02";
    //发送大量消息
    public static void main(String[] args) throws Exception {
        Channel channel = RabbitMQUtils.getChannel();
        //声明队列
        channel.queueDeclare(QUEUE_NAME,false,false,false,null);
        //从控制台当中接收信息
        Scanner scanner = new Scanner(System.in);
        while (scanner.hasNext()){
            String message = scanner.next();
            /*
             *发送一次消费
             * 1.发送到哪个交换机
             * 2.路由的key值是哪个 本次是队列的名称
             * 3.其他参数信息
             * 4.发送消息的消息体
             * */
            channel.basicPublish("",QUEUE_NAME,null,message.getBytes());
            System.out.println("发送消息完成"+message);
        }
    }
}
```

### 2.3、编写两个接收消息的工作线程

```java
package com.zww.spring.rabbitmq.two;
import com.rabbitmq.client.CancelCallback;
import com.rabbitmq.client.Channel;
import com.rabbitmq.client.DeliverCallback;
import com.zww.spring.rabbitmq.utils.RabbitMQUtils;
//工作线程
public class Worker01 {
    //队列名称
    public static final String QUEUE_NAME = "hello02";
    public static void main(String[] args) throws Exception {
        Channel channel = RabbitMQUtils.getChannel();
        //接收消息
        DeliverCallback deliverCallback = (consumerTag,message) ->{
            System.out.println("接收到的消息"+new String(message.getBody()));
        };
        //消息接收被取消时，执行下面的内容
        CancelCallback cancelCallback =(consumerTag) -> {
            System.out.println(consumerTag+"：消息取消消费接口回调逻辑");
        };
        System.out.println("C1等待接收消息");
        //消息接收
        /*
         * 消费者消费消息
         * 1.消费哪个队列
         * 2.消费成功之后是否要自动应答 true自动应答 false手动应答
         * 3.消费者未成功消费的回调
         * 4.消费者取消消费的回调
         * */
        channel.basicConsume(QUEUE_NAME,true,deliverCallback,cancelCallback);
    }
}
```

```java
package com.zww.spring.rabbitmq.two;
import com.rabbitmq.client.CancelCallback;
import com.rabbitmq.client.Channel;
import com.rabbitmq.client.DeliverCallback;
import com.zww.spring.rabbitmq.utils.RabbitMQUtils;
//工作线程
public class Worker02 {
        //队列名称
        public static final String QUEUE_NAME = "hello02";
        public static void main(String[] args) throws Exception {
            Channel channel = RabbitMQUtils.getChannel();
            //接收消息
            DeliverCallback deliverCallback = (consumerTag, message) ->{
                System.out.println("接收到的消息"+new String(message.getBody()));
            };
            //消息接收被取消时，执行下面的内容
            CancelCallback cancelCallback =(consumerTag) -> {
                System.out.println(consumerTag+"：消息取消消费接口回调逻辑");
            };
            System.out.println("C2等待接收消息");
            //消息接收
            /*
             * 消费者消费消息
             * 1.消费哪个队列
             * 2.消费成功之后是否要自动应答 true自动应答 false手动应答
             * 3.消费者未成功消费的回调
             * 4.消费者取消消费的回调
             * */
            channel.basicConsume(QUEUE_NAME,true,deliverCallback,cancelCallback);
        }
}
```

### 2.4、先启动消息发送线程创建hello02信道，再启动两个接收消息的工作线程

### 2.5、在消息发送线程控制台输入以下内容

### 2.6、查看两个工作线程分别接收到的消息

哪个线程先启动，哪个最先接收消息！

> 版权声明：「DDKK.COM 弟弟快看，程序员编程资料站」本站文章，版权归原作者所有
