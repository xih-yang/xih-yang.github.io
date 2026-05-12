# 06、Hadoop 教程 - Hadoop HDFS NAMENODE 安全模式## 1. HDFS NAMENODE 安全模式
- 来源：https://ddkk.com/zhuanlan/bigdata/hadoop/2/6.html
- 分类：大数据框架
- 分组：教程目录
### 1.1 场景：安全模式探究

HDFS 集群在停机状态下，使用`hdfs –daemon`命令逐个进程启动集群，观察现象。

首先启动 namenode：`hdfs --daemon start namenode`，然后依次执行浏览文件系统和创建文件夹操作，现象如下，发现集群可以查看目录结构但是无法新增目录。

打开 HDFS 集群 web 页面可以发现如下提示：

提示说：已经汇报的数据块的比例没有达到阈值。阈值为总数量块的 0.999。

接下来，启动第一台机器上的 Datanode 进程：`hdfs --daemon start datanode`，继续查看页面提示信息。

此时执行创建文件夹操作，发现可以创建成功了。

可以发现在安全模式下，我们可以浏览文件系统目录层次结构，但是却无法创建文件夹，**安全模式下的文件系统似乎处于一种可读不可下的特殊状态。**

### 1.2 安全模式概述

Hadoop 中的`安全模式safe mode是NameNode的维护状态`，在此状态下 NameNode 不允许对文件系统进行任何更改，可以接受读数据请求。

在NameNode 启动过程中，首先会从 fsimage 和 edits 日志文件加载文件系统状态。然后，等待 DataNodes 汇报可用的 block 信息。在此期间，NameNode 保持在安全模式。随着 DataNode 的 block 汇报持续进行，当整个系统达到安全标准时，HDFS 自动离开安全模式。在 NameNode Web 主页上会显示安全模式是打开还是关闭。

如果 HDFS 处于安全模式下，不允许 HDFS 客户端进行任何修改文件的操作，包括上传文件，删除文件，重命名，创建文件夹，修改副本数等操作。

### 1.3 安全模式自动进入离开

#### 1.3.1 自动进入时间

HDFS 集群启动时，当 NameNode 启动成功之后，此时集群就会自动进入安全模式。

#### 1.3.2 自动离开条件

安全模式相关的配置属性参数都在`hdfs-default.xml`中定义，如果需要覆盖任何值，请在`hdfs-site.xml`文件中重新覆盖定义。

- dfs.replication
- hdfs block 的副本数据，默认 3
- dfs.replication.max
- 最大块副本数，默认 512
- dfs.namenode.replication.min
- 最小块副本数，默认 1
- dfs.namenode.safemode.threshold-pct
- 已汇报可用数据块数量占整体块数量的百分比阈值。默认 0.999f。

小于或等于 0，则表示退出安全模式之前，不要等待特定百分比的块。大于 1 的值将使安全模式永久生效。
- dfs.namenode.safemode.min.datanodes
- 指在退出安全模式之前必须存活的 DataNode 数量，默认 0
- dfs.namenode.safemode.extension
- 达到阈值条件后持续扩展的时间。倒计时结束如果依然满足阈值条件，自动离开安全模式。默认 30000 毫秒

### 1.4 安全模式手动进入离开

#### 1.4.1 手动获取安全模式状态信息

`hdfs dfsadmin -safemode get`

#### 1.4.2 手动进入命令

`hdfs dfsadmin -safemode enter`

手动进入安全模式对于集群维护或者升级的时候非常有用，因为这时候 HDFS 上的数据是只读的。

#### 1.4.3 手动离开命令

`hdfs dfsadmin -safemode leave`
