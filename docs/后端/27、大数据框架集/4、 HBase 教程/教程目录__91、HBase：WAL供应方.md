# 91、HBase：WAL供应方
- 来源：https://ddkk.com/zhuanlan/bigdata/hbase/91.html
- 分类：大数据框架
- 分组：教程目录
## WAL供应方

在HBase中，有一些WAL 实现（或“Providers”）。每个都有一个简短的名字标签，但是，它并不总是具有描述性的。您可以通过WAL provder短名称在hbase-site.xml中设置provider（供应方），以作为hbase.wal.provider属性的值（使用hbase.wal.meta_provider属性设置hbase:meta的供应方）

- asyncfs：默认。自hbase-2.0.0以来的新版本（HBASE-15536，HBASE-14790）。这个AsyncFSWAL提供程序，它在RegionServer日志中标识自身，是基于新的非阻塞dfsclient实现构建的。它目前驻留在hbase代码库中，但其意图是将其备份到HDFS本身。WALs编辑以并行方式（“fan-out”）写入每个DataNode上的每个WAL块副本，而不是默认客户端的链式管道中，延迟应该会更好。
- 文件系统：这是hbase-1.x版本的默认设置。它基于阻塞的DFSClient构建，并以经典的DFSCLient管道模式写入副本。在日志中它标识为FSHLog或FSHLogProvider。
- multiwal：该供应方是由asyncfs或文件系统的多个实例组成。

在RegionServer日志中查找下面的行，以查看哪个供应方处于适当的位置（下面显示了默认的AsyncFSWALProvider）：

```java
2018-04-02 13:22:37,983 INFO  [regionserver/ve0528:16020] wal.WALFactory: Instantiating WALProvider of type class org.apache.hadoop.hbase.wal.AsyncFSWALProvider
```
