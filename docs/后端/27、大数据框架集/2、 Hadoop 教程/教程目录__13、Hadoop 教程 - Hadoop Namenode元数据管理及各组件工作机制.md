# 13、Hadoop 教程 - Hadoop Namenode元数据管理及各组件工作机制
- 来源：https://ddkk.com/zhuanlan/bigdata/hadoop/2/13.html
- 分类：大数据框架
- 分组：教程目录
## 1. Namenode元数据管理

### 1.1 元数据是什么

`元数据（Metadata）`，又称中介数据，为`描述数据的数据`（data about data），主要是描述数据属性（property）的信息，用来支持如指示存储位置、历史数据、资源查找、文件记录等功能。

在HDFS 中，元数据主要指的是`文件相关的元数据`，由 NameNode 管理维护。从广义的角度来说，因为 NameNode 还需要管理众多 DataNode 节点，因此 DataNode 的位置和健康状态信息也属于元数据。

### 1.2 元数据管理概述

在HDFS 中，文件相关元数据具有两种类型：

- **文件自身属性信息**
- 文件名称、权限，修改时间，文件大小，复制因子，数据块大小。
- **文件块位置映射信息**
- 记录文件块和 DataNode 之间的映射信息，即哪个块位于哪个节点上。
- 按存储形式分为内存元数据和元数据文件两种，分别存在内存和磁盘上。

#### 1.2.1 内存元数据

为了保证用户操作元数据交互高效，延迟低，NameNode 把所有的元数据都存储在内存中，我们叫做内存元数据。`内存中的元数据是最完整的`，包括文件自身属性信息、文件块位置映射信息。

但是内存的致命问题是，断点数据丢失，数据不会持久化。因此 NameNode 又辅佐了元数据文件来保证元数据的安全完整。

#### 1.2.2 磁盘元数据

##### 1.2.2.1 fsimage内存镜像文件

fsimage 是内存元数据的一个持久化的检查点。但是`fsimage中仅包含Hadoop文件系统中文件自身属性相关的元数据信息，但不包含文件块位置的信息`。文件块位置信息只存储在内存中，是由 datanode 启动加入集群的时候，向 namenode 进行数据块的汇报得到的，并且后续间断指定时间进行数据块报告。

持久化的动作是一种数据从内存到磁盘的 IO 过程。会对 namenode 正常服务造成一定的影响，不能频繁的进行持久化。

##### 1.2.2.2 Edits log编辑日志

为了避免两次持久化之间数据丢失的问题，又设计了 Edits log 编辑日志文件。`文件中记录的是HDFS所有更改操作（文件创建，删除或修改）的日志`，文件系统客户端执行的更改操作首先会被记录到 edits 文件中。

#### 1.2.3 加载元数据顺序

fsimage 和 edits 文件都是经过序列化的，在`NameNode启动的时候，它会将fsimage文件中的内容加载到内存中，之后再执行edits文件中的各项操作，使得内存中的元数据和实际的同步`，存在内存中的元数据支持客户端的读操作，也是最完整的元数据。

当客户端对 HDFS 中的文件进行新增或者修改操作，操作记录首先被记入 edits 日志文件中，当客户端操作成功后，相应的元数据会更新到内存元数据中。因为 fsimage 文件一般都很大（GB 级别的很常见），如果所有的更新操作都往 fsimage 文件中添加，这样会导致系统运行的十分缓慢。

HDFS 这种设计实现着手于：一是内存中数据更新、查询快，极大缩短了操作响应时间；二是内存中元数据丢失风险颇高（断电等），因此辅佐元数据镜像文件（fsimage）+ 编辑日志文件（edits）的备份机制进行确保元数据的安全。

NameNode 维护整个文件系统元数据。因此，元数据的准确管理，影响着 HDFS 提供文件存储服务的能力。

### 1.3 元数据管理相关目录文件

#### 1.3.1 元数据存储目录

在Hadoop 的 HDFS 首次部署好配置文件之后，并不能马上启动使用，而是先要对文件系统进行格式化操作：`hdfs namenode -format`

在这里要注意两个概念，一个是 format 之前，HDFS 在物理上还不存在；二就是此处的 format 并不是指传统意义上的本地磁盘格式化，而是一些清除与准备工作。其中就`会创建元数据本地存储目录和一些初始化的元数据相关文件`。

