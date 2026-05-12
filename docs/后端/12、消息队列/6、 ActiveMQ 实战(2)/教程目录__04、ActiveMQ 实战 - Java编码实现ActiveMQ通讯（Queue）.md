# 04、ActiveMQ 实战 - Java编码实现ActiveMQ通讯（Queue）
- 来源：https://ddkk.com/zhuanlan/mq/activemq/2/4.html
- 分类：消息队列
- 分组：教程目录
MQ遵循了JAVA EE的JMS规范，JMS规范架构如下：

ConnectionFactory加载MQ连接驱动，并创建Connnection连接对象（类似连接数据库时加载JDBC驱动，生成java.sql.Connection对象），由Connection对象创建Session会话对象，Session可以创建Message（消息），Message Producer（消息生产者）和Message Consumer（消息消费者）。Message Producer（消息生产者）将Message（消息）发送到Destination（目的地），Message Consumer（消息消费者）从Destination（目的地）中接受消息。

Destination即消息队列（Queue）和主题（Topic），存在一下两者模式：

**1、** 队列1对1模式：

消息发送者（Sender）将消息发送到队列（Queue），接受者（Receiver）从队列中接受消息，一个发送者发送给一个接收者。

**2、** 主题1对n模式：

消息发布者（Publisher）将消息发布到指定的主题（Topic），订阅该主题的所有订阅者（Subscriber）从该主题中接受消息，一个发布者的消息可以被多个订阅者接受。

### 队列特点

**1、** 每个消息只能有一个消费者，类似于1对1的关系好比个人快递自己领自己的；

**2、** 消息的生产者和消费者之间没有时间上的相关性无论消费者在生产者发送消息的时候是否处于运行状态，消费者都可以提取消息好比我们的发送短信，发送者发送后不见得接收者会即收即看；

**3、** 消息被消费后队列中不会再存储，所以消费者不会消费到已经被消费掉的消息；

### 环境准备

JDK+ ActiveMQ服务 + Maven

构建ActiveMQDemo的Maven工程，Maven依赖如下：

```java
<!-- https://mvnrepository.com/artifact/org.apache.activemq/activemq-all -->
<dependency>
    <groupId>org.apache.activemq</groupId>
    <artifactId>activemq-all</artifactId>
    <version>5.15.11</version>
</dependency>
<!-- https://mvnrepository.com/artifact/org.apache.xbean/xbean-spring -->
<dependency>
    <groupId>org.apache.xbean</groupId>
    <artifactId>xbean-spring</artifactId>
    <version>4.15</version>
</dependency>
```

### 生产者生产消息

```java
package com.huazai.activemq.demo;
import org.apache.activemq.ActiveMQConnectionFactory;
import javax.jms.*;
/**
 * @author DDKK.COM 弟弟快看，程序员编程资料站
 * @date 2022/12/23 23:21
 */
public class JMSProducer {
    // ActiveMQ服务地址
    public static final String ACTIVEMQ_URL = "tcp://192.168.64.129:61616";
    // 消息队列名称
    public static final String QUEUE_NAME = "queue01";
    public static void main(String[] args) throws Exception {
        // 1.创建给定ActiveMQ服务连接工厂，使用默认的用户名和密码
        ActiveMQConnectionFactory activeMQConnectionFactory = new ActiveMQConnectionFactory(ACTIVEMQ_URL);
        // 2.通过连接工厂，创建连接对象并启动访问
        Connection connection = activeMQConnectionFactory.createConnection();
        connection.start();
        // 3.创建会话，第一个参数为是否开启事务，第二个参数为签收
        Session session = connection.createSession(false, Session.AUTO_ACKNOWLEDGE);
        // 4.创建目的地（队列或者主题）
        Queue queue = session.createQueue(QUEUE_NAME);
        // 可以用父接口Destination接受
        // Destination queue = session.createQueue(QUEUE_NAME);
        // 5.创建消息的生产者
        MessageProducer producer = session.createProducer(queue);
        // 6.通过消息生产者生产3条消息发送MQ队列
        for (int i = 0; i < 3; i++) {
            // 7.创建消息
            TextMessage textMessage = session.createTextMessage("msg" + i + ":hello world");
            // 8.将消息发送到MQ
            producer.send(textMessage);
        }
        // 9.关闭资源
        producer.close();
        session.close();
        connection.close();
        System.out.println("finish");
    }
}
```

