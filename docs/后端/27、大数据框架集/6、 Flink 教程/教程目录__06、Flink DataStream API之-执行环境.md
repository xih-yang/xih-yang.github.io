# 06、Flink DataStream API之-执行环境
- 来源：https://ddkk.com/zhuanlan/bigdata/flink/1/6.html
- 分类：大数据框架
- 分组：教程目录
## 执行环境（Execution Environment）

Flink 程序可以在各种上下文环境中运行：可以在本地 JVM 中执行程序，也可以提交到远程集群上运行。

不同的环境，代码的提交运行的过程会有所不同。这就要求在提交作业执行计算时， 首先必须获取当前 Flink 的运行环境，从而建立起与 Flink 框架之间的联系。只有获取了环境上下文信息，才能将具体的任务调度到不同的TaskManager 执行。

### 1.创建执行环境

编写Flink 程 序 的 第 一 步，就 是 创 建 执 行 环 境 。 要 获 取 的 执 行 环 境 ，是StreamExecutionEnvironment类的对象，这是所有 Flink 程序的基础。

在代码中创建执行环境的 方式，就是调用这个类的静态方法，具体有以下三种。

**1、****getExecutionEnvironment**；

最简单的方式，就是直接调用getExecutionEnvironment方法。它会根据当前运行的上下文直接得到正确的结果：

- 如果程序是独立运行的，就返回一个本地执行环境；
- 如果是创建了jar包，然后从命令行调用它并提交到集群执行，那么就返回集群的执行环境。

也就是说，这个方法会根据当前运行的方式，自行决定该返回什么样的运行环境

```java
StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();
```

这种“智能”的方式不需要我们额外做判断，用起来简单高效，是最常用的一种创建执行环境的方式。
**2、****createLocalEnvironment**；

这个方法返回一个本地执行环境。可以在调用时传入一个参数，指定默认的并行度；如果不传入，则默认并行度就是本地的CPU核心数。

```java
StreamExecutionEnvironment localEnv = StreamExecutionEnvironment.createLocalEnvironment();
```

**3、****createRemoteEnvironment**；

这个方法返回集群执行环境。需要在调用时指定JobManager的主机名和端口号，并指定要在集群中运行的Jar包。

```java
StreamExecutionEnvironment remoteEnv = StreamExecutionEnvironment
 .createRemoteEnvironment(
 "host", // JobManager 主机名
 1234, // JobManager 进程端口号
 "path/to/jarFile.jar" // 提交给 JobManager 的 JAR 包
);
```

在获取到程序执行环境后，还可以对执行环境进行灵活的设置。比如可以全局设置程序的并行度、禁用算子链，还可以定义程序的时间语义、配置容错机制。

### 2.执行模式(Execution Mode)

wordcount程序获取到的执行环境，是一个StreamExecutionEnvironment，顾名思义它应该是做流处理的。那对于批处理，又应该怎么获取执行环境呢？

在之前的Flink版本中，批处理的执行环境与流处理类似，是调用类ExecutionEnvironment的静态方法，返回它的对象：

```java
// 批处理环境
ExecutionEnvironment batchEnv = ExecutionEnvironment.getExecutionEnvironment();
// 流处理环境
StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();
```

基于ExecutionEnvironment读入数据创建的数据集合，就是DataSet；对应的调用的一整套转换方法，就是DataSetAPI。这些在批处理wordcount程序中已经有了基本了解。

而从1.12.0版本起，Flink实现了API上的流批统一。DataStreamAPI新增了一个重要特性：**可以支持不同的“执行模式”（executionmode），通过简单的设置就可以让一段Flink程序在流处理和批处理之间切换。**这样一来，DataSetAPI也就没有存在的必要了。

- **流执行模式（STREAMING）**

这是DataStreamAPI最经典的模式，一般用于需要持续实时处理的无界数据流。默认情况下，程序使用的就是STREAMING执行模式。

- **批执行模式（BATCH）**

专门用于批处理的执行模式, 这种模式下，Flink 处理作业的方式类似于 MapReduce 框架。 对于不会持续计算的有界数据，用这种模式处理会更方便。

- **自动模式（AUTOMATIC）**

在这种模式下，将由程序根据输入数据源是否有界，来自动选择执行模式。

**1、** BATCH模式的配置方法；

由于 Flink 程序默认是 STREAMING 模式，这里重点介绍一下 BATCH 模式的配置。

主要有两种方式：

1、通过命令行配置

**在提交作业时，增加 execution.runtime-mode 参数，指定值为 BATCH。**

```java
bin/flink run -Dexecution.runtime-mode=BATCH ...
```

2、通过代码配置(不推荐-灵活性差)

在代码中，直接基于执行环境调用 setRuntimeMode 方法，传入 BATCH 模式。

建议: 不要在代码中配置，而是使用命令行。这同设置并行度是类似的：在提交作业时指定参数可以更加灵活，同一段应用程序写好之后，既可以用于批处理也可以用于流处理。而在代码中硬编码（hard code）的方式可扩展性比较差，一般都不推荐

```java
StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();
env.setRuntimeMode(RuntimeExecutionMode.BATCH);
```

**2、** 什么时候选择BATCH模式；

Flink 本身持有的就是流处理的世界观，即使是批量数据，也可以看作“有界流”来进行处理。所以 STREAMING 执行模式对于有界数据和无界数据都是有效的；而 BATCH模式仅能用于有界数据。看起来 BATCH 模式似乎被 STREAMING 模式全覆盖了，那还有必要存在吗？能不能所有情况下都用流处理模式呢？

当然是可以的，但是这样有时不够高效。可以仔细回忆一下 word count 程序中，批处理和流处理输出的不同：

- 在 STREAMING模式下，每来一条数据，就会输出一次结果（即使输入数据是有界的）；
- 而 BATCH 模式下，只有数据全部处理完之后，才会一次性输出结果。

最终的结果两者是一致的，但是流处理模式会将更多的中间结果输出。在本来输入有界、只希望通过批处理得到最终的结果的场景下，

STREAMING 模式的逐个输出结果就没有必要了。

所以总结起来，一个简单的原则就是：

**用 BATCH 模式处理批量数据，用 STREAMING模式处理流式数据。因为数据有界的时候，直接输出结果会更加高效；而当数据无界的时候, 没得选择——只有 STREAMING 模式才能处理持续的数据流。

在后面的代码中，即使是有界的数据源，也会统一用 STREAMING 模式处理。这是因为主要目标还是构建实时处理流数据的程序，有界数据源也只是用来测试的手段。**

### 3.触发程序执行

有了执行环境，就可以构建程序的处理流程了：基于环境读取数据源，进而进行各种转换操作，最后输出结果到外部系统。

需要注意的是，写完输出（sink）操作并不代表程序已经结束。因为当 main()方法被调用时，其实只是定义了作业的每个执行操作，然后添加到数据流图中；这时并没有真正处理数据,因为数据可能还没来。Flink 是由事件驱动的，只有等到数据到来，才会触发真正的计算，这也被称为“延迟执行”或“懒执行”（lazy execution）。

所以需要显式地调用执行环境的 execute()方法，来触发程序执行。execute()方法将一直等待作业完成，然后返回一个执行结果（JobExecutionResult）。

```java
env.execute();
```
