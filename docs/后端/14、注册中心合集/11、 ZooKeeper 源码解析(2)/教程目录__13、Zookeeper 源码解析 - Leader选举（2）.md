# 13、Zookeeper 源码解析 - Leader选举（2）
- 来源：https://ddkk.com/zhuanlan/registered/zookeeper/2/13.html
- 分类：注册中心
- 分组：教程目录
### 一、QuorumPeer的run方法

[前文](/zhuanlan/registered/zookeeper/2/12.html)，只是为Leader选举做好前期准备，但是还没触发选举过程，在start方法中，调用完startLeaderElection()后，会启动QuorumPeer线程，接下来我们就从他的run方法入手。

```java
public void run() {
try {
    while (running) {
        switch (getPeerState()) {
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

省略了部分代码，在这里我们只需要关心初始状态下的调用，也就是LOOKING下的调用：

```java
setCurrentVote(makeLEStrategy().lookForLeader());
```

从名称上看，这就是Leader选举触发的入口方法，实际调用的就是FastLeaderElection的lookForLeader方法。

```java
public Vote lookForLeader() throws InterruptedException {
    self.start_fle = Time.currentElapsedTime();
    try {
    //初始化两个集合
        Map<Long, Vote> recvset = new HashMap<Long, Vote>();
        Map<Long, Vote> outofelection = new HashMap<Long, Vote>();
        int notTimeout = minNotificationInterval;
        synchronized (this) {
            logicalclock.incrementAndGet();
            //首先更新当前选票为本节点
            updateProposal(getInitId(), getInitLastLoggedZxid(), getPeerEpoch());
        }
         /*
         * 开始发送通知信息，也就是把自己的选票发送给其它节点，封装成ToSend实体，然后添加到sendqueue
         * 发送线程去消费这个队列，并转交给Listener中的发送线程去发送，我们知道Listener初始化的时候，只是开启了端口监听
         * 此时收发线程还没有创建，所以QuorumCnxManager的toSend方法，就会调用connectOne(sid)方法去建立连接
         * 如果集群中已经有节点启动，那么就会建立相应的连接关系
         */
        sendNotifications();
        SyncedLearnerTracker voteSet;
        //循环执行
        while ((self.getPeerState() == ServerState.LOOKING) && (!stop)) {
           //此时会接收到其它节点的选票信息
            Notification n = recvqueue.poll(notTimeout, TimeUnit.MILLISECONDS);
            if (n == null) {
                if (manager.haveDelivered()) {
                    sendNotifications();
                } else {
                    manager.connectAll();
                }
                int tmpTimeOut = notTimeout * 2;
                notTimeout = Math.min(tmpTimeOut, maxNotificationInterval);
                //首先判断是否是合法选票
            } else if (validVoter(n.sid) && validVoter(n.leader)) {
                switch (n.state) {
                case LOOKING:
                    //如果当前选票的epoch大于已选节点
                    if (n.electionEpoch > logicalclock.get()) {
                       //设置logicalclock为当前选票
                        logicalclock.set(n.electionEpoch);
                        recvset.clear();
                        //首先根据Epoch计算，如果Epoch相等，再判断zxid，如果再相等再计算sid
                        if (totalOrderPredicate(n.leader, n.zxid, n.peerEpoch, getInitId(), getInitLastLoggedZxid(), getPeerEpoch())) {
                            //如果是当前选票要比已选节点新，更新已选节点为当前选票
                            updateProposal(n.leader, n.zxid, n.peerEpoch);
                        } else {
                            //否则更新为已选节点
                            updateProposal(getInitId(), getInitLastLoggedZxid(), getPeerEpoch());
                        }
                        //把当前选票结果通知给其它节点
                        sendNotifications();
                    } else if (n.electionEpoch < logicalclock.get()) {
                        //如果当前选票比已选结果小，则日志记录即可
                        break;
                        //如果当前选票的electionEpoch与已选相等，那么判断是否需要更新当前已选结果
                    } else if (totalOrderPredicate(n.leader, n.zxid, n.peerEpoch, proposedLeader, proposedZxid, proposedEpoch)) {
                        updateProposal(n.leader, n.zxid, n.peerEpoch);
                        sendNotifications();
                    }
                    // 记录当前收到的选票
                    recvset.put(n.sid, new Vote(n.leader, n.zxid, n.electionEpoch, n.peerEpoch));
                   //实例化选票追踪器
                    voteSet = getVoteTracker(recvset, new Vote(proposedLeader, proposedZxid, logicalclock.get(), proposedEpoch));
                   //此时会判断是否有过半节点同意了已选选票
                    if (voteSet.hasAllQuorums()) {
                       //如果是
                        while ((n = recvqueue.poll(finalizeWait, TimeUnit.MILLISECONDS)) != null) {
                            if (totalOrderPredicate(n.leader, n.zxid, n.peerEpoch, proposedLeader, proposedZxid, proposedEpoch)) {
                                recvqueue.put(n);
                                break;
                            }
                        }
                      //如果已经选举完成
                        if (n == null) {
                           //设置当前状态为，如果选举出来的选票是本节点，设置本节点的状态是Leader，否则根据是否是参与者，设置为Follower或者Observer
                            setPeerState(proposedLeader, voteSet);
                            Vote endVote = new Vote(proposedLeader, proposedZxid, logicalclock.get(), proposedEpoch);                 //清空当前的recvqueue队列
                            leaveInstance(endVote);
                            return endVote;
                        }
                    }
                    break;
                case OBSERVING:
                    break;
                case FOLLOWING:
                case LEADING:
                 //如果是崩溃回复重新选举，也是一样的思路
                    if (n.electionEpoch == logicalclock.get()) {
                        recvset.put(n.sid, new Vote(n.leader, n.zxid, n.electionEpoch, n.peerEpoch, n.state));
                        voteSet = getVoteTracker(recvset, new Vote(n.version, n.leader, n.zxid, n.electionEpoch, n.peerEpoch, n.state));
                        if (voteSet.hasAllQuorums() && checkLeader(recvset, n.leader, n.electionEpoch)) {
                            setPeerState(n.leader, voteSet);
                            Vote endVote = new Vote(n.leader, n.zxid, n.electionEpoch, n.peerEpoch);
                            leaveInstance(endVote);
                            return endVote;
                        }
                    }
                    //都是进行过半选举
                    outofelection.put(n.sid, new Vote(n.version, n.leader, n.zxid, n.electionEpoch, n.peerEpoch, n.state));
                    voteSet = getVoteTracker(outofelection, new Vote(n.version, n.leader, n.zxid, n.electionEpoch, n.peerEpoch, n.state));
                    if (voteSet.hasAllQuorums() && checkLeader(outofelection, n.leader, n.electionEpoch)) {
                        synchronized (this) {
                            logicalclock.set(n.electionEpoch);
                            setPeerState(n.leader, voteSet);
                        }
                        Vote endVote = new Vote(n.leader, n.zxid, n.electionEpoch, n.peerEpoch);
                        leaveInstance(endVote);
                        return endVote;
                    }
                    break;
                default:
                    break;
                }
            } else {
                if (!validVoter(n.leader)) {
                }
                if (!validVoter(n.sid)) {
                }
            }
        }
        return null;
    } finally {
    }
}
```

### 二、流程梳理

Leader选举，集群中每个节点，先把选票投给自己，发送给集群中其它节点，此时会有三个值epoch、zxid、sid，选举leader也是通过这三个值，epoch已经分析过，代表系统中最新的全局唯一提案id，zxid表示最新的事务id、sid是节点自身的myid，首先根据epoch判断，把票投给最大的epoch，如果相等，按照zxid，最后才是myid，所以集群第一次启动的时候，leader节点往往会是myid最大的那台服务器，集群中达半数以上节点都投给一个节点，那么可以选举这个节点为Leader节点，其余为Follower或Observer节点（其中Observer节点不参与投票）。

选举算法理解起来并不难，但是整个通信过程相对比较复杂，前文知道，节点中相互通信是通过Listener来实现，在FastLeaderElection中又开启了一个收发工作线程来处理通信数据。简单理解就是FastLeaderElection中的收发工作线程，就是用来接收和发送选票，Listener中的收发线程是用来实际通信。具体通信流程如下：

**1、** lookForLeader()方法开启Leader选举，此时会先调用sendNotifications()方法，这个方法会把自己选票，封装成n个ToSend对象（n表示集群中节点个数），然后添加到sendqueue发送队列中；

**2、** 此时FastLeaderElection的发送线程，就会不断从sendqueue队列中取出选票，然后封装成ByteBuffer对象，再调用QuorumCnxManager的toSend方法，这个方法会把ByteBuffer添加到queueSendMap集合中，这个集合键值是sid我们知道初始状态下Listener只是在进行端口监听，通信链路还没建立，所以此时会主动去调用connectOne(sid)方法去建立通信链路sendqueue队列消费完成，也意味着当前的通信链路也建立了起来；

**3、** 我们知道Listener中的SendWorker线程会不断的从queueSendMap队列中取值，每个sid都会对应一个SendWorker，也就是选票最终都是通过SendWorker发送出去，此时每个节点都会向其他节点发送选票；

**4、** SendWorker对应的就是RecvWorker，RecvWorker可以不断的接收来自其它节点的选票，封装成Message然后添加到阻塞队列recvQueue中；

**5、** FastLeaderElection中接收线程WorkerReceiver，会不断的从recvQueue队列中取出选票，然后封装成Notification对象，如果当前是在进行Leader选举且本节点状态是LOOLING，那么把当前的Notification添加到recvqueue队列中，并且对当前选票跟已选结果进行比较，如果已选结果胜出，那么把已选结果封装成ToSend对象，添加到sendqueue，发送给其它节点如果本节点不是LOOKING状态，而选票节点是LOOKING状态，那么表示本节点要比选票节点要新，也就是会把本节点的票投出去，添加到sendqueue队列中；

**6、** sendNotifications()执行完继续执行，此时lookForLeader()方法中会从recvqueue队列中取出Notification对象，然后根据当前选票判断是否需要更新当前选票，然后把投票结果发送出去，如果当前选票得票数已经过半，那么会通过while循环不断的从recvqueue队列中取出Notification对象，然后跟当前选票进行比较，如果还有更新的票，那么继续添加到recvqueue队列中，退出while循环，如果此时没有更新的票，那么表示当前选出来的节点可以作为Leader节点，然后根据当选票据，设置对应的节点状态，然后清空recvqueue队列，方法返回；

### 三、总结

本文大致分析和总结了集群启动时，Leader的选举过程，以及相应的通信链路的建立，接下来我们将分析，集群模式下数据的处理执行过程，当Leader崩溃或者集群中Follower节点已经过半宕机，那么怎么进行数据恢复。

以上，有任何不对的地方，请留言指正，敬请谅解。
