# 29、RocketMQ 实战 - RocketMQ 消息查询
- 来源：https://ddkk.com/zhuanlan/mq/rocketmq/5/29.html
- 分类：消息队列
- 分组：教程目录
## 消息查询介绍

3种消息查询⽅式：

- Message Key 查询：消息的key是业务开发在发送消息之前⾃⾏指定的，通常会把具有业务含义，区分度⾼的字段作为消息的key，如⽤户id，订单id等。
- Unique Key查询：除了业务开发明确的指定消息中的key，RocketMQ⽣产者客户端在发送发送消息之前，会⾃动⽣成⼀个UNIQ_KEY，设置到消息的属性中，从逻辑上唯⼀代表⼀条消息。
- Message Id 查询：Message Id 是消息发送后，在Broker端⽣成的，其包含了Broker的地址，和在CommitLog中的偏移信息，并会将Message Id作为发送结果的⼀部分进⾏返回。Message Id中属于精确匹配，可以唯⼀定位⼀条消息，不需要使⽤哈希索引机制，查询效率更⾼。

> RocketMQ有意弱化Unique Key与Message Id的区别，对外都称之为Message Id。在通过RocketMQ的命令⾏⼯具或管理平台进⾏查询时，⼆者可以通⽤。在根据Unique Key进⾏查询时，本身是有可能查询到多条消息的，但是查询⼯具会进⾏过滤，只会返回⼀条消息。
>
> 业务开发同学在使⽤RocketMQ时，应该养成良好的习惯，在发送/消费消息时，将这些信息记录下来，通常是记录到⽇志⽂件中，以便在出现问题时进⾏排查。

```java
//1 构建消息对象Message
Message msg = new Message();
msg.setTopic("TopicA");
msg.setKeys("Key1");
msg.setBody("message body".getBytes());
try{
//2 发送消息
SendResult result = producer.send(msg);
//3 打印发送结果
System.out.println(result);
}catch (Exception e){
e.printStackTrace();
}
```

事实上，⽤户主动设置的Key以及客户端⾃动⽣成的Unique Key，最终都会设置到Message对象的

properties属性中，如下图所示

其中：
KEYS：表示⽤户通过setKeys⽅法设置的消息key，

UNIQ_KEY：表示客户端⾃动⽣成的Unique Key。

结果中包含Unique Key和Message Id，如下所示：

> SendResult [sendStatus=SEND_OK, msgId=0A1427544F4818B4AAC27DD168880000,
>
> offsetMsgId=0A14275400002A9F00000000001F268E, messageQueue=MessageQueue
>
> [topic=TopicTest, brokerName=broker-a, queueId=2], queueOffset=1173]

其中：

- sendStatus：表示消息发送结果的状态
- msgId：注意这⾥的命名虽然是msgId，但实际上其是Unique Key
- offsetMsgId：Broker返回的Message ID 。在后⽂中，未进⾏特殊说明的情况下，Message ID总

是表示offsetMsgId。
- messageQueue：消息发送到了哪个的队列。
- queueOffset：消息在队列中的偏移量，每次发送到⼀个队列时，offset+1

## 消息查询⼯具

命令⾏⼯具

管理平台

客户端API

### 命令⾏⼯具

```java
$ sh bin/mqadmin
The most commonly used mqadmin commands are:
...
queryMsgById 按照Message Id查询消息
queryMsgByKey 按照Key查询消息
queryMsgByUniqueKey 按照UNIQ_KEY查询消息
...
```

例如，要查询在TopicA中，key为Key-0的消息

这⾥，我们看到输出结果中包含了2条记录。其中：

- Message ID列：这⾥这⼀列的名字显示有问题，实际上其代表的是Unique Key
- QID列：表示队列的ID，注意在RocketMQ中唯⼀地位⼀个队列需要topic+brokerName+queueId。这⾥只显示了queueId，其实并不能知道在哪个Broker上。
- Offset：消息在在队列中的偏移量

在查询到Unique Key之后，我们就可以使⽤另外⼀个命令：queryMsgByUniqueKey，来查询消息的具

体内容。

对于消息体的内容，会存储到Message Body Path字段指定到的路径中。可通过cat命令查看(仅适⽤于

消息体是字符串)：

指定消费者重新消费：

queryMsgByUniqueKey⼦命令还接收另外两个参数：-g参数⽤于指定消费者组名称，-d参数指定消费

者client id。指定了这两个参数之后，消息将由消费者直接消费，⽽不是打印在控制台上。

⾸先，通过consumerStatus命令，查询出消费者组下的client id信息，如：

这⾥显示了消费者组please_rename_unique_group_name下⾯只有⼀个消费者，client id为

**10、** 20.39.84@20820；

