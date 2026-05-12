# 11、Flink 笔记 - window窗口（二）
- 来源：https://ddkk.com/zhuanlan/bigdata/flink/5/11.html
- 分类：大数据框架
- 分组：教程目录
## 一、触发器（Trigger）

## 1.1、案例一

利用global window + trigger 计算单词出现三次统计一次（有点像CountWindow）

某台虚拟机或者mac 终端输入：nc -lk 9999

```java
import org.apache.flink.api.common.functions.FlatMapFunction;
import org.apache.flink.api.java.tuple.Tuple2;
import org.apache.flink.streaming.api.datastream.DataStreamSource;
import org.apache.flink.streaming.api.datastream.SingleOutputStreamOperator;
import org.apache.flink.streaming.api.environment.StreamExecutionEnvironment;
import org.apache.flink.streaming.api.windowing.assigners.GlobalWindows;
import org.apache.flink.streaming.api.windowing.triggers.CountTrigger;
import org.apache.flink.util.Collector;
public class WindowFunction_Global_Trigger {
    public static void main(String[] args) throws Exception {
        StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();
        DataStreamSource<String> inputDataStream = env.socketTextStream("localhost", 9999);
        SingleOutputStreamOperator<Tuple2<String, Integer>> resultDataStream = inputDataStream.flatMap(new CustomFlatMap())
                .keyBy(0)
                .window(GlobalWindows.create()) // 如果不调用trigger 那么程序一直处于数据收集阶段 无法触发计算
                .trigger(CountTrigger.of(3))
                .sum(1);
        resultDataStream.print();
        env.execute();
    }
    public static class CustomFlatMap implements FlatMapFunction<String, Tuple2<String, Integer>> {
        @Override
        public void flatMap(String input, Collector<Tuple2<String, Integer>> collector) throws Exception {
            String[] words = input.split(" ");
            for (String word : words) {
                collector.collect(new Tuple2<>(word, 1));
            }
        }
    }
}
```

终端输入：

hello flink

hello spark

hello hive

控制台打印：（hello，3）

## 1.2、案例二

利用global window 自定义一个CountWindow，也是单词出现3次统计一次

```java
import org.apache.flink.api.common.functions.FlatMapFunction;
import org.apache.flink.api.common.functions.ReduceFunction;
import org.apache.flink.api.common.state.ReducingState;
import org.apache.flink.api.common.state.ReducingStateDescriptor;
import org.apache.flink.api.java.tuple.Tuple2;
import org.apache.flink.streaming.api.datastream.DataStreamSource;
import org.apache.flink.streaming.api.datastream.SingleOutputStreamOperator;
import org.apache.flink.streaming.api.environment.StreamExecutionEnvironment;
import org.apache.flink.streaming.api.windowing.assigners.GlobalWindows;
import org.apache.flink.streaming.api.windowing.triggers.Trigger;
import org.apache.flink.streaming.api.windowing.triggers.TriggerResult;
import org.apache.flink.streaming.api.windowing.windows.GlobalWindow;
import org.apache.flink.util.Collector;
public class WindowFunction_CustomTrigger {
    public static void main(String[] args) throws Exception {
        StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();
        DataStreamSource<String> inputDataStream = env.socketTextStream("localhost", 9999);
        SingleOutputStreamOperator<Tuple2<String, Integer>> resultDataStream = inputDataStream.flatMap(new CustomFlatMap())
                .keyBy(0)
                .window(GlobalWindows.create())
                .trigger(new CustomTrigger(3))
                .sum(1);
        resultDataStream.print();
        env.execute();
    }
    public static class CustomFlatMap implements FlatMapFunction<String, Tuple2<String, Integer>> {
        @Override
        public void flatMap(String input, Collector<Tuple2<String, Integer>> collector) throws Exception {
            String[] words = input.split(" ");
            for (String word : words) {
                collector.collect(new Tuple2<>(word, 1));
            }
        }
    }
    public static class CustomTrigger extends Trigger<Tuple2<String, Integer>, GlobalWindow> {
        private long maxCount;
        public CustomTrigger(long count) {
            this.maxCount = count;
        }
        // 定义一个状态保存 每个 key 对应的 count 值 （涉及到状态编程 后面会具体介绍）
        private ReducingStateDescriptor<Long> stateDescriptor = new ReducingStateDescriptor<Long>("count", new ReduceFunction<Long>() {
            @Override
            public Long reduce(Long input1, Long input2) throws Exception {
                return input1 + input2;
            }
        }, Long.class);
        /**
         * 每来一条数据都会执行
         *
         * @param input          输入类型
         * @param timestamp      处理时间戳
         * @param globalWindow   全窗口类型(所属窗口)
         * @param triggerContext trigger 上下文
         * @return TriggerResult
         * 1. TriggerResult.CONTINUE ：表示对 window 不做任何处理
         * 2. TriggerResult.FIRE ：表示触发 window 的计算
         * 3. TriggerResult.PURGE ：表示清除 window 中的所有数据
         * 4. TriggerResult.FIRE_AND_PURGE ：表示先触发 window 计算，然后删除 window 中的数据
         * @throws Exception
         */
        @Override
        public TriggerResult onElement(Tuple2<String, Integer> input, long timestamp, GlobalWindow globalWindow, TriggerContext triggerContext) throws Exception {
            // 获取 key 对应之前 count 状态值
            ReducingState<Long> count = triggerContext.getPartitionedState(stateDescriptor);
            // 每来一条数据 累加 1
            count.add(1L);
            if (maxCount == count.get()) {
                // 如果已经达到预期的count
                // 1 清除 count 状态
                count.clear();
                // 2 先触发计算 再清空窗口的数据
                return TriggerResult.FIRE_AND_PURGE;
            }
            // 3 否则不做任务处理
            return TriggerResult.CONTINUE;
        }
        @Override
        public TriggerResult onProcessingTime(long l, GlobalWindow globalWindow, TriggerContext triggerContext) throws Exception {
            // 基于 processingTime 定时器处理逻辑
            return TriggerResult.CONTINUE;
        }
        @Override
        public TriggerResult onEventTime(long l, GlobalWindow globalWindow, TriggerContext triggerContext) throws Exception {
            // 基于 EventTime 定时器处理逻辑
            return TriggerResult.CONTINUE;
        }
        @Override
        public void clear(GlobalWindow globalWindow, TriggerContext triggerContext) throws Exception {
            // 清理状态
            triggerContext.getPartitionedState(stateDescriptor).clear();
        }
    }
}
```

