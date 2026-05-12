# 08、ZooKeeper 请求处理链
- 来源：https://ddkk.com/zhuanlan/registered/zookeeper/d-1/8.html
- 分类：注册中心
- 分组：ZooKeeper 教程（版本 A）
zookeeper在接收到请求之后，会将请求交给请求处理链来处理，请求处理链上顺序链接着多个请求处理器，他们按序处理这些请求

集群中不同角色的节点使用不同的ZookeeperServer实现类，ZookeeperServer不同的实现类使用不同的请求处理链

Leader：PrepRequestProcessor -> ProposalRequestProcessor ->CommitProcessor -> Leader.ToBeAppliedRequestProcessor ->FinalRequestProcessor

Follower：FollowerRequestProcessor -> CommitProcessor ->FinalRequestProcessor

RequestProcessor是请求处理器的最上层接口

```java
public interface RequestProcessor {
    @SuppressWarnings("serial")
    public static class RequestProcessorException extends Exception {
        public RequestProcessorException(String msg, Throwable t) {
            super(msg, t);
        }
    }
   	// 处理请求
    void processRequest(Request request) throws RequestProcessorException;
  	// 关闭
    void shutdown();
}
```

## Leader

下面按照LeaderZookeeperServer上请求处理器的顺序来看下源码

PrepRequestProcessor -> ProposalRequestProcessor ->CommitProcessor -> Leader.ToBeAppliedRequestProcessor ->FinalRequestProcessor

## PrepRequestProcessor

## 主要属性

```java
// 判断是否需要跳过acl校验
static boolean skipACL;
static {
  skipACL = System.getProperty("zookeeper.skipACL", "no").equals("yes");
  if (skipACL) {
    LOG.info("zookeeper.skipACL==\"yes\", ACL checks will be skipped");
  }
}
// 提交的请求
LinkedBlockingQueue<Request> submittedRequests = new LinkedBlockingQueue<Request>();
// 下一个请求处理器
private final RequestProcessor nextProcessor;
// 关联的服务器
ZooKeeperServer zks;
```

## 重要方法

## 构造方法

```java
public PrepRequestProcessor(ZooKeeperServer zks,
            RequestProcessor nextProcessor) {
  super("ProcessThread(sid:" + zks.getServerId() + " cport:"
        + zks.getClientPort() + "):", zks.getZooKeeperServerListener());
  this.nextProcessor = nextProcessor;
  this.zks = zks;
}
```

## processRequest

```java
public void processRequest(Request request) {
  // 将请求添加到提交请求队列中
  submittedRequests.add(request);
}
```

## shutdown

```java
public void shutdown() {
  LOG.info("Shutting down");
  // 清空请求链表
  submittedRequests.clear();
  // 向链表中添加一个requestOfDeath请求
  submittedRequests.add(Request.requestOfDeath);
  // 关闭下一个请求处理器
  nextProcessor.shutdown();
}
```

## run

```java
public void run() {
  try {
    while (true) {
      // 不断从请求提交队列中取出请求
      Request request = submittedRequests.take();
      long traceMask = ZooTrace.CLIENT_REQUEST_TRACE_MASK;
      if (request.type == OpCode.ping) {
        traceMask = ZooTrace.CLIENT_PING_TRACE_MASK;
      }
      if (LOG.isTraceEnabled()) {
        ZooTrace.logRequest(LOG, traceMask, 'P', request, "");
      }
      // 如果当前请求是requestOfDeath，会停止循环，从而停止线程
      // 当调用shutdown时，会向提交请求队列中
      if (Request.requestOfDeath == request) {
        break;
      }
      // 处理请求
      pRequest(request);
    }
  } catch (RequestProcessorException e) {
    if (e.getCause() instanceof XidRolloverException) {
      LOG.info(e.getCause().getMessage());
    }
    handleException(this.getName(), e);
  } catch (Exception e) {
    handleException(this.getName(), e);
  }
  LOG.info("PrepRequestProcessor exited loop!");
}
```

pRequest处理的请求有如下三类:

**1、** 需要创建事务记录；

比如创建节点、设置节点数据、删除节点、设置acl等
**2、** 创建或删除事务；

**3、** 不需要创建事务记录，仅验证事务是否有效；

比如判断节点是否存在、获取节点数据、获取节点acl等

