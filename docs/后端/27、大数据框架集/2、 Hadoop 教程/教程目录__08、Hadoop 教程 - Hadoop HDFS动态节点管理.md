# 08、Hadoop 教程 - Hadoop HDFS动态节点管理
- 来源：https://ddkk.com/zhuanlan/bigdata/hadoop/2/8.html
- 分类：大数据框架
- 分组：教程目录
## 1. 背景

已有 HDFS 集群容量已经不能满足存储数据的需求，需要在原有集群基础上动态添加新的 DataNode 节点。就是俗称的动态扩容。

旧的服务器需要进行退役更换，暂停服务，需要在当下的集群中停止某些机器上 HDFS 的服务，俗称动态缩容。

## 2. 动态扩容、节点上线

### 2.1 新机器基础环境准备

#### 2.1.1 主机名、IP

确保新机器 IP 和已有 HDFS 集群所属同一网段

新机器系统 hostname

#### 2.1.2 Hosts映射

集群所有节点保持hosts文件统一

#### 2.1.3 防火墙

关闭防火墙

#### 2.1.4 SSH免密登录

为了后续脚本一键启动关闭集群方便，设置 NameNode 到新机器的免密登录。

#### 2.1.5 JDK环境配置

略。

### 2.2 Hadoop配置

这块就不细说了，和普通安装没什么区别，可以看我的这篇博客自行安装：[《Hadoop3.x在centos上的完全分布式部署》](https://blog.csdn.net/weixin_44758876/article/details/122410214)

#### 2.2.1 DataNode负载均衡服务

新加入的节点，没有数据块的存储，使得集群整体来看负载不均衡。因此最后还需要对 hdfs 负载设置均衡。首先设置数据传输带宽。

`hdfs dfsadmin -setBalancerBandwidth 104857600`

然后启动 Balancer，等待集群自均衡完成即可。

`hdfs balancer -threshold 5`

## 3. 动态缩容、节点下线

### 3.1 添加退役节点

在namenode 机器的`hdfs-site.xml`配置文件中需要提前配置`dfs.hosts.exclude`属性，该属性指向的文件就是所谓的黑名单列表，会被 namenode 排除在集群之外。如果文件内容为空，则意味着不禁止任何机器。

提前配置好的目的是让 namenode 启动的时候就能加载到该属性，只不过还没有指定任何机器。否则就需要重启 namenode 才能加载，因此这样的操作我们称之为`具有前瞻性的操作`。

```java
<property>
	<name>dfs.hosts.exclude</name>
	<value>/data/hadoop-3.3.1/etc/hadoop/excludes</value>
</property>
```

编辑`dfs.hosts.exclude`属性指向的 excludes 文件，添加需要退役的主机名称。

**注意：**如果副本数是 3，服役的节点小于等于 3，是不能退役成功的，需要修改副本数后才能退役。

### 3.2 刷新集群

在namenode 所在的机器刷新节点：`hdfs dfsadmin -refreshNodes`

等待退役节点状态为decommissioned（所有块已经复制完成）

### 3.3 手动关闭DataNode进程

`hdfs --daemon stop datanode`

### 3.4 DataNode负载均衡服务

如果需要可以对已有的 HDFS 集群进行负载均衡服务。

`hdfs balancer -threshold 5`

## 4. 黑白名单机制

### 4.1 白名单

所谓的白名单指的是`允许`哪些机器加入到当前的 HDFS 集群中，是一种准入机制。

白名单由`dfs.hosts`参数指定，该参数位于`hdfs-site.xml`。默认值为空。

dfs.hosts 指向文件，该文件包含允许连接到 namenode 的主机列表。必须指定文件的完整路径名。如果该值为空，则允许所有主机准入。

### 4.2 黑名单

所谓的黑名单指的是`禁止`哪些机器加入到当前的 HDFS 集群中，是一种禁入机制。

黑名单由`dfs.hosts.exclude`参数指定，该参数位于`hdfs-site.xml`。默认值为空。

dfs.hosts.exclude 指向文件，该文件包含不允许连接到名称节点的主机列表。必须指定文件的完整路径名。如果该值为空，则不禁止任何主机加入。
