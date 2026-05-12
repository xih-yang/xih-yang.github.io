# 13、Flink 笔记 - 底层函数 API（process function）
- 来源：https://ddkk.com/zhuanlan/bigdata/flink/5/13.html
- 分类：大数据框架
- 分组：教程目录
## 一、概述

之前的转化算子是无法访问事件的时间戳信息和水位线watermark，但是，在某些情况下，显得很重要。Flink 提供了 DataStream API 的Low- Level转化算子。比如说可以访问事件时间戳、watermark、以及注册定时器，还可以输出一些特定的事件，比如超时事件等。Process Function 用来构建事件驱动的应用以及实现自定义的业务逻辑(使用之前的window 函数和转换算子无法实现)。例如，Flink SQL 就是使用 Process Function 实现的。

Flink 提供了 8 个 Process Function：

ProcessFunction

KeyedProcessFunction

CoProcessFunction

ProcessJoinFunction

BroadcastProcessFunction

KeyedBroadcastProcessFunction

ProcessWindowFunction

ProcessAllWindowFunction

## 二、KeyedProcessFunction

## 2.1、概述

KeyedProcessFunction 用来操作 KeyedStream。KeyedProcessFunction 会处理流的每一个元素，输出为 0 个、1 个或者多个元素。所有的 Process Function 都继承自RichFunction 接口，所以都有 open()、close()和 getRuntimeContext()等方法。

而KeyedProcessFunction还额外提供了两个方法:

processElement(I value, Context ctx, Collector out)：流中的每一个元素都会调用这个方法，调用结果将会放在 Collector 数据类型中输出。Context 可以访问元素的时间戳，元素的 key，以及 TimerService 时间服务。Context 还可以将结果输出到别的流(side outputs)。

onTimer(long timestamp, OnTimerContext ctx, Collector out)：

是一个回调函数。当之前注册的定时器触发时调用。参数 timestamp 为定时器所设定的触发的时间戳。Collector 为输出结果的集合。OnTimerContext 和processElement 的 Context 参数一样，提供了上下文的一些信息，例如定时器触发的时间信息(事件时间或者处理时间)。

## 2.2、TimerService 和 定时器（Timers）

Context 和 OnTimerContext 所持有的 TimerService 对象拥有以下方法:

long currentProcessingTime() 返回当前处理时间

long currentWatermark() 返回当前 watermark 的时间戳

void registerProcessingTimeTimer(long timestamp) 会注册当前 key 的processing time 的定时器。当 processing time 到达定时时间时，触发 timer。

void registerEventTimeTimer(long timestamp) 会注册当前 key 的 event time 定时器。当水位线大于等于定时器注册的时间时，触发定时器执行回调函数。

void deleteProcessingTimeTimer(long timestamp) 删除之前注册处理时间定时器。如果没有这个时间戳的定时器，则不执行。

void deleteEventTimeTimer(long timestamp) 删除之前注册的事件时间定时器，如果没有此时间戳的定时器，则不执行。

当定时器 timer 触发时，会执行回调函数 onTimer()。注意定时器 timer 只能在keyed streams 上面使用。

## 2.3、案例

监控温度传感器的温度值，如果温度值在 10 秒钟之内(processing time)连续上升，则报警。

