# 12、ActiveMQ 实战 - 顺序消费和消息分组
- 来源：https://ddkk.com/zhuanlan/mq/activemq/4/12.html
- 分类：消息队列
- 分组：教程目录
## 1 消息分组

### 1.1 概述

从Apache官方文档的话说，是Exclusive Consumer功能的增强。逻辑上，可以看成是一种并发的Exclusive Consumer。JMS消息属性JMXGroupID被用来区分Message Group。Message Groups特性保证所有具有相同JMSGroupID的消息会被分发到相同的Consumer（只要这个Consumer保持Active）。另一方面，Message Groups也是一种负载均衡的机制。

在一个消息被分发到Consumer前，Broker会检查消息的JMSGroupID属性。如果存在，那么broker会检查是否有某个Consumer拥有这个Message Group。如果没有，那么broker会选择一个Consumer，并将它关联到这个Message Group。此后，这个Consumer会接收这个Message Group的所有消息。直到Consumer被关闭。

Message Group被关闭。通过发送一个消息，并设置这个消息的JMSXGroupSeq为-1.

从4.1版本开始，ActiveMQ支持一个布尔字段JMSXGroupFirstForConsumer 。当某个message group的第一个消息被发送到consumer的时候，这个字段被设置。如果客户使用failover transport连接到broker。在由于网络问题等造成客户重新连接到broker的时候，相同message group的消息可能会被分发到不同与之前的consumer，因此JMSXGroupFirstForConsumer字段也会被重新设置。

### 1.2 测试代码

#### 1.2.1 生产者发送消息

```java
public class OrderProcedure {
 public static void main(String[] args) throws JMSException, InterruptedException {
              ConnectionFactory factory = ActiveMQUtil.factory;
              Connection connection = factory.createConnection();
              connection.start();
              Session session = connection.createSession(Boolean.FALSE, Session.AUTO_ACKNOWLEDGE);
              Destination destination = session.createQueue("order-queue");
              MessageProducer producer = session.createProducer(destination);
              for (int i = 0; i < 20; i ++) {
                           TextMessage message = session.createTextMessage("message-" + i);
                           message.setStringProperty(CompositeDataConstants.JMSXGROUP_ID, i % 2 + "");
                           producer.send(message);
              }
              session.close();
              connection.close();
 }
}
```

#### 1.2.2 消费者消费消息

```java
@Slf4j
public class OrderConsumer {
public static void main(String[] args) throws JMSException, InterruptedException {
  ConnectionFactory factory = ActiveMQUtil.factory;
  Connection connection = factory.createConnection();
  connection.start();
  for (int i = 1; i <= 2; i ++) {
               new Thread(() -> {
                            try {
                                         Session session = connection.createSession(Boolean.FALSE, Session.AUTO_ACKNOWLEDGE);
                                         Destination destination = session.createQueue("order-queue");
                                         MessageConsumer consumer = session.createConsumer(destination);
                                         TextMessage message = (TextMessage) consumer.receive(1000);
                                         while (message != null) {
                                                      log.info("receive msg:" + message.getText() + ", group:" + message.getStringProperty(CompositeDataConstants.JMSXGROUP_ID));
                                                      message = (TextMessage) consumer.receive(1000);
                                         }
                            }catch (Exception e) {
                                         e.printStackTrace();
                            }
               }).start();
  }
  TimeUnit.HOURS.sleep(1);
}
}
```

先启动消费者，再启动生产者

输出：

可以发现，线程Thread-2总是消费group=0的消息，线程Thread-3总是消费group=1的消息

## 2 顺序消费

从ActiveMQ4.X版本开始支持ExclusiveConsumer（或者说是Exclusive Queues）。Broker会从多个Consumer中挑选一个Consumer来处理所有的消息，从而保证消息的有序处理。如果这个Consumer失效，那么Broker会自动切换到其他的Consumer。

可以通过Destination的Option来创建一个Exclusive Consumer，如下：

queue = new ActiveMQQueue("Test.Queue?consumer.exclusive=true");

consumer = session.createConsumer(queue);

这里对上述代码稍作修改，设置消费者独占模式

同样先启动消费者，在启动生产者，输出

可以看到，所有的消息只被一个消费者消费
