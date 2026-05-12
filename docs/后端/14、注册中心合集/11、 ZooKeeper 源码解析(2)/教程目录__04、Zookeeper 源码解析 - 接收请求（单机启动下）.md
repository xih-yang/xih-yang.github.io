# 04、Zookeeper 源码解析 - 接收请求（单机启动下）
- 来源：https://ddkk.com/zhuanlan/registered/zookeeper/2/4.html
- 分类：注册中心
- 分组：教程目录
### 一、接收请求

前文分析了ZooKeeper单机模式下的简单启动过程，本文接着前文继续分析，ZooKeeper启动之后，是怎么样处理来自客户端的请求。

前文分析可知，ZooKeeper开启了三类线程来处理客户端的请求，AcceptThread、SelectorThread、ExpirerThread，本文将围绕着这三类线程进行展开，同时还需要注意WorkerService对象，三个线程的实例化都是在ServerCnxnFactory的configure方法中实现。

```java
expirerThread = new ConnectionExpirerThread();
for (int i = 0; i < numSelectorThreads; ++i) {
     selectorThreads.add(new SelectorThread(i));
}
//ss是ServerSocketChannel，addr是端口绑定地址
acceptThread = new AcceptThread(ss, addr, selectorThreads);
```

此时我们查看AcceptThread线程的构造方法：

```java
public AcceptThread(ServerSocketChannel ss, InetSocketAddress addr, Set<SelectorThread> selectorThreads) throws IOException {
   //设置线程名
    super("NIOServerCxnFactory.AcceptThread:" + addr);
    //设置ServerSocketChannel对象
    this.acceptSocket = ss;
    //注册接收请求事件
    this.acceptKey = acceptSocket.register(selector, SelectionKey.OP_ACCEPT);
    //赋值SelectorThread
    this.selectorThreads = Collections.unmodifiableList(new ArrayList<SelectorThread>(selectorThreads));
    //可迭代化
    selectorIterator = this.selectorThreads.iterator();
}
```

我们再看看SelectorThread线程的构造方法：

```java
public SelectorThread(int id) throws IOException {
//设置线程名
    super("NIOServerCxnFactory.SelectorThread-" + id);
    //线程id
    this.id = id;
    //设置一个接收阻塞队列
    acceptedQueue = new LinkedBlockingQueue<SocketChannel>();
    //更新队列
    updateQueue = new LinkedBlockingQueue<SelectionKey>();
}
```

以上两个线程都是继承自AbstractSelectThread抽象类，这个类中持有一个Selector selector，并在其构造方法中进行初始化，而AcceptThread线程又持有SelectorThread线程集合的引用，所以AcceptThread线程是ZooKeeper接收请求的入口线程，查看其run方法（去掉了一些异常，和日志代码）：

```java
public void run() {
    try {
    //这里就是不断地接收来自客户端的请求连接
        while (!stopped && !acceptSocket.socket().isClosed()) {
           select();
        }
    } finally {
       //系统推出关闭Selector对象
        closeSelector();
        if (!reconfiguring) {
        //停止服务
            NIOServerCnxnFactory.this.stop();
        }
    }
}
```

run方法会调用select()方法来处理请求：

```java
private void select() {
    try {
    //当前没有请求，会阻塞在这里（可以设置timeout时间，让其不进行阻塞）
        selector.select();
        Iterator<SelectionKey> selectedKeys = selector.selectedKeys().iterator();
        while (!stopped && selectedKeys.hasNext()) {
            SelectionKey key = selectedKeys.next();
            selectedKeys.remove();
            if (!key.isValid()) {
                continue;
            }
            //客户端的连接会先走这里
            if (key.isAcceptable()) {
            //处理具体的请求
                if (!doAccept()) {
                    //如果当前连接出现了异常，也就是不能正确处理当前的连接，就会调用selector.select(10)，也就是会阻塞10微妙，不会一直阻塞
                    pauseAccept(10);
                }
            } else {
                LOG.warn("Unexpected ops in accept select {}", key.readyOps());
            }
        }
    } catch (IOException e) {
        LOG.warn("Ignoring IOException while selecting", e);
    }
}
```

主要的逻辑集中在doAccept方法中：

