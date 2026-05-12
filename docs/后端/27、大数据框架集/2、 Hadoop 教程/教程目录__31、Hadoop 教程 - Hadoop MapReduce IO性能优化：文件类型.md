# 31、Hadoop 教程 - Hadoop MapReduce IO性能优化：文件类型
- 来源：https://ddkk.com/zhuanlan/bigdata/hadoop/2/31.html
- 分类：大数据框架
- 分组：教程目录
## 1. 优化方案

- 针对 HDFS 最初是为访问大文件而开发的，所以会出现对大量小文件的存储效率不高问题，MapReduce 在读取小文件进行处理时，也存在资源浪费导致计算效率不高的问题采用 SequenceFile 和 MapFile 设计一个 HDFS 中合并存储小文件的方案。该方案的主要思想是将小文件序列化存入一个 SequenceFIle/MapFile 容器，合并成大文件, 并建立相应的索引文件, 有效降低文件数目和提高访问效率。通过和现有的 Hadoop Archives（HAR files）文件归档解决小文件问题的方案对比，实验结果表明，基于 SequenceFile 或者 MapFile 的存储小文件方案可以更为有效的提高小文件存储性能和减少 HDFS 文件系统的节点内存消耗；
- 针对普通按行存储文本文件，MapReduce 在处理实现聚合、过滤等功能时，性能相对较差，针对行式存储的数据处理性能差的问题，可以选择使用列式存储的方案来实现数据聚合处理，降低数据传输及读写的 IO，提高整体 MapReduce 计算处理的性能；

## 2. SequenceFile

### 2.1 介绍

SequenceFile 是 hadoop 里用来存储序列化的键值对即二进制的一种文件格式。SequenceFile 文件也可以作为 MapReduce 作业的输入和输出，hive 和 spark 也支持这种格式。

它有如下几个优点：

- 以二进制的 KV 形式存储数据，与底层交互更加友好，性能更快，所以可以在 HDFS 里存储图像或者更加复杂的结构作为 KV 对。
- SequenceFile 支持压缩和分片。当你压缩为一个 SequenceFile 时，并不是将整个文件压缩成一个单独的单元，而是压缩文件里的 record 或者 block of records（块）。因此 SequenceFile 是能够支持分片的，即使使用的压缩方式如 Snappy, Lz4 or Gzip 不支持分片，也可以利用 SequenceFIle 来实现分片。
- SequenceFile 也可以用于存储多个小文件。由于 Hadoop 本身就是用来处理大型文件的，小文件是不适合的，所以用一个 SequenceFile 来存储很多小文件就可以提高处理效率，也能节省 Namenode 内存，因为 Namenode 只需一个 SequenceFile 的 metadata，而不是为每个小文件创建单独的 metadata。
- 由于数据是以 SequenceFile 形式存储，所以中间输出文件即 map 输出也会用 SequenceFile 来存储，可以提高整体的 IO 开销性能。

### 2.2 存储特点

- sequenceFile 文件是 Hadoop 用来存储二进制形式的 [Key,Value] 对而设计的一种平面文件（Flat File）。
- 可以把 SequenceFile 当做是一个容器，把所有的文件打包到 SequenceFile 类中可以高效的对小文件进行存储和处理。
- SequenceFile 文件并不按照其存储的 Key 进行排序存储，SequenceFile 的内部类 Writer 提供了 append 功能。
- SequenceFile 中的 Key 和 Value 可以是任意类型 Writable 或者是自定义 Writable。
- 存储结构上，SequenceFile 主要由一个 Header 后跟多条 Record 组成，Header 主要包含了 Key classname，value classname，存储压缩算法，用户自定义元数据等信息，此外，还包含了一些同步标识，用于快速定位到记录的边界。每条 Record 以键值对的方式进行存储，用来表示它的字符数组可以一次解析成：记录的长度、Key 的长度、Key 值和 value 值，并且 Value 值的结构取决于该记录是否被压缩。
- 在 recourds 中，又分为是否压缩格式。当没有被压缩时，key 与 value 使用 Serialization 序列化写入 SequenceFile。当选择压缩格式时，record 的压缩格式与没有压缩其实不尽相同，除了 value 的 bytes 被压缩，key 是不被压缩的。
- 在 Block 中，它使所有的信息进行压缩，压缩的最小大小由配置文件中io.seqfile.compress.blocksize配置项决定。

### 2.3 SequenceFile工具类

- SequenceFileOutputFormat

