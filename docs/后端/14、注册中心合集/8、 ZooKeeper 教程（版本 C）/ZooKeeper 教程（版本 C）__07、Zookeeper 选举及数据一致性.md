# 07、Zookeeper 选举及数据一致性
- 来源：https://ddkk.com/zhuanlan/registered/zookeeper/d-3/7.html
- 分类：注册中心
- 分组：ZooKeeper 教程（版本 C）
## ZAB协议

ZAB(Zookeeper Atomic Broadcast)协议，即Zookeeper原子消息广播协议，协议内容大致如下：

- 所有事物的请求必须由全局唯一的服务器来协调处理，这样的服务器被称为Leader服务器，而余下的其他服务器则称为Follower服务器，Leader服务器负责将一个客户端的事物请求转换成一个事物Proposal(提议)，并将该Proposal分发给集群中的所有Follower服务器，之后Leader服务器需要等待所有Follower服务器的反馈，一旦超过半数的Follower服务器进行了正确的反馈后，那么Leader就会再次向所有的Follower服务器分发Commit消息，要求其将前一个Proposal提交。

zk集群中Leader的选举需要依赖此协议，数据的写入过程也需要依赖此协议，ZAB的核心是定义了那些会改变zk服务器数据状态的事务请求的处理方式。

## Zookeeper集群中节点角色

Zookeeper集群中节点有如下三种角色：

- Leader:事务请求的唯一调度和处理者，保证集群事务处理的顺序性，同时也是集群内部个服务器的调度者；
- Follower:处理客户端的非事务请求，转发事务请求给Leader服务器，参与事务请求Proposal的投票，参与Leader选举投票；
- Observer:处理客户端非事务请求，转发事务请求给Leader服务器，不参与任何形式的投票，包括选举和事务投票(超过半数确认)，此角色存在通常是为了提高读性能；

## Zookeeper集群中节点的状态

Zookeeper集群中节点存在如下几种状态：

- LOOKING:寻找Leader的状态，当服务器处于此状态时，表示当前没有Leader，需要进入选举流程；
- FOLLOWING:跟随者状态，表明当前服务器角色是Follower；
- OBSERVING:观察者状态，表明当前服务器是Observer；
- LEADING:领导者状态，表明当前服务器角色为Leader；

以上状态定义在`org.apache.zookeeper.server.quorum.QuorumPeer.ServerState`枚举中。

## Zookeeper集群中节点间的通信

Zookeeper集群中的节点基于TCP协议进行通信，为避免重复创建两个节点之间的TCP连接，Zookeeper按照myid数值方向来建立连接，即myid小的节点项myid大的节点发起连接，例如myid为1的节点向myid为2的节点发起连接；节点之间配置两个通信端口，例如配置项`server.1=localhost:2888:3888`中第一个端口2888是通信和数据同步端口，第二个端口3888是投票端口。

## Zookeeper中Leader选举算法

从3.4.0版本后Zookeeper只支持，基于TCP协议的`org.apache.zookeeper.server.quorum.FastLeaderElection`选举算法，我们在源码解析中也只会分析该算法。

## Zookeeper中Leader选举的触发时机

在以下两种情况下会触发Leader的选举：

- 集群启动：集群刚启动的时候节点处于LOOKING状态，当前没有Leader，需要进入选举流程；
- 奔溃恢复：例如Leader宕机，或者因为网络原因导致过半节点与Leader心跳中断；

## Zookeeper Leader的选举

### 影响节点称为Leader的因素

Zookeeper通过以下三个因素来判断一个节点能否称为Leader：

- **数据的新旧程度**：只有最新的数据节点才有机会成为Leader，在Zookeeper中通过事物id(zxid)的大小来表示数据的新旧，越大代表数据越新；
- **myid**：集群在启动的时候，会在数据目录下配置myid文件，里面的数字代表当前zk节点的编号，当zk节点数据一样新时，myid中数字越大的就会被选举成为Leader，当集群中已经有Leader时，新加入的节点不会影响原来的集群；
- **投票数量**：只有得到集群中多半的投票，才能成为Leader，多半即(n/2 + 1)，n为集群中节点数量；

