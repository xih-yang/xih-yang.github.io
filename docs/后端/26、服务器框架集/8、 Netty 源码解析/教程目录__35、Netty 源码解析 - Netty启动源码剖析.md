# 35、Netty 源码解析 - Netty启动源码剖析
- 来源：https://ddkk.com/zhuanlan/server/netty/1/35.html
- 分类：服务器框架
- 分组：教程目录
## 一、基本说明

1、只有看过Netty源码，才能说是真正掌握了Netty框架。

2、在 io.netty.example 包下，有很多Netty源码案例，可以用来分析。

## 二、启动过程源码剖析

### 2.1 目的

1、用源码分析的方式走一下 Netty（服务器）的启动过程，更好的理解 Netty 的整体设计和运行机制。

2、源码需要剖析到 Netty 调用 doBind 方法，追踪到 NioServerSocketChannel 的 doBind 方法

3、要 Debug 程序到 NioEventLoop 类的run代码，无限循环，在服务器端运行

### 2.2 启动类分析

```java
public final class EchoServer {
    static final boolean SSL = System.getProperty("ssl") != null;
    static final int PORT = Integer.parseInt(System.getProperty("port", "8007"));
    public static void main(String[] args) throws Exception {
        // Configure SSL.
        final SslContext sslCtx;
        if (SSL) {
            SelfSignedCertificate ssc = new SelfSignedCertificate();
            sslCtx = SslContextBuilder.forServer(ssc.certificate(), ssc.privateKey()).build();
        } else {
            sslCtx = null;
        }
        // Configure the server.
        EventLoopGroup bossGroup = new NioEventLoopGroup(1);
        EventLoopGroup workerGroup = new NioEventLoopGroup();
        try {
            ServerBootstrap b = new ServerBootstrap();
            b.group(bossGroup, workerGroup)
             .channel(NioServerSocketChannel.class)
             .option(ChannelOption.SO_BACKLOG, 100)
             .handler(new LoggingHandler(LogLevel.INFO))
             .childHandler(new ChannelInitializer<SocketChannel>() {
                 @Override
                 public void initChannel(SocketChannel ch) throws Exception {
                     ChannelPipeline p = ch.pipeline();
                     if (sslCtx != null) {
                         p.addLast(sslCtx.newHandler(ch.alloc()));
                     }
                     //p.addLast(new LoggingHandler(LogLevel.INFO));
                     p.addLast(new EchoServerHandler());
                 }
             });
            // Start the server.
            ChannelFuture f = b.bind(PORT).sync();
            // Wait until the server socket is closed.
            f.channel().closeFuture().sync();
        } finally {
            // Shut down all event loops to terminate all threads.
            bossGroup.shutdownGracefully();
            workerGroup.shutdownGracefully();
        }
    }
}
```

1、在启动类 main 方法中，首先创建了关于 SSL 的配置类。

2、在启动类 main 方法中，创建了两个 EventLoopGroup 对象：

EventLoopGroup bossGroup = new NioEventLoopGroup(1);

EventLoopGroup workerGroup = new NioEventLoopGroup();

**1、** 这两个对象是整个Netty的核心对象，可以说，整个Netty的运作都依赖于它们bossGroup用于接收Tcp请求，它会将请求交给workerGroup，workerGroup会获取到真正的连接，然后和连接进行通信，比如读写编码解码等等；

**2、** EventLoopGroup是事件循环组（线程组）含有多个EventLoop，可以注册channel，用于在事件循环中去进行选择（和选择器相关）；

**3、** newNioEventLoopGroup(1)：这个1表示bossGroup事件组有1个线程，这个值可以指定，如果newNioEventLoopGroup()会含有默认个线程cpu核数*2，即可以充分的利用多核的优势；

```java
DEFAULT_EVENT_LOOP_THREADS = Math.max(1, SystemPropertyUtil.getInt(
               "io.netty.eventLoopThreads", NettyRuntime.availableProcessors() * 2));
```

**1、** 创建EventExecutor数组，children=newEventExecutor[nThreads];每个元素的类型就是NIOEventLoop，NIOEventLoop实现了EventLoop接口和Executor接口；

