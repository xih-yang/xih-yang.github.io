# 18、Netty 基础 之 群聊系统
- 来源：https://ddkk.com/zhuanlan/server/netty/4/18.html
- 分类：服务器框架
- 分组：教程目录
## 一、实例要求

**1、** 编写一个netty群聊系统，实现服务器端和客户端之间的数据简单通讯（非阻塞）；

**2、** 实现多人群聊；

**3、** 服务器端：可以检测用户上线，离线，并实现消息转发功能；

**4、** 客户端：通过channel可以无阻塞发送消息给其他所有用户，同时可以接受其他用户发送的消息（由服务器转发得到）；

**5、** 目的：进一步理解netty非阻塞网络编程机制；

## 二、服务端

**1、** GroupChatServer.java；

```java
package netty.groupchat;
import io.netty.bootstrap.ServerBootstrap;
import io.netty.channel.ChannelFuture;
import io.netty.channel.ChannelInitializer;
import io.netty.channel.ChannelOption;
import io.netty.channel.ChannelPipeline;
import io.netty.channel.EventLoopGroup;
import io.netty.channel.nio.NioEventLoopGroup;
import io.netty.channel.socket.SocketChannel;
import io.netty.channel.socket.nio.NioServerSocketChannel;
import io.netty.handler.codec.string.StringDecoder;
import io.netty.handler.codec.string.StringEncoder;
public class GroupChatServer {
	private int port; //监听端口
	GroupChatServer(int port) {
		this.port = port;
	}
	//编写run方法，处理客户端的请求
	public void run() {
		//创建两个线程组
		EventLoopGroup bossGroup = new NioEventLoopGroup(1);
		EventLoopGroup workerGroup = new NioEventLoopGroup(); //默认cpu核数*2
		ServerBootstrap server = new ServerBootstrap();
		try {
			server.group(bossGroup, workerGroup)
			.channel(NioServerSocketChannel.class)
			.option(ChannelOption.SO_BACKLOG, 128)
			.childOption(ChannelOption.SO_KEEPALIVE, true)
			.childHandler(new ChannelInitializer<SocketChannel>() {
				@Override
				protected void initChannel(SocketChannel ch) throws Exception {
					//获取到pipeline
					ChannelPipeline pipeline = ch.pipeline();
					//向pipeline加入解码器
					pipeline.addLast("decoder", new StringDecoder());
					//向pipeline加入编码器
					pipeline.addLast("encoder", new StringEncoder());
					//如果不加这个编码解码器的，无法直接传输字符串，应该只能处理ByteBuf而不能直接处理String
					//加入自己的业务处理handler
					pipeline.addLast(new GroupChatServerHandler());
				}
			});
			System.out.println("netty 服务器启动......");
			//绑定一个端口并且同步，生成了一个ChannelFuture对象
			//启动服务器并绑定端口
			ChannelFuture cf = server.bind(port).sync();
			//对关闭事件进行监听
			cf.channel().closeFuture().sync();
		} catch (Exception e) {
			e.printStackTrace();
		} finally {
			bossGroup.shutdownGracefully();
			workerGroup.shutdownGracefully();
		}
	}
	public static void main(String[] args) {
		new GroupChatServer(7000).run();
	}
}
```

**2、** GroupChatServerHandler.java；

```java
package netty.groupchat;
import java.text.SimpleDateFormat;
import io.netty.channel.Channel;
import io.netty.channel.ChannelHandlerContext;
import io.netty.channel.SimpleChannelInboundHandler;
import io.netty.channel.group.ChannelGroup;
import io.netty.channel.group.DefaultChannelGroup;
import io.netty.util.concurrent.GlobalEventExecutor;
public class GroupChatServerHandler extends SimpleChannelInboundHandler<String> {
	//定义一个channel组，管理所有的channel
	//GlobalEventExecutor.INSTANCE：是全局的事件执行器，是一个单例
	private static ChannelGroup channelGroup = new DefaultChannelGroup(GlobalEventExecutor.INSTANCE);
	SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
	//handlerAdded表示当连接建立，一旦连接，第一个被执行的方法
	//将当前channel加入到channelGroup
	@Override
	public void handlerAdded(ChannelHandlerContext ctx) throws Exception {
		Channel channel = ctx.channel();
		//将该加入聊天的信息推送给其他在线的客户端
		/**
		 * 该方法会将channelGroup中所有的channel遍历，并发送消息
		 * 我们不需要自己遍历
		 * 在channelGroup.add之前就不会发给自己了
		 */
		channelGroup.writeAndFlush(sdf.format(new java.util.Date()) + " [客户端] " + channel.remoteAddress() + " 加入聊天\n");
		//将该客户端加入channelGroup
		channelGroup.add(channel);
	}
	//断开连接会被触发，将xxx客户端离开信息推送给当前在线的客户
	@Override
	public void handlerRemoved(ChannelHandlerContext ctx) throws Exception {
		Channel channel = ctx.channel();
		channelGroup.writeAndFlush(sdf.format(new java.util.Date()) + " [客户端] " + channel.remoteAddress() + " 离开聊天\n");
		System.out.println("当前channelGroup大小：" + channelGroup.size());
	}
	//表示channel处于活动状态，提示xxx上线
	@Override
	public void channelActive(ChannelHandlerContext ctx) throws Exception {
		System.out.println(ctx.channel().remoteAddress() + " 上线了~");
	}
	//表示channel处于不活动状态，提示xxx离线了
	@Override
	public void channelInactive(ChannelHandlerContext ctx) throws Exception {
		System.out.println(ctx.channel().remoteAddress() + " 离线了~");
	}
	//读取数据，业务处理
	@Override
	protected void channelRead0(ChannelHandlerContext ctx, String msg) throws Exception {
		//获取到当前channel
		Channel channel = ctx.channel();
		//这时我们遍历channelGroup，根据不同的情况，回送不同的消息
		channelGroup.forEach(ch -> {
			if (channel != ch) {
				//不是当前的channel，直接转发消息
				ch.writeAndFlush("[客户] " + channel.remoteAddress() + " 发送消息：" + msg + "\n");
			} else {
				//是自己，回显自己发送的消息给自己
				ch.writeAndFlush("[自己]发送了消息：" + msg + "\n");
			}
		});
	}
	//发生异常
	@Override
	public void exceptionCaught(ChannelHandlerContext ctx, Throwable cause) throws Exception {
		//关闭通道
		ctx.close();
	}
}
```

