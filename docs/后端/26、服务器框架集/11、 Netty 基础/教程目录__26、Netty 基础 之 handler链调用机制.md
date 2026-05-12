# 26、Netty 基础 之 handler链调用机制
- 来源：https://ddkk.com/zhuanlan/server/netty/4/26.html
- 分类：服务器框架
- 分组：教程目录
## 一、netty的handler的调用机制

**1、** 使用自定义的编码器和解码器来说明netty的handler调用机制；

客户端发送long -> 服务器

服务端发送long -> 客户端

**2、** 案例；

## 二、客户端发送给服务端

**1、** 服务端；

NettyServer.java

```java
package netty.inboundhandlerAndOutboundhandler;
import io.netty.bootstrap.ServerBootstrap;
import io.netty.channel.ChannelFuture;
import io.netty.channel.EventLoopGroup;
import io.netty.channel.nio.NioEventLoopGroup;
import io.netty.channel.socket.nio.NioServerSocketChannel;
public class NettyServer {
	public static void main(String[] args) {
		EventLoopGroup bossGroup = new NioEventLoopGroup(1);
		EventLoopGroup workerGroup = new NioEventLoopGroup(8);
		try {
			ServerBootstrap bootstrap = new ServerBootstrap();
			bootstrap.group(bossGroup, workerGroup)
				.channel(NioServerSocketChannel.class)
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
package netty.inboundhandlerAndOutboundhandler;
import io.netty.channel.ChannelInitializer;
import io.netty.channel.ChannelPipeline;
import io.netty.channel.socket.SocketChannel;
public class NettyServerInitializer extends ChannelInitializer<SocketChannel> {
	@Override
	protected void initChannel(SocketChannel ch) throws Exception {
		ChannelPipeline pipeline = ch.pipeline();
		//入站的handler进行解码 MyByteToLongDecoder
		pipeline.addLast(new MyByteToLongDecoder());
		pipeline.addLast(new NettyChannelHandler());
	}
}
```

MyByteToLongDecoder.java

```java
package netty.inboundhandlerAndOutboundhandler;
import java.util.List;
import io.netty.buffer.ByteBuf;
import io.netty.channel.ChannelHandlerContext;
import io.netty.handler.codec.ByteToMessageDecoder;
public class MyByteToLongDecoder extends ByteToMessageDecoder {
	/**
	 * decode方法：会根据接收的数据，被调用多次，直到确定没有新的元素被添加到List
	 * ，或者是ByteBuf没有更多的可读字节为止
	 * 如果List out不为空，就会将List的内容传递给下一个channelInboundHandler处理
	 * 
	 * ctx 上下文对象
	 * in 入站的ByteBuf
	 * out List集合，将解码后的数据传给下一个handler（解析出一个Long就像下一个handler传递处理了）
	 */
	@Override
	protected void decode(ChannelHandlerContext ctx, ByteBuf in, List<Object> out) throws Exception {
		System.out.println("MyByteToLongDecoder decode 被调用");
		//因为long占8个字节，需要判断有8个字节，才能读取一个long
		if (in.readableBytes() >= 8) {
			//两端约定好协议 比如是一次读8 就把数据对齐到8的倍数
			//不够8的倍数就填充补齐 然后传过去的信息带有总共大小 和填充数据大小就行了
			out.add(in.readLong());
		}
	}
}
```

NettyChannelHandler.java

```java
package netty.inboundhandlerAndOutboundhandler;
import io.netty.channel.ChannelHandlerContext;
import io.netty.channel.SimpleChannelInboundHandler;
public class NettyChannelHandler extends SimpleChannelInboundHandler<Long> {
	@Override
	protected void channelRead0(ChannelHandlerContext ctx, Long msg) throws Exception {
		System.out.println("从客户端" + ctx.channel().remoteAddress() + "读取到long " + msg);
	}
	@Override
	public void exceptionCaught(ChannelHandlerContext ctx, Throwable cause) throws Exception {
		ctx.channel().close();
	}
}
```

**2、** 客户端；

NettyClient.java

