# 23、Spark 教程 - Spark on K8s 在茄子科技的实践
- 来源：https://ddkk.com/zhuanlan/bigdata/spark/2/23.html
- 分类：大数据框架
- 分组：教程目录
### Spark 与云原生

Spark 作为开源社区优秀的大数据计算引擎，极大地提高了传统 Hadoop 生态下大数据计算的效率。随着云计算时代的发展，给大数据开发者带来了便利的同时也带来了新的挑战。

#### 1. 传统大数据计算集群的缺陷

首先来看一下传统 Hadoop 生态下的大数据集群有哪些缺陷。

（1）第一个缺陷是**成本高**，我们需要维护多个集群，还需要非常专业的运维人员才能去维护非常多的组件，如 Hadoop、Hive、ZooKeeper 等等，集群运维成本非常高。另外，服务器本身裸机价格和物理硬件的维护成本也是非常高的。还有 Hadoop 生态下的 HDFS 为了高可用，通常得维护多个副本，这就导致了大量的数据冗余，相对应的成本也会非常高。

（2）第二个缺陷就是**灵活性比较低**，一是没有办法做到非常高效的节点伸缩，需要提前预估业务需要多少资源，然后再去搭建环境。二是版本升级会比较困难，每个节点都有一套环境，且有可能同时运行不同版本的环境，在统一做升级的时候是很困难的。

（3）第三个缺陷就是**存算耦合**，Hadoop 集群既是存储节点，又是计算节点。当数据量非常大，而计算量并没有那么大的情况下，存储资源扩容时，计算资源如 CPU 内存这些也必须要跟着扩容。会导致存算不匹配的情况，带来大量的资源浪费。

#### 2. 公有云带来的优势

**公有云具有两大方面的优势：**

（1）首先，公有云上拥有非常廉价的对象存储，且不需要预留空间，也不需要专业运维人员维护，直接用就可以了。

（2）另一个优势就是弹性计算，在云上不需要自己去维护物理服务器，它有非常好的弹性虚拟机，根据使用时长来收费，不需要去提前准备物理服务器，也不需要专业的运维人员来运维。同时公有云上还有一种更加廉价的机型，叫做 spot 实例，或者叫可抢占式的虚拟机。我们可以利用这种非常廉价的弹性计算节点来运行我们的计算任务。

#### 3. 如何充分利用公有云带来的优势？

如何充分利用公有云带来的优势呢？

首先，大多数的云服务商都提供了云上的 Hadoop 集群产品，如 AWS EMR。EMR 相当于一套搭建好的 Hadoop 集群。在 EMR 里面，你可以使用云上廉价的对象存储来替代 HDFS 存储数据，同时，EMR 类产品往往会提供一定的伸缩能力，不同的云商的伸缩能力可能有所不同，但或多或少会有一些弹性伸缩的能力。

#### 4. EMR 类产品的缺陷

EMR产品是否是最佳的云上使用方式？既然云上有了这样的产品，我们是不是用它就好了？答案是否定的，因为它也存在一些缺陷：首先，虽然 EMR 这类产品已经简化了很多的部署操作，但是 EMR 部署好了之后，上面那些组件仍然需要一些相对专业的人员来维护，可能要改一些配置，或者给用户提供一些环境等等，依旧是一个相对复杂的环境。另外，Yarn 作为一个资源调度器，它本身要消耗一定的资源，也受限于框架，Yarn 是 Java 写的，它需要运行在 JVM 之上，JVM 是一个需要内存非常多的环境，所以集群通常是需要预留 25% 左右的内存资源，当然也可以相对调低一些，但是也不能做到很低，否则它的调度器可能就会有问题。这样会导致内存效率比较低。

#### 5. 传统 Hadoop 生态，三大组件的前世今生

