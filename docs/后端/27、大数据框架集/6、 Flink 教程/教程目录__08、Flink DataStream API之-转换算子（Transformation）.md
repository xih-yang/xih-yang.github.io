# 08、Flink DataStream API之-转换算子（Transformation）
- 来源：https://ddkk.com/zhuanlan/bigdata/flink/1/8.html
- 分类：大数据框架
- 分组：教程目录
## 转换算子

数据源读入数据之后，就可以使用各种转换算子，将一个或多个DataStream转换为新的DataStream，如上所示。一个 Flink 程序的核心，其实就是所有的转换操作，它们决定了处理的业务逻辑。可以针对一条流进行转换处理，也可以进行分流、合流等多流转换操作，从而组合成复杂的数据流拓扑。下面将重点介绍基本的单数据流的转换，多流转换的内容将在后续展开。

## 一、基本转换算子

**1、****映射（map）** ；

介绍:

map是非常熟悉的大数据操作算子，主要用于将数据流中的数据进行转换，形成新的数据流。简单来说，就是一个“一一映射”，消费一个元素就产出一个元素

只需要基于DataStrema调用map()方法就可以进行转换处理。方法需要传入的参数是接口MapFunction的实现；返回值类型还是 DataStream，不过泛型（流中的元素类型）可能改变。

如下样例使用不同的方式，实现提取Event中user字段的功能

```java
package com.kunan.StreamAPI.Transform;
import com.kunan.StreamAPI.Source.Event;
import org.apache.flink.api.common.functions.MapFunction;
import org.apache.flink.streaming.api.datastream.DataStreamSource;
import org.apache.flink.streaming.api.datastream.SingleOutputStreamOperator;
import org.apache.flink.streaming.api.environment.StreamExecutionEnvironment;
public class TransformMapTest {
    public static void main(String[] args) throws Exception {
        StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();
        env.setParallelism(1);
        //从元素中读取数据
        DataStreamSource<Event> Stream = env.fromElements(
                new Event("Mary", "./home", 1000L),
                new Event("Bob", "./cart", 2000L),
                new Event("Alice", "./prod?id=100", 3000L)
        );
        //进行转计算,提取usr字段
        //1.使用自定义类实现MapFunction接口
        SingleOutputStreamOperator<String> result1 = Stream.map(new MyMapper());
        //2.使用匿名类实现MapFunction接口
        SingleOutputStreamOperator<String> result2 = Stream.map(new MapFunction<Event, String>() {
            @Override
            public String map(Event event) throws Exception {
                return event.user;
            }
        });
        //3.传入Lambda表达式  对于类里面只有一个方法的接口 可以使用Lambda表达式
        SingleOutputStreamOperator<String> result3 = Stream.map(date -> date.user);
        // result1.print();
      //  result2.print();
        result3.print();
        env.execute();
    }
    ///自定义MapFunction
    public static class MyMapper implements MapFunction<Event,String>{
        @Override
        public String map(Event event) throws Exception {
            return event.user;
        }
    }
}
```

上面代码中，MapFunction实现类的泛型类型，与输入数据类型和输出数据的类型有关。 在实现MapFunction接口的时候，需要指定两个泛型，分别是输入事件和输出事件的类型，还需要重写一个map()方法，定义从一个输入事件转换为另一个输出事件的具体逻辑。 另外，通过查看Flink源码可以发现，基于 DataStream调用map方法，返回的其实是一个**SingleOutputStreamOperator**

```java
public <R> SingleOutputStreamOperator<R> map(MapFunction<T, R> mapper){}
```

这表示map是一个用户可以自定义的转换（transformation）算子，它作用于一条数据流上，转换处理的结果是一个确定的输出类型。当然，SingleOutputStreamOperator类本身也继承自DataStream类，所以说map是将一个DataStream转换成另一个DataStream是完全合理的。

**2、****过滤（filter）** ；

介绍：
filter转换操作，顾名思义是对数据流执行一个过滤，通过一个布尔条件表达式设置过滤条件，对于每一个流内元素进行判断，若为true则元素正常输出，若为 false 则元素被过滤掉；

进行filter转换之后的新数据流的数据类型与原数据流是相同的。filter 转换需要传入的参数需要实现FilterFunction接口，而FilterFunction内要实现filter()方法，就相当于一个返回布尔类型的条件表达式。

下面的代码会将数据流中用户Bob的浏览行为过滤出来

```java
package com.kunan.StreamAPI.Transform;
import com.kunan.StreamAPI.Source.Event;
import org.apache.flink.api.common.functions.FilterFunction;
import org.apache.flink.streaming.api.datastream.DataStreamSource;
import org.apache.flink.streaming.api.datastream.SingleOutputStreamOperator;
import org.apache.flink.streaming.api.environment.StreamExecutionEnvironment;
public class TransformFilterTest {
    public static void main(String[] args) throws Exception {
        StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();
        env.setParallelism(1);
        //从元素中读取数据
        DataStreamSource<Event> Stream = env.fromElements(
                new Event("Mary", "./home", 1000L),
                new Event("Bob", "./cart", 2000L),
                new Event("Alice", "./prod?id=100", 3000L)
        );
        //1.传入一个实现了FilterFunction的类的对象
        SingleOutputStreamOperator<Event> result1 = Stream.filter(new MyFilter());
        //2.传入一个匿名类实现FilterFunction接口
        SingleOutputStreamOperator<Event> result2 = Stream.filter(new FilterFunction<Event>() {
            @Override
            public boolean filter(Event event) throws Exception {
                return event.user.equals("Mary");
            }
        });
        //3.传入Lambda表达式
        Stream.filter(data -> data.user.equals("Alice")).print();
        // result1.print();
       // result2.print();
        env.execute();
    }
    //实现一个自定义的FilterFunction
    public static class MyFilter implements FilterFunction<Event>{
        @Override
        public boolean filter(Event event) throws Exception {
            return event.user.equals("Bob");
        }
    }
}
```

**3、****扁平映射（flatMap）** ；

