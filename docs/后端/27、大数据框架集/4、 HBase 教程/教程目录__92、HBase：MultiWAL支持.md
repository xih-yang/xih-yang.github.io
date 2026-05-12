# 92、HBase：MultiWAL支持
- 来源：https://ddkk.com/zhuanlan/bigdata/hbase/92.html
- 分类：大数据框架
- 分组：教程目录
## MultiWAL

每个RegionServer都有一个WAL，RegionServer必须以串行方式写入WAL，因为HDFS文件必须是连续的。这导致WAL成为性能瓶颈。

HBase 1.0在HBASE-5699中引入了支持MultiWal 。MultiWAL允许RegionServer通过在底层HDFS实例中使用多个管道来并行写入多个WAL流，从而在写入过程中增加总吞吐量。这种并行化是通过将区域传入的编辑分区来完成的。因此，当前的实现将无助于提高单个区域的吞吐量。

使用原始WAL实现的RegionServers和使用MultiWAL实现的RegionServers可以分别处理任意一组WAL的恢复，因此通过滚动重启可以实现零停机配置更新。

**配置MultiWAL**

要为RegionServer配置MultiWAL，请通过在XML中粘贴以下内容来将属性hbase.wal.provider的值设置为multiwal：

```java
<property>
  <name>hbase.wal.provider</name>
  <value>multiwal</value>
</property>
```

重新启动RegionServer以使更改生效。

要为RegionServer禁用MultiWAL，请取消设置该属性并重新启动RegionServer。
