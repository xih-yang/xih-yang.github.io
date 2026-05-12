# 05、Flink 笔记 - source源
- 来源：https://ddkk.com/zhuanlan/bigdata/flink/5/5.html
- 分类：大数据框架
- 分组：教程目录
## 一、source from collection

## 1.1、数据源类

```java
public class SensorReading {
    // 传感器 id
    private String id;
    // 传感器时间戳
    private Long timestamp;
    // 传感器温度
    private Double temperature;
    public SensorReading() {
    }
    public SensorReading(String id, Long timestamp, Double temperature) {
        this.id = id;
        this.timestamp = timestamp;
        this.temperature = temperature;
    }
    public String getId() {
        return id;
    }
    public void setId(String id) {
        this.id = id;
    }
    public Long getTimestamp() {
        return timestamp;
    }
    public void setTimestamp(Long timestamp) {
        this.timestamp = timestamp;
    }
    public Double getTemperature() {
        return temperature;
    }
    public void setTemperature(Double temperature) {
        this.temperature = temperature;
    }
    @Override
    public String toString() {
        return "SensorReading{" +
                "id='" + id + '\'' +
                ", timestamp=" + timestamp +
                ", temperature=" + temperature +
                '}';
    }
}
```

## 1.2、读取数据

```java
import com.tan.flink.bean.SensorReading;
import org.apache.flink.streaming.api.datastream.DataStream;
import org.apache.flink.streaming.api.environment.StreamExecutionEnvironment;
import java.util.Arrays;
public class SourceFromCollection {
    public static void main(String[] args) throws Exception{
        StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();
        DataStream<SensorReading> inputDataStream = env.fromCollection(Arrays.asList(
                new SensorReading("sensor_1", 1547718199L, 35.8),
                new SensorReading("sensor_6", 1547718201L, 15.4),
                new SensorReading("sensor_7", 1547718202L, 6.7),
                new SensorReading("sensor_10", 1547718205L, 38.1)
        ));
        inputDataStream.print();
        env.execute();
    }
}
```

## 二、source from file

```java
env.readTextFile(path);
```

## 三、source from kafka

## 3.1、pom 依赖

```java
<dependency>
            <groupId>org.apache.flink</groupId>
            <artifactId>flink-connector-kafka-0.11_2.12</artifactId>
            <version>1.10.1</version>
        </dependency>
```

## 3.2、代码

```java
import org.apache.flink.api.common.serialization.SimpleStringSchema;
import org.apache.flink.streaming.api.datastream.DataStreamSource;
import org.apache.flink.streaming.api.environment.StreamExecutionEnvironment;
import org.apache.flink.streaming.connectors.kafka.FlinkKafkaConsumer011;
import java.util.Properties;
public class SourceFromKafka {
    public static void main(String[] args) throws Exception {
        StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();
        // kafka 配置
        Properties properties = new Properties();
        properties.setProperty("bootstrap.servers", "192.168.200.102:9092,192.168.200.102:9092,192.168.200.104:9092");
        properties.setProperty("group.id", "flink-kafka");
        properties.setProperty("key.deserializer",
                "org.apache.kafka.common.serialization.StringDeserializer");
        properties.setProperty("value.deserializer",
                "org.apache.kafka.common.serialization.StringDeserializer");
        properties.setProperty("auto.offset.reset", "latest");
        DataStreamSource<String> inputDataStream = env.addSource(new FlinkKafkaConsumer011<String>(
                "sensor",
                new SimpleStringSchema(),
                properties
        ));
        inputDataStream.print();
        env.execute();
    }
}
```

## 四、custom source

需要实现SourceFunction 或者继承SourceFunction的富函数RichSourceFunction

```java
import com.tan.flink.bean.SensorReading;
import org.apache.flink.streaming.api.datastream.DataStreamSource;
import org.apache.flink.streaming.api.environment.StreamExecutionEnvironment;
import org.apache.flink.streaming.api.functions.source.SourceFunction;
import java.util.Random;
import java.util.UUID;
public class SourceFromCustom {
    public static void main(String[] args) throws Exception {
        StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();
        DataStreamSource<SensorReading> inputDataStream = env.addSource(new CustomSource());
        inputDataStream.print();
        env.execute();
    }
    public static class CustomSource implements SourceFunction<SensorReading> {
        boolean running = true;
        @Override
        public void run(SourceContext<SensorReading> sourceContext) throws Exception {
            Random random = new Random();
            while (running) {
                // 每隔 100 秒数据
                for (int i = 0; i < 5; i++) {
                    String id = UUID.randomUUID().toString().substring(0, 8);
                    long timestamp = System.currentTimeMillis();
                    double temperature = 60 + random.nextGaussian() * 20;
                    sourceContext.collect(new SensorReading(id, timestamp, temperature));
                    Thread.sleep(100L);
                }
                Thread.sleep(1000L);
            }
        }
        @Override
        public void cancel() {
            running = false;
        }
    }
}
```
