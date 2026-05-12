# 07、RocketMQ 实战 - 延时任务
- 来源：https://ddkk.com/zhuanlan/mq/rocketmq/8/7.html
- 分类：消息队列
- 分组：教程目录
## 延时任务

### 延时生产者

- 延时任务无法指定任意时间延迟,只能设置几个固定的延时等级,从1s到2h分别是1到18

```java
public class ScheduledMessageProducer {
    public static void main(String[] args) throws Exception {
        //初始化生产者
        DefaultMQProducer producer = new DefaultMQProducer("producer_group");
        //指定nameServer地址
        producer.setNamesrvAddr("localhost:9876");
        //启动
        producer.start();
        int totalMessagesToSend = 100;
        for (int i = 0; i < totalMessagesToSend; i++) {
            //创建消息,指定topic,tag和消息体
            Message msg = new Message("topicList", "tag", ("rocketMQ" + i).getBytes(RemotingHelper.DEFAULT_CHARSET));
            msg.setDelayTimeLevel(4);
            //发送并有result返回,可根据result判断发送是否成功,第二个参数是队列选择器,第三个参数也就是你传到select里面的Object,也是你可以传递的业务参数
            SendResult result = producer.send(msg);
            System.out.println(result);
        }
        //关闭
        producer.shutdown();
    }
}
```

### 延时消费者

```java
public class ScheduledMessageConsumer {
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
                //和当前时间比较,延时了多久
                for (MessageExt msg : list) {
                    System.out.println(System.currentTimeMillis()-msg.getStoreTimestamp());
                }
                return ConsumeConcurrentlyStatus.CONSUME_SUCCESS;
            }
        });
        //启动消费者
        consumer.start();
        System.out.println("Consumer start ");
    }
}
```
