# 20、Hadoop 教程 - Hadoop MapReduce入门与基础理论
- 来源：https://ddkk.com/zhuanlan/bigdata/hadoop/2/20.html
- 分类：大数据框架
- 分组：教程目录
## 1. 初识MapReduce

### 1.1 理解MapReduce思想

MapReduce 思想在生活中处处可见，每个人或多或少都曾接触过这种思想。MapReduce 的思想核心是 “先分再合，分而治之”， 所谓 “分而治之” 就是把一个复杂的问题，按照一定的 “分解” 方法分为等价的规模较小的若干部分，然后逐个解决，分别找出各部分的结果，把各部分的结果组成整个问题的结果。

这种思想来源于日常生活与工作时的经验，同样也完全适用于大量复杂的任务处理场景（大规模数据处理场景）。即使是发布过论文实现分布式计算的谷歌也只是实现了这种思想，而不是自己原创。

Map 负责 “分”，即把复杂的任务分解为若干个 “简单的任务” 来并行处理。可以进行拆分的前提是这些小任务可以并行计算，彼此间几乎没有依赖关系。

Reduce 负责 “合”，即对 map 阶段的结果进行全局汇总。

这两个阶段合起来正是 MapReduce 思想的体现。

**一个比较形象的语言解释MapReduce：**

我们要数停车场中的所有的车数量。你数第一列，我数第二列。这就是 “Map”。我们人越多，能够同时数车的人就越多，速度就越快。

数完之后，我们聚到一起，把所有人的统计数加在一起。这就是 “Reduce”。

### 1.2 场景：如何模拟实现分布式计算

#### 1.2.1 什么是分布式计算

分布式计算是一种计算方法，和集中式计算是相对的。

随着计算技术的发展，有些应用需要非常巨大的计算能力才能完成，如果采用集中式计算，需要耗费相当长的时间来完成。

分布式计算`将该应用分解成许多小的部分，分配给多台计算机进行处理`。这样可以节约整体计算时间，大大提高计算效率。

#### 1.2.2 大数据场景下模拟实现

### 1.3 Hadoop MapReduce设计构思

MapReduce 是 Hadoop 的一个模块，是一个`分布式运算程序`的编程框架。

对许多开发者来说，自己完完全全实现一个并行计算程序难度太大，而 MapReduce 就是一种`简化并行计算的编程模型，降低了开发并行应用的入门门槛`。

Hadoop MapReduce 构思体现在如下的三个方面。

#### 1.3.1 如何对付大数据处理

对相互间`不具有计算依赖关系`的大数据计算任务，实现并行最自然的办法就是`采取MapReduce分而治之`的策略。

也就是 Map 阶段分的阶段，把大数据拆分成若干份小数据，多个程序同时并行计算产生中间结果；然后是 Reduce 聚合阶段，通过程序对并行的结果进行最终的汇总计算，得出最终的结果。

并行计算的第一个重要问题是如何划分计算任务或者计算数据以便对划分的子任务或数据块同时进行计算。`不可分拆的计算任务或相互间有依赖关系的数据无法进行并行计算！`

#### 1.3.2 构建抽象模型

MapReduce 借鉴了函数式语言中的思想，`用Map和Reduce两个函数提供了高层的并行编程抽象模型`。

Map：对一组数据元素进行某种重复式的处理；

Reduce：对 Map 的中间结果进行某种进一步的结果整理。

MapReduce 中定义了如下的 Map 和 Reduce 两个抽象的编程接口，由用户去编程实现：

`map: (k1; v1) → [(k2; v2)]`

`reduce: (k2; [v2]) → [(k3; v3)]`

Map 和 Reduce 为程序员提供了一个清晰的操作接口抽象描述。通过以上两个编程接口，大家可以看出 MapReduce 处理的数据类型是``键值对。

#### 1.3.3 统一架构、隐藏底层细节

如何提供统一的计算框架，如果没有统一封装底层细节，那么程序员则需要考虑诸如数据存储、划分、分发、结果收集、错误恢复等诸多细节；为此，MapReduce 设计并提供了统一的计算框架，为程序员隐藏了绝大多数系统层面的处理细节。

MapReduce 最大的亮点在于通过抽象模型和计算框架把`需要做什么(what need to do)`与`具体怎么做(how to do)`分开了，为程序员提供一个抽象和高层的编程接口和框架。

