# 09、Netty 源码分析 - Netty 程序引导类Bootstrap
- 来源：https://ddkk.com/zhuanlan/server/netty/3/9.html
- 分类：服务器框架
- 分组：教程目录
程序引导类（Bootstrap）可以理解为是一个程序的入口程序，在 Java 程序中，就是一个包含 main 方法的程序类。在 Netty 中，引导程序还包含一系列的配置项。本篇文章我们就来介绍 Netty 的引导程序。

## 引导程序类

引导程序类是一种引导程序，使 Netty 程序可以很容易地引导一个 Channel。在 Netty 中，承担引导程序的是 `AbstractBootStrap`抽象类。

引导程序类都在`io.netty.bootstrap`包下。`AbstractBootStrap`抽象类有两个子类：`Bootstrap`和`ServerBootstrap`，分别用于引导客户端程序及服务的程序。

下图展示了引导程序类的关系：

## AbstractBootStrap 抽象类

从上图可以看出，`AbstractBootStrap`抽象类实现了`Cloneable`接口。那么为什么需要实现`Cloneable`接口呢？

在Netty 中经常需要创建多个具有类似配置或者完全相同配置的`Channel`。为了支持这种模式而又不避免为每个`Channel`都创建并配置一个新的引导类实例，因此`AbstractBootStrap`被标记为了`Cloneable`。在一个已经配置完成的引导实例上调用`clone()`方法将返回另一个可以立即使用的引导类实例。

这种方式只会创建引导类实例的`EventLoopGroup`的一个浅拷贝，所以，`EventLoopGroup`将在所有克隆的`Channel`实例之间共享。这是可以接受的，毕竟这些克隆的`Channel`的生命周期都很短暂，例如，一个典型的场景是创建一个`Channel`以进行一次`HTTP`请求。

以下是`AbstractBootStrap`的核心源码：

```java
public abstract class AbstractBootstrap<B extends AbstractBootstrap<B, C>, C extends Channel> implements Cloneable {
    volatile EventLoopGroup group;
    private volatile ChannelFactory<? extends C> channelFactory;
    private volatile SocketAddress localAddress;
    private final Map<ChannelOption<?>, Object> options = new LinkedHashMap();
    private final Map<AttributeKey<?>, Object> attrs = new ConcurrentHashMap();
    private volatile ChannelHandler handler;
    AbstractBootstrap() {
        //禁止从其他程序包扩展
    }
    AbstractBootstrap(AbstractBootstrap<B, C> bootstrap) {
        this.group = bootstrap.group;
        this.channelFactory = bootstrap.channelFactory;
        this.handler = bootstrap.handler;
        this.localAddress = bootstrap.localAddress;
        synchronized(bootstrap.options) {
            this.options.putAll(bootstrap.options);
        }
        this.attrs.putAll(bootstrap.attrs);
    }
    //...
}
```

从上述源码可以看出，子类型B是其父类型的一个类型参数，因此可以返回到运行时实例的引用以支持方法的链式调用。从私有变量可以看出，`AbstractBootStrap`所要管理的启动配置包括`EventLoopGroup`、`SocketAddress`、`Channel配置`、`ChannelHandler`等信息。

`AbstractBootStrap`是禁止被除`io.netty.bootstrap`包外其他程序所扩展的，因此可以看到`AbstractBootStrap`默认构造方法被设置为了包内可见。

## Bootstrap 类

BootStrap 类是`AbstractBootStrap`抽象类的子类之一，主要是用于客户端或者使用了无连接协议的应用程序。

以下是`BootStrap`类的核心源码：

