# 09、ActiveMQ 实战 - 虚拟主题和镜像队列
- 来源：https://ddkk.com/zhuanlan/mq/activemq/4/9.html
- 分类：消息队列
- 分组：教程目录
## 1 虚拟主题

对于队列，只能是集群消费。对于主题，只能是广播消费。如果一个topic有的服务集群消费，一部分服务广播消费，就需要用到虚拟主题。实际就是创建topic procedure，queue consumer。

### 1.1 普通的主题和队列存在的问题

**1、** 同一应用内consumer端负载均衡的问题：同一个应用上的一个持久订阅不能使用多个consumer来共同承担消息处理功能因为每个都会获取所有消息queue模式可以解决这个问题，broker端又不能将消息发送到多个应用端所以，既要发布订阅，又要让消费者分组，这个功能jms规范本身是没有的；

**2、** 同一应用内consumer端failover的问题：由于只能使用单个的持久订阅者，如果这个订阅者出错，则应用就无法处理消息了，系统的健壮性不高；

为了解决这两个问题，ActiveMQ中实现了虚拟Topic的功能。使用起来非常简单。

对于消息发布者来说，就是一个正常的Topic，名称以VirtualTopic.开头。例如VirtualTopic.topic。

对于消息接收端来说，是个队列，不同应用里使用不同的前缀作为队列的名称，即可表明自己的身份即可实现消费端应用分组。例如Consumer.A.VirtualTopic.topic，说明它是名称为A的消费端，同理Consumer.B.VirtualTopic.topic 说明是一个名称为B的客户端。可以在同一个应用里使用多个consumer消费此queue，则可以实现上面两个功能。又因为不同应用使用的queue名称不同（前缀不同），所以不同的应用中都可以接收到全部的消息。每个客户端相当于一个持久订阅者，而且这个客户端可以使用多个消费者共同来承担消费任务。

### 1.2 代码实现

#### 1.2.1 创建一个virtualTopicContext

```java
@Bean
public ActiveMqContext virtualTopicContext() throws JMSException {
             // virtualTopicName=VirtualTopic.virtual-topic
          return ActiveMQUtil.getTopicContext(Session.AUTO_ACKNOWLEDGE, DeliveryMode.PERSISTENT, virtualTopicName);
}
```

#### 1.2.2 创建VirtualProcedure

```java
@Component
public class VirtualProcedure {
          @Resource(name = "virtualTopicContext")
          private ActiveMqContext context;
          public void sendMsg(String msg) throws JMSException {
                    ActiveMQUtil.sendMsg(context, msg);
          }
}
```

#### 1.2.3 消费应用A

```java
@Slf4j
@Component
public class VirtualConsumerA {
  public void receiveMsg() throws JMSException, InterruptedException {
            Connection connection = ActiveMQUtil.factory.createConnection();
            Session session = connection.createSession(Boolean.FALSE, Session.AUTO_ACKNOWLEDGE);
            Queue queue = session.createQueue("Consumer.A.VirtualTopic.virtual-topic");
            MessageConsumer consumer1 = session.createConsumer(queue);
            MessageConsumer consumer2 = session.createConsumer(queue);
            connection.start();
            MessageListener listener1 = message -> {
                      try {
                                log.info("consumer1 receive message:{}", ((TextMessage)message).getText());
                      } catch (Exception e) {
                                e.printStackTrace();
                      }
            };
            MessageListener listener2 = message -> {
                      try {
                                log.info("consumer2 receive message:{}", ((TextMessage)message).getText());
                      } catch (Exception e) {
                                e.printStackTrace();
                      }
            };
            consumer1.setMessageListener(listener1);
            consumer2.setMessageListener(listener2);
            Thread.sleep(5000000L);
  }
}
```

#### 1.2.4 消费应用B

