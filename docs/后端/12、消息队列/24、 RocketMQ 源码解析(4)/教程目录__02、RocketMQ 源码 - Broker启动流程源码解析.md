# 02、RocketMQ 源码 - Broker启动流程源码解析
- 来源：https://ddkk.com/zhuanlan/mq/rocketmq/4/2.html
- 分类：消息队列
- 分组：教程目录
### 1.Brocker介绍

Broker主要负责消息的存储、投递和查询以及服务高可用保证, Broker包含了以下几个重要子模块。

**1、** RemotingModule:整个Broker的实体,负责处理来自Client端的请求；

**2、** ClientManager:负责管理客户端Producer和Consumer,维护Consumer的Topic订阅信息；

**3、** StoreService:提供方便简单的API接口处理消息存储到物理硬盘和查询功能；

**4、** HAService:高可用服务,提供MasterBroker和SlaveBroker的数据同步功能；

**5、** IndexService:根据特定的Messagekey对投递到Broker的消息进行索引服务,从而提供快速的消息查询；

### 2.BrokerStartup启动入口

该方法将会创建并且初始化一个BrokerController实例

### 3.createBrokerController创建BrokerController

createBrokerController创建BrokerController: 解析命令行, 加载Broker配置, NettyServer配置, NettyClient配置, 并保持, 然后进行一些配置的校验, 日志的配置, 然后创建一个BrokerController实例。

BrokerController相当于Broker的一个中央控制器类, 创建了BrokerController实例后, 执行initialize方法进行初始化操作。

```java
public static BrokerController createBrokerController(String[] args) {
    //设置RocketMQ的版本信息，设置属性rocketmq.remoting.version，即当前rocketmq版本
    System.setProperty(RemotingCommand.REMOTING_VERSION_KEY, Integer.toString(MQVersion.CURRENT_VERSION));
    try {
        //PackageConflictDetect.detectFastjson();
        /*
         * 1 jar包启动时，构建命令行操作的指令，使用main方法启动可以忽略
         */
        Options options = ServerUtil.buildCommandlineOptions(new Options());
        //mqbroker命令文件
        commandLine = ServerUtil.parseCmdLine("mqbroker", args, buildCommandlineOptions(options),
                new PosixParser());
        if (null == commandLine) {
            System.exit(-1);
        }
        /*
         * 2 创建broker的配置类
         */
        //创建Broker的配置类，包含Broker的各种配置，比如ROCKETMQ_HOME
        final BrokerConfig brokerConfig = new BrokerConfig();
        //NettyServer的配置类，Broker作为服务端，比如接收来自客户端的消息的时候
        final NettyServerConfig nettyServerConfig = new NettyServerConfig();
        //NettyClient的配置类，Broker还会作为客户端，比如连接NameServer的时候
        final NettyClientConfig nettyClientConfig = new NettyClientConfig();
        // tls安全相关配置
        nettyClientConfig.setUseTLS(Boolean.parseBoolean(System.getProperty(TLS_ENABLE,
                String.valueOf(TlsSystemConfig.tlsMode == TlsMode.ENFORCING))));
        //设置作为NettyServer时的监听端口为10911
        nettyServerConfig.setListenPort(10911);
        //Broker的消息存储配置，例如各种文件大小等
        final MessageStoreConfig messageStoreConfig = new MessageStoreConfig();
        //如果broker的角色是slave，设置命中消息在内存的最大比例
        //默认broker角色是异步master
        if (BrokerRole.SLAVE == messageStoreConfig.getBrokerRole()) {
            //30
            int ratio = messageStoreConfig.getAccessMessageInMemoryMaxRatio() - 10;
            messageStoreConfig.setAccessMessageInMemoryMaxRatio(ratio);
        }
        /*
         * 3 解析外部配置文件
         * 判断命令行中是否包含字符'c'，即是否包含通过命令行指定配置文件的命令
         * 例如，启动Broker的时候添加的 -c /Volumes/Samsung/Idea/rocketmq/config/conf/broker.conf命令
         */
        if (commandLine.hasOption('c')) {
            //获取该命令指定的配置文件
            String file = commandLine.getOptionValue('c');
            if (file != null) {
                //加载外部配置文件
                configFile = file;
                InputStream in = new BufferedInputStream(new FileInputStream(file));
                properties = new Properties();
                properties.load(in);
                //将rmqAddressServerDomain、rmqAddressServerSubGroup属性设置为系统属性
                properties2SystemEnv(properties);
                //设置broker的配置信息
                MixAll.properties2Object(properties, brokerConfig);
                //设置nettyServer的配置信息
                MixAll.properties2Object(properties, nettyServerConfig);
                //设置nettyClient的配置信息
                MixAll.properties2Object(properties, nettyClientConfig);
                //设置messageStore的配置信息
                MixAll.properties2Object(properties, messageStoreConfig);
                //设置配置文件路径
                BrokerPathConfigHelper.setBrokerConfigPath(file);
                in.close();
            }
        }
        //设置broker的配置信息
        MixAll.properties2Object(ServerUtil.commandLine2Properties(commandLine), brokerConfig);
        //如果不存在ROCKETMQ_HOME的配置，那么打印异常并退出程序
        if (null == brokerConfig.getRocketmqHome()) {
            System.out.printf("Please set the %s variable in your environment to match the location of the RocketMQ installation", MixAll.ROCKETMQ_HOME_ENV);
            System.exit(-2);
        }
        /*
         * 4 获取namesrvAddr，即NameServer的地址，并进行校验
         */
        String namesrvAddr = brokerConfig.getNamesrvAddr();
        if (null != namesrvAddr) {
            try {
                //拆分NameServer的地址
                //可以指定多个NameServer的地址，以";"分隔
                String[] addrArray = namesrvAddr.split(";");
                //将字符串的地址，转换为网络连接的SocketAddress，检测格式是否正确
                for (String addr : addrArray) {
                    RemotingUtil.string2SocketAddress(addr);
                }
            } catch (Exception e) {
                System.out.printf(
                        "The Name Server Address[%s] illegal, please set it as follows, \"127.0.0.1:9876;192.168.0.1:9876\"%n",
                        namesrvAddr);
                System.exit(-3);
            }
        }
        /*
         * 4 设置、校验brokerId
         *
         * 根据broker的角色配置brokerId，默认角色是ASYNC_MASTER
         * 通过此配置可知BrokerId为0表示Master，非0表示Slave
         */
        switch (messageStoreConfig.getBrokerRole()) {
            case ASYNC_MASTER:
            case SYNC_MASTER:
                //如果是master角色，那么设置brokerId为0
                brokerConfig.setBrokerId(MixAll.MASTER_ID);
                break;
            case SLAVE:
                //如果是slave角色，需要brokerId大于0
                if (brokerConfig.getBrokerId() <= 0) {
                    System.out.printf("Slave's brokerId must be > 0");
                    System.exit(-3);
                }
                break;
            default:
                break;
        }
        // 开启 DLeger 的操作
        if (messageStoreConfig.isEnableDLegerCommitLog()) {
            brokerConfig.setBrokerId(-1);
        }
        /*
         * 5 设置高可用通信监听端口，为监听端口+1，默认就是10912
         * 该端口主要用于比如主从同步之类的高可用操作
         *
         * 在配置broker集群的时候需要注意，配置集群时可能会抛出：Address already in use
         * 因为一个broker机器会占用三个端口，监听ip端口，以及监听ip端口+1的端口，监听ip端口-2端口
         */
        messageStoreConfig.setHaListenPort(nettyServerConfig.getListenPort() + 1);
        /*
         * 6 日志相关配置
         */
        LoggerContext lc = (LoggerContext) LoggerFactory.getILoggerFactory();
        //Joran 是 logback 使用的一个配置加载库，可以直接调用JoranConfigurator类重新实现logback的配置机制，
        JoranConfigurator configurator = new JoranConfigurator();
        configurator.setContext(lc);
        lc.reset();
        //配置broker日志文件的路徑
        System.setProperty("brokerLogDir", "");
        //isolateLogEnable属性表示在同一台机器上部署多个broker时是否区分日志路径，默認false
        if (brokerConfig.isIsolateLogEnable()) {
            System.setProperty("brokerLogDir", brokerConfig.getBrokerName() + "_" + brokerConfig.getBrokerId());
        }
        if (brokerConfig.isIsolateLogEnable() && messageStoreConfig.isEnableDLegerCommitLog()) {
            System.setProperty("brokerLogDir", brokerConfig.getBrokerName() + "_" + messageStoreConfig.getdLegerSelfId());
        }
        configurator.doConfigure(brokerConfig.getRocketmqHome() + "/conf/logback_broker.xml");
        /*判断命令行中是否包含字符'p'（printConfigItem）和'm'，如果存在则打印配置信息并结束jvm运行，没有的话就不用管*/
        if (commandLine.hasOption('p')) {
            InternalLogger console = InternalLoggerFactory.getLogger(LoggerName.BROKER_CONSOLE_NAME);
            MixAll.printObjectProperties(console, brokerConfig);
            MixAll.printObjectProperties(console, nettyServerConfig);
            MixAll.printObjectProperties(console, nettyClientConfig);
            MixAll.printObjectProperties(console, messageStoreConfig);
            System.exit(0);
        } else if (commandLine.hasOption('m')) {
            InternalLogger console = InternalLoggerFactory.getLogger(LoggerName.BROKER_CONSOLE_NAME);
            MixAll.printObjectProperties(console, brokerConfig, true);
            MixAll.printObjectProperties(console, nettyServerConfig, true);
            MixAll.printObjectProperties(console, nettyClientConfig, true);
            MixAll.printObjectProperties(console, messageStoreConfig, true);
            System.exit(0);
        }
        //打印当前broker的配置日志
        log = InternalLoggerFactory.getLogger(LoggerName.BROKER_LOGGER_NAME);
        MixAll.printObjectProperties(log, brokerConfig);
        MixAll.printObjectProperties(log, nettyServerConfig);
        MixAll.printObjectProperties(log, nettyClientConfig);
        MixAll.printObjectProperties(log, messageStoreConfig);
        /*
         * 7 实例化BrokerController，设置各种属性
         */
        final BrokerController controller = new BrokerController(
                brokerConfig,
                nettyServerConfig,
                nettyClientConfig,
                messageStoreConfig);
        // 将所有的-c的外部配置信息保存到NamesrvController中的Configuration对象属性的allConfigs属性中
        controller.getConfiguration().registerConfig(properties);
        /*
         * 8 初始化BrokerController
         * 创建netty远程服务，初始化Netty线程池，注册请求处理器，配置定时任务，用于扫描并移除不活跃的Broker等操作。
         */
        boolean initResult = controller.initialize();
        //初始化失败则退出
        if (!initResult) {
            controller.shutdown();
            System.exit(-3);
        }
        /*
         * 9 添加关闭钩子方法，在Broker关闭之前执行，进行一些内存清理、对象销毁等操作
         */
        Runtime.getRuntime().addShutdownHook(new Thread(new Runnable() {
            private volatile boolean hasShutdown = false;
            private AtomicInteger shutdownTimes = new AtomicInteger(0);
            @Override
            public void run() {
                synchronized (this) {
                    log.info("Shutdown hook was invoked, {}", this.shutdownTimes.incrementAndGet());
                    if (!this.hasShutdown) {
                        this.hasShutdown = true;
                        long beginTime = System.currentTimeMillis();
                        //执行controller的shutdown方法，并且还会在messageStore#shutdown方法中将abort临时文件删除。
                        controller.shutdown();
                        long consumingTimeTotal = System.currentTimeMillis() - beginTime;
                        log.info("Shutdown hook over, consuming total time(ms): {}", consumingTimeTotal);
                    }
                }
            }
        }, "ShutdownHook"));
        //返回BrokerController
        return controller;
    } catch (Throwable e) {
        e.printStackTrace();
        System.exit(-1);
    }
    return null;
}
```