```java
package netty.inboundhandlerAndOutboundhandler;
import io.netty.bootstrap.Bootstrap;
import io.netty.channel.ChannelFuture;
import io.netty.channel.EventLoopGroup;
import io.netty.channel.nio.NioEventLoopGroup;
import io.netty.channel.socket.nio.NioSocketChannel;
public class NettyClient {
	public static void main(String[] args) {
		EventLoopGroup group = new NioEventLoopGroup();
		try {
			Bootstrap bootstrap = new Bootstrap();
			bootstrap.group(group) //设置线程组
				.channel(NioSocketChannel.class)
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
package netty.inboundhandlerAndOutboundhandler;
import io.netty.channel.ChannelInitializer;
import io.netty.channel.ChannelPipeline;
import io.netty.channel.socket.SocketChannel;
public class NettyClientInitializer extends ChannelInitializer<SocketChannel> {
	/**
	 * 出站的handler从后往前调用，因为你pipeline是用addLast加在最后，入站是从前往后，出站就是从后往前
	 */
	@Override
	protected void initChannel(SocketChannel ch) throws Exception {
		ChannelPipeline pipeline = ch.pipeline();
		//加入一个出站的handler，对数据进行一个编码
		pipeline.addLast(new MyLongToByteEncoder());
		//加入一个自定义的handler，处理业务逻辑
		pipeline.addLast(new NettyClientHandler());
	}
}
```

MyLongToByteEncoder.java

```java
package netty.inboundhandlerAndOutboundhandler;
import io.netty.buffer.ByteBuf;
import io.netty.channel.ChannelHandlerContext;
import io.netty.handler.codec.MessageToByteEncoder;
public class MyLongToByteEncoder extends MessageToByteEncoder<Long> {
	/**
	 * 编码的方法
	 */
	@Override
	protected void encode(ChannelHandlerContext ctx, Long msg, ByteBuf out) throws Exception {
		System.out.println("MyLongToByteEncoder encode 被调用");
		System.out.println("msg=" + msg);
		out.writeLong(msg);
	}
}
```

NettyClientHandler.java

```java
package netty.inboundhandlerAndOutboundhandler;
import io.netty.buffer.Unpooled;
import io.netty.channel.ChannelHandlerContext;
import io.netty.channel.SimpleChannelInboundHandler;
import io.netty.util.CharsetUtil;
import io.netty.util.ReferenceCountUtil;
public class NettyClientHandler extends SimpleChannelInboundHandler<Long> {
	@Override
	protected void channelRead0(ChannelHandlerContext ctx, Long msg) throws Exception {
	}
	//重写channelActive 发送数据
	@Override
	public void channelActive(ChannelHandlerContext ctx) throws Exception {
		System.out.println("NettyClientHandler 发送数据");
		ctx.writeAndFlush(123456L); //发送的是一个long
		//如果这里传字符串
		//ctx.writeAndFlush(Unpooled.copiedBuffer("abcdabcdabcdabcd", CharsetUtil.UTF_8));
		//分析
		//1. "abcdabcdabcdabcd"是16个字节
		//2. 该处理器的前一个handler 是 MyLongToByteEncoder
		//3. MyLongToByteEncoder 父类是 MessageToByteEncoder
		//4. 父类有一个write方法，会判断msg的类型是不是自己要处理的，如果不是就写出去
		//5. 因此我们编写Encoder时要注意，传入的数据类型和处理的数据类型一致
		/*
		   try {
            if (acceptOutboundMessage(msg)) {
                @SuppressWarnings("unchecked")
                I cast = (I) msg;
                buf = allocateBuffer(ctx, cast, preferDirect);
                try {
                    encode(ctx, cast, buf);
                } finally {
                    ReferenceCountUtil.release(cast);
                }
                if (buf.isReadable()) {
                    ctx.write(buf, promise);
                } else {
                    buf.release();
                    ctx.write(Unpooled.EMPTY_BUFFER, promise);
                }
                buf = null;
            } else {
                ctx.write(msg, promise);
            }
		 */
	}
}
```

