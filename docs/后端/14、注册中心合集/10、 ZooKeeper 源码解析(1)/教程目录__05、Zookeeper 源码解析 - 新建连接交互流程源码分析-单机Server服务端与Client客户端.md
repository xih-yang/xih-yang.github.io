# 05、Zookeeper 源码解析 - 新建连接交互流程源码分析-单机Server服务端与Client客户端
- 来源：https://ddkk.com/zhuanlan/registered/zookeeper/1/5.html
- 分类：注册中心
- 分组：教程目录
## 一、重要源码分析

经过上一篇文章的流程图，对于ZK新建连接的大致流程应该了解的差不多了，接下来开始进行详细的代码分析，同样是三步走，在进行阅读时可以根据前面的流程图一步一步跟着源码走，这样阅读起来会更加的清晰方便。

上一篇地址：[（四）Zookeeper原理源码分析之单机Server服务端与Client客户端新建连接交互流程分析](/zhuanlan/registered/zookeeper/1/4.html)。

需要注意的是，ZK的很多代码构成都是通过内部类完成的，因此等下分析源码时可能方法名不会按源码的方式组排，只是简单的展示源码的大致流程和作用。

### 1.Client端发起连接

#### 1.1 ZooKeeper入口类

前面说过，ZooKeeper是ZK客户端的API类，连接以及其它的操作都是以这个类为入口的，接下来看下其新建连接的对外接口：

```java
public class ZooKeeper {
    protected final ClientCnxn cnxn;
    private final ZKWatchManager watchManager = new ZKWatchManager();
    public ZooKeeper(String connectString, int sessionTimeout, 
            Watcher watcher) throws IOException {
        // 一般而言新建连接都是使用的这个接口
        this(connectString, sessionTimeout, watcher, false);
    }
    public ZooKeeper(String connectString, int sessionTimeout, 
            Watcher watcher, boolean canBeReadOnly) throws IOException {
        // 这是平常新建连接最终调用进来的构造参数，另外的带密码的便不分析了
        // 本次流程分析的都是免密连接的
        // 将外部传入的Watcher监听器当成默认的监听器，新建连接的各种事件都会
        // 触发这个监听器的方法，平时用的时候把这个看成是连接事件相关的监听器即可
        watchManager.defaultWatcher = watcher;
        // 对传入的连接串进行解析
        ConnectStringParser connectStringParser = new ConnectStringParser(
                connectString);
        // 获取host和port对应的数据提供对象
        HostProvider hostProvider = new StaticHostProvider(
                connectStringParser.getServerAddresses());
        // Client端真正和Server端打交道的类
        cnxn = new ClientCnxn(connectStringParser.getChrootPath(),
                hostProvider, sessionTimeout, this, watchManager,
                getClientCnxnSocket(), canBeReadOnly);
        // 开始启动客户端连接类内部线程
        cnxn.start();
    }
}
```

#### 1.2 ClientCnxn连接交互类

这个类里面有EventThread和SendThread，这两个内部类是ZK交互时最重要的两个类，前面也提过，接下来看下ClientCnxn是如何启动初始化这两个内部线程类的。

```java
public class ClientCnxn {
    // 当Client端的数据包Packet被发送出去时，如果不是ping和auth两种操作类型，其
    // 它操作类型的包都会保存在队列末尾，代表着已发送但未完成的数据，在最后Client
    // 端收到ZK的响应时，将会把队列第一个拿出来进行响应的处理。采用的是FIFO模式，
    // 是因为ZK的Server端接收请求处理请求是有序的，处理完前面一个才会处理后面一个
    // 因此客户端可以采用FIFO的模式处理
    private final LinkedList<Packet> pendingQueue = 
            new LinkedList<Packet>();
    // 发送队列，当Client端有请求需要发送时将会封装成Packet包添加到这里面，在
    // SendThread线程轮询到有数据时将会取出第一个包数据进行处理发送。使用的也是
    // FIFO模式
    private final LinkedList<Packet> outgoingQueue = 
            new LinkedList<Packet>();
    // 连接时间，初始化时等于客户端sessionTimeout / 可用连接串数量，如果连接成功
    // 后将会等于协约时间negotiatedSessionTimeout / 可用连接串数量，因此正常
    // 而言，此值就是negotiatedSessionTimeout / 可用连接串数量
    private int connectTimeout;
    // 协约时间，ZK的Server端会设置tickTime，Client端会传sessionTimeout，ZK的
    // Server端将会根据两边的配置进行计算得出两边都能接受的时间，然后返回。这个
    // 字段保存的就是协商之后的session过期时间
    private volatile int negotiatedSessionTimeout;
    // 读取过期时间，连接时值为sessionTimeout * 2 / 3，当连接成功后值为
    // negotiatedSessionTimeout * 2 / 3
    private int readTimeout;
    // 开发人员自己定义的客户端过期时间sessionTimeout（注意这个时间并不是最终
    // Client端运行时的心跳检测时间，后续会出一篇这些时间的具体作用以及计算规则）
    private final int sessionTimeout;
    // 入口类的引用对象
    private final ZooKeeper zooKeeper;
    // 客户端的监听器管理类，包含了默认监听器和三种不同类型的监听器
    private final ClientWatchManager watcher;
    // 本客户端连接实例的sessionId
    private long sessionId;
    // 是否只可读
    private boolean readOnly;
    // 将来将会被删除，暂时不知道有何用
    final String chrootPath;
    // Client端对Server端发送和接收消息的线程对象
    final SendThread sendThread;
    // Client端负责处理响应事件的线程对象
    final EventThread eventThread;
    // Client端的连接是否已经关闭
    private volatile boolean closing = false;
    // 连接串的解析后获得的InetSocketAddress提供对象
    private final HostProvider hostProvider;
    public ClientCnxn(String chrootPath, HostProvider hostProvider, 
            int sessionTimeout, ZooKeeper zooKeeper, 
            ClientWatchManager watcher, ClientCnxnSocket clientCnxnSocket, 
            boolean canBeReadOnly) throws IOException {
        // 没有连接密码的构造函数
        this(chrootPath, hostProvider, sessionTimeout, zooKeeper, watcher,
             clientCnxnSocket, 0, new byte[16], canBeReadOnly);
    }
    public ClientCnxn(String chrootPath, HostProvider hostProvider, 
            int sessionTimeout, ZooKeeper zooKeeper,
            ClientWatchManager watcher, ClientCnxnSocket clientCnxnSocket,
            long sessionId, byte[] sessionPasswd, boolean canBeReadOnly) {
        // 最终调用赋值的构造函数
        this.zooKeeper = zooKeeper;
        this.watcher = watcher;
        this.sessionId = sessionId;
        this.sessionPasswd = sessionPasswd;
        this.sessionTimeout = sessionTimeout;
        this.hostProvider = hostProvider;
        this.chrootPath = chrootPath;
        // 计算未连接时的过期时间
        connectTimeout = sessionTimeout / hostProvider.size();
        readTimeout = sessionTimeout * 2 / 3;
        readOnly = canBeReadOnly;
        // 初始化两个线程对象
        sendThread = new SendThread(clientCnxnSocket);
        eventThread = new EventThread();
    }
    public void start() {
        // 分别启动两个内部线程类
        sendThread.start();
        eventThread.start();
    }
}
```

#### 1.3 SendThread发送连接请求

在ClientCnxn中启动SendThread线程后接下来的主角便只是SendThread以及调用的类了，而EventThread类只是在处理事件对象时会分析到。这个类是通过一直循环来进行不同的操作，因此不要把这个流程看成只有单一的功能，接收、发送以及ping等操作都是在循环中完成的，但现在我们只分析发送连接请求的代码。

