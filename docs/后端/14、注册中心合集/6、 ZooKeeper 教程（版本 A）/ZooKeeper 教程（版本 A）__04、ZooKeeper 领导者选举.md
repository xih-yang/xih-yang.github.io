# 04、ZooKeeper 领导者选举
- 来源：https://ddkk.com/zhuanlan/registered/zookeeper/d-1/4.html
- 分类：注册中心
- 分组：ZooKeeper 教程（版本 A）
## 目的

领导者选举的主要目的就是从众多节点中选择一个节点作为领导

## 重要概念

### myid

myid的作用是唯一地标识集群中的一个节点，通过在配置文件中，通过如下的方式来分配id

```sh
server.1=localhost:2888:3888
```

### epoch

epoch代表当前节点已经参与的选举轮数，每选举出一个leader就会加一

### zxid

用来标识一次提案，zxid必须是递增的

zookeeper使用64位整数来存储一个zxid，高32位用来存放epoch，低32位代表当前提案在该epoch内的序号

zookeeper一共支持4种选举算法，但是最常用并且也是默认选项的是FastLeaderElection，其他的几种已经deprecated了

```java
switch (electionAlgorithm) {
  case 0:
    le = new LeaderElection(this);
    break;
  case 1:
    le = new AuthFastLeaderElection(this);
    break;
  case 2:
    le = new AuthFastLeaderElection(this, true);
    break;
  case 3:
    QuorumCnxManager qcm = createCnxnManager();
    QuorumCnxManager oldQcm = qcmRef.getAndSet(qcm);
    if (oldQcm != null) {
      LOG.warn("Clobbering already-set QuorumCnxManager (restarting leader election?)");
      oldQcm.halt();
    }
    QuorumCnxManager.Listener listener = qcm.listener;
    if(listener != null){
      listener.start();
      FastLeaderElection fle = new FastLeaderElection(this, qcm);
      fle.start();
      le = fle;
    } else {
      LOG.error("Null listener when initializing cnx manager");
    }
    break;
```

### 节点状态

集群中的节点一共有如下几种状态

**1、** Looking；

代表当前节点不知道leader是谁，需要发起领导者选举
**2、** Leading；

代表当前节点是leader
**3、** Following；

代表当前节点是follower
**4、** Observing；

代表当前节点是Observer，不会参与选举

### 选票结构

```java
// Vote
public Vote(long id,
                    long zxid,
                    long electionEpoch,
                    long peerEpoch) {
	this.version = 0x0;
	// 当前节点
    this.id = id;
    // 当前节点所投节点的zxid
    this.zxid = zxid;
    // 当前节点的选举轮次
    this.electionEpoch = electionEpoch;
    // 当前节点所投节点的epoch
    this.peerEpoch = peerEpoch;
    // 当前节点状态
    this.state = ServerState.LOOKING;
}
```

## 源码解析

## 准备阶段

准备阶段主要是创建QuorumCnxManager以及FastLeaderfElection并运行

```java
// QuorumPeer
synchronized public void startLeaderElection() {
   try {
   	   // 获取当前节点的状态，如果是looking，代表目前仍然没有决定出领导者
   	   // 此时生成一张给自己的选票
       if (getPeerState() == ServerState.LOOKING) {
           currentVote = new Vote(myid, getLastLoggedZxid(), getCurrentEpoch());
       }
   } catch(IOException e) {
       RuntimeException re = new RuntimeException(e.getMessage());
       re.setStackTrace(e.getStackTrace());
       throw re;
   }
   // if (!getView().containsKey(myid)) {
  //      throw new RuntimeException("My id " + myid + " not in the peer list");
    //}
    if (electionType == 0) {
        try {
            udpSocket = new DatagramSocket(getQuorumAddress().getPort());
            responder = new ResponderThread();
            responder.start();
        } catch (SocketException e) {
            throw new RuntimeException(e);
        }
    }
    // 根据配置的选举算法，创建算法实例，然后执行
    this.electionAlg = createElectionAlgorithm(electionType);
}
```

```java
protected Election createElectionAlgorithm(int electionAlgorithm){
    Election le=null;
    //TODO: use a factory rather than a switch
    // 根据配置的选举算法的值，创建选举算法
    switch (electionAlgorithm) {
    case 0:
        le = new LeaderElection(this);
        break;
    case 1:
        le = new AuthFastLeaderElection(this);
        break;
    case 2:
        le = new AuthFastLeaderElection(this, true);
        break;
    case 3:
    	// 一个用于领导者选举的连接管理器
    	// 会为当前节点和其他节点建立连接
        QuorumCnxManager qcm = createCnxnManager();
        QuorumCnxManager oldQcm = qcmRef.getAndSet(qcm);
        if (oldQcm != null) {
            LOG.warn("Clobbering already-set QuorumCnxManager (restarting leader election?)");
            oldQcm.halt();
        }
        // 监听选举端口，等待其他节点的连接
        QuorumCnxManager.Listener listener = qcm.listener;
        if(listener != null){
        	// 开始接收连接
            listener.start();
            FastLeaderElection fle = new FastLeaderElection(this, qcm);
            fle.start();
            le = fle;
        } else {
            LOG.error("Null listener when initializing cnx manager");
        }
        break;
    default:
        assert false;
    }
    return le;
}
```

### QuorumCnxManager

### 构造方法

```java
// QuorumCnxManager
public QuorumCnxManager(QuorumPeer self,
                            final long mySid,
                            Map<Long,QuorumPeer.QuorumServer> view,
                            QuorumAuthServer authServer,
                            QuorumAuthLearner authLearner,
                            int socketTimeout,
                            boolean listenOnAllIPs,
                            int quorumCnxnThreadsSize,
                            boolean quorumSaslAuthEnabled) {
    // 存放接收到的消息的队列
    this.recvQueue = new ArrayBlockingQueue<Message>(RECV_CAPACITY);
    // 节点id -> 发送队列
    this.queueSendMap = new ConcurrentHashMap<Long, ArrayBlockingQueue<ByteBuffer>>();
    // 节点id -> 发送消息的线程
    this.senderWorkerMap = new ConcurrentHashMap<Long, SendWorker>();
    // 节点id -> 上一个发送给该节点的消息
    this.lastMessageSent = new ConcurrentHashMap<Long, ByteBuffer>();
	// 连接超时时间
    String cnxToValue = System.getProperty("zookeeper.cnxTimeout");
    if(cnxToValue != null){
        this.cnxTO = Integer.parseInt(cnxToValue);
    }
	// 当前节点的QuorumPeer对象，包含一堆配置
    this.self = self;
	// 当前节点id
    this.mySid = mySid;
    this.socketTimeout = socketTimeout;
    // 当前集群中的所有节点
    this.view = view;
    this.listenOnAllIPs = listenOnAllIPs;
    initializeAuth(mySid, authServer, authLearner, quorumCnxnThreadsSize,
            quorumSaslAuthEnabled);
    // Starts listener thread that waits for connection requests
    // 等待其他连接的监听器
    Listener是QuorumCnxManager的内部类
    listener = new Listener();
    listener.setName("QuorumPeerListener");
}
```

