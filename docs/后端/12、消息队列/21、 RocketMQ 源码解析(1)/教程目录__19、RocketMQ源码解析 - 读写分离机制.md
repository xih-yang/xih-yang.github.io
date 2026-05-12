# 19、RocketMQ源码解析 - 读写分离机制
- 来源：https://ddkk.com/zhuanlan/mq/rocketmq/1/19.html
- 分类：消息队列
- 分组：教程目录
RocketMQ在消息拉取时是如何根据消息消费队列MessageQueue来选择Broker的呢？消息消费队列如图所示：

RocketMQ根据MessageQueue查找Broker地址的唯一依据便是brokerName，从RocketMQ的Broker组织实现来看，同一组Broker(M-S)服务器，其brokerName相同，主服务器的brokerId为0，从服务器的brokerId大于0，那RocketMQ根据brokerName如何定位到哪一台Broker上来呢？

PullAPIWrapper#pullKernelImpl

```java
FindBrokerResult findBrokerResult =
            this.mQClientFactory.findBrokerAddressInSubscribe(mq.getBrokerName(),
                this.recalculatePullFromWhichNode(mq), false);
```

RocketMQ的MQClientInstance类提供了根据brokerName、brokerId查找Broker地址的方法，返回值如图：

MQClientInstance#findBrokerAddressInSubscribe

```java
public FindBrokerResult findBrokerAddressInSubscribe(
        final String brokerName,
        final long brokerId,
        final boolean onlyThisBroker
    ) {
        String brokerAddr = null;
        boolean slave = false;
        boolean found = false;
        HashMap<Long/* brokerId */, String/* address */> map = this.brokerAddrTable.get(brokerName);
        if (map != null && !map.isEmpty()) {
            brokerAddr = map.get(brokerId);
            slave = brokerId != MixAll.MASTER_ID;
            found = brokerAddr != null;
            if (!found && !onlyThisBroker) {
                Entry<Long, String> entry = map.entrySet().iterator().next();
                brokerAddr = entry.getValue();
                slave = entry.getKey() != MixAll.MASTER_ID;
                found = true;
            }
        }
        if (found) {
            return new FindBrokerResult(brokerAddr, slave, findBrokerVersion(brokerName, brokerAddr));
        }
        return null;
    }
```

- brokerName：broker名称；brokerId：brokerId；onlyThisBroker：是否必须返回brokerId的broker对应的服务器信息。
- brokerAddrTable地址缓存表中根据brokerName获取所有的broker信息。brokerAddrTable的存储格式如：brokerName：{brokerId:brokerAddress}。
- 根据brokerId从broker主从缓存表中获取指定broker名称，如果根据brokerId未找到相关条目，此时如果onlyThisBroker为false,则随机返回broker中任意一个Broker，否则返回null。
- 组装FindBrokerResult时，需要设置是否是slave这个属性。如果brokerId=0表示返回的broker是主节点，否则返回的是从节点。

上述方法，根据brokerName是如何获取brokerId的呢？

请看MQClientInstance#recalculatePullFromWhichNode：

```java
public long recalculatePullFromWhichNode(final MessageQueue mq) {
    if (this.isConnectBrokerByUser()) {
        return this.defaultBrokerId;
    }
    AtomicLong suggest = this.pullFromWhichNodeTable.get(mq);
    if (suggest != null) {
        return suggest.get();
    }
    return MixAll.MASTER_ID;
}
```

首先从pullFromWhichNodeTable缓存表中获取该消息消费队列的brokerId，如果找到，则返回，否则返回brokerName的主节点。由此可以看出pullFromWhichNodeTable中存放的是消息队列建议从从哪个Broker服务器拉取消息的缓存表，其存储结构：MessageQueue：AtomicLong，那该信息从何而来呢？

原来消息消费拉取线程PullMessageService根据PullRequest请求从主服务器拉取消息后会返回下一次建议拉取的brokerId，消息消费者线程在收到消息后，会根据主服务器的建议拉取brokerId来更新pullFromWhichNodeTable，消息消费者线程更新pullFromWhichNodeTable的代码如下：

PullAPIWrapper#processPullResult

```java
this.updatePullFromWhichNode(mq, pullResultExt.getSuggestWhichBrokerId());
public void updatePullFromWhichNode(final MessageQueue mq, final long brokerId) {
        AtomicLong suggest = this.pullFromWhichNodeTable.get(mq);
        if (null == suggest) {
            this.pullFromWhichNodeTable.put(mq, new AtomicLong(brokerId));
        } else {
            suggest.set(brokerId);
        }
    }
```

那服务端是如何计算下一次拉取建议从哪台Broker服务器拉取消息呢?

请看：DefaultMessageStore#getMessage

```java
long diff = maxOffsetPy - maxPhyOffsetPulling;
long memory = (long) (StoreUtil.TOTAL_PHYSICAL_MEMORY_SIZE * (this.messageStoreConfig.getAccessMessageInMemoryMaxRatio() / 100.0));
getResult.setSuggestPullingFromSlave(diff > memory);
```

- maxOffsetPy：代表当前主服务器消息存储文件最大偏移量，maxPhyOffsetPulling：此次拉取消息最大偏移量。
- diff：对于PullMessageService线程来说，当前未被拉取到消息消费端的消息长度。
- TOTAL_PHYSICAL_MEMORY_SIZE：RocketMQ所在服务器总内存大小；accessMessageInMemoryMaxRatio：表示RocketMQ所能使用的最大内存比例，超过该内存，消息将被置换出内存；memory表示RocketMQ消息常驻内存的大小，超过该大小，RocketMQ会将旧的消息置换会磁盘。
- 如果diff大于memory,表示当前需要拉取的消息已经超出了常驻内存的大小，表示主服务器繁忙，此时才建议从从服务器拉取。

PullMessageProcessor#processRequest

```java
if (getMessageResult.isSuggestPullingFromSlave()) {
     responseHeader.setSuggestWhichBrokerId(subscriptionGroupConfig.getWhichBrokerWhenConsumeSlowly());
} else {
     responseHeader.setSuggestWhichBrokerId(MixAll.MASTER_ID);
}
```

当GetResult 的 suggestPullingFromSlave 为真是，将会直接返回消息消费组的配置信息whichBrokerWhenConsumeSlowly，默认为1，可以通过客户端命令updateSubGroup配置当主服务器繁忙时，建议从哪个从服务器读取消息。

> 注意：RocketMQ 读写分离不按套路出牌，并不是主服务器只负责消息发送，消息从服务器主要负责消息拉取，而是只有当主服务器消息拉取出现堆积时才将拉取任务转向从服务器。
