# 52、HBase MapReduce摘要到RDBMS
- 来源：https://ddkk.com/zhuanlan/bigdata/hbase/52.html
- 分类：大数据框架
- 分组：教程目录
## HBase MapReduce摘要到RDBMS

有时候给 RDBMS 生成摘要更为合适。对于这些情况，可以通过自定义减速器直接向 RDBMS 生成摘要。该 setup 方法可以连接到 RDBMS（连接信息可以通过上下文中的自定义参数传递），并且清理方法可以关闭连接。

重要的是，要了解工作中的减速器的数量会影响到摘要的实现，您必须将其设计到您的减速器中。具体而言，它是否被设计为以单例（一个减速器）或多个减速器运行。是或不是，这取决于你的用例。认识到分配给作业的减速者越多，同时建立到 RDBMS 的连接就会越多 – 这将会扩展，但仅限于某一点。

```java
public static class MyRdbmsReducer extends Reducer<Text, IntWritable, Text, IntWritable>  {
  private Connection c = null;
  public void setup(Context context) {
    // create DB connection...
  }
  public void reduce(Text key, Iterable<IntWritable> values, Context context) throws IOException, InterruptedException {
    // do summarization
    // in this example the keys are Text, but this is just an example
  }
  public void cleanup(Context context) {
    // close db connection
  }
}
```

最后，摘要结果将写入您的 RDBMS 表。