```java
public class Bootstrap extends AbstractBootstrap<Bootstrap, Channel> {
    private static final InternalLogger logger = InternalLoggerFactory.getInstance(Bootstrap.class);
    private static final AddressResolverGroup<?> DEFAULT_RESOLVER;
    private final BootstrapConfig config = new BootstrapConfig(this);
    private volatile AddressResolverGroup<SocketAddress> resolver;
    private volatile SocketAddress remoteAddress;
    public Bootstrap() {
        this.resolver = DEFAULT_RESOLVER;
    }
    private Bootstrap(Bootstrap bootstrap) {
        super(bootstrap);
        this.resolver = DEFAULT_RESOLVER;
        this.resolver = bootstrap.resolver;
        this.remoteAddress = bootstrap.remoteAddress;
    }
    public Bootstrap resolver(AddressResolverGroup<?> resolver) {
        this.resolver = resolver == null ? DEFAULT_RESOLVER : resolver;
        return this;
    }
    public Bootstrap remoteAddress(SocketAddress remoteAddress) {
        this.remoteAddress = remoteAddress;
        return this;
    }
    public Bootstrap remoteAddress(String inetHost, int inetPort) {
        this.remoteAddress = InetSocketAddress.createUnresolved(inetHost, inetPort);
        return this;
    }
    public Bootstrap remoteAddress(InetAddress inetHost, int inetPort) {
        this.remoteAddress = new InetSocketAddress(inetHost, inetPort);
        return this;
    }
    public ChannelFuture connect() {
        this.validate();
        SocketAddress remoteAddress = this.remoteAddress;
        if (remoteAddress == null) {
            throw new IllegalStateException("remoteAddress not set");
        } else {
            return this.doResolveAndConnect(remoteAddress, this.config.localAddress());
        }
    }
    public ChannelFuture connect(String inetHost, int inetPort) {
        return this.connect(InetSocketAddress.createUnresolved(inetHost, inetPort));
    }
    public ChannelFuture connect(InetAddress inetHost, int inetPort) {
        return this.connect(new InetSocketAddress(inetHost, inetPort));
    }
    public ChannelFuture connect(SocketAddress remoteAddress) {
        ObjectUtil.checkNotNull(remoteAddress, "remoteAddress");
        this.validate();
        return this.doResolveAndConnect(remoteAddress, this.config.localAddress());
    }
    public ChannelFuture connect(SocketAddress remoteAddress, SocketAddress localAddress) {
        ObjectUtil.checkNotNull(remoteAddress, "remoteAddress");
        this.validate();
        return this.doResolveAndConnect(remoteAddress, localAddress);
    }
	//...
    public Bootstrap validate() {
        super.validate();
        if (this.config.handler() == null) {
            throw new IllegalStateException("handler not set");
        } else {
            return this;
        }
    }
    public Bootstrap clone() {
        return new Bootstrap(this);
    }
    public Bootstrap clone(EventLoopGroup group) {
        Bootstrap bs = new Bootstrap(this);
        bs.group = group;
        return bs;
    }
    public final BootstrapConfig config() {
        return this.config;
    }
    final SocketAddress remoteAddress() {
        return this.remoteAddress;
    }
    final AddressResolverGroup<?> resolver() {
        return this.resolver;
    }
  	...
}
```

上述方法主要分为以下几类：

- group：设置用于处理Channel所有事件的EventLoopGroup。
- channel：指定了 Channel的实现类。
- localAddress：指定 Channel应该绑定到的本地地址。如果没有指定，则有操作系统创建一个随机的地址。或者，也可以通过bind()或者connect()方法指定localAddress。
- option：设置ChannelOption，其将被应用到每个新创建的Channel的ChannelConfig。这些选项将会通过bind()或者connect()方法设置到Channel，配置的顺序与调用先后没有关系。这个方法在Channel已经被创建后再次调用就不会再起任何效果了。支持什么样的ChannelOption取决于所使用的Channel类型。
- attr：指定新创建的Channel的属性值。这些属性值是通过bind()或者connect()方法设置到Channel。配置的顺序取决于调用的先后顺序。这个方法在Channel已经被创建后再次调用就不会再起任何效果了。
- handler：设置被添加到ChannelPipeline以接收事件通知的ChannelHandler。
- remoteAddress：设置远程地址。也可以通过connect()方法来指定它。
- clone：创建一个当前Bootstrap的克隆，其具有和原始的Bootstrap相同的设置信息。
- connect：用于连接到远程节点并返回一个ChannelFuture，并将会在连接操作完成后接收到通知。
- bind：绑定Channel并返回一个ChannelFuture，其将会在绑定操作完成之后接收到通知，在那之后必须调用Channel。

`BootStrap`类中许多方法都继承自`AbstractBootstrap`类。

## ServerBootstrap 类

