# 06、ActiveMQ 实战 - ActiveMQ的Broker
- 来源：https://ddkk.com/zhuanlan/mq/activemq/3/6.html
- 分类：消息队列
- 分组：教程目录
### 是什么？

相当于一个内嵌式ActiveMQ服务器实例。其实就是实现了用代码的形式启动ActiveMQ将MQ嵌入到Java代码中，以便随时用随时启动，在用的时候再去启动这样能节省了资源，也保证了可用性。

用ActiveMQ Broker作为独立的消息服务器来构建Java应用。ActiveMQ也支持在vm中通信基于嵌入的broker，能够无缝的集成其他java应用。

换言之，类似SpringBoot内嵌了一个Tomcat服务器。

### 怎么用？

POM依赖如下：

```xml
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
<!--这是启动broker服务需要依赖的jar包-->
<dependency>
    <groupId>com.fasterxml.jackson.core</groupId>
    <artifactId>jackson-databind</artifactId>
    <version>2.10.1</version>
</dependency>
```

JAVA代码如下：

```java
package com.huazai.activemq.broker;
import org.apache.activemq.broker.BrokerService;
/**
 * @author DDKK.COM 弟弟快看，程序员编程资料站
 * @date 2022/1/6 23:01
 */
public class EmbedBroker {
    public static void main(String[] args) throws Exception {
        // 创建broker服务实例
        BrokerService brokerService = new BrokerService();
        brokerService.setPopulateJMSXUserID(true);
        // 绑定地址，此处不是再使用linux服务器上的ip地址
        brokerService.addConnector("tcp://127.0.0.1:61616");
        // 启动服务
        brokerService.start();
    }
}
```

启动main函数，再命令行上输入jps -l出现你编写的类名，则表示broker服务启动成功。

### 测试

在连接linux服务器上ActiveMQ的基础上，把连接到linux服务器的ip地址改成本机地址即可。参考：[Java编码实现ActiveMQ通讯（Topic）](/zhuanlan/mq/activemq/3/4.html)

消息提供者代码如下

```java
package com.huazai.activemq.broker;
import org.apache.activemq.ActiveMQConnectionFactory;
import javax.jms.*;
/**
 * @author DDKK.COM 弟弟快看，程序员编程资料站
 * @date 2020/12/23 23:21
 */
public class JMSProducer {
    // ActiveMQ服务地址
    public static final String ACTIVEMQ_URL = "tcp://127.0.0.1:61616";
    // 消息队列名称
    public static final String QUEUE_NAME = "broker-queue";
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

消息消费者代码如下：

```java
package com.huazai.activemq.broker;
import org.apache.activemq.ActiveMQConnectionFactory;
import javax.jms.*;
/**
 * @author DDKK.COM 弟弟快看，程序员编程资料站
 * @date 2020/12/24 22:09
 */
public class JMSConsumer {
    // ActiveMQ服务地址
    public static final String ACTIVEMQ_URL = "tcp://127.0.0.1:61616";
    // 消息队列名称，取消息必须和存消息的队列名称一致
    public static final String QUEUE_NAME = "broker-queue";
    public static void main(String[] args) throws Exception {
        // 1.创建给定ActiveMQ服务连接工厂，使用默认的用户名和密码
        ActiveMQConnectionFactory activeMQConnectionFactory = new ActiveMQConnectionFactory(ACTIVEMQ_URL);
        // 2.通过连接工厂，创建连接对象并启动访问
        Connection connection = activeMQConnectionFactory.createConnection();
        connection.start();
        // 3.创建会话，第一个参数为是否开启事务，第二个参数为签收
        Session session = connection.createSession(false, Session.CLIENT_ACKNOWLEDGE);
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
                message.acknowledge();
//                session.commit();
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

先启动消息提供者，把消息发送到broker，再启动消息消费者，消费者能从队列中成功获取消息，则表示测试成功。
