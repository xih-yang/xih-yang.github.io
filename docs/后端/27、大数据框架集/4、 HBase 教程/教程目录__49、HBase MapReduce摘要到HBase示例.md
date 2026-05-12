# 49、HBase MapReduce摘要到HBase示例
- 来源：https://ddkk.com/zhuanlan/bigdata/hbase/49.html
- 分类：大数据框架
- 分组：教程目录
## HBase MapReduce摘要到HBase示例

以下的示例使用 HBase 作为 MapReduce 源，并使用一个总结步骤。此示例将计算表中某个值的不同实例的数量，并将这些汇总计数写入另一个表中。

```java
Configuration config = HBaseConfiguration.create();
Job job = new Job(config,"ExampleSummary");
job.setJarByClass(MySummaryJob.class);     // class that contains mapper and reducer
Scan scan = new Scan();
scan.setCaching(500);        // 1 is the default in Scan, which will be bad for MapReduce jobs
scan.setCacheBlocks(false);  // don't set to true for MR jobs
// set other scan attrs
TableMapReduceUtil.initTableMapperJob(
  sourceTable,        // input table
  scan,               // Scan instance to control CF and attribute selection
  MyMapper.class,     // mapper class
  Text.class,         // mapper output key
  IntWritable.class,  // mapper output value
  job);
TableMapReduceUtil.initTableReducerJob(
  targetTable,        // output table
  MyTableReducer.class,    // reducer class
  job);
job.setNumReduceTasks(1);   // at least one, adjust as required
boolean b = job.waitForCompletion(true);
if (!b) {
  throw new IOException("error with job!");
}
```

在此示例映射器中，选择一个带有字符串值的列作为要汇总的值。该值用作从映射器发出的密钥，IntWritable 代表实例计数器。

```java
public static class MyMapper extends TableMapper<Text, IntWritable>  {
  public static final byte[] CF = "cf".getBytes();
  public static final byte[] ATTR1 = "attr1".getBytes();
  private final IntWritable ONE = new IntWritable(1);
  private Text text = new Text();
  public void map(ImmutableBytesWritable row, Result value, Context context) throws IOException, InterruptedException {
    String val = new String(value.getValue(CF, ATTR1));
    text.set(val);     // we can only emit Writables...
    context.write(text, ONE);
  }
}
```

在reducer 中，“ones” 被计数（就像任何其他的 MR 例子一样），然后发出一个 Put。

```java
public static class MyTableReducer extends TableReducer<Text, IntWritable, ImmutableBytesWritable>  {
  public static final byte[] CF = "cf".getBytes();
  public static final byte[] COUNT = "count".getBytes();
  public void reduce(Text key, Iterable<IntWritable> values, Context context) throws IOException, InterruptedException {
    int i = 0;
    for (IntWritable val : values) {
      i += val.get();
    }
    Put put = new Put(Bytes.toBytes(key.toString()));
    put.add(CF, COUNT, Bytes.toBytes(i));
    context.write(null, put);
  }
}
```
