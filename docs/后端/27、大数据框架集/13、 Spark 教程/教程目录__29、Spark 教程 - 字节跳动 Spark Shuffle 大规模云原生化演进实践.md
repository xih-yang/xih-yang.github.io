# 29、Spark 教程 - 字节跳动 Spark Shuffle 大规模云原生化演进实践
- 来源：https://ddkk.com/zhuanlan/bigdata/spark/2/29.html
- 分类：大数据框架
- 分组：教程目录
### 背景介绍

Spark 是字节跳动内使用广泛的计算引擎，已广泛应用于各种大规模数据处理、机器学习和大数据场景。目前中国区域内每天的任务数已经超过 150 万，每天的 Shuffle 读写数据量超过 500 PB。同时某些单个任务的 Shuffle 数据能够达到数百 TB 级别。

与此同时作业量与 Shuffle 的数据量还在增长，相比去年，今年的天任务数增加了 50 万，总体数据量的增长超过了 200 PB，达到了 50% 的增长。Shuffle 是用户作业中会经常触发的功能，各种 ReduceByKey、groupByKey、join、sortByKey 和 repartition 的操作都会使用到 Shuffle。所以在大规模的 Spark 集群内，Spark Shuffle 经常会成为性能及稳定性的瓶颈。Shuffle 的计算涉及到频繁的磁盘和网络 IO 操作，主要是需要把所有节点的数据进行重新分区并组合。

#### 1.原理

在社区版 ESS 模式下默认使用的 Shuffle 模式的基本原理中，刚才提到 Shuffle 的计算会把数据进行重新分区，这里就是把 Map 的数据重新组合到所有的 Reducers 上。如果有 M 个 Mappers，和 R 个 Reducers，就会把 M 个 Mappers 的 Partition 数据分区成后面 R 个 Reducers 的 Partition。

Shuffle 的过程可以分为两个阶段——Shuffle Write 和 Shuffle Read。

Shuffle Write 的时候，mapper 会把当前的 Partition 按照 Reduce 的 Partition 分成 R 个新的 Partition，并排序后写到本地磁盘上。生成的 map output 包含两个文件：索引文件和按 Partition 排序后的数据文件。

当所有的 Mappers 写完 map output 后，就会开始第二个阶段，Shuffle Read 阶段。这个时候每个 Reducer 会向包含它的 Reducer Partition 的所有 ESS 访问，并读取对应 Reduce Partition 的数据。这里有可能会请求到所有 Partition 所在的 ESS，直到这个 Reducer 获取到所有对应的 Reduce Partition 的数据。

在Shuffle Fetch 阶段，每个 ESS 会收到所有 Reducer 的请求并返回相应的数据。这将产生 M 乘 R 级别的网络连接和随机的磁盘读写 IO，涉及到大量的磁盘读写和网络传输。这就是为什么 Shuffle 会对磁盘以及网络 IO 的请求都特别频繁的原因。

由于Shuffle 对资源的需求和消耗都非常高，所以 CPU、磁盘和网络开销都很有可能是造成 Fetch failure 的原因或 Shuffle 速度较慢的瓶颈。在字节跳动大规模的 Shuffle 场景中，同一个 ESS 节点可能需要同时服务多个商户，而这些集群没有进行 IO 的隔离，就可能会导致 Shuffle 成为用户作业失败的主要原因和痛点问题。

字节跳动从 2021 年初开始了 Spark Shuffle 的云原生化相关工作，Spark 作业与其他大数据生态开始了从 Yarn Godel 的迁移。Godel 是字节跳动基于 Kubernetes 自研的调度器，迁移时也提供了 Hadoop 上云的迁移方案——Yodel（Yarn on Godel），是一个完全兼容 Hadoop Yarn 的协议，目标是将所有大数据应用平滑地迁移到 Kubernetes 体系上。

