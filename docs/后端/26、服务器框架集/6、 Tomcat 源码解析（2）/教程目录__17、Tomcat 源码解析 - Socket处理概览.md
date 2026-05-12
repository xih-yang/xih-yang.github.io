# 17、Tomcat 源码解析 - Socket处理概览
- 来源：https://ddkk.com/zhuanlan/server/tomcat/2/17.html
- 分类：服务器框架
- 分组：教程目录
Tomcat关于接收socket的部分逻辑比较复杂，这篇通过涉及到相关类的abstract class的分析来掌握大概整个流程，上篇分析了connector，connector最终是通过connector标签的protocol属性来创建protocolhandler，调用相对应的init，start等方法，现在看下protocol的继承连，从下图可以看到，整个继承链会分http11和ajp，每个分支又分Nio、Nio2和Apr，后面的分析以Http11Nio这条线，关于AjpApr后面需要的时候进行分析。

现在大概分析AbstractProtocol 类，构造方法里创建相对应的EndPoint，下面是代码片段

```java
public AbstractProtocol(AbstractEndpoint<S,?> endpoint) {
        this.endpoint = endpoint;
        setConnectionLinger(Constants.DEFAULT_CONNECTION_LINGER);
        setTcpNoDelay(Constants.DEFAULT_TCP_NO_DELAY);
}
```

有几个重要属性

```java
………………
private Handler<S> handler;
protected Adapter adapter;
private final Set<Processor> waitingProcessors =
            Collections.newSetFromMap(new ConcurrentHashMap<Processor, Boolean>());
…………………………
```

```java
public void setExecutor(Executor executor) {
        endpoint.setExecutor(executor);
}
```

这个方法之前分析Connector的时候知道，executor是server.xml配置的executor，这里只是回顾一。看源码知道，get/set方法都会调用构造方法里面传进来的endpoint想对应的方法，有几个abstract方法，看子类的时候重点看这几个方法

```java
protected abstract Log getLog();
    protected abstract String getNamePrefix();
    protected abstract String getProtocolName();
    protected abstract UpgradeProtocol getNegotiatedProtocol(String name);
    protected abstract UpgradeProtocol getUpgradeProtocol(String name);
protected abstract Processor createUpgradeProcessor(SocketWrapperBase<?> socket, UpgradeToken upgradeToken);
```

有一系列的关于组件的方法init、start、pause、resume、stop和destroy方法

**Init****方法：**

注册protocol为JMX，注册endpoint为JMX调用endpoint的init protocol的jmx name是下面代码片段生产

```java
private ObjectName createObjectName() throws MalformedObjectNameException {
        domain = getAdapter().getDomain();
        if (domain == null) {
            return null;
        }
       //adapter的domain 
StringBuilder name = new StringBuilder(getDomain());
       //append “:type=ProtocolHandler,port=” 
name.append(":type=ProtocolHandler,port=");
        int port = getPort();
        if (port > 0) {
        //append port
            name.append(getPort());
        } else {
        //append auto- nameCounter自动增加
            name.append("auto-");
            name.append(getNameIndex());
        }
        InetAddress address = getAddress();
        if (address != null) {
//append “,address=hostAddress”
            name.append(",address=");
            name.append(ObjectName.quote(address.getHostAddress()));
        }
        return new ObjectName(name.toString());
}
```

Endpoint的jmx name下面的代码片段生成getName()->getNameInternal()

getNameInternal方法：

```java
private String getNameInternal() {
//子类覆写getNamePrefix()方法
        StringBuilder name = new StringBuilder(getNamePrefix());
        name.append('-');
        if (getAddress() != null) {
            name.append(getAddress().getHostAddress());
            name.append('-');
        }
        int port = getPort();
        if (port == 0) {
            name.append("auto-");
            name.append(getNameIndex());
            port = getLocalPort();
            if (port != -1) {
                name.append('-');
                name.append(port);
            }
        } else {
            name.append(port);
        }
        return name.toString();
}
```

**Start****方法：**