```java
private boolean doAccept() {
    boolean accepted = false;
    SocketChannel sc = null;
    try {
    //获取到Socket对象
        sc = acceptSocket.accept();
        accepted = true;
        //如果达到了最大连接数
        if (limitTotalNumberOfCnxns()) {
            throw new IOException("Too many connections max allowed is " + maxCnxns);
        }
        //获取到地址
        InetAddress ia = sc.socket().getInetAddress();
        //判断当前有多少连接
        int cnxncount = getClientCnxnCount(ia);
        //如果超过最大连接数
        if (maxClientCnxns > 0 && cnxncount >= maxClientCnxns) {
            throw new IOException("Too many connections from " + ia + " - max is " + maxClientCnxns);
        }
        //设置为非阻塞模式
        sc.configureBlocking(false);
        //从selectorIterator集合中取出一个对象
        if (!selectorIterator.hasNext()) {
            selectorIterator = selectorThreads.iterator();
        }
        SelectorThread selectorThread = selectorIterator.next();
        //把当前的连接接入到acceptedQueue队列中
        if (!selectorThread.addAcceptedConnection(sc)) {
            throw new IOException("Unable to add connection to selector queue"
                                  + (stopped ? " (shutdown in progress)" : ""));
        }
        //输出一些日志
        acceptErrorLogger.flush();
    } catch (IOException e) {
        // accept, maxClientCnxns, configureBlocking
        ServerMetrics.getMetrics().CONNECTION_REJECTED.add(1);
        acceptErrorLogger.rateLimitLog("Error accepting new connection: " + e.getMessage());
        //快速关闭连接
        fastCloseSock(sc);
    }
    return accepted;
}
}
```

AcceptThread方法比较简单，就是不断地接收客户端的请求，然后把请求添加到SelectorThread线程中的acceptedQueue队列中，接下来我们再看看SelectorThread线程的run方法。

```java
public void run() {
    try {
    //也是不断地轮询
        while (!stopped) {
                //业务处理也在这三个方法中
                select();
                processAcceptedConnections();
                processInterestOpsUpdateRequests();
        }
        //服务关闭之后，进行一些清理工作
        for (SelectionKey key : selector.keys()) {
            NIOServerCnxn cnxn = (NIOServerCnxn) key.attachment();
            if (cnxn.isSelectable()) {
                cnxn.close(ServerCnxn.DisconnectReason.SERVER_SHUTDOWN);
            }
            cleanupSelectionKey(key);
        }
        SocketChannel accepted;
        while ((accepted = acceptedQueue.poll()) != null) {
            fastCloseSock(accepted);
        }
        updateQueue.clear();
    } finally {
        closeSelector();
        NIOServerCnxnFactory.this.stop();
        LOG.info("selector thread exitted run method");
    }
}
```

select()：

```java
private void select() {
    try {
    //这里的select主要是获取读请求的SocketChannel，accept请求交给了AcceptThread线程
        selector.select();
        Set<SelectionKey> selected = selector.selectedKeys();
        ArrayList<SelectionKey> selectedList = new ArrayList<SelectionKey>(selected);
        Collections.shuffle(selectedList);
        Iterator<SelectionKey> selectedKeys = selectedList.iterator();
        while (!stopped && selectedKeys.hasNext()) {
            SelectionKey key = selectedKeys.next();
            selected.remove(key);
            if (!key.isValid()) {
                cleanupSelectionKey(key);
                continue;
            }
            //处理具体的读写请求
            if (key.isReadable() || key.isWritable()) {
                handleIO(key);
            } else {
                LOG.warn("Unexpected ops in select {}", key.readyOps());
            }
        }
    } catch (IOException e) {
        LOG.warn("Ignoring IOException while selecting", e);
    }
}
```

select方法会把准备好的读写请求，交给handleIO方法去处理具体的业务。

processAcceptedConnections()：

