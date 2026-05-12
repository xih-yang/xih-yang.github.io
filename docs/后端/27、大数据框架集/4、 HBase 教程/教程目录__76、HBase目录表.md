# 76、HBase目录表
- 来源：https://ddkk.com/zhuanlan/bigdata/hbase/76.html
- 分类：大数据框架
- 分组：教程目录
## HBase目录表

目录表hbase:meta以HBase表的形式存在，并且被HBase shell的list命令过滤掉，但实际上与其他表一样。

### hbase:meta

该hbase:meta表（以前称为.META.）保存了系统中所有区域的列表，并且该hbase:meta位置存储在ZooKeeper中。

该hbase:meta表结构如下：

键（key）

- 格式的区域键（[table],[region start key],[region id]）

值（value）

- info:regioninfo（该区域的序列化HRegionInfo实例）
- info:server （服务器：包含此区域的RegionServer端口）
- info:serverstartcode （包含此区域的RegionServer进程的开始时间）

当一个表处于拆分过程中时，另外两个列将被创建，称为info:splitA和info:splitB。这些列代表两个子区域。这些列的值也是序列化的HRegionInfo实例。该区域被拆分后，最终该行将被删除。

关于HRegionInfo 的说明

空键用于表示表格开始和表结尾。具有空启动键的区域是表中的第一个区域。如果区域同时具有空的开始和空的结束键, 则它是表中唯一的区域。

### 启动排序

首先，hbase:meta在ZooKeeper中查找位置。接下来，使用服务器和startcode值更新hbase:meta。
