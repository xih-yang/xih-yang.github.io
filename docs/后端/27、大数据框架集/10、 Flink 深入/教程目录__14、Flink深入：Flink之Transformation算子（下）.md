# 14、Flink深入：Flink之Transformation算子（下）
- 来源：https://ddkk.com/zhuanlan/bigdata/flink/4/14.html
- 分类：大数据框架
- 分组：教程目录
## 1. union和connect算子

**API** ：

- union：union算子可以合并多个同类型的数据流，并生成同类型的数据流，即可以将多个DataStream[T]合并为一个新的DataStream[T]。数据将按照先进先出（First In First Out）的模式合并，且不去重。

- connect：
- connect提供了和union类似的功能，用来连接两个数据流，它与union的区别在于：connect只能连接两个数据流，union可以连接多个数据流。
- connect所连接的两个数据流的数据类型可以不一致，union所连接的两个数据流的数据类型必须一致。
- 两个DataStream经过connect之后被转化为ConnectedStreams，ConnectedStreams会对两个流的数据应用不同的处理方法，且双流之间可以共享状态。

**需求举例** ：

将两个String类型的流进行union

将一个String类型和一个Long类型的流进行connect

**代码实现** ：

```java
import org.apache.flink.api.common.RuntimeExecutionMode;
import org.apache.flink.streaming.api.datastream.ConnectedStreams;
import org.apache.flink.streaming.api.datastream.DataStream;
import org.apache.flink.streaming.api.environment.StreamExecutionEnvironment;
import org.apache.flink.streaming.api.functions.co.CoMapFunction;
/**
 * Author ddkk.com  弟弟快看，程序员编程资料站
 * Desc
 */
public class TransformationDemo02 {
    public static void main(String[] args) throws Exception {
        //1.env
        StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();
        env.setRuntimeMode(RuntimeExecutionMode.AUTOMATIC);
        //2.Source
        DataStream<String> ds1 = env.fromElements("hadoop", "spark", "flink");
        DataStream<String> ds2 = env.fromElements("hadoop", "spark", "flink");
        DataStream<Long> ds3 = env.fromElements(1L, 2L, 3L);
        //3.Transformation
        DataStream<String> result1 = ds1.union(ds2);//合并但不去重 https://blog.csdn.net/valada/article/details/104367378
        ConnectedStreams<String, Long> tempResult = ds1.connect(ds3);
        //interface CoMapFunction<IN1, IN2, OUT>
        DataStream<String> result2 = tempResult.map(new CoMapFunction<String, Long, String>() {
            @Override
            public String map1(String value) throws Exception {
                return "String->String:" + value;
            }
            @Override
            public String map2(Long value) throws Exception {
                return "Long->String:" + value.toString();
            }
        });
        //4.Sink
        result1.print();
        result2.print();
        //5.execute
        env.execute();
    }
}
```

## 2. split、select和Side Outputs

**API** ：

- Split就是将一个流分成多个流，注意：split函数已过期并移除
- Select就是获取分流后对应的数据
- Side Outputs：可以使用process方法对流中数据进行处理，并针对不同的处理结果将数据收集到不同的OutputTag中

**需求举例** ：

对流中的数据按照奇数和偶数进行分流，并获取分流后的数据

**代码实现** ：

