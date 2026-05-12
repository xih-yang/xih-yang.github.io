# 03、RabbitMQ 简单工作模式 Hello World
- 来源：https://ddkk.com/zhuanlan/mq/rabbitmq/1/3.html
- 分类：消息队列
- 分组：RabbitMQ 教程（版本 A）
**hello world简单工作模式**

在上图的模型中，有以下概念：

- P：生产者，也就是要发送消息的程序
- C：消费者：消息的接受者，会一直等待消息到来。
- queue：消息队列，图中红色部分。类似一个邮箱，可以缓存消息；生产者向其中投递消息，消费者从其中取出消息。

## 1、导入相关依赖

```xml
<dependencies>
    <!--rabbitmq依赖客户端-->
    <dependency>
        <groupId>com.rabbitmq</groupId>
        <artifactId>amqp-client</artifactId>
        <version>5.9.0</version>
    </dependency>
    <!--操作文件流依赖-->
    <dependency>
        <groupId>commons-io</groupId>
        <artifactId>commons-io</artifactId>
        <version>2.6</version>
    </dependency>
</dependencies>
```

## 2、编写生产者

```java
package com.zww.spring.rabbitmq.one;
import com.rabbitmq.client.Channel;
import com.rabbitmq.client.Connection;
import com.rabbitmq.client.ConnectionFactory;
import java.io.IOException;
import java.util.concurrent.TimeoutException;
public class Producer {
    //队列名称
    public static final String QUEUE_NAME = "hello";
    //发消息
    public static void main(String[] args) throws IOException, TimeoutException {
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
        /*
        * 生成一个队列
        * 1.队列名称
        * 2.队列里面的消息是否持久化（存储在磁盘），默认情况消息存储在内存中
        * 3.该队列是否只供一个消费者进行消费，是否进行消息共享。true可以多个消费者消费，false只能一个消费者消费
        * 4.最后一个消费者端开链接以后该队列是否自动删除 true自动删除 false不自动删除
        * */
        channel.queueDeclare(QUEUE_NAME,false,false,false,null);
        //发消息
        String message = "hello world";
        /*
        *发送一次消费
        * 1.发送到哪个交换机
        * 2.路由的key值是哪个 本次是队列的名称
        * 3.其他参数信息
        * 4.发送消息的消息体
        * */
        channel.basicPublish("",QUEUE_NAME,null,message.getBytes());
        System.out.println("消息发送完毕");
    }
}
```

## 3、运行生产者查看rabbitMQ管理界面

## 4、编写消费者

```java
package com.zww.spring.rabbitmq.one;
import com.rabbitmq.client.*;
import java.io.IOException;
import java.util.concurrent.TimeoutException;
public class Consumer {
    //队列名称
    public static final String QUEUE_NAME = "hello";
    //接收消息
    public static void main(String[] args) throws IOException, TimeoutException {
        //创建连接工厂
        ConnectionFactory factory = new ConnectionFactory();
        factory.setHost("192.168.137.4");
        factory.setPort(5672);
        factory.setUsername("admin");
        factory.setPassword("123");
        Connection connection = factory.newConnection();
        Channel channel = connection.createChannel();
        //声明接收消息
        DeliverCallback deliverCallback = (consumerTag,message) -> {
            System.out.println(new String(message.getBody()));
        };
        //取消消息时的回调
        CancelCallback cancelCallback = consumerTag -> {
            System.out.println("消息消费被中断");
        };
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

## 5、消费者消费生产者的消息

> 版权声明：「DDKK.COM 弟弟快看，程序员编程资料站」本站文章，版权归原作者所有
