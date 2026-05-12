# 168、HBase部署协处理器的准则
- 来源：https://ddkk.com/zhuanlan/bigdata/hbase/168.html
- 分类：大数据框架
- 分组：教程目录
## 部署协处理器的准则

捆绑协处理器

您可以将协处理器的所有类捆绑到RegionServer类路径上的单个JAR中，以便于部署。否则，将所有依赖项放在RegionServer的类路径中，以便在RegionServer启动期间加载它们。RegionServer的类路径在RegionServer的hbase-env.sh文件中设置。

自动部署

您可以使用Puppet，Chef或Ansible等工具将协处理器的JAR发送到RegionServers文件系统上的所需位置，然后重新启动每个RegionServer，以自动执行协处理器部署。此类设置的详细信息超出了本文档的介绍范围。

更新协处理器

部署新版本的给定协处理器并不像禁用它、替换JAR和重新启用协处理器那么简单。这是因为除非删除对它的所有当前引用，否则无法在JVM中重新加载类。由于当前JVM引用了现有的协处理器，因此必须通过重新启动RegionServer来重新启动JVM，以便替换它。此行为不应更改。

协处理器日志记录

协处理器框架不提供用于超出标准Java日志记录的API。

协处理器配置

如果您不想从HBase Shell加载协处理器，可以将其配置属性添加到hbase-site.xml。在上一节内容的[使用HBase Shell](https://www.w3cschool.cn/hbase_doc/hbase_doc-bn9k2ydl.html)中，设置了两个参数：arg1=1,arg2=2。这些可以添加到hbase-site.xml如下：

```java
<property>
  <name>arg1</name>
  <value>1</value>
</property>
<property>
  <name>arg2</name>
  <value>2</value>
</property>
```

然后，您可以使用以下代码读取配置：

```java
Configuration conf = HBaseConfiguration.create();
Connection connection = ConnectionFactory.createConnection(conf);
TableName tableName = TableName.valueOf("users");
Table table = connection.getTable(tableName);
Get get = new Get(Bytes.toBytes("admin"));
Result result = table.get(get);
for (Cell c : result.rawCells()) {
    System.out.println(Bytes.toString(CellUtil.cloneRow(c))
        + "==> " + Bytes.toString(CellUtil.cloneFamily(c))
        + "{" + Bytes.toString(CellUtil.cloneQualifier(c))
        + ":" + Bytes.toLong(CellUtil.cloneValue(c)) + "}");
}
Scan scan = new Scan();
ResultScanner scanner = table.getScanner(scan);
for (Result res : scanner) {
    for (Cell c : res.rawCells()) {
        System.out.println(Bytes.toString(CellUtil.cloneRow(c))
        + " ==> " + Bytes.toString(CellUtil.cloneFamily(c))
        + " {" + Bytes.toString(CellUtil.cloneQualifier(c))
        + ":" + Bytes.toLong(CellUtil.cloneValue(c))
        + "}");
    }
}
```
