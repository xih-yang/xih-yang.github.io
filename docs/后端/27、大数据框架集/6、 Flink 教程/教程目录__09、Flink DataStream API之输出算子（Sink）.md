# 09、Flink DataStream API之输出算子（Sink）
- 来源：https://ddkk.com/zhuanlan/bigdata/flink/1/9.html
- 分类：大数据框架
- 分组：教程目录
## 概述

Flink 作为数据处理框架，最终还是要把计算处理的结果写入外部存储，为外部应用提供支持，如图所示，本节将主要讲解Flink中的Sink操作。之前已经了解Flink程序如何对数据进行读取、转换等操作，最后一步当然就应该将结果数据保存或输出到外部系统了。

在Flink中，如果希望将数据写入外部系统，其实并不是一件难事。所有算子都可以通过实现函数类来自定义处理逻辑，所以只要有读写客户端，与外部系统的交互在任何一个处理算子中都可以实现。例如在MapFunction中，完全可以构建一个到Redis的连接，然后将当前处理的结果保存到Redis中。如果考虑到只需建立一次连接，也可以利用RichMapFunction，在open()生命周期中做连接操作。这样看起来很方便，却会带来很多问题。Flink作为一个快速的分布式实时流处理系统，对稳定性和容错性要求极高。一旦出现故障，应该有能力恢复之前的状态，保障处理结果的正确性。这种性质一般被称作“状态一致性”。Flink内部提供了一致性检查点（checkpoint）来保障可以回滚到正确的状态；但如果在处理过程中任意读写外部系统，发生故障后就很难回退到从前了。为了避免这样的问题，Flink的DataStreamAPI专门提供了向外部写入数据的方法：**addSink**。

与addSource类似，addSink方法对应着一个“Sink”算子，主要就是用来实现与外部系统连接、并将数据提交写入的；Flink程序中所有对外的输出操作，一般都是利用Sink算子完成的。

Sink一词有“下沉”的意思，有些资料会相对于“数据源”把它翻译为“数据汇”。不论怎样理解，Sink在Flink中代表了将结果数据收集起来、输出到外部的意思，所以这里统一把它直观地叫作“输出算子”。

之前一直在使用的print方法其实就是一种Sink，它表示将数据流写入标准控制台打印输出。查看源码可以发现，print方法返回的就是一个DataStreamSink。

```java
    public DataStreamSink<T> print() {
        PrintSinkFunction<T> printFunction = new PrintSinkFunction<>();
        return addSink(printFunction).name("Print to Std. Out");
    }
```

与Source算子非常类似，除去一些Flink预实现的Sink，一般情况下Sink算子的创建是通过调用DataStream的.addSink()方法实现的。

```java
stream.addSink(new SinkFunction(…));\
```

addSource的参数需要实现一个SourceFunction接口；类似地，addSink方法同样需要传入 一个参数，实现的是SinkFunction接口。在这个接口中只需要重写一个方法invoke(),用来将指定的值写入到外部系统中。这个方法在每条数据记录到来时都会调用：

```java
default void invoke(IN value, Context context) throws Exception
```

当然，SinkFuntion多数情况下同样并不需要自己实现。Flink官方提供了一部分的框架的Sink连接器。Flink官方目前支持的第三方系统连接器：

可以看到，像Kafka之类流式系统，Flink提供了完美对接，source/sink 两端都能连接，可读可写；而对于Elasticsearch、文件系统（FileSystem）、JDBC等数据存储系统，则只提供了输出写入的sink连接器。 除Flink官方之外，Apache Bahir作为给Spark和Flink提供扩展支持的项目，也实现了一些其他第三方系统与 Flink 的连接器

除此以外，就需要自定义实现sink连接器了。下面选取一些常见的外部系统进行学习；

## 一、输出到文件

