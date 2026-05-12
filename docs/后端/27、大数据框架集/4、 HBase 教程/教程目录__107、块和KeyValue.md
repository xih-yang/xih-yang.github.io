# 107、块和KeyValue
- 来源：https://ddkk.com/zhuanlan/bigdata/hbase/107.html
- 分类：大数据框架
- 分组：教程目录
## 块（Blocks）

StoreFiles由块（blocks）组成。块大小基于每个ColumnFamily进行配置。

压缩发生在StoreFiles中的块级别。有关压缩的更多信息，请参阅HBase中的压缩和数据块编码。

## KeyValue

KeyValue类是HBase中数据存储的核心。KeyValue包装一个字节数组，并将偏移量和长度放入传递的数组中，指定将内容开始解释为KeyValue的位置。

字节数组中的KeyValue格式是：

- keylength
- valuelength
- key
- value

Key进一步分解为：

- rowlength
- row（即，rowkey）
- columnfamilylength
- ColumnFamily
- columnqualifier
- timestamp（时间戳）
- keytype（键类型）（例如，Put，Delete，DeleteColumn，DeleteFamily）

KeyValue实例不会跨块拆分。例如，如果有8 MB的KeyValue，即使块大小为64kb，该KeyValue也会作为一个连贯的块读入。

### 示例

为了强调以上几点，请检查两行不同列Put同一行上发生的情况：

- Put ＃1： rowkey=row1, cf:attr1=value1
- Put ＃2： rowkey=row1, cf:attr2=value2

即使这些是针对同一行的，也会为每列创建一个KeyValue：

Put＃1的关键部分：

- rowlength ———–→ 4
- row —————–→ row1
- columnfamilylength –→ 2
- columnfamily ——–→ cf
- columnqualifier —–→ attr1
- timestamp ———–→ server time of Put
- keytype ————-→ Put

Put＃2的关键部分：

- rowlength ———–→ 4
- row —————–→ row1
- columnfamilylength –→ 2
- columnfamily ——–→ cf
- columnqualifier —–→ attr2
- timestamp ———–→ server time of Put
- keytype ————-→ Put

了解rowkey，ColumnFamily和列（又名columnqualifier）嵌入在KeyValue实例中是很重要的。这些标识符越长，KeyValue就越大。