## 三、执行结果

**1、** 服务端；

```java
MyByteToLongDecoder decode 被调用
从客户端/127.0.0.1:62579读取到long 123456
```

**2、** 客户端；

```java
NettyClientHandler 发送数据
MyLongToByteEncoder encode 被调用
msg=123456
```

## 四、服务端发送给客户端

客户端增加一个Decoder，服务端增加一个Encoder。

**1、** 修改服务端代码；

NettyChannelHandler.java

添加给客户端回送信息

```java
package netty.inboundhandlerAndOutboundhandler;
import io.netty.channel.ChannelHandlerContext;
import io.netty.channel.SimpleChannelInboundHandler;
public class NettyChannelHandler extends SimpleChannelInboundHandler<Long> {
	@Override
	protected void channelRead0(ChannelHandlerContext ctx, Long msg) throws Exception {
		System.out.println("从客户端" + ctx.channel().remoteAddress() + "读取到long " + msg);
		//给客户端回送一个Long
		ctx.writeAndFlush(98765L); //writeAndFlush是ChannelOutboundInvoker的方法
	}
	@Override
	public void exceptionCaught(ChannelHandlerContext ctx, Throwable cause) throws Exception {
		ctx.channel().close();
	}
}
```

NettyServerInitializer.java

增加返回编码器

```java
package netty.inboundhandlerAndOutboundhandler;
import io.netty.channel.ChannelInitializer;
import io.netty.channel.ChannelPipeline;
import io.netty.channel.socket.SocketChannel;
public class NettyServerInitializer extends ChannelInitializer<SocketChannel> {
	@Override
	protected void initChannel(SocketChannel ch) throws Exception {
		ChannelPipeline pipeline = ch.pipeline();
		//入站的handler进行解码 MyByteToLongDecoder
		pipeline.addLast(new MyByteToLongDecoder());
		//增加返回编码器
		pipeline.addLast(new MyLongToByteEncoder());
		//编码解码位置颠倒无所谓，但必须在handler上面
		pipeline.addLast(new NettyChannelHandler());
	}
}
```

**2、** 修改客户端代码；

NettyClientHandler.java

添加接收服务端信息channelRead0接口

```java
package netty.inboundhandlerAndOutboundhandler;
import io.netty.buffer.Unpooled;
import io.netty.channel.ChannelHandlerContext;
import io.netty.channel.SimpleChannelInboundHandler;
import io.netty.util.CharsetUtil;
import io.netty.util.ReferenceCountUtil;
public class NettyClientHandler extends SimpleChannelInboundHandler<Long> {
	@Override
	protected void channelRead0(ChannelHandlerContext ctx, Long msg) throws Exception {
		System.out.println("服务器的ip=" + ctx.channel().remoteAddress());
		System.out.println("收到服务器消息=" + msg);
	}
	//重写channelActive 发送数据
	@Override
	public void channelActive(ChannelHandlerContext ctx) throws Exception {
		System.out.println("NettyClientHandler 发送数据");
		ctx.writeAndFlush(123456L); //发送的是一个long
		//如果这里传字符串
		//ctx.writeAndFlush(Unpooled.copiedBuffer("abcdabcdabcdabcd", CharsetUtil.UTF_8));
		//分析
		//1. "abcdabcdabcdabcd"是16个字节
		//2. 该处理器的前一个handler 是 MyLongToByteEncoder
		//3. MyLongToByteEncoder 父类是 MessageToByteEncoder
		//4. 父类有一个write方法，会判断msg的类型是不是自己要处理的，如果不是就写出去
		//5. 因此我们编写Encoder时要注意，传入的数据类型和处理的数据类型一致
		/*
		   try {
            if (acceptOutboundMessage(msg)) {
                @SuppressWarnings("unchecked")
                I cast = (I) msg;
                buf = allocateBuffer(ctx, cast, preferDirect);
                try {
                    encode(ctx, cast, buf);
                } finally {
                    ReferenceCountUtil.release(cast);
                }
                if (buf.isReadable()) {
                    ctx.write(buf, promise);
                } else {
                    buf.release();
                    ctx.write(Unpooled.EMPTY_BUFFER, promise);
                }
                buf = null;
            } else {
                ctx.write(msg, promise);
            }
		 */
	}
}
```

