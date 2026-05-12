# 16、Spark 教程 - Spark面试热门考点
- 来源：https://ddkk.com/zhuanlan/bigdata/spark/2/16.html
- 分类：大数据框架
- 分组：教程目录
### 1. SparkCore

#### 1.1 Hadoop与Spark框架的对比

#### 1.2 Spark核心模块

**Spark Core**

Spark Core中提供了Spark最基础与最核心的功能，Spark其他的功能如：Spark SQL，Spark Streaming，GraphX, MLlib都是在Spark Core的基础上进行扩展的

**Spark****SQL**

Spark SQL是Spark用来操作结构化数据的组件。通过Spark SQL，用户可以使用SQL或者Apache Hive版本的SQL方言（HQL）来查询数据。

**Spark Streaming**

Spark Streaming是Spark平台上针对实时数据进行流式计算的组件，提供了丰富的处理数据流的API。

**Spark MLlib**

MLlib是Spark提供的一个机器学习算法库。MLlib不仅提供了模型评估、数据导入等额外的功能，还提供了一些更底层的机器学习原语。

**Spark GraphX**

GraphX是Spark面向图计算提供的框架与算法库。

#### 1.3 简述Spark的架构

**1、** 3.1运行架构；

Spark框架的核心是一个计算引擎，整体来说，它采用了标准 master-slave 的结构。

如下图所示，它展示了一个 Spark执行时的基本结构。图形中的Driver表示master，负责管理整个集群中的作业任务调度。图形中的Executor 则是 slave，负责实际执行任务。

**1、** 3.2核心组件；

1）Driver

Spark驱动器节点，用于执行Spark任务中的main方法，负责实际代码的执行工作。

Driver在Spark作业执行时主要负责：

将用户程序转化为作业（job）

在Executor之间调度任务(task)

跟踪Executor的执行情况

通过UI展示查询运行情况

2）Executor

Spark Executor是集群中工作节点（Worker）中的一个JVM进程，负责在 Spark 作业中运行具体任务（Task），任务彼此之间相互独立。Spark 应用启动时，Executor节点被同时启动，并且始终伴随着整个 Spark 应用的生命周期而存在。如果有Executor节点发生了故障或崩溃，Spark 应用也可以继续执行，会将出错节点上的任务调度到其他Executor节点上继续运行。

Executor有两个核心功能：

负责运行组成Spark应用的任务，并将结果返回给驱动器进程

它们通过自身的块管理器（Block Manager）为用户程序中要求缓存的 RDD 提供内存式存储。RDD 是直接缓存在Executor进程内的，因此任务可以在运行时充分利用缓存数据加速运算。

#### 1.4 Spark作业提交流程

**Yarn Cluster模式**

Cluster模式将用于监控和调度的Driver模块启动在Yarn集群资源中执行。一般应用于实际生产环境。

- 在YARN Cluster模式下，任务提交后会和ResourceManager通讯申请启动ApplicationMaster，
- 随后ResourceManager分配container，在合适的NodeManager上启动ApplicationMaster，此时的ApplicationMaster就是Driver。
- Driver启动后向ResourceManager申请Executor内存，ResourceManager接到ApplicationMaster的资源申请后会分配container，然后在合适的NodeManager上启动Executor进程
- Executor进程启动后会向Driver反向注册，Executor全部注册完成后Driver开始执行main函数，
- 之后执行到Action算子时，触发一个Job，并根据宽依赖开始划分stage，每个stage生成对应的TaskSet，之后将task分发到各个Executor上执行。

**Spark提交作业参数**

- executor-cores —— 每个executor使用的内核数，默认为1
- num-executors —— 启动executors的数量，默认为2
- executor-memory —— executor内存大小，默认1G
- driver-cores —— driver使用内核数，默认为1
- driver-memory —— driver内存大小，默认512M

#### 1.5 Spark核心编程

### 1.5.1 RDD概念

RDD（Resilient Distributed Dataset）叫做弹性分布式数据集，是Spark中最基本的数据处理模型。代码中是一个抽象类，它代表一个弹性的、不可变、可分区、里面的元素可并行计算的集合。

- 弹性

-存储的弹性：内存与磁盘的自动切换；

-容错的弹性：数据丢失可以自动恢复；

-计算的弹性：计算出错重试机制；

-分片的弹性：可根据需要重新分片。

