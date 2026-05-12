# 18、Kafka 实战 - Kafka 宕机后不再高可用？探究 Kafka 高可用实现
- 来源：https://ddkk.com/zhuanlan/mq/kafka/7/18.html
- 分类：消息队列
- 分组：教程目录
问题出在了 __consumer_offset 上， __consumer_offset 是一个 Kafka 自动创建的 Topic，用来存储消费者消费的 offset （偏移量）信息，默认 Partition 数为50。而就是这个Topic，它的默认副本数为1。如果所有的 Partition 都存在于同一台机器上，那就是很明显的单点故障了！当将存储 __consumer_offset 的 Partition 的 Broker 给 Kill 后，会发现所有的消费者都停止消费了。

第一点，需要将 __consumer_offset 删除，注意这个Topic时Kafka内置的Topic，无法用命令删除，我是通过将 logs 删了来实现删除。

第二点，需要通过设置 offsets.topic.replication.factor 为3来将 __consumer_offset 的副本数改为3。通过将 __consumer_offset 也做副本冗余后来解决某个节点宕机后消费者的消费问题。

最后，关于为什么 __consumer_offset 的 Partition 会出现只存储在一个 Broker 上而不是分布在各个 Broker 上感到困惑。
