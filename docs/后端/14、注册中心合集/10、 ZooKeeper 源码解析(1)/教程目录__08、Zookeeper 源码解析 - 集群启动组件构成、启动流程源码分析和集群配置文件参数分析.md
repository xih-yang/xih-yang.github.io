# 08、Zookeeper 源码解析 - 集群启动组件构成、启动流程源码分析和集群配置文件参数分析
- 来源：https://ddkk.com/zhuanlan/registered/zookeeper/1/8.html
- 分类：注册中心
- 分组：教程目录
## 一、集群组件构成

### 1.前话

从本篇开始便是有关ZK集群有关原理源码结构分析了，前面的七篇文章已经把Server端和Client端的交互流程和原理源码分析的差不多了。接下来的几篇文章有关前面七篇文章的内容将会简略带过，不会再分析一遍。

关于ZK集群的关键要点个人认为有五点：

**1、** 集群基础型架构；

**2、** 集群的通信方式；

**3、** 集群的选举流程；

**4、** 集群的副本同步方式；

**5、** 接收ZK客户端的请求同步通信方式；

因此接下来的几篇将会从这五个方面来分析ZK集群，本篇只会分析第一个要点：集群基础性架构，来分析ZK集群最基础的组件有哪些，以及它们的关系构成又是如何，打下一个基础。另外本篇还会简要分析一下集群启动类的简要流程以及配置文件的通用参数。但本篇对于选举流程的细节和选举成功后的广播不会做过多分析，留到后续篇幅再仔细分析。

**注：本篇基于ZK版本3.4.8分析的。**

### 2.集群基本组件

启动流程中的基本组件图：

从图中可以看到基本组件有十个，但实际上其关键作用的组件只有六个，接下来详细介绍下这些基本组件的功能及关系：

**1、** QuorumPeerMain：ZK集群启动的入口类，也可以是单机ZK的入口类，配置集群启动必须使用配置文件且里面一定要配置Server信息，否则会被当做单机的ZK启动；

**2、** QuorumPeerConfig：ZK集群配置文件的解析类，负责读取配置文件以及解析集群的各种参数，包括配置文件的参数校验限制以及默认值处理等；

**3、** DatadirCleanupManager：定期清理日志文件的组件，可设置清理的周期以及最小的文件保留数；

**4、** QuorumPeer：重要组件之一，ZK集群运行的基本类，关于集群的选举、lead操作、follow操作和observe操作都是这个线程类异步执行的，相当于ZK集群的任何重要操作都是这个类发起的，可以把这个类看成是ZK集群所有操作的源头；

**5、** QuorumServer：用来维护ZK集群中其它机器信息的对象；

**6、** Election：重要组件之一，ZK集群选举算法的父类接口，集群默认的选举算法实现组件为FLE算法，即途中的FastLeaderElection实现类，为快速选举领导算法，后面分析选举流程原理时再去分析其里面的流程合作用；

**7、** WorkerSender和WorkerReceiver对：重要组件之一，负责向QuorumCnxManager组件发送和接收消息，属于FLE选举算法和ZK其它组件交互的重要组件，其中WorkerReceiver接收到外部消息时会对其进行一系列的判断，并和选举流程挂钩，而WorkerSender则是负责选举流程时对外发送选举信息；

**8、** QuorumCnxManager：重要组件之一，ZK集群间的连接维护类，有关集群间的Socket连接和和维护都是在这里面完成的，对内和FLE的选举流程通信，对外和ZK集群的其它机器通信；

**9、** Listener：重要组件之一，负责监听其它客户端连接本机器，ServerSocket就是在这个线程类中初始化绑定的，选举时当有外部机器连接到本机器时将会接收连接进来的Socket，并对其进行一定的判断生成SendWorker和RecvWorker对；

**10、** SendWorker和RecvWorker对：重要组件之一，每对负责维护一个机器，本机器和另一个机器的发送接收通信都是由这一对来完成的，集群内有N个机器，本机器内将会维护N-1对来负责和另外的N-1台机器进行通信；