```java
protected void pRequest(Request request) throws RequestProcessorException {
  // LOG.info("Prep>>> cxid = " + request.cxid + " type = " +
  // request.type + " id = 0x" + Long.toHexString(request.sessionId));
  request.setHdr(null);
  request.setTxn(null);
  try {
    switch (request.type) {
      // 1. 需要创建事务记录的请求
      case OpCode.createContainer:
      case OpCode.create:
      case OpCode.create2:
        CreateRequest create2Request = new CreateRequest();
        pRequest2Txn(request.type, zks.getNextZxid(), request, create2Request, true);
        break;
      case OpCode.createTTL:
        CreateTTLRequest createTtlRequest = new CreateTTLRequest();
        pRequest2Txn(request.type, zks.getNextZxid(), request, createTtlRequest, true);
        break;
      case OpCode.deleteContainer:
      case OpCode.delete:
        DeleteRequest deleteRequest = new DeleteRequest();
        pRequest2Txn(request.type, zks.getNextZxid(), request, deleteRequest, true);
        break;
      case OpCode.setData:
        SetDataRequest setDataRequest = new SetDataRequest();                
        pRequest2Txn(request.type, zks.getNextZxid(), request, setDataRequest, true);
        break;
      case OpCode.reconfig:
        ReconfigRequest reconfigRequest = new ReconfigRequest();
        ByteBufferInputStream.byteBuffer2Record(request.request, reconfigRequest);
        pRequest2Txn(request.type, zks.getNextZxid(), request, reconfigRequest, true);
        break;
      case OpCode.setACL:
        SetACLRequest setAclRequest = new SetACLRequest();                
        pRequest2Txn(request.type, zks.getNextZxid(), request, setAclRequest, true);
        break;
      case OpCode.check:
        CheckVersionRequest checkRequest = new CheckVersionRequest();              
        pRequest2Txn(request.type, zks.getNextZxid(), request, checkRequest, true);
        break;
      case OpCode.multi:
        MultiTransactionRecord multiRequest = new MultiTransactionRecord();
        try {
          ByteBufferInputStream.byteBuffer2Record(request.request, multiRequest);
        } catch(IOException e) {
          request.setHdr(new TxnHeader(request.sessionId, request.cxid, zks.getNextZxid(),
                                       Time.currentWallTime(), OpCode.multi));
          throw e;
        }
        List<Txn> txns = new ArrayList<Txn>();
        //Each op in a multi-op must have the same zxid!
        long zxid = zks.getNextZxid();
        KeeperException ke = null;
        //Store off current pending change records in case we need to rollback
        Map<String, ChangeRecord> pendingChanges = getPendingChanges(multiRequest);
        for(Op op: multiRequest) {
          Record subrequest = op.toRequestRecord();
          int type;
          Record txn;
          /* If we've already failed one of the ops, don't bother
                     * trying the rest as we know it's going to fail and it
                     * would be confusing in the logfiles.
                     */
          if (ke != null) {
            type = OpCode.error;
            txn = new ErrorTxn(Code.RUNTIMEINCONSISTENCY.intValue());
          }
          /* Prep the request and convert to a Txn */
          else {
            try {
              pRequest2Txn(op.getType(), zxid, request, subrequest, false);
              type = request.getHdr().getType();
              txn = request.getTxn();
            } catch (KeeperException e) {
              ke = e;
              type = OpCode.error;
              txn = new ErrorTxn(e.code().intValue());
              if (e.code().intValue() > Code.APIERROR.intValue()) {
                LOG.info("Got user-level KeeperException when processing {} aborting" +
                         " remaining multi ops. Error Path:{} Error:{}",
                         request.toString(), e.getPath(), e.getMessage());
              }
              request.setException(e);
              /* Rollback change records from failed multi-op */
              rollbackPendingChanges(zxid, pendingChanges);
            }
          }
          //FIXME: I don't want to have to serialize it here and then
          //       immediately deserialize in next processor. But I'm
          //       not sure how else to get the txn stored into our list.
          ByteArrayOutputStream baos = new ByteArrayOutputStream();
          BinaryOutputArchive boa = BinaryOutputArchive.getArchive(baos);
          txn.serialize(boa, "request") ;
          ByteBuffer bb = ByteBuffer.wrap(baos.toByteArray());
          txns.add(new Txn(type, bb.array()));
        }
        request.setHdr(new TxnHeader(request.sessionId, request.cxid, zxid,
                                     Time.currentWallTime(), request.type));
        request.setTxn(new MultiTxn(txns));
        break;
      // 2. 创建或关闭事务
      case OpCode.createSession:
      case OpCode.closeSession:
        if (!request.isLocalSession()) {
          pRequest2Txn(request.type, zks.getNextZxid(), request,
                       null, true);
        }
        break;
      // 3. 不需要记录事务，仅验证事务
      case OpCode.sync:
      case OpCode.exists:
      case OpCode.getData:
      case OpCode.getACL:
      case OpCode.getChildren:
      case OpCode.getChildren2:
      case OpCode.ping:
      case OpCode.setWatches:
      case OpCode.checkWatches:
      case OpCode.removeWatches:
        zks.sessionTracker.checkSession(request.sessionId,
                                        request.getOwner());
        break;
      default:
        LOG.warn("unknown type " + request.type);
        break;
    }
  }
  // 省略
  request.zxid = zks.getZxid();
  // 交给下一个处理器处理
  nextProcessor.processRequest(request);
}
```

## 需要记录事务

```java
case OpCode.createContainer:
case OpCode.create:
case OpCode.create2:
CreateRequest create2Request = new CreateRequest();
pRequest2Txn(request.type, zks.getNextZxid(), request, create2Request, true);
break;
case OpCode.createTTL:
CreateTTLRequest createTtlRequest = new CreateTTLRequest();
pRequest2Txn(request.type, zks.getNextZxid(), request, createTtlRequest, true);
break;
case OpCode.deleteContainer:
case OpCode.delete:
DeleteRequest deleteRequest = new DeleteRequest();
pRequest2Txn(request.type, zks.getNextZxid(), request, deleteRequest, true);
break;
case OpCode.setData:
SetDataRequest setDataRequest = new SetDataRequest();                
pRequest2Txn(request.type, zks.getNextZxid(), request, setDataRequest, true);
break;
// 省略
```

这类请求都是先创建对应类型的Request对象，然后调用pRequest2Txn来处理

下面简单看下pRequest2Txn如何处理delete请求

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

可以看到这类操作会创建ChangeRecord并添加到zookeeperServer的outstandingChanges队列中

## 创建和关闭事务

```java
// PrepRequestProcessor
case OpCode.createSession:
case OpCode.closeSession:
  if (!request.isLocalSession()) {
    pRequest2Txn(request.type, zks.getNextZxid(), request,
                 null, true);
  }
  break;
```

可以看到当进行的是创建或是关闭操作时，仍然会调用pRequest2Txn方法，但是此时并不会创建相应的Request对象

下面简单看下如何处理创建事务请求

```java
// PrepRequestProcessor
case OpCode.createSession:
  request.request.rewind();
  int to = request.request.getInt();
  request.setTxn(new CreateSessionTxn(to));
  request.request.rewind();
  if (request.isLocalSession()) {
    // This will add to local session tracker if it is enabled
    zks.sessionTracker.addSession(request.sessionId, to);
  } else {
    // 将当前session放入sessionTracker中
    // Explicitly add to global session if the flag is not set
    zks.sessionTracker.addGlobalSession(request.sessionId, to);
  }
	// 设置session的owner
  zks.setOwner(request.sessionId, request.getOwner());
  break;
```

## 仅验证事务

对于下面这些操作，只是简单地验证session是否存在，并且该session是指定owner的

```java
case OpCode.sync:
case OpCode.exists:
case OpCode.getData:
case OpCode.getACL:
case OpCode.getChildren:
case OpCode.getChildren2:
case OpCode.ping:
case OpCode.setWatches:
case OpCode.checkWatches:
case OpCode.removeWatches:
	zks.sessionTracker.checkSession(request.sessionId,
                                request.getOwner());
break;
```

## ProposalRequestProcessor

