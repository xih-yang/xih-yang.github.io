# 12、Netty 基础 之 Netty入门
- 来源：https://ddkk.com/zhuanlan/server/netty/4/12.html
- 分类：服务器框架
- 分组：教程目录
## 一、TCP服务案例

**1、** netty服务器在6668端口监听，客户端能发送消息给服务器“hello，服务器！”；

**2、** 服务器可以回复消息给客户端“hello，客户端！”；

**3、** 目的：对netty线程模型有一个初步认识，便于理解netty模型理论；

**4、** 代码；

## 二、编写服务端程序

NettyServer.java

```java
package com.ddkk.netty.simple;
import io.netty.bootstrap.ServerBootstrap;
import io.netty.channel.ChannelFuture;
import io.netty.channel.ChannelInitializer;
import io.netty.channel.ChannelOption;
import io.netty.channel.ChannelPipeline;
import io.netty.channel.EventLoopGroup;
import io.netty.channel.nio.NioEventLoopGroup;
import io.netty.channel.socket.SocketChannel;
import io.netty.channel.socket.nio.NioServerSocketChannel;
public class NettyServer {
	public static void main(String[] args) throws Exception {
		//创建BossGroup和WorkerGroup
		//说明
		//1. 创建两个线程组bossGroup和workerGroup
		//2. bossGroup它只是处理连接请求，真正的与客户端业务处理会交给workerGroup去完成
		//3. 两个都是无限循环
		EventLoopGroup bossGroup = new NioEventLoopGroup();
		EventLoopGroup workerGroup = new NioEventLoopGroup();
		try {
			//创建服务器端的启动对象，配置启动参数
			ServerBootstrap bootstrap = new ServerBootstrap();
			//使用链式编程来进行设置
			bootstrap.group(bossGroup, workerGroup) //设置两个线程组
				.channel(NioServerSocketChannel.class) //使用NioServerSocketChannel作为服务器的通道实现
				.childHandler(new ChannelInitializer<SocketChannel>() { //创建一个通道初始化对象
					//给pipeline设置处理器
					@Override
					protected void initChannel(SocketChannel ch) throws Exception {
						ChannelPipeline pipeline = ch.pipeline();
						pipeline.addLast(new NettyChannelHandler()); //向管道的最后增加一个处理器
					};
				}); //给我们的workerGroup的EventLoop对应的管道设置处理器
			//bossGroup参数
			bootstrap.option(ChannelOption.SO_BACKLOG, 1024); //设置线程队列等待连接的个数
			//workerGroup参数
			bootstrap.childOption(ChannelOption.SO_KEEPALIVE, true); //设置保持活动连接状态
			System.out.println("...服务器 is ready...");
			//绑定一个端口并且同步，生成了一个ChannelFuture对象
			//启动服务器并绑定端口
			ChannelFuture cf = bootstrap.bind(6668).sync();
			//对关闭通道进行监听
			cf.channel().closeFuture().sync();
		} catch (Exception e) {
			e.printStackTrace();
		} finally {
			System.out.println("Shutdown Netty Server...");
			//优雅的关闭
			workerGroup.shutdownGracefully();
			bossGroup.shutdownGracefully();
			System.out.println("Shutdown Netty Server Success!");
		}
	}
}
```

NettyChannelHandler.java

```java
package com.ddkk.netty.simple;
import io.netty.buffer.ByteBuf;
import io.netty.buffer.Unpooled;
import io.netty.channel.ChannelHandlerContext;
import io.netty.channel.ChannelInboundHandlerAdapter;
import io.netty.util.CharsetUtil;
/**
 * 说明
 * 1. 我们自定义一个Handler，需要继承netty规定好的某个HandlerAdapter（规范）
 * 2. 这时我们自定义一个Handler，才能称之为Handler
 * 
 */
public class NettyChannelHandler extends ChannelInboundHandlerAdapter {
	//读取数据的事件（这里我们可以读取客户端发送的消息）
	/*
	 * 1. ChannelHandlerContext ctx：上下文对象，含有管道pipeline，通道channel，地址
	 * 2. Object msg：就是客户端发送的数据，默认是Object
	 * 3. 通道读写数据，管道处理数据
	 */
	@Override
	public void channelRead(ChannelHandlerContext ctx, Object msg) throws Exception {
		System.out.println("server ctx = " + ctx);
		//将msg转成一个ByteBuf
		//这个ByteBuf是netty提供的，不是nio的ByteBuffer
		ByteBuf buf = (ByteBuf) msg;
		System.out.println("客户端发送消息是：" + buf.toString(CharsetUtil.UTF_8));
		System.out.println("客户端地址：" + ctx.channel().remoteAddress());
		//channelReadComplete方法的返回，写在这里也可以，因为能获取ctx.channel()
	}
	//数据读取完毕
	//这个方法会在channelRead读完后触发
	@Override
	public void channelReadComplete(ChannelHandlerContext ctx) throws Exception {
		//把数据写到缓冲区，并且刷新缓冲区，是write + flush
		//一般来讲，我们对这个发送的数据进行编码
		ctx.channel().writeAndFlush(Unpooled.copiedBuffer("hello，客户端~", CharsetUtil.UTF_8));
	}
	//处理异常，一般是需要关闭通道
	@Override
	public void exceptionCaught(ChannelHandlerContext ctx, Throwable cause) throws Exception {
		ctx.channel().close();
	}
}
```

