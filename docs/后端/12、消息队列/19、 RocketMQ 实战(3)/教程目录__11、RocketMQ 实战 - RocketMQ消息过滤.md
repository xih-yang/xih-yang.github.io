# 11、RocketMQ 实战 - RocketMQ消息过滤
- 来源：https://ddkk.com/zhuanlan/mq/rocketmq/7/11.html
- 分类：消息队列
- 分组：教程目录
## 一、概述

RocketMQ的消费者可以根据Tag进行消息过滤，也支持自定义属性过滤。消息过滤目前是在Broker端实现的，优点是减少了对于Consumer无用消息的网络传输，缺点是增加了Broker的负担、而且实现相对复杂。RocketMQ支持两种方式的消息过滤。一种是Tag过滤，另外一种是SQL过滤。下面我们分别介绍一下。

## 二、Tag过滤

在大多数情况下，Tag是个简单而有用的设计，其可以来选择您想要的消息。下面我们通过一个示例演示：

- 1、生产者发送消息

```java
public class MQProducer {
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
        String[] tags = new String[]{"TagA", "TagB", "TagC", "TagD", "TagE"};
        for (int i = 0; i < 10; i++) {
            String tag = tags[i % tags.length];
            String msg = "hello, 这是第" + (i + 1) + "条消息";
            // 创建消息，并指定Topic(主题)，Tag(标签)和消息内容
            Message message = new Message("FilterMessageTopic", tag, msg.getBytes(RemotingHelper.DEFAULT_CHARSET));
            // 发送同步消息到一个Broker，可以通过sendResult返回消息是否成功送达
            SendResult sendResult = mqProducer.send(message);
            System.out.println(sendResult);
        }
        // 如果不再发送消息，关闭Producer实例
        mqProducer.shutdown();
    }
}
```

启动生产者，如下可看到，10条消息成功发送到Broker中。

```java
SendResult [sendStatus=SEND_OK, msgId=AC6E004E14E418B4AAC28D8648020000, offsetMsgId=0A005A5600002A9F000000000000548C, messageQueue=MessageQueue [topic=FilterMessageTopic, brokerName=broker-a, queueId=1], queueOffset=3]
SendResult [sendStatus=SEND_OK, msgId=AC6E004E14E418B4AAC28D8648110001, offsetMsgId=0A005A5600002A9F000000000000555D, messageQueue=MessageQueue [topic=FilterMessageTopic, brokerName=broker-a, queueId=2], queueOffset=3]
SendResult [sendStatus=SEND_OK, msgId=AC6E004E14E418B4AAC28D86481D0002, offsetMsgId=0A005A5600002A9F000000000000562E, messageQueue=MessageQueue [topic=FilterMessageTopic, brokerName=broker-a, queueId=3], queueOffset=3]
SendResult [sendStatus=SEND_OK, msgId=AC6E004E14E418B4AAC28D8648220003, offsetMsgId=0A005A5600002A9F00000000000056FF, messageQueue=MessageQueue [topic=FilterMessageTopic, brokerName=broker-a, queueId=0], queueOffset=2]
SendResult [sendStatus=SEND_OK, msgId=AC6E004E14E418B4AAC28D8648290004, offsetMsgId=0A005A5600002A9F00000000000057D0, messageQueue=MessageQueue [topic=FilterMessageTopic, brokerName=broker-a, queueId=1], queueOffset=4]
SendResult [sendStatus=SEND_OK, msgId=AC6E004E14E418B4AAC28D8648300005, offsetMsgId=0A005A5600002A9F00000000000058A1, messageQueue=MessageQueue [topic=FilterMessageTopic, brokerName=broker-a, queueId=2], queueOffset=4]
SendResult [sendStatus=SEND_OK, msgId=AC6E004E14E418B4AAC28D8648370006, offsetMsgId=0A005A5600002A9F0000000000005972, messageQueue=MessageQueue [topic=FilterMessageTopic, brokerName=broker-a, queueId=3], queueOffset=4]
SendResult [sendStatus=SEND_OK, msgId=AC6E004E14E418B4AAC28D86483D0007, offsetMsgId=0A005A5600002A9F0000000000005A43, messageQueue=MessageQueue [topic=FilterMessageTopic, brokerName=broker-a, queueId=0], queueOffset=3]
SendResult [sendStatus=SEND_OK, msgId=AC6E004E14E418B4AAC28D8648430008, offsetMsgId=0A005A5600002A9F0000000000005B14, messageQueue=MessageQueue [topic=FilterMessageTopic, brokerName=broker-a, queueId=1], queueOffset=5]
SendResult [sendStatus=SEND_OK, msgId=AC6E004E14E418B4AAC28D8648490009, offsetMsgId=0A005A5600002A9F0000000000005BE5, messageQueue=MessageQueue [topic=FilterMessageTopic, brokerName=broker-a, queueId=2], queueOffset=5]
```

