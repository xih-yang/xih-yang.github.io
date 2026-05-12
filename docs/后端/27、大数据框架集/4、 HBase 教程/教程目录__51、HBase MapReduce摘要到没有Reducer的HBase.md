# 51、HBase MapReduce摘要到没有Reducer的HBase
- 来源：https://ddkk.com/zhuanlan/bigdata/hbase/51.html
- 分类：大数据框架
- 分组：教程目录
## HBase MapReduce摘要到没有Reducer的HBase

如果您使用 HBase 作为减速器（reducer），也可以在不使用减速器的情况下执行摘要。

工作摘要需要 HBase 目标表。Table 方法 incrementColumnValue 将用于自动增加值。从性能角度来看，对于每个 map-task，保留一个 value 值为 map 的值，并且 在 mapper 的 cleanup 方法期间为每个 key 设置一次更新可能是有意义的。但是，根据要处理的行数和唯一键的不同，您的里程可能会有所不同。

最后，摘要结果在 HBase 中。