针对这些缺陷，我们有没有什么好的方式来解决？回到 Hadoop，传统的 Hadoop 生态主要的三组件 HDFS、MapReduce、Yarn。其中 HDFS，我们有云上更廉价的对象存储来替代它，且对象存储在各方面显然是优于 HDFS 的。计算引擎方面，MapReduce 可以用 Spark 来替换，Spark 的效率和性能优于 MapReduce。

#### 6. Spark on K8s 的优势

我们选择用 K8s 来代替 Yarn 作为 Spark 作业的资源调度器。**其优势之一是，**它的部署环境非常简单，我们现在使用的是云上托管的 K8s 服务，我们不需要去维护它的控制节点，当然每个云服务的 EMR 都有自己的产品，如 AWS 的 EKS，华为云的 CCE，谷歌的 GKE。这种类似的产品，我们不需要维护它的控制节点，也不需要在上面常驻任何 Spark 的服务就可以运行 Spark 作业。另外它也没有环境依赖，因为运行时所有的大数据作业都是容器化的，不需要节点上有一些提前预置好的环境，也就决定了运行的时候多版本可以共存。

**第二点优势**是其弹性优势。无论我们使用涉及开源的 K8s 的 cluster-auto scaler 插件，还是某些云商自己实现的基于 K8s 的更高效的扩缩容机制，都可以保证集群能够极快地自动扩缩容。这个时候，因为可以快速的把不用的节点关闭，也就相应地节约了计算的成本。

**第三点优势，**它没有按节点来收取服务费用，只需要收取一个控制面的服务费用，这个服务费用是非常低的，在公司级的资源使用下，这部分的费用几乎是可以忽略不计的。

第四点优势，它有更高的资源使用率。它是使用 go 语言编写的 kubelet 服务，它所需要预留的资源会远远低于 JVM 上所需要的，其节点利用率可以达到 90% 甚至更高。

Spark on K8s 就是我们在云原生场景下做出的一个选择。

### Spark on K8s 原理介绍

接下来介绍 Spark on K8s 的原理。

#### 1. Spark 的集群部署模式

Spark 官方提供了四种集群部署的模式：Standalone、YARN、Mesos、 Kubernetes。**Standalone** 需要常驻 Master 服务和 Worker 服务。它作为资源调度，只能去调度 Spark 做作业。同时它需要每个节点预先准备好 Spark 运行时环境，所以不太适合生产环境使用。**YARN** 在传统的大数据体系下是一个比较好的调度器。它不需要常驻 Spark 相关的服务，YARN 的容器内其实也是可以进行任何作业的，但是需要每个节点去事先准备好运行时环境，YARN 其实是更贴近于我们的传统 Hadoop 生态，它也有一些调度上的优化，比如计算时会尽可能地去找数据所在的 HDFS 节点，不过在我们云原生的场景下就不太适用了。**Mesos** 在 Spark 3.2 版本后已经被标记为弃用了，所以我们就不过多谈它。**Kubernetes** 也是无需常驻 Spark 相关服务，支持容器化运行任何作业，也不需要依赖节点运行时环境，它是更贴近于云原生生态的。

#### 2. Spark on k8s 如何运行

首先Spark 有一个客户端，客户端会构建好 driver pod 对象，向 K8s 的 apiserver 发送请求，去创建 driver pod，Spark 的 driver 进程运行在 driver pod 当中。Spark driver 启动之后，会在 driver 内构建 executor pod 的对象，创建 executor pod，并持续 watch and list 去监听每一个 executor pod 的状态。当任务运行结束的时候，executor pod 会被清理，driver pod 会继续以 completed 的状态存在。这就是 Spark on K8s 的运行过程。

#### 3. Spark 的 dynamicAllocation 功能

Spark 有一个 dynamic allocation 的功能，可以基于 task 数去动态调整 Spark 作业所需要的 executor 个数。