下面看下Listener的构造方法

```java
public Listener() {
    // During startup of thread, thread name will be overridden to
    // specific election address
    super("ListenerThread");
    // maximum retry count while trying to bind to election port
    // see ZOOKEEPER-3320 for more details
    // 尝试从系统变量中获取端口绑定的最大重试次数zookeeper.electionPortBindRetry，默认值是3
    final Integer maxRetry = Integer.getInteger(ELECTION_PORT_BIND_RETRY,
                                                DEFAULT_PORT_BIND_MAX_RETRY);
    if (maxRetry >= 0) {
        LOG.info("Election port bind maximum retries is {}",
                 maxRetry == 0 ? "infinite" : maxRetry);
        portBindMaxRetry = maxRetry;
    } else {
        LOG.info("'{}' contains invalid value: {}(must be >= 0). "
                 + "Use default value of {} instead.",
                 ELECTION_PORT_BIND_RETRY, maxRetry, DEFAULT_PORT_BIND_MAX_RETRY);
        portBindMaxRetry = DEFAULT_PORT_BIND_MAX_RETRY;
    }
}
```

### 接收连接

```java
// QuorumPeer
QuorumCnxManager qcm = createCnxnManager();
QuorumCnxManager oldQcm = qcmRef.getAndSet(qcm);
if (oldQcm != null) {
    LOG.warn("Clobbering already-set QuorumCnxManager (restarting leader election?)");
    oldQcm.halt();
}
QuorumCnxManager.Listener listener = qcm.listener;
listener.start();
```

当创建完QuorumCnxManager后，会启动连接监听器

下面继续看下Listener的run方法

```java
public void run() {
    int numRetries = 0;
    InetSocketAddress addr;
    Socket client = null;
    Exception exitException = null;
    // 重试绑定本地端口
    while ((!shutdown) && (portBindMaxRetry == 0 || numRetries < portBindMaxRetry)) {
        try {
        	// 1. 绑定端口
        	// 创建ServerSocket
            if (self.shouldUsePortUnification()) {
                LOG.info("Creating TLS-enabled quorum server socket");
                ss = new UnifiedServerSocket(self.getX509Util(), true);
            } else if (self.isSslQuorum()) {
                LOG.info("Creating TLS-only quorum server socket");
                ss = new UnifiedServerSocket(self.getX509Util(), false);
            } else {
                ss = new ServerSocket();
            }
            ss.setReuseAddress(true);
			// 设置绑定地址
			// 如果设置监听ip，那么会监听0.0.0.0的选举端口
            if (self.getQuorumListenOnAllIPs()) {
                int port = self.getElectionAddress().getPort();
                addr = new InetSocketAddress(port);
            } else {
                // Resolve hostname for this server in case the
                // underlying ip address has changed.
                // 解析hostname来决定当前需要绑定的地址
                self.recreateSocketAddresses(self.getId());
                addr = self.getElectionAddress();
            }
            LOG.info("My election bind port: " + addr.toString());
            // 设置线程名称
            setName(addr.toString());
            // 绑定端口
            ss.bind(addr);
            // 2. 接收连接
            while (!shutdown) {
                try {
                	// 接收连接
                    client = ss.accept();
                    setSockOpts(client);
                    LOG.info("Received connection request "
                             + formatInetAddr((InetSocketAddress)client.getRemoteSocketAddress()));
                    // Receive and handle the connection request
                    // asynchronously if the quorum sasl authentication is
                    // enabled. This is required because sasl server
                    // authentication process may take few seconds to finish,
                    // this may delay next peer connection requests.
                    if (quorumSaslAuthEnabled) {
                        receiveConnectionAsync(client);
                    } else {
                    	  // 处理连接
                        receiveConnection(client);
                    }
                    numRetries = 0;
                } catch (SocketTimeoutException e) {
                    LOG.warn("The socket is listening for the election accepted "
                             + "and it timed out unexpectedly, but will retry."
                             + "see ZOOKEEPER-2836");
                }
            }
        } catch (IOException e) {
            if (shutdown) {
                break;
            }
            LOG.error("Exception while listening", e);
            exitException = e;
            numRetries++;
            try {
                ss.close();
                Thread.sleep(1000);
            } catch (IOException ie) {
                LOG.error("Error closing server socket", ie);
            } catch (InterruptedException ie) {
                LOG.error("Interrupted while sleeping. " +
                    "Ignoring exception", ie);
            }
            closeSocket(client);
        }
    }
    LOG.info("Leaving listener");
    if (!shutdown) {
        LOG.error("As I'm leaving the listener thread after "
                  + numRetries + " errors. "
                  + "I won't be able to participate in leader "
                  + "election any longer: "
                  + formatInetAddr(self.getElectionAddress())
                  + ". Use " + ELECTION_PORT_BIND_RETRY + " property to "
                  + "increase retry count.");
        if (exitException instanceof SocketException) {
            // After leaving listener thread, the host cannot join the
            // quorum anymore, this is a severe error that we cannot
            // recover from, so we need to exit
            socketBindErrorHandler.run();
        }
    } else if (ss != null) {
        // Clean up for shutdown.
        try {
            ss.close();
        } catch (IOException ie) {
            // Don't log an error for shutdown.
            LOG.debug("Error closing server socket", ie);
        }
    }
}
```

### 处理连接

```java
// QuorumCnxManager
public void receiveConnection(final Socket sock) {
  DataInputStream din = null;
  try {
    // 创建读取连接的输入流
    din = new DataInputStream(
      new BufferedInputStream(sock.getInputStream()));
    handleConnection(sock, din);
  } catch (IOException e) {
    LOG.error("Exception handling connection, addr: {}, closing server connection",
              sock.getRemoteSocketAddress());
    closeSocket(sock);
  }
}
```

