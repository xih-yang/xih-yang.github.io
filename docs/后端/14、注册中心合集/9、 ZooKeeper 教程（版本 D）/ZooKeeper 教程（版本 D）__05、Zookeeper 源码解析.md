# 05、Zookeeper 源码解析
- 来源：https://ddkk.com/zhuanlan/registered/zookeeper/d-4/5.html
- 分类：注册中心
- 分组：ZooKeeper 教程（版本 D）
cd../bin

vimzkServer.sh

ZOOMAIN = "-Dcom.sun.management.jmxremote -Dcom.sun.management.jmxremote.local.only=$JMXLOCALONLY

org.apache.zookeeper.server.quorum.QuorumPeerMain"

启动类的入口方法

QuorumPeerMain.main

```java
public static void main(String[] args) {
    QuorumPeerMain main = new QuorumPeerMain();
    try {
        main.initializeAndRun(args);
    } catch (IllegalArgumentException e) {
        LOG.error("Invalid arguments, exiting abnormally", e);
        LOG.info(USAGE);
        System.err.println(USAGE);
        System.exit(ExitCode.INVALID_INVOCATION.getValue());
    } catch (ConfigException e) {
        LOG.error("Invalid config, exiting abnormally", e);
        System.err.println("Invalid config, exiting abnormally");
        System.exit(ExitCode.INVALID_INVOCATION.getValue());
    } catch (DatadirException e) {
        LOG.error("Unable to access datadir, exiting abnormally", e);
        System.err.println("Unable to access datadir, exiting abnormally");
        System.exit(ExitCode.UNABLE_TO_ACCESS_DATADIR.getValue());
    } catch (AdminServerException e) {
        LOG.error("Unable to start AdminServer, exiting abnormally", e);
        System.err.println("Unable to start AdminServer, exiting abnormally");
        System.exit(ExitCode.ERROR_STARTING_ADMIN_SERVER.getValue());
    } catch (Exception e) {
        LOG.error("Unexpected exception, exiting abnormally", e);
        System.exit(ExitCode.UNEXPECTED_ERROR.getValue());
    }
    LOG.info("Exiting normally");
    System.exit(ExitCode.EXECUTION_FINISHED.getValue());
}
```

QuorumPeerMain.initializeAndRun

```java
protected void initializeAndRun(String[] args)
    throws ConfigException, IOException, AdminServerException
{
    //保存zoo.cfg配置文件中解析后的所有参数
    QuorumPeerConfig config = new QuorumPeerConfig();
    if (args.length == 1) {
        config.parse(args[0]);
    }
    // Start and schedule the the purge task
    DatadirCleanupManager purgeMgr = new DatadirCleanupManager(config
            .getDataDir(), config.getDataLogDir(), config
            .getSnapRetainCount(), config.getPurgeInterval());
    purgeMgr.start();
    if (args.length == 1 && config.isDistributed()) {
        runFromConfig(config);
    } else {
        LOG.warn("Either no config or no quorum defined in config, running "
                + " in standalone mode");
        // there is only server in the quorum -- run as standalone
        ZooKeeperServerMain.main(args);
    }
}
```

QuorumPeerMain.runFromConfig

```java
public void runFromConfig(QuorumPeerConfig config)
        throws IOException, AdminServerException
{
  try {
      ManagedUtil.registerLog4jMBeans();
  } catch (JMException e) {
      LOG.warn("Unable to register log4j JMX control", e);
  }
  LOG.info("Starting quorum peer");
  MetricsProvider metricsProvider;
  try {
    metricsProvider = MetricsProviderBootstrap
                  .startMetricsProvider(config.getMetricsProviderClassName(),
                                        config.getMetricsProviderConfiguration());
  } catch (MetricsProviderLifeCycleException error) {
    throw new IOException("Cannot boot MetricsProvider " + config.getMetricsProviderClassName(),
                  error);
  }
  try {
      ServerMetrics.metricsProviderInitialized(metricsProvider);
      ServerCnxnFactory cnxnFactory = null;
      ServerCnxnFactory secureCnxnFactory = null;
      if (config.getClientPortAddress() != null) {
          cnxnFactory = ServerCnxnFactory.createFactory();
          cnxnFactory.configure(config.getClientPortAddress(),
                  config.getMaxClientCnxns(),
                  config.getClientPortListenBacklog(), false);
      }
      if (config.getSecureClientPortAddress() != null) {
          secureCnxnFactory = ServerCnxnFactory.createFactory();
          secureCnxnFactory.configure(config.getSecureClientPortAddress(),
                  config.getMaxClientCnxns(),
                  config.getClientPortListenBacklog(), true);
      }
      quorumPeer = getQuorumPeer();
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
      quorumPeer.setConnectToLearnerMasterLimit(config.getConnectToLearnerMasterLimit());
      quorumPeer.setObserverMasterPort(config.getObserverMasterPort());
      quorumPeer.setConfigFileName(config.getConfigFilename());
      quorumPeer.setClientPortListenBacklog(config.getClientPortListenBacklog());
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
      if(config.jvmPauseMonitorToRun) {
          quorumPeer.setJvmPauseMonitor(new JvmPauseMonitor(config));
      }
      quorumPeer.start();
      quorumPeer.join();
  } catch (InterruptedException e) {
      // warn, but generally this is ok
      LOG.warn("Quorum Peer interrupted", e);
  } finally {
      if (metricsProvider != null) {
          try {
              metricsProvider.stop();
          } catch (Throwable error) {
              LOG.warn("Error while stopping metrics", error);
          }
      }
  }
}
```