程序员仅需要关心其应用层的具体计算问题，仅需编写少量的处理应用本身计算问题的程序代码。如何具体完成这个并行计算任务所相关的诸多系统层细节被隐藏起来,交给计算框架去处理：从分布代码的执行，到大到数千小到单个节点集群的自动调度使用。

## 2. Hadoop MapReduce简介

### 2.1 MapReduce介绍

`Hadoop MapReduce是一个分布式运算程序的编程框架`，用于轻松编写应用程序，这些应用程序以可靠，容错的方式`并行处理`大型硬件集群（数千个节点）上的`大量数据`（多 TB 数据集）。

MapReduce 是一种面向海量数据处理的一种指导思想，也是一种用于对大规模数据进行分布式计算的编程模型。

MapReduce 核心功能是将`用户编写的业务逻辑代码`和`自带默认组件`整合成一个完整的`分布式运算程序`，并发运行在一个 Hadoop 集群上。

MapReduce 最早由 Google 于 2004 年在一篇名为《MapReduce:Simplified Data Processingon Large Clusters》的论文中提出，把分布式数据处理的过程拆分为 Map 和 Reduce 两个操作函数（受到 Lisp 以及其他函数式编程语言的启发），随后被 Apache Hadoop 参考并作为开源版本提供支持。它的出现解决了人们在最初面临海量数据束手无策的问题，同时，它还是易于使用和高度可扩展的，使得开发者无需关系分布式系统底层的复杂性即可很容易的编写分布式数据处理程序，并在成千上万台普通的商用服务器中运行。

### 2.2 MapReduce特点

- **易于编程**
- Mapreduce 框架提供了用于二次开发得接口；简单地实现一些接口，就可以完成一个分布式程序。任务计算交给计算框架去处理，将分布式程序部署到 hadoop 集群上运行，集群节点可以扩展到成百上千个等。
- **良好的扩展性**
- 当计算机资源不能得到满足的时候，可以通过增加机器来扩展它的计算能力。基于 MapReduce 的分布式计算得特点可以随节点数目增长保持近似于线性的增长，这个特点是 MapReduce 处理海量数据的关键，通过将计算节点增至几百或者几千可以很容易地处理数百 TB 甚至 PB 级别的离线数据。
- **高容错性**
- Hadoop 集群是分布式搭建和部署得，任何单一机器节点宕机了，它可以把上面的计算任务转移到另一个节点上运行，不影响整个作业任务得完成，过程完全是由 Hadoop 内部完成的。
- **适合海量数据的离线处理**
- 可以处理 GB、TB 和 PB 级别得数据量

### 2.3 MapReduce局限性

MapReduce 虽然有很多的优势，也有相对得局限性，不代表不能做，而是在有些场景下实现的效果比较差，并不适合用 MapReduce 来处理，主要表现在以下结果方面：

- **实时计算性能差**
- MapReduce 主要应用于离线作业，无法作到秒级或者是亚秒级得数据响应。
- **不能进行流式计算**
- 流式计算特点是数据是源源不断得计算，并且数据是动态的；而 MapReduce 作为一个离线计算框架，主要是针对静态数据集得，数据是不能动态变化得。
- **不擅长DAG（有向无环图）计算**
- 多个应用程序存在依赖关系，后一个应用程序的输入为前一个的输出。在这种情况下，MapReduce 并不是不能做，而是使用后，每个 MapReduce 作业的输出结果都会写入到磁盘，会造成大量的磁盘 IO，导致性能非常的低下。

## 3. Hadoop MapReduce编程

### 3.1 MapReduce架构体系

一个完整的 mapreduce 程序在分布式运行时有三类实例进程：

- MRAppMaster：负责整个程序的过程调度及状态协调。
- MapTask：负责 Map 阶段的整个数据处理流程。
- ReduceTask：负责 Reduce 阶段的整个数据处理流程。

### 3.2 MapReduce编程规范

MapReduce 分布式的运算程序需要分成 2 个阶段，分别是 Map 阶段和 Reduce 阶段。Map 阶段对应的是 MapTask 并发实例，完全并行运行，互不相干。Reduce 阶段对应的是 ReduceTask 并发实例，数据依赖于上一个阶段所有 MapTask 并发实例的数据输出结果。

MapReduce 编程模型只能包含一个 Map 阶段和一个 Reduce 阶段，如果用户的业务逻辑非常复杂，那就只能多个 MapReduce 程序，串行运行。

用户编写的程序分成三个部分：`Mapper`，`Reducer`，`Driver`（提交运行 mr 程序的客户端驱动）。