```java
// QuorumCnxManager
private void handleConnection(Socket sock, DataInputStream din)
            throws IOException {
  Long sid = null, protocolVersion = null;
  InetSocketAddress electionAddr = null;
  try {
    // 从输入流中读入一个Long
    protocolVersion = din.readLong();
    if (protocolVersion >= 0) {
      // this is a server id and not a protocol version
     	// 当Long>=0时，代表当前读入的是一个id
      sid = protocolVersion;
    } else {
     	// 当Long<0时，代表当前读入的是协议的版本
      try {
        // 接着从输入流汇中读取对方节点的id和其选举接口
        InitialMessage init = InitialMessage.parse(protocolVersion, din);
        sid = init.sid;
        electionAddr = init.electionAddr;
      } catch (InitialMessage.InitialMessageException ex) {
        LOG.error(ex.toString());
        closeSocket(sock);
        return;
      }
    }
    // 当接收都的id是指定的代表OBSERVER的id
    if (sid == QuorumPeer.OBSERVER_ID) {
      /*
                 * Choose identifier at random. We need a value to identify
                 * the connection.
                 */
      // 获取一个递增的值作为id，目的是用来标识该连接
      sid = observerCounter.getAndDecrement();
      LOG.info("Setting arbitrary identifier to observer: " + sid);
    }
  } catch (IOException e) {
    LOG.warn("Exception reading or writing challenge: {}", e);
    closeSocket(sock);
    return;
  }
  // do authenticating learner
  authServer.authenticate(sock, din);
  //If wins the challenge, then close the new connection.
  // 集群中的每对节点之间只会存在一个用于领导者选举的tcp连接
  // 由id大的节点连接到id小的节点
  if (sid < self.getId()) {
    // 当前节点的id大于对方节点的id，当前节点胜出，保留当前节点到对方节点的连接
    /*
             * This replica might still believe that the connection to sid is
             * up, so we have to shut down the workers before trying to open a
             * new connection.
             */
    // 获取用于给对面节点的信息发送者
    SendWorker sw = senderWorkerMap.get(sid);
    if (sw != null) {
      sw.finish();
    }
    /*
             * Now we start a new connection
             */
    LOG.debug("Create new connection to server: {}", sid);
    // 关闭当前连接
    closeSocket(sock);
// 创建当前节点到对面节点的连接
    if (electionAddr != null) {
      connectOne(sid, electionAddr);
    } else {
      connectOne(sid);
    }
  } else {
      // Otherwise start worker threads to receive data.
    // 当前节点的id小于目标节点的id
    // 使用目标节点到当前节点的连接
    SendWorker sw = new SendWorker(sock, sid);
    RecvWorker rw = new RecvWorker(sock, din, sid, sw);
    sw.setRecv(rw);
    SendWorker vsw = senderWorkerMap.get(sid);
    if (vsw != null) {
      vsw.finish();
    }
    // 更新id -> senderworker
    senderWorkerMap.put(sid, sw);
   	// 更新id -> queueSend
    queueSendMap.putIfAbsent(sid,
                             new ArrayBlockingQueue<ByteBuffer>(SEND_CAPACITY));
    sw.start();
    rw.start();
  }
}
```

下面看下当前节点如何发起到对方节点连接

```java
// QuorumCnxManager
synchronized private boolean connectOne(long sid, InetSocketAddress electionAddr){
  // 判断连接是否已经存在
  if (senderWorkerMap.get(sid) != null) {
    LOG.debug("There is a connection already for server " + sid);
    return true;
  }
  Socket sock = null;
  try {
    // 1. 创建连接
    LOG.debug("Opening channel to server " + sid);
    if (self.isSslQuorum()) {
      SSLSocket sslSock = self.getX509Util().createSSLSocket();
      setSockOpts(sslSock);
      sslSock.connect(electionAddr, cnxTO);
      sslSock.startHandshake();
      sock = sslSock;
      LOG.info("SSL handshake complete with {} - {} - {}", sslSock.getRemoteSocketAddress(), sslSock.getSession().getProtocol(), sslSock.getSession().getCipherSuite());
    } else {
      sock = new Socket();
      setSockOpts(sock);
      sock.connect(electionAddr, cnxTO);
    }
    LOG.debug("Connected to server " + sid);
    // Sends connection request asynchronously if the quorum
    // sasl authentication is enabled. This is required because
    // sasl server authentication process may take few seconds to
    // finish, this may delay next peer connection requests.
    // 2. 初始化连接
    if (quorumSaslAuthEnabled) {
      initiateConnectionAsync(sock, sid);
    } else {
      initiateConnection(sock, sid);
    }
    return true;
  } catch (UnresolvedAddressException e) {
    // Sun doesn't include the address that causes this
    // exception to be thrown, also UAE cannot be wrapped cleanly
    // so we log the exception in order to capture this critical
    // detail.
    LOG.warn("Cannot open channel to " + sid
             + " at election address " + electionAddr, e);
    closeSocket(sock);
    throw e;
  } catch (X509Exception e) {
    LOG.warn("Cannot open secure channel to " + sid
             + " at election address " + electionAddr, e);
    closeSocket(sock);
    return false;
  } catch (IOException e) {
    LOG.warn("Cannot open channel to " + sid
             + " at election address " + electionAddr,
             e);
    closeSocket(sock);
    return false;
  }
}
```

下面看下如何初始化连接

```java
public void initiateConnection(final Socket sock, final Long sid) {
  try {
    startConnection(sock, sid);
  } catch (IOException e) {
    LOG.error("Exception while connecting, id: {}, addr: {}, closing learner connection",
              new Object[] {
      sid, sock.getRemoteSocketAddress() }, e);
    closeSocket(sock);
    return;
  }
}
```

