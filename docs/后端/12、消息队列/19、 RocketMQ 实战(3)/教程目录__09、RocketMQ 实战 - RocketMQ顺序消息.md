# 09、RocketMQ 实战 - RocketMQ顺序消息
- 来源：https://ddkk.com/zhuanlan/mq/rocketmq/7/9.html
- 分类：消息队列
- 分组：教程目录
## 一、什么是顺序消息？

消息有序指的是，消费者端消费消息时，需按照消息的发送顺序来消费，即先发送的消息，需要先消费(FIFO)。

举个容易理解的例子：通常创建订单后，会经历一系列的操作：【订单创建 -> 订单支付 -> 订单发货 -> 订单配送 -> 订单完成】。在创建完订单后，会发送五条消息到MQ Broker中，消费的时候要按照【订单创建 -> 订单支付 -> 订单发货 -> 订单配送 -> 订单完成】这个顺序去消费，这样的订单才是有效的。

RocketMQ采用**局部顺序一致性**的机制，实现了单个队列中消息的有序性，使用FIFO顺序提供有序消息。简而言之，我们的消息要保证有序，就必须把一组消息存放在同一个队列，然后由Consumer进行逐一消费。

但是如果碰到高并发的情况，消息不就会阻塞了吗？

**RocketMQ给的解决方案是按照业务去划分不同的队列，然后并行消费，提高消息的处理速度的同时避免消息堆积。**

RocketMQ可以严格的保证消息有序，可以分为分区有序或者全局有序。

- 全局有序：全局顺序时使用一个queue；
- 分区有序：局部顺序时多个queue并行消费；

## 二、顺序消息的原理

在默认的情况下，消息发送会采取Round Robin轮询方式把消息发送到不同的queue；而消费消息的时候从多个queue上拉取消息，这种情况发送和消费是不能保证顺序的。但是如果控制发送的顺序消息只依次发送到同一个queue中，消费的时候只从这个queue上依次拉取，则就保证了顺序。当发送和消费参与的queue只有一个，则是全局有序；如果多个queue参与，则为分区有序，即相对每个queue，消息都是有序的。

## 三、全局顺序消息

前面介绍到，全局顺序消息的话，我们需要将所有消息都发送到同一个队列，然后消费者端也订阅同一个队列，这样就能实现顺序消费消息的功能。下面通过一个示例说明如何实现全局顺序消息。

**1、生产者发送消息**

```java
public class OrderMQProducer {
    public static void main(String[] args) throws MQClientException, UnsupportedEncodingException, RemotingException, InterruptedException, MQBrokerException, ExecutionException {
        // 创建DefaultMQProducer类并设定生产者名称
        DefaultMQProducer mqProducer = new DefaultMQProducer("producer-group-test");
        // 设置NameServer地址，如果是集群的话，使用分号;分隔开
        mqProducer.setNamesrvAddr("10.0.90.86:9876");
        // 启动消息生产者
        mqProducer.start();
        for (int i = 0; i < 5; i++) {
            // 创建消息，并指定Topic(主题)，Tag(标签)和消息内容
            Message message = new Message("GLOBAL_ORDER_TOPIC", "", ("全局有序消息" + i).getBytes(RemotingHelper.DEFAULT_CHARSET));
            // 实现MessageQueueSelector，重写select方法，保证消息都进入同一个队列
            // send方法的第一个参数: 需要发送的消息Message
            // send方法的第二个参数: 消息队列选择器MessageQueueSelector
            // send方法的第三个参数: 消息将要进入的队列下标，这里我们指定消息都发送到下标为1的队列
            SendResult sendResult = mqProducer.send(message, new MessageQueueSelector() {
                @Override
                // select方法第一个参数: 指该Topic下有的队列集合
                // 第二个参数: 发送的消息
                // 第三个参数: 消息将要进入的队列下标，它与send方法的第三个参数相同
                public MessageQueue select(List<MessageQueue> mqs, Message msg, Object arg) {
                    return mqs.get((Integer) arg);
                }
            }, 1);
            System.out.println("sendResult = " + sendResult);
        }
        // 如果不再发送消息，关闭Producer实例
        mqProducer.shutdown();
    }
}
```