介绍:
flatMap操作又称为扁平映射，主要是将数据流中的整体（一般是集合类型）拆分成一个一个的个体使用。消费一个元素，可以产生0到多个元素。flatMap可以认为是“扁平化”（flatten） 和“映射”（map）两步操作的结合，也就是先按照某种规则对数据进行打散拆分，再对拆分后的元素做转换处理，之前的WordCount 程序的第一步分词操作，就用到了flatMap。

和map一样，flatMap也可以使用Lambda表达式或者FlatMapFunction接口实现类的方式来进行传参，返回值类型取决于所传参数的具体逻辑，可以与原数据流相同，也可以不同。

flatMap操作会应用在每一个输入事件上面，FlatMapFunction接口中定义了flatMap方法， 用户可以重写这个方法，在这个方法中对输入数据进行处理，并决定是返回 0个、1个或多个结果数据。因此 flatMap 并没有直接定义返回值类型，而是通过一个“收集器”（Collector）来指定输出。希望输出结果时，只要调用收集器的.collect()方法就可以了；这个方法可以多次调用，也可以不调用。所以 flatMap方法也可以实现map方法和filter方法的功能，当返回结果是0个的时候，就相当于对数据进行了过滤，当返回结果是 1 个的时候，相当于对数据进行了简单的转换操作。 flatMap的使用非常灵活，可以对结果进行任意输出，如下例子：

```java
package com.kunan.StreamAPI.Transform;
import com.kunan.StreamAPI.Source.Event;
import org.apache.flink.api.common.functions.FlatMapFunction;
import org.apache.flink.api.common.typeinfo.TypeHint;
import org.apache.flink.streaming.api.datastream.DataStreamSource;
import org.apache.flink.streaming.api.datastream.SingleOutputStreamOperator;
import org.apache.flink.streaming.api.environment.StreamExecutionEnvironment;
import org.apache.flink.util.Collector;
public class TransformFlatMapTest {
    public static void main(String[] args) throws Exception {
        StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();
        env.setParallelism(1);
        //从元素中读取数据
        DataStreamSource<Event> Stream = env.fromElements(
                new Event("Mary", "./home", 1000L),
                new Event("Bob", "./cart", 2000L),
                new Event("Alice", "./prod?id=100", 3000L)
        );
        //1.实现FlatMapFunction
       // Stream.flatMap(new MyFlatMap()).print();
        //2.传入一个匿名类实现FlatMapFunction接口
        SingleOutputStreamOperator<String> result1 = (SingleOutputStreamOperator<String>) Stream.flatMap(new FlatMapFunction<Event, String>() {
            @Override
            public void flatMap(Event value, Collector<String> out) throws Exception {
                out.collect(value.user);
                out.collect(value.url);
                out.collect(value.timestamp.toString());
            }
        });
        //3.直接传入Lambda表达式
        SingleOutputStreamOperator<String> result2 = Stream.flatMap((Event value, Collector<String> out) -> {
            if (value.user.equals("Mary"))
                out.collect(value.url);
            else if (value.user.equals("Bob")) {
                out.collect(value.user);
                out.collect(value.url);
                out.collect(value.timestamp.toString());
            }
        }).returns(new TypeHint<String>() {});
        result2.print();
        env.execute();
    }
    //实现一个自定义的FlatMapFunction
    public static class MyFlatMap implements FlatMapFunction<Event,String>{
        @Override
        public void flatMap(Event event, Collector<String> collector) throws Exception {
            collector.collect(event.user);
            collector.collect(event.url);
            collector.collect(event.timestamp.toString());
        }
    }
}
```

## 二、聚合算子

直观上看，基本转换算子确实是在“转换”——因为它们都是基于当前数据，去做了处理和输出。而在实际应用中，往往需要对大量的数据进行统计或整合，从而提炼出更有用的信息。比如之前wordcount程序中，要对每个词出现的频次进行叠加统计。这种操作，计算的结果不仅依赖当前数据，还跟之前的数据有关，相当于要把所有数据聚在一起进行汇总合并——这就是所谓的“聚合”（Aggregation），也对应着MapReduce中的reduce操作。

**1、****按键分区（keyBy）** ；

对于Flink 而言，DataStream是没有直接进行聚合的API的。因为对海量数据做聚合肯定要进行分区并行处理，这样才能提高效率。所以在 Flink 中，要做聚合，需要先进行分区；这个操作就是通过keyBy来完成的；

keyBy是聚合前必须要用到的一个算子。keyBy通过指定键（key），可以将一条流从逻辑上划分成不同的分区（partitions）。这里所说的分区，其实就是并行处理的子任务，也就对应着任务槽（taskslot）。 基于不同的key，流中的数据将被分配到不同的分区中去；这样一来，所有具有相同的key的数据，都将被发往同一个分区，那么下一步算子操作就将会在同一个slot中进行处理了。

在内部，是通过计算 key 的哈希值（hash code），对分区数进行取模运算来实现的。所以这里key如果是POJO的话，必须要重写hashCode()方法。 keyBy()方法需要传入一个参数，这个参数指定了一个或一组key。有很多不同的方法来指定key：比如对于Tuple数据类型，可以指定字段的位置或者多个位置的组合；对于 POJO 类 型，可以指定字段的名称（String）；另外，还可以传入Lambda表达式或者实现一个键选择器 （KeySelector），用于说明从数据中提取key的逻辑。 可以以id作为key 做一个分区操作

需要注意的是，keyBy得到的结果将不再是DataStream，而是会将DataStream转换为KeyedStream。KeyedStream可以认为是“分区流”或者“键控流”，它是对 DataStream 按照 key 的一个逻辑分区，所以泛型有两个类型：除去当前流中的元素类型外，还需要指定key的类型。 KeyedStream也继承自DataStream，所以基于它的操作也都归属于DataStreamAPI。但它跟之前的转换操作得到的SingleOutputStreamOperator不同，只是一个流的分区操作，并不是一个转换算子。KeyedStream是一个非常重要的数据结构，只有基于它才可以做后续的聚合操作（比如sum，reduce）而且它可以将当前算子任务的状态（state）也按照key进行划分、限定为仅对当前key有效

**2、****简单聚合**；

