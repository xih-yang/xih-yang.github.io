# 03、ActiveMQ 实战 - Java编码实现ActiveMQ通讯（Queue）
- 来源：https://ddkk.com/zhuanlan/mq/activemq/3/3.html
- 分类：消息队列
- 分组：教程目录
### 前言

这篇文章是大家最喜欢看到的文章~~怎么用Java去操作ActiveMQ\color{red}怎么用Java去操作ActiveMQ怎么用Java去操作ActiveMQ
值得一提，在实际项目中，不会使用这种方式去操作ActiveMQ，这就好比我们在学习MySql时，一开始是通过JDBC去操作数据库，在项目中往往写的并不是JDBC，而是使用Mybatis操作数据库
作为学习者来说，我们是有必要了解Java底层是如何操作数据库，万变不离其宗，以一个activemq突破口

### 回顾JDBC操作数据库

> Java对数据库的操作有很多种技术。例如说jdbc，dbutil +C3p0，hibernate,jdbcTemplate等等，到后面的话使用一些高级的框架去操作数据库，比如hibernate。但是底层操作数据库是重要的，高级框架也是也底层为基础搭建的

通过几种操作MySql方式演变，最后我们使用框架，只需要关注与业务操作相关即可，无需担忧连接配置\color{red}通过几种操作MySql方式演变，最后我们使用框架，只需要关注与业务操作相关即可，无需担忧连接配置通过几种操作MySql方式演变，最后我们使用框架，只需要关注与业务操作相关即可，无需担忧连接配置
ActiveMQ亦是如此，不过不急，请耐心看完

## 回顾JDBC操作六个步骤

**JDBC的六个固定步骤**

1、注册数据库驱动[利用反射]

2、取得数据库连接对象Connection

3、创建SQL对象

4、执行SQL命令，并返回结果集

5、处理结果集

6、依次关闭结果集

```java
//1，注册数据库驱动有两种方式
第一种是：直接注册数据库驱动
DriverManager.registerDriver(new Driver());
第二种是：利用反射机制间接加载数据库驱劝，推荐用第二种
Class.forName("com.mysql.jdbc.Driver");
//2. 取得数据库连接对象Connection
//取得与MySQL数据库连接的桥梁,参数分别是：连接数据库  用户名 密码Connection conn = DriverManager.getConnection(                "jdbc:mysql:///zz2017","root","xiaozheng");
//前两步骤需要记住以下。下面的
//4:执行sql语句
insert/update/delete----PreparedStatement .executeUpdate(sql)：返回值表示影响记录的行数
select------------------PreparedStatement .exeucteQuery():返回值表示符合条件的记录   
```

## 正文

### JMS编码总体规范

ConnectionFactory加载MQ连接驱动，并创建Connnection连接对象（类似连接数据库时加载JDBC驱动，生成java.sql.Connection对象），由Connection对象创建Session会话对象，Session可以创建Message（消息），Message Producer（消息生产者）和Message Consumer（消息消费者）。Message Producer（消息生产者）将Message（消息）发送到Destination（目的地），Message Consumer（消息消费者）从Destination（目的地）中接受消息。

## JMS开发基本步骤

1、创建一个connection factory

2、通过connection factory来创建JMS connection

3、启动JMS connection

4、通过JMS connection创建JMS session

5、通过JMS session创建JMS destination（目的地 队列/主题）

6、通过JMS session创建JMS producer或者创建JMS consume并设置destination

7、JMS consumer同步接受或者注册一个JMS message listener异步接受JMS message

8、发送(send)或者接收(receive)JMS message

9、关闭所有JMS资

## Destination简介

Destination即消息队列（Queue）和主题（Topic），存在一下两者模式：

**1、** 队列1对1模式：；

消息发送者（Sender）将消息发送到队列（Queue），接受者（Receiver）从队列中接受消息，一个发送者发送给一个接收者。

**2、** 主题1对n模式：；

消息发布者（Publisher）将消息发布到指定的主题（Topic），订阅该主题的所有订阅者（Subscriber）从该主题中接受消息，一个发布者的消息可以被多个订阅者接受。

### 队列的特点（这一篇先讲主题）

每个消息只能有一个消费者，类似于1对1的关系。好比个人快递自己领自己的。

消息的生产者和消费者之间没有时间上的相关性。无论消费者在生产者发送消息的时候是否处于运行状态，消费者都可以提取消息。好比我们的发送短信，发送者发送后不见得接收者会即收即看。

消息被消费后队列中不会再存储，所以消费者不会消费到已经被消费掉的消息。

### 环境准备

JDK+ ActiveMQ服务 + Maven

构建ActiveMQDemo的Maven工程，Maven依赖如下：

