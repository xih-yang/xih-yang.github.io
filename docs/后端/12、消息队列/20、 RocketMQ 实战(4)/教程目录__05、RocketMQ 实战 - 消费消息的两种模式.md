# 05、RocketMQ 实战 - 消费消息的两种模式
- 来源：https://ddkk.com/zhuanlan/mq/rocketmq/8/5.html
- 分类：消息队列
- 分组：教程目录
## 消费消息的两种模式

### 负载均衡模式(默认)

- 多个消费者采用负载均衡消费,每个消费者处理的消息不同

```java
public class ClusteringConsumer {
   public static void main(String[] args) throws Exception {
       //实例化消费者,指定组名
       DefaultMQPushConsumer consumer = new DefaultMQPushConsumer("groupName");
       //指定NameServer地址
       consumer.setNamesrvAddr("localhost:9876");
       //订阅topic,第二个参数指定的tag
       consumer.subscribe("TopicName","*");
       //指定负载均衡模式
       consumer.setMessageModel(MessageModel.CLUSTERING);
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

### 广播模式

- 多个消费者消费同一条消息

```java
public class BroadcastingConsumer {
  public static void main(String[] args) throws Exception {
      //实例化消费者,指定组名
      DefaultMQPushConsumer consumer = new DefaultMQPushConsumer("groupName");
      //指定NameServer地址
      consumer.setNamesrvAddr("localhost:9876");
      //订阅topic,第二个参数指定的tag
      consumer.subscribe("TopicName","*");
      //指定负载均衡模式
      consumer.setMessageModel(MessageModel.BROADCASTING);
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
