# 03、ActiveMQ 实战 - 持久化订阅
- 来源：https://ddkk.com/zhuanlan/mq/activemq/4/3.html
- 分类：消息队列
- 分组：教程目录
## 1 持久化订阅概述

在上篇文章中我们看到通过发布订阅模式的时候要先启动消费者，再启动生产者才能消费消息，这种订阅类型是非持久化订阅

持久化订阅的时候只要消费者启动注册后，之后消费者如果掉线然后再上线，那么消费者仍然可以消费到掉线期间的消息。

## 2 代码测试

### 2.1 容器中注入一个持久化消费者ActiveMqContext

```java
@Bean
public ActiveMqContext persistentTopicContext() throws JMSException {
          return ActiveMQUtil.getTopicContext(Session.AUTO_ACKNOWLEDGE, DeliveryMode.PERSISTENT, persistentTopicName);
}
```

### 2.2 TopicProcedure中添加持久发送的方法

```java
@Resource(name = "persistentTopicContext")
private ActiveMqContext persistentTopicContext;
public void sendPersistentMsg(String msg) throws JMSException {
             ActiveMQUtil.sendMsg(persistentTopicContext, msg);
}
```

### 2.3 TopicConsumer添加持久化消费方法

```java
@Resource(name = "persistentTopicContext")
private ActiveMqContext persistentContext;
public void receivePersistentMsg() throws JMSException {
             ActiveMQUtil.receiveMsg(persistentContext);
}
```

### 2.4 TopicListener添加持久化监听方法

```java
@Resource(name = "persistentTopicContext")
private ActiveMqContext persistentContext;
public void receivePersistentMsg() throws JMSException {
          ActiveMQUtil.listenMsg(persistentContext);
}
```

### 2.5 测试代码

#### 2.5.1 发送消息

```java
@Test
public void sendPersistentMsg() throws JMSException, InterruptedException {
          for (int i = 0; i < 10; i ++) {
                    procedure.sendPersistentMsg("msg-" + i);
                    Thread.sleep(100);
          }
}
```