接着我们可以在queryMsgByUniqueKey⼦命令中，添加-g和-d参数，如下所示：

可以看到，这⾥并没有打印出消息内容，取⽽代之的是消息消费的结果。

在内部，主要是分为3个步骤来完成让指定消费者来消费这条消息，如下图所示：

第1步：

命令⾏⼯具给所有Broker发起QUERY_MESSAGE请求查询消息，因为并不知道UNIQ_KEY这条消息在哪个Broker上，且最多只会返回⼀条消息，如果超过1条其他会过滤掉；如果查询不到就直接报错。

第2步：

根据消息中包含了Store Host信息，也就是消息存储在哪个Broker上，接来下命令⾏⼯具会直接给这

个Broker发起CONSUME_MESSAGE_DIRECTLY请求，这个请求会携带msgId，group和client id的信息

第3步：

Broker接收到这个请求，查询出消息内容后，主动给消费者发送CONSUME_MESSAGE_DIRECTLY通知请求，注意虽然与第2步使⽤了同⼀个请求码，但不同的是这个请求中包含了消息体的内容，消费者可直接处理。注意：这⾥并不是将消息重新发送到Topic中，否则订阅这个Topic的所有消费者组，都会重新消费这条消息。

### 管理平台

根据Topic时间范围查询：

> 按Topic 查询属于范围查询，不推荐使⽤，因为时间范围内消息很多，不具备区分度。查询时，尽可能设置最为精确的时间区间，以便缩⼩查询范围，提⾼速度。最多返回2000条数据。

根据Message Key查询：

> 按Message Key 查询属于模糊查询，仅适⽤于没有记录 Message ID 但是设置了具有区分度的Message Key的情况。 ⽬前，根据Message Key查询，有⼀个很⼤局限性：不能指定时间范围，且最多返回64条数据。如果⽤户指定的key重复率⽐较⾼的话，就有可能搜不到。

根据Message Id查询：

> 按Message ID 查询属于精确查询，速度快，精确匹配，只会返回⼀条结果，推荐使⽤。在这⾥，传⼊Unique Key，offsetMsgId都可以。

### 客户端API

> 除了通过命令⾏⼯具和管理平台，还可以通过客户端API的⽅式来进⾏查询，这其实是最本质的⽅式，命令⾏⼯具和管理平台的查询功能都是基于此实现。

在org.apache.rocketmq.client.MQAdmin接⼝中，定义了以下⼏个⽅法⽤于消息查询：

> 常⽤的DefaultMQProducer、DefaultMQPushConsumer等，都实现了此接⼝，因此都具备消息查询的能⼒.

```java
public interface MQAdmin {
...
//msgId参数：仅接收SendResult中的offsetMsgId，返回单条消息
MessageExt viewMessage(final String msgId)
//msgId参数：传⼊SendResult中的offsetMsgId、msgId都可以，返回单条消息
MessageExt viewMessage(String topic,String msgId)
//在指定topic下，根据key进⾏查询，并指定最⼤返回条数，以及开始和结束时间
QueryResult queryMessage(final String topic, final String key,
final int maxNum, final long begin,final long end)
...
}
```

在内部，实际上都是基于MQAdminImpl这个类来完成的。

viewMessage⽅法：

两种viewMessage⽅法重载形式，都只会返回单条消息。

```java
//初始化Producer
DefaultMQProducer producer = new
DefaultMQProducer("please_rename_unique_group_name");
// Specify name server addresses.
producer.setNamesrvAddr("localhost:9876");
//Launch the instance.
producer.start();
//根据UniqueKey查询
String uniqueKey = "0A1427544F4818B4AAC27DD168880000";
MessageExt msg = producer.viewMessage("TopicTest", uniqueKey);
//打印结果：这⾥仅输出Unique Key与offsetMsgId
MessageClientExt msgExt= (MessageClientExt) msg;
System.out.println("Unique Key:"+msgExt.getMsgId()//即UNIQUE_KEY
+"\noffsetMsgId:"+msgExt.getOffsetMsgId());
//Shut down once the producer instance is not longer in use.
```

输出结果如下：

> Unique Key:0A1427544F4818B4AAC27DD168880000
>
> offsetMsgId:0A14275400002A9F00000000001F268E

如果我们把offsetMsgId当做⽅法参数传⼊，也可以查询到相同的结果。这是因为，在⽅法内部实际

上是分两步进⾏查询的：

**1、** 先把参数当做offsetMsgId，即MessageId进⾏查询；

**2、** 如果失败，再尝试当做UniqueKey进⾏查询；

源码如下所示：

DefaultMQProducer#viewMessage(String,String)