```java
public void start() throws Exception {
        if (getLog().isInfoEnabled()) {
            getLog().info(sm.getString("abstractProtocolHandler.start", getNameInternal()));
        }
//调用endpoint的start方法
        endpoint.start();
//goto AsyncTimeout分析
        asyncTimeout = new AsyncTimeout();
//启动AsyncTimeout的thread
        Thread timeoutThread = new Thread(asyncTimeout, getNameInternal() + "-AsyncTimeout");
        int priority = endpoint.getThreadPriority();
        if (priority < Thread.MIN_PRIORITY || priority > Thread.MAX_PRIORITY) {
            priority = Thread.NORM_PRIORITY;
        }
        timeoutThread.setPriority(priority);
        timeoutThread.setDaemon(true);
        timeoutThread.start();
}
AsyncTimeout分析：
protected class AsyncTimeout implements Runnable {
        private volatile boolean asyncTimeoutRunning = true;
        public void run() {
            while (asyncTimeoutRunning) {
                try {
                    Thread.sleep(1000);
                } catch (InterruptedException e) {
                }
                long now = System.currentTimeMillis();
                 //循环执行processor.timeoutAsync
                for (Processor processor : waitingProcessors) {
                   processor.timeoutAsync(now);
                }
                //如果endpoint pause并且asyncTimeoutRunning为true
                while (endpoint.isPaused() && asyncTimeoutRunning) {
                    try {
                        Thread.sleep(1000);
                    } catch (InterruptedException e) {
                        // Ignore
                    }
                }
            }
        }
        //protocol的stop方法调用
        protected void stop() {
            asyncTimeoutRunning = false;
            // Timeout any pending async request
            for (Processor processor : waitingProcessors) {
                processor.timeoutAsync(-1);
            }
        }
}
```

其他的方法基本上都是调用endpoint相对应的方法。

**AbstractEndpoint****类：**

下面看AbstractEndpoint类上面分析知道protocol会调用endpoint相对应的方法init、start方法等，init、start方法会调用abstract bind方法，start方法调用abstract startInternal方法，stop方法会调用abstract unbind方法，调用stopInternal方法。

```java
public final void init() throws Exception {
        if (bindOnInit) {
//调用bind方法，子类覆写
            bind();
            bindState = BindState.BOUND_ON_INIT;
        }
}
public final void start() throws Exception {
        if (bindState == BindState.UNBOUND) {
            bind();
            bindState = BindState.BOUND_ON_START;
        }
//回调startInternal方法，子类覆写
        startInternal ();
}
public void resume() {
        if (running) {
            paused = false;
        }
}
public void pause() {
        if (running && !paused) {
            paused = true;
            //停止接收connection
            unlockAccept();
            //子类设置赋值的handler
            getHandler().pause();
        }
}
public final void stop() throws Exception {
//调用stopInternal方法，子类覆写
        stopInternal();
        if (bindState == BindState.BOUND_ON_START) {
            unbind();
            bindState = BindState.UNBOUND;
        }
}
public final void destroy() throws Exception {
        if (bindState == BindState.BOUND_ON_INIT) {、
    //调用unbind方法，子类覆写
            unbind();
            bindState = BindState.UNBOUND;
        }
}
```

还要关注几个方法：

initializeConnectionLatch方法子类调用控制连接数

```java
protected LimitLatch initializeConnectionLatch() {
        if (maxConnections==-1) return null;
        if (connectionLimitLatch==null) {
//maxConnection默认是10000，实例化LimitLatch控制连接数
            connectionLimitLatch = new LimitLatch(getMaxConnections());
        }
        return connectionLimitLatch;
 }
```

destroySocket方法调用子类覆写的closeSocket：

```java
protected void destroySocket(U socket) {
        closeSocket(socket);
}
```

processSocket方法：