- 2、消费者订阅消息

主要是通过mqPushConsumer.subscribe("FilterMessageTopic", "TagA || TagC || TagD") 指定需要订阅的Tag，如果订阅所有Tag的话，则传入*即可。

```java
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
        // 本例中，只订阅Tag为: TagA 、 TagC 、 TagD的消息
        mqPushConsumer.subscribe("FilterMessageTopic", "TagA || TagC || TagD");
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

如下，可看到消费者端接收到6条消息。

```java
消费者接收到消息: MessageExt [brokerName=broker-a, queueId=0, storeSize=209, queueOffset=2, sysFlag=0, bornTimestamp=1646019187746, bornHost=/10.0.90.115:55652, storeTimestamp=1646019187082, storeHost=/10.0.90.86:10911, msgId=0A005A5600002A9F00000000000056FF, commitLogOffset=22271, bodyCRC=1188153005, reconsumeTimes=0, preparedTransactionOffset=0, toString()=Message{topic='FilterMessageTopic', flag=0, properties={MIN_OFFSET=0, MAX_OFFSET=4, CONSUME_START_TIME=1646019218458, UNIQ_KEY=AC6E004E14E418B4AAC28D8648220003, CLUSTER=DefaultCluster, TAGS=TagD}, body=[104, 101, 108, 108, 111, 44, 32, -24, -65, -103, -26, -104, -81, -25, -84, -84, 52, -26, -99, -95, -26, -74, -120, -26, -127, -81], transactionId='null'}]---消息内容为：hello, 这是第4条消息
消费者接收到消息: MessageExt [brokerName=broker-a, queueId=0, storeSize=209, queueOffset=3, sysFlag=0, bornTimestamp=1646019187773, bornHost=/10.0.90.115:55652, storeTimestamp=1646019187109, storeHost=/10.0.90.86:10911, msgId=0A005A5600002A9F0000000000005A43, commitLogOffset=23107, bodyCRC=1559045667, reconsumeTimes=0, preparedTransactionOffset=0, toString()=Message{topic='FilterMessageTopic', flag=0, properties={MIN_OFFSET=0, MAX_OFFSET=4, CONSUME_START_TIME=1646019218458, UNIQ_KEY=AC6E004E14E418B4AAC28D86483D0007, CLUSTER=DefaultCluster, TAGS=TagC}, body=[104, 101, 108, 108, 111, 44, 32, -24, -65, -103, -26, -104, -81, -25, -84, -84, 56, -26, -99, -95, -26, -74, -120, -26, -127, -81], transactionId='null'}]---消息内容为：hello, 这是第8条消息
消费者接收到消息: MessageExt [brokerName=broker-a, queueId=1, storeSize=209, queueOffset=5, sysFlag=0, bornTimestamp=1646019187779, bornHost=/10.0.90.115:55652, storeTimestamp=1646019187115, storeHost=/10.0.90.86:10911, msgId=0A005A5600002A9F0000000000005B14, commitLogOffset=23316, bodyCRC=858737949, reconsumeTimes=0, preparedTransactionOffset=0, toString()=Message{topic='FilterMessageTopic', flag=0, properties={MIN_OFFSET=0, MAX_OFFSET=6, CONSUME_START_TIME=1646019219467, UNIQ_KEY=AC6E004E14E418B4AAC28D8648430008, CLUSTER=DefaultCluster, TAGS=TagD}, body=[104, 101, 108, 108, 111, 44, 32, -24, -65, -103, -26, -104, -81, -25, -84, -84, 57, -26, -99, -95, -26, -74, -120, -26, -127, -81], transactionId='null'}]---消息内容为：hello, 这是第9条消息
消费者接收到消息: MessageExt [brokerName=broker-a, queueId=1, storeSize=209, queueOffset=3, sysFlag=0, bornTimestamp=1646019187715, bornHost=/10.0.90.115:55652, storeTimestamp=1646019187057, storeHost=/10.0.90.86:10911, msgId=0A005A5600002A9F000000000000548C, commitLogOffset=21644, bodyCRC=553127401, reconsumeTimes=0, preparedTransactionOffset=0, toString()=Message{topic='FilterMessageTopic', flag=0, properties={MIN_OFFSET=0, MAX_OFFSET=6, CONSUME_START_TIME=1646019219468, UNIQ_KEY=AC6E004E14E418B4AAC28D8648020000, CLUSTER=DefaultCluster, TAGS=TagA}, body=[104, 101, 108, 108, 111, 44, 32, -24, -65, -103, -26, -104, -81, -25, -84, -84, 49, -26, -99, -95, -26, -74, -120, -26, -127, -81], transactionId='null'}]---消息内容为：hello, 这是第1条消息
消费者接收到消息: MessageExt [brokerName=broker-a, queueId=3, storeSize=209, queueOffset=3, sysFlag=0, bornTimestamp=1646019187741, bornHost=/10.0.90.115:55652, storeTimestamp=1646019187077, storeHost=/10.0.90.86:10911, msgId=0A005A5600002A9F000000000000562E, commitLogOffset=22062, bodyCRC=604888532, reconsumeTimes=0, preparedTransactionOffset=0, toString()=Message{topic='FilterMessageTopic', flag=0, properties={MIN_OFFSET=0, MAX_OFFSET=5, CONSUME_START_TIME=1646019219472, UNIQ_KEY=AC6E004E14E418B4AAC28D86481D0002, CLUSTER=DefaultCluster, TAGS=TagC}, body=[104, 101, 108, 108, 111, 44, 32, -24, -65, -103, -26, -104, -81, -25, -84, -84, 51, -26, -99, -95, -26, -74, -120, -26, -127, -81], transactionId='null'}]---消息内容为：hello, 这是第3条消息
消费者接收到消息: MessageExt [brokerName=broker-a, queueId=2, storeSize=209, queueOffset=4, sysFlag=0, bornTimestamp=1646019187760, bornHost=/10.0.90.115:55652, storeTimestamp=1646019187097, storeHost=/10.0.90.86:10911, msgId=0A005A5600002A9F00000000000058A1, commitLogOffset=22689, bodyCRC=1109661328, reconsumeTimes=0, preparedTransactionOffset=0, toString()=Message{topic='FilterMessageTopic', flag=0, properties={MIN_OFFSET=0, MAX_OFFSET=6, CONSUME_START_TIME=1646019219473, UNIQ_KEY=AC6E004E14E418B4AAC28D8648300005, CLUSTER=DefaultCluster, TAGS=TagA}, body=[104, 101, 108, 108, 111, 44, 32, -24, -65, -103, -26, -104, -81, -25, -84, -84, 54, -26, -99, -95, -26, -74, -120, -26, -127, -81], transactionId='null'}]---消息内容为：hello, 这是第6条消息
```

具体分析如下：

```java
// 消息发送时总共5个Tag
String[] tags = new String[]{"TagA", "TagB", "TagC", "TagD", "TagE"};
// Tag计算方法
tag = i % tags.length = i % 5
```

- 第1条消息，i = 0，消息的标签tag = tags[i % tags.length] = tags[0] = TagA；
- 第2条消息，i = 1，消息的标签tag = tags[i % tags.length] = tags[1] = TagB；
- 第3条消息，i = 2，消息的标签tag = tags[i % tags.length] = tags[2] = TagC；
- 第4条消息，i = 3，消息的标签tag = tags[i % tags.length] = tags[3] = TagD；
- 第5条消息，i = 4，消息的标签tag = tags[i % tags.length] = tags[4] = TagE；
- 第6条消息，i = 5，消息的标签tag = tags[i % tags.length] = tags[0] = TagA；
- 第7条消息，i = 6，消息的标签tag = tags[i % tags.length] = tags[1] = TagB；
- 第8条消息，i = 7，消息的标签tag = tags[i % tags.length] = tags[2] = TagC；
- 第9条消息，i = 8，消息的标签tag = tags[i % tags.length] = tags[3] = TagD；
- 第10条消息，i = 9，消息的标签tag = tags[i % tags.length] = tags[4] = TagE；

因为消费者端只订阅了 TagA 、 TagC 、 TagD的消息，所以对应上面的，消费者端只会收到六条消息，即第1、3、4、6、8、9条消息。

## 三、根据自定义属性进行过滤 (SQL过滤)

通过Tag过滤消息可以很方便地选择您想要的消息，但是对于比较复杂的场合，使用Tag过滤的话可能不太满足条件。在这种情况下，可以使用SQL表达式筛选消息。SQL特性可以通过发送消息时的属性来进行计算。

RocketMQ只定义了一些基本语法来支持这个特性。

- 数值比较，比如：>`，>`=，``，IN；
- IS NULL 或者 IS NOT NULL；
- 逻辑符号 AND，OR，NOT；

常量支持类型为：

- 数值，比如：123，3.1415；
- 字符，比如：'abc'，必须用单引号包裹起来；
- NULL，特殊的常量
- 布尔值，TRUE 或 FALSE

> 注意，只有使用push推送模式的消费者才能用使用SQL92标准的sql语句，pull拉取模式的消费者是不支持这个功能的。

下面我们通过一个示例演示：

- 1、生产者发送消息

生产者发送消息时，通过putUserProperty来设置消息的属性，实际上就是通过一个Map将用户自定义的属性保存到消息的properties属性中。

```java
public class MQProducer {
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
        for (int i = 0; i < 10; i++) {
            String msg = "hello, 这是第" + (i + 1) + "条消息";
            // 创建消息，并指定Topic(主题)，Tag(标签)和消息内容
            Message message = new Message("FilterMessageTopic", "", msg.getBytes(RemotingHelper.DEFAULT_CHARSET));
            // 设置用户的一些自定义属性，本质上就是保存到一个Map中：private Map<String, String> properties
            message.putUserProperty("num", String.valueOf(i));
            message.putUserProperty("info", i % 2 == 0 ? "aaa" : "bbb");
            // 发送同步消息到一个Broker，可以通过sendResult返回消息是否成功送达
            SendResult sendResult = mqProducer.send(message);
            System.out.println(sendResult);
        }
        // 如果不再发送消息，关闭Producer实例
        mqProducer.shutdown();
    }
}
```

```java
SendResult [sendStatus=SEND_OK, msgId=AC6E00924AE418B4AAC28DE709D90000, offsetMsgId=0A005A5600002A9F0000000000006E4E, messageQueue=MessageQueue [topic=FilterMessageTopic, brokerName=broker-a, queueId=2], queueOffset=11]
SendResult [sendStatus=SEND_OK, msgId=AC6E00924AE418B4AAC28DE709EF0001, offsetMsgId=0A005A5600002A9F0000000000006F24, messageQueue=MessageQueue [topic=FilterMessageTopic, brokerName=broker-a, queueId=3], queueOffset=11]
SendResult [sendStatus=SEND_OK, msgId=AC6E00924AE418B4AAC28DE709F50002, offsetMsgId=0A005A5600002A9F0000000000006FFA, messageQueue=MessageQueue [topic=FilterMessageTopic, brokerName=broker-a, queueId=0], queueOffset=9]
SendResult [sendStatus=SEND_OK, msgId=AC6E00924AE418B4AAC28DE709FB0003, offsetMsgId=0A005A5600002A9F00000000000070D0, messageQueue=MessageQueue [topic=FilterMessageTopic, brokerName=broker-a, queueId=1], queueOffset=11]
SendResult [sendStatus=SEND_OK, msgId=AC6E00924AE418B4AAC28DE70A020004, offsetMsgId=0A005A5600002A9F00000000000071A6, messageQueue=MessageQueue [topic=FilterMessageTopic, brokerName=broker-a, queueId=2], queueOffset=12]
SendResult [sendStatus=SEND_OK, msgId=AC6E00924AE418B4AAC28DE70A0C0005, offsetMsgId=0A005A5600002A9F000000000000727C, messageQueue=MessageQueue [topic=FilterMessageTopic, brokerName=broker-a, queueId=3], queueOffset=12]
SendResult [sendStatus=SEND_OK, msgId=AC6E00924AE418B4AAC28DE70A120006, offsetMsgId=0A005A5600002A9F0000000000007352, messageQueue=MessageQueue [topic=FilterMessageTopic, brokerName=broker-a, queueId=0], queueOffset=10]
SendResult [sendStatus=SEND_OK, msgId=AC6E00924AE418B4AAC28DE70A1C0007, offsetMsgId=0A005A5600002A9F0000000000007428, messageQueue=MessageQueue [topic=FilterMessageTopic, brokerName=broker-a, queueId=1], queueOffset=12]
SendResult [sendStatus=SEND_OK, msgId=AC6E00924AE418B4AAC28DE70A210008, offsetMsgId=0A005A5600002A9F00000000000074FE, messageQueue=MessageQueue [topic=FilterMessageTopic, brokerName=broker-a, queueId=2], queueOffset=13]
SendResult [sendStatus=SEND_OK, msgId=AC6E00924AE418B4AAC28DE70A270009, offsetMsgId=0A005A5600002A9F00000000000075D4, messageQueue=MessageQueue [topic=FilterMessageTopic, brokerName=broker-a, queueId=3], queueOffset=13]
```

- 2、消费者消费消息

消费者端使用如下接口指定SQL过滤的语法：

```java
public void subscribe(finalString topic, final MessageSelector messageSelector)
// 用MessageSelector.bySql来使用sql筛选消息 
MessageSelector messageSelector = MessageSelector.bySql("xxxx");
```

```java
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
        // 用MessageSelector.bySql来使用sql筛选消息
        mqPushConsumer.subscribe("FilterMessageTopic", MessageSelector.bySql("(num between 0 and 5 ) and (info = 'aaa')"));
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

