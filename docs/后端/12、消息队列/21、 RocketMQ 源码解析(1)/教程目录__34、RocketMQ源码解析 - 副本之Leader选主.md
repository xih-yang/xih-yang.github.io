# 34、RocketMQ源码解析 - 副本之Leader选主
- 来源：https://ddkk.com/zhuanlan/mq/rocketmq/1/34.html
- 分类：消息队列
- 分组：教程目录
本文将按照《RocketMQ 多副本前置篇：初探raft协议》 的思路来学习RocketMQ选主逻辑。首先先回顾一下关于Leader的一些思考：

**1、** 节点状态；

需要引入3种节点状态：Follower(跟随者)、Candidate(候选者)，该状态下的节点会发起投票请求，Leader(主节点)。
**2、** 选举计时器；

Follower、Candidate两个状态时，需要维护一个定时器，每次定时时间从150ms-300ms直接进行随机，即每个节点的定时过期不一样，Follower状态时，定时器到点后，触发一轮投票。节点在收到投票请求、Leader的心跳请求并作出响应后，需要重置定时器。
**3、** 投票轮次Team；

Candidate状态的节点，每发起一轮投票，Team加一。
**4、** 投票机制；

每一轮一个节点只能为一个节点投赞成票，例如节点A中维护的轮次为3，并且已经为节点B投了赞成票，如果收到其他节点，投票轮次为3，则会投反对票，如果收到轮次为4的节点，是又可以投赞成票的。
**5、** 成为Leader的条件；

必须得到集群中初始数量的大多数，例如如果集群中有3台，则必须得到两票，如果其中一台服务器宕机，剩下的两个节点，还能进行选主吗？答案是可以的，因为可以得到2票，超过初始集群中3的一半，所以通常集群中的机器各位尽量为奇数，因为4台的可用性与3台的一样。

> 温馨提示：本文是从源码的角度分析 DLedger 选主实现原理，可能比较鼓噪，文末给出了选主流程图。

## 1、DLedger关于选主的核心类图

### 1.1 DLedgerConfig

多副本模块相关的配置信息，例如集群节点信息。

### 1.2 MemberState

节点状态机，即raft协议中的follower、candidate、leader三种状态的状态机实现。

### 1.3 raft协议相关

#### 1.3.1 DLedgerClientProtocol

DLedger客户端协议，主要定义如下三个方法，在后面的日志复制部分会重点阐述。

- CompletableFuture`` get(GetEntriesRequest request)

客户端从服务器获取日志条目（获取数据）
- CompletableFuture`` append(AppendEntryRequest request)

客户端向服务器追加日志（存储数据）
- CompletableFuture`` metadata(MetadataRequest request)

获取元数据。

#### 1.3.2 DLedgerProtocol

DLedger服务端协议，主要定义如下三个方法。

- CompletableFuture`` vote(VoteRequest request)

发起投票请求。
- CompletableFuture`` heartBeat(HeartBeatRequest request)

Leader向从节点发送心跳包。
- CompletableFuture`` pull(PullEntriesRequest request)

拉取日志条目，在日志复制部分会详细介绍。
- CompletableFuture`` push(PushEntryRequest request)

推送日志条件，在日志复制部分会详细介绍。

#### 1.3.3 协议处理Handler

DLedgerClientProtocolHandler、DLedgerProtocolHander协议处理器。

### 1.4 DLedgerRpcService

DLedger Server(节点)之间的网络通信，默认基于Netty实现，其实现类为：DLedgerRpcNettyService。

### 1.5 DLedgerLeaderElector

Leader选举实现器。

### 1.6 DLedgerServer

Dledger Server，Dledger节点的封装类。

接下来将从DLedgerLeaderElector开始剖析DLedger是如何实现Leader选举的。（基于raft协议）。

## 2、源码解析Leader选举

### 2.1 DLedgerLeaderElector 类图

我们先一一来介绍其属性的含义：

- Random random

随机数生成器，对应raft协议中选举超时时间是一随机数。
- DLedgerConfig dLedgerConfig

配置参数。
- MemberState memberState

节点状态机。
- DLedgerRpcService dLedgerRpcService

rpc服务，实现向集群内的节点发送心跳包、投票的RPC实现。

l- ong lastLeaderHeartBeatTime

上次收到心跳包的时间戳。
- long lastSendHeartBeatTime

上次发送心跳包的时间戳。
- long lastSuccHeartBeatTime

上次成功收到心跳包的时间戳。
- int heartBeatTimeIntervalMs

一个心跳包的周期，默认为2s。
- int maxHeartBeatLeak

