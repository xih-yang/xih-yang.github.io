# 12、Zookeeper 源码解析 - Leader选举（1）
- 来源：https://ddkk.com/zhuanlan/registered/zookeeper/2/12.html
- 分类：注册中心
- 分组：教程目录
### 一、节点角色

ZooKeeper中节点角色有Leader、Follower、Observer。

**1、** Leader：负责处理处理写请求、协调集群中的其它节点、发起投票，以及同步最新数据给其它节点；

**2、** Follower：负责读请求，当接收到写请求会转发当前的写请求给Leader节点，参与Leader选举；

**3、** Observer：负责读请求，不参与Leader选举；

### 二、源码分析

接下我们从源码的角度去分析ZooKeeper中的ZAB实现过程，回到集群启动的QuorumPeer的start方法：

```java
public synchronized void start() {
    loadDataBase();
    startServerCnxnFactory();
    try {
        adminServer.start();
    } catch (AdminServerException e) {
        LOG.warn("Problem starting AdminServer", e);
        System.out.println(e);
    }
    startLeaderElection();
    startJvmPauseMonitor();
    super.start();
}
```

这个方法前文已经分析过，我们主要关注两个调用startLeaderElection()和super.start()前者是开始Leader选举，后者是启动当前QuorumPeer线程。我们先来看看startLeaderElection方法具体做了什么？

```java
 //服务的默认状态是LOOKING
private ServerState state = ServerState.LOOKING;
public synchronized void startLeaderElection() {
    try {
        //表示当前服务刚启动
        if (getPeerState() == ServerState.LOOKING) {
            //当前的选票，投给自己
            currentVote = new Vote(myid, getLastLoggedZxid(), getCurrentEpoch());
        }
    } catch (IOException e) {
        RuntimeException re = new RuntimeException(e.getMessage());
        re.setStackTrace(e.getStackTrace());
        throw re;
    }
    //创建选举算法
    this.electionAlg = createElectionAlgorithm(electionType);
}
```

其中myid就是在data目录下配置myid文件中的值，zxid就是当前日志中最新的事务id，epoch是64位的long类型，其中低32位表示当前发起的提案数，高32位表示当前leader选举的周期数，没发起一次提案低32位进行递增，新一轮的leader选举，高32自动递增。也就是保证了全局最新的提案id值。

接下来我们看看选举算法的创建过程createElectionAlgorithm(electionType)：

```java
protected Election createElectionAlgorithm(int electionAlgorithm) {
    Election le = null;
    //也就是electionAlgorithm=3才是合法有效的
    switch (electionAlgorithm) {
    case 1:
        throw new UnsupportedOperationException("Election Algorithm 1 is not supported.");
    case 2:
        throw new UnsupportedOperationException("Election Algorithm 2 is not supported.");
    case 3:
    //创建一个QuorumCnxManager管理对象
        QuorumCnxManager qcm = createCnxnManager();
        //初始启动的时候oldQcm为空
        QuorumCnxManager oldQcm = qcmRef.getAndSet(qcm);
        if (oldQcm != null) {
            LOG.warn("Clobbering already-set QuorumCnxManager (restarting leader election?)");
            oldQcm.halt();
        }
        //Listener 是在QuorumCnxManager构造方法中初始化的
        QuorumCnxManager.Listener listener = qcm.listener;
        if (listener != null) {
           //启动一个监听器
            listener.start();
            //快速选举算法
            FastLeaderElection fle = new FastLeaderElection(this, qcm);
            //启动leader选举
            fle.start();
            le = fle;
        } else {
        }
        break;
    default:
        assert false;
    }
    return le;
}
```

createElectionAlgorithm创建了两个对象Listener和FastLeaderElection，并调用了其start方法。此时QuorumPeer中的electionAlg实例就是FastLeaderElection 对象。

### 三、Listener

Listener是QuorumCnxManager中定义的内部类，他是一个线程对象，业务逻辑的具体实现在run方法中：

