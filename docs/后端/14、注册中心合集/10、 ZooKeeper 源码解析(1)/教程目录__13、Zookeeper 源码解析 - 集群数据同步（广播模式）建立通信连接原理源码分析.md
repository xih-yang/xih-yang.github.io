# 13、Zookeeper 源码解析 - 集群数据同步（广播模式）建立通信连接原理源码分析
- 来源：https://ddkk.com/zhuanlan/registered/zookeeper/1/13.html
- 分类：注册中心
- 分组：教程目录
## 1.前话

在前面的文章已经分析过了ZK集群数据同步（广播模式）建立通信连接的流程了，本次文章便分析一下建立通信连接的源码层面逻辑。

**注：本篇基于ZK版本3.4.8分析的。**

## 2.建立通信相关角色及流程图

数据同步建立通信的流程可以看成是古代附属王朝向中央王朝进行朝贡的流程，即各个Follower主动向Leader发送连接请求，Leader接收到各个Follower机器的请求后生成对应的处理器，这些处理器可以看成是中央王朝派遣的接待使。当然这中间肯定是要经过一系列的逻辑确定Leader机器是否是真正合格的Leader，需要得到各个Follower的支持和校验，否则集群将会重新发起选举选出新的Leader，就像古代附属王朝都想篡位自己当皇上天子一样，当然ZK集群比这简单很多。

### 2.1 相关角色及交互关系图

大致通信流程相关角色及交互关系如下图：

对于其中的流程以及注意点需要特别说明下：

- 方框的代表普通类对象，角有圆形弧度的说明是线程对象，虚线代表启动线程对象；
- QuorumPacket：集群通信的包对象，Leader和Follower之间的通信便是使用QuorumPacket类为载体进行发送与接收的，后面将其称为packet数据包；
- Follower角色：在继承关系上会继承Learner，Observer也会继承Learner类，因此从某一角度来看ZK集群中会含有两种角色：Leader和Learner，但是本次只会分析Follower角色；
- LearnerCnxAcceptor组件：简单的翻译下这个类名：Learner角色的连接接收器，顾名思义这个多线程类的作用便是用来接收各个Learner角色发送过来的连接请求，并进行相应的处理，从图中可以看出来接收到连接请求后将会使用接收到的Socket创建LearnerHandler线程对象；
- LearnerHandler组件：用来维护与Learner的通信关系，负责接收和向Learner发送请求数据包，相当于前面提到过中央王朝（Leader）派遣的接待使，Leader不会直接与Learner进行通信，而是每个都有一个LearnerHandler来维护；
- collection correspond：Leader与LearnerHandler之间的通信并不是直接交互的，如果接收到了Learner消息，LearnerHandler将会先放入到集合中，Leader则是直接判断集合数据，但Leader如果要做什么操作（其实只有ping操作，但留在后面再说）将会直接调用LearnerHandler对象的方法。

### 2.2 建立通信交互流程图

Leader和Follower之间建立通信主要是Socket通信比较多，大部分都是固定的异步即时通信，因此如果没有例子单看流程的话会比较晕，因为该流程的异步通信至少都有10个左右，更不用说如果是中途选举成功，还有一些旧数据需要同步的情况了。

本次建立通信交互流程依旧是原来的机器A、B和C，大致流程图如下：

整个流程较为复杂，因为涉及到两台机器的Socket即时通信，每次接收方法流程都会阻塞，因此需要在整体上了解整个流程，需要注意的是LearnerHandler对象和Follower对象间的Socket通信介质是QuorumPacket集群数据包对象，后面会统称为消息。

从图中可以看出来流程总共有26个，但总体上来看，整个流程总共有7个阶段：

**1、** 第一阶段：Leader和Follower的准备阶段，如Leader创建LearnerCnxAcceptor对象，Follower开始连接Leader机器地址；

**2、** 第二阶段：Leader机器验证集群内的FOLLOWERINFO类型消息，确保建立通信集群内确实是有超过半数的机器参与其中的，并且发送LEADERINFO类型消息将Leader机器的信息同步给各个Follower机器；

**3、** 第三阶段：Leader机器验证集群内的ACKEPOCH类型消息，该消息是为了判断集群内各个机器是否已经收到了LEADERINFO类型消息并处理成功；

**4、** 第四阶段：Leader机器将本机器日志信息尚未同步给集群内机器的请求再次以PROPOSAL-COMMIT对数据发送给各个Learner机器进行同步，并最终发送NEWLEADER类型消息，确保各个Follower已经完成消息同步并认可当前集群Leader机器；

**5、** 第五阶段：Leader机器验证集群内的ACK类型消息，确定超过半数的机器是在集群内正常运行的；

**6、** 第六阶段：Leader机器发送UPTODATE类型消息通知各个Follower可以退出和LearnerHandler对象的循环消息通信，开始准备对外处理请求服务了；

**7、** 第七阶段：最终阶段，各个机器启动ZooKeeperServer对象准备处理ZK客户端请求，并且Leader进入心跳检测循环，用来监听集群的运行情况；LearnerHandler和Follower进入最终的循环消息通信，以便集群后续接收ZK客户端的请求后可以进行同步请求通信；

Leader和各个Follower建立通信的流程总共经过了26个步骤流程，需要注意的是在上面所说的超过过半机器响应消息是包括Leader机器的，也就是说如果是三台机器A、B和C，C只需要接收到A或者B的响应，再加上C机器本身的调用即可完成验证，具体流程作用前面已经分析过了，这里便忽略。

## 3.建立通信连接源码分析

虽然这部分的代码总体不是很多，但碍于对象间的通信过多，因此本次源码分析将和以往的有些不一样，因为建立通信时本人将其分成了七个阶段来分析，因此在分析该流程时同样也会将其分为七个阶段，每个阶段单独分析，这样更便于理解，同时也可以对七个阶段的细节部分做一个详细分析。

建议在跟进源码时同时看上面的图片和阶段流程一起跟进，更便于理解当前进度和位置，以免丢失源码分析思路。

在集群中Follower和Observer统称为Learner，但是由于本次流程分析主要分析Follower，因此在源码中可能会把Learner统称为Follower。

**注意：本源码分析和ZK的源码并不是一致的，为了方便理解在不影响总体逻辑的情况下会将一些代码顺序修改。**

### 3.1 第一阶段：Leader和Follower准备工作

Leader和Follower的准备阶段，如Leader去创建LearnerCnxAcceptor对象用来接收其它机器的连接，而Follower等机器开始连接Leader机器的LearnerCnxAcceptor对象用来实例化和本机器对应的LearnerHandler对象。

#### 3.1.1 Leader - 准备阶段

该阶段Leader将会进行加载日志文件以实例化LearnerCnxAcceptor对象等操作。关键源码如下：

```java
public class Leader {
    // 记录FLE选举流程的开始和结束时间
    public long start_fle, end_fle;
    // 用来接收Follower对象的请求连接对象
    LearnerCnxAcceptor cnxAcceptor;
    // 代表集群对象，包含了集群的配置信息以及投票结果等信息
    final QuorumPeer self;
    void lead() throws IOException, InterruptedException {
        // 当Leader开始进行领导集群时代表FLE选举流程结束
        self.end_fle = System.currentTimeMillis();
        // 归零时间记录
        self.start_fle = 0;
        self.end_fle = 0;
        try {
            // tick记录归零该值会在最后的心跳检测每个tickTime时间便+1
            self.tick = 0;
            // 加载本机器的日志文件信息，并生成lastProcessedZxid属性
            zk.loadData();
            // 实例化LearnerCnxAcceptor对象
            cnxAcceptor = new LearnerCnxAcceptor();
            // 启动线程对象
            cnxAcceptor.start();
            // L1流程结束，后面略...
        }
    }
}
```

#### 3.1.2 Follower - 连接Leader机器

从QuorumPeer对象中获取Leader配置的连接信息并进行连接，源码如下：

