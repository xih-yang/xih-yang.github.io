# 38、Hadoop 教程 - Hadoop调优之综合调优
- 来源：https://ddkk.com/zhuanlan/bigdata/hadoop/3/38.html
- 分类：大数据框架
- 分组：教程目录
## 1. 需求

1）需求：从1G数据中，统计每个单词出现次数。服务器3台，每台配置4G内存，4核CPU，4线程

2）需求分析：

> 1G / 128m = 8个MapTask；1个ReduceTask；1个mrAppMaster 平均每个节点运行10个 / 3台 ≈ 3个任务（4 3 3）

## 2. HDFS参数调优

1）修改：hadoop-env.sh

> export HDFS_NAMENODE_OPTS="-Dhadoop.security.logger=INFO,RFAS -Xmx1024m"
>
> export HDFS_DATANODE_OPTS="-Dhadoop.security.logger=ERROR,RFAS -Xmx1024m"

2）修改hdfs-site.xml

> dfs.namenode.handler.count
> 21

3）修改core-site.xml

> fs.trash.interval
> 60

4）分发配置

```java
$ xsync hadoop-env.sh hdfs-site.xml core-site.xml
```

## 3. MapReduce参数调优

1）修改mapred-site.xml

```java
<!-- 环形缓冲区大小，默认100m -->
<property>
    <name>mapreduce.task.io.sort.mb</name>
    <value>100</value>
</property>
<!-- 环形缓冲区溢写阈值，默认0.8 -->
<property>
    <name>mapreduce.map.sort.spill.percent</name>
    <value>0.80</value>
</property>
<!-- merge合并次数，默认10个 -->
<property>
    <name>mapreduce.task.io.sort.factor</name>
    <value>10</value>
</property>
<!-- maptask内存，默认1g； maptask堆内存大小默认和该值大小一致mapreduce.map.java.opts -->
<property>
    <name>mapreduce.map.memory.mb</name>
    <value>-1</value>
    <description>The amount of memory to request from the scheduler for each map task. If this is not specified
        or is non-positive, it is inferred from mapreduce.map.java.opts and mapreduce.job.heap.memory-mb.ratio.
        If java-opts are also not specified, we set it to 1024.
    </description>
</property>
<!-- matask的CPU核数，默认1个 -->
<property>
    <name>mapreduce.map.cpu.vcores</name>
    <value>1</value>
</property>
<!-- matask异常重试次数，默认4次 -->
<property>
    <name>mapreduce.map.maxattempts</name>
    <value>4</value>
</property>
<!-- 每个Reduce去Map中拉取数据的并行数。默认值是5 -->
<property>
    <name>mapreduce.reduce.shuffle.parallelcopies</name>
    <value>5</value>
</property>
<!-- Buffer大小占Reduce可用内存的比例，默认值0.7 -->
<property>
    <name>mapreduce.reduce.shuffle.input.buffer.percent</name>
    <value>0.70</value>
</property>
<!-- Buffer中的数据达到多少比例开始写入磁盘，默认值0.66。 -->
<property>
    <name>mapreduce.reduce.shuffle.merge.percent</name>
    <value>0.66</value>
</property>
<!-- reducetask内存，默认1g；reducetask堆内存大小默认和该值大小一致mapreduce.reduce.java.opts -->
<property>
    <name>mapreduce.reduce.memory.mb</name>
    <value>-1</value>
    <description>The amount of memory to request from the scheduler for each reduce task. If this is not
        specified or is non-positive, it is inferred
        from mapreduce.reduce.java.opts and mapreduce.job.heap.memory-mb.ratio.
        If java-opts are also not specified, we set it to 1024.
    </description>
</property>
<!-- reducetask的CPU核数，默认1个 -->
<property>
    <name>mapreduce.reduce.cpu.vcores</name>
    <value>2</value>
</property>
<!-- reducetask失败重试次数，默认4次 -->
<property>
    <name>mapreduce.reduce.maxattempts</name>
    <value>4</value>
</property>
<!-- 当MapTask完成的比例达到该值后才会为ReduceTask申请资源。默认是0.05 -->
<property>
    <name>mapreduce.job.reduce.slowstart.completedmaps</name>
    <value>0.05</value>
</property>
<!-- 如果程序在规定的默认10分钟内没有读到数据，将强制超时退出 -->
<property>
    <name>mapreduce.task.timeout</name>
    <value>600000</value>
</property>
```

2）分发配置

```java
$ xsync mapred-site.xml
```

## 4. Yarn参数调优

1）修改yarn-site.xml配置参数如下：