#### 3.1 创建各种配置类

**1、** BrokerConfig:Broker的配置类,ROCKETMQ_HOME,namesrvAddr,brokerName,brokerId等属性；

**2、** NettyServerConfig:NettyServer的配置类,包含Broker作为服务端时的各种属性,比如客户端进行交互的时候,NettyServer的端口号为10911,客户端和Broker通信时使用的是10911端口；

**3、** NettyClientConfig:NettyClient的配置类,包含Broker作为客户端时的各种属性,Broker和NameServer交互的时候作为客户端；

**4、** MessageStoreConfig:Broker消息存储的配置类,包含消息存储的相关配置,比如文件的目录、大小等；

设置了配置信息之后, 会进行一系列校验:

**1、** ROCKETMQ_HOME校验:如果启动参数中没有指定ROCKETMQ_HOME属性,那么打印异常并退出,ROCKETMQ_HOME就是指定RocketMQ的配置文件路径；

**2、** namesrvAddr校验:Broker会通过将各个Nameserver的字符串地址转换为InetSocketAddress来校验各个地址的合法性；

**3、** brokerId校验:如果broker是同步master或者异步master,设置brokerId为0,如果是slave,且brokerId不大于0,则打印异常,退出程序；

#### 3.2 创建broker控制器

BrokerController的构造器实际上同样是在进行一系列的赋值和初始化操作, 创建各种manager和queue组件, 组件角色之间的互动是通过BrokerController完成的, 不是组件直接完成的。

```java
public BrokerController(
    final BrokerConfig brokerConfig,
    final NettyServerConfig nettyServerConfig,
    final NettyClientConfig nettyClientConfig,
    final MessageStoreConfig messageStoreConfig
) {
    //broker的配置
    this.brokerConfig = brokerConfig;
    //作为netty服务端与客户端交互的配置
    this.nettyServerConfig = nettyServerConfig;
    //作为netty客户端与服务端交互的配置
    this.nettyClientConfig = nettyClientConfig;
    //消息存储的配置
    this.messageStoreConfig = messageStoreConfig;
    //消费者偏移量管理器，维护offset进度信息
    this.consumerOffsetManager = messageStoreConfig.isEnableLmq() ? new LmqConsumerOffsetManager(this) : new ConsumerOffsetManager(this);
    //topic配置管理器，管理broker中存储的所有topic的配置
    this.topicConfigManager = messageStoreConfig.isEnableLmq() ? new LmqTopicConfigManager(this) : new TopicConfigManager(this);
    //拉取消息处理器，用于处理拉取消息的请求
    this.pullMessageProcessor = new PullMessageProcessor(this);
    //拉取请求挂起服务，处理无消息时push长轮询消费者的挂起等待机制
    this.pullRequestHoldService = messageStoreConfig.isEnableLmq() ? new LmqPullRequestHoldService(this) : new PullRequestHoldService(this);
    //消息送达的监听器，生产者消息到达时通过该监听器触发pullRequestHoldService通知pullRequestHoldService
    this.messageArrivingListener = new NotifyMessageArrivingListener(this.pullRequestHoldService);
    //消费者id变化监听器
    this.consumerIdsChangeListener = new DefaultConsumerIdsChangeListener(this);
    //消费者管理类，维护消费者组的注册实例信息以及topic的订阅信息，并对消费者id变化进行监听
    this.consumerManager = new ConsumerManager(this.consumerIdsChangeListener);
    //消费者过滤管理器，配置文件为：xx/config/consumerFilter.json
    this.consumerFilterManager = new ConsumerFilterManager(this);
    //生产者管理器，包含生产者的注册信息，通过groupName分组
    this.producerManager = new ProducerManager();
    //客户端连接心跳服务，用于定时扫描生产者和消费者客户端，并将不活跃的客户端通道及相关信息移除
    this.clientHousekeepingService = new ClientHousekeepingService(this);
    //处理某些broker到客户端的请求，例如检查生产者的事务状态，重置offset
    this.broker2Client = new Broker2Client(this);
    //订阅分组关系管理器，维护消费者组的一些附加运维信息
    this.subscriptionGroupManager = messageStoreConfig.isEnableLmq() ? new LmqSubscriptionGroupManager(this) : new SubscriptionGroupManager(this);
    //broker对方访问的API，处理broker对外的发起请求，比如向nameServer注册，向master、slave发起的请求
    this.brokerOuterAPI = new BrokerOuterAPI(nettyClientConfig);
    //过滤服务管理器，拉取消息过滤
    this.filterServerManager = new FilterServerManager(this);
    //用于从节点，定时向主节点发起请求同步数据，例如topic配置、消费位移等
    this.slaveSynchronize = new SlaveSynchronize(this);
    /*初始化各种阻塞队列。将会被设置到对应的处理不同客户端请求的线程池执行器中*/
    //处理来自生产者的发送消息的请求的队列
    this.sendThreadPoolQueue = new LinkedBlockingQueue<Runnable>(this.brokerConfig.getSendThreadPoolQueueCapacity());
    //https://github.com/apache/rocketmq/pull/3631
    this.putThreadPoolQueue = new LinkedBlockingQueue<Runnable>(this.brokerConfig.getPutThreadPoolQueueCapacity());
    //处理来自消费者的拉取消息的请求的队列
    this.pullThreadPoolQueue = new LinkedBlockingQueue<Runnable>(this.brokerConfig.getPullThreadPoolQueueCapacity());
    //处理reply消息的请求的队列，RocketMQ4.7.0版本中增加了request-reply新特性，该特性允许producer在发送消息后同步或者异步等待consumer消费完消息并返回响应消息，类似rpc调用效果。
    //即生产者发送了消息之后，可以同步或者异步的收到消费了这条消息的消费者的响应
    this.replyThreadPoolQueue = new LinkedBlockingQueue<Runnable>(this.brokerConfig.getReplyThreadPoolQueueCapacity());
    //处理查询请求的队列
    this.queryThreadPoolQueue = new LinkedBlockingQueue<Runnable>(this.brokerConfig.getQueryThreadPoolQueueCapacity());
    //客户端管理器的队列
    this.clientManagerThreadPoolQueue = new LinkedBlockingQueue<Runnable>(this.brokerConfig.getClientManagerThreadPoolQueueCapacity());
    //消费者管理器的队列，目前没用到
    this.consumerManagerThreadPoolQueue = new LinkedBlockingQueue<Runnable>(this.brokerConfig.getConsumerManagerThreadPoolQueueCapacity());
    //心跳处理的队列
    this.heartbeatThreadPoolQueue = new LinkedBlockingQueue<Runnable>(this.brokerConfig.getHeartbeatThreadPoolQueueCapacity());
    //事务消息相关处理的队列
    this.endTransactionThreadPoolQueue = new LinkedBlockingQueue<Runnable>(this.brokerConfig.getEndTransactionPoolQueueCapacity());
    //broker状态管理器，保存Broker运行时状态
    this.brokerStatsManager = messageStoreConfig.isEnableLmq() ? new LmqBrokerStatsManager(this.brokerConfig.getBrokerClusterName(), this.brokerConfig.isEnableDetailStat()) : new BrokerStatsManager(this.brokerConfig.getBrokerClusterName(), this.brokerConfig.isEnableDetailStat());
    //目前没用到
    this.setStoreHost(new InetSocketAddress(this.getBrokerConfig().getBrokerIP1(), this.getNettyServerConfig().getListenPort()));
    //broker快速失败服务
    this.brokerFastFailure = new BrokerFastFailure(this);
    //配置类
    this.configuration = new Configuration(
        log,
        BrokerPathConfigHelper.getBrokerConfigPath(),
        this.brokerConfig, this.nettyServerConfig, this.nettyClientConfig, this.messageStoreConfig
    );
}
```

