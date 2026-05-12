# 04、HDFS 教程 - NameNode 工作机制
- 来源：https://ddkk.com/zhuanlan/filestorage/hdfs/1/4.html
- 分类：分布式存储
- 分组：教程目录
## 4. NameNode 工作机制

### 4.1 NameNode、Fsimage 、Edits 和 SecondaryNameNode 概述

**NameNode**：在内存中储存 HDFS 文件的元数据信息（目录）

如果节点故障或断电，存在内存中的数据会丢失，显然只在内存中保存是不可靠的

实际在磁盘当中也有保存：Fsimage 和 Edits，一个 NameNode 节点在重启后会根据这磁盘上的这两个文件来恢复到之前的状态

**Fsimage（镜像文件） 和 Edits（编辑日志）**：记录内存中的元数据

如果每次对 HDFS 的操作都实时的把内存中的元数据信息往磁盘上传输，这样显然效率不够高，也不稳定

这时就出现了 Edits 文件，用来记录每次对 HDFS 的操作，这样在磁盘上每次就只用做很小改动（只进行追加操作）

当Edits 文件达到了一定大小或过了一定的时间，就需要把 Edits 文件转化 Fsimage 文件，然后清空 Edits

这样的Fsimage 文件不会和内存中的元数据实时同步，需要加上 Edits 文件才相等

**SecondaryNameNode**：负责 Edits 转化成 Fsimage

SecondaryNameNode 不是 NameNode 的备份

SecondaryNameNode 会定时定量的把集群中的 Edits 文件转化为 Fsimage 文件，来保证 NameNode 中数据的可靠性

### 4.2 NameNode & Secondary NameNode 工作机制

#### 4.2.1 第一阶段：Namenode 启动

**1、** 第一次启动Namenode格式化后，创建fsimage和edits文件，如果不是第一次启动，直接加载编辑日志和镜像文件到内存；

**2、** 客户端对元数据进行增删改的请求；

**3、** Namenode记录操作日志，追加滚动日志；

**4、** Namenode在内存中对数据进行增删改查；

#### 4.2.2 第二阶段：Secondary NameNode 工作

**1、** SecondaryNameNode询问Namenode是否需要checkpoint，直接带回Namenode是否检查结果；

**2、** SecondaryNameNode请求执行checkpoint；

**3、** Namenode滚动正在写的edits日志；

**4、** 将滚动前的编辑日志和镜像文件拷贝到SecondaryNameNode；

**5、** SecondaryNameNode加载编辑日志和镜像文件到内存，并合并；

**6、** 生成新的镜像文件fsimage.chkpoint；

**7、** 拷贝fsimage.chkpoint到Namenode；

**8、** Namenode将fsimage.chkpoint重新命名成fsimage；

#### 4.2.3 web 端访问 SecondaryNameNode

**1、** 启动集群；

**2、** 浏览器中输入：http://slave1:50090/status.html；

**3、** 查看SecondaryNameNode信息；

#### 4.2.4 chkpoint检查时间参数设置

[hdfs-default.xml]

**1、** 通常情况下，SecondaryNameNode每隔一小时执行一次；

```java
<property>
    <name>dfs.namenode.checkpoint.period</name>
    <value>3600</value>
</property>
```

**1、** 一分钟检查一次操作次数，当操作次数达到一百万时，SecondaryNameNode执行一次；

```java
<property>
    <name>dfs.namenode.checkpoint.txns</name>
    <value>1000000</value>
    <description>操作动作次数</description>
</property>
<property>
    <name>dfs.namenode.checkpoint.check.period</name>
    <value>60</value>
    <description> 1分钟检查一次操作次数</description>
</property>
```

### 4.3 镜像文件和编辑日志文件

#### 4.3.1 概念

Namenode 被格式化之后，将在 /usr/local/hadoop/tmp/dfs/name/current 目录中产生如下文件：

edits_0000000000000000000

