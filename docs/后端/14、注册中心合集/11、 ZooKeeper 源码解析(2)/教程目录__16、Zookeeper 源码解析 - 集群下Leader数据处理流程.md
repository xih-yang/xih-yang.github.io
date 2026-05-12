# 16、Zookeeper 源码解析 - 集群下Leader数据处理流程
- 来源：https://ddkk.com/zhuanlan/registered/zookeeper/2/16.html
- 分类：注册中心
- 分组：教程目录
### 一、Leader

Leader处理写请求，发起Proposal提案给Follower进行表决，协调集群中其它节点，同步最新数据给集群中其它节点。QuorumPeer的run方法中会根据当前的状态是LEADING执行对应的操作：

```java
//设置当前leader
setLeader(makeLeader(logFactory));
//调用lead方法
leader.lead();
setLeader(null);
```

```java
void lead() throws IOException, InterruptedException 
try {
//此时会重新加载Leader节点的数据，已经做过分析
    zk.loadData();
    leaderStateSummary = new StateSummary(self.getCurrentEpoch(), zk.getLastProcessedZxid());
    //Leader开启端口监听来自Leaner的连接
    cnxAcceptor = new LearnerCnxAcceptor();
    cnxAcceptor.start();
    //获取最新的epoch
    long epoch = getEpochToPropose(self.getId(), self.getAcceptedEpoch());
    //设置当前的zxid
    zk.setZxid(ZxidUtils.makeZxid(epoch, 0));
    //获取最新的proposed
    synchronized (this) {
        lastProposed = zk.getZxid();
    }
   //启动ZooKeeper服务
    startZkServer();
    while (true) {
    //维持与Leaners的通信，也就是发送ping给节点
        for (LearnerHandler f : getLearners()) {
            f.ping();
        }
    }
    if (shutdownMessage != null) {
        shutdown(shutdownMessage);
    }
} finally {
    zk.unregisterJMX(this);
}
}
```

lead方法中开启端口监听来自leaners的连接操作，并维持与Learner的心跳检测，不管是Observer还是Follower启动都会把自己注册到Leader，并把自己的epoch值传递给Leader节点，然后等待leader节点的响应和数据同步，这些都已经分析过，此时我们从Leader角度去分析这两个操作。

Leaner的交互在LearnerCnxAcceptor对象中，会启动LearnerCnxAcceptorHandler线程监听端口，然后交给LearnerHandler对象进行数据处理。

### 二、LearnerHandler

这是专门负责处理learner处理器，具体业务实现在run方法中。