允许最大的N个心跳周期内未收到心跳包，状态为Follower的节点只有超过 maxHeartBeatLeak * heartBeatTimeIntervalMs 的时间内未收到主节点的心跳包，才会重新进入 Candidate 状态，重新下一轮的选举。
- long nextTimeToRequestVote

发送下一个心跳包的时间戳。
- boolean needIncreaseTermImmediately

是否应该立即发起投票。
- int minVoteIntervalMs

最小的发送投票间隔时间，默认为300ms。
- int maxVoteIntervalMs

最大的发送投票的间隔，默认为1000ms。
- List`` roleChangeHandlers

注册的节点状态处理器，通过 addRoleChangeHandler 方法添加。
- long lastVoteCost

上一次投票的开销。
- StateMaintainer stateMaintainer

状态机管理器。

### 2.2 启动选举状态管理器

通过DLedgerLeaderElector 的 startup 方法启动状态管理机，代码如下：

DLedgerLeaderElector#startup

```java
public void startup() {
    stateMaintainer.start();   // @1
    for (RoleChangeHandler roleChangeHandler : roleChangeHandlers) {
        // @2
        roleChangeHandler.startup();
    }
}
```

代码@1：启动状态维护管理器。

代码@2：遍历状态改变监听器并启动它，可通过DLedgerLeaderElector 的 addRoleChangeHandler 方法增加状态变化监听器。

其中的是启动状态管理器线程，其run方法实现：

```java
public void run() {
    while (running.get()) {
        try {
            doWork();    
        } catch (Throwable t) {
            if (logger != null) {
                logger.error("Unexpected Error in running {} ", getName(), t);
            }
        }
    }
    latch.countDown();
} 
```

从上面来看，主要是循环调用doWork方法，接下来重点看其doWork的实现：

```java
public void doWork() {
    try {
        if (DLedgerLeaderElector.this.dLedgerConfig.isEnableLeaderElector()) {
        // @1
            DLedgerLeaderElector.this.refreshIntervals(dLedgerConfig);                 // @2
            DLedgerLeaderElector.this.maintainState();                                           // @3
        }
        sleep(10);                                                                                                    // @4
    } catch (Throwable t) {
        DLedgerLeaderElector.logger.error("Error in heartbeat", t);
    }
}
```

代码@1：如果该节点参与Leader选举，则首先调用@2重置定时器，然后驱动状态机(@3)，是接下来重点需要剖析的。

代码@4：没执行一次选主，休息10ms。

DLedgerLeaderElector#maintainState

```java
private void maintainState() throws Exception {
    if (memberState.isLeader()) {
        maintainAsLeader();
    } else if (memberState.isFollower()) {
        maintainAsFollower();
    } else {
        maintainAsCandidate();
    }
}
```

根据当前的状态机状态，执行对应的操作，从raft协议中可知，总共存在3种状态：

- leader

领导者，主节点，该状态下，需要定时向从节点发送心跳包，用来传播数据、确保其领导地位。
- follower

从节点，该状态下，会开启定时器，尝试进入到candidate状态，以便发起投票选举，同时一旦收到主节点的心跳包，则重置定时器。
- candidate

候选者，该状态下的节点会发起投票，尝试选择自己为主节点，选举成功后，不会存在该状态下的节点。

我们在继续往下看之前，需要知道 memberState 的初始值是什么？我们追溯到创建 MemberState 的地方，发现其初始状态为 CANDIDATE。那我们接下从 maintainAsCandidate 方法开始跟进。

> 温馨提示：在raft协议中，节点的状态默认为follower，DLedger的实现从candidate开始，一开始，集群内的所有节点都会尝试发起投票，这样第一轮要达成选举几乎不太可能。

### 2.3 选举状态机状态流转

整个状态机的驱动，由线程反复执行maintainState方法。下面重点来分析其状态的驱动。

#### 2.3.1 maintainAsCandidate 方法

DLedgerLeaderElector#maintainAsCandidate

```java
if (System.currentTimeMillis() < nextTimeToRequestVote && !needIncreaseTermImmediately) {
    return;
}
long term;
long ledgerEndTerm;
long ledgerEndIndex;
```

Step1：首先先介绍几个变量的含义：

- nextTimeToRequestVote

下一次发发起的投票的时间，如果当前时间小于该值，说明计时器未过期，此时无需发起投票。
- needIncreaseTermImmediately

是否应该立即发起投票。如果为true，则忽略计时器，该值默认为false，当收到从主节点的心跳包并且当前状态机的轮次大于主节点的轮次，说明集群中Leader的投票轮次小于从几点的轮次，应该立即发起新的投票。
- term

投票轮次。
- ledgerEndTerm

