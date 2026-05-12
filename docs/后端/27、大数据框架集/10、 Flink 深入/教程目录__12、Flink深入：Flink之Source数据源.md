# 12、Flink深入：Flink之Source数据源
- 来源：https://ddkk.com/zhuanlan/bigdata/flink/4/12.html
- 分类：大数据框架
- 分组：教程目录
## 1. 基于集合的Source

**使用范围** ：

一般用于学习测试时编造数据时使用

**API** ：

env.fromElements(可变参数);

env.fromColletion(各种集合);

env.generateSequence(开始,结束);

env.fromSequence(开始,结束);

**代码演示** ：

```java
import org.apache.flink.streaming.api.datastream.DataStream;
import org.apache.flink.streaming.api.environment.StreamExecutionEnvironment;
import java.util.Arrays;
/**
 * @ Author ddkk.com  弟弟快看，程序员编程资料站
 * @ desc: 从集合中获取数据
 */
public class SourceDemo01_Collection {
    public static void main(String[] args) throws Exception {
        //1.env
        StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();
        //2.source
        // * 1.env.fromElements(可变参数);
        DataStream<String> ds1 = env.fromElements("hadoop", "spark", "flink");
        // * 2.env.fromColletion(各种集合);
        DataStream<String> ds2 = env.fromCollection(Arrays.asList("hadoop", "spark", "flink"));
        // * 3.env.generateSequence(开始,结束);
        DataStream<Long> ds3 = env.generateSequence(1, 10);
        //3.Transformation
        //4.sink
        ds1.print();
        ds2.print();
        ds3.print();
        //5.execute
        env.execute();
    }
}
```

## 2. 基于文件的Source

**使用范围** ：

一般用于学习测试

**API** ：

env.readTextFile(本地/HDFS文件/文件夹);//压缩文件也可以

**代码演示** ：

```java
import org.apache.flink.streaming.api.datastream.DataStream;
import org.apache.flink.streaming.api.environment.StreamExecutionEnvironment;
/**
 * @ Author ddkk.com  弟弟快看，程序员编程资料站
 * @ desc: 基于文件的Source源
 */
public class SourceDemo02_File {
    public static void main(String[] args) throws Exception {
        //创建Flink流的执行环境
        StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();
        //2.source
        // * 1.env.readTextFile(本地文件/HDFS文件);//压缩文件也可以
        DataStream<String> ds1 = env.readTextFile("D:\\Project\\IDEA\\bigdata-study-tutorial\\flink-tutorial-java\\src\\main\\data\\input\\words.txt");
        DataStream<String> ds2 = env.readTextFile("data/input/dir");
        DataStream<String> ds3 = env.readTextFile("hdfs://node1:8020//wordcount/input/words.txt");
        DataStream<String> ds4 = env.readTextFile("data/input/wordcount.txt.gz");
        //3.Transformation
        //4.sink
        ds1.print();
        ds2.print();
        ds3.print();
        ds4.print();
        //5.execute
        env.execute();
    }
}
```

## 3. 基于Socket的Source

**使用范围** ：

一般用于学习测试

**API** ：

env.socketTextStream("node1", 9999);

**安装netcat** ：

centos：

在服务器上使用 nc -lk 9999 向指定端口发送数据

nc是netcat的简称，原本是用来设置路由器,我们可以利用它向某个端口发送数据

如果没有该命令可以下安装

yuminstall -y nc

win10：

在主机上使用nc -l -p 9999 向指定端口发送数据