因为Spark 的 shuffle 是依赖本地存储的，在 on YARN 模式下，它必须要基于另外一个External Shuffle Service 服务才能启用动态扩缩的功能，但是 External Shuffle Service 无法在 K8s 环境下部署。这种场景下，Spark on K8s 引入了 shuffleTracking 的功能，它能够追踪每一份 shuffle 数据是否被之后的 stage 所引用。当一个 executor 上的 shuffle 数据没有后续的 stage 引用时， 这个 executor 可以被缩容。如上图，第一个 stage 可能产生了一些 shuffle 数据，第二个 stage 的前两个 executor 需要读取 stage1 的数据。第三个 executor 不需要读取 stage1 的数据，stage1 可能落了一些 shuffle 数据被 stage2 所依赖，到 stage3 的时候，stage1 的 shuffle 数据可能就不需要了，它只需要 stage2 产生的 shuffle 数据。这个时候 excutor-3 上就没有后续 stage4 所需要的数据，所以这个时候就可以把 exec-3 给缩掉，等到了 stage4 的时候，它可能又需要更多的节点来计算了，这时候就可以再去扩容出新的 exec-4。

#### 4. Spark 如何获取云服务的访问权限

Spark 如何获取云服务的访问权限？我们之前说过 Spark 要读取云上廉价的对象存储，要读取对象存储必然涉及到访问权限。因为在不同的云厂商，不同的租户，肯定需要不同的访问权限。Spark 读取数据主要是 executor，因为 executor 是真正负责去执行 task 的角色，所以它需要一个证明身份的东西，去云厂商那里去拿我存储的数据。Spark官方提供了 AWS S3 的访问方式。通过一个 Hadoop 的参数来指定访问对象存储的 aksk，即 access key 和 secret key，类似于我们通常所说的账号密码。如果 aksk 有访问对应对象存储的权限，你就可以访问该数据了。

通过aksk 访问对象存储资源其实是一种极不安全的方式。因为 Spark 参数都是以明文的方式去设置的，就像图中一样，aksk 一旦泄露，只要是在有网络的环境下，别人都可以去利用你的 aksk 做权限内的任何事情。

因此大多数运营商会提供一种将 K8s 的 serviceaccount 和云身份管理的系统结合的方式，把 K8s 的 RBAC 认证和云服务商的认证相结合实现 pod 级别的权限隔离。在使用的时候，我们只需要去通过参数给 Spark 指定 serviceaccount，就可以拿到域名上的权限。如下图是一个 AWS 的 IAM Role for Service Account 的原理图，它的链路非常复杂，有兴趣的同学可以了解一下。其实我们作为使用者来说，直接按文档配置好之后就可以用了。

有一点需要注意，在 Spark 2.x 的版本是没办法使用的，因为 Spark 2.x 版本的 executor pod 里面是没有赋予 service account 的，同时这个参数也是没有暴露出来的。因为我们访问数据的往往是 executor，但是 executor 又不需要去请求创建任何 K8s 的资源，所以 Spark2.x 版本是没有给 executor 赋予 serviceaccount resource 的。如果在 Spark 2.x 的版本想要使用 IAM Role for Service Account ，只能去改 Spark 的代码。

### Spark on K8s 在茄子科技的应用

#### 1. 社区发展与茄子科技应用的时间线

从上图可以看到社区发展和茄子科技应用的时间线，Spark 2.4 是 2018 年 11 月上线的，公司是在 2019 年的 6 月份正式将 Spark on K8s 应用在了生产环境。我们基于社区的 Spark 2.4.3 的版本，做了比较多的改造后应用于生产环境上线。

社区在2020 年 6 月份上线了 Spark 3.0 版本。相应的，茄子科技在 2020 年 10 月基于 Spark 3.0.1 版本上线。之所以上线很快，是因为我们在中间这段过程中一直在关注 Spark 3.0，将它的 master 分支中的一些 feature 合并到了我们的 Spark 2.4.3 版本中，所以在 Spark 3.0 正式推出上线之后，我们也就比较快速的完成了我们内部 Spark 的版本迭代。并且在上线后，很长一段时间里，我们也是将社区中可能会用到的一些 feature 不断合并到我们内部的 Spark 中，以此来快速迭代更新我们内部的 Spark 版本。

