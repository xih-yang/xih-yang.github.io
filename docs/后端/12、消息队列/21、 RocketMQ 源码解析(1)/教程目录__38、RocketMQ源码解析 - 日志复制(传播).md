# 38、RocketMQ源码解析 - 日志复制(传播)
- 来源：https://ddkk.com/zhuanlan/mq/rocketmq/1/38.html
- 分类：消息队列
- 分组：教程目录
本文紧接着 源码解析 RocketMQ DLedger(多副本) 之日志追加流程 ，继续 Leader 处理客户端 append 的请求流程中最至关重要的一环：日志复制。

DLedger 多副本的日志转发由 DLedgerEntryPusher 实现，接下来将对其进行详细介绍。

> 温馨提示：由于本篇幅较长，为了更好的理解其实现，大家可以带着如下疑问来通读本篇文章：
>
> 1、raft 协议中有一个非常重要的概念：已提交日志序号，该如何实现。
>
> 2、客户端向 DLedger 集群发送一条日志，必须得到集群中大多数节点的认可才能被认为写入成功。
>
> 3、raft 协议中追加、提交两个动作如何实现。

日志复制(日志转发)由 DLedgerEntryPusher 实现，具体类图如下：

主要由如下4个类构成：

- DLedgerEntryPusher

DLedger 日志转发与处理核心类，该内会启动如下3个对象，其分别对应一个线程。
- EntryHandler

日志接收处理线程，当节点为从节点时激活。
- QuorumAckChecker

日志追加ACK投票处理线程，当前节点为主节点时激活。
- EntryDispatcher

日志转发线程，当前节点为主节点时追加。

接下来我们将详细介绍上述4个类，从而揭晓日志复制的核心实现原理。

## 1、DLedgerEntryPusher

### 1.1 核心类图

DLedger 多副本日志推送的核心实现类，里面会创建 EntryDispatcher、QuorumAckChecker、EntryHandler 三个核心线程。其核心属性如下：

- DLedgerConfig dLedgerConfig

多副本相关配置。
- DLedgerStore dLedgerStore

存储实现类。
- MemberState memberState

节点状态机。
- DLedgerRpcService dLedgerRpcService

RPC 服务实现类，用于集群内的其他节点进行网络通讯。
- Map`>`peerWaterMarksByTerm 每个节点基于投票轮次的当前水位线标记。键值为投票轮次，值为 ConcurrentMap``。
- Map`>` pendingAppendResponsesByTerm

用于存放追加请求的响应结果(Future模式)。
- EntryHandler entryHandler

从节点上开启的线程，用于接收主节点的 push 请求（append、commit、append）。
- QuorumAckChecker quorumAckChecker

主节点上的追加请求投票器。
- Map`` dispatcherMap

主节点日志请求转发器，向从节点复制消息等。

接下来介绍一下其核心方法的实现。

### 1.2 构造方法

```java
public DLedgerEntryPusher(DLedgerConfig dLedgerConfig, MemberState memberState, DLedgerStore dLedgerStore,
    DLedgerRpcService dLedgerRpcService) {
    this.dLedgerConfig = dLedgerConfig;
    this.memberState = memberState;
    this.dLedgerStore = dLedgerStore;
    this.dLedgerRpcService = dLedgerRpcService;
    for (String peer : memberState.getPeerMap().keySet()) {
        if (!peer.equals(memberState.getSelfId())) {
            dispatcherMap.put(peer, new EntryDispatcher(peer, logger));
        }
    }
}
```

构造方法的重点是会根据集群内的节点，依次构建对应的 EntryDispatcher 对象。

### 1.3 startup

DLedgerEntryPusher#startup

```java
public void startup() {
    entryHandler.start();
    quorumAckChecker.start();
    for (EntryDispatcher dispatcher : dispatcherMap.values()) {
        dispatcher.start();
    }
}
```

依次启动 EntryHandler、QuorumAckChecker 与 EntryDispatcher 线程。

> 备注：DLedgerEntryPusher 的其他核心方法在详细分析其日志复制原理的过程中会一一介绍。

接下来将从 EntryDispatcher、QuorumAckChecker、EntryHandler 来阐述 RocketMQ DLedger(多副本)的实现原理。

## 2、EntryDispatcher 详解

### 2.1 核心类图

其核心属性如下。

- AtomicReference`` type = new AtomicReference`<>`(PushEntryRequest.Type.COMPARE)

向从节点发送命令的类型，可选值：PushEntryRequest.Type.COMPARE、TRUNCATE、APPEND、COMMIT，下面详细说明。
- long lastPushCommitTimeMs = -1

上一次发送提交类型的时间戳。
- String peerId

目标节点ID。
- long compareIndex = -1

已完成比较的日志序号。
- long writeIndex = -1

已写入的日志序号。
- int maxPendingSize = 1000

允许的最大挂起日志数量。
- long term = -1

Leader 节点当前的投票轮次。
- String leaderId = null

Leader 节点ID。
- long lastCheckLeakTimeMs = System.currentTimeMillis()

上次检测泄漏的时间，所谓的泄漏，就是看挂起的日志请求数量是否查过了 maxPendingSize 。
- ConcurrentMap`` pendingMap = new ConcurrentHashMap`<>`()

记录日志的挂起时间，key：日志的序列(entryIndex)，value：挂起时间戳。
- Quota quota = new Quota(dLedgerConfig.getPeerPushQuota())

配额。

### 2.2 Push 请求类型

DLedger 主节点向从从节点复制日志总共定义了4类请求类型，其枚举类型为 PushEntryRequest.Type，其值分别为 COMPARE、TRUNCATE、APPEND、COMMIT。

- COMPARE

如果 Leader 发生变化，新的 Leader 需要与他的从节点的日志条目进行比较，以便截断从节点多余的数据。
- TRUNCATE

如果 Leader 通过索引完成日志对比，则 Leader 将发送 TRUNCATE 给它的从节点。
- APPEND

将日志条目追加到从节点。
- COMMIT