```java
class SendThread extends ZooKeeperThread {
    // 客户端连接Server端的负责对象，默认采用的是NIO方式连接
    private final ClientCnxnSocket clientCnxnSocket;
    // 是否为第一次连接，默认是true
    private boolean isFirstConnect = true;
    // 发送队列，当Client端有请求需要发送时将会封装成Packet包添加到这里面，在
    // SendThread线程轮询到有数据时将会取出第一个包数据进行处理发送。使用的也是
    // FIFO模式
    private final LinkedList<Packet> outgoingQueue = 
            new LinkedList<Packet>();
    @Override
    public void run() {
        // 更新clientCnxnSocket的发送事件以及关联SendTreahd，这里sessionId
        // 没有值，就是0
        clientCnxnSocket.introduce(this,sessionId);
        clientCnxnSocket.updateNow();
        clientCnxnSocket.updateLastSendAndHeard();
        // 上次ping和现在的时间差
        int to;
        // 如果ZK是存活的就一直轮询
        while (state.isAlive()) {
            try {
                // 刚开始运行时这里肯定是未连接的状态，因此会进去
                if (!clientCnxnSocket.isConnected()) {
                    // 此值默认是true，只有当调用了primeConnection()方法
                    // 才会变更为false
                    if(!isFirstConnect){
                        // 进入到这里面说明上一次连接已经失败了，需要再次
                        // 睡眠一会再进行下面的流程
                        try {
                            Thread.sleep(r.nextInt(1000));
                        } catch (InterruptedException e) {
                        }
                    }
                    // 如果ZK已经关闭了则直接会出循环
                    if (closing || !state.isAlive()) {
                        break;
                    }
                    // 开始进行连接
                    startConnect();
                    // 更新发送时间
                    clientCnxnSocket.updateLastSendAndHeard();
                }
                if (state.isConnected()) {
                    // 如果连接上的逻辑，但是本次分析流程肯定是没有连接上的
                    ...
                } else {
                    // 此时to等于connectTimeout
                    to = connectTimeout - clientCnxnSocket.getIdleRecv();
                }
                // 中间是ping和认证相关的，可以忽略
                ...
                // 这个方法十分重要，因为不管是连接还是其它任何操作都会进入
                // 该方法进行操作类型判断已经发送接收数据包，具体流程留到
                // 后续分析clientCnxnSocket对象时再看
                clientCnxnSocket.doTransport(to, pendingQueue, 
                        outgoingQueue, ClientCnxn.this);
            } catch (Throwable e) {
                // 处理异常的暂不做分析
                ...
            }
        }
        // 跑到这里说明ZK已经关闭了，后面会做一些善后的工作，如发送关闭事件
        // 清除连接的缓存数据等
        cleanup();
        clientCnxnSocket.close();
        if (state.isAlive()) {
            eventThread.queueEvent(new WatchedEvent(Event.EventType.None,
                    Event.KeeperState.Disconnected, null));
        }
    }
    private void startConnect() throws IOException {
        // 变更状态为正在进行连接
        state = States.CONNECTING;
        InetSocketAddress addr;
        // 如果rwServerAddress不为空则随机从系列连接串中获取一个地址连接
        // 但连接时rwServerAddress是一定为空的
        if (rwServerAddress != null) {
            addr = rwServerAddress;
            rwServerAddress = null;
        } else {
            // 随机从系列连接串中获取一个地址连接进行连接
            addr = hostProvider.next(1000);
        }
        // 设置ZK的名字
        setName(getName().replaceAll("\\(.*\\)",
                "(" + addr.getHostName() + ":" + addr.getPort() + ")"));
        // 中间的认证忽略
        ...
        // 进行连接的日志打印
        logStartConnect(addr);
        // 调用clientCnxnSocket的连接方法
        clientCnxnSocket.connect(addr);
    }
    void primeConnection() throws IOException {
        // 调用了这个方法说明客户端和Server端的Socket长连接已经连接完毕了
        // 设置isFirstConnect为false
        isFirstConnect = false;
        long sessId = (seenRwServerBefore) ? sessionId : 0;
        // 创建连接的请求对象ConnectRequest
        ConnectRequest conReq = new ConnectRequest(0, lastZxid,
                sessionTimeout, sessId, sessionPasswd);
        // 操作期间不能向outgoingQueue添加包数据
        synchronized (outgoingQueue) {
            // disableAutoWatchReset对应着ZK的启动属性
            // zookeeper.disableAutoWatchReset，如果为false则为自动将ZK的
            // 监听器监听到相应的节点，为true则不会自动监听
            if (!disableAutoWatchReset) {
                // 接下来的流程大概就是从zooKeeper获取三种类型的监听器
                // 把三种类型的监听器依次封装成SetWatches包保存到
                // outgoingQueue包中以便后续发送包数据，具体的流程便忽略
                List<String> dataWatches = zooKeeper.getDataWatches();
                List<String> existWatches = zooKeeper.getExistWatches();
                List<String> childWatches = zooKeeper.getChildWatches();
                if (!dataWatches.isEmpty() || !existWatches.isEmpty() 
                        || !childWatches.isEmpty()) {
                    ...
                    // 轮询三种的迭代器获取迭代器具体数据
                    while (dataWatchesIter.hasNext() || 
                            existWatchesIter.hasNext() || 
                            childWatchesIter.hasNext()) {
                        ...
                        // 前面不重要的都忽略，只放出重要的处理代码
                        // 将获取到的监听器封装成SetWatches对象
                        SetWatches sw = new SetWatches(setWatchesLastZxid,
                                dataWatchesBatch,
                                existWatchesBatch,
                                childWatchesBatch);
                        RequestHeader h = new RequestHeader();
                        h.setType(ZooDefs.OpCode.setWatches);
                        h.setXid(-8);
                        // 随后使用Packet封装Header和Recrod
                        Packet packet = new Packet(h, new ReplyHeader(), 
                                sw, null, null);
                        // 添加到outgoingQueue数据中
                        outgoingQueue.addFirst(packet);
                    }
                }
            }
            ...
            // 将ConnectRequest同样封装成Packet对象放到outgoingQueue中
            outgoingQueue.addFirst(new Packet(null, null, conReq,
                        null, null, readOnly));
        }
        // 开启OP_WRITE操作，开启后Selector.select()将可以收到读IO
        clientCnxnSocket.enableReadWriteOnly();
    }
}
```

从源码可以看出来SendThread只是一个线程轮询调用类，具体的发送和接收操作是交给ClientCnxnSocket对象来完成的。

#### 1.4 ClientCnxnSocket套接字交互类

和Socket进行交互的类，负责向Socket中写入数据和读取数据。在连接流程中最重要的两个方法connect和doTransport都是在这个类中，根据在SendThread类中的流程，我们先分析connect，再去看doTransport方法。

