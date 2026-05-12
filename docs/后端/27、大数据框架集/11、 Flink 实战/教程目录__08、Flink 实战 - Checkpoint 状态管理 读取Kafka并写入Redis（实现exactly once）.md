# 08、Flink 实战 - Checkpoint 状态管理 读取Kafka并写入Redis（实现exactly once）
- 来源：https://ddkk.com/zhuanlan/bigdata/flink/6/8.html
- 分类：大数据框架
- 分组：教程目录
## 一、前言

Flink之所以能成为流计算的新宠儿，和它的有状态计算密不可分。

checkpoint和state是学习Flink的重中之重。

## 二、设置Checkpoint

在[Flink 实战(六) Flink 重启策略](/zhuanlan/bigdata/flink/6/6.html)简单介绍了checkpoint。

Flink要保证计算结果正确，达到exactly once（精确一次）的效果，它得依赖有状态（stateful）计算。

Flink要实现有状态的计算，它得周期性地把当前时刻的计算结果（state）暂存起来，这就是Checkpoint机制。

### 1 开启checkpoint

Flink默认是**不开启**checkpoint的，需要在代码里或配置文件中配置好。

```java
//打开checkpoint开关，并每3s执行一次状态快照
//该时间默认是500毫秒
//开启checkpoint后，重启策略默认是无限次重启的
env.enableCheckpointing(3000);
//设置checkpoint模式为EXACTLY_ONCE，当然EXACTLY_ONCE也是默认值
env.getCheckpointConfig().setCheckpointingMode(CheckpointingMode.EXACTLY_ONCE);
```

CheckpointingMode这个枚举有2个值

- EXACTLY_ONCE（精确一次）
- AT_LEAST_ONCE（至少一次）

上面的代码也可写成一个方法掉用，如下

```java
env.enableCheckpointing(3000, CheckpointingMode.EXACTLY_ONCE);
```

### 2 配置不删除checkpoint文件

当程序经过重启策略，最后还是失败了，如果要保证后面继续跑该程序，那得接着之前的计算结果接着算，所以要设置不删除checkpoint

```java
//取消任务，不删除checkpoint
env.getCheckpointConfig().enableExternalizedCheckpoints(
	CheckpointConfig.ExternalizedCheckpointCleanup.RETAIN_ON_CANCELLATION
);
```

### 3 配置Checkpoint超时时间

如果一次Checkpoint超过一定时间仍未完成，直接将其终止，以免其占用太多资源

```java
env.getCheckpointConfig().setCheckpointTimeout(6000L);
```

### 4 配置Checkpoint间歇时间

如果两次Checkpoint之间的间歇时间太短，那么正常的作业可能获取的资源较少，更多的资源被用在了Checkpoint上。

```java
env.getCheckpointConfig().setMinPauseBetweenCheckpoints(1000L);
```

## 三、状态的使用

### 1 定义状态描述

我们常用的Rich方法（其实也是类），例如RichMapFunction、RichFlatMapFunction，都实现RichFunction接口，而RichFunction接口中常用的方法open和close是必不可少的。

```java
RichFunction初始化时掉用
void open(Configuration parameters) throws Exception;
关闭退出时掉用
void close() throws Exception;
```

- 在open方法中定义状态描述，并获取状态初始值
- 在close方法清空状态

```java
//定义状态，保存上一次温度值
private transient ValueState<Double> lastTempState;
@Override
public void open(Configuration parameters) throws Exception {
    //定义状态描述
    ValueStateDescriptor descriptor = new ValueStateDescriptor("last-temp", Types.DOUBLE);
    //从上下文中获取state
    lastTempState = getRuntimeContext().getState(descriptor);
}
@Override
public void close() throws Exception {
    lastTempState.clear();
}
```

### 2 状态的查询和修改

状态支持很多种类型，满足绝大数场景的数据格式。

下面简单举例几种最最常用的。

#### 2.1 ValueState

- 用ValueStateDescriptor定义ValueState的描述器
- value()方法获取值
- update()方法更新值

