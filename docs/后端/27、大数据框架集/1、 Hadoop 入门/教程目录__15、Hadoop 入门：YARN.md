# 15、Hadoop 入门：YARN
- 来源：https://ddkk.com/zhuanlan/bigdata/hadoop/1/15.html
- 分类：大数据框架
- 分组：教程目录
## YARN

[YARN官方文档](https://hadoop.apache.org/docs/stable/hadoop-yarn/hadoop-yarn-site/YARN.html)

### YARN的介绍

YARN是一个通用的**资源管理系统和调度平台**

**资源管理系统**：集群的硬件资源，和程序运行相关，比如内存、CPU等

**调度平台**：多个程序同时申请计算，资源如何分配，调度的规则/算法。

### YARN的架构

上图中我们可以清晰的看到YRAN的三大组件：

- **集群物理层面：****Resource Manager**、**Node Manager**
- **App层面：****Application Master（App Mstr）**

另外还有：

- **Client**客户端
- **Container**容器（资源的抽象）

#### 三大组件

- **Resource Manager（RM）**

YARN集群中的**主角色**，决定系统中所有应用程序之间资源分配的最终权限，即最终仲裁者。接收用户的作业提交，并通过N分配、管理各个机器上的计算资源

- **Node Manager（NM）**

YARN集群中的**从角色**，一台机器上一个，负责管理本机器上的计算资源。根据RM命令，启动Container容器、监视容器的资源使用情况。并且向RV主角色汇报资源使用情况。

- **Application Master（AM）**

用户提交的每一个应用程序都包含一个AM。应用程序中的管理者，负责程序内部各阶段的资源申请，监督程序的执行情况。

#### 程序提交YARN交互流程

**核心交互流程：**

交互
流程

MR作业提交
Client -> RM

资源申请
App Mstr -> RM

MR作业状态汇报
Container(Map|Reduce Task) -> Container(App Mstr)

节点状态汇报
NM -> RM

**整体概述：**

当用户向 YARV 中提交一个应用程序后，YARN将分两个阶段运行该应用程序，

- 第一个阶段是**客户端申请资源启动运行本次程序的ApplicationMaster**；
- 第二个阶段是由**ApplicationMaster根据本次程序内部且体情况，为它申请资源，并监控它的整个运行过程**，直到运行完成。

#### MR提交YARN交互流程

**1、** 用户通过客户端向YARN中的RM提交应用程序；

**2、** RM为该应用程序分配一个Container容器，并与NM通信，要求其在这个容器中启动这个应用程序的AppMstr；

**3、** AppMstr启动成功后向RM注册并保持通信，如此用户就可以通过RM查看App的运行状态；

**4、** AppMstr为本次App内部的各个Task向RM申请资源，并监控运行；

**5、** 一旦AppMstr申请到资源，就与NM通信要求其启动任务；

**6、** NM为任务设置好运行环境后，将任务启动命令写入一个脚本中，通过运行该脚本启动任务；

**7、** 各个任务通过某个RPC协议向AppMstr汇报自己的状态和进度，以让ApplicationMaster随时掌握各个任务的运行状态，从而可以在任务失败时重新启动任务在App运行过程中，用户可随时通过RPC向AppMstr查询应用程序的当前运行状态；

**8、** 应用程序运行完成后，AppMstr向RM注销并关闭自己；

### 资源调度器Scheduler

在理想情况下，应用程序提出的请求将立即得到YARN批准。但是实际中，**资源是有限的**，并且在繁忙的群集上 ，应用程序通常将需要等待其某些请求得到满足。YARN调度程序的工作是根据一些定义的策略为应用程序分配资源。

在YARN中，负责给应用分配资源的就是Scheduler，它是ResourceManager的核心组件之一。**Scheduler完全专用于调度作业**，它无法跟踪应用程序的状态。

一般而言 ，调度是一个难题，并且没有一个“最佳” 策路，为此，YARN提供了多种调度器和可配置的策路供选择。

#### 三种调度器

YARN默认使用容量调度器，需要修改可在**yarn-site.xml**中的**yarn.resourcemanager.scheduler.class**中配置

**FIFO Scheduler（先进先出调度器）** ：

完全按照时间，即先提交先运行。调度工作不考虑优先级和范围，适用于负载较低的小规模集群，当使用大规模共享集群时，他的效率低且会导致一些问题。

**Capacity Scheduler（容量调度器）** ：

允许多个组织共享集群资源，每个组织都可以获得集群的一部分计算能力。即通为组织分配专门的队列，然后再为每个队列分配一定的集群资源。

**Fair Scheduler（公平调度器）** ：

是一种公平的共享大型集群中资源的另一种方式，使所有应用在平均的情况下随着时间的流逝可以获得相等的资源份额。公平调度可以在多个队列之间工作，允许资源共享和抢占。
