# 18、Kafka 源码解析 - Kafka与Flink集成
- 来源：https://ddkk.com/zhuanlan/mq/kafka/8/18.html
- 分类：消息队列
- 分组：教程目录
[Apache Flink](http://flink.apache.org/)是新一代的分布式流式数据处理框架，它统一的处理引擎既可以处理批数据(batch data)也可以处理流式数据(streaming data)。在实际场景中，Flink利用Apache Kafka作为上下游的输入输出十分常见，本文将给出一个可运行的实际例子来集成两者。

## 一、目标

本例模拟中将集成Kafka与Flink：Flink实时从Kafka中获取消息，每隔10秒去统计机器当前可用的内存数并将结果写入到本地文件中。

## 二、环境准备

- Apache Kafka 0.11.0.0
- Apache Flink 1.3.1
- Gradle 3.5 （版本号不是强要求）

本例运行在Windows环境，但可以很容易地移植到其他平台上。

## 三、创建Flink Streaming工程

本例使用Intellij IDEA作为项目开发的IDE。首先创建Gradle project，group为'huxihx.flink.demo'，artifact id为‘flink-kafka-demo’，version为‘1.0-SNAPSHOT’。整个项目结构如图所示：

## 四、增加kafka和kafka-connector依赖

增加下列gradle依赖：

```java
compile group: 'org.apache.flink', name: 'flink-connector-kafka-0.10_2.11', version: '1.3.1'
compile group: 'org.apache.flink', name: 'flink-streaming-java_2.11', version: '1.3.1'
compile group: 'org.apache.kafka', name: 'kafka-clients', version: '0.11.0.0'
```

设置gradle打包依赖

```java
jar {
    manifest {
        attributes(
                "Manifest-Version": 1.0,
                "Main-Class": "huxihx.KafkaMessageStreaming")
    }
    from { configurations.compile.collect { it.isDirectory() ? it : zipTree(it) } }
    into('assets') {
        from 'assets'
    }
}
```

## 五、启动Flink环境（本例使用local测试环境）

```java
F:\SourceCode\flink-1.3.1
> bin\start-local.bat
Starting Flink job manager. Webinterface by default on http://localhost:8081/.
Don't close this batch window. Stop job manager by pressing Ctrl+C.
```

## 六、启动Kafka单节点集群

启动Zookeeper：

```java
cd F:\SourceCode\zookeeper
> bin\zkServer.cmd
```

启动Kafka broker：

```java
> cd F:\SourceCode\kafka_1
> set JMX_PORT=9999 
> bin\windows\kafka-server-start.bat F:\\SourceCode\\configs\\server.properties
```

## 七、代码开发

代码主要由两部分组成：

- MessageSplitter类、MessageWaterEmitter类和KafkaMessageStreaming类：Flink streaming实时处理Kafka消息类
- KafkaProducerTest类和MemoryUsageExtrator类：构建Kafka测试消息

本例中，Kafka消息格式固定为：时间戳,主机名,当前可用内存数。其中主机名固定设置为machine-1，而时间戳和当前可用内存数都是动态获取。由于本例只会启动一个Kafka producer来模拟单台机器发来的消息，因此在最终的统计结果中只会统计machine-1这一台机器的内存。下面我们先来看flink部分的代码实现。

**MessageSplitter类（将获取到的每条Kafka消息根据“，”分割取出其中的主机名和内存数信息）**

```java
public class MessageSplitter implements FlatMapFunction<String, Tuple2<String, Long>> {
    @Override
    public void flatMap(String value, Collector<Tuple2<String, Long>> out) throws Exception {
        if (value != null && value.contains(",")) {
            String[] parts = value.split(",");
            out.collect(new Tuple2<>(parts[1], Long.parseLong(parts[2])));
        }
    }
}
```

**MessageWaterEmitter类（根据Kafka消息确定Flink的水位）**

```java
public class MessageWaterEmitter implements AssignerWithPunctuatedWatermarks<String> {
    @Nullable
    @Override
    public Watermark checkAndGetNextWatermark(String lastElement, long extractedTimestamp) {
        if (lastElement != null && lastElement.contains(",")) {
            String[] parts = lastElement.split(",");
            return new Watermark(Long.parseLong(parts[0]));
        }
        return null;
    }
    @Override
    public long extractTimestamp(String element, long previousElementTimestamp) {
        if (element != null && element.contains(",")) {
            String[] parts = element.split(",");
            return Long.parseLong(parts[0]);
        }
        return 0L;
    }
}
```

**KafkaMessageStreaming类（Flink入口类，封装了对于Kafka消息的处理逻辑。本例每10秒统计一次结果并写入到本地文件）**

```java
public class KafkaMessageStreaming {
    public static void main(String[] args) throws Exception {
        final StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();
        env.enableCheckpointing(5000); // 非常关键，一定要设置启动检查点！！
        env.setStreamTimeCharacteristic(TimeCharacteristic.EventTime);
        Properties props = new Properties();
        props.setProperty("bootstrap.servers", "localhost:9092");
        props.setProperty("group.id", "flink-group");
        FlinkKafkaConsumer010<String> consumer =
                new FlinkKafkaConsumer010<>(args[0], new SimpleStringSchema(), props);
        consumer.assignTimestampsAndWatermarks(new MessageWaterEmitter());
        DataStream<Tuple2<String, Long>> keyedStream = env
                .addSource(consumer)
                .flatMap(new MessageSplitter())
                .keyBy(0)
                .timeWindow(Time.seconds(10))
                .apply(new WindowFunction<Tuple2<String, Long>, Tuple2<String, Long>, Tuple, TimeWindow>() {
                    @Override
                    public void apply(Tuple tuple, TimeWindow window, Iterable<Tuple2<String, Long>> input, Collector<Tuple2<String, Long>> out) throws Exception {
                        long sum = 0L;
                        int count = 0;
                        for (Tuple2<String, Long> record: input) {
                            sum += record.f1;
                            count++;
                        }
                        Tuple2<String, Long> result = input.iterator().next();
                        result.f1 = sum / count;
                        out.collect(result);
                    }
                });
        keyedStream.writeAsText(args[1]);
        env.execute("Flink-Kafka demo");
    }
}
```

实现了这些代码之后我们已然可以打包进行部署了，不过在其之前我们先看下Kafka producer测试类的实现——该类每1秒发送一条符合上面格式的Kafka消息供下游Flink集群消费。

**MemoryUsageExtrator类（很简单的工具类，提取当前可用内存字节数）**

```java
public class MemoryUsageExtrator {
    private static OperatingSystemMXBean mxBean =
            (OperatingSystemMXBean) ManagementFactory.getOperatingSystemMXBean();
    /**
     * Get current free memory size in bytes
     * @return  free RAM size
     */
    public static long currentFreeMemorySizeInBytes() {
        return mxBean.getFreePhysicalMemorySize();
    }
}
```

KafkaProducerTest类（发送Kafka消息）

```java
public class KafkaProducerTest {
    public static void main(String[] args) throws Exception {
        Properties props = new Properties();
        props.put("bootstrap.servers", "localhost:9092");
        props.put("acks", "all");
        props.put("retries", 0);
        props.put("batch.size", 16384);
        props.put("linger.ms", 1);
        props.put("buffer.memory", 33554432);
        props.put("key.serializer", "org.apache.kafka.common.serialization.StringSerializer");
        props.put("value.serializer", "org.apache.kafka.common.serialization.StringSerializer");
        Producer<String, String> producer = new KafkaProducer<>(props);
        int totalMessageCount = 10000;
        for (int i = 0; i < totalMessageCount; i++) {
            String value = String.format("%d,%s,%d", System.currentTimeMillis(), "machine-1", currentMemSize());
            producer.send(new ProducerRecord<>("test", value), new Callback() {
                @Override
                public void onCompletion(RecordMetadata metadata, Exception exception) {
                    if (exception != null) {
                        System.out.println("Failed to send message with exception " + exception);
                    }
                }
            });
            Thread.sleep(1000L);
        }
        producer.close();
    }
    private static long currentMemSize() {
        return MemoryUsageExtrator.currentFreeMemorySizeInBytes();
    }
}
```

## 八、部署Flink jar包

## 1. 打包Flink jar包

```java
> cd flink-kafka-demo
> gradle clean build
```

生成的jar包在项目目录下的build/libs/下，本例中是flink-kafka-demo-1.0-SNAPSHOT.jar

## 2. 部署jar包

```java
> bin\flink.bat run -c huxihx.KafkaMessageStreaming  F:\\Projects\\flink-kafka-demo\\build\\libs\\flink-kafka-demo-1.0-SNAPSHOT.jar test F:\\temp\result.txt　　
```

KafkaMessageStreaming类接收两个命令行参数，第一个是Kafka topic名字，第二个是输出文件路径

部署成功之后，可以在Flink控制台(本例中是http://localhost:8081/)中看到job已成功部署，如下图所示：

## 3. 运行KafkaProducerTest

运行Kafka producer，给Flink job创建输入数据，然后启动一个终端，监控输出文件的变化，

```java
> cd F:\temp
> tail -f result.txt
(machine-1,3942129078)
(machine-1,3934864179)
(machine-1,4044071321)
(machine-1,4091437056)
(machine-1,3925701836)
(machine-1,3753678438)
(machine-1,3746314649)
......
```

可以看到，Flink每隔10s就会保存一条新的统计记录到result.txt文件中，该记录会统计主机名为machine-1的机器在过去10s的平均可用内存字节数。

## 总结

本文给出了一个可运行的Flink + Kafka的项目配置及代码实现。值得注意的是，上面例子中用到的Flink Kafka connector使用了Kafka新版本consumer的API，因此不再需要连接Zookeeper信息。
