# 14、RocketMQ 实战 - RocketMQ消息重试机制
- 来源：https://ddkk.com/zhuanlan/mq/rocketmq/7/14.html
- 分类：消息队列
- 分组：教程目录
## 一、概述

由于网络抖动、服务宕机等一些不确定的因素，RocketMQ在发送消息的时候很有可能出现消息发送或者消费失败的问题。

Consumer消费消息失败通常可以认为有以下几种情况：

- 由于消息本身的原因，例如反序列化失败，消息数据本身无法处理（例如话费充值，当前消息的手机号被注销，无法充值）等。这种错误通常需要跳过这条消息，再消费其它消息，而这条失败的消息即使立刻重试消费，99%也不成功，所以最好提供一种定时重试机制，即过10秒后再重试。
- 由于依赖的下游应用服务不可用，例如db连接不可用，外系统网络不可达等。遇到这种错误，即使跳过当前失败的消息，消费其他消息同样也会报错。这种情况建议应用sleep 30s，再消费下一条消息，这样可以减轻Broker重试消息的压力。

如果没有消息重试机制，就可能产生消息丢失的问题，这样就会对系统产生较大的影响。**RocketMQ内部封装了消息重试的处理流程，无需开发人员手动处理，并且支持了生产端、消费端两端的重试机制。**

## 二、生产端的消息重试

生产端的消息重试是指：Producer往Broker上发消息没有发送成功，比如网络原因导致生产者发送消息到MQ失败，即发送端没有收到Broker的ACK，导致最终Consumer无法消费消息，此时RocketMQ会自动进行重试。

生产者端的消息重试配置比较简单，只需要在定义生产者的时候，调用**producer.setRetryTimesWhenSendFailed(xxx)**方法设置消息发送失败的最大重试次数。如下：

```java
// 同步发送消息，如果5秒内没有发送成功，则重试3次
DefaultMQProducer producer = new DefaultMQProducer("DefaultProducer");
producer.setRetryTimesWhenSendFailed(3);
producer.send(msg, 5000L);
```

## 三、消费端的消息重试

同样的，由于网络原因，Broker发送消息给消费者后，没有受到消费端的ACK响应，所以Broker又会尝试将消息重新发送给Consumer，在实际开发过程中，我们更应该考虑的是消费端的重试。消费端的消息重试可以分为顺序消息的重试以及无序消息的重试。

- 1、顺序消息的重试

对于顺序消息，当消费者消费消息失败后，消息队列 RocketMQ 会**自动不断进行消息重试（每次间隔时间为 1 秒）** ，这时应用会出现消息消费被阻塞的情况。因此，在使用顺序消息时，务必保证应用能够及时监控并处理消费失败的情况，避免阻塞现象的发生。

- 2、无序消息的重试

对于无序消息（普通、延时、事务消息），当消费者消费消息失败时，可以通过**设置返回状态**达到消息重试的结果。

> 需要注意的是：无序消息的重试只会针对集群消费方式（MessageModel.CLUSTERING）生效；广播方式不提供失败重试特性，即消费失败后，失败的消息不再重试，继续消费新的消息。

## 四、消息重试次数

**RocketMQ 默认允许每条消息最多重试 16 次**，每次重试的间隔时间如下：

第几次重试

与上次重试的间隔时间

第几次重试

与上次重试的间隔时间

1

10 秒

9

7 分钟

2

30 秒

10

8 分钟

3

1 分钟

11

9 分钟

4

2 分钟

12

10 分钟

5

3 分钟

13

20 分钟

6

4 分钟

14

30 分钟

7

5 分钟

15

1 小时

8

6 分钟

16

2 小时

如果消息重试 16 次后仍然失败，消息将不再投递。

> 注意： 一条消息无论重试多少次，这些重试消息的 Message ID 不会改变。所以就需要我们消费者端做好消费幂等操作。

## 五、消息重试配置

集群消费方式下，消息消费失败后期望消息重试，需要在消息监听器接口的实现中明确进行配置（下述三种方式任选一种）：

- **返回 Action.ReconsumeLater （推荐）；**
- **返回 Null；**
- **抛出异常；**

```java
public class MessageListenerImpl implements MessageListener {
    @Override
    public Action consume(Message message, ConsumeContext context) {
        //处理消息
        //.....
        //方式1：返回 Action.ReconsumeLater，消息将重试
        return Action.ReconsumeLater;
        //方式2：返回 null，消息将重试
        return null;
        //方式3：直接抛出异常， 消息将重试
        throw new RuntimeException("消费消息发生异常");
    }
}
```

集群消费方式下，如果希望消息失败后，不进行消息重试，那么我们可以捕获消费逻辑中可能抛出的异常，然后返回Action.CommitMessage，那么这条消息将不会再重试。如下：

```java
public class MessageListenerImpl implements MessageListener {
    @Override
    public Action consume(Message message, ConsumeContext context) {
        try {
            // 消费消息....
        } catch (Throwable e) {
            // 捕获消费逻辑中的所有异常，并返回 Action.CommitMessage;
            return Action.CommitMessage;
        }
        // 消息处理正常，直接返回 Action.CommitMessage;
        return Action.CommitMessage;
    }
}
```

当然，RocketMQ也允许Consumer 启动的时候设置最大重试次数，重试时间间隔将按照如下策略：

- 最大重试次数小于等于 16 次，则重试时间间隔如目录四：消息重试次数的描述；
- 最大重试次数大于 16 次，超过 16 次的重试时间间隔均为每次 2 小时；

```java
Properties properties = new Properties();
//  配置对应 Group ID的最大消息重试次数为 20 次
properties.put(PropertyKeyConst.MaxReconsumeTimes, "20");
Consumer consumer =ONSFactory.createConsumer(properties);
```

注意：

- 消息最大重试次数的设置对相同 Group ID 下的所有 Consumer 实例有效；
- 如果只对相同 Group ID 下两个 Consumer 实例中的其中一个设置了 MaxReconsumeTimes，那么该配置对两个 Consumer 实例均生效；
- 配置采用覆盖的方式生效，即最后启动的 Consumer 实例会覆盖之前的启动实例的配置；

## 六、消息重试原理

RocketMQ会为每个消费者组都设置一个Topic名称为“%RETRY%+consumerGroup”的重试队列（这里需要注意的是，这个**Topic的重试队列是针对消费组，而不是针对每个Topic设置的**），用于暂时保存因为各种异常而导致Consumer端无法消费的消息。

考虑到异常恢复需要一些时间，RocketMQ会为重试队列设置多个重试级别，每个重试级别都有与之对应的重新投递延时，重试次数越多投递延时就越大。RocketMQ对于重试消息的处理是先保存至Topic名称为“SCHEDULE_TOPIC_XXXX”的延迟队列中，后台定时任务按照对应的时间进行Delay后重新保存至“%RETRY%+consumerGroup”的重试队列中。