点击运行，无异常打印，并且控制台成功打印finish，则表示程序运行成功。

查看页面发现此时如果存在队列名称为`queque01`有3条未读消息，则表示消息成功发送到了ActiveMQ。

队列表头说明：

表头名称
描述

Name
队列名称。

Number Of Pending Messages
等待消费的消息，这个是未出队列的数量（类似未读消息数量），公式：未出队列的数量=总入队数-总出队数。

Number Of Consumers
消费者数量，消费者端的消费者数量。

Messages Enqueued
进队消息数，进队列的总消息量，包括出队列的。这个数只增不减。

Messages Dequeued
出队消息数，可以理解为是消费者消费掉的数量。

由类的结构图可知，队列（Queue）和主题（Topic）拥有共同的父接口（Destination）

### 消费者消费消息（同步阻塞）

```java
package com.huazai.activemq.demo;
import org.apache.activemq.ActiveMQConnectionFactory;
import javax.jms.*;
/**
 * @author DDKK.COM 弟弟快看，程序员编程资料站
 * @date 2022/12/24 22:09
 */
public class JMSConsumer {
    // ActiveMQ服务地址
    public static final String ACTIVEMQ_URL = "tcp://192.168.64.129:61616";
    // 消息队列名称，取消息必须和存消息的队列名称一致
    public static final String QUEUE_NAME = "queue01";
    public static void main(String[] args) throws Exception {
        // 1.创建给定ActiveMQ服务连接工厂，使用默认的用户名和密码
        ActiveMQConnectionFactory activeMQConnectionFactory = new ActiveMQConnectionFactory(ACTIVEMQ_URL);
        // 2.通过连接工厂，创建连接对象并启动访问
        Connection connection = activeMQConnectionFactory.createConnection();
        connection.start();
        // 3.创建会话，第一个参数为是否开启事务，第二个参数为签收
        Session session = connection.createSession(false, Session.AUTO_ACKNOWLEDGE);
        // 4.创建目的地（队列或者主题）
        Queue queue = session.createQueue(QUEUE_NAME);
        // 5.创建消费者
        MessageConsumer consumer = session.createConsumer(queue);
        while (true) {
            // 接受消息根据生产者发送消息类型强类型转换，一直阻塞在此，知道队列中有消息接受。
            TextMessage message = (TextMessage) consumer.receive();
            if (message != null) {
                String text = message.getText();
                System.out.println(text);
            } else {
                break;
            }
        }
        // 关闭资源
        consumer.close();
        session.close();
        connection.close();
    }
}
```

如果控制台打印一下信息，则表示从消息队列中成功读取消息。

此时消息队列中情况如下：

未出队数量（未读）：0

消费者数量：1 （Java程序仍然连接着ActiveMQ）

累计入队数量：3

累计出队数量：3

Java操作ActiveMQ的API中存在很多重载方法，难度不高，感兴趣的同学们可自行研究。

### 消费者消费消息之消息监听器（异步非阻塞）