Leader节点当前的投票轮次。
- ledgerEndIndex

当前日志的最大序列，即下一条日志的开始index，在日志复制部分会详细介绍。

DLedgerLeaderElector#maintainAsCandidate

```java
synchronized (memberState) {
    if (!memberState.isCandidate()) {
        return;
    }
    if (lastParseResult == VoteResponse.ParseResult.WAIT_TO_VOTE_NEXT || needIncreaseTermImmediately) {
        long prevTerm = memberState.currTerm();
        term = memberState.nextTerm();
        logger.info("{}_[INCREASE_TERM] from {} to {}", memberState.getSelfId(), prevTerm, term);
        lastParseResult = VoteResponse.ParseResult.WAIT_TO_REVOTE;
    } else {
        term = memberState.currTerm();
    }
    ledgerEndIndex = memberState.getLedgerEndIndex();
    ledgerEndTerm = memberState.getLedgerEndTerm();
}
```

Step2：初始化team、ledgerEndIndex 、ledgerEndTerm 属性，其实现关键点如下：

- 如果上一次的投票结果为待下一次投票或应该立即开启投票，并且根据当前状态机获取下一轮的投票轮次，稍后会着重讲解一下状态机轮次的维护机制。
- 如果上一次的投票结果不是WAIT_TO_VOTE_NEXT(等待下一轮投票)，则投票轮次依然为状态机内部维护的轮次。

DLedgerLeaderElector#maintainAsCandidate

```java
if (needIncreaseTermImmediately) {
    nextTimeToRequestVote = getNextTimeToRequestVote();
    needIncreaseTermImmediately = false;
    return;
}
```

Step3：如果needIncreaseTermImmediately为true，则重置该标记位为false，并重新设置下一次投票超时时间，其实现代码如下：

```java
private long getNextTimeToRequestVote() {
    return System.currentTimeMillis() + lastVoteCost + minVoteIntervalMs + random.nextInt(maxVoteIntervalMs - minVoteIntervalMs);
}
```

下一次倒计时：当前时间戳 + 上次投票的开销 + 最小投票间隔(300ms) + （1000- 300 ）之间的随机值。

```java
final List<CompletableFuture<VoteResponse>> quorumVoteResponses = voteForQuorumResponses(term, ledgerEndTerm, ledgerEndIndex);
```

Step4：向集群内的其他节点发起投票请，并返回投票结果列表，稍后会重点分析其投票过程。可以预见，接下来就是根据各投票结果进行仲裁。

```java
final AtomicLong knownMaxTermInGroup = new AtomicLong(-1);
final AtomicInteger allNum = new AtomicInteger(0);
final AtomicInteger validNum = new AtomicInteger(0);
final AtomicInteger acceptedNum = new AtomicInteger(0);
final AtomicInteger notReadyTermNum = new AtomicInteger(0);
final AtomicInteger biggerLedgerNum = new AtomicInteger(0);
final AtomicBoolean alreadyHasLeader = new AtomicBoolean(false);
```

Step5：在进行投票结果仲裁之前，先来介绍几个局部变量的含义：

- knownMaxTermInGroup

已知的最大投票轮次。
- allNum

所有投票票数。
- validNum

有效投票数。
- acceptedNum

获得的投票数。
- notReadyTermNum

未准备投票的节点数量，如果对端节点的投票轮次小于发起投票的轮次，则认为对端未准备好，对端节点使用本次的轮次进入 - Candidate 状态。
- biggerLedgerNum

发起投票的节点的ledgerEndTerm小于对端节点的个数。
- alreadyHasLeader

是否已经存在Leader。

```java
for (CompletableFuture<VoteResponse> future : quorumVoteResponses) {
   // 省略部分代码
}
```

Step5：遍历投票结果，收集投票结果，接下来重点看其内部实现。

```java
if (x.getVoteResult() != VoteResponse.RESULT.UNKNOWN) {
    validNum.incrementAndGet();
}
```

Step6：如果投票结果不是UNKNOW，则有效投票数量增1。

```java
synchronized (knownMaxTermInGroup) {
    switch (x.getVoteResult()) {
        case ACCEPT:
            acceptedNum.incrementAndGet();
            break;
        case REJECT_ALREADY_VOTED:
            break;
        case REJECT_ALREADY_HAS_LEADER:
            alreadyHasLeader.compareAndSet(false, true);
            break;
        case REJECT_TERM_SMALL_THAN_LEDGER:
        case REJECT_EXPIRED_VOTE_TERM:
            if (x.getTerm() > knownMaxTermInGroup.get()) {
                knownMaxTermInGroup.set(x.getTerm());
            }
            break;
        case REJECT_EXPIRED_LEDGER_TERM:
        case REJECT_SMALL_LEDGER_END_INDEX:
            biggerLedgerNum.incrementAndGet();
            break;
        case REJECT_TERM_NOT_READY:
            notReadyTermNum.incrementAndGet();
            break;
        default:
            break;
    }
}
```

