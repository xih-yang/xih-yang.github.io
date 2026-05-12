# 07、ZooKeeper ZookeeperServer
- 来源：https://ddkk.com/zhuanlan/registered/zookeeper/d-1/7.html
- 分类：注册中心
- 分组：ZooKeeper 教程（版本 A）
## 继承层次

在之前分析zookeeper各个角色初始化的过程中，看到了每个角色都会创建一个相应的ZookeeperServer

ZookeeperServer代表服务器

QuorumZookeeperServer代表参与选举的服务器

LearnerZookeeperServer代表非Leader服务器

LeaderZookeeperServer代表Leader节点服务器

FollowerZookeeperServer代表Follower节点服务器

ObserverZookeeperServer代表Observer节点服务器

ReadOnlyZookeeperServer代表只读节点服务器

## ZookeeperServer

```java
public static interface SessionExpirer {
   // 过期指定的session
   void expire(Session session);
   // 获取当前节点的id
   long getServerId();
}
```

```java
// 获取当前server的一些统计信息
public interface Provider {
    public long getOutstandingRequests();
    public long getLastProcessedZxid();
    public String getState();
    public int getNumAliveConnections();
    public long getDataDirSize();
    public long getLogDirSize();
}
```

```java
public class ZooKeeperServer implements SessionExpirer, ServerStats.Provider {
}
```

因为ZookeeperServer实现了SessionExpirer和ServerStatus.Provider接口，因此具有过期会话和查询当前服务器信息的能力

## 内部类

## ChangeRecord

```java
// ChangeRecord
static class ChangeRecord {
    ChangeRecord(long zxid, String path, StatPersisted stat, int childCount,
            List<ACL> acl) {
        this.zxid = zxid;
        this.path = path;
        this.stat = stat;
        this.childCount = childCount;
        this.acl = acl;
    }
	// 事务id
    long zxid;
	// 记录的路径
    String path;
    StatPersisted stat; /* Make sure to create a new object when changing */
    int childCount;
    List<ACL> acl; /* Make sure to create a new object when changing */
	// 拷贝
    ChangeRecord duplicate(long zxid) {
        StatPersisted stat = new StatPersisted();
        if (this.stat != null) {
            DataTree.copyStatPersisted(this.stat, stat);
        }
        return new ChangeRecord(zxid, path, stat, childCount,
                acl == null ? new ArrayList<ACL>() : new ArrayList<ACL>(acl));
    }
}
```

ChangeRecord用来在PrepRequestProcessor和FinalRequestProcessor之间传递信息

## MissingSessionException

```java
// MissingSessionException
public static class MissingSessionException extends IOException {
    private static final long serialVersionUID = 7467414635467261007L;
    public MissingSessionException(String msg) {
        super(msg);
    }
}
```

MissingSessionException代表事务丢失

## State

```java
// State
protected enum State {
    INITIAL, RUNNING, SHUTDOWN, ERROR
}
```

State代表当前状态

## 主要属性

```java
// jmx bean
protected ZooKeeperServerBean jmxServerBean;
protected DataTreeBean jmxDataTreeBean;
// 默认的心跳时间
public static final int DEFAULT_TICK_TIME = 3000;
protected int tickTime = DEFAULT_TICK_TIME;
// 最小session过期时间
/** value of -1 indicates unset, use default */
protected int minSessionTimeout = -1;
// 最大session过期时间
/** value of -1 indicates unset, use default */
protected int maxSessionTimeout = -1;
// 事务跟踪器
protected SessionTracker sessionTracker;
// 事务日志
private FileTxnSnapLog txnLogFactory = null;
// zookeeper内部数据库
private ZKDatabase zkDb;
// 请求处理器
protected RequestProcessor firstProcessor;
// 当前状态
protected volatile State state = State.INITIAL;
private final AtomicInteger requestsInProcess = new AtomicInteger(0);
// 未处理changeRecord
final Deque<ChangeRecord> outstandingChanges = new ArrayDeque<>();
// this data structure must be accessed under the outstandingChanges lock
// 未处理changeRecord和其path之间的映射
final HashMap<String, ChangeRecord> outstandingChangesForPath =
    new HashMap<String, ChangeRecord>();
// 连接管理工厂
protected ServerCnxnFactory serverCnxnFactory;
protected ServerCnxnFactory secureServerCnxnFactory;
// 服务器统计信息
private final ServerStats serverStats;
// 当有重要的线程异常时会回调这个listener
private final ZooKeeperServerListener listener;
```