ServerBootstrap 类是`AbstractBootStrap`抽象类的子类之一，主要是用于引导服务器程序。

以下是ServerBootstrap 类的源码：

```java
public class ServerBootstrap extends AbstractBootstrap<ServerBootstrap, ServerChannel> {
    private static final InternalLogger logger = InternalLoggerFactory.getInstance(ServerBootstrap.class);
    private final Map<ChannelOption<?>, Object> childOptions = new LinkedHashMap();
    private final Map<AttributeKey<?>, Object> childAttrs = new ConcurrentHashMap();
    private final ServerBootstrapConfig config = new ServerBootstrapConfig(this);
    private volatile EventLoopGroup childGroup;
    private volatile ChannelHandler childHandler;
    public ServerBootstrap() {
    }
    private ServerBootstrap(ServerBootstrap bootstrap) {
        super(bootstrap);
        this.childGroup = bootstrap.childGroup;
        this.childHandler = bootstrap.childHandler;
        synchronized(bootstrap.childOptions) {
            this.childOptions.putAll(bootstrap.childOptions);
        }
        this.childAttrs.putAll(bootstrap.childAttrs);
    }
    public ServerBootstrap group(EventLoopGroup group) {
        return this.group(group, group);
    }
    public ServerBootstrap group(EventLoopGroup parentGroup, EventLoopGroup childGroup) {
        super.group(parentGroup);
        if (this.childGroup != null) {
            throw new IllegalStateException("childGroup set already");
        } else {
            this.childGroup = (EventLoopGroup)ObjectUtil.checkNotNull(childGroup, "childGroup");
            return this;
        }
    }
    public <T> ServerBootstrap childOption(ChannelOption<T> childOption, T value) {
        ObjectUtil.checkNotNull(childOption, "childOption");
        synchronized(this.childOptions) {
            if (value == null) {
                this.childOptions.remove(childOption);
            } else {
                this.childOptions.put(childOption, value);
            }
            return this;
        }
    }
    public <T> ServerBootstrap childAttr(AttributeKey<T> childKey, T value) {
        ObjectUtil.checkNotNull(childKey, "childKey");
        if (value == null) {
            this.childAttrs.remove(childKey);
        } else {
            this.childAttrs.put(childKey, value);
        }
        return this;
    }
    public ServerBootstrap childHandler(ChannelHandler childHandler) {
        this.childHandler = (ChannelHandler)ObjectUtil.checkNotNull(childHandler, "childHandler");
        return this;
    }
	//...
    public ServerBootstrap clone() {
        return new ServerBootstrap(this);
    }
    /** @deprecated */
    @Deprecated
    public EventLoopGroup childGroup() {
        return this.childGroup;
    }
    final ChannelHandler childHandler() {
        return this.childHandler;
    }
    final Map<ChannelOption<?>, Object> childOptions() {
        synchronized(this.childOptions) {
            return copiedMap(this.childOptions);
        }
    }
    final Map<AttributeKey<?>, Object> childAttrs() {
        return copiedMap(this.childAttrs);
    }
    public final ServerBootstrapConfig config() {
        return this.config;
    }
    //...
}
```

上述方法主要分为以下几类：

- group：设置ServerBootstrap要用的EventLoopGroup。这个EventLoopGroup将用于ServerChannel和被接受的子Channel的 I/O 处理。
- channel：设置将要被实例化的ServerChannel类。
- localAddress：指定 ServerChannel应该绑定到的本地地址。如果没有指定，则有操作系统创建一个随机的地址。或者，也可以通过bind()方法指定localAddress。
- option：指定要应用到新创建的ServerChannel的ChannelConfig的ChannelOption。这些选项将会通过bind()设置到Channel，在bind()方法被调用之后，设置或者改变ChannelOption将不会有任何效果。支持什么样的ChannelOption取决于所使用的Channel类型。
- childOption：指定当子Channel被接受时，应用到子Channel的ChannelConfig的ChannelOption。所支持的ChannelOption取决于所使用的Channel类型。
- attr：指定ServerChannel上的属性值。这些属性值是通过bind()或者connect()方法设置到Channel。在bind()方法被调用之后它们将不会有任何效果。
- childAttr：将属性设置给已经被接受的子Channel。之后再次调用将不会有任何效果。
- handler：设置被添加到ServerChannel的ChannelPipeline中的ChannelHandler。
- childHandler：设置将被添加到已被接受的子Channel的ChannelPipeline中的ChannelHandler。
- clone：克隆一个设置好原始的ServerBootstrap相同的ServerBootstrap。
- bind：绑定ServerChannel并返回一个ChannelFuture，其将会在绑定操作完成之后接收到通知（带着成功或者失败的结果）。