```java
public class Follower extends Learner{
    // 记录FLE选举流程的开始和结束时间
    public long start_fle, end_fle;
    // 代表集群对象，包含了集群的配置信息以及投票结果等信息
    final QuorumPeer self;
    // 设置同步连接的Socket对象是否禁用延时方式，默认true，Socket的nodelay
    // 属性设为true的作用便是可以即时的发送小包数据，设置为false则会等待到达
    // 一定数据量后才会发送
    static final private boolean nodelay = 
        System.getProperty("follower.nodelay", "true").equals("true");
    // 本Follower和Leader通信的Socket对象
    protected Socket sock;
    // 和Leader机器通信的输入输出流对象
    protected InputArchive leaderIs;
    protected OutputArchive leaderOs;
    protected BufferedOutputStream bufferedOutput;
    void followLeader() throws InterruptedException {
        // 当Follower开始跟随领导时代表FLE选举流程结束
        self.end_fle = System.currentTimeMillis();
        // 归零时间记录
        self.start_fle = 0;
        self.end_fle = 0;
        try {
            // 从配置文件配置的信息中心获取Leader的连接信息
            InetSocketAddress addr = findLeader();
            try {
                // 开始连接Leader机器
                connectToLeader(addr);
                // 后面略...
            }
        }
    }
    protected InetSocketAddress findLeader() {
        InetSocketAddress addr = null;
        // 从集群对象投票信息中获取当前Leader的信息
        Vote current = self.getCurrentVote();
        // 从server配置中获取和Leader信息一致的机器连接信息
        for (QuorumServer s : self.getView().values()) {
            if (s.id == current.getId()) {
                s.recreateSocketAddresses();
                addr = s.addr;
                break;
            }
        }
        // 返回连接地址对象
        return addr;
    }
    protected void connectToLeader(InetSocketAddress addr) 
    throws IOException, ConnectException, InterruptedException {
        // 根据地址连接Leader机器
        // 创建Socket对象
        sock = new Socket();
        // 创建Socket时先设置timeout为tickTime*initLimit，当连接成功后将会
        // 设置成tickTime*syncLimit
        sock.setSoTimeout(self.tickTime * self.initLimit);
        // 默认固定重试5次
        for (int tries = 0; tries < 5; tries++) {
            try {
                // 开始连接Leader机器，即LearnerCnxAcceptor对象中的
                // ServerSocket对象
                sock.connect(addr, self.tickTime * self.syncLimit);
                // 设置是否延迟通信属性，默认true
                sock.setTcpNoDelay(nodelay);
                break;
            } catch (IOException e) {
                if (tries == 4) {
                    // 如果重试到达了第四次，则直接抛出异常终止重试
                    throw e;
                } else {
                    // 连接失败，开始重新创建Socket对象准备下次重试连接
                    sock = new Socket();
                    sock.setSoTimeout(self.tickTime * self.initLimit);
                }
            }
            // 失败后则睡眠1s
            Thread.sleep(1000);
        }
        // 使用Socket对象创建对应的输入输出流
        leaderIs = BinaryInputArchive.getArchive(new BufferedInputStream(
                sock.getInputStream()));
        bufferedOutput = new BufferedOutputStream(sock.getOutputStream());
        leaderOs = BinaryOutputArchive.getArchive(bufferedOutput);
    }
}
```

#### 3.1.3 LearnerHandler - 诞生缘由

前面的Follower已经使用Socket开始连接Leader的SocketServer了，而SocketServer是由LearnerCnxAcceptor对象管理的，因此LearnerHandler对象的诞生便在LearnerCnxAcceptor线程对象中。源码如下：

```java
class LearnerCnxAcceptor extends ZooKeeperThread{
    // Leader机器维护的ServerSocket对象，用来接收其它机器发送的Socket连接请求
    ServerSocket ss;
    // 用来标注LearnerCnxAcceptor是否已经被关闭，当Leader调用shutdown方法时
    // 将会设置stop属性为true
    private volatile boolean stop = false;
    // 设置同步连接的Socket对象是否禁用延时方式，默认true，Socket的nodelay
    // 属性设为true的作用便是可以即时的发送小包数据，设置为false则会等待到达
    // 一定数据量后才会发送
    static final private boolean nodelay = 
        System.getProperty("follower.nodelay", "true").equals("true");
    Leader(QuorumPeer self,LeaderZooKeeperServer zk) throws IOException {
        // LearnerCnxAcceptor对象是Leader的内部类，Leader对象在实例化时将会
        // 实例化ServerSocket对象
        this.self = self;
        try {
            // quorumListenOnAllIPs属性如果为true则会获取端口所有可用地址
            if (self.getQuorumListenOnAllIPs()) {
                ss = new ServerSocket(self.getQuorumAddress().getPort());
            } else {
                // 否则将只使用固定的地址
                ss = new ServerSocket();
            }
            ss.setReuseAddress(true);
            // 使用配置中固定的集群地址
            if (!self.getQuorumListenOnAllIPs()) {
                ss.bind(self.getQuorumAddress());
            }
        } catch (BindException e) {
            throw e;
        }
        this.zk=zk;
    }
    @Override
    public void run() {
        try {
            // 如果该线程对象未暂停则一直轮询
            while (!stop) {
                try{
                    // ServerSocket接收到从Follower发送过来的连接请求
                    Socket s = ss.accept();
                    // 首先设置为tickTime*initLimit
                    s.setSoTimeout(self.tickTime * self.initLimit);
                    // 设置Socket的nodelay属性
                    s.setTcpNoDelay(nodelay);
                    // 当接收成功Socket之后便创建维护Socket通信的对象
                    // LearnerHandler，随后启动该线程对象
                    LearnerHandler fh = new LearnerHandler(s, Leader.this);
                    fh.start();
                } catch (SocketException e) {
                    if (stop) {
                        // 如果是主动调用的shutdown方法抛出异常将不会处理
                        stop = true;
                    } else {
                        // 如果stop为false而发生了异常则说明确实出现了问题，
                        // 需要抛出异常
                        throw e;
                    }
                }
            }
        }// 略过...
    }
}
```

### 3.2 第二阶段：交换Leader和Follower信息

经过第一阶段后Leader已经通过LearnerCnxAcceptor线程对象接收到了Follower连接请求，并实例化了对应Socket对象的维护对象LearnerHandler，接下来便正式开始Leader机器和Follower机器间的建立通信连接流程。

#### 3.2.1 Follower - 发送FOLLOWERINFO处理LEADERINFO消息

当Follower连接Leader机器的对象ServerSocket成功后，本对象将会进入正式的消息发送和接收流程。源码如下：

```java
public class Follower extends Learner{
    void followLeader() throws InterruptedException {
        // 在F1流程已经分析过了，接着续上
        connectToLeader(addr);
        // 连接ServerSocket对象成功后本对象将会向其发送FOLLOWERINFO类型的消息
        // 通知Leader本Follower的机器信息，如果是Observer则发送OBSERVERINFO
        // 类型的消息通知Leader本Observer的机器信息
        long newEpochZxid = registerWithLeader(Leader.FOLLOWERINFO);
    }
    protected long registerWithLeader(int pktType) throws IOException{
        // 开始F2流程，先获取最新的zxid
        long lastLoggedZxid = self.getLastLoggedZxid();
        // 创建保对象
        QuorumPacket qp = new QuorumPacket();
        // pktType如果是Follower对象则是FOLLOWERINFO，如果是Observer则是
        // OBSERVERINFO类型
        qp.setType(pktType);
        // 根据选举后接收的acceptedEpoch生成发送FOLLOWERINFO类型消息的zxid
        qp.setZxid(ZxidUtils.makeZxid(self.getAcceptedEpoch(), 0));
        // 生成LearnerInfo对象，需要注意包对象发送了protocolVersion属性
        LearnerInfo li = new LearnerInfo(self.getId(), 0x10000);
        // 生成BinaryOutputArchive对象，并将LeanerInfo对象写入
        ByteArrayOutputStream bsid = new ByteArrayOutputStream();
        BinaryOutputArchive boa = BinaryOutputArchive.getArchive(bsid);
        boa.writeRecord(li, "LearnerInfo");
        // 将对象的字节数据放入包对象中
        qp.setData(bsid.toByteArray());
        // 使用leaderOs对象发送包数据，F2流程结束
        writePacket(qp, true);
        // 开始F3流程，接收到了Leader机器的LearnerHandler回复的LEADERINFO类型
        // 消息
        readPacket(qp);
        // 获取Leader回复的zxid，并根据zxid获取epoch信息
        final long newEpoch = ZxidUtils.getEpochFromZxid(qp.getZxid());
        // 版本相同的情况下这里接收到的肯定是LEADERINFO类型消息
        if (qp.getType() == Leader.LEADERINFO) {
            // 获取Leader回复的leaderProtocolVersion属性信息
            leaderProtocolVersion = ByteBuffer.wrap(qp.getData()).getInt();
            // 生成等下发送ACKEPOCH类型消息的消息体
            byte epochBytes[] = new byte[4];
            // 封装需要发送的消息体数据
            final ByteBuffer wrappedEpochBytes = 
                    ByteBuffer.wrap(epochBytes);
            // 如果Leader发送过来的epoch大于本机器的acceptedEpoch，则直接发送
            // 本机器的currentEpoch属性，并设置acceptedEpoch信息
            if (newEpoch > self.getAcceptedEpoch()) {
                // 放置currentEpoch属性
                wrappedEpochBytes.putInt((int)self.getCurrentEpoch());
                // 根据epoch信息设置acceptedEpoch属性
                self.setAcceptedEpoch(newEpoch);
            } else if (newEpoch == self.getAcceptedEpoch()) {
                // 如果相等的说明选举获得的acceptedEpoch是没问题的
                wrappedEpochBytes.putInt(-1);
            } else {
                // newEpoch是不可能比acceptedEpoch小的，小的话说明流程出现了
                // 问题，直接抛出异常结束流程
                throw new IOException();
            }
            // 后面略...
        } else {
            // 估计是兼容老版本的逻辑，中途不经过ACKEPOCH过程
            // 直接发送NEWLEADER类型消息
            if (newEpoch > self.getAcceptedEpoch()) {
                // 如果大于则设置acceptedEpoch信息
                self.setAcceptedEpoch(newEpoch);
            }
            // 不是NEWLEADER信息则说明老版本流程异常，抛出异常结束流程
            if (qp.getType() != Leader.NEWLEADER) {
                throw new IOException();
            }
            // 返回Leader数据包的zxid
            return qp.getZxid();
        }
    } 
}
```

