# 05、RabbitMQ 实战 - 使用Java实现RabbitMQ的消费者接收消息
- 来源：https://ddkk.com/zhuanlan/mq/rabbitmq/2/5.html
- 分类：消息队列
- 分组：教程目录
前言：先简单了解RabbitMQ的工作过程，方便后续开发理清思路

简略：

详细：

**1、** 新建消费者类；

效果图：

**2、** 编写消费者消费消息的代码；

```java
package com.ken;
import com.rabbitmq.client.*;
/**
 * 消费者
 */
public class Consumer {
    //队列名称（用于指定往哪个队列接收消息）
    public static final String QUEUE_NAME = "my_queue";
    //进行接收操作
    public static void main(String[] args) throws Exception{
        //创建一个连接工厂
        ConnectionFactory factory = new ConnectionFactory();
        //设置工厂IP，用于连接RabbitMQ的队列
        factory.setHost("192.168.194.150");
        //设置连接RabbitMQ的用户名
        factory.setUsername("admin");
        //设置连接RabbitMQ的密码
        factory.setPassword("123456");
        //创建连接
        Connection connection = factory.newConnection();
        //获取信道
        Channel channel = connection.createChannel();
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
        DeliverCallback deliverCallback = (consumerTag,message) -> {
            System.out.println(new String(message.getBody()));
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
            System.out.println("取消消费消息");
        };
        /**
         * 用信道对消息进行接收
         * 第一个参数：消费的是哪一个队列的消息
         * 第二个参数：消费成功后是否要自动应答，true代表自动应当，false代表手动应答
         * 第三个参数：消费者接收消息后的回调方法
         * 第四个参数：消费者取消接收消息后的回调方法（正常接收不调用）
         */
        channel.basicConsume(QUEUE_NAME,true,deliverCallback,cancelCallback);
    }
}
```

例：

**3、** 查看代码运行结果；

运行代码后如果有输出生产者发送的”Hello World”信息，则证明消费者消费消息成功

**4、** 在web页面上查看队列的消息；

可以看到队列里的消息条数为0条，这也证明了消费者消费消息成功了
