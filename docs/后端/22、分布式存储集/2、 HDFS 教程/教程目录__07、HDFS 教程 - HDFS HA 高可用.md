# 07、HDFS 教程 - HDFS HA 高可用
- 来源：https://ddkk.com/zhuanlan/filestorage/hdfs/1/7.html
- 分类：分布式存储
- 分组：教程目录
## 7. HDFS HA 高可用

### 7.1 HA 概述

所谓HA（high available），即高可用（7*24小时不中断服务）

实现高可用最关键的策略是消除单点故障，HA 严格来说应该分成各个组件的 HA 机制：HDFS的HA 和 YARN的HA

Hadoop2.0 之前，在 HDFS 集群中 NameNode 存在单点故障（SPOF）

NameNode 主要在以下两个方面影响 HDFS 集群

```java
NameNode 机器发生意外，如宕机，集群将无法使用，直到管理员重启
NameNode 机器需要升级，包括软件、硬件升级，此时集群也将无法使用
```

HDFS HA 功能通过配置 Active/Standby 两个 NameNodes 实现在集群中对 NameNode 的热备来解决上述问题

如果出现故障，如机器崩溃或机器需要升级维护，这时可通过此种方式将 NameNode 很快的切换到另外一台机器

**注意：HDFS 配置 HA 后，SecondNamenode 的角色被备用 Namenode 所包含，备用 Namenode 为活动的 Namenode 命名空间设置周期性的检查点**

### 7.2 HDFS-HA 工作机制

通过双NameNode 消除单点故障

### 7.3 HDFS-HA 手动故障转移

#### 7.3.1 HDFS-HA 工作要点

**1、** 元数据管理方式需要改变：；

内存中各自保存一份元数据

Edits 日志只有 Active 状态的 Namenode 节点可以做写操作

两个 Namenode 都可以读取 edits

共享的 edits 放在一个共享存储中管理（qjournal 和 NFS 两个主流实现）
**2、** 需要一个状态管理功能模块；

实现了一个 zkfailover，常驻在每一个 Namenode 所在的节点，每一个 zkfailover 负责监控自己所在 Namenode 节点，利用 zk 进行状态标识，当需要进行状态切换时，由 zkfailover 来负责切换，切换时需要防止 brain split 现象的发生
**3、** 必须保证两个NameNode之间能够ssh无密码登录；

**4、** 隔离（Fence），即同一时刻仅仅有一个NameNode对外提供服务；

#### 7.3.2 环境准备

将上面master、slave1、slave2 三个机器克隆修改相关配置即可，要点如下：

**1、** 修改IP（可以保持不变）、主机名（改为hadoop-1，hadoop-2，hadooop-3）；

```java
hadoop-1 192.168.27.101
hadoop-2 192.168.27.102
hadoop-3 192.168.27.103
```

**2、** 修改主机名及主机名和IP地址的映射；

**3、** 关闭防火墙；

**4、** ssh免密登录；

**5、** 清空Hadoop的data和logs；

#### 7.3.3 集群规划

hadoop-1
hadoop-2
hadooop-3

NameNode
NameNode
-

JournalNode
JournalNode
JournalNode

DataNode
DataNode
DataNode

-
ResourceManager
-

NodeManager
NodeManager
NodeManager

#### 7.3.4 配置 HDFS-HA 集群（以三台为例）

**1、** 官方地址：https://hadoop.apache.org/docs/r2.9.2/hadoop-project-dist/hadoop-hdfs/HDFSHighAvailabilityWithQJM.html；

**2、** 配置core-site.xml；

```java
<configuration>
    <!-- 把两个 NameNode 的地址组装成一个集群 mycluster -->
    <property>
        <name>fs.defaultFS</name>
        <value>hdfs://mycluster</value>
    </property>
    <!-- 声明 journalnode 服务本地文件系统存储目录-->
    <property>
        <name>dfs.journalnode.edits.dir</name>
        <value>/usr/local/hadoop/tmp/dfs/data/jn</value>
    </property>
    <!-- 指定 hadoop 运行时产生文件的存储目录（和之前一样） -->
    <property>
        <name>hadoop.tmp.dir</name>
        <value>/usr/hadoop/tmp</value>
    </property>
</configuration>
```

