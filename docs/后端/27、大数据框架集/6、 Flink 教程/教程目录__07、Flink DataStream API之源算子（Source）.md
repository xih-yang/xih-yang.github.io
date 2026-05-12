# 07、Flink DataStream API之源算子（Source）
- 来源：https://ddkk.com/zhuanlan/bigdata/flink/1/7.html
- 分类：大数据框架
- 分组：教程目录
```java
Environment(执行环境) -->  Source(数据源) --> Transform(转换操作) --> Sink(输出)
```

创建环境之后，就可以构建数据处理的业务逻辑了，如上所示，下面主要学习Flink的源算子（Source）。想要处理数据，先得有数据，所以首要任务就是把数据读进来。 Flink可以从各种来源获取数据，然后构建DataStream进行转换处理。一般**将数据的输入来源称为数据源(data source)**，而读取数据的算子就是源算子（source operator）。所以source就是整个处理程序的输入端。 Flink代码中通用的添加source的方式，是调用执行环境的 addSource()方法：

```java
DataStream<String> stream = env.addSource(...);
```

方法传入一个对象参数，需要实现SourceFunction接口；返回 DataStreamSource。这里的DataStreamSource类继承自SingleOutputStreamOperator 类，又进一步继承自 DataStream。所以 很明显，读取数据的source操作是一个算子，得到的是一个数据流（DataStream）。 这里可能会有些麻烦：传入的参数是一个“源函数”（source function），需要实现 SourceFunction 接口。这是何方神圣，又该怎么实现呢？ 自己去实现它显然不会是一件容易的事。还好Flink直接提供了很多预实现的接口，此外，还有很多外部连接工具也帮我们实现了对应的sourcefunction，通常情况下足以应对实际需求。下面是详细讲解。

## 1.准备工作

为了更好地理解，先构建一个实际应用场景。如网站的访问操作，可以抽象成一个三元组（用户名，用户访问的 urrl，用户访问url的时间戳），所以在这里，可以创建一个类Event，将用户行为包装成它的一个对象。Event包含了以下一些字段，如下所示：

字段名
数据类型
说明

user
String
用户名

url
String
用户访问的 url

timestamp
Long
用户访问 url 的时间戳

具体代码如下:

```java
package com.kunan.StreamAPI.Source;
import java.sql.Timestamp;
public class Event {
    public String user;
    public String url;
    public Long timestamp;
    public Event() {
    }
    public Event(String user, String url, Long timestamp) {
        this.user = user;
        this.url = url;
        this.timestamp = timestamp;
    }
    @Override
    public String toString() {
        return "Event{" +
                "user='" + user + '\'' +
                ", url='" + url + '\'' +
                ", timestamp=" + new Timestamp(timestamp) +
                '}';
    }
}
```

这里需要注意，定义的Event，有这样几个特点：

- 类是公有（public）的
- 有一个无参构造方法
- 所有属性都是公有（public）的
- 所有属性的类型都是可以序列化的

Flink会把这样的类作为一种特殊的POJO数据类型来对待，方便数据的解析和序列化。 另外在类中还重写了toString 方法，主要是为了测试输出显示更清楚。关于Flink支持的数据类型，会在后面做详细说明。 这里自定义的Event POJO类会在后面的代码中频繁使用，所以在后面的代码中碰到 Event，把这里的 POJO 类导入就OK；

## 2.从集合中读取数据

最简单的读取数据的方式，就是在代码中直接创建一个Java集合，然后调用执行环境的fromCollection方法进行读取。这相当于将数据临时存储到内存中，形成特殊的数据结构后，作为数据源使用，一般用于测试。

```java
package com.kunan.StreamAPI.Source;
import com.kunan.StreamAPI.Source.Event;
import org.apache.flink.api.common.serialization.SimpleStringSchema;
import org.apache.flink.streaming.api.datastream.DataStreamSource;
import org.apache.flink.streaming.api.environment.StreamExecutionEnvironment;
import org.apache.flink.streaming.connectors.kafka.FlinkKafkaConsumer;
import java.util.ArrayList;
import java.util.Properties;
public class SourceTest {
    public static void main(String[] args) throws Exception {
        // 创建执行环境
        StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();
        //设置并行度1
        env.setParallelism(1);
        //从集合中读取数据
        ArrayList<Integer> nums = new ArrayList<>();
        nums.add(2);
        nums.add(5);
        DataStreamSource<Integer> numStream = env.fromCollection(nums);
        ArrayList<Event> events = new ArrayList<>();
        events.add(new Event("Mary","./home",1000L));
        events.add(new Event("Bob","./cart",2000L));
        events.add(new Event("Alice","./prod?id=100",3000L));
        DataStreamSource<Event> Stream = env.fromCollection(events);
        Stream.print("1");
        env.execute();
    }
}
```