#### 3.3 初始化broker控制器

创建broker控制器以后, 需要进行broker的初始化

**1、** 加载config路径下的json配置文件,包括topic主题配置、offset消费偏移量、subscriptionGroup订阅分组、consumerFilter消费者过滤等配置文件；

**2、** 加载实例化消息存储相关类DefaultMessageStore,通过该类的load方法加载消息存储的相关文件,，比如commitLog日志文件、consumequeue消息消费队列文件,indexFile索引文件,messageStore还会将这些文件的内容加载到内存中,完成RocketMq的数据恢复；

大致过程:

**1、** 加载配置文件:topic配置文件,offset消费偏移量、subscriptionGroup订阅分组、consumerFilter消费者过滤等配置文件；

**2、** 实例化和初始化消息存储服务相关类DefaultMessageStore；

**3、** 该类的load方法加载消息存储的相关文件,，比如commitLog日志文件、consumequeue消息消费队列文件,indexFile索引文件,messageStore还会将这些文件的内容加载到内存中,完成RocketMq的数据恢复；

**4、** 创建netty远程服务,包括remotingServer和fastRemotingServer；

**5、** 调用registerProcessor方法注册netty消息处理器到netty远程服务中；

**6、** 创建一系列定时任务,用于检查broker状态,统计接收,拉取消息数量,持久化消息文件,修改na’meServer地址；

**7、** 调用initialTransaction初始化事务消息相关服务；

**8、** 调用initialAcl初始化权限相关服务；

**9、** 调用initialRpcHooks初始化所有RpcHook钩子；