最简单的输出方式，当然就是写入文件了。对应读取文件作为输入数据源，Flink本来也有一些非常简单粗暴的输出到文件的预实现方法：如writeAsText()、writeAsCsv()，可以直接将输出结果保存到文本文件或Csv文件。但是，这种方式是不支持同时写入一份文件的；所以往往会将最后的Sink操作并行度设为1，这就大大拖慢了系统效率；而且对于故障恢复后的状态一致性，也没有任何保证。所以目前这些简单的方法已经要被弃用。 Flink为此专门提供了一个流式文件系统的连接器：**StreamingFileSink**，它继承自抽象类**RichSinkFunction**，而且集成了Flink的检查点（checkpoint）机制，用来保证精确一次（exactly once）的一致性语义。 StreamingFileSink为批处理和流处理提供了一个统一的Sink，它可以将分区文件写入Flink支持的文件系统。它可以保证精确一次的状态一致性，大大改进了之前流式文件 Sink 的方式。 它的主要操作是将数据写入桶（buckets），每个桶中的数据都可以分割成一个个大小有限的分区文件，这样一来就实现真正意义上的分布式文件存储。可以通过各种配置来控制“分桶” 的操作；默认的分桶方式是基于时间的，每小时写入一个新的桶。换句话说，每个桶内保存的文件，记录的都是1小时的输出数据。

StreamingFileSink支持行编码（Row-encoded）和批量编码（Bulk-encoded，比如Parquet） 格式。这两种不同的方式都有各自的构建器（builder），调用方法也非常简单，可以直接调用 StreamingFileSink 的静态方法：

- 行编码：StreamingFileSink.forRowFormat（basePath，rowEncoder）。
- 批量编码：StreamingFileSink.forBulkFormat（basePath，bulkWriterFactory）。

在创建行或批量编码Sink 时，需要传入两个参数，用来指定存储桶的基本路径（basePath）和数据的编码逻辑（rowEncoder或bulkWriterFactory）。

> 示例代码

```java
package com.kunan.StreamAPI.Sink;
import com.kunan.StreamAPI.Source.Event;
import org.apache.flink.api.common.serialization.SimpleStringEncoder;
import org.apache.flink.core.fs.Path;
import org.apache.flink.streaming.api.datastream.DataStreamSource;
import org.apache.flink.streaming.api.environment.StreamExecutionEnvironment;
import org.apache.flink.streaming.api.functions.sink.filesystem.StreamingFileSink;
import org.apache.flink.streaming.api.functions.sink.filesystem.rollingpolicies.DefaultRollingPolicy;
import java.util.concurrent.TimeUnit;
public class SinkToFileTest {
    public static void main(String[] args) throws Exception {
        StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();
        env.setParallelism(4);
        DataStreamSource<Event> Stream = env.fromElements(
                new Event("Mary", "./home", 1000L),
                new Event("Bob", "./cart", 1500L),
                new Event("Alice", "./prod?id=100", 1800L),
                new Event("Bob", "./prod?id=1", 2000L),
                new Event("Alice", "./prod?id=200", 3000L),
                new Event("Bob", "./home", 2500L),
                new Event("Bob", "./prod?id=120", 3600L),
                new Event("Bob", "./prod?id=130", 4000L)
        );
        StreamingFileSink<String> stringStreamingFileSink = StreamingFileSink.<String>forRowFormat(new Path("./OutPut"),
                new SimpleStringEncoder<>("UTF-8"))
                .withRollingPolicy(
                      DefaultRollingPolicy.builder()
                              .withMaxPartSize(1024 * 1024 * 1024)
                              .withRolloverInterval(TimeUnit.MINUTES.toMillis(15))
                              .withInactivityInterval(TimeUnit.MINUTES.toMillis(5))
                              .build()
                )
                .build();
        Stream.map(data -> data.toString())
                .addSink(stringStreamingFileSink);
        env.execute();
    }
}
```

这里创建了一个简单的文件Sink，通过.withRollingPolicy()方法指定了一个“滚动策略”。

