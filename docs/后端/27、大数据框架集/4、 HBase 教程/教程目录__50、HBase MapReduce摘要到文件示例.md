# 50、HBase MapReduce摘要到文件示例
- 来源：https://ddkk.com/zhuanlan/bigdata/hbase/50.html
- 分类：大数据框架
- 分组：教程目录
## HBase MapReduce摘要到文件示例

这与[HBase MapReduce摘要到HBase示例](https://www.w3cschool.cn/hbase_doc/hbase_doc-xpvw2nv9.html)非常相似，不同之处在于，它将 HBase 用作 MapReduce 源，但将 HDFS 用作接收器。差异在于作业设置和减速器中。映射器保持不变。

```java
Configuration config = HBaseConfiguration.create();
Job job = new Job(config,"ExampleSummaryToFile");
job.setJarByClass(MySummaryFileJob.class);     // class that contains mapper and reducer
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
job.setReducerClass(MyReducer.class);    // reducer class
job.setNumReduceTasks(1);    // at least one, adjust as required
FileOutputFormat.setOutputPath(job, new Path("/tmp/mr/mySummaryFile"));  // adjust directories as required
boolean b = job.waitForCompletion(true);
if (!b) {
  throw new IOException("error with job!");
}
```

如上所述，前面的Mapper可以与此示例保持不变。至于减速机，它是一种“通用”的减速机，而不是扩展的制表机和发射装置。

```java
public static class MyReducer extends Reducer<Text, IntWritable, Text, IntWritable>  {
  public void reduce(Text key, Iterable<IntWritable> values, Context context) throws IOException, InterruptedException {
    int i = 0;
    for (IntWritable val : values) {
      i += val.get();
    }
    context.write(key, new IntWritable(i));
  }
}
```
