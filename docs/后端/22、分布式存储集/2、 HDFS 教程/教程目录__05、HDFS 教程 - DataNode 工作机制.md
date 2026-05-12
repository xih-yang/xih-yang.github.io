# 05、HDFS 教程 - DataNode 工作机制
- 来源：https://ddkk.com/zhuanlan/filestorage/hdfs/1/5.html
- 分类：分布式存储
- 分组：教程目录
## 5. DataNode 工作机制

### 5.1 DataNode工作机制

**1、** 一个数据块在Datanode上以文件形式存储在磁盘上，包括两个文件，一个是数据本身，一个是元数据包括数据块的长度，块数据的校验和，以及时间戳；

**2、** DataNode启动后向Namenode注册，通过后，周期性（1小时）的向Namenode上报所有的块信息；

**3、** 心跳是每3秒一次，心跳返回结果带有Namenode给该DataNode的命令如复制块数据到另一台机器，或删除某个数据块如果超过10分钟没有收到某个DataNode的心跳，则认为该节点不可用；

**4、** 集群运行中可以安全加入和退出一些机器；

### 5.2 数据完整性

**1、** 当DataNode读取block的时候，它会计算checksum；

**2、** 如果计算后的checksum，与block创建时值不一样，说明block已经损坏；

**3、** client读取其他DataNode上的block.；

**4、** DataNode在其文件创建后周期验证checksum；

### 5.3 掉线时限参数设置

Datanode 进程死亡或者网络故障造成 Datanode 无法与 Namenode 通信，Namenode 不会立即把该节点判定为死亡，要经过一段时间，这段时间暂称作**超时时长**

HDFS 默认的超时时长为 10分钟 + 30秒

如果定义超时时间为timeout，则超时时长的计算公式为：

> timeout = 2 * dfs.namenode.heartbeat.recheck-interval + 10 * dfs.heartbeat.interval。

而默认的 dfs.namenode.heartbeat.recheck-interval 大小为5分钟，dfs.heartbeat.interval默认为3秒

需要注意的是 hdfs-site.xml 配置文件中的 heartbeat.recheck.interval 的单位为毫秒，dfs.heartbeat.interval 的单位为秒

```java
<property>
    <name>dfs.namenode.heartbeat.recheck-interval</name>
    <value>300000</value>
</property>
<property>
    <name> dfs.heartbeat.interval </name>
    <value>3</value>
</property>
```

### 5.4 DataNode 的目录结构

和Namenode 不同的是，Datanode 的存储目录是初始阶段自动创建的，不需要额外格式化

#### 5.4.1 查看 DataNode 的版本号

在/usr/local/hadoop/tmp/dfs/data/current 这个目录下查看版本号

```java
[root@slave1 current]# cat VERSION 
#Fri Mar 06 16:58:36 CST 2020
storageID=DS-7908c807-e3ec-4b85-952a-922ba8d3a24f
clusterID=CID-f383d6c4-da30-47c7-beb6-02c589c47f27
cTime=0
datanodeUuid=f230ca32-5797-4949-b996-95bf66a25a0d
storageType=DATA_NODE
layoutVersion=-57
```

#### 5.4.2 DataNode 版本号具体解释

**1、****storageID**：存储id号；

**2、****clusterID**：集群id，全局唯一；

**3、****cTime**：标记了Datanode存储系统的创建时间，对于刚刚格式化的存储系统，这个属性为0；但是在文件系统升级之后，该值会更新到新的时间戳；

**4、****datanodeUuid**：Datanode的唯一识别码；

**5、****storageType**：存储类型；

**6、****layoutVersion**:是一个负整数，通常只有HDFS增加新特性时才会更新这个版本号；

#### 5.4.3 DataNode 数据块版本号

在/usr/local/hadoop/tmp/dfs/data/current/BP-116957957-192.168.27.101-1582684942545/current 这个目录下查看该数据块的版本号

```java
[root@slave1 current]# pwd
/usr/local/hadoop/tmp/dfs/data/current/BP-116957957-192.168.27.101-1582684942545/current
[root@slave1 current]# cat VERSION 
#Fri Mar 06 16:58:36 CST 2020
namespaceID=866472014
cTime=1582684942545
blockpoolID=BP-116957957-192.168.27.101-1582684942545
layoutVersion=-57
```