```java
public class ClientCnxnSocketNIO extends ClientCnxnSocket {
    // NIO的多路复用选择器
    private final Selector selector = Selector.open();
    // 本Socket对应的SelectionKey
    private SelectionKey sockKey;
    // 是否已经初始化，默认false
    protected boolean initialized;
    @Override
    void connect(InetSocketAddress addr) throws IOException {
        SocketChannel sock = createSock();
        try {
            // 这个方法的作用便是注册并尝试进行连接
            registerAndConnect(sock, addr);
        } catch (IOException e) {
            // 注册socket失败
            ...
        }
        // 设置为非初始化
        initialized = false;
        lenBuffer.clear();
        incomingBuffer = lenBuffer;
    }
    SocketChannel createSock() throws IOException {
        // 创建一个SocketChannel对象，并设置非阻塞以及其它属性
        SocketChannel sock;
        sock = SocketChannel.open();
        sock.configureBlocking(false);
        sock.socket().setSoLinger(false, -1);
        sock.socket().setTcpNoDelay(true);
        return sock;
    }
    void registerAndConnect(SocketChannel sock, InetSocketAddress addr) 
            throws IOException {
        // 将Socket注册到Selector中，并生成唯一对应的SelectionKey对象
        sockKey = sock.register(selector, SelectionKey.OP_CONNECT);
        // 进行Socket连接
        boolean immediateConnect = sock.connect(addr);
        // 如果第一次调用就已经连接上，则执行主要的连接操作
        if (immediateConnect) {
            // 这个方法前面已经介绍过了
            sendThread.primeConnection();
        }
    }
    @Override
    void doTransport(int waitTimeOut, List<Packet> pendingQueue, 
            LinkedList<Packet> outgoingQueue, ClientCnxn cnxn)
            throws IOException, InterruptedException {
        // 最多休眠waitTimeOut时间获取NIO事件，调用wake()方法、有可读IO事件和
        // 有OP_WRITE写事件可触发
        selector.select(waitTimeOut);
        Set<SelectionKey> selected;
        synchronized (this) {
            // 获取IO事件保定的SelectionKey对象
            selected = selector.selectedKeys();
        }
        // 更新now属性为当前时间戳
        updateNow();
        for (SelectionKey k : selected) {
            SocketChannel sc = ((SocketChannel) k.channel());
            // 先判断SelectionKey事件是否是连接事件
            if ((k.readyOps() & SelectionKey.OP_CONNECT) != 0) {
                // 如果是连接事件，则调用finishConnect()确保已连接成功
                if (sc.finishConnect()) {
                    // 连接成功后更新发送时间
                    updateLastSendAndHeard();
                    // 执行主要的连接方法，准备发送ZK的连接请求
                    sendThread.primeConnection();
                }
            } else if ((k.readyOps() & 
                    (SelectionKey.OP_READ | SelectionKey.OP_WRITE)) != 0) {
                // 再判断是否是OP_READ或者OP_WRITE事件
                // 如果满足则调用doIO方法来处理对应的事件，doIO便是处理获取的
                // IO事件核心方法
                doIO(pendingQueue, outgoingQueue, cnxn);
            }
        }
        // 执行到这里说明本次触发的NIO事件已经全部执行完毕，但是有可能在途中会
        // 产生新的NIO事件需要执行，因此这里会判断是否有可发送的Packet包，如果有
        // 则开启OP_WRITE操作，以方便下次直接发送
        if (sendThread.getZkState().isConnected()) {
            synchronized(outgoingQueue) {
                // 查看是否有可发送的Packet包数据
                if (findSendablePacket(outgoingQueue, cnxn.sendThread
                        .clientTunneledAuthenticationInProgress())!=null) {
                    // 打开OP_WRITE操作
                    enableWrite();
                }
            }
        }
        // 清除SelectionKey集合
        selected.clear();
    }
    void doIO(List<Packet> pendingQueue, LinkedList<Packet> outgoingQueue,
            ClientCnxn cnxn) throws InterruptedException, IOException {
        SocketChannel sock = (SocketChannel) sockKey.channel();
        if (sock == null) {
            throw new IOException("Socket is null!");
        }
        // 这里有处理OP_READ类型的判断，即处理ZK的Server端传过来的请求
        // 在第一步中不会走到这里面去，因此忽略
        if (sockKey.isReadable()) {
            ...
        }
        // 处理OP_WRITE类型事件，即处理要发送到ZK的Server端请求包数据
        if (sockKey.isWritable()) {
            // 保证线程安全
            synchronized(outgoingQueue) {
                // 获取最新的需要发送的数据包，这里获取的便是前面SendThread
                // 放进去的只有ConnectRequest的Packet包对象
                Packet p = findSendablePacket(outgoingQueue, cnxn
                    .sendThread.clientTunneledAuthenticationInProgress());
                if (p != null) {
                    // 更新最后的发送时间
                    updateLastSend();
                    // 如果Packet包的ByteBuffer为空则调用createBB()创建
                    // 连接时ByteBuffer是一定为空的，因此这里会一定进入
                    if (p.bb == null) {
                        if ((p.requestHeader != null) &&
                            (p.requestHeader.getType() != OpCode.ping) &&
                            (p.requestHeader.getType() != OpCode.auth)) {
                            p.requestHeader.setXid(cnxn.getXid());
                        }
                        // createBB方法的作用便是序列化请求并将byte[]数组
                        // 添加到ByteBuffer中
                        p.createBB();
                    }
                    // 使用获取的SocketChannel写入含有序列化数据的ByteBuffer
                    sock.write(p.bb);
                    if (!p.bb.hasRemaining()) {
                        // 发送成功并删除第一个Packet包对象
                        sentCount++;
                        outgoingQueue.removeFirstOccurrence(p);
                        // 如果requestHeader不为空，不是ping或者auth类型的
                        // 则将Packet包对象添加到pendingQueue中，代表这个
                        // 包对象正在被Server端处理且没有响应回来
                        // （需要注意的是只有连接时的ConnectRequest请求头
                        // requestHeader才会为空，因此这里的条件便是除了
                        // 新建连接、ping和auth类型的，其它都会被添加进来）
                        if (p.requestHeader != null
                            && p.requestHeader.getType() != OpCode.ping
                            && p.requestHeader.getType() != OpCode.auth) {
                            synchronized (pendingQueue) {
                                pendingQueue.add(p);
                            }
                        }
                    }
                }
                // 如果outgoingQueue为空或者尚未连接成功且本次的Packet包对象
                // 已经发送完毕则关闭OP_WRITE操作，因此发送ConnectReuqest请
                // 求后便需要等待Server端的相应确认建立连接，不允许Client端
                // 这边主动发送NIO信息
                if (outgoingQueue.isEmpty()) {
                    disableWrite();
                } else if (!initialized && p != null && 
                        !p.bb.hasRemaining()) {
                    disableWrite();
                } else {
                    // 为了以防万一打开OP_WRITE操作
                    enableWrite();
                }
            }
        }
    }
    private Packet findSendablePacket(LinkedList<Packet> outgoingQueue,
            boolean clientTunneledAuthenticationInProgress) {
        synchronized (outgoingQueue) {
            // 判断outgoingQueue是否为空
            if (outgoingQueue.isEmpty()) {
                return null;
            }
            // 两种条件：
            // 如果第一个的ByteBuffer不为空
            // 如果传入进来的clientTunneledAuthenticationInProgress为false
            // 参数为false说明认证尚未配置或者尚未完成
            if (outgoingQueue.getFirst().bb != null
                || !clientTunneledAuthenticationInProgress) {
                return outgoingQueue.getFirst();
            }
            // 跑到这里说明认证已完成，需要遍历outgoingQueue数组，把连接的
            // 请求找到并放到队列的第一个，以保证下次读取会读取到连接请求
            ListIterator<Packet> iter = outgoingQueue.listIterator();
            while (iter.hasNext()) {
                Packet p = iter.next();
                // 只有连接的requestHeader是空的，因此只需要判断这个条件即可
                // 其它类型的包数据header肯定是不为空的
                if (p.requestHeader == null) {
                    // 先删除本包，随后放到第一位
                    iter.remove();
                    outgoingQueue.add(0, p);
                    return p;
                }
            }
            // 执行到这里说明确实没有包需要发送
            return null;
        }
    }
}
```

当Socket把请求数据已经序列化到ByteBuffer中的数据发出去后，Client端的第一步便已经完成。从这个流程中最关键的就是把OP_READ操作看成接收Server端的响应，而OP_WRITE则是Client主动发数据和Server端进行交互的操作，这样在看代码理解时会更加轻松。

### 2.Server端接收处理响应数据

其实在第一步调用SocketChannel.connect()方法时，第二步就已经接收新建连接的通信并且生成了session信息了，但为了便于理解，我们还是把第二步当成依赖于第一步。后面在源码会详细说明。

#### 2.1 NIOServerCnxnFactory接收NIO请求

NIOServerCnxnFactory负责使用Selector多路复用选择器来从多个Client端获取Socket的新建和发送数据，因此在交互流程中，此类为Server端的起始点，也是通过线程轮询的方式不断地获取其它Socket发送的请求数据。

```java
public class NIOServerCnxnFactory extends ServerCnxnFactory 
        implements Runnable {
    // NIO的Server端SocketChannel，可被多个SocketChannel连接并发送数据
    ServerSocketChannel ss;
    // NIO的多路复用选择器
    final Selector selector = Selector.open();
    // 保存某一IP和其IP下的所有NIO连接对象
    final HashMap<InetAddress, Set<NIOServerCnxn>> ipMap =
            new HashMap<InetAddress, Set<NIOServerCnxn>>( );
    // 同一个IP下默认的最大客户端连接数
    int maxClientCnxns = 60;
    public void run() {
        // 依然是通过循环通过select()方法获取NIO事件
        while (!ss.socket().isClosed()) {
            try {
                // 以1000（1s）为间隔阻塞式获取NIO事件
                selector.select(1000);
                Set<SelectionKey> selected;
                synchronized (this) {
                    // 获取NIO事件
                    selected = selector.selectedKeys();
                }
                ArrayList<SelectionKey> selectedList = 
                        new ArrayList<SelectionKey>(selected);
                // 随机打乱已经获取到的selectedList集合，至于为什么要打乱
                // 估计是为了一定程度上保证各个Client端的请求都能被随机处理
                Collections.shuffle(selectedList);
                // 开始轮询
                for (SelectionKey k : selectedList) {
                    // 这里的逻辑和Client端的判断连接事件和判断读写事件是一样
                    // 的逻辑，如果是连接事件则进行相应的连接处理，如果是读写
                    // 事件则调用doIO()方法对两种类型进行处理
                    if ((k.readyOps() & SelectionKey.OP_ACCEPT) != 0) {
                        // 当Client端调用了SocketChannel.connect()方法时
                        // Server端的NIO将会收到OP_ACCEPT事件，此时代表
                        // 有一个客户端想要和Server端建立Socket连接
                        // 接收请求连接的SocketChannel对象
                        SocketChannel sc = ((ServerSocketChannel) k
                                .channel()).accept();
                        InetAddress ia = sc.socket().getInetAddress();
                        // 从ipMap中获取IP对应的连接对象，并判断是否超过了
                        // 当前IP最大连接数量
                        int cnxncount = getClientCnxnCount(ia);
                        if (maxClientCnxns > 0 
                                && cnxncount >= maxClientCnxns){
                            // 如果超过则日志提示已超过并关闭Socket连接
                            sc.close();
                        } else {
                            // 如果未超过说明可以进行正常的连接，并将Socket
                            // 注册到Selector中生成SelectionKey
                            sc.configureBlocking(false);
                            SelectionKey sk = sc.register(selector,
                                    SelectionKey.OP_READ);
                            // 生成对应的NIO连接对象
                            NIOServerCnxn cnxn = createConnection(sc, sk);
                            // 将连接对象和SelectionKey进行绑定
                            sk.attach(cnxn);
                            // 这里面会保存IP和连接对象集合，一个IP对应着系列
                            // 的连接对象，因为一台机器可能有多个连接对象
                            addCnxn(cnxn);
                        }
                    } else if ((k.readyOps() & (SelectionKey.OP_READ | 
                            SelectionKey.OP_WRITE)) != 0) {
                        // 当有OP_READ读事件或者OP_WRITE写事件时将会跑到这里
                        // 先获取SelectionKey对应的绑定连接对象
                        NIOServerCnxn c = (NIOServerCnxn) k.attachment();
                        // 再调用实际的处理方法doIO()
                        c.doIO(k);
                    }
                }
                selected.clear();
            }
            // 异常处理忽略
            ...
        }
        // 关闭客户端连接对象
        closeAll();
    }
    protected NIOServerCnxn createConnection(SocketChannel sock,
        SelectionKey sk) throws IOException {
        return new NIOServerCnxn(zkServer, sock, sk, this);
    }
}
```

