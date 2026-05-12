# 08、Zookeeper Leader选举源码解析
- 来源：https://ddkk.com/zhuanlan/registered/zookeeper/d-3/8.html
- 分类：注册中心
- 分组：ZooKeeper 教程（版本 C）
Zookeeper启动的main方法是`org.apache.zookeeper.server.quorum.QuorumPeerMain`类的main方法：

```java
public static void main(String[] args) {
    QuorumPeerMain main = new QuorumPeerMain();
    try {
        main.initializeAndRun(args);
    } ...
    ...
}
```

进入到`initializeAndRun`方法：

```java
protected void initializeAndRun(String[] args)
        throws ConfigException, IOException
{
     // args[0]是传入的配置文件
    QuorumPeerConfig config = new QuorumPeerConfig();
    if (args.length == 1) {
        // 解析配置文件
        config.parse(args[0]);
    }
    // Start and schedule the the purge task
    // 启动一个定时清除日志的任务
    DatadirCleanupManager purgeMgr = new DatadirCleanupManager(config
            .getDataDir(), config.getDataLogDir(), config
            .getSnapRetainCount(), config.getPurgeInterval());
    purgeMgr.start();
     // 我们是集群启动Zookeeper，必须使用到配置文件，因此接下来运行到runFromConfig
    if (args.length == 1 && config.servers.size() > 0) {
        runFromConfig(config);
    } else {
        LOG.warn("Either no config or no quorum defined in config, running "
                + " in standalone mode");
        // there is only server in the quorum -- run as standalone
        ZooKeeperServerMain.main(args);
    }
}
```

这里传入的配置文件就是Zookeeper根目录下的`conf/zoo.cfg`文件([可参考启动脚本zkServer.sh](http://xn--zkServer-is8m34geozy088qsx4dwod.sh))，该配置文件可以配置哪些配置项可以参考`QuorumPeerConfig`的解析配置文件过程。接下来进入`runFromConfig`方法：

```java
public void runFromConfig(QuorumPeerConfig config) throws IOException {
  try {
      ManagedUtil.registerLog4jMBeans();
  } catch (JMException e) {
      LOG.warn("Unable to register log4j JMX control", e);
  }
  LOG.info("Starting quorum peer");
  try {
      // cnxnFactory用于处理本节点上的一些IO操作，默认情况下是NIOServerCnxnFactory的对象
      ServerCnxnFactory cnxnFactory = ServerCnxnFactory.createFactory();
      // 配置本节点监听的客户端端口和连接数
      cnxnFactory.configure(config.getClientPortAddress(),
                            config.getMaxClientCnxns());
        // QuorumPeer是zk的重要类之一
      quorumPeer = getQuorumPeer();
        // 设置从配置文件读取到的所有配置节点(zoo.cfg中的server.1=localhost:2888:3888配置项)
      quorumPeer.setQuorumPeers(config.getServers());
      quorumPeer.setTxnFactory(new FileTxnSnapLog(
              new File(config.getDataLogDir()),
              new File(config.getDataDir())));
      // 设置使用的Leader选举算法
      quorumPeer.setElectionType(config.getElectionAlg());
      quorumPeer.setMyid(config.getServerId());
      quorumPeer.setTickTime(config.getTickTime());
      quorumPeer.setInitLimit(config.getInitLimit());
      quorumPeer.setSyncLimit(config.getSyncLimit());
      quorumPeer.setQuorumListenOnAllIPs(config.getQuorumListenOnAllIPs());
      quorumPeer.setCnxnFactory(cnxnFactory);
      quorumPeer.setQuorumVerifier(config.getQuorumVerifier());
      quorumPeer.setClientPortAddress(config.getClientPortAddress());
      quorumPeer.setMinSessionTimeout(config.getMinSessionTimeout());
      quorumPeer.setMaxSessionTimeout(config.getMaxSessionTimeout());
      quorumPeer.setZKDatabase(new ZKDatabase(quorumPeer.getTxnFactory()));
      quorumPeer.setLearnerType(config.getPeerType());
      quorumPeer.setSyncEnabled(config.getSyncEnabled());
      // sets quorum sasl authentication configurations
      quorumPeer.setQuorumSaslEnabled(config.quorumEnableSasl);
      if(quorumPeer.isQuorumSaslAuthEnabled()){
          quorumPeer.setQuorumServerSaslRequired(config.quorumServerRequireSasl);
          quorumPeer.setQuorumLearnerSaslRequired(config.quorumLearnerRequireSasl);
          quorumPeer.setQuorumServicePrincipal(config.quorumServicePrincipal);
          quorumPeer.setQuorumServerLoginContext(config.quorumServerLoginContext);
          quorumPeer.setQuorumLearnerLoginContext(config.quorumLearnerLoginContext);
      }
      quorumPeer.setQuorumCnxnThreadsSize(config.quorumCnxnThreadsSize);
      quorumPeer.initialize();
      quorumPeer.start();
      quorumPeer.join();
  } catch (InterruptedException e) {
      // warn, but generally this is ok
      LOG.warn("Quorum Peer interrupted", e);
  }
}
```

`runFromConfig`方法主要将从`zoo.cfg`中读取到的配置设置到`QuorumPeer`的对象属性中区，`QuorumPeer`继承了`ZooKeeperThread`类，而`ZooKeeperThread`继承了`Thread`类，因此`QuorumPeer`是一个线程类，稍后我们将分析其`run`方法。进入到`quorumPeer.start()`方法：

```java
@Override
public synchronized void start() {
     // 从快照文件(dataDir目录下snapshot文件)中恢复会话和zk节点信息
    loadDataBase();
    // 处理IO事件(暂不了解这个的作用，之后的文章会对这个进行分析，现在跳过不影响我们分析Leader的选举)
    cnxnFactory.start();
    // 开始进行Leader的选举        
    startLeaderElection();
    // 开始监听本节点的状态，根据不同的状态(LOOKING、OBSERVING、FOLLOWING、LEADING)执行相应操作
    super.start();
}
```

> 版权声明：「DDKK.COM 弟弟快看，程序员编程资料站」本站文章，版权归原作者所有