通常，leader 会将提交的索引附加到 append 请求，但是如果 append 请求很少且分散，leader 将发送一个单独的请求来通知从节点提交的索引。

对主从节点的请求类型有了一个初步的认识后，我们将从 EntryDispatcher 的业务处理入口 doWork 方法开始讲解。

### 2.3 doWork 方法详解

```java
public void doWork() {
    try {
        if (!checkAndFreshState()) {
            waitForRunning(1);
            return;
        }
        if (type.get() == PushEntryRequest.Type.APPEND) {
        // @2
            doAppend();
        } else {
            doCompare();                                                           // @3
        }
        waitForRunning(1);
    } catch (Throwable t) {
        DLedgerEntryPusher.logger.error("[Push-{}]Error in {} writeIndex={} compareIndex={}", peerId, getName(), writeIndex, compareIndex, t);
        DLedgerUtils.sleep(500);
    }
}
```

代码@1：检查状态，是否可以继续发送 append 或 compare。

代码@2：如果推送类型为APPEND，主节点向从节点传播消息请求。

代码@3：主节点向从节点发送对比数据差异请求（当一个新节点被选举成为主节点时，往往这是第一步）。

#### 2.3.1 checkAndFreshState 详解

EntryDispatcher#checkAndFreshState

```java
private boolean checkAndFreshState() {
    if (!memberState.isLeader()) {
          // @1
        return false;
    }
    if (term != memberState.currTerm() || leaderId == null || !leaderId.equals(memberState.getLeaderId())) {
          // @2
        synchronized (memberState) {
            if (!memberState.isLeader()) {
                return false;
            }
            PreConditions.check(memberState.getSelfId().equals(memberState.getLeaderId()), DLedgerResponseCode.UNKNOWN);
            term = memberState.currTerm();
            leaderId = memberState.getSelfId();
            changeState(-1, PushEntryRequest.Type.COMPARE);
        }
    }
    return true;
}
```

代码@1：如果节点的状态不是主节点，则直接返回 false。则结束 本次 doWork 方法。因为只有主节点才需要向从节点转发日志。

代码@2：如果当前节点状态是主节点，但当前的投票轮次与状态机轮次或 leaderId 还未设置，或 leaderId 与状态机的 leaderId 不相等，这种情况通常是集群触发了重新选举，设置其term、leaderId与状态机同步，即将发送COMPARE 请求。

接下来看一下 changeState (改变状态)。

```java
private synchronized void changeState(long index, PushEntryRequest.Type target) {
    logger.info("[Push-{}]Change state from {} to {} at {}", peerId, type.get(), target, index);
    switch (target) {
        case APPEND:      // @1
            compareIndex = -1;
            updatePeerWaterMark(term, peerId, index);
            quorumAckChecker.wakeup();
            writeIndex = index + 1;
            break;
        case COMPARE:    // @2
            if (this.type.compareAndSet(PushEntryRequest.Type.APPEND, PushEntryRequest.Type.COMPARE)) {
                compareIndex = -1;
                pendingMap.clear();
            }
            break;
        case TRUNCATE:     // @3
            compareIndex = -1;
            break;
        default:
            break;
    }
    type.set(target);
} 
```

代码@1：如果将目标类型设置为 append，则重置 compareIndex ，并设置 writeIndex 为当前 index 加1。

代码@2：如果将目标类型设置为 COMPARE，则重置 compareIndex 为负一，接下将向各个从节点发送 COMPARE 请求类似，并清除已挂起的请求。

代码@3：如果将目标类型设置为 TRUNCATE，则重置 compareIndex 为负一。

接下来具体来看一下 APPEND、COMPARE、TRUNCATE 等请求。

#### 2.3.2 append 请求详解

EntryDispatcher#doAppend

```java
private void doAppend() throws Exception {
    while (true) {
        if (!checkAndFreshState()) {
               / @1
            break;
        }
        if (type.get() != PushEntryRequest.Type.APPEND) {
             // @2
            break;
        }
        if (writeIndex > dLedgerStore.getLedgerEndIndex()) {
         // @3
            doCommit();
            doCheckAppendResponse();
            break;
        }
        if (pendingMap.size() >= maxPendingSize || (DLedgerUtils.elapsed(lastCheckLeakTimeMs) > 1000)) {
          // @4
            long peerWaterMark = getPeerWaterMark(term, peerId);
            for (Long index : pendingMap.keySet()) {
                if (index < peerWaterMark) {
                    pendingMap.remove(index);
                }
            }
            lastCheckLeakTimeMs = System.currentTimeMillis();
        }
        if (pendingMap.size() >= maxPendingSize) {
         // @5
            doCheckAppendResponse();
            break;
        }
        doAppendInner(writeIndex);                               // @6
        writeIndex++;
    }
}
```

代码@1：检查状态，已经在上面详细介绍。

代码@2：如果请求类型不为 APPEND，则退出，结束本轮 doWork 方法执行。

代码@3：writeIndex 表示当前追加到从该节点的序号，通常情况下主节点向从节点发送 append 请求时，会附带主节点的已提交指针，但如何 append 请求发不那么频繁，writeIndex 大于 leaderEndIndex 时（由于pending请求超过其 pending 请求的队列长度（默认为1w)，时，会阻止数据的追加，此时有可能出现 writeIndex 大于 leaderEndIndex 的情况，此时单独发送 COMMIT 请求。

代码@4：检测 pendingMap(挂起的请求数量)是否发送泄漏，即挂起队列中容量是否超过允许的最大挂起阀值。获取当前节点关于本轮次的当前水位线(已成功 append 请求的日志序号)，如果发现正在挂起请求的日志序号小于水位线，则丢弃。

代码@5：如果挂起的请求（等待从节点追加结果）大于 maxPendingSize 时，检查并追加一次 append 请求。

代码@6：具体的追加请求。

##### 2.3.2.1 doCommit 发送提交请求

EntryDispatcher#doCommit

