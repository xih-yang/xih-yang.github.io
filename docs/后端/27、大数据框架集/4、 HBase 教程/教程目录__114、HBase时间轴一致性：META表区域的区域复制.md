# 114、HBase时间轴一致性：META表区域的区域复制
- 来源：https://ddkk.com/zhuanlan/bigdata/hbase/114.html
- 分类：大数据框架
- 分组：教程目录
## META表区域的区域复制

目前，还没有为META表的WAL完成异步WAL复制。META表的辅助副本仍然从持久性存储文件中刷新自己。因此，hbase.regionserver.meta.storefile.refresh.period需要设置为一个特定的非零值，以刷新元存储文件。请注意，此配置与hbase.regionserver.storefile.refresh.period的配置不同。
