# 09、Hadoop 教程 - Hadoop HDFS High Availability（HA）高可用集群
- 来源：https://ddkk.com/zhuanlan/bigdata/hadoop/2/9.html
- 分类：大数据框架
- 分组：教程目录
## 1. High Availability背景知识

### 1.1 单点故障、高可用

`单点故障`（英语：single point of failure，缩写`SPOF`）是指系统中某一点一旦失效，就会让整个系统无法运作，换句话说，单点故障即会整体故障。

`高可用性`（英语：high availability，缩写为`HA`），IT 术语，指系统无中断地执行其功能的能力，代表系统的可用性程度。是进行系统设计时的准则之一。高可用性系统意味着系统服务可以更长时间运行，通常通过提高系统的容错能力来实现。

高可用性或者高可靠度的系统不会希望有单点故障造成整体故障的情形。一般可以透过冗余的方式增加多个相同机能的部件，只要这些部件没有同时失效，系统（或至少部分系统）仍可运作，这会让可靠度提高。

### 1.2 高可用如何实现

#### 1.2.1 主备集群

解决单点故障，实现系统服务高可用的核心并不是让故障永不发生，而是让故障的发生对业务的影响降到最小。因为软硬件故障是难以避免的问题。

当下企业中成熟的做法就是给单点故障的位置设置备份，形成主备架构。通俗描述就是`当主挂掉，备份顶上`，短暂的中断之后继续提供服务。

常见的是`一主一备`架构，当然也可以一主多备。备份越多，容错能力越强，与此同时，冗余也越大，浪费资源。

#### 1.2.2 Active、Standby

`Active：主角色。`活跃的角色，代表正在对外提供服务的角色服务。`任意时间有且只有一个active对外提供服务`。

`Standby：备份角色。`需要和主角色保持数据、状态同步，并且时刻准备切换成主角色（当主角色挂掉或者出现故障时），对外提供服务，保持服务的可用性。

#### 1.2.3 可用性评判标准——x个9

在系统的高可用性里有个衡量其可靠性的标准——`X个9`，这个 X 是代表数字 3-5 。X 个 9 表示`在系统1年时间的使用过程中，系统可以正常使用时间与总时间（1年）之比`。

- 3个9：(1-99.9%)*365*24=8.76小时，表示该系统在连续运行 1 年时间里最多可能的业务中断时间是8.76小时。
- 4个9：(1-99.99%)*365*24=0.876小时=52.6分钟，表示该系统在连续运行 1 年时间里最多可能的业务中断时间是 52.6 分钟。
- 5个9：(1-99.999%)*365*24*60=5.26分钟，表示该系统在连续运行 1 年时间里最多可能的业务中断时间是 5.26 分钟。

可以看出，9 越多，系统的可靠性越强，能够容忍的业务中断时间越少，但是要付出的成本更高。

#### 1.2.4 HA系统设计核心问题

##### 1.2.4.1 脑裂问题

`脑裂`（split-brain）是指“大脑分裂”，本是医学名词。在 HA 集群中，脑裂指的是当联系主备节点的“心跳线”断开时（即两个节点断开联系时），本来为一个整体、动作协调的 HA 系统，就分裂成为两个独立的节点。由于相互失去了联系，主备节点之间像“裂脑人”一样，使得整个集群处于混乱状态。脑裂的严重后果：

**1、**`集群无主`：都认为对方是状态好的，自己是备份角色，后果是无服务；

**2、**`集群多主`：都认为对方是故障的，自己是主角色相互争抢共享资源，结果会导致系统混乱，数据损坏此外对于客户端访问也是一头雾水，找谁呢？；

避免脑裂问题的核心是：`保持任意时刻系统有且只有一个主角色提供服务。`

##### 1.2.4.2 数据同步问题

主备切换保证服务持续可用性的前提是主备节点之间的状态、数据是一致的，或者说准一致的。如果说备用的节点和主节点之间的数据差距过大，即使完成了主备切换的动作，那也是没有意义的。

数据同步常见做法是：`通过日志重演操作记录`。主角色正常提供服务，发生的事务性操作通过日志记录，备用角色读取日志重演操作。

## 2. HDFS NameNode单点故障问题

在Hadoop 2.0.0 之前，`NameNode是HDFS集群中的单点故障（SPOF）`。每个集群只有一个 NameNode，如果该计算机或进程不可用，则整个集群在整个 NameNode 重新启动或在另一台计算机上启动之前将不可用。

NameNode 的单点故障从两个方面影响了 HDFS 集群的总可用性：

