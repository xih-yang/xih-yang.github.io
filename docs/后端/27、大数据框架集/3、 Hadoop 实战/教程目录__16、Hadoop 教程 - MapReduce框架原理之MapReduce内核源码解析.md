# 16、Hadoop 教程 - MapReduce框架原理之MapReduce内核源码解析
- 来源：https://ddkk.com/zhuanlan/bigdata/hadoop/3/16.html
- 分类：大数据框架
- 分组：教程目录
## 1. MapTask工作机制

1）Read阶段：MapTask通过InputFormat获得的RecordReader，从输入InputSplit中解析出一个个key/value。

2）Map阶段：该节点主要是将解析出的key/value交给用户编写map()函数处理，并产生一系列新的key/value。

3）Collect收集阶段：在用户编写map()函数中，当数据处理完成后，一般会调用OutputCollector.collect()输出结果。在该函数内部，它会将生成的key/value分区（调用Partitioner），并写入一个环形内存缓冲区中。

4）Spill阶段：即“溢写”，当环形缓冲区满后，MapReduce会将数据写到本地磁盘上，生成一个临时文件。需要注意的是，将数据写入本地磁盘之前，先要对数据进行一次本地排序，并在必要时对数据进行合并、压缩等操作。

5）Merge阶段：当所有数据处理完成后，MapTask对所有临时文件进行一次合并，以确保最终只会生成一个数据文件。

> 溢写阶段详情：

步骤1：利用快速排序算法对缓存区内的数据进行排序，排序方式是，先按照分区编号Partition进行排序，然后按照key进行排序。这样，经过排序后，数据以分区为单位聚集在一起，且同一分区内所有数据按照key有序。

步骤2：按照分区编号由小到大依次将每个分区中的数据写入任务工作目录下的临时文件output/spillN.out（N表示当前溢写次数）中。如果用户设置了Combiner，则写入文件之前，对每个分区中的数据进行一次聚集操作。

步骤3：将分区数据的元信息写到内存索引数据结构SpillRecord中，其中每个分区的元信息包括在临时文件中的偏移量、压缩前数据大小和压缩后数据大小。如果当前内存索引大小超过1MB，则将内存索引写到文件output/spillN.out.index中。

当所有数据处理完后，MapTask会将所有临时文件合并成一个大文件，并保存到文件output/file.out中，同时生成相应的索引文件output/file.out.index。

在进行文件合并过程中，MapTask以分区为单位进行合并。对于某个分区，它将采用多轮递归合并的方式。每轮合并mapreduce.task.io.sort.factor（默认10）个文件，并将产生的文件重新加入待合并列表中，对文件排序后，重复以上过程，直到最终得到一个大文件。

让每个MapTask最终只生成一个数据文件，可避免同时打开大量文件和同时读取大量小文件产生的随机读取带来的开销。

## 2. ReduceTask工作机制

1）Copy阶段：ReduceTask从各个MapTask上远程拷贝一片数据，并针对某一片数据，如果其大小超过一定阈值，则写到磁盘上，否则直接放到内存中。

2）Sort阶段：在远程拷贝数据的同时，ReduceTask启动了两个后台线程对内存和磁盘上的文件进行合并，以防止内存使用过多或磁盘上文件过多。按照MapReduce语义，用户编写reduce()函数输入数据是按key进行聚集的一组数据。为了将key相同的数据聚在一起，Hadoop采用了基于排序的策略。由于各个MapTask已经实现对自己的处理结果进行了局部排序，因此，ReduceTask只需对所有数据进行一次归并排序即可。

3）Reduce阶段：reduce()函数将计算结果写到HDFS上。

## 3. ReduceTask并行度决定机制

MapTask并行度由切片个数决定，切片个数由输入文件和切片规则决定。那ReduceTask并行度由谁决定？

### 3.1. 设置ReduceTask并行度（个数）

ReduceTask的并行度同样影响整个Job的执行并发度和执行效率，但与MapTask的并发数由切片数决定不同，ReduceTask数量的决定是可以直接手动设置：

```java
// 默认值是1，手动设置为4
job.setNumReduceTasks(4);
```

### 3.2. 实验：测试ReduceTask多少合适

（1）实验环境：1个Master节点，16个Slave节点：CPU:8GHZ，内存: 2G

（2）实验结论：

表 改变ReduceTask（数据量为1GB）

MapTask =16

ReduceTask
1
5
10
15
16
20
25
30
45
60

总时间
892
146
110
92
88
100
128
101
145
104

### 3.3. 注意事项

1）ReduceTask=0，表示没有Reduce阶段，输出文件个数和Map个数一致。

2）ReduceTask默认值就是1，所以输出文件个数为一个。

3）如果数据分布不均匀，就有可能在Reduce阶段产生数据倾斜

4）ReduceTask数量并不是任意设置，还要考虑业务逻辑需求，有些情况下，需要计算全局汇总结果，就只能有1个ReduceTask。

5）具体多少个ReduceTask，需要根据集群性能而定。

6）如果分区数不是1，但是ReduceTask为1，是否执行分区过程。答案是：不执行分区过程。因为在MapTask的源码中，执行分区的前提是先判断ReduceNum个数是否大于1。不大于1肯定不执行。

## 4. MapTask & ReduceTask源码解析

### 4.1. MapTask源码解析流程

> =================== MapTask ===================
>
> context.write(k, NullWritable.get()); //自定义的map方法的写出，进入
>
> output.write(key, value);
>
> //MapTask727行，收集方法，进入两次
>
> collector.collect(key, value,partitioner.getPartition(key, value, partitions));
>
> HashPartitioner(); //默认分区器
>
> collect() //MapTask1082行 map端所有的kv全部写出后会走下面的close方法
>
> close() //MapTask732行
>
> collector.flush() // 溢出刷写方法，MapTask735行，提前打个断点，进入
>
> sortAndSpill() //溢写排序，MapTask1505行，进入
>
> sorter.sort() QuickSort //溢写排序方法，MapTask1625行，进入
>
> mergeParts(); //合并文件，MapTask1527行，进入
>
>
>
> collector.close(); //MapTask739行,收集器关闭,即将进入ReduceTask

### 4.2. ReduceTask源码解析流程

> =================== ReduceTask ===================
>
> if (isMapOrReduce()) //reduceTask324行，提前打断点
>
> initialize() // reduceTask333行,进入
>
> init(shuffleContext); // reduceTask375行,走到这需要先给下面的打断点
>
> totalMaps = job.getNumMapTasks(); // ShuffleSchedulerImpl第120行，提前打断点
>
> merger = createMergeManager(context); //合并方法，Shuffle第80行
>
> // MergeManagerImpl第232 235行，提前打断点
>
> this.inMemoryMerger = createInMemoryMerger(); //内存合并
>
> this.onDiskMerger = new OnDiskMerger(this); //磁盘合并
>
> rIter = shuffleConsumerPlugin.run();
>
> eventFetcher.start(); //开始抓取数据，Shuffle第107行，提前打断点
>
> eventFetcher.shutDown(); //抓取结束，Shuffle第141行，提前打断点
>
> copyPhase.complete(); //copy阶段完成，Shuffle第151行
>
> taskStatus.setPhase(TaskStatus.Phase.SORT); //开始排序阶段，Shuffle第152行
>
> sortPhase.complete(); //排序阶段完成，即将进入reduce阶段 reduceTask382行
>
> reduce(); //reduce阶段调用的就是我们自定义的reduce方法，会被调用多次
>
> cleanup(context); //reduce完成之前，会最后调用一次Reducer里面的cleanup方法
