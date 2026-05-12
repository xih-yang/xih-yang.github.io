# 20、Kafka 源码解析 - Apache Flink Kafka consumer
- 来源：https://ddkk.com/zhuanlan/mq/kafka/8/20.html
- 分类：消息队列
- 分组：教程目录
Flink提供了Kafka connector用于消费/生产Apache Kafka topic的数据。Flink的Kafka consumer集成了checkpoint机制以提供精确一次的处理语义。在具体的实现过程中，Flink不依赖于Kafka内置的消费组位移管理，而是在内部自行记录和维护consumer的位移。

用户在使用时需要根据Kafka版本来选择相应的connector，如下表所示：

Maven依赖
支持的最低Flink版本
Kafka客户端类名
说明

flink-connector-kafka-0.8_2.10
1.0.0

FlinkKafkaConsumer08

FlinkKafkaProducer08

使用的是Kafka老版本low-level consumer，即SimpleConsumer. Flink在内部会提交位移到Zookeeper

flink-connector-kafka-0.9_2.10
1.0.0

FlinkKafkaConsumer09

FlinkKafkaProducer09

使用Kafka新版本consumer

flink-connector-kafka-0.10_2.10
1.2.0

FlinkKafkaConsumer010

FlinkKafkaProducer010

支持使用Kafka 0.10.0.0版本新引入的内置时间戳信息

然后，将上面对应的connector依赖加入到maven项目中，比如：

```java
<dependency>
    <groupId>org.apache.flink</groupId>
    <artifactId>flink-connector-kafka-0.10_2.11</artifactId>
    <version>1.3.2</version>
</dependency>
```

## Kafka Consumer

Flink kafka connector使用的consumer取决于用户使用的是老版本consumer还是新版本consumer，新旧两个版本对应的connector类名是不同的，分别是：FlinkKafkaConsumer09（或FlinkKafkaConsumer010）以及FlinkKafkaConsumer08。它们都支持同时消费多个topic。

该Connector的构造函数包含以下几个字段：

**1、** 待消费的topic列表；

**2、** key/value解序列化器，用于将字节数组形式的Kafka消息解序列化回对象；

**3、** Kafkaconsumer的属性对象，常用的consumer属性包括：bootstrap.servers（新版本consumer专用）、zookeeper.connect（旧版本consumer专用）和group.id；

下面给出一个实例：

```java
Properties properties = new Properties();
properties.setProperty("bootstrap.servers", "localhost:9092");
// only required for Kafka 0.8
properties.setProperty("zookeeper.connect", "localhost:2181");
properties.setProperty("group.id", "test");
DataStream<String> stream = env.addSource(new FlinkKafkaConsumer08<>("topic", new SimpleStringSchema(), properties));
```

## DeserializationSchema

Flink的Kafka consumer需要依靠用户指定的解序列化器来将二进制的数据转换成Java对象。DeserializationSchema接口就是做这件事情的，该接口中的deserialize方法作用于每条Kafka消息上，并把转换的结果发往Flink的下游operator。

通常情况下，用户直接继承AbstractDeserializationSchema来创建新的deserializer，也可以实现DeserializationSchema接口，只不过要自行实现getProducedType方法。

如果要同时解序列化Kafka消息的key和value，则需要实现KeyedDeserializationSchema接口，因为该接口的deserialize方法同时包含了key和value的字节数组。

Flink默认提供了几种deserializer：

- TypeInformationSerializationSchema(以及TypeInformationKeyValueSerializationSchema)：创建一个基于Flink TypeInformation的schema，适用于数据是由Flink读写之时。比起其他序列化方法，这种schema性能更好
- JsonDeserializationSchema(JSONKeyValueDeserializationSchema)：将JSON转换成ObjectNode对象，然后通过ObjectNode.get("fieldName").as(Int/String...)()访问具体的字段。KeyValue

一旦在解序列化过程中出现错误，Flink提供了两个应对方法——1. 在deserialize方法中抛出异常，使得整个作业失败并重启；2. 返回null告诉Flink Kafka connector跳过这条异常消息。值得注意的是，由于consumer是高度容错的，如果采用第一种方式会让consumer再次尝试deserialize这条有问题的消息。因此倘若deserializer再次失败，程序可能陷入一个死循环并不断进行错误重试。

## Kafka consumer起始位移配置

Flink的Kafka consumer允许用户配置Kafka consumer的起始读取位移，如下列代码所示：

```java
final StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();
FlinkKafkaConsumer08<String> myConsumer = new FlinkKafkaConsumer08<>(...);
myConsumer.setStartFromEarliest();     // start from the earliest record possible
myConsumer.setStartFromLatest();       // start from the latest record
myConsumer.setStartFromGroupOffsets(); // the default behaviour
DataStream<String> stream = env.addSource(myConsumer);
...
```

所有版本的Flink Kafka consumer都可以使用上面的方法来设定起始位移。

