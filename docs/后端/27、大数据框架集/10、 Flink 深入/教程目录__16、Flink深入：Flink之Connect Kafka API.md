# 16、Flink深入：Flink之Connect Kafka API
- 来源：https://ddkk.com/zhuanlan/bigdata/flink/4/16.html
- 分类：大数据框架
- 分组：教程目录
## 1. pom依赖

Flink 里已经提供了一些绑定的 Connector，例如 kafka source 和 sink，Es sink 等。读写 kafka、es、rabbitMQ 时可以直接使用相应 connector 的 api 即可，虽然该部分是 Flink 项目源代码里的一部分，但是真正意义上不算作 Flink 引擎相关逻辑，并且该部分没有打包在二进制的发布包里面。所以在提交 Job 时候需要注意， job 代码 jar 包中一定要将相应的 connetor 相关类打包进去，否则在提交作业时就会失败，提示找不到相应的类，或初始化某些类异常。

[//nightlies.apache.org/flink/flink-docs-release-1.14/docs/connectors/datastream/kafka/](https://ci.apache.org/projects/flink/flink-docs-stable/dev/connectors/kafka.html)

具体依赖可以查看： [Flink的API说明和pom文件汇总](/zhuanlan/bigdata/flink/4/8.html)

## 2. 参数设置

如下参数建议全部配置上：

```java
1.订阅的主题
2.反序列化规则
3.消费者属性-集群地址
4.消费者属性-消费者组id(如果不设置,会有默认的,但是默认的不方便管理)
5.消费者属性-offset重置规则,如earliest/latest...
6.动态分区检测(当kafka的分区数变化/增加时,Flink能够检测到!)
7.如果没有设置Checkpoint,那么可以设置自动提交offset,后续学习了Checkpoint会把offset随着做Checkpoint的时候提交到Checkpoint和默认主题中
```

## 3. 参数说明

## 3.1. 序列化和反序列化器

## 3.2. 消费者起始位置

## 3.3. 动态分区检测

关于动态分区的实际需求和解决方案：

```java
场景一：有一个 Flink 作业需要将五份数据聚合到一起，五份数据对应五个 kafka topic，随着业务增长，新增一类数据，同时新增了一个 kafka topic，如何在不重启作业的情况下作业自动感知新的 topic。
场景二：作业从一个固定的 kafka topic 读数据，开始该 topic 有 10 个 partition，但随着业务的增长数据量变大，需要对 kafka partition 个数进行扩容，由 10 个扩容到 20。
该情况下如何在不重启作业情况下动态感知新扩容的 partition？
针对上面的两种场景，首先需要在构建 FlinkKafkaConsumer 时的 properties 中设置 flink.partition-discovery.interval-millis 参数为非负值，表示开启动态发现的开关，以及设置的时间间隔。此时 FlinkKafkaConsumer 内部会启动一个单独的线程定期去 kafka 获取最新的 meta 信息。
针对场景一，还需在构建 FlinkKafkaConsumer 时，topic 的描述可以传一个正则表达式描述的 pattern。每次获取最新 kafka meta 时获取正则匹配的最新 topic 列表。
针对场景二，设置前面的动态发现参数，在定期获取 kafka 最新 meta 信息时会匹配新的 partition。为了保证数据的正确性，新发现的 partition 从最早的位置开始读取。
```

## 3.4. Connect Kafka中的Checkpoint

注意:

开启checkpoint 时 offset 是 Flink 通过状态 state 管理和恢复的，并不是从 kafka 的 offset 位置恢复。在 checkpoint 机制下，作业从最近一次checkpoint 恢复，本身是会回放部分历史数据，导致部分数据重复消费，Flink 引擎仅保证计算状态的精准一次，要想做到端到端精准一次需要依赖一些幂等的存储系统或者事务操作。

## 4. Kafka中的部分命令

```java
# 查看当前服务器中的所有topic
/export/server/kafka/bin/kafka-topics.sh --list --zookeeper  node1:2181
# 创建topic
/export/server/kafka/bin/kafka-topics.sh --create --zookeeper node1:2181 --replication-factor 2 --partitions 3 --topic flink_kafka
# 查看某个Topic的详情
/export/server/kafka/bin/kafka-topics.sh --topic flink_kafka --describe --zookeeper node1:2181
# 删除topic
/export/server/kafka/bin/kafka-topics.sh --delete --zookeeper node1:2181 --topic flink_kafka
# 通过shell命令发送消息
/export/server/kafka/bin/kafka-console-producer.sh --broker-list node1:9092 --topic flink_kafka
# 通过shell消费消息
/export/server/kafka/bin/kafka-console-consumer.sh --bootstrap-server node1:9092 --topic flink_kafka --from-beginning 
# 修改分区
 /export/server/kafka/bin/kafka-topics.sh --alter --partitions 4 --topic flink_kafka --zookeeper node1:2181
```

## 5. 代码实现 KafkaConsumer

```java
import org.apache.flink.api.common.functions.FlatMapFunction;
import org.apache.flink.api.common.serialization.SimpleStringSchema;
import org.apache.flink.api.java.tuple.Tuple;
import org.apache.flink.api.java.tuple.Tuple2;
import org.apache.flink.streaming.api.datastream.DataStreamSource;
import org.apache.flink.streaming.api.datastream.KeyedStream;
import org.apache.flink.streaming.api.datastream.SingleOutputStreamOperator;
import org.apache.flink.streaming.api.environment.StreamExecutionEnvironment;
import org.apache.flink.streaming.connectors.kafka.FlinkKafkaConsumer;
import org.apache.flink.util.Collector;
import java.util.Properties;
/**
 * Author ddkk.com  弟弟快看，程序员编程资料站
 * Desc
 * 需求:使用flink-connector-kafka_2.12中的FlinkKafkaConsumer消费Kafka中的数据做WordCount
 * 需要设置如下参数:
 * 1.订阅的主题
 * 2.反序列化规则
 * 3.消费者属性-集群地址
 * 4.消费者属性-消费者组id(如果不设置,会有默认的,但是默认的不方便管理)
 * 5.消费者属性-offset重置规则,如earliest/latest...
 * 6.动态分区检测(当kafka的分区数变化/增加时,Flink能够检测到!)
 * 7.如果没有设置Checkpoint,那么可以设置自动提交offset,后续学习了Checkpoint会把offset随着做Checkpoint的时候提交到Checkpoint和默认主题中
 */
public class ConnectorsDemo_KafkaConsumer {
    public static void main(String[] args) throws Exception {
        //1.env
        StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();
        //2.Source
        Properties props  = new Properties();
        props.setProperty("bootstrap.servers", "node1:9092");
        props.setProperty("group.id", "flink");
        props.setProperty("auto.offset.reset","latest");
        props.setProperty("flink.partition-discovery.interval-millis","5000");//会开启一个后台线程每隔5s检测一下Kafka的分区情况
        props.setProperty("enable.auto.commit", "true");
        props.setProperty("auto.commit.interval.ms", "2000");
        //kafkaSource就是KafkaConsumer
        FlinkKafkaConsumer<String> kafkaSource = new FlinkKafkaConsumer<>("flink_kafka", new SimpleStringSchema(), props);
        kafkaSource.setStartFromGroupOffsets();//设置从记录的offset开始消费,如果没有记录从auto.offset.reset配置开始消费
        //kafkaSource.setStartFromEarliest();//设置直接从Earliest消费,和auto.offset.reset配置无关
        DataStreamSource<String> kafkaDS = env.addSource(kafkaSource);
        //3.Transformation
        //3.1切割并记为1
        SingleOutputStreamOperator<Tuple2<String, Integer>> wordAndOneDS = kafkaDS.flatMap(new FlatMapFunction<String, Tuple2<String, Integer>>() {
            @Override
            public void flatMap(String value, Collector<Tuple2<String, Integer>> out) throws Exception {
                String[] words = value.split(" ");
                for (String word : words) {
                    out.collect(Tuple2.of(word, 1));
                }
            }
        });
        //3.2分组
        KeyedStream<Tuple2<String, Integer>, Tuple> groupedDS = wordAndOneDS.keyBy(0);
        //3.3聚合
        SingleOutputStreamOperator<Tuple2<String, Integer>> result = groupedDS.sum(1);
        //4.Sink
        result.print();
        //5.execute
        env.execute();
    }
}
```

## 6. 代码实现 KafkaProducer

```java
import com.alibaba.fastjson.JSON;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.apache.flink.api.common.functions.MapFunction;
import org.apache.flink.api.common.serialization.SimpleStringSchema;
import org.apache.flink.streaming.api.datastream.DataStreamSource;
import org.apache.flink.streaming.api.datastream.SingleOutputStreamOperator;
import org.apache.flink.streaming.api.environment.StreamExecutionEnvironment;
import org.apache.flink.streaming.connectors.kafka.FlinkKafkaProducer;
import java.util.Properties;
/**
 * Author ddkk.com  弟弟快看，程序员编程资料站
 * Desc
 * 使用自定义sink-官方提供的flink-connector-kafka_2.12-将数据保存到Kafka
 */
public class ConnectorsDemo_KafkaProducer {
    public static void main(String[] args) throws Exception {
        //1.env
        StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();
        //2.Source
        DataStreamSource<Student> studentDS = env.fromElements(new Student(1, "tonyma", 18));
        //3.Transformation
        //注意:目前来说我们使用Kafka使用的序列化和反序列化都是直接使用最简单的字符串,所以先将Student转为字符串
        //可以直接调用Student的toString,也可以转为JSON
        SingleOutputStreamOperator<String> jsonDS = studentDS.map(new MapFunction<Student, String>() {
            @Override
            public String map(Student value) throws Exception {
                //String str = value.toString();
                String jsonStr = JSON.toJSONString(value);
                return jsonStr;
            }
        });
        //4.Sink
        jsonDS.print();
        //根据参数创建KafkaProducer/KafkaSink
        Properties props = new Properties();
        props.setProperty("bootstrap.servers", "node1:9092");
        FlinkKafkaProducer<String> kafkaSink = new FlinkKafkaProducer<>("flink_kafka",  new SimpleStringSchema(),  props);
        jsonDS.addSink(kafkaSink);
        //5.execute
        env.execute();
        // /export/server/kafka/bin/kafka-console-consumer.sh --bootstrap-server node1:9092 --topic flink_kafka
    }
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Student {
        private Integer id;
        private String name;
        private Integer age;
    }
}
```

## 7. KafkaUtil示例

其中包括如下方法：

方法一：通过消费者组id 获取对应的kafka配置

方法二：封装kafka消费者

方法三：封装kafka消费者（返回一个Tuple2，其中第一个元素为kafka的value值，第二个为该消息在kafka中对应的时间戳）

方法四：封装kafka消费者，从传入的时间戳开始消费（返回一个Tuple2，其中第一个元素为kafka的value值，第二个为该消息在kafka中对应的时间戳）

方法五：封装kafka消费者，从传入的时间戳开始消费

方法六：封装kafka生产者

方法七：封装 Kafka 生产者，动态指定多个不同主题，并使用精确一次语议

方法八：封装 Kafka 精确一次语议 生产者对象

```java
package com.ouyang.gmall.realtime.utils;
import com.alibaba.fastjson.JSON;
import org.apache.flink.api.common.serialization.SimpleStringSchema;
import org.apache.flink.api.common.typeinfo.TypeHint;
import org.apache.flink.api.common.typeinfo.TypeInformation;
import org.apache.flink.api.java.tuple.Tuple2;
import org.apache.flink.streaming.connectors.kafka.*;
import org.apache.kafka.clients.consumer.ConsumerConfig;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.apache.kafka.clients.producer.ProducerConfig;
import org.apache.kafka.clients.producer.ProducerRecord;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import javax.annotation.Nullable;
import java.nio.charset.StandardCharsets;
import java.util.Properties;
/**
 * @date: 2022/1/14
 *  @Author ddkk.com  弟弟快看，程序员编程资料站
 * @desc: Kafka工具类
 * Kafka Consumer
 * 1、创建 Kafka Consumer
 * 2、使用 DeserializationSchema 对kafka中的消息值进行反序列化（TypeInformationSerializationSchema、JsonDeserializationSchema、AvroDeserializationSchema 或者 自定义）
 * 3、配置 Kafka Consumer 开始消费的位置（通过 FlinkKafkaConsumer 来 setStartFromEarliest、setStartFromLatest、setStartFromTimestamp、setStartFromGroupOffsets）
 * 4、Kafka Consumer 和容错，使用 flink 的 checkpointing ，或者使用 kafka其中的topic来存储offset
 * 5、Kafka Consumer Topic 和分区发现（设置  flink.partition-discovery.interval-millis 大于0能自动发现kafka中的新分区，能使用正则表达式匹配topic）
 * 6、Kafka Consumer 提交 Offset 的行为配置，注意：提交的 offset 只是一种方法，用于公开 consumer 的进度以便进行监控
 *      6.1、 禁用 Checkpointing， 使用 Kafka client 自动定期 offset 提交功能，需要配置 enable.auto.commit 和 auto.commit.interval.ms
 *      6.2、 启用 Checkpointing，那么 offset 会保存在 checkpointing 中， 同时可以使用 consumer 上的 setCommitOffsetsOnCheckpoints(boolean) 方法来禁用或启用 offset 对 kafka broker 的提交(默认情况下，这个值是 true )，注意，在这个场景中，Properties 中的自动定期 offset 提交设置会被完全忽略。
 * 7、Kafka Consumer 和 时间戳抽取以及 watermark 发送 （使用 FlinkKafkaConsumer.assignTimestampsAndWatermarks ， 一般不用）
 *
 * Kafka Producer
 * 1、创建 Kafka Producer （下述的 getKafkaProducer 系列方法）
 * 2、SerializationSchema （自定义序列化器）
 * 3、Kafka Producer 和容错（通过 Semantic.NONE 、 Semantic.AT_LEAST_ONCE 和 Semantic.EXACTLY_ONCE 配置， 但是需要启动flink的checkpointing）
 *          当使用 Semantic.EXACTLY_ONCE 时，需要考虑到 Kafka broker 中的 transaction.max.timeout.ms （默认15分钟） 和 FlinkKafkaProducer 中的 transaction.timeout.ms（默认1小时）
 *
 */
public class MyKafkaUtil {
    public static Logger logger = LoggerFactory.getLogger(MyKafkaUtil.class);
    /**
     * 通过消费者组id 获取对应的kafka配置
     *
     * @param groupId 消费者组id
     * @return 配置对象
     */
    public static Properties getKafkaProperties(String groupId) {
        // Kakfa的参数设置
        Properties props = new Properties();
        // 集群地址 和 消费者组id（最基础的配置，必须要有）
        props.setProperty(ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG, ModelUtil.getConfigValue("kafka.bootstrap.servers"));
        props.setProperty(ConsumerConfig.GROUP_ID_CONFIG, groupId);
        // 开启 FlinkKafkaConsumer 的自动分区检测，用于检测kafka中topic的分区变更
        props.setProperty(FlinkKafkaConsumerBase.KEY_PARTITION_DISCOVERY_INTERVAL_MILLIS, ModelUtil.getConfigValue("kafka.flink.partition-discovery.interval-millis"));
        // 偏移量自动提交，当checkpoint关闭时会启动此参数，当checkpoint开启时，并设置了setCommitOffsetsOnCheckpoints(true)（此参数默认为true）时，会根据checkpoint的时间向kafka.broker中提交offset
        props.setProperty(ConsumerConfig.ENABLE_AUTO_COMMIT_CONFIG, ModelUtil.getConfigValue("kafka.enable.auto.commit"));
        props.setProperty(ConsumerConfig.AUTO_COMMIT_INTERVAL_MS_CONFIG, ModelUtil.getConfigValue("kafka.auto.commit.interval.ms"));
        // 设置kafka消费者的事务级别
        props.setProperty(ConsumerConfig.ISOLATION_LEVEL_CONFIG, ModelUtil.getConfigValue("kafka.isolation.level"));
        // 当在 FlinkKafkaConsumer 中没有设置消费级别，并在checkpoint中没有偏移量时，使用此设置来消费kafka中的数据
        // 具体意义：当在kafka中保存偏移量的topic中有偏移量时从偏移量消费，没有从最新开始消费（其他还可以设置earliest，从最开始的数据开始消费等）
        // 一般情况下，会直接在 FlinkKafkaConsumer 中设置消费属性
        props.setProperty(ConsumerConfig.AUTO_OFFSET_RESET_CONFIG, ModelUtil.getConfigValue("kafka.auto.offset.reset"));
        // 返回参数设置对象
        return props;
    }
    /**
     * 封装kafka消费者
     *
     * @param topicName 主题名
     * @param groupId   消费者组id
     * @return 创建一个普通的Kafka消费者对象，其中的数据类型为String
     */
    public static FlinkKafkaConsumer<String> getKafkaConsumer(String topicName, String groupId) {
        // 获取kafka的配置对象
        Properties props = MyKafkaUtil.getKafkaProperties(groupId);
        // 创建一个FlinkKafka的消费者
        return new FlinkKafkaConsumer<String>(topicName, new SimpleStringSchema(), props);
    }
    /**
     * 封装kafka消费者，从传入的时间戳开始消费
     *
     * @param topicName 主题名
     * @param groupId   消费者组id
     * @param timestamp 13为长整形时间戳
     * @return 消费者对象
     */
    public static FlinkKafkaConsumer<String> getKafkaConsumer(String topicName, String groupId, Long timestamp) {
        // 获取kafka的配置对象
        Properties props = MyKafkaUtil.getKafkaProperties(groupId);
        // 创建一个FlinkKafka的消费者
        FlinkKafkaConsumer<String> consumer = new FlinkKafkaConsumer<>(topicName, new SimpleStringSchema(), props);
        // 设置从指定时间戳开始消费
        logger.info("从kafka的指定时间戳开始消费，时间戳：" + timestamp);
        consumer.setStartFromTimestamp(timestamp);
        // 返回消费者对象
        return consumer;
    }
    /**
     * 封装kafka消费者（返回一个Tuple2，其中第一个元素为kafka的value值，第二个为该消息在kafka中对应的时间戳（注意：单位为毫秒））
     *
     * @param topicName 主题名
     * @param groupId   消费者组id
     * @return 消费者对象
     */
    public static FlinkKafkaConsumer<Tuple2<String, Long>> getKafkaConsumerContainTimestamp(String topicName, String groupId) {
        // 获取kafka的配置对象
        Properties props = MyKafkaUtil.getKafkaProperties(groupId);
        // 自定义kafka的反序列化器
        KafkaDeserializationSchema<Tuple2<String, Long>> deserializationSchema = new KafkaDeserializationSchema<Tuple2<String, Long>>() {
            @Override
            public TypeInformation<Tuple2<String, Long>> getProducedType() {
                return TypeInformation.of(new TypeHint<Tuple2<String, Long>>() {
                });
            }
            @Override
            public boolean isEndOfStream(Tuple2<String, Long> nextElement) {
                return false;
            }
            @Override
            public Tuple2<String, Long> deserialize(ConsumerRecord<byte[], byte[]> record) throws Exception {
                String message = new String(record.value(), StandardCharsets.UTF_8);
                long timestamp = record.timestamp();
                return Tuple2.of(message, timestamp);
            }
        };
        // 创建一个FlinkKafka的消费者，其中包含kafka中的value和该条消息到kafka的时间
        return new FlinkKafkaConsumer<>(topicName, deserializationSchema, props);
    }
    /**
     * 封装kafka消费者，从传入的时间戳开始消费（返回一个Tuple2，其中第一个元素为kafka的value值，第二个为该消息在kafka中对应的时间戳（注意：单位为毫秒））
     *
     * @param topicName 主题名
     * @param groupId   消费者组id
     * @param timestamp 13位长整形时间戳（毫秒）
     * @return 消费者对象
     */
    public static FlinkKafkaConsumer<Tuple2<String, Long>> getKafkaConsumerContainTimestamp(String topicName, String groupId, Long timestamp) {
        // 获取kafka的配置对象
        Properties props = MyKafkaUtil.getKafkaProperties(groupId);
        // 自定义kafka的反序列化器
        KafkaDeserializationSchema<Tuple2<String, Long>> deserializationSchema = new KafkaDeserializationSchema<Tuple2<String, Long>>() {
            @Override
            public TypeInformation<Tuple2<String, Long>> getProducedType() {
                return TypeInformation.of(new TypeHint<Tuple2<String, Long>>() {
                });
            }
            @Override
            public boolean isEndOfStream(Tuple2<String, Long> nextElement) {
                return false;
            }
            @Override
            public Tuple2<String, Long> deserialize(ConsumerRecord<byte[], byte[]> record) throws Exception {
                String message = new String(record.value(), StandardCharsets.UTF_8);
                long timestamp = record.timestamp();
                return Tuple2.of(message, timestamp);
            }
        };
        // 创建一个FlinkKafka的消费者，其中包含kafka中的value和该条消息到kafka的时间
        FlinkKafkaConsumer<Tuple2<String, Long>> consumer = new FlinkKafkaConsumer<>(topicName, deserializationSchema, props);
        // 设置从指定时间戳开始消费
        logger.info("从kafka的指定时间戳开始消费，时间戳：" + timestamp);
        consumer.setStartFromTimestamp(timestamp);
        // 返回消费者对象
        return consumer;
    }
    /**
     * 获取 kafka 生产者（ 普通kafka生产者，模式为 AT_LEAST_ONCE ）
     *
     * @param topicName 主题名
     * @return 生产者对象
     */
    public static FlinkKafkaProducer<String> getKafkaProducer(String topicName) {
        return new FlinkKafkaProducer<>(ModelUtil.getConfigValue("kafka.bootstrap.servers"), topicName, new SimpleStringSchema());
    }
    /**
     * 获取 Kafka 生产者，动态指定多个不同主题，并使用精确一次语议
     *
     * @param serializationSchema 序列化模式
     * @param <T>                 来源数据类型
     * @return FlinkKafkaProducer
     */
    public static <T> FlinkKafkaProducer<T> getKafkaProducerExactlyOnce(KafkaSerializationSchema<T> serializationSchema, String defaultTopicName) {
        Properties prop = new Properties();
        // kafka的 bootstrap.servers
        prop.setProperty(ProducerConfig.BOOTSTRAP_SERVERS_CONFIG, ModelUtil.getConfigValue("kafka.bootstrap.servers"));
        //如果 10 分钟没有更新状态，则超时( 默认超时时间是1分钟)，表示已经提交事务到kafka，但10分钟还没有上传数据，结束事务
        prop.setProperty(ProducerConfig.TRANSACTION_TIMEOUT_CONFIG, String.valueOf(10 * 60 * 1000));
        // 配置生产者的kafka的单条消息的最大大小（ 默认为1M，这里设置为10M ）
        prop.setProperty(ProducerConfig.MAX_REQUEST_SIZE_CONFIG, String.valueOf(10 * 1000 * 1000));
        return new FlinkKafkaProducer<>(defaultTopicName, serializationSchema, prop, FlinkKafkaProducer.Semantic.EXACTLY_ONCE);
    }
    /**
     * 获取 Kafka 生产者，并使用精确一次语议
     *
     * @param topicName 主题名
     * @param <T>       来源数据类型
     * @return FlinkKafkaProducer
     */
    public static <T extends String> FlinkKafkaProducer<T> getKafkaProducerExactlyOnce(String topicName) {
        return MyKafkaUtil.getKafkaProducerExactlyOnce(
                new KafkaSerializationSchema<T>() {
                    @Override
                    public ProducerRecord<byte[], byte[]> serialize(T t, @Nullable Long aLong) {
                        return new ProducerRecord<>(topicName, JSON.toJSONBytes(t));
                    }
                },
                ModelUtil.getConfigValue("kafka.topic.default")
        );
    }
}
```