如果win10上如果没有安装nc，可以参考如下博客：[win10安装nc](https://blog.csdn.net/nicolewjt/article/details/88898735)

**代码演示** ：

```java
import org.apache.flink.api.common.RuntimeExecutionMode;
import org.apache.flink.api.common.functions.FlatMapFunction;
import org.apache.flink.api.common.functions.MapFunction;
import org.apache.flink.api.java.tuple.Tuple2;
import org.apache.flink.streaming.api.datastream.DataStream;
import org.apache.flink.streaming.api.datastream.KeyedStream;
import org.apache.flink.streaming.api.environment.StreamExecutionEnvironment;
import org.apache.flink.util.Collector;
/**
 * Author ddkk.com  弟弟快看，程序员编程资料站
 * Desc
 * SocketSource
 */
public class SourceDemo03 {
    public static void main(String[] args) throws Exception {
        //1.env
        StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();
        env.setRuntimeMode(RuntimeExecutionMode.AUTOMATIC);
        //2.source
        DataStream<String> linesDS = env.socketTextStream("node1", 9999);
        //3.处理数据-transformation
        //3.1每一行数据按照空格切分成一个个的单词组成一个集合
        DataStream<String> wordsDS = linesDS.flatMap(new FlatMapFunction<String, String>() {
            @Override
            public void flatMap(String value, Collector<String> out) throws Exception {
                //value就是一行行的数据
                String[] words = value.split(" ");
                for (String word : words) {
                    out.collect(word);//将切割处理的一个个的单词收集起来并返回
                }
            }
        });
        //3.2对集合中的每个单词记为1
        DataStream<Tuple2<String, Integer>> wordAndOnesDS = wordsDS.map(new MapFunction<String, Tuple2<String, Integer>>() {
            @Override
            public Tuple2<String, Integer> map(String value) throws Exception {
                //value就是进来一个个的单词
                return Tuple2.of(value, 1);
            }
        });
        //3.3对数据按照单词(key)进行分组
        //KeyedStream<Tuple2<String, Integer>, Tuple> groupedDS = wordAndOnesDS.keyBy(0);
        KeyedStream<Tuple2<String, Integer>, String> groupedDS = wordAndOnesDS.keyBy(t -> t.f0);
        //3.4对各个组内的数据按照数量(value)进行聚合就是求sum
        DataStream<Tuple2<String, Integer>> result = groupedDS.sum(1);
        //4.输出结果-sink
        result.print();
        //5.触发执行-execute
        env.execute();
    }
}
```

## 4. 自定义Source之随机生成数据

**使用范围** ：

一般用于学习测试,模拟生成一些数据

**API** ：

Flink提供了数据源接口,实现该接口就可以实现自定义数据源，不同的接口有不同的功能。

SourceFunction:非并行数据源(并行度只能=1)

RichSourceFunction:多功能非并行数据源(并行度只能=1)

ParallelSourceFunction:并行数据源(并行度能够>=1)

RichParallelSourceFunction:多功能并行数据源(并行度能够>=1)--Kafka数据源使用的就是该接口

**需求举例** ：

每隔1秒随机生成一条订单信息(订单ID、用户ID、订单金额、时间戳)

要求:

-随机生成订单ID(UUID)

-随机生成用户ID(0-2)

-随机生成订单金额(0-100)

-时间戳为当前系统时间

**代码演示** ：

```java
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.apache.flink.api.common.RuntimeExecutionMode;
import org.apache.flink.streaming.api.datastream.DataStream;
import org.apache.flink.streaming.api.environment.StreamExecutionEnvironment;
import org.apache.flink.streaming.api.functions.source.RichParallelSourceFunction;
import java.util.Random;
import java.util.UUID;
public class SourceDemo04_Customer {
    public static void main(String[] args) throws Exception {
        //1.env
        StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();
        env.setRuntimeMode(RuntimeExecutionMode.AUTOMATIC);
        //2.Source
        DataStream<Order> orderDS = env
                .addSource(new MyOrderSource())
                .setParallelism(2);
        //3.Transformation
        //4.Sink
        orderDS.print();
        //5.execute
        env.execute();
    }
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Order {
        private String id;
        private Integer userId;
        private Integer money;
        private Long createTime;
    }
    public static class MyOrderSource extends RichParallelSourceFunction<Order> {
        private Boolean flag = true;
        @Override
        public void run(SourceContext<Order> ctx) throws Exception {
            Random random = new Random();
            while (flag){
                Thread.sleep(1000);
                String id = UUID.randomUUID().toString();
                int userId = random.nextInt(3);
                int money = random.nextInt(101);
                long createTime = System.currentTimeMillis();
                ctx.collect(new Order(id,userId,money,createTime));
            }
        }
        //取消任务/执行cancle命令的时候执行
        @Override
        public void cancel() {
            flag = false;
        }
    }
}
```

## 5. 自定义Source之MySQL

**使用范围** ：

实际开发中,经常会实时接收一些数据,要和MySQL中存储的一些规则进行匹配,那么这时候就可以使用Flink自定义数据源从MySQL中读取数据

**API** ：

Flink提供了数据源接口,实现该接口就可以实现自定义数据源，不同的接口有不同的功能。

SourceFunction:非并行数据源(并行度只能=1)

RichSourceFunction:多功能非并行数据源(并行度只能=1)

ParallelSourceFunction:并行数据源(并行度能够>=1)

RichParallelSourceFunction:多功能并行数据源(并行度能够>=1)--Kafka数据源使用的就是该接口

**需求举例** ：

从MySQL中实时加载数据，要求MySQL中的数据有变化,也能被实时加载出来

**准备数据** ：

```java
CREATE TABLE t_student (
    id int(11) NOT NULL AUTO_INCREMENT,
    name varchar(255) DEFAULT NULL,
    age int(11) DEFAULT NULL,
    PRIMARY KEY (id)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8;
INSERT INTO t_student VALUES ('1', 'jack', '18');
INSERT INTO t_student VALUES ('2', 'tom', '19');
INSERT INTO t_student VALUES ('3', 'rose', '20');
INSERT INTO t_student VALUES ('4', 'tom', '19');
INSERT INTO t_student VALUES ('5', 'jack', '18');
INSERT INTO t_student VALUES ('6', 'rose', '20');
```

**代码演示** ：

```java
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.apache.flink.configuration.Configuration;
import org.apache.flink.streaming.api.datastream.DataStream;
import org.apache.flink.streaming.api.environment.StreamExecutionEnvironment;
import org.apache.flink.streaming.api.functions.source.RichParallelSourceFunction;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.util.concurrent.TimeUnit;
public class SourceDemo05_Customer_MySQL {
    public static void main(String[] args) throws Exception {
        //1.env
        StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();
        //2.Source
        DataStream<Student> studentDS = env.addSource(new MySQLSource()).setParallelism(1);
        //3.Transformation
        //4.Sink
        studentDS.print();
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
    public static class MySQLSource extends RichParallelSourceFunction<Student> {
        private Connection conn = null;
        private PreparedStatement ps = null;
        @Override
        public void open(Configuration parameters) throws Exception {
            //加载驱动,开启连接
            //Class.forName("com.mysql.jdbc.Driver");
            conn = DriverManager.getConnection("jdbc:mysql://localhost:3306/bigdata", "root", "root");
            String sql = "select id,name,age from t_student";
            ps = conn.prepareStatement(sql);
        }
        private boolean flag = true;
        @Override
        public void run(SourceContext<Student> ctx) throws Exception {
            while (flag) {
                ResultSet rs = ps.executeQuery();
                while (rs.next()) {
                    int id = rs.getInt("id");
                    String name = rs.getString("name");
                    int age = rs.getInt("age");
                    ctx.collect(new Student(id, name, age));
                }
                TimeUnit.SECONDS.sleep(5);
            }
        }
        @Override
        public void cancel() {
            flag = false;
        }
        @Override
        public void close() throws Exception {
            if (conn != null) conn.close();
            if (ps != null) ps.close();
        }
    }
}
```

## 6. 自定义Source源之Scala代码（温度传感器源）

**main函数中代码实现** ：

```java
// 创建执行环境
val env: StreamExecutionEnvironment = StreamExecutionEnvironment.getExecutionEnvironment
env.setParallelism(2)
// 1、从文件中读取数据
val fileStream: DataStream[String] = env.readTextFile("D:\\Project\\IDEA\\bigdata-study\\flink-demo\\src\\main\\resources\\source.txt")
// 2、从kafka中读取数据
// 2.1、创建kafka的properties配置信息对象
val prop: Properties = new Properties()
prop.setProperty("bootstrap.servers", "cdh1:9092,cdh2:9092,cdh3:9092")
prop.setProperty("group.id", "flink-consumer-group")
prop.setProperty("key.deserializer", "org.apache.kafka.common.serialization.StringDeserializer")
prop.setProperty("value.deserializer", "org.apache.kafka.common.serialization.StringDeserializer")
prop.setProperty("auto.offset.reset", "latest")
// 2.2、添加kafka的source源
val kafkaStream: DataStream[String] = env.addSource(new FlinkKafkaConsumer[String]("flinkTestTopic", new SimpleStringSchema(), prop))
// 3、自定义source源（自定义源需要创建一个自定义源类，并继承SourceFunction）
val mySensorStream: DataStream[SensorReading] = env.addSource(new MySensorSource(2))
// 打印数据
mySensorStream.print()
// 启动执行环境，运行任务
env.execute("SourceDemo")
```

**自定义source源代码实现** ：

```java
/**
 * 自定义一个生成 SensorReading（温度传感器） 的源
 */
class MySensorSource(sensorNum: Int) extends SourceFunction[SensorReading] {
    /**
     * flag: 表示数据源是否还在正常运行
     */
    var running: Boolean = true
    /**
     * 当启动数据源时，会在此方法中生成数据，并通过ctx（环境上下文）输出
     *
     * @param ctx 环境上下文
     */
    override def run(ctx: SourceFunction.SourceContext[SensorReading]): Unit = {
        // 初始化一个随机数发生器
        val rand: Random = new Random()
        // 初始化sensorNum个传感器（包括初始化名称，时间戳，温度）
        var curTemp: immutable.Seq[SensorReading] = 1.to(sensorNum).map(
            i => SensorReading("sensor_" + i, System.currentTimeMillis(), 65 + rand.nextGaussian() * 20)
        )
        // 每1000毫秒更新一次传感器中的温度和时间戳，并通过ctx将数据输出
        while (running) {
            val curTime: Long = System.currentTimeMillis()
            curTemp.foreach(sensorReading => {
                sensorReading.timestamp = curTime
                sensorReading.temperature = sensorReading.temperature + rand.nextGaussian()
                ctx.collect(sensorReading)
            })
            Thread.sleep(1000)
        }
    }
    /**
     * 停止此源（将flag修改为false）
     */
    override def cancel(): Unit = {
        running = false
    }
}
```