```java
public MessageExt viewMessage(String topic,
String msgId) throws RemotingException, MQBrokerException,
InterruptedException, MQClientException {
try {
//1 尝试当做offsetMsgId进⾏查询
MessageId oldMsgId = MessageDecoder.decodeMessageId(msgId);
return this.viewMessage(msgId);
} catch (Exception e) {
}
//2 尝试当做UNIQ_KEY进⾏查询
return
this.defaultMQProducerImpl.queryMessageByUniqKey(withNamespace(topic), msgId);
}
```

前⾯提到，Unique Key只是从逻辑上代表⼀条消息，实际上在Broker端可能存储了多条，因此在当做Unique Key进⾏查询时，会进⾏过滤，只取其中⼀条。源码如下所示：

MQAdminImpl#queryMessageByUniqKey

```java
public MessageExt queryMessageByUniqKey(String topic,
String uniqKey) throws InterruptedException, MQClientException {
//根据uniqKey进⾏查询
QueryResult qr = this.queryMessage(topic, uniqKey, 32,
MessageClientIDSetter.getNearlyTimeFromID(uniqKey).getTime() -
1000, Long.MAX_VALUE, true);
//对查询结果进⾏过滤，最多只取⼀条
if (qr != null && qr.getMessageList() != null &&
qr.getMessageList().size() > 0) {
return qr.getMessageList().get(0);
} else {
return null;
}
}
```

## 实现原理

Unqiue Key & Message Key都需要利⽤RocketMQ的哈希索引机制来完成消息查询，Message Id是在Broker端⽣成的，其包含了Broker地址和commit Log offset信息，可以精确匹配⼀条消息，查询消息更好。

Unique Key 是⽣产者发送消息之前，由RocketMQ 客户端⾃动⽣成的。

DefaultMQProducerImpl#sendKernelImpl

```java
private SendResult sendKernelImpl(final Message msg,
final MessageQueue mq,
final CommunicationMode communicationMode,
final SendCallback sendCallback,
final TopicPublishInfo topicPublishInfo,
final long timeout) {
     //省略异常声明
//...略
try {
//如果不是批量消息，则⽣成Unique Key
if (!(msg instanceof MessageBatch)) {
// 设置唯⼀编号
MessageClientIDSetter.setUniqID(msg);
}
//...略
```

MessageClientIDSetter#setUniqID

```java
public static void setUniqID(final Message msg) {
// Unique Key为空的情况下，才进⾏设置
if
(msg.getProperty(MessageConst.PROPERTY_UNIQ_CLIENT_MESSAGE_ID_KEYIDX) == null)
{
msg.putProperty(MessageConst.PROPERTY_UNIQ_CLIENT_MESSAGE_ID_KEYIDX,
createUniqID());
}
}
```

## Unique Key作⽤

了解Unique Key的作⽤对于我们理解消息重复的原因有很⼤的帮助。RocketMQ并不保证消息投递过程中的Exactly Once语义，即消息只会被精确消费⼀次，需要消费者⾃⼰做幂等。⽽通常导致消息重复消费的原因，主要包括：

- ⽣产者发送时消息重复：
- 消费者Rebalance时消息重复：

> 导致⽣产者发送重复消息的原因可能是：⼀条消息已被成功发送到服务端并完成持久化，由于⽹络超时此时出现了⽹络闪断或者客户端宕机，导致服务端对客户端应答失败，此时⽣产者将再次尝试发送消息。
>
> 在重试发送时，sendKernelImpl会被重复调⽤，意味着setUniqID⽅法会被重复调⽤，不过由于setUniqID⽅法实现中进⾏判空处理，因此重复设置Unique Key。在这种情况下，消费者后续会收到两条内容相同并且 Unique Key 也相同的消息(offsetMsgId不同，因为对Broker来说存储了多次)。

那么消费者如何判断，消费重复是因为重复发送还是Rebalance导致的重复消费呢？

消费者实现MessageListener接⼝监听到的消息类型是MessageExt，可以将其强制转换为

MessageClientExt，之后调⽤getMsgId⽅法获取Unique Key，调⽤getOffsetMsgId获得Message Id。

```java
@Override
public ConsumeConcurrentlyStatus consumeMessage(List<MessageExt>
msgs,
ConsumeConcurrentlyContext context) {
for (MessageExt msg:msgs){
MessageClientExt mct = (MessageClientExt)msg;
String uniqueKey = mct.getMsgId();
String messageId = mct.getOffsetMsgId();
}
System.out.printf("%s Receive New Messages: %s %n",
Thread.currentThread().getName(), msgs);
return ConsumeConcurrentlyStatus.CONSUME_SUCCESS;
}
```

## 批量发送模式下的Unique Key

DefaultMQProducer提供了批量发送消息的接⼝：

```java
public SendResult send(Collection<Message> msgs)
```

