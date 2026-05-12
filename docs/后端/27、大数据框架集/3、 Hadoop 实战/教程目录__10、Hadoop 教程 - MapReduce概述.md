# 10、Hadoop 教程 - MapReduce概述
- 来源：https://ddkk.com/zhuanlan/bigdata/hadoop/3/10.html
- 分类：大数据框架
- 分组：教程目录
## 1. MapReduce定义

MapReduce是一个分布式运算程序的编程框架，是用户开发“基于Hadoop的数据分析应用”的核心框架。

MapReduce核心功能是将用户编写的业务逻辑代码和自带默认组件整合成一个完整的分布式运算程序，并发运行在一个Hadoop集群上。

## 2. MapReduce优缺点

### 2.1. MapReduce优点

**1）MapReduce易于编程：**

它简单的实现一些接口，就可以完成一个分布式程序，这个分布式程序可以分布到大量廉价的PC机器上运行。也就是说你写一个分布式程序，跟写一个简单的串行程序是一模一样的。就是因为这个特点使得MapReduce编程变得非常流行。

**2）良好的扩展性：**

当你的计算资源不能得到满足的时候，你可以通过简单的增加机器来扩展它的计算能力。

**3）高容错性：**

MapReduce设计的初衷就是使程序能够部署在廉价的PC机器上，这就要求它具有很高的容错性。比如其中一台机器挂了，它可以把上面的计算任务转移到另外一个节点上运行，不至于这个任务运行失败，而且这个过程不需要人工参与，而完全是由Hadoop内部完成的。

**4）适合PB级以上海量数据的离线处理：**

可以实现上千台服务器集群并发工作，提供数据处理能力。

### 2.2. MapReduce缺点

**1）不擅长实时计算：**

MapReduce无法像MySQL一样，在毫秒或者秒级内返回结果。

**2）不擅长流式计算：**

流式计算的输入数据是动态的，而MapReduce的输入数据集是静态的，不能动态变化。这是因为MapReduce自身的设计特点决定了数据源必须是静态的。

**3）不擅长DAG（有向无环图）计算：**

多个应用程序存在依赖关系，后一个应用程序的输入为前一个的输出。在这种情况下，MapReduce并不是不能做，而是使用后，每个MapReduce作业的输出结果都会写入到磁盘，会造成大量的磁盘IO，导致性能非常的低下。

## 3. MapReduce核心思想

（1）分布式的运算程序往往需要分成至少2个阶段。

（2）第一个阶段的MapTask并发实例，完全并行运行，互不相干。

（3）第二个阶段的ReduceTask并发实例互不相干，但是他们的数据依赖于上一个阶段的所有MapTask并发实例的输出。

（4）MapReduce编程模型只能包含一个Map阶段和一个Reduce阶段，如果用户的业务逻辑非常复杂，那就只能多个MapReduce程序，串行运行。

总结：分析WordCount数据流走向深入理解MapReduce核心思想。

## 4. MapReduce进程

一个完整的MapReduce程序在分布式运行时有三类实例进程：

（1）MrAppMaster：负责整个程序的过程调度及状态协调。

（2）MapTask：负责Map阶段的整个数据处理流程。

（3）ReduceTask：负责Reduce阶段的整个数据处理流程。

## 5. 常用数据序列化类型

采用反编译工具反编译源码，发现WordCount案例有Map类、Reduce类和驱动类。且数据的类型是Hadoop自身封装的序列化类型。

## 6. MapReduce编程规范

Java类型
Hadoop Writable类型

Boolean
BooleanWritable

Byte
ByteWritable

Int
IntWritable

Float
FloatWritable

Long
LongWritable

Double
DoubleWritable

String
Text

Map
MapWritable

Array
ArrayWritable

Null
NullWritable

## 7. WordCount案例实操

用户编写的程序分成三个部分：Mapper、Reducer和Driver。

### 7.1. Mapper阶段

> （1）用户自定义的Mapper要继承自己的父类
>
> （2）Mapper的输入数据是KV对的形式（KV的类型可自定义）
>
> （3）Mapper中的业务逻辑写在map()方法中
>
> （4）Mapper的输出数据是KV对的形式（KV的类型可自定义）
>
> （5）map()方法（MapTask进程）对每一个调用一次

### 7.2. Reduce阶段

> （1）用户自定义的Reducer要继承自己的父类
>
> （2）Reducer的输入数据类型对应Mapper的输出数据类型，也是KV
>
> （3）Reducer的业务逻辑写在reduce()方法中
>
> （4）ReduceTask进程对每一组相同k的组调用一次reduce()方法

### 7.3. Driver阶段

> 相当于YARN集群的客户端，用于提交我们整个程序到YARN集群，提交的是封装了MapReduce程序相关运行参数的job对象

## 8. WordCount案例实操

### 8.1. 本地测试

**1）需求：在给定的文本文件中统计输出每一个单词出现的总次数**

- 输入数据：

```java
ss ss
cls cls
jiao
banzhang
xue
hadoop
```

- 期望输出数据：

```java
banzhang	1
cls	2
hadoop	1
jiao	1
ss	2
xue	1
```

**2）需求分析：**

按照MapReduce编程规范，分别编写Mapper，Reducer，Driver。

**3）环境准备：**

- 创建maven工程，MapReduceDemo
- 在pom.xml文件中添加如下依赖