**3、** 配置hdfs-site.xml；

```java
<configuration>
    <!-- 完全分布式集群名称 -->
    <property>
        <name>dfs.nameservices</name>
        <value>mycluster</value>
    </property>
    <!-- 集群中 NameNode 节点都有哪些 -->
    <property>
        <name>dfs.ha.namenodes.mycluster</name>
        <value>nn1,nn2</value>
    </property>
    <!-- nn1 的 RPC 通信地址 -->
    <property>
        <name>dfs.namenode.rpc-address.mycluster.nn1</name>
        <value>hadoop-1:8020</value>
    </property>
    <!-- nn2 的 RPC 通信地址 -->
    <property>
        <name>dfs.namenode.rpc-address.mycluster.nn2</name>
        <value>hadoop-2:8020</value>
    </property>
    <!-- nn1 的 http 通信地址 -->
    <property>
        <name>dfs.namenode.http-address.mycluster.nn1</name>
        <value>hadoop-1:50070</value>
    </property>
    <!-- nn2 的 http 通信地址 -->
    <property>
        <name>dfs.namenode.http-address.mycluster.nn2</name>
        <value>hadoop-2:50070</value>
    </property>
    <!-- 指定 NameNode 元数据在 JournalNode 上的存放位置 -->
    <property>
        <name>dfs.namenode.shared.edits.dir</name>
        <value>qjournal://hadoop-1:8485;hadoop-2:8485;hadoop-3:8485/mycluster</value>
    </property>
    <!-- 配置隔离机制，即同一时刻只能有一台服务器对外响应 -->
    <property>
        <name>dfs.ha.fencing.methods</name>
        <value>sshfence</value>
    </property>
    <!-- 使用隔离机制时需要 ssh 无秘钥登录-->
    <property>
        <name>dfs.ha.fencing.ssh.private-key-files</name>
        <value>/root/.ssh/id_rsa</value>
    </property>
    <!-- 关闭权限检查-->
    <property>
        <name>dfs.permissions.enable</name>
        <value>false</value>
    </property>
    <!-- 访问代理类：client，mycluster，active 配置失败自动切换实现方式-->
    <property>
        <name>dfs.client.failover.proxy.provider.mycluster</name>
        <value>org.apache.hadoop.hdfs.server.namenode.ha.ConfiguredFailoverProxyProvider</value>
    </property>
</configuration>
```

**4、** 拷贝配置好的hadoop环境到其他节点；

#### 7.3.5 启动 HDFS-HA 集群

**1、** 在各个JournalNode节点上，输入以下命令启动JournalNode服务；

```java
[root@hadoop-1 hadoop]# hadoop-daemon.sh start journalnode
starting journalnode, logging to /usr/hadoop/hadoop-2.9.2/logs/hadoop-root-journalnode-hadoop-1.out
[root@hadoop-1 hadoop]# jps
2709 Jps
2648 JournalNode
```

```java
[root@hadoop-2 hadoop]# hadoop-daemon.sh start journalnode
starting journalnode, logging to /usr/hadoop/hadoop-2.9.2/logs/hadoop-root-journalnode-hadoop-2.out
[root@hadoop-2 hadoop]# jps
2578 JournalNode
2639 Jps
```

```java
[root@hadoop-3 hadoop]# hadoop-daemon.sh start journalnode
starting journalnode, logging to /usr/hadoop/hadoop-2.9.2/logs/hadoop-root-journalnode-hadoop-3.out
[root@hadoop-3 hadoop]# jps
2946 JournalNode
3007 Jps
```

**2、** 在[nn1]上，对其进行格式化，并启动；

```java
[root@hadoop-1 hadoop]# hdfs namenode -format
[root@hadoop-1 hadoop]# hadoop-daemon.sh start namenode
starting namenode, logging to /usr/hadoop/hadoop-2.9.2/logs/hadoop-root-namenode-hadoop-1.out
```

