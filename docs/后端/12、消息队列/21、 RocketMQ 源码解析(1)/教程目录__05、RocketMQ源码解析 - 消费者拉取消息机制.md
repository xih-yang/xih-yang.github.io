# 05、RocketMQ源码解析 - 消费者拉取消息机制
- 来源：https://ddkk.com/zhuanlan/mq/rocketmq/1/5.html
- 分类：消息队列
- 分组：教程目录
**1、** 消息消费需要解决的问题；

首先再次重复啰嗦一下RocketMQ消息消费的一些基本元素的关系

主题---》 消息队列(MessageQueue) 1 对多

主题----》 消息生产者，，，一般主题会由多个生产者组成，生产者组

主题---- 》 消息消费者，，一般一个主题也会被多个消费者消费

那消息消费至少需要解决如下问题：

**1、** 一个消费组中多个消费者是如何对消息队列（1个主题多个消息队列）进；

行负载消费的。

**2、** 一个消费者中多个线程又是如何协作（并发）的消费分配给该消费者的；

消息队列中的消息呢？

**3、** 消息消费进度如何保存，包括MQ是如何知道消息是否正常被消费了；

**4、** RocketMQ推拉模式实现机制；

再提一个业界关于消费者与消息队列的消费规则

1个消费者可以消费多个消息队列，但一个消息队列同一时间只能被一个消费者消费，这又是如何实现的呢？

后续几篇文章都会围绕上述问题进行展开，读者朋友们，带上上述的问题，我们一起遨游在RocketMQ消息消费的世界中吧。

**2、** 消费端拉取消息机制；

**2、** 1消息消费端核心类介绍；

DefaultMQPushConsumerImpl ：消息消息者默认实现类，应用程序中直接用该类的实例完成消息的消费，并回调业务方法。

RebalanceImpl 字面上的意思（重新平衡）也就是消费端消费者与消息队列的重新分布，与消息应该分配给哪个消费者消费息息相关。

MQClientInstance 消息客户端实例，负载与MQ服务器（Broker,Nameserver)交互的网络实现

PullAPIWrapper pull与Push在RocketMQ中，其实就只有Pull模式，所以Push其实就是用pull封装一下

MessageListenerInner 消费消费回调类，当消息分配给消费者消费时，执行的业务代码入口

OffsetStore 消息消费进度保存

ConsumeMessageService 消息消费逻辑

消费端使用实例：

**2、** 2消息消费者启动关键流程；

1）构建 RebalanceImpl

2）PullAPIWrapper 对象构建

3）消费进度加载

4）消费管理ConsumeMessageService

5）MQClientInstance 启动，进入消息消费

**2、** 2.1MQClientInstance；

**2、** 2.1.1定时任务一览表；

每隔2分钟尝试获取一次NameServer地址

每隔30S尝试更新主题路由信息

每隔30S 进行Broker心跳检测

默认每隔5秒持久化ConsumeOffset

默认每隔1S检查线程池适配

上述定时任务，下文或后续文章会重点剖析一下【持久化ConsumeOffset】

**2、** 2.1.2PullMesssageService；

从上面感悟：一个应用程序，一个消费组，只需要一个DefaultMQPushConsumerImpl,，在一个应用中，使用多线程创建多个

消费者，尝试去消费同一个组，没有效果，只会有一个消费者在消费。

PullMessageService的工作职责是 从LinkedBlockQueue中循环取PullRequest对象，然后执行pullMessage方法

看到这，我不禁又冒出2个疑问：

1）DefaultMQPushConsumerImpl 与PullMessageService关系

2）LinkedBlockQueue 中的PullRequest对象在什么时候放入的。

在这里先解决都一个疑问：

我们知道，一个应用程序（消费端），一个消费组 一个 DefaultMQPushConsumerImpl ，同一个IP:端口，会有一个MQClientInstance ，而每一个MQClientInstance中持有一个PullMessageServive实例，故可以得出如下结论：同一个应用程序中，如果存在多个消费组，那么多个DefaultMQPushConsumerImpl 的消息拉取，都需要依靠一个PullMessageServive。那他们之间又是如何协作的呢？

继续带着疑问，看下文：

DefaultMQPushConsumerImpl pullMessage 关键代码：

**1、** 首先获取PullRequest的处理队列ProcessQueue,然后更新该消息队列最后一次拉取的时间；

**2、** 如果消费者服务状态不为ServiceState.RUNNING，或当前处于暂停状态，默认延迟3秒再执行(PullMessageService.executePullRequestLater)；

**3、** 流量控制，两个维度，消息数量达到阔值（默认1000个），或者消息体总大小(默认100m)；

再看一下延迟执行：其实最终就是将PullRequest,在50毫秒后，放入LinkedBlockQueue中，然后继续尝试拉取。

接下来，先重点分析非顺序消息（顺序消息在后续专题中继续跟进）

**4、** 获取主题订阅信息；

**5、** 如果是集群消费模式，从内存中获取MessageQueue的commitlog偏移量；

**6、** 构建拉取消息系统Flag:是否支持comitOffset,suspend,subExpression,classFilter；

接下来，重点关注一下PullAPIWrapper pullKernelImpl的核心逻辑：

