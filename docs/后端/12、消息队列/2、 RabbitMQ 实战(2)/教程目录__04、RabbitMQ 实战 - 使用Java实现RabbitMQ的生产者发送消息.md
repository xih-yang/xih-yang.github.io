# 04、RabbitMQ 实战 - 使用Java实现RabbitMQ的生产者发送消息
- 来源：https://ddkk.com/zhuanlan/mq/rabbitmq/2/4.html
- 分类：消息队列
- 分组：教程目录
前言：先简单了解RabbitMQ的工作过程，方便后续开发理清思路

简略：

详细：

**1、** 新建生产者类；

效果图:

**2、** 编写生产者发送消息的代码；

```java
package com.ken;
import com.rabbitmq.client.Channel;
import com.rabbitmq.client.Connection;
import com.rabbitmq.client.ConnectionFactory;
/**
 * 生产者
 */
public class Producer {
    //队列名称（用于指定往哪个队列发送消息）
    public static final String QUEUE_NAME = "my_queue";
    //进行发送操作
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
         * 创建队列
         * 第一个参数：队列名称
         * 第二个参数：服务器重启后队列是否还存在，即队列是否持久化,true为是，false为否，默认false，即消息存储在内存中而不是硬盘中
         * 第三个参数：该队列是否只供一个消费者进行消费，是否进行消息共享，true为只允许一个消费者进行消费，false为允许多个消费者对队列进行消费，默认false
         * 第四个参数：是否自动删除，最后一个消费者断开连接后该队列是否自动删除，true自动删除，false不自动删除
         * 第五个参数：其他参数
         */
        channel.queueDeclare(QUEUE_NAME,false,false,false,null);
        //发消息
        String message = "Hello World";
        /**
         * 用信道对消息进行发布
         * 第一个参数：发送到哪个交换机
         * 第二个参数：路由的Key值是哪个，本次是队列名
         * 第三个参数：其他参数信息
         * 第四个参数：发送消息的消息体
         */
        channel.basicPublish("",QUEUE_NAME,null,message.getBytes());
        System.out.println("消息发送成功！");
    }
}
```

例：

**3、** 查看代码运行结果；

运行代码后如果有输出”消息发送成功”的信息，则证明生产者发送消息成功

例:

**4、** 在web页面上查看生成的队列；

效果图：

其中Ready是指准备被消费的消息，这里有1条消息准备被消费，Total是指消息总条数
