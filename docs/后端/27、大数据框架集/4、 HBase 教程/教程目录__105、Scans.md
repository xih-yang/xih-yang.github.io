# 105、Scans
- 来源：https://ddkk.com/zhuanlan/bigdata/hbase/105.html
- 分类：大数据框架
- 分组：教程目录
## Scans

- 当客户端针对表发出扫描时，HBase会为每个区域生成一个RegionScanner对象来提供扫描请求。
- 该RegionScanner对象包含一个StoreScanner对象列表，每列族一个。
- 每个StoreScanner对象还包含StoreFileScanner对应的列表，对应于相应列族的每个StoreFile和HFile，以及MemStore的KeyValueScanner对象列表。
- 这两个列表被合并为一个，该列表按照升序对列表末尾的MemStore扫描对象进行排序。
- 当一个StoreFileScanner对象被构造时，它与一个MultiVersionConcurrencyControl读取点（即当前的memstoreTS）相关联，过滤出读取点之外的任何新的更新。