用于将 MapReduce 的结果输出为 SequenceFile 文件
- SequenceFileInputFormat

用于读取SequenceFile文件

### 2.4 生成SequenceFile

- **需求：** 将普通文件转换为 SequenceFile 文件
- **思路：**
- Step1：使用 TextInputFormat 读取普通文件文件；
- Step2：Map 阶段对读取文件的每一行进行输出；
- Step3：Reduce 阶段直接输出每条数据；
- Step4：使用 SequenceFileOutputFormat 将结果保存为 SequenceFile；
- **代码实现：**

`Driver类`

```java
public class MrWriteToSequenceFile extends Configured implements Tool {
    //构建、配置、提交一个 MapReduce的Job
    public int run(String[] args) throws Exception {
        // 实例化作业
        Job job = Job.getInstance(this.getConf(), "MrWriteToSequenceFile");
        // 设置作业的主程序
        job.setJarByClass(this.getClass());
        // 设置作业的输入为TextInputFormat（普通文本）
        job.setInputFormatClass(TextInputFormat.class);
        // 设置作业的输入路径
        FileInputFormat.addInputPath(job, new Path(args[0]));
        // 设置Map端的实现类
        job.setMapperClass(WriteSeqFileAppMapper.class);
        // 设置Map端输入的Key类型
        job.setMapOutputKeyClass(NullWritable.class);
        // 设置Map端输入的Value类型
        job.setMapOutputValueClass(Text.class);
        // 设置作业的输出为SequenceFileOutputFormat
        job.setOutputFormatClass(SequenceFileOutputFormat.class);
        // 使用SequenceFile的块级别压缩
        SequenceFileOutputFormat.setOutputCompressionType(job, SequenceFile.CompressionType.BLOCK);
        // 设置Reduce端的实现类
        job.setReducerClass(WriteSeqFileAppReducer.class);
        // 设置Reduce端输出的Key类型
        job.setOutputKeyClass(NullWritable.class);
        // 设置Reduce端输出的Value类型
        job.setOutputValueClass(Text.class);
        // 从参数中获取输出路径
        Path outputDir = new Path(args[1]);
        // 如果输出路径已存在则删除
        outputDir.getFileSystem(this.getConf()).delete(outputDir, true);
        // 设置作业的输出路径
        FileOutputFormat.setOutputPath(job, outputDir);
		// 提交作业并等待执行完成
        return job.waitForCompletion(true) ? 0 : 1;
    }
    //程序入口，调用run
    public static void main(String[] args) throws Exception {
        //用于管理当前程序的所有配置
        Configuration conf = new Configuration();
        int status = ToolRunner.run(conf, new MrWriteToSequenceFile(), args);
        System.exit(status);
    }
}
```

`Mapper类`

```java
/**
 * 定义Mapper类
 */
public static class WriteSeqFileAppMapper extends Mapper<LongWritable, Text,NullWritable, Text>{
    private NullWritable outputKey;
    @Override
    protected void setup(Context context) throws IOException, InterruptedException {
        this.outputKey = NullWritable.get();
    }
    @Override
    protected void map(LongWritable key, Text value, Context context) throws IOException, InterruptedException {
        context.write(outputKey, value);
    }
    @Override
    protected void cleanup(Context context) throws IOException, InterruptedException {
        this.outputKey = null;
    }
}
```

`Reduce类`

```java
/**
 * 定义Reduce类
 */
public static class WriteSeqFileAppReducer extends Reducer<NullWritable,Text,NullWritable,Text>{
    private NullWritable outputKey;
    @Override
    protected void setup(Context context) throws IOException, InterruptedException {
        this.outputKey = NullWritable.get();
    }
    @Override
    protected void reduce(NullWritable key, Iterable<Text> value, Context context) throws IOException, InterruptedException {
        Iterator<Text> iterator = value.iterator();
        while (iterator.hasNext()) {
            context.write(outputKey, iterator.next());
        }
    }
    @Override
    protected void cleanup(Context context) throws IOException, InterruptedException {
        this.outputKey = null;
    }
}
```

- **查看结果**
- SequenceFile 为二进制文件，不可以直接查看结果，会显示为乱码，可以通过 MapReduce 读取解析为普通文本

### 2.5 读取SequenceFile

