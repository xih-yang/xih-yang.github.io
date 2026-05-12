# 04、Flink 系统架构、作业提交流程
- 来源：https://ddkk.com/zhuanlan/bigdata/flink/1/4.html
- 分类：大数据框架
- 分组：教程目录
## 1.系统架构

### 1.1 整体构成

### 1.2 作业管理器（JobManager）

**控制一个应用程序执行的主进程，是Flink集群中任务管理和调度的核心**

**JobMaster**

- 是JobManager中最核心的组件，负责处理单独的作业（Job）
- 在提交作业时，JobMaster会先接受到要执行的应用，一般是由客户端提交来的（包括Jar包，数据流图（dataflow graph），和作业图（Job Graph））
- JobMaster会把JobGraph转换成一个物理层面的数据流图，这个图叫做“执行图”（Execution Graph），它柏寒了所有可以并发执行的任务。JobMaster会向资源管理器（Resource Manager）发出请求，申请执行任务必要的资源。一旦它获取到了足够的资源，就会将执行图分发到真正运行它们的TaskManager上。
- 在运行过程中，JobMaster会负责所有需要中央协调的操作，比如检查点（Checkpoints）的协调；

**资源管理器(ResourceManager)**

- ResourceManager主要负责资源的分配和管理。在Flink集群只有一个。所谓“资源”，主要是指TaskManager的任务槽（Task slots），任务槽就是Flink集群中的资源调配单元，包含了机器用来执计算的一组CPU和内存资源。每一个任务（Task）都需要分配到一个Slot上执行

**分发器（Dispatcher）**

- Dispatcher主要负责提供一个REST接口，用来提交应用，并且负责为每一个新提交的作业启动一个新的JobMaster组件。Dispatcher也会启动一个WebUI，用来方便的展示和监控作业的执行信息。Dispatcher在架构中并不是必须的，在不同的部署模式下可能会被忽略。

### 1.3 任务管理器（TaskManager）

- Flink中的工作进程。通常在Flink中会有多个TaskManager运行，每一个TaskManager都包含了一定数量的插槽（Slots）.插槽的数量限制了TaskManager能够并行处理的任务数量。
- 启动之后，TaskManager会向资源管理器注册它的插槽；收到资源管理器的指令后，TaskManager就会将一个或者多个插槽提供给JobMaster调用。JobMaster就可以向插槽分配任务（tasks）来执行了。
- 在执行过程中，一个TaskManager可以跟其他运行同一应用程序的Task Manager交换数据

## 2. 作业提交流程

### 2.1 整体构成

### 2.2 Standalone模式作业提交流程(独立模式)

### 2.3 Yarn集群

#### 2.3.1 Yarn会话模式作业提交流程

#### 2.3.2 Yarn单作业模式任务提交流程