有了按键分区的数据流 KeyedStream，就可以基于它进行聚合操作了。Flink内置实现了一些最基本、最简单的聚合 API，主要有以下几种：

- sum()：在输入流上，对指定的字段做叠加求和的操作。
- min()：在输入流上，对指定的字段求最小值。
- max()：在输入流上，对指定的字段求最大值。
- minBy()：与 min()类似，在输入流上针对指定字段求最小值。不同的是，min()只计 算指定字段的最小值，其他字段会保留最初第一个数据的值；而 minBy()则会返回包 含字段最小值的整条数据。
- maxBy()：与 max()类似，在输入流上针对指定字段求最大值。两者区别与 min()/minBy()完全一致。

简单聚合算子使用非常方便，语义也非常明确。这些聚合方法调用时，也需要传入参数；但并不像基本转换算子那样需要实现自定义函数，只要说明聚合指定的字段就可以了。

指定字段的方式有两种：**指定位置**，和**指定名称**。 对于元组类型的数据，同样也可以使用这两种方式来指定字段。需要注意的是，元组中字 段的名称，是以 f0、f1、f2、…来命名的。

`指定位置`:

```java
package com.kunan.StreamAPI.Transform;
import org.apache.flink.api.java.tuple.Tuple2;
import org.apache.flink.streaming.api.datastream.DataStreamSource;
import org.apache.flink.streaming.api.environment.StreamExecutionEnvironment;
public class TransformTupleAggTest {
    public static void main(String[] args) throws Exception {
        StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();
        env.setParallelism(1);
        DataStreamSource<Tuple2<String, Integer>> stream = env.fromElements(
                Tuple2.of("a", 1),
                Tuple2.of("a", 3),
                Tuple2.of("b", 3),
                Tuple2.of("b", 4)
        );
        stream.keyBy(r -> r.f0).sum(1).print();
        stream.keyBy(r -> r.f0).sum("f1").print();
        stream.keyBy(r -> r.f0).max(1).print();
        stream.keyBy(r -> r.f0).max("f1").print();
        stream.keyBy(r -> r.f0).min(1).print();
        stream.keyBy(r -> r.f0).min("f1").print();
        stream.keyBy(r -> r.f0).maxBy(1).print();
        stream.keyBy(r -> r.f0).maxBy("f1").print();
        stream.keyBy(r -> r.f0).minBy(1).print();
        stream.keyBy(r -> r.f0).minBy("f1").print();
        env.execute();
    }
}
```

`字段名称来指定`

```java
package com.kunan.StreamAPI.Transform;
import com.kunan.StreamAPI.Source.Event;
import org.apache.flink.api.java.functions.KeySelector;
import org.apache.flink.streaming.api.datastream.DataStreamSource;
import org.apache.flink.streaming.api.environment.StreamExecutionEnvironment;
public class TransFormSimpleAggTest {
    public static void main(String[] args) throws Exception {
        StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();
        env.setParallelism(1);
        //从元素中读取数据
        DataStreamSource<Event> Stream = env.fromElements(
                new Event("Mary", "./home", 1000L),
                new Event("Bob", "./cart", 2000L),
                new Event("Alice", "./prod?id=100", 3000L),
                new Event("Bob", "./home", 3300L),
                new Event("Bob", "./prod?id=120", 3600L),
                new Event("Bob", "./prod?id=130", 4000L)
        );
        //按键分组之后进行聚合,提取当前用户最后一次访问数据
        Stream.keyBy(new KeySelector<Event, String>() {
            @Override
            public String getKey(Event value) throws Exception {
                return value.user;
            }
        }).max("timestamp").print("Max");
        //指定字段的名称
        Stream.keyBy(data -> data.user).maxBy("timestamp").print("MapBy");
        env.execute();
    }
}
```

**3、****归约聚合（reduce）** ；

如果说简单聚合是对一些特定统计需求的实现，那么reduce算子就是一个一般化的聚合统计操作了。从MapReduce开始，对reduce操作就不陌生：它可以对已有的数据进行归约处理，把每一个新输入的数据和当前已经归约出来的值，再做一个聚合计算。

与简单聚合类似，reduce操作也会将KeyedStream转换为DataStream。它不会改变流的元素数据类型，所以输出类型和输入类型是一样的。 调用KeyedStream的reduce方法时，需要传入一个参数，实现 ReduceFunction接口。接 口在源码中的定义如下：

```java
public interface ReduceFunction<T> extends Function, Serializable {
T reduce(T value1, T value2) throws Exception;
}
```

ReduceFunction接口里需要实现 reduce()方法，这个方法接收两个输入事件，经过转换处理之后输出一个相同类型的事件；所以，对于一组数据，可以先取两个进行合并，然后再将合并的结果看作一个数据、再跟后面的数据合并，最终会将它“简化”成唯一的一个数据， 这也就是 reduce“归约”的含义。在流处理的底层实现过程中，实际上是将中间“合并的结果” 作为任务的一个状态保存起来的；之后每来一个新的数据，就和之前的聚合状态进一步做归约。

其实，reduce的语义是针对列表进行规约操作，运算规则由ReduceFunction中的reduce方法来定义，而在ReduceFunction内部会维护一个初始值为空的累加器，注意累加器的类型和输入元素的类型相同，当第一条元素到来时，累加器的值更新为第一条元素的值，当新的元素到来时，新元素会和累加器进行累加操作，这里的累加操作就是reduce函数定义的运算规则。然后将更新以后的累加器的值向下游输出。

可以单独定义一个函数类实现ReduceFunction接口，也可以直接传入一个匿名类。 当然，同样也可以通过传入Lambda表达式实现类似的功能。 与简单聚合类似，reduce操作也会将KeyedStream转换为DataStrema。它不会改变流的元素数据类型，所以输出类型和输入类型是一样的。 下面来看一个稍复杂的例子:

将数据流按照用户id进行分区，然后用一个reduce算子实现sum的功能，统计每个用户访问的频次；进而将所有统计结果分到一组，用另一个reduce算子实现 maxBy的功能， 记录所有用户中访问频次最高的那个，也就是当前访问量最大的用户是谁。

