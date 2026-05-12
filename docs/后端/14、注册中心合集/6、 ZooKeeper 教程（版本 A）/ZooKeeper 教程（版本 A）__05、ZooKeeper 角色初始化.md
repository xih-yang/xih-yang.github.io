# 05、ZooKeeper 角色初始化
- 来源：https://ddkk.com/zhuanlan/registered/zookeeper/d-1/5.html
- 分类：注册中心
- 分组：ZooKeeper 教程（版本 A）
zookeeper有如下三个角色：

**1、** Leader；

**2、** Follower；

**3、** Observer；

在QuorumPeer的run方法中会根据当前节点的状态执行不同的操作

```java
// QuorumPeer
public void run() {
  // 省略
  try {
    /*
             * Main loop
             */
    while (running) {
      switch (getPeerState()) {
        case LOOKING:
          LOG.info("LOOKING");
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
      start_fle = Time.currentElapsedTime();
    }
  } finally {
		// 省略
  }
}
```

下面分别看下不同角色都做了哪些操作

## Leader

```java
case LEADING:
  LOG.info("LEADING");
  try {
    // 1. 创建Leader对象并赋值到leader属性上
    setLeader(makeLeader(logFactory));
    // 2. 运行leader
    leader.lead();
    setLeader(null);
  } catch (Exception e) {
    LOG.warn("Unexpected exception",e);
  } finally {
    // 出现异常
    // 3. 关闭leader
    if (leader != null) {
      leader.shutdown("Forcing shutdown");
      setLeader(null);
    }
    // 4. 更新服务器状态为looking，重新开始选举
    updateServerState();
  }
  break;
}
```

### 创建

```java
protected Leader makeLeader(FileTxnSnapLog logFactory) throws IOException, X509Exception {
  return new Leader(this, new LeaderZooKeeperServer(logFactory, this, this.zkDb));
}
```

```java
// Leader
Leader(QuorumPeer self,LeaderZooKeeperServer zk) throws IOException {
  this.self = self;
  this.proposalStats = new BufferStats();
  // 监听本地用来和其他节点交换数据的端口，等待其他节点连接
  // localhost:28888:3888 中用来和其他节点进行交换的端口就是28888
  try {
    if (self.shouldUsePortUnification() || self.isSslQuorum()) {
      boolean allowInsecureConnection = self.shouldUsePortUnification();
      if (self.getQuorumListenOnAllIPs()) {
        ss = new UnifiedServerSocket(self.getX509Util(), allowInsecureConnection, self.getQuorumAddress().getPort());
      } else {
        ss = new UnifiedServerSocket(self.getX509Util(), allowInsecureConnection);
      }
    } else {
      if (self.getQuorumListenOnAllIPs()) {
        ss = new ServerSocket(self.getQuorumAddress().getPort());
      } else {
        ss = new ServerSocket();
      }
    }
    ss.setReuseAddress(true);
    if (!self.getQuorumListenOnAllIPs()) {
      ss.bind(self.getQuorumAddress());
    }
  } catch (BindException e) {
    if (self.getQuorumListenOnAllIPs()) {
      LOG.error("Couldn't bind to port " + self.getQuorumAddress().getPort(), e);
    } else {
      LOG.error("Couldn't bind to " + self.getQuorumAddress(), e);
    }
    throw e;
  }
  this.zk = zk;
  this.learnerSnapshotThrottler = createLearnerSnapshotThrottler(
    maxConcurrentSnapshots, maxConcurrentSnapshotTimeout);
}
```

### 运行

首先整体看下leader的运行逻辑

