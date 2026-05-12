# 02、Flink 实战 - DataStream聚合 keyBy sum min和minBy区别
- 来源：https://ddkk.com/zhuanlan/bigdata/flink/6/2.html
- 分类：大数据框架
- 分组：教程目录
## 1. keyBy

keyBy是把数据流按照某个字段分区，下面用wordCount举例说明其用法

### 1.1 keyBy(0)

下面是个典型的wordCount程序，从数据源读取数据后，我们转换为元组Tuple2。

这个元组有2个值，第一个是单词，第二个是1。

要按照不同的单词分组，就是按照元组Tuple2中下标为0的值分组，所以调用了keyBy(0)。

```java
package com.pigg.test01;
import org.apache.flink.api.common.functions.FlatMapFunction;
import org.apache.flink.api.java.tuple.Tuple2;
import org.apache.flink.streaming.api.datastream.DataStreamSource;
import org.apache.flink.streaming.api.datastream.SingleOutputStreamOperator;
import org.apache.flink.streaming.api.environment.StreamExecutionEnvironment;
import org.apache.flink.streaming.api.windowing.time.Time;
import org.apache.flink.util.Collector;
public class StreamWordCount {
    public static void main(String[] args) throws Exception {
        //1. create environment
        StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();
        //2. create dataStream source
        DataStreamSource<String> dataStream = env.socketTextStream("com.pigg", 8888);
        //3. trans
        SingleOutputStreamOperator<Tuple2<String, Integer>> wordAndOne = dataStream.flatMap(new Splitter());
        SingleOutputStreamOperator<Tuple2<String, Integer>> sumResult = wordAndOne
                .keyBy(0)
                .timeWindow(Time.seconds(5))
                .sum(1);
        //4. sink
        sumResult.print();
        //5. execute
        env.execute("StreamWordCount");
    }
    public static class Splitter implements FlatMapFunction<String, Tuple2<String, Integer>> {
        @Override
        public void flatMap(String line, Collector<Tuple2<String, Integer>> collector) throws Exception {
            for (String word : line.split(" ")){
                collector.collect(new Tuple2<String, Integer>(word, 1));
            }
        }
    }
}
```

### 1.2 keyBy(“someKey”)

先定义POJO，注意一定要有无参构造方法，重写toString()是为了输出好看。

```java
package com.pigg.test01;
public class WordCount {
    private String word;
    private Long count;
    public WordCount() {
    }
    public WordCount(String word, Long count) {
        this.word = word;
        this.count = count;
    }
    public String getWord() {
        return word;
    }
    public void setWord(String word) {
        this.word = word;
    }
    public Long getCount() {
        return count;
    }
    public void setCount(Long count) {
        this.count = count;
    }
    @Override
    public String toString() {
        return "WordCount{" +
                "word='" + word + '\'' +
                ", count=" + count +
                '}';
    }
}
```

下面是wordCount程序，keyBy(“word”)和sum(“count”)它们的参数"word","count"必须和POJO里字段一致。

```java
package com.pigg.test01;
import org.apache.flink.api.common.functions.FlatMapFunction;
import org.apache.flink.api.java.tuple.Tuple2;
import org.apache.flink.streaming.api.datastream.DataStreamSource;
import org.apache.flink.streaming.api.datastream.SingleOutputStreamOperator;
import org.apache.flink.streaming.api.environment.StreamExecutionEnvironment;
import org.apache.flink.streaming.api.windowing.time.Time;
import org.apache.flink.util.Collector;
public class StreamWordCountBean {
    public static void main(String[] args) throws Exception {
        //1. create environment
        StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();
        //2. create dataStream source
        DataStreamSource<String> dataStream = env.socketTextStream("com.pigg", 8888);
        //3. trans
        SingleOutputStreamOperator<WordCount> wordAndOne = dataStream.flatMap(new Splitter());
        SingleOutputStreamOperator<WordCount> sumResult = wordAndOne
                .keyBy("word")
                .timeWindow(Time.seconds(5))
                .sum("count");
        //4. sink
        sumResult.print();
        //5. execute
        env.execute("StreamWordCountBean");
    }
    public static class Splitter implements FlatMapFunction<String, WordCount> {
        @Override
        public void flatMap(String line, Collector<WordCount> collector) throws Exception {
            for (String word : line.split(" ")){
                collector.collect(new WordCount(word, 1L));
            }
        }
    }
}
```

## 2. min和minBy区别

Flink的dataStream聚合函数有如下：

```java
keyedStream.sum(0);
keyedStream.sum("key");
keyedStream.min(0);
keyedStream.min("key");
keyedStream.max(0);
keyedStream.max("key");
keyedStream.minBy(0);
keyedStream.minBy("key");
keyedStream.maxBy(0);
keyedStream.maxBy("key");
```

### 2.1 min

```java
package com.pigg.test01;
import org.apache.flink.api.java.tuple.Tuple2;
import org.apache.flink.api.java.tuple.Tuple3;
import org.apache.flink.streaming.api.datastream.DataStreamSource;
import org.apache.flink.streaming.api.datastream.SingleOutputStreamOperator;
import org.apache.flink.streaming.api.environment.StreamExecutionEnvironment;
import java.util.ArrayList;
import java.util.List;
public class StreamMinTest {
    public static void main(String[] args) throws Exception {
        StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();
        List data = new ArrayList<Tuple3<String, String, Integer>>();
        data.add(new Tuple3<>("男", "老王", 80));
        data.add(new Tuple3<>("男", "小王", 25));
        data.add(new Tuple3<>("男", "老李", 85));
        data.add(new Tuple3<>("男", "小李", 20));
        DataStreamSource peoples = env.fromCollection(data);
		//求年龄最小的人
        SingleOutputStreamOperator minResult = peoples.keyBy(0).min(2);
        minResult.print();
        env.execute("StreamMinTest");
    }
}
```

输出结果：

```java
1> (男,老王,80)
1> (男,老王,25)
1> (男,老王,25)#年龄算对了，但是别的字段还是第一个老王
1> (男,老王,20)#年龄最小的居然还是第一个老王？
```

min根据指定的字段取最小，它只返回最小的那个字段，而不是整个数据元素，对于其他的字段取了第一次取的值，不能保证每个字段的数值正确。

### 2.2 minBy

把上面的程序中min换成minBy

```java
SingleOutputStreamOperator minResult = peoples.keyBy(0).minBy(2);
```

输出结果：

```java
1> (男,老王,80)
1> (男,小王,25)
1> (男,小王,25)
1> (男,小李,20)#年龄最小的人找到了，是20岁的小李
```

minBy根据指定字段取最小，返回的是整个元素。

上一篇[Flink 实战(一) Flink DataStream 创建数据源 转换算子](/zhuanlan/bigdata/flink/6/1.html)

下一篇[Flink 实战(三) 大白话 时间 窗口 watermark](/zhuanlan/bigdata/flink/6/3.html)

如果本文对您有帮助，就点个赞👍吧