```java
@Slf4j
@Component
public class VirtualConsumerB {
  public void receiveMsg() throws JMSException, InterruptedException {
            Connection connection = ActiveMQUtil.factory.createConnection();
            Session session = connection.createSession(Boolean.FALSE, Session.AUTO_ACKNOWLEDGE);
            Queue queue = session.createQueue("Consumer.B.VirtualTopic.virtual-topic");
            MessageConsumer consumer = session.createConsumer(queue);
            connection.start();
            MessageListener listener = message -> {
                      try {
                                log.info("receive message:{}", ((TextMessage)message).getText());
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
private VirtualProcedure procedure;
@Autowired
private VirtualConsumerA virtualConsumerA;
@Autowired
private VirtualConsumerB virtualConsumerB;
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
  for (int i = 0; i < 10; i ++) {
            procedure.sendMsg("msg-" + i);
            Thread.sleep(100);
  }  new Thread(() -> {
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
  for (int i = 0; i < 10; i ++) {
            procedure.sendMsg("msg-" + i);
            Thread.sleep(100);
  }
}
private void receiveMsg1() throws JMSException, InterruptedException {
          virtualConsumerA.receiveMsg();
}
private void receiveMsg2() throws JMSException, InterruptedException {
          virtualConsumerB.receiveMsg();
}
```

控制台输出