```java
private void doCommit() throws Exception {
    if (DLedgerUtils.elapsed(lastPushCommitTimeMs) > 1000) {
        // @1
        PushEntryRequest request = buildPushRequest(null, PushEntryRequest.Type.COMMIT);   // @2
        //Ignore the results
        dLedgerRpcService.push(request);                                                                                        // @3
        lastPushCommitTimeMs = System.currentTimeMillis();
    }
}
```

代码@1：如果上一次单独发送 commit 的请求时间与当前时间相隔低于 1s，放弃本次提交请求。

代码@2：构建提交请求。

代码@3：通过网络向从节点发送 commit 请求。

接下来先了解一下如何构建 commit 请求包。

EntryDispatcher#buildPushRequest

```java
private PushEntryRequest buildPushRequest(DLedgerEntry entry, PushEntryRequest.Type target) {
    PushEntryRequest request = new PushEntryRequest();
    request.setGroup(memberState.getGroup());  
    request.setRemoteId(peerId);                          
    request.setLeaderId(leaderId);
    request.setTerm(term);
    request.setEntry(entry);
    request.setType(target);
    request.setCommitIndex(dLedgerStore.getCommittedIndex());
    return request;
}
```

提交包请求字段主要包含如下字段：DLedger 节点所属组、从节点 id、主节点 id，当前投票轮次、日志内容、请求类型与 committedIndex(主节点已提交日志序号)。

##### 2.3.2.2 doCheckAppendResponse 检查并追加请求

EntryDispatcher#doCheckAppendResponse

```java
private void doCheckAppendResponse() throws Exception {
    long peerWaterMark = getPeerWaterMark(term, peerId);   // @1
    Long sendTimeMs = pendingMap.get(peerWaterMark + 1); 
    if (sendTimeMs != null && System.currentTimeMillis() - sendTimeMs > dLedgerConfig.getMaxPushTimeOutMs()) {
      // @2
        logger.warn("[Push-{}]Retry to push entry at {}", peerId, peerWaterMark + 1);
        doAppendInner(peerWaterMark + 1);
    }
}
```

该方法的作用是检查 append 请求是否超时，其关键实现如下：

- 获取已成功 append 的序号。
- 从挂起的请求队列中获取下一条的发送时间，如果不为空并去超过了 append 的超时时间，则再重新发送 append 请求，最大超时时间默认为 1s，可以通过 maxPushTimeOutMs 来改变默认值。

##### 2.3.2.3 doAppendInner 追加请求

向从节点发送 append 请求。

EntryDispatcher#doAppendInner

```java
private void doAppendInner(long index) throws Exception {
    DLedgerEntry entry = dLedgerStore.get(index);   // @1
    PreConditions.check(entry != null, DLedgerResponseCode.UNKNOWN, "writeIndex=%d", index);
    checkQuotaAndWait(entry);                                   // @2
    PushEntryRequest request = buildPushRequest(entry, PushEntryRequest.Type.APPEND);   // @3
    CompletableFuture<PushEntryResponse> responseFuture = dLedgerRpcService.push(request);   // @4
    pendingMap.put(index, System.currentTimeMillis());                                                                          // @5
    responseFuture.whenComplete((x, ex) -> {
        try {
            PreConditions.check(ex == null, DLedgerResponseCode.UNKNOWN);
            DLedgerResponseCode responseCode = DLedgerResponseCode.valueOf(x.getCode());
            switch (responseCode) {
                case SUCCESS:                                                                                                                // @6
                    pendingMap.remove(x.getIndex());
                    updatePeerWaterMark(x.getTerm(), peerId, x.getIndex());
                    quorumAckChecker.wakeup();
                    break;
                case INCONSISTENT_STATE:                                                                                         // @7
                    logger.info("[Push-{}]Get INCONSISTENT_STATE when push index={} term={}", peerId, x.getIndex(), x.getTerm());
                    changeState(-1, PushEntryRequest.Type.COMPARE);
                    break;
                default:
                    logger.warn("[Push-{}]Get error response code {} {}", peerId, responseCode, x.baseInfo());
                    break;
            }
        } catch (Throwable t) {
            logger.error("", t);
        }
    });
    lastPushCommitTimeMs = System.currentTimeMillis();
}
```

代码@1：首先根据序号查询出日志。

代码@2：检测配额，如果超过配额，会进行一定的限流，其关键实现点：

- 首先触发条件：append 挂起请求数已超过最大允许挂起数；基于文件存储并主从差异超过300m，可通过 peerPushThrottlePoint 配置。
- 每秒追加的日志超过 20m(可通过 peerPushQuota 配置)，则会 sleep 1s中后再追加。

代码@3：构建 PUSH 请求日志。

代码@4：通过 Netty 发送网络请求到从节点，从节点收到请求会进行处理(本文并不会探讨与网络相关的实现细节)。

代码@5：用 pendingMap 记录待追加的日志的发送时间，用于发送端判断是否超时的一个依据。

代码@6：请求成功的处理逻辑，其关键实现点如下：

- 移除 pendingMap 中的关于该日志的发送超时时间。
- 更新已成功追加的日志序号(按投票轮次组织，并且每个从服务器一个键值对)。
- 唤醒 quorumAckChecker 线程(主要用于仲裁 append 结果)，后续会详细介绍。

代码@7：Push 请求出现状态不一致情况，将发送 COMPARE 请求，来对比主从节点的数据是否一致。

日志转发 append 追加请求类型就介绍到这里了，接下来我们继续探讨另一个请求类型 compare。

#### 2.3.3 compare 请求详解

COMPARE 类型的请求有 doCompare 方法发送，首先该方法运行在 while (true) 中，故在查阅下面代码时，要注意其退出循环的条件。

EntryDispatcher#doCompare

```java
if (!checkAndFreshState()) {
    break;
}
if (type.get() != PushEntryRequest.Type.COMPARE
    && type.get() != PushEntryRequest.Type.TRUNCATE) {
    break;
}
if (compareIndex == -1 && dLedgerStore.getLedgerEndIndex() == -1) {
    break;
}
```

Step1：验证是否执行，有几个关键点如下：

