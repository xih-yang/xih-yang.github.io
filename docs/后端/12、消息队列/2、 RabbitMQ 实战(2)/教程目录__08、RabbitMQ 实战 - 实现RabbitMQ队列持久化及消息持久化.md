# 08、RabbitMQ 实战 - 实现RabbitMQ队列持久化及消息持久化
- 来源：https://ddkk.com/zhuanlan/mq/rabbitmq/2/8.html
- 分类：消息队列
- 分组：教程目录
概念：在上一章文章中我们演示了消费者宕机的情况下消息没有被消费成功后会重新入队，然后再被消费，但如何保障RabbitMQ服务停掉的情况下，生产者发过来的消息不会丢失，这时候我们为了消息不会丢失就需要将队列和消息都标记为持久化。

**1、** 实现RabbitMQ队列持久化；

只需要把queueDeclare方法的第二个参数改为true即可对Queue进行持久化

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
    public static final String QUEUE_NAME = "durable_queue";
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
         * 创建队列（持久化队列）
         * 第一个参数：队列名称
         * 第二个参数：服务器重启后队列是否还存在，即队列是否持久化,true为是，false为否，默认false，即消息存储在内存中而不是硬盘中
         * 第三个参数：该队列是否只供一个消费者进行消费，是否进行消息共享，true为只允许一个消费者进行消费，false为允许多个消费者对队列进行消费，默认false
         * 第四个参数：是否自动删除，最后一个消费者断开连接后该队列是否自动删除，true自动删除，false不自动删除
         * 第五个参数：其他参数
         */
        channel.queueDeclare(QUEUE_NAME,true,false,false,null);
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

效果图：

只要Features这个属性的值为D，则证明队列持久化成功

**2、** 实现RabbitMQ消息持久化；

只需要往basicPublish方法的第三个参数传MessageProperties.PERSISTENT_TEXT_PLAIN，即可对消息进行持久化这个参数能告诉RabbitMQ将消息保存到磁盘里进行持久化处理，但值得注意的是将消息标记为持久化不能完全保证消息不会丢失，因为存在消息刚准备存储到磁盘里，但未完全存储完的时间间隔，这时候如果宕机了就不能保证消息真正的写入磁盘重从而实现持久化，但对于简单任务队列而言，这种持久化策略已经够用了

```java
package com.ken;
import com.rabbitmq.client.Channel;
import com.rabbitmq.client.Connection;
import com.rabbitmq.client.ConnectionFactory;
import com.rabbitmq.client.MessageProperties;
/**
 * 生产者
 */
public class Producer {
    //队列名称（用于指定往哪个队列发送消息）
    public static final String QUEUE_NAME = "durable_queue";
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
        channel.queueDeclare(QUEUE_NAME,false ,false,false,null);
        //发消息
        String message = "Hello World";
        /**
         * 用信道对消息进行发布（消息持久化，把消息保存到磁盘里，不设置则保存到内存里，容易丢失）
         * 第一个参数：发送到哪个交换机
         * 第二个参数：路由的Key值是哪个，本次是队列名
         * 第三个参数：其他参数信息
         * 第四个参数：发送消息的消息体
         */
        channel.basicPublish("",QUEUE_NAME, MessageProperties.PERSISTENT_TEXT_PLAIN,message.getBytes());
        System.out.println("消息发送成功！");
    }
}
```

其他：

**1、** 出现报错信息：；

```java
Caused by: com.rabbitmq.client.ShutdownSignalException: channel error; protocol method:method<channel.close>(reply-code=406, reply-text=PRECONDITION_FAILED - inequivalent arg 'durable' for queue 'durable_queue' in vhost '/': received 'true' but current is 'false', class-id=50, method-id=10)
```

原因：

当前队列是未持久化的，需要删除队列然后改成持久化才能重新生效

删除队列:

(1)点击要删除的队列

(2)找到Delete Queue的按钮

(3)点击确认删除
