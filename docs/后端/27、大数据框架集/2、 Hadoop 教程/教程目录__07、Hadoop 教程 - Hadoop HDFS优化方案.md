# 07、Hadoop 教程 - Hadoop HDFS优化方案
- 来源：https://ddkk.com/zhuanlan/bigdata/hadoop/2/7.html
- 分类：大数据框架
- 分组：教程目录
## 1. HDFS优化方案

### 1.1 短路本地读取：Short Circuit Local Reads

#### 1.1.1 背景

在HDFS 中，不管是 Local Reads（DFSClient 和 Datanode 在同一个节点）还是 Remote Reads（DFSClient 和 Datanode不在同一个节点），底层处理方式都是一样的，都是先由`Datanode读取数据，然后再通过RPC（基于TCP）把数据传给DFSClient`。这样处理是比较简单的，但是性能会受到一些影响，因为需要 Datanode 在中间做一次中转。

尤其 Local Reads 的时候，既然 DFSClient 和数据是在一个机器上面，那么很自然的想法，就是让 DFSClient 绕开 Datanode 自己去读取数据。

所谓的“短路”读取绕过了 DataNode，从而允许客户端直接读取文件。显然，这仅在客户端与数据位于同一机器的情况下才可行。短路读取为许多应用提供了显着的性能提升。

#### 1.1.2 短路本地读取

在HDFS-2246 这个 JIRA 中，工程师们的想法是既然读取数据 DFSClient 和数据在同一台机器上，那么 Datanode 就把数据在文件系统中的路径，从什么地方开始读（offset）和需要读取多少（length）等信息告诉 DFSClient，然后 DFSClient 去打开文件自己读取。想法很好，问题在于配置复杂以及安全问题。

首先是配置问题，因为是`让DFSClient自己打开文件读取数据`，那么就需要配置一个白名单，定义哪些用户拥有访问 Datanode 的数据目录权限。如果有新用户加入，那么就得修改白名单。需要注意的是，这里是允许客户端访问 Datanode 的数据目录，也就意味着，任何用户拥有了这个权限，就可以访问目录下其他数据，从而导致了安全漏洞。因此，**这个实现已经不建议使用了**。

#### 1.1.3 短路本地读取安全性改进

在HDFS-347 中，提出了一种新的解决方案，让短路本地读取数据更加安全。

在Linux 中，有个技术叫做`Unix Domain Socket`。Unix Domain Socket 是一种进程间的通讯方式，它使得`同一个机器上的两个进程能以Socket的方式通讯`。它带来的另一大好处是，利用它两个进程除了可以传递普通数据外，还`可以在进程间传递文件描述符`。

假设机器上的两个用户 A 和 B，A 拥有访问某个文件的权限而 B 没有，而 B 又需要访问这个文件。借助 Unix Domain Socket，可以让 A 打开文件得到一个文件描述符，然后把文件描述符传递给 B，B 就能读取文件里面的内容了即使它没有相应的权限。在 HDFS 的场景里面，A 就是 Datanode，B 就是 DFSClient，需要读取的文件就是 Datanode 数据目录中的某个文件。

这个方案在安全上就比上一个方案上好一些，至少它只允许 DFSClient 读取它需要的文件。

#### 1.1.4 短路本地读取配置

##### 1.1.4.1 libhadoop.so

因为 Java 不能直接操作 Unix Domain Socket，所以需要安装 Hadoop 的 native 包 libhadoop.so。在编译 Hadoop 源码的时候可以通过编译 native 模块获取。可以用如下命令来检查 native 包是否安装好。

`hadoop checknative`

##### 1.1.4.2 hdfs-site.xml

```java
<property>
	<name>dfs.client.read.shortcircuit</name>
	<value>true</value>
</property>
<property>
	<name>dfs.domain.socket.path</name>
	<value>/var/lib/hadoop-hdfs/dn_socket</value>
</property>
```

- dfs.client.read.shortcircuit是打开短路本地读取功能的开关。
- dfs.domain.socket.path是 DataNode 和DFSClient 之间沟通的 Socket 的本地路径。

**注：**`/var/lib/hadoop-hdfs/dn_socket`需要提前创建，但是只需要创建到`/var/lib/hadoop-hdfs`，后面的`/dn_socket`由 hadoop 自己创建，如果提前创建到这一步，DataNode 会启动失败。

