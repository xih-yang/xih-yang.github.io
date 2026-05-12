# 04、RocketMQ 实战 - 生产者(同步,异步,单向消息)
- 来源：https://ddkk.com/zhuanlan/mq/rocketmq/8/4.html
- 分类：消息队列
- 分组：教程目录
## 消息发布之同步,异步消息

### 引入依赖

```java
<!-- https://mvnrepository.com/artifact/org.apache.rocketmq/rocketmq-client -->
<dependency>
    <groupId>org.apache.rocketmq</groupId>
    <artifactId>rocketmq-client</artifactId>
    <version>4.6.0</version>
</dependency>
```

### 发送同步消息

- 这个消息适用于对消息丢失忍受力比较低的,对性能要求没那么高的

```java
public class SynProducer {
    public static void main(String[] args) throws Exception {
        //初始化生产者
        DefaultMQProducer producer = new DefaultMQProducer("producer_group");
        //指定nameServer地址
        producer.setNamesrvAddr("localhost:9876");
        //启动
        producer.start();
        for (int i = 0; i < 100; i++) {
            //创建消息,指定topic,tag和消息体(也可以只指定topic和消息体即可)
            Message msg = new Message("topicList", "tag", ("rocketMQ" + i).getBytes(RemotingHelper.DEFAULT_CHARSET));
            //发送并有result返回,可根据result判断发送是否成功
            SendResult result = producer.send(msg);
            System.out.println(result);
        }
        //关闭
        producer.shutdown();
    }
}
```

### 发送异步消息(性能高,但是可能造成消息丢失)

```java
public class AsyncProducer {
   public static void main(String[] args) throws Exception {
       //初始化生产者
       DefaultMQProducer producer = new DefaultMQProducer("producer_group");
       //指定nameServer地址
       producer.setNamesrvAddr("localhost:9876");
       //启动
       producer.start();
       //
       producer.setRetryTimesWhenSendAsyncFailed(0);
       for (int i = 0; i < 100; i++) {
           //创建消息,指定topic,tag和消息体
           Message msg = new Message("topicList", "tag", ("rocketMQ" + i).getBytes(RemotingHelper.DEFAULT_CHARSET));
           //发送但是没有返回值,需要有一个回调函数,可以在里面的两个方法,做自己业务的处理
            producer.send(msg, new SendCallback() {
                @Override
                public void onSuccess(SendResult sendResult) {
                    System.out.println("send success");
                }
                @Override
                public void onException(Throwable throwable) {
                    System.out.println("send error in"+throwable.getCause());
                }
            });
       }
       //关闭
       producer.shutdown();
   }
}
```

### 单向发送消息

```java
public class OnewayProducer {
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
           //发送单向消息,并没有返回值,无论成功与否,都只发送这次
           producer.sendOneway(msg);
       }
       //关闭
       producer.shutdown();
   }
}
```