ProposalRequestProcessor主要将请求转发给AckRequestProcessor和SyncRequestProcessor来处理

## 重要方法

## 构造方法

```java
public ProposalRequestProcessor(LeaderZooKeeperServer zks,
            RequestProcessor nextProcessor) {
  this.zks = zks;
  this.nextProcessor = nextProcessor;
  // 这里将SyncRequestProcessor和AckRequestProcessor连接起来形成一个请求处理链
  AckRequestProcessor ackProcessor = new AckRequestProcessor(zks.getLeader());
  syncProcessor = new SyncRequestProcessor(zks, ackProcessor);
}
```

## initialize

启动syncProcessor

```java
public void initialize() {
  syncProcessor.start();
}
```

## processRequest

```java
public void processRequest(Request request) throws RequestProcessorException {
  // 1. 当前请求是Learner发送过来的同步请求
  // leader进行同步操作
  if (request instanceof LearnerSyncRequest){
    zks.getLeader().processSync((LearnerSyncRequest)request);
  } else {
    // 2. 将请求交给下一个处理器
    nextProcessor.processRequest(request);
    if (request.getHdr() != null) {
      // We need to sync and get consensus on any transactions
      try {
        // leader发起提议
        zks.getLeader().propose(request);
      } catch (XidRolloverException e) {
        throw new RequestProcessorException(e.getMessage(), e);
      }
      // 将请求交给SyncProcessor来处理
      syncProcessor.processRequest(request);
    }
  }
}
```

这里看下Leader.propose

```java
public Proposal propose(Request request) throws XidRolloverException {
  if ((request.zxid & 0xffffffffL) == 0xffffffffL) {
    String msg =
      "zxid lower 32 bits have rolled over, forcing re-election, and therefore new epoch start";
    shutdown(msg);
    throw new XidRolloverException(msg);
  }
  // 1. 根据请求生成QuorumPacket
  byte[] data = SerializeUtils.serializeRequest(request);
  proposalStats.setLastBufferSize(data.length);
  QuorumPacket pp = new QuorumPacket(Leader.PROPOSAL, request.zxid, data, null);
  Proposal p = new Proposal();
  p.packet = pp;
  p.request = request;                
  synchronized(this) {
    p.addQuorumVerifier(self.getQuorumVerifier());
    if (request.getHdr().getType() == OpCode.reconfig){
      self.setLastSeenQuorumVerifier(request.qv, true);                       
    }
    if (self.getQuorumVerifier().getVersion()<self.getLastSeenQuorumVerifier().getVersion()) {
      p.addQuorumVerifier(self.getLastSeenQuorumVerifier());
    }
    if (LOG.isDebugEnabled()) {
      LOG.debug("Proposing:: " + request);
    }
    // 2. 更新lastProposed
    lastProposed = p.packet.getZxid();
    // 3. 维护zxid和QuorumPacket之间的映射关系
    outstandingProposals.put(lastProposed, p);
    // 4. 向follower发送QuorumPacket
    sendPacket(pp);
  }
  return p;
}
```

## 总结

**1、** 请求是来自learner的同步请求，创建一个同步请求，放到同步队列中；

**2、** 请求不是同步请求，发起proposal，并将请求交给SyncRequestProcessor处理；

## SyncRequestProcessor

下面看下SyncRequestProcessor，其主要作用是将用户的请求落到磁盘上，其会将请求批量落到磁盘上以提高io效率，只有到请求落到磁盘上，才会将请求交给下一个RequestProcessor处理

## 主要属性

```java
// 服务器
private final ZooKeeperServer zks;
// 需要处理的请求
private final LinkedBlockingQueue<Request> queuedRequests =
  new LinkedBlockingQueue<Request>();
// 下一个请求处理器
private final RequestProcessor nextProcessor;
// 快照线程
private Thread snapInProcess = null;
// 是否正在运行
volatile private boolean running;
// 等待被flush到磁盘的请求
private final LinkedList<Request> toFlush = new LinkedList<Request>();
// 随机数
private final Random r = new Random();
// 在执行快照之前，新增日志的最少个数
private static int snapCount = ZooKeeperServer.getSnapCount();
```

## 重要方法

## 构造方法

```java
// SyncRequestProcessor
public SyncRequestProcessor(ZooKeeperServer zks,
            RequestProcessor nextProcessor) {
  super("SyncThread:" + zks.getServerId(), zks
        .getZooKeeperServerListener());
  this.zks = zks;
  this.nextProcessor = nextProcessor;
  running = true;
}
```

## processRequest

```java
// SyncRequestProcessor
public void processRequest(Request request) {
  // request.addRQRec(">sync");
  // 将请求添加到队列中
  queuedRequests.add(request);
}
```

## shutdown

```java
// SyncRequestProcessor
public void shutdown() {
  LOG.info("Shutting down");
  // 向请求队列中增加requestOfDeath，当run循环中读取到这个请求，会跳出循环
  queuedRequests.add(requestOfDeath);
  try {
    if(running){
      this.join();
    }
    // 将日志落盘，并将这些请求交给nextProcessor
    if (!toFlush.isEmpty()) {
      flush(toFlush);
    }
  } catch(InterruptedException e) {
    LOG.warn("Interrupted while wating for " + this + " to finish");
  } catch (IOException e) {
    LOG.warn("Got IO exception during shutdown");
  } catch (RequestProcessorException e) {
    LOG.warn("Got request processor exception during shutdown");
  }
  // 关闭nextProcessor
  if (nextProcessor != null) {
    nextProcessor.shutdown();
  }
}
```

## run

