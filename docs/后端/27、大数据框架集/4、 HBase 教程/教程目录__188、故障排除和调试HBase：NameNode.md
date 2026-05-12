# 188、故障排除和调试HBase：NameNode
- 来源：https://ddkk.com/zhuanlan/bigdata/hbase/188.html
- 分类：大数据框架
- 分组：教程目录
## NameNode

有关NameNode的更多信息，请参阅[HDFS](https://www.w3cschool.cn/hbase_doc/hbase_doc-sf3e2rq8.html)。

### 表和区域的HDFS利用率

要确定HBase在HDFS上使用的空间大小，请使用NameNode中的hadoop shell命令。例如：

```java
hadoop fs -dus /hbase/
```

返回所有HBase对象的总磁盘利用率。

```java
hadoop fs -dus /hbase/myTable
```

返回HBase表’myTable’的总磁盘利用率。

```java
hadoop fs -du /hbase/myTable
```

…返回HBase表’myTable’下的区域列表及其磁盘利用率。

有关HDFS shell命令的更多信息，请参阅[HDFS FileSystem Shell文档](https://hadoop.apache.org/docs/stable/hadoop-project-dist/hadoop-common/FileSystemShell.html)。

### 浏览HBase对象的HDFS

有时需要探索HDFS上存在的HBase对象。这些对象可能包括WAL（预写日志），表，区域，StoreFiles等。最简单的方法是使用运行在端口50070上的NameNode Web应用程序。NameNode Web应用程序将提供指向集群中所有DataNode的链接，以便可以无缝浏览它们。

集群中HBase表的HDFS目录结构是：

```java
/hbase
    /data
        /<Namespace>                    (Namespaces in the cluster)
            /<Table>                    (Tables in the cluster)
                /<Region>               (Regions for the table)
                    /<ColumnFamily>     (ColumnFamilies for the Region for the table)
                        /<StoreFile>    (StoreFiles for the ColumnFamily for the Regions for the table)
```

HBase WAL的HDFS目录结构是：

```java
/hbase
    /WALs
        /<RegionServer>    (RegionServers)
            /<WAL>         (WAL files for the RegionServer)
```

#### 大小为零的WALs，其中包含数据

问题：获取RegionServer的WALs目录中的所有文件的列表时，一个文件的大小为0，但它包含数据。

答：这是HDFS的特殊情况。当前正在写入的文件的大小似乎为0，但一旦关闭，它将显示其真实大小。

#### 用例

用于查询HBase对象的HDFS的两个常见用例是研究表的未压缩程度。如果每个ColumnFamily都有大量StoreFiles，则表明需要进行主要压缩。此外，在进行主要压缩后，如果生成的StoreFile为“small”，则表明需要减少表的ColumnFamilies。

### 意外的文件系统增长

如果您看到HBase意外地增加了文件系统的使用，两个可能的原因是快照和WAL。

快照

创建快照时，HBase会保留在快照时重新创建表状态所需的一切。这包括已删除的单元格或过期版本。因此，您应该精心规划快照的使用模式，并且应该修剪不再需要的快照。快照存储在/hbase/.hbase-snapshot中，用于还原快照所需的存档位于/hbase/archive/``/``/``/。

```java
*不要*通过HDFS手动管理快照或存档。HBase提供API和
用于管理它们的HBase Shell命令。有关更多信息，请参阅<< ops.snapshots >>。
```

WAL

预写日志（WAL）存储在HBase根目录的子目录中，通常是/hbase/，具体取决于它们的状态。已经处理好的WALs存储在/hbase/oldWALs/并且损坏的WAL存储在/hbase/.corrupt/中，以供检查。如果其中一个子目录的大小正在增长，请检查HBase服务器日志以找出未正确处理WAL的原因。

如果您使用复制并且/hbase/oldWALs/使用的空间超出预期，请记住，只要存在对等项，复制被禁用时就会保存WAL。

不要通过HDFS手动管理WAL。
