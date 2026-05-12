# 13、ActiveMQ 实战 - ActiveMQ高级特性
- 来源：https://ddkk.com/zhuanlan/mq/activemq/3/13.html
- 分类：消息队列
- 分组：教程目录
### ActiveMQ高级特性：

**1、** 异步投递；

**2、** 延迟投递和定时投递；

**3、** 分发策略；

**4、** 消息重试机制；

**5、** 死信队列；

### 异步投递

ActiveMQ支持同步，异步两种发送的模式将消息发送到broker，模式的选择对发送延时有巨大的影响。producer能达到怎么样的产出率（产出率=发送数据总量/时间）主要受发送延时的影响，使用异步发送可以显著提高发送的性能。

ActiveMQ默认使用异步发送的模式\color{red}ActiveMQ默认使用异步发送的模式ActiveMQ默认使用异步发送的模式，除非明确指定使用同步发送的方式或者在未使用事务的前提下发送持久化的消息，这两种情况都是同步发送的。

如果你没有使用事务且发送的是持久化的消息，每一次发送都是默认同步发送的且会阻塞producer直到broker返回一个确认，表示消息已经被安全的持久化到磁盘。确认机制提供了消息安全的保障，但同时会阻塞客户端带来了很大的延时。

很多高性能的应用，允许在失败的情况下有少量的数据丢失。如果你的应用满足这个特点，你可以使用异步发送来提高生产率，即使发送的是持久化的消息。

异步发送它可以最大化producer端的发送效率\color{red}异步发送它可以最大化producer端的发送效率异步发送它可以最大化producer端的发送效率。我们通常在发送消息量比较密集的情况下使用异步发送，它可以很大的提升producer性能。不过这也带来了额外的问题，就是需要消耗更多的Client端内存同时也会导致broker端性能消耗增加，此外它不能有效的确保消息的发送成功。在异步投递的情况下客户端需要容忍消息丢失的可能。

大白话理解：对于持久化的消息发送，需要等待mq持久化后通知方可结束，那么我们可以用异步投递\color{red}大白话理解：对于持久化的消息发送，需要等待mq持久化后通知方可结束，那么我们可以用异步投递大白话理解：对于持久化的消息发送，需要等待mq持久化后通知方可结束，那么我们可以用异步投递
如果是允许少量数据丢失情况下\color{red}如果是允许少量数据丢失情况下如果是允许少量数据丢失情况下

## 设置异步投递的三种方式

**1、** 连接ActiveMQ的url添加jms.useAsyncSend=true参数；

```java
cf = new ActiveMQConnectionFactory("tcp://locahost:61616?jms.useAsyncSend=true");
```

**1、** ActiveMQConnectionFactory方法设置；

```java
((ActiveMQConnectionFactory)connectionFactory).setUseAsyncSend(true);
```

**1、** ActiveMQConnection方法设置；

```java
((ActiveMQConnection)connection).setUseAsyncSend(true);
```

## 异步消息如何确定发送成功？

当设置异步投递后，使用producer.send(msg)持续发送消息，如果消息不阻塞，生产者会认为所有send的消息均被成功发送至MQ。如果MQ突然宕机，此时生产者端内存中尚未被发送至MQ的消息都会丢失。

答案是：正确的异步发送方法是需要接收回调的。同步发送等send方法不阻塞了就表示一定发送成功了；异步发送需要客户端回执并由客户端再判断一次是否发送成功。

案例演示

