# 09、RocketMQ 实战 - 顺序消息
- 来源：https://ddkk.com/zhuanlan/mq/rocketmq/6/9.html
- 分类：消息队列
- 分组：教程目录
顺序消息是 Apache RocketMQ 提供的一种高级消息类型，支持消费者按照发送消息的先后顺序获取消息，从而实现业务场景中的顺序处理。 相比其他类型消息，顺序消息在发送、存储和投递的处理过程中，更多强调多条消息间的先后顺序关系。顺序消息分为全局顺序消息与分区顺序消息，全局顺序是指某个Topic下的所有消息都要保证顺序；部分顺序消息只要保证每一组消息被顺序消费即可。

- 全局顺序 对于指定的一个 Topic，所有消息按照严格的先入先出（FIFO）的顺序进行发布和消费。 适用场景：性能要求不高，所有的消息严格按照 FIFO 原则进行消息发布和消费的场景
- 分区顺序 对于指定的一个 Topic，所有消息根据 sharding key 进行区块分区。 同一个分区内的消息按照严格的 FIFO 顺序进行发布和消费。 Sharding key 是顺序消息中用来区分不同分区的关键字段，和普通消息的 Key 是完全不同的概念。 适用场景：性能要求高，以 sharding key 作为分区字段，在同一个区块中严格的按照 FIFO 原则进行消息发布和消费的场景。

### 应用场景

在有序事件处理、撮合交易、数据实时增量同步等场景下，异构系统间需要维持强一致的状态同步，上游的事件变更需要按照顺序传递到下游进行处理。在这类场景下使用 Apache RocketMQ 的顺序消息可以有效保证数据传输的顺序性。

##### 典型场景一：撮合交易

以证券、股票交易撮合场景为例，对于出价相同的交易单，坚持按照先出价先交易的原则，下游处理订单的系统需要严格按照出价顺序来处理订单。

##### 典型场景二：数据实时增量同步

普通消息

顺序消息

以数据库变更增量同步场景为例，上游源端数据库按需执行增删改操作，将二进制操作日志作为消息，通过 Apache RocketMQ 传输到下游搜索系统，下游系统按顺序还原消息数据，实现状态数据按序刷新。如果是普通消息则可能会导致状态混乱，和预期操作结果不符，基于顺序消息可以实现下游状态和上游操作结果一致。

### 如何保证消息的顺序性

Apache RocketMQ 的消息的顺序性分为两部分，生产顺序性和消费顺序性。

- **生产顺序性** ：

Apache RocketMQ 通过生产者和服务端的协议保障单个生产者串行地发送消息，并按序存储和持久化。

如需保证消息生产的顺序性，则必须满足以下条件：

**1、** 单一生产者：消息生产的顺序性仅支持单一生产者，不同生产者分布在不同的系统，即使设置相同的消息组，不同生产者之间产生的消息也无法判定其先后顺序；

**2、** 串行发送：ApacheRocketMQ生产者客户端支持多线程安全访问，但如果生产者使用多线程并行发送，则不同线程间产生的消息将无法判定其先后顺序；

满足以上条件的生产者，将顺序消息发送至 Apache RocketMQ 后，会保证设置了同一消息组的消息，按照发送顺序存储在同一队列中。服务端顺序存储逻辑如下：

**1、** 相同消息组的消息按照先后顺序被存储在同一个队列；

**2、** 不同消息组的消息可以混合在同一个队列中，且不保证连续；

如上图所示，消息组1和消息组4的消息混合存储在队列1中， Apache RocketMQ 保证消息组1中的消息G1-M1、G1-M2、G1-M3是按发送顺序存储，且消息组4的消息G4-M1、G4-M2也是按顺序存储，但消息组1和消息组4中的消息不涉及顺序关系。

- **消费顺序性** ：

Apache RocketMQ 通过消费者和服务端的协议保障消息消费严格按照存储的先后顺序来处理。

如需保证消息消费的顺序性，则必须满足以下条件：

**1、** 投递顺序；

Apache RocketMQ 通过客户端SDK和服务端通信协议保障消息按照服务端存储顺序投递，但业务方消费消息时需要严格按照接收---处理---应答的语义处理消息，避免因异步处理导致消息乱序。消费者类型为PushConsumer时， Apache RocketMQ 保证消息按照存储顺序一条一条投递给消费者，若消费者类型为PullConsumer或SimpleConsumer，则消费者有可能一次拉取多条消息。此时，消息消费的顺序性需要由业务方自行保证。