```java
private void processAcceptedConnections() {
    SocketChannel accepted;
    //这里从阻塞队列acceptedQueue中取出AcceptThread线程中添加过来的SocketChannel对象
    while (!stopped && (accepted = acceptedQueue.poll()) != null) {
        SelectionKey key = null;
        try {
           //注册读请求
            key = accepted.register(selector, SelectionKey.OP_READ);
            //创建一个NIOServerCnxn对象
            NIOServerCnxn cnxn = createConnection(accepted, key, this);
            //设置为附件
            key.attach(cnxn);
            //添加当前连接在集合中
            addCnxn(cnxn);
        } catch (IOException e) {
            // register, createConnection
            cleanupSelectionKey(key);
            fastCloseSock(accepted);
        }
    }
}
```

processInterestOpsUpdateRequests()：这个方法比较简单就是更新当前的连接事件。

所以这里就有一个处理顺序，AcceptThread接收连接事件，并添加到SelectorThread线程的acceptedQueue阻塞队列中，SelectorThread线程再从acceptedQueue队列中不断的取出连接事件，并封装成NIOServerCnxn实例作为附件，传递给读事件，SelectorThread再调用handleIO方法来处理读写事件。

```java
NIOServerCnxn cnxn = createConnection(accepted, key, this)：
protected NIOServerCnxn createConnection(SocketChannel sock, SelectionKey sk, SelectorThread selectorThread) throws IOException {
    return new NIOServerCnxn(zkServer, sock, sk, this, selectorThread);
}
```

接下来就是IO处理方法：

```java
private void handleIO(SelectionKey key) {
   //实例化IO工作请求
    IOWorkRequest workRequest = new IOWorkRequest(this, key);
    //获取到附件
    NIOServerCnxn cnxn = (NIOServerCnxn) key.attachment();
    // disable掉当前SelectionKey的轮询
    cnxn.disableSelectable();
    //设置无事件
    key.interestOps(0);
    touchCnxn(cnxn);
    //这里就是调用线程池来执行workRequest
    workerPool.schedule(workRequest);
}
```

workerPool.schedule(workRequest)：

```java
public void schedule(WorkRequest workRequest, long id) {
    //如果已经服务暂停，清理工作
    if (stopped) {
        workRequest.cleanup();
        return;
    }
   //ScheduledWorkRequest实现了Runnable接口，其run方法就是调用workRequest.doWork()方法
    ScheduledWorkRequest scheduledWorkRequest = new ScheduledWorkRequest(workRequest);
    // 如果当前存在线程池，通过线程池调用，否则直接调用run方法
    int size = workers.size();
    if (size > 0) {
        try {
            //取出线程池
            int workerNum = ((int) (id % size) + size) % size;
            ExecutorService worker = workers.get(workerNum);
            //执行任务
            worker.execute(scheduledWorkRequest);
        } catch (RejectedExecutionException e) {
            LOG.warn("ExecutorService rejected execution", e);
            workRequest.cleanup();
        }
    } else {
        scheduledWorkRequest.run();
    }
}
```

最后调用到workRequest的doWork方法。

```java
public void doWork() throws InterruptedException {
  //当前key是否已经失效
    if (!key.isValid()) {
        selectorThread.cleanupSelectionKey(key);
        return;
    }
    //当前是读写请求
    if (key.isReadable() || key.isWritable()) {
        cnxn.doIO(key);
        // 服务是否挂你吧
        if (stopped) {
            cnxn.close(ServerCnxn.DisconnectReason.SERVER_SHUTDOWN);
            return;
        }
        if (!key.isValid()) {
            selectorThread.cleanupSelectionKey(key);
            return;
        }
        touchCnxn(cnxn);
    }
    // 标记当前key可以重新轮询
    cnxn.enableSelectable();
    if (!selectorThread.addInterestOpsUpdateRequest(key)) {
        cnxn.close(ServerCnxn.DisconnectReason.CONNECTION_MODE_CHANGED);
    }
}
```

doWork方法又会调用NIOServerCnxn的doIO方法（去除了一些不重要的代码）：

