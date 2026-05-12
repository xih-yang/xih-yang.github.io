# 16、Kafka 实战 - Offset的自动提交和手动提交
- 来源：https://ddkk.com/zhuanlan/mq/kafka/3/16.html
- 分类：消息队列
- 分组：教程目录
## Offset的自动提交和手动提交

### 提交的内容

消费者⽆论是⾃动提交还是⼿动提交，都需要把所属的消费组+消费的某个主题+消费的某个分区及消费的偏移量，这样的信息提交到集群的_consumer_offsets主题⾥⾯。

### ⾃动提交

消费者poll消息下来以后就会⾃动提交offset

```java
// 是否⾃动提交offset，默认就是true
props.put(ConsumerConfig.ENABLE_AUTO_COMMIT_CONFIG, "true");
// ⾃动提交offset的间隔时间
props.put(ConsumerConfig.AUTO_COMMIT_INTERVAL_MS_CONFIG, "1000");
```

注意：⾃动提交会丢消息。因为消费者在消费前提交offset，有可能提交完后还没消费时消费者挂了。

### ⼿动提交

需要把⾃动提交的配置改成false

```java
props.put(ConsumerConfig.ENABLE_AUTO_COMMIT_CONFIG, "false");
```

⼿动提交⼜分成了两种：

- ⼿动同步提交

在消费完消息后调⽤同步提交的⽅法，当集群返回ack前⼀直阻塞，返回ack后表示提交成功，执⾏之后的逻辑

```java
while (true) {
    /*
     * 3.poll() API 是拉取消息的⻓轮询
     */
    ConsumerRecords< String, String > records =
            consumer.poll(Duration.ofMillis(10000));
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

- ⼿动异步提交

在消息消费完后提交，不需要等到集群ack，直接执⾏之后的逻辑，可以设置⼀个回调⽅法，供集群调⽤

```java
//所有的消息已消费完
if (records.count() > 0) {
    // ⼿动异步提交offset，当前线程提交offset不会阻塞，可以继续处理后⾯的程序逻辑
    consumer.commitAsync(new OffsetCommitCallback() {
        @Override
        public void onComplete(Map<TopicPartition,
                                    OffsetAndMetadata> offsets, Exception exception) {
            if (exception != null) {
                System.err.println("Commit failed for " + offsets);
                System.err.println("Commit failed exception: " +
                        exception.getStackTrace());
            }
        }
    });
}
```