```java
 QuorumPeer.start
```

```java
@Override
public synchronized void start() {
    if (!getView().containsKey(myid)) {
        throw new RuntimeException("My id " + myid + " not in the peer list");
     }
     //加载数据
    loadDataBase();
    //通信，暴漏2181端口号
    startServerCnxnFactory();
    try {
        adminServer.start();
    } catch (AdminServerException e) {
        LOG.warn("Problem starting AdminServer", e);
        System.out.println(e);
    }
    //leader选举 -》启动一个投票的监听器，初始化一个选举算法FastLeader
    startLeaderElection();
    //jvm监听
    startJvmPauseMonitor();
    //QuorumPeer.run
    super.start();
}
```

`QuorumPeer.run`

```java
@Override
public void run() {
    updateThreadName();
    LOG.debug("Starting quorum peer");
    try {
        jmxQuorumBean = new QuorumBean(this);
        MBeanRegistry.getInstance().register(jmxQuorumBean, null);
        for(QuorumServer s: getView().values()){
            ZKMBeanInfo p;
            if (getId() == s.id) {
                p = jmxLocalPeerBean = new LocalPeerBean(this);
                try {
                    MBeanRegistry.getInstance().register(p, jmxQuorumBean);
                } catch (Exception e) {
                    LOG.warn("Failed to register with JMX", e);
                    jmxLocalPeerBean = null;
                }
            } else {
                RemotePeerBean rBean = new RemotePeerBean(this, s);
                try {
                    MBeanRegistry.getInstance().register(rBean, jmxQuorumBean);
                    jmxRemotePeerBean.put(s.id, rBean);
                } catch (Exception e) {
                    LOG.warn("Failed to register with JMX", e);
                }
            }
        }
    } catch (Exception e) {
        LOG.warn("Failed to register with JMX", e);
        jmxQuorumBean = null;
    }
    try {
        /*
         * Main loop
         */
        while (running) {
            switch (getPeerState()) {
            case LOOKING:
                LOG.info("LOOKING");
                ServerMetrics.getMetrics().LOOKING_COUNT.add(1);
                if (Boolean.getBoolean("readonlymode.enabled")) {
                    LOG.info("Attempting to start ReadOnlyZooKeeperServer");
                    // Create read-only server but don't start it immediately
                    final ReadOnlyZooKeeperServer roZk =
                        new ReadOnlyZooKeeperServer(logFactory, this, this.zkDb);
                    // Instead of starting roZk immediately, wait some grace
                    // period before we decide we're partitioned.
                    //
                    // Thread is used here because otherwise it would require
                    // changes in each of election strategy classes which is
                    // unnecessary code coupling.
                    Thread roZkMgr = new Thread() {
                        public void run() {
                            try {
                                // lower-bound grace period to 2 secs
                                sleep(Math.max(2000, tickTime));
                                if (ServerState.LOOKING.equals(getPeerState())) {
                                    roZk.startup();
                                }
                            } catch (InterruptedException e) {
                                LOG.info("Interrupted while attempting to start ReadOnlyZooKeeperServer, not started");
                            } catch (Exception e) {
                                LOG.error("FAILED to start ReadOnlyZooKeeperServer", e);
                            }
                        }
                    };
                    try {
                        roZkMgr.start();
                        reconfigFlagClear();
                        if (shuttingDownLE) {
                            shuttingDownLE = false;
                            startLeaderElection();
                        }
                        setCurrentVote(makeLEStrategy().lookForLeader());
                    } catch (Exception e) {
                        LOG.warn("Unexpected exception", e);
                        setPeerState(ServerState.LOOKING);
                    } finally {
                        // If the thread is in the the grace period, interrupt
                        // to come out of waiting.
                        roZkMgr.interrupt();
                        roZk.shutdown();
                    }
                } else {
                    try {
                       reconfigFlagClear();
                        if (shuttingDownLE) {
                           shuttingDownLE = false;
                           startLeaderElection();
                           }
                        setCurrentVote(makeLEStrategy().lookForLeader());
                    } catch (Exception e) {
                        LOG.warn("Unexpected exception", e);
                        setPeerState(ServerState.LOOKING);
                    }                        
                }
                break;
            case OBSERVING:
                try {
                    LOG.info("OBSERVING");
                    setObserver(makeObserver(logFactory));
                    observer.observeLeader();
                } catch (Exception e) {
                    LOG.warn("Unexpected exception",e );
                } finally {
                    observer.shutdown();
                    setObserver(null);
                    updateServerState();
                    // Add delay jitter before we switch to LOOKING
                    // state to reduce the load of ObserverMaster
                    if (isRunning()) {
                        Observer.waitForObserverElectionDelay();
                    }
                }
                break;
            case FOLLOWING:
                try {
                   LOG.info("FOLLOWING");
                    setFollower(makeFollower(logFactory));
                    follower.followLeader();
                } catch (Exception e) {
                   LOG.warn("Unexpected exception",e);
                } finally {
                   follower.shutdown();
                   setFollower(null);
                   updateServerState();
                }
                break;
            case LEADING:
                LOG.info("LEADING");
                try {
                    setLeader(makeLeader(logFactory));
                    leader.lead();
                    setLeader(null);
                } catch (Exception e) {
                    LOG.warn("Unexpected exception",e);
                } finally {
                    if (leader != null) {
                        leader.shutdown("Forcing shutdown");
                        setLeader(null);
                    }
                    updateServerState();
                }
                break;
            }
        }
    } finally {
        LOG.warn("QuorumPeer main thread exited");
        MBeanRegistry instance = MBeanRegistry.getInstance();
        instance.unregister(jmxQuorumBean);
        instance.unregister(jmxLocalPeerBean);
        for (RemotePeerBean remotePeerBean : jmxRemotePeerBean.values()) {
            instance.unregister(remotePeerBean);
        }
        jmxQuorumBean = null;
        jmxLocalPeerBean = null;
        jmxRemotePeerBean = null;
    }
}
```