```java
void lead() throws IOException, InterruptedException {
  // 1. 计算选举耗时并打印
  self.end_fle = Time.currentElapsedTime();
  long electionTimeTaken = self.end_fle - self.start_fle;
  self.setElectionTimeTaken(electionTimeTaken);
  LOG.info("LEADING - LEADER ELECTION TOOK - {} {}", electionTimeTaken,
           QuorumPeer.FLE_TIME_UNIT);
  self.start_fle = 0;
  self.end_fle = 0;
  zk.registerJMX(new LeaderBean(this, zk), self.jmxLocalPeerBean);
  try {
    self.tick.set(0);
    // 2. 加载数据
    zk.loadData();
    leaderStateSummary = new StateSummary(self.getCurrentEpoch(), zk.getLastProcessedZxid());
    // Start thread that waits for connection requests from
    // new followers.
    // 3. 开启接收线程，等待其他follower连接
    cnxAcceptor = new LearnerCnxAcceptor();
    cnxAcceptor.start();
    // 4. 等待过半follower连接，生成新的epoch
    long epoch = getEpochToPropose(self.getId(), self.getAcceptedEpoch());
    // 5. 设置当前zxid
    zk.setZxid(ZxidUtils.makeZxid(epoch, 0));
    synchronized(this){
      lastProposed = zk.getZxid();
    }
    newLeaderProposal.packet = new QuorumPacket(NEWLEADER, zk.getZxid(),
                                                null, null);
    if ((newLeaderProposal.packet.getZxid() & 0xffffffffL) != 0) {
      LOG.info("NEWLEADER proposal has Zxid of "
               + Long.toHexString(newLeaderProposal.packet.getZxid()));
    }
    QuorumVerifier lastSeenQV = self.getLastSeenQuorumVerifier();
    QuorumVerifier curQV = self.getQuorumVerifier();
    if (curQV.getVersion() == 0 && curQV.getVersion() == lastSeenQV.getVersion()) {
      // This was added in ZOOKEEPER-1783. The initial config has version 0 (not explicitly
      // specified by the user; the lack of version in a config file is interpreted as version=0). 
      // As soon as a config is established we would like to increase its version so that it
      // takes presedence over other initial configs that were not established (such as a config
      // of a server trying to join the ensemble, which may be a partial view of the system, not the full config). 
      // We chose to set the new version to the one of the NEWLEADER message. However, before we can do that
      // there must be agreement on the new version, so we can only change the version when sending/receiving UPTODATE,
      // not when sending/receiving NEWLEADER. In other words, we can't change curQV here since its the committed quorum verifier, 
      // and there's still no agreement on the new version that we'd like to use. Instead, we use 
      // lastSeenQuorumVerifier which is being sent with NEWLEADER message
      // so its a good way to let followers know about the new version. (The original reason for sending 
      // lastSeenQuorumVerifier with NEWLEADER is so that the leader completes any potentially uncommitted reconfigs
      // that it finds before starting to propose operations. Here we're reusing the same code path for 
      // reaching consensus on the new version number.)
      // It is important that this is done before the leader executes waitForEpochAck,
      // so before LearnerHandlers return from their waitForEpochAck
      // hence before they construct the NEWLEADER message containing
      // the last-seen-quorumverifier of the leader, which we change below
      try {
        QuorumVerifier newQV = self.configFromString(curQV.toString());
        newQV.setVersion(zk.getZxid());
        self.setLastSeenQuorumVerifier(newQV, true);    
      } catch (Exception e) {
        throw new IOException(e);
      }
    }
    newLeaderProposal.addQuorumVerifier(self.getQuorumVerifier());
    if (self.getLastSeenQuorumVerifier().getVersion() > self.getQuorumVerifier().getVersion()){
      newLeaderProposal.addQuorumVerifier(self.getLastSeenQuorumVerifier());
    }
    // We have to get at least a majority of servers in sync with
    // us. We do this by waiting for the NEWLEADER packet to get
    // acknowledged
		// 6. 等待过半的投票参与者响应了LEADERINFO信息，然后设置epoch
    waitForEpochAck(self.getId(), leaderStateSummary);
    self.setCurrentEpoch(epoch);    
    try {
			// 7. 等待过半的投票参与者响应了NEWLEADER
      waitForNewLeaderAck(self.getId(), zk.getZxid());
    } catch (InterruptedException e) {
      shutdown("Waiting for a quorum of followers, only synced with sids: [ "
               + newLeaderProposal.ackSetsToString() + " ]");
      HashSet<Long> followerSet = new HashSet<Long>();
      for(LearnerHandler f : getLearners()) {
        if (self.getQuorumVerifier().getVotingMembers().containsKey(f.getSid())){
          followerSet.add(f.getSid());
        }
      }    
      boolean initTicksShouldBeIncreased = true;
      for (Proposal.QuorumVerifierAcksetPair qvAckset:newLeaderProposal.qvAcksetPairs) {
        if (!qvAckset.getQuorumVerifier().containsQuorum(followerSet)) {
          initTicksShouldBeIncreased = false;
          break;
        }
      }                  
      if (initTicksShouldBeIncreased) {
        LOG.warn("Enough followers present. "+
                 "Perhaps the initTicks need to be increased.");
      }
      return;
    }
    // 8. 启动zk服务器
    startZkServer();
    /**
             * WARNING: do not use this for anything other than QA testing
             * on a real cluster. Specifically to enable verification that quorum
             * can handle the lower 32bit roll-over issue identified in
             * ZOOKEEPER-1277. Without this option it would take a very long
             * time (on order of a month say) to see the 4 billion writes
             * necessary to cause the roll-over to occur.
             *
             * This field allows you to override the zxid of the server. Typically
             * you'll want to set it to something like 0xfffffff0 and then
             * start the quorum, run some operations and see the re-election.
             */
    String initialZxid = System.getProperty("zookeeper.testingonly.initialZxid");
    if (initialZxid != null) {
      long zxid = Long.parseLong(initialZxid);
      zk.setZxid((zk.getZxid() & 0xffffffff00000000L) | zxid);
    }
    if (!System.getProperty("zookeeper.leaderServes", "yes").equals("no")) {
      self.setZooKeeperServer(zk);
    }
    self.adminServer.setZooKeeperServer(zk);
    // Everything is a go, simply start counting the ticks
    // WARNING: I couldn't find any wait statement on a synchronized
    // block that would be notified by this notifyAll() call, so
    // I commented it out
    //synchronized (this) {
    //    notifyAll();
    //}
    // We ping twice a tick, so we only update the tick every other
    // iteration
    boolean tickSkip = true;
    // If not null then shutdown this leader
    String shutdownMessage = null;
	  // 9. 向其他节点发送心跳
    // 1个tickTime中会发送两次ping
    // 每两次会判断是否有过半的节点仍然和leader保持心跳，如果没有过半，会关闭当前leader
    while (true) {
      synchronized (this) {
        long start = Time.currentElapsedTime();
        long cur = start;
        long end = start + self.tickTime / 2;
        while (cur < end) {
          wait(end - cur);
          cur = Time.currentElapsedTime();
        }
        if (!tickSkip) {
          self.tick.incrementAndGet();
        }
        // We use an instance of SyncedLearnerTracker to
        // track synced learners to make sure we still have a
        // quorum of current (and potentially next pending) view.
        SyncedLearnerTracker syncedAckSet = new SyncedLearnerTracker();
        syncedAckSet.addQuorumVerifier(self.getQuorumVerifier());
        if (self.getLastSeenQuorumVerifier() != null
            && self.getLastSeenQuorumVerifier().getVersion() > self
            .getQuorumVerifier().getVersion()) {
          syncedAckSet.addQuorumVerifier(self
                                         .getLastSeenQuorumVerifier());
        }
        syncedAckSet.addAck(self.getId());
        for (LearnerHandler f : getLearners()) {
          if (f.synced()) {
            syncedAckSet.addAck(f.getSid());
          }
        }
        // check leader running status
        if (!this.isRunning()) {
          // set shutdown flag
          shutdownMessage = "Unexpected internal error";
          break;
        }
        if (!tickSkip && !syncedAckSet.hasAllQuorums()) {
          // Lost quorum of last committed and/or last proposed
          // config, set shutdown flag
          shutdownMessage = "Not sufficient followers synced, only synced with sids: [ "
            + syncedAckSet.ackSetsToString() + " ]";
          break;
        }
        tickSkip = !tickSkip;
      }
      for (LearnerHandler f : getLearners()) {
        f.ping();
      }
    }
    if (shutdownMessage != null) {
      shutdown(shutdownMessage);
      // leader goes in looking state
    }
  } finally {
    zk.unregisterJMX(this);
  }
}
```