**2、消费者消费消息**

```java
public class OrderMQConsumer {
    public static void main(String[] args) throws MQClientException {
        // 创建DefaultMQPushConsumer类并设定消费者名称
        DefaultMQPushConsumer mqPushConsumer = new DefaultMQPushConsumer("consumer-group-test");
        // 设置NameServer地址，如果是集群的话，使用分号;分隔开
        mqPushConsumer.setNamesrvAddr("10.0.90.86:9876");
        // 设置Consumer第一次启动是从队列头部开始消费还是队列尾部开始消费
        // 如果不是第一次启动，那么按照上次消费的位置继续消费
        mqPushConsumer.setConsumeFromWhere(ConsumeFromWhere.CONSUME_FROM_FIRST_OFFSET);
        // 订阅一个或者多个Topic，以及Tag来过滤需要消费的消息，如果订阅该主题下的所有tag，则使用*
        mqPushConsumer.subscribe("GLOBAL_ORDER_TOPIC", "*");
        /**
         * 与普通消费一样需要注册消息监听器,但是传入的不再是MessageListenerConcurrently
         * 而是需要传入MessageListenerOrderly的实现子类，并重写consumeMessage方法。
         */
        // 顺序消费同一个队列的消息
        mqPushConsumer.registerMessageListener(new MessageListenerOrderly() {
            @Override
            public ConsumeOrderlyStatus consumeMessage(List<MessageExt> msgs, ConsumeOrderlyContext context) {
                context.setAutoCommit(false);
                for (MessageExt msg : msgs) {
                    System.out.println("消费线程=" + Thread.currentThread().getName() +
                            ", queueId=" + msg.getQueueId() + ", 消息内容:" + new String(msg.getBody()));
                }
                // 标记该消息已经被成功消费
                return ConsumeOrderlyStatus.SUCCESS;
            }
        });
        // 启动消费者实例
        mqPushConsumer.start();
    }
}
```

**3、启动生产者**

如下，可看到，消息成功发送到Broker中，并且可以看到，5条消息选择的queueId都是1。

```java
sendResult = SendResult [sendStatus=SEND_OK, msgId=AC6E009213C818B4AAC28EAB71A70000, offsetMsgId=0A005A5600002A9F00000000000076AB, messageQueue=MessageQueue [topic=GLOBAL_ORDER_TOPIC, brokerName=broker-a, queueId=1], queueOffset=0]
sendResult = SendResult [sendStatus=SEND_OK, msgId=AC6E009213C818B4AAC28EAB71D20001, offsetMsgId=0A005A5600002A9F000000000000776B, messageQueue=MessageQueue [topic=GLOBAL_ORDER_TOPIC, brokerName=broker-a, queueId=1], queueOffset=1]
sendResult = SendResult [sendStatus=SEND_OK, msgId=AC6E009213C818B4AAC28EAB71D80002, offsetMsgId=0A005A5600002A9F000000000000782B, messageQueue=MessageQueue [topic=GLOBAL_ORDER_TOPIC, brokerName=broker-a, queueId=1], queueOffset=2]
sendResult = SendResult [sendStatus=SEND_OK, msgId=AC6E009213C818B4AAC28EAB71DE0003, offsetMsgId=0A005A5600002A9F00000000000078EB, messageQueue=MessageQueue [topic=GLOBAL_ORDER_TOPIC, brokerName=broker-a, queueId=1], queueOffset=3]
sendResult = SendResult [sendStatus=SEND_OK, msgId=AC6E009213C818B4AAC28EAB71E60004, offsetMsgId=0A005A5600002A9F00000000000079AB, messageQueue=MessageQueue [topic=GLOBAL_ORDER_TOPIC, brokerName=broker-a, queueId=1], queueOffset=4]
```

**4、启动消费者**

如下，可看到，消费者也是按照发送消息的顺序消费消息。

```java
消费线程=ConsumeMessageThread_1, queueId=1, 消息内容:全局有序消息0
消费线程=ConsumeMessageThread_1, queueId=1, 消息内容:全局有序消息1
消费线程=ConsumeMessageThread_1, queueId=1, 消息内容:全局有序消息2
消费线程=ConsumeMessageThread_1, queueId=1, 消息内容:全局有序消息3
消费线程=ConsumeMessageThread_1, queueId=1, 消息内容:全局有序消息4
```