```java
public boolean initialize() throws CloneNotSupportedException {
   /*
    * 1 加载配置文件
    * 尝试从json配置文件或者bak备份文件中加载json字符串，然后反序列化转换为自身内部的属性
    */
   //topic配置文件加载，路径为  {user.home}/store/config/topics.json
   boolean result = this.topicConfigManager.load();
   //消费者消费偏移量配置文件加载，路径为  {user.home}/store/config/consumerOffset.json
   result = result && this.consumerOffsetManager.load();
   //订阅分组配置文件加载，路径为  {user.home}/store/config/subscriptionGroup.json
   result = result && this.subscriptionGroupManager.load();
   //消费者过滤配置文件加载，路径为  {user.home}/store/config/consumerFilter.json
   result = result && this.consumerFilterManager.load();
   /*
    * 如果上一步加载配置全部成功
    * 2 实例化和初始化消息存储服务相关类DefaultMessageStore
    */
   if (result) {
       try {
           //实例化消息存储类DefaultMessageStore
           this.messageStore =
                   new DefaultMessageStore(this.messageStoreConfig, this.brokerStatsManager, this.messageArrivingListener,
                           this.brokerConfig);
           //如果启动了enableDLegerCommitLog，就创建DLeger组件DLedgerRoleChangeHandler。默认为false，如果需要开启则该值需要设置为true。
           //在启用enableDLegerCommitLog情况下，broker通过raft协议选主，可以实现主从角色自动切换，这是4.5版本之后的新功能
           //简单的说，如果启动enableDLegerCommitLog，就表示启用 RocketMQ 的容灾机制——自动主从切换，
           if (messageStoreConfig.isEnableDLegerCommitLog()) {
               DLedgerRoleChangeHandler roleChangeHandler = new DLedgerRoleChangeHandler(this, (DefaultMessageStore) messageStore);
               ((DLedgerCommitLog) ((DefaultMessageStore) messageStore).getCommitLog()).getdLedgerServer().getdLedgerLeaderElector().addRoleChangeHandler(roleChangeHandler);
           }
           //broker的统计服务类，保存了broker的一些统计数据
           //例如msgPutTotalTodayNow --现在存储的消息数量，msgPutTotalTodayMorning --今天存储的消息数量
           this.brokerStats = new BrokerStats((DefaultMessageStore) this.messageStore);
           //load plugin
           //加载存在的消息存储插件，不必深究
           MessageStorePluginContext context = new MessageStorePluginContext(messageStoreConfig, brokerStatsManager, messageArrivingListener, brokerConfig);
           this.messageStore = MessageStoreFactory.build(context, this.messageStore);
           //添加一个针对布隆过滤器的消费过滤类
           this.messageStore.getDispatcherList().addFirst(new CommitLogDispatcherCalcBitMap(this.brokerConfig, this.consumerFilterManager));
       } catch (IOException e) {
           result = false;
           log.error("Failed to initialize", e);
       }
   }
   /*
    * 如果上一步加载配置全部成功
    * 3 通过消息存储服务加载消息存储的相关文件，比如commitLog日志文件、consumequeue消息消费队列文件的加载，indexFile索引文件的构建
    * messageStore还会将这些文件的内容加载到内存中，并且完成RocketMQ的数据恢复
    * 这是核broker启动的心步骤之一
    */
   result = result && this.messageStore.load();
   /*
    * 如果上一步加载配置全部成功
    * 3 开始初始化Broker通信层和各种请求执行器
    */
   if (result) {
       /*
        * 4 创建netty远程服务，remotingServer和fastRemotingServer
        */
       //创建broker的netty远程服务，端口为10911，可以用于处理客户端的所有请求。
       this.remotingServer = new NettyRemotingServer(this.nettyServerConfig, this.clientHousekeepingService);
       //创建一个broker的netty快速远程服务的配置
       NettyServerConfig fastConfig = (NettyServerConfig) this.nettyServerConfig.clone();
       //设置快速netty远程服务的配置监听的端口号为普通服务的端口-2，默认10909
       fastConfig.setListenPort(nettyServerConfig.getListenPort() - 2);
       //创建broker的netty快速服务，这就是所谓的快速通道，对应可以处理客户端除了拉取消息之外的所有请求，所谓的VIP端口。
       this.fastRemotingServer = new NettyRemotingServer(fastConfig, this.clientHousekeepingService);
       /*
        * 5 创建各种执行器线程池
        */
       //处理发送消息的请求的线程池
       this.sendMessageExecutor = new BrokerFixedThreadPoolExecutor(
               this.brokerConfig.getSendMessageThreadPoolNums(),
               this.brokerConfig.getSendMessageThreadPoolNums(),
               1000 * 60,
               TimeUnit.MILLISECONDS,
               this.sendThreadPoolQueue,
               new ThreadFactoryImpl("SendMessageThread_"));
       ///https://github.com/apache/rocketmq/pull/3631
       this.putMessageFutureExecutor = new BrokerFixedThreadPoolExecutor(
               this.brokerConfig.getPutMessageFutureThreadPoolNums(),
               this.brokerConfig.getPutMessageFutureThreadPoolNums(),
               1000 * 60,
               TimeUnit.MILLISECONDS,
               this.putThreadPoolQueue,
               new ThreadFactoryImpl("PutMessageThread_"));
       //处理拉取消息的请求的线程池
       this.pullMessageExecutor = new BrokerFixedThreadPoolExecutor(
               this.brokerConfig.getPullMessageThreadPoolNums(),
               this.brokerConfig.getPullMessageThreadPoolNums(),
               1000 * 60,
               TimeUnit.MILLISECONDS,
               this.pullThreadPoolQueue,
               new ThreadFactoryImpl("PullMessageThread_"));
       //处理reply消息的请求的线程池
       this.replyMessageExecutor = new BrokerFixedThreadPoolExecutor(
               this.brokerConfig.getProcessReplyMessageThreadPoolNums(),
               this.brokerConfig.getProcessReplyMessageThreadPoolNums(),
               1000 * 60,
               TimeUnit.MILLISECONDS,
               this.replyThreadPoolQueue,
               new ThreadFactoryImpl("ProcessReplyMessageThread_"));
       //处理查询请求的线程池
       this.queryMessageExecutor = new BrokerFixedThreadPoolExecutor(
               this.brokerConfig.getQueryMessageThreadPoolNums(),
               this.brokerConfig.getQueryMessageThreadPoolNums(),
               1000 * 60,
               TimeUnit.MILLISECONDS,
               this.queryThreadPoolQueue,
               new ThreadFactoryImpl("QueryMessageThread_"));
       //broker 管理线程池，作为默认处理器的线程池
       this.adminBrokerExecutor =
               Executors.newFixedThreadPool(this.brokerConfig.getAdminBrokerThreadPoolNums(), new ThreadFactoryImpl(
                       "AdminBrokerThread_"));
       //客户端管理器的线程池
       this.clientManageExecutor = new ThreadPoolExecutor(
               this.brokerConfig.getClientManageThreadPoolNums(),
               this.brokerConfig.getClientManageThreadPoolNums(),
               1000 * 60,
               TimeUnit.MILLISECONDS,
               this.clientManagerThreadPoolQueue,
               new ThreadFactoryImpl("ClientManageThread_"));
       //心跳处理的线程池
       this.heartbeatExecutor = new BrokerFixedThreadPoolExecutor(
               this.brokerConfig.getHeartbeatThreadPoolNums(),
               this.brokerConfig.getHeartbeatThreadPoolNums(),
               1000 * 60,
               TimeUnit.MILLISECONDS,
               this.heartbeatThreadPoolQueue,
               new ThreadFactoryImpl("HeartbeatThread_", true));
       //事务消息相关处理的线程池
       this.endTransactionExecutor = new BrokerFixedThreadPoolExecutor(
               this.brokerConfig.getEndTransactionThreadPoolNums(),
               this.brokerConfig.getEndTransactionThreadPoolNums(),
               1000 * 60,
               TimeUnit.MILLISECONDS,
               this.endTransactionThreadPoolQueue,
               new ThreadFactoryImpl("EndTransactionThread_"));
       //消费者管理的线程池
       this.consumerManageExecutor =
               Executors.newFixedThreadPool(this.brokerConfig.getConsumerManageThreadPoolNums(), new ThreadFactoryImpl(
                       "ConsumerManageThread_"));
       /*
        * 6 注册处理器
        */
       this.registerProcessor();
       /*
        * 7 启动一系列定时周期任务
        */
       final long initialDelay = UtilAll.computeNextMorningTimeMillis() - System.currentTimeMillis();
       //每隔24h打印昨天生产和消费的消息数量
       final long period = 1000 * 60 * 60 * 24;
       this.scheduledExecutorService.scheduleAtFixedRate(new Runnable() {
           @Override
           public void run() {
               try {
                   BrokerController.this.getBrokerStats().record();
               } catch (Throwable e) {
                   log.error("schedule record error.", e);
               }
           }
       }, initialDelay, period, TimeUnit.MILLISECONDS);
       //每隔5s將消费者offset进行持久化，存入consumerOffset.json文件中
       this.scheduledExecutorService.scheduleAtFixedRate(new Runnable() {
           @Override
           public void run() {
               try {
                   BrokerController.this.consumerOffsetManager.persist();
               } catch (Throwable e) {
                   log.error("schedule persist consumerOffset error.", e);
               }
           }
       }, 1000 * 10, this.brokerConfig.getFlushConsumerOffsetInterval(), TimeUnit.MILLISECONDS);
       //每隔10s將消费过滤信息进行持久化，存入consumerFilter.json文件中
       this.scheduledExecutorService.scheduleAtFixedRate(new Runnable() {
           @Override
           public void run() {
               try {
                   BrokerController.this.consumerFilterManager.persist();
               } catch (Throwable e) {
                   log.error("schedule persist consumer filter error.", e);
               }
           }
       }, 1000 * 10, 1000 * 10, TimeUnit.MILLISECONDS);
       //每隔3m將检查消费者的消费进度
       //当消费进度落后阈值的时候，并且disableConsumeIfConsumerReadSlowly=true(默认false)，就停止消费者消费，保护broker，避免消费积压
       this.scheduledExecutorService.scheduleAtFixedRate(new Runnable() {
           @Override
           public void run() {
               try {
                   BrokerController.this.protectBroker();
               } catch (Throwable e) {
                   log.error("protectBroker error.", e);
               }
           }
       }, 3, 3, TimeUnit.MINUTES);
       //每隔1s將打印发送消息线程池队列、拉取消息线程池队列、查询消息线程池队列、结束事务线程池队列的大小以及队列头部元素存在时间
       this.scheduledExecutorService.scheduleAtFixedRate(new Runnable() {
           @Override
           public void run() {
               try {
                   BrokerController.this.printWaterMark();
               } catch (Throwable e) {
                   log.error("printWaterMark error.", e);
               }
           }
       }, 10, 1, TimeUnit.SECONDS);
       //每隔1m將打印已存储在commitlog提交日志中但尚未分派到consume queue消费队列的字节数。
       this.scheduledExecutorService.scheduleAtFixedRate(new Runnable() {
           @Override
           public void run() {
               try {
                   log.info("dispatch behind commit log {} bytes", BrokerController.this.getMessageStore().dispatchBehindBytes());
               } catch (Throwable e) {
                   log.error("schedule dispatchBehindBytes error.", e);
               }
           }
       }, 1000 * 10, 1000 * 60, TimeUnit.MILLISECONDS);
       //如果broker的nameServer地址不为null
       if (this.brokerConfig.getNamesrvAddr() != null) {
           //更新nameServer地址
           this.brokerOuterAPI.updateNameServerAddressList(this.brokerConfig.getNamesrvAddr());
           log.info("Set user specified name server address: {}", this.brokerConfig.getNamesrvAddr());
       } else if (this.brokerConfig.isFetchNamesrvAddrByAddressServer()) {
           //如果没有指定nameServer地址，并且允许从地址服务器获取nameServer地址
           //那么每隔2m从nameServer地址服务器拉取最新的nameServer地址并更新
           //要想动态更新nameServer地址，需要指定一个地址服务器的url，并且fetchNamesrvAddrByAddressServer设置为true
           this.scheduledExecutorService.scheduleAtFixedRate(new Runnable() {
               @Override
               public void run() {
                   try {
                       BrokerController.this.brokerOuterAPI.fetchNameServerAddr();
                   } catch (Throwable e) {
                       log.error("ScheduledTask fetchNameServerAddr exception", e);
                   }
               }
           }, 1000 * 10, 1000 * 60 * 2, TimeUnit.MILLISECONDS);
       }
       //如果没有开启DLeger服务，DLeger开启后表示支持高可用的主从自动切换
       if (!messageStoreConfig.isEnableDLegerCommitLog()) {
           //如果当前broker是slave从节点
           if (BrokerRole.SLAVE == this.messageStoreConfig.getBrokerRole()) {
               //根据是否配置了HA地址，来更新HA地址，并设置updateMasterHAServerAddrPeriodically
               if (this.messageStoreConfig.getHaMasterAddress() != null && this.messageStoreConfig.getHaMasterAddress().length() >= 6) {
                   this.messageStore.updateHaMasterAddress(this.messageStoreConfig.getHaMasterAddress());
                   this.updateMasterHAServerAddrPeriodically = false;
               } else {
                   this.updateMasterHAServerAddrPeriodically = true;
               }
           } else {
               //如果是主节点，每隔60s將打印主从节点的差异
               this.scheduledExecutorService.scheduleAtFixedRate(new Runnable() {
                   @Override
                   public void run() {
                       try {
                           BrokerController.this.printMasterAndSlaveDiff();
                       } catch (Throwable e) {
                           log.error("schedule printMasterAndSlaveDiff error.", e);
                       }
                   }
               }, 1000 * 10, 1000 * 60, TimeUnit.MILLISECONDS);
           }
       }
       //Tls传输相关配置，通信安全的文件监听模块，用来观察网络加密配置文件的更改
       //默认是PERMISSIVE，因此会进入代码块
       if (TlsSystemConfig.tlsMode != TlsMode.DISABLED) {
           // Register a listener to reload SslContext
           try {
               //实例化文件监听服务,并且初始化事务消息服务。
               fileWatchService = new FileWatchService(
                       new String[]{
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
                               ((NettyRemotingServer) fastRemotingServer).loadSslContext();
                           }
                       });
           } catch (Exception e) {
               log.warn("FileWatchService created error, can't load the certificate dynamically");
           }
       }
       /*
        * 8 初始化事务消息相关服务
        */
       initialTransaction();
       /*
        * 9 初始化权限相关服务
        */
       initialAcl();
       /*
        * 10 初始化RPC调用的钩子函数
        */
       initialRpcHooks();
   }
   return result;
}
```

