# 29、Hadoop 教程 - Hadoop MapReduce Reduce阶段核心源码分析
- 来源：https://ddkk.com/zhuanlan/bigdata/hadoop/2/29.html
- 分类：大数据框架
- 分组：教程目录
## 1. Reduce阶段整体概述

Reduce大致分为`copy`、`sort`、`reduce`三个阶段，重点在前两个阶段。

copy 阶段包含一个 eventFetcher 来获取已完成的 map 列表，由 Fetcher 线程去 copy 数据，到各个 maptask 那里去拉取属于自己分区的数据。在此过程中会启动两个 merge 线程，分别为`inMemoryMerger`和`onDiskMerger`，分别将内存中的数据 merge 到磁盘和将磁盘中的数据进行 merge。

待数据 copy 完成之后，copy 阶段就完成了，开始进行 sort 阶段，sort 阶段主要是执行`finalMerge`操作，纯粹的 sort 阶段。

完成之后就是 reduce 阶段，调用用户定义的`reduce`函数进行处理。

## 2. 前置：解读ReduceTask类

`ReduceTask`类作为 reducetask 的一个载体，调用的就是里面的 run 方法，然后开启 reduce 任务。

### 2.1 第一层调用（ReduceTask.run）

#### 2.1.1 reduce阶段的任务划分

整个 reducetask 分为 3 个阶段：copy 拉取数据、sort 排序数据、reduce 处理数据。

#### 2.1.2 shuffle操作

整个 shuffle 操作过程除了 shuffle 核心任务之外，还创建了 reducetask 工作相关的一些组件，包括但不限于：

`codec解编码器`：

`CombineOutputCollector输出收集器`：

`shuffleConsumerPlugin（负责reduce端shuffle插件）`：

并且对 shuffleConsumerPlugin 进行了`初始化init`、`run运行`。运行返回的结果就是 reduce shuffle 之后的全部数据。这是 shuffle 过程的核心，后续深入。

`shuffleContext上下文对象`：

`GroupingComparator分组比较器`：

#### 2.1.3 运行reducer

shuffle 完的结果将进入到 reducer 进行最终的 reduce 处理。

### 2.2 第二层调用（runNewReducer）准备部分

默认情况下，框架使用 new API 来运行，所以将执行`runNewReducer()`。

runNewReducer 内第一大部分代码我们称之为 reducetask 运行的准备部分。

其主要逻辑是创建 reducetask 运行时需要的各种依赖，包括：

`taskContext上下文`：

`创建用户编写设置的reducer类`：

`outputFormat输出数据组件`：

`ReducerContext上下文`：

接下来我们进去看一下怎么创建的 reducerContext，我们进到它的实现类`ReduceContextImpl`里面：

### 2.3 第二层调用（runNewReducer）工作部分

#### 2.3.1 reducer.run

在runNewReducer 的代码中，最后还调用了 Reduer.run 方法开始针对 shuffle 后的数据进行 reduce 操作。

#### 2.3.2 RecordWriter

## 3. Shuffle-init

注意 ShuffleConsumerPlugin 是一个接口，默认的实现只有一个`Shuffle.class`。

初始化的过程中，核心逻辑就是创建 MergeManagerImpl 类。在 MergeManagerImpl 类中，核心的有：确定 shuffle 时的一些条件、是否允许内存到内存合并、启动两个 merge 线程，分别为`inMemoryMerger`和`onDiskMerger`，分别将内存中的数据 merge 到磁盘和将磁盘中的数据进行合并。

### 3.1 shuffle条件

### 3.2 启动MemToMemMerge

因为 fetch 来数据首先放入在内存中的，正常情况下在内存中对数据进行合并是最快的，可惜的是，`默认情况下，是不开启内存到内存的合并的`。

### 3.3 启动inMemoryMerger

### 3.4 启动onDiskMerger

## 4. Shuffle-run

注意 ShuffleConsumerPlugin 是一个接口，默认的实现只有一个`Shuffle.class`。

### 4.1 EventFetcher线程

### 4.2 fetchers线程

## 5. Shuffle-Copy阶段