用户自定义的 Mapper 和 Reducer 都要继承各自的父类。Mapper 中的业务逻辑写在`map()`方法中，Reducer 的业务逻辑写在`reduce()`方法中。整个程序需要一个 Driver 来进行提交，提交的是一个描述了各种必要信息的`job`对象。

最需要注意的是：`整个MapReduce程序中，数据都是以kv键值对的形式流转的`。因此在实际编程解决各种业务问题中，需要考虑每个阶段的输入输出 kv 分别是什么。并且在 MapReduce 中数据会因为某些默认的机制进行排序进行分组。所以说 kv 的类型数据确定及其重要。

### 3.3 Map Reduce工作执行流程

整个 MapReduce 工作流程可以分为 3 个阶段：`map`、`shuffle`、`reduce`。

- **map阶段：**
- 负责把从数据源读取来到数据进行处理，默认情况下读取数据返回的是 kv 键值对类型，经过自定义 map 方法处理之后，输出的也应该是 kv 键值对类型。
- **shuffle阶段：**
- map 输出的数据会经过分区、排序、分组等自带动作进行重组，相当于洗牌的逆过程。这是 MapReduce 的核心所在，也是难点所在。也是值得我们深入探究的所在。
- 默认分区规则：key 相同的分在同一个分区，同一个分区被同一个 reduce 处理。
- 默认排序规则：根据 key 字典序排序
- 默认分组规则：key 相同的分为一组，一组调用 reduce 处理一次。
- **reduce阶段：**
- 负责针对 shuffle 好的数据进行聚合处理。输出的结果也应该是 kv 键值对。

## 4. Hadoop序列化机制

### 4.1 什么是序列化

`序列化（Serialization）`是将结构化`对象转换成字节流`以便于进行`网络传输`或写入`持久存储`的过程。

`反序列化（Deserialization）`是将字节流转换为一系列结构化对象的过程，重新创建该对象。

序列化的用途：

**1、** 作为一种持久化格式；

**2、** 作为一种通信的数据格式；

**3、** 作为一种数据拷贝、克隆机制；

**简单概况：**

**把对象转换为字节序列的过程称为对象的序列化。**

**把字节序列恢复为对象的过程称为对象的反序列化。**

### 4.2 Java的序列化机制

Java 中，一切都是对象，在分布式环境中经常需要将 Object 从这一端网络或设备传递到另一端。这就需要有一种可以在两端传输数据的协议。Java 序列化机制就是为了解决这个问题而产生。

Java 对象序列化的机制，把对象表示成一个`二进制的字节数组`，里面包含了对象的数据，对象的类型信息，对象内部的数据的类型信息等等。通过保存或则转移这些二进制数组达到持久化、传递的目的。

要实现序列化，需要实现`java.io.Serializable`接口。反序列化是和序列化相反的过程，就是把二进制数组转化为对象的过程。

### 4.3 Hadoop的序列化机制

Hadoop 的序列化没有采用 java 的序列化机制，而是实现了自己的序列化机制。

原因在于 java 的序列化机制比较臃肿，重量级，是不断的创建对象的机制，并且会额外附带很多信息（校验、继承关系系统等）。但在 Hadoop 的序列化机制中，用户可以复用对象，这样就减少了 java 对象的分配和回收，提高了应用效率。

Hadoop 通过`Writable接口实现的序列化机制`，不过没有提供比较功能，所以和 java 中的 Comparable 接口合并，提供一个接口 WritableComparable（自定义比较）。

Writable 接口提供两个方法（`write`和`readFields`）。

```java
package org.apache.hadoop.io;
public interface Writable {
  void write(DataOutput out) throws IOException;
  void readFields(DataInput in) throws IOException;
}
```

### 4.4 Hadoop中的数据类型

Hadoop 提供了如下内容的数据类型，这些数据类型都实现了`WritableComparable`接口，以便用这些类型定义的数据可以被序列化进行网络传输和文件存储，以及进行大小比较。

Hadoop 数据类型
Java数据类型
备注

BooleanWritable
boolean
标准布尔型数值

ByteWritable
byte
单字节数值

IntWritable
int
整型数

FloatWritable
float
浮点数

LongWritable
long
长整型数

DoubleWritable
double
双字节数值

Text
String
使用UTF8格式存储的文本

MapWritable
map
映射

ArrayWritable
array
数组

NullWritable
null
当中的key或value为空时使用

