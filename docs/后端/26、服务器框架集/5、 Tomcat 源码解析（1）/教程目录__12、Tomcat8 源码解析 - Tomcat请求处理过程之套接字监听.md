# 12、Tomcat8 源码解析 - Tomcat请求处理过程之套接字监听
- 来源：https://ddkk.com/zhuanlan/server/tomcat/1/12.html
- 分类：服务器框架
- 分组：教程目录
Tomcat源码版本：apache-tomcat-8.5.54-src

JDK源码版本：jdk1.8.0_171

## 一、服务端套接字绑定到IP和端口

```java
org.apache.catalina.core.StandardServer::initInternal 初始化Server
-->org.apache.catalina.core.StandardService::initInternal 初始化Service
---->org.apache.catalina.core.StandardEngine::initInternal 初始化Engine
---->org.apache.catalina.connector.Connector::initInternal 初始化连接器
------->org.apache.coyote.http11.AbstractHttp11Protocol::init 初始化Handler
--------->org.apache.coyote.AbstractProtocol::init
---------->org.apache.tomcat.util.net.AbstractEndpoint::init
----------->org.apache.tomcat.util.net.NioEndpoint::bind
```

```java
public class NioEndpoint extends AbstractJsseEndpoint<NioChannel> {
    @Override
    public void bind() throws Exception {
        if (!getUseInheritedChannel()) {
            serverSock = ServerSocketChannel.open();
            socketProperties.setProperties(serverSock.socket());
            InetSocketAddress addr = (getAddress()!=null?new InetSocketAddress(getAddress(),getPort()):new InetSocketAddress(getPort()));
            serverSock.socket().bind(addr,getAcceptCount());//将serverSock绑定IP和端口 最大处理连接数默认100
        } else {
            // Retrieve the channel provided by the OS
            Channel ic = System.inheritedChannel();
            if (ic instanceof ServerSocketChannel) {
                serverSock = (ServerSocketChannel) ic;
            }
            if (serverSock == null) {
                throw new IllegalArgumentException(sm.getString("endpoint.init.bind.inherited"));
            }
        }
        serverSock.configureBlocking(true); //mimic APR behavior
        // Initialize thread count defaults for acceptor, poller
        if (acceptorThreadCount == 0) {
            // FIXME: Doesn't seem to work that well with multiple accept threads
            acceptorThreadCount = 1;
        }
        if (pollerThreadCount <= 0) {
            //minimum one poller thread
            pollerThreadCount = 1;
        }
        setStopLatch(new CountDownLatch(pollerThreadCount));
        // Initialize SSL if needed
        initialiseSsl();
        selectorPool.open();
    }
}
```

## 二、Tomcat启动监听

```java
org.apache.catalina.core.StandardServer::startInternal
->org.apache.catalina.core.StandardService::startInternal
-->org.apache.catalina.core.StandardEngine::startInternal
--->org.apache.catalina.core.StandardContext::startInternal
---->org.apache.catalina.connector.Connector::startInternal
----->org.apache.coyote.AbstractProtocol::start 
------>org.apache.tomcat.util.net.AbstractEndpoint::start
------->org.apache.tomcat.util.net.NioEndpoint::startInternal
```

```java
public class NioEndpoint extends AbstractJsseEndpoint<NioChannel> {
    @Override
    public void startInternal() throws Exception {
        if (!running) {
            running = true;
            paused = false;
            processorCache = new SynchronizedStack<>(SynchronizedStack.DEFAULT_SIZE,
                    socketProperties.getProcessorCache());
            eventCache = new SynchronizedStack<>(SynchronizedStack.DEFAULT_SIZE,
                            socketProperties.getEventCache());
            nioChannels = new SynchronizedStack<>(SynchronizedStack.DEFAULT_SIZE,
                    socketProperties.getBufferPool());
            //创建工作者线程池
            if ( getExecutor() == null ) {
                createExecutor();
            }
            //初始化连接latch，用于限制请求的并发量
            initializeConnectionLatch();
            //开启poller线程。poller用于对接受者线程生产的消息（或事件）进行处理，poller最终调用的是Handler的代码
            pollers = new Poller[getPollerThreadCount()];
            for (int i=0; i<pollers.length; i++) {
                pollers[i] = new Poller();
                Thread pollerThread = new Thread(pollers[i], getName() + "-ClientPoller-"+i);
                pollerThread.setPriority(threadPriority);
                pollerThread.setDaemon(true);
                pollerThread.start();
            }
            //开启acceptor线程
            startAcceptorThreads();
        }
    }
}
```

-------->org.apache.tomcat.util.net.AbstractEndpoint::startAcceptorThreads

```java
public abstract class AbstractEndpoint<S> {
    //创建和启动Acceptor线程
    protected final void startAcceptorThreads() {
        int count = getAcceptorThreadCount();//Acceptor线程数量  默认1个
        acceptors = new Acceptor[count];
        for (int i = 0; i < count; i++) {
            acceptors[i] = createAcceptor();
            String threadName = getName() + "-Acceptor-" + i;
            acceptors[i].setThreadName(threadName);
            Thread t = new Thread(acceptors[i], threadName);
            t.setPriority(getAcceptorThreadPriority());
            t.setDaemon(getDaemon());
            t.start();//启动Acceptor线程
        }
    }
    ......
}
```

