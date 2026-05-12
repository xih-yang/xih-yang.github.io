# 02、ActiveMQ 实战 - 点对点消息和发布订阅消息
- 来源：https://ddkk.com/zhuanlan/mq/activemq/4/2.html
- 分类：消息队列
- 分组：教程目录
## 1 消息传递域介绍

JMS规范中定义了两种消息传递域：点对点（point-topoint，简写成P2P）消息传递域和发布/订阅消息传递域（publish/subscribe，简写成pub/sub）。在点对点消息传递域中，目的地被称为队列（queue）；在发布/订阅消息传递域中，目的地被称为主题（topic）

**点对点消息传递域的特点如下：**

1、每个消息只能有一个消费者。不是每一个队列只能有一个消费者

2、消息的生产者和消费者之间没有时间上的相关性。无论消费者在生产者发送消息的时候是否处于运行状态，它都可以提取消息。类似于发短信。

**发布/订阅消息传递域的特点如下：**

1、每个消息可以有多个消费者，可以想象成关注微博中的一个话题。的确和微博比较像，哈哈

2、生产者和消费者之间有时间上的相关性。订阅一个主题的消费者只能消费自它订阅之后发布的消息，订阅之前的消息是收不到的。JMS规范允许客户创建持久订阅，这在一定程度上放松了时间上的相关性要求。持久订阅允许消费者消费它在未处于激活状态时发送的消息。

## 2 统一处理方法

```java
// 定义ActiveMqContext
@Data
@AllArgsConstructor
public class ActiveMqContext {
          private Connection connection;
          private Session session;
          private Session listenerSession;
          private MessageProducer producer;
          private MessageConsumer consumer;
          private MessageConsumer listener;
          private boolean transaction;
}
// 统一发送消息
public static void sendMsg(ActiveMqContext context, String msg, int priority) throws JMSException {
          Session session = context.getSession();
          MessageProducer producer = context.getProducer();
          TextMessage message = session.createTextMessage(msg);
          message.setJMSPriority(priority);
          producer.send(message);
          if (context.isTransaction()) {
                    context.getSession().commit();
          }
}
// 统一接收消息
public static void receiveMsg(ActiveMqContext context) throws JMSException {
          MessageConsumer consumer = context.getConsumer();
          // timeout表示等待时间。超过timeout没有消息方法就解除阻塞
          TextMessage message = (TextMessage) consumer.receive();
          while (message != null) {
                    log.info("receive msg:{}", message.getText());
                    message = (TextMessage) consumer.receive(60000);
                    if (Objects.nonNull(message)) {
                              // 如果没配置事务，设置手动签收后客户端收到消息需要调ack方法才能够接收成功
                              message.acknowledge();
                              if (context.isTransaction()) {
                                        // 支持事务后commit才会真正消费
                                        context.getSession().commit();
                              }
                    }
          }
}
// 统一监听消息
public static void listenMsg(ActiveMqContext context) throws JMSException {
          MessageConsumer listener = context.getListener();
          Session listenerSession = context.getListenerSession();
          listener.setMessageListener((message) -> {
                    try {
                              log.info("listen msg:{}", ((TextMessage) message).getText());
                              if (context.isTransaction()) {
                                        listenerSession.commit();
                              }
                    } catch (JMSException e) {
                              e.printStackTrace();
                    }
          });
}
```

## 3 点对点消息测试

### 3.1 获取点对点ActiveMqContext

```java
public static ActiveMqContext getQueueContext(Boolean transaction, int acknowledgeMode, int deliveryMode, String queueName) throws JMSException {
        Connection connection = factory.createConnection();
        connection.start();
        // 支持事务后send后不会发送，commit后才会发出去。签收是自动签收，配置手动签收不生效
        // 设置手动签收后客户端收到消息需要调ack方法才能够接收成功
        Session session = connection.createSession(transaction, acknowledgeMode);
        Destination destination = session.createQueue(queueName);
        MessageProducer producer = session.createProducer(destination);
        // 设置持久化后, JMS提供者出现故障，该消息并不会丢失，它会在服务器恢复之后再次传递
        producer.setDeliveryMode(deliveryMode);
        MessageConsumer consumer = session.createConsumer(destination);
        connection = factory.createConnection();
        connection.start();
        // 支持事务后send后不会发送，commit后才会发出去。签收是自动签收，配置手动签收不生效
        // 设置手动签收后客户端收到消息需要调ack方法才能够接收成功
        Session listenerSession = connection.createSession(transaction, acknowledgeMode);
        MessageConsumer listener = listenerSession.createConsumer(destination);
        return new ActiveMqContext(connection, session, listenerSession, producer, consumer, listener, transaction);
}
```

### 3.2 spring中注入一个点对点发送的context

```java
@Bean
public ActiveMqContext queueContext() throws JMSException {
          return ActiveMQUtil.getQueueContext(Boolean.FALSE, Session.AUTO_ACKNOWLEDGE, DeliveryMode.PERSISTENT, queueName);
}
```

### 3.3 消息生产者

```java
@Component
public class QueueProcedure {
             @Resource(name = "queueContext")
             private ActiveMqContext context;
             public void sendMsg(String msg) throws JMSException {
                          ActiveMQUtil.sendMsg(context, msg);
             }
}
```

### 3.4 消息消费者

```java
@Component
public class QueueConsumer {
             @Resource(name = "queueContext")
             private ActiveMqContext context;
             public void receiveMsg() throws JMSException {
                          ActiveMQUtil.receiveMsg(context);
             }
}
```

### 3.5 消息监听者

```java
@Component
public class QueueListener {
          @Resource(name = "queueContext")
          private ActiveMqContext context;
          public void receiveMsg() throws JMSException {
                    ActiveMQUtil.listenMsg(context);
          }
}
```

### 3.6 测试代码

#### 3.6.1 发送消息

```java
@Test
public void sendMsg() throws JMSException, InterruptedException {
      for (int i = 0; i < 10; i ++) {
                procedure.sendMsg("msg-" + i);
                Thread.sleep(100);
      }
}
```

