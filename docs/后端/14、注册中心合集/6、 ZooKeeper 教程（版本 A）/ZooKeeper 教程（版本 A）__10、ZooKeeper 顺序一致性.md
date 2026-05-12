# 10、ZooKeeper 顺序一致性
- 来源：https://ddkk.com/zhuanlan/registered/zookeeper/d-1/10.html
- 分类：注册中心
- 分组：ZooKeeper 教程（版本 A）
## 写

首先回顾下Leader和Follower的请求处理链

Leader:PrepRequestProcessor -> ProposalRequestProcessor ->CommitProcessor -> Leader.ToBeAppliedRequestProcessor ->FinalRequestProcessor

Follower:FollowerRequestProcessor -> CommitProcessor ->FinalRequestProcessor

### PrepRequestProcessor

```java
case OpCode.deleteContainer:
case OpCode.delete:
  DeleteRequest deleteRequest = new DeleteRequest();
  pRequest2Txn(request.type, zks.getNextZxid(), request, deleteRequest, true);
break;
```

```java
case OpCode.delete:
	// 校验session
  zks.sessionTracker.checkSession(request.sessionId, request.getOwner());
  DeleteRequest deleteRequest = (DeleteRequest)record;	
  // 使用请求反序列化成删除请求
  if(deserialize)
    ByteBufferInputStream.byteBuffer2Record(request.request, deleteRequest);
  // 待删除节点路径
  String path = deleteRequest.getPath();
  // 待删除节点路径的上级路径
  String parentPath = getParentPathAndValidate(path);
  // 获取删除节点和父节点的变更记录
  ChangeRecord parentRecord = getRecordForPath(parentPath);
  ChangeRecord nodeRecord = getRecordForPath(path);
	// 检验当前用户权限
  checkACL(zks, parentRecord.acl, ZooDefs.Perms.DELETE, request.authInfo);
  checkAndIncVersion(nodeRecord.stat.getVersion(), deleteRequest.getVersion(), path);
  if (nodeRecord.childCount > 0) {
    throw new KeeperException.NotEmptyException(path);
  }
  request.setTxn(new DeleteTxn(path));
  parentRecord = parentRecord.duplicate(request.getHdr().getZxid());
	// 减少父节点的孩子节点个数
  parentRecord.childCount--;
	// 将当前节点的变更记录和父节点的变更记录添加到zookeeperServer的待处理队列中
  addChangeRecord(parentRecord);
  addChangeRecord(new ChangeRecord(request.getHdr().getZxid(), path, null, -1, null));
  break;
```

```java
private void addChangeRecord(ChangeRecord c) {
  synchronized (zks.outstandingChanges) {
    zks.outstandingChanges.add(c);
    zks.outstandingChangesForPath.put(c.path, c);
  }
}
```

```java
// 设置请求的zxid
request.zxid = zks.getZxid();
nextProcessor.processRequest(request);
```

可以看到PrepRequestProcessor针对事务性请求，首先会为当前请求对象设置请求头（请求头中包含的请求的会话id，zxid等）

### ProposalRequestProcessor

```java
public void processRequest(Request request) throws RequestProcessorException {
  if (request instanceof LearnerSyncRequest){
    zks.getLeader().processSync((LearnerSyncRequest)request);
  } else {
    nextProcessor.processRequest(request);
    if (request.getHdr() != null) {
      // We need to sync and get consensus on any transactions
      try {
        zks.getLeader().propose(request);
      } catch (XidRolloverException e) {
        throw new RequestProcessorException(e.getMessage(), e);
      }
      syncProcessor.processRequest(request);
    }
  }
}
```

ProposalRequestProcessor的主要作用接收到PrepRequestProcessor传递过来的请求，如果是事务性请求，会发起proposal

```java
// Leader
public Proposal propose(Request request) {
  // 省略
  // 使用请求的zxid来更新lastProposed
	lastProposed = p.packet.getZxid();
  // 维护映射关系
  outstandingProposals.put(lastProposed, p);
  // 将请求条件到各个Follower的发送队列中，因此能够保证提出的proposal会按照顺序发送给learner
  sendPacket(pp);  
}
```

