# 60、用于安全操作的客户端配置：Thrift Gateway
- 来源：https://ddkk.com/zhuanlan/bigdata/hbase/60.html
- 分类：大数据框架
- 分组：教程目录
## 用于安全操作的客户端配置：Thrift Gateway

将以下内容添加到每个Thrift网关的hbase-site.xml文件中：

```java
<property>
  <name>hbase.thrift.keytab.file</name>
  <value>/etc/hbase/conf/hbase.keytab</value>
</property>
<property>
  <name>hbase.thrift.kerberos.principal</name>
  <value>$USER/_HOST@HADOOP.LOCALDOMAIN</value>
  <!-- TODO: This may need to be  HTTP/_HOST@<REALM> and _HOST may not work.
   You may have  to put the concrete full hostname.
   -->
</property>
<!-- Add these if you need to configure a different DNS interface from the default -->
<property>
  <name>hbase.thrift.dns.interface</name>
  <value>default</value>
</property>
<property>
  <name>hbase.thrift.dns.nameserver</name>
  <value>default</value>
</property>
```

分别替换“ `$` USER”和“ `$` KEYTAB”的相应凭证和密钥表。

为了使用Thrift API主体与HBase进行交互，还需要将hbase.thrift.kerberos.principal添加到该acl表中。例如，要赋予Thrift API主体，thrift_server，管理访问权限（administrative access），可以使用如下的命令：

```java
grant 'thrift_server', 'RWCA'
```

Thrift网关将使用提供的凭证向HBase进行身份验证。Thrift网关本身不会执行任何身份验证。所有通过Thrift网关访问的客户端都将使用Thrift网关的凭证并拥有其权限。