- 分布式：数据存储在大数据集群不同节点上
- 数据集：RDD封装了计算逻辑，并不保存数据
- 数据抽象：RDD是一个抽象类，需要子类具体实现
- 不可变：RDD封装了计算逻辑，是不可以改变的，想要改变，只能产生新的RDD，在新的RDD里面封装计算逻辑
- 可分区、并行计算

### 1.5.2 RDD 五大属性

### 1.5.3 Spark的transformation算子（不少于8个）（重点）

***单value***

（1）map（2）mapPartitions（3）mapPartitionsWithIndex（4）flatMap

（5）glom（6）groupBy（7）filter（8）sample（9）distinct

（10）coalesce（11）repartition（12）sortBy（13）pipe

***双value***

（1）intersection（2）union（3）subtract（4）zip

***Key-Value***

（1）partitionBy （2）reduceByKey （3）groupByKey （4）aggregateByKey

（5）foldByKey （6）combineByKey （7）sortByKey （8）mapValues

（9）join （10）cogroup

### 1.5.4 Spark的action算子（不少于6个）（重点）

（1）reduce（2）collect（3）count（4）first

（5）take（6）takeOrdered（7）aggregate（8）fold

（9）countByKey（10）save（11）foreach

### 1.5.5 map与mapPartition区别

（1）map：每次处理一条数据

（2）mapPartitions：每次处理一个分区数据

### 1.5.5 Repartition和Coalesce区别

1）关系

两者都是用来改变RDD的partition数量的，repartition底层调用的就是coalesce方法：coalesce(numPartitions, shuffle = true)

2）区别

repartition一定会发生shuffle，coalesce根据传入的参数来判断是否发生shuffle

一般情况下增大rdd的partition数量使用repartition，减少partition数量时使用coalesce

### 1.5.6 reduceByKey与groupByKey的区别

reduceByKey：具有预聚合操作

groupByKey：没有预聚合

在不影响业务逻辑的前提下，优先采用reduceByKey。

*从shuffle的角度*：reduceByKey和groupByKey都存在shuffle的操作，但是reduceByKey可以在shuffle前对分区内相同key的数据进行预聚合（combine）功能，这样会减少落盘的数据量，而groupByKey只是进行分组，不存在数据量减少的问题，reduceByKey性能比较高。

*从功能的角度*：reduceByKey其实包含分组和聚合的功能。groupByKey只能分组，不能聚合，所以在分组聚合的场合下，推荐使用reduceByKey，如果仅仅是分组而不需要聚合。那么还是只能使用groupByKey

### 1.5.7 reduceByKey、foldByKey、aggregateByKey、combineByKey区别

ReduceByKey 没有初始值 分区内和分区间逻辑相同

foldByKey 有初始值 分区内和分区间逻辑相同

aggregateByKey 有初始值 分区内和分区间逻辑可以不同

combineByKey 初始值可以变化结构 分区内和分区间逻辑不同

### 1.5.8 Kryo序列化

Kryo序列化比Java序列化更快更紧凑，但Spark默认的序列化是Java序列化并不是Spark序列化，因为Spark并不支持所有序列化类型，而且每次使用都必须进行注册。注册只针对于RDD。在DataFrames和DataSet当中自动实现了Kryo序列化。

### 1.5.9 Spark中的血缘（笔试重点）

1）RDD的血缘关系

RDD的Lineage会记录RDD的元数据信息和转换行为，当该RDD的部分分区数据丢失时，它可以根据这些信息来重新运算和恢复丢失的数据分区。

2）宽依赖与窄依赖

宽依赖表示同一个父（上游）RDD的Partition被多个子（下游）RDD的Partition依赖，会引起Shuffle，总结：宽依赖我们形象的比喻为多生。

窄依赖表示每一个父(上游)RDD的Partition最多被子（下游）RDD的一个Partition使用，窄依赖我们形象的比喻为独生子女。

宽依赖和窄依赖。有Shuffle的是宽依赖。

#### 1.6 Spark任务的划分

（1）Application：初始化一个SparkContext即生成一个Application；

（2）Job：一个Action算子就会生成一个Job；

（3）Stage：Stage等于宽依赖的个数加1；

（4）Task：一个Stage阶段中，最后一个RDD的分区个数就是Task的个数。

#### 1.7 RDD持久化

1）RDD Cache缓存

