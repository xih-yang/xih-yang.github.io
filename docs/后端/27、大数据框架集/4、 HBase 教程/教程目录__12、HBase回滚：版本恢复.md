# 12、HBase回滚：版本恢复
- 来源：https://ddkk.com/zhuanlan/bigdata/hbase/12.html
- 分类：大数据框架
- 分组：教程目录
## HBase回滚

当你在试着升级 HBase 的时候，你可能会遇到升级失败的问题，并且想要将其恢复成之前的版本。本节就介绍如何执行回滚以将 HBase 恢复为到较早的版本。请注意，这应该只在主要版本和一些次要版本之间需要。您应该始终能够在相同次要版本的 HBase Patch 版本之间进行降级。这些说明可能要求您在开始升级过程之前注意相关的事项，因此请务必事先阅读本节。

### HBase回滚注意事项

回滚与降级：

本节介绍如何对 HBase 次要版本和主要版本之间的升级执行回滚。在本文档中，回滚指的是采取升级后的集群并将其恢复到旧版本的过程，同时丢失升级后发生的所有更改。相比之下，群集降级会将升级后的群集恢复到旧版本，同时保留升级后写入的任何数据。我们目前仅提供回滚 HBase 集群的说明。此外，只有在执行升级之前遵循这些说明，回滚才有效。

当这些指令谈论回滚与降级的先决条件群集服务（即HDFS）时，您应该将服务版本与退化的降级案例视为相同。

复制：

除非您正在执行全部服务回滚，否则 HBase 群集将会丢失任何配置的对等 HBase 复制。如果您的集群配置为 HBase 复制，那么在按照这些说明进行操作之前，您应该记录所有复制节点。执行回滚之后，您应该将每个记录的对等点添加回群集。另外要注意，自升级后写入群集的数据可能已经或可能未被复制到任何对等方。

数据地点：

除非您正在执行全部服务回滚，否则通过回滚过程可能会破坏Region Server的所有局部位置。在群集有时间通过紧凑排列恢复数据位置之前，您应该期望性能的降级。或者，您可以强制压缩来加速此过程，但要以生成群集负载为代价。

可配置的位置：

以下说明假设 HBase 数据目录和 HBase znode 的默认位置。这两个位置都是可配置的，您应该在继续操作之前验证群集中使用的值。如果您有不同的值，只需将默认值替换为在配置中找到的 HBase 数据目录，它是通过密钥 “HBase” (rootdir) 配置的，并且具有默认的 “/HBase”。* HBase znode通过密钥’zookeeper.znode.parent’进行配置，默认值为’/ hbase’。

### 所有服务回滚

如果您要执行 HDFS 和 ZooKeeper 服务的回滚，那么 HBase 的数据将在此过程中回滚。

**要求**

- 能够回滚 HDFS 和 ZooKeeper

**升级前**

在升级前不需要额外的步骤。作为一项额外的预防措施，您可能希望使用 distcp 将 HBase 数据备份到要升级的群集之外。为此，请本节内容中的按照“HDFS降级后回滚”的“升级前”部分中的步骤操作，但它是复制到另一个 HDFS 实例，而不是在同一实例中。

**执行回滚**

**1、** 停止HBase；

**2、** 执行HDFS和ZooKeeper的回滚（HBase应该保持停止状态）；

**3、** 将安装的HBase版本更改为以前的版本；

**4、** 启动HBase；

**5、** 验证HBase内容–使用HBaseshell列出表格并扫描一些已知值；

### HDFS 回滚和 ZooKeeper 降级后回滚

如果您将回滚 HDFS，但通过 ZooKeeper 降级，那么 HBase 将处于不一致的状态。在完成此过程之前，您必须确保集群未启动。

**要求**

- 能够回滚 HDFS
- 能够降级 ZooKeeper

**升级前**