## 3. 从文本读取数据

真正的实际应用中，自然不会直接将数据写在代码中。通常情况下，会从存储介质中获取数据，一个比较常见的方式就是读取日志文件。这也是批处理中最常见的读取方式。

```java
DataStreamSource<String> Stream = env.readTextFile("input/clicks.txt");
```

说明:

- 参数可以是目录，也可以是文件；
- 路径可以是相对路径，也可以是绝对路径；
- 相对路径是从系统属性user.dir获取路径: idea 下是project的根目录, standalone模式下是集群节点根目录；
- 也可以从hdfs目录下读取, 使用路径 hdfs://..., 由于Flink没有提供hadoop相关依赖, 需要pom中添加相关依赖:

```java
<dependency>
 <groupId>org.apache.hadoop</groupId>
 <artifactId>hadoop-client</artifactId>
 <version>2.7.5</version>
 <scope>provided</scope>
</dependency>
```

## 4.从 Socket 读取数据

不论从集合还是文件，读取的其实都是有界数据。在流处理的场景中，数据往往是无界的。这时又从哪里读取呢？ 一个简单的方式，就是之前用到的读取 socket文本流。这种方式由于吞吐量小、稳定性较差，一般也是用于测试。

```java
DataStreamSource<String> Stream4 = env.socketTextStream("hadoop102", 7777);
```

## 5.从 Kafka 读取数据

那对于真正的流数据，实际项目应该怎样读取呢？ Kafka 作为分布式消息传输队列，是一个高吞吐、易于扩展的消息系统。而消息队列的传输方式，恰恰和流处理是完全一致的。所以可以说Kafka和Flink天生一对，是当前处理流式数据的双子星。在如今的实时流处理应用中，由 Kafka 进行数据的收集和传输，Flink 进行分析计算，这样的架构已经成为众多企业的首选;

略微遗憾的是，Kafka的连接比较复杂，Flink内部并没有提供预实现的方法。所以只能采用通用的addSource方式、实现一个SourceFunction 。好在Kafka与Flink确实是非常契合，所以Flink官方提供了连接工具flink-connector-kafka，直接实现了一个消费者FlinkKafkaConsumer，它就是用来读取Kafka 数据的SourceFunction。 所以想要以Kafka作为数据源获取数据，只需要引入Kafka连接器的依赖。Flink官方提供的是一个通用的Kafka连接器，它会自动跟踪最新版本的Kafka客户端。目前最新版本只支持0.10.0版本以上的Kafka，使用时可以根据自己安装的Kafka版本选定连接器的依赖版本。这里需要导入的依赖如下。

```java
<dependency>
            <groupId>org.apache.flink</groupId>
            <artifactId>flink-connector-kafka_${scala.binary.version}</artifactId>
            <version>${flink.version}</version>
</dependency>
```

然后调用 env.addSource()，传入FlinkKafkaConsumer的对象实例就可以了。

```java
package com.kunan.StreamAPI.Source;
import com.kunan.StreamAPI.Source.Event;
import org.apache.flink.api.common.serialization.SimpleStringSchema;
import org.apache.flink.streaming.api.datastream.DataStreamSource;
import org.apache.flink.streaming.api.environment.StreamExecutionEnvironment;
import org.apache.flink.streaming.connectors.kafka.FlinkKafkaConsumer;
import java.util.ArrayList;
import java.util.Properties;
public class SourceTest {
    public static void main(String[] args) throws Exception {
        // 创建执行环境
        StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();
        //设置并行度1
        env.setParallelism(1);
		//从Kafka中读取数据
        Properties properties = new Properties();
        properties.setProperty("bootstrap.servers", "hadoop102:9092");
        properties.setProperty("group.id", "test-consumer-group");
        properties.setProperty("key.deserializer", "org.apache.kafka.common.serialization.StringDeserializer");
        properties.setProperty("value.deserializer", "org.apache.kafka.common.serialization.StringDeserializer");
        properties.setProperty("auto.offset.reset", "latest");
        DataStreamSource<String> kafkaStream = env.addSource(new FlinkKafkaConsumer<String>("clicks", new SimpleStringSchema(), properties));
        kafkaStream.print("Kafka");
        env.execute();
    }
}
```

注意：

- 确保集群已安装Kafka；
- Kafka是依赖Zookeeper的，所以两者都得安装才可测试