## 三、客户端

**1、** GroupChatClient.java；

```java
package netty.groupchat;
import java.util.Scanner;
import io.netty.bootstrap.Bootstrap;
import io.netty.channel.Channel;
import io.netty.channel.ChannelFuture;
import io.netty.channel.ChannelInitializer;
import io.netty.channel.ChannelPipeline;
import io.netty.channel.EventLoopGroup;
import io.netty.channel.nio.NioEventLoopGroup;
import io.netty.channel.socket.SocketChannel;
import io.netty.channel.socket.nio.NioSocketChannel;
import io.netty.handler.codec.string.StringDecoder;
import io.netty.handler.codec.string.StringEncoder;
public class GroupChatClient {
	//属性
	private final String host;
	private final int port;
	GroupChatClient(String host, int port) {
		this.host = host;
		this.port = port;
	}
	public void run() {
		EventLoopGroup group = new NioEventLoopGroup();
		Scanner scanner = null;
		try {
			Bootstrap bootstrap = new Bootstrap();
			bootstrap.group(group)
				.channel(NioSocketChannel.class)
				.handler(new ChannelInitializer<SocketChannel>() {
					@Override
					protected void initChannel(SocketChannel ch) throws Exception {
						//得到pipeline
						ChannelPipeline pipeline = ch.pipeline();
						//加入相关handler
						pipeline.addLast("decoder", new StringDecoder());
						pipeline.addLast("encoder", new StringEncoder());
						//加入自定的handler
						pipeline.addLast(new GroupChatClientHandler());
					}
				});
			ChannelFuture channelFuture = bootstrap.connect(host, port).sync();
			//得到channel
			Channel channel = channelFuture.channel();
			System.out.println("------" + channel.localAddress() + "------");
			//客户端需要输入信息，创建一个扫描器
			scanner = new Scanner(System.in);
			while (scanner.hasNextLine()) {
				String msg = scanner.nextLine();
				//通过channel发送到服务器端
				channel.writeAndFlush(msg + "\r\n");
			}
		} catch (Exception e) {
			e.printStackTrace();
		} finally {
			group.shutdownGracefully();
			scanner.close();
		}
	}
	public static void main(String[] args) {
		new GroupChatClient("127.0.0.1", 7000).run();
	}
}
```

**2、** GroupChatClientHandler.java；

```java
package netty.groupchat;
import io.netty.channel.ChannelHandlerContext;
import io.netty.channel.SimpleChannelInboundHandler;
public class GroupChatClientHandler extends SimpleChannelInboundHandler<String> {
	@Override
	protected void channelRead0(ChannelHandlerContext ctx, String msg) throws Exception {
		System.out.println(msg.trim());
	}
}
```

## 四、备注

连接建立：

handlerAdded() -> channelRegistered() -> channelActive()

连接断开：

channelInactive() -> channelUnregistered() -> handlerRemoved()

发生异常：

exceptionCaught()

netty封装的事件驱动真的很牛逼

重点：
服务端channelGroup遍历channel，handlerAdded/handlerRemoved事件

客户端获取channel在主线程中写操作，同时netty负责异步非阻塞处理读操作

## 五、执行情况

**1、** 服务端日志；