#### 3.2.2 LearnerHandler - 处理FOLLOWERINFO发送LEADERINFO消息

当LearnerHandler在LearnerCnxAcceptor对象中被创建之后，便只会一直维护对应的Socket对象，直到发生了异常。接下来便正式开始分析LearnerHandler和Leader对象还有Follower对象的交互流程，源码如下：

```java
public class LearnerHandler extends ZooKeeperThread {
    // 保存对应Follower的Socket对象
    protected final Socket sock;
    // 本对象对应的Leader对象，以方便获取Leader对象的信息
    final Leader leader;
    // 截止到下次通信的结束时间，在建立通信连接阶段该属性是基于initLimit属性和
    // syncLimit属性往上加的，当完成建立通信连接过程后将会以syncLimit属性往上
    // 加，一旦超出这个属性就代表本对象维护的Socket对象连接机器已经失联了
    volatile long tickOfNextAckDeadline;
    // 和对应的Follower进行通信的输入输出流对象
    private BinaryInputArchive ia;
    private BinaryOutputArchive oa;
    private BufferedOutputStream bufferedOutput;
    // 对应Follower或者Observer对象的唯一表示，相当于Learner机器的myid属性
    protected long sid = 0;
    // 当确认Learner是Follower或者Observer时将会设置成对应的值
    private LearnerType  learnerType = LearnerType.PARTICIPANT;
    @Override
    public void run() {
        try {
            // H2流程开始，先初始化tickOfNextAckDeadline属性，由于最开始创建时
            // tick为0，因此刚开始tickOfNextAckDeadline属性就是initLimit加上
            // syncLimit，但如果Follower是中途加入的，tick则不会是0
            tickOfNextAckDeadline = leader.self.tick
                    + leader.self.initLimit + leader.self.syncLimit;
            // 根据Socket实例化输入输出流对象
            ia = BinaryInputArchive.getArchive(
                    new BufferedInputStream(sock.getInputStream()));
            bufferedOutput = new BufferedOutputStream(
                    sock.getOutputStream());
            oa = BinaryOutputArchive.getArchive(bufferedOutput);
            // 实例化数据包对象
            QuorumPacket qp = new QuorumPacket();
            // 从F2流程中读取FOLLOWERINFO或者OBSERVERINFO类型消息
            ia.readRecord(qp, "packet");
            // 如果首先接受到的消息类型不是FOLLOWERINFO或OBSERVERINFO，则说明
            // 流程有问题，直接结束LearnerHandler线程对象方法
            if(qp.getType() != Leader.FOLLOWERINFO && 
                    qp.getType() != Leader.OBSERVERINFO){
                return;
            }
            // 从包数据中获取learnerInfo的字节数组数据
            byte learnerInfoData[] = qp.getData();
            if (learnerInfoData != null) {
                // 如果learnerInfo数据不为空且长度为8则说明为老版本，包数据中
                // 不包含protocolVersion版本属性信息，只有sid信息
               if (learnerInfoData.length == 8) {
                  // 读取sid信息
                  ByteBuffer bbsid = ByteBuffer.wrap(learnerInfoData);
                  this.sid = bbsid.getLong();
               } else {
                   // 如果数据长度不为8则说明为新版本，发送了protocolVersion
                   // 版本属性信息，根据字节数组初始化LearnerInfo对象
                  LearnerInfo li = new LearnerInfo();
                  ByteBufferInputStream.byteBuffer2Record(
                          ByteBuffer.wrap(learnerInfoData), li);
                  // 获取sid和protocolVersion版本信息
                  this.sid = li.getServerid();
                  this.version = li.getProtocolVersion();
               }
            } else {
               // 如果learnerInfo信息发送过来的为空，则说明是更老的版本，直接
               // 手动+1，在本机模拟对应Learner机器的sid
               this.sid = leader.followerCounter.getAndDecrement();
            }
            // 设置成OBSERVER类型，但在本次分析中类型是FOLLOWERINFO
            if (qp.getType() == Leader.OBSERVERINFO) {
                  learnerType = LearnerType.OBSERVER;
            }
            long peerLastZxid;
            StateSummary ss = null;
            // 获取包数据的zxid
            long zxid = qp.getZxid();
            // 根据包对象中的zxid获取Follower对象的acceptedEpoch信息
            long lastAcceptedEpoch = ZxidUtils.getEpochFromZxid(
                    qp.getZxid());
            // 调用Leader的验证集群信息交换，验证集群是否有超过半数发送了
            // 机器对应epoch和sid信息，调用这个方法就意味着进入了L2流程，
            // 当超过半数的机器发送了机器信息，将会继续往下走，否则阻塞
            long newEpoch = leader.getEpochToPropose(this.getSid(), 
                    lastAcceptedEpoch);
            if (this.getVersion() < 0x10000) {
                // 如果是老版本则根据包数据的zxid获取epoch信息
                long epoch = ZxidUtils.getEpochFromZxid(zxid);
                // 生成对应的StateSummary对象
                ss = new StateSummary(epoch, zxid);
                // 进入L3流程，但实际上如果集群的jar包版本都是3.4.8，将不会执行
                // 到这里
                leader.waitForEpochAck(this.getSid(), ss);
            } else {
                // 同版本情况下将会执行到这里
                // 生成待发送消息体
                byte ver[] = new byte[4];
                // 将版本信息放入到消息体中
                ByteBuffer.wrap(ver).putInt(0x10000);
                // 执行到这H2流程结束，开始H3流程
                // 根据消息体和获取的最大集群epoch信息生成LEADERINFO类型消息
                QuorumPacket newEpochPacket = new QuorumPacket(
                        Leader.LEADERINFO, ZxidUtils.makeZxid(newEpoch, 0),
                        ver, null);
                // 发送LEADERINFO类型消息，H3流程结束，进入F3流程
                oa.writeRecord(newEpochPacket, "packet");
                bufferedOutput.flush();
                // 后面略...
            }
        }
    }
}
```

#### 3.2.3 Leader - 验证集群信息交换

Leader对象在实例化LearnerCnxAcceptor对象后将会进入验证集群信息交换的状态，用来验证集群内的机器是否已经成功交换完LEADERINFO和FOLLOWERINFO消息。源码如下：

