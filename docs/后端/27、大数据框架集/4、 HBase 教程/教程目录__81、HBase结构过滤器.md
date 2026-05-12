# 81、HBase结构过滤器
- 来源：https://ddkk.com/zhuanlan/bigdata/hbase/81.html
- 分类：大数据框架
- 分组：教程目录
## HBase结构过滤器

结构过滤器包含其他过滤器。

### FilterList

[FilterList](https://hbase.apache.org/apidocs/org/apache/hadoop/hbase/filter/FilterList.html)表示Filters之间的FilterList.Operator.MUST_PASS_ALL或FilterList.Operator.MUST_PASS_ONE关系的Filters列表。以下示例显示了两个过滤器（在同一个属性上检查“我的值”或“我的其他值”）之间的’or’关系。

```java
FilterList list = new FilterList(FilterList.Operator.MUST_PASS_ONE);
SingleColumnValueFilter filter1 = new SingleColumnValueFilter(
  cf,
  column,
  CompareOperator.EQUAL,
  Bytes.toBytes("my value")
  );
list.add(filter1);
SingleColumnValueFilter filter2 = new SingleColumnValueFilter(
  cf,
  column,
  CompareOperator.EQUAL,
  Bytes.toBytes("my other value")
  );
list.add(filter2);
scan.setFilter(list);
```