下面看下创建的LearnerCnxAcceptor做了什么

```java
// LearnerCnxAcceptor
@Override
public void run() {
  try {
    while (!stop) {
      Socket s = null;
      boolean error = false;
      try {
        // 1. 接收连接
        s = ss.accept();
        // start with the initLimit, once the ack is processed
        // in LearnerHandler switch to the syncLimit
        // 2. 设置连接
        // 设置read操作阻塞的超时时间，如果在指定的时间内一直没有数据可以读取，会抛出异常
        s.setSoTimeout(self.tickTime * self.initLimit);
        s.setTcpNoDelay(nodelay);
        BufferedInputStream is = new BufferedInputStream(
          s.getInputStream());
        // 3. 创建LearnerHandler并启动
        LearnerHandler fh = new LearnerHandler(s, is, Leader.this);
        fh.start();
      } catch (SocketException e) {
        error = true;
        if (stop) {
          LOG.info("exception while shutting down acceptor: "
                   + e);
          // When Leader.shutdown() calls ss.close(),
          // the call to accept throws an exception.
          // We catch and set stop to true.
          stop = true;
        } else {
          throw e;
        }
      } catch (SaslException e){
        LOG.error("Exception while connecting to quorum learner", e);
        error = true;
      } catch (Exception e) {
        error = true;
        throw e;
      } finally {
        // Don't leak sockets on errors
        if (error && s != null && !s.isClosed()) {
          try {
            s.close();
          } catch (IOException e) {
            LOG.warn("Error closing socket", e);
          }
        }
      }
    }
  } catch (Exception e) {
    LOG.warn("Exception while accepting follower", e.getMessage());
    handleException(this.getName(), e);
  }
}
```

可以看到LearnerCnxAcceptor做的主要就是监听端口，每接收一个连接请求，就创建一个LearnerHandler来处理这个新建立的连接

下面综合Leader和LearnerHandle来看leader和其他节点之间的通信同步过程

### 获取对端节点信息

从对端节点的输入流中读取数据，然后解析数据，得到对端节点的id,version,configVersion,lastAcceptedEpoch等信息

