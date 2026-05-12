# 10、Zookeeper 源码解析 - 集群启动
- 来源：https://ddkk.com/zhuanlan/registered/zookeeper/2/10.html
- 分类：注册中心
- 分组：教程目录
### 一、ZooKeeper集群

我们先模拟搭建一个ZooKeeper集群环境：

第一步，把下载好的文件复制好三份

第二步，准备三个数据目录

第三步，在每个数据目录下创建myid文件，文件内容分别写入1、2、3

第四步，修改每个zoo.cfg配置文件，具体修改内容如下，不同的服务使用不同的clientPort端口

```java
tickTime=2000
initLimit=10
syncLimit=5
dataDir=D:\\zookeeper\\data1
clientPort=2181
server.1=127.0.0.1:2888:3888
server.2=127.0.0.1:2889:3889
server.3=127.0.0.1:2890:3890
```

最后依次启动即可。

### 二、源码分析

接下来我们将从源码的角度分析ZooKeeper集群启动过程以及关于集群的一些知识。回到QuorumPeerMain启动类中，其main方法会调用initializeAndRun：

```java
protected void initializeAndRun(String[] args) throws ConfigException, IOException, AdminServerException {
       //解析配置文件，这在分析单机启动的时候，已经见到介绍过了
    QuorumPeerConfig config = new QuorumPeerConfig();
    if (args.length == 1) {
        config.parse(args[0]);
    }
    //判断当前是否是集群启动模式
    if (args.length == 1 && config.isDistributed()) {
        runFromConfig(config);
    } else {
        ZooKeeperServerMain.main(args);
    }
}
```

我们看看ZooKeeper是怎么判断当前启动是集群还是非集群config.isDistributed()：