**1、** 有限重试；

Apache RocketMQ 顺序消息投递仅在重试次数限定范围内，即一条消息如果一直重试失败，超过最大重试次数后将不再重试，跳过这条消息消费，不会一直阻塞后续消息处理。

##### 生产顺序性和消费顺序性组合

如果消息需要严格按照先进先出（FIFO）的原则处理，即先发送的先消费、后发送的后消费，则必须要同时满足生产顺序性和消费顺序性。

一般业务场景下，同一个生产者可能对接多个下游消费者，不一定所有的消费者业务都需要顺序消费，您可以将生产顺序性和消费顺序性进行差异化组合，应用于不同的业务场景。例如发送顺序消息，但使用非顺序的并发消费方式来提高吞吐能力。更多组合方式如下表所示：

生产顺序
消费顺序
顺序性效果

设置消息组，保证消息顺序发送。
顺序消费
按照消息组粒度，严格保证消息顺序。 同一消息组内的消息的消费顺序和发送顺序完全一致。

设置消息组，保证消息顺序发送。
并发消费
并发消费，尽可能按时间顺序处理。

未设置消息组，消息乱序发送。
顺序消费
按队列存储粒度，严格顺序。 基于 Apache RocketMQ 本身队列的属性，消费顺序和队列存储的顺序一致，但不保证和发送顺序一致。

未设置消息组，消息乱序发送。
并发消费
并发消费，尽可能按照时间顺序处理。

##### 顺序消息生命周期

- 初始化：消息被生产者构建并完成初始化，待发送到服务端的状态。
- 待消费：消息被发送到服务端，对消费者可见，等待消费者消费的状态。
- 消费中：消息被消费者获取，并按照消费者本地的业务逻辑进行处理的过程。 此时服务端会等待消费者完成消费并提交消费结果，如果一定时间后没有收到消费者的响应，Apache RocketMQ会对消息进行重试处理。
- 消费提交：消费者完成消费处理，并向服务端提交消费结果，服务端标记当前消息已经被处理（包括消费成功和失败）。 Apache RocketMQ 默认支持保留所有消息，此时消息数据并不会立即被删除，只是逻辑标记已消费。消息在保存时间到期或存储空间不足被删除前，消费者仍然可以回溯消息重新消费。
- 消息删除：Apache RocketMQ按照消息保存机制滚动清理最早的消息数据，将消息从物理文件中删除。

### 原理

RocketMQ4.x及之前的版本是将消息通过MessageQueueSelector发送到固定的Message Queue。RocketMQ5.x 顺序消息的顺序关系通过消息组（MessageGroup）判定和识别，发送顺序消息时需要为每条消息设置归属的消息组，相同消息组的多条消息之间遵循先进先出的顺序关系，不同消息组、无消息组的消息之间不涉及顺序性。为了保证顺序消息，不仅要保证生产顺序性，消费顺序性，还要保证存储的顺序性，如果将消息发送到不同的Message Queue，就不能保证顺序消息了。

### 演示

这里为了消除版本之间的差异，生产者和消费者都是同版本。

首先看下RocketMQ4.x及之前版本，修改MqProducer的OldVersionProducer：

```java
 public SendResult send(Message msg, MessageQueueSelector messageQueueSelector, int orderId) throws InterruptedException, RemotingException, MQClientException, MQBrokerException {
  return   producer.send(msg, messageQueueSelector, orderId);
}
```

增加参数有MessageQueueSelector的方法。

```java
@RestController
public class OrderedController {
    @Autowired
    private OldVersionProducer oldVersionProducer;
    @RequestMapping("/sendOrderedMsg")
    public List<SendResult> sendOrderedMsg() throws InterruptedException, RemotingException, MQClientException, MQBrokerException {
        List<SendResult> list = new ArrayList<>();
        for (int i = 0; i < 10; i++) {
            int orderId = i % 4;
            Message msg =
                    new Message("MyTopic", "*", "KEY" + i,
                            ("Hello RocketMQ " + i).getBytes(StandardCharsets.UTF_8));
            SendResult sendResult = oldVersionProducer.send(msg, new MessageQueueSelector() {
                @Override
                public MessageQueue select(List<MessageQueue> mqs, Message msg, Object arg) {
                    Integer id = (Integer) arg;
                    int index = id % mqs.size();
                    return mqs.get(index);
                }
            }, orderId);
            list.add(sendResult);
            System.out.printf("%s%n", sendResult);
        }
        return list;
    }
}
```