**2、** 在启动类main方法中，try块中创建了一个ServerBootstrap对象，它是一个引导类，用于启动服务器和引导整个程序的初始化它和ServerChannel关联，而ServerChannel继承了Channel，所以它提供了一些方法供我们使用，比如：remoteAddress等随后，变量b(ServerBootstrap)调用了group方法，将两个group放入到自己的字段中，用于后期引导使用；

**3、** 然后添加了一个channel，其中参数是一个Class对象，引导类将通过这个**Class对象反射创建ChannelFactory**然后添加了一些TCP的参数【说明：Channel的创建在bind方法，Debug下可以找到：channel=channelFactory.newChannel();】；

**4、** 添加一个服务器专属的日志处理器；

**5、** 添加一个SocketChannel（不是ServerSocketChannel）的handler；

**6、** 绑定端口并阻塞至连接成功；

**7、** 最后main线程阻塞等待关闭；

**8、** finally块中的代码将在服务器关闭时优雅关闭所有资源；

### 2.3 处理器源码

```java
@Sharable
public class EchoServerHandler extends ChannelInboundHandlerAdapter {
    @Override
    public void channelRead(ChannelHandlerContext ctx, Object msg) {
        ctx.write(msg);
    }
    @Override
    public void channelReadComplete(ChannelHandlerContext ctx) {
        ctx.flush();
    }
    @Override
    public void exceptionCaught(ChannelHandlerContext ctx, Throwable cause) {
        // Close the connection when an exception is raised.
        cause.printStackTrace();
        ctx.close();
    }
}
```

1、这是一个普通的处理器类，用于处理器客户端发送来的消息。

### 2.3 EventLoopGroup分析

1、构造器方法，依次调用（CTRL+D）

```java
public NioEventLoopGroup() {
	this(0);
}
```

```java
public NioEventLoopGroup(int nThreads) {
	this(nThreads, (Executor) null);
}
```

```java
public NioEventLoopGroup(int nThreads, Executor executor) {
	this(nThreads, executor, SelectorProvider.provider());
}
```

```java
public NioEventLoopGroup(int nThreads, Executor executor, final SelectorProvider selectorProvider) {
	this(nThreads, executor, selectorProvider, DefaultSelectStrategyFactory.INSTANCE);
}
```

```java
public NioEventLoopGroup(int nThreads, Executor executor, final SelectorProvider selectorProvider,
                             final SelectStrategyFactory selectStrategyFactory) {
	super(nThreads, executor, selectorProvider, selectStrategyFactory, RejectedExecutionHandlers.reject());
}
```

```java
protected MultithreadEventLoopGroup(int nThreads, Executor executor, Object... args) {
	super(nThreads == 0 ? DEFAULT_EVENT_LOOP_THREADS : nThreads, executor, args);
}
```

2、追踪到源码 抽象类 MultithreadEventExecutorGroup 的构造方法 MultithreadEventExecutorGroup 才是 NioEventLoopGroup 真正的构造方法，这里可以看成是一个模板方法，使用了设计模式的模板模式。

3、MultithreadEventExecutorGroup