```java
private boolean startConnection(Socket sock, Long sid)
            throws IOException {
  DataOutputStream dout = null;
  DataInputStream din = null;
  try {
    // Use BufferedOutputStream to reduce the number of IP packets. This is
    // important for x-DC scenarios.
    BufferedOutputStream buf = new BufferedOutputStream(sock.getOutputStream());
    dout = new DataOutputStream(buf);
    // Sending id and challenge
    // represents protocol version (in other words - message type)
    // 1. 发送当前协议的版本
    dout.writeLong(PROTOCOL_VERSION);
    // 2. 发送当前节点的id
    dout.writeLong(self.getId());
    final InetSocketAddress electionAddr = self.getElectionAddress();
    String addr = electionAddr.getHostString() + ":" + electionAddr.getPort();
    byte[] addr_bytes = addr.getBytes();
    // 3. 发送当前节点的选举地址的长度
    // 4. 发送当前节点的选举地址的具体内容
    dout.writeInt(addr_bytes.length);
    dout.write(addr_bytes);
    // 将上述内容写到对端
    dout.flush();
    din = new DataInputStream(
      new BufferedInputStream(sock.getInputStream()));
  } catch (IOException e) {
    LOG.warn("Ignoring exception reading or writing challenge: ", e);
    closeSocket(sock);
    return false;
  }
  // authenticate learner
  QuorumPeer.QuorumServer qps = self.getVotingView().get(sid);
  if (qps != null) {
    // TODO - investigate why reconfig makes qps null.
    authLearner.authenticate(sock, qps.hostname);
  }
  // If lost the challenge, then drop the new connection
  if (sid > self.getId()) {
    // 对方节点的id大于当前节点的id，关闭当前节点到对方节点的连接
    LOG.info("Have smaller server identifier, so dropping the " +
             "connection: (" + sid + ", " + self.getId() + ")");
    closeSocket(sock);
    // Otherwise proceed with the connection
  } else {
    // 当前节点的id大于对方节点的id，保留当前节点到对方节点的连接
    // 过程和之前相同
    SendWorker sw = new SendWorker(sock, sid);
    RecvWorker rw = new RecvWorker(sock, din, sid, sw);
    sw.setRecv(rw);
    SendWorker vsw = senderWorkerMap.get(sid);
    if(vsw != null)
      vsw.finish();
    senderWorkerMap.put(sid, sw);
    queueSendMap.putIfAbsent(sid, new ArrayBlockingQueue<ByteBuffer>(
      SEND_CAPACITY));
    sw.start();
    rw.start();
    return true;
  }
  return false;
}
```

从上面的过程可以看出，在进行领导者选举的时候，每对节点之间都会创建一个连接

在创建连接时，会出现一对节点之间存在两个连接，zookeeper会保留较大id的节点到较小id节点的连接，丢掉其他连接

当连接创建时，会向对端发送如下几部分数据 ：

**1、** 协议的版本；

**2、** 当前节点的id；

**3、** 当前节点选举地址的长度；

**4、** 当前节点选举地址的内容；

### 消息发送者

### 构造方法

```java
// SendWorker
SendWorker(Socket sock, Long sid) {
  super("SendWorker:" + sid);
  // 对端节点的id
  this.sid = sid;
  // 当前节点和对端节点之间的连接
  this.sock = sock;
  recvWorker = null;
  try {
    dout = new DataOutputStream(sock.getOutputStream());
  } catch (IOException e) {
    LOG.error("Unable to access socket output stream", e);
    closeSocket(sock);
    running = false;
  }
  LOG.debug("Address of remote peer: " + this.sid);
}
```

### 运行

```java
public void run() {
  threadCnt.incrementAndGet();
  try {
    // 获取发往对端节点的消息队列
    ArrayBlockingQueue<ByteBuffer> bq = queueSendMap.get(sid);
    // 消息队列为空
    // 优先发送消息队列中更新的数据，如果消息队列中没有，会将上次发送过的消息再发送一次，确保对端成功接收
    // 重复的消息由对端来确保只处理一次
    if (bq == null || isSendQueueEmpty(bq)) {
      ByteBuffer b = lastMessageSent.get(sid);
      if (b != null) {
        LOG.debug("Attempting to send lastMessage to sid=" + sid);
        send(b);
      }
    }
  } catch (IOException e) {
    LOG.error("Failed to send last message. Shutting down thread.", e);
    this.finish();
  }
  try {
    while (running && !shutdown && sock != null) {
      ByteBuffer b = null;
      try {
        ArrayBlockingQueue<ByteBuffer> bq = queueSendMap
          .get(sid);
        if (bq != null) {
          b = pollSendQueue(bq, 1000, TimeUnit.MILLISECONDS);
        } else {
          LOG.error("No queue of incoming messages for " +
                    "server " + sid);
          break;
        }
        if(b != null){
          // 消息队列中有新的消息，发送该消息，并更新最近发送的消息
          lastMessageSent.put(sid, b);
          send(b);
        }
      } catch (InterruptedException e) {
        LOG.warn("Interrupted while waiting for message on queue",
                 e);
      }
    }
  } catch (Exception e) {
    LOG.warn("Exception when using channel: for id " + sid
             + " my id = " + QuorumCnxManager.this.mySid
             + " error = " + e);
  }
  this.finish();
  LOG.warn("Send worker leaving thread " + " id " + sid + " my id = " + self.getId());
}
```

### 发送

```java
// SendWorker
synchronized void send(ByteBuffer b) throws IOException {
  byte[] msgBytes = new byte[b.capacity()];
  try {
    b.position(0);
    b.get(msgBytes);
  } catch (BufferUnderflowException be) {
    LOG.error("BufferUnderflowException ", be);
    return;
  }
  // 发送消息的大小
  dout.writeInt(b.capacity());
  // 发送消息的内容
  dout.write(b.array());
  dout.flush();
}
```

从上面的代码可以看出，每次发送消息，都会首先发送消息的大小然后发送消息的内容

### 消息接收者

### 构造方法

```java
// RecvWorker
RecvWorker(Socket sock, DataInputStream din, Long sid, SendWorker sw) {
  super("RecvWorker:" + sid);
  // 对端节点id
  this.sid = sid;
  // 和对端节点之间的连接
  this.sock = sock;
  this.sw = sw;
  // 连接的输入流
  this.din = din;
  try {
    // OK to wait until socket disconnects while reading.
    sock.setSoTimeout(0);
  } catch (IOException e) {
    LOG.error("Error while accessing socket for " + sid, e);
    closeSocket(sock);
    running = false;
  }
}
```

### 运行

