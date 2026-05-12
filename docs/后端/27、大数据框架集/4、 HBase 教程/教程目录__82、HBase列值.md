# 82、HBase列值
- 来源：https://ddkk.com/zhuanlan/bigdata/hbase/82.html
- 分类：大数据框架
- 分组：教程目录
## HBase列值

### SingleColumnValueFilter

可以使用SingleColumnValueFilter（请参阅：https：//hbase.apache.org/apidocs/org/apache/hadoop/hbase/filter/SingleColumnValueFilter.html）来测试相等（如，CompareOperaor.EQUAL），不相等（如，CompareOperaor.NOT_EQUAL）的列值或者范围（例如，CompareOperaor.GREATER）。以下是一个测试列与字符串值“my value”等效的示例：

```java
SingleColumnValueFilter filter = new SingleColumnValueFilter(
  cf,
  column,
  CompareOperaor.EQUAL,
  Bytes.toBytes("my value")
  );
scan.setFilter(filter);
```

### ColumnValueFilter

在HBase-2.0.0版本中引入作为SingleColumnValueFilter的互补，ColumnValueFilter只获取匹配的单元格，而SingleColumnValueFilter获取匹配单元格所属的整个行（包含其他列和值）。ColumnValueFilter的构造函数的参数与SingleColumnValueFilter相同。

```java
ColumnValueFilter filter = new ColumnValueFilter(
  cf,
  column,
  CompareOperaor.EQUAL,
  Bytes.toBytes("my value")
  );
scan.setFilter(filter);
```

注意：对于“equals to a family:qualifier:value”这样的简单查询，我们强烈推荐使用以下方式，而不是使用SingleColumnValueFilter或ColumnValueFilter：

```java
Scan scan = new Scan();
scan.addColumn(Bytes.toBytes("family"), Bytes.toBytes("qualifier"));
ValueFilter vf = new ValueFilter(CompareOperator.EQUAL,
  new BinaryComparator(Bytes.toBytes("value")));
scan.setFilter(vf);
...
```

此扫描将限制为指定的列’family：qualifier’，避免扫描不相关的系列和列，这些列具有更好的性能，而ValueFilter是用于执行值过滤的条件。
