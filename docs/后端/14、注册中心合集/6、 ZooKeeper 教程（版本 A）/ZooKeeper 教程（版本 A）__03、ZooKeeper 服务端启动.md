# 03、ZooKeeper 服务端启动
- 来源：https://ddkk.com/zhuanlan/registered/zookeeper/d-1/3.html
- 分类：注册中心
- 分组：ZooKeeper 教程（版本 A）
## 时序图

todo

## 源码

```java
// QuorumPeerMain
public static void main(String[] args) {
   QuorumPeerMain main = new QuorumPeerMain();
   try {
       main.initializeAndRun(args);
   } catch (IllegalArgumentException e) {
       LOG.error("Invalid arguments, exiting abnormally", e);
       LOG.info(USAGE);
       System.err.println(USAGE);
       System.exit(2);
   } catch (ConfigException e) {
       LOG.error("Invalid config, exiting abnormally", e);
       System.err.println("Invalid config, exiting abnormally");
       System.exit(2);
   } catch (DatadirException e) {
       LOG.error("Unable to access datadir, exiting abnormally", e);
       System.err.println("Unable to access datadir, exiting abnormally");
       System.exit(3);
   } catch (AdminServerException e) {
       LOG.error("Unable to start AdminServer, exiting abnormally", e);
       System.err.println("Unable to start AdminServer, exiting abnormally");
       System.exit(4);
   } catch (Exception e) {
       LOG.error("Unexpected exception, exiting abnormally", e);
       System.exit(1);
   }
   LOG.info("Exiting normally");
   System.exit(0);
}
```

```java
// QuorumPeerMain
protected void initializeAndRun(String[] args)
        throws ConfigException, IOException, AdminServerException
{
	// 1. args[0]代表配置文件的路径，读取配置文件，加载到QuorumPeerConfig中
    QuorumPeerConfig config = new QuorumPeerConfig();
    if (args.length == 1) {
        config.parse(args[0]);
    }
    // Start and schedule the the purge task
    // 2. 启动清理任务
    DatadirCleanupManager purgeMgr = new DatadirCleanupManager(config
            .getDataDir(), config.getDataLogDir(), config
            .getSnapRetainCount(), config.getPurgeInterval());
    purgeMgr.start();
	// 3. 判断是否是集群模式
    if (args.length == 1 && config.isDistributed()) {
    	// 集群模式运行
        runFromConfig(config);
    } else {
        LOG.warn("Either no config or no quorum defined in config, running "
                + " in standalone mode");
        // there is only server in the quorum -- run as standalone
        // 当前只有一个节点，切换到standalone模式
        // 单机模式运行
        ZooKeeperServerMain.main(args);
    }
}
```

### 解析配置文件

```java
// QuorumPeerConfig
public void parse(String path) throws ConfigException {
   LOG.info("Reading configuration from: " + path);
   try {
   	   // 根据路径，读取配置文件
       File configFile = (new VerifyingFileFactory.Builder(LOG)
           .warnForRelativePath()
           .failForNonExistingPath()
           .build()).create(path);
       // 将配置文件中的每一行解析成键值对，放到properties中
       Properties cfg = new Properties();
       FileInputStream in = new FileInputStream(configFile);
       try {
           cfg.load(in);
           configFileStr = path;
       } finally {
           in.close();
       }
       // 获取Properties中的键值对，设置到QuorumPeerConfig对应的属性上
       // 后续QuorumPeer的启动会使用到这些属性
       parseProperties(cfg);
   } catch (IOException e) {
       throw new ConfigException("Error processing " + path, e);
   } catch (IllegalArgumentException e) {
       throw new ConfigException("Error processing " + path, e);
   }   
   // 省略
}
```