RDD通过Cache将前面的计算结果缓存，默认情况下缓存在JVM堆内存中，是在触发后面的action算子后开始缓存。

2）RDD CheckPoint检查点

所谓的检查点其实就是通过将RDD中间结果写入磁盘，在中间阶段做检查的容错。

cache 不改变血缘依赖 数据存储在 内存 或者磁盘 checkpoint 改变血缘依赖 数据存储在 第三方数据库 HDFS redis

#### 1.8 Spark累加器

累加器：分布式共享只写变量。（Executor和Executor之间不能读数据）

累加器用来把Executor端变量信息聚合到Driver端。在Driver程序中定义的变量，在Executor端的每个Task都会得到这个变量的一份新的副本，每个task更新这些副本的值后，传回Driver端进行merge，从未实现累加。

#### 1.9 Spark广播变量

分布式共享只读变量

广播变量用来高效分发较大的对象。向所有工作节点发送一个较大的只读值，以供一个或多个Spark操作使用。比如，如果你的应用需要向所有节点发送一个较大的只读查询表，广播变量用起来都很顺手。在多个并行操作中使用同一个变量，但是 Spark会为每个任务分别发送。

### 2. SparkSQL

#### 2.1 RDD、DataFrame、DataSet三者的关系

### 2.1.1 三者的共性

- RDD、DataFrame、DataSet全都是spark平台下的分布式弹性数据集，为处理超大型数据提供便利;
- 三者都有惰性机制，在进行创建、转换，如map方法时，不会立即执行，只有在遇到Action如foreach时，三者才会开始遍历运算;
- 三者有许多共同的函数，如filter，排序等;
- 在对DataFrame和Dataset进行操作许多操作都需要这个包:import spark.implicits._（在创建好SparkSession对象后尽量直接导入）
- 三者都会根据 Spark 的内存情况自动缓存运算，这样即使数据量很大，也不用担心会内存溢出
- 三者都有partition的概念
- DataFrame和DataSet均可使用模式匹配获取各个字段的值和类型

### 2.1.2 三者的区别

**1、** RDD；

- RDD一般和spark mllib同时使用
- RDD不支持sparksql操作

**1、** DataFrame；

- 与RDD和Dataset不同，DataFrame每一行的类型固定为Row，每一列的值没法直接访问，只有通过解析才能获取各个字段的值
- DataFrame与DataSet一般不与 spark mllib 同时使用
- DataFrame与DataSet均支持 SparkSQL 的操作，比如select，groupby之类，还能注册临时表/视窗，进行 sql 语句操作
- DataFrame与DataSet支持一些特别方便的保存方式，比如保存成csv，可以带上表头，这样每一列的字段名一目了然(后面专门讲解)

**1、** DataSet；

- Dataset和DataFrame拥有完全相同的成员函数，区别只是每一行的数据类型不同。DataFrame其实就是DataSet的一个特例 type DataFrame = Dataset[Row]
- DataFrame也可以叫Dataset[Row],每一行的类型是Row，不解析，每一行究竟有哪些字段，各个字段又是什么类型都无从得知，只能用上面提到的getAS方法或者共性中的第七条提到的模式匹配拿出特定字段。而Dataset中，每一行是什么类型是不一定的，在自定义了case class之后可以很自由的获得每一行的信息

### 2.1.3 三者的转换

#### 2.2 当Spark涉及到数据库的操作时，如何减少Spark运行中的数据库连接数？

使用foreachPartition代替foreach，在foreachPartition内获取数据库的连接。

#### 2.3 如何使用Spark实现TopN的获取（描述思路或使用伪代码）（重点）

**方法一**

（1）按照key对数据进行聚合（groupByKey）

（2）将value转换为数组，利用scala的sortBy或者sortWith进行排序（mapValues）数据量太大，会OOM。

**方法二**

（1）取出所有的key

（2）对key进行迭代，每次取出一个key利用spark的排序算子进行排序

**方法三**

（1）自定义分区器，按照key进行分区，使不同的key进到不同的分区

（2）对每个分区运用spark的排序算子进行排序

#### 2.4 hive on spark与spark on hive的对比

元数据存储
语法
执行引擎

hive on spark
mysql
hql
rdd

spark on hive
mysql
spark sql
df / ds

(spark on hive生态不太完善 元数据管理 atlas 权限管理 （ranger）)

### 3. SparkStreaming