```java
void doIO(SelectionKey k) throws InterruptedException {
    try {
    //如果当前是读请求
        if (k.isReadable()) {
        //读取数据到buffer对象中，incomingBuffer默认大小是4
            int rc = sock.read(incomingBuffer);
            if (rc < 0) {
            //处理失败的读请求
                handleFailedRead();
            }
            //缓冲区是否读取完整
            if (incomingBuffer.remaining() == 0) {
                boolean isPayload;
                //默认走这里
                if (incomingBuffer == lenBuffer) {
  // start of next request
                    incomingBuffer.flip();
                    //读取当前请求的长度，并重新实例化incomingBuffer 
                    isPayload = readLength(k);
                    //清空缓冲区
                    incomingBuffer.clear();
                } else {
                    // continuation
                    isPayload = true;
                }
                //读取具体指令数据
                if (isPayload) {
                    readPayload();
                } else {
                    return;
                }
            }
        }
        if (k.isWritable()) {
            handleWrite(k);
        }
    } catch (CancelledKeyException e) {
    }  
}
```

readPayload方法：

```java
private void readPayload() throws IOException, InterruptedException, ClientCnxnLimitException {
    if (incomingBuffer.remaining() != 0) {
    //继续读取数据
        int rc = sock.read(incomingBuffer); 
        if (rc < 0) {
            handleFailedRead();
        }
    }
    if (incomingBuffer.remaining() == 0) {
  // have we read length bytes?
        incomingBuffer.flip();
        //标记当前接收到了数据次数，以及记录当前接收到了多少字节
        packetReceived(4 + incomingBuffer.remaining());
        //默认是false，执行完readConnectRequest后变成initialized=true
        if (!initialized) {
            //处理连接请求，也就是当前session对话第一次连接的时候会走这里，会处理sessionId
            readConnectRequest();
        } else {
        //处理请求，这里才是接收命令的地方
            readRequest();
        }
        lenBuffer.clear();
        incomingBuffer = lenBuffer;
    }
}
```

接收具体命令：

```java
protected void readRequest() throws IOException {
//通过服务来处理请求的包
    zkServer.processPacket(this, incomingBuffer);
}
```

接下来就是ZooKeeperServer中进行数据包的处理过程。

```java
public void processPacket(ServerCnxn cnxn, ByteBuffer incomingBuffer) throws IOException {
    //封装成二进制流
    InputStream bais = new ByteBufferInputStream(incomingBuffer);
    BinaryInputArchive bia = BinaryInputArchive.getArchive(bais);
    //请求头对象
    RequestHeader h = new RequestHeader();
    //反序列化请求头，此时会读取到xid和type两个值
    h.deserialize(bia, "header");
    incomingBuffer = incomingBuffer.slice();
    //判断当前是否为授权操作
    if (h.getType() == OpCode.auth) {
        //执行授权操作
        AuthPacket authPacket = new AuthPacket();
        //会读取到客服端传过来的type、scheme、auth等信息
        ByteBufferInputStream.byteBuffer2Record(incomingBuffer, authPacket);
        String scheme = authPacket.getScheme();
        //默认有ip和digest
        ServerAuthenticationProvider ap = ProviderRegistry.getServerProvider(scheme);
        Code authReturn = KeeperException.Code.AUTHFAILED;
        if (ap != null) {
            try {
                //此时会向ServerCnxn对象中的authInfo集合添加当前的授权
                authReturn = ap.handleAuthentication(
                    new ServerAuthenticationProvider.ServerObjs(this, cnxn),
                    authPacket.getAuth());
            } catch (RuntimeException e) {
                LOG.warn("Caught runtime exception from AuthenticationProvider: {}", scheme, e);
                authReturn = KeeperException.Code.AUTHFAILED;
            }
        }
        //权限添加成功返回
        if (authReturn == KeeperException.Code.OK) {
            ReplyHeader rh = new ReplyHeader(h.getXid(), 0, KeeperException.Code.OK.intValue());
            cnxn.sendResponse(rh, null, null);
        } else {
 //否则失败返回
            if (ap == null) {
            } else {
                LOG.warn("Authentication failed for scheme: {}", scheme);
            }
            // send a response...
            ReplyHeader rh = new ReplyHeader(h.getXid(), 0, KeeperException.Code.AUTHFAILED.intValue());
            cnxn.sendResponse(rh, null, null);
            // ... and close connection
            cnxn.sendBuffer(ServerCnxnFactory.closeConn);
            cnxn.disableRecv();
        }
        return;
        //处理sasl
    } else if (h.getType() == OpCode.sasl) {
        processSasl(incomingBuffer, cnxn, h);
    } else {
    //以下才是处理日常命令的地方
        if (!authHelper.enforceAuthentication(cnxn, h.getXid())) {
            // 权限验证失败返回
            return;
        } else {
        //处理具体的请求
            Request si = new Request(cnxn, cnxn.getSessionId(), h.getXid(), h.getType(), incomingBuffer, cnxn.getAuthInfo());
            int length = incomingBuffer.limit();
            if (isLargeRequest(length)) {
                checkRequestSizeWhenMessageReceived(length);
                si.setLargeRequestSize(length);
            }
            si.setOwner(ServerCnxn.me);
            //提交请求Request 
            submitRequest(si);
        }
    }
}
```

