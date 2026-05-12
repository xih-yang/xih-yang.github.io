# 22、Kafka 实战 - Kafka中Controller，Rebalance，HW，LEO的概念
- 来源：https://ddkk.com/zhuanlan/mq/kafka/3/22.html
- 分类：消息队列
- 分组：教程目录
## Kafka中Controller，Rebalance，HW，LEO的概念

### Controller

- 集群中谁来充当controller

每个broker启动时会向zk创建⼀个临时序号节点，获得的序号最⼩的那个broker将会作为集群中的controller，负责这么⼏件事：

- 当集群中有⼀个副本的leader挂掉，需要在集群中选举出⼀个新的leader，选举的规则是从isr集合中最左边获得。
- 当集群中有broker新增或减少，controller会同步信息给其他broker
- 当集群中有分区新增或减少，controller会同步信息给其他broker

### Rebalance机制

- 前提：消费组中的消费者没有指明分区来消费
- 触发的条件：当消费组中的消费者和分区的关系发⽣变化的时候
- 分区分配的策略：在rebalance之前，分区怎么分配会有这么三种策略
- range：根据公示计算得到每个消费消费哪⼏个分区：前⾯的消费者是分区总数/消费

者数量+1,之后的消费者是分区总数/消费者数量
- 轮询：⼤家轮着来
- sticky：粘合策略，如果需要rebalance，会在之前已分配的基础上调整，不会改变之前的分配情况。如果这个策略没有开，那么就要进⾏全部的重新分配。建议开启。

range

轮询，Sticky

### HW和LEO

- LEO是某个副本最后消息的消息位置（log-end-offset）
- HW是已完成同步的位置。消息在写⼊broker时，且每个broker完成这条消息的同步后，hw才会变化。在这之前消费者是消费不到这条消息的。在同步完成之后，HW更新之后，消费者才能消费到这条消息，这样的⽬的是防⽌消息的丢失。
