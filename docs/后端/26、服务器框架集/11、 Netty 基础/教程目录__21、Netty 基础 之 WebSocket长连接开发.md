# 21、Netty 基础 之 WebSocket长连接开发
- 来源：https://ddkk.com/zhuanlan/server/netty/4/21.html
- 分类：服务器框架
- 分组：教程目录
## 一、实例要求

**1、** http协议是无状态的，浏览器和服务器间的请求响应一次，下一次会重新创建连接；

**2、** 要求：实现基于webSocket的长连接的全双工的交互；

**3、** 改变http协议多次请求的约束，实现长连接了，服务器可以发送消息给浏览器；

**4、** 客户端浏览器和服务器端会相互感知，比如服务器关闭了，浏览器会感知，同样浏览器关闭了，服务器会感知；

## 二、服务端

**1、** WebSocketServer.java；

```java
package netty.websocket;
import io.netty.bootstrap.ServerBootstrap;
import io.netty.channel.ChannelFuture;
import io.netty.channel.ChannelInitializer;
import io.netty.channel.ChannelPipeline;
import io.netty.channel.EventLoopGroup;
import io.netty.channel.nio.NioEventLoopGroup;
import io.netty.channel.socket.SocketChannel;
import io.netty.channel.socket.nio.NioServerSocketChannel;
import io.netty.handler.codec.http.HttpObjectAggregator;
import io.netty.handler.codec.http.HttpServerCodec;
import io.netty.handler.codec.http.websocketx.WebSocketServerProtocolHandler;
import io.netty.handler.logging.LogLevel;
import io.netty.handler.logging.LoggingHandler;
import io.netty.handler.stream.ChunkedWriteHandler;
public class WebSocketServer {
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
						//因为基于http协议，所以我们使用http的编码和解码器
						pipeline.addLast(new HttpServerCodec());
						//是以块方式写的，添加ChunkedWriteHandler处理器
						//chunkedWriteHandler是处理大数据传输的，不会占用大内存或导致内存溢出问题，它会维护管理大文件传输过程中时复杂的状态
						pipeline.addLast(new ChunkedWriteHandler());
						/**
						 * 说明：
						 * 1. http数据在传输过程中是分段的，HttpObjectAggregator就是可以将多个段聚合起来
						 * 2. 这就是为什么，当浏览器发送大量数据时，就会发送多次http请求
						 */
						pipeline.addLast(new HttpObjectAggregator(10240));
						/**
						 * 说明：
						 * 1. 对应WebSocket，它的数据是以帧（frame）形式传递
						 * 2. 可以看到WebSocketFrame下面有六个子类
						 * 3. 浏览器请求时：ws://localhost:7000/hello 表示请求的uri
						 * 4. WebSocketServerProtocolHandler核心功能是将http协议升级为ws协议，保持长连接
						 */
						pipeline.addLast(new WebSocketServerProtocolHandler("/hello"));
						//自定义的handler，处理业务逻辑
						pipeline.addLast(new MyTextWebSocketFrameHandler());
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

**2、** MyTextWebSocketFrameHandler.java；

```java
package netty.websocket;
import java.time.LocalDateTime;
import io.netty.channel.ChannelHandlerContext;
import io.netty.channel.SimpleChannelInboundHandler;
import io.netty.handler.codec.http.websocketx.TextWebSocketFrame;
/**
 * 这里TextWebSocketFrame类型，表示一个文本帧（frame）
 * @author user
 *
 */
public class MyTextWebSocketFrameHandler extends SimpleChannelInboundHandler<TextWebSocketFrame>{
	@Override
	protected void channelRead0(ChannelHandlerContext ctx, TextWebSocketFrame msg) throws Exception {
		System.out.println("服务器端收到消息：" + msg.text());
		//回复浏览器
		ctx.channel().writeAndFlush(new TextWebSocketFrame("服务器时间：" + LocalDateTime.now() + " " + msg.text()));
	}
	//当web客户端连接后，触发方法
	@Override
	public void handlerAdded(ChannelHandlerContext ctx) throws Exception {
		//id表示唯一的值，LongText是唯一的，ShortText不是唯一的
		System.out.println("handlerAdded被调用" + ctx.channel().id().asLongText());
		System.out.println("handlerAdded被调用" + ctx.channel().id().asShortText());
	}
	@Override
	public void handlerRemoved(ChannelHandlerContext ctx) throws Exception {
		System.out.println("handlerRemoved被调用" + ctx.channel().id().asLongText());
	}
	@Override
	public void exceptionCaught(ChannelHandlerContext ctx, Throwable cause) throws Exception {
		System.out.println("异常发生 " + cause.getMessage());
		ctx.close(); //关闭通道连接
	}
}
```

## 三、客户端

**1、** hello.html；

```xml
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>hello</title>
<style>
</style>
</head>
<body>
	<form onsubmit="return false">
		<textarea name="message" style="height:300px; width: 300px"></textarea>
		<input type="button" value="发送消息" onclick="send(this.form.message.value)" />
		<textarea id="responseText" style="height:300px; width: 300px"></textarea>
		<input type="button" value="清空内容" onclick="document.getElementById('responseText').value=''">
	</form>