```java
public boolean processSocket(SocketWrapperBase<S> socketWrapper,
            SocketEvent event, boolean dispatch) {
        try {
            if (socketWrapper == null) {
                return false;
            }
            SocketProcessorBase<S> sc = processorCache.pop();
            if (sc == null) {
            //子类覆写createSocketProcessor创建Processor
                sc = createSocketProcessor(socketWrapper, event);
            } else {
            //不为null调用rest
                sc.reset(socketWrapper, event);
            }
            Executor executor = getExecutor();
            if (dispatch && executor != null) {
            //如果server.xml配置了executor，会把processor给execute
                executor.execute(sc);
            } else {
            //没有配置的话直接调用run
                sc.run();
            }
        } catch (RejectedExecutionException ree) {
            getLog().warn(sm.getString("endpoint.executor.fail", socketWrapper) , ree);
            return false;
        } catch (Throwable t) {
            ExceptionUtils.handleThrowable(t);
            getLog().error(sm.getString("endpoint.process.fail"), t);
            return false;
        }
        return true;
}
```

startAcceptorThreads方法：

```java
protected final void startAcceptorThreads() {
        //默认是acceptorThreadCount是1
        int count = getAcceptorThreadCount();
        acceptors = new ArrayList<>(count);
        for (int i = 0; i < count; i++) {
        //创建Acceptor的thread，goto分析Acceptor
            Acceptor<U> acceptor = new Acceptor<>(this);
            String threadName = getName() + "-Acceptor-" + i;
            acceptor.setThreadName(threadName);
            acceptors.add(acceptor);
            Thread t = new Thread(acceptor, threadName);
            t.setPriority(getAcceptorThreadPriority());
            t.setDaemon(getDaemon());
            t.start();
        }
}
分析Acceptor：
public void run() {
        int errorDelay = 0;
        while (endpoint.isRunning()) {
            //endpoint running一直执行
            while (endpoint.isPaused() && endpoint.isRunning()) {
                state = AcceptorState.PAUSED;
                try {
                    Thread.sleep(50);
                } catch (InterruptedException e) {
                }
            }
            if (!endpoint.isRunning()) {
                break;
            }
            state = AcceptorState.RUNNING;
            try {
                //线程执行到这个如果超过10000，将wait
                endpoint.countUpOrAwaitConnection();
                U socket = null;
                try {
                    //调用Endpoint子类覆写的serverSocketAccept
                    socket = endpoint.serverSocketAccept();
                } catch (Exception ioe) {
                    endpoint.countDownConnection();
                    if (endpoint.isRunning()) {
                        // Introduce delay if necessary
                        errorDelay = handleExceptionWithDelay(errorDelay);
                        // re-throw
                        throw ioe;
                    } else {
                        break;
                    }
                }
                errorDelay = 0;
                // Configure the socket
                if (endpoint.isRunning() && !endpoint.isPaused()) {
                     //调用endpoint子类覆写的setSocketOptions，配置socket
                    if (!endpoint.setSocketOptions(socket)) {
                        endpoint.closeSocket(socket);
                    }
                } else {
                    endpoint.destroySocket(socket);
                }
            } catch (Throwable t) {
                ExceptionUtils.handleThrowable(t);
                String msg = sm.getString("endpoint.accept.fail");
                // APR specific.
                // Could push this down but not sure it is worth the trouble.
                if (t instanceof Error) {
                    Error e = (Error) t;
                    if (e.getError() == 233) {
                        // Not an error on HP-UX so log as a warning
                        // so it can be filtered out on that platform
                        // See bug 50273
                        log.warn(msg, t);
                    } else {
                        log.error(msg, t);
                    }
                } else {
                        log.error(msg, t);
                }
            }
        }
        state = AcceptorState.ENDED;
}
```

几个抽象方法：

```java
protected abstract InetSocketAddress getLocalAddress() throws IOException;
protected abstract SocketProcessorBase<S> createSocketProcessor(
            SocketWrapperBase<S> socketWrapper, SocketEvent event);
public abstract void bind() throws Exception;
public abstract void unbind() throws Exception;
public abstract void startInternal() throws Exception;
public abstract void stopInternal() throws Exception;
protected abstract Log getLog();
protected abstract U serverSocketAccept() throws Exception;
protected abstract boolean setSocketOptions(U socket);
protected abstract void closeSocket(U socket);
protected abstract SSLHostConfig.Type getSslConfigType();
protected abstract void createSSLContext(SSLHostConfig sslHostConfig) throws Exception;
protected abstract void releaseSSLContext(SSLHostConfig sslHostConfig);
```