##### 3.3.1 加载配置文件#

load方法加载配置文件。加载 config 路径下的json配置文件, 包括topic主题配置、offset消费偏移量、subscriptionGroup订阅分组、consumerFilter消费者过滤等配置文件。

##### 3.3.2 创建消息存储对象MessageStore#

DefaultMessageStore是RocketMQ的核心文件存储控制类, 是RocketMQ对于消息存储和获取功能的抽象。DefaultMessageStore类位于store模块, 可以直接控制管理commitLog, consumerQueue, indexFile文件的读和写。

启动Broker时候, 会创建一个DefaultMessageStore对象, load方法进行磁盘文件的加载和异常数据的修复。

```java
public DefaultMessageStore(final MessageStoreConfig messageStoreConfig, final BrokerStatsManager 
brokerStatsManager,final MessageArrivingListener messageArrivingListener, final BrokerConfig brokerConfig) throws IOException {
      //消息送达的监听器，生产者消息到达时通过该监听器触发pullRequestHoldService通知pullRequestHoldService
      this.messageArrivingListener = messageArrivingListener;
      //Broker的配置类，包含Broker的各种配置，比如ROCKETMQ_HOME
      this.brokerConfig = brokerConfig;
      //Broker的消息存储配置，例如各种文件大小等
      this.messageStoreConfig = messageStoreConfig;
      //broker状态管理器，保存Broker运行时状态，统计工作
      this.brokerStatsManager = brokerStatsManager;
      //创建 MappedFile文件的服务，用于初始化MappedFile和预热MappedFile
      this.allocateMappedFileService = new AllocateMappedFileService(this);
      //实例化CommitLog，DLedgerCommitLog表示主持主从自动切换功能，默认是CommitLog类型
      if (messageStoreConfig.isEnableDLegerCommitLog()) {
          this.commitLog = new DLedgerCommitLog(this);
      } else {
          this.commitLog = new CommitLog(this);
      }
      //topic的ConsumeQueueMap的对应关系
      this.consumeQueueTable = new ConcurrentHashMap<>(32);
      //ConsumeQueue文件的刷盘服务
      this.flushConsumeQueueService = new FlushConsumeQueueService();
      //清除过期CommitLog文件的服务
      this.cleanCommitLogService = new CleanCommitLogService();
      //清除过期ConsumeQueue文件的服务
      this.cleanConsumeQueueService = new CleanConsumeQueueService();
      //存储一些统计指标信息的服务
      this.storeStatsService = new StoreStatsService();
      //IndexFile索引文件服务
      this.indexService = new IndexService(this);
      //高可用服务，默认为null
      if (!messageStoreConfig.isEnableDLegerCommitLog()) {
          this.haService = new HAService(this);
      } else {
          this.haService = null;
      }
      //根据CommitLog文件，更新index文件索引和ConsumeQueue文件偏移量的服务
      this.reputMessageService = new ReputMessageService();
      //处理RocketMQ延迟消息的服务
      this.scheduleMessageService = new ScheduleMessageService(this);
      //初始化MappedFile的时候进行ByteBuffer的分配回收
      this.transientStorePool = new TransientStorePool(messageStoreConfig);
      //如果当前节点不是从节点，并且是异步刷盘策略，并且transientStorePoolEnable参数配置为true，则启动该服务
      if (messageStoreConfig.isTransientStorePoolEnable()) {
          this.transientStorePool.init();
      }
      //启动MappedFile文件服务线程
      this.allocateMappedFileService.start();
      //启动index索引文件服务线程
      this.indexService.start();
      //转发服务列表，监听CommitLog文件中的新消息存储，然后会调用列表中的CommitLogDispatcher#dispatch方法
      this.dispatcherList = new LinkedList<>();
      //通知ConsumeQueue的Dispatcher，可用于更新ConsumeQueue的偏移量等信息
      this.dispatcherList.addLast(new CommitLogDispatcherBuildConsumeQueue());
      //通知IndexFile的Dispatcher，可用于更新IndexFile的时间戳等信息
      this.dispatcherList.addLast(new CommitLogDispatcherBuildIndex());
      //获取锁文件，路径就是配置的{storePathRootDir}/lock
      File file = new File(StorePathConfigHelper.getLockFile(messageStoreConfig.getStorePathRootDir()));
      //确保创建file文件的父目录，即{storePathRootDir}目录
      MappedFile.ensureDirOK(file.getParent());
      //确保创建commitlog目录，即{StorePathCommitLog}目录
      MappedFile.ensureDirOK(getStorePathPhysic());
      //确保创建consumequeue目录，即{storePathRootDir}/consumequeue目录
      MappedFile.ensureDirOK(getStorePathLogic());
      //创建lockfile文件，名为lock，权限是"读写"，这是一个锁文件，用于获取文件锁。
//文件锁用来保证磁盘上的这些存储文件同时只能有一个Broker的messageStore来操作。
      lockFile = new RandomAccessFile(file, "rw");
  }
```

lockFile: 锁文件消息。

allocateMappedFileService: 创建和预热MappedFile文件的服务。

scheduleMessageService: 消息文件刷盘或清理服务, 延迟消息处理服务。

##### 3.3.3 Load加载恢复消息文件#

加载实例化消息存储相关类DefaultMessageStore, 通过该类的load方法加载消息存储的相关文件, ，比如commitLog日志文件、consumequeue消息消费队列文件, indexFile索引文件, messageStore还会将这些文件的内容加载到内存中, 完成RocketMq的数据恢复。

**1、** 调用isTempFileExist方法判断上次broker是否是正常退出,如果是正常退出的话不会保留abort文件,异常退出会保持；

**2、** 加载CommitLog日志文件CommitLog文件是真正存储消息内容的地方；

**3、** 加载ConsumeQueue文件ConsumeQueue文件可以看作是CommitLog的消息偏移量索引文件；

**4、** 加载index索引文件Index文件可以看作是CommitLog的消息时间范围索引文件；

**5、** 恢复ConsumeQueue文件和CommitLog文件,将正确的数据恢复到内存,删除错误数据和文件；

**6、** 加载RocketMQ延迟消息的服务,包含延迟等级和配置文件等；

```java
/**
 * DefaultMessageStore的方法
 * 加载Commit Log、Consume Queue、index file等文件，将数据加载到内存中，并完成数据的恢复
 *
 * @throws IOException
 */
public boolean load() {
    boolean result = true;
    try {
        /*
         * 1 判断上次broker是否是正常退出，如果是正常退出不会保留abort文件，异常退出则会
         *
         * Broker在启动时会创建{storePathRootDir}/abort文件，并且注册钩子函数：在JVM退出时删除abort文件。
         * 如果下一次启动时存在abort文件，说明Broker是异常退出的，文件数据可能不一直，需要进行数据修复。
         */
        boolean lastExitOK = !this.isTempFileExist();
        log.info("last shutdown {}", lastExitOK ? "normally" : "abnormally");
        /*
         * 2 加载Commit Log日志文件，目录路径取自broker.conf文件中的storePathCommitLog属性
         * Commit Log文件是真正存储消息内容的地方，单个文件默认大小1G。
         */
        // load Commit Log
        result = result && this.commitLog.load();
        /*
         * 2 加载Consume Queue文件，目录路径为{storePathRootDir}/consumequeue，文件组织方式为topic/queueId/fileName
         * Consume Queue文件可以看作是Commit Log的索引文件，其存储了它所属Topic的消息在Commit Log中的偏移量
         * 消费者拉取消息的时候，可以从Consume Queue中快速的根据偏移量定位消息在Commit Log中的位置。
         */
        // load Consume Queue
        result = result && this.loadConsumeQueue();
        if (result) {
            /*
             * 3 加载checkpoint 检查点文件，文件位置是{storePathRootDir}/checkpoint
             * StoreCheckpoint记录着commitLog、ConsumeQueue、Index文件的最后更新时间点，
             * 当上一次broker是异常结束时，会根据StoreCheckpoint的数据进行恢复，这决定着文件从哪里开始恢复，甚至是删除文件
             */
            this.storeCheckpoint =
                    new StoreCheckpoint(StorePathConfigHelper.getStoreCheckpoint(this.messageStoreConfig.getStorePathRootDir()));
            /*
             * 4 加载 index 索引文件，目录路径为{storePathRootDir}/index
             * index 索引文件用于通过时间区间来快速查询消息，底层为HashMap结构，实现为hash索引。后面会专门出文介绍
             * 如果不是正常退出，并且最大更新时间戳比checkpoint文件中的时间戳大，则删除该 index 文件
             */
            this.indexService.load(lastExitOK);
            /*
             * 4 恢复ConsumeQueue文件和CommitLog文件，将正确的的数据恢复至内存中，删除错误数据和文件。
             */
            this.recover(lastExitOK);
            log.info("load over, and the max phy offset = {}", this.getMaxPhyOffset());
            /*
             * 5 加载RocketMQ延迟消息的服务，包括延时等级、配置文件等等。
             */
            if (null != scheduleMessageService) {
                result = this.scheduleMessageService.load();
            }
        }
    } catch (Exception e) {
        log.error("load exception", e);
        result = false;
    }
    if (!result) {
        //如果上面的操作抛出异常，则文件服务停止
        this.allocateMappedFileService.shutdown();
    }
    return result;
}
```

