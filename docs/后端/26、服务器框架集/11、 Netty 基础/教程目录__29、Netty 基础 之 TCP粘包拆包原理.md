# 29、Netty 基础 之 TCP粘包拆包原理
- 来源：https://ddkk.com/zhuanlan/server/netty/4/29.html
- 分类：服务器框架
- 分组：教程目录
## 一、基本介绍

**1、** TCP是面向连接的，面向流的，提供高可靠性服务收发两端（客户端和服务器端）都要有一一成对的socket，因此，发送端为了将多个发给接收端的包，更有效的发给对方，使用了优化方法（Nagle算法），将多次间隔较小且数据量小的数据，合并成一个大的数据块，然后进行封包这样做虽然提高了效率，但是接收端就难于分辨出完整的数据包了，因为面向流的通信是无消息保护边界的；

**2、** 由于TCP无消息保护边界，需要在接收端处理消息边界问题，也就是我们所说的粘包、拆包问题；

**3、** TCP粘包、拆包图解；

假设客户端分别发送了两个数据包D1和D2给服务端，由于服务端一次读取到字节数是不确定的，故可能存在以下四种情况。

1、服务端分两次读取到了两个独立的数据包，分别是D1和D2，没有粘包和拆包。

2、服务端一次接收到了两个数据包，D1和D2粘合在一起，称之为TCP粘包。

3、服务端分两次读取到了数据包，第一次读取到了完整的D1包和D2包的部分内容，第二次读取到了D2包的剩余内容，这称之为TCP拆包。

4、服务端分两次读取到了数据包，第一次读取到了D1包的部分内容，第二次读取到了D1包的剩余部分内容和完整的D2包。

## 二、TCP粘包和拆包现象实例

**1、** 在编写netty程序时，如果没有做处理，就会发生粘包和拆包的问题；

**2、** 服务端；

NettyServer.java

