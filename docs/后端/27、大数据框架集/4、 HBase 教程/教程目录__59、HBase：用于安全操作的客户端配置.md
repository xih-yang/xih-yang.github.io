# 59、HBase：用于安全操作的客户端配置
- 来源：https://ddkk.com/zhuanlan/bigdata/hbase/59.html
- 分类：大数据框架
- 分组：教程目录
## 用于安全操作的客户端配置

首先，请参阅“[客户端安全访问Apache HBase](https://www.w3cschool.cn/hbase_doc/hbase_doc-nqis2oa8.html)”并确保您的基础 HDFS 配置是安全的。

将以下内容添加到每个客户端上的 hbase-site.xml 文件中：

```java
<property>
  <name>hbase.security.authentication</name>
  <value>kerberos</value>
</property>
```

客户端环境必须通过 kinit 命令从 KDC 或 keytab 登录到 Kerberos，然后才能与 HBase 群集通信。

请注意，如果客户端和服务器端站点文件中的 hbase.security.authentication 不匹配，则客户端将无法与群集进行通信。

一旦将HBase 配置为安全 RPC，就可以选择配置加密通信。为此，请将以下内容添加到每个客户端上的 hbase-site.xml 文件中：

```java
<property>
  <name>hbase.rpc.protection</name>
  <value>privacy</value>
</property>
```

此配置属性也可以在每个连接的基础上进行设置。将其设置为 Configuration 提供给 Table：

```java
Configuration conf = HBaseConfiguration.create();
Connection connection = ConnectionFactory.createConnection(conf);
conf.set("hbase.rpc.protection", "privacy");
try (Connection connection = ConnectionFactory.createConnection(conf);
     Table table = connection.getTable(TableName.valueOf(tablename))) {
  .... do your stuff
}
```

对于加密通信，预计会有大约 10％ 的性能损失。
