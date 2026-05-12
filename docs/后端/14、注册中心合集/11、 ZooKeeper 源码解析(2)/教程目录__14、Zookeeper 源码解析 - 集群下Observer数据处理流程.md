# 14、Zookeeper 源码解析 - 集群下Observer数据处理流程
- 来源：https://ddkk.com/zhuanlan/registered/zookeeper/2/14.html
- 分类：注册中心
- 分组：教程目录
### 一、请求处理

前文分析了Leader选举过程，完成选举之后，就会把对应节点设置成对应的状态，我们知道集群中有三种角色Leader、Follower、Observer，分别对应着源码中的LEADING、FOLLOWING、OBSERVING。还是回到QuorumPeer的run方法：

```java
public void run() {
try {
    while (running) {
        switch (getPeerState()) {
        //开始leader选举过程
        case LOOKING:
          setCurrentVote(makeLEStrategy().lookForLeader());
            break;
        case OBSERVING:
                setObserver(makeObserver(logFactory));
                observer.observeLeader();
            break;
        case FOLLOWING:
            try {
                setFollower(makeFollower(logFactory));
                follower.followLeader();
            break;
        case LEADING:
                setLeader(makeLeader(logFactory));
                leader.lead();
                setLeader(null);
            break;
        }
    }
} 
}
```

接下来就围绕着OBSERVING、FOLLOWING、LEADING这三种模式进行请求的分析过程。

### 二、OBSERVING

OBSERVING对应着集群中Observer节点，这个节点状态不参与Leader选举，也不参与投票，写请求会转发给Leader节点，读请求会直接读取相应节点信息，同步集群中最新的数据到Observer节点。

```java
//设置当前节点为Observer节点
setObserver(makeObserver(logFactory));
observer.observeLeader();
```

makeObserver方法会返回一个Observer对象，构造参数中会传入QuorumPeer和ObserverZooKeeperServer实例。所以我们跟着observeLeader()方法进行一步步分析：

```java
void observeLeader() throws Exception {
long connectTime = 0;
boolean completedSync = false;
try {
  //设置当前ZAB状态为DISCOVERY
    self.setZabState(QuorumPeer.ZabState.DISCOVERY);
    //找到Leader节点
    QuorumServer master = findLearnerMaster();
    try {
        //连接Leader节点
        connectToLeader(master.addr, master.hostname);
        connectTime = System.currentTimeMillis();
        //获取Leader节点的epoch值，也就是最新的事务id
        long newLeaderZxid = registerWithLeader(Leader.OBSERVERINFO);
       //设置Leader节点的地址和主机id值
        self.setLeaderAddressAndId(master.addr, master.getId());
        //设置ZAB状态为同步状态
        self.setZabState(QuorumPeer.ZabState.SYNCHRONIZATION);
        //同步最新数据
        syncWithLeader(newLeaderZxid);
        //设置当前ZAB状态为广播
        self.setZabState(QuorumPeer.ZabState.BROADCAST);
        completedSync = true;
        QuorumPacket qp = new QuorumPacket();
        //此时会不断的读取leader节点上传来的数据包，并处理
        while (this.isRunning() && nextLearnerMaster.get() == null) {
            readPacket(qp);
            processPacket(qp);
        }
    } catch (Exception e) {
    }
} finally {
}
}
```

此时我们需要集中分析registerWithLeader、syncWithLeader、processPacket这三个方法。

**registerWithLeader：**

