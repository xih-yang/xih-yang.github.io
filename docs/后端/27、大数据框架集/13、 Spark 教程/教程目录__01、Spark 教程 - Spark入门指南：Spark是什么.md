# 01、Spark 教程 - Spark入门指南：Spark是什么
- 来源：https://ddkk.com/zhuanlan/bigdata/spark/2/1.html
- 分类：大数据框架
- 分组：教程目录
在这个数据驱动的时代，信息的处理和分析变得越来越重要。而在众多的大数据处理框架中，「**Apache Spark**」以其独特的优势脱颖而出。

本篇文章，我们将一起走进Spark的世界，探索并理解其相关的基础概念和使用方法。本文主要目标是让初学者能够对Spark有一个全面的认识，并能实际应用到各类问题的解决之中。

### Spark是什么

学习一个东西之前先要知道这个东西是什么。

**Spark 是一个开源的大数据处理引擎，它提供了一整套开发 API，包括流计算和机器学习。它支持批处理和流处理。**

**Spark 的一个显著特点是它能够在内存中进行迭代计算，从而加快数据处理速度**。尽管 Spark 是用 Scala 开发的，但它也为 Java、Scala、Python 和 R 等高级编程语言提供了开发接口。

#### Spark组件

Spark提供了6大核心组件：

- Spark Core
- Spark SQL
- Spark Streaming
- Spark MLlib
- Spark GraphX

**Spark Core**

Spark Core 是 Spark 的基础，它提供了内存计算的能力，是分布式处理大数据集的基础。它将分布式数据抽象为弹性分布式数据集（RDD），并为运行在其上的上层组件提供 API。所有 Spark 的上层组件都建立在 Spark Core 的基础之上。

**Spark SQL**

Spark SQL 是一个用于处理结构化数据的 Spark 组件。它允许使用 SQL 语句查询数据。Spark 支持多种数据源，包括 Hive 表、Parquet 和 JSON 等。

**Spark Streaming**

Spark Streaming 是一个用于处理动态数据流的 Spark 组件。它能够开发出强大的交互和数据查询程序。**在处理动态数据流时，流数据会被分割成微小的批处理，这些微小批处理将会在 Spark Core 上按时间顺序快速执行**。

**Spark MLlib**

Spark MLlib 是 Spark 的机器学习库。它提供了常用的机器学习算法和实用程序，包括分类、回归、聚类、协同过滤、降维等。MLlib 还提供了一些底层优化原语和高层流水线 API，可以帮助开发人员更快地创建和调试机器学习流水线。

**Spark GraphX**

Spark GraphX 是 Spark 的图形计算库。它提供了一种分布式图形处理框架，可以帮助开发人员更快地构建和分析大型图形。

#### Spark的优势

Spark 有许多优势，其中一些主要优势包括：

- **速度**：Spark 基于内存计算，能够比基于磁盘的计算快很多。对于迭代式算法和交互式数据挖掘任务，这种速度优势尤为明显。
- **易用性**：Spark 支持多种语言，包括 Java、Scala、Python 和 R。它提供了丰富的内置 API，可以帮助开发人员更快地构建和运行应用程序。
- **通用性**：Spark 提供了多种组件，可以支持不同类型的计算任务，包括批处理、交互式查询、流处理、机器学习和图形处理等。
- **兼容性**：Spark 可以与多种数据源集成，包括 Hadoop 分布式文件系统（HDFS）、Apache Cassandra、Apache HBase 和 Amazon S3 等。
- **容错性**：Spark 提供了弹性分布式数据集（RDD）抽象，可以帮助开发人员更快地构建容错应用程序。

#### Word Count

上手写一个简单的代码例子，下面是一个Word Count的Spark程序：

```java
import org.apache.spark.{SparkConf, SparkContext}
object SparkWordCount {
  def main (args:Array [String]): Unit = {
    //setMaster("local[9]") 表示在本地运行 Spark 程序，使用 9 个线程。local[*] 表示使用所有可用的处理器核心。
   //这种模式通常用于本地测试和开发。
    val conf = new SparkConf ().setAppName ("Word Count").setMaster("local[9]");
    val sc = new SparkContext (conf);
    sc.setLogLevel("ERROR")
    val data = List("Hello World", "Hello Spark")
    val textFile = sc.parallelize(data)
    val wordCounts = textFile.flatMap (line => line.split (" ")).map (
      word => (word, 1)).reduceByKey ( (a, b) => a + b)
    wordCounts.collect().foreach(println)
  }
}
输出：
(Hello,2)
(World,1)
(Spark,1)
```

