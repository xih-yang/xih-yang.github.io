# 15、Spark 教程 - Spark在供应链核算中的应用总结
- 来源：https://ddkk.com/zhuanlan/bigdata/spark/2/15.html
- 分类：大数据框架
- 分组：教程目录
### 一 业务背景

(会计)核算是使用会计语言与方法，对产品业务的结果进行登记与反映，从而为利益相关者提供直观、准确、有价值的信息，主要服务对象是财务、审计、外部监管、合规以及管理层，同时核算也是资金管理风险防范的其中一个手段。整体流程可以概括为基于核算规则从业务事件(采购入库、退供、TOC确认收货、开票等)关联单据中提取业务要素(采购/销售主体、业务时间、客商、金额等)转换为会计语言表达的数据(会计分录，会计要素主要包括OU/收益部门/预算部门/往来段/明细段/行业段/成本中心等)，供应链核算主要链路如下图所示：

从上图可以看到供应链核算一脚在业务(计费/结算可以理解为财务视角的业务)，一脚在财务，职责上既要满足核算团队月结出账的诉求，又要提供业财对账的能力，基于此我们将数据处理统一为如下流程：

### 二 离线 SQL 模式存在的问题

从第1章节图2可以看到，核算的流程就是ETL的过程，在早期的方案中通过离线+在线的实现方式，其中离线完成原始凭证的加工，业务接入的逻辑通过SQL实现，在线系统完成记账+抛账，同时由于在线系统处理能力有限，在原始凭证加工中进行了业务单据的聚合，此种实现方式主要存在以下问题。

- 1.对账问题定位困难，核算小二主要通过下载分录及对应的业务单据汇总数据进行对账，如果某一分录和业务数据有出入，只能逐一业务要素分析，由于缺乏通过分录精确追溯到关联业务单据的下钻能力，问题定位耗时较长，造成这一问题的主要原因在于通过离线SQL实现的原始加工逻辑无法精确的建立业务单据和原始凭证的关联关系。
- 2.日常运维困难，随着业务的不断发展，业务接入离线任务在不断的膨胀，最终成为一个横跨4个项目空间，150+离线任务、100+离线表的工程，任一节点的错误都会造成月结数据出错。
- 3.行业实施效率较低，每次新接入行业都需要开发小二新建一套离线表+离线任务，相应的也造成运维问题的持续恶化。

### 三 为什么选择Spark

#### 1 核心诉求

在核算主版本的建设中，我们希望能够通过打造稳定可复用的产品能力最大程度的解决上述问题，核心诉求如下

- 1.核算规则(业务接入/记账/抛账)可配、可视，不存在黑盒的加工逻辑，加工流程对核算小二全透明（提升实施+对账效率）
- 2.建立整个核算链路单据维度的关联关系（业务单据``原始凭证``记账凭证``抛账凭证），具备双向的单据追溯能力（提升对账效率）

基于以上诉求，我们抽象了标准的规则模型，满足用户多场景下各个链路(业务接入、记账、抛账)的加工逻辑配置(规则相关设计方案不再此文展开)，与之配套的会计引擎完成基于核算规则的数据处理，另外在主版本的设计中，原始凭证需要1V1还原业务单据，每月原始凭证数据量达到了10亿级别，为了满足月结时效性的要求，我们需要采用高性能、支持大数据量、且编程友好(便于建立单据关系)的计算引擎。

#### 2 Spark VS MapReduce

基于上述诉求，我们重点调研了Spark和MapReduce两款计算引擎，差异如下所示：

引擎

MapReduce

Spark

编程友好

一般，支持Map/Reduce两种算子

较好，支持的算子丰富(map/filter/reduce/aggregate等)

性能

一般，

中间态数据需要落盘，计算逻辑相对复杂时，MapReduce会涉及到多MapReduce任务执行(多次shuffle)，每次shuffle也会涉及到大量的磁盘IO

较好，

基于内存计算，基于DAG可以构建RDD的血缘关系，在调度过程中可以避免大量无效的磁盘IO，另外rdd共享机制可以降低网络IO的开销

集团生态

较好，odps提供MapReduce计算框架支持，可以通过LogView查看日志

较好，odps提供Spark计算引擎支持，可以通过LogView查看日志，目前提供了stand-alone、集群及client三种模式的支持

比较形象的对比(并不是说spark不会落盘，在基于DAG图拆分stage时，也会涉及到shuffle，但整体的磁盘IO消耗比MapReduce要低)

#### 3 编程模式优势: RDD + DataFrame 的编程模式

如上面和MapReduce的比较中看到 Spark 在编程友好性上比MapReduce好一些，比较适合后端开发人员。