```java
// LearnerHandler
public void run() {
	leader.addLearnerHandler(this);
  tickOfNextAckDeadline = leader.self.tick.get()
    + leader.self.initLimit + leader.self.syncLimit;
  ia = BinaryInputArchive.getArchive(bufferedInput);
  bufferedOutput = new BufferedOutputStream(sock.getOutputStream());
  oa = BinaryOutputArchive.getArchive(bufferedOutput);
  QuorumPacket qp = new QuorumPacket();
  // 从对端读取数据
  ia.readRecord(qp, "packet");
  if(qp.getType() != Leader.FOLLOWERINFO && qp.getType() != Leader.OBSERVERINFO){
    LOG.error("First packet " + qp.toString()
              + " is not FOLLOWERINFO or OBSERVERINFO!");
    return;
  }
  // 解析对端节点的信息
  byte learnerInfoData[] = qp.getData();
  if (learnerInfoData != null) {
    ByteBuffer bbsid = ByteBuffer.wrap(learnerInfoData);
    // sid
    if (learnerInfoData.length >= 8) {
      this.sid = bbsid.getLong();
    }
    // version
    if (learnerInfoData.length >= 12) {
      this.version = bbsid.getInt(); // protocolVersion
    }
    // configVersion
    if (learnerInfoData.length >= 20) {
      long configVersion = bbsid.getLong();
      if (configVersion > leader.self.getQuorumVerifier().getVersion()) {
        throw new IOException("Follower is ahead of the leader (has a later activated configuration)");
      }
    }
  } else {
    this.sid = leader.followerCounter.getAndDecrement();
  }
  if (leader.self.getView().containsKey(this.sid)) {
    LOG.info("Follower sid: " + this.sid + " : info : "
             + leader.self.getView().get(this.sid).toString());
  } else {
    LOG.info("Follower sid: " + this.sid + " not in the current config " + Long.toHexString(leader.self.getQuorumVerifier().getVersion()));
  }
  // 节点角色
  if (qp.getType() == Leader.OBSERVERINFO) {
    learnerType = LearnerType.OBSERVER;
  }
  // 最新的epoch
  long lastAcceptedEpoch = ZxidUtils.getEpochFromZxid(qp.getZxid());  
  // 省略
}
```

### 生成当前epoch

```java
// Leader
void lead() {
  long epoch = getEpochToPropose(self.getId(), self.getAcceptedEpoch());
}
```

```java
// LearnerHandler
public void run() {
  long newEpoch = leader.getEpochToPropose(this.getSid(), lastAcceptedEpoch);
  long newLeaderZxid = ZxidUtils.makeZxid(newEpoch, 0);
}
```

getEpochToPropose主要作用是等待过半learner和当前的leader建立了连接，通过每个learner发给leader消息中的epoch，来计算最新的epoch

```java
// 已经和当前leader建立连接的follower集合
protected final Set<Long> connectingFollowers = new HashSet<Long>();
// Leader
public long getEpochToPropose(long sid, long lastAcceptedEpoch) throws InterruptedException, IOException {
  // 并发操作connectingFollowers
  synchronized(connectingFollowers) {
    // 如果已经计算过新的epoch，直接返回
    if (!waitingForNewEpoch) {
      return epoch;
    }
    // 接收到的epoch大于当前的epoch，更新
    if (lastAcceptedEpoch >= epoch) {
      epoch = lastAcceptedEpoch+1;
    }
    // 当前节点是选举参与者
    // 将该节点加入到并发操作connectingFollowers集合中，代表leader已经和其建立了连接
    if (isParticipant(sid)) {
      connectingFollowers.add(sid);
    }
    QuorumVerifier verifier = self.getQuorumVerifier();
    // 判断leader是否已经和过半的参与者建立了连接
    if (connectingFollowers.contains(self.getId()) &&
        verifier.containsQuorum(connectingFollowers)) {
      // 修改标志，新的epoch已经计算完毕
      waitingForNewEpoch = false;
      // 设置epoch
      self.setAcceptedEpoch(epoch);
      // 唤醒所有阻塞线程
      connectingFollowers.notifyAll();
    } else {
      long start = Time.currentElapsedTime();
      long cur = start;
      long end = start + self.getInitLimit()*self.getTickTime();
      // 阻塞等待过半follower连接
      while(waitingForNewEpoch && cur < end) {
        connectingFollowers.wait(end - cur);
        cur = Time.currentElapsedTime();
      }
      if (waitingForNewEpoch) {
        throw new InterruptedException("Timeout while waiting for epoch from quorum");
      }
    }
    return epoch;
  }
}
```

从上面的代码中可以看出该方法的过程如下：

**1、** 判断和leader建立连接的对端节点是否是参与者，如果是参与者，将其加入到connectingFollowers中；