```java
package com.huazai.activemq.advanced;
import org.apache.activemq.ActiveMQConnectionFactory;
import org.apache.activemq.ActiveMQMessageProducer;
import org.apache.activemq.AsyncCallback;
import javax.jms.*;
import java.util.UUID;
/**
 * ActiveMQ高级特性之异步投递
 *
 * @author DDKK.COM 弟弟快看，程序员编程资料站
 * @date 2022/1/30 19:51
 */
public class JmsProduceAsyncSend {
    // ActiveMQ服务地址
    public static final String ACTIVEMQ_URL = "tcp://192.168.64.129:61616";
    // 消息队列名称
    public static final String QUEUE_NAME = "queue-async";
    public static void main(String[] args) throws Exception {
        // 1.创建给定ActiveMQ服务连接工厂，使用默认的用户名和密码
        ActiveMQConnectionFactory activeMQConnectionFactory = new ActiveMQConnectionFactory(ACTIVEMQ_URL);
        // 开启异步投递
        activeMQConnectionFactory.setUseAsyncSend(true);
        // 2.通过连接工厂，创建连接对象并启动访问
        Connection connection = activeMQConnectionFactory.createConnection();
        connection.start();
        // 3.创建会话，第一个参数为是否开启事务，第二个参数为签收
        Session session = connection.createSession(false, Session.AUTO_ACKNOWLEDGE);
        // 4.创建目的地（队列或者主题）
        Queue queue = session.createQueue(QUEUE_NAME);
        // 可以用父接口Destination接受
        // Destination queue = session.createQueue(QUEUE_NAME);
        // 5.创建消息的生产者，一定要向上转型为ActiveMQMessageProducer类型才有异步投递功能
        ActiveMQMessageProducer activeMQMessageProducer = (ActiveMQMessageProducer) session.createProducer(queue);
        // 6.通过消息生产者生产6条消息发送MQ队列
        for (int i = 0; i < 3; i++) {
            // 7.创建消息
            TextMessage textMessage = session.createTextMessage("异步投递消息" + i + ":hello world");
            // 给消息设置一个唯一的id可以知道哪条消息发送成功，哪条消息发送失败
            textMessage.setJMSMessageID(UUID.randomUUID().toString());
            String msgId = textMessage.getJMSMessageID();
            // 8.将消息发送到MQ，并回调判断消息是否发送成功
            activeMQMessageProducer.send(textMessage, new AsyncCallback() {
                /**
                 * 消息发送成功回调方法
                 */
                @Override
                public void onSuccess() {
                    System.out.println("消息成功发送回调方法，成功消息标识：" + msgId);
                }
                /**
                 * 消息发送失败回调方法
                 *
                 * @param exception
                 */
                @Override
                public void onException(JMSException exception) {
                    System.err.println("消息发送失败回调方法，失败消息标识：" + msgId);
                }
            });
        }
        // 9.关闭资源
        activeMQMessageProducer.close();
        session.close();
        connection.close();
        System.out.println("finish");
    }
}
```

运行结果：

### 延迟投递和定时投递

延迟投递：延迟多长时间开始投递消息

定时投递：间隔多长时间开始投递消息

## 开启定时投递和间隔投递功能

在activemq.xml文件中配置broker的schedulerSupport属性为true，并重启服务。

四大属性

### 案例演示

消费者代码：

```java
package com.huazai.activemq.advanced;
import org.apache.activemq.ActiveMQConnectionFactory;
import javax.jms.*;
import java.time.LocalDateTime;
/**
 * @author DDKK.COM 弟弟快看，程序员编程资料站
 * @date 2022/1/30 20:54
 */
public class JmsConsumerDelayAndScheduleRecieve {
    // ActiveMQ服务地址
    public static final String ACTIVEMQ_URL = "tcp://192.168.64.129:61616";
    // 消息队列名称，取消息必须和存消息的队列名称一致
    public static final String QUEUE_NAME = "queue-delay-schedule";
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
        int i = 0;
        while (true) {
            // 接受消息根据生产者发送消息类型强类型转换
            TextMessage message = (TextMessage) consumer.receive();
            if (message != null) {
                String text = message.getText();
                System.out.print("第" + ++i + "次接受延迟消息：");
                System.out.println(text);
                int endSecond = LocalDateTime.now().getSecond();
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

生产者代码：

```java
package com.huazai.activemq.advanced;
import org.apache.activemq.ActiveMQConnectionFactory;
import org.apache.activemq.ActiveMQMessageProducer;
import org.apache.activemq.AsyncCallback;
import org.apache.activemq.ScheduledMessage;
import javax.jms.*;
import java.util.UUID;
/**
 * @author DDKK.COM 弟弟快看，程序员编程资料站
 * @date 2022/1/30 20:25
 */
