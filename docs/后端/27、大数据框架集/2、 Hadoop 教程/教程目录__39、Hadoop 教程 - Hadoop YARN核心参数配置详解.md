# 39、Hadoop 教程 - Hadoop YARN核心参数配置详解
- 来源：https://ddkk.com/zhuanlan/bigdata/hadoop/2/39.html
- 分类：大数据框架
- 分组：教程目录
## 1. ResourceManager核心参数

针对 ResourceManager 主节点来说，需要设置调度器类型及请求线程数据量：

- **参数一：yarn.resourcemanager.scheduler.class**
- 设置 YARN 使用调度器，默认值：（不同版本 YARN，值不一样）

Apache 版本 YARN ，默认值为容量调度器；

org.apache.hadoop.yarn.server.resourcemanager.scheduler.capacity.CapacityScheduler
- CDH 版本 YARN ，默认值为公平调度器；

org.apache.hadoop.yarn.server.resourcemanager.scheduler.fair.FairScheduler

**参数二：yarn.resourcemanager.scheduler.client.thread-count**

ResourceManager 处理调度器请求的线程数量，默认 50，如果 YARN 运行任务 Job 比较多，可以将值调整大一下；

## 2. NodeManager核心参数

NodeManager 运行在每台机器上，负责具体的资源管理。

**参数一：yarn.nodemanager.resource.detect-hardware-capabilities**

是否让 YARN 自己检测硬件进行配置，默认 false，如果设置为 true，那么就会自动探测 NodeManager 所在主机的内存和 CPU；

**参数二：yarn.nodemanager.resource.count-logical-processors-as-cores**

是否将虚拟核数当作 CPU 核数，默认 false；

**参数三：yarn.nodemanager.resource.pcores-vcores-multiplier**

虚拟核数和物理核数乘数，例如：4 核 8 线程，该参数就应设为 2，默认 1.0；

**参数四：yarn.nodemanager.resource.memory-mb**

NodeManager 使用内存，默认 8G；

**参数五：yarn.nodemanager.resource.system-reserved-memory-mb**

此参数，仅仅当上述参数一为 true 和参数四为 -1 时，设置才生效；

默认值：20% of (system memory - 2*HADOOP_HEAPSIZE)

**参数六：yarn.nodemanager.resource.cpu-vcores**

NodeManager 使用 CPU 核数，默认 8 个；

**参数七：其他参数，使用默认值即可**

参数：yarn.nodemanager.pmem-check-enabled，是否开启物理内存检查限制 container，默认打开；

参数：yarn.nodemanager.vmem-check-enabled，是否开启虚拟内存检查限制 container，默认打开；

参数：yarn.nodemanager.vmem-pmem-ratio，虚拟内存物理内存比例，默认 2.1；

## 3. Contanier核心参数

当应用程序提交运行至 YARN 上时，无论是 AppMaster 运行，还是 Task（MapReduce 框架）或 Executor（Spark 框架）或 TaskManager（Flink 框架）运行，NodeManager 将资源封装在 Contanier 容器中，以便管理和监控，核心配置参数如下所示：

**参数一：yarn.scheduler.minimum-allocation-mb**

单个任务可申请的最少物理内存量，默认是 1024 (MB)，如果一个任务申请的物理内存量少于该值，则该对应的值改为这个数；

**参数二：yarn.scheduler.maximum-allocation-mb**

单个任务可申请的最多物理内存量，默认是 8192 (MB)；

**参数三：yarn.scheduler.minimum-allocation-vcores**

单个任务可申请的最小虚拟 CPU 个数，默认是 1，如果一个任务申请的 CPU 个数少于该数，则该对应的值改为这个数。

**参数四：yarn.scheduler.maximum-allocation-vcores**

单个任务可申请的最多虚拟 CPU 个数，默认是 4。
