# 26、Flink 基础 - Flink状态管理
- 来源：https://ddkk.com/zhuanlan/bigdata/flink/2/26.html
- 分类：大数据框架
- 分组：教程目录
## 一、 状态概述:

Flink中的状态:

**1、** 算子状态（OperatorState）；

**2、** 键控状态（KeyedState）；

**3、** 状态后端（StateBackends）；

由一个任务维护，并且用来计算某个结果的所有数据，都属于这个任务的状态

可以认为任务状态就是一个本地变量，可以被任务的业务逻辑访问

Flink 会进行状态管理，包括状态一致性、故障处理以及高效存储和访问，以便于开发人员可以专注于应用程序的逻辑

**在Flink中，状态始终与特定算子相关联**

为了使运行时的Flink了解算子的状态，算子需要预先注册其状态

**总的来说，有两种类型的状态：**

**1、** 算子状态（OperatorState）；

1)算子状态的作用范围限定为算子任务（也就是不能跨任务访问）
**2、** 键控状态（KeyedState）；

1)根据输入数据流中定义的键（key）来维护和访问

## 二、 算子状态 Operator State

## 2.1 概述

算子状态的作用范围限定为算子任务，同一并行任务所处理的所有数据都可以访问到相同的状态。

状态对于同一任务而言是共享的。（不能跨slot）

状态算子不能由相同或不同算子的另一个任务访问。

## 2.2 算子状态数据结构

**1、** 列表状态(Liststate)；

1)将状态表示为一组数据的列表
**2、** 联合列表状态(Unionliststate)；

1)也将状态表示未数据的列表。它与常规列表状态的区别在于，在发生故障时，或者从保存点(savepoint)启动应用程序时如何恢复

3)广播状态(Broadcast state)

1)如果一个算子有多项任务，而它的每项任务状态又都相同，那么这种特殊情况最适合应用广播状态

## 2.3 代码测试

实际一般用算子状态比较少，一般还是键控状态用得多一点。

**代码:**

```java
package org.flink.state;
import org.flink.beans.SensorReading;
import org.apache.flink.api.common.functions.MapFunction;
import org.apache.flink.streaming.api.checkpoint.ListCheckpointed;
import org.apache.flink.streaming.api.datastream.DataStream;
import org.apache.flink.streaming.api.datastream.SingleOutputStreamOperator;
import org.apache.flink.streaming.api.environment.StreamExecutionEnvironment;
import java.util.Collections;
import java.util.List;
/** *
 * @remark      算子状态测试
 */
public class StateTest1_OperatorState {
    public static void main(String[] args) throws Exception{
        StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();
        env.setParallelism(1);
        // socket文本流
        DataStream<String> inputStream = env.socketTextStream("10.31.1.122", 7777);
        // 转换成SensorReading类型
        DataStream<SensorReading> dataStream = inputStream.map(line -> {
            String[] fields = line.split(",");
            return new SensorReading(fields[0], new Long(fields[1]), new Double(fields[2]));
        });
        // 定义一个有状态的map操作，统计当前分区数据个数
        SingleOutputStreamOperator<Integer> resultStream = dataStream.map(new MyCountMapper());
        resultStream.print();
        env.execute();
    }
    // 自定义MapFunction
    public static class MyCountMapper implements MapFunction<SensorReading, Integer>, ListCheckpointed<Integer>{
        // 定义一个本地变量，作为算子状态
        private Integer count = 0;
        @Override
        public Integer map(SensorReading value) throws Exception {
            count++;
            return count;
        }
        @Override
        public List<Integer> snapshotState(long checkpointId, long timestamp) throws Exception {
            return Collections.singletonList(count);
        }
        @Override
        public void restoreState(List<Integer> state) throws Exception {
            for( Integer num: state )
                count += num;
        }
    }
}
```

**输入:**

**输出:**

## 三、 键控状态 Keyed State

## 3.1 概述

键控状态是根据输入数据流中定义的键（key）来维护和访问的。