```java
<!-- 选择调度器，默认容量 -->
<property>
    <description>The class to use as the resource scheduler.</description>
    <name>yarn.resourcemanager.scheduler.class</name>
    <value>org.apache.hadoop.yarn.server.resourcemanager.scheduler.capacity.CapacityScheduler</value>
</property>
<!-- ResourceManager处理调度器请求的线程数量,默认50；如果提交的任务数大于50，可以增加该值，但是不能超过3台 * 4线程 = 12线程（去除其他应用程序实际不能超过8） -->
<property>
    <description>Number of threads to handle scheduler interface.</description>
    <name>yarn.resourcemanager.scheduler.client.thread-count</name>
    <value>8</value>
</property>
<!-- 是否让yarn自动检测硬件进行配置，默认是false，如果该节点有很多其他应用程序，建议手动配置。如果该节点没有其他应用程序，可以采用自动 -->
<property>
    <description>Enable auto-detection of node capabilities such as
        memory and CPU.
    </description>
    <name>yarn.nodemanager.resource.detect-hardware-capabilities</name>
    <value>false</value>
</property>
<!-- 是否将虚拟核数当作CPU核数，默认是false，采用物理CPU核数 -->
<property>
    <description>Flag to determine if logical processors(such as
        hyperthreads) should be counted as cores. Only applicable on Linux
        when yarn.nodemanager.resource.cpu-vcores is set to -1 and
        yarn.nodemanager.resource.detect-hardware-capabilities is true.
    </description>
    <name>yarn.nodemanager.resource.count-logical-processors-as-cores</name>
    <value>false</value>
</property>
<!-- 虚拟核数和物理核数乘数，默认是1.0 -->
<property>
    <description>Multiplier to determine how to convert phyiscal cores to
        vcores. This value is used if yarn.nodemanager.resource.cpu-vcores
        is set to -1(which implies auto-calculate vcores) and
        yarn.nodemanager.resource.detect-hardware-capabilities is set to true. The number of vcores will be
        calculated as number of CPUs * multiplier.
    </description>
    <name>yarn.nodemanager.resource.pcores-vcores-multiplier</name>
    <value>1.0</value>
</property>
<!-- NodeManager使用内存数，默认8G，修改为4G内存 -->
<property>
    <description>Amount of physical memory, in MB, that can be allocated
        for containers. If set to -1 and
        yarn.nodemanager.resource.detect-hardware-capabilities is true, it is
        automatically calculated(in case of Windows and Linux).
        In other cases, the default is 8192MB.
    </description>
    <name>yarn.nodemanager.resource.memory-mb</name>
    <value>4096</value>
</property>
<!-- nodemanager的CPU核数，不按照硬件环境自动设定时默认是8个，修改为4个 -->
<property>
    <description>Number of vcores that can be allocated
        for containers. This is used by the RM scheduler when allocating
        resources for containers. This is not used to limit the number of
        CPUs used by YARN containers. If it is set to -1 and
        yarn.nodemanager.resource.detect-hardware-capabilities is true, it is
        automatically determined from the hardware in case of Windows and Linux.
        In other cases, number of vcores is 8 by default.
    </description>
    <name>yarn.nodemanager.resource.cpu-vcores</name>
    <value>4</value>
</property>
<!-- 容器最小内存，默认1G -->
<property>
    <description>The minimum allocation for every container request at the RM in MBs. Memory requests lower than
        this will be set to the value of this property. Additionally, a node manager that is configured to have
        less memory than this value will be shut down by the resource manager.
    </description>
    <name>yarn.scheduler.minimum-allocation-mb</name>
    <value>1024</value>
</property>
<!-- 容器最大内存，默认8G，修改为2G -->
<property>
    <description>The maximum allocation for every container request at the RM in MBs. Memory requests higher
        than this will throw an InvalidResourceRequestException.
    </description>
    <name>yarn.scheduler.maximum-allocation-mb</name>
    <value>2048</value>
</property>
<!-- 容器最小CPU核数，默认1个 -->
<property>
    <description>The minimum allocation for every container request at the RM in terms of virtual CPU cores.
        Requests lower than this will be set to the value of this property. Additionally, a node manager that is
        configured to have fewer virtual cores than this value will be shut down by the resource manager.
    </description>
    <name>yarn.scheduler.minimum-allocation-vcores</name>
    <value>1</value>
</property>
<!-- 容器最大CPU核数，默认4个，修改为2个 -->
<property>
    <description>The maximum allocation for every container request at the RM in terms of virtual CPU cores.
        Requests higher than this will throw an
        InvalidResourceRequestException.
    </description>
    <name>yarn.scheduler.maximum-allocation-vcores</name>
    <value>2</value>
</property>
<!-- 虚拟内存检查，默认打开，修改为关闭 -->
<property>
    <description>Whether virtual memory limits will be enforced for
        containers.
    </description>
    <name>yarn.nodemanager.vmem-check-enabled</name>
    <value>false</value>
</property>
<!-- 虚拟内存和物理内存设置比例,默认2.1 -->
<property>
    <description>Ratio between virtual memory to physical memory when setting memory limits for containers.
        Container allocations are expressed in terms of physical memory, and virtual memory usage is allowed to
        exceed this allocation by this ratio.
    </description>
    <name>yarn.nodemanager.vmem-pmem-ratio</name>
    <value>2.1</value>
</property>
```

2）分发配置

```java
$ xsync yarn-site.xml
```

## 5. 执行程序

1）重启集群

```java
$ sbin/stop-yarn.sh
$ sbin/start-yarn.sh
```

2）执行WordCount程序

```java
$ hadoop jar share/hadoop/mapreduce/hadoop-mapreduce-examples-3.1.3.jar wordcount /input /output
```

3）观察Yarn任务执行页面

[http://hadoop103:8088/cluster/apps](http://hadoop103:8088/cluster/apps)
