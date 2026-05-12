# 09、分布式事务 实战 - 一致性算法Raft
- 来源：https://ddkk.com/zhuanlan/transaction/6/9.html
- 分类：分布式事务
- 分组：教程目录
## 一致性问题

在分布式系统中,一致性问题(consensus problem)是指对于一组服务器，给定一组操作，我们需要一个协议使得最后它们的结果达成一致。

由于CAP理论告诉我们对于分布式系统，如果不想牺牲一致性，我们就只能放弃可用性，所以，数据一致性模型主要有以下几种：强一致性、弱一致性和最终一致性等，在本篇章中，我们主要讨论的算法Raft，是一种分布式系统中的强一致性的实现算法。

强一致性的一般实现的原理：当其中某个服务器收到客户端的一组指令时,它必须与其它服务器交流以保证所有的服务器都是以同样的顺序收到同样的指令,这样的话所有的服务器会产生一致的结果,看起来就像是一台机器一样。

## Raft算法描述

Raft是斯坦福的Diego Ongaro、John Ousterhout两个人以易懂（Understandability）为目标设计的一致性算法，在2013年发布了论文：《In Search of an Understandable Consensus Algorithm》从2013年发布到现在不过只有两年，到现在已经有了十多种语言的Raft算法实现框架，较为出名的有etcd，Google的Kubernetes也是用了etcd作为他的服务发现框架；由此可见易懂性是多么的重要。

与Paxos不同Raft强调的是易懂（Understandability），Raft和Paxos一样只要保证n/2+1节点正常就能够提供服务；众所周知但问题较为复杂时可以把问题分解为几个小问题来处理，Raft也使用了分而治之的思想把算法流程分为三个子问题：选举（Leader election）、日志复制（Log replication）、安全性（Safety）三个子问题；这里先简单介绍下Raft的流程：

Raft开始时在集群中选举出Leader负责日志复制的管理，Leader接受来自客户端的事务请求（日志），并将它们复制给集群的其他节点，然后负责通知集群中其他节点提交日志，Leader负责保证其他节点与他的日志同步，当Leader宕掉后集群其他节点会发起选举选出新的Leader。

Raft协议基于复制状态机（replicated state machine），即一组server从相同的初始状态起，按相同的顺序执行相同的命令，最终会达到一直的状态，一组server记录相同的操作日志，并以相同的顺序应用到状态机。