```java
public class Leader {
    // 记录最后面接收的zxid
    long lastProposed;
    // 记录新Leader需要发送的消息
    Proposal newLeaderProposal = new Proposal();
    // 标识是否需要等待确认新的集群epoch信息，如果为true代表集群响应
    // 的FOLLOWERINFO或者OBSERVERINFO信息未过半，需要继续确认；为false
    // 则代表已经过半，无需再确认
    boolean waitingForNewEpoch = true;
    // 确认FOLLOWERINFO类型消息时用来临时存储本次校验的临时epoch字段
    long epoch = -1;
    // 用来接收各个机器响应FOLLOWERINFO或OBSERVERINFO消息中的sid信息
    // 用来记录哪些机器已经发送过FOLLOWERINFO类型消息，作为判断集群
    // 响应过半的依据
    private HashSet<Long> connectingFollowers = new HashSet<Long>();
    void lead() throws IOException, InterruptedException {
        cnxAcceptor = new LearnerCnxAcceptor();
        cnxAcceptor.start();
        // 续着前面的L1流程，开始进行L2流程
        // 传入Leader机器的sid和acceptedEpoch信息，模拟收到了本机器的机器信息
        // 在这里会阻塞查询connectingFollowers集合用来判断集群是否有过半的机器
        // 响应了FOLLOWERINFO机器信息
        long epoch = getEpochToPropose(self.getId(), 
                self.getAcceptedEpoch());
        // 超过半数的机器发送了机器信息到Leader上后将会停止阻塞
        // 在这里根据epoch信息设置zxid
        zk.setZxid(ZxidUtils.makeZxid(epoch, 0));
        synchronized(this){
            // 记录zxid
            lastProposed = zk.getZxid();
        }
        // 生成NEWLEADER信息，等待后续发送
        newLeaderProposal.packet = new QuorumPacket(NEWLEADER, 
                zk.getZxid(), null, null);
        // L2流程结束，后面略...
    }
    public long getEpochToPropose(long sid, long lastAcceptedEpoch) 
            throws InterruptedException, IOException {
        synchronized(connectingFollowers) {
            // 如果waitingForNewEpoch为true则代表需要进行后续的判断
            // 否则直接返回epoch临时字段结果
            if (!waitingForNewEpoch) {
                return epoch;
            }
            // 如果有机器的acceptedEpoch信息大于现有epoch临时字段则
            // 使用新的acceptedEpoch值+1进行赋值
            if (lastAcceptedEpoch >= epoch) {
                epoch = lastAcceptedEpoch+1;
            }
            // 保存发送机器信息过来的sid
            connectingFollowers.add(sid);
            // 获取集群的资格校验器
            QuorumVerifier verifier = self.getQuorumVerifier();
            // 判断connectingFollowers集合中是否含有本机器的sid，并且
            // 响应的机器数量是否超过半数
            if (connectingFollowers.contains(self.getId()) && 
                    verifier.containsQuorum(connectingFollowers)) {
                // 进入到这里说明响应机器数量超过半数，将waitingForNewEpoch
                // 属性设置为false，说明无需再等待新的epoch机器信息
                waitingForNewEpoch = false;
                // 将新的epoch信息设置到acceptedEpoch信息
                self.setAcceptedEpoch(epoch);
                // 唤醒阻塞的线程
                connectingFollowers.notifyAll();
            } else {
                // 执行到这里说明响应机器尚未过半，需要阻塞并等待响应过半
                // 唤醒本线程
                // 记录阻塞开始时间
                long start = System.currentTimeMillis();
                long cur = start;
                // 获取等待结束时间，在start时间加上initLimit和tickTime属性
                long end = start + self.getInitLimit()*self.getTickTime();
                // 一直轮询其它机器的响应情况，直到有其它的线程接收到响应且过半
                // 后将waitingForNewEpoch设置为false，或者cur当前时间已经超过
                // 了end时间，代表响应已经超时了
                while(waitingForNewEpoch && cur < end) {
                    // 一直等待直到end时间节点到来
                    connectingFollowers.wait(end - cur);
                    // 每次轮询更新cur为当前时间
                    cur = System.currentTimeMillis();
                }
                // 如果循环结束后waitingForNewEpoch依旧是true则说明在规定时间
                // 内集群没有过半的机器响应FOLLOWERINFO信息，说明同步机器epoch
                // 信息失败，需要抛出中断异常，并开始下一次的选举
                if (waitingForNewEpoch) {
                    throw new InterruptedException();        
                }
            }
            // 如果执行到这里说明已经有过半的机器响应了，且获得了集群内最新的
            // epoch信息，随后返回
            return epoch;
        }
    }
}
```

### 3.3 第三阶段：同步确认Epoch信息

在刚刚那个阶段已经发送同步完各个机器信息的消息，接下来将会进行Epoch信息同步结果校验。

#### 3.3.1 Follower - 发送ACKEPOCH信息

本流程十分简单，只是单纯的向Leader发送ACKEPOCH消息而已，源码如下：

```java
public class Follower extends Learner{
    protected long registerWithLeader(int pktType) throws IOException{
        // F3的流程，略...
        if (qp.getType() == Leader.LEADERINFO) {
            // F3的流程，略...
            if (newEpoch > self.getAcceptedEpoch()) {
                // F3的流程，略...
            } else if (newEpoch == self.getAcceptedEpoch()) 
                // F3的流程，略...
            } else {
                // F3的流程，略...
            }
            // F3流程结束，F4流程开始
            // 直接根据F3流程获取的epoch字节数据响应ACKEPOCH类型消息
            QuorumPacket ackNewEpoch = new QuorumPacket(Leader.ACKEPOCH, 
                    lastLoggedZxid, epochBytes, null);
            // 发送消息
            writePacket(ackNewEpoch, true);
            // 返回新的epoch信息后F4流程结束
            return ZxidUtils.makeZxid(newEpoch, 0);
        } else {
            // F3的流程，略...
            return qp.getZxid();
        }
    } 
}
```

#### 3.3.2 LearnerHandler - 处理ACKEPOCH信息

LearnerHandler的流程也同样很简单，接收到ACKEPOCH之后再调用Leader对象的确认ACKEPOCH信息的方法，完成超过半数判断，并继续后续流程。源码如下：

```java
public class LearnerHandler extends ZooKeeperThread {
    @Override
    public void run() {
        // 发送LEADERINFO类型消息，H3流程结束，进入F3流程
        oa.writeRecord(newEpochPacket, "packet");
        bufferedOutput.flush();
        // 续着之前H3流程，开始H4流程
        QuorumPacket ackEpochPacket = new QuorumPacket();
        // 读取F4流程发送过来的ACKEPOCH类型消息
        ia.readRecord(ackEpochPacket, "packet");
        // 如果消息类型不是ACKEPOCH则直接退出终止流程
        if (ackEpochPacket.getType() != Leader.ACKEPOCH) {
            return;
        }
        // 从ACKEPOCH类型消息中获取epoch数据
        ByteBuffer bbepoch = ByteBuffer.wrap(
                ackEpochPacket.getData());
        // 根据epoch和zxid信息实例化StateSummary对象
        ss = new StateSummary(bbepoch.getInt(), 
                ackEpochPacket.getZxid());
        // 随后调用Leader对象的waitForEpochAck()方法，校验是否超过半数机器
        // 回应了ACKEPOCH类型消息
        leader.waitForEpochAck(this.getSid(), ss);
    }
}
```

#### 3.3.3 Leader - 验证Epoch信息交换

前面的Follower已经向LeanerHandler发送了ACKEPOCH类型的消息，接下来只需要Leader对象验证集群过半机器响应该类型消息便可以后续的流程。源码如下：

```java
public class Leader {
    // 记录最后面接收的zxid
    long lastProposed;
    // 记录新Leader需要发送的消息
    Proposal newLeaderProposal = new Proposal();
    // 用来保存发送ACKEPOCH类型消息的机器sid作为判断集群响应机器过半的依据
    private HashSet<Long> electingFollowers = new HashSet<Long>();
    // 用来判断验证ACKEPOCH类型消息是否完成，如果完成会设置为true，否则为false
    private boolean electionFinished = false;
    void lead() throws IOException, InterruptedException {
        // 生成NEWLEADER信息，等待后续发送
        newLeaderProposal.packet = new QuorumPacket(NEWLEADER, 
                zk.getZxid(), null, null);
        // 续着L2流程的部分继续分析，L3流程开始
        // 使用Leader机器的zxid信息和currentEpoch信息生成StateSummary对象
        // 用来模拟本机器发送了ACKEPOCH消息
        leaderStateSummary = new StateSummary(self.getCurrentEpoch(), 
                zk.getLastProcessedZxid());
        // 在这里会阻塞查询electingFollowers集合，用来判断集群内是否有过半的
        // 机器响应了ACKEPOCH信息
        waitForEpochAck(self.getId(), leaderStateSummary);
        // 执行到这里说明集群内已经有过半的机器响应了ACKEPOCH类型消息
        self.setCurrentEpoch(epoch);
    }
    public void waitForEpochAck(long id, StateSummary ss) 
            throws IOException, InterruptedException {
        synchronized(electingFollowers) {
            // 如果electionFinished为true说明ACKEPOCH信息校验已经完成，直接
            // 退出方法返回
            if (electionFinished) {
                return;
            }
            // epoch的初始值为-1，不为-1说明才是正常通信的
            if (ss.getCurrentEpoch() != -1) {
                // isMoreRecentThan()方法会判断Follower响应ACKEPOCH消息
                // 中的epoch等信息是否大于Leader的，如果大于则说明不符合正常
                // 流程，抛出异常结束流程。正常流程Leader的epoch、zxid等肯定是
                // 大于或等于Follower的
                if (ss.isMoreRecentThan(leaderStateSummary)) {
                    throw new IOException();
                }
                // 如果ACKEPOCH响应的消息没有问题则将其添加到
                // electingFollowers集合中，代表该机器已经响应成功
                electingFollowers.add(id);
            }
            QuorumVerifier verifier = self.getQuorumVerifier();
            if (electingFollowers.contains(self.getId()) && 
                    verifier.containsQuorum(electingFollowers)) {
                // Leader的sid在集合内且响应的机器过半则会执行到这里
                // 设置electionFinished属性为true，说明ACKEPOCH信息验证完成
                electionFinished = true;
                // 唤醒阻塞的线程
                electingFollowers.notifyAll();
            } else {
                // 执行到这里说明响应机器尚未过半，需要阻塞并等待响应过半
                // 唤醒本线程
                // 记录阻塞开始时间     
                long start = System.currentTimeMillis();
                long cur = start;
                // 获取等待结束时间，在start时间加上initLimit和tickTime属性
                long end = start + self.getInitLimit()*self.getTickTime();
                // 一直轮询其它机器的响应情况，直到有其它的线程接收到响应且过半
                // 后将electionFinished设置为true，或者cur当前时间已经超过
                // 了end时间，代表响应已经超时了
                while(!electionFinished && cur < end) {
                    // 一直等待直到end时间节点到来
                    electingFollowers.wait(end - cur);
                    // 每次轮询更新cur为当前时间
                    cur = System.currentTimeMillis();
                }
                // 如果循环结束后electionFinished依旧是false则说明在规定时间
                // 内集群没有过半的机器响应ACKEPOCH类型信息，说明同步机器响应
                // 信息失败，需要抛出中断异常，并开始下一次的选举
                if (!electionFinished) {
                    throw new InterruptedException();
                }
            }
        }
    }
}
```

