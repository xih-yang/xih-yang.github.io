# 43、Flink报错案例 2-提交到yarn集群报错java.lang.NoClassDefFoundError FlinkKafkaConsumer
- 来源：https://ddkk.com/zhuanlan/bigdata/flink/2/43.html
- 分类：大数据框架
- 分组：教程目录
## 一、问题描述

**环境介绍:**

CDH6.3.1集群

Flink版本 1.9.0

Kafka版本 2.12

本地运行无问题，提交到yarn集群报错

**代码:**

```java
package org.example;
/*
 * @remark  Flink Souce之Kafka
 */
import org.apache.flink.api.common.serialization.SimpleStringSchema;
import org.apache.flink.streaming.api.datastream.DataStream;
import org.apache.flink.streaming.api.environment.StreamExecutionEnvironment;
import org.apache.flink.streaming.connectors.kafka.FlinkKafkaConsumer;
import java.util.Properties;
import org.apache.flink.streaming.connectors.kafka.FlinkKafkaConsumerBase;
public class SourceTest3_Kafka {
    public static void main(String[] args) throws Exception{
        StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();
        env.setParallelism(1);
        Properties properties = new Properties();
        properties.setProperty("bootstrap.servers", "10.31.1.124:9092,10.31.1.125:9092,10.31.1.126:9092");
        properties.setProperty("group.id", "consumer-group");
        properties.setProperty("key.deserializer", "org.apache.kafka.common.serialization.StringDeserializer");
        properties.setProperty("value.deserializer", "org.apache.kafka.common.serialization.StringDeserializer");
        properties.setProperty("auto.offset.reset", "latest");
        // 从Kafka读取数据
        DataStream<String> dataStream = env.addSource( new FlinkKafkaConsumer<String>("sensor3", new SimpleStringSchema(), properties));
        // 打印输出
        dataStream.print();
        env.execute();
    }
}
```

**打包并上传到Flink Job Manager所在的服务器**

```java
flink run -m yarn-cluster -c org.example.SourceTest3_Kafka FlinkStudy-1.0-SNAPSHOT.jar
```

运行报错:

java.lang.NoClassDefFoundError: org/apache/flink/streaming/connectors/kafka/FlinkKafkaConsumer

## 二、解决方案

网上找了一圈，有的说是代码的问题，有的说是maven依赖的问题，有的说是需要将依赖的jar包手工上传到 远程服务器Flink的home/lib目录下。

## 2.1 代码的问题？

代码问题可以排除，本地运行无问题，而提交到远程集群报错，可以排除代码问题。

## 2.2 maven依赖的问题

第二种maven依赖有问题，因为maven是从官网拷贝过来的，所以这个也可以排除。

还有的说是Kafka和Flink的版本不兼容，导致依赖冲突了。

查询了Kafka和Flink的官网，我所使用的版本是没问题的。

## 2.3 手工上传jar包

那么只剩下第三种方案了，就是把相关的jar文件上传到服务器。

### 2.3.1 上传FlinkKafkaConsumer相关的jar包

因为报错是报缺少 FlinkKafkaConsumer这个class，所以找到maven下面对应的包含该class的jar文件

jar包在这个下面

找到对应class对应的jar文件，上传到远程Flink集群的lib目录下

再次运行程序，报错java.lang.NoClassDefFoundError: org/apache/flink/streaming/connectors/kafka/FlinkKafkaConsumerBase

### 2.3.2 上传FlinkKafkaConsumerBase相关的jar包

我们可以看到，这个class和上一步的class前面的路径都相同，只有最后的class名不同。

我理解的应该在同一个jar文件上，但是运行报错了，就否定了我的猜想，通过包下的不同class，在不同的jar文件下，这个确实有点让人费解。

把下面jar包也上传到Flink集群的lib目录下

重新运行成功。
