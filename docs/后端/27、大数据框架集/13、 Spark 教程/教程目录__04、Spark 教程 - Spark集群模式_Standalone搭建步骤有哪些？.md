# 04、Spark 教程 - Spark集群模式_Standalone搭建步骤有哪些？
- 来源：https://ddkk.com/zhuanlan/bigdata/spark/2/4.html
- 分类：大数据框架
- 分组：教程目录
### 1 Standalone 架构

Standalone模式是Spark自带的一种集群模式，不同于前面本地模式启动多个进程来模拟集群的环境，Standalone模式是真实地在多个机器之间搭建Spark集群的环境，完全可以利用该模式搭建多机器集群，用于实际的大数据处理。

**Standalone集群使用了分布式计算中的master-slave模型，master是集群中含有Master进程的节点，slave是集群中的Worker节点含有Executor进程**。

http://spark.apache.org/docs/latest/cluster-overview.html

Spark Standalone集群，类似Hadoop YARN，管理集群资源和调度资源：

**主节点Master：**

管理整个集群资源，接收提交应用，分配资源给每个应用，运行Task任务

**从节点Workers：**

管理每个机器的资源，分配对应的资源来运行Task；

每个从节点分配资源信息给Worker管理，资源信息包含内存Memory和CPU Cores核数

**历史服务器HistoryServer(可选)：**

Spark Application运行完成以后，保存事件日志数据至HDFS，启动HistoryServer可以查看应用运行相关信息。

### 2 Standalone 环境安装操作

standalone环境可直接参考>中关于standalone安装操作。**公众号内回复【spark部署】获取资料。**

### 3 测试

·Pyspark shell脚本：

```java
/export/server/spark/bin/pyspark --master spark://node1:7077 \
--conf "spark.pyspark.driver.python=/root/anaconda3/bin/python3" \ 
--conf "spark.pyspark.python=/root/anaconda3/bin/python3"   
```

·运行程序

```java
resultRDD2 = sc.textFile("hdfs://node1:8020/pydata/words.txt") \
.flatMap(lambda line: line.split(" ")) \
.map(lambda x: (x, 1)) \
.reduceByKey(lambda a, b: a + b)
resultRDD2 .collect() 
```

·注意

集群模式下程序是在集群上运行的，不要直接读取本地文件，应该读取hdfs上的

因为程序运行在集群上，具体在哪个节点上我们运行并不知道，其他节点可能并没有那个数据文件

SparkContext web UI

URL：http://node1:4040/jobs/

查看Master主节点WEB UI界面：

**URL：http://node1:8080/**

**提交运行圆周率**

将上述运行在Local Mode的圆周率PI程序，运行在Standalone集群上，修改【--master】地址为Standalone集群地址：spark://node1:7077，具体命令如下：

```java
${SPARK_HOME}/bin/spark-submit \
--master spark://node1:7077 \
--conf "spark.pyspark.driver.python=/root/anaconda3/bin/python3" \
--conf "spark.pyspark.python=/root/anaconda3/bin/python3" \
${SPARK_HOME}/examples/src/main/python/pi.py \
10
```

### 4 Spark 应用架构

登录到Spark HistoryServer历史服务器WEB UI界面，点击刚刚运行圆周率PI程序：

查看应用运行状况：

切换到【Executors】Tab页面：

从图中可以看到Spark Application运行到集群上时，由两部分组成：Driver Program和Executors。

**第一、Driver Program**

·相当于AppMaster，整个应用管理者，负责应用中所有Job的调度执行;

·运行JVM Process，运行程序的MAIN函数，必须创建SparkContext上下文对象；

·一个SparkApplication仅有一个；

**第二、Executors**

·相当于一个线程池，运行JVM Process，其中有很多线程，每个线程运行一个Task任务，一个Task任务运行需要1 Core CPU，所有可以认为Executor中线程数就等于CPU Core核数；

·一个Spark Application可以有多个，可以设置个数和资源信息；

**用户程序从最开始的提交到最终的计算执行，需要经历以下几个阶段：**

1）、用户程序创建 SparkContext 时，新创建的 SparkContext 实例会连接到 ClusterManager。Cluster Manager 会根据用户提交时设置的 CPU 和内存等信息为本次提交分配计算资源，启动 Executor。

2）、Driver会将用户程序划分为不同的执行阶段Stage，每个执行阶段Stage由一组完全相同Task组成，这些Task分别作用于待处理数据的不同分区。在阶段划分完成和Task创建后， Driver会向Executor发送 Task；

3）、Executor在接收到Task后，会下载Task的运行时依赖，在准备好Task的执行环境后，会开始执行Task，并且将Task的运行状态汇报给Driver；

4）、Driver会根据收到的Task的运行状态来处理不同的状态更新。Task分为两种：一种是Shuffle Map Task，它实现数据的重新洗牌，洗牌的结果保存到Executor 所在节点的文件系统中；另外一种是Result Task，它负责生成结果数据；

5）、Driver 会不断地调用Task，将Task发送到Executor执行，在所有的Task 都正确执行或者超过执行次数的限制仍然没有执行成功时停止；

### 5 WEB UI 监控

Spark 提供了多个监控界面，当运行Spark任务后可以直接在网页对各种信息进行监控查看。运行spark-shell交互式命令在Standalone集群上，命令如下：

```java
/export/server/spark/bin/spark-shell --master spark://node1.itcast.cn:7077 
```

在node1运行pyspark-shell，WEB UI监控页面地址：http://node1:4040

还可以发现在一个Spark Application中，包含多个Job，每个Job有多个Stage组成，每个Job执行按照DAG图进行的。

其中每个Stage中包含多个Task任务，每个Task以线程Thread方式执行，需要1Core CPU。

**Spark Application程序运行时三个核心概念：Job、Stage、Task，说明如下：**

**·Task**：被分配到各个 Executor 的单位工作内容，它是 Spark 中的最小执行单位，一般来说有多少个 Paritition（物理层面的概念，即分支可以理解为将数据划分成不同部分并行处理），就会有多少个 Task，每个 Task 只会处理单一分支上的数据。

**·Job**：由多个 Task 的并行计算部分，一般 Spark 中的 action 操作（如 save、collect，后面进一步说明），会生成一个 Job。

**·Stage**：Job 的组成单位，一个 Job 会切分成多个 Stage，Stage 彼此之间相互依赖顺序执行，而每个 Stage 是多个 Task 的集合，类似 map 和 reduce stage。
