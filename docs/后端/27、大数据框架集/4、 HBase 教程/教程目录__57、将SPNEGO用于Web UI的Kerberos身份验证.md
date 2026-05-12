# 57、将SPNEGO用于Web UI的Kerberos身份验证
- 来源：https://ddkk.com/zhuanlan/bigdata/hbase/57.html
- 分类：大数据框架
- 分组：教程目录
## 将SPNEGO用于Web UI的Kerberos身份验证

通过使用 hbase-site.xml 中的 hbase.security.authentication.ui 属性配置 SPNEGO，可以启用对 HBase Web UI 的 Kerberos 身份验证（Kerberos-authentication）。启用此身份验证要求 HBase 也配置为对 RPC 使用 Kerberos 身份验证（例如，hbase.security.authentication = kerberos）。

```java
<property>
  <name>hbase.security.authentication.ui</name>
  <value>kerberos</value>
  <description>Controls what kind of authentication should be used for the HBase web UIs.</description>
</property>
<property>
  <name>hbase.security.authentication</name>
  <value>kerberos</value>
  <description>The Kerberos keytab file to use for SPNEGO authentication by the web server.</description>
</property>
```

存在许多用于为 Web 服务器配置 SPNEGO 身份验证的属性：

```java
<property>
  <name>hbase.security.authentication.spnego.kerberos.principal</name>
  <value>HTTP/_HOST@EXAMPLE.COM</value>
  <description>Required for SPNEGO, the Kerberos principal to use for SPNEGO authentication by the
  web server. The _HOST keyword will be automatically substituted with the node's
  hostname.</description>
</property>
<property>
  <name>hbase.security.authentication.spnego.kerberos.keytab</name>
  <value>/etc/security/keytabs/spnego.service.keytab</value>
  <description>Required for SPNEGO, the Kerberos keytab file to use for SPNEGO authentication by the
  web server.</description>
</property>
<property>
  <name>hbase.security.authentication.spnego.kerberos.name.rules</name>
  <value></value>
  `<description>`Optional, Hadoop-style auth_to_local rules which will be parsed and used in the
  handling of Kerberos principals</description>
</property>
<property>
  <name>hbase.security.authentication.signature.secret.file</name>
  <value></value>
  <description>Optional, a file whose contents will be used as a secret to sign the HTTP cookies
  as a part of the SPNEGO authentication handshake. If this is not provided, Java's Random library
  will be used for the secret.</description>
</property>
```