**AbstractJsseEndpoint 类：**

会覆写getSslConfigType、createSSLContext和releaseSSLContext方法，关于ssl操作，这个分析ssl的时候再分析

**NioEndpoint类：**

看上面覆写的几个abstract方法

a)serverSocketAccept方法，AbstractEndpoint父类startAcceptorThreads方法启动线程Acceptor的时候调用，startAcceptorThreads在子类startInternal方法中被调用.

```java
…………..
private ServerSocketChannel serverSock = null;
…………..
//这个方法虽然小但很重要，因为acceptor是调用他得到跟客户端通信的channel
protected SocketChannel serverSocketAccept() throws Exception {
         //对于NioEndpoint子类，父类范型U是SocketChannel
        return serverSock.accept();
}
```

b)setSocketOptions方法，AbstractEndpoint父类startAcceptorThreads方法启动线程Acceptor的时候调用，这个方法是设置serverSocketAccept得到的socket.对于NioEndpoint来说是SocketChannel.

```java
protected boolean setSocketOptions(SocketChannel socket) {
        try {
        //设置SocketChannel 为非阻塞模式，就是说与客户端的读写操作将是select模式的
            socket.configureBlocking(false);
            //获得跟这个channel相关联的socket
            Socket sock = socket.socket();
            // SocketProperties类设置socket的各个属性，具体属性后面分析
            socketProperties.setProperties(sock);
            //从nioChannels缓存中取NioChannel
            NioChannel channel = nioChannels.pop();
            if (channel == null) {
                SocketBufferHandler bufhandler = new SocketBufferHandler(
                        socketProperties.getAppReadBufSize(),
                        socketProperties.getAppWriteBufSize(),
                        socketProperties.getDirectBuffer());
                if (isSSLEnabled()) {
                    channel = new SecureNioChannel(socket, bufhandler, selectorPool, this);
                } else {
                    channel = new NioChannel(socket, bufhandler);
                }
            } else {
                channel.setIOChannel(socket);
                channel.reset();
            }
            //将channel注册到Poller中，goto分析Poller
            getPoller0().register(channel);
        } catch (Throwable t) {
            ExceptionUtils.handleThrowable(t);
            try {
                log.error("",t);
            } catch (Throwable tt) {
                ExceptionUtils.handleThrowable(tt);
            }
            // Tell to close the socket
            return false;
        }
        return true;
}
分析Poller：看源码，知道它也将作为一个线程启动，大致上来说，Poller就是处理跟client通信的入口，会调用其它对象来具体处理，先看下跟Poller相关的类PollerEvent，看代码发现PollerEvent主要是对之前创建的socketChannel register
OP_READ
public void run() {
          ………….
                    socket.getIOChannel().register(
                            socket.getPoller().getSelector(), SelectionKey.OP_READ, socketWrapper);
              ……………….
        }
再来看Poller，先看Poller的register方法，register方法主要是创建跟当前channel相关的PollerEvent，再看Poller的主要方法run(粗略分析，细节后面可以分析)
run{
    while(true){
a.调用PollerEvent的run方法，进行OP_READ事件的注册
b.selector.selectXXX
c.selector. selectedKeys
d.调用processKey 处理这个client发送过来的信息,从这里开始跟Engine的valve衔接上（后面会总结这个处理流程）
        close break
}
}
```

c)Bind方法，protocolhandler.init的时候调用：

