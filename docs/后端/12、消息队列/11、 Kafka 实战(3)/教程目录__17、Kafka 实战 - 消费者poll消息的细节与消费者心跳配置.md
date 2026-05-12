# 17、Kafka 实战 - 消费者poll消息的细节与消费者心跳配置
- 来源：https://ddkk.com/zhuanlan/mq/kafka/3/17.html
- 分类：消息队列
- 分组：教程目录
## 消费者poll消息的细节与消费者心跳配置

### 长轮询poll消息

默认情况下，消费者⼀次会poll500条消息。

```java
//⼀次poll最⼤拉取消息的条数，可以根据消费速度的快慢来设置
props.put(ConsumerConfig.MAX_POLL_RECORDS_CONFIG, 500);
```

代码中设置了⻓轮询的时间是1000毫秒

```java
while (true) {
	/*
	 * 3.poll() API 是拉取消息的⻓轮询
	 */
	ConsumerRecords< String, String > records = consumer.poll(Duration.ofMillis(10000));
	for (ConsumerRecord< String, String > record: records) {
	    //4.打印消息
	    System.out.printf("收到消息：partition = %d,offset = %d, key = %s, value = %s%n ", record.partition(),
	            record.offset(), record.key(), record.value());
	}
	//所有的消息已消费完
	if (records.count() > 0) {
     //有消息
	    // ⼿动同步提交offset，当前线程会阻塞直到offset提交成功
	    // ⼀般使⽤同步提交，因为提交之后⼀般也没有什么逻辑代码了
	    consumer.commitSync();//=======阻塞=== 提交成功
	}
}
```

意味着：

- 如果⼀次poll到500条，就直接执⾏for循环
- 如果这⼀次没有poll到500条。且时间在1秒内，那么⻓轮询继续poll，要么到500条，要么到1s
- 如果多次poll都没达到500条，且1秒时间到了，那么直接执⾏for循环
- 如果两次poll的间隔超过30s，集群会认为该消费者的消费能⼒过弱，该消费者被踢出消费组，触发rebalance机制，rebalance机制会造成性能开销。可以通过设置这个参数，让⼀次poll的消息条数少⼀点

```java
//⼀次poll最⼤拉取消息的条数，可以根据消费速度的快慢来设置
props.put(ConsumerConfig.MAX_POLL_RECORDS_CONFIG, 100);
//如果两次poll的时间如果超出了30s的时间间隔，kafka会认为其消费能⼒过弱，将其踢出消费组。将分区分配给其他消费者。-rebalance
props.put(ConsumerConfig.MAX_POLL_INTERVAL_MS_CONFIG, 30 * 1000);
```

### 消费者心跳检测配置

```java
//consumer给broker发送⼼跳的间隔时间
props.put(ConsumerConfig.HEARTBEAT_INTERVAL_MS_CONFIG, 1000);
//kafka如果超过10秒没有收到消费者的⼼跳，则会把消费者踢出消费组，进⾏ rebalance，
//把分区分配给其他消费者。
props.put(ConsumerConfig.SESSION_TIMEOUT_MS_CONFIG, 10 * 1000);
```