```java
public void run() {
    if (!shutdown) {
    //先获取用来做leader选举的所有通信地址
        Set<InetSocketAddress> addresses;
        if (self.getQuorumListenOnAllIPs()) {
            addresses = self.getElectionAddress().getWildcardAddresses();
        } else {
            addresses = self.getElectionAddress().getAllAddresses();
        }
        //实例化一个线程计数器
        CountDownLatch latch = new CountDownLatch(addresses.size());
        //得到listener处理器
        listenerHandlers = addresses.stream().map(address ->
                        new ListenerHandler(address, self.shouldUsePortUnification(), self.isSslQuorum(), latch))
                .collect(Collectors.toList());
       //通过线程池启动ListenerHandler线程
        ExecutorService executor = Executors.newFixedThreadPool(addresses.size());
        listenerHandlers.forEach(executor::submit);
       //等待所有线程执行完成
        try {
            latch.await();
        } catch (InterruptedException ie) {
        } finally {
            // 关闭
            for (ListenerHandler handler : listenerHandlers) {
                try {
                    handler.close();
                } catch (IOException ie) {
                    // Don't log an error for shutdown.
                    LOG.debug("Error closing server socket", ie);
                }
            }
        }
    }
    LOG.info("Leaving listener");
    if (!shutdown) {
        if (socketException.get()) {
            // 存在异常，调用异常处理器
            socketBindErrorHandler.run();
        }
    }
}
```

Listener中又交给了ListenerHandler 处理器来进行处理，这也是一个线程，也是QuorumCnxManager中定义的内部类

```java
public void run() {
    try {
      //接收连接
        acceptConnections();
    } catch (Exception e) {
    } finally {
    //计数器减一
        latch.countDown();
    }
}
```

acceptConnections()（部分代码被省略）这个方法就是创建ServerSocket对象，绑定端口并等待其它节点的连接：

```java
private void acceptConnections() {
int numRetries = 0;
Socket client = null;
while ((!shutdown) && (portBindMaxRetry == 0 || numRetries < portBindMaxRetry)) {
    try {
    //创建ServerSocket连接，等待其它节点连接
        serverSocket = createNewServerSocket();
        while (!shutdown) {
            try {
               //等待连接操作
                client = serverSocket.accept();
                setSockOpts(client);
                //接收其它节点的连接
                if (quorumSaslAuthEnabled) {
                    receiveConnectionAsync(client);
                } else {
                    receiveConnection(client);
                }
                numRetries = 0;
            } catch (SocketTimeoutException e) {
            }
        }
    } catch (IOException e) {
    }
}
}
```

receiveConnection是QuorumCnxManager中定义的方法，

```java
public void receiveConnection(final Socket sock) {
  //这就是一个基本的Socket变成过程
    DataInputStream din = null;
    try {
       //得到输入流
        din = new DataInputStream(new BufferedInputStream(sock.getInputStream()));
        //处理连接
        handleConnection(sock, din);
    } catch (IOException e) {
        closeSocket(sock);
    }
}
```

查看其具体处理方法：

