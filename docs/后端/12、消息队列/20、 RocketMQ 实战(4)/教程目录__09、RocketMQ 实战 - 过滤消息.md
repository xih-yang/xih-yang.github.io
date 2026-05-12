# 09、RocketMQ 实战 - 过滤消息
- 来源：https://ddkk.com/zhuanlan/mq/rocketmq/8/9.html
- 分类：消息队列
- 分组：教程目录
## 过滤消息

大部分我们在同一个topic下面,指定消息的tag就可以划分不同的消息

> DefaultMQPushConsumer consumer = new DefaultMQPushConsumer(“groupName”);
>
> //订阅topic,第二个参数指定的tag
>
> consumer.subscribe(“TopicName”,“TAGA || TAGB || TAGC”);

- 这样子就能接受包含TAGA,TAGB,TAGC的消息.但是限制是一个消息只能有一个tag

### sql基本语法

- rocketMQ能用一些简单的sql语法来支持过滤消息.
- 数值比较,比如 >,>=,
- IS NULL或者IS NOT NULL
- 逻辑符号AND ,OR,NOT
- 常量支持类型为
- 数值,比如 123 ,14
- 字符,比如 ‘acv’,要用单引号包裹起来
- NULL,特殊的常量
- 布尔值,TRUE或FALSE
- 只能使用push模式的消费者才能使用SQL92标准的sql语句
- 生产者

```java
public class DefaultProducer {
    public static void main(String[] args) throws Exception {
        //初始化生产者
        DefaultMQProducer producer = new DefaultMQProducer("producer_group");
        //指定nameServer地址
        producer.setNamesrvAddr("localhost:9876");
        //启动
        producer.start();
        for (int i = 0; i < 100; i++) {
            //创建消息,指定topic,tag和消息体
            Message msg = new Message("topicList", "tag", ("rocketMQ" + i).getBytes(RemotingHelper.DEFAULT_CHARSET));
            //设置属性,可以在消费端进行筛选
            msg.putUserProperty("a",String.valueOf(i));
            //发送并有result返回,可根据result判断发送是否成功
            SendResult result = producer.send(msg);
            System.out.println(result);
        }
        //关闭
        producer.shutdown();
    }
}
```

- 消费者

```java
public class DefaultConsumer {
  public static void main(String[] args) throws Exception {
      //实例化消费者,指定组名
      DefaultMQPushConsumer consumer = new DefaultMQPushConsumer("groupName");
      //指定NameServer地址
      consumer.setNamesrvAddr("localhost:9876");
      //订阅topic,第二个参数过滤消息的一些属性
      consumer.subscribe("TopicName",MessageSelector.bySql("i > 5"));
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