- **需求：** 将上一步转换好的 SequenceFile 再解析转换为普通文本文件内容；
- **思路：**
- Step1：使用 SequenceFileInputformat 读取 SequenceFile；
- Step2：Map 阶段直接输出每一条数据；
- Step3：Reduce 阶段直接输出每一条数据；
- Step4：使用 TextOutputFormat 将结果保存为普通文本文件；
- **代码实现：**

`Driver类`

```java
public class MrReadFromSequenceFile extends Configured implements Tool {
    //构建、配置、提交一个 MapReduce的Job
    public int run(String[] args) throws Exception {
        // 实例化作业
        Job job = Job.getInstance(this.getConf(), "MrReadFromSequenceFile");
        // 设置作业的主程序
        job.setJarByClass(this.getClass());
        // 设置作业的输入为SequenceFileInputFormat（SequenceFile文本）
        job.setInputFormatClass(SequenceFileInputFormat.class);
        // 设置作业的输入路径
        SequenceFileInputFormat.addInputPath(job, new Path(args[0]));
        // 设置Map端的实现类
        job.setMapperClass(ReadSeqFileAppMapper.class);
        // 设置Map端输入的Key类型
        job.setMapOutputKeyClass(NullWritable.class);
        // 设置Map端输入的Value类型
        job.setMapOutputValueClass(Text.class);
        // 设置作业的输出为TextOutputFormat
        job.setOutputFormatClass(TextOutputFormat.class);
        // 设置Reduce端的实现类
        job.setReducerClass(ReadSeqFileAppReducer.class);
        // 设置Reduce端输出的Key类型
        job.setOutputKeyClass(NullWritable.class);
        // 设置Reduce端输出的Value类型
        job.setOutputValueClass(Text.class);
        // 从参数中获取输出路径
        Path outputDir = new Path(args[1]);
        // 如果输出路径已存在则删除
        outputDir.getFileSystem(this.getConf()).delete(outputDir, true);
        // 设置作业的输出路径
		TextOutputFormat.setOutputPath(job, outputDir);
        // 提交作业并等待执行完成
        return job.waitForCompletion(true) ? 0 : 1;
    }
    //程序入口，调用run
    public static void main(String[] args) throws Exception {
        //用于管理当前程序的所有配置
        Configuration conf = new Configuration();
        int status = ToolRunner.run(conf, new MrReadFromSequenceFile(), args);
        System.exit(status);
    }
}
```

`Mapper类`

```java
/**
 * 定义Mapper类
 */
public static class ReadSeqFileAppMapper extends Mapper<NullWritable, Text, NullWritable, Text> {
    private NullWritable outputKey;
    @Override
    protected void setup(Context context) throws IOException, InterruptedException {
        this.outputKey = NullWritable.get();
    }
    @Override
    protected void map(NullWritable key, Text value, Context context) throws IOException, InterruptedException {
        context.write(outputKey, value);
    }
    @Override
    protected void cleanup(Context context) throws IOException, InterruptedException {
		this.outputKey = null;
    }
}
```

`Reduce类`

```java
/**
 * 定义Reduce类
 */
public static class ReadSeqFileAppReducer extends Reducer<NullWritable,Text,NullWritable,Text>{
    private NullWritable outputKey;
    @Override
    protected void setup(Context context) throws IOException, InterruptedException {
        this.outputKey = NullWritable.get();
    }
    @Override
    protected void reduce(NullWritable key, Iterable<Text> value, Context context) throws IOException, InterruptedException {
        Iterator<Text> iterator = value.iterator();
        while (iterator.hasNext()) {
            context.write(outputKey, iterator.next());
        }
    }
    @Override
    protected void cleanup(Context context) throws IOException, InterruptedException {
        this.outputKey = null;
    }
}
```

- **查看结果**
- 数据被还原为普通文本文件

## 3. MapFile

### 3.1 介绍

可以理解 MapFile 是排序后的 SequenceFile，通过观察其结构可以看到 MapFile 由两部分组成分别是 data 和 index。data 既存储数据的文件，index 作为文件的数据索引，主要记录了每个 Record 的 Key 值，以及该 Record 在文件中的偏移位置。在 MapFile 被访问的时候，索引文件会被加载到内存，通过索引映射关系可以迅速定位到指定 Record 所在文件位置，因此，相对 SequenceFile 而言，MapFile 的检索效率是最高的，缺点是会消耗一部分内存来存储 index 数据。

MapFile 的数据存储结构如下：

