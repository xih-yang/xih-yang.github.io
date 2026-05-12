# 12、RocketMQ 实战 - RocketMQ消费幂等
- 来源：https://ddkk.com/zhuanlan/mq/rocketmq/7/12.html
- 分类：消息队列
- 分组：教程目录
## 一、什么是消费幂等？

幂等：如果有一个操作，多次执行与一次执行所产生的影响是相同的，我们就称这个操作是幂等的。

基于上述的概念，结合消息消费的场景，我们能够总结出消息幂等的概念：

> 如果消息重试多次，消费者端对该重复消息消费多次与消费一次的结果是相同的，并且多次消费没有对系统产生副作用，那么我们就称这个过程是消息幂等的。

在互联网应用中，尤其在网络不稳定的情况下，消息很有可能会出现重复发送或重复消费。如果重复的消息可能会影响业务处理，那么就应该对消息做幂等处理。

## 二、消息重复的场景分析

由于网络原因闪断，ACK返回失败等情况出现，不可避免的会发生消息重复的情况。最常见的有下面三种场景：

- **1、生产者发送消息时发生消息重复**

当一条消息已被成功发送到RocketMQ的Broker中，并且Broker已经持久化到磁盘了，此时出现了网络闪断或者生产者宕机现象，导致Broker对生产者应答失败。 如果此时生产者意识到消息发送失败并尝试再次发送消息，消费者后续会收到两条内容相同并且 Message ID 也相同的消息，那么后续Consumer就一定会消费两次该消息。

- **2、消费者消费消息时发生消息重复**

消息已投递到Consumer并完成业务处理，都会向RocketMQ Broker返回ACK确认响应，但是由于网络闪断等原因，可能导致Broker没能成功收到Consumer发送的消费成功ACK响应，此时Broker认为Consumer没能消费成功，为了保证消息至少被消费一次，Broker将在网络恢复后再次尝试投递之前已被处理过的消息，此时消费者就会收到与之前处理过的内容相同、Message ID也相同的消息。

- **3、负载均衡时发生消息重复**

当Broker重启或Consumer重启、扩容或缩容时，都会触发重新负载均衡（Rebalance），此时Consumer去读取Broker中的offset可能还没及时更新，此时Consumer可能会收到曾经被消费过的消息。

可以看到，无论是发送时重复还是消费时重复，最终的效果均为消费者消费时收到了重复的消息，那么我们就知道：只需要在消费者端统一进行幂等处理就能够实现消息幂等。

## 三、如何实现消费幂等？

由于做幂等操作不可避免要产生巨大的开销，RocketMQ 为了追求高性能，本身没有提供消费幂等的特性，它要求我们在业务上进行去重，也就是说自己在消费消息时要做到幂等性。**RocketMQ 虽然不能严格保证不重复，但是正常情况下很少会出现重复发送、消费重复情况，只有网络异常，Consumer 启停等异常情况下会出现消息重复。** 所以消费者在接收到消息以后，有必要根据业务上的唯一 Key 对消息做幂等处理的必要性。

前面介绍到，RocketMQ的消息有消息ID（Message ID）、消息Key（Message Key）两个属性。因为 Message ID 有可能出现冲突（重复）的情况，所以真正安全的幂等处理，**不建议以 Message ID 作为处理依据。 最好的方式是根据业务唯一标识作为幂等处理的关键依据**，而业务的唯一标识可以通过消息Key 进行设置：

```java
Message message = new Message();
// 设置消息的Key
message.setKey("XXX");
mqProducer.send(message);
```

生产者发送消息的时候，消息已经设置了唯一的Message Key，在Consumer消费消息时，可以根据消息的Key 进行幂等处理。

```java
// 根据业务唯一标识Key做幂等处理
mqConsumer.registerMessageListener(new MessageListenerConcurrently() {
    @Override
    public ConsumeConcurrentlyStatus consumeMessage(List<MessageExt> msgs, ConsumeConcurrentlyContext context) {
        for(MessageExt msg : msgs){
            // 获取到消息Key
            String key = msg.getKeys();
            // 伪代码如下：
            // 1. 根据消息key去redis查询是否存在的记录
            Object obj = redis.get(key);
            if (null != obj) {
                logger.info("消息重复消费了");
                // ...
            } else {
                // 2. 从数据库中查询是否存在记录
                MessageLog messageLog = messageService.getByMessageKey(key);
                if (null != messageLog) {
                     logger.info("消息重复消费了");
                     // ...
                } else {
                    // 3. 写redis、DB
                    // 业务处理
                    redis.set(xxx, xxx);
                    messageService.save(xxx);
                }
            }
        }
        return ConsumeConcurrentlyStatus.CONSUME_SUCCESS;
    }
});
```

这里给一个通用性的解决方案 ：**使用数据库 + Redis实现消息消费幂等。**

- 1、Consumer消费消息时，拿到唯一的业务标识---消息Key，然后根据消息Key去Redis缓存中查询是否存在对应的记录，如果存在，则说明本次操作是重复性操作；如果缓存中不存在此Key对应的记录，则执行下一步；
- 2、根据消息Key去数据库中查询是否存在对应的记录，如果存在，则说明本次操作是重复性操作；如果不存在的话，则执行下一步；
- 3、在同一个事务中完成三项操作，保证下面三项操作同时成功，同时失败：

**a、进行业务处理；**

**b、将消息Key通过set(key, value, expireTime)写入到Redis缓存中；**

**c、将消息Key作为数据库表的主键或者唯一键插入到表中；**

关于第二步中再次去从数据库中校验是否存在对应的记录，其实这一步也是有必要的。**由于我们一般都会在缓存使用过程中设置过期时间，如果缓存一旦过期，就可能发生缓存穿透，使请求直接渗透到数据库中，所以我们此时还是要从数据库中再次校验一下**，将二者结合在一起是一个比较好的方案。