在这套迁移工作中，ESS 也做了定制化的相关工作，完成了从之前 Yarn Node Manager 模式下的 Yarn Auxiliary Service 迁移至 Kubernetes DaemonSet 部署模方式的适配工作，并开始 Shuffle 作业的迁移工作。历时两年，在 2023 年，顺利将所有大数据应用包括 Spark 应用都迁移到了如今的云原生生态上。

#### 2.挑战

在云原生化的迁移过程中，也遇到了很多挑战：

- 首先，从 NM 迁移到 DaemonSet 的过程中，DaemonSet 上 ESS 的 CPU 有非常严格的限制，而在之前的 NM 模式下，ESS 基本上可以使用所有的 CPU 资源。所以在这个迁移实践中，往往最开始设置的 ESS 的 CPU 资源是不够的，需要经过持续不断的调整。后续，某些高优集群甚至直接放开对 ESS 的 CPU 使用。
- 同时，DaemonSet 和 Pod 对 Spark 作业的 CPU 有更严格的限制。这也导致不少用户的作业迁移到了新的架构后变得更加缓慢了。这是因为在之前的模式下，CPU 是有一定的超发的，因此需要对这个情况进行调整。我们在 Kubernetes 和 Godel 架构下开启了 CPU Shares 模式，使用户在迁移过程中感知不到性能上的差异。
- 另外，Pod 对内存的限制也非常严格，这导致 Shuffle Read 时无法使用空闲的 page cache 资源，从而导致 Shuffle Read 时 page cache 的命中率非常低。这个过程会带来更多的磁盘 IO 开销，导致整体性能变差。对此我们采取了相应的措施，通过适当开放 Pod 对 page cache 的使用，降低 Shuffle 在迁移后对性能的影响。

#### 3.收益

完成迁移工作之后，我们成功地将所有的离线资源池完成统一，在调度层面能够更友好地实施一些优化和调度策略，从而提高整体的资源使用率。ESS Daemonset 相比于 Yarn Auxilary Service 也获得了不少的收益。首先，ESS DaemonSet 被独立出来成为一个服务，脱离与 NM 的紧耦合，减少了运维成本。另外，Kubernetes 和 Pod 对 ESS 资源的隔离也增加了 ESS 的稳定性，这意味着 ESS 不会再受到其他作业或者节点上其它服务的影响。

云原生化后的 Spark 作业目前有两个主要的运行环境：

- **稳定资源集群环境**。这些稳定资源的集群主要以服务高优和 SLA 的任务为主。部署的磁盘是性能比较好的 SSD 磁盘。对于这些稳定资源集群，主要使用基于社区、深度定制化后的 ESS 服务。使用 SSD 磁盘，ESS 读写，也可以使用到本地的高性能 SSD 磁盘。部署在 Daemonset 模式，Godel 架构下。
- **混部资源集群环境**。这些集群主要服务于中低游的作业，以一些临时查询、调试或者测试任务为主。这些集群的资源主要都部署在 HDD 磁盘上，有些是通过线上资源出让或与其他服务共用的或者其他线上的服务共同部署的一些资源。这就导致集群的资源都不是独占的，整体的磁盘性能以及储存环境也都不是特别优异。

### 稳定资源场景

在稳定集群环境中，存在较多的高优作业，首要任务是提高这些作业 Shuffle 的稳定性，以及运行时的作业时长，以确保这些作业的 SLA。为了解决 Shuffle 的问题，对 ESS 深度定制了以下三方面能力：增强 ESS 的监控/治理能力、增加 ESS Shuffle 的限流功能、增加 Shuffle 溢写分裂功能。

#### 1. ESS深度定制

**（1）增强 ESS 的监控及治理能力**

在监控方面，我们使用开源版本的过程中发现现有的监控不足以深度排查遇到的 Shuffle 问题和当前的 ESS 状况。这就导致没有办法快速定位是哪些节点造成的 Shuffle 问题，也没有办法感知到有问题的节点，因此，我们对监控能力进行了一些增强。

