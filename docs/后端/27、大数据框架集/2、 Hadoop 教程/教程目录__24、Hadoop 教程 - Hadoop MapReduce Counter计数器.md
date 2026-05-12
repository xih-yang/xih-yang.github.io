# 24、Hadoop 教程 - Hadoop MapReduce Counter计数器
- 来源：https://ddkk.com/zhuanlan/bigdata/hadoop/2/24.html
- 分类：大数据框架
- 分组：教程目录
## 1. 计数器概述

在执行 MapReduce 程序的时候，控制台输出信息中通常有下面所示片段内容：

可以发现，输出信息中的核心词是`counters`，中文叫做`计数器`。在进行 MapReduce 运算过程中，许多时候，用户希望了解程序的运行情况。`Hadoop内置的计数器功能收集作业的主要统计信息，可以帮助用户理解程序的运行情况，辅助用户诊断故障`。

这些记录了该程序运行过程的的一些信息的计数，如`Map input records=2`，表示 Map 有 2 条记录。可以看出来这些内置计数器可以被分为若干个组，即对于大多数的计数器来说，Hadoop 使用的组件分为若干类。

## 2. MapReduce内置计数器

Hadoop 为每个 MapReduce 作业维护一些内置的计数器，这些计数器报告各种指标，例如和 MapReduce 程序执行中每个阶段输入输出的数据量相关的计数器，可以帮助用户进行判断程序逻辑是否生效、正确。

Hadoop 内置计数器根据功能进行分组。每个组包括若干个不同的计数器，分别是：MapReduce 任务计数器（`Map-Reduce Framework`）、文件系统计数器（`File System Counters`）、作业计数器（`Job Counters`）、输入文件任务计数器（`File Input Format Counters`）、输出文件计数器（`File Output Format Counters`）。

需要注意的是，内置的计数器都是 MapReduce 程序中`全局的计数器`，跟 MapReduce 分布式运算没有关系，不是所谓的每个局部的统计信息。

### 2.1 Map-Reduce Framework Counters

计数器名称
说明

MAP_INPUT_RECORDS
所有mapper已处理的输入记录数

MAP_OUTPUT_RECORDS
所有mapper产生的输出记录数

MAP_OUTPUT_BYTES
所有mapper产生的未经压缩的输出数据的字节数

MAP_OUTPUT_MATERIALIZED_BYTES
mapper输出后确实写到磁盘上字节数

