# 09、Flink 基础 - Flink运行架构
- 来源：https://ddkk.com/zhuanlan/bigdata/flink/2/9.html
- 分类：大数据框架
- 分组：教程目录
## 一、Flink运行的四大组件

如下图所示，Flink运行的四大组件:

## 1,1 作业管理器（JobManager）

控制一个应用程序执行的主进程，也就是说，每个应用程序都会被一个不同的JobManager 所控制执行。

JobManager 会先接收到要执行的应用程序，这个应用程序会包括：作业图（JobGraph）、逻辑数据流图（logical dataflow graph）和打包了所有的类、库和其它资源的JAR包。

JobManager 会把JobGraph转换成一个物理层面的数据流图，这个图被叫做“执行图”（ExecutionGraph），包含了所有可以并发执行的任务。

JobManager 会向资源管理器（ResourceManager）请求执行任务必要的资源，也就是任务管理器（TaskManager）上的插槽（slot）。一旦它获取到了足够的资源，就会将执行图分发到真正运行它们的TaskManager上。而在运行过程中，JobManager会负责所有需要中央协调的操作，比如说检查点（checkpoints）的协调。

## 1.2 任务管理器（TaskManager）

Flink中的工作进程。通常在Flink中会有多个TaskManager运行，每一个TaskManager都包含了一定数量的插槽（slots）。插槽的数量限制了TaskManager能够执行的任务数量。

启动之后，TaskManager会向资源管理器注册它的插槽；收到资源管理器的指令后，TaskManager就会将一个或者多个插槽提供给JobManager调用。JobManager就可以向插槽分配任务（tasks）来执行了。

在执行过程中，一个TaskManager可以跟其它运行同一应用程序的TaskManager交换数据。

## 1.3 资源管理器（ResourceManager）

主要负责管理任务管理器（TaskManager）的插槽（slot），TaskManger 插槽是Flink中定义的处理资源单元。

Flink为不同的环境和资源管理工具提供了不同资源管理器，比如YARN、Mesos、K8s，以及standalone部署。

当JobManager申请插槽资源时，ResourceManager会将有空闲插槽的TaskManager分配给JobManager。如果ResourceManager没有足够的插槽来满足JobManager的请求，它还可以向资源提供平台发起会话，以提供启动TaskManager进程的容器。

## 1.4 分发器（Dispatcher）

可以跨作业运行，它为应用提交提供了REST接口。

当一个应用被提交执行时，分发器就会启动并将应用移交给一个JobManager。

Dispatcher也会启动一个Web UI，用来方便地展示和监控作业执行的信息。

Dispatcher在架构中可能并不是必需的，这取决于应用提交运行的方式。

## 二、任务提交流程

## 2.1 非yarn模式的任务提交流程

## 2.2 任务提交流程（YARN）

## 三、 任务调度原理

**1、** 客户端不是运行时和程序执行的一部分，但它用于准备并发送dataflow(JobGraph)给Master(JobManager)，然后，客户端断开连接或者维持连接以等待接收计算结果而JobManager会产生一个执行图(DataflowGraph)；

**2、** 当Flink集群启动后，首先会启动一个JobManger和一个或多个的TaskManager由Client提交任务给JobManager，JobManager再调度任务到各个TaskManager去执行，然后TaskManager将心跳和统计信息汇报给JobManagerTaskManager之间以流的形式进行数据的传输上述三者均为独立的JVM进程；

**3、** Client为提交Job的客户端，可以是运行在任何机器上（与JobManager环境连通即可）提交Job后，Client可以结束进程（Streaming的任务），也可以不结束并等待结果返回；

**4、** JobManager主要负责调度Job并协调Task做checkpoint，职责上很像Storm的Nimbus从Client处接收到Job和JAR包等资源后，会生成优化后的执行计划，并以Task的单元调度到各个TaskManager去执行；

**5、** TaskManager在启动的时候就设置好了槽位数（Slot），每个slot能启动一个Task，Task为线程从JobManager处接收需要部署的Task，部署启动后，与自己的上游建立Netty连接，接收数据并处理；

## 四、 TaskManger与Slots与parallelism

**1、** Flink中每一个TaskManager都是一个JVM进程，它可能会在独立的线程上执行一个或多个子任务；

**2、** 为了控制一个TaskManager能接收多少个task，TaskManager通过taskslot来进行控制（一个TaskManager至少有一个slot）；