输出
2022-07-13 23:43:53.106 - [ActiveMQ NIO Worker 8] INFO org.apache.activemq.jms.pool.PooledProducer : 106 - send mq msg success, msg:ActiveMQTextMessage {commandId = 0, responseRequired = false, messageId = ID:LAPTOP-7KJFACUD-60057-1594655029182-1:2:1:1:1, originalDestination = null, originalTransactionId = null, producerId = null, destination = queue://demo-queue, transactionId = null, expiration = 0, timestamp = 1594655033092, arrival = 0, brokerInTime = 0, brokerOutTime = 0, correlationId = null, replyTo = null, persistent = true, type = null, priority = 4, groupID = null, groupSequence = 0, targetConsumerId = null, compressed = false, userID = null, content = null, marshalledProperties = null, dataStructure = null, redeliveryCounter = 0, size = 0, properties = null, readOnlyProperties = false, readOnlyBody = false, droppable = false, jmsXGroupFirstForConsumer = false, text = msg-0}

2022-07-13 23:43:53.199 - [ActiveMQ NIO Worker 8] INFO org.apache.activemq.jms.pool.PooledProducer : 106 - send mq msg success, msg:ActiveMQTextMessage {commandId = 0, responseRequired = false, messageId = ID:LAPTOP-7KJFACUD-60057-1594655029182-1:2:1:1:2, originalDestination = null, originalTransactionId = null, producerId = null, destination = queue://demo-queue, transactionId = null, expiration = 0, timestamp = 1594655033194, arrival = 0, brokerInTime = 0, brokerOutTime = 0, correlationId = null, replyTo = null, persistent = true, type = null, priority = 4, groupID = null, groupSequence = 0, targetConsumerId = null, compressed = false, userID = null, content = null, marshalledProperties = null, dataStructure = null, redeliveryCounter = 0, size = 0, properties = null, readOnlyProperties = false, readOnlyBody = false, droppable = false, jmsXGroupFirstForConsumer = false, text = msg-1}

2022-07-13 23:43:53.313 - [ActiveMQ NIO Worker 8] INFO org.apache.activemq.jms.pool.PooledProducer : 106 - send mq msg success, msg:ActiveMQTextMessage {commandId = 0, responseRequired = false, messageId = ID:LAPTOP-7KJFACUD-60057-1594655029182-1:2:1:1:3, originalDestination = null, originalTransactionId = null, producerId = null, destination = queue://demo-queue, transactionId = null, expiration = 0, timestamp = 1594655033294, arrival = 0, brokerInTime = 0, brokerOutTime = 0, correlationId = null, replyTo = null, persistent = true, type = null, priority = 4, groupID = null, groupSequence = 0, targetConsumerId = null, compressed = false, userID = null, content = null, marshalledProperties = null, dataStructure = null, redeliveryCounter = 0, size = 0, properties = null, readOnlyProperties = false, readOnlyBody = false, droppable = false, jmsXGroupFirstForConsumer = false, text = msg-2}

2022-07-13 23:43:53.399 - [ActiveMQ NIO Worker 8] INFO org.apache.activemq.jms.pool.PooledProducer : 106 - send mq msg success, msg:ActiveMQTextMessage {commandId = 0, responseRequired = false, messageId = ID:LAPTOP-7KJFACUD-60057-1594655029182-1:2:1:1:4, originalDestination = null, originalTransactionId = null, producerId = null, destination = queue://demo-queue, transactionId = null, expiration = 0, timestamp = 1594655033395, arrival = 0, brokerInTime = 0, brokerOutTime = 0, correlationId = null, replyTo = null, persistent = true, type = null, priority = 4, groupID = null, groupSequence = 0, targetConsumerId = null, compressed = false, userID = null, content = null, marshalledProperties = null, dataStructure = null, redeliveryCounter = 0, size = 0, properties = null, readOnlyProperties = false, readOnlyBody = false, droppable = false, jmsXGroupFirstForConsumer = false, text = msg-3}

2022-07-13 23:43:53.515 - [ActiveMQ NIO Worker 8] INFO org.apache.activemq.jms.pool.PooledProducer : 106 - send mq msg success, msg:ActiveMQTextMessage {commandId = 0, responseRequired = false, messageId = ID:LAPTOP-7KJFACUD-60057-1594655029182-1:2:1:1:5, originalDestination = null, originalTransactionId = null, producerId = null, destination = queue://demo-queue, transactionId = null, expiration = 0, timestamp = 1594655033496, arrival = 0, brokerInTime = 0, brokerOutTime = 0, correlationId = null, replyTo = null, persistent = true, type = null, priority = 4, groupID = null, groupSequence = 0, targetConsumerId = null, compressed = false, userID = null, content = null, marshalledProperties = null, dataStructure = null, redeliveryCounter = 0, size = 0, properties = null, readOnlyProperties = false, readOnlyBody = false, droppable = false, jmsXGroupFirstForConsumer = false, text = msg-4}

2022-07-13 23:43:53.600 - [ActiveMQ NIO Worker 8] INFO org.apache.activemq.jms.pool.PooledProducer : 106 - send mq msg success, msg:ActiveMQTextMessage {commandId = 0, responseRequired = false, messageId = ID:LAPTOP-7KJFACUD-60057-1594655029182-1:2:1:1:6, originalDestination = null, originalTransactionId = null, producerId = null, destination = queue://demo-queue, transactionId = null, expiration = 0, timestamp = 1594655033596, arrival = 0, brokerInTime = 0, brokerOutTime = 0, correlationId = null, replyTo = null, persistent = true, type = null, priority = 4, groupID = null, groupSequence = 0, targetConsumerId = null, compressed = false, userID = null, content = null, marshalledProperties = null, dataStructure = null, redeliveryCounter = 0, size = 0, properties = null, readOnlyProperties = false, readOnlyBody = false, droppable = false, jmsXGroupFirstForConsumer = false, text = msg-5}

2022-07-13 23:43:53.715 - [ActiveMQ NIO Worker 8] INFO org.apache.activemq.jms.pool.PooledProducer : 106 - send mq msg success, msg:ActiveMQTextMessage {commandId = 0, responseRequired = false, messageId = ID:LAPTOP-7KJFACUD-60057-1594655029182-1:2:1:1:7, originalDestination = null, originalTransactionId = null, producerId = null, destination = queue://demo-queue, transactionId = null, expiration = 0, timestamp = 1594655033697, arrival = 0, brokerInTime = 0, brokerOutTime = 0, correlationId = null, replyTo = null, persistent = true, type = null, priority = 4, groupID = null, groupSequence = 0, targetConsumerId = null, compressed = false, userID = null, content = null, marshalledProperties = null, dataStructure = null, redeliveryCounter = 0, size = 0, properties = null, readOnlyProperties = false, readOnlyBody = false, droppable = false, jmsXGroupFirstForConsumer = false, text = msg-6}

2022-07-13 23:43:53.826 - [ActiveMQ NIO Worker 8] INFO org.apache.activemq.jms.pool.PooledProducer : 106 - send mq msg success, msg:ActiveMQTextMessage {commandId = 0, responseRequired = false, messageId = ID:LAPTOP-7KJFACUD-60057-1594655029182-1:2:1:1:8, originalDestination = null, originalTransactionId = null, producerId = null, destination = queue://demo-queue, transactionId = null, expiration = 0, timestamp = 1594655033798, arrival = 0, brokerInTime = 0, brokerOutTime = 0, correlationId = null, replyTo = null, persistent = true, type = null, priority = 4, groupID = null, groupSequence = 0, targetConsumerId = null, compressed = false, userID = null, content = null, marshalledProperties = null, dataStructure = null, redeliveryCounter = 0, size = 0, properties = null, readOnlyProperties = false, readOnlyBody = false, droppable = false, jmsXGroupFirstForConsumer = false, text = msg-7}

2022-07-13 23:43:53.905 - [ActiveMQ NIO Worker 8] INFO org.apache.activemq.jms.pool.PooledProducer : 106 - send mq msg success, msg:ActiveMQTextMessage {commandId = 0, responseRequired = false, messageId = ID:LAPTOP-7KJFACUD-60057-1594655029182-1:2:1:1:9, originalDestination = null, originalTransactionId = null, producerId = null, destination = queue://demo-queue, transactionId = null, expiration = 0, timestamp = 1594655033899, arrival = 0, brokerInTime = 0, brokerOutTime = 0, correlationId = null, replyTo = null, persistent = true, type = null, priority = 4, groupID = null, groupSequence = 0, targetConsumerId = null, compressed = false, userID = null, content = null, marshalledProperties = null, dataStructure = null, redeliveryCounter = 0, size = 0, properties = null, readOnlyProperties = false, readOnlyBody = false, droppable = false, jmsXGroupFirstForConsumer = false, text = msg-8}

查看mq控制台消息，有10个消息在等待消费

#### 3.6.2 消费者消费消息

```java
@Test
public void receiveMsg() throws JMSException {
          consumer.receiveMsg();
}
```

输出
2022-07-13 23:47:56.409 - [main] INFO com.jms.activemq.ActiveMQUtil : 126 - receive msg:msg-0

2022-07-13 23:47:56.411 - [main] INFO com.jms.activemq.ActiveMQUtil : 126 - receive msg:msg-1

2022-07-13 23:47:56.412 - [main] INFO com.jms.activemq.ActiveMQUtil : 126 - receive msg:msg-2

2022-07-13 23:47:56.412 - [main] INFO com.jms.activemq.ActiveMQUtil : 126 - receive msg:msg-3

2022-07-13 23:47:56.413 - [main] INFO com.jms.activemq.ActiveMQUtil : 126 - receive msg:msg-4

2022-07-13 23:47:56.413 - [main] INFO com.jms.activemq.ActiveMQUtil : 126 - receive msg:msg-5

2022-07-13 23:47:56.414 - [main] INFO com.jms.activemq.ActiveMQUtil : 126 - receive msg:msg-6

2022-07-13 23:47:56.414 - [main] INFO com.jms.activemq.ActiveMQUtil : 126 - receive msg:msg-7

2022-07-13 23:47:56.415 - [main] INFO com.jms.activemq.ActiveMQUtil : 126 - receive msg:msg-8

2022-07-13 23:47:56.415 - [main] INFO com.jms.activemq.ActiveMQUtil : 126 - receive msg:msg-9

查看kq控制台消息，这10个消息已经被消费

#### 3.6.3 监听者监听消息

```java
@Test
public void listenerMsg() throws JMSException {
          queueListener.receiveMsg();
}
```

再做一次消息发送，然后监听消息即刻，效果同消费消息。

#### 3.6.4 同时消费和监听消息

```java
@Test
public void sendAndReceiveMsg() throws JMSException, InterruptedException {
          new Thread(() -> {
                    try {
                              receiveMsg();
                    } catch (JMSException e) {
                              e.printStackTrace();
                    }
          }).start();
          new Thread(() -> {
                    try {
                              listenerMsg();
                    } catch (JMSException e) {
                              e.printStackTrace();
                    }
          }).start();
          sendMsg();
}
```

输出

2022-07-15 22:29:11.333 - [ActiveMQ NIO Worker 8] INFO org.apache.activemq.jms.pool.PooledProducer : 106 - send mq msg success, msg:ActiveMQTextMessage {commandId = 0, responseRequired = false, messageId = ID:LAPTOP-7KJFACUD-64442-1594823347898-1:3:1:1:1, originalDestination = null, originalTransactionId = null, producerId = null, destination = queue://demo-queue, transactionId = null, expiration = 0, timestamp = 1594823351307, arrival = 0, brokerInTime = 0, brokerOutTime = 0, correlationId = null, replyTo = null, persistent = true, type = null, priority = 4, groupID = null, groupSequence = 0, targetConsumerId = null, compressed = false, userID = null, content = null, marshalledProperties = null, dataStructure = null, redeliveryCounter = 0, size = 0, properties = null, readOnlyProperties = false, readOnlyBody = false, droppable = false, jmsXGroupFirstForConsumer = false, text = msg-0}

2022-07-15 22:29:11.412 - [ActiveMQ Session Task-1] INFO com.jms.activemq.ActiveMQUtil : 168 - listen msg:msg-1

2022-07-15 22:29:11.415 - [ActiveMQ NIO Worker 8] INFO org.apache.activemq.jms.pool.PooledProducer : 106 - send mq msg success, msg:ActiveMQTextMessage {commandId = 0, responseRequired = false, messageId = ID:LAPTOP-7KJFACUD-64442-1594823347898-1:3:1:1:2, originalDestination = null, originalTransactionId = null, producerId = null, destination = queue://demo-queue, transactionId = null, expiration = 0, timestamp = 1594823351409, arrival = 0, brokerInTime = 0, brokerOutTime = 0, correlationId = null, replyTo = null, persistent = true, type = null, priority = 4, groupID = null, groupSequence = 0, targetConsumerId = null, compressed = false, userID = null, content = null, marshalledProperties = null, dataStructure = null, redeliveryCounter = 0, size = 0, properties = null, readOnlyProperties = false, readOnlyBody = false, droppable = false, jmsXGroupFirstForConsumer = false, text = msg-1}

2022-07-15 22:29:11.515 - [Thread-5] INFO com.jms.activemq.ActiveMQUtil : 150 - receive msg:msg-2

2022-07-15 22:29:11.515 - [ActiveMQ NIO Worker 8] INFO org.apache.activemq.jms.pool.PooledProducer : 106 - send mq msg success, msg:ActiveMQTextMessage {commandId = 0, responseRequired = false, messageId = ID:LAPTOP-7KJFACUD-64442-1594823347898-1:3:1:1:3, originalDestination = null, originalTransactionId = null, producerId = null, destination = queue://demo-queue, transactionId = null, expiration = 0, timestamp = 1594823351512, arrival = 0, brokerInTime = 0, brokerOutTime = 0, correlationId = null, replyTo = null, persistent = true, type = null, priority = 4, groupID = null, groupSequence = 0, targetConsumerId = null, compressed = false, userID = null, content = null, marshalledProperties = null, dataStructure = null, redeliveryCounter = 0, size = 0, properties = null, readOnlyProperties = false, readOnlyBody = false, droppable = false, jmsXGroupFirstForConsumer = false, text = msg-2}

2022-07-15 22:29:11.620 - [ActiveMQ Session Task-1] INFO com.jms.activemq.ActiveMQUtil : 168 - listen msg:msg-3

2022-07-15 22:29:11.620 - [ActiveMQ NIO Worker 8] INFO org.apache.activemq.jms.pool.PooledProducer : 106 - send mq msg success, msg:ActiveMQTextMessage {commandId = 0, responseRequired = false, messageId = ID:LAPTOP-7KJFACUD-64442-1594823347898-1:3:1:1:4, originalDestination = null, originalTransactionId = null, producerId = null, destination = queue://demo-queue, transactionId = null, expiration = 0, timestamp = 1594823351614, arrival = 0, brokerInTime = 0, brokerOutTime = 0, correlationId = null, replyTo = null, persistent = true, type = null, priority = 4, groupID = null, groupSequence = 0, targetConsumerId = null, compressed = false, userID = null, content = null, marshalledProperties = null, dataStructure = null, redeliveryCounter = 0, size = 0, properties = null, readOnlyProperties = false, readOnlyBody = false, droppable = false, jmsXGroupFirstForConsumer = false, text = msg-3}

2022-07-15 22:29:11.721 - [Thread-5] INFO com.jms.activemq.ActiveMQUtil : 150 - receive msg:msg-4

2022-07-15 22:29:11.721 - [ActiveMQ NIO Worker 8] INFO org.apache.activemq.jms.pool.PooledProducer : 106 - send mq msg success, msg:ActiveMQTextMessage {commandId = 0, responseRequired = false, messageId = ID:LAPTOP-7KJFACUD-64442-1594823347898-1:3:1:1:5, originalDestination = null, originalTransactionId = null, producerId = null, destination = queue://demo-queue, transactionId = null, expiration = 0, timestamp = 1594823351715, arrival = 0, brokerInTime = 0, brokerOutTime = 0, correlationId = null, replyTo = null, persistent = true, type = null, priority = 4, groupID = null, groupSequence = 0, targetConsumerId = null, compressed = false, userID = null, content = null, marshalledProperties = null, dataStructure = null, redeliveryCounter = 0, size = 0, properties = null, readOnlyProperties = false, readOnlyBody = false, droppable = false, jmsXGroupFirstForConsumer = false, text = msg-4}

2022-07-15 22:29:11.820 - [ActiveMQ Session Task-1] INFO com.jms.activemq.ActiveMQUtil : 168 - listen msg:msg-5

2022-07-15 22:29:11.820 - [ActiveMQ NIO Worker 8] INFO org.apache.activemq.jms.pool.PooledProducer : 106 - send mq msg success, msg:ActiveMQTextMessage {commandId = 0, responseRequired = false, messageId = ID:LAPTOP-7KJFACUD-64442-1594823347898-1:3:1:1:6, originalDestination = null, originalTransactionId = null, producerId = null, destination = queue://demo-queue, transactionId = null, expiration = 0, timestamp = 1594823351816, arrival = 0, brokerInTime = 0, brokerOutTime = 0, correlationId = null, replyTo = null, persistent = true, type = null, priority = 4, groupID = null, groupSequence = 0, targetConsumerId = null, compressed = false, userID = null, content = null, marshalledProperties = null, dataStructure = null, redeliveryCounter = 0, size = 0, properties = null, readOnlyProperties = false, readOnlyBody = false, droppable = false, jmsXGroupFirstForConsumer = false, text = msg-5}

2022-07-15 22:29:11.920 - [Thread-5] INFO com.jms.activemq.ActiveMQUtil : 150 - receive msg:msg-6

2022-07-15 22:29:11.920 - [ActiveMQ NIO Worker 8] INFO org.apache.activemq.jms.pool.PooledProducer : 106 - send mq msg success, msg:ActiveMQTextMessage {commandId = 0, responseRequired = false, messageId = ID:LAPTOP-7KJFACUD-64442-1594823347898-1:3:1:1:7, originalDestination = null, originalTransactionId = null, producerId = null, destination = queue://demo-queue, transactionId = null, expiration = 0, timestamp = 1594823351916, arrival = 0, brokerInTime = 0, brokerOutTime = 0, correlationId = null, replyTo = null, persistent = true, type = null, priority = 4, groupID = null, groupSequence = 0, targetConsumerId = null, compressed = false, userID = null, content = null, marshalledProperties = null, dataStructure = null, redeliveryCounter = 0, size = 0, properties = null, readOnlyProperties = false, readOnlyBody = false, droppable = false, jmsXGroupFirstForConsumer = false, text = msg-6}

2022-07-15 22:29:12.020 - [ActiveMQ Session Task-1] INFO com.jms.activemq.ActiveMQUtil : 168 - listen msg:msg-7

2022-07-15 22:29:12.036 - [ActiveMQ NIO Worker 8] INFO org.apache.activemq.jms.pool.PooledProducer : 106 - send mq msg success, msg:ActiveMQTextMessage {commandId = 0, responseRequired = false, messageId = ID:LAPTOP-7KJFACUD-64442-1594823347898-1:3:1:1:8, originalDestination = null, originalTransactionId = null, producerId = null, destination = queue://demo-queue, transactionId = null, expiration = 0, timestamp = 1594823352020, arrival = 0, brokerInTime = 0, brokerOutTime = 0, correlationId = null, replyTo = null, persistent = true, type = null, priority = 4, groupID = null, groupSequence = 0, targetConsumerId = null, compressed = false, userID = null, content = null, marshalledProperties = null, dataStructure = null, redeliveryCounter = 0, size = 0, properties = null, readOnlyProperties = false, readOnlyBody = false, droppable = false, jmsXGroupFirstForConsumer = false, text = msg-7}

2022-07-15 22:29:12.125 - [Thread-5] INFO com.jms.activemq.ActiveMQUtil : 150 - receive msg:msg-8

2022-07-15 22:29:12.125 - [ActiveMQ NIO Worker 8] INFO org.apache.activemq.jms.pool.PooledProducer : 106 - send mq msg success, msg:ActiveMQTextMessage {commandId = 0, responseRequired = false, messageId = ID:LAPTOP-7KJFACUD-64442-1594823347898-1:3:1:1:9, originalDestination = null, originalTransactionId = null, producerId = null, destination = queue://demo-queue, transactionId = null, expiration = 0, timestamp = 1594823352122, arrival = 0, brokerInTime = 0, brokerOutTime = 0, correlationId = null, replyTo = null, persistent = true, type = null, priority = 4, groupID = null, groupSequence = 0, targetConsumerId = null, compressed = false, userID = null, content = null, marshalledProperties = null, dataStructure = null, redeliveryCounter = 0, size = 0, properties = null, readOnlyProperties = false, readOnlyBody = false, droppable = false, jmsXGroupFirstForConsumer = false, text = msg-8}

2022-07-15 22:29:12.190 - [DefaultMessageListenerContainer-2] ERROR o.s.jms.listener.DefaultMessageListenerContainer : 962 - Could not refresh JMS Connection for destination 'springboot-topic' - retrying using FixedBackOff{interval=5000, currentAttempts=0, maxAttempts=unlimited}. Cause: Could not connect to broker URL: tcp://localhost:61616. Reason: java.net.ConnectException: Connection refused: connect

2022-07-15 22:29:12.225 - [ActiveMQ Session Task-1] INFO com.jms.activemq.ActiveMQUtil : 168 - listen msg:msg-9

2022-07-15 22:29:12.231 - [ActiveMQ NIO Worker 8] INFO org.apache.activemq.jms.pool.PooledProducer : 106 - send mq msg success, msg:ActiveMQTextMessage {commandId = 0, responseRequired = false, messageId = ID:LAPTOP-7KJFACUD-64442-1594823347898-1:3:1:1:10, originalDestination = null, originalTransactionId = null, producerId = null, destination = queue://demo-queue, transactionId = null, expiration = 0, timestamp = 1594823352225, arrival = 0, brokerInTime = 0, brokerOutTime = 0, correlationId = null, replyTo = null, persistent = true, type = null, priority = 4, groupID = null, groupSequence = 0, targetConsumerId = null, compressed = false, userID = null, content = null, marshalledProperties = null, dataStructure = null, redeliveryCounter = 0, size = 0, properties = null, readOnlyProperties = false, readOnlyBody = false, droppable = false, jmsXGroupFirstForConsumer = false, text = msg-9}

可以看到，消息是被消费者喝监听者共享的

## 4 发布订阅消息测试

### 4.1 获取发布/订阅ActiveMqContext

```java
public static ActiveMqContext getTopicContext(int acknowledgeMode, int deliveryMode, String queueName) throws JMSException {
          Connection connection = factory.createConnection();
          if (deliveryMode == DeliveryMode.NON_PERSISTENT) {
                    connection.start();
          }else {
                    // 如果是持久topic,则需要设置clientId
                    connection.setClientID("consumer" + (index ++));
          }
          // 支持事务后send后不会发送，commit后才会发出去。签收是自动签收，配置手动签收不生效
          // 设置手动签收后客户端收到消息需要调ack方法才能够接收成功
          Session session = connection.createSession(Boolean.FALSE, acknowledgeMode);
          Topic destination = session.createTopic(queueName);
          MessageProducer producer = session.createProducer(destination);
          // 设置持久化后, JMS提供者出现故障，该消息并不会丢失，它会在服务器恢复之后再次传递
          producer.setDeliveryMode(deliveryMode);
          // 如果是持久化topic，创建TopicSubscriber进行订阅
          MessageConsumer consumer = deliveryMode == DeliveryMode.NON_PERSISTENT?
                              session.createConsumer(destination): session.createDurableSubscriber(destination, queueName);
          if (deliveryMode == DeliveryMode.PERSISTENT) {
                    // 如果是持久topic,则创建完消费者之后再start
                    connection.start();
          }
          return new ActiveMqContext(connection, session, producer, consumer, Boolean.FALSE);
}
```

### 4.2 spring中注入一个发布/订阅A的context(非持久化)

```java
@Bean
public ActiveMqContext topicContext() throws JMSException {
          return ActiveMQUtil.getTopicContext(Session.AUTO_ACKNOWLEDGE, DeliveryMode.NON_PERSISTENT, topicName);
}
```

### 4.3 消息生产者

```java
@Component
public class TopicProcedure {
             @Resource(name = "topicContext")
             private ActiveMqContext context;
             public void sendMsg(String msg) throws JMSException {
                          ActiveMQUtil.sendMsg(context, msg);
             }
}
```

### 4.4 消息消费者

```java
@Component
public class TopicConsumer {
             @Resource(name = "topicContext")
             private ActiveMqContext context;
             public void receiveMsg() throws JMSException {
                          ActiveMQUtil.receiveMsg(context);
             }
}
```

### 4.5 消息监听者

```java
@Component
public class TopicListener {
          @Resource(name = "topicContext")
          private ActiveMqContext context;
          public void receiveMsg() throws JMSException {
                    ActiveMQUtil.listenMsg(context);
          }
}
```

### 4.6 测试代码

#### 4.6.1 发送消息

```java
@Test
public void sendMsg() throws JMSException, InterruptedException {
          for (int i = 0; i < 10; i ++) {
                    procedure.sendMsg("msg-" + i);
                    Thread.sleep(100);
          }
}
```

输出

2022-07-15 21:11:48.959 - [ActiveMQ NIO Worker 9] INFO org.apache.activemq.jms.pool.PooledProducer : 106 - send mq msg success, msg:ActiveMQTextMessage {commandId = 0, responseRequired = false, messageId = ID:LAPTOP-7KJFACUD-63053-1594818704703-1:4:1:1:1, originalDestination = null, originalTransactionId = null, producerId = null, destination = topic://demo-topic, transactionId = null, expiration = 0, timestamp = 1594818708955, arrival = 0, brokerInTime = 0, brokerOutTime = 0, correlationId = null, replyTo = null, persistent = false, type = null, priority = 4, groupID = null, groupSequence = 0, targetConsumerId = null, compressed = false, userID = null, content = null, marshalledProperties = null, dataStructure = null, redeliveryCounter = 0, size = 0, properties = null, readOnlyProperties = false, readOnlyBody = false, droppable = false, jmsXGroupFirstForConsumer = false, text = msg-0}

2022-07-15 21:11:49.062 - [ActiveMQ NIO Worker 9] INFO org.apache.activemq.jms.pool.PooledProducer : 106 - send mq msg success, msg:ActiveMQTextMessage {commandId = 0, responseRequired = false, messageId = ID:LAPTOP-7KJFACUD-63053-1594818704703-1:4:1:1:2, originalDestination = null, originalTransactionId = null, producerId = null, destination = topic://demo-topic, transactionId = null, expiration = 0, timestamp = 1594818709058, arrival = 0, brokerInTime = 0, brokerOutTime = 0, correlationId = null, replyTo = null, persistent = false, type = null, priority = 4, groupID = null, groupSequence = 0, targetConsumerId = null, compressed = false, userID = null, content = null, marshalledProperties = null, dataStructure = null, redeliveryCounter = 0, size = 0, properties = null, readOnlyProperties = false, readOnlyBody = false, droppable = false, jmsXGroupFirstForConsumer = false, text = msg-1}

2022-07-15 21:11:49.166 - [ActiveMQ NIO Worker 9] INFO org.apache.activemq.jms.pool.PooledProducer : 106 - send mq msg success, msg:ActiveMQTextMessage {commandId = 0, responseRequired = false, messageId = ID:LAPTOP-7KJFACUD-63053-1594818704703-1:4:1:1:3, originalDestination = null, originalTransactionId = null, producerId = null, destination = topic://demo-topic, transactionId = null, expiration = 0, timestamp = 1594818709160, arrival = 0, brokerInTime = 0, brokerOutTime = 0, correlationId = null, replyTo = null, persistent = false, type = null, priority = 4, groupID = null, groupSequence = 0, targetConsumerId = null, compressed = false, userID = null, content = null, marshalledProperties = null, dataStructure = null, redeliveryCounter = 0, size = 0, properties = null, readOnlyProperties = false, readOnlyBody = false, droppable = false, jmsXGroupFirstForConsumer = false, text = msg-2}

2022-07-15 21:11:49.263 - [ActiveMQ NIO Worker 9] INFO org.apache.activemq.jms.pool.PooledProducer : 106 - send mq msg success, msg:ActiveMQTextMessage {commandId = 0, responseRequired = false, messageId = ID:LAPTOP-7KJFACUD-63053-1594818704703-1:4:1:1:4, originalDestination = null, originalTransactionId = null, producerId = null, destination = topic://demo-topic, transactionId = null, expiration = 0, timestamp = 1594818709262, arrival = 0, brokerInTime = 0, brokerOutTime = 0, correlationId = null, replyTo = null, persistent = false, type = null, priority = 4, groupID = null, groupSequence = 0, targetConsumerId = null, compressed = false, userID = null, content = null, marshalledProperties = null, dataStructure = null, redeliveryCounter = 0, size = 0, properties = null, readOnlyProperties = false, readOnlyBody = false, droppable = false, jmsXGroupFirstForConsumer = false, text = msg-3}

2022-07-15 21:11:49.366 - [ActiveMQ NIO Worker 9] INFO org.apache.activemq.jms.pool.PooledProducer : 106 - send mq msg success, msg:ActiveMQTextMessage {commandId = 0, responseRequired = false, messageId = ID:LAPTOP-7KJFACUD-63053-1594818704703-1:4:1:1:5, originalDestination = null, originalTransactionId = null, producerId = null, destination = topic://demo-topic, transactionId = null, expiration = 0, timestamp = 1594818709362, arrival = 0, brokerInTime = 0, brokerOutTime = 0, correlationId = null, replyTo = null, persistent = false, type = null, priority = 4, groupID = null, groupSequence = 0, targetConsumerId = null, compressed = false, userID = null, content = null, marshalledProperties = null, dataStructure = null, redeliveryCounter = 0, size = 0, properties = null, readOnlyProperties = false, readOnlyBody = false, droppable = false, jmsXGroupFirstForConsumer = false, text = msg-4}

2022-07-15 21:11:49.466 - [ActiveMQ NIO Worker 9] INFO org.apache.activemq.jms.pool.PooledProducer : 106 - send mq msg success, msg:ActiveMQTextMessage {commandId = 0, responseRequired = false, messageId = ID:LAPTOP-7KJFACUD-63053-1594818704703-1:4:1:1:6, originalDestination = null, originalTransactionId = null, producerId = null, destination = topic://demo-topic, transactionId = null, expiration = 0, timestamp = 1594818709462, arrival = 0, brokerInTime = 0, brokerOutTime = 0, correlationId = null, replyTo = null, persistent = false, type = null, priority = 4, groupID = null, groupSequence = 0, targetConsumerId = null, compressed = false, userID = null, content = null, marshalledProperties = null, dataStructure = null, redeliveryCounter = 0, size = 0, properties = null, readOnlyProperties = false, readOnlyBody = false, droppable = false, jmsXGroupFirstForConsumer = false, text = msg-5}

2022-07-15 21:11:49.569 - [ActiveMQ NIO Worker 9] INFO org.apache.activemq.jms.pool.PooledProducer : 106 - send mq msg success, msg:ActiveMQTextMessage {commandId = 0, responseRequired = false, messageId = ID:LAPTOP-7KJFACUD-63053-1594818704703-1:4:1:1:7, originalDestination = null, originalTransactionId = null, producerId = null, destination = topic://demo-topic, transactionId = null, expiration = 0, timestamp = 1594818709562, arrival = 0, brokerInTime = 0, brokerOutTime = 0, correlationId = null, replyTo = null, persistent = false, type = null, priority = 4, groupID = null, groupSequence = 0, targetConsumerId = null, compressed = false, userID = null, content = null, marshalledProperties = null, dataStructure = null, redeliveryCounter = 0, size = 0, properties = null, readOnlyProperties = false, readOnlyBody = false, droppable = false, jmsXGroupFirstForConsumer = false, text = msg-6}

2022-07-15 21:11:49.665 - [ActiveMQ NIO Worker 9] INFO org.apache.activemq.jms.pool.PooledProducer : 106 - send mq msg success, msg:ActiveMQTextMessage {commandId = 0, responseRequired = false, messageId = ID:LAPTOP-7KJFACUD-63053-1594818704703-1:4:1:1:8, originalDestination = null, originalTransactionId = null, producerId = null, destination = topic://demo-topic, transactionId = null, expiration = 0, timestamp = 1594818709664, arrival = 0, brokerInTime = 0, brokerOutTime = 0, correlationId = null, replyTo = null, persistent = false, type = null, priority = 4, groupID = null, groupSequence = 0, targetConsumerId = null, compressed = false, userID = null, content = null, marshalledProperties = null, dataStructure = null, redeliveryCounter = 0, size = 0, properties = null, readOnlyProperties = false, readOnlyBody = false, droppable = false, jmsXGroupFirstForConsumer = false, text = msg-7}

2022-07-15 21:11:49.768 - [ActiveMQ NIO Worker 9] INFO org.apache.activemq.jms.pool.PooledProducer : 106 - send mq msg success, msg:ActiveMQTextMessage {commandId = 0, responseRequired = false, messageId = ID:LAPTOP-7KJFACUD-63053-1594818704703-1:4:1:1:9, originalDestination = null, originalTransactionId = null, producerId = null, destination = topic://demo-topic, transactionId = null, expiration = 0, timestamp = 1594818709764, arrival = 0, brokerInTime = 0, brokerOutTime = 0, correlationId = null, replyTo = null, persistent = false, type = null, priority = 4, groupID = null, groupSequence = 0, targetConsumerId = null, compressed = false, userID = null, content = null, marshalledProperties = null, dataStructure = null, redeliveryCounter = 0, size = 0, properties = null, readOnlyProperties = false, readOnlyBody = false, droppable = false, jmsXGroupFirstForConsumer = false, text = msg-8}

2022-07-15 21:11:49.867 - [ActiveMQ NIO Worker 9] INFO org.apache.activemq.jms.pool.PooledProducer : 106 - send mq msg success, msg:ActiveMQTextMessage {commandId = 0, responseRequired = false, messageId = ID:LAPTOP-7KJFACUD-63053-1594818704703-1:4:1:1:10, originalDestination = null, originalTransactionId = null, producerId = null, destination = topic://demo-topic, transactionId = null, expiration = 0, timestamp = 1594818709865, arrival = 0, brokerInTime = 0, brokerOutTime = 0, correlationId = null, replyTo = null, persistent = false, type = null, priority = 4, groupID = null, groupSequence = 0, targetConsumerId = null, compressed = false, userID = null, content = null, marshalledProperties = null, dataStructure = null, redeliveryCounter = 0, size = 0, properties = null, readOnlyProperties = false, readOnlyBody = false, droppable = false, jmsXGroupFirstForConsumer = false, text = msg-9}

#### 4.6.2 消费者消费消息

```java
@Test
public void receiveMsg() throws JMSException {
          consumer.receiveMsg();
}
```

#### 4.6.3 监听者监听消息

```java
@Test
public void listenerMsg() throws JMSException {
          listener.receiveMsg();
}
```

这个时候发现不管是启动消费者还是启动监听者都获取不到消息。原因是发布/订阅消息一定要先启动消费者再发送消息，否则消费不到之前的数据。

这里我们先启动消费者，再启动生产者会看到消费数据

#### 4.6.4 获取消息正确姿势

```java
@Test
public void sendMsg() throws JMSException, InterruptedException {
          new Thread(() -> {
                    try {
                              receiveMsg();
                    } catch (JMSException e) {
                              e.printStackTrace();
                    }
          }).start();
          new Thread(() -> {
                    try {
                              listenerMsg();
                    } catch (JMSException e) {
                              e.printStackTrace();
                    }
          }).start();
          for (int i = 0; i < 10; i ++) {
                    procedure.sendMsg("msg-" + i);
                    Thread.sleep(100);
          }
          synchronized (this) {
                    this.wait();
          }
}
```

输出
2022-07-15 22:11:26.283 - [ActiveMQ Session Task-1] INFO com.jms.activemq.ActiveMQUtil : 162 - listen msg:msg-0

2022-07-15 22:11:26.280 - [ActiveMQ NIO Worker 7] INFO org.apache.activemq.jms.pool.PooledProducer : 106 - send mq msg success, msg:ActiveMQTextMessage {commandId = 0, responseRequired = false, messageId = ID:LAPTOP-7KJFACUD-64079-1594822282964-1:4:1:1:1, originalDestination = null, originalTransactionId = null, producerId = null, destination = topic://demo-topic, transactionId = null, expiration = 0, timestamp = 1594822286276, arrival = 0, brokerInTime = 0, brokerOutTime = 0, correlationId = null, replyTo = null, persistent = false, type = null, priority = 4, groupID = null, groupSequence = 0, targetConsumerId = null, compressed = false, userID = null, content = null, marshalledProperties = null, dataStructure = null, redeliveryCounter = 0, size = 0, properties = null, readOnlyProperties = false, readOnlyBody = false, droppable = false, jmsXGroupFirstForConsumer = false, text = msg-0}

2022-07-15 22:11:26.286 - [Thread-5] INFO com.jms.activemq.ActiveMQUtil : 144 - receive msg:msg-0

2022-07-15 22:11:26.380 - [ActiveMQ NIO Worker 7] INFO org.apache.activemq.jms.pool.PooledProducer : 106 - send mq msg success, msg:ActiveMQTextMessage {commandId = 0, responseRequired = false, messageId = ID:LAPTOP-7KJFACUD-64079-1594822282964-1:4:1:1:2, originalDestination = null, originalTransactionId = null, producerId = null, destination = topic://demo-topic, transactionId = null, expiration = 0, timestamp = 1594822286377, arrival = 0, brokerInTime = 0, brokerOutTime = 0, correlationId = null, replyTo = null, persistent = false, type = null, priority = 4, groupID = null, groupSequence = 0, targetConsumerId = null, compressed = false, userID = null, content = null, marshalledProperties = null, dataStructure = null, redeliveryCounter = 0, size = 0, properties = null, readOnlyProperties = false, readOnlyBody = false, droppable = false, jmsXGroupFirstForConsumer = false, text = msg-1}

2022-07-15 22:11:26.383 - [Thread-5] INFO com.jms.activemq.ActiveMQUtil : 144 - receive msg:msg-1

2022-07-15 22:11:26.383 - [ActiveMQ Session Task-1] INFO com.jms.activemq.ActiveMQUtil : 162 - listen msg:msg-1

2022-07-15 22:11:26.481 - [ActiveMQ NIO Worker 7] INFO org.apache.activemq.jms.pool.PooledProducer : 106 - send mq msg success, msg:ActiveMQTextMessage {commandId = 0, responseRequired = false, messageId = ID:LAPTOP-7KJFACUD-64079-1594822282964-1:4:1:1:3, originalDestination = null, originalTransactionId = null, producerId = null, destination = topic://demo-topic, transactionId = null, expiration = 0, timestamp = 1594822286477, arrival = 0, brokerInTime = 0, brokerOutTime = 0, correlationId = null, replyTo = null, persistent = false, type = null, priority = 4, groupID = null, groupSequence = 0, targetConsumerId = null, compressed = false, userID = null, content = null, marshalledProperties = null, dataStructure = null, redeliveryCounter = 0, size = 0, properties = null, readOnlyProperties = false, readOnlyBody = false, droppable = false, jmsXGroupFirstForConsumer = false, text = msg-2}

2022-07-15 22:11:26.487 - [Thread-5] INFO com.jms.activemq.ActiveMQUtil : 144 - receive msg:msg-2

2022-07-15 22:11:26.490 - [ActiveMQ Session Task-1] INFO com.jms.activemq.ActiveMQUtil : 162 - listen msg:msg-2

2022-07-15 22:11:26.584 - [ActiveMQ NIO Worker 7] INFO org.apache.activemq.jms.pool.PooledProducer : 106 - send mq msg success, msg:ActiveMQTextMessage {commandId = 0, responseRequired = false, messageId = ID:LAPTOP-7KJFACUD-64079-1594822282964-1:4:1:1:4, originalDestination = null, originalTransactionId = null, producerId = null, destination = topic://demo-topic, transactionId = null, expiration = 0, timestamp = 1594822286578, arrival = 0, brokerInTime = 0, brokerOutTime = 0, correlationId = null, replyTo = null, persistent = false, type = null, priority = 4, groupID = null, groupSequence = 0, targetConsumerId = null, compressed = false, userID = null, content = null, marshalledProperties = null, dataStructure = null, redeliveryCounter = 0, size = 0, properties = null, readOnlyProperties = false, readOnlyBody = false, droppable = false, jmsXGroupFirstForConsumer = false, text = msg-3}

2022-07-15 22:11:26.588 - [Thread-5] INFO com.jms.activemq.ActiveMQUtil : 144 - receive msg:msg-3

2022-07-15 22:11:26.591 - [ActiveMQ Session Task-1] INFO com.jms.activemq.ActiveMQUtil : 162 - listen msg:msg-3

2022-07-15 22:11:26.679 - [ActiveMQ NIO Worker 7] INFO org.apache.activemq.jms.pool.PooledProducer : 106 - send mq msg success, msg:ActiveMQTextMessage {commandId = 0, responseRequired = false, messageId = ID:LAPTOP-7KJFACUD-64079-1594822282964-1:4:1:1:5, originalDestination = null, originalTransactionId = null, producerId = null, destination = topic://demo-topic, transactionId = null, expiration = 0, timestamp = 1594822286679, arrival = 0, brokerInTime = 0, brokerOutTime = 0, correlationId = null, replyTo = null, persistent = false, type = null, priority = 4, groupID = null, groupSequence = 0, targetConsumerId = null, compressed = false, userID = null, content = null, marshalledProperties = null, dataStructure = null, redeliveryCounter = 0, size = 0, properties = null, readOnlyProperties = false, readOnlyBody = false, droppable = false, jmsXGroupFirstForConsumer = false, text = msg-4}

2022-07-15 22:11:26.682 - [Thread-5] INFO com.jms.activemq.ActiveMQUtil : 144 - receive msg:msg-4

2022-07-15 22:11:26.682 - [ActiveMQ Session Task-1] INFO com.jms.activemq.ActiveMQUtil : 162 - listen msg:msg-4

2022-07-15 22:11:26.779 - [ActiveMQ NIO Worker 7] INFO org.apache.activemq.jms.pool.PooledProducer : 106 - send mq msg success, msg:ActiveMQTextMessage {commandId = 0, responseRequired = false, messageId = ID:LAPTOP-7KJFACUD-64079-1594822282964-1:4:1:1:6, originalDestination = null, originalTransactionId = null, producerId = null, destination = topic://demo-topic, transactionId = null, expiration = 0, timestamp = 1594822286779, arrival = 0, brokerInTime = 0, brokerOutTime = 0, correlationId = null, replyTo = null, persistent = false, type = null, priority = 4, groupID = null, groupSequence = 0, targetConsumerId = null, compressed = false, userID = null, content = null, marshalledProperties = null, dataStructure = null, redeliveryCounter = 0, size = 0, properties = null, readOnlyProperties = false, readOnlyBody = false, droppable = false, jmsXGroupFirstForConsumer = false, text = msg-5}

2022-07-15 22:11:26.782 - [Thread-5] INFO com.jms.activemq.ActiveMQUtil : 144 - receive msg:msg-5

2022-07-15 22:11:26.782 - [ActiveMQ Session Task-1] INFO com.jms.activemq.ActiveMQUtil : 162 - listen msg:msg-5

2022-07-15 22:11:26.879 - [ActiveMQ NIO Worker 7] INFO org.apache.activemq.jms.pool.PooledProducer : 106 - send mq msg success, msg:ActiveMQTextMessage {commandId = 0, responseRequired = false, messageId = ID:LAPTOP-7KJFACUD-64079-1594822282964-1:4:1:1:7, originalDestination = null, originalTransactionId = null, producerId = null, destination = topic://demo-topic, transactionId = null, expiration = 0, timestamp = 1594822286879, arrival = 0, brokerInTime = 0, brokerOutTime = 0, correlationId = null, replyTo = null, persistent = false, type = null, priority = 4, groupID = null, groupSequence = 0, targetConsumerId = null, compressed = false, userID = null, content = null, marshalledProperties = null, dataStructure = null, redeliveryCounter = 0, size = 0, properties = null, readOnlyProperties = false, readOnlyBody = false, droppable = false, jmsXGroupFirstForConsumer = false, text = msg-6}

2022-07-15 22:11:26.879 - [Thread-5] INFO com.jms.activemq.ActiveMQUtil : 144 - receive msg:msg-6

2022-07-15 22:11:26.883 - [ActiveMQ Session Task-1] INFO com.jms.activemq.ActiveMQUtil : 162 - listen msg:msg-6

2022-07-15 22:11:26.982 - [ActiveMQ NIO Worker 7] INFO org.apache.activemq.jms.pool.PooledProducer : 106 - send mq msg success, msg:ActiveMQTextMessage {commandId = 0, responseRequired = false, messageId = ID:LAPTOP-7KJFACUD-64079-1594822282964-1:4:1:1:8, originalDestination = null, originalTransactionId = null, producerId = null, destination = topic://demo-topic, transactionId = null, expiration = 0, timestamp = 1594822286982, arrival = 0, brokerInTime = 0, brokerOutTime = 0, correlationId = null, replyTo = null, persistent = false, type = null, priority = 4, groupID = null, groupSequence = 0, targetConsumerId = null, compressed = false, userID = null, content = null, marshalledProperties = null, dataStructure = null, redeliveryCounter = 0, size = 0, properties = null, readOnlyProperties = false, readOnlyBody = false, droppable = false, jmsXGroupFirstForConsumer = false, text = msg-7}

2022-07-15 22:11:26.985 - [Thread-5] INFO com.jms.activemq.ActiveMQUtil : 144 - receive msg:msg-7

2022-07-15 22:11:26.985 - [ActiveMQ Session Task-1] INFO com.jms.activemq.ActiveMQUtil : 162 - listen msg:msg-7

2022-07-15 22:11:27.086 - [ActiveMQ NIO Worker 7] INFO org.apache.activemq.jms.pool.PooledProducer : 106 - send mq msg success, msg:ActiveMQTextMessage {commandId = 0, responseRequired = false, messageId = ID:LAPTOP-7KJFACUD-64079-1594822282964-1:4:1:1:9, originalDestination = null, originalTransactionId = null, producerId = null, destination = topic://demo-topic, transactionId = null, expiration = 0, timestamp = 1594822287083, arrival = 0, brokerInTime = 0, brokerOutTime = 0, correlationId = null, replyTo = null, persistent = false, type = null, priority = 4, groupID = null, groupSequence = 0, targetConsumerId = null, compressed = false, userID = null, content = null, marshalledProperties = null, dataStructure = null, redeliveryCounter = 0, size = 0, properties = null, readOnlyProperties = false, readOnlyBody = false, droppable = false, jmsXGroupFirstForConsumer = false, text = msg-8}

2022-07-15 22:11:27.089 - [Thread-5] INFO com.jms.activemq.ActiveMQUtil : 144 - receive msg:msg-8

2022-07-15 22:11:27.089 - [ActiveMQ Session Task-1] INFO com.jms.activemq.ActiveMQUtil : 162 - listen msg:msg-8

2022-07-15 22:11:27.187 - [ActiveMQ NIO Worker 7] INFO org.apache.activemq.jms.pool.PooledProducer : 106 - send mq msg success, msg:ActiveMQTextMessage {commandId = 0, responseRequired = false, messageId = ID:LAPTOP-7KJFACUD-64079-1594822282964-1:4:1:1:10, originalDestination = null, originalTransactionId = null, producerId = null, destination = topic://demo-topic, transactionId = null, expiration = 0, timestamp = 1594822287184, arrival = 0, brokerInTime = 0, brokerOutTime = 0, correlationId = null, replyTo = null, persistent = false, type = null, priority = 4, groupID = null, groupSequence = 0, targetConsumerId = null, compressed = false, userID = null, content = null, marshalledProperties = null, dataStructure = null, redeliveryCounter = 0, size = 0, properties = null, readOnlyProperties = false, readOnlyBody = false, droppable = false, jmsXGroupFirstForConsumer = false, text = msg-9}

2022-07-15 22:11:27.191 - [Thread-5] INFO com.jms.activemq.ActiveMQUtil : 144 - receive msg:msg-9

2022-07-15 22:11:27.191 - [ActiveMQ Session Task-1] INFO com.jms.activemq.ActiveMQUtil : 162 - listen msg:msg-9

可以看到消费者、监听者都能获取到完整的消息

## 5 小结

1点对点发送消息的时候消费者不必先启动，同一个队列的消费者共享生产者的数据

2发布/订阅消息的时候消费者要先启动(非持久订阅)，同一个队列的消费者都能拿到完整的消息
