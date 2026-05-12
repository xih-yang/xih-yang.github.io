# 41、MapReduce扫描缓存
- 来源：https://ddkk.com/zhuanlan/bigdata/hbase/41.html
- 分类：大数据框架
- 分组：教程目录
## MapReduce扫描缓存

现在，TableMapReduceUtil 恢复了在传入的 Scan 对象中设置扫描程序缓存（在将结果返回给客户端之前缓存的行数）的选项。由于 HBase 0.95（HBASE-11558）中的错误，此功能丢失。这是为 HBase 0.98.5 和0.96.3 而定的。选择扫描仪缓存的优先顺序如下：

**1、** 在扫描对象上设置的缓存设置；

**2、** 通过配置选项hbase.client.scanner.caching指定的缓存设置，可以在hbase-site.xml中手动设置或通过辅助方法TableMapReduceUtil.setScannerCaching()设置；

**3、** 默认值HConstants.DEFAULT_HBASE_CLIENT_SCANNER_CACHING，设置为100；

优化缓存设置是客户端等待结果的时间和客户端需要接收的结果集的数量之间的一种平衡。如果缓存设置过大，客户端可能会等待很长时间，否则请求可能会超时。如果设置太小，扫描需要返回几个结果。如果将 scan 视为 shovel，则更大的缓存设置类似于更大的 shovel，而更小的缓存设置相当于更多的 shovel，以填充 bucket。

上面提到的优先级列表允许您设置合理的默认值，并针对特定操作对其进行覆盖。
