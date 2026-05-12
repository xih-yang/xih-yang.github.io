# 22、HBase排序顺序、列元数据以及联合查询
- 来源：https://ddkk.com/zhuanlan/bigdata/hbase/22.html
- 分类：大数据框架
- 分组：教程目录
## HBase排序顺序

所有数据模型操作 HBase 以排序顺序返回数据。首先按行，然后按列族（ColumnFamily），然后是列限定符，最后是时间戳（反向排序，因此首先返回最新的记录）。

## HBase列元数据

ColumnFamily 的内部 KeyValue 实例之外不存储列元数据。因此，尽管 HBase 不仅可以支持每行大量的列数，而且还能对行之间的一组异构列进行维护，但您有责任跟踪列名。

获得ColumnFamily 存在的一组完整列的唯一方法是处理所有行。

## HBase联合查询

HBase 是否支持联合是该区列表中的一个常见问题，并且有一个简单的答案：它不是，至少在 RDBMS 支持它们的方式中（例如，使用 SQL 中的等连接或外连接）。如本章所述，HBase 中读取的数据模型操作是 Get 和 Scan，你可以参考“[HBase数据模型操作](https://www.w3cschool.cn/hbase_doc/hbase_doc-g2pm2m10.html)”部分

但是，这并不意味着您的应用程序不支持等效的联合功能，但您必须自己动手。两个主要策略是在写入 HBase 时对数据进行非规格化，或者在您的应用程序或MapReduce 代码中使用查找表并进行HBase表之间的连接（并且正如 RDBMS 演示的那样，有几种策略取决于 HBase 的大小表，例如，嵌套循环与散列连接）。那么最好的方法是什么？这取决于你想要做什么，因此没有一个适用于每个用例的答案。

## ACID

ACID，指数据库事务正确执行的四个基本要素的缩写，即：原子性（Atomicity），一致性（Consistency），隔离性（Isolation），持久性（Durability）。

HBase 支持特定场景下的 ACID，即对同一行的 Put 操作保证完全的 ACID（HBASE-3584增加了多操作事务，HBASE-5229增加了多行事务，但原理是一样的）
