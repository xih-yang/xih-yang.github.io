# 04、RocketMQ 源码解析 - NameServer
- 来源：https://ddkk.com/zhuanlan/mq/rocketmq/3/4.html
- 分类：消息队列
- 分组：教程目录
## 版本声明

**1、** 基于`rocketmq-all-4.3.1`版本；

**2、** 如有发现分析不正确的地方欢迎指正，谢谢！；

## NameServer介绍

**1、**`NameServer`本身的高可用是通过部署多台`NameServer`服务`NameServer`互相独立，彼此之间不会通信(即多台`NameServer`的数据并不是强一致的)，任意一台宕机并不会影响其他的`NameServer`；

**2、** 作用；

- 维护活跃的Broker地址列表，包括Master和Slave
- 维护所有`Topic`和`Topic`对应队列的地址列表
- 维护所有`Broker`的`Filter`列表

**3、**`Broker`与`NameServer`关系；

- 单个`Broker`与所有`NameServer`保持长连接
- `Broker`每隔30秒向所有`NameServer`发送心跳，心跳包含了自身的`topic`信息
- `NameServer`每隔10秒钟扫描所有存活的Broker连接，若2min内没有发送心跳信息，则断开连接
- `Broker`在启动后向所有NameServer注册，`Producer`在发送消息之前先从`NameServer`获取`Broker`服务器的地址列表,然后根据负载均衡算法从列表中选择一台`Broker`进行消息发送

**4、** 稳定性；

- nameserver互相独立，无状态
- nameserver不会有频繁的读写，稳定性相对高

## NameServer源码分析

### KVConfigManager

**1、** 内存级的KV存储，提供增删改查以及持久化数据的能力本质就是一个HashMap；

```java
   
public class KVConfigManager {
    private final NamesrvController namesrvController;
    private final ReadWriteLock lock = new ReentrantReadWriteLock();
    // 
    private final HashMap<String/* Namespace */, HashMap<String/* Key */, String/* Value */>> configTable =
        new HashMap<String, HashMap<String, String>>();
    public KVConfigManager(NamesrvController namesrvController) {
        this.namesrvController = namesrvController;
    }
    public void load() {
        String content = null;
        try {
            content = MixAll.file2String(this.namesrvController.getNamesrvConfig().getKvConfigPath());
        } catch (IOException e) {
            log.warn("Load KV config table exception", e);
        }
        if (content != null) {
            KVConfigSerializeWrapper kvConfigSerializeWrapper =
                KVConfigSerializeWrapper.fromJson(content, KVConfigSerializeWrapper.class);
            if (null != kvConfigSerializeWrapper) {
                this.configTable.putAll(kvConfigSerializeWrapper.getConfigTable());
                log.info("load KV config table OK");
            }
        }
    }  
}  
```

### RouteInfoManager

**1、** 路由信息即Broker向NameServer注册后保存的信息，`RouteInfoManager`保存所有的`Topic`和`Broker`信息；

```java
public class RouteInfoManager {
    private static final InternalLogger log = InternalLoggerFactory.getLogger(LoggerName.NAMESRV_LOGGER_NAME);
    private final static long BROKER_CHANNEL_EXPIRED_TIME = 1000 * 60 * 2;
    private final ReadWriteLock lock = new ReentrantReadWriteLock();
    //topic列表对应的队列信息
    private final HashMap<String/* topic */, List<QueueData>> topicQueueTable;
    //Broker地址信息
    private final HashMap<String/* brokerName */, BrokerData> brokerAddrTable;
    //broker集群信息
    private final HashMap<String/* clusterName */, Set<String/* brokerName */>> clusterAddrTable;
    //Broker当前存活的Broker(非实时)
    private final HashMap<String/* brokerAddr */, BrokerLiveInfo> brokerLiveTable;
    //Broker过滤信息
    private final HashMap<String/* brokerAddr */, List<String>/* Filter Server */> filterServerTable;
    public RouteInfoManager() {
        this.topicQueueTable = new HashMap<String, List<QueueData>>(1024);
        this.brokerAddrTable = new HashMap<String, BrokerData>(128);
        this.clusterAddrTable = new HashMap<String, Set<String>>(32);
        this.brokerLiveTable = new HashMap<String, BrokerLiveInfo>(256);
        this.filterServerTable = new HashMap<String, List<String>>(256);
    }
...省略... 
} 
```