```java
// SyncRequestProcessor
public void run() {
  try {
    // 记录当前尚未flush到磁盘的日志个数
    int logCount = 0;
    // we do this in an attempt to ensure that not all of the servers
    // in the ensemble take a snapshot at the same time
    // 触发flush操作的日志个数并不是一定的，如果是一定的，可能会导致集群中的所有节点同时进行快照操作
    int randRoll = r.nextInt(snapCount/2);
    while (true) {
      Request si = null;
      if (toFlush.isEmpty()) {
        // 当toFlush中为空时，会阻塞从queuedRequests中取出请求
        si = queuedRequests.take();
      } else {
        // 当toFlush中不为空时，也会从queuedRequests中取出请求，但不会阻塞
        si = queuedRequests.poll();
        if (si == null) {
          // 将尚未flush到磁盘的请求落盘，并将这些落盘的请求交给nextProcessor处理
          flush(toFlush);
          continue;
        }
      }
      // 调用了shutdown
      if (si == requestOfDeath) {
        break;
      }
      if (si != null) {
        // track the number of records written to the log
        // 将请求添加到事务日志中，注意此时并没有落盘
        if (zks.getZKDatabase().append(si)) {
          // 增加日志计数
          logCount++;
          // 当前尚未flush到磁盘的日志个数超过阈值，开始滚动事务日志并且进行快照操作
          if (logCount > (snapCount / 2 + randRoll)) {
            randRoll = r.nextInt(snapCount/2);
            // roll the log
            // 滚动事务日志
            zks.getZKDatabase().rollLog();
            // take a snapshot
            // 进行快照，如果上一次没有执行完，本次会跳过
            if (snapInProcess != null && snapInProcess.isAlive()) {
              LOG.warn("Too busy to snap, skipping");
            } else {
              // 启动快照线程
              snapInProcess = new ZooKeeperThread("Snapshot Thread") {
                public void run() {
                  try {
                    zks.takeSnapshot();
                  } catch(Exception e) {
                    LOG.warn("Unexpected exception", e);
                  }
                }
              };
              snapInProcess.start();
            }
            // 重置事务计数
            logCount = 0;
          }
        } else if (toFlush.isEmpty()) {
          // optimization for read heavy workloads
          // iff this is a read, and there are no pending
          // flushes (writes), then just pass this to the next
          // processor
          if (nextProcessor != null) {
            nextProcessor.processRequest(si);
            if (nextProcessor instanceof Flushable) {
              ((Flushable)nextProcessor).flush();
            }
          }
          continue;
        }
        // 当前日志已经添加到事务日志，但是没有flush到磁盘，添加到toFlush队列中，等待flush到磁盘
        toFlush.add(si);
        // 如果待flush日志记录个数大于1000，立即触发flush操作
        if (toFlush.size() > 1000) {
          flush(toFlush);
        }
      }
    }
  } catch (Throwable t) {
    handleException(this.getName(), t);
  } finally{
    running = false;
  }
  LOG.info("SyncRequestProcessor exited!");
}
```

## flush

```java
private void flush(LinkedList<Request> toFlush)
        throws IOException, RequestProcessorException
{
  // 待flush队列为空，不flush
  if (toFlush.isEmpty())
    return;
  // 将日志flush到磁盘
  zks.getZKDatabase().commit();
  // 将已经同步到磁盘中的日志交给nextProcessor
  while (!toFlush.isEmpty()) {
    Request i = toFlush.remove();
    if (nextProcessor != null) {
      nextProcessor.processRequest(i);
    }
  }
  if (nextProcessor != null && nextProcessor instanceof Flushable) {
    ((Flushable)nextProcessor).flush();
  }
}
```

## 总结

## 主流程

处理主流程如下：

**1、** 将到来的请求添加到queuedRequests队列中；

**2、** 不断从queuedRequests取出请求，将请求添加到事务日志中（此时并没有落盘），然后将该请求添加到toFlush队列中，等待落盘；

**3、** 当满足落盘条件时，会进行落盘操作，并将toFlush中的请求交给nextProcessor，清空toFlush；

在上述处理过程中，会不断进行事务日志落盘、滚动事务日志和快照，下面看下三个操作的触发时机

## 落盘时机

**1、** queuedRequests队列为空但是toFlush队列不为空，此时会进行落盘；

**2、** toFlush中待落盘请求个数大于1000，此时会进行落盘；

## 滚动事务日志时机

计算滚动日志数量阈值(snapCount + random(snapCount/2))

当距离上一次滚动累计日志数量大于上述阈值时，进行滚动

## 快照时机

计算快照日志数量阈值(snapCount + random(snapCount/2))

当距离上一次滚动累计日志数量大于上述阈值时并且上一次快照已经执行完毕，进行滚动

## AckRequestProcessor

AckRequestProcessor比较简单，就是向leader发送对事务的ack

```java
class AckRequestProcessor implements RequestProcessor {
    private static final Logger LOG = LoggerFactory.getLogger(AckRequestProcessor.class);
    Leader leader;
    AckRequestProcessor(Leader leader) {
        this.leader = leader;
    }
    /**
     * Forward the request as an ACK to the leader
     */
    public void processRequest(Request request) {
        QuorumPeer self = leader.self;
        if(self != null)
            leader.processAck(self.getId(), request.zxid, null);
        else
            LOG.error("Null QuorumPeer");
    }
    public void shutdown() {
        // XXX No need to do anything
    }
}
```

下面看下Leader.processAck，该方法会在收到follower对proposal的ack响应后进行回调

```java
// Leader
synchronized public void processAck(long sid, long zxid, SocketAddress followerAddr) {
  if (!allowedToCommit) return; // last op committed was a leader change - from now on 
  // the new leader should commit        
  if (LOG.isTraceEnabled()) {
    LOG.trace("Ack zxid: 0x{}", Long.toHexString(zxid));
    for (Proposal p : outstandingProposals.values()) {
      long packetZxid = p.packet.getZxid();
      LOG.trace("outstanding proposal: 0x{}",
                Long.toHexString(packetZxid));
    }
    LOG.trace("outstanding proposals all");
  }
  if ((zxid & 0xffffffffL) == 0) {
    return;
  }
  if (outstandingProposals.size() == 0) {
    if (LOG.isDebugEnabled()) {
      LOG.debug("outstanding is 0");
    }
    return;
  }
  // 1. 上一个提交的事务的zxid大于当前处理的事务id
  // 因为顺序提交，因此认为当前事务已经提交
  if (lastCommitted >= zxid) {
    if (LOG.isDebugEnabled()) {
      LOG.debug("proposal has already been committed, pzxid: 0x{} zxid: 0x{}",
                Long.toHexString(lastCommitted), Long.toHexString(zxid));
    }
    // The proposal has already been committed
    return;
  }
  // 根据zxid获取具体的内容
  Proposal p = outstandingProposals.get(zxid);
  if (p == null) {
    LOG.warn("Trying to commit future proposal: zxid 0x{} from {}",
             Long.toHexString(zxid), followerAddr);
    return;
  }
  // 2. 增加ack计数
  p.addAck(sid);        
  // 3. 尝试提交
  boolean hasCommitted = tryToCommit(p, zxid, followerAddr);
  if (hasCommitted && p.request!=null && p.request.getHdr().getType() == OpCode.reconfig){
    long curZxid = zxid;
    while (allowedToCommit && hasCommitted && p!=null){
      curZxid++;
      p = outstandingProposals.get(curZxid);
      if (p !=null) hasCommitted = tryToCommit(p, curZxid, null);             
    }
  }
}
```

