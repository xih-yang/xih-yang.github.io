# 04、ActiveMQ 实战 - Java编码实现ActiveMQ通讯（Topic）
- 来源：https://ddkk.com/zhuanlan/mq/activemq/3/4.html
- 分类：消息队列
- 分组：教程目录
### 说明

在上一篇 [ActiveMQ 实战 - Java编码实现ActiveMQ通讯（Queue）](/zhuanlan/mq/activemq/3/3.html)中，关于JMS架构和一些理念已经讲过了，详细看这篇文章，这里不再赘述

### 队列特点

每个消息只能有一个消费者，类似于1对1的关系。好比个人快递自己领自己的。

消息的生产者和消费者之间没有时间上的相关性。无论消费者在生产者发送消息的时候是否处于运行状态，消费者都可以提取消息。好比我们的发送短信，发送者发送后不见得接收者会即收即看。

消息被消费后队列中不会再存储，所以消费者不会消费到已经被消费掉的消息。

### 小总结

其实Topic队列的代码与Queue的代码，仅仅在一行代码不一样，其他都不一样

那就是在创建队列时调用的方法

```java
 // 4 创建目的地 （两种 ： 队列/主题   这里用主题）
 Topic topic = session.createTopic(TOPIC_NAME);
```

```java
// 4 创建目的地 （两种 ： 队列/主题   这里用队列）
Queue queue = session.createQueue(QUEUE_NAME);
```

因此，几乎两者的代码都是一样的，全部Copy自上一篇文章

### 环境准备

JDK+ ActiveMQ服务 + Maven

构建ActiveMQDemo的Maven工程，Maven依赖如下：

```xml
<!--  activemq  所需要的jar 包-->
<dependency>
  <groupId>org.apache.activemq</groupId>
  <artifactId>activemq-all</artifactId>
  <version>5.15.9</version>
</dependency>
<!--  activemq 和 spring 整合的基础包 -->
<dependency>
  <groupId>org.apache.xbean</groupId>
  <artifactId>xbean-spring</artifactId>
  <version>3.16</version>
</dependency>
```

### 生产者生产消息

```java
package com.at.activemq.queue;
import org.apache.activemq.ActiveMQConnectionFactory;
import javax.jms.*;
public class JmsProduce {
            //  linux 上部署的activemq 的 IP 地址 + activemq 的端口号，如果用自己的需要改动
    public static final String ACTIVEMQ_URL = "tcp://47.98.163.118:61616";
    // public static final String ACTIVEMQ_URL = "nio://47.98.163.118:61608";
    public static final String QUEUE_NAME = "jdbc01";
    public static void main(String[] args) throws  Exception{
        // 1 按照给定的url创建连接工程，这个构造器采用默认的用户名密码
        ActiveMQConnectionFactory activeMQConnectionFactory = new ActiveMQConnectionFactory(ACTIVEMQ_URL);
        // 设置允许有数据丢失
      // activeMQConnectionFactory.setUseAsyncSend(true);
        // 2 通过连接工厂连接 connection  和 启动
        javax.jms.Connection connection = activeMQConnectionFactory.createConnection();
        //  启动
        connection.start();
        // 3 创建回话  session
        // 两个参数，第一个事务， 第二个签收
        Session session = connection.createSession(false,Session.AUTO_ACKNOWLEDGE);
         // 4 创建目的地 （两种 ： 队列/主题   这里用主题）
        Topic topic = session.createTopic(TOPIC_NAME);
        // 5 创建消息的生产者
        MessageProducer messageProducer = session.createProducer(topic);
        // 非持久化消息 和持久化消息演示
        messageProducer.setDeliveryMode(DeliveryMode.PERSISTENT);   // 持久化  如果开启
                                                        //       就会存入文件或数据库中
        // 6 通过messageProducer 生产 3 条 消息发送到消息队列中
        for (int i = 1; i < 4 ; i++) {
            // 7  创建字消息
            TextMessage textMessage = session.createTextMessage("msg--" + i);
            // 8  通过messageProducer发布消息
            messageProducer.send(textMessage);
        }
        // 9 关闭资源
        messageProducer.close();
        session.close();
        connection.close();
       // session.commit();
        System.out.println("  **** 消息发送到MQ完成 ****");
    }
}
```

点击运行，无异常打印，并且控制台成功打印finish，则表示程序运行成功。

查看页面发现此时如果存在队列名称为topic-test有3条未读消息，则表示消息成功发送到了ActiveMQ。

队列表头说明：

由类的结构图可知，队列（Queue）和主题（Topic）拥有共同的父接口（Destination）

### 消费者消费消息（同步阻塞）

