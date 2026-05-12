# 10、Spark 教程 - Kubernetes部署让Spark更灵活
- 来源：https://ddkk.com/zhuanlan/bigdata/spark/2/10.html
- 分类：大数据框架
- 分组：教程目录
### 前言

Spark 是一个开源的数据处理框架，能快速处理大量数据的转换。其高性能来自Spark的分布式框架，通常一个任务会被平均分配，跨机器集群工作。但Spark本身并不管理这些计算机，他需要一个集群的管理器来管理集群。Spark定义了需要执行的任务，而管理器决定了任务将如何被分配被执行，由此可见其重要性。这个管理器需要负责任务的接收、资源的调度和分配、任务的启动、TaskTrack监控等。

传统上，我们会选择Hadoop YARN来作为资源调度管理器，并且使用spark-submit提交任务。但随着云计算的推广与容器的流行，因其需要依赖于HDFS的本地环境，YARN的部署方式显得捉襟见肘。在技术的递进下，从Spark3.3.1开始正式推出了Kubernetes的资源管理方式，其设计框架与云计算紧密结合，将Spark应用从本地HDFS集群中解耦合，赋予其更多的灵活性。

### YARN Spark的传统部署方式

YARN是一种资源管理系统，其建筑于Hadoop之上，用于管理协调多个机器之间的任务提交执行和监控。

Spark部署在YARN集群上，需要开发人员在安装有Hadoop的每个机器配置上JAVA，Scala，YARN和Spark，并且不同机器之间可以免密登录，还需要修改多个配置文件来明确master和slave节点。（详细配置过程请参考running Spark on YARN）在任务提交之后，会首先向资源管理Resource manager申请资源，并且决定driver和executor node的分布。在我们配置集群时，就要考虑到将来的任务需要的资源量，如果工作负载高而资源不足，将显著拖慢集群性能。

将Spark提交给YARN执行有两种模式，yarn-client和yarn-cluster。yarn-client是将driver执行在提交任务的客户端上，而yarn-cluster是将driver执行在集群的某台机器上。采用client 模式可以方便开发者查看driver的log，但如果driver和cluster不在同一个集群中，需要考虑通信带宽的限制。

提交的方式通常我们采用spark-submit的方法，在参数中指明提交到YARN中：

#### YARN Spark的困境

在实际的生产中使用传统的YARN的部署方式，我们可能会遇见以下的场景：

在初期搭建一个YARN on Hadoop是需要大量工作的，并且需要有相关经验的工程师来进行调整，因为大部分的设定需要通过conf去修改，并且需要在各个机器之间配置免密登录。在使用时，不仅仅是初期搭建，在运营维护上也有额外的成本。使用过一定时间的YARN on Hadoop需要升级jdk或者Spark版本时，很容易因为jdk不兼容造成整个生产环境宕机。这就需要配备专业的人员来维护各个机器的环境。

YARN在做第一次配置的时候就需要预估好生产所需的资源。假设我们配备了10台机器的集群来处理线上消费订单，但双十一的活动使得订单激增，为了保证能高性能完成任务，我们临时决定再增加五台机器，提高并行度。经过一整夜的配置调试，终于扩大了集群，能及时处理线上的订单。但当双十一过去后，订单量锐减，YARN集群的15台机器，总是有一半以上是空置的。但已经购买和配置好的资源，变成了固定资产，很难再减少到10台机器。

如果你的项目也遇见了上述的情况，了解下面这种新的Spark部署方法可能可以帮助你走出困境。

### Spark on Kubernetes的部署

云计算在近几年飞速发展，云已经变成了许多公司的首选。为了更好地满足Spark应用的云迁移需求，Spark on Kubernetes的部署方法于 Spark 2.3 版本引入开始，到 Spark 3.1 社区标记 GA，基本上已经具备了在生产环境大规模使用的条件。

Kubernetes（也称 k8s 或 “kube”）是一个开源的容器编排平台，可以自动完成在部署、管理和扩展容器化应用过程中涉及的许多手动操作。主流的云平台都提供Kubernetes的应用，如Amazon Elastic Kubernetes Service (Amazon EKS) , Azure Kubernetes Service (AKS) 等。

深度解析Spark on Kubernetes的部署架构是由Kubernetes的应用接受spark-submit的命令，可以查看到Kubernetes启动一个driver和多个executor的pod，当任务完成之后，container的状态会转为complete。下面我们会介绍几种在这种部署下的任务提交方法。

#### Submit提交

使用spark-submit命令可以直接向Kubernetes集群提交Spark应用程序。其提交的命令与Spark on YARN的提交方式几乎一致，唯一的区别是需要修改master的链接到Kubernetes的集群。

#### Operator提交