Step7：统计投票结构，几个关键点如下：

- ACCEPT

赞成票，acceptedNum加一，只有得到的赞成票超过集群节点数量的一半才能成为Leader。
- REJECT_ALREADY_VOTED

拒绝票，原因是已经投了其他节点的票。
- REJECT_ALREADY_HAS_LEADER

拒绝票，原因是因为集群中已经存在Leaer了。alreadyHasLeader设置为true，无需在判断其他投票结果了，结束本轮投票。
- REJECT_TERM_SMALL_THAN_LEDGER

拒绝票，如果自己维护的term小于远端维护的ledgerEndTerm，则返回该结果，如果对端的team大于自己的team，需要记录对端最大的投票轮次，以便更新自己的投票轮次。
- REJECT_EXPIRED_VOTE_TERM

拒绝票，如果自己维护的term小于远端维护的term，更新自己维护的投票轮次。
- REJECT_EXPIRED_LEDGER_TERM

拒绝票，如果自己维护的 ledgerTerm小于对端维护的ledgerTerm，则返回该结果。如果是此种情况，增加计数器- biggerLedgerNum的值。
- REJECT_SMALL_LEDGER_END_INDEX

拒绝票，如果对端的ledgerTeam与自己维护的ledgerTeam相等，但是自己维护的dedgerEndIndex小于对端维护的值，返回该值，增加biggerLedgerNum计数器的值。
- REJECT_TERM_NOT_READY

拒绝票，对端的投票轮次小于自己的team，则认为对端还未准备好投票，对端使用自己的投票轮次，是自己进入到Candidate状态。

```java
try {
    voteLatch.await(3000 + random.nextInt(maxVoteIntervalMs), TimeUnit.MILLISECONDS);
} catch (Throwable ignore) {
}
```

Step8：等待收集投票结果，并设置超时时间。

```java
lastVoteCost = DLedgerUtils.elapsed(startVoteTimeMs);
VoteResponse.ParseResult parseResult;
if (knownMaxTermInGroup.get() > term) {
    parseResult = VoteResponse.ParseResult.WAIT_TO_VOTE_NEXT;
    nextTimeToRequestVote = getNextTimeToRequestVote();
    changeRoleToCandidate(knownMaxTermInGroup.get());
} else if (alreadyHasLeader.get()) {
    parseResult = VoteResponse.ParseResult.WAIT_TO_VOTE_NEXT;
    nextTimeToRequestVote = getNextTimeToRequestVote() + heartBeatTimeIntervalMs * maxHeartBeatLeak;
} else if (!memberState.isQuorum(validNum.get())) {
    parseResult = VoteResponse.ParseResult.WAIT_TO_REVOTE;
    nextTimeToRequestVote = getNextTimeToRequestVote();
} else if (memberState.isQuorum(acceptedNum.get())) {
    parseResult = VoteResponse.ParseResult.PASSED;
} else if (memberState.isQuorum(acceptedNum.get() + notReadyTermNum.get())) {
    parseResult = VoteResponse.ParseResult.REVOTE_IMMEDIATELY;
} else if (memberState.isQuorum(acceptedNum.get() + biggerLedgerNum.get())) {
    parseResult = VoteResponse.ParseResult.WAIT_TO_REVOTE;
    nextTimeToRequestVote = getNextTimeToRequestVote();
} else {
    parseResult = VoteResponse.ParseResult.WAIT_TO_VOTE_NEXT;
    nextTimeToRequestVote = getNextTimeToRequestVote();
}
```

Step9：根据收集的投票结果判断是否能成为Leader。

> 温馨提示：在讲解关键点之前，我们先定义先将（当前时间戳 + 上次投票的开销 + 最小投票间隔(300ms) + （1000- 300 ）之间的随机值）定义为“ 1个常规计时器”。

其关键点如下：

- 如果对端的投票轮次大于发起投票的节点，则该节点使用对端的轮次，重新进入到Candidate状态，并且重置投票计时器，其值为“1个常规计时器”
- 如果已经存在Leader，该节点重新进入到Candidate,并重置定时器，该定时器的时间： “1个常规计时器” + heartBeatTimeIntervalMs * maxHeartBeatLeak ，其中 heartBeatTimeIntervalMs 为一次心跳间隔时间，