#### 2.2 连接对象NIOServerCnxn

这个代表着Client端在Server端的连接对象，新连接在Server端的表现便是一个NIOServerCnxn对象。并且这个对象会和对应的SelectionKey、Socket进行绑定。这个类里面最重要的便是doIO()方法，在这个方法中会判断读写事件，并根据相应的值进行处理，在新建连接流程中，只会分析读事件。关键源码如下：

```java
public class NIOServerCnxn extends ServerCnxn {
    // 这三个对象便不用做过多介绍了
    NIOServerCnxnFactory factory;
    final SocketChannel sock;
    private final SelectionKey sk;
    // 用来读取请求长度的buffer对象
    ByteBuffer lenBuffer = ByteBuffer.allocate(4);
    // 实际接受请求长度的buffer对象
    ByteBuffer incomingBuffer = lenBuffer;
    // 是否已经初始化，默认值为false
    boolean initialized;
    private final ZooKeeperServer zkServer;
    // 本连接对应的sessionId，刚开始sessionId不会有，只有当ZK的Server端处理了
    // ConnectRequest之后才会被赋值
    long sessionId;
    // 写操作使用的ByteBuffer集合
    LinkedBlockingQueue<ByteBuffer> outgoingBuffers;
    public NIOServerCnxn(ZooKeeperServer zk, SocketChannel sock,
        SelectionKey sk, NIOServerCnxnFactory factory) throws IOException {
        ...
        // 前面的赋值可以忽略，当创建本对象时将会默认开启读事件
        sk.interestOps(SelectionKey.OP_READ);
    }
    void doIO(SelectionKey k) throws InterruptedException {
        try {
            // 进行操作前需要判断Socket是否被关闭
            if (isSocketOpen() == false) {
                return;
            }
            // 判断读事件
            if (k.isReadable()) {
                // 从Socket中先读取数据，注意的是incomingBuffer容量只有4字节
                int rc = sock.read(incomingBuffer);
                // 读取长度异常
                if (rc < 0) {
                    throw new EndOfStreamException();
                }
                // 读取完毕开始进行处理
                if (incomingBuffer.remaining() == 0) {
                    boolean isPayload;
                    // 当这两个完全相等说明已经是下一次连接了，新建时无需分析
                    if (incomingBuffer == lenBuffer) {
                        incomingBuffer.flip();
                        isPayload = readLength(k);
                        incomingBuffer.clear();
                    } else {
                        isPayload = true;
                    }
                    if (isPayload) {
                        // 读取具体连接的地方
                        readPayload();
                    }
                    else {
                        return;
                    }
                }
            }
            // 写事件类型
            if (k.isWritable()) {
                // 如果ByteBuffer集合不为空才进入，新建连接时如果响应没有一次性
                // 发送完剩余的会被放在outgoingBuffers集合中依次发送出去
                if (outgoingBuffers.size() > 0) {
                    // 给发送的ByteBuffer对象分配空间，大小为64 * 1024字节
                    ByteBuffer directBuffer = factory.directBuffer;
                    directBuffer.clear();
                    for (ByteBuffer b : outgoingBuffers) {
                        // 这里执行的操作是把已经发送过的数据剔除掉
                        // 留下未发送的数据截取下来重新发送
                        if (directBuffer.remaining() < b.remaining()) {
                            b = (ByteBuffer) b.slice().limit(
                                    directBuffer.remaining());
                        }
                        int p = b.position();
                        // 将未发送的数据放入directBuffer中
                        directBuffer.put(b);
                        // 更新outgoingBuffers中的ByteBuffer对象属性，以便
                        // 后续使用
                        b.position(p);
                        // 如果directBuffer的空间都被占用光了，则直接停止从
                        // outgoingBuffers集合中获取
                        if (directBuffer.remaining() == 0) {
                            break;
                        }
                    }
                    directBuffer.flip();
                    // 发送directBuffer中的数据
                    int sent = sock.write(directBuffer);
                    ByteBuffer bb;
                    // 这部分的循环便是再次判断前面使用过的对象
                    // 看这些对象是否已经发送完，根据position信息判断如果发送完
                    // 则从outgoingBuffers集合中移除
                    while (outgoingBuffers.size() > 0) {
                        bb = outgoingBuffers.peek();
                        if (bb == ServerCnxnFactory.closeConn) {
                            throw new CloseRequestException();
                        }
                        // 获取ByteBuffer的剩余数据
                        int left = bb.remaining() - sent;
                        // 如果到此大于0，说明前面的数据已经填充满
                        // 直接退出循环
                        if (left > 0) {
                            bb.position(bb.position() + sent);
                            break;
                        }
                        // 执行到这里说明ByteBuffer对象已经发送完毕，可以更新
                        // 发送状态并从将其从outgoingBuffers中移除
                        packetSent();
                        sent -= bb.remaining();
                        outgoingBuffers.remove();
                    }
                }
                synchronized(this.factory){
                    if (outgoingBuffers.size() == 0) {
                        // 如果outgoingBuffers已经全部被消化完了便把
                        // OP_WRITE操作关闭
                        if (!initialized && (sk.interestOps() 
                                & SelectionKey.OP_READ) == 0) {
                            throw new CloseRequestException();
                        }
                        sk.interestOps(sk.interestOps()
                                & (~SelectionKey.OP_WRITE));
                    } else {
                        // 如果还剩余一些没有发送完，则继续打开OP_WRITE操作
                        // 接着下次轮询发送
                        sk.interestOps(sk.interestOps()
                                | SelectionKey.OP_WRITE);
                    }
                }
            }
        } 
        // 异常处理忽略
        ...
    }
    private void readPayload() throws IOException, InterruptedException {
        // 前面已经判断过，这里一定不会成立
        if (incomingBuffer.remaining() != 0) {
            int rc = sock.read(incomingBuffer);
            if (rc < 0) {
                throw new EndOfStreamException();
            }
        }
        if (incomingBuffer.remaining() == 0) {
            // 进行接收报文数量+1和更新Server端接收报文数量+1的操作
            packetReceived();
            incomingBuffer.flip();
            // 第一次进来肯定是false
            if (!initialized) {
                // 因此这里肯定会进入调用处理ConnectRequest的方法中
                readConnectRequest();
            } else {
                // 这里是处理其它Request的方法，此次暂不分析，后续分析ping和
                // 其它操作时再来分析此方法中的流程
                readRequest();
            }
            lenBuffer.clear();
            // 处理完这次请求后再将incomingBuffer复原
            incomingBuffer = lenBuffer;
        }
    }
    private void readConnectRequest() 
            throws IOException, InterruptedException {
        if (zkServer == null) {
            throw new IOException("ZooKeeperServer not running");
        }
        // 调用ZooKeeperServer的方法处理连接请求
        zkServer.processConnectRequest(this, incomingBuffer);
        // 当前面执行完毕后说明已经初始化完成了
        initialized = true;
    }
}
```

#### 2.3 单机运行的ZooKeeperServer

前面文章解释过，这个类就是ZK的Server实例，每个ZK服务器上对应着一个ZooKeeperServer实例，这里面有诸多服务器方面的属性配置，但前面分析过，因此本次流程代码便不做过多的介绍了，有兴趣的可以翻看前面的文章。

