# 05、Flink 实战 - DataStream 常用算子（下）
- 来源：https://ddkk.com/zhuanlan/bigdata/flink/6/5.html
- 分类：大数据框架
- 分组：教程目录
## 一、前言

在上一篇博客[Flink 实战（二）DataStream Transformations 常用算子（上）](/zhuanlan/bigdata/flink/6/4.html)，我总结了一些基础的算子，这些算子从功能上看属于映射、过滤和聚合的类型。本篇想介绍些归约功能的算子。

还有学习一门新的技术，的确需要坚持和多实践，不要急于求成。反正时间一大把，我们可以专心的学一两门技术，做到熟练至精通。不要想着学很多十八般武艺，成为所谓的全才。

例如一个人比较精通Elasticsearch和Flink，那么同事遇到相关问题时也会想到来请教他。在开发会议上给出的建议也有一定的分量。

## 二、Reduce

Reduce相当归并操作，比如输入的值有很多，但是我们只想返回一个值，例如求和，最大值，最小值，平均值等。

### 2.1 Java Lambda中的Reduce

```java
 //求和
int sum = Arrays.stream(nums).reduce(0, (a, b) -> a + b);
```

- reduced第一个参数0，是一个初始值
- (a, b) -> a + b是IntBinaryOperator类型，将2个元素结合生成一个新的元素

下图详细描述了reduce求和的过程

- reduce还可以用来求最大值、最小值

```java
//求最大值
OptionalInt max= Arrays.stream(nums).reduce(Integer::max);
```

reduce求最大值图如下：

