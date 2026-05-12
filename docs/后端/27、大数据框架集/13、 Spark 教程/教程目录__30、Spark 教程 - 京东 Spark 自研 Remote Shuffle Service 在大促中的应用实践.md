# 30、Spark 教程 - 京东 Spark 自研 Remote Shuffle Service 在大促中的应用实践
- 来源：https://ddkk.com/zhuanlan/bigdata/spark/2/30.html
- 分类：大数据框架
- 分组：教程目录
### 前言

本文讨论了京东Spark计算引擎研发团队关于自主研发并落地Remote Shuffle Service，助力京东大促场景的探索和实践。近年来，大数据技术在各行各业的应用越来越广泛，Spark自UCBerkeley的AMP实验室诞生到如今3.0版本的发布，已有十年之久，俨然已经成为大数据计算领域名副其实的老将。虽经过不断的迭代和优化，Spark功能日趋成熟与完善，但在性能及稳定性方面，仍然还有很多可以提升的地方。Shuffle过程作为MapReduce编程模型的性能瓶颈，就是其中重点之一。我们希望在京东超大规模数据体量及复杂业务场景的背景下，通过自研并落地Remote Shuffle Service服务，解决External Shuffle Service中存在的现有问题，打造稳定高效的JDSpark计算引擎，助力京东大促过程中的一些应用实践，能够给大家提供一些思路和启发，同时也欢迎大家多多交流，给我们提出宝贵建议。

### ESS问题及现状

在此之前，相当一部分公司在使用Spark计算引擎时，对于Shuffle Service的支持采用了社区的External Shuffle Service解决方案，京东原来的架构也不例外。该方案需要在所有Executor计算节点所在的NodeManager上部署一个External Shuffle Service服务，当Executor针对Shuffle过程进行相关数据处理时，Shuffle Write阶段会先将Shuffle数据写到本地存储介质，Shuffle Read阶段读取Shuffle数据文件时不再需要直接请求Executor，转而请求与Executor位于同一节点上的External Shuffle Service服务，获取Shuffle数据文件，完成Shuffle过程的数据传递。这样就可以解决由于Executor意外终止造成的数据丢失问题，继而实现对Spark做动态资源功能的支持。但该方案在架构及使用上存在一些限制与不足：

**1. 架构不清晰：**External Shuffle Service必须与Executor计算节点所绑定，两者位于同一个NodeManager上，这就造成了架构不清晰、系统健壮性不高的问题，同时不利于K8s等容器级别框架方案的部署与使用。

**2. 资源利用低：**Executor的内存使用会根据任务的具体情况而进行调节，目的是为了避免Spill过程造成的Overhead，但在一些场景下可能会存在内存资源较早的先于CPU资源而耗尽的情况，容易造成集群资源利用率低的问题。

**3. 缺乏整体性：**不同Executor的Shuffle数据分散在不同的Node上，数据文件的存储及管理较为分散，缺乏整体性，比如：不利于针对同一个Stage的TaskSet进行合并、整体排序、流程优化等过程的实现。

**4. 稳定性较差：**由于External Shuffle Service的架构设计未能实现计算存储分离，Executor和External Shuffle Service相互影响问题的存在，导致线上FetchFailedException的出现频率及因此失败的任务数量居高不下，Spark计算引擎的整体性能与稳定性较差。

### RSS目标与挑战

针对上述External Shuffle Service方案的现存问题，我们提出京东自研Remote Shuffle Service的一些目标需求与挑战，主要概括为如下几方面内容：

**1. 计算存储分离：**作为京东研发Remote Shuffle Service的初衷，首当其冲的任务就是要解决External Shuffle Service架构不清晰的问题，真正实现计算存储分离的架构设计，彻底解决因Executor与Shuffle服务相互影响而导致的系统性能低、鲁棒性差的问题，从原理上扼制FetchFailedException故障的发生。

**2. 弹性、高可用：**考虑到将来在京东生产环境的大规模部署与维护，Remote Shuffle Service务必要能作为一个独立的集群服务进行部署，保证提供稳定、可靠、高可用存储能力的同时，可以弹性的对Remote Shuffle Service集群进行动态扩缩容处理，以便能够更灵活的应对大促期间因业务及数据量增长带来的集群压力和多变的复杂问题。

**3. 特定功能优化：**鉴于京东JDSpark计算引擎的具体使用情况，Remote Shuffle Service要能完美兼容Spark 2.X和3.X版本、支持Adaptive Execution、支持某些特定的Data Skew处理方案，针对Spark的Reduce过程，增加优化流程，如相同Reduce Partition的Map Segment进行预合并、支持全局Map-Side Sort、支持某些特定算子、特定场景支持Fallback到External Shuffle Service等。