```java
package  com.at.activemq.queue;
import org.apache.activemq.ActiveMQConnectionFactory;
import javax.jms.*;
// 消息的消费者  也就是回答消息的系统
public class JmsConsumer {
	//  linux 上部署的activemq 的 IP 地址 + activemq 的端口号，如果用自己的需要改动
	public static final String ACTIVEMQ_URL = "tcp://47.98.163.118:61616";
	// public static final String ACTIVEMQ_URL = "nio://47.98.163.118:61608";
	public static final String QUEUE_NAME = "jdbc01";
    public static void main(String[] args) throws Exception{
        System.out.println(" 这里是 1 号 消费者 ");
        // 1 按照给定的url创建连接工程，这个构造器采用默认的用户名密码
        ActiveMQConnectionFactory activeMQConnectionFactory = new ActiveMQConnectionFactory(ACTIVEMQ_URL);
        // 2 通过连接工厂连接 connection  和 启动
        javax.jms.Connection connection = activeMQConnectionFactory.createConnection();
        //  启动
        connection.start();
        // 3 创建回话  session
        // 两个参数，第一个事务， 第二个签收
        Session session = connection.createSession(false, Session.AUTO_ACKNOWLEDGE);
        // 4 创建目的地 （两种 ： 队列/主题   这里用主题）
        Topic topic = session.createTopic(TOPIC_NAME);
        // 5 创建消息的消费者
        MessageConsumer messageConsumer = session.createConsumer(topic);
         /* 同步阻塞方式reveive()   空参数的receive方法是阻塞，有参数的为等待时间
          订阅者或消费者使用MessageConsumer 的receive() 方法接收消息，receive 在接收之前一直阻塞		      */
         while(true){
            // 这里是 TextMessage 是因为消息发送者是 TextMessage ， 接受处理的
            // 也应该是这个类型的消息
            TextMessage message = (TextMessage)messageConsumer.receive();  
            System.out.println("****消费者的消息："+message.getText());
        }
    }
}
```

此时消息队列中情况如下：

未出队数量（未读）：0

消费者数量：1 （Java程序仍然连接着ActiveMQ）

累计入队数量：3

累计出队数量：3

Java操作ActiveMQ的API中存在很多重载方法，难度不高，感兴趣的同学们可自行研究。

### 消费者消费消息之消息监听器（异步非阻塞）

```java
package  com.at.activemq.queue;
import org.apache.activemq.ActiveMQConnectionFactory;
import javax.jms.*;
// 消息的消费者  也就是回答消息的系统
public class JmsConsumer {
	//  linux 上部署的activemq 的 IP 地址 + activemq 的端口号，如果用自己的需要改动
	public static final String ACTIVEMQ_URL = "tcp://47.98.163.118:61616";
	// public static final String ACTIVEMQ_URL = "nio://47.98.163.118:61608";
	public static final String QUEUE_NAME = "jdbc01";
    public static void main(String[] args) throws Exception{
        System.out.println(" 这里是 1 号 消费者 ");
        // 1 按照给定的url创建连接工程，这个构造器采用默认的用户名密码
        ActiveMQConnectionFactory activeMQConnectionFactory = new ActiveMQConnectionFactory(ACTIVEMQ_URL);
        // 2 通过连接工厂连接 connection  和 启动
        javax.jms.Connection connection = activeMQConnectionFactory.createConnection();
        //  启动
        connection.start();
        // 3 创建回话  session
        // 两个参数，第一个事务， 第二个签收
        Session session = connection.createSession(false, Session.AUTO_ACKNOWLEDGE);
       // 4 创建目的地 （两种 ： 队列/主题   这里用主题）
        Topic topic = session.createTopic(TOPIC_NAME);
        // 5 创建消息的消费者
        MessageConsumer messageConsumer = session.createConsumer(topic );
         /* 同步阻塞方式reveive()   空参数的receive方法是阻塞，有参数的为等待时间
          订阅者或消费者使用MessageConsumer 的receive() 方法接收消息，receive 在接收之前一直阻塞*/
        // 通过监听的方式来消费消息
        // 通过异步非阻塞的方式消费消息
        // 通过messageConsumer 的setMessageListener 注册一个监听器，
        // 当有消息发送来时，系统自动调用MessageListener 的 onMessage 方法处理消息
        messageConsumer.setMessageListener(new MessageListener() {
            public void onMessage(Message message)  {
                    if (null != message  && message instanceof TextMessage){
                        TextMessage textMessage = (TextMessage)message;
                        try {
                     System.out.println("****消费者的消息："+textMessage.getText());
                    }catch (JMSException e) {
                            e.printStackTrace();
                        }
                }
            }
        });
        // 保证控制台不灭  不然activemq 还没连上就关掉了连接
        System.in.read();
        messageConsumer.close();
        session.close();
        connection.close();
    }
}
```

### 特别注意

由Topic的特性可知，先订阅然后再生产消息，否则生产的消息就是“垃圾消息”。

启动JMSSubscriber和JMSSubscriberForListener订阅消息，再启动JMSPublisher发布消息。

此时，监控信息情况如下：

消费者：2

消息入队：3

消息出队：6（消费者*消息入队）

### 总结

Queue和Topic对比
