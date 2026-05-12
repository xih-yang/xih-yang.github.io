# 12、Hadoop 教程 - MapReduce框架原理之InputFormat数据输入
- 来源：https://ddkk.com/zhuanlan/bigdata/hadoop/3/12.html
- 分类：大数据框架
- 分组：教程目录
## 1. 切片与MapTask并行度决定机制

### 1.1. 问题引出

MapTask的并行度决定Map阶段的任务处理并发度，进而影响到整个Job的处理速度。

思考：1G的数据，启动8个MapTask，可以提高集群的并发处理能力。那么1K的数据，也启动8个MapTask，会提高集群性能吗？MapTask并行任务是否越多越好呢？哪些因素影响了MapTask并行度？

### 1.2. MapTask并行度决定机制

- 数据块：Block是HDFS物理上把数据分成一块一块。数据块是HDFS存储数据单位。
- 数据切片：数据切片只是在逻辑上对输入进行分片，并不会在磁盘上将其切分成片进行存储。数据切片是MapReduce程序计算输入数据的单位，一个切片会对应启动一个MapTask。

### 1.3. 数据切片与MapTask并行度决定机制

## 2. Job提交流程源码和切片源码详解

### 2.1. Job提交流程源码详解

```java
waitForCompletion()
submit();
// 1建立连接
	connect();	
		// 1）创建提交Job的代理
		new Cluster(getConfiguration());
			// （1）判断是本地运行环境还是yarn集群运行环境
			initialize(jobTrackAddr, conf); 
// 2 提交job
submitter.submitJobInternal(Job.this, cluster)
	// 1）创建给集群提交数据的Stag路径
	Path jobStagingArea = JobSubmissionFiles.getStagingDir(cluster, conf);
	// 2）获取jobid ，并创建Job路径
	JobID jobId = submitClient.getNewJobID();
	// 3）拷贝jar包到集群
copyAndConfigureFiles(job, submitJobDir);	
	rUploader.uploadFiles(job, jobSubmitDir);
	// 4）计算切片，生成切片规划文件
writeSplits(job, submitJobDir);
		maps = writeNewSplits(job, jobSubmitDir);
		input.getSplits(job);
	// 5）向Stag路径写XML配置文件
writeConf(conf, submitJobFile);
	conf.writeXml(out);
	// 6）提交Job,返回提交状态
status = submitClient.submitJob(jobId, submitJobDir.toString(), job.getCredentials());
```

### 2.2. FileInputFormat切片源码解析（input.getSplits(job)）

## 3. FileInputFormat切片机制

### 3.1. FileInputFormat切片机制概述

### 3.2. FileInputFormat切片大小的参数配置

## 4. TextInputFormat

### 4.1. FileInputFormat实现类

- 思考：在运行MapReduce程序时，输入的文件格式包括：基于行的日志文件、二进制格式文件、数据库表等。那么，针对不同的数据类型，MapReduce是如何读取这些数据的呢？
- FileInputFormat常见的接口实现类包括：TextInputFormat、KeyValueTextInputFormat、NLineInputFormat、CombineTextInputFormat和自定义InputFormat等。

### 4.2. TextInputFormat

TextInputFormat是默认的FileInputFormat实现类。按行读取每条记录。键是存储该行在整个文件中的起始字节偏移量， LongWritable类型。值是这行的内容，不包括任何行终止符（换行符和回车符），Text类型。

以下是一个示例，比如，一个分片包含了如下4条文本记录：

```java
Rich learning form
Intelligent learning engine
Learning more convenient
From the real demand for more close to the enterprise
```

每条记录表示为以下键/值对：

```java
(0,Rich learning form)
(20,Intelligent learning engine)
(49,Learning more convenient)
(74,From the real demand for more close to the enterprise)
```

## 5. CombineTextInputFormat切片机制

框架默认的TextInputFormat切片机制是对任务按文件规划切片，不管文件多小，都会是一个单独的切片，都会交给一个MapTask，这样如果有大量小文件，就会产生大量的MapTask，处理效率极其低下。

### 5.1. 应用场景

CombineTextInputFormat用于小文件过多的场景，它可以将多个小文件从逻辑上规划到一个切片中，这样，多个小文件就可以交给一个MapTask处理。

### 5.2. 虚拟存储切片最大值设置

CombineTextInputFormat.setMaxInputSplitSize(job, 4194304);// 4m

注意：虚拟存储切片最大值设置最好根据实际的小文件大小情况来设置具体的值。

### 5.3. 切片机制

生成切片过程包括：虚拟存储过程和切片过程二部分。

CombineTextInputFormat切片机制如下图所示：

### 5.4. 虚拟存储过程

将输入目录下所有文件大小，依次和设置的setMaxInputSplitSize值比较，如果不大于设置的最大值，逻辑上划分一个块。如果输入文件大于设置的最大值且大于两倍，那么以最大值切割一块；当剩余数据大小超过设置的最大值且不大于最大值2倍，此时将文件均分成2个虚拟存储块（防止出现太小切片）。

例如setMaxInputSplitSize值为4M，输入文件大小为8.02M，则先逻辑上分成一个4M。剩余的大小为4.02M，如果按照4M逻辑划分，就会出现0.02M的小的虚拟存储文件，所以将剩余的4.02M文件切分成（2.01M和2.01M）两个文件。

### 5.5. 切片过程

- 判断虚拟存储的文件大小是否大于setMaxInputSplitSize值，大于等于则单独形成一个切片。
- 如果不大于则跟下一个虚拟存储文件进行合并，共同形成一个切片。
- 测试举例：有4个小文件大小分别为1.7M、5.1M、3.4M以及6.8M这四个小文件，则虚拟存储之后形成6个文件块，大小分别为： 1.7M，（2.55M、2.55M），3.4M以及（3.4M、3.4M）最终会形成3个切片，大小分别为：（1.7+2.55）M，（2.55+3.4）M，（3.4+3.4）M

## 6. CombineTextInputFormat案例实操

### 6.1. 需求

将输入的大量小文件合并成一个切片统一处理。

- 输入数据：4个小文件
- 期望：期望一个切片处理4个文件

### 6.2. 实现过程

- 不做任何处理，直接运行WordCount案例程序，观察切片个数为4。

> number of splits:4

- 在WordcountDriver中增加如下代码，运行程序，并观察运行的切片个数为3。

a）驱动类中添加代码如下：

```java
// 如果不设置InputFormat，它默认用的是TextInputFormat.class
job.setInputFormatClass(CombineTextInputFormat.class);
//虚拟存储切片最大值设置4m
CombineTextInputFormat.setMaxInputSplitSize(job, 4194304);
```

> b）运行如果为3个切片

```java
number of splits:3
```

- 在WordcountDriver中增加如下代码，运行程序，并观察运行的切片个数为1。

a）驱动中添加代码如下：

```java
// 如果不设置InputFormat，它默认用的是TextInputFormat.class
job.setInputFormatClass(CombineTextInputFormat.class);
//虚拟存储切片最大值设置20m
CombineTextInputFormat.setMaxInputSplitSize(job, 20971520);
```

b）运行如果为1个切片

```java
number of splits:1
```