```java
public PullResult pullKernelImpl(
final MessageQueue mq, // 消息消费队列
final String subExpression, // 消息订阅子模式subscribe( topicName, "模式")
final String expressionType, //
final long subVersion, // 版本
final long offset, // pullRequest.getNextOffset()
final int maxNums, // defaultMQPushConsumer.getPullBatchSize()
final int sysFlag, // 系统标记，FLAG\_COMMIT\_OFFSET FLAG\_SUSPEND FLAG\_SUBSCRIPTION FLAG\_CLASS\_FILTER
final long commitOffset, // 当前消息队列 commitlog日志中当前的最新偏移量（内存中）
final long brokerSuspendMaxTimeMillis, // 允许的broker 暂停的时间，毫秒为单位，默认为15s
final long timeoutMillis, // 超时时间,默认为30s
final CommunicationMode communicationMode, // SYNC ASYNC ONEWAY
final PullCallback pullCallback // pull 回调
)throws MQClientException, RemotingException, MQBrokerException, InterruptedException
pullKernelImpl
```

1)根据MQ的Broker信息获取查找Broker信息，封装成FindBrokerResult。

然后通过网络去 拉取具体的消息，也就是消息体 中的数据。具体数据拉取逻辑，在重点分析消息存储时重点去研究。

最终返回一个拉取结果：

同时，拉取消息，会根据拉取模式，是同步还是异步模式，调用回调或直接处理：MQClientAPIImpl。

接下来，已异步调用为例，分析拉取到消息后的回调处理逻辑。

代码入口：PullCallback pullCallback = new PullCallback()，见DefaultMQPushConsumerImpl 288行

**1、** 首先对PullResult进行处理，主要完成如下3件事：1）对消息体解码成一条条消息2）执行消息过滤3）执行回调；

**2、** 根据拉取结果分别采取不同的策略；

1）拉取到消息，首先放入到处理队列中；然后是消费消息服务提交

第一步，将消息放入消费队列中：就是将拉取的消息，放入到ProcessQueue的msgTreeMap容器中。

第二步，消费消息服务提交

这里十分有必要对顺序消息与非顺序消息的消费方式分别了解一下

1）非顺序消息 消息消费服务ConumeMessageService的提交消费请求

该方法重点已经标明，如果此次拉取的消息条数大于ConsumeMessageBatchMaxSize,则分批消费。此处更有一个关键点，

this.consumeExecutor.submit(consumeRequest)

consumeExecutor : 消费端消费线程池

线程池的常驻线程数：consumeThreadMin

线程池的最大线程数：consumeThreadMax

线程池中的线程名：ConsumeMessageThread_

这里就明确了一个点，一个消费者非顺序消费者，内部使用一个线程池来并非消费消息，一个线程一批次最大处理consumeMessageBatchMaxSize条消息。

再来关注一下，消费任务逻辑类：ConsumeRequest

下面重点分析run方法

runpart1：执行消息消费前钩子函数

首先，获取业务系统定义的消息消费监听器，负责具体消息的消费，例如：

如果消费者注册了消息消费者hook(钩子函数，在消息消费之前，消费之后执行相关方法)

runpart2：设置消息的重试主题，并开始消费消息，并返回该批次消息消费结果：

runpart3：根据是否出现异常等，判断处理结果

runpart4: 执行消息消费钩子方法，并根据消息消费结果（成功或失败）处理消费进度等。这里目前不关注其细节，如果有兴趣，可以重点看一下ConsumeMessageConcurrentlyService.processConsumeResult

再总结一下非顺序消费（并非消费）的主要思路：

**1、** 将待消费的消息存入ProcessQueue中存储，并执行消息消费之前钩子函数；

**2、** 修改待消费消息的主题（设置为消费组的重试主题）；

**3、** 分页消费（每次传给业务消费监听器的最大数量为配置的；

sconsumeMessageBatchMaxSize

**4、** 执行消费后钩子函数，并根据业务方返回的消息消费结果（成功，重试）【ACK】确认信息，然后更新消息进度，从ProceeQueue中删除相应的消息；

2）顺序消息 消息消费服务ConumeMessageService的提交消费请求【ConsumeMessageOrderlyService】

这里与非顺序消息的区别是ConsumeRequest只针对ProcessQueue,messageQueue,接下来，我们重点分析ConsumeMessageOrderlyService 中ConsumeRequest(消息消费任务封装)

重点需要关注ConsumeRequest的run方法

消息消费的逻辑与非顺序消费差不多，但其关键点，在于消息消费或获取的顺序性，既然要保证顺序性消费，就不可避免的引入锁机制，关键代码剖析如下：

一个消费者中线程池中线程的锁粒度为，MessageQueue,消费队列，也就是说RocketMQ实现顺序消费是针对MessageQueue,也就是RocketMQ无法做到多MessageQueue的全局顺序消费，如果要使用RocketMQ做的主题的全局顺序消费，那该主题只能允许一个队列。顺序消息消费的更多细节，本文暂不深入分析，在后续专题中会重点分析。

好了，本文到此为止。

读者朋友们，您觉得本文重点解答了开篇哪些问题呢？欢迎大家讨论与总结，请继续关注后续文章，继续探讨RocketMQ消息消费机制。

未分析问题：

**1、** 消息消费者负载加载，消息进入commitlog后，消息分发与消息负载机制【重点待分析】；

**2、** 消息消费进度保持机制等；