## 构造方法

## 默认构造方法

```java
public ZooKeeperServer() {
    serverStats = new ServerStats(this);
    listener = new ZooKeeperServerListenerImpl(this);
}
```

```java
// ZooKeeperServerListenerImpl
class ZooKeeperServerListenerImpl implements ZooKeeperServerListener {
    private static final Logger LOG = LoggerFactory
            .getLogger(ZooKeeperServerListenerImpl.class);
    private final ZooKeeperServer zkServer;
    ZooKeeperServerListenerImpl(ZooKeeperServer zkServer) {
        this.zkServer = zkServer;
    }
    @Override
    public void notifyStopping(String threadName, int exitCode) {
        LOG.info("Thread {} exits, error code {}", threadName, exitCode);
        zkServer.setState(State.ERROR);
    }
}
```

ZooKeeperServerListenerImpl默认的ZooKeeperServerListener的实现类，当重要线程出现致命错误时，会通知该类，该类会将当前的服务器状态设置为失败

## ZooKeeperServer(FileTxnSnapLog txnLogFactory, int tickTime, int minSessionTimeout, int maxSessionTimeout, ZKDatabase zkDb)

```java
public ZooKeeperServer(FileTxnSnapLog txnLogFactory, int tickTime,
            int minSessionTimeout, int maxSessionTimeout, ZKDatabase zkDb) {
    serverStats = new ServerStats(this);
    // 设置事务日志
    this.txnLogFactory = txnLogFactory;
    this.txnLogFactory.setServerStats(this.serverStats);
    this.zkDb = zkDb;
    this.tickTime = tickTime;
    // 如果为-1，会设置为2倍的心跳时间
    setMinSessionTimeout(minSessionTimeout);
    // 如果为-1，会设置为20倍的心跳时间
    setMaxSessionTimeout(maxSessionTimeout);
    listener = new ZooKeeperServerListenerImpl(this);
    LOG.info("Created server with tickTime " + tickTime
            + " minSessionTimeout " + getMinSessionTimeout()
            + " maxSessionTimeout " + getMaxSessionTimeout()
            + " datadir " + txnLogFactory.getDataDir()
            + " snapdir " + txnLogFactory.getSnapDir());
}
```

## ZooKeeperServer(FileTxnSnapLog txnLogFactory, int tickTime)

```java
// ZooKeeperServer
public ZooKeeperServer(FileTxnSnapLog txnLogFactory, int tickTime)
            throws IOException {
 // 指定心跳时间
 // 最小事务过期时间和最大事务过期时间设置为默认值
 this(txnLogFactory, tickTime, -1, -1, new ZKDatabase(txnLogFactory));
}
```

## ZooKeeperServer(FileTxnSnapLog txnLogFactory)

```java
public ZooKeeperServer(FileTxnSnapLog txnLogFactory)
        throws IOException
{
	// 使用默认心跳时间
	// 最小事务过期时间和最大事务过期时间设置为默认值
    this(txnLogFactory, DEFAULT_TICK_TIME, -1, -1, new ZKDatabase(txnLogFactory));
}
```

## ZooKeeperServer(File snapDir, File logDir, int tickTime)

```java
public ZooKeeperServer(File snapDir, File logDir, int tickTime)
            throws IOException {
 // 使用指定的快照目录和事务日志目录创建文件快照日志
 this( new FileTxnSnapLog(snapDir, logDir),
            tickTime);
}
```

## 重要方法

## startup

```java
public synchronized void startup() {
	// 1. 创建SessionTracker
    if (sessionTracker == null) {
        createSessionTracker();
    }
   	// 2. 启动SessionTracker
    startSessionTracker();
    // 3. 设置请求处理链
    setupRequestProcessors();
    // 4. 注册jmx
    registerJMX();
	// 5. 设置当前状态为running
    setState(State.RUNNING);
    notifyAll();
}
```