事物id(zxid)是一个64位的长整型(long)数字，由主进程周期(epoch)和事物单调递增的计数器两部分组成：

- **主进程周期**：Zookeeper运行过程中选举的伦次，每多一次选举，则主进程周期加一，zxid的高32位代表主进程周期，比较数据新旧时，先比较epoch的大小；
- **事物单调递增的计数器**：是zxid的低32位，选举完成后从0开始，每处理一次事物，则该值加一；

### Leader的选举过程

为简单描述，我们以3个节点的Zookeeper集群为例，三个节点对应的myid为1、2、3，分析初次启动时Leader的选举和运行过程中Leader宕机后新Leader的选举。

#### 初次启动时Leader的选举

初次启动时三个Zookeeper节点都没有数据，Leader选举过程如下：

**1、** 第一步：启动myid为1的节点，此时zxid为0，没法选举出Leader节点；

**2、** 第二步：启动myid为2的节点，它的zxid也为0，但它的myid更大，因此第二个节点成为Leader节点；

**3、** 第三步：启动myid为3的节点，因为已经有了Leader节点，3加入集群后2还是Leader节点；

#### 运次那个过程中Leader宕机后新Leader的选举

假设server2为主节点，并且server2宕机，剩下server1和server3进行Leader的选举。选举流程如下：

**1、****变更状态**：Leader宕机后，其他节点的状态变为LOOKING；

**2、****生成投票信息**：每个server发出一个投自己的票的投票，假定生成的投票信息为(myid,zxid)的形式，server1的投票信息为(1,123)，并将该投票信息发给server3，server3的投票信息为(3,122)，并将该投票信息发给server1；

**3、****投票处理**：server3收到server1的投票信息(1,123)，发现该投票的zxid123比server1自己投票信息中的zxid122大，则server3修改自己的投票信息为(1,123)，然后发给server1；

**4、****投票处理**：server1收到server3的投票信息(3,122)，发现zxid122比自己的投票信息中的zxid123要小，则不改变自己的投票；

**5、****统计投票信息**：server3统计收到的投票(包括自己投的)，(1,123)是两票，server1统计收到的投票(包括自己投的)，(1,123)是两票；

**6、****修改服务器状态**：server3中选出的Leader是1，而自己是3，因此自己进入FOLLOWING状态，即follower角色，server1中选出的Leader是1，自己就是1，因此进入LEADING状态，即Leader角色；

当Leader选举完成后，Follower需要与新的Leader同步数据。进入数据同步阶段。

## Zookeeper数据同步

当Leader完成选举后，Follower需要与新的Leader同步数据。在Leader端需要做如下工作：

- Leader告诉其他Follower当前最新数据是什么即zxid，Leader会构建一个NEWLEADER包，包括当前最大的zxid，发送给所有的Follower或者Observer；
- Leader给每个Follower创建一个线程LearnerHandler来负责处理每个Follower的数据同步请求，同时主线程开始阻塞，只有超过一半的Follower同步完成，同步过程才完成，Leader才能成为真正的Leader；
- Leader端根据同步算法进行同步操作；

而在Follower端会做如下工作：

- 选举完成后，尝试与Leader建立同步连接，如果一段时间没有连接上就报错超时，重新回到选举状态；
- 向Leader发送FOLLOWERINFO封包，带上自己最大的zxid；
- 根据同步算法进行同步操作；

具体使用哪种同步算法取决于Follower当前最大的zxid，在Leader端会维护最小事务id`minCommittedLog`和最大事务id`maxCommittedLog`两个zxid，`minComittedLog`是没有被快照存储的日志文件的第一条(每次快照储存完，会重新生成一个事务日志文件)，`maxCommittedLog`是事务日志中最大的事务。Zookeeper中实现了以下数据同步算法：

- 直接差异化同步(DIFF同步)
- 仅回滚同步(TRUNC)，即删除多余的事务日志，比如原来的Leader节点宕机后又重新加入，可能存在它自己写入并提交但是别的节点还没来得及提交的数据；
- 先回滚(TRUNC)再差异化(DIFF)同步；
- 全量同步(SNAP)；