首先，我们增加了监控 Shuffle 慢和 Fetch Rate 能力的一些关键指标，包括 Queued Chunks 和 Chunk Fetch Rate。Queued Chunks 用于监控当前请求 ESS 节点上请求的堆积，而 Chunk Fetch Rate 用于监控这些节点上请求的流量。同时，我们还将 ESS 的 Metrics 指标接入了字节跳动的 Metrics 系统，使我们能够通过系统提供的 Application 维度的指标快速定位 ESS 节点的堆积情况。在用户界面 (UI) 方面，我们在 Stage 详情页加入了两个新功能，用于展示当前 Stage 里每个 Task Shuffle 遇到最慢的几个节点，以及经过 Stage 统计后所有 Task 遇到 Shuffle 次数最多的 top 节点。这不仅方便用户查询，也可以利用这些指标进行相关大盘的搭建。

- **收益**

有了这些监控与 UI 改善后，当用户在 UI 上看到 Shuffle 慢的时候可以通过 UI 打开对应的 Shuffle 监控。方便用户和我们团队快速定位到导致 Shuffle 问题的 ESS 节点，看到这些节点上的实际情况，并快速定位这些堆积请求量是来自于哪些 Application。

新增的监控也会在运行排查 Shuffle 问题时感知到 ESS 节点上实际的 Chunk 堆积、latency 等关键指标。这在遇到 Shuffle 慢的情况下有助于更有效地实时采取措施。一旦定位到 Shuffle 问题，我们可以分析情况并提供治理方向和优化。

治理工作主要是通过 BatchBrain 系统来实施。BatchBrain 是专门为 Spark 作业设计的一套智能作业调优系统，它主要对作业数据进行采集，并进行离线与实时分析。采集的数据包括 Spark 本身的 Event Log、内部打入更详细的 Timeline event 以及各种 Metrics 指标，包括对 ESS 加上的定制化 Shuffle 指标等。

在离线分析中主要需要治理周期性作业，根据每个作业的历史特征，结合采集的数据，对这些作业的 Shuffle Stage 性能进行分析，并经过多次迭代调整，最终提供一套适合的Shuffle 参数，使这些作业在重新运行时可以对优化后的Shuffle 参数进行运行，从而获得更好的性能和效果。

BatchBrain 在实时分析部分也可以利用之前添加的 Shuffle 指标进行自动扫描。用户**还可以通过****BatchBrain API****查询他们集群内作业的****Shuffle****状况，以及有效定位遇到****Shuffle****堆积的节点和作业，并通过报警通知相关人员。如果发现****Shuffle****慢是由于其他的作业或者异常作业导致的，用户也可以直接采取治理动作，例如停止或者驱逐这些作业，以便为更高优先级的作业腾出更多资源进行****Shuffle****。**

**（2）Shuffle 限流功能**

通过Shuffle 的监控和治理，我们发现在 ESS 节点上遇到 Shuffle 慢的情况，通常是因为某些任务的数据量过于庞大或者设置了不妥的参数，导致这些 Shuffle Stage 的 Mapper 和 Reducer 数量都异常地大。异常大量的 Mapper 和 Reducer 数量可能会导致 ESS 节点上出现大量的请求堆积，而这些请求的 chunk size 也可能非常小。有些异常作业的平均 Chunk size 可能连 20 KB 都没达到。这些作业对 ESS 发送很大的请求量，这种情况可能会导致 ESS 无法及时处理所有的请求，从而引发请求堆积，甚至导致作业的延迟或直接失败。

针对这些现象，我们采取的解决方案是对 ESS 节点上每个 Application 的总请求量进行限制。当某个 Application 的 Fetch 请求达到了上限，ESS 将拒绝该 Application 发送的新 Fetch 请求，直到该 Application 等待现有请求的部分结束后才能继续发送新的请求。这样可以防止出现单个 Application 占用节点上过大的资源而导致 ESS 没有办法正常为其他作业请求提供服务的情况，也可以避免其他作业失败或 Shuffle 速度变慢。这个方案可以缓解异常或大规模的 Shuffle 作业对集群 Shuffle 的负面影响。