maxHeartBeatLeak 为 允许最大丢失的心跳包，即如果Flower节点在多少个心跳周期内未收到心跳包，则认为Leader已下线。
- 如果收到的有效票数未超过半数，则重置计时器为“ 1个常规计时器”，然后等待重新投票，注意状态为WAIT_TO_REVOTE，该状态下的特征是下次投票时不增加投票轮次。
- 如果得到的赞同票超过半数，则成为Leader。
- 如果得到的赞成票加上未准备投票的节点数超过半数，则应该立即发起投票，故其结果为REVOTE_IMMEDIATELY。
- 如果得到的赞成票加上对端维护的ledgerEndIndex超过半数，则重置计时器，继续本轮次的选举。
- 其他情况，开启下一轮投票。

```java
if (parseResult == VoteResponse.ParseResult.PASSED) {
    logger.info("[{}] [VOTE_RESULT] has been elected to be the leader in term {}", memberState.getSelfId(), term);
    changeRoleToLeader(term);
}
```

Step10：如果投票成功，则状态机状态设置为Leader，然后状态管理在驱动状态时会调用DLedgerLeaderElector#maintainState时，将进入到maintainAsLeader方法。

#### 2.3.2 maintainAsLeader 方法

经过maintainAsCandidate 投票选举后，被其他节点选举成为领导后，会执行该方法，其他节点的状态还是Candidate，并在计时器过期后，又尝试去发起选举。接下来重点分析成为Leader节点后，该节点会做些什么？

DLedgerLeaderElector#maintainAsLeader

```java
private void maintainAsLeader() throws Exception {
    if (DLedgerUtils.elapsed(lastSendHeartBeatTime) > heartBeatTimeIntervalMs) {
       // @1
        long term;
        String leaderId;
        synchronized (memberState) {
            if (!memberState.isLeader()) {
          // @2
                //stop sending
                return;
            }
            term = memberState.currTerm();
            leaderId = memberState.getLeaderId();
            lastSendHeartBeatTime = System.currentTimeMillis();    // @3
        }
        sendHeartbeats(term, leaderId);    // @4
    }
}
```

代码@1：首先判断上一次发送心跳的时间与当前时间的差值是否大于心跳包发送间隔，如果超过，则说明需要发送心跳包。

代码@2：如果当前不是leader节点，则直接返回，主要是为了二次判断。

代码@3：重置心跳包发送计时器。

代码@4：向集群内的所有节点发送心跳包，稍后会详细介绍心跳包的发送。

#### 2.3.3 maintainAsFollower方法

当Candidate 状态的节点在收到主节点发送的心跳包后，会将状态变更为follower，那我们先来看一下在follower状态下，节点会做些什么事情？

```java
private void maintainAsFollower() {
    if (DLedgerUtils.elapsed(lastLeaderHeartBeatTime) > 2 * heartBeatTimeIntervalMs) {
        synchronized (memberState) {
            if (memberState.isFollower() && (DLedgerUtils.elapsed(lastLeaderHeartBeatTime) > maxHeartBeatLeak * heartBeatTimeIntervalMs)) {
                logger.info("[{}][HeartBeatTimeOut] lastLeaderHeartBeatTime: {} heartBeatTimeIntervalMs: {} lastLeader={}", memberState.getSelfId(), new Timestamp(lastLeaderHeartBeatTime), heartBeatTimeIntervalMs, memberState.getLeaderId());
                changeRoleToCandidate(memberState.currTerm());
            }
        }
    }
}
```

如果maxHeartBeatLeak (默认为3)个心跳包周期内未收到心跳，则将状态变更为Candidate。

状态机的驱动就介绍到这里，在上面的流程中，其实我们忽略了两个重要的过程，一个是发起投票请求与投票请求响应、发送心跳包与心跳包响应，那我们接下来将重点介绍这两个过程。

### 2.4 投票与投票请求

节点的状态为 Candidate 时会向集群内的其他节点发起投票请求(个人觉得理解为拉票更好)，向对方询问是否愿意选举我为Leader，对端节点会根据自己的情况对其投赞成票、拒绝票，如果是拒绝票，还会给出拒绝原因，具体由voteForQuorumResponses、handleVote 这两个方法来实现，接下来我们分别对这两个方法进行详细分析。

#### 2.4.1 voteForQuorumResponses

发起投票请求。