public class JmsProduceDelayAndScheduleSend {
    // ActiveMQ服务地址
    public static final String ACTIVEMQ_URL = "tcp://192.168.64.129:61616";
    // 消息队列名称
    public static final String QUEUE_NAME = "queue-delay-schedule";
    /**
     * 延迟投递的时间
     */
    private static final long DELAY = 3 * 1000;
    /**
     * 每次投递的时间间隔
     */
    private static final long PERIOD = 4 * 1000;
    /**
     * 投递的次数
     */
    private static final int REPEAT = 5;
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
        // 5.创建消息的生产者，一向上转型为ActiveMQMessageProducer
        ActiveMQMessageProducer activeMQMessageProducer = (ActiveMQMessageProducer) session.createProducer(queue);
        // 6.通过消息生产者生产6条消息发送MQ队列
        for (int i = 0; i < 3; i++) {
            // 7.创建消息
            TextMessage textMessage = session.createTextMessage("延迟投递和定时投递消息" + i + ":hello world\n");
            // 给消息设置一个唯一的id可以知道哪条消息发送成功，哪条消息发送失败
            textMessage.setJMSMessageID(UUID.randomUUID().toString());
            String msgId = textMessage.getJMSMessageID();
            // 延迟投递的时间
            textMessage.setLongProperty(ScheduledMessage.AMQ_SCHEDULED_DELAY, DELAY);
            // 每次投递的时间间隔
            textMessage.setLongProperty(ScheduledMessage.AMQ_SCHEDULED_PERIOD, PERIOD);
            // 投递的次数
            textMessage.setIntProperty(ScheduledMessage.AMQ_SCHEDULED_REPEAT, REPEAT);
            // 8.将消息发送到MQ，并回调判断消息是否发送成功
            activeMQMessageProducer.send(textMessage);
        }
        // 9.关闭资源
        activeMQMessageProducer.close();
        session.close();
        connection.close();
        System.out.println("finish");
    }
}
```

先启动消费者，再启动生产者，然后观察消费者控制台，结果如下：

### 消息重试机制

## 是什么

消费者收到消息，之后出现异常了，没有告诉broker确认收到该消息，broker会尝试再将该消息发送给消费者。尝试n次，如果消费者还是没有确认收到该消息，那么该消息将被放到死信队列重，之后broker不会再将该消息发送给消费者。

## 以下情况会引发消息重发：

activeMQ中的消息重发，指的是消息可以被broker重新分派给消费者，不一定的之前的消费者。重发消息之后，消费者可以重新消费。消息重发的情况有以下几种：

**1、** Client用了transactions且在session中调用了rollback；

**2、** Client用了transactions且在调用commit之前关闭或者没有commit；

**3、** Client再CLIENT_ACKNOWLEDGE的传递模式下，session中调用了recover；

**4、** Client连接超时(可能正在执行的代码花费的时间比配置的超时时间长)；

## 请说说消息重发时间间隔和重发次数

间隔：1

次数：6

每秒发6次

消息默认重发时间间隔为1秒，默认重发次数为6。一个消息被redelivedred超过默认的最大重发次数（默认6次）时，消费端会给MQ发一个“poison ack”表示这个消息有毒，告诉broker不要再发了。这个时候broker会把这个消息放到DLQ（死信队列）。

## 案例演示（演示第2种没有提交事务引发的重试机制）

生产者代码：

```java
package com.huazai.activemq.advanced;
import org.apache.activemq.ActiveMQConnectionFactory;
import org.apache.activemq.ActiveMQMessageProducer;
import javax.jms.Connection;
import javax.jms.Queue;
import javax.jms.Session;
import javax.jms.TextMessage;
/**
 * ActiveMQ高级特性之重试机制生产者
 *
 * @author DDKK.COM 弟弟快看，程序员编程资料站
 * @date 2022/2/1 23:24
 */