需要注意的是，MapFile 并不不会把所有的 Record 都记录到 index 中去，默认情况下每隔 128 条记录会存储一个索引映射。当然，记录间隔可认为修改，通过`MapFile.Writer的setIndexInterval()`方法，或修改`io.map.index.interval`属性。

并且与 SequenceFile 不同的是，MapFile 的 KeyClass 一定要实现 WritableComparable 接口，即 Key 值是可比较的，最终实现基于 Key 的有序。

为了验证 MapFile 的效果，经过对小文件的对比测试，可以看出本文的改进小文件存储策略在文件上传时的效率与未经改进没什么差别，但是在经过基于 MapFile 序列化的将小文件合并成大文件后, 在文件读取方面，比未经改进和经 HAR 合并的环境下效率都高，而且在 HDFS 空闲时，合并过后的内存占用率明显下降，这就减轻了 Namenode 名称节点的负担，提高内存使用率。

### 3.2 MapFile工具类

- MapFileOutputFormat：用于将 MapReduce 的结果输出为 MapFile；
- MapReduce 中没有封装 MapFile 的读取输入类，工作中可根据情况选择以下方案来实现
- 方案一：自定义 InputFormat，使用 MapFileOutputFormat 中的 getReader 方法获取读取对象
- 方案二：使用 SequenceFileInputFormat 对 MapFile 的数据进行解析

### 3.3 生成MapFile文件

- **需求：** 将普通文件转换为MapFile文件
- **思路：**
- Step1：Input 读取一个普通文件
- Step2：Map 阶段构建随机值作为 Key，构建有序
- Step3：Output 生成 MapFile 文件
- **实现：**
- 开发代码

```java
public class MrWriteToMapFile extends Configured implements Tool {
    //构建、配置、提交一个 MapReduce的Job
    public int run(String[] args) throws Exception {
        Configuration conf = getConf();
        // 实例化作业
        Job job = Job.getInstance(conf, "MrWriteToMapFile");
        // 设置作业的主程序
        job.setJarByClass(this.getClass());
        // 设置作业的输入为TextInputFormat（普通文本）
        job.setInputFormatClass(TextInputFormat.class);
        // 设置作业的输入路径
        FileInputFormat.addInputPath(job, new Path(args[0]));
        // 设置Map端的实现类
        job.setMapperClass(WriteMapFileAppMapper.class);
        // 设置Map端输入的Key类型
        job.setMapOutputKeyClass(IntWritable.class);
        // 设置Map端输入的Value类型
        job.setMapOutputValueClass(Text.class);
        // 设置作业的输出为MapFileOutputFormat
		job.setOutputFormatClass(MapFileOutputFormat.class);
        // 设置Reduce端的实现类
        job.setReducerClass(WriteMapFileAppReducer.class);
        // 设置Reduce端输出的Key类型
        job.setOutputKeyClass(IntWritable.class);
        // 设置Reduce端输出的Value类型
        job.setOutputValueClass(Text.class);
        // 从参数中获取输出路径
        Path outputDir = new Path(args[1]);
        // 如果输出路径已存在则删除
        outputDir.getFileSystem(conf).delete(outputDir, true);
        // 设置作业的输出路径
        MapFileOutputFormat.setOutputPath(job, outputDir);
        // 提交作业并等待执行完成
        return job.waitForCompletion(true) ? 0 : 1;
    }
    //程序入口，调用run
    public static void main(String[] args) throws Exception {
        //用于管理当前程序的所有配置
        Configuration conf = new Configuration();
        int status = ToolRunner.run(conf, new MrWriteToMapFile(), args);
        System.exit(status);
    }
    /**
     * 定义Mapper类
     */
    public static class WriteMapFileAppMapper extends Mapper<LongWritable, Text, IntWritable, Text>{
        //定义输出的Key,每次随机生成一个值
        private IntWritable outputKey = new IntWritable();
        @Override
        protected void map(LongWritable key, Text value, Context context) throws IOException, InterruptedException {
            //随机生成一个数值
            Random random = new Random();
            this.outputKey.set(random.nextInt(100000));
            context.write(outputKey, value);
        }
	}
    /**
     * 定义Reduce类
     */
    public static class WriteMapFileAppReducer extends Reducer<IntWritable,Text,IntWritable,Text>{
        @Override
        protected void reduce(IntWritable key, Iterable<Text> value, Context context) throws IOException, InterruptedException {
            Iterator<Text> iterator = value.iterator();
            while (iterator.hasNext()) {
                context.write(key, iterator.next());
            }
        }
    }
}
```