```java
private List<CompletableFuture<VoteResponse>> voteForQuorumResponses(long term, long ledgerEndTerm,
    long ledgerEndIndex) throws Exception {
        // @1
    List<CompletableFuture<VoteResponse>> responses = new ArrayList<>();
    for (String id : memberState.getPeerMap().keySet()) {
                    // @2
        VoteRequest voteRequest = new VoteRequest();                  // @3 start
        voteRequest.setGroup(memberState.getGroup());
        voteRequest.setLedgerEndIndex(ledgerEndIndex);
        voteRequest.setLedgerEndTerm(ledgerEndTerm);
        voteRequest.setLeaderId(memberState.getSelfId());
        voteRequest.setTerm(term);
        voteRequest.setRemoteId(id);
        CompletableFuture<VoteResponse> voteResponse;          // @3 end
        if (memberState.getSelfId().equals(id)) {
                                  // @4
            voteResponse = handleVote(voteRequest, true);
        } else {
            //async
            voteResponse = dLedgerRpcService.vote(voteRequest);  // @5
        }
        responses.add(voteResponse);
    }
    return responses;
}
```

代码@1：首先先解释一下参数的含义：

- long term

发起投票的节点当前的投票轮次。
- long ledgerEndTerm

发起投票节点维护的已知的最大投票轮次。
- long ledgerEndIndex

发起投票节点维护的已知的最大日志条目索引。

代码@2：遍历集群内的节点集合，准备异步发起投票请求。这个集合在启动的时候指定，不能修改。

代码@3：构建投票请求。

代码@4：如果是发送给自己的，则直接调用handleVote进行投票请求响应，如果是发送给集群内的其他节点，则通过网络发送投票请求，对端节点调用各自的handleVote对集群进行响应。

接下来重点关注 handleVote 方法，重点探讨其投票处理逻辑。

#### 2.4.2 handleVote 方法

由于handleVote 方法会并发被调用，因为可能同时收到多个节点的投票请求，故本方法都被synchronized方法包含，锁定的对象为状态机 memberState 对象。

```java
if (!memberState.isPeerMember(request.getLeaderId())) {
    logger.warn("[BUG] [HandleVote] remoteId={} is an unknown member", request.getLeaderId());
    return CompletableFuture.completedFuture(newVoteResponse(request).term(memberState.currTerm()).voteResult(VoteResponse.RESULT.REJECT_UNKNOWN_LEADER));
}
if (!self && memberState.getSelfId().equals(request.getLeaderId())) {
    logger.warn("[BUG] [HandleVote] selfId={} but remoteId={}", memberState.getSelfId(), request.getLeaderId());
    return CompletableFuture.completedFuture(new VoteResponse(request).term(memberState.currTerm()).voteResult(VoteResponse.RESULT.REJECT_UNEXPECTED_LEADER));
}
```

Step1：为了逻辑的完整性对其请求进行检验，除非有BUG存在，否则是不会出现上述问题的。

```java
if (request.getTerm() < memberState.currTerm()) {
         // @1
    return CompletableFuture.completedFuture(new VoteResponse(request).term(memberState.currTerm()).voteResult(VoteResponse.RESULT.REJECT_EXPIRED_VOTE_TERM));
} else if (request.getTerm() == memberState.currTerm()) {
        // @2
    if (memberState.currVoteFor() == null) {
        //let it go
    } else if (memberState.currVoteFor().equals(request.getLeaderId())) {
         //repeat just let it go
    } else {
        if (memberState.getLeaderId() != null) {
             return CompletableFuture.completedFuture(new VoteResponse(request).term(memberState.currTerm()).voteResult(VoteResponse.RESULT.REJECT_ALREADY__HAS_LEADER));
        } else {
                return CompletableFuture.completedFuture(new VoteResponse(request).term(memberState.currTerm()).voteResult(VoteResponse.RESULT.REJECT_ALREADY_VOTED));
        }
    }
} else {
    // @3
    //stepped down by larger term
    changeRoleToCandidate(request.getTerm());
    needIncreaseTermImmediately = true;
    //only can handleVote when the term is consistent
    return CompletableFuture.completedFuture(new VoteResponse(request).term(memberState.currTerm()).voteResult(VoteResponse.RESULT.REJECT_TERM_NOT_READY));
}
```

Step2：判断发起节点、响应节点维护的team进行投票“仲裁”，分如下3种情况讨论：

- 如果发起投票节点的 term 小于当前节点的 term

此种情况下投拒绝票，也就是说在 raft 协议的世界中，谁的 term 越大，越有话语权。
- 如果发起投票节点的 term 等于当前节点的 term

如果两者的 term 相等，说明两者都处在同一个投票轮次中，地位平等，接下来看该节点是否已经投过票。
- 如果未投票、或已投票给请求节点，则继续后面的逻辑（请看step3）。
- 如果该节点已存在的Leader节点，则拒绝并告知已存在Leader节点。
- 如果该节点还未有Leader节点，但已经投了其他节点的票，则拒绝请求节点，并告知已投票。
- 如果发起投票节点的 term 大于当前节点的 term

