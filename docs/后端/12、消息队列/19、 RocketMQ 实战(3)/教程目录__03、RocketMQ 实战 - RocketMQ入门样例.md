# 03、RocketMQ 实战 - RocketMQ入门样例
- 来源：https://ddkk.com/zhuanlan/mq/rocketmq/7/3.html
- 分类：消息队列
- 分组：教程目录
## 一、概述

RocketMQ支持发送三种类型的消息：**同步消息、异步消息和单向消息**。其中前两种消息是可靠的，因为会有发送是否成功的应答。

接下来，我们将演示如何发送三种类型的消息，来快速熟悉RocketMQ的使用。首先需要加入RocketMQ的依赖，

因为是Maven项目，所以在pom.xml中加入如下依赖：

```java
<dependency>
  <groupId>org.apache.rocketmq</groupId>
  <artifactId>rocketmq-client</artifactId>
  <version>4.9.2</version>
</dependency>
```

> 注意，rocketmq-client的版本尽量跟我们安装的rocketmq版本保持一致。

## 二、Producer端发送同步消息

**发送同步消息使用的比较多，适合一些可靠性要求比较高的场景，比如：重要的消息通知，短信通知。**

```java
import org.apache.rocketmq.client.exception.MQBrokerException;
import org.apache.rocketmq.client.exception.MQClientException;
import org.apache.rocketmq.client.producer.DefaultMQProducer;
import org.apache.rocketmq.client.producer.SendResult;
import org.apache.rocketmq.common.message.Message;
import org.apache.rocketmq.remoting.common.RemotingHelper;
import org.apache.rocketmq.remoting.exception.RemotingException;
import java.io.UnsupportedEncodingException;
/**
 * Producer端发送同步消息
 */
public class SyncMQProducer {
    public static void main(String[] args) throws MQClientException, UnsupportedEncodingException, RemotingException, InterruptedException, MQBrokerException {
        // 创建DefaultMQProducer类并设定生产者名称
        DefaultMQProducer mqProducer = new DefaultMQProducer("producer-group-test");
        // 设置NameServer地址，如果是集群的话，使用分号;分隔开
        mqProducer.setNamesrvAddr("10.0.90.86:9876");
        // 消息最大长度 默认4M
        mqProducer.setMaxMessageSize(4096);
        // 发送消息超时时间，默认3000
        mqProducer.setSendMsgTimeout(3000);
        // 发送消息失败重试次数，默认2
        mqProducer.setRetryTimesWhenSendAsyncFailed(2);
        // 启动消息生产者
        mqProducer.start();
        // 循环十次，发送十条消息
        for (int i = 1; i <= 10; i++) {
            String msg = "hello, 这是第" + i + "条同步消息";
            // 创建消息，并指定Topic(主题)，Tag(标签)和消息内容
            Message message = new Message("SimpleTopic", "", msg.getBytes(RemotingHelper.DEFAULT_CHARSET));
            // 发送同步消息到一个Broker，可以通过sendResult返回消息是否成功送达
            SendResult sendResult = mqProducer.send(message);
            System.out.println(sendResult);
        }
        // 如果不再发送消息，关闭Producer实例
        mqProducer.shutdown();
    }
}
```

启动程序，如下可以看到，消息发送状态都为SEND_OK，表示此条消息成功发送到RocketMQ Broker中。

```java
SendResult [sendStatus=SEND_OK, msgId=AC6E005A21AC18B4AAC278D2433E0000, offsetMsgId=0A005A5600002A9F0000000000001743, messageQueue=MessageQueue [topic=SimpleTopic, brokerName=broker-a, queueId=3], queueOffset=8]
SendResult [sendStatus=SEND_OK, msgId=AC6E005A21AC18B4AAC278D243510001, offsetMsgId=0A005A5600002A9F0000000000001809, messageQueue=MessageQueue [topic=SimpleTopic, brokerName=broker-a, queueId=0], queueOffset=8]
SendResult [sendStatus=SEND_OK, msgId=AC6E005A21AC18B4AAC278D243590002, offsetMsgId=0A005A5600002A9F00000000000018CF, messageQueue=MessageQueue [topic=SimpleTopic, brokerName=broker-a, queueId=1], queueOffset=6]
SendResult [sendStatus=SEND_OK, msgId=AC6E005A21AC18B4AAC278D2435F0003, offsetMsgId=0A005A5600002A9F0000000000001995, messageQueue=MessageQueue [topic=SimpleTopic, brokerName=broker-a, queueId=2], queueOffset=9]
SendResult [sendStatus=SEND_OK, msgId=AC6E005A21AC18B4AAC278D243660004, offsetMsgId=0A005A5600002A9F0000000000001A5B, messageQueue=MessageQueue [topic=SimpleTopic, brokerName=broker-a, queueId=3], queueOffset=9]
SendResult [sendStatus=SEND_OK, msgId=AC6E005A21AC18B4AAC278D2436E0005, offsetMsgId=0A005A5600002A9F0000000000001B21, messageQueue=MessageQueue [topic=SimpleTopic, brokerName=broker-a, queueId=0], queueOffset=9]
SendResult [sendStatus=SEND_OK, msgId=AC6E005A21AC18B4AAC278D243760006, offsetMsgId=0A005A5600002A9F0000000000001BE7, messageQueue=MessageQueue [topic=SimpleTopic, brokerName=broker-a, queueId=1], queueOffset=7]
SendResult [sendStatus=SEND_OK, msgId=AC6E005A21AC18B4AAC278D2437D0007, offsetMsgId=0A005A5600002A9F0000000000001CAD, messageQueue=MessageQueue [topic=SimpleTopic, brokerName=broker-a, queueId=2], queueOffset=10]
SendResult [sendStatus=SEND_OK, msgId=AC6E005A21AC18B4AAC278D243830008, offsetMsgId=0A005A5600002A9F0000000000001D73, messageQueue=MessageQueue [topic=SimpleTopic, brokerName=broker-a, queueId=3], queueOffset=10]
SendResult [sendStatus=SEND_OK, msgId=AC6E005A21AC18B4AAC278D243890009, offsetMsgId=0A005A5600002A9F0000000000001E39, messageQueue=MessageQueue [topic=SimpleTopic, brokerName=broker-a, queueId=0], queueOffset=10]
```

