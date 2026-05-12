# 64、REST Gateway模拟配置
- 来源：https://ddkk.com/zhuanlan/bigdata/hbase/64.html
- 分类：大数据框架
- 分组：教程目录
## REST Gateway模拟配置

默认情况下，REST Gateway（REST网关）不支持模拟。它代表客户端访问HBase。对于HBase服务器，所有请求都来自REST网关用户，实际用户不详。您可以打开模拟支持。通过模拟，REST网关用户是代理用户。HBase服务器知道每个请求的实际/真实用户，因此它可以应用适当的授权。

要打开REST网关模拟，我们需要配置HBase服务器（主服务器和区域服务器）以允许代理用户；配置REST网关以启用模拟。

要允许代理用户，请将以下内容添加到每个HBase服务器的hbase-site.xml文件中：

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

将REST网关代理用户替换为 `$` USER，并将允许的组列表替换为 `$` GROUPS。

要启用REST网关模拟，请将以下内容添加到每个REST网关的hbase-site.xml文件中：

```java
<property>
  <name>hbase.rest.authentication.type</name>
  <value>kerberos</value>
</property>
<property>
  <name>hbase.rest.authentication.kerberos.principal</name>
  <value>HTTP/_HOST@HADOOP.LOCALDOMAIN</value>
</property>
<property>
  <name>hbase.rest.authentication.kerberos.keytab</name>
  <value>$KEYTAB</value>
</property>
```

用 `$` KEYTAB替代HTTP的keytab 。
