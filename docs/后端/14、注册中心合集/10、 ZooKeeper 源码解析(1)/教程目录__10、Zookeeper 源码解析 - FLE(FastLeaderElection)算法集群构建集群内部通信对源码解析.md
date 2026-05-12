# 10、Zookeeper 源码解析 - FLE(FastLeaderElection)算法集群构建集群内部通信对源码解析
- 来源：https://ddkk.com/zhuanlan/registered/zookeeper/1/10.html
- 分类：注册中心
- 分组：教程目录
## 1.前话

在前面一篇已经分析过了FLE的原理流程以及通信结构，接下来便详细分析一下ZK集群在建立通信结构源码层面的操作流程，在进行接下来的源码通信流程前需要对这个流程有一个大概的认识，否则很容易分析到一半便开始失去思路。本篇只分析创建集群通信对的流程，具体的选举源码留到下篇再来分析。

本篇是对上一篇的补充，建议在看这次的源码分析时可以对照着上一篇的流程图来看，更容易跳出代码知道在流程中的作用，上一篇的链接：[（九）Zookeeper原理源码分析之FLE(FastLeaderElection)算法集群选举通信原理及流程结构](/zhuanlan/registered/zookeeper/1/9.html)。

**注：本篇基于ZK版本3.4.8分析的。**

## 2.源码分析

本次的源码分析步骤和以前不太一样，由于ZK集群选举时涉及三种角色：Leader、Follower和Observer，三种不同角色的源码流程是不一样的，因此本次源码将会以Leader和Follower两种角色的源码流程分析，从开始选举流程通用的流程开始，当各个机器有不同的流程时再分开依次分析，Observer由于不参与选举，因此本次源码分析忽略。

本次源码分析假设ZK集群有三台机器：

- A机器：myid=1，启动时间最早；
- B机器：myid=3，启动时间在A之后；
- C机器：myid=5，启动时间最后。

接下来将会以这三台机器为例开始逐步分析ZK的选举流程。

### 2.1 QuorumPeer对象发起投票

在看过前面有一篇的启动组价及流程可以知道，ZK集群内的每台机器都会有一个QuorumPeer集群对象，此对象是个线程对象，用来监听本机的状态：1、选举流程状态；2、确认角色后的数据同步流程状态，起到一个统筹兼顾的作用。关键源码如下：