```java
// Follower
protected void processPacket(QuorumPacket qp) throws Exception{
 			// 省略
       switch (qp.getType()) {
        case Leader.PING:            
            ping(qp);            
            break;
        case Leader.PROPOSAL:           
            TxnHeader hdr = new TxnHeader();
            Record txn = SerializeUtils.deserializeTxn(qp.getData(), hdr);
            if (hdr.getZxid() != lastQueued + 1) {
                LOG.warn("Got zxid 0x"
                        + Long.toHexString(hdr.getZxid())
                        + " expected 0x"
                        + Long.toHexString(lastQueued + 1));
            }
            lastQueued = hdr.getZxid();
            if (hdr.getType() == OpCode.reconfig){
               SetDataTxn setDataTxn = (SetDataTxn) txn;       
               QuorumVerifier qv = self.configFromString(new String(setDataTxn.getData()));
               self.setLastSeenQuorumVerifier(qv, true);                               
            }
            fzk.logRequest(hdr, txn);
            break;
        }
}
```

### Follower处理Proposal

当Follower接受到Leader的Proposal请求后，会调用FollowerZookeeperServer的logRequest

```java
public void logRequest(TxnHeader hdr, Record txn) {
  Request request = new Request(hdr.getClientId(), hdr.getCxid(), hdr.getType(), hdr, txn, hdr.getZxid());
  if ((request.zxid & 0xffffffffL) != 0) {
    pendingTxns.add(request);
  }
  syncProcessor.processRequest(request);
}
```

logRequest会将接收到的请求添加到pendingTxns中，然后将请求交给syncProcessor

SyncProcessor会记录事务，并且将请求交给SendAckRequestProcessor，SendAckRequestProcessor会向leader发送ACK消息

### Leader处理ACK

```java
// LearnerHandler
case Leader.ACK:
  if (this.learnerType == LearnerType.OBSERVER) {
    if (LOG.isDebugEnabled()) {
      LOG.debug("Received ACK from Observer  " + this.sid);
    }
  }
  syncLimitCheck.updateAck(qp.getZxid());
  leader.processAck(this.sid, qp.getZxid(), sock.getLocalSocketAddress());
  break;
```

在processAck中会调用tryToCommit来尝试提交事务

```java
// Leader
synchronized public boolean tryToCommit(Proposal p, long zxid, SocketAddress followerAddr) {
  // 顺序提交，如果当前请求的前一个请求没有提交，那么不会提交当前请求
  if (outstandingProposals.containsKey(zxid - 1)) return false;
  // 判断是否收到过半的ack
  if (!p.hasAllQuorums()) {
    return false;                 
  }
  // commit proposals in order
  if (zxid != lastCommitted+1) {
    LOG.warn("Commiting zxid 0x" + Long.toHexString(zxid)
             + " from " + followerAddr + " not first!");
    LOG.warn("First is "
             + (lastCommitted+1));
  }     
  // 移除请求
  outstandingProposals.remove(zxid);
  // 省略
  // 提交请求，向Follower发送COMMIT消息
  commit(zxid);
  inform(p);
  zk.commitProcessor.commit(p.request);
  if(pendingSyncs.containsKey(zxid)){
    for(LearnerSyncRequest r: pendingSyncs.remove(zxid)) {
      sendSync(r);
    }               
  } 
  return  true;   
}
```

### Follower处理COMMIT

```java
// Follower
protected void processPacket(QuorumPacket qp) throws Exception{
  // 省略
  switch (qp.getType()) {
    case Leader.COMMIT:
      fzk.commit(qp.getZxid());
      break;
  }
}
```

```java
public void commit(long zxid) {
  if (pendingTxns.size() == 0) {
    LOG.warn("Committing " + Long.toHexString(zxid)
             + " without seeing txn");
    return;
  }
	// 判断是否按序接收COMMIT响应，如果乱序，当前Follower退出
  long firstElementZxid = pendingTxns.element().zxid;
  if (firstElementZxid != zxid) {
    LOG.error("Committing zxid 0x" + Long.toHexString(zxid)
              + " but next pending txn 0x"
              + Long.toHexString(firstElementZxid));
    System.exit(12);
  }
  Request request = pendingTxns.remove();
  commitProcessor.commit(request);
}
```

### CommitRequestProcessor

CommitRequestProcessor会保证按照commit的顺序来将事务性请求交给FinalRequestProcessor，代码比较复杂就不看了

### 总结

主要有两个关键点：

**1、** Leader在commit的时候，会等待当前请求的前一个请求commit；

**2、** Follower会按照发送ack的顺序来处理commit响应（在发送ack消息的时候，将请求添加到pendingTxns队列中，在提交的时候会判断请求是否是pendingTxns队首的请求），如果乱序接收commit请求，会退出重新同步；

## 读

这里以NIOServerCnxn为例

当NIOServerCnxn处理连接请求时，会调用readConnectRequest

