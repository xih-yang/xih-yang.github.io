# 19、Flink 实战 - Flink架构 JobManager TaskManager Task SubTask Slot
- 来源：https://ddkk.com/zhuanlan/bigdata/flink/6/19.html
- 分类：大数据框架
- 分组：教程目录
## 一、前言

最近发现玩游戏有点过头，夜里2点多还在玩，玩了一千多场亚瑟，拿到了第2次16.0分。感觉自己挺厉害，其实还是个菜。

打算最近不能玩王者了，太容易上瘾，只要有时间控制不住的玩。而且我自己特别喜欢玩1V1，虽然几分钟一局，但是不停的玩也能玩一两个小时。

记得最近一次玩，是和某市区前100的孙尚香，耗了13分钟，终于越塔斩杀。胜利后立马点击投降，退出，卸载游戏，那时都夜里2点了吧。

都不记得删了多少次王者荣耀，又多少次没隔一两天就安装回来。每次都想着不能玩了，删掉它，要好好学习。可每次都啪啪打脸，又装回来，还是游戏香。

自己的自律能力太差，想想必须戒掉。生活中还有很多别的事情要做，比如把Flink基础学完吧。我每次看到好的教程，收藏从未停止，学习从未开始。

## 二、Flink架构

上图是Flink官网经典的图，在很多博客都这个图。

- 左侧白色背景的框Flink Program是Flink程序，它其实**不属于**Flink架构，其中Client与JobManager通信
- JobManager**控制**着当个程序的执行，相当于大老板
- TaskManager是Flink的**工作**进程，一般集群里有多个，相当于一群苦逼的打工人

### 1. JobManager

JobManager协调和管理程序的执行。

他的主要职责包括：任务调度，检查点(checkpoints)管理，故障恢复

**1、****Flink客户**端负责把GobGraph(作业图)发送给**JobManager**；

**2、****JobManager**再生产ExecutionGraph(执行图)发送给**TaskManager**；

**3、****JobManager**将**TaskManager**执行返回的结果再返回给**Flink客户端**；

**JobManager**的内部主要包含3个部分，**JobMaster**、**ResourceManager**和**Dispatcher**。

#### 1.1 JobMaster

由于早期Flink版本迭代以及中文文档比较少也比较乱。容易把JobManager和JobMaster混为一谈。

对于JobMaster，Flink Dispatcher通过JobManagerRunner将JobGraph发给JobMaster，JobMaster然后将JobGraph转换为ExecutionGraph，并分发给TaskManager执行。

#### 1.2 ResourceManager

ResourceManager是负责资源管理，整个Flink集群只有一个。这个资源其实就是管理任务管理器的插槽slot。

注意：这个ResourceManager不是Yarn的，是Flink内置的资源管理器。

Yarn也有个ResourceManager，如果用Yarn模式，Yarn会自动管理分配资源(TaskManager的插槽)。

#### 1.3 Dispatcher

Dispatcher提供一个REST接口让我们提交Job给JobManager（其实给JobManager中的JobMaster）。

### 2. TaskManager

- Flink通常有多个TaskManager，每一个TaskManager包含一定数量的插槽slot。
- 插槽的数量限制了TaskManager能够执行的任务数量。
- Flink启动后，TaskManager会向资源管理器注册它的插槽。

#### 2.1 Task和SubTask

- 图的上面一部分是**condensed view**，是**逻辑图** ，也就是client给JobManager的JobGraph。
- 图的下面一部分是**parallelized view**，是**执行图**，是JobManager根据JobGraph+并行度计算得到。
- Task和Subtask是**不同层面**上的概念，**不能**简单的说Subtask是Task的子任务。
- Task是**逻辑图**上的，Task是**逻辑概念**，一个Operator就代表一个Task（多个Operator被chain之后产生的新Operator算一个Operator）。
- 真正运行的时候，Task会按照并行度分成多个Subtask，**Subtask是执行/调度的基本单元**。 每个Subtask需要一个**线程**来执行。

**可以看出上图中有5个subtask。记住这个在下面插槽的概念中有用。**

#### 2.2 Slot 插槽

TaskManager是一个**JVM进程**，在TaskManager中可以并行运行一到多个**Subtask**。

每个**Subtask**是一个**线程**，需要TaskManager为其分配相应的资源(**内存**)，TaskManager使用Task Slot给Subtask分配资源。

通过调整 task slot 的数量，用户可以定义 subtask 如何互相隔离。

上一节**5个**绿色圆圈中的**Subtask**分配到不同的slot中。

当前并行度是**2**，此时占了**5个slot**。最右侧的那个slot空闲了。

默认情况下，Flink 允许 subtask 共享 slot，即便它们是不同的 task 的 subtask，**只要是来自于同一作业即可**。结果就是一个 slot 可以持有整个作业管道。

把**并行度改成6**，此时占了**6个slot**。此时slot利用率很高。

- 同一个application，也即同一个job中，多个 不同task的 subTask，可以运行在同一个 slot 资源槽中。
- 同一个 task 中的多个的 subTask，不能运行在一个 slot 资源槽中，他们可以分散到其他的资源槽中。