在Client端有ping心跳检测间隔时间，在Server端有tickTime存活检测时间，这两个属性代表的意思是不一样的，Client端的ping心跳检测间隔时间是轮询隔一段时间后向Server端发送ping请求，而Server端的tickTime间隔时间作用是每隔一段时间就判断在Server端的Client连接对象是否已经死亡，如果已经过期死亡则将连接对象进行清除关闭。所以ping心跳检测的意义是Client端告诉服务器我还活着，tickTime意义是定期清除没有告诉Server端还存活的连接。

```java
public class ZooKeeperServer implements SessionExpirer, 
        ServerStats.Provider {
    // 默认3S检测一次客户端存活情况
    public static final int DEFAULT_TICK_TIME = 3000;
    // 实际设置的检测存活时间间隔
    protected int tickTime = DEFAULT_TICK_TIME;
    // Server端可接受的最小Client端sessionTimeout，如果未设置则值为tickTime*2
    protected int minSessionTimeout = -1;
    // Server端可接受的最大Client端sessionTimeout，如果未设置则值为tickTime*20
    protected int maxSessionTimeout = -1;
    // 处理客户端请求RequestProcessor的第一个实现类对象
    protected RequestProcessor firstProcessor;
    public void processConnectRequest(ServerCnxn cnxn, 
            ByteBuffer incomingBuffer) throws IOException {
        BinaryInputArchive bia = BinaryInputArchive
                .getArchive(new ByteBufferInputStream(incomingBuffer));
        // 反序列化ByteBuffer对象为ConnectRequest对象
        ConnectRequest connReq = new ConnectRequest();
        connReq.deserialize(bia, "connect");
        boolean readOnly = false;
        try {
            // 是否只可读
            readOnly = bia.readBool("readOnly");
            cnxn.isOldClient = false;
        } catch (IOException e) {
            ...
        }
        // 只有ReadOnlyZooKeeperServer类型的Server只接收readOnly为true的
        if (readOnly == false && this instanceof ReadOnlyZooKeeperServer) {
            ...
            throw new CloseRequestException(msg);
        }
        // 获取的zxid需要小于Server端最大的zxid
        if (connReq.getLastZxidSeen() > zkDb.dataTree.lastProcessedZxid) {
            ...
            throw new CloseRequestException(msg);
        }
        // 这段代码便是Server和Client端协商具体的sessionTimeout值
        // 1、获取客户端传来的sessionTimeout
        int sessionTimeout = connReq.getTimeOut();
        byte passwd[] = connReq.getPasswd();
        // 2、先判断sessionTimeout是否小于Server端可接受的最小值
        // 如果小于Server端可接受最小值则设置成Server端的最小sessionTimeout
        int minSessionTimeout = getMinSessionTimeout();
        if (sessionTimeout < minSessionTimeout) {
            sessionTimeout = minSessionTimeout;
        }
        // 3、再判断sessionTimeout是否大于Server端可接受的最大值
        // 如果大于Server端可接受最大值则设置成Server端的最大sessionTimeout
        int maxSessionTimeout = getMaxSessionTimeout();
        if (sessionTimeout > maxSessionTimeout) {
            sessionTimeout = maxSessionTimeout;
        }
        // 最后把满足协商范围的sessionTimeout设置到Client连接对象中
        cnxn.setSessionTimeout(sessionTimeout);
        // 设置该连接对象不再从Client端接收数据
        cnxn.disableRecv();
        long sessionId = connReq.getSessionId();
        // 第一次连接不手动设置sessionId都是0
        if (sessionId != 0) {
            // 如果不是0则需要关闭原来的session并且重新打开sessionId
            // 这种情况不常见，只需要知道处理的代码逻辑在这里便行，暂不详细分析
            long clientSessionId = connReq.getSessionId();
            serverCnxnFactory.closeSession(sessionId);
            cnxn.setSessionId(sessionId);
            reopenSession(cnxn, sessionId, passwd, sessionTimeout);
        } else {
            // 开始创建新的session信息
            createSession(cnxn, passwd, sessionTimeout);
        }
    }
    long createSession(ServerCnxn cnxn, byte passwd[], int timeout) {
        // 根据失效时间创建一个新的session信息并返回唯一ID
        long sessionId = sessionTracker.createSession(timeout);
        // 设置失效时间和sessionId
        Random r = new Random(sessionId ^ superSecret);
        r.nextBytes(passwd);
        ByteBuffer to = ByteBuffer.allocate(4);
        to.putInt(timeout);
        cnxn.setSessionId(sessionId);
        // 调用该方法使用刚刚获取到的属性去生成Request请求
        submitRequest(cnxn, sessionId, OpCode.createSession, 0, to, null);
        return sessionId;
    }
    private void submitRequest(ServerCnxn cnxn, long sessionId, int type,
        int xid, ByteBuffer bb, List<Id> authInfo) {
        // 根据参数生成Request对象，并调用submitRequest()方法开始使用
        // RequestProcessor链对Request进行处理
        Request si = new Request(cnxn, sessionId, xid, type, bb, authInfo);
        submitRequest(si);
    }
    public void submitRequest(Request si) {
        // 这个方法功能很简单：
        // 1、判断Server端是否初始化完成，如果未完成则一直持续等待
        // 2、在调用RequestProcessor链前先更新session在Server端的过期时间
        // 3、调用firstProcessor对象的processRequest方法开始处理请求
        if (firstProcessor == null) {
            synchronized (this) {
                try {
                    // 一直轮询直到Server端的各种组件初始化完成
                    while (state == State.INITIAL) {
                        wait(1000);
                    }
                } ...
                // 如果未初始化成功则抛出异常
                if (firstProcessor == null || state != State.RUNNING) {
                    throw new RuntimeException("Not started");
                }
            }
        }
        try {
            // 更新session的过期时间
            touch(si.cnxn);
            // 校验请求类型是否有效
            boolean validpacket = Request.isValid(si.type);
            if (validpacket) {
                // 开始调用firstProcessor对象的processRequest()方法处理请求
                firstProcessor.processRequest(si);
                if (si.cnxn != null) {
                    incInProcess();
                }
            } else {
                // 如果处理类型校验不通过则发送无法处理请求并关闭连接
                new UnimplementedRequestProcessor().processRequest(si);
            }
        } ...
    }
    void touch(ServerCnxn cnxn) throws MissingSessionException {
        if (cnxn == null) {
            return;
        }
        long id = cnxn.getSessionId();
        int to = cnxn.getSessionTimeout();
        // 获取sessionId和sessionTimeout属性调用sessionTracker去更新session
        // 在Server端的过期时间
        if (!sessionTracker.touchSession(id, to)) {
            throw new MissingSessionException();
        }
    }
}
```

#### 2.4 session追踪类SessionTracker

取名为SessionTracker，实际上这个类的功能就是维护session生命周期，主要进行session过期判断和更新session状态的操作，判断session过期还是放到后面分析ping流程再看吧，新建连接时就看其如何更新session状态。

```java
public class SessionTrackerImpl extends ZooKeeperCriticalThread 
        implements SessionTracker {
    // 保存sessionId和对应的Session对象
    HashMap<Long, SessionImpl> sessionsById;
    // key为某一个过期时间，value为这一个时间点对应要过期的Session对象
    // 比如在1610539095000时间戳有3个Session要过期，key就是这个时间戳
    // 而value则保存的是这三个要过期的Session对象
    HashMap<Long, SessionSet> sessionSets;
    // key为sessionId，value为这个session的过期时间
    ConcurrentHashMap<Long, Integer> sessionsWithTimeout;
    // 下一次新建session时的id
    long nextSessionId = 0;
    // 下一次session过期的时间戳，计算公式为：
    // (某一时间戳 / expirationInterval + 1) * expirationInterval
    // 因此就是以tickTime为单位往上加一次tickTime，并且能够为tickTime整除
    long nextExpirationTime;
    // 每次轮询的间隔时间，值就是tickTime
    int expirationInterval;
    synchronized public long createSession(int sessionTimeout) {
        // 在使用RequestProcessor处理请求前会调用该方法为客户端创建一个session
        addSession(nextSessionId, sessionTimeout);
        return nextSessionId++;
    }
    synchronized public void addSession(long id, int sessionTimeout) {
        // 存放sessionId和其对应的sessionTimeout时间
        sessionsWithTimeout.put(id, sessionTimeout);
        if (sessionsById.get(id) == null) {
            // 如果没有保存对应的Session对象则创建一个并添加
            SessionImpl s = new SessionImpl(id, sessionTimeout, 0);
            sessionsById.put(id, s);
        }
        // 添加完session后更新session的过期时间
        touchSession(id, sessionTimeout);
    }
    synchronized public boolean touchSession(long sessionId, int timeout) {
        // 这个方法的作用便是更新Session对象的下次过期时间
        // 比如tickTime为1000，上一次的过期时间是1610539095000，那么就要更新
        // 1610539095000时间戳到下一个增加tickTime单位的1610539096000时间戳
        // 以tickTime为间隔的依次更新下一次的过期时间
        // 根据sessionId获取具体的sesison对象
        SessionImpl s = sessionsById.get(sessionId);
        if (s == null || s.isClosing()) {
            return false;
        }
        // 获取这个session的下次过期时间，公式为：
        // ((当前时间戳+timeout)/expirationInterval+1)*expirationInterval
        long expireTime = 
                roundToInterval(System.currentTimeMillis() + timeout);
        // SessionImpl对象里tickTime实际上是expireTime下次过期时间
        if (s.tickTime >= expireTime) {
            // 如果过期时间大于或者等于这次的过期时间，说明还没有过期，直接返回
            return true;
        }
        // 跑到这里说明session已经过了下次过期时间，需要更新session过期时间
        // 获取在此刻的过期时间将要过期的session集合
        SessionSet set = sessionSets.get(s.tickTime);
        if (set != null) {
            // 如果不为空，从要过期的session集合中删除该session对象
            set.sessions.remove(s);
        }
        // 将下一次过期时间赋值给Session对象的tickTime属性
        s.tickTime = expireTime;
        // 获取下一次要过期的session集合
        set = sessionSets.get(s.tickTime);
        if (set == null) {
            // 如果集合为空则创建并且和下一次过期时间一起放入sessionSets集合中
            set = new SessionSet();
            sessionSets.put(expireTime, set);
        }
        // 放入下次过期时间对应的集合中
        set.sessions.add(s);
        return true;
    }
}
```