## 三、Producer端发送异步消息

**异步消息通常用在对响应时间敏感的业务场景，即发送端不能容忍长时间地等待Broker的响应。**

```java
import org.apache.rocketmq.client.exception.MQBrokerException;
import org.apache.rocketmq.client.exception.MQClientException;
import org.apache.rocketmq.client.producer.DefaultMQProducer;
import org.apache.rocketmq.client.producer.SendCallback;
import org.apache.rocketmq.client.producer.SendResult;
import org.apache.rocketmq.common.message.Message;
import org.apache.rocketmq.remoting.common.RemotingHelper;
import org.apache.rocketmq.remoting.exception.RemotingException;
import java.io.UnsupportedEncodingException;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
/**
 * Producer端发送异步消息
 */
public class ASyncMQProducer {
    public static void main(String[] args) throws MQClientException, UnsupportedEncodingException, RemotingException, InterruptedException, MQBrokerException {
        // 创建DefaultMQProducer类并设定生产者名称
        DefaultMQProducer mqProducer = new DefaultMQProducer("producer-group-test");
        // 设置NameServer地址，如果是集群的话，使用分号;分隔开
        mqProducer.setNamesrvAddr("10.0.90.86:9876");
        // 消息最大长度 默认4M
        mqProducer.setMaxMessageSize(4096);
        // 发送消息超时时间，默认3000
        mqProducer.setSendMsgTimeout(3000);
        // 发送消息失败重试次数，默认2
        mqProducer.setRetryTimesWhenSendAsyncFailed(2);
        // 启动消息生产者
        mqProducer.start();
        int messageCount = 10;
        // 根据消息数量实例化倒计时计算器
        final CountDownLatch countDownLatch = new CountDownLatch(messageCount);
        // 循环十次，发送十条消息
        for (int i = 1; i <= messageCount; i++) {
            String msg = "hello, 这是第" + i + "条异步消息";
            // 创建消息，并指定Topic(主题)，Tag(标签)和消息内容
            Message message = new Message("SimpleTopic", "", "", msg.getBytes(RemotingHelper.DEFAULT_CHARSET));
            // SendCallback接收异步返回结果的回调
            mqProducer.send(message, new SendCallback() {
                // 发送成功的回调
                @Override
                public void onSuccess(SendResult sendResult) {
                    countDownLatch.countDown();
                    System.out.println(sendResult);
                }
                // 发送失败的回调
                @Override
                public void onException(Throwable e) {
                    countDownLatch.countDown();
                    e.printStackTrace();
                }
            });
        }
        // 等待5s
        countDownLatch.await(5, TimeUnit.SECONDS);
        // 如果不再发送消息，关闭Producer实例
        mqProducer.shutdown();
    }
}
```

启动程序，如下可以看到，消息发送状态都为SEND_OK，表示此条消息成功发送到RocketMQ Broker中。

```java
SendResult [sendStatus=SEND_OK, msgId=AC6E005A34E818B4AAC278D2C0360006, offsetMsgId=0A005A5600002A9F0000000000001F00, messageQueue=MessageQueue [topic=SimpleTopic, brokerName=broker-a, queueId=3], queueOffset=11]
SendResult [sendStatus=SEND_OK, msgId=AC6E005A34E818B4AAC278D2C0350000, offsetMsgId=0A005A5600002A9F0000000000001FC6, messageQueue=MessageQueue [topic=SimpleTopic, brokerName=broker-a, queueId=0], queueOffset=11]
SendResult [sendStatus=SEND_OK, msgId=AC6E005A34E818B4AAC278D2C0370009, offsetMsgId=0A005A5600002A9F000000000000208C, messageQueue=MessageQueue [topic=SimpleTopic, brokerName=broker-a, queueId=2], queueOffset=11]
SendResult [sendStatus=SEND_OK, msgId=AC6E005A34E818B4AAC278D2C0350002, offsetMsgId=0A005A5600002A9F0000000000002152, messageQueue=MessageQueue [topic=SimpleTopic, brokerName=broker-a, queueId=2], queueOffset=12]
SendResult [sendStatus=SEND_OK, msgId=AC6E005A34E818B4AAC278D2C0370008, offsetMsgId=0A005A5600002A9F0000000000002218, messageQueue=MessageQueue [topic=SimpleTopic, brokerName=broker-a, queueId=3], queueOffset=12]
SendResult [sendStatus=SEND_OK, msgId=AC6E005A34E818B4AAC278D2C0360005, offsetMsgId=0A005A5600002A9F00000000000022DE, messageQueue=MessageQueue [topic=SimpleTopic, brokerName=broker-a, queueId=1], queueOffset=8]
SendResult [sendStatus=SEND_OK, msgId=AC6E005A34E818B4AAC278D2C0350003, offsetMsgId=0A005A5600002A9F00000000000023A4, messageQueue=MessageQueue [topic=SimpleTopic, brokerName=broker-a, queueId=2], queueOffset=13]
SendResult [sendStatus=SEND_OK, msgId=AC6E005A34E818B4AAC278D2C0360007, offsetMsgId=0A005A5600002A9F000000000000246B, messageQueue=MessageQueue [topic=SimpleTopic, brokerName=broker-a, queueId=0], queueOffset=12]
SendResult [sendStatus=SEND_OK, msgId=AC6E005A34E818B4AAC278D2C0350004, offsetMsgId=0A005A5600002A9F0000000000002531, messageQueue=MessageQueue [topic=SimpleTopic, brokerName=broker-a, queueId=1], queueOffset=9]
SendResult [sendStatus=SEND_OK, msgId=AC6E005A34E818B4AAC278D2C0350001, offsetMsgId=0A005A5600002A9F00000000000025F7, messageQueue=MessageQueue [topic=SimpleTopic, brokerName=broker-a, queueId=2], queueOffset=14]
```

## 四、Producer端单向发送消息

**单向消息主要用在不特别关心发送结果的场景，例如日志发送。**

