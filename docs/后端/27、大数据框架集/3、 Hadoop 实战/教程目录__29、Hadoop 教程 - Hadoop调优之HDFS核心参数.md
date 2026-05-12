# 29、Hadoop 教程 - Hadoop调优之HDFS核心参数
- 来源：https://ddkk.com/zhuanlan/bigdata/hadoop/3/29.html
- 分类：大数据框架
- 分组：教程目录
## 1. NameNode内存生产配置

1）NameNode内存计算

> 每个文件块大概占用150byte，一台服务器128G内存为例，能存储多少文件块呢？
>
> 128 * 1024 * 1024 * 1024 / 150Byte ≈ 9.1亿
>
> GB MB KB Byte

2）Hadoop2.x系列，配置NameNode内存

NameNode内存默认2000m，如果服务器内存4G，NameNode内存可以配置3g。在hadoop-env.sh文件中配置如下。

> HADOOP_NAMENODE_OPTS=-Xmx3072m

3）Hadoop3.x系列，配置NameNode内存

a.hadoop-env.sh中描述Hadoop的内存是动态分配的

> # The maximum amount of heap to use (Java -Xmx). If no unit
>
> # is provided, it will be converted to MB. Daemons will
>
> # prefer any Xmx setting in their respective _OPT variable.
>
> # There is no default; the JVM will autoscale based upon machine
>
> # memory size.
>
> # export HADOOP_HEAPSIZE_MAX=
>
> # The minimum amount of heap to use (Java -Xms). If no unit
>
> # is provided, it will be converted to MB. Daemons will
>
> # prefer any Xms setting in their respective _OPT variable.
>
> # There is no default; the JVM will autoscale based upon machine
>
> # memory size.
>
> # export HADOOP_HEAPSIZE_MIN=
>
> HADOOP_NAMENODE_OPTS=-Xmx102400m

b.查看NameNode占用内存

> 执行命令： jmap -heap 2744
>
> Heap Configuration:
>
> MaxHeapSize = 1031798784 (984.0MB)

查看发现bigdata1上的NameNode和DataNode占用内存都是自动分配的，且相等。不是很合理。

经验参考：[Hardware Requirements | 6.x | Cloudera Documentation](https://docs.cloudera.com/documentation/enterprise/6/release-notes/topics/rg_hardware_requirements.html#concept_fzz_dq4_gbb)

具体修改：hadoop-env.sh

> export HDFS_NAMENODE_OPTS="-Dhadoop.security.logger=INFO,RFAS -Xmx1024m"
>
> export HDFS_DATANODE_OPTS="-Dhadoop.security.logger=ERROR,RFAS -Xmx1024m"

## 2. NameNode心跳并发配置

1）hdfs-site.xml

> The number of Namenode RPC server threads that listen to requests from clients. If dfs.namenode.servicerpc-address is not configured then Namenode RPC server threads listen to requests from all nodes.
>
> NameNode有一个工作线程池，用来处理不同DataNode的并发心跳以及客户端并发的元数据操作。
>
> 对于大集群或者有大量客户端的集群来说，通常需要增大该参数。默认值是10。
>
>
>
> dfs.namenode.handler.count
>
> 21

企业经验：dfs.namenode.handler.count= ，比如集群规模（DataNode台数）为3台时，此参数设置为21。

## 3. 开启回收站配置

开启回收站功能，可以将删除的文件在不超时的情况下，恢复原数据，起到防止误删除、备份等作用。

### 3.1. 回收站工作机制

### 3.2. 开启回收站功能参数说明

1）默认值fs.trash.interval = 0，0表示禁用回收站；其他值表示设置文件的存活时间。

2）默认值fs.trash.checkpoint.interval = 0，检查回收站的间隔时间。如果该值为0，则该值设置和fs.trash.interval的参数值相等。

3）要求fs.trash.checkpoint.interval <= fs.trash.interval。

### 3.3. 启用回收站

修改core-site.xml，配置垃圾回收时间为1分钟。

```java
<property>
    <name>fs.trash.interval</name>
    <value>1</value>
</property>
```

### 3.4. 查看回收站

回收站目录在HDFS集群中的路径：/user/hdfs/.Trash/….

注意：通过网页上直接删除的文件也不会走回收站。

### 3.5. 其他删除方式

1）通过程序删除的文件不会经过回收站，需要调用moveToTrash()才进入回收站

```java
Trash trash = New Trash(conf);
trash.moveToTrash(path);
```

2）只有在命令行利用hadoop fs -rm命令删除的文件才会走回收站。

```java
hadoop fs -rm -r /user/root/input
2022-05-05 16:13:42,643 INFO fs.TrashPolicyDefault: Moved: 'hdfs://bigdata1:9820/user/root/input' to trash at: hdfs://bigdata1:9820/user/root/.Trash/Current/user/root/input
```

### 3.6. 恢复回收站数据

```java
hadoop fs -mv /user/root/.Trash/Current/user/root/input    /user/root/input
```