```java
public void run() {
  threadCnt.incrementAndGet();
  try {
    while (running && !shutdown && sock != null) {
      // 首先从输入流中读取一个整型，代表消息的大小
      int length = din.readInt();
      if (length <= 0 || length > PACKETMAXSIZE) {
        throw new IOException(
          "Received packet with invalid packet: "
          + length);
      }
      /**
                     * Allocates a new ByteBuffer to receive the message
                     */
      byte[] msgArray = new byte[length];
      din.readFully(msgArray, 0, length);
      ByteBuffer message = ByteBuffer.wrap(msgArray);
      // 将消息加入到接收队列中
      addToRecvQueue(new Message(message.duplicate(), sid));
    }
  } catch (Exception e) {
    LOG.warn("Connection broken for id " + sid + ", my id = "
             + QuorumCnxManager.this.mySid + ", error = " , e);
  } finally {
    LOG.warn("Interrupting SendWorker");
    sw.finish();
    closeSocket(sock);
  }
}
```

```java
public void addToRecvQueue(Message msg) {
  synchronized(recvQLock) {
    if (recvQueue.remainingCapacity() == 0) {
      try {
        recvQueue.remove();
      } catch (NoSuchElementException ne) {
        // element could be removed by poll()
        LOG.debug("Trying to remove from an empty " +
                  "recvQueue. Ignoring exception " + ne);
      }
    }
    try {
      recvQueue.add(msg);
    } catch (IllegalStateException ie) {
      // This should never happen
      LOG.error("Unable to insert element in the recvQueue " + ie);
    }
  }
}
```

### FastLeaderElection

FastLeadeElection实现了Election接口

```java
public interface Election {
    // 寻找leader
    public Vote lookForLeader() throws InterruptedException;
    public void shutdown();
}
```

### 构造方法

```java
public FastLeaderElection(QuorumPeer self, QuorumCnxManager manager){
  this.stop = false;
  // 传入前面介绍的QuorumCnxManager
  this.manager = manager;
  starter(self, manager);
}
private void starter(QuorumPeer self, QuorumCnxManager manager) {
  this.self = self;
  proposedLeader = -1;
  proposedZxid = -1;
  // 创建发送队列
  sendqueue = new LinkedBlockingQueue<ToSend>();
  // 创建接收队列
  recvqueue = new LinkedBlockingQueue<Notification>();
  this.messenger = new Messenger(manager);
}
Messenger(QuorumCnxManager manager) {
  // Messenger是对manager中的SendWorker和RecvWorker的一个封装
  // 该类会不断从sendqueue中取出消息交给manager发送,manager会将发送信息放到queuSend中，SendWorker会不断从该队列中取出消息并进行发送
  this.ws = new WorkerSender(manager);
  this.wsThread = new Thread(this.ws,
                             "WorkerSender[myid=" + self.getId() + "]");
  this.wsThread.setDaemon(true);
  // 该类会不断从manager中取出消息并处理
  this.wr = new WorkerReceiver(manager);
  this.wrThread = new Thread(this.wr,
                             "WorkerReceiver[myid=" + self.getId() + "]");
  this.wrThread.setDaemon(true);
}
```

## 进行选举

当QuorumPeer进行完如上的准备工作后，会调用自身的start方法

### 主流程

```java
// QuorumPeer
public synchronized void start() {
  // 做一些准备工作
  if (!getView().containsKey(myid)) {
    throw new RuntimeException("My id " + myid + " not in the peer list");
  }
  loadDataBase();
  startServerCnxnFactory();
  try {
    adminServer.start();
  } catch (AdminServerException e) {
    LOG.warn("Problem starting AdminServer", e);
    System.out.println(e);
  }
  startLeaderElection();
  // 主循环，根据当前节点的状态，执行不同的操作
  // 当当前节点的状态是looking时，会发起投票
  super.start();
}
```

```java
// QuorumPeer
public void run() {
  // 省略
  while (running) {
    switch (getPeerState()) {
      case LOOKING:
        LOG.info("LOOKING");
        if (Boolean.getBoolean("readonlymode.enabled")) {
          LOG.info("Attempting to start ReadOnlyZooKeeperServer");
          // Create read-only server but don't start it immediately
          final ReadOnlyZooKeeperServer roZk =
            new ReadOnlyZooKeeperServer(logFactory, this, this.zkDb);
          // Instead of starting roZk immediately, wait some grace
          // period before we decide we're partitioned.
          //
          // Thread is used here because otherwise it would require
          // changes in each of election strategy classes which is
          // unnecessary code coupling.
          Thread roZkMgr = new Thread() {
            public void run() {
              try {
                // lower-bound grace period to 2 secs
                sleep(Math.max(2000, tickTime));
                if (ServerState.LOOKING.equals(getPeerState())) {
                  roZk.startup();
                }
              } catch (InterruptedException e) {
                LOG.info("Interrupted while attempting to start ReadOnlyZooKeeperServer, not started");
              } catch (Exception e) {
                LOG.error("FAILED to start ReadOnlyZooKeeperServer", e);
              }
            }
          };
          try {
            roZkMgr.start();
            reconfigFlagClear();
            if (shuttingDownLE) {
              shuttingDownLE = false;
              startLeaderElection();
            }
            setCurrentVote(makeLEStrategy().lookForLeader());
          } catch (Exception e) {
            LOG.warn("Unexpected exception", e);
            setPeerState(ServerState.LOOKING);
          } finally {
            // If the thread is in the the grace period, interrupt
            // to come out of waiting.
            roZkMgr.interrupt();
            roZk.shutdown();
          }
        } else {
          try {
            reconfigFlagClear();
            if (shuttingDownLE) {
              shuttingDownLE = false;
              startLeaderElection();
            }
            // 发起投票
            setCurrentVote(makeLEStrategy().lookForLeader());
          } catch (Exception e) {
            LOG.warn("Unexpected exception", e);
            setPeerState(ServerState.LOOKING);
          }                        
        }
        break;
      // 省略
  }
}
```

```java
// 返回之前创建的领导者选举对象
protected Election makeLEStrategy(){
  LOG.debug("Initializing leader election protocol...");
  if (getElectionType() == 0) {
    electionAlg = new LeaderElection(this);
  }
  return electionAlg;
}
```

下面看下FastLeaderElection的lookForLeader实现

每当当前节点重新进入looking状态，就会调用lookForLeader方法