目前 hadoop-1 已启动，为 standby 状态，如下图

**3、** 在[nn2]上，同步nn1的元数据信息；

```java
[root@hadoop-2 hadoop]# hdfs namenode -bootstrapStandby
```

可以从日志看出从 [nn1] 进行同步，如下图：

**4、** 启动[nn2]；

```java
[root@hadoop-2 hadoop]# hadoop-daemon.sh start namenode
```

目前 hadoop-2 已启动，也为 standby 状态，如下图

**5、** 在[nn1]上，启动所有Datanode；

```java
[root@hadoop-1 .ssh]# hadoop-daemons.sh start datanode
```

> 备注：hadoop-daemons 本质是到 slaves 文件中找所有 DataNode

此时所有 Namenode 都是 standby 状态，不支持读文件

**6、** 将[nn1]切换为Active；

```java
[root@hadoop-1 .ssh]# hdfs haadmin -transitionToActive nn1
```

**7、** 查看是否Active；

```java
[root@hadoop-1 .ssh]# hdfs haadmin -getServiceState nn1
active
```

#### 7.3.6 HDFS-HA 集群手动故障转移

**1、** 强杀ActiveNameNode[nn1]；

```java
[root@hadoop-1 hadoop]# jps
4389 Jps
2648 JournalNode
3112 NameNode
4091 DataNode
[root@hadoop-1 hadoop]# kill -9 3112
```

**2、** 手动将[nn2]切为Active；

```java
[root@hadoop-1 hadoop]# hdfs haadmin -transitionToActive nn2
20/03/07 16:49:45 INFO ipc.Client: Retrying connect to server: hadoop-1/192.168.27.101:8020. Already tried 0 time(s); retry policy is RetryUpToMaximumCountWithFixedSleep(maxRetries=1, sleepTime=1000 MILLISECONDS)
Unexpected error occurred  Call From hadoop-1/192.168.27.101 to hadoop-1:8020 failed on connection exception: java.net.ConnectException: Connection refused; For more details see:  http://wiki.apache.org/hadoop/ConnectionRefused
Usage: haadmin [-ns <nameserviceId>] [-transitionToActive [--forceactive] <serviceId>]
```

发现 Connection refused，因为为了防止脑裂，[nn2] 必须和 [nn1] 取得联系，但是此时 [nn1] 已挂，所以必须先把 [nn1] 先启动，再手动将 [nn2] 切为 Active
**3、** 启动[nn1]；

```java
[root@hadoop-1 hadoop]# hadoop-daemon.sh start namenode
starting namenode, logging to /usr/hadoop/hadoop-2.9.2/logs/hadoop-root-namenode-hadoop-1.out
```

此时 [nn1] 和 [nn2] 都是 standyby 状态
**4、** 手动将[nn2]切为Active；

```java
[root@hadoop-1 hadoop]# hdfs haadmin -transitionToActive nn2
```

### 7.4 HDFS-HA 自动故障转移

#### 7.4.1 工作要点

前面使用命令 hdfs haadmin -failover 手动进行故障转移，在该模式下，即使现役 NameNode 已经失效，系统也不会自动从现役 NameNode 转移到待机 NameNode，下面配置部署 HA 自动进行故障转移

自动故障转移为 HDFS 部署增加了两个新组件：**ZooKeeper** 和 **ZKFailoverController（ZKFC）** 进程

ZooKeeper 是维护少量协调数据，通知客户端这些数据的改变和监视客户端故障的高可用服务

#### 7.4.2 ZooKeeper 在 自动故障转移 中的作用

##### 7.4.2.1 故障检测

集群中的每个 NameNode 在 ZooKeeper 中维护了一个持久会话，如果机器崩溃，ZooKeeper 中的会话将终止，ZooKeeper 通知另一个 NameNode 需要触发故障转移

##### 7.4.2.2 现役 NameNode 选择

ZooKeeper 提供了一个简单的机制用于唯一的选择一个节点为 active 状态

如果目前现役 NameNode 崩溃，另一个节点可能从 ZooKeeper 获得特殊的排外锁以表明它应该成为现役 NameNode

