# 11、Hadoop 教程 - Hadoop HDFS集群滚动升级
- 来源：https://ddkk.com/zhuanlan/bigdata/hadoop/2/11.html
- 分类：大数据框架
- 分组：教程目录
## 1. 介绍

HDFS 滚动升级允许升级单个 HDFS 守护程序。例如，可以独立于 NameNodes 升级 DataNodes。也可以独立于其他 NameNodes 升级单独 NameNode。也可以独立于 DataNodes 和 journal nodes 升级 NameNodes。

## 2. 升级

在Hadoop v2 中，HDFS 支持 NameNode 高可用（HA）和线路兼容性（wire compatibility）。这两个功能使升级 HDFS 变得可行，且不会导致 HDFS 停机。为了在不停机的情况下升级 HDFS 群集，必须使用 HA 设置群集。

如果新软件版本中启用了任何新功能，则升级后可能无法与旧软件版本一起使用。在这种情况下，应按照以下步骤进行升级。

禁用新功能、升级集群、启用新功能。

注意，仅从 Hadoop-2.4.0 起才支持滚动升级。

### 2.1 不停机升级

在HA 群集中，有两个或多个 NameNode（NN），许多 DataNode（DN），一些 JournalNode（JN）和一些 ZooKeeperNode（ZKN）。JN 相对稳定，在大多数情况下，升级 HDFS 时不需要升级。滚动升级过程中，仅针对 NNs 和 DNs，JNS 和 ZKNs 都没有。升级 JN 和 ZKN 可能会导致群集停机。

#### 2.1.1 升级非联邦集群

假设有两个名称节点 NN1 和 NN2，其中 NN1 和 NN2 分别处于 Active 和 StandBy 状态。以下是升级 HA 群集的步骤：

- **准备滚动升级**
- 运行`hdfs dfsadmin -rollingUpgrade prepare`以创建用于回滚的`fsimage`
- 运行`hdfs dfsadmin -rollingUpgrade query`以检查回滚`fsimage`的状态。等待并重新运行命令，直到显示`Proceeding with Rolling Upgrade`信息。
- **升级 Active 和 StandBy NN**
- 关闭并升级 NN2。
- 启动 NN2 成为 StandBy 状态通过`-rollingUpgrade started`选项。
- 从 NN1 到 NN2 的故障转移，以便 NN2 变为活动状态，而 NN1 变为待机状态。
- 关闭并升级 NN1。
- 启动 NN1 成为 StandBy 状态通过`-rollingUpgrade started`选项。
- **升级DN**
- 选择一小部分 DN 节点（例如，特定机架下的所有数据节点）。
- 运行`hdfs dfsadmin -shutdownDatanode  upgrade`以关闭所选的 DN。
- 运行`hdfs dfsadmin -getDatanodeInfo `进行检查，然后等待 DN 关闭。
- 升级并重启 DN 节点。
- 对子集中的所有选定 DN 节点并行执行以上步骤。
- 重复上述步骤，直到升级群集中的所有 DN 节点。
- **完成滚动升级**
- 运行`hdfs dfsadmin -rollingUpgrade finalize`完成滚动升级。

#### 2.1.2 升级联邦集群

在联邦集群中，有多个名称空间以及每个名称空间的一对 Active 和 StandBy NN。升级联合群集的过程类似于升级非联邦群集的过程，不同之处在于：

- **为每个命名空间准备滚动升级**
- **升级每个命名空间的Active和StandBy NN**
- **升级DN**
- **完成每个命名空间的滚动升级**

### 2.2 停机升级

对于非 HA 群集，无法在没有停机的情况下升级 HDFS，因为它需要重新启动 NN。但是，DN 仍可以滚动方式升级。

#### 2.2.1 升级非HA集群

在非 HA 群集中，有一个 NameNode（NN），SecondaryNameNode（SNN）和许多 DataNodes（DN）。升级非 HA 群集的过程与升级 HA 群集的过程类似，不同之处在于，将升级非 HA 集群中的第 2 步 “升级活动和备用 NN 升级” 更改为以下内容：

- **升级NN和SNN**
- 关闭 SNN
- 关闭并升级 NN
- 使用`-rollingUpgrade started`选项启动 NN
- 升级并重新启动 SNN

## 3. 降级和回滚