submitRequest方法会调用如下方法：

```java
public void enqueueRequest(Request si) {
    if (requestThrottler == null) {
        synchronized (this) {
            try {
                // 等待服务的完全启动
                while (state == State.INITIAL) {
                    wait(1000);
                }
            } catch (InterruptedException e) {
                LOG.warn("Unexpected interruption", e);
            }
            if (requestThrottler == null) {
                throw new RuntimeException("Not started");
            }
        }
    }
    //提交到RequestThrottler阻塞队列submittedRequests中
    requestThrottler.submitRequest(si);
}
```

RequestThrottler是一个线程，他的run方法会不断去消费submittedRequests中的request，然后在zks.submitRequestNow(request)执行这个方法（去掉了部分代码）。

```java
public void submitRequestNow(Request si) {
    try {
        touch(si.cnxn);
        //查看当前是否是有效命令
        boolean validpacket = Request.isValid(si.type);
        if (validpacket) {
        //这是一个空实现
            setLocalSessionFlag(si);
            //调用processor处理
            firstProcessor.processRequest(si);
            if (si.cnxn != null) {
                incInProcess();
            }
        } else {
            requestFinished(si);
            new UnimplementedRequestProcessor().processRequest(si);
        }
    } catch (MissingSessionException e) {
    }  
}
```

此时我们只要关注firstProcessor的processRequest方法即可。firstProcessor的实例化在启动时调用startup方法时，执行setupRequestProcessors()方法。

```java
protected void setupRequestProcessors() {
    RequestProcessor finalProcessor = new FinalRequestProcessor(this);
    RequestProcessor syncProcessor = new SyncRequestProcessor(this, finalProcessor);
    ((SyncRequestProcessor) syncProcessor).start();
    firstProcessor = new PrepRequestProcessor(this, syncProcessor);
    ((PrepRequestProcessor) firstProcessor).start();
}
```

这里是一个责任链模式，调用的过程是PrepRequestProcessor->SyncRequestProcessor->FinalRequestProcessor.这是一个异步调用过程。firstProcessor的processRequest方法会往submittedRequests添加当前的request。然后run方法再不断的消费submittedRequests中的request。firstProcessor处理完成会传递给syncProcessor，syncProcessor处理完再传递给finalProcessor ，最后做结果返回。接下来我们针对三种Processor分别处理什么逻辑进行分析。

***PrepRequestProcessor：***

他的processRequest方法会往submittedRequests阻塞队列中添加request请求，具体的业务处理在其run方法里，这是一个异步处理过程，类似于生产者和消费者，run方法的业务处理很简单，从submittedRequests取出request，然后交给pRequest(request)进行进一步处理，此时又会调用pRequestHelper(request)，pRequestHelper处理完成就会调用nextProcessor.processRequest(request)，交给SyncRequestProcessor进行处理。

pRequestHelper方法过长就不贴出代码进行分析，大致逻辑就是根据request.type，也就是请求的命令，来switch，进行不同的处理。

**1、** 如果客户端执行的是createContainer、create、create2就会创建一个CreateRequest对象交给pRequest2Txn方法处理；

**2、** 如果执行的是createTTL，创建CreateTTLRequest，交给pRequest2Txn方法；

**3、** 如果执行的是deleteContainer、delete，创建一个DeleteRequest，然后交给pRequest2Txn方法；

**4、** 如果执行的是setData，创建SetDataRequest，然后交给pRequest2Txn；

**5、** 如果执行的是reconfig，创建ReconfigRequest，然后交给pRequest2Txn；

