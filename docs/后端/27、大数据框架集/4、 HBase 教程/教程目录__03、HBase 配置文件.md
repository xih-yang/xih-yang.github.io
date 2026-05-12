# 03、HBase 配置文件
- 来源：https://ddkk.com/zhuanlan/bigdata/hbase/3.html
- 分类：大数据框架
- 分组：教程目录
## Apache HBase配置文件

本节是本章内容的开篇，我们首先来认识Apache HBase中有哪些需要的配置文件！

Apache HBase使用与[Apache Hadoop](https://www.w3cschool.cn/hadoop/hadoop_enviornment_setup.html)相同的配置系统。所有配置文件都位于conf/目录中，需要保持群集中每个节点的同步。

### HBase配置文件说明

- backup-masters

默认情况下不存在。这是一个纯文本文件，其中列出了主服务器应在其上启动备份主进程的主机，每行一台主机。

- hadoop-metrics2-hbase.properties

用于连接HBase Hadoop的Metrics2框架。有关Metrics2的更多信息，请参阅[Hadoop Wiki条目](https://wiki.apache.org/hadoop/HADOOP-6728-MetricsV2)。默认情况下只包含注释出的示例。

- hbase-env.cmd 和 hbase-env.sh

用于Windows和Linux/Unix环境的脚本，以设置HBase的工作环境，包括Java、Java选项和其他环境变量的位置。该文件包含许多注释示例来提供指导。

- hbase-policy.xml

RPC服务器使用默认策略配置文件对客户端请求进行授权决策。仅在启用HBase安全性的情况下使用。

- hbase-site.xml

主要的HBase配置文件。该文件指定覆盖HBase的默认配置的配置选项。您可以在docs/hbase-default.xml中查看（但不要编辑）默认配置文件。您还可以在HBase Web UI的HBase配置选项卡中查看群集的整个有效配置（默认和覆盖）。

- log4j.properties

通过log4j进行HBase日志记录的配置文件。

- regionservers

包含应该在HBase集群中运行RegionServer的主机列表的纯文本文件。默认情况下，这个文件包含单个条目localhost。它应该包含主机名或IP地址列表，每行一个，如果集群中的每个节点将在其localhost接口上运行RegionServer的话，则只应包含localhost。

### 检查XML有效性

在编辑XML时，最好使用支持XML的编辑器，以确保您的语法正确且XML格式良好。您还可以使用该xmllint实用程序检查您的XML格式是否正确。默认情况下，xmllint重新流动并将XML打印到标准输出。要检查格式是否正确，并且只在存在错误时才打印输出，请使用命令xmllint -noout filename.xml。

### 在群集之间保持同步配置

当在分布式模式下运行时, 在对HBase配置进行编辑后，请确保将conf/目录的内容复制到群集的所有节点。HBase不会为你这么做的。请使用 rsync、scp 或其他安全机制将配置文件复制到你的节点。对于大多数配置, 服务器需要重新启动才能成功更改。动态配置是这方面的一个例外，在之后的内容将对此进行说明。
