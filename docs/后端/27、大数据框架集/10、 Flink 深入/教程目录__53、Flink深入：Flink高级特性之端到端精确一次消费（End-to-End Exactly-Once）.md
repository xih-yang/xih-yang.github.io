# 53、Flink深入：Flink高级特性之端到端精确一次消费（End-to-End Exactly-Once）
- 来源：https://ddkk.com/zhuanlan/bigdata/flink/4/53.html
- 分类：大数据框架
- 分组：教程目录
## 1. 流处理的数据处理语议

对于批处理，fault-tolerant（容错性）很容易做，失败只需要replay，就可以完美做到容错。

对于流处理，数据流本身是动态，没有所谓的开始或结束，虽然可以replay buffer的部分数据，但fault-tolerant做起来会复杂的多。

流处理（有时称为事件处理）可以简单地描述为是对无界数据或事件的连续处理。流或事件处理应用程序可以或多或少地被描述为有向图，并且通常被描述为有向无环图（DAG）。在这样的图中，每个边表示数据或事件流，每个顶点表示运算符，会使用程序中定义的逻辑处理来自相邻边的数据或事件。有两种特殊类型的顶点，通常称为 sources 和 sinks。sources读取外部数据/事件到应用程序中，而 sinks 通常会收集应用程序生成的结果。下图是流式应用程序的示例。有如下特点：

- 分布式情况下是由多个Source(读取数据)节点、多个Operator(数据处理)节点、多个Sink(输出)节点构成
- 每个节点的并行数可以有差异，且每个节点都有可能发生故障
- 对于数据正确性最重要的一点，就是当发生故障时，是怎样容错与恢复的。

流处理引擎通常为应用程序提供了三种数据处理语义：最多一次、至少一次和精确一次。

如下是对这些不同处理语义的宽松定义(一致性由弱到强)：At most noce  1.checkpoint每10s进行一次，此时用FlinkKafkaConsumer实时消费kafka中的消息
>
> 2.消费并处理完消息后，进行一次预提交数据库的操作
>
> 3.如果预提交没有问题，10s后进行真正的插入数据库操作，如果插入成功，进行一次checkpoint，flink会自动记录消费的offset，可以将checkpoint保存的数据放到hdfs中
>
> 4.如果预提交出错，比如在5s的时候出错了，此时Flink程序就会进入不断的重启中，重启的策略可以在配置中设置，checkpoint记录的还是上一次成功消费的offset，因为本次消费的数据在checkpoint期间，消费成功，但是预提交过程中失败了
>
> 5.注意此时数据并没有真正的执行插入操作，因为预提交（preCommit）失败，提交（commit）过程也不会发生。等将异常数据处理完成之后，再重新启动这个Flink程序，它会自动从上一次成功的checkpoint中继续消费数据，以此来达到Kafka到Mysql的Exactly-Once。

代码1：