NettyClientInitializer.java

增加一个入站的解码器

```java
package netty.inboundhandlerAndOutboundhandler;
import io.netty.channel.ChannelInitializer;
import io.netty.channel.ChannelPipeline;
import io.netty.channel.socket.SocketChannel;
public class NettyClientInitializer extends ChannelInitializer<SocketChannel> {
	/**
	 * 出站的handler从后往前调用，因为你pipeline是用addLast加在最后，入站是从前往后，出站就是从后往前
	 */
	@Override
	protected void initChannel(SocketChannel ch) throws Exception {
		ChannelPipeline pipeline = ch.pipeline();
		//加入一个出站的handler，对数据进行一个编码
		pipeline.addLast(new MyLongToByteEncoder());
		//增加一个入站的解码器
		pipeline.addLast(new MyByteToLongDecoder());
		//加入一个自定义的handler，处理业务逻辑
		pipeline.addLast(new NettyClientHandler());
	}
}
```

## 五、执行结果

**1、** 服务端；

```java
MyByteToLongDecoder decode 被调用
从客户端/127.0.0.1:64909读取到long 123456
MyLongToByteEncoder encode 被调用
msg=98765
```

**2、** 客户端；

```java
NettyClientHandler 发送数据
MyLongToByteEncoder encode 被调用
msg=123456
MyByteToLongDecoder decode 被调用
服务器的ip=/127.0.0.1:7000
收到服务器消息=98765
```

## 六、ChannelPipeline类中的图

```java
 * <pre>
 *                                                 I/O Request
 *                                            via {@link Channel} or
 *                                        {@link ChannelHandlerContext}
 *                                                      |
 *  +---------------------------------------------------+---------------+
 *  |                           ChannelPipeline         |               |
 *  |                                                  \|/              |
 *  |    +---------------------+            +-----------+----------+    |
 *  |    | Inbound Handler  N  |            | Outbound Handler  1  |    |
 *  |    +----------+----------+            +-----------+----------+    |
 *  |              /|\                                  |               |
 *  |               |                                  \|/              |
 *  |    +----------+----------+            +-----------+----------+    |
 *  |    | Inbound Handler N-1 |            | Outbound Handler  2  |    |
 *  |    +----------+----------+            +-----------+----------+    |
 *  |              /|\                                  .               |
 *  |               .                                   .               |
 *  | ChannelHandlerContext.fireIN_EVT() ChannelHandlerContext.OUT_EVT()|
 *  |        [ method call]                       [method call]         |
 *  |               .                                   .               |
 *  |               .                                  \|/              |
 *  |    +----------+----------+            +-----------+----------+    |
 *  |    | Inbound Handler  2  |            | Outbound Handler M-1 |    |
 *  |    +----------+----------+            +-----------+----------+    |
 *  |              /|\                                  |               |
 *  |               |                                  \|/              |
 *  |    +----------+----------+            +-----------+----------+    |
 *  |    | Inbound Handler  1  |            | Outbound Handler  M  |    |
 *  |    +----------+----------+            +-----------+----------+    |
 *  |              /|\                                  |               |
 *  +---------------+-----------------------------------+---------------+
 *                  |                                  \|/
 *  +---------------+-----------------------------------+---------------+
 *  |               |                                   |               |
 *  |       [ Socket.read() ]                    [ Socket.write() ]     |
 *  |                                                                   |
 *  |  Netty Internal I/O Threads (Transport Implementation)            |
 *  +-------------------------------------------------------------------+
 * </pre>
```

## 七、结论

**1、** 不论解码器handler还是编码器handler，即接收的消息类型必须与待处理的消息类型一致，否则该handler不会被执行；

**2、** 在解码器进行数据解码时，需要判断缓存区（ByteBuf）的数据是否足够，否则接收到的结果和期望结果可能不一致；