**2、** 成员变量解析；

- topicQueueTable：Topic消息队列路由信息，包括topic所在的broker名称，读队列数量，写队列数量，同步标记等信息，rocketmq根据topicQueueTable的信息进行负载均衡消息发送。
- brokerAddrTable：Broker节点信息，包括brokerName，所在集群名称，还有主备节点信息。
- clusterAddrTable：Broker集群信息，存储了集群中所有的BrokerName。
- brokerLiveTable：Broker状态信息，Nameserver每次收到Broker的心跳包就会更新该信息。
**3、** 通过远程调试查看具体内容(双主双从，两个nameserver)；

ip地址列表

- rocketmq-slave2 172.19.0.7
- rocketmq-slave1 172.19.0.6
- rocketmq-master2 172.19.0.5
- rocketmq-master1 172.19.0.4
- rocketmq-nameserver2 172.19.0.3
- rocketmq-nameserver1 172.19.0.2

`topicQueueTable`内容如下

```java
topicQueueTable信息
{
   "RMQ_SYS_TRANS_HALF_TOPIC": [
       {
           "brokerName": "rocketmq-master1",
           "perm": 6,
           "readQueueNums": 1,
           "topicSynFlag": 0,
           "writeQueueNums": 1
       },
       {
           "brokerName": "rocketmq-master2",
           "perm": 6,
           "readQueueNums": 1,
           "topicSynFlag": 0,
           "writeQueueNums": 1
       }
   ],
   "rocketmq-master1": [
       {
           "brokerName": "rocketmq-master1",
           "perm": 7,
           "readQueueNums": 1,
           "topicSynFlag": 0,
           "writeQueueNums": 1
       }
   ],
   "rocketmq-master2": [
       {
           "brokerName": "rocketmq-master2",
           "perm": 7,
           "readQueueNums": 1,
           "topicSynFlag": 0,
           "writeQueueNums": 1
       }
   ],
   "SELF_TEST_TOPIC": [
       {
           "brokerName": "rocketmq-master1",
           "perm": 6,
           "readQueueNums": 1,
           "topicSynFlag": 0,
           "writeQueueNums": 1
       },
       {
           "brokerName": "rocketmq-master2",
           "perm": 6,
           "readQueueNums": 1,
           "topicSynFlag": 0,
           "writeQueueNums": 1
       }
   ],
   "TBW102": [
       {
           "brokerName": "rocketmq-master1",
           "perm": 7,
           "readQueueNums": 4,
           "topicSynFlag": 0,
           "writeQueueNums": 4
       },
       {
           "brokerName": "rocketmq-master2",
           "perm": 7,
           "readQueueNums": 4,
           "topicSynFlag": 0,
           "writeQueueNums": 4
       }
   ],
   "testTopic": [
       {
           "brokerName": "rocketmq-master1",
           "perm": 6,
           "readQueueNums": 16,
           "topicSynFlag": 0,
           "writeQueueNums": 16
       },
       {
           "brokerName": "rocketmq-master2",
           "perm": 6,
           "readQueueNums": 16,
           "topicSynFlag": 0,
           "writeQueueNums": 16
       }
   ],
   "BenchmarkTest": [
       {
           "brokerName": "rocketmq-master1",
           "perm": 6,
           "readQueueNums": 1024,
           "topicSynFlag": 0,
           "writeQueueNums": 1024
       },
       {
           "brokerName": "rocketmq-master2",
           "perm": 6,
           "readQueueNums": 1024,
           "topicSynFlag": 0,
           "writeQueueNums": 1024
       }
   ],
   "DefaultCluster": [
       {
           "brokerName": "rocketmq-master1",
           "perm": 7,
           "readQueueNums": 16,
           "topicSynFlag": 0,
           "writeQueueNums": 16
       },
       {
           "brokerName": "rocketmq-master2",
           "perm": 7,
           "readQueueNums": 16,
           "topicSynFlag": 0,
           "writeQueueNums": 16
       }
   ],
   "OFFSET_MOVED_EVENT": [
       {
           "brokerName": "rocketmq-master1",
           "perm": 6,
           "readQueueNums": 1,
           "topicSynFlag": 0,
           "writeQueueNums": 1
       },
       {
           "brokerName": "rocketmq-master2",
           "perm": 6,
           "readQueueNums": 1,
           "topicSynFlag": 0,
           "writeQueueNums": 1
       }
   ]
}
```