2022-07-19 16:12:38.599 - [ActiveMQ NIO Worker 9] INFO org.apache.activemq.jms.pool.PooledProducer : 106 - send mq msg success, msg:ActiveMQTextMessage {commandId = 0, responseRequired = false, messageId = ID:LAPTOP-7KJFACUD-65006-1595146355180-1:11:1:1:1, originalDestination = null, originalTransactionId = null, producerId = null, destination = topic://VirtualTopic.virtual-topic, transactionId = null, expiration = 0, timestamp = 1595146358589, arrival = 0, brokerInTime = 0, brokerOutTime = 0, correlationId = null, replyTo = null, persistent = true, type = null, priority = 4, groupID = null, groupSequence = 0, targetConsumerId = null, compressed = false, userID = null, content = null, marshalledProperties = null, dataStructure = null, redeliveryCounter = 0, size = 0, properties = null, readOnlyProperties = false, readOnlyBody = false, droppable = false, jmsXGroupFirstForConsumer = false, text = msg-0}

2022-07-19 16:12:38.618 - [ActiveMQ Session Task-2] INFO c.jms.activemq.demo.virtual_topic.VirtualConsumerA : 26 - consumer1 receive message:msg-0

2022-07-19 16:12:38.618 - [ActiveMQ Session Task-1] INFO c.jms.activemq.demo.virtual_topic.VirtualConsumerB : 25 - receive message:msg-0

2022-07-19 16:12:38.698 - [ActiveMQ Session Task-1] INFO c.jms.activemq.demo.virtual_topic.VirtualConsumerB : 25 - receive message:msg-1

2022-07-19 16:12:38.705 - [ActiveMQ Session Task-2] INFO c.jms.activemq.demo.virtual_topic.VirtualConsumerA : 33 - consumer2 receive message:msg-1

2022-07-19 16:12:38.772 - [ActiveMQ NIO Worker 9] INFO org.apache.activemq.jms.pool.PooledProducer : 106 - send mq msg success, msg:ActiveMQTextMessage {commandId = 0, responseRequired = false, messageId = ID:LAPTOP-7KJFACUD-65006-1595146355180-1:11:1:1:2, originalDestination = null, originalTransactionId = null, producerId = null, destination = topic://VirtualTopic.virtual-topic, transactionId = null, expiration = 0, timestamp = 1595146358695, arrival = 0, brokerInTime = 0, brokerOutTime = 0, correlationId = null, replyTo = null, persistent = true, type = null, priority = 4, groupID = null, groupSequence = 0, targetConsumerId = null, compressed = false, userID = null, content = null, marshalledProperties = null, dataStructure = null, redeliveryCounter = 0, size = 0, properties = null, readOnlyProperties = false, readOnlyBody = false, droppable = false, jmsXGroupFirstForConsumer = false, text = msg-1}

2022-07-19 16:12:38.804 - [ActiveMQ Session Task-1] INFO c.jms.activemq.demo.virtual_topic.VirtualConsumerB : 25 - receive message:msg-2

2022-07-19 16:12:38.862 - [ActiveMQ Session Task-2] INFO c.jms.activemq.demo.virtual_topic.VirtualConsumerA : 26 - consumer1 receive message:msg-2

2022-07-19 16:12:38.894 - [ActiveMQ NIO Worker 9] INFO org.apache.activemq.jms.pool.PooledProducer : 106 - send mq msg success, msg:ActiveMQTextMessage {commandId = 0, responseRequired = false, messageId = ID:LAPTOP-7KJFACUD-65006-1595146355180-1:11:1:1:3, originalDestination = null, originalTransactionId = null, producerId = null, destination = topic://VirtualTopic.virtual-topic, transactionId = null, expiration = 0, timestamp = 1595146358798, arrival = 0, brokerInTime = 0, brokerOutTime = 0, correlationId = null, replyTo = null, persistent = true, type = null, priority = 4, groupID = null, groupSequence = 0, targetConsumerId = null, compressed = false, userID = null, content = null, marshalledProperties = null, dataStructure = null, redeliveryCounter = 0, size = 0, properties = null, readOnlyProperties = false, readOnlyBody = false, droppable = false, jmsXGroupFirstForConsumer = false, text = msg-2}

2022-07-19 16:12:38.930 - [ActiveMQ Session Task-1] INFO c.jms.activemq.demo.virtual_topic.VirtualConsumerB : 25 - receive message:msg-3

2022-07-19 16:12:38.991 - [ActiveMQ Session Task-2] INFO c.jms.activemq.demo.virtual_topic.VirtualConsumerA : 26 - consumer1 receive message:msg-3

2022-07-19 16:12:39.016 - [ActiveMQ NIO Worker 9] INFO org.apache.activemq.jms.pool.PooledProducer : 106 - send mq msg success, msg:ActiveMQTextMessage {commandId = 0, responseRequired = false, messageId = ID:LAPTOP-7KJFACUD-65006-1595146355180-1:11:1:1:4, originalDestination = null, originalTransactionId = null, producerId = null, destination = topic://VirtualTopic.virtual-topic, transactionId = null, expiration = 0, timestamp = 1595146358901, arrival = 0, brokerInTime = 0, brokerOutTime = 0, correlationId = null, replyTo = null, persistent = true, type = null, priority = 4, groupID = null, groupSequence = 0, targetConsumerId = null, compressed = false, userID = null, content = null, marshalledProperties = null, dataStructure = null, redeliveryCounter = 0, size = 0, properties = null, readOnlyProperties = false, readOnlyBody = false, droppable = false, jmsXGroupFirstForConsumer = false, text = msg-3}

2022-07-19 16:12:39.023 - [ActiveMQ Session Task-1] INFO c.jms.activemq.demo.virtual_topic.VirtualConsumerB : 25 - receive message:msg-4

2022-07-19 16:12:39.039 - [ActiveMQ Session Task-2] INFO c.jms.activemq.demo.virtual_topic.VirtualConsumerA : 33 - consumer2 receive message:msg-4

2022-07-19 16:12:39.081 - [ActiveMQ NIO Worker 9] INFO org.apache.activemq.jms.pool.PooledProducer : 106 - send mq msg success, msg:ActiveMQTextMessage {commandId = 0, responseRequired = false, messageId = ID:LAPTOP-7KJFACUD-65006-1595146355180-1:11:1:1:5, originalDestination = null, originalTransactionId = null, producerId = null, destination = topic://VirtualTopic.virtual-topic, transactionId = null, expiration = 0, timestamp = 1595146359003, arrival = 0, brokerInTime = 0, brokerOutTime = 0, correlationId = null, replyTo = null, persistent = true, type = null, priority = 4, groupID = null, groupSequence = 0, targetConsumerId = null, compressed = false, userID = null, content = null, marshalledProperties = null, dataStructure = null, redeliveryCounter = 0, size = 0, properties = null, readOnlyProperties = false, readOnlyBody = false, droppable = false, jmsXGroupFirstForConsumer = false, text = msg-4}

2022-07-19 16:12:39.109 - [ActiveMQ Session Task-1] INFO c.jms.activemq.demo.virtual_topic.VirtualConsumerB : 25 - receive message:msg-5

2022-07-19 16:12:39.129 - [ActiveMQ Session Task-2] INFO c.jms.activemq.demo.virtual_topic.VirtualConsumerA : 33 - consumer2 receive message:msg-5

2022-07-19 16:12:39.180 - [ActiveMQ NIO Worker 9] INFO org.apache.activemq.jms.pool.PooledProducer : 106 - send mq msg success, msg:ActiveMQTextMessage {commandId = 0, responseRequired = false, messageId = ID:LAPTOP-7KJFACUD-65006-1595146355180-1:11:1:1:6, originalDestination = null, originalTransactionId = null, producerId = null, destination = topic://VirtualTopic.virtual-topic, transactionId = null, expiration = 0, timestamp = 1595146359106, arrival = 0, brokerInTime = 0, brokerOutTime = 0, correlationId = null, replyTo = null, persistent = true, type = null, priority = 4, groupID = null, groupSequence = 0, targetConsumerId = null, compressed = false, userID = null, content = null, marshalledProperties = null, dataStructure = null, redeliveryCounter = 0, size = 0, properties = null, readOnlyProperties = false, readOnlyBody = false, droppable = false, jmsXGroupFirstForConsumer = false, text = msg-5}

2022-07-19 16:12:39.212 - [ActiveMQ Session Task-1] INFO c.jms.activemq.demo.virtual_topic.VirtualConsumerB : 25 - receive message:msg-6

2022-07-19 16:12:39.318 - [ActiveMQ Session Task-2] INFO c.jms.activemq.demo.virtual_topic.VirtualConsumerA : 33 - consumer2 receive message:msg-6

2022-07-19 16:12:39.436 - [ActiveMQ NIO Worker 9] INFO org.apache.activemq.jms.pool.PooledProducer : 106 - send mq msg success, msg:ActiveMQTextMessage {commandId = 0, responseRequired = false, messageId = ID:LAPTOP-7KJFACUD-65006-1595146355180-1:11:1:1:7, originalDestination = null, originalTransactionId = null, producerId = null, destination = topic://VirtualTopic.virtual-topic, transactionId = null, expiration = 0, timestamp = 1595146359209, arrival = 0, brokerInTime = 0, brokerOutTime = 0, correlationId = null, replyTo = null, persistent = true, type = null, priority = 4, groupID = null, groupSequence = 0, targetConsumerId = null, compressed = false, userID = null, content = null, marshalledProperties = null, dataStructure = null, redeliveryCounter = 0, size = 0, properties = null, readOnlyProperties = false, readOnlyBody = false, droppable = false, jmsXGroupFirstForConsumer = false, text = msg-6}

2022-07-19 16:12:39.446 - [ActiveMQ Session Task-1] INFO c.jms.activemq.demo.virtual_topic.VirtualConsumerB : 25 - receive message:msg-7

2022-07-19 16:12:39.449 - [DefaultMessageListenerContainer-8] ERROR o.s.jms.listener.DefaultMessageListenerContainer : 962 - Could not refresh JMS Connection for destination 'springboot-queue' - retrying using FixedBackOff{interval=5000, currentAttempts=0, maxAttempts=unlimited}. Cause: Could not connect to broker URL: tcp://localhost:61616. Reason: java.net.ConnectException: Connection refused: connect

2022-07-19 16:12:39.449 - [ActiveMQ Session Task-2] INFO c.jms.activemq.demo.virtual_topic.VirtualConsumerA : 33 - consumer2 receive message:msg-7

2022-07-19 16:12:39.505 - [ActiveMQ NIO Worker 9] INFO org.apache.activemq.jms.pool.PooledProducer : 106 - send mq msg success, msg:ActiveMQTextMessage {commandId = 0, responseRequired = false, messageId = ID:LAPTOP-7KJFACUD-65006-1595146355180-1:11:1:1:8, originalDestination = null, originalTransactionId = null, producerId = null, destination = topic://VirtualTopic.virtual-topic, transactionId = null, expiration = 0, timestamp = 1595146359312, arrival = 0, brokerInTime = 0, brokerOutTime = 0, correlationId = null, replyTo = null, persistent = true, type = null, priority = 4, groupID = null, groupSequence = 0, targetConsumerId = null, compressed = false, userID = null, content = null, marshalledProperties = null, dataStructure = null, redeliveryCounter = 0, size = 0, properties = null, readOnlyProperties = false, readOnlyBody = false, droppable = false, jmsXGroupFirstForConsumer = false, text = msg-7}

2022-07-19 16:12:39.510 - [ActiveMQ Session Task-1] INFO c.jms.activemq.demo.virtual_topic.VirtualConsumerB : 25 - receive message:msg-8

2022-07-19 16:12:39.530 - [ActiveMQ Session Task-2] INFO c.jms.activemq.demo.virtual_topic.VirtualConsumerA : 26 - consumer1 receive message:msg-8

2022-07-19 16:12:39.575 - [ActiveMQ NIO Worker 9] INFO org.apache.activemq.jms.pool.PooledProducer : 106 - send mq msg success, msg:ActiveMQTextMessage {commandId = 0, responseRequired = false, messageId = ID:LAPTOP-7KJFACUD-65006-1595146355180-1:11:1:1:9, originalDestination = null, originalTransactionId = null, producerId = null, destination = topic://VirtualTopic.virtual-topic, transactionId = null, expiration = 0, timestamp = 1595146359415, arrival = 0, brokerInTime = 0, brokerOutTime = 0, correlationId = null, replyTo = null, persistent = true, type = null, priority = 4, groupID = null, groupSequence = 0, targetConsumerId = null, compressed = false, userID = null, content = null, marshalledProperties = null, dataStructure = null, redeliveryCounter = 0, size = 0, properties = null, readOnlyProperties = false, readOnlyBody = false, droppable = false, jmsXGroupFirstForConsumer = false, text = msg-8}

2022-07-19 16:12:39.587 - [ActiveMQ Session Task-1] INFO c.jms.activemq.demo.virtual_topic.VirtualConsumerB : 25 - receive message:msg-9

2022-07-19 16:12:39.597 - [ActiveMQ Session Task-2] INFO c.jms.activemq.demo.virtual_topic.VirtualConsumerA : 33 - consumer2 receive message:msg-9

2022-07-19 16:12:39.597 - [ActiveMQ NIO Worker 9] INFO org.apache.activemq.jms.pool.PooledProducer : 106 - send mq msg success, msg:ActiveMQTextMessage {commandId = 0, responseRequired = false, messageId = ID:LAPTOP-7KJFACUD-65006-1595146355180-1:11:1:1:10, originalDestination = null, originalTransactionId = null, producerId = null, destination = topic://VirtualTopic.virtual-topic, transactionId = null, expiration = 0, timestamp = 1595146359517, arrival = 0, brokerInTime = 0, brokerOutTime = 0, correlationId = null, replyTo = null, persistent = true, type = null, priority = 4, groupID = null, groupSequence = 0, targetConsumerId = null, compressed = false, userID = null, content = null, marshalledProperties = null, dataStructure = null, redeliveryCounter = 0, size = 0, properties = null, readOnlyProperties = false, readOnlyBody = false, droppable = false, jmsXGroupFirstForConsumer = false, text = msg-9}

可以看到VirtualConsumerA两个消费者共同消费一份消息，VirtualConsumerB的消费者独自消费一份消息

### 1.3 虚拟主题原理

Virtual Topic这个功能特性在broker上有个总开关，useVirtualTopics属性，默认为true，设置为false即可关闭此功能。当此功能开启，并且使用了持久化的存储时，broker启动的时候会从持久化存储里拿到所有的destinations的名称，如果名称模式与Virtual Topics匹配，则把它们添加到系统的Virtual Topics列表中去。当然，没有显式定义的Virtual Topics，也可以直接使用的，系统会自动创建对应的实际topic。当有consumer访问此VirtualTopics时，系统会自动创建持久化的queue，并在每次Topic收到消息时，分发到具体的queue。

消费端使用的queue名称前缀的Consumer是可以修改的。示例如下：

```java
<broker    xmlns="http://activemq.apache.org/schema/core">        
<destinationInterceptors>        
        <virtualDestinationInterceptor>        
                <virtualDestinations>        
                        <virtualTopic    name=">"prefix="VirtualTopicConsumers.*."selectorAware="false"/>        
                </virtualDestinations>        
        </virtualDestinationInterceptor>        
</destinationInterceptors>        
```

## 2 镜像队列

ActiveMQ每一个queue中消息只能被一个消费者消费，然而，有时候，你希望能够监视生产者和消费者之间的消息流。你可以通过使用VirtualDestinations来建立一个virtualqueue来把消息转发到多个queue中。但是，为系统每一个queue都进行如此的配置可能会很麻烦。

MirroredQueue: Broker会把发送到某一个队列上的所有消息转发到一个名称类似的topic,因此监控程序只需要订阅这个mirroredqueue topic.为启用MirroredQueue，首先要将BrokerService的useMirroredQueues属性设置为true：

```java
<broker xmlns="http://activemq.apache.org/schema/core" useMirroredQueues="true">
</broker>
```

然后可以通过destinationInterceptors设置其属性，如mirrortopic的前缀，缺省是VritualTopic.Mirror.

```java
<broker xmlns="http://activemq.apache.org/schema/core">
       <destinationInterceptors>
                       <mirroredQueue copyMessage="true" postfix=".qmirror" prefix="" />
       </destinationInterceptors>
</broker>
```

镜像队列应用的不多，这里就不再演示了