#### 5.4.4 DataNode 数据块版本号的具体解释

**1、****namespaceID**：是Datanode首次访问Namenode的时候从Namenode处获取的storageID；对每个Datanode来说是唯一的（但对于单个Datanode中所有存储目录来说则是相同的），Namenode可用这个属性来区分不同Datanode；

**2、****cTime**：标记了Datanode存储系统的创建时间，对于刚刚格式化的存储系统，这个属性为0；但是在文件系统升级之后，该值会更新到新的时间戳；

**3、****blockpoolID**：一个blockpoolid标识一个blockpool，并且是跨集群的全局唯一；当一个新的Namespace被创建的时候(format过程的一部分)会创建并持久化一个唯一ID；在创建过程构建全局唯一的lockPoolID比人为的配置更可靠一些Namenode将BlockPoolID持久化到磁盘中，在后续的启动过程中，会再次load并使用；

**4、****layoutVersion**：一个负整数，通常只有HDFS增加新特性时才会更新这个版本号；

### 5.5 服役新数据节点

#### 5.5.1 需求

随着公司业务的增长，数据量越来越大，原有的数据节点的容量已经不能满足存储数据的需求，需要在原有集群基础上动态添加新的数据节点

#### 5.5.2 环境准备

**1、** 克隆一台虚拟机（master->slave3），并启动；

从 master 上克隆可节省文件同步的时间，否则需要重新安装、配置 JDK、Hadoop
**2、** 修改ip地址为192.168.27.104；

**3、** 修改ip映射（/etc/hosts），并在master、slave1、slave2上同步修改；

在 master、slave1、slave2 基础上新增 **192.168.27.104 slave3**

```java
192.168.27.101 master
192.168.27.102 slave1
192.168.27.103 slave2
192.168.27.104 slave3
```

**4、** 修改主机名；

```java
hostnamectl set-hostname slave3
```

**5、** 建立master、slave1、slave2和slave3之间的免密；

删除 slave3 下的 .ssh，重新生成公钥进行同步

> 以上五步可参考 Hadoop集群搭建-3

**1、** 删除原来HDFS文件系统留存的文件；

从 master 上拷贝过来的 Hadoop 信息，清除 logs 和 data

```java
rm -rf /usr/hadoop/hadoop-2.9.2/logs /usr/local/hadoop/tmp/dfs/data
```

因为 msater 上没跑 Datanode，所以 data 的目录可以不加

所有准备工作完备

#### 5.5.3 服役新节点具体步骤

**1、** 在Namenode的~/etc/hadoop目录下创建dfs.hosts文件；

```java
[root@master .ssh]# cd /usr/hadoop/hadoop-2.9.2/etc/hadoop/
[root@master hadoop]# vim dfs.hosts
```

添加如下主机名称（包含新服役的节点）

```java
master
slave1
slave2
slave3
```

**2、** 在Namenode的hdfs-site.xml配置文件中增加dfs.hosts属性；

```java
<property>
    <name>dfs.hosts</name>
    <value>/usr/hadoop/hadoop-2.9.2/etc/hadoop/dfs.hosts</value>
</property>
```

**3、** 刷新Namenode；

```java
[root@master hadoop]# hdfs dfsadmin -refreshNodes
Refresh nodes successful
```

新增了 master、slave3 的 Datanode 节点
**4、** 更新resourcemanager节点；

```java
[root@master hadoop]# yarn rmadmin -refreshNodes
20/03/06 15:07:16 INFO client.RMProxy: Connecting to ResourceManager at master/192.168.27.101:8033
```

**5、** 在Namenode的slaves文件中增加新主机名称；

增加 master、slave3 不需要分发

```java
master
slave1
slave2
slave3
```

**6、** 单独命令启动新的数据节点和节点管理器；

master、slave3 上都启动 Datanode 和 NodeManager

```java
[root@slave3 hadoop-2.9.2]# hadoop-daemon.sh start datanode
starting datanode, logging to /usr/hadoop/hadoop-2.9.2/logs/hadoop-root-datanode-slave3.out
[root@slave3 hadoop-2.9.2]# yarn-daemon.sh start nodemanager
starting nodemanager, logging to /usr/hadoop/hadoop-2.9.2/logs/yarn-root-nodemanager-slave3.out
[root@slave3 hadoop-2.9.2]# jps
3154 DataNode
3266 NodeManager
3423 Jps
```

