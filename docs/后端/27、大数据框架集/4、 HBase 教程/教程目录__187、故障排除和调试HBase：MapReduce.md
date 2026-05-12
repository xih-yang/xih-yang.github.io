# 187、故障排除和调试HBase：MapReduce
- 来源：https://ddkk.com/zhuanlan/bigdata/hbase/187.html
- 分类：大数据框架
- 分组：教程目录
## MapReduce

### 你认为你在群集中，但你实际上是本地的

以下堆栈跟踪发生在使用ImportTsv的时候，但是这样的事情可能发生在配置错误的任何作业上。

```java
    WARN mapred.LocalJobRunner: job_local_0001
java.lang.IllegalArgumentException: Can't read partitions file
       at org.apache.hadoop.hbase.mapreduce.hadoopbackport.TotalOrderPartitioner.setConf(TotalOrderPartitioner.java:111)
       at org.apache.hadoop.util.ReflectionUtils.setConf(ReflectionUtils.java:62)
       at org.apache.hadoop.util.ReflectionUtils.newInstance(ReflectionUtils.java:117)
       at org.apache.hadoop.mapred.MapTask$NewOutputCollector.<init>(MapTask.java:560)
       at org.apache.hadoop.mapred.MapTask.runNewMapper(MapTask.java:639)
       at org.apache.hadoop.mapred.MapTask.run(MapTask.java:323)
       at org.apache.hadoop.mapred.LocalJobRunner$Job.run(LocalJobRunner.java:210)
Caused by: java.io.FileNotFoundException: File _partition.lst does not exist.
       at org.apache.hadoop.fs.RawLocalFileSystem.getFileStatus(RawLocalFileSystem.java:383)
       at org.apache.hadoop.fs.FilterFileSystem.getFileStatus(FilterFileSystem.java:251)
       at org.apache.hadoop.fs.FileSystem.getLength(FileSystem.java:776)
       at org.apache.hadoop.io.SequenceFile$Reader.<init>(SequenceFile.java:1424)
       at org.apache.hadoop.io.SequenceFile$Reader.<init>(SequenceFile.java:1419)
       at org.apache.hadoop.hbase.mapreduce.hadoopbackport.TotalOrderPartitioner.readPartitions(TotalOrderPartitioner.java:296)
```

…看到堆栈的关键部分了吗？如下：

```java
at org.apache.hadoop.mapred.LocalJobRunner$Job.run(LocalJobRunner.java:210)
```

LocalJobRunner表示作业在本地运行，而不是在群集上运行。

要解决此问题，您应该使用您的HADOOP_CLASSPATH集合运行MR作业以包含HBase依赖项。“hbase classpath”实用程序可用于轻松完成此操作。例如（用您的HBase版本替换VERSION）：

```java
HADOOP_CLASSPATH=hbase classpath hadoop jar $HBASE_HOME/hbase-mapreduce-VERSION.jar rowcounter usertable
```

有关HBase MapReduce作业和类路径的更多信息，请参阅[HBase，MapReduce和CLASSPATH](https://www.w3cschool.cn/hbase_doc/hbase_doc-a64w2ncg.html)。
