# 14、RocketMQ 实战 - 负载均衡
- 来源：https://ddkk.com/zhuanlan/mq/rocketmq/8/14.html
- 分类：消息队列
- 分组：教程目录
## 负载均衡

### producer负载均衡

- 生产者在发送消息时,会轮询所有的messageQueue,让消息平均落在不同的queue上,

而queue可以散落在不同broker上,所以发送到不同broker

### consumer负载均衡

- 集群方式
- AllocateMessageQueueAveragely:在拉取的时候指定那一条message queue,所以在消费者启动时,会触发一次负载均衡,更加queue的数量和消费者的数量平均分配queue给每个消费者
- AllocateMessageQueueAvgragelyByCircle,也就是平均分摊每一套queue,用环状轮流分queue的形式
- 注意事项

集群模式下,queue只允许分配一个消费者,但是一个消费者能分到不同queue
- 通过增加消费者分摊queue的消费,可以增加消费能力的作用
- 如果消费者比queue的总数量还多的话,多余的消费者将无法分到queue,也就无法消费,所以需要控制queue总数量大于消费者数量

广播模式

每个消费者都能分到queue,不需要一个queue对应一个消费者,所以是一个queue对应多个消费者
