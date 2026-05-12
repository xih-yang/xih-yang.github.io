# 94、HBase：WAL压缩
- 来源：https://ddkk.com/zhuanlan/bigdata/hbase/94.html
- 分类：大数据框架
- 分组：教程目录
## WAL压缩

可以使用LRU Dictionary压缩来压缩WAL的内容。这可以用来加速WAL复制到不同的datanode。该Dictionary最多可以存储215个元素；超过这个数字后开始逐出。

要启用WAL压缩，请将hbase.regionserver.wal.enablecompression属性设置为true。此属性的默认值是false。默认情况下，启用WAL压缩时，WAL标记压缩处于打开状态。您可以通过将该hbase.regionserver.wal.tags.enablecompression属性设置为’false’来关闭WAL标签压缩。

WAL压缩的一个可能的缺点是，如果WAL中间写入不好，我们会丢失WAL中最后一个块的更多数据。如果最后一个块中的条目添加了新的字典条目，但由于突然终止而导致修改后的Dictionary失败，读取最后一个块可能无法解析最后写入的条目。
