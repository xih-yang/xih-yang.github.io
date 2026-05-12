# 14、Flink 笔记 - 状态编程
- 来源：https://ddkk.com/zhuanlan/bigdata/flink/5/14.html
- 分类：大数据框架
- 分组：教程目录
## 一、概述

以wordcount为例，为什么每次输入数据，flink都能统计每个单词的总数呢？我们都没有显示保存每个单词的状态值，但是每来一条数据，都能计算单词的总数。事实上，flink在底层维护了每个 key的状态，就是state。比较于Spark，Spark如果没有显示保存其中的状态，它会统计当前批次的单词次数，也就是没有了历史总数，这就相当于，来一条数据我就处理，不管之前的数据，这就是无状态。总之，状态在Flink编程中显得极其重要，也是新一代实时流式处理框架的核心。

## 二、state 概念

state：一般指一个具体的task/operator的状态。State可以被记录，在失败的情况下数据还可以恢复，Flink中有两种基本类型的State：Keyed State，Operator State，他们两种都可以以两种形式存在：原始状态(raw state)和托管状态(managed state)。

托管状态：由Flink框架管理的状态，我们通常使用的就是这种。

原始状态：由用户自行管理状态具体的数据结构，框架在做checkpoint的时候，使用byte[]来读写状态内容，对其内部数据结构一无所知。通常在DataStream上的状态推荐使用托管的状态，当实现一个用户自定义的operator时，会使用到原始状态。但是我们工作中一般不常用，所以我们不考虑它。

下图是保存状态流程：

## 三、state 类型

## 3.1、Operator State（算子状态）

算子状态的作用范围限定为算子任务。这意味着由同一并行任务所处理的所有

数据都可以访问到相同的状态，状态对于同一任务而言是共享的。算子状态不能由相同或不同算子的另一个任务访问。

state是task级别的state，说白了就是每个task对应一个state。

Flink 为算子状态提供三种基本数据结构：

### 3.1.1、List State（列表状态）

简单来说，就是用一个列表集合保存当前task的状态。

### 3.1.2、Union List State（联合列表状态）

也是将当前task的状态保存到列表集合中，也普通的列表状态不同的是，当发生故障或者利用检查点（Checkpoint）启动应用程序的时候，就可以利用联合列表状态恢复。

### 3.1.3、Broadcast State（广播状态）

如果一个算子有多项任务，而它的每项任务状态又都相同，那么这种特殊情况最适合应用广播状态。相当于 Spark 的广播机制。

## 3.2、Keyed State（键控状态）

键控状态是根据输入数据流中定义的键（key）来维护和访问的。Flink 为每个键值维护一个状态实例，并将具有相同键的所有数据，都分区到同一个算子任务中，这个任务会维护和处理这个 key 对应的状态。当任务处理一条数据时，它会自动将状态的访问范围限定为当前数据的 key。因此，具有相同 key 的所有数据都会访问相同的状态。Keyed State 很类似于一个分布式的 key-value map 数据结构，只能用于 KeyedStream（keyBy 算子处理之后）。

Flink 的 Keyed State 支持以下数据类型：

### 3.2.1、单值状态

ValueState[T] 保存单个值，数据类型是T

get操作： ValueState.value()

set操作： ValueState.update(T value)

### 3.2.1、列表状态

ListState[T] 保存列表，数据类型是T

添加一个元素： ListState.add(T value)

添加多个元素：ListState.addAll(List values)

获取全部数据：ListState.get()返回 Iterable

更新全部数据：ListState.update(List values)

### 3.2.3、key-value 状态

MapState保存 Key-Value 对状态

获取一个 key 的value：MapState.get(UK key)

添加一个key-value：MapState.put(UK key, UV value)

判断是否包含一个key：MapState.contains(UK key)

移除一个key：MapState.remove(UK key)

### 3.2.4、聚合状态

第一个聚合状态：ReducingState[T] 之前有所代码实现过。

第二个聚合状态：AggregatingState

### 3.2.5、清空状态

State.clear()是清空操作

## 3.3、案例

### 3.3.1、ValueState -案例

根据传感器id每接收到三条数据就计算平均温度并输出。