### 3.启动流程分析

启动流程图如下：

上图为涉及到启动基本组件的流程图，从上图可以大概看出来啥时候初始化了哪些重要组件，接下来详细说明一下各个步骤的细节：

- S1:当在机器上使用ZK的脚本启动ZK程序时，现在使用的都是QuorumPeerMain类型，如果是单机的配置文件不配置集群机器信息或者直接把单机的参数传进来就可以做到单机启动ZK；
- S2:读取文件并解析文件参数时，会加入很多参数校验，如只能是Follower或者Observer校验，清理日志文件最小保留数为3，必要参数为空异常等，如果启动ZK出现了这些问题便可以去看ZK这部分的源码，哪些参数配置出了问题一目了然，这也是看源码的一大好处，自给自足；
- S3:启动日志清理组件，如果配置文件的purgeInterval参数为空或者0，则意味着这个组件不启动，不会定时清理日志文件；
- S4:这一步便是判断本机器是单机启动还是集群启动，如果传入的参数只有一个且集群机器大于0则执行集群模式，否则执行单机模式；
- S5:单机模式启动便是前面七篇所讲解的那样，翻看前面七篇便足够；
- S6:集群启动时将会把从文件解析出来的配置全部设置到QuorumPeer集群类，这个流程也会设置ServerCnxnFactory，和Client端先实例化ServerCnxnFactory对象一样；
- S7:这个流程将会加载本机器先前的日志文件，初始化关机前的状态，如果是第一次启动则可以忽略，除了加载日志文件也会根据electionType参数来初始化选举算法对象；
- S8:如果未配置electionType将会使用默认的FLE选举算法，在这个流程机器会把当前投票投给自己，随后初始化后续的一系列组件，先会初始化QuorumCnxManager对象，和其内部的组件，包括组件Listener和内部的一系列集合；
- S9:初始化QuorumCnxManager之后将会启动Listener监听器，这个监听器的作用便是用来监听选举时的通信连接并为其创建对应的SendWorker和RecvWorker对；
- T1:Listener是一个异步线程，在S9被启动后就会一直监听electionAddr地址，这个地址后面解析配置文件时会介绍，当有新的机器连接到这个地址时会进行一系列的判断使用SendWorker和RecvWorker对来维护通信连接；
- S10:这个流程会初始化选举参数，并创建和QuorumCnxManager进行通信交换的集合，需要注意的是FastLeaderElection里面的通信集合和QuorumCnxManager中的通信集合非常相似，在分析源码时稍微不注意可能就被绕晕了，后面分析选举流程时这个会进行区分；
- S11:这个流程会创建WorkerSender和WorkerReceiver对来维持和QuorumCnxManager组件的通信，这个通信对是在QuorumCnxManager中的Messenger创建，且是守护线程，一直会存在。

当初始化完上述的流程后ZK集群的启动便结束了，接着往下分析便是选举流程，这个流程十分有意思且复杂，后续文章会仔细分析。

## 二、配置文件参数分析

### 1.配置文件实例

```java
# 基本配置
dataDir=/test
dataLogDir=/test/log
clientPort=2088
clientPortAddress=172.0.0.1
# 时间配置
tickTime=3000
maxClientCnxns=100
minSessionTimeout=1500
maxSessionTimeout=3000
initLimit=1500
syncLimit=1500
# 可替换的参数
electionAlg=3
quorumListenOnAllIPs=false
peerType=participant
syncEnabled=true
cnxTimeout=5000
# 自动清理参数
autopurge.purgeInterval=50000
autopurge.snapRetainCount=10
# 服务器参数，包括自身的
server.1=172.0.0.1:20888:20882:participant
server.2=172.0.0.2:20888:20882:participant
server.3=172.0.0.3:20888:20882:participant
```