“滚动”的概念在日志文件的写入中经常遇到：因为文件会有内容持续不断地写入，所以应该给一个标准，到什么时候就开启新的文件，将之前的内容归档保存。也就是说，上面的代码设置了在以下3种情况下，就会滚动分区文件：

- 至少包含15 分钟的数据;
- 最近 5 分钟没有收到新的数据;
- 文件大小已达到1GB;

## 二、输出到Kafka

Kafka是一个分布式的基于发布/订阅的消息系统，本身处理的也是流式数据，所以和Flink是“天生一对”，经常会作为Flink的输入数据源和输出系统。Flink官方为Kafka提供了Source和Sink的连接器，可以用它方便地从Kafka 读写数据。

如果仅仅是支持读写，那还说明不了Kafka和Flink关系的亲密；真正让它们密不可分的是，**Flink与Kafka的连接器提供了端到端的精确一次（exactly once）语义保证**，这在实际项目中是最高级别的一致性保证。(后续章节做详细说明)。

现在要将数据输出到Kafka，整个数据处理的闭环已经形成，所以可以完整测试如下：

添加Kafka连接器依赖：由于之前已经测试过从Kafka数据源读取数据，连接器相关依赖已经引入。

启动 Kafka 集群（见源算子章节）;

编写输出到Kafka的示例代码

> 示例代码

```java
package com.kunan.StreamAPI.Sink;
import com.kunan.StreamAPI.Source.Event;
import org.apache.flink.api.common.functions.MapFunction;
import org.apache.flink.api.common.serialization.SimpleStringSchema;
import org.apache.flink.streaming.api.datastream.DataStreamSource;
import org.apache.flink.streaming.api.datastream.SingleOutputStreamOperator;
import org.apache.flink.streaming.api.environment.StreamExecutionEnvironment;
import org.apache.flink.streaming.connectors.kafka.FlinkKafkaConsumer;
import org.apache.flink.streaming.connectors.kafka.FlinkKafkaProducer;
import java.util.Properties;
public class SinkToKafka {
    public static void main(String[] args) throws Exception {
        StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();
        env.setParallelism(1);
        //1.从Kafka读取数据
        Properties properties = new Properties();
        properties.setProperty("bootstrap.servers", "hadoop102:9092");
        DataStreamSource<String> kafkaStream = env.addSource(new FlinkKafkaConsumer<String>("clicks", new SimpleStringSchema(), properties));
        //2,用Flink进行转换处理
        SingleOutputStreamOperator<String> result = kafkaStream.map(new MapFunction<String, String>() {
            @Override
            public String map(String value) throws Exception {
                String[] fields = value.split(",");
                return new Event(fields[0].trim(), fields[1].trim(), Long.valueOf(fields[2].trim())).toString();
            }
        });
        //3,结果数据写入到Kafka
        result.addSink(new FlinkKafkaProducer<String>("hadoop102:9092","Events",new SimpleStringSchema()));
        // 1> 启动Zk           三个机器都要启动 都要运行 $ zkServer.sh start  查看状态: zkServer.sh status
        // 2> 启动Kafka：      三个机器都要启动  都要运行 $ kafka-server-start.sh /opt/module/kafka_2.13-3.2.0/config/server.properties &
        // 3> 创建生产者:                             $ kafka-console-producer.sh --broker-list hadoop102:9092 --topic clicks
        // 4> 创建消费者:                             $ kafka-console-consumer.sh --bootstrap-server hadoop102:9092 --topic Events
        // 5> 运行代码  在生产者端复制数据  在消费者端查看消费的数据
        // zkServer.sh status
        env.execute();
    }
}
```

这里可以看到，addSink传入的参数是一个FlinkKafkaProducer。这也很好理解，因为需要向Kafka写入数据，自然应该创建一个生产者。FlinkKafkaProducer 继承了抽象类 TwoPhaseCommitSinkFunction，这是一个实现了“两阶段提交”的 RichSinkFunction。两阶段提交提供了Flink向Kafka写入数据的事务性保证，能够真正做到精确一次（exactly once）的状态一致性。

