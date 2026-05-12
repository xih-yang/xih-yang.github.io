# 19、Kafka 实战 - Kafka Streams 自定义Serde
- 来源：https://ddkk.com/zhuanlan/mq/kafka/2/19.html
- 分类：消息队列
- 分组：教程目录
前面两篇的代码中，很多人看到最终的计算结果是通过Serdes.Long()或者 Serdes.String()像是写入到topic中。于是有人问，能否将计算结果按照自定义格式写入topic中？比如自定义的某个类。答案是当然可以。下面就以一个简单的case为例，介绍如何自定义Serdes。

**注意**：示例中的代码只是展示流程，非生产代码，仅供参考。

官方文档在这里，我用是kafka 1.0. 所以连接也是1.0版本的文档。 [http://kafka.apache.org/10/documentation/streams/developer-guide/datatypes.html](http://kafka.apache.org/10/documentation/streams/developer-guide/datatypes.html)

## 项目需求

统计一分钟内（固定时间窗口Tumbling Window）内温度的总和与平均值。类似的还有，最大值，最小值。

## 主要流程和代码

一个结果中必须同时含有总和与平均值，于是我们设计一个简单数据结构

```java
@Data
@AllArgsConstructor
public class Statistics {
    private Long avg;
    private Long sum;
    private Long count;
}
```

根据Serdes的要求，我们必须提供对应的Serializer和Deserializer。

参考SerdeLongSerde实现

```java
public static final class LongSerde extends Serdes.WrapperSerde<Long> {
    public LongSerde() {
        super(new LongSerializer(), new LongDeserializer());
    }
}
```

我们需要实现StatisticsSerializer和StatisticsDeserializer。仍然才考LongSerializer和LongDeserializer的实现， 我们实现了StatisticsSerializer和StatisticsDeserializer。

首先是序列化实现

```java
package com.yq.customized;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.apache.kafka.common.serialization.Serializer;
import java.util.Map;
@Slf4j
public class StatisticsSerializer implements Serializer<Statistics> {
    private static final ObjectMapper jsonMapper = new ObjectMapper();
    @Override
    public void configure(Map map, boolean b) {
    }
    @Override
    public byte[] serialize(String s, Statistics obj) {
        try {
            return jsonMapper.writeValueAsBytes(obj);
        }
        catch (Exception ex){
            log.error("jsonSerialize exception.", ex);
            return null;
        }
    }
    @Override
    public void close() {
    }
}
```

其次是反序列化实现

```java
package com.yq.customized;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.apache.kafka.common.serialization.Serializer;
import java.util.Map;
@Slf4j
public class StatisticsSerializer implements Serializer<Statistics> {
    private static final ObjectMapper jsonMapper = new ObjectMapper();
    @Override
    public void configure(Map map, boolean b) {
    }
    @Override
    public byte[] serialize(String s, Statistics obj) {
        try {
            return jsonMapper.writeValueAsBytes(obj);
        }
        catch (Exception ex){
            log.error("jsonSerialize exception.", ex);
            return null;
        }
    }
    @Override
    public void close() {
    }
}
```

最后是我们的主流程。 kTable的格式是 KTable。 aggregate函数的初始值和返回都是Statistics类型， 结果存储的格式Materialized.>as(“time-windowed-aggregated-temp-stream-store”)

.withValueSerde(Serdes.serdeFrom(new StatisticsSerializer(), new StatisticsDeserializer())) ， 也是Statistics

```java
package com.yq.customized;
import com.alibaba.fastjson.JSON;
import com.alibaba.fastjson.JSONObject;
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
import org.apache.kafka.streams.kstream.KeyValueMapper;
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
/**
 * 统计60秒内，温度值的最大值  topic中的消息格式为数字，30， 21或者{"temp":19, "humidity": 25}
 */
public class TemperatureAvgDemo {
    private static final int TEMPERATURE_WINDOW_SIZE = 60;
    public static void main(String[] args) throws Exception {
        Properties props = new Properties();
        props.put(StreamsConfig.APPLICATION_ID_CONFIG, "streams-temp-avg");
        props.put(StreamsConfig.BOOTSTRAP_SERVERS_CONFIG, "127.0.0.1:9092");
        props.put(StreamsConfig.DEFAULT_KEY_SERDE_CLASS_CONFIG, Serdes.String().getClass());
        props.put(StreamsConfig.DEFAULT_VALUE_SERDE_CLASS_CONFIG, Serdes.String().getClass());
        props.put(ConsumerConfig.AUTO_OFFSET_RESET_CONFIG, "earliest");
        props.put(StreamsConfig.CACHE_MAX_BYTES_BUFFERING_CONFIG, 0);
        StreamsBuilder builder = new StreamsBuilder();
        KStream<String, String> source = builder.stream("iot-temp");
        KTable<Windowed<String>, Statistics> max = source
                .selectKey(new KeyValueMapper<String, String, String>() {
                    @Override
                    public String apply(String key, String value) {
                        return "stat";
                    }
                })
                .groupByKey()
                .windowedBy(TimeWindows.of(TimeUnit.SECONDS.toMillis(TEMPERATURE_WINDOW_SIZE)))
                .aggregate(
                        new Initializer<Statistics>() {
                            @Override
                            public Statistics apply() {
                                Statistics avgAndSum = new Statistics(0L,0L,0L);
                                return avgAndSum;
                            }
                        },
                        new Aggregator<String, String, Statistics>() {
                            @Override
                            public Statistics apply(String aggKey, String newValue, Statistics aggValue) {
                                //topic中的消息格式为{"temp":19, "humidity": 25}
                                System.out.println("aggKey:" + aggKey + ",  newValue:" + newValue + ", aggKey:" + aggValue);
                                Long newValueLong = null;
                                try {
                                    JSONObject json = JSON.parseObject(newValue);
                                    newValueLong = json.getLong("temp");
                                }
                                catch (ClassCastException ex) {
                                     newValueLong = Long.valueOf(newValue);
                                }
                                aggValue.setCount(aggValue.getCount() + 1);
                                aggValue.setSum(aggValue.getSum() + newValueLong);
                                aggValue.setAvg(aggValue.getSum() / aggValue.getCount());
                                return aggValue;
                            }
                        },
                        Materialized.<String, Statistics, WindowStore<Bytes, byte[]>>as("time-windowed-aggregated-temp-stream-store")
                                .withValueSerde(Serdes.serdeFrom(new StatisticsSerializer(), new StatisticsDeserializer()))
                );
        WindowedSerializer<String> windowedSerializer = new WindowedSerializer<>(Serdes.String().serializer());
        WindowedDeserializer<String> windowedDeserializer = new WindowedDeserializer<>(Serdes.String().deserializer(), TEMPERATURE_WINDOW_SIZE);
        Serde<Windowed<String>> windowedSerde = Serdes.serdeFrom(windowedSerializer, windowedDeserializer);
        max.toStream().to("iot-temp-stat", Produced.with(windowedSerde, Serdes.serdeFrom(new StatisticsSerializer(), new StatisticsDeserializer())));
        final KafkaStreams streams = new KafkaStreams(builder.build(), props);
        final CountDownLatch latch = new CountDownLatch(1);
        Runtime.getRuntime().addShutdownHook(new Thread("streams-temperature-shutdown-hook") {
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

## 效果截图

图中已经有文字说明，结合代码能更清楚了解Kafka Stream。
