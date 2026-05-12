# 08、SkyWalking常见问题及解决方案
- 来源：https://ddkk.com/zhuanlan/linktrack/skywalking/8.html
- 分类：链路追踪
- 分组：SkyWalking 全链路监控系统分析
## 1、异常no such index

## 1.1问题描述

### 1.1.1web程序

### 1.1.2collector日志

2019-01-17 16:00:04,013 - org.apache.skywalking.apm.collector.analysis.worker.timer.PersistenceTimer

-171455014 [pool-2-thread-1] ERROR [] - no such index

org.qtp1828438007-6099.index.IndexNotFoundException: no such index

atorg.elasticsearch.cluster.metadata.IndexNameExpressionResolver.concreteIndices(IndexNameExpressionResolver.java:186) ~[elasticsearch-5.5.0.jar:5.5.0]

atorg.elasticsearch.cluster.metadata.IndexNameExpressionResolver.concreteIndices(IndexNameExpressionResolver.java:122) ~[elasticsearch-5.5.0.jar:5.5.0]

atorg.elasticsearch.cluster.metadata.IndexNameExpressionResolver.concreteSingleIndex(IndexNameExpressionResolver.java:243) ~[elasticsearch-5.5.0.jar:5.5.0]

atorg.elasticsearch.action.support.single.shard.TransportSingleShardAction$AsyncSingleAction.(TransportSingleShardAction.java:146) ~[elasticsearch-5.5.0.jar:5.5.0]

atorg.elasticsearch.action.support.single.shard.TransportSingleShardAction$AsyncSingleAction.(TransportSingleShardAction.java:123) ~[elasticsearch-5.5.0.jar:5.5.0]

atorg.elasticsearch.action.support.single.shard.TransportSingleShardAction.doExecute(TransportSingleShardAction.java:95) ~[elasticsearch-5.5.0.jar:5.5.0]

atorg.elasticsearch.action.support.single.shard.TransportSingleShardAction.doExecute(TransportSingleShardAction.java:59) ~[elasticsearch-5.5.0.jar:5.5.0]

atorg.elasticsearch.action.support.TransportAction.doExecute(TransportAction.java:146) ~[elasticsearch-5.5.0.jar:5.5.0]

atorg.elasticsearch.action.support.TransportAction$RequestFilterChain.proceed(TransportAction.java:170) ~[elasticsearch-5.5.0.jar:5.5.0]

atorg.elasticsearch.action.support.TransportAction.execute(TransportAction.java:142) ~[elasticsearch-5.5.0.jar:5.5.0]

atorg.elasticsearch.action.support.TransportAction.execute(TransportAction.java:84) ~[elasticsearch-5.5.0.jar:5.5.0]

atorg.elasticsearch.action.support.single.shard.TransportSingleShardAction$TransportHandler.messageReceived(TransportSingleShardAction.java:265) ~[elasticsearch-5.5.0.jar:5.5.0]

atorg.elasticsearch.action.support.single.shard.TransportSingleShardAction$TransportHandler.messageReceived(TransportSingleShardAction.java:259) ~[elasticsearch-5.5.0.jar:5.5.0]

atorg.elasticsearch.transport.TransportRequestHandler.messageReceived(TransportRequestHandler.java:33) ~[elasticsearch-5.5.0.jar:5.5.0]

atorg.elasticsearch.transport.RequestHandlerRegistry.processMessageReceived(RequestHandlerRegistry.java:69) ~[elasticsearch-5.5.0.jar:5.5.0]

atorg.elasticsearch.transport.TcpTransport$RequestHandler.doRun(TcpTransport.java:1539) ~[elasticsearch-5.5.0.jar:5.5.0]

atorg.elasticsearch.common.util.concurrent.AbstractRunnable.run(AbstractRunnable.java:37) ~[elasticsearch-5.5.0.jar:5.5.0]

atorg.elasticsearch.common.util.concurrent.EsExecutors$1.execute(EsExecutors.java:110) ~[elasticsearch-5.5.0.jar:5.5.0]

