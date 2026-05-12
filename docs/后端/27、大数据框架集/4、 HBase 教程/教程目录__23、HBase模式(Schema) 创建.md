# 23、HBase模式(Schema) 创建
- 来源：https://ddkk.com/zhuanlan/bigdata/hbase/23.html
- 分类：大数据框架
- 分组：教程目录
## HBase模式创建

你可以使用 Apache HBase Shell 或使用 Java API 中的 Admin 来创建或更新 HBase 模式。

进行ColumnFamily 修改时，必须禁用表格，例如：

```java
Configuration config = HBaseConfiguration.create();
Admin admin = new Admin(conf);
TableName table = TableName.valueOf("myTable");
admin.disableTable(table);
HColumnDescriptor cf1 = ...;
admin.addColumn(table, cf1);      // adding new ColumnFamily
HColumnDescriptor cf2 = ...;
admin.modifyColumn(table, cf2);    // modifying existing ColumnFamily
admin.enableTable(table);
```

## HBase模式更新

当对表或 ColumnFamilies (如区域大小、块大小) 进行更改时，这些更改将在下一次出现重大压缩并重新写入 StoreFiles 时生效。