```java
import org.apache.rocketmq.client.exception.MQBrokerException;
import org.apache.rocketmq.client.exception.MQClientException;
import org.apache.rocketmq.client.producer.DefaultMQProducer;
import org.apache.rocketmq.common.message.Message;
import org.apache.rocketmq.remoting.common.RemotingHelper;
import org.apache.rocketmq.remoting.exception.RemotingException;
import java.io.UnsupportedEncodingException;
/**
 * Producer端发送单向消息
 */
public class OneWayMQProducer {
    public static void main(String[] args) throws MQClientException, UnsupportedEncodingException, RemotingException, InterruptedException, MQBrokerException {
        // 创建DefaultMQProducer类并设定生产者名称
        DefaultMQProducer mqProducer = new DefaultMQProducer("producer-group-test");
        // 设置NameServer地址，如果是集群的话，使用分号;分隔开
        mqProducer.setNamesrvAddr("10.0.90.86:9876");
        // 消息最大长度 默认4M
        mqProducer.setMaxMessageSize(4096);
        // 发送消息超时时间，默认3000
        mqProducer.setSendMsgTimeout(3000);
        // 发送消息失败重试次数，默认2
        mqProducer.setRetryTimesWhenSendAsyncFailed(2);
        // 启动消息生产者
        mqProducer.start();
        // 循环十次，发送十条消息
        for (int i = 1; i <= 10; i++) {
            String msg = "hello, 这是第" + i + "条单向消息";
            // 创建消息，并指定Topic(主题)，Tag(标签)和消息内容
            Message message = new Message("SimpleTopic", "", "", msg.getBytes(RemotingHelper.DEFAULT_CHARSET));
            // 发送单向消息，没有任何返回结果
            mqProducer.sendOneway(message);
        }
        // 如果不再发送消息，关闭Producer实例
        mqProducer.shutdown();
    }
}
```

启动程序，如下可以看到，控制台没有消息发送结果，也说明单向发送消息，RocketMQ不返回消息是否发送成功。

## 五、消费消息

```java
import org.apache.rocketmq.client.consumer.DefaultMQPushConsumer;
import org.apache.rocketmq.client.consumer.listener.ConsumeConcurrentlyContext;
import org.apache.rocketmq.client.consumer.listener.ConsumeConcurrentlyStatus;
import org.apache.rocketmq.client.consumer.listener.MessageListenerConcurrently;
import org.apache.rocketmq.client.exception.MQClientException;
import org.apache.rocketmq.common.consumer.ConsumeFromWhere;
import org.apache.rocketmq.common.message.MessageExt;
import org.apache.rocketmq.common.protocol.heartbeat.MessageModel;
import java.nio.charset.StandardCharsets;
import java.util.List;
/**
 * 消息消费者
 */
public class MQConsumer {
    public static void main(String[] args) throws MQClientException {
        // 创建DefaultMQPushConsumer类并设定消费者名称
        DefaultMQPushConsumer mqPushConsumer = new DefaultMQPushConsumer("consumer-group-test");
        // 设置NameServer地址，如果是集群的话，使用分号;分隔开
        mqPushConsumer.setNamesrvAddr("10.0.90.86:9876");
        // 设置Consumer第一次启动是从队列头部开始消费还是队列尾部开始消费
        // 如果不是第一次启动，那么按照上次消费的位置继续消费
        mqPushConsumer.setConsumeFromWhere(ConsumeFromWhere.CONSUME_FROM_LAST_OFFSET);
        // 设置消费模型，集群还是广播，默认为集群
        mqPushConsumer.setMessageModel(MessageModel.CLUSTERING);
        // 消费者最小线程量
        mqPushConsumer.setConsumeThreadMin(5);
        // 消费者最大线程量
        mqPushConsumer.setConsumeThreadMax(10);
        // 设置一次消费消息的条数，默认是1
        mqPushConsumer.setConsumeMessageBatchMaxSize(1);
        // 订阅一个或者多个Topic，以及Tag来过滤需要消费的消息，如果订阅该主题下的所有tag，则使用*
        mqPushConsumer.subscribe("SimpleTopic", "*");
        // 注册回调实现类来处理从broker拉取回来的消息
        mqPushConsumer.registerMessageListener(new MessageListenerConcurrently() {
            // 监听类实现MessageListenerConcurrently接口即可，重写consumeMessage方法接收数据
            @Override
            public ConsumeConcurrentlyStatus consumeMessage(List<MessageExt> msgList, ConsumeConcurrentlyContext consumeConcurrentlyContext) {
                MessageExt messageExt = msgList.get(0);
                String body = new String(messageExt.getBody(), StandardCharsets.UTF_8);
                System.out.println("消费者接收到消息: " + messageExt.toString() + "---消息内容为：" + body);
                // 标记该消息已经被成功消费
                return ConsumeConcurrentlyStatus.CONSUME_SUCCESS;
            }
        });
        // 启动消费者实例
        mqPushConsumer.start();
    }
}
```

启动程序，如下可以看到，Consumer端成功接收到前面我们三种方式发送的总共30条消息：

