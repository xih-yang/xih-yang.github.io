# 43、HBase作为MapReduce数据源和数据接收器
- 来源：https://ddkk.com/zhuanlan/bigdata/hbase/43.html
- 分类：大数据框架
- 分组：教程目录
## HBase作为MapReduce作业数据源和数据接收器

对于MapReduce 作业，HBase 可以用作数据源、TableInputFormat 和数据接收器、TableOutputFormat 或 MultiTableOutputFormat。编写读取或写入HBase 的 MapReduce作业，建议子类化 TableMapper 或 TableReducer。

如果您运行使用 HBase 作为源或接收器的 MapReduce 作业，则需要在配置中指定源和接收器表和列名称。

当您从HBase 读取时，TableInputFormat 请求 HBase 的区域列表并制作一张映射，可以是一个 map-per-region 或 mapreduce.job.maps mapreduce.job.maps ，映射到大于区域数目的数字。如果您为每个节点运行 TaskTracer/NodeManager 和 RegionServer，则映射将在相邻的 TaskTracker/NodeManager 上运行。在写入 HBase 时，避免使用 Reduce 步骤并从映射中写回 HBase 是有意义的。当您的作业不需要 MapReduce 对映射发出的数据进行排序和排序时，这种方法就可以工作。在插入时，HBase ‘sorts’，因此除非需要，否则双重排序（并在您的 MapReduce 集群周围混洗数据）没有意义。如果您不需要 Reduce，则映射可能会发出在作业结束时为报告处理的记录计数，或者将 Reduces 的数量设置为零并使用 TableOutputFormat。如果运行 Reduce 步骤在你的情况下是有意义的，则通常应使用多个减速器，以便在 HBase 群集上传播负载。

一个新的 HBase 分区程序 HRegionPartitioner 可以运行与现有区域数量一样多的 reducers。当您的表格很大时，HRegionPartitioner 是合适的，并且您的上传不会在完成时大大改变现有区域的数量。否则使用默认分区程序。