### 2.参数解析表

参数名

参数说明

dataDir

存储快照文件snapshot的目录。默认情况下，事务日志也会存储在这里。建议同时配置参数dataLogDir, 事务日志的写性能直接影响zk性能

dataLogDir

事务日志输出目录。尽量给事务日志的输出配置单独的磁盘或是挂载点，这将极大的提升ZK性能

clientPort

客户端连接server的端口，即对外服务端口，一般设置为2181

clientPortAddress

对于多网卡的机器，可以为每个IP指定不同的监听端口。默认情况是所有IP都监听clientPort指定的端口

tickTime

ZK中的一个时间单元。ZK中所有时间都是以这个时间单元为基础，进行整数倍配置的

maxClientCnxns

单个客户端与单台服务器之间的连接数的限制，是ip级别的，默认是60，如果设置为0，那么表明不作任何限制

minSessionTimeout

session超时时间最小限制，如果客户端设置的超时时间不在这个范围，那么会被强制设置为最大或最小时间

maxSessionTimeout

session超时时间最大限制，如果客户端设置的超时时间不在这个范围，那么会被强制设置为最大或最小时间

initLimit

Follower在启动过程中，会从Leader同步所有最新数据，然后确定自己能够对外服务的起始状态。Leader允许Follower在initLimit时间内完成这个工作

syncLimit

在运行过程中，Leader负责与ZK集群中所有机器进行通信，例如通过一些心跳检测机制，来检测机器的存活状态。如果Leader发出心跳包在syncLimit之后，还没有从Follower那里收到响应，那么就认为这个Follower已经不在线了

cnxTimeout

在调用connect()方法连接其它的选举算法通信Socket时的连接时间，默认为5S

electionAlg

允许我们选择leader选举算法，”0”对应于原始的基于UDP的版本，“1”对应于快速Leader选举基于UDP的无身份验证的版本，“2”对应于快速Leader选举有基于UDP的身份验证的版本，而“3”对应于快速Leader选举基于TCP的版本，默认为3

quorumListenOnAllIPs

该参数设置为true，Zookeeper服务器将监听所有可用IP地址的连接。他会影响ZAB协议和快速Leader选举协议。默认是false

peerType

集群类型，observer或者participant

syncEnabled

和参与者一样，观察者现在默认将事务日志以及数据快照写到磁盘上，这将减少观察者在服务器重启时的恢复时间。将其值设置为“false”可以禁用该特性。默认值是“true”

autopurge.purgeInterval

ZK提供了自动清理事务日志和快照文件的功能，这个参数指定了清理频率，单位是小时，需要配置一个1或更大的整数，默认是0，表示不开启自动清理功能

autopurge.snapRetainCount

这个参数和上面的参数搭配使用，指定了需要保留的文件数目。默认是保留3个

server.sid1=host:port:electionPort:type

server.sid2=host:port:electionPort

server.sid3=host:port

配置的server信息，只有下面三种配置方式，sid1则是本机器的编号，一般配置为整数，port为配置该server和集群中的leader交换信息所使用的的端口，electionPort为配置选举leader时所使用的端口，type的类型是observer或participant

test

其它的配置将会按照zookeeper.前缀存到Java的系统环境对象中，如手动配置了下面的test，系统变量将会有zookeeper.test属性

### 3.参数细节说明