- 打成 jar 包，提交运行

```java
yarn jar mapfile.jar com.mapreduce.test.MrWriteToMapFile /datas/input/mapfile/ /datas/output/mapfile1
```

- 查看结果

### 3.4 读取MapFile文件

- **需求：** 将MapFile解析为普通文件内容
- **思路：**
- Step1：Input 读取 MapFile，注意，Hadoop 没有提供 MapFileInputFormat，所以使用 SequenceFileInputFormat 来解析，或者可以自定义 InputFormat；
- Step2：Map 和 Reduce 直接输出；
- Step3：Output 将结果保存为普通文件；
- **实现：**
- 开发代码

```java
public class MrReadFromMapFile extends Configured implements Tool {
    //构建、配置、提交一个 MapReduce的Job
    public int run(String[] args) throws Exception {
        // 实例化作业
        Job job = Job.getInstance(this.getConf(), "MrReadFromMapFile");
        // 设置作业的主程序
        job.setJarByClass(this.getClass());
        // 设置作业的输入为SequenceFileInputFormat（Hadoop没有直接提供MapFileInput）
        job.setInputFormatClass(SequenceFileInputFormat.class);
        // 设置作业的输入路径
        SequenceFileInputFormat.addInputPath(job, new Path(args[0]));
        // 设置Map端的实现类
        job.setMapperClass(ReadMapFileAppMapper.class);
        // 设置Map端输入的Key类型
        job.setMapOutputKeyClass(NullWritable.class);
        // 设置Map端输入的Value类型
        job.setMapOutputValueClass(Text.class);
        // 设置作业的输出为SequenceFileOutputFormat
        job.setOutputFormatClass(TextOutputFormat.class);
        // 设置Reduce端的实现类
        job.setReducerClass(ReadMapFileAppReducer.class);
        // 设置Reduce端输出的Key类型
		job.setOutputKeyClass(NullWritable.class);
        // 设置Reduce端输出的Value类型
        job.setOutputValueClass(Text.class);
        // 从参数中获取输出路径
        Path outputDir = new Path(args[1]);
        // 如果输出路径已存在则删除
        outputDir.getFileSystem(this.getConf()).delete(outputDir, true);
        // 设置作业的输出路径
        TextOutputFormat.setOutputPath(job, outputDir);
        // 提交作业并等待执行完成
        return job.waitForCompletion(true) ? 0 : 1;
    }
    //程序入口，调用run
    public static void main(String[] args) throws Exception {
        //用于管理当前程序的所有配置
        Configuration conf = new Configuration();
        int status = ToolRunner.run(conf, new MrReadFromMapFile(), args);
        System.exit(status);
    }
    /**
     * 定义Mapper类
     */
    public static class ReadMapFileAppMapper extends Mapper<IntWritable, Text, NullWritable, Text> {
        private NullWritable outputKey = NullWritable.get();
        @Override
        protected void map(IntWritable key, Text value, Context context) throws IOException, InterruptedException {
            context.write(outputKey, value);
        }
    }
    /**
     * 定义Reduce类
	*/
    public static class ReadMapFileAppReducer extends Reducer<NullWritable,Text,NullWritable,Text>{
        @Override
        protected void reduce(NullWritable key, Iterable<Text> value, Context context) throws IOException, InterruptedException {
            Iterator<Text> iterator = value.iterator();
            while (iterator.hasNext()) {
                context.write(key, iterator.next());
            }
        }
    }
}
```

- 打成 jar 包，提交运行

```java
yarn jar mapfile.jar com.mapreduce.test.MrReadFromMapFile /datas/output/mapfile1 /datas/output/mapfile2
```

- 查看结果

## 4. ORCFile

### 4.1 列式存储

行存储和列存储，是数据库底层组织数据的方式。我们平常生活中或者工作中接触了很多数据的存储系统，但是大部分都是`行存储系统`。比如我们学习的数据库管理系统，我们将数据库中的表想象成一张表格，每条数据记录就是一行数据，每行数据包含若干列。所以我们对大部分数据存储的思维也就是一个复杂一点的表格管理系统。我们在一行一行地写入数据，然后按查询条件查询过滤出我们想要的行记录。大部分传统的 RDBMS（关系型数据库），都是面向行来组织数据的，比如 MySQL，Oracle、PostgreSQL。