```java
15:40:46.219 [main] DEBUG io.netty.util.internal.logging.InternalLoggerFactory - Using SLF4J as the default logging framework
15:40:46.226 [main] DEBUG io.netty.channel.MultithreadEventLoopGroup - -Dio.netty.eventLoopThreads: 16
15:40:46.257 [main] DEBUG io.netty.util.internal.InternalThreadLocalMap - -Dio.netty.threadLocalMap.stringBuilder.initialSize: 1024
15:40:46.257 [main] DEBUG io.netty.util.internal.InternalThreadLocalMap - -Dio.netty.threadLocalMap.stringBuilder.maxSize: 4096
15:40:46.271 [main] DEBUG io.netty.channel.nio.NioEventLoop - -Dio.netty.noKeySetOptimization: false
15:40:46.271 [main] DEBUG io.netty.channel.nio.NioEventLoop - -Dio.netty.selectorAutoRebuildThreshold: 512
15:40:46.294 [main] DEBUG io.netty.util.internal.PlatformDependent - Platform: Windows
15:40:46.297 [main] DEBUG io.netty.util.internal.PlatformDependent0 - -Dio.netty.noUnsafe: false
15:40:46.297 [main] DEBUG io.netty.util.internal.PlatformDependent0 - Java version: 8
15:40:46.300 [main] DEBUG io.netty.util.internal.PlatformDependent0 - sun.misc.Unsafe.theUnsafe: available
15:40:46.301 [main] DEBUG io.netty.util.internal.PlatformDependent0 - sun.misc.Unsafe.copyMemory: available
15:40:46.302 [main] DEBUG io.netty.util.internal.PlatformDependent0 - java.nio.Buffer.address: available
15:40:46.302 [main] DEBUG io.netty.util.internal.PlatformDependent0 - direct buffer constructor: available
15:40:46.304 [main] DEBUG io.netty.util.internal.PlatformDependent0 - java.nio.Bits.unaligned: available, true
15:40:46.304 [main] DEBUG io.netty.util.internal.PlatformDependent0 - jdk.internal.misc.Unsafe.allocateUninitializedArray(int): unavailable prior to Java9
15:40:46.304 [main] DEBUG io.netty.util.internal.PlatformDependent0 - java.nio.DirectByteBuffer.<init>(long, int): available
15:40:46.304 [main] DEBUG io.netty.util.internal.PlatformDependent - sun.misc.Unsafe: available
15:40:46.305 [main] DEBUG io.netty.util.internal.PlatformDependent - -Dio.netty.tmpdir: C:\Users\sjcui\AppData\Local\Temp (java.io.tmpdir)
15:40:46.305 [main] DEBUG io.netty.util.internal.PlatformDependent - -Dio.netty.bitMode: 64 (sun.arch.data.model)
15:40:46.307 [main] DEBUG io.netty.util.internal.PlatformDependent - -Dio.netty.maxDirectMemory: 3767533568 bytes
15:40:46.308 [main] DEBUG io.netty.util.internal.PlatformDependent - -Dio.netty.uninitializedArrayAllocationThreshold: -1
15:40:46.309 [main] DEBUG io.netty.util.internal.CleanerJava6 - java.nio.ByteBuffer.cleaner(): available
15:40:46.309 [main] DEBUG io.netty.util.internal.PlatformDependent - -Dio.netty.noPreferDirect: false
15:40:46.324 [main] DEBUG io.netty.util.internal.PlatformDependent - org.jctools-core.MpscChunkedArrayQueue: available
netty 服务器启动......
15:40:46.888 [main] DEBUG io.netty.channel.DefaultChannelId - -Dio.netty.processId: 9060 (auto-detected)
15:40:46.891 [main] DEBUG io.netty.util.NetUtil - -Djava.net.preferIPv4Stack: false
15:40:46.891 [main] DEBUG io.netty.util.NetUtil - -Djava.net.preferIPv6Addresses: false
15:40:47.277 [main] DEBUG io.netty.util.NetUtil - Loopback interface: lo (Software Loopback Interface 1, 127.0.0.1)
15:40:47.289 [main] DEBUG io.netty.util.NetUtil - Failed to get SOMAXCONN from sysctl and file \proc\sys\net\core\somaxconn. Default: 200
15:40:47.665 [main] DEBUG io.netty.channel.DefaultChannelId - -Dio.netty.machineId: 00:50:56:ff:fe:c0:00:01 (auto-detected)
15:40:47.681 [main] DEBUG io.netty.util.ResourceLeakDetector - -Dio.netty.leakDetection.level: simple
15:40:47.681 [main] DEBUG io.netty.util.ResourceLeakDetector - -Dio.netty.leakDetection.targetRecords: 4
15:40:47.711 [main] DEBUG io.netty.buffer.PooledByteBufAllocator - -Dio.netty.allocator.numHeapArenas: 16
15:40:47.711 [main] DEBUG io.netty.buffer.PooledByteBufAllocator - -Dio.netty.allocator.numDirectArenas: 16
15:40:47.711 [main] DEBUG io.netty.buffer.PooledByteBufAllocator - -Dio.netty.allocator.pageSize: 8192
15:40:47.711 [main] DEBUG io.netty.buffer.PooledByteBufAllocator - -Dio.netty.allocator.maxOrder: 11
15:40:47.711 [main] DEBUG io.netty.buffer.PooledByteBufAllocator - -Dio.netty.allocator.chunkSize: 16777216
15:40:47.711 [main] DEBUG io.netty.buffer.PooledByteBufAllocator - -Dio.netty.allocator.tinyCacheSize: 512
15:40:47.711 [main] DEBUG io.netty.buffer.PooledByteBufAllocator - -Dio.netty.allocator.smallCacheSize: 256
15:40:47.711 [main] DEBUG io.netty.buffer.PooledByteBufAllocator - -Dio.netty.allocator.normalCacheSize: 64
15:40:47.711 [main] DEBUG io.netty.buffer.PooledByteBufAllocator - -Dio.netty.allocator.maxCachedBufferCapacity: 32768
15:40:47.711 [main] DEBUG io.netty.buffer.PooledByteBufAllocator - -Dio.netty.allocator.cacheTrimInterval: 8192
15:40:47.712 [main] DEBUG io.netty.buffer.PooledByteBufAllocator - -Dio.netty.allocator.cacheTrimIntervalMillis: 0
15:40:47.712 [main] DEBUG io.netty.buffer.PooledByteBufAllocator - -Dio.netty.allocator.useCacheForAllThreads: true
15:40:47.712 [main] DEBUG io.netty.buffer.PooledByteBufAllocator - -Dio.netty.allocator.maxCachedByteBuffersPerChunk: 1023
15:40:47.722 [main] DEBUG io.netty.buffer.ByteBufUtil - -Dio.netty.allocator.type: pooled
15:40:47.722 [main] DEBUG io.netty.buffer.ByteBufUtil - -Dio.netty.threadLocalDirectBufferSize: 0
15:40:47.722 [main] DEBUG io.netty.buffer.ByteBufUtil - -Dio.netty.maxThreadLocalCharBufferSize: 16384
/127.0.0.1:59696 上线了~
15:41:22.169 [nioEventLoopGroup-3-2] DEBUG io.netty.util.Recycler - -Dio.netty.recycler.maxCapacityPerThread: 4096
15:41:22.169 [nioEventLoopGroup-3-2] DEBUG io.netty.util.Recycler - -Dio.netty.recycler.maxSharedCapacityFactor: 2
15:41:22.169 [nioEventLoopGroup-3-2] DEBUG io.netty.util.Recycler - -Dio.netty.recycler.linkCapacity: 16
15:41:22.169 [nioEventLoopGroup-3-2] DEBUG io.netty.util.Recycler - -Dio.netty.recycler.ratio: 8
/127.0.0.1:59730 上线了~
15:41:22.184 [nioEventLoopGroup-3-1] DEBUG io.netty.buffer.AbstractByteBuf - -Dio.netty.buffer.checkAccessible: true
15:41:22.184 [nioEventLoopGroup-3-1] DEBUG io.netty.buffer.AbstractByteBuf - -Dio.netty.buffer.checkBounds: true
15:41:22.186 [nioEventLoopGroup-3-1] DEBUG io.netty.util.ResourceLeakDetectorFactory - Loaded default ResourceLeakDetector: io.netty.util.ResourceLeakDetector@10d46905
/127.0.0.1:59767 上线了~
/127.0.0.1:59696 离线了~
当前channelGroup大小：2
/127.0.0.1:59730 离线了~
当前channelGroup大小：1
/127.0.0.1:59767 离线了~
当前channelGroup大小：0
```