```java
import org.apache.flink.api.common.RuntimeExecutionMode;
import org.apache.flink.api.common.typeinfo.TypeInformation;
import org.apache.flink.streaming.api.datastream.DataStream;
import org.apache.flink.streaming.api.datastream.DataStreamSource;
import org.apache.flink.streaming.api.datastream.SingleOutputStreamOperator;
import org.apache.flink.streaming.api.environment.StreamExecutionEnvironment;
import org.apache.flink.streaming.api.functions.ProcessFunction;
import org.apache.flink.util.Collector;
import org.apache.flink.util.OutputTag;
/**
 * Author ddkk.com  弟弟快看，程序员编程资料站
 * Desc
 */
public class TransformationDemo03 {
    public static void main(String[] args) throws Exception {
        //1.env
        StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();
        env.setRuntimeMode(RuntimeExecutionMode.AUTOMATIC);
        //2.Source
        DataStreamSource<Integer> ds = env.fromElements(1, 2, 3, 4, 5, 6, 7, 8, 9, 10);
        //3.Transformation
        /*SplitStream<Integer> splitResult = ds.split(new OutputSelector<Integer>() {
            @Override
            public Iterable<String> select(Integer value) {
                //value是进来的数字
                if (value % 2 == 0) {
                    //偶数
                    ArrayList<String> list = new ArrayList<>();
                    list.add("偶数");
                    return list;
                } else {
                    //奇数
                    ArrayList<String> list = new ArrayList<>();
                    list.add("奇数");
                    return list;
                }
            }
        });
        DataStream<Integer> evenResult = splitResult.select("偶数");
        DataStream<Integer> oddResult = splitResult.select("奇数");*/
        //定义两个输出标签
        OutputTag<Integer> tag_even = new OutputTag<Integer>("偶数", TypeInformation.of(Integer.class));
        OutputTag<Integer> tag_odd = new OutputTag<Integer>("奇数"){};
        //对ds中的数据进行处理
        SingleOutputStreamOperator<Integer> tagResult = ds.process(new ProcessFunction<Integer, Integer>() {
            @Override
            public void processElement(Integer value, Context ctx, Collector<Integer> out) throws Exception {
                if (value % 2 == 0) {
                    //偶数
                    ctx.output(tag_even, value);
                } else {
                    //奇数
                    ctx.output(tag_odd, value);
                }
            }
        });
        //取出标记好的数据
        DataStream<Integer> evenResult = tagResult.getSideOutput(tag_even);
        DataStream<Integer> oddResult = tagResult.getSideOutput(tag_odd);
        //4.Sink
        evenResult.print("偶数");
        oddResult.print("奇数");
        //5.execute
        env.execute();
    }
}
```

## 3. rebalance重平衡分区

**功能概述** ：

- 类似于Spark中的repartition,但是功能更强大,可以直接解决数据倾斜。
- Flink也有数据倾斜的时候，比如当前有数据量大概10亿条数据需要处理，在处理过程中可能会发生如图所示的状况，出现了数据倾斜，其他3台机器执行完毕也要等待机器1执行完毕后才算整体将任务完成。

- 所以在实际的工作中，出现这种情况比较好的解决方案就是rebalance(内部使用round robin方法将数据均匀打散)。

**代码演示** ：

```java
import org.apache.flink.api.common.RuntimeExecutionMode;
import org.apache.flink.api.common.functions.FilterFunction;
import org.apache.flink.api.common.functions.RichMapFunction;
import org.apache.flink.api.java.tuple.Tuple2;
import org.apache.flink.streaming.api.datastream.DataStream;
import org.apache.flink.streaming.api.environment.StreamExecutionEnvironment;
/**
 * Author ddkk.com  弟弟快看，程序员编程资料站
 * Desc
 */
public class TransformationDemo04 {
    public static void main(String[] args) throws Exception {
        //1.env
        StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();
        env.setRuntimeMode(RuntimeExecutionMode.AUTOMATIC).setParallelism(3);
        //2.source
        DataStream<Long> longDS = env.fromSequence(0, 100);
        //3.Transformation
        //下面的操作相当于将数据随机分配一下,有可能出现数据倾斜
        DataStream<Long> filterDS = longDS.filter(new FilterFunction<Long>() {
            @Override
            public boolean filter(Long num) throws Exception {
                return num > 10;
            }
        });
        //接下来使用map操作,将数据转为(分区编号/子任务编号, 数据)
        //Rich表示多功能的,比MapFunction要多一些API可以供我们使用
        DataStream<Tuple2<Integer, Integer>> result1 = filterDS
                .map(new RichMapFunction<Long, Tuple2<Integer, Integer>>() {
                    @Override
                    public Tuple2<Integer, Integer> map(Long value) throws Exception {
                        //获取分区编号/子任务编号
                        int id = getRuntimeContext().getIndexOfThisSubtask();
                        return Tuple2.of(id, 1);
                    }
                }).keyBy(t -> t.f0).sum(1);
        DataStream<Tuple2<Integer, Integer>> result2 = filterDS.rebalance()
                .map(new RichMapFunction<Long, Tuple2<Integer, Integer>>() {
                    @Override
                    public Tuple2<Integer, Integer> map(Long value) throws Exception {
                        //获取分区编号/子任务编号
                        int id = getRuntimeContext().getIndexOfThisSubtask();
                        return Tuple2.of(id, 1);
                    }
                }).keyBy(t -> t.f0).sum(1);
        //4.sink
        //result1.print();//有可能出现数据倾斜
        result2.print();//在输出前进行了rebalance重分区平衡,解决了数据倾斜
        //5.execute
        env.execute();
    }
}
```

