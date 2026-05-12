# 13、Kafka 实战 - broker 副本与 ISR 设计
- 来源：https://ddkk.com/zhuanlan/mq/kafka/2/13.html
- 分类：消息队列
- 分组：教程目录
kafka把分区的所有副本均匀地分配到所有broker上，并从这些副本中挑选一个作为leader副本对外提供服务，而其他副本被称为follower副本，只能被动地向leader副本请求数据，从而保持与leader副本的同步：

所谓isr，就是Kafka集群动态维护的一组同步副本集合，每个topic分区都有自己的isr列表，isr中的所有副本都与leader保持同步状态，而producer写入的一条Kafka 消息只有被isr中的所有副本都接收到，才被视为“已提交”状态，由此可见，若isr中有n个副本，那么该分区最多可以忍受n-1个副本崩溃而不丢失已提交消息。

**1、** follower副本同步：；

follower副本只做一件事情：向leader副本请求数据。

如何界定同步：

**0、** 9.0.0版本之前：落后消息数+时间；

**0、** 9.0.0版本之后：由于慢以及进程卡壳导致的滞后–即follower副本落后leader副本的时间间隔，replica.lag.time.max.ms默认是10秒如果一个follower副本落后leader的时间持续性地超过了这个参数值，那么该follower副本就是不同步的；