Flink 为每个key维护一个状态实例，并将具有相同键的所有数据，都分区到同一个算子任务中，这个任务会维护和处理这个key对应的状态。

当任务处理一条数据时，他会自动将状态的访问范围限定为当前数据的key。

## 3.2 键控状态数据结构

**1、** 值状态(valuestate)；

将状态表示为单个的值
**2、** 列表状态(Liststate)；

将状态表示为一组数据的列表
**3、** 映射状态(Mapstate)；

将状态表示为一组key-value对
**4、** 聚合状态(Reducingstate&AggregatingState)；

将状态表示为一个用于聚合操作的列表

## 3.3 测试代码

**代码:**

```java
package org.flink.state;
import org.flink.beans.SensorReading;
import org.apache.flink.api.common.functions.RichMapFunction;
import org.apache.flink.api.common.state.*;
import org.apache.flink.configuration.Configuration;
import org.apache.flink.streaming.api.datastream.DataStream;
import org.apache.flink.streaming.api.datastream.SingleOutputStreamOperator;
import org.apache.flink.streaming.api.environment.StreamExecutionEnvironment;
/**
 * @remark      键控状态测试
 */
public class StateTest2_KeyedState {
    public static void main(String[] args) throws Exception{
        StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();
        env.setParallelism(1);
        // socket文本流
        DataStream<String> inputStream = env.socketTextStream("10.31.1.122", 7777);
        // 转换成SensorReading类型
        DataStream<SensorReading> dataStream = inputStream.map(line -> {
            String[] fields = line.split(",");
            return new SensorReading(fields[0], new Long(fields[1]), new Double(fields[2]));
        });
        // 定义一个有状态的map操作，统计当前sensor数据个数
        SingleOutputStreamOperator<Integer> resultStream = dataStream
                .keyBy("id")
                .map( new MyKeyCountMapper() );
        resultStream.print();
        env.execute();
    }
    // 自定义RichMapFunction
    public static class MyKeyCountMapper extends RichMapFunction<SensorReading, Integer>{
        private ValueState<Integer> keyCountState;
        // 其它类型状态的声明
        private ListState<String> myListState;
        private MapState<String, Double> myMapState;
        private ReducingState<SensorReading> myReducingState;
        @Override
        public void open(Configuration parameters) throws Exception {
            keyCountState = getRuntimeContext().getState(new ValueStateDescriptor<Integer>("key-count", Integer.class, 0));
            myListState = getRuntimeContext().getListState(new ListStateDescriptor<String>("my-list", String.class));
            myMapState = getRuntimeContext().getMapState(new MapStateDescriptor<String, Double>("my-map", String.class, Double.class));
//            myReducingState = getRuntimeContext().getReducingState(new ReducingStateDescriptor<SensorReading>())
        }
        @Override
        public Integer map(SensorReading value) throws Exception {
            // 其它状态API调用
            // list state
            for(String str: myListState.get()){
                System.out.println(str);
            }
            myListState.add("hello");
            // map state
            myMapState.get("1");
            myMapState.put("2", 12.3);
            myMapState.remove("2");
            // reducing state
//            myReducingState.add(value);
            myMapState.clear();
            Integer count = keyCountState.value();
            count++;
            keyCountState.update(count);
            return count;
        }
    }
}
```

**输入:**

**输出:**

## 3.4 场景测试

假设做一个温度报警，如果一个传感器前后温差超过10度就报警。这里使用键控状态Keyed State + flatMap来实现

**代码:**