**2、** 使用对端节点的epoch来计算leader的最新epoch，保证leader的最新epoch为所有接收到的epoch中的最大值+1；

**3、** 如果过半的参与者已经和leader建立了连接，那么此时epoch更新完毕，唤醒所有阻塞在计算最新epoch的线程，继续往下执行；

**4、** 如果没有过半的参与者和leader建立连接，那么会阻塞，并且等待过半的参与者和leader建立连接；

### 确认生成的epoch

```java
// Leader
void lead() {
  // 等待过半参与者对生成的epoch ack
	waitForEpochAck(self.getId(), leaderStateSummary);
  // 设置当前的epoch
	self.setCurrentEpoch(epoch);      
}
```

```java
// LearnerHandler
public void run() {
	byte ver[] = new byte[4];
  ByteBuffer.wrap(ver).putInt(0x10000);
  // 向对端节点发送LEADERINFO，该信息带有生成的epoch
  QuorumPacket newEpochPacket = new QuorumPacket(Leader.LEADERINFO, newLeaderZxid, ver, null);
  oa.writeRecord(newEpochPacket, "packet");
  bufferedOutput.flush();
  // 读取对端节点输入流，获取对端节点对生成的epoch的响应
  QuorumPacket ackEpochPacket = new QuorumPacket();
  ia.readRecord(ackEpochPacket, "packet");
  if (ackEpochPacket.getType() != Leader.ACKEPOCH) {
    LOG.error(ackEpochPacket.toString()
              + " is not ACKEPOCH");
    return;
  }
  ByteBuffer bbepoch = ByteBuffer.wrap(ackEpochPacket.getData());
  ss = new StateSummary(bbepoch.getInt(), ackEpochPacket.getZxid());
  // 等待半数参与者对生成epoch
  leader.waitForEpochAck(this.getSid(), ss);  
}
```

当leader向每个节点发送了带有最新epoch的LEADERINFO消息后，会等待过半learner发送对该epoch的ack消息

基本流程和getEpochToPropose类似

```java
public void waitForEpochAck(long id, StateSummary ss) throws IOException, InterruptedException {
  synchronized(electingFollowers) {
    if (electionFinished) {
      return;
    }
    if (ss.getCurrentEpoch() != -1) {
      if (ss.isMoreRecentThan(leaderStateSummary)) {
        throw new IOException("Follower is ahead of the leader, leader summary: " 
                              + leaderStateSummary.getCurrentEpoch()
                              + " (current epoch), "
                              + leaderStateSummary.getLastZxid()
                              + " (last zxid)");
      }
      if (isParticipant(id)) {
        electingFollowers.add(id);
      }
    }
    QuorumVerifier verifier = self.getQuorumVerifier();
    if (electingFollowers.contains(self.getId()) && verifier.containsQuorum(electingFollowers)) {
      electionFinished = true;
      electingFollowers.notifyAll();
    } else {
      long start = Time.currentElapsedTime();
      long cur = start;
      long end = start + self.getInitLimit()*self.getTickTime();
      while(!electionFinished && cur < end) {
        electingFollowers.wait(end - cur);
        cur = Time.currentElapsedTime();
      }
      if (!electionFinished) {
        throw new InterruptedException("Timeout while waiting for epoch to be acked by quorum");
      }
    }
  }
}
```

### 同步数据

todo

```java
boolean needSnap = syncFollower(peerLastZxid, leader.zk.getZKDatabase(), leader);
/* if we are not truncating or sending a diff just send a snapshot */
if (needSnap) {
  boolean exemptFromThrottle = getLearnerType() != LearnerType.OBSERVER;
  LearnerSnapshot snapshot = 
    leader.getLearnerSnapshotThrottler().beginSnapshot(exemptFromThrottle);
  try {
    long zxidToSend = leader.zk.getZKDatabase().getDataTreeLastProcessedZxid();
    oa.writeRecord(new QuorumPacket(Leader.SNAP, zxidToSend, null, null), "packet");
    bufferedOutput.flush();
    LOG.info("Sending snapshot last zxid of peer is 0x{}, zxid of leader is 0x{}, "
             + "send zxid of db as 0x{}, {} concurrent snapshots, " 
             + "snapshot was {} from throttle",
             Long.toHexString(peerLastZxid), 
             Long.toHexString(leaderLastZxid),
             Long.toHexString(zxidToSend), 
             snapshot.getConcurrentSnapshotNumber(),
             snapshot.isEssential() ? "exempt" : "not exempt");
    // Dump data to peer
    leader.zk.getZKDatabase().serializeSnapshot(oa);
    oa.writeString("BenWasHere", "signature");
    bufferedOutput.flush();
  } finally {
    snapshot.close();
  }
}
```

### 确认新leader