```java
package netty.tcpStickPackage;
import io.netty.bootstrap.ServerBootstrap;
import io.netty.channel.ChannelFuture;
import io.netty.channel.EventLoopGroup;
import io.netty.channel.nio.NioEventLoopGroup;
import io.netty.channel.socket.nio.NioServerSocketChannel;
import io.netty.handler.logging.LogLevel;
import io.netty.handler.logging.LoggingHandler;
public class NettyServer {
	public static void main(String[] args) {
		EventLoopGroup bossGroup = new NioEventLoopGroup(1);
		EventLoopGroup workerGroup = new NioEventLoopGroup(8);
		try {
			ServerBootstrap bootstrap = new ServerBootstrap();
			bootstrap.group(bossGroup, workerGroup)
				.channel(NioServerSocketChannel.class)
				.handler(new LoggingHandler(LogLevel.DEBUG))
				.childHandler(new NettyServerInitializer()); //自定义一个初始化类
			ChannelFuture cf = bootstrap.bind(7000).sync();
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

NettyServerInitializer.java

```java
package netty.tcpStickPackage;
import io.netty.channel.ChannelInitializer;
import io.netty.channel.ChannelPipeline;
import io.netty.channel.socket.SocketChannel;
public class NettyServerInitializer extends ChannelInitializer<SocketChannel> {
	@Override
	protected void initChannel(SocketChannel ch) throws Exception {
		ChannelPipeline pipeline = ch.pipeline();
		//加入一个自定义handler
		pipeline.addLast(new NettyChannelHandler());
	}
}
```

NettyChannelHandler.java

```java
package netty.tcpStickPackage;
import java.util.UUID;
import io.netty.buffer.ByteBuf;
import io.netty.buffer.Unpooled;
import io.netty.channel.ChannelHandlerContext;
import io.netty.channel.SimpleChannelInboundHandler;
import io.netty.util.CharsetUtil;
public class NettyChannelHandler extends SimpleChannelInboundHandler<ByteBuf> {
	private int count;
	@Override
	protected void channelRead0(ChannelHandlerContext ctx, ByteBuf msg) throws Exception {
		//把msg转成byte数组
		byte[] buffer = new byte[msg.readableBytes()];
		msg.readBytes(buffer);
		//将buffer转成字符串
		String message = new String(buffer, CharsetUtil.UTF_8);
		System.out.println("服务器接收到的数据：" + message);
		System.out.println("服务器接收到消息条数：" + (++this.count));
		//服务器回送数据给客户端，回送一个随机id值
		ByteBuf response = Unpooled.copiedBuffer(UUID.randomUUID().toString(), CharsetUtil.UTF_8);
		ctx.writeAndFlush(response);
	}
	@Override
	public void exceptionCaught(ChannelHandlerContext ctx, Throwable cause) throws Exception {
		cause.printStackTrace();
		ctx.channel().close();
	}
}
```

**3、** 客户端；

NettyClient.java

```java
package netty.tcpStickPackage;
import io.netty.bootstrap.Bootstrap;
import io.netty.channel.ChannelFuture;
import io.netty.channel.EventLoopGroup;
import io.netty.channel.nio.NioEventLoopGroup;
import io.netty.channel.socket.nio.NioSocketChannel;
import io.netty.handler.logging.LogLevel;
import io.netty.handler.logging.LoggingHandler;
public class NettyClient {
	public static void main(String[] args) {
		EventLoopGroup group = new NioEventLoopGroup();
		try {
			Bootstrap bootstrap = new Bootstrap();
			bootstrap.group(group) //设置线程组
				.channel(NioSocketChannel.class)
				.handler(new LoggingHandler(LogLevel.DEBUG))
				.handler(new NettyClientInitializer()); //自定义一个初始化对象
			ChannelFuture cf = bootstrap.connect("127.0.0.1", 7000).sync();
			cf.channel().closeFuture().sync();
		} catch (Exception e) {
			e.printStackTrace();
		} finally {
			group.shutdownGracefully();
		}
	}
}
```

NettyClientInitializer.java

```java
package netty.tcpStickPackage;
import io.netty.channel.ChannelInitializer;
import io.netty.channel.ChannelPipeline;
import io.netty.channel.socket.SocketChannel;
public class NettyClientInitializer extends ChannelInitializer<SocketChannel> {
	@Override
	protected void initChannel(SocketChannel ch) throws Exception {
		ChannelPipeline pipeline = ch.pipeline();
		//加入一个自定义handler
		pipeline.addLast(new NettyClientHandler());
	}
}
```

NettyClientHandler.java

```java
package netty.tcpStickPackage;
import io.netty.buffer.ByteBuf;
import io.netty.buffer.Unpooled;
import io.netty.channel.ChannelHandlerContext;
import io.netty.channel.SimpleChannelInboundHandler;
import io.netty.util.CharsetUtil;
public class NettyClientHandler extends SimpleChannelInboundHandler<ByteBuf> {
	private int count;
	@Override
	protected void channelRead0(ChannelHandlerContext ctx, ByteBuf msg) throws Exception {
		//把msg转成byte数组
		byte[] buffer = new byte[msg.readableBytes()];
		msg.readBytes(buffer);
		String message = new String(buffer, CharsetUtil.UTF_8);
		System.out.println("客户端接收到的数据：" + message);
		System.out.println("客户端接收到消息条数：" + (++this.count));
	}
	@Override
	public void channelActive(ChannelHandlerContext ctx) throws Exception {
		//使用客户端发送10条数据，hello server
		for (int i=0; i<10; i++) {
			ByteBuf buffer = Unpooled.copiedBuffer("hello,server", CharsetUtil.UTF_8);
			ctx.writeAndFlush(buffer);
		}
	}
	@Override
	public void exceptionCaught(ChannelHandlerContext ctx, Throwable cause) throws Exception {
		cause.printStackTrace();
		ctx.channel().close();
	}
}
```

## 三、执行结果

**1、** 服务端；

开了3个客户端连接

```java
2023-01-20 11:10:25.276 [] DEBUG [nioEventLoopGroup-2-1] io.netty.handler.logging.LoggingHandler :[id: 0xfd34bd30, L:/0:0:0:0:0:0:0:0:7000] READ: [id: 0x1b9cbe10, L:/127.0.0.1:7000 - R:/127.0.0.1:50527]
2023-01-20 11:10:25.278 [] DEBUG [nioEventLoopGroup-2-1] io.netty.handler.logging.LoggingHandler :[id: 0xfd34bd30, L:/0:0:0:0:0:0:0:0:7000] READ COMPLETE
2023-01-20 11:10:25.311 [] DEBUG [nioEventLoopGroup-3-1] io.netty.util.Recycler :-Dio.netty.recycler.maxCapacityPerThread: 4096
2023-01-20 11:10:25.311 [] DEBUG [nioEventLoopGroup-3-1] io.netty.util.Recycler :-Dio.netty.recycler.maxSharedCapacityFactor: 2
2023-01-20 11:10:25.311 [] DEBUG [nioEventLoopGroup-3-1] io.netty.util.Recycler :-Dio.netty.recycler.linkCapacity: 16
2023-01-20 11:10:25.311 [] DEBUG [nioEventLoopGroup-3-1] io.netty.util.Recycler :-Dio.netty.recycler.ratio: 8
2023-01-20 11:10:25.320 [] DEBUG [nioEventLoopGroup-3-1] io.netty.buffer.AbstractByteBuf :-Dio.netty.buffer.checkAccessible: true
2023-01-20 11:10:25.320 [] DEBUG [nioEventLoopGroup-3-1] io.netty.buffer.AbstractByteBuf :-Dio.netty.buffer.checkBounds: true
2023-01-20 11:10:25.322 [] DEBUG [nioEventLoopGroup-3-1] io.netty.util.ResourceLeakDetectorFactory :Loaded default ResourceLeakDetector: io.netty.util.ResourceLeakDetector@51d26066
服务器接收到的数据：hello,serverhello,serverhello,serverhello,serverhello,serverhello,serverhello,serverhello,serverhello,serverhello,server
服务器接收到消息条数：1
2023-01-20 11:10:54.361 [] DEBUG [nioEventLoopGroup-2-1] io.netty.handler.logging.LoggingHandler :[id: 0xfd34bd30, L:/0:0:0:0:0:0:0:0:7000] READ: [id: 0xcc7620a4, L:/127.0.0.1:7000 - R:/127.0.0.1:50564]
2023-01-20 11:10:54.362 [] DEBUG [nioEventLoopGroup-2-1] io.netty.handler.logging.LoggingHandler :[id: 0xfd34bd30, L:/0:0:0:0:0:0:0:0:7000] READ COMPLETE
服务器接收到的数据：hello,server
服务器接收到消息条数：1
服务器接收到的数据：hello,serverhello,server
服务器接收到消息条数：2
服务器接收到的数据：hello,serverhello,serverhello,server
服务器接收到消息条数：3
服务器接收到的数据：hello,serverhello,serverhello,server
服务器接收到消息条数：4
服务器接收到的数据：hello,server
服务器接收到消息条数：5
2023-01-20 11:11:23.570 [] DEBUG [nioEventLoopGroup-2-1] io.netty.handler.logging.LoggingHandler :[id: 0xfd34bd30, L:/0:0:0:0:0:0:0:0:7000] READ: [id: 0x77e7bcfe, L:/127.0.0.1:7000 - R:/127.0.0.1:50597]
2023-01-20 11:11:23.571 [] DEBUG [nioEventLoopGroup-2-1] io.netty.handler.logging.LoggingHandler :[id: 0xfd34bd30, L:/0:0:0:0:0:0:0:0:7000] READ COMPLETE
服务器接收到的数据：hello,server
服务器接收到消息条数：1
服务器接收到的数据：hello,server
服务器接收到消息条数：2
服务器接收到的数据：hello,serverhello,serverhello,serverhello,server
服务器接收到消息条数：3
服务器接收到的数据：hello,serverhello,serverhello,server
服务器接收到消息条数：4
服务器接收到的数据：hello,server
服务器接收到消息条数：5
```

**2、** 客户端；

```java
客户端接收到的数据：0851c5de-99b6-4717-9603-763c0a53ba6c
客户端接收到消息条数：1
客户端接收到的数据：9f0533a8-fa6b-4002-864c-a4635a78bea8cc8b1396-24fb-4871-ba66-b82e9ffa7391086dfca2-04cf-4207-909d-06b246ec149d0f855148-0803-4cfc-8935-ada9479e7307ea3eac40-c0df-4f76-a5f3-0adc164c19d0
客户端接收到消息条数：1
客户端接收到的数据：036bcc0a-34ab-4add-b1cb-4b3c83c8148d7834d597-0a4e-4177-ad46-8ce796f05d952f92a65a-ba54-495a-a85e-0c043e9f37d176471a8f-1232-4867-8962-4faac90edf83cf120ed5-f850-4ab2-87ce-71342d31cecf
客户端接收到消息条数：1
```
