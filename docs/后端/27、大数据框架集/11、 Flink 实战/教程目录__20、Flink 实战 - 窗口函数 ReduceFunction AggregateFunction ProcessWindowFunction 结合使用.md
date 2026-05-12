# 20、Flink 实战 - 窗口函数 ReduceFunction AggregateFunction ProcessWindowFunction 结合使用
- 来源：https://ddkk.com/zhuanlan/bigdata/flink/6/20.html
- 分类：大数据框架
- 分组：教程目录
## 一、窗口函数的分类

大多数Flink应用都是要划分窗口的，如果不划分窗口，那就得计算流中所有的数据的结果(很少有这样的需求)。

Flink如何划分窗口在之前的博客[Flink 实战(7)时间特性、窗口、Watermark代码实践](/zhuanlan/bigdata/flink/6/7.html)已经讲过了。

本篇的重点是讲**窗口函数**，即数据划分窗口后可以调用的处理函数。

### 1. 全量和增量的区别

从上图中看出，窗口函数主要分全量函数和增量函数这2大类。

- 全量函数：窗口先缓存所有元素，等到触发条件后对窗口内的全量元素执行计算。
- 增量函数：窗口保存一份中间数据，每流入一个新元素，新元素与中间数据两两合一，生成新的中间数据。

### 2. apply和process的区别

apply和process的区别

- apply和process都是处理全量计算，但工作中正常用process。
- process更加底层，更加强大，有open/close生命周期方法，又可获取RuntimeContext。

### 3. reduce和aggregate的区别

reduce和aggregate的区别

- reduce接受两个**相同**类型的输入，生成一个**同类型**输出，所以泛型就一个 ``
- maxBy、minBy、sum这3个底层都是由reduce实现的
- aggregate的输入值、中间结果值、输出值它们3个类型可以**各不相同**，泛型有``

## 二、AggregateFunction和ProcessWindowFunction结合使用

在reduce和aggregate中，都有一个可以把**增量函数**和**全量函数**结合使用的方法，就是上面图中标红色五角星的。

对于一个窗口来说，Flink**先增量**计算，**窗口关闭前**，将增量计算结果发送给ProcessWindowFunction作为输入再进行处理。

下面通过案例把增量计算和全量计算讲一下。

### 1. 需求背景

- 有一些城市的气温数据，如下面所示
- 想每隔30秒，获得该城市的这30秒内的温度最大值、最小值、平均值

```java
江苏,苏州,1,20.5,2021-01-29 16:00:00
江苏,盐城,1,24.5,2021-01-29 16:00:20
江苏,盐城,1,28.5,2021-01-29 16:00:30
江苏,盐城,1,23.5,2021-01-29 16:00:40
江苏,苏州,1,21.5,2021-01-29 16:00:10
江苏,苏州,1,22.5,2021-01-29 16:00:20
江苏,苏州,1,24.5,2021-01-29 16:00:30
江苏,苏州,1,23.5,2021-01-29 16:00:40
江苏,苏州,1,22.5,2021-01-29 16:00:50
//太多了，省略
```

### 2. 分析

- 求温度的最大值、最小值、平均值，这样明显是聚合计算，适合用AggregateFunction
- 每隔30秒获取数据，就是30秒后窗口关闭时，获取窗口的信息(开始结束时间)，并加上AggregateFunction的结果，这个适合用ProcessWindowFunction
- 所以得用下面AggregateFunction和ProcessWindowFunction结合的aggregate函数

```java
public <ACC, V, R> SingleOutputStreamOperator<R> aggregate(
            AggregateFunction<T, ACC, V> aggFunction,
            ProcessWindowFunction<V, R, K, W> windowFunction) {
           }
```

### 3. 程序主体

```java
/**
 * 该程序测试window的reduce功能
 * reduce是每输入一个数据，触发一次计算
 * 具体实现求得一个window数据中的max、min、sum、count、avg
 */
public class Test04_AggregateAndProcessFunction {
    public static void main(String[] args) throws Exception {
        StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();
        env.setParallelism(1);
        DataStreamSource<String> source = env.readTextFile(BaseConstant.TEMP_RECORD);
        SingleOutputStreamOperator<TempRecord> dataStream = source
                .flatMap(new TempRecordUtils.BeanFlatMap())
                .assignTimestampsAndWatermarks(
                        WatermarkStrategy.<TempRecord>forBoundedOutOfOrderness(Duration.ofSeconds(0))
                                .withTimestampAssigner(new SerializableTimestampAssigner<TempRecord>() {
                                    @Override
                                    public long extractTimestamp(TempRecord element, long recordTimestamp) {
                                        return element.getTimeEpochMilli();
                                    }
                                })
                );
        SingleOutputStreamOperator<TempRecordAggsResult> result = dataStream
                .keyBy(TempRecord::getCity)
                .window(TumblingEventTimeWindows.of(Time.seconds(30)))
                .aggregate(new TempRecordUtils.MyAggregateFunction(),//增量计算
                        new TempRecordUtils.MyProcessWindow());//全量计算
        result.print();
        env.execute();
    }
}
```

### 4. AggregateFunction