我们直接运行消费者，发现启动报错了，如下：

```java
Exception in thread "main" org.apache.rocketmq.client.exception.MQClientException: CODE: 1  DESC: The broker does not support consumer to filter message by SQL92
```

这个错误是由于RocketMQ默认是关闭了属性过滤功能的，如果需要使用该功能，需要开启enablePropertyFilter的属性，将该属性置为true才可以。也就是我们需要在RocketMQ的配置文件中添加如下配置：

> // 开启属性过滤功能
>
> enablePropertyFilter=true

重新启动RocketMQ后，再次运行消费者，如下可看到，消费者接收到三条消息：

```java
消费者接收到消息: MessageExt [brokerName=broker-a, queueId=2, storeSize=214, queueOffset=11, sysFlag=0, bornTimestamp=1646025528795, bornHost=/10.0.90.115:59083, storeTimestamp=1646025527395, storeHost=/10.0.90.86:10911, msgId=0A005A5600002A9F0000000000006E4E, commitLogOffset=28238, bodyCRC=553127401, reconsumeTimes=0, preparedTransactionOffset=0, toString()=Message{topic='FilterMessageTopic', flag=0, properties={MIN_OFFSET=0, MAX_OFFSET=14, num=0, CONSUME_START_TIME=1646025559201, UNIQ_KEY=AC6E00924AE418B4AAC28DE709D90000, CLUSTER=DefaultCluster, info=aaa}, body=[104, 101, 108, 108, 111, 44, 32, -24, -65, -103, -26, -104, -81, -25, -84, -84, 49, -26, -99, -95, -26, -74, -120, -26, -127, -81], transactionId='null'}]---消息内容为：hello, 这是第1条消息
消费者接收到消息: MessageExt [brokerName=broker-a, queueId=0, storeSize=214, queueOffset=9, sysFlag=0, bornTimestamp=1646025528821, bornHost=/10.0.90.115:59083, storeTimestamp=1646025527417, storeHost=/10.0.90.86:10911, msgId=0A005A5600002A9F0000000000006FFA, commitLogOffset=28666, bodyCRC=604888532, reconsumeTimes=0, preparedTransactionOffset=0, toString()=Message{topic='FilterMessageTopic', flag=0, properties={MIN_OFFSET=0, MAX_OFFSET=11, num=2, CONSUME_START_TIME=1646025559201, UNIQ_KEY=AC6E00924AE418B4AAC28DE709F50002, CLUSTER=DefaultCluster, info=aaa}, body=[104, 101, 108, 108, 111, 44, 32, -24, -65, -103, -26, -104, -81, -25, -84, -84, 51, -26, -99, -95, -26, -74, -120, -26, -127, -81], transactionId='null'}]---消息内容为：hello, 这是第3条消息
消费者接收到消息: MessageExt [brokerName=broker-a, queueId=2, storeSize=214, queueOffset=12, sysFlag=0, bornTimestamp=1646025528834, bornHost=/10.0.90.115:59083, storeTimestamp=1646025527433, storeHost=/10.0.90.86:10911, msgId=0A005A5600002A9F00000000000071A6, commitLogOffset=29094, bodyCRC=689155475, reconsumeTimes=0, preparedTransactionOffset=0, toString()=Message{topic='FilterMessageTopic', flag=0, properties={MIN_OFFSET=0, MAX_OFFSET=14, num=4, CONSUME_START_TIME=1646025559201, UNIQ_KEY=AC6E00924AE418B4AAC28DE70A020004, CLUSTER=DefaultCluster, info=aaa}, body=[104, 101, 108, 108, 111, 44, 32, -24, -65, -103, -26, -104, -81, -25, -84, -84, 53, -26, -99, -95, -26, -74, -120, -26, -127, -81], transactionId='null'}]---消息内容为：hello, 这是第5条消息
```

分析：

生产者发送消息的时候，添加了用户自定义属性num、info，通过上述控制台输出消息的properties属性我们也可以看到。num的值其实就是0-9，info的值是偶数的时候为aaa，奇数的时候为bbb。消费者通过MessageSelector.bySql("(num between 0 and 5 ) and (info = 'aaa')")指定的过滤条件是：num在[0,5]之间并且info的值为aaa。因此，同时满足这两个条件的就只有三条消息。