`BrokerAddrTable`内容如下

```java
brokerAddrTable信息
{
    "rocketmq-master1": {
        "brokerAddrs": {
            0: "172.19.0.4:10911",
            1: "172.19.0.6:10921"
        },
        "brokerName": "rocketmq-master1",
        "cluster": "DefaultCluster"
    },
    "rocketmq-master2": {
        "brokerAddrs": {
            0: "172.19.0.5:10912",
            1: "172.19.0.7:10922"
        },
        "brokerName": "rocketmq-master2",
        "cluster": "DefaultCluster"
    }
}
```

`clusterAddrTable`内容如下

```java
clusterAddrTable 信息
{
    "DefaultCluster": [
        "rocketmq-master1",
        "rocketmq-master2"
    ]
}
```

- `brokerLiveTable`内容如下
-

```java
brokerLiveTable信息
{
    "172.19.0.7:10922": {
        "channel": {
            "active": true,
            "inputShutdown": false,
            "open": true,
            "outputShutdown": false,
            "registered": true,
            "writable": true
        },
        "dataVersion": {
            "counter": 3,
            "timestamp": 1562476312530
        },
        "haServerAddr": "172.19.0.7:10923",
        "lastUpdateTimestamp": 1562476361146
    },
    "172.19.0.5:10912": {
        "channel": {
            "active": true,
            "inputShutdown": false,
            "open": true,
            "outputShutdown": false,
            "registered": true,
            "writable": true
        },
        "dataVersion": {
            "counter": 3,
            "timestamp": 1562476312530
        },
        "haServerAddr": "172.19.0.5:10913",
        "lastUpdateTimestamp": 1562476360402
    },
    "172.19.0.4:10911": {
        "channel": {
            "active": true,
            "inputShutdown": false,
            "open": true,
            "outputShutdown": false,
            "registered": true,
            "writable": true
        },
        "dataVersion": {
            "counter": 3,
            "timestamp": 1562476312525
        },
        "haServerAddr": "172.19.0.4:10912",
        "lastUpdateTimestamp": 1562476359516
    },
    "172.19.0.6:10921": {
        "channel": {
            "active": true,
            "inputShutdown": false,
            "open": true,
            "outputShutdown": false,
            "registered": true,
            "writable": true
        },
        "dataVersion": {
            "counter": 3,
            "timestamp": 1562476312525
        },
        "haServerAddr": "172.19.0.6:10922",
        "lastUpdateTimestamp": 1562476360541
    }
}
```

### BrokerHouseKeepingService

**1、**`BrokerHouseKeepingService`:实现了`ChannelEventListener`接口，用于处理`Broker`状态事件，当`Broker`失效、异常或者关闭，则将`Broker`从`RouteInfoManager`中移除；