Spark 3.2 推出之后，我们为什么要上线 3.2 版本？其实很大一部分原因是 **Spark 3.2 支持 reuse pvc**，在后文中还将详细介绍这一功能。

#### 2. 我们做了什么？

下面介绍一下茄子科技为了 Spark on K8s 在生产环境的应用所做的工作。

**（1）查看 Spark web ui**

首先第一点就是解决查看 Spark web UI 比较麻烦的问题，因为 K8s 集群内的 pod 和 VPC 内的子网可能不在同一个网络平面，Spark 的每一个 pod 的网络对集群外可能是不通的，我们通过 K8s 自己的服务发现机制，即 service 和 ingress 去解决。又因为每一个 Spark 任务都是一个独立的 pod，我们没有办法提前去创建好 ingress 给到 Spark，只能通过一些方式将 Spark 任务启动的时候启动的 4040 端口的 Spark UI 服务暴露出去。我们选择的也是社区的一个组件，叫做 **CONTOUR**，它是基于 envoy 的一个组件，可以定制化一些路由规则，可以配置一个泛域名，通过监听 Spark Driver 的 service 去动态地创建出它的资源 ingressroute，然后把 Spark 的 web UI 暴露到集群之外。当然中间我们需要实现一个 Spark UI controller，去监听 Spark driver 的 service，从而调用 CONTOUR 的接口去动态创建 ingressroute 资源。有了 ingressroute 资源，CONTOUR 就可以解析 ingressroute，根据 ingressroute 的规则把对应的流量通过 envoy 转发到对应的 pod。

同时我们也在 K8s 上部署了 Spark history server，它可以查看历史的 event log。

**（2）调度优化**

另外，如果用原生的 Spark on K8s，它的 pod 调度是比较随机的，可能在启动的时候会比较分散。

上图可以看到我们在云上分为了两个可用区 AZ1 和 AZ2。每个可用区可能又有多个节点组，如 node group 1 和 node group 2。如果直接去提交两个 Spark 任务（红色和蓝色代表两个不同的任务），它的 pod 的分布可能就会比较分散。node1 上既有 driver，也有 executor，每一个节点组上也都有可能会被分配不同的 pod。这样会导致一些问题。首先，每一个 Spark 任务，它的执行的过程中，每个 executor 之间需要不断地做数据交换，要不断地做 shuffle read 和 shuffle write，这就导致了 AZ1 和 AZ2 之间是有数据传输的，有的云厂商会收取比较高的跨 AZ 数据传输的费用，这是我们不愿意见到的，是一个不必要的成本。如果每一个任务都跑在同一个 AZ 下，就不需要跨 AZ 的流量费用了。

另外，红色任务和蓝色任务比较分散，而它的执行时间又不一样长，比如红色的任务 10 分钟就结束了，而蓝色的任务要执行一个小时，当这些红色的 pod 都退出之后，会发现这个节点的资源可能已经空闲出来一半了，但是由于蓝色的任务依旧存在，此节点也是不能被缩容的，这就会导致有一半的资源没有被释放掉而空闲了 50 分钟，这就造成了极大的资源浪费。

再者，如果全用 Spot 实例，当 driver 节点被回收，整个任务就挂掉了，也就没法利用 Spark 自身的容错机制了。