### 1.2 makeHDFS Block负载平衡器：Balancer

#### 1.2.1 背景

HDFS 数据可能并不总是在 DataNode 之间均匀分布。一个常见的原因是向现有群集中添加了新的 DataNode。HDFS 提供了一个 Balancer 程序，分析 block 放置信息并且在整个 DataNode 节点之间平衡数据，直到被视为平衡为止。

所谓的`平衡指的是每个DataNode的利用率（节点上已用空间与节点总容量之比）与集群的利用率（集群上已用空间与集群总容量的比）相差不超过给定阈值百分比。` 平衡器无法在单个 DataNode 上的各个卷之间进行平衡。

#### 1.2.2 命令行配置和运行

```java
-threshold  10				//集群平衡的条件，datanode间磁盘使用率相差阈值，区间选择：0~100
-policy datanode			//平衡策略，默认为datanode， 如果datanode平衡，则集群已平衡。
-exclude  -f  /tmp/ip1.txt	//默认为空，指定该部分ip不参与balance， -f：指定输入为文件
-include  -f  /tmp/ip2.txt	//默认为空，只允许该部分ip参与balance，-f：指定输入为文件
-idleiterations  5			//迭代 5
```

##### 1.2.2.1 设置平衡数据传输宽带

命令：`hdfs dfsadmin -setBalancerBandwidth newbandwidth`

其中`newbandwidth`是每个 DataNode 在平衡操作期间可以使用的最大网络带宽量，以每秒字节数为单位。

比如：`hdfs dfsadmin -setBalancerBandwidth 104857600`

##### 1.2.2.2 默认运行balancer

命令：`hdfs balancer`

此时将会以默认参数进行数据块的平衡操作。

##### 1.2.2.3 修改阈值运行balancer

命令：`hdfs balancer -threshold 5`

Balancer 将以阈值 5％ 运行（默认值 10%），这意味着程序将确保每个 DataNode 上的磁盘使用量与群集中的总体使用量相差不超过 5％。例如，如果集群中所有 DataNode 的总体使用率是集群磁盘总存储容量的 40％，则程序将确保每个 DataNode 的磁盘使用率在该 DataNode 磁盘存储容量的 35％ 至 45％ 之间。

### 1.3 磁盘均衡器：HDFS Disk Balancer

#### 1.3.1 背景

相比较于个人 PC，服务器一般可以通过挂载多块磁盘来扩大单机的存储能力。

在Hadoop HDFS 中，DataNode 负责最终数据 block 的存储，在所在机器上的磁盘之间分配数据块。当写入新 block 时，DataNodes 将根据选择策略（循环策略或可用空间策略）来选择 block 的磁盘（卷）。

`循环策略`：它将新 block 均匀分布在可用磁盘上。默认此策略。

`可用空间策略`：此策略将数据写入具有更多可用空间（按百分比）的磁盘。

但是，在长期运行的群集中采用循环策略时，DataNode 有时会不均匀地填充其存储目录（磁盘/卷），从而导致某些磁盘已满而其他磁盘却很少使用的情况。发生这种情况的原因可能是由于大量的写入和删除操作，也可能是由于更换了磁盘。

另外，如果我们使用基于可用空间的选择策略，则每个新写入将进入新添加的空磁盘，从而使该期间的其他磁盘处于空闲状态。这将在新磁盘上创建瓶颈。

因此，需要一种`Intra DataNode Balancing（DataNode内数据块的均匀分布）`来解决 Intra-DataNode 偏斜（磁盘上块的不均匀分布），这种偏斜是由于磁盘更换或随机写入和删除而发生的。

因此，Hadoop 3.0 中引入了一个名为 Disk Balancer 的工具，该工具专注于在 DataNode 内分发数据。

#### 1.3.2 HDFS Disk Balancer简介

`HDFS disk balancer`是 Hadoop 3 中引入的命令行工具，用于平衡 DataNode 中的数据在磁盘之间分布不均匀问题。 这里要特别注意，HDFS disk balancer 与 HDFS Balancer 是不同的：

HDFS disk balancer 针对给定的 DataNode 进行操作，并将块从一个磁盘移动到另一个磁盘，是 DataNode 内部数据在不同磁盘间平衡；

HDFS Balancer 平衡了 DataNode 节点之间的分布。

#### 1.3.3 HDFS Disk Balancer功能

HDFS Disk balancer支持两个主要功能，即`报告`和`平衡`。