**3、** 图中每个TaskManager中的Slot为3个，那么两个TaskManager一共有六个Slot,而这6个Slot代表着TaskManager最大的并发执行能力，一共能可以执行6个task进行同时执行；

**4、** Slot是静态概念，代表着TaskManager具有的并发执行能力，可以通过参数taskmanager.numberOfTaskSlots进行配置；

**5、** 为了控制一个TaskManager能接收多少个task，TaskManager通过taskslot来进行控制（一个TaskManager至少有一个slot）；

**6、** 图中Source和Map是一个Task，且并行度(我们设置的setParallelism())都为1，指这个task任务的并行能力为1，只占用一个Slot资源；

**7、** 在第二张图中为Flink的共享子任务，如果一个TaskManager一个slot，那将意味着每个taskgroup运行在独立的JVM中（该JVM可能是通过一个特定的容器启动的），而一个TaskManager多个slot意味着更多的subtask可以共享同一个JVM而在同一个JVM进程中的task将共享TCP连接（基于多路复用）和心跳消息它们也可能共享数据集和数据结构，因此这减少了每个task的负载；

**8、** 并行度parallelism是动态概念，即TaskManager运行程序时实际使用的并发能力，可以通过参数parallelism.default进行配置；

[外链图片转存失败,源站可能有防盗链机制,建议将图片保存下来直接上传(img-hmsi9NJo-1634546295296)(https://upload-images.jianshu.io/upload_images/2638478-d32b23bef8e8c475.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)]

**1、** 也就是说，假设一共有3个TaskManager，每一个TaskManager中的分配3个TaskSlot，也就是每个TaskManager可以接收3个task，一共9个TaskSlot，如果我们设置parallelism.default=1，即运行程序默认的并行度为1，9个TaskSlot只用了1个，有8个空闲，因此，设置合适的并行度才能提高效率；

**1、** 一个特定算子的子任务（subtask）的个数被称之为其并行度（parallelism），我们可以对单独的每个算子进行设置并行度，也可以直接用env设置全局的并行度，更可以在页面中去指定并行度；

**2、** 最后，由于并行度是实际TaskManager处理task的能力，而一般情况下，一个stream的并行度，可以认为就是其所有算子中最大的并行度，则可以得出在设置Slot时，在所有设置中的最大设置的并行度大小则就是所需要设置的Slot的数量；

## 五、 程序与数据流

**1、** 所有的Flink程序都是由三部分组成的：Source、Transformation和Sink；

**2、** Source负责读取数据源，Transformation利用各种算子进行处理加工，Sink负责输出；

**3、** 在运行时，Flink上运行的程序会被映射成“逻辑数据流”（dataflows），它包含了这三部分；

**4、** 每一个dataflow以一个或多个sources开始以一个或多个sinks结束dataflow类似于任意的有向无环图（DAG）；

**5、** 在大部分情况下，程序中的转换运算（transformations）跟dataflow中的算子（operator）是一一对应的关系；

## 六、 执行图（ExecutionGraph）

**1、** Flink中的执行图可以分成四层：StreamGraph->JobGraph->ExecutionGraph->物理执行图；

**2、** StreamGraph：是根据用户通过StreamAPI编写的代码生成的最初的图用来表示程序的拓扑结构；

**3、** JobGraph：StreamGraph经过优化后生成了JobGraph，提交给JobManager的数据结构主要的优化为，将多个符合条件的节点chain在一起作为一个节点；

**4、** ExecutionGraph：JobManager根据JobGraph生成ExecutionGraphExecutionGraph是JobGraph的并行化版本，是调度层最核心的数据结构；

**5、** 物理执行图：JobManager根据ExecutionGraph对Job进行调度后，在各个TaskManager上部署Task后形成的“图”，并不是一个具体的数据结构；

## 七、 数据传输形式

**1、** Flink采用了一种称为任务链的优化技术，可以在特定条件下减少本地通信的开销为了满足任务链的要求，必须将两个或多个算子设为相同的并行度，并通过本地转发（localforward）的方式进行连接；

**2、** 相同并行度的one-to-one操作，Flink这样相连的算子链接在一起形成一个task，原来的算子成为里面的subtask；

**3、** 并行度相同、并且是one-to-one操作，两个条件缺一不可；

**4、** 而为什么需要并行度相同，因为若flatMap并行度为1，到了之后的map并行度为2，从flatMap到map的数据涉及到数据由于并行度map为2会往两个slot处理，数据会分散，所产生的元素个数和顺序发生的改变所以有2个单独的task，不能成为任务链；
