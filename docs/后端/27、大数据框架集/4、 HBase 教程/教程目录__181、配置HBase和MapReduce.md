# 181、配置HBase和MapReduce
- 来源：https://ddkk.com/zhuanlan/bigdata/hbase/181.html
- 分类：大数据框架
- 分组：教程目录
## 配置HBase和MapReduce

通常建议为HBase和MapReduce使用不同的集群。对此更好的限定条件是：不要配置一个 HBase，它提供重MR工作负载的实时请求。OLTP和OLAP优化的系统具有冲突的要求，而另一个将失去另一个，通常是前者。例如，短暂的延迟敏感磁盘读取将不得不排在较长的读取后面，这些读取试图挤出尽可能多的吞吐量。写入HBase的MR作业也会生成刷新和压缩，这反过来会使块缓存中的块无效。

如果需要处理MR中的实时HBase集群中的数据，可以使用CopyTable发送增量，或使用复制在OLAP集群上实时获取新数据。在最坏的情况下，如果您确实需要同时配置两者，请将MR设置为使用比您通常配置的更少的Map和Reduce插槽，可能只需一个。

当HBase的用于OLAP操作，最好以一种经过强化的方式设置它，比如设置更高的ZooKeeper会话超时以及为MemStores提供更多内存（因为工作负载通常是长扫描，所以块缓存不会被大量使用）。
