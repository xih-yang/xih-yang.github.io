# 34、Hadoop 教程 - Hadoop调优之HDFS故障排除
- 来源：https://ddkk.com/zhuanlan/bigdata/hadoop/3/34.html
- 分类：大数据框架
- 分组：教程目录
## 1. NameNode故障处理

**1）需求：NameNode进程挂了并且存储的数据也丢失了，如何恢复NameNode**

**2）故障模拟**

> kill -9 NameNode进程

```java
kill -9 19886
```

> 删除NameNode存储的数据（/opt/module/hadoop-3.1.3/data/tmp/dfs/name）

```java
rm -rf /opt/module/hadoop-3.1.3/data/dfs/name/*
```

**3）问题解决**

> 拷贝SecondaryNameNode中数据到原NameNode存储数据目录

```java
scp -r root@hadoop104:/opt/module/hadoop-3.1.3/data/dfs/namesecondary/* ./name/
```

> 重新启动NameNode

```java
hdfs --daemon start namenode
```

> 向集群上传一个文件用了验证集群是否修复

## 2. 集群安全模式&磁盘修复

### 2.1. 安全模式概述

**1）安全模式：**

> 文件系统只接受读数据请求，而不接受删除、修改等变更请求

**2）进入安全模式场景：**

> NameNode在加载镜像文件和编辑日志期间处于安全模式；
> NameNode再接收DataNode注册时，处于安全模式

**3）退出安全模式条件**

> dfs.namenode.safemode.min.datanodes:最小可用datanode数量，默认0
> dfs.namenode.safemode.threshold-pct:副本数达到最小要求的block占系统总block数的百分比，默认0.999f。（只允许丢一个块）
> dfs.namenode.safemode.extension:稳定时间，默认值30000毫秒，即30秒

**4）基本语法**

> 集群处于安全模式，不能执行重要操作（写操作）。集群启动完成后，自动退出安全模式。

> （1）bin/hdfs dfsadmin -safemode get （功能描述：查看安全模式状态）
> （2）bin/hdfs dfsadmin -safemode enter （功能描述：进入安全模式状态）
> （3）bin/hdfs dfsadmin -safemode leave （功能描述：离开安全模式状态）
> （4）bin/hdfs dfsadmin -safemode wait （功能描述：等待安全模式状态）

### 2.2. 案例1：启动集群进入安全模式

1）重新启动集群

```java
hadoop.sh stop
hadoop.sh start
```

2）集群启动后，立即来到集群上删除数据，提示集群处于安全模式

### 2.3. 案例2：磁盘修复

**当数据块损坏，进入安全模式时，如何处理？**

**1）删除块信息**

> 分别进入hadoop102、hadoop103、hadoop104的/opt/module/hadoop-3.1.3/data/dfs/data/current/BP-1015489500-192.168.10.102-1611909480872/current/finalized/subdir0/subdir0目录，统一删除某2个块信息

```java
$ pwd
/opt/module/hadoop-3.1.3/data/dfs/data/current/BP-1015489500-192.168.10.102-161190
$ rm -rf blk_1073741847 blk_1073741847_1023.meta
$ rm -rf blk_1073741865 blk_1073741865_1042.meta
```

> 说明：hadoop103/hadoop104重复执行以上命令

**2）重新启动集群**

```java
hadoop.sh stop
hadoop.sh start
```

**3）观察http://hadoop102:9870/dfshealth.html#tab-overview**

> 说明：安全模式已经打开，块的数量没有达到要求。

**4）离开安全模式**

```java
$ hdfs dfsadmin -safemode get
Safe mode is ON
$ hdfs dfsadmin -safemode leave
Safe mode is OFF
```

**5）观察http://hadoop102:9870/dfshealth.html#tab-overview**

**6）将元数据删除**

**7）观察http://hadoop102:9870/dfshealth.html#tab-overview，集群已经正常**

### 2.4. 案例3：模拟等待安全模式

**1）查看当前模式**

```java
hdfs dfsadmin -safemode get
Safe mode is OFF
```

**2）先进入安全模式**

```java
bin/hdfs dfsadmin -safemode enter
```

**3）创建并执行下面的脚本**

> 在/opt/module/hadoop-3.1.3路径上，编辑一个脚本safemode.sh

```java
$ vim safemode.sh
/bin/bash
hdfs dfsadmin -safemode wait
hdfs dfs -put /opt/module/hadoop-3.1.3/README.txt /
$ chmod 777 safemode.sh
$ ./safemode.sh 
```

**4）再打开一个窗口，执行**

```java
bin/hdfs dfsadmin -safemode leave
```

**5）再观察上一个窗口**

```java
Safe mode is OFF
```

**6）HDFS集群上已经有上传的数据了**

## 3. 慢磁盘监控

“慢磁盘”指的时写入数据非常慢的一类磁盘。其实慢性磁盘并不少见，当机器运行时间长了，上面跑的任务多了，磁盘的读写性能自然会退化，严重时就会出现写入数据延时的问题。