```java
synchronized public boolean tryToCommit(Proposal p, long zxid, SocketAddress followerAddr) {
  // 1. 上一个事务还没有提交，因为需要按顺序提交，因此不提交当前事务
  if (outstandingProposals.containsKey(zxid - 1)) return false;
  // in order to be committed, a proposal must be accepted by a quorum.
  //
  // getting a quorum from all necessary configurations.
  // 2. 判断是否过半确认
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
  // 3. 从待提交队列中移除
  outstandingProposals.remove(zxid);
  if (p.request != null) {
    // 4. 放入toBeApplied队列中
    toBeApplied.add(p);
  }
  if (p.request == null) {
    LOG.warn("Going to commmit null: " + p);
  } else if (p.request.getHdr().getType() == OpCode.reconfig) {
    LOG.debug("Committing a reconfiguration! " + outstandingProposals.size()); 
    //if this server is voter in new config with the same quorum address, 
    //then it will remain the leader
    //otherwise an up-to-date follower will be designated as leader. This saves
    //leader election time, unless the designated leader fails                             
    Long designatedLeader = getDesignatedLeader(p, zxid);
    //LOG.warn("designated leader is: " + designatedLeader);
    QuorumVerifier newQV = p.qvAcksetPairs.get(p.qvAcksetPairs.size()-1).getQuorumVerifier();
    self.processReconfig(newQV, designatedLeader, zk.getZxid(), true);
    if (designatedLeader != self.getId()) {
      allowedToCommit = false;
    }
    // we're sending the designated leader, and if the leader is changing the followers are 
    // responsible for closing the connection - this way we are sure that at least a majority of them 
    // receive the commit message.
    commitAndActivate(zxid, designatedLeader);
    informAndActivate(p, designatedLeader);
    //turnOffFollowers();
  } else {
    // 5. 更新lastCommited，并向follower发送Commit请求
    commit(zxid);
    // 6. 向observer发送Infom请求
    inform(p);
  }
  // 7. 向commitProcessor的committedRequests队列中添加请求
  zk.commitProcessor.commit(p.request);
  if(pendingSyncs.containsKey(zxid)){
    for(LearnerSyncRequest r: pendingSyncs.remove(zxid)) {
      sendSync(r);
    }               
  } 
  return  true;   
}
```

## CommitProcessor

CommitProcessor的主要作用是控制请求交给下一个processor的顺序

对于非事务请求，会直接交给下一个processor

对于事务请求，会按照请求被leader提交的顺序来交给下一个processor，前一个processor处理完，才会处理下一个

## 主要属性

```java
// 待处理的请求，上一个processor交给当前processor的请求
protected final LinkedBlockingQueue<Request> queuedRequests =
  new LinkedBlockingQueue<Request>();
// 被leader提交过的请求
protected final LinkedBlockingQueue<Request> committedRequests =
  new LinkedBlockingQueue<Request>();
// 当前等待被提交的请求，当从queuedRequests的头部取出请求，并且该请求需要被提交时，会设置到这个属性
protected final AtomicReference<Request> nextPending =
  new AtomicReference<Request>();
// 当前正在commit的请求
private final AtomicReference<Request> currentlyCommitting =
  new AtomicReference<Request>();
// 当前正在处理的请求个数
protected AtomicInteger numRequestsProcessing = new AtomicInteger(0);
RequestProcessor nextProcessor;
// 是否停止
protected volatile boolean stopped = true;
private long workerShutdownTimeoutMS;
// 工作线程池
protected WorkerService workerPool;
```

## 重要方法

## start

```java
public void start() {
  // 计算工作线程的个数
  // 默认情况下等于机器的核数
  int numCores = Runtime.getRuntime().availableProcessors();
  // 如果指定了zookeeper.commitProcessor.numWorkerThreads，那么使用该配置指定的值
  int numWorkerThreads = Integer.getInteger(
    ZOOKEEPER_COMMIT_PROC_NUM_WORKER_THREADS, numCores);
  workerShutdownTimeoutMS = Long.getLong(
    ZOOKEEPER_COMMIT_PROC_SHUTDOWN_TIMEOUT, 5000);
  LOG.info("Configuring CommitProcessor with "
           + (numWorkerThreads > 0 ? numWorkerThreads : "no")
           + " worker threads.");
  if (workerPool == null) {
    // 创建工作线程池
    workerPool = new WorkerService(
      "CommitProcWork", numWorkerThreads, true);
  }
  stopped = false;
  super.start();
}
```

## run

```java
// CommitProcessor
public void run() {
  Request request;
  try {
    while (!stopped) {
      synchronized(this) {
       	// 正在运行 &&
        // (待处理请求队列为空 || 当前有请求等待被commit || 当前有事务请求正在被处理） &&
        // (commited的请求队列为空 || 当前有请求正在被处理)
       	// 会调用wait的几种情况
        // 1. 待处理请求队列为空 && commited的请求队列为空 
        // 2. 待处理请求队列为空 && 当前有请求正在被处理
        // 3. 当前有请求等待被commit && commited的请求队列为空 
        // 4. 当前有请求等待被commit && 当前有请求正在被处理
        // 5. 当前有事务请求正在被处理 && commited的请求队列为空 
        // 6. 当前有事务请求正在被处理 && 当前有请求正在被处理
        while (
          !stopped &&
          ((queuedRequests.isEmpty() || isWaitingForCommit() || isProcessingCommit()) &&
           (committedRequests.isEmpty() || isProcessingRequest()))) {
          wait();
        }
      }
      // 正在运行 &&
      // 没有请求等待提交 &&
      // 没有请求正在处理
      // 任务队列中有待处理的请求
      while (!stopped && !isWaitingForCommit() &&
             !isProcessingCommit() &&
             (request = queuedRequests.poll()) != null) {
        // 判断是否需要等待对该请求的提交
        // 修改类操作需要等待提交
        if (needCommit(request)) {
          nextPending.set(request);
        } else {
          // 不需要等待提交，将请求交给nextProcessor处理
          sendToNextProcessor(request);
        }
      }
      // 走到这里代表
      // 有请求等待提交 ||
      // 有请求正在处理 ||
      // 任务队列中没有请求
      processCommitted();
    }
  } catch (Throwable e) {
    handleException(this.getName(), e);
  }
  LOG.info("CommitProcessor exited loop!");
}
```