COMBINE_INPUT_RECORDS
所有combiner(如果有）已处理的输入记录数

COMBINE_OUTPUT_RECORDS
所有combiner（如果有）已产生的输出记录数

REDUCE_INPUT_GROUPS
所有reducer已处理分组的个数

REDUCE_INPUT_RECORDS
所有reducer已经处理的输入记录的个数。每当某个reducer的迭代器读一个值时，该计数器的值增加

REDUCE_OUTPUT_RECORDS
所有reducer输出记录数

REDUCE_SHUFFLE_BYTES
Shuffle时复制到reducer的字节数

SPILLED_RECORDS
所有map和reduce任务溢出到磁盘的记录数

CPU_MILLISECONDS
一个任务的总CPU时间，以毫秒为单位，可由/proc/cpuinfo获取

PHYSICAL_MEMORY_BYTES
一个任务所用的物理内存，以字节数为单位，可由/proc/meminfo获取

VIRTUAL_MEMORY_BYTES
一个任务所用虚拟内存的字节数，由/proc/meminfo获取

### 2.2 File System Counters Counters

文件系统的计数器会针对不同的文件系统使用情况进行统计，比如 HDFS、本地文件系统：

计数器名称
说明

BYTES_READ
程序从文件系统中读取的字节数

BYTES_WRITTEN
程序往文件系统中写入的字节数

READ_OPS
文件系统中进行的读操作的数量（例如，open操作，filestatus操作）

LARGE_READ_OPS
文件系统中进行的大规模读操作的数量

WRITE_OPS
文件系统中进行的写操作的数量（例如，create操作，append操作）

### 2.3 Job Counters

计数器名称
说明

Launched map tasks
启动的map任务数，包括以“推测执行”方式启动的任务

Launched reduce tasks
启动的reduce任务数，包括以“推测执行”方式启动的任务

Data-local map tasks
与输人数据在同一节点上的map任务数

Total time spent by all maps in occupied slots (ms)
所有map任务在占用的插槽中花费的总时间（毫秒）

Total time spent by all reduces in occupied slots (ms)
所有reduce任务在占用的插槽中花费的总时间（毫秒）

Total time spent by all map tasks (ms)
所有map task花费的时间

Total time spent by all reduce tasks (ms)
所有reduce task花费的时间

### 2.4 File Input | Output Format Counters

计数器名称
说明

读取的字节数(BYTES_READ)
由map任务通过FilelnputFormat读取的字节数

写的字节数(BYTES_WRITTEN)
由map任务（针对仅含map的作业）或者reduce任务通过FileOutputFormat写的字节数

## 3. MapReduce自定义计数器

虽然 Hadoop 内置的计数器比较全面，给作业运行过程的监控带了方便，但是对于一些业务中的特定要求（统计过程中对某种情况发生进行计数统计）MapReduce 还是提供了用户编写自定义计数器的方法。最重要的是，`计数器是全局的统计`，避免了用户自己维护全局变量的不利性。

自定义计数器的使用分为两步：

首先通过`context.getCounter`方法获取一个全局计数器，创建的时候需要指定计数器所属的组名和计数器的名字：

然后在程序中需要使用计数器的地方，调用 counter 提供的方法即可，比如 +1 操作：

这样在执行程序的时候，在控制台输出的信息上就有自定义计数器组和计数器统计信息。

## 4. 案例：MapReduce自定义计数器

### 4.1 需求

针对一批文件进行词频统计，不知何种原因，在任意文件的任意地方都有可能插入单词 “apple”，现要求使用计数器统计出数据中 apple 出现的次数，便于用户执行程序时判断。

### 4.2 代码实现

#### 4.2.1 Mapper类

```java
public class WordCountMapper extends Mapper<LongWritable, Text,Text,LongWritable> {
    @Override
    protected void map(LongWritable key, Text value, Context context) throws IOException, InterruptedException {
        //从程序上下文对象获取一个全局计数器：用于统计apple出现的个数
        //需要指定计数器组 和计数器的名字
        Counter counter = context.getCounter("itcast_counters", "apple Counter");
        String[] words = value.toString().split("\\s+");
        for (String word : words) {
            //判断读取内容是否为apple  如果是 计数器加1
            if("apple".equals(word)){
                counter.increment(1);
            }
            context.write(new Text(word),new LongWritable(1));
        }
    }
}
```

#### 4.2.2 Reduce类

```java
public class WordCountReducer extends Reducer<Text, LongWritable,Text,LongWritable> {
    @Override
    protected void reduce(Text key, Iterable<LongWritable> values, Context context) throws IOException, InterruptedException {
        long count = 0;
        for (LongWritable value : values) {
            count +=value.get();
        }
        context.write(key,new LongWritable(count));
    }
}
```

#### 4.2.3 运行主类

```java
public class WordCountDriver extends Configured implements Tool {
    @Override
    public int run(String[] args) throws Exception {
        // 创建作业实例
        Job job = Job.getInstance(getConf(), WordCountDriver.class.getSimpleName());
        // 设置作业驱动类
        job.setJarByClass(this.getClass());
        // 设置作业mapper reducer类
        job.setMapperClass(WordCountMapper.class);
        job.setReducerClass(WordCountReducer.class);
        // 设置作业mapper阶段输出key value数据类型
        job.setMapOutputKeyClass(Text.class);
        job.setMapOutputValueClass(LongWritable.class);
        //设置作业reducer阶段输出key value数据类型 也就是程序最终输出数据类型
        job.setOutputKeyClass(Text.class);
        job.setOutputValueClass(LongWritable.class);
        // 配置作业的输入数据路径
        FileInputFormat.addInputPath(job, new Path(args[0]));
		// 配置作业的输出数据路径
        FileOutputFormat.setOutputPath(job, new Path(args[1]));
        // 提交作业并等待执行完成
        return job.waitForCompletion(true) ? 0 : 1;
    }
    public static void main(String[] args) throws Exception {
        //配置文件对象
        Configuration conf = new Configuration();
        //使用工具类ToolRunner提交程序
        int status = ToolRunner.run(conf, new WordCountDriver(), args);
        //退出客户端程序 客户端退出状态码和MapReduce程序执行结果绑定
        System.exit(status);
    }
}
```

#### 4.2.4 执行结果
