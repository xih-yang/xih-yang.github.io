# 04、HBase基础条件
- 来源：https://ddkk.com/zhuanlan/bigdata/hbase/4.html
- 分类：大数据框架
- 分组：教程目录
在本节中，我们列出了使用HBase时所需要的服务和一些必需的系统配置。

## 安装Java

Java是Hadoop和HBase主要先决条件。首先应该使用”java -verion”检查java是否存在在您的系统上。 java -version 命令的语法如下。

```java
$ java -version
```

如果一切正常，它会得到下面的输出。

```java
java version "1.7.0_71"
Java(TM) SE Runtime Environment (build 1.7.0_71-b13)
Java HotSpot(TM) Client VM (build 25.0-b02, mixed mode)
```

如果Java还没有安装在系统中，请你[安装Java][Java]！

### HBase版本与JDK

在下表中你可以看到HBase版本与其对应支持的JDK版本：

HBase版本
JDK 7
JDK 8

2.0

[不支持](http://search-hadoop.com/m/YGbbsPxZ723m3as)

支持

1.3

支持

支持

1.2

支持

支持

1.1

支持

使用JDK 8运行将会正常工作，但是没有得到很好的测试。

**注意：**HBase不会使用Java 6构建或编译，并且，您必须在群集的每个节点上设置JAVA_HOME，hbase-env.sh 提供了一个方便的机制来做到这一点。

## 操作系统

SSH

（必须的）HBase广泛使用安全Shell（ssh）命令和实用程序在集群节点之间进行通信。集群中的每台服务器都必须运行ssh，以便可以管理Hadoop和HBase后台进程。您必须能够使用共享密钥而不是密码，通过SSH（包括本地节点）从主服务器和任何备份主服务器连接到所有节点。您可以在Linux或Unix系统中的“Procedure：Configure Passwordless SSH Access ”（配置无密码SSH访问）中看到这种设置的基本方法。如果群集节点使用OS X，请参阅Hadoop wiki上的，[SSH：设置远程桌面和启用自登录](https://wiki.apache.org/hadoop/Running_Hadoop_On_OS_X_10.5_64-bit_%28Single-Node_Cluster%29)。

DNS

HBase使用本地主机名来自行报告其IP地址。正向和反向DNS解析必须在0.92.0之前的HBase版本中工作。hadoop-dns-checker 工具，可以用来验证DNS在集群上是否正常工作。项目README文件提供了有关使用的详细说明。

**Loopback IP**

在hbase-0.96.0之前，HBase只使用IP地址127.0.0.1来引用localhost，而这是不可配置的。有关更多详细信息，请参阅Loopback IP。

NTP

群集节点上的时钟应该同步。少量的变化是可以接受的，但是大量的不同会导致不稳定和意外的行为。如果在群集中看到无法解释的问题，则时间同步是首先要检查的事项之一。建议您在群集上运行网络时间协议（NTP）服务或其他时间同步机制，并且所有节点都查找相同的服务以进行时间同步。请参阅Linux文档项目（TLDP）中的基本NTP配置以设置NTP。

文件和进程数限制（ulimit）

Apache HBase是一个数据库。它需要能够一次打开大量的文件。许多Linux发行版限制了允许单个用户打开的文件数量1024（或者256，在旧版本的OS X上）。当以运行 HBase 的用户身份登录时，您可以通过在服务器上运行ulimit -n命令来检查服务器上的限制。您也可能会注意到以下错误：

```java
2010-04-06 03：04：37,542信息org.apache.hadoop.hdfs.DFSClient：异常increateBlockOutputStream java.io.EOFException
2010-04-06 03：04：37,542 INFO org.apache.hadoop.hdfs.DFSClient：放弃块blk_-6935524980745310745_1391901
```

建议将ulimit提高到至少10,000，但更可能是10,240，因为该值通常以1024的倍数表示。每个ColumnFamily至少有一个StoreFile，如果该区域处于加载状态，则可能有多于六个的StoreFile。所需的打开文件的数量取决于ColumnFamilies的数量和区域的数量。以下是计算RegionServer上打开的文件的潜在数量的粗略公式。

**计算打开文件的潜在数量：**

```java
（每个ColumnFamily的StoreFiles）x（每个RegionServer的区域）
```

例如，假设一个模式的每个区域有3个ColumnFamilies，每个ColumnFamily平均有3个StoreFiles，每个RegionServer有100个区域，则JVM将打开3 * 3 * 100 = 900文件描述符，不包括打开的JAR文件、配置文件等等。打开一个文件不需要很多资源，而且允许用户打开太多文件的风险很小。

另一个相关设置是允许用户同时运行的进程数量。在Linux和Unix中，使用该ulimit -u命令设置进程的数量。这不应与nproc命令混淆，该命令控制给定用户可用的CPU数量。在负载下，ulimit -u太低会导致OutOfMemoryError异常。

为运行HBase进程的用户配置文件描述符和进程的最大数量是操作系统配置，而不是HBase配置。确保为实际运行HBase的用户更改设置也很重要。要查看哪个用户启动了HBase，以及该用户的ulimit配置，请查看该实例的HBase日志的第一行。

**示例：ulimit在Ubuntu上的设置**

要在Ubuntu上配置ulimit设置，请编辑：/etc/security/limits.conf，它是一个由四列组成的空格分隔的文件。在以下示例中，第一行将用户名为hadoop的操作系统用户的打开文件数（nofile）的软限制和硬限制设置为32768。第二行将同一用户的进程数设置为32000。

```java
hadoop  -  nofile 32768
hadoop  -  nproc 32000
```

这些设置仅适用于可插入身份验证模块（PAM）环境指示使用它们的情况。要配置PAM以使用这些限制，请确保/etc/pam.d/common-session文件包含以下行：

```java
session required  pam_limits.so
```

Linux Shell

所有HBase附带的shell脚本都依赖于 [GNU Bash](http://www.gnu.org/software/bash) shell。

Windows

在HBase 0.96之前，在Microsoft Windows上运行HBase仅限于测试目的。不建议在Windows计算机上运行生产系统。

## Hadoop

下表总结了每个HBase版本支持的Hadoop版本。基于HBase的版本，您应该选择最合适的Hadoop版本。参考更多关于[Hadoop环境配置](https://www.w3cschool.cn/hadoop/hadoop_enviornment_setup.html)的内容！

**建议使用 Hadoop 2.x：**Hadoop 2.x 速度更快，包括短路读取功能，这将有助于提高您的 HBase 随机读取配置文件；Hadoop 2.x 还包括重要的 bug 修复，可以改善您的整体 HBase 体验；HBase 不支持使用早期版本的 Hadoop 运行；有关特定于不同 HBase 版本的要求，请参见下表；Hadoop 3.x 仍处于早期访问版本中，尚未被 HBase 社区对生产用例进行充分测试。

使用以下的注解来解释下面的这个表格：

Hadoop版本支持矩阵：

- “S”=支持
- “X”=不支持
- “NT”=未测试

HBase的-1.1.x中
HBase的-1.2.x的
HBase的-1.3.x的
HBase的-2.0.x版本

Hadoop-2.0.x-alpha

X

X

X

X

Hadoop-2.1.0-beta

X

X

X

X

Hadoop-2.2.0

NT

X

X

X

Hadoop-2.3.x

NT

X

X

X

Hadoop-2.4.x

S

S

S

X

Hadoop-2.5.x

S

S

S

X

Hadoop-2.6.0

X

X

X

X

Hadoop-2.6.1+

NT

S

S

S

Hadoop-2.7.0

X

X

X

X

Hadoop-2.7.1+

NT

S

S

S

Hadoop-2.8.0

X

X

X

X

Hadoop-2.8.1

X

X

X

X

Hadoop-3.0.0

NT

NT

NT

NT

### Hadoop Pre-2.6.1 和 JDK 1.8 Kerberos

在Kerberos 环境中使用 pre-2.6.1 Hadoop 版本和 JDK 1.8 时，HBase 服务器可能因 Kerberos keytab relogin 错误而失败并中止。JDK 1.7 (1.7. 0_80) 的后期版本也有问题。在这种情况下考虑升级到Hadoop 2.6.1+。

### Hadoop 2.6.x

如果您计划在 HDFS 加密区域的顶部运行 HBase，则基于 2.6.x 行的 Hadoop 发行版必须具有 HADOOP-11710 应用。如果不这样做，将导致群集故障和数据丢失。此修补程序存在于Apache Hadoop 2.6.1+版本中。

### Hadoop 2.7.x

Hadoop 2.7.0版本未经测试或不受支持，因为Hadoop PMC明确将该版本标记为不稳定。

### Hadoop 2.8.x

Hadoop 2.8.0和2.8.1版本未经测试或不受支持，因为Hadoop PMC明确标记版本不稳定。

### 更换与 HBase 捆绑的 Hadoop

因为HBase 依赖于Hadoop，它将Hadoop jar的一个实例捆绑在其 lib 目录下。捆绑的 jar 仅用于在独立模式下使用。在分布式模式下，群集上的 Hadoop 版本与 HBase 下的内容相匹配是至关重要的。将在 HBase lib 目录中找到的 hadoop jar 替换为您在群集上运行的 hadoop jar，以避免版本不匹配问题。确保在整个集群中替换 HBase 中的 jar。

### dfs.datanode.max.transfer.threads

HDFS DataNode在任何时候都会有一个文件数上限。在进行任何加载之前，请确保您已经配置了Hadoop的conf / hdfs-site.xml，并将该dfs.datanode.max.transfer.threads值设置为至少如下的值：

```java
<property>
  <name>dfs.datanode.max.transfer.threads</name>
  <value>4096</value>
</property>
```

进行上述配置后，务必重新启动HDFS。

没有这个配置就会造成奇怪的故障。其中一种表现是对缺失区块的投诉。例如：

```java
10/12/08 20:10:31 INFO hdfs.DFSClient: Could not obtain block
          blk_XXXXXXXXXXXXXXXXXXXXXX_YYYYYYYY from any node: java.io.IOException: No live nodes
          contain current block. Will get new block locations from namenode and retry...
```

### ZooKeeper要求

动物园管理员3.4.x 是必需的。HBase 使用的多功能, 只可从动物园管理员3.4.0。hbase.zookeeper.useMulti 配置属性默认为 true。参考 HBASE-12241 (在采用deadserver的复制队列时会中断复制的regionServer的崩溃) 和 HBASE-6775 (在可用于HBASE-6710 0.92 / 0.94兼容性修补程序时使用ZK.multi)。该属性被弃用，并且在 HBase 2.0 中始终启用 useMulti。