fsimage_0000000000000000000.md5

seen_txid

VERSION

**1、****Fsimage文件**：HDFS文件系统元数据的一个永久性的检查点，其中包含HDFS文件系统的所有目录和文件idnode的序列化信息；

**2、****Edits文件**：存放HDFS文件系统的所有更新操作的路径，文件系统客户端执行的所有写操作首先会被记录到edits文件中；

**3、****seen_txid文件**：保存的是一个数字，就是最后一个edits_的数字；

**4、** 每次Namenode启动的时候都会将fsimage文件读入内存，并从00001开始到seen_txid中记录的数字依次执行每个edits里面的更新操作，保证内存中的元数据信息是最新的、同步的，可以看成Namenode启动的时候就将fsimage和edits文件进行了合并；

#### 4.3.2 oiv 查看 fsimage 文件

**1、** 查看oiv和oev命令；

```java
[root@master current]$ hdfs
oiv	apply the offline fsimage viewer to an fsimage
oev	apply the offline edits viewer to an edits file
```

**1、** 基本语法；

hdfs oiv -p 文件类型 -i 镜像文件 -o 转换后文件输出路径

**1、** 案例实操；

```java
[root@master current]# pwd
/usr/local/hadoop/tmp/dfs/name/current
[root@master current]# hdfs oiv -p XML -i fsimage_0000000000000002141 -o /usr/hadoop/fsimage.xml
20/03/04 20:44:45 INFO offlineImageViewer.FSImageHandler: Loading 5 strings
[root@master current]# cat /usr/hadoop/fsimage.xml
```

将显示的 xml 文件内容格式化 查看 （可看到 Hdfs 上各个文件目录信息）

#### 4.3.3 oev 查看 edits 文件

**1、** 基本语法；

hdfs oev -p 文件类型 -i 编辑日志 -o 转换后文件输出路径

**1、** 案例实操；

```java
[root@master current]# hdfs oev -p XML -i edits_0000000000000002491-0000000000000002492 -o /usr/hadoop/edits.xml
[root@master current]# cat /usr/hadoop/edits.xml
```

将显示的 xml 文件内容格式化 查看

### 4.4 滚动编辑日志

正常情况 HDFS 文件系统有更新操作时，就会滚动编辑日志，也可以用命令强制滚动编辑日志

**1、** 滚动编辑日志（前提必须启动集群）；

```java
[root@master current]# hdfs dfsadmin -rollEdits
Successfully rolled edit logs.
New segment starts at txid 2507
```

**1、** 镜像文件什么时候产生；

Namenode 启动时加载镜像文件和编辑日志

### 4.5 Namenode 版本号

#### 4.5.1 查看 Namenode 版本号

在/usr/local/hadoop/tmp/dfs/name/current 这个目录下查看 VERSION

```java
[root@master current]# cat VERSION 
#Wed Mar 04 17:53:02 CST 2020
namespaceID=866472014
clusterID=CID-f383d6c4-da30-47c7-beb6-02c589c47f27
cTime=1582684942545
storageType=NAME_NODE
blockpoolID=BP-116957957-192.168.27.101-1582684942545
layoutVersion=-63
```

#### 4.5.2 Namenode 版本号具体解释

**1、****NamespaceID**在HDFS上，会有多个Namenode，所以不同Namenode的namespaceID是不同的，分别管理一组blockpoolID；

**2、****clusterID**集群id，全局唯一；

**3、****cTime**属性标记了Namenode存储系统的创建时间，对于刚刚格式化的存储系统，这个属性为0；但是在文件系统升级之后，该值会更新到新的时间戳；

**4、****storageType**属性说明该存储目录包含的是Namenode的数据结构；

**5、****blockpoolID**：一个blockpoolid标识一个blockpool，并且是跨集群的全局唯一当一个新的Namespace被创建的时候(format过程的一部分)会创建并持久化一个唯一ID在创建过程构建全局唯一的BlockPoolID比人为的配置更可靠一些NN将BlockPoolID持久化到磁盘中，在后续的启动过程中，会再次load并使用；

