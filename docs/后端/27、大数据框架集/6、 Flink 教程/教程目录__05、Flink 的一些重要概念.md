# 05、Flink 的一些重要概念
- 来源：https://ddkk.com/zhuanlan/bigdata/flink/1/5.html
- 分类：大数据框架
- 分组：教程目录
## 1.程序与数据流 （DataFlow）

- 所有的Flink程序都是由三部分组成: Source Transformation 和 Sink（输入、转换、输出）
- Source负责读取数据源，Transformation利用各种算子进行处理加工，Sink负责输出
- 在运行时，Flink上运行的程序会被映射成“逻辑数据流”（Dataflows），它包含了这三部分
- 每一个dataflow以一个或多个Source开始以一个或多个Sinks结束，dataflow类似于任意的有向无环图（DAG）
- 在大部分情况下，程序中的转换运算（transformation）跟dataflow中的算子（operator）是一一对应的关系

## 2.并行度

- 每一个算子（Operator）可以包含一个或多个子任务（Operator subtask），这些子任务在不同的线程、不同的物理机或不同的容器中完全独立地执行。
- 一个特定算子的子任务（subtask）的个数被称之为并行度（parallelism）。

**不提倡在全局并行度设置并行度，推荐在每个算子中定义并行度**

## 3.算子链（Operator Chain）

### 3.1 数据传输形式

- 一个程序中，不同的算子可能具有不同的并行度
- 算子之间传输数据的形式可以是one-to-one（forwarding 直传 ）的模式也可以是redistributing（重新分配）的模式，具体是哪一种形式，取决于算子的种类

> One-to-One:Stream维护着分区以及元素的顺序（比如source和map之间）。这意味着map算子的子任务看到的元素个数以及顺序根跟source算子的子任务生产的元素的个数、顺序相同。map、filter、flatMap等算子都是one-to-one的对应关系。

> Redistributing： Stream的分区会发生改变。每一个算子的子任务依据所算子的transformation发送数据到不同的目标任务。例如，keyby基于hashcode重分区，而broadcast和rebalance会随机重新分区，这些算子都会引起redistribute过程，而redistribute过程类似于Spark的shuffle过程；

### 3.2 算子链（Operator Chains）

- Flink采用了一种称为任务链的优化技术，可以在特定条件下减少本地通信的开销。为了满足任务链的要求，必须将两个或多个算子设为相同的并行度，并通过本地转发(Local forward)的方式进行连接
- 相同并行度的one-to-one操作。Flink这些相连的算子链接在一起形成一个task,原来的算子成为里面的subtask
- 并行度相同，并且是one-to-one操作，两个条件缺一不可

## 4.执行图（ExecutionGraph）和作业图（JobGraph）

Fink中的执行图可以分成四层：StreamGraph -> JobGraph -> ExecutionGraph -> 物理执行图

- StreamGraph：是根据用户通过StreamAPI编写的代码生成的最初的图。用来表示程序的拓扑结构。
- JobGraph： StreamGraph经过优化后生成了JobGraph。提交给JobManager的数据结构，主要的优化为，将多个符合条件的节点chain在一起作为一个节点
- ExecutionGraph:JobManager根据JobGraph生成ExecutionGraph。ExecutionGraph是JobGraph的并行化版本，是调度层最核心的数据结构；
- 物理执行图：JobManager根据ExecutionGraph对Job进行调度后，在各个TaskManager上部署Task后形成的“图”，并不是一个具体的数据结构；

## 5.任务（Task）和任务槽（Task Slots）

- Flink中每一个TaskManager都是一个JVM进程，它可能会在独立的线程上执行一个或多个子任务
- 为了控制一个TaskManger能接收多少个Task，TaskManager通过Task Slot来进行控制（一个TaskManager至少有一个Slot）

### 5.1 任务共享Slot

- 默认情况下，Flink允许子任务共享slot，这样的结果是，一个Slot可以保存作业的整个管道
- 当我们将资源密集型和非密集型的任务同时放到slot中，它们就可以自行分配对资源占用的比例，从而保证最重的活平均分配给所有的TaskManager

### 5.2 Slot和并行度

**TaskSlot**

- 静态概念,是指TaskManager具有并发执行能力
- 通过参数taskmanager.numberOfTaskSlots进行配置（通常推荐配置为机器CPU核数）

**并行度（parallelism）**
- 动态概念，也就是TaskManager运行程序时实际使用的并发能力
- 通过参数parallelism.default进行配置