#### 3.1 SparkStreaming是纯流式处理框架吗？他的抽象是谁？

微批处理

DStream：就是对RDD在实时数据处理场景的一种封装。在DStream内部，每个时间区间收到的数据都作为RDD存在，而DStream是由这些RDD所组成的序列（因此得名“离散化”)。

#### 3.2 背压机制原理

根据处理能力动态的拉取数据

根据JobScheduler反馈作业的执行信息来动态调整Receiver数据接收率。

#### 3.3 Receiver和Direct模式原理

有接待无接待

ReceiverAPI:需要一个专门的Executor去接收数据，然后发送给其他的Executor做计算。offset默认存储在zookeeper中。

DirectAPI:是由计算的Executor来主动消费Kafka的数据，速度由自身控制。offset默认存储在系统主题 _consumer_offset

#### 3.4 kafka的offset维护在什么位置（ 0.10）

维护在系统主题 _consumer_offset

#### 3.5 transform算子里面的代码都在什么端执行

调用真正的算子时，才会在Executor端执行，不然还是在Driver端运行（比较特殊）

通过Transform可以将DStream每一批次的数据直接转换为RDD的算子操作。

#### 3.6 UpdateStateByKey状态保存在什么位置？ 有什么缺点

使用updateStateByKey需要对检查点目录进行配置，会使用检查点来保存状态。

缺点：1）每个检查点记录一条数据，会产生大量小文件。

2）一旦挂掉重启，会把这段时间的数据一次性灌入内存中，会导致spark挂掉

#### 3.7 window有三个概念 用wordcount案例画图说明

- 微批大小
- 窗口时长：计算内容的时间范围；
- 滑动步长：隔多久触发一次计算。注意：这两者都必须为采集批次大小的整数倍。

#### 3.8 SparkStreaming实现Exactly Once

**方法一: 使用事务**

实现Exactly Once语义的关键是保证处理消息和提交偏移量的原子性. 所以只要把这两个操作放到一个事务里, 不管是先处理消息和还是先提交偏移量都可以保证消息不丢失和不重复。

实现：比如手动维护消费消息的偏移量, 并把偏移量放到MySQL中, 然后数据的落盘也放到MySQL中, 而MySQL是支持事务的, 那么我们就可以保证着两个操作的原子性了.

缺点:

- 对存储层有依赖, 只能使用支持事务的存储层
- 事务性能不高
- 并且一个存储层容易存在单点故障压力过大, 如果做分布式又需要做分布式事务增加了复杂性

**方法二: 手动提交偏移量 + 幂等性**

先确保真正处理完数据后再提交偏移量, 但是可能提交偏移量失败, 导致重复消费了, 这时就要做数据的幂等性保存了, 即数据无论被保存多少次效果都是一样的, 不会存在重复数据。

#### 3.9 Flink跟Spark Streaming的区别

**Flink****是标准的实时处理引擎，基于事件驱动。而****Spark Streaming****是微批（Micro-Batch）的模型**。

下面我们就分几个方面介绍两个框架的主要区别：（**佳人试错**）

（1）**架**构模型

Spark Streaming 在运行时的主要角色包括：Master、Worker、Driver、Executor，

Flink 在运行时主要包含：Jobmanager、Taskmanager和Slot。

（2）**任**务调度

Spark Streaming 连续不断的生成微小的数据批次，构建有向无环图DAG，Spark Streaming 会依次创建 DStreamGraph、JobGenerator、JobScheduler。

Flink 根据用户提交的代码生成 StreamGraph，经过优化生成 JobGraph，然后提交给 JobManager进行处理，JobManager 会根据 JobGraph 生成 ExecutionGraph，ExecutionGraph 是 Flink 调度最核心的数据结构，JobManager 根据 ExecutionGraph 对 Job 进行调度。

（3）**时**间机制

Spark Streaming 支持的时间机制有限，只支持处理时间。

Flink 支持了流处理程序在时间上的三个定义：处理时间、事件时间、注入时间。同时也支持 watermark 机制来处理滞后数据。

（4）容**错**机制

对于Spark Streaming 任务，我们可以设置 checkpoint，然后假如发生故障并重启，我们可以从上次 checkpoint 之处恢复，但是这个行为只能使得数据不丢失，可能会重复处理，不能做到恰好一次处理语义。

Flink 则使用两阶段提交协议来解决这个问题。