```java
/**
* @param nThreads         使用的线程数，默认为 core*2 
* @param executor          执行器，如果传入null，则采用Netty默认的线程工厂和默认的执行器 ThreadPerTaskExecutor
* @param chooserFactory   单例 new DefaultEventExecutorChooserFactory()
* @param args              在创建执行器的时候传入固定参数
*/
protected MultithreadEventExecutorGroup(int nThreads, Executor executor,
                                            EventExecutorChooserFactory chooserFactory, Object... args) {
        if (nThreads <= 0) {
            throw new IllegalArgumentException(String.format("nThreads: %d (expected: > 0)", nThreads));
        }
        if (executor == null) { // 如果传入的执行器是空，则采用默认的线程工厂和默认的执行器
            executor = new ThreadPerTaskExecutor(newDefaultThreadFactory());
        }
        children = new EventExecutor[nThreads]; // 创建指定线程数的执行器数组
        for (int i = 0; i < nThreads; i ++) { // 初始化线程数组
            boolean success = false;
            try {
            	// 创建 NioEventLoop
                children[i] = newChild(executor, args);
                success = true;
            } catch (Exception e) {
                // TODO: Think about if this is a good exception type
                throw new IllegalStateException("failed to create a child event loop", e);
            } finally {
            	// 如果创建失败，优雅关闭
                if (!success) {
                    for (int j = 0; j < i; j ++) {
                        children[j].shutdownGracefully();
                    }
                    for (int j = 0; j < i; j ++) {
                        EventExecutor e = children[j];
                        try {
                            while (!e.isTerminated()) {
                                e.awaitTermination(Integer.MAX_VALUE, TimeUnit.SECONDS);
                            }
                        } catch (InterruptedException interrupted) {
                            // Let the caller handle the interruption.
                            Thread.currentThread().interrupt();
                            break;
                        }
                    }
                }
            }
        }
        chooser = chooserFactory.newChooser(children);
        final FutureListener<Object> terminationListener = new FutureListener<Object>() {
            @Override
            public void operationComplete(Future<Object> future) throws Exception {
                if (terminatedChildren.incrementAndGet() == children.length) {
                    terminationFuture.setSuccess(null);
                }
            }
        };
		// 为每一个单例线程池添加一个关闭监听器
        for (EventExecutor e: children) {
            e.terminationFuture().addListener(terminationListener);
        }
        Set<EventExecutor> childrenSet = new LinkedHashSet<EventExecutor>(children.length);
        // 将所有的单例线程池添加到一个 HashSet 中
        Collections.addAll(childrenSet, children);
        readonlyChildren = Collections.unmodifiableSet(childrenSet);
    }
```

1、如果 executor 是 null，创建一个默认的 ThreadPerTaskExecutor，使用 Netty 默认的线程工厂

2、根据传入的线程数（CPU*2），创建一个线程池（单例线程池）数组

3、循环填充数组中的元素，如果异常，则关闭所有的单例线程池

4、根据线程选择工厂创建一个 线程选择器

5、为每一个单例线程池添加一个关闭监听器

6、将所有的单例线程池添加到一个 HashSet 中

### 2.4 ServerBootstrap分析

1、ServerBootstrap 是个空构造，但是有默认的成员变量

```java
private final Map<ChannelOption<?>, Object> childOptions = new LinkedHashMap<ChannelOption<?>, Object>();
private final Map<AttributeKey<?>, Object> childAttrs = new LinkedHashMap<AttributeKey<?>, Object>();
private final ServerBootstrapConfig config = new ServerBootstrapConfig(this);
private volatile EventLoopGroup childGroup;
private volatile ChannelHandler childHandler;
```

2、基本使用

```java
ServerBootstrap b = new ServerBootstrap();
b.group(bossGroup, workerGroup)
 .channel(NioServerSocketChannel.class)
 .option(ChannelOption.SO_BACKLOG, 100)
 .handler(new LoggingHandler(LogLevel.INFO))
 .childHandler(new ChannelInitializer<SocketChannel>() {
     @Override
     public void initChannel(SocketChannel ch) throws Exception {
         ChannelPipeline p = ch.pipeline();
         if (sslCtx != null) {
             p.addLast(sslCtx.newHandler(ch.alloc()));
         }
         //p.addLast(new LoggingHandler(LogLevel.INFO));
         p.addLast(new EchoServerHandler());
     }
 });
```

1、链式调用：group 方法，将 bossGroup 和 workerGroup 传入，bossGroup 赋值给 parentGroup 属性，workerGroup 赋值给 childGroup 属性

2、channel 方法传入 NioServerSocketChannel.class 对象。会根据这个 class 创建 channel 对象

3、option 方法传入 TCP 参数，放在一个 LinkedHashMap 中

4、handler 方法传入一个 handler ，这个 handler 只属于 ServerSocketChannel，而不是 SocketChannel

5、childHandler 方法传入一个 handler ，这个 handler 将会在每个客户端连接的时候调用。供 SocketChannel 使用。
