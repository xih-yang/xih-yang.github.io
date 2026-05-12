# 02、Flink WordCount 之 Java
- 来源：https://ddkk.com/zhuanlan/bigdata/flink/1/2.html
- 分类：大数据框架
- 分组：教程目录
## 1、IDEA创建Maven项目添加如下依赖

**pom.xml**

```java
<properties>
    <maven.compiler.source>18</maven.compiler.source>
    <maven.compiler.target>18</maven.compiler.target>
    <flink.version>1.13.0</flink.version>
    <java.version>1.8</java.version>
    <scala.binary.version>2.12</scala.binary.version>
    <slf4j.version>1.7.30</slf4j.version>
</properties>
<dependencies>
    <!-- 引入 Flink 相关依赖-->
    <dependency>
        <groupId>org.apache.flink</groupId>
        <artifactId>flink-java</artifactId>
        <version>${flink.version}</version>
    </dependency>
    <dependency>
        <groupId>org.apache.flink</groupId>
        <artifactId>flink-streaming-java_${scala.binary.version}</artifactId>
        <version>${flink.version}</version>
    </dependency>
    <dependency>
        <groupId>org.apache.flink</groupId>
        <artifactId>flink-clients_${scala.binary.version}</artifactId>
        <version>${flink.version}</version>
    </dependency>
    <!-- 引入日志管理相关依赖-->
    <dependency>
        <groupId>org.slf4j</groupId>
        <artifactId>slf4j-api</artifactId>
        <version>${slf4j.version}</version>
    </dependency>
    <dependency>
        <groupId>org.slf4j</groupId>
        <artifactId>slf4j-log4j12</artifactId>
        <version>${slf4j.version}</version>
    </dependency>
    <dependency>
        <groupId>org.apache.logging.log4j</groupId>
        <artifactId>log4j-to-slf4j</artifactId>
        <version>2.14.0</version>
    </dependency>
</dependencies>
```

**log4j.properties**

```java
log4j.rootLogger=error, stdout
log4j.appender.stdout=org.apache.log4j.ConsoleAppender
log4j.appender.stdout.layout=org.apache.log4j.PatternLayout
log4j.appender.stdout.layout.ConversionPattern=%-4r [%t] %-5p %c %x - %m%n
```

## 2、编写代码(基于DataSet API) 批处理

```java
package com.kunan.wc;
import org.apache.flink.api.common.typeinfo.Types;
import org.apache.flink.api.java.ExecutionEnvironment;
import org.apache.flink.api.java.operators.AggregateOperator;
import org.apache.flink.api.java.operators.DataSource;
import org.apache.flink.api.java.operators.FlatMapOperator;
import org.apache.flink.api.java.operators.UnsortedGrouping;
import org.apache.flink.api.java.tuple.Tuple2;
import org.apache.flink.util.Collector;
public class BatchWordCount {
    public static void main(String[] args) throws Exception{
        //1.创建一个执行环境
        ExecutionEnvironment env = ExecutionEnvironment.getExecutionEnvironment();
        //2.从文件读取数据
        DataSource<String> lineDataSource = env.readTextFile("input/words.txt");
        // 3.将每行数据进行分词，然后转换成二元组类型
        FlatMapOperator<String, Tuple2<String, Long>> wordAndOneTuple= lineDataSource.flatMap((String line, Collector<Tuple2<String, Long>> out) -> {
            //将一行文本进行分词
            String[] words = line.split(" ");
            //将每个单词转换成二元组输出
            for (String word : words) {
                out.collect(Tuple2.of(word, 1L));
            }
        }).returns(Types.TUPLE(Types.STRING, Types.LONG));
        //4.按照word进行分组
        UnsortedGrouping<Tuple2<String, Long>> wordAndOneGroup = wordAndOneTuple.groupBy(0);
        //5.分组内进行聚合统计
        AggregateOperator<Tuple2<String, Long>> sum = wordAndOneGroup.sum(1);
        //6.打印结果
        sum.print();
    }
}
```