```java
public class BrokerHousekeepingService implements ChannelEventListener {
    private static final InternalLogger log = InternalLoggerFactory.getLogger(LoggerName.NAMESRV_LOGGER_NAME);
    private final NamesrvController namesrvController;
    public BrokerHousekeepingService(NamesrvController namesrvController) {
        this.namesrvController = namesrvController;
    }
    @Override
    public void onChannelConnect(String remoteAddr, Channel channel) {
    }
    @Override
    public void onChannelClose(String remoteAddr, Channel channel) {
        //通道关闭从RouteInfoManager中移除Broker
        this.namesrvController.getRouteInfoManager().onChannelDestroy(remoteAddr, channel);
    }
    @Override
    public void onChannelException(String remoteAddr, Channel channel) {
        //通道发生异常从RouteInfoManager中移除Broker
        this.namesrvController.getRouteInfoManager().onChannelDestroy(remoteAddr, channel);
    }
    @Override
    public void onChannelIdle(String remoteAddr, Channel channel) {
        //通道失效从RouteInfoManager中移除Broker
        this.namesrvController.getRouteInfoManager().onChannelDestroy(remoteAddr, channel);
    }
}
```

### DefaultRequestProcessor

**1、**`DefaultRequestProcessor`默认请求处理器,根据`RequestCode`执行相应的处理,核心处理方法`processRequest()`；

```java
  
@Override
public RemotingCommand processRequest(ChannelHandlerContext ctx,
    RemotingCommand request) throws RemotingCommandException {
if (ctx != null) {
        log.debug("receive request, {} {} {}",
            request.getCode(),
            RemotingHelper.parseChannelRemoteAddr(ctx.channel()),
            request);
    }
    switch (request.getCode()) {
        //向NameServer追加KV配置
        case RequestCode.PUT_KV_CONFIG:
            return this.putKVConfig(ctx, request);
        //从NameServer获取KV配置
        case RequestCode.GET_KV_CONFIG:
            return this.getKVConfig(ctx, request);
        //从NameServer获取KV配置
        case RequestCode.DELETE_KV_CONFIG:
            return this.deleteKVConfig(ctx, request);
        //获取版本信息
        case RequestCode.QUERY_DATA_VERSION:
            return queryBrokerTopicConfig(ctx, request);
        //注册一个Broker，数据都是持久化的，如果存在则覆盖配置
        case RequestCode.REGISTER_BROKER:
            Version brokerVersion = MQVersion.value2Version(request.getVersion());
            if (brokerVersion.ordinal() >= MQVersion.Version.V3_0_11.ordinal()) {
                return this.registerBrokerWithFilterServer(ctx, request);
            } else {
                return this.registerBroker(ctx, request);
            }
        //卸载一个Broker，数据都是持久化的
        case RequestCode.UNREGISTER_BROKER:
            return this.unregisterBroker(ctx, request);
        //根据Topic获取Broker Name、topic配置信息
        case RequestCode.GET_ROUTEINTO_BY_TOPIC:
            return this.getRouteInfoByTopic(ctx, request);
        //获取注册到Name Server的所有Broker集群信息
        case RequestCode.GET_BROKER_CLUSTER_INFO:
            return this.getBrokerClusterInfo(ctx, request);
        //去掉BrokerName的写权限
        case RequestCode.WIPE_WRITE_PERM_OF_BROKER:
            return this.wipeWritePermOfBroker(ctx, request);
        //从Name Server获取完整Topic列表
        case RequestCode.GET_ALL_TOPIC_LIST_FROM_NAMESERVER:
            return getAllTopicListFromNameserver(ctx, request);
        //从Namesrv删除Topic配置
        case RequestCode.DELETE_TOPIC_IN_NAMESRV:
            return deleteTopicInNamesrv(ctx, request);
        //通过Namespace获取所有的KV List
        case RequestCode.GET_KVLIST_BY_NAMESPACE:
            return this.getKVListByNamespace(ctx, request);
        //获取指定集群下的所有 topic
        case RequestCode.GET_TOPICS_BY_CLUSTER:
            return this.getTopicsByCluster(ctx, request);
        //获取所有系统内置 Topic 列表
        case RequestCode.GET_SYSTEM_TOPIC_LIST_FROM_NS:
            return this.getSystemTopicListFromNs(ctx, request);
        //单元化相关 topic
        case RequestCode.GET_UNIT_TOPIC_LIST:
            return this.getUnitTopicList(ctx, request);
        //获取含有单元化订阅组的 Topic 列表
        case RequestCode.GET_HAS_UNIT_SUB_TOPIC_LIST:
            return this.getHasUnitSubTopicList(ctx, request);
        //获取含有单元化订阅组的非单元化
        case RequestCode.GET_HAS_UNIT_SUB_UNUNIT_TOPIC_LIST:
            return this.getHasUnitSubUnUnitTopicList(ctx, request);
        //更新Name Server配置
        case RequestCode.UPDATE_NAMESRV_CONFIG:
            return this.updateConfig(ctx, request);
        case RequestCode.GET_NAMESRV_CONFIG:
            return this.getConfig(ctx, request);
        default:
            break;
    }
    return null;
}
```