namenode 元数据存储目录由参数：`dfs.namenode.name.dir`指定，格式化完成之后，将会在`$dfs.namenode.name.dir/current`目录下创建如下的文件：

其中的`dfs.namenode.name.dir`是在`hdfs-site.xml`文件中配置的，默认值如下：

`dfs.namenode.name.dir`属性可以配置多个目录，各个目录存储的文件结构和内容都完全一样，`相当于备份`，这样做的好处是当其中一个目录损坏了，也不会影响到 hadoop 的元数据，特别是当其中一个目录是 NFS（网络文件系统Network File System，NFS）之上，即使你这台机器损坏了，元数据也得到保存。

#### 1.3.2 元数据相关文件

##### 1.3.2.1 VERSION

- **namespaceID/clusterID/blockpoolID**
- 这些都是 HDFS 集群的唯一标识符。标识符被用来防止 DataNodes 意外注册到另一个集群中的 namenode 上。这些标识在联邦（federation）部署中特别重要。联邦模式下，会有多个 NameNode 独立工作。每个的 NameNode 提供唯一的命名空间（namespaceID），并管理一组唯一的文件块池（blockpoolID）。clusterID 将整个集群结合在一起作为单个逻辑单元，在集群中的所有节点上都是一样的。
- **storageType**
- 说明这个文件存储的是什么进程的数据结构信息
- 如果是 DataNode，storageType=DATA_NODE。
- **cTime**
- NameNode 存储系统创建时间，首次格式化文件系统这个属性是 0，当文件系统升级之后，该值会更新到升级之后的时间戳；
- **layoutVersion**
- HDFS 元数据格式的版本。添加需要更改元数据格式的新功能时，请更改此数字。当前的 HDFS 软件使用比当前版本更新的布局版本时，需要进行 HDFS 升级。

##### 1.3.2.2 seen_txid

包含最后一个 checkpoint 的最后一个事务 ID。这不是 NameNode 接受的最后一个事务 ID。该文件不会在每个事务上更新，而只会在 checkpoint 或编辑日志记录上更新。该文件的目的是尝试识别 edits 启动期间是否丢失的文件。如果 edits 目录被意外删除，然后自上一个 checkpoint 以来的所有事务都将消失，NameNode 仅从最近的一次 fsimage 加载启动。为了防止这种情况，NameNode 启动还检查 seen_txid 以确认它至少可以加载该数目的事务。如果无法验证装入事务，它将中止启动。

##### 1.3.2.3 fsimage相关

元数据镜像文件。每个 fsimage 文件还有一个对应的 .md5 文件，可以用来做 MD5 校验，HDFS使用该文件来防止磁盘损坏文件异常。

##### 1.3.2.4 Edits log相关

已完成且不可修改的编辑日志。这些文件中的每个文件都包含文件名定义的范围内的所有编辑日志事务。在 HA 高可用性部署中，主备 namenode 之间可以通过 edits log 进行数据同步。

#### 1.3.3 Fsimage、editslog查看

##### 1.3.3.1 Fsimage

`fsimage`文件是 Hadoop 文件系统元数据的一个永久性的检查点，包含`Hadoop文件系统中的所有目录和文件idnode的序列化信息`；对于文件来说，包含的信息有修改时间、访问时间、块大小和组成一个文件块信息等；而对于目录来说，包含的信息主要有修改时间、访问控制权限等信息。

`oiv是offline image viewer的缩写`，用于将 fsimage 文件的内容转储到指定文件中以便于阅读，该工具还提供了只读的 WebHDFS API 以允许离线分析和检查 hadoop 集群的命名空间。

oiv 在处理非常大的 fsimage 文件时是相当快的，如果该工具不能够处理 fsimage，它会直接退出。该工具不具备向后兼容性，比如使用 hadoop-2.4 版本的 oiv 不能处理 hadoop-2.3 版本的 fsimage，只能使用 hadoop-2.3 版本的 oiv。就像它的名称所提示的（offline），oiv 不需要 hadoop 集群处于运行状态。

命令：`hdfs oiv -i fsimage_0000000000000000050 -p XML -o fsimage.xml`