##### 1.3.3.1 数据传播报告

为了定义一种方法来衡量集群中哪些计算机遭受数据分布不均的影响，HDFS 磁盘平衡器定义了 HDFS Volume Data Density metric（卷/磁盘数据密度度量标准）和 Node Data Density metric（节点数据密度度量标准）。

HDFS 卷数据密度度量标准能够比较数据在给定节点的不同卷上的分布情况。

节点数据密度度量允许在节点之间进行比较。

- **Volume data density metric计算过程**

假设有一台具有四个卷/磁盘的计算机：Disk1，Disk2，Disk3，Disk4，各个磁盘使用情况：

Disk1
Disk2
Disk3
Disk4

capacity
200 GB
300 GB
350 GB
500 GB

dfsUsed
100 GB
76 GB
300 GB
475 GB

dfsUsedRatio
0.5
0.25
0.85
0.95

volumeDataDensity
0.20
0.45
-0.15
-0.24

`Total capacity= 200 + 300 + 350 + 500 = 1350 GB`

`Total Used= 100 + 76 + 300 + 475 = 951 GB`

因此，每个卷/磁盘上的理想存储为：

`Ideal storage = total Used ÷ total capacity= 951÷1350 = 0.70`

也就是每个磁盘应该保持在 70% 理想存储容量。

`VolumeDataDensity = idealStorage – dfs Used Ratio`

比如 Disk1 的卷数据密度= 0.70-0.50 = 0.20。其他 Disk 以此类推。

`volumeDataDensity的正值表示磁盘未充分利用，而负值表示磁盘相对于当前理想存储目标的利用率过高。`

- **Node Data Density计算过程**

Node Data Density（节点数据密度）= 该节点上所有卷/磁盘volume data density 绝对值的总和。

上述例子中的节点数据密度=|0.20|+|0.45|+|-0.15|+|-0.24| = 1.04

较低的 node Data Density 值表示该机器节点具有较好的扩展性，而较高的值表示节点具有更倾斜的数据分布。

一旦有了 volumeDataDensity 和 nodeDataDensity，就可以找到集群中数据分布倾斜的节点，或者可以获取给定节点的 volumeDataDensity。

##### 1.3.3.2 磁盘平衡

当指定某个 DataNode 节点进行 disk 数据平衡，就可以先计算或读取当前的 volumeDataDensity（磁盘数据密度）。有了这些信息，我们可以轻松地确定哪些卷已超量配置，哪些卷已不足。为了将数据从一个卷移动到 DataNode 中的另一个卷，Hadoop 开发实现了基于 RPC 协议的 Disk Balancer。

#### 1.3.4 HDFS Disk Balancer开启

HDFS Disk Balancer 通过创建计划进行操作，该计划是一组语句，描述应在两个磁盘之间移动多少数据，然后在 DataNode 上执行该组语句。计划包含多个移动步骤。计划中的每个移动步骤都具有目标磁盘，源磁盘的地址。移动步骤还具有要移动的字节数。该计划是针对可操作的 DataNode 执行的。

默认情况下，Hadoop 集群上已经启用了 Disk Balancer 功能。通过在`hdfs-site.xml`中调整`dfs.disk.balancer.enabled`参数值，选择在 Hadoop 中是否启用磁盘平衡器。

#### 1.3.5 HDFS Disk Balancer相关命令

##### 1.3.5.1 Plan计划

命令：`hdfs diskbalancer -plan `

```java
-out				//控制计划文件的输出位置
-bandwidth			//设置用于运行Disk Balancer的最大带宽。默认带宽10 MB/s。
–thresholdPercentage	//定义磁盘开始参与数据重新分配或平衡操作的值。默认的thresholdPercentage值为10％，这意味着仅当磁盘包含的数据比理想存储值多10％或更少时，磁盘才用于平衡操作。
-maxerror			//它允许用户在中止移动步骤之前为两个磁盘之间的移动操作指定要忽略的错误数。
-v					//详细模式，指定此选项将强制plan命令在stdout上显示计划的摘要。
-fs					//此选项指定要使用的NameNode。如果未指定，则Disk Balancer将使用配置中的默认NameNode。
```

##### 1.3.5.2 Execute执行

命令：`hdfs diskbalancer -execute `

execute 命令针对为其生成计划的 DataNode 执行计划。

