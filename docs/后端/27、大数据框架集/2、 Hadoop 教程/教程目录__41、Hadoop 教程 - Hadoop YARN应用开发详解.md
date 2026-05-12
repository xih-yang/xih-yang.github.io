# 41、Hadoop 教程 - Hadoop YARN应用开发详解
- 来源：https://ddkk.com/zhuanlan/bigdata/hadoop/2/41.html
- 分类：大数据框架
- 分组：教程目录
## 1. YARN应用开发流程

YARN 的应用开发主要过程如下：

用户在 YARN 上开发应用时，需要实现如下三个模块：

- 模块一：**Application Client**：应用客户端用于将应用提交到YARN上，使应用运行在 YARN 上，同时，监控应用的运行状态，控制应用的运行；
- 模块二：**Application Master**：AM负责整个应用的运行控制，包括向 YARN 注册应用、申请资源、启动容器等，应用的实际工作在容器中进行；
- 模块三：**Application Worker**：应用的实际工作，并不是所有的应用都需要编写 worker。NodeManager 启动 AM 发送过来的容器，容器内部封装了该应用 worker 运行所需的资源和启动命令；

实现上述模块，涉及如下 3 个 RPC 协议：

- **ApplicationClientProtocol：** Client-RM 之间的协议，主要用于应用的提交；
- **ApplicationMasterProtocol：** AM-RM 之间的协议，AM 通过该协议向 RM 注册并申请资源；
- **ContainerManagementProtocol：** AM-NM 之间的协议，AM 通过该协议控制 NM 启动容器。

上述协议的定义在`hadoop-yarn-api`工程中，如下图所示：

从业务的角度看，一个应用需要分两部分进行开发，一个是**接入YARN平台**，实现上述 3 个协议，通过 YARN 实现对集群资源的访问和利用；另一个是**业务功能的实现**，这个与 YARN 本身没有太大关系。下面主要阐述如何将一个应用接入 YARN 平台。

### 1.1 客户端Client开发

客户端的主要作用是提交（部署）应用和监控应用运行两个部分，开发流程如下图所示：

#### 1.1.1 提交应用

提交应用涉及 ApplicationClientProtocol 协议中的两个方法：

- 方法一：GetNewApplicationResponse getNewApplication(GetNewApplicationRequest request)
- 从 RM 上获取全局唯一的应用 ID 和最大可申请的资源量（内存和虚拟 CPU 核数）
- 方法二：SubmitApplicationResponse submitApplication(SubmitApplicationRequest request)
- 在获取应用程序 ID 后，客户端封装应用相关的配置到 ApplicationSubmissionContext 中，通过 submitApplication 方法提交到 RM 上

具体步骤如下：

- 步骤 1：Client 通过 RPC 函数 ApplicationClientProtocol#getNewApplication 从 ResourceManager 中获取唯一的 Application ID；
- 步骤 2：Client 通过 RPC 函数 ApplicationClientProtocol#submitApplication（所有信息都封装在 ApplicationSubmissionContext 参数里）将 ApplicationMaster 提交到 ResourceManager 上；
- 步骤 3：RM 根据 ApplicationSubmissionContext 上封装的内容启动 AM；
- 步骤 4：客户端通过 AM 或 RM 获取应用的运行状态，并控制应用的运行过程；

#### 1.1.2 监控应用运行状态

应用监控涉及 ApplicationClientProtocol 协议中的如下几个方法：

- 强制杀死一个应用
- KillApplicationResponse **forceKillApplication**(KillApplicationRequest request)
- 获取应用状态，如进度等
- GetApplicationReportResponse **getApplicationReport**(GetApplicationReportRequest request)
- 获取集群度量
- GetClusterMetricsResponse **getClusterMetrics**(GetClusterMetricsRequest request)
- 获取符合条件的应用的状态(列表)
- etApplicationsResponse **getApplications**(GetApplicationsRequest request)
- 获取集群中各个节点的状态
- GetClusterNodesResponse getClusterNodes(GetClusterNodesRequest request)
- 获取RM中的队列信息
- GetQueueInfoResponse getQueueInfo(GetQueueInfoRequest request)
- 还包括获取用户权限列表和访问权限等方法。

