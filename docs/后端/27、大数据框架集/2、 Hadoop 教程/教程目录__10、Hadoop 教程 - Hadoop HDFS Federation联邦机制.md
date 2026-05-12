# 10、Hadoop 教程 - Hadoop HDFS Federation联邦机制
- 来源：https://ddkk.com/zhuanlan/bigdata/hadoop/2/10.html
- 分类：大数据框架
- 分组：教程目录
## 1. 当前HDFS体系架构

### 1.1 简介

当前的 HDFS 架构有两个主要的层：

- **命名空间（namespace）**
- HDFS 体系结构中的命名空间层由文件，块和目录组成。该层支持与名称空间相关的文件系统操作，例如创建，删除，修改和列出文件和目录。
- **块存储层（Block Storage）**

块存储层包括两个部分：
- `块管理`： NameNode 执行块管理。块管理通过处理注册和定期心跳来提供 DataNode 群集成员身份。它处理块报告并支持与块相关的操作，如创建，删除，修改或获取块位置。它还维护块的位置，副本位置。为未复制的块管理块复制，并在已复制的块中删除。
- `存储`： DataNode 通过在本地文件系统上存储块并提供读/写访问权限来管理存储空间。

### 1.2 局限性

当下的 HDFS 体系结构仅允许单个 NameNode 维护文件系统名称空间。注意 HA 体系中虽然说允许多个 NameNode，但是他们所维护的是同一套文件系统名称空间。这种体系目前存在着一些弊端和局限性：

- DataNode 磁盘存储空间不够增加节点，NameNode 内存不够是否可以无限扩容。一种是 DataNode 横向扩展机器增加节点，一种是纵向扩展单机加内存。
- 由于名称空间和存储层的紧密耦合，NameNode 的替代实现很困难。这限制了其他服务直接使用块存储。唯一的 NameNode 成了唯一入口。
- 文件系统的操作还限于 NameNode 一次处理的任务数。因此，群集的性能取决于 NameNode 吞吐量。
- 同样，由于使用单个名称空间，因此使用群集的占用者组织之间没有隔离。

## 2. HDFS Federation架构

### 2.1 简介

`Federation`中文意思为联邦、联盟，是 NameNode 之间的 Federation，也就是集群中会有多个 NameNode。多个 NameNode 的情况意味着有多个 namespace。注意，这区别于 HA 模式下的多 NameNode，HA 中它们是拥有着同一个 namespace。

Federation 体系中多个 namenode 之间相互独立且不需要互相协调，各自分工，管理自己的区域。每个 DataNode 要向集群中所有的 namenode 注册，且周期性地向所有 namenode 发送心跳和块报告，并执行来自所有 namenode 的命令。

上图中，有多个 NameNode，分别表示为 NN1，NN2，… NNn。NS1，NS2 等是由它们各自的 NameNode 管理的多个名称空间。

每个名称空间都有其自己的块池（block pool）（NS1 具有 Pool1，NS2 具有 Pool2，依此类推）。每个 DataNode 存储集群中所有块池的块。

HDFS Federation 体系结构中的`块池是属于单个名称空间的块的集合`。每个块池彼此独立地进行管理。在删除 NameNode 或名称空间时，DataNode 中存在的相应块池也将被删除。在升级群集时，每个名称空间卷都作为一个单元进行升级。

### 2.2 好处

- 命名空间可伸缩性
- 使用 Federation，可以水平扩展名称空间。这对大型群集或包含太多小文件的群集有利，因为向群集添加了更多的 NameNode。
- 性能
- 由于文件系统操作不受单个 NameNode 吞吐量的限制，因此可以提高文件系统的性能。
- 隔离
- 由于有多个名称空间，它可以为使用群集的占用者组织提供隔离。

## 3. HDFS Federation配置示例

```java
<configuration>
  <property>
    <name>dfs.nameservices</name>
    <value>ns1,ns2</value>
  </property>
  <property>
    <name>dfs.namenode.rpc-address.ns1</name>
    <value>nn-host1:rpc-port</value>
  </property>
  <property>
    <name>dfs.namenode.http-address.ns1</name>
    <value>nn-host1:http-port</value>
  </property>
  <property>
    <name>dfs.namenode.secondary.http-address.ns1</name>
    <value>snn-host1:http-port</value>
  </property>
  <property>
    <name>dfs.namenode.rpc-address.ns2</name>
    <value>nn-host2:rpc-port</value>
  </property>
  <property>
    <name>dfs.namenode.http-address.ns2</name>
    <value>nn-host2:http-port</value>
  </property>
  <property>
    <name>dfs.namenode.secondary.http-address.ns2</name>
	<value>snn-host2:http-port</value>
  </property>
</configuration>
```