```java
// QuorumPeerConfig
public void parseProperties(Properties zkProp)
    throws IOException, ConfigException {
     int clientPort = 0;
     int secureClientPort = 0;
     String clientPortAddress = null;
     String secureClientPortAddress = null;
     VerifyingFileFactory vff = new VerifyingFileFactory.Builder(LOG).warnForRelativePath().build();
     // 遍历properties中的键值对，设置到QuorumPeerConfig的属性上
     for (Entry<Object, Object> entry : zkProp.entrySet()) {
         String key = entry.getKey().toString().trim();
         String value = entry.getValue().toString().trim();
         if (key.equals("dataDir")) {
             dataDir = vff.create(value);
         } else if (key.equals("dataLogDir")) {
             dataLogDir = vff.create(value);
         }
         // 省略
      }
	if (dynamicConfigFileStr == null) {
		// 设置QuorumPeerConfig的配置
        setupQuorumPeerConfig(zkProp, true);
        if (isDistributed() && isReconfigEnabled()) {
            // we don't backup static config for standalone mode.
            // we also don't backup if reconfig feature is disabled.
            backupOldConfig();
        }
    }
}
```

下面看下如何设置QuorumPeer

```java
// QuorumPeerConfig
void setupQuorumPeerConfig(Properties prop, boolean configBackwardCompatibilityMode)
            throws IOException, ConfigException {
    // 1. 创建QuorumVerifier，对不同部署模式下参与者和观察者的数量进行校验
    quorumVerifier = parseDynamicConfig(pr op, electionAlg, true, configBackwardCompatibilityMode);
 	// 2. 设置myid
    setupMyId();
    // 3. 设置客户端连接端口
    setupClientPort();
    // 4. 设置当前节点类型
    setupPeerType();
    // 5. 校验配置合法性
    checkValidity();
}
```

### parseDynamicConfig

```java
public static QuorumVerifier parseDynamicConfig(Properties dynamicConfigProp, int eAlg, boolean warnings,
	   boolean configBackwardCompatibilityMode) throws IOException, ConfigException {
    boolean isHierarchical = false;
    for (Entry<Object, Object> entry : dynamicConfigProp.entrySet()) {
        String key = entry.getKey().toString().trim();                    
        if (key.startsWith("group") || key.startsWith("weight")) {
           isHierarchical = true;
        } else if (!configBackwardCompatibilityMode && !key.startsWith("server.") && !key.equals("version")){
           LOG.info(dynamicConfigProp.toString());
           throw new ConfigException("Unrecognised parameter: " + key);                
        }
    }
	// 根据isHierarchical来决定创建的类型，一般情况下isHierarchical都是false，此时会创建QuorumMaj
    QuorumVerifier qv = createQuorumVerifier(dynamicConfigProp, isHierarchical);
    // 参与投票的节点个数
    int numParticipators = qv.getVotingMembers().size();
    // 不参与投票的节点Observer的个数
    int numObservers = qv.getObservingMembers().size();
    // 不同部署模式下进行校验
    if (numParticipators == 0) {
    	// 不允许使用单机模式，并且当前没有participator直接报错
        if (!standaloneEnabled) {
            throw new IllegalArgumentException("standaloneEnabled = false then " +
                    "number of participants should be >0");
        }
        // 没有participator的情况下，不允许有observer
        if (numObservers > 0) {
            throw new IllegalArgumentException("Observers w/o participants is an invalid configuration");
        }
    } else if (numParticipators == 1 && standaloneEnabled) {
    	// 允许单机部署并且participator的个数为1，此时obsserver的个数不能为0
        // HBase currently adds a single server line to the config, for
        // b/w compatibility reasons we need to keep this here. If standaloneEnabled
        // is true, the QuorumPeerMain script will create a standalone server instead
        // of a quorum configuration
        LOG.error("Invalid configuration, only one server specified (ignoring)");
        if (numObservers > 0) {
            throw new IllegalArgumentException("Observers w/o quorum is an invalid configuration");
        }
    } else {
    	// 对participator参与投票的节点的个数进行验证，如果《=2或者格式不是计数，会在日志中进行提醒
        if (warnings) {
            if (numParticipators <= 2) {
                LOG.warn("No server failure will be tolerated. " +
                    "You need at least 3 servers.");
            } else if (numParticipators % 2 == 0) {
                LOG.warn("Non-optimial configuration, consider an odd number of servers.");
            }
        }
        /*
         * If using FLE, then every server requires a separate election
         * port.
         */            
       if (eAlg != 0) {
       	   // 校验参与选举的节点是否都设置了选举端口
           for (QuorumServer s : qv.getVotingMembers().values()) {
               if (s.electionAddr == null)
                   throw new IllegalArgumentException(
                           "Missing election port for server: " + s.id);
           }
       }   
    }
    return qv;
}
```