```java
private void handleConnection(Socket sock, DataInputStream din) throws IOException {
Long sid = null, protocolVersion = null;
MultipleAddresses electionAddr = null;
try {
    //协议版本,如果传递过来的协议版本是大于等于0的表示当前传递过来的是当前服务器的myid
    protocolVersion = din.readLong();
    if (protocolVersion >= 0) {
        sid = protocolVersion;
    } else {
        try {
        //否则解析出当前的sid值
            InitialMessage init = InitialMessage.parse(protocolVersion, din);
            sid = init.sid;
            if (!init.electionAddr.isEmpty()) {
                electionAddr = new MultipleAddresses(init.electionAddr,
                        Duration.ofMillis(self.getMultiAddressReachabilityCheckTimeoutMs()));
            }
        } catch (InitialMessage.InitialMessageException ex) {
            return;
        }
    }
    //如果当前的sid是Observer节点传递过来的，sid减一操作（负数）
    if (sid == QuorumPeer.OBSERVER_ID) {
        sid = observerCounter.getAndDecrement();
    }
} catch (IOException e) {
    return;
}
//进行权限认证，如果存在
authServer.authenticate(sock, din);
//如果当前的sid比本节点的小
if (sid < self.getId()) {
//取出当前的SendWorker
    SendWorker sw = senderWorkerMap.get(sid);
    //如果不为空，执行finish操作
    if (sw != null) {
        sw.finish();
    }
    //连接到当前的sid节点
    if (electionAddr != null) {
        connectOne(sid, electionAddr);
    } else {
        connectOne(sid);
    }
} else if (sid == self.getId()) {
} else {
   //初始化发送和接收工作线程
    SendWorker sw = new SendWorker(sock, sid);
    RecvWorker rw = new RecvWorker(sock, din, sid, sw);
    sw.setRecv(rw);
    SendWorker vsw = senderWorkerMap.get(sid);
    if (vsw != null) {
        vsw.finish();
    }
    senderWorkerMap.put(sid, sw);
    queueSendMap.putIfAbsent(sid, new CircularBlockingQueue<>(SEND_CAPACITY));
    //启动线程
    sw.start();
    rw.start();
}
}
```

我们先简单介绍一下收发线程：

SendWorker ：发送数据线程，其中定义了send方法，发送数据，都是基本的socket编程，run方法中会从queueSendMap集合中（QuorumCnxManager的属性ConcurrentHashMap>对象，键是sid也就是节点的myid，值是当前节点对应需要发送的内容集合 ）不断的取出数据进行发送。此时在run方法中还会记录当前对应sid发送的最后一条记录（ConcurrentHashMap lastMessageSent）。这是SendWorker所做的工作。

RecvWorker ：接收数据线程，会把收到的数据保存到recvQueue阻塞队列中。

也就是说在Listener中档收到的sid值大于本节点是，开启收发线程，如果小于节点，则调用connectOne方法，这个方法又会调用initiateConnectionAsync方法。

```java
public boolean initiateConnectionAsync(final MultipleAddresses electionAddr, final Long sid) {
    try {
        connectionExecutor.execute(new QuorumConnectionReqThread(electionAddr, sid));
        connectionThreadCnt.incrementAndGet();
    } catch (Throwable e) {
        return false;
    }
    return true;
}
```

此时通过QuorumConnectionReqThread对象来启动连接，这也是QuorumCnxManager的内部类，里边逻辑实现就是通过客户端的Socket去连接当前sid的对应的节点服务。如下所示：

```java
private boolean startConnection(Socket sock, Long sid) throws IOException {
    //初始化输入输出流
    DataOutputStream dout = null;
    DataInputStream din = null;
    try {
        BufferedOutputStream buf = new BufferedOutputStream(sock.getOutputStream());
        dout = new DataOutputStream(buf);
        //协议版本（都是小于0）
        long protocolVersion = self.isMultiAddressEnabled() ? PROTOCOL_VERSION_V2 : PROTOCOL_VERSION_V1;
        dout.writeLong(protocolVersion);
        dout.writeLong(self.getId());
        //把当前self的选举通信地址发送给对应的sid节点
        Collection<InetSocketAddress> addressesToSend = protocolVersion == PROTOCOL_VERSION_V2
                ? self.getElectionAddress().getAllAddresses()
                : Arrays.asList(self.getElectionAddress().getOne());
        String addr = addressesToSend.stream()
                .map(NetUtils::formatInetAddr).collect(Collectors.joining("|"));
        byte[] addr_bytes = addr.getBytes();
        dout.writeInt(addr_bytes.length);
        dout.write(addr_bytes);
        dout.flush();
        //等待响应
        din = new DataInputStream(new BufferedInputStream(sock.getInputStream()));
    } catch (IOException e) {
        closeSocket(sock);
        return false;
    }
    // 权限认证
    QuorumPeer.QuorumServer qps = self.getVotingView().get(sid);
    if (qps != null) {
        authLearner.authenticate(sock, qps.hostname);
    }
    // 如果当前的sid比self的到关闭socket
    if (sid > self.getId()) {
        closeSocket(sock);
    } else {
    //否则开启收发线程，已经介绍过
        SendWorker sw = new SendWorker(sock, sid);
        RecvWorker rw = new RecvWorker(sock, din, sid, sw);
        sw.setRecv(rw);
        SendWorker vsw = senderWorkerMap.get(sid);
        if (vsw != null) {
            vsw.finish();
        }
        senderWorkerMap.put(sid, sw);
        queueSendMap.putIfAbsent(sid, new CircularBlockingQueue<>(SEND_CAPACITY));
        sw.start();
        rw.start();
        return true;
    }
    return false;
}
```