```java
消费者接收到消息: MessageExt [brokerName=broker-a, queueId=0, storeSize=198, queueOffset=8, sysFlag=0, bornTimestamp=1645671845713, bornHost=/10.0.90.115:55832, storeTimestamp=1645671842952, storeHost=/10.0.90.86:10911, msgId=0A005A5600002A9F0000000000001809, commitLogOffset=6153, bodyCRC=240311509, reconsumeTimes=0, preparedTransactionOffset=0, toString()=Message{topic='SimpleTopic', flag=0, properties={MIN_OFFSET=0, MAX_OFFSET=16, CONSUME_START_TIME=1645671972753, UNIQ_KEY=AC6E005A21AC18B4AAC278D243510001, CLUSTER=DefaultCluster}, body=[104, 101, 108, 108, 111, 44, 32, -24, -65, -103, -26, -104, -81, -25, -84, -84, 50, -26, -99, -95, -27, -112, -116, -26, -83, -91, -26, -74, -120, -26, -127, -81], transactionId='null'}]---消息内容为：hello, 这是第2条同步消息
消费者接收到消息: MessageExt [brokerName=broker-a, queueId=2, storeSize=198, queueOffset=10, sysFlag=0, bornTimestamp=1645671845757, bornHost=/10.0.90.115:55832, storeTimestamp=1645671842995, storeHost=/10.0.90.86:10911, msgId=0A005A5600002A9F0000000000001CAD, commitLogOffset=7341, bodyCRC=2061592313, reconsumeTimes=0, preparedTransactionOffset=0, toString()=Message{topic='SimpleTopic', flag=0, properties={MIN_OFFSET=0, MAX_OFFSET=17, CONSUME_START_TIME=1645671972753, UNIQ_KEY=AC6E005A21AC18B4AAC278D2437D0007, CLUSTER=DefaultCluster}, body=[104, 101, 108, 108, 111, 44, 32, -24, -65, -103, -26, -104, -81, -25, -84, -84, 56, -26, -99, -95, -27, -112, -116, -26, -83, -91, -26, -74, -120, -26, -127, -81], transactionId='null'}]---消息内容为：hello, 这是第8条同步消息
消费者接收到消息: MessageExt [brokerName=broker-a, queueId=2, storeSize=198, queueOffset=9, sysFlag=0, bornTimestamp=1645671845727, bornHost=/10.0.90.115:55832, storeTimestamp=1645671842966, storeHost=/10.0.90.86:10911, msgId=0A005A5600002A9F0000000000001995, commitLogOffset=6549, bodyCRC=1573106993, reconsumeTimes=0, preparedTransactionOffset=0, toString()=Message{topic='SimpleTopic', flag=0, properties={MIN_OFFSET=0, MAX_OFFSET=17, CONSUME_START_TIME=1645671972753, UNIQ_KEY=AC6E005A21AC18B4AAC278D2435F0003, CLUSTER=DefaultCluster}, body=[104, 101, 108, 108, 111, 44, 32, -24, -65, -103, -26, -104, -81, -25, -84, -84, 52, -26, -99, -95, -27, -112, -116, -26, -83, -91, -26, -74, -120, -26, -127, -81], transactionId='null'}]---消息内容为：hello, 这是第4条同步消息
消费者接收到消息: MessageExt [brokerName=broker-a, queueId=3, storeSize=198, queueOffset=8, sysFlag=0, bornTimestamp=1645671845695, bornHost=/10.0.90.115:55832, storeTimestamp=1645671842941, storeHost=/10.0.90.86:10911, msgId=0A005A5600002A9F0000000000001743, commitLogOffset=5955, bodyCRC=664430631, reconsumeTimes=0, preparedTransactionOffset=0, toString()=Message{topic='SimpleTopic', flag=0, properties={MIN_OFFSET=0, MAX_OFFSET=16, CONSUME_START_TIME=1645671972753, UNIQ_KEY=AC6E005A21AC18B4AAC278D2433E0000, CLUSTER=DefaultCluster}, body=[104, 101, 108, 108, 111, 44, 32, -24, -65, -103, -26, -104, -81, -25, -84, -84, 49, -26, -99, -95, -27, -112, -116, -26, -83, -91, -26, -74, -120, -26, -127, -81], transactionId='null'}]---消息内容为：hello, 这是第1条同步消息
消费者接收到消息: MessageExt [brokerName=broker-a, queueId=1, storeSize=198, queueOffset=6, sysFlag=0, bornTimestamp=1645671845722, bornHost=/10.0.90.115:55832, storeTimestamp=1645671842960, storeHost=/10.0.90.86:10911, msgId=0A005A5600002A9F00000000000018CF, commitLogOffset=6351, bodyCRC=540691780, reconsumeTimes=0, preparedTransactionOffset=0, toString()=Message{topic='SimpleTopic', flag=0, properties={MIN_OFFSET=0, MAX_OFFSET=12, CONSUME_START_TIME=1645671972753, UNIQ_KEY=AC6E005A21AC18B4AAC278D243590002, CLUSTER=DefaultCluster}, body=[104, 101, 108, 108, 111, 44, 32, -24, -65, -103, -26, -104, -81, -25, -84, -84, 51, -26, -99, -95, -27, -112, -116, -26, -83, -91, -26, -74, -120, -26, -127, -81], transactionId='null'}]---消息内容为：hello, 这是第3条同步消息
消费者接收到消息: MessageExt [brokerName=broker-a, queueId=1, storeSize=198, queueOffset=8, sysFlag=0, bornTimestamp=1645671877688, bornHost=/10.0.90.115:55883, storeTimestamp=1645671874910, storeHost=/10.0.90.86:10911, msgId=0A005A5600002A9F00000000000022DE, commitLogOffset=8926, bodyCRC=1210891761, reconsumeTimes=0, preparedTransactionOffset=0, toString()=Message{topic='SimpleTopic', flag=0, properties={MIN_OFFSET=0, MAX_OFFSET=12, CONSUME_START_TIME=1645671972758, UNIQ_KEY=AC6E005A34E818B4AAC278D2C0360005, CLUSTER=DefaultCluster}, body=[104, 101, 108, 108, 111, 44, 32, -24, -65, -103, -26, -104, -81, -25, -84, -84, 54, -26, -99, -95, -27, -68, -126, -26, -83, -91, -26, -74, -120, -26, -127, -81], transactionId='null'}]---消息内容为：hello, 这是第6条异步消息
消费者接收到消息: MessageExt [brokerName=broker-a, queueId=1, storeSize=198, queueOffset=7, sysFlag=0, bornTimestamp=1645671845750, bornHost=/10.0.90.115:55832, storeTimestamp=1645671842988, storeHost=/10.0.90.86:10911, msgId=0A005A5600002A9F0000000000001BE7, commitLogOffset=7143, bodyCRC=1946878403, reconsumeTimes=0, preparedTransactionOffset=0, toString()=Message{topic='SimpleTopic', flag=0, properties={MIN_OFFSET=0, MAX_OFFSET=12, CONSUME_START_TIME=1645671972758, UNIQ_KEY=AC6E005A21AC18B4AAC278D243760006, CLUSTER=DefaultCluster}, body=[104, 101, 108, 108, 111, 44, 32, -24, -65, -103, -26, -104, -81, -25, -84, -84, 55, -26, -99, -95, -27, -112, -116, -26, -83, -91, -26, -74, -120, -26, -127, -81], transactionId='null'}]---消息内容为：hello, 这是第7条同步消息
消费者接收到消息: MessageExt [brokerName=broker-a, queueId=1, storeSize=198, queueOffset=10, sysFlag=0, bornTimestamp=1645671950029, bornHost=/10.0.90.115:55961, storeTimestamp=1645671947077, storeHost=/10.0.90.86:10911, msgId=0A005A5600002A9F0000000000002849, commitLogOffset=10313, bodyCRC=1703581058, reconsumeTimes=0, preparedTransactionOffset=0, toString()=Message{topic='SimpleTopic', flag=0, properties={MIN_OFFSET=0, MAX_OFFSET=12, CONSUME_START_TIME=1645671972759, UNIQ_KEY=AC6E005A2DA818B4AAC278D3DACD0002, CLUSTER=DefaultCluster}, body=[104, 101, 108, 108, 111, 44, 32, -24, -65, -103, -26, -104, -81, -25, -84, -84, 51, -26, -99, -95, -27, -115, -107, -27, -112, -111, -26, -74, -120, -26, -127, -81], transactionId='null'}]---消息内容为：hello, 这是第3条单向消息
消费者接收到消息: MessageExt [brokerName=broker-a, queueId=1, storeSize=198, queueOffset=9, sysFlag=0, bornTimestamp=1645671877687, bornHost=/10.0.90.115:55883, storeTimestamp=1645671874912, storeHost=/10.0.90.86:10911, msgId=0A005A5600002A9F0000000000002531, commitLogOffset=9521, bodyCRC=1715743840, reconsumeTimes=0, preparedTransactionOffset=0, toString()=Message{topic='SimpleTopic', flag=0, properties={MIN_OFFSET=0, MAX_OFFSET=12, CONSUME_START_TIME=1645671972759, UNIQ_KEY=AC6E005A34E818B4AAC278D2C0350004, CLUSTER=DefaultCluster}, body=[104, 101, 108, 108, 111, 44, 32, -24, -65, -103, -26, -104, -81, -25, -84, -84, 55, -26, -99, -95, -27, -68, -126, -26, -83, -91, -26, -74, -120, -26, -127, -81], transactionId='null'}]---消息内容为：hello, 这是第7条异步消息
消费者接收到消息: MessageExt [brokerName=broker-a, queueId=0, storeSize=198, queueOffset=11, sysFlag=0, bornTimestamp=1645671877688, bornHost=/10.0.90.115:55883, storeTimestamp=1645671874881, storeHost=/10.0.90.86:10911, msgId=0A005A5600002A9F0000000000001FC6, commitLogOffset=8134, bodyCRC=903169412, reconsumeTimes=0, preparedTransactionOffset=0, toString()=Message{topic='SimpleTopic', flag=0, properties={MIN_OFFSET=0, MAX_OFFSET=16, CONSUME_START_TIME=1645671972760, UNIQ_KEY=AC6E005A34E818B4AAC278D2C0350000, CLUSTER=DefaultCluster}, body=[104, 101, 108, 108, 111, 44, 32, -24, -65, -103, -26, -104, -81, -25, -84, -84, 49, -26, -99, -95, -27, -68, -126, -26, -83, -91, -26, -74, -120, -26, -127, -81], transactionId='null'}]---消息内容为：hello, 这是第1条异步消息
消费者接收到消息: MessageExt [brokerName=broker-a, queueId=0, storeSize=198, queueOffset=12, sysFlag=0, bornTimestamp=1645671877687, bornHost=/10.0.90.115:55883, storeTimestamp=1645671874911, storeHost=/10.0.90.86:10911, msgId=0A005A5600002A9F000000000000246B, commitLogOffset=9323, bodyCRC=846553319, reconsumeTimes=0, preparedTransactionOffset=0, toString()=Message{topic='SimpleTopic', flag=0, properties={MIN_OFFSET=0, MAX_OFFSET=16, CONSUME_START_TIME=1645671972760, UNIQ_KEY=AC6E005A34E818B4AAC278D2C0360007, CLUSTER=DefaultCluster}, body=[104, 101, 108, 108, 111, 44, 32, -24, -65, -103, -26, -104, -81, -25, -84, -84, 51, -26, -99, -95, -27, -68, -126, -26, -83, -91, -26, -74, -120, -26, -127, -81], transactionId='null'}]---消息内容为：hello, 这是第3条异步消息
消费者接收到消息: MessageExt [brokerName=broker-a, queueId=0, storeSize=198, queueOffset=13, sysFlag=0, bornTimestamp=1645671950029, bornHost=/10.0.90.115:55961, storeTimestamp=1645671947074, storeHost=/10.0.90.86:10911, msgId=0A005A5600002A9F0000000000002783, commitLogOffset=10115, bodyCRC=1273103379, reconsumeTimes=0, preparedTransactionOffset=0, toString()=Message{topic='SimpleTopic', flag=0, properties={MIN_OFFSET=0, MAX_OFFSET=16, CONSUME_START_TIME=1645671972760, UNIQ_KEY=AC6E005A2DA818B4AAC278D3DACD0001, CLUSTER=DefaultCluster}, body=[104, 101, 108, 108, 111, 44, 32, -24, -65, -103, -26, -104, -81, -25, -84, -84, 50, -26, -99, -95, -27, -115, -107, -27, -112, -111, -26, -74, -120, -26, -127, -81], transactionId='null'}]---消息内容为：hello, 这是第2条单向消息
消费者接收到消息: MessageExt [brokerName=broker-a, queueId=0, storeSize=198, queueOffset=14, sysFlag=0, bornTimestamp=1645671950029, bornHost=/10.0.90.115:55961, storeTimestamp=1645671947079, storeHost=/10.0.90.86:10911, msgId=0A005A5600002A9F0000000000002A9B, commitLogOffset=10907, bodyCRC=533940372, reconsumeTimes=0, preparedTransactionOffset=0, toString()=Message{topic='SimpleTopic', flag=0, properties={MIN_OFFSET=0, MAX_OFFSET=16, CONSUME_START_TIME=1645671972760, UNIQ_KEY=AC6E005A2DA818B4AAC278D3DACD0005, CLUSTER=DefaultCluster}, body=[104, 101, 108, 108, 111, 44, 32, -24, -65, -103, -26, -104, -81, -25, -84, -84, 54, -26, -99, -95, -27, -115, -107, -27, -112, -111, -26, -74, -120, -26, -127, -81], transactionId='null'}]---消息内容为：hello, 这是第6条单向消息
消费者接收到消息: MessageExt [brokerName=broker-a, queueId=0, storeSize=199, queueOffset=15, sysFlag=0, bornTimestamp=1645671950030, bornHost=/10.0.90.115:55961, storeTimestamp=1645671947084, storeHost=/10.0.90.86:10911, msgId=0A005A5600002A9F0000000000002DB3, commitLogOffset=11699, bodyCRC=1006911424, reconsumeTimes=0, preparedTransactionOffset=0, toString()=Message{topic='SimpleTopic', flag=0, properties={MIN_OFFSET=0, MAX_OFFSET=16, CONSUME_START_TIME=1645671972760, UNIQ_KEY=AC6E005A2DA818B4AAC278D3DACE0009, CLUSTER=DefaultCluster}, body=[104, 101, 108, 108, 111, 44, 32, -24, -65, -103, -26, -104, -81, -25, -84, -84, 49, 48, -26, -99, -95, -27, -115, -107, -27, -112, -111, -26, -74, -120, -26, -127, -81], transactionId='null'}]---消息内容为：hello, 这是第10条单向消息
消费者接收到消息: MessageExt [brokerName=broker-a, queueId=2, storeSize=198, queueOffset=12, sysFlag=0, bornTimestamp=1645671877687, bornHost=/10.0.90.115:55883, storeTimestamp=1645671874893, storeHost=/10.0.90.86:10911, msgId=0A005A5600002A9F0000000000002152, commitLogOffset=8530, bodyCRC=1756253018, reconsumeTimes=0, preparedTransactionOffset=0, toString()=Message{topic='SimpleTopic', flag=0, properties={MIN_OFFSET=0, MAX_OFFSET=17, CONSUME_START_TIME=1645671972761, UNIQ_KEY=AC6E005A34E818B4AAC278D2C0350002, CLUSTER=DefaultCluster}, body=[104, 101, 108, 108, 111, 44, 32, -24, -65, -103, -26, -104, -81, -25, -84, -84, 56, -26, -99, -95, -27, -68, -126, -26, -83, -91, -26, -74, -120, -26, -127, -81], transactionId='null'}]---消息内容为：hello, 这是第8条异步消息
消费者接收到消息: MessageExt [brokerName=broker-a, queueId=0, storeSize=199, queueOffset=10, sysFlag=0, bornTimestamp=1645671845769, bornHost=/10.0.90.115:55832, storeTimestamp=1645671843007, storeHost=/10.0.90.86:10911, msgId=0A005A5600002A9F0000000000001E39, commitLogOffset=7737, bodyCRC=2041898758, reconsumeTimes=0, preparedTransactionOffset=0, toString()=Message{topic='SimpleTopic', flag=0, properties={MIN_OFFSET=0, MAX_OFFSET=16, CONSUME_START_TIME=1645671972759, UNIQ_KEY=AC6E005A21AC18B4AAC278D243890009, CLUSTER=DefaultCluster}, body=[104, 101, 108, 108, 111, 44, 32, -24, -65, -103, -26, -104, -81, -25, -84, -84, 49, 48, -26, -99, -95, -27, -112, -116, -26, -83, -91, -26, -74, -120, -26, -127, -81], transactionId='null'}]---消息内容为：hello, 这是第10条同步消息
消费者接收到消息: MessageExt [brokerName=broker-a, queueId=0, storeSize=198, queueOffset=9, sysFlag=0, bornTimestamp=1645671845742, bornHost=/10.0.90.115:55832, storeTimestamp=1645671842982, storeHost=/10.0.90.86:10911, msgId=0A005A5600002A9F0000000000001B21, commitLogOffset=6945, bodyCRC=1516474450, reconsumeTimes=0, preparedTransactionOffset=0, toString()=Message{topic='SimpleTopic', flag=0, properties={MIN_OFFSET=0, MAX_OFFSET=16, CONSUME_START_TIME=1645671972759, UNIQ_KEY=AC6E005A21AC18B4AAC278D2436E0005, CLUSTER=DefaultCluster}, body=[104, 101, 108, 108, 111, 44, 32, -24, -65, -103, -26, -104, -81, -25, -84, -84, 54, -26, -99, -95, -27, -112, -116, -26, -83, -91, -26, -74, -120, -26, -127, -81], transactionId='null'}]---消息内容为：hello, 这是第6条同步消息
消费者接收到消息: MessageExt [brokerName=broker-a, queueId=1, storeSize=198, queueOffset=11, sysFlag=0, bornTimestamp=1645671950029, bornHost=/10.0.90.115:55961, storeTimestamp=1645671947080, storeHost=/10.0.90.86:10911, msgId=0A005A5600002A9F0000000000002B61, commitLogOffset=11105, bodyCRC=834394373, reconsumeTimes=0, preparedTransactionOffset=0, toString()=Message{topic='SimpleTopic', flag=0, properties={MIN_OFFSET=0, MAX_OFFSET=12, CONSUME_START_TIME=1645671972759, UNIQ_KEY=AC6E005A2DA818B4AAC278D3DACD0006, CLUSTER=DefaultCluster}, body=[104, 101, 108, 108, 111, 44, 32, -24, -65, -103, -26, -104, -81, -25, -84, -84, 55, -26, -99, -95, -27, -115, -107, -27, -112, -111, -26, -74, -120, -26, -127, -81], transactionId='null'}]---消息内容为：hello, 这是第7条单向消息
消费者接收到消息: MessageExt [brokerName=broker-a, queueId=2, storeSize=198, queueOffset=14, sysFlag=0, bornTimestamp=1645671877687, bornHost=/10.0.90.115:55883, storeTimestamp=1645671874912, storeHost=/10.0.90.86:10911, msgId=0A005A5600002A9F00000000000025F7, commitLogOffset=9719, bodyCRC=1187437259, reconsumeTimes=0, preparedTransactionOffset=0, toString()=Message{topic='SimpleTopic', flag=0, properties={MIN_OFFSET=0, MAX_OFFSET=17, CONSUME_START_TIME=1645671972761, UNIQ_KEY=AC6E005A34E818B4AAC278D2C0350001, CLUSTER=DefaultCluster}, body=[104, 101, 108, 108, 111, 44, 32, -24, -65, -103, -26, -104, -81, -25, -84, -84, 57, -26, -99, -95, -27, -68, -126, -26, -83, -91, -26, -74, -120, -26, -127, -81], transactionId='null'}]---消息内容为：hello, 这是第9条异步消息
消费者接收到消息: MessageExt [brokerName=broker-a, queueId=2, storeSize=198, queueOffset=15, sysFlag=0, bornTimestamp=1645671950029, bornHost=/10.0.90.115:55961, storeTimestamp=1645671947077, storeHost=/10.0.90.86:10911, msgId=0A005A5600002A9F000000000000290F, commitLogOffset=10511, bodyCRC=410217975, reconsumeTimes=0, preparedTransactionOffset=0, toString()=Message{topic='SimpleTopic', flag=0, properties={MIN_OFFSET=0, MAX_OFFSET=17, CONSUME_START_TIME=1645671972762, UNIQ_KEY=AC6E005A2DA818B4AAC278D3DACD0003, CLUSTER=DefaultCluster}, body=[104, 101, 108, 108, 111, 44, 32, -24, -65, -103, -26, -104, -81, -25, -84, -84, 52, -26, -99, -95, -27, -115, -107, -27, -112, -111, -26, -74, -120, -26, -127, -81], transactionId='null'}]---消息内容为：hello, 这是第4条单向消息
消费者接收到消息: MessageExt [brokerName=broker-a, queueId=2, storeSize=199, queueOffset=13, sysFlag=0, bornTimestamp=1645671877687, bornHost=/10.0.90.115:55883, storeTimestamp=1645671874910, storeHost=/10.0.90.86:10911, msgId=0A005A5600002A9F00000000000023A4, commitLogOffset=9124, bodyCRC=1811663525, reconsumeTimes=0, preparedTransactionOffset=0, toString()=Message{topic='SimpleTopic', flag=0, properties={MIN_OFFSET=0, MAX_OFFSET=17, CONSUME_START_TIME=1645671972761, UNIQ_KEY=AC6E005A34E818B4AAC278D2C0350003, CLUSTER=DefaultCluster}, body=[104, 101, 108, 108, 111, 44, 32, -24, -65, -103, -26, -104, -81, -25, -84, -84, 49, 48, -26, -99, -95, -27, -68, -126, -26, -83, -91, -26, -74, -120, -26, -127, -81], transactionId='null'}]---消息内容为：hello, 这是第10条异步消息
消费者接收到消息: MessageExt [brokerName=broker-a, queueId=2, storeSize=198, queueOffset=11, sysFlag=0, bornTimestamp=1645671877687, bornHost=/10.0.90.115:55883, storeTimestamp=1645671874882, storeHost=/10.0.90.86:10911, msgId=0A005A5600002A9F000000000000208C, commitLogOffset=8332, bodyCRC=471724406, reconsumeTimes=0, preparedTransactionOffset=0, toString()=Message{topic='SimpleTopic', flag=0, properties={MIN_OFFSET=0, MAX_OFFSET=17, CONSUME_START_TIME=1645671972760, UNIQ_KEY=AC6E005A34E818B4AAC278D2C0370009, CLUSTER=DefaultCluster}, body=[104, 101, 108, 108, 111, 44, 32, -24, -65, -103, -26, -104, -81, -25, -84, -84, 50, -26, -99, -95, -27, -68, -126, -26, -83, -91, -26, -74, -120, -26, -127, -81], transactionId='null'}]---消息内容为：hello, 这是第2条异步消息
消费者接收到消息: MessageExt [brokerName=broker-a, queueId=3, storeSize=198, queueOffset=11, sysFlag=0, bornTimestamp=1645671877687, bornHost=/10.0.90.115:55883, storeTimestamp=1645671874879, storeHost=/10.0.90.86:10911, msgId=0A005A5600002A9F0000000000001F00, commitLogOffset=7936, bodyCRC=1334614162, reconsumeTimes=0, preparedTransactionOffset=0, toString()=Message{topic='SimpleTopic', flag=0, properties={MIN_OFFSET=0, MAX_OFFSET=16, CONSUME_START_TIME=1645671972762, UNIQ_KEY=AC6E005A34E818B4AAC278D2C0360006, CLUSTER=DefaultCluster}, body=[104, 101, 108, 108, 111, 44, 32, -24, -65, -103, -26, -104, -81, -25, -84, -84, 52, -26, -99, -95, -27, -68, -126, -26, -83, -91, -26, -74, -120, -26, -127, -81], transactionId='null'}]---消息内容为：hello, 这是第4条异步消息
消费者接收到消息: MessageExt [brokerName=broker-a, queueId=3, storeSize=198, queueOffset=13, sysFlag=0, bornTimestamp=1645671950022, bornHost=/10.0.90.115:55961, storeTimestamp=1645671947073, storeHost=/10.0.90.86:10911, msgId=0A005A5600002A9F00000000000026BD, commitLogOffset=9917, bodyCRC=1646964961, reconsumeTimes=0, preparedTransactionOffset=0, toString()=Message{topic='SimpleTopic', flag=0, properties={MIN_OFFSET=0, MAX_OFFSET=16, CONSUME_START_TIME=1645671972763, UNIQ_KEY=AC6E005A2DA818B4AAC278D3DAC50000, CLUSTER=DefaultCluster}, body=[104, 101, 108, 108, 111, 44, 32, -24, -65, -103, -26, -104, -81, -25, -84, -84, 49, -26, -99, -95, -27, -115, -107, -27, -112, -111, -26, -74, -120, -26, -127, -81], transactionId='null'}]---消息内容为：hello, 这是第1条单向消息
消费者接收到消息: MessageExt [brokerName=broker-a, queueId=3, storeSize=198, queueOffset=10, sysFlag=0, bornTimestamp=1645671845763, bornHost=/10.0.90.115:55832, storeTimestamp=1645671843002, storeHost=/10.0.90.86:10911, msgId=0A005A5600002A9F0000000000001D73, commitLogOffset=7539, bodyCRC=1418327912, reconsumeTimes=0, preparedTransactionOffset=0, toString()=Message{topic='SimpleTopic', flag=0, properties={MIN_OFFSET=0, MAX_OFFSET=16, CONSUME_START_TIME=1645671972762, UNIQ_KEY=AC6E005A21AC18B4AAC278D243830008, CLUSTER=DefaultCluster}, body=[104, 101, 108, 108, 111, 44, 32, -24, -65, -103, -26, -104, -81, -25, -84, -84, 57, -26, -99, -95, -27, -112, -116, -26, -83, -91, -26, -74, -120, -26, -127, -81], transactionId='null'}]---消息内容为：hello, 这是第9条同步消息
消费者接收到消息: MessageExt [brokerName=broker-a, queueId=3, storeSize=198, queueOffset=9, sysFlag=0, bornTimestamp=1645671845734, bornHost=/10.0.90.115:55832, storeTimestamp=1645671842973, storeHost=/10.0.90.86:10911, msgId=0A005A5600002A9F0000000000001A5B, commitLogOffset=6747, bodyCRC=1940595872, reconsumeTimes=0, preparedTransactionOffset=0, toString()=Message{topic='SimpleTopic', flag=0, properties={MIN_OFFSET=0, MAX_OFFSET=16, CONSUME_START_TIME=1645671972762, UNIQ_KEY=AC6E005A21AC18B4AAC278D243660004, CLUSTER=DefaultCluster}, body=[104, 101, 108, 108, 111, 44, 32, -24, -65, -103, -26, -104, -81, -25, -84, -84, 53, -26, -99, -95, -27, -112, -116, -26, -83, -91, -26, -74, -120, -26, -127, -81], transactionId='null'}]---消息内容为：hello, 这是第5条同步消息
消费者接收到消息: MessageExt [brokerName=broker-a, queueId=2, storeSize=198, queueOffset=16, sysFlag=0, bornTimestamp=1645671950029, bornHost=/10.0.90.115:55961, storeTimestamp=1645671947083, storeHost=/10.0.90.86:10911, msgId=0A005A5600002A9F0000000000002C27, commitLogOffset=11303, bodyCRC=1062321727, reconsumeTimes=0, preparedTransactionOffset=0, toString()=Message{topic='SimpleTopic', flag=0, properties={MIN_OFFSET=0, MAX_OFFSET=17, CONSUME_START_TIME=1645671972764, UNIQ_KEY=AC6E005A2DA818B4AAC278D3DACD0007, CLUSTER=DefaultCluster}, body=[104, 101, 108, 108, 111, 44, 32, -24, -65, -103, -26, -104, -81, -25, -84, -84, 56, -26, -99, -95, -27, -115, -107, -27, -112, -111, -26, -74, -120, -26, -127, -81], transactionId='null'}]---消息内容为：hello, 这是第8条单向消息
消费者接收到消息: MessageExt [brokerName=broker-a, queueId=3, storeSize=198, queueOffset=15, sysFlag=0, bornTimestamp=1645671950029, bornHost=/10.0.90.115:55961, storeTimestamp=1645671947083, storeHost=/10.0.90.86:10911, msgId=0A005A5600002A9F0000000000002CED, commitLogOffset=11501, bodyCRC=288960430, reconsumeTimes=0, preparedTransactionOffset=0, toString()=Message{topic='SimpleTopic', flag=0, properties={MIN_OFFSET=0, MAX_OFFSET=16, CONSUME_START_TIME=1645671972763, UNIQ_KEY=AC6E005A2DA818B4AAC278D3DACD0008, CLUSTER=DefaultCluster}, body=[104, 101, 108, 108, 111, 44, 32, -24, -65, -103, -26, -104, -81, -25, -84, -84, 57, -26, -99, -95, -27, -115, -107, -27, -112, -111, -26, -74, -120, -26, -127, -81], transactionId='null'}]---消息内容为：hello, 这是第9条单向消息
消费者接收到消息: MessageExt [brokerName=broker-a, queueId=3, storeSize=198, queueOffset=14, sysFlag=0, bornTimestamp=1645671950029, bornHost=/10.0.90.115:55961, storeTimestamp=1645671947078, storeHost=/10.0.90.86:10911, msgId=0A005A5600002A9F00000000000029D5, commitLogOffset=10709, bodyCRC=907803750, reconsumeTimes=0, preparedTransactionOffset=0, toString()=Message{topic='SimpleTopic', flag=0, properties={MIN_OFFSET=0, MAX_OFFSET=16, CONSUME_START_TIME=1645671972763, UNIQ_KEY=AC6E005A2DA818B4AAC278D3DACD0004, CLUSTER=DefaultCluster}, body=[104, 101, 108, 108, 111, 44, 32, -24, -65, -103, -26, -104, -81, -25, -84, -84, 53, -26, -99, -95, -27, -115, -107, -27, -112, -111, -26, -74, -120, -26, -127, -81], transactionId='null'}]---消息内容为：hello, 这是第5条单向消息
消费者接收到消息: MessageExt [brokerName=broker-a, queueId=3, storeSize=198, queueOffset=12, sysFlag=0, bornTimestamp=1645671877687, bornHost=/10.0.90.115:55883, storeTimestamp=1645671874904, storeHost=/10.0.90.86:10911, msgId=0A005A5600002A9F0000000000002218, commitLogOffset=8728, bodyCRC=1642334467, reconsumeTimes=0, preparedTransactionOffset=0, toString()=Message{topic='SimpleTopic', flag=0, properties={MIN_OFFSET=0, MAX_OFFSET=16, CONSUME_START_TIME=1645671972763, UNIQ_KEY=AC6E005A34E818B4AAC278D2C0370008, CLUSTER=DefaultCluster}, body=[104, 101, 108, 108, 111, 44, 32, -24, -65, -103, -26, -104, -81, -25, -84, -84, 53, -26, -99, -95, -27, -68, -126, -26, -83, -91, -26, -74, -120, -26, -127, -81], transactionId='null'}]---消息内容为：hello, 这是第5条异步消息
```

以上就是关于RocketMQ的快速示例，包括发送同步消息、异步消息、单向消息三种方式，简单总结一下。

#### 消息发送者步骤：

- 1.创建消息生产者producer，并制定生产者组名
- 2.指定Nameserver地址
- 3.启动producer
- 4.创建消息对象，指定主题Topic、Tag和消息体
- 5.发送消息
- 6.关闭生产者producer

#### 消息消费者步骤：

- 1.创建消费者Consumer，制定消费者组名
- 2.指定Nameserver地址
- 3.订阅主题Topic和Tag
- 4.设置回调函数，处理消息
- 5.启动消费者consumer