##### 1.3.3.2 editslog

`edits log`文件存放的是Hadoop文件系统的所有更新操作记录日志，`文件系统客户端执行的所有写操作首先会被记录到edits文件中`。

NameNode 起来之后，HDFS 中的更新操作会重新写到 edits 文件中，因为 fsimage 文件一般都很大（GB 级别的很常见），如果所有的更新操作都往 fsimage 文件中添加，这样会导致系统运行的十分缓慢，但是如果往 edits 文件里面写就不会这样，每次执行写操作之后，且在向客户端发送成功代码之前，edits 文件都需要同步更新。如果一个文件比较大，使得写操作需要向多台机器进行操作，只有当所有的写操作都执行完成之后，写操作才会返回成功，这样的好处是任何的操作都不会因为机器的故障而导致元数据的不同步。

`oev是offline edits viewer`（离线 edits 查看器）的缩写，该工具不需要 hadoop 集群处于运行状态。

命令：`hdfs oev -i edits_0000000000000000011-0000000000000000025 -o edits.xml`

在输出文件中，每个RECORD记录了一次操作，示例如下：

### 1.4 SecondaryNamenode

#### 1.4.1 SNN职责概述

NameNode 职责是管理元数据信息，DataNode 的职责是负责数据具体存储，那么 SecondaryNameNode 的作用是什么？对很多初学者来说是非常迷惑的。它为什么会出现在 HDFS 中。从它的名字上看，它给人的感觉就像是 NameNode 的备份。但它实际上却不是。

当HDFS 集群运行一段事件后，就会出现下面一些问题：

- edits logs 会变的很大，fsimage 将会变得很旧；
- namenode 重启会花费很长时间，因为有很多改动要合并到 fsimage 文件上；
- 如果频繁进行 fsimage 持久化，又会影响 NameNode 正常服务，毕竟 IO 操作是一种内存到磁盘的耗精力操作

因此为了克服这个问题，需要一个易于管理的机制来帮助我们`减小edit logs文件的大小和得到一个最新的fsimage文件`，这样也会减小在 NameNode 上的压力。

`SecondaryNameNode`就是来帮助解决上述问题的，它的职责是`合并NameNode的edit logs到fsimage文件中`。

#### 1.4.2 SNN checkpoint机制

##### 1.4.2.1 概述

`Checkpoint`核心是把 fsimage 与 edits log 合并以生成新的 fsimage 的过程。此过程有两个好处：fsimage 版本不断更新不会太旧、edits log 文件不会太大。

##### 1.4.2.2 流程

- 当触发 checkpoint 操作条件时，SNN 发生请求给 NN 滚动 edits log。然后 NN 会生成一个新的编辑日志文件：edits new，便于记录后续操作记录。
- 同时 SNN 会将 edits 文件和 fsimage 复制到本地（使用 HTTP GET 方式）。
- SNN 首先将fsimage载入到内存，然后一条一条地执行edits文件中的操作，使得内存中的 fsimage 不断更新，这个过程就是 edits 和 fsimage 文件合并。合并结束，SNN 将内存中的数据dump生成一个新的 fsimage 文件。
- SNN 将新生成的 Fsimage new 文件复制到 NN 节点。
- 至此刚好是一个轮回，等待下一次 checkpoint 触发 SecondaryNameNode 进行工作，一直这样循环操作。

##### 1.4.2.3 触发机制

Checkpoint 触发条件受两个参数控制，可以通过 core-site.xml 进行配置：

```java
dfs.namenode.checkpoint.period=3600		//两次连续的checkpoint之间的时间间隔。默认1小时
dfs.namenode.checkpoint.txns=1000000	//最大没有执行checkpoint事务的数量，满足将强制执行紧急checkpoint，即使尚未达到检查点周期。默认100万事务数量。
```

从上面的描述我们可以看出，`SecondaryNamenode根本就不是Namenode的一个热备，只是将fsimage和edits合并`。

### 1.5 Namenode元数据恢复

#### 1.5.1 Namenode存储多目录

namenode 元数据存储目录由参数：`dfs.namenode.name.dir`指定。

