# 01、RocketMQ源码解析 - NameServer
- 来源：https://ddkk.com/zhuanlan/mq/rocketmq/1/1.html
- 分类：消息队列
- 分组：教程目录
## 1、RocketMQ组件概述

- NameServer

NameServer相当于配置中心，维护Broker集群、Broker信息、Broker存活信息、主题与队列信息等。NameServer彼此之间不通信，每个Broker与集群内所有的Nameserver保持长连接。

## 2、源码解析NameServer

本文不对 NameServer 与 Broker、Producer 集群、Consumer 集群的网络通信做详细解读（该系列后续专门进行讲解）

本文重点关注 NameServer 作为 MQ 集群的配置中心存储什么信息。

## 2.1 源码解析NamesrvController

NameserController 是 NameServer 模块的核心控制类。

### 2.1.1 NamesrvConfig

NamesrvConfig,主要指定 nameserver 的相关配置属性：

- kvConfigPath(kvConfig.json)。
- mqhome/namesrv/namesrv.properties。
- orderMessageEnable，是否开启顺序消息功能，默认为false。

### 2.1.2 ScheduledExecutorService

```java
private  final  ScheduledExecutorService  scheduledExecutorService  =  Executors.
newSingleThreadScheduledExecutor(new  ThreadFactoryImpl("NSScheduledThread"));
```

NameServer 定时任务执行线程池，默认定时执行两个任务：

- 任务1、每隔 10s 扫描 broker ,维护当前存活的Broker信息。
- 任务2、每隔 10s 打印KVConfig 信息。

### 2.1.3 KVConfigManager

读取或变更NameServer的配置属性，加载 NamesrvConfig 中配置的配置文件到内存，此类一个亮点就是使用轻量级的非线程安全容器，再结合读写锁对资源读写进行保护。尽最大程度提高线程的并发度。

### 2.1.4 RouteInfoManager

NameServer 数据的载体，记录 Broker、Topic 等信息。

```java
private final static long BROKER_CHANNEL_EXPIRED_TIME = 1000 * 60 * 2;                //@1
private final ReadWriteLock lock = new ReentrantReadWriteLock();                      //@2
private final HashMap<String/* topic */, List<QueueData>> topicQueueTable;            //@3
private final HashMap<String/* brokerName */, BrokerData> brokerAddrTable;             //@4
private final HashMap<String/* clusterName */, Set<String/* brokerName */>> clusterAddrTable;    //@5
private final HashMap<String/* brokerAddr */, BrokerLiveInfo> brokerLiveTable;                    //@6
private final HashMap<String/* brokerAddr */, List<String>/* Filter Server */> filterServerTable;  //@7
```

代码@1，NameServer 与 Broker 空闲时长，默认2分钟，在2分钟内 Nameserver 没有收到 Broker 的心跳包，则关闭该连接。

代码@2，读写锁，用来保护非线程安全容器 HashMap。

代码@3，topicQueueTable，主题与队列关系，记录一个主题的队列分布在哪些Broker上，每个Broker上存在该主题的队列个数。QueueData队列描述信息，对应如下属性：

```java
private  String  brokerName;                // broker的名称
private  int  readQueueNums;                // 读队列个数
private  int  writeQueueNums;               // 写队列个数
private  int  perm;                              // 权限操作
private  int  topicSynFlag;                  //   同步复制还是异步复制
```

代码@4，brokerAddrTable,所有 Broker 信息，使用 brokerName 当key, BrokerData 信息描述每一个 broker 信息。

```java
// broker所属集群
private  String  cluster;                                        
// broker name
private  String  brokerName;
 broker 对应的IP:Port,brokerId=0表示Master,大于0表示Slave。                   
private  HashMap<Long/*  brokerId  */,  String/*  broker  address  */>  brokerAddrs; 
```

代码@5，clusterAddrTable，broker 集群信息，每个集群包含哪些 Broker。

代码@6，brokerLiveTable，当前存活的 Broker,该信息不是实时的，NameServer 每10S扫描一次所有的 broker,根据心跳包的时间得知 broker的状态，该机制也是导致当一个 Broker 进程假死后，消息生产者无法立即感知，可能继续向其发送消息，导致失败（非高可用），如何保证消息发送高可用，请关关注该系列后续文章。

### 2.1.5 BrokerHousekeepingService

BrokerHouseKeepingService 实现 ChannelEventListener接口，可以说是通道在发送异常时的回调方法（Nameserver与 Broker的连接通道在关闭、通道发送异常、通道空闲时），在上述数据结构中移除已宕机的 Broker。

```java
public interface ChannelEventListener {
    void onChannelConnect(final String remoteAddr, final Channel channel);
    void onChannelClose(final String remoteAddr, final Channel channel);
    void onChannelException(final String remoteAddr, final Channel channel);
    void onChannelIdle(final String remoteAddr, final Channel channel);
}
```