##### 3.3.4 初始化Broker通信层#

配置文件和日志文件加载恢复完毕后, 初始化Broker通信层和各种请求执行器。

创建两个NettyRemotingServer, 一个是普通的远程服务remotingServer, 端口号为10911, 快速的远程服务fastRemotingServer, 端口号为10909。

```java
//创建broker的netty远程服务，端口为10911，可以用于处理客户端的所有请求。
this.remotingServer = new NettyRemotingServer(this.nettyServerConfig, this.clientHousekeepingService);
//创建一个broker的netty快速远程服务的配置
NettyServerConfig fastConfig = (NettyServerConfig) this.nettyServerConfig.clone();
//设置快速netty远程服务的配置监听的端口号为普通服务的端口-2，默认10909
fastConfig.setListenPort(nettyServerConfig.getListenPort() - 2);
//创建broker的netty快速服务，这就是所谓的快速通道，对应可以处理客户端除了拉取消息之外的所有请求，所谓的VIP端口。
this.fastRemotingServer = new NettyRemotingServer(fastConfig, this.clientHousekeepingService);
```

##### 3.3.5 创建各种执行器线程池#

因为RocketMQ为了性能, 将许多请求进行异步处理。

```java
/*
 * 5 创建各种执行器线程池
 */
//处理发送消息的请求的线程池
this.sendMessageExecutor = new BrokerFixedThreadPoolExecutor(
        this.brokerConfig.getSendMessageThreadPoolNums(),
        this.brokerConfig.getSendMessageThreadPoolNums(),
        1000 * 60,
        TimeUnit.MILLISECONDS,
        this.sendThreadPoolQueue,
        new ThreadFactoryImpl("SendMessageThread_"));
///https://github.com/apache/rocketmq/pull/3631
this.putMessageFutureExecutor = new BrokerFixedThreadPoolExecutor(
        this.brokerConfig.getPutMessageFutureThreadPoolNums(),
        this.brokerConfig.getPutMessageFutureThreadPoolNums(),
        1000 * 60,
        TimeUnit.MILLISECONDS,
        this.putThreadPoolQueue,
        new ThreadFactoryImpl("PutMessageThread_"));
//处理拉取消息的请求的线程池
this.pullMessageExecutor = new BrokerFixedThreadPoolExecutor(
        this.brokerConfig.getPullMessageThreadPoolNums(),
        this.brokerConfig.getPullMessageThreadPoolNums(),
        1000 * 60,
        TimeUnit.MILLISECONDS,
        this.pullThreadPoolQueue,
        new ThreadFactoryImpl("PullMessageThread_"));
//处理reply消息的请求的线程池
this.replyMessageExecutor = new BrokerFixedThreadPoolExecutor(
        this.brokerConfig.getProcessReplyMessageThreadPoolNums(),
        this.brokerConfig.getProcessReplyMessageThreadPoolNums(),
        1000 * 60,
        TimeUnit.MILLISECONDS,
        this.replyThreadPoolQueue,
        new ThreadFactoryImpl("ProcessReplyMessageThread_"));
//处理查询请求的线程池
this.queryMessageExecutor = new BrokerFixedThreadPoolExecutor(
        this.brokerConfig.getQueryMessageThreadPoolNums(),
        this.brokerConfig.getQueryMessageThreadPoolNums(),
        1000 * 60,
        TimeUnit.MILLISECONDS,
        this.queryThreadPoolQueue,
        new ThreadFactoryImpl("QueryMessageThread_"));
//broker 管理线程池，作为默认处理器的线程池
this.adminBrokerExecutor =
        Executors.newFixedThreadPool(this.brokerConfig.getAdminBrokerThreadPoolNums(), new ThreadFactoryImpl(
                "AdminBrokerThread_"));
//客户端管理器的线程池
this.clientManageExecutor = new ThreadPoolExecutor(
        this.brokerConfig.getClientManageThreadPoolNums(),
        this.brokerConfig.getClientManageThreadPoolNums(),
        1000 * 60,
        TimeUnit.MILLISECONDS,
        this.clientManagerThreadPoolQueue,
        new ThreadFactoryImpl("ClientManageThread_"));
//心跳处理的线程池
this.heartbeatExecutor = new BrokerFixedThreadPoolExecutor(
        this.brokerConfig.getHeartbeatThreadPoolNums(),
        this.brokerConfig.getHeartbeatThreadPoolNums(),
        1000 * 60,
        TimeUnit.MILLISECONDS,
        this.heartbeatThreadPoolQueue,
        new ThreadFactoryImpl("HeartbeatThread_", true));
//事务消息相关处理的线程池
this.endTransactionExecutor = new BrokerFixedThreadPoolExecutor(
        this.brokerConfig.getEndTransactionThreadPoolNums(),
        this.brokerConfig.getEndTransactionThreadPoolNums(),
        1000 * 60,
        TimeUnit.MILLISECONDS,
        this.endTransactionThreadPoolQueue,
        new ThreadFactoryImpl("EndTransactionThread_"));
//消费者管理的线程池
this.consumerManageExecutor =
        Executors.newFixedThreadPool(this.brokerConfig.getConsumerManageThreadPoolNums(), new ThreadFactoryImpl(
                "ConsumerManageThread_"));
```

##### 3.3.6 注册netty消息处理器#

registerProcessor方法中的所有的处理器都是通过remotingServer #registerProcessor方法进行注册的。

```java
/**
 * BrokerController的方法
 * 注册netty消息处理器
 */
public void registerProcessor() {
    /**
     * 发送消息处理器
     */
    SendMessageProcessor sendProcessor = new SendMessageProcessor(this);
    sendProcessor.registerSendMessageHook(sendMessageHookList);
    sendProcessor.registerConsumeMessageHook(consumeMessageHookList);
    //对于发送类型的请求，使用发送消息处理器sendProcessor来处理
    this.remotingServer.registerProcessor(RequestCode.SEND_MESSAGE, sendProcessor, this.sendMessageExecutor);
    this.remotingServer.registerProcessor(RequestCode.SEND_MESSAGE_V2, sendProcessor, this.sendMessageExecutor);
    this.remotingServer.registerProcessor(RequestCode.SEND_BATCH_MESSAGE, sendProcessor, this.sendMessageExecutor);
    this.remotingServer.registerProcessor(RequestCode.CONSUMER_SEND_MSG_BACK, sendProcessor, this.sendMessageExecutor);
    this.fastRemotingServer.registerProcessor(RequestCode.SEND_MESSAGE, sendProcessor, this.sendMessageExecutor);
    this.fastRemotingServer.registerProcessor(RequestCode.SEND_MESSAGE_V2, sendProcessor, this.sendMessageExecutor);
    this.fastRemotingServer.registerProcessor(RequestCode.SEND_BATCH_MESSAGE, sendProcessor, this.sendMessageExecutor);
    this.fastRemotingServer.registerProcessor(RequestCode.CONSUMER_SEND_MSG_BACK, sendProcessor, this.sendMessageExecutor);
}
```

##### 3.3.7 启动定时周期任务#

注册了netty消息处理器之后, 会启动一系列的定时任务, 这些任务由BrokerController中的scheduledExecutorService执行, 该线程池只有一个线程。