```java
public class QuorumPeer extends ZooKeeperThread 
        implements QuorumStats.Provider {
    // 集群对象会含有三种不同的角色对象，如果机器在选举时被表明了是什么角色时
    // 对应的对象将会被初始化，代表着本机器的角色，执行相应的操作
    public Follower follower;
    public Leader leader;
    public Observer observer;
    // 代表着本机的当前投票
    volatile private Vote currentVote;
    // 本机的头一次投票
    volatile private Vote bcVote;
    @Override
    public void run() {
        // 源码中这里有个流程是用来注册JMX对象的，这里和选举流程无关因此忽略
        try {
            // 正式开始ZK集群执行流程，这里会有三种情况：
            // 1、如果在选举流程，peerState将一直会是LOOLING，直到集群选举出
            // Leader；2、当选出Leader后，本机器的peerState将会变成对应的状态
            // 直到Leader宕机不得不选举出新的Leader；3、每一次新的轮询都代表
            // 着本机的角色发生了改变，执行的作用也发生改变。
            while (running) {
                switch (getPeerState()) {
                // 代表本机正在进行选举流程
                case LOOKING:
                    // 本机是否开启只读模式，有兴趣的可以去看下，本次只分析
                    // 普通正常的流程
                    if (Boolean.getBoolean("readonlymode.enabled")) {
                        // 忽略
                        ...
                    } else {
                        try {
                            // 选举前先把之前的投票清空，以免对选举流程产生误导
                            setBCVote(null);
                            // 设置本次投票结果，lookForLeader()方法里面将会
                            // 一直轮询和集群内的机器进行通信，直到选举出新的
                            // Leader或者发生了异常情况
                            setCurrentVote(
                                    makeLEStrategy().lookForLeader());
                        } catch (Exception e) {
                            // 如果发生了异常情况则设置本机的状态为选举中
                            // 以便进入下一次选举流程
                            setPeerState(ServerState.LOOKING);
                        }
                    }
                    break;
                // 代表本机已经确认为Observer角色，正在集群内进行观察
                case OBSERVING:
                    // 选举流程中的Observer不起作用，因此这个流程暂不分析，等到
                    // 下一篇分析ZK集群的数据同步再来具体分析其作用
                    break;
                // 代表本机已经确认为Follower角色，正在跟随Leader
                case FOLLOWING:
                    try {
                        // 本机器的上一次轮询确定出了本机器为Follower角色
                        setFollower(makeFollower(logFactory));
                        // 开始执行Follower角色的工作：跟随Leader机器
                        follower.followLeader();
                    } finally {
                        // 当本次Follower跟随的集群发生了异常时将会改变本机的
                        // 角色，重新设置成LOOKING状态选举出新Leader
                        // 异常情况：1、Leader宕机，导致本集群不得不重新选举；
                        // 2、本集群内其它的Follower宕机超过半数导致Leader
                        // 投票数低于总数一半，进行重新选举。
                        // 如果是本机宕机程序直接死亡，不会进入到Finally块
                        follower.shutdown();
                        setFollower(null);
                        setPeerState(ServerState.LOOKING);
                    }
                    break;
                // 代表本机已经确认为Leader角色，正在领导集群内的各个机器
                case LEADING:
                    try {
                        // 本机器的上一次轮询确定出了本机器为Leader角色
                        setLeader(makeLeader(logFactory));
                        // 开始执行Leader角色的工作：作为集群中心发送同步命令
                        leader.lead();
                        // 退出了lead()方法说明集群的Leader发生了变化，需要
                        // 选举出新的Leader
                        setLeader(null);
                    }finally {
                        // 关闭当前Leader对象并设置状态LOOKING开始准备下一次
                        // 选举流程
                        if (leader != null) {
                            leader.shutdown("Forcing shutdown");
                            setLeader(null);
                        }
                        setPeerState(ServerState.LOOKING);
                    }
                    break;
                }
            }
        } finally {
            // 执行到这说明本机器的ZK服务被关闭，将会关闭机器的对象并退出
        }
    }
}
```

### 2.2 FastLeaderElection选举发送通知

无论是刚刚启动或者是上一代的Leader退位开始选举新的Leader，各个机器在开始选举流程时的状态都是LOOKING，都会执行FastLeaderElection选举对象的公共流程。接下来便分析一下这个对象的公共流程，关键源码如下：

