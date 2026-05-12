# 16、RocketMQ 实战 - 幂等
- 来源：https://ddkk.com/zhuanlan/mq/rocketmq/8/16.html
- 分类：消息队列
- 分组：教程目录
## 消费幂等

- 消息队列RocketMQ消费者在接收到消息之后,有必要根据业务的唯一Key对消息做幂等处理的必要性

### 必要性

- 可能出现消息重复的原因
- 发送时消息重复:服务端完成持久化之后宕机,生产者认为持久化失败,重新发送
- 投递时消息重复:服务端在发给消费者之后,消费者返回ack之后,服务端宕机了,认为自己消息投递失败,重复投递
- 负载均衡时消息重复:网络抖动,Broker重启和订阅方应用重启

### 处理方式

- MessageID可能出现冲突,所以不应该吧MessageID作为处理依据,最好由业务唯一性标识作为幂等性的关键依据,可以通过消息Key设置

> Message message = new Message();
>
> message.setKey(“key”);
>
> SendResult sendResult = producer.send(message);

- 订阅方收到消息可以根据消息的key进行幂等处理

```java
consumer.subscribe("topicName",new  MessageListener(){
    public Action consume(Message message, ConsumeContext consumeContext){
      String key =  message.getKey();
    }
});
```
