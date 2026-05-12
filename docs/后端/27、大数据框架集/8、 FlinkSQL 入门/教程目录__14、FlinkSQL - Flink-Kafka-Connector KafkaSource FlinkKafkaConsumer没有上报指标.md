# 14、FlinkSQL - Flink-Kafka-Connector KafkaSource FlinkKafkaConsumer没有上报指标
- 来源：https://ddkk.com/zhuanlan/bigdata/flink/3/14.html
- 分类：大数据框架
- 分组：教程目录
## 问题

使用了Flink-Kafka-Connector（版本1.13.0)，使用FlinkKafkaConsumer 上报了KafkaLag指标，但是换成 KafkaSource 却没有任何指标。

## 原因

通过查阅 JIRA发现，Flink-1.13的 kafka-connector 的新版KafkaSource 没有上报指标。

[Report metrics of KafkaConsumer in Kafka new source](https://issues.apache.org/jira/browse/FLINK-22766)

修复的版本：1.13.2, 1.14，意思是升级到这两个版本才能上报Kafka相关的指标。

## 兼容性

如果遇到这个问题，则说明 kafka-clients的版本太低。

```java
Caused by: java.lang.NoSuchMethodError: org.apache.kafka.clients.consumer.KafkaConsumer.committed(Ljava/util/Set;)Ljava/util/Map;
	at org.apache.flink.connector.kafka.source.reader.KafkaPartitionSplitReader.acquireAndSetStoppingOffsets(KafkaPartitionSplitReader.java:331) ~[flink-application-xxxx.jar:?]
```

## Flink-Kafka-Connector 和 KafkaClients的兼容性说明

Flink-1.13.2+ 使用的Kafka API至少2.4.1。

- Kafka版本的兼容性未在官方文档中指出。Flink源码中引用的版本是 kafka-clients 2.4.1。

Flink-1.13.2 使用到新版的KafkaAPI 变更的说明

- [KIP-520: Add overloaded Consumer#committed for batching partitions](https://cwiki.apache.org/confluence/pages/viewpage.action?pageId=128651203)

## 解决方案

Flink 1.13的发行版，可以直接使用1.13.2的Flink-kafka-connector。

依据：通过查看 有关源码 [FLINK-22766](https://issues.apache.org/jira/browse/FLINK-22766)，发现该Connector的变更不依赖除Connector以外的任何变更，因此可以兼容Flink-1.13.0。

也可以把Flink发行版+Connector直接升级到 Flink-1.13.2，Flink-1.14。

## 参考链接

Flink 发起的KafkaSource 提议

- [FLIP-27](https://cwiki.apache.org/confluence/display/FLINK/FLIP-27%3A+Refactor+Source+Interface)