`ServerBootstrap`类中许多方法都继承自`AbstractBootstrap`类。

## 引导服务器

为了能更好的理解引导程序，下面就以 Echo 协议的服务器的代码为例。核心代码如下：

```java
// 多线程事件循环器
EventLoopGroup bossGroup = new NioEventLoopGroup(); // boss
EventLoopGroup workerGroup = new NioEventLoopGroup(); // worker
try {
    // 启动NIO服务的引导程序类
    ServerBootstrap b = new ServerBootstrap(); 
    b.group(bossGroup, workerGroup) // 设置EventLoopGroup
        .channel(NioServerSocketChannel.class) // 指明新的Channel的类型
        .childHandler(new EchoServerHandler()) // 指定ChannelHandler
        .option(ChannelOption.SO_BACKLOG, 128) // 设置的ServerChannel的一些选项
        .childOption(ChannelOption.SO_KEEPALIVE, true); // 设置的ServerChannel的子Channel的选项
    // 绑定端口，开始接收进来的连接
    ChannelFuture f = b.bind(port).sync(); 
    System.out.println("EchoServer已启动，端口：" + port);
    // 等待服务器 socket 关闭 。
    // 在这个例子中，这不会发生，但你可以优雅地关闭你的服务器。
    f.channel().closeFuture().sync();
} finally {
    // 优雅的关闭
    workerGroup.shutdownGracefully();
    bossGroup.shutdownGracefully();
}
```

引导Netty 服务器主要分为几下几个步骤。

### 1、实例化引导程序类

在上述代码中，首先是需要实例化引导程序类。由于是服务器端的程序，所以，实例化了一个`ServerBootstrap`。

### 2、设置 EventLoopGroup

设置`ServerBootstrap`的`EventLoopGroup`。上述服务器使用了两个`NioEventLoopGroup`，一个代表`boss`线程组，一个代表`work`线程组。

`boss`线程主要是接收客户端的请求，并将请求转发给`work`线程处理。

`boss`线程是轻量的，不会处理耗时的任务，因此可以承受高并发的请求。而真实的 I/O 操作都是由`work`线程在执行。

`NioEventLoopGroup`是支持多线程的，因此可以执行线程池的大小。如果没有指定，则 Netty 会指定一个默认的线程池大小，核心代码如下：

```java
    private static final int DEFAULT_EVENT_LOOP_THREADS;
    static {
        // 默认 EventLoopGroup 的线程数
        DEFAULT_EVENT_LOOP_THREADS = Math.max(1, SystemPropertyUtil.getInt(
                "io.netty.eventLoopThreads", NettyRuntime.availableProcessors() * 2));
        if (logger.isDebugEnabled()) {
            logger.debug("-Dio.netty.eventLoopThreads: {}", DEFAULT_EVENT_LOOP_THREADS);
        }
    }
    public NioEventLoopGroup() {
        // 如果不指定， nThreads = 0
        this(0);
    }
    /**
     * @see MultithreadEventExecutorGroup#MultithreadEventExecutorGroup(int, Executor, Object...)
     */
    protected MultithreadEventLoopGroup(int nThreads, Executor executor, Object... args) {
        // 如果不指定（nThreads = 0），默认值是 DEFAULT_EVENT_LOOP_THREADS
        super(nThreads == 0 ? DEFAULT_EVENT_LOOP_THREADS : nThreads, executor, args);
    }
```

从上述源码可以看出，如果`NioEventLoopGroup`实例化时，没有指定线程数，则最终默认值是`DEFAULT_EVENT_LOOP_THREADS`，而默认值`DEFAULT_EVENT_LOOP_THREADS`是根据当前机子的CPU 处理的个数乘以 2 得出的。

### 3、指定 Channel 类型