```java
package com.kunan.StreamAPI.Transform;
import com.kunan.StreamAPI.Source.Event;
import org.apache.flink.api.common.functions.MapFunction;
import org.apache.flink.api.common.functions.ReduceFunction;
import org.apache.flink.api.java.tuple.Tuple2;
import org.apache.flink.streaming.api.datastream.DataStreamSource;
import org.apache.flink.streaming.api.datastream.SingleOutputStreamOperator;
import org.apache.flink.streaming.api.environment.StreamExecutionEnvironment;
public class TransformReduceTest {
    public static void main(String[] args) throws Exception {
        StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();
        env.setParallelism(1);
        //从元素中读取数据
        DataStreamSource<Event> Stream = env.fromElements(
                new Event("Mary", "./home", 1000L),
                new Event("Bob", "./cart", 1500L),
                new Event("Alice", "./prod?id=100", 1800L),
                new Event("Bob", "./prod?id=1", 2000L),
                new Event("Alice", "./prod?id=200", 3000L),
                new Event("Bob", "./home", 2500L),
                new Event("Bob", "./prod?id=120", 3600L),
                new Event("Bob", "./prod?id=130", 4000L)
        );
        //1.统计每个用户的访问频次
        SingleOutputStreamOperator<Tuple2<String, Long>> clicksByUser = Stream.map(new MapFunction<Event, Tuple2<String, Long>>() {
            //将Event数据类型转换成元组类型
            @Override
            public Tuple2<String, Long> map(Event value) throws Exception {
                return Tuple2.of(value.user, 1L);
            }
        }).keyBy(data -> data.f0) //使用用户名来进行分流
                .reduce(new ReduceFunction<Tuple2<String, Long>>() {
            @Override
            public Tuple2<String, Long> reduce(Tuple2<String, Long> value1, Tuple2<String, Long> value2) throws Exception {
                //每到一条数据，用户 pv 的统计值加 1
                return Tuple2.of(value1.f0, value1.f1 + value2.f1);
            }
        });
        //2.选取当前最活跃的用户
        SingleOutputStreamOperator<Tuple2<String, Long>> result = clicksByUser
                .keyBy(data -> "key") //为每一条数据分配同一个key，将聚合结果发送到一条流中去
                .reduce(new ReduceFunction<Tuple2<String, Long>>() {
            @Override
            public Tuple2<String, Long> reduce(Tuple2<String, Long> value1, Tuple2<String, Long> value2) throws Exception {
                // 将累加器更新为当前最大的 pv 统计值，然后向下游发送累加器的值
                return value1.f1 > value2.f1 ? value1 : value2;
            }
        });
        result.print();
        env.execute();
    }
}
```

reduce 同简单聚合算子一样，也要针对每一个key保存状态。因为状态不会清空，所以需要将reduce算子作用在一个有限key的流上;

## 三、用户自定义函数（UDF）

前面的介绍可以发现，Flink的DataStreamAPI编程风格其实是一致的：基本上都是基于 DataStream 调用一个方法，表示要做一个转换操作；方法需要传入一个参数，这个参数都是需要实现一个接口。还可以扩展到 ource算子，其实也是需要自定义类实现一个SourceFunction 接口。

很容易发现，这些接口有一个共同特点：**全部都以算子操作名称 + Function命名，如源算子需要实现SourceFunction接口，map算子需要实现MapFunction接口，reduce算子需要实现ReduceFunction接口。** 而且查看源码会发现，它们都继承自Function接口;这个接口是空的，主要就是为了方便扩展为单一抽象方法（Single Abstract Method，SAM）接口，这就是所谓的“函数接口”——比如MapFunction中需要实现一个map()方法，ReductionFunction中需要实现一个reduce()方法，它们都是SAM接口,Java8新增的Lambda表达式就可以实现SAM接口；所以这样的好处就是不仅可以通过自定义函数类或者匿名类来实现接口，也可以直接传入Lambda表达式。这就是所谓的用户自定义函数（user-defined function，UDF）。

> 下面对几种编程方式进行总结:

**1、****函数类(FunctionClasses)**；

对于大部分操作而言，都需要传入一个用户自定义函数（UDF），实现相关操作的接口，来完成处理逻辑的定义。Flink暴露了所有UDF函数的接口，具体实现方式为接口或者抽象类，例如MapFunction、FilterFunction、ReduceFunction 等。

所以最简单直接的方式，就是自定义一个函数类，实现对应的接口。之前对于API的demo，主要就是基于这种方式。

如下实现了FilterFunction接口，用来筛选用户为‘bob’的事件:

```java
package com.kunan.StreamAPI.Transform;
import com.kunan.StreamAPI.Source.Event;
import org.apache.flink.api.common.functions.FilterFunction;
import org.apache.flink.streaming.api.datastream.DataStreamSource;
import org.apache.flink.streaming.api.datastream.SingleOutputStreamOperator;
import org.apache.flink.streaming.api.environment.StreamExecutionEnvironment;
public class TransformFilterTest {
    public static void main(String[] args) throws Exception {
        StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();
        env.setParallelism(1);
        //从元素中读取数据
        DataStreamSource<Event> Stream = env.fromElements(
                new Event("Mary", "./home", 1000L),
                new Event("Bob", "./cart", 2000L),
                new Event("Alice", "./prod?id=100", 3000L)
        );
        //1.传入一个实现了FilterFunction的类的对象
        SingleOutputStreamOperator<Event> result1 = Stream.filter(new MyFilter());
        result1.print();
        env.execute();
    }
    //实现一个自定义的FilterFunction
    public static class MyFilter implements FilterFunction<Event>{
        @Override
        public boolean filter(Event event) throws Exception {
            return event.user.equals("Bob");
        }
    }
}
```

**当然还可以通过匿名类来实现FilterFunction接口：**

```java
//传入一个匿名类实现FilterFunction接口
        SingleOutputStreamOperator<Event> result2 = Stream.filter(new FilterFunction<Event>() {
            @Override
            public boolean filter(Event event) throws Exception {
                return event.user.equals("Mary");
            }
        });
```

`为了类可以更加通用，还可以将用于过滤的关键字"bob"抽象出来作为类的属性，调用构造方法时传进去。`

