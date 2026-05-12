# 09、Flink 实战 - KeyedProcessFunction 状态编程 温度连续升高并报警
- 来源：https://ddkk.com/zhuanlan/bigdata/flink/6/9.html
- 分类：大数据框架
- 分组：教程目录
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

在Flink1.12中，定义状态描述器时，**不建议**加默认值了，官方推荐在使用前，判断state是否为null，如果为null给默认值。

**给默认值很重要**，如果lastTempState.value() == null，而且你任然使用了state里的值，那肯定会报异常的。

```java
//Flink1.12版本不推荐在定义描述器时给默认值，所以先判断为null时，给个默认值
if (lastTempState.value() == null) {
        lastTempState.update(new SensorRecord("", 0.0, 0L));
}
if (timerTsState.value() == null){
        timerTsState.update(0L);
}
```

定时器的使用，可以用处理时间，也可以用数据的事件事件

```java
//处理时间定时器
 ctx.timerService().registerProcessingTimeTimer(ts);
//事件时间定时器
 ctx.timerService().registerEventTimeTimer(ts);
```

当前定时器触发时，会掉用onTimer方法，再这里可以做些数据处理

```java
@Override
public void onTimer(long timestamp, OnTimerContext ctx, Collector<String> out) throws Exception {
    //定时器触发，输出报警信息
    out.collect("传感器" + ctx.getCurrentKey().toString() + "温度值连续上升");
    timerTsState.clear();
}
```

完整的代码如下：

```java
package learn.test05_state;
import learn.common.constant.BaseConstant;
import learn.common.entity.SensorRecord;
import learn.common.util.SensorRecordUtils;
import org.apache.flink.api.common.state.*;
import org.apache.flink.configuration.Configuration;
import org.apache.flink.streaming.api.datastream.DataStream;
import org.apache.flink.streaming.api.datastream.DataStreamSource;
import org.apache.flink.streaming.api.datastream.SingleOutputStreamOperator;
import org.apache.flink.streaming.api.environment.StreamExecutionEnvironment;
import org.apache.flink.streaming.api.functions.KeyedProcessFunction;
import org.apache.flink.util.Collector;
public class Demo12_ValueState {
    public static void main(String[] args) throws Exception {
        //执行环境
        StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();
        //便于测试，设置1
        env.setParallelism(1);
        DataStreamSource<String> source = env.socketTextStream(BaseConstant.URL, BaseConstant.PORT);
        DataStream<SensorRecord> dataStream = source
                .map(new SensorRecordUtils.BeanMap())
                .filter(a -> a != null);
        SingleOutputStreamOperator<String> process = dataStream.keyBy(a -> a.getId())
                .process(new MyProcessFunction(10));
        process.print();
        env.execute("Demo12_ValueState");
    }
    /**
     * 实现自定义处理函数，监测一段时间内温度连续上升
     */
    public static class MyProcessFunction extends KeyedProcessFunction<String, SensorRecord, String> {
        //时间间隔
        private Integer interval;
        public MyProcessFunction(Integer interval) {
            this.interval = interval;
        }
        private transient ValueState<SensorRecord> lastTempState;
        private transient ValueState<Long> timerTsState;
        @Override
        public void open(Configuration parameters) throws Exception {
            //上一次的温度的state描述器
            ValueStateDescriptor<SensorRecord> lastTempStateDescriptor = new ValueStateDescriptor<>("last-temp", SensorRecord.class);
            //获取state
            lastTempState = getRuntimeContext().getState(lastTempStateDescriptor);
            //定时器结束时间的state描述器
            ValueStateDescriptor<Long> timerTsStateDescriptor = new ValueStateDescriptor<Long>("timer-ts", Long.class);
            timerTsState = getRuntimeContext().getState(timerTsStateDescriptor);
        }
        @Override
        public void processElement(SensorRecord value, Context ctx, Collector<String> out) throws Exception {
            //Flink1.12版本不推荐在定义描述器时给默认值，所以先判断为null时，给个默认值
            if (lastTempState.value() == null) {
                lastTempState.update(new SensorRecord("", 0.0, 0L));
            }
            if (timerTsState.value() == null){
                timerTsState.update(0L);
            }
            //取出状态-上次的温度
            SensorRecord lastTemp = lastTempState.value();
            //取出定时器的结束时间
            Long timerTs = timerTsState.value();
            //如果温度上升，注册10秒定时器，开始等待
            if (value.getRecord() > lastTemp.getRecord() && timerTs == 0) {
                //计算定时器时间戳
                //为了方便测试，用了当前系统的处理时间，而不是数据中的事件时间
                Long ts = ctx.timerService().currentProcessingTime() + interval * 1000L;
                System.out.println("ts = " + ts);
                //在处理时间ProcessingTime上，设置了定时器
                ctx.timerService().registerProcessingTimeTimer(ts);
                timerTsState.update(ts);
            } else if (value.getRecord() < lastTemp.getRecord()) {
                //温度减低了，删掉定时器
                if (timerTs != null) {
                    ctx.timerService().deleteProcessingTimeTimer(timerTs);
                }
                //温度减低了，state定时器结束时间清空
                timerTsState.clear();
            }
            //更新最近一次温度的state
            lastTempState.update(value);
        }
        @Override
        public void onTimer(long timestamp, OnTimerContext ctx, Collector<String> out) throws Exception {
            //定时器触发，输出报警信息
            out.collect("传感器" + ctx.getCurrentKey().toString() + "温度值连续上升");
            timerTsState.clear();
            System.out.println("timerTsState.clear()");
        }
        @Override
        public void close() throws Exception {
            lastTempState.clear();
        }
    }
}
```
