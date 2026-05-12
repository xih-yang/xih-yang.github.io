# 04、Spark深入解析、SparkCore之RDD概述
- 来源：https://ddkk.com/zhuanlan/bigdata/spark/1/4.html
- 分类：大数据框架
- 分组：教程目录
## 什么是RDD

RDD（Resilient Distributed Dataset）叫做`弹性分布式数据集，是Spark中最基本的数据抽象。代码中是一个抽象类，它代表一个不可变、可分区、里面的元素可并行计算的集合`。

**弹性分布式数据集（保存在内存中）**

- 弹性：RDD中的数据可以保存在内存中或者磁盘里面。
- 分布式：分布式存储的，可以用于分布式计算。
- 数据集：一个几个，可以存放很多元素

**为什么要有RDD**

`在许多迭代式算法(比如机器学习、图算法等)和交互式数据挖掘中，不同计算阶段之间会重用中间结果，即一个阶段的输出结果会作为下一个阶段的输入`。但是，之前的MapReduce框架采用非循环式的数据流模型，把中间结果写入到HDFS中，带来了大量的数据复制、磁盘IO和序列化开销。且这些框架只能支持一些特定的计算模式(map/reduce)，并没有提供一种通用的数据抽象。

AMP实验室发表的一篇关于RDD的论文:《Resilient Distributed Datasets: A Fault-Tolerant Abstraction for In-Memory Cluster Computing》就是为了解决这些问题的

`RDD提供了一个抽象的数据模型`，让我们不必担心底层数据的分布式特性，`只需将具体的应用逻辑表达为一系列转换操作(函数)`，不同RDD之间的转换操作之间还可以形成依赖关系，进而实现管道化，从而避免了中间结果的存储，大大降低了数据复制、磁盘IO和序列化开销，并且还提供了更多的API(map/reduec/filter/groupBy…)

## RDD的主要属性

**1、A list of partitions**

- 数据集的基本组成单位，一组分区或分片
- 每个分片（分区）都会被一个计算任务处理，分片数决定并行度（与Kafka相同）
- **用户可以在创建RDD时指定RDD的分片个数，如果没有指定，那么就会采用默认值（默认值为2）**

**2、A function for computing each split**

- 一个函数会被作用在每一个分区/分片
- Spark中RDD的计算是以分区为单位的，compute函数会被作用到每个分区上

**3、A list of dependencies on other RDDs**

- 一个RDD会依赖于其他多个RDD
- RDD的每次转换都会生成一个新的RDD
- RDD之间会形成类似于流水线（血缘/血统）一样的前后依赖关系
- 部分分区数据丢失时，Spark可以通过依赖关系重新计算丢失的分区数据，而不需要对RDD的所有分区进行重新计算（Spark的容错机制）

**4、Optionally, a Partitioner for key-value RDDs (e.g. to say that the RDD is hash-partitioned)**

- Spark中的分区函数，一个是基于哈希的（HashPartitioner），另外一个是基于范围的（RangePartitioner）。
- 对于KV类型的RDD会有一个Partitioner函数，即RDD的分区函数（可选项）
- 只有对于key-value的RDD，才会有Partitioner。
- 非key-value的RDD的，Partitioner的值是None。
- Partitioner函数决定了RDD本身的分区数量，也决定了parent RDD Shuffle 输出时的分区数量

**5、Optionally, a list of preferred locations to compute each split on (e.g. block locations for an HDFS file)**

- 可选项，一个列表，存储每个Partition的位置（Preferred location）。
- 对于一个HDFS文件来说，这个列表保存的就是每个Partition所在的块的位置，按照==“移动数据不如移动计算”==的理念，Spark在进行任务调度的时候，会尽可能选择那些 **存有数据的worker节点来进行任务计算**。

### 小结！！！

RDD是一个数据集，不仅表示了数据集，还表示了这个数据集从哪里来，如何计算。

主要属性如下：

- 1、多分区
- 2、计算函数（计算每个分区的函数）
- 3、依赖关系（或血统、血缘关系）
- 4、分区函数（默认是哈希，一个Partitioner，即RDD的分片函数）
- 5、最佳位置（一个列表，存储存取每个Partition的优先位置）

## RDD的特点

RDD表示`只读的分区的数据集`，对RDD进行改动，只能通过RDD的`转换操作`，由一个RDD得到一个新的RDD，新的RDD包含了从其他RDD衍生所必需的信息。RDDs之间存在依赖，RDD的执行是按照`血缘关系`延时计算的。如果血缘关系较长，可以通过`持久化`RDD来切断血缘关系。

**分区**

RDD逻辑上是`分区`的，每个分区的`数据是抽象存在`的，计算的时候会通过一个 compute 函数得到每个分区的数据。如果RDD是通过已有的文件系统构建，则 compute 函数是`读取指定文件系统`中的数据，如果RDD是通过其他RDD转换而来，则 compute函数是执行`转换逻辑`将其他RDD的数据进行转换。

**只读**

如下图所示，RDD是只读的，要想改变RDD中的数据，只能在现有的RDD基础上创建新的RDD。

由一个RDD转换到另一个RDD，可以通过丰富的操作`算子`实现，不再像MapReduce那样只能写 map 和 reduce 了，如下图所示：

RDD的操作算子包括两类，一类叫做transformations，它是用来将RDD进行转化，构建RDD的血缘关系；**另一类叫做actions，它是用来触发RDD的计算，得到RDD的相关计算结果或者将RDD保存的文件系统中**。

**RDD支持的算子**

- Transformation转换算子

转换
含义

map(func)
返回一个新的RDD，
该RDD由每一个输入元素经过func函数转换后组成

filter(func)
返回一个新的RDD，
该RDD由经过func函数计算后返回值为true的输入元素组成