```java
// LearnerHandler
public void run() {
  // 生成NEWLEADER信息并发送给对端
  QuorumPacket newLeaderQP = new QuorumPacket(Leader.NEWLEADER,
                        newLeaderZxid, leader.self.getLastSeenQuorumVerifier()
                                .toString().getBytes(), null);
  queuedPackets.add(newLeaderQP);
  bufferedOutput.flush();
  // Start thread that blast packets in the queue to learner
  startSendingPackets();
  // 从对端输入流中读取数据
  qp = new QuorumPacket();
  ia.readRecord(qp, "packet");
  if(qp.getType() != Leader.ACK){
    LOG.error("Next packet was supposed to be an ACK,"
              + " but received packet: {}", packetToString(qp));
    return;
  }
  if(LOG.isDebugEnabled()){
    LOG.debug("Received NEWLEADER-ACK message from " + sid);   
  }
  // 等待过半参与者对新leader的确认
  leader.waitForNewLeaderAck(getSid(), qp.getZxid());
}
```

```java
void lead() {
  waitForNewLeaderAck(self.getId(), zk.getZxid());
}
```

当leader向其他learner发送了NEWLEADER消息后，会判断是否有过半的节点发送了对新领导者的确认信息

```java
public void waitForNewLeaderAck(long sid, long zxid)
            throws InterruptedException {
  synchronized (newLeaderProposal.qvAcksetPairs) {
    if (quorumFormed) {
      return;
    }
    long currentZxid = newLeaderProposal.packet.getZxid();
    if (zxid != currentZxid) {
      LOG.error("NEWLEADER ACK from sid: " + sid
                + " is from a different epoch - current 0x"
                + Long.toHexString(currentZxid) + " receieved 0x"
                + Long.toHexString(zxid));
      return;
    }
    /*
             * Note that addAck already checks that the learner
             * is a PARTICIPANT.
             */
    newLeaderProposal.addAck(sid);
    if (newLeaderProposal.hasAllQuorums()) {
      quorumFormed = true;
      newLeaderProposal.qvAcksetPairs.notifyAll();
    } else {
      long start = Time.currentElapsedTime();
      long cur = start;
      long end = start + self.getInitLimit() * self.getTickTime();
      while (!quorumFormed && cur < end) {
        newLeaderProposal.qvAcksetPairs.wait(end - cur);
        cur = Time.currentElapsedTime();
      }
      if (!quorumFormed) {
        throw new InterruptedException(
          "Timeout while waiting for NEWLEADER to be acked by quorum");
      }
    }
  }
}
```

### 启动ZookeeperServer

等待Leader启动ZookeeperServe

```java
// Leader
void lead() {
  startZkServer();
}
```

```java
// LearnerHandler
public void run() {
  synchronized(leader.zk){
    while(!leader.zk.isRunning() && !this.isInterrupted()){
      leader.zk.wait(20);
    }
  }
}
```

### 心跳

```java
// Leader
void lead() {
  // 一个tickTime中Leader会向其他节点发送两次ping信息
  // 因此每两次循环会执行过半检查和递增时钟操作
  while (true) {
    synchronized (this) {
      long start = Time.currentElapsedTime();
      long cur = start;
      // 半个tickTime
      long end = start + self.tickTime / 2;
      while (cur < end) {
        wait(end - cur);
        cur = Time.currentElapsedTime();
      }
      // 每两次循环递增时钟
      if (!tickSkip) {
        self.tick.incrementAndGet();
      }
      // We use an instance of SyncedLearnerTracker to
      // track synced learners to make sure we still have a
      // quorum of current (and potentially next pending) view.
      SyncedLearnerTracker syncedAckSet = new SyncedLearnerTracker();
      syncedAckSet.addQuorumVerifier(self.getQuorumVerifier());
      if (self.getLastSeenQuorumVerifier() != null
          && self.getLastSeenQuorumVerifier().getVersion() > self
          .getQuorumVerifier().getVersion()) {
        syncedAckSet.addQuorumVerifier(self
                                       .getLastSeenQuorumVerifier());
      }
      syncedAckSet.addAck(self.getId());
      for (LearnerHandler f : getLearners()) {
        // 判断当前时钟是否在tickOfNextAckDeadline之前，即最近接收过对端节点的信息
        if (f.synced()) {
          syncedAckSet.addAck(f.getSid());
        }
      }
      // check leader running status
      if (!this.isRunning()) {
        // set shutdown flag
        shutdownMessage = "Unexpected internal error";
        break;
      }
      // 每两次循环，判断一下是否有过半节点仍然和当前节点保持着心跳
      if (!tickSkip && !syncedAckSet.hasAllQuorums()) {
        // Lost quorum of last committed and/or last proposed
        // config, set shutdown flag
        shutdownMessage = "Not sufficient followers synced, only synced with sids: [ "
          + syncedAckSet.ackSetsToString() + " ]";
        break;
      }
      tickSkip = !tickSkip;
    }
    // 发送ping信息
    for (LearnerHandler f : getLearners()) {
      f.ping();
    }
  }
  // 当没有过半节点和leader保持心跳时，会关闭leader，进入looking，重新开始选举
  if (shutdownMessage != null) {
    shutdown(shutdownMessage);
    // leader goes in looking state
  }  
}
```

