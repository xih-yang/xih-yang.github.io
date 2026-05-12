# 17、Flink深入：Flink之Connect API
- 来源：https://ddkk.com/zhuanlan/bigdata/flink/4/17.html
- 分类：大数据框架
- 分组：教程目录
## 1. Flink之Connect JDBC API

[Apache Flink 1.12 Documentation: JDBC Connector](https://ci.apache.org/projects/flink/flink-docs-release-1.12/dev/connectors/jdbc.html)

```java
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.apache.flink.connector.jdbc.JdbcConnectionOptions;
import org.apache.flink.connector.jdbc.JdbcSink;
import org.apache.flink.streaming.api.environment.StreamExecutionEnvironment;
/**
 * Author ddkk.com  弟弟快看，程序员编程资料站
 * Desc
 */
public class ConnectorsDemo_JDBC {
    public static void main(String[] args) throws Exception {
        //1.env
        StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();
        //2.Source
        env.fromElements(new Student(null, "tonyma", 18))
                //3.Transformation
                //4.Sink
                .addSink(JdbcSink.sink(
                        "INSERT INTO t_student (id, name, age) VALUES (null, ?, ?)",
                        (ps, s) -> {
                            ps.setString(1, s.getName());
                            ps.setInt(2, s.getAge());
                        },
                        new JdbcConnectionOptions.JdbcConnectionOptionsBuilder()
                                .withUrl("jdbc:mysql://localhost:3306/bigdata")
                                .withUsername("root")
                                .withPassword("root")
                                .withDriverName("com.mysql.jdbc.Driver")
                                .build()));
        //5.execute
        env.execute();
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

## 2. Flink之Connect Redis API

## 2.1. API概述

Part1：通过flink 操作redis 其实我们可以通过传统的redis 连接池Jpoools 进行redis 的相关操作，但是flink 提供了专门操作redis 的RedisSink，使用起来更方便，而且不用我们考虑性能的问题，接下来将主要介绍RedisSink 如何使用。

[Apache Flink Streaming Connector for Redis](https://bahir.apache.org/docs/flink/current/flink-streaming-redis/)

Part2：RedisSink 核心类是RedisMapper 是一个接口，使用时我们要编写自己的redis 操作类实现这个接口中的三个方法，如下所示

- getCommandDescription() ： 设置使用的redis 数据结构类型，和key 的名称，通过RedisCommand 设置数据结构类型
- String getKeyFromData(T data)：设置value 中的键值对key的值
- String getValueFromData(T data);设置value 中的键值对value的值

Part3：使用RedisCommand设置数据结构类型时和redis结构对应关系：

**Data********Type**

**Redis********Command********[Sink]**

HASH

HSET

LIST

RPUSH, LPUSH

SET

SADD

PUBSUB

PUBLISH

STRING

SET

HYPER_LOG_LOG

PFADD

SORTED_SET

ZADD

SORTED_SET

ZREM

## 2.2. 代码示例

```java
import org.apache.flink.api.common.functions.FlatMapFunction;
import org.apache.flink.api.java.tuple.Tuple;
import org.apache.flink.api.java.tuple.Tuple2;
import org.apache.flink.streaming.api.datastream.DataStream;
import org.apache.flink.streaming.api.datastream.KeyedStream;
import org.apache.flink.streaming.api.datastream.SingleOutputStreamOperator;
import org.apache.flink.streaming.api.environment.StreamExecutionEnvironment;
import org.apache.flink.streaming.connectors.redis.RedisSink;
import org.apache.flink.streaming.connectors.redis.common.config.FlinkJedisPoolConfig;
import org.apache.flink.streaming.connectors.redis.common.mapper.RedisCommand;
import org.apache.flink.streaming.connectors.redis.common.mapper.RedisCommandDescription;
import org.apache.flink.streaming.connectors.redis.common.mapper.RedisMapper;
import org.apache.flink.util.Collector;
/**
 * Author ddkk.com  弟弟快看，程序员编程资料站
 * Desc
 * 需求:
 * 接收消息并做WordCount,
 * 最后将结果保存到Redis
 * 注意:存储到Redis的数据结构:使用hash也就是map
 * key            value
 * WordCount    (单词,数量)
 */
public class ConnectorsDemo_Redis {
    public static void main(String[] args) throws Exception {
        //1.env
        StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();
        //2.Source
        DataStream<String> linesDS = env.socketTextStream("node1", 9999);
        //3.Transformation
        //3.1切割并记为1
        SingleOutputStreamOperator<Tuple2<String, Integer>> wordAndOneDS = linesDS.flatMap(new FlatMapFunction<String, Tuple2<String, Integer>>() {
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
        // * 最后将结果保存到Redis
        // * 注意:存储到Redis的数据结构:使用hash也就是map
        // * key            value
        // * WordCount      (单词,数量)
        //-1.创建RedisSink之前需要创建RedisConfig
        //连接单机版Redis
        FlinkJedisPoolConfig conf = new FlinkJedisPoolConfig.Builder().setHost("127.0.0.1").build();
        //连接集群版Redis
        //HashSet<InetSocketAddress> nodes = new HashSet<>(Arrays.asList(new InetSocketAddress(InetAddress.getByName("node1"), 6379),new InetSocketAddress(InetAddress.getByName("node2"), 6379),new InetSocketAddress(InetAddress.getByName("node3"), 6379)));
        //FlinkJedisClusterConfig conf2 = new FlinkJedisClusterConfig.Builder().setNodes(nodes).build();
        //连接哨兵版Redis
        //Set<String> sentinels = new HashSet<>(Arrays.asList("node1:26379", "node2:26379", "node3:26379"));
        //FlinkJedisSentinelConfig conf3 = new FlinkJedisSentinelConfig.Builder().setMasterName("mymaster").setSentinels(sentinels).build();
        //-3.创建并使用RedisSink
        result.addSink(new RedisSink<Tuple2<String, Integer>>(conf, new RedisWordCountMapper()));
        //5.execute
        env.execute();
    }
    /**
     * -2.定义一个Mapper用来指定存储到Redis中的数据结构
     */
    public static class RedisWordCountMapper implements RedisMapper<Tuple2<String, Integer>> {
        @Override
        public RedisCommandDescription getCommandDescription() {
            return new RedisCommandDescription(RedisCommand.HSET, "WordCount");
        }
        @Override
        public String getKeyFromData(Tuple2<String, Integer> data) {
            return data.f0;
        }
        @Override
        public String getValueFromData(Tuple2<String, Integer> data) {
            return data.f1.toString();
        }
    }
}
```

## 3. Scala代码示例

此示例包含将flink的数据保存到jdbc、redis、elasticsearch等数据库系统中的示例代码

```java
// 执行环境
val env: StreamExecutionEnvironment = StreamExecutionEnvironment.getExecutionEnvironment
env.setParallelism(2)
// 获取数据
val fileStream: DataStream[String] = env
    .readTextFile("D:\\Project\\IDEA\\bigdata-study\\flink-demo\\src\\main\\resources\\source.txt")
val sensorStream: DataStream[SensorReading] = fileStream.map(new MyMapToSensorReading)
// 1、kafkaSink
fileStream.addSink(new FlinkKafkaProducer[String]("cdh1:9092,cdh2:9092,cdh3:9092", "flinkTestTopic", new SimpleStringSchema()))
// 2、Redis Sink（在Flink中，需要定义一个redis的mapper类，用于定义保存到redis时调用的命令）
// 2.1、定义redis的连接信息
val conf: FlinkJedisPoolConfig = new FlinkJedisPoolConfig.Builder().setHost("localhost").setPort(6379).build()
// 2.2、构建redis的Mapper对象（通过实现接口方式）
val redisMapper: RedisMapper[SensorReading] = new RedisMapper[SensorReading] {
    override def getCommandDescription: RedisCommandDescription = {
        new RedisCommandDescription(RedisCommand.HSET, "sensor_temperature")
    }
    override def getKeyFromData(data: SensorReading): String = data.id
    override def getValueFromData(data: SensorReading): String = data.temperature.toString
}
// 2.3、通过 FlinkJedisPoolConfig 和 RedisMapper 创建 RedisSink 对象，并使用流进行sink添加
sensorStream.addSink(new RedisSink[SensorReading](conf, redisMapper))
// 3、Elasticsearch Sink
// 3.1、定义ES的连接地址（httpHosts）
val httpHosts: util.ArrayList[HttpHost] = new util.ArrayList[HttpHost]()
httpHosts.add(new HttpHost("localhost", 9200))
// 3.2、定义一个 ElasticsearchSinkFunction（通过实现接口方式）
val elasticsearchSinkFunction: ElasticsearchSinkFunction[SensorReading] = new ElasticsearchSinkFunction[SensorReading] {
    override def process(sensorReading : SensorReading, runtimeContext: RuntimeContext, requestIndexer: RequestIndexer): Unit = {
        // 包装写入es的数据
        val dataSource: util.HashMap[String, String] = new util.HashMap[String, String]()
        dataSource.put("sensor_id", sensorReading.id)
        dataSource.put("temp", sensorReading.temperature.toString)
        dataSource.put("ts", sensorReading.timestamp.toString)
        // 创建一个IndexRequest（其中包含index，type，source数据）
        val indexRequest: IndexRequest = Requests.indexRequest()
            .index("sensor_temp")
            .opType("readingData")
            .source(dataSource)
        // 用RequestIndexer将包装好的 IndexRequest 数据发送到es（通过http）
        requestIndexer.add(indexRequest)
        println(sensorStream + " saved successfully")
    }
}
// 3.3、通过httpHosts和 ElasticsearchSinkFunction构建 ElasticsearchSink，并使用流进行sink添加
sensorStream.addSink(new ElasticsearchSink.Builder[SensorReading](httpHosts, elasticsearchSinkFunction).build())
// 4、JDBC Sink
// 4.1、因为没有专门的JDBC Sink，使用直接实现一个RichSinkFunction，将JDBC操作
val jdbcSinkFunction: RichSinkFunction[SensorReading] = new RichSinkFunction[SensorReading] {
    /**
     * 定义连接 和 预编译 语句（这些信息需要全局调用，并在open中初始化，close中关闭）
     */
    var conn: Connection = _
    var insertStmt: PreparedStatement = _
    var updateStmt: PreparedStatement = _
    /**
     * 在open生命周期方法中创建连接以及预编译语句
     * @param parameters 配置信息
     */
    override def open(parameters: Configuration): Unit = {
        conn = DriverManager.getConnection("jdbc:mysql://localhost:3306/test", "root", "123456")
        insertStmt = conn.prepareStatement("insert into temp (sensor, temperature) values (?,?)")
        updateStmt = conn.prepareStatement("update temp set temperature = ? where sensor = ?")
    }
    /**
     * 流中每进来一条数据，会调用一次此方法
     * @param value 流中进入的数据
     * @param context 环境上下文
     */
    override def invoke(value: SensorReading, context: SinkFunction.Context[_]): Unit = {
        // 执行更新语句
        updateStmt.setDouble(1, value.temperature)
        updateStmt.setString(2, value.id)
        updateStmt.execute()
        // 如果刚才没有更新数据，那么执行插入操作
        if( updateStmt.getUpdateCount == 0 ){
            insertStmt.setString(1, value.id)
            insertStmt.setDouble(2, value.temperature)
            insertStmt.execute()
        }
    }
    /**
     * 关闭资源
     */
    override def close(): Unit = {
        insertStmt.close()
        updateStmt.close()
        conn.close()
    }
}
// 4.2、使用流进行sink添加
sensorStream.addSink(jdbcSinkFunction)
// 启动执行环境，执行任务
env.execute("SinkDemo")
```