#### 2.5 RequestProcessor请求处理链

前面介绍过，在单机运行时RequestProcessor处理链只有三个：PrepRequestProcessor、SyncRequestProcessor和FinalRequestProcessor，其中前两个是线程对象，最后一个是普通的对象，至于原因前面的文章介绍过。接下来的三个RequestProcessor大致作用不做分析，有兴趣可以看下以前的文章。

**2.5.1 PrepRequestProcessor**

```java
public class PrepRequestProcessor extends ZooKeeperCriticalThread 
        implements RequestProcessor {
    // 本RequestProcessor中用来暂时保存需要处理的Request，轮询获取请求处理
    LinkedBlockingQueue<Request> submittedRequests = 
            new LinkedBlockingQueue<Request>();
    // 本RequestProcessor的下一个RequestProcessor对象
    RequestProcessor nextProcessor;
    ZooKeeperServer zks;
    @Override
    public void processRequest(Request request) {
        // RequestProcessor的实现方法，由于内部使用轮询方式从submittedRequests
        // 集合获取数据，因此在这里直接把Request添加到集合中即可
        submittedRequests.add(request);
    }
    @Override
    public void run() {
        try {
            while (true) {
                // 轮询从submittedRequests集合中获取Request对象
                Request request = submittedRequests.take();
                // 如果requestOfDeath代表ZK已经关闭，因此退出循环
                if (Request.requestOfDeath == request) {
                    break;
                }
                // 开始处理正常的Request
                pRequest(request);
            }
        }...
    }
    protected void pRequest(Request request) 
            throws RequestProcessorException {
        request.txn = null;
        try {
            switch (request.type) {
            // 与连接无关的case情况忽略
            ...
            case OpCode.createSession:
            case OpCode.closeSession:
                // 直接处理事务
                pRequest2Txn(request.type, zks.getNextZxid(), 
                        request, null, true);
                break;
            ...
        } ...
        request.zxid = zks.getZxid();
        // 调用下个RequestProcessor来处理Request
        nextProcessor.processRequest(request);
    }
    protected void pRequest2Txn(int type, long zxid, Request request, 
            Record record, boolean deserialize)
            throws KeeperException, IOException, RequestProcessorException{
        // 为请求创建事务头TxnHeader对象
        request.hdr = new TxnHeader(request.sessionId, request.cxid, zxid,
                                    zks.getTime(), type);
        switch (type) {
            // 无关的case情况忽略
            ...
            case OpCode.createSession:
                request.request.rewind();
                // 此时的to实际上就是sessionTimeout
                int to = request.request.getInt();
                // 使用sessionTimeout创建CreateSessionTxn对象
                request.txn = new CreateSessionTxn(to);
                request.request.rewind();
                // 根据sessionid和sessionTimeout再次新增session信息
                zks.sessionTracker.addSession(request.sessionId, to);
                zks.setOwner(request.sessionId, request.getOwner());
                break;
            ...
    }
}
```

**2.5.2 SyncRequestProcessor**

```java
public class SyncRequestProcessor extends ZooKeeperCriticalThread 
        implements RequestProcessor {
    // 本RequestProcessor中用来暂时保存需要处理的Request，轮询获取请求处理
    private final LinkedBlockingQueue<Request> queuedRequests =
            new LinkedBlockingQueue<Request>();
    // 保存的是已经被写入磁盘但是待刷新的事务
    private final LinkedList<Request> toFlush = new LinkedList<Request>();
    // 本RequestProcessor的下一个RequestProcessor对象
    private final RequestProcessor nextProcessor;
    // Server端快照的数量
    private static int snapCount = ZooKeeperServer.getSnapCount();
    // 在回滚前的log数量，随机生成的
    private static int randRoll;
    public void processRequest(Request request) {
        // 类似于PrepRequestProcessor，内部使用轮询方式从submittedRequests
        // 集合获取数据，因此在这里直接把Request添加到集合中即可
        queuedRequests.add(request);
    }
    @Override
    public void run() {
        try {
            int logCount = 0;
            // 避免服务都在同一时间获取快照snapshot，这里面设置的是randRoll属性
            setRandRoll(r.nextInt(snapCount/2));
            while (true) {
                Request si = null;
                // 从queuedRequests获取Request
                if (toFlush.isEmpty()) {
                    si = queuedRequests.take();
                } else {
                    si = queuedRequests.poll();
                    if (si == null) {
                        flush(toFlush);
                        continue;
                    }
                }
                // 如果已经结束则退出循环
                if (si == requestOfDeath) {
                    break;
                }
                if (si != null) {
                    // 将Request写入到log中
                    if (zks.getZKDatabase().append(si)) {
                        logCount++;
                        // 如果日志的数量大于某个临界点，则生成一次快照
                        if (logCount > (snapCount / 2 + randRoll)) {
                            // 途中会异步生成快照，过程忽略，操作完之后
                            // logCount 归零
                            ...
                            logCount = 0;
                        }
                    } else if (toFlush.isEmpty()) {
                        // 如果所有的事务都处理完则使用nextProcessor
                        // 开始进行下一步处理
                        if (nextProcessor != null) {
                            // 进行处理
                            nextProcessor.processRequest(si);
                            if (nextProcessor instanceof Flushable) {
                                ((Flushable)nextProcessor).flush();
                            }
                        }
                        continue;
                    }
                    // 如果前面两个条件都不满足，则把Request添加到待刷新的
                    // 事务集合中
                    toFlush.add(si);
                    if (toFlush.size() > 1000) {
                        // 当待刷事务到达了1000个，则把集合中的所有事务全都
                        // 刷掉并使用nextProcessor依次进行处理
                        flush(toFlush);
                    }
                }
            }
        } ...
    }
}
```

**2.5.2 FinalRequestProcessor**