- 判断是否是主节点，如果不是主节点，则直接跳出。
- 如果是请求类型不是 COMPARE 或 TRUNCATE 请求，则直接跳出。
- 如果已比较索引 和 ledgerEndIndex 都为 -1 ，表示一个新的 DLedger 集群，则直接跳出。

EntryDispatcher#doCompare

```java
if (compareIndex == -1) {
    compareIndex = dLedgerStore.getLedgerEndIndex();
    logger.info("[Push-{}][DoCompare] compareIndex=-1 means start to compare", peerId);
} else if (compareIndex > dLedgerStore.getLedgerEndIndex() || compareIndex < dLedgerStore.getLedgerBeginIndex()) {
    logger.info("[Push-{}][DoCompare] compareIndex={} out of range {}-{}", peerId, compareIndex, dLedgerStore.getLedgerBeginIndex(), dLedgerStore.getLedgerEndIndex());
    compareIndex = dLedgerStore.getLedgerEndIndex();
}
```

Step2：如果 compareIndex 为 -1 或compareIndex 不在有效范围内，则重置待比较序列号为当前已已存储的最大日志序号：ledgerEndIndex。

```java
DLedgerEntry entry = dLedgerStore.get(compareIndex);
PreConditions.check(entry != null, DLedgerResponseCode.INTERNAL_ERROR, "compareIndex=%d", compareIndex);
PushEntryRequest request = buildPushRequest(entry, PushEntryRequest.Type.COMPARE);
CompletableFuture<PushEntryResponse> responseFuture = dLedgerRpcService.push(request);
PushEntryResponse response = responseFuture.get(3, TimeUnit.SECONDS);
```

Step3：根据序号查询到日志，并向从节点发起 COMPARE 请求，其超时时间为 3s。

EntryDispatcher#doCompare

```java
long truncateIndex = -1;
if (response.getCode() == DLedgerResponseCode.SUCCESS.getCode()) {
        // @1
    if (compareIndex == response.getEndIndex()) {
        changeState(compareIndex, PushEntryRequest.Type.APPEND);
        break;
    } else {
        truncateIndex = compareIndex;
    }
} else if (response.getEndIndex() < dLedgerStore.getLedgerBeginIndex() 
        || response.getBeginIndex() > dLedgerStore.getLedgerEndIndex()) {
         // @2
    truncateIndex = dLedgerStore.getLedgerBeginIndex();
} else if (compareIndex < response.getBeginIndex()) {
                                         // @3
    truncateIndex = dLedgerStore.getLedgerBeginIndex();
} else if (compareIndex > response.getEndIndex()) {
                                           // @4
    compareIndex = response.getEndIndex();
} else {
                                                                                                                   // @5
	compareIndex--;
}
if (compareIndex < dLedgerStore.getLedgerBeginIndex()) {
                               // @6
    truncateIndex = dLedgerStore.getLedgerBeginIndex();
}
```

Step4：根据响应结果计算需要截断的日志序号，其主要实现关键点如下：

- 代码@1：如果两者的日志序号相同，则无需截断，下次将直接先从节点发送 append 请求；否则将 truncateIndex 设置为响应结果中的 endIndex。
- 代码@2：如果从节点存储的最大日志序号小于主节点的最小序号，或者从节点的最小日志序号大于主节点的最大日志序号，即两者不相交，这通常发生在从节点崩溃很长一段时间，而主节点删除了过期的条目时。truncateIndex 设置为主节点的 ledgerBeginIndex，即主节点目前最小的偏移量。
- 代码@3：如果已比较的日志序号小于从节点的开始日志序号，很可能是从节点磁盘发送损耗，从主节点最小日志序号开始同步。
- 代码@4：如果已比较的日志序号大于从节点的最大日志序号，则已比较索引设置为从节点最大的日志序号，触发数据的继续同步。
- 代码@5：如果已比较的日志序号大于从节点的开始日志序号，但小于从节点的最大日志序号，则待比较索引减一。
- 代码@6：如果比较出来的日志序号小于主节点的最小日志需要，则设置为主节点的最小序号。

```java
if (truncateIndex != -1) {
    changeState(truncateIndex, PushEntryRequest.Type.TRUNCATE);
    doTruncate(truncateIndex);
    break;
}
```

Step5：如果比较出来的日志序号不等于 -1 ，则向从节点发送 TRUNCATE 请求。

##### 2.3.3.1 doTruncate 详解

```java
private void doTruncate(long truncateIndex) throws Exception {
    PreConditions.check(type.get() == PushEntryRequest.Type.TRUNCATE, DLedgerResponseCode.UNKNOWN);
    DLedgerEntry truncateEntry = dLedgerStore.get(truncateIndex);
    PreConditions.check(truncateEntry != null, DLedgerResponseCode.UNKNOWN);
    logger.info("[Push-{}]Will push data to truncate truncateIndex={} pos={}", peerId, truncateIndex, truncateEntry.getPos());
    PushEntryRequest truncateRequest = buildPushRequest(truncateEntry, PushEntryRequest.Type.TRUNCATE);
    PushEntryResponse truncateResponse = dLedgerRpcService.push(truncateRequest).get(3, TimeUnit.SECONDS);
    PreConditions.check(truncateResponse != null, DLedgerResponseCode.UNKNOWN, "truncateIndex=%d", truncateIndex);
    PreConditions.check(truncateResponse.getCode() == DLedgerResponseCode.SUCCESS.getCode(), DLedgerResponseCode.valueOf(truncateResponse.getCode()), "truncateIndex=%d", truncateIndex);
    lastPushCommitTimeMs = System.currentTimeMillis();
    changeState(truncateIndex, PushEntryRequest.Type.APPEND);
}
```

该方法主要就是构建 truncate 请求到从节点。

关于服务端的消息复制转发就介绍到这里了，主节点负责向从服务器PUSH请求，从节点自然而然的要处理这些请求，接下来我们就按照主节点发送的请求，来具体分析一下从节点是如何响应的。

## 3、EntryHandler 详解

EntryHandler 同样是一个线程，当节点状态为从节点时激活。

### 3.1 核心类图

其核心属性如下：

- long lastCheckFastForwardTimeMs