运行代码，在Linux主机启动一个消费者, 查看是否收到数据

```sh
$ kafka-console-consumer.sh --bootstrap-server hadoop102:9092 --topic Events
```

可以看到消费者可以正常消费数据，证明向Kafka写入数据成功。另外，也可以读取之前介绍过的任意数据源，进行更多的完整测试。

比较有趣的一个实验：可以同时将Kafka作为Flink程序的数据源和写入结果的外部系统。只要将输入和输出的数据设置为不同的topic，就可以看到整个系统运行的路径：

Flink从Kakfa的一个topic读取消费数据， 然后进行处理转换，最终将结果数据写入Kafka的另一个topic——数据从Kafka流入、经 Flink 处理后又流回到 Kafk去，这就是所谓的“**数据管道**”应用。

## 三、输出到Redis

Redis是一个开源的内存式的数据存储，提供了像字符串（string）、哈希表（hash）、列表（list）、集合（set）、排序集合（sorted set）、位图（bitmap）、地理索引和流（stream）等一系列常用的数据结构。因为它运行速度快、支持的数据类型丰富，在实际项目中已经成为了架构优化必不可少的一员，一般用作数据库、缓存，也可以作为消息代理。 Flink没有直接提供官方的Redis连接器，不过Bahir项目还是担任了合格的辅助角色，提供了Flink-Redis的连接工具。但因版本升级略显滞后，目前连接器版本为1.0，支持的Scala版本最新到2.11。由于测试不涉及到Scala的相关版本变化，所以并不影响使用。 在实际项目应用中，应该以匹配的组件版本运行。

测试步骤如下:

导入的 Redis 连接器依赖

```java
<!--Redis连接器依赖-->
        <dependency>
            <groupId>org.apache.bahir</groupId>
            <artifactId>flink-connector-redis_2.11</artifactId>
            <version>1.0</version>
        </dependency>
```

启动Redis集群(为方便测试，只在一台机器安装Redis)

```sh
$ redis-server /opt/module/redis/redis.conf 
```

示例代码

```java
package com.kunan.StreamAPI.Sink;
import com.kunan.StreamAPI.Source.ClickSource;
import com.kunan.StreamAPI.Source.Event;
import org.apache.flink.streaming.api.datastream.DataStreamSource;
import org.apache.flink.streaming.api.environment.StreamExecutionEnvironment;
import org.apache.flink.streaming.connectors.redis.RedisSink;
import org.apache.flink.streaming.connectors.redis.common.config.FlinkJedisPoolConfig;
import org.apache.flink.streaming.connectors.redis.common.mapper.RedisCommand;
import org.apache.flink.streaming.connectors.redis.common.mapper.RedisCommandDescription;
import org.apache.flink.streaming.connectors.redis.common.mapper.RedisMapper;
public class SinkToRedis {
    public static void main(String[] args) throws Exception {
        StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();
        env.setParallelism(1);
        DataStreamSource<Event> stream = env.addSource(new ClickSource());
        // 创建一个jedis连接配置
        FlinkJedisPoolConfig config = new FlinkJedisPoolConfig.Builder()
                .setHost("hadoop102")
                .setPort(6379)
                .setTimeout(30000)
                .build();
        //写入Redis
        //JFlinkJedisConfigBase：Jedis 的连接配置
		//RedisMapper：Redis 映射类接口，说明怎样将数据转换成可以写入 Redis 的类型
        stream.addSink(new RedisSink<Event>(config,new MyRedisMapper()));
        env.execute();
    }
    //自定义类实现RedisMapper接口
    public static class MyRedisMapper implements RedisMapper<Event>{
        @Override
        public RedisCommandDescription getCommandDescription() {
            return new RedisCommandDescription(RedisCommand.HSET,"clicks");
        }
        @Override
        public String getKeyFromData(Event data) {
            return data.user;
        }
        @Override
        public String getValueFromData(Event data) {
            return data.url;
        }
    }
}
```

