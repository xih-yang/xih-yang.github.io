# 182、故障排除和调试HBase：日志
- 来源：https://ddkk.com/zhuanlan/bigdata/hbase/182.html
- 分类：大数据框架
- 分组：教程目录
## 日志

关键进程日志如下…（将 替换为启动服务的用户，将 替换为计算机名称）

NameNode： `$` HADOOP_HOME / logs / hadoop- -namenode- .log

DataNode： `$` HADOOP_HOME / logs / hadoop- -datanode- .log

JobTracker： `$` HADOOP_HOME / logs / hadoop- -jobtracker- .log

TaskTracker： `$` HADOOP_HOME / logs / hadoop- -tasktracker- .log

HMaster： `$` HBASE_HOME / logs / hbase- -master- .log

RegionServer： `$` HBASE_HOME / logs / hbase- -regionserver- .log

ZooKeeper：TODO

### 日志位置

对于独立部署，日志显然将位于单个计算机上，但这只是一个开发配置。生产部署需要在群集上运行。

**NameNode**

NameNode日志位于NameNode服务器上。HBase Master通常在NameNode服务器上运行，也可以在ZooKeeper上运行。

对于较小的群集，JobTracker/ResourceManager通常也在NameNode服务器上运行。

**DataNode**

每个DataNode服务器都有一个HDFS的DataNode日志，以及HBase的RegionServer日志。

此外，每个DataNode服务器还将具有用于MapReduce任务执行的TaskTracker/NodeManager日志。

### 日志级别

**启用RPC级别日志记录**

在RegionServer上启用RPC级别日志记录通常可以深入了解服务器的计时。启用后，记录的日志量很大。建议您不要将此登录时间保留在短时间。要启用RPC级别日志记录，请浏览到RegionServer UI并单击“日志级别”。将日志级别设置为包org.apache.hadoop.ipc的DEBUG（这对于hadoop.ipc这是正确的，对于hbase.ipc不是）。然后尾随RegionServers日志、分析。

要禁用，请将日志记录级别设置回INFO级别。

### JVM垃圾回收日志

本节中的所有示例垃圾回收日志都基于Java 8输出。在Java 9和更新版本中引入统一的日志记录将导致非常不同的日志。

HBase是内存密集型的，使用默认的GC可以看到所有线程中的长时间暂停，包括Juliet Pause又名“GC of Death”。为了帮助调试或确认发生这种情况，可以在Java虚拟机中打开GC日志记录。

要在hbase-env.sh中启用，请取消注释以下行之一：

```java
# This enables basic gc logging to the .out file.
# export SERVER_GC_OPTS="-verbose:gc -XX:+PrintGCDetails -XX:+PrintGCDateStamps"
# This enables basic gc logging to its own file.
# export SERVER_GC_OPTS="-verbose:gc -XX:+PrintGCDetails -XX:+PrintGCDateStamps -Xloggc:<FILE-PATH>"
# This enables basic GC logging to its own file with automatic log rolling. Only applies to jdk 1.6.0_34+ and 1.7.0_2+.
# export SERVER_GC_OPTS="-verbose:gc -XX:+PrintGCDetails -XX:+PrintGCDateStamps -Xloggc:<FILE-PATH> -XX:+UseGCLogFileRotation -XX:NumberOfGCLogFiles=1 -XX:GCLogFileSize=512M"
# If <FILE-PATH> is not replaced, the log file(.gc) would be generated in the HBASE_LOG_DIR.
```

此时你应该看到这样的日志：

```java
64898.952: [GC [1 CMS-initial-mark: 2811538K(3055704K)] 2812179K(3061272K), 0.0007360 secs] [Times: user=0.00 sys=0.00, real=0.00 secs]
64898.953: [CMS-concurrent-mark-start]
64898.971: [GC 64898.971: [ParNew: 5567K->576K(5568K), 0.0101110 secs] 2817105K->2812715K(3061272K), 0.0102200 secs] [Times: user=0.07 sys=0.00, real=0.01 secs]
```

在本节中，第一行表示CMS最初标记的0.0007360秒暂停。这将暂停整个VM，该段时间内的所有线程。

第三行表示“次要GC”，暂停VM 0.0101110秒 – 也就是10毫秒。它将“ParNew”从大约5.5m减少到576k。在这个循环的后期，我们看到：