**4. 完善监控方案：**针对Remote Shuffle Service使用情况及集群健康状态，需要有完善的监控及报表系统等外围组件，要有能充分评估Remote Shuffle Service集群资源、压力，实时监控Remote Shuffle Service集群的健康状态，快速输出上线效果、集群整体各项指标数据等报表的能力。

**5. 云原生的支持：**Remote Shuffle Service要能摊平集群整体资源，做到Executor同质化，计算资源真正的无状态，为Cloud Native云原生的K8s等部署方式提供技术与方案支撑。

除了上述基本目标要求外，由于Remote Shuffle Service的实现过程中涉及大量Shuffle Write / Read、Spill等阶段的核心逻辑与代码，边界条件较多，需要精心设计并仔细实现；另外，实现过程中不仅要考虑新增的特定优化，还需要考虑兼容社区类似AE等已有的优秀功能和京东具体的业务场景，做到百分百兼容无Bug，这就需要经过大量线上真实Case和复杂业务场景的充分验证与测试。同时，针对监控及效果数据输出能力的建设等，都是京东自研并落地Remote Shuffle Service过程中历经挑战积累的宝贵经验。

### RSS架构和实现

目前业界越来越多的公司及团队开始投入到Remote Shuffle Service相关产品和技术的探索中，比如Facebook的Cosco、Linkedkin的Magnet、Uber的Zeus等，都取得了不错的成果。

究其根本，大家的思路都是围绕着解决以下两个痛点去设计：

**1、** 减少短连接的网络开销；

**2、** 减少随机读的磁盘开销；

京东在设计自研Remote Shuffle Service时，除了考虑解决上述痛点外，通过尽量简化整体设计的方式来减少对计算引擎本身的侵入，同时完美兼顾Spark的运行特性。整体设计如下图所示：

#### Shuffle Write

针对Shuffle Write阶段，Map Task将Shuffle数据直接发送到Remote Shuffle Service上，而不再选择落到Executor所在的本地盘上。同时，相同的Reduce Partition会被分发到相同的Shuffle Service节点上，Remote Shuffle Service节点会对数据进行聚合操作，然后写到HDFS或CFS（ChubaoFS）等远端分布式文件存储系统上的文件中，远端存储系统文件写入成功，Map Task收到ACK确认无误后执行过程结束，最后向Driver端返回带有路径信息的MapStatus信息。

#### Shuffle Read

针对Shuffle Read阶段，Reduce Task向Driver发起请求，获取MapStatus信息，然后根据Driver返回的路径信息直接读取在HDFS或CFS等远端文件存储系统上经过Remote Shuffle Service聚合后的数据文件。这个数据文件包含了所有Map Task相应Reduce Partition的Shuffle数据，以此来达到减少短连接带来的网络开销和减少小文件随机读带来的磁盘开销的目的。

另外，设计与实现Remote Shuffle Service除了要满足上述基本的Shuffle数据处理功能外，还需要重点考虑如何解决以下几个方面的问题：

**1. 数据备份**

得益于HDFS和CFS等分布式文件存储系统的块备份机制，Remote Shuffle Service可以轻而易举的实现Shuffle数据文件多副本备份功能。将更多的精力专注于Partition远程分组和聚合方面的工作，同时由于数据存放在分布式文件系统中而不是本地磁盘，所以能有效的避免因Remote Shuffle Service节点宕机导致FetchFailedException状况的发生。

**2. 数据去重与质量保证**

Spark原生Shuffle方案里，Map Task写完Shuffle数据后，会Commit MapStatus信息。在打开推测执行的时候，尽管相同Reduce Partition的Map Task会写相同的Shuffle数据在本地，但Driver只会接受其中一份MapStatus信息，因此Reduce Task也只会读取到一份Shuffle数据。而在Remote Shuffle Service的设计中，来自多个Map Task对同一个Partition处理的数据都会被RSS聚合并持久化到HDFS或CFS的文件中。此时，Reduce Task读取这个文件就可能会遇到相同的Shuffle数据的问题，为了避免数据重复，我们在持久化Map数据的时候，会写入一个带有Block ID的Header，以供Reduce Task进行数据去重。

此外，我们在RSS中添加了端到端的校验机制保证数据的一致性，确保百分百的数据检测和质量把控。

**3. 节点健康度检查和负载均衡**

随着Remote Shuffle Service集群规模的扩张，为了解决多集群、坏节点等场景下人工维护RSS节点带来的冗余配置和潜在风险，实现对RSS节点的健康度检查和集群负载均衡，我们采用了ETCD作为高可用的服务发现方案。总体架构如下图所示：