在内部，这批消息⾸先会被构建成⼀个MessageBatch对象。在前⾯sendKernelImpl⽅法中我们也看到了，对于MessageBatch对象，并不会设置Unique Key。

> 这是因为在将批量消息转换成MessageBatch时，已经设置过了。

⼀个批量消息中每条消息Unique Key是相同的？？？？？？

```java
//Instantiate with a producer group name.
DefaultMQProducer producer = new
DefaultMQProducer("please_rename_unique_group_name");
// Specify name server addresses.
producer.setNamesrvAddr("localhost:9876");
//Launch the instance.
producer.start();
//构建批量消息
ArrayList<Message> msgs = new ArrayList<>();
Message msg1 = new Message("TopicTest",("message3").getBytes());
Message msg2 = new Message("TopicTest",("message4").getBytes());
msgs.add(msg1);
msgs.add(msg2);
//发送
SendResult result = producer.send(msgs);
//打印
System.out.println(result);
```

输出如下所示：

可以看到，此时输出的msgId(即Unique Key)和offsetMsgId都会包含多个值。客户端给批量消息中每条消息设置不同的Unqiue Key，参考DefaultMQProducer#batch()：

```java
private MessageBatch batch(Collection<Message> msgs) throws MQClientException
{
MessageBatch msgBatch;
try {
//1 将消息集合转换为MessageBatch
msgBatch = MessageBatch.generateFromList(msgs);
//2 迭代每个消息，逐⼀设置Unique Key
for (Message message : msgBatch) {
Validators.checkMessage(message, this);
MessageClientIDSetter.setUniqID(message);
}
//3 设置批量消息的消息体
msgBatch.setBody(msgBatch.encode());
} catch (Exception e) {
throw new MQClientException("Failed to initiate the MessageBatch", e);
}
return msgBatch;
}
```

## Message Id

Message Id是在Broker端⽣成的，⽤于唯⼀标识⼀条消息，在根据Message Id查询的情况下，最多只能查询到⼀条消息。

```java
package org.apache.rocketmq.common.message;
import java.net.SocketAddress;
public class MessageId {
private SocketAddress address;
private long offset;
```

并提供了⼀个MessageDecoder对象来创建或者解码MessageId。

```java
public static String createMessageId(final ByteBuffer input,
final ByteBuffer addr, final long offset)
public static MessageId decodeMessageId(final String msgId)
```

Broker端在顺序存储消息时，⾸先会通过createMessageId⽅法创建msgId

CommitLog.DefaultAppendMessageCallback#doAppend

```java
..........................
String msgId;
//3 创建msgId
if ((sysflag & MessageSysFlag.STOREHOSTADDRESS_V6_FLAG) == 0) {
msgId = MessageDecoder.createMessageId(this.msgIdMemory,
msgInner.getStoreHostBytes(storeHostHolder), wroteOffset);
} else {
msgId = MessageDecoder.createMessageId(this.msgIdV6Memory,
msgInner.getStoreHostBytes(storeHostHolder), wroteOffset);
}
```

⽽客户端在根据msgId向Broker查询消息时，⾸先会将通过MessageDecoder的decodeMessageId⽅法，之后直接向这个broker进⾏查询指定位置的消息。

参⻅：MQAdminImpl#viewMessage

```java
public MessageExt viewMessage(
String msgId) throws RemotingException, MQBrokerException,
InterruptedException, MQClientException {
//1 根据msgId解码成MessageId对象
MessageId messageId = null;
try {
messageId = MessageDecoder.decodeMessageId(msgId);
} catch (Exception e) {
throw new MQClientException(ResponseCode.NO_MESSAGE, "query
message by id finished, but no message.");
}
//2 根据MessageId中的Broker地址和commit log offset信息进⾏查询
return
this.mQClientFactory.getMQClientAPIImpl().viewMessage(RemotingUtil.socketAddre
ss2String(messageId.getAddress()),
messageId.getOffset(), timeoutMillis);
}
```

> 由于根据Message Id进⾏查询，实际上是直接从特定Broker的CommitLog中的指定位置进⾏查询的，属于精确匹配，并不像⽤户设置的key，或者Unique Key那么样，需要使⽤到哈希索引机制，因此效率很⾼。

## 总结

- 3种消息查询⽅式：Message Key & Unique Key & Message Id
- 3种消息查询⼯具：命令⾏、管理平台、客户端API，且⽀持将查询到让特定/所有消费者组重新消费
- 屏蔽Unique Key & Message Id区别，很多地⽅⼆者可以通⽤
- Message Key & Unique Key 需要使⽤到哈希索引机制，有额外的索引维护成本
- Message Id由Broker和commit log offset组成，属于精确匹配，查询效率更好
