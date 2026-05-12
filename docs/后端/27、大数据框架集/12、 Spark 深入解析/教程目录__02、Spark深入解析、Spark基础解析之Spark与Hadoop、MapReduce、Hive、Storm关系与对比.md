# 02、Spark深入解析、Spark基础解析之Spark与Hadoop、MapReduce、Hive、Storm关系与对比
- 来源：https://ddkk.com/zhuanlan/bigdata/spark/1/2.html
- 分类：大数据框架
- 分组：教程目录
## Spark VS Hadoop

尽管Spark相对于Hadoop而言具有较大优势，但`Spark并不能完全替代Hadoop`，Spark主要用于`替代Hadoop中的MapReduce计算模型。存储依然可以使用HDFS`，但是中间结果可以存放在内存中；调度可以使用Spark内置的，也可以使用更成熟的`调度系统YARN`等

实际上，Spark已经很好地融入了Hadoop生态圈，并成为其中的重要一员，它可以借助于YARN实现资源调度管理，借助于HDFS实现分布式存储。

此外，Hadoop可以使用廉价的、异构的机器来做分布式存储与计算，但是，`Spark对硬件的要求稍高一些，对内存与CPU有一定的要求`。

## Spark VS MapReduce的计算模型

`MapReduce能够完成的各种离线数据批处理功能`，以及常见算法（比如二次排序、TopN等），基于Spark RDD的核心编程，都可以实现，并且可以更好地、更容易地实现，而且`基于Spark RDD编写的离线批处理程序，运行速度是MapReduce的数倍，速度上有非常明显的优势`。

Spark相比较于MapReduce速度快的最主要原因在于，`MapReduce的计算模型太死板，必须是Map-Reduce模式，有时候即使完成一些诸如过滤之类的操作，也必须经过map-reduce过程`，这样就必须经过shuffle过程，而MapReduce的shuffle过程是最消耗性能的，因为shuffle中间的过程必须基于磁盘来读写。`而Spark的shuffle虽然也要基于磁盘，但是其大量的TransFormation操作，比如单纯的map或者fill特然等操作，可以直接基于内存进行pipeline操作，速度性能自然大大提升`。

但是Spark也有其劣势。由于Spark基于内存进行计算，虽然开发容易，但是真正面对大数据的时候（比如一次操作针对10亿以上级别的数据），`在没有进行调优得情况下`，可能会出现各种各样的问题，比如OOM内存溢出等，导致Spark程序可能都无法完全运行起来，就报错挂掉了，而MapReduce即使是运行缓慢，但是至少可以慢慢运行完。

**Spark VS MapReduce 计算流程图详解**

## Spark VS Hive

Spark SQL实际上并不能完全替代Hive，因为Hive是一种基于HDFS的数据仓库，并且提供了基于SQL模型，针对存储大数据的数据仓库，进行分布式交互查询的查询引擎。

严格来说，Spark SQL能够替代的，是Hive的查询引擎，而不是Hive本身，实际上即使在生产环境下，Spark SQL也是针对Hive数据仓库中的数据进行查询，Spark本身自己是不提供存储的，自然也不可能替代Hive作为数据仓库的这个功能。

Spark SQL的一个优点，相较于Hive查询引擎来说，就是速度快，同样的SQL语句，可能使用HIve的查询引擎，由于其底层基于MapReduce，必须经过shuffle过程走磁盘，因此速度是非常缓慢的，很多复杂的SQL语句，在hive中执行都需要一个小时以上的时间，而Spark SQL由于其底层基于Spark自身的基于内存的特点，因此速度达到了Hive查询引擎的数倍以上。

但是Spark SQL由于与Spark一样，是大数据领域新起的新秀，因此还不够完善，有少量的Hive支持的高级特性，Spark SQL还不支持，倒是Spark SQL暂时还不能完全替代Hive的查询引擎，而只能在部分Spark SQL功能特性可以满足需求的场景下，进行使用。

而Spark SQL相较于Hive的另外一个优点，就是支持大量不同的数据，包括hive、json、parquet、jdbc等等，此外，Spark SQL由于身处Spark技术堆栈内，也是基于RDD来工作，因此可以与Spark的其他组件无缝整合使用，配合起来实现许多复杂的功能，比如：Spark SQL支持可以直接针对HDFS文件执行SQL语句！！！

**Spark VS Hive 流程图详解**

## Spark Streaming VS Storm

Spark Streaming 与 Storm 都可以用于进行实时流计算，但是他们两者的区别是非常大的，其中区别之一，就是，SS(Spark Streaming)和Storm的计算模型完全不一样，SS是基于RDD的，因此需要将一小段时间内的，比如1秒内的数据，收集起来，作为一个RDD，然后再针对这个batch（一批数据）的数据进行处理。而Storm却可以做到每来一条数据，都可以立即进行处理和计算，因此，SS实际上严格意义上来说，只能称作准实时的流计算框架，而Storm是真正意义上的实时计算框架！

此外，Storm支持的一项高级特性，是SS暂时不具备的，即Storm支持在分布式流式计算程序（Topology）再运行过程中，可以动态地调整并行度，从而动态提高并发处理能力，而SS是无法动态调整并行度的

但是SS也有其他优点，首先SS由于是基于batch进行处理的，因此相较于Storm基于单条数据进行处理，具有数倍甚至数十倍的吞吐量（[如何理解吞吐量？](https://www.cnblogs.com/binyao/p/5162424.html)）。

此外，SS由于也身处于Spark生态圈内，因此SS可以与Spark Core、Spark SQL，甚至是Spark MLlib、Spark GraphX进行无缝整合，流式处理完的数据，可以立即进行各种map、reduce转换操作，可以理解使用sql进行查询，甚至可以立即使用machine leaming 或者图计算算法进行处理，这种一站式的大数据处理功能和优势，是Storm无法匹敌的。

因此，综合来看，通常在对实时性要求特别高，而且实时数据量不稳定，比如在白天有高峰期的情况下，可以选择Storm，但是如果是对实时性要求一般，允许1秒或2、3秒的准实时处理，而且不要求动态调整并行度的话，选择SS是更好的选择。

**Spark Streaming VS Storm流程图详解**

## 大数据体系架构概览（Spark的地位）