```java
import org.apache.spark.sql.Row
import org.apache.spark.sql.types._
// Create an RDD
val peopleRDD = spark.sparkContext.textFile("examples/src/main/resources/people.txt")
// The schema is encoded in a string
val schemaString = "name age"
// Generate the schema based on the string of schema
val fields = schemaString.split(" ")
  .map(fieldName => StructField(fieldName, StringType, nullable = true))
val schema = StructType(fields)
// Convert records of the RDD (people) to Rows
val rowRDD = peopleRDD
  .map(_.split(","))
  .map(attributes => Row(attributes(0), attributes(1).trim))
// Apply the schema to the RDD
val peopleDF = spark.createDataFrame(rowRDD, schema)
// Creates a temporary view using the DataFrame
peopleDF.createOrReplaceTempView("people")
// SQL can be run over a temporary view created using DataFrames
val results = spark.sql("SELECT name FROM people")
```

上面是一个官方的例子,在schema控制，可编程性和 sql 操作等能较好的结合，逻辑比较类同后端开发。

基于上述spark特点及优势，我们最终选择spark实现会计引擎逻辑。

### 四 spark基础介绍

#### 1 基础概念

- Rdd（Resilient distributed dataset）:不可变的弹性分布式数据集（不可变性似于docker中的只读镜像层），只能通过其他的transformation算子创建新的RDD。
- Operations：算子，spark包括两类算子，transformation（转换算子，通过对前置rdd的处理生成新的rdd）/action（触发spark job的拆分及执行，负责将rdd输出）。
- Task：执行器执行的任务单元，一般基于当前rdd的分区数量拆分。
- Job：包含多个task的集合，基于Action算子拆分。
- Stage：基于当前rdd处理逻辑的宽窄依赖拆分，spark中非常重要的概念，stage的切换会涉及到IO。
- Narrow/Wide dependencies：参考下图，区分的重要依据在于父节点是否会被多个子节点使用。

#### 2 Spark on MaxCompute(ODPS)

我们在实践中，主要基于spark on odps提供的client模式实现，client模式的详细介绍可以参考相关文档

- Spark 有很多的后端的 Runtime，例如其商业化公司的Databricks Runtime, 弹内我们使用的是 AliSpark,是集团的适配 MaxComputer，同时在离线交互是使用了 Cupid-SDK 的 Client模式，这个模式不是独立集群的模式，类Serveless 模式，整体的成本上比独立集群要低，当然资源保障上没有独立集群好。

Client模式原理参考相关文档，比调度模式有更好的应用交互性。

- 集团client模式将spark session作为服务提供，可以方便地与在线系统交互，包括任务的提交、关闭、实例的关闭等；
- 在使用集团提供的spark能力时，比较麻烦的在于如何方便的查看日志，从我们的实践看主要有以下2个路径；
- 申请odps对应项目空间的logview权限，可以直接在https://logview.alibaba-inc.com/中基于sparkInstanceId定位到具体的日志；
- 借助odps client+提交spark任务时返回的实例ID获取log地址，代码参考如下:

```java
//instanceIdd对应odps client中的lookupName
Account account = new AliyunAccount(sparkSessionConfig.getAccessId(), sparkSessionConfig.getAccessKey());
        Odps odps = new Odps(account);
        odps.setEndpoint(sparkSessionConfig.getEndPoint());
        odps.setDefaultProject(sparkSessionConfig.getNamespace());
        //日志地址目前设定有效期为7*24小时
        try {
            return odps.logview().generateLogView(odps.instances().get(sparkInstanceId), 7 * 24L);
        } catch (OdpsException e) {
            LOGGER.error("生成logView地址失败,config:{},instanceId:{},e:{}", sparkSessionConfig, sparkInstanceId, e);
        }
```

### 五 技术方案

#### 1 整体方案

spark作为大数据处理引擎，在实例数量较少的情况下采用odps任务目前的运维方式来管理的话成本并不高，但是在供应链核算的场景下，需要支持每天将近600+(行业*核算场景)数量的实例运行，且需满足核算完整性、准确性、及时性的要求，另外由于目前我们的spark任务(cupid)与odps任务共享项目空间资源，意味着我们需要在有限的资源下支持核算的业务，基于以上背景及诉求，供应链核算整体的应用架构设计如下：

其中ascp-finance-accounting负责任务调度，组件交互如下:

- spark任务管理：负责spark任务相关生命周期的管理，承接核算任务和spark session之间的交互；
- spark session管理：负责spark实例的创建、销毁、job提交等，另外针对不同类型的session，支持自定义所需资源，包括实例worker数量、分区大小等，主要与spark on odps交互；
- 核算任务管理：负责业务接入、记账、抛账等核算任务的生命周期管理；
- spark job版本管理：spark任务所需jar包会不断的迭代，针对不同的核算场景可以定制所需的job版本；