上一次检查主服务器是否有 push 消息的时间戳。
- ConcurrentMap`>`>` writeRequestMap

append 请求处理队列。
- BlockingQueue`>`>` compareOrTruncateRequests

COMMIT、COMPARE、TRUNCATE 相关请求

### 3.2 handlePush

从上文得知，主节点会主动向从节点传播日志，从节点会通过网络接受到请求数据进行处理，其调用链如图所示：

最终会调用 EntryHandler 的 handlePush 方法。

EntryHandler#handlePush

```java
public CompletableFuture<PushEntryResponse> handlePush(PushEntryRequest request) throws Exception {
    //The timeout should smaller than the remoting layer's request timeout
    CompletableFuture<PushEntryResponse> future = new TimeoutFuture<>(1000);      // @1
    switch (request.getType()) {
        case APPEND:                                                                                                          // @2
            PreConditions.check(request.getEntry() != null, DLedgerResponseCode.UNEXPECTED_ARGUMENT);
            long index = request.getEntry().getIndex();
            Pair<PushEntryRequest, CompletableFuture<PushEntryResponse>> old = writeRequestMap.putIfAbsent(index, new Pair<>(request, future));
            if (old != null) {
                logger.warn("[MONITOR]The index {} has already existed with {} and curr is {}", index, old.getKey().baseInfo(), request.baseInfo());
                future.complete(buildResponse(request, DLedgerResponseCode.REPEATED_PUSH.getCode()));
            }
            break;
        case COMMIT:                                                                                                           // @3
            compareOrTruncateRequests.put(new Pair<>(request, future));
            break;
        case COMPARE:
        case TRUNCATE:                                                                                                     // @4
            PreConditions.check(request.getEntry() != null, DLedgerResponseCode.UNEXPECTED_ARGUMENT);
            writeRequestMap.clear();
            compareOrTruncateRequests.put(new Pair<>(request, future));
            break;
        default:
            logger.error("[BUG]Unknown type {} from {}", request.getType(), request.baseInfo());
            future.complete(buildResponse(request, DLedgerResponseCode.UNEXPECTED_ARGUMENT.getCode()));
            break;
    }
    return future;
}
```

从几点处理主节点的 push 请求，其实现关键点如下。

代码@1：首先构建一个响应结果Future，默认超时时间 1s。

代码@2：如果是 APPEND 请求，放入到 writeRequestMap 集合中，如果已存在该数据结构，说明主节点重复推送，构建返回结果，其状态码为 REPEATED_PUSH。放入到 writeRequestMap 中，由 doWork 方法定时去处理待写入的请求。

代码@3：如果是提交请求， 将请求存入 compareOrTruncateRequests 请求处理中，由 doWork 方法异步处理。

代码@4：如果是 COMPARE 或 TRUNCATE 请求，将待写入队列 writeRequestMap 清空，并将请求放入 compareOrTruncateRequests 请求队列中，由 doWork 方法异步处理。

接下来，我们重点来分析 doWork 方法的实现。

### 3.3 doWork 方法详解

EntryHandler#doWork

```java
public void doWork() {
    try {
        if (!memberState.isFollower()) {
          // @1
            waitForRunning(1);
            return;
        }
        if (compareOrTruncateRequests.peek() != null) {
         // @2
            Pair<PushEntryRequest, CompletableFuture<PushEntryResponse>> pair = compareOrTruncateRequests.poll();
            PreConditions.check(pair != null, DLedgerResponseCode.UNKNOWN);
            switch (pair.getKey().getType()) {
                case TRUNCATE:
                    handleDoTruncate(pair.getKey().getEntry().getIndex(), pair.getKey(), pair.getValue());
                    break;
                case COMPARE:
                    handleDoCompare(pair.getKey().getEntry().getIndex(), pair.getKey(), pair.getValue());
                    break;
                case COMMIT:
                    handleDoCommit(pair.getKey().getCommitIndex(), pair.getKey(), pair.getValue());
                    break;
                default:
                    break;
            }
        } else {
      // @3
            long nextIndex = dLedgerStore.getLedgerEndIndex() + 1;
            Pair<PushEntryRequest, CompletableFuture<PushEntryResponse>> pair = writeRequestMap.remove(nextIndex);
            if (pair == null) {
                checkAbnormalFuture(dLedgerStore.getLedgerEndIndex());
                waitForRunning(1);
                return;
            }
            PushEntryRequest request = pair.getKey();
            handleDoAppend(nextIndex, request, pair.getValue());
        }
    } catch (Throwable t) {
        DLedgerEntryPusher.logger.error("Error in {}", getName(), t);
        DLedgerUtils.sleep(100);
    }
}
```

代码@1：如果当前节点的状态不是从节点，则跳出。

代码@2：如果 compareOrTruncateRequests 队列不为空，说明有COMMIT、COMPARE、TRUNCATE 等请求，这类请求优先处理。值得注意的是这里使用是 peek、poll 等非阻塞方法，然后根据请求的类型，调用对应的方法。稍后详细介绍。

代码@3：如果只有 append 类请求，则根据当前节点最大的消息序号，尝试从 writeRequestMap 容器中，获取下一个消息复制请求(ledgerEndIndex + 1) 为 key 去查找。如果不为空，则执行 doAppend 请求，如果为空，则调用 checkAbnormalFuture 来处理异常情况。

接下来我们来重点分析各个处理细节。

#### 3.3.1 handleDoCommit

处理提交请求，其处理比较简单，就是调用 DLedgerStore 的 updateCommittedIndex 更新其已提交偏移量，故我们还是具体看一下DLedgerStore 的 updateCommittedIndex 方法。

DLedgerMmapFileStore#updateCommittedIndex

