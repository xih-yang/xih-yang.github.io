# 12、kafka 实战 - kafka事务
- 来源：https://ddkk.com/zhuanlan/mq/kafka/5/12.html
- 分类：消息队列
- 分组：教程目录
> kafka事务

kafka从0.11版本开始引入事务支持。事务可以保证kafka在exactly once语义的基础上，生产和消费可以跨分区和会话，要么全部成功，要么全部失败。

### Producer事务

为了实现跨分区会话的事务，需要引入一个全局唯一的transactionID，并将producer获得的PID和transactionID绑定。这样当producer重启后就可以通过正在进行的transactionID获得原来的PID。

为了管理transactionID，kafka引入了一个新的组件transaction coordinator。producer就是通过和transaction coordinator交互获得transactionID对应的任务状态。transaction coordinator还负责将事务写入kafka的一个内部topic，这样即使整个服务重启，由于事务状态得到保存，进行中的事务状态可以得到恢复，从而继续进行。

### Consumer事务

上述事务机制主要是从producer方面考虑，对于consumer而言，事务的保证就会相对较弱，尤其是无法保证commit的信息被精确消费。这是由于consumer可以通过offset访问任意信息，而且不同的segment file生命周期不同，同一事务的消息可能会出现重启后被删除的情况。
