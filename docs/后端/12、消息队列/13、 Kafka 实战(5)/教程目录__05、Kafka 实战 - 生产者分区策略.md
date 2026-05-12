# 05、Kafka 实战 - 生产者分区策略
- 来源：https://ddkk.com/zhuanlan/mq/kafka/5/5.html
- 分类：消息队列
- 分组：教程目录
> 生产者分区策略

### 分区策略

#### 分区原因

- **方便在集群中扩展**，每个partition可以通过调整以适应它所在的机器，而一个topic可以有多个partition组成，因此整个集群可以适应任意大小的数据了
- **实现负载均衡，提高高并发**，kafka是以partition为单位读写的

#### 分区原则

将producer发送的数据封装成一个`ProducerRecord`对象

**1、** 指明partition的情况下，直接将指定的值直接作为partition的值；

**2、** 没有指明partition的值但有key的情况下，将key的hash值与topic的partition的数进行取余得到partition值；

**3、** 既没有partition值也没有key值的情况下，第一次调用时随机生成一个整数（后面每次调用在这个整数上自增），将这个值与topic可用的partition总数取余得到partition值，即round-ribbon算法；