```java
 SingleOutputStreamOperator<Event> result1 = Stream.filter(new MyFilter("Bob"));
    //实现一个自定义的FilterFunction
    public static class MyFilter implements FilterFunction<Event>{
        private String UserName;
        MyFilter(String userName) {
            this.UserName = userName;
        }
        @Override
        public boolean filter(Event event) throws Exception {
            return event.user.equals(this.UserName);
        }
    }
```

**2、****匿名函数（Lambda）** ；

```java
匿名函数（Lambda表达式）是Java 8引入的新特性，方便我们更加快速清晰地写代码。**Lambda表达式允许以简洁的方式实现函数，以及将函数作为参数来进行传递，而不必声明额外的（匿名）类。**
Flink的所有算子都可以使用Lambda表达式的方式来进行编码，但是，**当Lambda表达式使用Java的泛型时，需要显式的声明类型信息。**
```

下例演示了如何使用Lambda表达式来实现一个简单的map()函数，使用Lambda表达式来计算输出点击事件。在这里，不需要声明map()函数的输入i和输出参数的数据类型，因为Java编译器会对它们做出类型推断。

```java
package com.kunan.StreamAPI.Transform;
import com.kunan.StreamAPI.Source.Event;
import org.apache.flink.streaming.api.datastream.DataStreamSource;
import org.apache.flink.streaming.api.environment.StreamExecutionEnvironment;
public class TransformLambdaTest {
    public static void main(String[] args) throws Exception {
        StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();
        env.setParallelism(1);
        DataStreamSource<Event> clicks = env.fromElements(
                new Event("Mary", "./home", 1000L),
                new Event("Bob", "./cart", 2000L)
        );
        //map 函数使用Lambda 表达式，返回简单类型，不需要进行类型声明
        clicks.map(data -> data.url).print();
        env.execute();
    }
}
```

由于OUT是String类型而不是泛型，所以Flink可以从函数签名OUT map(IN value) 的实现中自动提取出结果的类型信息。

但是对于像flatMap()这样的函数，它的函数签名void flatMap(IN value, Collector  out) 被Java编译器编译成了void flatMap(IN value, Collector out)，也就是说将Collector的泛型信息擦除掉了。这样Flink就无法自动推断输出的类型信息了。

如下代码：

```java
 SingleOutputStreamOperator<String> result2 = Stream.flatMap((Event value, Collector<String> out) -> {
            if (value.user.equals("Mary"))
                out.collect(value.url);
            else if (value.user.equals("Bob")) {
                out.collect(value.user);
                out.collect(value.url);
                out.collect(value.timestamp.toString());
            }
        });
        result2.print();
```

会报如下异常:

```java
Exception in thread "main" org.apache.flink.api.common.functions.InvalidTypesException: The return type of function 'main(TransformFlatMapTest.java:33)' could not be determined automatically, due to type erasure. You can give type information hints by using the returns(...) method on the result of the transformation call, or by letting your function implement the 'ResultTypeQueryable' interface.
```

在这种情况下，需要显式地指定类型信息，否则输出将被视为Object类型，这会导致低效的序列化

```java
// flatMap 使用Lambda表达式，必须通过returns明确声明返回类型 
DataStream<String> stream2 = clicks.flatMap((Event event, Collector<String> 
out) -> { 
out.collect(event.url); 
}).returns(Types.STRING); 
stream2.print(); 
```

当使用map()函数返回Flink自定义的元组类型时也会发生类似的问题。下例中的函数签名Tuple2 map(Event value)被类型擦除为Tuple2 map(Event value)。

```java
package com.kunan.StreamAPI.Transform;
import com.kunan.StreamAPI.Source.Event;
import org.apache.flink.api.java.tuple.Tuple2;
import org.apache.flink.streaming.api.datastream.DataStreamSource;
import org.apache.flink.streaming.api.datastream.SingleOutputStreamOperator;
import org.apache.flink.streaming.api.environment.StreamExecutionEnvironment;
public class ReturnTypeTest {
    public static void main(String[] args) throws Exception {
        StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();
        env.setParallelism(1);
        //从元素中读取数据
        DataStreamSource<Event> stream = env.fromElements(
                new Event("Mary", "./home", 1000L),
                new Event("Bob", "./cart", 2000L),
                new Event("Alice", "./prod?id=100", 3000L)
        );
        SingleOutputStreamOperator<Tuple2<String, Long>> result = stream.map(data -> Tuple2.of(data.user, 1L));
        result.print();
        env.execute();
    }
}
```

一般来说，这个问题可以通过多种方式解决

```java
package com.kunan.StreamAPI.Transform;
import com.kunan.StreamAPI.Source.Event;
import org.apache.flink.api.common.functions.MapFunction;
import org.apache.flink.api.common.typeinfo.Types;
import org.apache.flink.api.java.tuple.Tuple2;
import org.apache.flink.streaming.api.datastream.DataStreamSource;
import org.apache.flink.streaming.api.datastream.SingleOutputStreamOperator;
import org.apache.flink.streaming.api.environment.StreamExecutionEnvironment;
public class ReturnTypeTest {
    public static void main(String[] args) throws Exception {
        StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();
        env.setParallelism(1);
        //从元素中读取数据
        DataStreamSource<Event> stream = env.fromElements(
                new Event("Mary", "./home", 1000L),
                new Event("Bob", "./cart", 2000L),
                new Event("Alice", "./prod?id=100", 3000L)
        );
        // 想要转换成二元组类型 需要进行以下处理
        // 1.使用显式的returns();
        SingleOutputStreamOperator<Tuple2<String, Long>> result = stream.map(data -> Tuple2.of(data.user, 1L))
                .returns(Types.TUPLE(Types.STRING, Types.LONG));
        result.print();
        // 2.使用类来替代Lambda表达式
        SingleOutputStreamOperator<Tuple2<String, Long>> Result2 = stream.map(new MyTuple2());
        //3.使用匿名类来替代Lambda表达式
        SingleOutputStreamOperator<Tuple2<String, Long>> result3 = stream.map(new MapFunction<Event, Tuple2<String, Long>>() {
            @Override
            public Tuple2<String, Long> map(Event value) throws Exception {
                return Tuple2.of(value.user, 1L);
            }
        });
        result.print("Result:");
        Result2.print("Result2:");
        result3.print("result3:");
        env.execute();
    }
    // 自定义MapFunction类
    public static class MyTuple2 implements MapFunction<Event,Tuple2<String,Long>>{
        @Override
        public Tuple2<String, Long> map(Event value) throws Exception {
            return Tuple2.of(value.user,1L);
        }
    }
}
```