```java
QuorumPeer.createElectionAlgorithm
```

```java
protected Election createElectionAlgorithm(int electionAlgorithm){
    Election le=null;
    //TODO: use a factory rather than a switch
    switch (electionAlgorithm) {
    case 1:
        le = new AuthFastLeaderElection(this);
        break;
    case 2:
        le = new AuthFastLeaderElection(this, true);
        break;
    case 3:
        QuorumCnxManager qcm = createCnxnManager();
        QuorumCnxManager oldQcm = qcmRef.getAndSet(qcm);
        if (oldQcm != null) {
            LOG.warn("Clobbering already-set QuorumCnxManager (restarting leader election?)");
            oldQcm.halt();
        }
        QuorumCnxManager.Listener listener = qcm.listener;
        if(listener != null){
            listener.start();
            FastLeaderElection fle = new FastLeaderElection(this, qcm);
            fle.start();
            le = fle;
        } else {
            LOG.error("Null listener when initializing cnx manager");
        }
        break;
    default:
        assert false;
    }
    return le;
}
```

```java
setCurrentVote(makeLEStrategy().lookForLeader());
```

FastLearderElection.lookForLearder

```java
public Vote lookForLeader() throws InterruptedException {
    try {
        self.jmxLeaderElectionBean = new LeaderElectionBean();
        MBeanRegistry.getInstance().register(
                self.jmxLeaderElectionBean, self.jmxLocalPeerBean);
    } catch (Exception e) {
        LOG.warn("Failed to register with JMX", e);
        self.jmxLeaderElectionBean = null;
    }
    self.start_fle = Time.currentElapsedTime();
    try {
        //接收到票据的集合
        Map<Long, Vote> recvset = new HashMap<Long, Vote>();
        Map<Long, Vote> outofelection = new HashMap<Long, Vote>();
        int notTimeout = minNotificationInterval;
        synchronized(this){
            //逻辑时钟自增
            logicalclock.incrementAndGet();
            //更新自己的proposal
            updateProposal(getInitId(), getInitLastLoggedZxid(), getPeerEpoch());
        }
        LOG.info("New election. My id =  " + self.getId() +
                ", proposed zxid=0x" + Long.toHexString(proposedZxid));
        //广播自己的票据
        sendNotifications();
        SyncedLearnerTracker voteSet;
        /*
         * Loop in which we exchange notifications until we find a leader
         */
        //接收到了票据
        while ((self.getPeerState() == ServerState.LOOKING) &&
                (!stop)){
            /*
             * Remove next notification from queue, times out after 2 times
             * the termination time
             */
            //接收到从其他节点发来的票据
            Notification n = recvqueue.poll(notTimeout,
                    TimeUnit.MILLISECONDS);
            /*
             * Sends more notifications if haven't received enough.
             * Otherwise processes new notification.
             */
            if(n == null){
                if(manager.haveDelivered()){
                    sendNotifications();
                } else {
                    manager.connectAll();
                }
                /*
                 * Exponential backoff
                 */
                int tmpTimeOut = notTimeout*2;
                notTimeout = (tmpTimeOut < maxNotificationInterval?
                        tmpTimeOut : maxNotificationInterval);
                LOG.info("Notification time out: " + notTimeout);
            }
            //验证票据是否有效
            else if (validVoter(n.sid) && validVoter(n.leader)) {
                /*
                 * Only proceed if the vote comes from a replica in the current or next
                 * voting view for a replica in the current or next voting view.
                 */
                switch (n.state) {
                case LOOKING:
                    if (getInitLastLoggedZxid() == -1) {
                        LOG.debug("Ignoring notification as our zxid is -1");
                        break;
                    }
                    if (n.zxid == -1) {
                        LOG.debug("Ignoring notification from member with -1 zxid {}", n.sid);
                        break;
                    }
                    // If notification > current, replace and send messages out
                    //收到票据的时钟是否大于自己，大于则更改自己的票据
                    if (n.electionEpoch > logicalclock.get()) {
                        logicalclock.set(n.electionEpoch);
                        recvset.clear();
                        if(totalOrderPredicate(n.leader, n.zxid, n.peerEpoch,
                                getInitId(), getInitLastLoggedZxid(), getPeerEpoch())) {
                            updateProposal(n.leader, n.zxid, n.peerEpoch);
                        } else {
                            updateProposal(getInitId(),
                                    getInitLastLoggedZxid(),
                                    getPeerEpoch());
                        }
                        sendNotifications();
                    } else if (n.electionEpoch < logicalclock.get()) {
                        if(LOG.isDebugEnabled()){
                            LOG.debug("Notification election epoch is smaller than logicalclock. n.electionEpoch = 0x"
                                    + Long.toHexString(n.electionEpoch)
                                    + ", logicalclock=0x" + Long.toHexString(logicalclock.get()));
                        }
                        break;
                    } else if (totalOrderPredicate(n.leader, n.zxid, n.peerEpoch,
                            proposedLeader, proposedZxid, proposedEpoch)) {
                        updateProposal(n.leader, n.zxid, n.peerEpoch);
                        sendNotifications();
                    }
                    if(LOG.isDebugEnabled()){
                        LOG.debug("Adding vote: from=" + n.sid +
                                ", proposed leader=" + n.leader +
                                ", proposed zxid=0x" + Long.toHexString(n.zxid) +
                                ", proposed election epoch=0x" + Long.toHexString(n.electionEpoch));
                    }
                    // don't care about the version if it's in LOOKING state
                    recvset.put(n.sid, new Vote(n.leader, n.zxid, n.electionEpoch, n.peerEpoch));
                    voteSet = getVoteTracker(
                            recvset, new Vote(proposedLeader, proposedZxid,
                                    logicalclock.get(), proposedEpoch));
                    if (voteSet.hasAllQuorums()) {
                        // Verify if there is any change in the proposed leader
                        while((n = recvqueue.poll(finalizeWait,
                                TimeUnit.MILLISECONDS)) != null){
                            if(totalOrderPredicate(n.leader, n.zxid, n.peerEpoch,
                                    proposedLeader, proposedZxid, proposedEpoch)){
                                recvqueue.put(n);
                                break;
                            }
                        }
                        /*
                         * This predicate is true once we don't read any new
                         * relevant message from the reception queue
                         */
                        if (n == null) {
                            setPeerState(proposedLeader, voteSet);
                            Vote endVote = new Vote(proposedLeader,
                                    proposedZxid, logicalclock.get(), 
                                    proposedEpoch);
                            leaveInstance(endVote);
                            return endVote;
                        }
                    }
                    break;
                case OBSERVING:
                    LOG.debug("Notification from observer: {}", n.sid);
                    break;
                case FOLLOWING:
                case LEADING:
                    /*
                     * Consider all notifications from the same epoch
                     * together.
                     */
                    if(n.electionEpoch == logicalclock.get()){
                        recvset.put(n.sid, new Vote(n.leader, n.zxid, n.electionEpoch, n.peerEpoch));
                        voteSet = getVoteTracker(recvset, new Vote(n.version, 
                                  n.leader, n.zxid, n.electionEpoch, n.peerEpoch, n.state));
                        if (voteSet.hasAllQuorums() && 
                                checkLeader(outofelection, n.leader, n.electionEpoch)) {
                            setPeerState(n.leader, voteSet);
                            Vote endVote = new Vote(n.leader, 
                                    n.zxid, n.electionEpoch, n.peerEpoch);
                            leaveInstance(endVote);
                            return endVote;
                        }
                    }
                    /*
                     * Before joining an established ensemble, verify that
                     * a majority are following the same leader.
                     */
                    outofelection.put(n.sid, new Vote(n.version, n.leader,
                            n.zxid, n.electionEpoch, n.peerEpoch, n.state));
                    voteSet = getVoteTracker(outofelection, new Vote(n.version, 
                            n.leader, n.zxid, n.electionEpoch, n.peerEpoch, n.state));
                    if (voteSet.hasAllQuorums() &&
                            checkLeader(outofelection, n.leader, n.electionEpoch)) {
                        synchronized(this){
                            logicalclock.set(n.electionEpoch);
                            setPeerState(n.leader, voteSet);
                        }
                        Vote endVote = new Vote(n.leader, n.zxid, 
                                n.electionEpoch, n.peerEpoch);
                        leaveInstance(endVote);
                        return endVote;
                    }
                    break;
                default:
                    LOG.warn("Notification state unrecoginized: " + n.state
                          + " (n.state), " + n.sid + " (n.sid)");
                    break;
                }
            } else {
                if (!validVoter(n.leader)) {
                    LOG.warn("Ignoring notification for non-cluster member sid {} from sid {}", n.leader, n.sid);
                }
                if (!validVoter(n.sid)) {
                    LOG.warn("Ignoring notification for sid {} from non-quorum member sid {}", n.leader, n.sid);
                }
            }
        }
        return null;
    } finally {
        try {
            if(self.jmxLeaderElectionBean != null){
                MBeanRegistry.getInstance().unregister(
                        self.jmxLeaderElectionBean);
            }
        } catch (Exception e) {
            LOG.warn("Failed to unregister with JMX", e);
        }
        self.jmxLeaderElectionBean = null;
        LOG.debug("Number of connection processing threads: {}",
                manager.getConnectionThreadCount());
    }
}
```