```java
// NIOServerCnxn
private void readConnectRequest() throws IOException, InterruptedException {
  if (!isZKServerRunning()) {
    throw new IOException("ZooKeeperServer not running");
  }
  zkServer.processConnectRequest(this, incomingBuffer);
  initialized = true;
}
```

```java
// ZookeeperServer
public void processConnectRequest(ServerCnxn cnxn, ByteBuffer incomingBuffer) throws IOException {
  BinaryInputArchive bia = BinaryInputArchive.getArchive(new ByteBufferInputStream(incomingBuffer));
  // 从incomingBuffer中反序列化出ConnectRequest
  ConnectRequest connReq = new ConnectRequest();
  connReq.deserialize(bia, "connect");
  if (LOG.isDebugEnabled()) {
    LOG.debug("Session establishment request from client "
              + cnxn.getRemoteSocketAddress()
              + " client's lastZxid is 0x"
              + Long.toHexString(connReq.getLastZxidSeen()));
  }
  // 校验是否是readOnly
  boolean readOnly = false;
  try {
    readOnly = bia.readBool("readOnly");
    cnxn.isOldClient = false;
  } catch (IOException e) {
    // this is ok -- just a packet from an old client which
    // doesn't contain readOnly field
    LOG.warn("Connection request from old client "
             + cnxn.getRemoteSocketAddress()
             + "; will be dropped if server is in r-o mode");
  }
  if (!readOnly && this instanceof ReadOnlyZooKeeperServer) {
    String msg = "Refusing session request for not-read-only client "
      + cnxn.getRemoteSocketAddress();
    LOG.info(msg);
    throw new CloseRequestException(msg);
  }
  // 客户端上一次看过的zxid大于当前服务端的
  // 连接失败
  if (connReq.getLastZxidSeen() > zkDb.dataTree.lastProcessedZxid) {
    String msg = "Refusing session request for client "
      + cnxn.getRemoteSocketAddress()
      + " as it has seen zxid 0x"
      + Long.toHexString(connReq.getLastZxidSeen())
      + " our last zxid is 0x"
      + Long.toHexString(getZKDatabase().getDataTreeLastProcessedZxid())
      + " client must try another server";
    LOG.info(msg);
    throw new CloseRequestException(msg);
  }
  // 计算会话过期时间
  int sessionTimeout = connReq.getTimeOut();
  byte passwd[] = connReq.getPasswd();
  int minSessionTimeout = getMinSessionTimeout();
  if (sessionTimeout < minSessionTimeout) {
    sessionTimeout = minSessionTimeout;
  }
  int maxSessionTimeout = getMaxSessionTimeout();
  if (sessionTimeout > maxSessionTimeout) {
    sessionTimeout = maxSessionTimeout;
  }
  cnxn.setSessionTimeout(sessionTimeout);
  // We don't want to receive any packets until we are sure that the
  // session is setup
  cnxn.disableRecv();
  long sessionId = connReq.getSessionId();
  // 处理sessionId
  if (sessionId == 0) {
    // 当前请求没有设置sessionId，生成并且设置
    long id = createSession(cnxn, passwd, sessionTimeout);
    LOG.debug("Client attempting to establish new session:" +
              " session = 0x{}, zxid = 0x{}, timeout = {}, address = {}",
              Long.toHexString(id),
              Long.toHexString(connReq.getLastZxidSeen()),
              connReq.getTimeOut(),
              cnxn.getRemoteSocketAddress());
  } else {
    // 当前请求已经设置过了sessionId
    long clientSessionId = connReq.getSessionId();
    LOG.debug("Client attempting to renew session:" +
              " session = 0x{}, zxid = 0x{}, timeout = {}, address = {}",
              Long.toHexString(clientSessionId),
              Long.toHexString(connReq.getLastZxidSeen()),
              connReq.getTimeOut(),
              cnxn.getRemoteSocketAddress());
    // 关闭原有的session然后重新打开
    if (serverCnxnFactory != null) {
      serverCnxnFactory.closeSession(sessionId);
    }
    if (secureServerCnxnFactory != null) {
      secureServerCnxnFactory.closeSession(sessionId);
    }
    cnxn.setSessionId(sessionId);
    reopenSession(cnxn, sessionId, passwd, sessionTimeout);
  }
}
```

上面最主要的一步就是判断当前连接请求中客户端上一次看过的zxid是否大于当前服务端的最新zxid

如果大于，那么当前服务端落后于客户端，会拒绝连接

然后客户端会尝试其他的服务端

> 版权声明：「DDKK.COM 弟弟快看，程序员编程资料站」本站文章，版权归原作者所有