```java
public class FastLeaderElection implements Election {
    // 本机器的集群对象
    QuorumPeer self;
    // 选举流程时的逻辑迭代数，每调用一次lookForLeader进行选举时该值会+1
    // 发送到其它机器上时对应Notification对象的electionEpoch属性
    volatile long logicalclock;
    // 本机推崇将要当选leader的myid，对应Notification对象的leader，可以看成是
    // 某个机器的id
    long proposedLeader;
    // 本机推崇将要当选leader的zxid，对应Notification对象的zxid
    long proposedZxid;
    // 本机推崇将要当选leader的epoch，对应Notification对象的peerEpoch
    long proposedEpoch;
    public Vote lookForLeader() throws InterruptedException {
        // 开始在集群内选举Leader，注册LeaderElection到JMX忽略
        if (self.start_fle == 0) {
           // 记录FLE算法的开始时间
           self.start_fle = System.currentTimeMillis();
        }
        try {
            // 本集合key为leaderId，value为对应id的投票信息，集合将会记录
            // 本次投票的各个机器投票情况
            HashMap<Long, Vote> recvset = new HashMap<Long, Vote>();
            // 新加入的机器用来记录集群内其它机器的投票情况
            HashMap<Long, Vote> outofelection = new HashMap<Long, Vote>();
            // 每次轮询其它机器发来消息的间隔时间，固定200毫秒执行一次
            int notTimeout = finalizeWait;
            synchronized(this){
                // 逻辑选举次数+1，代表本机器有一次执行了重新选举Leader的操作
                logicalclock++;
                // 投票前先把本机器的投票信息投给自己，getInitId()为本机器的
                // myid值，getInitLastLoggedZxid()为本机器的zxid值
                // getPeerEpoch()为本机器的currentEpoch值
                updateProposal(getInitId(), getInitLastLoggedZxid(), 
                        getPeerEpoch());
            }
            // 对集群内的各个机器发送消息通知，告诉他们我选举自己当选Leader
            // 此时各个机器的通信对已经创建完毕，因此可以将消息发送给集群内的
            // 各个机器，结果为A->B、A->C通知A当选Leader，B->A，B->C通知B当选
            // Leader，C->B、C->A通知C当选Leader，例子中的三台机器每台机器都
            // 会向集群内其它两台机器发送当选本机器为Leqader的消息通知，当然
            // 也会通知自己，但是通知自己不会经过网络通信
            sendNotifications();
            // 发完通知消息后开始轮询其它机器的消息
            while ((self.getPeerState() == ServerState.LOOKING) &&
                    (!stop)){
                // 轮询集合内是否有其它机器发来的消息，在本次三台机器的集群中，
                // recvqueue.poll()方法一定可以轮询出三个响应消息，其中一个
                // 消息通知为本系统在前面的sendNotifications()方法发出的，没
                // 经过网络通信，而是直接放在了本机的集合中等待处理
                Notification n = recvqueue.poll(notTimeout,
                        TimeUnit.MILLISECONDS);
                // 后续收到通知处理流程这里暂不分析，等分析完本机器发送完通知后
                // 再逐个分析
                ...
            }
        }
    }
    synchronized void updateProposal(long leader, long zxid, long epoch){
        // 更新本机器记录的Leader信息，投票前把这些信息改成本机器的，即先把票
        // 投给自己
        proposedLeader = leader;
        proposedZxid = zxid;
        proposedEpoch = epoch;
    }
    private void sendNotifications() {
        // 轮询配置文件中所配置的各个Server信息，并向每台机器发送通知
        for (QuorumServer server : self.getVotingView().values()) {
            long sid = server.id;
            // 将本机器的信息封装，并发给myid为sid的机器
            ToSend notmsg = new ToSend(ToSend.mType.notification,
                    proposedLeader,// 第一次发送此值为本机器的myid
                    proposedZxid,// 第一次发送此值为本机器的zxid
                    logicalclock,// 第一次发送此值为本机器的logicalclock
                    QuorumPeer.ServerState.LOOKING,// 本机器流程为LOOKING
                    sid,// 目标机器的myid
                    proposedEpoch);// 第一次发送此值为本机器的currentEpoch
            // 放入sendqueue集合中以便本选举对象的WorkerSender发送这些
            // 通知消息给其它的机器
            sendqueue.offer(notmsg);
        }
    }
}
```

### 2.3 WorkerSender选择机器并发送通知

前面已经说过了FLE对象将会把投票信息放入到sendqueue集合中，而这个集合便是FLE对象和WorkerSender对象的通信集合。接下来看下WorkerSender在拿到这些消息对象执行了什么操作：

```java
class WorkerSender extends ZooKeeperThread {
    // 集群连接管理对象，WorkerSender实际上是该对象的内部类
    QuorumCnxManager manager;
    // 将要使用通信对发送消息的消息存储队列集合，通信对发送消息时将会从该集合中
    // 取出消息对象并使用Socket通信发送给对应的机器
    LinkedBlockingQueue<ToSend> sendqueue;
    public void run() {
        // 启动通信对的发送信息对象后本方法将会被执行，直到该对象被调用finish()
        // 方法销毁
        while (!stop) {
            try {
                // 从消息队列集合中获取需要发送的消息对象，固定阻塞3s，如果
                // 没有轮询到则返回null
                ToSend m = sendqueue.poll(3000, TimeUnit.MILLISECONDS);
                // 如果为null说明暂时没有消息发送，继续轮回
                if(m == null) continue;
                // 如果不为空则说明有需要发送的消息，调用process发送消息对象
                process(m);
            } catch (InterruptedException e) {
                // 如果轮询集合发生异常则退出
                break;
            }
        }
    }
    void process(ToSend m) {
        // 将需要发送的消息转换成Socket方便发送的ByteBuffer缓存对象
        ByteBuffer requestBuffer = buildMsg(m.state.ordinal(), 
                                                m.leader,
                                                m.zxid, 
                                                m.electionEpoch, 
                                                m.peerEpoch);
        // 通知连接管理对象需要发送requestBuffer对象中的信息
        manager.toSend(m.sid, requestBuffer);
    }
    static ByteBuffer buildMsg(int state, long leader, long zxid,
        long electionEpoch, long epoch) {
        // 生成ByteBuffer对象并封装byte[]数组，这里需要特别说明下各个参数和
        // 在FLE中参数的对应关系
        byte requestBytes[] = new byte[40];
        ByteBuffer requestBuffer = ByteBuffer.wrap(requestBytes);
        requestBuffer.clear();
        // 对应PeerQuorum中的peerState，此时值为LOOKING
        requestBuffer.putInt(state);
        // 对应PeerQuorum中的proposedLeader，刚开始选举为本机器的myid
        requestBuffer.putLong(leader);
        // 对应PeerQuorum中的proposedZxid，刚开始选举为本机器的zxid
        requestBuffer.putLong(zxid);
        // 对应PeerQuorum中的logicclock，代表本次选举的迭代数
        requestBuffer.putLong(electionEpoch);
        // 对应PeerQuorum中的proposedEpoch，选举开始为本机器的currentEpoch
        requestBuffer.putLong(epoch);
        // 默认版本信息，接收到后会设置为接收消息的version属性
        requestBuffer.putInt(Notification.CURRENTVERSION);
        return requestBuffer;
    }
}
```

