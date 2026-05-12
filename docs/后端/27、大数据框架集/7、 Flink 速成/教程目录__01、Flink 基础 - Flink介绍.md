# 01、Flink 基础 - Flink介绍
- 来源：https://ddkk.com/zhuanlan/bigdata/flink/2/1.html
- 分类：大数据框架
- 分组：教程目录
Apache Flink是一个框架和分布式处理引擎，用于在无界和有界数据流上进行有状态计算。Flink被设计成可以在所有常见的集群环境中运行，以内存速度和任何规模执行计算。

## 一、Flink体系结构介绍

## 1.1 处理无界和有界数据

任何类型的数据都是作为事件流产生的。信用卡交易、传感器测量、机器日志、网站或移动应用程序上的用户交互，所有这些数据都以流的形式生成。

数据可以被处理为无边界或有边界的流。

**1、** 无边界流有一个开始，但没有定义结束它们不会在生成数据时终止并提供数据不受限制的流必须被连续地处理，也就是说，事件必须在被摄取之后被迅速地处理等待所有输入数据到达是不可能的，因为输入是无界的，在任何时间点都不会完成处理无界数据通常要求以特定的顺序(例如事件发生的顺序)摄取事件，以便能够推断结果的完整性；

**2、** 有界流有定义的开始和结束有界流可以通过在执行任何计算之前获取所有数据来处理处理有界流不需要有序的输入，因为有界数据集总是可以排序的有界流的处理也称为批处理；

Apache Flink擅长处理无界和有界数据集。对时间和状态的精确控制使Flink的运行时能够在无边界流上运行任何类型的应用程序。有界流在内部由专为固定大小的数据集设计的算法和数据结构处理，产生卓越的性能。

## 1.2 部署应用程序在任何地方

Apache Flink是一个分布式系统，需要计算资源来执行应用程序。Flink集成了所有常见的集群资源管理器，如Hadoop YARN、Apache Mesos和Kubernetes，但也可以设置为作为独立的集群运行。

Flink被设计成能够很好地工作于前面列出的每个资源管理器。这是通过特定于资源管理器的部署模式实现的，这种部署模式允许Flink以其惯用的方式与每个资源管理器交互。

在部署Flink应用程序时，Flink根据应用程序配置的并行性自动识别所需的资源，并从资源管理器请求它们。在失败的情况下，Flink通过请求新的资源来替换失败的容器。提交或控制应用程序的所有通信都是通过REST调用进行的。这简化了Flink在许多环境中的集成。

## 1.3 在任何规模上运行应用程序

Flink被设计为在任何规模上运行有状态流应用程序。应用程序被并行地分成数千个任务，这些任务分布在一个集群中并并发地执行。因此，应用程序可以利用几乎不受限制的cpu、主内存、磁盘和网络IO。而且，Flink可以轻松维护非常大的应用程序状态。它的异步和增量检查点算法确保了对处理延迟的最小影响，同时保证了精确一次的状态一致性。

用户报告了在他们的生产环境中运行的Flink应用程序令人印象深刻的可伸缩性数字，例如：

**1、** 应用程序每天处理数万亿个事件；

**2、** 维护多个tb状态的应用程序；

**3、** 运行在数千个内核上的应用程序；

## 1.4 利用内存性能

有状态Flink应用程序为本地状态访问进行了优化。任务状态始终在内存中维护，如果状态大小超过可用内存，则在访问效率高的磁盘数据结构中维护。因此，任务通过访问本地(通常在内存中)状态来执行所有计算，从而产生非常低的处理延迟。Flink通过定期和异步地将本地状态检查点指向持久存储来保证故障时的精确一次状态一致性。

## 二、应用程序

## 2.1 流应用程序的构建块

可以用流处理框架构建和执行的应用程序类型由框架控制流、状态和时间的程度来定义。在下面的文章中，我们将描述流处理应用程序的这些构建块，并解释Flink处理它们的方法。

**流**

显然，流是流处理的一个基本方面。然而，流可以有不同的特征，这些特征会影响流可以和应该如何处理。Flink是一个通用的处理框架，可以处理任何类型的流。

有界和无界流:流可以是无界的，也可以是有界的，例如，固定大小的数据集。Flink具有处理无边界流的复杂功能，但也有专门的操作符来有效地处理有边界流。