```java
import com.tan.flink.bean.SensorReading;
import com.tan.flink.source.SourceFromCustom;
import org.apache.flink.api.common.functions.RichFlatMapFunction;
import org.apache.flink.api.common.state.ValueState;
import org.apache.flink.api.common.state.ValueStateDescriptor;
import org.apache.flink.api.common.typeinfo.Types;
import org.apache.flink.api.java.tuple.Tuple2;
import org.apache.flink.configuration.Configuration;
import org.apache.flink.streaming.api.datastream.DataStreamSource;
import org.apache.flink.streaming.api.environment.StreamExecutionEnvironment;
import org.apache.flink.util.Collector;
public class State_ValueState {
    public static void main(String[] args) throws Exception {
        StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();
        DataStreamSource<SensorReading> inputDataStream = env.addSource(new SourceFromCustom.CustomSource());
        inputDataStream.keyBy(SensorReading::getId)
                .flatMap(new CustomFlatMapFunction())
                .print();
        env.execute();
    }
    /**
     * RichFlatMapFunction -> FlatMapFunction 的富函数 有生命周期的
     * SensorReading -> 输入类型
     * Tuple2<String,Double> -> 输出类型
     */
    public static class CustomFlatMapFunction extends RichFlatMapFunction<SensorReading, Tuple2<String, Double>> {
        private ValueState<Tuple2<Long, Double>> valueState;
        @Override
        public void open(Configuration conf) throws Exception {
            // 初始化
            valueState = getRuntimeContext().getState(new ValueStateDescriptor<Tuple2<Long, Double>>("value-state", Types.TUPLE(Types.LONG, Types.DOUBLE)));
        }
        @Override
        public void flatMap(SensorReading sensorReading, Collector<Tuple2<String, Double>> collector) throws Exception {
            Tuple2<Long, Double> lastState = valueState.value();
            // 没有初始化
            if (lastState == null) {
                lastState = Tuple2.of(0L, 0.0d);
            }
            lastState.f0 += 1;
            lastState.f1 += sensorReading.getTemperature();
            valueState.update(lastState);
            if (lastState.f0 >= 3) {
                double avg = lastState.f1 / lastState.f0;
                collector.collect(new Tuple2<>(sensorReading.getId(), avg));
                valueState.clear();
            }
        }
    }
}
```

### 3.3.2、ListState - 案例

根据传感器id每接收到三条数据就计算平均温度并输出

```java
import com.tan.flink.bean.SensorReading;
import com.tan.flink.source.SourceFromCustom;
import org.apache.flink.api.common.functions.RichFlatMapFunction;
import org.apache.flink.api.common.state.ListState;
import org.apache.flink.api.common.state.ListStateDescriptor;
import org.apache.flink.api.common.typeinfo.Types;
import org.apache.flink.api.java.tuple.Tuple2;
import org.apache.flink.configuration.Configuration;
import org.apache.flink.shaded.com.google.common.collect.Lists;
import org.apache.flink.streaming.api.datastream.DataStreamSource;
import org.apache.flink.streaming.api.environment.StreamExecutionEnvironment;
import org.apache.flink.util.Collector;
import java.util.ArrayList;
import java.util.Collections;
public class State_ListState {
    public static void main(String[] args) throws Exception {
        StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();
        DataStreamSource<SensorReading> inputDataStream = env.addSource(new SourceFromCustom.CustomSource());
        inputDataStream.keyBy(SensorReading::getId)
                .flatMap(new CustomFlatMapFunction())
                .print();
        env.execute();
    }
    public static class CustomFlatMapFunction extends RichFlatMapFunction<SensorReading, Tuple2<String, Double>> {
        private ListState<Tuple2<String, Double>> listState;
        @Override
        public void open(Configuration parameters) throws Exception {
            listState = getRuntimeContext().getListState(new ListStateDescriptor<Tuple2<String, Double>>("list-state", Types.TUPLE(Types.STRING, Types.DOUBLE)));
        }
        @Override
        public void flatMap(SensorReading sensorReading, Collector<Tuple2<String, Double>> collector) throws Exception {
            Iterable<Tuple2<String, Double>> lastListState = listState.get();
            // 还没有初始化
            if (lastListState == null) {
                listState.addAll(Collections.emptyList());
            }
            // 添加元素
            listState.add(new Tuple2<>(sensorReading.getId(), sensorReading.getTemperature()));
            // 判断
            ArrayList<Tuple2<String, Double>> listTuples = Lists.newArrayList(listState.get());
            if (listTuples.size() >= 3) {
                long count = listTuples.size();
                double tempTotal = 0.0;
                for (Tuple2<String, Double> tuple2 : listTuples) {
                    tempTotal += tuple2.f1;
                }
                double avg = tempTotal / count;
                collector.collect(new Tuple2<>(sensorReading.getId(), avg));
                listState.clear();
            }
        }
    }
}
```

### 3.3.3、MapState - 案例

根据传感器id每接收到三条数据就计算平均温度并输出