可以看到RSS服务端会创建ETCD Client与ETCD Cluster进行交互，RSS节点通过计算确定自身是否处于健康状态，并定时的向ETCD Cluster汇报自己的健康状态和负载信息。当Spark Application任务启动时，Driver通过访问ETCD Cluster获取各个RSS节点的状态信息，然后根据其健康状态和负载情况，结合任务所需要的节点数量，动态随机的获取足够数量健康的RSS节点进行使用，以此实现服务发现和负载均衡的功能。

**4. 系统监控及业务报表方面的取舍**

对于一个重要的线上系统而言，要想具备大规模的部署和上线条件，完善的监控、告警、报表等外围组件是必不可少的，只有这样才能实时准确的了解系统当前的健康状况，及时发现问题，规避风险，真正的做到“知己知彼，百战不殆”。JD RSS指标方案使用的是Spark的Metrics System，通过注册一个Source实现重要指标的收集工作，通过jmx_prometheus_javaagent或内部实现的Sink，将指标数据发送到京东内部基于TSDB和Prometheus的监控系统，实现指标数据的存储和告警功能，前端使用Grafana提供的仪表盘功能对指标数据进行图表化展示。对比其他指标监控平台，采用这种实现的好处是各个组件都比较通用，属于大数据监控系统领域比较普遍的方案，不管是我们内部部署和使用过程中，还是未来对外提供能力输出的情况下，都能够做到简单易用、便捷完善。报表系统使用的是京东内部的数据可视化分析工具，可以实现每天定时邮件推送关于RSS任务数量统计、RSS任务运行明细、RSS集群整体处理Shuffle量趋势等多种丰富的可视化定制图表。

**相较于业界其他类似产品的设计思想，京东自研Remote Shuffle Service有其独有的特色。**

**在架构上，** JD RSS作为独立服务部署、存储去中心化设计、支持水平横向扩展；利用HDFS或CFS等分布式文件系统，提供高可用的Shuffle数据远端存储及数据备份能力；使用ETCD作为服务发现，实现RSS集群节点健康度检查和负载均衡功能。

**在实现上，**取消单独管理元信息的Metadata Service，避免架构上可能存在的单点故障问题，使Spark计算引擎整体容错性及系统健壮性得以提升；Map Task过程实现不落本地盘处理，减少磁盘压力的同时兼顾Spark On K8s等云原生部署方案在磁盘挂载方面的限制；完美支持动态资源、推测执行，实现零拷贝，兼容Adaptive Execution等京东线上环境。

**在技术上，**通过各方面手段，解决Shuffle数据文件读写性能问题；采用更合理的设计，提升Stage重试和数据清理效率；增加Fallback机制，支持特定场景回退到ESS，降低JD RSS的部署及推广门槛。

**在建设上，**围绕JD RSS实现了一套系统的实时监控、告警、可视化报表方案，能够做到对集群健康度、资源使用、任务详情等了如指掌，具备主动发现、提前预警、及时介入、规避风险的能力。

综合而言，京东Remote Shuffle Service诞生于复杂的业务场景，服务于具体的实际需求，并在海量数据和大量落地案例中乘风破浪，持续不断的打磨完善。

### RSS性能表现

为了更好的了解JD RSS的性能，我们针对Spark社区原生External Shuffle Service、京东自研Remote Shuffle Service、以及不久前Uber开源的Remote Shuffle Service（Zeus），基于TPC-DS及内部任务做了大量的性能测试工作，如下表格是三者在相同数量Shuffle服务节点（13台）、相同Spark及Hadoop生态环境、独立测试条件、机械硬盘和1T数据量下的TPC-DS表现情况：

整体来看，以External Shuffle Service的测试结果数据作为基准，对于大多数Case，JD RSS和Uber RSS的性能要低于ESS，平均下来性能上大概有4%左右的降低；JD RSS与Uber RSS相比，各有一半Case的运行时间比对方长，平均下来JD RSS比Uber RSS大概有0.13%的降低，整体差距不大。

鉴于上述Query为TPC-DS的基准测试Case，数据规模及逻辑复杂度有限，RSS架构性能损耗较为明显，测试结果数据仅作为比照参考。但通过简单分析还是可以看到，External Shuffle Service在中小型数据量场景下相对具有优势，性能要优于不同架构的Remote Shuffle Service实现。Uber RSS采用的基于本地磁盘存储Shuffle数据文件的方式，理论上要略优于JD RSS基于HDFS远端存储Shuffle数据文件的策略，测试结果显示也的确如此，但两者整体性能差距不大。分析下来，测试结果基本符合预期。

