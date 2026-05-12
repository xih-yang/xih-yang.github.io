# 07、Zookeeper 源码解析 - 心跳检测流程源码分析-单机Server服务端与Client客户端
- 来源：https://ddkk.com/zhuanlan/registered/zookeeper/1/7.html
- 分类：注册中心
- 分组：教程目录
## 一、源码解析

心跳检测的源码流程并不算长，但是要真的了解这个流程必须对ZK的各种参数及作用有所了解，否则这个流程理解不到核心思想。如果对大致流程以及参数意义解析有兴趣可以看上一篇[（六）Zookeeper原理源码分析之心跳检测流程及Session时间参数解析-单机Server服务端与Client客户端](/zhuanlan/registered/zookeeper/1/6.html)的分析。

### 1.Client发送ping请求

#### 1.1 SendThread心跳检测发起者

心跳检测的发送逻辑是在这个线程对象中完成的，会判断每次ping的时间间隔以及具体什么时候需要发送ping请求，下一篇有机会将会详细分析一下具体的参数意义。

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
        // 时间为10s
        final int MAX_SEND_PING_INTERVAL = 10000;
        // 如果ZK是存活的就一直轮询
        while (state.isAlive()) {
            try {
                // 未连接的情况忽略
                ...
                if (state.isConnected()) {
                    // 后面的关于zooKeeperSaslClient处理流程略过
                    ...
                    // 连接上之后使用的属性变成了readTimeout，getIdleRecv()
                    // 方法使用的属性为lastHeard，即最后一次监听到服务端响应
                    // 的时间戳
                    to = readTimeout - clientCnxnSocket.getIdleRecv();
                } else {
                    // 未连接时会进入，因此ping流程这里不会使用，可以得出结论
                    // connectTime属性只会在新建连接时被使用
                    // 连接上之后失去作用
                    to = connectTimeout - clientCnxnSocket.getIdleRecv();
                }
                if (to <= 0) {
                    // 如果进入到这里面，说明readTimeout或者connectTimeout
                    // 要小于上次监听到Server端的时间间隔，意味着时间过期
                    throw new SessionTimeoutException(warnInfo);
                }
                if (state.isConnected()) {
                    // 获取下次ping的时间，也可以说获取select()最大阻塞时间
                    // 这个公式分两个情况：
                    // 1、lastSend距今超过1000ms(1s)，则固定减去1000ms
                    // 具体公式表现为：(readTimeout / 2) - idleSend - 1000
                    // 2、lastSend距今小于等于1000ms，则不做任何操作
                    // 具体公式表现为：(readTimeout / 2) - idleSend
                    int timeToNextPing = readTimeout / 2 - 
                            clientCnxnSocket.getIdleSend() - 
                            ((clientCnxnSocket.getIdleSend() > 1000) 
                                    ? 1000 : 0);
                    // 如果timeToNextPing小于等于0或者idleSend间隔超过10s
                    // 说明是时候该发送ping请求确认连接了
                    if (timeToNextPing <= 0 || 
                            clientCnxnSocket.getIdleSend() > 
                                MAX_SEND_PING_INTERVAL) {
                        // 发送ping请求包
                        sendPing();
                        // 更新lastSend属性
                        clientCnxnSocket.updateLastSend();
                    } else {
                        // to在前面设的值
                        if (timeToNextPing < to) {
                            to = timeToNextPing;
                        }
                    }
                }
                // 中间是只读连接CONNECTEDREADONLY，略过
                ...
                // 要发送ping请求这个方法可能将会被调用两次，第一次是在
                // sendPing()之后调用，如果是OP_WRITE操作则可以立马进行写操作
                // 如果不是则会在第一次调用时开启OP_WRITE操作，轮询第二次的时候
                // 再调用一次用来发送ping数据包
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
    private void sendPing() {
        lastPingSentNs = System.nanoTime();
        // 创建xid为-2的RequestHeader对象
        RequestHeader h = new RequestHeader(-2, OpCode.ping);
        // ping请求只有RequestHeader有值，其它的都是null
        queuePacket(h, null, null, null, null, null, null, null, null);
    }
    Packet queuePacket(RequestHeader h, ReplyHeader r, Record request,
        Record response, AsyncCallback cb, String clientPath,
        String serverPath,Object ctx,WatchRegistration watchRegistration){
        // 方法的大致作用便是将前面传进来的RequestHeader对象封装成Packet对象
        // 并最终放入outgoingQueue数组等待下次发送数据包时发送
        Packet packet = null;
        synchronized (outgoingQueue) {
            packet = new Packet(h, r, request, response, 
                    watchRegistration);
            packet.cb = cb;
            packet.ctx = ctx;
            packet.clientPath = clientPath;
            packet.serverPath = serverPath;
            if (!state.isAlive() || closing) {
                conLossPacket(packet);
            } else {
                if (h.getType() == OpCode.closeSession) {
                    closing = true;
                }
                // 正常流程会进行到这里，前面的流程可以略过
                outgoingQueue.add(packet);
            }
        }
        // 调用selector.wakeup()方法来唤醒select()方法，调用这个方法的作用
        // 便是防止将ping数据包放到outgoingQueue后再次被select()方法阻塞从而
        // 直接调用阻塞方法的后面逻辑
        sendThread.getClientCnxnSocket().wakeupCnxn();
        return packet;
    }
}
```

#### 1.2 ClientCnxnSocket套接字交互类

和Socket进行交互的类，负责向Socket中写入数据和读取数据。在ping流程的第一步中只会执行写操作，因此接下来只需要关注写操作的源码即可。

```java
public class ClientCnxnSocketNIO extends ClientCnxnSocket {
    // NIO的多路复用选择器
    private final Selector selector = Selector.open();
    // 本Socket对应的SelectionKey
    private SelectionKey sockKey;
    // 是否已经初始化，默认false，到发送ping操作时该值一定为true
    protected boolean initialized;
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
                // 略过
                ...
            } else if ((k.readyOps() & 
                    (SelectionKey.OP_READ | SelectionKey.OP_WRITE)) != 0) {
                // 再判断是否是OP_READ或者OP_WRITE事件，在ping流程的第一步中
                // 执行到这里则一定是OP_WRITE事件
                doIO(pendingQueue, outgoingQueue, cnxn);
            }
        }
        // 如果这个代码块发生了作用并开启了OP_WRITE事件说明在前面调用sendPing()
        // 方法后并没有NIO事件发生，导致outgoingQueue只有一个ping数据包，需要
        // 在这里手动判断一次开启OP_WRITE。当然也不排除前面有NIO事件，并且通过
        // 前面的NIO事件产生了新的数据包导致需要开启OP_WRITE事件
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
                // 放进去的只有ping操作的Packet包对象
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
                        // ping的requestHeader一定不为空，但也是被排除了
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
                // 已经发送完毕则关闭OP_WRITE操作，ping操作只是一次通知操作
                // 因此就算这里被关闭了写操作也无所谓
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
                        // 调用socket.connect()方法才会进入，略过
                        ...
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
    // 是否已经初始化，默认值为false，接收ping时一定为true
    boolean initialized;
    private final ZooKeeperServer zkServer;
    // 本连接对应的sessionId，刚开始sessionId不会有，只有当ZK的Server端处理了
    // ConnectRequest之后才会被赋值
    long sessionId;
    // 写操作使用的ByteBuffer集合
    LinkedBlockingQueue<ByteBuffer> outgoingBuffers;
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
            // 如果是ping请求那么initialized一定为true
            if (!initialized) {
                readConnectRequest();
            } else {
                // 处理普通的Request请求，包括ping
                readRequest();
            }
            lenBuffer.clear();
            // 处理完这次请求后再将incomingBuffer复原
            incomingBuffer = lenBuffer;
        }
    }
    private void readRequest() throws IOException {
        // 直接调用ZK服务器对象处理数据包
        zkServer.processPacket(this, incomingBuffer);
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
    public void processPacket(ServerCnxn cnxn, ByteBuffer incomingBuffer) 
            throws IOException {
        // 第一件事便是反序列化RequestHeader对象，而ping只有RequestHeader信息
        // 因此这里一定是有值的
        InputStream bais = new ByteBufferInputStream(incomingBuffer);
        BinaryInputArchive bia = BinaryInputArchive.getArchive(bais);
        RequestHeader h = new RequestHeader();
        h.deserialize(bia, "header");
        incomingBuffer = incomingBuffer.slice();
        if (h.getType() == OpCode.auth) {
            // 认证相关，略过
            ...
        } else {
            if (h.getType() == OpCode.sasl) {
                // 略过
                ...
            } else {
                // ping以及其它的Request请求都会跑到这里来
                Request si = new Request(cnxn, cnxn.getSessionId(), 
                        h.getXid(), h.getType(), incomingBuffer, 
                        cnxn.getAuthInfo());
                si.setOwner(ServerCnxn.me);
                // 提交Request
                submitRequest(si);
            }
        }
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

#### 2.4 SessionTracker校验Session时间

既然前面分析过了更新Session时间，那么这里便不再分析，仅仅看一下更新过后的Session时间是在哪里被使用的。

在Client端有着一套机制来保持Session会话，而Server端肯定也是会有的。这个类的作用便是一直轮询查看哪些Session将要过期，如果过期了就进行相应的处理。

Server端保存着很多Client端的连接，Server端判断这些Client端是否依然存活的方法便是以ZK配置的tickTime属性为间隔，每个间隔时间点上都分布了若干个Client端对应的Session，而这些个间隔点上的Session就代表着这个时间点将会过期的Session，这样SessionTracker便只需要每隔一个tickTime单元时间遍历一次需要删除的Session将其设置过期即可，而无需每次轮询都遍历一次Session集合逐个判断，这种思想不可谓不妙啊。

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
    @Override
    synchronized public void run() {
        // 这个方法很简单，只需要每隔一个expirationInterval时间便从待删除
        // Session集合sessionSets中取出Session进行过期操作就行
        // 当然，这里很简单就说明在另外一个地方进行了SessionTimeout更新操作
        // 上一篇源码便介绍过本类中的touchSession，因此有兴趣的去翻看上一篇
        // 分析SessionTrackerImpl的源码解析，结合起来分析便可以知道ZK的巧妙
        try {
            while (running) {
                // 获取当前时间戳
                currentTime = System.currentTimeMillis();
                // 判断一下当前时间是否已经到达了下次过期时间点
                if (nextExpirationTime > currentTime) {
                    // 如果未到则直接阻塞剩余等待
                    this.wait(nextExpirationTime - currentTime);
                    continue;
                }
                SessionSet set;
                // 将nextExpirationTime时间点将要过期的Session全部取出来
                set = sessionSets.remove(nextExpirationTime);
                if (set != null) {
                    for (SessionImpl s : set.sessions) {
                        // 将这些Session逐个关闭并进行过期操作
                        setSessionClosing(s.sessionId);
                        // 这里面的过期操作实际上就是向客户端发送一个
                        // closeSession类型的响应
                        expirer.expire(s);
                    }
                }
                // 增加至下一个过期时间点
                nextExpirationTime += expirationInterval;
            }
        } catch (InterruptedException e) {
            ...
        }
    }
}
```

#### 2.5 RequestProcessor请求处理链

跳过中间的SessionTracker插曲，接下来看看RequestProcessor链对于ping操作做了什么处理。

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
        request.hdr = null;
        request.txn = null;
        try {
            switch (request.type) {
            // 与连接无关的case情况忽略
            ...
            case OpCode.ping:
                // 判断sessionId对应的Session是否是同一个
                zks.sessionTracker.checkSession(request.sessionId,
                        request.getOwner());
                break;
            ...
        } ...
        request.zxid = zks.getZxid();
        // 在调用下一个RequestProcessor前先来分析一下ping请求的具体属性
        // request.cnxn为连接对象，request.type为ping
        // request.request为ping的数据，request.txn为null，request.hdr为null
        // 调用下个RequestProcessor来处理Request
        nextProcessor.processRequest(request);
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

**2.5.3 FinalRequestProcessor**

```java
public class FinalRequestProcessor implements RequestProcessor {
    ZooKeeperServer zks;
    public void processRequest(Request request) {
        // 直接开始处理Request请求
        ProcessTxnResult rc = null;
        synchronized (zks.outstandingChanges) {
            // ping请求outstandingChanges数组一定为空，因此循环略过
            ...
            // ping请求的hdr为空，因此略过
            if (request.hdr != null) {
               ...
            }
            // ping请求判断为false
            if (Request.isQuorum(request.type)) {
                ...
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
            // 无关紧要的略过
            ...
            // 开始根据Request的操作类型进行相应的处理
            switch (request.type) {
                // 与连接无关的case忽略
                ...
                case OpCode.ping: {
                    // 更新ZK服务器的状态
                    zks.serverStats().updateLatency(request.createTime);
                    lastOp = "PING";
                    // 更新Client的连接对象属性
                    cnxn.updateStatsForResponse(request.cxid, request.zxid,
                            lastOp, request.createTime, 
                            System.currentTimeMillis());
                    // 对ping请求进行响应
                    cnxn.sendResponse(new ReplyHeader(-2,
                            zks.getZKDatabase()
                            .getDataTreeLastProcessedZxid(), 0), null, 
                            "response");
                    return;
                }
            }
        }// 异常忽略
        // ping请求不会执行到这里的代码来，因此略过
        ...
    }
}
```

#### 2.6 NIOServerCnxn发送ping响应

正常的流程走到这里，Server端的处理便是基本上要结束了，最后的步骤也是十分的简单，如果ByteBuffer空间足够则直接发送完成，如果不足够在NIOServerCnxnFactory中再进行一次NIO操作发送一次即可。

```java
public class NIOServerCnxn extends ServerCnxn {
    @Override
    synchronized public void sendResponse(ReplyHeader h, Record r, 
            String tag) {
        try {
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            BinaryOutputArchive bos = BinaryOutputArchive.getArchive(baos);
            try {
                // 写入四字节
                baos.write(fourBytes);
                // 写入header响应头
                bos.writeRecord(h, "header");
                if (r != null) {
                    bos.writeRecord(r, tag);
                }
                baos.close();
            } catch (IOException e) {
                LOG.error("Error serializing response");
            }
            // 使用ByteBuffer 封装字节数组
            byte b[] = baos.toByteArray();
            ByteBuffer bb = ByteBuffer.wrap(b);
            bb.putInt(b.length - 4).rewind();
            // 发送ByteBuffer对象数据
            sendBuffer(bb);
            // h.xid一定小于0，因此ping操作略过
            if (h.getXid() > 0) {
                ...
            }
         } catch(Exception e) {
         }
    }
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

当第二步走完后便进入到了第三步Client接收Server端响应并进行处理的阶段了，但ping请求收到响应并不会做些什么。

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
                    // 读取ping响应时连接肯定完成了，因此initialized为true
                    // 此逻辑不会生效，略过
                    ...
                } else {
                    // ping响应以及其它的普通请求将会跑到这里
                    sendThread.readResponse(incomingBuffer);
                    // 还原ByteBuffer对象
                    lenBuffer.clear();
                    incomingBuffer = lenBuffer;
                    // 更新lastHeard属性，表示已经处理完Server端的响应
                    updateLastHeard();
                }
            }
        }
        // 后面的处理写事件忽略
    }
}
```

#### 3.3 SendThread处理ping响应

这里只需要分析SendThread的readResponse()方法，这个方法用来处理普通请求响应。

```java
class SendThread extends ZooKeeperThread {
    void readResponse(ByteBuffer incomingBuffer) throws IOException {
        // 将从Server端获取的ByteBuffer数据反序列化得到ReplyHeader
        ByteBufferInputStream bbis = new ByteBufferInputStream(
                incomingBuffer);
        BinaryInputArchive bbia = BinaryInputArchive.getArchive(bbis);
        ReplyHeader replyHdr = new ReplyHeader();
        replyHdr.deserialize(bbia, "header");
        // ping的xid为-2，因此会进入到这里面
        if (replyHdr.getXid() == -2) {
            // ping操作在这里面不会进行任何操作，而是直接退出，因此
            // readResponse()对ping没有任何作用
            return;
        }
    }
}
```

至此，ping的交互流程便已经结束。