</body>
</html>
<script>
	//也可使用SockJS库
	var socket;
	//判断当前浏览器是否支持WebSocket
	if(window.WebSocket) {
		//go on
		socket = new WebSocket("ws://localhost:7000/hello");
		//相当于channelRead0，event收到服务器端回送的消息
		socket.onmessage = function(event) {
			var rt = document.getElementById('responseText');
			rt.value = rt.value + "\n" + event.data;
		}
		//相当于连接开启(感知到连接开启)
		socket.onopen = function(event) {
			var rt = document.getElementById('responseText');
			rt.value = "连接开启了...";
		}
		//连接关闭(感知到连接关闭)
		socket.onclose = function(event) {
			var rt = document.getElementById('responseText');
			rt.value = rt.value + "\n" + "连接关闭了...";
		}
	} else {
		alert("当前浏览器不支持WebSocket编程");
	}
	//发送消息到服务器
	function send(message) {
		if(!window.socket){ //判断socket是否创建好
			return;
		}
		if(socket.readyState == WebSocket.OPEN) {
			//通过socket发送消息
			socket.send(message);
		} else {
			alert("连接未开启...");
		}
	}
</script>
```

## 四、测试

**1、** 启动服务端；

**2、** 打开测试页面；

**3、** 发送数据；

**4、** 关闭测试页面；

```java
14:40:27.359 [main] DEBUG io.netty.util.internal.logging.InternalLoggerFactory - Using SLF4J as the default logging framework
14:40:27.366 [main] DEBUG io.netty.channel.MultithreadEventLoopGroup - -Dio.netty.eventLoopThreads: 16
14:40:27.392 [main] DEBUG io.netty.util.internal.InternalThreadLocalMap - -Dio.netty.threadLocalMap.stringBuilder.initialSize: 1024
14:40:27.392 [main] DEBUG io.netty.util.internal.InternalThreadLocalMap - -Dio.netty.threadLocalMap.stringBuilder.maxSize: 4096
14:40:27.405 [main] DEBUG io.netty.channel.nio.NioEventLoop - -Dio.netty.noKeySetOptimization: false
14:40:27.405 [main] DEBUG io.netty.channel.nio.NioEventLoop - -Dio.netty.selectorAutoRebuildThreshold: 512
14:40:27.428 [main] DEBUG io.netty.util.internal.PlatformDependent - Platform: Windows
14:40:27.431 [main] DEBUG io.netty.util.internal.PlatformDependent0 - -Dio.netty.noUnsafe: false
14:40:27.432 [main] DEBUG io.netty.util.internal.PlatformDependent0 - Java version: 8
14:40:27.434 [main] DEBUG io.netty.util.internal.PlatformDependent0 - sun.misc.Unsafe.theUnsafe: available
14:40:27.435 [main] DEBUG io.netty.util.internal.PlatformDependent0 - sun.misc.Unsafe.copyMemory: available
14:40:27.436 [main] DEBUG io.netty.util.internal.PlatformDependent0 - java.nio.Buffer.address: available
14:40:27.436 [main] DEBUG io.netty.util.internal.PlatformDependent0 - direct buffer constructor: available
14:40:27.438 [main] DEBUG io.netty.util.internal.PlatformDependent0 - java.nio.Bits.unaligned: available, true
14:40:27.438 [main] DEBUG io.netty.util.internal.PlatformDependent0 - jdk.internal.misc.Unsafe.allocateUninitializedArray(int): unavailable prior to Java9
14:40:27.438 [main] DEBUG io.netty.util.internal.PlatformDependent0 - java.nio.DirectByteBuffer.<init>(long, int): available
14:40:27.438 [main] DEBUG io.netty.util.internal.PlatformDependent - sun.misc.Unsafe: available
14:40:27.439 [main] DEBUG io.netty.util.internal.PlatformDependent - -Dio.netty.tmpdir: C:\Users\sjcui\AppData\Local\Temp (java.io.tmpdir)
14:40:27.439 [main] DEBUG io.netty.util.internal.PlatformDependent - -Dio.netty.bitMode: 64 (sun.arch.data.model)
14:40:27.442 [main] DEBUG io.netty.util.internal.PlatformDependent - -Dio.netty.maxDirectMemory: 3767533568 bytes
14:40:27.442 [main] DEBUG io.netty.util.internal.PlatformDependent - -Dio.netty.uninitializedArrayAllocationThreshold: -1
14:40:27.444 [main] DEBUG io.netty.util.internal.CleanerJava6 - java.nio.ByteBuffer.cleaner(): available
14:40:27.444 [main] DEBUG io.netty.util.internal.PlatformDependent - -Dio.netty.noPreferDirect: false
14:40:27.463 [main] DEBUG io.netty.util.internal.PlatformDependent - org.jctools-core.MpscChunkedArrayQueue: available
14:40:27.922 [main] DEBUG io.netty.channel.DefaultChannelId - -Dio.netty.processId: 14316 (auto-detected)
14:40:27.924 [main] DEBUG io.netty.util.NetUtil - -Djava.net.preferIPv4Stack: false
14:40:27.924 [main] DEBUG io.netty.util.NetUtil - -Djava.net.preferIPv6Addresses: false
14:40:28.292 [main] DEBUG io.netty.util.NetUtil - Loopback interface: lo (Software Loopback Interface 1, 127.0.0.1)
14:40:28.293 [main] DEBUG io.netty.util.NetUtil - Failed to get SOMAXCONN from sysctl and file \proc\sys\net\core\somaxconn. Default: 200
14:40:28.695 [main] DEBUG io.netty.channel.DefaultChannelId - -Dio.netty.machineId: 00:50:56:ff:fe:c0:00:01 (auto-detected)
14:40:28.709 [main] DEBUG io.netty.util.ResourceLeakDetector - -Dio.netty.leakDetection.level: simple
14:40:28.709 [main] DEBUG io.netty.util.ResourceLeakDetector - -Dio.netty.leakDetection.targetRecords: 4
14:40:28.742 [main] DEBUG io.netty.buffer.PooledByteBufAllocator - -Dio.netty.allocator.numHeapArenas: 16
14:40:28.742 [main] DEBUG io.netty.buffer.PooledByteBufAllocator - -Dio.netty.allocator.numDirectArenas: 16
14:40:28.742 [main] DEBUG io.netty.buffer.PooledByteBufAllocator - -Dio.netty.allocator.pageSize: 8192
14:40:28.742 [main] DEBUG io.netty.buffer.PooledByteBufAllocator - -Dio.netty.allocator.maxOrder: 11
14:40:28.743 [main] DEBUG io.netty.buffer.PooledByteBufAllocator - -Dio.netty.allocator.chunkSize: 16777216
14:40:28.743 [main] DEBUG io.netty.buffer.PooledByteBufAllocator - -Dio.netty.allocator.tinyCacheSize: 512
14:40:28.743 [main] DEBUG io.netty.buffer.PooledByteBufAllocator - -Dio.netty.allocator.smallCacheSize: 256
14:40:28.743 [main] DEBUG io.netty.buffer.PooledByteBufAllocator - -Dio.netty.allocator.normalCacheSize: 64
14:40:28.743 [main] DEBUG io.netty.buffer.PooledByteBufAllocator - -Dio.netty.allocator.maxCachedBufferCapacity: 32768
14:40:28.743 [main] DEBUG io.netty.buffer.PooledByteBufAllocator - -Dio.netty.allocator.cacheTrimInterval: 8192
14:40:28.744 [main] DEBUG io.netty.buffer.PooledByteBufAllocator - -Dio.netty.allocator.cacheTrimIntervalMillis: 0
14:40:28.744 [main] DEBUG io.netty.buffer.PooledByteBufAllocator - -Dio.netty.allocator.useCacheForAllThreads: true
14:40:28.744 [main] DEBUG io.netty.buffer.PooledByteBufAllocator - -Dio.netty.allocator.maxCachedByteBuffersPerChunk: 1023
14:40:28.755 [main] DEBUG io.netty.buffer.ByteBufUtil - -Dio.netty.allocator.type: pooled
14:40:28.756 [main] DEBUG io.netty.buffer.ByteBufUtil - -Dio.netty.threadLocalDirectBufferSize: 0
14:40:28.756 [main] DEBUG io.netty.buffer.ByteBufUtil - -Dio.netty.maxThreadLocalCharBufferSize: 16384
14:40:28.788 [nioEventLoopGroup-2-1] INFO io.netty.handler.logging.LoggingHandler - [id: 0x4552488b] REGISTERED
14:40:28.790 [nioEventLoopGroup-2-1] INFO io.netty.handler.logging.LoggingHandler - [id: 0x4552488b] BIND: 0.0.0.0/0.0.0.0:7000
14:40:28.795 [nioEventLoopGroup-2-1] INFO io.netty.handler.logging.LoggingHandler - [id: 0x4552488b, L:/0:0:0:0:0:0:0:0:7000] ACTIVE
14:40:33.520 [nioEventLoopGroup-2-1] INFO io.netty.handler.logging.LoggingHandler - [id: 0x4552488b, L:/0:0:0:0:0:0:0:0:7000] READ: [id: 0x625a8961, L:/0:0:0:0:0:0:0:1:7000 - R:/0:0:0:0:0:0:0:1:53593]
14:40:33.522 [nioEventLoopGroup-2-1] INFO io.netty.handler.logging.LoggingHandler - [id: 0x4552488b, L:/0:0:0:0:0:0:0:0:7000] READ COMPLETE
14:40:33.554 [nioEventLoopGroup-3-1] DEBUG io.netty.buffer.AbstractByteBuf - -Dio.netty.buffer.checkAccessible: true
14:40:33.554 [nioEventLoopGroup-3-1] DEBUG io.netty.buffer.AbstractByteBuf - -Dio.netty.buffer.checkBounds: true
14:40:33.558 [nioEventLoopGroup-3-1] DEBUG io.netty.util.ResourceLeakDetectorFactory - Loaded default ResourceLeakDetector: io.netty.util.ResourceLeakDetector@20f9f5d4
handlerAdded被调用005056fffec00001-000037ec-00000001-371268f177830cec-625a8961
handlerAdded被调用625a8961
14:40:33.626 [nioEventLoopGroup-3-1] DEBUG io.netty.util.Recycler - -Dio.netty.recycler.maxCapacityPerThread: 4096
14:40:33.626 [nioEventLoopGroup-3-1] DEBUG io.netty.util.Recycler - -Dio.netty.recycler.maxSharedCapacityFactor: 2
14:40:33.626 [nioEventLoopGroup-3-1] DEBUG io.netty.util.Recycler - -Dio.netty.recycler.linkCapacity: 16
14:40:33.626 [nioEventLoopGroup-3-1] DEBUG io.netty.util.Recycler - -Dio.netty.recycler.ratio: 8
14:40:33.666 [nioEventLoopGroup-3-1] DEBUG io.netty.handler.codec.http.websocketx.WebSocketServerHandshaker - [id: 0x625a8961, L:/0:0:0:0:0:0:0:1:7000 - R:/0:0:0:0:0:0:0:1:53593] WebSocket version V13 server handshake
14:40:33.669 [nioEventLoopGroup-3-1] DEBUG io.netty.handler.codec.http.websocketx.WebSocketServerHandshaker - WebSocket version 13 server handshake key: r7/aFvcPnHHmSbIV9YikkQ==, response: ZFKKX75rdh34EPuWz+qzZqXX3PQ=
服务器端收到消息：你好吗
服务器端收到消息：冬天冷，吃火锅
handlerRemoved被调用005056fffec00001-000037ec-00000001-371268f177830cec-625a8961
```

## 五、要点

**1、** HttpObjectAggregator；

说明：
1）http数据在传输过程中是分段的，HttpObjectAggregator就是可以将多个段聚合起来

2）这就是为什么，当浏览器发送大量数据时，就会发送多次http请求

**2、** WebSocketServerProtocolHandler；

说明：
1）对应WebSocket，它的数据是以帧（frame）形式传递

2）可以看到WebSocketFrame下面有六个子类

3）浏览器请求时：ws://localhost:7000/hello 表示请求的uri

4）WebSocketServerProtocolHandler核心功能是将http协议升级为ws协议，保持长连接

5）是通过一个状态码101来切换的