```java
public void updateCommittedIndex(long term, long newCommittedIndex) {
        // @1
    if (newCommittedIndex == -1
            || ledgerEndIndex == -1
            || term < memberState.currTerm()
            || newCommittedIndex == this.committedIndex) {
                                    // @2
            return;
    }
    if (newCommittedIndex < this.committedIndex
            || newCommittedIndex < this.ledgerBeginIndex) {
                                  // @3
        logger.warn("[MONITOR]Skip update committed index for new={} < old={} or new={} < beginIndex={}", newCommittedIndex, this.committedIndex, newCommittedIndex, this.ledgerBeginIndex);
        return;
    }
    long endIndex = ledgerEndIndex;
    if (newCommittedIndex > endIndex) {
                                                            // @4
            //If the node fall behind too much, the committedIndex will be larger than enIndex.
        newCommittedIndex = endIndex;
    }
    DLedgerEntry dLedgerEntry = get(newCommittedIndex);                        // @5                
    PreConditions.check(dLedgerEntry != null, DLedgerResponseCode.DISK_ERROR);
    this.committedIndex = newCommittedIndex;
    this.committedPos = dLedgerEntry.getPos() + dLedgerEntry.getSize();     // @6
}
```

代码@1：首先介绍一下方法的参数：

- long term

主节点当前的投票轮次。
- long newCommittedIndex:

主节点发送日志复制请求时的已提交日志序号。

代码@2：如果待更新提交序号为 -1 或 投票轮次小于从节点的投票轮次或主节点投票轮次等于从节点的已提交序号，则直接忽略本次提交动作。

代码@3：如果主节点的已提交日志序号小于从节点的已提交日志序号或待提交序号小于当前节点的最小有效日志序号，则输出警告日志[MONITOR]，并忽略本次提交动作。

代码@4：如果从节点落后主节点太多，则重置 提交索引为从节点当前最大有效日志序号。

代码@5：尝试根据待提交序号从从节点查找数据，如果数据不存在，则抛出 DISK_ERROR 错误。

代码@6：更新 commitedIndex、committedPos 两个指针，DledgerStore会定时将已提交指针刷入 checkpoint 文件，达到持久化 commitedIndex 指针的目的。

#### 3.3.2 handleDoCompare

处理主节点发送过来的 COMPARE 请求，其实现也比较简单，最终调用 buildResponse 方法构造响应结果。

EntryHandler#buildResponse

```java
private PushEntryResponse buildResponse(PushEntryRequest request, int code) {
    PushEntryResponse response = new PushEntryResponse();
    response.setGroup(request.getGroup());
    response.setCode(code);
    response.setTerm(request.getTerm());
    if (request.getType() != PushEntryRequest.Type.COMMIT) {
        response.setIndex(request.getEntry().getIndex());
    }
    response.setBeginIndex(dLedgerStore.getLedgerBeginIndex());
    response.setEndIndex(dLedgerStore.getLedgerEndIndex());
    return response;
}
```

主要也是返回当前从几点的 ledgerBeginIndex、ledgerEndIndex 以及投票轮次，供主节点进行判断比较。

#### 3.3.3 handleDoTruncate

handleDoTruncate 方法实现比较简单，删除从节点上 truncateIndex 日志序号之后的所有日志，具体调用dLedgerStore 的 truncate 方法，由于其存储与 RocketMQ 的存储设计基本类似故本文就不在详细介绍，简单介绍其实现要点：根据日志序号，去定位到日志文件，如果命中具体的文件，则修改相应的读写指针、刷盘指针等，并将所在在物理文件之后的所有文件删除。

#### 3.3.4 handleDoAppend

```java
private void handleDoAppend(long writeIndex, PushEntryRequest request,
    CompletableFuture<PushEntryResponse> future) {
    try {
        PreConditions.check(writeIndex == request.getEntry().getIndex(), DLedgerResponseCode.INCONSISTENT_STATE);
        DLedgerEntry entry = dLedgerStore.appendAsFollower(request.getEntry(), request.getTerm(), request.getLeaderId());
        PreConditions.check(entry.getIndex() == writeIndex, DLedgerResponseCode.INCONSISTENT_STATE);
        future.complete(buildResponse(request, DLedgerResponseCode.SUCCESS.getCode()));
        dLedgerStore.updateCommittedIndex(request.getTerm(), request.getCommitIndex());
    } catch (Throwable t) {
        logger.error("[HandleDoWrite] writeIndex={}", writeIndex, t);
        future.complete(buildResponse(request, DLedgerResponseCode.INCONSISTENT_STATE.getCode()));
    }
}
```

其实现也比较简单，调用DLedgerStore 的 appendAsFollower 方法进行日志的追加，与appendAsLeader 在日志存储部分相同，只是从节点无需再转发日志。

#### 3.3.5 checkAbnormalFuture

该方法是本节的重点，doWork 的从服务器存储的最大有效日志序号(ledgerEndIndex) + 1 序号，尝试从待写请求中获取不到对应的请求时调用，这种情况也很常见，例如主节点并么有将最新的数据 PUSH 给从节点。接下来我们详细来看看该方法的实现细节。

EntryHandler#checkAbnormalFuture

```java
if (DLedgerUtils.elapsed(lastCheckFastForwardTimeMs) < 1000) {
    return;
}
lastCheckFastForwardTimeMs  = System.currentTimeMillis();
if (writeRequestMap.isEmpty()) {
    return;
}
```

Step1：如果上一次检查的时间距现在不到1s，则跳出；如果当前没有积压的append请求，同样跳出，因为可以同样明确的判断出主节点还未推送日志。

EntryHandler#checkAbnormalFuture