下面看下如何创建QuorumMaj

QuorumMaj中保存当前中有哪些节点，以及这些节点的id，并标识哪些节点是参与投票的，哪些节点是观察者不参与投票

```java
// QuorumMaj
public QuorumMaj(Properties props) throws ConfigException {
	// 遍历配置项
    for (Entry<Object, Object> entry : props.entrySet()) {
        String key = entry.getKey().toString();
        String value = entry.getValue().toString();
		// 比如server.1 server.2 指定集群中各个服务端节点的地址，各种连接端口的配置
        if (key.startsWith("server.")) {
            int dot = key.indexOf('.');
            // 获取id
            long sid = Long.parseLong(key.substring(dot + 1));
            // QuorumServer封装了服务端节点的ip和各种端口
            QuorumServer qs = new QuorumServer(sid, value);
            // 创建id->节点之间的映射
            allMembers.put(Long.valueOf(sid), qs);
            // 默认情况下是PARTICIPANT
            if (qs.type == LearnerType.PARTICIPANT)
                votingMembers.put(Long.valueOf(sid), qs);
            else {
                observingMembers.put(Long.valueOf(sid), qs);
            }
        } else if (key.equals("version")) {
            version = Long.parseLong(value, 16);
        }
    }
    half = votingMembers.size() / 2;
}
```

### setupMyId

从配置文件中读取当前节点的id

将dataDir下myid文件中的内容作为当前节点的id

```java
// QuorumPeerConfig
private void setupMyId() throws IOException {
    File myIdFile = new File(dataDir, "myid");
    // standalone server doesn't need myid file.
    if (!myIdFile.isFile()) {
        return;
    }
    BufferedReader br = new BufferedReader(new FileReader(myIdFile));
    String myIdString;
    try {
        myIdString = br.readLine();
    } finally {
        br.close();
    }
    try {
        serverId = Long.parseLong(myIdString);
        MDC.put("myid", myIdString);
    } catch (NumberFormatException e) {
        throw new IllegalArgumentException("serverid " + myIdString
                + " is not a number");
    }
}
```

### setupClientPort

设置客户端连接端口

从配置文件的解析结果中根据id获取当前节点的客户端连接端口

```java
private void setupClientPort() throws ConfigException {
    if (serverId == UNSET_SERVERID) {
        return;
    }
    QuorumServer qs = quorumVerifier.getAllMembers().get(serverId);
    if (clientPortAddress != null && qs != null && qs.clientAddr != null) {
        if ((!clientPortAddress.getAddress().isAnyLocalAddress()
                && !clientPortAddress.equals(qs.clientAddr)) ||
                (clientPortAddress.getAddress().isAnyLocalAddress()
                        && clientPortAddress.getPort() != qs.clientAddr.getPort()))
            throw new ConfigException("client address for this server (id = " + serverId +
                    ") in static config file is " + clientPortAddress +
                    " is different from client address found in dynamic file: " + qs.clientAddr);
    }
    if (qs != null && qs.clientAddr != null) clientPortAddress = qs.clientAddr;
}
```

### setupPeerType

设置当前节点的角色

```java
// QuorumPeerConfig
private void setupPeerType() {
    // Warn about inconsistent peer type
    // 判断当前节点是否是observer
    LearnerType roleByServersList = quorumVerifier.getObservingMembers().containsKey(serverId) ? LearnerType.OBSERVER
            : LearnerType.PARTICIPANT;
    if (roleByServersList != peerType) {
        LOG.warn("Peer type from servers list (" + roleByServersList
                + ") doesn't match peerType (" + peerType
                + "). Defaulting to servers list.");
        peerType = roleByServersList;
    }
}
```

### checkValidity