```java
protected void processCommitted() {
  Request request;
  // 正在运行 && 没有请求正在被nextProcessor处理 && 有尚未处理的已提交请求
  if (!stopped && !isProcessingRequest() &&
      (committedRequests.peek() != null)) {
    if ( !isWaitingForCommit() && !queuedRequests.isEmpty()) {
      return;
    }
    // committedRequests中的请求按zxid有序排列
    request = committedRequests.poll();
    // 判断当前等待被提交的请求是否和当前已提交的最小事务id的请求是同一个
    Request pending = nextPending.get();
    if (pending != null &&
        pending.sessionId == request.sessionId &&
        pending.cxid == request.cxid) {
      // we want to send our version of the request.
      // the pointer to the connection in the request
      pending.setHdr(request.getHdr());
      pending.setTxn(request.getTxn());
      pending.zxid = request.zxid;
      // Set currentlyCommitting so we will block until this
      // completes. Cleared by CommitWorkRequest after
      // nextProcessor returns.
      // 将请求标志为正在处理
      currentlyCommitting.set(pending);
      // 清空等待被提交请求标志
      nextPending.set(null);
      // 交给下一个processor处理
      sendToNextProcessor(pending);
    } else {
      // this request came from someone else so just
      // send the commit packet
      currentlyCommitting.set(request);
      sendToNextProcessor(request);
    }
  }      
}
```

```java
// CommitProcessor
private void sendToNextProcessor(Request request) {
  // 增加正在处理请求计数
  numRequestsProcessing.incrementAndGet();
  // 任务线程池调度执行
  workerPool.schedule(new CommitWorkRequest(request), request.sessionId);
}
```

## WorkerPool.schedule

该方法用来调度CommitProcessor发送给nextProcessor的请求

```java
// WorkerPool
public void schedule(WorkRequest workRequest, long id) {
  if (stopped) {
    workRequest.cleanup();
    return;
  }
  // 1. 将请求封装成ScheduledWorkRequest
  ScheduledWorkRequest scheduledWorkRequest =
    new ScheduledWorkRequest(workRequest);
  // If we have a worker thread pool, use that; otherwise, do the work
  // directly.
  int size = workers.size();
  if (size > 0) {
    try {
      // make sure to map negative ids as well to [0, size-1]
      // 2. 这里的id是sessionId，因此来自同一个session的请求会分配给同一个工作线程
      int workerNum = ((int) (id % size) + size) % size;
      ExecutorService worker = workers.get(workerNum);
      // 3. 工作线程执行请求
      worker.execute(scheduledWorkRequest);
    } catch (RejectedExecutionException e) {
      LOG.warn("ExecutorService rejected execution", e);
      workRequest.cleanup();
    }
  } else {
    // When there is no worker thread pool, do the work directly
    // and wait for its completion
    scheduledWorkRequest.run();
  }
}
```

```java
// CommitWorkRequest
public void doWork() throws RequestProcessorException {
  try {
    // 1. 将请求交给nextProcessor处理
    nextProcessor.processRequest(request);
  } finally {
    // If this request is the commit request that was blocking
    // the processor, clear.
    // 2. 清空正在处理事务请求标记
    currentlyCommitting.compareAndSet(request, null);
    // 3. 减少当前正在处理的请求计数
    if (numRequestsProcessing.decrementAndGet() == 0) {
      if (!queuedRequests.isEmpty() ||
          !committedRequests.isEmpty()) {
        wakeup();
      }
    }
  }
}
```

## 总结

CommitProcessor关心需要被commit的请求，会按照leader commit的顺序来将请求交给下一个processor，从而确保请求会按照commit的顺序来处理

CommitProcessor会创建多个工作线程，将请求按照会话id来分配，从而确保相同的会话的请求分配给同一个工作者线程来处理，同一个会话的请求会在相同的线程上顺序执行

## ToBeApplicationRequestProcessor

## 主要属性

```java
// 下一个processor
private final RequestProcessor next;
// 领导者
private final Leader leader;
```

## 重要方法

## 构造方法

```java
// ToBeAppliedRequestProcessor
ToBeAppliedRequestProcessor(RequestProcessor next, Leader leader) {
  if (!(next instanceof FinalRequestProcessor)) {
    throw new RuntimeException(ToBeAppliedRequestProcessor.class
                               .getName()
                               + " must be connected to "
                               + FinalRequestProcessor.class.getName()
                               + " not "
                               + next.getClass().getName());
  }
  this.leader = leader;
  this.next = next;
}
```

## processRequest

```java
public void processRequest(Request request) throws RequestProcessorException {
  // 1. 将请求交给nextProcessor来处理
  next.processRequest(request);
  // The only requests that should be on toBeApplied are write
  // requests, for which we will have a hdr. We can't simply use
  // request.zxid here because that is set on read requests to equal
  // the zxid of the last write op.
  if (request.getHdr() != null) {
    long zxid = request.getHdr().getZxid();
    // 2. 将nextProcessor处理过的Proposal从toBeApplied队列中移除
    Iterator<Proposal> iter = leader.toBeApplied.iterator();
    if (iter.hasNext()) {
      Proposal p = iter.next();
      if (p.request != null && p.request.zxid == zxid) {
        iter.remove();
        return;
      }
    }
    LOG.error("Committed request not found on toBeApplied: "
              + request);
  }
}
```

