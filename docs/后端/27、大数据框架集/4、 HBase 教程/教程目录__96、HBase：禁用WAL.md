# 96、HBase：禁用WAL
- 来源：https://ddkk.com/zhuanlan/bigdata/hbase/96.html
- 分类：大数据框架
- 分组：教程目录
## 禁用WAL

为了改善在某些特定情况下的性能，你可以禁用WAL。但是，禁用WAL会使数据处于危险之中。推荐这种情况的唯一情况是在批量加载过程中。这是因为，如果出现问题，可以重新运行批量负载，而不会有数据丢失的风险。

通过调用HBase客户端字段Mutation.writeToWAL(false)来禁用WAL。使用Mutation.setDurability(Durability.SKIP_WAL)和Mutation.getDurability()方法来设置和获取字段的值。没有办法只为特定的表禁用WAL。

如果您为批量加载之外的任何其他功能禁用WAL，则您的数据处于危险之中。