创建FlinkKafkaConsumer时需要传入三个参数：

- 第一个参数 topic，定义了从哪些主题中读取数据。可以是一个topic，也可以是topic列表，还可以是匹配所有想要读取的topic的正则表达式。当从多个topic中读取数据时，Kafka连接器将会处理所有topic的分区，将这些分区的数据放到一条流中去。
- 第二个参数是一个DeserializationSchema或者KeyedDeserializationSchema。Kafka 消息被存储为原始的字节数据，所以需要反序列化成Java或者 Scala对象。上面代码中使用的SimpleStringSchema，是一个内置的DeserializationSchema，它只是将字节数组简单地反序列化成字符串。DeserializationSchema和KeyedDeserializationSchema是公共接口，所以也可以自定义反序列化逻辑。
- 第三个参数是一个Properties对象，设置了Kafka客户端的一些属性。

## 6.自定义 Source

大多数情况下，前面的数据源已经能够满足需要。但是凡事总有例外，如果遇到特殊情况， 想要读取的数据源来自某个外部系统，而flink既没有预实现的方法、也没有提供连接器，该怎么办呢？那就只好自定义实现SourceFunction了。 接下来创建一个自定义的数据源，实现SourceFunction接口。

主要重写两个关键方法： **run()和 cancel()**。

- run()方法：使用运行时上下文对象（SourceContext）向下游发送数据；
- cancel()方法：通过标识位控制退出循环，来达到中断数据源的效果。
- 代码如下：

```java
package com.kunan.StreamAPI.Source;
import org.apache.flink.streaming.api.functions.source.SourceFunction;
import java.util.Calendar;
import java.util.Random;
public class ClickSource implements SourceFunction<Event> {
    //声明一个标志位
    private Boolean running = true;
    @Override
    public void run(SourceContext<Event> sourceContext) throws Exception {
        //随机生成数据
        Random random = new Random();
        //定义字段选取的数据集
        String[] users = {"Marry","Alice","Bob","Jek"};
        String[] urls = {"./home","./cart","./fav","./prod?id=100","./prod?id=199"};
        //循环生产数据
        while (running){
            String user = users[random.nextInt(users.length)];
            String url = urls[random.nextInt(urls.length)];
            Long timestamp = Calendar.getInstance().getTimeInMillis();
            sourceContext.collect(new Event(user,url,timestamp));
            Thread.sleep(1000);
        }
    }
    @Override
    public void cancel() {
            running = false;
    }
}
```

这个数据源，后面会频繁使用，所以在后面的代码中涉及到 ClickSource()数据源，使上面的代码即可

下面的代码来读取一下自定义的数据源。有了自定义的sourcefunction，接下来只要调用addSource()就可以了

```java
package com.kunan.StreamAPI.Source;
import org.apache.flink.streaming.api.datastream.DataStreamSource;
import org.apache.flink.streaming.api.environment.StreamExecutionEnvironment;
import org.apache.flink.streaming.api.functions.source.ParallelSourceFunction;
import java.util.Random;
public class SourceCustomTest {
    public static void main(String[] args) throws Exception {
        StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();
        //设置并行度为1
        env.setParallelism(1);
        env.setParallelism(4);
        DataStreamSource<Event> CustomSource = env.addSource(new ClickSource());
        CustomSource.print();
        env.execute();
    }
}
```

这里要注意的是 SourceFunction 接口定义的数据源，并行度只能设置为 1，如果数据源设 置为大于 1 的并行度，则会抛出异常。

```java
DataStreamSource<Event> CustomSource = env.addSource(new ClickSource()).setParallelism(2); //报错
```

```java
Exception in thread "main" java.lang.IllegalArgumentException: The parallelism 
of non parallel operator must be 1.
```

所以如果想要自定义并行的数据源的话，需要使用ParallelSourceFunction，示例程序如下：

```java
package com.kunan.StreamAPI.Source;
import org.apache.flink.streaming.api.datastream.DataStreamSource;
import org.apache.flink.streaming.api.environment.StreamExecutionEnvironment;
import org.apache.flink.streaming.api.functions.source.ParallelSourceFunction;
import java.util.Random;
public class SourceCustomTest {
    public static void main(String[] args) throws Exception {
        StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();
        env.setParallelism(4);
        DataStreamSource<Integer> CustomSource = env.addSource(new ParallelCustomSource()).setParallelism(2);
        CustomSource.print();
        env.execute();
    }
    public static class ParallelCustomSource implements ParallelSourceFunction<Integer>{
        private Boolean running  = true;
        private Random random = new Random();
        @Override
        public void run(SourceContext<Integer> ctx) throws Exception {
            while (running){
                ctx.collect(random.nextInt());
            }
        }
        @Override
        public void cancel() {
            running = false;
        }
    }
}
```

