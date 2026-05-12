# 05、ActiveMQ 实战 - JMS规范和落地产品
- 来源：https://ddkk.com/zhuanlan/mq/activemq/3/5.html
- 分类：消息队列
- 分组：教程目录
### 体会一下两道死坑问题

## 1. 什么是JAVASE

JavaEE是一套使用Java进行企业级应用开发的大家一致遵循的13个核心规范工业标准（JMS只是其中一个）。JavaEE平台提供了一个基于组件的方法来加快设计，开发。装配及部署企业应用程序。

> JDBC（Java Databease）数据库连接
>
> JNDI（Java Naming and Directory Interfaces）Java命名和目录接口
>
> EJB（Enterprise JavaBean）
>
> RMI（Remote Method Invoke）远程方法调用
>
> Java IDL（Interface Description Language）/CORBA（Common Object Broker Architecture）接口定义语言/共用对象请求代理程序体系结构
>
> JSP（Java Server Page）
>
> Java Servlet
>
> XML（Extensible Markup Language）可扩展标记语言
>
> JMS（Java Message Service）Java消息服务
>
> JTA（Java Transaction API）Java事务API
>
> JTS（Java Transaction Service）Java事务服务
>
> JavaMail
>
> JAF（JavaBean Activation Framework）

## 2. 什么是JMS

JMS（Java Message Service）：即Java消息服务，指的是两个应用程序之间进行异步通信的API，它为标准协议和消息服务提供了一组通用接口，包括创建、发送、读取消息等，用于支持Java应用程序开发。在JavaEE中，当两个应用程序使用JMS进行通信时，它们之间不是直接相连的，而是通过一个共同的消息收发服务组件关联起来以达到解耦/异步削峰的效果。

### JMS中的角色（从上图可知）

JMSProvider、JMS Producer、JMS Consumer、JMS Message （下面会详细讲）

### JMS落地产品 ~ 常用MQ产品比较

### JMS的组成机构和特点

### JMS Provider：实现JMS接口和规范的消息中间件，即MQ服务器

### JMS Producer：消息生产者，创建和发送JMS消息的客户端应用

### JMS Consumer：消息消费者，接受和处理JMS消息的客户端应用

### JMS Message：消息

**1、** 消息头；

**1） JMS Destination：消息发送的目的地，主要是指Queue和Topic**

**2）JMS Delivery Mode：消息持久化和非持久化模式**

持久性的消息：应该被传送“一次仅仅一次”，这就意味着如果JMS提供者出现故障，该消息并不会丢失，它会在服务器恢复之后再次传递。

非持久的消息：最多会传递一次，这意味着服务器出现故障，该消息将会永远丢失。

**3） JMS Expiration：消息过期时间**

可以设置消息在一定时间后过期，默认是永不过期。

消息过期时间，等于Destination的send方法中的timeToLive值加上发送时刻的GMT时间值。

如果timeToLive值等于0，则JMSExpiration被设为0，表示该消息永不过期。

如果发送后，在消息过期时间之后还没有被发送到目的地，则该消息被清除。

**4） JMS Priority：消息优先级**

消息优先级，从0-9十个级别，0-4是普通消息5-9是加急消息。

JMS不要求MQ严格按照这十个优先级发送消息但必须保证加急消息要先于普通消息到达。默认是4级。（比如优先级9加急消息不一定要早于优先级8的加急消息先发送，但是这两条加急消息一定比优先级4普通消息先发送。）

**5） JMS MessageID：消息唯一标识，由MQ产生**

**2、** 消息属性；

1、TxtMessage：普通字符串（String）消息

2、MapMessage：Map类型的消息，key为String类型，值为Java基本类型

3、BytesMessage：二进制数组消息

4、StreamMessage：Java数据流消息，用标准流操作来顺序填充和读取

5、ObjectMessage：对象消息，包含一个可序列化的Java对象，最常用的是1） 和 2 ） \color{red}最常用的是1）和2） 最常用的是1）和2）

**3、** 消息体；

对消息的一种描述，达到识别、去重、重点标注等操作。

#### 案例小演示#

针对消息头配置，在发送消息方法sned()指定

针对消息属性，在发送端使用什么消息格式发送，则在消费端用什么消息格式接受

生产消息