## FinalRequestProcessor

FinalRequestProcessor是最后真正用来处理请求的processor，到达这里的事务请求都是已经被leader提交过的

## 重要方法

## processRequest

```java
public void processRequest(Request request) {
  // 省略
  synchronized (zks.outstandingChanges) {
    // Need to process local session requests
    // 1. 如果是事务性请求，会应用到内存数据库中
    rc = zks.processTxn(request);
    // request.hdr is set for write requests, which are the only ones
    // that add to outstandingChanges.
    // 2. 只有事务性请求的hdr不为空，非事务性请求的hdr为空，这里的逻辑可以看PrepRequestProcessor
    // 将zxid小于等于当前请求的记录从outstandingChanges和outstandingChangesForPath移除
    if (request.getHdr() != null) {
      TxnHeader hdr = request.getHdr();
      Record txn = request.getTxn();
      long zxid = hdr.getZxid();
      while (!zks.outstandingChanges.isEmpty()
             && zks.outstandingChanges.peek().zxid <= zxid) {
        ChangeRecord cr = zks.outstandingChanges.remove();
        if (cr.zxid < zxid) {
          LOG.warn("Zxid outstanding " + cr.zxid
                   + " is less than current " + zxid);
        }
        if (zks.outstandingChangesForPath.get(cr.path) == cr) {
          zks.outstandingChangesForPath.remove(cr.path);
        }
      }
    }
    // do not add non quorum packets to the queue.
    // 3. 当前请求是事务性请求，加入到内存数据库的队列中，加快follower的同步
    if (request.isQuorum()) {
      zks.getZKDatabase().addCommittedProposal(request);
    }
  }
 	// 省略
  try {
    if (request.getHdr() != null && request.getHdr().getType() == OpCode.error) {
      /*
                 * When local session upgrading is disabled, leader will
                 * reject the ephemeral node creation due to session expire.
                 * However, if this is the follower that issue the request,
                 * it will have the correct error code, so we should use that
                 * and report to user
                 */
      if (request.getException() != null) {
        throw request.getException();
      } else {
        throw KeeperException.create(KeeperException.Code
                                     .get(((ErrorTxn) request.getTxn()).getErr()));
      }
    }
    KeeperException ke = request.getException();
    if (ke != null && request.type != OpCode.multi) {
      throw ke;
    }
    if (LOG.isDebugEnabled()) {
      LOG.debug("{}",request);
    }
    // 4. 不同类型请求不同处理方式
    switch (request.type) {
    	// 省略
    }
  } catch (SessionMovedException e) {
    // session moved is a connection level error, we need to tear
    // down the connection otw ZOOKEEPER-710 might happen
    // ie client on slow follower starts to renew session, fails
    // before this completes, then tries the fast follower (leader)
    // and is successful, however the initial renew is then
    // successfully fwd/processed by the leader and as a result
    // the client and leader disagree on where the client is most
    // recently attached (and therefore invalid SESSION MOVED generated)
    cnxn.sendCloseSession();
    return;
  } catch (KeeperException e) {
    err = e.code();
  } catch (Exception e) {
    // log at error level as we are returning a marshalling
    // error to the user
    LOG.error("Failed to process " + request, e);
    StringBuilder sb = new StringBuilder();
    ByteBuffer bb = request.request;
    bb.rewind();
    while (bb.hasRemaining()) {
      sb.append(Integer.toHexString(bb.get() & 0xff));
    }
    LOG.error("Dumping request buffer: 0x" + sb.toString());
    err = Code.MARSHALLINGERROR;
  }
  // 5. 发送响应
  long lastZxid = zks.getZKDatabase().getDataTreeLastProcessedZxid();
  ReplyHeader hdr =
    new ReplyHeader(request.cxid, lastZxid, err.intValue());
  zks.serverStats().updateLatency(request.createTime);
  cnxn.updateStatsForResponse(request.cxid, lastZxid, lastOp,
                              request.createTime, Time.currentElapsedTime());
  try {
    cnxn.sendResponse(hdr, rsp, "response");
    if (request.type == OpCode.closeSession) {
      cnxn.sendCloseSession();
    }
  } catch (IOException e) {
    LOG.error("FIXMSG",e);
  }
}
```

## 处理不同类型的请求

## ping#

```java
case OpCode.ping: {
  // 1. 更新请求的延迟统计数据，请求的延迟为请求创建到请求处理之间的时间
  // 主要会更新总延迟，延迟的最小值，延迟的最大值
  zks.serverStats().updateLatency(request.createTime);
  lastOp = "PING";
  // 2. 更新响应
  cnxn.updateStatsForResponse(request.cxid, request.zxid, lastOp,
                              request.createTime, Time.currentElapsedTime());
	// 3. 发送响应
  cnxn.sendResponse(new ReplyHeader(-2,
                                    zks.getZKDatabase().getDataTreeLastProcessedZxid(), 0), null, "response");
  return;
}
```

## create

```java
case OpCode.create: {
  lastOp = "CREA";
  // 1. 创建响应
  rsp = new CreateResponse(rc.path);
  // 2. 事务性请求，请求已经在之前的步骤中应用到了内存数据库中，这里提取错误码
  err = Code.get(rc.err);
  break;
}
```

## getData#

```java
case OpCode.getData: {
  lastOp = "GETD";
  GetDataRequest getDataRequest = new GetDataRequest();
  ByteBufferInputStream.byteBuffer2Record(request.request,
                                          getDataRequest);
  // 1. 从内存数据库中查询
  DataNode n = zks.getZKDatabase().getNode(getDataRequest.getPath());
  if (n == null) {
    throw new KeeperException.NoNodeException();
  }
  // 2. 校验acl
  PrepRequestProcessor.checkACL(zks, zks.getZKDatabase().aclForNode(n),
                                ZooDefs.Perms.READ,
                                request.authInfo);
  Stat stat = new Stat();
  byte b[] = zks.getZKDatabase().getData(getDataRequest.getPath(), stat,
                                         getDataRequest.getWatch() ? cnxn : null);
  // 3. 生成响应
  rsp = new GetDataResponse(b, stat);
  break;
}
```

## Follower

