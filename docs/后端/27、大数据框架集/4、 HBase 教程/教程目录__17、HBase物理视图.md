# 17、HBase物理视图
- 来源：https://ddkk.com/zhuanlan/bigdata/hbase/17.html
- 分类：大数据框架
- 分组：教程目录
## HBase物理视图

本节介绍 HBase 物理视图。

尽管在HBase 概念视图中，表格被视为一组稀疏的行的集合，但它们是按列族进行物理存储的。可以随时将新的列限定符（column_family：column_qualifier）添加到现有的列族。

ColumnFamily anchor 表：

行键（Row Key）
时间戳（Time Stamp）
ColumnFamily anchor

“com.cnn.www”

T9

anchor:cnnsi.com = “CNN”

“com.cnn.www”

T8

anchor:my.look.ca = “CNN.com”

ColumnFamily contents 表：

行键（Row Key）
时间戳（Time Stamp）
ColumnFamily contents:

“com.cnn.www”

T6

contents:html = “…​”

“com.cnn.www”

T5

contents:html = “…​”

“com.cnn.www”

T3

contents:html = “…​”

HBase 概念视图中显示的空单元根本不存储。因此，对时间戳为 t8 的 contents:html 列值的请求将不返回任何值。同样，在时间戳为 t9 中一个anchor:my.look.ca 值的请求也不会返回任何值。但是，如果未提供时间戳，则会返回特定列的最新值。给定多个版本，最近的也是第一个找到的，因为时间戳按降序存储。因此，如果没有指定时间戳，则对行 com.cnn.www 中所有列的值的请求将是: 时间戳 t6 中的 contents:html，时间戳 t9 中 anchor:cnnsi.com 的值，时间戳 t8 中 anchor:my.look.ca 的值。