```java
for (int i = 1; i < 4 ; i++) {
    // 7  创建字消息
    TextMessage textMessage = session.createTextMessage("topic_name--" + i);
    // 8  通过messageProducer发布消息
    messageProducer.send(textMessage);
    MapMessage mapMessage = session.createMapMessage();
    mapMessage.setString("k1","v1");
    messageProducer.send(mapMessage);
}
```

发送消息

```java
messageConsumer.setMessageListener( (message) -> {
if (null != message  && message instanceof TextMessage){
    TextMessage textMessage = (TextMessage)message;
   try {
     System.out.println("****消费者text的消息："+textMessage.getText());
   }catch (JMSException e) {
   }
}
 if (null != message  && message instanceof MapMessage){
   MapMessage mapMessage = (MapMessage)message;
   try {
      System.out.println("****消费者的map消息："+mapMessage.getString("k1"));
   }catch (JMSException e) {
   }
 }
});
```

消息体类似

基础案例演示如此，接下来详细讲解JMS可靠性

### JMS的可靠性

## 消息的持久化

保证消息只被传送一次和成功使用一次。在持久性消息传送至目标时，消息服务将其放入持久性数据存储。如果消息服务由于某种原因导致失败，它可以恢复此消息并将此消息传送至相应的消费者。虽然这样增加了消息传送的开销，但却增加了可靠性。

我的理解：在消息生产者将消息成功发送给MQ消息中间件之后。无论是出现任何问题，如：MQ服务器宕机、消费者掉线等。都保证（topic要之前注册过，queue不用）消息消费者，能够成功消费消息。如果消息生产者发送消息就失败了，那么消费者也不会消费到该消息。

#### queue消息非持久和持久#

queue非持久，当服务器宕机，消息不存在（消息丢失了）。即便是非持久，消费者在线的话，消息也不会丢失，等待消费者在线，还是能够收到消息的。
queue持久化，当服务器宕机，消息依然存在。
queue消息默认是持久化的。\color{red}queue消息默认是持久化的。queue消息默认是持久化的。
持久化消息，保证这些消息只被传送一次和成功使用一次。对于这些消息，可靠性是优先考虑的因素。\color{red}持久化消息，保证这些消息只被传送一次和成功使用一次。对于这些消息，可靠性是优先考虑的因素。持久化消息，保证这些消息只被传送一次和成功使用一次。对于这些消息，可靠性是优先考虑的因素。
可靠性的另一个重要方面是确保持久性消息传送至目标后，消息服务在向消费者传送它们之前不会丢失这些消息。\color{red}可靠性的另一个重要方面是确保持久性消息传送至目标后，消息服务在向消费者传送它们之前不会丢失这些消息。可靠性的另一个重要方面是确保持久性消息传送至目标后，消息服务在向消费者传送它们之前不会丢失这些消息。

#### 案例1. Topic设置非持久化#

核心代码

```java
// 5 创建消息的生产者
MessageProducer messageProducer = session.createProducer(queue);
// 非持久化消息 和持久化消息演示
messageProducer.setDeliveryMode(DeliveryMode.NON_PERSISTENT);   // 持久化  如果开启
                                                //       就会存入文件或数据库中
```

重启activemq

```java
./activemq restart
```

#### 案例2. Topic设置持久化或者不设置#

效果：重启activemq后消息不丢失，这就不演示了

#### topic消息非持久和持久#

topic默认就是非持久化的，因为生产者生产消息时，消费者也要在线，这样消费者才能消费到消息。
topic消息持久化，只要消费者向MQ服务器注册过，所有生产者发布成功的消息，该消费者都能收到，不管是MQ服务器宕机还是消费者不在线。
针对Topic而言，必须是先启动消费者后启动生产者，否则生产的消息都是垃圾消息，无用\color{red}针对Topic而言，必须是先启动消费者后启动生产者，否则生产的消息都是垃圾消息，无用针对Topic而言，必须是先启动消费者后启动生产者，否则生产的消息都是垃圾消息，无用

注意：

**1、** 一定要先运行一次消费者，等于向MQ注册，类似我订阅了这个主题；

**2、** 然后再运行生产者发送消息；

**3、** 之后无论消费者是否在线，都会收到消息如果不在线的话，下次连接的时候，会把没有收过的消息都接收过来；

#### 案例1#

体验一下activemq控制台的 Subscribers

#### 存活的订阅者#

#### 离线的订阅者#

#### 案例2#

操作步骤：

**1、** 启动消费者，先订阅；

**2、** 启动生产者；

消费者代码