实时记录流:所有数据都以流的形式生成。处理数据有两种方法。在它生成时实时处理它，或将流持久化到存储系统，例如文件系统或对象存储，并在稍后处理它。Flink应用程序可以处理记录的或实时的流。

**状态**

每个重要的流应用程序都是有状态的，也就是说，只有对单个事件应用转换的应用程序才不需要状态。运行基本业务逻辑的任何应用程序都需要记住事件或中间结果，以便在以后的时间点访问它们，例如在接收到下一个事件时或在特定的持续时间之后。

应用状态是Flink中的一等公民。您可以通过查看Flink在状态处理上下文中提供的所有特性来了解这一点。

**1、** 多个状态原语:Flink为不同的数据结构(如原子值、列表或映射)提供状态原语开发人员可以根据函数的访问模式选择最有效的状态原语；

**2、** 可插状态后端:应用状态在可插状态后端管理和检查点Flink具有不同的状态后端，它们将状态存储在内存或RocksDB中，RocksDB是一种高效的嵌入式磁盘数据存储也可以插入自定义状态后端；

**3、** 精确一次状态一致性:Flink的检查点和恢复算法保证了应用程序在出现故障时状态的一致性因此，故障是透明处理的，不会影响应用程序的正确性；

**4、** 非常大的状态:由于它的异步和增量检查点算法，Flink能够维护数tb大小的应用程序状态；

**5、** 可扩展的应用程序:Flink支持通过将状态重新分配给更多或更少的工人来扩展有状态的应用程序；

**时间**

时间是流媒体应用程序的另一个重要组成部分。大多数事件流都有固有的时间语义，因为每个事件都是在特定的时间点产生的。此外，许多常见的流计算都是基于时间的，例如窗口聚合、会话化、模式检测和基于时间的连接。流处理的一个重要方面是应用程序如何度量时间，即事件时间和处理时间的差异。

Flink提供了一组丰富的时间相关特性。

**1、** 事件时间模式:使用事件时间语义处理流的应用程序根据事件的时间戳计算结果因此，无论记录的事件还是实时事件是被处理的，事件时间处理都能得到准确和一致的结果；

**2、** 水印支持:Flink在事件时间应用中使用水印进行时间推理水印也是一种灵活的机制来权衡结果的延迟和完整性；

**3、** 延迟数据处理:当以事件-时间模式处理带有水印的流时，可能会发生在所有相关事件到达之前计算已经完成这样的事件被称为晚事件Flink提供了多个选项来处理后期事件，比如通过端输出重新路由事件和更新之前完成的结果；

**4、** processing-timeMode:除了事件-时间模式外，Flink还支持processing-time语义，即根据处理器的时钟时间触发计算处理时间模式适合某些严格要求低延迟、能够容忍近似结果的应用程序；

## 2.2 分层的api

Flink提供了三层api。每种API都在简洁性和表达性之间提供了不同的权衡，并针对不同的用例。

我们将简要介绍每个API，讨论它的应用程序，并展示一个代码示例。

**The ProcessFunctions**

ProcessFunctions是Flink提供的最有表现力的函数接口。Flink提供ProcessFunctions来处理来自一个或两个输入流或在窗口中分组的事件的单个事件。ProcessFunctions提供对时间和状态的细粒度控制。ProcessFunction可以任意修改其状态，并注册将来触发回调函数的计时器。因此，ProcessFunctions可以实现许多有状态事件驱动的应用程序所需的复杂的每事件业务逻辑。

下面的示例显示了一个KeyedProcessFunction，它操作KeyedStream并匹配START和END事件。当接收到START事件时，该函数记住其状态的时间戳，并在4小时内注册一个计时器。如果在定时器触发之前收到一个END事件，函数计算END和START事件之间的持续时间，清除状态并返回值。否则，计时器就会触发并清除状态。