拒绝请求节点的投票请求，并告知自身还未准备投票，自身会使用请求节点的投票轮次立即进入到Candidate状态。

```java
if (request.getLedgerEndTerm() < memberState.getLedgerEndTerm()) {
    return CompletableFuture.completedFuture(new VoteResponse(request).term(memberState.currTerm()).voteResult(VoteResponse.RESULT.REJECT_EXPIRED_LEDGER_TERM));
} else if (request.getLedgerEndTerm() == memberState.getLedgerEndTerm() && request.getLedgerEndIndex() < memberState.getLedgerEndIndex()) {
    return CompletableFuture.completedFuture(new VoteResponse(request).term(memberState.currTerm()).voteResult(VoteResponse.RESULT.REJECT_SMALL_LEDGER_END_INDEX));
}
if (request.getTerm() < memberState.getLedgerEndTerm()) {
    return CompletableFuture.completedFuture(new VoteResponse(request).term(memberState.getLedgerEndTerm()).voteResult(VoteResponse.RESULT.REJECT_TERM_SMALL_THAN_LEDGER));
}
```

Step3：判断请求节点的 ledgerEndTerm 与当前节点的 ledgerEndTerm，这里主要是判断日志的复制进度。

- 如果请求节点的 ledgerEndTerm 小于当前节点的 ledgerEndTerm 则拒绝，其原因是请求节点的日志复制进度比当前节点低，这种情况是不能成为主节点的。
- 如果 ledgerEndTerm 相等，但是 ledgerEndIndex 比当前节点小，则拒绝，原因与上一条相同。
- 如果请求的 term 小于 ledgerEndTerm 以同样的理由拒绝。

```java
memberState.setCurrVoteFor(request.getLeaderId());
return CompletableFuture.completedFuture(new VoteResponse(request).term(memberState.currTerm()).voteResult(VoteResponse.RESULT.ACCEPT));
```

Step4：经过层层条件帅选，将宝贵的赞成票投给请求节点。

经过几轮投票，最终一个节点能成功被推举出来，选为主节点。主节点为了维持其领导地位，需要定时向从节点发送心跳包，接下来我们重点看一下心跳包的发送与响应。

### 2.5 心跳包与心跳包响应

#### 2.5.1 sendHeartbeats

Step1：遍历集群中的节点，异步发送心跳包。

```java
 CompletableFuture<HeartBeatResponse> future = dLedgerRpcService.heartBeat(heartBeatRequest);
    future.whenComplete((HeartBeatResponse x, Throwable ex) -> {
        try {
            if (ex != null) {
                throw ex;
            }
            switch (DLedgerResponseCode.valueOf(x.getCode())) {
                case SUCCESS:
                    succNum.incrementAndGet();
                    break;
                case EXPIRED_TERM:
                    maxTerm.set(x.getTerm());
                    break;
                case INCONSISTENT_LEADER:
                    inconsistLeader.compareAndSet(false, true);
                    break;
                case TERM_NOT_READY:
                    notReadyNum.incrementAndGet();
                    break;
                default:
                    break;
            }
            if (memberState.isQuorum(succNum.get())
                || memberState.isQuorum(succNum.get() + notReadyNum.get())) {
                beatLatch.countDown();
            }
        } catch (Throwable t) {
            logger.error("Parse heartbeat response failed", t);
        } finally {
            allNum.incrementAndGet();
            if (allNum.get() == memberState.peerSize()) {
                beatLatch.countDown();
            }
        }
    });
}
```

Step2：统计心跳包发送响应结果，关键点如下：

- SUCCESS

心跳包成功响应。
- EXPIRED_TERM

主节点的投票 term 小于从节点的投票轮次。
- INCONSISTENT_LEADER

从节点已经有了新的主节点。
- TERM_NOT_READY

从节点未准备好。

这些响应值，我们在处理心跳包时重点探讨。

```java
beatLatch.await(heartBeatTimeIntervalMs, TimeUnit.MILLISECONDS);
if (memberState.isQuorum(succNum.get())) {
        // @1
    lastSuccHeartBeatTime = System.currentTimeMillis();
} else {
    logger.info("[{}] Parse heartbeat responses in cost={} term={} allNum={} succNum={} notReadyNum={} inconsistLeader={} maxTerm={} peerSize={} lastSuccHeartBeatTime={}",
                memberState.getSelfId(), DLedgerUtils.elapsed(startHeartbeatTimeMs), term, allNum.get(), succNum.get(), notReadyNum.get(), inconsistLeader.get(), maxTerm.get(), memberState.peerSize(), new Timestamp(lastSuccHeartBeatTime));
    if (memberState.isQuorum(succNum.get() + notReadyNum.get())) {
         // @2
        lastSendHeartBeatTime = -1;
    } else if (maxTerm.get() > term) {
                                                               // @3
        changeRoleToCandidate(maxTerm.get());
    } else if (inconsistLeader.get()) {
                                                                 // @4
        changeRoleToCandidate(term);
    } else if (DLedgerUtils.elapsed(lastSuccHeartBeatTime) > maxHeartBeatLeak * heartBeatTimeIntervalMs) {
        changeRoleToCandidate(term);
    }
}
```

