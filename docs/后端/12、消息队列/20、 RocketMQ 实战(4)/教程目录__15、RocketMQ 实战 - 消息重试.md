# 15、RocketMQ 实战 - 消息重试
- 来源：https://ddkk.com/zhuanlan/mq/rocketmq/8/15.html
- 分类：消息队列
- 分组：教程目录
## 消息重试

### 顺序消息的重试

- 对于顺序消息的重试,消费者消费失败之后,mq会不断进行重试(1s一次),这是应用会被阻塞,所以要即时监控并处理消费失败的情况

### 无序消息的重试

- 当消费者消费消息失败时,可以通过设置返回状态达到消息重试的结果,
- 如果是集群消费方式生效,广播方式不提供重试特性

- 重试次数
- 消息队列默认允许没条消息最多重试16次,如果16次后仍然失败,消息将不再投递,
- 无论重试多少次,Message ID不会改变
- 配置方式
- 集群消费方式下,消息消费失败后希望消息重试,需要在消息监听器接口的实现明确进行配置

返回Action.ReconsumeLater
- 返回null
- 抛出异常

```java
   public class MessageListenerImpl implements MessageListener {
       @Override
       public Action consume(Message message, ConsumeContext context) {
           //方法 3：消息处理逻辑抛出异常，消息将重试
           doConsumeMessage(message);
           //方式 1：返回 Action.ReconsumeLater，消息将重试
           return Action.ReconsumeLater;
           //方式 2：返回 null，消息将重试
           return null;
           //方式 3：直接抛出异常，消息将重试
           throw new RuntimeException("Consumer Message exceotion");
       }
   }
```

- 消息失败后,不重试配置方式

集群消费方式下,消息失败后期望消息不重试.需要捕获消费逻辑中可能抛出的异常,返回Action.CommitMessage,就不会再重试了

```java
public class MessageListenerImpl implements MessageListener {
    @Override
    public Action consume(Message message, ConsumeContext context) {
        try {
            doConsumeMessage(message);
        } catch (Throwable e) {
            //捕获消费逻辑中的所有异常，并返回 Action.CommitMessage;
            return Action.CommitMessage;
        }
        //消息处理正常，直接返回 Action.CommitMessage;
        return Action.CommitMessage;
    }
}
```

- 自定义消息最大重试次数
- RocketMQ允许Consumer启动的时候设置最大重试数,重试时间间隔按如下策略

最大重试次数小于等于16次,重试时间间隔和上面一致
- 最大重试次数大于16次,超过16次的每次重试间隔2小时

> Properties properties = new Properties();
>
> //配置对应 Group ID 的最大消息重试次数为 20 次
>
> properties.put(PropertyKeyConst.MaxReconsumeTimes,“20”);
>
> Consumer consumer =ONSFactory.createConsumer(properties);

- 限制

消息最大重试次数的设置对相同GroupID下面的Consumer都生效
- 配置采用覆盖的方式生效,后面启动的consumer会覆盖之前启动的配置

获取消息重试次数

消费者受到消息后,可按照如下方式获取消息的重试次数

```java
public class MessageListenerImpl implements MessageListener {
    @Override
    public Action consume(Message message, ConsumeContext context) {
        //获取消息的重试次数
        System.out.println(message.getReconsumeTimes());
        return Action.CommitMessage;
    }
}
```