**①****Shuffle****限流功能的特征**

- 在作业运行正常的时候，即使开启了限流功能，也不会对作业有任何影响。节点如果可以正常服务，是不需要触发任何限流的。
- 只有当节点的负载超过可以承受的范围，且 Shuffle IO 超过设置的阈值后，才会启动限流机制，减少异常任务可以向 ESS 发送的请求数量，减低这个 ESS 服务当前的压力。由于这时候 ESS 服务的负载能力已经超过了可承受的范围，即使它收到这些请求，也无法正常返回这些请求，因此，限制异常任务过多的请求反而可能更好地提高这些任务本身的性能。
- 在限流的情况下，也会考虑作业的优先级。对于高优的任务，会允许更大的流量。
- 当限流生效后，如果发现 ESS 的流量已经恢复正常了将迅速解除限流。受限流的 Application 很快就可以恢复到之前的流量水平。

**②限流的详细流程**

限流功能主要在 ESS 服务端进行，每隔 5 秒在节点上进行 latency 指标的扫描，当这个 latency 指标超过设置的阈值时，会判定该节点的负载已经超出能够承受的负载了。接着会对 ESS 节点当前所有正在进行 Shuffle 的 Application 进行评估，判断是否要开启限流。利用之前加上的指标，可以统计近 5 分钟这个节点上 Fetch 的总流量和 IO，根据总流量的上限，对每个 ESS 节点当前正在运行 Shuffle 的 Application 合理地分配每个 Application 的流量并进行限制。流量分配也会根据 Application 的优先级进行调整。如果有任何 Application 的 Shuffle 或者当前堆积的 Chunk Fetch Rate 已经超过了其分配的流量，它们将受到限流，新发送的请求也会被拒绝，直到堆积的请求已经部分解除为止。

对于限流的分配，也有一个分级系统。首先，根据当前节点上运行 Shuffle 的 Application 的数量进行分配，Application 的数量越多，每个 Application 可以分配到的流量就越少。当节点上 Application 数量比较少的时候，每个 Application 可以分配更多的流量。限流级别也会根据节点上的实际情况每 30 秒进行调整。

在限流的情况下，如果节点上的 latency 没有改善，且 Shuffle 的总流量也没有恢复，就会升级限流，对所有 Application 进行更严格的流量限制。相反，如果 latency 有好转或者节点流量已经在恢复，就会降级限流甚至直接解除掉。最后，限流也会根据所有作业的优先级进行适当调整。

上图中有个例子，在作业较少的情况下，对一个高优作业进行限流，作业分配的流量可能会更高，然而，如果节点的负载一直没有缓解，限流也会升级。同等的情况下，一个中低优的作业，会给它分配更少的流量。开通限流功能之后，线上许多高优集群都观察到了性能的显著提升。

首先，Chunk 的堆积问题得到了明显的减轻。由于受到限流的限制，异常任务引发的 Chunk 堆积情况有效的减少了，大大降低了集群中某些节点上出现大量请求堆积的情况。

另外，Latency 的状况也得到了改善。在开启限流前，我们经常会看到集群中的节点出现高延迟的情况。而在启用限流功能后，整体的 Latency 状况得到了明显缓解。通过减少无必要和无效的请求，以及对各种大型或异常任务对 ESS 节点发起的请求量进行限制，我们避免了这些异常大型任务对 ESS 服务负载的负面影响，减少了对其他高优任务运行的影响。

**（3）Shuffle 溢写分裂的功能**