发送10条消息，并使索引为0，4，8的消息发送到queueId为0的Queue，索引为1，5，9的消息发送到queueId为1的Queue，索引为2，6的消息发送到queueId为2的Queue，索引是3，7的消息发送到queueId为3的Queue。

修改Mq-Consumer消费者，先关闭其他消费者，在开启OldVersionConsumer类来消费，修改显示消息：

```java
 @Override
public void afterPropertiesSet() throws Exception {
    consumer = new DefaultMQPushConsumer("my-consumer");
    consumer.setNamesrvAddr(namesrv);
   // 设置从之前的消费位置开始消费
    consumer.setConsumeFromWhere(ConsumeFromWhere.CONSUME_FROM_LAST_OFFSET);
    consumer.subscribe(topic, "*");
    consumer.registerMessageListener(new MessageListenerConcurrently() {
        @Override
        public ConsumeConcurrentlyStatus consumeMessage(List<MessageExt> list, ConsumeConcurrentlyContext consumeConcurrentlyContext) {
            log.info("消费消息:{}", getMsg(list));
            return ConsumeConcurrentlyStatus.CONSUME_SUCCESS;
        }
    });
    consumer.start();
}
private List<String> getMsg(List<MessageExt> list) {
    if (list != null && !list.isEmpty()) {
        return list.stream().map(t -> new String(t.getBody(), StandardCharsets.UTF_8)).collect(Collectors.toList());
    }
    return null;
}
```

启动生产者，在启动消费者，访问http://localhost:8001/sendOrderedMsg发送消息，查看消费者控制台：

消息的索引不是全局有序的。但是0，4，8或1，5，9或2，6或3，7都是顺序消费的。也就是比如0，4，8，先消费0，在消费4，在消费8。但是在消费0和消费4之前可能消费了其他消息。

接下来看下RocketMQ5.x的顺序消息。首先创建顺序消息类型的topic，进入rocketMQ的安装目录后进入bin目录：

```java
mqadmin.cmd updateTopic -n 127.0.0.1:9876 -t FIFOTopic -c DefaultCluster -a +message.type=FIFO
```

-tFIFOTopic 指定topic名字是FIFOTopic，-n指定namesrv地址，-c DefaultCluster 指定集群是DefaultCluster，-a +message.type=FIFO指定topic存储顺序消息。

修改生产者MqProducer的MyController：

```java
 @RequestMapping("/sendNewOrderedMsg")
public List<SendReceipt> sendNewOrderedMsg() throws InterruptedException, RemotingException, MQClientException, MQBrokerException, ClientException {
    List<SendReceipt> list = new ArrayList<>();
    MessageBuilder messageBuilder = new MessageBuilderImpl();
    for (int i = 0; i < 10; i++) {
        int orderId = i % 4;
        SendReceipt sendReceipt = producer.send(messageBuilder.setBody(("messageBody" + i).getBytes(StandardCharsets.UTF_8))
                .setTopic("FIFOTopic")
                .setMessageGroup("msgGroup" + orderId)
                .build());
        list.add(sendReceipt);
        System.out.printf("%s%n", sendReceipt);
    }
    return list;
}
```

用MessageGroup来区分消息发送到哪个Message Queue。

修改消费者Mq-Consumer的RocketMq5Consumer类来消费，同时注释其他消费者所在的类。修改RocketMq5Consumer订阅的Topic为FIFOTopic。启动消费者和生产者后，访问http://localhost:8001/sendNewOrderedMsg发送消息。查看消费者控制台：

不是全局有序，但是每个Message Queue的消息都是顺序消费的。和RocketMQ4.x的效果相同。

**注意**：：使用SimpleConsumer消费顺序消息，需要注意的是，同一个MessageGroup的消息，如果前序消息没有消费完成，再次调用Receive是获取不到后续消息的。