这些都是调度的问题，我们所做的优化如上图所示，利用 K8s 的 nodeSelector 和它的亲和/反亲和策略，把 driver 和 executor 所属的 node group 分开，driver 运行在单独的 node group，为了防止被回收，该 node group 中的节点使用的都是按需计费的实例，并且 driver 消耗的资源本身是比较少的。executor 所属的 node group 中的节点则可以使用 sport 实例，同时每一个任务做了节点级别的亲和/反亲和策略，即我的每一个 executor 之间做软亲和的策略和不同任务的 executor 之间做强制的反亲和策略，这时它的 executor pod 绝对不会分配到同一个节点上去。这样，相同节点上只会有相同的任务，当红色任务结束时，就可以直接把 node 1、node 3、node 4 全都释放掉，只留 node 2、node 5、node 6 让它继续去运行。这就是我们在调度层面做的一个优化。

**（3）Reuse PVC 功能**

另外一个重要的功能是 Reuse PVC，我们升级 Spark 3.2 版本的一个最大的动力就是因为其推出了这个通过复用 K8s 的 PVC 来恢复 shuffle 数据的功能。这个功能可以做到在 executor 被退出的时候，executor 所写到本地的 shuffle 数据仍然能被复用。这可以避免任务的重算带来的资源浪费。

Spark 本身具有良好的容错性，它的 executor 节点就可以运行在云上的可抢占式节点上，这种节点类型的特点就是价格非常低，同时又随时有可能被回收。茄子科技内部现在是使用了大量的可抢占式节点来运行 Spark 任务。每天都会面临大量的节点回收造成的 task 重算，既浪费资源又影响效率。

如上图，有三个 executor 在 stage0 的时候做运算，它运行了 6 个 stage，但是这个时候 exec-3 被回收掉了，到了 stage1 的时候 task0.5 和 task0.6 都要重算一遍，因为上面的 shuffle 数据已经丢了。社区为了解决这个问题就推出了 Reuse PVC 功能。在 executor 被回收掉之后启动一个新的 executor，挂上之前存储 shuffle 数据的 PVC，就可以实现节点的复用。这个功能看起来很美好，但是我们在实际的测试中发现它的局限性非常大，所以效果是比较差的。

**（4）社区版 Reuse PVC 功能的局限性**

首先第一点就是恢复的准确性比较低。在开启 dynamicAllocation 的时候，是没有办法识别 pod 是怎样的退出状态的，有可能是节点回收掉了，也有可能就是 dynamic 把它正常退出掉了。这个时候它会像上图一样，exec-3 是一个正常退出，exec-4 是一个节点回收，当 exec-3 和 exec-4 它们两个挂掉之后，再启动一个 exec-5，这个 exec-5 应该挂载哪一个 PVC？在这种情况下开源版本是随机选一个，这个时候它的准确性就非常低了。很明显 PVC-3 的数据已经没有用了。

另一点就是上报 shuffle 元信息的时机会比较滞后。我们知道 Spark 的 task 执行时，写出一份 shuffle 数据，会上报给 driver 的 MapOutputTracker 这么一个对象里面去，会把它的 shuffle 的元信息如 shuffle 数据所在的 executor、executor IP、block ID 等信息上报给 driver，但是在开源版本里面的 shuffle 实现里，只有在做 shuffle writer 初始化的时候才会去触发上报的动作。所以如果在 shuffle read 阶段是没有办法复用 shuffle 数据的。

第三点是这个功能是在 KuberntesLocalDiskShuffleExecutorComponents 实现类中，这个实现类当中寻找的路径跟实际的 Cluster 模式运行环境下的路径是不太相符的。

另外Spark 本身调度的机制就是 Spark 在处理 executor lost 异常的时候，会立即重新计算丢失的 executor 上的 task，此时去 recover 旧的数据可能新的数据已经正在被计算了，所以此时复用它已经没有意义了。

基于上述问题，我们对它做了比较大的改造。

**（5）Reuse PVC 功能的改造**

