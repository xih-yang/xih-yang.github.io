# 15、Flink深入：Flink之Sink数据输出
- 来源：https://ddkk.com/zhuanlan/bigdata/flink/4/15.html
- 分类：大数据框架
- 分组：教程目录
## 1. 基于控制台和文件的Sink

**API** ：

- ds.print 直接输出到控制台
- ds.printToErr() 直接输出到控制台,用红色
- ds.writeAsText("本地/HDFS的path",WriteMode.OVERWRITE).setParallelism(1)

**注意** ：

- 在输出到path的时候,可以在前面设置并行度
- 当并行度>1,则path为目录
- 当并行度=1,则path为文件名

**代码演示** ：

```java
import org.apache.flink.core.fs.FileSystem;
import org.apache.flink.streaming.api.datastream.DataStream;
import org.apache.flink.streaming.api.environment.StreamExecutionEnvironment;
/**
 * Author ddkk.com  弟弟快看，程序员编程资料站
 * Desc
 * 1.ds.print 直接输出到控制台
 * 2.ds.printToErr() 直接输出到控制台,用红色
 * 3.ds.collect 将分布式数据收集为本地集合
 * 4.ds.setParallelism(1).writeAsText("本地/HDFS的path",WriteMode.OVERWRITE)
 */
public class SinkDemo01 {
    public static void main(String[] args) throws Exception {
        //1.env
        StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();
        //2.source
        //DataStream<String> ds = env.fromElements("hadoop", "flink");
        DataStream<String> ds = env.readTextFile("data/input/words.txt");
        //3.transformation
        //4.sink
        ds.print();
        ds.printToErr();
        ds.writeAsText("data/output/test", FileSystem.WriteMode.OVERWRITE).setParallelism(2);
        //注意:
        //Parallelism=1为文件
        //Parallelism>1为文件夹
        //5.execute
        env.execute();
    }
}
```

## 2. 自定义Sink

当flink中原有的sink不能满足时，可以自定义sink，将数据输出到想要的系统中（包括文件系统、各种数据库等），如下代码示例，将数据输出到MySQL中

```java
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.apache.flink.configuration.Configuration;
import org.apache.flink.streaming.api.datastream.DataStream;
import org.apache.flink.streaming.api.environment.StreamExecutionEnvironment;
import org.apache.flink.streaming.api.functions.sink.RichSinkFunction;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
/**
 * Author ddkk.com  弟弟快看，程序员编程资料站
 * Desc
 * 使用自定义sink将数据保存到MySQL
 */
public class SinkDemo02_MySQL {
    public static void main(String[] args) throws Exception {
        //1.env
        StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();
        //2.Source
        DataStream<Student> studentDS = env.fromElements(new Student(null, "tonyma", 18));
        //3.Transformation
        //4.Sink
        studentDS.addSink(new MySQLSink());
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
    public static class MySQLSink extends RichSinkFunction<Student> {
        private Connection conn = null;
        private PreparedStatement ps = null;
        @Override
        public void open(Configuration parameters) throws Exception {
            //加载驱动,开启连接
            //Class.forName("com.mysql.jdbc.Driver");
            conn = DriverManager.getConnection("jdbc:mysql://localhost:3306/bigdata", "root", "root");
            String sql = "INSERT INTO t_student (id, name, age) VALUES (null, ?, ?)";
            ps = conn.prepareStatement(sql);
        }
        @Override
        public void invoke(Student value, Context context) throws Exception {
            //给ps中的?设置具体值
            ps.setString(1,value.getName());
            ps.setInt(2,value.getAge());
            //执行sql
            ps.executeUpdate();
        }
        @Override
        public void close() throws Exception {
            if (conn != null) conn.close();
            if (ps != null) ps.close();
        }
    }
}
```

## 3. Scala代码演示

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
