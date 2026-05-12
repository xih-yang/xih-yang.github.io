# 09、SkyWalking深度研究
- 来源：https://ddkk.com/zhuanlan/linktrack/skywalking/9.html
- 分类：链路追踪
- 分组：SkyWalking 全链路监控系统分析
## 一、总结

## 1、背景独到总结

在目前的微服务或者分布式架构下，分布式追踪变得很重要，在开发测试中可以帮助我们更快发现架构或者一些设计有问题的地方，在生产上可以帮我们统计和分析服务器性能和一些部署相关的问题，还可以帮助我们解决或者分析一些未知的问题。

skywalking的定位是apm，不仅提供了自动分布式追踪，还可以通过手动埋探针的方式去处理我们的一些特殊问题。同时它还支持了很多中间件和jvm监控，这是目前一些分布式追踪技术未能解决的问题。

比如spring cloud sleuth zipkin技术，不能解决kafka等一些中间件和jvm的监控功能，也不支持自定义去追踪自己想要了解的链路信息。

在这些方面skywalking做的还是比较好，通过探针的方式来进行监控做到代码0侵入性，而开销也不是很大。

据官方说在4000tps目前只会多占你当前应用所占cpu的百分之十，意思你的应用占用10%的CPU，加上skywalking你的应用会占到11%,个人认为这种开销是都会被大家所接收的。但目前skywalking还属于apache孵化器，一些组件还不完善，目前5.0版本也还没有到正式版本，所以有些地方做的还不完美，目前笔者使用的是5.0beta版本测试效果还不错，期待尽早能发apache正式版。

## 2、三大组件关系解释

**skywalking部署主要由4部分组成**

collector：主要为收集agent发送过来的数据，和为web提供接口服务

web：主要提供UI监控服务

agent：探针，获取应用信息

存储：其中数据存储为elasticsearch（5.0版本以下单机支持本地h2）

## 3、部署事项

需要注意的是部署collector时默认地址localhost如果不是两个服务同时启在一台服务器的话最好改写为内网或者公网ip地址，如果说一个服务写localhost别的服务写的这台机器的ip,这样的话日志会报错，最好同时写成ip。

另外collector支持定时清理elasticsearh数据，默认好像是7天，在collector配置文件中有一个ttl属性，这个就是设置定期清理时间的。web部署时，需要在启动脚本里传入elasticsearch地址，并且端口设置也在启动脚本中。

agent的放置策略与实际场景有关，建议一个应用独立放一个探针，同一个应用的不同实例可以用一个探针。

其中有一个问题是探针如何来放置?尤其在docker环境下去部署agent,如果每个应用都把agent打在镜像里去启动这样的话感觉资源有些浪费（5.0版本的agent大概好像是17m）。

目前个人解决方式为在配置dockerfile时，可以使用VOLUME指令创建一个agent路径（例如/usr/local/agent/,以下举例将采用这个测试路径），在启动服务时执行“docker run -v 主机路径:容器路径 ”可以把宿主机文件路径中的agent（agent中配置一下通用的配置，例如collector地址）映射到容器中，Dockerfile启动时命令可以这样写 java -javaagent:/usr/local/agent/skywalking-agent.jar -Dskywalking.agent.application_code=应用名 -Dskywalking.logging.file_name=日志名.log -jar 应用.jar，用这种方式来部署比较方便，只需要在部署服务器上放置一个通用的配置的agent就好。

## 4、社区

开发团队乐于帮助使用者，在github提issue和官方群谈论，很快会受到回复消息。

## 二、UI介绍

--https://www.jianshu.com/p/2fd56627a3cf

## 1、总览视图