输出
2022-07-17 09:14:50.687 - [ActiveMQ Transport: tcp://localhost/127.0.0.1:61616@62623] INFO org.apache.activemq.jms.pool.PooledProducer : 106 - send mq msg success, msg:ActiveMQTextMessage {commandId = 0, responseRequired = false, messageId = ID:LAPTOP-7KJFACUD-62614-1594948489750-1:9:1:1:1, originalDestination = null, originalTransactionId = null, producerId = null, destination = topic://demo-persistent-topic, transactionId = null, expiration = 0, timestamp = 1594948490687, arrival = 0, brokerInTime = 0, brokerOutTime = 0, correlationId = null, replyTo = null, persistent = true, type = null, priority = 4, groupID = null, groupSequence = 0, targetConsumerId = null, compressed = false, userID = null, content = null, marshalledProperties = null, dataStructure = null, redeliveryCounter = 0, size = 0, properties = null, readOnlyProperties = false, readOnlyBody = false, droppable = false, jmsXGroupFirstForConsumer = false, text = msg-0}

2022-07-17 09:14:50.796 - [ActiveMQ Transport: tcp://localhost/127.0.0.1:61616@62623] INFO org.apache.activemq.jms.pool.PooledProducer : 106 - send mq msg success, msg:ActiveMQTextMessage {commandId = 0, responseRequired = false, messageId = ID:LAPTOP-7KJFACUD-62614-1594948489750-1:9:1:1:2, originalDestination = null, originalTransactionId = null, producerId = null, destination = topic://demo-persistent-topic, transactionId = null, expiration = 0, timestamp = 1594948490796, arrival = 0, brokerInTime = 0, brokerOutTime = 0, correlationId = null, replyTo = null, persistent = true, type = null, priority = 4, groupID = null, groupSequence = 0, targetConsumerId = null, compressed = false, userID = null, content = null, marshalledProperties = null, dataStructure = null, redeliveryCounter = 0, size = 0, properties = null, readOnlyProperties = false, readOnlyBody = false, droppable = false, jmsXGroupFirstForConsumer = false, text = msg-1}

2022-07-17 09:14:50.906 - [ActiveMQ Transport: tcp://localhost/127.0.0.1:61616@62623] INFO org.apache.activemq.jms.pool.PooledProducer : 106 - send mq msg success, msg:ActiveMQTextMessage {commandId = 0, responseRequired = false, messageId = ID:LAPTOP-7KJFACUD-62614-1594948489750-1:9:1:1:3, originalDestination = null, originalTransactionId = null, producerId = null, destination = topic://demo-persistent-topic, transactionId = null, expiration = 0, timestamp = 1594948490906, arrival = 0, brokerInTime = 0, brokerOutTime = 0, correlationId = null, replyTo = null, persistent = true, type = null, priority = 4, groupID = null, groupSequence = 0, targetConsumerId = null, compressed = false, userID = null, content = null, marshalledProperties = null, dataStructure = null, redeliveryCounter = 0, size = 0, properties = null, readOnlyProperties = false, readOnlyBody = false, droppable = false, jmsXGroupFirstForConsumer = false, text = msg-2}

2022-07-17 09:14:51.016 - [ActiveMQ Transport: tcp://localhost/127.0.0.1:61616@62623] INFO org.apache.activemq.jms.pool.PooledProducer : 106 - send mq msg success, msg:ActiveMQTextMessage {commandId = 0, responseRequired = false, messageId = ID:LAPTOP-7KJFACUD-62614-1594948489750-1:9:1:1:4, originalDestination = null, originalTransactionId = null, producerId = null, destination = topic://demo-persistent-topic, transactionId = null, expiration = 0, timestamp = 1594948491016, arrival = 0, brokerInTime = 0, brokerOutTime = 0, correlationId = null, replyTo = null, persistent = true, type = null, priority = 4, groupID = null, groupSequence = 0, targetConsumerId = null, compressed = false, userID = null, content = null, marshalledProperties = null, dataStructure = null, redeliveryCounter = 0, size = 0, properties = null, readOnlyProperties = false, readOnlyBody = false, droppable = false, jmsXGroupFirstForConsumer = false, text = msg-3}

2022-07-17 09:14:51.125 - [ActiveMQ Transport: tcp://localhost/127.0.0.1:61616@62623] INFO org.apache.activemq.jms.pool.PooledProducer : 106 - send mq msg success, msg:ActiveMQTextMessage {commandId = 0, responseRequired = false, messageId = ID:LAPTOP-7KJFACUD-62614-1594948489750-1:9:1:1:5, originalDestination = null, originalTransactionId = null, producerId = null, destination = topic://demo-persistent-topic, transactionId = null, expiration = 0, timestamp = 1594948491125, arrival = 0, brokerInTime = 0, brokerOutTime = 0, correlationId = null, replyTo = null, persistent = true, type = null, priority = 4, groupID = null, groupSequence = 0, targetConsumerId = null, compressed = false, userID = null, content = null, marshalledProperties = null, dataStructure = null, redeliveryCounter = 0, size = 0, properties = null, readOnlyProperties = false, readOnlyBody = false, droppable = false, jmsXGroupFirstForConsumer = false, text = msg-4}

2022-07-17 09:14:51.234 - [ActiveMQ Transport: tcp://localhost/127.0.0.1:61616@62623] INFO org.apache.activemq.jms.pool.PooledProducer : 106 - send mq msg success, msg:ActiveMQTextMessage {commandId = 0, responseRequired = false, messageId = ID:LAPTOP-7KJFACUD-62614-1594948489750-1:9:1:1:6, originalDestination = null, originalTransactionId = null, producerId = null, destination = topic://demo-persistent-topic, transactionId = null, expiration = 0, timestamp = 1594948491234, arrival = 0, brokerInTime = 0, brokerOutTime = 0, correlationId = null, replyTo = null, persistent = true, type = null, priority = 4, groupID = null, groupSequence = 0, targetConsumerId = null, compressed = false, userID = null, content = null, marshalledProperties = null, dataStructure = null, redeliveryCounter = 0, size = 0, properties = null, readOnlyProperties = false, readOnlyBody = false, droppable = false, jmsXGroupFirstForConsumer = false, text = msg-5}

2022-07-17 09:14:51.344 - [ActiveMQ Transport: tcp://localhost/127.0.0.1:61616@62623] INFO org.apache.activemq.jms.pool.PooledProducer : 106 - send mq msg success, msg:ActiveMQTextMessage {commandId = 0, responseRequired = false, messageId = ID:LAPTOP-7KJFACUD-62614-1594948489750-1:9:1:1:7, originalDestination = null, originalTransactionId = null, producerId = null, destination = topic://demo-persistent-topic, transactionId = null, expiration = 0, timestamp = 1594948491344, arrival = 0, brokerInTime = 0, brokerOutTime = 0, correlationId = null, replyTo = null, persistent = true, type = null, priority = 4, groupID = null, groupSequence = 0, targetConsumerId = null, compressed = false, userID = null, content = null, marshalledProperties = null, dataStructure = null, redeliveryCounter = 0, size = 0, properties = null, readOnlyProperties = false, readOnlyBody = false, droppable = false, jmsXGroupFirstForConsumer = false, text = msg-6}

2022-07-17 09:14:51.453 - [ActiveMQ Transport: tcp://localhost/127.0.0.1:61616@62623] INFO org.apache.activemq.jms.pool.PooledProducer : 106 - send mq msg success, msg:ActiveMQTextMessage {commandId = 0, responseRequired = false, messageId = ID:LAPTOP-7KJFACUD-62614-1594948489750-1:9:1:1:8, originalDestination = null, originalTransactionId = null, producerId = null, destination = topic://demo-persistent-topic, transactionId = null, expiration = 0, timestamp = 1594948491453, arrival = 0, brokerInTime = 0, brokerOutTime = 0, correlationId = null, replyTo = null, persistent = true, type = null, priority = 4, groupID = null, groupSequence = 0, targetConsumerId = null, compressed = false, userID = null, content = null, marshalledProperties = null, dataStructure = null, redeliveryCounter = 0, size = 0, properties = null, readOnlyProperties = false, readOnlyBody = false, droppable = false, jmsXGroupFirstForConsumer = false, text = msg-7}

2022-07-17 09:14:51.562 - [ActiveMQ Transport: tcp://localhost/127.0.0.1:61616@62623] INFO org.apache.activemq.jms.pool.PooledProducer : 106 - send mq msg success, msg:ActiveMQTextMessage {commandId = 0, responseRequired = false, messageId = ID:LAPTOP-7KJFACUD-62614-1594948489750-1:9:1:1:9, originalDestination = null, originalTransactionId = null, producerId = null, destination = topic://demo-persistent-topic, transactionId = null, expiration = 0, timestamp = 1594948491562, arrival = 0, brokerInTime = 0, brokerOutTime = 0, correlationId = null, replyTo = null, persistent = true, type = null, priority = 4, groupID = null, groupSequence = 0, targetConsumerId = null, compressed = false, userID = null, content = null, marshalledProperties = null, dataStructure = null, redeliveryCounter = 0, size = 0, properties = null, readOnlyProperties = false, readOnlyBody = false, droppable = false, jmsXGroupFirstForConsumer = false, text = msg-8}

2022-07-17 09:14:51.672 - [ActiveMQ Transport: tcp://localhost/127.0.0.1:61616@62623] INFO org.apache.activemq.jms.pool.PooledProducer : 106 - send mq msg success, msg:ActiveMQTextMessage {commandId = 0, responseRequired = false, messageId = ID:LAPTOP-7KJFACUD-62614-1594948489750-1:9:1:1:10, originalDestination = null, originalTransactionId = null, producerId = null, destination = topic://demo-persistent-topic, transactionId = null, expiration = 0, timestamp = 1594948491672, arrival = 0, brokerInTime = 0, brokerOutTime = 0, correlationId = null, replyTo = null, persistent = true, type = null, priority = 4, groupID = null, groupSequence = 0, targetConsumerId = null, compressed = false, userID = null, content = null, marshalledProperties = null, dataStructure = null, redeliveryCounter = 0, size = 0, properties = null, readOnlyProperties = false, readOnlyBody = false, droppable = false, jmsXGroupFirstForConsumer = false, text = msg-9}

#### 2.5.2 消费消息

```java
@Test
public void receivePersistentMsg() throws JMSException {
          consumer.receivePersistentMsg();
}
```

2022-07-17 09:15:52.278 - [main] INFO com.jms.activemq.ActiveMQUtil : 150 - receive msg:msg-0

2022-07-17 09:15:52.278 - [main] INFO com.jms.activemq.ActiveMQUtil : 150 - receive msg:msg-1

2022-07-17 09:15:52.278 - [main] INFO com.jms.activemq.ActiveMQUtil : 150 - receive msg:msg-2

2022-07-17 09:15:52.278 - [main] INFO com.jms.activemq.ActiveMQUtil : 150 - receive msg:msg-3

2022-07-17 09:15:52.278 - [main] INFO com.jms.activemq.ActiveMQUtil : 150 - receive msg:msg-4

2022-07-17 09:15:52.278 - [main] INFO com.jms.activemq.ActiveMQUtil : 150 - receive msg:msg-5

2022-07-17 09:15:52.278 - [main] INFO com.jms.activemq.ActiveMQUtil : 150 - receive msg:msg-6

2022-07-17 09:15:52.278 - [main] INFO com.jms.activemq.ActiveMQUtil : 150 - receive msg:msg-7

2022-07-17 09:15:52.278 - [main] INFO com.jms.activemq.ActiveMQUtil : 150 - receive msg:msg-8

2022-07-17 09:15:52.278 - [main] INFO com.jms.activemq.ActiveMQUtil : 150 - receive msg:msg-9

#### 2.5.3 监听消息

```java
@Test
public void listenerPersistentMsg() throws JMSException {
          listener.receivePersistentMsg();
}
```

输出
2022-07-17 09:17:05.373 - [ActiveMQ Session Task-1] INFO com.jms.activemq.ActiveMQUtil : 168 - listen msg:msg-0

2022-07-17 09:17:05.373 - [ActiveMQ Session Task-1] INFO com.jms.activemq.ActiveMQUtil : 168 - listen msg:msg-1

2022-07-17 09:17:05.373 - [ActiveMQ Session Task-1] INFO com.jms.activemq.ActiveMQUtil : 168 - listen msg:msg-2

2022-07-17 09:17:05.373 - [ActiveMQ Session Task-1] INFO com.jms.activemq.ActiveMQUtil : 168 - listen msg:msg-3

2022-07-17 09:17:05.373 - [ActiveMQ Session Task-1] INFO com.jms.activemq.ActiveMQUtil : 168 - listen msg:msg-4

2022-07-17 09:17:05.373 - [ActiveMQ Session Task-1] INFO com.jms.activemq.ActiveMQUtil : 168 - listen msg:msg-5

2022-07-17 09:17:05.373 - [ActiveMQ Session Task-1] INFO com.jms.activemq.ActiveMQUtil : 168 - listen msg:msg-6

2022-07-17 09:17:05.373 - [ActiveMQ Session Task-1] INFO com.jms.activemq.ActiveMQUtil : 168 - listen msg:msg-7

2022-07-17 09:17:05.373 - [ActiveMQ Session Task-1] INFO com.jms.activemq.ActiveMQUtil : 168 - listen msg:msg-8

2022-07-17 09:17:05.373 - [ActiveMQ Session Task-1] INFO com.jms.activemq.ActiveMQUtil : 168 - listen msg:msg-9

## 3 持久订阅小结

1持久订阅的时候一定要先启动一次消费者进行注册，否则消费不到之前的消息

2持久订阅的消费者要设置clentId，每个clientId对应的消费者都会拿到一份全量的消息