## 三、编写客户端程序

NettyClient.java

```java
package com.ddkk.netty.simple;
import io.netty.bootstrap.Bootstrap;
import io.netty.channel.ChannelFuture;
import io.netty.channel.ChannelInitializer;
import io.netty.channel.ChannelPipeline;
import io.netty.channel.EventLoopGroup;
import io.netty.channel.nio.NioEventLoopGroup;
import io.netty.channel.socket.SocketChannel;
import io.netty.channel.socket.nio.NioSocketChannel;
public class NettyClient {
	public static void main(String[] args) throws Exception {
		//客户端需要一个事件循环组
		EventLoopGroup group = new NioEventLoopGroup();
		try {
			//创建客户端的启动对象
			//注意客户端使用的是Bootstrap
			Bootstrap bootstrap = new Bootstrap();
			//设置相关参数
			bootstrap.group(group) //设置线程组
				.channel(NioSocketChannel.class) //设置客户端通道的实现类
				.handler(new ChannelInitializer<SocketChannel>() {
					@Override
					protected void initChannel(SocketChannel ch) throws Exception {
						ChannelPipeline pipeline = ch.pipeline();
						pipeline.addLast(new NettyClientHandler()); //加入自己的处理器
					}
				});
			System.out.println("...客户端 is ready...");
			//启动客户端去连接服务器端
			//ChannelFuture涉及到netty的异步模型
			ChannelFuture cf = bootstrap.connect("127.0.0.1", 6668).sync();
			//对关闭通道进行监听
			cf.channel().closeFuture().sync();
		} catch (Exception e) {
			e.printStackTrace();
		} finally {
			//优雅的关闭
			group.shutdownGracefully();
		}
	}
}
```

NettyClientHandler.java

```java
package com.ddkk.netty.simple;
import io.netty.buffer.ByteBuf;
import io.netty.buffer.Unpooled;
import io.netty.channel.ChannelHandlerContext;
import io.netty.channel.ChannelInboundHandlerAdapter;
import io.netty.util.CharsetUtil;
public class NettyClientHandler extends ChannelInboundHandlerAdapter {
	//当通道就绪时，就会触发该方法
	@Override
	public void channelActive(ChannelHandlerContext ctx) throws Exception {
		System.out.println("client ctx = " + ctx);
		ctx.writeAndFlush(Unpooled.copiedBuffer("hello server", CharsetUtil.UTF_8));
	}
	//当通道有读取事件时会触发
	@Override
	public void channelRead(ChannelHandlerContext ctx, Object msg) throws Exception {
		ByteBuf buf = (ByteBuf) msg;
		System.out.println("服务器回复的消息：" + buf.toString(CharsetUtil.UTF_8));
		System.out.println("服务器的地址：" + ctx.channel().remoteAddress());
	}
	@Override
	public void exceptionCaught(ChannelHandlerContext ctx, Throwable cause) throws Exception {
		cause.printStackTrace();
		ctx.close();
	}
}
```

## 四、测试日志

**1、** 服务端；

