# 53、访问MapReduce作业中的其他HBase表
- 来源：https://ddkk.com/zhuanlan/bigdata/hbase/53.html
- 分类：大数据框架
- 分组：教程目录
## 访问MapReduce作业中的其他HBase表

尽管当前框架允许一个 HBase 表作为 MapReduce 作业的输入，其他的HBase表可以作为查找表来访问，等等，在 MapReduce 作业中，通过在 Mapper 的 setup 方法中创建一个 Table 实例。

```java
public class MyMapper extends TableMapper<Text, LongWritable> {
  private Table myOtherTable;
  public void setup(Context context) {
    // In here create a Connection to the cluster and save it or use the Connection
    // from the existing table
    myOtherTable = connection.getTable("myOtherTable");
  }
  public void map(ImmutableBytesWritable row, Result value, Context context) throws IOException, InterruptedException {
    // process Result...
    // use 'myOtherTable' for lookups
  }
```