```java
protected void createSessionTracker() {
    sessionTracker = new SessionTrackerImpl(this, zkDb.getSessionWithTimeOuts(),
            tickTime, createSessionTrackerServerId, getZooKeeperServerListener());
}
```

## setupRequestProcessor

setupRequestProcessor用来设置请求处理链

```java
// ZookeeperServer
protected void setupRequestProcessors() {
    RequestProcessor finalProcessor = new FinalRequestProcessor(this);
    RequestProcessor syncProcessor = new SyncRequestProcessor(this,
            finalProcessor);
    ((SyncRequestProcessor)syncProcessor).start();
    firstProcessor = new PrepRequestProcessor(this, syncProcessor);
    ((PrepRequestProcessor)firstProcessor).start();
}
```

## loadData

```java
public void loadData() throws IOException, InterruptedException {
    /*
     * When a new leader starts executing Leader#lead, it 
     * invokes this method. The database, however, has been
     * initialized before running leader election so that
     * the server could pick its zxid for its initial vote.
     * It does it by invoking QuorumPeer#getLastLoggedZxid.
     * Consequently, we don't need to initialize it once more
     * and avoid the penalty of loading it a second time. Not 
     * reloading it is particularly important for applications
     * that host a large database.
     * 
     * The following if block checks whether the database has
     * been initialized or not. Note that this method is
     * invoked by at least one other method: 
     * ZooKeeperServer#startdata.
     *  
     * See ZOOKEEPER-1642 for more detail.
     */
    // 1. 设置事务id
    // 判断内存数据库是否初始化过
    if(zkDb.isInitialized()){
    	// 初始化过，使用上一次处理过的事务id
        setZxid(zkDb.getDataTreeLastProcessedZxid());
    }
    else {
   		// 没有初始化过，使用快照文件和事务日志文件来恢复内存数据库
        setZxid(zkDb.loadDataBase());
    }
    // Clean up dead sessions
    // 2. 杀死过期的事务
    LinkedList<Long> deadSessions = new LinkedList<Long>();
    for (Long session : zkDb.getSessions()) {
        if (zkDb.getSessionWithTimeOuts().get(session) == null) {
            deadSessions.add(session);
        }
    }
    for (long session : deadSessions) {
        // XXX: Is lastProcessedZxid really the best thing to use?
       	// 清除事务
        killSession(session, zkDb.getDataTreeLastProcessedZxid());
    }
    // Make a clean snapshot
    // 3. 进行快照
    takeSnapshot();
}
```

```java
// ZookeeperServer
protected void killSession(long sessionId, long zxid) {
   // 1. 修改内存数据库，将当前session创建的临时节点删除
   zkDb.killSession(sessionId, zxid);
   if (LOG.isTraceEnabled()) {
       ZooTrace.logTraceMessage(LOG, ZooTrace.SESSION_TRACE_MASK,
                                    "ZooKeeperServer --- killSession: 0x"
               + Long.toHexString(sessionId));
   }
   // 从sessionTracker中移除当前事务
   if (sessionTracker != null) {
       sessionTracker.removeSession(sessionId);
   }
}
```

## submitRequest

```java
public void submitRequest(Request si) {
    if (firstProcessor == null) {
        synchronized (this) {
            try {
                // 当设置完请求处理链之后，会将状态设置为running，这里会循环等待设置的完成
                while (state == State.INITIAL) {
                    wait(1000);
                }
            } catch (InterruptedException e) {
                LOG.warn("Unexpected interruption", e);
            }
            if (firstProcessor == null || state != State.RUNNING) {
                throw new RuntimeException("Not started");
            }
        }
    }
    try {
    	// 更新事务过期时间
        touch(si.cnxn);
        // 验证请求类型是否合法
        boolean validpacket = Request.isValid(si.type);
        if (validpacket) {
        	// 将请求交给请求处理链处理
            firstProcessor.processRequest(si);
            if (si.cnxn != null) {
                incInProcess();
            }
        } else {
            LOG.warn("Received packet at server of unknown type " + si.type);
            new UnimplementedRequestProcessor().processRequest(si);
        }
    } catch (MissingSessionException e) {
        if (LOG.isDebugEnabled()) {
            LOG.debug("Dropping request: " + e.getMessage());
        }
    } catch (RequestProcessorException e) {
        LOG.error("Unable to process request:" + e.getMessage(), e);
    }
}
```

