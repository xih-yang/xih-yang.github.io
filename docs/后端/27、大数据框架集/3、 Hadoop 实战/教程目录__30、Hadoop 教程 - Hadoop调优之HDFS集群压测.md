# 30、Hadoop 教程 - Hadoop调优之HDFS集群压测
- 来源：https://ddkk.com/zhuanlan/bigdata/hadoop/3/30.html
- 分类：大数据框架
- 分组：教程目录
## 1. 为什么要进行集群压测

在企业中非常关心每天从Java后台拉取过来的数据，需要多久能上传到集群？消费者关心多久能从HDFS上拉取需要的数据？为了搞清楚HDFS的读写性能，生产环境上非常需要对集群进行压测。

HDFS的读写性能主要受网络和磁盘影响比较大。为了方便测试，将hadoop102、hadoop103、hadoop104虚拟机网络都设置为100mbps。

100Mbps单位是bit；10M/s单位是byte ; 1byte=8bit，100Mbps/8=12.5M/s。

使用如下python脚本测试网速：python -m SimpleHTTPServer

## 2. 测试HDFS写性能

### 2.1. 写测试底层原理

### 2.2. 测试内容：向HDFS集群写10个128M的文件

> hadoop jar /opt/module/hadoop-3.1.3/share/hadoop/mapreduce/hadoop-mapreduce-client-jobclient-3.1.3-tests.jar TestDFSIO -write -nrFiles 10 -fileSize 128MB
>
> INFO fs.TestDFSIO: ----- TestDFSIO ----- : write
>
> INFO fs.TestDFSIO: Date & time: Tue Feb 09 10:43:16 CST 2021
>
> INFO fs.TestDFSIO: Number of files: 10
>
> INFO fs.TestDFSIO: Total MBytes processed: 1280
>
> INFO fs.TestDFSIO: Throughput mb/sec: 1.61
>
> INFO fs.TestDFSIO: Average IO rate mb/sec: 1.9
>
> INFO fs.TestDFSIO: IO rate std deviation: 0.76
>
> INFO fs.TestDFSIO: Test exec time sec: 133.05
>
> INFO fs.TestDFSIO:

注意：nrFiles n为生成mapTask的数量，生产环境一般可通过hadoop103:8088查看CPU核数，设置为（CPU核数 - 1）

> Number of files：生成mapTask数量，一般是集群中（CPU核数-1），我们测试虚拟机就按照实际的物理内存-1分配即可
> Total MBytes processed：单个map处理的文件大小
> Throughput mb/sec:单个mapTak的吞吐量 计算方式：处理的总文件大小/每一个mapTask写数据的时间累加 集群整体吞吐量：生成mapTask数量*单个mapTak的吞吐量
> Average IO rate mb/sec::平均mapTak的吞吐量 计算方式：每个mapTask处理文件大小/每一个mapTask写数据的时间 全部相加除以task数量
> IO rate std deviation:方差、反映各个mapTask处理的差值，越小越均衡

### 2.3. 注意：如果测试过程中，出现异常

a.可以在yarn-site.xml中设置虚拟内存检测为false

```java
<!--是否启动一个线程检查每个任务正使用的虚拟内存量，如果任务超出分配值，则直接将其杀掉，默认是true -->
<property>
     <name>yarn.nodemanager.vmem-check-enabled</name>
     <value>false</value>
</property>
```

b.分发配置并重启Yarn集群

### 2.4. 测试结果分析

1）由于副本1就在本地，所以该副本不参与测试

一共参与测试的文件：10个文件 * 2个副本 = 20个

压测后的速度：1.61

实测速度：1.61M/s * 20个文件 ≈ 32M/s

三台服务器的带宽：12.5 + 12.5 + 12.5 ≈ 30m/s

所有网络资源都已经用满。

如果实测速度远远小于网络，并且实测速度不能满足工作需求，可以考虑采用固态硬盘或者增加磁盘个数。

2）如果客户端不在集群节点，那就三个副本都参与计算

## 3. 测试HDFS读性能

### 3.1. 测试内容：读取HDFS集群10个128M的文件

> hadoop jar /opt/module/hadoop-3.1.3/share/hadoop/mapreduce/hadoop-mapreduce-client-jobclient-3.1.3-tests.jar TestDFSIO -read -nrFiles 10 -fileSize 128MB
>
> 2021-02-09 11:34:15,847 INFO fs.TestDFSIO: ----- TestDFSIO ----- : read
>
> 2021-02-09 11:34:15,847 INFO fs.TestDFSIO: Date & time: Tue Feb 09 11:34:15 CST 2021
>
> 2021-02-09 11:34:15,847 INFO fs.TestDFSIO: Number of files: 10
>
> 2021-02-09 11:34:15,847 INFO fs.TestDFSIO: Total MBytes processed: 1280
>
> 2021-02-09 11:34:15,848 INFO fs.TestDFSIO: Throughput mb/sec: 200.28
>
> 2021-02-09 11:34:15,848 INFO fs.TestDFSIO: Average IO rate mb/sec: 266.74
>
> 2021-02-09 11:34:15,848 INFO fs.TestDFSIO: IO rate std deviation: 143.12
>
> 2021-02-09 11:34:15,848 INFO fs.TestDFSIO: Test exec time sec: 20.83

### 3.2. 删除测试生成数据

> hadoop jar /opt/module/hadoop-3.1.3/share/hadoop/mapreduce/hadoop-mapreduce-client-jobclient-3.1.3-tests.jar TestDFSIO -clean

### 3.3. 测试结果分析

为什么读取文件速度大于网络带宽？由于目前只有三台服务器，且有三个副本，数据读取就近原则，相当于都是读取的本地磁盘数据，没有走网络。