首先第一点，我们要在内存中维护一个 PVC 的状态集。这个状态集随着 ExecutorPodsAllocator 这个类中接收 snapshot 更新的事件来触发 PVC 状态集的更新，以此保证 pod 的状态和 PVC 的状态一致。当创建新的 executor 的时候，优先使用 failed 状态的 PVC，再去使用 exited 的 PVC。如果这两者都没有，再去创建新的PVC。这样的机制确保了既不会让 PVC 的数量过多，又可以准确地去复用 shuffle 数据。

第二点就是在 executor 初始化的阶段上报 shuffle 信息，而不是等到 shuffle writer 初始化的时候才去上报。如上图，原版的调用栈是在 SortShuffleManager.getWriter 方法里去调 executorComponents 类的 initializeExecutor 的方法去 recoverDiskStore。我们改造之后，在 BlockManager 类里增加 initialize 方法直接去调 ShuffleManager.initShuffleManager 方法去调用上面原版的调用链。

第三点我们修复了 Spark 在 Cluster 模式下运行时寻找 shuffle 数据路径错误的问题，在 Cluster 模式下 Spark 的写出路径并不是原版所指向的以  为前缀的路径，所以在我们在 recoverDiskStore 的时候，要去寻找以  为前缀的目录内的 shuffle 数据。

第四点就是 executorLost 的问题，在 TaskSetManager 里面会有一个叫 executorLost 的事件，在处理这个事件的时候，Spark 本身会去直接重算 executor 上面丢失的 task，我们做的处理是，在开启了 Reuse PVC 的功能下，Spark 不去重算丢失的 executor 上的 task，只重算当前失败的 task，不过这个改变会相对降低 Spark 的容错性，但是在实际生产环境下，基于经验来看，这样的改变导致的容错性降低是在可接受范围内的，当进入下一个 stage 的时候，如果数据还没有被恢复，还会做 task 的重算。

**（6）Reuse PVC 功能改造前后性能对比**

从上图可以看出，在功能改造之后，对比 Saprk 3.0.1 版本，3.2.2 的性能提升效果是非常明显的。

**（7）其他工作**

我们还做了一些其它的工作。比如增加了自动删除结束的 driver pod 的功能，因为 driver pod 存在的时间长了，etcd 的压力会非常大。另外做了基于 ELK 的日志采集功能，增加了可以支持修改 pod 内部 DNS 配置的功能。我们还可以通过客户端退出的方式把服务端也退出。另外就是 Spark-sql 谓词下推和 Spark-sql 多维分析场景的优化，以及任务级别的云成本计算等工作。

#### 3. Spark on K8s 在茄子科技的使用规模

目前我们采用的是多云多区域的架构，在每个云上有多个大规模集群，单个集群的峰值在几千台，总节点规模近万台，每天有数万个任务执行。

#### 4. 未来工作

我们未来还有很多工作要做。

首先第一个工作是从根本上解决 shuffle reuse 的问题，包括性能的提升。Remote Shuffle Service 是比较火的，目前一些头部公司也做了一些开源方案，测试的性能效果都比较不错，但是最大的问题就是在极大规模集群下的性能和稳定性还有待进一步验证。如何在性能和成本之间做一个平衡，也是其中的一个挑战。

第二项是 Spark job 交互式的提交，像 Spark 本身自带的 Spark-shell，Spark-sql 脚本需要依赖客户端的环境 thrift server，thrift server 只能运行 sql，并且它本身的缺陷也比较多。Spark 目前在交互式场景下的功能还是比较单薄的，这也是我们所要做的事。

第三个就是日志查看系统，官方推荐的 ELK 这种方式依赖会比较重，部署繁琐。云商的一些日志收集系统，它的入网流量费会比较贵，Spark 日志其实大多数情况下是没用的，只有在排查一些问题或者是做一些调优的时候才会去用到。所以多数日志是可以扔掉的，但是我们又无法判断哪些是要的，哪些是不要的，所以用比较贵的存储是比较浪费的。而且此类日志收集方式都是以 pod 粒度来查看的，并不能在一个大数据开发或 Spark 使用者的角度上去看。