## LeaderZookeeperServer

Leader节点会使用LeaderZookeeperServer作为自己的服务器实现

## 重要方法

## setupRequestProcessor

```java
// LeaderZookeeperServer
protected void setupRequestProcessors() {
    RequestProcessor finalProcessor = new FinalRequestProcessor(this);
    RequestProcessor toBeAppliedProcessor = new Leader.ToBeAppliedRequestProcessor(finalProcessor, getLeader());
    commitProcessor = new CommitProcessor(toBeAppliedProcessor,
            Long.toString(getServerId()), false,
            getZooKeeperServerListener());
    commitProcessor.start();
    ProposalRequestProcessor proposalProcessor = new ProposalRequestProcessor(this,
            commitProcessor);
    proposalProcessor.initialize();
    prepRequestProcessor = new PrepRequestProcessor(this, proposalProcessor);
    prepRequestProcessor.start();
    firstProcessor = new LeaderRequestProcessor(this, prepRequestProcessor);
    setupContainerManager();
}
```

## FollowerZookeeperServer

Follower节点使用的是FollowerZookeeperServer作为自己的服务器实现

## 主要属性

```java
// 待同步请求
ConcurrentLinkedQueue<Request> pendingSyncs;
// 待处理的事务
LinkedBlockingQueue<Request> pendingTxns = new LinkedBlockingQueue<Request>();
```

## 重要方法

## setupRequestProcessors

```java
protected void setupRequestProcessors() {
    RequestProcessor finalProcessor = new FinalRequestProcessor(this);
    commitProcessor = new CommitProcessor(finalProcessor,
            Long.toString(getServerId()), true, getZooKeeperServerListener());
    commitProcessor.start();
    firstProcessor = new FollowerRequestProcessor(this, commitProcessor);
    ((FollowerRequestProcessor) firstProcessor).start();
    syncProcessor = new SyncRequestProcessor(this,
            new SendAckRequestProcessor((Learner)getFollower()));
    syncProcessor.start();
}
```

## logRequest

```java
public void logRequest(TxnHeader hdr, Record txn) {
    Request request = new Request(hdr.getClientId(), hdr.getCxid(), hdr.getType(), hdr, txn, hdr.getZxid());
    if ((request.zxid & 0xffffffffL) != 0) {
        pendingTxns.add(request);
    }
    // 将请求交给syncProcessor处理，SyncProcessor会将请求日志落盘
    syncProcessor.processRequest(request);
}
```

当Follower接收到Leader端发来的proposal请求时，会调用logRequest来记录事务日志

## sync

```java
// LeaderZookeeperServer
synchronized public void sync(){
	// 当前没有待同步请求
    if(pendingSyncs.size() ==0){
        LOG.warn("Not expecting a sync.");
        return;
    }
	// 取出待同步请求，交给commitProcessor进行处理
    Request r = pendingSyncs.remove();
	commitProcessor.commit(r);
}
```

当客户端向follower发送sync请求，想要follower和leader数据进行同步，FollowerRequestProcessor处理到该请求，会调用sync方法

```java
public void run() {
	// 省略
	switch (request.type) {
       case OpCode.sync:
       	   // 将同步请求添加到队列中，并向leader发起同步请求
           zks.pendingSyncs.add(request);
           zks.getFollower().request(request);
           break;
}
```

## commit

```java
// FollowerZookeeperServer
public void commit(long zxid) {
    if (pendingTxns.size() == 0) {
        LOG.warn("Committing " + Long.toHexString(zxid)
                + " without seeing txn");
        return;
    }
    // 1. 匹配当前提交的请求和当前未处理的最老的请求
    long firstElementZxid = pendingTxns.element().zxid;
    if (firstElementZxid != zxid) {
        LOG.error("Committing zxid 0x" + Long.toHexString(zxid)
                + " but next pending txn 0x"
                + Long.toHexString(firstElementZxid));
        System.exit(12);
    }
    // 2. 将请求交给CommitProcessor
    Request request = pendingTxns.remove();
    commitProcessor.commit(request);
}
```

> 版权声明：「DDKK.COM 弟弟快看，程序员编程资料站」本站文章，版权归原作者所有