**6、****layoutVersion**是一个负整数，通常只有HDFS增加新特性时才会更新这个版本号；

### 4.6 SecondaryNameNode 目录结构

Secondary NameNode 用来监控 HDFS 状态的辅助后台程序，每隔一段时间获取 HDFS 元数据的快照

在slave2 机器上的 /usr/local/hadoop/tmp/dfs/namesecondary/current 这个目录中查看 SecondaryNameNode 目录结构

```java
[root@slave1 current]# pwd
/usr/local/hadoop/tmp/dfs/namesecondary/current
[root@slave1 current]# ll
total 1060
-rw-r--r--. 1 root root 1048576 Mar  4 23:05 edits_0000000000000002749-0000000000000002749
-rw-r--r--. 1 root root      42 Mar  4 23:05 edits_0000000000000002750-0000000000000002751
-rw-r--r--. 1 root root      42 Mar  5 15:21 edits_0000000000000002781-0000000000000002782
-rw-r--r--. 1 root root    4115 Mar  5 15:21 fsimage_0000000000000002780
-rw-r--r--. 1 root root      62 Mar  5 15:21 fsimage_0000000000000002780.md5
-rw-r--r--. 1 root root    4115 Mar  5 15:21 fsimage_0000000000000002782
-rw-r--r--. 1 root root      62 Mar  5 15:21 fsimage_0000000000000002782.md5
-rw-r--r--. 1 root root     217 Mar  5 15:21 VERSION
```

SecondaryNameNode 的 namesecondary/current 目录和主 Namenode 的 current 目录的布局相同

**好处**：在主 Namenode 发生故障时（假设没有及时备份数据），可以从 SecondaryNameNode 恢复数据

#### 4.6.1 Namenode 故障恢复方法一

将SecondaryNameNode 中数据拷贝到 Namenode 存储数据的目录

**案例实操：模拟 Namenode 故障，并采用方法一，恢复 Namenode 数据**

