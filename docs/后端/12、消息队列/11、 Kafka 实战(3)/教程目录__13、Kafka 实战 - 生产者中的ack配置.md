# 13、Kafka 实战 - 生产者中的ack配置
- 来源：https://ddkk.com/zhuanlan/mq/kafka/3/13.html
- 分类：消息队列
- 分组：教程目录
## 生产者中的ack配置

在同步发送的前提下，⽣产者在获得集群返回的ack之前会⼀直阻塞。那么集群什么时候返回ack呢？此时ack有3个配置：

- ack = 0 kafka-cluster不需要任何的broker收到消息，就⽴即返回ack给⽣产者，最容易丢消息的，效率是最⾼的
- ack=1（默认）： 多副本之间的leader已经收到消息，并把消息写⼊到本地的log中，才会返回ack给⽣产者，性能和安全性是最均衡的
- ack=-1/all。⾥⾯有默认的配置min.insync.replicas=2(默认为1，推荐配置⼤于等于2)，此时就需要leader和⼀个follower同步完后，才会返回ack给⽣产者（此时集群中有2个broker已完成数据的接收），这种⽅式最安全，但性能最差。

下⾯是关于ack和重试（如果没有收到ack，就开启重试）的配置

```java
props.put(ProducerConfig.ACKS_CONFIG, "1");
/*
 发送失败会重试，默认重试间隔100ms，重试能保证消息发送的可靠性，但是也可能造成消息重复发送，
 ⽐如⽹络抖动，所以需要在接收者那边做好消息接收的幂等性处理
 */
props.put(ProducerConfig.RETRIES_CONFIG, 3);
//重试间隔设置
props.put(ProducerConfig.RETRY_BACKOFF_MS_CONFIG, 300);
```
