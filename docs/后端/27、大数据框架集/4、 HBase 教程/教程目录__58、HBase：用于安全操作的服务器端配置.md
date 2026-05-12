# 58、HBase：用于安全操作的服务器端配置
- 来源：https://ddkk.com/zhuanlan/bigdata/hbase/58.html
- 分类：大数据框架
- 分组：教程目录
## 用于安全操作的服务器端配置

首先，请参考“[客户端安全访问Apache HBase](https://www.w3cschool.cn/hbase_doc/hbase_doc-nqis2oa8.html)”，以确保您的基础 HDFS 配置是安全的。

将以下内容添加到群集中每个服务器计算机上的 hbase-site.xml 文件中：

```java
<property>
  <name>hbase.security.authentication</name>
  <value>kerberos</value>
</property>
<property>
  <name>hbase.security.authorization</name>
  <value>true</value>
</property>
<property>
<name>hbase.coprocessor.region.classes</name>
  <value>org.apache.hadoop.hbase.security.token.TokenProvider</value>
</property>
```

部署这些配置更改时，需要完全关闭并重新启动 HBase 服务。