传统`OLTP（Online Transaction Processing）`数据库通常采用行式存储。以下图为例，所有的列依次排列构成一行，以行为单位存储，再配合以 B+ 树或 SS-Table 作为索引，就能快速通过主键找到相应的行数据。

行存储将会以上方式将数据存储在磁盘上。它利于数据一行一行的写入，写入一条数据记录时，只需要将数据追加到已有数据记录后面即可。

行模式存储适合 OLTP（Online Transaction Processing）系统。因为数据`基于行存储，所以数据的写入会更快，对按行查询数据也更简单`。

我们常见的数据存储都是行式存储，那为什么我们要学习列式存储呢？

因为我们现在学习的数据处理，大数据，数据分析，也就是`OLAP（Online Analytical Processing）`在线分析系统的需求增多了，数据写入的事务和按记录查询数据都不是它的关注点，它`关注的是数据过滤，统计聚合`，例如统计数据中的行数、平均值、最大值、最小值等。

`列式存储（Column-oriented Storage）`并不是一项新技术，最早可以追溯到 1983 年的论文 Cantor。然而，受限于早期的硬件条件和使用场景，主流的事务型数据库（OLTP）大多采用行式存储，直到近几年分析型数据库（OLAP）的兴起，列式存储这一概念又变得流行。

对于 OLAP 场景，一个典型的查询需要遍历整个表，进行分组、排序、聚合等操作，这样一来按行存储的优势就不复存在了。分析型 SQL 常常不会用到所有的列，而`仅仅对其中某些感兴趣的列做运算`，那一行中那些无关的列也不得不参与扫描。而使用了列式存储，可以只扫描我们需要的列，`不需要将无关的列进行扫描，减少不必要的IO及磁盘检索消耗，提升读的性能`。

列式存储就是为这样的需求设计的。如下图所示，同一列的数据被一个接一个紧挨着存放在一起，表的每列构成一个长数组。

- 列式存储的优点：
- **自动索引**

因为基于列存储，所以每一列本身就相当于索引。所以在做一些需要索引的操作时，就不需要额外的数据结构来为此列创建合适的索引。

**利于数据压缩**

- 相同的列数据类型一致，这样利于数据结构填充的优化和压缩，而且对于数字列这种数据类型可以采取更多有利的算法去压缩存储。
- `总的来说，列式存储的优势一方面体现在存储上能节约空间、减少 IO，另一方面依靠列式数据结构做了计算上的优化。`下面是行式存储与列式存储对比：

行式存储
行式存储
列式存储

特点
会扫描不需要的数据列
只读取需要的数据列

场景
适合于按记录读写数据的场景，不适合聚合统计的场景
适合于数据过滤、聚合统计的场景，不适合按记录一个一个读写场景

应用
OLTP
OLAP

压缩
不利于压缩数据
适合压缩数据

### 4.2 ORC介绍

`ORC（OptimizedRC File）`文件格式是一种 Hadoop 生态圈中的列式存储格式，源自于 RC（RecordColumnar File），它的产生早在 2013 年初，最初产生自 Apache Hive，用于降低 Hadoop 数据存储空间和加速 Hive 查询速度。它并不是一个单纯的列式存储格式，仍然是首先根据行组分割整个表，在每一个行组内进行`按列存储`。ORC 文件是自描述的，它的元数据使用 Protocol Buffers 序列化，并且文件中的数据尽可能的压缩以降低存储空间的消耗，目前也被 Spark SQL、Presto 等查询引擎支持。2015 年 ORC 项目被 Apache 项目基金会提升为 Apache 顶级项目。

ORC 文件基本存储结构：

ORC 官方明细结构图：

ORC 文件也是以二进制方式存储的，所以是不可以直接读取，ORC 文件也是自解析的，它包含许多的元数据，这些元数据都是同构 ProtoBuffer 进行序列化的。其中涉及到如下的概念：

**ORC 文件：** 保存在文件系统上的普通二进制文件，一个 ORC 文件中可以包含多个 stripe，每一个 stripe 包含多条记录，这些记录按照列进行独立存储，对应到 Parquet 中的 row group 的概念。

**文件级元数据：** 包括文件的描述信息 PostScript、文件 meta 信息（包括整个文件的统计信息）、所有 stripe 的信息和文件 schema 信息。

**stripe：** 一组行形成一个 stripe，每次读取文件是以行组为单位的，一般为 HDFS 的块大小，保存了每一列的索引和数据。

**stripe 元数据：** 保存 stripe 的位置、每一个列的在该 stripe 的统计信息以及所有的 stream 类型和位置。