除了直接向 Kubernetes Scheduler 提交作业的方式，还可以通过 Spark Operator 的方式来提交，Operator 在 Kubernetes 中是一个里程碑似的产物。Operator的安装可以使用helm快速部署（quick-start-guide）。他将Spark的任务提交与传统Kubernetes的yaml apply方法相结合，将许多的Spark调度参数管理转为方便管理文档模式。如下图的yaml是一个向Kubernetes部署应用的例子。可以看见在这个部署中，部署了一个叫spark-pi的应用，使用gcr.io/spark/spark:v3.1.1的镜像，如果需要其他版本的Spark，切换基础镜像即可。应用的部署是cluster的模式，会启动一个driver和1个executor来完成jar文件中的SparkPi应用。此外，ServiceAccount可以和Kubernetes的secret管理相结合，更好地管理应用的安全密钥。

#### Airflow的提交

一般的应用都需要与Airflow结合起来做到执行管理，传统的Spark on YARN，都会选择SSHOperator或者SparkSubmitOperator，使用spark-submit的方式提交通过Airflow提交任务。在Spark与Kubernetes结合之后，Airflow也开发了新的组件支持：使用yaml提交任务到Kubernetes的SparkKubernetesOperator和用于监听的SparkKubernetesSensor。对于Spark所需的参数化管理，我们可以使用jinja的语法定义好yaml的template，在实时执行的时候传入参数生成最终的执行yaml。其dag代码如下：

在Airflow的UI上可以看见dag有两个operator，一个负责提交Spark应用，一个负责监听Spark应用是否成功地收集log信息。

### Kubernetes 与 YARN 对比

#### 环境隔离

不同于YARN的机器只能拥有一个JAVA_HOME，Kubernetes是基于容器来进行管理的，不同容器的环境是隔离的，相互不影响，环境的隔离颗粒度更细。当需要进行Spark版本升级时，直接通过修改基础镜像的版本即可。并且在启动时，不需要修改conf和配置免密登录等额外的配置工作。

#### 更易扩展

使用Kubernetes，资源不再是固定离线的了，而是动态启动的。executor是由pod来完成，当运算完成之后，会立即释放pod占用的空间。特别是与云资源相结合，比如AWS的EKS（Elastic Kubernetes Service），可以做到极好的成本控制。当计算峰值来临时，可以弹性增长，并且在峰值过后，立即降低释放资源。

#### 学习成本

不同于传统的部署方式，Kubernetes是完全建立在pods上的，并且要完全发挥其灵活扩展的特性需要与云计算相结合。这就注定了，使用Kubernetes部署的开发者不仅仅需要了解Spark的基础框架，还需要精通pods部署与基础云知识。

#### 数据湖

传统的Spark集群，会将数据直接存储在Hive或者HDFS中，实现本地化的数据湖。但是使用Kubernetes部署的Spark，是计算与存储隔离的架构，启动的执行pods是临时的，并不能作为长久的数据存储。一般数据也将放在云系统如snowflake，s3数据湖中。

#### 日志

和Spark on YARN的很大的区别是，Kubernetes的log是存在于不同的pod上的，其自带的功能并不支持将所有log集合到一个web UI上查看。如有查看日志需要，开发者需要kubectl logs命令指定查看一个pod的log，当pod执行完成被清理的时候log的信息也丢失了。使用Spark history web应用，我们需要将pod内存的log长久化（比如存在aws S3bucket上），然后deploy一个Spark history server指向到我们所存储的位置上。其部署过程需要改动几个config，参考：Spark history on k8s。

#### 性能对比

因为Spark和Kubernetes都是主要负责计算资源和任务的调度，不涉及任何应用框架上的差别，所以其性能本身的差别是微乎甚微的。由TPC-DS提供的基准测试来看，两者之间只有4.5%的差距，是几乎可以忽略的。另外一方面，Spark on Kubernetes 一般选择存算分离的架构，而 YARN 集群一般和 HDFS 耦合在一起，前者会在读写 HDFS 时丧失“数据本地性”，数据的读写将受限于网络的性能。但随着网络性能的发展，各种高效的传输和压缩算法的出现，这影响也几乎可以忽略不计。

#### 成本对比

我们之前有提及，Spark是离线资源，需要提前预估好需要的资源量，并且在应急扩展后很难将成本再降回来，即使资源空置，成本依旧在那里。但Kubernetes的基础是云，其部署完全可以实现动态按需增长的资源，可以说不会存在需要为空闲未被使用的资源付费的需求。这是Kubernetes部署方式的一大优势，也是其深受用户追捧的主要原因之一。

### 总结

自从2018 年初随着 2.3.0 版本发布以来，Spark on Kubernetes 经过长期的发展和版本更新，在社区和用户的打磨下已经拥有成熟的特性。现在IT设备的成本逐年上涨，给许多企业带来难题。Spark+Kubernetes+云的组合的灵活性和超高性价比，给用户带来了更多的想象空间。Kubernetes的容器式管理Spark应用是很好的实践，如果有云端或者混合部署的需求，建议采用Spark on Kubernetes的方式来统一管理，更好地实现与云计算的结合，并且灵活控制成本。但若大量数据仍是在本地存储，或者有其他Hadoop的应用需求，Kubernetes并不能很好地满足这些需求，还是建议维持YARN的部署方式。
