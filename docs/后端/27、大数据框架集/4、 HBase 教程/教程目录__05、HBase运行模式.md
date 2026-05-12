# 05、HBase运行模式
- 来源：https://ddkk.com/zhuanlan/bigdata/hbase/5.html
- 分类：大数据框架
- 分组：教程目录
## HBase运行模式：独立式和分布式

HBase有两种运行模式：独立式和分布式。HBase以独立模式运行。无论您的模式如何，您都需要通过编辑HBase conf目录中的文件来配置HBase 。至少，您必须编辑conf/hbase-env.sh来告诉HBase要使用哪个java。在这个文件中，你设置了HBase环境变量，比如JVM的heapsize和其他选项，日志文件的首选位置等等。设置JAVA_HOME以指向你的java安装的根目录。

### 独立式HBase

默认情况下使用的是独立式的HBase。在“[快速启动HBase](https://www.w3cschool.cn/hbase_doc/hbase_doc-m3y62k51.html)”一节中，我们已经介绍过独立模式。在独立模式下，HBase不使用HDFS，而是使用本地文件系统，是在同一个JVM中运行所有HBase守护进程和本地ZooKeeper。ZooKeeper绑定到一个众所周知的端口，通过该端口，客户端可以和HBase进行通信。

#### 独立于HBFS的HBase

有时在独立的hbase上有一个有用的变体，它的所有的守护进程都在一个JVM中运行，而不是坚持到本地文件系统，而是坚持到一个HDFS实例。

当您打算使用简单的部署配置文件时，您可能会考虑使用此配置文件，加载很轻松，但是数据必须在节点的出入之间持续存在。向 HDFS 写入数据的地方可以确保后者。

要配置此独立变体，请编辑hbase-site.xml，设置hbase.rootdir以指向HDFS实例中的某个目录，然后将hbase.cluster.distributed设置为false。例如：

```java
<configuration>
  <property>
    <name>hbase.rootdir</name>
    <value>hdfs://namenode.example.org:8020/hbase</value>
  </property>
  <property>
    <name>hbase.cluster.distributed</name>
    <value>false</value>
  </property>
</configuration>
```

### 分布式HBase

分布式模式可以细分为分布式、伪分布式（所有守护进程都在单个节点上运行）、完全分布式（守护进程分布在集群中的所有节点上）。其中，伪分布式模式与完全分布式的命名来自于Hadoop。

伪分布式模式可以针对本地文件系统运行，也可以针对Hadoop分布式文件系统（HDFS）的实例运行。完全分布式模式只能在HDFS上运行。有关如何设置HDFS，请参阅[Hadoop HDFS](https://www.w3cschool.cn/hadoop/xvmi1hd6.html)。

#### 伪分布式HBase

伪分布式模式的HBase就是在单个主机上运行的完全分布式模式。使用此HBase配置仅进行测试和原型设计。请勿将此配置用于生产或性能评估。

#### 完全分布式

默认情况下，HBase以独立模式运行，独立模式和伪分布模式用于小规模测试。对于生产环境，建议使用分布式模式。在分布式模式下，HBase守护进程的多个实例在集群中的多个服务器上运行。

就像在伪分布式模式中一样，完全分布式的配置要求您将hbase.cluster.distributed属性设置为true。通常情况下，hbase.rootdir被配置为指向高可用性的HDFS文件系统。

此外，还配置了群集，以便多个群集节点成为RegionServer、ZooKeeper QuorumPeers和备份HMaster服务器。、

**分布式区域服务器（RegionServers）**

通常，你的群集将包含多个运行在不同服务器上的RegionServer，以及主要和备份Master和ZooKeeper守护程序。主服务器上的conf/regionservers文件中包含一个主机列表，其RegionServers与该集群相关。每个主机都在一个单独的行上。当主服务器启动或停止时，此文件中列出的所有主机将启动和停止其RegionServer进程。

**ZooKeeper和HBase**

有关HBase的ZooKeeper设置说明，请参见ZooKeeper部分。

示例– 分布式HBase集群示例

这是一个分布式HBase集群的简单的conf/hbase-site.xml。用于实际工作的群集将包含更多自定义配置参数。大多数HBase配置指令都具有默认值，除非在hbase-site.xml中覆盖该值，否则将使用这些默认值。有关更多信息，请参阅“配置文件”。

```java
<configuration>
  <property>
    <name>hbase.rootdir</name>
    <value>hdfs://namenode.example.org:8020/hbase</value>
  </property>
  <property>
    <name>hbase.cluster.distributed</name>
    <value>true</value>
  </property>
  <property>
    <name>hbase.zookeeper.quorum</name>
    <value>node-a.example.com,node-b.example.com,node-c.example.com</value>
  </property>
</configuration>
```

这是conf/regionservers文件的示例，其中包含应在集群中运行RegionServer的节点的列表。这些节点需要安装HBase，他们需要使用与主服务器相同的conf /目录内容：

```java
node-a.example.com
node-b.example.com
node-c.example.com
```

这是conf/backup-masters文件的示例，其中包含应运行备份主实例的每个节点的列表。除非主主站变为不可用，否则备份主站实例将处于空闲状态。

```java
node-b.example.com
node-c.example.com
```

**分布式HBase快速入门**

请参阅快速入门 – 完全分布，了解包含多个ZooKeeper、备份HMaster和RegionServer实例的简单三节点群集配置。

HDFS客户端配置

**1、** 值得注意的是，如果您在Hadoop集群上进行了HDFS客户端配置更改（例如，HDFS客户端的配置指令），而不是服务器端配置，则必须使用以下方法之一来启用HBase以查看和使用这些配置更改：

```java
 *  在hbase-env.sh中添加一个指向你HADOOP\_CONF\_DIR的HBASE\_CLASSPATH环境变量的指针；
 *  在$ \{HBASE\_HOME\}/conf下添加一个hdfs-site.xml（或hadoop-site.xml）或更好的符号链接；
 *  如果只有一小部分HDFS客户端配置，请将它们添加到hbase-site.xml。
```

这种HDFS客户端配置的一个例子是dfs.replication。例如，如果希望以5的复制因子运行，则HBase将创建缺省值为3的文件，除非您执行上述操作以使配置可用于HBase。