`代码说明和注意事项：`

1>Flink 在执行应用程序前应该获取执行环境对象，也就是运行时上下文环境。

```java
ExecutionEnvironment env = ExecutionEnvironment.getExecutionEnvironment();
```

2>Flink 同时提供了 Java 和 Scala 两种语言的 API，有些类在两套 API 中名称是一样的。所以在引入包时，如果有 Java 和 Scala 两种选择，要注意选用 Java 的包。

3>直接调用执行环境的 readTextFile 方法，可以从文件中读取数据。

4>我们的目标是将每个单词对应的个数统计出来，所以调用 flatmap 方法可以对一行文字进行分词转换。将文件中每一行文字拆分成单词后，要转换成(word,count)形式的二元组，初始 count 都为 1。returns 方法指定的返回数据类型 Tuple2，就是 Flink 自带的二元组数据类型。

5>在分组时调用了 groupBy 方法，它不能使用分组选择器，只能采用位置索引或属性名称进行分组。

6>在分组之后调用 sum 方法进行聚合，同样只能指定聚合字段的位置索引或属性名称。

需要注意的是，这种代码的实现方式，是基于 DataSet API 的，也就是我们对数据的处理转换，是看作数据集来进行操作的。事实上 Flink 本身是流批统一的处理架构，批量的数据集本质上也是流，没有必要用两套不同的 API 来实现。所以从 Flink 1.12 开始，官方推荐的做法是直接使用 DataStream API，在提交任务时通过将执行模式设为 BATCH 来进行批处理：

$bin/flink run -Dexecution.runtime-mode=BATCH BatchWordCount.jar

这样，DataSet API 就已经处于“软弃用”（soft deprecated）的状态，在实际应用中我们只要维护一套 DataStream API 就可以了。这里只是为了理解，依然用 DataSet API做了批处理的实现。

## 3、流处理 （有界流数据）

`说明`

用DataSet API 可以很容易地实现批处理；与之对应，流处理当然可以用 DataStream API 来实现。对于 Flink 而言，流才是整个处理逻辑的底层核心，所以流批统一之后的 DataStream API 更加强大，可以直接处理批处理和流处理的所有场景。 DataStream API 作为“数据流”的处理接口，在 Flink 的视角里，一切数据都可以认为是 流，流数据是无界流，而批数据则是有界流。所以批处理，其实就可以看作有界流的处理。对于流而言，我们会在获取输入数据后立即处理，这个过程是连续不断的。当然，有时我们的输入数据可能会有尽头，这看起来似乎就成了一个有界流；但是它跟批处理是截然不同的 在输入结束之前，我们依然会认为数据是无穷无尽的，处理的模式也仍旧是连续逐个处理。 如下针对不同类型的输入数据源，用具体的代码来实现流处理。

```java
package com.kunan.wc;
import org.apache.flink.api.common.typeinfo.Types;
import org.apache.flink.api.java.tuple.Tuple2;
import org.apache.flink.streaming.api.datastream.DataStreamSource;
import org.apache.flink.streaming.api.datastream.KeyedStream;
import org.apache.flink.streaming.api.datastream.SingleOutputStreamOperator;
import org.apache.flink.streaming.api.environment.StreamExecutionEnvironment;
import org.apache.flink.util.Collector;
public class BoundedStreamWordCount {
    public static void main(String[] args) throws Exception {
        //1.创建流式的执行环境
        StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();
        //2.读取文件
        DataStreamSource<String> lineDataStreamSource = env.readTextFile("input/words.txt");
        //3.转换计算
        SingleOutputStreamOperator<Tuple2<String, Long>> wordAndOneTuple = lineDataStreamSource.flatMap((String line, Collector<Tuple2<String, Long>> out) -> {
            String[] words = line.split(" ");
            for (String word : words) {
                out.collect(Tuple2.of(word, 1L));
            }
        }).returns(Types.TUPLE(Types.STRING, Types.LONG));
        //4.分组操作
        KeyedStream<Tuple2<String, Long>, String> wordAndOneKeyedStream = wordAndOneTuple.keyBy(data -> data.f0);
        //5.求和
        SingleOutputStreamOperator<Tuple2<String, Long>> sum = wordAndOneKeyedStream.sum(1);
        // 6.打印
        sum.print();
        //7.启动执行
        env.execute();
    }
}
```

