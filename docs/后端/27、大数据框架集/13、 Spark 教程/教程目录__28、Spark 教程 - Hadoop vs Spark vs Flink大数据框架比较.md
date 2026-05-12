# 28、Spark 教程 - Hadoop vs Spark vs Flink大数据框架比较
- 来源：https://ddkk.com/zhuanlan/bigdata/spark/2/28.html
- 分类：大数据框架
- 分组：教程目录
大数据开发离不开各种框架，我们通过学习 Apache Hadoop、Spark 和 Flink 之间的特征比较，可以从侧面了解要学习的内容。众所周知，Hadoop vs Spark vs Flink是快速占领 IT 市场的三大大数据技术，大数据岗位几乎都是围绕它们展开。

本文，将详细介绍三种框架之间的区别。

### 1. 数据处理

Hadoop：为批处理而构建的Hadoop，它一次性在输入中获取大量数据集，对其进行处理并产生结果。批处理在处理大量数据时非常有效。由于数据的大小和系统的计算能力，输出会出现延迟。

Spark：Spark也是 Hadoop生态系统的一部分。它本质上也是一个批处理系统，但它也支持流处理。

Flink：Flink为流式处理和批处理提供了单一的运行时。

### 2. 流引擎

Hadoop：Map-reduce是面向批处理的工具。它一次性在输入中获取大量数据集，对其进行处理并产生结果。

Spark：Apache Spark Streaming以微批处理的形式处理数据流。每个批次都包含在批次期间到达的事件集合。但对于我们需要处理大量实时数据流并实时提供结果的用例来说，这还不够。

Flink：Apache Flink是真正的流媒体引擎。它使用流来处理工作负载：流式处理、SQL、微批处理和批处理。批处理是一组有限的流数据。

### 3. 数据流

Hadoop：MapReduce计算数据流没有任何循环。这是一个阶段链，在每个阶段，您都使用前一阶段的输出向前推进，并为下一阶段产生输入。

Spark：虽然机器学习算法是一个循环数据流，但 Spark将其表示为（DAG）有向无环图。

Flink：Flink采用了与其他方法不同的方法。它在运行时支持受控循环依赖图。这有助于以非常有效的方式表示机器学习算法。

### 4. 计算模型

Hadoop：MapReduce采用了面向批处理的模型，批处理正在处理静态数据，一次需要大量数据，对其进行处理，然后写出输出。

Spark：Spark采用了微批处理。微批次本质上是一种“收集然后处理”的计算模型。

Flink：Flink采用了连续流、基于算子的流模型。连续流算子在数据到达时对其进行处理，而不会延迟收集数据或处理数据。

### 5. 性能

Hadoop：Apache Hadoop仅支持批处理。它不处理流数据，因此与Hadoop、Spark和Flink相比，性能更慢。

Spark：虽然Spark有优秀的社区背景，并且现在被认为是最成熟的社区，但它的流处理效率并不比Flink高，因为它使用的是微批处理。

Flink：与任何其他数据处理系统相比，Flink的性能非常出色。比较Hadoop、Spark和Flink时可以看出，Flink使用原生闭环迭代运算符，这使得机器学习和图形处理更快。

### 6. 内存管理

Hadoop：提供可配置的内存管理，可以动态或静态地执行此操作。

Spark：提供可配置的内存管理，Spark 1.6 的最新版本已经朝着自动化内存管理的方向发展。

Flink：提供了自动内存管理，有自己的内存管理系统。

### 7. 容错

Hadoop：MapReduce具有高度容错性。如果Hadoop出现任何故障，则无需从头开始重新启动应用程序。

Spark：Apache Spark Streaming恢复丢失的工作，无需额外的代码或配置。

Flink：Apache Flink遵循的容错机制是基于Chandy-Lamport分布式快照。该机制是轻量级的，导致在保持高吞吐率的同时提供强大的一致性保证。

### 8. 可扩展性

Hadoop：MapReduce具有很强的可扩展性潜力，并已在数万个节点上用于生产。

Spark：它具有高度可扩展性，我们可以在集群中不断添加 n 个节点，一个已知的大型 Spark集群有8000个节点。

Flink：Flink也具有很高的可扩展性，我们可以在集群中不断添加 n 个节点，一个已知的大型 Flink 集群有数千个节点。

### 9. 迭代处理

Hadoop：不支持迭代处理。

Spark：它批量迭代其数据。在Spark中，每次迭代都必须单独安排和执行。

