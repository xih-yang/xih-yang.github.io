# 06、HBase 开始运行
- 来源：https://ddkk.com/zhuanlan/bigdata/hbase/6.html
- 分类：大数据框架
- 分组：教程目录
## 运行HBase

保证HDFS第一次运行，你需要通过在HADOOP_HOME目录中运行bin/start-hdfs.sh来启动和停止Hadoop HDFS守护进程。你确保它正确启动的方法是通过在 Hadoop 文件系统中测试文件的put和get。HBase通常不使用MapReduce或YARN守护进程，因此它们不需要启动。

如果您正在管理您自己的ZooKeeper，请启动它并确认它正在运行，否则HBase将启动ZooKeeper作为其启动过程的一部分。

你可以从HBASE_HOME目录使用以下命令来启动HBase：

```java
bin/start-hbase.sh
```

您现在应该有一个正在运行的HBase实例。HBase日志可以在日志子目录中找到。检查出来，特别是如果HBase启动困难。

HBase也提供了一个UI列出了重要的属性。默认情况下，它被部署在16010端口的主控主机上（默认情况下HBase RegionServers侦听端口16020，并在端口16030建立一个信息HTTP服务器）。如果主服务器（Master ）在默认端口上指定的master.example.org主机上运行，请将浏览器指向http://master.example.org:16010以查看Web界面。

一旦HBase启动，请参阅下面的shell部分，了解创建表，添加数据，扫描插入内容以及最终禁用和删除表的一些操作命令。

退出HBase shell后停止HBase进入：

```java
$ ./bin/stop-hbase.sh
stopping hbase...............
```

关机可能需要稍等一些时间才能完成。如果您的集群由多台计算机组成，则可能需要更长的时间。如果您正在运行分布式操作，那么在停止Hadoop守护进程之前，一定要等到HBase完全关闭。

## HBase Shell

使用Shell可以与HBase进行通信。HBase使用Hadoop文件系统来存储数据。它拥有一个主服务器和区域服务器。数据存储将在区域(表)的形式。这些区域被分割并存储在区域服务器。

主服务器管理这些区域服务器，所有这些任务发生在HDFS。下面给出的是一些由HBase Shell支持的命令。

### Shell 通用命令

- status: 提供HBase的状态，例如，服务器的数量。
- version: 提供正在使用HBase版本。
- table_help: 表引用命令提供帮助。
- whoami: 提供有关用户的信息。

### Shell 数据定义语言

下面列举了HBase Shell支持的可以在表中操作的命令。

- create: 用于创建一个表。
- list: 用于列出HBase的所有表。
- disable: 用于禁用表。
- is_disabled: 用于验证表是否被禁用。
- enable: 用于启用一个表。
- is_enabled: 用于验证表是否已启用。
- describe: 用于提供了一个表的描述。
- alter: 用于改变一个表。
- exists: 用于验证表是否存在。
- drop: 用于从HBase中删除表。
- drop_all: 用于丢弃在命令中给出匹配“regex”的表。
- Java Admin API: 在此之前所有的上述命令，Java提供了一个通过API编程来管理实现DDL功能。在这个org.apache.hadoop.hbase.client包中有HBaseAdmin和HTableDescriptor 这两个重要的类提供DDL功能。

### Shell 数据操作语言

- put: 用于把指定列在指定的行中单元格的值在一个特定的表。
- get: 用于取行或单元格的内容。
- delete:用于删除表中的单元格值。
- deleteall: 用于删除给定行的所有单元格。
- scan: 用于扫描并返回表数据。
- count: 用于计数并返回表中的行的数目。
- truncate: 用于禁用、删除和重新创建一个指定的表。
- Java client API: 在此之前所有上述命令，Java提供了一个客户端API来实现DML功能，CRUD（创建检索更新删除）操作更多的是通过编程，在org.apache.hadoop.hbase.client包下。 在此包HTable 的 Put和Get是重要的类。

### 启动 HBase Shell

要访问HBase shell，你需要进入到HBase的主文件夹中：

```java
cd /usr/localhost/
cd Hbase
```

然后通过使用“hbase shell”命令启动HBase shell：

```java
./bin/hbase shell
```

如果已成功在系统中安装HBase，那么它会给出 HBase shell 提示符，如下图所示。

```java
HBase Shell; enter 'help<RETURN>' for list of supported commands.
Type "exit<RETURN>" to leave the HBase Shell
Version 0.94.23, rf42302b28aceaab773b15f234aa8718fff7eea3c, Wed Aug 27
00:54:09 UTC 2014
hbase(main):001:0>
```

### 退出 HBase Shell

要退出shell命令，你可以通过键入 exit 或使用 实现。