```java
<dependencies>
    <dependency>
        <groupId>org.apache.hadoop</groupId>
        <artifactId>hadoop-client</artifactId>
        <version>3.1.3</version>
    </dependency>
    <dependency>
        <groupId>junit</groupId>
        <artifactId>junit</artifactId>
        <version>4.12</version>
    </dependency>
    <dependency>
        <groupId>org.slf4j</groupId>
        <artifactId>slf4j-log4j12</artifactId>
        <version>1.7.30</version>
    </dependency>
</dependencies>
```

- 在项目的src/main/resources目录下，新建一个文件，命名为“log4j.properties”，在文件中填入如下配置

```java
log4j.rootLogger=INFO, stdout  
log4j.appender.stdout=org.apache.log4j.ConsoleAppender  
log4j.appender.stdout.layout=org.apache.log4j.PatternLayout  
log4j.appender.stdout.layout.ConversionPattern=%d %p [%c] - %m%n  
log4j.appender.logfile=org.apache.log4j.FileAppender  
log4j.appender.logfile.File=target/spring.log  
log4j.appender.logfile.layout=org.apache.log4j.PatternLayout  
log4j.appender.logfile.layout.ConversionPattern=%d %p [%c] - %m%n
```

- 创建包

**4）编写程序**

- 编写Mapper类：

```java
import java.io.IOException;
import org.apache.hadoop.io.IntWritable;
import org.apache.hadoop.io.LongWritable;
import org.apache.hadoop.io.Text;
import org.apache.hadoop.mapreduce.Mapper;
public class WordCountMapper extends Mapper<LongWritable, Text, Text, IntWritable>{
	Text k = new Text();
	IntWritable v = new IntWritable(1);
	@Override
	protected void map(LongWritable key, Text value, Context context)	throws IOException, InterruptedException {
		// 1 获取一行
		String line = value.toString();
		// 2 切割
		String[] words = line.split(" ");
		// 3 输出
		for (String word : words) {
			k.set(word);
			context.write(k, v);
		}
	}
}
```

- 编写Reduce类：

```java
import java.io.IOException;
import org.apache.hadoop.io.IntWritable;
import org.apache.hadoop.io.Text;
import org.apache.hadoop.mapreduce.Reducer;
public class WordCountReducer extends Reducer<Text, IntWritable, Text, IntWritable>{
int sum;
IntWritable v = new IntWritable();
	@Override
	protected void reduce(Text key, Iterable<IntWritable> values,Context context) throws IOException, InterruptedException {
		// 1 累加求和
		sum = 0;
		for (IntWritable count : values) {
			sum += count.get();
		}
		// 2 输出
         v.set(sum);
		context.write(key,v);
	}
}
```

- 编写Driver驱动类：

```java
import java.io.IOException;
import org.apache.hadoop.conf.Configuration;
import org.apache.hadoop.fs.Path;
import org.apache.hadoop.io.IntWritable;
import org.apache.hadoop.io.Text;
import org.apache.hadoop.mapreduce.Job;
import org.apache.hadoop.mapreduce.lib.input.FileInputFormat;
import org.apache.hadoop.mapreduce.lib.output.FileOutputFormat;
public class WordCountDriver {
	public static void main(String[] args) throws IOException, ClassNotFoundException, InterruptedException {
		// 1 获取配置信息以及获取job对象
		Configuration conf = new Configuration();
		Job job = Job.getInstance(conf);
		// 2 关联本Driver程序的jar
		job.setJarByClass(WordCountDriver.class);
		// 3 关联Mapper和Reducer的jar
		job.setMapperClass(WordCountMapper.class);
		job.setReducerClass(WordCountReducer.class);
		// 4 设置Mapper输出的kv类型
		job.setMapOutputKeyClass(Text.class);
		job.setMapOutputValueClass(IntWritable.class);
		// 5 设置最终输出kv类型
		job.setOutputKeyClass(Text.class);
		job.setOutputValueClass(IntWritable.class);
		// 6 设置输入和输出路径
		FileInputFormat.setInputPaths(job, new Path(args[0]));
		FileOutputFormat.setOutputPath(job, new Path(args[1]));
		// 7 提交job
		boolean result = job.waitForCompletion(true);
		System.exit(result ? 0 : 1);
	}
}
```

**5）本地测试**

- 需要首先配置好HADOOP_HOME变量以及Windows运行依赖
- 在IDEA/Eclipse上运行程序

### 8.2. 提交到集群测试

1）用maven打jar包，需要添加的打包插件依赖

```java
<build>
    <plugins>
        <plugin>
            <artifactId>maven-compiler-plugin</artifactId>
            <version>3.6.1</version>
            <configuration>
                <source>1.8</source>
                <target>1.8</target>
            </configuration>
        </plugin>
        <plugin>
            <artifactId>maven-assembly-plugin</artifactId>
            <configuration>
                <descriptorRefs>
                    <descriptorRef>jar-with-dependencies</descriptorRef>
                </descriptorRefs>
            </configuration>
            <executions>
                <execution>
                    <id>make-assembly</id>
                    <phase>package</phase>
                    <goals>
                        <goal>single</goal>
                    </goals>
                </execution>
            </executions>
        </plugin>
    </plugins>
</build>
```

2）将程序打成jar包

3）修改不带依赖的jar包名称为wc.jar，并拷贝该jar包到Hadoop集群的/opt/module/hadoop-3.1.3路径

4）启动Hadoop集群

```java
$ sbin/start-dfs.sh
$ sbin/start-yarn.sh
```

5）执行WordCount程序

```java
$ hadoop jar  wc.jar com.xxx.WordCountDriver /user/input /user/output
```