```java
// FastLeaderElection
public Vote lookForLeader() throws InterruptedException {
  try {
    self.jmxLeaderElectionBean = new LeaderElectionBean();
    MBeanRegistry.getInstance().register(
      self.jmxLeaderElectionBean, self.jmxLocalPeerBean);
  } catch (Exception e) {
    LOG.warn("Failed to register with JMX", e);
    self.jmxLeaderElectionBean = null;
  }
  if (self.start_fle == 0) {
    self.start_fle = Time.currentElapsedTime();
  }
  try {
    // 本轮选举中，来自状态为looking的节点的选票
    HashMap<Long, Vote> recvset = new HashMap<Long, Vote>();
    // 来自状态为following或者leading节点的选票
    HashMap<Long, Vote> outofelection = new HashMap<Long, Vote>();
    int notTimeout = finalizeWait;
    synchronized(this){
      // 每进行一轮选举，都会增加逻辑时钟
      logicalclock.incrementAndGet();
      // getInitId是当前节点的id 更新当前节点的proposedLeader属性
      // getInitLastLoggedZxid 获取当前节点日志中记录的最新的zxid
      // getPeerEpoch 获取当前节点日志中记录的最新的epoch
      // updateProposal使用上述信息来生成自己的选票，新一轮选举开始时，会将选票投给自己
      updateProposal(getInitId(), getInitLastLoggedZxid(), getPeerEpoch());
    }
    LOG.info("New election. My id =  " + self.getId() +
             ", proposed zxid=0x" + Long.toHexString(proposedZxid));
    // 向其他节点发送初始投给自己的选票
    sendNotifications();
    /*
             * Loop in which we exchange notifications until we find a leader
             */
    while ((self.getPeerState() == ServerState.LOOKING) &&
           (!stop)){
      /*
                 * Remove next notification from queue, times out after 2 times
                 * the termination time
                 */
      // 获取其他节点发送给当前节点的消息
      Notification n = recvqueue.poll(notTimeout,
                                      TimeUnit.MILLISECONDS);
      /*
                 * Sends more notifications if haven't received enough.
                 * Otherwise processes new notification.
                 */
      if(n == null){
        if(manager.haveDelivered()){
          // 已经和其他节点建立了连接，并且发往某些节点的消息队列为空，继续发送自己的选票
          sendNotifications();
        } else {
          // queueSendMap 内容为空，代表当前节点没有和其他节点建立连接，因为只有创建连接，才会在queueSendMap中添加映射关系
          // 连接其他节点
          manager.connectAll();
        }
        /*
                     * Exponential backoff
                     */
        // 等待指定时间之后没有收到任何信息，会倍增等待时间
        int tmpTimeOut = notTimeout*2;
        notTimeout = (tmpTimeOut < maxNotificationInterval?
                      tmpTimeOut : maxNotificationInterval);
        LOG.info("Notification time out: " + notTimeout);
      } 
      else if (validVoter(n.sid) && validVoter(n.leader)) {
        // 验证接收到的选票中，投票的节点和该节点认为的leader是否合法
        /*
                     * Only proceed if the vote comes from a replica in the current or next
                     * voting view for a replica in the current or next voting view.
                     */
        // 根据投票节点当前状态，执行不同的操作
        switch (n.state) {
          case LOOKING:
            // If notification > current, replace and send messages out
            // 1. 对端节点的选举轮数大于当前节点
            // 这里需要区别electionEpoch和peerEpoch
            // 这里比较的是electionEpoch
            if (n.electionEpoch > logicalclock.get()) {
              // 更新当前节点的选举轮数
              logicalclock.set(n.electionEpoch);
              // 清空选票箱
              recvset.clear();
              // 比较选票投的节点信息和当前节点信息
              // 比较顺序是
              // epoch大的选票胜出
              // epoch相同，zxid大的选票胜出
              // epoch和zxid相同，myid大的胜出
              // 这里需要注意，比较的是对端选票的leader和当前节点的myid zxid peerEpoch
              if(totalOrderPredicate(n.leader, n.zxid, n.peerEpoch,
                                     getInitId(), getInitLastLoggedZxid(), getPeerEpoch())) {
                // 对端选票投的节点胜出，更新当前节点的选票
                updateProposal(n.leader, n.zxid, n.peerEpoch);
              } else {
                updateProposal(getInitId(),
                               getInitLastLoggedZxid(),
                               getPeerEpoch());
              }
              // 发送更新后的选票
              sendNotifications();
            } else if (n.electionEpoch < logicalclock.get()) {
              // 2. 当前节点的选举轮次大于接收到的选票的选举轮次，直接忽略该选票
              if(LOG.isDebugEnabled()){
                LOG.debug("Notification election epoch is smaller than logicalclock. n.electionEpoch = 0x"
                          + Long.toHexString(n.electionEpoch)
                          + ", logicalclock=0x" + Long.toHexString(logicalclock.get()));
              }
              break;
            } else if (totalOrderPredicate(n.leader, n.zxid, n.peerEpoch,
                                           proposedLeader, proposedZxid, proposedEpoch)) {
              // 3. 对端选票的投票轮次和当前节点相同，pk选票
              // 使用胜出的选票更新当前节点的选票
              updateProposal(n.leader, n.zxid, n.peerEpoch);
              // 发送更新后的选票
              sendNotifications();
            }
            if(LOG.isDebugEnabled()){
              LOG.debug("Adding vote: from=" + n.sid +
                        ", proposed leader=" + n.leader +
                        ", proposed zxid=0x" + Long.toHexString(n.zxid) +
                        ", proposed election epoch=0x" + Long.toHexString(n.electionEpoch));
            }
            // don't care about the version if it's in LOOKING state
            // 4. 将对端节点的选票记录到选票箱中
            recvset.put(n.sid, new Vote(n.leader, n.zxid, n.electionEpoch, n.peerEpoch));
            // 5. 判断当前的投票结果是否能够确认leader，即和当前节点的选票相同的选票个数是否过半
            if (termPredicate(recvset,
                              new Vote(proposedLeader, proposedZxid,
                                       logicalclock.get(), proposedEpoch))) {
              // Verify if there is any change in the proposed leader
              // 等待finalizeWait时间，如果在这段时间内没有接收到消息，那么代表已经选出了leader
              // 如果接收到了消息，代表选举过程仍然需要继续，将消息重新塞到接收队列中
              while((n = recvqueue.poll(finalizeWait,
                                        TimeUnit.MILLISECONDS)) != null){
                if(totalOrderPredicate(n.leader, n.zxid, n.peerEpoch,
                                       proposedLeader, proposedZxid, proposedEpoch)){
                  recvqueue.put(n);
                  break;
                }
              }
              /*
                             * This predicate is true once we don't read any new
                             * relevant message from the reception queue
                             */
              if (n == null) {
                // 当前已经决定出leader,更新当前节点的状态
                self.setPeerState((proposedLeader == self.getId()) ?
                                  ServerState.LEADING: learningState());
                // 生成最终的选举结果
                Vote endVote = new Vote(proposedLeader,
                                        proposedZxid, logicalclock.get(), 
                                        proposedEpoch);
                // 清空投票箱中的选票
                leaveInstance(endVote);
                return endVote;
              }
            }
            break;
          case OBSERVING:
            LOG.debug("Notification from observer: " + n.sid);
            break;
          case FOLLOWING:
          case LEADING:
            /*
                         * Consider all notifications from the same epoch
                         * together.
                         */
            // 当前节点已经结束了选举，仍然收到来自同一轮选举的其他节点发来的选票
            if(n.electionEpoch == logicalclock.get()){
              // 因为属于同一轮选举，因此需要更新投票箱中的选票
              recvset.put(n.sid, new Vote(n.leader, n.zxid, n.electionEpoch, n.peerEpoch));
              // 接收到的选票胜出
              if(termPredicate(recvset, new Vote(n.version, n.leader,
                                                 n.zxid, n.electionEpoch, n.peerEpoch, n.state))
                 && checkLeader(outofelection, n.leader, n.electionEpoch)) {
                // 根据选票结果更新当前节点状态
                self.setPeerState((n.leader == self.getId()) ?
                                  ServerState.LEADING: learningState());
                Vote endVote = new Vote(n.leader, 
                                        n.zxid, n.electionEpoch, n.peerEpoch);
                leaveInstance(endVote);
                return endVote;
              }
            }
            /*
                         * Before joining an established ensemble, verify that
                         * a majority are following the same leader.
                         */
            // 因为是following或者leading结果发来的选票，将选票放到outofelection中
            outofelection.put(n.sid, new Vote(n.version, n.leader, 
                                              n.zxid, n.electionEpoch, n.peerEpoch, n.state));
            // 判断完成选举的节点是否follow相同的leader
            if (termPredicate(outofelection, new Vote(n.version, n.leader,
                                                      n.zxid, n.electionEpoch, n.peerEpoch, n.state))
                && checkLeader(outofelection, n.leader, n.electionEpoch)) {
              synchronized(this){
                logicalclock.set(n.electionEpoch);
                self.setPeerState((n.leader == self.getId()) ?
                                  ServerState.LEADING: learningState());
              }
              Vote endVote = new Vote(n.leader, n.zxid, 
                                      n.electionEpoch, n.peerEpoch);
              leaveInstance(endVote);
              return endVote;
            }
            break;
          default:
            LOG.warn("Notification state unrecoginized: " + n.state
                     + " (n.state), " + n.sid + " (n.sid)");
            break;
        }
      } else {
        if (!validVoter(n.leader)) {
          LOG.warn("Ignoring notification for non-cluster member sid {} from sid {}", n.leader, n.sid);
        }
        if (!validVoter(n.sid)) {
          LOG.warn("Ignoring notification for sid {} from non-quorum member sid {}", n.leader, n.sid);
        }
      }
    }
    return null;
  } finally {
    try {
      if(self.jmxLeaderElectionBean != null){
        MBeanRegistry.getInstance().unregister(
          self.jmxLeaderElectionBean);
      }
    } catch (Exception e) {
      LOG.warn("Failed to unregister with JMX", e);
    }
    self.jmxLeaderElectionBean = null;
    LOG.debug("Number of connection processing threads: {}",
              manager.getConnectionThreadCount());
  }
}
```