```java
//定义ValueState描述器
ValueStateDescriptor<Double> tempStateDes = new ValueStateDescriptor<Double>(
        "temp-state",
        Double.class,
        Double.MIN_VALUE);
//获取State
ValueState<Double> tempState = getRuntimeContext().getState(tempStateDes);
//获取State中的值
Double temp = tempState.value();
//更新State
tempState.update(30.54);
//清空State
tempState.clear();
```

#### 2.2 MapState

- 用MapStateDescriptor定义MapState的描述器
- MapState的方法和Java的Map中方法基本类似，很容易上手
- get()方法获取值
- put()，putAll()方法更新值
- contains()判断是否存在某个key
- remove()删除某个key
- isEmpty() 判断是否为空

```java
//定义MapState描述器
MapStateDescriptor<String, Integer> mapStateDes = new MapStateDescriptor<>(
        "map-state",
        String.class,
        Integer.class);
//获取MapState
MapState<String, Integer> mapState = getRuntimeContext().getMapState(mapStateDes);
//给state加值，也可以用putAll()加一个map
mapState.put("theKey", 1);
//用get()根据key获取值
Integer value = mapState.get("theKey");
//判断是否存在某个key
mapState.contains("theKey");
//删除某个key
mapState.remove("theKey");
//清空state
mapState.clear();
```

#### 2.3 ListState

- 用ListStateDescriptor定义ListState的描述器
- get()方法获取值
- add()，addAll()方法更新值
- update() 用新List 替换 原来的List
- clear() 清空List，List还存在，但是没有元素

```java
 //状态描述
ListStateDescriptor<Long> stateDescriptor = new ListStateDescriptor<Long>(
        "offset-state",
        Types.LONG
);
ListState<Long> offsetState = getRuntimeContext().getListState(stateDescriptor);
Iterable<Long> iterable = offsetState.get();
//往List里添加一个值
offsetState.add(1L);
//往List里添加一个List
offsetState.addAll(Arrays.asList(2L, 3L));
//用新List 替换 原来的List
offsetState.update(Arrays.asList(2L, 3L));
//清空List，List还存在，但是没有元素
offsetState.clear();
```

#### 2.4 ReducingState

使用ReducingState 得先 实现ReduceFunction

例如定义一个采集温度的类

```java
public class SensorRecord {
	//设备ID
    private String id;
	//当前温度
    private Double record;
	//当前时间戳
    private Long time;
	//无参构造器必要
    public SensorRecord() {
    }
    //省略别的代码
}
```

定义一个获取最大温度的ReduceFunction

```java
public static class MyMaxTemp implements ReduceFunction<SensorRecord> {
    @Override
    public SensorRecord reduce(SensorRecord value1, SensorRecord value2) throws Exception {
        return value1.getRecord() >= value2.getRecord() ? value1 : value2;
    }
}
```

- 用ReducingStateDescriptor定义描述器
- getRuntimeContext().getReducingState()获取ReducingState
- add()方法添加一个元素，触发reduceFunction计算一次

```java
//用ReducingStateDescriptor定义描述器
ReducingStateDescriptor reducingStateDescriptor = new ReducingStateDescriptor(
        "max-temp-state",
        new SensorRecordUtils.MyMaxTemp(),
        SensorRecord.class);
//获取ReducingState
ReducingState reducingState = getRuntimeContext().getReducingState(reducingStateDescriptor);
//add()方法添加一个元素，触发reduceFunction计算
reducingState.add(new SensorRecord("no1", 34.2, 1607652007000L));
//获取当前最大温度
SensorRecord maxTemp = (SensorRecord)reducingState.get();
reducingState.clear();
```

#### 2.5 AggregatingState

先定义AggregateFunction，求温度的平均值