客户端既可以从 RM 上获取应用的信息，也可以通过 AM 获取。通常为了减少 RM 的压力，使用从 AM 获取应用运行状态的方式。客户端与 AM 之间的通信使用应用内部的私有协议，与 YARN 无关。

### 1.2 AppMaster开发

AM 的主要功能是**按照业务需求，从RM处申请资源，并利用这些资源完成业务逻辑**。因此，AM 既需要与 RM 通信，又需要与 NM 通信，涉及两个协议，分别是 AM-RM 协议（ApplicationMasterProtocol）和 AM-NM 协议（ContainerManagementProtocol），如下图所示：

#### 1.2.1 AppMaster与ResourceManager交互

AM-RM 之间使用 ApplicationMasterProtocol 协议进行通信，该协议提供如下几个方法：

- 向 RM 注册 AM：
- RegisterApplicationMasterResponse **registerApplicationMaster**(RegisterApplicationMasterRequest request)
- 告知 RM，应用已经结束
- FinishApplicationMasterResponse **finishApplicationMaster**(FinishApplicationMasterRequest request)
- 向 RM 申请/归还资源，维持心跳
- AllocateResponse **allocate**(AllocateRequest request)

客户端向 RM 提交应用后，RM 会根据提交的信息，分配一定的资源来启动 AM，AM 启动后调用 ApplicationMasterProtocol 协议的 registerApplicationMaster 方法主动向 RM 注册。

完成注册后，AM 通过 ApplicationMasterProtocol 协议的 allocate 方法向 RM 申请运行任务的资源，获取资源后，通过 ContainerManagementProtocol 在 NM 上启动资源容器，完成任务。

应用完成后，AM 通过 ApplicationMasterProtocol 协议的 finishApplicationMaster 方法向 RM 汇报应用的最终状态，并注销 AM。

需要注意的是，ApplicationMasterProtocol#allocate() 方法还兼顾维持 AM-RM 心跳的作用，因此，即便应用运行过程中有一段时间无需申请任何资源，AM 都需要周期性的调用相应该方法，以避免触发 RM 的容错机制。具体看一下每一步所传递的信息：

- **AM向RM注册**
- AM 启动后会主动调用 registerApplicationMaster 方法向 RM 注册，注册信息中包括该 AM 所在节点和开放的 RPC 服务端口，以及一个应用状态跟踪 Web 接口（将在 RM 的 Web 页面上显示）。
- RM 向 AM 返回一个对象，里面包含了应用最大可申请的单个容器容量、应用访控制列表和一个用于与客户端通信的安全令牌。
- **AM向RM申请资源**
- AM 通过 allocate 方法向 RM 申请或释放资源。AM 向 RM 发送的信息被封装在 AllocateRequest 里;
- RM 接受到 AM 的请求后，扫描其上的资源镜像，按照调度算法分配全部或部分申请的资源给 AM，返回一个 AllocateResponse 对象;
- **AM通知RM应用已结束**
- 在应用完成后，AM 通知 RM 应用结束的消息，同时向 RM 提供应用的最终状态（成功/失败等）、一些失败时的诊断信息和应用跟踪地址，RM 收到通知后注销相应的 AM，并将注销结果发送给 AM，AM 收到注销成功的消息后，退出进程。

AM 通过调用 ApplicationMasterProtocol#finishApplicationMaster 方法通知 RM。

#### 1.2.2 AppMaster与NodeManager交互

AM 通过 ContainerManagementProtocol 协议与 NM 交互，包括 3 个方面的功能：启动容器、查询容器状态、停止容器，分别对应协议中的三个方法：

- 启动容器
- StartContainersResponse **startContainers**(StartContainersRequest request)
- 查询容器状态
- GetContainerStatusesResponse **getContainerStatuses**(GetContainerStatusesRequest request)
- 停止容器
- StopContainersResponse **stopContainers**(StopContainersRequest request)

AM-NM 交互过程如图：

- **AM在NM上启动容器**

AM 通过 ContainerManagementProtocol#startContainers() 方法启动一个 NM 上的容器，AM 通过该接口向 NM 提供启动容器的必要配置，包括分配到的资源、安全令牌、启动容器的环境变量和命令等，这些信息都被封装在 StartContainersRequest 中。

NM 收到请求后，会启动相应的容器，并返回启动成功的容器列表和失败的容器列表，同时还返回其上相应的辅助服务元数据。