```java
for (Pair<PushEntryRequest, CompletableFuture<PushEntryResponse>> pair : writeRequestMap.values()) {
    long index = pair.getKey().getEntry().getIndex();             // @1
    //Fall behind
    if (index <= endIndex) {
                                                        // @2
        try {
            DLedgerEntry local = dLedgerStore.get(index);
            PreConditions.check(pair.getKey().getEntry().equals(local), DLedgerResponseCode.INCONSISTENT_STATE);
            pair.getValue().complete(buildResponse(pair.getKey(), DLedgerResponseCode.SUCCESS.getCode()));
            logger.warn("[PushFallBehind]The leader pushed an entry index={} smaller than current ledgerEndIndex={}, maybe the last ack is missed", index, endIndex);
        } catch (Throwable t) {
            logger.error("[PushFallBehind]The leader pushed an entry index={} smaller than current ledgerEndIndex={}, maybe the last ack is missed", index, endIndex, t);
            pair.getValue().complete(buildResponse(pair.getKey(), DLedgerResponseCode.INCONSISTENT_STATE.getCode()));
        }
        writeRequestMap.remove(index);
        continue;
    }
    //Just OK
    if (index ==  endIndex + 1) {
         // @3
        //The next entry is coming, just return
        return;
    }
    //Fast forward
    TimeoutFuture<PushEntryResponse> future  = (TimeoutFuture<PushEntryResponse>) pair.getValue();    // @4
    if (!future.isTimeOut()) {
        continue;
    }
    if (index < minFastForwardIndex) {
                                                                                                                     // @5
        minFastForwardIndex = index;
    }
}
```

Step2：遍历当前待写入的日志追加请求(主服务器推送过来的日志复制请求)，找到需要快速快进的的索引。其关键实现点如下：

- 代码@1：首先获取待写入日志的序号。
- 代码@2：如果待写入的日志序号小于从节点已追加的日志(endIndex)，并且日志的确已存储在从节点，则返回成功，并输出警告日志【PushFallBehind】，继续监测下一条待写入日志。
- 代码@3：如果待写入 index 等于 endIndex + 1，则结束循环，因为下一条日志消息已经在待写入队列中，即将写入。
- 代码@4：如果待写入 index 大于 endIndex + 1，并且未超时，则直接检查下一条待写入日志。
- 代码@5：如果待写入 index 大于 endIndex + 1，并且已经超时，则记录该索引，使用 minFastForwardIndex 存储。

EntryHandler#checkAbnormalFuture

```java
if (minFastForwardIndex == Long.MAX_VALUE) {
    return;
}
Pair<PushEntryRequest, CompletableFuture<PushEntryResponse>> pair = writeRequestMap.get(minFastForwardIndex);
if (pair == null) {
    return;
}
```

Step3：如果未找到需要快速失败的日志序号或 writeRequestMap 中未找到其请求，则直接结束检测。

EntryHandler#checkAbnormalFuture

```java
logger.warn("[PushFastForward] ledgerEndIndex={} entryIndex={}", endIndex, minFastForwardIndex);
pair.getValue().complete(buildResponse(pair.getKey(), DLedgerResponseCode.INCONSISTENT_STATE.getCode()));
```

Step4：则向主节点报告从节点已经与主节点发生了数据不一致，从节点并没有写入序号 minFastForwardIndex 的日志。如果主节点收到此种响应，将会停止日志转发，转而向各个从节点发送 COMPARE 请求，从而使数据恢复一致。

行为至此，已经详细介绍了主服务器向从服务器发送请求，从服务做出响应，那接下来就来看一下，服务端收到响应结果后的处理，我们要知道主节点会向它所有的从节点传播日志，主节点需要在指定时间内收到超过集群一半节点的确认，才能认为日志写入成功，那我们接下来看一下其实现过程。

## 4、QuorumAckChecker

日志复制投票器，一个日志写请求只有得到集群内的的大多数节点的响应，日志才会被提交。

### 4.1 类图

其核心属性如下：

- long lastPrintWatermarkTimeMs

上次打印水位线的时间戳，单位为毫秒。
- long lastCheckLeakTimeMs

上次检测泄漏的时间戳，单位为毫秒。
- long lastQuorumIndex

已投票仲裁的日志序号。

### 4.2 doWork 详解

QuorumAckChecker#doWork

```java
if (DLedgerUtils.elapsed(lastPrintWatermarkTimeMs) > 3000) {
    logger.info("[{}][{}] term={} ledgerBegin={} ledgerEnd={} committed={} watermarks={}",
            memberState.getSelfId(), memberState.getRole(), memberState.currTerm(), dLedgerStore.getLedgerBeginIndex(), dLedgerStore.getLedgerEndIndex(), dLedgerStore.getCommittedIndex(), JSON.toJSONString(peerWaterMarksByTerm));
    lastPrintWatermarkTimeMs = System.currentTimeMillis();
}
```

Step1：如果离上一次打印 watermak 的时间超过3s，则打印一下当前的 term、ledgerBegin、ledgerEnd、committed、peerWaterMarksByTerm 这些数据日志。

QuorumAckChecker#doWork

```java
if (!memberState.isLeader()) {
    // @2
    waitForRunning(1);
    return;
}
```

Step2：如果当前节点不是主节点，直接返回，不作为。

QuorumAckChecker#doWork

```java
if (pendingAppendResponsesByTerm.size() > 1) {
        // @1
    for (Long term : pendingAppendResponsesByTerm.keySet()) {
        if (term == currTerm) {
            continue;
        }
        for (Map.Entry<Long, TimeoutFuture<AppendEntryResponse>> futureEntry : pendingAppendResponsesByTerm.get(term).entrySet()) {
            AppendEntryResponse response = new AppendEntryResponse();
            response.setGroup(memberState.getGroup());
            response.setIndex(futureEntry.getKey());
            response.setCode(DLedgerResponseCode.TERM_CHANGED.getCode());
            response.setLeaderId(memberState.getLeaderId());
            logger.info("[TermChange] Will clear the pending response index={} for term changed from {} to {}", futureEntry.getKey(), term, currTerm);
            futureEntry.getValue().complete(response);
        }
        pendingAppendResponsesByTerm.remove(term);
    }
}
if (peerWaterMarksByTerm.size() > 1) {
    for (Long term : peerWaterMarksByTerm.keySet()) {
        if (term == currTerm) {
            continue;
        }
        logger.info("[TermChange] Will clear the watermarks for term changed from {} to {}", term, currTerm);
        peerWaterMarksByTerm.remove(term);
    }
}
```

Step3：清理pendingAppendResponsesByTerm、peerWaterMarksByTerm 中本次投票轮次的数据，避免一些不必要的内存使用。