`dfs.namenode.name.dir属性可以配置多个目录`，各个目录存储的文件结构和内容都完全一样，`相当于备份`，这样做的好处是当其中一个目录损坏了，也不会影响到 hadoop 的元数据，特别是当其中一个目录是 NFS（网络文件系统Network File System，NFS）之上，即使你这台机器损坏了，元数据也得到保存。

#### 1.5.2 从SecondaryNameNode恢复

SecondaryNameNode 在 checkpoint 的时候会将 fsimage 和 edits log 下载到自己的本机上本地存储目录下。并且在 checkpoint 之后也不会进行删除。

如果 NameNode 中的 fsimage 真的出问题了，还是可以用 SecondaryNamenode 中的 fsimage 替换一下 NameNode 上的 fsimage，虽然已经不是最新的 fsimage，但是我们可以将损失减小到最少。

## 2. NN、2NN及DN工作机制

### 2.1 namenode和SecondaryNamenode工作机制

- **第一阶段：NameNode启动**
- 第一次启动 NameNode 格式化后，创建 Fsimage 和 Edits 文件。如果不是第一次启动，直接加载编辑日志和镜像文件到内存。
- 客户端对元数据进行增删改的请求。
- NameNode 记录操作日志，更新滚动日志。
- NameNode 在内存中对元数据进行增删改。
- **第二阶段：Secondary NameNode工作**
- Secondary NameNode 询问 NameNode 是否需要 CheckPoint。直接带回 NameNode 是否检查结果。
- Secondary NameNode 请求执行 CheckPoint。
- NameNode 滚动正在写的 Edits 日志。
- 将滚动前的编辑日志和镜像文件拷贝到 Secondary NameNode。
- Secondary NameNode 加载编辑日志和镜像文件到内存，并合并。
- 生成新的镜像文件 fsimage.chkpoint。
- 拷贝 fsimage.chkpoint 到 NameNode。
- NameNode 将 fsimage.chkpoint 重新命名成 fsimage。

### 2.2 DataNode工作机制

**1、** 一个数据块在DataNode上以文件形式存储在磁盘上，包括两个文件，一个是数据本身，一个是元数据包括数据块的长度，块数据的校验以及时间戳；

**2、** DataNode启动后向NameNode注册，通过后，周期性（6小时）的向NameNode上报所有的块信息；

DataNode 向 NameNode 汇报当前解读信息的时间间隔，默认 6 小时：

```java
<property>
	<name>dfs.blockreport.intervalMsec</name>
	<value>21600000</value>
	<description>Determines block reporting interval in milliseconds.</description>
</property>
```

DataNode 扫描自己节点块信息列表的时间，默认 6 小时：

```java
<property>
	<name>dfs.datanode.directoryscan.interval</name>
	<value>21600s</value>
</property>
```

**1、** 心跳是每3秒一次，心跳返回结果带有NameNode给该DataNode的命令如复制块数据到另一台机器，或删除某个数据块如果超过10分钟没有收到某个DataNode的心跳，则认为该节点不可用；

**2、** 集群运行中可以安全加入和退出一些机器；

### 2.3 DataNode数据完整性

思考：如果电脑磁盘里面存储的数据是控制高铁信号灯的红灯信号（1）和绿灯信号（0），但是存储该数据的磁盘坏了，一直显示是绿灯，是否很危险？同理 DataNode 节点上的数据损坏了，却没有发现，是否也很危险，那么如何解决呢？

如下是 DataNode 节点保证数据完整性的方法。

**1、** 当DataNode读取Block的时候，它会计算CheckSum；

**2、** 如果计算后的CheckSum，与Block创建时值不一样，说明Block已经损坏；

**3、** Client读取其他DataNode上的Block；

**4、** 常见的校验算法crc（32），md5（128），sha1（160）；

**5、** DataNode在其文件创建后周期验证CheckSum；

### 2.4 DataNode掉线时限参数设置

需要注意的是 hdfs-site.xml 配置文件中的`heartbeat.recheck.interval`的单位为毫秒，`dfs.heartbeat.interval`的单位为秒。

```java
<property>
    <name>dfs.namenode.heartbeat.recheck-interval</name>
    <value>300000</value>
</property>
<property>
    <name>dfs.heartbeat.interval</name>
    <value>3</value>
</property>
```