```java
/**
 * 聚合函数，每来一个数据，就会执行聚合操作
 */
public static class MyAggregateFunction implements AggregateFunction<
        TempRecord,
        TempRecordAggsResult,
        TempRecordAggsResult> {
    @Override
    public TempRecordAggsResult createAccumulator() {
        return TempRecordAggsResult.getInitResult();
    }
    /**
     * 每进入一个数据就会执行一次
     * @param value 当前进入的数据
     * @param accumulator 之前计算好的中间结果
     * @return
     */
    @Override
    public TempRecordAggsResult add(TempRecord value, TempRecordAggsResult accumulator) {
        accumulator.setKey(value.getProvince() + "," + value.getCity());
        accumulator.setMax(value.getTemp() > accumulator.getMax() ? value.getTemp() : accumulator.getMax());
        accumulator.setMin(value.getTemp() < accumulator.getMin() ? value.getTemp() : accumulator.getMin());
        accumulator.setSum(value.getTemp() + accumulator.getSum());
        accumulator.setCounts(accumulator.getCounts() + 1);
        accumulator.setAvg(accumulator.getSum() / accumulator.getCounts());
        return accumulator;
    }
    /*
    当window的结束时间到达时，触发这个方法，返回结果
     */
    @Override
    public TempRecordAggsResult getResult(TempRecordAggsResult accumulator) {
        //System.out.println("getResult :" + accumulator.toString());
        return accumulator;
    }
    /**
     * 在session窗口才会用到merge，时间窗口其实用不得
     * @param a
     * @param b
     * @return
     */
    @Override
    public TempRecordAggsResult merge(TempRecordAggsResult a, TempRecordAggsResult b) {
        a.setMax(a.getMax() > b.getMax() ? a.getMax() : b.getMax());
        a.setMin(a.getMin() < b.getMin() ? a.getMin() : b.getMin());
        a.setSum(a.getSum() + b.getSum());
        a.setCounts(a.getCounts() + b.getCounts());
        a.setAvg(a.getSum() / a.getCounts());
        return a;
    }
}
```

### 5. ProcessWindowFunction

上面有个问题，其实平均值可以在聚合函数不计算，最后在ProcessWindowFunction里用总和除以个数来求

```java
public static class MyProcessWindow extends ProcessWindowFunction<
        TempRecordAggsResult,
        TempRecordAggsResult,
        String,
        TimeWindow> {
    @Override
    public void process(String s, Context context, Iterable<TempRecordAggsResult> elements, Collector<TempRecordAggsResult> out) throws Exception {
        long windowStartTs = context.window().getStart();
        long windowEndTs = context.window().getEnd();
        if (elements.iterator().hasNext()) {
            TempRecordAggsResult result = elements.iterator().next();
            System.out.println("result:" + result.toString());
            result.setBeginTime(
                    LocalDateTime.ofInstant(
                            Instant.ofEpochMilli(windowStartTs), ZoneId.systemDefault()
                    )
            );
            result.setEndTime(
                    LocalDateTime.ofInstant(
                            Instant.ofEpochMilli(windowEndTs), ZoneId.systemDefault()
                    )
            );
            out.collect(result);
        }
    }
}
```

### 6 TempRecordAggsResult

```java
package study.common.entity;
import study.common.constant.FormatterConstant;
import java.time.LocalDateTime;
public class TempRecordAggsResult {
    private String key;
    private LocalDateTime beginTime;
    private LocalDateTime endTime;
    private Double max;
    private Double min;
    private Double sum;
    private Double avg;
    private Integer counts;
    public static TempRecordAggsResult getInitResult() {
        TempRecordAggsResult result = new TempRecordAggsResult();
        result.setBeginTime(LocalDateTime.now());
        result.setEndTime(LocalDateTime.now());
        result.setMax(Double.MIN_VALUE);
        result.setMin(Double.MAX_VALUE);
        result.setSum(0.0);
        result.setAvg(0.0);
        result.setCounts(0);
        return result;
    }
    public TempRecordAggsResult() {
    }
    public TempRecordAggsResult(String key, LocalDateTime beginTime, LocalDateTime endTime, Double max, Double min, Double sum, Double avg, Integer counts) {
        this.key = key;
        this.beginTime = beginTime;
        this.endTime = endTime;
        this.max = max;
        this.min = min;
        this.sum = sum;
        this.avg = avg;
        this.counts = counts;
    }
    public String getKey() {
        return key;
    }
    public void setKey(String key) {
        this.key = key;
    }
    public LocalDateTime getBeginTime() {
        return beginTime;
    }
    public void setBeginTime(LocalDateTime beginTime) {
        this.beginTime = beginTime;
    }
    public LocalDateTime getEndTime() {
        return endTime;
    }
    public void setEndTime(LocalDateTime endTime) {
        this.endTime = endTime;
    }
    public Double getMax() {
        return max;
    }
    public void setMax(Double max) {
        this.max = max;
    }
    public Double getMin() {
        return min;
    }
    public void setMin(Double min) {
        this.min = min;
    }
    public Double getSum() {
        return sum;
    }
    public void setSum(Double sum) {
        this.sum = sum;
    }
    public Double getAvg() {
        return avg;
    }
    public void setAvg(Double avg) {
        this.avg = avg;
    }
    public Integer getCounts() {
        return counts;
    }
    public void setCounts(Integer counts) {
        this.counts = counts;
    }
    @Override
    public String toString() {
        return "TempRecordAggsResult{" +
                "key='" + key + '\'' +
                ", windowTime=[" + beginTime.format(FormatterConstant.commonDtf) +
                ", " + endTime.format(FormatterConstant.commonDtf) + ")" +
                ", max=" + max +
                ", min=" + min +
                ", sum=" + sum +
                ", avg=" + avg +
                ", counts=" + counts +
                '}';
    }
}
```
