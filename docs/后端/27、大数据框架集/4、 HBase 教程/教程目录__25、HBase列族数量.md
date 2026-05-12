# 25、HBase列族数量
- 来源：https://ddkk.com/zhuanlan/bigdata/hbase/25.html
- 分类：大数据框架
- 分组：教程目录
## HBase列族数量

HBase 目前对于两列族或三列族以上的任何项目都不太合适，因此请将模式中的列族数量保持在较低水平。目前，flushing 和 compactions 是按照每个区域进行的，所以如果一个列族承载大量数据带来的 flushing，即使所携带的数据量很小，也会 flushing 相邻的列族。当许多列族存在时，flushing 和 compactions 相互作用可能会导致一堆不必要的 I/O（要通过更改 flushing 和 compactions 来针对每个列族进行处理）。

如果你可以在你的模式中尝试使用一个列族。在数据访问通常是列作用域的情况下，仅引入第二和第三列族；即你查询一个列族或另一个列族，但通常不是两者同时存在。

### ColumnFamilies的基数

在一个表中存在多个 ColumnFamilies 的情况下，请注意基数（即行数）。如果 ColumnFamilyA 拥有100万行并且 ColumnFamilyB 拥有10亿行，则ColumnFamilyA 的数据可能会分布在很多很多地区（以及 Region Server）中。这使得 ColumnFamilyA 的大规模扫描效率较低。