```java
Map<String, Long> peerWaterMarks = peerWaterMarksByTerm.get(currTerm);
long quorumIndex = -1;
for (Long index : peerWaterMarks.values()) {
       // @1
    int num = 0;
    for (Long another : peerWaterMarks.values()) {
       // @2
        if (another >= index) {
            num++;
        }
    }
    if (memberState.isQuorum(num) && index > quorumIndex) {
       // @3
        quorumIndex = index;
    }
}
dLedgerStore.updateCommittedIndex(currTerm, quorumIndex);  // @4
```

Step4：根据各个从节点反馈的进度，进行仲裁，确定已提交序号。为了加深对这段代码的理解，再来啰嗦一下 peerWaterMarks 的作用，存储的是各个从节点当前已成功追加的日志序号。例如一个三节点的 DLedger 集群，peerWaterMarks 数据存储大概如下：

```java
{
“dledger_group_01_0” : 100,
"dledger_group_01_1" : 101,
}
```

其中dledger_group_01_0 为从节点1的ID，当前已复制的序号为 100，而 dledger_group_01_1 为节点2的ID，当前已复制的序号为 101。再加上主节点，如何确定可提交序号呢？

- 代码@1：首先遍历 peerWaterMarks 的 value 集合，即上述示例中的 {100, 101}，用临时变量 index 来表示待投票的日志序号，需要集群内超过半数的节点的已复制序号超过该值，则该日志能被确认提交。
- 代码@2：遍历 peerWaterMarks 中的所有已提交序号，与当前值进行比较，如果节点的已提交序号大于等于待投票的日志序号(index)，num 加一，表示投赞成票。
- 代码@3：对 index 进行仲裁，如果超过半数 并且 index 大于 quorumIndex，更新 quorumIndex 的值为 index。quorumIndex 经过遍历的，得出当前最大的可提交日志序号。
- 代码@4：更新 committedIndex 索引，方便 DLedgerStore 定时将 committedIndex 写入 checkpoint 中。

```java
ConcurrentMap<Long, TimeoutFuture<AppendEntryResponse>> responses = pendingAppendResponsesByTerm.get(currTerm);
boolean needCheck = false;
int ackNum = 0;
if (quorumIndex >= 0) {
    for (Long i = quorumIndex; i >= 0; i--) {
       // @1
        try {
            CompletableFuture<AppendEntryResponse> future = responses.remove(i);   // @2
            if (future == null) {
                                                                                                   // @3
                needCheck = lastQuorumIndex != -1 && lastQuorumIndex != quorumIndex && i != lastQuorumIndex;
                break;
            } else if (!future.isDone()) {
                                                                                     // @4
                AppendEntryResponse response = new AppendEntryResponse();
                response.setGroup(memberState.getGroup());
                response.setTerm(currTerm);
                response.setIndex(i);
                response.setLeaderId(memberState.getSelfId());
                response.setPos(((AppendFuture) future).getPos());
                future.complete(response);
            }
            ackNum++;                                                                                                      // @5
        } catch (Throwable t) {
            logger.error("Error in ack to index={} term={}", i, currTerm, t);
        }
    }
}
```

Step5：处理 quorumIndex 之前的挂起请求，需要发送响应到客户端,其实现步骤：

- 代码@1：从 quorumIndex 开始处理，没处理一条，该序号减一，直到大于0或主动退出，请看后面的退出逻辑。
- 代码@2：responses 中移除该日志条目的挂起请求。
- 代码@3：如果未找到挂起请求，说明前面挂起的请求已经全部处理完毕，准备退出，退出之前再 设置 needCheck 的值，其依据如下(三个条件必须同时满足)：
- 最后一次仲裁的日志序号不等于-1
- 并且最后一次不等于本次新仲裁的日志序号
- 最后一次仲裁的日志序号不等于最后一次仲裁的日志。正常情况一下，条件一、条件二通常为true，但这一条大概率会返回false。
- 代码@4：向客户端返回结果。
- 代码@5：ackNum，表示本次确认的数量。

```java
if (ackNum == 0) {
    for (long i = quorumIndex + 1; i < Integer.MAX_VALUE; i++) {
        TimeoutFuture<AppendEntryResponse> future = responses.get(i);
        if (future == null) {
            break;
        } else if (future.isTimeOut()) {
            AppendEntryResponse response = new AppendEntryResponse();
            response.setGroup(memberState.getGroup());
            response.setCode(DLedgerResponseCode.WAIT_QUORUM_ACK_TIMEOUT.getCode());
            response.setTerm(currTerm);
            response.setIndex(i);
            response.setLeaderId(memberState.getSelfId());
            future.complete(response);
        } else {
            break;
        }
    }
    waitForRunning(1);
}
```

Step6：如果本次确认的个数为0，则尝试去判断超过该仲裁序号的请求，是否已经超时，如果已超时，则返回超时响应结果。

```java
if (DLedgerUtils.elapsed(lastCheckLeakTimeMs) > 1000 || needCheck) {
    updatePeerWaterMark(currTerm, memberState.getSelfId(), dLedgerStore.getLedgerEndIndex());
    for (Map.Entry<Long, TimeoutFuture<AppendEntryResponse>> futureEntry : responses.entrySet()) {
        if (futureEntry.getKey() < quorumIndex) {
            AppendEntryResponse response = new AppendEntryResponse();
            response.setGroup(memberState.getGroup());
            response.setTerm(currTerm);
            response.setIndex(futureEntry.getKey());
            response.setLeaderId(memberState.getSelfId());
            response.setPos(((AppendFuture) futureEntry.getValue()).getPos());
            futureEntry.getValue().complete(response);
            responses.remove(futureEntry.getKey());
        }
    }
    lastCheckLeakTimeMs = System.currentTimeMillis();
}
```

Step7：检查是否发送泄漏。其判断泄漏的依据是如果挂起的请求的日志序号小于已提交的序号，则移除。

Step8：一次日志仲裁就结束了，最后更新 lastQuorumIndex 为本次仲裁的的新的提交值。

关于DLedger 的日志复制部分就介绍到这里了。本文篇幅较长，看到这里的各位亲爱的读者朋友们，麻烦点个赞，谢谢。
