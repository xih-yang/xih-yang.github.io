# 05、Kafka 实战 - 生产者：发送消息代码解析
- 来源：https://ddkk.com/zhuanlan/mq/kafka/6/5.html
- 分类：消息队列
- 分组：教程目录
> 代码使用的是 0.10.1.0 版本的 Kafka examples Producer 代码
>
> 代码在源码包的 kafka.examples.Producer 中

### Kafka Producer 代码

```java
public class Producer extends Thread {
    // 发送的数据是 K V 结构，对应上类型
    private final KafkaProducer<Integer, String> producer;
    private final String topic;
    private final Boolean isAsync;
    /**
     * 构造方法，初始化生产者对象
     */
    public Producer(String topic, Boolean isAsync) {
        Properties props = new Properties();
        props.put("bootstrap.servers", "localhost:9092");
        props.put("client.id", "DemoProducer");
        // 设置序列化的类，二进制格式传输，消费者，消费数据的时候，就需要进行反序列化，对 key value 进行序列化
        props.put("key.serializer", "org.apache.kafka.common.serialization.IntegerSerializer");
        props.put("value.serializer", "org.apache.kafka.common.serialization.StringSerializer");
        // 初始化 KafkaProducer
        producer = new KafkaProducer<>(props);
        this.topic = topic;
        this.isAsync = isAsync;
    }
    public void run() {
        int messageNo = 1;
        // 一直往 kafka 发送数据
        while (true) {
            String messageStr = "Message_" + messageNo;
            long startTime = System.currentTimeMillis();
            // isAsync，kafka 发送数据有异步有同步发送，生产环境建议用异步
            if (isAsync) {
      // Send asynchronously
                producer.send(new ProducerRecord<>(topic,
                    messageNo,
                    messageStr),
                        // 回调函数，最终消息发送的情况记录在回调函数，性能较好
                        new DemoCallBack(startTime, messageNo, messageStr));
            } else {
      // Send synchronously
                try {
                    // 发送一条消息，等这条消息所有的后续工作都完成以后才继续下一条消息的发送
                    producer.send(new ProducerRecord<>(topic,
                        messageNo,
                        messageStr)).get();
                    System.out.println("Sent message: (" + messageNo + ", " + messageStr + ")");
                } catch (InterruptedException | ExecutionException e) {
                    e.printStackTrace();
                }
            }
            ++messageNo;
        }
    }
}
class DemoCallBack implements Callback {
    private final long startTime;
    private final int key;
    private final String message;
    public DemoCallBack(long startTime, int key, String message) {
        this.startTime = startTime;
        this.key = key;
        this.message = message;
    }
    /**
     * A callback method the user can implement to provide asynchronous handling of request completion. This method will
     * be called when the record sent to the server has been acknowledged. Exactly one of the arguments will be
     * non-null.
     *
     * @param metadata  The metadata for the record that was sent (i.e. the partition and offset). Null if an error
     *                  occurred.
     * @param exception The exception thrown during processing of this record. Null if no error occurred.
     */
    public void onCompletion(RecordMetadata metadata, Exception exception) {
        long elapsedTime = System.currentTimeMillis() - startTime;
        if (metadata != null) {
            System.out.println(
                "message(" + key + ", " + message + ") sent to partition(" + metadata.partition() +
                    "), " +
                    "offset(" + metadata.offset() + ") in " + elapsedTime + " ms");
        } else {
            exception.printStackTrace();
        }
    }
}
```

### 代码解析

### 1、Producer

- 首先使用自定义配置创建一个生产者客户端对象 KafkaProducer，使用 isAsync 标记是同步还是异步发送
- 每一条消息都会包装成一个 ProducerRecord，并传给 send 方法，表示将产生的消息发送给服务端 异步发送还有一个
- Callback 回调类，成功存储之后会触发该回调类，同步发送下必须等待服务端返回响应结果才能发下一条消息

### 2、KafkaProducer

### 2.1 send()

- send 方法返回的是一个 Future，所以 KafkaProducer 只用一个 send 方法就能实现同步和异步消息发送语义
- KafkaProducer 两个 send 方法的重载，最终调用的是 doSend 方法

```java
@Override
public Future<RecordMetadata> send(ProducerRecord<K, V> record) {
    return send(record, null);
}
@Override
public Future<RecordMetadata> send(ProducerRecord<K, V> record, Callback callback) {
    // intercept the record, which can be potentially modified; this method does not throw exceptions
    ProducerRecord<K, V> interceptedRecord = this.interceptors == null ? record : this.interceptors.onSend(record);
    // TODO 关键代码
    return doSend(interceptedRecord, callback);
}
```