**1、** kill-9namenode进程([-9表示无条件终止](https://blog.csdn.net/yushouxiang2014/article/details/82876405))；

**2、** 删除Namenode存储的数据（/usr/local/hadoop/tmp/dfs/name）；

```java
rm -rf /usr/local/hadoop/tmp/dfs/name/*
```

打开 http://master:50070/ 无法访问
**3、** 拷贝SecondaryNameNode中数据到原Namenode存储数据目录；

```java
[root@slave1 dfs]# scp -r /usr/local/hadoop/tmp/dfs/namesecondary/* master:/usr/local/hadoop/tmp/dfs/name/
edits_0000000000000002749-0000000000000002749                100% 1024KB   1.0MB/s   00:00    
edits_0000000000000002750-0000000000000002751                100%   42     0.0KB/s   00:00    
VERSION                                                      100%  217     0.2KB/s   00:00    
fsimage_0000000000000002780.md5                              100%   62     0.1KB/s   00:00    
fsimage_0000000000000002780                                  100% 4115     4.0KB/s   00:00    
edits_0000000000000002781-0000000000000002782                100%   42     0.0KB/s   00:00    
fsimage_0000000000000002782.md5                              100%   62     0.1KB/s   00:00    
fsimage_0000000000000002782                                  100% 4115     4.0KB/s   00:00    
in_use.lock
```

**4、** 重新启动Namenode；

```java
sbin/hadoop-daemon.sh start namenode
```

打开 http://master:50070/ 可以访问，并可操作 Hdfs

#### 4.6.2 Namenode 故障恢复方法二

使用-importCheckpoint 选项启动 Namenode 守护进程，从而将 SecondaryNameNode 用作新的主 Namenode

**案例实操：模拟 Namenode 故障，并采用方法二，恢复 Namenode 数据**

**1、** 修改hdfs-site.xml中的；

```java
<property>
    <name>dfs.namenode.checkpoint.period</name>
    <value>120</value>
</property>
```

**2、** kill-9namenode进程；

**3、** 删除Namenode存储的数据（/usr/local/hadoop/tmp/dfs/name）；

```java
rm -rf /usr/local/hadoop/tmp/dfs/name/*
```

打开 http://master:50070/ 无法访问
**4、** 如果SecondaryNameNode不和Namenode在一个主机节点上，需要将SecondaryNameNode存储数据的目录拷贝到Namenode存储数据的平级目录；

```java
[root@master dfs]# pwd
/usr/local/hadoop/tmp/dfs
[root@master dfs]# ls
name  namesecondary
```

**5、** 导入检查点数据（等待一会ctrl+c结束掉）；

```java
bin/hdfs namenode -importCheckpoint
```

**6、** 启动Namenode；

```java
sbin/hadoop-daemon.sh start namenode
```

**7、** 如果提示文件锁了，可以删除in_use.lock；

```java
rm -rf /usr/local/hadoop/tmp/dfs/namesecondary/in_use.lock
```

### 4.7 集群安全模式操作

#### 4.7.1 概述

Namenode 启动时，首先将映像文件（fsimage）载入内存，并执行编辑日志（edits）中的各项操作

一旦在内存中成功建立文件系统元数据的映像，则创建一个新的 fsimage 文件和一个空的编辑日志，此时 Namenode 开始监听 Datanode 请求

但是此刻，Namenode 运行在安全模式，即 Namenode 的文件系统对于客户端来说是只读的

系统中的数据块的位置并不是由 Namenode 维护的，而是以块列表的形式存储在 Datanode 中

在系统的正常操作期间，Namenode 会在内存中保留所有块位置的映射信息

在安全模式下，各个 Datanode 会向 Namenode 发送最新的块列表信息，Namenode 了解到足够多的块位置信息之后，即可高效运行文件系统

如果满足“最小副本条件”，Namenode 会在30秒钟之后就退出安全模式

所谓的最小副本条件指的是在整个文件系统中99.9%的块满足最小副本级别（默认值：dfs.replication.min=1）

在启动一个刚刚格式化的 HDFS 集群时，因为系统中还没有任何块，所以 Namenode 不会进入安全模式

#### 4.7.2 基本语法

集群处于安全模式，不能执行重要操作（写操作），集群启动完成后，自动退出安全模式。

**1、** bin/hdfsdfsadmin-safemodeget（功能描述：查看安全模式状态）；

**2、** bin/hdfsdfsadmin-safemodeenter（功能描述：进入安全模式状态）；

**3、** bin/hdfsdfsadmin-safemodeleave（功能描述：离开安全模式状态）；

**4、** bin/hdfsdfsadmin-safemodewait（功能描述：等待安全模式状态）；

#### 4.7.3 案例

模拟等待安全模式

**1、** 先进入安全模式；

```java
bin/hdfs dfsadmin -safemode enter
```

安全模式下只可查看 Hdfs 文件，无法新增、删除
**2、** 执行下面的脚本；

编辑一个脚本

```java
#!/bin/bash
bin/hdfs dfsadmin -safemode wait
bin/hdfs dfs -put ~/hello.txt /root/hello.txt
```

**3、** 再打开一个窗口，执行；

```java
bin/hdfs dfsadmin -safemode leave
```

### 4.8 Namenode 多目录配置

Namenode 的本地目录可以配置成多个，且每个目录存放内容相同，增加了可靠性

具体配置如下：

**[hdfs-site.xml]**

```java
<property>
    <name>dfs.namenode.name.dir</name>
    <value>file:///${hadoop.tmp.dir}/dfs/name1,file:///${hadoop.tmp.dir}/dfs/name2</value>
</property>
```
