# 18、Zookeeper 源码解析 - 原子广播
- 来源：https://ddkk.com/zhuanlan/registered/zookeeper/2/18.html
- 分类：注册中心
- 分组：教程目录
### 一、原子广播

当完成Leader选举或者集群崩溃恢复之后，就开始原子广播过程，这个过程是保证当前集群中的数据一致性，原子广播也就是ZAB协议的实现过程。选举出来的Leader中的事务id，通常来说是集群中最新的，但是Follower和Observer节点可能存在数据不一致的情况，此时需要进行数的同步操作。

我们以Follower节点为例，完成Leader选举之后，会调用followLeader()方法，方法中首先会设置当前的ZAB状态为DISCOVERY。

```java
self.setZabState(QuorumPeer.ZabState.DISCOVERY);
```

然后调用findLeader()找到集群中的leader节点，然后跟Leader节点建立通信，紧接着执行过程如下：

**1、** Follower发送一个FOLLOWERINFO消息给Leader节点，然后附带上自己的Epoch值，协议版本号（0x10000）、以及版本号（0），此时Leader节点收到FOLLOWERINFO信息之后，会把最新的Epoch返回给Follower节点（消息类型是LEADERINFO）；

**2、** Follower节点收到来自Leader节点的LEADERINFO信息，根据Leader节点的Epoch和本节点的Epoch进行比较，如果Leader比自己新那么更新本节点的Epoch值，并返回当前的Epoch给Leader节点，如果相等则返回-1，如果小于则抛出异常（表示当前Leader节点不是最新的数据节点），Follower会返回一个ACKEPOCH数据给Leader节点，带上最新的事务编号zxid和当前的epoch；

**3、** Leader接收到ACKEPOCH响应，把Follower传递过来的epoch和zxid封装成StateSummary，调用waitForEpochAck方法，等待当前Leader节点确认完成然后调用syncFollower方法进行同步，通过对比Follower节点和Leader节点的zxid值，如果相等则以DIFF模式同步数据，如果要比Leader的新，则采用TRUNC模式同步，如果Follower节点数据比较旧，Leader会以Proposal和commit方式同步数据给Follower（DIFF），至于SNAP方式，则基本不会发生，但是也是一种情况；

**4、** 此时Follower收到服务端的Epoch，然后设置当前的ZAB状态为SYNCHRONIZATION同步状态；

**5、** follower调用syncWithLeader方法进行数据同步过程，不同方式就是DIFF、TRUNC、SNAP已经做过介绍；

**6、** Follower完成同步之后，此时数据与Leader端保持一致，然后更新当前的ZAB状态为BROADCAST广播状态，然后Leader节点开始循环等待服务端的Proposal和commit命令Leader节点也更新为BROADCAST；

### 二、总结

原子广播是保证，集群中数据一致性，其中有四种状态：

**1、** ELECTION：表示当前处于Leader选举；

**2、** DISCOVERY：这时候Follower会和Leader建立通信连接，然后交换双发的Epoch和zxid；

**3、** SYNCHRONIZATION：这个节点在Leader完成最终选举之后，Follower和Observer节点开始同步Leader节点最新的数据；

**4、** BROADCAST：这个阶段就是Leader节点收到客户端的事务性请求，然后发起Proposal等待Follower反馈，如果过半节点同意提交则发起commit命令然后leader节点提交本操作；

以上，有任何不对的地方，请留言指正，敬请谅解。