```java
// QuorumPeerConfig
public void checkValidity() throws IOException, ConfigException{
	// 当前是分布式部署
	// 对一些配置进行校验
	if (isDistributed()) {
       if (initLimit == 0) {
           throw new IllegalArgumentException("initLimit is not set");
       }
       if (syncLimit == 0) {
           throw new IllegalArgumentException("syncLimit is not set");
       }
       if (serverId == UNSET_SERVERID) {
           throw new IllegalArgumentException("myid file is missing");
       }
  }
}
```

### 启动清理任务

todo

### 启动QuorumPeer

```java
// QuorumPeerMain
public void runFromConfig(QuorumPeerConfig config)
            throws IOException, AdminServerException
    {
      try {
          ManagedUtil.registerLog4jMBeans();
      } catch (JMException e) {
          LOG.warn("Unable to register log4j JMX control", e);
      }
      LOG.info("Starting quorum peer");
      // 首先读取配置，将配置中的信息设置到QuorumPeer中
      // ServerCnxnFactory用来管理和客户端的连接
      try {
          ServerCnxnFactory cnxnFactory = null;
          ServerCnxnFactory secureCnxnFactory = null;
		  // 从配置中取出客户端的连接地址和最大客户端连接数来创建cnxnFactory
          if (config.getClientPortAddress() != null) {
              cnxnFactory = ServerCnxnFactory.createFactory();
              cnxnFactory.configure(config.getClientPortAddress(),
                      config.getMaxClientCnxns(),
                      false);
          }
		  // 如果配置使用安全连接，会从配置中取出客户端安全连接地址和最大连接数来创建secureCnxnFactory
          if (config.getSecureClientPortAddress() != null) {
              secureCnxnFactory = ServerCnxnFactory.createFactory();
              secureCnxnFactory.configure(config.getSecureClientPortAddress(),
                      config.getMaxClientCnxns(),
                      true);
          }
          quorumPeer = getQuorumPeer();
          // 使用配置中的dataLogDir和dataDir来创建事务快照日志
          quorumPeer.setTxnFactory(new FileTxnSnapLog(
                      config.getDataLogDir(),
                      config.getDataDir()));
          quorumPeer.enableLocalSessions(config.areLocalSessionsEnabled());
          quorumPeer.enableLocalSessionsUpgrading(
              config.isLocalSessionsUpgradingEnabled());
          //quorumPeer.setQuorumPeers(config.getAllMembers());
          quorumPeer.setElectionType(config.getElectionAlg());
          quorumPeer.setMyid(config.getServerId());
          quorumPeer.setTickTime(config.getTickTime());
          quorumPeer.setMinSessionTimeout(config.getMinSessionTimeout());
          quorumPeer.setMaxSessionTimeout(config.getMaxSessionTimeout());
          quorumPeer.setInitLimit(config.getInitLimit());
          quorumPeer.setSyncLimit(config.getSyncLimit());
          quorumPeer.setConfigFileName(config.getConfigFilename());
          // 创建数据库
          quorumPeer.setZKDatabase(new ZKDatabase(quorumPeer.getTxnFactory()));
          quorumPeer.setQuorumVerifier(config.getQuorumVerifier(), false);
          if (config.getLastSeenQuorumVerifier()!=null) {
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
          // 启动QuorumPeer
          quorumPeer.start();
          quorumPeer.join();
      } catch (InterruptedException e) {
          // warn, but generally this is ok
          LOG.warn("Quorum Peer interrupted", e);
      }
    }
```

```java
public synchronized void start() {
 if (!getView().containsKey(myid)) {
        throw new RuntimeException("My id " + myid + " not in the peer list");
     }
    // 1. 加载数据库
    loadDataBase();
    // 2. 启动客户端连接管理工厂
    startServerCnxnFactory();
    try {
    	// 3. 启动adminServer
    	// 可以查看当前服务端节点的一些信息
        adminServer.start();
    } catch (AdminServerException e) {
        LOG.warn("Problem starting AdminServer", e);
        System.out.println(e);
    }
    // 4. 开始leader选举
    startLeaderElection();
    // 5. 开始主循环，不同的角色执行不同的操作
    super.start();
}
```

> 版权声明：「DDKK.COM 弟弟快看，程序员编程资料站」本站文章，版权归原作者所有