```java
public class FinalRequestProcessor implements RequestProcessor {
    ZooKeeperServer zks;
    public void processRequest(Request request) {
        // 直接开始处理Request请求
        ProcessTxnResult rc = null;
        synchronized (zks.outstandingChanges) {
            // 新建连接流程outstandingChanges是空的，因此这里的循环逻辑暂不分析
            while (!zks.outstandingChanges.isEmpty()
                    && zks.outstandingChanges.get(0).zxid <= request.zxid){
                ChangeRecord cr = zks.outstandingChanges.remove(0);
                if (zks.outstandingChangesForPath.get(cr.path) == cr) {
                    zks.outstandingChangesForPath.remove(cr.path);
                }
            }
            // 新建连接的TxnHeader不会为空，因此这里一定会进入
            if (request.hdr != null) {
               TxnHeader hdr = request.hdr;
               Record txn = request.txn;
               // hdr和txn都是和连接相关的对象，里面的方法执行的操作为添加
               // session信息，到这里已经是新建连接的第三次调用新增session信息
               // 当然这里面还会调用DataTree.processTxn()方法，只是不会执行
               // 很重要的逻辑代码
               rc = zks.processTxn(hdr, txn);
            }
            // 将连接添加到日志中
            if (Request.isQuorum(request.type)) {
                zks.getZKDatabase().addCommittedProposal(request);
            }
        }
        // 关闭session的操作略过
        ...
        // 如果执行到这里连接对象还为空则直接退出
        if (request.cnxn == null) {
            return;
        }
        ServerCnxn cnxn = request.cnxn;
        String lastOp = "NA";
        // 执行中的数量减一
        zks.decInProcess();
        Code err = Code.OK;
        Record rsp = null;
        boolean closeSession = false;
        try {
            // 如果发生了异常则直接抛出
            if (request.hdr != null && 
                    request.hdr.getType() == OpCode.error) {
                throw KeeperException.create(KeeperException.Code.get((
                        (ErrorTxn) request.txn).getErr()));
            }
            // 如果是单个的操作发生了异常抛出
            KeeperException ke = request.getException();
            if (ke != null && request.type != OpCode.multi) {
                throw ke;
            }
            // 开始根据Request的操作类型进行相应的处理
            switch (request.type) {
                // 与连接无关的case忽略
                ...
                case OpCode.createSession: {
                    // 更新服务状态
                    zks.serverStats().updateLatency(request.createTime);
                    // 最后的操作类型
                    lastOp = "SESS";
                    // 更新连接对象的状态和属性
                    cnxn.updateStatsForResponse(request.cxid, request.zxid,
                            lastOp, request.createTime, 
                            System.currentTimeMillis());
                    // 最后调用这个方法来完成session的初始化以及响应
                    zks.finishSessionInit(request.cnxn, true);
                    // 直接退出方法
                    return;
                }
            }
        }// 异常忽略
        // 新建连接不会执行到这里的代码来，因此略过
        ...
    }
}
```

#### 2.6 ZooKeeperServer新建连接生成响应对象

又再次回到了ZooKeeperServer类中，这里面执行了Server端针对新建连接的最后响应，其实我也搞不懂为什么要把新建连接单独的抽出来放到ZooKeeperServer类中来，或许唯一能解释的便是方便处理已存在session重新创建这个流程。

```java
public class ZooKeeperServer implements 
        SessionExpirer, ServerStats.Provider {
    public void finishSessionInit(ServerCnxn cnxn, boolean valid) {
        // 使用JMX监控注册连接对象cnxn
        try {
            // valid指的是是否成功创建session信息
            if (valid) {
                serverCnxnFactory.registerConnection(cnxn);
            }
        }...
        try {
            // 如果valid为true，则使用cnxn连接对象的sessionTimemout，否则为0
            // 如果valid为true，则使用cnxn连接对象的ssessionId，否则为0
            // 如果valid为true，则使用cnxn连接对象的ssessionId生成密码，否则空
            ConnectResponse rsp = new ConnectResponse(0, 
                    valid ? cnxn.getSessionTimeout()
                    : 0, valid ? cnxn.getSessionId() : 0,
                    valid ? generatePasswd(cnxn.getSessionId())
                    : new byte[16]);
            // 生成响应的字节对象
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            BinaryOutputArchive bos = BinaryOutputArchive.getArchive(baos);
            bos.writeInt(-1, "len");
            rsp.serialize(bos, "connect");
            if (!cnxn.isOldClient) {
                bos.writeBool(
                    this instanceof ReadOnlyZooKeeperServer, "readOnly");
            }
            baos.close();
            // 根据刚刚生成的字节数组申城ByteBuffer
            ByteBuffer bb = ByteBuffer.wrap(baos.toByteArray());
            bb.putInt(bb.remaining() - 4).rewind();
            // 发送ByteBuffer对象内容
            cnxn.sendBuffer(bb); 
            // 如果valid失效则关掉连接   
            if (!valid) {
                cnxn.sendBuffer(ServerCnxnFactory.closeConn);
            } else {
                // 如果成功则确保能读取到Client端发送过来的数据
                cnxn.enableRecv();
            }
        } catch (Exception e) {
            cnxn.close();
        }
    }
}
```

#### 2.7 NIOServerCnxn发送新建连接响应

执行到这一步已经到了新建连接的尾声了，这一步只有发送ByteBuffer对象的数据，其它的操作相对而言并不是很重要。

```java
public class NIOServerCnxn extends ServerCnxn {
    public void sendBuffer(ByteBuffer bb) {
        try {
            // 只有非关闭连接的操作才能使用Socket发送数据
            if (bb != ServerCnxnFactory.closeConn) {
                // 确保SelectionKey的OP_WRITE没有被开启，以确保等下wake唤醒
                // Selector可以进行重试
                if ((sk.interestOps() & SelectionKey.OP_WRITE) == 0) {
                    try {
                        // 发送缓存数据
                        sock.write(bb);
                    } catch (IOException e) {
                    }
                }
                if (bb.remaining() == 0) {
                    // 如果缓存数据发送完毕则更新ZK的Server状态
                    packetSent();
                    return;
                }
            }
            // 如果跑到这里说明ByteBuffer并未全部发送，因此需要唤醒Selector
            // 把剩余的ByteBuffer数据发送出去
            synchronized(this.factory){
                sk.selector().wakeup();
                // 添加到outgoingBuffers集合中交给doIO()方法里面的write方法
                // 类型处理，该逻辑在前面已经分析过了，可以直接回头看
                outgoingBuffers.add(bb);
                if (sk.isValid()) {
                    // 将OP_WRITE打开
                    sk.interestOps(
                            sk.interestOps() | SelectionKey.OP_WRITE);
                }
            }
        } 
    }
}
```

### 3.Client端接收响应

当第二步走完后便进入到了第三步Client接收Server端响应并调用监听器的步骤了。

#### 3.1 SendThread接收通知

前面已经说了，SendThread负责发送和接收包数据，当Server端发送了新建连接响应后该类就会接收并进行相应的处理。本次分析只会分析经过的逻辑部分，其它的逻辑不做分析。

```java
class SendThread extends ZooKeeperThread {
    @Override
    public void run() {
        ...
        while (state.isAlive()) {
            try {
                ...
                // 还是老地方，调用doTransport()方法处理NIO的事件
                clientCnxnSocket.doTransport(to, pendingQueue, 
                        outgoingQueue, ClientCnxn.this);
            }
        }
        ...
    }
}
```

#### 3.2 ClientCnxnSocketNIO处理读事件

这次进入到该类处理的便是OP_READ类型的NIO事件。

```java
public class ClientCnxnSocketNIO extends ClientCnxnSocket {
    @Override
    void doTransport(int waitTimeOut, List<Packet> pendingQueue, 
            LinkedList<Packet> outgoingQueue, ClientCnxn cnxn)
            throws IOException, InterruptedException {
        // 老逻辑，不再分析
        selector.select(waitTimeOut);
        Set<SelectionKey> selected;
        synchronized (this) {
            selected = selector.selectedKeys();
        }
        updateNow();
        for (SelectionKey k : selected) {
            SocketChannel sc = ((SocketChannel) k.channel());
            if ((k.readyOps() & SelectionKey.OP_CONNECT) != 0) {
                if (sc.finishConnect()) {
                    updateLastSendAndHeard();
                    sendThread.primeConnection();
                }
            } else if ((k.readyOps() & 
                    (SelectionKey.OP_READ | SelectionKey.OP_WRITE)) != 0) {
                // 针对客户端的响应均会进入到该方法中
                doIO(pendingQueue, outgoingQueue, cnxn);
            }
        }
        // 后面略
        ...
    }
    void doIO(List<Packet> pendingQueue, LinkedList<Packet> outgoingQueue, 
            ClientCnxn cnxn) throws InterruptedException, IOException {
        SocketChannel sock = (SocketChannel) sockKey.channel();
        if (sock == null) {
            throw new IOException("Socket is null!");
        }
        // 开始处理读事件
        if (sockKey.isReadable()) {
            // 从Socket中读取数据
            int rc = sock.read(incomingBuffer);
            if (rc < 0) {
                throw new EndOfStreamException();
            }
            // incomingBuffer已经读取完毕
            if (!incomingBuffer.hasRemaining()) {
                incomingBuffer.flip();
                if (incomingBuffer == lenBuffer) {
                    recvCount++;
                    readLength();
                } else if (!initialized) {
                    // 新建连接将会跑到这里来，因为此时Client端的initialized
                    // 还是为false，尚未初始化完成
                    // 开始读取连接响应结果
                    readConnectResult();
                    // 开启Socket的OP_READ操作
                    enableRead();
                    // 查看outgoingQueue队列是否有可读包数据
                    if (findSendablePacket(outgoingQueue, cnxn.sendThread
                        .clientTunneledAuthenticationInProgress())!=null){
                        // 如果有的话则开启OP_WRITE操作，准备下次轮询时处理
                        // 写事件
                        enableWrite();
                    }
                    // 设置initialized属性初始化完成并更新lastHeard属性
                    lenBuffer.clear();
                    incomingBuffer = lenBuffer;
                    updateLastHeard();
                    initialized = true;
                } else {
                    // 这里是当新建连接成功后普通的操作响应处理逻辑
                    sendThread.readResponse(incomingBuffer);
                    lenBuffer.clear();
                    incomingBuffer = lenBuffer;
                    updateLastHeard();
                }
            }
        }
        // 后面的处理写事件忽略
    }
    void readConnectResult() throws IOException {
        // 使用读取到的ByteBuffer对象反序列化得到ConnectResponse响应
        ByteBufferInputStream bbis = 
                new ByteBufferInputStream(incomingBuffer);
        BinaryInputArchive bbia = BinaryInputArchive.getArchive(bbis);
        ConnectResponse conRsp = new ConnectResponse();
        conRsp.deserialize(bbia, "connect");
        boolean isRO = false;
        try {
            // 读取readOnly属性
            isRO = bbia.readBool("readOnly");
        }...
        // 开始进行连接成功的操作
        this.sessionId = conRsp.getSessionId();
        sendThread.onConnected(conRsp.getTimeOut(), this.sessionId,
                conRsp.getPasswd(), isRO);
    }
}
```