## 7.Flink支持的数据类型

**1、****Flink的类型系统**；

为什么会出现“不支持”的数据类型呢？因为Flink作为一个分布式处理框架，处理的是以数据对象作为元素的流。如果用水流来类比，那么要处理的数据元素就是随着水流漂动的物体。在这条流动的河里，可能漂浮着小木块，也可能行驶着内部错综复杂的大船。要分布式地处理这些数据，就不可避免地要面对数据的网络传输、状态的落盘和故障恢复等问题，这 就需要对数据进行序列化和反序列化。小木块是容易序列化的；而大船想要序列化之后传输，就需要将它拆解、清晰地知道其中每一个零件的类型。 为了方便地处理数据，Flink有自己一整套类型系统。Flink使用“类型信息” （TypeInformation）来统一表示数据类型。TypeInformation类是Flink中所有类型描述符的基类。 它涵盖了类型的一些基本属性，并为每个数据类型生成特定的序列化器、反序列化器和比较器。

**1、****Flink支持的数据类型**；

对于常见的Java和Scala数据类型，Flink都是支持的。Flink在内部，Flink对支持不同的类型进行了划分，这些类型可以在Types工具类中找到：

1、基本类型

所有Java 基本类型及其包装类，再加上Void、String、Date、BigDecimal和BigInteger

2、数组类型

包括基本类型数组（PRIMITIVE_ARRAY）和对象数组(OBJECT_ARRAY)

3、复合数据类型

- Java元组类型（TUPLE）：这是Flink内置的元组类型，是Java API的一部分。最多25个字段，也就是从Tuple0~Tuple25，不支持空字段;
- Scala样例类及Scala元组：不支持空字段;
- 行类型（ROW）：可以认为是具有任意个字段的元组,并支持空字段;
- POJO：Flink自定义的类似于Java bean模式的类;

4、辅助类型

Option、Either、List、Map 等

5、泛型类型（GENERIC）

Flink支持所有的Java类和Scala类。不过如果没有按照上面POJO类型的要求来定义，就会被Flink当作泛型类来处理。Flink会把泛型类型当作黑盒，无法获取它们内部的属性；它们也不是由Flink本身序列化的，而是由Kryo序列化的。 在这些类型中，元组类型和 POJO 类型最为灵活，因为它们支持创建复杂类型。而相比之下，POJO 还支持在键（key）的定义中直接使用字段名，这会让代码可读性大大增加。所以，在项目实践中，往往会将流处理程序中的元素类型定为Flink的POJO类型。

Flink对POJO类型的要求如下：

- 类是公共的（public）和独立的（standalone，也就是说没有非静态的内部类）；
- 类有一个公共的无参构造方法；
- 类中的所有字段是public且非final的；或者有一个公共的getter和setter方法，这些方法需要符合Java bean的命名规范。

之前的自定义source，就是创建的符合 Flink POJO 定义的数据类型。

**1、****类型提示（TypeHints）** ；

Flink还具有一个类型提取系统，可以分析函数的输入和返回类型，自动获取类型信息， 从而获得对应的序列化器和反序列化器。但是，由于Java中泛型擦除的存在，在某些特殊情况下（比如Lambda表达式中），自动提取的信息是不够精细的——只告诉Flink当前的元素由 “船头、船身、船尾”构成，根本无法重建出“大船”的模样；这时就需要显式地提供类型信 息，才能使应用程序正常工作或提高其性能。

为了解决这类问题，Java API提供了专门的“类型提示”（type hints）。 之前的word count流处理程序，在将String类型的每个词转换成（word， count）二元组后，就明确地用returns指定了返回的类型。因为对于 map 里传入的Lambda表达式，系统只能推断出返回的是Tuple2类型，而无法得到 Tuple2。只有显式地告诉系统当前的返回类型，才能正确地解析出完整数据。

```java
.map(word -> Tuple2.of(word, 1L))
.returns(Types.TUPLE(Types.STRING, Types.LONG))
```

这是一种比较简单的场景，二元组的两个元素都是基本数据类型。那如果元组中的一个元素又有泛型，如何处理?

Flink专门提供了TypeHint类，它可以捕获泛型的类型信息，并且一直记录下来，为运行时提供足够的信息。同样可以通过.returns()方法，明确地指定转换之后的DataStream里元素的类型。

```java
returns(new TypeHint<Tuple2<Integer,SomeType>>(){})
```
