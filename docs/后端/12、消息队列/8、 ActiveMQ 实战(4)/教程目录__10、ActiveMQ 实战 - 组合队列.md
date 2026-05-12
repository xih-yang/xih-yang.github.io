# 10、ActiveMQ 实战 - 组合队列
- 来源：https://ddkk.com/zhuanlan/mq/activemq/4/10.html
- 分类：消息队列
- 分组：教程目录
组合队列支持通过一个队列发送给多个队列或主题

## 1 客户端实现方式

### 1.1 实现概述

在composite destinations中，多个destination之间采用“,”分割。例如：

Queue queue = new ActiveMQQueue("FOO.A,FOO.B,FOO.C");

如果你希望使用不同类型的destination，那么需要加上前缀如queue:// 或topic://，例如：

Queue queue = new ActiveMQQueue("FOO.A,topic://NOTIFY.FOO.A");

### 1.2 代码实现

#### 1.2.1 容器中注入compositeDestinationContext

```java
@Bean
public ActiveMqContext compositeDestinationContext() throws JMSException {
          Connection connection = ActiveMQUtil.factory.createConnection();
          connection.start();
          Session session = connection.createSession(false, Session.AUTO_ACKNOWLEDGE);
          // compositeDestinationName=composite-queue1,topic://composite-topic1
          Destination destination = session.createQueue(compositeDestinationName);
          MessageProducer producer = session.createProducer(destination);
          return new ActiveMqContext(connection, session, null, producer, null, null, Boolean.FALSE);
}
```

#### 1.2.2 CompositeProcedure

```java
@Component
public class CompositeProcedure {
          @Resource(name = "compositeDestinationContext")
          private ActiveMqContext context;
          public void sendMsg(String msg) throws JMSException {
                    ActiveMQUtil.sendMsg(context, msg);
          }
}
```

#### 1.2.3 CompositeQueueConsumer

```java
@Slf4j
@Component
public class CompositeQueueConsumer {
  public void receiveMsg() throws JMSException, InterruptedException {
            Connection connection = ActiveMQUtil.factory.createConnection();
            Session session = connection.createSession(Boolean.FALSE, Session.AUTO_ACKNOWLEDGE);
            Queue queue = session.createQueue("composite-queue1");
            MessageConsumer consumer = session.createConsumer(queue);
            connection.start();
            MessageListener listener1 = message -> {
                      try {
                                log.info("queue receive message:{}", ((TextMessage)message).getText());
                      } catch (Exception e) {
                                e.printStackTrace();
                      }
            };
            consumer.setMessageListener(listener1);
            Thread.sleep(5000000L);
  }
}
```

#### 1.2.4 CompositeTopicConsumer

```java
@Slf4j
@Component
public class CompositeTopicConsumer {
  public void receiveMsg() throws JMSException, InterruptedException {
            Connection connection = ActiveMQUtil.factory.createConnection();
            Session session = connection.createSession(Boolean.FALSE, Session.AUTO_ACKNOWLEDGE);
            Topic topic = session.createTopic("composite-topic1");
            MessageConsumer consumer = session.createConsumer(topic);
            connection.start();
            MessageListener listener = message -> {
                      try {
                                log.info("topic receive message:{}", ((TextMessage)message).getText());
                      } catch (Exception e) {
                                e.printStackTrace();
                      }
            };
            consumer.setMessageListener(listener);
            Thread.sleep(5000000L);
  }
}
```

#### 1.2.5 测试代码

```java
@Autowired
private CompositeProcedure procedure;
@Autowired
private CompositeQueueConsumer queueConsumer;
@Autowired
private CompositeTopicConsumer topicConsumer;
@Test
public void sendMsg() throws JMSException, InterruptedException {
          new Thread(() -> {
                    try {
                              receiveMsg1();
                    } catch (JMSException | InterruptedException e) {
                              e.printStackTrace();
                    }
          }).start();
          new Thread(() -> {
                    try {
                              receiveMsg2();
                    } catch (JMSException | InterruptedException e) {
                              e.printStackTrace();
                    }
          }).start();
          TimeUnit.SECONDS.sleep(5);
          for (int i = 0; i < 10; i ++) {
                    procedure.sendMsg("msg-" + i);
                    Thread.sleep(100);
          }
          TimeUnit.MINUTES.sleep(1);
}
private void receiveMsg1() throws JMSException, InterruptedException {
          queueConsumer.receiveMsg();
}
private void receiveMsg2() throws JMSException, InterruptedException {
          topicConsumer.receiveMsg();
}
```