## 四、局部顺序消息

下面用订单进行分区有序的示例。一个订单创建完成后，订单的状态流转大概是：【订单创建 -> 订单支付 -> 订单完成】，我们在创建MessageQueueSelector消息队列选择器的时候，需要根据业务唯一标识自定义队列选择算法，如本例中则可以使用orderId订单号去选择队列。这样的话，订单号相同的消息会被先后发送到同一个队列中，消费时，同一个OrderId获取到的肯定是同一个队列。

大体过程如下图：

**1、生产者发送消息**

```java
public class OrderMQProducer {
    public static void main(String[] args) throws MQClientException, UnsupportedEncodingException, RemotingException, InterruptedException, MQBrokerException, ExecutionException {
        // 创建DefaultMQProducer类并设定生产者名称
        DefaultMQProducer mqProducer = new DefaultMQProducer("producer-group-test");
        // 设置NameServer地址，如果是集群的话，使用分号;分隔开
        mqProducer.setNamesrvAddr("10.0.90.86:9876");
        // 启动消息生产者
        mqProducer.start();
        List<Order> orderList = getOrderList();
        for (int i = 0; i < orderList.size(); i++) {
            String body = "【" + orderList.get(i) + "】订单状态变更消息";
            // 创建消息，并指定Topic(主题)，Tag(标签)和消息内容
            Message msg = new Message("ORDER_STATUS_CHANGE", "", body.getBytes(RemotingHelper.DEFAULT_CHARSET));
            // MessageQueueSelector: 消息队列选择器，根据业务唯一标识自定义队列选择算法
            /**
             * msg：消息对象
             * selector：消息队列的选择器
             * arg：选择队列的业务标识,如本例中的orderId
             */
            SendResult sendResult = mqProducer.send(msg, new MessageQueueSelector() {
                /**
                 * @param mqs 队列集合
                 * @param msg 消息对象
                 * @param arg 业务标识的参数，对应send()方法传入的第三个参数arg
                 * @return
                 */
                @Override
                public MessageQueue select(List<MessageQueue> mqs, Message msg, Object arg) {
                    //根据arg(实际上是订单id)选择消息发送的队列
                    long index = (Long) arg % mqs.size();
                    return mqs.get((int) index);
                }
                //mqProducer.send()方法第三个参数, 会传递到select()方法的arg参数
            }, orderList.get(i).getOrderId());
            System.out.println(String.format("消息发送状态:%s, orderId:%s, queueId:%d, body:%s",
                    sendResult.getSendStatus(),
                    orderList.get(i).getOrderId(),
                    sendResult.getMessageQueue().getQueueId(),
                    body));
        }
        // 如果不再发送消息，关闭Producer实例
        mqProducer.shutdown();
    }
    /**
     * 订单状态变更流程: ORDER_CREATE(订单创建) -> ORDER_PAYED(订单已支付) -> ORDER_COMPLETE(订单完成)
     */
    public static List<Order> getOrderList() {
        List<Order> orderList = new ArrayList<>();
        Order orderDemo = new Order();
        orderDemo.setOrderId(1L);
        orderDemo.setOrderStatus("ORDER_CREATE");
        orderList.add(orderDemo);
        orderDemo = new Order();
        orderDemo.setOrderId(2L);
        orderDemo.setOrderStatus("ORDER_CREATE");
        orderList.add(orderDemo);
        orderDemo = new Order();
        orderDemo.setOrderId(1L);
        orderDemo.setOrderStatus("ORDER_PAYED");
        orderList.add(orderDemo);
        orderDemo = new Order();
        orderDemo.setOrderId(2L);
        orderDemo.setOrderStatus("ORDER_PAYED");
        orderList.add(orderDemo);
        orderDemo = new Order();
        orderDemo.setOrderId(2L);
        orderDemo.setOrderStatus("ORDER_COMPLETE");
        orderList.add(orderDemo);
        orderDemo = new Order();
        orderDemo.setOrderId(3L);
        orderDemo.setOrderStatus("ORDER_CREATE");
        orderList.add(orderDemo);
        orderDemo = new Order();
        orderDemo.setOrderId(4L);
        orderDemo.setOrderStatus("ORDER_CREATE");
        orderList.add(orderDemo);
        orderDemo = new Order();
        orderDemo.setOrderId(3L);
        orderDemo.setOrderStatus("ORDER_PAYED");
        orderList.add(orderDemo);
        orderDemo = new Order();
        orderDemo.setOrderId(1L);
        orderDemo.setOrderStatus("ORDER_COMPLETE");
        orderList.add(orderDemo);
        orderDemo = new Order();
        orderDemo.setOrderId(3L);
        orderDemo.setOrderStatus("ORDER_COMPLETE");
        orderList.add(orderDemo);
        orderDemo = new Order();
        orderDemo.setOrderId(4L);
        orderDemo.setOrderStatus("ORDER_PAYED");
        orderList.add(orderDemo);
        orderDemo = new Order();
        orderDemo.setOrderId(4L);
        orderDemo.setOrderStatus("ORDER_COMPLETE");
        orderList.add(orderDemo);
        return orderList;
    }
}
public class Order implements Serializable {
    /**
     * 订单ID
     */
    private Long orderId;
    /**
     * 订单状态
     */
    private String orderStatus;
    public Long getOrderId() {
        return orderId;
    }
    public void setOrderId(Long orderId) {
        this.orderId = orderId;
    }
    public String getOrderStatus() {
        return orderStatus;
    }
    public void setOrderStatus(String orderStatus) {
        this.orderStatus = orderStatus;
    }
    @Override
    public String toString() {
        return "Order{" +
                "orderId=" + orderId +
                ", orderStatus='" + orderStatus + '\'' +
                '}';
    }
}
```