- 参数中有clientPort和clientPortAddress，这两个参数是和ZK的Client端对接的，平时使用ZK的Client端链接ZK的Server端使用的便是clientPortAddress:clientPort组合；
- 在server的配置中有也有host:port:electionPort这种的配置，这个配置和前面的clientPort和clientPortAddress组合面向的对象是不一样的，server配置的地址和端口都是ZK集群在选举流程和广播模式中使用的，如port为该server和leader同步信息使用的端口，而electionPort则是选举时发送选举信息而使用的接口，不能和clientPortAddress:clientPort配置混淆；
- 使用ZK集群时，ZK集群的Leader也会进行心跳检测来判断哪些机器失效了，心跳检测的间隔时间则是二分之一个tickTime，经过一个tickTime会在本机判断一次是否有半数的机器失效，所以并不是每次心跳检测都会判断其它机器的存货状态的；
- ZK集群都是通过Socket长连接来进行通信的，因此Socket的失效时间timeout也是需要关注的，这就涉及到了tickTime、initLimit和syncLimit三个参数，当开始进行Socket连接时，失效时间被设置成tickTime*initLimit，当接收到了消息返回失效时间将会改成tickTime*syncLimit；
- 需要注意的是ACK的失效时间也是initLimit、syncLimit相关的，机器间的ACK过期时间的初始值是tick（值是每次ping+1）+initLimit+syncLimit，以后的ACK失效时间都是每次通信后增加tick+syncLimit。

## 三、启动流程源码分析

接下来进行一个简单的ZK集群启动源码分析，只会分析启动源码，至于线程的运行、选举和广播同步的分析留到下几篇来分析。

### 1.启动类QuorumPeerMain

其关键部分源码如下：

```java
public class QuorumPeerMain {
    public static void main(String[] args) {
        // 熟悉的启动主函数，linux或者windows便是调用这个把参数传进来启动ZK的
        QuorumPeerMain main = new QuorumPeerMain();
        try {
            main.initializeAndRun(args);
        }...
        // catch块忽略
    }
    protected void initializeAndRun(String[] args)
        throws ConfigException, IOException {
        QuorumPeerConfig config = new QuorumPeerConfig();
        if (args.length == 1) {
            // 如果参数长度只有一个，说明这个参数是配置文件路径
            // 读取配置文件并解析其中的参数
            config.parse(args[0]);
        }
        // 启动定时清理日志文件的组件，里面启动也是有参数判断的，后续分析
        DatadirCleanupManager purgeMgr = new DatadirCleanupManager(config
                .getDataDir(), config.getDataLogDir(), config
                .getSnapRetainCount(), config.getPurgeInterval());
        // 启动线程对象
        purgeMgr.start();
        // 如果参数只有一个（配置文件路径）切server的信息要
        // 大于0才调用启动集群方法
        if (args.length == 1 && config.servers.size() > 0) {
            // 调用集群启动方法
            runFromConfig(config);
        } else {
            // 否则调用启动单机启动的方法，这里不再分析
            ZooKeeperServerMain.main(args);
        }
    }
    public void runFromConfig(QuorumPeerConfig config) throws IOException {
      try {
          // 注册log日志对象
          ManagedUtil.registerLog4jMBeans();
      }// catch块忽略...
      try {
          // 创建ServerCnxnFactory工厂对象，默认类型是NIOServerCnxnFactory
          ServerCnxnFactory cnxnFactory = ServerCnxnFactory
                  .createFactory();
          // 配置和ZK的Client对接的地址参数以及最大可接受一个IP的连接数
          cnxnFactory.configure(config.getClientPortAddress(),
                                config.getMaxClientCnxns());
          // 实例化集群实例，ZK集群在执行时最顶层的对象便是QuorumPeer
          quorumPeer = new QuorumPeer();
          // 下面是设置集群参数的语法，在此略过
          ...
          // 启动集群对象
          quorumPeer.start();
          // 等待集群对象内部结束，否则main线程将不会结束
          quorumPeer.join();
      }// catch块忽略...
    }
}
```

QuorumPeerMain的作用很简单，调用配置解析类读取解析配置，并启动相关集群组件。

### 2.文件解析类QuorumPeerConfig

源码如下：