然而，正如我们所知，Shuffle数据量极其庞大的复杂业务场景，才是Remote Shuffle Service大显身手的舞台。下面我们通过一个京东大促期间使用JD RSS优化的真实案例，感受下京东自研Remote Shuffle Service在生产实践中解决FetchFailedException问题、提高任务运行效率和稳定性方面展现出的能力。

### RSS在京东大促期间优化案例

下面是针对京东线上刷岗业务脱敏后的优化案例，刷岗业务逻辑复杂，处理的数据量庞大，每天Shuffle阶段处理的数据基本能维持在几十TB的量级，发生FetchFailedException故障的情况十分频繁，任务运行极其不稳定，使用ESS正常跑完的概率很低，即便运行完成，耗时也无法估算，根本不能保障SLA的时限要求。

在未使用JD RSS而采用ESS的情况下，通过下面的图片可以看到，由于频繁发生的FetchFailedException，导致多个Stage重算，不仅浪费了大量的计算资源，而且造成了任务运行耗时的延迟。

针对这种处理数据量大，FetchFailedException严重的Shuffle Heavy任务，我们推荐业务方使用JD RSS进行优化，下图是使用JD RSS后任务的运行情况：

可以看到使用JD RSS后，任务运行过程中无FetchFailedException故障发生，避免了因FetchFailedException导致Stage重算带来的计算资源和性能损耗。关键是任务运行十分平稳，该任务平时基本无法正常结束，即便能够完成的情况下，耗时也在五小时以上，且任务运行时长飘忽不定，经常因FetchFailedException引入的不确定性导致任务运行存在几小时的偏差，无法通过评估耗时实现对下游业务的SLA保障。使用JD RSS后，任务每天都能平稳运行，且运行时长稳定在两小时左右，不仅节省了计算资源，提高了运行速度，而且保障了每天按时完成SLA的要求。同时，对于Spark计算引擎而言，使用JD RSS后，有效降低了集群整体的FetchFailedException故障率，避免了资源浪费，提高了Spark计算引擎的性能与稳定性，实现了降本增效。

### 总结与展望

京东Spark计算引擎研发团队于2018年底开始规划自研Remote Shuffle Service的相关工作，经过近一年的紧张研发、充分测试、灰度上线。于2019年6月，作为External Shuffle Service的备用方案，京东Remote Shuffle Service首次在618大促中展露头角，独立承担了15个Shuffle数据量大、FetchFailedException情况严重的线上任务，并顺利完成首秀。后来，经过与Spark源码的合并、基于Spark 3.0接口的代码重构、基于ETCD服务发现的加持、完善的实时监控和报表系统，以及不断丰富的功能打磨和性能优化等，京东自研Remote Shuffle Service 1.0版本已在生产环境中正式投入使用，线上集群规模达240台。在2020年京东618、京东11.11大促过程中，Remote Shuffle Service日处理Shuffle数据量峰值超1000TB，日运行Spark Application数量达220+，有效减少了FetchFailedException故障率的发生，显著提高了Spark计算引擎整体的性能及稳定性，为京东内部多个重点业务如商智黄金眼、商详、流量、供应链、公共数据等提供了稳定的技术支持，充分展示了Remote Shuffle Service的实力和肉眼可见的效果，有效支撑了京东大促中的数据处理需求，助力京东实现数据驱动业务的变革与发展。

如今，我们一方面在不断完善京东Remote Shuffle Service的各项功能及优化，持续提升其性能与稳定性；另一方面正在加紧开展Shuffle 2.0的相关工作。展望未来，有如下几方面的规划：

**1、** 结合社区类似Uber的RSS、Linkedin的PushBasedShuffle等不断涌现的新技术、新思路，继续丰富和提升RSS的架构设计；

**2、** 推进RSS在生产环境中的部署和使用，为更多业务提供稳定高效的大数据计算能力；

**3、** 利用RSS的优势，加速Spark3.0的推广和SparkOnK8s云原生方案的落地；

**4、** 拓展RSS多引擎支持，扩大应用场景、助力数据湖业务的发展；

**5、** 加强开源和商业化方面的探索；

最后，我们将继续加强业内技术交流，为大家提供思路和经验，虚心听取大家的反馈和建议，通过不断改进、完善、分享，促进大数据技术在行业间的全面发展。

心有所向，未来可期。相信通过不断的探索与研究，京东自研的Remote Shuffle Service产品与京东计算引擎研发团队的技术发展定会更上一层楼。也期待未来京东Remote Shuffle Service在开源和商业赋能方面的规划，在回馈社区的同时，为更广大的用户提供稳定、高效、优秀的计算服务，发挥更大的技术价值。