```java
public static class MyAvgTemp implements AggregateFunction<SensorRecord, Tuple2<Double, Integer>, Double> {
    @Override
    public Tuple2<Double, Integer> createAccumulator() {
        return Tuple2.of(0.0, 0);
    }
    @Override
    public Tuple2<Double, Integer> add(SensorRecord value, Tuple2<Double, Integer> accumulator) {
        Integer currentCount = accumulator.f1;
        currentCount += 1;
        accumulator.f1 = currentCount;
        return new Tuple2<>(accumulator.f0 + value.getRecord(), accumulator.f1);
    }
    @Override
    public Double getResult(Tuple2<Double, Integer> accumulator) {
        return accumulator.f0 / accumulator.f1;
    }
    @Override
    public Tuple2<Double, Integer> merge(Tuple2<Double, Integer> a, Tuple2<Double, Integer> b) {
        return new Tuple2<>(a.f0 + b.f0, a.f1 + b.f1);
    }
}
```

- AggregatingStateDescriptor 定义描述器
- add()方法添加一个元素，触发AggregateFunction计算
- get()获取State的值

```java
AggregatingStateDescriptor aggregatingStateDescriptor = new AggregatingStateDescriptor(
		"avg-temp",
        new SensorRecordUtils.MyAvgTemp(),
        TypeInformation.of(new TypeHint<Tuple2<Double, Integer>>(){
     })
);
AggregatingState aggregatingState = getRuntimeContext().getAggregatingState(aggregatingStateDescriptor);
//add()方法添加一个元素，触发AggregateFunction计算
aggregatingState.add(new SensorRecord("no1", 34.2, 1607652007000L));
//获取State的值
SensorRecord avgTemp = (SensorRecord)aggregatingState.get();
```

## 四、读取Kafka的消息的帮助类

下面给出读取KafKa的代码，具体不讲了，只看代码吧。

### 1 先配置文件

```java
checkpoint.interval=6000
bootstrap.servers=192.168.135.139:9092
group.id=testKafka
auto.offset.reset=earliest
enable.auto.commit=false
topics=WinterTopic
redis.host=localhost
redis.port=6379
```

### 2 读取Kafka的帮助类

```java
package learn.common.util;
import org.apache.commons.lang3.StringUtils;
import org.apache.flink.api.common.serialization.DeserializationSchema;
import org.apache.flink.api.java.utils.ParameterTool;
import org.apache.flink.streaming.api.CheckpointingMode;
import org.apache.flink.streaming.api.datastream.DataStream;
import org.apache.flink.streaming.api.datastream.DataStreamSource;
import org.apache.flink.streaming.api.environment.CheckpointConfig;
import org.apache.flink.streaming.api.environment.StreamExecutionEnvironment;
import org.apache.flink.streaming.connectors.kafka.FlinkKafkaConsumer;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Properties;
public class FlinkKafkaUtils {
    private static StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();
    public static <T> DataStream<T> createStream(ParameterTool params, Class<? extends DeserializationSchema<T>> clazz) throws IllegalAccessException, InstantiationException {
        env.getConfig().setGlobalJobParameters(params);
        long interval = params.getLong("checkpoint.interval", 5000L);
        String bootstrapServers = params.getRequired("bootstrap.servers");
        String groupId = params.getRequired("group.id");
        String autoOffsetReset = params.get("auto.offset.reset", "earliest");
        String enableAutoCommit = params.get("enable.auto.commit", "false");
        String topics = params.getRequired("topics");
        List<String> topicList = new ArrayList<>();
        if (StringUtils.isNotBlank(topics)) {
            topicList = Arrays.asList(topics.split(","));
        }
        env.enableCheckpointing(interval);
        //取消任务，不删除checkpoint
        env.getCheckpointConfig().enableExternalizedCheckpoints(
                CheckpointConfig.ExternalizedCheckpointCleanup.RETAIN_ON_CANCELLATION
        );
        //设置checkpoint模式,不设置默认EXACTLY_ONCE
        env.getCheckpointConfig().setCheckpointingMode(CheckpointingMode.EXACTLY_ONCE);
        Properties props = new Properties();
        props.setProperty("bootstrap.servers", bootstrapServers);
        props.setProperty("group.id", groupId);
        props.setProperty("auto.offset.reset", autoOffsetReset);
        props.setProperty("enable.auto.commit", enableAutoCommit);
        FlinkKafkaConsumer<T> kafkaConsumer = new FlinkKafkaConsumer<>(
                topicList,
                clazz.newInstance(),
                props);
        kafkaConsumer.setCommitOffsetsOnCheckpoints(true);
        DataStreamSource<T> streamSource = env.addSource(kafkaConsumer);
        return streamSource;
    }
    public static StreamExecutionEnvironment getEnv() {
        return env;
    }
}
```

