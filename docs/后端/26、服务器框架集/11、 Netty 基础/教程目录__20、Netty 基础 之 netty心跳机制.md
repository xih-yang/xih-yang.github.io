# 20、Netty 基础 之 netty心跳机制
- 来源：https://ddkk.com/zhuanlan/server/netty/4/20.html
- 分类：服务器框架
- 分组：教程目录
## 一、实例要求

**1、** 编写一个netty心跳检测机制案例，当服务器超过3秒没有读时，就提示读空闲；

**2、** 当服务器超过5秒没有写操作时，就提示写空闲；

**3、** 当服务器超过7秒没有读或者写操作时，就提示读写空闲；

## 二、服务端

**1、** MyServer.java；

```java
package netty.heartbeat;
import java.util.concurrent.TimeUnit;
import io.netty.bootstrap.ServerBootstrap;
import io.netty.channel.ChannelFuture;
import io.netty.channel.ChannelInitializer;
import io.netty.channel.ChannelPipeline;
import io.netty.channel.EventLoopGroup;
import io.netty.channel.nio.NioEventLoopGroup;
import io.netty.channel.socket.SocketChannel;
import io.netty.channel.socket.nio.NioServerSocketChannel;
import io.netty.handler.logging.LogLevel;
import io.netty.handler.logging.LoggingHandler;
import io.netty.handler.timeout.IdleStateHandler;
public class MyServer {
	public static void main(String[] args) {
		//创建两个线程组
		EventLoopGroup bossGroup = new NioEventLoopGroup(1);
		EventLoopGroup workerGroup = new NioEventLoopGroup(); //默认cpu核数*2
		try {
			ServerBootstrap server = new ServerBootstrap();
			server.group(bossGroup, workerGroup)
				.channel(NioServerSocketChannel.class)
				//在boosGroup增加一个日志处理器
				.handler(new LoggingHandler(LogLevel.INFO))
				.childHandler(new ChannelInitializer<SocketChannel>() {
					@Override
					protected void initChannel(SocketChannel ch) throws Exception {
						ChannelPipeline pipeline = ch.pipeline();
						//加入一个netty提供的IdleStateHandler
						/**
						 * 说明
						 * 1. IdleStateHandler是netty提供的处理空闲状态的处理器
						 * 2. public IdleStateHandler(long readerIdleTime, long writerIdleTime, long allIdleTime, TimeUnit unit)
						 * 3. 参数
						 * long readerIdleTime：表示多长时间没有读了，就会发送一个心跳检测包，检测是否还是连接的状态
						 * long writerIdleTime：表示多长时间没有写了，也会发送一个心跳检测包
						 * long allIdleTime：表示多长时间既没有读也没有写了，也会发送一个心跳检测包
						 * 4. 文档说明
						 * Triggers an {@link IdleStateEvent} when a {@link Channel} has not performed read, write, or both operation for a while.
						 * 5. 当IdleStateEvent触发后，就会传递给管道的下一个handler
						 * 6. 通过调用（触发）下一个handler的userEventTriggered，在该方法中去处理IdleStateEvent事件
						 * 
						 */
						pipeline.addLast(new IdleStateHandler(3, 5, 7, TimeUnit.SECONDS));
						//加入一个对空闲检测进一步处理的自定义handler
						pipeline.addLast(new MyServerHandler());
					}
				});
			//启动服务器
			ChannelFuture cf = server.bind(7000).sync();
			cf.channel().closeFuture().sync();
		} catch (Exception e) {
			e.printStackTrace();
		} finally {
			bossGroup.shutdownGracefully();
			workerGroup.shutdownGracefully();
		}
	}
}
```

**2、** MyServerHandler.java；

```java
package netty.heartbeat;
import io.netty.channel.ChannelHandlerContext;
import io.netty.channel.ChannelInboundHandlerAdapter;
import io.netty.handler.timeout.IdleStateEvent;
public class MyServerHandler extends ChannelInboundHandlerAdapter {
	/**
	 * ctx：上下文
	 * evt：事件
	 */
	@Override
	public void userEventTriggered(ChannelHandlerContext ctx, Object evt) throws Exception {
		if (evt instanceof IdleStateEvent) {
			//将evt向下转型 IdleStateEvent
			IdleStateEvent event = (IdleStateEvent) evt;
			String eventType = null;
			switch (event.state()) {
				case READER_IDLE:
					eventType = "读空闲";
					break;
				case WRITER_IDLE:
					eventType = "写空闲";
					break;
				case ALL_IDLE:
					eventType = "读写空闲";
					break;
			}
			System.out.println(ctx.channel().remoteAddress() + "超时事件：" + eventType);
			System.out.println("服务器做相应的处理......");
		}
	}
}
```