```java
private final ScheduledExecutorService scheduledExecutorService = 
Executors.newSingleThreadScheduledExecutor(new ThreadFactoryImpl(
        "BrokerControllerScheduledThread"));
```

**1、** 每隔24h打印昨天生产和消费的消息数量；

**2、** 每隔5s將消费者offset进行持久化,存入consumerOffset.json文件中；

**3、** 每隔10s將消费过滤信息进行持久化,存入consumerFilter.json文件中；

**4、** 每隔3m將检查消费者的消费进度,当消费进度落后阈值的时候,并且disableConsumeIfConsumerReadSlowly=true(默认false),那么停止消费组消费,包含broker,避免消息堆积；

**5、** 每隔1s將打印发送消息线程池队列、拉取消息线程池队列、查询消息线程池队列、结束事务线程池队列的大小以及队列头部元素存在时间；

**6、** 每隔1m將打印已存储在commitlog提交日志中但尚未分派到consumequeue消费队列的字节数；

**7、** 如果broker手动设置的nameServer地址为null,且允许从地址服务器获取nameServer地址,那么每隔2s从nameServer地址服务器拉取最新的nameServer并更新；

**8、** 如果没有开启DLeger服务,如果节点是主节点的话,那么每隔60s打印主从节点的差异；

```java
/*
 * 7 启动一系列定时周期任务
 */
final long initialDelay = UtilAll.computeNextMorningTimeMillis() - System.currentTimeMillis();
//每隔24h打印昨天生产和消费的消息数量
final long period = 1000 * 60 * 60 * 24;
this.scheduledExecutorService.scheduleAtFixedRate(new Runnable() {
    @Override
    public void run() {
        try {
            BrokerController.this.getBrokerStats().record();
        } catch (Throwable e) {
            log.error("schedule record error.", e);
        }
    }
}, initialDelay, period, TimeUnit.MILLISECONDS);
//每隔5s將消费者offset进行持久化，存入consumerOffset.json文件中
this.scheduledExecutorService.scheduleAtFixedRate(new Runnable() {
    @Override
    public void run() {
        try {
            BrokerController.this.consumerOffsetManager.persist();
        } catch (Throwable e) {
            log.error("schedule persist consumerOffset error.", e);
        }
    }
}, 1000 * 10, this.brokerConfig.getFlushConsumerOffsetInterval(), TimeUnit.MILLISECONDS);
//每隔10s將消费过滤信息进行持久化，存入consumerFilter.json文件中
this.scheduledExecutorService.scheduleAtFixedRate(new Runnable() {
    @Override
    public void run() {
        try {
            BrokerController.this.consumerFilterManager.persist();
        } catch (Throwable e) {
            log.error("schedule persist consumer filter error.", e);
        }
    }
}, 1000 * 10, 1000 * 10, TimeUnit.MILLISECONDS);
//每隔3m將检查消费者的消费进度
//当消费进度落后阈值的时候，并且disableConsumeIfConsumerReadSlowly=true(默认false)，就停止消费者消费，保护broker，避免消费积压
this.scheduledExecutorService.scheduleAtFixedRate(new Runnable() {
    @Override
    public void run() {
        try {
            BrokerController.this.protectBroker();
        } catch (Throwable e) {
            log.error("protectBroker error.", e);
        }
    }
}, 3, 3, TimeUnit.MINUTES);
//每隔1s將打印发送消息线程池队列、拉取消息线程池队列、查询消息线程池队列、结束事务线程池队列的大小以及队列头部元素存在时间
this.scheduledExecutorService.scheduleAtFixedRate(new Runnable() {
    @Override
    public void run() {
        try {
            BrokerController.this.printWaterMark();
        } catch (Throwable e) {
            log.error("printWaterMark error.", e);
        }
    }
}, 10, 1, TimeUnit.SECONDS);
//每隔1m將打印已存储在commitlog提交日志中但尚未分派到consume queue消费队列的字节数。
this.scheduledExecutorService.scheduleAtFixedRate(new Runnable() {
    @Override
    public void run() {
        try {
            log.info("dispatch behind commit log {} bytes", BrokerController.this.getMessageStore().dispatchBehindBytes());
        } catch (Throwable e) {
            log.error("schedule dispatchBehindBytes error.", e);
        }
    }
}, 1000 * 10, 1000 * 60, TimeUnit.MILLISECONDS);
//如果broker的nameServer地址不为null
if (this.brokerConfig.getNamesrvAddr() != null) {
    //更新nameServer地址
    this.brokerOuterAPI.updateNameServerAddressList(this.brokerConfig.getNamesrvAddr());
    log.info("Set user specified name server address: {}", this.brokerConfig.getNamesrvAddr());
} else if (this.brokerConfig.isFetchNamesrvAddrByAddressServer()) {
    //如果没有指定nameServer地址，并且允许从地址服务器获取nameServer地址
    //那么每隔2m从nameServer地址服务器拉取最新的nameServer地址并更新
    //要想动态更新nameServer地址，需要指定一个地址服务器的url，并且fetchNamesrvAddrByAddressServer设置为true
    this.scheduledExecutorService.scheduleAtFixedRate(new Runnable() {
        @Override
        public void run() {
            try {
                BrokerController.this.brokerOuterAPI.fetchNameServerAddr();
            } catch (Throwable e) {
                log.error("ScheduledTask fetchNameServerAddr exception", e);
            }
        }
    }, 1000 * 10, 1000 * 60 * 2, TimeUnit.MILLISECONDS);
}
//如果没有开启DLeger服务，DLeger开启后表示支持高可用的主从自动切换
if (!messageStoreConfig.isEnableDLegerCommitLog()) {
    //如果当前broker是slave从节点
    if (BrokerRole.SLAVE == this.messageStoreConfig.getBrokerRole()) {
        //根据是否配置了HA地址，来更新HA地址，并设置updateMasterHAServerAddrPeriodically
        if (this.messageStoreConfig.getHaMasterAddress() != null && this.messageStoreConfig.getHaMasterAddress().length() >= 6) {
            this.messageStore.updateHaMasterAddress(this.messageStoreConfig.getHaMasterAddress());
            this.updateMasterHAServerAddrPeriodically = false;
        } else {
            this.updateMasterHAServerAddrPeriodically = true;
        }
    } else {
        //如果是主节点，每隔60s將打印主从节点的差异
        this.scheduledExecutorService.scheduleAtFixedRate(new Runnable() {
            @Override
            public void run() {
                try {
                    BrokerController.this.printMasterAndSlaveDiff();
                } catch (Throwable e) {
                    log.error("schedule printMasterAndSlaveDiff error.", e);
                }
            }
        }, 1000 * 10, 1000 * 60, TimeUnit.MILLISECONDS);
    }
}
```

##### 3.3.8 初始化事务消息相关服务#

initialTransaction为初始化事务的方法, 事务消息的服务采用SPI的方式进行加载。

**1、** transactionalMessageService:事务消息服务,用于处理、检查事务消息；

**2、** transactionalMessageCheckListener:事务消息检查监听器监听回查消息；

**3、** transactionalMessageCheckService:事务消息检查服务,提供了事务消息回查的逻辑,默认情况下为6s如果没有commit/rollback的事务消息才会触发事务回查,而如果回查数超过15次则丢弃事务；

```java
/**
 * BrokerController的方法
 * 初始化事务消息相关服务
 */
private void initialTransaction() {
    //基于Java的SPI机制，查找"META-INF/service/org.apache.rocketmq.broker.transaction.TransactionalMessageService"文件里面的SPI实现
    //事务消息服务
    this.transactionalMessageService = ServiceProvider.loadClass(ServiceProvider.TRANSACTION_SERVICE_ID, TransactionalMessageService.class);
    if (null == this.transactionalMessageService) {
        //如果沒有通过SPI指定具体的实现，那么使用默认实现，TransactionalMessageServiceImpl
        this.transactionalMessageService = new TransactionalMessageServiceImpl(new TransactionalMessageBridge(this, this.getMessageStore()));
        log.warn("Load default transaction message hook service: {}", TransactionalMessageServiceImpl.class.getSimpleName());
    }
    //基于Java的SPI机制，查找"META-INF/service/org.apache.rocketmq.broker.transaction.AbstractTransactionalMessageCheckListener"文件里面的SPI实现
    //事务消息回查服务监听器
    this.transactionalMessageCheckListener = ServiceProvider.loadClass(ServiceProvider.TRANSACTION_LISTENER_ID, AbstractTransactionalMessageCheckListener.class);
    if (null == this.transactionalMessageCheckListener) {
        //如果沒有通过SPI指定具体的实现，那么使用默认实现，DefaultTransactionalMessageCheckListener
        this.transactionalMessageCheckListener = new DefaultTransactionalMessageCheckListener();
        log.warn("Load default discard message hook service: {}", DefaultTransactionalMessageCheckListener.class.getSimpleName());
    }
    this.transactionalMessageCheckListener.setBrokerController(this);
    //创建TransactionalMessageCheckService服务，该服务内部有一个线程
    //会定时每一分钟(可通过在broker.conf文件设置transactionCheckInterval属性更改)触发事务检查的逻辑，内部调用TransactionalMessageService#check方法
    //默认情况下，6秒以上没commit/rollback的事务消息才会触发事务回查，而如果回查次数超过15次则丢弃事务
    this.transactionalMessageCheckService = new TransactionalMessageCheckService(this);
}
```