Listener开始对应端口，监听其它节点的连接，也就是我们配置文件server.1=127.0.0.1:2888:3888中第二个端口号（3888），也就是说所有节点都会开启这个端口号，来监听其它节点的连接。Listener中处理其它节点的连接逻辑是根据sid进行判断，sid也就是配置中的myid也就是server.1中的1。如果其它节点的sid比本地节点的大，那么初始化接收发送线程，并启动，同时往senderWorkerMap保存sid和SendWorker线程对应关系，以及queueSendMap保存sid和阻塞队列。如果相等，那么表示当前配置文件出现错误，或者是存在bug，如果是小于当前节点的sid，那么通过当前节点去连接sid节点，并开启对应的收发线程。

假设有三台ZooKeeper服务器，对应的myid分别是1、2、3，他们都会开启对应端口去监听其它两台服务器的连接，假设2和3去连接1，此时1收到的sid要比自己大，那么此时1就会开启收发线程，并保存2和3的连接到senderWorkerMap集合中，此时1和2也会去连接3，3发现都比自己小，此时3就会关闭来自1、2的连接，转而主动去连接1和2，并开启对应的收发线程。

也就是Listener中会通过myid去比较各节点大小，小的保存大的连接，大的主动保持与小的连接，也就是2、3主动去连接1，此时1可以和2、3相互通信，2主动连接1，然后监听3 的连接，所以2也可以和1、3相互通信，至于3会主动去连接1和2，并可以相互通信。此时有新的节点加入，按照同样的方式去建立连接，Listener也就相当于在集群中的各节点建立通信。

我们知道，Listener会先开启端口监听，但是没有主动发起连接请求，所以连接请求在哪发起的需要进一步分析。

### 四、FastLeaderElection

在createElectionAlgorithm方法中除了开启Listener线程外还调用了FastLeaderElection的start方法。

```java
public void start() {
//调用Messenger的start方法
    this.messenger.start();
}
```

Messenger是FastLeaderElection定义的内部类，在构造方法中进行初始化，并且还初始化了sendqueue和recvqueue两个阻塞队列。

Messenger中的start方法有启动了两个线程：

```java
    void start() {
        this.wsThread.start();
        this.wrThread.start();
    }
```

其中wsThread是WorkerSender实例，wrThread是WorkerReceiver实例，这也是一对收发线程。分别分析其run方法，

首先是WorkerSender的run方法：

```java
public void run() {
    while (!stop) {
        try {
           //从sendqueue队列中取出待发送的信息
            ToSend m = sendqueue.poll(3000, TimeUnit.MILLISECONDS);
            if (m == null) {
                continue;
            }
             //处理待发送信息
            process(m);
        } catch (InterruptedException e) {
            break;
        }
    }
    LOG.info("WorkerSender is down");
}
```

其中process方法会调用QuorumCnxManager的toSend方法进行处理