程序首先创建了一个 SparkConf 对象，用来设置应用程序名称和运行模式。然后，它创建了一个 SparkContext 对象，用来连接到 Spark 集群。

接下来，程序创建了一个包含两个字符串的列表，并使用 `parallelize` 方法将其转换为一个 RDD。然后，它使用 `flatMap` 方法将每一行文本拆分成单词，并使用 `map` 方法将每个单词映射为一个键值对（key-value pair），其中键是单词，值是 1。

最后，程序使用 `reduceByKey` 方法将具有相同键的键值对进行合并，并对它们的值进行求和。最终结果是一个包含每个单词及其出现次数的 RDD。程序使用 `collect` 方法将结果收集到驱动程序，并使用 `foreach` 方法打印出来。

### Spark基本概念

Spark的理论较多，为了更有效地学习Spark，首先来理解下其基本概念。

#### Application

**Application指的就是用户编写的Spark应用程序。**

如下，"Word Count"就是该应用程序的名字。

```java
import org.apache.spark.sql.SparkSession
object WordCount {
  def main(args: Array[String]) {
    // 创建 SparkSession 对象，它是 Spark Application 的入口
    val spark = SparkSession.builder.appName("Word Count").getOrCreate()
    // 读取文本文件并创建 Dataset
    val textFile = spark.read.textFile("hdfs://...")
    // 使用 flatMap 转换将文本分割为单词，并使用 reduceByKey 转换计算每个单词的数量
    val counts = textFile.flatMap(line => line.split(" "))
                 .groupByKey(identity)
                 .count()
    // 将结果保存到文本文件中
    counts.write.text("hdfs://...")
    // 停止 SparkSession
    spark.stop()
  }
}
```

#### Driver

Driver 是运行 Spark Application 的进程，它负责创建 SparkSession 和 SparkContext 对象，并将代码转换和操作。

它还负责创建逻辑和物理计划，并与集群管理器协调调度任务。

**简而言之，Spark Application 是使用 Spark API 编写的程序，而 Spark Driver 是负责运行该程序并与集群管理器协调的进程。**

**可以将Driver 理解为运行 Spark Application main 方法的进程。**

driver的内存大小可以进行设置，配置如下：

```java
# 设置 driver内存大小
driver-memory 1024m
```

#### Master & Worker

**在Spark中，Master是独立集群的控制者，而Worker是工作者。**

一个Spark独立集群需要启动一个Master和多个Worker。Worker就是物理节点，Worker上面可以启动Executor进程。

#### Executor

在每个Worker上为某应用启动的一个进程，该进程负责运行Task，并且负责将数据存在内存或者磁盘上。

每个任务都有各自独立的Executor。Executor是一个执行Task的容器。实际上它是一组计算资源(cpu核心、memory)的集合。

**一个Worker节点可以有多个Executor。一个Executor可以运行多个Task。**

Executor创建成功后，在日志文件会显示如下信息：

```java
INFO Executor: Starting executor ID [executorId] on host [executorHostname]
```

#### RDD

**RDD（Resilient Distributed Dataset）叫做弹性分布式数据集，是Spark中最基本的数据抽象，它代表一个不可变、可分区、里面的元素可并行计算的集合。**

RDD的 Partition 是指数据集的分区。它是数据集中元素的集合，这些元素被分区到集群的节点上，可以并行操作。**对于RDD来说，每个分片都会被一个计算任务处理，并决定并行计算的粒度。用户可以在创建RDD时指定RDD的分片个数，如果没有指定，那么就会采用默认值。默认值就是程序所分配到的CPU Core的数目**。

一个函数会被作用在每一个分区。Spark 中 RDD 的计算是以分片为单位的，`compute` 函数会被作用到每个分区上。

**RDD的每次转换都会生成一个新的RDD，所以RDD之间就会形成类似于流水线一样的前后依赖关系。在部分分区数据丢失时，Spark可以通过这个依赖关系重新计算丢失的分区数据，而不是对RDD的所有分区进行重新计算。**

#### Job

一个Job包含多个RDD及作用于相应RDD上的各种操作，**每个Action的触发就会生成一个job**。用户提交的Job会提交给DAG Scheduler，Job会被分解成Stage，Stage会被细化成Task。

