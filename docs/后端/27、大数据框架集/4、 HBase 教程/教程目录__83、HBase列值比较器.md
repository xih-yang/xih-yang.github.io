# 83、HBase列值比较器
- 来源：https://ddkk.com/zhuanlan/bigdata/hbase/83.html
- 分类：大数据框架
- 分组：教程目录
## HBase列值比较器

Filter包中有几个值得提及的Comparator类。这些比较器与其他Filter一起使用，例如，SingleColumnValueFilter。

### RegexStringComparator

RegexStringComparator支持用于值比较的正则表达式。

```java
RegexStringComparator comp = new RegexStringComparator("my.");   // any value that starts with 'my'
SingleColumnValueFilter filter = new SingleColumnValueFilter(
  cf,
  column,
  CompareOperaor.EQUAL,
  comp
  );
scan.setFilter(filter);
```

请参阅[Oracle JavaDoc](https://docs.oracle.com/javase/6/docs/api/java/util/regex/Pattern.html)以获取Java中受支持的RegEx模式。

### SubstringComparator

SubstringComparator可用于确定给定的子字符串是否存在于某个值中，比较是不区分大小写的。

```java
SubstringComparator comp = new SubstringComparator("y val");   // looking for 'my value'
SingleColumnValueFilter filter = new SingleColumnValueFilter(
  cf,
  column,
  CompareOperaor.EQUAL,
  comp
  );
scan.setFilter(filter);
```

### BinaryPrefixComparator

请参阅[BinaryPrefixComparator](https://hbase.apache.org/apidocs/org/apache/hadoop/hbase/filter/BinaryPrefixComparator.html)。

### BinaryComparator

请参阅[BinaryComparator](https://hbase.apache.org/apidocs/org/apache/hadoop/hbase/filter/BinaryComparator.html)。