那又是如何发现慢磁盘呢？正常在HDFS上创建一个目录，只需要不到1s的时间。如果你发现创建目录超过1分钟及以上，而且这个现象并不是每次都有。只是偶尔慢了一下，就很有可能存在慢磁盘。

可以采用如下方法找出是哪块磁盘慢：

**1）通过心跳未联系时间。**

> 一般出现慢磁盘现象，会影响到DataNode与NameNode之间的心跳。正常情况心跳时间间隔是3s。超过3s说明有异常。

**2）fio命令，测试磁盘的读写性能**

> a.顺序读测试

```java
如下为执行的命令
 sudo yum install -y fio
 sudo fio -filename=/home/atguigu/test.log -direct=1 -iodepth 1 -thread -rw=read -ioengine=psync -bs=16k -size=2G -numjobs=10 -runtime=60 -group_reporting -name=test_r
如下为显示的结果（其中 READ: bw=360MiB/s (378MB/s) 为速度）
Run status group 0 (all jobs):
   READ: bw=360MiB/s (378MB/s), 360MiB/s-360MiB/s (378MB/s-378MB/s), io=20.0GiB (21.5GB), run=56885-56885msec
结果显示，磁盘的总体顺序读速度为360MiB/s。
```

> b.顺序写测试

```java
如下为执行的命令
sudo fio -filename=/home/atguigu/test.log -direct=1 -iodepth 1 -thread -rw=write -ioengine=psync -bs=16k -size=2G -numjobs=10 -runtime=60 -group_reporting -name=test_w
如下为显示的结果（其中 WRITE: bw=341MiB/s (357MB/s) 为速度）
Run status group 0 (all jobs):
  WRITE: bw=341MiB/s (357MB/s), 341MiB/s-341MiB/s (357MB/s-357MB/s), io=19.0GiB (21.4GB), run=60001-60001msec
结果显示，磁盘的总体顺序写速度为341MiB/s。
```

> c.随机写测试

```java
如下为执行的命令
sudo fio -filename=/home/atguigu/test.log -direct=1 -iodepth 1 -thread -rw=randwrite -ioengine=psync -bs=16k -size=2G -numjobs=10 -runtime=60 -group_reporting -name=test_randw
如下为显示的结果（其中 WRITE: bw=309MiB/s (324MB/s) 为速度）
Run status group 0 (all jobs):
  WRITE: bw=309MiB/s (324MB/s), 309MiB/s-309MiB/s (324MB/s-324MB/s), io=18.1GiB (19.4GB), run=60001-60001msec
结果显示，磁盘的总体随机写速度为309MiB/s
```

> d.混合随机读写

```java
如下为执行的命令
sudo fio -filename=/home/atguigu/test.log -direct=1 -iodepth 1 -thread -rw=randrw -rwmixread=70 -ioengine=psync -bs=16k -size=2G -numjobs=10 -runtime=60 -group_reporting -name=test_r_w -ioscheduler=noop
如下为显示的结果（其中 READ: bw=220MiB/s (231MB/s) 和 WRITE: bw=94.6MiB/s (99.2MB/s) 为速度）
Run status group 0 (all jobs):
   READ: bw=220MiB/s (231MB/s), 220MiB/s-220MiB/s (231MB/s-231MB/s), io=12.9GiB (13.9GB), run=60001-60001msec
   WRITE: bw=94.6MiB/s (99.2MB/s), 94.6MiB/s-94.6MiB/s (99.2MB/s-99.2MB/s), io=5674MiB (5950MB), run=60001-60001msec
结果显示，磁盘的总体混合随机读写，读速度为220MiB/s，写速度94.6MiB/s。
```

## 4. 小文件归档

### 4.1. HDFS存储小文件弊端

每个文件均按块存储，每个块的元数据存储在NameNode的内存中，因此HDFS存储小文件会非常低效。因为大量的小文件会耗尽NameNode中的大部分内存。但注意，存储小文件所需要的磁盘容量和数据块的大小无关。例如，一个1MB的文件设置为128MB的块存储，实际使用的是1MB的磁盘空间，而不是128MB。

### 4.2. 解决存储小文件办法之一

HDFS存档文件或HAR文件，是一个更高效的文件存档工具，它将文件存入HDFS块，在减少NameNode内存使用的同时，允许对文件进行透明的访问。具体说来，HDFS存档文件对内还是一个一个独立文件，对NameNode而言却是一个整体，减少了NameNode的内存。

### 4.3. 实例操作

1）需要启动YARN进程

```java
start-yarn.sh
```

2）归档文件

> 把/input目录里面的所有文件归档成一个叫input.har的归档文件，并把归档后文件存储到/output路径下。

```java
hadoop archive -archiveName input.har -p  /input   /output
```

3）查看归档

```java
$ hadoop fs -ls /output/input.har
$ hadoop fs -ls har:///output/input.har
```

4）解归档文件

```java
$ hadoop fs -cp har:///output/input.har/*    /
```