```java
// LearnerHandler
public void ping() {
  // If learner hasn't sync properly yet, don't send ping packet
  // otherwise, the learner will crash
  if (!sendingThreadStarted) {
    return;
  }
  long id;
  if (syncLimitCheck.check(System.nanoTime())) {
    synchronized(leader) {
      id = leader.lastProposed;
    }
    QuorumPacket ping = new QuorumPacket(Leader.PING, id, null, null);
    queuePacket(ping);
  } else {
    LOG.warn("Closing connection to peer due to transaction timeout.");
    shutdown();
  }
}
```

```java
// SyncLimitCheck
public synchronized boolean check(long time) {
  if (currentTime == 0) {
    return true;
  } else {
    long msDelay = (time - currentTime) / 1000000;
    return (msDelay < (leader.self.tickTime * leader.self.syncLimit));
  }
}
```

## Follower

```java
// QuorumPeer
public void run() {
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
}
```

### 创建

```java
// QuorumPeer
protected Follower makeFollower(FileTxnSnapLog logFactory) throws IOException {
  return new Follower(this, new FollowerZooKeeperServer(logFactory, this, this.zkDb));
}
Follower(QuorumPeer self,FollowerZooKeeperServer zk) {
  this.self = self;
  this.zk=zk;
  this.fzk = zk;
}
```

### 运行

```java
// Follower
void followLeader() throws InterruptedException {
  self.end_fle = Time.currentElapsedTime();
  long electionTimeTaken = self.end_fle - self.start_fle;
  self.setElectionTimeTaken(electionTimeTaken);
  LOG.info("FOLLOWING - LEADER ELECTION TOOK - {} {}", electionTimeTaken,
           QuorumPeer.FLE_TIME_UNIT);
  self.start_fle = 0;
  self.end_fle = 0;
  fzk.registerJMX(new FollowerBean(this, zk), self.jmxLocalPeerBean);
  try {
    // 1. 通过投票结果获取当前leader的信息
    QuorumServer leaderServer = findLeader();            
    try {
      // 2. 连接leader
      connectToLeader(leaderServer.addr, leaderServer.hostname);
      // 3. 注册到leader
      long newEpochZxid = registerWithLeader(Leader.FOLLOWERINFO);
      if (self.isReconfigStateChange())
        throw new Exception("learned about role change");
      //check to see if the leader zxid is lower than ours
      //this should never happen but is just a safety check
      long newEpoch = ZxidUtils.getEpochFromZxid(newEpochZxid);
      if (newEpoch < self.getAcceptedEpoch()) {
        LOG.error("Proposed leader epoch " + ZxidUtils.zxidToString(newEpochZxid)
                  + " is less than our accepted epoch " + ZxidUtils.zxidToString(self.getAcceptedEpoch()));
        throw new IOException("Error: Epoch of leader is lower");
      }
      // 4. 同步leader
      syncWithLeader(newEpochZxid);                
      QuorumPacket qp = new QuorumPacket();
      while (this.isRunning()) {
       	// 从leader输入流中读取数据
        readPacket(qp);
        // 处理读取到的数据
        processPacket(qp);
      }
    } catch (Exception e) {
      LOG.warn("Exception when following the leader", e);
      try {
        sock.close();
      } catch (IOException e1) {
        e1.printStackTrace();
      }
      // clear pending revalidations
      pendingRevalidations.clear();
    }
  } finally {
    zk.unregisterJMX((Learner)this);
  }
}
```

### 连接leader