- setStartFromGroupOffsets：这是默认情况，即从消费者组提交到Kafka broker上的位移开始读取分区数据（对于老版本而言，位移是提交到Zookeeper上）。如果未找到位移，使用auto.offset.reset属性值来决定位移。该属性默认是LATEST，即从最新的消息位移处开始消费
- setStartFromEarliest() / setStartFromLatest()：设置从最早/最新位移处开始消费。使用这两个方法的话，Kafka中提交的位移就将会被忽略而不会被用作起始位移

Flink也支持用户自行指定位移，方法如下：

```java
ap<KafkaTopicPartition, Long> specificStartOffsets = new HashMap<>();
specificStartOffsets.put(new KafkaTopicPartition("myTopic", 0), 23L);
specificStartOffsets.put(new KafkaTopicPartition("myTopic", 1), 31L);
specificStartOffsets.put(new KafkaTopicPartition("myTopic", 2), 43L);
myConsumer.setStartFromSpecificOffsets(specificStartOffsets);
```

上面的例子中，consumer将从用户指定的位移处开始读取消息。这里的位移记录的是下一条待消费消息的位移，而不是最新的已消费消息的位移。值得注意的是，如果待消费分区的位移不在保存的位移映射中，Flink Kafka connector会使用默认的组位移策略(即setStartFromGroupOffsets())。

另外，当任务自动地从失败中恢复或手动地从savepoint中恢复时，上述这些设置位移的方法是不生效的。在恢复时，每个Kafka分区的起始位移都是由保存在savepoint或checkpoint中的位移来决定的。

## Kafka consumer容错性

一旦启用了Flink的检查点机制（checkpointing），Flink Kafka消费者会定期地对其消费的topic做checkpoint以保存它消费的位移以及其他操作的状态。一旦出现失败，Flink将会恢复streaming程序到最新的checkpoint状态，然后重新从Kafka消费数据，重新读取的位置就是保存在checkpoint中的位移。

checkpoint的间隔决定了程序容错性的程度，它直接确定了在程序崩溃时，程序回溯到的最久状态。

如果要使用启动容错性的Kafka消费者，定期对拓扑进行checkpoint就是非常必要的，实现方法如下面代码所示：

```java
final StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();
env.enableCheckpointing(5000); // 每5秒做一次checkpoint　　
```

需要注意的是，只有槽位（slot）充足Flink才会重启拓扑，因此一旦拓扑因无法连接TaskManager而崩溃，仍然需要有足够的slot才能重启拓扑。如果使用YARN的话，Flink能够自动地重启丢失的YARN容器。

如果没有启用checkpoint，那么Kafka consumer会定期地向Zookeeper提交位移。

## Kafka consumer位移提交

Flink Kafka consumer可以自行设置位移提交的行为。当然，它不依赖于这些已提交的位移来实现容错性。这些提交位移只是供监控使用。

配置位移提交的方法各异，主要依赖于是否启用了checkpointing机制：

- 未启用checkpointing：Flink Kafka consumer依赖于Kafka提供的自动提交位移功能。设置方法是在Properties对象中配置Kafka参数enable.auto.commit(新版本Kafka consumer)或auto.commit.enable(老版本Kafka consumer)
- 启用checkpointing：Flink Kafka consumer会提交位移到checkpoint状态中。这就保证了Kafka中提交的位移与checkpoint状态中的位移是一致的。用户可以调用setCommitOffsetsCheckpoints(boolean)方法来禁用/开启位移提交——默认是true，即开启了位移提交。注意，这种情况下，Flink会忽略上一种情况中提及的Kafka参数

## Kafka consumer时间戳提取/水位生成

通常，事件或记录的时间戳信息是封装在消息体中。至于水位，用户可以选择定期地发生水位，也可以基于某些特定的Kafka消息来生成水位——这分别就是AssignerWithPeriodicWatermaks以及AssignerWithPunctuatedWatermarks接口的使用场景。

用户也能够自定义时间戳提取器/水位生成器，具体方法参见[这里](https://ci.apache.org/projects/flink/flink-docs-release-1.3/apis/streaming/event_timestamp_extractors.html)，然后按照下面的方式传递给consumer：

```java
Properties properties = new Properties();
properties.setProperty("bootstrap.servers", "localhost:9092");
// only required for Kafka 0.8
properties.setProperty("zookeeper.connect", "localhost:2181");
properties.setProperty("group.id", "test");
FlinkKafkaConsumer08<String> myConsumer =
    new FlinkKafkaConsumer08<>("topic", new SimpleStringSchema(), properties);
myConsumer.assignTimestampsAndWatermarks(new CustomWatermarkEmitter());
DataStream<String> stream = env
    .addSource(myConsumer)
    .print();
```

在内部，Flink会为每个Kafka分区都执行一个对应的assigner实例。一旦指定了这样的assigner，对于每条Kafka中的消息，extractTimestamp(T element, long previousElementTimestamp)方法会被调用来给消息分配时间戳，而getCurrentWatermark()方法（定时生成水位）或checkAndGetNextWatermark(T lastElement, long extractedTimestamp)方法(基于特定条件)会被调用以确定是否发送新的水位值。