`channel()`方法用于指定`ServerBootstrap`的`Channel`类型。在本例中，使用的是`NioServerSocketChannel`类型，代表了服务器是一个基于`ServerSocketChannel`的实现，使用基于 NIO 选择器的实现来接受新连接。

### 4、指定 ChannelHandler

`childHandler`用于指定`ChannelHandler`，以便处理`Channel`的请求。上述例子中，指定的是自定义的`EchoServerHandler`。

### 5、设置 Channel 选项

`option`和`childOption`方法，分别用于设置`ServerChannel`及`ServerChannel`的子`Channel`的选项。这些选项定义在`ChannelOption`类中，包含以下常量：

```java
public class ChannelOption<T> extends AbstractConstant<ChannelOption<T>> {
    public static final ChannelOption<ByteBufAllocator> ALLOCATOR = valueOf("ALLOCATOR");
    public static final ChannelOption<RecvByteBufAllocator> RCVBUF_ALLOCATOR = valueOf("RCVBUF_ALLOCATOR");
    public static final ChannelOption<MessageSizeEstimator> MESSAGE_SIZE_ESTIMATOR = valueOf("MESSAGE_SIZE_ESTIMATOR");
    public static final ChannelOption<Integer> CONNECT_TIMEOUT_MILLIS = valueOf("CONNECT_TIMEOUT_MILLIS");
    /**
     * @deprecated Use {@link MaxMessagesRecvByteBufAllocator}
     * and {@link MaxMessagesRecvByteBufAllocator#maxMessagesPerRead(int)}.
     */
    @Deprecated
    public static final ChannelOption<Integer> MAX_MESSAGES_PER_READ = valueOf("MAX_MESSAGES_PER_READ");
    public static final ChannelOption<Integer> WRITE_SPIN_COUNT = valueOf("WRITE_SPIN_COUNT");
    /**
     * @deprecated Use {@linkWRITE_BUFFER_WATER_MARK}
     */
    @Deprecated
    public static final ChannelOption<Integer> WRITE_BUFFER_HIGH_WATER_MARK = valueOf("WRITE_BUFFER_HIGH_WATER_MARK");
    /**
     * @deprecated Use {@linkWRITE_BUFFER_WATER_MARK}
     */
    @Deprecated
    public static final ChannelOption<Integer> WRITE_BUFFER_LOW_WATER_MARK = valueOf("WRITE_BUFFER_LOW_WATER_MARK");
    public static final ChannelOption<WriteBufferWaterMark> WRITE_BUFFER_WATER_MARK =
            valueOf("WRITE_BUFFER_WATER_MARK");
    public static final ChannelOption<Boolean> ALLOW_HALF_CLOSURE = valueOf("ALLOW_HALF_CLOSURE");
    public static final ChannelOption<Boolean> AUTO_READ = valueOf("AUTO_READ");
    /**
     * If {@code true} then the {@link Channel} is closed automatically and immediately on write failure.
     * The default value is {@code true}.
     */
    public static final ChannelOption<Boolean> AUTO_CLOSE = valueOf("AUTO_CLOSE");
    public static final ChannelOption<Boolean> SO_BROADCAST = valueOf("SO_BROADCAST");
    public static final ChannelOption<Boolean> SO_KEEPALIVE = valueOf("SO_KEEPALIVE");
    public static final ChannelOption<Integer> SO_SNDBUF = valueOf("SO_SNDBUF");
    public static final ChannelOption<Integer> SO_RCVBUF = valueOf("SO_RCVBUF");
    public static final ChannelOption<Boolean> SO_REUSEADDR = valueOf("SO_REUSEADDR");
    public static final ChannelOption<Integer> SO_LINGER = valueOf("SO_LINGER");
    public static final ChannelOption<Integer> SO_BACKLOG = valueOf("SO_BACKLOG");
    public static final ChannelOption<Integer> SO_TIMEOUT = valueOf("SO_TIMEOUT");
    public static final ChannelOption<Integer> IP_TOS = valueOf("IP_TOS");
    public static final ChannelOption<InetAddress> IP_MULTICAST_ADDR = valueOf("IP_MULTICAST_ADDR");
    public static final ChannelOption<NetworkInterface> IP_MULTICAST_IF = valueOf("IP_MULTICAST_IF");
    public static final ChannelOption<Integer> IP_MULTICAST_TTL = valueOf("IP_MULTICAST_TTL");
    public static final ChannelOption<Boolean> IP_MULTICAST_LOOP_DISABLED = valueOf("IP_MULTICAST_LOOP_DISABLED");
    public static final ChannelOption<Boolean> TCP_NODELAY = valueOf("TCP_NODELAY");
    @Deprecated
    public static final ChannelOption<Boolean> DATAGRAM_CHANNEL_ACTIVE_ON_REGISTRATION =
            valueOf("DATAGRAM_CHANNEL_ACTIVE_ON_REGISTRATION");
    public static final ChannelOption<Boolean> SINGLE_EVENTEXECUTOR_PER_GROUP =
            valueOf("SINGLE_EVENTEXECUTOR_PER_GROUP");
}
```

