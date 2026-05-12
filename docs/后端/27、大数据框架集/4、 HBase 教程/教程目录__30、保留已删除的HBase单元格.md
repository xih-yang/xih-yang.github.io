# 30、保留已删除的HBase单元格
- 来源：https://ddkk.com/zhuanlan/bigdata/hbase/30.html
- 分类：大数据框架
- 分组：教程目录
## 保留已删除的单元格

默认情况下，删除标记会向后扩展到开始时间。因此，即使 Get 或 Scan 操作指示放置删除标记之前的时间范围，Get 或 Scan 操作也不会看到已删除的单元格（行或列）。

ColumnFamilies 可以选择保留已删除的单元格。在这种情况下，只要这些操作指定的时间范围在影响单元格的任何删除的时间戳之前结束，则仍然可以检索已删除的单元格。这允许甚至在存在删除的情况下进行时间点查询。

删除的单元格仍然受到TTL的限制，并且永远不会超过“最大数量的版本”删除的单元格。新的“原始”扫描选项将返回所有已删除的行和删除标记。

示例– 使用HBase Shell更改 KEEP_DELETED_CELLS 的值

```java
hbase> hbase> alter ‘t1′, NAME => ‘f1′, KEEP_DELETED_CELLS => true
```

示例– 使用 API 更改 KEEP_DELETED_CELLS 的值

```java
...
HColumnDescriptor.setKeepDeletedCells(true);
...
```

让我们来说明在 KEEP_DELETED_CELLS 表上设置属性的基本效果。

首先，没有：

```java
create 'test', {NAME=>'e', VERSIONS=>2147483647}
put 'test', 'r1', 'e:c1', 'value', 10
put 'test', 'r1', 'e:c1', 'value', 12
put 'test', 'r1', 'e:c1', 'value', 14
delete 'test', 'r1', 'e:c1',  11
hbase(main):017:0> scan 'test', {RAW=>true, VERSIONS=>1000}
ROW                                              COLUMN+CELL
 r1                                              column=e:c1, timestamp=14, value=value
 r1                                              column=e:c1, timestamp=12, value=value
 r1                                              column=e:c1, timestamp=11, type=DeleteColumn
 r1                                              column=e:c1, timestamp=10, value=value
1 row(s) in 0.0120 seconds
hbase(main):018:0> flush 'test'
0 row(s) in 0.0350 seconds
hbase(main):019:0> scan 'test', {RAW=>true, VERSIONS=>1000}
ROW                                              COLUMN+CELL
 r1                                              column=e:c1, timestamp=14, value=value
 r1                                              column=e:c1, timestamp=12, value=value
 r1                                              column=e:c1, timestamp=11, type=DeleteColumn
1 row(s) in 0.0120 seconds
hbase(main):020:0> major_compact 'test'
0 row(s) in 0.0260 seconds
hbase(main):021:0> scan 'test', {RAW=>true, VERSIONS=>1000}
ROW                                              COLUMN+CELL
 r1                                              column=e:c1, timestamp=14, value=value
 r1                                              column=e:c1, timestamp=12, value=value
1 row(s) in 0.0120 seconds
```

注意删除单元格是如何放开的。

现在，让我们只用 KEEP_DELETED_CELLS 设置在表上运行相同的测试（您可以执行表或每列族）：

```java
hbase(main):005:0> create 'test', {NAME=>'e', VERSIONS=>2147483647, KEEP_DELETED_CELLS => true}
0 row(s) in 0.2160 seconds
=> Hbase::Table - test
hbase(main):006:0> put 'test', 'r1', 'e:c1', 'value', 10
0 row(s) in 0.1070 seconds
hbase(main):007:0> put 'test', 'r1', 'e:c1', 'value', 12
0 row(s) in 0.0140 seconds
hbase(main):008:0> put 'test', 'r1', 'e:c1', 'value', 14
0 row(s) in 0.0160 seconds
hbase(main):009:0> delete 'test', 'r1', 'e:c1',  11
0 row(s) in 0.0290 seconds
hbase(main):010:0> scan 'test', {RAW=>true, VERSIONS=>1000}
ROW                                                                                          COLUMN+CELL
 r1                                                                                          column=e:c1, timestamp=14, value=value
 r1                                                                                          column=e:c1, timestamp=12, value=value
 r1                                                                                          column=e:c1, timestamp=11, type=DeleteColumn
 r1                                                                                          column=e:c1, timestamp=10, value=value
1 row(s) in 0.0550 seconds
hbase(main):011:0> flush 'test'
0 row(s) in 0.2780 seconds
hbase(main):012:0> scan 'test', {RAW=>true, VERSIONS=>1000}
ROW                                                                                          COLUMN+CELL
 r1                                                                                          column=e:c1, timestamp=14, value=value
 r1                                                                                          column=e:c1, timestamp=12, value=value
 r1                                                                                          column=e:c1, timestamp=11, type=DeleteColumn
 r1                                                                                          column=e:c1, timestamp=10, value=value
1 row(s) in 0.0620 seconds
hbase(main):013:0> major_compact 'test'
0 row(s) in 0.0530 seconds
hbase(main):014:0> scan 'test', {RAW=>true, VERSIONS=>1000}
ROW                                                                                          COLUMN+CELL
 r1                                                                                          column=e:c1, timestamp=14, value=value
 r1                                                                                          column=e:c1, timestamp=12, value=value
 r1                                                                                          column=e:c1, timestamp=11, type=DeleteColumn
 r1                                                                                          column=e:c1, timestamp=10, value=value
1 row(s) in 0.0650 seconds
```

KEEP_DELETED_CELLS 是为了避免从 HBase 中删除单元格时，删除它们的唯一原因是删除标记。因此，如果您编写的版本多于配置的最大版本，或者您有TTL且单元格超过配置的超时等，则 KEEP_DELETED_CELLS 启用的已删除单元格将被删除。