运行代码，Redis查看是否收到数据

```java
redis-cli
127.0.0.1:6379> hgetall clicks
1) "Jek"
2) "./prod?id=199"
3) "Marry"
4) "./prod?id=100"
5) "Alice"
6) "./prod?id=199"
7) "Bob"
8) "./home"
```

发送了多条数据, Redis中只有 8条数据. 原因是hash中的key重复了, 后面的会把前面的覆盖掉。

## 四、输出到ElasticSearch

ElasticSearch是一个分布式的开源搜索和分析引擎，适用于所有类型的数据。ElasticSearch有着简洁的REST风格的API，以良好的分布式特性、速度和可扩展性而闻名，在大数据领域应用非常广泛。 Flink为ElasticSearch专门提供了官方的Sink 连接器，Flink 1.13 支持当前最新版本的ElasticSearch。 写入数据的ElasticSearch的测试步骤如下。

添加Elasticsearch连接器依赖

```java
<!--Elasticsearch连接器依赖-->
        <dependency>
            <groupId>org.apache.flink</groupId>
            <artifactId>flink-connector-elasticsearch7_${scala.binary.version}</artifactId>
            <version>${flink.version}</version>
        </dependency>
```

启动 Elasticsearch 集群

```sh
$ ./bin/elasticsearch
```

编写输出到 Elasticsearch 的示例代码

```java
package com.kunan.StreamAPI.Sink;
import com.kunan.StreamAPI.Source.Event;
import org.apache.flink.api.common.functions.RuntimeContext;
import org.apache.flink.streaming.api.datastream.DataStreamSource;
import org.apache.flink.streaming.api.environment.StreamExecutionEnvironment;
import org.apache.flink.streaming.connectors.elasticsearch.ElasticsearchSinkFunction;
import org.apache.flink.streaming.connectors.elasticsearch.RequestIndexer;
import org.apache.flink.streaming.connectors.elasticsearch7.ElasticsearchSink;
import org.apache.http.HttpHost;
import org.elasticsearch.action.index.IndexRequest;
import org.elasticsearch.client.Requests;
import java.util.ArrayList;
import java.util.HashMap;
public class SinkToES {
    public static void main(String[] args) throws Exception {
        StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();
        env.setParallelism(1);
        DataStreamSource<Event> Stream = env.fromElements(
                new Event("Mary", "./home", 1000L),
                new Event("Bob", "./cart", 1500L),
                new Event("Alice", "./prod?id=100", 1800L),
                new Event("Bob", "./prod?id=1", 2000L),
                new Event("Alice", "./prod?id=200", 3000L),
                new Event("Bob", "./home", 2500L),
                new Event("Bob", "./prod?id=120", 3600L),
                new Event("Bob", "./prod?id=130", 4000L)
        );
        //定义hots列表
        ArrayList<HttpHost> httpHosts = new ArrayList<>();
        httpHosts.add(new HttpHost("hadoop102",9200));
        //定义ElasticsearchFunction
        ElasticsearchSinkFunction<Event> elasticsearchSinkFunction = new ElasticsearchSinkFunction<Event>() {
            @Override
            public void process(Event event, RuntimeContext runtimeContext, RequestIndexer requestIndexer) {
                HashMap<String, String> map = new HashMap<>();
                map.put(event.user, event.url);
                //构建一个IndexRequest
                IndexRequest request = Requests.indexRequest()
                        .index("clicks")
                        .source(map);
                requestIndexer.add(request);
            }
        };
        //写入ES
        Stream.addSink(new ElasticsearchSink.Builder<>(httpHosts,elasticsearchSinkFunction).build());
        env.execute();
    }
}
```

与RedisSink类似，连接器也实现了写入到Elasticsearch的SinkFunction——ElasticsearchSink。区别在于这个类的构造方法是私有（private）的，需要使用 ElasticsearchSink的Builder内部静态类，调用它的build()方法才能创建出真正的SinkFunction。而Builder的构造方法中又有两个参数：