##### 3.3.9 初始化ACL权限服务#

加载权限相关校验器, 注册进RpcHock, 在请求执行之前执行权限校验。

```java
/**
 * BrokerController的方法
 * 初始化ACL权限校验器
 */
private void initialAcl() {
    //校验是否开启了ACL，默认false，所以直接返回了
    if (!this.brokerConfig.isAclEnable()) {
        log.info("The broker dose not enable acl");
        return;
    }
    //如果开启了ACL，则首先通过SPI机制获取AccessValidator
    List<AccessValidator> accessValidators = ServiceProvider.load(ServiceProvider.ACL_VALIDATOR_ID, AccessValidator.class);
    if (accessValidators == null || accessValidators.isEmpty()) {
        log.info("The broker dose not load the AccessValidator");
        return;
    }
    //将校验器存入accessValidatorMap，并且注册到RpcHook中，在请求之前会执行校验。
    for (AccessValidator accessValidator : accessValidators) {
        final AccessValidator validator = accessValidator;
        accessValidatorMap.put(validator.getClass(), validator);
        this.registerServerRPCHook(new RPCHook() {
            @Override
            public void doBeforeRequest(String remoteAddr, RemotingCommand request) {
                //Do not catch the exception
                //在执行请求之前会进行校验
                validator.validate(validator.parse(request, remoteAddr));
            }
            @Override
            public void doAfterResponse(String remoteAddr, RemotingCommand request, RemotingCommand response) {
            }
        });
    }
}
```

##### 3.3.10 初始化RpCHook#

基于Java的SPI机制查找RpCHook, 并注册到netty远程服务中。RpcHook是RocketMQ提供的钩子类, 可以在请求被处理之前和响应被返回之前执行对应的方法。

```java
/**
 * BrokerController的方法
 * 初始化RpcHook服务
 */
private void initialRpcHooks() {
    //通过SPI机制获取RPCHook的实现
    List<RPCHook> rpcHooks = ServiceProvider.load(ServiceProvider.RPC_HOOK_ID, RPCHook.class);
    //如果没有配置RpcHook，那么直接返回
    if (rpcHooks == null || rpcHooks.isEmpty()) {
        return;
    }
    //遍历并且注册所有的RpcHook
    for (RPCHook rpcHook : rpcHooks) {
        this.registerServerRPCHook(rpcHook);
    }
}
// RpcHook是RocketMQ提供的钩子类
public interface RPCHook {
    /**
     * broker处理请求之前执行
     */
    void doBeforeRequest(final String remoteAddr, final RemotingCommand request);
    /**
     * broker响应返回之前执行
     */
    void doAfterResponse(final String remoteAddr, final RemotingCommand request,
        final RemotingCommand response);
}
```

#### 3.4 多端口监听

Broker启动时, 会监听3个端口: 10911、10911、10912

- remotingServer: 监听10911, 可以处理客户端的所有请求。
- fastRemotingServer: 监听10909, 可以处理客户端除了拉取消息之外的所有请求, vip端口。
- haListenPort: 监听10912, 于Broker的主从同步, 即高可用服务。

通过两个端口监听客户端请求, 达到隔离读写操作效果。消息的发送中, 重要的是提供RTT。如果普通端口堵塞, 会使得netty的IO线程阻塞, 比如消息堆积的时候, 消费消息的请求会填满IO线程池, 导致写操作被阻塞, 所以可以向vip端口发送消息。

现在发送消息和消费消息实际上默认都走10911端口。vip端口默认不开通, 需要配置属性, com.rocketmq.sendMessageWithVIPChannel属性。

### 4.Start启动BrokerController

创建和初始化Broker后, 启动Broker。

BrokerController#start

```java
/**
 * BrokerStartup的方法
 *
 * @param controller 被启动的BrokerController
 */
public static BrokerController start(BrokerController controller) {
    try {
        //启动broker
        controller.start();
        //broker启动之后的的信息打印到控制台
        String tip = "The broker[" + controller.getBrokerConfig().getBrokerName() + ", "
                + controller.getBrokerAddr() + "] boot success. serializeType=" + RemotingCommand.getSerializeTypeConfigInThisServer();
        if (null != controller.getBrokerConfig().getNamesrvAddr()) {
            tip += " and name server is " + controller.getBrokerConfig().getNamesrvAddr();
        }
        log.info(tip);
        System.out.printf("%s%n", tip);
        return controller;
    } catch (Throwable e) {
        e.printStackTrace();
        System.exit(-1);
    }
    return null;
}
```

**1、** 启动各种服务和组件:messageStore,remotingServer,fastRemotingServer；

**2、** 判断如果没有开启DLedger,如果当前broker不是SLAVE,那么启动transactionalMessageCheckService事务消息检查服务,如果是SLAVE,那么启动定时任务每隔10s与master机器同步数据,采用slave主动拉取的方法；

**3、** 最后还会开启另一个定时周期任务,默认情况下每隔30s向所有的nameServer进行一次注册broker信息,时间间隔可以配置registerNameServerPeriod属性,允许的值是在1万到6万毫秒之间这个任务是Broker向nameServer发送心跳包的定时任务,包含topic读、写队列个数、队列权限、是否有序等信息；

```java
/**
 * BrokerController的方法
 * 启动BrokerController
 */
public void start() throws Exception {
    //启动消息存储服务
    if (this.messageStore != null) {
        this.messageStore.start();
    }
    //启动netty远程服务
    if (this.remotingServer != null) {
        this.remotingServer.start();
    }
    //启动快速netty远程服务
    if (this.fastRemotingServer != null) {
        this.fastRemotingServer.start();
    }
    //文件监听器启动
    if (this.fileWatchService != null) {
        this.fileWatchService.start();
    }
    //broker对外api启动
    if (this.brokerOuterAPI != null) {
        this.brokerOuterAPI.start();
    }
    //长轮询拉取消息挂起服务启动
    if (this.pullRequestHoldService != null) {
        this.pullRequestHoldService.start();
    }
    //客户端连接心跳服务启动
    if (this.clientHousekeepingService != null) {
        this.clientHousekeepingService.start();
    }
    //过滤服务管理器启动
    if (this.filterServerManager != null) {
        this.filterServerManager.start();
    }
    //如果没有开启DLeger的相关设置，默认没有启动
    if (!messageStoreConfig.isEnableDLegerCommitLog()) {
        //如果不是SLAVE，那么启动transactionalMessageCheckService事务消息检查服务
        startProcessorByHa(messageStoreConfig.getBrokerRole());
        //如果是SLAVE，那么启动定时任务每隔10s与master机器同步数据，采用slave主动拉取的方法
        //同步的内容包括topic配置，消费者消费位移、延迟消息偏移量、订阅组信息等
        handleSlaveSynchronize(messageStoreConfig.getBrokerRole());
        /*
         * 强制注册当前broker信息到所有的nameserver
         */
        this.registerBrokerAll(true, false, true);
    }
    //启动定时任务，默认情况下每隔30s向nameServer进行一次注册，
    //时间间隔可以配置registerNameServerPeriod属性，允许的值是在1万到6万毫秒之间。
    this.scheduledExecutorService.scheduleAtFixedRate(new Runnable() {
        @Override
        public void run() {
            try {
                //定时发送心跳包并上报数据
                BrokerController.this.registerBrokerAll(true, false, brokerConfig.isForceRegister());
            } catch (Throwable e) {
                log.error("registerBrokerAll Exception", e);
            }
        }
    }, 1000 * 10, Math.max(10000, Math.min(brokerConfig.getRegisterNameServerPeriod(), 60000)), TimeUnit.MILLISECONDS);
    //broker相关统计服务启动
    if (this.brokerStatsManager != null) {
        this.brokerStatsManager.start();
    }
    //broker快速失败服务启动
    if (this.brokerFastFailure != null) {
        this.brokerFastFailure.start();
    }
}
```

### 5.Broker启动流程总结

实例化和初始化BrokerController, 启动BrokerController。

Broker模块启动时还会加载很多的文件, 比如topic.json, 消费者的信息, consumerOffset.json。

加载各种消息文件, commitLog, consumerQueue, indexFile, 加载后会恢复文件。