输出
2022-07-20 22:02:34.055 - [ActiveMQ Session Task-1] INFO c.j.a.d.c.CompositeTopicConsumer : 25 - topic receive message:msg-0

2022-07-20 22:02:34.059 - [ActiveMQ Session Task-1] INFO c.j.a.d.c.CompositeQueueConsumer : 25 - queue receive message:msg-0

2022-07-20 22:02:34.057 - [ActiveMQ NIO Worker 8] INFO org.apache.activemq.jms.pool.PooledProducer : 106 - send mq msg success, msg:ActiveMQTextMessage {commandId = 0, responseRequired = false, messageId = ID:LAPTOP-7KJFACUD-51175-1595253745530-1:1:1:1:1, originalDestination = null, originalTransactionId = null, producerId = null, destination = composite-queue1,topic://composite-topic1, transactionId = null, expiration = 0, timestamp = 1595253754025, arrival = 0, brokerInTime = 0, brokerOutTime = 0, correlationId = null, replyTo = null, persistent = true, type = null, priority = 4, groupID = null, groupSequence = 0, targetConsumerId = null, compressed = false, userID = null, content = null, marshalledProperties = null, dataStructure = null, redeliveryCounter = 0, size = 0, properties = null, readOnlyProperties = false, readOnlyBody = false, droppable = false, jmsXGroupFirstForConsumer = false, text = msg-0}

2022-07-20 22:02:34.134 - [ActiveMQ Session Task-1] INFO c.j.a.d.c.CompositeTopicConsumer : 25 - topic receive message:msg-1

2022-07-20 22:02:34.134 - [ActiveMQ NIO Worker 8] INFO org.apache.activemq.jms.pool.PooledProducer : 106 - send mq msg success, msg:ActiveMQTextMessage {commandId = 0, responseRequired = false, messageId = ID:LAPTOP-7KJFACUD-51175-1595253745530-1:1:1:1:2, originalDestination = null, originalTransactionId = null, producerId = null, destination = composite-queue1,topic://composite-topic1, transactionId = null, expiration = 0, timestamp = 1595253754128, arrival = 0, brokerInTime = 0, brokerOutTime = 0, correlationId = null, replyTo = null, persistent = true, type = null, priority = 4, groupID = null, groupSequence = 0, targetConsumerId = null, compressed = false, userID = null, content = null, marshalledProperties = null, dataStructure = null, redeliveryCounter = 0, size = 0, properties = null, readOnlyProperties = false, readOnlyBody = false, droppable = false, jmsXGroupFirstForConsumer = false, text = msg-1}

2022-07-20 22:02:34.134 - [ActiveMQ Session Task-1] INFO c.j.a.d.c.CompositeQueueConsumer : 25 - queue receive message:msg-1

2022-07-20 22:02:34.244 - [ActiveMQ Session Task-1] INFO c.j.a.d.c.CompositeTopicConsumer : 25 - topic receive message:msg-2

2022-07-20 22:02:34.256 - [ActiveMQ Session Task-1] INFO c.j.a.d.c.CompositeQueueConsumer : 25 - queue receive message:msg-2

2022-07-20 22:02:34.270 - [ActiveMQ NIO Worker 8] INFO org.apache.activemq.jms.pool.PooledProducer : 106 - send mq msg success, msg:ActiveMQTextMessage {commandId = 0, responseRequired = false, messageId = ID:LAPTOP-7KJFACUD-51175-1595253745530-1:1:1:1:3, originalDestination = null, originalTransactionId = null, producerId = null, destination = composite-queue1,topic://composite-topic1, transactionId = null, expiration = 0, timestamp = 1595253754230, arrival = 0, brokerInTime = 0, brokerOutTime = 0, correlationId = null, replyTo = null, persistent = true, type = null, priority = 4, groupID = null, groupSequence = 0, targetConsumerId = null, compressed = false, userID = null, content = null, marshalledProperties = null, dataStructure = null, redeliveryCounter = 0, size = 0, properties = null, readOnlyProperties = false, readOnlyBody = false, droppable = false, jmsXGroupFirstForConsumer = false, text = msg-2}

2022-07-20 22:02:34.335 - [ActiveMQ Session Task-1] INFO c.j.a.d.c.CompositeTopicConsumer : 25 - topic receive message:msg-3

2022-07-20 22:02:34.335 - [ActiveMQ NIO Worker 8] INFO org.apache.activemq.jms.pool.PooledProducer : 106 - send mq msg success, msg:ActiveMQTextMessage {commandId = 0, responseRequired = false, messageId = ID:LAPTOP-7KJFACUD-51175-1595253745530-1:1:1:1:4, originalDestination = null, originalTransactionId = null, producerId = null, destination = composite-queue1,topic://composite-topic1, transactionId = null, expiration = 0, timestamp = 1595253754332, arrival = 0, brokerInTime = 0, brokerOutTime = 0, correlationId = null, replyTo = null, persistent = true, type = null, priority = 4, groupID = null, groupSequence = 0, targetConsumerId = null, compressed = false, userID = null, content = null, marshalledProperties = null, dataStructure = null, redeliveryCounter = 0, size = 0, properties = null, readOnlyProperties = false, readOnlyBody = false, droppable = false, jmsXGroupFirstForConsumer = false, text = msg-3}

2022-07-20 22:02:34.335 - [ActiveMQ Session Task-1] INFO c.j.a.d.c.CompositeQueueConsumer : 25 - queue receive message:msg-3

2022-07-20 22:02:34.435 - [ActiveMQ Session Task-1] INFO c.j.a.d.c.CompositeTopicConsumer : 25 - topic receive message:msg-4

2022-07-20 22:02:34.439 - [ActiveMQ Session Task-1] INFO c.j.a.d.c.CompositeQueueConsumer : 25 - queue receive message:msg-4

2022-07-20 22:02:34.453 - [ActiveMQ NIO Worker 8] INFO org.apache.activemq.jms.pool.PooledProducer : 106 - send mq msg success, msg:ActiveMQTextMessage {commandId = 0, responseRequired = false, messageId = ID:LAPTOP-7KJFACUD-51175-1595253745530-1:1:1:1:5, originalDestination = null, originalTransactionId = null, producerId = null, destination = composite-queue1,topic://composite-topic1, transactionId = null, expiration = 0, timestamp = 1595253754433, arrival = 0, brokerInTime = 0, brokerOutTime = 0, correlationId = null, replyTo = null, persistent = true, type = null, priority = 4, groupID = null, groupSequence = 0, targetConsumerId = null, compressed = false, userID = null, content = null, marshalledProperties = null, dataStructure = null, redeliveryCounter = 0, size = 0, properties = null, readOnlyProperties = false, readOnlyBody = false, droppable = false, jmsXGroupFirstForConsumer = false, text = msg-4}

2022-07-20 22:02:34.539 - [ActiveMQ Session Task-1] INFO c.j.a.d.c.CompositeTopicConsumer : 25 - topic receive message:msg-5

2022-07-20 22:02:34.539 - [ActiveMQ NIO Worker 8] INFO org.apache.activemq.jms.pool.PooledProducer : 106 - send mq msg success, msg:ActiveMQTextMessage {commandId = 0, responseRequired = false, messageId = ID:LAPTOP-7KJFACUD-51175-1595253745530-1:1:1:1:6, originalDestination = null, originalTransactionId = null, producerId = null, destination = composite-queue1,topic://composite-topic1, transactionId = null, expiration = 0, timestamp = 1595253754535, arrival = 0, brokerInTime = 0, brokerOutTime = 0, correlationId = null, replyTo = null, persistent = true, type = null, priority = 4, groupID = null, groupSequence = 0, targetConsumerId = null, compressed = false, userID = null, content = null, marshalledProperties = null, dataStructure = null, redeliveryCounter = 0, size = 0, properties = null, readOnlyProperties = false, readOnlyBody = false, droppable = false, jmsXGroupFirstForConsumer = false, text = msg-5}

2022-07-20 22:02:34.539 - [ActiveMQ Session Task-1] INFO c.j.a.d.c.CompositeQueueConsumer : 25 - queue receive message:msg-5

2022-07-20 22:02:34.638 - [ActiveMQ Session Task-1] INFO c.j.a.d.c.CompositeTopicConsumer : 25 - topic receive message:msg-6

2022-07-20 22:02:34.638 - [ActiveMQ Session Task-1] INFO c.j.a.d.c.CompositeQueueConsumer : 25 - queue receive message:msg-6

2022-07-20 22:02:34.652 - [ActiveMQ NIO Worker 8] INFO org.apache.activemq.jms.pool.PooledProducer : 106 - send mq msg success, msg:ActiveMQTextMessage {commandId = 0, responseRequired = false, messageId = ID:LAPTOP-7KJFACUD-51175-1595253745530-1:1:1:1:7, originalDestination = null, originalTransactionId = null, producerId = null, destination = composite-queue1,topic://composite-topic1, transactionId = null, expiration = 0, timestamp = 1595253754636, arrival = 0, brokerInTime = 0, brokerOutTime = 0, correlationId = null, replyTo = null, persistent = true, type = null, priority = 4, groupID = null, groupSequence = 0, targetConsumerId = null, compressed = false, userID = null, content = null, marshalledProperties = null, dataStructure = null, redeliveryCounter = 0, size = 0, properties = null, readOnlyProperties = false, readOnlyBody = false, droppable = false, jmsXGroupFirstForConsumer = false, text = msg-6}

2022-07-20 22:02:34.738 - [ActiveMQ Session Task-1] INFO c.j.a.d.c.CompositeTopicConsumer : 25 - topic receive message:msg-7

2022-07-20 22:02:34.740 - [ActiveMQ Session Task-1] INFO c.j.a.d.c.CompositeQueueConsumer : 25 - queue receive message:msg-7

2022-07-20 22:02:34.740 - [ActiveMQ NIO Worker 8] INFO org.apache.activemq.jms.pool.PooledProducer : 106 - send mq msg success, msg:ActiveMQTextMessage {commandId = 0, responseRequired = false, messageId = ID:LAPTOP-7KJFACUD-51175-1595253745530-1:1:1:1:8, originalDestination = null, originalTransactionId = null, producerId = null, destination = composite-queue1,topic://composite-topic1, transactionId = null, expiration = 0, timestamp = 1595253754736, arrival = 0, brokerInTime = 0, brokerOutTime = 0, correlationId = null, replyTo = null, persistent = true, type = null, priority = 4, groupID = null, groupSequence = 0, targetConsumerId = null, compressed = false, userID = null, content = null, marshalledProperties = null, dataStructure = null, redeliveryCounter = 0, size = 0, properties = null, readOnlyProperties = false, readOnlyBody = false, droppable = false, jmsXGroupFirstForConsumer = false, text = msg-7}

2022-07-20 22:02:34.839 - [ActiveMQ Session Task-1] INFO c.j.a.d.c.CompositeTopicConsumer : 25 - topic receive message:msg-8

2022-07-20 22:02:34.841 - [ActiveMQ Session Task-1] INFO c.j.a.d.c.CompositeQueueConsumer : 25 - queue receive message:msg-8

2022-07-20 22:02:34.852 - [ActiveMQ NIO Worker 8] INFO org.apache.activemq.jms.pool.PooledProducer : 106 - send mq msg success, msg:ActiveMQTextMessage {commandId = 0, responseRequired = false, messageId = ID:LAPTOP-7KJFACUD-51175-1595253745530-1:1:1:1:9, originalDestination = null, originalTransactionId = null, producerId = null, destination = composite-queue1,topic://composite-topic1, transactionId = null, expiration = 0, timestamp = 1595253754838, arrival = 0, brokerInTime = 0, brokerOutTime = 0, correlationId = null, replyTo = null, persistent = true, type = null, priority = 4, groupID = null, groupSequence = 0, targetConsumerId = null, compressed = false, userID = null, content = null, marshalledProperties = null, dataStructure = null, redeliveryCounter = 0, size = 0, properties = null, readOnlyProperties = false, readOnlyBody = false, droppable = false, jmsXGroupFirstForConsumer = false, text = msg-8}

2022-07-20 22:02:34.941 - [ActiveMQ Session Task-1] INFO c.j.a.d.c.CompositeTopicConsumer : 25 - topic receive message:msg-9

2022-07-20 22:02:34.943 - [ActiveMQ Session Task-1] INFO c.j.a.d.c.CompositeQueueConsumer : 25 - queue receive message:msg-9

查看队列

查看主题

## 2 xml配置

```java
<destinationInterceptors>
　　<virtualDestinationInterceptor>
　　　　<virtualDestinations>
　　　　　　<compositeQueue name="MY.QUEUE">
　　　　　　　　<forwardTo>
　　　　　　　　　　<queue physicalName="my-queue" />
　　　　　　　　　　<queue physicalName="my-queue2" />
　　　　　　　　</forwardTo>
　　　　　　</compositeQueue>
　　　　</virtualDestinations>
　　</virtualDestinationInterceptor>
</destinationInterceptors>
```