```java
package  com.at.activemq.topic;
import org.apache.activemq.ActiveMQConnectionFactory;
import javax.jms.*;
  // 持久化topic 的消息消费者
public class JmsConsummer_persistence {
	public static final String ACTIVEMQ_URL = "tcp://47.98.163.118:61616";
    public static final String TOPIC_NAME = "topic01";
    public static void main(String[] args) throws Exception{
        System.out.println("****   marry    *****");
        // 1 按照给定的url创建连接工程，这个构造器采用默认的用户名密码
        ActiveMQConnectionFactory activeMQConnectionFactory = new ActiveMQConnectionFactory(ACTIVEMQ_URL);
        // 2 通过连接工厂连接 connection
        javax.jms.Connection connection = activeMQConnectionFactory.createConnection();
        connection.setClientID("marrry");
        // 3 创建回话  session
        // 两个参数，第一个事务， 第二个签收
        Session session = connection.createSession(false, Session.AUTO_ACKNOWLEDGE);
        // 4 创建目的地 （两种 ： 队列/主题   这里用主题）
        Topic topic = session.createTopic(TOPIC_NAME);
        TopicSubscriber topicSubscriber = session.createDurableSubscriber(topic,"remark...");
         // 5 发布订阅
        connection.start();
        Message message = topicSubscriber.receive();// 一直等
		while (null != message){
             TextMessage textMessage = (TextMessage)message;
             System.out.println(" 收到的持久化 topic ："+textMessage.getText());
		}
        session.close();
        connection.close();
    }
}
```

生产者代码

```java
package  com.at.activemq.topic;
import org.apache.activemq.ActiveMQConnectionFactory;
import javax.jms.*;
// 持久化topic 的消息生产者
public class JmsProduce_persistence {
	public static final String ACTIVEMQ_URL = "tcp://47.98.163.118:61616";
	public static final String TOPIC_NAME = "topic01";
    public static void main(String[] args) throws  Exception{
        // 1 按照给定的url创建连接工程，这个构造器采用默认的用户名密码
        ActiveMQConnectionFactory activeMQConnectionFactory = new ActiveMQConnectionFactory(ACTIVEMQ_URL);
        // 2 通过连接工厂连接 connection  和 启动
        javax.jms.Connection connection = activeMQConnectionFactory.createConnection();
        // 3 创建回话  session
        // 两个参数，第一个事务， 第二个签收
        Session session = connection.createSession(false, Session.AUTO_ACKNOWLEDGE);
        Topic topic = session.createTopic(TOPIC_NAME);
        // 5 创建消息的生产者
        MessageProducer messageProducer = session.createProducer(topic);
        // 6 通过messageProducer 生产 3 条 消息发送到消息队列中
        // 设置持久化topic 在启动
        messageProducer.setDeliveryMode(DeliveryMode.PERSISTENT);
        //
        connection.start();
        for (int i = 1; i < 4 ; i++) {
            // 7  创建字消息
            TextMessage textMessage = session.createTextMessage("topic_name--" + i);
            // 8  通过messageProducer发布消息
            messageProducer.send(textMessage);
        }
        // 9 关闭资源
        messageProducer.close();
        session.close();
        connection.close();
        System.out.println("  **** TOPIC_NAME消息发送到MQ完成 ****");
    }
}
```

#### 案例3#

**1、** 关闭消费者；

**2、** 继续发送消息；

**3、** 重新启动消费者；

#### 小总结#

凡是订阅了的，不管在不在线，都能接收到消息，如果订阅者不在线，则上线后接收到

#### 消息的事务性#

(1)生产者开启事务后，执行commit方法，这批消息才真正的被提交。不执行commit方法，这批消息不会提交。执行rollback方法，之前的消息会回滚掉。生产者的事务机制，要高于签收机制，当生产者开启事务，签收机制不再重要。

(2)消费者开启事务后，执行commit方法，这批消息才算真正的被消费。不执行commit方法，这些消息不会标记已消费，下次还会被消费。执行rollback方法，是不能回滚之前执行过的业务逻辑，但是能够回滚之前的消息，回滚后的消息，下次还会被消费。消费者利用commit和rollback方法，甚至能够违反一个消费者只能消费一次消息的原理。

(3)问：消费者和生产者需要同时操作事务才行吗？

答：消费者和生产者的事务，完全没有关联，各自是各自的事务。