如果不希望使用升级版本，或者在某些不太可能的情况下，升级失败（由于较新版本中的错误），管理员可以选择将 HDFS 降级到升级前版本，或将 HDFS 回滚到升级前版本和升级前的状态。

请注意，降级可以滚动方式进行，但不能回滚。回滚要求集群停机。

还请注意，`只有在开始滚动升级之后且终止升级之前，才可以进行降级和回滚`。可以通过完成，降级或回滚来终止升级。因此，可能无法在完成或降级之后执行回滚，或者在完成后无法执行降级。

### 3.1 降级

降级会将软件还原回升级前的版本，并保留用户数据。假设时间 T 是滚动升级开始时间，并且升级通过降级终止。然后，在 T 之前或之后创建的文件在 HDFS 中仍然可用。在 T 之前或之后删除的文件在 HDFS 中仍然被删除。

仅当两个版本之间的 namenode 布局版本和 datanode 布局版本均未更改时，才可以将较新的版本降级为升级前的版本。

在高可用性集群中，当正在进行从旧软件版本到新软件版本的滚动升级时，可以滚动方式将升级后的计算机降级到旧软件版本。与之前相同，假设 NN1 和 NN2 分别处于活动状态和待机状态。以下是在不停机的情况下进行降级的步骤：

- 降级 DN
- 选择一小部分数据节点（例如，特定机架下的所有数据节点）。
- 运行hdfs dfsadmin -shutdownDatanode `` upgrade以关闭所选的数据节点之一。
- 运行hdfs dfsadmin -getDatanodeInfo ``进行检查，然后等待数据节点关闭。
- 降级并重新启动 datanode。
- 对子集中的所有选定数据节点并行执行以上步骤。
- 重复上述步骤，直到集群中所有升级的数据节点降级。
- 降级活动和备用 NN
- 关闭和降级 NN2
- 正常启动 NN2 作为待机
- 从 NN1 到 NN2 的故障转移，以便 NN2 变为活动状态，而 NN1 变为待机状态。
- 关闭并降级 NN1。
- 正常启动 NN1 作为待机。
- 完成滚动降级
- 运行hdfs dfsadmin -rollingUpgrade finalize以完成滚动降级。

请注意，在降级名称节点之前，必须先降级数据节点，因为协议可以以向后兼容的方式更改，但不能向前兼容，即，旧的数据节点可以与新的名称节点对话，反之则不行。

### 3.2 回滚

回滚将软件还原到升级前的版本，但也将用户数据还原到升级前的状态。假设时间T是滚动升级开始时间，并且升级通过回滚终止。T 之前创建的文件在 HDFS 中仍然可用，但 T 之后创建的文件不可用。T 之前删除的文件在 HDFS 中仍然被删除，但是 T 之后删除的文件被恢复。

始终支持从较新版本回滚到升级前版本。但是，这不能以滚动方式完成。它需要集群停机。假设 NN1 和 NN2 分别处于活动状态和待机状态。以下是回滚的步骤：

- 回滚 HDFS
- 关闭所有 NN 和 DN
- 在所有计算机上还原升级前的版本。
- 开始 NN1 为活动的-rollingUpgrade回滚选项。
- 在 NN2 上运行-bootstrapStandby并以待机状态正常启动。
- 使用-rollback选项启动 DN。

## 4. 滚动升级相关命令

### 4.1 dfsadmin –rollingUpgrade

`hdfs dfsadmin -rollingUpgrade `

### 4.2 dfsadmin –getDatanodeInfo

`hdfs dfsadmin -getDatanodeInfo `

获取有关给定 datanode 的信息。该命令可以像 Unix ping 命令一样用于检查数据节点是否处于活动状态。

### 4.3 dfsadmin –shutdownDatanode

`hdfs dfsadmin -shutdownDatanode  [upgrade]`

提交给定 datanode 的关闭请求。如果指定了可选的升级参数，则建议访问数据节点的客户端等待其重启，然后启用快速启动模式。如果重启不及时，客户端将超时并忽略数据节点。在这种情况下，快速启动模式也将被禁用。

请注意，该命令不会等待数据节点关闭完成。`dfsadmin -getDatanodeInfo`命令可用于检查数据节点关闭是否完成。

### 4.4 namenode –rollingUpgrade

`hdfs namenode -rollingUpgrade `