在分析一些慢 Shuffle 的作业时，我们也发现了另一个现象，一个作业中每个 Executor 写 Shuffle 数据的数量可能非常不均衡。由于 ESS 使用了 Dynamic Allocation 机制，每个 Executor 的运行时长和分配的 Map Task 数量可能不同。这导致在作业运行期间，大量的 Shuffle 数据可能集中在少数的 Executor 上，导致 Shuffle 数据实际上都集中在少数节点上。

例如下图中，我们发现有 5 个 Executor 的 Shuffle 写入量超过了其他 Executor 的 10 倍以上。在这种情况下，Shuffle 的请求可能会集中在这几个节点上，导致这几个 ESS 节点的负载非常高，这也间接增加了 Fetch Failure 的可能性。

针对这种情况，我们提供的解决方案是控制每个容器或每个节点写入磁盘的 Shuffle 数据总量。这个功能可以从两个角度实现。首先，通过 Spark 本身来控制 Executor 的 Shuffle Write Size，也就是每个 Executor 在执行 Shuffle 时写入的最大数据量。每个 Executor 会计算其当前写入的 Shuffle 数据量，并将这信息汇报给 Spark Driver。Spark Driver 可以使用 Exclude on Failure 机制主动将那些写入数据已经超出阈值的 Executor 排除在调度范围之外，并回收这些 Executor。此外，我们还通过 Godel 调度器改善调度策略，尽量将新的 Executor 调度到其他节点，避免单个容器的 Shuffle 写入数据过多，从而导致该节点的磁盘被填满，或者在 Shuffle Fetch 阶段数据集中在这几个 ESS 节点上。

#### 2.云原生优化

同时，在云原生优化方面，我们也进行了一些 Executor 的调度和功能优化，通过 Godel 调度器的策略，提升 Shuffle 能力。Godel 调度器提供的调度策略，可以在调度 Executor 时尽量避免负载高的 Shuffle 节点，从而降低这些节点后续遇到 Shuffle 问题的可能性。此外，调度器还可以为 Executor 的 Shuffle Write 提供更多的功能以实现打散。例如，它可以在磁盘压力特别大的节点上驱逐 Executor，或者在磁盘剩余空间不足时，驱逐那些已经写入大量 Shuffle 数据的容器。

Spark Driver 控制 Executor 的 Shuffle 与云原生调度功能结合可以将整体的 Shuffle 数据分散到更多的节点上，使 Shuffle Fetch 阶段的数据和请求更加均衡分布。

- **效果**

在线上开启了上述深度定制的 Shuffle 优化后，我们观察到了显著的效果。以下是来自三个高优集群的一些运行数据，每天在这三个高优集群中的任务总数可能超过 30 万，但平均每天因为 Shuffle Fetch 失败而最终失败的作业总数平均在 20 到 30 左右，可以说达到了低于 1/10000 的失败率。如下图可以观察到这三个高优集群在优化后的稳定性都有了显著的提升，也大幅度减少了用户在 Shuffle 上遇到的问题。

### 混部资源场景

接下来介绍在混部场景中进行的优化。首先值得注意的是，在混部集群场景下，Fetch Failure 的情况通常比在稳定资源环境中严重得多。每天平均的 Fetch Failure 次数非常高，主要原因是这些资源大多来自于线上资源空闲的出让，它们的磁盘 IO 能力和磁盘空间都比较有限。此外，由于磁盘 IOPS 和磁盘空间可能非常有限，与 HDFS 或其他服务混合部署的资源对集群的 Shuffle 性能影响较大，因此发生失败的概率也较高。混部资源治理以降低作业的失败率，确保作业的稳定性为主要目标，同时需要提高整个集群的 Shuffle 性能，减少资源浪费。

对于混部资源的集群，主要的方案是自研的 Cloud Shuffle Service（CSS），通过提供一个远端的 Shuffle 服务来减少这些作业对本地磁盘的依赖。

#### 1. CSS功能介绍