**6、** 如果执行的是setACL，创建SetACLRequest，然后交给pRequest2Txn；

**7、** 如果执行的是check，创建CheckVersionRequest，然后交给pRequest2Txn；

**8、** 如果执行的是multi，创建MultiOperationRecord，然后交给pRequest2Txn；

**9、** 如果执行的是createSession、closeSession，直接调用pRequest2Txn；

**10、** 如果执行的是sync、exists、getData、getACL、getChildren、getAllChildrenNumber、getChildren2、ping、setWatches、setWatches2、checkWatches、removeWatches、getEphemerals、multiRead、addWatch、whoAmI，此时只需要检测当前session是否有效即可；

也就是增删改操作会调用pRequest2Txn方法进行处理，剩下的调用就是直接进行session会话检测，pRequest2Txn是做一些记录保存到outstandingChanges和outstandingChangesForPath集合中。接下来就是SyncRequestProcessor中对request的处理。

***SyncRequestProcessor：***

这也是异步处理过程，业务逻辑也在run方法中：

```java
public void run() {
    try {
        //设置randRoll和randSize随机数
        resetSnapshotStats();
        while (true) {
           //取出队列中request对象
            Request si = queuedRequests.poll(pollTime, TimeUnit.MILLISECONDS);
            //如果当前没有请求，也就是执行nextProcessor.processRequest(si)
            if (si == null) {
               //更新之前的请求
                flush();
                //阻塞等待请求到来
                si = queuedRequests.take();
            }
             //如果当前请求是REQUEST_OF_DEATH，跳出循环
            if (si == REQUEST_OF_DEATH) {
                break;
            }
            //zks.getZKDatabase().append(si)会把当前的request进行日志记录，也就是增删改操作会进行日志记录
            if (!si.isThrottled() && zks.getZKDatabase().append(si)) {
            //是否需要进行文件快照，达到一定的请求数（默认是5W+randRoll）或者请求大小（默认是2GB+randSize）
                if (shouldSnapshot()) {
                    resetSnapshotStats();
                    //重置请求数和请求大小，以及设置logStream=null,也就是此时会重新生成一个日志文件
                    zks.getZKDatabase().rollLog();
                    // take a snapshot
                    if (!snapThreadMutex.tryAcquire()) {
                        LOG.warn("Too busy to snap, skipping");
                    } else {
                        new ZooKeeperThread("Snapshot Thread") {
                            public void run() {
                                try {
                                //此时需要进行文件快照存储
                                    zks.takeSnapshot();
                                } catch (Exception e) {
                                    LOG.warn("Unexpected exception", e);
                                } finally {
                                    snapThreadMutex.release();
                                }
                            }
                        }.start();
                    }
                }
            } else if (toFlush.isEmpty()) {
                //执行nextProcessor.processRequest(si);
                if (nextProcessor != null) {
                    nextProcessor.processRequest(si);
                    if (nextProcessor instanceof Flushable) {
                        ((Flushable) nextProcessor).flush();
                    }
                }
                continue;
            }
            //添加当前的请求到toFlush队列中
            toFlush.add(si);
            //默认是是当请求数达到了1000
            if (shouldFlush()) {
                flush();
            }
            ServerMetrics.getMetrics().SYNC_PROCESS_TIME.add(Time.currentElapsedTime() - startProcessTime);
        }
    } catch (Throwable t) {
        handleException(this.getName(), t);
    }
}
```

从run方法可知SyncRequestProcessor是记录增删改的日志操作，最后的操作都会走向FinalRequestProcessor，它是同步处理，业务逻辑直接在其processRequest方法中，方法过长就不贴出代码，直接进行文字说明。

**1、** 先调用applyRequest(request)方法返回一个ProcessTxnResult实例，该方法又会调用ZooKeeperServer的processTxn方法进行事务处理，如果当前是增删改操作，又会调用ZKDatabase的processTxn方法进行处理，然后再调用DataTree的processTxn方法，这个方法就是最底层的增删改节点的方法；

**2、** 得到返回的ProcessTxnResult实例后，根据当前的操作类型switch出具体的响应操作，这里以create操作为例；

