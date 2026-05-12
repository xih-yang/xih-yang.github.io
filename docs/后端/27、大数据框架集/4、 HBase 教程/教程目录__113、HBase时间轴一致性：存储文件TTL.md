# 113、HBase时间轴一致性：存储文件TTL
- 来源：https://ddkk.com/zhuanlan/bigdata/hbase/113.html
- 分类：大数据框架
- 分组：教程目录
## 存储文件TTL

在上述两种写传播方法中，主服务器的存储文件将在独立于主要区域的辅助服务器中打开。因此，对于主要压缩的文件，辅助文件可能仍然在引用这些文件进行读取。这两个功能都使用HFileLinks来引用文件，但是没有任何保护（还）来保证文件不会被过早删除。因此，作为警卫，您应该将配置属性hbase.master.hfilecleaner.ttl设置为较大的值，例如1小时，以确保您不会收到要转到副本的请求的IOException。
