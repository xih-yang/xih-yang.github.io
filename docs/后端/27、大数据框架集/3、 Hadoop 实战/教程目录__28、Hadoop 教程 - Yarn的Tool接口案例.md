# 28、Hadoop 教程 - Yarn的Tool接口案例
- 来源：https://ddkk.com/zhuanlan/bigdata/hadoop/3/28.html
- 分类：大数据框架
- 分组：教程目录
## 1. 需求

使用如下命令执行官方的WordCount案例：

```java
hadoop jar wc.jar com.atguigu.mapreduce.wordcount2.WordCountDriver /input /output1
```

期望可以动态传参，结果报错，误认为是第一个输入参数。

```java
hadoop jar wc.jar com.atguigu.mapreduce.wordcount2.WordCountDriver -Dmapreduce.job.queuename=root.test /input /output1
```

自己写的程序也可以动态修改参数。编写Yarn的Tool接口。

## 2. 具体步骤

1）新建Maven项目YarnDemo，pom如下：

```java
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    <groupId>com.atguigu.hadoop</groupId>
    <artifactId>yarn_tool_test</artifactId>
    <version>1.0-SNAPSHOT</version>
    <dependencies>
        <dependency>
            <groupId>org.apache.hadoop</groupId>
            <artifactId>hadoop-client</artifactId>
            <version>3.1.3</version>
        </dependency>
    </dependencies>
</project>
```

2）新建包名

3）创建类WordCount并实现Tool接口：

```java
import org.apache.hadoop.conf.Configuration;
import org.apache.hadoop.fs.Path;
import org.apache.hadoop.io.IntWritable;
import org.apache.hadoop.io.LongWritable;
import org.apache.hadoop.io.Text;
import org.apache.hadoop.mapreduce.Job;
import org.apache.hadoop.mapreduce.Mapper;
import org.apache.hadoop.mapreduce.Reducer;
import org.apache.hadoop.mapreduce.lib.input.FileInputFormat;
import org.apache.hadoop.mapreduce.lib.output.FileOutputFormat;
import org.apache.hadoop.util.Tool;
import java.io.IOException;
public class WordCount implements Tool {
    private Configuration conf;
    @Override
    public int run(String[] args) throws Exception {
        Job job = Job.getInstance(conf);
        job.setJarByClass(WordCountDriver.class);
        job.setMapperClass(WordCountMapper.class);
        job.setReducerClass(WordCountReducer.class);
        job.setMapOutputKeyClass(Text.class);
        job.setMapOutputValueClass(IntWritable.class);
        job.setOutputKeyClass(Text.class);
        job.setOutputValueClass(IntWritable.class);
        FileInputFormat.setInputPaths(job, new Path(args[0]));
        FileOutputFormat.setOutputPath(job, new Path(args[1]));
        return job.waitForCompletion(true) ? 0 : 1;
    }
    @Override
    public void setConf(Configuration conf) {
        this.conf = conf;
    }
    @Override
    public Configuration getConf() {
        return conf;
    }
    public static class WordCountMapper extends Mapper<LongWritable, Text, Text, IntWritable> {
        private Text outK = new Text();
        private IntWritable outV = new IntWritable(1);
        @Override
        protected void map(LongWritable key, Text value, Context context) throws IOException, InterruptedException {
            String line = value.toString();
            String[] words = line.split(" ");
            for (String word : words) {
                outK.set(word);
                context.write(outK, outV);
            }
        }
    }
    public static class WordCountReducer extends Reducer<Text, IntWritable, Text, IntWritable> {
        private IntWritable outV = new IntWritable();
        @Override
        protected void reduce(Text key, Iterable<IntWritable> values, Context context) throws IOException, InterruptedException {
            int sum = 0;
            for (IntWritable value : values) {
                sum += value.get();
            }
            outV.set(sum);
            context.write(key, outV);
        }
    }
}
```

4）新建WordCountDriver

```java
import org.apache.hadoop.conf.Configuration;
import org.apache.hadoop.util.Tool;
import org.apache.hadoop.util.ToolRunner;
import java.util.Arrays;
public class WordCountDriver {
    private static Tool tool;
    public static void main(String[] args) throws Exception {
        // 1. 创建配置文件
        Configuration conf = new Configuration();
        // 2. 判断是否有tool接口
        switch (args[0]){
            case "wordcount":
                tool = new WordCount();
                break;
            default:
                throw new RuntimeException(" No such tool: "+ args[0] );
        }
        // 3. 用Tool执行程序
        // Arrays.copyOfRange 将老数组的元素放到新数组里面
        int run = ToolRunner.run(conf, tool, Arrays.copyOfRange(args, 1, args.length));
        System.exit(run);
    }
}
```

## 3. 提交Jar包

在HDFS上准备输入文件，假设为/input目录，向集群提交该Jar包

```java
yarn jar YarnDemo.jar com.atguigu.yarn.WordCountDriver wordcount /input /output
```

注意此时提交的3个参数，第一个用于生成特定的Tool，第二个和第三个为输入输出目录。此时如果我们希望加入设置参数，可以在wordcount后面添加参数，例如：

```java
yarn jar YarnDemo.jar com.atguigu.yarn.WordCountDriver wordcount -Dmapreduce.job.queuename=root.test /input /output1
```

注：以上操作全部做完过后，快照回去或者手动将配置文件修改成之前的状态，因为本身资源就不够，分成了这么多，不方便以后测试。