flatMap(func)
类似于map，但是每一个输入元素可以被映射为0或多个输出元素(所以func应该返回一个序列，而不是单一元素)

mapPartitions(func)
类似于map，
但独立地在RDD的每一个分片上运行，
因此在类型为T的RDD上运行时，
func的函数类型必须是，
Iterator[T] => Iterator[U]

mapPartitionsWithIndex(func)
类似于mapPartitions，
但func带有一个整数参数表示分片的索引值，
因此在类型为T的RDD上运行时，
func的函数类型必须是
(Int, Interator[T]) => Iterator[U]

sample(withReplacement, fraction, seed)
根据fraction指定的比例对数据进行采样，可以选择是否使用随机数进行替换，seed用于指定随机数生成器种子

union(otherDataset)
对源RDD和参数RDD求并集后返回一个新的RDD

intersection(otherDataset)
对源RDD和参数RDD求交集后返回一个新的RDD

distinct([numTasks]))
对源RDD进行去重后返回一个新的RDD

groupByKey([numTasks])
在一个(K,V)的RDD上调用，
返回一个(K, Iterator[V])的RDD

reduceByKey(func, [numTasks])
在一个(K,V)的RDD上调用，
返回一个(K,V)的RDD，
使用指定的reduce函数，
将相同key的值聚合到一起，
与groupByKey类似，
reduce任务的个数可以通过第二个可选的参数来设置

aggregateByKey(zeroValue)(seqOp, combOp, [numTasks])
如果源RDD包含 (K, V) 对，
则返回新RDD包含 (K, U) 对，
其中每个key对应的value都是由 combOp 函数 和 一个“0”值zeroValue 聚合得到。
允许聚合后value类型和输入value类型不同，
避免了不必要的开销。
和 groupByKey 类似，
可以通过可选参数 numTasks 指定reduce任务的个数。

sortByKey([ascending], [numTasks])
在一个(K,V)的RDD上调用，K必须实现Ordered接口，返回一个按照key进行排序的(K,V)的RDD

sortBy(func,[ascending], [numTasks])
与sortByKey类似，但是更灵活

join(otherDataset, [numTasks])
在类型为(K,V)和(K,W)的RDD上调用，
返回一个相同key对应的所有元素对在一起的(K,(V,W))的RDD

cogroup(otherDataset, [numTasks])
在类型为(K,V)和(K,W)的RDD上调用，
返回一个(K,(Iterable,Iterable))类型的RDD

cartesian(otherDataset)
笛卡尔积

pipe(command, [envVars])
对rdd进行管道操作

coalesce(numPartitions)
减少 RDD 的分区数到指定值。
在过滤大量数据之后，
可以执行此操作

repartition(numPartitions)
重新给 RDD 分区

- Action动作算子

动作
含义

reduce(func)
通过func函数聚集RDD中的所有元素，
这个功能必须是可交换且可并联的

collect()
在驱动程序中，以数组的形式返回数据集的所有元素

count()
返回RDD的元素个数

first()
返回RDD的第一个元素(类似于take(1))

take(n)
返回一个由数据集的前n个元素组成的数组

takeSample(withReplacement,num, [seed])
含返回一个数组，
该数组由从数据集中随机采样的num个元素组成，
可以选择是否用随机数替换不足的部分，
seed用于指定随机数生成器种子义

takeOrdered(n, [ordering])
返回自然顺序或者自定义顺序的前 n 个元素

saveAsTextFile(path)
将数据集的元素以textfile的形式保存到HDFS文件系统或者其他支持的文件系统，
对于每个元素，
Spark将会调用toString方法，
将它装换为文件中的文本

saveAsSequenceFile(path)
将数据集中的元素以Hadoop sequencefile的格式保存到指定的目录下，
可以使HDFS或者其他Hadoop支持的文件系统。

saveAsObjectFile(path)
将数据集的元素，
以 Java 序列化的方式保存到指定的目录下

countByKey()
针对(K,V)类型的RDD，
返回一个(K,Int)的map，
表示每一个key对应的元素个数。

foreach(func)
在数据集的每一个元素上，
运行函数func进行更新。

foreachPartition(func)
在数据集的每一个分区上，
运行函数func

**依赖**

RDDs通过`操作算子`进行转换，转换得到的新RDD包含了从其他RDDs衍生所必需的信息，RDDs之间维护着这种`血缘关系`，也称之为`依赖`。如下图所示，依赖包括两种，一种是窄依赖，`RDDs之间分区是一一对应的`，另一种是宽依赖，`下游RDD的每个分区与上游RDD(也称之为父RDD)的每个分区都有关，是多对多的关系`。

**缓存**

如果在应用程序中多次使用同一个RDD，可以将该RDD`缓存`起来，`该RDD只有在第一次计算的时候会根据血缘关系得到分区的数据，在后续其他地方用到该RDD的时候，会直接从缓存处取`而不用再根据血缘关系计算，这样就加速后期的重用。如下图所示，RDD-1经过一系列的转换后得到RDD-n并保存到hdfs，RDD-1在这一过程中会有个中间结果，如果将其缓存到内存，那么在随后的RDD-1转换到RDD-m这一过程中，就不会计算其之前的RDD-0了

**CheckPoint**

虽然RDD的血缘关系天然地可以`实现容错`，`当RDD的某个分区数据失败或丢失，可以通过血缘关系重建`。但是对于长时间迭代型应用来说，随着迭代的进行，RDDs之间的血缘关系会越来越长，一旦在后续迭代过程中出错，则需要通过非常长的血缘关系去重建，势必影响性能。为此，RDD支持checkpoint将数据保存到持久化的存储中，这样就可以`切断`之前的血缘关系，因为checkpoint后的RDD不需要知道它的父RDDs了，它可以从checkpoint处拿到数据。