### NamesrvStartup

**1、**`NamesrvStartup`是`NameServer`的启动入口,启动的核心是调用`NamesrvController`的`initialize()`方法；

```java
public boolean initialize() {
    //从文件中加载数据到内存中，默认从${user.home}/namesrv/kvConfig.json文件加载
    this.kvConfigManager.load();
    //创建服务Server，传入处理连接的ChannelEventListener
    this.remotingServer = new NettyRemotingServer(this.nettyServerConfig, this.brokerHousekeepingService);
    //默认任务处理器的线程池，每一个RequestCode可以单独设置一个线程池，如果不设置就使用默认的线程池
    this.remotingExecutor =
        Executors.newFixedThreadPool(nettyServerConfig.getServerWorkerThreads(), new ThreadFactoryImpl("RemotingExecutorThread_"));
    //注册默认处理器，根据requestCode执行相应的处理
    this.registerProcessor();
    //启动后延迟5秒开始执行，每隔10秒执行一次，对于两分钟没有活跃的broker，关闭连接
    this.scheduledExecutorService.scheduleAtFixedRate(new Runnable() {
@Override
        public void run() {
            NamesrvController.this.routeInfoManager.scanNotActiveBroker();
        }
    }, 5, 10, TimeUnit.SECONDS);
    //启动后延迟1min，每隔10分钟执行打印configTable
    this.scheduledExecutorService.scheduleAtFixedRate(new Runnable() {
        @Override
        public void run() {
            NamesrvController.this.kvConfigManager.printAllPeriodically();
        }
    }, 1, 10, TimeUnit.MINUTES);
    if (TlsSystemConfig.tlsMode != TlsMode.DISABLED) {
        // Register a listener to reload SslContext
        try {
            fileWatchService = new FileWatchService(
                new String[] {
                    TlsSystemConfig.tlsServerCertPath,
                    TlsSystemConfig.tlsServerKeyPath,
                    TlsSystemConfig.tlsServerTrustCertPath
                },
                new FileWatchService.Listener() {
                    boolean certChanged, keyChanged = false;
                    @Override
                    public void onChanged(String path) {
                        if (path.equals(TlsSystemConfig.tlsServerTrustCertPath)) {
                            log.info("The trust certificate changed, reload the ssl context");
                            reloadServerSslContext();
                        }
                        if (path.equals(TlsSystemConfig.tlsServerCertPath)) {
                            certChanged = true;
                        }
                        if (path.equals(TlsSystemConfig.tlsServerKeyPath)) {
                            keyChanged = true;
                        }
                        if (certChanged && keyChanged) {
                            log.info("The certificate and private key changed, reload the ssl context");
                            certChanged = keyChanged = false;
                            reloadServerSslContext();
                        }
                    }
                    private void reloadServerSslContext() {
                        ((NettyRemotingServer) remotingServer).loadSslContext();
                    }
                });
        } catch (Exception e) {
            log.warn("FileWatchService created error, can't load the certificate dynamically");
        }
    }
    return true;
}
```