```java
08:54:06.811 [main] DEBUG io.netty.util.internal.logging.InternalLoggerFactory - Using SLF4J as the default logging framework
08:54:06.822 [main] DEBUG io.netty.channel.MultithreadEventLoopGroup - -Dio.netty.eventLoopThreads: 16
08:54:06.850 [main] DEBUG io.netty.util.internal.InternalThreadLocalMap - -Dio.netty.threadLocalMap.stringBuilder.initialSize: 1024
08:54:06.850 [main] DEBUG io.netty.util.internal.InternalThreadLocalMap - -Dio.netty.threadLocalMap.stringBuilder.maxSize: 4096
08:54:06.863 [main] DEBUG io.netty.channel.nio.NioEventLoop - -Dio.netty.noKeySetOptimization: false
08:54:06.863 [main] DEBUG io.netty.channel.nio.NioEventLoop - -Dio.netty.selectorAutoRebuildThreshold: 512
08:54:06.887 [main] DEBUG io.netty.util.internal.PlatformDependent - Platform: Windows
08:54:06.890 [main] DEBUG io.netty.util.internal.PlatformDependent0 - -Dio.netty.noUnsafe: false
08:54:06.891 [main] DEBUG io.netty.util.internal.PlatformDependent0 - Java version: 8
08:54:06.894 [main] DEBUG io.netty.util.internal.PlatformDependent0 - sun.misc.Unsafe.theUnsafe: available
08:54:06.897 [main] DEBUG io.netty.util.internal.PlatformDependent0 - sun.misc.Unsafe.copyMemory: available
08:54:06.898 [main] DEBUG io.netty.util.internal.PlatformDependent0 - java.nio.Buffer.address: available
08:54:06.899 [main] DEBUG io.netty.util.internal.PlatformDependent0 - direct buffer constructor: available
08:54:06.900 [main] DEBUG io.netty.util.internal.PlatformDependent0 - java.nio.Bits.unaligned: available, true
08:54:06.900 [main] DEBUG io.netty.util.internal.PlatformDependent0 - jdk.internal.misc.Unsafe.allocateUninitializedArray(int): unavailable prior to Java9
08:54:06.900 [main] DEBUG io.netty.util.internal.PlatformDependent0 - java.nio.DirectByteBuffer.<init>(long, int): available
08:54:06.900 [main] DEBUG io.netty.util.internal.PlatformDependent - sun.misc.Unsafe: available
08:54:06.901 [main] DEBUG io.netty.util.internal.PlatformDependent - -Dio.netty.tmpdir: C:\Users\sjcui\AppData\Local\Temp (java.io.tmpdir)
08:54:06.901 [main] DEBUG io.netty.util.internal.PlatformDependent - -Dio.netty.bitMode: 64 (sun.arch.data.model)
08:54:06.904 [main] DEBUG io.netty.util.internal.PlatformDependent - -Dio.netty.maxDirectMemory: 3767533568 bytes
08:54:06.904 [main] DEBUG io.netty.util.internal.PlatformDependent - -Dio.netty.uninitializedArrayAllocationThreshold: -1
08:54:06.905 [main] DEBUG io.netty.util.internal.CleanerJava6 - java.nio.ByteBuffer.cleaner(): available
08:54:06.905 [main] DEBUG io.netty.util.internal.PlatformDependent - -Dio.netty.noPreferDirect: false
08:54:06.917 [main] DEBUG io.netty.util.internal.PlatformDependent - org.jctools-core.MpscChunkedArrayQueue: available
...服务器 is ready...
08:54:07.368 [main] DEBUG io.netty.channel.DefaultChannelId - -Dio.netty.processId: 4968 (auto-detected)
08:54:07.370 [main] DEBUG io.netty.util.NetUtil - -Djava.net.preferIPv4Stack: false
08:54:07.370 [main] DEBUG io.netty.util.NetUtil - -Djava.net.preferIPv6Addresses: false
08:54:07.728 [main] DEBUG io.netty.util.NetUtil - Loopback interface: lo (Software Loopback Interface 1, 127.0.0.1)
08:54:07.738 [main] DEBUG io.netty.util.NetUtil - Failed to get SOMAXCONN from sysctl and file \proc\sys\net\core\somaxconn. Default: 200
08:54:08.122 [main] DEBUG io.netty.channel.DefaultChannelId - -Dio.netty.machineId: 00:50:56:ff:fe:c0:00:01 (auto-detected)
08:54:08.139 [main] DEBUG io.netty.util.ResourceLeakDetector - -Dio.netty.leakDetection.level: simple
08:54:08.139 [main] DEBUG io.netty.util.ResourceLeakDetector - -Dio.netty.leakDetection.targetRecords: 4
08:54:08.168 [main] DEBUG io.netty.buffer.PooledByteBufAllocator - -Dio.netty.allocator.numHeapArenas: 16
08:54:08.168 [main] DEBUG io.netty.buffer.PooledByteBufAllocator - -Dio.netty.allocator.numDirectArenas: 16
08:54:08.168 [main] DEBUG io.netty.buffer.PooledByteBufAllocator - -Dio.netty.allocator.pageSize: 8192
08:54:08.168 [main] DEBUG io.netty.buffer.PooledByteBufAllocator - -Dio.netty.allocator.maxOrder: 11
08:54:08.168 [main] DEBUG io.netty.buffer.PooledByteBufAllocator - -Dio.netty.allocator.chunkSize: 16777216
08:54:08.168 [main] DEBUG io.netty.buffer.PooledByteBufAllocator - -Dio.netty.allocator.tinyCacheSize: 512
08:54:08.168 [main] DEBUG io.netty.buffer.PooledByteBufAllocator - -Dio.netty.allocator.smallCacheSize: 256
08:54:08.168 [main] DEBUG io.netty.buffer.PooledByteBufAllocator - -Dio.netty.allocator.normalCacheSize: 64
08:54:08.168 [main] DEBUG io.netty.buffer.PooledByteBufAllocator - -Dio.netty.allocator.maxCachedBufferCapacity: 32768
08:54:08.168 [main] DEBUG io.netty.buffer.PooledByteBufAllocator - -Dio.netty.allocator.cacheTrimInterval: 8192
08:54:08.169 [main] DEBUG io.netty.buffer.PooledByteBufAllocator - -Dio.netty.allocator.cacheTrimIntervalMillis: 0
08:54:08.169 [main] DEBUG io.netty.buffer.PooledByteBufAllocator - -Dio.netty.allocator.useCacheForAllThreads: true
08:54:08.169 [main] DEBUG io.netty.buffer.PooledByteBufAllocator - -Dio.netty.allocator.maxCachedByteBuffersPerChunk: 1023
08:54:08.179 [main] DEBUG io.netty.buffer.ByteBufUtil - -Dio.netty.allocator.type: pooled
08:54:08.180 [main] DEBUG io.netty.buffer.ByteBufUtil - -Dio.netty.threadLocalDirectBufferSize: 0
08:54:08.180 [main] DEBUG io.netty.buffer.ByteBufUtil - -Dio.netty.maxThreadLocalCharBufferSize: 16384
08:54:28.935 [nioEventLoopGroup-3-1] DEBUG io.netty.util.Recycler - -Dio.netty.recycler.maxCapacityPerThread: 4096
08:54:28.935 [nioEventLoopGroup-3-1] DEBUG io.netty.util.Recycler - -Dio.netty.recycler.maxSharedCapacityFactor: 2
08:54:28.935 [nioEventLoopGroup-3-1] DEBUG io.netty.util.Recycler - -Dio.netty.recycler.linkCapacity: 16
08:54:28.935 [nioEventLoopGroup-3-1] DEBUG io.netty.util.Recycler - -Dio.netty.recycler.ratio: 8
08:54:28.943 [nioEventLoopGroup-3-1] DEBUG io.netty.buffer.AbstractByteBuf - -Dio.netty.buffer.checkAccessible: true
08:54:28.943 [nioEventLoopGroup-3-1] DEBUG io.netty.buffer.AbstractByteBuf - -Dio.netty.buffer.checkBounds: true
08:54:28.944 [nioEventLoopGroup-3-1] DEBUG io.netty.util.ResourceLeakDetectorFactory - Loaded default ResourceLeakDetector: io.netty.util.ResourceLeakDetector@48bcbc1f
server ctx = ChannelHandlerContext(NettyChannelHandler#0, [id: 0xf6d6d674, L:/127.0.0.1:6668 - R:/127.0.0.1:62266])
客户端发送消息是：hello server
客户端地址：/127.0.0.1:62266
```