atorg.elasticsearch.transport.TcpTransport.handleRequest(TcpTransport.java:1496) ~[elasticsearch-5.5.0.jar:5.5.0]

atorg.elasticsearch.transport.TcpTransport.messageReceived(TcpTransport.java:1379) ~[elasticsearch-5.5.0.jar:5.5.0]

atorg.elasticsearch.transport.netty4.Netty4MessageChannelHandler.channelRead(Netty4MessageChannelHandler.java:74) ~[transport-netty4-client-5.5.0.jar:5.5.0]

atio.netty.channel.AbstractChannelHandlerContext.invokeChannelRead(AbstractChannelHandlerContext.java:362) ~[netty-transport-4.1.27.Final.jar:4.1.27.Final]

atio.netty.channel.AbstractChannelHandlerContext.invokeChannelRead(AbstractChannelHandlerContext.java:348) ~[netty-transport-4.1.27.Final.jar:4.1.27.Final]

atio.netty.channel.AbstractChannelHandlerContext.fireChannelRead(AbstractChannelHandlerContext.java:340) ~[netty-transport-4.1.27.Final.jar:4.1.27.Final]

atio.netty.handler.codec.ByteToMessageDecoder.fireChannelRead(ByteToMessageDecoder.java:310) ~[netty-codec-4.1.27.Final.jar:4.1.27.Final]

atio.netty.handler.codec.ByteToMessageDecoder.fireChannelRead(ByteToMessageDecoder.java:297) ~[netty-codec-4.1.27.Final.jar:4.1.27.Final]

atio.netty.handler.codec.ByteToMessageDecoder.callDecode(ByteToMessageDecoder.java:413) ~[netty-codec-4.1.27.Final.jar:4.1.27.Final]

atio.netty.handler.codec.ByteToMessageDecoder.channelRead(ByteToMessageDecoder.java:265) ~[netty-codec-4.1.27.Final.jar:4.1.27.Final]

atio.netty.channel.AbstractChannelHandlerContext.invokeChannelRead(AbstractChannelHandlerContext.java:362) ~[netty-transport-4.1.27.Final.jar:4.1.27.Final]

atio.netty.channel.AbstractChannelHandlerContext.invokeChannelRead(AbstractChannelHandlerContext.java:348) ~[netty-transport-4.1.27.Final.jar:4.1.27.Final]

atio.netty.channel.AbstractChannelHandlerContext.fireChannelRead(AbstractChannelHandlerContext.java:340) ~[netty-transport-4.1.27.Final.jar:4.1.27.Final]

atio.netty.channel.ChannelInboundHandlerAdapter.channelRead(ChannelInboundHandlerAdapter.java:86) ~[netty-transport-4.1.27.Final.jar:4.1.27.Final]

atio.netty.channel.AbstractChannelHandlerContext.invokeChannelRead(AbstractChannelHandlerContext.java:362) ~[netty-transport-4.1.27.Final.jar:4.1.27.Final]

atio.netty.channel.AbstractChannelHandlerContext.invokeChannelRead(AbstractChannelHandlerContext.java:348) ~[netty-transport-4.1.27.Final.jar:4.1.27.Final]

atio.netty.channel.AbstractChannelHandlerContext.fireChannelRead(AbstractChannelHandlerContext.java:340) ~[netty-transport-4.1.27.Final.jar:4.1.27.Final]

atio.netty.handler.logging.LoggingHandler.channelRead(LoggingHandler.java:241) ~[netty-handler-4.1.27.Final.jar:4.1.27.Final]

atio.netty.channel.AbstractChannelHandlerContext.invokeChannelRead(AbstractChannelHandlerContext.java:362) ~[netty-transport-4.1.27.Final.jar:4.1.27.Final]

atio.netty.channel.AbstractChannelHandlerContext.invokeChannelRead(AbstractChannelHandlerContext.java:348) ~[netty-transport-4.1.27.Final.jar:4.1.27.Final]

