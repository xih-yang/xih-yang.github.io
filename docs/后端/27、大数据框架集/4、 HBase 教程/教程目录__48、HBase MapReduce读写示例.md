# 48、HBase MapReduce读写示例
- 来源：https://ddkk.com/zhuanlan/bigdata/hbase/48.html
- 分类：大数据框架
- 分组：教程目录
## HBase MapReduce读写示例

以下是使用 HBase 作为 MapReduce 的源代码和接收器的示例。这个例子将简单地将数据从一个表复制到另一个表。

```java
Configuration config = HBaseConfiguration.create();
Job job = new Job(config,"ExampleReadWrite");
job.setJarByClass(MyReadWriteJob.class);    // class that contains mapper
Scan scan = new Scan();
scan.setCaching(500);        // 1 is the default in Scan, which will be bad for MapReduce jobs
scan.setCacheBlocks(false);  // don't set to true for MR jobs
// set other scan attrs
TableMapReduceUtil.initTableMapperJob(
  sourceTable,      // input table
  scan,             // Scan instance to control CF and attribute selection
  MyMapper.class,   // mapper class
  null,             // mapper output key
  null,             // mapper output value
  job);
TableMapReduceUtil.initTableReducerJob(
  targetTable,      // output table
  null,             // reducer class
  job);
job.setNumReduceTasks(0);
boolean b = job.waitForCompletion(true);
if (!b) {
    throw new IOException("error with job!");
}
```

需要解释的是 TableMapReduceUtil 正在做什么，特别是对于减速器。TableOutputFormat 被用作 outputFormat 类，并且正在配置几个参数（例如，TableOutputFormat.OUTPUT_TABLE），以及将 reducer 输出键设置为 ImmutableBytesWritable 和 reducer 值为 Writable。这些可以由程序员在作业和 conf 中设置，但 TableMapReduceUtil 试图让事情变得更容易。

以下是示例映射器，它将创建 Put 并匹配输入 Result 并发出它。注意：这是 CopyTable 实用程序的功能。

```java
public static class MyMapper extends TableMapper<ImmutableBytesWritable, Put>  {
  public void map(ImmutableBytesWritable row, Result value, Context context) throws IOException, InterruptedException {
    // this example is just copying the data from the source table...
      context.write(row, resultToPut(row,value));
    }
    private static Put resultToPut(ImmutableBytesWritable key, Result result) throws IOException {
      Put put = new Put(key.get());
      for (KeyValue kv : result.raw()) {
        put.add(kv);
      }
      return put;
    }
}
```

实际上并没有一个简化步骤，所以 TableOutputFormat 负责将 Put 发送到目标表。

这只是一个例子，开发人员可以选择不使用 TableOutputFormat 并连接到目标表本身。