##### 1.3.5.3 Query查询

命令：`hdfs diskbalancer -query `

query 命令从运行计划的 DataNode 获取 HDFS 磁盘平衡器的当前状态。

##### 1.3.5.4 Cancel取消

命令：`hdfs diskbalancer -cancel `

`hdfs diskbalancer -cancel planID node `

cancel 命令取消运行计划。

##### 1.3.5.5 Report执行

命令：`hdfs diskbalancer -fs https://namenode.uri -report `

### 1.4 纠删码技术：Erasure Coding

#### 1.4.1 背景：3副本策略弊端

为了提供容错能力，HDFS 会根据 replication factor（复制因子）在不同的 DataNode 上复制文件块。默认复制因子为 3（注意这里的 3 指的是 1+2=3，不是额外 3 个），则原始块除外，还将有额外两个副本。每个副本使用 100％ 的存储开销，因此导致 200％ 的存储开销。这些副本也消耗其他资源，例如网络带宽。

在`复制因子为N时，存在N-1个容错能力，但存储效率仅为1/N。`

这种复制增加了存储开销，并且似乎很昂贵。因此，HDFS 使用 Erasure Coding（纠删码）代替复制，以提供相同级别的容错能力，并且存储开销不超过 50％。

Erasure Coding 文件的复制因子始终为 1，用户无法对其进行更改。

#### 1.4.2 Erasure Coding（EC）简介

**纠删码技术（Erasure coding）** 简称 EC，是一种编码容错技术。最早用于通信行业，数据传输中的数据恢复。它通过对数据进行分块，然后计算出校验数据，使得各个部分的数据产生关联性。当一部分数据块丢失时，可以通过剩余的数据块和校验块计算出丢失的数据块。

Hadoop 3.0 之后引入了纠删码技术（Erasure Coding），它可以提高 50% 以上的存储利用率，并且保证数据的可靠性。

存储系统 RAID 使用纠删码。RAID通过**striping（条带化）** 实现纠删码，也就是说，将逻辑上连续的数据（例如文件）划分为较小的单位（bit，byte，or block），并将连续的单位存储在不同的磁盘上。

对于原始数据集的每个条带，都会**根据纠删码算法来计算并存储一定数量的奇偶校验单元**，该过程称为`编码`。

任何条带化单元中的**错误都可以根据剩余数据和奇偶校验单元从计算中恢复**，此过程称为`解码`。

#### 1.4.3 Reed-Solomon（RS）码

##### 1.4.3.1 RS码介绍

**Reed-Solomon（RS）码**是存储系统较为常用的一种纠删码，它有两个参数 k 和 m，记为 RS(k，m)。如下图所示，k 个数据块组成一个向量被乘上一个生成矩阵（Generator Matrix）GT 从而得到一个码字（codeword）向量，该向量由 k 个数据块和 m 个校验块构成。如果一个数据块丢失，可以用 (GT)-1 乘以码字向量来恢复出丢失的数据块。RS(k，m)最多可容忍 m 个块（包括数据块和校验块）丢失。

##### 1.4.3.2 RS码通俗解释

比如有 7、8、9 三个原始数据，通过矩阵乘法，计算出来两个校验数据 50、122。这时原始数据加上校验数据，一共五个数据：7、8、9、50、122，可以任意丢两个，然后通过算法进行恢复。

#### 1.4.4 Hadoop EC架构

为了支持纠删码，HDFS 体系结构进行了一些更改调整。

- **Namenode扩展**
- 条带化的 HDFS 文件在**逻辑**上由`block group（块组）`组成，每个块组包含一定数量的内部块。这允许在块组级别而不是块级别进行文件管理。
- **客户端扩展**
- 客户端的读写路径得到了增强，可以**并行处理**块组中的多个内部块。
- **Datanode扩展**
- DataNode 运行一个附加的 ErasureCodingWorker（ECWorker）任务，以对失败的纠删编码块进行后台恢复。 NameNode 检测到失败的 EC 块，然后 NameNode 选择一个 DataNode 进行恢复工作。
- **纠删编码策略**
- 为了适应异构的工作负载，允许 HDFS 集群中的文件和目录具有不同的复制和纠删码策略。纠删码策略封装了如何对文件进行编码/解码。默认情况下启用`RS-6-3-1024k`策略， RS 表示编码器算法 Reed-Solomon，6 、3 中表示数据块和奇偶校验块的数量，1024k 表示条带化单元的大小。
- `目录上还支持默认的REPLICATION方案。`它只能在目录上设置，以强制目录采用 3 倍复制方案，而不继承其祖先的纠删码策略。此策略可以使 3x 复制方案目录与纠删码目录交错。REPLICATION 始终处于启用状态。
- 此外也支持用户通过 XML 文件定义自己的 EC 策略，Hadoop conf 目录中有一个名为`user_ec_policies.xml.template`的示例 EC 策略 XML 文件，用户可以参考该文件。
- **Intel ISA-L**
- 英特尔 ISA-L 代表英特尔智能存储加速库。 ISA-L 是针对存储应用程序而优化的低级功能的开源集合。它包括针对 Intel AVX 和 AVX2 指令集优化的快速块 Reed-Solomon 类型擦除代码。 `HDFS纠删码可以利用ISA-L加速编码和解码计算。`