**2、** 客户端1日志；

```java
15:41:06.051 [main] DEBUG io.netty.util.internal.logging.InternalLoggerFactory - Using SLF4J as the default logging framework
15:41:06.060 [main] DEBUG io.netty.channel.MultithreadEventLoopGroup - -Dio.netty.eventLoopThreads: 16
15:41:06.083 [main] DEBUG io.netty.util.internal.InternalThreadLocalMap - -Dio.netty.threadLocalMap.stringBuilder.initialSize: 1024
15:41:06.083 [main] DEBUG io.netty.util.internal.InternalThreadLocalMap - -Dio.netty.threadLocalMap.stringBuilder.maxSize: 4096
15:41:06.094 [main] DEBUG io.netty.channel.nio.NioEventLoop - -Dio.netty.noKeySetOptimization: false
15:41:06.094 [main] DEBUG io.netty.channel.nio.NioEventLoop - -Dio.netty.selectorAutoRebuildThreshold: 512
15:41:06.117 [main] DEBUG io.netty.util.internal.PlatformDependent - Platform: Windows
15:41:06.121 [main] DEBUG io.netty.util.internal.PlatformDependent0 - -Dio.netty.noUnsafe: false
15:41:06.121 [main] DEBUG io.netty.util.internal.PlatformDependent0 - Java version: 8
15:41:06.124 [main] DEBUG io.netty.util.internal.PlatformDependent0 - sun.misc.Unsafe.theUnsafe: available
15:41:06.125 [main] DEBUG io.netty.util.internal.PlatformDependent0 - sun.misc.Unsafe.copyMemory: available
15:41:06.126 [main] DEBUG io.netty.util.internal.PlatformDependent0 - java.nio.Buffer.address: available
15:41:06.127 [main] DEBUG io.netty.util.internal.PlatformDependent0 - direct buffer constructor: available
15:41:06.128 [main] DEBUG io.netty.util.internal.PlatformDependent0 - java.nio.Bits.unaligned: available, true
15:41:06.128 [main] DEBUG io.netty.util.internal.PlatformDependent0 - jdk.internal.misc.Unsafe.allocateUninitializedArray(int): unavailable prior to Java9
15:41:06.128 [main] DEBUG io.netty.util.internal.PlatformDependent0 - java.nio.DirectByteBuffer.<init>(long, int): available
15:41:06.128 [main] DEBUG io.netty.util.internal.PlatformDependent - sun.misc.Unsafe: available
15:41:06.129 [main] DEBUG io.netty.util.internal.PlatformDependent - -Dio.netty.tmpdir: C:\Users\sjcui\AppData\Local\Temp (java.io.tmpdir)
15:41:06.129 [main] DEBUG io.netty.util.internal.PlatformDependent - -Dio.netty.bitMode: 64 (sun.arch.data.model)
15:41:06.131 [main] DEBUG io.netty.util.internal.PlatformDependent - -Dio.netty.maxDirectMemory: 3767533568 bytes
15:41:06.131 [main] DEBUG io.netty.util.internal.PlatformDependent - -Dio.netty.uninitializedArrayAllocationThreshold: -1
15:41:06.133 [main] DEBUG io.netty.util.internal.CleanerJava6 - java.nio.ByteBuffer.cleaner(): available
15:41:06.133 [main] DEBUG io.netty.util.internal.PlatformDependent - -Dio.netty.noPreferDirect: false
15:41:06.149 [main] DEBUG io.netty.util.internal.PlatformDependent - org.jctools-core.MpscChunkedArrayQueue: available
15:41:06.658 [main] DEBUG io.netty.channel.DefaultChannelId - -Dio.netty.processId: 22336 (auto-detected)
15:41:06.661 [main] DEBUG io.netty.util.NetUtil - -Djava.net.preferIPv4Stack: false
15:41:06.661 [main] DEBUG io.netty.util.NetUtil - -Djava.net.preferIPv6Addresses: false
15:41:07.043 [main] DEBUG io.netty.util.NetUtil - Loopback interface: lo (Software Loopback Interface 1, 127.0.0.1)
15:41:07.043 [main] DEBUG io.netty.util.NetUtil - Failed to get SOMAXCONN from sysctl and file \proc\sys\net\core\somaxconn. Default: 200
15:41:07.428 [main] DEBUG io.netty.channel.DefaultChannelId - -Dio.netty.machineId: 00:50:56:ff:fe:c0:00:01 (auto-detected)
15:41:07.442 [main] DEBUG io.netty.util.ResourceLeakDetector - -Dio.netty.leakDetection.level: simple
15:41:07.442 [main] DEBUG io.netty.util.ResourceLeakDetector - -Dio.netty.leakDetection.targetRecords: 4
15:41:07.471 [main] DEBUG io.netty.buffer.PooledByteBufAllocator - -Dio.netty.allocator.numHeapArenas: 16
15:41:07.471 [main] DEBUG io.netty.buffer.PooledByteBufAllocator - -Dio.netty.allocator.numDirectArenas: 16
15:41:07.472 [main] DEBUG io.netty.buffer.PooledByteBufAllocator - -Dio.netty.allocator.pageSize: 8192
15:41:07.472 [main] DEBUG io.netty.buffer.PooledByteBufAllocator - -Dio.netty.allocator.maxOrder: 11
15:41:07.472 [main] DEBUG io.netty.buffer.PooledByteBufAllocator - -Dio.netty.allocator.chunkSize: 16777216
15:41:07.472 [main] DEBUG io.netty.buffer.PooledByteBufAllocator - -Dio.netty.allocator.tinyCacheSize: 512
15:41:07.472 [main] DEBUG io.netty.buffer.PooledByteBufAllocator - -Dio.netty.allocator.smallCacheSize: 256
15:41:07.472 [main] DEBUG io.netty.buffer.PooledByteBufAllocator - -Dio.netty.allocator.normalCacheSize: 64
15:41:07.472 [main] DEBUG io.netty.buffer.PooledByteBufAllocator - -Dio.netty.allocator.maxCachedBufferCapacity: 32768
15:41:07.472 [main] DEBUG io.netty.buffer.PooledByteBufAllocator - -Dio.netty.allocator.cacheTrimInterval: 8192
15:41:07.472 [main] DEBUG io.netty.buffer.PooledByteBufAllocator - -Dio.netty.allocator.cacheTrimIntervalMillis: 0
15:41:07.472 [main] DEBUG io.netty.buffer.PooledByteBufAllocator - -Dio.netty.allocator.useCacheForAllThreads: true
15:41:07.473 [main] DEBUG io.netty.buffer.PooledByteBufAllocator - -Dio.netty.allocator.maxCachedByteBuffersPerChunk: 1023
15:41:07.482 [main] DEBUG io.netty.buffer.ByteBufUtil - -Dio.netty.allocator.type: pooled
15:41:07.482 [main] DEBUG io.netty.buffer.ByteBufUtil - -Dio.netty.threadLocalDirectBufferSize: 0
15:41:07.482 [main] DEBUG io.netty.buffer.ByteBufUtil - -Dio.netty.maxThreadLocalCharBufferSize: 16384
------/127.0.0.1:59696------
15:41:22.196 [nioEventLoopGroup-2-1] DEBUG io.netty.util.Recycler - -Dio.netty.recycler.maxCapacityPerThread: 4096
15:41:22.196 [nioEventLoopGroup-2-1] DEBUG io.netty.util.Recycler - -Dio.netty.recycler.maxSharedCapacityFactor: 2
15:41:22.196 [nioEventLoopGroup-2-1] DEBUG io.netty.util.Recycler - -Dio.netty.recycler.linkCapacity: 16
15:41:22.196 [nioEventLoopGroup-2-1] DEBUG io.netty.util.Recycler - -Dio.netty.recycler.ratio: 8
15:41:22.207 [nioEventLoopGroup-2-1] DEBUG io.netty.buffer.AbstractByteBuf - -Dio.netty.buffer.checkAccessible: true
15:41:22.207 [nioEventLoopGroup-2-1] DEBUG io.netty.buffer.AbstractByteBuf - -Dio.netty.buffer.checkBounds: true
15:41:22.209 [nioEventLoopGroup-2-1] DEBUG io.netty.util.ResourceLeakDetectorFactory - Loaded default ResourceLeakDetector: io.netty.util.ResourceLeakDetector@7148612a
2023-01-03 15:41:22 [客户端] /127.0.0.1:59730 加入聊天
2023-01-03 15:41:55 [客户端] /127.0.0.1:59767 加入聊天
[客户] /127.0.0.1:59767 发送消息：我是59767
你好，我是tom
[自己]发送了消息：你好，我是tom
[客户] /127.0.0.1:59730 发送消息：我是6666
```