[外链图片转存失败,源站可能有防盗链机制,建议将图片保存下来直接上传(img-DIJ3hN2W-1606810078967)(https://statics.sdk.cn/articles/img/202011/58399208bba3dbee9655484365_1001173.png?x-oss-process=style/thumb)]

完整的代码示例如下：

```java
public class ReduceJavaDemo {
    public static void main(String[] args) {
        int[] nums = {
     4, 5, 3, 9};
        //带初始值的求和
        int sum = Arrays.stream(nums).reduce(0, (a, b) -> a + b);
        System.out.println(sum);
        //不带初始值的求和
        //reduce还有一个重载的变体，它不接受初始值，但是会返回一个Optional对象
        OptionalInt reduceSum = Arrays.stream(nums).reduce(Integer::sum);
        if (reduceSum.isPresent()) {
            System.out.println(reduceSum.getAsInt());
        }
        //求最大值
        OptionalInt max= Arrays.stream(nums).reduce(Integer::max);
        if (max.isPresent()){
            System.out.println(max.getAsInt());
        }
    }
}
```

### 2.2 Flink中的Reduce

- 转换类型：KeyedStream→DataStream
- 说明：在分区的数据流上调用reduce函数：将当前元素与最后一个reduce的值合并生成新值。

reduce函数是将KeyedStream转换为DataStream，也就是reduce调用前必须进行分区，即得先调用keyBy()函数
- 举例(我这边为了测试，不是流处理)：

```java
public class ReduceFlinkDemo {
    public static void main(String[] args) throws Exception {
        //初始环境变量
        ExecutionEnvironment env = ExecutionEnvironment.getExecutionEnvironment();
        //设置数据源
        Integer[] nums = {
     1, 2, 3, 4, 5};
        List<Integer> integers = Arrays.asList(nums);
        DataSource<Integer> dataSource = env.fromCollection(integers);
        //利用reduce求和
        ReduceOperator<Integer> sum = dataSource.reduce(
                (ReduceFunction<Integer>) (value1, value2) -> value1 + value2);
        sum.print();
        //利用reduce求最大值
        ReduceOperator<Integer> max = dataSource.reduce(Integer::max);
        max.print();
    }
}
```

### 2.3 Flink的数据源是对象集合

这个时候groupBy不能再用元组的下标了，得用字段名称。

```java
public class ReduceFlinkPojoDemo {
    public static void main(String[] args) throws Exception {
        //初始环境变量
        ExecutionEnvironment env = ExecutionEnvironment.getExecutionEnvironment();
        List<WordCount> wordCountList = new ArrayList<>();
        wordCountList.add(new WordCount("Flink", 3));
        wordCountList.add(new WordCount("Flink", 2));
        wordCountList.add(new WordCount("Elasticsearch", 1));
        wordCountList.add(new WordCount("Elasticsearch", 5));
        DataSource<WordCount> dataSource = env.fromCollection(wordCountList);
        ReduceOperator<WordCount> sum = dataSource
                .groupBy(WordCount::getWord)
                .reduce((ReduceFunction<WordCount>) (value1, value2) ->
                        new WordCount(value1.getWord(), value1.getCount() + value2.getCount()));
        sum.print();
    }
}
```

输出结果如下：

```java
WordCount{word='Elasticsearch', count=6}
WordCount{word='Flink', count=5}
```

## 三、Union

union简介：

DataStream上使用union算子可以合并多个同类型的数据流，并生成同类型的数据流，即可以将多个DataStream[T]合并为一个新的DataStream[T]。数据将按照先进先出（First In First Out）的模式合并，且不去重。

下图union对白色和深色两个数据流进行合并，生成一个数据流。

- 在 DataStream 上使用 union 算子可以合并多个同类型的数据流，
- 并生成同类型的新数据流，即可以将多个 DataStream 合并为一个新的 DataStream。
- 数据将按照先进先出（First In First Out） 的模式合并，且不去重。
- 但是Union有一个限制，就是所有合并的流类型必须是一致的。

```java
public class UnionFlinkDemo {
    public static void main(String[] args) throws Exception {
        StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();
        DataStreamSource<String> stream1 = env.socketTextStream(BaseConstant.URL, 9999);
        DataStreamSource<String> stream2 = env.socketTextStream(BaseConstant.URL, 8888);
        DataStreamSource<String> stream3 = env.socketTextStream(BaseConstant.URL, 6666);
        DataStream<String> unionStream = stream1.union(stream2).union(stream3);
        unionStream.print();
        env.execute("UnionDemo");
    }
}
```

## 四、Connect

connect的作用和union相似，也是连接不同数据流的：

- 两个DataStream 经过 connect 之后被转化为 ConnectedStreams，
- ConnectedStreams 会对两个流的数据应用不同的处理方法，且双流之间可以共享状态。

connect和union的区别：

- connect 只能连接两个数据流，union 可以连接多个数据流。
- connect 所连接的两个数据流的数据类型可以不一致。
- union所连接的两个数据流的数据类型必须一致。

使用connect有如下注意点：

**1、** 对于ConnectedStreams，我们需要重写CoMapFunction或CoFlatMapFunction这两个接口都提供了三个泛型，这三个泛型分别对应第一个输入流的数据类型、第二个输入流的数据类型和输出流的数据类型；

**2、** 在重写函数时，对于CoMapFunction，map1处理第一个流的数据，map2处理第二个流的数据；对于CoFlatMapFunction，flatMap1处理第一个流的数据，flatMap2处理第二个流的数据；

**3、** Flink并不能保证两个函数调用顺序，两个函数的调用依赖于两个数据流数据的流入先后顺序，即第一个数据流有数据到达时，map1或flatMap1会被调用，第二个数据流有数据到达时，map2或flatMap2会被调用；

```java
/**
 * connect 只能连接两个数据流，union 可以连接多个数据流；
 *
 * connect 所连接的两个数据流的数据类型可以不一致，
 * union所连接的两个数据流的数据类型必须一致。
 *
 * 两个DataStream 经过 connect 之后被转化为 ConnectedStreams，
 * ConnectedStreams 会对两个流的数据应用不同的处理方法，且双流之间可以共享状态。
 */
public class ConnectFlinkDemo {
    public static void main(String[] args) throws Exception {
        StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();
        DataStreamSource<String> source1 = env.fromElements("a", "b", "c", "a");
        DataStreamSource<Integer> source2 = env.fromElements(1, 2, 3, 2);
        //将2个不同类型的数据源连接起来
        ConnectedStreams<String, Integer> connectedStreams = source1.connect(source2);
        SingleOutputStreamOperator<Tuple2<String, Integer>> map = connectedStreams.map(new CoMapFunction<String, Integer, Tuple2<String, Integer>>() {
            //对数据源1处理
            @Override
            public Tuple2<String, Integer> map1(String value) throws Exception {
                return Tuple2.of(value, 1);
            }
            //对数据源2处理
            @Override
            public Tuple2<String, Integer> map2(Integer value) throws Exception {
                return Tuple2.of(String.valueOf(value), 1);
            }
        });
        SingleOutputStreamOperator<Tuple2<String, Integer>> sum = map
                .keyBy(0)
                .sum(1);
        sum.print();
        env.execute();
    }
}
```

## 五、Split & Select

Split和Select一般是一起使用的。

- Split根据某种规则从原始数据流中获取符合规则的数据，例如将数字按照奇数、偶数分2个流。
- Select就是从Split后的结果里，选择某个流。

下图举例把图像，按照（白色）和（非白色）Split分成2个不同的流。

下面代码举例把一串数字按照奇数、偶数分组。

```java
public class SplitDemo {
    public static void main(String[] args) throws Exception {
        StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();
        DataStreamSource<Integer> streamSource = env.fromElements(1, 2, 3, 4, 5, 6, 7, 8);
        SplitStream<Integer> split = streamSource.split(new OutputSelector<Integer>() {
            @Override
            public Iterable<String> select(Integer value) {
                List<String> outPut = new ArrayList<>();
                if (value % 2 == 0) {
                    outPut.add("even");
                } else {
                    outPut.add("odd");
                }
                return outPut;
            }
        });
        DataStream<Integer> odd = split.select("odd");
        odd.print();
        env.execute();
    }
}
```

## 六、结语

本篇介绍了DataStream的常用算子，主要是流计算使用的，对于批处理DataSet，它也有很多算子，但是功能上差不多，而且批处理一般用的不太多。如果掌握好DataStream的算子，那么再看DataSet的也很容易理解。