```java
package org.flink.state;
import org.flink.beans.SensorReading;
import org.apache.flink.api.common.functions.FlatMapFunction;
import org.apache.flink.api.common.functions.RichFlatMapFunction;
import org.apache.flink.api.common.functions.RichMapFunction;
import org.apache.flink.api.common.state.ValueState;
import org.apache.flink.api.common.state.ValueStateDescriptor;
import org.apache.flink.api.java.tuple.Tuple3;
import org.apache.flink.configuration.Configuration;
import org.apache.flink.streaming.api.datastream.DataStream;
import org.apache.flink.streaming.api.datastream.SingleOutputStreamOperator;
import org.apache.flink.streaming.api.environment.StreamExecutionEnvironment;
import org.apache.flink.util.Collector;
/**
 * @remark      键控状态-温度预警
 */
public class StateTest3_KeyedStateApplicationCase {
    public static void main(String[] args) throws Exception{
        StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();
        env.setParallelism(1);
        // socket文本流
        DataStream<String> inputStream = env.socketTextStream("10.31.1.122", 7777);
        // 转换成SensorReading类型
        DataStream<SensorReading> dataStream = inputStream.map(line -> {
            String[] fields = line.split(",");
            return new SensorReading(fields[0], new Long(fields[1]), new Double(fields[2]));
        });
        // 定义一个flatmap操作，检测温度跳变，输出报警
        SingleOutputStreamOperator<Tuple3<String, Double, Double>> resultStream = dataStream.keyBy("id")
                .flatMap(new TempChangeWarning(10.0));
        resultStream.print();
        env.execute();
    }
    // 实现自定义函数类
    public static class TempChangeWarning extends RichFlatMapFunction<SensorReading, Tuple3<String, Double, Double>>{
        // 私有属性，温度跳变阈值
        private Double threshold;
        public TempChangeWarning(Double threshold) {
            this.threshold = threshold;
        }
        // 定义状态，保存上一次的温度值
        private ValueState<Double> lastTempState;
        @Override
        public void open(Configuration parameters) throws Exception {
            lastTempState = getRuntimeContext().getState(new ValueStateDescriptor<Double>("last-temp", Double.class));
        }
        @Override
        public void flatMap(SensorReading value, Collector<Tuple3<String, Double, Double>> out) throws Exception {
            // 获取状态
            Double lastTemp = lastTempState.value();
            // 如果状态不为null，那么就判断两次温度差值
            if( lastTemp != null ){
                Double diff = Math.abs( value.getTemperature() - lastTemp );
                if( diff >= threshold )
                    out.collect(new Tuple3<>(value.getId(), lastTemp, value.getTemperature()));
            }
            // 更新状态
            lastTempState.update(value.getTemperature());
        }
        @Override
        public void close() throws Exception {
            lastTempState.clear();
        }
    }
}
```

**输入:**

```java
sensor_1,1547718199,35.8
sensor_1,1547718199,32.4
sensor_1,1547718199,42.4
sensor_10,1547718205,52.6
sensor_10,1547718205,22.5
sensor_7,1547718202,6.7
sensor_7,1547718202,9.9
sensor_1,1547718207,36.3
sensor_7,1547718202,19.9
sensor_7,1547718202,30
```

**输出:**

中间没有输出（sensor_7,9.9,19.9)，应该是double浮点数计算精度问题，不管它

## 四、 状态后端 State Backends

## 4.1 概述

每传入一条数据，有状态的算子任务都会读取和更新状态。

由于有效的状态访问对于处理数据的低延迟至关重要，因此每个并行任务都会在本地维护其状态，以确保快速的状态访问。

状态的存储、访问以及维护，由一个可插入的组件决定，这个组件就叫做状态后端( state backend)

状态后端主要负责两件事：本地状态管理，以及将检查点(checkPoint)状态写入远程存储

## 4.2 选择一个状态后端

**1、** MemoryStateBackend；

内存级的状态后端，会将键控状态作为内存中的对象进行管理，将它们存储在TaskManager的JVM堆上，而将checkpoint存储在JobManager的内存中

特点：快速、低延迟，但不稳定
**2、** FsStateBackend（默认）；

将checkpoint存到远程的持久化文件系统（FileSystem）上，而对于本地状态，跟MemoryStateBackend一样，也会存在TaskManager的JVM堆上

同时拥有内存级的本地访问速度，和更好的容错保证
**3、** RocksDBStateBackend；

