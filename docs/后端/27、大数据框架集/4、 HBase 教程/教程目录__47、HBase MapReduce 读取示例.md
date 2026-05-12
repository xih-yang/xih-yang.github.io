# 47、HBase MapReduce 读取示例
- 来源：https://ddkk.com/zhuanlan/bigdata/hbase/47.html
- 分类：大数据框架
- 分组：教程目录
## HBase MapReduce 读取示例

以下是以只读方式将 HBase 用作 MapReduce 源的示例。具体来说，有一个 Mapper 实例，但没有 Reducer，并且没有任何内容从 Mapper 发出。这项工作将被定义如下：

```java
Configuration config = HBaseConfiguration.create();
Job job = new Job(config, "ExampleRead");
job.setJarByClass(MyReadJob.class);     // class that contains mapper
Scan scan = new Scan();
scan.setCaching(500);        // 1 is the default in Scan, which will be bad for MapReduce jobs
scan.setCacheBlocks(false);  // don't set to true for MR jobs
// set other scan attrs
...
TableMapReduceUtil.initTableMapperJob(
  tableName,        // input HBase table name
  scan,             // Scan instance to control CF and attribute selection
  MyMapper.class,   // mapper
  null,             // mapper output key
  null,             // mapper output value
  job);
job.setOutputFormatClass(NullOutputFormat.class);   // because we aren't emitting anything from mapper
boolean b = job.waitForCompletion(true);
if (!b) {
  throw new IOException("error with job!");
}
```

映射器实例将扩展 TableMapper：

```java
public static class MyMapper extends TableMapper<Text, Text> {
  public void map(ImmutableBytesWritable row, Result value, Context context) throws InterruptedException, IOException {
    // process data for the row from the Result instance.
   }
}
```