注意：如果需要将自定义的类放在 key 中传输，则还需要实现 Comparable 接口，因为 MapReduce 框中的 Shuffle 过程要求对 key 必须能排序。

## 5. MapReduce经典入门案例

### 5.1 WordCount业务需求

WordCount 中文叫做单词统计、词频统计，指的是使用程序统计某文本文件中，每个单词出现的总次数。这个是大数据计算领域经典的入门案例，虽然业务及其简单，但是希望能够通过案例感受背后 MapReduce 的执行流程和默认的行为机制，这才是关键。

```java
# 输入数据 1.txt
hello hadoop hello hello
hadoop allen hadoop
--
# 输出结果
hello 3
hadoop 3
allen 1
```

### 5.2 MapReduce编程思路

`map阶段核心`：把输入的数据经过切割，全部标记 1。因此输出就是 。

`shuffle阶段核心`：经过默认的排序分区分组，key 相同的单词会作为一组数据构成新的 kv 对。

`reduce阶段核心`：处理 shuffle 完的一组数据，该组数据就是该单词所有的键值对。对所有的 1 进行累加求和，就是该单词的总次数。最终输出 。

### 5.3 WordCount编程实现

#### 5.3.1 编程环境搭建

```java
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    <groupId>org.example</groupId>
    <artifactId>HdfsDemo</artifactId>
    <version>1.0-SNAPSHOT</version>
    <properties>
        <maven.compiler.source>8</maven.compiler.source>
        <maven.compiler.target>8</maven.compiler.target>
    </properties>
    <repositories>
        <repository>
            <id>cental</id>
            <url>http://maven.aliyun.com/nexus/content/groups/public//</url>
            <releases>
                <enabled>true</enabled>
            </releases>
            <snapshots>
                <enabled>true</enabled>
                <updatePolicy>always</updatePolicy>
                <checksumPolicy>fail</checksumPolicy>
            </snapshots>
        </repository>
    </repositories>
    <dependencies>
        <dependency>
            <groupId>org.apache.hadoop</groupId>
            <artifactId>hadoop-common</artifactId>
            <version>3.3.1</version>
        </dependency>
        <dependency>
            <groupId>org.apache.hadoop</groupId>
            <artifactId>hadoop-client</artifactId>
            <version>3.3.1</version>
        </dependency>
        <dependency>
            <groupId>org.apache.hadoop</groupId>
            <artifactId>hadoop-hdfs</artifactId>
            <version>3.3.1</version>
        </dependency>
        <dependency>
            <groupId>org.apache.hadoop</groupId>
            <artifactId>hadoop-mapreduce-client-core</artifactId>
            <version>3.3.1</version>
        </dependency>
        <dependency>
            <groupId>junit</groupId>
            <artifactId>junit</artifactId>
            <version>4.13</version>
        </dependency>
        <!-- Google Options -->
        <dependency>
            <groupId>com.github.pcj</groupId>
            <artifactId>google-options</artifactId>
            <version>1.0.0</version>
        </dependency>
        <dependency>
            <groupId>commons-io</groupId>
            <artifactId>commons-io</artifactId>
            <version>2.6</version>
        </dependency>
    </dependencies>
    <build>
        <plugins>
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-compiler-plugin</artifactId>
                <version>3.1</version>
                <configuration>
                    <source>1.8</source>
                    <target>1.8</target>
                </configuration>
            </plugin>
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-shade-plugin</artifactId>
                <version>3.1.1</version>
                <configuration>
                </configuration>
                <executions>
                    <execution>
                        <phase>package</phase>
                        <goals>
                            <goal>shade</goal>
                        </goals>
                        <configuration>
                            <createDependencyReducedPom>false</createDependencyReducedPom>
                            <shadedArtifactAttached>true</shadedArtifactAttached>
                            <shadedClassifierName>jar-with-dependencies</shadedClassifierName>
                            <filters>
                                <filter>
                                    <artifact>*:*</artifact>
                                    <excludes>
                                        <exclude>META-INF/*.SF</exclude>
                                        <exclude>META-INF/*.DSA</exclude>
                                        <exclude>META-INF/*.RSA</exclude>
                                    </excludes>
                                </filter>
                            </filters>
                            <transformers>
                                <transformer
                                        implementation="org.apache.maven.plugins.shade.resource.ServicesResourceTransformer"/>
                                <transformer
                                        implementation="org.apache.maven.plugins.shade.resource.ManifestResourceTransformer">
                                    <mainClass>cn.itcast.sentiment_upload.Entrance</mainClass>
                                </transformer>
                            </transformers>
                        </configuration>
                    </execution>
                </executions>
            </plugin>
        </plugins>
    </build>
</project>
```

