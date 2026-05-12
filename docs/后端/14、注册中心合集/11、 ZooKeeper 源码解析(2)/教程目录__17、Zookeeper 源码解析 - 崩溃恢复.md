# 17、Zookeeper 源码解析 - 崩溃恢复
- 来源：https://ddkk.com/zhuanlan/registered/zookeeper/2/17.html
- 分类：注册中心
- 分组：教程目录
### 一、崩溃恢复

崩溃恢复一般指当前集群中不存在Leader节点时，此时集群处于一个崩溃的状态需要及时的选举出新的Leader，然后进行数据一致性处理，Leader崩溃是指，Leader节点退出或者重启以及集群中半数Follower不能与Leader保持通信，此时认为处于崩溃状态。针对这几种情况从源码角度分析集群的恢复过程。

**1、Leader宕机或者重启**

出现这种情况是，集群中的Follower节点会重新选举新的Leader节点，此时我们从Follower节点来分析，新的Leader发起过程。在完成Leader选举之后，Follower节点会阻塞在follower.followLeader()方法调用。followLeader方法会循环接收和处理Leader同步的数据，当Leader宕机或者重启之后，Follower就会关闭当前的socket连接然后退出循环，followLeader()不在阻塞。

```java
case FOLLOWING:
  try {
   setFollower(makeFollower(logFactory));
   follower.followLeader();
  } catch (Exception e) {
  } finally {
       //关闭follower
       follower.shutdown();
       //follower置空
       setFollower(null);
       //更新当前节点状态为LOOKING
       updateServerState();
  }
break;
```

follower.shutdown()：

Follower关闭会先关闭所有客户端的连接，把当前的ZooKeeperServer置空，关闭与Leader的连接（如果存在），调用ZooKeeperServer的关闭方法，如果当前与Leader节点同步方式是SNAP还会清空当前的数据库中的数据。也就是说当Leader节点崩溃之后，所有的Follower节点会重新更新节点状态为LOOKING，并恢复节点中各种数据状态，此时开启新一轮的选举过程。

### 2、过半Follower不能与Leader通信

对于不能与Leader通信的Follower节点会自动更新当前的状态为LOOKING,然后开启新的集群选举过程，此时还有少量机器和Leader节点还是处于正常状态，我们从Leader角度去分析。Leader的lead方法会通过LearnerHandler去与集群中Learner节点建立连接，然后再通过while循环不断的与Learner进行心跳检测。

在心跳检测的while循环中，会通过SyncedLearnerTracker实例来检测当前保持正常通行的Learner，LearnerHandler中当与Learner断开通信后会，run方法随之也会执行完成，此时SyncedLearnerTracker会把断开通信的Learner节点添加到集合中，如果过半节点失去通信，则退出当前循环，此时Leader节点会断开所有的Learner之间的通信，然后调用shutdown方法。此时lead方法不再阻塞。然后置空当前的leader状态，然后设置节点状态为LOOKING，同时所有的Learner节点也会被置为LOOKING状态，此时会开启新一轮的Leader选举过程。