这里有一个动画交互，可以玩一把，过程都在里面 [Understandable Distributed Consensus](http://thesecretlivesofdata.com/raft/?spm=a2c4e.11153940.blogcont582124.14.7d471507wVItci)

### 角色 和 term

每台服务器一定会处于三种状态：

**1、** 领导者：Leader；

**2、** 候选人：Candidate；

**3、** 追随者：Follower；

Raft把集群中的节点分为三种状态：Leader、 Follower 、Candidate，理所当然每种状态负责的任务也是不一样的。Raft运行时提供服务的时候只存在Leader与Follower两种状态；

Leader（领导者）：负责日志的同步管理，处理来自客户端的请求，与Follower保持这heartBeat的联系；

Follower（追随者）：刚启动时所有节点为Follower状态，响应Leader的日志同步请求，响应Candidate的请求，把请求到Follower的事务转发给Leader；

Candidate（候选者）：负责选举投票，Raft刚启动时由一个节点从Follower转为Candidate发起选举，选举出Leader后从Candidate转为Leader状态；

Term: Raft算法将时间划分成为任意不同长度的任期（term）。任期用连续的数字进行表示。每一个任期的开始都是一次选举（election），一个或多个候选人会试图成为领导人。如果一个候选人赢得了选举，它就会在该任期的剩余时间担任领导人。在某些情况下，选票会被瓜分，有可能没有选出领导人，那么，将会开始另一个任期，并且立刻开始下一次选举。Raft 算法保证在给定的一个任期最多只有一个领导人。

如果Leader 不变，每次都会通过发送的消息进行同步更新，如果当前服务器保存的 term 较小，那么就会更新到更大的值。

其中term 的标识从 1 开始单调递增，而且总是以选举开始，总的时间不定，可能无限长，也可能只有选举时间。而且因为网络的延迟，各个节点看到相同term的时间点不同，极端情况下可能会有丢失某个 term 的情况。

Term 相当于不依赖墙上时钟的逻辑时间，同样可以用来做一些常规的判断，例如判断是否是一个过期的 Leader、如果收到了一个过期的请求则直接丢弃。

如果Candidate 和 Leader 发现自己的 term 过期，那么会自动切换到 Follower 状态。

### 选举（Election）

一个最小的 Raft 民主集群需要三个参与者（如下图：A、B、C），这样才可能投出多数票。

初始状态 ABC 都是 Follower，然后发起选举这时有三种可能情形发生。下图中前二种都能选出 Leader，第三种则表明本轮投票无效（Split Votes），每方都投给了自己，结果没有任何一方获得多数票，之后每个参与方随机休息一段时间（Election Timeout）重新发起投票直到一方获得多数票。这里的关键就是随机 timeout，最先从 timeout 中恢复发起投票的一方向还在 timeout 中的另外两方请求投票，这时它们就只能投给对方了，很快达成一致。

选出Leader 后，Leader 通过定期（要小于超时时间）向所有 Follower 发送心跳信息维持其统治（刷新Follower的本地超时时间，让其不成为Candidate）。若 Follower 一段时间未收到 Leader 的心跳则认为 Leader 可能已经挂了再次发起选主过程。

### 日志复制（Log Replication）

当leader选出来后，无论读和写（事务请求或说成命令也就是这里说的日志）都会由leader节点来处理。

是的，读也由leader来处理，leader拿到请求后，再决定由哪一个节点来处理，要么将请求分发，要么自己处理；即使client端请求的是follower节点，Follower节点也会现将请求信息转给leader，再由leader决定由哪个节点来处理。

来看看写的情况总体过程：

先把该日志追加到本地的Log中，然后通过heartbeat把该Entry同步给其他Follower，Follower接收到日志后记录日志然后向Leader发送ACK，当Leader收到大多数（n/2+1）Follower的ACK信息后将该日志设置为已提交并追加到本地磁盘中，通知客户端并在下个heartbeat中Leader将通知所有的Follower将该日志存储在自己的本地磁盘中。

分布式共识算法负责维护一系列的 log，每个 log 包含一条命令，共识算法负责保证所有节点上的 log 序列完全一致。这样就保证 log apply到状态机的时候，状态机的状态是一致的。

Raft 算法的日志结构如下。每条 log 包含一个 index，一个 term 和一条 command。由于每个 term 只有一个 leader，因此 Raft 的 log 有一个特性是如果某个 index 处 log 的 term 一致，则该 index 处对应的 command 也一定是一致的。这个特性在日志复制的 Log Match 过程中会被应用到。

Raft 的 Log Replication 主要依赖于 AppendEntry RPC。该 RPC 具体定义如下。该 RPC 能够保证 log 一致性的关键在于 Log Match 过程。每次 AppendEntry RPC 都包含两个重要的属性，prevLogIndex 和 prevLogTerm。记录了当前所复制日志的前一条日志的 index 和 term。接受者收到后，会匹配一下 index 处的 log 的 term 是否一致。

- term 一致则对应的 command 一定是一致的。并且可以推出在此次新增的数据之前的数据是一致的，那么就接收此次 AppendEntry RPC 所携带的 log。
- term 不一致则说明之前已经存在数据不一致，则拒绝此次 RPC。发送者在收到拒绝后会向前搜索，直至找到第一个匹配成功的 log，请将此之后的 log 全部复制。

举例说明这个过程，如图所示。

- leader 要把 index 为10的日志复制给 a，则会匹配 index 为9处的 term，即 prevLogIndex 为9，prevLogTerm 为6，此时可以匹配成功，则复制AppendEntry RPC携带的 log
- leader 要把 index 为8的日志复制给e，则会匹配 index 为7处的 term，即 prevLogIndex 为7，prevLogTerm 为5。由于 eindex 为7处的 term 为4，匹配失败，则 leader 会向前搜索并进行匹配，直至 index 为5处的 log 匹配成功，则发送6之后所有的 log 给 e

###

### Raft 协议如何针对不同阶段保障数据一致性的

如下图，在这个过程中，主节点可能在任意阶段挂掉

**第1步leader挂了（数据未到达leader节点）**

这个阶段 Leader 挂掉不影响一致性，还没有开始，集群数据一致性。

**第2.1步leader挂了（数据到达leader节点，但未复制到follower节点）**

这个阶段 Leader 挂掉，数据属于未提交状态，Client 不会收到 Ack 会认为超时失败可安全发起重试。Follower 节点上没有该数据，重新选主后 Client 重试重新提交可成功。原来的 Leader 节点恢复后作为 Follower 加入集群重新从当前任期的新 Leader 处同步数据，强制保持和 Leader 数据一致。

**第3.1步leader挂了（数据到达 Leader 节点，成功复制到 Follower 所有节点，但还未向 Leader 响应接收）**

这个阶段 Leader 挂掉，虽然数据在 Follower 节点处于未提交状态（Uncommitted）但保持一致，重新选出 Leader 后可完成数据提交，此时 Client 由于不知到底提交成功没有，可重试提交。针对这种情况 Raft 要求 RPC 请求实现幂等性，也就是要实现内部去重机制。

**第3.1步leader挂了（数据到达 Leader 节点，成功复制到 Follower 部分节点，但还未向 Leader 响应接收）**

这个阶段 Leader 挂掉，数据在 Follower 节点处于未提交状态（Uncommitted）且不一致，Raft 协议要求投票只能投给拥有最新数据的节点。所以拥有最新数据的节点会被选为 Leader 再强制同步数据到 Follower，数据不会丢失并最终一致。

**第4步（数据到达 Leader 节点，成功复制到 Follower 所有或多数节点，数据在 Leader 处于已提交状态，但在 Follower 处于未提交状态）**

这个阶段 Leader 挂掉，重新选出新 Leader 后的处理流程和阶段 3 一样。

**第4.1步leader挂（数据到达 Leader 节点，成功复制到 Follower 所有或多数节点，数据在所有节点都处于已提交状态，但还未响应 Client）**

这个阶段 Leader 挂掉，Cluster 内部数据其实已经是一致的，Client 重复重试基于幂等策略对一致性无影响。

**其他情况：网络分区导致的脑裂情况，出现双 Leader**

网络分区将原先的 Leader 节点和 Follower 节点分隔开，Follower 收不到 Leader 的心跳将发起选举产生新的 Leader。这时就产生了双 Leader，原先的 Leader 独自在一个区，向它提交数据不可能复制到多数节点所以永远提交不成功。向新的 Leader 提交数据可以提交成功，网络恢复后旧的 Leader 发现集群中有更新任期（Term）的新 Leader 则自动降级为 Follower 并从新 Leader 处同步数据达成集群数据一致。

综上穷举分析了最小集群（3 节点）面临的所有情况，可以看出 Raft 协议都能很好的应对一致性问题，并且很容易理解。

### 安全性（Safety）

安全性是用于保证每个节点都执行相同序列的安全机制，如当某个Follower在当前Leader commit Log时变得不可用了，稍后可能该Follower又会倍选举为Leader，这时新Leader可能会用新的Log覆盖先前已committed的Log，这就是导致节点执行不同序列；

Safety就是用于保证选举出来的Leader一定包含先前 commited Log的机制；

Raft在选举阶段就使用Term的判断用于保证完整性：当请求投票的该Candidate的Term较大或Term相同Index更大则投票，否则拒绝该请求；

**1. 领导者追加日志（Append-Only)**