```java
public void run() {
try {
    //添加当前的handler
    learnerMaster.addLearnerHandler(this);
    tickOfNextAckDeadline = learnerMaster.getTickOfInitialAckDeadline();
     //获取输入输出流
    ia = BinaryInputArchive.getArchive(bufferedInput);
    bufferedOutput = new BufferedOutputStream(sock.getOutputStream());
    oa = BinaryOutputArchive.getArchive(bufferedOutput);
     //读取来自learner的请求
    QuorumPacket qp = new QuorumPacket();
    ia.readRecord(qp, "packet");
    //响应请求表示收到数据
    messageTracker.trackReceived(qp.getType());
    byte[] learnerInfoData = qp.getData();
    if (learnerInfoData != null) {
        ByteBuffer bbsid = ByteBuffer.wrap(learnerInfoData);
        //读取learner的sid值
        if (learnerInfoData.length >= 8) {
            this.sid = bbsid.getLong();
        }
        //读取版本号
        if (learnerInfoData.length >= 12) {
            this.version = bbsid.getInt(); // protocolVersion
        }
        //读取配置版本号
        if (learnerInfoData.length >= 20) {
            long configVersion = bbsid.getLong();
        }
    } else {
        this.sid = learnerMaster.getAndDecrementFollowerCounter();
    }
    //取出follower信息
    String followerInfo = learnerMaster.getPeerInfo(this.sid);
  //如果当前learner是Observer设置learnerType 为OBSERVER
    if (qp.getType() == Leader.OBSERVERINFO) {
        learnerType = LearnerType.OBSERVER;
    }
    //获取learner端的epoch
    long lastAcceptedEpoch = ZxidUtils.getEpochFromZxid(qp.getZxid());
    long peerLastZxid;
    StateSummary ss = null;
    //获取learner端的zxid
    long zxid = qp.getZxid();
    //获取leader端的epoch和zxid
    long newEpoch = learnerMaster.getEpochToPropose(this.getSid(), lastAcceptedEpoch);
    long newLeaderZxid = ZxidUtils.makeZxid(newEpoch, 0);
    if (this.getVersion() < 0x10000) {
        long epoch = ZxidUtils.getEpochFromZxid(zxid);
        ss = new StateSummary(epoch, zxid);
        learnerMaster.waitForEpochAck(this.getSid(), ss);
    } else {
        byte[] ver = new byte[4];
        ByteBuffer.wrap(ver).putInt(0x10000);
        //响应一个LEADERINFO信息给learner
        QuorumPacket newEpochPacket = new QuorumPacket(Leader.LEADERINFO, newLeaderZxid, ver, null);
        oa.writeRecord(newEpochPacket, "packet");
        messageTracker.trackSent(Leader.LEADERINFO);
        bufferedOutput.flush();
        QuorumPacket ackEpochPacket = new QuorumPacket();
        //继续读取learner的响应，此时learner收到之后会根据自身的信息进行判断返回ACKEPOCH信息
        ia.readRecord(ackEpochPacket, "packet");
        messageTracker.trackReceived(ackEpochPacket.getType());
        ByteBuffer bbepoch = ByteBuffer.wrap(ackEpochPacket.getData());
        ss = new StateSummary(bbepoch.getInt(), ackEpochPacket.getZxid());
        learnerMaster.waitForEpochAck(this.getSid(), ss);
    }
    //获取到最新的zxid
    peerLastZxid = ss.getLastZxid();
    //判断当前同步数据方式是DIFF/TRUNC/SNAP,判断的方式是，如果learner的zxid和leader一致，采用DIFF方式，如果learner要比leader新，那么采用TRUNC，截取learner中的数据使其保持与服务端一致，然后才是SNAP方式
    boolean needSnap = syncFollower(peerLastZxid, learnerMaster);
    boolean exemptFromThrottle = getLearnerType() != LearnerType.OBSERVER;
    /* 如果是snap方式，直接全量同步，也就是把Leader的整个数据库中的内容进行同步 */
    if (needSnap) {
        syncThrottler = learnerMaster.getLearnerSnapSyncThrottler();
        syncThrottler.beginSync(exemptFromThrottle);
        ServerMetrics.getMetrics().INFLIGHT_SNAP_COUNT.add(syncThrottler.getSyncInProgress());
        try {
            long zxidToSend = learnerMaster.getZKDatabase().getDataTreeLastProcessedZxid();
            oa.writeRecord(new QuorumPacket(Leader.SNAP, zxidToSend, null, null), "packet");
            messageTracker.trackSent(Leader.SNAP);
            bufferedOutput.flush();
            learnerMaster.getZKDatabase().serializeSnapshot(oa);
            oa.writeString("BenWasHere", "signature");
            bufferedOutput.flush();
        } finally {
            ServerMetrics.getMetrics().SNAP_COUNT.add(1);
        }
    } else {
        syncThrottler = learnerMaster.getLearnerDiffSyncThrottler();
    }
    if (getVersion() < 0x10000) {
        QuorumPacket newLeaderQP = new QuorumPacket(Leader.NEWLEADER, newLeaderZxid, null, null);
        oa.writeRecord(newLeaderQP, "packet");
    } else {
        QuorumPacket newLeaderQP = new QuorumPacket(Leader.NEWLEADER, newLeaderZxid, learnerMaster.getQuorumVerifierBytes(), null);
        queuedPackets.add(newLeaderQP);
    }
    bufferedOutput.flush();
    //发送数据给learner
    startSendingPackets();
    qp = new QuorumPacket();
    //读取响应
    ia.readRecord(qp, "packet");
    messageTracker.trackReceived(qp.getType());
    learnerMaster.waitForNewLeaderAck(getSid(), qp.getZxid());
    syncLimitCheck.start();
    syncThrottler.endSync();
    syncThrottler = null;
    sock.setSoTimeout(learnerMaster.syncTimeout());
    learnerMaster.waitForStartup();
    //完成数据同步后向learner响应UPTODATE，表示当前数据同步完成
    queuedPackets.add(new QuorumPacket(Leader.UPTODATE, -1, null, null));
    while (true) {
       //继续接受learner的数据
        qp = new QuorumPacket();
        ia.readRecord(qp, "packet");
        messageTracker.trackReceived(qp.getType());
        tickOfNextAckDeadline = learnerMaster.getTickOfNextAckDeadline();
        packetsReceived.incrementAndGet();
        ByteBuffer bb;
        long sessionId;
        int cxid;
        int type;
        switch (qp.getType()) {
        //处理ack响应
        case Leader.ACK:
            if (this.learnerType == LearnerType.OBSERVER) {
                LOG.debug("Received ACK from Observer {}", this.sid);
            }
            syncLimitCheck.updateAck(qp.getZxid());
            //ack信息会根据当前的Proposal收到的响应，如果过半响应后会进行发送commit操作给Follower和INFORM操作给Observer，然后Leader端再提交当前的操作
            learnerMaster.processAck(this.sid, qp.getZxid(), sock.getLocalSocketAddress());
            break;
        case Leader.PING:
            //心跳检测
            ByteArrayInputStream bis = new ByteArrayInputStream(qp.getData());
            DataInputStream dis = new DataInputStream(bis);
            while (dis.available() > 0) {
                long sess = dis.readLong();
                int to = dis.readInt();
                learnerMaster.touch(sess, to);
            }
            break;
            //重新验证
        case Leader.REVALIDATE:
            ServerMetrics.getMetrics().REVALIDATE_COUNT.add(1);
            learnerMaster.revalidateSession(qp, this);
            break;
            //如果当前是来自learner转发的事务性请求
        case Leader.REQUEST:
            bb = ByteBuffer.wrap(qp.getData());
            sessionId = bb.getLong();
            cxid = bb.getInt();
            type = bb.getInt();
            bb = bb.slice();
            Request si;
            if (type == OpCode.sync) {
                si = new LearnerSyncRequest(this, sessionId, cxid, type, bb, qp.getAuthinfo());
            } else {
                si = new Request(null, sessionId, cxid, type, bb, qp.getAuthinfo());
            }
            si.setOwner(this);
            //提交当前请求，此时通过ProposalRequestProcessor把请求封装成Proposal对象，然后发送一个PROPOSAL给所有的Follower节点
            learnerMaster.submitLearnerRequest(si);
            requestsReceived.incrementAndGet();
            break;
        default:
            LOG.warn("unexpected quorum packet, type: {}", packetToString(qp));
            break;
        }
    }
} catch (IOException e) {
}  finally {
}
}
```