## 五、存入Redis的帮助类

```java
package learn.common.util;
import org.apache.commons.lang3.StringUtils;
import org.apache.flink.api.java.tuple.Tuple3;
import org.apache.flink.api.java.utils.ParameterTool;
import org.apache.flink.configuration.Configuration;
import org.apache.flink.streaming.api.functions.sink.RichSinkFunction;
import redis.clients.jedis.Jedis;
public class FlinkRedisSink extends RichSinkFunction<Tuple3<String, String, String>> {
    private transient Jedis jedis;
    @Override
    public void open(Configuration parameters) throws Exception {
        super.open(parameters);
        ParameterTool params = (ParameterTool)getRuntimeContext().getExecutionConfig().getGlobalJobParameters();
        String redisHost = params.get("redis.host", "localhost");
        int redisPort = params.getInt("redis.port", 6379);
        int redisDb = params.getInt("redis.db", 0);
        String redisPassword = params.get("redis.password", "");
        jedis = new Jedis(redisHost, redisPort, 5000);
        if (StringUtils.isNotBlank(redisPassword)){
            jedis.auth(redisPassword);
        }
        jedis.select(redisDb);
    }
    @Override
    public void invoke(Tuple3<String, String, String> value, Context context) throws Exception {
        if (!jedis.isConnected()){
            jedis.connect();
        }
        jedis.hset(value.f0, value.f1, value.f2);
    }
    @Override
    public void close() throws Exception {
        super.close();
        jedis.close();
    }
}
```

## 六、Job主类

用最简单的WordCount测试

```java
package learn.test05_state;
import learn.common.util.FlinkKafkaUtils;
import learn.common.util.FlinkRedisSink;
import org.apache.flink.api.common.functions.MapFunction;
import org.apache.flink.api.common.serialization.SimpleStringSchema;
import org.apache.flink.api.common.typeinfo.Types;
import org.apache.flink.api.java.tuple.Tuple2;
import org.apache.flink.api.java.tuple.Tuple3;
import org.apache.flink.api.java.utils.ParameterTool;
import org.apache.flink.streaming.api.datastream.DataStream;
import org.apache.flink.streaming.api.datastream.SingleOutputStreamOperator;
import org.apache.flink.util.Collector;
import java.util.Arrays;
public class Demo10_KafkaToRedis {
    public static void main(String[] args) throws Exception {
        ParameterTool params = ParameterTool.fromPropertiesFile(args[0]);
        DataStream<String> dataStream = FlinkKafkaUtils.createStream(params, SimpleStringSchema.class);
        SingleOutputStreamOperator<Tuple2<String, Integer>> wordAndOne = dataStream.flatMap(
                (String line, Collector<Tuple2<String, Integer>> out) -> {
                    String[] split = line.split(" ");
                    Arrays.stream(split).forEach(word -> {
                        out.collect(Tuple2.of(word, 1));
                    });
                }
        ).returns(Types.TUPLE(Types.STRING, Types.INT));
        SingleOutputStreamOperator<Tuple2<String, Integer>> sum = wordAndOne.keyBy(v -> v.f0)
             .sum(1);
        SingleOutputStreamOperator<Tuple3<String, String, String>> word_count =
                sum.map(new MapFunction<Tuple2<String, Integer>, Tuple3<String, String, String>>() {
            @Override
            public Tuple3<String, String, String> map(Tuple2<String, Integer> value) throws Exception {
                return Tuple3.of("WORD_COUNT", value.f0, value.f1.toString());
            }
        });
        word_count.addSink(new FlinkRedisSink());
        FlinkKafkaUtils.getEnv().execute();
    }
}
```
