# 194、故障排除和调试HBase和Hadoop问题
- 来源：https://ddkk.com/zhuanlan/bigdata/hbase/194.html
- 分类：大数据框架
- 分组：教程目录
## HBase和Hadoop版本问题

### …无法与客户端版本通信…

如果您在日志中看到如下内容：

```java
... 2012-09-24 10:20:52,168 FATAL org.apache.hadoop.hbase.master.HMaster: Unhandled exception. Starting shutdown. org.apache.hadoop.ipc.RemoteException: Server IPC version 7 cannot communicate with client version 4 ...
```

您是否正在尝试从具有Hadoop 1.0.x客户端的HBase与Hadoop 2.0.x进行通信？使用针对Hadoop 2.0构建的HBase或重建HBase，将-Dhadoop.profile = 2.0属性传递给Maven（有关更多信息，请参阅“构建各种hadoop版本”，这将在之后的章节中进行介绍）。