```java
QuorumMaj.containsQuorum
```

```java
public boolean containsQuorum(Set<Long> ackSet) {
    //是否大于一半
    return (ackSet.size() > half);
}
```

FastLearderElection.totalOrderPredicate

```java
protected boolean totalOrderPredicate(long newId, long newZxid, long newEpoch, long curId, long curZxid, long curEpoch) {
    if (LOG.isDebugEnabled()) {
        LOG.debug("id: " + newId + ", proposed id: " + curId + ", zxid: 0x"
            + Long.toHexString(newZxid) + ", proposed zxid: 0x"
            + Long.toHexString(curZxid));
    }
    if(self.getQuorumVerifier().getWeight(newId) == 0){
        return false;
    }
    /*
     * We return true if one of the following three cases hold:
     * 1- New epoch is higher
     * 2- New epoch is the same as current epoch, but new zxid is higher
     * 3- New epoch is the same as current epoch, new zxid is the same
     *  as current zxid, but server id is higher.
     */
    return ((newEpoch > curEpoch) ||
            ((newEpoch == curEpoch) &&
            ((newZxid > curZxid) || ((newZxid == curZxid) && (newId > curId)))));
}
```

> 版权声明：「DDKK.COM 弟弟快看，程序员编程资料站」本站文章，版权归原作者所有