```java
public class QuorumPeerConfig {
    public void parse(String path) throws ConfigException {
        // 根据配置文件生成文件对象
        File configFile = new File(path);
        try {
            if (!configFile.exists()) {
                throw new IllegalArgumentException(configFile.toString()
                        + " file is missing");
            }
            // 加载配置属性文件到Properties对象中
            Properties cfg = new Properties();
            FileInputStream in = new FileInputStream(configFile);
            try {
                cfg.load(in);
            } finally {
                in.close();
            }
            // 开始解析文件属性以及进行一些简单的必填参数校验了
            // 这里略过，如果有关配置文件解析校验相关的错误基本上都可以
            // 在这个方法中找到对应的判断逻辑
            parseProperties(cfg);
        }// catch块忽略...
    }
}
```

只介绍关键的部分，诸如具体的解析逻辑很简单，看下源码便可以理解。

### 3.日志文件处理器DatadirCleanupManager

源码如下：

```java
public class DatadirCleanupManager {
    private PurgeTaskStatus purgeTaskStatus = PurgeTaskStatus.NOT_STARTED;
    public DatadirCleanupManager(String snapDir, String dataLogDir, 
            int snapRetainCount,
        int purgeInterval) {
        // 设置需要的参数
        this.snapDir = snapDir;
        this.dataLogDir = dataLogDir;
        this.snapRetainCount = snapRetainCount;
    }
    public void start() {
        // purgeTaskStatus的初始状态是NOT_STARTED
        if (PurgeTaskStatus.STARTED == purgeTaskStatus) {
            return;
        }
        // 如果间隔时间没有配置或者小于0本清理器将不会执行
        if (purgeInterval <= 0) {
            LOG.info("Purge task is not scheduled.");
            return;
        }
        // 启动一个Timer来执行定期清理的操作
        timer = new Timer("PurgeTask", true);
        TimerTask task = new PurgeTask(dataLogDir, snapDir, 
                snapRetainCount);
        timer.scheduleAtFixedRate(task, 0, 
                TimeUnit.HOURS.toMillis(purgeInterval));
        // 设置状态为已启动
        purgeTaskStatus = PurgeTaskStatus.STARTED;
    }
}
```

本次只简略的分析启动流程，具体组件的运行留到以后的专题再来分析吧。

### 4.ZK集群对象QuorumPeer

源码如下：

