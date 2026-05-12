# 65、用户访问Apache HBase的简单方法
- 来源：https://ddkk.com/zhuanlan/bigdata/hbase/65.html
- 分类：大数据框架
- 分组：教程目录
## 用户访问Apache HBase

较新版本的Apache HBase（0.92版本以后）支持客户端的可选SASL身份验证。

本节介绍如何设置Apache HBase和客户端，以便用户访问HBase资源。

### 简单与安全访问

以下部分介绍如何设置用户访问Apache HBase的一种简单方法。简单的用户访问不是一种运行HBase的安全方法。此方法用于防止用户犯错。它可用于在开发系统上模拟访问控制，而无需设置Kerberos。

此方法不用于防止恶意或黑客入侵。为了使HBase能够抵御这些类型的攻击，您必须配置HBase进行安全操作。请参阅[客户端安全访问Apache HBase](https://www.w3cschool.cn/hbase_doc/hbase_doc-nqis2oa8.html)部分并完成此处描述的所有步骤。

### 简单用户访问操作的服务器端配置

将以下内容添加到群集中每个服务器计算机上的hbase-site.xml文件中：

```java
<property>
  <name>hbase.security.authentication</name>
  <value>simple</value>
</property>
<property>
  <name>hbase.security.authorization</name>
  <value>true</value>
</property>
<property>
  <name>hbase.coprocessor.master.classes</name>
  <value>org.apache.hadoop.hbase.security.access.AccessController</value>
</property>
<property>
  <name>hbase.coprocessor.region.classes</name>
  <value>org.apache.hadoop.hbase.security.access.AccessController</value>
</property>
<property>
  <name>hbase.coprocessor.regionserver.classes</name>
  <value>org.apache.hadoop.hbase.security.access.AccessController</value>
</property>
```

对于Apache HBase 0.94版本，请将以下内容添加到集群中每台服务器计算机上的hbase-site.xml文件中：

```java
<property>
  <name>hbase.rpc.engine</name>
  <value>org.apache.hadoop.hbase.ipc.SecureRpcEngine</value>
</property>
<property>
  <name>hbase.coprocessor.master.classes</name>
  <value>org.apache.hadoop.hbase.security.access.AccessController</value>
</property>
<property>
  <name>hbase.coprocessor.region.classes</name>
  <value>org.apache.hadoop.hbase.security.access.AccessController</value>
</property>
```

部署这些配置更改时，需要完全关闭并重新启动HBase服务。

### 简单用户访问操作的客户端配置

将以下内容添加到每个客户端上的hbase-site.xml文件中：

```java
<property>
  <name>hbase.security.authentication</name>
  <value>simple</value>
</property>
```

对于Apache HBase 0.94版本，请将以下内容添加到集群中每台服务器计算机上的hbase-site.xml文件中：

```java
<property>
  <name>hbase.rpc.engine</name>
  <value>org.apache.hadoop.hbase.ipc.SecureRpcEngine</value>
</property>
```

请注意，如果客户端和服务器端站点文件中的hbase.security.authentication不匹配，则客户端将无法与群集进行通信。

#### 简单用户访问操作的客户端配置 – Thrift Gateway

用户将需要访问Thrift网关。例如，要为Thrift API用户提供thrift_server管理访问，你可能需要使用如下的命令：

```java
grant 'thrift_server', 'RWCA'
```

Thrift网关将使用提供的凭证向HBase进行身份验证。Thrift网关本身不会执行任何身份验证。所有通过Thrift网关访问的客户端都将使用Thrift网关的凭证并拥有其权限。

#### 简单用户访问操作的客户端配置 – REST Gateway

REST网关将使用提供的凭证对HBase进行身份验证。REST网关本身不会执行任何身份验证。所有通过REST网关访问的客户端都将使用REST网关的凭证并拥有其权限。

REST网关用户将需要访问。例如，要为REST API用户提供rest_server管理访问，你可能需要使用如下的命令：

```java
grant 'rest_server', 'RWCA'
```