```java
import com.tan.flink.bean.SensorReading;
import com.tan.flink.source.SourceFromCustom;
import org.apache.flink.api.common.state.ValueState;
import org.apache.flink.api.common.state.ValueStateDescriptor;
import org.apache.flink.configuration.Configuration;
import org.apache.flink.streaming.api.datastream.DataStreamSource;
import org.apache.flink.streaming.api.datastream.SingleOutputStreamOperator;
import org.apache.flink.streaming.api.environment.StreamExecutionEnvironment;
import org.apache.flink.streaming.api.functions.KeyedProcessFunction;
import org.apache.flink.util.Collector;
public class ProcessFunction_KeyedProcessFunction {
    public static void main(String[] args) throws Exception {
        StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();
        // 为了测试效果 用默认的 时间特征
        // env.setStreamTimeCharacteristic(TimeCharacteristic.EventTime);
        //env.getConfig().setAutoWatermarkInterval(500L);
        DataStreamSource<SensorReading> inputDataStream = env.addSource(new SourceFromCustom.CustomSource());
        SingleOutputStreamOperator<String> resultDataStream = inputDataStream.keyBy(SensorReading::getId)
                .process(new CustomKeyedProcessFunction(10));
        resultDataStream.print();
        env.execute();
    }
    /**
     * String -> key 类型
     * SensorReading -> 输入类型
     * String -> 输出类型
     */
    public static class CustomKeyedProcessFunction extends KeyedProcessFunction<String, SensorReading, String> {
        // 时间间隔
        private Integer internal;
        public CustomKeyedProcessFunction(Integer internal) {
            this.internal = internal;
        }
        // 上一条数据的传感器温度（状态编程在下面具体介绍）
        private ValueState<Double> lastTemperatureState;
        // 定时器的时间戳
        private ValueState<Long> timerTsState;
        @Override
        public void open(Configuration parameters) throws Exception {
            /**
             * "last-temp" -> 当前状态变量的名称
             * Double.class -> 当前状态变量的类型
             * Double.MIN_VALUE -> 当前状态变量的初始值
             */
            lastTemperatureState = getRuntimeContext().getState(new ValueStateDescriptor<Double>("last-temp", Double.class, 0.0d));
            timerTsState = getRuntimeContext().getState(new ValueStateDescriptor<Long>("last-timer-ts", Long.class, 0L));
        }
        @Override
        public void processElement(SensorReading input, Context context, Collector<String> collector) throws Exception {
            // 1、获取上一次状态值
            Double lastTemperature = lastTemperatureState.value();
            Long timerState = timerTsState.value();
            // 2、更新温度状态
            lastTemperatureState.update(input.getTemperature());
            // 3、比较上一次温度
            if (input.getTemperature() > lastTemperature && timerState == 0) {
                // first data
                long timeTs = context.timerService().currentProcessingTime() + internal * 1000L;
                // 注册定时器
                context.timerService().registerProcessingTimeTimer(timeTs);
                // 更新定时器状态值
                timerTsState.update(timeTs);
            } else if (input.getTemperature() < lastTemperature && timerState != 0) {
                // 当前温度小于上一次温度 并且定时器不为null
                // 删除定时器
                context.timerService().deleteProcessingTimeTimer(timerState);
                // 清除定时状态变量
                timerTsState.clear();
            }
        }
        @Override
        public void onTimer(long timestamp, OnTimerContext ctx, Collector<String> out) throws Exception {
            // 如果触发定时器函数 说明该传感器在10s内温度连续上升，需要预警
            String key = ctx.getCurrentKey();
            String resultStr = "传感器ID为：" + key + "在10s内温度连续上升...";
            out.collect(resultStr);
            // 清空定时器值
            timerTsState.clear();
        }
    }
}
```

## 三、侧输出流（sideOutput）

## 3.1、概述

大部分的 DataStream API 的算子的输出是单一输出，也就是某种数据类型的流。除了 split 算子，可以将一条流分成多条流，这些流的数据类型也都相同。process function 的 side outputs 功能可以产生多条流，并且这些流的数据类型可以不一样。一个 side output 可以定义为 OutputTag[X]对象，X 是输出流的数据类型。process

function 可以通过 Context 对象发射一个事件到一个或者多个 side outputs。

## 3.2、案例

根据传感器温度，将低于60度的数据输入到侧输出流

```java
import com.tan.flink.bean.SensorReading;
import com.tan.flink.source.SourceFromCustom;
import org.apache.flink.streaming.api.datastream.DataStream;
import org.apache.flink.streaming.api.datastream.DataStreamSource;
import org.apache.flink.streaming.api.datastream.SingleOutputStreamOperator;
import org.apache.flink.streaming.api.environment.StreamExecutionEnvironment;
import org.apache.flink.streaming.api.functions.ProcessFunction;
import org.apache.flink.util.Collector;
import org.apache.flink.util.OutputTag;
public class SideOutput_Demo {
    public static void main(String[] args) throws Exception {
        StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();
        DataStreamSource<SensorReading> inputDataStream = env.addSource(new SourceFromCustom.CustomSource());
        // 定义获取侧输出流
        final OutputTag<String> outputTag = new OutputTag<String>("side-out-put"){
     };
        SingleOutputStreamOperator<SensorReading> resultDataStream = inputDataStream.process(new CustomSideOutput(outputTag));
        DataStream<String> sideOutputDataStream = resultDataStream.getSideOutput(outputTag);
        sideOutputDataStream.print("low > ");
        resultDataStream.print();
        env.execute();
    }
    public static class CustomSideOutput extends ProcessFunction<SensorReading, SensorReading> {
        private OutputTag<String> outputTag;
        public CustomSideOutput(OutputTag<String> outputTag) {
            this.outputTag = outputTag;
        }
        @Override
        public void processElement(SensorReading sensorReading, Context context, Collector<SensorReading> collector) throws Exception {
            if (sensorReading.getTemperature() < 60) {
                String msg = sensorReading.getId() + " 的温度低于60度 -> " + sensorReading.getTemperature();
                context.output(outputTag, msg);
            }
            collector.collect(sensorReading);
        }
    }
}
```
