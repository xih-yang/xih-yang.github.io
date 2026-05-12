# 54、HBase推测执行
- 来源：https://ddkk.com/zhuanlan/bigdata/hbase/54.html
- 分类：大数据框架
- 分组：教程目录
## HBase推测执行

通常建议关闭使用 HBase 作为源的 MapReduce 作业的推测执行（speculative execution）功能。这可以通过属性或整个集群来实现。特别是对于长时间运行的作业，推测执行将创建重复的映射任务，将您的数据写入 HBase；这可能不是你想要的。