### 4. Spark内核

#### 4.1 YarnCluster模式提交流程

#### 4.2 Spark通讯架构

#### 4.3 Stage任务划分

#### 4.4 Task任务调度执行

### 5. hive on spark优化

#### 5.1 数据倾斜

### 5.1.1 数据倾斜产生原因

以Spark和Hive的使用场景为例，他们在做数据运算的时候会涉及到，count distinct、group by、join on等操作，这些都会触发Shuffle动作。一旦触发Shuffle，所有相同key的值就会被拉到一个或几个Reducer节点上，容易发生单点计算问题，导致数据倾斜。

一般来说，数据倾斜原因有以下几方面：

- key分布不均匀
- null值的处理
- 业务数据量太大

### 5.1.2 数据倾斜表现

**1）hadoop中的数据倾斜表现：**

- 有一个多几个Reduce卡住，卡在99.99%，一直不能结束。
- 各种container报错OOM
- 异常的Reducer读写的数据量极大，至少远远超过其它正常的Reducer
- 伴随着数据倾斜，会出现任务被kill等各种诡异的表现。

**2）hive中的数据倾斜**

- 一般都发生在Sql中group by和join on上，而且和数据逻辑绑定比较深。

**3）spark中的数据倾斜**

Spark中的数据倾斜，包括Spark Streaming和Spark Sql，表现主要有下面几种：

- Executor lost，OOM，Shuffle过程出错；
- Driver OOM；
- 单个Executor执行时间特别久，整体任务卡在某个阶段不能结束；
- 正常运行的任务突然失败；

### 5.1.3 数据倾斜解决思路

很多数据倾斜的问题，都可以用和平台无关的方式解决，比如更好的**数据预处理**，**异常值的过滤**等。

1）业务逻辑

我们从业务逻辑的层面上来优化数据倾斜，比如两个城市做推广活动导致那两个城市数据量激增的例子，我们可以单独对这两个城市来做count，单独做时可用两次MR，第一次打散计算，第二次再最终聚合计算。完成后和其它城市做整合。

2）程序层面

比如说在Hive中，经常遇到count(distinct)操作，这样会导致最终只有一个Reduce任务。我们可以先group by，再在外面包一层count，就可以了。

3）调参方面

Hadoop和Spark都自带了很多的参数和机制来调节数据倾斜，合理利用它们就能解决大部分问题。

4）从业务和数据上解决数据倾斜

- 有损的方法：找到异常数据，比如ip为0的数据，过滤掉
- 无损的方法：对分布不均匀的数据，单独计算
- 先对key做一层hash，先将数据随机打散让它的并行度变大，再汇集
- 数据预处理

#### 5.2 小文件

（1）Combinehiveinputformat => combinetextinputformat

将多个文件放到一起统一切片，减少了maptask的个数，进而减少了集群内存 （2）JVM重用 =》 mr中 jvm重用 道理一致 本周减少JVM开关的时间 （3）merge 如果MapOnly 任务默认打开，如果是mr任务需要手动打开。单独开启一个mr，将小于16m的文件合并到256m

#### 5.3 CBO

CBO是指Cost based Optimizer，即基于计算成本的优化。

在Hive中，计算成本模型考虑到了：数据的行数、CPU、本地IO、HDFS IO、网络IO等方面。Hive会计算同一SQL语句的不同执行计划的计算成本，并选出成本最低的执行计划。目前CBO在hive中主要用于join的优化，例如多表join的join顺序。

相关参数为：

```java
--是否启用cbo优化 
set hive.cbo.enable=true;
```

CBO优化也会完成一部分的谓词下推优化工作，因为在执行计划中，谓词越靠前，整个计划的计算成本就会越低

#### 5.4 谓词下推

思想：将过滤表达式尽可能移动至靠近数据源的位置，以使真正执行时能直接跳过无关的数据。简单来说：就是通过将一些过滤条件尽可能的在最底层执行可以减少每一层交互的数据量，从而提升性能。

Hive中的Predicate Pushdown简称谓词下推，简而言之，就是在不影响结果的情况下，尽量将过滤条件提前执行。谓词下推后，过滤条件在map端执行，减少了map端的输出，降低了数据在集群上传输的量，节约了集群的资源，也提升了任务的性能。

```java
 具体配置项是hive.optimize.ppd，默认为true，即开启谓词下推
```