Reduce 进程启动一些数据 copy 线程（`Fetcher`），通过 HTTP 方式请求 maptask 获取属于自己的文件。如果是本地模式运行，启动一个 fetcher 线程拉取数据，否则启动 5 个线程并发拉取。

### 5.1 MapHost类

MapHost 类用于标记 MapTask 任务状态，记下 MapTask host 信息。

### 5.2 Fetcher.run

获得所有 maptask 处于 PENDING 待处理状态的主机。

然后进入核心方法，copyFromHost，从 map 拉取数据

#### 5.2.1 copyFromHost

建立拉取数据的输入流

拉取 copy 数据

#### 5.2.2 copyMapOutput

首先进行判断 copy 过来的数据放置在哪里？`优先内存，超过限制放置磁盘`。

因此获得的 mapOutput 就有两种具体的实现。通过 mapOutput.shuffle 开始拉取数据。

不断追踪下去，最终是两种不同的实现：

`InMemoryMapOutput`：把 copy 来的数据放置到 reducetask 内存中。

`OnDiskMapOutput`：把 copy 来的数据放置到磁盘上。

## 6. Shuffle-Merge阶段

在启动 Fetcher 线程 copy 数据过程中已经启动了两个 merge 线程，分别为`inMemoryMerger`和`onDiskMerger`，分别将内存中的数据 merge 到磁盘和将磁盘中的数据进行 merge。

可以从`Shuffle.init` → \rightarrow →`createMergeManager` → \rightarrow →`new MergeManagerImpl`中确定。

### 6.1 inMemoryMerger

inMemoryMerger 本质是一个 MergeThread 线程。进入线程 run 方法。

#### 6.1.1 MergeThread.run

在内存中合并，合并的结果写入磁盘。

### 6.2 onDiskMerger

onDiskMerger 本质是一个 MergeThread 线程。进入线程 run 方法。

#### 6.2.1 MergeThread.run

此时应该来到在磁盘上合并的实现类中：

#### 6.2.2 closeOnDiskFile

不管是在内存中合并还是在磁盘上合并，最终都调用了 closeOnDiskFile 方法，关闭磁盘文件。

### 6.3 finalMerge

当所有的 Fetcher 拉取数据结束之后，会进行最终一次合并，最终合并的所有数据保存在 kvIter。

可以在 shuffle 类的 run 中发现。

## 7. Shuffle-Sort阶段

在合并的过程中，会对数据进行 Sort 排序，默认情况下是 key 的字典序（WritableComparable），如果用户设置比较器，则以用户设置的为准。

## 8. Reducer

当合并排序结束之后，进入到 reduce 阶段。

在runNewReducer 方法的最后，调用了 reducer.run 方法运行 reducer。

### 8.1 Reducer.run

点击进入 run 方法

首先在 Reduce.run 中调用 context.nextKey() 决定是否进入 while，，然后调用 nextKeyValue 将 key/value 的值从 input 中读出，其次通过 context.getValues 将 Iterator 传入 reduce 中，在 reduce 中通过 Iterator.hasNext 查看此 key 是否有下个 value，然后通过 Iterator.next 调用 nextKeyValue 去 input 中读取 value。

然后循环迭代 Iterator，读取 input 中相同 key 的 value。

也就是说 reduce 中`相同key的value值在Iterator.next中通过nextKeyValue读取的，每调用一次next就从input中读一个value`。

通俗理解：`key相同的被分为一组，一组中所有的value会组成一个Iterable。key则是当前的value与之对应的key`。

### 8.2 Reducer.reduce

对于 reduce 方法，如果用户不重写，父类中也有默认实现逻辑。其逻辑为：输入什么，原封不动的输出什么，也就意味着不对数据进行任何处理。

通常会基于业务需求重新父类的 reduce 方法。

## 9. OutputFormat

reduce 阶段的最后是通过调用 context.write 方法将数据写出的。

负责输出数据的组件叫做 OutputFormat，默认实现是`TextOutPutFormat`。而真正负责写数据的组件叫做 LineRecordWriter，Write 方法就定义在其中，这一点和输入组件很是类似。

LineRecordWriter 的行为是一次输出写一行，再有输出换行写。

在构造 LineRecordWriter 的时候，已经设置了输出的`key,value之间是以\t制表符分割`的。