#### 3.3 ClientCnxn处理连接成功

执行到这里基本上就已经算成功了，接下来的事情便是触发ZK的监听器。

```java
public class ClientCnxn {
    void onConnected(int _negotiatedSessionTimeout, long _sessionId,
        byte[] _sessionPasswd, boolean isRO) throws IOException {
        // _negotiatedSessionTimeout便是Client端和Server端互相协商获得的
        // sessionTimeout过期时间
        negotiatedSessionTimeout = _negotiatedSessionTimeout;
        // 时间小于等于0说明连接失败了
        if (negotiatedSessionTimeout <= 0) {
            state = States.CLOSED;
            // 发送ZK过期事件
            eventThread.queueEvent(new WatchedEvent(
                    Watcher.Event.EventType.None,
                    Watcher.Event.KeeperState.Expired, null));
            // 并且发送停止服务事件
            eventThread.queueEventOfDeath();
            throw new SessionExpiredException(warnInfo);
        }
        // 接下来便是设值了，具体的值在这里都可以看到
        readTimeout = negotiatedSessionTimeout * 2 / 3;
        connectTimeout = negotiatedSessionTimeout / hostProvider.size();
        hostProvider.onConnected();
        sessionId = _sessionId;
        sessionPasswd = _sessionPasswd;
        // 根据Server端传来的属性设值状态
        state = (isRO) ? States.CONNECTEDREADONLY : States.CONNECTED;
        seenRwServerBefore |= !isRO;
        // 确定等下要发送的事件类型
        KeeperState eventState = (isRO) ?
                KeeperState.ConnectedReadOnly : KeeperState.SyncConnected;
        // 使用EventThread线程对象发布监听事件
        eventThread.queueEvent(new WatchedEvent(
                Watcher.Event.EventType.None,
                eventState, null));
    }
}
```

#### 3.4 EventThread监听事件

前面说过SendThread负责和ZK的Server端进行交互，完成发送数据包和接收响应的任务，而EventThread则是根据SendThread接收到响应类型产生的事件类型进行轮询处理。也就是说SendThread负责和Server端对接，EventThread则是负责和SendThread对接，处理Client自己产生的ZK事件。

```java
class EventThread extends ZooKeeperThread {
    // 将要处理的ZK事件集合
    private final LinkedBlockingQueue<Object> waitingEvents;
    // 客户端的Watcher管理类
    private final ClientWatchManager watcher;
    public void queueEvent(WatchedEvent event) {
        // SendThread就是调用这个方法将对应的ZK事件传入进来开始ZK事件的生命周期
        // 如果session状态和当前一样且事件类型没有则直接退出，无需处理
        if (event.getType() == EventType.None
                && sessionState == event.getState()) {
            return;
        }
        sessionState = event.getState();
        // 使用传入的ZK事件和ClientWatchManager生成事件和监听器的绑定对象
        WatcherSetEventPair pair = new WatcherSetEventPair(
                watcher.materialize(event.getState(), event.getType(),
                        event.getPath()),
                        event);
        // 将事件和监听器的绑定对象添加到waitingEvents集合中，这个集合类型只
        // 会是WatcherSetEventPair或者Packet
        waitingEvents.add(pair);
    }
    @Override
    public void run() {
       try {
          isRunning = true;
          while (true) {
             // 轮询waitingEvents集合，取出其中的事件对象
             Object event = waitingEvents.take();
             // eventOfDeath为关闭事件
             if (event == eventOfDeath) {
                wasKilled = true;
             } else {
                // 不是关闭事件则开始处理事件
                processEvent(event);
             }
             if (wasKilled) {
                 synchronized (waitingEvents) {
                   // 如果是关闭事件则会等waitingEvents全部处理之后再把
                   // EventThread设置为停止运行且退出循环
                   if (waitingEvents.isEmpty()) {
                      isRunning = false;
                      break;
                   }
                }
             }
          }
       }// 异常处理忽略
       ...
    }
    private void processEvent(Object event) {
       try {
           if (event instanceof WatcherSetEventPair) {
               // 如果是正常的WatcherSetEventPair类型则直接取出里面所有的
               // 监听器传入绑定的事件依次执行，这个步骤便是对应我们自己开发
               // 的Watcher回调
               WatcherSetEventPair pair = (WatcherSetEventPair) event;
               for (Watcher watcher : pair.watchers) {
                   try {
                       watcher.process(pair.event);
                   }...
               }
           }// 后面是针对Packet事件类型进行的处理，回调类型是异步回调
           ...
       }// 异常处理忽略
       ...
   }
}
```

执行到这里新建连接的流程已经执行完毕了，接下来看下ClientWatchManager是如何将ZK的事件和Watcher进行绑定的。

#### 3.5 ClientWatchManager监听器管理类

这个类会管理四种逻辑类型的监听器，至于具体的类型可以看以前的文章。接下来简单的看下其materialize方法的实现。

```java
private static class ZKWatchManager implements ClientWatchManager {
    private final Map<String, Set<Watcher>> dataWatches =
        new HashMap<String, Set<Watcher>>();
    private final Map<String, Set<Watcher>> existWatches =
        new HashMap<String, Set<Watcher>>();
    private final Map<String, Set<Watcher>> childWatches =
        new HashMap<String, Set<Watcher>>();
    private volatile Watcher defaultWatcher;
    @Override
    public Set<Watcher> materialize(Watcher.Event.KeeperState state,
                                    Watcher.Event.EventType type,
                                    String clientPath) {
        // 将要返回的监听器集合
        Set<Watcher> result = new HashSet<Watcher>();
        switch (type) {
        case None:
            // 新建连接相关的事件类型都是None，不管是连接成功还是连接失败超时
            // 将默认监听器defaultWatcher添加到result中，这也就是为什么在
            // 新建ZooKeeper连接时传入Watcher新建连接相关的事件这个都会收到
            result.add(defaultWatcher);
            // 判断是否使用完之后删除，需要开关打开且ZK状态不是SyncConnected
            boolean clear = ClientCnxn.getDisableAutoResetWatch() &&
                    state != Watcher.Event.KeeperState.SyncConnected;
            // 将dataWatches中的监听器添加到result集合中
            synchronized(dataWatches) {
                for(Set<Watcher> ws: dataWatches.values()) {
                    result.addAll(ws);
                }
                if (clear) {
                    // 如果需要删除则把缓存的全删了
                    dataWatches.clear();
                }
            }
            // 后面的其它两种都是同样的操作，略过
            return result;
        case NodeDataChanged:
        case NodeCreated:
            // 节点变更类型事件，只有dataWatches和existWatches会参与
            synchronized (dataWatches) {
                addTo(dataWatches.remove(clientPath), result);
            }
            synchronized (existWatches) {
                addTo(existWatches.remove(clientPath), result);
            }
            break;
        case NodeChildrenChanged:
            // 子节点变更事件，只有childWatches参与
            synchronized (childWatches) {
                addTo(childWatches.remove(clientPath), result);
            }
            break;
        case NodeDeleted:
            // 节点被删除三种类型都会受到影响，操作方式和前面类似直接略过
            synchronized (dataWatches) {
                addTo(dataWatches.remove(clientPath), result);
            }
            ...
            break;
        default:
            throw new RuntimeException(msg);
        }
        return result;
    }
}
```

不得不说这是一个庞大的工程量，阅读完ZK的源码后对平时使用以及某些配置都有更加深刻的理解了，只是对于ZK的ByteBuffer空间大小的4字节分配还有些犯迷糊。后续再补回来。

能耐心看到这里的想必也是决定了把ZK琢磨透的秀儿吧。
