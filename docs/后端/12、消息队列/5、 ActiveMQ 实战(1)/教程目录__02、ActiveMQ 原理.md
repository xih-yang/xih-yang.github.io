# 02、ActiveMQ 原理
- 来源：https://ddkk.com/zhuanlan/mq/activemq/1/2.html
- 分类：消息队列
- 分组：教程目录
ActiveMQ 是Apache出品，最流行的，能力强劲的开源消息总线。ActiveMQ 是一个完全支持JMS1.1和J2EE 1.4规范的 JMS Provider实现，尽管JMS规范出台已经是很久的事情了，但是JMS在当今的J2EE应用中间仍然扮演着特殊的地位。

在介绍activemq之前，先简单介绍JMS，它是J2EE的13个规范之一，提供的是消息中间件的规范。

**1、JMS包括以下基本构件：**

**1、** 连接工厂，是客户用来创建连接的对象，ActiveMQ提供的是ActiveMQConnectionFactory;

**2、** 连接connection;

**3、** 会话session，是发送和接收消息的上下文，用于创建消息生产者，消息消费者，相比rocketMQ会话session是提供事务性的;

**4、** 目的地destination，指定生产消息的目的地和消费消息的来源对象;

**5、** 生产者，由会话创建的对象;

**6、** 消费者，由会话创建的对象;

**2、消息通信机制**

点对点模式，每个消息只有1个消费者，它的目的地称为queue队列；

发布/订阅模式，每个消息可以有多个消费者，而且订阅一个主题的消费者，只能消费自它订阅之后发布的消息。

消息确认机制

Session.AUTO_ACKNOWLEDGE，直接使用receive方法。Session.CLIENT_ACKNOWLEDGE，通过消息的acknowledge 方法确认消息。Session.DUPS_ACKNOWLEDGE，该选择只是会话迟钝第确认消息的提交。如果JMS provider 失败，那么可能会导致一些重复的消息。如果是重复的消息，那么JMS provider 必须把消息头的JMSRedelivered 字段设置为true。

## 2、Activemq 特性

**1、** 多种语言和协议编写客户端。语言: Java,C,C++,C#,Ruby,Perl,Python,PHP。应用协议： OpenWire,Stomp REST,WS Notification,XMPP,AMQP;

**2、** 完全支持JMS1.1和J2EE 1.4规范 （持久化，XA消息，事务);

**3、** 对Spring的支持，ActiveMQ可以很容易内嵌到使用Spring的系统里面去，而且也支持Spring2.0的特性;

**4、** 通过了常见J2EE服务器（如 Geronimo,JBoss 4,GlassFish,WebLogic)的测试，其中通过JCA 1.5 resource adaptors的配置，可以让ActiveMQ可以自动的部署到任何兼容J2EE 1.4 商业服务器上;

**5、** 支持多种传送协议：in-VM,TCP,SSL,NIO,UDP,JGroups,JXTA;

**6、** 支持通过JDBC和journal提供高速的消息持久化;

**7、** 从设计上保证了高性能的集群，客户端-服务器，点对点;

**8、** 支持Ajax;

**9、** 支持与Axis的整合;

**10、** 可以很容易的调用内嵌JMS provider，进行测试;

## 3、安装（先使用ActiveMQ，然后讲原理）