### 3.4 第四阶段：同步日志数据

第四阶段的源码稍微长点，因为需要将以前的日志信息同步给Follower，但这个阶段Leader并不会参与其中。

#### 3.4.1 LearnerHandler - 发送本机需同步日志数据

在本阶段中将会一次性分析完H5、H6和H7流程，会在代码中特别注释流程的开始和结束。源码如下：

```java
public class LearnerHandler extends ZooKeeperThread {
    // 需要发送的包数据对象都会保存在这个集合中，直到线程对象轮询发送出去
    final LinkedBlockingQueue<QuorumPacket> queuedPackets =
            new LinkedBlockingQueue<QuorumPacket>();
    @Override
    public void run() {
        // H4流程结束的节点
        leader.waitForEpochAck(this.getSid(), ss);
        // H5流程开始，需要注意的是在流程中zxid对象指的是Follower的zxid
        // newEpoch对象是经过协商后的集群epoch信息
        // 经过前面ACKEPOCH信息后可以确认现在的zxid和epoch都是最新的，赋值给
        // 集群最新zxid对象
        peerLastZxid = ss.getLastZxid();
        // 等下将要发送的数据包类型默认是SNAP类型
        int packetToSend = Leader.SNAP;
        long zxidToSend = 0;
        long leaderLastZxid = 0;
        long updates = peerLastZxid;
        // 获取日志读锁，并进行上锁操作
        ReentrantReadWriteLock lock = leader.zk.getZKDatabase()
                .getLogLock();
        ReadLock rl = lock.readLock();
        try {
            rl.lock();        
            // 获取Leader的minCommittedLog-maxCommittedLog提交日志区间
            // Leader的日志一定是最新的，如果上一代集群因为某些原因导致重新选举
            // Leader的日志也一定是最多的，因为只有日志最多对的机器才能当上
            // Leader，minCommittedLog-maxCommittedLog缓存区间为500
            // 当然上述是正常情况，异常情况Follower接收到请求未能同步成功但是
            // 有记录下来了，此时Follower的zxid会比Leader可能要大
            final long maxCommittedLog = leader.zk.getZKDatabase()
                    .getmaxCommittedLog();
            final long minCommittedLog = leader.zk.getZKDatabase()
                    .getminCommittedLog();
            // 获取Leader的日志提交对象信息
            LinkedList<Proposal> proposals = leader.zk.getZKDatabase()
                    .getCommittedLog();
            // 如果通过集群交换后的最新zxid和Leader日志文件最大的zxid是一致的
            // 则说明经过重新选举之后没有数据丢失，无需同步。集群第一次启动时
            // peerLastZxid和日志信息lastProcessedZxid属性肯定是相同的
            if (peerLastZxid == leader.zk.getZKDatabase()
                    .getDataTreeLastProcessedZxid()) {
                // 如果需要同步的消息为空，则发送DIFF类型日志
                packetToSend = Leader.DIFF;
                // 将最新的zxid赋值给待发送zxid对象
                zxidToSend = peerLastZxid;
            } else if (proposals.size() != 0) {
                // 如果集群的zxid和日志lastProcessedZxid不相等且Leader的日志
                // 文件信息不为空则判断信息的zxid准备需要同步的信息
                if ((maxCommittedLog >= peerLastZxid)
                        && (minCommittedLog <= peerLastZxid)) {
                    // 进入到这里面说明集群当前的zxid小于Leader日志信息的最大
                    // zxid，peerLastZxid-maxCommittedLog这个区间的请求信息
                    // 需要同步给其它的Follower机器
                    // 设置上次同步消息的zxid为minCommittedLog
                    long prevProposalZxid = minCommittedLog;
                    boolean firstPacket=true;
                    // 先设置待发送消息类型为DIFF
                    packetToSend = Leader.DIFF;
                    // 待发送zxid设置为maxCommittedLog，因为弄完之后集群的zxid
                    // 肯定是和maxCommittedLog相等的
                    zxidToSend = maxCommittedLog;
                    // 开始遍历待同步对象数组
                    for (Proposal propose: proposals) {
                        if (propose.packet.getZxid() <= peerLastZxid) {
                            // 这个判断是为了去掉区间
                            // minCommittedLog-peerLastZxid的消息
                            prevProposalZxid = propose.packet.getZxid();
                            continue;
                        } else {
                            // 针对首个需要同步的消息做些额外处理
                            if (firstPacket) {
                               // 处理完之后便设置为false，后面将不会进入
                               firstPacket = false;
                               // 用来判断Foolower是否有些日志信息Leader是
                               // 没有的，比如处理请求时未同步成功的
                               if (prevProposalZxid < peerLastZxid) {
                                    // 如果请求Leader没有则发送TRUNC类型消息
                                    // 将那些日志请求信息都给截掉
                                    packetToSend = Leader.TRUNC;
                                    // 因为该Follower后面都是需要截掉的消息
                                    // 因此需要发送的zxid到此为止
                                    zxidToSend = prevProposalZxid;
                                    // updates记录的是TRUNC操作的临界点
                                    updates = zxidToSend;
                                }
                            }
                            // 将PROPOSAL类型消息先放入待发送集合
                            // queuedPackets中
                            queuePacket(propose.packet);
                            // 接着创建一个COMMIT类型消息放入queuedPackets
                            // 集合中，形成PROPOSAL-COMMIT消息对
                            QuorumPacket qcommit = new QuorumPacket
                                    Leader.COMMIT,propose.packet.getZxid(),
                                    null, null);
                            queuePacket(qcommit);
                        }
                    }
                } else if (peerLastZxid > maxCommittedLog) {
                    // 如果Follower机器的最新zxid比Leader的大，则直接发送
                    // TRUNC类型消息通知Follower需要把多余的部分截掉
                    packetToSend = Leader.TRUNC;
                    // 记录需要截掉的临界点
                    zxidToSend = maxCommittedLog;
                    updates = zxidToSend;
                } 
            }            
            // 将Leader运行期间接收到的请求从updates起的zxid一起同步给
            // Follower，前面几个if判断同步的是日志文件中的历史请求信息，而
            // startForwarding()方法则是将Leader最新接收且尚未处理完的转发
            // 给对应的Follower
            leaderLastZxid = leader.startForwarding(this, updates);
        } finally {
            // 读锁解锁
            rl.unlock();
        }
        // 前面H5流程结束，从现在开始H6流程
        // 使用新的epoch信息生成最新的NEWLEADER类型消息
         QuorumPacket newLeaderQP = new QuorumPacket(Leader.NEWLEADER,
                ZxidUtils.makeZxid(newEpoch, 0), null, null);
         // 如果是老版本则直接发送NEWLEADER类型信息，但本次只分析3.4.8版本
         if (getVersion() < 0x10000) {
            oa.writeRecord(newLeaderQP, "packet");
        } else {
            // 如果是3.4.8版本则添加到queuedPackets集合准备发送
            queuedPackets.add(newLeaderQP);
        }
        bufferedOutput.flush();
        // 如果待发送类型是SNAP，说明无需进行同步等操作，将日志信息的
        // lastProcessedZxid属性赋值给zxidToSend对象
        if (packetToSend == Leader.SNAP) {
            zxidToSend = leader.zk.getZKDatabase()
                    .getDataTreeLastProcessedZxid();
        }
        // 发送packetToSend类型的消息，并且发送zxidToSend对象的zxid信息
        // 在这里做个总结：
        // 1、SNAP类型：Leader需要向Follower同步整个快照信息
        // 2、DIFF类型：Leader和Follower有数据差异，但是同步的数据可能为空
        // 也可能有真的需要同步的数据
        // 3、TRUNC类型：Follower机器拥有Leader没有的数据，因此需要Follower
        // 将多出的数据截掉
        oa.writeRecord(new QuorumPacket(packetToSend, zxidToSend, null, 
                null), "packet");
        bufferedOutput.flush();
        if (packetToSend == Leader.SNAP) {
            // 将Leader的整个日志快照信息都同步给对应的Follower，包括Leader
            // 保存的session信息，dataTree数据
            leader.zk.getZKDatabase().serializeSnapshot(oa);
            // 发送签名确认信息
            oa.writeString("BenWasHere", "signature");
        }
        bufferedOutput.flush();
        // 前面H6流程结束，开始H7流程
        // 创建并启动线程对象，用来轮询queuedPackets集合，将需要发送的包对象
        // 发送给维护的对应Follower对象
        new Thread() {
            public void run() {
                // 设置线程名称
                Thread.currentThread().setName(
                        "Sender-" + sock.getRemoteSocketAddress());
                try {
                    // 调用方法轮询queuedPackets集合发送包数据
                    sendPackets();
                } // 异常忽略...
            }
        }.start();
        // 至此H7流程结束
    }
}
```