```java
public void toSend(Long sid, ByteBuffer b) {
//如果当前消息是发送给自己的，只需往recvQueue队列中添加当前消息
if (this.mySid == sid) {
    b.position(0);
    addToRecvQueue(new Message(b.duplicate(), sid));
} else {
   //如果是集群中其它节点那么连接发送，这就是第三部分分析的connectOne方法。也就是此时会调用Listener中对应的发送线程进行数据下发。
    BlockingQueue<ByteBuffer> bq = queueSendMap.computeIfAbsent(sid, serverId -> new CircularBlockingQueue<>(SEND_CAPACITY));
    addToSendQueue(bq, b);
    connectOne(sid);
}
}
```

接下来是WorkerReceiver的run方法：

```java
public void run() {
    Message response;
    while (!stop) {
        try {
        //此时会从recvQueue队列中取出对应的消息，Listener中的接收线程会不断地把收到的消息存放到这个集合中
            response = manager.pollRecvQueue(3000, TimeUnit.MILLISECONDS);
            if (response == null) {
                continue;
            }
            final int capacity = response.buffer.capacity();
            //如果数据长度小于28个字节，因为Protocol版本号等头部信息已经有28个字节
            if (capacity < 28) {
                LOG.error("Got a short response from server {}: {}", response.sid, capacity);
                continue;
            }
            //是否等于28个字节
            boolean backCompatibility28 = (capacity == 28);
            // 如果没有版本信息时
            boolean backCompatibility40 = (capacity == 40);
            response.buffer.clear();
            // 实例化一个Notification对象
            Notification n = new Notification();
             //获取到sid的节点状态，选举出来的leader对象，事务id，epoch信息等
            int rstate = response.buffer.getInt();
            long rleader = response.buffer.getLong();
            long rzxid = response.buffer.getLong();
            long relectionEpoch = response.buffer.getLong();
            long rpeerepoch;
            //初始化版本号
            int version = 0x0;
            QuorumVerifier rqv = null;
            try {
                if (!backCompatibility28) {
                    rpeerepoch = response.buffer.getLong();
                    if (!backCompatibility40) {
                        version = response.buffer.getInt();
                    } else {
                    }
                } else {
                    rpeerepoch = ZxidUtils.getEpochFromZxid(rzxid);
                }
                 //如果当前得到的版本好大于1
                if (version > 0x1) {
                    int configLength = response.buffer.getInt();
                    if (configLength < 0 || configLength > capacity) {
                    byte[] b = new byte[configLength];
                    response.buffer.get(b);
                    synchronized (self) {
                        try {
                            rqv = self.configFromString(new String(b, UTF_8));
                            QuorumVerifier curQV = self.getQuorumVerifier();
                            if (rqv.getVersion() > curQV.getVersion()) {
                                if (self.getPeerState() == ServerState.LOOKING) {
                                    self.processReconfig(rqv, null, null, false);
                                    if (!rqv.equals(curQV)) {
                                        self.shuttingDownLE = true;
                                        self.getElectionAlg().shutdown();
                                        break;
                                    }
                                } else {
                                }
                            }
                        } catch (IOException | ConfigException e) {
                        }
                    }
                } else {
                }
            } catch (BufferUnderflowException | IOException e) {
                continue;
            }
            //如果当前不是是合法选票（OBserver）
            if (!validVoter(response.sid)) {
                Vote current = self.getCurrentVote();
                QuorumVerifier qv = self.getQuorumVerifier();
                ToSend notmsg = new ToSend(
                    ToSend.mType.notification,
                    current.getId(),
                    current.getZxid(),
                    logicalclock.get(),
                    self.getPeerState(),
                    response.sid,
                    current.getPeerEpoch(),
                    qv.toString().getBytes(UTF_8));
                  //把本节点中的信息发送出去
                sendqueue.offer(notmsg);
            } else {
               //根据其他节点传递过来的节点状态相应对应的状态
                QuorumPeer.ServerState ackstate = QuorumPeer.ServerState.LOOKING;
                switch (rstate) {
                case 0:
                    ackstate = QuorumPeer.ServerState.LOOKING;
                    break;
                case 1:
                    ackstate = QuorumPeer.ServerState.FOLLOWING;
                    break;
                case 2:
                    ackstate = QuorumPeer.ServerState.LEADING;
                    break;
                case 3:
                    ackstate = QuorumPeer.ServerState.OBSERVING;
                    break;
                default:
                    continue;
                }
                        //此时封装Notification对象
                n.leader = rleader;
                n.zxid = rzxid;
                n.electionEpoch = relectionEpoch;
                n.state = ackstate;
                n.sid = response.sid;
                n.peerEpoch = rpeerepoch;
                n.version = version;
                n.qv = rqv;
                //如果当前节点是LOOKING状态
                if (self.getPeerState() == QuorumPeer.ServerState.LOOKING) {
                //把当前的Notificatio添加到recvqueue队列中
                    recvqueue.offer(n);
                    //如果发送过来的节点也是LOOKING状态，且它的epoch值小于最新选举的节点
                    if ((ackstate == QuorumPeer.ServerState.LOOKING)
                        && (n.electionEpoch < logicalclock.get())) {
                        //那么就把本地节点的选票发送出去
                        Vote v = getVote();
                        QuorumVerifier qv = self.getQuorumVerifier();
                        ToSend notmsg = new ToSend(
                            ToSend.mType.notification,
                            v.getId(),
                            v.getZxid(),
                            logicalclock.get(),
                            self.getPeerState(),
                            response.sid,
                            v.getPeerEpoch(),
                            qv.toString().getBytes());
                        sendqueue.offer(notmsg);
                    }
                } else {
                   //获取当前节点的选票
                    Vote current = self.getCurrentVote();
                    //如果响应的节点还是LOOKING状态，也就是表示当前响应节点可能是Leader节点
                    if (ackstate == QuorumPeer.ServerState.LOOKING) {
                        if (self.leader != null) {
                            if (leadingVoteSet != null) {
                                self.leader.setLeadingVoteSet(leadingVoteSet);
                                leadingVoteSet = null;
                            }
                            self.leader.reportLookingSid(response.sid);
                        }
                        //投票给本节点
                        QuorumVerifier qv = self.getQuorumVerifier();
                        ToSend notmsg = new ToSend(
                            ToSend.mType.notification,
                            current.getId(),
                            current.getZxid(),
                            current.getElectionEpoch(),
                            self.getPeerState(),
                            response.sid,
                            current.getPeerEpoch(),
                            qv.toString().getBytes());
                        sendqueue.offer(notmsg);
                    }
                }
            }
        } catch (InterruptedException e) {
            LOG.warn("Interrupted Exception while waiting for new message", e);
        }
    }
    LOG.info("WorkerReceiver is down");
}
}
```

WorkerReceiver线程就是不断地处理Listener中的接收线程接收到的消息，似乎到了这里还是没有开启Leader选举。

### 五、总结

以上都是在Leader选举的前期准备，Listener会开启端口监听，然后在每个节点之间建立通信，节点之间的通信会创建一对收发线程，同时会把发送线程添加到senderWorkerMap中通过sid关联，并添加一个空的阻塞队列到queueSendMap集合，也是通过sid关联，发送线程SendWorker会循环的取queueSendMap中的数据，发送到对应的节点，RecvWorker从对应节点上接收数据，并把收到的数据封装成一个Message实体然后添加到recvQueue阻塞队列中。

FastLeaderElection中也会开启一对收发线程，FastLeaderElection也维护了一对收发阻塞队列，WorkerSender从sendqueue队列中取出对应的ToSend消息体，调用QuorumCnxManager的toSend方法，这个方法就是把当前的消息添加到queueSendMap，然后交给Listener中对应的SendWorker线程进行发送。WorkerReceiver会从QuorumCnxManager中recvQueue队列取出消息进行处理，处理结果添加到sendqueue队列中。

由于篇幅过长，将在下一节继续分析Leader选举过程。

以上，有任何不对的地方，请留言指正，敬请谅解。