### 2.4 QuorumCnxManager连接机器并发送消息

在将需要发送的消息转换成Socket发送消息的对象ByteBuffer后，现在面临一个问题：那便是本机器还尚未和其它机器简历Socket长连接通信，而QuorumCnxManager的职责便是管理连接，它会帮我们解决这个问题。关键源码如下：

```java
public class QuorumCnxManager {
    // 每次发送消息的数量，固定是一，确保消息可以有序安全的发送出去
    static final int SEND_CAPACITY = 1;
    // QuorumCnxManager对象和外界对象进行交互消息交互的集合中介，往这个集合中
    // 放入数据说明一个问题：RecvWorker已经收到了其它机器的消息并处理转换完成
    public final ArrayBlockingQueue<Message> recvQueue;
    // 接收集合recvQueue的容量
    static final int RECV_CAPACITY = 100;
    // 将要发送给某个机器的ByteBuffer集合，key为发送机器的sid，value为单个消息
    // 元素的阻塞队列，确保每次只发送一条消息（ArrayBlockingQueue长度固定）
    final Map<Long, ArrayBlockingQueue<ByteBuffer>> queueSendMap;
    // 保存和集群内另一台机器通信对的集合，key为另一台机器的myid，value则是
    // 本机器与其通信的通信对
    final ConcurrentHashMap<Long, SendWorker> senderWorkerMap;
    public void toSend(Long sid, ByteBuffer b) {
        // 如果要发送的myid等于本机器的id，不用发送，直接放入recvQueue集合中
        // 需要注意的是recvQueue集合和前面在FLE对象中提到的recvqueue集合很像
        // 这里做个简单说明：recvQueue集合是和FLE中的WorkerReceiver进行交互的
        // recvqueue集合则是WorkerReceiver和真正的FLE对象交互的。交互对象需要
        // 搞清楚，要不然看源码的时候很容易迷糊
        if (self.getId() == sid) {
             b.position(0);
             // 直接添加到recvQueue集合中，相当于已经通过RecvWorker收到了消息
             // 但是由于是发给自己的，因此忽略了RecvWorker这一步
             addToRecvQueue(new Message(b.duplicate(), sid));
        } else {
            // 如果集合中还没有sid的阻塞队列，则进行创建并放入到集合中
             if (!queueSendMap.containsKey(sid)) {
                 ArrayBlockingQueue<ByteBuffer> bq = 
                         new ArrayBlockingQueue<ByteBuffer>(SEND_CAPACITY);
                 // 先将创建的阻塞队列放入到集合中
                 queueSendMap.put(sid, bq);
                 // 再将需要发送的ByteBuffer对象消息放入到阻塞队列中
                 addToSendQueue(bq, b);
             } else {
                 // 如果不为空则直接取出阻塞队列，再将ByteBuffer对象直接放入
                 ArrayBlockingQueue<ByteBuffer> bq = queueSendMap.get(sid);
                 if(bq != null){
                     addToSendQueue(bq, b);
                 }
             }
             // 真正开始根据sid去和对应的机器创建Socket长通信
             connectOne(sid);
        }
    }
    public void addToRecvQueue(Message msg) {
        synchronized(recvQLock) {
            if (recvQueue.remainingCapacity() == 0) {
                try {
                    // 如果可用容量已经为0，则将最开始放进去的消息删除
                    recvQueue.remove();
                }// 异常忽略...
            }
            try {
                // 将最新需要发送的消息添加到集合中
                recvQueue.add(msg);
            }// 异常忽略...
        }
    }
    synchronized void connectOne(long sid){
        // 如果和一台机器的myid为sid没有创建过通信对则准备创建
        if (senderWorkerMap.get(sid) == null){
            InetSocketAddress electionAddr;
            // 通过配置的集群机器获取对应的连接地址
            if (self.quorumPeers.containsKey(sid)) {
                electionAddr = self.quorumPeers.get(sid).electionAddr;
            } else {
                return;
            }
            try {
                // 创建Socket对象，并设置失效时间为tickTime*syncLimit
                Socket sock = new Socket();
                // 在这个方法中设置timeout
                setSockOpts(sock);
                // 连接另外一台参与选举的机器，并且设置连接时间为5s
                sock.connect(self.getView().get(sid).electionAddr, 5000);
                // 开始基于Socket对象连接创建通信对
                initiateConnection(sock, sid);
            } // 异常情况只是重新选择需要连接的机器地址，忽略
            ...
        }
    }
    public boolean initiateConnection(Socket sock, Long sid) {
        DataOutputStream dout = null;
        try {
            // 连接上另一台myid为sid的机器后立马向其发送本机器的myid
            dout = new DataOutputStream(sock.getOutputStream());
            dout.writeLong(self.getId());
            dout.flush();
        } catch (IOException e) {
            // 异常情况则关闭Socket通信，一般不会发生
            closeSocket(sock);
            return false;
        }
        // 这里是创建集群内通信结构的关键点之一，即在上一篇中写过的complete事件
        // 在本次分析源码的假设三台机器A、B、C中，A的sid最小为1，B的sid居中为3
        // C的sid最大为5，因此在各个机器中，A将会由于sid小于其它的机器而无法主动
        // 建立通信对，B只能主动对A建立通信对，而C可以主动向B和A建立通信对。A和B
        // 的被动连接将会在后续分析Listener类中讲解。
        // 简而言之，sid大的->sid小的=大的建立通信对，sid小的->sid大的=关闭连接
        if (sid > self.getId()) {
            // 当A->B、A->C和B->C这三种情况时会进入到这里面主动关闭本Socket
            // 解释：sid小的主动连接sid大的会主动关闭Socket连接。显示场景为：
            // B和C机器都已经启动了，而A是最后启动的，此时A机器执行到了这里，
            // A机器会主动的关闭连接
            closeSocket(sock);
        } else {
            // 当C->A、C->B和B->A这三种情况时会进入到这里面主动创建通信对
            // 解释：sid大的主动连接sid小的将会在本机器中主动创建通信对
            // 根据传入的Socket对象创建通信对，需要注意的是通信对里面的sid是
            // 需要进行通信的机器sid，而不是本机器的
            // 现实场景为：A和B机器已经创建了，C最后启动的，此时C机器由于sid比
            // A和B要大，因此会执行到这里，主动创建和A、B的通信对
            SendWorker sw = new SendWorker(sock, sid);
            RecvWorker rw = new RecvWorker(sock, sid, sw);
            sw.setRecv(rw);
            // 获取以前选举通信时可能存在的通信对对象
            SendWorker vsw = senderWorkerMap.get(sid);
            // 如果原来senderWorkerMap中有了sid对应的通信对，则拿出来主动销毁
            // 因为通信对都是线程对象，可能存在以前选举时残留的数据，需要主动的
            // 清空并关闭Socket连接，重新使用新的通信对对象
            if(vsw != null)
                vsw.finish();
            // 以sid为key，通信对为value放入到senderWorkerMap集合中
            senderWorkerMap.put(sid, sw);
            // 如果消息发送集合中没有key为sid的阻塞队列则先创建放入集合中
            // 再做一次确认，但在刚刚的流程中queueSendMap肯定已经被初始化并
            // 放入了需要发送的数据的
            if (!queueSendMap.containsKey(sid)) {
                queueSendMap.put(sid, new ArrayBlockingQueue<ByteBuffer>(
                        SEND_CAPACITY));
            }
            // 启动发送消息线程对象，开始监听queueSendMap对象的阻塞队列
            sw.start();
            // 启动接收消息线程对象，用来接收对应机器发送来的消息
            rw.start();
            return true;    
        }
        return false;
    }
}
```