### 发送选票

```java
// FastLeaderElection
private void sendNotifications() {
  // 遍历其他节点
  for (long sid : self.getCurrentAndNextConfigVoters()) {
    QuorumVerifier qv = self.getQuorumVerifier();
    // 告知其他节点当前节点的选票
    ToSend notmsg = new ToSend(ToSend.mType.notification,
                               proposedLeader,
                               proposedZxid,
                               logicalclock.get(),
                               QuorumPeer.ServerState.LOOKING,
                               sid,
                               proposedEpoch, qv.toString().getBytes());
    if(LOG.isDebugEnabled()){
      LOG.debug("Sending Notification: " + proposedLeader + " (n.leader), 0x"  +
                Long.toHexString(proposedZxid) + " (n.zxid), 0x" + Long.toHexString(logicalclock.get())  +
                " (n.round), " + sid + " (recipient), " + self.getId() +
                " (myid), 0x" + Long.toHexString(proposedEpoch) + " (n.peerEpoch)");
    }
    sendqueue.offer(notmsg);
  }
}
```

### 判断Leader是否选出

```java
// FastLeaderElection
protected boolean termPredicate(Map<Long, Vote> votes, Vote vote) {
  SyncedLearnerTracker voteSet = new SyncedLearnerTracker();
  // 添加集群节点信息
  voteSet.addQuorumVerifier(self.getQuorumVerifier());
  if (self.getLastSeenQuorumVerifier() != null
      && self.getLastSeenQuorumVerifier().getVersion() > self
      .getQuorumVerifier().getVersion()) {
    voteSet.addQuorumVerifier(self.getLastSeenQuorumVerifier());
  }
  /*
         * First make the views consistent. Sometimes peers will have different
         * zxids for a server depending on timing.
         */
  // 遍历投票箱中的选票
  // 统计和当前节点的选票相同的选票有多少个
  // 将这些选票添加到ack集合中
  for (Map.Entry<Long, Vote> entry : votes.entrySet()) {
    if (vote.equals(entry.getValue())) {
      voteSet.addAck(entry.getKey());
    }
  }
  // 判断ackset中的选票个数是否过半
  return voteSet.hasAllQuorums();
}
```

### 校验leader