领导者永远不会覆盖已经存在的日志条目；

日志永远只有一个流向：从领导者到追随者；

**2. 选举限制：投票阻止没有全部日志条目的服务器赢得选举**

如果投票者的日志比候选人的新，拒绝投票请求；

这意味着要赢得选举，候选者的日志至少和大多数服务器的日志一样新，那么它一定包含全部的已经提交的日志条目。

**3. 永远不提交任期之前的日志条目（只提交任期内的日志条目）**

在Raft算法中，当一个日志被安全的复制到绝大多数的机器上面，即AppendEntries RPC在绝大多数服务器正确返回了，那么这个日志就是被提交了，然后领导者会更新commit index。

**可以看下过程**：

假设leader 此时 down 了，b 节点率先 election timeout，此时，如果 b 节点得到了超过半数节点的投票当选 leader，name 显然红色虚线框内已经被 commit 的 entry 就丢失了。为了避免这种情况的出现，必须加一条限制：

> **限制一：**节点 m 向节点 n 发送了 RequestVote RPC，如果节点 n 发现节点 m 的数据没有自己新，则节点 n拒绝节点 m 的投票请求。这里的“新”包含两个方面，term 更大的数据更新，term 相同，index更大的数据更新。

加上这条限制之后，我们看到图中节点 b 最多只能拿到自己和节点 f 的投票，未超过半数，不能当选 leader。