#### Task

被发送到Executor上的工作单元。每个Task负责计算一个分区的数据。

#### Stage

在Spark 中，一个作业（Job）会被划分为多个阶段（Stage）。**同一个 Stage 可以有多个 Task 并行执行(Task 数=分区数）**。

阶段之间的划分是根据数据的依赖关系来确定的。当一个 RDD 的分区依赖于另一个 RDD 的分区时，这两个 RDD 就属于同一个阶段。当一个 RDD 的分区依赖于多个 RDD 的分区时，这些 RDD 就属于不同的阶段。

上图中，Stage表示一个可以顺滑完成的阶段。曲线表示 Shuffle 过程。

如果Stage能够复用前面的Stage的话，那么会显示灰色。

### Shuffle

在Spark 中，**Shuffle 是指在不同阶段之间重新分配数据的过程。它通常发生在需要对数据进行聚合或分组操作的时候**，例如 `reduceByKey` 或 `groupByKey` 等操作。

在Shuffle 过程中，Spark 会将数据按照键值进行分区，并将属于同一分区的数据发送到同一个计算节点上。这样，每个计算节点就可以独立地处理属于它自己分区的数据。

### Stage的划分

**Stage的划分，简单来说是以宽依赖来划分的。**

对于窄依赖，Partition 的转换处理在 Stage 中完成计算，不划分（将窄依赖尽量放在在同一个 Stage 中，可以实现流水线计算）。

对于宽依赖，由于有 Shuffle 的存在，只能在父 RDD 处理完成后，才能开始接下来的计算，也就是说需要划分 Stage。

**Spark 会根据 Shuffle/宽依赖 使用回溯算法来对 DAG 进行 Stage 划分，从后往前，遇到宽依赖就断开，遇到窄依赖就把当前的 RDD 加入到当前的 Stage 阶段中**。

至于什么是窄依赖和宽依赖，下文马上就会提及。

### 窄依赖 & 宽依赖

- 窄依赖

父RDD 的一个分区只会被子 RDD 的一个分区依赖。比如：`map`，`filter`和`union`，这种依赖称之为「**窄依赖**」。

**窄依赖的多个分区可以并行计算，并且窄依赖的一个分区的数据如果丢失只需要重新计算对应的分区的数据就可以了。**

- 宽依赖

指子RDD的分区依赖于父RDD的所有分区，称之为「**宽依赖**」。

对于宽依赖，必须等到上一阶段计算完成才能计算下一阶段。

#### DAG

有向无环图，其实说白了就是RDD之间的依赖关系图。

- **开始**：通过 SparkContext 创建的 RDD。
- **结束**：触发 Action，一旦触发 Action 就形成了一个完整的 DAG（**有几个 Action，就有几个 DAG**）。

### Spark执行流程

Spark的执行流程大致如下：

**1、** 构建SparkApplication的运行环境（启动SparkContext），SparkContext向资源管理器（可以是Standalone、Mesos或YARN）注册并申请运行Executor资源；

**2、** 资源管理器为Executor分配资源并启动Executor进程，Executor运行情况将随着“心跳”发送到资源管理器上；

**3、** SparkContext构建DAG图，将DAG图分解成多个Stage，并把每个Stage的TaskSet（任务集）发送给TaskScheduler(任务调度器）；

**4、** Executor向SparkContext申请Task，TaskScheduler将Task发放给Executor，同时，SparkContext将应用程序代码发放给Executor；

**5、** Task在Executor上运行，把执行结果反馈给TaskScheduler，然后再反馈给DAGScheduler；

**6、** 当一个阶段完成后，Spark会根据数据依赖关系将结果传输给下一个阶段，并开始执行下一个阶段的任务；

**7、** 最后，当所有阶段都完成后，Spark会将最终结果返回给驱动程序，并完成作业的执行；

### Spark运行模式

Spark 支持多种运行模式，包括本地模式、独立模式、Mesos 模式、YARN 模式和 Kubernetes 模式。

- **本地模式**：在本地模式下，Spark 应用程序会在单个机器上运行，不需要连接到集群。这种模式适用于开发和测试，但不适用于生产环境。
- **独立模式**：在独立模式下，Spark 应用程序会连接到一个独立的 Spark 集群，并在集群中运行。这种模式适用于小型集群，但不支持动态资源分配。
- **Mesos 模式**：在 Mesos 模式下，Spark 应用程序会连接到一个 Apache Mesos 集群，并在集群中运行。这种模式支持动态资源分配和细粒度资源共享，目前国内使用较少。
- **YARN 模式**：在 YARN 模式下，Spark 应用程序会连接到一个 Apache Hadoop YARN 集群，并在集群中运行。这种模式支持动态资源分配和与其他 Hadoop 生态系统组件的集成，Spark在Yarn模式下是不需要Master和Worker的。
- **Kubernetes 模式**：在 Kubernetes 模式下，Spark 应用程序会连接到一个 Kubernetes 集群，并在集群中运行。这种模式支持动态资源分配和容器化部署。

### RDD详解

RDD的概念在Spark中十分重要，上面只是简单的介绍了一下，下面详细的对RDD展开介绍。

RDD是“Resilient Distributed Dataset”的缩写，从全称就可以了解到RDD的一些典型特性：

- **Resilient（弹性）**：RDD之间会形成有向无环图（DAG），如果RDD丢失了或者失效了，可以从父RDD重新计算得到。即容错性。
- **Distributed（分布式）**：RDD的数据是以逻辑分区的形式分布在集群的不同节点的。
- **Dataset（数据集）**：即RDD存储的数据记录，可以从外部数据生成RDD，例如Json文件，CSV文件，文本文件，数据库等。

RDD里面的数据集会被逻辑分成若干个分区，这些分区是分布在集群的不同节点的，基于这样的特性，RDD才能在集群不同节点并行计算。

#### RDD特性

- **内存计算**：Spark RDD运算数据是在内存中进行的，在内存足够的情况下，不会把中间结果存储在磁盘，所以计算速度非常高效。
- **惰性求值**：所有的转换操作都是惰性的，也就是说不会立即执行任务，只是把对数据的转换操作记录下来而已。只有碰到action操作才会被真正的执行。
- **容错性**：Spark RDD具备容错特性，在RDD失效或者数据丢失的时候，可以根据DAG从父RDD重新把数据集计算出来，以达到数据容错的效果。
- **不变性**：RDD是进程安全的，因为RDD是不可修改的。它可以在任何时间点被创建和查询，使得缓存，共享，备份都非常简单。在计算过程中，是RDD的不可修改特性保证了数据的一致性。
- **持久化**：可以调用cache或者persist函数，把RDD缓存在内存、磁盘，下次使用的时候不需要重新计算而是直接使用。

#### RDD操作

RDD支持两种操作：

- 转换操作（Transformation）。
- 行动操作（Actions）。

### 转换操作（Transformation）

转换操作以RDD做为输入参数，然后输出一个或者多个RDD。转换操作不会修改输入RDD。`Map()`、`Filter()`这些都属于转换操作。

转换操作是惰性求值操作，只有在碰到行动操作（Actions）的时候，转换操作才会真正实行。转换操作分两种：「**窄依赖**」和「**宽依赖**」。

下面是一些常见的转换操作：

转换操作
描述

map
将函数应用于 RDD 中的每个元素，并返回一个新的 RDD

filter
返回一个新的 RDD，其中包含满足给定谓词的元素

flatMap
将函数应用于 RDD 中的每个元素，并将返回的迭代器展平为一个新的 RDD

union
返回一个新的 RDD，其中包含两个 RDD 的元素

distinct
返回一个新的 RDD，其中包含原始 RDD 中不同的元素

groupByKey
将键值对 RDD 中具有相同键的元素分组到一起，并返回一个新的 RDD

reduceByKey
将键值对 RDD 中具有相同键的元素聚合到一起，并返回一个新的 RDD

sortByKey
返回一个新的键值对 RDD，其中元素按照键排序

### 行动操作（Action）

Action是数据执行部分，其通过执行`count`，`reduce`，`collect`等方法真正执行数据的计算部分。

Action 操作
描述

reduce
通过函数聚合 RDD 中的所有元素

collect
将 RDD 中的所有元素返回到驱动程序

count
返回 RDD 中的元素个数

first
返回 RDD 中的第一个元素

take
返回 RDD 中的前 n 个元素

takeOrdered
返回 RDD 中的前 n 个元素，按照自然顺序或指定的顺序排序

saveAsTextFile
将 RDD 中的元素保存到文本文件中

foreach
将函数应用于 RDD 中的每个元素

#### RDD 的创建方式

创建RDD有3种不同方式：

- 从外部存储系统。
- 从其他RDD。
- 由一个已经存在的 Scala 集合创建。

### 从外部存储系统

**由外部存储系统的数据集创建，包括本地的文件系统，还有所有 Hadoop 支持的数据集，比如 HDFS、Cassandra、HBase 等：**

```java
val rdd1 = sc.textFile("hdfs://node1:8020/wordcount/input/words.txt")
```

### 从其他RDD

**通过已有的 RDD 经过算子转换生成新的 RDD：**

```java
val rdd2=rdd1.flatMap(_.split(" "))
```

### 由一个已经存在的 Scala 集合创建

```java
val rdd3 = sc.parallelize(Array(1,2,3,4,5,6,7,8))
或者
val rdd4 = sc.makeRDD(List(1,2,3,4,5,6,7,8))
```

其实`makeRDD` 方法底层调用了`parallelize` 方法：

#### RDD 缓存机制

RDD缓存是在内存存储RDD计算结果的一种优化技术。把中间结果缓存起来以便在需要的时候重复使用，这样才能有效减轻计算压力，提升运算性能。

要持久化一个RDD，只要调用其`cache()`或者`persist()`方法即可。在该RDD第一次被计算出来时，就会直接缓存在每个节点中。而且Spark的持久化机制还是自动容错的，如果持久化的RDD的任何partition丢失了，那么Spark会自动通过其源RDD，使用transformation操作重新计算该partition。

```java
val rdd1 = sc.textFile("hdfs://node01:8020/words.txt")
val rdd2 = rdd1.flatMap(x=>x.split(" ")).map((_,1)).reduceByKey(_+_)
rdd2.cache //缓存/持久化
rdd2.sortBy(_._2,false).collect//触发action,会去读取HDFS的文件,rdd2会真正执行持久化
rdd2.sortBy(_._2,false).collect//触发action,会去读缓存中的数据,执行速度会比之前快,因为rdd2已经持久化到内存中了
```

**需要注意的是，在触发action的时候，才会去执行持久化。**

`cache()`和`persist()`的区别在于，`cache()`是`persist()`的一种简化方式，`cache()`的底层就是调用的`persist()`的无参版本，就是调用`persist(MEMORY_ONLY)`，将数据持久化到内存中。

如果需要从内存中去除缓存，那么可以使用`unpersist()`方法。

```java
rdd.persist(StorageLevel.MEMORY_ONLY)
rdd.unpersist()
```

### 存储级别

RDD存储级别主要有以下几种。

级别
使用空间
CPU时间
是否在内存中
是否在磁盘上
备注

MEMORY_ONLY
高
低
是
否
使用未序列化的Java对象格式，将数据保存在内存中。如果内存不够存放所有的数据，则数据可能就不会进行持久化。

MEMORY_ONLY_2
高
低
是
否
数据存2份

MEMORY_ONLY_SER
低
高
是
否
基本含义同MEMORY_ONLY。唯一的区别是，会将RDD中的数据进行序列化。这种方式更加节省内存

MEMORY_ONLY_SER_2
低
高
是
否
数据序列化，数据存2份

MEMORY_AND_DISK
高
中等
部分
部分
如果数据在内存中放不下，则溢写到磁盘

MEMORY_AND_DISK_2
高
中等
部分
部分
数据存2份

MEMORY_AND_DISK_SER
低
高
部分
部分
基本含义同MEMORY_AND_DISK。唯一的区别是，会将RDD中的数据进行序列化

MEMORY_AND_DISK_SER_2
低
高
部分
部分
数据存2份

DISK_ONLY
低
高
否
是
使用未序列化的Java对象格式，将数据全部写入磁盘文件中。

DISK_ONLY_2
低
高
否
是
数据存2份

OFF_HEAP

这个目前是试验型选项，类似MEMORY_ONLY_SER，但是数据是存储在堆外内存的。

**对于上述任意一种持久化策略，如果加上后缀_2，代表的是将每个持久化的数据，都复制一份副本，并将副本保存到其他节点上。**

这种基于副本的持久化机制主要用于进行容错。假如某个节点挂掉了，节点的内存或磁盘中的持久化数据丢失了，那么后续对RDD计算时还可以使用该数据在其他节点上的副本。如果没有副本的话，就只能将这些数据从源头处重新计算一遍了。

#### RDD的血缘关系

**血缘关系是指 RDD 之间的依赖关系。当你对一个 RDD 执行转换操作时，Spark 会生成一个新的 RDD，并记录这两个 RDD 之间的依赖关系。这种依赖关系就是血缘关系。**

血缘关系可以帮助 Spark 在发生故障时恢复数据。当一个分区丢失时，Spark 可以根据血缘关系重新计算丢失的分区，而不需要从头开始重新计算整个 RDD。

血缘关系还可以帮助 Spark 优化计算过程。Spark 可以根据血缘关系合并多个连续的窄依赖转换，减少数据传输和通信开销。

我们可以执行`toDebugString`打印RDD的依赖关系。

下面是一个简单的例子：

```java
val conf = new SparkConf().setAppName("Lineage Example").setMaster("local")
val sc = new SparkContext(conf)
val data = sc.parallelize(List(1, 2, 3, 4, 5))
val mappedData = data.map(x => x + 1)
val filteredData = mappedData.filter(x => x % 2 == 0)
println(filteredData.toDebugString)
```

在这个例子中，我们首先创建了一个包含 5 个元素的 RDD，并对它执行了两个转换操作：`map` 和 `filter`。然后，我们使用 `toDebugString` 方法打印了最终 RDD 的血缘关系。

运行这段代码后，你会看到类似下面的输出：

```java
(2) MapPartitionsRDD[2] at filter at <console>:26 []
 |  MapPartitionsRDD[1] at map at <console>:24 []
 |  ParallelCollectionRDD[0] at parallelize at <console>:22 []
```

这个输出表示最终的 RDD 是通过两个转换操作（`map` 和 `filter`）从原始的 `ParallelCollectionRDD` 转换而来的。

### CheckPoint

CheckPoint可以将RDD从其依赖关系中抽出来，保存到可靠的存储系统（例如HDFS，S3等)， 即它可以将数据和元数据保存到检查指向目录中。 因此，在程序发生崩溃的时候，Spark可以恢复此数据，并从停止的任何地方开始。

CheckPoint分为两类：

- **高可用CheckPoint**：容错性优先。这种类型的检查点可确保数据永久存储，如存储在HDFS或其他分布式文件系统上。 这也意味着数据通常会在网络中复制，这会降低检查点的运行速度。
- **本地CheckPoint**：性能优先。 RDD持久保存到执行程序中的本地文件系统。 因此，数据写得更快，但本地文件系统也不是完全可靠的，一旦数据丢失，工作将无法恢复。

开发人员可以使用`RDD.checkpoint()`方法来设置检查点。在使用检查点之前，必须使用`SparkContext.setCheckpointDir(directory: String)`方法设置检查点目录。

下面是一个简单的例子：

```java
import org.apache.spark.{SparkConf, SparkContext}
object CheckpointExample {
  def main(args: Array[String]): Unit = {
    val conf = new SparkConf().setAppName("Checkpoint Example").setMaster("local")
    val sc = new SparkContext(conf)
    // 设置 checkpoint 目录
    sc.setCheckpointDir("/tmp/checkpoint")
    val data = sc.parallelize(List(1, 2, 3, 4, 5))
    val mappedData = data.map(x => x + 1)
    val filteredData = mappedData.filter(x => x % 2 == 0)
    // 对 RDD 进行 checkpoint
    filteredData.checkpoint()
    // 触发 checkpoint
    filteredData.count()
  }
}
```

RDD的检查点机制就好比Hadoop将中间计算值存储到磁盘，即使计算中出现了故障，我们也可以轻松地从中恢复。通过对 RDD 启动检查点机制可以实现容错和高可用。

#### Persist VS CheckPoint

- **位置**：Persist 和 Cache 只能保存在本地的磁盘和内存中(或者堆外内存–实验中)，而 Checkpoint 可以保存数据到 HDFS 这类可靠的存储上。
- **生命周期**：Cache 和 Persist 的 RDD 会在程序结束后会被清除或者手动调用 unpersist 方法，而 Checkpoint 的 RDD 在程序结束后依然存在，不会被删除**。CheckPoint将RDD持久化到HDFS或本地文件夹，如果不被手动remove掉，是一直存在的，也就是说可以被下一个driver使用，而Persist不能被其他dirver使用**。

###