终端输入：

world spark

world flink

world hive

控制台打印：（world，3）

## 二、移除器（Evictor）

## 2.1 案例

利用global window + trigger + evictor 实现每个2个单词统计最近3个单词

```java
import org.apache.flink.api.common.functions.FlatMapFunction;
import org.apache.flink.api.common.functions.ReduceFunction;
import org.apache.flink.api.common.state.ReducingState;
import org.apache.flink.api.common.state.ReducingStateDescriptor;
import org.apache.flink.api.java.tuple.Tuple2;
import org.apache.flink.streaming.api.datastream.DataStreamSource;
import org.apache.flink.streaming.api.datastream.SingleOutputStreamOperator;
import org.apache.flink.streaming.api.environment.StreamExecutionEnvironment;
import org.apache.flink.streaming.api.windowing.assigners.GlobalWindows;
import org.apache.flink.streaming.api.windowing.evictors.Evictor;
import org.apache.flink.streaming.api.windowing.triggers.Trigger;
import org.apache.flink.streaming.api.windowing.triggers.TriggerResult;
import org.apache.flink.streaming.api.windowing.windows.GlobalWindow;
import org.apache.flink.streaming.runtime.operators.windowing.TimestampedValue;
import org.apache.flink.util.Collector;
import java.util.Iterator;
public class WindowFuncton_CustomEvictor {
    public static void main(String[] args) throws Exception {
        StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();
        DataStreamSource<String> inputDataStream = env.socketTextStream("localhost", 9999);
        SingleOutputStreamOperator<Tuple2<String, Integer>> resultDataStream = inputDataStream.flatMap(new CustomFlatMap())
                .keyBy(0)
                .window(GlobalWindows.create())
                .trigger(new CustomTrigger(2)) // 每来2条数据触发后面的计算
                .evictor(new CustomEvictor(3))
                .sum(1);
        resultDataStream.print();
        env.execute();
    }
    public static class CustomFlatMap implements FlatMapFunction<String, Tuple2<String, Integer>> {
        @Override
        public void flatMap(String input, Collector<Tuple2<String, Integer>> collector) throws Exception {
            String[] words = input.split(" ");
            for (String word : words) {
                collector.collect(new Tuple2<>(word, 1));
            }
        }
    }
    public static class CustomTrigger extends Trigger<Tuple2<String, Integer>, GlobalWindow> {
        private long maxCount;
        public CustomTrigger(long count) {
            this.maxCount = count;
        }
        // 定义一个状态保存 每个 key 对应的 count 值 （涉及到状态编程 后面会具体介绍）
        private ReducingStateDescriptor<Long> stateDescriptor = new ReducingStateDescriptor<Long>("count", new ReduceFunction<Long>() {
            @Override
            public Long reduce(Long input1, Long input2) throws Exception {
                return input1 + input2;
            }
        }, Long.class);
        /**
         * 每来一条数据都会执行
         *
         * @param input          输入类型
         * @param timestamp      处理时间戳
         * @param globalWindow   全窗口类型(所属窗口)
         * @param triggerContext trigger 上下文
         * @return TriggerResult
         * 1. TriggerResult.CONTINUE ：表示对 window 不做任何处理
         * 2. TriggerResult.FIRE ：表示触发 window 的计算
         * 3. TriggerResult.PURGE ：表示清除 window 中的所有数据
         * 4. TriggerResult.FIRE_AND_PURGE ：表示先触发 window 计算，然后删除 window 中的数据
         * @throws Exception
         */
        @Override
        public TriggerResult onElement(Tuple2<String, Integer> input, long timestamp, GlobalWindow globalWindow, TriggerContext triggerContext) throws Exception {
            // 获取 key 对应之前 count 状态值
            ReducingState<Long> count = triggerContext.getPartitionedState(stateDescriptor);
            // 每来一条数据 累加 1
            count.add(1L);
            if (maxCount == count.get()) {
                // 如果已经达到预期的count
                // 1 清除 count 状态
                count.clear();
                // 2 先触发计算 不清空窗口的数据
                return TriggerResult.FIRE;
            }
            // 3 否则不做任务处理
            return TriggerResult.CONTINUE;
        }
        @Override
        public TriggerResult onProcessingTime(long l, GlobalWindow globalWindow, TriggerContext triggerContext) throws Exception {
            // 基于 processingTime 定时器处理逻辑
            return TriggerResult.CONTINUE;
        }
        @Override
        public TriggerResult onEventTime(long l, GlobalWindow globalWindow, TriggerContext triggerContext) throws Exception {
            // 基于 EventTime 定时器处理逻辑
            return TriggerResult.CONTINUE;
        }
        @Override
        public void clear(GlobalWindow globalWindow, TriggerContext triggerContext) throws Exception {
            // 清理状态
            triggerContext.getPartitionedState(stateDescriptor).clear();
        }
    }
    public static class CustomEvictor implements Evictor<Tuple2<String, Integer>, GlobalWindow> {
        // 定义窗口的数据大小
        private long windowCount;
        public CustomEvictor(long windowCount) {
            this.windowCount = windowCount;
        }
        /**
         * @param iterable       当前窗口的全部数据 （可以认为这些数据是有顺序的（相对队列））
         * @param size           当前窗口的数据大小
         * @param globalWindow
         * @param evictorContext 上下文
         */
        @Override
        public void evictBefore(Iterable<TimestampedValue<Tuple2<String, Integer>>> iterable, int size, GlobalWindow globalWindow, EvictorContext evictorContext) {
            // 如果输入数据窗口大小等于指定窗口大小 没有数据可以移除
            if (windowCount == size) {
                return;
            } else {
                // 临时 count 用来判断移除哪些数据
                int evictorCount = 0;
                Iterator<TimestampedValue<Tuple2<String, Integer>>> iterator = iterable.iterator();
                while (iterator.hasNext()) {
                    iterator.next();
                    evictorCount++;
                    // 判断什么时候可以移除哪些数据
                    /**
                     * 比如当前窗口共有5条数据 统计最近3条数据 移除2条数据
                     * evictorCount = 1     size = 5     windowCount = 3 (需要移除当前遍历数据)
                     * evictorCount = 2     size = 5     windowCount = 3 (需要移除当前遍历数据)
                     * evictorCount = 3     size = 5     windowCount = 3 (不需要移除当前遍历数据)
                     * ...
                     */
                    if (evictorCount > size - windowCount) {
                        break;
                    } else {
                        iterator.remove();
                    }
                }
            }
        }
        @Override
        public void evictAfter(Iterable<TimestampedValue<Tuple2<String, Integer>>> iterable, int i, GlobalWindow globalWindow, EvictorContext evictorContext) {
        }
    }
}
```

终端输入：

flink A

flink B

(此时控制台已经打印（flink，2) ）

flink C

flink D

(此时控制台已经答应 （flink，3）)

flink E

flink F

(此时控制台已经答应 （flink，3）)

以此类推

## 三、迟到数据和侧输出流

迟到数据：这些数据根据 EventTime已经分配好了所在窗口执行，但是所在窗口已经执行计算了，并且这些数据不会被当前窗口所收集和计算。

侧输出流：把迟到的数据放入到侧输出流中，单独进行计算。

由于该案例涉及到 EventTime（日志产生时间）、ingestTime（数据进入程序时间）、processTime（数据处理时间）的关系和 watermark（水位线）的概念描述，该案例放到下面具体介绍。