**3、** 客户端2日志；

```java
15:41:20.736 [main] DEBUG io.netty.util.internal.logging.InternalLoggerFactory - Using SLF4J as the default logging framework
15:41:20.742 [main] DEBUG io.netty.channel.MultithreadEventLoopGroup - -Dio.netty.eventLoopThreads: 16
15:41:20.765 [main] DEBUG io.netty.util.internal.InternalThreadLocalMap - -Dio.netty.threadLocalMap.stringBuilder.initialSize: 1024
15:41:20.765 [main] DEBUG io.netty.util.internal.InternalThreadLocalMap - -Dio.netty.threadLocalMap.stringBuilder.maxSize: 4096
15:41:20.776 [main] DEBUG io.netty.channel.nio.NioEventLoop - -Dio.netty.noKeySetOptimization: false
15:41:20.776 [main] DEBUG io.netty.channel.nio.NioEventLoop - -Dio.netty.selectorAutoRebuildThreshold: 512
15:41:20.801 [main] DEBUG io.netty.util.internal.PlatformDependent - Platform: Windows
15:41:20.803 [main] DEBUG io.netty.util.internal.PlatformDependent0 - -Dio.netty.noUnsafe: false
15:41:20.804 [main] DEBUG io.netty.util.internal.PlatformDependent0 - Java version: 8
15:41:20.806 [main] DEBUG io.netty.util.internal.PlatformDependent0 - sun.misc.Unsafe.theUnsafe: available
15:41:20.808 [main] DEBUG io.netty.util.internal.PlatformDependent0 - sun.misc.Unsafe.copyMemory: available
15:41:20.808 [main] DEBUG io.netty.util.internal.PlatformDependent0 - java.nio.Buffer.address: available
15:41:20.809 [main] DEBUG io.netty.util.internal.PlatformDependent0 - direct buffer constructor: available
15:41:20.811 [main] DEBUG io.netty.util.internal.PlatformDependent0 - java.nio.Bits.unaligned: available, true
15:41:20.811 [main] DEBUG io.netty.util.internal.PlatformDependent0 - jdk.internal.misc.Unsafe.allocateUninitializedArray(int): unavailable prior to Java9
15:41:20.812 [main] DEBUG io.netty.util.internal.PlatformDependent0 - java.nio.DirectByteBuffer.<init>(long, int): available
15:41:20.812 [main] DEBUG io.netty.util.internal.PlatformDependent - sun.misc.Unsafe: available
15:41:20.813 [main] DEBUG io.netty.util.internal.PlatformDependent - -Dio.netty.tmpdir: C:\Users\sjcui\AppData\Local\Temp (java.io.tmpdir)
15:41:20.814 [main] DEBUG io.netty.util.internal.PlatformDependent - -Dio.netty.bitMode: 64 (sun.arch.data.model)
15:41:20.816 [main] DEBUG io.netty.util.internal.PlatformDependent - -Dio.netty.maxDirectMemory: 3767533568 bytes
15:41:20.816 [main] DEBUG io.netty.util.internal.PlatformDependent - -Dio.netty.uninitializedArrayAllocationThreshold: -1
15:41:20.818 [main] DEBUG io.netty.util.internal.CleanerJava6 - java.nio.ByteBuffer.cleaner(): available
15:41:20.818 [main] DEBUG io.netty.util.internal.PlatformDependent - -Dio.netty.noPreferDirect: false
15:41:20.833 [main] DEBUG io.netty.util.internal.PlatformDependent - org.jctools-core.MpscChunkedArrayQueue: available
15:41:21.282 [main] DEBUG io.netty.channel.DefaultChannelId - -Dio.netty.processId: 22260 (auto-detected)
15:41:21.284 [main] DEBUG io.netty.util.NetUtil - -Djava.net.preferIPv4Stack: false
15:41:21.284 [main] DEBUG io.netty.util.NetUtil - -Djava.net.preferIPv6Addresses: false
15:41:21.669 [main] DEBUG io.netty.util.NetUtil - Loopback interface: lo (Software Loopback Interface 1, 127.0.0.1)
15:41:21.670 [main] DEBUG io.netty.util.NetUtil - Failed to get SOMAXCONN from sysctl and file \proc\sys\net\core\somaxconn. Default: 200
15:41:22.059 [main] DEBUG io.netty.channel.DefaultChannelId - -Dio.netty.machineId: 00:50:56:ff:fe:c0:00:01 (auto-detected)
15:41:22.075 [main] DEBUG io.netty.util.ResourceLeakDetector - -Dio.netty.leakDetection.level: simple
15:41:22.075 [main] DEBUG io.netty.util.ResourceLeakDetector - -Dio.netty.leakDetection.targetRecords: 4
15:41:22.102 [main] DEBUG io.netty.buffer.PooledByteBufAllocator - -Dio.netty.allocator.numHeapArenas: 16
15:41:22.102 [main] DEBUG io.netty.buffer.PooledByteBufAllocator - -Dio.netty.allocator.numDirectArenas: 16
15:41:22.102 [main] DEBUG io.netty.buffer.PooledByteBufAllocator - -Dio.netty.allocator.pageSize: 8192
15:41:22.102 [main] DEBUG io.netty.buffer.PooledByteBufAllocator - -Dio.netty.allocator.maxOrder: 11
15:41:22.102 [main] DEBUG io.netty.buffer.PooledByteBufAllocator - -Dio.netty.allocator.chunkSize: 16777216
15:41:22.102 [main] DEBUG io.netty.buffer.PooledByteBufAllocator - -Dio.netty.allocator.tinyCacheSize: 512
15:41:22.102 [main] DEBUG io.netty.buffer.PooledByteBufAllocator - -Dio.netty.allocator.smallCacheSize: 256
15:41:22.102 [main] DEBUG io.netty.buffer.PooledByteBufAllocator - -Dio.netty.allocator.normalCacheSize: 64
15:41:22.102 [main] DEBUG io.netty.buffer.PooledByteBufAllocator - -Dio.netty.allocator.maxCachedBufferCapacity: 32768
15:41:22.102 [main] DEBUG io.netty.buffer.PooledByteBufAllocator - -Dio.netty.allocator.cacheTrimInterval: 8192
15:41:22.103 [main] DEBUG io.netty.buffer.PooledByteBufAllocator - -Dio.netty.allocator.cacheTrimIntervalMillis: 0
15:41:22.103 [main] DEBUG io.netty.buffer.PooledByteBufAllocator - -Dio.netty.allocator.useCacheForAllThreads: true
15:41:22.103 [main] DEBUG io.netty.buffer.PooledByteBufAllocator - -Dio.netty.allocator.maxCachedByteBuffersPerChunk: 1023
15:41:22.113 [main] DEBUG io.netty.buffer.ByteBufUtil - -Dio.netty.allocator.type: pooled
15:41:22.113 [main] DEBUG io.netty.buffer.ByteBufUtil - -Dio.netty.threadLocalDirectBufferSize: 0
15:41:22.114 [main] DEBUG io.netty.buffer.ByteBufUtil - -Dio.netty.maxThreadLocalCharBufferSize: 16384
------/127.0.0.1:59730------
15:41:55.957 [nioEventLoopGroup-2-1] DEBUG io.netty.util.Recycler - -Dio.netty.recycler.maxCapacityPerThread: 4096
15:41:55.958 [nioEventLoopGroup-2-1] DEBUG io.netty.util.Recycler - -Dio.netty.recycler.maxSharedCapacityFactor: 2
15:41:55.958 [nioEventLoopGroup-2-1] DEBUG io.netty.util.Recycler - -Dio.netty.recycler.linkCapacity: 16
15:41:55.958 [nioEventLoopGroup-2-1] DEBUG io.netty.util.Recycler - -Dio.netty.recycler.ratio: 8
15:41:55.966 [nioEventLoopGroup-2-1] DEBUG io.netty.buffer.AbstractByteBuf - -Dio.netty.buffer.checkAccessible: true
15:41:55.966 [nioEventLoopGroup-2-1] DEBUG io.netty.buffer.AbstractByteBuf - -Dio.netty.buffer.checkBounds: true
15:41:55.967 [nioEventLoopGroup-2-1] DEBUG io.netty.util.ResourceLeakDetectorFactory - Loaded default ResourceLeakDetector: io.netty.util.ResourceLeakDetector@7148612a
2023-01-03 15:41:55 [客户端] /127.0.0.1:59767 加入聊天
[客户] /127.0.0.1:59767 发送消息：我是59767
[客户] /127.0.0.1:59696 发送消息：你好，我是tom
我是6666
[自己]发送了消息：我是6666
2023-01-03 15:46:55 [客户端] /127.0.0.1:59696 离开聊天
```