```java
public class State_MapState {
    public static void main(String[] args) throws Exception {
        StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();
        DataStreamSource<SensorReading> inputDataStream = env.addSource(new SourceFromCustom.CustomSource());
        inputDataStream.keyBy(SensorReading::getId)
                .flatMap(new CustomFlatMapFunction())
                .print();
        env.execute();
    }
    public static class CustomFlatMapFunction extends RichFlatMapFunction<SensorReading, Tuple2<String, Double>> {
        private MapState<String, Double> mapState;
        @Override
        public void open(Configuration parameters) throws Exception {
            mapState = getRuntimeContext().getMapState(new MapStateDescriptor<String, Double>("map-state", String.class, Double.class));
        }
        @Override
        public void flatMap(SensorReading sensorReading, Collector<Tuple2<String, Double>> collector) throws Exception {
            mapState.put(UUID.randomUUID().toString().substring(0, 8), sensorReading.getTemperature());
            if (Lists.newArrayList(mapState.keys()).size() >= 3) {
                int count = 0;
                double tempTotal = 0.0;
                for (Double temp : Lists.newArrayList(mapState.values())) {
                    count++;
                    tempTotal += temp;
                }
                double avg = tempTotal / count;
                collector.collect(new Tuple2<String, Double>(sensorReading.getId(), avg));
                mapState.clear();
            }
        }
    }
}
```

### 3.3.4、ReducingState - 案例

根据传感器id统计所有温度的总和

```java
public class State_ReducingState {
    public static void main(String[] args) throws Exception {
        StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();
        DataStreamSource<SensorReading> inputDataStream = env.addSource(new SourceFromCustom.CustomSource());
        inputDataStream.keyBy(SensorReading::getId)
                .flatMap(new CustomFlatMapFunction())
                .print();
        env.execute();
    }
    public static class CustomFlatMapFunction extends RichFlatMapFunction<SensorReading, Tuple2<String, Double>> {
        private ReducingState<Double> reducingState;
        @Override
        public void open(Configuration parameters) throws Exception {
            reducingState = getRuntimeContext().getReducingState(new ReducingStateDescriptor<Double>("reducing-state", new ReduceFunction<Double>() {
                @Override
                public Double reduce(Double input1, Double input2) throws Exception {
                    return input1 + input2;
                }
            }, Double.class));
        }
        @Override
        public void flatMap(SensorReading sensorReading, Collector<Tuple2<String, Double>> collector) throws Exception {
            reducingState.add(sensorReading.getTemperature());
            collector.collect(new Tuple2<>(sensorReading.getId(), reducingState.get()));
        }
    }
}
```

### 3.3.5、AggregateState - 案例

根据传感器id聚合性输出所有温度数据（持续性）

```java
import com.tan.flink.bean.SensorReading;
import com.tan.flink.source.SourceFromCustom;
import org.apache.flink.api.common.functions.AggregateFunction;
import org.apache.flink.api.common.functions.RichFlatMapFunction;
import org.apache.flink.api.common.state.AggregatingState;
import org.apache.flink.api.common.state.AggregatingStateDescriptor;
import org.apache.flink.api.java.tuple.Tuple2;
import org.apache.flink.configuration.Configuration;
import org.apache.flink.streaming.api.datastream.DataStreamSource;
import org.apache.flink.streaming.api.environment.StreamExecutionEnvironment;
import org.apache.flink.util.Collector;
public class State_AggregatingState {
    public static void main(String[] args) throws Exception {
        StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();
        DataStreamSource<SensorReading> inputDataStream = env.addSource(new SourceFromCustom.CustomSource());
        inputDataStream.keyBy(SensorReading::getId)
                .flatMap(new CustomFlatMapFunction())
                .print();
        env.execute();
    }
    public static class CustomFlatMapFunction extends RichFlatMapFunction<SensorReading, Tuple2<String, String>> {
        private AggregatingState<SensorReading, String> aggregatingState;
        @Override
        public void open(Configuration parameters) throws Exception {
            /**
             * SensorReading -> 输入类型
             * String  -> 累加器
             * String -> 输出类型
             */
            AggregatingStateDescriptor<SensorReading, String, String> descriptor = new AggregatingStateDescriptor<>("aggregating-state", new AggregateFunction<SensorReading, String, String>() {
                // 初始化输出类型前缀
                @Override
                public String createAccumulator() {
                    return "温度列表：";
                }
                // 每来一条数据就拼接返回值
                @Override
                public String add(SensorReading sensorReading, String acc) {
                    return acc + "," + sensorReading.getTemperature();
                }
                // 输出返回值
                @Override
                public String getResult(String acc) {
                    return acc;
                }
                // 不同分区的结果进行拼接
                @Override
                public String merge(String acc1, String acc2) {
                    return acc1 + "," + acc2;
                }
            }, String.class);
            aggregatingState = getRuntimeContext().getAggregatingState(descriptor);
        }
        @Override
        public void flatMap(SensorReading sensorReading, Collector<Tuple2<String, String>> collector) throws Exception {
            aggregatingState.add(sensorReading);
            collector.collect(new Tuple2<>(sensorReading.getId(), aggregatingState.get()));
        }
    }
}
```