下面列出关键代码，配合上面大图，多调试几次来理解：

```java
public class NioEndpoint extends AbstractJsseEndpoint<NioChannel> {
   /**
     * 监听TCP/IP连接的后台线程
     * AbstractEndpoint.Acceptor实现Runnable接口
     */
    protected class Acceptor extends AbstractEndpoint.Acceptor {
        @Override
        public void run() {
            int errorDelay = 0;
            while (running) {
                // Loop if endpoint is paused
                while (paused && running) {
                    state = AcceptorState.PAUSED;
                    try {
                        Thread.sleep(50);
                    } catch (InterruptedException e) {
                    }
                }
                if (!running) {
                    break;
                }
                state = AcceptorState.RUNNING;
                try {
                    //达到最大连接数就进行等待
                    countUpOrAwaitConnection();
                    SocketChannel socket = null;
                    try {
                        //接受来自服务器套接字的下一个传入连接
                        socket = serverSock.accept();
                    } catch (IOException ioe) {
                        countDownConnection();
                        if (running) {
                            errorDelay = handleExceptionWithDelay(errorDelay);
                            throw ioe;
                        } else {
                            break;
                        }
                    }
                    // Successful accept, reset the error delay
                    errorDelay = 0;
                    if (running && !paused) {
                        if (!setSocketOptions(socket)) {//配置套接字
                            closeSocket(socket);//关闭套接字
                        }
                    } else {
                        closeSocket(socket);
                    }
                } catch (Throwable t) {
                    ExceptionUtils.handleThrowable(t);
                    log.error(sm.getString("endpoint.accept.fail"), t);
                }
            }
            state = AcceptorState.ENDED;
        }
        private void closeSocket(SocketChannel socket) {
            countDownConnection();
            try {
                socket.socket().close();
            } catch (IOException ioe)  {
                if (log.isDebugEnabled()) {
                    log.debug(sm.getString("endpoint.err.close"), ioe);
                }
            }
            try {
                socket.close();
            } catch (IOException ioe) {
                if (log.isDebugEnabled()) {
                    log.debug(sm.getString("endpoint.err.close"), ioe);
                }
            }
        }
    }
    //若成功转给Poller线程该函数返回true，否则返回false。
    //返回false后，Acceptor类的closeSocket函数会关闭通道和底层Socket连接并将当前最大连接数减一。
    protected boolean setSocketOptions(SocketChannel socket) {
        // Process the connection
        try {
            //disable blocking, APR style, we are gonna be polling it
            socket.configureBlocking(false);
            Socket sock = socket.socket();
            socketProperties.setProperties(sock);
            //从NioChannel栈中出栈一个，若能重用（即不为null）则重用对象，否则新建一个NioChannel对象；
            NioChannel channel = nioChannels.pop();
            if (channel == null) {
                SocketBufferHandler bufhandler = new SocketBufferHandler(
                        socketProperties.getAppReadBufSize(),//8192
                        socketProperties.getAppWriteBufSize(),//8192
                        socketProperties.getDirectBuffer());//false
                if (isSSLEnabled()) {
                    channel = new SecureNioChannel(socket, bufhandler, selectorPool, this);
                } else {
                    channel = new NioChannel(socket, bufhandler);
                }
            } else {
                channel.setIOChannel(socket);
                channel.reset();
            }
            //将channel注册到poller，注意关键的两个方法，getPoller0()和Poller.register()
            getPoller0().register(channel);
        } catch (Throwable t) {
            ExceptionUtils.handleThrowable(t);
            try {
                log.error("",t);
            } catch (Throwable tt) {
                ExceptionUtils.handleThrowable(tt);
            }
            return false;
        }
        return true;
    }
    //getPoller0方法利用轮转法选择一个Poller线程，利用Poller类的register方法将上述NioChannel对象注册到该Poller线程上；
    //以取模的方式对poller数量进行轮询获取。
    public Poller getPoller0() {
        int idx = Math.abs(pollerRotater.incrementAndGet()) % pollers.length;
        return pollers[idx];
    }
    /**
     * Poller线程主要用于以较少的资源轮询已连接套接字以保持连接，当数据可用时转给工作线程。
       Poller线程数由NioEndPoint的pollerThreadCount成员变量控制，默认值为2与可用处理器数二者之间的较小值。
       Poller实现了Runnable接口，可以看到构造函数为每个Poller打开了一个新的Selector。
     */
    public class Poller implements Runnable {
        ...
        private Selector selector;        
        public Poller() throws IOException {
            this.selector = Selector.open();
        }
        public Selector getSelector() { return selector;}
        //Poller维持了一个events同步队列，所以Acceptor接受到的channel会放在这个队列里面，放置的代码为events.offer(event);
        private final SynchronizedQueue<PollerEvent> events = new SynchronizedQueue<>();
        /**
         * 若成功转给Poller线程该函数返回true，否则返回false。
         * 返回false后，Acceptor类的closeSocket函数会关闭通道和底层Socket连接并将当前最大连接数减一。
         */
        public void register(final NioChannel socket) {
            socket.setPoller(this);
            NioSocketWrapper ka = new NioSocketWrapper(socket, NioEndpoint.this);
            socket.setSocketWrapper(ka);
            ka.setPoller(this);
            ka.setReadTimeout(getSocketProperties().getSoTimeout());
            ka.setWriteTimeout(getSocketProperties().getSoTimeout());
            ka.setKeepAliveLeft(NioEndpoint.this.getMaxKeepAliveRequests());
            ka.setSecure(isSSLEnabled());
            ka.setReadTimeout(getConnectionTimeout());
            ka.setWriteTimeout(getConnectionTimeout());
            PollerEvent r = eventCache.pop();
            ka.interestOps(SelectionKey.OP_READ);//this is what OP_REGISTER turns into.
            if ( r==null) r = new PollerEvent(socket,ka,OP_REGISTER);
            else r.reset(socket,ka,OP_REGISTER);
            addEvent(r);
        }
        private void addEvent(PollerEvent event) {
            events.offer(event);
            if ( wakeupCounter.incrementAndGet() == 0 ) selector.wakeup();
        }
        //若队列里有元素则会先把队列里的事件均执行一遍，PollerEvent的run方法会将通道注册到Poller的Selector上；
        //对select返回的SelectionKey进行处理，由于在PollerEvent中注册通道时带上了NioSocketWrapper附件，
        //因此这里可以用SelectionKey的attachment方法得到，接着调用processKey去处理已连接套接字通道。
        public void run() {
            while (true) {
                boolean hasEvents = false;
                try {
                    if (!close) {
                        hasEvents = events();
                        if (wakeupCounter.getAndSet(-1) > 0) {
                            keyCount = selector.selectNow();
                        } else {
                            keyCount = selector.select(selectorTimeout);
                        }
                        wakeupCounter.set(0);
                    }
                    if (close) {
                        events();
                        timeout(0, false);
                        try {
                            selector.close();
                        } catch (IOException ioe) {
                            log.error(sm.getString("endpoint.nio.selectorCloseFail"), ioe);
                        }
                        break;
                    }
                } catch (Throwable x) {
                    ExceptionUtils.handleThrowable(x);
                    log.error("",x);
                    continue;
                }
                if ( keyCount == 0 ) hasEvents = (hasEvents | events());
                //获取当前选择器中所有注册的“选择键(已就绪的监听事件)”
                Iterator<SelectionKey> iterator = keyCount > 0 ? selector.selectedKeys().iterator() : null;
                //对已经准备好的key进行处理
                while (iterator != null && iterator.hasNext()) {
                    SelectionKey sk = iterator.next();
                    NioSocketWrapper attachment = (NioSocketWrapper)sk.attachment();
                    if (attachment == null) {
                        iterator.remove();
                    } else {
                        iterator.remove();
                        //真正处理key的地方
                        processKey(sk, attachment);
                    }
                }
                //process timeouts
                timeout(keyCount,hasEvents);
            }
            getStopLatch().countDown();
        }
        public boolean events() {
            boolean result = false;
            PollerEvent pe = null;
            for (int i = 0, size = events.size(); i < size && (pe = events.poll()) != null; i++ ) {
                result = true;
                try {
                    pe.run();
                    pe.reset();
                    if (running && !paused) {
                        eventCache.push(pe);
                    }
                } catch ( Throwable x ) {
                    log.error("",x);
                }
            }
            return result;
        }
        //processKey()，该方法又会根据key的类型，来分别处理读和写
        protected void processKey(SelectionKey sk, NioSocketWrapper attachment) {
            try {
                if ( close ) {
                    cancelledKey(sk);
                } else if ( sk.isValid() && attachment != null ) {
                    if (sk.isReadable() || sk.isWritable() ) {
                        if ( attachment.getSendfileData() != null ) {
                            processSendfile(sk,attachment, false);
                        } else {
                            unreg(sk, attachment, sk.readyOps());
                            boolean closeSocket = false;
                            //1. 处理读事件，比如生成Request对象
                            if (sk.isReadable()) {
                                if (!processSocket(attachment, SocketEvent.OPEN_READ, true)) {
                                    closeSocket = true;
                                }
                            }
                            //2. 处理写事件，比如将生成的Response对象通过socket写回客户端
                            if (!closeSocket && sk.isWritable()) {
                                if (!processSocket(attachment, SocketEvent.OPEN_WRITE, true)) {
                                    closeSocket = true;
                                }
                            }
                            if (closeSocket) {
                                cancelledKey(sk);
                            }
                        }
                    }
                } else {
                    //invalid key
                    cancelledKey(sk);
                }
            } catch ( CancelledKeyException ckx ) {
                cancelledKey(sk);
            } catch (Throwable t) {
                ExceptionUtils.handleThrowable(t);
                log.error("",t);
            }
        }
        ...
    }
    //PollerEvent实现了Runnable接口，用来表示一个轮询事件
    public static class PollerEvent implements Runnable {
        .....
        @Override
        public void run() {
            if (interestOps == OP_REGISTER) {//OP_REGISTER，则说明该事件表示的已连接套接字通道尚未被轮询线程处理过，那么将该通道注册到Poller线程的Selector上
                try {
                    //OP_READ，通道注册的附件是一个NioSocketWrapper对象
                    socket.getIOChannel().register(socket.getPoller().getSelector(), SelectionKey.OP_READ, socketWrapper);
                } catch (Exception x) {
                    log.error(sm.getString("endpoint.nio.registerFail"), x);
                }
            } else {
                final SelectionKey key = socket.getIOChannel().keyFor(socket.getPoller().getSelector());
                try {
                    if (key == null) {
                        socket.socketWrapper.getEndpoint().countDownConnection();
                        ((NioSocketWrapper) socket.socketWrapper).closed = true;
                    } else {
                        final NioSocketWrapper socketWrapper = (NioSocketWrapper) key.attachment();
                        if (socketWrapper != null) {
                            int ops = key.interestOps() | interestOps;
                            socketWrapper.interestOps(ops);
                            key.interestOps(ops);
                        } else {
                            socket.getPoller().cancelledKey(key);
                        }
                    }
                } catch (CancelledKeyException ckx) {
                    try {
                        socket.getPoller().cancelledKey(key);
                    } catch (Exception ignore) {}
                }
            }
        }
        ...
    }
    protected SocketProcessorBase<NioChannel> createSocketProcessor(
            SocketWrapperBase<NioChannel> socketWrapper, SocketEvent event) {
        return new SocketProcessor(socketWrapper, event);
    }
    protected class SocketProcessor extends SocketProcessorBase<NioChannel> {
        public SocketProcessor(SocketWrapperBase<NioChannel> socketWrapper, SocketEvent event) {
            super(socketWrapper, event);
        }
        @Override
        protected void doRun() {
            NioChannel socket = socketWrapper.getSocket();
            SelectionKey key = socket.getIOChannel().keyFor(socket.getPoller().getSelector());
            try {
                int handshake = -1;
                try {
                    if (key != null) {
                        if (socket.isHandshakeComplete()) {
                            handshake = 0;
                        } else if (event == SocketEvent.STOP || event == SocketEvent.DISCONNECT ||
                                event == SocketEvent.ERROR) {
                            handshake = -1;
                        } else {
                            handshake = socket.handshake(key.isReadable(), key.isWritable());
                            event = SocketEvent.OPEN_READ;
                        }
                    }
                } catch (IOException x) {
                    handshake = -1;
                    if (log.isDebugEnabled()) log.debug("Error during SSL handshake",x);
                } catch (CancelledKeyException ckx) {
                    handshake = -1;
                }
                if (handshake == 0) {
                    SocketState state = SocketState.OPEN;
                    // 将处理逻辑交给Handler处理，当event为null时，则表明是一个OPEN_READ事件
                    if (event == null) {
                        state = getHandler().process(socketWrapper, SocketEvent.OPEN_READ);
                    } else {
                        state = getHandler().process(socketWrapper, event);
                    }
                    if (state == SocketState.CLOSED) {
                        close(socket, key);
                    }
                } else if (handshake == -1 ) {
                    getHandler().process(socketWrapper, SocketEvent.CONNECT_FAIL);
                    close(socket, key);
                } else if (handshake == SelectionKey.OP_READ){
                    socketWrapper.registerReadInterest();
                } else if (handshake == SelectionKey.OP_WRITE){
                    socketWrapper.registerWriteInterest();
                }
            } catch (CancelledKeyException cx) {
                socket.getPoller().cancelledKey(key);
            } catch (VirtualMachineError vme) {
                ExceptionUtils.handleThrowable(vme);
            } catch (Throwable t) {
                log.error("", t);
                socket.getPoller().cancelledKey(key);
            } finally {
                socketWrapper = null;
                event = null;
                //return to cache
                if (running && !paused) {
                    processorCache.push(this);
                }
            }
        }
    }
}
public abstract class AbstractEndpoint<S> {
    public boolean processSocket(SocketWrapperBase<S> socketWrapper,
            SocketEvent event, boolean dispatch) {
        try {
            if (socketWrapper == null) {
                return false;
            }
            // 1. 从processorCache里面拿一个Processor来处理socket，Processor的实现为SocketProcessor
            SocketProcessorBase<S> sc = processorCache.pop();
            if (sc == null) {
                sc = createSocketProcessor(socketWrapper, event);
            } else {
                sc.reset(socketWrapper, event);
            }
            // 2. 将Processor放到工作线程池中执行
            Executor executor = getExecutor();
            //dispatch参数表示是否要在另外的线程中处理，上文processKey各处传递的参数都是true。
            //dispatch为true且工作线程池存在时会执行executor.execute(sc)，之后是由工作线程池处理已连接套接字；
            //否则继续由Poller线程自己处理已连接套接字。
            if (dispatch && executor != null) {
                executor.execute(sc);
            } else {
                sc.run();//最终调用 SocketProcessor的dorun方法
            }
        } catch (RejectedExecutionException ree) {
            getLog().warn(sm.getString("endpoint.executor.fail", socketWrapper) , ree);
            return false;
        } catch (Throwable t) {
            ExceptionUtils.handleThrowable(t);
            // This means we got an OOM or similar creating a thread, or that
            // the pool and its queue are full
            getLog().error(sm.getString("endpoint.process.fail"), t);
            return false;
        }
        return true;
    }
    ...
}
protected static class AbstractProtocol<S>$ConnectionHandler<S> implements AbstractEndpoint.Handler<S> {
        ...
        @Override
        public SocketState process(SocketWrapperBase<S> wrapper, SocketEvent status) {
            ...
            S socket = wrapper.getSocket();
            Processor processor = connections.get(socket);
            ...
            try {
                ...
                if (processor == null) {
                    processor = recycledProcessors.pop();
                    ...
                }
                if (processor == null) {
                    processor = getProtocol().createProcessor();
                    register(processor);
                    ...
                }
                processor.setSslSupport(wrapper.getSslSupport(getProtocol().getClientCertProvider()));
                // Associate the processor with the connection
                connections.put(socket, processor);
                SocketState state = SocketState.CLOSED;
                do {
                    // 最最关键的代码
                    state = processor.process(wrapper, status);
                    ....
                } while ( state == SocketState.UPGRADING);
                if (state == SocketState.LONG) {                    
                    longPoll(wrapper, processor);
                    if (processor.isAsync()) {
                        getProtocol().addWaitingProcessor(processor);
                    }
                } else if (state == SocketState.OPEN) {                    
                    connections.remove(socket);
                    release(processor);
                    wrapper.registerReadInterest();
                } else if (state == SocketState.SENDFILE) {
                } else if (state == SocketState.UPGRADED) {                    
                    if (status != SocketEvent.OPEN_WRITE) {
                        longPoll(wrapper, processor);
                        getProtocol().addWaitingProcessor(processor);
                    }
                } else if (state == SocketState.SUSPENDED) {
                } else {                    
                    connections.remove(socket);
                    ....
                    release(processor);
                }
                return state;
            } catch(java.net.SocketException e) {
                ...
            } catch (java.io.IOException e) {
                ...
            } catch (ProtocolException e) {
                ...
            }
            catch (OutOfMemoryError oome) {
                ...
            } catch (Throwable e) {
                ...
            } finally {
                ContainerThreadMarker.clear();
            }
            connections.remove(socket);
            release(processor);
            return SocketState.CLOSED;
        }
        ...
}
public abstract class AbstractHttp11Protocol<S> extends AbstractProtocol<S> {
    @Override
    protected Processor createProcessor() {
        Http11Processor processor = new Http11Processor(this, getEndpoint());
        processor.setAdapter(getAdapter());
        //默认的 KeepAlive 情况下, 每个 Socket 处理的最多的 请求次数
        processor.setMaxKeepAliveRequests(getMaxKeepAliveRequests());
        // http 当遇到文件上传时的 默认超时时间 (300 000)   
        processor.setConnectionUploadTimeout(getConnectionUploadTimeout());
        processor.setDisableUploadTimeout(getDisableUploadTimeout());
        processor.setRestrictedUserAgents(getRestrictedUserAgents());
        //最大的 Post 处理尺寸的大小 4 * 1000  
        processor.setMaxSavePostSize(getMaxSavePostSize());
        return processor;
    }
    ...
}
public abstract class AbstractProcessorLight implements Processor {
    private Set<DispatchType> dispatches = new CopyOnWriteArraySet<>();
    @Override
    public SocketState process(SocketWrapperBase<?> socketWrapper, SocketEvent status)
            throws IOException {
        SocketState state = SocketState.CLOSED;
        Iterator<DispatchType> dispatches = null;
        do {
            if (dispatches != null) {
                DispatchType nextDispatch = dispatches.next();
                ...
                state = dispatch(nextDispatch.getSocketStatus());
                if (!dispatches.hasNext()) {
                    state = checkForPipelinedData(state, socketWrapper);
                }
            } else if (status == SocketEvent.DISCONNECT) {                
            } else if (isAsync() || isUpgrade() || state == SocketState.ASYNC_END) {
                state = dispatch(status);
                state = checkForPipelinedData(state, socketWrapper);
            } else if (status == SocketEvent.OPEN_WRITE) {                
                state = SocketState.LONG;
            } else if (status == SocketEvent.OPEN_READ) {
                state = service(socketWrapper);// 调用service()方法
            } else if (status == SocketEvent.CONNECT_FAIL) {
                logAccess(socketWrapper);
            } else {               
                state = SocketState.CLOSED;
            }
            ...
            if (isAsync()) {
                state = asyncPostProcess();
                if (getLog().isDebugEnabled()) {
                    getLog().debug("Socket: [" + socketWrapper +
                            "], State after async post processing: [" + state + "]");
                }
            }
            if (dispatches == null || !dispatches.hasNext()) {
                dispatches = getIteratorAndClearDispatches();
            }
        } while (state == SocketState.ASYNC_END ||
                dispatches != null && state != SocketState.CLOSED);
        return state;
    }
}
public class Http11Processor extends AbstractProcessor {
    @Override
    public SocketState service(SocketWrapperBase<?> socketWrapper)
        throws IOException {
        RequestInfo rp = request.getRequestProcessor();//生成Request和Response对象        
        ...
        while (!getErrorState().isError() && keepAlive && !isAsync() && upgradeToken == null &&
                sendfileState == SendfileState.DONE && !endpoint.isPaused()) {
            // Parsing the request header
            try {
                if (!inputBuffer.parseRequestLine(keptAlive)) {
                    if (inputBuffer.getParsingRequestLinePhase() == -1) {
                        return SocketState.UPGRADING;
                    } else if (handleIncompleteRequestLineRead()) {
                        break;
                    }
                }
                prepareRequestProtocol();
                if (endpoint.isPaused()) {
                    // 503 - Service unavailable
                    response.setStatus(503);
                    setErrorState(ErrorState.CLOSE_CLEAN, null);
                } else {
                    keptAlive = true;
                    request.getMimeHeaders().setLimit(endpoint.getMaxHeaderCount());
                    if (!http09 && !inputBuffer.parseHeaders()) {
                        openSocket = true;
                        readComplete = false;
                        break;
                    }
                    if (!disableUploadTimeout) {
                        socketWrapper.setReadTimeout(connectionUploadTimeout);
                    }
                }
            } catch (IOException e) {
                ....
            } catch (Throwable t) {
                ....
                // 400 - Bad Request
                response.setStatus(400);
                setErrorState(ErrorState.CLOSE_CLEAN, t);
            }
            ...
            if (getErrorState().isIoAllowed()) {
                rp.setStage(org.apache.coyote.Constants.STAGE_PREPARE);
                try {
                    prepareRequest();//解析请求
                } catch (Throwable t) {
                    ...
                    // 500 - Internal Server Error
                    response.setStatus(500);
                    setErrorState(ErrorState.CLOSE_CLEAN, t);
                }
            }
            if (maxKeepAliveRequests == 1) {
                keepAlive = false;
            } else if (maxKeepAliveRequests > 0 &&
                    socketWrapper.decrementKeepAlive() <= 0) {
                keepAlive = false;
            }
            // Process the request in the adapter
            if (getErrorState().isIoAllowed()) {
                try {
                    rp.setStage(org.apache.coyote.Constants.STAGE_SERVICE);
                    getAdapter().service(request, response);//调用Adapter.service方法
                    ...
                } catch (InterruptedIOException e) {
                    ...
                } catch (HeadersTooLargeException e) {
                    ...
                } catch (Throwable t) {
                    ...
                    // 500 - Internal Server Error
                    response.setStatus(500);
                    setErrorState(ErrorState.CLOSE_CLEAN, t);
                    getAdapter().log(request, response, 0);
                }
            }
            ...
        }
        rp.setStage(org.apache.coyote.Constants.STAGE_ENDED);
        ...
    }
    ...
}
public class CoyoteAdapter implements Adapter {
    ...
    @Override
    public void service(org.apache.coyote.Request req, org.apache.coyote.Response res)
            throws Exception {
        // 1. 根据coyote框架的request和response对象，生成connector的request和response对象（是HttpServletRequest和HttpServletResponse的封装）
        Request request = (Request) req.getNote(ADAPTER_NOTES);
        Response response = (Response) res.getNote(ADAPTER_NOTES);
        if (request == null) {
            // Create objects
            request = connector.createRequest();
            request.setCoyoteRequest(req);
            response = connector.createResponse();
            response.setCoyoteResponse(res);
            // Linkobjects
            request.setResponse(response);
            response.setRequest(request);
            // Set as notes
            req.setNote(ADAPTER_NOTES, request);
            res.setNote(ADAPTER_NOTES, response);
            // Set query string encoding
            req.getParameters().setQueryStringCharset(connector.getURICharset());
        }
        //2. 补充header
        if (connector.getXpoweredBy()) {
            response.addHeader("X-Powered-By", POWERED_BY);
        }
        boolean async = false;
        boolean postParseSuccess = false;
        req.getRequestProcessor().setWorkerThreadName(THREAD_NAME.get());
        try {
            // 3. 解析请求，该方法会出现代理服务器、设置必要的header等操作
            // 用来处理请求映射 (获取 host, context, wrapper, URI 后面的参数的解析, sessionId )
            postParseSuccess = postParseRequest(req, request, res, response);
            if (postParseSuccess) {
                //check valves if we support async
                request.setAsyncSupported(
                        connector.getService().getContainer().getPipeline().isAsyncSupported());
                // 4. 真正进入容器的地方，调用Engine容器下pipeline的阀门
                connector.getService().getContainer().getPipeline().getFirst().invoke(request, response);
            }
            if (request.isAsync()) {
                async = true;
                ReadListener readListener = req.getReadListener();
                if (readListener != null && request.isFinished()) {
                    // Possible the all data may have been read during service()
                    // method so this needs to be checked here
                    ClassLoader oldCL = null;
                    try {
                        oldCL = request.getContext().bind(false, null);
                        if (req.sendAllDataReadEvent()) {
                            req.getReadListener().onAllDataRead();
                        }
                    } finally {
                        request.getContext().unbind(false, oldCL);
                    }
                }
                Throwable throwable =
                        (Throwable) request.getAttribute(RequestDispatcher.ERROR_EXCEPTION);
                // If an async request was started, is not going to end once
                // this container thread finishes and an error occurred, trigger
                // the async error process
                if (!request.isAsyncCompleting() && throwable != null) {
                    request.getAsyncContextInternal().setErrorState(throwable, true);
                }
            } else {
                //5. 通过request.finishRequest 与 response.finishResponse(刷OutputBuffer中的数据到浏览器) 来完成整个请求
                request.finishRequest();
                //将 org.apache.catalina.connector.Response对应的 OutputBuffer 中的数据 刷到 org.apache.coyote.Response 对应的 InternalOutputBuffer 中, 
                //并且最终调用 socket对应的 outputStream 将数据刷出去( 这里会组装 Http Response 中的 header 与 body 里面的数据, 并且刷到远端 )
                response.finishResponse();
            }
        } catch (IOException e) {
        } finally {
            AtomicBoolean error = new AtomicBoolean(false);
            res.action(ActionCode.IS_ERROR, error);
            if (request.isAsyncCompleting() && error.get()) {
                res.action(ActionCode.ASYNC_POST_PROCESS,  null);
                async = false;
            }
            // Access log
            if (!async && postParseSuccess) {
                Context context = request.getContext();
                Host host = request.getHost();                
                long time = System.currentTimeMillis() - req.getStartTime();
                if (context != null) {
                    context.logAccess(request, response, time, false);
                } else if (response.isError()) {
                    if (host != null) {
                        host.logAccess(request, response, time, false);
                    } else {
                        connector.getService().getContainer().logAccess(
                                request, response, time, false);
                    }
                }
            }
            req.getRequestProcessor().setWorkerThreadName(null);
            // Recycle the wrapper request and response
            if (!async) {
                updateWrapperErrorCount(request, response);
                request.recycle();
                response.recycle();
            }
        }
    }
    protected boolean postParseRequest(org.apache.coyote.Request req, Request request,
            org.apache.coyote.Response res, Response response) throws IOException, ServletException {
        if (req.scheme().isNull()) {
            req.scheme().setString(connector.getScheme());
            request.setSecure(connector.getSecure());
        } else {
            request.setSecure(req.scheme().equals("https"));
        }
        String proxyName = connector.getProxyName();
        int proxyPort = connector.getProxyPort();
        if (proxyPort != 0) {
            req.setServerPort(proxyPort);
        } else if (req.getServerPort() == -1) {
            if (req.scheme().equals("https")) {
                req.setServerPort(443);
            } else {
                req.setServerPort(80);
            }
        }
        if (proxyName != null) {
            req.serverName().setString(proxyName);
        }
        MessageBytes undecodedURI = req.requestURI();
        if (undecodedURI.equals("*")) {
            if (req.method().equalsIgnoreCase("OPTIONS")) {
                StringBuilder allow = new StringBuilder();
                allow.append("GET, HEAD, POST, PUT, DELETE, OPTIONS");
                // Trace if allowed
                if (connector.getAllowTrace()) {
                    allow.append(", TRACE");
                }
                res.setHeader("Allow", allow.toString());
                // Access log entry as processing won't reach AccessLogValve
                connector.getService().getContainer().logAccess(request, response, 0, true);
                return false;
            } else {
                response.sendError(400, "Invalid URI");
            }
        }
        //req.getURLDecoder()得到一个UDecoder实例，它的convert方法对URI解码，这里的解码只是移除百分号，
        //计算百分号后两位的十六进制数字值以替代原来的三位百分号编码；
        MessageBytes decodedURI = req.decodedURI();
        if (undecodedURI.getType() == MessageBytes.T_BYTES) {
            // Copy the raw URI to the decodedURI
            decodedURI.duplicate(undecodedURI);
            // parsePathParameters方法去除URI中分号表示的路径参数
            parsePathParameters(req, request);
            try {
            //req.getURLDecoder()得到一个UDecoder实例，它的convert方法对URI解码，这里的解码只是移除百分号，计算百分号后两位的十六进制数字值以替代原来的三位百分号编码；
                req.getURLDecoder().convert(decodedURI.getByteChunk(), connector.getEncodedSolidusHandlingInternal());
            } catch (IOException ioe) {
                response.sendError(400, "Invalid URI: " + ioe.getMessage());
            }
            // normalize方法规格化URI，解释路径中的“.”和“..”；
            if (normalize(req.decodedURI())) {
                // convertURI方法利用Connector的uriEncoding属性将URI的字节转换为字符表示；
                convertURI(decodedURI, request);
                // Check that the URI is still normalized
                if (!checkNormalize(req.decodedURI())) {
                    response.sendError(400, "Invalid URI");
                }
            } else {
                response.sendError(400, "Invalid URI");
            }
        } else {
            decodedURI.toChars();
            CharChunk uriCC = decodedURI.getCharChunk();
            int semicolon = uriCC.indexOf(';');
            if (semicolon > 0) {
                decodedURI.setChars(uriCC.getBuffer(), uriCC.getStart(), semicolon);
            }
        }
        // Request mapping.
        MessageBytes serverName;
        if (connector.getUseIPVHosts()) {
            serverName = req.localName();
            if (serverName.isNull()) {
                // well, they did ask for it
                res.action(ActionCode.REQ_LOCAL_NAME_ATTRIBUTE, null);
            }
        } else {
            serverName = req.serverName();
        }
        // Version for the second mapping loop and
        // Context that we expect to get for that version
        String version = null;
        Context versionContext = null;
        boolean mapRequired = true;
        if (response.isError()) {
            // An error this early means the URI is invalid. Ensure invalid data
            // is not passed to the mapper. Note we still want the mapper to
            // find the correct host.
            decodedURI.recycle();
        }
        while (mapRequired) {
            //connector.getService().getMapper().map(serverName, decodedURI, version, request.getMappingData()) 这行，
            //之前Service启动时MapperListener注册了该Service内的各Host和Context。
            //根据URI选择Context时，Mapper的map方法采用的是convertURI方法解码后的URI与每个Context的路径去比较
            connector.getService().getMapper().map(serverName, decodedURI,version, request.getMappingData());
            if (request.getContext() == null) {
                if (!response.isError()) {
                    response.sendError(404, "Not found");
                }
                return true;
            }
            String sessionID;
            if (request.getServletContext().getEffectiveSessionTrackingModes()
                    .contains(SessionTrackingMode.URL)) {
                // Get the session ID if there was one
                sessionID = request.getPathParameter(
                        SessionConfig.getSessionUriParamName(
                                request.getContext()));
                if (sessionID != null) {
                    request.setRequestedSessionId(sessionID);
                    request.setRequestedSessionURL(true);
                }
            }
            // Look for session ID in cookies and SSL session
            try {
                parseSessionCookiesId(request);
            } catch (IllegalArgumentException e) {
                // Too many cookies
                if (!response.isError()) {
                    response.setError();
                    response.sendError(400);
                }
                return true;
            }
            parseSessionSslId(request);
            sessionID = request.getRequestedSessionId();
            mapRequired = false;
            if (version != null && request.getContext() == versionContext) {
            } else {
                version = null;
                versionContext = null;
                Context[] contexts = request.getMappingData().contexts;
                if (contexts != null && sessionID != null) {
                    for (int i = contexts.length; i > 0; i--) {
                        Context ctxt = contexts[i - 1];
                        if (ctxt.getManager().findSession(sessionID) != null) {
                            if (!ctxt.equals(request.getMappingData().context)) {
                                version = ctxt.getWebappVersion();
                                versionContext = ctxt;
                                request.getMappingData().recycle();
                                mapRequired = true;
                                request.recycleSessionInfo();
                                request.recycleCookieInfo(true);
                            }
                            break;
                        }
                    }
                }
            }
            if (!mapRequired && request.getContext().getPaused()) {
                try {
                    Thread.sleep(1000);
                } catch (InterruptedException e) {
                    // Should never happen
                }
                // Reset mapping
                request.getMappingData().recycle();
                mapRequired = true;
            }
        }
        // Possible redirect
        MessageBytes redirectPathMB = request.getMappingData().redirectPath;
        if (!redirectPathMB.isNull()) {
            String redirectPath = URLEncoder.DEFAULT.encode(
                    redirectPathMB.toString(), StandardCharsets.UTF_8);
            String query = request.getQueryString();
            if (request.isRequestedSessionIdFromURL()) {
                // This is not optimal, but as this is not very common, it
                // shouldn't matter
                redirectPath = redirectPath + ";" +
                        SessionConfig.getSessionUriParamName(
                            request.getContext()) +
                    "=" + request.getRequestedSessionId();
            }
            if (query != null) {
                // This is not optimal, but as this is not very common, it
                // shouldn't matter
                redirectPath = redirectPath + "?" + query;
            }
            response.sendRedirect(redirectPath);
            request.getContext().logAccess(request, response, 0, true);
            return false;
        }
        // Filter trace method
        if (!connector.getAllowTrace()
                && req.method().equalsIgnoreCase("TRACE")) {
            Wrapper wrapper = request.getWrapper();
            String header = null;
            if (wrapper != null) {
                String[] methods = wrapper.getServletMethods();
                if (methods != null) {
                    for (int i=0; i < methods.length; i++) {
                        if ("TRACE".equals(methods[i])) {
                            continue;
                        }
                        if (header == null) {
                            header = methods[i];
                        } else {
                            header += ", " + methods[i];
                        }
                    }
                }
            }
            if (header != null) {
                res.addHeader("Allow", header);
            }
            response.sendError(405, "TRACE method is not allowed");
            // Safe to skip the remainder of this method.
            return true;
        }
        doConnectorAuthenticationAuthorization(req, request);
        return true;
    }
    ...
}
```