```java
/** * Matches keyed START and END events and computes the difference between 
 * both elements' timestamps. The first String field is the key attribute, 
 * the second String attribute marks START and END events.
 */
public static class StartEndDuration
    extends KeyedProcessFunction<String, Tuple2<String, String>, Tuple2<String, Long>> {
  private ValueState<Long> startTime;
  @Override
  public void open(Configuration conf) {
    // obtain state handle
    startTime = getRuntimeContext()
      .getState(new ValueStateDescriptor<Long>("startTime", Long.class));
  }
  /** Called for each processed event. */
  @Override
  public void processElement(
      Tuple2<String, String> in,
      Context ctx,
      Collector<Tuple2<String, Long>> out) throws Exception {
    switch (in.f1) {
      case "START":
        // set the start time if we receive a start event.
        startTime.update(ctx.timestamp());
        // register a timer in four hours from the start event.
        ctx.timerService()
          .registerEventTimeTimer(ctx.timestamp() + 4 * 60 * 60 * 1000);
        break;
      case "END":
        // emit the duration between start and end event
        Long sTime = startTime.value();
        if (sTime != null) {
          out.collect(Tuple2.of(in.f0, ctx.timestamp() - sTime));
          // clear the state
          startTime.clear();
        }
      default:
        // do nothing
    }
  }
  /** Called when a timer fires. */
  @Override
  public void onTimer(
      long timestamp,
      OnTimerContext ctx,
      Collector<Tuple2<String, Long>> out) {
    // Timeout interval exceeded. Cleaning up the state.
    startTime.clear();
  }
}
```

该示例说明了KeyedProcessFunction的表达能力，但也强调了它是一个相当冗长的接口

**The DataStream API**

DataStream API为许多常见的流处理操作提供了原语，比如开窗、一次记录转换，以及通过查询外部数据存储来丰富事件。DataStream API可用于Java和Scala，并基于map()、reduce()和aggregate()等函数。函数可以通过扩展接口定义，也可以定义为Java或Scala lambda函数。

下面的示例演示如何对点击流进行会话并计算每个会话的点击次数。

```java
// a stream of website clicks
DataStream<Click> clicks = ...
DataStream<Tuple2<String, Long>> result = clicks
  // project clicks to userId and add a 1 for counting
  .map(
    // define function by implementing the MapFunction interface.
    new MapFunction<Click, Tuple2<String, Long>>() {
      @Override
      public Tuple2<String, Long> map(Click click) {
        return Tuple2.of(click.userId, 1L);
      }
    })
  // key by userId (field 0)
  .keyBy(0)
  // define session window with 30 minute gap
  .window(EventTimeSessionWindows.withGap(Time.minutes(30L)))
  // count clicks per session. Define function as lambda function.
  .reduce((a, b) -> Tuple2.of(a.f0, a.f1 + b.f1));
```

**SQL & Table API**

Flink具有两个关系API, Table API和SQL。这两个api都是批处理和流处理的统一api，也就是说，查询以相同的语义在无边界的实时流或有边界的记录流上执行，并产生相同的结果。Table API和SQL利用Apache Calcite进行解析、验证和查询优化。它们可以与DataStream和DataSet api无缝集成，并支持用户定义的标量、聚合和表值函数。

Flink的关系api旨在简化数据分析、数据管道和ETL应用程序的定义。

下面的示例显示了会话化单击流并计算每个会话的单击次数的SQL查询。这与DataStream API示例中的用例相同。

```java
SELECT userId, COUNT(*)
FROM clicks
GROUP BY SESSION(clicktime, INTERVAL '30' MINUTE), userId
```

## 2.3 库

Flink为常见的数据处理用例提供了几个库。这些库通常嵌入到API中，并不是完全自包含的。因此，它们可以从API的所有特性中受益，并与其他库集成。

**1、** 复杂事件处理(CEP):模式检测是事件流处理的一个非常常见的用例Flink的CEP库提供了一个API来指定事件模式(可以考虑正则表达式或状态机)CEP库与Flink的DataStreamAPI集成在一起，这样就可以在DataStreams上评估模式CEP库的应用程序包括网络入侵检测、业务流程监控和欺诈检测；

**2、** DataSetAPI:DataSetAPI是Flink用于批处理应用程序的核心APIDataSetAPI的原语包括map、reduce、(外部)连接、co-group和iterate所有操作都由算法和数据结构支持，这些算法和数据结构对内存中的序列化数据进行操作，如果数据大小超过内存预算，就会溢出到磁盘Flink的DataSetAPI的数据处理算法受到了传统数据库操作符的启发，比如混合散列连接或外部合并排序；

**3、** Gelly:Gelly是一个用于可伸缩图形处理和分析的库Gelly是在DataSetAPI之上实现并与之集成的因此，它得益于其可扩展和健壮的操作符Gelly提供了内置算法，如标签传播、三角形枚举和页面排名，但还提供了一个GraphAPI，可以简化自定义图算法的实现；