ZKFC 是自动故障转移中的另一个新组件，是 ZooKeeper 的客户端，也监视和管理 NameNode 的状态

每个运行 NameNode 的主机也运行了一个 ZKFC 进程，ZKFC 负责：

**1、** 健康监测；

ZKFC 使用一个健康检查命令定期地 ping 与之在相同主机的 NameNode，只要该 NameNode 及时地回复健康状态，ZKFC 认为该节点是健康的

如果该节点崩溃，冻结或进入不健康状态，健康监测器标识该节点为非健康的
**2、** ZooKeeper会话管理；

当本地 NameNode 是健康的，ZKFC 保持一个在 ZooKeeper 中打开的会话

如果本地 NameNode 处于 active 状态，ZKFC 也保持一个特殊的 znode 锁，该锁使用了 ZooKeeper 对短暂节点的支持，如果会话终止，锁节点将自动删除
**3、** 基于ZooKeeper的选择；

如果本地 NameNode 是健康的，且 ZKFC 发现没有其它的节点当前持有 znode 锁，它将为自己获取该锁

如果成功，则它已经赢得了选择，并负责运行故障转移进程以使它的本地 NameNode 为 active

故障转移进程与前面描述的手动故障转移相似，首先如果必要保护之前的现役 NameNode，然后本地 NameNode 转换为 active 状态

#### 7.4.3 环境准备

将上面master、slave1、slave2 三个机器克隆修改相关配置即可，要点如下：

**1、** 修改IP（可以保持不变）、主机名（改为hadoop-1，hadoop-2，hadooop-3）；

```java
hadoop-1 192.168.27.101
hadoop-2 192.168.27.102
hadoop-3 192.168.27.103
```

**2、** 修改主机名及主机名和IP地址的映射；

**3、** 关闭防火墙；

**4、** ssh免密登录；

**5、** 清空Hadoop的data和logs；

#### 7.4.4 规划集群

hadoop-1
hadoop-2
hadoop-3

NameNode
NameNode
-

JournalNode
JournalNode
JournalNode

DataNode
DataNode
DataNode

ZK
ZK
ZK

-
ResourceManager
-

NodeManager
NodeManager
NodeManager

#### 7.4.5 配置 Zookeeper 集群

##### 7.4.5.1 Zookeeper 集群规划

在hadoop-1、hadoop-2 和 hadoop-3 三个节点上部署 Zookeeper

##### 7.4.5.2 解压安装

**1、** 解压Zookeeper安装包到/usr/zookeeper/目录下；

```java
[root@hadoop-1 zookeeper]# tar -zxvf zookeeper-3.4.14.tar.gz -C /usr/zookeeper/
```

**2、** 在/usr/zookeeper/zookeeper-3.4.14这个目录下创建zkData；

```java
[root@hadoop-1 zookeeper-3.4.14]# mkdir -p zkData
```

**3、** 复制/usr/zookeeper/zookeeper-3.4.14/conf这个目录下的zoo_sample.cfg为zoo.cfg；

```java
[root@hadoop-1 conf]# cp zoo_sample.cfg zoo.cfg
```

##### 7.4.5.3 配置 zoo.cfg 文件

**1、** 具体配置；

dataDir=/usr/zookeeper/zookeeper-3.4.14/zkData

增加如下配置

```java
#######################cluster##########################
server.1=hadoop-1:2888:3888
server.2=hadoop-2:2888:3888
server.3=hadoop-3:2888:3888
```

**2、** 配置参数解读；

Server.A=B:C:D

A 是一个数字，表示这个是第几号服务器

B 是这个服务器的 ip 地址

C 是这个服务器与集群中的 Leader 服务器交换信息的端口

D 是万一集群中的Leader服务器挂了，需要一个端口来重新进行选举，选出一个新的 Leader，而这个端口就是用来执行选举时服务器相互通信的端口

集群模式下配置一个文件 myid，这个文件在 dataDir 目录下，这个文件里面有一个数据就是 A 的值，Zookeeper 启动时读取此文件，拿到里面的数据与 zoo.cfg 里面的配置信息比较从而判断到底是哪个 server
**3、** 集群操作；