#### 1.4.5 Erasure Coding部署方式

##### 1.4.5.1 集群和硬件配置

编码和解码工作会消耗 HDFS 客户端和 DataNode 上的额外`CPU`。

纠删码文件也分布在整个机架上，以实现机架容错。这意味着在读写条带化文件时，大多数操作都是在机架上进行的。因此，`网络带宽`也非常重要。

对于机架容错，拥有`足够数量的机架`也很重要，每个机架所容纳的块数不超过 EC 奇偶校验块的数。

`机架数量=（数据块+奇偶校验块）/奇偶校验块后取整`。比如对于 EC 策略 RS（6,3），这意味着最少 3 个机架（由（6 + 3）/ 3 = 3 计算），理想情况下为 9 个或更多，以处理计划内和计划外的停机。对于机架数少于奇偶校验单元数的群集，HDFS 无法维持机架容错能力，但仍将尝试在多个节点之间分布条带化文件以保留节点级容错能力。因此，建议设置具有类似数量的 DataNode 的机架。

##### 1.4.5.2 纠删码策略设置

纠删码策略由参数`dfs.namenode.ec.system.default.policy`指定，默认是 RS-6-3-1024k，其他策略默认是禁用的。可以通过`hdfs ec [-enablePolicy -policy ]`命令启用策略集。

##### 1.4.5.3 启用英特尔ISA-L

默认 RS 编解码器的 HDFS 本机实现利用 Intel ISA-L 库来改善编码和解码计算。要启用和使用 Intel ISA-L，需要执行三个步骤。

建立 ISA-L 库；

使用 ISA-L 支持构建 Hadoop；

使用 -Dbundle.isal 将 isal.lib 目录的内容复制到最终的 tar 文件中。使用 tar 文件部署 Hadoop。确保 ISA-L 在 HDFS 客户端和 DataNode 上可用。

#### 1.4.6 EC命令

HDFS 提供了一个 ec 子命令来执行与纠删码有关的管理命令。

- -setPolicy -path `` [-policy ``] [-replicate]
- 在指定路径的目录上设置擦除编码策略。
- `path`：HDFS 中的目录。这是必填参数。设置策略仅影响新创建的文件，而不影响现有文件。
- `policy`：用于此目录下文件的擦除编码策略。默认 RS-6-3-1024k 策略。
- `-replicate`在目录上应用默认的 REPLICATION 方案，强制目录采用 3x 复制方案。
- `-replicate`和`-policy `是可选参数。不能同时指定它们。
- -getPolicy -path ``
- 获取指定路径下文件或目录的擦除编码策略的详细信息。
- -unsetPolicy -path ``
- 取消设置先前对目录上的 setPolicy 的调用所设置的擦除编码策略。如果该目录从祖先目录继承了擦除编码策略，则 unsetPolicy 是 no-op。在没有显式策略集的目录上取消策略将不会返回错误。
- -listPolicies
- 列出在 HDFS 中注册的所有（启用，禁用和删除）擦除编码策略。只有启用的策略才适合与 setPolicy 命令一起使用。
- -addPolicies -policyFile ``
- 添加用户定义的擦除编码策略列表。
- -listCodecs
- 获取系统中支持的擦除编码编解码器和编码器的列表。
- -removePolicy -policy ``
- 删除用户定义的擦除编码策略。
- -enablePolicy -policy ``
- 启用擦除编码策略。
- -disablePolicy -policy ``
- 禁用擦除编码策略。