对收集的响应结果做仲裁，其实现关键点：

- 如果成功的票数大于进群内的半数，则表示集群状态正常，正常按照心跳包间隔发送心跳包(见代码@1)。
- 如果成功的票数加上未准备的投票的节点数量超过集群内的半数，则立即发送心跳包(见代码@2)。
- 如果从节点的投票轮次比主节点的大，则使用从节点的投票轮次，或从节点已经有了另外的主节点，节点状态从 Leader 转换为 Candidate。

接下来我们重点看一下心跳包的处理逻辑。

#### 2.5.2 handleHeartBeat

```java
if (request.getTerm() < memberState.currTerm()) {
    return CompletableFuture.completedFuture(new HeartBeatResponse().term(memberState.currTerm()).code(DLedgerResponseCode.EXPIRED_TERM.getCode()));
} else if (request.getTerm() == memberState.currTerm()) {
    if (request.getLeaderId().equals(memberState.getLeaderId())) {
        lastLeaderHeartBeatTime = System.currentTimeMillis();
        return CompletableFuture.completedFuture(new HeartBeatResponse());
    }
}
```

Step1：如果主节点的 term 小于 从节点的term，发送反馈给主节点，告知主节点的 term 已过时；如果投票轮次相同，并且发送心跳包的节点是该节点的主节点，则返回成功。

下面重点讨论主节点的 term 大于从节点的情况。

```java
synchronized (memberState) {
    if (request.getTerm() < memberState.currTerm()) {
        // @1
        return CompletableFuture.completedFuture(new HeartBeatResponse().term(memberState.currTerm()).code(DLedgerResponseCode.EXPIRED_TERM.getCode()));
    } else if (request.getTerm() == memberState.currTerm()) {
       // @2
        if (memberState.getLeaderId() == null) {
            changeRoleToFollower(request.getTerm(), request.getLeaderId());
            return CompletableFuture.completedFuture(new HeartBeatResponse());
        } else if (request.getLeaderId().equals(memberState.getLeaderId())) {
            lastLeaderHeartBeatTime = System.currentTimeMillis();
            return CompletableFuture.completedFuture(new HeartBeatResponse());
        } else {
            //this should not happen, but if happened
            logger.error("[{}][BUG] currTerm {} has leader {}, but received leader {}", memberState.getSelfId(), memberState.currTerm(), memberState.getLeaderId(), request.getLeaderId());
            return CompletableFuture.completedFuture(new HeartBeatResponse().code(DLedgerResponseCode.INCONSISTENT_LEADER.getCode()));
        }
    } else {
        //To make it simple, for larger term, do not change to follower immediately
        //first change to candidate, and notify the state-maintainer thread
        changeRoleToCandidate(request.getTerm());
        needIncreaseTermImmediately = true;
        //TOOD notify
        return CompletableFuture.completedFuture(new HeartBeatResponse().code(DLedgerResponseCode.TERM_NOT_READY.getCode()));
    }
}
```

Step2：加锁来处理（这里更多的是从节点第一次收到主节点的心跳包）

代码@1：如果主节的投票轮次小于当前投票轮次，则返回主节点投票轮次过期。

代码@2：如果投票轮次相同。

- 如果当前节点的主节点字段为空，则使用主节点的ID，并返回成功。
- 如果当前节点的主节点就是发送心跳包的节点，则更新上一次收到心跳包的时间戳，并返回成功。
- 如果从节点的主节点与发送心跳包的节点ID不同，说明有另外一个Leaer，按道理来说是不会发送的，如果发生，则返回已存在- 主节点，标记该心跳包处理结束。

代码@3：如果主节点的投票轮次大于从节点的投票轮次，则认为从节点并为准备好，则从节点进入Candidate 状态，并立即发起一次投票。

心跳包的处理就介绍到这里。

RocketMQ 多副本之 Leader 选举的源码解析就介绍到这里了，为了加强对源码的理解，先梳理流程图如下：

本文就介绍到这里了，如果对您有一定的帮助，麻烦帮忙点个赞，谢谢。