更为普适的去理解为什么加了这个限制之后，就能保证一条已经被 commit 的 entry 一定会出现在未来的 term 中：

**1、** 对于一条已经被提交的log**I**，**I**一定被复制到了超过半数的节点上，记这个节点集合为**Q1**；

**2、** 对于之后的一个leader**L**而言，**L**一定获得了超过半数节点的投票，记这个节点集合为**Q2**；

**3、** 根据鸽笼原理，**Q1**和**Q2**两个集合至少存在一个交集，记这个交集节点为**S**；

**4、****S**既包含**I**同时又向**L**投了票，因此在**限制一**的限制下，**L**一定包含**I**；

有了**限制一**就能满足第二条规则吗？看一个例子：

- a 时刻 S1 是leader复制了一条log到 S2 上
- b 时刻 S1 down 掉 S5 当选 leader
- c 时刻 S5 down 掉 S1 成功当选 leader，S1将之前 term2 的日志复制到了 S3 上，term2的日志已经超过半数。此时我们能将 term2 的日志标记为 commited 吗？

假设我们将 term2的日志标记为 commited，如果此时 S1 down 机 S5可能当选 leader，但是 S5上没有 term2的这条日志，就导致这条被标记为 commited 的日志没有出现在未来的 term 中。

为什么会发生这种情况？最根本的原因在于 S1 在 term4当选 leader 时，其他节点根本不知道 term4 的存在，导致 term 出现了倒退的现象，把 term4复制的日志给覆盖了。为了避免这种情况的产生，便有了另外一条限制：

> **限制二：**不直接提交之前 term 的log，必须通过提交本 term 的 log，间接的提交之前 term 的 log

加上这条限制，之前的例子中，S5就不可能当选 leader，因为超过半数的节点已经知道 term4的存在从而不会给 S5 投票。很多系统的实现中，都是在当选新 leader 后，立马提交一个 NOP Entry 来满足这条限制的。

## RPC

Raft 算法中服务器节点之间通信使用远程过程调用（RPCs），并且基本的一致性算法只需要两种类型的 RPCs。请求投票（RequestVote） RPCs 由候选人在选举期间发起，然后附加条目（AppendEntries）RPCs 由领导人发起，用来复制日志和提供一种心跳机制。为了在服务器之间传输快照增加了第三种 RPC。当服务器没有及时的收到 RPC 的响应时，会进行重试， 并且他们能够并行的发起 RPCs 来获得最佳的性能。

RPC有三种：

- RequestVote RPC：候选人在选举期间发起
- AppendEntries RPC：领导人发起的一种心跳机制，复制日志也在该命令中完成\
- InstallSnapshot RPC: 领导者使用该RPC来发送快照给太落后的追随者。

**超时设置**：

- BroadcastTime : 领导者的心跳超时时间
- Election Timeout: 追随者设置的候选超时时间
- MTBT :指的是单个服务器发生故障的间隔时间的平均数

BroadcastTime << ElectionTimeout << MTBF

**两个原则**：

BroadcastTime应该比ElectionTimeout小一个数量级，为的是使领导人能够持续发送心跳信息（heartbeat）来阻止追随者们开始选举；

ElectionTimeout也要比MTBF小几个数量级，为的是使得系统稳定运行。一般BroadcastTime大约为0.5毫秒到20毫秒，ElectionTimeout一般在10ms到500ms之间。大多数服务器的MTBF都在几个月甚至更长。

## Client交互

**1、** Client只向领导者发送请求；

**2、** Client开始会向追随者发送请求，追随者拒绝Client的请求，并重定向到领导者；

**3、** Client请求失败，会超时重新发送请求；

Raft算法要求Client的请求线性化，防止请求被多次执行。有两个解决方案：

**1、** Raft算法提出要求每个请求有个唯一标识；

**2、** Raft的请求保持幂等性；

## Raft的应用

分布式存储系统通常通过维护多个副本来提高系统的availability，带来的代价就是分布式存储系统的核心问题之一：维护多个副本的一致性。

这里用ETCD来关注Raft的应用，ETCD目标是构建一个高可用的分布式键值（key-value）数据库，基于 Go 语言实现。

Etcd 主要用途是共享配置和服务发现，实现一致性使用了Raft算法。

更多Etcd的应用可以查看文档：[https://coreos.com/etcd/docs/latest/](https://coreos.com/etcd/docs/latest/?spm=a2c4e.11153940.blogcont582124.16.7d471507wVItci)