**4、** 客户端3日志；

```java
15:41:54.500 [main] DEBUG io.netty.util.internal.logging.InternalLoggerFactory - Using SLF4J as the default logging framework
15:41:54.507 [main] DEBUG io.netty.channel.MultithreadEventLoopGroup - -Dio.netty.eventLoopThreads: 16
15:41:54.530 [main] DEBUG io.netty.util.internal.InternalThreadLocalMap - -Dio.netty.threadLocalMap.stringBuilder.initialSize: 1024
15:41:54.530 [main] DEBUG io.netty.util.internal.InternalThreadLocalMap - -Dio.netty.threadLocalMap.stringBuilder.maxSize: 4096
15:41:54.539 [main] DEBUG io.netty.channel.nio.NioEventLoop - -Dio.netty.noKeySetOptimization: false
15:41:54.539 [main] DEBUG io.netty.channel.nio.NioEventLoop - -Dio.netty.selectorAutoRebuildThreshold: 512
15:41:54.560 [main] DEBUG io.netty.util.internal.PlatformDependent - Platform: Windows
15:41:54.564 [main] DEBUG io.netty.util.internal.PlatformDependent0 - -Dio.netty.noUnsafe: false
15:41:54.564 [main] DEBUG io.netty.util.internal.PlatformDependent0 - Java version: 8
15:41:54.566 [main] DEBUG io.netty.util.internal.PlatformDependent0 - sun.misc.Unsafe.theUnsafe: available
15:41:54.567 [main] DEBUG io.netty.util.internal.PlatformDependent0 - sun.misc.Unsafe.copyMemory: available
15:41:54.568 [main] DEBUG io.netty.util.internal.PlatformDependent0 - java.nio.Buffer.address: available
15:41:54.569 [main] DEBUG io.netty.util.internal.PlatformDependent0 - direct buffer constructor: available
15:41:54.570 [main] DEBUG io.netty.util.internal.PlatformDependent0 - java.nio.Bits.unaligned: available, true
15:41:54.570 [main] DEBUG io.netty.util.internal.PlatformDependent0 - jdk.internal.misc.Unsafe.allocateUninitializedArray(int): unavailable prior to Java9
15:41:54.570 [main] DEBUG io.netty.util.internal.PlatformDependent0 - java.nio.DirectByteBuffer.<init>(long, int): available
15:41:54.570 [main] DEBUG io.netty.util.internal.PlatformDependent - sun.misc.Unsafe: available
15:41:54.571 [main] DEBUG io.netty.util.internal.PlatformDependent - -Dio.netty.tmpdir: C:\Users\sjcui\AppData\Local\Temp (java.io.tmpdir)
15:41:54.571 [main] DEBUG io.netty.util.internal.PlatformDependent - -Dio.netty.bitMode: 64 (sun.arch.data.model)
15:41:54.574 [main] DEBUG io.netty.util.internal.PlatformDependent - -Dio.netty.maxDirectMemory: 3767533568 bytes
15:41:54.574 [main] DEBUG io.netty.util.internal.PlatformDependent - -Dio.netty.uninitializedArrayAllocationThreshold: -1
15:41:54.576 [main] DEBUG io.netty.util.internal.CleanerJava6 - java.nio.ByteBuffer.cleaner(): available
15:41:54.576 [main] DEBUG io.netty.util.internal.PlatformDependent - -Dio.netty.noPreferDirect: false
15:41:54.590 [main] DEBUG io.netty.util.internal.PlatformDependent - org.jctools-core.MpscChunkedArrayQueue: available
15:41:55.077 [main] DEBUG io.netty.channel.DefaultChannelId - -Dio.netty.processId: 8304 (auto-detected)
15:41:55.080 [main] DEBUG io.netty.util.NetUtil - -Djava.net.preferIPv4Stack: false
15:41:55.081 [main] DEBUG io.netty.util.NetUtil - -Djava.net.preferIPv6Addresses: false
15:41:55.486 [main] DEBUG io.netty.util.NetUtil - Loopback interface: lo (Software Loopback Interface 1, 127.0.0.1)
15:41:55.486 [main] DEBUG io.netty.util.NetUtil - Failed to get SOMAXCONN from sysctl and file \proc\sys\net\core\somaxconn. Default: 200
15:41:55.862 [main] DEBUG io.netty.channel.DefaultChannelId - -Dio.netty.machineId: 00:50:56:ff:fe:c0:00:01 (auto-detected)
15:41:55.876 [main] DEBUG io.netty.util.ResourceLeakDetector - -Dio.netty.leakDetection.level: simple
15:41:55.876 [main] DEBUG io.netty.util.ResourceLeakDetector - -Dio.netty.leakDetection.targetRecords: 4
15:41:55.904 [main] DEBUG io.netty.buffer.PooledByteBufAllocator - -Dio.netty.allocator.numHeapArenas: 16
15:41:55.904 [main] DEBUG io.netty.buffer.PooledByteBufAllocator - -Dio.netty.allocator.numDirectArenas: 16
15:41:55.904 [main] DEBUG io.netty.buffer.PooledByteBufAllocator - -Dio.netty.allocator.pageSize: 8192
15:41:55.904 [main] DEBUG io.netty.buffer.PooledByteBufAllocator - -Dio.netty.allocator.maxOrder: 11
15:41:55.904 [main] DEBUG io.netty.buffer.PooledByteBufAllocator - -Dio.netty.allocator.chunkSize: 16777216
15:41:55.904 [main] DEBUG io.netty.buffer.PooledByteBufAllocator - -Dio.netty.allocator.tinyCacheSize: 512
15:41:55.905 [main] DEBUG io.netty.buffer.PooledByteBufAllocator - -Dio.netty.allocator.smallCacheSize: 256
15:41:55.905 [main] DEBUG io.netty.buffer.PooledByteBufAllocator - -Dio.netty.allocator.normalCacheSize: 64
15:41:55.905 [main] DEBUG io.netty.buffer.PooledByteBufAllocator - -Dio.netty.allocator.maxCachedBufferCapacity: 32768
15:41:55.905 [main] DEBUG io.netty.buffer.PooledByteBufAllocator - -Dio.netty.allocator.cacheTrimInterval: 8192
15:41:55.905 [main] DEBUG io.netty.buffer.PooledByteBufAllocator - -Dio.netty.allocator.cacheTrimIntervalMillis: 0
15:41:55.905 [main] DEBUG io.netty.buffer.PooledByteBufAllocator - -Dio.netty.allocator.useCacheForAllThreads: true
15:41:55.906 [main] DEBUG io.netty.buffer.PooledByteBufAllocator - -Dio.netty.allocator.maxCachedByteBuffersPerChunk: 1023
15:41:55.916 [main] DEBUG io.netty.buffer.ByteBufUtil - -Dio.netty.allocator.type: pooled
15:41:55.916 [main] DEBUG io.netty.buffer.ByteBufUtil - -Dio.netty.threadLocalDirectBufferSize: 0
15:41:55.916 [main] DEBUG io.netty.buffer.ByteBufUtil - -Dio.netty.maxThreadLocalCharBufferSize: 16384
------/127.0.0.1:59767------
我是59767
15:43:47.059 [main] DEBUG io.netty.util.Recycler - -Dio.netty.recycler.maxCapacityPerThread: 4096
15:43:47.059 [main] DEBUG io.netty.util.Recycler - -Dio.netty.recycler.maxSharedCapacityFactor: 2
15:43:47.059 [main] DEBUG io.netty.util.Recycler - -Dio.netty.recycler.linkCapacity: 16
15:43:47.059 [main] DEBUG io.netty.util.Recycler - -Dio.netty.recycler.ratio: 8
15:43:47.075 [nioEventLoopGroup-2-1] DEBUG io.netty.buffer.AbstractByteBuf - -Dio.netty.buffer.checkAccessible: true
15:43:47.075 [nioEventLoopGroup-2-1] DEBUG io.netty.buffer.AbstractByteBuf - -Dio.netty.buffer.checkBounds: true
15:43:47.077 [nioEventLoopGroup-2-1] DEBUG io.netty.util.ResourceLeakDetectorFactory - Loaded default ResourceLeakDetector: io.netty.util.ResourceLeakDetector@48187557
[自己]发送了消息：我是59767
[客户] /127.0.0.1:59696 发送消息：你好，我是tom
[客户] /127.0.0.1:59730 发送消息：我是6666
2023-01-03 15:46:55 [客户端] /127.0.0.1:59696 离开聊天
2023-01-03 15:48:26 [客户端] /127.0.0.1:59730 离开聊天
```
