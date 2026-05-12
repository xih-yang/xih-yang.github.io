# 05、ActiveMQ 实战 - Java编码实现ActiveMQ通讯（Topic）
- 来源：https://ddkk.com/zhuanlan/mq/activemq/2/5.html
- 分类：消息队列
- 分组：教程目录
MQ遵循了JAVA EE的JMS规范，JMS规范架构如下：

ConnectionFactory加载MQ连接驱动，并创建Connnection连接对象（类似连接数据库时加载JDBC驱动，生成java.sql.Connection对象），由Connection对象创建Session会话对象，Session可以创建Message（消息），Message Producer（消息生产者）和Message Consumer（消息消费者）。Message Producer（消息生产者）将Message（消息）发送到Destination（目的地），Message Consumer（消息消费者）从Destination（目的地）中接受消息。

Destination即消息队列（Queue）和主题（Topic），存在一下两者模式：

**1、** 队列1对1模式：

消息发送者（Sender）将消息发送到队列（Queue），接受者（Receiver）从队列中接受消息，一个发送者发送给一个接收者。

**2、** 主题1对n模式：；

消息发布者（Publisher）将消息发布到指定的主题（Topic），订阅该主题的所有订阅者（Subscriber）从该主题中接受消息，一个发布者的消息可以被多个订阅者接受。

### 主题特点

**1、** 生产者将消息发布到topic中，每个消息可以有多个消费者，属于1：N的关系；

**2、** 生产者和消费者之间有时间上的相关性订阅某一个主题的消费者只能消费自它订阅之后发布的消息；

**3、** 生产者生产时，topic不保存消息它是无状态的不落地，假如无人订阅就去生产，那就是一条废消息，所以，一般先启动消费者再启动生产者；

JMS规范允许客户创建持久订阅，这在一定程度上放松了时间上的相关性要求。持久订阅允许消费者消费它在未处于激活状态时发送的消息。一句话，好比我们的微信公众号订阅

### 环境准备

JDK+ ActiveMQ服务 + Maven