#### 5.3.2 Mapper类编写

```java
public class WordCountMapper extends Mapper<LongWritable, Text,Text,LongWritable> {
    //Mapper输出kv键值对  <单词，1>
    private Text keyOut = new Text();
	private final static LongWritable valueOut = new LongWritable(1);
    @Override
    protected void map(LongWritable key, Text value, Context context) throws IOException, InterruptedException {
        //将读取的一行内容根据分隔符进行切割
        String[] words = value.toString().split("\\s+");
        //遍历单词数组
        for (String word : words) {
            keyOut.set(word);
            //输出单词，并标记1
            context.write(new Text(word),valueOut);
        }
    }
}
```

#### 5.3.3 Reducer类编写

```java
public class WordCountReducer extends Reducer<Text, LongWritable,Text,LongWritable> {
    private LongWritable result = new LongWritable();
    @Override
    protected void reduce(Text key, Iterable<LongWritable> values, Context context) throws IOException, InterruptedException {
        //统计变量
        long count = 0;
        //遍历一组数据，取出该组所有的value
        for (LongWritable value : values) {
            //所有的value累加 就是该单词的总次数
            count +=value.get();
        }
        result.set(count);
        //输出最终结果<单词，总次数>
        context.write(key,result);
    }
}
```

#### 5.3.4 客户端驱动类编写

##### 5.3.4.1 方式1：直接构建作业启动

```java
public class WordCountDriver_v1 {
    public static void main(String[] args) throws Exception {
        //配置文件对象
        Configuration conf = new Configuration();
        // 创建作业实例
        Job job = Job.getInstance(conf, WordCountDriver_v1.class.getSimpleName());
        // 设置作业驱动类
        job.setJarByClass(WordCountDriver_v1.class);
        // 设置作业mapper reducer类
        job.setMapperClass(WordCountMapper.class);
        job.setReducerClass(WordCountReducer.class);
        // 设置作业mapper阶段输出key value数据类型
        job.setMapOutputKeyClass(Text.class);
        job.setMapOutputValueClass(LongWritable.class);
        //设置作业reducer阶段输出key value数据类型 也就是程序最终输出数据类型
        job.setOutputKeyClass(Text.class);
        job.setOutputValueClass(LongWritable.class);
        // 配置作业的输入数据路径
        FileInputFormat.addInputPath(job, new Path(args[0]));
        // 配置作业的输出数据路径
        FileOutputFormat.setOutputPath(job, new Path(args[1]));
        //判断输出路径是否存在 如果存在删除
        FileSystem fs = FileSystem.get(conf);
        if(fs.exists(new Path(args[1]))){
            fs.delete(new Path(args[1]),true);
        }
        // 提交作业并等待执行完成
        boolean resultFlag = job.waitForCompletion(true);
        //程序退出
        System.exit(resultFlag ? 0 :1);
    }
}
```

##### 5.3.4.2 方式2：Tool工具类创建启动

```java
public class WordCountDriver_v2 extends Configured implements Tool {
    @Override
    public int run(String[] args) throws Exception {
        // 创建作业实例
        Job job = Job.getInstance(getConf(), WordCountDriver_v2.class.getSimpleName());
        // 设置作业驱动类
        job.setJarByClass(WordCountDriver_v2.class);
        // 设置作业mapper reducer类
        job.setMapperClass(WordCountMapper.class);
        job.setReducerClass(WordCountReducer.class);
        // 设置作业mapper阶段输出key value数据类型
        job.setMapOutputKeyClass(Text.class);
        job.setMapOutputValueClass(LongWritable.class);
        //设置作业reducer阶段输出key value数据类型 也就是程序最终输出数据类型
        job.setOutputKeyClass(Text.class);
        job.setOutputValueClass(LongWritable.class);
        // 配置作业的输入数据路径
        FileInputFormat.addInputPath(job, new Path(args[0]));
        // 配置作业的输出数据路径
        FileOutputFormat.setOutputPath(job, new Path(args[1]));
        //判断输出路径是否存在 如果存在删除
        FileSystem fs = FileSystem.get(getConf());
        if(fs.exists(new Path(args[1]))){
            fs.delete(new Path(args[1]),true);
        }
        // 提交作业并等待执行完成
        return job.waitForCompletion(true) ? 0 : 1;
	}
    public static void main(String[] args) throws Exception {
        //配置文件对象
        Configuration conf = new Configuration();
        //使用工具类ToolRunner提交程序
        int status = ToolRunner.run(conf, new WordCountDriver_v2(), args);
        //退出客户端程序 客户端退出状态码和MapReduce程序执行结果绑定
        System.exit(status);
    }
}
```