```java
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
        // 4 创建目的地 （两种 ： 队列/主题   这里用队列）
        Queue queue = session.createQueue(QUEUE_NAME);
        // 5 创建消息的生产者
        MessageProducer messageProducer = session.createProducer(queue);
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

查看页面发现此时如果存在队列名称为jdbc01有3条未读消息，则表示消息成功发送到了ActiveMQ。

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
        // 4 创建目的地 （两种 ： 队列/主题   这里用队列）
        Queue queue = session.createQueue(QUEUE_NAME);
        // 5 创建消息的消费者
        MessageConsumer messageConsumer = session.createConsumer(queue);
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

## receive增加入参

消费者核心代码

```java
 /* 同步阻塞方式reveive()   空参数的receive方法是阻塞，有参数的为等待时间
          订阅者或消费者使用MessageConsumer 的receive() 方法接收消息，receive 在接收之前一直阻塞*/
         while(true){
            // 这里是 TextMessage 是因为消息发送者是 TextMessage ， 接受处理的
            // 也应该是这个类型的消息
            TextMessage message = (TextMessage)messageConsumer.receive(4000L);  // 4秒
            if (null != message){
                System.out.println("****消费者的消息："+message.getText());
            }else {
                break;
            }
        }
        // 通过监听的方式来消费消息
        // 通过异步非阻塞的方式消费消息
        // 通过messageConsumer 的setMessageListener 注册一个监听器，
        // 当有消息发送来时，系统自动调用MessageListener 的 onMessage 方法处理消息
        /*messageConsumer.setMessageListener(new MessageListener() {
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
*/
        // 保证控制台不灭  不然activemq 还没连上就关掉了连接
        //System.in.read();
        messageConsumer.close();
        session.close();
        connection.close();
```

说明
第一种方式，receive()方法没有指定时间会一直阻塞在这里，整个程序不会结束，而第二种方式设置阻塞时间，4秒后自动往下执行\color{red}第一种方式，receive()方法没有指定时间会一直阻塞在这里，整个程序不会结束，而第二种方式设置阻塞时间，4秒后自动往下执行第一种方式，receive()方法没有指定时间会一直阻塞在这里，整个程序不会结束，而第二种方式设置阻塞时间，4秒后自动往下执行

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
        // 4 创建目的地 （两种 ： 队列/主题   这里用队列）
        Queue queue = session.createQueue(QUEUE_NAME);
        // 5 创建消息的消费者
        MessageConsumer messageConsumer = session.createConsumer(queue);
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

## 小总结两种消费方式

1：同步阻塞方式(receive)

订阅者或接收者抵用MessageConsumer的receive()方法来接收消息，receive方法在能接收到消息之前（或超时之前）将一直阻塞

2：异步非阻塞方式（监听器onMessage()）

订阅者或接收者通过MessageConsumer的setMessageListener(MessageListener listener)注册一个消息监听器，

当消息到达之后，系统会自动调用监听器MessageListener的onMessage(Message message)方法。

## 案例

**1、** 先生产，只启动1号消费者，1号消费者能消费者？

运行之前编写生产者JMSProducer生产3条消息消息。

再运行其中一个消费者消费消息。

答案：1号消费者能消费。

**2、** 先生产，先启动1号消费者，再启动2号消费者，2号消费者还能消费消息吗？；

验证此问题，需要对同一个消费者类启动两次main方法，IDEA默认只能启动一次。解决此问题需要勾选Allow parallel run。

和以上相同方式启动生产者JMSProducer生产3条消息。

第一次启动JMSConsumerForListener消费消息。

第二次启动JMSConsumerForListener消费消息。

答案：队列里消息已被先启动的1号消费者消费掉了，2号消费者再启动无消息消费。

**1、** 先启动2个消费者，再生产6条消息，消费情况如何？

选项：A. 只1号消费者消费 B.只2号消费者消费 C.都能消费 D.都不能消费

启动2次JMSConsumerForListener消费者等待消息消费。

2个消费者消费情况如下：

答案：C（负载均衡）

### 扩展阅读

回顾9个步骤

```java
1：创建一个connection factory
2：通过connection factory来创建JMS connection
3：启动JMS connection
4：通过JMS connection创建JMS session
5：通过JMS session创建JMS destination（目的地 队列/主题）
6：通过JMS session创建JMS producer或者创建JMS consume并设置destination
7：JMS consumer同步接受或者注册一个JMS message listener异步接受JMS message
8：发送(send)或者接收(receive)JMS message
9：关闭所有JMS资
```

```java
// 1 按照给定的url创建连接工程，这个构造器采用默认的用户名密码
ActiveMQConnectionFactory activeMQConnectionFactory = new ActiveMQConnectionFactory(ACTIVEMQ_URL);
// 2 通过连接工厂连接 connection  和 启动
javax.jms.Connection connection = activeMQConnectionFactory.createConnection();
//  启动
connection.start();
```

以ActiveMQConnectionFactory为例看看源码

看看如何创建createConnection

有空的话可以看看源码，对你们有帮助的
