# 15、Hadoop 教程 - Hadoop HDFS Trash垃圾回收详解
- 来源：https://ddkk.com/zhuanlan/bigdata/hadoop/2/15.html
- 分类：大数据框架
- 分组：教程目录
## 1. Trash垃圾回收

### 1.1 背景

`回收站（垃圾桶）`是微软 Windows 操作系统里的一个系统文件夹，主要用来`存放用户临时删除的文档资料`，存放在`回收站的文件可以恢复`。

回收站的功能给了我们一剂 “后悔药”。回收站保存了删除的文件、文件夹、图片、快捷方式等。这些项目将一直保留在回收站中，直到您清空回收站。我们许多误删除的文件就是从它里面找到的。

HDFS 本身也是一个文件系统，那么就会涉及到文件数据的删除操作。`默认情况下，HDFS中是没有回收站垃圾桶`概念的，删除操作的数据将会被直接删除，没有后悔药。

### 1.2 功能概述

`Trash机制`，叫做回收站或者垃圾桶。Trash 就像 Windows 操作系统中的回收站一样。它的目的是防止你无意中删除某些东西。默认情况下是不开启的。

启用 Trash 功能后，从 HDFS 中`删除某些内容时`，文件或目录`不会立即被清除`，它们将被`移动到回收站Current目录中`(`/user/${username}/.Trash/current`)。

`.Trash`中的文件在用户可配置的时间延迟后被永久删除。也可以简单地将回收站里的文件移动到`.Trash`目录之外的位置来恢复回收站中的文件和目录。

#### 1.2.1 Trash Checkpoint

`检查点仅仅是用户回收站下的一个目录`，用于`存储在创建检查点之前删除的所有文件或目录`。如果你想查看回收站目录，可以在`/user/${username}/.Trash/{timestamp_of_checkpoint_creation}`处看到:

最近删除的文件被移动到回收站 Current 目录，并且在可配置的时间间隔内，HDFS 会为在 Current 回收站目录下的文件创建检查点`/user/${username}/.Trash/`，并在过期时删除旧的检查点。

### 1.3 功能开启

#### 1.3.1 关闭HDFS集群

在hadoop1 节点上，执行一键关闭 HDFS 集群命令：`stop-dfs.sh`。

#### 1.3.2 修改core-site.xml文件

在hadoop1 节点上修改`core-site.xml`文件，添加下面两个属性：

```java
<property>  
    <name>fs.trash.interval</name>  
    <value>1440</value>  
</property>  
<property>  
    <name>fs.trash.checkpoint.interval</name>  
    <value>0</value>  
</property>
```

`fs.trash.interval`：分钟数，当超过这个分钟数后检查点会被删除。如果为零，Trash 回收站功能将被禁用。

`fs.trash.checkpoint.interval`：检查点创建的时间间隔(单位为分钟)。其值应该小于或等于`fs.trash.interval`。如果为零，则将该值设置为`fs.trash.interval`的值。每次运行检查点时，它都会从当前版本中创建一个新的检查点，并删除在数分钟之前创建的检查点。

#### 1.3.3 同步集群配置文件

```java
scp /data/hadoop-3.3.1/etc/hadoop/core-site.xml hadoop@192.168.68.102:/data/hadoop-3.3.1/etc/hadoop/
scp /data/hadoop-3.3.1/etc/hadoop/core-site.xml hadoop@192.168.68.103:/data/hadoop-3.3.1/etc/hadoop/
```

#### 1.3.4 启动HDFS集群

在hadoop1 节点上，执行一键启动 HDFS 集群命令：`start-dfs.sh`。

### 1.4 功能使用

#### 1.4.1 删除文件到Trash

开启 Trash 功能后，正常执行删除操作，文件实际并不会被直接删除，而是被移动到了垃圾回收站。

#### 1.4.2 删除文件跳过Trash

有的时候，我们希望直接把文件删除，不需要再经过 Trash 回收站了，可以在执行删除操作的时候添加一个参数：`-skipTrash`

`hadoop fs -rm -skipTrash /input/2.txt`

#### 1.4.3 从Trash中恢复文件

回收站里面的文件，在到期被自动删除之前，都可以通过命令恢复出来。使用 mv、cp 命令把数据文件从 Trash 目录下复制移动出来就可以了。

`hadoop fs -mv /user/hadoop/.Trash/Current/input/* /input/`

#### 1.4.4 清空Trash

除了`fs.trash.interval`参数控制到期自动删除之外，用户还可以通过命令手动清空回收站，释放 HDFS 磁盘存储空间。

首先想到的是删除整个回收站目录，将会清空回收站，这是一个选择。此外。HDFS 提供了一个命令行工具来完成这个工作：

`hadoop fs -expunge`

该命令立即从文件系统中删除过期的检查点。