首先，CSS 提供了一个 **Push Based Shuffle****模式**，与刚才介绍的 ESS 模式不同，在 Push Based Shuffle 模式下，不同 Mapper 的同一个 Reducer Partition 数据都会发送到一个共同的远程服务上，在这个服务上进行合并，最后在某个 Worker 上写上一个或者多个文件，使得 Reduce 阶段可以通过 Sequential Read 模式读取这些 Partition 数据，减少随机 IO 的开销。

CSS也**支持****Partition Group****功能**，它的作用是将多个分区数据分配到一个 Reducer Partition Group。这样，在 Map 阶段 Mapper 可以通过 Batch Push 方式传送数据，将批量数据直接传输到对应分区组的工作节点上，从而降低了批量模式下 IO 的开销，提高了批量模式的性能。

CSS也提供了一个**快速双写备份**的功能。由于使用的是 push based Shuffle 和聚合模式，所有的数据其实都聚集在一个 Worker 上，如果这个 Worker 数据丢失的话，等于所有的 Mapper 都要重新计算所对应的数据，因此对于 push 聚合的功能，使用一个双写备份是比较重要的。CSS 提高写入的速度的方式是采用双写 In-memory 副本模式并进行异步刷盘，这样 Mapper 无需等待刷盘结束就可以继续推送后续的数据。

CSS本身也具有一个**负载均衡**功能。CSS 通过一个 Cluster Manager 去管理所有服务上的节点。Cluster Manager 会定期去采集和收取 CSS Worker 节点汇报的负载信息，当有新的 Application 提交的时候，它会进行资源的均衡分配，以确保 Shuffle Write 和 Shuffle Read 会优先分配到集群上使用率较低的节点，从而实现集群中更好的 Shuffle 负载均衡。

#### 2. CSS整体架构

- Cluster Manager 负责集群的资源分配，并维护集群 Worker 和 Application 状态，它可以通过 Zookeeper 或者本地磁盘保存这些信息，达到具有 High Availability 的服务。
- Worker 支持两种写入模式，分别是磁盘模式和 HDFS 模式。目前常用的是磁盘模式，每个分区的数据会写入两个不同的 Worker 节点，以实现数据冗余。
- CSS Master 位于 Spark driver 端，主要负责与 Cluster Manager 的心跳联系以及 Application Lifecycle。作业启动时，也会向 Cluster Manager 申请 Worker。Shuffle Stage 的过程也会统计 Shuffle Stage 的元数据以及的进展。
- Shuffle Client 是一个接入了 Spark Shuffle API 的组件，允许任何 Spark 作业直接使用 CSS 而无需额外配置。每个 Executor 会使用 ShuffleClient 进行读写。Shuffle Client 在写入时进行双写，在读的时候，它可以向任何一个存有数据的 Worker 读取这些数据，如果其中一个 Worker 读取失败的话，也会自动切换到另一个 Worker 上，并对多读的数据进行去重。

CSS在写入时 Worker 会直接发送数据，Mapper 会同时将数据发送到两个 Worker，Worker 不会等到刷磁盘之后返回给 Mapper，而是异步返回给 Mapper 结果，如果遇到失败，会在下一个请求再通知 Mapper。这时 Mapper 会重新跟节点申请两个新的 Worker，重新推送传送失败的数据。读的时候可以从任何一个节点读取数据，通过 Map ID，Attempt ID 和 Batch ID 进行去重。

#### 3. CSS性能与未来演进

在1TB 的 TPC-DS Benchmark 性能测试下，CSS 在 30% 以上的 Query 中得到了提升。

CSS作为一个远端 Shuffle 服务，特别适合云原生化，支持弹性部署和更多的远程储蓄服务。目前 CSS 已经完成了开源，有兴趣的朋友可以去 CSS 开源网站了解更多信息，也希望把后面的一些迭代和优化同步到社区上。在未来云原生化的演进中需要支持弹性部署、支持远程存储服务等相关能力。
