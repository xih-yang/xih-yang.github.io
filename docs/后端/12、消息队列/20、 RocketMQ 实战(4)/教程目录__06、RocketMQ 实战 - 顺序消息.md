# 06、RocketMQ 实战 - 顺序消息
- 来源：https://ddkk.com/zhuanlan/mq/rocketmq/8/6.html
- 分类：消息队列
- 分组：教程目录
## 顺序消息

- 有些消息我们需要保证其消费和生产的顺序,比如选择前几百个送东西,或者做优惠
- 有序分为全局有序和分区有序
- 全局有序就是无论发的是不是同一个分区,我都可以按照你生产的顺序来消费
- 分区有序就只针对发到同一个分区的消息可以顺序消费
- 原理:发送消息时会轮询的发送到不同queue,如果强制吧消息放在同一个queue,这样就是分区有序,

如果是不同queue,就是全局排序

```java
public class sequenceProducer {
   public static void main(String[] args) throws Exception {
       //初始化生产者
       DefaultMQProducer producer = new DefaultMQProducer("producer_group");
       //指定nameServer地址
       producer.setNamesrvAddr("localhost:9876");
       //启动
       producer.start();
       //异步失败重试次数
       producer.setRetryTimesWhenSendAsyncFailed(0);
       for (int i = 0; i < 100; i++) {
           //创建消息,指定topic,tag和消息体
           Message msg = new Message("topicList", "tag", ("rocketMQ" + i).getBytes(RemotingHelper.DEFAULT_CHARSET));
           //发送并有result返回,可根据result判断发送是否成功,第二个参数是队列选择器,第三个参数也就是你传到select里面的Object,也是你可以传递的业务参数
           SendResult result = producer.send(msg, new MessageQueueSelector() {
              // 队列的选择器,我在这里写死了,可以根据大家的业务选择
               @Override
               public MessageQueue select(List<MessageQueue> list, Message message, Object o) {
                   int j = (int)o;//这个就是外面传递进来的i
                   return list.get(1);
               }
           }, i);
           System.out.println(result);
       }
       //关闭
       producer.shutdown();
   }
}
```

### 消费者

```java
public class DefaultConsumer {
    public static void main(String[] args) throws Exception {
        //实例化消费者,指定组名
        DefaultMQPushConsumer consumer = new DefaultMQPushConsumer("groupName");
        //指定NameServer地址
        consumer.setNamesrvAddr("localhost:9876");
        //订阅topic,第二个参数指定的tag
        consumer.subscribe("TopicName","*");
        //注册回调函数,处理消息
        consumer.registerMessageListener(new MessageListenerConcurrently() {
            @Override
            public ConsumeConcurrentlyStatus consumeMessage(List<MessageExt> list, ConsumeConcurrentlyContext consumeConcurrentlyContext) {
                System.out.println(list);
                return ConsumeConcurrentlyStatus.CONSUME_SUCCESS;
            }
        });
        //启动消费者
        consumer.start();
        System.out.println("Consumer start ");
    }
}
```