```java
RequestProcessor finalProcessor = new FinalRequestProcessor(this);
commitProcessor = new CommitProcessor(finalProcessor,
                                      Long.toString(getServerId()), true, getZooKeeperServerListener());
commitProcessor.start();
firstProcessor = new FollowerRequestProcessor(this, commitProcessor);
((FollowerRequestProcessor) firstProcessor).start();
syncProcessor = new SyncRequestProcessor(this,
                                         new SendAckRequestProcessor((Learner)getFollower()));
syncProcessor.start();
```

下面按照Follower处理链的来看下

FollowerRequestProcessor -> CommitProcessor ->FinalRequestProcessor

Follower相对Leader来说简单很多，主要是将事务性请求转发给leader处理

当收到该请求的COMMIT请求后，会将该请求交给FinalRequestProcessor来处理

## FollowerRequestProcessor

## 主要属性

```java
// 服务器
FollowerZooKeeperServer zks;
// 下一个请求处理器
RequestProcessor nextProcessor;
// 待处理请求
LinkedBlockingQueue<Request> queuedRequests = new LinkedBlockingQueue<Request>();
// 是否关闭
boolean finished = false;
```

## 重要方法

## processRequest

```java
// FollowerRequestProcessor
public void processRequest(Request request) {
  if (!finished) {
    // Before sending the request, check if the request requires a
    // global session and what we have is a local session. If so do
    // an upgrade.
    Request upgradeRequest = null;
    try {
      upgradeRequest = zks.checkUpgradeSession(request);
    } catch (KeeperException ke) {
      if (request.getHdr() != null) {
        request.getHdr().setType(OpCode.error);
        request.setTxn(new ErrorTxn(ke.code().intValue()));
      }
      request.setException(ke);
      LOG.info("Error creating upgrade request",  ke);
    } catch (IOException ie) {
      LOG.error("Unexpected error in upgrade", ie);
    }
    if (upgradeRequest != null) {
      queuedRequests.add(upgradeRequest);
    }
    // 将请求添加到队列中
    queuedRequests.add(request);
  }
}
```

## run

```java
// FollowerRequestProcessor
public void run() {
  try {
    while (!finished) {
      Request request = queuedRequests.take();
      if (LOG.isTraceEnabled()) {
        ZooTrace.logRequest(LOG, ZooTrace.CLIENT_REQUEST_TRACE_MASK,
                            'F', request, "");
      }
      if (request == Request.requestOfDeath) {
        break;
      }
      // We want to queue the request to be processed before we submit
      // the request to the leader so that we are ready to receive
      // the response
      // 1. 交给下一个processor
      nextProcessor.processRequest(request);
      // We now ship the request to the leader. As with all
      // other quorum operations, sync also follows this code
      // path, but different from others, we need to keep track
      // of the sync operations this follower has pending, so we
      // add it to pendingSyncs.
      // 2. 不同类型请求不同处理方式
      switch (request.type) {
        case OpCode.sync:
          zks.pendingSyncs.add(request);
          zks.getFollower().request(request);
          break;
        case OpCode.create:
        case OpCode.create2:
        case OpCode.createTTL:
        case OpCode.createContainer:
        case OpCode.delete:
        case OpCode.deleteContainer:
        case OpCode.setData:
        case OpCode.reconfig:
        case OpCode.setACL:
        case OpCode.multi:
        case OpCode.check:
          // 事务性请求转发给leader来处理
          zks.getFollower().request(request);
          break;
        case OpCode.createSession:
        case OpCode.closeSession:
          // Don't forward local sessions to the leader.
          if (!request.isLocalSession()) {
            zks.getFollower().request(request);
          }
          break;
      }
    }
  } catch (Exception e) {
    handleException(this.getName(), e);
  }
  LOG.info("FollowerRequestProcessor exited loop!");
}
```

## CommitProcessor

CommitProcessor之前已经介绍过了，这里主要看下其commit方法什么时候调用

```java
// FollowerZookeeperServer
public void commit(long zxid) {
  if (pendingTxns.size() == 0) {
    LOG.warn("Committing " + Long.toHexString(zxid)
             + " without seeing txn");
    return;
  }
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

```java
// Follower
protected void processPacket(QuorumPacket qp) {
  // 省略
  case Leader.COMMIT:
  fzk.commit(qp.getZxid());
  break;
}
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
    QuorumServer leaderServer = findLeader();            
    try {
      connectToLeader(leaderServer.addr, leaderServer.hostname);
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
      syncWithLeader(newEpochZxid);                
      QuorumPacket qp = new QuorumPacket();
      while (this.isRunning()) {
        readPacket(qp);
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

从上面的代码可以看出，当Follower接收到leader的COMMIT请求后，会调用CommitProcessor.commit方法

## SyncRequestProcessor

从FollowerRequestProcessor的setupRequestProcessors中可以看出，也启动了SyncRequestProcessor，但是并没有将其加入到处理链中，下面主要看下其在哪里调用

```java
// Follower
protected void processPacket(QuorumPacket qp) throws Exception{
  // 省略
  switch (qp.getType()) {
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
  // 省略
}
```

```java
// FollowerZookeeperServer
public void logRequest(TxnHeader hdr, Record txn) {
  Request request = new Request(hdr.getClientId(), hdr.getCxid(), hdr.getType(), hdr, txn, hdr.getZxid());
  if ((request.zxid & 0xffffffffL) != 0) {
    pendingTxns.add(request);
  }
  // 记录事务日志、快照等操作
  syncProcessor.processRequest(request);
}
```

从上面的代码可以看出，每次Follower收到Leader发来的Proposal请求时，会调用SyncRequestProcessor来将该事务日志落盘

## 总结

经过上面Leader和Follower的请求处理器链中的各个请求处理器，可以发现，Leader提交事务使用的是两阶段提交:

**1、** Leader向Follower发送Proposal请求；

**2、** Follower接收到Proposal请求，将事务日志落盘，然后发送ack请求；

**3、** Leader当接收到过半的ack请求时，将请求应用到本地内存数据库中，并向Follower发送COMMIT请求；

**4、** Follower收到COMMIT请求后，也会将请求变更应用到本地内存数据库中；

> 版权声明：「DDKK.COM 弟弟快看，程序员编程资料站」本站文章，版权归原作者所有
