# 38、HBase操作和性能配置选项
- 来源：https://ddkk.com/zhuanlan/bigdata/hbase/38.html
- 分类：大数据框架
- 分组：教程目录
## 调试HBase服务器RPC处理

- 设置 hbase.regionserver.handler.count（在 hbase-site.xml）为用于并发的核心 x 轴。
- 可选地，将调用队列分成单独的读取和写入队列以用于区分服务。该参数 hbase.ipc.server.callqueue.handler.factor 指定调用队列的数量：
- 0 意味着单个共享队列。
- 1 意味着每个处理程序的一个队列。
- 一个0和1之间的值，按处理程序的数量成比例地分配队列数。例如，0.5 的值在每个处理程序之间共享一个队列。
- 使用 hbase.ipc.server.callqueue.read.ratio（hbase.ipc.server.callqueue.read.share在0.98中）将调用队列分成读写队列：
- 0.5 意味着将有相同数量的读写队列。
-  0.5 表示写多于读。
- 设置 hbase.ipc.server.callqueue.scan.ratio（HBase 1.0+）将读取调用队列分为短读取和长读取队列：
- 0.5 意味着将有相同数量的短读取和长读取队列。
-  0.5表示更多的长读取队列。

## 禁用RPC的Nagle

禁用Nagle 的算法。延迟的 ACKs 可以增加到200毫秒的 RPC 往返时间。设置以下参数：

- 在 Hadoop 的 core-site.xml 中：
- ipc.server.tcpnodelay = true
- ipc.client.tcpnodelay = true
- 在 HBase 的 hbase-site.xml 中：
- hbase.ipc.client.tcpnodelay = true
- hbase.ipc.server.tcpnodelay = true

## 限制服务器故障影响

尽可能快地检测区域服务器故障。设置以下参数：

- 在 hbase-site.xml 中设置 zookeeper.session.timeout 为30秒或更短的时间内进行故障检测（20-30秒是一个好的开始）。
- 检测并避免不健康或失败的 HDFS 数据节点：in hdfs-site.xml 和 hbase-site.xml 设置以下参数：
- dfs.namenode.avoid.read.stale.datanode = true
- dfs.namenode.avoid.write.stale.datanode = true

## 针对低延迟优化服务器端

- 跳过本地块的网络。在 hbase-site.xml 中，设置以下参数：
- dfs.client.read.shortcircuit = true
- dfs.client.read.shortcircuit.buffer.size = 131072 （重要的是避免 OOME）
- 确保数据局部性。在 hbase-site.xml 中，设置 hbase.hstore.min.locality.to.skip.major.compact = 0.7（意味着 0.7 = 8192
- dfs.datanode.handler.count = 主轴数量

## JVM调优

### 调整JVM GC以获取低收集延迟

- 使用 CMS 收集器： -XX:+UseConcMarkSweepGC
- 保持 eden 空间尽可能小，以减少平均收集时间。例：-XX：CMSInitiatingOccupancyFraction = 70
- 优化低收集延迟而不是吞吐量： -Xmn512m
- 并行收集 eden： -XX:+UseParNewGC
- 避免在压力下收集： -XX:+UseCMSInitiatingOccupancyOnly
- 限制每个请求扫描器的结果大小，所以一切都适合幸存者空间，但没有任职期限。在 hbase-site.xml 中，设置 hbase.client.scanner.max.result.size 为 eden 空间的1/8（使用 – Xmn512m，这里是〜51MB）
- 设置 max.result.sizex handler.count 小于 survivor 空间

### OS级调整

- 关闭透明的大页面（THP）：

```java
    echo never > /sys/kernel/mm/transparent_hugepage/enabled
    echo never > /sys/kernel/mm/transparent_hugepage/defrag
```

- 设置 vm.swappiness = 0
- 设置 vm.min_free_kbytes 为至少 1GB（较大内存系统为 8GB）
- 使用 vm.zone_reclaim_mode = 0 禁用 NUMA 区域回收。
