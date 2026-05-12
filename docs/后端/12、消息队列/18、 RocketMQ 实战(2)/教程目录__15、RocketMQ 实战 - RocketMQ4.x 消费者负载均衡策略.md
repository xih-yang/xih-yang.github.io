# 15、RocketMQ 实战 - RocketMQ4.x 消费者负载均衡策略
- 来源：https://ddkk.com/zhuanlan/mq/rocketmq/6/15.html
- 分类：消息队列
- 分组：教程目录
### 一、AllocateMessageQueueAveragely

AllocateMessageQueueAveragely就是默认的负载均衡策略，在上个例子已经演示了，可以在[这里](/zhuanlan/mq/rocketmq/6/14.html)查看。先分配前面的消费者，前面的消费者分配完了才分配后面的消费者。从上个例子三个消费者的例子看到，每个消费者消费的队列id都是连续的。虽然第一个消费者消费了6条消息，但是他们的队列id都是连续的。16条消息，第一个消费者消费的队列id为0到5，第二个消费者消费的队列id为6到10，第三个消费者消费的队列id为11到15。

### 二、AllocateMessageQueueAveragelyByCircle

AllocateMessageQueueAveragelyByCircle是循环平均队列分配算法。比如有5条消息，两个消费者，第一个消费者消费的队列为0，2，4，第二个消费者消费的队列为1，3。从实现可以看出：

```java
 @Override
public List<MessageQueue> allocate(String consumerGroup, String currentCID, List<MessageQueue> mqAll,
    List<String> cidAll) {
    List<MessageQueue> result = new ArrayList<MessageQueue>();
    if (!check(consumerGroup, currentCID, mqAll, cidAll)) {
        return result;
    }
    int index = cidAll.indexOf(currentCID);
    for (int i = index; i < mqAll.size(); i++) {
        if (i % cidAll.size() == index) {
            result.add(mqAll.get(i));
        }
    }
    return result;
}
```

修改消费者的负载均衡策略为AllocateMessageQueueAveragelyByCircle后，分别重启三个消费者，发送16条消息：

分配图如下：

### 三、AllocateMessageQueueByConfig

自定义配置策略。

```java
public class AllocateMessageQueueByConfig extends AbstractAllocateMessageQueueStrategy {
    private List<MessageQueue> messageQueueList;
    @Override
    public List<MessageQueue> allocate(String consumerGroup, String currentCID, List<MessageQueue> mqAll,
        List<String> cidAll) {
        return this.messageQueueList;
    }
    @Override
    public String getName() {
        return "CONFIG";
    }
    public List<MessageQueue> getMessageQueueList() {
        return messageQueueList;
    }
    public void setMessageQueueList(List<MessageQueue> messageQueueList) {
        this.messageQueueList = messageQueueList;
    }
}
```

直接将配置的messageQueueList返回。

### 四、AllocateMessageQueueConsistentHash

AllocateMessageQueueConsistentHash是一致性hash算法选取的队列。一致性hash算法参考https://blog.csdn.net/qq_34679704/article/details/120816037。

启动3个消费者和1个生产者，发送10条消息，查看消费情况：

如果现在关闭消费者A，根据一致性hash算法的原理，原先消费者A消费的队列会全部转到消费者B或消费者C中。关闭消费者A后，重新发送10条消息：

原先消费者A消费的队列会全部转到消费者C中。

### 五、AllocateMessageQueueByMachineRoom

同机房分配策略，将Broker的消息队列分配给同机房的消费者。

### 六、AllocateMachineRoomNearby

AllocateMessageQueueByMachineRoom策略的升级版本，不仅将Broker的消息队列分配给同机房的消费者，还会将剩下的消息队列根据给定的分配策略进行分配给消费者。