经过了这个流程，在三台机器中的通信对情况如下图：

### 2.5 Listener监听Socket连接

在上面的四个流程中，经过在QuorumCnxManager对象建立连接后sid大的机器已经主动创建完了通信对，形成了上面图示的通信对情况，接下来要分析的是sid小的机器被动创建通信对的流程。关键源码如下：

```java
public class Listener extends ZooKeeperThread {
    // 使用配置的electionPort端口+本机的地址创建的服务Socket，用来被动的和其它
    // 机器进行交互（与其说被动的不如说给sid小的机器主动通信的机会）
    volatile ServerSocket ss = null;
    // 用负数来记录观察者的数量，并为其赋值负值来标明唯一性
    private long observerCounter = -1;
    // 保存和集群内另一台机器通信对的集合，key为另一台机器的myid，value则是
    // 本机器与其通信的通信对
    final ConcurrentHashMap<Long, SendWorker> senderWorkerMap;
    // 将要发送给某个机器的ByteBuffer集合，key为发送机器的sid，value为单个消息
    // 元素的阻塞队列，确保每次只发送一条消息（ArrayBlockingQueue长度固定）
    final Map<Long, ArrayBlockingQueue<ByteBuffer>> queueSendMap;
    @Override
    public void run() {
        int numRetries = 0;
        InetSocketAddress addr;
        // IO失败可重试三次
        while((!shutdown) && (numRetries < 3)){
            try {
                // 创建服务Socket对象
                ss = new ServerSocket();
                ss.setReuseAddress(true);
                // 获取本机器在配置中所配置的端口或者地址
                if (self.getQuorumListenOnAllIPs()) {
                    int port = self.quorumPeers.get(self.getId()).
                            electionAddr.getPort();
                    addr = new InetSocketAddress(port);
                } else {
                    addr = self.quorumPeers.get(self.getId())
                            .electionAddr;
                }
                // 设置本listener的地址名称
                setName(self.quorumPeers.get(self.getId()).electionAddr
                        .toString());
                // 将服务Socket对象绑定该地址
                ss.bind(addr);
                while (!shutdown) {
                    // 开始接收其它机器发送过来的连接请求，sid大的或者sid小的
                    // 都会发送连接请求，在前面分析过，sid小的对sid大的机器发
                    // 送连接之后会主动关闭连接，其对sid大的机器创建通信对的操
                    // 作便是放在这个流程中
                    Socket client = ss.accept();
                    // 设置timeout时间为tickTime*syncLimit
                    setSockOpts(client);
                    // 接收到其它机器的请求后开始处理
                    receiveConnection(client);
                    // 重试次数重置为0
                    numRetries = 0;
                }
            }// 异常捕获忽略
            ...
        }
    }
    public void receiveConnection(Socket sock) {
        // 从名字也可以看出来这个方法就是用来接收Socket连接并处理的
        // 和刚刚分析过的initiateConnection方法作用类似，只是
        // initiateConnection方法是让sid大的主动创建通信对，而这个方法
        // 则是让sid小的被动创建通信对
        Long sid = null;
        try {
            // 在上面的initiateConnection方法中说了，在判断sid的大小值并处理
            // 之前，连上Socket的第一件事便是把本机器的myid发送出去。举个例子：
            // A->C，由于A的sid比C的小，因此A不会主动创建和C的通信对，但连接
            // 之后A会立马把自己的myid发送给C，而C->A时C也会主动的把自己的myid
            // 发送给A，从而各自触发Listener监听
            DataInputStream din = new DataInputStream(sock
                    .getInputStream());
            // 读取其它机器发送过来的myid
            sid = din.readLong();
            // 第一次接收的sid可能是version版本号
            if (sid < 0) {
                // 如果是版本号则再次读取sid
                sid = din.readLong();
                // 判断是否有剩余的数组需要读取
                int num_remaining_bytes = din.readInt();
                // 如果接下来的数据长度为负数或者大于了最大缓存值2048字节
                // 则说明有问题，需要关闭连接（值如果是0也是OK的）
                if (num_remaining_bytes < 0 || 
                        num_remaining_bytes > maxBuffer) {
                    closeSocket(sock);
                    return;
                }
                // 将读取到的长度实例化一个数组并将剩余的读取完
                byte[] b = new byte[num_remaining_bytes];
                int num_read = din.read(b);
            }
            // 如果这个sid等于观察者的id，则将其赋值为observerCounter，每次
            // 有新的观察者，observerCounter都会减一，保持sid的特殊性以及
            // 观察者sid的唯一性
            if (sid == QuorumPeer.OBSERVER_ID) {
                sid = observerCounter--;
            }
        } catch (IOException e) {
            closeSocket(sock);
            return;
        }
        // 看到这里又是熟悉的感觉，在initiateConnection方法中也有类似的场景
        // 但是需要注意的是initiateConnection方法第一个if判断语句条件是
        // “sid > self.getId()”，和本方法中的if判断相反，原因就是本方法实际上
        // 就是initiateConnection方法的被动实现。
        // 依然是A、B、C三台机器，我们已经确认了经过在initiateConnection方法中
        // 执行完后的逻辑，C将会有B和A的通信对，而B将会有A的通信对，所有sid大的
        // 机器都会有sid小的机器通信对，但是小的sid机器没有大的sid机器通信对。
        // 以上述情况是根本无法做到集群内的机器互相通信的，因此需要本方法来补充
        // 下面的逻辑大致为：sid小的可以在本机被动的创建和sid大的机器通信对；而
        // sid大的机器接收到sid小的机器连接请求后，如果本机器没有sid小的机器的
        // 通信对，则会关闭本次的Socket对象并在本机建立和sid小的机器的通信对。
        if (sid < self.getId()) {
            // 进入到这里的情况是A->B、A->C、B->C，即sid小的机器向sid大的机器
            // 发送请求连接，现实场景可以理解成A机器在C机器后面启动，A机器在启
            // 动的时候向C机器发送连接请求，但由于C没启动，无法达到，因此作废。
            // 而等到A机器启动时就会向C机器发送请求，此时C机器在监听到了A的请求
            // 后便会遍执行到了这里
            // 从本机器的senderWorkerMap集合取出可能存在的通信对
            SendWorker sw = senderWorkerMap.get(sid);
            // 如果原来存在的将原来的通信对销毁释放
            if (sw != null) {
                // 销毁通信对
                sw.finish();
            }
            // 关闭A或者B机器（即sid小的机器）的连接请求Socket对象
            closeSocket(sock);
            // 调用已经分析过的connectOne方法，开始在本机器上再次主动创建
            // 和A、B机器的通信对（即sid小的机器）
            connectOne(sid);
        } else {
            // 进入到这里的情况是C->A、C->B、B->A，即sid大的机器向sid小的机器
            // 发送连接请求，此时sid小的机器监听后将会执行到这里开始在本机器中
            // 被动的创建和sid大的机器的通信对
            // 显示场景为：A和B机器已经启动了，但是C机器最后启动的，此时C机器
            // 会向A和B机器发送连接请求，A和B机器由于sid小于C机器，因此监听到
            // 连接请求后会执行到这里被动的创建和C机器的通信对
            // 使用sid大的机器信息和Socket通信对象创建通信对
            SendWorker sw = new SendWorker(sock, sid);
            RecvWorker rw = new RecvWorker(sock, sid, sw);
            sw.setRecv(rw);
            // 如果本机器原来有sid对应机器的通信对则销毁
            SendWorker vsw = senderWorkerMap.get(sid);
            if(vsw != null) {
                // 调用销毁方法
                vsw.finish();
            }
            // 将新的通信对放入到senderWorkerMap集合中以便通信对可以监听
            // 集合的消息变化
            senderWorkerMap.put(sid, sw);
            // 如果保存要发送消息集合不包含新请求进来的sid对应机器则创建
            if (!queueSendMap.containsKey(sid)) {
                queueSendMap.put(sid, new ArrayBlockingQueue<ByteBuffer>(
                        SEND_CAPACITY));
            }
            // 启动通信对发送消息线程对象，开始监听queueSendMap集合发送消息
            sw.start();
            // 启动通信对接收消息线程对象，开始监听其它机器的Socket消息并接收
            rw.start();
            return;
        }
    }
}
```

至此，集群内的各个机器通信对建立情况如下图：

经过这些流程，三台机器已经建立了和集群内每台机器的通信对，已经可以互相发送接收选举消息了，接下来便开始分析选举流程。