### 2.1.6 NettyServerConfig、RemotingServer 、ExecutorService

这三个属性与网络通信有关，NameServer 与 Broker、Producer、Consume 之间的网络通信，基于 Netty实现。本文借这个机会再次探究 Netty 线程模型与 Netty实战技巧。

源码解析网络通讯之前，我们关注如下问题：

- NettyServerConfig 的配置含义
- Netty 线程模型中 EventLoopGroup、EventExecutorGroup 之间的区别与作用
- 在 Channel 的整个生命周期中，如何保证 Channel 的读写事件至始至终使用同一个线程处理

首先我们先过一下NettyServerConfig中的配置属性：

```java
private int listenPort = 8888;
private int serverWorkerThreads = 8;
private int serverCallbackExecutorThreads = 0;
private int serverSelectorThreads = 3;
private int serverOnewaySemaphoreValue = 256;
private int serverAsyncSemaphoreValue = 64;
private int serverChannelMaxIdleTimeSeconds = 120;
private int serverSocketSndBufSize = NettySystemConfig.socketSndbufSize;
private int serverSocketRcvBufSize = NettySystemConfig.socketRcvbufSize;
private boolean serverPooledByteBufAllocatorEnable = true;
```

我们带着上面的疑问开始源码解析 org.apache.rocketmq.remoting.netty.NettyRemotingServer。

**1、 serverWorkerThreads**

含义：业务线程池的线程个数，RocketMQ 按任务类型，每个任务类型会拥有一个专门的线程池，比如发送消息，消费消息，另外再加一个其他线程池（默认的业务线程池）。默认业务线程池，采用 fixed 类型，其线程名称：RemotingExecutorThread_。

作用范围：该参数目前主要用于 NameServer 的默认业务线程池，处理诸如 broker、producer,consume 与 NameServer 的所有交互命令。

源码来源：org.apache.rocketmq.namesrv.NamesrvController

```java
public boolean initialize() {
    this.kvConfigManager.load();
    this.remotingServer = new NettyRemotingServer(this.nettyServerConfig, this.brokerHousekeepingService);
    this.remotingExecutor =
        Executors.newFixedThreadPool(nettyServerConfig.getServerWorkerThreads(), new ThreadFactoryImpl("RemotingExecutorThread_"));   // @1
    this.registerProcessor();                 // @2
    this.scheduledExecutorService.scheduleAtFixedRate(new Runnable() {
        @Override
        public void run() {
            NamesrvController.this.routeInfoManager.scanNotActiveBroker();
        }
    }, 5, 10, TimeUnit.SECONDS);
    this.scheduledExecutorService.scheduleAtFixedRate(new Runnable() {
        @Override
        public void run() {
            NamesrvController.this.kvConfigManager.printAllPeriodically();
        }
    }, 1, 10, TimeUnit.MINUTES);
    return true;
}
private void registerProcessor() {
    if (namesrvConfig.isClusterTest()) {
        this.remotingServer.registerDefaultProcessor(new ClusterTestRequestProcessor(this, namesrvConfig.getProductEnvName()),
            this.remotingExecutor);
    } else {
        this.remotingServer.registerDefaultProcessor(new DefaultRequestProcessor(this), this.remotingExecutor);
    }
}
```

代码@1,创建一个线程容量为 serverWorkerThreads 的固定长度的线程池，该线程池供 DefaultRequestProcessor 类使用，实现具体的默认的请求命令处理。

代码@2，就是将 DefaultRequestProcessor 与代码@1创建的线程池绑定在一起。

具体的命令调用类：org.apache.rocketmq.remoting.netty.NettyRemotingAbstract。