- 构建ActiveMQDemo的Maven工程，Maven依赖如下：

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
public class JMSPublisher {
    // ActiveMQ服务地址
    public static final String ACTIVEMQ_URL = "tcp://192.168.64.129:61616";
    // 主题名称
    public static final String TOPIC_NAME = "topic-test";
    public static void main(String[] args) throws Exception {
        // 1.创建给定ActiveMQ服务连接工厂，使用默认的用户名和密码
        ActiveMQConnectionFactory activeMQConnectionFactory = new ActiveMQConnectionFactory(ACTIVEMQ_URL);
        // 2.通过连接工厂，创建连接对象并启动访问
        Connection connection = activeMQConnectionFactory.createConnection();
        connection.start();
        // 3.创建会话，第一个参数为是否开启事务，第二个参数为签收
        Session session = connection.createSession(false, Session.AUTO_ACKNOWLEDGE);
        // 4.创建目的地（队列或者主题）
        Topic topic = session.createTopic(TOPIC_NAME);
        // 可以用父接口Destination接受
        // Destination topic = session.createQueue(TOPIC_NAME);
        // 5.创建消息的生产者
        MessageProducer producer = session.createProducer(topic);
        // 6.通过消息生产者生产6条消息发送MQ队列
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

查看页面发现此时如果存在主题名称为topic-test有3条入队消息，则表示消息成功发送到了ActiveMQ。

队列表头说明：

表头名称
描述

Name
主题名称

Number Of Consumers
消费者数量，消费者端的消费者数量。

Messages Enqueued
进队消息数，进队列的总消息量，包括出队列的。这个数只增不减。

Messages Dequeued
出队消息数，可以理解为是消费者消费掉的数量。

### 消费者消费消息（同步阻塞）

```java
package com.huazai.activemq.demo;
import org.apache.activemq.ActiveMQConnectionFactory;
import javax.jms.*;
/**
 * @author DDKK.COM 弟弟快看，程序员编程资料站
 * @date 2022/12/24 22:09
 */
public class JMSSubscriber {
    // ActiveMQ服务地址
    public static final String ACTIVEMQ_URL = "tcp://192.168.64.129:61616";
    // 主题名称，取消息必须和存消息的主题名称一致
    public static final String TOPIC_NAME = "topic-test";
    public static void main(String[] args) throws Exception {
        // 1.创建给定ActiveMQ服务连接工厂，使用默认的用户名和密码
        ActiveMQConnectionFactory activeMQConnectionFactory = new ActiveMQConnectionFactory(ACTIVEMQ_URL);
        // 2.通过连接工厂，创建连接对象并启动访问
        Connection connection = activeMQConnectionFactory.createConnection();
        connection.start();
        // 3.创建会话，第一个参数为是否开启事务，第二个参数为签收
        Session session = connection.createSession(false, Session.AUTO_ACKNOWLEDGE);
        // 4.创建目的地（队列或者主题）
        Topic topic = session.createTopic(TOPIC_NAME);
        // 5.创建消费者
        MessageConsumer consumer = session.createConsumer(topic);
        while (true) {
            // 接受消息根据生产者发送消息类型强类型转换
            TextMessage message = (TextMessage) consumer.receive();
            if (message != null) {
                String text = message.getText();
                System.out.println(text);
            } else {
                break;
            }
        }
        consumer.close();
        session.close();
        connection.close();
    }
}
```

### 消费者消费消息之消息监听器（异步非阻塞）

```java
package com.huazai.activemq.demo;
import org.apache.activemq.ActiveMQConnectionFactory;
import javax.jms.*;
/**
 * @author DDKK.COM 弟弟快看，程序员编程资料站
 * @date 2022/12/24 22:09
 */
public class JMSSubscriberForListener {
    // ActiveMQ服务地址
    public static final String ACTIVEMQ_URL = "tcp://192.168.64.129:61616";
    // 主题名称，取消息必须和存消息的主题名称一致
    public static final String TOPIC_NAME = "topic-test";
    public static void main(String[] args) throws Exception {
        // 1.创建给定ActiveMQ服务连接工厂，使用默认的用户名和密码
        ActiveMQConnectionFactory activeMQConnectionFactory = new ActiveMQConnectionFactory(ACTIVEMQ_URL);
        // 2.通过连接工厂，创建连接对象并启动访问
        Connection connection = activeMQConnectionFactory.createConnection();
        connection.start();
        // 3.创建会话，第一个参数为是否开启事务，第二个参数为签收
        Session session = connection.createSession(false, Session.AUTO_ACKNOWLEDGE);
        // 4.创建目的地（队列或者主题）
        Topic topic = session.createTopic(TOPIC_NAME);
        // 5.创建消费者
        MessageConsumer consumer = session.createConsumer(topic);
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
        consumer.close();
        session.close();
        connection.close();
    }
}
```

由Topic的特性可知，先订阅然后再生产消息，否则生产的消息就是“垃圾消息”。

启动`JMSSubscriber`和`JMSSubscriberForListener`订阅消息，再启动`JMSPublisher`发布消息。

当`JMSPublisher`消息发布完后，`JMSSubscriber`和`JMSSubscriberForListener`都同时接受到了相同的消息。

此时，监控信息情况如下：

消费者：2

消息入队：3

消息出队：6（消费者*消息入队）

### Queue和Topic对比

比较项目
Topic模式
Queue模式

工作模式
"订阅-发布"模式，如果当前没有订阅者，消息将会被丢弃，如果有多个订阅者，那么这些订阅者都会收到消息
"负载均衡"模式，如果当前没有消费者，消息也不会丢弃；如果有多个消费者，那么一条消息也只会发送给其中一个消费者，并且要求消费者ack信息

有无状态
无状态
Queue数据默认会在mq服务器上已文件形式保存，比如Active MQ一般保存在$AMQ_HOME\data\kr-store\data下面，也可以配置成DB存储

传递完整性
如果没有订阅者，消息会被丢弃
消息不会被丢弃

处理效率
由于消息要按照订阅者的数量进行复制，所以处理性能会随着订阅者的增加而明显降低，并且还要结合不同消息协议自身的性能差异
由于一条消息只发送给一个消费者，所以就算消费者再多，性能也不会有明显降低。当然不同消息协议的具体性能也是有差异的

代码已上传至个人gitgub，地址：[https://github.com/SexCastException/ActiveMQ.git](https://github.com/SexCastException/ActiveMQ.git)
