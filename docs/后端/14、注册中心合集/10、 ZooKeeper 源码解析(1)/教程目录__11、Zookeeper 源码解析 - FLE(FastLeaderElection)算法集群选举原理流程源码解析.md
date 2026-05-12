# 11、Zookeeper 源码解析 - FLE(FastLeaderElection)算法集群选举原理流程源码解析
- 来源：https://ddkk.com/zhuanlan/registered/zookeeper/1/11.html
- 分类：注册中心
- 分组：教程目录
## 1.前话

前面一篇已经分析过了FLE算法各个机器间创建通信结构的流程源码，即分析原理流程的时候各个机器是可以正常的发送及接收消息的，建议在观看选举原理流程源码的时候可以了解ZK集群的FLE选举原理流程，不清楚的可以调至本篇观看了解：[（九）Zookeeper原理源码分析之FLE(FastLeaderElection)算法集群选举通信原理及流程结构](/zhuanlan/registered/zookeeper/1/9.html)。

本篇将会基于源码来分析各个机器的选举状态及选举通信，依旧使用上篇的三台机器信息，且机器间的通信对是完成整可用的，机器信息如下：

- A机器：myid=1，启动时间最早；
- B机器：myid=3，启动时间在A之后；
- C机器：myid=5，启动时间最后。

且各个机器完整的通信对如下：

接下来便开始源码的选举原理流程分析。

## 2.源码分析

