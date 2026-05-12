# 72、HBase安全批量加载
- 来源：https://ddkk.com/zhuanlan/bigdata/hbase/72.html
- 分类：大数据框架
- 分组：教程目录
## HBase安全批量加载

由于客户端必须将从MapReduce作业生成的文件的所有权转移给HBase，所以在安全模式下的批量加载比正常设置涉及更多。安全批量加载由名为SecureBulkLoadEndpoint的协处理器实现，该协处理器使用由配置属性hbase.bulkload.staging.dir配置的暂存目录，该目录默认为/tmp/hbase-staging/。

**安全批量加载算法**

- 只有一次，创建一个临时目录，这个目录是全局通用的，并由运行HBase的用户拥有（模式711或rwx—x—x）。此目录的列表将类似于以下内容：

```java
    $ ls -ld /tmp/hbase-staging
    drwx--x--x  2 hbase  hbase  68  3 Sep 14:54 /tmp/hbase-staging
```

- 用户将数据写入该用户拥有的安全输出目录。例如，/user/foo/data。
- 在内部，HBase创建一个全局可读/可写（-rwxrwxrwx, 777）的秘密的临时目录。例如，/tmp/hbase-staging/averylongandrandomdirectoryname。该目录的名称和位置不会公开给用户。HBase管理这个目录的创建和删除。
- 用户使数据具有全局可读性和可写性，将其移入随机的临时目录，然后调用该SecureBulkLoadClient#bulkLoadHFiles方法。

安全的优势在于秘密目录的长度和随机性。

要启用安全批量加载，请将以下属性添加到hbase-site.xml。

```java
<property>
  <name>hbase.security.authorization</name>
  <value>true</value>
</property>
<property>
  <name>hbase.bulkload.staging.dir</name>
  <value>/tmp/hbase-staging</value>
</property>
<property>
  <name>hbase.coprocessor.region.classes</name>
  <value>org.apache.hadoop.hbase.security.token.TokenProvider,
  org.apache.hadoop.hbase.security.access.AccessController,org.apache.hadoop.hbase.security.access.SecureBulkLoadEndpoint</value>
</property>
```