public class JmsProduceRedeliveryPolicy {
    // ActiveMQ服务地址
    public static final String ACTIVEMQ_URL = "tcp://192.168.64.129:61616";
    // 消息队列名称
    public static final String QUEUE_NAME = "queue-redelivery-policy";
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
        // 5.创建消息的生产者，一定要向上转型为ActiveMQMessageProducer类型才有异步投递功能
        ActiveMQMessageProducer activeMQMessageProducer = (ActiveMQMessageProducer) session.createProducer(queue);
        // 6.通过消息生产者生产消息发送MQ队列
        // 7.创建消息
        TextMessage textMessage = session.createTextMessage("投递消息：" + ":hello world");
        // 8.将消息发送到MQ，并回调判断消息是否发送成功
        activeMQMessageProducer.send(textMessage);
        // 9.关闭资源
        activeMQMessageProducer.close();
        session.close();
        connection.close();
        System.out.println("finish");
    }
}
```

消费者代码：

```java
package com.huazai.activemq.advanced;
import org.apache.activemq.ActiveMQConnectionFactory;
import javax.jms.*;
/**
 * ActiveMQ高级特性之重试机制消费者
 *
 * @author DDKK.COM 弟弟快看，程序员编程资料站
 * @date 2022/2/1 23:29
 */
public class JmsConsumerRedeliveryPolicy {
    // ActiveMQ服务地址
    public static final String ACTIVEMQ_URL = "tcp://192.168.64.129:61616";
    // 消息队列名称，取消息必须和存消息的队列名称一致
    public static final String QUEUE_NAME = "queue-redelivery-policy";
    public static void main(String[] args) throws Exception {
        // 1.创建给定ActiveMQ服务连接工厂，使用默认的用户名和密码
        ActiveMQConnectionFactory activeMQConnectionFactory = new ActiveMQConnectionFactory(ACTIVEMQ_URL);
        // 2.通过连接工厂，创建连接对象并启动访问
        Connection connection = activeMQConnectionFactory.createConnection();
        connection.start();
        // 3.创建会话，true开启事务
        Session session = connection.createSession(true, Session.AUTO_ACKNOWLEDGE);
        // 4.创建目的地（队列或者主题）
        Queue queue = session.createQueue(QUEUE_NAME);
        // 5.创建消费者
        MessageConsumer consumer = session.createConsumer(queue);
        while (true) {
            // 接受消息根据生产者发送消息类型强类型转换
            TextMessage message = (TextMessage) consumer.receive();
            if (message != null) {
                String text = message.getText();
                System.out.println(text);
                // 注意此处故意不提交事务
                // session.commit();
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

注意消费者代码已开启事务，但故意不提交事务。\color{red}注意消费者代码已开启事务，但故意不提交事务。注意消费者代码已开启事务，但故意不提交事务。
启动生产者服务，再启动消费者服务，消费者能成功接收到队列的消息，但是控制台的消息并未出队。

再重新启动消费者服务，发现之前消费的消息还能重复消费。ActiveMQ默认重发次数为6次，当消费者第七次启动消费消息时，发现消费不到消息，查看控制台发现，未消费的消息已出队列，并且多出了一个名为ActiveMQ.DLQ的队列。

ActiveMQ.DLQ即为死信队列，超过重复消费上限次数（6次）的消息被放到了死信队列里。

此时如果我们把代码里的队列名称改成ActiveMQ.DLQ，同样会拿到之前重复消费的消息。

```java
public static final String QUEUE_NAME = "ActiveMQ.DLQ";
```

### 有毒消息Poison ACK

一个消息被redelivedred超过默认的最大重发次数（默认6次）时，消费的回个MQ发一个“poison ack”表示这个消息有毒，告诉broker不要再发了。这个时候broker会把这个消息放到DLQ（私信队列）。

## 属性说明

## 整合spring

## 小总结

基本上述的标题都是大厂常规面试题目，建议将下一篇都看完