### 6、绑定端口启动服务

`bind()`方法用于绑定端口，会创建一个`Channel`而后启动服务。

绑定成功后，返回一个`ChannelFuture`，以代表是一个异步的操作。在上述的例子里，使用的是`sync()`方法，以同步的方式来获取服务启动的结果。

## 引导客户端

为了能更好的理解引导程序，下面就以 Echo 协议的客户端的代码为例。核心代码如下：

```java
// 配置客户端
EventLoopGroup group = new NioEventLoopGroup();
try {
    Bootstrap b = new Bootstrap();
    b.group(group)
        .channel(NioSocketChannel.class)
        .option(ChannelOption.TCP_NODELAY, true)
        .handler(new EchoClientHandler());
    // 连接到服务器
    ChannelFuture f = b.connect(hostName, portNumber).sync();
    Channel channel = f.channel();
    ByteBuffer writeBuffer = ByteBuffer.allocate(32);
    try (BufferedReader stdIn = new BufferedReader(new InputStreamReader(System.in))) {
        String userInput;
        while ((userInput = stdIn.readLine()) != null) {
            writeBuffer.put(userInput.getBytes());
            writeBuffer.flip();
            writeBuffer.rewind();
            // 转为ByteBuf
            ByteBuf buf = Unpooled.copiedBuffer(writeBuffer);
            // 写消息到管道
            channel.writeAndFlush(buf);
            // 清理缓冲区
            writeBuffer.clear();
        }
    } catch (UnknownHostException e) {
        System.err.println("不明主机，主机名为： " + hostName);
        System.exit(1);
    } catch (IOException e) {
        System.err.println("不能从主机中获取I/O，主机名为：" + hostName);
        System.exit(1);
    }
} finally {
    // 优雅的关闭
    group.shutdownGracefully();
}
```

引导Netty 客户端主要分为几下几个步骤。

### 1、实例化引导程序类

在上述代码中，首先是需要实例化引导程序类。由于是客户端的程序，所以，实例化了一个`Bootstrap`。

### 2、设置 EventLoopGroup

设置`Bootstrap`的`EventLoopGroup`。不同于服务器，客户端只需要使用了一个`NioEventLoopGroup`。

### 3、指定 Channel 类型

`channel()`方法用于指定`Bootstrap`的`Channel`类型。在本例中，由于是客户端使用，使用的是`NioSocketChannel`类型，代表了客户端是一个基于`SocketChannel`的实现，使用基于 NIO 选择器的实现来发起连接请求。

### 4、设置 Channel 选项

`option`用于设置`Channel`的选项。这些选项定义在`ChannelOption`类中。

### 5、指定 ChannelHandler

`Handler`用于设置处理服务端请求的`ChannelHandler`。上述例子中，指定的是自定义的`EchoClientHandler`。

### 6、连接到服务器

`connect()`方法用于连接到指定的服务器的`Channel`。

连接成功后，返回一个`ChannelFuture`，以代表是一个异步的操作。在上述的例子里，使用的是`sync()`方法，以同步的方式来获取服务启动的结果。

## 总结

通过上述对引导程序类的介绍，相信大家对于服务端和客户端的引导程序以及一些配置项的都有了一定的了解。通过看源码，我们就能更加清楚的知道 Netty 服务端和客户端的启动的过程。下节我们来分析Netty的线程模型。
