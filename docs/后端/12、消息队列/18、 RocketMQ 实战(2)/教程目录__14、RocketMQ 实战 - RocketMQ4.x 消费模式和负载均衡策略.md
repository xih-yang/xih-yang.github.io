# 14、RocketMQ 实战 - RocketMQ4.x 消费模式和负载均衡策略
- 来源：https://ddkk.com/zhuanlan/mq/rocketmq/6/14.html
- 分类：消息队列
- 分组：教程目录
### 消费模式

RocketMQ消费者都是以消费组去消费消息。如果多个消费者设置了相同的Consumer Group，我们认为这些消费者在同一个消费组内。

在Apache RocketMQ4.x 有两种消费模式，分别是：

**集群消费模式**：当使用集群消费模式时，RocketMQ 认为任意一条消息只需要被消费组内的任意一个消费者处理即可。

**广播消费模式**：当使用广播消费模式时，RocketMQ 会将每条消息推送给消费组所有的消费者，保证消息至少被每个消费者消费一次。

集群消费模式适用于每条消息只需要被处理一次的场景，也就是说整个消费组会Topic收到全量的消息，而消费组内的消费分担消费这些消息，因此可以通过扩缩消费者数量，来提升或降低消费能力，具体示例如下图所示，是最常见的消费方式。

广播消费模式适用于每条消息需要被消费组的每个消费者处理的场景，也就是说消费组内的每个消费者都会收到订阅Topic的全量消息，因此即使扩缩消费者数量也无法提升或降低消费能力，具体示例如下图所示。

消费模式由MessageModel 枚举表示：

```java
public enum MessageModel {
    BROADCASTING("BROADCASTING"),
    CLUSTERING("CLUSTERING");
    private String modeCN;
    private MessageModel(String modeCN) {
        this.modeCN = modeCN;
    }
    public String getModeCN() {
        return this.modeCN;
    }
}
```

BROADCASTING是广播模式，CLUSTERING是集群模式。从DefaultMQPushConsumer构造函数可看出DefaultMQPushConsumer默认的消费模式是集群模式。

### 负载均衡策略

集群模式下，同一个消费组内的消费者会分担收到的全量消息，这里的分配策略是怎样的？如果扩容消费者是否一定能提升消费能力？

Apache RocketMQ 提供了多种集群模式下的分配策略，包括平均分配策略、机房优先分配策略、一致性hash分配策略等，可以通过如下代码进行设置相应负载均衡策略：

```java
consumer.setAllocateMessageQueueStrategy(new AllocateMessageQueueAveragely());
```

`默认的分配策略是平均分配`，这也是最常见的策略。平均分配策略下消费组内的消费者会按照类似分页的策略均摊消费。

在平均分配的算法下，可以通过增加消费者的数量来提高消费的并行度。比如下图中，通过增加消费者来提高消费能力。

但也不是一味地增加消费者就能提升消费能力的，比如下图中Topic的总队列数小于消费者的数量时，消费者将分配不到队列，即使消费者再多也无法提升消费能力。

接下来看下平均队列负载均衡策略，首先将OldVersionConsumer的消费策略设置为集群模式

```java
  consumer.setMessageModel(MessageModel.CLUSTERING);
```

新建Topic时默认读写队列各为16个，为了比较，发送消息时发送16条消息。在IDEA中启动两个消费者并发送16条消息：

两个消费者各消费8条数据。

再增加一个消费者，现在有三个消费者，重新发送16条消息：

第一个消费者消费了6条数据，第二个和第三个消费者各消费5条数据。
