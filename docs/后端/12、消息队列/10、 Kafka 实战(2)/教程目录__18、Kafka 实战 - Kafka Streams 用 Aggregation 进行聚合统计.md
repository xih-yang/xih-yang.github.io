# 18、Kafka 实战 - Kafka Streams 用 Aggregation 进行聚合统计
- 来源：https://ddkk.com/zhuanlan/mq/kafka/2/18.html
- 分类：消息队列
- 分组：教程目录
在前一个示例的基础上，我们稍作修改实现一个基于固定时间窗口统计总和的例子。

### 一、项目需求

统计每30秒内，按照key分组的总值。topic收到的消息格式：key:a, value:1， 例如如果kafka topic 30秒（Tumbling Window， 也就是固定窗口）， 收到消息key:a, value:1， key:b, value:5， key:a, value:3， 统计结果为key：a为 4（1+3）， key：b为5.

### 二、主要代码

备注：我的kafka版本是kafka_2.12-1.0.0， 应用的kafka stream版本是1.0.2， 请大家注意版本差异。

```java
<dependency>
    <groupId>org.apache.kafka</groupId>
    <artifactId>kafka-streams</artifactId>
    <version>1.0.2</version>
</dependency>
```

项目依赖和第一篇相同。这里直接上代码，本示例代码还是在官方提供的代码基础上修改而来。

核心在于提供以下3参数：

**inal Initializer initializer** —提供初始化的值， 示例代码提供的初始值为0L

**final Aggregator aggregator** —怎么计算聚合， 我们key相同的值进行相加

**final Materialized> materialized**  —进行状态标记

KStream source = builder.stream(“iot-key”); —我们topic的内容为key:a, value:1这种格式

.groupByKey()—按照key来统计， 也就是key为a的算一组，key为b的算一组

.windowedBy(TimeWindows.of(TimeUnit.SECONDS.toMillis(TEMPERATURE_WINDOW_SIZE)))—时间窗口为30秒

KTable 最终的结果为key为Windowed类型，value为Long类型

```java
package com.yq;
import org.apache.kafka.clients.consumer.ConsumerConfig;
import org.apache.kafka.common.serialization.Serde;
import org.apache.kafka.common.serialization.Serdes;
import org.apache.kafka.common.utils.Bytes;
import org.apache.kafka.streams.KafkaStreams;
import org.apache.kafka.streams.StreamsBuilder;
import org.apache.kafka.streams.StreamsConfig;
import org.apache.kafka.streams.kstream.Aggregator;
import org.apache.kafka.streams.kstream.Initializer;
import org.apache.kafka.streams.kstream.KStream;
import org.apache.kafka.streams.kstream.KTable;
import org.apache.kafka.streams.kstream.Materialized;
import org.apache.kafka.streams.kstream.Produced;
import org.apache.kafka.streams.kstream.TimeWindows;
import org.apache.kafka.streams.kstream.Windowed;
import org.apache.kafka.streams.kstream.internals.WindowedDeserializer;
import org.apache.kafka.streams.kstream.internals.WindowedSerializer;
import org.apache.kafka.streams.state.WindowStore;
import java.util.Properties;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
/*
*  iot-key 输入的数据格式为，并且是在刚好在20秒的窗口被stream消费
*  key:a, value:1, key:b, value:5, key:b. value:7, key:a. value:2, key:a, value3. key:b, value:3，
*  iot-key-sum结果为，
*  key:a, value1, key:b, value:5, key:b, value:12(5+7)  key:a, value:3(1 + 2), key:a, value:(3+3)
*  , key:b, value:15
*
*  本代码为演示使用没有异常处理，如果输入的value不是数字，会出现NumberFormatException异常
*/
public class TempAggregationSumDemo {
    private static final int TEMPERATURE_WINDOW_SIZE = 30;
    public static void main(String[] args) throws Exception {
        Properties props = new Properties();
        props.put(StreamsConfig.APPLICATION_ID_CONFIG, "streams-key-sum");
        props.put(StreamsConfig.BOOTSTRAP_SERVERS_CONFIG, "localhost:9092");
        props.put(StreamsConfig.DEFAULT_KEY_SERDE_CLASS_CONFIG, Serdes.String().getClass());
        props.put(StreamsConfig.DEFAULT_VALUE_SERDE_CLASS_CONFIG, Serdes.String().getClass());
        props.put(ConsumerConfig.AUTO_OFFSET_RESET_CONFIG, "latest");
        props.put(StreamsConfig.CACHE_MAX_BYTES_BUFFERING_CONFIG, 0);
        StreamsBuilder builder = new StreamsBuilder();
        KStream<String, String> source = builder.stream("iot-key");
        //KStream是一个由键值对构成的抽象记录流，每个键值对是一个独立的单元，即使相同的Key也不会覆盖，类似数据库的插入操作
        KTable<Windowed<String>, Long> sumWindowed = source
                .groupByKey()
                .windowedBy(TimeWindows.of(TimeUnit.SECONDS.toMillis(TEMPERATURE_WINDOW_SIZE)))
                .aggregate(
                        new Initializer<Long>() {
                            @Override
                            public Long apply() {
                                return 0L;
                            }
                        },
                        new Aggregator<String, String, Long>() {
                            @Override
                            public Long apply(String aggKey, String newValue, Long aggValue) {
                                System.out.println("aggKey:" + aggKey+ ",  newValue:"  +  newValue +", aggKey:" + aggValue );
                                Long newValueLong = Long.valueOf(newValue);
                                long newSum = aggValue.longValue() + newValueLong.longValue();
                                return Long.valueOf(newSum);
                            }
                        },
                        Materialized.<String, Long, WindowStore<Bytes, byte[]>>as("time-windowed-aggregated-temp-stream-store")
                                .withValueSerde(Serdes.Long())
                );
        WindowedSerializer<String> windowedSerializer = new WindowedSerializer<>(Serdes.String().serializer());
        WindowedDeserializer<String> windowedDeserializer = new WindowedDeserializer<>(Serdes.String().deserializer(), TEMPERATURE_WINDOW_SIZE);
        Serde<Windowed<String>> windowedSerde = Serdes.serdeFrom(windowedSerializer, windowedDeserializer);;
        sumWindowed.toStream().to("iot-key-sum", Produced.with(windowedSerde, Serdes.Long()));
        final KafkaStreams streams = new KafkaStreams(builder.build(), props);
        final CountDownLatch latch = new CountDownLatch(1);
        // attach shutdown handler to catch control-c
        Runtime.getRuntime().addShutdownHook(new Thread("streams-key-shutdown-hook") {
            @Override
            public void run() {
                streams.close();
                latch.countDown();
            }
        });
        try {
            streams.start();
            latch.await();
        } catch (Throwable e) {
            System.exit(1);
        }
        System.exit(0);
    }
}
```

## 运行效果