**2、** 客户端；

```java
08:54:27.650 [main] DEBUG io.netty.util.internal.logging.InternalLoggerFactory - Using SLF4J as the default logging framework
08:54:27.657 [main] DEBUG io.netty.channel.MultithreadEventLoopGroup - -Dio.netty.eventLoopThreads: 16
08:54:27.680 [main] DEBUG io.netty.util.internal.InternalThreadLocalMap - -Dio.netty.threadLocalMap.stringBuilder.initialSize: 1024
08:54:27.680 [main] DEBUG io.netty.util.internal.InternalThreadLocalMap - -Dio.netty.threadLocalMap.stringBuilder.maxSize: 4096
08:54:27.689 [main] DEBUG io.netty.channel.nio.NioEventLoop - -Dio.netty.noKeySetOptimization: false
08:54:27.689 [main] DEBUG io.netty.channel.nio.NioEventLoop - -Dio.netty.selectorAutoRebuildThreshold: 512
08:54:27.710 [main] DEBUG io.netty.util.internal.PlatformDependent - Platform: Windows
08:54:27.713 [main] DEBUG io.netty.util.internal.PlatformDependent0 - -Dio.netty.noUnsafe: false
08:54:27.714 [main] DEBUG io.netty.util.internal.PlatformDependent0 - Java version: 8
08:54:27.715 [main] DEBUG io.netty.util.internal.PlatformDependent0 - sun.misc.Unsafe.theUnsafe: available
08:54:27.716 [main] DEBUG io.netty.util.internal.PlatformDependent0 - sun.misc.Unsafe.copyMemory: available
08:54:27.717 [main] DEBUG io.netty.util.internal.PlatformDependent0 - java.nio.Buffer.address: available
08:54:27.718 [main] DEBUG io.netty.util.internal.PlatformDependent0 - direct buffer constructor: available
08:54:27.719 [main] DEBUG io.netty.util.internal.PlatformDependent0 - java.nio.Bits.unaligned: available, true
08:54:27.719 [main] DEBUG io.netty.util.internal.PlatformDependent0 - jdk.internal.misc.Unsafe.allocateUninitializedArray(int): unavailable prior to Java9
08:54:27.719 [main] DEBUG io.netty.util.internal.PlatformDependent0 - java.nio.DirectByteBuffer.<init>(long, int): available
08:54:27.719 [main] DEBUG io.netty.util.internal.PlatformDependent - sun.misc.Unsafe: available
08:54:27.720 [main] DEBUG io.netty.util.internal.PlatformDependent - -Dio.netty.tmpdir: C:\Users\sjcui\AppData\Local\Temp (java.io.tmpdir)
08:54:27.720 [main] DEBUG io.netty.util.internal.PlatformDependent - -Dio.netty.bitMode: 64 (sun.arch.data.model)
08:54:27.723 [main] DEBUG io.netty.util.internal.PlatformDependent - -Dio.netty.maxDirectMemory: 3767533568 bytes
08:54:27.724 [main] DEBUG io.netty.util.internal.PlatformDependent - -Dio.netty.uninitializedArrayAllocationThreshold: -1
08:54:27.725 [main] DEBUG io.netty.util.internal.CleanerJava6 - java.nio.ByteBuffer.cleaner(): available
08:54:27.726 [main] DEBUG io.netty.util.internal.PlatformDependent - -Dio.netty.noPreferDirect: false
08:54:27.736 [main] DEBUG io.netty.util.internal.PlatformDependent - org.jctools-core.MpscChunkedArrayQueue: available
...客户端 is ready...
08:54:28.131 [main] DEBUG io.netty.channel.DefaultChannelId - -Dio.netty.processId: 14728 (auto-detected)
08:54:28.133 [main] DEBUG io.netty.util.NetUtil - -Djava.net.preferIPv4Stack: false
08:54:28.133 [main] DEBUG io.netty.util.NetUtil - -Djava.net.preferIPv6Addresses: false
08:54:28.456 [main] DEBUG io.netty.util.NetUtil - Loopback interface: lo (Software Loopback Interface 1, 127.0.0.1)
08:54:28.456 [main] DEBUG io.netty.util.NetUtil - Failed to get SOMAXCONN from sysctl and file \proc\sys\net\core\somaxconn. Default: 200
08:54:28.815 [main] DEBUG io.netty.channel.DefaultChannelId - -Dio.netty.machineId: 00:50:56:ff:fe:c0:00:01 (auto-detected)
08:54:28.826 [main] DEBUG io.netty.util.ResourceLeakDetector - -Dio.netty.leakDetection.level: simple
08:54:28.827 [main] DEBUG io.netty.util.ResourceLeakDetector - -Dio.netty.leakDetection.targetRecords: 4
08:54:28.851 [main] DEBUG io.netty.buffer.PooledByteBufAllocator - -Dio.netty.allocator.numHeapArenas: 16
08:54:28.851 [main] DEBUG io.netty.buffer.PooledByteBufAllocator - -Dio.netty.allocator.numDirectArenas: 16
08:54:28.851 [main] DEBUG io.netty.buffer.PooledByteBufAllocator - -Dio.netty.allocator.pageSize: 8192
08:54:28.851 [main] DEBUG io.netty.buffer.PooledByteBufAllocator - -Dio.netty.allocator.maxOrder: 11
08:54:28.851 [main] DEBUG io.netty.buffer.PooledByteBufAllocator - -Dio.netty.allocator.chunkSize: 16777216
08:54:28.851 [main] DEBUG io.netty.buffer.PooledByteBufAllocator - -Dio.netty.allocator.tinyCacheSize: 512
08:54:28.851 [main] DEBUG io.netty.buffer.PooledByteBufAllocator - -Dio.netty.allocator.smallCacheSize: 256
08:54:28.851 [main] DEBUG io.netty.buffer.PooledByteBufAllocator - -Dio.netty.allocator.normalCacheSize: 64
08:54:28.851 [main] DEBUG io.netty.buffer.PooledByteBufAllocator - -Dio.netty.allocator.maxCachedBufferCapacity: 32768
08:54:28.852 [main] DEBUG io.netty.buffer.PooledByteBufAllocator - -Dio.netty.allocator.cacheTrimInterval: 8192
08:54:28.852 [main] DEBUG io.netty.buffer.PooledByteBufAllocator - -Dio.netty.allocator.cacheTrimIntervalMillis: 0
08:54:28.852 [main] DEBUG io.netty.buffer.PooledByteBufAllocator - -Dio.netty.allocator.useCacheForAllThreads: true
08:54:28.852 [main] DEBUG io.netty.buffer.PooledByteBufAllocator - -Dio.netty.allocator.maxCachedByteBuffersPerChunk: 1023
08:54:28.860 [main] DEBUG io.netty.buffer.ByteBufUtil - -Dio.netty.allocator.type: pooled
08:54:28.860 [main] DEBUG io.netty.buffer.ByteBufUtil - -Dio.netty.threadLocalDirectBufferSize: 0
08:54:28.860 [main] DEBUG io.netty.buffer.ByteBufUtil - -Dio.netty.maxThreadLocalCharBufferSize: 16384
client ctx = ChannelHandlerContext(NettyClientHandler#0, [id: 0xbcbe0c51, L:/127.0.0.1:62266 - R:/127.0.0.1:6668])
08:54:28.917 [nioEventLoopGroup-2-1] DEBUG io.netty.buffer.AbstractByteBuf - -Dio.netty.buffer.checkAccessible: true
08:54:28.917 [nioEventLoopGroup-2-1] DEBUG io.netty.buffer.AbstractByteBuf - -Dio.netty.buffer.checkBounds: true
08:54:28.918 [nioEventLoopGroup-2-1] DEBUG io.netty.util.ResourceLeakDetectorFactory - Loaded default ResourceLeakDetector: io.netty.util.ResourceLeakDetector@6a5e58f3
08:54:28.924 [nioEventLoopGroup-2-1] DEBUG io.netty.util.Recycler - -Dio.netty.recycler.maxCapacityPerThread: 4096
08:54:28.924 [nioEventLoopGroup-2-1] DEBUG io.netty.util.Recycler - -Dio.netty.recycler.maxSharedCapacityFactor: 2
08:54:28.924 [nioEventLoopGroup-2-1] DEBUG io.netty.util.Recycler - -Dio.netty.recycler.linkCapacity: 16
08:54:28.924 [nioEventLoopGroup-2-1] DEBUG io.netty.util.Recycler - -Dio.netty.recycler.ratio: 8
服务器回复的消息：hello，客户端~
服务器的地址：/127.0.0.1:6668
```

## 五、对netty程序进行分析

**1、** bossGroup和workerGroup含有的子线程（NioEventLoop）的个数，默认是CPU核数*2；

```java
    static {
        DEFAULT_EVENT_LOOP_THREADS = Math.max(1, SystemPropertyUtil.getInt(
                "io.netty.eventLoopThreads", NettyRuntime.availableProcessors() * 2));
        if (logger.isDebugEnabled()) {
            logger.debug("-Dio.netty.eventLoopThreads: {}", DEFAULT_EVENT_LOOP_THREADS);
        }
    }
```

**2、** bossGroup设置1个，workerGroup设置8个在默认的情况下，workerGroup采用轮询的方式调用；

**3、** 每个EventLoopGroup有selector、selectedKeys、executor、taskQueue；

**4、** ChannelPipeline底层本质是一个双向链表，出站入站问题；