atio.netty.channel.AbstractChannelHandlerContext.fireChannelRead(AbstractChannelHandlerContext.java:340) ~[netty-transport-4.1.27.Final.jar:4.1.27.Final]

atio.netty.channel.DefaultChannelPipeline$HeadContext.channelRead(DefaultChannelPipeline.java:1334) ~[netty-transport-4.1.27.Final.jar:4.1.27.Final]

atio.netty.channel.AbstractChannelHandlerContext.invokeChannelRead(AbstractChannelHandlerContext.java:362) ~[netty-transport-4.1.27.Final.jar:4.1.27.Final]

atio.netty.channel.AbstractChannelHandlerContext.invokeChannelRead(AbstractChannelHandlerContext.java:348) ~[netty-transport-4.1.27.Final.jar:4.1.27.Final]

atio.netty.channel.DefaultChannelPipeline.fireChannelRead(DefaultChannelPipeline.java:926) ~[netty-transport-4.1.27.Final.jar:4.1.27.Final]

atio.netty.channel.nio.AbstractNioByteChannel$NioByteUnsafe.read(AbstractNioByteChannel.java:134) ~[netty-transport-4.1.27.Final.jar:4.1.27.Final]

atio.netty.channel.nio.NioEventLoop.processSelectedKey(NioEventLoop.java:644) ~[netty-transport-4.1.27.Final.jar:4.1.27.Final]

atio.netty.channel.nio.NioEventLoop.processSelectedKeysPlain(NioEventLoop.java:544) ~[netty-transport-4.1.27.Final.jar:4.1.27.Final]

atio.netty.channel.nio.NioEventLoop.processSelectedKeys(NioEventLoop.java:498) ~[netty-transport-4.1.27.Final.jar:4.1.27.Final]

atio.netty.channel.nio.NioEventLoop.run(NioEventLoop.java:458) ~[netty-transport-4.1.27.Final.jar:4.1.27.Final]

atio.netty.util.concurrent.SingleThreadEventExecutor$5.run(SingleThreadEventExecutor.java:858) ~[netty-common-4.1.27.Final.jar:4.1.27.Final]

atjava.lang.Thread.run(Thread.java:745) [?:1.8.0_60]

## 1.2排查过程

### 1.2.1ES索引查看

## 1.3结论

由1.1、1.2可知，索引被删除。

## 1.4解决过程

重启collector服务

## 2、客户端闪退

## 2.1问题描述

Windows环境下启动脚本startup.bat，其中有一个窗口闪退，没有任何日志提示。

## 2.2排查过程

### 2.2.1、startup.bat脚本

脚本内容如下：

由此可见，分别启动了collector和web进程。

### 2.2.2、application配置

配置文件内容如下：

config/application.yml 内有所有的默认配置，可以发现默认是使用 Elasticsearch 进行数据存储的，所以在启动 SkyWalking 之前，确保 Elasticsearch 已启动。

## 3、collector进程多启动错误

## 3.1、问题表现

## 3.2、排查

排查时间2019-01-23 14:52:37,418

### 3.2.1、collector日志

### 3.2.2、agent日志

agnet日志停止了打印。

## 4、collector停止服务

## 4.1、UI体现

## 4.2、日志体现

--注：2019-01-23 15:09:01秒时查看日志

## 5、重启collector无法正常工作

## 5.1、UI体现

## 5.2、日志体现

执行时间2019-01-23 15:19:00

### 5.2.1、collector日志

--应该正常

### 5.2.2、agent日志

### 5.2.3、

## 6、web UI访问正常，未监控到应用

## 1、体现

所有url访问正常，没有异常提示信息，但没有任何监控结果

## 2、原因

重启了boot.sh，没有添加

JAVA_OPTS="$JAVA_OPTS -javaagent:/home/eqs/soft/skywalking5/agent-mall_web/skywalking-agent.jar"

添加配置后如下图：

## 7、DB&Cache以及拓扑图监控显示不完整

## 1、体现

## 2、解决方式

### 1、重命名agent.application_code

位置：…/agent.config

### 2、重启服务