确认 DataNode 和 NodeManager 进程已启动
**7、** 在web浏览器上检查是否ok；

目前只启动了 slave3 节点上的 Datanode 和 NodeManager

#### 5.5.4 集群再平衡

如果数据不均衡，可以用命令实现集群的再平衡

```java
[root@slave1 .ssh]# start-balancer.sh
starting balancer, logging to /usr/hadoop/hadoop-2.9.2/logs/hadoop-root-balancer-slave1.out
Time Stamp               Iteration#  Bytes Already Moved  Bytes Left To Move  Bytes Being Moved
```

**重新配置 192.168.27.105 slave4，作为后续旧数据节点的退役**

### 5.6 退役旧数据节点

此例退役上面刚服役的节点： 192.168.27.105 slave4

**1、** 在Namenode的~/etc/hadoop目录下创建dfs.hosts.exclude文件；

```java
[root@master hadoop]# pwd
/usr/hadoop/hadoop-2.9.2/etc/hadoop
[root@master hadoop]# vim dfs.hosts.exclude
```

添加如下主机名称（要退役的节点）

```java
slave4
```

**2、** 在Namenode的hdfs-site.xml配置文件中增加dfs.hosts.exclude属性；

```java
<property>
    <name>dfs.hosts.exclude</name>
    <value>/usr/hadoop/hadoop-2.9.2/etc/hadoop/dfs.hosts.exclude</value>
</property>
```

**3、** 刷新Namenode、刷新Resourcemanager；

```java
[root@master hadoop]# hdfs dfsadmin -refreshNodes
Refresh nodes successful
[root@master hadoop]# yarn rmadmin -refreshNodes
20/03/06 15:58:31 INFO client.RMProxy: Connecting to ResourceManager at master/192.168.27.101:8033
```

**4、** 检查web浏览器，退役节点的状态无（退役中），说明数据节点正在复制块到其他节点；

**5、** 等待退役节点状态为decommissioned（所有块已经复制完成），停止该节点及节点资源管理器；

此时，slave4 上的 DataNode 和 NodeManager 进程仍在

```java
[root@slave4 hadoop]#  jps
5232 NodeManager
5563 Jps
5116 DataNode
```

> 注意：如果副本数是3，服役的节点小于等于3，是不能退役成功的，需要修改副本数后才能退役

停止该节点及节点资源管理器

```java
[root@slave4 hadoop]# hadoop-daemon.sh stop datanode
stopping datanode
[root@slave4 hadoop]# yarn-daemon.sh stop nodemanager
stopping nodemanager
```

**6、** 从include文件中删除退役节点，再运行刷新节点的命令；

(1) 从 Namenode 的 dfs.hosts 文件中删除退役节点 slave4

```java
 master
 slave1
 slave2
 slave3
```

(2) 刷新 Namenode，刷新 Resourcemanager

```java
[root@master hadoop]# hdfs dfsadmin -refreshNodes
Refresh nodes successful
[root@master hadoop]# yarn rmadmin -refreshNodes
20/03/06 17:11:21 INFO client.RMProxy: Connecting to ResourceManager at master/192.168.27.101:8033
```

**7、** 从Namenode的slave文件中删除退役节点hadoop105；

```java
master
slave1
slave2
slave3
```

**8、** 如果数据不均衡，可以用命令实现集群的再平衡；

```java
[root@master hadoop]# start-balancer.sh 
starting balancer, logging to /usr/hadoop/hadoop-2.9.2/logs/hadoop-root-balancer-master.out
Time Stamp               Iteration#  Bytes Already Moved  Bytes Left To Move  Bytes Being Moved
```

### 5.7 Datanode 多目录配置

Datanode 也可以配置成多个目录，每个目录存储的数据不一样，即数据不是副本

具体配置如下：

**[hdfs-site.xml]**

```java
<property>
    <name>dfs.datanode.data.dir</name>
    <value>file:///${hadoop.tmp.dir}/dfs/data1,file:///${hadoop.tmp.dir}/dfs/data2</value>
</property>
```