`这些方法对于其它泛型擦除的场景同样适用。`

**3、****富函数类(RichFunctionClasses)**；

“富函数类”也是DataStream API提供的一个函数类的接口，所有的Flink函数类都有其Rich版本。富函数类一般是以抽象类的形式出现的。

例如：RichMapFunction、RichFilterFunction、RichReduceFunction 等。

既然“富”，那么它一定会比常规的函数类提供更多、更丰富的功能。与常规函数类的不同主要在于，富函数类可以获取运行环境的上下文，并拥有一些生命周期方法，所以可以实现更复杂的功能。

注：生命周期的概念在编程中其实非常重要，到处都有体现。例如：对于C语言来说，需要手动管理内存的分配和回收，也就是手动管理内存的生命周期。分配内存而不回收，会造成内存泄漏，回收没有分配过的内存，会造成空指针异常。而在JVM 中，虚拟机会自动帮助管理对象的生命周期。对于前端来说，一个页面也会有生命周期。数据库连接、网络连接以及文件描述符的创建和关闭，也都形成了生命周期。所以生命周期的概念在编程中是无处不在的，需要多加注意。

Rich Function有生命周期的概念。典型的生命周期方法有：

- open()方法，是Rich Function 的初始化方法，也就是会开启一个算子的生命周期。当一个算子的实际工作方法例如map()或者filter()方法被调用之前，open()会首先被调用。所以像文件IO 的创建，数据库连接的创建，配置文件的读取等等这样一次性的工作，都适合在open()方法中完成。
- close()方法，是生命周期中的最后一个调用的方法，类似于解构方法。一般用来做一些清理工作。

`需要注意的是，这里的生命周期方法，对于一个并行子任务来说只会调用一次；而对应的，实际工作方法，例如RichMapFunction 中的map()，在每条数据到来后都会触发一次调用。`

下面看个例子:

```java
package com.kunan.StreamAPI.Transform;
import com.kunan.StreamAPI.Source.Event;
import org.apache.flink.api.common.functions.RichMapFunction;
import org.apache.flink.configuration.Configuration;
import org.apache.flink.streaming.api.datastream.DataStreamSource;
import org.apache.flink.streaming.api.environment.StreamExecutionEnvironment;
public class TransformRichFunction {
    public static void main(String[] args) throws Exception {
        StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();
        env.setParallelism(1);
        //从元素中读取数据
        DataStreamSource<Event> Stream = env.fromElements(
                new Event("Mary", "./home", 1000L),
                new Event("Bob", "./cart", 2000L),
                new Event("Alice", "./prod?id=100", 3000L)
        );
        Stream.map(new MyRichMapper()).setParallelism(2)
                .print();
        env.execute();
    }
    //实现一个自定义的富函数类
    public static class MyRichMapper extends RichMapFunction<Event,Integer>{
        @Override
        public void open(Configuration parameters) throws Exception {
            super.open(parameters);
            System.out.println("Open生命周期被调用 " + getRuntimeContext().getIndexOfThisSubtask()+ "号任务启动");
        }
        @Override
        public Integer map(Event value) throws Exception {
            return value.url.length();
        }
        @Override
        public void close() throws Exception {
            super.close();
            System.out.println("Close生命周期被调用 " + getRuntimeContext().getIndexOfThisSubtask() +Myyang "号任务启结束");
        }
    }
}
```

一个常见的应用场景就是，如果连接到一个外部数据库进行读写操作，那么将连接操作放在map()中显然不是个好选择——因为每来一条数据就会重新连接一次数据库；所以可以在open()中建立连接，在map()中读写数据，而在close()中关闭连接。所以最佳实践如下：

```java
public class MyFlatMap extends RichFlatMapFunction<IN, OUT>> { 
    @Override
    public void open(Configuration configuration) { 
        // 做一些初始化工作
        // 例如建立一个和MySQL 的连接
    }
    @Override
    public void flatMap(IN in, Collector<OUT out) {
        // 对数据库进行读写
    }
    @Override
    public void close() {
        // 清理工作，关闭和MySQL 数据库的连接。
    }
}
```

另外，富函数类提供了getRuntimeContext()方法（在本节的第一个例子中使用了一下），可以获取到运行时上下文的一些信息，例如程序执行的并行度，任务名称，以及状态（state）。这使得我们可以大大扩展程序的功能，特别是对于状态的操作，使得Flink 中的算子具备了处理复杂业务的能力。关于Flink 中的状态管理和状态编程，会在后续章节逐渐展开。

## 四、物理分区（Physical Partitioning）

顾名思义，“分区”（partitioning）操作就是要将数据进行重新分布，传递到不同的流分区去进行下一步处理。其实应该对分区操作并不陌生，前面介绍聚合算子时，已经提到了keyBy，它就是一种按照键的哈希值来进行重新分区的操作。只不过这种分区操作只能保证把数据按key“分开”，至于分得均不均匀、每个key 的数据具体会分到哪一区去，这些是完全无从控制的——所以有时也说keyBy是一种逻辑分区（logical partitioning）操作。

如果说keyBy这种逻辑分区是一种“软分区”，那真正硬核的分区就应该是所谓的“物理分区”（physical partitioning）。也就是要真正控制分区策略，精准地调配数据，告诉每个数据到底去哪里。其实这种分区方式在一些情况下已经在发生了：例如编写的程序可能对多个处理任务设置了不同的并行度，那么当数据执行的上下游任务并行度变化时，数据就不应该还在当前分区以直通（forward）方式传输了——因为如果并行度变小，当前分区可能没有下游任务了；而如果并行度变大，所有数据还在原先的分区处理就会导致资源的浪费。所以这种情况下，系统会自动地将数据均匀地发往下游所有的并行任务，保证各个分区的负载均衡。