#### 3.4.2 Follower - 接收保存同步日志数据

前面一口气分析完了LearnerHandler的H5、H6和H7流程，接下来便开始分析F5和F6流程。源码如下：

```java
public class Follower extends Learner{
    void followLeader() throws InterruptedException {
        long newEpochZxid = registerWithLeader(Leader.FOLLOWERINFO);
        // 续着F4流程结束节点，F5流程开始
        // 从zxid中获取最新的epoch信息
        long newEpoch = ZxidUtils.getEpochFromZxid(newEpochZxid);
        // 如果经过交换epoch信息后的最新epoch信息还低于Follower本身的
        // acceptedEpoch信息，则说明Leader领导流程有问题，需要中断重新选举
        if (newEpoch < self.getAcceptedEpoch()) {
            throw new IOException();
        }
        // 进入数据同步阶段，包括F5、F6、F7和F8流程
        syncWithLeader(newEpochZxid);
    }
    protected void syncWithLeader(long newLeaderZxid)
            throws IOException, InterruptedException{
        // 开始数据同步阶段，先创建接收包数据的对象qp
        QuorumPacket qp = new QuorumPacket();
        // 根据Leader集群最新的zxid获取最新的epoch信息
        long newEpoch = ZxidUtils.getEpochFromZxid(newLeaderZxid);
        // 读取H5流程发送过来的消息，类型为SNAP、DIFF或TRUNC三种之一
        readPacket(qp);
        synchronized (zk) {
            if (qp.getType() == Leader.DIFF) {
                // DIFF则暂时什么都不做
            } else if (qp.getType() == Leader.SNAP) {
                // 如果是SNAP，则说明本Follower需要接收Leader的全部快照信息
                // 清除本机器原有的日志数据等信息
                zk.getZKDatabase().clear();
                // 开始反序列化发送过来的session信息和DataTree等信息
                zk.getZKDatabase().deserializeSnapshot(leaderIs);
                String signature = leaderIs.readString("signature");
                // 如果签名有误则中断后续流程
                if (!signature.equals("BenWasHere")) {
                    throw new IOException("Missing signature");
                }
            } else if (qp.getType() == Leader.TRUNC) {
                // 从包数据对象的zxid开始，删除本机器中的日志文件
                boolean truncated=zk.getZKDatabase()
                        .truncateLog(qp.getZxid());
                // 如果删除失败则退出系统
                if (!truncated) {
                    System.exit(13);
                }
            }
            else {
                // 如果收到的消息类型不是SNAP、DIFF或TRUNC三者之一，则退出系统
                System.exit(13);
            }
            // 前面可能会执行TRUNC操作，因此需要将包数据的zxidd设置给zk
            // 数据中心的lastProcessedZxid属性
            zk.getZKDatabase().setlastProcessedZxid(qp.getZxid());
            // 创建LearnerSessionTracker对象，该对象主要是维护session快照信息
            zk.createSessionTracker();
            // F5流程结束，开始F6流程
            // 创建用来保存已提交包信息zxid信息的集合
            LinkedList<Long> packetsCommitted = new LinkedList<Long>();
            // 创建用来保存未提交包信息对象的集合
            LinkedList<PacketInFlight> packetsNotCommitted = 
                    new LinkedList<PacketInFlight>();
            // 记录最后面使用的zxid值
            long lastQueued = 0;
            // 默认为false，当收到Leader机器发送的NEWLEADER信息后将会设置为
            // true，但在ZK1.0之前的版本是收到UPTODATE类型消息才设置为true
            boolean snapshotTaken = false;
            // 开始轮询，直到使用break outerLoop语句
            outerLoop:
            while (self.isRunning()) {
                // 轮询从LearnerHandler接收消息PROPOSAL、COMMIT、NEWLEADER
                // 和UPTODATE这四种，INFORM是Observer相关的，和Follower交互
                // 不会有这种类型的消息，因此忽略。但是在F6流程中只会接收
                // PROPOSAL、COMMIT、NEWLEADER这三种，UPTODATE是F7流程接收的
                readPacket(qp);
                switch(qp.getType()) {
                case Leader.PROPOSAL:
                    // 属于F5流程中处理PROPOSAL-COMMIT消息对的PROPOSAL消息
                    // 接收同步具体信息对象类型，并使用PacketInFlight对象
                    // 反序列化接收
                    PacketInFlight pif = new PacketInFlight();
                    pif.hdr = new TxnHeader();
                    // 使用包数据反序列化成Record对象
                    pif.rec = SerializeUtils.deserializeTxn(qp.getData(),
                            pif.hdr);
                    // 记录最后一次拿出来的zxid
                    lastQueued = pif.hdr.getZxid();
                    // 将反序列化之后的数据包对象保存到packetsNotCommitted集合
                    packetsNotCommitted.add(pif);
                    break;
                case Leader.COMMIT:
                    // 属于F5流程中处理PROPOSAL-COMMIT消息对的COMMIT消息
                    if (!snapshotTaken) {
                        // 还未接收到NERLEADER信息，因此snapshotTaken为false
                        // 代表需要使用执行ZooKeeperServer处理一遍请求，处理
                        // 之后便从packetsNotCommitted删除
                        pif = packetsNotCommitted.peekFirst();
                        // 只有当COMMIT消息是和上次接收到的PROPOSAL消息zxid
                        // 一致才处理请求，zxid一致说明是有效的PROPOSAL-
                        // COMMIT消息对
                        if (pif.hdr.getZxid() == qp.getZxid()) {
                            // 处理需要同步的请求消息
                            zk.processTxn(pif.hdr, pif.rec);
                            // 从未commit的集合中删除已经处理过的对象
                            packetsNotCommitted.remove();
                        }
                    } else {
                        // 如果snapshotTaken为true则说明该包已经处理过了
                        packetsCommitted.add(qp.getZxid());
                    }
                    break;
                case Leader.NEWLEADER:
                    // 开始F6流程
                    // 处理完Leader发送过来的PROPOSAL-COMMIT消息对后将会执行
                    // 到F6流程，处理NEWLEADER消息
                    // 创建updatingEpoch文件直到currentEpoch属性被赋值后删除
                    // updatingEpoch文件相当于是一个文件锁，保证在操作ZK的
                    // currentEpoch文件信息时仅有一个线程操作
                    File updating = new File(self.getTxnFactory()
                            .getSnapDir(), 
                            QuorumPeer.UPDATING_EPOCH_FILENAME);
                    // 如果文件不存在且创建文件失败则抛出创建文件异常
                    if (!updating.exists() && !updating.createNewFile()) {
                        throw new IOException();
                    }
                    // 前面已经把Leader的信息同步到本机器来了，现在只需要把
                    // 快照信息保存到日志文件中即可
                    zk.takeSnapshot();
                    // 设置本机器的currentEpoch属性且写入到currentEpoch文件
                    self.setCurrentEpoch(newEpoch);
                    // 操作完之后删除文件锁，删除失败抛出异常
                    if (!updating.delete()) {
                        throw new IOException();
                    }
                    // 快照被保存完之后设置snapshotTaken为true，不再处理
                    // PROPOSAL-COMMIT消息对
                    snapshotTaken = true;
                    // F6流程结束，后面略...
                }
            }
        }
    }
}
```