Flink：它通过使用其流式架构来迭代数据。可以指示Flink只处理实际发生变化的部分数据，从而显着提高作业的性能。

### 10. 语言支持

Hadoop：主要支持Java，其他支持的语言有c、c++、ruby、groovy、Perl、Python。

Spark：支持Java、Scala、Python和R。Spark是在Scala中实现的，供其他语言的API，如Java、Python和 R。

Flink：支持 Java、Scala、Python和R。Flink 是用 Java实现的，同时也提供了Scala API。

### 11. 优化

Hadoop：在 MapReduce 中，作业必须手动优化。有几种方法可以优化MapReduce作业：正确配置集群、使用组合器、使用LZO压缩、适当调整 MapReduce任务的数量以及为数据使用最合适和最紧凑的可写类型。

Spark：在Spark中，作业必须手动优化。有一个新的可扩展优化器 Catalyst，它基于Scala中的函数式编程结构。 Catalyst 的可扩展设计有两个目的：第一，易于添加新的优化技术。其次，使外部开发人员能够扩展优化器催化剂。

Flink：Apache Flink带有一个独立于实际编程接口的优化器。 Flink优化器的工作方式类似于关系数据库优化器，但将这些优化应用于Flink程序，而不是 SQL查询。

### 12. 延迟

Hadoop：Hadoop的MapReduce框架相对较慢，因为它旨在支持不同的格式、结构和海量数据。这就是为什么 Hadoop的延迟比Spark和Flink都高。

Spark：Spark是另一个批处理系统，但它比Hadoop MapReduce相对快，因为它通过RDD将大部分输入数据缓存在内存中，并将中间数据保存在内存中，最终在完成或需要时将数据写入磁盘。

Flink：Flink的数据流运行时只需少量配置，即可实现低延迟和高吞吐量。

### 14. 可视化

Hadoop：在Hadoop中，数据可视化工具是zoomdata，它可以直接连接到HDFS以及SQL-on-Hadoop技术，如 Impala、Hive、Spark SQL、Presto等。

Spark：它提供了一个用于提交和执行作业的Web界面，在该界面上可以可视化生成的执行计划。 Flink和Spark都集成到Apache zeppelin中，它提供数据分析、摄取以及发现、可视化和协作。

Flink：它还提供了一个用于提交和执行作业的Web界面，生成的执行计划可以在这个界面上进行可视化。

### 15. 恢复

Hadoop：MapReduce自然地对系统故障或故障具有弹性。它是高度容错的系统。

Spark：Apache Spark RDD允许通过重新计算DAG来恢复故障节点上的分区，同时还通过检查点支持与Hadoop更相似的恢复方式，以减少RDD的依赖关系。

Flink：支持checkpointing机制，将程序存储在数据源和数据接收器中，窗口的状态，以及用户自定义的状态，在失败后恢复流式作业。

### 16. 安全性

Hadoop：它支持Kerberos身份验证，管理起来有些麻烦。但是，第三方供应商已使组织能够利用Active Directory Kerberos和LDAP进行身份验证。

Spark：Apache Spark的安全性有点稀疏，目前仅支持通过共享密钥（密码身份验证）进行身份验证。 当你在HDFS上运行Spark，它可以使用HDFS ACL和文件级权限。此外，Spark可以在 YARN上运行以使用Kerberos身份验证。

Flink：Flink通过Hadoop / Kerberos基础设施支持用户身份验证。如果在YARN上运行Flink，Flink会获取提交程序的用户的Kerberos令牌，并使用该令牌在YARN、HDFS和HBase上进行身份验证。Flink即将推出的连接器，流程序可以通过 SSL将自己验证为流代理。

### 17. 成本

Hadoop：MapReduce通常可以在比某些替代方案更便宜的硬件上运行，因为它不会尝试将所有内容都存储在内存中。

Spark：由于Spark需要大量RAM才能在内存中运行，因此在集群中增加它会逐渐增加其成本。

Flink：Apache Flink也需要大量的RAM在内存中运行，所以它的成本会逐渐增加。

### 18. 兼容性

Hadoop：Apache Hadoop MapReduce 和 Apache Spark相互兼容，Spark通过JDBC和ODBC共享MapReduce 对数据源、文件格式和商业智能工具的所有兼容性。

Spark：Apache Spark和Hadoop相互兼容。 Spark与Hadoop数据兼容。它可以通过YARN或Spark的独立模式在 Hadoop集群中运行，并且可以处理HDFS、HBase、Cassandra、Hive和任何Hadoop InputFormat中的数据。