```java
import org.apache.flink.api.common.ExecutionConfig;
import org.apache.flink.api.common.typeutils.base.VoidSerializer;
import org.apache.flink.api.java.typeutils.runtime.kryo.KryoSerializer;
import org.apache.flink.runtime.state.filesystem.FsStateBackend;
import org.apache.flink.shaded.jackson2.com.fasterxml.jackson.databind.node.ObjectNode;
import org.apache.flink.streaming.api.CheckpointingMode;
import org.apache.flink.streaming.api.datastream.DataStreamSource;
import org.apache.flink.streaming.api.environment.StreamExecutionEnvironment;
import org.apache.flink.streaming.api.functions.sink.TwoPhaseCommitSinkFunction;
import org.apache.flink.streaming.connectors.kafka.FlinkKafkaConsumer;
import org.apache.flink.streaming.util.serialization.JSONKeyValueDeserializationSchema;
import org.apache.kafka.clients.CommonClientConfigs;
import java.sql.*;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Properties;
public class Kafka_Flink_MySQL_EndToEnd_ExactlyOnce {
    public static void main(String[] args) throws Exception {
        //1.env
        StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();
        env.setParallelism(1);//方便测试
        env.enableCheckpointing(10000);
        env.getCheckpointConfig().setCheckpointingMode(CheckpointingMode.EXACTLY_ONCE);
        env.getCheckpointConfig().setMinPauseBetweenCheckpoints(1000);
        //env.getCheckpointConfig().enableExternalizedCheckpoints(CheckpointConfig.ExternalizedCheckpointCleanup.RETAIN_ON_CANCELLATION);
        env.setStateBackend(new FsStateBackend("file:///D:/ckp"));
        //2.Source
        String topic = "flink_kafka";
        Properties props = new Properties();
        props.setProperty(CommonClientConfigs.BOOTSTRAP_SERVERS_CONFIG,"node1:9092");
        props.setProperty("group.id","flink");
        props.setProperty("auto.offset.reset","latest");//如果有记录偏移量从记录的位置开始消费,如果没有从最新的数据开始消费
        props.setProperty("flink.partition-discovery.interval-millis","5000");//开一个后台线程每隔5s检查Kafka的分区状态
        FlinkKafkaConsumer<ObjectNode> kafkaSource = new FlinkKafkaConsumer<>("topic_in", new JSONKeyValueDeserializationSchema(true), props);
        kafkaSource.setStartFromGroupOffsets();//从group offset记录的位置位置开始消费,如果kafka broker 端没有该group信息，会根据"auto.offset.reset"的设置来决定从哪开始消费
        kafkaSource.setCommitOffsetsOnCheckpoints(true);//Flink执行Checkpoint的时候提交偏移量(一份在Checkpoint中,一份在Kafka的默认主题中__comsumer_offsets(方便外部监控工具去看))
        DataStreamSource<ObjectNode> kafkaDS = env.addSource(kafkaSource);
        //3.transformation
        //4.Sink
        kafkaDS.addSink(new MySqlTwoPhaseCommitSink()).name("MySqlTwoPhaseCommitSink");
        //5.execute
        env.execute();
    }
}
/**
 自定义kafka to mysql，继承TwoPhaseCommitSinkFunction,实现两阶段提交。
 功能：保证kafak to mysql 的Exactly-Once
 CREATE TABLE t_test (
   id bigint(20) NOT NULL AUTO_INCREMENT,
   value varchar(255) DEFAULT NULL,
   insert_time datetime DEFAULT NULL,
   PRIMARY KEY (id)
 ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
 */
class MySqlTwoPhaseCommitSink extends TwoPhaseCommitSinkFunction<ObjectNode, Connection, Void> {
    public MySqlTwoPhaseCommitSink() {
        super(new KryoSerializer<>(Connection.class, new ExecutionConfig()), VoidSerializer.INSTANCE);
    }
    /**
     * 执行数据入库操作
     */
    @Override
    protected void invoke(Connection connection, ObjectNode objectNode, Context context) throws Exception {
        System.err.println("start invoke.......");
        String date = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss").format(new Date());
        System.err.println("===>date:" + date + " " + objectNode);
        String value = objectNode.get("value").toString();
        String sql = "insert into t_test (value,insert_time) values (?,?)";
        PreparedStatement ps = connection.prepareStatement(sql);
        ps.setString(1, value);
        ps.setTimestamp(2, new Timestamp(System.currentTimeMillis()));
        //执行insert语句
        ps.execute();
        //手动制造异常
        if(Integer.parseInt(value) == 15) System.out.println(1/0);
    }
    /**
     * 获取连接，开启手动提交事务（getConnection方法中）
     */
    @Override
    protected Connection beginTransaction() throws Exception {
        String url = "jdbc:mysql://localhost:3306/bigdata?useUnicode=true&characterEncoding=UTF-8&zeroDateTimeBehavior=convertToNull&useSSL=false&autoReconnect=true";
        Connection connection = DBConnectUtil.getConnection(url, "root", "root");
        System.err.println("start beginTransaction......."+connection);
        return connection;
    }
    /**
     * 预提交，这里预提交的逻辑在invoke方法中
     */
    @Override
    protected void preCommit(Connection connection) throws Exception {
        System.err.println("start preCommit......."+connection);
    }
    /**
     * 如果invoke执行正常则提交事务
     */
    @Override
    protected void commit(Connection connection) {
        System.err.println("start commit......."+connection);
        DBConnectUtil.commit(connection);
    }
    @Override
    protected void recoverAndCommit(Connection connection) {
        System.err.println("start recoverAndCommit......."+connection);
    }
    @Override
    protected void recoverAndAbort(Connection connection) {
        System.err.println("start abort recoverAndAbort......."+connection);
    }
    /**
     * 如果invoke执行异常则回滚事务，下一次的checkpoint操作也不会执行
     */
    @Override
    protected void abort(Connection connection) {
        System.err.println("start abort rollback......."+connection);
        DBConnectUtil.rollback(connection);
    }
}
class DBConnectUtil {
    /**
     * 获取连接
     */
    public static Connection getConnection(String url, String user, String password) throws SQLException {
        Connection conn = null;
        conn = DriverManager.getConnection(url, user, password);
        //设置手动提交
        conn.setAutoCommit(false);
        return conn;
    }
    /**
     * 提交事务
     */
    public static void commit(Connection conn) {
        if (conn != null) {
            try {
                conn.commit();
            } catch (SQLException e) {
                e.printStackTrace();
            } finally {
                close(conn);
            }
        }
    }
    /**
     * 事务回滚
     */
    public static void rollback(Connection conn) {
        if (conn != null) {
            try {
                conn.rollback();
            } catch (SQLException e) {
                e.printStackTrace();
            } finally {
                close(conn);
            }
        }
    }
    /**
     * 关闭连接
     */
    public static void close(Connection conn) {
        if (conn != null) {
            try {
                conn.close();
            } catch (SQLException e) {
                e.printStackTrace();
            }
        }
    }
}
```

代码2：

```java
import com.alibaba.fastjson.JSON;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.apache.kafka.clients.producer.Producer;
import org.apache.kafka.clients.producer.ProducerRecord;
import java.util.Properties;
public class DataProducer {
    public static void main(String[] args) throws InterruptedException {
        Properties props = new Properties();
        props.put("bootstrap.servers", "node1:9092");
        props.put("key.serializer", "org.apache.kafka.common.serialization.StringSerializer");
        props.put("value.serializer", "org.apache.kafka.common.serialization.StringSerializer");
        Producer<String, String> producer = new org.apache.kafka.clients.producer.KafkaProducer<>(props);
        try {
            for (int i = 1; i <= 20; i++) {
                DataBean data = new DataBean(String.valueOf(i));
                ProducerRecord record = new ProducerRecord<String, String>("flink_kafka", null, null, JSON.toJSONString(data));
                producer.send(record);
                System.out.println("发送数据: " + JSON.toJSONString(data));
                Thread.sleep(1000);
            }
        }catch (Exception e){
            System.out.println(e);
        }
        producer.flush();
    }
}
@Data
@NoArgsConstructor
@AllArgsConstructor
class DataBean {
    private String value;
}
```