我们用`peerLastZxid`代表Follower端最大的事务id，结合几个具体的场景学习如何选择同步算法。

### 场景一：同一选举轮次下Follower从Leader同步数据

假设Leader端未被快照存储的zxid为0x500000001、0x500000002、0x500000003、0x500000004、0x500000005，此时Follower端最大已提交的zxid(即peerLastZxid)为0x500000003，因此需要把0x500000004、0x500000005同步给Follower，直接使用差异化同步(DIFF)即可，Leader端差异化同步消息的发送顺序如下：

发送顺序
数据包类型
对应的zxid

1
PROPOSAL
0x500000004

2
COMMIT
0x500000004

3
PROPOSAL
0x500000005

4
COMMIT
0x500000005

Follower端同步过程如下：

**1、** Follower端首先收到DIFF指令，进入DIFF同步阶段；

**2、** Follower收到同步的数据和提交命令，并应用到内存数据库当中；

**3、** 同步完成后，Leader会发送一个NEWLEADER指令，通知Follower已经将最新的数据同步给Follower了，Follower收到NEWLEADER指令后反馈一个ack消息，表明自己已经同步完成；

单个Follower同步完成后，Leader会进入集群的"过半策略"等待状态，当有超过一半的Follower都同步完成以后，Leader会向已经完成同步的Follower发送UPTODATE指令，用于通知Follower已经完成数据同步，可以对外提供服务了，最后Follower收到Leader的UPTODATE指令后，会终止数据同步流程，向Leader再次反馈一个ack消息。

### 场景二：Leader宕机了，但不久之后又重新加入集群

Leader在本地提交事务完成，还没来得及把事务提交提议发送给其他节点前宕机了。

为描述方便，假设集群有三个节点，分别是A、B、C，没有宕机前Leader是B，已经发送过0x500000001和0x500000002的数据修改提议和事务提交提议，并且发送了0x500000003的数据修改提议，但在B节点发送事务提交提议之前，B宕机了，由于是本机发送，所以B的本地事务已经提交，即B最新的数据是0x500000003，但发送给A和C的事务提议失败了，A和C的最新数据依然是0x500000002，B宕机后，A和C会进行Leader选举，假设C成为新的Leader，并且进行过两次数据修改，对应的zxid为0x600000001、0x600000002，然而此时B机器恢复后加入新集群(AC)，重新进行数据同步，对B来说，`peerLastZxid`为0x500000003，对于当前的Leader C来说，`minCommitedLog=0x500000001`, `maxCommittedLog=0x600000002`(总共是0x500000001、0x500000002、0x600000001、0x600000002几个未被快照的事务)。这种情况下使用(TRUNC + DIFF)的同步方式，同步过程如下：

**1、** B恢复并且向已有的集群(AC)注册后，向C发起同步连接的请求;；

**2、** B向LeaderC发送FOLLOWERINFO包，带上Follower自己最大的zxid(0x500000003);；

**3、** C发现自己没有0x500000003这个事务提交记录，就向B发送TRUNC指令，让B回滚到0x500000002；

**4、** B回滚完成后，向C发送信息包，确认完成，并说明当前的zxid为0x500000002；

**5、** C向B发送DIFF同步指令；

**6、** B收到DIFF指令后进入同步状态，并向C发送ACK确认包；

**7、** C陆续把对应的差异数据修改提议和Commit提议发给B，当数据发送完成后，再发送通知包给B；

**8、** B将数据修改提议应用于内存数据结构并Commit，(当集群中过半机器同步完成)当收到C通知已经同步完成后，B给回应ACK，并且结束同步；

这种情况仍然是`minCommitedLog  note: 由于在有过半机器给出反馈时，Leader已经发起Commit提议，因此可能存在某时刻某些节点不是最新的，如果需要读取到的数据是最新的，可以在读取之前调用sync方法进行数据同步

> 版权声明：「DDKK.COM 弟弟快看，程序员编程资料站」本站文章，版权归原作者所有