```java
public void bind() throws Exception {
        //NIO ServerSocketChannel
        serverSock = ServerSocketChannel.open();
        //AbstractEndPoint定义的socketProperties,设置socket的属性
        socketProperties.setProperties(serverSock.socket());
        //创建address
        InetSocketAddress addr = (getAddress()!=null?new InetSocketAddress(getAddress(),getPort()):new InetSocketAddress(getPort()));
        //socket bind到adress，输入请求连接队列的最大长度默认是100
        serverSock.socket().bind(addr,getAcceptCount());
        //这里设置blocking为true，调用accept方法的时候依然会阻塞blocking
        serverSock.configureBlocking(true); 
        // Initialize thread count defaults for acceptor, poller
        if (acceptorThreadCount == 0) {
            acceptorThreadCount = 1;
        }
        if (pollerThreadCount <= 0) {
            //minimum one poller thread
            pollerThreadCount = 1;
        }
        stopLatch = new CountDownLatch(pollerThreadCount);
        //实例化ssl会调用父类的createSSLContext
        initialiseSsl();
         //调用NioSelectorPool的open方法，goto分析NioSelectorPool
        selectorPool.open();
}
分析NioSelectorPool：
NioSelectorPool.open->NioBlockingSelector.open(selector)-> BlockPoller.start
```

d)startInternal方法：

```java
public void startInternal() throws Exception {
        if (!running) {
            running = true;
            paused = false;
//创建processorCache、eventCache和nioChannels缓存
            processorCache = new SynchronizedStack<>(SynchronizedStack.DEFAULT_SIZE,
                    socketProperties.getProcessorCache());
            eventCache = new SynchronizedStack<>(SynchronizedStack.DEFAULT_SIZE,
                            socketProperties.getEventCache());
            nioChannels = new SynchronizedStack<>(SynchronizedStack.DEFAULT_SIZE,
                    socketProperties.getBufferPool());
            if ( getExecutor() == null ) {
                //server.xml没有配置executor则创建
                createExecutor();
            }
            //调用父类的initializeConnectionLatch方法，设置该EndPoint接收的最大连接数是10000（默认）
            initializeConnectionLatch();
            //启动Poller
            pollers = new Poller[getPollerThreadCount()];
            for (int i=0; i<pollers.length; i++) {
                pollers[i] = new Poller();
                Thread pollerThread = new Thread(pollers[i], getName() + "-ClientPoller-"+i);
                pollerThread.setPriority(threadPriority);
                pollerThread.setDaemon(true);
                pollerThread.start();
            }
             //调用父类的startAcceptorThreads方法，启动accptor线程
            startAcceptorThreads();
        }
}
```

Unbind方法和stopInternal方法主要处理清理资源的操作，这里不具体分析.

总结：tomcat对socket处理明显的体现了模板模式，父类体现主流程，子类覆盖abstract方法来处理差异性，关于tomcat对socket的具体处理上涉及到几个主要的类NioChannel、NioSocketWrapper、Acceptor线程、Poller线程、SocketProcessor、ConnectionHandler、Processor(Http11Processor)以及AbstractEndPoint一系列的EndPoint.，还有就是一系列对EndPoint的包装Handler.

系统启动的时候会首先调用子类的bind方法来进行开始监听前的处理工作，对于Nio来说就是ServerSocketChannel.open等.然后子类的startInternal方法会首先启动Poller线程（Nio），其次启动Acceptor线程，Acceptor线程负责的是接受客户端的连接，然后将socketChannel传递给Poller(register方法)，Poller则是处理跟客户端请求的入口,对这个流程简单的进行了一个梳理，后面会去分析tomcat处理socket的各个类以达到学习的目的.

NIOEndPoint.startInternal->Poller->NIOEndPoint.processKey->

NIOEndPoint.createSocketProcessor() 得到SocketProcessor 调用run->ConnectionHandler.process->Http11Processor.service->CoyoteAdapter.service(request, response);->connector.getService().getContainer().getPipeline().getFirst().invoke(request, response);

这里的CoyoteAdapter是衔接tomcat引擎和tomcat处理请求的类，这个要单独分析。

另外一条线是

sartInternal ->Acceptor(调用poller的register方法，给poller加工socket，注册read事件)

有个知识点记一下，socketChannl.register的时候可以给attachment

下面相关类的UML图
