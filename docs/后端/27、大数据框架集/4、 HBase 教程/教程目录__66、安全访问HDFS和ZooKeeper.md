# 66、安全访问HDFS和ZooKeeper
- 来源：https://ddkk.com/zhuanlan/bigdata/hbase/66.html
- 分类：大数据框架
- 分组：教程目录
## 安全访问HDFS和ZooKeeper

HBase需要安全的[ZooKeeper](https://www.w3cschool.cn/zookeeper/zookeeper_overview.html)和HDFS，以便用户无法访问或修改HBase下的元数据和数据。HBase使用HDFS（或配置的文件系统）来保留其数据文件以及预写日志（WAL）和其他数据。HBase使用ZooKeeper来存储操作的一些元数据（主地址（master address），表锁（table locks），恢复状态（recovery state）等）。

### 保护ZooKeeper数据

ZooKeeper具有可插入的身份验证机制，可以使用不同的方法访问客户端。ZooKeeper甚至允许同时允许经过身份验证和未经身份验证的客户端。通过为每个znode提供访问控制列表（ACL）来限制对znodes的访问。ACL包含两个组件，即身份验证方法和主体。ACL不是分层强制执行的。

HBase守护程序通过SASL和Kerberos向ZooKeeper进行身份验证（请参阅使用ZooKeeper进行SASL身份验证）。HBase设置znode ACL，以便只有HBase用户和配置的hbase超级用户（hbase.superuser）可以访问和修改数据。在ZooKeeper用于服务发现或与客户端共享状态的情况下，由HBase创建的znodes也将允许任何人（不管身份验证）读取这些znode（clusterId，主地址，元位置等），但只有HBase用户可以修改它们。

### 保护文件系统（HDFS）数据

所有管理的数据都保存在文件系统（hbase.rootdir）的根目录下。访问文件系统中的数据和WAL文件应受到限制，以便用户不能绕过HBase层，并从文件系统中查看底层数据文件。HBase假定使用的文件系统（HDFS或其他）分层次地强制执行权限。如果没有提供足够的文件系统保护（授权和身份验证），HBase级别授权控制（ACL，可见性标签等）就没有意义，因为用户可以随时访问文件系统中的数据。

HBase对其根目录执行posix-like权限700（rwx——）。这意味着只有HBase用户可以读写FS中的文件。可以通过在hbase-site.xml中进行配置hbase.rootdir.perms来更改默认设置。需要重新启动活动主服务器，以便更改使用的权限。对于1.2.0之前的版本，您可以检查是否提交了HBASE-13780，如果没有，您可以根据需要手动设置根目录的权限。使用HDFS，该命令将是：

```java
sudo -u hdfs hadoop fs -chmod 700 /hbase
```

如果你使用不同的hbase.rootdir，你应该改变/hbase。

在安全模式下，应配置SecureBulkLoadEndpoint并将其用于正确地将从MR作业创建的用户文件移交给HBase守护程序和HBase用户。用于批量加载（hbase.bulkload.staging.dir默认为/tmp/hbase-staging）的分布式文件系统中的状态目录应具有（模式711或rwx—x—x），以便用户可以访问在该父目录下创建的状态目录，但无法执行任何其他操作。