**AM查询NM上的容器运行状态**

在应用运行期间，AM 需要实时掌握各个 Container 的运行状态，以便及时响应一些异常，如容器运行失败等。

- AM 通过 ContainerManagementProtocol#getContainerStatuses() 方法获取各个容器的运行状态。

**AM停止NM上的容器**

当一个容器运行完成后，分配给它的资源需要被回收。

- AM 通过 ContainerManagementProtocol#stopContainers() 方法停止 NM 上的容器，释放相关资源，然后通过 AM-RM 协议，将释放的资源上报给 RM，RM 完成最终的资源回收。

## 2. YARN编程库开发应用

YARN 上的应用开发分为平台接入和业务开发两个部分，其中平台接入就是实现上述三个 RPC 协议。直接实现上述协议的开发难度较高，需要处理很多细节和性能问题，如系统并发等。为此，YARN 提供了一套应用程序编程库来简化应用的开发过程，该编程库是基于事件驱动机制的，利用了 YARN 内部的服务库、事件库和状态机库，分为三个部分，与上述三个协议一一对应。

### 2.1 YARN基础库

在YARN 基础库中分为服务库、事件库和状态机库，具体说明如下。

#### 2.1.1 服务库

YARN 中普遍采用基于服务的对象管理模型，将一些生命周期较长的对应服务化，YARN 提供一套抽象的接口对服务进行了统一描述，该服务具有如下特点：

- 具有标准状态，所有服务都具有 4 个状态，NOTINITED、INITED、STARTED、STOPPED；
- 状态驱动，服务状态变化将触发一些动作，使其转变成另一种状态；
- 服务嵌套，一个服务可以由其他服务组合嵌套而来；

#### 2.1.2 事件库

YARN 中大量采用了基于事件驱动的并发模型，该模型由事件、异步调度器和事件处理器三个模块组成。处理请求被抽象为事件，放入异步调度器的事件队列中，调度线程从事件队列中取出事件分发给不同的事件处理器，事件处理器处理事件，产生新的事件放入事件队列，如此循环，直到处理完成（完成事件）。

#### 2.1.3 状态机库

YARN 中使用转换前状态、转换后状态、事件、回调函数四元组来表示一个状态变换，一个或多个事件的到来，触发绑定在对象上状态转移函数，使对象的状态发生变化。状态机使得事件处理变得简单可控。

总的来说，YARN 中的服务由一个或多个含有有限状态机的事件处理系统组成，总体框架如下。

### 2.2 YARN编程库

#### 2.2.1 YARN应用客户端库

YARN 的 Client-RM 编程库位于`org.apache.hadoop.yarn.client.YarnClient`（Hadoop-yarn-api项目），该库实现了通用的 ApplicationClientProtocol 协议，提供了重试机制。用户利用该库可以快速开发 YARN 应用的客户端程序，而不需要关心 RPC 等底层接口。

用户开发自己的应用客户端时，只要设置好 ApplicationSubmissionContext 对象，调用 YarnClient 的相关接口，即可实现应用的提交。

#### 2.2.2 AM-RM编程库

AM-RM 编程库主要简化了 AM 向 RM 申请资源过程的开发。YARN 提供了两套 AM-RM 编程库，分别为阻塞式和非阻塞式模式。

其中，AMRMClient 是阻塞式的，实现了 ApplicationMasterProtocol 协议，用户调用该类的相应接口，可实现 AM 与 RM 的通信。而 AMRMClientAsync 是 AMRMClient 的非阻塞式封装，所有响应通过回调函数的形式返回给用户，用户实现自己的 AM 时，只需要实现 AMRMClientAsync 的 CallbackHandler 即可。

#### 2.2.3 NM编程库

NM 编程库对 AM 和 RM 与 NM 之间的交互进行了封装，同样有阻塞式和非阻塞式两种封装（AM 与 NM 和 RM 与 NM 的交互逻辑相似）。

同样的，对于异步编程库 NMClientAsync，用户只需要在自己的 AM 上实现相应的回调函数，就可以控制 NM 上 Container 的启动/停止和状态监控了。

总得来说，YARN 是一个资源管理平台，并不涉及业务逻辑，具体的业务逻辑需要用户自己去实现。YARN 的核心作用就是分配资源、保证资源隔离。
