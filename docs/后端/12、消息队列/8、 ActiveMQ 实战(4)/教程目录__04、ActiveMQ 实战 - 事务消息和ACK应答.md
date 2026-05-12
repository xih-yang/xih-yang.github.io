# 04、ActiveMQ 实战 - 事务消息和ACK应答
- 来源：https://ddkk.com/zhuanlan/mq/activemq/4/4.html
- 分类：消息队列
- 分组：教程目录
## 1 ACK机制

ActiveMQ消息签收方式在创建Session的时候指定

Session session = connection.createSession(transaction, acknowledgeMode);

Session.AUTO_ACKNOWLEDGE：当客户成功的从receive方法返回的时候，或者从MessageListener.onMessage方法成功返回的时候，Session自动确认客户收到的消息。

Session.CLIENT_ACKNOWLEDGE：客户通过调用消息的acknowledge方法(message.acknowledge())确认消息。需要注意的是，在这种模式中，确认是在Session层上进行，确认一个被消费的消息将自动确认所有已被Session消费的消息。

例如，如果一个消息消费者消费了10 个消息，然后确认第5个消息，那么所有10个消息都被确认。

Session.DUPS_ACKNOWLEDGE：该选择只是Session迟钝的确认消息的提交。如果JMSprovider失败，那么可能会导致一些重复的消息。如果是重复的消息，那么JMSprovider 必须把消息头的JMSRedelivered字段设置为true

## 2 事务消息

ActiveMQ消息是否支持事务同样在创建Session的时候指定

Session session = connection.createSession(transaction, acknowledgeMode);

支持事务后send后不会发送，commit后才会发出去(sssion.commit())，同样，消费的时候也需要commit才会完成消费(session.commit())

## 3 ACK应答和事务的关系

- 如果Session开启事务，则发送和接收消息都需要commit，且此时无视ACK。即使ACK设置的是手动提交，消费消息commit后就自动确认了消息，无需再执行message.acknowledge()方法。
- 如果Session没开启事务，则消费消息后需要手动ack，否则会导致消费重试