```java
protected long registerWithLeader(int pktType) throws IOException {
//得到本节点的最新事务id
long lastLoggedZxid = self.getLastLoggedZxid();
//封装一个请求数据包，请求类型为OBSERVERINFO，请求内容是当前节点的Epoch值
QuorumPacket qp = new QuorumPacket();
qp.setType(pktType);
qp.setZxid(ZxidUtils.makeZxid(self.getAcceptedEpoch(), 0));
//封装节点的id值、协议号和版本号
LearnerInfo li = new LearnerInfo(self.getId(), 0x10000, self.getQuorumVerifier().getVersion());
ByteArrayOutputStream bsid = new ByteArrayOutputStream();
BinaryOutputArchive boa = BinaryOutputArchive.getArchive(bsid);
boa.writeRecord(li, "LearnerInfo");
qp.setData(bsid.toByteArray());
//发送给Leader节点
writePacket(qp, true);
//读取leader节点的值
readPacket(qp);
//得到Leader节点上的epoch值
final long newEpoch = ZxidUtils.getEpochFromZxid(qp.getZxid());
if (qp.getType() == Leader.LEADERINFO) {
   //获取leader 的协议版本号
    leaderProtocolVersion = ByteBuffer.wrap(qp.getData()).getInt();
    byte[] epochBytes = new byte[4];
    final ByteBuffer wrappedEpochBytes = ByteBuffer.wrap(epochBytes);
    //如果leader节点上的epoch大于本节点，把本节点的epoch设置为leader节点上的epoch值
    if (newEpoch > self.getAcceptedEpoch()) {
        wrappedEpochBytes.putInt((int) self.getCurrentEpoch());
        self.setAcceptedEpoch(newEpoch);
    } else if (newEpoch == self.getAcceptedEpoch()) {
       //如果相等不做操作
        wrappedEpochBytes.putInt(-1);
    } else {
    //否则抛出异常
        throw new IOException("Leaders epoch, "+ newEpoch + " is less than accepted epoch, "+ self.getAcceptedEpoch());
    }
    //给Leader节点发送一个响应
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

registerWithLeader方法就是比较当前Observer节点和Leader节点上的最新事务id是否一致，并更新当前Observer节点的事务id值，如果当前的事务id小于或等于Leader端的事务id写入响应给Leader节点。

**syncWithLeader：**

这个方法就是同步Leader节点的数据，使当前节点保持与Leader节点一致（省略了部分代码）。

```java
protected void syncWithLeader(long newLeaderZxid) throws Exception {
//响应包
QuorumPacket ack = new QuorumPacket(Leader.ACK, 0, null, null);
QuorumPacket qp = new QuorumPacket();
long newEpoch = ZxidUtils.getEpochFromZxid(newLeaderZxid);
QuorumVerifier newLeaderQV = null;
boolean snapshotNeeded = true;
boolean syncSnapshot = false;
//在registerWithLeader方法中，给Leader节点写入了响应包这里继续读取Leader节点的响应包
readPacket(qp);
Deque<Long> packetsCommitted = new ArrayDeque<>();
Deque<PacketInFlight> packetsNotCommitted = new ArrayDeque<>();
synchronized (zk) {
    //Leader端响应的是DIFF
    if (qp.getType() == Leader.DIFF) {
        //设置为DIFF，并判断是否需要强制写入初始化快照文件
        self.setSyncMode(QuorumPeer.SyncMode.DIFF);
        if (zk.shouldForceWriteInitialSnapshotAfterLeaderElection()) {
            snapshotNeeded = true;
            syncSnapshot = true;
        } else {
            snapshotNeeded = false;
        }
        //如果响应类型是SNAP
    } else if (qp.getType() == Leader.SNAP) {
        self.setSyncMode(QuorumPeer.SyncMode.SNAP);
         //此时会清空当前内存数据，然后同步Leader上的数据到本地内存
        zk.getZKDatabase().deserializeSnapshot(leaderIs);
        //设置最新的zxid
        zk.getZKDatabase().setlastProcessedZxid(qp.getZxid());
        syncSnapshot = true;
    } else if (qp.getType() == Leader.TRUNC) {
        //如果是TRUNC
        self.setSyncMode(QuorumPeer.SyncMode.TRUNC);
        //通过日志文件，同步与Leader一直的数据
        boolean truncated = zk.getZKDatabase().truncateLog(qp.getZxid());
        //设置最新zxid
        zk.getZKDatabase().setlastProcessedZxid(qp.getZxid());
    } 
    zk.getZKDatabase().initConfigInZKDatabase(self.getQuorumVerifier());
    //创建session追踪器
    zk.createSessionTracker();
    long lastQueued = 0;
    boolean isPreZAB1_0 = true;
    boolean writeToTxnLog = !snapshotNeeded;
    TxnLogEntry logEntry;
    outerLoop:
    while (self.isRunning()) {
       //如果Leader端响应的是DIFF数据同步，那么会继续读取Leader端的数据
        readPacket(qp);
        switch (qp.getType()) {
        //Leader会通过提案的方式发送给Learner节点
        case Leader.PROPOSAL:
            PacketInFlight pif = new PacketInFlight();
            logEntry = SerializeUtils.deserializeTxn(qp.getData());
            packetsNotCommitted.add(pif);
            break;
        //Leader在不断的发送提交操作
        case Leader.COMMIT:
        case Leader.COMMITANDACTIVATE:
            //取出最新的提案，然后执行提交操作，也就是调用processTxn方法
            pif = packetsNotCommitted.peekFirst();
            if (!writeToTxnLog) {
                if (pif.hdr.getZxid() != qp.getZxid()) {
                    LOG.warn(
                        "Committing 0x{}, but next proposal is 0x{}",
                        Long.toHexString(qp.getZxid()),
                        Long.toHexString(pif.hdr.getZxid()));
                } else {
                    zk.processTxn(pif.hdr, pif.rec);
                    packetsNotCommitted.remove();
                }
            } else {
                packetsCommitted.add(qp.getZxid());
            }
            break;
        case Leader.INFORM:
        case Leader.INFORMANDACTIVATE:
            PacketInFlight packet = new PacketInFlight();
            }
            if (!writeToTxnLog) {
                zk.processTxn(packet.hdr, packet.rec);
            } else {
                packetsNotCommitted.add(packet);
                packetsCommitted.add(qp.getZxid());
            }
            break;
            //已经完成与服务端的数据更新操作，退出循环
        case Leader.UPTODATE:
            if (isPreZAB1_0) {
               //建立快照信息
                zk.takeSnapshot(syncSnapshot);
                self.setCurrentEpoch(newEpoch);
            }
            self.setZooKeeperServer(zk);
            self.adminServer.setZooKeeperServer(zk);
            break outerLoop;
        case Leader.NEWLEADER: 
            if (snapshotNeeded) {
                zk.takeSnapshot(syncSnapshot);
            }
            self.setCurrentEpoch(newEpoch);
            writeToTxnLog = true;
            isPreZAB1_0 = false;
            sock.setSoTimeout(self.tickTime * self.syncLimit);
            self.setSyncMode(QuorumPeer.SyncMode.NONE);
            zk.startupWithoutServing();
            if (zk instanceof FollowerZooKeeperServer) {
                FollowerZooKeeperServer fzk = (FollowerZooKeeperServer) zk;
                for (PacketInFlight p : packetsNotCommitted) {
                    fzk.logRequest(p.hdr, p.rec, p.digest);
                }
                packetsNotCommitted.clear();
            }
            writePacket(new QuorumPacket(Leader.ACK, newLeaderZxid, null, null), true);
            break;
        }
    }
}
//响应Leader
ack.setZxid(ZxidUtils.makeZxid(newEpoch, 0));
writePacket(ack, true);
//设置zk为启动状态
zk.startServing();
}
```

syncWithLeader方法就是同步Leader服务的最新数据，数据同步的方式有DIFF、SNAP、TRUNC

**1、** DIFF：Leader响应的DIFF模式，Leader就会以Proposal的方式发送给Observer节点，然后再发送commit指令，Observer节点接收到commit指令，进行数据持久化操作；

**2、** SNAP：这种方式就是Observer会清空本地数据，然后直接接收Leader的的所有数据；

**3、** TRUNC：也会清空本地数据，然后通过最新的zxid找到本地日志，再从日志中恢复数据；

这就是服务启动后Observer节点和Leader节点进行数据同步的算法。

完成数据同步之后，就会通过while循环不断的接收和处理Leader端的数据：

```java
while (this.isRunning() && nextLearnerMaster.get() == null) {
 readPacket(qp);
 processPacket(qp);
}
```

主要看看processPacket方法：

```java
protected void processPacket(QuorumPacket qp) throws Exception {
    TxnLogEntry logEntry;
    TxnHeader hdr;
    TxnDigest digest;
    Record txn;
    switch (qp.getType()) {
    //Leader会与Observer节点保持心跳检测
    case Leader.PING:
        ping(qp);
        break;
        //如果是提案，commit以及uptodate则忽略操作
    case Leader.PROPOSAL:
        LOG.warn("Ignoring proposal");
        break;
    case Leader.COMMIT:
        LOG.warn("Ignoring commit");
        break;
    case Leader.UPTODATE:
        LOG.error("Received an UPTODATE message after Observer started");
        break;
    case Leader.REVALIDATE:
    //验证操作
        revalidate(qp);
        break;
    case Leader.SYNC:
    //处理同步请求
        ((ObserverZooKeeperServer) zk).sync();
        break;
    case Leader.INFORM: //如果当前是INFORM则封装成Request请求提交给RequestProcessor，这也是Observer接收Leader数据同步的处理位置
        ServerMetrics.getMetrics().LEARNER_COMMIT_RECEIVED_COUNT.add(1);
        logEntry = SerializeUtils.deserializeTxn(qp.getData());
        hdr = logEntry.getHeader();
        txn = logEntry.getTxn();
        digest = logEntry.getDigest();
        Request request = new Request(hdr.getClientId(), hdr.getCxid(), hdr.getType(), hdr, txn, 0);
        request.logLatency(ServerMetrics.getMetrics().COMMIT_PROPAGATION_LATENCY);
        request.setTxnDigest(digest);
        ObserverZooKeeperServer obs = (ObserverZooKeeperServer) zk;
        obs.commitRequest(request);
        break;
    case Leader.INFORMANDACTIVATE: //处理配置信息更新操作
        ByteBuffer buffer = ByteBuffer.wrap(qp.getData());
        long suggestedLeaderId = buffer.getLong();
        byte[] remainingdata = new byte[buffer.remaining()];
        buffer.get(remainingdata);
        logEntry = SerializeUtils.deserializeTxn(remainingdata);
        hdr = logEntry.getHeader();
        txn = logEntry.getTxn();
        digest = logEntry.getDigest();
        QuorumVerifier qv = self.configFromString(new String(((SetDataTxn) txn).getData(), UTF_8));
        request = new Request(hdr.getClientId(), hdr.getCxid(), hdr.getType(), hdr, txn, 0);
        request.setTxnDigest(digest);
        obs = (ObserverZooKeeperServer) zk;
        boolean majorChange = self.processReconfig(qv, suggestedLeaderId, qp.getZxid(), true);
        obs.commitRequest(request);
        if (majorChange) {
            throw new Exception("changes proposed in reconfig");
        }
        break;
    default:
        LOG.warn("Unknown packet type: {}", LearnerHandler.packetToString(qp));
        break;
    }
}
```

集群启动后，作为Observer节点，先获取到Leader对象，然后把自己注册到Leader节点，并更新当前的最新事务id，然后同步数据保持与Leader节点数据一致性，接下来就是循环接收Leader传递过来的写请求，并持久化到本地。此时的服务容器是ObserverZooKeeperServer对象，我们知道单机下是ZooKeeperServer。

### 三、接收客户端请求

集群启动完成，并完成了数据同步后，Observer就开始正式工作，处理接收服务端的数据同步外，还可以接收客户端的请求，那么整个处理过程又是怎样呢？

客户端的请求会封装成一个Request对象，然后提交给RequestProcessor实例处理

```java
firstProcessor.processRequest(si);
```

此时firstProcessor是ObserverRequestProcessor他的下一个是CommitProcessor然后再是FinalRequestProcessor，所以处理顺序也是这样。主要看看ObserverRequestProcessor和CommitProcessor的processorRequest方法。

ObserverRequestProcessor中会添加到queuedRequests阻塞队列中，其run方法会先调用 nextProcessor的processRequest方法，如果是事务性请求，再转发给Leader节点，接下来需要分析CommitProcessor中的处理逻辑。

processRequest：

```java
public void processRequest(Request request) {
    if (stopped) {
        return;
    }
    request.commitProcQueueStartTime = Time.currentElapsedTime();
    //添加到队列中
    queuedRequests.add(request);
    // 如果是事务性操作返回true，否则返回false
    if (needCommit(request)) {
    //往queuedWriteRequests队列中添加当前请求
        queuedWriteRequests.add(request);
        numWriteQueuedRequests.incrementAndGet();
    } else {
        numReadQueuedRequests.incrementAndGet();
    }
    wakeup();
}
```

在run方法中，针对读请求，则从queuedRequests队列中取出request请求，然后提交给FinalRequestProcessor进行处理，然后返回给客户端，这个在单机启动下已经介绍过。如果当前是写请求，会把当前的写请求添加到pendingRequests集合中，此时Leader端处理好Observer转发的写请求，通过投票并通过了当前写请求，那么就会像Observer节点相应一个INFORM，收到这个消息之后就会执行提交操作，也就是往committedRequests中写入当前的request。此时run方法中就会针对pendingRequests和committedRequests中的数据进行对比，提交当前的写请求给FinalRequestProcessor然后响应客户端。

### 四、总结

Observer节点在集群启动完成后，把自己注册到Leader节点上，并同步Leader节点的数据保持数据一致性，当接收到客户端请求为事务性请求，则转发给Leader节点，Leader节点通过选票通过之后，在发送一个INFORM消息给Observer节点，收到该消息后，Observer执行提交操作。如果是读请求，直接读取数据响应客户端。

以上，有任何不对的地方，请留言指正，敬请谅解。