- httpHosts：连接到的Elasticsearch集群主机列表;
- elasticsearchSinkFunction：这并不是SinkFunction，而是用来说明具体处理逻辑、准备数据向Elasticsearch发送请求的函数;

具体的操作需要重写中elasticsearchSinkFunction中的**process**方法，可以将要发送的数据放在一个HashMap中，包装成IndexRequest向外部发送HTTP请求。

 运行代码，访问Elasticsearch查看是否收到数据，查询结果如下所示。

```java
#查看当前所有索引
$ curl "hadoop102:9200/_cat/indices?v"
health status index  uuid                   pri rep docs.count docs.deleted store.size pri.store.size
yellow open   clicks osA9S5yTQpmaYIPZdShhNA   1   1          8            0      5.3kb          5.3kb
#查看具体信息
$ curl "hadoop102:9200/clicks/_search?pretty"
```

## 五、输出到MySQL（JDBC）

关系型数据库有着非常好的结构化数据设计、方便的SQL查询，是很多企业中业务数据存储的主要形式。MySQL就是其中的典型代表。尽管在大数据处理中直接与MySQL交互的场景不多，但最终处理的计算结果是要给外部应用消费使用的，而外部应用读取的数据存储往往就是MySQL。所以需要知道如何将数据输出到 MySQL这样的传统数据库。写入数据的MySQL的测试步骤如下:

添加依赖

```java
<!--MySql连接器依赖-->
        <dependency>
            <groupId>org.apache.flink</groupId>
            <artifactId>flink-connector-jdbc_${scala.binary.version}</artifactId>
            <version>${flink.version}</version>
        </dependency>
        <dependency>
            <groupId>mysql</groupId>
            <artifactId>mysql-connector-java</artifactId>
            <version>5.1.47</version>
        </dependency>
```

在My_Flink_Test库下建表CLICKS

```java
USE  My_Flink_Test;
CREATE TABLE CLICKS(
USER VARCHAR(100) NOT NULL
,URL VARCHAR(100) NOT NULL
);
```

编写输出到MySQL的示例代码：

```java
package com.kunan.StreamAPI.Sink;
import com.kunan.StreamAPI.Source.Event;
import org.apache.flink.connector.jdbc.JdbcConnectionOptions;
import org.apache.flink.connector.jdbc.JdbcSink;
import org.apache.flink.streaming.api.datastream.DataStreamSource;
import org.apache.flink.streaming.api.environment.StreamExecutionEnvironment;
public class SinkToMySQL {
    public static void main(String[] args) throws Exception {
        StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();
        env.setParallelism(1);
        DataStreamSource<Event> Stream = env.fromElements(
                new Event("Mary", "./home", 1000L),
                new Event("Bob", "./cart", 1500L),
                new Event("Alice", "./prod?id=100", 1800L),
                new Event("Bob", "./prod?id=1", 2000L),
                new Event("Alice", "./prod?id=200", 3000L),
                new Event("Bob", "./home", 2500L),
                new Event("Bob", "./prod?id=120", 3600L),
                new Event("Bob", "./prod?id=130", 4000L)
        );
        Stream.addSink(JdbcSink.sink(
                "INSERT INTO CLICKS(USER,URL) VALUES (? , ?)",
                ((statement,event) -> {
                    statement.setString(1,event.user);
                    statement.setString(2,event.url);
                }),
                new JdbcConnectionOptions.JdbcConnectionOptionsBuilder()
                        .withUrl("jdbc:mysql://hadoop102:3306/My_Flink_Test")
                        .withDriverName("com.mysql.jdbc.Driver")
                        .withUsername("root")
                        .withPassword("000000")
                        .build()
        ));
        env.execute();
    }
}
```

运行代码，查看是否成功写入数据。

```java
SELECT * FROM CLICKS;
```
