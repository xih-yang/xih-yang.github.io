# 73、安全启用HBase
- 来源：https://ddkk.com/zhuanlan/bigdata/hbase/73.html
- 分类：大数据框架
- 分组：教程目录
## 安全启用HBase

在hbase-2.x之后，默认的“hbase.security.authorization”发生了变化。在hbase-2.x之前，它默认为true，在后来的HBase版本中，默认值变为false。因此，要启用hbase授权，必须在hbase-site.xml中配置以下属性：

```java
<property>
  <name>hbase.security.authorization</name>
  <value>true</value>
</property>
```