**row group：** 索引的最小单位，一个 stripe 中包含多个 row group，默认为 10000 个值组成。

**stream：** 一个 stream 表示文件中一段有效的数据，包括索引和数据两类。索引 stream 保存每一个 row group 的位置和统计信息，数据 stream 包括多种类型的数据，具体需要哪几种是由该列类型和编码方式决定。

ORC 文件中保存了三个层级的统计信息，分别为`文件级别`、`stripe级别`和`row group级别`的，他们都可以用来根据 Search ARGuments（谓词下推条件）判断是否可以跳过某些数据，在统计信息中都包含成员数和是否有 null 值，并且对于不同类型的数据设置一些特定的统计信息。

- 性能测试：
- 原始 Text 格式，未压缩 : 38.1 G
- ORC 格式，默认压缩（ZLIB）: 11.5 G
- Parquet 格式，默认压缩（Snappy）：14.8 G
- 测试对比：复杂数据 Join 关联测试

### 4.3 ORCFile工具类

- 添加 ORC 与 MapReduce 集成的 Maven 依赖

```java
<DEPENDENCY>
    <GROUPID>ORG.APACHE.ORC</GROUPID>
    <ARTIFACTID>ORC-MAPREDUCE</ARTIFACTID>
    <VERSION>1.6.3</VERSION>
</DEPENDENCY>
```

- OrcOutputFormat：用于将结果写入 ORC 文件
- OrcInputFormat：用于实现读取 ORC 文件类型

### 4.4 生成ORC文件

- **需求：** 将普通文件转换为 ORC 文件
- **思路：**
- Step1：Input 阶段读取普通文件
- Step2：Map 阶段直接输出数据，没有 Reduce 阶段
- Step3：Output 阶段使用 OrcOutputFormat 保存为 ORC 文件类型
- **实现：**
- 开发代码

```java
public class WriteOrcFileApp extends Configured implements Tool {
    // 作业名称
    private static final String JOB_NAME = WriteOrcFileApp.class.getSimpleName();
    //构建日志监听
    private static final Logger LOG = LoggerFactory.getLogger(WriteOrcFileApp.class);
    //定义数据的字段信息
    private static final String SCHEMA = "struct<id:string,type:string,orderID:string,bankCard:string,cardType:string,ctime:string,utime:string,remark:string>";
    /**
     * 重写Tool接口的run方法，用于提交作业
     * @param args
     * @return
     * @throws Exception
     */
    public int run(String[] args) throws Exception {
        // 设置Schema
        OrcConf.MAPRED_OUTPUT_SCHEMA.setString(this.getConf(), SCHEMA);
        // 实例化作业
        Job job = Job.getInstance(this.getConf(), JOB_NAME);
        // 设置作业的主程序
        job.setJarByClass(WriteOrcFileApp.class);
        // 设置作业的Mapper类
        job.setMapperClass(WriteOrcFileAppMapper.class);
        // 设置作业的输入为TextInputFormat（普通文本）
        job.setInputFormatClass(TextInputFormat.class);
        // 设置作业的输出为OrcOutputFormat
        job.setOutputFormatClass(OrcOutputFormat.class);
		// 设置作业使用0个Reduce（直接从map端输出）
        job.setNumReduceTasks(0);
        // 设置作业的输入路径
        FileInputFormat.addInputPath(job, new Path(args[0]));
        // 从参数中获取输出路径
        Path outputDir = new Path(args[1]);
        // 如果输出路径已存在则删除
        outputDir.getFileSystem(this.getConf()).delete(outputDir, true);
        // 设置作业的输出路径
        OrcOutputFormat.setOutputPath(job, outputDir);
        // 提交作业并等待执行完成
        return job.waitForCompletion(true) ? 0 : 1;
    }
    //程序入口，调用run
    public static void main(String[] args) throws Exception {
        //用于管理当前程序的所有配置
        Configuration conf = new Configuration();
        int status = ToolRunner.run(conf, new WriteOrcFileApp(), args);
        System.exit(status);
    }
    /**
     * 实现Mapper类
     */
    public static class WriteOrcFileAppMapper extends Mapper<LongWritable, Text, NullWritable, OrcStruct> {
        //获取字段描述信息
        private TypeDescription schema = TypeDescription.fromString(SCHEMA);
        //构建输出的Key
        private final NullWritable outputKey = NullWritable.get();
        //构建输出的Value为ORCStruct类型
        private final OrcStruct outputValue = (OrcStruct) OrcStruct.createValue(schema);
        public void map(LongWritable key, Text value, Context output) throws IOException, InterruptedException {
            //将读取到的每一行数据进行分割，得到所有字段
            String[] fields = value.toString().split(",",8);
            //将所有字段赋值给Value中的列
            outputValue.setFieldValue(0, new Text(fields[0]));
			outputValue.setFieldValue(1, new Text(fields[1]));
            outputValue.setFieldValue(2, new Text(fields[2]));
            outputValue.setFieldValue(3, new Text(fields[3]));
            outputValue.setFieldValue(4, new Text(fields[4]));
            outputValue.setFieldValue(5, new Text(fields[5]));
            outputValue.setFieldValue(6, new Text(fields[6]));
            outputValue.setFieldValue(7, new Text(fields[7]));
            //输出KeyValue
            output.write(outputKey, outputValue);
        }
    }
}
```