## 6. MapReduce程序运行

所谓的运行模式讲的是：mr 程序是单机运行还是分布式运行？mr 程序需要的运算资源是 yarn 分配还是单机系统分配？

运行在何种模式取决于下述这个参数：

`mapreduce.framework.name=yarn`，集群模式

`mapreduce.framework.name=local`，本地模式

默认是 local 模式 在`mapred-default.xml`中有定义。如果代码中、运行的环境中有配置，会默认覆盖 default 配置。

### 6.1 本地模式运行

mapreduce 程序是被提交给 LocalJobRunner 在本地以单进程的形式运行。而处理的数据及输出结果可以在本地文件系统，也可以在 hdfs 上。

本质是程序的 conf 中是否有`mapreduce.framework.name=local`。

本地模式非常便于进行业务逻辑的 debug。

右键直接运行`main`方法所在的主类即可。

### 6.2 集群模式运行

将mapreduce 程序提交给 yarn 集群，分发到很多的节点上并发执行。处理的数据和输出结果应该位于 hdfs 文件系统。

将程序打成jar包，然后在集群的任意一个节点上用下面命令启动：

```java
hadoop jar wordcount.jar com.mapreduce.WordCountDriver args
yarn jar wordcount.jar com.mapreduce.WordCountDriver args
```

## 7. MapReduce输入输出梳理

MapReduce 框架运转在``键值对上，也就是说，框架把作业的输入看成是一组  键值对，同样也产生一组  键值对作为作业的输出，这两组键值对可能是不同的。

### 7.1 输入特点

默认读取数据的组件叫做`TextInputFormat`。

关于输入路径：

- 如果指向的是一个文件，就处理该文件
- 如果指向的是一个文件夹（目录），就处理该目录所有的文件，当成整体来处理。

### 7.2 输出特点

默认输出数据的组件叫做`TextOutputFormat`。

输出路径不能提前存在，否则执行报错，对输出路径进行检测判断。

## 8. MapReduce流程简单梳理

### 8.1 执行流程图

### 8.2 Map阶段执行过程

- **第一阶段**是把输入目录下文件按照一定的标准逐个进行逻辑切片，形成切片规划。默认情况下，Split size=Block size。每一个切片由一个 MapTask 处理（getSplits）。
- **第二阶段**是对切片中的数据按照一定的规则解析成``对。默认规则是把每一行文本内容解析成键值对。key 是每一行的起始位置（单位是字节），value 是本行的文本内容（TextInputFormat）。
- **第三阶段**是调用 Mapper 类中的 map 方法。上阶段中每解析出来的一个``，调用一次map方法。每次调用 map 方法会输出零个或多个键值对。
- **第四阶段**是按照一定的规则对第三阶段输出的键值对进行分区。默认是只有一个区。分区的数量就是 Reducer 任务运行的数量。默认只有一个 Reducer 任务。
- **第五阶段**是对每个分区中的键值对进行排序。首先，按照键进行排序，对于键相同的键值对，按照值进行排序。比如三个键值对 ``、``、``，键和值分别是整数。那么排序后的结果是 ``、``、``。如果有第六阶段，那么进入第六阶段；如果没有，直接输出到文件中。
- **第六阶段**是对数据进行局部聚合处理，也就是 combiner 处理。键相等的键值对会调用一次 reduce 方法。经过这一阶段，数据量会减少。本阶段默认是没有的。

### 8.3 Redue阶段执行过程

- **第一阶段**是 Reducer 任务会主动从 Mapper 任务复制其输出的键值对。Mapper 任务可能会有很多，因此 Reducer 会复制多个 Mapper 的输出。
- **第二阶段**是把复制到 Reducer 本地数据，全部进行合并，即把分散的数据合并成一个大的数据。再对合并后的数据排序。
- **第三阶段**是对排序后的键值对调用 reduce 方法。键相等的键值对调用一次 reduce 方法，每次调用会产生零个或者多个键值对。最后把这些输出的键值对写入到 HDFS 文件中。

**在整个MapReduce程序的开发过程中，我们最大的工作量是覆盖map函数和覆盖reduce函数。**
