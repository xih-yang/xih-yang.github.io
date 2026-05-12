# 15、Zookeeper 源码解析 - 集群下Follower数据处理流程
- 来源：https://ddkk.com/zhuanlan/registered/zookeeper/2/15.html
- 分类：注册中心
- 分组：教程目录
### 一、Follower

Follower节点在集群中会参与投票以及Leader选举，同样会转发事务请求给Leader节点，然后通过Leader发起的投票进行表决，通过后提交当前事务。如果是写请求直接执行操作。与Observer节点不一样的地方在于Follower会参与投票和Leader选举。

QuorumPeer的run方法中会根据当前的状态是FOLLOWING执行对应的操作

```java
setFollower(makeFollower(logFactory));
follower.followLeader();
```

followLeader()的处理流程和Observer中的处理流程一致，先找到Leader节点地址，把自己注册到Leader节点上，然后同步Leader节点上的数据保持与Leader数据一致性。接下来也是循环的读取和处理Leader的消息。主要的不同在于processPacket方法。

```java
protected void processPacket(QuorumPacket qp) throws Exception {
    switch (qp.getType()) {
    case Leader.PING:
    //维持心跳
        ping(qp);
        break;
    //如果Leader发送的消息PROPOSAL（提案）
    case Leader.PROPOSAL:
        ServerMetrics.getMetrics().LEARNER_PROPOSAL_RECEIVED_COUNT.add(1);
        TxnLogEntry logEntry = SerializeUtils.deserializeTxn(qp.getData());
        TxnHeader hdr = logEntry.getHeader();
        Record txn = logEntry.getTxn();
        TxnDigest digest = logEntry.getDigest();
        if (hdr.getZxid() != lastQueued + 1) {
            LOG.warn(
                "Got zxid 0x{} expected 0x{}",
                Long.toHexString(hdr.getZxid()),
                Long.toHexString(lastQueued + 1));
        }
        lastQueued = hdr.getZxid();
        if (hdr.getType() == OpCode.reconfig) {
            SetDataTxn setDataTxn = (SetDataTxn) txn;
            QuorumVerifier qv = self.configFromString(new String(setDataTxn.getData(), UTF_8));
            self.setLastSeenQuorumVerifier(qv, true);
        }
      //针对当前PROPOSAL进行日志记录，但不提交到数据库中，并把当前的PROPOSAL添加到pendingTxns队列中，
        fzk.logRequest(hdr, txn, digest);
        break;
    case Leader.COMMIT: //如果是提交操作
        //执行提交操作，也就是调用FinalRequestProcessor进行数据持久化
        fzk.commit(qp.getZxid());
        break;
    case Leader.COMMITANDACTIVATE:
        //执行config信息的提交操作
        fzk.commit(zxid);
        break;
    case Leader.UPTODATE:
        break;
    case Leader.REVALIDATE:
        if (om == null || !om.revalidateLearnerSession(qp)) {
            revalidate(qp);
        }
        break;
    case Leader.SYNC:
        //执行同步操作
        fzk.sync();
        break;
    default:
        break;
    }
}
```

processPacket处理逻辑是接收Leader的Proposal，进行日志记录，等待Leader的commit命令吗，执行提交操作。

### 二、客户端请求

经过之前的分析知道，客户端请求最终会提交给firstProcessor来处理，此时我们看看FollowerZooKeeperServer中是如何初始化Processor的。

```java
protected void setupRequestProcessors() {
    //Final是执行持久化操作
    RequestProcessor finalProcessor = new FinalRequestProcessor(this);
    //CommitProcessor把当前的事务性操作提交给Final对象
    commitProcessor = new CommitProcessor(finalProcessor, Long.toString(getServerId()), true, getZooKeeperServerListener());
    commitProcessor.start();
    //FollowerRequestProcessor是处理入口
    firstProcessor = new FollowerRequestProcessor(this, commitProcessor);
    ((FollowerRequestProcessor) firstProcessor).start();
    //SyncRequestProcessor是针对Proposal进行日志记录，并通过SendAckRequestProcessor响应一个ACK给Leader
    syncProcessor = new SyncRequestProcessor(this, new SendAckRequestProcessor(getFollower()));
    syncProcessor.start();
}
```

此时FollowerRequestProcessor中的processRequest方法也是把请求添加到queuedRequests队列中，其run方法也是把当的请求转发给下一个Processor，并且针对事务性操作转发给Leader节点，此时CommitProcessor操作和Observer中是一样的逻辑，就不进行分析。

### 四、总结

Follower的处理流程和Observer的区别，从源码角度来说，他们都会把事务性请求转发给Leader节点，但是Observer节点不会接收到Leader节点发送的Proposal，也不参与Proposal的表决，只会接收Leader端的INFORM信息然后提交数据，Follower会接收来自Leader的Proposal，然后进行响应，服务端通过表决，发送commit命令给Follower，Follower收到后执行提交操作，然后响应给Leader。

以上，有任何不对的地方，请留言指正，敬请谅解。