**2、消费者消费消息**

```java
public class OrderMQConsumer {
    public static void main(String[] args) throws MQClientException {
        // 创建DefaultMQPushConsumer类并设定消费者名称
        DefaultMQPushConsumer mqPushConsumer = new DefaultMQPushConsumer("consumer-group-test");
        // 设置NameServer地址，如果是集群的话，使用分号;分隔开
        mqPushConsumer.setNamesrvAddr("10.0.90.86:9876");
        // 设置Consumer第一次启动是从队列头部开始消费还是队列尾部开始消费
        // 如果不是第一次启动，那么按照上次消费的位置继续消费
        mqPushConsumer.setConsumeFromWhere(ConsumeFromWhere.CONSUME_FROM_FIRST_OFFSET);
        // 订阅一个或者多个Topic，以及Tag来过滤需要消费的消息，如果订阅该主题下的所有tag，则使用*
        mqPushConsumer.subscribe("ORDER_STATUS_CHANGE", "*");
        // 注册回调实现类来处理从broker拉取回来的消息
        // 注意：顺序消息注册的是MessageListenerOrderly监听器
        mqPushConsumer.registerMessageListener(new MessageListenerOrderly() {
            @Override
            public ConsumeOrderlyStatus consumeMessage(List<MessageExt> msgList, ConsumeOrderlyContext consumeOrderlyContext) {
                consumeOrderlyContext.setAutoCommit(true);
                for (MessageExt msg : msgList) {
                    // 每个queue有唯一的consume线程来消费, 订单对每个queue都是分区有序
                    System.out.println("消费线程=" + Thread.currentThread().getName() +
                            ", queueId=" + msg.getQueueId() + ", 消息内容:" + new String(msg.getBody()));
                }
                try {
                    TimeUnit.SECONDS.sleep(1);
                } catch (InterruptedException e) {
                    e.printStackTrace();
                }
                // 标记该消息已经被成功消费
                return ConsumeOrderlyStatus.SUCCESS;
            }
        });
        // 启动消费者实例
        mqPushConsumer.start();
    }
}
```

**3、启动生产者**