### 2.1 FastLeaderElection选举发送通知

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
    // 将要使用通信对发送消息的消息存储队列集合，通信对发送消息时将会从该集合中
    // 取出消息对象并使用Socket通信发送给对应的机器
    LinkedBlockingQueue<ToSend> sendqueue;
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
            sendNotifications();
            // 发完通知消息后开始轮询其它机器的消息
            while ((self.getPeerState() == ServerState.LOOKING) &&
                    (!stop)){
                // 轮询集合内是否有其它机器发来的消息
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

### 2.2 通信对的SendWorker对象监听集合并发送消息

在上一篇我们已经了解了每台机器都会有集群内各个机器的通信对，而SendWorker便是负责监听集合来发送消息的线程对象，以机器A为例，在开始选举前会向集群内的其它机器（即B和C）发送我选择我自己当选Leader的消息通知，因此此时A的待发送消息队列queueSendMap集合里面一定会有发送给B和C的消息，SendWorker启动后将会发送这些消息。B和C机器一样，关键源码如下：

```java
class WorkerSender extends ZooKeeperThread {
   // 本个通信对的发送线程对象需要对接通信的机器sid（即对应机器的myid）
   Long sid;
   // 本个通信对的发送线程对象和需要通信机器建立的Socket长连接
    Socket sock;
    // 本通信对的发送消息线程对象对应的接收消息线程对象
    RecvWorker recvWorker;
    // 运行状态
    volatile boolean running = true;
    // 使用Socket对象的outputStream对象流创建的数据输出流对象，负责实际的通信
    DataOutputStream dout;
    // 将要发送给某个机器的ByteBuffer集合，key为发送机器的sid，value为单个消息
    // 元素的阻塞队列，确保每次只发送一条消息（ArrayBlockingQueue长度固定）
    final Map<Long, ArrayBlockingQueue<ByteBuffer>> queueSendMap;
    // 记录当前的连接管理对象中有多少个线程正在运行，即选择通信对的
    // SendWorker和RecvWorker
    private AtomicInteger threadCnt = new AtomicInteger(0);
    // 保存给sid机器的最后发送消息，key为目标机器的sid，value则是具体的发送消息
    final ConcurrentHashMap<Long, ByteBuffer> lastMessageSent;
    public void run() {
        // 有一个线程已经执行，线程数量+1
        threadCnt.incrementAndGet();
        try {
            // 刚启动的时候便去queueSendMap集合中查询是否有本通信对的发送目标
            // 机器消息
            ArrayBlockingQueue<ByteBuffer> bq = queueSendMap.get(sid);
            // 如果没有消息需要发送给目标机器则获取最后一次发送给这个机器的消息
            // 并发送给目标机器
            if (bq == null || isSendQueueEmpty(bq)) {
               // 获取最后发送给目标机器的消息
               ByteBuffer b = lastMessageSent.get(sid);
               // 如果以前发送过消息则调用send()方法发送消息
               if (b != null) {
                   // 发送消息，具体方法后面再分析
                   send(b);
               }
            }
        } catch (IOException e) {
            // 发生了意外则销毁本通信对
            this.finish();
        }
        try {
            while (running && !shutdown && sock != null) {
                ByteBuffer b = null;
                try {
                    // 查询queueSendMap集合中是否有本通信对的发送目标机器消息
                    ArrayBlockingQueue<ByteBuffer> bq = queueSendMap
                            .get(sid);
                    // 如果目标机器的阻塞队列不为空则从阻塞队列中获取需要发送的
                    // 消息
                    if (bq != null) {
                        // 如果队列不为空则从阻塞队列中获取数据
                        b = pollSendQueue(bq, 1000, TimeUnit.MILLISECONDS);
                    } else {
                        // 如果阻塞队列为空说明初始化有异常，阻塞队列在实例化
                        // 线程对象时就已经被创建，且容量只有1
                        break;
                    }
                    // 从消息阻塞队列中获取到了消息且不为空则进行发送操作，为空
                    // 则继续下一次轮询查询阻塞队列是否有需要发送的消息
                    if(b != null){
                        // 发送前记录给目标机器发送的最后一次消息对象，以方便
                        // 下次和目标机器通信时的通信对可以继续上次的消息开始
                        // 发送，确保消息的连续性。不用担心如果目标机器接收到
                        // 相同的消息会怎么办，接收方就算接收到了相同的消息
                        // 也不会对结果有什么影响
                        lastMessageSent.put(sid, b);
                        // 调用方法方法去发送消息对象
                        send(b);
                    }
                }// 异常忽略...
            }
        }// 异常忽略...
        // 运行完成说明该通信对已经需要退出，调用销毁方法
        this.finish();
    }
    synchronized void send(ByteBuffer b) throws IOException {
        // 为需要发送的字节数组创建新的等长度数组以方便后续进行消息校验
        byte[] msgBytes = new byte[b.capacity()];
        try {
            // 将需要发送的消息数组位置归位，以确保可以校验整个数组
            b.position(0);
            // 调用get方法有两个目的：1、检查数组数据边界是否正常；
            // 2、检查缓存对象中的数据是否超出缓存初始化的大小，如果超出抛异常
            b.get(msgBytes);
        } catch (BufferUnderflowException be) {
            // 如果缓存数据超出缓存对象的申请大小则说明内存溢出，无法进行正常操作
            return;
        }
        // 校验通过发送缓存对象中的数据，首先发送数据大小，其次再发送整体数据
        dout.writeInt(b.capacity());
        dout.write(b.array());
        dout.flush();
    }
}
```

假设上述分析通信对的SendWorker发送线程对象为机器A的，其内部保存的sid为机器C的，即机器A的SendWorker发送通信消息给目标机器C，而机器C的通信对接收消息线程对象RecvWorker将会收到此消息并进行处理。

### 2.3 通信对的RecvWorker对象接收消息

接着刚刚的假设逻辑走，现在A机器已经发送了消息，轮到了机器C的RecvWorker接收消息并进行相应的逻辑处理了。关键源码如下：

```java
class RecvWorker extends ZooKeeperThread {
    // 本个通信对的发送线程对象需要对接通信的机器sid（即对应机器的myid）
   Long sid;
   // 本个通信对的发送线程对象和需要通信机器建立的Socket长连接
    Socket sock;
    // 本通信对的发送消息线程对象对应的接收消息线程对象，该对象仅在需要销毁
    // 本线程对象时用到finish()方法
    final SendWorker sw;
    // 运行状态
    volatile boolean running = true;
    // 使用Socket对象的outputStream对象流创建的数据输入流对象，负责实际的接收
    // 消息通信
    DataInputStreamd din;
    // 接收目标机器发送过来的数据最大长度，最大长度为500K
    static final int PACKETMAXSIZE = 1024 * 512; 
    @Override
    public void run() {
        // 有一个线程已经执行，线程数量+1
        threadCnt.incrementAndGet();
        try {
            // 开始轮询din对象接收sid目标机器的消息
            while (running && !shutdown && sock != null) {
                // 接收消息需要和发送方一样，发送方在发送消息时第一步便把
                // 消息的长度发送了过来，因此接收也是首先接收数据长度
                int length = din.readInt();
                // 如果数据长度不符合则会抛出异常退出，因此发送方才会进行必要的
                // 校验，因为接收方接收到不符合规范的之后将会关闭连接通信
                if (length <= 0 || length > PACKETMAXSIZE) {
                    throw new IOException();
                }
                // 从目标机器的通信Socket对象接收完整的数据
                byte[] msgArray = new byte[length];
                din.readFully(msgArray, 0, length);
                // 封装生成对应的缓存对象ByteBuffer
                ByteBuffer message = ByteBuffer.wrap(msgArray);
                // 将接收到的数据添加到recvQueue集合中，recvQueue集合为
                // QuorumCnxManager对象和FLE选举算法对象进行消息交互的集合
                addToRecvQueue(new Message(message.duplicate(), sid));
            }
        } finally {
            // 抛出了IO异常之后销毁本通信对并关闭Socket连接对象
            sw.finish();
            if (sock != null) {
                // 关闭Socket连接对象
                closeSocket(sock);
            }
        }
    }
    public void addToRecvQueue(Message msg) {
        // 为操作recvQueue集合上锁，防止等下删除最早的消息后被别的线程乘机
        // 插入别的消息，保证消息接收的顺序性
        synchronized(recvQLock) {
            if (recvQueue.remainingCapacity() == 0) {
                try {
                    // 如果100条消息缓存已经满了则删除最早添加的消息
                    recvQueue.remove();
                }// 异常忽略...
            }
            try {
                // 将新的消息添加到接收集合中
                recvQueue.add(msg);
            }// 异常忽略...
        }
    }
}
```

到此时两个机器间的通信对已经完成了信息交互，机器A已经把需要发送的消息发给了机器C，当然其它的机器间要进行信息交互流程和这个例子也是一样的。

### 2.4 WorkerReceiver处理通信对接收到的消息

在前面的文章分析过，FLE选举算法对象和QuorumCnxManager连接管理对象之间的消息通信是通过集合来通信的，而对集合进行操作的线程对象则是WorkerReceiver，其为FLE对象的内部类。关键源码如下：

```java
class WorkerReceiver extends ZooKeeperThread {
    // 运行状态
    volatile boolean stop;
    // 与其进行交互的集群连接管理对象
    QuorumCnxManager manager;
    // 将要使用通信对发送消息的消息存储队列集合，通信对发送消息时将会从该集合中
    // 取出消息对象并使用Socket通信发送给对应的机器
    LinkedBlockingQueue<ToSend> sendqueue;
    // WorkerReceiver线程对象和实际的FLE选举算法对象进行通信的集合，也就是说
    // FLE对象需要和QuorumCnxManager对象进行交互中间需要经过两次集合传递
    // 即：QuorumCnxManager->recvQueue->WorkerReceiver->recvqueue->FLE
    LinkedBlockingQueue<Notification> recvqueue;
    public void run() {
        Message response;
        while (!stop) {
            try{
                // 从连接管理对象的recvQueue集合中取出通信对RecvWorker对象
                // 接收并放入的消息对象
                response = manager.pollRecvQueue(3000, 
                        TimeUnit.MILLISECONDS);
                // 如果经过了3s还是没查询到消息对象则继续下次轮询
                if(response == null) continue;
                // 如果本机器配置的参与选举机器sid不包含刚接收机器的sid则认为
                // 该机器只能是follower或者observer，Leader只会在本集群中
                // 最早一批的机器中产生
                if(!self.getVotingView().containsKey(response.sid)){
                    // 取出本机器当前Leader的信息并转换成待发送的消息对象
                    Vote current = self.getCurrentVote();
                    ToSend notmsg = new ToSend(ToSend.mType.notification,
                            current.getId(),
                            current.getZxid(),
                            logicalclock,
                            self.getPeerState(),
                            response.sid,
                            current.getPeerEpoch());
                    // 立即向发送给本机器的sid机器回消息，通知其本集群中的
                    // Leader信息，如果收到消息的机器是参与选举的则会直接变成
                    // Follower，如果是Observer也会直接变成Observer
                    sendqueue.offer(notmsg);
                } else {
                    // 如果接收到的消息小于28长度，说明可能是简单的响应或者
                    // 不能影响到实际选举流程的消息，退出本次轮询开始下次
                    if (response.buffer.capacity() < 28) {
                        continue;
                    }
                    // 用来兼容某些消息未发送sid机器的peerEpoch值
                    boolean backCompatibility = 
                            (response.buffer.capacity() == 28);
                    // 让response的位置属性变成初始化状态（但数据并未删除）
                    response.buffer.clear();
                    // 创建通知对象
                    Notification n = new Notification();
                    // 默认状态为LOOKING，这样即使消息异常也不会造成实际的影响
                    QuorumPeer.ServerState ackstate = 
                            QuorumPeer.ServerState.LOOKING;
                    // 从接收到的消息中取出发送消息机器的状态并在后续进行
                    // 相应的赋值buffer中的值信息可以在上一篇的WorkerSender
                    // 线程对象buildMsg()方法分析中对应上，当然也可以不用管
                    // 只需要知道这种获取顺序是可以准确的拿到发送消息数据即可
                    switch (response.buffer.getInt()) {
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
                    // 从消息对象中分别获取对应的数据，需要注意的是这些数据
                    // 并不是sid机器的，而是sid机器认为是Leader机器的
                    // 打个比方：A机器现在接收到B机器发送过来的消息，B机器认为
                    // C机器是集群的Leadere，机器A接收到的response的值便是C
                    // 机器的而不是B机器的
                    n.leader = response.buffer.getLong();
                    n.zxid = response.buffer.getLong();
                    n.electionEpoch = response.buffer.getLong();
                    n.state = ackstate;
                    n.sid = response.sid;
                    // 如果消息长度不为28说明显式的把peerEpoch值传了过来
                    // 否则需要从发送过来的zxid中获取对应的peerEpoch值
                    if(!backCompatibility){
                        n.peerEpoch = response.buffer.getLong();
                    } else {
                        n.peerEpoch = ZxidUtils.getEpochFromZxid(n.zxid);
                    }
                    // 获取版本信息，3.4.6新增的
                    n.version = (response.buffer.remaining() >= 4) ? 
                                 response.buffer.getInt() : 0x0;
                    // 如果接收到的消息状态为LOOKING选举状态，则说明发送消息
                    // 的机器处于选举状态，启动时基本所有参与选举的机器都会
                    // 进入到这个判断中，算是选举状态的普遍性条件
                    if(self.getPeerState() == 
                            QuorumPeer.ServerState.LOOKING){
                        // 接收到消息后将其添加到recvqueue集合中，该集合就是
                        // 本对象和FLE选举对象交互的集合
                        recvqueue.offer(n);
                        // 这个条件判断是为了中途退出了集群后来又连接上来的
                        // 机器消息使用，消息通知的electionEpoch属性就是
                        // 机器sid上的logicalclock，因此这个条件可以理解成：
                        // 如果发送消息机器的logicalclock选举轮次要比本集群
                        // 中的选举轮次要低，则直接把本机器认为的可能是Leader
                        // 的机器信息发送给机器sid，让其跟着本集群选举走
                        if((ackstate == QuorumPeer.ServerState.LOOKING)
                                && (n.electionEpoch < logicalclock)){
                            // 获取当前机器认为的Leader机器信息
                            Vote v = getVote();
                            // 转化化成待发送消息对象
                            ToSend notmsg = new ToSend(
                                    ToSend.mType.notification,
                                    v.getId(),
                                    v.getZxid(),
                                    logicalclock,
                                    self.getPeerState(),
                                    response.sid,
                                    v.getPeerEpoch());
                            // 放入sendqueue集合中以便通信对的发送对象获取
                            sendqueue.offer(notmsg);
                        }
                    } else {
                        // 进入到这里说明本集群已经产生了Leader，而接受到的
                        // 选举消息大概率是原来在集群中，但是由于网络或者其它
                        // 原因导致中途退出了，而现在中途再次加入到集群中
                        // 先获取本集群的Leader投票信息
                        Vote current = self.getCurrentVote();
                        // 如果发送消息过来的机器处于选举状态，即原来的投票
                        // 信息已经失效，需要再次投票以加入到本集群中来
                        if(ackstate == QuorumPeer.ServerState.LOOKING){
                            ToSend notmsg;
                            // 版本处于3.4.6以上且通信正常的机器发过来的版本
                            // 信息都是0x1，如果是0x0只能说明发送消息过来的
                            // 机器版本低于3.4.6
                            if(n.version > 0x0) {
                                // 版本兼容的机器，直接使用本集群内的Leader
                                // 信息封装成待发送消息
                                notmsg = new ToSend(
                                        ToSend.mType.notification,
                                        current.getId(),
                                        current.getZxid(),
                                        current.getElectionEpoch(),
                                        self.getPeerState(),
                                        response.sid,
                                        current.getPeerEpoch());
                            } else {
                                // 如果版本不兼容则使用上一次的集群投票信息
                                // 封装成待发送消息对象
                                Vote bcVote = self.getBCVote();
                                notmsg = new ToSend(
                                        ToSend.mType.notification,
                                        bcVote.getId(),
                                        bcVote.getZxid(),
                                        bcVote.getElectionEpoch(),
                                        self.getPeerState(),
                                        response.sid,
                                        bcVote.getPeerEpoch());
                            }
                            // 添加到待发送集合中以便SendWorker通信对发送
                            sendqueue.offer(notmsg);
                        }
                    }
                }
            }// 异常忽略...
        }
    }
}
```

总和看下来这个线程对象只是帮忙在FLE选举对象和QuorumCnxManager对象中间做了一层简单的过滤，过滤事件如下：

**1、** 如果新加入的机器未在本机器的选举集群中，则直接把本机器当前的投票信息封装返回；

**2、** 如新加入的机器参与了本机器的集群选举，则获取消息的具体内容，并进行如下判断：；

**1、** 如果本机器正在进行选举则先将消息通知添加到recvqueue集合以便FLE处理，如果发送消息过来的机器也是选举状态且选举迭代比本机器小，则直接把本机器的当前投票信息封装返回；

**2、** 如果本机器参与的集群选举已经选出了Leader和Follower，且发送消息过来的机器还处于选举（即新加入的机器），则判断版本号，3.4.6及以上的返回当前投票信息，以下的则返回上一次的投票信息；

### 2.5 FastLeaderElection对象处理集群响应消息

在上一篇我们分析过FLE对象，在调用lookForLeader()方法时会给所有的机器发送一个选举为自己当选Leader的通知，本次分析选举流程便从这个地方开始。关键源码如下：

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
        try {
            // 本集合key为leaderId，value为对应id的投票信息，集合将会记录
            // 本次投票的各个机器投票情况
            HashMap<Long, Vote> recvset = new HashMap<Long, Vote>();
            // 新加入的机器用来记录集群内其它机器的投票情况
            HashMap<Long, Vote> outofelection = new HashMap<Long, Vote>();
            // 循环前的代码便不做分析，前面分析过了，这里续着前面断开的部分来
            // 分析收到响应消息所进行的处理
            while ((self.getPeerState() == ServerState.LOOKING) &&
                    (!stop)){
                // 刚刚通过QuorumCnxManager->recvQueue->WorkerReceiver
                // ->recvqueue->FLE这条链路后的消息都会存在recvqueue这个
                // 集合内，并在这个轮询中被获取
                Notification n = recvqueue.poll(notTimeout,
                        TimeUnit.MILLISECONDS);
                // poll执行时间超过了200毫秒，阻塞轮询返回结果为空，
                if(n == null){
                    // haveDelivered()方法会判断保存通信对的集合queueSendMap
                    // 存活的通信对是否已经为0
                    if(manager.haveDelivered()){
                        // 如果为0说明需要从新向集群内的每台机器
                        // 创建通信对连接以及发送选举消息
                        sendNotifications();
                    } else {
                        // 如果还存在活着的通信对，则尝试连接所有的机器
                        manager.connectAll();
                    }
                    // 使下次轮询的等待时间翻倍
                    int tmpTimeOut = notTimeout*2;
                    // 轮询等待时间再怎么翻倍也不能超过60000，最多为60s
                    notTimeout = (tmpTimeOut < 60000? tmpTimeOut : 60000);
                }
                else if(self.getVotingView().containsKey(n.sid)) {
                    // 判断收到消息的状态，如LOOKING、Leading、Following等
                    switch (n.state) {
                    case LOOKING:
                        // 收到的消息状态为选举中
                        // 如果发送过来的消息选举迭代次数大于本机的选举迭代次数
                        // 则说明开始需要同步迭代次数并回到正常选举流程
                        if (n.electionEpoch > logicalclock) {
                            // 将消息的选举迭代赋值给本机器的，保证集群内的各个
                            // 机器选举迭代次数一致
                            logicalclock = n.electionEpoch;
                            // 清空本机器接收到的各个机器投票情况集合
                            recvset.clear();
                            // 判断发送投票消息的机器与本机器的投票信息
                            // 判断规则逻辑在第九篇已经说过了假设消息是机器B
                            // 发给机器C的，可以判断出C胜出，因为C的myid大
                            // 因此发送过来的消息对象判断失败
                            // totalOrderPredicate()具体判断规则在最后会
                            // 贴出来
                            if(totalOrderPredicate(n.leader, n.zxid, 
                                    n.peerEpoch, getInitId(), 
                                    getInitLastLoggedZxid(), 
                                    getPeerEpoch())) {
                                // 如果发送过来的消息机器投票信息判断成功
                                // 则把本机的投票信息改成消息的投票信息
                                updateProposal(n.leader, n.zxid, 
                                            n.peerEpoch);
                            } else {
                                // 如果本机器胜出，则把投票信息改成本机的
                                updateProposal(getInitId(),
                                        getInitLastLoggedZxid(),
                                        getPeerEpoch());
                            }
                            // 向集群内的各个机器发送本机器的投票信息
                            sendNotifications();
                        } else if (n.electionEpoch < logicalclock) {
                            // 如果是通过WorkerReceiver对象发送进来的这种
                            // 情况在WorkerReceiver接收到时就已经处理过了
                            break;
                        } else if (totalOrderPredicate(n.leader, n.zxid, 
                                n.peerEpoch, proposedLeader, proposedZxid, 
                                proposedEpoch)) {
                            // 最后一种情况就是n.electionEpoch==logicalclock
                            // 此时说明集群内正在进行正常的选举，一切以正常的
                            // 规则来判断，以经常举例的A、B、C三台机器来说，
                            // 如果是第一次投票，一定会选举机器C来当选Leader
                            // 因此如果是A、B、C这种情况本机器将会把Leader信息
                            // 改成机器C的信息
                            updateProposal(n.leader, n.zxid, n.peerEpoch);
                            // 向集群内的其它机器发送本机器投票信息
                            sendNotifications();
                        }
                        // 在本机器记录sid对应的机器投票情况，比如最终A和B肯定
                        // 会把票投给机器C，因此到最后该集合的存储情况会如下：
                        // 机器A：key：sid=1，value：值为机器C的投票信息
                        // 机器B：key：sid=3，value：值为机器C的投票信息
                        // 机器C：key：sid=5，value：值为本机器的投票信息
                       recvset.put(n.sid, 
                                new Vote(n.leader, n.zxid,n.electionEpoch,
                                n.peerEpoch));
                        // termPredicate()方法的作用便是判断recvset集合中是
                        // 有一半以上的值为实例化的Vote对象信息，简单来说就是
                        // 在本机器判断集群内的投票信息是否已有某台机器得票率
                        // 过半了，如果Vote对象的投票过半则说明Leader已经
                        // 选举了出来
                        if (termPredicate(recvset,
                                new Vote(proposedLeader, proposedZxid,
                                        logicalclock, proposedEpoch))) {
                            // 轮询recvqueue集合是否还有新的消息可以接收
                            // 为什么这里还需要设置一个循环来轮询recvqueue集
                            // 合呢？这是因为只要执行到这里那么前面一定会更新
                            // 本机器的Leader信息并且向集群的其它机器发送本
                             // 机器的投票信息，此时恰好本机器已经投出了
                            // Leader信息，因此这里需要等待刚刚发出去的消息
                            // 回应收到了
                            while((n = recvqueue.poll(finalizeWait,
                                    TimeUnit.MILLISECONDS)) != null){
                                // 在确认集群内的其它机器消息时发现有一台机器
                                // 比现在的Leader机器更适合当领导则会退出
                                // 本次循环并且将该通知放入到recvqueue集合
                                // 中以便下次轮询可以查找出来
                                if(totalOrderPredicate(n.leader, n.zxid, 
                                        n.peerEpoch, proposedLeader, 
                                        proposedZxid, proposedEpoch)){
                                    // 放入recvqueue集合并退出循环
                                    recvqueue.put(n);
                                    break;
                                }
                            }
                            // 如果前面有更适合的Leader则n对象一定不为空，这
                            // 个if判断将不会进去；而如果n为空则说明各个机器
                            // 的回应是没有更适合的Leader信息的，在本机器投票
                            // 成功出来的Leader信息完全可以胜任当选的
                            if (n == null) {
                                // 确认Leader后设置本机器的状态，如果投票的
                                // 机器sid和本机器相等说明本机器就是Leader，
                                // 如果不是则设置成Follower（learningState
                                // 是支持设置成Observer的，单在这里不可能）
                                self.setPeerState(
                                    (proposedLeader == self.getId()) ?
                                    ServerState.LEADING: learningState());
                                // 将Leader信息封装成Vote对象
                                Vote endVote = new Vote(proposedLeader,
                                                        proposedZxid,
                                                        logicalclock,
                                                        proposedEpoch);
                                // 进入方法打印Leader信息并清空recvqueue集合
                                leaveInstance(endVote);
                                // 返回最终的投票信息，执行到这里说明本机器
                                // 参与的选举流程已经结束了，本机器要么作为
                                // Follower要么作为Leader
                                return endVote;
                            }
                        }
                        break;
                    case OBSERVING:
                        // 如果是观察者则不用做任何事
                        break;
                    case FOLLOWING:
                    case LEADING:
                        // 如果接收到的消息是由Leader或者Follower发过来的
                        // 在同一个选举迭代数中说明是一起选举的，并且本机器
                        // 由于通信晚的原因未能在集群刚好过半的机器中，即未能
                        // 成为第一批修改机器状态的机器，后来收到已经改变状态
                        // 机器的消息时便会进入到这里
                        if(n.electionEpoch == logicalclock){
                            // 进入到这里的消息通知对象包含的Leader信息一定是
                            // 真正的Leader信息，因为集群已经选举出了Leader
                            recvset.put(n.sid, new Vote(n.leader,
                                                          n.zxid,
                                                          n.electionEpoch,
                                                          n.peerEpoch));
                            // 该方法会判断recvset的投票数有一台机器是否已经
                            // 超过了半数并且判断是否已经真正产生了Leader
                            // 很显然一定是的，为什么呢？举个例子，还是A、B、C
                            // 三台机器，C被选举成为Leader，而假如A幸运的刚好
                            // 变成第二台判断过半数，此时B将会收到A和C的修改
                            // 投票通知，收到后B也修改完投票信息，然后再通知
                            // A和C，此时A和C将不再是LOOKING状态，便直接由
                            // 前面分析过的WorkerReceiver对象响应A和C的投票
                            // 信息和状态，此时便会执行到这里
                            if(ooePredicate(recvset, outofelection, n)) {
                                // 判断成功，根据本机器的id设置状态信息
                                self.setPeerState(
                                    (n.leader == self.getId()) ?
                                    ServerState.LEADING: learningState());
                                // 使用消息通知中的Leader信息封装投票对象
                                Vote endVote = new Vote(n.leader, 
                                        n.zxid, 
                                        n.electionEpoch, 
                                        n.peerEpoch);
                                // 进入方法打印Leader信息并清空recvqueue集合
                                leaveInstance(endVote);
                                // 返回最终的投票信息，执行到这里说明本机器
                                // 参与的选举流程已经结束了，本机器要么作为
                                // Follower要么作为Leader
                                return endVote;
                            }
                        }
                        // 如果进入到这里说明本机器的选举迭代数和已产生Leader
                        // 的集群选举迭代数不是一致的，本机器需要跟随集群走
                        // 保存收到的消息对应的机器投票信息
                        outofelection.put(n.sid, 
                                new Vote(n.version, n.leader, n.zxid, 
                                        n.electionEpoch,
                                        n.peerEpoch,
                                        n.state));
                        // 在加入集群的通信中前需要校验集群的Leader信息
                        // 当然outofelection集合中最后肯定是会有超过半数投给
                        // 同一个机器且集群的Leader信息会和那个超过半数的机器
                        // 信息一致
                        if(ooePredicate(outofelection, outofelection, n)){
                            synchronized(this){
                                // 将集群的选举迭代数赋值给本机器以方便集群
                                // 机器的信息统一和后续的重新选举
                                logicalclock = n.electionEpoch;
                                // 判断成功，根据本机器的id设置状态信息
                                self.setPeerState(
                                    (n.leader == self.getId()) ?
                                    ServerState.LEADING: learningState());
                            }
                            // 使用消息通知中的Leader信息封装投票对象
                            Vote endVote = new Vote(n.leader,
                                                    n.zxid,
                                                    n.electionEpoch,
                                                    n.peerEpoch);
                            // 进入方法打印Leader信息并清空recvqueue集合
                            leaveInstance(endVote);
                            // 返回最终的投票信息，执行到这里说明本机器
                                // 参与的选举流程已经结束了，本机器要么作为
                                // Follower要么作为Leader
                            return endVote;
                        }
                        break;
                    default:
                        break;
                    }
                }
            }
        }
    }
}
```

在lookForLeader()方法中如果返回了Vote对象说明本机器选举Leader的任务已经结束了，各个机器陆陆续续的修改自身状态并确定自身角色。在例子A、B、C机器中最终将会选举sid最大的C当选Leader，其余的两台机器都会是Follower。

### 2.6 QuorumPeer处理选举结果

在经过前面一系列通信后集群机器终于是选举出了Leader及Follower，在例子中C为Leader，接下来简单的分析下lookForLeader()方法返回后是如何由选举流程进入到数据同步流程的。

代码还是上一篇分析过的QuorumPeer代码，只是现在会以确认了Leader来分析，关键源码如下：

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
                            // 在本次投票中，lookForLeader()方法最终返回的
                            // 投票信息将会是机器C的，因此集群内的每台机器
                            // currentVote对象保存的都是Leader机器C的信息
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

至此选举流程便已经结束，接下来的流程都是在Leader、Follower和Observer具体对象中完成的，即数据同步流程，网上人们习惯称其为广播模式，但我更愿意把这个叫成数据同步流程。因为这个流程实际进行的操作就是同步各个机器间的请求数据，而广播在源码层面看选举流程也进行过广播，因此把这个数据同步流程称为广播模式不太合适。关于数据同步流程将会在下篇文章中进行流程和源码分析，尽情期待。