参考我以前文章[MQ（message queue）使用 Spring整合 MQ下载 五分钟上手使用](https://blog.csdn.net/HezhezhiyuLe/article/details/83301495)

注：文档链接为SpringBoot整合ActiveMQ教程　文章开头为安装教程附下载

## 4、实现（先使用ActiveMQ，然后讲原理）

使用JMS原生API编写测试类，向消息中间件写入消息的开发步骤：

**1、** 创建连接工厂

**2、** 创建连接

**3、** 启动连接

**4、** 建立会话

**5、** 创建队列

**6、** 创建生产者

**7、** 创建消息

**8、** 发送消息

**9、** 提交

**1、** 导入依赖；

```xml
<dependencies>
    <dependency>
        <groupId>org.apache.activemq</groupId>
        <artifactId>activemq-all</artifactId>
        <version>5.14.0</version>
    </dependency>
</dependencies>
```

- 编写生产者类

```java
import org.apache.activemq.ActiveMQConnectionFactory;
import javax.jms.*;
public class ActiveMQProducter {
    public static void main(String[] args) throws Exception{
        // 连接工厂
        // 使用默认用户名、密码、路径
        // 因为：底层实现：final String defaultURL = "tcp://" + DEFAULT_BROKER_HOST + ":" + DEFAULT_BROKER_PORT;
        // 所以：路径 tcp://host:61616
        //1 创建连接工厂
        ActiveMQConnectionFactory connectionFactory = new ActiveMQConnectionFactory();
        //2 创建连接
        Connection connection = connectionFactory.createConnection();
        //3 打开连接
        connection.start();
        //4 创建会话
        //第一个参数：是否开启事务
        //第二个参数：消息是否自动确认
        Session session = connection.createSession(true, Session.AUTO_ACKNOWLEDGE);
        //创建队列
        Queue queue = session.createQueue("hello20181119");
        //5 创建生产者
        MessageProducer producer = session.createProducer(queue);
        //6 创建消息
        Message message = session.createTextMessage("helloworld");
        //7 发送消息
        producer.send(message);
        //8 关闭消息
        session.commit();
        producer.close();
        session.close();
        connection.close();
        System.out.println("消息生产成功");
    }
}
```

运行后结果 默认tcp连接activeMQ端口 61616 ！！！ 程序连接端口

查看网页 网页使用端口8161访问

> 访问：http://localhost:8161/ 点击：Manage ActiveMQ broker
>
> 用户名和密码 都是　admin

消费前：表示没有消费 有一个消息在队列中

- 编写消费者

```java
 import org.apache.activemq.ActiveMQConnectionFactory;
import javax.jms.*;
public class ActiveMQConsumer {
    public static void main(String[] args) throws Exception {
        //创建连接工厂
        ActiveMQConnectionFactory connectionFactory = new ActiveMQConnectionFactory();
        //创建连接
        Connection connection = connectionFactory.createConnection();
        //开启连接
        connection.start();
        //创建会话
        /** 第一个参数，是否使用事务
         如果设置true，操作消息队列后，必须使用 session.commit();
         如果设置false，操作消息队列后，不使用session.commit();
         */
        Session session = connection.createSession(true, Session.AUTO_ACKNOWLEDGE);
        //创建队列
        Queue queue = session.createQueue("hello20181119");
        //创建消费者
        MessageConsumer consumer = session.createConsumer(queue);
        while(true){
            //失效时间，如果10秒内没有收到新的消息，说明没有消息存在，此时可以退出当前循环
            TextMessage message = (TextMessage) consumer.receive(10000);
            if(message!=null){
                System.out.println(message.getText());
            }else {
                break;
            }
        }
        //关闭连接
        session.commit();
        session.close();
        connection.close();
        System.out.println("消费结束0");
    }
}
```

**注意：测试的时候一定先启动消费者，然后再启动生产者（Ｑueue队列）**

查看控制台，发现信息已经被消费

查看网页

- 监听器消费消息

```java
// 使用监听器消费
public static void main(String[] args) throws Exception {
    // 连接工厂
    // 使用默认用户名、密码、路径
    // 路径 tcp://host:61616
    ConnectionFactory connectionFactory = new ActiveMQConnectionFactory();
    // 获取一个连接
    Connection connection = connectionFactory.createConnection();
    // 开启连接
    connection.start();
    // 建立会话
    // 第一个参数，是否使用事务，如果设置true，操作消息队列后，必须使用 session.commit();
    Session session = connection.createSession(false,Session.AUTO_ACKNOWLEDGE);
    // 创建队列或者话题对象
    Queue queue = session.createQueue("hello20181119");
    // 创建消费者
    MessageConsumer messageConsumer = session.createConsumer(queue);
    messageConsumer.setMessageListener(new MessageListener() {
        // 每次接收消息，自动调用 onMessage
        public void onMessage(Message message) {
            TextMessage textMessage = (TextMessage) message;
            try {
                System.out.println(textMessage.getText());
            } catch (JMSException e) {
                e.printStackTrace();
            }
        }
    });
    //此时，不能让程序结束，如果结束，监听就结束了
    while (true) {
        // 目的：不能让程序死掉
    }
} 
```

## 5、消息队列应用场景

以下介绍消息队列在实际应用中常用的使用场景。

异步处理，应用解耦，流量削锋和消息通讯四个场景

### 5.1、异步处理

场景说明：用户注册后，需要发注册邮件和注册短信。传统的做法有两种:

**1、** 串行的方式；
**2、** 并行方式；

**串行方式：** 将注册信息写入`数据库`成功后，发送注册邮件，再发送注册短信。以上三个任务全部完成后，返回给客户端

**并行方式：** 将注册信息写入数据库成功后，发送注册邮件的同时，发送注册短信。以上三个任务完成后，返回给客户端。与串行的差别是，并行的方式可以提高处理的时间

假设三个业务节点每个使用50毫秒钟，不考虑网络等其他开销，则串行方式的时间是150毫秒，并行的时间可能是100毫秒。

因为CPU在单位时间内处理的请求数是一定的，假设CPU在1秒内吞吐量是100次。则串行方式1秒内CPU可处理的请求量是7次（1000/150）。并行方式处理的请求量是10次（1000/100）

小结：如以上案例描述，传统的方式系统的性能（并发量，吞吐量，响应时间）会有瓶颈。如何解决这个问题呢？

引入消息队列，将不是必须的业务逻辑，异步处理。改造后的架构如下：

按照以上约定，用户的响应时间相当于是注册信息写入数据库的时间，也就是50毫秒。注册邮件，发送短信写入消息队列后，直接返回，因此写入消息队列的速度很快，基本可以忽略，因此用户的响应时间可能是50毫秒。因此架构改变后，系统的吞吐量提高到每秒20 QPS。比串行提高了3倍，比并行提高了2倍

### 5.2、应用解耦

场景说明：用户下单后，订单系统需要通知库存系统。传统的做法是，订单系统调用库存系统的接口。如下图 以我做的项目举例

传统模式的缺点：

l假如库存系统无法访问，则订单减库存将失败，从而导致订单失败

l订单系统与库存系统耦合

如何解决以上问题呢？引入应用消息队列后的方案，如下图：

- 订单系统：用户下单后，订单系统完成持久化处理，将消息写入消息队列，返回用户订单下单成功
- 库存系统：订阅下单的消息，采用pub/sub(发布/订阅)的方式，获取下单信息，库存系统根据下单信息，进行库存操作
- 假如：在下单时库存系统不能正常使用。也不影响正常下单，因为下单后，订单系统写入消息队列就不再关心其他的后续操作了。实现订单系统与库存系统的应用解耦

### 5.3、流量削锋

流量削锋也是消息队列中的常用场景，一般在**秒杀或团抢活动**中使用广泛

应用场景：秒杀活动，一般会因为流量过大，导致流量暴增，应用挂掉。为解决这个问题，一般需要在应用前端加入消息队列。

- 可以控制活动的人数
- 可以缓解短时间内高流量压垮应用

- 用户的请求，服务器接收后，首先写入消息队列。假如消息队列长度超过最大数量，则直接抛弃用户请求或跳转到错误页面
- 秒杀业务根据消息队列中的请求信息，再做后续处理

### 5.4、日志处理

日志处理是指将消息队列用在日志处理中，比如Kafka的应用，解决大量日志传输的问题。架构简化如下

- 日志采集客户端，负责日志数据采集，定时写受写入Kafka队列
- Kafka消息队列，负责日志数据的接收，存储和转发
- 日志处理应用：订阅并消费kafka队列中的日志数据
-

**1、** Kafka：接收用户日志的消息队列;

**2、** Logstash：做日志解析，统一成JSON输出给Elasticsearch;

**3、** Elasticsearch：实时日志分析服务的核心技术，一个schemaless，实时的数据存储服务，通过index组织数据，兼具强大的搜索和统计功能;

**4、** Kibana：基于Elasticsearch的数据可视化组件，超强的数据可视化能力是众多公司选择ELK stack的重要原因;

### 5.5、消息通讯

消息通讯是指，消息队列一般都内置了高效的通信机制，因此也可以用在纯的消息通讯。比如实现点对点消息队列，或者聊天室等

点对点通讯：

客户端A和客户端B使用同一队列，进行消息通讯。

聊天室通讯：

客户端A，客户端B，客户端N订阅同一主题，进行消息发布和接收。实现类似聊天室效果。

以上实际是消息队列的两种消息模式，点对点或发布订阅模式。模型为示意图，供参考。

## 6、JMS消息服务

消息队列的JAVAEE规范JMS 。JMS（[Java](http://lib.csdn.net/base/17)**Message Service**,java消息服务）API是一个消息服务的标准/规范，允许应用程序组件基于JavaEE平台创建、发送、接收和读取消息。它使分布式通信耦合度更低，消息服务更加可靠以及异步性。

### 6.1 消息模型

在JMS标准中，有两种消息模型P2P（Point to Point）,Publish/Subscribe(Pub/Sub)。

### 6.2 P2P模式-队列模式

P2P模式包含三个角色：消息队列（Queue），发送者(Sender)，接收者(Receiver)。每个消息都被发送到一个特定的队列，接收者从队列中获取消息。队列保留着消息，直到他们被消费或超时。

P2P的特点

l每个消息只能被一个消费者（Consumer）消费(即一旦被消费，消息就不再存在于消息队列中)

l发送者和接收者之间在时间上没有依赖性，也就是说当发送者发送了消息之后，不管接收者有没有正在运行，它不会影响到消息被发送到队列

l接收者在成功接收消息之后需向队列应答成功

如果希望发送的每个消息都会被成功处理的话，那么需要P2P模式。

### 6.3 Pub/Sub模式–广播/主题模式

包含三个角色主题（Topic），发布者（Publisher），订阅者（Subscriber） 多个发布者将消息发送到Topic,系统将这些消息传递给多个订阅者。

Pub/Sub的特点

- 每个消息可以有多个消费者
- 发布者和订阅者之间有时间上的依赖性。针对某个主题（Topic）的订阅者，它必须创建一个订阅者之后，才能消费发布者的消息
- 为了消费消息，订阅者必须保持运行的状态

为了缓和这样严格的时间相关性，JMS允许订阅者创建一个可持久化的订阅。这样，即使订阅者没有被激活（运行），它也能接收到发布者的消息。

如果希望发送的消息可以被多个消费者处理的话，那么可以采用Pub/Sub模型。

## 7.消息消费方式

在JMS中，消息的产生和消费都是异步的。对于消费来说，JMS的消息者可以通过两种方式来消费消息。

### 1、同步

订阅者或接收者通过receive方法来接收消息，receive方法在接收到消息之前（或超时之前）将一直阻塞；

### 2、异步

订阅者或接收者可以注册为一个消息监听器。当消息到达之后，系统自动调用监听器的onMessage方法。

> 版权声明：「DDKK.COM 弟弟快看，程序员编程资料站」本站文章，版权归原作者所有