```java
package com.huazai.activemq.demo;
import org.apache.activemq.ActiveMQConnectionFactory;
import javax.jms.*;
/**
 * @author DDKK.COM 弟弟快看，程序员编程资料站
 * @date 2022/12/24 22:09
 */
public class JMSConsumerForListener {
    // ActiveMQ服务地址
    public static final String ACTIVEMQ_URL = "tcp://192.168.64.129:61616";
    // 消息队列名称，取消息必须和存消息的队列名称一致
    public static final String QUEUE_NAME = "queue01";
    public static void main(String[] args) throws Exception {
        // 1.创建给定ActiveMQ服务连接工厂，使用默认的用户名和密码
        ActiveMQConnectionFactory activeMQConnectionFactory = new ActiveMQConnectionFactory(ACTIVEMQ_URL);
        // 2.通过连接工厂，创建连接对象并启动访问
        Connection connection = activeMQConnectionFactory.createConnection();
        connection.start();
        // 3.创建会话，第一个参数为是否开启事务，第二个参数为签收
        Session session = connection.createSession(false, Session.AUTO_ACKNOWLEDGE);
        // 4.创建目的地（队列或者主题）
        Queue queue = session.createQueue(QUEUE_NAME);
        // 5.创建消费者
        MessageConsumer consumer = session.createConsumer(queue);
        /*
            异步非阻塞式方式监听器(onMessage)
            订阅者或消费者通过创建的消费者对象,给消费者注册消息监听器setMessageListener,
            当消息有消息的时候,系统会自动调用MessageListener类的onMessage方法
            我们只需要在onMessage方法内判断消息类型即可获取消息
         */
        consumer.setMessageListener(message -> {
            if (message != null && message instanceof TextMessage) {
                TextMessage textMessage = (TextMessage) message;
                try {
                    System.out.println("监听器接受到的消息：" + textMessage.getText());
                } catch (JMSException e) {
                    e.printStackTrace();
                }
            }
        });
        /*
            由于是异步接受消息，会发生监听器没监听到消息之前程序就已经运行完毕，
            所以通过此行代码阻塞程序等到监听器监听并回调，可在控制台输入任意字符并回车结束程序运行
         */
        System.in.read();
        // 关闭资源
        consumer.close();
        session.close();
        connection.close();
    }
}
```

### 三大消费情况

**1、** 先生产，只启动1号消费者，1号消费者能消费者？

运行之前编写生产者`JMSProducer`生产3条消息消息。

再运行其中一个消费者消费消息。

答案：1号消费者能消费。

**2、** 先生产，先启动1号消费者，再启动2号消费者，2号消费者还能消费消息吗？；

验证此问题，需要对同一个消费者类启动两次main方法，IDEA默认只能启动一次。解决此问题需要勾选`Allow parallel run`。

和以上相同方式启动生产者`JMSProducer`生产3条消息。

第一次启动`JMSConsumerForListener`消费消息。

第二次启动`JMSConsumerForListener`消费消息。

答案：队列里消息已被先启动的1号消费者消费掉了，2号消费者再启动无消息消费。

**3、** 先启动2个消费者，再生产6条消息，消费情况如何？；

选项：A. 只1号消费者消费 B.只2号消费者消费 C.都能消费 D.都不能消费

启动2次`JMSConsumerForListener`消费者等待消息消费。

启动生产者生产6条消息。

2个消费者消费情况如下：

答案：C（负载均衡）

### 总结

**1、** JMS开发基本步骤；

1：创建一个connection factory

2：通过connection factory来创建JMS connection

3：启动JMS connection

4：通过JMS connection创建JMS session

5：通过JMS session创建JMS destination（目的地 队列/主题）

6：通过JMS session创建JMS producer或者创建JMS consume并设置destination

7：JMS consumer同步接受或者注册一个JMS message listener异步接受JMS message

8：发送(send)或者接收(receive)JMS message

9：关闭所有JMS资

此图可与JMS架构规范图做参考对比。

**2、** 两种消费方式；

1：同步阻塞方式(receive)

订阅者或接收者抵用MessageConsumer的receive()方法来接收消息，receive方法在能接收到消息之前（或超时之前）将一直阻塞

2：异步非阻塞方式（监听器onMessage()）

订阅者或接收者通过MessageConsumer的setMessageListener(MessageListener listener)注册一个消息监听器，

当消息到达之后，系统会自动调用监听器MessageListener的onMessage(Message message)方法。

代码已上传至个人gitgub，地址：[https://github.com/SexCastException/ActiveMQ.git](https://github.com/SexCastException/ActiveMQ.git)
