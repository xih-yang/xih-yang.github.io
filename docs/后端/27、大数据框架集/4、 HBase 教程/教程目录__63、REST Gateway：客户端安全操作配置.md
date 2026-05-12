# 63、REST Gateway：客户端安全操作配置
- 来源：https://ddkk.com/zhuanlan/bigdata/hbase/63.html
- 分类：大数据框架
- 分组：教程目录
## 用于安全操作的客户端配置-REST Gateway

将以下内容添加到每个REST网关的hbase-site.xml文件中：

```java
<property>
  <name>hbase.rest.keytab.file</name>
  <value>$KEYTAB</value>
</property>
<property>
  <name>hbase.rest.kerberos.principal</name>
  <value>$USER/_HOST@HADOOP.LOCALDOMAIN</value>
</property>
```

分别为 `$` USER和 `$` KEYTAB替换适当的凭证和密钥表。

REST网关将使用提供的凭证对HBase进行身份验证。

为了使用REST API主体与HBase进行交互，还需要将hbase.rest.kerberos.principal添加到该acl表中。例如，要赋予REST API主体、rest_server、管理访问权限，像以下的命令就足够了：

```java
grant 'rest_server', 'RWCA'
```

HBase REST网关支持SPNEGO HTTP身份验证，以便客户端访问网关。要为客户端访问启用REST网关Kerberos身份验证，请将以下内容添加到每个REST网关的hbase-site.xml文件中：

```java
<property>
  <name>hbase.rest.support.proxyuser</name>
  <value>true</value>
</property>
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
<!-- Add these if you need to configure a different DNS interface from the default -->
<property>
  <name>hbase.rest.dns.interface</name>
  <value>default</value>
</property>
<property>
  <name>hbase.rest.dns.nameserver</name>
  <value>default</value>
</property>
```

用 `$` KEYTAB替代HTTP的keytab 。

HBase REST网关支持不同的’hbase.rest.authentication.type’：simple、kerberos。您也可以通过实现Hadoop AuthenticationHandler来实现自定义身份验证，然后将完整的类名称指定为’hbase.rest.authentication.type’值。