### 2.2 doSend()

- 主要功能
- 对 Key/Value 进行序列化
- 根据分区器为消息选择分区
- 根据元数据信息进行封装分区对象
- 消息放入 RecordAccumulator
- 判断是否该通知 Sender 发送消息

```java
// TODO 对 key、value 进行序列化
byte[] serializedKey = keySerializer.serialize(record.topic(), record.key());
byte[] serializedValue = valueSerializer.serialize(record.topic(), record.value());
// TODO 根据分区器为消息选择分区
int partition = partition(record, serializedKey, serializedValue, cluster);
// TODO 根据元数据信息进行封装分区对象
TopicPartition tp = new TopicPartition(record.topic(), partition);
// TODO 消息放入 RecordAccumulator
RecordAccumulator.RecordAppendResult result = accumulator.append(tp, timestamp, serializedKey, serializedValue, interceptCallback, remainingWaitMs);
// TODO 判断是否该通知 Sender 发送消息
if (result.batchIsFull || result.newBatchCreated) {
    // 唤醒 sender 线程，他才是真正发送数据的线程
    this.sender.wakeup();
}
```

### 2.3 为消息选择分区

- 选择分区的代码在 KafkaProducer.partition 方法，分区器使用的是 DefaultPartitioner.partition 方法
- 如果指定了分区号，直接使用当前分区编号
- 对于没有键的消息，一般会采用 round-robin 方式均衡地分发到不同的分区，通过计数器自增轮询的方式依次将消息分配到不同分区上
- 对于有键的消息，对键计算散列值，然后和 topic 分区数进行取模得到分区编号

```java
private int partition(ProducerRecord<K, V> record, byte[] serializedKey, byte[] serializedValue, Cluster cluster) {
    // 如果这个消息已经分配了分区号，直接使用即可，正常情况下是没有的
    Integer partition = record.partition();
    return partition != null ?
            partition :
            // 使用分区器进行选择，下面的代码
            partitioner.partition(
                    record.topic(), record.key(), serializedKey, record.value(), serializedValue, cluster);
}
public int partition(String topic, Object key, byte[] keyBytes, Object value, byte[] valueBytes, Cluster cluster) {
    // 获取到要发送的 topic 的信息
    List<PartitionInfo> partitions = cluster.partitionsForTopic(topic);
    // 分区总个数
    int numPartitions = partitions.size();
    // 没有指定 key
    if (keyBytes == null) {
        // 计数器，每次执行都会递增（发生变化）
        int nextValue = counter.getAndIncrement();
        // 获取可用分区数
        List<PartitionInfo> availablePartitions = cluster.availablePartitionsForTopic(topic);
        if (availablePartitions.size() > 0) {
            // 计算发送到哪个分区上
            int part = Utils.toPositive(nextValue) % availablePartitions.size();
            // 分配分区
            return availablePartitions.get(part).partition();
        } else {
            // no partitions are available, give a non-available partition
            return Utils.toPositive(nextValue) % numPartitions;
        }
    } else {
        // hash the keyBytes to choose a partition
        // 指定了 key 就是用 key 的散列选择分区，再根据取模进行分配
        return Utils.toPositive(Utils.murmur2(keyBytes)) % numPartitions;
    }
}
```

### 2.4 RecordAccumulator

- 生产者每生产一条消息就往记录收集器中 append 一条消息
- append 方法会返回一个 RecordAppendResult，里面有一个 batchIsFull 和 newBatchCreated，这两个参数是判断是否唤醒 Sender 线程的标记
- batchIsFull 记录 RecordBatch 是否已满，newBatchCreated 记录是否新创建了一批
- append 一条消息涉及到的条件和判断
- 队列中如果不存在批记录，直接创建一个新的批记录
- 如果存在批记录，尝试追加一条消息，并判断能不能追加成功
- 如果追加成功，说明已有的批记录可以容纳当前这条消息，返回结果
- 如果追加不成功，说明旧的批记录容纳不下当前这一条消息，进入下一步
- 计算一个批次的大小，也就是比较默认的批次大小和消息大小哪个大，然后根据批次大小分配内存

分配内存是 Kafka 内部设计的一个内存缓冲池 BufferPool，就是一个队列，里面放的就是一块一块的内存，内存大小就是配置给的大小

创建一个新的批记录，并往其中添加当前消息的队尾，新的批记录一定能容纳当前这条消息
