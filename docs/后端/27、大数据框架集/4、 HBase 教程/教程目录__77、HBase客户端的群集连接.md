# 77、HBase客户端的群集连接
- 来源：https://ddkk.com/zhuanlan/bigdata/hbase/77.html
- 分类：大数据框架
- 分组：教程目录
## HBase客户端群集连接

API在HBase 1.0中进行了更改。有关连接配置信息，请参阅连接到HBase群集的客户端配置和依赖关系。

### HBase 1.0.0的API

它已被清理并且用户被返回接口来处理而不是特定的类型。在HBase的1.0，从ConnectionFactory获得Connection对象，在需要的基础上从Table，Admin以及RegionLocator获取它的实例。完成后关闭获取的实例。最后，确保在退出之前清理您的Connection实例。 Connections是重量级的对象，但线程安全，所以你可以为你的应用程序创建一个并保持实例。 Table，Admin和RegionLocator实例是轻量级的。随时创建，然后在关闭它们后立即放手。

### HBase 1.0.0之前的API

实例HTable是与1.0.0之前的HBase集群版本进行交互的方式。表实例不是线程安全的。在任何给定的时间，只有一个线程可以使用Table的一个实例。在创建Table实例时，建议使用相同的HBaseConfiguration实例。这将确保将ZooKeeper和套接字实例共享到RegionServers，而这通常是您想要的。例如，这是首选：

```java
HBaseConfiguration conf = HBaseConfiguration.create();
HTable table1 = new HTable(conf, "myTable");
HTable table2 = new HTable(conf, "myTable");
```

与此相反：

```java
HBaseConfiguration conf1 = HBaseConfiguration.create();
HTable table1 = new HTable(conf1, "myTable");
HBaseConfiguration conf2 = HBaseConfiguration.create();
HTable table2 = new HTable(conf2, "myTable");
```

有关如何在HBase客户端中处理连接的更多信息，请参阅ConnectionFactory。

### 连接池

对于需要高端多线程访问的应用程序（例如，可在单个JVM中为多个应用程序线程提供服务的Web服务器或应用程序服务器），可以预先创建一个Connection，如以下示例所示：

例子：预先创建一个Connection

```java
// Create a connection to the cluster.
Configuration conf = HBaseConfiguration.create();
try (Connection connection = ConnectionFactory.createConnection(conf);
     Table table = connection.getTable(TableName.valueOf(tablename))) {
  // use table as needed, the table returned is lightweight
}
```

HTablePool已弃用

本指南的以前版本讨论了HTablePool，它在HBase 0.94、0.95和0.96中被否决, 并在0.98.1、HBASE-6580 或 HConnection 中删除, 这在 HBase 1.0 中被弃用连接。请改用连接，请改用Connection。
