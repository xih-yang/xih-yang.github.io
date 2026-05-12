# 17、Kafka 实战 - Kafka Streams 示例 TemperatureDemo
- 来源：https://ddkk.com/zhuanlan/mq/kafka/2/17.html
- 分类：消息队列
- 分组：教程目录
最近想统计一些消息数据，原计划接收kakfa消息后自行统计然后存入数据库（统计相对比较简单，所以没有考虑使用Apache Storm）， 突然想起来Kafka已经提供Kakfa Stream功能，于是开始看Kafka Stream。 下面的例子非常简单，只是在Kafka提供的例子上做了一点修改。

## 添加依赖

因为我们使用的Kafka Stream所以添加的依赖是kafka-streams， 不是以前经常使用的kafka-clients.

我的kafka安装在Windows 10上面（为了方便测试，平时在公司时可以直接连接到Kafka集群，开发时先在本地运行，于是在Windows10上安装了Kafka）。 版本kafka_2.12-1.0.0

```java
<dependency>
    <groupId>org.apache.kafka</groupId>
    <artifactId>kafka-streams</artifactId>
    <version>1.0.2</version>
</dependency>
```

## 主要代码

官方示例的代码在[`这里](https://github.com/apache/kafka/blob/1.0/streams/examples/src/main/java/org/apache/kafka/streams/examples/temperature/TemperatureDemo.java)

官方示例中向topic直接发送了温度数据。 我修改一下。 向topic发送json格式的数据，里面包含了温度和湿度。例如 {“temp”:19, “humidity”: 25}

注意：该代码只在官方示例上修该数据格式，其他部分和官方示例一样。启动程序后直接向topic iot-temperature发送格式为{“temp”:19, “humidity”: 25}的消息即可看到运行效果。

```java
public class TemperatureDemo {
    // threshold used for filtering max temperature values
    private static final int TEMPERATURE_THRESHOLD = 20;
    // window size within which the filtering is applied
    private static final int TEMPERATURE_WINDOW_SIZE = 5;
    public static void main(String[] args) throws Exception {
        Properties props = new Properties();
        props.put(StreamsConfig.APPLICATION_ID_CONFIG, "streams-temperature");
        props.put(StreamsConfig.BOOTSTRAP_SERVERS_CONFIG, "localhost:9092");
        props.put(StreamsConfig.DEFAULT_KEY_SERDE_CLASS_CONFIG, Serdes.String().getClass());
        props.put(StreamsConfig.DEFAULT_VALUE_SERDE_CLASS_CONFIG, Serdes.String().getClass());
        props.put(ConsumerConfig.AUTO_OFFSET_RESET_CONFIG, "earliest");
        props.put(StreamsConfig.CACHE_MAX_BYTES_BUFFERING_CONFIG, 0);
        StreamsBuilder builder = new StreamsBuilder();
        //从topic iot-temperature读取设备发送的传感器信息
        KStream<String, String> source = builder.stream("iot-temperature");
        KStream<Windowed<String>, String> max = source
                // temperature values are sent without a key (null), so in order
                // to group and reduce them, a key is needed ("temp" has been chosen)
                .selectKey(new KeyValueMapper<String, String, String>() {
                    @Override
                    public String apply(String key, String value) {
                        return "temp";
                    }
                })
                .groupByKey()
                .windowedBy(TimeWindows.of(TimeUnit.SECONDS.toMillis(TEMPERATURE_WINDOW_SIZE)))
                .reduce(new Reducer<String>() {
                    @Override
                    public String apply(String value1, String value2) {
                        System.out.println("value1=" + value1+ ", value2=" + value2);
                        JSONObject json = JSON.parseObject(value1);
                        Integer temperature = json.getInteger("temp");
                        if (temperature > Integer.parseInt(value2)) {
                            return temperature.toString();
                        }
                        else {
                            return value2;
                        }
                    }
                })
                .toStream()
                //过滤条件就是温度大于20
                .filter(new Predicate<Windowed<String>, String>() {
                    @Override
                    public boolean test(Windowed<String> key, String value) {
                        System.out.println("key=" + key+ ", value=" + value);
                        JSONObject json = JSON.parseObject(value);
                        Integer temperature = json.getInteger("temp");
                        return temperature > TEMPERATURE_THRESHOLD;
                    }
                });
        WindowedSerializer<String> windowedSerializer = new WindowedSerializer<>(Serdes.String().serializer());
        WindowedDeserializer<String> windowedDeserializer = new WindowedDeserializer<>(Serdes.String().deserializer(), TEMPERATURE_WINDOW_SIZE);
        Serde<Windowed<String>> windowedSerde = Serdes.serdeFrom(windowedSerializer, windowedDeserializer);
        // need to override key serde to Windowed<String> type
        max.to("iot-temperature-max", Produced.with(windowedSerde, Serdes.String()));
        final KafkaStreams streams = new KafkaStreams(builder.build(), props);
        final CountDownLatch latch = new CountDownLatch(1);
        // attach shutdown handler to catch control-c
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

## 运行结果

Stream运行结果存放在topic iot-temperature-max中， 我们查看该topic的数据。 只有大于TEMPERATURE_THRESHOLD （20）被存入该topic