生产者代码

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
        Session session = connection.createSession(true,Session.AUTO_ACKNOWLEDGE);
        // 4 创建目的地 （两种 ： 队列/主题   这里用队列）
        Queue queue = session.createQueue(QUEUE_NAME);
        // 5 创建消息的生产者
        MessageProducer messageProducer = session.createProducer(queue);
        // 非持久化消息 和持久化消息演示
        messageProducer.setDeliveryMode(DeliveryMode.NON_PERSISTENT);   // 持久化  如果开启
                                                        //       就会存入文件或数据库中
        // 6 通过messageProducer 生产 3 条 消息发送到消息队列中
        for (int i = 1; i < 4 ; i++) {
            // 7  创建字消息
            TextMessage textMessage = session.createTextMessage("msg--" + i);
            // 8  通过messageProducer发布消息
            messageProducer.send(textMessage);
        }
        // 9 关闭资源
		session.commit();
        messageProducer.close();
        session.close();
        connection.close();
        System.out.println("  **** 消息发送到MQ完成 ****");
    }
}
```

消费者正常消费

#### 案例1

如果在生产者这边没有commit话，则无法产生消息，消费者也就不会消费

### 消息的签收

$\color{

red}表阴影是重点常用的$

消费者代码

```java
package com.activemq.demo;
import org.apache.activemq.ActiveMQConnectionFactory;
import javax.jms.*;
import java.io.IOException;
public class Jms_TX_Consumer {
    private static final String ACTIVEMQ_URL = "tcp://118.24.20.3:61626";
    private static final String ACTIVEMQ_QUEUE_NAME = "Queue-ACK";
    public static void main(String[] args) throws JMSException, IOException {
        ActiveMQConnectionFactory activeMQConnectionFactory = new ActiveMQConnectionFactory(ACTIVEMQ_URL);
        Connection connection = activeMQConnectionFactory.createConnection();
        connection.start();
        Session session = connection.createSession(false, Session.CLIENT_ACKNOWLEDGE);
        Queue queue = session.createQueue(ACTIVEMQ_QUEUE_NAME);
        MessageConsumer messageConsumer = session.createConsumer(queue);
        messageConsumer.setMessageListener(new MessageListener() {
            @Override
            public void onMessage(Message message) {
                if (message instanceof TextMessage) {
                    try {
                        TextMessage textMessage = (TextMessage) message;
                        System.out.println("***消费者接收到的消息:   " + textMessage.getText());
                        /* 设置为Session.CLIENT_ACKNOWLEDGE后，要调用该方法，标志着该消息已被签收（消费）。
                            如果不调用该方法，该消息的标志还是未消费，下次启动消费者或其他消费者还会收到改消息。
                         */
                        textMessage.acknowledge();
                    } catch (Exception e) {
                        System.out.println("出现异常，消费失败，放弃消费");
                    }
                }
            }
        });
        System.in.read();
        messageConsumer.close();
        session.close();
        connection.close();
    }
}
```

### 小总结

签收和事务的关系：在事务会话中，当一个事务被成功提交则消息被自动签收，如果事务回滚，则消息被再次传送；非事务会话中，消息何时被确认取决于创建会话时的签收模式（Acknowledge Mode）。

事务偏生产者，签收偏消费者。

## JMS的点对点（Queue）

点对点模型是基于队列的，生产者发送消息到队列，消费者从队列接收消息，队列的存在使得消息的异步传输成为可能。和我们平时给朋友发送短信类似。

如果在Session关闭时有部分消息被收到但还没有被签收（acknowledge），那当消费者下次连接到相同的队列时，这些消息还会被再次接收

队列可以长久的保存消息直到消费者收到消息。消费者不需要因为担心消息会丢失而时刻和队列保持激活的链接状态，充分体现了异步传输模式的优势

## JMS的发布和订阅（Topic）

非持久性订阅：非持久订阅只有当客户端处于激活状态，也就是和MQ保持连接状态才能收发到某个主题的消息。如果消费者处于离线状态，生产者发送的主题消息将会丢失作废，消费者永远不会收到。简而言之，先订阅注册才能接受到发布，只给订阅者发布消息。

持久性订阅：客户端首先向MQ注册一个自己的身份ID识别号，当这个客户端处于离线时，生产者会为这个ID保存所有发送到主题的消息，当客户再次连接到MQ的时候，会根据消费者的ID得到所有当自己处于离线时发送到主题的消息。非持久订阅状态下，不能恢复或重新派送一个未签收的消息。持久订阅才能恢复或重新派送一个未签收的消息。