`注意观察与批处理程序 BatchWordCount 的不同：`

1>创建执行环境的不同，流处理程序使用的是 StreamExecutionEnvironment。

2>每一步处理转换之后，得到的数据对象类型不同。

3>分组操作调用的是 keyBy 方法，可以传入一个匿名函数作为键选择器 （KeySelector），指定当前分组的 key 是什么。

4>代码末尾需要调用 env 的 execute 方法，开始执行任务。

运行程序，控制台输出结果如下

```java
4> (hello,1)
4> (hello,2)
4> (hello,3)
4> (hello,4)
10> (flink,1)
12> (Spark,1)
9> (word,1)
10> (Java,1)
```

## 4、真正的流处理（读取文本流）

模拟场景:监听数据发送端主机的指定端口，统计发送来的文本数据中出现过的单词的个数

```java
package com.kunan.wc;
import org.apache.flink.api.common.typeinfo.Types;
import org.apache.flink.api.java.tuple.Tuple2;
import org.apache.flink.api.java.utils.ParameterTool;
import org.apache.flink.streaming.api.datastream.DataStreamSource;
import org.apache.flink.streaming.api.datastream.KeyedStream;
import org.apache.flink.streaming.api.datastream.SingleOutputStreamOperator;
import org.apache.flink.streaming.api.environment.StreamExecutionEnvironment;
import org.apache.flink.util.Collector;
public class StreamWordCount {
    public static void main(String[] args) throws Exception {
        //1,创建流式执行环境
        StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();
        //从参数中提取主机名和端口号
        //ParameterTool parameterTool = ParameterTool.fromArgs(args);
       // String host = parameterTool.get("host");
       //int port = parameterTool.getInt("port");
        //2,读取文件流
        DataStreamSource<String> lineDataStream = env.socketTextStream("192.168.38.102", 7777);
        //3.转换计算
        SingleOutputStreamOperator<Tuple2<String, Long>> wordAndOneTuple = lineDataStream.flatMap((String line, Collector<Tuple2<String, Long>> out) -> {
            String[] words = line.split(" ");
            for (String word : words) {
                out.collect(Tuple2.of(word, 1L));
            }
        }).returns(Types.TUPLE(Types.STRING, Types.LONG));
        //4.分组操作
        KeyedStream<Tuple2<String, Long>, String> wordAndOneKeyedStream = wordAndOneTuple.keyBy(data -> data.f0);
        //5.求和
        SingleOutputStreamOperator<Tuple2<String, Long>> sum = wordAndOneKeyedStream.sum(1);
        //6.打印
        sum.print();
        //7.启动执行
        env.execute();
    }
}
```

`代码说明和注意事项：`

1>socket 文本流的读取需要配置两个参数：发送端主机名和端口号。这里代码 中指定了主机“hadoop102”的 7777 端口作为发送数据的 socket 端口，可以根据测试环境自行配置。

2>在实际项目应用中，主机名和端口号这类信息往往可以通过配置文件，或者传入程序运行参数的方式来指定。

3>socket文本流数据的发送，可以通过Linux系统自带的netcat工具进行模拟。

**运行命令:**

```sh
$ nc -lk 7777
world
hello
hello
hello flink
hello word
hello java
world
world
hello java
hello java
```

启动StreamWordCount 程序会发现程序启动之后没有任何输出、也不会退出。这是正常的——因为 Flink 的流处 理是事件驱动的，当前程序会一直处于监听状态，只有接收到数据才会执行任务、输出统计结果。