- 如果发生意外事件（例如机器崩溃），则在重新启动 NameNode 之前，集群将不可用。
- 计划内的维护事件，例如 NameNode 计算机上的软件或硬件升级，将导致集群停机时间的延长。

HDFS 高可用性解决方案：在同一集群中运行两个（从 3.0.0 起，超过两个）冗余 NameNode。这样可以在机器崩溃的情况下快速故障转移到新的 NameNode，或者出于计划维护的目的由管理员发起的正常故障转移。

## 3. HDFS HA解决方案——QJM

QJM 全称`Quorum Journal Manager`，由 cloudera 公司提出，是 Hadoop 官方推荐的 HDFS HA 解决方案之一。

QJM 中，`使用zookeeper中ZKFC来实现主备切换`；`使用Journal Node（JN）集群实现edits log的共享以达到数据同步的目的`。

### 3.1 QJM——主备切换、脑裂问题解决

#### 3.1.1 ZKFailoverController（zkfc）

Apache ZooKeeper 是一款高可用分布式协调服务软件，用于维护少量的协调数据。 Zookeeper 的下列特性功能参与了 HDFS 的 HA 解决方案中：

- **临时znode**
- 如果一个 znode 节点是临时的，那么该 znode 的生命周期将和创建它的客户端的 session 绑定。客户端断开连接 session 结束，znode 将会被自动删除。
- **Path路径唯一性**
- zookeeper 中维持了一份类似目录树的数据结构。每个节点称之为 Znode。Znode 具有唯一性，不会重名。也可以理解为排他性。
- **监听机制**
- 客户端可以针对 znode 上发生的事件设置监听，当事件发生触发条件，zk 服务会把事件通知给设置监听的客户端。
- `ZKFailoverController`（ZKFC）是一个新组件，它是一个 ZooKeeper 客户端。`运行NameNode的每台计算机也都运行ZKFC`，ZKFC 的主要职责：

`监视和管理NameNode健康状态`

ZKFC 通过命令定期 ping 本地负责监视的 NameNode 节点。

`维持和ZooKeeper集群联系`

- 如果本地 NameNode 运行状况良好，并且 ZKFC 看到当前没有其他节点持有锁 znode，它将自己尝试获取该锁。如果成功，则表明它“赢得了选举”，并负责运行故障转移以使其本地 NameNode 处于 Active 状态。如果已经有其他节点持有锁，zkfc 选举失败，则会对该节点注册监听，等待下次继续选举。

#### 3.1.2 Fencing隔离机制

故障转移过程也就是俗称的主备角色切换的过程，切换过程中最怕的就是脑裂的发送。因此需要`Fencing机制`来避免，将先前的 Active 节点隔离，然后将本地 NameNode 转换为 Active 状态。

Hadoop 公共库中对外提供了两种 fenching 实现，分别是 sshfence 和 shellfence（缺省实现），其中`sshfence`是指`通过ssh登陆目标节点上，使用命令fuser将进程杀死（通过tcp端口号定位进程pid，该方法比jps命令更准确）`，shellfence 是指执行一个用户事先定义的shell命令（脚本）完成隔离。

### 3.2 QJM——主备数据同步问题解决

`Journal Node（JN）集群`是轻量级分布式系统，主要用于高速读写数据、存储数据。通常使用`2N+1`台 JournalNode 存储共享 Edits Log（编辑日志）。

任何修改操作在 Active NN 上执行时，JournalNode 进程同时也会记录 edits log 到`至少半数`以上的 JN 中，这时 Standby NN 监测到 JN 里面的同步 log 发生变化了会读取 JN 里面的 edits log，然后重演操作记录同步到自己的目录镜像树里面，

当发生故障 Active NN 挂掉后，Standby NN 会在它成为 Active NN 前，读取所有的 JN 里面的修改日志，这样就能高可靠的保证与挂掉的 NN 的目录镜像树一致，然后无缝的接替它的职责，维护来自客户端请求，从而达到一个高可用的目的。

## 4. HDFS HA环境搭建

HA 集群搭建的难度主要在于配置文件的编写。

### 4.1 集群基础环境准备

**1、** 修改Linux主机名`/etc/hostname`；

**2、** 修改IP`/etc/sysconfig/network-scripts/ifcfg-ens33`；

**3、** 修改主机名和IP的映射关系`/etc/hosts`；

**4、** 关闭防火墙；

**5、** ssh免登陆；

**6、** 安装JDK，配置环境变量等`/etc/profile`；

**7、** 集群时间同步；

**8、** 配置主备NN之间的互相免密登录；

