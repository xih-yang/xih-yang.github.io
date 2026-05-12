# 01、RocketMQ 源码 - NameServer启动流程源码解析
- 来源：https://ddkk.com/zhuanlan/mq/rocketmq/4/1.html
- 分类：消息队列
- 分组：教程目录
## 1.NameServer概述

NameServer是一个非常简单的Topic路由注册中心, 其角色类似Dubbo中的zookeeper, 支持Broker的动态注入和发现。

**1、** Broker管理:NameServer接受Broker集群的注册信息并且保存下来作为路由信息的基本数据然后提供心跳检测机制,检查Broker是否存活；

**2、** 路由信息管理:每个NameServer将保存关于Broker集群的整个路由信息和用于客户端查询的队列信息然后Producer和Conumser通过NameServer就可以知道整个Broker集群的路由信息,从而进行消息的投递和消费；

无论是Producer、Conumser、Broker都会直接和NameServer进行通信。

RocketMQ在部署启动时, 先启动NameServer

## 2.NamesrvStartup启动入口

NamesrvStartup#main

```java
    public static NamesrvController main0(String[] args) {
        try {
        	// 创建NamesrvController
            NamesrvController controller = createNamesrvController(args);
            // 启动NamesrvController
            start(controller);
            String tip = "The Name Server boot success. serializeType=" + RemotingCommand.getSerializeTypeConfigInThisServer();
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

**1、** createNamesrvController创建NamesrvController；

**2、** start启动NamesrvController；

## 3.createNamesrvController创建NamesrvController

创建NamesrvController, 该方法主要是解析命令行, 加载NameServer配置和NettyServer各种配置, 并保存起来然后创建一个NamesrvController。NamesrvController相当于NameServer的一个中央控制器类。

```java
public static NamesrvController createNamesrvController(String[] args) throws IOException, JoranException {
    //设置RocketMQ的版本信息，属性名为rocketmq.remoting.version
    System.setProperty(RemotingCommand.REMOTING_VERSION_KEY, Integer.toString(MQVersion.CURRENT_VERSION));
    //PackageConflictDetect.detectFastjson();
    /*jar包启动时，构建命令行操作的指令，使用main方法启动可以忽略*/
    Options options = ServerUtil.buildCommandlineOptions(new Options());
    //mqnamesrv命令文件
    commandLine = ServerUtil.parseCmdLine("mqnamesrv", args, buildCommandlineOptions(options), new PosixParser());
    if (null == commandLine) {
        System.exit(-1);
        return null;
    }
    //创建NameServer的配置类，包含NameServer的配置，比如ROCKETMQ_HOME
    final NamesrvConfig namesrvConfig = new NamesrvConfig();
    //和NettyServer的配置类
    final NettyServerConfig nettyServerConfig = new NettyServerConfig();
    //netty服务的监听端口设置为9876
    nettyServerConfig.setListenPort(9876);
    //判断命令行中是否包含字符'c'，即是否包含通过命令行指定配置文件的命令
    //例如，启动Broker的时候添加的 -c /Volumes/Samsung/Idea/rocketmq/config/conf/broker.conf命令
    if (commandLine.hasOption('c')) {
        /*解析配置文件并且存入NamesrvConfig和NettyServerConfig中，没有的话就不用管*/
        String file = commandLine.getOptionValue('c');
        if (file != null) {
            InputStream in = new BufferedInputStream(new FileInputStream(file));
            properties = new Properties();
            properties.load(in);
            MixAll.properties2Object(properties, namesrvConfig);
            MixAll.properties2Object(properties, nettyServerConfig);
            namesrvConfig.setConfigStorePath(file);
            System.out.printf("load config properties file OK, %s%n", file);
            in.close();
        }
    }
    /*判断命令行中是否包含字符'p'，如果存在则打印配置信息并结束jvm运行，没有的话就不用管*/
    if (commandLine.hasOption('p')) {
        InternalLogger console = InternalLoggerFactory.getLogger(LoggerName.NAMESRV_CONSOLE_NAME);
        MixAll.printObjectProperties(console, namesrvConfig);
        MixAll.printObjectProperties(console, nettyServerConfig);
        System.exit(0);
    }
    //把命令行的配置解析到namesrvConfig
    MixAll.properties2Object(ServerUtil.commandLine2Properties(commandLine), namesrvConfig);
    //如果不存在ROCKETMQ_HOME的配置，那么打印异常并退出程序，这就是最开始启动NameServer是抛出异常的位置
    if (null == namesrvConfig.getRocketmqHome()) {
        System.out.printf("Please set the %s variable in your environment to match the location of the RocketMQ installation%n", MixAll.ROCKETMQ_HOME_ENV);
        System.exit(-2);
    }
    /*一系列日志的配置*/
    LoggerContext lc = (LoggerContext) LoggerFactory.getILoggerFactory();
    JoranConfigurator configurator = new JoranConfigurator();
    configurator.setContext(lc);
    lc.reset();
    configurator.doConfigure(namesrvConfig.getRocketmqHome() + "/conf/logback_namesrv.xml");
    log = InternalLoggerFactory.getLogger(LoggerName.NAMESRV_LOGGER_NAME);
    //打印nameServer 服务器配置类和 netty 服务器配置类的配置信息
    MixAll.printObjectProperties(log, namesrvConfig);
    MixAll.printObjectProperties(log, nettyServerConfig);
    /*
     * 根据namesrvConfig和nettyServerConfig创建NamesrvController
     */
    final NamesrvController controller = new NamesrvController(namesrvConfig, nettyServerConfig);
    // 将所有的-c的外部配置信息保存到NamesrvController中的Configuration对象属性的allConfigs属性中
    controller.getConfiguration().registerConfig(properties);
    return controller;
}
```

**1、** 创建NameServer的配置类和NettyServer的配置类,包含NameServer的配置,比如ROCKETMQ_HOME；

**2、** 判断命令行中是否包含字符’c’,即是否包含通过命令行指定配置文件的命令；

**3、** 判断命令行中是否包含字符’p’,如果存在则打印配置信息并结束jvm运行；

**4、** 把命令行的配置解析到namesrvConfig；

**5、** 根据namesrvConfig和nettyServerConfig创建NamesrvController；

**6、** 将所有的-c的外部配置信息保存到NamesrvController中的Configuration对象属性的allConfigs属性中；

### 3.1 创建NamesrvController

初始化一些属性。

```java
public NamesrvController(NamesrvConfig namesrvConfig, NettyServerConfig nettyServerConfig) {
    //nameserver的配置
    this.namesrvConfig = namesrvConfig;
    //nameserver的netty服务的配置
    this.nettyServerConfig = nettyServerConfig;
    //kv配置管理器
    this.kvConfigManager = new KVConfigManager(this);
    //路由信息管理器
    this.routeInfoManager = new RouteInfoManager();
    //Broker连接的各种事件的处理服务，是处理Broker连接发生变化的服务
    //主要用于监听在Channel通道关闭事件触发时调用RouteInfoManager#onChannelDestroy清除路由信息
    this.brokerHousekeepingService = new BrokerHousekeepingService(this);
    //配置类，并将namesrvConfig和nettyServerConfig的配置注册到内部的allConfigs集合中
    this.configuration = new Configuration(log, this.namesrvConfig, this.nettyServerConfig);
    //存储路径配置
    this.configuration.setStorePathFromConfig(this.namesrvConfig, "configStorePath");
}
```

brokerHousekeepingService: ChannelEventListener的实现类, 主要用于监听Broker的Channel通道关闭事件, 并在事件触发时调用RouteInfoManager#onChannelDestroy清除路由信息。

```java
public class BrokerHousekeepingService implements ChannelEventListener {
    private static final InternalLogger log = InternalLoggerFactory.getLogger(LoggerName.NAMESRV_LOGGER_NAME);
    private final NamesrvController namesrvController;
    public BrokerHousekeepingService(NamesrvController namesrvController) {
        this.namesrvController = namesrvController;
    }
    //连接事件，不处理
    @Override
    public void onChannelConnect(String remoteAddr, Channel channel) {
    }
    //连接关闭事件
    @Override
    public void onChannelClose(String remoteAddr, Channel channel) {
        this.namesrvController.getRouteInfoManager().onChannelDestroy(remoteAddr, channel);
    }
    //连接异常事件
    @Override
    public void onChannelException(String remoteAddr, Channel channel) {
        this.namesrvController.getRouteInfoManager().onChannelDestroy(remoteAddr, channel);
    }
    //连接闲置事件
    @Override
    public void onChannelIdle(String remoteAddr, Channel channel) {
        this.namesrvController.getRouteInfoManager().onChannelDestroy(remoteAddr, channel);
    }
}
```

## 4.start启动NamesrvController

启动NameServer中的NettyServer服务。

**1、** 调用initialize方法初始化NettyServer创建netty远程服务,初始化netty线程池,注册请求处理器,配置定时任务,扫描并移除不活跃的Broker等操作；

**2、** 对JVM添加关闭钩子方法,在NameServer的JVM关闭之前执行,关闭NameServerController中的线程池,NettyServer进行关闭进行一些内存清理、对象销毁等操作；

**3、** 调用start方法启动NettyServer,并监听；

```java
public static NamesrvController start(final NamesrvController controller) throws Exception {
    //不能为null
    if (null == controller) {
        throw new IllegalArgumentException("NamesrvController is null");
    }
    /*
     * 1 初始化NettyServer
     * 创建netty远程服务，初始化Netty线程池，注册请求处理器，配置定时任务，用于扫描并移除不活跃的Broker等操作。
     */
    boolean initResult = controller.initialize();
    //初始化失败则退出程序
    if (!initResult) {
        controller.shutdown();
        System.exit(-3);
    }
    /*
     * 2 添加关闭钩子方法，在NameServer关闭之前执行，进行一些内存清理、对象销毁等操作
     */
    Runtime.getRuntime().addShutdownHook(new ShutdownHookThread(log, new Callable<Void>() {
        @Override
        public Void call() throws Exception {
            controller.shutdown();
            return null;
        }
    }));
    /*
     * 3 启动NettyServer，并进行监听
     */
    controller.start();
    return controller;
}
```

### 4.1 初始化NettyServer

initialize:

**1、** 加载KV配置并存储到kvConfigManager内部的configTable属性中；

**2、** 创建NameServer的netty远程服务,remotingServer是一个基于Netty的用于NameServer与Broker、Consumer、Producer进行网络通信的服务端；

**3、** 创建netty远程通信执行器线程池remotingExecutor,线程数默认8,线程名以RemotingExecutorThread_为前缀,用作默认的请求处理线程池；

**4、** 注册默认请求处理器DefaultRequestProcessor到remotingServer中；

**5、** 启动两个定时任务其中一个每隔十秒钟检测不活跃的Broker并清理相关路由信息另一个任务则是每隔十分钟打印kv配置信息；

```java
public boolean initialize() {
    /*
     * 1 加载KV配置并存储到kvConfigManager内部的configTable属性中
     * KVConfig配置文件默认路径是 ${user.home}/namesrv/kvConfig.json
     */
    this.kvConfigManager.load();
    /*
     * 2 创建NameServer的netty远程服务
     * 设置了一个ChannelEventListener，为此前创建brokerHousekeepingService
     * remotingServer是一个基于Netty的用于NameServer与Broker、Consumer、Producer进行网络通信的服务端
     */
    this.remotingServer = new NettyRemotingServer(this.nettyServerConfig, this.brokerHousekeepingService);
    /*
     * 3 创建netty远程通信执行器线程池，用作默认的请求处理线程池，线程名以RemotingExecutorThread_为前缀
     */
    this.remotingExecutor =
        Executors.newFixedThreadPool(nettyServerConfig.getServerWorkerThreads(), new ThreadFactoryImpl("RemotingExecutorThread_"));
    /*
     * 4 注册默认请求处理器DefaultRequestProcessor
     * 将remotingExecutor绑定到DefaultRequestProcessor上，用作默认的请求处理线程池
     * DefaultRequestProcessor绑定到remotingServer的defaultRequestProcessor属性上
     */
    this.registerProcessor();
    /*
     * 5 启动一个定时任务
     * 首次启动延迟5秒执行，此后每隔10秒执行一次扫描无效的Broker，并清除Broker相关路由信息的任务
     */
    this.scheduledExecutorService.scheduleAtFixedRate(new Runnable() {
        @Override
        public void run() {
            //扫描notActive的broker
            NamesrvController.this.routeInfoManager.scanNotActiveBroker();
        }
    }, 5, 10, TimeUnit.SECONDS);
    /*
     * 6 启动一个定时任务
     * 首次启动延迟1分钟执行，此后每隔10分钟执行一次打印kv配置信息的任务
     */
    this.scheduledExecutorService.scheduleAtFixedRate(new Runnable() {
        @Override
        public void run() {
            //打印kv配置信息
            NamesrvController.this.kvConfigManager.printAllPeriodically();
        }
    }, 1, 10, TimeUnit.MINUTES);
    /*
     * Tls传输相关配置，通信安全的文件监听模块，用来观察网络加密配置文件的更改
     */
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

### 4.1.1 创建NettyRemotingServer#

remotingServer是一个基于Netty的用于NameServer与Broker、Consumer、Producer进行网络通信的服务端。

**1、** 创建ServerBootstrap,Netty启动服务端；

**2、** 创建一个公共线程池publicExecutor,线程数为4,线程名以NettyServerPublicExecutor_为前缀用在registerProcessor方法中,；

**3、** 根据是否使用epoll模型初始化BossEventLoopGroup和WorkerEventLoopGroup这两个事件循环组,线程数分别默认1个和3个线程,线程名分别以NettyEPOLLBoss_和NettyServerEPOLLSelector_为前缀如果是linux内核,并且指定开启epoll,并且系统支持epoll,才会使用EpollEventLoopGroup类型,否则使用NioEventLoopGroup；

```java
public NettyRemotingServer(final NettyServerConfig nettyServerConfig,
    final ChannelEventListener channelEventListener) {
    //设置服务器单向、异步发送信号量
    super(nettyServerConfig.getServerOnewaySemaphoreValue(), nettyServerConfig.getServerAsyncSemaphoreValue());
    //创建Netty服务端启动类，引导启动服务端
    this.serverBootstrap = new ServerBootstrap();
    this.nettyServerConfig = nettyServerConfig;
    this.channelEventListener = channelEventListener;
    //服务器回调执行线程数量，默认设置为4
    int publicThreadNums = nettyServerConfig.getServerCallbackExecutorThreads();
    if (publicThreadNums <= 0) {
        publicThreadNums = 4;
    }
    //创建一个公共线程池，负责处理某些请求业务，例如发送异步消息回调，线程名以NettyServerPublicExecutor_为前缀
    this.publicExecutor = Executors.newFixedThreadPool(publicThreadNums, new ThreadFactory() {
        private AtomicInteger threadIndex = new AtomicInteger(0);
        @Override
        public Thread newThread(Runnable r) {
            return new Thread(r, "NettyServerPublicExecutor_" + this.threadIndex.incrementAndGet());
        }
    });
    /*
     * 是否使用epoll模型，并且初始化Boss EventLoopGroup和Worker EventLoopGroup这两个事件循环组
     * 如果是linux内核，并且指定开启epoll，并且系统支持epoll，才会使用EpollEventLoopGroup，否则使用NioEventLoopGroup
     */
    if (useEpoll()) {
        /*采用了epoll*/
        this.eventLoopGroupBoss = new EpollEventLoopGroup(1, new ThreadFactory() {
            private AtomicInteger threadIndex = new AtomicInteger(0);
            @Override
            public Thread newThread(Runnable r) {
                return new Thread(r, String.format("NettyEPOLLBoss_%d", this.threadIndex.incrementAndGet()));
            }
        });
        this.eventLoopGroupSelector = new EpollEventLoopGroup(nettyServerConfig.getServerSelectorThreads(), new ThreadFactory() {
            private AtomicInteger threadIndex = new AtomicInteger(0);
            private int threadTotal = nettyServerConfig.getServerSelectorThreads();
            @Override
            public Thread newThread(Runnable r) {
                return new Thread(r, String.format("NettyServerEPOLLSelector_%d_%d", threadTotal, this.threadIndex.incrementAndGet()));
            }
        });
    } else {
        /*未采用epoll*/
        //Boss EventLoopGroup 默认1个线程，线程名以NettyNIOBoss_为前缀
        this.eventLoopGroupBoss = new NioEventLoopGroup(1, new ThreadFactory() {
            private AtomicInteger threadIndex = new AtomicInteger(0);
            @Override
            public Thread newThread(Runnable r) {
                return new Thread(r, String.format("NettyNIOBoss_%d", this.threadIndex.incrementAndGet()));
            }
        });
        //Worker EventLoopGroup 默认3个线程，线程名以NettyServerNIOSelector_为前缀
        this.eventLoopGroupSelector = new NioEventLoopGroup(nettyServerConfig.getServerSelectorThreads(), new ThreadFactory() {
            private AtomicInteger threadIndex = new AtomicInteger(0);
            private int threadTotal = nettyServerConfig.getServerSelectorThreads();
            @Override
            public Thread newThread(Runnable r) {
                return new Thread(r, String.format("NettyServerNIOSelector_%d_%d", threadTotal, this.threadIndex.incrementAndGet()));
            }
        });
    }
    //加载ssl信息
    loadSslContext();
}
```

### 4.1.2 registerProcessor注册默认请求处理器#

注册默认请求处理器DefaultRequestProcessor到remotingServer中。

当请求来的时候, 先根据请求的code, 获取对应的RequestProcessor, 如果code没有注册RequestProcessor, 采用DefaultRequestProcessor处理。

```java
private void registerProcessor() {
    if (namesrvConfig.isClusterTest()) {
        this.remotingServer.registerDefaultProcessor(new ClusterTestRequestProcessor(this, namesrvConfig.getProductEnvName()),
            this.remotingExecutor);
    } else {
        //将remotingExecutor绑定到DefaultRequestProcessor上，用作默认的请求处理线程池
        //将DefaultRequestProcessor绑定到remotingServer的defaultRequestProcessor属性上
        this.remotingServer.registerDefaultProcessor(new DefaultRequestProcessor(this), this.remotingExecutor);
    }
}
@Override
public void registerDefaultProcessor(NettyRequestProcessor processor, ExecutorService executor) {
    //defaultRequestProcessor属性
    this.defaultRequestProcessor = new Pair<NettyRequestProcessor, ExecutorService>(processor, executor);
}
```

### 4.1.3 启动定时任务#

在创建了remotingServer并且注册了默认请求处理器之后, 创建两个定时任务

**1、** 首次启动延迟5s,每隔10s执行一次扫描无效的Broker,并清除Broker相关路由信息的任务；

**2、** 首次启动延迟1分钟执行,此后每隔10分钟执行一次打印kvConfig配置信息的任务；

```java
/*
 * 5 启动一个定时任务
 * 首次启动延迟5秒执行，此后每隔10秒执行一次扫描无效的Broker，并清除Broker相关路由信息的任务
 */
this.scheduledExecutorService.scheduleAtFixedRate(new Runnable() {
    @Override
    public void run() {
        //扫描notActive的broker
        NamesrvController.this.routeInfoManager.scanNotActiveBroker();
    }
}, 5, 10, TimeUnit.SECONDS);
/*
 * 6 启动一个定时任务
 * 首次启动延迟1分钟执行，此后每隔10分钟执行一次打印kv配置信息的任务
 */
this.scheduledExecutorService.scheduleAtFixedRate(new Runnable() {
    @Override
    public void run() {
        //打印kv配置信息
        NamesrvController.this.kvConfigManager.printAllPeriodically();
    }
}, 1, 10, TimeUnit.MINUTES);
```

### 4.2 注册销毁钩子函数

```java
public void shutdown() {
    //关闭nettyserver
    this.remotingServer.shutdown();
    //关闭线程池
    this.remotingExecutor.shutdown();
    //关闭定时任务
    this.scheduledExecutorService.shutdown();
    if (this.fileWatchService != null) {
        this.fileWatchService.shutdown();
    }
}
```

**1、** 关闭nettyserver；

**2、** 关闭线程池；

**3、** 关闭定时任务；

### 4.3 start启动NettyServer

```java
/**
 * NamesrvController的方法
 */
public void start() throws Exception {
    //调用remotingServer的启动方法
    this.remotingServer.start();
    if (this.fileWatchService != null) {
        //监听tts相关文件是否发生变化
        this.fileWatchService.start();
    }
}
```

**1、** 调用remotingServer的启动方法:将会启动一个Netty服务端,NettyRemotingServer类属于remoting远程通信模块,是NameServer和Broker共用的进入网络通信类；

**2、** 监听tts相关文件是否发生变化；

remotingServer.start():

```java
@Override
public void start() {
    /*
     * 1 创建默认事件处理器组，线程数默认8个线程，线程名以NettyServerCodecThread_为前缀。
     * 主要用于执行在真正执行业务逻辑之前需要进行的SSL验证、编解码、空闲检查、网络连接管理等操作
     * 其工作时间位于IO线程组之后，process线程组之前
     */
    this.defaultEventExecutorGroup = new DefaultEventExecutorGroup(
            nettyServerConfig.getServerWorkerThreads(),
            new ThreadFactory() {
                private AtomicInteger threadIndex = new AtomicInteger(0);
                @Override
                public Thread newThread(Runnable r) {
                    return new Thread(r, "NettyServerCodecThread_" + this.threadIndex.incrementAndGet());
                }
            });
    /*
     * 2 准备一些共享handler
     * 包括handshakeHandler、encoder、connectionManageHandler、serverHandler
     */
    prepareSharableHandlers();
    /*
     * 3 配置NettyServer的启动参数
     * 包括handshakeHandler、encoder、connectionManageHandler、serverHandler
     */
    ServerBootstrap childHandler =
            //配置bossGroup为此前创建的eventLoopGroupBoss，默认1个线程，用于处理连接时间
            //配置workerGroup为此前创建的eventLoopGroupSelector，默认三个线程，用于处理IO事件
            this.serverBootstrap.group(this.eventLoopGroupBoss, this.eventLoopGroupSelector)
                    //IO模型
                    .channel(useEpoll() ? EpollServerSocketChannel.class : NioServerSocketChannel.class)
                    /*设置通道的选项参数， 对于服务端而言就是ServerSocketChannel， 客户端而言就是SocketChannel*/
                    /*option主要是针对boss线程组，child主要是针对worker线程组*/
                    //对应的是tcp/ip协议listen函数中的backlog参数
                    .option(ChannelOption.SO_BACKLOG, nettyServerConfig.getServerSocketBacklog())
                    //对应于套接字选项中的SO_REUSEADDR，这个参数表示允许重复使用本地地址和端口
                    .option(ChannelOption.SO_REUSEADDR, true)
                    //对应于套接字选项中的SO_KEEPALIVE，该参数用于设置TCP连接，当设置该选项以后，连接会测试链接的状态
                    .option(ChannelOption.SO_KEEPALIVE, false)
                    //对应于套接字选项中的TCP_NODELAY，该参数的使用与Nagle算法有关
                    .childOption(ChannelOption.TCP_NODELAY, true)
                    //配置本地地址，监听端口为此前设置的9876
                    .localAddress(new InetSocketAddress(this.nettyServerConfig.getListenPort()))
                    /*设置用于为 Channel 的请求提供服务的 ChannelHandler*/
                    .childHandler(new ChannelInitializer<SocketChannel>() {
                        @Override
                        public void initChannel(SocketChannel ch) throws Exception {
                            //ChannelPipeline一个ChannelHandler的链表，Netty处理请求基于责任链默认
                            //里面的ChannelHandler就是用于处理请求的
                            ch.pipeline()
                                    //处理TSL协议握手的Handler
                                    .addLast(defaultEventExecutorGroup, HANDSHAKE_HANDLER_NAME, handshakeHandler)
                                    //为defaultEventExecutorGroup，添加handler
                                    .addLast(defaultEventExecutorGroup,
                                            //RocketMQ自定义的请求解码器
                                            encoder,
                                            //RocketMQ自定义的请求编码器
                                            new NettyDecoder(),
                                            //Netty自带的心跳管理器，主要是用来检测远端是否存活
                                            //即测试端一定时间内未接受到被测试端消息和一定时间内向被测试端发送消息的超时时间为120秒
                                            new IdleStateHandler(0, 0, nettyServerConfig.getServerChannelMaxIdleTimeSeconds()),
                                            //连接管理器，他负责连接的激活、断开、超时、异常等事件
                                            connectionManageHandler,
                                            //服务请求处理器，处理RemotingCommand消息，即请求和响应的业务处理，并且返回相应的处理结果。这是重点
                                            //例如broker注册、producer/consumer获取Broker、Topic信息等请求都是该处理器处理
                                            //serverHandler最终会将请求根据不同的消息类型code分发到不同的process线程池处理
                                            serverHandler
                                    );
                        }
                    });
    //对应于套接字选项中的SO_SNDBUF，接收缓冲区，默认是65535
    if (nettyServerConfig.getServerSocketSndBufSize() > 0) {
        log.info("server set SO_SNDBUF to {}", nettyServerConfig.getServerSocketSndBufSize());
        childHandler.childOption(ChannelOption.SO_SNDBUF, nettyServerConfig.getServerSocketSndBufSize());
    }
    //对应于套接字选项中的SO_SNDBUF，发送缓冲区，默认是65535
    if (nettyServerConfig.getServerSocketRcvBufSize() > 0) {
        log.info("server set SO_RCVBUF to {}", nettyServerConfig.getServerSocketRcvBufSize());
        childHandler.childOption(ChannelOption.SO_RCVBUF, nettyServerConfig.getServerSocketRcvBufSize());
    }
    //用于设置写缓冲区的低水位线和高水位线。
    if (nettyServerConfig.getWriteBufferLowWaterMark() > 0 && nettyServerConfig.getWriteBufferHighWaterMark() > 0) {
        log.info("server set netty WRITE_BUFFER_WATER_MARK to {},{}",
                nettyServerConfig.getWriteBufferLowWaterMark(), nettyServerConfig.getWriteBufferHighWaterMark());
        childHandler.childOption(ChannelOption.WRITE_BUFFER_WATER_MARK, new WriteBufferWaterMark(
                nettyServerConfig.getWriteBufferLowWaterMark(), nettyServerConfig.getWriteBufferHighWaterMark()));
    }
    //分配缓冲区
    if (nettyServerConfig.isServerPooledByteBufAllocatorEnable()) {
        childHandler.childOption(ChannelOption.ALLOCATOR, PooledByteBufAllocator.DEFAULT);
    }
    try {
        /*
         * 启动Netty服务
         */
        ChannelFuture sync = this.serverBootstrap.bind().sync();
        InetSocketAddress addr = (InetSocketAddress) sync.channel().localAddress();
        //设置端口号，默认9876
        this.port = addr.getPort();
    } catch (InterruptedException e1) {
        throw new RuntimeException("this.serverBootstrap.bind().sync() InterruptedException", e1);
    }
    //如果channelEventListener不为null，那么启动netty事件执行器
    //这里的listener就是之前初始化的BrokerHousekeepingService
    if (this.channelEventListener != null) {
        this.nettyEventExecutor.start();
    }
    /*
     * 启动定时任务，初始启动3秒后执行，此后每隔1秒执行一次
     * 扫描responseTable，将超时的ResponseFuture直接移除，并且执行这些超时ResponseFuture的回调
     */
    this.timer.scheduleAtFixedRate(new TimerTask() {
        @Override
        public void run() {
            try {
                NettyRemotingServer.this.scanResponseTable();
            } catch (Throwable e) {
                log.error("scanResponseTable exception", e);
            }
        }
    }, 1000 * 3, 1000);
}
```

Handler:

**1、** handshakeHandler:用来处理TSL协议握手的Handler,无需过多关注；

**2、** NettyEncoder和NettyDecoder:RocketMQ自定义的请求解码和编码器,处理报文的编解码操作负责网络传输数据和RemotingCommand之间的编解码；

**3、** IdleStateHandler:Netty自带的心跳管理器,用来检测远端是否存活；

**4、** connectionManageHandler:处理连接事件的Handler,负责连接的激活、断开、超时、异常等事件；

**5、** serverHandler:处理读写事件的handler,是真正处理业务请求的；

通过serverBootstrap#sync方法启动netty服务端的, NameServer启动完毕, 然后可以对外提供远程通信服务, 启动Broker。

启动了一个定时任务scanResponseTable, 是用于处理通信时的异常情况, RocketMQ会将请求结果封装为一个ResponseFuture并且存入responseTable中。那么在发送消息时候, 如果出现异常的话, 可能造成responseTable中的ResponseFuture累积, 因此每一秒扫描一次responseTable, 将超时的ResponseFuture直接移除, 执行ResponseFuture的回调。

## 5.NameServer启动流程总结

- 进行一些初始化的配置的读取, 然后最重要的是启动一个基于Netty的服务端, 端口为9876。
- 启动一些定时任务, 比如printAllPeriodically每一分钟打印kv信息, scanResponseTable每一秒钟清除无效ResponseFuture, scanNotActiveBroker每10s执行一次扫描, 检查无效的broker, 并清除相关的路由信息的任务。