### 3.5 第五阶段：响应ACK消息

经过前面的四个阶段后Leader已经将需要同步的消息发送给对应的Follower且Follower也已经进行过处理了，之后便需要各Follower机器进行ACK响应，说明本流程已经结束。

#### 3.5.1 Follower - ACK确认

Follower直接发送ACK响应。源码如下：

```java
public class Follower extends Learner{
    void followLeader() throws InterruptedException {
        // 数据同步阶段，包括F5、F6、F7和F8流程
        syncWithLeader(newEpochZxid);
    }
    protected void syncWithLeader(long newLeaderZxid)
            throws IOException, InterruptedException{
        synchronized (zk) {
            outerLoop:
            while (self.isRunning()) {
                ...
                case Leader.NEWLEADER:
                    snapshotTaken = true;
                    // 续着F6流程结束，开始F7流程
                    // F7流程很简单，直接使用集群交换信息后的zxid响应ACK消息
                    writePacket(new QuorumPacket(Leader.ACK, newLeaderZxid,
                            null, null), true);
                    break;
                }
            }
        }
    }
}
```

#### 3.5.2 LearnerHandler - 接收ACK确认

当LearnerHandler接收到对应的Follower响应的ACK消息后将会进行相应的处理，并让Leader进行是否过半的校验。源码如下：

```java
public class LearnerHandler extends ZooKeeperThread {
    @Override
    public void run() {
        // H8流程开始
        // 创建一个新的QuorumPacket包对象
        qp = new QuorumPacket();
        // 读取Follower发送过来的ACK类型消息
        ia.readRecord(qp, "packet");
        // 如果不是ACK类型则直接退出
        if(qp.getType() != Leader.ACK){
            return;
        }
        // 使用Leader进行ACK集群响应过半的校验
        leader.waitForNewLeaderAck(getSid(), qp.getZxid(), 
                getLearnerType());
        // H8流程结束，后面略...
    }
}
```

#### 3.5.3 Leader - 验证ACK信息

集群中的Follower响应了ACK类型消息，LearnerHandler接收后将会调用Leader的方法进行响应过半校验。源码如下：

```java
public class Leader {
    // 标志Leader是否已经完成了集群ACK响应过半的校验，为true代表通过
    private boolean quorumFormed = false;
    // 其中包含NEWLEADER类型消息，含有Leader的zxid、epoch等信息
    Proposal newLeaderProposal = new Proposal();
    void lead() throws IOException, InterruptedException {
        // 续着L3流程结束，开始L4流程
        try {
            // Leader在L3结束之后便会执行到L4流程，在这里等待LearnerHandler
            // 接收对应的Follower响应ACK消息，如果集群过半机器未响应则一直阻塞
            // 直到过半机器响应才继续后续流程
            waitForNewLeaderAck(self.getId(), zk.getZxid(), 
                    LearnerType.PARTICIPANT);
        } catch (InterruptedException e) {
            // 如果等待集群过半响应失败则shutdown，准备下次选举流程
            shutdown();
            // 在这里会获取Leader所拥有的LearnerHanlder对象，并判断其是否
            // 有过半的机器，如果有则说明tickTime需要加大
            HashSet<Long> followerSet = new HashSet<Long>();
            // 轮询获取所有的已经创建成功的LearnerHanlder对象
            for (LearnerHandler f : learners)
                followerSet.add(f.getSid());
            // 判断LeadernerHandler是否过半，如果过半说明可能参数需要扩大
            if (self.getQuorumVerifier().containsQuorum(followerSet)) {
                // 进行改进意见提示
                LOG.warn("Enough followers present. "
                        + "Perhaps the initTicks need to be increased.");
            }
            // 睡眠tickTime时间，并且tick+1
            Thread.sleep(self.tickTime);
            self.tick++;
            return;
        }
    }
    public void waitForNewLeaderAck(long sid, long zxid, 
            LearnerType learnerType)
            throws InterruptedException {
        synchronized (newLeaderProposal.ackSet) {
            // 如果通过了校验则无需再进行校验，直接返回
            if (quorumFormed) {
                return;
            }
            // 获取Leader的zxid信息
            long currentZxid = newLeaderProposal.packet.getZxid();
            // 传进来的zxid正常流程一定是和Leader一致的，因为经过了数据同步
            // 和ACKEPOCH校验阶段后zxid已经保持了同步，不同步说明流程出现了
            // 问题，需要退出，算作对应Follower响应失败
            if (zxid != currentZxid) {
                return;
            }
            // 只有Follower实际选举参与者的ACK响应才算数
            if (learnerType == LearnerType.PARTICIPANT) {
                newLeaderProposal.ackSet.add(sid);
            }
            // 判断ackSet集合收到的sid数量是否过半
            if (self.getQuorumVerifier().containsQuorum(
                    newLeaderProposal.ackSet)) {
                // 执行到这说明集群内的Follower响应ACK消息已经过半，ACK校验
                // 正常通过，设置quorumFormed为true
                quorumFormed = true;
                // 唤醒原先等待ACK响应阻塞的线程
                newLeaderProposal.ackSet.notifyAll();
            } else {
                // 执行到这里说明响应机器尚未过半，需要阻塞并等待响应过半
                // 唤醒本线程
                // 记录阻塞开始时间  
                long start = System.currentTimeMillis();
                long cur = start;
                // 获取等待结束时间，在start时间加上initLimit和tickTime属性
                long end = start + 
                        self.getInitLimit() * self.getTickTime();
                // 一直轮询其它机器的响应情况，直到有其它的线程接收到响应且过半
                // 后将electionFinished设置为true，或者cur当前时间已经超过
                // 了end时间，代表响应已经超时了
                while (!quorumFormed && cur < end) {
                    // 一直等待直到end时间节点到来
                    newLeaderProposal.ackSet.wait(end - cur);
                    // 每次轮询更新cur为当前时间
                    cur = System.currentTimeMillis();
                }
                // 如果循环结束后quorumFormed依旧是false则说明在规定时间
                // 内集群没有过半的机器响应ACK类型信息，说明机器ACK响应
                // 信息失败，需要抛出中断异常，并开始下一次的选举
                if (!quorumFormed) {
                    throw new InterruptedException();
                }
            }
        }
    }
}
```

### 3.6 第六阶段：通知Follower更新状态

当第五阶段结束后LeaderHandler将会发送通知对应的Follower流程结束，更新机器状态的消息。

#### 3.6.1 LearnerHandler - 发送UPTODATE消息

本次续着前面的H8流程，分析一下H9流程，LearnerHandler对象向对应的Follower发送UPTODATE类型消息的过程。源码如下：

```java
public class LearnerHandler extends ZooKeeperThread {
    // 用来在进行ping操作时校验LearnerHandler对应维护的Follower是否存活
    // 当LearnerHandler接收到ACK或PROPOSAL类型消息的时候将会更新对象时间
    private SyncLimitCheck syncLimitCheck = new SyncLimitCheck();
    @Override
    public void run() {
        leader.waitForNewLeaderAck(getSid(), qp.getZxid(), 
                getLearnerType());
        // 续着H8流程结束，开始H9流程
        // 开始启动时间校验对象
        syncLimitCheck.start();
        // 先Socket已经连接成功，设置timeout为tickTime*syncTime
        sock.setSoTimeout(leader.self.tickTime * leader.self.syncLimit);
        // 在第七阶段会分析，当Leader校验ACK消息成功后将会启动ZK，这里需要等
        // ZooKeeperServer对象启动成功
        synchronized(leader.zk){
            // 每隔20ms便判断一次zk对象是否启动成功
            while(!leader.zk.isRunning() && !this.isInterrupted()){
                leader.zk.wait(20);
            }
        }
        // 发送UPTODATE给对应的Follower对象
        queuedPackets.add(new QuorumPacket(Leader.UPTODATE, -1, 
                null, null));
        //H9流程结束，后面略...
    }
}
```

#### 3.6.2 Follower - 接收处理UPTODATE消息

LeanerHandler发送UPTODATE类型消息后对应的Follower将会收到并进行处理。源码如下：

