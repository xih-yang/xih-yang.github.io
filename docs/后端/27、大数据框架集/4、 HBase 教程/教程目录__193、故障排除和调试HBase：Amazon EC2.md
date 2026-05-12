# 193、故障排除和调试HBase：Amazon EC2
- 来源：https://ddkk.com/zhuanlan/bigdata/hbase/193.html
- 分类：大数据框架
- 分组：教程目录
## Amazon EC2

### ZooKeeper似乎不适用于Amazon EC2

部署为Amazon EC2实例时，HBase无法启动。如下所示的异常显示在Master或RegionServer日志中：

```java
  2009-10-19 11:52:27,030 INFO org.apache.zookeeper.ClientCnxn: Attempting
  connection to server ec2-174-129-15-236.compute-1.amazonaws.com/10.244.9.171:2181
  2009-10-19 11:52:27,032 WARN org.apache.zookeeper.ClientCnxn: Exception
  closing session 0x0 to sun.nio.ch.SelectionKeyImpl@656dc861
  java.net.ConnectException: Connection refused
```

安全组策略阻止公共地址上的ZooKeeper端口。在配置ZooKeeper quorum对等列表时，请使用内部EC2主机名。

### Amazon EC2上的不稳定性

关于HBase和Amazon EC2的问题经常出现在HBase dist-list上。使用[Search Hadoop](http://search-hadoop.com/)搜索旧线程。

### 远程Java连接到EC2群集不起作用

请参阅Andrew的答案，在用户列表中：[远程Java客户端连接到EC2实例](http://search-hadoop.com/m/sPdqNFAwyg2)。