A. 在 /usr/zookeeper/zookeeper-3.4.14/zkData 目录下创建一个 myid 的文件

```java
touch myid
```

添加 myid 文件，注意一定要在 linux 里面创建，在 notepad++ 里面很可能乱码

B. 编辑 myid 文件

```java
vim myid
```

在文件中添加与 server 对应的编号：如 1

C. 拷贝配置好的 zookeeper 到其他机器上

```java
scp -r /usr/zookeeper/zookeeper-3.4.14/ root@hadoop-2:/usr/zookeeper/zookeeper-3.4.14/
scp -r /usr/zookeeper/zookeeper-3.4.14/ root@hadoop-3:/usr/zookeeper/zookeeper-3.4.14/
```

并分别修改myid文件中内容为 2、3

D. 分别启动 zookeeper

```java
[root@hadoop-1 zookeeper-3.4.14]# bin/zkServer.sh start
[root@hadoop-2 zookeeper-3.4.14]# bin/zkServer.sh start
[root@hadoop-3 zookeeper-3.4.14]# bin/zkServer.sh start
```

E. 查看状态

```java
[root@hadoop-1 zookeeper-3.4.14]# bin/zkServer.sh status
ZooKeeper JMX enabled by default
Using config: /usr/zookeeper/zookeeper-3.4.14/bin/../conf/zoo.cfg
Mode: follower
[root@hadoop-2 zookeeper-3.4.14]# bin/zkServer.sh status
ZooKeeper JMX enabled by default
Using config: /usr/zookeeper/zookeeper-3.4.14/bin/../conf/zoo.cfg
Mode: follower
[root@hadoop-3 zookeeper-3.4.14]# bin/zkServer.sh status
ZooKeeper JMX enabled by default
Using config: /usr/zookeeper/zookeeper-3.4.14/bin/../conf/zoo.cfg
Mode: leader
```

hadoop-1、hadoop-2 为 follower，hadoop-3 为 leader

#### 7.4.6 配置 HDFS-HA 集群（以三台为例）

**1、** 官方地址：https://hadoop.apache.org/docs/stable/hadoop-project-dist/hadoop-hdfs/HDFSHighAvailabilityWithQJM.html；

**2、** 配置core-site.xml；

在前面手动 HA 配置的基础上，新增 **[core-site.xml]** 配置

```java
<property>
	<name>ha.zookeeper.quorum</name>
	<value>hadoop-1:2181,hadoop-2:2181,hadoop-3:2181</value>
</property>
```

**3、** 配置hdfs-site.xml；

在前面手动 HA 配置的基础上，新增 **[hdfs-site.xml]** 配置

```java
<property>
	<name>dfs.ha.automatic-failover.enabled</name>
	<value>true</value>
</property>
```

**4、** 拷贝配置好的hadoop环境到其他节点；

#### 7.4.7 启动

**1、** 关闭所有HDFS服务；

```java
[root@hadoop-1 hadoop-2.9.2]# stop-dfs.sh
```

**2、** 启动Zookeeper集群；

```java
[root@hadoop-1 zookeeper-3.4.14]# bin/zkServer.sh start
[root@hadoop-2 zookeeper-3.4.14]# bin/zkServer.sh start
[root@hadoop-3 zookeeper-3.4.14]# bin/zkServer.sh start
```

检查 ZK 启动状态，一个 leader，两个 follower
**3、** 初始化HA在Zookeeper中状态；

```java
[root@hadoop-1 hadoop-2.9.2]# hdfs zkfc -formatZK
```

初始化 ZK 的 HA 状态后，可到 ZK 上确认 hadoop-ha 目录存在，并且 mycluster 集群已被 ZK 管理

```java
[root@hadoop-2 hadoop-2.9.2]# cd /usr/zookeeper/zookeeper-3.4.14/
[root@hadoop-2 zookeeper-3.4.14]# bin/zkCli.sh
......
[zk: localhost:2181(CONNECTED) 0] ls /
[zookeeper, hadoop-ha]
[zk: localhost:2181(CONNECTED) 1] ls /hadoop-ha
[mycluster]
```