```java
64901.445: [CMS-concurrent-mark: 1.542/2.492 secs] [Times: user=10.49 sys=0.33, real=2.49 secs]
64901.445: [CMS-concurrent-preclean-start]
64901.453: [GC 64901.453: [ParNew: 5505K->573K(5568K), 0.0062440 secs] 2868746K->2864292K(3061272K), 0.0063360 secs] [Times: user=0.05 sys=0.00, real=0.01 secs]
64901.476: [GC 64901.476: [ParNew: 5563K->575K(5568K), 0.0072510 secs] 2869283K->2864837K(3061272K), 0.0073320 secs] [Times: user=0.05 sys=0.01, real=0.01 secs]
64901.500: [GC 64901.500: [ParNew: 5517K->573K(5568K), 0.0120390 secs] 2869780K->2865267K(3061272K), 0.0121150 secs] [Times: user=0.09 sys=0.00, real=0.01 secs]
64901.529: [GC 64901.529: [ParNew: 5507K->569K(5568K), 0.0086240 secs] 2870200K->2865742K(3061272K), 0.0087180 secs] [Times: user=0.05 sys=0.00, real=0.01 secs]
64901.554: [GC 64901.555: [ParNew: 5516K->575K(5568K), 0.0107130 secs] 2870689K->2866291K(3061272K), 0.0107820 secs] [Times: user=0.06 sys=0.00, real=0.01 secs]
64901.578: [CMS-concurrent-preclean: 0.070/0.133 secs] [Times: user=0.48 sys=0.01, real=0.14 secs]
64901.578: [CMS-concurrent-abortable-preclean-start]
64901.584: [GC 64901.584: [ParNew: 5504K->571K(5568K), 0.0087270 secs] 2871220K->2866830K(3061272K), 0.0088220 secs] [Times: user=0.05 sys=0.00, real=0.01 secs]
64901.609: [GC 64901.609: [ParNew: 5512K->569K(5568K), 0.0063370 secs] 2871771K->2867322K(3061272K), 0.0064230 secs] [Times: user=0.06 sys=0.00, real=0.01 secs]
64901.615: [CMS-concurrent-abortable-preclean: 0.007/0.037 secs] [Times: user=0.13 sys=0.00, real=0.03 secs]
64901.616: [GC[YG occupancy: 645 K (5568 K)]64901.616: [Rescan (parallel) , 0.0020210 secs]64901.618: [weak refs processing, 0.0027950 secs] [1 CMS-remark: 2866753K(3055704K)] 2867399K(3061272K), 0.0049380 secs] [Times: user=0.00 sys=0.01, real=0.01 secs]
64901.621: [CMS-concurrent-sweep-start]
```

第一行表示CMS并发标记（查找垃圾）花费了2.4秒。但这是一个并发的2.4秒，Java在任何时候都没有被暂停。

还有一些较小的GC，然后在最后一行停顿：

```java
64901.616: [GC[YG occupancy: 645 K (5568 K)]64901.616: [Rescan (parallel) , 0.0020210 secs]64901.618: [weak refs processing, 0.0027950 secs] [1 CMS-remark: 2866753K(3055704K)] 2867399K(3061272K), 0.0049380 secs] [Times: user=0.00 sys=0.01, real=0.01 secs]
```

这里的暂停是0.0049380秒（也就是4.9毫秒）来“注释”堆。

此时扫描开始，您可以观察到堆大小下降：

```java
64901.637: [GC 64901.637: [ParNew: 5501K->569K(5568K), 0.0097350 secs] 2871958K->2867441K(3061272K), 0.0098370 secs] [Times: user=0.05 sys=0.00, real=0.01 secs]
...  lines removed ...
64904.936: [GC 64904.936: [ParNew: 5532K->568K(5568K), 0.0070720 secs] 1365024K->1360689K(3061272K), 0.0071930 secs] [Times: user=0.05 sys=0.00, real=0.01 secs]
64904.953: [CMS-concurrent-sweep: 2.030/3.332 secs] [Times: user=9.57 sys=0.26, real=3.33 secs]
```

此时，CMS扫描需要3.332秒，堆从大约2.8 GB到大约1.3 GB（近似值）。

这里的关键点是保持所有这些暂停低。CMS暂停总是很低，但如果您的ParNew开始增长，您可以看到较小的GC暂停接近100ms，超过100ms并达到400ms的高位。

这可能是由于ParNew的大小，它应该相对较小。如果你的ParNew在运行HBase一段时间后非常大，在一个例子中ParNew大约是150MB，那么你可能不得不约束ParNew的大小（它越大，集合采取的时间越长，但是如果它太小，对象太快被提升为老一代）。在下面我们将新的基因大小限制在64m。

在hbase-env.sh中添加以下行：

```java
export SERVER_GC_OPTS="$SERVER_GC_OPTS -XX:NewSize=64m -XX:MaxNewSize=64m"
```

同样，要为客户端进程启用GC日志记录，请取消注释hbase-env.sh中的以下某行：

```java
# This enables basic gc logging to the .out file.
# export CLIENT_GC_OPTS="-verbose:gc -XX:+PrintGCDetails -XX:+PrintGCDateStamps"
# This enables basic gc logging to its own file.
# export CLIENT_GC_OPTS="-verbose:gc -XX:+PrintGCDetails -XX:+PrintGCDateStamps -Xloggc:<FILE-PATH>"
# This enables basic GC logging to its own file with automatic log rolling. Only applies to jdk 1.6.0_34+ and 1.7.0_2+.
# export CLIENT_GC_OPTS="-verbose:gc -XX:+PrintGCDetails -XX:+PrintGCDateStamps -Xloggc:<FILE-PATH> -XX:+UseGCLogFileRotation -XX:NumberOfGCLogFiles=1 -XX:GCLogFileSize=512M"
# If <FILE-PATH> is not replaced, the log file(.gc) would be generated in the HBASE_LOG_DIR .
```