```java
/**
 * Process incoming request command issued by remote peer.
 * @param ctx channel handler context.
 * @param cmd request command.
 */
public void processRequestCommand(final ChannelHandlerContext ctx, final RemotingCommand cmd) {
    final Pair<NettyRequestProcessor, ExecutorService> matched = this.processorTable.get(cmd.getCode());
    final Pair<NettyRequestProcessor, ExecutorService> pair = null == matched ? this.defaultRequestProcessor : matched;
    final int opaque = cmd.getOpaque();
    if (pair != null) {
        Runnable run = new Runnable() {
            @Override
            public void run() {
                try {
                    RPCHook rpcHook = NettyRemotingAbstract.this.getRPCHook();
                    if (rpcHook != null) {
                        rpcHook.doBeforeRequest(RemotingHelper.parseChannelRemoteAddr(ctx.channel()), cmd);
                    }
                    final RemotingCommand response = pair.getObject1().processRequest(ctx, cmd);
                    if (rpcHook != null) {
                        rpcHook.doAfterResponse(RemotingHelper.parseChannelRemoteAddr(ctx.channel()), cmd, response);
                    }
                    if (!cmd.isOnewayRPC()) {
                        if (response != null) {
                            response.setOpaque(opaque);
                            response.markResponseType();
                            try {
                                ctx.writeAndFlush(response);
                            } catch (Throwable e) {
                                PLOG.error("process request over, but response failed", e);
                                PLOG.error(cmd.toString());
                                PLOG.error(response.toString());
                            }
                        } else {
                        }
                    }
                } catch (Throwable e) {
                    PLOG.error("process request exception", e);
                    PLOG.error(cmd.toString());
                    if (!cmd.isOnewayRPC()) {
                        final RemotingCommand response = RemotingCommand.createResponseCommand(RemotingSysResponseCode.SYSTEM_ERROR, //
                            RemotingHelper.exceptionSimpleDesc(e));
                        response.setOpaque(opaque);
                        ctx.writeAndFlush(response);
                    }
                }
            }
        };
        if (pair.getObject1().rejectRequest()) {
            final RemotingCommand response = RemotingCommand.createResponseCommand(RemotingSysResponseCode.SYSTEM_BUSY,
                "[REJECTREQUEST]system busy, start flow control for a while");
            response.setOpaque(opaque);
            ctx.writeAndFlush(response);
            return;
        }
        try {
            final RequestTask requestTask = new RequestTask(run, ctx.channel(), cmd);
            pair.getObject2().submit(requestTask);
        } catch (RejectedExecutionException e) {
            if ((System.currentTimeMillis() % 10000) == 0) {
                PLOG.warn(RemotingHelper.parseChannelRemoteAddr(ctx.channel()) //
                    + ", too many requests and system thread pool busy, RejectedExecutionException " //
                    + pair.getObject2().toString() //
                    + " request code: " + cmd.getCode());
            }
            if (!cmd.isOnewayRPC()) {
                final RemotingCommand response = RemotingCommand.createResponseCommand(RemotingSysResponseCode.SYSTEM_BUSY,
                    "[OVERLOAD]system busy, start flow control for a while");
                response.setOpaque(opaque);
                ctx.writeAndFlush(response);
            }
        }
    } else {
        String error = " request type " + cmd.getCode() + " not supported";
        final RemotingCommand response =
            RemotingCommand.createResponseCommand(RemotingSysResponseCode.REQUEST_CODE_NOT_SUPPORTED, error);
        response.setOpaque(opaque);
        ctx.writeAndFlush(response);
        PLOG.error(RemotingHelper.parseChannelRemoteAddr(ctx.channel()) + error);
    }
}
```

该方法比较简单，该方法其实就是一个具体命令的处理模板（模板方法），具体的命令实现由各个子类实现，该类的主要责任就是将命令封装成一个线程对象，然后丢到线程池去执行。

**2、serverCallbackExecutorThreads**

含义：Netty public 任务线程池格式。线程名称：NettyServerPublicExecutor_。

源码来源：org.apache.rocketmq.remoting.netty.NettyRemotingServer。

**3、serverSelectorThreads**

含义：Netty IO 线程个数，Selector 所在的线程个数，也就主从 Reactor 模型中的从 Reactor 线程数量 。

线程名称：NettyServerNIOSelector_。

作用范围：broker,product,consume 服务端的IO线程数量。

源码来源：org.apache.rocketmq.remoting.netty.NettyRemotingServer。

**4、serverOnewaySemaphoreValue、 serverAsyncSemaphoreValue**

含义：服务端 oneWay(单向执行)、异步调用的信号量（并发度）。

源码来源：org.apache.rocketmq.remoting.netty.NettyRemotingServer。

org.apache.rocketmq.remoting.netty.NettyRemotingAbstract：

备注：单向（Oneway）发送特点为只负责发送消息，不等待服务器回应且没有回调函数触发，即只发送请求不等待应答。

应用场景：适用于某些耗时非常短，但对可靠性要求并不高的场景，例如日志收集。

**5、 其他配置参数**

```java
// 通道空闲时间，默认120S, 通过Netty的IdleStateHandler实现
private  int  serverChannelMaxIdleTimeSeconds  =  120;      
// socket发送缓存区大小
private  int  serverSocketSndBufSize  =  NettySystemConfig.socketSndbufSize;   
// socket接收缓存区大小
private  int  serverSocketRcvBufSize  =  NettySystemConfig.socketRcvbufSize;   
// 是否使用PooledByteBuf(可重用，缓存ByteBuf)
private  boolean  serverPooledByteBufAllocatorEnable  =  true;                                     
```

本文关主要分析了 Nameserver 作为 RocketMQ 的注册中心，主要存储了哪些信息，如何存储以及其核心参数。