**4、** 启动HDFS服务：；

```java
[root@hadoop-1 hadoop-2.9.2]# start-dfs.sh
Starting namenodes on [hadoop-1 hadoop-2]
hadoop-1: starting namenode, logging to /usr/hadoop/hadoop-2.9.2/logs/hadoop-root-namenode-hadoop-1.out
hadoop-2: starting namenode, logging to /usr/hadoop/hadoop-2.9.2/logs/hadoop-root-namenode-hadoop-2.out
hadoop-1: starting datanode, logging to /usr/hadoop/hadoop-2.9.2/logs/hadoop-root-datanode-hadoop-1.out
hadoop-3: starting datanode, logging to /usr/hadoop/hadoop-2.9.2/logs/hadoop-root-datanode-hadoop-3.out
hadoop-2: starting datanode, logging to /usr/hadoop/hadoop-2.9.2/logs/hadoop-root-datanode-hadoop-2.out
Starting journal nodes [hadoop-1 hadoop-2 hadoop-3]
hadoop-1: starting journalnode, logging to /usr/hadoop/hadoop-2.9.2/logs/hadoop-root-journalnode-hadoop-1.out
hadoop-2: starting journalnode, logging to /usr/hadoop/hadoop-2.9.2/logs/hadoop-root-journalnode-hadoop-2.out
hadoop-3: starting journalnode, logging to /usr/hadoop/hadoop-2.9.2/logs/hadoop-root-journalnode-hadoop-3.out
Starting ZK Failover Controllers on NN hosts [hadoop-1 hadoop-2]
hadoop-1: starting zkfc, logging to /usr/hadoop/hadoop-2.9.2/logs/hadoop-root-zkfc-hadoop-1.out
hadoop-2: starting zkfc, logging to /usr/hadoop/hadoop-2.9.2/logs/hadoop-root-zkfc-hadoop-2.out
```

启动 HDFS 服务，观察启动日志，发现主要启动了：

(1) namenodes ： [hadoop-1 hadoop-2]

(2) journal nodes : [hadoop-1 hadoop-2 hadoop-3]

(3) ZK Failover Controllers : [hadoop-1 hadoop-2] (ZKFC 跟着 NN 走)

在各个节点上 jps 观察所有组件启动成功，在 web 界面观察两个 Namenode 的状态

NameNode 先启动的就是 Active 状态

##### 7.4.8 验证

**1、** 将ActiveNameNode进程kill；

```java
[root@hadoop-1 hadoop-2.9.2]# jps
5028 DataNode
2581 QuorumPeerMain
5607 Jps
5256 JournalNode
5465 DFSZKFailoverController
4910 NameNode
[root@hadoop-1 hadoop-2.9.2]# kill -9 4910
```

但是遗憾发现，Namenode1 被 kill 之后，Namenode2 并没有启动，解决方式见： **7.4.9 HDFS-HA 自动故障转移失败的原因**

，到 Namenode2 节点上看 hadoop-root-zkfc-hadoop-2.log 日志
**2、** 将ActiveNameNode机器断开网络；

```java
service network stop
```

观察上述两个场景下的 HDFS-HA 自动故障转移

#### 7.4.9 HDFS-HA 自动故障转移失败的原因

如果发现 HA 配置没有问题，但是不能自动切换 active 的 Namenode，我们可以查看 zkfc 的 log 日志，看是否会出现下面的 Warn 或者 Exception：

hadoop-2 ssh 到 hadoop-1 上，尝试连接到 8020 这个 rpc 端口，但是因为 hadoop-1 上的 Namenode 进程被关了，自然连不上

hadoop-2 使用了 fuser 工具，但是装的 Centos 是最小化安装，并不包含 fuser，所以需要在所有 Namenode 机器（hadoop-1，hadoop-2）上安装 fuser

```java
[root@hadoop-1 logs]# yum install psmisc
[root@hadoop-2 logs]# yum install psmisc
```