```java
public class QuorumPeer extends ZooKeeperThread 
        implements QuorumStats.Provider {
    // 集群连接管理对象
    QuorumCnxManager qcm;
    // 当前的Leader选举的机器投票信息
    volatile private Vote currentVote;
    // 用来在文件中记录currentEpoch属性的名称
    public static final String CURRENT_EPOCH_FILENAME = "currentEpoch";
    // 用来在文件中记录acceptedEpoch属性的名称
    public static final String ACCEPTED_EPOCH_FILENAME = "acceptedEpoch";
    // 文件更新锁文件，当集群对象或者Learner对象修改日志文件快照的时候
    // 将会创建一个updatingEpoch文件，此时将不会允许其它的集群对象或者Learner
    // 对象来修改操作日志快照文件，否则将会报错
    public static final String UPDATING_EPOCH_FILENAME = "updatingEpoch";
    // 在集群中本机器的地址端口信息
    private InetSocketAddress myQuorumAddr;
    // 选举算法类型
    private int electionType;
    // 具体的选举算法对象
    Election electionAlg;
    @Override
    public synchronized void start() {
        // 加载文件数据
        loadDataBase();
        // 启动和客户端连接的工厂对象用来接受Client端的连接，单机的已经分析过
        // 这里便略过
        cnxnFactory.start(); 
        // 开始选举算法的初始化
        startLeaderElection();
        // 启动父类线程对象
        super.start();
    }
    private void loadDataBase() {
        // 创建updatingEpoch文件锁
        File updating = new File(getTxnFactory().getSnapDir(),
                               UPDATING_EPOCH_FILENAME);
        try {
          // 加载日志文件
          zkDb.loadDataBase();
          // 根据日志加载的文件获取最新的zxid，如果是第一次则值为0，否则为
          // 关闭前的最后一个zxid
          long lastProcessedZxid = zkDb.getDataTree().lastProcessedZxid;
          // 从zxid中获取epoch参数，zxid的后32位则是epoch参数
          long epochOfZxid = ZxidUtils.getEpochFromZxid(lastProcessedZxid);
          try {
               // 从currentEpoch文件中读取当前的epoch值
               currentEpoch = readLongFromFile(CURRENT_EPOCH_FILENAME);
               // 判断日志文件中的epoch是否大于当前的epoch，如果是且
               // updatingEpoch文件锁存在则设置当前的currentEpoch为新epoch
               if (epochOfZxid > currentEpoch && updating.exists()) {
                  setCurrentEpoch(epochOfZxid);
                  if (!updating.delete()) {
                      throw new IOException();
                  }
               }
           }// catch块忽略...
        }// catch块忽略...
   }
   synchronized public void startLeaderElection() {
        try {
           // 先将投票投给自己
           currentVote = new Vote(myid, getLastLoggedZxid(), 
                   getCurrentEpoch());
        }// catch块忽略
        // 遍历配置文件中的server，找到和dataDir中myid一样的server配置，然后将
        // 地址信息赋值给myQuorumAddr对象
        for (QuorumServer p : getView().values()) {
            if (p.id == myid) {
                myQuorumAddr = p.addr;
                break;
            }
        }
        // server中一定要有和dataDir中的myid一样的配置，否则将会抛异常
        if (myQuorumAddr == null) {
            throw new RuntimeException();
        }
        // 现在使用最多的便是electionType=3，因此这里便不分析了，只分析FLE算法
        if (electionType == 0) {
            ...
        }
        // 根据electionType来创建相应的选举算法
        this.electionAlg = createElectionAlgorithm(electionType);
    }
    protected Election createElectionAlgorithm(int electionAlgorithm){
        Election le=null;
        // 根据传进来的electionType来实例化具体的选举算法，只分析3=FLE算法
        switch (electionAlgorithm) {
        ...
        case 3:
            // 创建集群连接管理对象，并把当前集群对象传进去
            qcm = new QuorumCnxManager(this);
            // listener组件是在QuorumCnxManager中实例化的，直接获取即可
            QuorumCnxManager.Listener listener = qcm.listener;
            if(listener != null){
                // 启动listener组件线程对象，开始接收并监听其它机器的连接操作
                listener.start();
                // 创建对应的FLE算法对象FastLeaderElection
                le = new FastLeaderElection(this, qcm);
            }
            break;
        default:
            assert false;
        }
        return le;
    }
}
```

### 5.集群连接管理对象QuorumCnxManager

源码如下：

```java
public class QuorumCnxManager {
    public QuorumCnxManager(QuorumPeer self) {
        // 初始化recvQueue、queueSendMap、和senderWorkerMap集合对象，用来
        // 接收和集群间的机器消息信息
        this.recvQueue = new ArrayBlockingQueue<Message>(RECV_CAPACITY);
        this.queueSendMap = 
            new ConcurrentHashMap<Long, ArrayBlockingQueue<ByteBuffer>>();
        this.senderWorkerMap = new ConcurrentHashMap<Long, SendWorker>();
        this.lastMessageSent = new ConcurrentHashMap<Long, ByteBuffer>();
        // 读取选举时调用方法connect()连接其它机器的选举通信Socket时的参数
        String cnxToValue = System.getProperty("zookeeper.cnxTimeout");
        if(cnxToValue != null){
            this.cnxTO = new Integer(cnxToValue); 
        }
        this.self = self;
        // 创建监听其它机器连接本机器的Socket监听器
        listener = new Listener();
    }
}
```

至此启动时的相关组件源码分析便到此为止，本次源码分析只是最基本的说明启动流程中的重要组件和配置文件解析等具体是在哪个位置的，而对于选举流程和广播同步流程涉及到的组件只能在分析其流程的时候分析。
