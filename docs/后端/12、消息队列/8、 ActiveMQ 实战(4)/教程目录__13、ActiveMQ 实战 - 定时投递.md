# 13、ActiveMQ 实战 - 定时投递
- 来源：https://ddkk.com/zhuanlan/mq/activemq/4/13.html
- 分类：消息队列
- 分组：教程目录
有些业务场景中我们希望发送完消息后过一段时间再消费，这时候可以用到ActiveMQ延时投递的功能

## 1 第一步需要修改activemq.xml配置文件，开启延时发送

```java
<broker xmlns="http://activemq.apache.org/schema/core" ... schedulerSupport="true" >
          ...
</broker>
```

## 2 第二步消息生产者在发送消息的时候需进行设置

```java
TextMessage message =     session.createTextMessage("这是一条延迟消息");
//设置延迟时间
message.setLongProperty(ScheduledMessage.AMQ_SCHEDULED_DELAY, 200000);
//设置重复投递间隔（非必要，根据实际情况）
message.setLongProperty(ScheduledMessage.AMQ_SCHEDULED_PERIOD, 3000);
//重复投递次数（非必要，根据实际情况）
message.setIntProperty(ScheduledMessage.AMQ_SCHEDULED_REPEAT, 5);
messageProducer.send(message);
```

## 3 测试代码

### 3.1 消费者

```java
public class ScheduledConsumer {
public static void main(String[] args) throws JMSException, InterruptedException {
      ConnectionFactory factory = ActiveMQUtil.factory;
      Connection connection = factory.createConnection();
      connection.start();
      try {
                   Session session = connection.createSession(Boolean.FALSE, Session.AUTO_ACKNOWLEDGE);
                   Destination destination = session.createQueue("scheduled-queue");
                   MessageConsumer consumer = session.createConsumer(destination);
                   TextMessage message = (TextMessage) consumer.receive();
                   while (message != null) {
                                log.info("receive msg:" + message.getText());
                                message = (TextMessage) consumer.receive();
                   }
      }catch (Exception e) {
                   e.printStackTrace();
      }
      TimeUnit.HOURS.sleep(1);
}
}
```

### 3.2 生产者

```java
public class ScheduledProcedure {
public static void main(String[] args) throws JMSException, InterruptedException {
        ConnectionFactory factory = ActiveMQUtil.factory;
        Connection connection = factory.createConnection();
        connection.start();
        Session session = connection.createSession(Boolean.FALSE, Session.AUTO_ACKNOWLEDGE);
        Destination destination = session.createQueue("scheduled-queue");
        MessageProducer producer = session.createProducer(destination);
        TextMessage message = session.createTextMessage("message-1");
        // 延迟1分钟
        message.setLongProperty(ScheduledMessage.AMQ_SCHEDULED_DELAY, 60000);
        // 每个10s投递一次
        message.setLongProperty(ScheduledMessage.AMQ_SCHEDULED_PERIOD, 10000);
        // 投递5次。这里一定要设置为Int，否则重复投递不生效
        message.setIntProperty(ScheduledMessage.AMQ_SCHEDULED_REPEAT, 5);
        producer.send(message);
        log.info("send msg:{}", message.getText());
        session.close();
        connection.close();
}
}
```

先启动消费者，在启动生产者，查看页面

生产者输出

2022-07-22 21:49:53.597 - [main] INFO com.jms.activemq.demo.scheduled.ScheduledProcedure : 28 - send msg:message-1

消费者输出

2022-07-22 21:50:54.062 - [main] INFO com.jms.activemq.demo.scheduled.ScheduledConsumer : 22 - receive msg:message-1

2022-07-22 21:51:04.175 - [main] INFO com.jms.activemq.demo.scheduled.ScheduledConsumer : 22 - receive msg:message-1

2022-07-22 21:51:13.984 - [main] INFO com.jms.activemq.demo.scheduled.ScheduledConsumer : 22 - receive msg:message-1

2022-07-22 21:51:24.174 - [main] INFO com.jms.activemq.demo.scheduled.ScheduledConsumer : 22 - receive msg:message-1

2022-07-22 21:51:33.992 - [main] INFO com.jms.activemq.demo.scheduled.ScheduledConsumer : 22 - receive msg:message-1

2022-07-22 21:51:43.984 - [main] INFO com.jms.activemq.demo.scheduled.ScheduledConsumer : 22 - receive msg:message-1