- 提交 yarn 运行

```java
yarn jar orcTest.jar com.mapreduce.test.WriteOrcFileApp /datas/input/orc /datas/output/orc
```

- 查看结果

### 4.5 读取ORC文件

- **需求：** 读取 ORC 文件，还原成普通文本文件
- **思路：**
- Step1：Input 阶段读取上一步当中生成的 ORC 文件
- Step2：Map 阶段直接读取输出
- Step3：Output 阶段将结果保存为普通文本文件
- **实现：**
- 开发代码

```java
public class ReadOrcFileApp extends Configured implements Tool {
    // 作业名称
    private static final String JOB_NAME = WriteOrcFileApp.class.getSimpleName();
    /**
     * 重写Tool接口的run方法，用于提交作业
     * @param args
     * @return
     * @throws Exception
     */
    public int run(String[] args) throws Exception {
		// 实例化作业
        Job job = Job.getInstance(this.getConf(), JOB_NAME);
        // 设置作业的主程序
        job.setJarByClass(ReadOrcFileApp.class);
        // 设置作业的输入为OrcInputFormat
        job.setInputFormatClass(OrcInputFormat.class);
        // 设置作业的输入路径
        OrcInputFormat.addInputPath(job, new Path(args[0]));
        // 设置作业的Mapper类
        job.setMapperClass(ReadOrcFileAppMapper.class);
        // 设置作业使用0个Reduce（直接从map端输出）
        job.setNumReduceTasks(0);
        // 设置作业的输入为TextOutputFormat
        job.setOutputFormatClass(TextOutputFormat.class);
        // 从参数中获取输出路径
        Path outputDir = new Path(args[1]);
        // 如果输出路径已存在则删除
        outputDir.getFileSystem(this.getConf()).delete(outputDir, true);
        // 设置作业的输出路径
        FileOutputFormat.setOutputPath(job, outputDir);
        // 提交作业并等待执行完成
        return job.waitForCompletion(true) ? 0 : 1;
    }
    //程序入口，调用run
    public static void main(String[] args) throws Exception {
        //用于管理当前程序的所有配置
        Configuration conf = new Configuration();
        int status = ToolRunner.run(conf, new ReadOrcFileApp(), args);
        System.exit(status);
    }
    /**
     * 实现Mapper类
     */
    public static class ReadOrcFileAppMapper extends Mapper<NullWritable, OrcStruct, NullWritable, Text> {
        private NullWritable outputKey;
        private Text outputValue;
        @Override
		protected void setup(Context context) throws IOException, InterruptedException {
            outputKey = NullWritable.get();
            outputValue = new Text();
        }
        public void map(NullWritable key, OrcStruct value, Context output) throws IOException, InterruptedException {
            //将ORC中的每条数据转换为Text对象
            this.outputValue.set(
                    value.getFieldValue(0).toString()+","+
                            value.getFieldValue(1).toString()+","+
                            value.getFieldValue(2).toString()+","+
                            value.getFieldValue(3).toString()+","+
                            value.getFieldValue(4).toString()+","+
                            value.getFieldValue(5).toString()+","+
                            value.getFieldValue(6).toString()+","+
                            value.getFieldValue(7).toString()
            );
            //输出结果
            output.write(outputKey, outputValue);
        }
    }
}
```

- 打成 jar 包，提交运行

```java
yarn jar orcTest.jar com.mapreduce.test.ReadOrcFileApp /datas/output/orc /datas/output/orc-text
```

- 查看结果