### 7.5 YARN-HA 配置

#### 7.5.1 YARN-HA 工作机制

**1、** 官方文档；

https://hadoop.apache.org/docs/stable/hadoop-yarn/hadoop-yarn-site/ResourceManagerHA.html

**1、** YARN-HA工作机制；

[外链图片转存失败,源站可能有防盗链机制,建议将图片保存下来直接上传(img-0GuSX3dm-1583649732230)(https://hadoop.apache.org/docs/stable/hadoop-yarn/hadoop-yarn-site/images/rm-ha-overview.png)]

#### 7.5.2 配置 YARN-HA 集群

##### 7.5.2.1 环境准备

在前面Hdfs HA 的基础上进行配置

##### 7.5.2.2 规划集群

和前面Hdfs HA 的集群的基础上规划：hadoop-1 和 hadoop-2 上配置 active/standby ResourceManager

hadoop-1
hadoop-2
hadoop-3

NameNode
NameNode
-

JournalNode
JournalNode
JournalNode

DataNode
DataNode
DataNode

ZK
ZK
ZK

ResourceManager
ResourceManager
-

NodeManager
NodeManager
NodeManager

#### 7.5.2.3 配置 yarn-site.xml

**[yarn-site.xml]**

```java
<configuration>
	<!-- Site specific YARN configuration properties -->
	<!-- reducer 获取数据的方式 -->
	<property>
		<name>yarn.nodemanager.aux-services</name>
		<value>mapreduce_shuffle</value>
	</property>
    <!--启用 resourcemanager ha-->
    <property>
        <name>yarn.resourcemanager.ha.enabled</name>
        <value>true</value>
    </property>
    <!--声明两台resourcemanager的地址-->
    <property>
        <name>yarn.resourcemanager.cluster-id</name>
        <value>cluster-yarn</value>
    </property>
    <property>
        <name>yarn.resourcemanager.ha.rm-ids</name>
        <value>rm1,rm2</value>
    </property>
    <property>
        <name>yarn.resourcemanager.hostname.rm1</name>
        <value>hadoop-1</value>
    </property>
    <property>
        <name>yarn.resourcemanager.hostname.rm2</name>
        <value>hadoop-2</value>
    </property>
    <!--指定zookeeper集群的地址--> 
    <property>
        <name>yarn.resourcemanager.zk-address</name>
        <value>hadoop-1:2181,hadoop-2:2181,hadoop-3:2181</value>
    </property>
    <!--启用自动恢复--> 
    <property>
        <name>yarn.resourcemanager.recovery.enabled</name>
        <value>true</value>
    </property>
    <!--指定resourcemanager的状态信息存储在zookeeper集群--> 
    <property>
        <name>yarn.resourcemanager.store.class</name>     
		<value>org.apache.hadoop.yarn.server.resourcemanager.recovery.ZKRMStateStore</value>
    </property>
	<!-- 忽略虚拟内存检查，如果实在实体机上，并且内存够多，可以去掉 -->
	<property>
		<name>yarn.nodemanager.vmen-check-enabled</name>
		<value>false</value>
	</property>
</configuration>
```

同步更新其他节点的配置信息

#### 7.4.2.4 启动 Hdfs

**前置状态：ZK 集群已起，Hadoop 未起**

**1、** 启动Hdfs；

```java
[root@hadoop-1 hadoop]# start-dfs.sh 
Starting namenodes on [hadoop-1 hadoop-2]
hadoop-1: starting namenode, logging to /usr/hadoop/hadoop-2.9.2/logs/hadoop-root-namenode-hadoop-1.out
hadoop-2: starting namenode, logging to /usr/hadoop/hadoop-2.9.2/logs/hadoop-root-namenode-hadoop-2.out
hadoop-1: starting datanode, logging to /usr/hadoop/hadoop-2.9.2/logs/hadoop-root-datanode-hadoop-1.out
hadoop-3: starting datanode, logging to /usr/hadoop/hadoop-2.9.2/logs/hadoop-root-datanode-hadoop-3.out
hadoop-2: starting datanode, logging to /usr/hadoop/hadoop-2.9.2/logs/hadoop-root-datanode-hadoop-2.out
Starting journal nodes [hadoop-1 hadoop-2 hadoop-3]
hadoop-1: starting journalnode, logging to /usr/hadoop/hadoop-2.9.2/logs/hadoop-root-journalnode-hadoop-1.out
hadoop-3: starting journalnode, logging to /usr/hadoop/hadoop-2.9.2/logs/hadoop-root-journalnode-hadoop-3.out
hadoop-2: starting journalnode, logging to /usr/hadoop/hadoop-2.9.2/logs/hadoop-root-journalnode-hadoop-2.out
Starting ZK Failover Controllers on NN hosts [hadoop-1 hadoop-2]
hadoop-1: starting zkfc, logging to /usr/hadoop/hadoop-2.9.2/logs/hadoop-root-zkfc-hadoop-1.out
hadoop-2: starting zkfc, logging to /usr/hadoop/hadoop-2.9.2/logs/hadoop-root-zkfc-hadoop-2.out
```

注意，此处 namenodes 在 [hadoop-1 hadoop-2] 都起来了！
**2、** 启动Yarn；

因为配置了 ResourceManager 在 hadoop-1、hadoop-2 上，所以在 hadoop-2 上启动效果一样

```java
[root@hadoop-2 hadoop]# yarn-daemon.sh start resourcemanager
starting resourcemanager, logging to /usr/hadoop/hadoop-2.9.2/logs/yarn-root-resourcemanager-hadoop-2.out
[root@hadoop-2 hadoop]# jps
24064 DataNode
24432 ResourceManager
24688 Jps
4995 QuorumPeerMain
23978 NameNode
24314 DFSZKFailoverController
24174 JournalNode
```

确认 ResourceManager 在 hadoop-2 上启动成功，可再次在 web 端确认:

**但是和 Hdfs HA 不一样，此时 hadoop-1 上并不会启动 ResourceManager，需要我们再次启动**

```java
[root@hadoop-1 hadoop]# yarn-daemon.sh start resourcemanager
starting resourcemanager, logging to /usr/hadoop/hadoop-2.9.2/logs/yarn-root-resourcemanager-hadoop-1.out
```

**3、** 查看服务状态；

```java
[root@hadoop-3 hadoop]# yarn rmadmin -getServiceState rm1
standby
[root@hadoop-3 logs]# yarn rmadmin -getServiceState rm2
active
```

可见 rm2 是 active 状态

### 7.5 HDFS Federation 架构设计

#### 7.5.1 NameNode 架构的局限性

**1、** Namespace（命名空间）的限制；

由于 NameNode 在内存中存储所有的元数据（metadata），因此单个 Namenode 所能存储的对象（文件+块）数目受到 Namenode 所在 JVM 的 heap size 的限制

50G 的 heap 能够存储 20亿（200million）个对象，这 20 亿个对象支持 4000 个 Datanode，12PB 的存储（假设文件平均大小为 40MB）

随着数据的飞速增长，存储的需求也随之增长

单个 Datanode 从 4T 增长到 36T，集群的尺寸增长到 8000 个 Datanode，存储的需求从 12PB 增长到大于100PB
**2、** 隔离问题；

由于 HDFS 仅有一个 Namenode，无法隔离各个程序，因此 HDFS 上的一个实验程序就很有可能影响整个 HDFS 上运行的程序
**3、** 性能的瓶颈；

由于是单个 Namenode 的 HDFS 架构，因此整个 HDFS 文件系统的吞吐量受限于单个 Namenode 的吞吐量

#### 7.5.2 HDFS Federation 架构设计

能不能有多个NameNode

NameNode
NameNode
NameNode

元数据
元数据
元数据

Log
machine
电商数据/话单数据

#### 7.5.3 HDFS Federation 应用思考

不同应用可以使用不同 NameNode 进行数据管理

图片业务、爬虫业务、日志审计业务

Hadoop 生态系统中，不同的框架使用不同的 NameNode 进行管理 Namespace（隔离性）
