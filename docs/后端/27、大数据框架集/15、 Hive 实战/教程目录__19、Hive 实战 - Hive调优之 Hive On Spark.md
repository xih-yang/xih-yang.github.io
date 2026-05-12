# 19、Hive 实战 - Hive调优之 Hive On Spark
- 来源：https://ddkk.com/zhuanlan/bigdata/hive/1/19.html
- 分类：大数据框架
- 分组：教程目录
## 1. Executor参数

以单台服务器128G内存，32线程为例。

### 1.1. spark.executor.cores

该参数表示每个Executor可利用的CPU核心数。其值不宜设定过大，因为Hive的底层以HDFS存储，而HDFS有时对高并发写入处理不太好，容易造成race condition。根据经验实践，设定在3~6之间比较合理。

假设我们使用的服务器单节点有32个CPU核心可供使用。考虑到系统基础服务和HDFS等组件的余量，一般会将YARN NodeManager的yarn.nodemanager.resource.cpu-vcores参数设为28，也就是YARN能够利用其中的28核，此时将spark.executor.cores设为4最合适，最多可以正好分配给7个Executor而不造成浪费。又假设yarn.nodemanager.resource.cpu-vcores为26，那么将spark.executor.cores设为5最合适，只会剩余1个核。

由于一个Executor需要一个YARN Container来运行，所以还需保证spark.executor.cores的值不能大于单个Container能申请到的最大核心数，即yarn.scheduler.maximum-allocation-vcores的值。

### 1.2. spark.executor.memory/spark.yarn.executor.memoryOverhead

这两个参数分别表示每个Executor可利用的堆内内存量和堆外内存量。堆内内存越大，Executor就能缓存更多的数据，在做诸如map join之类的操作时就会更快，但同时也会使得GC变得更麻烦。spark.yarn.executor.memoryOverhead的默认值是executorMemory * 0.10，最小值为384M(每个Executor)

Hive官方提供了一个计算Executor总内存量的经验公式，如下：

yarn.nodemanager.resource.memory-mb*(spark.executor.cores/yarn.nodemanager.resource.cpu-vcores)

其实就是按核心数的比例分配。在计算出来的总内存量中，80%~85%划分给堆内内存，剩余的划分给堆外内存。

假设集群中单节点有128G物理内存，yarn.nodemanager.resource.memory-mb（即单个NodeManager能够利用的主机内存量）设为100G，那么每个Executor大概就是100*(4/28)=约14G。

再按8:2比例划分的话，最终spark.executor.memory设为约11.2G，spark.yarn.executor.memoryOverhead设为约2.8G。

通过这些配置，每个主机一次可以运行多达7个executor。每个executor最多可以运行4个task(每个核一个)。因此，每个task平均有3.5 GB(14 / 4)内存。在executor中运行的所有task共享相同的堆空间。

```java
set spark.executor.memory=11.2g;
set spark.yarn.executor.memoryOverhead=2.8g;
```

同理，这两个内存参数相加的总量也不能超过单个Container最多能申请到的内存量，即yarn.scheduler.maximum-allocation-mb配置的值。

### 1.3. spark.executor.instances

该参数表示执行查询时一共启动多少个Executor实例，这取决于每个节点的资源分配情况以及集群的节点数。若我们一共有10台32C/128G的节点，并按照上述配置（即每个节点承载7个Executor），那么理论上讲我们可以将spark.executor.instances设为70，以使集群资源最大化利用。但是实际上一般都会适当设小一些（推荐是理论值的一半左右，比如40），因为Driver也要占用资源，并且一个YARN集群往往还要承载除了Hive on Spark之外的其他业务。

### 1.4. spark.dynamicAllocation.enabled

上面所说的固定分配Executor数量的方式可能不太灵活，尤其是在Hive集群面向很多用户提供分析服务的情况下。所以更推荐将spark.dynamicAllocation.enabled参数设为true，以启用Executor动态分配。

### 1.5. 参数配置样例参考

```java
set hive.execution.engine=spark;
set spark.executor.memory=11.2g;
set spark.yarn.executor.memoryOverhead=2.8g;
set spark.executor.cores=4;
set spark.executor.instances=40;
set spark.dynamicAllocation.enabled=true;
set spark.serializer=org.apache.spark.serializer.KryoSerializer;
```

## 2. Driver参数

### 2.1. spark.driver.cores

该参数表示每个Driver可利用的CPU核心数。绝大多数情况下设为1都够用。

### 2.2. spark.driver.memory/spark.driver.memoryOverhead

这两个参数分别表示每个Driver可利用的堆内内存量和堆外内存量。根据资源富余程度和作业的大小，一般是将总量控制在512MB~4GB之间，并且沿用Executor内存的“二八分配方式”。例如，spark.driver.memory可以设为约819MB，spark.driver.memoryOverhead设为约205MB，加起来正好1G。
