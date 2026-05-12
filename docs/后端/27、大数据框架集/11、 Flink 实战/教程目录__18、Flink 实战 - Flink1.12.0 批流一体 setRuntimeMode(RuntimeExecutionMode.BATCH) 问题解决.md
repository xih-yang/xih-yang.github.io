# 18、Flink 实战 - Flink1.12.0 批流一体 setRuntimeMode(RuntimeExecutionMode.BATCH) 问题解决
- 来源：https://ddkk.com/zhuanlan/bigdata/flink/6/18.html
- 分类：大数据框架
- 分组：教程目录
## 一、问题

在Flink1.12.0有个重要的功能，批流一体，就是可以用之前流处理的API处理批数据。

只需要调用setRuntimeMode(RuntimeExecutionMode executionMode)。

RuntimeExecutionMode 就是一个枚举，有流、批和自动。

```java
@PublicEvolving
public enum RuntimeExecutionMode {
    STREAMING,
    BATCH,
    AUTOMATIC;
    private RuntimeExecutionMode() {
    }
}
```

下面用最最简单的WordCount程序演示。

### 1. 待测试的文本txt

```java
apple flink flink
hello es flink
study flink
```

### 2. WordCount，不设置setRuntimeMode

```java
public class Test01_WordCount_Tuple {
    public static void main(String[] args) throws Exception {
        StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();
        DataStreamSource<String> source = env.readTextFile(BaseConstant.WORD_COUNT_TEST);
        SingleOutputStreamOperator<Tuple2<String, Integer>> wordAndOne = source
                .flatMap(new FlatMapFunction<String, Tuple2<String, Integer>>() {
                    @Override
                    public void flatMap(String value, Collector<Tuple2<String, Integer>> out) throws Exception {
                        String[] split = value.split(" ");
                        if (split != null && split.length > 0) {
                            Stream<String> stream = Arrays.stream(split);
                            stream.forEach(word -> out.collect(Tuple2.of(word, 1)));
                        }
                    }
                }).returns(Types.TUPLE(Types.STRING, Types.INT));
        SingleOutputStreamOperator<Tuple2<String, Integer>> sum = wordAndOne
                .keyBy(f -> f.f0)
                .sum(1);
        sum.print();
        env.execute();
    }
}
```

运行结果：可见是按照流处理的方式处理了批数据，这不是我们想要的

```java
5> (study,1)
7> (flink,1)
6> (es,1)
7> (flink,2)
7> (apple,1)
7> (flink,3)
7> (flink,4)
3> (hello,1)
```

### 3. WordCount，且setRuntimeMode(RuntimeExecutionMode.BATCH)

只需要设置env.setRuntimeMode(RuntimeExecutionMode.BATCH)，依旧用流处理的keyBy方法。

```java
StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();
和之前唯一不同的是添加了这行，设置为批处理
env.setRuntimeMode(RuntimeExecutionMode.BATCH);
DataStreamSource<String> source = env.readTextFile(BaseConstant.WORD_COUNT_TEST);
```

运行结果

```java
7> (flink,4)
```

这个时候发现只有flink这个单词有输出，显然这是不对的。

### 4. 解决问题

通过百度发现该bug已经在Flink1.12.1修复了，bug是因为在批处理reduce里对单个值的累加器有问题。

升级到Flink1.12.1及以上（写博客时，最新是1.12.2）。发现可以解决问题。

升级Flink后运行结果如下：这个我们想要的批处理结果。

```java
5> (study,1)
6> (es,1)
7> (apple,1)
3> (hello,1)
7> (flink,4)
```
