# 10、Flink深入：Flink原理初探
- 来源：https://ddkk.com/zhuanlan/bigdata/flink/4/10.html
- 分类：大数据框架
- 分组：教程目录
## 1. Flink角色分工

在实际生产中，Flink 都是以集群在运行，在运行的过程中包含了两类进程。

- JobManager：它扮演的是集群管理者的角色，负责调度任务、协调 checkpoints、协调故障恢复、收集 Job 的状态信息，并管理 Flink 集群中的从节点 TaskManager。
- TaskManager：实际负责执行计算的 Worker，在其上执行 Flink Job 的一组 Task；TaskManager 还是所在节点的管理员，它负责把该节点上的服务器信息比如内存、磁盘、任务运行情况等向 JobManager 汇报。
- Client：用户在提交编写好的 Flink 工程时，会先创建一个客户端再进行提交，这个客户端就是 Client。

## 2. Flink执行流程

## 2.1. 相关文章链接

[Flink 基本工作原理_sxiaobei的博客-CSDN博客_flink原理](https://blog.csdn.net/sxiaobei/article/details/80861070)

[基于Flink1.8的Flink On Yarn的启动流程_super_wj0820的博客-CSDN博客_flink on yarn 启动](https://blog.csdn.net/super_wj0820/article/details/90726768)

[Apache Flink 1.11 Documentation: YARN Setup](https://ci.apache.org/projects/flink/flink-docs-release-1.11/ops/deployment/yarn_setup.html)

## 2.2. Standalone版

## 2.3. On Yarn版

**1、** Client向HDFS上传Flink的Jar包和配置；

**2、** Client向YarnResourceManager提交任务并申请资源；

**3、** ResourceManager分配Container资源并启动ApplicationMaster,然后AppMaster加载Flink的Jar包和配置构建环境,启动JobManager；

**4、** ApplicationMaster向ResourceManager申请工作资源,NodeManager加载Flink的Jar包和配置构建环境并启动TaskManager；

**5、** TaskManager启动后向JobManager发送心跳包，并等待JobManager向其分配任务；

## 3. Flink Streaming DataFlow

[Apache Flink 1.11 Documentation: Glossary](https://ci.apache.org/projects/flink/flink-docs-release-1.11/concepts/glossary.html#glossary)

## 3.1. Dataflow、Operator、Partition、SubTask、Parallelism

**1、** Dataflow:Flink程序在执行的时候会被映射成一个数据流模型；

**2、** Operator:数据流模型中的每一个操作被称作Operator,Operator分为:Source/Transform/Sink；

**3、** Partition:数据流模型是分布式的和并行的,执行中会形成1~n个分区；

**4、** Subtask:多个分区任务可以并行,每一个都是独立运行在一个线程中的,也就是一个Subtask子任务；

**5、** Parallelism:并行度,就是可以同时真正执行的子任务数/分区数；

## 3.2. Operator传递模式

数据在两个operator(算子)之间传递的时候有两种模式：

**1、** OnetoOne模式：两个operator用此模式传递的时候，会保持数据的分区数和数据的排序；如上图中的Source1到Map1，它就保留的Source的分区特性，以及分区元素处理的有序性**--类似于Spark中的窄依赖**；

**2、** Redistributing模式：这种模式会改变数据的分区数；每个一个operatorsubtask会根据选择transformation把数据发送到不同的目标subtasks,比如keyBy()会通过hashcode重新分区,broadcast()和rebalance()方法会随机重新分区**--类似于Spark中的宽依赖**；

## 3.3. Operator Chain

**1、** 客户端在提交任务的时候会对Operator进行优化操作，能进行合并的Operator会被合并为一个Operator，；

**2、** 合并后的Operator称为Operatorchain，实际上就是一个执行链，每个执行链会在TaskManager上一个独立的线程中执行--就是SubTask；

## 3.4. TaskSlot And Slot Sharing

- **任务槽（TaskSlot**

每个TaskManager是一个JVM的进程, 为了控制一个TaskManager(worker)能接收多少个task，Flink通过Task Slot来进行控制。TaskSlot数量是用来限制一个TaskManager工作进程中可以同时运行多少个工作线程，TaskSlot 是一个 TaskManager 中的最小资源分配单位，一个 TaskManager 中有多少个 TaskSlot 就意味着能支持多少并发的Task处理。

Flink将进程的内存进行了划分到多个slot中，内存被划分到不同的slot之后可以获得如下好处:

-TaskManager最多能同时并发执行的子任务数是可以通过TaskSolt数量来控制的

-TaskSolt有独占的内存空间，这样在一个TaskManager中可以运行多个不同的作业，作业之间不受影响。

- **槽共享(Slot Sharing)**

Flink允许子任务共享插槽，即使它们是不同任务(阶段)的子任务(subTask)，只要它们来自同一个作业。

比如图左下角中的map和keyBy和sink 在一个 TaskSlot 里执行以达到资源共享的目的。

允许插槽共享有两个主要好处：

-资源分配更加公平，如果有比较空闲的slot可以将更多的任务分配给它。

-有了任务槽共享，可以提高资源的利用率。

注意:

slot是静态的概念，是指taskmanager具有的并发执行能力

parallelism是动态的概念，是指程序运行时实际使用的并发能力

## 4. Flink运行时组件

Flink运行时架构主要包括四个不同的组件，它们会在运行流处理应用程序时协同工作，并且都是运行在Java虚拟机上的：

- 作业管理器（JobManager）：分配任务、调度checkpoint做快照
- 任务管理器（TaskManager）：主要干活的
- 资源管理器（ResourceManager）：管理分配资源
- 分发器（Dispatcher）：方便递交任务的接口，WebUI

## 4.1. 作业管理器（JobManager）

**1、** 控制一个应用程序执行的主进程，也就是说，每个应用程序都会被一个不同的JobManager所控制执行；

**2、** JobManager会先接收到要执行的应用程序，这个应用程序会包括：作业图（JobGraph）、逻辑数据流图（logicaldataflowgraph）和打包了所有的类、库和其它资源的JAR包；

**3、** JobManager会把JobGraph转换成一个物理层面的数据流图，这个图被叫做“执行图”（ExecutionGraph），包含了所有可以并发执行的任务；

**4、** JobManager会向资源管理器（ResourceManager）请求执行任务必要的资源，也就是任务管理器（TaskManager）上的插槽（slot）一旦它获取到了足够的资源，就会将执行图分发到真正运行它们的TaskManager上而在运行过程中，JobManager会负责所有需要中央协调的操作，比如说检查点（checkpoints）的协调；

## 4.2. 任务管理器（TaskManager）

**1、** Flink中的工作进程通常在Flink中会有多个TaskManager运行，每一个TaskManager都包含了一定数量的插槽（slots）插槽的数量限制了TaskManager能够执行的任务数量；

**2、** 启动之后，TaskManager会向资源管理器注册它的插槽；收到资源管理器的指令后，TaskManager就会将一个或者多个插槽提供给JobManager调用JobManager就可以向插槽分配任务（tasks）来执行了；

**3、** 在执行过程中，一个TaskManager可以跟其它运行同一应用程序的TaskManager交换数据；

## 4.3. 资源管理器（ResourceManager）

**1、** 主要负责管理任务管理器（TaskManager）的插槽（slot），TaskManger插槽是Flink中定义的处理资源单元；

**2、** Flink为不同的环境和资源管理工具提供了不同资源管理器，比如YARN、Mesos、K8s，以及standalone部署；

**3、** 当JobManager申请插槽资源时，ResourceManager会将有空闲插槽的TaskManager分配给JobManager如果ResourceManager没有足够的插槽来满足JobManager的请求，它还可以向资源提供平台发起会话，以提供启动TaskManager进程的容器；

## 4.4. 分发器（Dispatcher）

**1、** 可以跨作业运行，它为应用提交提供了REST接口；

**2、** 当一个应用被提交执行时，分发器就会启动并将应用移交给一个JobManager；

**3、** Dispatcher也会启动一个WebUI，用来方便地展示和监控作业执行的信息；

**4、** Dispatcher在架构中可能并不是必需的，这取决于应用提交运行的方式；

## 5. Flink执行图（ExecutionGraph）

由Flink程序直接映射成的数据流图是**StreamGraph**，也被称为逻辑流图，因为它们表示的是计算逻辑的高级视图。为了执行一个流处理程序，Flink需要将逻辑流图转换为物理数据流图（也叫执行图），详细说明程序的执行方式。

Flink 中的执行图可以分成四层** ：StreamGraph -> JobGraph -> ExecutionGraph -> 物理执行图**。

**Part 1：原理介绍**

Flink执行executor会自动根据程序代码生成DAG数据流图

**Part 2：Flink中的4层执行图（按顺序从上往下**

**1、****StreamGraph** ：是根据用户通过StreamAPI编写的代码生成的最初的图表示程序的拓扑结构；

**2、****物理执行图** ：JobManager根据ExecutionGraph对Job进行调度后，在各个TaskManager上部署Task后形成的“图”，并不是一个具体的数据结构；

**3、****ExecutionGraph** ：JobManager根据JobGraph生成ExecutionGraphExecutionGraph是JobGraph的并行化版本，是调度层最核心的数据结构；

**4、****JobGraph** ：StreamGraph经过优化后生成了JobGraph，提交给JobManager的数据结构主要的优化为，将多个符合条件的节点chain在一起作为一个节点，这样可以减少数据在节点之间流动所需要的序列化/反序列化/传输消耗；

**Part 3：总结描述**

**1、****StreamGraph** ：最初的程序执行逻辑流程，也就是算子之间的前后顺序--在Client上生成；

**2、****JobGraph** ：将OneToOne的Operator合并为OperatorChain--在Client上生成；

**3、****ExecutionGraph** ：将JobGraph根据代码中设置的并行度和请求的资源进行并行化规划!--在JobManager上生成；

**4、****物理执行图** ：将ExecutionGraph的并行计划,落实到具体的TaskManager上，将具体的SubTask落实到具体的TaskSlot内进行运行；

关于更多Flink内核源码解析后续更新
