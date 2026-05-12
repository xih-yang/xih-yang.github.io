# 159、HBase单个过滤器语法
- 来源：https://ddkk.com/zhuanlan/bigdata/hbase/159.html
- 分类：大数据框架
- 分组：教程目录
## 单个过滤器语法

KeyOnlyFilter

此过滤器不带任何参数。它仅返回每个键值的关键组件。

FirstKeyOnlyFilter

此过滤器不带任何参数。它仅返回每行的第一个键值。

PrefixFilter

此过滤器采用一个参数 – 行键的前缀。它仅返回以指定行前缀开头的行中存在的键值

ColumnPrefixFilter

此过滤器采用一个参数 – 列前缀。它仅返回以指定列前缀开头的列中存在的键值。列前缀的格式必须为：“qualifier”。

MultipleColumnPrefixFilter

此过滤器采用列前缀列表。它返回以任何指定列前缀开头的列中存在的键值。每个列前缀必须采用以下形式：“qualifier”。

ColumnCountGetFilter

此过滤器采用一个参数 – 一个限制。它返回表中的第一个限制列数。

的PageFilter

此过滤器采用一个参数 – 页面大小。它返回表中的页面大小行数。

ColumnPaginationFilter

此过滤器有两个参数 – 限制和偏移。它返回偏移列数后的列数限制。它为所有行执行此操作。

InclusiveStopFilter

此过滤器使用一个参数 – 要停止扫描的行键。它返回行中存在的所有键值，包括指定的行。

TimeStampsFilter

此过滤器采用时间戳列表。它返回时间戳与任何指定时间戳匹配的键值。

的RowFilter

该过滤器采用比较运算符和比较器。它使用compare运算符将每个行键与比较器进行比较，如果比较返回true，则返回该行中的所有键值。

家庭过滤器

该过滤器采用比较运算符和比较器。它使用比较运算符将每个列族名称与比较器进行比较，如果比较返回true，则返回该列族中的所有单元格。

QualifierFilter

该过滤器采用比较运算符和比较器。它使用compare运算符将每个限定符名称与比较器进行比较，如果比较返回true，则返回该列中的所有键值。

ValueFilter

该过滤器采用比较运算符和比较器。它使用比较运算符将每个值与比较器进行比较，如果比较返回true，则返回该键值。

DependentColumnFilter

此过滤器有两个参数 – 族和限定符。它尝试在每一行中找到此列，并返回该行中具有相同时间戳的所有键值。如果该行不包含指定的列 – 将返回该行中的任何键值。

SingleColumnValueFilter

该过滤器采用列族，限定符，比较运算符和比较器。如果未找到指定的列 – 将发出该行的所有列。如果找到该列并且与比较器的比较返回true，则将发出该行的所有列。如果条件失败，则不会发出该行。

SingleColumnValueExcludeFilter

此过滤器采用相同的参数，其行为与SingleColumnValueFilter相同 – 但是，如果找到该列并且条件通过，则除了测试的列值之外，将发出该行的所有列。

ColumnRangeFilter

此过滤器仅用于选择列在minColumn和maxColumn之间的键。它还需要两个布尔变量来指示是否包含minColumn和maxColumn。