```java
// FastLeaderElection
protected boolean checkLeader(
            Map<Long, Vote> votes,
            long leader,
            long electionEpoch){
  boolean predicate = true;
  /*
         * If everyone else thinks I'm the leader, I must be the leader.
         * The other two checks are just for the case in which I'm not the
         * leader. If I'm not the leader and I haven't received a message
         * from leader stating that it is leading, then predicate is false.
         */
  // 当前节点不是指定选票选出的leader
  if(leader != self.getId()){
    // 当前节点没有收到指定选票选出的leader的选票，此时认为没有选出leader
    if(votes.get(leader) == null) predicate = false;
    // 指定选票选出的leader没有发送ack消息，此时认为没有选出leader
    else if(votes.get(leader).getState() != ServerState.LEADING) predicate = false;
  } else if(logicalclock.get() != electionEpoch) {
    // 指定选票认为当前节点是leader，但是两者处于不同的选举轮次，此时也认为没有选出leader
    predicate = false;
  }
  return predicate;
}
```

### 接收选票

```java
// WorkerReceiver
public void run() {
  Message response;
  while (!stop) {
    // Sleeps on receive
    try {
      // 1. 从接收队列取出其他节点发送给当前节点的投票
      response = manager.pollRecvQueue(3000, TimeUnit.MILLISECONDS);
      if(response == null) continue;
      // The current protocol and two previous generations all send at least 28 bytes
      if (response.buffer.capacity() < 28) {
        LOG.error("Got a short response: " + response.buffer.capacity());
        continue;
      }
      // this is the backwardCompatibility mode in place before ZK-107
      // It is for a version of the protocol in which we didn't send peer epoch
      // With peer epoch and version the message became 40 bytes
      boolean backCompatibility28 = (response.buffer.capacity() == 28);
      // this is the backwardCompatibility mode for no version information
      boolean backCompatibility40 = (response.buffer.capacity() == 40);
      response.buffer.clear();
      // Instantiate Notification and set its attributes
      Notification n = new Notification();
      // 2. 将消息解析成Notification
      int rstate = response.buffer.getInt();
      long rleader = response.buffer.getLong();
      long rzxid = response.buffer.getLong();
      long relectionEpoch = response.buffer.getLong();
      long rpeerepoch;
      int version = 0x0;
      if (!backCompatibility28) {
        rpeerepoch = response.buffer.getLong();
        if (!backCompatibility40) {
          /*
                                 * Version added in 3.4.6
                                 */
          version = response.buffer.getInt();
        } else {
          LOG.info("Backward compatibility mode (36 bits), server id: {}", response.sid);
        }
      } else {
        LOG.info("Backward compatibility mode (28 bits), server id: {}", response.sid);
        rpeerepoch = ZxidUtils.getEpochFromZxid(rzxid);
      }
      QuorumVerifier rqv = null;
      // 省略
      /*
                         * If it is from a non-voting server (such as an observer or
                         * a non-voting follower), respond right away.
                         */
      if(!validVoter(response.sid)) {
        Vote current = self.getCurrentVote();
        QuorumVerifier qv = self.getQuorumVerifier();
        ToSend notmsg = new ToSend(ToSend.mType.notification,
                                   current.getId(),
                                   current.getZxid(),
                                   logicalclock.get(),
                                   self.getPeerState(),
                                   response.sid,
                                   current.getPeerEpoch(),
                                   qv.toString().getBytes());
        sendqueue.offer(notmsg);
      } else {
        // Receive new message
        if (LOG.isDebugEnabled()) {
          LOG.debug("Receive new notification message. My id = "
                    + self.getId());
        }
        // State of peer that sent this message
        // 解析对端节点当前状态
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
        n.leader = rleader;
        n.zxid = rzxid;
        n.electionEpoch = relectionEpoch;
        n.state = ackstate;
        n.sid = response.sid;
        n.peerEpoch = rpeerepoch;
        n.version = version;
        n.qv = rqv;
        /*
                             * Print notification info
                             */
        if(LOG.isInfoEnabled()){
          printNotification(n);
        }
        /*
                             * If this server is looking, then send proposed leader
                             */
				// 3. 处理接收到的选票
        if(self.getPeerState() == QuorumPeer.ServerState.LOOKING){
          // 当前节点状态是looking，将接收到的消息放到recvQueue中，由FastLeaderElection进一步处理
          recvqueue.offer(n);
          /*
                                 * Send a notification back if the peer that sent this
                                 * message is also looking and its logical clock is
                                 * lagging behind.
                                 */
          // 对端节点当前状态也是looking并且投票轮数小于当前节点
          // 将当前节点的投票结果发送给对端
          if((ackstate == QuorumPeer.ServerState.LOOKING)
             && (n.electionEpoch < logicalclock.get())){
            Vote v = getVote();
            QuorumVerifier qv = self.getQuorumVerifier();
            ToSend notmsg = new ToSend(ToSend.mType.notification,
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
          /*
                                 * If this server is not looking, but the one that sent the ack
                                 * is looking, then send back what it believes to be the leader.
                                 */
          // 当前节点不是looking，代表已经完成了选举
          Vote current = self.getCurrentVote();
          // 对端节点仍然是looking
          if(ackstate == QuorumPeer.ServerState.LOOKING){
            if(LOG.isDebugEnabled()){
              LOG.debug("Sending new notification. My id ={} recipient={} zxid=0x{} leader={} config version = {}",
                        self.getId(),
                        response.sid,
                        Long.toHexString(current.getZxid()),
                        current.getId(),
                        Long.toHexString(self.getQuorumVerifier().getVersion()));
            }
            // 将当前节点的选票发送给对端
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
      LOG.warn("Interrupted Exception while waiting for new message" +
               e.toString());
    }
  }
  LOG.info("WorkerReceiver is down");
}
```

### 流程总结

**1、** 初始阶段，每个节点会生成投给自己的选票，然后广播给其他节点；

**2、** 每个节点内部有一个投票箱，用来记录其他节点发送过来的选票；

**3、** 每次接收到选票，根据接收到选票的投票轮数和当前节点的投票轮数的比较关系，会进行不同处理；

**3、** 1对端投票轮数大于当前节点使用对端的投票轮数设置当前节点并清空当前节点的投票箱，使用对端选票和当前节点的选票进行ok，使用胜出选票更新当前节点的选票；

**3、** 2对端投票轮数小于当前节点，忽略；

**3、** 3对端投票轮数等于当前节点，选票pk并更新；

其中选票Pk规则为比较三元组(epoch, zxid, myid) ，依次比较每个维度，大者胜出
**4、** 将对端选票放到选票箱中，判断是否有超过半数的节点都选择同一个leader，如果有，更新当前节点的状态为leading或者following；

> 版权声明：「DDKK.COM 弟弟快看，程序员编程资料站」本站文章，版权归原作者所有