```java
public class Follower extends Learner{
    void followLeader() throws InterruptedException {
        // 数据同步阶段，包括F5、F6、F7和F8流程
        syncWithLeader(newEpochZxid);
    }
    protected void syncWithLeader(long newLeaderZxid)
            throws IOException, InterruptedException{
        synchronized (zk) {
            // 默认为false，当收到Leader机器发送的NEWLEADER信息后将会设置为
            // true，但在ZK1.0之前的版本是收到UPTODATE类型消息才设置为true
            boolean snapshotTaken = false;
            outerLoop:
            while (self.isRunning()) {
                ...
                case Leader.UPTODATE:
                    // 开始F8流程处理
                    // 接收到LearnerHandler发送过来的UPTODATE类型消息
                    if (!snapshotTaken) {
                        // 如果Follower接收了NEWLEADER类型消息，将不会执行
                        // 到这里面，否则将会执行到这里保存快照信息
                        zk.takeSnapshot();
                        // 设置currentEpoch信息
                        self.setCurrentEpoch(newEpoch);
                    }
                    // 关联ServerCnxnFactory和ZooKeeperServer对象关系
                    self.cnxnFactory.setZooKeeperServer(zk);
                    // 结束outerLoop节点，跳出循环，F8流程结束
                    break outerLoop;
            }
        }
    }
}
```

### 3.7 第七阶段：循环常态化处理

经过前面六个阶段的通信，Leader终于把需要同步的信息同步完成，并且也完成了集群内各个Follower和Leader的zxid、epoch信息同步，确定了超过半数的机器可用等等操作，接下来只需要维持当前的通信状态即可。

#### 3.7.1 Leader - 启动ZooKeeperServer并进入心跳检测

从Leader开始分析其进入循环常态化的代码，这部分代码的作用就是关于启动ZooKeeperServer对象和维持集群内机器的心跳检测。关键源码如下：

```java
public class Leader {
    void lead() throws IOException, InterruptedException {
        // 续着L4流程结束，L5流程开始
        // 首先启动ZooKeeperServer对象
        startZkServer();
        // 读取initialZxid属性，当时不建议使用该配置，除非真有自定义zxid的
        // 特殊场景，否则一切应以zk自身的zxid为主
        String initialZxid = System
                .getProperty("zookeeper.testingonly.initialZxid");
        if (initialZxid != null) {
            long zxid = Long.parseLong(initialZxid);
            // 确保zxid只会影响zxid的后32位，不会影响前面的32位，因为zxid的
            // 前面32位保存的是epoch信息，后面32位才是zxid的实际值
            zk.setZxid((zk.getZxid() & 0xffffffff00000000L) | zxid);
        }
        // 配置Leader是否参与处理ZK客户端的请求，默认是yes，如果设置为false
        // Leader机器的ServerCnxnFactory对象将不会有对应的ZooKeeperServer
        // 进行处理，收到Request请求后准备处理时将会抛异常
        if (!System.getProperty("zookeeper.leaderServes", "yes")
                .equals("no")) {
            // 默认为no，会让Leader参与接收ZK的请求处理
            self.cnxnFactory.setZooKeeperServer(zk);
        }
        // L5流程结束，L6流程开始
        boolean tickSkip = true;
        // 开始无限循环进行集群心跳检测
        while (true) {
            // 每隔tickTime/2时间循环一次
            Thread.sleep(self.tickTime / 2);
            if (!tickSkip) {
                // 每隔一个tickTime将会把tick值+1
                self.tick++;
            }
            // 用来保存本次循环哪些sid机器是有效的
            HashSet<Long> syncedSet = new HashSet<Long>();
            // 本机器肯定是有效的，先加上
            syncedSet.add(self.getId());
            // 遍历Leader下所有的LearnerHandler对象
            for (LearnerHandler f : getLearners()) {
                // 这个if会判断LeaderHandler维护的Follower是否已经失去连接
                if (f.synced() && 
                        f.getLearnerType() == LearnerType.PARTICIPANT) {
                    // 如果没有失去连接则将其sid添加到syncedSet集合中
                    syncedSet.add(f.getSid());
                }
                // 使用LearnerHandler进行ping操作
                f.ping();
            }
            // 每隔tickTime将会使用该if判断
            if (!tickSkip && 
                  !self.getQuorumVerifier().containsQuorum(syncedSet)) {
                // 进入到这里面说明集群内已经有超过半数的机器失去连接，直接
                // 调用shutdown方法，准备下次选举流程
                shutdown();
                // 退出循环
                return;
            }
            // 确保进行一些重要操作是每隔tickTime调用一遍
            tickSkip = !tickSkip;
        }
    }
}
```

#### 3.7.2 LearnerHandler - 循环接收对应Follower消息

接下来为LearnerHandler的循环常态化代码，起作用就是维持Leader和各个Learner机器的通信。源码如下：

```java
public class LearnerHandler extends ZooKeeperThread {
    // 截止到下次通信的结束时间，在建立通信连接阶段该属性是基于initLimit属性和
    // syncLimit属性往上加的，当完成建立通信连接过程后将会以syncLimit属性往上
    // 加，一旦超出这个属性就代表本对象维护的Socket对象连接机器已经失联了
    volatile long tickOfNextAckDeadline;
    @Override
    public void run() {
        try {
            // 续着H9流程结束，H10流程开始
            // 进行无限循环和对应的Follower或者Observer机器进行通信，接收消息
            // 是在这里接收的，发送消息是通过另一个线程对象循环queuedPackets
            // 集合的数据包对象发送的
            while (true) {
                // 创建新的数据包对象
                qp = new QuorumPacket();
                // 从Follower读取数据包消息
                ia.readRecord(qp, "packet");
                // 每次从Follower接收到对象后便更新tickOfNextAckDeadline
                // 以确保Leader对象进行心跳检测时能获取最新的截止时间
                tickOfNextAckDeadline = leader.self.tick + 
                        leader.self.syncLimit;
                // 后续便是ZK集群接收ZK客户端Request请求的通信流程部分，留到
                // 后一篇文章再分析，H10流程结束
                switch (qp.getType()) {
                case Leader.ACK:
                    ...
                    break;
                case Leader.PING:
                    ...
                    break;
                case Leader.REVALIDATE:
                    ...
                    break;
                case Leader.REQUEST:
                    ...
                    break;
                default:
                    break;
                }
            }
        }// 异常处理忽略...如果抛出异常则会开始下一次选举流程
    }
}
```

#### 3.7.3 Follower- 循环接收对应LearnerHandler消息

接下来为Follower执行F9和F10流程，开始启动ZooKeeperServer对象以及进入循环常态化来接收LearnerHandler发送过来的消息。源码如下：

```java
public class Follower extends Learner{
    void followLeader() throws InterruptedException {
        // 数据同步阶段，现在仅剩F9流程
        syncWithLeader(newEpochZxid);
        // 开始F9流程
        // 开始创建数据包对象从LearnerHandler对象接收消息
        QuorumPacket qp = new QuorumPacket();
        // 开始死循环，知道集群对象停止运行
        while (self.isRunning()) {
            // 读取包对象
            readPacket(qp);
            // 开始处理读取到的包对象，具体留在后续文章分析
            processPacket(qp);
        }
    }
    protected void syncWithLeader(long newLeaderZxid)
            throws IOException, InterruptedException{
        // 续着F8流程结束，F9流程开始
        // 当和Leader机器的数据同步流程和ACK确认流程完成之后把Socket的timeout
        // 时间由tickTime*initTime设置为tickTime*syncLimit
        sock.setSoTimeout(self.tickTime * self.syncLimit);
        // 启动FollowerZooKeeperServer对象，和ServerCnxnFactory对象的关联
        // 在F8流程中完成的
        zk.startup();
        // 设置当前机器的最新epoch信息
        self.updateElectionVote(newEpoch);
        // 这里的zk对象类型一定是FollowerZooKeeperServer
        if (zk instanceof FollowerZooKeeperServer) {
            FollowerZooKeeperServer fzk = (FollowerZooKeeperServer)zk;
            // 将前面同步PROPOSAL-COMMIT消息对尚未提交的包信息再次处理
            for(PacketInFlight p: packetsNotCommitted) {
                // 调用保存到日志文件且同步到集群各个机器的操作
                fzk.logRequest(p.hdr, p.rec);
            }
            // 将已经提交的zxid信息调用commit方法
            for(Long zxid: packetsCommitted) {
                fzk.commit(zxid);
            }
        } else if (zk instanceof ObserverZooKeeperServer) {
            // Observer暂不分析...
        } else {
            // 目前zk的类型只能是Foolower或Observer，如果是其它类型说明有问题
            throw new UnsupportedOperationException();
        }
    }
}
```

至此，建立通信连接的整个26个流程便分析完毕，接下来的流程便是ZK集群接收ZK客户端的请求并在集群内进行同步的操作了，这个留在下篇文章进行分析，至此告一段落。
