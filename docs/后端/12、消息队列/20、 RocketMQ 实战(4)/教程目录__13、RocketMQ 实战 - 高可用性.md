# 13、RocketMQ 实战 - 高可用性
- 来源：https://ddkk.com/zhuanlan/mq/rocketmq/8/13.html
- 分类：消息队列
- 分组：教程目录
## 高可用性机制

- RocketMQ分布式集群是通过Master和Slave的配合达到高可用的
- Master和Slave的区别:Broker配置文件中,参数brokerId的值为0带包这个Broker是Master,大于0是Slave
- Master角色的Broker支持读和写,Slave角色的Broker仅支持读

### 消费高可用

- 有了主从结构之后,内部实现了自动切换,当Master不可用或繁忙的时候,会自动切换到Slave读,折旧达到了消费端的高可用

### 发送高可用

- 创建Topic时,把Topic的多个Message Queue创建在多个Broker组上,当一个Broker的Master不可用后,其他组的Master任然可用,
- 如果需要把Slave转换成Master,需要手动停止Slave角色的Broker,更改配置文件,用新的配置文件启动Broker

### 消息主从复制

- 如果一个Broker组有Master和Slave,消息需要从Master复制到Slave上,有同步和异步两个 复制方式
- 同步复制:等Master和Slave都写入成功后才反馈给客户端成功状态
- 异步复制:只要Master写入成功后就反馈给客户端成功的状态
- 配置:通过Broker配置文件中的brokerRole参数进行设置
- Master有ASYNC_MASTER,SYNC_MASTER两个配置
- Slave只有SLAVE

### 总结

- 合理设置刷盘方式和主从复制方式,通常把Master和Slave都配置为ASYNC_FLUSH的刷盘方式.主从之间配置成SYNC_MASTER的复制方式
