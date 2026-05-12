# 192、故障排除和调试HBase：ZooKeeper
- 来源：https://ddkk.com/zhuanlan/bigdata/hbase/192.html
- 分类：大数据框架
- 分组：教程目录
## ZooKeeper

### 启动错误

#### 找不到我的地址：ZooKeeper Qualm服务器列表中的xyz

ZooKeeper服务器无法启动，抛出该错误。xyz是服务器的名称。

这是名称查找问题。HBase尝试在某台计算机上启动ZooKeeper服务器，但该计算机无法在hbase.zookeeper.quorum配置中找到自己。

使用错误消息中显示的主机名而不是您使用的值。如果您有DNS服务器，则可以在hbase-site.xml中设置hbase.zookeeper.dns.interface和hbase.zookeeper.dns.nameserver，以确保它解析为正确的FQDN。