Flink：Apache Flink是一个可扩展的数据分析框架，完全兼容Hadoop。它提供了一个Hadoop Compatibility包来包装针对Hadoop的MapReduce接口实现的函数，并将它们嵌入到Flink程序中。

### 20. 使用感

Hadoop：MapReduce 开发人员需要手动编写每个操作的代码，这让编程工作变得非常困难。

Spark：很容易编程，因为它有大量的高级操作符。

Flink：也有高级算子，易于操作。

### 21. 交互模式

Hadoop：MapReduce 没有交互模式。

Spark：Spark 有一个交互式Shell，可以学习如何充分利用Spark。这是一个用 Scala编写的Spark应用程序，提供一个具有自动完成功能的命令行环境，您可以在其中运行临时查询并熟悉 Spark的功能。

Flink：它带有一个集成的交互式Scala Shell。它可以在本地设置和集群设置中使用。

### 22. 实时分析

Hadoop：MapReduce 在实时数据处理方面失败了，因为它旨在对大量数据执行批处理。

Spark：它可以处理实时数据，即以每秒数百万个事件的速率来自实时事件流的数据。

Flink：主要用于实时数据分析，虽然也提供了快速的批量数据处理。

### 23. 调度器

Hadoop：Hadoop中的调度程序成为可插拔组件。多用户工作负载有两个调度器：公平调度器和容量调度器。为了调度复杂的流程，MapReduce需要像Oozie这样的外部作业调度程序。

Spark：由于内存计算，Spark能充当自己的流调度程序。

Flink：Flink可以使用YARN Scheduler，Flink也有自己的 Scheduler。

### 24. SQL支持

Hadoop：它使用户能够使用 Apache Hive运行SQL查询。

Spark：它使用户能够使用Spark-SQL运行SQL查询。Spark提供了类似Hives的查询语言和类似DSL的Dataframe 来查询结构化数据。

Flink：在Flink中，Table API是一种类似SQL的表达式语言，支持DSL等数据帧，目前仍处于测试阶段。有计划添加SQL接口，但不确定何时会进入框架。

### 25. 缓存

Hadoop：MapReduce 无法将数据缓存在内存中以满足未来需求。

Spark：它可以将数据缓存在内存中以进行进一步的迭代，从而提高其性能。

Flink：它可以将数据缓存在内存中以供进一步迭代以提高其性能。

### 26. 硬件要求

Hadoop：MapReduce在商品硬件上运行良好。

Spark：Apache Spark需要中高级硬件。由于Spark将数据缓存在内存中以供进一步迭代，从而提高其性能。

Flink：Apache Flink也需要中高级硬件。 Flink还可以将数据缓存在内存中以进行进一步的迭代，从而提高其性能。

### 27. 机器学习

Hadoop：需要像Apache Mahout这样的机器学习工具。

Spark：有自己的一套机器学习MLlib。在内存缓存和其他实现细节中，它确实是实现ML算法的强大平台。

Flink：有FlinkML，它是Flink的机器学习库。它支持运行时受控的循环依赖图。与DAG表示相比，这使得它们以非常有效的方式表示ML算法。

### 28. 部署

Hadoop：在独立模式下，Hadoop 被配置为在单节点、非分布式模式下运行。在伪分布式模式下，Hadoop以伪分布式模式运行。因此，不同之处在于每个Hadoop守护程序以伪分布式模式在单独的Java进程中运行。而在本地模式下，每个Hadoop守护程序都作为单个Java进程运行。在完全分布式模式下，所有守护进程在单独的节点中执行，形成一个多节点集群。

Spark：还提供了一种简单的独立部署模式，可以在Mesos或YARN集群管理器上运行。它可以手动启动，通过手动启动 master和worker或使用我们提供的启动脚本。也可以在单台机器上运行这些守护进程进行测试。

Flink：还提供了在YARN集群管理器上运行的独立部署模式。

### 29. 消除重复

Hadoop：Hadoop中没有重复消除。

Spark：Spark还对每条记录进行一次准确的处理，因此消除了重复。

Flink：Flink只处理一次记录，因此消除了重复，流应用程序可以在计算期间保持自定义状态。Flink的检查点机制确保在出现故障时状态的语义恰好只有一次。

### 30. Window标准

一个数据流需要被分成许多逻辑流，每个逻辑流都可以应用一个窗口操作符。

Hadoop：不支持流式传输，因此不需要窗口条件。

Spark：具有基于时间的窗口标准。

Flink：具有基于记录的或任何自定义的用户定义的Flink Window标准。