```java
case OpCode.create: {
//标记当前的操作是create
    lastOp = "CREA";
    //当前的响应是节点创建完成
    rsp = new CreateResponse(rc.path);
    err = Code.get(rc.err);
    //注册当前请求，默认是不操作
    requestPathMetricsCollector.registerRequest(request.type, rc.path);
    break;
}
```

执行完成后就会调用NIOServerCnxn对象中的sendResponse方法：

```java
public int sendResponse(ReplyHeader h, Record r, String tag, String cacheKey, Stat stat, int opCode) {
    int responseSize = 0;
    try {
    //封装好返回数据
        ByteBuffer[] bb = serialize(h, r, tag, cacheKey, stat, opCode);
        responseSize = bb[0].getInt();
        bb[0].rewind();
        //往outgoingBuffers添加当前需要响应的数据
        sendBuffer(bb);
        //这里会调用一个enableRecv方法
        decrOutstandingAndCheckThrottle(h);
    } catch (Exception e) {
        LOG.warn("Unexpected exception. Destruction averted.", e);
    }
    return responseSize;
}
```

```java
public void enableRecv() {
    //设置当前的throttled为true
    if (throttled.compareAndSet(true, false)) {
        requestInterestOpsUpdate();
    }
}
```

再看看requestInterestOpsUpdate()方法：

```java
private void requestInterestOpsUpdate() {
    if (isSelectable()) {
       //这时候，就会往Selector线程中的updateQueue添加当前的SelectionKey
        selectorThread.addInterestOpsUpdateRequest(sk);
    }
}
```

我们知道updateQueue的处理在run方法中会代用processInterestOpsUpdateRequests()方法：

```java
private void processInterestOpsUpdateRequests() {
    SelectionKey key;
    //会不断的取出当前的队列中的key进行处理
    while (!stopped && (key = updateQueue.poll()) != null) {
        if (!key.isValid()) {
            cleanupSelectionKey(key);
        }
        NIOServerCnxn cnxn = (NIOServerCnxn) key.attachment();
        //如果当前的是key还是可选择的，那么继续添加相应的事件，具体需要添加什么事件，在getInterestOps()方法返回
        if (cnxn.isSelectable()) {
            key.interestOps(cnxn.getInterestOps());
        }
    }
}
```

getInterestOps()：

```java
public int getInterestOps() {
    if (!isSelectable()) {
        return 0;
    }
    int interestOps = 0;
    //此时就会根据throttled的值来判断，当前需要注册读事件还是写事件，由上可知，当操作完成之后throttled会被置为true，根据当前值可知此时SelectionKey注册的是写事件。
    if (getReadInterest()) {
        interestOps |= SelectionKey.OP_READ;
    }
    if (getWriteInterest()) {
        interestOps |= SelectionKey.OP_WRITE;
    }
    return interestOps;
}
```

此时SelectionKey又会被Selector线程不断的轮询，我们在doIO方法中有这么个调用：

```java
//当前的key是写事件，这个方法就会把outgoingBuffers队列中待返回的数据写入到socket中，此时客户端就会收到相应的相应 
if (k.isWritable()) {
    handleWrite(k);
}
```

### 二、总结

第一部分，大致分析了ZooKeeper单机模式下，接收请求，处理请求的过程，从分析来看整个处理过程相对还是比较复杂，这部分归纳一下整个接收处理过程。

**1、** ZooKeeper启动时，会启动AcceptThread和SelectorThread线程，前者主要处理OP_ACCEPT事件，后者主要处理OP_READ和OP_WRITE事件；

**2、** AcceptThread线程接收到OP_ACCEPT事件后，会往SelectorThread线程的acceptedQueue队列中添加当前的SocketChannel连接，也就是AcceptThread会不断的接收客户端的请求，然后转发给SelectorThread线程处理；

**3、** SelectorThread线程中的run方法，会不断的从acceptedQueue队列中取出连接请求，然后在SelectionKey上注册OP_READ事件，然后把当前的SelectionKey和SocketChannel封装成NIOServerCnxn对象，作为附件传递到读事件上；

**4、** SelectorThread继续调用其select方法，这个方法就是不断调用handleIO(key)来处理读写事件；