```java
```java
public boolean isDistributed() {
    return quorumVerifier != null && (!standaloneEnabled || quorumVerifier.getVotingMembers().size() > 1);
}
```

quorumVerifier 的实例是在解析配置文件的parse方法中实例化的如下所示：

```java
if (dynamicConfigFileStr == null) {
    setupQuorumPeerConfig(zkProp, true);
    if (isDistributed() && isReconfigEnabled()) {
        backupOldConfig();
    }
}
```

```java
void setupQuorumPeerConfig(Properties prop, boolean configBackwardCompatibilityMode) throws IOException, ConfigException {
//解析配置文件中的server.*配置
quorumVerifier = parseDynamicConfig(prop, electionAlg, true, configBackwardCompatibilityMode);
//解析data目录下的myid文件，设置为当前serverId属性
setupMyId();
//解析客户端端口
setupClientPort();
//设置当前节点是否参与选举
setupPeerType();
//验证当前配置的合法性
checkValidity();
}
```

继续执行runFromConfig方法：

```java
public void runFromConfig(QuorumPeerConfig config) throws IOException, AdminServerException {
   //去除了部分代码
    try {
       //此时也会初始化两个网络IO处理工厂
        ServerCnxnFactory cnxnFactory = null;
        ServerCnxnFactory secureCnxnFactory = null;
        //初始化工厂，这和单机启动一样
        if (config.getClientPortAddress() != null) {
            cnxnFactory = ServerCnxnFactory.createFactory();
            cnxnFactory.configure(config.getClientPortAddress(), config.getMaxClientCnxns(), config.getClientPortListenBacklog(), false);
        }
        if (config.getSecureClientPortAddress() != null) {
            secureCnxnFactory = ServerCnxnFactory.createFactory();
            secureCnxnFactory.configure(config.getSecureClientPortAddress(), config.getMaxClientCnxns(), config.getClientPortListenBacklog(), true);
        }
       //实例化QuorumPeer 对象
        quorumPeer = getQuorumPeer();
        //设置日志文件处理器（已经分析过）
        quorumPeer.setTxnFactory(new FileTxnSnapLog(config.getDataLogDir(), config.getDataDir()));
        quorumPeer.enableLocalSessions(config.areLocalSessionsEnabled());
        quorumPeer.enableLocalSessionsUpgrading(config.isLocalSessionsUpgradingEnabled());
        quorumPeer.setElectionType(config.getElectionAlg());
        quorumPeer.setMyid(config.getServerId());
        quorumPeer.setTickTime(config.getTickTime());
        quorumPeer.setMinSessionTimeout(config.getMinSessionTimeout());
        quorumPeer.setMaxSessionTimeout(config.getMaxSessionTimeout());
        quorumPeer.setInitLimit(config.getInitLimit());
        quorumPeer.setSyncLimit(config.getSyncLimit());
        quorumPeer.setConnectToLearnerMasterLimit(config.getConnectToLearnerMasterLimit());
        quorumPeer.setObserverMasterPort(config.getObserverMasterPort());
        quorumPeer.setConfigFileName(config.getConfigFilename());
        quorumPeer.setClientPortListenBacklog(config.getClientPortListenBacklog());
        quorumPeer.setZKDatabase(new ZKDatabase(quorumPeer.getTxnFactory()));
        quorumPeer.setQuorumVerifier(config.getQuorumVerifier(), false);
        if (config.getLastSeenQuorumVerifier() != null) {
            quorumPeer.setLastSeenQuorumVerifier(config.getLastSeenQuorumVerifier(), false);
        }
        quorumPeer.initConfigInZKDatabase();
        quorumPeer.setCnxnFactory(cnxnFactory);
        quorumPeer.setSecureCnxnFactory(secureCnxnFactory);
        quorumPeer.setSslQuorum(config.isSslQuorum());
        quorumPeer.setUsePortUnification(config.shouldUsePortUnification());
        quorumPeer.setLearnerType(config.getPeerType());
        quorumPeer.setSyncEnabled(config.getSyncEnabled());
        quorumPeer.setQuorumListenOnAllIPs(config.getQuorumListenOnAllIPs());
        if (config.sslQuorumReloadCertFiles) {
            quorumPeer.getX509Util().enableCertFileReloading();
        }
        quorumPeer.setMultiAddressEnabled(config.isMultiAddressEnabled());
        quorumPeer.setMultiAddressReachabilityCheckEnabled(config.isMultiAddressReachabilityCheckEnabled());
        quorumPeer.setMultiAddressReachabilityCheckTimeoutMs(config.getMultiAddressReachabilityCheckTimeoutMs());
        // sets quorum sasl authentication configurations
        quorumPeer.setQuorumSaslEnabled(config.quorumEnableSasl);
        if (quorumPeer.isQuorumSaslAuthEnabled()) {
            quorumPeer.setQuorumServerSaslRequired(config.quorumServerRequireSasl);
            quorumPeer.setQuorumLearnerSaslRequired(config.quorumLearnerRequireSasl);
            quorumPeer.setQuorumServicePrincipal(config.quorumServicePrincipal);
            quorumPeer.setQuorumServerLoginContext(config.quorumServerLoginContext);
            quorumPeer.setQuorumLearnerLoginContext(config.quorumLearnerLoginContext);
        }
        quorumPeer.setQuorumCnxnThreadsSize(config.quorumCnxnThreadsSize);
        quorumPeer.initialize();
        if (config.jvmPauseMonitorToRun) {
            quorumPeer.setJvmPauseMonitor(new JvmPauseMonitor(config));
        }
       //此时我们需要关注的就是这个start方法，这也是集群启动的入口方法
        quorumPeer.start();
        ZKAuditProvider.addZKStartStopAuditLog();
        quorumPeer.join();
    } catch (InterruptedException e) {
    } finally {
        try {
            metricsProvider.stop();
        } catch (Throwable error) {
            LOG.warn("Error while stopping metrics", error);
        }
    }
}
```

start方法

```java
public synchronized void start() {
    //加载数据库
    loadDataBase();
    //启动客户端监听程序（接收客户端请求），和单机模式一样
    startServerCnxnFactory();
    try {
         //启动管理后台程序
        adminServer.start();
    } catch (AdminServerException e) {
        LOG.warn("Problem starting AdminServer", e);
        System.out.println(e);
    }
    //开始leader选举
    startLeaderElection();
    startJvmPauseMonitor();
    //启动当前线程，执行run方法
    super.start();
}
```

从启动上逻辑看，集群启动，相比单机启动多了个leader选举过程，但是还是有个中差异。在加载数据库的时候，集群模式下，多了两个参数currentEpoch和acceptedEpoch，至于这两个参数具体作用是什么先不分析。

### 三、总结

有了[单机模式下启动过程](/zhuanlan/registered/zookeeper/2/3.html)的分析，集群模式的启动过程分析起来，就相对简单了些，难点在于启动过程中leader的选举，以及怎么去维护当前集群，以及集群中处理请求的过程，所以接下来将从集群模式下去一一分析这些问题。

以上，有任何不对的地方，请留言指正，敬请谅解。