如果一切顺利(*不顺利请多看几遍*[快速入门](https://github.com/apache/incubator-skywalking/blob/5.x/docs/cn/Quick-start-CN.md))，这时候就可以通过 [http://localhost:8080](http://localhost:8080/) 来查看 SkyWalking UI 了（默认全是0，截图是测试效果），默认账号/密码：admin/admin。

## 2、跨度、链路

单个服务的效果并不明显，看不出请求跨度、链路关系，下面是一个多服务的例子([下载源码](https://github.com/beckjin/SkyWalkingSample))，依赖关系图如下：

根据以上的关系图搭建好项目后，访问接口后结果如下：

一共有4各跨度，先访问 WenAPIService1，然后发送 HttpClient 请求，转到 WenAPIService2，WenAPIService2 执行操作 DB 的命令，每个跨度的耗时一目了然。

## 3、服务拓扑关系

服务关系的拓扑图，调用链路径也非常清晰。

## 三、配置理解

## 1、agent配置解释-application_code

## 四、全链路监控目标要求

--[https://juejin.im/post/5a7a9e0af265da4e914b46f1](https://juejin.im/post/5a7a9e0af265da4e914b46f1)

如上所述，那么我们选择全链路监控组件有哪些目标要求呢？Google Dapper中也提到了，总结如下：

## 1探针的性能消耗

APM组件服务的影响应该做到足够小。**服务调用埋点本身会带来性能损耗，这就需要调用跟踪的低损耗，实际中还会通过配置采样率的方式，选择一部分请求去分析请求路径**。在一些高度优化过的服务，即使一点点损耗也会很容易察觉到，而且有可能迫使在线服务的部署团队不得不将跟踪系统关停。

## 2代码的侵入性

**即也作为业务组件，应当尽可能少入侵或者无入侵其他业务系统，对于使用方透明，减少开发人员的负担**。

对于应用的程序员来说，是不需要知道有跟踪系统这回事的。如果一个跟踪系统想生效，就必须需要依赖应用的开发者主动配合，那么这个跟踪系统也太脆弱了，往往由于跟踪系统在应用中植入代码的bug或疏忽导致应用出问题，这样才是无法满足对跟踪系统“无所不在的部署”这个需求。

## 3可扩展性

**一个优秀的调用跟踪系统必须支持分布式部署，具备良好的可扩展性。能够支持的组件越多当然越好**。或者提供便捷的插件开发API，对于一些没有监控到的组件，应用开发者也可以自行扩展。

## 4数据的分析

**数据的分析要快 ，分析的维度尽可能多**。跟踪系统能提供足够快的信息反馈，就可以对生产环境下的异常状况做出快速反应。**分析的全面，能够避免二次开发**。

## 五、全链路监控功能模块

https://juejin.im/post/5a7a9e0af265da4e914b46f1

一般的全链路监控系统，大致可分为四大功能模块：

## 1埋点与生成日志

埋点即系统在当前节点的上下文信息，可以分为 **客户端埋点、服务端埋点，以及客户端和服务端双向型埋点**。埋点日志通常要包含以下内容traceId、spanId、调用的开始时间，协议类型、调用方ip和端口，请求的服务名、调用耗时，调用结果，异常信息等，同时预留可扩展字段，为下一步扩展做准备；

**不能造成性能负担**：一个价值未被验证，却会影响性能的东西，是很难在公司推广的！

因为要写log，业务QPS越高，性能影响越重。**通过采样和异步log解决**。

## 2收集和存储日志

主要支持分布式日志采集的方案，同时增加MQ作为缓冲；

**1、** 1.每个机器上有一个**deamon**做日志收集，业务进程把自己的Trace发到daemon，daemon把收集Trace往上一级发送；

**2、****多级的collector**，类似pub/sub架构，可以负载均衡；

**3、** 对聚合的数据进行**实时分析和离线存储**；

**4、****离线分析**需要将同一条调用链的日志汇总在一起；

## 3分析和统计调用链路数据，以及时效性

**调用链跟踪分析**：把同一TraceID的Span收集起来，按时间排序就是timeline。**把ParentID串起来就是调用栈**。

抛异常或者超时，在日志里打印TraceID。利用TraceID查询调用链情况，定位问题。

**依赖度量**：

**1、** 1.**强依赖**：调用失败会直接中断主流程；

**2、****高度依赖**：一次链路中调用某个依赖的几率高；

**3、****频繁依赖**：一次链路调用同一个依赖的次数多；

**离线分析**：按TraceID汇总，通过Span的ID和ParentID还原调用关系，分析链路形态。

**实时分析**：对单条日志直接分析，不做汇总，重组。得到当前QPS，延迟。

## 4展现以及决策支持

## 六、Google Dapper

--https://juejin.im/post/5a7a9e0af265da4e914b46f1

## 3.1 Span

**基本工作单元**，一次链路调用（可以是RPC，DB等没有特定的限制）创建一个span，通过一个64位ID标识它，uuid较为方便，span中还有其他的数据，例如描述信息，时间戳，key-value对的（Annotation）tag信息，parent_id等,其中parent-id可以表示span调用链路来源。

上图说明了span在一次大的跟踪过程中是什么样的。**Dapper****记录了span名称，以及每个span的ID和父ID，以重建在一次追踪过程中不同span之间的关系**。如果一个span没有父ID被称为root span。**所有span都挂在一个特定的跟踪上，也共用一个跟踪id**。

**Span****数据结构**：

```json
type Span struct {
    TraceID    int64 // 用于标示一次完整的请求id
    Name       string
    ID         int64 // 当前这次调用span_id
    ParentID   int64 // 上层服务的调用span_id  最上层服务parent_id为null
    Annotation []Annotation // 用于标记的时间戳
    Debug      bool
}
```

## 3.2 Trace

类似于**树结构的Span集合**，表示一次完整的跟踪，从请求到服务器开始，服务器返回response结束，跟踪每次rpc调用的耗时，存在唯一标识trace_id。比如：你运行的分布式大数据存储一次Trace就由你的一次请求组成。

每种颜色的note标注了一个span，一条链路通过TraceId唯一标识，Span标识发起的请求信息。

**树节点是整个架构的基本单元，而每一个节点又是对span的引用**。

节点之间的连线表示的span和它的父span直接的关系。虽然span在日志文件中只是简单的代表span的开始和结束时间，他们在整个树形结构中却是相对独立的。

## 3.3 Annotation

**注解，用来记录请求特定事件相关信息（例如时间），一个span中会有多个annotation注解描述**。通常包含四个注解信息：

(1)**cs**：Client Start，表示客户端发起请求

(2) **sr**：Server Receive，表示服务端收到请求

(3) **ss**：Server Send，表示服务端完成处理，并将结果发送给客户端

(4) **cr**：Client Received，表示客户端获取到服务端返回信息

**Annotation数据结构**：

```json
type Annotation struct {
    Timestamp int64
    Value     string
    Host      Endpoint
    Duration  int32
}
```

## 3.4 调用示例

**1、****请求调用示例**；

**1、** 当用户发起一个请求时，首先到达前端A服务，然后分别对B服务和C服务进行RPC调用；

**2、** B服务处理完给A做出响应，但是C服务还需要和后端的D服务和E服务交互之后再返还给A服务，最后由A服务来响应用户的请求；

**2****调用过程追踪**

**1、****请求到来生成一个全局TraceID**，通过TraceID可以串联起整个调用链，一个TraceID代表一次请求；

**2、** 除了TraceID外，**还需要SpanID用于记录调用父子关系**每个服务会记录下parentid和spanid，**通过他们可以组织一次完整调用链的父子关系**；

**3、** 一个没有parentid的span成为rootspan，可以看成调用链入口；

**4、** 所有这些ID可用全局唯一的64位整数表示；

**5、****整个调用过程中每个请求都要透传TraceID和SpanID**；

**6、** 每个服务将该次请求附带的TraceID和附带的SpanID作为parentid记录下，并且将自己生成的SpanID也记录下；

**7、** 要查看某次完整的调用则**只要根据TraceID查出所有调用记录，然后通过parentid和spanid组织起整个调用父子关系**；

**3****调用链核心工作**

**1、****调用链数据生成**，对整个调用过程的所有应用进行埋点并输出日志；

**2、****调用链数据采集**，对各个应用中的日志数据进行采集；

**3、****调用链数据存储及查询**，对采集到的数据进行存储，由于日志数据量一般都很大，不仅要能对其存储，还需要能提供快速查询；

**4、****指标运算、存储及查询**，对采集到的日志数据进行各种指标运算，将运算结果保存起来；

**5、****告警功能**，提供各种阀值警告功能；

**4****整体部署架构**

·通过AGENT生成调用链日志。

·通过logstash采集日志到kafka。

·kafka负责提供数据给下游消费。

·storm计算汇聚指标结果并落到es。

· **storm****抽取trace数据并落到es，这是为了提供比较复杂的查询**。比如通过时间维度查询调用链，可以很快查询出所有符合的traceID，**根据这些traceID再去**[Hbase](https://link.juejin.im?target=http%3A%2F%2Flib.csdn.net%2Fbase%2Fhbase)**查数据就快了**。

·logstash将kafka原始数据拉取到hbase中。**hbase****的rowkey为traceID，根据traceID查询是很快的**。

5 **AGENT****无侵入部署**

通过AGENT代理无侵入式部署，将性能测量与业务逻辑完全分离，可以测量任意类的任意方法的执行时间，这种方式大大提高了采集效率，并且减少运维成本。**根据服务跨度主要分为两大类AGENT**：

**1、****服务内AGENT**，这种方式是通过[Java](https://link.juejin.im?target=http%3A%2F%2Flib.csdn.net%2Fbase%2Fjavase)的agent机制，对服务内部的方法调用层次信息进行数据收集，如方法调用耗时、入参、出参等信息；

**2、****跨服务AGENT**，这种情况需要对主流RPC框架以插件形式提供无缝支持并通过提供标准数据规范以适应自定义RPC框架：

（1）Dubbo支持；；

（2）Rest支持；；

（3）自定义RPC支持；；

6**调用链监控好处**

1、 准确掌握生产一线应用部署情况；

2、 从调用链全流程性能角度，识别对关键调用链，并进行优化；

3、 提供可追溯的性能数据，量化IT运维部门业务价值；

4、 快速定位代码性能问题，协助开发人员持续性的优化代码；

5、 协助开发人员进行白盒测试，缩短系统上线稳定期；

作者：猿码道

链接：https://juejin.im/post/5a7a9e0af265da4e914b46f1

来源：掘金

著作权归作者所有。商业转载请联系作者获得授权，非商业转载请注明出处。

## 七、方案比较

--https://juejin.im/post/5a7a9e0af265da4e914b46f1

市面上的全链路监控理论模型大多都是借鉴Google Dapper论文，本文重点关注以下三种APM组件：

**1、**[Zipkin](https://link.juejin.im?target=http%3A%2F%2Fzipkin.io%2F)：由Twitter公司开源，开放源代码分布式的跟踪系统，用于收集服务的定时数据，以解决微服务架构中的延迟问题，包括：数据的收集、存储、查找和展现；

**2、**[Pinpoint](https://link.juejin.im?target=https%3A%2F%2Fgithub.com%2Fnaver%2Fpinpoint)：一款对Java编写的大规模分布式系统的APM工具，由韩国人开源的分布式跟踪组件；

**3、**[Skywalking](https://link.juejin.im?target=http%3A%2F%2Fskywalking.org%2F)：国产的优秀APM组件，是一个对JAVA分布式应用程序集群的业务运行情况进行追踪、告警和分析的系统；

**以上三种全链路监控方案需要对比的项提炼出来**：

**1、****探针的性能**；

主要是agent对服务的吞吐量、CPU和内存的影响。微服务的规模和动态性使得数据收集的成本大幅度提高。

**1、****collector****的可扩展性**；

能够水平扩展以便支持大规模服务器集群。

**1、****全面的调用链路数据分析**；

提供代码级别的可见性以便轻松定位失败点和瓶颈。

**1、****对于开发透明，容易开关**；

添加新功能而无需修改代码，容易启用或者禁用。

**1、****完整的调用链应用拓扑**；

自动检测应用拓扑，帮助你搞清楚应用的架构

## 八、探针的性能

https://juejin.im/post/5a7a9e0af265da4e914b46f1

比较关注探针的性能，毕竟APM定位还是工具，如果启用了链路监控组建后，直接导致吞吐量降低过半，那也是不能接受的。对skywalking、zipkin、pinpoint进行了压测，并与基线（未使用探针）的情况进行了对比。

选用了一个常见的基于Spring的应用程序，他包含Spring Boot, Spring MVC，redis客户端，mysql。 监控这个应用程序，每个trace，探针会抓取5个span(1 Tomcat, 1 SpringMVC, 2 Jedis, 1 Mysql)。这边基本和 [skywalkingtest](https://link.juejin.im?target=https%3A%2F%2Fskywalkingtest.github.io%2FAgent-Benchmarks%2FREADME_zh.html) 的测试应用差不多。

模拟了三种并发用户：500，750，1000。使用jmeter测试，每个线程发送30个请求，设置思考时间为10ms。使用的采样率为1，即100%，这边与生产可能有差别。pinpoint默认的采样率为20，即50%，通过设置agent的配置文件改为100%。zipkin默认也是1。组合起来，一共有12种。下面看下汇总表：

从上表可以看出，在三种链路监控组件中，**skywalking的探针对吞吐量的影响最小，zipkin的吞吐量居中。pinpoint的探针对吞吐量的影响较为明显**，在500并发用户时，测试服务的吞吐量从1385降低到774，影响很大。然后再看下CPU和memory的影响，在内部服务器进行的压测，对CPU和memory的影响都差不多在10%之内。

## 八、collector可扩展性

https://juejin.im/post/5a7a9e0af265da4e914b46f1

collector的可扩展性，使得能够水平扩展以便支持大规模服务器集群。

**1、****zipkin**；

开发zipkin-Server（其实就是提供的开箱即用包），zipkin-agent与zipkin-Server通过http或者mq进行通信，**http通信会对正常的访问造成影响，所以还是推荐基于mq异步方式通信**，zipkin-Server通过订阅具体的topic进行消费。这个当然是可以扩展的，**多个zipkin-Server实例进行异步消费mq中的监控信息**。

2 **skywalking**

skywalking的collector支持两种部署方式：**单机和集群模式。collector与agent之间的通信使用了gRPC**。

3 **pinpoint**

同样，pinpoint也是支持集群和单机部署的。**pinpoint agent通过thrift通信框架，发送链路信息到collector**。

## 九、深入全面的调用链路数据分析

全面的调用链路数据分析，提供代码级别的可见性以便轻松定位失败点和瓶颈。

**1、****zipkin**；

**1、****skywalking**；

**skywalking****还支持20+的中间件、框架、类库**，比如：主流的dubbo、Okhttp，还有DB和消息中间件。上图skywalking链路调用分析截取的比较简单，网关调用user服务，**由于支持众多的中间件，所以skywalking链路调用分析比zipkin完备些**。

3 **pinpoint**

pinpoint应该是这三种APM组件中，**数据分析最为完备的组件**。提供代码级别的可见性以便轻松定位失败点和瓶颈，上图可以看到对于执行的sql语句，都进行了记录。还可以配置报警规则等，设置每个应用对应的负责人，根据配置的规则报警，支持的中间件和框架也比较完备。

## 十、深入对于开发透明，容易开关

对于开发透明，容易开关，添加新功能而无需修改代码，容易启用或者禁用。我们期望功能可以不修改代码就工作并希望得到代码级别的可见性。

对于这一点，**Zipkin 使用修改过的类库和它自己的容器(Finagle)来提供分布式事务跟踪的功能**。但是，它要求在需要时修改代码。**skywalking和pinpoint都是基于字节码增强的方式，开发人员不需要修改代码，并且可以收集到更多精确的数据因为有字节码中的更多信息**。

## **十一、完整的调用链应用拓扑

自动检测应用拓扑，帮助你搞清楚应用的架构。**

上面三幅图，分别展示了APM组件各自的调用拓扑，都能实现完整的调用链应用拓扑。相对来说，**pinpoint****界面显示的更加丰富，具体到调用的DB名，zipkin的拓扑局限于服务于服务之间**。

## 十一、字节码注入 vs API 调用

Pinpoint 实现了基于字节码注入的 Java Agent 探针，而 Zipkin 的 Brave 框架仅仅提供了应用层面的 API，但是细想问题远不那么简单。**字节码注入是一种简单粗暴的解决方案，理论上来说无论任何方法调用，都可以通过注入代码的方式实现拦截，也就是说没有实现不了的，只有不会实现的**。但 Brave 则不同，**其提供的应用层面的 API 还需要框架底层驱动的支持，才能实现拦截**。比如，MySQL 的 JDBC 驱动，就提供有注入 interceptor 的方法，因此只需要实现 StatementInterceptor 接口，并在 Connection String 中进行配置，就可以很简单的实现相关拦截；而与此相对的，低版本的 MongoDB 的驱动或者是 Spring Data MongoDB 的实现就没有如此接口，想要实现拦截查询语句的功能，就比较困难。

因此在这一点上，Brave 是硬伤，无论使用字节码注入多么困难，但至少也是可以实现的，但是 Brave 却有无从下手的可能，而且是否可以注入，能够多大程度上注入，更多的取决于框架的 API 而不是自身的能力。

## 十二、Tracing和Monitor区别

**Monitor****可分为系统监控和应用监控**。系统监控比如CPU，内存，网络，磁盘等等整体的系统负载的数据，细化可具体到各进程的相关数据。这一类信息是直接可以从系统中得到的。**应用监控需要应用提供支持，暴露了相应的数据**。比如应用内部请求的QPS，请求处理的延时，请求处理的error数，消息队列的队列长度，崩溃情况，进程垃圾回收信息等等。**Monitor****主要目标是发现异常，及时报警**。

**Tracing****的基础和核心都是调用链**。相关的metric大多都是围绕调用链分析得到的。**Tracing****主要目标是系统分析。提前找到问题比出现问题后再去解决更好**。

Tracing和应用级的Monitor技术栈上有很多共同点。都有数据的采集，分析，存储和展式。只是具体收集的数据维度不同，分析过程不一样。

## 十三、Dapper的三个具体设计目标

https://www.cnblogs.com/xiaoqi/p/apm.html

**1、****性能消耗低**；

APM组件服务的影响应该做到足够小。**服务调用埋点本身会带来性能损耗，这就需要调用跟踪的低损耗，实际中还会通过配置采样率的方式，选择一部分请求去分析请求路径**。在一些高度优化过的服务，即使一点点损耗也会很容易察觉到，而且有可能迫使在线服务的部署团队不得不将跟踪系统关停。

**1、****应用透明**，也就是**代码的侵入性小**；

**即也作为业务组件，应当尽可能少入侵或者无入侵其他业务系统，对于使用方透明，减少开发人员的负担**。

对于应用的程序员来说，是不需要知道有跟踪系统这回事的。如果一个跟踪系统想生效，就必须需要依赖应用的开发者主动配合，那么这个跟踪系统也太脆弱了，往往由于跟踪系统在应用中植入代码的bug或疏忽导致应用出问题，这样才是无法满足对跟踪系统“无所不在的部署”这个需求。

**1、****可扩展性**；

**一个优秀的调用跟踪系统必须支持分布式部署，具备良好的可扩展性。能够支持的组件越多当然越好**。或者提供便捷的插件开发API，对于一些没有监控到的组件，应用开发者也可以自行扩展。

**1、****数据的分析**；

**数据的分析要快****，分析的维度尽可能多**。跟踪系统能提供足够快的信息反馈，就可以对生产环境下的异常状况做出快速反应。**分析的全面，能够避免二次开发**。

## 十四、 Dapper的分布式跟踪原理

https://www.cnblogs.com/xiaoqi/p/apm.html

先来看一次请求调用示例：

**1、** 包括：前端（A），两个中间层（B和C），以及两个后端（D和E）；

**2、** 当用户发起一个请求时，首先到达前端A服务，然后分别对B服务和C服务进行RPC调用；

**3、** B服务处理完给A做出响应，但是C服务还需要和后端的D服务和E服务交互之后再返还给A服务，最后由A服务来响应用户的请求；

Dapper是如何来跟踪记录这次请求呢？

**1.3.1 跟踪树和span**

Span是dapper的**基本工作单元**，一次链路调用（可以是RPC，DB等没有特定的限制）创建一个span，通过一个64位ID标识它；同时附加（Annotation）作为payload负载信息，用于记录性能等数据。

上图说明了span在一次大的跟踪过程中是什么样的。**Dapper记录了**span**名称，以及每个**span**的**ID**和父**ID**，以重建在一次追踪过程中不同**span**之间的关系**。如果一个span没有父ID被称为root span。**所有span**都挂在一个特定的跟踪上，也共用一个跟踪****id。

再来看下**Span****的细节**：

**Span数据结构**：

```java
type Span struct {
```json
type Annotation struct {
    Timestamp int64
    Value     string
    Host      Endpoint
    Duration  int32
}
```

**1.3.2 TraceID**

类似于**树结构的Span集合**，表示一次完整的跟踪，从请求到服务器开始，服务器返回response结束，跟踪每次rpc调用的耗时，存在唯一标识trace_id。比如：你运行的分布式大数据存储一次Trace就由你的一次请求组成。

每种颜色的note标注了一个span，一条链路通过TraceId唯一标识，Span标识发起的请求信息。**树节点是整个架构的基本单元，而每一个节点又是对span的引用**。

节点之间的连线表示的span和它的父span直接的关系。虽然span在日志文件中只是简单的代表span的开始和结束时间，他们在整个树形结构中却是相对独立的。

**1.3.3 Annotation**

Dapper允许应用程序开发人员在Dapper跟踪的过程中添加额外的信息，以监控更高级别的系统行为，或帮助调试问题。这就是Annotation：

**Annotation**，用来记录请求特定事件相关信息（例如时间），**一个span中会有多个annotation注解描述**。通常包含四个注解信息：

(1)**cs**：Client Start，表示客户端发起请求

(2)**sr**：Server Receive，表示服务端收到请求

(3)**ss**：Server Send，表示服务端完成处理，并将结果发送给客户端

(4)**cr**：Client Received，表示客户端获取到服务端返回信息

**Annotation****数据结构**：

```java
type Annotation struct {
        Timestamp int64
        Value     string
        Host      Endpoint
        Duration  int32
}
```

**1.3.4 采样率**

低损耗的是Dapper的一个关键的设计目标，因为如果这个工具价值未被证实但又对性能有影响的话，你可以理解服务运营人员为什么不愿意部署它。

另外，某些类型的Web服务对植入带来的性能损耗确实非常敏感。

因此，除了把Dapper的收集工作对基本组件的性能损耗限制的尽可能小之外，Dapper支持设置采样率来减少性能损耗，同时支持**可变采样**。

## 十五、深入

## 2、查看性能差的SQL

发现当前用的EF框架偶尔会因为不小心就写出了性能很差的SQL,测试环境基本看不

到了生产可能就炸.

## 3、支持

##&&####&&####&&####&&##

--https://github.com/apache/incubator-skywalking

SkyWalking支持从多个来源和多种格式收集遥测（痕迹和指标）数据。

SkyWalking supports to collect telemetry (traces and metrics) data from multiple sources and multiple formats. including

Java, .NET Core and NodeJS auto-instrument agents in SkyWalking format

Istio telemetry format

Zipkin v1/v2 formats

## 4、新特性（6.0）

来源：http://skywalking.apache.org/downloads/

**6、** x版本；

**6、** 0.0-beta的变化；

支持SpringMVC 5

支持webflux

支持通过系统环境覆盖agent.config的新方法。

Span标记可以通过显式方式覆盖。

后端

支持MySQL作为存储。

支持服务实例和端点告警。

支持服务吞吐量（cpm），成功率（sla），平均响应时间和p99 / p95 / p90 / p75 / p50响应时间。

支持后端跟踪采样。

再次支持Zipkin格式。

支持init模式。

支持Zookeeper集群管理中的命名空间。

支持集群模块中的consul插件。

UI

支持服务吞吐量（cpm），成功率（sla），平均响应时间和p99 / p95 / p90 / p75 / p50响应时间

## 2、UI图

## 十六、参考资源

（一）、环境部署--社区

**1、** 网络；

https://blog.csdn.net/y_h_d/article/details/83342846

https://blog.csdn.net/zhangkang65/article/details/78991760

**2、** 端口修改skywalking8080端口修改；

https://my.oschina.net/ytqvip/blog/1793767

**3、** 社区；

docker环境：

https://www.cnblogs.com/liguobao/p/9686310.html

**4、** 版本5.X；

A类

es环境安装：

http://blog.51cto.com/zero01/2130696

高级特性

https://blog.csdn.net/jilo88/article/details/81355265

https://blog.csdn.net/SoberChina/article/details/79315242

https://blog.csdn.net/qq_42281649/article/details/82804703

**5、** 独到总结；

https://blog.csdn.net/qq_36236890/article/details/79647017

**6、** 官方社区；

https://github.com/OpenSkywalking/Community

**7、** 高级部署；

http://blog.51cto.com/536410/2318051

**8、** APM、Google；

pass==++++https://www.cnblogs.com/xiaoqi/p/apm.html

（二）、环境部署--官方--文档

**1、** 官方；

中文

https://github.com/apache/incubator-skywalking/blob/5.x/docs/README_ZH.md

--英文

https://github.com/apache/incubator-skywalking

**2、** Docker；

https://github.com/JaredTan95/skywalking-docker

**3、** 如何构建项目；

https://github.com/apache/incubator-skywalking/blob/master/docs/en/guides/How-to-build.md

（三）、高级特性

**1、** 个性化服务过滤；

https://github.com/apache/incubator-skywalking/blob/5.x/apm-sniffer/optional-plugins/trace-ignore-plugin/README_CN.md

https://blog.csdn.net/u013095337/article/details/80452088

**2、** 版本、；

https://github.com/SkywalkingTest/agent-integration-test-report#dubbo

（四）、理论、深入研究文章

**1、** 架构设计-系列文章；

https://github.com/apache/incubator-skywalking/blob/5.x/docs/cn/Architecture-CN.md

https://blog.csdn.net/Saphulot/article/details/81739411

pass==https://www.jianshu.com/p/2fd56627a3cf

**2、** 全面深入分析；

https://juejin.im/post/5a7a9e0af265da4e914b46f1

**3、** 全面学习；

http://www.iocoder.cn/categories/SkyWalking/

**4、** 10加文章；

https://juejin.im/post/5ab5b0e26fb9a028e25d7fcb

**5、** skywalking源码解析之javaAgent工具ByteBuddy的应用；

http://www.kailing.pub/article/index/arcid/178.html

**6、** 谷歌论文《Dapper，大规模分布式系统的跟踪系统》；

http://bigbully.github.io/Dapper-translation/

（五）、监控应用

https://www.jianshu.com/p/3ddd986c7581

https://www.cnblogs.com/huangxincheng/p/9666930.html

（六）、APM常见技术对比

https://blog.csdn.net/u012394095/article/details/79700200

https://www.jianshu.com/p/0fbbf99a236e

https://www.cnblogs.com/davidwang456/articles/8119047.html

（七）、UI

https://blog.csdn.net/qq_36236890/article/details/79647017

http://blog.zollty.com/b/archive/apm-comparison-of-skywalking-and-pinpiont.html