将所有状态序列化后，存入本地的RocksDB中存储

## 4.3 配置文件

flink-conf.yaml

```java
#==============================================================================
# Fault tolerance and checkpointing
#==============================================================================
# The backend that will be used to store operator state checkpoints if
# checkpointing is enabled.
#
# Supported backends are 'jobmanager', 'filesystem', 'rocksdb', or the
# <class-name-of-factory>.
#
# state.backend: filesystem
上面这个就是默认的checkpoint存在filesystem
# Directory for checkpoints filesystem, when using any of the default bundled
# state backends.
#
# state.checkpoints.dir: hdfs://namenode-host:port/flink-checkpoints
# Default target directory for savepoints, optional.
#
# state.savepoints.dir: hdfs://namenode-host:port/flink-savepoints
# Flag to enable/disable incremental checkpoints for backends that
# support incremental checkpoints (like the RocksDB state backend). 
#
# state.backend.incremental: false
# The failover strategy, i.e., how the job computation recovers from task failures.
# Only restart tasks that may have been affected by the task failure, which typically includes
# downstream tasks and potentially upstream tasks if their produced data is no longer available for consumption.
jobmanager.execution.failover-strategy: region
上面这个region指，多个并行度的任务要是有个挂掉了，只重启那个任务所属的region（可能含有多个子任务），而不需要重启整个Flink程序
```

## 4.4 样例代码

其中使用RocksDBStateBackend需要另外加入pom依赖

```xml
<dependency>
    <groupId>org.apache.flink</groupId>
    <artifactId>flink-statebackend-rocksdb_2.11</artifactId>
    <version>1.9.0</version>
</dependency>
```

**代码:**

```java
package org.flink.state;
import org.flink.beans.SensorReading;
import org.apache.flink.api.common.restartstrategy.RestartStrategies;
import org.apache.flink.api.common.time.Time;
import org.apache.flink.contrib.streaming.state.RocksDBStateBackend;
import org.apache.flink.runtime.state.filesystem.FsStateBackend;
import org.apache.flink.runtime.state.memory.MemoryStateBackend;
import org.apache.flink.streaming.api.CheckpointingMode;
import org.apache.flink.streaming.api.datastream.DataStream;
import org.apache.flink.streaming.api.environment.StreamExecutionEnvironment;
/**
 * @remark      状态后端测试
 */
public class StateTest4_FaultTolerance {
    public static void main(String[] args) throws Exception{
        StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();
        env.setParallelism(1);
        // 1. 状态后端配置
        env.setStateBackend( new MemoryStateBackend());
        env.setStateBackend( new FsStateBackend(""));
        env.setStateBackend( new RocksDBStateBackend(""));
        // 2. 检查点配置
        env.enableCheckpointing(300);
        // 高级选项
        env.getCheckpointConfig().setCheckpointingMode(CheckpointingMode.EXACTLY_ONCE);
        env.getCheckpointConfig().setCheckpointTimeout(60000L);
        env.getCheckpointConfig().setMaxConcurrentCheckpoints(2);
        env.getCheckpointConfig().setMinPauseBetweenCheckpoints(100L);
        env.getCheckpointConfig().setPreferCheckpointForRecovery(true);
        env.getCheckpointConfig().setTolerableCheckpointFailureNumber(0);
        // 3. 重启策略配置
        // 固定延迟重启
        env.setRestartStrategy(RestartStrategies.fixedDelayRestart(3, 10000L));
        // 失败率重启
        env.setRestartStrategy(RestartStrategies.failureRateRestart(3, Time.minutes(10), Time.minutes(1)));
        // socket文本流
        DataStream<String> inputStream = env.socketTextStream("10.31.1.122", 7777);
        // 转换成SensorReading类型
        DataStream<SensorReading> dataStream = inputStream.map(line -> {
            String[] fields = line.split(",");
            return new SensorReading(fields[0], new Long(fields[1]), new Double(fields[2]));
        });
        dataStream.print();
        env.execute();
    }
}
```
