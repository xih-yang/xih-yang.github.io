# 84、KeyValue元数据
- 来源：https://ddkk.com/zhuanlan/bigdata/hbase/84.html
- 分类：大数据框架
- 分组：教程目录
## KeyValue元数据

由于HBase在内部将数据存储为KeyValue对，因此KeyValue元数据过滤器（KeyValue Metadata Filters）会评估一行中是否存在键（即，ColumnFamily：列限定符），而不是前一节中的值。

### FamilyFilter

FamilyFilter可用于过滤ColumnFamily。在扫描（Scan）中选择ColumnFamilies通常比在过滤器（Filter）中选择ColumnFamilies更好。

### QualifierFilter

QualifierFilter可用于基于列（aka Qualifier）名称进行过滤。

### ColumnPrefixFilter

ColumnPrefixFilter可用于基于列（又名限定符）名称的主要部分进行过滤。

ColumnPrefixFilter提前查找匹配每行前缀和每个涉及列族的第一列。它可以用来高效地获取非常宽的行中的一个列的子集。

注意：同一列限定符可用于不同的列族。此过滤器将返回所有匹配的列。

示例：查找以“abc”开头的行和家族中的所有列

```java
Table t = ...;
byte[] row = ...;
byte[] family = ...;
byte[] prefix = Bytes.toBytes("abc");
Scan scan = new Scan(row, row); // (optional) limit to one row
scan.addFamily(family); // (optional) limit to one family
Filter f = new ColumnPrefixFilter(prefix);
scan.setFilter(f);
scan.setBatch(10); // set this if there could be many columns returned
ResultScanner rs = t.getScanner(scan);
for (Result r = rs.next(); r != null; r = rs.next()) {
  for (KeyValue kv : r.raw()) {
    // each kv represents a column
  }
}
rs.close();
```

### MultipleColumnPrefixFilter

MultipleColumnPrefixFilter的行为类似于ColumnPrefixFilter，但允许指定多个前缀。

像ColumnPrefixFilter一样，MultipleColumnPrefixFilter可以高效地搜索与最低前缀匹配的第一列，并且在前缀之间查找过去的列范围。它可以用来从很宽的行中有效地获得不连续的列集。

示例：查找以“abc”或“xyz”开头的行和家族中的所有列

```java
Table t = ...;
byte[] row = ...;
byte[] family = ...;
byte[][] prefixes = new byte[][] {Bytes.toBytes("abc"), Bytes.toBytes("xyz")};
Scan scan = new Scan(row, row); // (optional) limit to one row
scan.addFamily(family); // (optional) limit to one family
Filter f = new MultipleColumnPrefixFilter(prefixes);
scan.setFilter(f);
scan.setBatch(10); // set this if there could be many columns returned
ResultScanner rs = t.getScanner(scan);
for (Result r = rs.next(); r != null; r = rs.next()) {
  for (KeyValue kv : r.raw()) {
    // each kv represents a column
  }
}
rs.close();
```

### ColumnRangeFilter

ColumnRangeFilter允许有效的帧内行扫描。

ColumnRangeFilter可以为每个涉及的列族寻找第一个匹配列。它可以用来有效地获得非常宽的行的“切片”。即，你连续有一百万列，但你只想看看列bbbb-bbdd。

注意：同一列限定符可用于不同的列族。此过滤器将返回所有匹配的列。

示例：查找“bbbb”（含）和“bbdd”（含）之间的行和族中的所有列

```java
Table t = ...;
byte[] row = ...;
byte[] family = ...;
byte[] startColumn = Bytes.toBytes("bbbb");
byte[] endColumn = Bytes.toBytes("bbdd");
Scan scan = new Scan(row, row); // (optional) limit to one row
scan.addFamily(family); // (optional) limit to one family
Filter f = new ColumnRangeFilter(startColumn, true, endColumn, true);
scan.setFilter(f);
scan.setBatch(10); // set this if there could be many columns returned
ResultScanner rs = t.getScanner(scan);
for (Result r = rs.next(); r != null; r = rs.next()) {
  for (KeyValue kv : r.raw()) {
    // each kv represents a column
  }
}
rs.close();
```