ascp-finance-accounting-spark负责spark job的开发维护，spark on odps client模式下需要基于服务上传jar包，若jar包较大，性能较差，所以基于client模式下提供的resource管理能力，我们将项目module拆分如下：

包名

作用

accounting-spark-client

对外提供spark任务的启动、查询及终止服务

accounting-spark-common

公共包，包括常量、工具类等

accounting-spark-job

spark任务包，封装了任务接入和记账两个任务的实现

accounting-spark-dependency

spark任务包依赖的二方包，client模式下若job包过大，会造成上传失败的问题，所以部分job依赖的二方包可以放在dependency中，单独打包，手工在datawork中上传，通过resources传递参数

#### 2 数据处理流程

核算接入、记账、抛账等主流程的spark处理逻辑如下所示：

### 六 运维及调优

基于spark的特性，完成数据处理逻辑的编写对我们来说并不困难，问题主要集中在如何用尽可能低的成本满足业务需求，特别是在目前控制成本的背景下，在供应链核算的落地过程中，我们主要采用了以下优化方式。

#### 1 数据量评估

spark任务的运行效率很大程度上受到分区数量的影响，spark提供了如下手段来进行分区数量的调整(部分为spark on odps能力)，供应链核算在实现过程中主要用到了odps离线表和lindorm两种数据源。

- spark.hadoop.odps.input.split.size：用于设置spark读取odps离线表的分区大小，默认为256M，在实践过程中需要结合当前分区的大小进行调整，比如当前分区大小为1GB，那么默认情况下会拆分为4个分区 ；
- spark读写lindorm(类hbase)的分区数主要受到region数量的影响，在供应链核算系统的实践中，由于初始region数量较少，导致分区数量很少，spark执行效率很差，，针对此问题我们实践了两种处理策略 ；
- 1.进行重分区(repartition算子):针对数据倾斜进行重新分区，但是会拆分stage，触发shuffle，增加额外的IO成本。
- 2.lindorm进行预分区，比如预分区为128个region，但此种实现方案需要结合rowkey的设计一起使用，会影响到scan的效率。

#### 2 代码逻辑相关job/stage/task评估

除了六中所述数据量以外，数据处理逻辑的实现方法也会影响到任务的执行效率，spark比mapreduce执行效率高的一个原因就在于spark会先基于处理流程构建DAG，这样可以有效评估每个stage是否需要落盘(IO成本)，在逻辑实现过程中我们在保证数据处理无误的情况下需要尽可能得降低IO（减少shuffle），比如可以执行以下策略

- 慎用效率角度的算子,比如groupBy
- 尽量减少stage数量

#### 3 计算存储资源评估

计算存储资源同样是spark执行效率优化的关键，spark也提供了多种手段来调整资源的使用情况：

- spark.executor.instances executor：设置当前实例的worker数量 ；
- spark.executor.cores：核数，每个Executor中的可同时运行的task数目 ；
- spark.executor.memory：executor内存 ；

#### 4 其他参数

odps.cupid.clientmode.heartbeat.timeout 此配置用来调节cupid(spark on odps) client模式下的心跳超时时间，默认为30分钟，若任务执行较长，需要进行调整。

hbase.client.write.buffer：用来调节lindorm的flush磁盘的buffer大小，lindorm mput数量限制为100(经咨询为全局限制，无法调整)，所以在spark写lindorm时我们主要采用此配置项调节批量写入的数量，这点比较坑。

spark.hadoop.odps.cupid.job.priority：用于调节任务资源获取的优先级。

#### 5 Spark UI

spark 本身的 UI 中有整体的job/stage/task的可视化分析数据，比较方便的查询到对应的执行过程，如下图：

通过SparkUI 可以看到任务的驱动步骤和对应的执行的日志。通过分析可以针对性的优化提升。

#### 6 交互式开发测试

ODPS 有一个非常好的所见所得的 dataworks 平台，大大提升了开发的效率，spark 当前在dataworks没有直接的交互的IDE，需要通过 zeppelin 来实现。zeppelin在数据技术栈中的定位如下：

> Web-based notebook that enables data-driven,
>
> interactive data analytics and collaborative documents with SQL, Scala, Python, R and more.

可以在交互中实现结果的快速反馈。

支持scala 的 UDF 验证等，提升了测试验证效率。

#### 7 效果

经过以上优化，在2500万数据量60worker数的场景，接入+记账+抛账流程由之前的2小时提效至10分钟，同时在编程模式上更加匹配服务端技术的研发模式，提升了研发效率。

### 七 总结

核算业务的特征比较偏向数据和规则的处理，大数据引擎的引入有助于整体业务的交付效率提升和成本降低。目前我们对Spark的认知主要在完成数据处理逻辑开发及日常的调优上，随着运行实例的增多以及业务的不断发展，当前的技术方案也会不断的迭代演进。