有些时候，还需要手动控制数据分区分配策略。比如当发生数据倾斜的时候，系统无法自动调整，这时就需要重新进行负载均衡，将数据流较为平均地发送到下游任务操作分区中去。Flink 对于经过转换操作之后的DataStream，提供了一系列的底层操作接口，能够帮实现数据流的手动重分区。为了同keyBy相区别，把这些操作统称为“物理分区”操作。物理分区与keyBy另一大区别在于，keyBy之后得到的是一个KeyedStream，而物理分区之后结果仍是DataStream，且流中元素数据类型保持不变。从这一点也可以看出，分区算子并不对数据进行转换处理，只是定义了数据的传输方式。

常见的物理分区策略有随机分配（Random）、轮询分配（Round-Robin）、重缩放（Rescale）和广播（Broadcast），下边分别来做了解

**1、****随机分区（shuffle）** ；

最简单的重分区方式就是直接“洗牌”。通过调用DataStream的.shuffle()方法，将数据随机地分配到下游算子的并行任务中去。

随机分区服从均匀分布（uniform distribution），所以可以把流中的数据随机打乱，均匀地传递到下游任务分区，因为是完全随机的，所以对于同样的输入数据, 每次执行得到的结果也不会相同

经过随机分区之后，得到的依然是一个DataStream

可以做个简单测试：将数据读入之后直接打印到控制台，将输出的并行度设置为4，中间经历一次shuffle。执行多次，观察结果是否相同。

```java
package com.kunan.StreamAPI.Transform;
import com.kunan.StreamAPI.Source.Event;
import org.apache.flink.api.common.functions.Partitioner;
import org.apache.flink.api.java.functions.KeySelector;
import org.apache.flink.streaming.api.datastream.DataStreamSource;
import org.apache.flink.streaming.api.environment.StreamExecutionEnvironment;
import org.apache.flink.streaming.api.functions.source.ParallelSourceFunction;
import org.apache.flink.streaming.api.functions.source.RichParallelSourceFunction;
public class TransformPartitionTest {
    public static void main(String[] args) throws Exception {
        StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();
        env.setParallelism(1);
        //从元素中读取数据
        DataStreamSource<Event> Stream = env.fromElements(
                new Event("Mary", "./home", 1000L),
                new Event("Bob", "./cart", 1500L),
                new Event("Alice", "./prod?id=100", 1800L),
                new Event("Bob", "./prod?id=1", 2000L),
                new Event("Alice", "./prod?id=200", 3000L),
                new Event("Bob", "./home", 2500L),
                new Event("Bob", "./prod?id=120", 3600L),
                new Event("Bob", "./prod?id=130", 4000L)
        );
        //1、随机分区
        Stream.shuffle().print().setParallelism(4);
        env.execute();
    }
}
```

**2、****轮询分区（Round-Robin）** ；

轮询也是一种常见的重分区方式。简单来说就是“发牌”，按照先后顺序将数据做依次分发。通过调用DataStream的.rebalance()方法，就可以实现轮询重分区。rebalance使用的是Round-Robin负载均衡算法，可以将输入流数据平均分配到下游的并行任务中去。

注：**Round-Robin算法用在了很多地方，例如Kafka 和Nginx。**

```java
package com.kunan.StreamAPI.Transform;
import com.kunan.StreamAPI.Source.Event;
import org.apache.flink.api.common.functions.Partitioner;
import org.apache.flink.api.java.functions.KeySelector;
import org.apache.flink.streaming.api.datastream.DataStreamSource;
import org.apache.flink.streaming.api.environment.StreamExecutionEnvironment;
import org.apache.flink.streaming.api.functions.source.ParallelSourceFunction;
import org.apache.flink.streaming.api.functions.source.RichParallelSourceFunction;
public class TransformPartitionTest {
    public static void main(String[] args) throws Exception {
        StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();
        env.setParallelism(1);
        //从元素中读取数据
        DataStreamSource<Event> Stream = env.fromElements(
                new Event("Mary", "./home", 1000L),
                new Event("Bob", "./cart", 1500L),
                new Event("Alice", "./prod?id=100", 1800L),
                new Event("Bob", "./prod?id=1", 2000L),
                new Event("Alice", "./prod?id=200", 3000L),
                new Event("Bob", "./home", 2500L),
                new Event("Bob", "./prod?id=120", 3600L),
                new Event("Bob", "./prod?id=130", 4000L)
        );
        //2、轮询分区
       Stream.rebalance().print().setParallelism(4);
       Stream.print().setParallelism(4);  //输出和rebalance一致。Flink底层默认就是 rebalance 分区
        env.execute();
    }
}
```

**3、****重缩放分区（rescale）** ；

重缩放分区和轮询分区非常相似。当调用rescale()方法时，其实底层也是使用Round-Robin算法进行轮询，但是只会将数据轮询发送到下游并行任务的一部分中，也就是说，“发牌人”如果有多个，那么rebalance的方式是每个发牌人都面向所有人发牌；而rescale的做法是分成小团体，发牌人只给自己团体内的所有人轮流发牌。

当下游任务（数据接收方）的数量是上游任务（数据发送方）数量的整数倍时，rescale的效率明显会更高。比如当上游任务数量是2，下游任务数量是6 时，上游任务其中一个分区的数据就将会平均分配到下游任务的3 个分区中。

由于rebalance是所有分区数据的“重新平衡”，当TaskManager数据量较多时，这种跨节点的网络传输必然影响效率；而如果配置的taskslot数量合适，用rescale的方式进行“局部重缩放”，就可以让数据只在当前TaskManager的多个slot之间重新分配，从而避免了网络传输带来的损耗。

从底层实现上看，rebalance和rescale的根本区别在于任务之间的连接机制不同。rebalance将会针对所有上游任务（发送数据方）和所有下游任务（接收数据方）之间建立通信通道，这是一个笛卡尔积的关系；而 rescale 仅仅针对每一个任务和下游对应的部分任务之间建立通信通道，节省了很多资源。

可以在代码中测试如下：