```java
// Follower
protected void connectToLeader(InetSocketAddress addr, String hostname)
            throws IOException, InterruptedException, X509Exception {
  // 创建socket连接
  this.sock = createSocket();
  // 建立连接的最长时间
  int initLimitTime = self.tickTime * self.initLimit;
  int remainingInitLimitTime = initLimitTime;
  long startNanoTime = nanoTime();
  // 重试连接
  // 如果重试5次失败或者在initLimitTime内没有建立连接，连接失败
  for (int tries = 0; tries < 5; tries++) {
    try {
      // recalculate the init limit time because retries sleep for 1000 milliseconds
      remainingInitLimitTime = initLimitTime - (int)((nanoTime() - startNanoTime) / 1000000);
      if (remainingInitLimitTime <= 0) {
        LOG.error("initLimit exceeded on retries.");
        throw new IOException("initLimit exceeded on retries.");
      }
      // 连接leader
      sockConnect(sock, addr, Math.min(self.tickTime * self.syncLimit, remainingInitLimitTime));
      if (self.isSslQuorum())  {
        ((SSLSocket) sock).startHandshake();
      }
      sock.setTcpNoDelay(nodelay);
      break;
    } catch (IOException e) {
      // 连接失败，更新剩余时间
      remainingInitLimitTime = initLimitTime - (int)((nanoTime() - startNanoTime) / 1000000);
      if (remainingInitLimitTime <= 1000) {
        LOG.error("Unexpected exception, initLimit exceeded. tries=" + tries +
                  ", remaining init limit=" + remainingInitLimitTime +
                  ", connecting to " + addr,e);
        throw e;
      } else if (tries >= 4) {
        LOG.error("Unexpected exception, retries exceeded. tries=" + tries +
                  ", remaining init limit=" + remainingInitLimitTime +
                  ", connecting to " + addr,e);
        throw e;
      } else {
        LOG.warn("Unexpected exception, tries=" + tries +
                 ", remaining init limit=" + remainingInitLimitTime +
                 ", connecting to " + addr,e);
        this.sock = createSocket();
      }
    }
    Thread.sleep(1000);
  }
  self.authLearner.authenticate(sock, hostname);
  // 建立和leader的输入和输出流
  leaderIs = BinaryInputArchive.getArchive(new BufferedInputStream(
    sock.getInputStream()));
  bufferedOutput = new BufferedOutputStream(sock.getOutputStream());
  leaderOs = BinaryOutputArchive.getArchive(bufferedOutput);
}
```

### 注册信息

```java
protected long registerWithLeader(int pktType) throws IOException{
  // 1. 生成当前节点信息，id，协议版本，config版本
  /*
         * Send follower info, including last zxid and sid
         */
  long lastLoggedZxid = self.getLastLoggedZxid();
  QuorumPacket qp = new QuorumPacket();                
  qp.setType(pktType);
  qp.setZxid(ZxidUtils.makeZxid(self.getAcceptedEpoch(), 0));
  /*
         * Add sid to payload
         */
  LearnerInfo li = new LearnerInfo(self.getId(), 0x10000, self.getQuorumVerifier().getVersion());
  ByteArrayOutputStream bsid = new ByteArrayOutputStream();
  BinaryOutputArchive boa = BinaryOutputArchive.getArchive(bsid);
  boa.writeRecord(li, "LearnerInfo");
  qp.setData(bsid.toByteArray());
  // 2. 发送给leader 
  writePacket(qp, true);
  // 3. 接收leader发来的epoch通知请求
  readPacket(qp);        
  // 从接收数据中解析出最新的epoch
  final long newEpoch = ZxidUtils.getEpochFromZxid(qp.getZxid());
  if (qp.getType() == Leader.LEADERINFO) {
    // we are connected to a 1.0 server so accept the new epoch and read the next packet
    leaderProtocolVersion = ByteBuffer.wrap(qp.getData()).getInt();
    byte epochBytes[] = new byte[4];
    final ByteBuffer wrappedEpochBytes = ByteBuffer.wrap(epochBytes);
   	// 使用新的epoch设置当前epoch
    if (newEpoch > self.getAcceptedEpoch()) {
      wrappedEpochBytes.putInt((int)self.getCurrentEpoch());
      self.setAcceptedEpoch(newEpoch);
    } else if (newEpoch == self.getAcceptedEpoch()) {
      // since we have already acked an epoch equal to the leaders, we cannot ack
      // again, but we still need to send our lastZxid to the leader so that we can
      // sync with it if it does assume leadership of the epoch.
      // the -1 indicates that this reply should not count as an ack for the new epoch
      wrappedEpochBytes.putInt(-1);
    } else {
      throw new IOException("Leaders epoch, " + newEpoch + " is less than accepted epoch, " + self.getAcceptedEpoch());
    }
		// 4. 发送对epoch的响应信息
    QuorumPacket ackNewEpoch = new QuorumPacket(Leader.ACKEPOCH, lastLoggedZxid, epochBytes, null);
    writePacket(ackNewEpoch, true);
    return ZxidUtils.makeZxid(newEpoch, 0);
  } else {
    if (newEpoch > self.getAcceptedEpoch()) {
      self.setAcceptedEpoch(newEpoch);
    }
    if (qp.getType() != Leader.NEWLEADER) {
      LOG.error("First packet should have been NEWLEADER");
      throw new IOException("First packet should have been NEWLEADER");
    }
    return qp.getZxid();
  }
} 
```

### 同步数据

todo

### 循环处理请求

```java
// Follower
public void followLeader() {
	QuorumPacket qp = new QuorumPacket();
  while (this.isRunning()) {
    readPacket(qp);
    processPacket(qp);
  }  
}
```

> 版权声明：「DDKK.COM 弟弟快看，程序员编程资料站」本站文章，版权归原作者所有
