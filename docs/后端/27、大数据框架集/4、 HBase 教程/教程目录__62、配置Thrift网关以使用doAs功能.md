# 62、配置Thrift网关以使用doAs功能
- 来源：https://ddkk.com/zhuanlan/bigdata/hbase/62.html
- 分类：大数据框架
- 分组：教程目录
## 配置Thrift网关以使用doAs功能

[配置Thrift网关以代表客户端进行身份验证](https://www.w3cschool.cn/hbase_doc/hbase_doc-4wi32ofd.html)介绍了如何配置Thrift网关以代表客户端对HBase进行身份验证，以及如何使用代理用户访问HBase。这种方法的局限性在于，客户端使用特定的凭证集进行初始化后，在会话期间它不能更改这些凭证。但是，doAs功能提供了一种灵活的方法，可以使用相同客户端模拟多个主体。此功能在Thrift 1的HBASE-12640中属性，但目前不适用于Thrift 2。

要启用该doAs功能，请将以下内容添加到每个Thrift网关的hbase-site.xml文件中：

```java
<property>
  <name>hbase.regionserver.thrift.http</name>
  <value>true</value>
</property>
<property>
  <name>hbase.thrift.support.proxyuser</name>
  <value>true/value>
</property>
```

要在使用doAs模拟时允许代理用户，请将以下内容添加到每个HBase节点的hbase-site.xml文件中：

```java
<property>
  <name>hadoop.security.authorization</name>
  <value>true</value>
</property>
<property>
  <name>hadoop.proxyuser.$USER.groups</name>
  <value>$GROUPS</value>
</property>
<property>
  <name>hadoop.proxyuser.$USER.hosts</name>
  <value>$GROUPS</value>
</property>
```

查看[演示客户端](https://github.com/apache/hbase/blob/master/hbase-examples/src/main/java/org/apache/hadoop/hbase/thrift/HttpDoAsClient.java)， 以获得有关如何在客户端使用此功能的总体思路。