```java
package com.kunan.StreamAPI.Transform;
import com.kunan.StreamAPI.Source.Event;
import org.apache.flink.api.common.functions.Partitioner;
import org.apache.flink.api.java.functions.KeySelector;
import org.apache.flink.streaming.api.datastream.DataStreamSource;
import org.apache.flink.streaming.api.environment.StreamExecutionEnvironment;
import org.apache.flink.streaming.api.functions.source.ParallelSourceFunction;
import org.apache.flink.streaming.api.functions.source.RichParallelSourceFunction;
public class TransformPartitionTest {
    public static void main(String[] args) throws Exception {
        StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();
        env.setParallelism(1);
        //从元素中读取数据
        DataStreamSource<Event> Stream = env.fromElements(
                new Event("Mary", "./home", 1000L),
                new Event("Bob", "./cart", 1500L),
                new Event("Alice", "./prod?id=100", 1800L),
                new Event("Bob", "./prod?id=1", 2000L),
                new Event("Alice", "./prod?id=200", 3000L),
                new Event("Bob", "./home", 2500L),
                new Event("Bob", "./prod?id=120", 3600L),
                new Event("Bob", "./prod?id=130", 4000L)
        );
        //3、rescale重缩放分区
        //这里使用了并行数据源的富函数版本
        //这样可以调用getRuntimeContext方法来获取运行时上下文的一些信息 
        env.addSource(new RichParallelSourceFunction<Integer>() {
            @Override
            public void run(SourceContext<Integer> ctx) throws Exception {
                for (int i = 0; i < 8; i++) {
                    //将奇偶数发送到0号和1号并行分区
                    if(i % 2 == getRuntimeContext().getIndexOfThisSubtask())
                        ctx.collect(i);
                }
            }
            @Override
            public void cancel() {
            }
        }).setParallelism(2);
     //   .rescale().print().setParallelism(4);
        env.execute();
    }
}
```

**4、****广播（broadcast）** ；

这种方式其实不应该叫做“重分区”，因为经过广播之后，数据会在不同的分区都保留一份，可能进行重复处理。可以通过调用DataStream的broadcast()方法，将输入数据复制并发送到下游算子的所有并行任务中去。

```java
package com.kunan.StreamAPI.Transform;
import com.kunan.StreamAPI.Source.Event;
import org.apache.flink.api.common.functions.Partitioner;
import org.apache.flink.api.java.functions.KeySelector;
import org.apache.flink.streaming.api.datastream.DataStreamSource;
import org.apache.flink.streaming.api.environment.StreamExecutionEnvironment;
import org.apache.flink.streaming.api.functions.source.ParallelSourceFunction;
import org.apache.flink.streaming.api.functions.source.RichParallelSourceFunction;
public class TransformPartitionTest {
    public static void main(String[] args) throws Exception {
        StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();
        env.setParallelism(1);
        //从元素中读取数据
        DataStreamSource<Event> Stream = env.fromElements(
                new Event("Mary", "./home", 1000L),
                new Event("Bob", "./cart", 1500L),
                new Event("Alice", "./prod?id=100", 1800L),
                new Event("Bob", "./prod?id=1", 2000L),
                new Event("Alice", "./prod?id=200", 3000L),
                new Event("Bob", "./home", 2500L),
                new Event("Bob", "./prod?id=120", 3600L),
                new Event("Bob", "./prod?id=130", 4000L)
        );
        //4、广播
        Stream.broadcast().print().setParallelism(4);
        env.execute();
    }
}
```

数据被复制然后广播到了下游的所有并行任务中去了.

**5、****全局分区（global）** ；

全局分区也是一种特殊的分区方式。这种做法非常极端，通过调用.global()方法，会将所有的输入流数据都发送到下游算子的第一个并行子任务中去。这就相当于强行让下游任务并行度变成了1，所以使用这个操作需要非常谨慎，可能对程序造成很大的压力。

```java
 Stream.global().print().setParallelism(4);
```

**6、****自定义分区（Custom）** ；

当Flink提供的所有分区策略都不能满足用户的需求时，可以通过使用partitionCustom()方法来自定义分区策略。

在调用时，方法需要传入两个参数，第一个是自定义分区器（Partitioner）对象，第二个是应用分区器的字段，它的指定方式与keyBy指定 key 基本一样：可以通过字段名称指定，也可以通过字段位置索引来指定，还可以实现一个KeySelector。

例如，可以对一组自然数按照奇偶性进行重分区。代码如下：

```java
package com.kunan.StreamAPI.Transform;
import com.kunan.StreamAPI.Source.Event;
import org.apache.flink.api.common.functions.Partitioner;
import org.apache.flink.api.java.functions.KeySelector;
import org.apache.flink.streaming.api.datastream.DataStreamSource;
import org.apache.flink.streaming.api.environment.StreamExecutionEnvironment;
import org.apache.flink.streaming.api.functions.source.ParallelSourceFunction;
import org.apache.flink.streaming.api.functions.source.RichParallelSourceFunction;
public class TransformPartitionTest {
    public static void main(String[] args) throws Exception {
        StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();
        env.setParallelism(1);
        //从元素中读取数据
        DataStreamSource<Event> Stream = env.fromElements(
                new Event("Mary", "./home", 1000L),
                new Event("Bob", "./cart", 1500L),
                new Event("Alice", "./prod?id=100", 1800L),
                new Event("Bob", "./prod?id=1", 2000L),
                new Event("Alice", "./prod?id=200", 3000L),
                new Event("Bob", "./home", 2500L),
                new Event("Bob", "./prod?id=120", 3600L),
                new Event("Bob", "./prod?id=130", 4000L)
        );
        //6、自定义分区
        //将自然数按照奇偶分区
        env.fromElements(1,2,3,4,5,6,7,8).partitionCustom(new Partitioner<Integer>() {
            @Override
            public int partition(Integer key, int numPartitions) {
                return key % 2;
            }
        }, new KeySelector<Integer, Integer>() {
            @Override
            public Integer getKey(Integer value) throws Exception {
                return value;
            }
        }).print().setParallelism(4);
        env.execute();
    }
}
```