**5、** handleIO会把当前的SelectorThread线程和SelectionKey封装成IOWorkRequest对象，并且标注当前的不可进行轮询，然后往cnxnExpiryQueue队列中添加NIOServerCnxn和其过期时间，然后调用workerPool线程池来执行当前的IOWorkRequest请求；

**6、** workerPool是WorkerService的实例，在服务启动的时候就创建的，他是一个线程池，线程池大小是CPU核心数*2；

**7、** WorkerService的schedule方法会把当前的IOWorkRequest继续封装成可调度执行的ScheduledWorkRequest对象，然后添加的线程池的任务队列中进等待执行，实际上就是执行IOWorkRequest的doWork()方法；

**8、** IOWorkRequest的doWork方法会判断当前的事件是否为读写事件，如果是执行NIOServerCnxn的doIO(key)方法，执行完成之后标记当前的key为可选择的；

**9、** NIOServerCnxn的doIO方法会分开处理读写事件，读事件就会调用readPayload()方法进行处理，写事件就会调用handleWrite(k)方法进行处理针对一个请求，第一步是执行读事件，然后再是写事件；

**10、** readPayload()读取当前的请求并处理，该方法会把当前的请求内容读到incomingBuffer缓冲区中，然后再提交给ZooKeeperServer的processPacket方法进行处理；

**11、** ZooKeeperServer的processPacket方法，先读取请求头，请求头包含两个信息xid和type，如果当前的请求是auth和sasl，会直接在这个方法中进行处理，就是往authInfo集合中添加对应的权限认证，否则，继续封装当前的请求为Request对象，然后调用submitRequest(si)方法，提交当前的request对象；

**12、** submitRequest(si)方法会调用requestThrottler.submitRequest(si)，RequestThrottler线程会在服务启动时，通过startRequestThrottler()方法启动此时submitRequest方法会往submittedRequests队列中添加当前的request请求这里又是一个异步调用过程，具体处理在run方法；

**13、** run方法又会调用zks.submitRequestNow(request)，来提交当前的请求，此时又回到了ZooKeeperServer实例；

**14、** zks.submitRequestNow(request)就会把当前的请求提交给firstProcessor.processRequest(si)执行；

**15、** RequestProcessor是链式调用过程，调用顺序是PrepRequestProcessor->SyncRequestProcessor->FinalRequestProcessor；

**16、** PrepRequestProcessor的processRequest方法，把当前的request添加到submittedRequests队列中，也是一个异步处理过程，其run方法会不断地调用pRequest(request)方法消费当前的request，这个方法会先调用pRequestHelper进行request的预处理，然后再调用nextProcessor.processRequest(request)处理；

**17、** pRequestHelper(request)，大致分为两种处理，一是处理增删改请求，另外一种是针对查询请求，增删改请求会直接调用pRequest2Txn进行处理，查询请求，会检测当前的session是否过期或合法pRequest2Txn方法会对请求做一些记录；

**18、** 接下来执行SyncRequestProcessor的processRequest方法，这也是一个异步处理过程，不断的往queuedRequests队列中添加和消费，run方法主要做两件事，一是针对增删改操作进行日志记录，第二就是调用nextProcessor.processRequest(si)，也就是执行最终的FinalRequestProcessor；

**19、** FinalRequestProcessor的processRequest方法，这个方法就是处理最终的读请求，处理逻辑是，如果是增删改操作，调用ZKDatabase的processTxn方法进行节点的增删改操作，此时不会写入到硬盘上进行持久化（何时持久化在第一部分已经介绍），如果是查询操作，直接查询出对应的信息；

**20、** ZKDatabase处理完成，后就会调用ServerCnxn的sendResponse方法进行响应；

**21、** sendResponse方法，把当前服务端的请求结果写入到缓冲区，然后标记当前的SelectionKey的事件为写事件；

**22、** 此时SelectorThread进行轮询，当轮询到改SelectionKey后又交给NIOServerCnxn的doIO方法，进行写事件的处理；

**23、** NIOServerCnxn的handleWrite(k)，就是调用底层的sock.write(directBuffer)写方法，把处理结果响应给客户端；

此时整个的调用链就完成，本节的分析过程也到此结束。

以上，有任何不对的地方，请留言指正，敬请谅解。