## 三、 操作

## 3.1 7*24 不间断运行应用程序

机器和进程故障在分布式系统中是普遍存在的。像Flink这样的分布式流处理器必须从故障中恢复，才能全天候运行流应用程序。显然，这不仅意味着在故障后重新启动应用程序，而且还意味着确保其内部状态保持一致，以便应用程序可以继续处理，就像故障从未发生过一样。

Flink提供了几个特性，以确保应用程序保持运行和保持一致:

**1、** 一致的检查点:Flink的恢复机制基于应用程序状态的一致检查点如果出现故障，则重新启动应用程序，并从最新的检查点加载其状态结合可重置的流源，该特性可以保证精确一次的状态一致性；

**2、** 高效的检查点:如果应用程序维护着tb级的状态，那么检查点应用程序的状态是非常昂贵的Flink可以执行异步和增量检查点，以保持检查点对应用程序延迟sla的影响非常小；

**3、** 端到端只写一次:Flink为特定的存储系统提供了事务接收功能，保证数据只写一次，即使发生故障；

**4、** 与集群管理器集成:Flink与集群管理器紧密集成，如HadoopYARN、Mesos或Kubernetes当一个流程失败时，会自动启动一个新的流程来接管它的工作；

**5、** 高可用性设置:Flink具有高可用性模式，消除了所有单点故障ha模式基于ApacheZooKeeper，这是一个经过实战验证的可靠的分布式协调服务；

## 3.2 更新、迁移、挂起和恢复应用程序

支持关键业务服务的流应用程序需要维护。漏洞需要修复，改进或新功能需要实现。然而，更新有状态流应用程序并非易事。通常不能简单地停止应用程序并重新启动一个固定的或改进的版本，因为不能失去应用程序的状态。

Flink的Savepoints是一个独特而强大的特性，它解决了更新有状态应用程序和许多其他相关挑战的问题。保存点是应用程序状态的一致快照，因此非常类似于检查点。然而，与检查点不同的是，保存点需要手动触发，并且在应用程序停止时不会自动删除。保存点可用于启动与状态兼容的应用程序并初始化其状态。保存点启用以下功能:

**1、** 应用程序演进:保存点可用于演进应用程序应用程序的固定版本或改进版本可以从取自该应用程序以前版本的保存点重新启动也可以从较早的时间点(假设存在这样的保存点)启动应用程序，以修复由有缺陷的版本产生的不正确结果；

**2、** 集群迁移:使用保存点，可以将应用程序迁移(或克隆)到不同的集群；

**3、** Flink版本更新:可以使用保存点将应用程序迁移到新的Flink版本上运行；

**4、** 应用程序扩展:保存点可以用来增加或减少应用程序的并行度；

**5、** A/B测试和假设场景:一个应用程序的两个(或更多)不同版本的性能或质量可以通过从同一个保存点启动所有版本来进行比较；

**6、** 暂停和恢复:可以通过获取保存点并停止它来暂停应用程序在以后的任何时间点，应用程序都可以从保存点恢复；

**7、** 存档:可以对保存点进行存档，以便能够将应用程序的状态重置为更早的时间点；

## 3.3 监控您的应用程序

就像任何其他服务一样，持续运行的流应用程序需要被监督并集成到运营基础设施中，即组织的监视和日志服务。监控有助于预测问题并提前做出反应。日志记录使根源分析能够调查失败。最后，控制正在运行的应用程序的易于访问的接口是一个重要特性。

Flink很好地集成了许多常见的日志和监视服务，并提供了一个REST API来控制应用程序和查询信息。

**1、** WebUI:Flink提供WebUI，用于检查、监控和调试运行中的应用程序它还可以用于提交执行或取消执行；

**2、** 日志:Flink实现了流行的slf4j日志接口，并与日志框架log4j或logback集成；

**3、** 度量:Flink提供了一个复杂的度量系统来收集和报告系统和用户定义的度量指标可以导出到多个记者，包括JMX、Ganglia、Graphite、Prometheus、StatsD、Datadog和Slf4j；

**4、** RESTAPI:Flink公开RESTAPI以提交新应用程序、获取运行应用程序的保存点或取消应用程序RESTAPI还公开元数据和收集的运行或完成应用程序的指标；