## 三、测试

用群聊的客户端连接即可。

```java
15:17:11.383 [main] DEBUG io.netty.util.internal.logging.InternalLoggerFactory - Using SLF4J as the default logging framework
15:17:11.393 [main] DEBUG io.netty.channel.MultithreadEventLoopGroup - -Dio.netty.eventLoopThreads: 16
15:17:11.424 [main] DEBUG io.netty.util.internal.InternalThreadLocalMap - -Dio.netty.threadLocalMap.stringBuilder.initialSize: 1024
15:17:11.425 [main] DEBUG io.netty.util.internal.InternalThreadLocalMap - -Dio.netty.threadLocalMap.stringBuilder.maxSize: 4096
15:17:11.442 [main] DEBUG io.netty.channel.nio.NioEventLoop - -Dio.netty.noKeySetOptimization: false
15:17:11.442 [main] DEBUG io.netty.channel.nio.NioEventLoop - -Dio.netty.selectorAutoRebuildThreshold: 512
15:17:11.472 [main] DEBUG io.netty.util.internal.PlatformDependent - Platform: Windows
15:17:11.476 [main] DEBUG io.netty.util.internal.PlatformDependent0 - -Dio.netty.noUnsafe: false
15:17:11.476 [main] DEBUG io.netty.util.internal.PlatformDependent0 - Java version: 8
15:17:11.479 [main] DEBUG io.netty.util.internal.PlatformDependent0 - sun.misc.Unsafe.theUnsafe: available
15:17:11.480 [main] DEBUG io.netty.util.internal.PlatformDependent0 - sun.misc.Unsafe.copyMemory: available
15:17:11.480 [main] DEBUG io.netty.util.internal.PlatformDependent0 - java.nio.Buffer.address: available
15:17:11.481 [main] DEBUG io.netty.util.internal.PlatformDependent0 - direct buffer constructor: available
15:17:11.483 [main] DEBUG io.netty.util.internal.PlatformDependent0 - java.nio.Bits.unaligned: available, true
15:17:11.483 [main] DEBUG io.netty.util.internal.PlatformDependent0 - jdk.internal.misc.Unsafe.allocateUninitializedArray(int): unavailable prior to Java9
15:17:11.483 [main] DEBUG io.netty.util.internal.PlatformDependent0 - java.nio.DirectByteBuffer.<init>(long, int): available
15:17:11.483 [main] DEBUG io.netty.util.internal.PlatformDependent - sun.misc.Unsafe: available
15:17:11.485 [main] DEBUG io.netty.util.internal.PlatformDependent - -Dio.netty.tmpdir: C:\Users\sjcui\AppData\Local\Temp (java.io.tmpdir)
15:17:11.485 [main] DEBUG io.netty.util.internal.PlatformDependent - -Dio.netty.bitMode: 64 (sun.arch.data.model)
15:17:11.487 [main] DEBUG io.netty.util.internal.PlatformDependent - -Dio.netty.maxDirectMemory: 3767533568 bytes
15:17:11.487 [main] DEBUG io.netty.util.internal.PlatformDependent - -Dio.netty.uninitializedArrayAllocationThreshold: -1
15:17:11.489 [main] DEBUG io.netty.util.internal.CleanerJava6 - java.nio.ByteBuffer.cleaner(): available
15:17:11.490 [main] DEBUG io.netty.util.internal.PlatformDependent - -Dio.netty.noPreferDirect: false
15:17:11.505 [main] DEBUG io.netty.util.internal.PlatformDependent - org.jctools-core.MpscChunkedArrayQueue: available
15:17:12.008 [main] DEBUG io.netty.channel.DefaultChannelId - -Dio.netty.processId: 7028 (auto-detected)
15:17:12.010 [main] DEBUG io.netty.util.NetUtil - -Djava.net.preferIPv4Stack: false
15:17:12.010 [main] DEBUG io.netty.util.NetUtil - -Djava.net.preferIPv6Addresses: false
15:17:12.396 [main] DEBUG io.netty.util.NetUtil - Loopback interface: lo (Software Loopback Interface 1, 127.0.0.1)
15:17:12.397 [main] DEBUG io.netty.util.NetUtil - Failed to get SOMAXCONN from sysctl and file \proc\sys\net\core\somaxconn. Default: 200
15:17:12.780 [main] DEBUG io.netty.channel.DefaultChannelId - -Dio.netty.machineId: 00:50:56:ff:fe:c0:00:01 (auto-detected)
15:17:12.794 [main] DEBUG io.netty.util.ResourceLeakDetector - -Dio.netty.leakDetection.level: simple
15:17:12.794 [main] DEBUG io.netty.util.ResourceLeakDetector - -Dio.netty.leakDetection.targetRecords: 4
15:17:12.826 [main] DEBUG io.netty.buffer.PooledByteBufAllocator - -Dio.netty.allocator.numHeapArenas: 16
15:17:12.826 [main] DEBUG io.netty.buffer.PooledByteBufAllocator - -Dio.netty.allocator.numDirectArenas: 16
15:17:12.826 [main] DEBUG io.netty.buffer.PooledByteBufAllocator - -Dio.netty.allocator.pageSize: 8192
15:17:12.826 [main] DEBUG io.netty.buffer.PooledByteBufAllocator - -Dio.netty.allocator.maxOrder: 11
15:17:12.826 [main] DEBUG io.netty.buffer.PooledByteBufAllocator - -Dio.netty.allocator.chunkSize: 16777216
15:17:12.826 [main] DEBUG io.netty.buffer.PooledByteBufAllocator - -Dio.netty.allocator.tinyCacheSize: 512
15:17:12.826 [main] DEBUG io.netty.buffer.PooledByteBufAllocator - -Dio.netty.allocator.smallCacheSize: 256
15:17:12.826 [main] DEBUG io.netty.buffer.PooledByteBufAllocator - -Dio.netty.allocator.normalCacheSize: 64
15:17:12.826 [main] DEBUG io.netty.buffer.PooledByteBufAllocator - -Dio.netty.allocator.maxCachedBufferCapacity: 32768
15:17:12.827 [main] DEBUG io.netty.buffer.PooledByteBufAllocator - -Dio.netty.allocator.cacheTrimInterval: 8192
15:17:12.827 [main] DEBUG io.netty.buffer.PooledByteBufAllocator - -Dio.netty.allocator.cacheTrimIntervalMillis: 0
15:17:12.827 [main] DEBUG io.netty.buffer.PooledByteBufAllocator - -Dio.netty.allocator.useCacheForAllThreads: true
15:17:12.827 [main] DEBUG io.netty.buffer.PooledByteBufAllocator - -Dio.netty.allocator.maxCachedByteBuffersPerChunk: 1023
15:17:12.839 [main] DEBUG io.netty.buffer.ByteBufUtil - -Dio.netty.allocator.type: pooled
15:17:12.839 [main] DEBUG io.netty.buffer.ByteBufUtil - -Dio.netty.threadLocalDirectBufferSize: 0
15:17:12.839 [main] DEBUG io.netty.buffer.ByteBufUtil - -Dio.netty.maxThreadLocalCharBufferSize: 16384
15:17:12.871 [nioEventLoopGroup-2-1] INFO io.netty.handler.logging.LoggingHandler - [id: 0x2865274b] REGISTERED
15:17:12.875 [nioEventLoopGroup-2-1] INFO io.netty.handler.logging.LoggingHandler - [id: 0x2865274b] BIND: 0.0.0.0/0.0.0.0:7000
15:17:12.879 [nioEventLoopGroup-2-1] INFO io.netty.handler.logging.LoggingHandler - [id: 0x2865274b, L:/0:0:0:0:0:0:0:0:7000] ACTIVE
15:23:48.925 [nioEventLoopGroup-2-1] INFO io.netty.handler.logging.LoggingHandler - [id: 0x2865274b, L:/0:0:0:0:0:0:0:0:7000] READ: [id: 0xbccd3289, L:/127.0.0.1:7000 - R:/127.0.0.1:51818]
15:23:48.927 [nioEventLoopGroup-2-1] INFO io.netty.handler.logging.LoggingHandler - [id: 0x2865274b, L:/0:0:0:0:0:0:0:0:7000] READ COMPLETE
/127.0.0.1:51818超时事件：读空闲
服务器做相应的处理......
/127.0.0.1:51818超时事件：写空闲
服务器做相应的处理......
/127.0.0.1:51818超时事件：读空闲
服务器做相应的处理......
/127.0.0.1:51818超时事件：读写空闲
服务器做相应的处理......
/127.0.0.1:51818超时事件：读空闲
服务器做相应的处理......
/127.0.0.1:51818超时事件：写空闲
服务器做相应的处理......
/127.0.0.1:51818超时事件：读空闲
服务器做相应的处理......
/127.0.0.1:51818超时事件：读写空闲
服务器做相应的处理......
/127.0.0.1:51818超时事件：写空闲
服务器做相应的处理......
/127.0.0.1:51818超时事件：读空闲
服务器做相应的处理......
/127.0.0.1:51818超时事件：读空闲
服务器做相应的处理......
/127.0.0.1:51818超时事件：写空闲
服务器做相应的处理......
/127.0.0.1:51818超时事件：读写空闲
服务器做相应的处理......
/127.0.0.1:51818超时事件：读空闲
服务器做相应的处理......
/127.0.0.1:51818超时事件：读空闲
服务器做相应的处理......
/127.0.0.1:51818超时事件：写空闲
服务器做相应的处理......
15:24:15.372 [nioEventLoopGroup-3-1] DEBUG io.netty.util.Recycler - -Dio.netty.recycler.maxCapacityPerThread: 4096
15:24:15.373 [nioEventLoopGroup-3-1] DEBUG io.netty.util.Recycler - -Dio.netty.recycler.maxSharedCapacityFactor: 2
15:24:15.373 [nioEventLoopGroup-3-1] DEBUG io.netty.util.Recycler - -Dio.netty.recycler.linkCapacity: 16
15:24:15.373 [nioEventLoopGroup-3-1] DEBUG io.netty.util.Recycler - -Dio.netty.recycler.ratio: 8
15:24:15.382 [nioEventLoopGroup-3-1] DEBUG io.netty.buffer.AbstractByteBuf - -Dio.netty.buffer.checkAccessible: true
15:24:15.382 [nioEventLoopGroup-3-1] DEBUG io.netty.buffer.AbstractByteBuf - -Dio.netty.buffer.checkBounds: true
15:24:15.384 [nioEventLoopGroup-3-1] DEBUG io.netty.util.ResourceLeakDetectorFactory - Loaded default ResourceLeakDetector: io.netty.util.ResourceLeakDetector@50d10e68
15:24:15.390 [nioEventLoopGroup-3-1] WARN io.netty.channel.DefaultChannelPipeline - An exceptionCaught() event was fired, and it reached at the tail of the pipeline. It usually means the last handler in the pipeline did not handle the exception.
java.io.IOException: 远程主机强迫关闭了一个现有的连接。
	at sun.nio.ch.SocketDispatcher.read0(Native Method)
	at sun.nio.ch.SocketDispatcher.read(SocketDispatcher.java:43)
	at sun.nio.ch.IOUtil.readIntoNativeBuffer(IOUtil.java:223)
	at sun.nio.ch.IOUtil.read(IOUtil.java:192)
	at sun.nio.ch.SocketChannelImpl.read(SocketChannelImpl.java:378)
	at io.netty.buffer.PooledByteBuf.setBytes(PooledByteBuf.java:247)
	at io.netty.buffer.AbstractByteBuf.writeBytes(AbstractByteBuf.java:1140)
	at io.netty.channel.socket.nio.NioSocketChannel.doReadBytes(NioSocketChannel.java:347)
	at io.netty.channel.nio.AbstractNioByteChannel$NioByteUnsafe.read(AbstractNioByteChannel.java:148)
	at io.netty.channel.nio.NioEventLoop.processSelectedKey(NioEventLoop.java:697)
	at io.netty.channel.nio.NioEventLoop.processSelectedKeysOptimized(NioEventLoop.java:632)
	at io.netty.channel.nio.NioEventLoop.processSelectedKeys(NioEventLoop.java:549)
	at io.netty.channel.nio.NioEventLoop.run(NioEventLoop.java:511)
	at io.netty.util.concurrent.SingleThreadEventExecutor$5.run(SingleThreadEventExecutor.java:918)
	at io.netty.util.internal.ThreadExecutorMap$2.run(ThreadExecutorMap.java:74)
	at io.netty.util.concurrent.FastThreadLocalRunnable.run(FastThreadLocalRunnable.java:30)
	at java.lang.Thread.run(Thread.java:748)
```

## 四、要点

**1、** netty日志处理器；

LoggingHandler(LogLevel.INFO)

**2、** netty空闲检测处理器；

IdleStateHandler

**3、** 说明；

1）IdleStateHandler是netty提供的处理空闲状态的处理器

2）public IdleStateHandler(long readerIdleTime, long writerIdleTime, long allIdleTime, TimeUnit unit)

3）参数

long readerIdleTime：表示多长时间没有读了，就会发送一个心跳检测包，检测是否还是连接的状态

long writerIdleTime：表示多长时间没有写了，也会发送一个心跳检测包

long allIdleTime：表示多长时间既没有读也没有写了，也会发送一个心跳检测包

4）文档说明

Triggers an {@link IdleStateEvent} when a {@link Channel} has not performed read, write, or both operation for a while.

5）当IdleStateEvent触发后，就会传递给管道的下一个handler

6）通过调用（触发）下一个handler的userEventTriggered，在该方法中去处理IdleStateEvent事件
