# 100、HBase区域拆分
- 来源：https://ddkk.com/zhuanlan/bigdata/hbase/100.html
- 分类：大数据框架
- 分组：教程目录
## HBase区域拆分

区域在达到配置的阈值时拆分。下面我们简要介绍这个话题。有关更长的说明，请参见Enis Soztutar的[Apache HBase Region拆分和合并](https://hortonworks.com/blog/apache-hbase-region-splitting-and-merging/)。

拆分在RegionServer上独立运行；即主机不参与。RegionServer拆分一个区域，脱离拆分区域，然后将子区域添加到hbase:meta，在父级的服务器RegionServer上打开子服务器，然后将拆分报告给Master。