在升级前不需要额外的步骤。作为一种额外的预防措施，您可能希望使用 distcp 将 HBase 数据备份到要升级的群集之外。为此，请本节内容中的按照“HDFS降级后回滚”的“升级前”部分中的步骤操作，但它将复制到另一个HDFS实例，而不是在同一实例中。

**执行回滚**

**1、** 停止HBase；

**2、** 执行HDFS回滚和ZooKeeper降级（HBase应该保持停止状态）；

**3、** 将安装的HBase版本更改为以前的版本；

**4、** 清除与HBase相关的ZooKeeper信息警告：此步骤将永久销毁所有复制对等点；

清理ZooKeeper 中的 HBase 信息：

```java
    [hpnewton@gateway_node.example.com ~]$ zookeeper-client -server zookeeper1.example.com:2181,zookeeper2.example.com:2181,zookeeper3.example.com:2181
    Welcome to ZooKeeper!
    JLine support is disabled
    rmr /hbase
    quit
    Quitting...
```

**5、** 启动HBase；

**6、** 验证HBase内容–使用HBaseshell列出表格并扫描一些已知值；

### HDFS 降级后回滚

如果您要执行 HDFS 降级，则无论ZooKeeper是否通过回滚、降级或重新安装，您都需要遵循这些指示信息。

**要求**

- 可以降级 HDFS
- 升级前群集必须能够运行 MapReduce 作业
- HDFS 超级用户访问
- 在 HDFS 中至少有两个 HBase 数据目录的副本空间

**升级前**

在开始升级过程之前，您必须对 HBase 的支持数据进行完整备份。以下说明介绍了在当前HDFS实例中备份数据的过程。或者，您可以使用 distcp 命令将数据复制到另一个 HDFS 群集。

**1、** 停止HBase群集；

**2、** 将HBase数据目录复制到备份位置,方法是使用distcp命令作为HDFS超级用户(下面显示在启用安全的群集上)；

使用distcp备份HBase数据目录：

```java
    [hpnewton@gateway_node.example.com ~]$ kinit -k -t hdfs.keytab hdfs@EXAMPLE.COM
    [hpnewton@gateway_node.example.com ~]$ hadoop distcp /hbase /hbase-pre-upgrade-backup
```

**3、** Distcp将启动一个mapreduce作业来处理以分布式方式复制文件检查distcp命令的输出，以确保此作业成功完成；

**执行回滚**

**1、** 停止HBase；

**2、** 执行HDFS的降级和ZooKeeper的降级/回滚（HBase应该保持停止状态）；

**3、** 将安装的HBase版本更改为以前的版本；

**4、** 将HBase数据目录从升级前恢复为HDFS超级用户(如下所示在启用安全的群集上)如果您将数据备份到另一个HDFS群集而不是本地，则需要使用distcp命令将其复制回当前的HDFS群集；

恢复HBase 数据目录：

```java
    [hpnewton@gateway_node.example.com ~]$ kinit -k -t hdfs.keytab hdfs@EXAMPLE.COM
    [hpnewton@gateway_node.example.com ~]$ hdfs dfs -mv /hbase /hbase-upgrade-rollback
    [hpnewton@gateway_node.example.com ~]$ hdfs dfs -mv /hbase-pre-upgrade-backup /hbase
```

**5、** 清除与HBase相关的ZooKeeper信息警告：此步骤将永久销毁所有复制对等点；

清理ZooKeeper 中的 HBase 信息：

```java
    [hpnewton@gateway_node.example.com ~]$ zookeeper-client -server zookeeper1.example.com:2181,zookeeper2.example.com:2181,zookeeper3.example.com:2181
    Welcome to ZooKeeper!
    JLine support is disabled
    rmr /hbase
    quit
    Quitting...
```

**6、** 启动HBase；

**7、** 验证HBase内容–使用HBaseshell列出表格并扫描一些已知值；

## 相关教程

[ZooKeeper教程](https://www.w3cschool.cn/zookeeper/zookeeper_overview.html)
