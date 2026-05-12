# 03、Storm 集群架构
- 来源：https://ddkk.com/zhuanlan/bigdata/storm/3.html
- 分类：大数据框架
- 分组：教程目录
Apache Storm的主要亮点是，它是一个容错，快速，没有“单点故障”（SPOF）分布式应用程序。我们可以根据需要在多个系统中安装Apache Storm，以增加应用程序的容量。

让我们看看Apache Storm集群如何设计和其内部架构。下图描述了集群设计。

Apache Storm有两种类型的节点，Nimbus（主节点）和Supervisor（工作节点）。Nimbus是Apache Storm的核心组件。Nimbus的主要工作是运行Storm拓扑。Nimbus分析拓扑并收集要执行的任务。然后，它将任务分配给可用的supervisor。

Supervisor将有一个或多个工作进程。Supervisor将任务委派给工作进程。工作进程将根据需要产生尽可能多的执行器并运行任务。Apache Storm使用内部分布式消息传递系统来进行Nimbus和管理程序之间的通信。

组件
描述

Nimbus（主节点）
Nimbus是Storm集群的主节点。集群中的所有其他节点称为工作节点。主节点负责在所有工作节点之间分发数据，向工作节点分配任务和监视故障。

Supervisor（工作节点）
遵循指令的节点被称为Supervisors。Supervisor有多个工作进程，它管理工作进程以完成由nimbus分配的任务。

Worker process（工作进程）
工作进程将执行与特定拓扑相关的任务。工作进程不会自己运行任务，而是创建执行器并要求他们执行特定的任务。工作进程将有多个执行器。

Executor（执行者）
执行器只是工作进程产生的单个线程。执行器运行一个或多个任务，但仅用于特定的spout或bolt。

Task（任务）
任务执行实际的数据处理。所以，它是一个spout或bolt。

ZooKeeper framework（ZooKeeper框架）
 Apache的ZooKeeper的是使用群集（节点组）自己和维护具有强大的同步技术共享数据之间进行协调的服务。Nimbus是无状态的，所以它依赖于ZooKeeper来监视工作节点的状态。

ZooKeeper的帮助supervisor与nimbus交互。它负责维持nimbus，supervisor的状态。

Storm是无状态的。即使无状态性质有它自己的缺点，它实际上帮助Storm以最好的可能和最快的方式处理实时数据。

Storm虽然不是完全无状态的。它将其状态存储在Apache ZooKeeper中。由于状态在Apache ZooKeeper中可用，故障的网络可以重新启动，并从它离开的地方工作。通常，像monit这样的服务监视工具将监视Nimbus，并在出现任何故障时重新启动它。

Apache Storm还有一个称为Trident拓扑的高级拓扑，它具有状态维护，并且还提供了一个高级API，如Pig。我们将在接下来的章节中讨论所有这些功能。
