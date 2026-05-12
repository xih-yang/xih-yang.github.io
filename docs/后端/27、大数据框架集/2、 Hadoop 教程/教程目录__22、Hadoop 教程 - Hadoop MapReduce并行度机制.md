# 22、Hadoop 教程 - Hadoop MapReduce并行度机制
- 来源：https://ddkk.com/zhuanlan/bigdata/hadoop/2/22.html
- 分类：大数据框架
- 分组：教程目录
## 1. MapTask并行度机制

### 1.1 概念

MapTask 的并行度指的是`map阶段有多少个并行的task共同处理任务`。map 阶段的任务处理并行度，势必影响到整个 Job 的处理速度。

- 一个 Job 的 Map 阶段并行度由客户端在提交 Job 时的切片数决定；
- **数据块：**Block 是 HDFS 物理上把数据分成一块一块。数据块是 HDFS 存储数据单位；
- **数据切片：**数据切片只是在逻辑上对输入进行分片，并不会在磁盘上将其切分成片进行存储。数据切片是 MapReduce 程序计算输入数据的单位，一个切片会对应启动一个 MapTask；

### 1.2 逻辑规划

- MapTask 并行度的决定机制叫做逻辑规划；
- 客户端提交Job之前会对待处理数据进行逻辑切片，形成逻辑规划文件；
- 逻辑切片机制由 FileInputFormat 实现类的getSplits()方法完成；
- 逻辑规划结果写入规划文件（job.split），在客户端提交 Job 之前，把规划文件提交到任务准备区，供后续使用；
- 每个逻辑切片最终对应启动一个 MapTask；

### 1.3 逻辑规划规则

- **FileInputFormat中默认的切片机制：**
- 简单地按照文件的内容长度进行切片；
- 切片大小，默认等于 block 大小，而 block 大小默认为 128M；
- 切片时不考虑数据集整体，而是逐个针对每一个文件单独切片；

```java
# 比如待处理数据有两个文件
file1.txt 320M
file2.txt 10M
# 经过FileInputFormat的切片机制运算后，形成切片信息如下：
file1.txt.split1	0M~128M
file1.txt.split2	128M~256M
file1.txt.split3	256M~320M
file2.txt.split1	0M~10M
```

### 1.4 逻辑切片相关参数

在FileInputFormat 中，计算切片大小的逻辑：`Math.max(minSize, Math.min(maxSize, blockSize));`

切片主要由这几个值来运算决定：

- **minsize（切片最小值）**，默认值：1
- 配置参数： `mapreduce.input.fileinputformat.split.minsize=1`；
- 参数调的比 blockSize 大，则可以让切片变得比 blockSize 还大；
- **maxsize**，默认值：Long.MAXValue
- 配置参数：`mapreduce.input.fileinputformat.split.maxsize=Long.MAXValue`；
- 参数如果调的比 blockSize 小，则会让切片变小，而且就等于配置的这个参数的值；

因此，默认情况下，`split size=block size`，在 hadoop 2.x 中为 128M。

但是，不论怎么调参数，都不能让多个小文件 “划入” 一个 split。

另外，`当bytesRemaining/splitSize > 1.1不满足的话，那么最后所有剩余的会作为一个切片`。从而不会形成例如 129M 文件规划成两个切片的局面。

## 2. ReduceTask并行度机制

- Reducetask 并行度同样影响整个 job 的执行并发度和执行效率，与 maptask 的并发数由切片数决定不同，Reducetask 数量的决定是可以直接手动设置：job.setNumReduceTasks(4)；
- 注意 Reducetask 数量并不是任意设置，还要考虑业务逻辑需求，有些情况下，需要计算全局汇总结果，就只能有 1个 Reducetask；
- 如果数据分布不均匀，就有可能在 reduce 阶段产生数据倾斜；

## 3. CombineTextInputFormat

### 3.1 TextInputFormat

在运行 MapReduce 程序时，输入的文件格式包括：基于行的日志文件、二进制格式文件、数据库表等。针对不同的数据类型，FileInputFormat 有不同的接口实现类：`TextInputFormat`、`KeyValueTextInputFormat`、`NLineInputFormat`、`CombineTextInputFormat`和`自定义InputFormat`等。

TextInputFormat 是默认的 FileInputFormat 实现类。按行读取每条记录。`键是存储该行在整个文件中的起始字节偏移量， LongWritable类型。值是这行的内容，不包括任何行终止符（换行符和回车符），Text类型。`

以下是一个示例，比如，一个分片包含了如下 4 条文本记录。

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

### 3.2 CombineTextInputFormat切片机制

框架默认的 TextInputFormat 切片机制是对任务按文件规划切片，`不管文件多小，都会是一个单独的切片`，都会交给一个 MapTask，这样如果有大量小文件，就`会产生大量的MapTask`，处理效率极其低下。

- **应用场景：**
- CombineTextInputFormat 用于小文件过多的场景，它可以将多个小文件从逻辑上规划到一个切片中，这样，多个小文件就可以交给一个 MapTask 处理；
- **虚拟存储切片最大值设置**
- `CombineTextInputFormat.setMaxInputSplitSize(job, 4194304);`（4M）
- 注意：虚拟存储切片最大值设置最好根据实际的小文件大小情况来设置具体的值；
- **切片机制**
- 生成切片过程包括：虚拟存储过程和切片过程二部分。

- **虚拟存储过程：**
- 将输入目录下所有文件大小，依次和设置的 setMaxInputSplitSize 值比较，如果不大于设置的最大值，逻辑上划分一个块。如果输入文件大于设置的最大值且大于两倍，那么以最大值切割一块；`当剩余数据大小超过设置的最大值且不大于最大值2倍，此时将文件均分成2个虚拟存储块（防止出现太小切片）`；
- 例如 setMaxInputSplitSize 值为 4M，输入文件大小为 8.02M，则先逻辑上分成一个 4M。剩余的大小为 4.02M，如果按照 4M 逻辑划分，就会出现 0.02M 的小的虚拟存储文件，所以将剩余的 4.02M 文件切分成（2.01M和2.01M）两个文件；
- **切片过程：**
- 判断虚拟存储的文件大小是否大于 setMaxInputSplitSize 值，大于等于则单独形成一个切片；
- 如果不大于则跟下一个虚拟存储文件进行合并，共同形成一个切片。
- 测试举例：

有 4 个小文件大小分别为 1.7M、5.1M、3.4M 以及 6.8M 这四个小文件，则虚拟存储之后形成 6 个文件块，大小分别为：

1.7M，（2.55M、2.55M），3.4M 以及（3.4M、3.4M）
- 最终会形成 3 个切片，大小分别为：

(1.7+2.55) M，(2.55+3.4) M，(3.4+3.4) M