```java
消息发送状态:SEND_OK, orderId:1, queueId:1, body:【Order{orderId=1, orderStatus='ORDER_CREATE'}】订单状态变更消息
消息发送状态:SEND_OK, orderId:2, queueId:2, body:【Order{orderId=2, orderStatus='ORDER_CREATE'}】订单状态变更消息
消息发送状态:SEND_OK, orderId:1, queueId:1, body:【Order{orderId=1, orderStatus='ORDER_PAYED'}】订单状态变更消息
消息发送状态:SEND_OK, orderId:2, queueId:2, body:【Order{orderId=2, orderStatus='ORDER_PAYED'}】订单状态变更消息
消息发送状态:SEND_OK, orderId:2, queueId:2, body:【Order{orderId=2, orderStatus='ORDER_COMPLETE'}】订单状态变更消息
消息发送状态:SEND_OK, orderId:3, queueId:3, body:【Order{orderId=3, orderStatus='ORDER_CREATE'}】订单状态变更消息
消息发送状态:SEND_OK, orderId:4, queueId:0, body:【Order{orderId=4, orderStatus='ORDER_CREATE'}】订单状态变更消息
消息发送状态:SEND_OK, orderId:3, queueId:3, body:【Order{orderId=3, orderStatus='ORDER_PAYED'}】订单状态变更消息
消息发送状态:SEND_OK, orderId:1, queueId:1, body:【Order{orderId=1, orderStatus='ORDER_COMPLETE'}】订单状态变更消息
消息发送状态:SEND_OK, orderId:3, queueId:3, body:【Order{orderId=3, orderStatus='ORDER_COMPLETE'}】订单状态变更消息
消息发送状态:SEND_OK, orderId:4, queueId:0, body:【Order{orderId=4, orderStatus='ORDER_PAYED'}】订单状态变更消息
消息发送状态:SEND_OK, orderId:4, queueId:0, body:【Order{orderId=4, orderStatus='ORDER_COMPLETE'}】订单状态变更消息
```

**4、启动消费者**

```java
消费线程=ConsumeMessageThread_2, queueId=1, 消息内容:【Order{orderId=1, orderStatus='ORDER_CREATE'}】订单状态变更消息
消费线程=ConsumeMessageThread_1, queueId=2, 消息内容:【Order{orderId=2, orderStatus='ORDER_CREATE'}】订单状态变更消息
消费线程=ConsumeMessageThread_3, queueId=3, 消息内容:【Order{orderId=3, orderStatus='ORDER_CREATE'}】订单状态变更消息
消费线程=ConsumeMessageThread_4, queueId=0, 消息内容:【Order{orderId=4, orderStatus='ORDER_CREATE'}】订单状态变更消息
消费线程=ConsumeMessageThread_2, queueId=1, 消息内容:【Order{orderId=1, orderStatus='ORDER_PAYED'}】订单状态变更消息
消费线程=ConsumeMessageThread_1, queueId=2, 消息内容:【Order{orderId=2, orderStatus='ORDER_PAYED'}】订单状态变更消息
消费线程=ConsumeMessageThread_3, queueId=3, 消息内容:【Order{orderId=3, orderStatus='ORDER_PAYED'}】订单状态变更消息
消费线程=ConsumeMessageThread_4, queueId=0, 消息内容:【Order{orderId=4, orderStatus='ORDER_PAYED'}】订单状态变更消息
消费线程=ConsumeMessageThread_1, queueId=2, 消息内容:【Order{orderId=2, orderStatus='ORDER_COMPLETE'}】订单状态变更消息
消费线程=ConsumeMessageThread_3, queueId=3, 消息内容:【Order{orderId=3, orderStatus='ORDER_COMPLETE'}】订单状态变更消息
消费线程=ConsumeMessageThread_2, queueId=1, 消息内容:【Order{orderId=1, orderStatus='ORDER_COMPLETE'}】订单状态变更消息
消费线程=ConsumeMessageThread_4, queueId=0, 消息内容:【Order{orderId=4, orderStatus='ORDER_COMPLETE'}】订单状态变更消息
```

从上面的结果，我们可以看出来实现了分区有序，即一个线程只完成唯一标识的订单消息。

## 五、顺序消息缺陷

**1、** 消费顺序消息的并行度依赖于队列的数量；

**2、** 队列热点问题，个别队列由于哈希不均导致消息过多，消费速度跟不上，产生消息堆积问题；

**3、** 遇到消息失败的消息，无法跳过，当前队列消费暂停；