## 4. 其他分区算子

**API** ：

**说明** ：

recale分区。基于上下游Operator的并行度，将记录以循环的方式输出到下游Operator的每个实例。

**举例:**

上游并行度是2，下游是4，则上游一个并行度以循环的方式将记录输出到下游的两个并行度上;上游另一个并行度以循环的方式将记录输出到下游另两个并行度上。若上游并行度是4，下游并行度是2，则上游两个并行度将记录输出到下游一个并行度上；上游另两个并行度将记录输出到下游另一个并行度上。

**代码演示** ：

```java
import org.apache.flink.api.common.RuntimeExecutionMode;
import org.apache.flink.api.common.functions.FlatMapFunction;
import org.apache.flink.api.common.functions.Partitioner;
import org.apache.flink.api.java.tuple.Tuple2;
import org.apache.flink.streaming.api.datastream.DataStream;
import org.apache.flink.streaming.api.datastream.SingleOutputStreamOperator;
import org.apache.flink.streaming.api.environment.StreamExecutionEnvironment;
import org.apache.flink.util.Collector;
/**
 * Author ddkk.com  弟弟快看，程序员编程资料站
 * Desc
 */
public class TransformationDemo05 {
    public static void main(String[] args) throws Exception {
        //1.env
        StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();
        env.setRuntimeMode(RuntimeExecutionMode.AUTOMATIC);
        //2.Source
        DataStream<String> linesDS = env.readTextFile("data/input/words.txt");
        SingleOutputStreamOperator<Tuple2<String, Integer>> tupleDS = linesDS.flatMap(new FlatMapFunction<String, Tuple2<String, Integer>>() {
            @Override
            public void flatMap(String value, Collector<Tuple2<String, Integer>> out) throws Exception {
                String[] words = value.split(" ");
                for (String word : words) {
                    out.collect(Tuple2.of(word, 1));
                }
            }
        });
        //3.Transformation
        DataStream<Tuple2<String, Integer>> result1 = tupleDS.global();
        DataStream<Tuple2<String, Integer>> result2 = tupleDS.broadcast();
        DataStream<Tuple2<String, Integer>> result3 = tupleDS.forward();
        DataStream<Tuple2<String, Integer>> result4 = tupleDS.shuffle();
        DataStream<Tuple2<String, Integer>> result5 = tupleDS.rebalance();
        DataStream<Tuple2<String, Integer>> result6 = tupleDS.rescale();
        DataStream<Tuple2<String, Integer>> result7 = tupleDS.partitionCustom(new Partitioner<String>() {
            @Override
            public int partition(String key, int numPartitions) {
                return key.equals("hello") ? 0 : 1;
            }
        }, t -> t.f0);
        //4.sink
        //result1.print();
        //result2.print();
        //result3.print();
        //result4.print();
        //result5.print();
        //result6.print();
        result7.print();
        //5.execute
        env.execute();
    }
}
```