具体操作可以访问[《Hadoop3.x在centos上的完全分布式部署》](https://blog.csdn.net/weixin_44758876/article/details/122410214)来操作。

### 4.2 HA集群规划

hadoop121
hadoop122
hadoop123

服务
NameNode
zkfc
DataNode
zookeeper
journal node
NameNode
zkfc
DataNode
zookeeper
journal node
DataNode
zookeeper
journal node

### 4.3 上传解压Hadoop安装包、配置环境变量

官网下载地址：[https://hadoop.apache.org/releases.html](https://hadoop.apache.org/releases.html)

`tar -zxvf hadoop-3.3.1.tar.gz -C /data/`解压安装

配置环境变量，`vim /etc/profile`添加环境变量

```java
#HADOOP_HOME
export HADOOP_HOME=/data/hadoop-3.3.1
export PATH=$PATH:$HADOOP_HOME/bin
export PATH=$PATH:$HADOOP_HOME/sbin
```

### 4.4 修改Hadoop配置文件

#### 4.4.1 core-site.xml

```java
<configuration>
    <!-- HA集群名称，该值要和hdfs-site.xml中的配置保持一致 -->
    <property>
        <name>fs.defaultFS</name>
        <value>hdfs://mycluster</value>
    </property>
    <!-- hadoop本地磁盘存放数据的公共目录 -->
    <property>
        <name>hadoop.tmp.dir</name>
        <value>/data/hadoop-3.3.1/data/tmp</value>
    </property>
    <!-- ZooKeeper集群的地址和端口-->
    <property>
        <name>ha.zookeeper.quorum</name>
        <value>192.168.68.121:2181,192.168.68.122:2181,192.168.68.123:2181</value>
    </property>
</configuration>
```

#### 4.4.2 hdfs-site.xml

```java
<configuration>
    <!--指定hdfs的nameservice为mycluster，需要和core-site.xml中的保持一致 -->
    <property>
        <name>dfs.nameservices</name>
        <value>mycluster</value>
    </property>
    <!-- mycluster下面有两个NameNode，分别是nn1,nn2 -->
    <property>
        <name>dfs.ha.namenodes.mycluster</name>
        <value>nn1,nn2</value>
    </property>
    <!-- nn1的RPC通信地址 -->
    <property>
        <name>dfs.namenode.rpc-address.mycluster.nn1</name>
        <value>192.168.68.121:8020</value>
    </property>
    <!-- nn2的RPC通信地址 -->
    <property>
        <name>dfs.namenode.rpc-address.mycluster.nn2</name>
        <value>192.168.68.122:8020</value>
    </property>
    <!-- 指定NameNode的edits元数据在JournalNode上的存放位置 -->
    <property>
        <name>dfs.namenode.shared.edits.dir</name>
        <value>qjournal://192.168.68.121:8485;192.168.68.122:8485;192.168.68.123:8485/mycluster</value>
    </property>
    <!-- 指定JournalNode在本地磁盘存放数据的位置 -->
    <property>
        <name>dfs.journalnode.edits.dir</name>
        <value>/data/hadoop-3.3.1/journaldata</value>
    </property>
    <!-- NameNode存储名称空间和事务日志的本地文件系统上的路径 -->
    <property>
        <name>dfs.namenode.name.dir</name>
        <value>/data/hadoop-3.3.1/data/namenode</value>
    </property>
    <!-- DataNode存储名称空间和事务日志的本地文件系统上的路径  -->
    <property>
        <name>dfs.datanode.data.dir</name>
        <value>/data/hadoop-3.3.1/data/datanode</value>
    </property>
    <!-- 开启NameNode失败自动切换 -->
    <property>
        <name>dfs.ha.automatic-failover.enabled</name>
        <value>true</value>
    </property>
    <!-- 指定该集群出故障时，哪个实现类负责执行故障切换 -->
    <property>
        <name>dfs.client.failover.proxy.provider.mycluster</name>
        <value>org.apache.hadoop.hdfs.server.namenode.ha.ConfiguredFailoverProxyProvider</value>
    </property>
    <!-- 配置隔离机制方法-->
    <property>
        <name>dfs.ha.fencing.methods</name>
        <value>sshfence</value>
    </property>
    <!-- 使用sshfence隔离机制时需要ssh免登陆 -->
    <property>
        <name>dfs.ha.fencing.ssh.private-key-files</name>
        <value>/home/hadoop/.ssh/id_rsa</value>
    </property>
    <!-- 配置sshfence隔离机制超时时间 -->
    <property>
        <name>dfs.ha.fencing.ssh.connect-timeout</name>
        <value>30000</value>
    </property>
</configuration>
```

#### 4.4.3 yarn-site.xml

```java
<configuration>
    <!-- 指定MR走shuffle -->
    <property>
        <name>yarn.nodemanager.aux-services</name>
        <value>mapreduce_shuffle</value>
    </property>
    <!-- 指定ResourceManager的地址-->
    <property>
        <name>yarn.resourcemanager.hostname</name>
        <value>192.168.68.122</value>
    </property>
    <!-- 为每个容器请求分配的最小内存限制资源管理器（512M） -->
    <property>
        <name>yarn.scheduler.minimum-allocation-mb</name>
        <value>512</value>
    </property>
    <!-- 为每个容器请求分配的最大内存限制资源管理器（4G） -->
    <property>
        <name>yarn.scheduler.maximum-allocation-mb</name>
        <value>4096</value>
    </property>
    <!-- 虚拟内存比例，默认为2.1，此处设置为4倍 -->
    <property>
        <name>yarn.nodemanager.vmem-pmem-ratio</name>
        <value>4</value>
    </property>
    <!-- 环境变量的继承 -->
    <property>
        <name>yarn.nodemanager.env-whitelist</name>
        <value>JAVA_HOME,HADOOP_COMMON_HOME,HADOOP_HDFS_HOME,HADOOP_CONF_DIR,CLASSPATH_PREPEND_DISTCACHE,HADOOP_YARN_HOME,HADOOP_MAPRED_HOME</value>
    </property>
</configuration>
```

#### 4.4.4 mapred-site.xml

```java
<configuration>
    <!-- 执行MapReduce的方式：yarn/local -->
    <property>
        <name>mapreduce.framework.name</name>
        <value>yarn</value>
    </property>
</configuration>
```

#### 4.4.5 workers

```java
192.168.68.121
192.168.68.122
192.168.68.123
```

#### 4.4.6 创建数据目录

```java
mkdir /data/hadoop-3.3.1/data/datanode
mkdir /data/hadoop-3.3.1/data/namenode
mkdir /data/hadoop-3.3.1/data/tmp
```

### 4.5 集群同步安装包

```java
scp -r hadoop-3.3.1 hadoop@192.168.68.122:$PWD
scp -r hadoop-3.3.1 hadoop@192.168.68.123:$PWD
```

`vim /etc/profile` 添加环境变量

```java
#HADOOP_HOME
export HADOOP_HOME=/data/hadoop-3.3.1
export PATH=$PATH:$HADOOP_HOME/bin
export PATH=$PATH:$HADOOP_HOME/sbin
```

### 4.6 HA集群初始化

**1、** 启动zk集群，zk集群搭建教程：[Zookeeper3.6.3集群搭建教程（附群起脚本）](https://blog.csdn.net/weixin_44758876/article/details/122542047)；

**2、** 手动启动JN集群；

```java
hdfs --daemon start journalnode
```

**1、** 在hadoop121上初始化namenode；

```java
hdfs namenode –format
```

**1、** 在hadoop121上启动namenode；

```java
hdfs --daemon start namenode
```

**1、** 在hadoop122上执行`hdfsnamenode–bootstrapStandby`命令进行namenode元数据同步；

**2、** 格式化zkfc（注意：在哪台机器上执行，哪台机器就将成为第一次的ActiveNN）；

### 4.7 HA集群启动

**1、** 在hadoop121上启动HDFS集群；

**2、** 在hadoop122上启动yarn集群；

### 4.8 HA效果演示

在hadoop121 上，显示 namenode 是 active 状态：

在hadoop122 上，显示 namenode 是 standby 状态：

#### 4.8.1 正常操作

#### 4.8.2 模拟故障出现

在hadoop121，手动 kill 杀死 namenode 进程

此时发现 hadoop122 上的 namenode 切换成为Active状态，hdfs 服务正常可用。

#### 4.8.3 HA切换失败错误解决

使用`kill -9`模拟 JVM 崩溃。或者重新启动计算机电源或拔出其网络接口以模拟另一种故障。另一个 NameNode 应在几秒钟内自动变为活动状态。检测故障并触发故障转移所需的时间取决于`ha.zookeeper.session-timeout.ms`的配置，但默认值为5秒。

如果测试不成功，很有可能是找不到 fuser 程序，导致无法进行

fence，博主也是卡在了这里，可以通过如下命令来安装，Psmisc 软件包中包含了 fuser 程序（两个 NN 机器上都需要进行安装）

```java
yum install -y psmisc
```