lead方法会不断的保持与learner的心跳检测，然后接收learner转发的事务性请求，然后发起Proposal，投票通过之后，发起commit给所有的Follower节点，发送INFORM给所有的Observer节点，并提交Leader节点的Proposal。

### 三、接收客户端请求

客户端请求处理都是交给RequestProcessor来处理，RequestProcessor的调用链是在ZooKeeper服务启动的时候通过方法setupRequestProcessors()来初始化。LeaderZooKeeperServer中如下所示：

```java
protected void setupRequestProcessors() {
    RequestProcessor finalProcessor = new FinalRequestProcessor(this);
    RequestProcessor toBeAppliedProcessor = new Leader.ToBeAppliedRequestProcessor(finalProcessor, getLeader());
    commitProcessor = new CommitProcessor(toBeAppliedProcessor, Long.toString(getServerId()), false, getZooKeeperServerListener());
    commitProcessor.start();
    ProposalRequestProcessor proposalProcessor = new ProposalRequestProcessor(this, commitProcessor);
    proposalProcessor.initialize();
    prepRequestProcessor = new PrepRequestProcessor(this, proposalProcessor);
    prepRequestProcessor.start();
    firstProcessor = new LeaderRequestProcessor(this, prepRequestProcessor);
    setupContainerManager();
}
```

所以分析Leader端的请求处理过程就可以按照以上调用链来分析，首先是LeaderRequestProcessor会判断当前的session是否需要升级，然后提交给PrepRequestProcessor来处理，分析单机模式时已经介绍过，之后再是ProposalRequestProcessor，这个处理做三件事，一是提交给下一级处理器处理，二是针对事务性请求分发Proposal给Follower节点发起投票，三是提交给syncProcessor处理器进行日志记录。接下来就到了CommitProcessor处理器，会根据当前的投票结果，判断是否需要进行事务性请求提交操作，最终提交给FinalRequestProcessor进行提交操作，中间还有个ToBeAppliedRequestProcessor，这是针对事务性请求从toBeApplied中删掉当前的请求。

### 四、总结

Leader节点会接收来自客户端和Learner转发的事务性请求，然后发起Proposal给Follower进行投票，Follower正确收到后，会响应一个ACK给Leader，同时Leader和Learner都会通过SyncRequestProcessor进行日志记录，服务端收到ACK响应并判断当前收到响应是否达到合理票数，然后发起提交操作给Follower，以及发送INFORM消息给Observer进行提交，源码中的处理逻辑如下。

**1、** Leader接收客户端或Learner的事务性请求，然后调用ProposalRequestProcessor进行处理，这里会针对事务性请求发起Proposal投票，以及调用SyncRequestProcessor进行日志记录，并转发到CommitProcessor；

**2、** Follower收到Proposal后会响应ACK给Leader，Leader通过LearnerHandler来处理Follower发送的ACK，也就是调用Leader的processAck方法，然后通过tryToCommit方法来判断当前的Proposal是否需要执行提交操作，如果是分别调用commit(zxid)和inform§给Follower和Observer进行提交；

**3、** 第一步中请求已经提交给CommitProcessor，当Leader端判断当前的请求可以执行提交操作，就会调用CommitProcessor的commit方法，此时往committedRequests队列中添加需要提交的request，其urn方法就会不断的从这个队列中取出Request执行commit；

以上，有任何不对的地方，请留言指正，敬请谅解。
